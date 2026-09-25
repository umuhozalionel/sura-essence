/**
 * SURA Essence — pricing. THE single source of truth for every transport price
 * on the site: the booking form, the hero estimate, the Transfers table and
 * the landing-page cards all call `quote()` below. Change a number here and it
 * changes everywhere. The translation files only hold words.
 *
 * A trip is priced one of four ways:
 *
 *   1. Airport transfer    Flat rate per class. Driver included, no fuel or daily maths.
 *
 *   2. City ride · Cab     Ride-hailing fare: base (covers the first 2 km) + per km after.
 *                          Driver included. No daily fees, no profit margin.
 *      City ride · Private Fractional day (see 3) for the hours the ride needs,
 *                          at least 3 hours, always with a driver.
 *
 *   3. Hourly hire         Fractional day, with or without a driver:
 *                            car base ÷ 8 per hour + service fee ÷ 8 per hour
 *                            + fuel + 30 % of (fuel + service fee)
 *                          3-hour minimum; anything up to 12 hours costs at most one day.
 *
 *   4. Long trip           Inter-city trips and full-day tours:
 *      (inter-city,          Total = car base × days + location surcharge
 *       full day)                  + service fee × days + fuel + profit
 *                            service fee  30,000/day Kigali, 50,000/day outside; 0 for self-drive
 *                            surcharge    once per trip outside Kigali (per class, see VEHICLES)
 *                            fuel         km ÷ km-per-litre × CURRENT_FUEL_PRICE_RWF; 0 for EVs
 *                            profit       30 % of (fuel + service fee) — running costs only
 *                          One way, with a driver: the driver brings the car back empty,
 *                          so fuel is charged for twice the distance.
 *                          One way, self-drive: fuel for the distance once, plus a flat
 *                          VEHICLE_RECOVERY_FEE to collect the car.
 *
 * Every grand total is rounded UP to the nearest ROUND_TOTAL_TO_RWF.
 * Customers only ever see the grand total. All amounts are Rwandan francs (RWF).
 */

/* ─── Numbers you'll update most often ──────────────────────────────── */

/** Pump price for a litre of fuel. Update when RURA announces a change. */
export const CURRENT_FUEL_PRICE_RWF = 1650;

/** Markup on running costs only: profit = (fuel cost + service fee) × PROFIT_MARGIN. */
export const PROFIT_MARGIN = 0.3;

/** Driver service fee per day. Charged only when the trip is with a driver. */
export const SERVICE_FEE_PER_DAY: Record<Zone, number> = {
  kigali: 30_000,
  outside: 50_000,
};

/** Self-drive, one way: flat fee for our staff to collect the car. */
export const VEHICLE_RECOVERY_FEE = 50_000;

/** Customer totals are rounded UP to this many francs (1 = no rounding). */
export const ROUND_TOTAL_TO_RWF = 100;

/* ─── Hourly (fractional-day) pricing ───────────────────────────────── */

/** The day rate covers 8 hours: one hour costs 1/8 of the day's car base and service fee. */
export const HOURS_IN_RATE_DAY = 8;
/** Shortest booking billed for Private rides and hourly hire. */
export const MIN_BILLED_HOURS = 3;
/** Longest hourly booking. Anything from 8 up to 12 hours is billed as one full day. */
export const MAX_HOURS_PER_DAY = 12;
/** Hourly hire has no fixed route: assume this many km of driving per hour (for fuel). */
export const HIRE_KM_PER_HOUR = 15;
/** Hour options offered for hourly hire. */
export const HIRE_HOUR_OPTIONS = [3, 4, 5, 6, 8, 10, 12] as const;

/* ─── Cab fares (city rides) ────────────────────────────────────────── */

export type CabBand = "standard" | "executive" | "premium";

/** Ride-hailing fares: `base` covers the first `includedKm`, then `perKm` for every km after. */
export const CAB_FARES: Record<CabBand, { base: number; includedKm: number; perKm: number }> = {
  standard:  { base: 5_000,  includedKm: 2, perKm: 1_000 },
  executive: { base: 10_000, includedKm: 2, perKm: 1_500 },
  premium:   { base: 15_000, includedKm: 2, perKm: 2_500 },
};

/* ─── Vehicle classes ───────────────────────────────────────────────── */

export type Zone = "kigali" | "outside";
export type BodyType = "sedan" | "suv" | "van" | "bus";

/** Fuel economy by body type (km per litre). Electric cars don't use this: their fuel cost is 0. */
export const KM_PER_LITRE: Record<BodyType, number> = {
  sedan: 10,
  van: 10,
  suv: 7,
  bus: 7,
};

export type VehicleId =
  | "sedan"
  | "suv"
  | "premium_suv"
  | "luxury_suv"
  | "van"
  | "bus"
  | "electric_sedan"
  | "electric_suv";

export type Vehicle = {
  id: VehicleId;
  /** Car base price per day, RWF. */
  basePrice: number;
  body: BodyType;
  /** Electric: fuel cost is 0 (charging is covered by the base price). */
  electric: boolean;
  /** Flat airport transfer price, driver included, RWF. */
  airportRate: number;
  /** Cab fare band for city rides. null = no cab service in this class (it's booked as Private). */
  cab: CabBand | null;
  /** Added once per trip outside Kigali, RWF. */
  outsideSurcharge: number;
  /** false = with driver only: self-drive isn't offered for this class. */
  selfDrive: boolean;
  /** Passengers the car takes, not counting the driver. */
  maxPassengers: number;
  /** Icon name from lib/icons.ts. */
  icon: string;
};

/** Order here = order on the site. Names and descriptions live in messages/*.json. */
export const VEHICLES: readonly Vehicle[] = [
  { id: "sedan",          basePrice: 40_000,  body: "sedan", electric: false, airportRate: 25_000,  cab: "standard",  outsideSurcharge: 10_000, selfDrive: true,  maxPassengers: 4,  icon: "car" },      // Prius, Altis
  { id: "suv",            basePrice: 80_000,  body: "suv",   electric: false, airportRate: 35_000,  cab: "executive", outsideSurcharge: 50_000, selfDrive: true,  maxPassengers: 6,  icon: "activity" }, // Sorento, RAV4
  { id: "premium_suv",    basePrice: 250_000, body: "suv",   electric: false, airportRate: 50_000,  cab: "premium",   outsideSurcharge: 50_000, selfDrive: false, maxPassengers: 6,  icon: "star" },     // V8, Land Cruiser, Fortuner, Lexus
  { id: "luxury_suv",     basePrice: 350_000, body: "suv",   electric: false, airportRate: 50_000,  cab: "premium",   outsideSurcharge: 50_000, selfDrive: false, maxPassengers: 4,  icon: "crown" },    // G-Wagon, Range Rover
  { id: "van",            basePrice: 150_000, body: "van",   electric: false, airportRate: 50_000,  cab: "premium",   outsideSurcharge: 0,      selfDrive: true,  maxPassengers: 10, icon: "users" },    // Van / mini-bus
  { id: "bus",            basePrice: 450_000, body: "bus",   electric: false, airportRate: 100_000, cab: null,        outsideSurcharge: 0,      selfDrive: false, maxPassengers: 40, icon: "bus" },      // Coach
  { id: "electric_sedan", basePrice: 100_000, body: "sedan", electric: true,  airportRate: 35_000,  cab: "executive", outsideSurcharge: 50_000, selfDrive: true,  maxPassengers: 4,  icon: "zap" },
  { id: "electric_suv",   basePrice: 150_000, body: "suv",   electric: true,  airportRate: 35_000,  cab: "executive", outsideSurcharge: 50_000, selfDrive: true,  maxPassengers: 4,  icon: "zap" },
];

export const DEFAULT_VEHICLE: VehicleId = "sedan";

export function getVehicle(id: string): Vehicle {
  return VEHICLES.find((v) => v.id === id) ?? VEHICLES[0];
}

/** Can this class be booked without a driver? (Premium SUV, Luxury SUV and Coach can't.) */
export function canSelfDrive(vehicleId: string): boolean {
  return getVehicle(vehicleId).selfDrive;
}

/** Can this class be booked as a Cab? (Coach can't — it's booked as a Private ride.) */
export function canBookCab(vehicleId: string): boolean {
  return getVehicle(vehicleId).cab !== null;
}

/* ─── Distances ─────────────────────────────────────────────────────── */

export type Destination = {
  id: string;
  /** One-way road distance from Kigali, km. For a loop: km driven per day. */
  km: number;
  zone: Zone;
  /** A loop ends where it started (the Kigali city tour): never "one way". */
  loop?: boolean;
  /** [lat, lon] — used by the maps. */
  coords: [number, number];
};

/**
 * Fixed distance matrix: one-way road km from Kigali. Fuel for these trips is
 * calculated from these numbers, so keep them accurate. Names live in
 * messages/*.json (BookingForm.sites, Hero.sites, Transfers.routes.items).
 */
export const DESTINATIONS: readonly Destination[] = [
  { id: "kigali",    km: 50,  zone: "kigali",  loop: true, coords: [-1.9441, 30.0619] }, // full-day city tour
  { id: "kayonza",   km: 75,  zone: "outside", coords: [-1.9000, 30.5000] },
  { id: "musanze",   km: 95,  zone: "outside", coords: [-1.4990, 29.6340] },
  { id: "volcanoes", km: 105, zone: "outside", coords: [-1.4748, 29.4831] }, // Kinigi park HQ
  { id: "bisate",    km: 110, zone: "outside", coords: [-1.5203, 29.5031] },
  { id: "akagera",   km: 110, zone: "outside", coords: [-1.8833, 30.7167] },
  { id: "huye",      km: 130, zone: "outside", coords: [-2.6000, 29.7333] },
  { id: "karongi",   km: 140, zone: "outside", coords: [-2.1583, 29.3400] },
  { id: "gishwati",  km: 150, zone: "outside", coords: [-1.8333, 29.3833] },
  { id: "rubavu",    km: 155, zone: "outside", coords: [-1.6853, 29.4101] },
  { id: "nyungwe",   km: 225, zone: "outside", coords: [-2.4639, 29.2031] },
  { id: "rusizi",    km: 250, zone: "outside", coords: [-2.4847, 28.9075] },
];

export function getDestination(id: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.id === id);
}

/** Destinations on the Transfers page, in display order. */
export const TRANSFER_ROUTE_IDS = ["musanze", "akagera", "huye", "rubavu", "rusizi", "kayonza"] as const;

/** Destinations offered in the hero's quick estimate. */
export const HERO_DESTINATION_IDS = ["volcanoes", "akagera", "nyungwe", "rubavu", "huye"] as const;

/** A typical Kigali A-to-B ride, used until the customer picks both addresses. */
export const CITY_RIDE_DEFAULT_KM = 10;
/** Straight-line distance × this ≈ road distance (Kigali's roads wind round the hills). */
export const ROAD_DISTANCE_FACTOR = 1.4;

/** Road distance between two points, km (straight line × ROAD_DISTANCE_FACTOR). */
export function roadDistanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * ROAD_DISTANCE_FACTOR;
}

/** Road distance along a route: pickup → stops… → drop-off. */
export function routeDistanceKm(points: [number, number][]): number {
  let km = 0;
  for (let i = 1; i < points.length; i++) km += roadDistanceKm(points[i - 1], points[i]);
  return km;
}

/**
 * Days the car is booked: 1, or — for a return trip with a later return
 * date — every calendar day from departure to return.
 */
export function serviceDays(date?: string, returnDate?: string, returnTrip?: boolean): number {
  if (!returnTrip || !date || !returnDate) return 1;
  const start = Date.parse(`${date}T00:00:00Z`);
  const end = Date.parse(`${returnDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1;
  return Math.round((end - start) / 86_400_000) + 1;
}

/* ─── Trips: what gets priced ───────────────────────────────────────── */

export type CityRideMode = "cab" | "private";
export const CITY_RIDE_MODES: readonly CityRideMode[] = ["cab", "private"];

export type Trip =
  /** Airport transfer. legs: 1 = one way, 2 = there and back. */
  | { kind: "airport"; legs: 1 | 2 }
  /** Kigali A-to-B ride, as a Cab or a Private ride. distanceKm is one leg. */
  | { kind: "cityRide"; mode: CityRideMode; distanceKm: number; legs: 1 | 2 }
  /** The car by the hour, in Kigali. */
  | { kind: "hourly"; hours: number; withDriver: boolean }
  /** Inter-city trip or full-day tour. distanceKm is what the customer travels. */
  | { kind: "long"; zone: Zone; distanceKm: number; days: number; oneWay: boolean; withDriver: boolean };

type ReturnOption = { returnTrip?: boolean };
type DriverOption = { withDriver?: boolean };
export type LongTripOptions = ReturnOption & DriverOption & { days?: number };

export const trips = {
  /** Airport transfer — flat rate. */
  airport({ returnTrip = false }: ReturnOption = {}): Trip {
    return { kind: "airport", legs: returnTrip ? 2 : 1 };
  },

  /** City ride, A to B. Pass the route distance once both addresses are known. */
  cityRide(mode: CityRideMode, distanceKm?: number | null, { returnTrip = false }: ReturnOption = {}): Trip {
    return { kind: "cityRide", mode, distanceKm: distanceKm ?? CITY_RIDE_DEFAULT_KM, legs: returnTrip ? 2 : 1 };
  },

  /** Hourly hire in Kigali (3–12 hours). */
  hourly(hours: number, { withDriver = true }: DriverOption = {}): Trip {
    return { kind: "hourly", hours, withDriver };
  },

  /** A trip to a destination in the distance matrix (the zone comes from the matrix). */
  destination(id: string, { withDriver = true, returnTrip = false, days = 1 }: LongTripOptions = {}): Trip | null {
    const d = getDestination(id);
    if (!d) return null;
    const n = Math.max(1, Math.ceil(days));
    if (d.loop) {
      // A tour ends where it started: one loop a day, and never "one way".
      return { kind: "long", zone: d.zone, distanceKm: d.km * n, days: n, oneWay: false, withDriver };
    }
    return {
      kind: "long",
      zone: d.zone,
      distanceKm: d.km * (returnTrip ? 2 : 1),
      days: n,
      oneWay: !returnTrip,
      withDriver,
    };
  },
};

/* ─── The calculation ───────────────────────────────────────────────── */

export type PricingMethod = "airport" | "cab" | "private" | "hourly" | "long";

export type Quote = {
  /** The grand total — the only figure customers see. */
  total: number;
  /** How it was priced. A Cab request in a class without cab fares is priced as "private". */
  method: PricingMethod;
  zone: Zone;
  /** Whether a driver is included. Always true for classes that are with-driver only. */
  withDriver: boolean;
  /** Km the customer travels (the driver's empty drive back isn't counted here). null for airport transfers. */
  distanceKm: number | null;
  /** Days billed — a fraction for Private rides and hourly hire (3 h = 0.375). null for flat fares. */
  days: number | null;
  /** Hours billed, for Private rides and hourly hire. */
  hours: number | null;
  /** Internal breakdown for staff and testing. Never show it to customers. */
  breakdown: {
    /** Airport flat rate or cab fare. */
    fare: number;
    carBase: number;
    locationSurcharge: number;
    serviceFee: number;
    fuelCost: number;
    profit: number;
    recoveryFee: number;
  };
};

type Breakdown = Quote["breakdown"];
const NO_COSTS: Breakdown = { fare: 0, carBase: 0, locationSurcharge: 0, serviceFee: 0, fuelCost: 0, profit: 0, recoveryFee: 0 };

/** Fuel for `km` of driving. Electric cars: 0. */
function fuelCostFor(km: number, vehicle: Vehicle): number {
  if (vehicle.electric) return 0;
  return (Math.max(0, km) / KM_PER_LITRE[vehicle.body]) * CURRENT_FUEL_PRICE_RWF;
}

function roundUpTotal(amount: number): number {
  const step = Math.max(1, ROUND_TOTAL_TO_RWF);
  // The small epsilon stops floating-point noise (e.g. 136000.00000001) rounding up a whole step.
  return Math.ceil(amount / step - 1e-9) * step;
}

function withTotal(q: Omit<Quote, "total">): Quote {
  const b = q.breakdown;
  const raw = b.fare + b.carBase + b.locationSurcharge + b.serviceFee + b.fuelCost + b.profit + b.recoveryFee;
  return { ...q, total: roundUpTotal(raw) };
}

/** Hours actually billed: at least MIN_BILLED_HOURS, at most MAX_HOURS_PER_DAY. */
export function billedHours(hours: number): number {
  const h = Number.isFinite(hours) ? Math.ceil(hours) : MIN_BILLED_HOURS;
  return Math.min(Math.max(h, MIN_BILLED_HOURS), MAX_HOURS_PER_DAY);
}

/** Share of the day rate billed for `hours`: 1/8 per hour, never more than one day. */
export function dayFraction(hours: number): number {
  return Math.min(billedHours(hours) / HOURS_IN_RATE_DAY, 1);
}

/** Fractional-day price, used by Private city rides and hourly hire (Kigali). */
function fractionalQuote(
  method: "private" | "hourly",
  vehicle: Vehicle,
  hours: number,
  distanceKm: number,
  withDriver: boolean,
  legs: number,
): Quote {
  const fraction = dayFraction(hours) * legs;
  const carBase = vehicle.basePrice * fraction;
  const serviceFee = withDriver ? SERVICE_FEE_PER_DAY.kigali * fraction : 0;
  const fuelCost = fuelCostFor(distanceKm * legs, vehicle);
  const profit = (fuelCost + serviceFee) * PROFIT_MARGIN;
  return withTotal({
    method,
    zone: "kigali",
    withDriver,
    distanceKm: distanceKm * legs,
    days: fraction,
    hours: billedHours(hours) * legs,
    breakdown: { ...NO_COSTS, carBase, serviceFee, fuelCost, profit },
  });
}

export function quote(trip: Trip, vehicleId: string): Quote {
  const vehicle = getVehicle(vehicleId);

  switch (trip.kind) {
    /* 1. Airport: flat rate, driver included. */
    case "airport":
      return withTotal({
        method: "airport",
        zone: "kigali",
        withDriver: true,
        distanceKm: null,
        days: null,
        hours: null,
        breakdown: { ...NO_COSTS, fare: vehicle.airportRate * trip.legs },
      });

    /* 2. City ride: Cab fare, or Private (fractional day, always with a driver). */
    case "cityRide": {
      const km = Math.max(0, trip.distanceKm);
      if (trip.mode === "cab" && vehicle.cab) {
        const f = CAB_FARES[vehicle.cab];
        const perRide = f.base + Math.max(0, km - f.includedKm) * f.perKm;
        return withTotal({
          method: "cab",
          zone: "kigali",
          withDriver: true,
          distanceKm: km * trip.legs,
          days: null,
          hours: null,
          breakdown: { ...NO_COSTS, fare: perRide * trip.legs },
        });
      }
      // Hours the ride needs at Kigali driving speeds (the 3-hour minimum applies).
      const hours = km / HIRE_KM_PER_HOUR;
      return fractionalQuote("private", vehicle, hours, km, true, trip.legs);
    }

    /* 3. Hourly hire: fractional day; fuel for HIRE_KM_PER_HOUR km per billed hour. */
    case "hourly": {
      const withDriver = trip.withDriver || !vehicle.selfDrive;
      const km = billedHours(trip.hours) * HIRE_KM_PER_HOUR;
      return fractionalQuote("hourly", vehicle, trip.hours, km, withDriver, 1);
    }

    /* 4. Long trip: inter-city or full day. */
    case "long": {
      const withDriver = trip.withDriver || !vehicle.selfDrive;
      const days = Math.max(1, Math.ceil(trip.days));
      const outside = trip.zone === "outside";
      const km = Math.max(0, trip.distanceKm);

      const carBase = vehicle.basePrice * days;
      const locationSurcharge = outside ? vehicle.outsideSurcharge : 0; // once per trip
      const serviceFee = withDriver ? SERVICE_FEE_PER_DAY[trip.zone] * days : 0;
      // One way with a driver: the driver brings the car back empty — the client pays that fuel too.
      const fuelKm = trip.oneWay && withDriver && outside ? km * 2 : km;
      const fuelCost = fuelCostFor(fuelKm, vehicle);
      const profit = (fuelCost + serviceFee) * PROFIT_MARGIN;
      // One way, self-drive: no doubled fuel; a flat fee to collect the car instead.
      const recoveryFee = trip.oneWay && !withDriver ? VEHICLE_RECOVERY_FEE : 0;

      return withTotal({
        method: "long",
        zone: trip.zone,
        withDriver,
        distanceKm: km,
        days,
        hours: null,
        breakdown: { ...NO_COSTS, carBase, locationSurcharge, serviceFee, fuelCost, profit, recoveryFee },
      });
    }
  }
}

/* ─── Ready-made figures for display-only places ────────────────────── */

/** Price of a destination for one class. Default: one way, one day, with a driver. */
export function destinationPrice(
  destinationId: string,
  vehicleId: string,
  opts: LongTripOptions = {},
): number | null {
  const trip = trips.destination(destinationId, opts);
  return trip ? quote(trip, vehicleId).total : null;
}

/** "From" prices for the landing-page cards (ids match Pricing.services in messages). */
export function landingCardPrice(cardId: string): number | null {
  switch (cardId) {
    case "airport":
      return quote(trips.airport(), DEFAULT_VEHICLE).total;
    case "hourly":
      // Driver hire: the 3-hour minimum, with a driver.
      return quote(trips.hourly(MIN_BILLED_HOURS), DEFAULT_VEHICLE).total;
    case "transfers":
      return Math.min(...TRANSFER_ROUTE_IDS.map((id) => destinationPrice(id, DEFAULT_VEHICLE) ?? Infinity));
    case "tours":
      // Full-day explorer: a 4x4 (Executive SUV) with a driver, for a day in and around Kigali.
      return destinationPrice("kigali", "suv");
    default:
      return null;
  }
}

/* ─── Which note goes under a price ─────────────────────────────────── */

/**
 * What the grand total covers, for the note shown under it
 * (messages: BookingForm.priceNotes.<kind>, Hero.estimate.notes.<kind>):
 *   fixedFare   airport transfers and cabs — driver and fuel included
 *   selfDrive   the vehicle and estimated fuel
 *   withDriver  Private rides and rentals with a driver — vehicle, fuel and service fee
 */
export type PriceNoteKind = "fixedFare" | "selfDrive" | "withDriver";

export function priceNoteKind(q: Pick<Quote, "method" | "withDriver">): PriceNoteKind {
  if (q.method === "airport" || q.method === "cab") return "fixedFare";
  return q.withDriver ? "withDriver" : "selfDrive";
}
