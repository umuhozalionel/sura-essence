/**
 * POST /api/admin/profile/sign-out-everywhere → every device signed in to this
 * account is signed out at its next click, this one included.
 * Needs profile:edit and a real account.
 */
import { NextResponse } from "next/server";
import { clearedSessionCookie } from "@/lib/admin-auth";
import { signOutEverywhere } from "@/lib/admin-users";
import { NO_STORE, fail, ownAccountGuard, serverError } from "@/lib/cms/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const access = await ownAccountGuard(req, { write: true });
  if (access.blocked) return access.blocked;
  try {
    if (!(await signOutEverywhere(access.session.userId))) return fail("not_found", 404);
    const res = NextResponse.json({ ok: true }, { headers: { ...NO_STORE, "Clear-Site-Data": '"cache"' } });
    res.cookies.set(clearedSessionCookie());
    return res;
  } catch (err) {
    return serverError("sign out everywhere", err);
  }
}
