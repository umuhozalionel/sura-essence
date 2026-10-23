/**
 * A booking request from the public booking form (components/booking-form.tsx).
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
import { BOOKING_LIMITS } from "./bookings";

export type BookingService = "airport" | "inter_city" | "city_tour" | "hourly" | "trip";
export const BOOKING_SERVICES: readonly BookingService[] = ["airport", "inter_city", "city_tour", "hourly", "trip"];

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
  /** Drop-off address, tour name or trip destination, for people; "" for hourly hire. */
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
  /** RWF, as shown in the browser; null until the form had enough to price. */
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

/** The trip to price, or null when there isn't enough yet (e.g. no destination). */
export function tripFor(f: PricingFields): Trip | null {
  switch (f.service) {
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
  if (!r || !BOOKING_SERVICES.includes(r.service as BookingService)) return null;
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

const SERVICE_NAMES: Record<BookingService, string> = {
  airport: "Airport transfer",
  inter_city: "City ride (A to B)",
  city_tour: "City tour",
  hourly: "Hourly hire",
  trip: "Country trip",
};

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/**
 * The admin Booking for a request, priced by `q` (the server's own quote).
 * An admin Booking has one notes field, so everything it has no column for
 * (service, flight, luggage, stops, hotel, the customer's notes) goes there.
 */
export function toBookingInput(r: BookingRequest, q: Quote) {
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
    r.notes ? `\nCustomer notes:\n${r.notes}` : null,
  ].filter(Boolean);

  const destination =
    r.service === "city_tour" ? r.destination || "Kigali city tour" :
    r.service === "hourly" ? "" :
    r.destination;

  return {
    clientName: r.clientName,
    clientPhone: r.clientPhone,
    tripType: q.method,
    vehicleId: getVehicle(r.vehicleId).id === r.vehicleId ? r.vehicleId : "",
    withDriver: q.withDriver,
    pickup: clip(r.pickup.name, BOOKING_LIMITS.pickup),
    destination: clip(destination, BOOKING_LIMITS.destination),
    startDate: r.startDate,
    endDate: r.endDate,
    time: r.time,
    passengers: r.passengers,
    grandTotal: q.total,
    status: "pending" as const,
    notes: clip(extras.join("\n"), BOOKING_LIMITS.notes),
  };
}
