/**
 * GET /api/admin/trip-rates              → the rates, and today's USD rate from the public source
 * PUT /api/admin/trip-rates  { ...rates } → replace them
 * Admin only. Writes clear the "cms:trip-rates" cache, so Trips switches at once.
 */
import { fetchUsdToRwf, getTripRatesForAdmin, parseTripRates, saveTripRates } from "@/lib/cms/trip-rates-server";
import { adminBody, adminGuard, adminJson, fail, invalid, serverError } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const blocked = await adminGuard(req, { write: false, perm: "trips:view" });
  if (blocked) return blocked;
  try {
    const [item, liveRate] = await Promise.all([getTripRatesForAdmin(), fetchUsdToRwf()]);
    return adminJson({ item, liveRate });
  } catch (err) {
    return serverError("get trip rates", err);
  }
}

export async function PUT(req: Request) {
  const blocked = await adminGuard(req, { write: true, perm: "trips:edit" });
  if (blocked) return blocked;
  const body = await adminBody(req, 8 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  try {
    const parsed = parseTripRates(body.value, await getTripRatesForAdmin());
    if (!parsed.ok) return invalid(parsed);
    return adminJson({ item: await saveTripRates(parsed.value) });
  } catch (err) {
    return serverError("save trip rates", err);
  }
}
