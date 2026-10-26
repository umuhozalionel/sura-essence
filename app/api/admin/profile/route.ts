/**
 * GET   /api/admin/profile → the signed-in person's own profile
 * PATCH /api/admin/profile  { name?, title?, bio?, phone? } → change it (422 { fields } when something's wrong)
 * Needs profile:edit and a real account (lib/cms/server.ts ownAccountGuard).
 * Only these fields can be changed here: role, status, email and password can't.
 */
import { adminBody, adminJson, fail, ownAccountGuard, serverError } from "@/lib/cms/server";
import { parseProfileChanges } from "@/lib/admin-profile";
import { getOwnProfile, updateOwnProfile } from "@/lib/admin-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const access = await ownAccountGuard(req, { write: false });
  if (access.blocked) return access.blocked;
  try {
    const item = await getOwnProfile(access.session.userId);
    return item ? adminJson({ item }) : fail("not_found", 404);
  } catch (err) {
    return serverError("get own profile", err);
  }
}

export async function PATCH(req: Request) {
  const access = await ownAccountGuard(req, { write: true });
  if (access.blocked) return access.blocked;
  const body = await adminBody(req, 8 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseProfileChanges(body.value);
  if (!parsed.ok) return fail("invalid", 422, { fields: parsed.errors });
  try {
    const item = await updateOwnProfile(access.session.userId, parsed.value);
    return item ? adminJson({ item }) : fail("not_found", 404);
  } catch (err) {
    return serverError("update own profile", err);
  }
}
