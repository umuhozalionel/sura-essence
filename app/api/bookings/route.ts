/**
 * POST /api/bookings → save a booking from the public booking form.
 *
 * The booking is priced again on the server, checked like an admin-logged
 * booking (lib/bookings.ts parseBooking) and saved as "pending" in MongoDB,
 * where it shows up in /admin/bookings. The form opens WhatsApp afterwards
 * whatever this returns, so a failed save never loses the customer.
 *
 * There is deliberately no GET: bookings are only listed behind the admin login.
 */
import { NextResponse, type NextRequest } from "next/server";
import { isMongoConfigured } from "@/lib/mongodb";
import { clientIp, isSameOrigin } from "@/lib/admin-auth";
import { readBookingRequest } from "@/lib/booking-request";
import { createWebsiteBooking } from "@/lib/public-bookings";

export const runtime = "nodejs"; // the MongoDB driver needs Node.js, not the Edge runtime
export const dynamic = "force-dynamic";

/** A real request is a few KB. */
const MAX_BODY_BYTES = 32 * 1024;

const json = (body: unknown, status: number, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(req: NextRequest) {
  if (!isMongoConfigured) return json({ error: "not_configured" }, 503);

  // JSON only, from this site: blocks other websites posting here with a plain HTML form.
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "unsupported_media_type" }, 415);
  }
  if (!isSameOrigin(req)) return json({ error: "forbidden" }, 403);
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return json({ error: "too_large" }, 413);

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "too_large" }, 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const request = readBookingRequest(body);
  if (!request) return json({ error: "invalid" }, 400);

  try {
    const result = await createWebsiteBooking(request, clientIp(req));
    // The total is the server's, at the live rates: the form shows it and sends it on WhatsApp.
    if (result.ok) return json({ id: result.booking.id, total: result.total, revision: result.revision, changed: result.changed }, 201);
    if (result.reason === "rateLimited") return json({ error: "rate_limited" }, 429, { "Retry-After": "3600" });
    if (result.reason === "unpriceable") return json({ error: "invalid", fields: ["destination"] }, 400);
    return json({ error: "invalid", fields: result.fields }, 400);
  } catch (err) {
    console.error("[bookings] POST failed:", err);
    return json({ error: "unavailable" }, 500);
  }
}
