/**
 * POST /api/admin/logout → removes the admin cookie from this browser, and asks the
 * browser to drop its cached pages (Clear-Site-Data), so Back can't show admin
 * screens again. Only "cache": the site's other storage (theme, language) stays.
 */
import { NextResponse } from "next/server";
import { clearedSessionCookie, isSameOrigin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store", "Clear-Site-Data": '"cache"' } });
  res.cookies.set(clearedSessionCookie());
  return res;
}
