/**
 * Bookings in MongoDB (collection "bookings"): the WhatsApp orders admins log
 * in /admin/bookings and the requests sent from the website's booking forms.
 *
 * SERVER ONLY, and only for code that has already checked the admin cookie
 * (the /admin pages and /api/admin/bookings). The one exception is
 * createBooking(), which lib/public-bookings.ts also uses for bookings from
 * the website forms. Every write goes through parseBooking(), so only checked
 * fields ever reach the database.
 *
 * Every read and write takes the brands the caller may see (bookingBrands() in
 * lib/admin-rbac.ts), so a Movana-only session never gets an Iwacu booking and
 * the other way round, whatever URL it asks for.
 */
import { ObjectId } from "mongodb";
import { getDb, isMongoConfigured } from "./mongodb";
import {
  brandForService, isBookingBrand, isBookingService, parseBooking, summarizeBookings,
  type ParsedBooking, type BookingSummary,
} from "./bookings";
import type { Booking, BookingBrand, BookingInput, BookingService } from "./types";
import type { AdminActor } from "./admin-auth";

export type BookingSource = "whatsapp" | "website";

export type BookingDoc = Omit<BookingInput, "brand" | "service" | "details"> & {
  _id: ObjectId;
  /** Absent on bookings saved before Phase 4: worked out when read (see toBooking). */
  brand?: BookingBrand;
  service?: BookingService | null;
  details?: Booking["details"];
  /** Where the order came from: logged by an admin from WhatsApp, or sent from the website. */
  source: BookingSource;
  createdAt: Date;
  updatedAt: Date;
  /** The admin who logged it (absent for website bookings and older ones). */
  createdBy?: AdminActor;
  /** The admin who last changed it. */
  updatedBy?: AdminActor;
};

/** Enough for years of bookings; the table pages through them in the browser. */
const MAX_LIST = 5000;

let indexesReady: Promise<unknown> | null = null;

async function bookingsCollection() {
  const col = (await getDb()).collection<BookingDoc>("bookings");
  // Idempotent; runs once per server instance. `npm run db:setup` creates the
  // same indexes plus a schema check.
  indexesReady ??= Promise.all([
    col.createIndex({ startDate: -1 }),
    col.createIndex({ status: 1, startDate: 1 }),
  ]).catch((err) => {
    indexesReady = null;
    throw err;
  });
  await indexesReady;
  return col;
}

/**
 * Website bookings from before services were stored say what they were in their
 * notes ("Booked on the website · City tour"), written by toBookingInput().
 */
const LEGACY_SERVICE_NOTES: [string, BookingService][] = [
  ["Airport transfer", "airport"],
  ["City ride (A to B)", "inter_city"],
  ["City tour", "city_tour"],
  ["Hourly hire", "hourly"],
  ["Country trip", "trip"],
];

function serviceOf(d: BookingDoc): BookingService | null {
  if (isBookingService(d.service)) return d.service;
  const first = d.notes.split("\n", 1)[0] ?? "";
  if (!first.startsWith("Booked on the website · ")) return null;
  return LEGACY_SERVICE_NOTES.find(([name]) => first.endsWith(`· ${name}`))?.[1] ?? null;
}

/** The booking as the portal sees it. Older documents get their service and brand worked out here. */
function toBooking(d: BookingDoc): Booking {
  const service = serviceOf(d);
  // Bookings logged by hand before brands existed were all rides.
  const brand = isBookingBrand(d.brand) ? d.brand : service ? brandForService(service) : "movana";
  return {
    id: d._id.toHexString(),
    brand,
    service,
    clientName: d.clientName,
    clientPhone: d.clientPhone,
    tripType: d.tripType ?? null,
    vehicleId: d.vehicleId ?? "",
    withDriver: d.withDriver,
    pickup: d.pickup,
    destination: d.destination,
    startDate: d.startDate,
    endDate: d.endDate,
    time: d.time,
    passengers: d.passengers,
    grandTotal: d.grandTotal ?? null,
    status: d.status,
    notes: d.notes,
    details: d.details ?? {},
    createdAt: d.createdAt.getTime(),
    updatedAt: d.updatedAt.getTime(),
  };
}

const toObjectId = (id: string) => (/^[a-f0-9]{24}$/i.test(id) ? new ObjectId(id) : null);

/* ─── reading ────────────────────────────────────────────────────────── */

/**
 * Every booking of these brands, latest trip date first. Filtered after reading,
 * because older documents only get their brand when they're read.
 */
export async function listBookings(brands: readonly BookingBrand[]): Promise<Booking[]> {
  if (!brands.length) return [];
  const col = await bookingsCollection();
  const docs = await col.find({}).sort({ startDate: -1, createdAt: -1 }).limit(MAX_LIST).toArray();
  return docs.map(toBooking).filter((b) => brands.includes(b.brand));
}

export async function countPendingBookings(brands: readonly BookingBrand[]): Promise<number> {
  if (!brands.length) return 0;
  const docs = await (await bookingsCollection()).find({ status: "pending" }).limit(MAX_LIST).toArray();
  return docs.map(toBooking).filter((b) => brands.includes(b.brand)).length;
}

/** All bookings, every brand: for the database check in Settings (main admin only). */
export async function countBookings(): Promise<number> {
  return (await bookingsCollection()).countDocuments({});
}

/* ─── writing ────────────────────────────────────────────────────────── */

export type SaveResult =
  | { ok: true; booking: Booking }
  | { ok: false; errors: Extract<ParsedBooking, { ok: false }>["errors"] }
  | { ok: false; notFound: true }
  /** The booking is (or would become) a brand this person may not see. */
  | { ok: false; forbidden: true };

/**
 * `by` is the admin logging it; website bookings (lib/public-bookings.ts) have none.
 * `brands`: the brands the caller may book for; the checked booking's brand must be one.
 */
export async function createBooking(
  raw: unknown,
  { by, brands, source = "whatsapp", pricingRevision }: {
    by?: AdminActor;
    brands: readonly BookingBrand[];
    source?: BookingSource;
    /** Website bookings: which rates priced it, so the total can be explained later. */
    pricingRevision?: number;
  },
): Promise<SaveResult> {
  const parsed = parseBooking(raw);
  if (!parsed.ok) return parsed;
  if (!brands.includes(parsed.value.brand)) return { ok: false, forbidden: true };
  const now = new Date();
  const doc: BookingDoc = {
    _id: new ObjectId(), ...parsed.value, source, createdAt: now, updatedAt: now,
    ...(pricingRevision !== undefined && { pricingRevision }),
    ...(by && { createdBy: by, updatedBy: by }),
  };
  await (await bookingsCollection()).insertOne(doc);
  return { ok: true, booking: toBooking(doc) };
}

/**
 * Changes some fields (e.g. just the status). The change is laid over the
 * saved booking and the whole result is checked again, so a partial edit can
 * never leave the booking half-valid. Both the saved booking and the result
 * must be a brand the caller may see.
 */
export async function updateBooking(id: string, patch: unknown, by: AdminActor, brands: readonly BookingBrand[]): Promise<SaveResult> {
  const _id = toObjectId(id);
  if (!_id) return { ok: false, notFound: true };
  const col = await bookingsCollection();
  const current = await col.findOne({ _id });
  if (!current) return { ok: false, notFound: true };
  const saved = toBooking(current);
  // Someone who can't see the booking gets the same answer as for one that doesn't exist.
  if (!brands.includes(saved.brand)) return { ok: false, notFound: true };

  const changes = patch && typeof patch === "object" ? (patch as Record<string, unknown>) : {};
  // parseBooking ignores the id and timestamps, so only booking fields can change.
  const parsed = parseBooking({ ...saved, ...changes });
  if (!parsed.ok) return parsed;
  if (!brands.includes(parsed.value.brand)) return { ok: false, forbidden: true };

  const updatedAt = new Date();
  await col.updateOne({ _id }, { $set: { ...parsed.value, updatedAt, updatedBy: by } });
  return { ok: true, booking: toBooking({ ...current, ...parsed.value, updatedAt, updatedBy: by }) };
}

export async function deleteBooking(id: string, brands: readonly BookingBrand[]): Promise<boolean> {
  const _id = toObjectId(id);
  if (!_id) return false;
  const col = await bookingsCollection();
  const current = await col.findOne({ _id });
  if (!current || !brands.includes(toBooking(current).brand)) return false;
  const res = await col.deleteOne({ _id });
  return res.deletedCount === 1;
}

/* ─── for the admin pages ────────────────────────────────────────────── */

export type DbState = "ok" | "notConfigured" | "unavailable";

/**
 * Bookings of these brands for a server-rendered admin page. Never throws: when
 * MongoDB isn't set up or can't be reached, the page gets an empty list and says why.
 */
export async function loadBookings(brands: readonly BookingBrand[]): Promise<{ state: DbState; bookings: Booking[] }> {
  if (!isMongoConfigured) return { state: "notConfigured", bookings: [] };
  try {
    return { state: "ok", bookings: await listBookings(brands) };
  } catch (err) {
    console.error("[admin] loading bookings failed:", err);
    return { state: "unavailable", bookings: [] };
  }
}

export async function loadBookingSummary(today: string, brands: readonly BookingBrand[]): Promise<{ state: DbState; summary: BookingSummary }> {
  const { state, bookings } = await loadBookings(brands);
  return { state, summary: summarizeBookings(bookings, today) };
}
