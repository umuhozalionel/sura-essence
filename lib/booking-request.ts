/**
 * A booking request from the public booking forms (components/booking-form.tsx),
 * for SURA Movana (/movana/book) and SURA Iwacu (/iwacu/reserve).
 *
 * Safe to import in the browser. The form builds a BookingRequest and POSTs it
 * to /api/bookings; the server prices it again with quoteRequest() (the total
 * the browser shows is never trusted) and turns it into an admin Booking with
 * toBookingInput(), which then goes through the same parseBooking() check as
 * a booking an admin types in.
 */
import {
  DEFAULT_PRICING,
  getVehicle,
  quote,
  routeDistanceKm,
  trips,
  type CityRideMode,
  type PriceNoteKind,
  type PricingConfig,
  type PricingMethod,
  type Quote,
  type Trip,
} from "./pricing";
import { BOOKING_LIMITS, isBookingService } from "./bookings";
import { BUDGET_BANDS, type BookingService, type BudgetBand } from "./types";

export type { BookingService };

/** A place the customer picked: its name, and where it is. */
export interface Place {
  name: string;
  coords: [number, number] | null;
}

/** When a service starts or a return ride picks up. */
export interface Schedule {
  date: string;
  time: string;
}

/**
 * Everything a booking request says, as plain data. Field names follow the
 * admin Booking type (lib/types.ts) where they overlap.
 */
export interface BookingRequest {
  service: BookingService;
  /** How the browser priced it. The server prices it again. */
  tripType: PricingMethod | null;
  vehicleId: string;
  withDriver: boolean;
  /** A to B only. */
  rideMode: CityRideMode | null;
  passengers: number;
  /** Transfers and trips only. */
  luggage: string | null;
  pickup: Place;
  stops: Place[];
  /** Airport / A to B drop-off. */
  dropoff: Place | null;
  /** Drop-off address, tour name, trip destination or experience, for people; "" for hourly hire. */
  destination: string;
  /** Trips: a destination id from lib/pricing.ts. */
  destinationId: string | null;
  /** Tours venue id, for tours booked from a tour page. */
  tourId: string | null;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD for multi-day services or a dated return, otherwise null. */
  endDate: string | null;
  /** HH:MM */
  time: string;
  days: number | null;
  hours: number | null;
  flightNumber: string | null;
  returnTrip: boolean;
  /** City transfers: when to pick the customer up again. */
  returnLeg: Schedule | null;
  clientName: string;
  clientPhone: string;
  hotel: string;
  notes: string;
  /** Corporate: the company, and roughly how many vehicles and trips. */
  company: string;
  vehicles: number | null;
  tripsCount: number | null;
  /** Packages: the experience's slug, the package id and how many guests. */
  experienceId: string | null;
  packageId: string | null;
  guests: number | null;
  /** Custom itineraries: what they'd like to do, and a budget band. */
  interests: string;
  budget: BudgetBand | null;
  /** RWF, as shown in the browser; null until the form had enough to price, and for requests the team quotes. */
  grandTotal: number | null;
  priceNote: PriceNoteKind;
  /** The pricing revision the browser quoted with (0 = built-in rates). */
  pricingRevision: number | null;
}

/** What pricing needs from a request. The form builds this from its own state, too. */
export type PricingFields = Pick<
  BookingRequest,
  "service" | "rideMode" | "withDriver" | "hours" | "destinationId" | "days" | "returnTrip" | "pickup" | "stops" | "dropoff"
>;

/** The trip to price, or null when there isn't enough yet (e.g. no destination) or nothing to price by car. */
export function tripFor(f: PricingFields): Trip | null {
  switch (f.service) {
    case "corporate":
    case "package":
    case "custom_itinerary":
      return null;
    case "airport":
      return trips.airport({ returnTrip: f.returnTrip });
    case "inter_city": {
      // Real route distance once both ends are picked; a typical distance until then.
      const from = f.pickup.coords;
      const to = f.dropoff?.coords ?? null;
      const route = from && to
        ? routeDistanceKm([from, ...f.stops.flatMap((s) => (s.coords ? [s.coords] : [])), to])
        : null;
      return trips.cityRide(f.rideMode ?? "cab", route, { returnTrip: f.returnTrip });
    }
    case "city_tour":
      return trips.destination("kigali", { withDriver: f.withDriver, days: f.days ?? 1 });
    case "hourly":
      return f.hours ? trips.hourly(f.hours, { withDriver: f.withDriver }) : null;
    case "trip":
      return f.destinationId
        ? trips.destination(f.destinationId, { withDriver: f.withDriver, returnTrip: f.returnTrip, days: f.days ?? 1 })
        : null;
  }
}

/** The price of a request at the rates in `cfg` (the active version on the website; today's built-in rates by default). */
export function quoteRequest(f: PricingFields, vehicleId: string, cfg: PricingConfig = DEFAULT_PRICING): Quote | null {
  const trip = tripFor(f);
  return trip ? quote(trip, vehicleId, cfg) : null;
}

/* ─── checking what the browser sent ─────────────────────────────────── */

const MAX_TEXT = 300;

const str = (v: unknown, max = MAX_TEXT) => (typeof v === "string" ? v.slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const int = (v: unknown, min: number, max: number) => {
  const n = num(v);
  return n !== null && Number.isInteger(n) && n >= min && n <= max ? n : null;
};

function place(v: unknown): Place {
  const r = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const c = Array.isArray(r.coords) ? r.coords : null;
  const lat = num(c?.[0]);
  const lon = num(c?.[1]);
  const coords: [number, number] | null =
    lat !== null && lon !== null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? [lat, lon] : null;
  return { name: str(r.name), coords };
}

/**
 * A request rebuilt from untrusted JSON: only known fields, of the right type.
 * Whether it makes a valid booking is decided later by parseBooking().
 */
export function readBookingRequest(body: unknown): BookingRequest | null {
  const r = (body && typeof body === "object" ? body : null) as Record<string, unknown> | null;
  if (!r || !isBookingService(r.service)) return null;
  const returnLeg = r.returnLeg && typeof r.returnLeg === "object" ? (r.returnLeg as Record<string, unknown>) : null;
  const priceNote = r.priceNote;
  return {
    service: r.service as BookingService,
    tripType: null,
    vehicleId: str(r.vehicleId, 40),
    withDriver: r.withDriver !== false,
    rideMode: r.rideMode === "cab" || r.rideMode === "private" ? r.rideMode : null,
    passengers: int(r.passengers, 1, BOOKING_LIMITS.maxPassengers) ?? 1,
    luggage: r.luggage ? str(r.luggage, 20) : null,
    pickup: place(r.pickup),
    stops: Array.isArray(r.stops) ? r.stops.slice(0, 10).map(place) : [],
    dropoff: r.dropoff ? place(r.dropoff) : null,
    destination: str(r.destination),
    destinationId: r.destinationId ? str(r.destinationId, 40) : null,
    tourId: r.tourId ? str(r.tourId, 40) : null,
    startDate: str(r.startDate, 10),
    endDate: r.endDate ? str(r.endDate, 10) : null,
    time: str(r.time, 5),
    days: int(r.days, 1, 60),
    hours: int(r.hours, 1, 24),
    flightNumber: r.flightNumber ? str(r.flightNumber, 20) : null,
    returnTrip: r.returnTrip === true,
    returnLeg: returnLeg ? { date: str(returnLeg.date, 10), time: str(returnLeg.time, 5) } : null,
    company: str(r.company, BOOKING_LIMITS.company),
    vehicles: int(r.vehicles, 1, BOOKING_LIMITS.maxCount),
    tripsCount: int(r.tripsCount, 1, BOOKING_LIMITS.maxCount),
    experienceId: r.experienceId ? str(r.experienceId, 120) : null,
    packageId: r.packageId ? str(r.packageId, 120) : null,
    guests: int(r.guests, 1, BOOKING_LIMITS.maxCount),
    interests: str(r.interests, BOOKING_LIMITS.interests),
    budget: BUDGET_BANDS.includes(r.budget as BudgetBand) ? (r.budget as BudgetBand) : null,
    clientName: str(r.clientName),
    clientPhone: str(r.clientPhone),
    hotel: str(r.hotel),
    notes: str(r.notes, BOOKING_LIMITS.notes),
    grandTotal: num(r.grandTotal),
    priceNote: priceNote === "fixedFare" || priceNote === "selfDrive" || priceNote === "withDriver" ? priceNote : "withDriver",
    pricingRevision: int(r.pricingRevision, 0, 1_000_000_000),
  };
}

/* ─── into an admin booking ──────────────────────────────────────────── */

// The first line of a website booking's notes. lib/admin-bookings.ts reads the
// first five back for bookings saved before the service was stored on its own.
const SERVICE_NAMES: Record<BookingService, string> = {
  airport: "Airport transfer",
  inter_city: "City ride (A to B)",
  city_tour: "City tour",
  hourly: "Hourly hire",
  trip: "Country trip",
  corporate: "Corporate request",
  package: "Experience package",
  custom_itinerary: "Custom itinerary",
};

/** A package priced on the server (quotePackage in lib/cms/site-data.ts). */
export type PackagePrice = { experienceTitle: string; packageId: string; packageTitle: string; currency: "RWF" | "USD"; total: number };

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/**
 * The admin Booking for a request, priced by `q` (the server's own quote) for
 * car services, or by `pkg` for packages; corporate and custom itinerary
 * requests have no total yet. What has no field of its own (flight, luggage,
 * stops, hotel, the customer's notes) goes in the notes.
 */
export function toBookingInput(r: BookingRequest, q: Quote | null, pkg: PackagePrice | null = null) {
  const extras = [
    `Booked on the website · ${SERVICE_NAMES[r.service]}`,
    r.rideMode ? `Ride type: ${r.rideMode === "cab" ? "Cab" : "Private"}` : null,
    r.hours ? `Hours: ${r.hours}` : null,
    r.days && r.days > 1 ? `Days: ${r.days}` : null,
    r.flightNumber ? `Flight: ${r.flightNumber}` : null,
    r.luggage ? `Luggage: ${r.luggage}` : null,
    r.stops.length ? `Stops: ${r.stops.map((s) => s.name).filter(Boolean).join(" → ")}` : null,
    r.returnLeg
      ? `Return: ${r.returnLeg.date || "?"} at ${r.returnLeg.time || "?"}`
      : r.returnTrip ? "Return: back to pickup" : null,
    r.hotel ? `Hotel: ${r.hotel}` : null,
    // A package priced in another currency: the team converts it when they confirm.
    pkg && pkg.currency !== "RWF" ? `Price: ${pkg.total} ${pkg.currency} (${r.guests ?? 1} guests)` : null,
    r.notes ? `\nCustomer notes:\n${r.notes}` : null,
  ].filter(Boolean);

  const destination =
    r.service === "city_tour" ? r.destination || "Kigali city tour" :
    r.service === "hourly" ? "" :
    r.service === "package" ? pkg?.experienceTitle ?? r.destination :
    r.service === "corporate" || r.service === "custom_itinerary" ? r.destination :
    r.destination;

  const details =
    r.service === "corporate" ? { company: r.company, vehicles: r.vehicles, trips: r.tripsCount } :
    r.service === "package" ? {
      experienceId: r.experienceId, experienceTitle: pkg?.experienceTitle, packageId: pkg?.packageId, packageTitle: pkg?.packageTitle,
      guests: r.guests ?? 1,
    } :
    r.service === "custom_itinerary" ? { interests: r.interests, budget: r.budget } :
    r.service === "city_tour" ? { tourId: r.tourId } :
    {};

  return {
    // The brand isn't sent: parseBooking() works it out from the service.
    service: r.service,
    details,
    clientName: r.clientName,
    clientPhone: r.clientPhone,
    tripType: q?.method ?? null,
    vehicleId: q && getVehicle(r.vehicleId).id === r.vehicleId ? r.vehicleId : "",
    withDriver: q?.withDriver ?? true,
    pickup: clip(r.pickup.name, BOOKING_LIMITS.pickup),
    destination: clip(destination, BOOKING_LIMITS.destination),
    startDate: r.startDate,
    endDate: r.endDate,
    time: r.time,
    passengers: r.service === "package" ? Math.min(r.guests ?? 1, BOOKING_LIMITS.maxPassengers) : r.passengers,
    grandTotal: q ? q.total : pkg && pkg.currency === "RWF" ? pkg.total : null,
    status: "pending" as const,
    notes: clip(extras.join("\n"), BOOKING_LIMITS.notes),
  };
}
