/**
 * GET /api/pricing → the active pricing config and its version number.
 * Always answers: when the database is empty or down it returns DEFAULT_PRICING
 * from lib/pricing.ts as version 0 (source "default"), the rates the site uses today.
 */
import { getActivePricing } from "@/lib/cms/pricing-config-server";
import { publicJson } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return publicJson(await getActivePricing());
}
