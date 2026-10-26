/**
 * PATCH  /api/admin/users/<id>  { name?, role?, status?, password? } → change an account
 * DELETE /api/admin/users/<id>                                       → remove it for good
 *
 * 409 { guard } when the change would lock the portal (lib/admin-accounts.ts AccountGuard):
 * a Main Admin can't demote, disable or delete themself, and the last active
 * Main Admin can't be demoted, disabled or deleted.
 * A new password or disabling signs that person out everywhere; when someone
 * resets their own password, this browser gets a fresh cookie so they stay signed in.
 * Needs users:manage (lib/admin-rbac.ts): Main Admin only.
 */
import { NextResponse } from "next/server";
import { createSessionToken, getAdminSession, sessionCookie } from "@/lib/admin-auth";
import { parseAccountChanges } from "@/lib/admin-accounts";
import { deleteAccount, updateAccount } from "@/lib/admin-users";
import { NO_STORE, adminBody, adminGuard, adminJson, fail, serverError, type RouteCtx } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: true, perm: "users:manage" });
  if (blocked) return blocked;
  const session = await getAdminSession();
  if (!session) return fail("unauthorized", 401);
  const { id } = await params;

  const body = await adminBody(req, 4 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseAccountChanges(body.value);
  if (!parsed.ok) {
    return Object.keys(parsed.errors).length ? fail("invalid", 422, { fields: parsed.errors }) : fail("nothing_to_change", 400);
  }

  try {
    const result = await updateAccount(id, parsed.value, session.userId);
    if (!result.ok) return result.reason === "notFound" ? fail("not_found", 404) : fail("refused", 409, { guard: result.guard });
    const res = NextResponse.json({ item: result.account }, { headers: NO_STORE });
    if (id === session.userId && parsed.value.password) res.cookies.set(sessionCookie(createSessionToken(id, result.sessionVersion)));
    return res;
  } catch (err) {
    return serverError("update admin account", err);
  }
}

export async function DELETE(req: Request, { params }: RouteCtx) {
  const blocked = await adminGuard(req, { write: true, perm: "users:manage" });
  if (blocked) return blocked;
  const session = await getAdminSession();
  if (!session) return fail("unauthorized", 401);
  const { id } = await params;
  try {
    const result = await deleteAccount(id, session.userId);
    if (result.ok) return adminJson({ ok: true });
    return result.reason === "notFound" ? fail("not_found", 404) : fail("refused", 409, { guard: result.guard });
  } catch (err) {
    return serverError("delete admin account", err);
  }
}
