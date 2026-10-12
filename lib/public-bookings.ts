/**
 * Bookings sent from the public booking form (POST /api/bookings).
 *
 * SERVER ONLY. The request is priced again here, turned into an admin Booking
 * and saved with createBooking(), so it is checked by parseBooking() exactly
 * like a booking an admin logs, and shows up in /admin/bookings as "pending".
 */
import { createHmac } from "node:crypto";
import { getDb } from "./mongodb";
import { createBooking } from "./admin-bookings";
import { quoteRequest, toBookingInput, type BookingRequest } from "./booking-request";
import type { Booking } from "./types";

/** Generous for a family booking a few trips; stops a script filling the admin list. */
const PER_IP_PER_HOUR = 10;

type Submission = { ipHash: string; at: Date };

let indexesReady: Promise<unknown> | null = null;

async function submissionsLog() {
  const col = (await getDb()).collection<Submission>("booking_submissions");
  indexesReady ??= Promise.all([
    col.createIndex({ ipHash: 1, at: -1 }),
    col.createIndex({ at: 1 }, { expireAfterSeconds: 24 * 60 * 60 }),
  ]).catch((err) => {
    indexesReady = null;
    throw err;
  });
  await indexesReady;
  return col;
}

// A keyed hash, never the raw IP address.
const hashIp = (ip: string) =>
  createHmac("sha256", process.env.MONGODB_URI ?? "sura").update(`booking:${ip}`).digest("hex").slice(0, 32);

export type WebsiteBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; reason: "rateLimited" }
  | { ok: false; reason: "unpriceable" }
  | { ok: false; reason: "invalid"; fields: string[] };

export async function createWebsiteBooking(request: BookingRequest, ip: string): Promise<WebsiteBookingResult> {
  // The browser's total is never trusted: price it again from the same rules.
  const q = quoteRequest(request, request.vehicleId);
  if (!q) return { ok: false, reason: "unpriceable" };

  const log = await submissionsLog();
  const ipHash = hashIp(ip);
  const since = new Date(Date.now() - 60 * 60 * 1000);
  if ((await log.countDocuments({ ipHash, at: { $gte: since } })) >= PER_IP_PER_HOUR) {
    return { ok: false, reason: "rateLimited" };
  }

  const result = await createBooking(toBookingInput(request, q));
  if (!result.ok) {
    return { ok: false, reason: "invalid", fields: "errors" in result ? Object.keys(result.errors) : [] };
  }
  await log.insertOne({ ipHash, at: new Date() });
  return { ok: true, booking: result.booking };
}
