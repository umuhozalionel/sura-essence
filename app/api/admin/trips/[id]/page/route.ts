/**
 * GET /api/admin/trips/<id>/page → every word, photo and link on this trip's own pages, with defaults.
 * PUT /api/admin/trips/<id>/page  { text: { "<key>": { en: [], fr: [] } }, media: { "<key>": "…" } }
 *   → saves them. Anything left empty shows the default from messages/*.json.
 * Writes clear the "cms:trips" cache.
 */
import { adminTripPage, parseTripPage } from "@/lib/cms/trip-pages-server";
import { getTripDoc, saveTripPage } from "@/lib/cms/trips-server";
import {
  CMS_TAGS, adminBody, adminGuard, adminJson, fail, invalid, invalidate, serverError, type RouteCtx,
} from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: false, perm: "trips:view" });
  if (blocked) return blocked;
  const { id } = await params;
  try {
    const doc = await getTripDoc(id);
    return doc ? adminJson({ item: adminTripPage(doc.slug, doc.page) }) : fail("not_found", 404);
  } catch (err) {
    return serverError("get trip page", err);
  }
}

export async function PUT(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: true, perm: "trips:edit" });
  if (blocked) return blocked;
  const { id } = await params;
  const body = await adminBody(req, 512 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  try {
    const doc = await getTripDoc(id);
    if (!doc) return fail("not_found", 404);
    const parsed = parseTripPage(doc.slug, body.value);
    if (!parsed.ok) return invalid(parsed);
    await saveTripPage(id, parsed.value);
    invalidate(CMS_TAGS.trips);
    return adminJson({ item: adminTripPage(doc.slug, parsed.value) });
  } catch (err) {
    return serverError("save trip page", err);
  }
}
