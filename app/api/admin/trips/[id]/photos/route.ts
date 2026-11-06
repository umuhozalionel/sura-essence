/**
 * POST /api/admin/trips/<id>/photos  { public_id, version, signature }
 *   → saves a photo the browser just sent to Cloudinary. Saved only when Cloudinary's
 *     signature is genuine, the file is in this trip's folder, and Cloudinary itself
 *     reports an allowed format and size. 422 "rejected_file" otherwise.
 * With target: "page" it answers { url } and joins nothing: a photo for Page content, saved with that form.
 * Writes clear the "cms:trips" cache, so the recap page shows it straight away.
 */
import { destroyImage, fetchTripPhoto, isCloudinaryConfigured, isGenuineUpload, tripPhotoFolder } from "@/lib/cloudinary";
import { addTripPhoto } from "@/lib/cms/trips-server";
import {
  CMS_TAGS, adminBody, adminGuard, adminJson, fail, invalidate, serverError, type RouteCtx,
} from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: true, perm: "trips:edit" });
  if (blocked) return blocked;
  if (!isCloudinaryConfigured()) return fail("storage_not_configured", 503);
  const { id } = await params;
  const body = await adminBody(req, 2 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  const { public_id, version, signature, target } = (body.value ?? {}) as { public_id?: unknown; version?: unknown; signature?: unknown; target?: unknown };
  if (typeof public_id !== "string" || typeof version !== "number" || typeof signature !== "string") return fail("invalid", 400);
  if (!public_id.startsWith(`${tripPhotoFolder(id)}/`) || !isGenuineUpload(public_id, version, signature)) return fail("rejected_file", 422);

  try {
    const file = await fetchTripPhoto(public_id);
    if (!file) {
      await destroyImage(public_id).catch(() => undefined);
      return fail("rejected_file", 422);
    }
    if (target === "page") return adminJson({ url: file.url }, 201);
    const item = await addTripPhoto(id, {
      id: public_id.slice(public_id.lastIndexOf("/") + 1),
      publicId: public_id,
      url: file.url,
      width: file.width,
      height: file.height,
    });
    if (!item) {
      await destroyImage(public_id).catch(() => undefined);
      return fail("not_found", 404);
    }
    invalidate(CMS_TAGS.trips);
    return adminJson({ item }, 201);
  } catch (err) {
    return serverError("save trip photo", err);
  }
}
