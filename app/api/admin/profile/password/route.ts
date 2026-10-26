/**
 * POST /api/admin/profile/password  { current, next } → change one's own password.
 *   422 { fields: { current: "wrong" } } when the current password is wrong.
 * Every other device is signed out; this browser gets a fresh cookie and stays signed in.
 * Wrong current passwords count towards the sign-in limiter (5 per 15 minutes).
 * Needs profile:edit and a real account.
 */
import { NextResponse } from "next/server";
import { clientIp, createSessionToken, isLockedOut, recordFailure, sessionCookie } from "@/lib/admin-auth";
import { PROFILE_LIMITS } from "@/lib/admin-profile";
import { changeOwnPassword } from "@/lib/admin-users";
import { NO_STORE, adminBody, fail, ownAccountGuard, serverError } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const access = await ownAccountGuard(req, { write: true });
  if (access.blocked) return access.blocked;
  const { userId } = access.session;

  const body = await adminBody(req, 2 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  const { current, next } = (body.value ?? {}) as { current?: unknown; next?: unknown };
  if (typeof current !== "string" || !current) return fail("invalid", 422, { fields: { current: "required" } });
  if (typeof next !== "string" || next.length < PROFILE_LIMITS.passwordMin) return fail("invalid", 422, { fields: { next: "tooShort" } });
  if (next.length > PROFILE_LIMITS.passwordMax) return fail("invalid", 422, { fields: { next: "tooLong" } });

  const key = `account:${userId}`;
  if (await isLockedOut(key)) return fail("too_many_attempts", 429);

  try {
    const result = await changeOwnPassword(userId, current, next);
    if (!result.ok) {
      if (result.reason === "notFound") return fail("not_found", 404);
      await recordFailure(key);
      await recordFailure(clientIp(req));
      return fail("invalid", 422, { fields: { current: "wrong" } });
    }
    const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
    res.cookies.set(sessionCookie(createSessionToken(userId, result.sessionVersion)));
    return res;
  } catch (err) {
    return serverError("change own password", err);
  }
}
