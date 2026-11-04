/**
 * Bookings sent from the public booking forms (POST /api/bookings), for SURA
 * Movana and SURA Iwacu alike.
 *
 * SERVER ONLY. The request is priced again here (car services from the live
 * rates, packages from the experience's own tier; corporate and custom
 * itinerary requests wait for the team's quote), turned into an admin Booking
 * and saved with createBooking(), so it is checked by parseBooking() exactly
 * like a booking an admin logs. Its brand follows from its service there, and
 * it shows up as "pending" for that brand's managers in /admin/bookings.
 */
import { createHmac } from "node:crypto";
import { getDb } from "./mongodb";
import { createBooking } from "./admin-bookings";
import { quoteRequest, toBookingInput, type BookingRequest, type PackagePrice } from "./booking-request";
import { needsVehicle } from "./bookings";
import { getActivePricing } from "./cms/pricing-config-server";
import { quotePackage } from "./cms/site-data";
import { getTripRates } from "./cms/trip-rates-server";
import { quoteTrip, readTripSelection, type TripSelection } from "./trips";
import { BOOKING_BRANDS, type Booking } from "./types";

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
  /**
   * total / revision: what the server priced it at (total null = the team sends a quote).
   * changed: it differs from what the browser showed.
   */
  | { ok: true; booking: Booking; total: number | null; revision: number; changed: boolean }
  | { ok: false; reason: "rateLimited" }
  | { ok: false; reason: "unpriceable" }
  | { ok: false; reason: "invalid"; fields: string[] };

export async function createWebsiteBooking(request: BookingRequest, ip: string): Promise<WebsiteBookingResult> {
  // The browser's total is never trusted. Car services are priced again from the same
  // rules at the active rates (pricing_config, or DEFAULT_PRICING if the database can't
  // answer); a package from its experience's tier × guests.
  const { config, revision } = await getActivePricing();
  let q = null;
  let pkg: PackagePrice | null = null;
  let plan: { selection: TripSelection; total: number } | null = null;
  if (needsVehicle(request.service)) {
    q = quoteRequest(request, request.vehicleId, config);
    if (!q) return { ok: false, reason: "unpriceable" };
  } else if (request.service === "package") {
    if (!request.experienceId || !request.guests) return { ok: false, reason: "invalid", fields: ["experienceId"] };
    pkg = await quotePackage(request.experienceId, request.packageId, request.guests);
    if (!pkg) return { ok: false, reason: "unpriceable" };
  } else if (request.service === "tailored_trip") {
    const rates = await getTripRates();
    const selection = readTripSelection(request.tripPlan, rates);
    if (!selection) return { ok: false, reason: "unpriceable" };
    plan = { selection, total: quoteTrip(selection, rates, config).total };
  }

  const log = await submissionsLog();
  const ipHash = hashIp(ip);
  const since = new Date(Date.now() - 60 * 60 * 1000);
  if ((await log.countDocuments({ ipHash, at: { $gte: since } })) >= PER_IP_PER_HOUR) {
    return { ok: false, reason: "rateLimited" };
  }

  const input = toBookingInput(request, q, pkg, plan);
  const result = await createBooking(input, {
    // Any brand: the website books for both, and the brand comes from the service.
    brands: BOOKING_BRANDS,
    source: "website",
    // Which rates priced a car booking, so its total can be explained later (pricing_changes has the history).
    ...(q && { pricingRevision: revision }),
  });
  if (!result.ok) {
    return { ok: false, reason: "invalid", fields: "errors" in result ? Object.keys(result.errors) : [] };
  }
  await log.insertOne({ ipHash, at: new Date() });
  const total = input.grandTotal;
  return {
    ok: true,
    booking: result.booking,
    total,
    revision,
    changed: request.grandTotal !== total || (q !== null && (request.pricingRevision ?? -1) !== revision),
  };
}
