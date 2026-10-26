/**
 * GET  /api/admin/tour-venues[?collectionId=<id>] → venues, drafts included, in order.
 * POST /api/admin/tour-venues                     → add one (body: TourVenueInput in lib/cms/tours.ts).
 * Admin only. Writes clear the "cms:tours" cache.
 */
import type { NextRequest } from "next/server";
import { createTourVenue, listTourVenuesForAdmin, parseTourVenue } from "@/lib/cms/tours-server";
import {
  CMS_TAGS, adminBody, adminGuard, adminJson, fail, invalid, invalidate, isDuplicateKey, serverError,
} from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const blocked = await adminGuard(req, { write: false, perm: "tours:view" });
  if (blocked) return blocked;
  try {
    return adminJson({ items: await listTourVenuesForAdmin(req.nextUrl.searchParams.get("collectionId")) });
  } catch (err) {
    return serverError("list tour venues", err);
  }
}

export async function POST(req: Request) {
  const blocked = await adminGuard(req, { write: true, perm: "tours:edit" });
  if (blocked) return blocked;
  const body = await adminBody(req);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseTourVenue(body.value);
  if (!parsed.ok) return invalid(parsed);
  try {
    const result = await createTourVenue(parsed.value);
    if (!result.ok) {
      return result.reason === "tooMany" ? fail("too_many", 409) : fail("invalid", 400, { reason: "unknownCollection", field: "collectionId" });
    }
    invalidate(CMS_TAGS.tours);
    return adminJson({ item: result.item }, 201);
  } catch (err) {
    if (isDuplicateKey(err)) return fail("slug_taken", 409, { field: "slug" });
    return serverError("create tour venue", err);
  }
}
