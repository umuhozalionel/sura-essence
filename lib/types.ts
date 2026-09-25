/**
 * Shared booking types — used by the admin portal (browser) and the admin API
 * (server). Bookings arrive on WhatsApp and are logged by hand in /admin/bookings;
 * they're stored in MongoDB (collection "bookings", see lib/admin-bookings.ts).
 */

export const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Matches the ways lib/pricing.ts prices a trip. */
export const TRIP_TYPES = ["airport", "cab", "private", "hourly", "long"] as const;
export type TripType = (typeof TRIP_TYPES)[number];

/** Trip types where the customer chooses With Driver or Self-Drive. */
export const DRIVER_OPTION_TRIPS: readonly TripType[] = ["hourly", "long"];

export type Booking = {
  id: string;
  clientName: string;
  /** WhatsApp / phone number, as the customer sent it. */
  clientPhone: string;
  tripType: TripType;
  /** A vehicle class id from lib/pricing.ts (VEHICLES). */
  vehicleId: string;
  /** Only meaningful for hourly and long trips; always true otherwise. */
  withDriver: boolean;
  pickup: string;
  destination: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD for multi-day trips, otherwise null. */
  endDate: string | null;
  /** HH:MM, or "" when not agreed yet. */
  time: string;
  passengers: number;
  /** The Grand Total quoted to the customer, RWF. */
  grandTotal: number;
  status: BookingStatus;
  notes: string;
  /** ms since epoch */
  createdAt: number;
  updatedAt: number;
};

/** What an admin fills in — everything except the ids and timestamps. */
export type BookingInput = Omit<Booking, "id" | "createdAt" | "updatedAt">;
