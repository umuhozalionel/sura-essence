/**
 * POST   /api/admin/profile/files/<avatar|cv>  { public_id, version, signature }
 *          → saves an upload the browser just made to Cloudinary. Saved only when
 *            Cloudinary's signature is genuine, the file is this person's own
 *            (sura-admin/<own id>/<kind>), and Cloudinary itself reports an allowed
 *            format and size. 422 "rejected_file" otherwise.
 * DELETE /api/admin/profile/files/<avatar|cv>  → removes the photo or CV (on Cloudinary too).
 * Needs profile:edit and a real account.
 */
import { adminBody, adminJson, fail, ownAccountGuard, serverError } from "@/lib/cms/server";
import { fetchUploaded, isCloudinaryConfigured, isGenuineUpload, publicIdFor, type UploadKind } from "@/lib/cloudinary";
import { clearOwnFile, setOwnFile } from "@/lib/admin-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ kind: string }> };
const asKind = (k: string): UploadKind | null => (k === "avatar" || k === "cv" ? k : null);

export async function POST(req: Request, { params }: Ctx) {
  const access = await ownAccountGuard(req, { write: true });
  if (access.blocked) return access.blocked;
  const kind = asKind((await params).kind);
  if (!kind) return fail("not_found", 404);
  if (!isCloudinaryConfigured()) return fail("storage_not_configured", 503);
  const { userId } = access.session;

  const body = await adminBody(req, 2 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  const { public_id, version, signature } = (body.value ?? {}) as { public_id?: unknown; version?: unknown; signature?: unknown };
  if (
    public_id !== publicIdFor(userId, kind) ||
    typeof version !== "number" ||
    typeof signature !== "string" ||
    !isGenuineUpload(public_id, version, signature)
  ) {
    return fail("rejected_file", 422);
  }

  try {
    const file = await fetchUploaded(userId, kind);
    if (!file || file.version !== version) return fail("rejected_file", 422);
    const item = await setOwnFile(userId, kind, file);
    return item ? adminJson({ item }) : fail("not_found", 404);
  } catch (err) {
    return serverError(`save own ${kind}`, err);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const access = await ownAccountGuard(req, { write: true });
  if (access.blocked) return access.blocked;
  const kind = asKind((await params).kind);
  if (!kind) return fail("not_found", 404);
  try {
    const item = await clearOwnFile(access.session.userId, kind);
    return item ? adminJson({ item }) : fail("not_found", 404);
  } catch (err) {
    return serverError(`remove own ${kind}`, err);
  }
}
