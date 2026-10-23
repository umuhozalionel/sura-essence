/**
 * GET    /api/admin/tour-collections/<id>                     → one collection
 * PUT    /api/admin/tour-collections/<id>  full form body     → save changes
 * PATCH  /api/admin/tour-collections/<id>  { status?, order? } → publish / unpublish / move
 * DELETE /api/admin/tour-collections/<id>                     → remove (409 while it still has venues)
 * Admin only. Writes clear the "cms:tours" cache.
 */
import {
  deleteTourCollection, getTourCollectionForAdmin, parseTourCollection, parseTourPatch, updateTourCollection,
} from "@/lib/cms/tours-server";
import {
  CMS_TAGS, adminBody, adminGuard, adminJson, fail, invalid, invalidate, isDuplicateKey, serverError, type RouteCtx,
} from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: false });
  if (blocked) return blocked;
  const { id } = await params;
  try {
    const item = await getTourCollectionForAdmin(id);
    return item ? adminJson({ item }) : fail("not_found", 404);
  } catch (err) {
    return serverError("get tour collection", err);
  }
}

async function save(req: Request, { params }: RouteCtx, partial: boolean) {
  const blocked = await adminGuard(req, { write: true });
  if (blocked) return blocked;
  const { id } = await params;
  const body = await adminBody(req);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = partial ? parseTourPatch(body.value) : parseTourCollection(body.value);
  if (!parsed.ok) return invalid(parsed);
  try {
    const item = await updateTourCollection(id, parsed.value);
    if (!item) return fail("not_found", 404);
    invalidate(CMS_TAGS.tours);
    return adminJson({ item });
  } catch (err) {
    if (isDuplicateKey(err)) return fail("slug_taken", 409, { field: "slug" });
    return serverError("update tour collection", err);
  }
}

export const PUT = (req: Request, ctx: RouteCtx) => save(req, ctx, false);
export const PATCH = (req: Request, ctx: RouteCtx) => save(req, ctx, true);

export async function DELETE(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: true });
  if (blocked) return blocked;
  const { id } = await params;
  try {
    const result = await deleteTourCollection(id);
    if (!result.ok) return result.reason === "hasVenues" ? fail("has_venues", 409) : fail("not_found", 404);
    invalidate(CMS_TAGS.tours);
    return adminJson({ ok: true });
  } catch (err) {
    return serverError("delete tour collection", err);
  }
}
