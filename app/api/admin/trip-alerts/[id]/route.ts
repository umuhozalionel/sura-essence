/**
 * GET    /api/admin/trip-alerts/<id>                      → one alert
 * PUT    /api/admin/trip-alerts/<id>  full form body      → save changes
 * PATCH  /api/admin/trip-alerts/<id>  { status?, urgent? } → publish / archive / flag as urgent
 * DELETE /api/admin/trip-alerts/<id>                      → remove for good
 * Admin only. Writes clear the "cms:trip-alerts" cache.
 */
import {
  deleteTripAlert, getTripAlertForAdmin, parseTripAlert, parseTripAlertPatch, updateTripAlert,
} from "@/lib/cms/trip-alerts-server";
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
    const item = await getTripAlertForAdmin(id);
    return item ? adminJson({ item }) : fail("not_found", 404);
  } catch (err) {
    return serverError("get trip alert", err);
  }
}

async function save(req: Request, { params }: RouteCtx, partial: boolean) {
  const blocked = await adminGuard(req, { write: true });
  if (blocked) return blocked;
  const { id } = await params;
  const body = await adminBody(req);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = partial ? parseTripAlertPatch(body.value) : parseTripAlert(body.value);
  if (!parsed.ok) return invalid(parsed);
  try {
    const item = await updateTripAlert(id, parsed.value);
    if (!item) return fail("not_found", 404);
    invalidate(CMS_TAGS.tripAlerts);
    return adminJson({ item });
  } catch (err) {
    if (isDuplicateKey(err)) return fail("slug_taken", 409, { field: "slug" });
    return serverError("update trip alert", err);
  }
}

export const PUT = (req: Request, ctx: RouteCtx) => save(req, ctx, false);
export const PATCH = (req: Request, ctx: RouteCtx) => save(req, ctx, true);

export async function DELETE(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: true });
  if (blocked) return blocked;
  const { id } = await params;
  try {
    if (!(await deleteTripAlert(id))) return fail("not_found", 404);
    invalidate(CMS_TAGS.tripAlerts);
    return adminJson({ ok: true });
  } catch (err) {
    return serverError("delete trip alert", err);
  }
}
