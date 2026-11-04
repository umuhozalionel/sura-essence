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
  BOOKING_BRANDS, BOOKING_SERVICES, BOOKING_STATUSES, BUDGET_BANDS, DRIVER_OPTION_TRIPS, NO_VEHICLE_SERVICES,
  QUOTE_ON_REQUEST_SERVICES, SERVICE_BRAND, TRIP_TYPES,
  type Booking, type BookingBrand, type BookingDetails, type BookingInput, type BookingService, type BookingStatus,
  type BudgetBand, type TripType,
} from "./types";

export const BOOKING_LIMITS = {
  clientName: 80,
  clientPhone: 30,
  pickup: 120,
  destination: 120,
  notes: 1000,
  company: 120,
  interests: 500,
  /** Experience, package and tour ids and titles. */
  detailText: 160,
  /** Vehicles, trips or guests on one request. */
  maxCount: 500,
  maxPassengers: 60,
  /** 100 million RWF — anything above is almost certainly a typo. */
  maxTotal: 100_000_000,
} as const;

export type BookingField = keyof BookingInput | `details.${keyof BookingDetails}`;
export type FieldError = "required" | "tooLong" | "invalid" | "endBeforeStart";
export type ParsedBooking =
  | { ok: true; value: BookingInput }
  | { ok: false; errors: Partial<Record<BookingField, FieldError>> };

/** The brand that runs a service. Every booking's brand comes from here, on the server. */
export const brandForService = (service: BookingService): BookingBrand => SERVICE_BRAND[service];

/** The services someone who may see these brands can log. */
export const servicesFor = (brands: readonly BookingBrand[]): BookingService[] =>
  BOOKING_SERVICES.filter((s) => brands.includes(SERVICE_BRAND[s]));

export const isBookingBrand = (v: unknown): v is BookingBrand => BOOKING_BRANDS.includes(v as BookingBrand);
export const isBookingService = (v: unknown): v is BookingService => BOOKING_SERVICES.includes(v as BookingService);
/** Whether a service is a car booking (trip type, vehicle class). Old bookings without a service are. */
export const needsVehicle = (service: BookingService | null) => !service || !NO_VEHICLE_SERVICES.includes(service);
export const isQuoteOnRequest = (service: BookingService | null) => !!service && QUOTE_ON_REQUEST_SERVICES.includes(service);

/** A blank booking for the "Log a booking" form. */
export function emptyBooking(today: string, service: BookingService = "airport"): BookingInput {
  return {
    brand: brandForService(service),
    service,
    details: {},
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
 * The details a service uses, checked and tidied; everything else is dropped.
 * Problems are reported as "details.<key>".
 */
export function parseBookingDetails(
  raw: unknown,
  service: BookingService | null,
  errors: Partial<Record<BookingField, FieldError>>,
): BookingDetails {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: BookingDetails = {};
  type TextKey = "company" | "experienceId" | "experienceTitle" | "packageId" | "packageTitle" | "tourId" | "tripId" | "tripPackage" | "tripVehicle";
  const text = (key: TextKey, max: number, required = false) => {
    const v = oneLine(r[key]);
    if (required && !v) errors[`details.${key}`] = "required";
    else if (v.length > max) errors[`details.${key}`] = "tooLong";
    else if (v) out[key] = v;
  };
  const count = (key: "vehicles" | "trips" | "guests", required = false) => {
    if (r[key] === undefined || r[key] === null || r[key] === "") {
      if (required) errors[`details.${key}`] = "required";
      return;
    }
    const n = Number(r[key]);
    if (!Number.isInteger(n) || n < 1 || n > BOOKING_LIMITS.maxCount) errors[`details.${key}`] = "invalid";
    else out[key] = n;
  };

  switch (service) {
    case "corporate":
      text("company", BOOKING_LIMITS.company, true);
      count("vehicles");
      count("trips");
      break;
    case "package":
      // The website sends the experience's id; an admin logging one by hand types its name.
      text("experienceId", BOOKING_LIMITS.detailText);
      text("experienceTitle", BOOKING_LIMITS.detailText, !oneLine(r.experienceId));
      text("packageId", BOOKING_LIMITS.detailText);
      text("packageTitle", BOOKING_LIMITS.detailText);
      count("guests", true);
      break;
    case "city_tour":
      text("tourId", BOOKING_LIMITS.detailText);
      break;
    case "tailored_trip":
      text("tripId", BOOKING_LIMITS.detailText);
      text("tripPackage", BOOKING_LIMITS.detailText);
      text("tripVehicle", BOOKING_LIMITS.detailText);
      count("guests");
      break;
    case "custom_itinerary": {
      const interests = paragraph(r.interests);
      if (interests.length > BOOKING_LIMITS.interests) errors["details.interests"] = "tooLong";
      else if (interests) out.interests = interests;
      if (r.budget !== undefined && r.budget !== null && r.budget !== "") {
        if (BUDGET_BANDS.includes(r.budget as BudgetBand)) out.budget = r.budget as BudgetBand;
        else errors["details.budget"] = "invalid";
      }
      break;
    }
  }
  return out;
}

/**
 * Checks and tidies a booking. Unknown fields are dropped, text is trimmed,
 * and the driver option is forced on where the trip or the class needs one.
 *
 * The brand is never read from `raw` when there is a service: it follows from
 * the service. Bookings from before services existed keep the brand they have.
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

  // The service decides the brand and which of the other fields are needed.
  let service: BookingService | null = null;
  if (r.service !== undefined && r.service !== null && r.service !== "") {
    if (isBookingService(r.service)) service = r.service;
    else errors.service = "invalid";
  }
  const brand: BookingBrand = service ? brandForService(service) : isBookingBrand(r.brand) ? r.brand : "movana";
  const withVehicle = needsVehicle(service);

  let tripType: TripType | null = null;
  let vehicleId = "";
  if (withVehicle) {
    tripType = TRIP_TYPES.includes(r.tripType as TripType) ? (r.tripType as TripType) : null;
    if (!tripType) errors.tripType = r.tripType ? "invalid" : "required";
    vehicleId = typeof r.vehicleId === "string" && VEHICLES.some((v) => v.id === r.vehicleId) ? r.vehicleId : "";
    if (!vehicleId) errors.vehicleId = r.vehicleId ? "invalid" : "required";
  }

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
  const blankTotal = totalRaw === "" || totalRaw === undefined || totalRaw === null;
  // Corporate and custom itinerary requests may wait for the team's quote.
  const grandTotal: number | null = blankTotal ? (isQuoteOnRequest(service) ? null : NaN) : Number(totalRaw);
  if (grandTotal !== null) {
    if (Number.isNaN(grandTotal)) errors.grandTotal = blankTotal ? "required" : "invalid";
    else if (!Number.isInteger(grandTotal) || grandTotal < 0 || grandTotal > BOOKING_LIMITS.maxTotal) errors.grandTotal = "invalid";
  }

  const status = r.status === undefined ? "pending" : (r.status as BookingStatus);
  if (!BOOKING_STATUSES.includes(status)) errors.status = "invalid";

  const notes = paragraph(r.notes);
  if (notes.length > BOOKING_LIMITS.notes) errors.notes = "tooLong";

  const details = parseBookingDetails(r.details, service, errors);

  if (Object.keys(errors).length || (withVehicle && (!tripType || !vehicleId))) return { ok: false, errors };

  // A driver is part of airport, cab and private trips, and of every trip in a with-driver-only class.
  const driverChoice = !!tripType && DRIVER_OPTION_TRIPS.includes(tripType) && getVehicle(vehicleId).selfDrive;
  const withDriver = driverChoice ? r.withDriver !== false : true;

  return {
    ok: true,
    value: {
      brand, service, clientName, clientPhone, tripType, vehicleId, withDriver, pickup, destination,
      startDate, endDate, time, passengers, grandTotal, status, notes, details,
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
  /** revenueMonth, by brand. */
  revenueByBrand: Record<BookingBrand, number>;
  /** Pending or confirmed requests still waiting for the team's quote (no total yet). */
  awaitingQuote: number;
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
  const revenueByBrand = Object.fromEntries(BOOKING_BRANDS.map((b) => [b, 0])) as Record<BookingBrand, number>;
  let thisMonth = 0, revenueMonth = 0, confirmedValue = 0, activeToday = 0, startingThisWeek = 0, awaitingQuote = 0;

  for (const b of list) {
    byStatus[b.status] += 1;
    const inMonth = b.startDate.slice(0, 7) === month;
    if (inMonth && b.status !== "cancelled") thisMonth += 1;
    const total = b.grandTotal ?? 0;
    if (inMonth && b.status === "completed") {
      revenueMonth += total;
      revenueByBrand[b.brand] += total;
    }
    if (b.status === "confirmed") confirmedValue += total;
    if (b.grandTotal === null && (b.status === "pending" || b.status === "confirmed")) awaitingQuote += 1;
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
    total: list.length, thisMonth, revenueMonth, revenueByBrand, awaitingQuote, confirmedValue, activeToday, startingThisWeek,
    pending: byStatus.pending, byStatus, upcoming, recent,
  };
}

/* ─── search & export ────────────────────────────────────────────────── */

/** Case- and accent-insensitive search over the text fields. */
export function matchesSearch(b: Booking, query: string): boolean {
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const q = norm(query.trim());
  if (!q) return true;
  const d = b.details;
  return norm(
    [b.clientName, b.clientPhone, b.pickup, b.destination, b.notes, b.id, d.company, d.experienceTitle, d.packageTitle, d.interests]
      .filter(Boolean)
      .join(" "),
  ).includes(q);
}

/** RFC 4180 CSV. Cells that start with = + - @ are prefixed so spreadsheets don't run them as formulas. */
export function bookingsToCsv(list: Booking[], headers: Record<string, string>, labels: {
  brand: (b: BookingBrand) => string;
  service: (s: BookingService | null) => string;
  tripType: (t: TripType | null) => string;
  status: (s: BookingStatus) => string;
  vehicle: (id: string) => string;
  fuel: (vehicleId: string) => string;
  driver: (withDriver: boolean) => string;
}): string {
  const cell = (v: string | number) => {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const columns: [string, (b: Booking) => string | number][] = [
    ["id", (b) => b.id],
    ["brand", (b) => labels.brand(b.brand)],
    ["service", (b) => labels.service(b.service)],
    ["clientName", (b) => b.clientName],
    ["clientPhone", (b) => b.clientPhone],
    ["tripType", (b) => labels.tripType(b.tripType)],
    ["vehicle", (b) => labels.vehicle(b.vehicleId)],
    ["fuel", (b) => labels.fuel(b.vehicleId)],
    ["driver", (b) => labels.driver(b.withDriver)],
    ["pickup", (b) => b.pickup],
    ["destination", (b) => b.destination],
    ["startDate", (b) => b.startDate],
    ["endDate", (b) => b.endDate ?? ""],
    ["time", (b) => b.time],
    ["passengers", (b) => b.passengers],
    ["grandTotal", (b) => b.grandTotal ?? ""],
    ["status", (b) => labels.status(b.status)],
    ["notes", (b) => b.notes],
    ["details", (b) => Object.entries(b.details).map(([k, v]) => `${k}: ${v}`).join("; ")],
    ["createdAt", (b) => new Date(b.createdAt).toISOString()],
  ];
  const head = columns.map(([key]) => cell(headers[key] ?? key)).join(",");
  const rows = list.map((b) => columns.map(([, get]) => cell(get(b))).join(","));
  return [head, ...rows].join("\r\n");
}
