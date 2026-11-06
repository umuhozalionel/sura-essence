/**
 * SURA Iwacu trips: a day the customer builds for themselves on /iwacu/trips/<trip>.
 * Safe to import in the browser. The builder prices with quoteTrip() as the
 * customer chooses, and /api/bookings prices the same selection again on the
 * server, at the live rates. The rates live in lib/cms/trip-rates-server.ts and
 * are edited on Admin → Trips. Words: messages/*.json, namespace "Trips".
 *
 * Every bookable trip (BOOKABLE_TRIPS) has the same parts, set in TRIP_RULES: packages,
 * cars, park entry, activities and their rules, lunch, pickup times and a day plan.
 * One trip costs:
 *   the car                 the Movana formula over the road there and back and the park,
 *                           charged once (no outside-Kigali charge on top of the driver's fee).
 *                           Safari car (Akagera): one USD price for 1 to 8 guests, in RWF.
 *   + park entry            per guest, by nationality group, from the park's price list
 *   + lunch                 per guest aged 6 or over: Basic's, or Standard's at the budget chosen
 *   + the car's park entry  once, where the park charges one (Akagera)
 *   + snacks and water      per guest, except on the safari car, whose price covers them
 *   + the park guide        once, where the trip needs one (Akagera's SUVs)
 *   + activities            from the park's price list, USD at the current rate or RWF
 * Breakfast, dinner, extra stops and a night away have no price here: the team quotes
 * them after the request. All amounts are RWF; USD is only an estimate.
 */
import { DEFAULT_PRICING, getDestination, getVehicle, quote, type PricingConfig, type VehicleId } from "./pricing";

/* ─── the rates admins edit ──────────────────────────────────────────── */

export type TripRates = {
  /** RWF for one US dollar. Turns the park's USD fees into RWF, and totals into a USD estimate. */
  usdToRwf: number;
  /** RWF for one euro. Only for the euro estimate. */
  eurToRwf: number;
  /** When the exchange rate was last updated (ms since epoch), shown to customers. */
  rateUpdatedAt: number | null;
  /** The safari car, USD, for up to 8 guests: road, fuel, driver-guide, park views and water. Charged in RWF. */
  safariCarUsd: number;
  /** Per guest. Basic's buffet lunch, always included on Basic. */
  lunchBuffet: number;
  /** Per guest. The highest lunch budget on Standard (the lowest is STANDARD_LUNCH_FROM). */
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
  eurToRwf: 1650,
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

/**
 * What each place on /iwacu/trips does. "live": a trip to build and reserve. "tour": opens
 * what Kigali city tours already sells. "maintenance": known to us, not open yet (it may
 * have a page to look at). "soon": holds the place until its trip is built.
 */
export type TripStatus = "live" | "tour" | "maintenance" | "soon";
type TripPlace = { id: string; status: TripStatus; image: string | null; href: string | null };

/**
 * /iwacu/trips, by category. Words: Trips.categories.<id> and Trips.<place id>.
 * PICTURE, for Lionel to place: every place with `image: null`.
 */
export const TRIP_CATEGORIES = [
  {
    id: "parks",
    places: [
      { id: "akagera", status: "live", image: "/backgrounds/akagera.jpg", href: "/iwacu/trips/akagera" },
      { id: "nyungwe", status: "maintenance", image: "/backgrounds/nyungwe-activity.jpg", href: null },
      { id: "volcanoes", status: "soon", image: null, href: null },
      { id: "gishwati", status: "soon", image: null, href: null },
    ],
  },
  {
    id: "memorials",
    places: [
      { id: "gisozi", status: "tour", image: "/locations/gisozi-main.jpg", href: "/iwacu/kigali-tours?venue=gisozi" },
      { id: "nyamata", status: "tour", image: "/locations/nyamata-main.jpg", href: "/iwacu/kigali-tours?venue=nyamata" },
      { id: "ntarama", status: "soon", image: null, href: null },
      { id: "murambi", status: "soon", image: null, href: null },
      { id: "kingsPalace", status: "soon", image: null, href: null },
      { id: "ethnographic", status: "soon", image: null, href: null },
      { id: "dianFossey", status: "soon", image: null, href: null },
    ],
  },
  {
    id: "lakes",
    places: [
      { id: "kivu", status: "soon", image: null, href: null },
      { id: "twinLakes", status: "soon", image: null, href: null },
      { id: "muhazi", status: "soon", image: null, href: null },
      { id: "congoNile", status: "soon", image: null, href: null },
    ],
  },
  {
    id: "mountains",
    places: [
      { id: "bigogwe", status: "maintenance", image: "/activities/bigogwe/cover.jpg", href: null },
      { id: "bisoke", status: "soon", image: "/backgrounds/bisoke.jpg", href: null },
      { id: "karisimbi", status: "soon", image: null, href: null },
      { id: "musanzeCaves", status: "soon", image: null, href: null },
      { id: "virunga", status: "soon", image: null, href: null },
    ],
  },
  {
    id: "culture",
    places: [
      { id: "kigali", status: "tour", image: "/locations/kigali-skyline-night.jpg", href: "/iwacu/kigali-tours" },
      { id: "culturalVillages", status: "soon", image: null, href: null },
      { id: "coffeeTea", status: "soon", image: null, href: null },
    ],
  },
] as const satisfies readonly { id: string; places: readonly TripPlace[] }[];
export type TripCategoryId = (typeof TRIP_CATEGORIES)[number]["id"];

/* ─── which trips can be built ───────────────────────────────────────── */

/** Trips with a builder and booking steps. Each has its rules in TRIP_RULES below. Words: Trips.<id>. */
export const BOOKABLE_TRIPS = ["akagera", "nyungwe"] as const;
export type TripId = (typeof BOOKABLE_TRIPS)[number];
export const isBookableTrip = (v: unknown): v is TripId => BOOKABLE_TRIPS.includes(v as TripId);

export const TRIP_PACKAGES = ["basic", "standard"] as const;
export type TripPackage = (typeof TRIP_PACKAGES)[number];

export const TRIP_VEHICLES = ["comfort", "sedan", "safari", "premium", "luxury", "minibus"] as const;
export type TripVehicle = (typeof TRIP_VEHICLES)[number];

/**
 * Every car a trip can use. `seats`: guests one car takes (the driver's seat isn't counted;
 * on the safari car the driver is the guide). `class`: the Movana class it's priced as, or
 * null for the safari car, which has one USD price. Which trip and package offers which car
 * is in TRIP_RULES.
 */
const VEHICLES: Record<TripVehicle, { seats: number; class: VehicleId | null }> = {
  comfort: { seats: 4, class: "suv" },
  sedan: { seats: 3, class: "sedan" },
  safari: { seats: 8, class: null },
  premium: { seats: 6, class: "premium_suv" },
  luxury: { seats: 4, class: "luxury_suv" },
  minibus: { seats: 10, class: "van" },
};

export const vehicleSeats = (v: TripVehicle) => VEHICLES[v].seats;
export const vehiclesFor = (pkg: TripPackage, tripId: TripId = "akagera") =>
  TRIP_VEHICLES.filter((v) => TRIP_RULES[tripId].vehicles[v] === pkg);

/**
 * "buffet": Basic's lunch, a must on Basic (Lionel, 6 Nov 2026).
 * "chosen": Standard's lunch at the budget the customer picks (lunchBudgets()).
 * "none": Standard without lunch, quoted by hand.
 */
export const LUNCH_CHOICES = ["buffet", "chosen", "none"] as const;
export type LunchChoice = (typeof LUNCH_CHOICES)[number];
export const lunchChoicesFor = (pkg: TripPackage): readonly LunchChoice[] =>
  pkg === "basic" ? ["buffet"] : ["chosen", "none"];

/** Akagera Standard's lowest lunch budget, RWF per guest. */
export const STANDARD_LUNCH_FROM = 20_000;
const LUNCH_STEP = 5_000;

/** Basic's lunch, RWF per guest. */
export const basicLunch = (rates: TripRates, tripId: TripId = "akagera") => TRIP_RULES[tripId].lunch.basic(rates);

/** Standard's lunch budgets, RWF per guest, from the trip's lowest to its highest in steps of 5,000. */
export function lunchBudgets(rates: TripRates, tripId: TripId = "akagera"): number[] {
  const { from, to } = TRIP_RULES[tripId].lunch;
  const top = Math.max(from, to(rates));
  const out: number[] = [];
  for (let n = from; n < top; n += LUNCH_STEP) out.push(n);
  return [...out, top];
}

/* ─── guests ─────────────────────────────────────────────────────────── */

/** The nationality groups the builder asks for. Each park's sheet maps onto them (TRIP_RULES.entry). */
export const GUEST_GROUPS = ["citizen", "eac", "panAfricanResident", "foreignResident", "panAfrican", "international"] as const;
export type GuestGroup = (typeof GUEST_GROUPS)[number];

/** One day's park entry per guest. Ages: child 6 to 12; 13 and over pay as adults; 5 and under are free. */
type EntryFee = { adult: number; child: number; currency: "RWF" | "USD" };

export type GuestCount = { adults: number; children: number };
export type TripGuests = Record<GuestGroup, GuestCount> & { infants: number };

export const noGuests = (): TripGuests => ({
  citizen: { adults: 0, children: 0 },
  eac: { adults: 0, children: 0 },
  panAfricanResident: { adults: 0, children: 0 },
  foreignResident: { adults: 0, children: 0 },
  panAfrican: { adults: 0, children: 0 },
  international: { adults: 0, children: 0 },
  infants: 0,
});

export const MAX_TRIP_GUESTS = 20;

export const payingGuests = (g: TripGuests) => GUEST_GROUPS.reduce((n, id) => n + g[id].adults + g[id].children, 0);
/** Everyone in the car, children aged 5 and under included. */
export const totalGuests = (g: TripGuests) => payingGuests(g) + g.infants;

/* ─── activity prices ────────────────────────────────────────────────── */

/**
 * How an activity is priced. Per person: adult (13+) and child (6 to 12), USD; 5 and under
 * pay nothing. Flat: one USD price for the boat, tent or permit. Camping: one night,
 * Rwandan citizens at the national rate. Tier: Nyungwe's three price bands, Rwandan and EAC
 * citizens in RWF, residents and other Africans in USD, international visitors in USD.
 * `min`: fewest guests the park takes. `payFor`: fewer guests than this pay for this many.
 * `max`: most guests. `groupOf8`: one USD price from 8 guests. `adultsOnly`: no children
 * aged 6 to 12 (chimpanzees: 15 and over).
 */
type ActivityFee =
  | { per: "person"; adult: number; child: number; min?: number; groupOf8?: number }
  | { per: "flat"; price: number }
  | { per: "camping"; adult: number; child: number; nationalAdult: number; nationalChild: number }
  | {
      per: "tier"; rwf: number; resident: number; international: number;
      childRwf?: number; childUsd?: number; min?: number; max?: number; payFor?: number; groupOf8?: number; adultsOnly?: true;
    };

/**
 * Akagera, from "Pricing for Akagera National Park", USD. The sheet's fines and breakdown
 * recovery fees aren't choices, and annual passes replace the entry fee, so they aren't
 * here. Game drives cost nothing extra: our own car does them, with its park kilometres
 * in the car price and the guide fee and car's park entry already in the trip.
 */
const AKAGERA_ACTIVITIES = {
  gameDriveHalf: { per: "flat", price: 0 },
  boatScheduled: { per: "person", adult: 35, child: 20 },
  boatSunset: { per: "person", adult: 45, child: 30 },
  boatPrivate: { per: "flat", price: 200 },
  boatPrivateLarge: { per: "flat", price: 360 },
  gameDriveFull: { per: "flat", price: 0 },
  nightDrive: { per: "person", adult: 40, child: 25, min: 2 },
  behindScenes: { per: "person", adult: 25, child: 15, min: 4, groupOf8: 180 },
  walkTheLine: { per: "person", adult: 30, child: 20, min: 3 },
  community: { per: "person", adult: 30, child: 20, min: 3 },
  fishing: { per: "person", adult: 25, child: 15 },
  camping: { per: "camping", adult: 25, child: 15, nationalAdult: 15, nationalChild: 10 },
  campingMihindi: { per: "camping", adult: 50, child: 30, nationalAdult: 40, nationalChild: 20 },
  tentHire: { per: "flat", price: 30 },
  filming: { per: "flat", price: 400 },
  landing: { per: "flat", price: 50 },
  research: { per: "flat", price: 200 },
  rangerAssistance: { per: "flat", price: 25 },
} as const satisfies Record<string, ActivityFee>;

/**
 * Nyungwe, from the Nyungwe Tourism Pricing Scheme 2025-2026 and the 2025-2026 zipline and
 * rope course list. The entry covers every nature trail, waterfalls included, so the trails
 * cost nothing extra. Children pay the adult activity rate, except behind the scenes, until
 * the park says otherwise (Lionel, 6 Nov 2026). Left out, as on Akagera: fines, annual
 * passes, the multi-day trails and the guest houses, because the trip is one day.
 */
const NYUNGWE_ACTIVITIES = {
  trails: { per: "flat", price: 0 },
  canopyWalk: { per: "tier", rwf: 5_000, resident: 20, international: 40, payFor: 2, max: 8 },
  zipline: { per: "tier", rwf: 20_000, resident: 80, international: 100 },
  ziplineCanopy: { per: "tier", rwf: 23_000, resident: 100, international: 125 },
  ropeCourse: { per: "tier", rwf: 10_000, resident: 20, international: 35 },
  ziplineRopeCanopy: { per: "tier", rwf: 30_000, resident: 110, international: 150 },
  birding: { per: "tier", rwf: 5_000, resident: 20, international: 40, payFor: 2, max: 8 },
  primateTrek: { per: "tier", rwf: 5_000, resident: 20, international: 40, payFor: 2, max: 8 },
  chimpTracking: { per: "tier", rwf: 25_000, resident: 75, international: 150, adultsOnly: true },
  chimpHabituation: { per: "tier", rwf: 30_000, resident: 100, international: 200, max: 4, adultsOnly: true },
  nightWalk: { per: "tier", rwf: 5_000, resident: 20, international: 40, payFor: 2, max: 8 },
  behindScenesNyungwe: { per: "tier", rwf: 25_000, resident: 25, international: 25, childUsd: 5, childRwf: 5_000, min: 4, groupOf8: 180 },
  filmingNyungwe: { per: "flat", price: 300 },
} as const satisfies Record<string, ActivityFee>;

export type TripActivity = keyof typeof AKAGERA_ACTIVITIES | keyof typeof NYUNGWE_ACTIVITIES;

/* ─── each trip's rules ──────────────────────────────────────────────── */

type TripRules = {
  /** The pricing destination (lib/pricing.ts) the car drives to and back. */
  destination: string;
  /** Km driven at the park, on top of the road there and back. */
  parkKm: (rates: TripRates) => number;
  /** Which cars each package offers. */
  vehicles: Partial<Record<TripVehicle, TripPackage>>;
  entry: Record<GuestGroup, EntryFee>;
  activities: Record<string, ActivityFee>;
  /** Shown with a "Suggested" tag: it fits a one-day visit. */
  suggested: TripActivity | null;
  /** One or the other: choosing one closes the rest of its group. */
  chooseOne: readonly (readonly TripActivity[])[];
  /** Only with another activity, like a hired tent with camping. */
  needs: Partial<Record<TripActivity, TripActivity>>;
  /** They end, or start, out of reach of a day trip, so they need a night's stay. */
  needsStay: readonly TripActivity[];
  /** A night's camping: the night's stay itself. */
  overnight: readonly TripActivity[];
  /** An activity that fills the whole park day, so nothing in `daytime` fits beside it. */
  wholeDay: { id: TripActivity; daytime: readonly TripActivity[] } | null;
  /** The park guide, per trip in USD, and which cars need one. */
  guideFor: (vehicle: TripVehicle) => boolean;
  /** The car's own park entry, USD. 0: the park doesn't charge one. */
  carEntryUsd: (rates: TripRates) => number;
  lunch: { basic: (rates: TripRates) => number; from: number; to: (rates: TripRates) => number };
  /** Half-hour pickups from `earliest` to `latest`, "HH:MM". */
  pickup: { earliest: string; latest: (rates: TripRates) => string };
  dayPlan: (sel: DayPlanInput) => DayPlanStop[];
};

/**
 * Akagera, one-day entry. Citizens' fees are set in RWF; every other fee is in USD. Cars: SUVs
 * and the safari car, no sedans or electric cars. A guide on every SUV ($40); the safari car's
 * driver is the guide. The park charges every car its entry.
 */
const AKAGERA: TripRules = {
  destination: "akagera",
  parkKm: (rates) => rates.inParkKm,
  vehicles: { comfort: "basic", safari: "standard", premium: "standard", luxury: "standard" },
  entry: {
    citizen: { adult: 15_000, child: 10_000, currency: "RWF" },
    eac: { adult: 15_000, child: 10_000, currency: "RWF" },
    panAfricanResident: { adult: 25, child: 15, currency: "USD" },
    foreignResident: { adult: 50, child: 30, currency: "USD" },
    panAfrican: { adult: 50, child: 30, currency: "USD" },
    international: { adult: 100, child: 50, currency: "USD" },
  },
  activities: AKAGERA_ACTIVITIES,
  suggested: "gameDriveHalf",
  chooseOne: [
    ["gameDriveHalf", "gameDriveFull"],
    ["boatScheduled", "boatPrivate", "boatPrivateLarge"],
    ["camping", "campingMihindi"],
  ],
  needs: { tentHire: "camping" },
  needsStay: ["nightDrive"],
  overnight: ["camping", "campingMihindi"],
  wholeDay: { id: "gameDriveFull", daytime: ["boatScheduled", "boatPrivate", "boatPrivateLarge", "behindScenes", "walkTheLine", "community", "fishing"] },
  guideFor: (v) => v !== "safari",
  carEntryUsd: (rates) => rates.vehicleFeeUsd,
  lunch: { basic: (rates) => rates.lunchBuffet, from: STANDARD_LUNCH_FROM, to: (rates) => rates.lunchChosen },
  pickup: { earliest: "04:00", latest: (rates) => rates.latestPickup },
  dayPlan: (sel) => akageraDayPlan(sel),
};

/**
 * Nyungwe, a one-day round trip from Kigali, about 225 km each way (Lionel, 6 Nov 2026).
 * Day visitors pay the one-night entry. Every car class can go. Guides are included in
 * Nyungwe's activity fees, and the park charges no car entry. Lunch is from the Gisakura
 * coffee shop: 10,000 RWF on Basic, a budget from 10,000 on Standard.
 */
const NYUNGWE: TripRules = {
  destination: "nyungwe",
  // Gisakura to Uwinka and back, for the canopy walk and trails.
  parkKm: () => 60,
  vehicles: { comfort: "basic", sedan: "basic", premium: "standard", luxury: "standard", minibus: "standard" },
  entry: {
    citizen: { adult: 10_000, child: 5_000, currency: "RWF" },
    eac: { adult: 10_000, child: 5_000, currency: "RWF" },
    panAfricanResident: { adult: 60, child: 30, currency: "USD" },
    foreignResident: { adult: 60, child: 30, currency: "USD" },
    panAfrican: { adult: 60, child: 30, currency: "USD" },
    international: { adult: 100, child: 50, currency: "USD" },
  },
  activities: NYUNGWE_ACTIVITIES,
  suggested: "canopyWalk",
  // A package or its parts, never both.
  chooseOne: [
    ["zipline", "ziplineCanopy", "ziplineRopeCanopy"],
    ["canopyWalk", "ziplineCanopy", "ziplineRopeCanopy"],
    ["ropeCourse", "ziplineRopeCanopy"],
    ["chimpTracking", "chimpHabituation"],
  ],
  needs: {},
  // Chimpanzees start at dawn far from Gisakura, and the night walk ends after 20:00.
  needsStay: ["chimpTracking", "chimpHabituation", "nightWalk"],
  overnight: [],
  wholeDay: null,
  guideFor: () => false,
  carEntryUsd: () => 0,
  lunch: { basic: () => 10_000, from: 10_000, to: () => 50_000 },
  pickup: { earliest: "03:30", latest: () => "04:30" },
  dayPlan: (sel) => nyungweDayPlan(sel),
};

const TRIP_RULES: Record<TripId, TripRules> = { akagera: AKAGERA, nyungwe: NYUNGWE };

/** The trip an activity belongs to: activity ids are unique across trips. */
const tripOfActivity = (a: TripActivity): TripId => (a in AKAGERA_ACTIVITIES ? "akagera" : "nyungwe");
const rulesOf = (a: TripActivity) => TRIP_RULES[tripOfActivity(a)];
const feeOf = (a: TripActivity): ActivityFee => rulesOf(a).activities[a];

/** A trip's activities, in the order they're listed. */
export const tripActivities = (tripId: TripId = "akagera") => Object.keys(TRIP_RULES[tripId].activities) as TripActivity[];
export const suggestedActivity = (tripId: TripId = "akagera") => TRIP_RULES[tripId].suggested;
/** Whether this car needs the park guide, which the trip charges once. */
export const needsParkGuide = (vehicle: TripVehicle, tripId: TripId = "akagera") => TRIP_RULES[tripId].guideFor(vehicle);
/** Whether the park charges the car its own entry. */
export const chargesCarEntry = (tripId: TripId = "akagera") => TRIP_RULES[tripId].carEntryUsd(DEFAULT_TRIP_RATES) > 0;

/** Everything the customer chose. */
export type TripSelection = {
  tripId: TripId;
  pkg: TripPackage;
  vehicle: TripVehicle;
  guests: TripGuests;
  date: string;
  pickupTime: string;
  pickupPlace: string;
  /** [lat, lon], when the customer picked the spot by search, location or map. */
  pickupCoords: [number, number] | null;
  lunch: LunchChoice;
  /** RWF per guest, for Standard's "chosen" lunch: one of lunchBudgets(). Otherwise 0. */
  lunchBudget: number;
  breakfast: boolean;
  dinner: boolean;
  guide: boolean;
  activities: TripActivity[];
  extraStops: string;
  /**
   * A night's accommodation near the park, arranged and quoted by the team. The trip is
   * otherwise a one-day round trip from Kigali. Camping is a night's stay too, so not both.
   */
  stay: boolean;
};

/* ─── pickup times ───────────────────────────────────────────────────── */

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const clock = (mins: number) => `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

/** Half-hour pickups up to the latest one: later than that misses the park's early start. */
export function pickupTimes(rates: TripRates, tripId: TripId = "akagera"): string[] {
  const { earliest, latest } = TRIP_RULES[tripId].pickup;
  const out: string[] = [];
  for (let m = minutes(earliest); m <= minutes(latest(rates)); m += 30) out.push(clock(m));
  return out;
}

/** The latest pickup, "HH:MM". */
export const latestPickup = (rates: TripRates, tripId: TripId = "akagera") => TRIP_RULES[tripId].pickup.latest(rates);

/* ─── when a trip can start ──────────────────────────────────────────── */

/** Hours from sending the request to the pickup: time for the team to confirm the car, the guide and the park. */
export const TRIP_LEAD_HOURS = 24;
/** How far ahead a trip can be asked for, in days. */
export const TRIP_MAX_DAYS_AHEAD = 365;

const HOUR = 60 * 60 * 1000;
/** Rwanda keeps UTC+2 all year. */
const KIGALI_OFFSET_HOURS = 2;

const isRealDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;
const kigaliDate = (now: Date) => new Date(now.getTime() + KIGALI_OFFSET_HOURS * HOUR).toISOString().slice(0, 10);
const plusDays = (isoDate: string, days: number) => new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * 24 * HOUR).toISOString().slice(0, 10);

/** The pickup moment, ms since epoch, from a Kigali date and time. NaN when either isn't real. */
export const pickupInstant = (date: string, time: string) =>
  isRealDate(date) && /^\d{2}:\d{2}$/.test(time) ? Date.parse(`${date}T${time}:00+02:00`) : NaN;

/** A pickup at least TRIP_LEAD_HOURS away, and no more than TRIP_MAX_DAYS_AHEAD days. */
export function startsInTime(date: string, time: string, now: Date = new Date()): boolean {
  const at = pickupInstant(date, time);
  if (!Number.isFinite(at)) return false;
  return at - now.getTime() >= TRIP_LEAD_HOURS * HOUR && date <= latestTripDate(now);
}

/** The first date (Kigali) whose latest pickup is far enough ahead: the date picker's minimum. */
export function earliestTripDate(rates: TripRates, now: Date = new Date(), tripId: TripId = "akagera"): string {
  const today = kigaliDate(now);
  for (let i = 0; i <= 3; i++) {
    const day = plusDays(today, i);
    if (startsInTime(day, latestPickup(rates, tripId), now)) return day;
  }
  return plusDays(today, 3);
}

/** The last date a trip can be asked for: the date picker's maximum. */
export const latestTripDate = (now: Date = new Date()) => plusDays(kigaliDate(now), TRIP_MAX_DAYS_AHEAD);

/* ─── the price ──────────────────────────────────────────────────────── */

export type TripQuote = {
  total: number;
  /** total ÷ paying guests, rounded to the franc. */
  perGuest: number;
  /** total in dollars at the current rate, an estimate. */
  usd: number;
  /** total in euros at the current rate, an estimate. */
  eur: number;
  car: number;
  entry: number;
  lunch: number;
  guide: number;
  /** The car's park entry. */
  vehicleFee: number;
  /** Snacks and water. 0 with a safari car. */
  snacks: number;
  /** The chosen activities. */
  activities: number;
  /** Each chosen activity's price, RWF, in the order chosen. 0: included. */
  activityFees: { id: TripActivity; rwf: number }[];
  /** false: this group doesn't fit the car, so the team plans it. */
  fits: boolean;
  /** The group stays the night: the second day (car, driver, entry) is quoted by the team. */
  overnight: boolean;
  /** Something here has no price yet, so the total is a starting price. */
  hasQuotedItems: boolean;
};

// "|| 0": never -0, which would print as "-0 RWF".
const roundUp = (amount: number, step: number) => Math.ceil(amount / step - 1e-9) * step || 0;

/** A USD fee in RWF at the current rate, rounded up to the customer's rounding step. */
export const usdInRwf = (usd: number, rates: TripRates, cfg: PricingConfig = DEFAULT_PRICING) =>
  roundUp(usd * rates.usdToRwf, Math.max(1, cfg.roundTotalTo));

/** One guest's entry fee, RWF. */
export function entryFee(group: GuestGroup, age: "adult" | "child", rates: TripRates, cfg: PricingConfig = DEFAULT_PRICING, tripId: TripId = "akagera"): number {
  const fee = TRIP_RULES[tripId].entry[group];
  return fee.currency === "RWF" ? fee[age] : usdInRwf(fee[age], rates, cfg);
}

/** One guest's entry fee in dollars, or null when the park sets it in RWF. */
export function entryFeeUsd(group: GuestGroup, age: "adult" | "child", tripId: TripId = "akagera"): number | null {
  const fee = TRIP_RULES[tripId].entry[group];
  return fee.currency === "USD" ? fee[age] : null;
}

/** The km one car's price covers: the road there and back, and driving at the park. */
export const tripKm = (rates: TripRates, tripId: TripId = "akagera") =>
  (getDestination(TRIP_RULES[tripId].destination)?.km ?? 0) * 2 + TRIP_RULES[tripId].parkKm(rates);

/** A car's daily rate, the part that differs most between classes. null for the safari car. */
export function carDayRate(vehicle: TripVehicle, cfg: PricingConfig = DEFAULT_PRICING): number | null {
  const carClass = VEHICLES[vehicle].class;
  return carClass ? getVehicle(carClass, cfg).basePrice : null;
}

/**
 * The car for the day: the Movana formula over the road there and back and the park km,
 * charged once (no outside-Kigali charge on top of the driver's fee). Safari car: its USD price.
 */
export function carPrice(vehicle: TripVehicle, rates: TripRates, cfg: PricingConfig = DEFAULT_PRICING, tripId: TripId = "akagera"): number {
  const carClass = VEHICLES[vehicle].class;
  if (!carClass) return usdInRwf(rates.safariCarUsd, rates, cfg);
  const { carBase, serviceFee, fuelCost, profit } = quote(
    { kind: "long", zone: "outside", distanceKm: tripKm(rates, tripId), days: 1, oneWay: false, withDriver: true },
    carClass,
    cfg,
  ).breakdown;
  return roundUp(carBase + serviceFee + fuelCost + profit, Math.max(1, cfg.roundTotalTo));
}

const countAges = (guests: TripGuests, groups: readonly GuestGroup[] = GUEST_GROUPS) => ({
  adults: groups.reduce((n, id) => n + guests[id].adults, 0),
  children: groups.reduce((n, id) => n + guests[id].children, 0),
});

/** Why this group can't do an activity: too few, too many, or children too young. null: it can. */
export function activityBlock(a: TripActivity, guests: TripGuests): { kind: "min" | "max"; count: number } | { kind: "age" } | null {
  const fee = feeOf(a);
  const { adults, children } = countAges(guests);
  const paying = adults + children;
  const min = (fee.per === "person" || fee.per === "tier") && fee.min ? fee.min : 1;
  if (paying < min) return { kind: "min", count: min };
  if (fee.per === "tier" && fee.max && paying > fee.max) return { kind: "max", count: fee.max };
  if (fee.per === "tier" && fee.adultsOnly && (children > 0 || guests.infants > 0)) return { kind: "age" };
  return null;
}

/** What an activity costs this group, RWF. null: this group can't do it (activityBlock). */
export function activityRwf(a: TripActivity, guests: TripGuests, rates: TripRates, cfg: PricingConfig = DEFAULT_PRICING): number | null {
  if (activityBlock(a, guests)) return null;
  const fee = feeOf(a);
  const { adults, children } = countAges(guests);
  const paying = adults + children;
  switch (fee.per) {
    case "person":
      return usdInRwf(fee.groupOf8 && paying >= 8 ? fee.groupOf8 : adults * fee.adult + children * fee.child, rates, cfg);
    case "flat":
      return usdInRwf(fee.price, rates, cfg);
    case "camping": {
      const { adults: na, children: nc } = guests.citizen;
      return usdInRwf(na * fee.nationalAdult + nc * fee.nationalChild + (adults - na) * fee.adult + (children - nc) * fee.child, rates, cfg);
    }
    case "tier": {
      if (fee.groupOf8 && paying >= 8) return usdInRwf(fee.groupOf8, rates, cfg);
      const citizens = countAges(guests, ["citizen", "eac"]);
      const residents = countAges(guests, ["panAfricanResident", "foreignResident", "panAfrican"]);
      const visitors = countAges(guests, ["international"]);
      const rwf = citizens.adults * fee.rwf + citizens.children * (fee.childRwf ?? fee.rwf);
      const usd = residents.adults * fee.resident + residents.children * (fee.childUsd ?? fee.resident)
        + visitors.adults * fee.international + visitors.children * (fee.childUsd ?? fee.international);
      const total = rwf + usdInRwf(usd, rates, cfg);
      // Fewer than the park's minimum pay for the minimum: one guest pays for two.
      return fee.payFor && paying < fee.payFor ? roundUp((total * fee.payFor) / paying, Math.max(1, cfg.roundTotalTo)) : total;
    }
  }
}

/**
 * What stops this activity being chosen beside `chosen`, or null when nothing does.
 * `stay`: accommodation is chosen. `other: "stay"` is that accommodation, not an activity.
 */
export function activityConflict(a: TripActivity, chosen: readonly TripActivity[], stay = false): { kind: "instead" | "needs"; other: TripActivity | "stay" } | null {
  const rules = rulesOf(a);
  // Camping is the night's stay, so it's one or the other.
  if (stay && rules.overnight.includes(a)) return { kind: "instead", other: "stay" };
  if (rules.needsStay.includes(a) && !stay && !chosen.some((x) => rules.overnight.includes(x))) return { kind: "needs", other: "stay" };
  for (const group of rules.chooseOne) {
    const other = group.includes(a) ? group.find((x) => x !== a && chosen.includes(x)) : undefined;
    if (other) return { kind: "instead", other };
  }
  // A whole-day activity takes the park day, so nothing else fits in daytime (evenings and nights still do).
  const whole = rules.wholeDay;
  if (whole && a === whole.id) {
    const busy = chosen.find((x) => whole.daytime.includes(x));
    if (busy) return { kind: "instead", other: busy };
  } else if (whole && whole.daytime.includes(a) && chosen.includes(whole.id)) {
    return { kind: "instead", other: whole.id };
  }
  const needed = rules.needs[a];
  return needed && !chosen.includes(needed) ? { kind: "needs", other: needed } : null;
}

/**
 * The activities that really apply: this group can do them, and no clash. The first of a
 * clashing pair stays, and a choice that needs another (tent hire needs camping, a night
 * activity needs a night's stay) stays only when that one does.
 */
export function activeActivities(list: readonly TripActivity[], guests: TripGuests, stay = false): TripActivity[] {
  const out: TripActivity[] = [];
  for (const a of list) {
    if (activityBlock(a, guests)) continue;
    if (activityConflict(a, out, stay)?.kind === "instead") continue;
    out.push(a);
  }
  // Checked once everything else is in, whatever order it was chosen in.
  return out.filter((a) => activityConflict(a, out, stay)?.kind !== "needs");
}

/**
 * Whether the group stays the night: accommodation, a night's camping, or an activity out of
 * reach of a day trip. Otherwise the trip is a one-day round trip from Kigali.
 */
export const staysOvernight = (activities: readonly TripActivity[], stay = false) =>
  stay || activities.some((a) => rulesOf(a).overnight.includes(a) || rulesOf(a).needsStay.includes(a));

export function quoteTrip(sel: Pick<TripSelection, "tripId" | "pkg" | "vehicle" | "guests" | "lunch" | "lunchBudget" | "breakfast" | "dinner" | "activities" | "extraStops" | "stay">, rates: TripRates, cfg: PricingConfig = DEFAULT_PRICING): TripQuote {
  const rules = TRIP_RULES[sel.tripId];
  const paying = payingGuests(sel.guests);
  // Nothing to price until someone is coming.
  if (paying < 1) {
    return { total: 0, perGuest: 0, usd: 0, eur: 0, car: 0, entry: 0, lunch: 0, guide: 0, vehicleFee: 0, snacks: 0, activities: 0, activityFees: [], fits: true, overnight: false, hasQuotedItems: false };
  }
  const car = carPrice(sel.vehicle, rates, cfg, sel.tripId);
  const entry = GUEST_GROUPS.reduce(
    (sum, id) => sum + sel.guests[id].adults * entryFee(id, "adult", rates, cfg, sel.tripId) + sel.guests[id].children * entryFee(id, "child", rates, cfg, sel.tripId),
    0,
  );
  const lunchFee = sel.lunch === "buffet" ? rules.lunch.basic(rates) : sel.lunch === "chosen" ? sel.lunchBudget : 0;
  const lunch = lunchFee * paying;
  // Akagera: a guide on every SUV (the safari car's driver is the guide). Nyungwe: guides come with each activity.
  const guide = rules.guideFor(sel.vehicle) ? usdInRwf(rates.guideUsd, rates, cfg) : 0;
  const carEntry = rules.carEntryUsd(rates);
  const vehicleFee = carEntry > 0 ? usdInRwf(carEntry, rates, cfg) : 0;
  const snacks = sel.vehicle === "safari" ? 0 : rates.snacksPerGuest * paying;
  const activityFees = sel.activities.map((id) => ({ id, rwf: activityRwf(id, sel.guests, rates, cfg) ?? 0 }));
  const activities = activityFees.reduce((sum, a) => sum + a.rwf, 0);
  // Priced as one day: a night away adds a second day, and any accommodation, which the team quotes.
  const overnight = staysOvernight(sel.activities, sel.stay);
  const total = roundUp(car + entry + lunch + guide + vehicleFee + snacks + activities, Math.max(1, cfg.roundTotalTo));
  return {
    total,
    perGuest: Math.round(total / paying),
    usd: rates.usdToRwf > 0 ? Math.round(total / rates.usdToRwf) : 0,
    eur: rates.eurToRwf > 0 ? Math.round(total / rates.eurToRwf) : 0,
    car, entry, lunch, guide, vehicleFee, snacks, activities, activityFees,
    fits: totalGuests(sel.guests) <= vehicleSeats(sel.vehicle),
    overnight,
    hasQuotedItems: overnight || sel.breakfast || sel.dinner || (sel.pkg !== "basic" && sel.lunch === "none") || sel.extraStops.trim() !== "",
  };
}

/* ─── the day plan ───────────────────────────────────────────────────── */

/**
 * One line of the day. `time` is a clock time, "day2" for the next day, or "" for what's
 * arranged with the park at no set hour. `activity`: `id` is a TripActivity, not a plan word.
 * `until`: when it ends.
 */
export type DayPlanStop = { time: string; id: string; activity?: boolean; until?: string };
type DayPlanInput = Pick<TripSelection, "tripId" | "pickupTime" | "lunch" | "breakfast" | "dinner" | "activities" | "stay">;

/** The day, moved with the pickup time and built around what was chosen. A guide only: the team confirms the times. */
export function dayPlan(sel: DayPlanInput): DayPlanStop[] {
  return TRIP_RULES[sel.tripId].dayPlan(sel);
}

const QUARTER = 15;
const startOf = (sel: DayPlanInput) =>
  minutes(/^\d{2}:\d{2}$/.test(sel.pickupTime) ? sel.pickupTime : latestPickup(DEFAULT_TRIP_RATES, sel.tripId));

/** Akagera: when an activity can happen, from the park's sheet. `at`: its departures. `from` to `to`: when it can start. */
const AKAGERA_SLOTS: Partial<Record<TripActivity, { length: number; at?: string[]; from?: string; to?: string }>> = {
  boatScheduled: { length: 60, at: ["07:30", "09:00", "15:00"] },
  boatPrivate: { length: 60, from: "10:30", to: "13:30" },
  boatPrivateLarge: { length: 60, from: "10:30", to: "13:30" },
  behindScenes: { length: 90 },
  walkTheLine: { length: 120 },
  community: { length: 240 },
  fishing: { length: 120 },
};
const AKAGERA_EVENING: Partial<Record<TripActivity, { at: string; end: string }>> = {
  boatSunset: { at: "16:30", end: "18:00" },
  nightDrive: { at: "17:30", end: "20:30" },
};
const HALF_DAY_DRIVE = 300;

/**
 * Akagera: about 2.5 hours each way. Activities take their slots first, then game drives fill
 * what's left. A chosen half-day drive ends the park day when the last thing ends, so nobody
 * waits around; otherwise the group leaves well before the gates close, later only for an
 * evening activity.
 */
function akageraDayPlan(sel: DayPlanInput): DayPlanStop[] {
  const all = tripActivities("akagera");
  const start = startOf(sel);
  const parkStart = start + 180;
  const lunchAt = start + 420;
  const lunchEnd = lunchAt + 60;
  const parkEnd = start + 630;
  const chosen = sel.activities;
  const timed: { at: number; stop: DayPlanStop }[] = [];
  const add = (at: number, id: string, activity = false, until?: number) =>
    timed.push({ at, stop: { time: clock(at), id, ...(activity && { activity }), ...(until !== undefined && { until: clock(until) }) } });
  const untimed: DayPlanStop[] = [];

  add(start, "pickup");
  add(start + 150, "arrival");
  if (sel.breakfast) add(start + 165, "breakfast");
  if (sel.lunch !== "none") add(lunchAt, "lunch");

  // Taken hours. Lunch's hour divides the day, so game drives fall either side of it. With no
  // lunch it still splits the usual morning and afternoon drives, but not a single half-day one.
  const halfDay = chosen.includes("gameDriveHalf");
  const busy: [number, number][] = sel.lunch !== "none" || !halfDay ? [[lunchAt, lunchEnd]] : [];
  const isFree = (at: number, length: number) => busy.every(([a, b]) => at + length <= a || at >= b);
  for (const a of all) {
    const slot = AKAGERA_SLOTS[a];
    if (!chosen.includes(a) || !slot) continue;
    const first = slot.from ? minutes(slot.from) : parkStart;
    const last = slot.to ? minutes(slot.to) : parkEnd - slot.length;
    const options = slot.at ? slot.at.map(minutes) : Array.from({ length: Math.max(0, Math.floor((last - first) / QUARTER) + 1) }, (_, i) => first + i * QUARTER);
    const at = options.find((t) => t >= parkStart && t + slot.length <= parkEnd && isFree(t, slot.length));
    if (at === undefined) {
      untimed.push({ time: "", id: a, activity: true });
      continue;
    }
    busy.push([at, at + slot.length]);
    add(at, a, true, at + slot.length);
  }
  for (const a of all) {
    if (chosen.includes(a) && !AKAGERA_SLOTS[a] && !AKAGERA_EVENING[a] && !AKAGERA.overnight.includes(a) && a !== "gameDriveHalf" && a !== "gameDriveFull") {
      untimed.push({ time: "", id: a, activity: true });
    }
  }

  // The free stretches of the day, for game drives.
  const gaps: [number, number][] = [];
  let cursor = parkStart;
  for (const [a, b] of [...busy].sort((x, y) => x[0] - y[0])) {
    if (a - cursor >= 60) gaps.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (parkEnd - cursor >= 60) gaps.push([cursor, parkEnd]);

  if (chosen.includes("gameDriveFull")) {
    add(parkStart, "gameDriveFull", true, parkEnd);
  } else if (halfDay) {
    const longest = gaps.reduce<[number, number] | null>((best, g) => (!best || g[1] - g[0] > best[1] - best[0] ? g : best), null);
    if (longest) {
      const end = Math.min(longest[1], longest[0] + HALF_DAY_DRIVE);
      busy.push([longest[0], end]);
      add(longest[0], "gameDriveHalf", true, end);
    } else untimed.push({ time: "", id: "gameDriveHalf", activity: true });
  } else {
    for (const [a] of gaps) add(a, a < lunchAt ? "gameDrive" : "gameDrive2");
  }

  // The evening: a later boat or night drive moves the way home, and a night away ends the day in the park.
  let dayEnd = halfDay ? Math.max(parkStart, ...busy.map(([, end]) => end)) : parkEnd;
  for (const a of all) {
    const evening = AKAGERA_EVENING[a];
    if (!chosen.includes(a) || !evening) continue;
    add(minutes(evening.at), a, true, minutes(evening.end));
    dayEnd = Math.max(dayEnd, minutes(evening.end));
  }
  const camp = AKAGERA.overnight.find((a) => chosen.includes(a));
  const overnight = staysOvernight(chosen, sel.stay);
  if (overnight) {
    const dinnerAt = Math.max(dayEnd, minutes("19:00"));
    if (camp) add(dayEnd, camp, true);
    if (sel.dinner) add(dinnerAt, "dinner");
    if (!camp) add(sel.dinner ? dinnerAt + 60 : dayEnd, "stay");
  } else {
    add(dayEnd, "leave");
    add(dayEnd + 180, "kigali");
    if (sel.dinner) add(dayEnd + 210, "dinner");
  }

  const stops = timed.sort((a, b) => a.at - b.at).map((t) => t.stop);
  if (overnight) stops.push({ time: "day2", id: "leave" }, { time: "day2", id: "kigali" });
  return [...stops, ...untimed];
}

/** Nyungwe: how long each daytime activity takes, minutes. */
const NYUNGWE_LENGTHS: Partial<Record<TripActivity, number>> = {
  canopyWalk: 120,
  zipline: 90,
  ziplineCanopy: 180,
  ropeCourse: 90,
  ziplineRopeCanopy: 240,
  birding: 180,
  primateTrek: 180,
  behindScenesNyungwe: 90,
};
const NYUNGWE_TRAILS = 180;
const NYUNGWE_NIGHT_WALK = { at: "17:30", end: "20:30" };

/**
 * Nyungwe: about 5 hours each way, so the park day runs from about 09:30 to 15:00. Activities
 * take the first free time in turn, the trails the longest stretch left, and any other free
 * stretch is time on the trails with the entry ticket. Chimpanzees are the next morning, after
 * a night's stay; the night walk ends the first day.
 */
function nyungweDayPlan(sel: DayPlanInput): DayPlanStop[] {
  const start = startOf(sel);
  const arrival = start + 300;
  const parkStart = arrival + 30;
  const lunchAt = start + 510;
  const parkEnd = start + 660;
  const chosen = sel.activities;
  const timed: { at: number; stop: DayPlanStop }[] = [];
  const add = (at: number, id: string, activity = false, until?: number) =>
    timed.push({ at, stop: { time: clock(at), id, ...(activity && { activity }), ...(until !== undefined && { until: clock(until) }) } });
  const untimed: DayPlanStop[] = [];

  add(start, "pickup");
  add(arrival, "arrival");
  if (sel.breakfast) add(arrival + 15, "breakfast");
  const busy: [number, number][] = [];
  if (sel.lunch !== "none") {
    add(lunchAt, "lunch");
    busy.push([lunchAt, lunchAt + 60]);
  }
  const isFree = (at: number, length: number) => busy.every(([a, b]) => at + length <= a || at >= b);

  for (const a of tripActivities("nyungwe")) {
    const length = NYUNGWE_LENGTHS[a];
    if (!chosen.includes(a) || !length) continue;
    let at: number | undefined;
    for (let t = parkStart; t + length <= parkEnd; t += QUARTER) {
      if (isFree(t, length)) {
        at = t;
        break;
      }
    }
    if (at === undefined) {
      untimed.push({ time: "", id: a, activity: true });
      continue;
    }
    busy.push([at, at + length]);
    add(at, a, true, at + length);
  }
  if (chosen.includes("filmingNyungwe")) untimed.push({ time: "", id: "filmingNyungwe", activity: true });

  // What's left of the day: the trails, if chosen, take the longest stretch; the rest is free time on them.
  const gaps: [number, number][] = [];
  let cursor = parkStart;
  for (const [a, b] of [...busy].sort((x, y) => x[0] - y[0])) {
    if (a - cursor >= 60) gaps.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (parkEnd - cursor >= 60) gaps.push([cursor, parkEnd]);
  const longest = gaps.reduce<[number, number] | null>((best, g) => (!best || g[1] - g[0] > best[1] - best[0] ? g : best), null);
  for (const gap of gaps) {
    if (chosen.includes("trails") && gap === longest) {
      const end = Math.min(gap[1], gap[0] + NYUNGWE_TRAILS);
      add(gap[0], "trails", true, end);
    } else add(gap[0], "forestTime");
  }
  if (chosen.includes("trails") && !longest) untimed.push({ time: "", id: "trails", activity: true });

  let dayEnd = parkEnd;
  if (chosen.includes("nightWalk")) {
    add(minutes(NYUNGWE_NIGHT_WALK.at), "nightWalk", true, minutes(NYUNGWE_NIGHT_WALK.end));
    dayEnd = minutes(NYUNGWE_NIGHT_WALK.end);
  }
  const overnight = staysOvernight(chosen, sel.stay);
  if (overnight) {
    const dinnerAt = Math.max(dayEnd, minutes("19:00"));
    if (sel.dinner) add(dinnerAt, "dinner");
    add(sel.dinner ? dinnerAt + 60 : dayEnd, "stay");
  } else {
    add(dayEnd, "leave");
    add(dayEnd + 300, "kigali");
    if (sel.dinner) add(dayEnd + 330, "dinner");
  }

  const stops = timed.sort((a, b) => a.at - b.at).map((t) => t.stop);
  if (overnight) {
    for (const a of ["chimpTracking", "chimpHabituation"] as const) if (chosen.includes(a)) stops.push({ time: "day2", id: a, activity: true });
    stops.push({ time: "day2", id: "leave" }, { time: "day2", id: "kigali" });
  }
  return [...stops, ...untimed];
}

/* ─── checking what the browser sent ─────────────────────────────────── */

const isIn = <T extends string>(list: readonly T[], v: unknown): v is T => list.includes(v as T);
const count = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= MAX_TRIP_GUESTS ? v : 0);
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const coords = (v: unknown): [number, number] | null => {
  if (!Array.isArray(v) || typeof v[0] !== "number" || typeof v[1] !== "number") return null;
  return Math.abs(v[0]) <= 90 && Math.abs(v[1]) <= 180 ? [v[0], v[1]] : null;
};

/** A map link for the team to find the pickup spot. */
export const pickupMapLink = ([lat, lon]: [number, number]) => `https://www.google.com/maps?q=${lat.toFixed(6)},${lon.toFixed(6)}`;

/** The fewest letters a pickup place can have. */
const MIN_PICKUP_PLACE = 3;

/**
 * A selection rebuilt from untrusted JSON, or null when it can't be priced or booked:
 * a trip we don't build, a package and car that don't go together, too many guests for
 * the car, a lunch or pickup time we don't offer, a date that's not real, past, too soon
 * or too far ahead, or no pickup place.
 */
export function readTripSelection(raw: unknown, rates: TripRates, now: Date = new Date()): TripSelection | null {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (!isBookableTrip(r.tripId) || !isIn(TRIP_PACKAGES, r.pkg) || !isIn(TRIP_VEHICLES, r.vehicle)) return null;
  const tripId = r.tripId;
  const rules = TRIP_RULES[tripId];
  if (rules.vehicles[r.vehicle] !== r.pkg) return null;
  if (!isIn(lunchChoicesFor(r.pkg), r.lunch)) return null;
  const lunchBudget = r.lunch === "chosen" ? r.lunchBudget : 0;
  if (r.lunch === "chosen" && !lunchBudgets(rates, tripId).includes(lunchBudget as number)) return null;

  const g = (r.guests && typeof r.guests === "object" ? r.guests : {}) as Record<string, unknown>;
  const guests = noGuests();
  for (const id of GUEST_GROUPS) {
    const c = (g[id] && typeof g[id] === "object" ? g[id] : {}) as Record<string, unknown>;
    guests[id] = { adults: count(c.adults), children: count(c.children) };
  }
  guests.infants = count(g.infants);
  if (payingGuests(guests) < 1 || totalGuests(guests) > vehicleSeats(r.vehicle)) return null;

  const pickupTime = text(r.pickupTime, 5);
  if (!pickupTimes(rates, tripId).includes(pickupTime)) return null;
  const date = text(r.date, 10);
  if (!startsInTime(date, pickupTime, now)) return null;
  const pickupPlace = text(r.pickupPlace, 120);
  if (pickupPlace.length < MIN_PICKUP_PLACE) return null;
  const stay = r.stay === true;

  return {
    tripId,
    pkg: r.pkg,
    vehicle: r.vehicle,
    guests,
    date,
    pickupTime,
    pickupPlace,
    pickupCoords: coords(r.pickupCoords),
    lunch: r.lunch,
    lunchBudget: lunchBudget as number,
    breakfast: r.breakfast === true,
    dinner: r.dinner === true,
    guide: rules.guideFor(r.vehicle),
    activities: Array.isArray(r.activities)
      ? activeActivities(tripActivities(tripId).filter((a) => (r.activities as unknown[]).includes(a)), guests, stay)
      : [],
    extraStops: text(r.extraStops, 300),
    stay,
  };
}

/** The selection for the team, in plain lines for the booking's notes. */
export function tripSummaryLines(sel: TripSelection): string[] {
  const guests = GUEST_GROUPS.flatMap((id) => {
    const { adults, children } = sel.guests[id];
    return adults || children ? [`${id}: ${adults} adult(s), ${children} child(ren) 6-12`] : [];
  });
  return [
    `Trip: ${sel.tripId}`,
    `Package: ${sel.pkg}`,
    sel.pickupCoords ? `Pickup map: ${pickupMapLink(sel.pickupCoords)}` : null,
    `Vehicle: ${sel.vehicle}`,
    `Guests: ${guests.join("; ")}${sel.guests.infants ? `; aged 5 or under: ${sel.guests.infants}` : ""}`,
    `Lunch: ${sel.lunch === "none" ? "removed, quote by hand" : sel.lunch === "chosen" ? `budget of ${sel.lunchBudget} RWF per guest` : "basic lunch"}`,
    sel.breakfast ? "Breakfast: yes, to quote" : null,
    sel.dinner ? "Dinner: yes, to quote" : null,
    sel.stay ? "Accommodation near the park: one night, to quote" : null,
    staysOvernight(sel.activities, sel.stay) ? "Overnight: second day (car, driver's stay, entry) to quote" : null,
    sel.guide ? "Park guide: yes" : null,
    sel.activities.length ? `Activities: ${sel.activities.join(", ")}` : null,
    sel.extraStops ? `Extra stops to quote: ${sel.extraStops}` : null,
    sel.tripId === "nyungwe" ? "Park registration: collect each guest's name, sex, age, nationality and residence; zipline guests sign the waiver" : null,
  ].filter((l): l is string => l !== null);
}
