/**
 * GET /api/trip-alerts?locale=en|fr → published travel alerts, urgent first, then newest.
 * Served from the "cms:trip-alerts" cache, cleared by admin edits.
 */
import type { NextRequest } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { toLocale } from "@/lib/cms/localized";
import { listPublicTripAlerts } from "@/lib/cms/trip-alerts-server";
import { fail, publicJson, serverError } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isMongoConfigured) return fail("not_configured", 503);
  try {
    return publicJson({ items: await listPublicTripAlerts(toLocale(req.nextUrl.searchParams.get("locale"))) });
  } catch (err) {
    return serverError("GET trip alerts", err);
  }
}
