/**
 * GET  /api/admin/trip-alerts → every alert, drafts and archived included, newest first.
 * POST /api/admin/trip-alerts → add one (body: TripAlertInput in lib/cms/trip-alerts.ts).
 * Admin only. Writes clear the "cms:trip-alerts" cache.
 */
import { createTripAlert, listTripAlertsForAdmin, parseTripAlert } from "@/lib/cms/trip-alerts-server";
import {
  CMS_TAGS, adminBody, adminGuard, adminJson, fail, invalid, invalidate, isDuplicateKey, serverError,
} from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const blocked = await adminGuard(req, { write: false });
  if (blocked) return blocked;
  try {
    return adminJson({ items: await listTripAlertsForAdmin() });
  } catch (err) {
    return serverError("list trip alerts", err);
  }
}

export async function POST(req: Request) {
  const blocked = await adminGuard(req, { write: true });
  if (blocked) return blocked;
  const body = await adminBody(req);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseTripAlert(body.value);
  if (!parsed.ok) return invalid(parsed);
  try {
    const item = await createTripAlert(parsed.value);
    invalidate(CMS_TAGS.tripAlerts);
    return adminJson({ item }, 201);
  } catch (err) {
    if (isDuplicateKey(err)) return fail("slug_taken", 409, { field: "slug" });
    return serverError("create trip alert", err);
  }
}
