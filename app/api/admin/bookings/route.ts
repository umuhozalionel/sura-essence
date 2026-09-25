/**
 * GET  /api/admin/bookings → every logged booking, latest trip date first
 * POST /api/admin/bookings → log a new WhatsApp booking
 * Admin only.
 */
import { NextResponse } from "next/server";
import { isAdmin, isSameOrigin } from "@/lib/admin-auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { createBooking, listBookings } from "@/lib/admin-bookings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status: number, extra?: object) =>
  NextResponse.json({ error, ...extra }, { status, headers: noStore });

export async function GET() {
  if (!(await isAdmin())) return fail("unauthorized", 401);
  if (!isMongoConfigured) return fail("not_configured", 503);
  try {
    return NextResponse.json({ items: await listBookings() }, { headers: noStore });
  } catch (err) {
    console.error("[admin] list bookings failed:", err);
    return fail("unavailable", 500);
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return fail("unauthorized", 401);
  if (!isSameOrigin(req)) return fail("forbidden", 403);
  if (!isMongoConfigured) return fail("not_configured", 503);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid_json", 400);
  }

  try {
    const result = await createBooking(body);
    if (!result.ok) return fail("invalid", 422, "errors" in result ? { fields: result.errors } : undefined);
    return NextResponse.json({ item: result.booking }, { status: 201, headers: noStore });
  } catch (err) {
    console.error("[admin] create booking failed:", err);
    return fail("unavailable", 500);
  }
}
