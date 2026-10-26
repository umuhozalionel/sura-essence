/**
 * The live pricing config: one document holding the numbers from lib/pricing.ts
 * (PricingConfig), edited one field at a time on Admin → Fleet & rates.
 * The formulas stay in code. Safe to import in the browser; the database side
 * is lib/cms/pricing-config-server.ts.
 *
 * Every saved field bumps `revision`, so a save made from an out-of-date screen
 * is refused (409) instead of overwriting someone else's change, and every
 * change is written to pricing_changes, so it can be undone and an old quote
 * explained. Phase one covers the existing 8 vehicle classes only (VehicleId).
 */
import { DEFAULT_PRICING, VEHICLES, type PricingConfig } from "@/lib/pricing";

/** What the website prices with. revision 0 = the built-in DEFAULT_PRICING (nothing saved yet, or database unreachable). */
export type ActivePricing = { revision: number; config: PricingConfig; source: "db" | "default" };

export type LivePricing = { config: PricingConfig; revision: number; updatedAt: number | null };

export type PricingChange = {
  id: string;
  /** "fuelPricePerLitre.petrol" */
  path: string;
  before: number;
  after: number;
  /** The revision this change produced. */
  revision: number;
  at: number;
  /** Set when this change undid an earlier one. */
  undoOf: string | null;
  /** Name of the admin who saved it; null for changes from before admin accounts. */
  by: string | null;
};

/* ─── the 48 editable numbers ────────────────────────────────────────── */

export type PricingUnit = "rwf" | "percent" | "km" | "kmPerLitre" | "hours" | "kmPerHour";
export type PricingField = { path: string; unit: PricingUnit; integer: boolean; min: number; max: number };

const RWF_MAX = 100_000_000;
const rwf = (path: string): PricingField => ({ path, unit: "rwf", integer: true, min: 0, max: RWF_MAX });

export const PRICING_GROUPS: { id: "fuel" | "fees" | "hourly" | "economy"; fields: PricingField[] }[] = [
  { id: "fuel", fields: [rwf("fuelPricePerLitre.petrol"), rwf("fuelPricePerLitre.diesel")] },
  {
    id: "fees",
    fields: [
      rwf("serviceFeePerDay.kigali"),
      rwf("serviceFeePerDay.outside"),
      rwf("vehicleRecoveryFee"),
      { path: "profitMargin", unit: "percent", integer: false, min: 0, max: 1 },
      { path: "roundTotalTo", unit: "rwf", integer: true, min: 1, max: 10_000 },
    ],
  },
  {
    id: "hourly",
    fields: [
      { path: "hourly.hoursInRateDay", unit: "hours", integer: true, min: 1, max: 24 },
      { path: "hourly.minBilledHours", unit: "hours", integer: true, min: 1, max: 24 },
      { path: "hourly.maxHoursPerDay", unit: "hours", integer: true, min: 1, max: 24 },
      { path: "hourly.kmPerHour", unit: "kmPerHour", integer: false, min: 0.1, max: 1000 },
    ],
  },
  {
    id: "economy",
    fields: (["sedan", "suv", "van", "bus"] as const).map((b) => ({ path: `kmPerLitre.${b}`, unit: "kmPerLitre" as const, integer: false, min: 0.1, max: 1000 })),
  },
];

export const CAB_BANDS = ["standard", "executive", "premium"] as const;
export const CAB_FIELDS: PricingField[] = CAB_BANDS.flatMap((band) => [
  rwf(`cabFares.${band}.base`),
  { path: `cabFares.${band}.includedKm`, unit: "km" as const, integer: false, min: 0, max: 100 },
  rwf(`cabFares.${band}.perKm`),
]);

export const RATE_KEYS = ["basePrice", "airportRate", "outsideSurcharge"] as const;
export const VEHICLE_FIELDS: PricingField[] = VEHICLES.flatMap((v) => RATE_KEYS.map((k) => rwf(`vehicleRates.${v.id}.${k}`)));

/** Every field that can be edited, by path. */
export const PRICING_FIELDS: PricingField[] = [...PRICING_GROUPS.flatMap((g) => g.fields), ...CAB_FIELDS, ...VEHICLE_FIELDS];
const BY_PATH = new Map(PRICING_FIELDS.map((f) => [f.path, f]));
export const pricingField = (path: string) => BY_PATH.get(path) ?? null;

/* ─── reading, writing and checking one field ────────────────────────── */

export const getAt = (cfg: PricingConfig, path: string): number =>
  path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], cfg) as number;

export function setAt(cfg: PricingConfig, path: string, value: number): PricingConfig {
  const next = structuredClone(cfg) as unknown as Record<string, unknown>;
  const keys = path.split(".");
  let o = next;
  for (const k of keys.slice(0, -1)) o = o[k] as Record<string, unknown>;
  o[keys[keys.length - 1]] = value;
  return next as unknown as PricingConfig;
}

/** Problem code for one value, or null. Same rules on the screen and on the server. */
export function checkField(field: PricingField, value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return "number";
  if (field.integer && !Number.isInteger(value)) return "integer";
  if (value < field.min || value > field.max) return "outOfRange";
  return null;
}

/** Rules between fields, checked on the whole config after a change. */
export function checkConfig(cfg: PricingConfig): { path: string; reason: string } | null {
  if (cfg.hourly.minBilledHours > cfg.hourly.maxHoursPerDay) return { path: "hourly.minBilledHours", reason: "aboveMax" };
  return null;
}

/** Changes bigger than this share of the current value ask for a confirmation first. */
export const BIG_CHANGE = 0.25;
export const isBigChange = (before: number, after: number) =>
  before === 0 ? after !== 0 : Math.abs(after - before) / Math.abs(before) > BIG_CHANGE;

export const changedPaths = (a: PricingConfig, b: PricingConfig) => PRICING_FIELDS.filter((f) => getAt(a, f.path) !== getAt(b, f.path));

export const BUILT_IN: LivePricing = { config: DEFAULT_PRICING, revision: 0, updatedAt: null };
