/**
 * Booking rules shared by the admin portal and the admin API: checking what an
 * admin typed, the dashboard figures, search and the CSV export.
 *
 * Safe to import in the browser — no database code here. The server copy of
 * the checks (lib/admin-bookings.ts) is the one that counts: the API runs
 * every save through parseBooking() before it touches MongoDB.
 */
import { VEHICLES, getVehicle } from "./pricing";
import {
  BOOKING_STATUSES, DRIVER_OPTION_TRIPS, TRIP_TYPES,
  type Booking, type BookingInput, type BookingStatus, type TripType,
} from "./types";

export const BOOKING_LIMITS = {
  clientName: 80,
  clientPhone: 30,
  pickup: 120,
  destination: 120,
  notes: 1000,
  maxPassengers: 60,
  /** 100 million RWF — anything above is almost certainly a typo. */
  maxTotal: 100_000_000,
} as const;

export type BookingField = keyof BookingInput;
export type FieldError = "required" | "tooLong" | "invalid" | "endBeforeStart";
export type ParsedBooking =
  | { ok: true; value: BookingInput }
  | { ok: false; errors: Partial<Record<BookingField, FieldError>> };

/** A blank booking for the "Log a booking" form. */
export function emptyBooking(today: string): BookingInput {
  return {
    clientName: "",
    clientPhone: "",
    tripType: "long",
    vehicleId: VEHICLES[0].id,
    withDriver: true,
    pickup: "",
    destination: "",
    startDate: today,
    endDate: null,
    time: "",
    passengers: 1,
    grandTotal: 0,
    status: "pending",
    notes: "",
  };
}

/* ─── checking ───────────────────────────────────────────────────────── */

// Control characters and invisible text-direction tricks.
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g;
const oneLine = (v: unknown) => (typeof v === "string" ? v.replace(INVISIBLE, "").replace(/\s+/g, " ").trim() : "");
const paragraph = (v: unknown) =>
  typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(INVISIBLE, "").trim() : "";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
export function isIsoDate(v: unknown): v is string {
  if (typeof v !== "string" || !DATE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/**
 * Checks and tidies a booking. Unknown fields are dropped, text is trimmed,
 * and the driver option is forced on where the trip or the class needs one.
 */
export function parseBooking(raw: unknown): ParsedBooking {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: Partial<Record<BookingField, FieldError>> = {};
  const text = (field: BookingField, max: number, required = false) => {
    const v = oneLine(r[field]);
    if (required && !v) errors[field] = "required";
    else if (v.length > max) errors[field] = "tooLong";
    return v;
  };

  const clientName = text("clientName", BOOKING_LIMITS.clientName, true);
  const clientPhone = text("clientPhone", BOOKING_LIMITS.clientPhone);
  if (clientPhone && !errors.clientPhone && !/^[+\d][\d\s().-]{5,}$/.test(clientPhone)) errors.clientPhone = "invalid";

  const tripType = TRIP_TYPES.includes(r.tripType as TripType) ? (r.tripType as TripType) : null;
  if (!tripType) errors.tripType = r.tripType ? "invalid" : "required";

  const vehicleId = typeof r.vehicleId === "string" && VEHICLES.some((v) => v.id === r.vehicleId) ? r.vehicleId : null;
  if (!vehicleId) errors.vehicleId = r.vehicleId ? "invalid" : "required";

  const pickup = text("pickup", BOOKING_LIMITS.pickup);
  const destination = text("destination", BOOKING_LIMITS.destination);

  const startDate = isIsoDate(r.startDate) ? r.startDate : "";
  if (!startDate) errors.startDate = r.startDate ? "invalid" : "required";
  let endDate: string | null = null;
  if (r.endDate !== null && r.endDate !== undefined && r.endDate !== "") {
    if (!isIsoDate(r.endDate)) errors.endDate = "invalid";
    else if (startDate && r.endDate < startDate) errors.endDate = "endBeforeStart";
    else endDate = r.endDate === startDate ? null : r.endDate;
  }

  const time = typeof r.time === "string" ? r.time.trim() : "";
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) errors.time = "invalid";

  const passengers = r.passengers === undefined || r.passengers === "" ? 1 : Number(r.passengers);
  if (!Number.isInteger(passengers) || passengers < 1 || passengers > BOOKING_LIMITS.maxPassengers) {
    errors.passengers = "invalid";
  }

  const totalRaw = typeof r.grandTotal === "string" ? r.grandTotal.replace(/[\s,]/g, "") : r.grandTotal;
  const grandTotal = totalRaw === "" || totalRaw === undefined || totalRaw === null ? NaN : Number(totalRaw);
  if (Number.isNaN(grandTotal)) errors.grandTotal = "required";
  else if (!Number.isInteger(grandTotal) || grandTotal < 0 || grandTotal > BOOKING_LIMITS.maxTotal) errors.grandTotal = "invalid";

  const status = r.status === undefined ? "pending" : (r.status as BookingStatus);
  if (!BOOKING_STATUSES.includes(status)) errors.status = "invalid";

  const notes = paragraph(r.notes);
  if (notes.length > BOOKING_LIMITS.notes) errors.notes = "tooLong";

  if (Object.keys(errors).length || !tripType || !vehicleId) return { ok: false, errors };

  // A driver is part of airport, cab and private trips, and of every trip in a with-driver-only class.
  const driverChoice = DRIVER_OPTION_TRIPS.includes(tripType) && getVehicle(vehicleId).selfDrive;
  const withDriver = driverChoice ? r.withDriver !== false : true;

  return {
    ok: true,
    value: {
      clientName, clientPhone, tripType, vehicleId, withDriver, pickup, destination,
      startDate, endDate, time, passengers, grandTotal, status, notes,
    },
  };
}

/* ─── dates ──────────────────────────────────────────────────────────── */

const KIGALI_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Kigali", year: "numeric", month: "2-digit", day: "2-digit",
});
/** Today in Kigali as YYYY-MM-DD, whatever time zone the server or browser is in. */
export const kigaliToday = (now = new Date()) => KIGALI_DATE.format(now);

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Last day of the trip (the start date for single-day trips). */
export const lastDay = (b: Pick<Booking, "startDate" | "endDate">) => b.endDate ?? b.startDate;

/** Days the trip covers, counting both ends. */
export function tripDays(b: Pick<Booking, "startDate" | "endDate">): number {
  if (!b.endDate) return 1;
  return Math.round((Date.parse(`${b.endDate}T00:00:00Z`) - Date.parse(`${b.startDate}T00:00:00Z`)) / 86_400_000) + 1;
}

/* ─── dashboard figures ──────────────────────────────────────────────── */

export type BookingSummary = {
  total: number;
  thisMonth: number;
  /** Grand totals of completed trips that started this month. */
  revenueMonth: number;
  /** Grand totals of confirmed trips not completed yet. */
  confirmedValue: number;
  /** Confirmed trips on the road today. */
  activeToday: number;
  /** Pending or confirmed trips starting in the next 7 days (today included). */
  startingThisWeek: number;
  pending: number;
  byStatus: Record<BookingStatus, number>;
  /** Next trips, soonest first. */
  upcoming: Booking[];
  /** Last bookings logged, newest first. */
  recent: Booking[];
};

export function summarizeBookings(list: Booking[], today: string): BookingSummary {
  const month = today.slice(0, 7);
  const weekEnd = addDays(today, 6);
  const byStatus = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, 0])) as Record<BookingStatus, number>;
  let thisMonth = 0, revenueMonth = 0, confirmedValue = 0, activeToday = 0, startingThisWeek = 0;

  for (const b of list) {
    byStatus[b.status] += 1;
    const inMonth = b.startDate.slice(0, 7) === month;
    if (inMonth && b.status !== "cancelled") thisMonth += 1;
    if (inMonth && b.status === "completed") revenueMonth += b.grandTotal;
    if (b.status === "confirmed") confirmedValue += b.grandTotal;
    if (b.status === "confirmed" && b.startDate <= today && lastDay(b) >= today) activeToday += 1;
    if ((b.status === "pending" || b.status === "confirmed") && b.startDate >= today && b.startDate <= weekEnd) {
      startingThisWeek += 1;
    }
  }

  const upcoming = list
    .filter((b) => (b.status === "pending" || b.status === "confirmed") && lastDay(b) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.time.localeCompare(b.time))
    .slice(0, 5);
  const recent = [...list].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);

  return {
    total: list.length, thisMonth, revenueMonth, confirmedValue, activeToday, startingThisWeek,
    pending: byStatus.pending, byStatus, upcoming, recent,
  };
}

/* ─── search & export ────────────────────────────────────────────────── */

/** Case- and accent-insensitive search over the text fields. */
export function matchesSearch(b: Booking, query: string): boolean {
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const q = norm(query.trim());
  if (!q) return true;
  return norm([b.clientName, b.clientPhone, b.pickup, b.destination, b.notes, b.id].join(" ")).includes(q);
}

/** RFC 4180 CSV. Cells that start with = + - @ are prefixed so spreadsheets don't run them as formulas. */
export function bookingsToCsv(list: Booking[], headers: Record<string, string>, labels: {
  tripType: (t: TripType) => string;
  status: (s: BookingStatus) => string;
  vehicle: (id: string) => string;
  driver: (withDriver: boolean) => string;
}): string {
  const cell = (v: string | number) => {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const columns: [string, (b: Booking) => string | number][] = [
    ["id", (b) => b.id],
    ["clientName", (b) => b.clientName],
    ["clientPhone", (b) => b.clientPhone],
    ["tripType", (b) => labels.tripType(b.tripType)],
    ["vehicle", (b) => labels.vehicle(b.vehicleId)],
    ["driver", (b) => labels.driver(b.withDriver)],
    ["pickup", (b) => b.pickup],
    ["destination", (b) => b.destination],
    ["startDate", (b) => b.startDate],
    ["endDate", (b) => b.endDate ?? ""],
    ["time", (b) => b.time],
    ["passengers", (b) => b.passengers],
    ["grandTotal", (b) => b.grandTotal],
    ["status", (b) => labels.status(b.status)],
    ["notes", (b) => b.notes],
    ["createdAt", (b) => new Date(b.createdAt).toISOString()],
  ];
  const head = columns.map(([key]) => cell(headers[key] ?? key)).join(",");
  const rows = list.map((b) => columns.map(([, get]) => cell(get(b))).join(","));
  return [head, ...rows].join("\r\n");
}
