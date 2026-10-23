/**
 * GET  /api/admin/tour-collections → every tour collection, drafts included, in order.
 * POST /api/admin/tour-collections → add one (body: TourCollectionInput in lib/cms/tours.ts).
 * Admin only. Writes clear the "cms:tours" cache.
 */
import { createTourCollection, listTourCollectionsForAdmin, parseTourCollection } from "@/lib/cms/tours-server";
import {
  CMS_TAGS, adminBody, adminGuard, adminJson, fail, invalid, invalidate, isDuplicateKey, serverError,
} from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const blocked = await adminGuard(req, { write: false });
  if (blocked) return blocked;
  try {
    return adminJson({ items: await listTourCollectionsForAdmin() });
  } catch (err) {
    return serverError("list tour collections", err);
  }
}

export async function POST(req: Request) {
  const blocked = await adminGuard(req, { write: true });
  if (blocked) return blocked;
  const body = await adminBody(req);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseTourCollection(body.value);
  if (!parsed.ok) return invalid(parsed);
  try {
    const item = await createTourCollection(parsed.value);
    invalidate(CMS_TAGS.tours);
    return adminJson({ item }, 201);
  } catch (err) {
    if (isDuplicateKey(err)) return fail("slug_taken", 409, { field: "slug" });
    return serverError("create tour collection", err);
  }
}
