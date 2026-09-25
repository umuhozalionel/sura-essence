/**
 * POST /api/admin/logout → removes the admin cookie from this browser.
 */
import { NextResponse } from "next/server";
import { clearedSessionCookie, isSameOrigin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(clearedSessionCookie());
  return res;
}
