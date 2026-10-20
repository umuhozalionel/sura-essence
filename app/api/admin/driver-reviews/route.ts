/**
 * GET  /api/admin/driver-reviews → every Driver page review (samples are copied in the first time).
 * POST /api/admin/driver-reviews → add one; it starts as pending until approved.
 * Admin only.
 */
import { NextResponse } from "next/server";
import { isAdmin, isSameOrigin } from "@/lib/admin-auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json-body";
import { createReview, listReviewsForAdmin, parseReview } from "@/lib/driver-reviews-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status: number, extra?: Record<string, unknown>) =>
  NextResponse.json({ error, ...extra }, { status, headers: noStore });

export async function GET() {
  if (!(await isAdmin())) return fail("unauthorized", 401);
  if (!isMongoConfigured) return fail("not_configured", 503);
  try {
    return NextResponse.json({ items: await listReviewsForAdmin() }, { headers: noStore });
  } catch (err) {
    console.error("[admin] list driver reviews failed:", err);
    return fail("unavailable", 500);
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return fail("unauthorized", 401);
  if (!isSameOrigin(req)) return fail("forbidden", 403);
  if (!isMongoConfigured) return fail("not_configured", 503);

  const body = await readJsonBody(req, 32 * 1024);
  if (!body.ok) return fail(body.error, body.status);
  const parsed = parseReview(body.value);
  if (!parsed.ok) return fail("invalid", 400, { reason: parsed.reason, field: parsed.field });

  try {
    const result = await createReview(parsed.value);
    return result.ok ? NextResponse.json({ item: result.item }, { status: 201, headers: noStore }) : fail("too_many", 409);
  } catch (err) {
    console.error("[admin] create driver review failed:", err);
    return fail("unavailable", 500);
  }
}
