/**
 * GET  /api/admin/trips → every trip, hidden ones included. The first visit fills the list from lib/trips.ts.
 * POST /api/admin/trips → add one (body: TripInput in lib/cms/trips.ts).
 * Writes clear the "cms:trips" cache.
 */
import { TRIP_LIMITS } from "@/lib/cms/trips";
import { createTrip, listTripsForAdmin, parseTrip } from "@/lib/cms/trips-server";
import {
  CMS_TAGS, adminBody, adminGuard, adminJson, fail, invalid, invalidate, isDuplicateKey, serverError,
} from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const blocked = await adminGuard(req, { write: false, perm: "trips:view" });
  if (blocked) return blocked;
  try {
    return adminJson({ items: await listTripsForAdmin() });
  } catch (err) {
    return serverError("list trips", err);
  }
}

export async function POST(req: Request) {
  const blocked = await adminGuard(req, { write: true, perm: "trips:edit" });
  if (blocked) return blocked;
  const body = await adminBody(req, TRIP_LIMITS.bodyBytes);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseTrip(body.value);
  if (!parsed.ok) return invalid(parsed);
  try {
    const item = await createTrip(parsed.value);
    invalidate(CMS_TAGS.trips);
    return adminJson({ item }, 201);
  } catch (err) {
    if (isDuplicateKey(err)) return fail("slug_taken", 409, { field: "slug" });
    return serverError("create trip", err);
  }
}
