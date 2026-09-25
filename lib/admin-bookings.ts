/**
 * Bookings in MongoDB (collection "bookings") — the WhatsApp orders admins log
 * in /admin/bookings.
 *
 * SERVER ONLY, and only for code that has already checked the admin cookie
 * (the /admin pages and /api/admin/bookings). Every write goes through
 * parseBooking(), so only checked fields ever reach the database.
 */
import { ObjectId } from "mongodb";
import { getDb, isMongoConfigured } from "./mongodb";
import { parseBooking, summarizeBookings, type ParsedBooking, type BookingSummary } from "./bookings";
import type { Booking, BookingInput } from "./types";

export type BookingDoc = BookingInput & {
  _id: ObjectId;
  /** Where the order came from. Everything is WhatsApp for now. */
  source: "whatsapp";
  createdAt: Date;
  updatedAt: Date;
};

/** Enough for years of manual logging; the table pages through them in the browser. */
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

function toBooking(d: BookingDoc): Booking {
  return {
    id: d._id.toHexString(),
    clientName: d.clientName,
    clientPhone: d.clientPhone,
    tripType: d.tripType,
    vehicleId: d.vehicleId,
    withDriver: d.withDriver,
    pickup: d.pickup,
    destination: d.destination,
    startDate: d.startDate,
    endDate: d.endDate,
    time: d.time,
    passengers: d.passengers,
    grandTotal: d.grandTotal,
    status: d.status,
    notes: d.notes,
    createdAt: d.createdAt.getTime(),
    updatedAt: d.updatedAt.getTime(),
  };
}

const toObjectId = (id: string) => (/^[a-f0-9]{24}$/i.test(id) ? new ObjectId(id) : null);

/* ─── reading ────────────────────────────────────────────────────────── */

/** Every booking, latest trip date first. */
export async function listBookings(): Promise<Booking[]> {
  const col = await bookingsCollection();
  const docs = await col.find({}).sort({ startDate: -1, createdAt: -1 }).limit(MAX_LIST).toArray();
  return docs.map(toBooking);
}

export async function countPendingBookings(): Promise<number> {
  return (await bookingsCollection()).countDocuments({ status: "pending" });
}

export async function countBookings(): Promise<number> {
  return (await bookingsCollection()).countDocuments({});
}

/* ─── writing ────────────────────────────────────────────────────────── */

export type SaveResult =
  | { ok: true; booking: Booking }
  | { ok: false; errors: Extract<ParsedBooking, { ok: false }>["errors"] }
  | { ok: false; notFound: true };

export async function createBooking(raw: unknown): Promise<SaveResult> {
  const parsed = parseBooking(raw);
  if (!parsed.ok) return parsed;
  const now = new Date();
  const doc: BookingDoc = { _id: new ObjectId(), ...parsed.value, source: "whatsapp", createdAt: now, updatedAt: now };
  await (await bookingsCollection()).insertOne(doc);
  return { ok: true, booking: toBooking(doc) };
}

/**
 * Changes some fields (e.g. just the status). The change is laid over the
 * saved booking and the whole result is checked again, so a partial edit can
 * never leave the booking half-valid.
 */
export async function updateBooking(id: string, patch: unknown): Promise<SaveResult> {
  const _id = toObjectId(id);
  if (!_id) return { ok: false, notFound: true };
  const col = await bookingsCollection();
  const current = await col.findOne({ _id });
  if (!current) return { ok: false, notFound: true };

  const changes = patch && typeof patch === "object" ? (patch as Record<string, unknown>) : {};
  // parseBooking ignores the id and timestamps, so only booking fields can change.
  const parsed = parseBooking({ ...toBooking(current), ...changes });
  if (!parsed.ok) return parsed;

  const updatedAt = new Date();
  await col.updateOne({ _id }, { $set: { ...parsed.value, updatedAt } });
  return { ok: true, booking: toBooking({ ...current, ...parsed.value, updatedAt }) };
}

export async function deleteBooking(id: string): Promise<boolean> {
  const _id = toObjectId(id);
  if (!_id) return false;
  const res = await (await bookingsCollection()).deleteOne({ _id });
  return res.deletedCount === 1;
}

/* ─── for the admin pages ────────────────────────────────────────────── */

export type DbState = "ok" | "notConfigured" | "unavailable";

/**
 * Bookings for a server-rendered admin page. Never throws: when MongoDB isn't
 * set up or can't be reached, the page gets an empty list and says why.
 */
export async function loadBookings(): Promise<{ state: DbState; bookings: Booking[] }> {
  if (!isMongoConfigured) return { state: "notConfigured", bookings: [] };
  try {
    return { state: "ok", bookings: await listBookings() };
  } catch (err) {
    console.error("[admin] loading bookings failed:", err);
    return { state: "unavailable", bookings: [] };
  }
}

export async function loadBookingSummary(today: string): Promise<{ state: DbState; summary: BookingSummary }> {
  const { state, bookings } = await loadBookings();
  return { state, summary: summarizeBookings(bookings, today) };
}
