/**
 * POST /api/admin/login  { password } → sets the signed, HttpOnly admin cookie.
 */
import { NextResponse } from "next/server";
import {
  adminConfig, clearFailures, clientIp, createSessionToken, isLockedOut, isSameOrigin,
  passwordMatches, recordFailure, sessionCookie,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const config = adminConfig();
  if (config !== "ok") {
    console.error(
      config === "missing"
        ? "[admin] ADMIN_PASSWORD and/or ADMIN_SESSION_SECRET is not set."
        : "[admin] ADMIN_PASSWORD must be at least 12 characters and ADMIN_SESSION_SECRET at least 32.",
    );
    return NextResponse.json({ error: "not_configured" }, { status: 503, headers: noStore });
  }
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: noStore });

  let password = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    if (typeof body.password === "string") password = body.password.slice(0, 256);
  } catch {
    /* treated as a wrong password */
  }

  const ip = clientIp(req);
  if (await isLockedOut(ip)) {
    return NextResponse.json({ error: "too_many_attempts" }, { status: 429, headers: { ...noStore, "Retry-After": "900" } });
  }

  if (!passwordMatches(password)) {
    await recordFailure(ip);
    await wait(400); // slows down guessing
    return NextResponse.json({ error: "wrong_password" }, { status: 401, headers: noStore });
  }

  await clearFailures(ip);
  const res = NextResponse.json({ ok: true }, { headers: noStore });
  res.cookies.set(sessionCookie(createSessionToken()));
  return res;
}
