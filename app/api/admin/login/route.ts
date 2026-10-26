/**
 * POST /api/admin/login  { email, password } → sets the signed, HttpOnly admin cookie.
 *
 * With an email, the password is checked against that account (admin_users).
 * Without an account for that email, and only until the first Main Admin
 * account exists, ADMIN_PASSWORD from the environment signs in as Main Admin.
 */
import { NextResponse } from "next/server";
import {
  adminConfig, clearFailures, clientIp, createEnvSessionToken, createSessionToken, envPasswordMatches,
  isLockedOut, isSameOrigin, recordFailure, sessionCookie,
} from "@/lib/admin-auth";
import { isMongoConfigured } from "@/lib/mongodb";
import {
  bootstrapLoginAllowed, burnPasswordCheck, findActiveUserByEmail, normalizeEmail, recordLogin, verifyPassword,
} from "@/lib/admin-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const config = adminConfig();
  if (config !== "ok") {
    console.error(
      config === "missing"
        ? "[admin] ADMIN_SESSION_SECRET is not set."
        : "[admin] ADMIN_SESSION_SECRET must be at least 32 characters, and ADMIN_PASSWORD (if set) at least 12.",
    );
    return NextResponse.json({ error: "not_configured" }, { status: 503, headers: noStore });
  }
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: noStore });

  let password = "";
  let email = "";
  try {
    const body = (await req.json()) as { email?: unknown; password?: unknown };
    if (typeof body.password === "string") password = body.password.slice(0, 256);
    if (typeof body.email === "string") email = normalizeEmail(body.email.slice(0, 254));
  } catch {
    /* treated as a wrong password */
  }

  const ip = clientIp(req);
  const emailKey = email ? `email:${email}` : null;
  if ((await isLockedOut(ip)) || (emailKey && (await isLockedOut(emailKey)))) {
    return NextResponse.json({ error: "too_many_attempts" }, { status: 429, headers: { ...noStore, "Retry-After": "900" } });
  }

  let token: string | null = null;
  try {
    const user = email && isMongoConfigured ? await findActiveUserByEmail(email) : null;
    if (user) {
      if (await verifyPassword(password, user.passwordHash)) {
        token = createSessionToken(user._id.toHexString(), user.sessionVersion);
        await recordLogin(user._id);
      }
    } else {
      if (email) await burnPasswordCheck(password); // same timing as a real account
      if ((await bootstrapLoginAllowed()) && envPasswordMatches(password)) token = createEnvSessionToken();
    }
  } catch (err) {
    console.error("[admin] sign-in failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 500, headers: noStore });
  }

  if (!token) {
    await recordFailure(ip);
    if (emailKey) await recordFailure(emailKey);
    await wait(400); // slows down guessing
    return NextResponse.json({ error: "wrong_password" }, { status: 401, headers: noStore });
  }

  await clearFailures(ip);
  if (emailKey) await clearFailures(emailKey);
  const res = NextResponse.json({ ok: true }, { headers: noStore });
  res.cookies.set(sessionCookie(token));
  return res;
}
