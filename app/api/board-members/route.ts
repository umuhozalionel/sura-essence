/**
 * GET /api/board-members?locale=en|fr → the board members shown on the homepage,
 * in display order, in one language. Photos have their own URLs so browsers can cache them.
 * Falls back to the founders in the message files when the database isn't set up.
 */
import { NextResponse, type NextRequest } from "next/server";
import { listPublicBoard } from "@/lib/board-members-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale") === "fr" ? "fr" : "en";
  try {
    const { items, source } = await listPublicBoard(locale);
    return NextResponse.json(
      { items, source },
      // Your host's CDN may answer repeat visitors for 30 s without touching the database.
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
    );
  } catch (err) {
    console.error("[board-members] GET failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
