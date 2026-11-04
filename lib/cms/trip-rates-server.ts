/**
 * Server side of the trip rates. Collection: trip_rates, a single document
 * `_id: "live"`. Public reads are cached under CMS_TAGS.tripRates and fall back
 * to DEFAULT_TRIP_RATES when the database is empty or unreachable.
 */
import { isMongoConfigured } from "@/lib/mongodb";
import { DEFAULT_TRIP_RATES, type TripRates } from "@/lib/trips";
import { CMS_TAGS, cachedRead, collection, invalidate } from "./server";
import { Reader, obj, type Parsed } from "./parse";

type TripRatesDoc = TripRates & { _id: "live"; updatedAt: Date };

const LIVE = "live" as const;
const rates = () => collection<TripRatesDoc>("trip_rates");

const strip = (d: TripRatesDoc): TripRates => ({
  usdToRwf: d.usdToRwf, rateUpdatedAt: d.rateUpdatedAt, safariCarPrice: d.safariCarPrice, lunchBuffet: d.lunchBuffet,
  lunchChosen: d.lunchChosen, guideUsd: d.guideUsd, inParkKm: d.inParkKm, latestPickup: d.latestPickup,
  // Saved before these fields existed: use the defaults until an admin saves them.
  vehicleFeeUsd: d.vehicleFeeUsd ?? DEFAULT_TRIP_RATES.vehicleFeeUsd,
  snacksPerGuest: d.snacksPerGuest ?? DEFAULT_TRIP_RATES.snacksPerGuest,
});

const loadRates = cachedRead("trip-rates", CMS_TAGS.tripRates, async (): Promise<TripRates> => {
  const doc = await (await rates()).findOne({ _id: LIVE });
  return doc ? strip(doc) : DEFAULT_TRIP_RATES;
});

/** The rates trips are priced with. Never throws. */
export async function getTripRates(): Promise<TripRates> {
  if (!isMongoConfigured) return DEFAULT_TRIP_RATES;
  try {
    return await loadRates();
  } catch (err) {
    console.error("[cms] trip rates unavailable, using defaults:", err);
    return DEFAULT_TRIP_RATES;
  }
}

const MAX_RWF = 100_000_000;

/** A full rates form. rateUpdatedAt moves only when the exchange rate itself changes. */
export function parseTripRates(body: unknown, current: TripRates): Parsed<TripRates> {
  const r = new Reader();
  const b = obj(body);
  const rwf = (k: "safariCarPrice" | "lunchBuffet" | "lunchChosen" | "snacksPerGuest") => r.number(b[k], k, { min: 0, max: MAX_RWF, integer: true });
  const usdToRwf = r.number(b.usdToRwf, "usdToRwf", { min: 1, max: 100_000 });
  const latestPickup = r.text(b.latestPickup, "latestPickup", { max: 5, required: true });
  if (latestPickup && !/^0[4-9]:(00|30)$/.test(latestPickup)) r.fail("latestPickup", "invalid");
  return r.result<TripRates>({
    usdToRwf,
    rateUpdatedAt: usdToRwf !== current.usdToRwf || !current.rateUpdatedAt ? Date.now() : current.rateUpdatedAt,
    safariCarPrice: rwf("safariCarPrice"),
    lunchBuffet: rwf("lunchBuffet"),
    lunchChosen: rwf("lunchChosen"),
    guideUsd: r.number(b.guideUsd, "guideUsd", { min: 0, max: 10_000 }),
    vehicleFeeUsd: r.number(b.vehicleFeeUsd, "vehicleFeeUsd", { min: 0, max: 10_000 }),
    snacksPerGuest: rwf("snacksPerGuest"),
    inParkKm: r.number(b.inParkKm, "inParkKm", { min: 0, max: 1000 }),
    latestPickup,
  });
}

export async function getTripRatesForAdmin(): Promise<TripRates> {
  const doc = await (await rates()).findOne({ _id: LIVE });
  return doc ? strip(doc) : DEFAULT_TRIP_RATES;
}

export async function saveTripRates(value: TripRates): Promise<TripRates> {
  await (await rates()).updateOne({ _id: LIVE }, { $set: { ...value, updatedAt: new Date() } }, { upsert: true });
  invalidate(CMS_TAGS.tripRates);
  return value;
}

/** Today's USD to RWF rate from a free public source, or null when it can't be reached. */
export async function fetchUsdToRwf(): Promise<number | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const rate = ((await res.json()) as { rates?: { RWF?: unknown } }).rates?.RWF;
    return typeof rate === "number" && rate > 0 ? Math.round(rate * 100) / 100 : null;
  } catch (err) {
    console.error("[cms] exchange rate unavailable:", err);
    return null;
  }
}
