/**
 * Sending a booking from the website: shared by the car booking form
 * (components/booking-form.tsx) and the request forms (components/booking-requests.tsx).
 * Safe in the browser only.
 */
import type { BookingRequest } from "@/lib/booking-request";
import type { BookingBrand, BookingService } from "@/lib/types";

/** How long to wait for the database before opening WhatsApp anyway. */
const SAVE_TIMEOUT_MS = 8000;

/**
 * The saved booking: its id, and the server's total (null = the team sends a quote).
 * tripQuote: a tailored trip's price as the server worked it out, unchecked (the trip builder reads it).
 */
export type Saved = { id: string; total: number | null; changed: boolean; tripQuote: unknown };

/**
 * Saves the request in MongoDB through /api/bookings. Returns the booking id,
 * or null if it couldn't be saved; never throws, so WhatsApp always follows.
 */
export async function saveBooking(request: BookingRequest): Promise<Saved | null> {
  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(SAVE_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn("[booking] not saved:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { id?: unknown; total?: unknown; changed?: unknown; tripQuote?: unknown };
    if (typeof data.id !== "string") return null;
    return { id: data.id, total: typeof data.total === "number" ? data.total : null, changed: data.changed === true, tripQuote: data.tripQuote ?? null };
  } catch (err) {
    console.warn("[booking] not saved:", err);
    return null;
  }
}

/** A short reference the customer and the team can quote ("A1B2C3"). */
export const bookingRef = (id: string) => id.slice(-6).toUpperCase();

/** Same rule as the admin check (lib/bookings.ts). */
export const PHONE = /^[+\d][\d\s().-]{5,}$/;

/** Every field a request has, empty: each form fills in what its service uses. */
export const EMPTY_REQUEST: Omit<BookingRequest, "service"> = {
  tripType: null, vehicleId: "", withDriver: true, rideMode: null, passengers: 1, luggage: null,
  pickup: { name: "", coords: null }, stops: [], dropoff: null, destination: "", destinationId: null, tourId: null,
  startDate: "", endDate: null, time: "", days: null, hours: null, flightNumber: null, returnTrip: false, returnLeg: null,
  company: "", vehicles: null, tripsCount: null, experienceId: null, packageId: null, guests: null, interests: "", budget: null, tripPlan: null,
  clientName: "", clientPhone: "", hotel: "", notes: "", grandTotal: null, priceNote: "withDriver", pricingRevision: null,
};

/**
 * Where a brand's booking ends up once it's sent: its own confirmation page,
 * with the reference, the service and the first day (for the cross-sell).
 */
export function confirmationHref(brand: BookingBrand, ref: string | null, service: BookingService, date: string): string {
  const base = brand === "iwacu" ? "/iwacu/reserve/confirmation" : "/movana/book/confirmation";
  const q = new URLSearchParams({ service, ...(ref && { ref }), ...(/^\d{4}-\d{2}-\d{2}$/.test(date) && { date }) });
  return `${base}?${q.toString()}`;
}
