/**
 * SURA Iwacu trips: a day the customer builds for themselves on /iwacu/trips.
 * Safe to import in the browser. The builder prices with quoteTrip() as the
 * customer chooses, and /api/bookings prices the same selection again on the
 * server, at the live rates. The rates live in lib/cms/trip-rates-server.ts and
 * are edited on Admin → Trips. Words: messages/*.json, namespace "Trips".
 *
 * One trip costs:
 *   the car                 SUVs: the Movana formula over the road and the park.
 *                           Safari car: one USD price for 1 to 9 guests, in RWF.
 *   + park entry            per guest, by nationality group (Akagera's price list)
 *   + lunch                 per guest aged 6 or over
 *   + SUVs only             the park's vehicle fee, and snacks and water per guest
 *                           (the safari car's fixed price already covers its costs)
 *   + the park guide        once: always on Basic, by choice on a Standard SUV
 *                           (a safari car's driver is the guide)
 *   + activities            from Akagera's price list, in USD at the current rate
 * Breakfast, dinner and extra stops have no price here: the team quotes them
 * after the request. All amounts are RWF; USD is only an estimate.
 */
import { DEFAULT_PRICING, getDestination, quote, type PricingConfig, type VehicleId } from "./pricing";

/* ─── the rates admins edit ──────────────────────────────────────────── */

export type TripRates = {
  /** RWF for one US dollar. Turns the park's USD fees into RWF, and totals into a USD estimate. */
  usdToRwf: number;
  /** When the exchange rate was last updated (ms since epoch), shown to customers. */
  rateUpdatedAt: number | null;
  /** The safari car, USD, for up to 9 guests: road, fuel, driver-guide, park views and water. Charged in RWF. */
  safariCarUsd: number;
  /** Per guest. Basic's lunch, and the buffet choice on Standard. */
  lunchBuffet: number;
  /** Per guest. The chosen lunch on Standard. */
  lunchChosen: number;
  /** The park guide, USD per trip. */
  guideUsd: number;
  /** The park's fee for a Rwandan or EAC registered car, USD. SUVs only. */
  vehicleFeeUsd: number;
  /** Snacks and water, RWF per guest aged 6 or over. SUVs only. */
  snacksPerGuest: number;
  /** Km driven inside the park by an SUV, on top of the road. */
  inParkKm: number;
  /** "HH:MM". The latest pickup in Kigali that still reaches the park in good time. */
  latestPickup: string;
};

export const DEFAULT_TRIP_RATES: TripRates = {
  usdToRwf: 1500,
  rateUpdatedAt: null,
  safariCarUsd: 400,
  lunchBuffet: 15_000,
  lunchChosen: 50_000,
  guideUsd: 40,
  vehicleFeeUsd: 10,
  snacksPerGuest: 10_000,
  inParkKm: 100,
  latestPickup: "05:00",
};

/* ─── what can be chosen ─────────────────────────────────────────────── */

export type TripStatus = "live" | "maintenance";
export const TRIPS = [
  { id: "akagera", status: "live", image: "/backgrounds/akagera.jpg", href: "/iwacu/trips/akagera" },
  { id: "bigogwe", status: "maintenance", image: "/activities/bigogwe/1.jpg", href: null },
  { id: "nyungwe", status: "maintenance", image: "/backgrounds/nyungwe-activity.jpg", href: null },
] as const satisfies readonly { id: string; status: TripStatus; image: string; href: string | null }[];

export const TRIP_PACKAGES = ["basic", "standard"] as const;
export type TripPackage = (typeof TRIP_PACKAGES)[number];

export const TRIP_VEHICLES = ["comfort", "safari", "premium", "luxury"] as const;
export type TripVehicle = (typeof TRIP_VEHICLES)[number];

/**
 * Akagera allows SUVs and safari cars: no sedans, no electric cars. `seats` is how
 * many guests one car takes: a 5 to 7 seater SUV, a 7 to 9 seater safari car.
 */
const VEHICLE_RULES: Record<TripVehicle, { seats: number; pkg: TripPackage; class: VehicleId | null }> = {
  comfort: { seats: 4, pkg: "basic", class: "suv" },
  safari: { seats: 9, pkg: "standard", class: null },
  premium: { seats: 6, pkg: "standard", class: "premium_suv" },
  luxury: { seats: 4, pkg: "standard", class: "luxury_suv" },
};

export const vehicleSeats = (v: TripVehicle) => VEHICLE_RULES[v].seats;
export const vehiclesFor = (pkg: TripPackage) => TRIP_VEHICLES.filter((v) => VEHICLE_RULES[v].pkg === pkg);

export const LUNCH_CHOICES = ["buffet", "chosen", "none"] as const;
export type LunchChoice = (typeof LUNCH_CHOICES)[number];
export const lunchChoicesFor = (pkg: TripPackage): readonly LunchChoice[] =>
  pkg === "basic" ? ["none"] : LUNCH_CHOICES;

/**
 * Activities from "Pricing for Akagera National Park", USD. Per person: adult (13+)
 * and child (6 to 12); 5 and under pay nothing. Per group: one price for the boat or
 * the vehicle. `min`: fewest guests the park takes for it.
 */
type ActivityFee =
  | { per: "person"; adult: number; child: number; min?: number; groupOf8?: number }
  | { per: "boat"; upTo11: number; upTo18: number }
  | { per: "vehicle"; price: number; seats: number };
const ACTIVITY_FEES = {
  boatScheduled: { per: "person", adult: 35, child: 20 },
  boatSunset: { per: "person", adult: 45, child: 30 },
  boatPrivate: { per: "boat", upTo11: 200, upTo18: 360 },
  gameDriveHalf: { per: "vehicle", price: 200, seats: 7 },
  gameDriveFull: { per: "vehicle", price: 350, seats: 7 },
  nightDrive: { per: "person", adult: 40, child: 25, min: 2 },
  behindScenes: { per: "person", adult: 25, child: 15, min: 4, groupOf8: 180 },
  walkTheLine: { per: "person", adult: 30, child: 20, min: 3 },
  community: { per: "person", adult: 30, child: 20, min: 3 },
  fishing: { per: "person", adult: 25, child: 15 },
  camping: { per: "person", adult: 25, child: 15 },
  campingRwandan: { per: "person", adult: 15, child: 10 },
  campingMihindi: { per: "person", adult: 50, child: 30 },
  campingMihindiRwandan: { per: "person", adult: 40, child: 20 },
} as const satisfies Record<string, ActivityFee>;
export type TripActivity = keyof typeof ACTIVITY_FEES;
export const TRIP_ACTIVITIES = Object.keys(ACTIVITY_FEES) as TripActivity[];

/**
 * One-day park entry from "Pricing for Akagera National Park". Citizens' fees are
 * set in RWF; every other fee is in USD. Ages: child 6 to 12; 13 and over pay as
 * adults; 5 and under are free.
 */
type EntryFee = { adult: number; child: number; currency: "RWF" | "USD" };
export const GUEST_GROUPS = ["citizen", "panAfricanResident", "foreignResident", "panAfrican", "international"] as const;
export type GuestGroup = (typeof GUEST_GROUPS)[number];
const ENTRY_FEES: Record<GuestGroup, EntryFee> = {
  citizen: { adult: 15_000, child: 10_000, currency: "RWF" },
  panAfricanResident: { adult: 25, child: 15, currency: "USD" },
  foreignResident: { adult: 50, child: 30, currency: "USD" },
  panAfrican: { adult: 50, child: 30, currency: "USD" },
  international: { adult: 100, child: 50, currency: "USD" },
};

export type GuestCount = { adults: number; children: number };
export type TripGuests = Record<GuestGroup, GuestCount> & { infants: number };

export const noGuests = (): TripGuests => ({
  citizen: { adults: 0, children: 0 },
  panAfricanResident: { adults: 0, children: 0 },
  foreignResident: { adults: 0, children: 0 },
  panAfrican: { adults: 0, children: 0 },
  international: { adults: 0, children: 0 },
  infants: 0,
});

/** Everything the customer chose. */
export type TripSelection = {
  tripId: "akagera";
  pkg: TripPackage;
  vehicle: TripVehicle;
  guests: TripGuests;
  date: string;
  pickupTime: string;
  pickupPlace: string;
  lunch: LunchChoice;
  breakfast: boolean;
  dinner: boolean;
  guide: boolean;
  activities: TripActivity[];
  extraStops: string;
};

export const MAX_TRIP_GUESTS = 20;

export const payingGuests = (g: TripGuests) => GUEST_GROUPS.reduce((n, id) => n + g[id].adults + g[id].children, 0);
/** Everyone in the car, children aged 5 and under included. */
export const totalGuests = (g: TripGuests) => payingGuests(g) + g.infants;

/* ─── pickup times ───────────────────────────────────────────────────── */

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const clock = (mins: number) => `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

const EARLIEST_PICKUP = "04:00";

/** Half-hour pickups up to the latest one: later than that misses the park's early start. */
export function pickupTimes(rates: TripRates): string[] {
  const out: string[] = [];
  for (let m = minutes(EARLIEST_PICKUP); m <= minutes(rates.latestPickup); m += 30) out.push(clock(m));
  return out;
}

/* ─── the price ──────────────────────────────────────────────────────── */

export type TripQuote = {
  total: number;
  /** total ÷ paying guests, rounded to the franc. */
  perGuest: number;
  /** total in dollars at the current rate, an estimate. */
  usd: number;
  car: number;
  entry: number;
  lunch: number;
  guide: number;
  /** The park's vehicle fee, and snacks and water. 0 with a safari car. */
  extras: number;
  /** The chosen activities. */
  activities: number;
  /** false: this group doesn't fit the car, so the team plans it. */
  fits: boolean;
  /** Something here has no price yet, so the total is a starting price. */
  hasQuotedItems: boolean;
};

const roundUp = (amount: number, step: number) => Math.ceil(amount / step - 1e-9) * step;

/** A USD fee in RWF at the current rate, rounded up to the customer's rounding step. */
export const usdInRwf = (usd: number, rates: TripRates, cfg: PricingConfig = DEFAULT_PRICING) =>
  roundUp(usd * rates.usdToRwf, Math.max(1, cfg.roundTotalTo));

/** One guest's entry fee, RWF. */
export function entryFee(group: GuestGroup, age: "adult" | "child", rates: TripRates, cfg: PricingConfig = DEFAULT_PRICING): number {
  const fee = ENTRY_FEES[group];
  return fee.currency === "RWF" ? fee[age] : usdInRwf(fee[age], rates, cfg);
}

/** The car for one Akagera day. SUVs: the road there and back, plus the kilometres inside the park. */
export function carPrice(vehicle: TripVehicle, rates: TripRates, cfg: PricingConfig = DEFAULT_PRICING): number {
  const carClass = VEHICLE_RULES[vehicle].class;
  if (!carClass) return usdInRwf(rates.safariCarUsd, rates, cfg);
  const road = (getDestination("akagera")?.km ?? 0) * 2;
  return quote(
    { kind: "long", zone: "outside", distanceKm: road + rates.inParkKm, days: 1, oneWay: false, withDriver: true },
    carClass,
    cfg,
  ).total;
}

/** The fewest guests the park takes for an activity. */
export const activityMinimum = (a: TripActivity): number => {
  const fee: ActivityFee = ACTIVITY_FEES[a];
  return fee.per === "person" ? fee.min ?? 1 : 1;
};

/** What an activity costs this group, USD. null: too few guests for it. */
export function activityUsd(a: TripActivity, guests: TripGuests): number | null {
  const fee: ActivityFee = ACTIVITY_FEES[a];
  const adults = GUEST_GROUPS.reduce((n, id) => n + guests[id].adults, 0);
  const children = GUEST_GROUPS.reduce((n, id) => n + guests[id].children, 0);
  const paying = adults + children;
  if (paying < activityMinimum(a)) return null;
  switch (fee.per) {
    case "person": {
      const each = adults * fee.adult + children * fee.child;
      return fee.groupOf8 && paying >= 8 ? fee.groupOf8 : each;
    }
    case "boat":
      return paying <= 11 ? fee.upTo11 : fee.upTo18;
    case "vehicle":
      return Math.ceil(paying / fee.seats) * fee.price;
  }
}

export function quoteTrip(sel: Pick<TripSelection, "pkg" | "vehicle" | "guests" | "lunch" | "guide" | "breakfast" | "dinner" | "activities" | "extraStops">, rates: TripRates, cfg: PricingConfig = DEFAULT_PRICING): TripQuote {
  const paying = payingGuests(sel.guests);
  // Nothing to price until someone is coming.
  if (paying < 1) {
    return { total: 0, perGuest: 0, usd: 0, car: 0, entry: 0, lunch: 0, guide: 0, extras: 0, activities: 0, fits: true, hasQuotedItems: false };
  }
  const car = carPrice(sel.vehicle, rates, cfg);
  const entry = GUEST_GROUPS.reduce(
    (sum, id) => sum + sel.guests[id].adults * entryFee(id, "adult", rates, cfg) + sel.guests[id].children * entryFee(id, "child", rates, cfg),
    0,
  );
  const lunchFee = sel.lunch === "buffet" ? rates.lunchBuffet : sel.lunch === "chosen" ? rates.lunchChosen : 0;
  const lunch = lunchFee * paying;
  // The safari car's driver is the guide.
  const guide = (sel.pkg === "basic" || sel.guide) && sel.vehicle !== "safari" ? usdInRwf(rates.guideUsd, rates, cfg) : 0;
  const extras = sel.vehicle === "safari" ? 0 : usdInRwf(rates.vehicleFeeUsd, rates, cfg) + rates.snacksPerGuest * paying;
  const activities = sel.activities.reduce((sum, a) => sum + usdInRwf(activityUsd(a, sel.guests) ?? 0, rates, cfg), 0);
  const total = roundUp(car + entry + lunch + guide + extras + activities, Math.max(1, cfg.roundTotalTo));
  return {
    total,
    perGuest: Math.round(total / paying),
    usd: rates.usdToRwf > 0 ? Math.round(total / rates.usdToRwf) : 0,
    car, entry, lunch, guide, extras, activities,
    fits: totalGuests(sel.guests) <= vehicleSeats(sel.vehicle),
    hasQuotedItems: sel.breakfast || sel.dinner || (sel.pkg !== "basic" && sel.lunch === "none") || sel.extraStops.trim() !== "",
  };
}

/* ─── the day plan ───────────────────────────────────────────────────── */

export type DayPlanStop = { time: string; id: "pickup" | "arrival" | "breakfast" | "gameDrive" | "lunch" | "gameDrive2" | "leave" | "kigali" | "dinner" };

/** The day, moved with the pickup time: about 2.5 hours each way, and leaving well before the gates close. */
export function dayPlan(sel: Pick<TripSelection, "pickupTime" | "lunch" | "breakfast" | "dinner">): DayPlanStop[] {
  const start = minutes(/^\d{2}:\d{2}$/.test(sel.pickupTime) ? sel.pickupTime : DEFAULT_TRIP_RATES.latestPickup);
  const at = (hours: number) => clock(start + Math.round(hours * 60));
  const stops: (DayPlanStop | null)[] = [
    { time: at(0), id: "pickup" },
    { time: at(2.5), id: "arrival" },
    sel.breakfast ? { time: at(2.75), id: "breakfast" } : null,
    { time: at(3), id: "gameDrive" },
    sel.lunch === "none" ? null : { time: at(7), id: "lunch" },
    { time: at(8), id: "gameDrive2" },
    { time: at(10.5), id: "leave" },
    { time: at(13.5), id: "kigali" },
    sel.dinner ? { time: at(14), id: "dinner" } : null,
  ];
  return stops.filter((s): s is DayPlanStop => s !== null);
}

/* ─── checking what the browser sent ─────────────────────────────────── */

const isIn = <T extends string>(list: readonly T[], v: unknown): v is T => list.includes(v as T);
const count = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= MAX_TRIP_GUESTS ? v : 0);
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** A selection rebuilt from untrusted JSON, or null when it can't be priced. */
export function readTripSelection(raw: unknown, rates: TripRates): TripSelection | null {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (r.tripId !== "akagera" || !isIn(TRIP_PACKAGES, r.pkg) || !isIn(TRIP_VEHICLES, r.vehicle)) return null;
  if (VEHICLE_RULES[r.vehicle].pkg !== r.pkg) return null;
  if (!isIn(lunchChoicesFor(r.pkg), r.lunch)) return null;

  const g = (r.guests && typeof r.guests === "object" ? r.guests : {}) as Record<string, unknown>;
  const guests = noGuests();
  for (const id of GUEST_GROUPS) {
    const c = (g[id] && typeof g[id] === "object" ? g[id] : {}) as Record<string, unknown>;
    guests[id] = { adults: count(c.adults), children: count(c.children) };
  }
  guests.infants = count(g.infants);
  if (payingGuests(guests) < 1 || totalGuests(guests) > vehicleSeats(r.vehicle)) return null;

  const pickupTime = text(r.pickupTime, 5);
  if (!pickupTimes(rates).includes(pickupTime)) return null;

  return {
    tripId: "akagera",
    pkg: r.pkg,
    vehicle: r.vehicle,
    guests,
    date: text(r.date, 10),
    pickupTime,
    pickupPlace: text(r.pickupPlace, 120),
    lunch: r.lunch,
    breakfast: r.breakfast === true,
    dinner: r.dinner === true,
    guide: r.pkg === "basic" || (r.guide === true && r.vehicle !== "safari"),
    activities: Array.isArray(r.activities)
      ? TRIP_ACTIVITIES.filter((a) => (r.activities as unknown[]).includes(a) && activityUsd(a, guests) !== null)
      : [],
    extraStops: text(r.extraStops, 300),
  };
}

/** The selection for the team, in plain lines for the booking's notes. */
export function tripSummaryLines(sel: TripSelection): string[] {
  const guests = GUEST_GROUPS.flatMap((id) => {
    const { adults, children } = sel.guests[id];
    return adults || children ? [`${id}: ${adults} adult(s), ${children} child(ren) 6-12`] : [];
  });
  return [
    `Package: ${sel.pkg}`,
    `Vehicle: ${sel.vehicle}`,
    `Guests: ${guests.join("; ")}${sel.guests.infants ? `; aged 5 or under: ${sel.guests.infants}` : ""}`,
    sel.pkg === "basic" ? "Lunch: not included" : `Lunch: ${sel.lunch === "none" ? "removed, quote by hand" : sel.lunch}`,
    sel.breakfast ? "Breakfast: yes, to quote" : null,
    sel.dinner ? "Dinner: yes, to quote" : null,
    sel.guide ? "Park guide: yes" : null,
    sel.activities.length ? `Activities: ${sel.activities.join(", ")}` : null,
    sel.extraStops ? `Extra stops to quote: ${sel.extraStops}` : null,
  ].filter((l): l is string => l !== null);
}
