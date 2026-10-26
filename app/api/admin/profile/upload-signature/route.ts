/**
 * POST /api/admin/profile/upload-signature  { kind: "avatar" | "cv" }
 *   → { url, fields, maxBytes }: the browser posts the file plus `fields` to `url`
 *     (straight to Cloudinary), then sends Cloudinary's reply to
 *     POST /api/admin/profile/files/<kind>.
 * The file always lands at sura-admin/<own account id>/<kind> (lib/cloudinary.ts).
 * 503 "storage_not_configured" while the CLOUDINARY_* variables are missing.
 * Needs profile:edit and a real account.
 */
import { adminBody, adminJson, fail, ownAccountGuard } from "@/lib/cms/server";
import { isCloudinaryConfigured, uploadSignature, type UploadKind } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const access = await ownAccountGuard(req, { write: true });
  if (access.blocked) return access.blocked;
  if (!isCloudinaryConfigured()) return fail("storage_not_configured", 503);
  const body = await adminBody(req, 1024);
  if (!body.ok) return fail(body.error, body.status);
  const kind = (body.value as { kind?: unknown } | null)?.kind;
  if (kind !== "avatar" && kind !== "cv") return fail("invalid_kind", 400);
  return adminJson(uploadSignature(access.session.userId, kind as UploadKind));
}
