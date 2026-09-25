/**
 * GET  /api/testimonials  → the newest approved testimonials (no photo data;
 *                           each photo has its own URL so browsers can cache it)
 * POST /api/testimonials  → submit one; it's saved as "pending" until approved
 */
import { NextResponse, type NextRequest } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { createSubmission, listApproved, parseSubmission } from "@/lib/testimonials-server";

export const runtime = "nodejs"; // the MongoDB driver needs Node.js, not the Edge runtime
export const dynamic = "force-dynamic";

/** A real submission is well under 100 KB (the photo is ~20–60 KB before Base64). */
const MAX_BODY_BYTES = 256 * 1024;

const notConfigured = () =>
  NextResponse.json({ error: "not_configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  if (!isMongoConfigured) return notConfigured();
  try {
    const items = await listApproved();
    return NextResponse.json(
      { items },
      // Your host's CDN may answer repeat visitors for 30 s without touching the database.
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
    );
  } catch (err) {
    console.error("[testimonials] GET failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(req: NextRequest) {
  if (!isMongoConfigured) return notConfigured();

  // Requiring JSON also blocks other websites from posting here with a plain
  // HTML form: browsers won't send cross-site JSON without CORS permission.
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "unsupported_media_type" }, { status: 415 });
  }
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseSubmission(body);
  if (!parsed.ok) return NextResponse.json({ error: "invalid", reason: parsed.reason }, { status: 400 });
  if (parsed.bot) return NextResponse.json({ ok: true }, { status: 202 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  try {
    const result = await createSubmission(parsed.value, ip);
    if (!result.ok) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": "3600" } });
    }
    return NextResponse.json({ item: result.item }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[testimonials] POST failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}
