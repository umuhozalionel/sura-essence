/**
 * Server side of the live pricing config. Only the API routes, the locale
 * layout and the booking re-price import this.
 *
 * Collections:
 *   pricing_config   one document, _id "live": { config, revision, createdAt, updatedAt }
 *   pricing_changes  one row per saved field: { path, before, after, revision, at, undoOf }
 *
 * The website prices with the live document. Until it exists (or when MongoDB
 * can't answer) it prices with DEFAULT_PRICING from lib/pricing.ts, as before.
 * Older versioned documents from the draft workflow may still sit in
 * pricing_config; nothing reads them except the one-off migration below.
 */
import { ObjectId } from "mongodb";
import { DEFAULT_PRICING, VEHICLES, type PricingConfig } from "@/lib/pricing";
import { isMongoConfigured } from "@/lib/mongodb";
import type { AdminActor } from "@/lib/admin-auth";
import { CMS_TAGS, cachedRead, collection, invalidate, isDuplicateKey, toObjectId } from "./server";
import { Reader, obj, type Parsed } from "./parse";
import {
  checkConfig, checkField, getAt, pricingField, setAt,
  type ActivePricing, type LivePricing, type PricingChange,
} from "./pricing-config";

/* ─── what's stored ──────────────────────────────────────────────────── */

const LIVE = "live" as const;

export type LivePricingDoc = { _id: typeof LIVE; config: PricingConfig; revision: number; createdAt: Date; updatedAt: Date };
export type PricingChangeDoc = {
  _id: ObjectId; path: string; before: number; after: number; revision: number; at: Date; undoOf: ObjectId | null;
  /** Who saved it (absent on changes from before admin accounts). */
  by?: AdminActor;
};
/** A document from the old draft / version workflow (read once, by the migration). */
type LegacyVersionDoc = { _id: ObjectId; status?: string; config?: unknown; activatedAt?: Date | null };

const pricingConfig = () => collection<LivePricingDoc>("pricing_config");
const pricingChanges = () => collection<PricingChangeDoc>("pricing_changes", [{ key: { at: -1 } }, { key: { path: 1, at: -1 } }]);

const toLive = (d: LivePricingDoc): LivePricing => ({ config: d.config, revision: d.revision, updatedAt: d.updatedAt.getTime() });
const toChange = (d: PricingChangeDoc): PricingChange => ({
  id: d._id.toHexString(), path: d.path, before: d.before, after: d.after, revision: d.revision, at: d.at.getTime(),
  undoOf: d.undoOf ? d.undoOf.toHexString() : null,
  by: d.by?.name ?? null,
});

/* ─── public (cached) ────────────────────────────────────────────────── */

const BUILT_IN: ActivePricing = { revision: 0, config: DEFAULT_PRICING, source: "default" };

const loadActive = cachedRead("pricing:live", CMS_TAGS.pricing, async (): Promise<ActivePricing> => {
  const col = await pricingConfig();
  const live = await col.findOne({ _id: LIVE });
  if (live) return { revision: live.revision, config: live.config, source: "db" };
  // Not migrated yet: the last activated version from the old workflow, if any.
  const legacy = await legacyActiveConfig();
  return legacy ? { revision: 0, config: legacy, source: "db" } : BUILT_IN;
});

/** The rates the website prices with right now, and their revision. Never throws. */
export async function getActivePricing(): Promise<ActivePricing> {
  if (!isMongoConfigured) return BUILT_IN;
  try {
    return await loadActive();
  } catch (err) {
    console.error("[cms] live pricing unavailable, using DEFAULT_PRICING:", err);
    return BUILT_IN;
  }
}

/* ─── a whole config (used to migrate the old versions) ──────────────── */

const VEHICLE_IDS = VEHICLES.map((v) => v.id);
const MAX_RWF = 100_000_000;

function numberMap<K extends string>(
  r: Reader, v: unknown, field: string, template: Record<K, unknown>, check: (n: unknown, f: string) => number,
): Record<K, number> {
  const o = obj(v);
  const keys = Object.keys(template) as K[];
  for (const extra of Object.keys(o)) if (!keys.includes(extra as K)) r.fail(`${field}.${extra}`, "unknownKey");
  return Object.fromEntries(keys.map((k) => [k, check(o[k], `${field}.${k}`)])) as Record<K, number>;
}

/** A full PricingConfig with exactly today's shape (every class, band, body type and zone, nothing added). */
export function parsePricingConfig(v: unknown, field = "config"): Parsed<PricingConfig> {
  const r = new Reader();
  const c = obj(v);
  const rwf = (n: unknown, f: string) => r.number(n, f, { min: 0, max: MAX_RWF, integer: true });
  const positive = (n: unknown, f: string) => r.number(n, f, { min: 0.1, max: 1000 });
  const hours = (n: unknown, f: string) => r.number(n, f, { min: 1, max: 24, integer: true });
  for (const extra of Object.keys(c)) if (!(extra in DEFAULT_PRICING)) r.fail(`${field}.${extra}`, "unknownKey");

  const hourly = numberMap(r, c.hourly, `${field}.hourly`, DEFAULT_PRICING.hourly, (n, f) => (f.endsWith("kmPerHour") ? positive(n, f) : hours(n, f)));
  const cabIn = obj(c.cabFares);
  const cabFares = {} as PricingConfig["cabFares"];
  for (const band of Object.keys(DEFAULT_PRICING.cabFares) as (keyof PricingConfig["cabFares"])[]) {
    cabFares[band] = numberMap(r, cabIn[band], `${field}.cabFares.${band}`, DEFAULT_PRICING.cabFares[band], (n, f) =>
      f.endsWith("includedKm") ? r.number(n, f, { min: 0, max: 100 }) : rwf(n, f),
    );
  }
  const ratesIn = obj(c.vehicleRates);
  const vehicleRates = {} as PricingConfig["vehicleRates"];
  for (const id of VEHICLE_IDS) vehicleRates[id] = numberMap(r, ratesIn[id], `${field}.vehicleRates.${id}`, DEFAULT_PRICING.vehicleRates[id], rwf);
  for (const extra of Object.keys(ratesIn)) if (!(VEHICLE_IDS as string[]).includes(extra)) r.fail(`${field}.vehicleRates.${extra}`, "unknownVehicle");

  const config: PricingConfig = {
    fuelPricePerLitre: numberMap(r, c.fuelPricePerLitre, `${field}.fuelPricePerLitre`, DEFAULT_PRICING.fuelPricePerLitre, rwf),
    kmPerLitre: numberMap(r, c.kmPerLitre, `${field}.kmPerLitre`, DEFAULT_PRICING.kmPerLitre, positive),
    profitMargin: r.number(c.profitMargin, `${field}.profitMargin`, { min: 0, max: 1 }),
    serviceFeePerDay: numberMap(r, c.serviceFeePerDay, `${field}.serviceFeePerDay`, DEFAULT_PRICING.serviceFeePerDay, rwf),
    vehicleRecoveryFee: rwf(c.vehicleRecoveryFee, `${field}.vehicleRecoveryFee`),
    roundTotalTo: r.number(c.roundTotalTo, `${field}.roundTotalTo`, { min: 1, max: 10_000, integer: true }),
    hourly,
    cabFares,
    vehicleRates,
  };
  const cross = checkConfig(config);
  if (cross) r.fail(`${field}.${cross.path}`, cross.reason);
  return r.result(config);
}

/** The config of the last activated version from the old draft workflow, if one is stored and still valid. */
async function legacyActiveConfig(): Promise<PricingConfig | null> {
  const col = (await pricingConfig()) as unknown as import("mongodb").Collection<LegacyVersionDoc>;
  const doc = await col.find({ status: "active" }).sort({ activatedAt: -1 }).limit(1).next();
  if (!doc) return null;
  const parsed = parsePricingConfig(doc.config);
  return parsed.ok ? parsed.value : null;
}

/* ─── admin ──────────────────────────────────────────────────────────── */

/**
 * The live document, created the first time it's needed: from the last
 * activated version of the old workflow if there is one, otherwise from
 * DEFAULT_PRICING. Returns whether it was just created.
 */
export async function ensureLivePricing(): Promise<{ live: LivePricing; created: boolean }> {
  const col = await pricingConfig();
  const found = await col.findOne({ _id: LIVE });
  if (found) return { live: toLive(found), created: false };
  const now = new Date();
  const doc: LivePricingDoc = {
    _id: LIVE,
    config: (await legacyActiveConfig()) ?? structuredClone(DEFAULT_PRICING), // a plain copy: DEFAULT_PRICING is frozen
    revision: 1,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await col.insertOne(doc);
  } catch (err) {
    if (!isDuplicateKey(err)) throw err;
    const raced = await col.findOne({ _id: LIVE }); // another request created it first
    if (raced) return { live: toLive(raced), created: false };
    throw err;
  }
  invalidate(CMS_TAGS.pricing);
  return { live: toLive(doc), created: true };
}

export async function listPricingChanges(limit = 30): Promise<PricingChange[]> {
  const docs = await (await pricingChanges()).find({}).sort({ at: -1 }).limit(limit).toArray();
  return docs.map(toChange);
}

export type FieldEdit = { path: string; value: number; expected: number };

export function parseFieldEdit(body: unknown): Parsed<FieldEdit> {
  const r = new Reader();
  const b = obj(body);
  const path = typeof b.path === "string" ? b.path : "";
  const field = pricingField(path);
  if (!field) r.fail("path", "unknownKey");
  else {
    const problem = checkField(field, b.value);
    if (problem) r.fail(path, problem);
  }
  if (typeof b.expected !== "number" || !Number.isFinite(b.expected)) r.fail("expected", "number");
  return r.result({ path, value: b.value as number, expected: b.expected as number });
}

export type FieldResult =
  | { ok: true; live: LivePricing; change: PricingChange | null }
  | { ok: false; reason: "conflict"; live: LivePricing }
  | { ok: false; reason: "invalid"; field: string; detail: string };

/**
 * Saves one number on the live document.
 *
 * `expected` is the value the editor started from. If someone else changed
 * this field since, the save is refused (conflict) and the current document is
 * returned. Changes to other fields don't block it: the write is retried on the
 * newest revision, and the rules between fields are checked against that.
 */
export async function saveField(edit: FieldEdit, by: AdminActor, undoOf: ObjectId | null = null): Promise<FieldResult> {
  const col = await pricingConfig();
  for (let attempt = 0; attempt < 4; attempt++) {
    const { live } = await ensureLivePricing();
    const before = getAt(live.config, edit.path);
    if (before !== edit.expected) return { ok: false, reason: "conflict", live };
    if (before === edit.value) return { ok: true, live, change: null };

    const cross = checkConfig(setAt(live.config, edit.path, edit.value));
    if (cross) return { ok: false, reason: "invalid", field: cross.path, detail: cross.reason };

    const now = new Date();
    const res = await col.updateOne(
      { _id: LIVE, revision: live.revision }, // nobody saved anything in between
      { $set: { [`config.${edit.path}`]: edit.value, updatedAt: now }, $inc: { revision: 1 } },
    );
    if (res.matchedCount === 0) continue; // another field was saved meanwhile: try again on the newest revision

    const change: PricingChangeDoc = {
      _id: new ObjectId(), path: edit.path, before, after: edit.value, revision: live.revision + 1, at: now, undoOf, by,
    };
    await (await pricingChanges()).insertOne(change);
    invalidate(CMS_TAGS.pricing);
    return {
      ok: true,
      live: { config: setAt(live.config, edit.path, edit.value), revision: live.revision + 1, updatedAt: now.getTime() },
      change: toChange(change),
    };
  }
  const { live } = await ensureLivePricing();
  return { ok: false, reason: "conflict", live };
}

/** Puts a field back to its value before `changeId`. Refused if the field has changed again since. */
export async function undoChange(changeId: string, by: AdminActor): Promise<FieldResult | { ok: false; reason: "notFound" }> {
  const _id = toObjectId(changeId);
  if (!_id) return { ok: false, reason: "notFound" };
  const change = await (await pricingChanges()).findOne({ _id });
  if (!change) return { ok: false, reason: "notFound" };
  return saveField({ path: change.path, value: change.before, expected: change.after }, by, _id);
}

/* ─── seed ───────────────────────────────────────────────────────────── */

/** Creates the live document if it's missing (from the last active version, else DEFAULT_PRICING). */
export async function seedPricingConfig(): Promise<{ inserted: boolean; revision: number }> {
  const { live, created } = await ensureLivePricing();
  return { inserted: created, revision: live.revision };
}
