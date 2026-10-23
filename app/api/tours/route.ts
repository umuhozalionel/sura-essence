/**
 * GET /api/tours?locale=en|fr → published tour collections in order, each with
 * its published venues. Served from the "cms:tours" cache, cleared by admin edits.
 */
import type { NextRequest } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { toLocale } from "@/lib/cms/localized";
import { listPublicTours } from "@/lib/cms/tours-server";
import { fail, publicJson, serverError } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isMongoConfigured) return fail("not_configured", 503);
  try {
    return publicJson({ items: await listPublicTours(toLocale(req.nextUrl.searchParams.get("locale"))) });
  } catch (err) {
    return serverError("GET tours", err);
  }
}
