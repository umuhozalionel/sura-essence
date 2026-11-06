/**
 * PUT    /api/admin/trips/<id>  full form body → save changes (the slug stays as it is)
 * DELETE /api/admin/trips/<id>                 → remove for good, recap photos on Cloudinary too
 * Writes clear the "cms:trips" cache.
 */
import { destroyImage } from "@/lib/cloudinary";
import { TRIP_LIMITS } from "@/lib/cms/trips";
import { deleteTrip, parseTrip, updateTrip } from "@/lib/cms/trips-server";
import {
  CMS_TAGS, adminBody, adminGuard, adminJson, fail, invalid, invalidate, serverError, type RouteCtx,
} from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: true, perm: "trips:edit" });
  if (blocked) return blocked;
  const { id } = await params;
  const body = await adminBody(req, TRIP_LIMITS.bodyBytes);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseTrip(body.value);
  if (!parsed.ok) return invalid(parsed);
  try {
    const item = await updateTrip(id, parsed.value);
    if (!item) return fail("not_found", 404);
    invalidate(CMS_TAGS.trips);
    return adminJson({ item });
  } catch (err) {
    return serverError("update trip", err);
  }
}

export async function DELETE(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: true, perm: "trips:edit" });
  if (blocked) return blocked;
  const { id } = await params;
  try {
    const deleted = await deleteTrip(id);
    if (!deleted) return fail("not_found", 404);
    invalidate(CMS_TAGS.trips);
    // The trip is gone either way; a file left behind on Cloudinary is only logged.
    await Promise.allSettled(deleted.photos.map((p) => destroyImage(p.publicId)));
    return adminJson({ ok: true });
  } catch (err) {
    return serverError("delete trip", err);
  }
}
