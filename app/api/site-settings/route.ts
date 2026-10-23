/**
 * GET /api/site-settings → contact details and social links.
 * Always answers: the official defaults stand in when the database can't.
 */
import { getSiteSettings } from "@/lib/cms/site-settings-server";
import { publicJson } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return publicJson(await getSiteSettings());
}
