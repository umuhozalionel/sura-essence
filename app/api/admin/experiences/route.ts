/**
 * GET  /api/admin/experiences → every experience, drafts and archived included.
 * POST /api/admin/experiences → add one (body: ExperienceInput in lib/cms/experiences.ts).
 * Admin only. Writes clear the "cms:experiences" cache.
 */
import { EXPERIENCE_LIMITS } from "@/lib/cms/experiences";
import { createExperience, listExperiencesForAdmin, parseExperience } from "@/lib/cms/experiences-server";
import {
  CMS_TAGS, adminBody, adminGuard, adminJson, fail, invalid, invalidate, isDuplicateKey, serverError,
} from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const blocked = await adminGuard(req, { write: false, perm: "experiences:view" });
  if (blocked) return blocked;
  try {
    return adminJson({ items: await listExperiencesForAdmin() });
  } catch (err) {
    return serverError("list experiences", err);
  }
}

export async function POST(req: Request) {
  const blocked = await adminGuard(req, { write: true, perm: "experiences:edit" });
  if (blocked) return blocked;
  const body = await adminBody(req, EXPERIENCE_LIMITS.bodyBytes);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseExperience(body.value);
  if (!parsed.ok) return invalid(parsed);
  try {
    const item = await createExperience(parsed.value);
    invalidate(CMS_TAGS.experiences);
    return adminJson({ item }, 201);
  } catch (err) {
    if (isDuplicateKey(err)) return fail("slug_taken", 409, { field: "slug" });
    return serverError("create experience", err);
  }
}
