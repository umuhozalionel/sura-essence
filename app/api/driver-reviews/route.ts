/**
 * GET /api/driver-reviews?locale=en|fr → the approved reviews shown on the Driver page.
 * Falls back to the sample reviews in the message files when the database isn't set up.
 */
import { NextResponse, type NextRequest } from "next/server";
import { listPublicReviews } from "@/lib/driver-reviews-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale") === "fr" ? "fr" : "en";
  try {
    const { items, source } = await listPublicReviews(locale);
    return NextResponse.json(
      { items, source },
      // Your host's CDN may answer repeat visitors for 30 s without touching the database.
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
    );
  } catch (err) {
    console.error("[driver-reviews] GET failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
