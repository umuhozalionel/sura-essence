/**
 * Shared booking types — used by the admin portal (browser) and the admin API
 * (server). Bookings come from the website forms or are logged by hand in
 * /admin/bookings; they're stored in MongoDB (collection "bookings", see
 * lib/admin-bookings.ts).
 */

export const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Matches the ways lib/pricing.ts prices a trip. */
export const TRIP_TYPES = ["airport", "cab", "private", "hourly", "long"] as const;
export type TripType = (typeof TRIP_TYPES)[number];

/** Trip types where the customer chooses With Driver or Self-Drive. */
export const DRIVER_OPTION_TRIPS: readonly TripType[] = ["hourly", "long"];

/** The brand a booking belongs to. Always worked out on the server from its service. */
export const BOOKING_BRANDS = ["movana", "iwacu"] as const;
export type BookingBrand = (typeof BOOKING_BRANDS)[number];

/**
 * What was booked. SURA Movana: airport transfers, A to B rides, driver hire
 * and corporate requests. SURA Iwacu: Kigali tours, trips to a destination,
 * experience packages, custom itineraries and tailored trips.
 */
export const BOOKING_SERVICES = [
  "airport", "inter_city", "hourly", "corporate",
  "city_tour", "trip", "package", "custom_itinerary", "tailored_trip",
] as const;
export type BookingService = (typeof BOOKING_SERVICES)[number];

/** Which brand runs each service. The one place this is decided (see brandForService in lib/bookings.ts). */
export const SERVICE_BRAND: Record<BookingService, BookingBrand> = {
  airport: "movana",
  inter_city: "movana",
  hourly: "movana",
  corporate: "movana",
  city_tour: "iwacu",
  trip: "iwacu",
  package: "iwacu",
  custom_itinerary: "iwacu",
  tailored_trip: "iwacu",
};

/** Services with no car class or route to price: no trip type or vehicle. */
export const NO_VEHICLE_SERVICES: readonly BookingService[] = ["corporate", "package", "custom_itinerary", "tailored_trip"];

/**
 * Services that may be saved without a total, for the team to quote ("quote on
 * request"): corporate and custom itineraries always, packages when their tier
 * isn't priced in RWF.
 */
export const QUOTE_ON_REQUEST_SERVICES: readonly BookingService[] = ["corporate", "custom_itinerary", "package"];

/** Budget bands a custom itinerary request can pick. */
export const BUDGET_BANDS = ["under500", "500to1500", "1500to3000", "over3000"] as const;
export type BudgetBand = (typeof BUDGET_BANDS)[number];

/**
 * What a service needs beyond the shared fields. Each key is only filled in
 * for the services that use it (see parseBookingDetails in lib/bookings.ts).
 */
export type BookingDetails = {
  /** Corporate: the company, how many vehicles and how many trips. */
  company?: string;
  vehicles?: number;
  trips?: number;
  /** Packages: which experience and package, and how many guests. */
  experienceId?: string;
  experienceTitle?: string;
  packageId?: string;
  packageTitle?: string;
  guests?: number;
  /** Kigali tours: the venue id from the tours page. */
  tourId?: string;
  /** Custom itineraries: what they'd like to do, and roughly what they'd spend (USD per person). */
  interests?: string;
  budget?: BudgetBand;
  /** Tailored trips: which trip, package and vehicle. Guests use `guests`. */
  tripId?: string;
  tripPackage?: string;
  tripVehicle?: string;
};

export type Booking = {
  id: string;
  /** Worked out from `service` on the server; never taken from the browser. */
  brand: BookingBrand;
  /** null for bookings logged before services existed. */
  service: BookingService | null;
  clientName: string;
  /** WhatsApp / phone number, as the customer sent it. */
  clientPhone: string;
  /** null for services without a vehicle (corporate, packages, custom itineraries). */
  tripType: TripType | null;
  /** A vehicle class id from lib/pricing.ts (VEHICLES), or "" without a vehicle. */
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
  /** The Grand Total quoted to the customer, RWF. null = quote on request, not sent yet. */
  grandTotal: number | null;
  status: BookingStatus;
  notes: string;
  details: BookingDetails;
  /** ms since epoch */
  createdAt: number;
  updatedAt: number;
};

/** What an admin fills in — everything except the ids and timestamps. */
export type BookingInput = Omit<Booking, "id" | "createdAt" | "updatedAt">;
