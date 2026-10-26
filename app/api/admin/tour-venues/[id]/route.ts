/**
 * GET    /api/admin/tour-venues/<id>                     → one venue
 * PUT    /api/admin/tour-venues/<id>  full form body     → save changes (may move it to another collection)
 * PATCH  /api/admin/tour-venues/<id>  { status?, order? } → publish / unpublish / move
 * DELETE /api/admin/tour-venues/<id>                     → remove for good
 * Admin only. Writes clear the "cms:tours" cache.
 */
import {
  deleteTourVenue, getTourVenueForAdmin, parseTourPatch, parseTourVenue, updateTourVenue,
} from "@/lib/cms/tours-server";
import {
  CMS_TAGS, adminBody, adminGuard, adminJson, fail, invalid, invalidate, isDuplicateKey, serverError, type RouteCtx,
} from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: false, perm: "tours:view" });
  if (blocked) return blocked;
  const { id } = await params;
  try {
    const item = await getTourVenueForAdmin(id);
    return item ? adminJson({ item }) : fail("not_found", 404);
  } catch (err) {
    return serverError("get tour venue", err);
  }
}

async function save(req: Request, { params }: RouteCtx, partial: boolean) {
  const blocked = await adminGuard(req, { write: true, perm: "tours:edit" });
  if (blocked) return blocked;
  const { id } = await params;
  const body = await adminBody(req);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = partial ? parseTourPatch(body.value) : parseTourVenue(body.value);
  if (!parsed.ok) return invalid(parsed);
  try {
    const result = await updateTourVenue(id, parsed.value);
    if (!result.ok) {
      return result.reason === "unknownCollection"
        ? fail("invalid", 400, { reason: "unknownCollection", field: "collectionId" })
        : fail("not_found", 404);
    }
    invalidate(CMS_TAGS.tours);
    return adminJson({ item: result.item });
  } catch (err) {
    if (isDuplicateKey(err)) return fail("slug_taken", 409, { field: "slug" });
    return serverError("update tour venue", err);
  }
}

export const PUT = (req: Request, ctx: RouteCtx) => save(req, ctx, false);
export const PATCH = (req: Request, ctx: RouteCtx) => save(req, ctx, true);

export async function DELETE(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: true, perm: "tours:edit" });
  if (blocked) return blocked;
  const { id } = await params;
  try {
    if (!(await deleteTourVenue(id))) return fail("not_found", 404);
    invalidate(CMS_TAGS.tours);
    return adminJson({ ok: true });
  } catch (err) {
    return serverError("delete tour venue", err);
  }
}
