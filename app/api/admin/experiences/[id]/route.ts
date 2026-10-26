/**
 * GET    /api/admin/experiences/<id>                                   → one experience
 * PUT    /api/admin/experiences/<id>  full form body                   → save changes
 * PATCH  /api/admin/experiences/<id>  { status?, featured?, availability? } → quick change
 * DELETE /api/admin/experiences/<id>                                   → remove for good
 * Admin only. Writes clear the "cms:experiences" cache.
 */
import { EXPERIENCE_LIMITS } from "@/lib/cms/experiences";
import {
  deleteExperience, getExperienceForAdmin, parseExperience, parseExperiencePatch, patchExperience, updateExperience,
} from "@/lib/cms/experiences-server";
import {
  CMS_TAGS, adminBody, adminGuard, adminJson, fail, invalid, invalidate, isDuplicateKey, serverError, type RouteCtx,
} from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: false, perm: "experiences:view" });
  if (blocked) return blocked;
  const { id } = await params;
  try {
    const item = await getExperienceForAdmin(id);
    return item ? adminJson({ item }) : fail("not_found", 404);
  } catch (err) {
    return serverError("get experience", err);
  }
}

export async function PUT(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: true, perm: "experiences:edit" });
  if (blocked) return blocked;
  const { id } = await params;
  const body = await adminBody(req, EXPERIENCE_LIMITS.bodyBytes);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseExperience(body.value);
  if (!parsed.ok) return invalid(parsed);
  try {
    const item = await updateExperience(id, parsed.value);
    if (!item) return fail("not_found", 404);
    invalidate(CMS_TAGS.experiences);
    return adminJson({ item });
  } catch (err) {
    if (isDuplicateKey(err)) return fail("slug_taken", 409, { field: "slug" });
    return serverError("update experience", err);
  }
}

export async function PATCH(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: true, perm: "experiences:edit" });
  if (blocked) return blocked;
  const { id } = await params;
  const body = await adminBody(req, 4 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseExperiencePatch(body.value);
  if (!parsed.ok) return invalid(parsed);
  try {
    const item = await patchExperience(id, parsed.value);
    if (!item) return fail("not_found", 404);
    invalidate(CMS_TAGS.experiences);
    return adminJson({ item });
  } catch (err) {
    return serverError("patch experience", err);
  }
}

export async function DELETE(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: true, perm: "experiences:edit" });
  if (blocked) return blocked;
  const { id } = await params;
  try {
    if (!(await deleteExperience(id))) return fail("not_found", 404);
    invalidate(CMS_TAGS.experiences);
    return adminJson({ ok: true });
  } catch (err) {
    return serverError("delete experience", err);
  }
}
