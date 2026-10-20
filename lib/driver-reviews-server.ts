/**
 * Server side of the Driver page reviews: MongoDB reads and writes, plus the
 * sample reviews taken from "Driver.reviews.items" in messages/en.json + fr.json.
 * Only the API routes in app/api/driver-reviews/ and app/api/admin/driver-reviews/
 * import this. Admin functions assume the route has already checked the admin cookie.
 *
 * Collection: driver_reviews. The first time the admin screen opens, the sample
 * reviews are copied in (approved, flagged `sample: true`). A marker in
 * `app_meta` records that, so deleting the samples later never brings them back.
 */
import { ObjectId, type Collection } from "mongodb";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { getDb, isMongoConfigured } from "./mongodb";
import {
  DRIVER_REVIEW_LIMITS, DRIVER_REVIEWS_SHOWN, isDriverReviewCar, localizeDriverReview, validateDriverReview,
  type AdminDriverReview, type DriverReviewCar, type DriverReviewInput, type DriverReviewLocale,
  type DriverReviewStatus, type PublicDriverReview,
} from "./driver-reviews";

/* ─── what's stored ──────────────────────────────────────────────────── */

export type DriverReviewDoc = DriverReviewInput & {
  _id: ObjectId;
  status: DriverReviewStatus;
  /** Which message-file sample this came from; absent for reviews added later. */
  seedKey?: string;
  createdAt: Date;
  updatedAt: Date;
};

type MetaDoc = { _id: string; at: Date };
const SEED_MARKER = "driver_reviews_seeded";

let indexesReady: Promise<unknown> | null = null;

async function collections() {
  const db = await getDb();
  const reviews = db.collection<DriverReviewDoc>("driver_reviews");
  const meta = db.collection<MetaDoc>("app_meta");
  indexesReady ??= reviews.createIndex({ status: 1, createdAt: 1 }).catch((err) => {
    indexesReady = null;
    throw err;
  });
  await indexesReady;
  return { reviews, meta };
}

/* ─── seed: the sample reviews from the message files ───────────────── */

type SeedReview = { id: string; client: string; car: string; comment: string };

export function seedReviews(): Omit<DriverReviewDoc, "_id" | "createdAt" | "updatedAt">[] {
  const enList = en.Driver.reviews.items as SeedReview[];
  const frList = fr.Driver.reviews.items as SeedReview[];
  return enList.map((r) => ({
    client: r.client,
    car: (isDriverReviewCar(r.car) ? r.car : "sedan") as DriverReviewCar,
    comment: { en: r.comment, fr: frList.find((x) => x.id === r.id)?.comment ?? "" },
    sample: true,
    status: "approved",
    seedKey: r.id,
  }));
}

async function seedOnce(reviews: Collection<DriverReviewDoc>, meta: Collection<MetaDoc>) {
  if (await meta.findOne({ _id: SEED_MARKER })) return;
  try {
    await meta.insertOne({ _id: SEED_MARKER, at: new Date() }); // only one request wins this
  } catch {
    return; // another request is seeding
  }
  try {
    if ((await reviews.countDocuments()) > 0) return;
    const start = Date.now();
    // A second apart, so they keep the message-file order.
    await reviews.insertMany(
      seedReviews().map((r, i) => {
        const at = new Date(start + i * 1000);
        return { ...r, _id: new ObjectId(), createdAt: at, updatedAt: at };
      }),
    );
  } catch (err) {
    await meta.deleteOne({ _id: SEED_MARKER }).catch(() => undefined); // let the next request try again
    throw err;
  }
}

/* ─── shaping ────────────────────────────────────────────────────────── */

function toAdmin(d: DriverReviewDoc): AdminDriverReview {
  return {
    id: d._id.toHexString(),
    client: d.client,
    car: d.car,
    comment: d.comment,
    sample: d.sample,
    status: d.status,
    createdAt: d.createdAt.getTime(),
    updatedAt: d.updatedAt.getTime(),
  };
}

const toObjectId = (id: string) => (/^[a-f0-9]{24}$/i.test(id) ? new ObjectId(id) : null);

/* ─── public ─────────────────────────────────────────────────────────── */

/** The sample reviews exactly as the message files have them. Used whenever the database can't answer. */
export function fallbackReviews(locale: DriverReviewLocale): PublicDriverReview[] {
  return seedReviews().map((r, i) => localizeDriverReview({ ...r, id: r.seedKey ?? String(i) }, locale));
}

/** Approved reviews, oldest first. Before the first seed, the message-file samples. */
export async function listPublicReviews(
  locale: DriverReviewLocale,
): Promise<{ items: PublicDriverReview[]; source: "db" | "fallback" }> {
  if (!isMongoConfigured) return { items: fallbackReviews(locale), source: "fallback" };
  const { reviews, meta } = await collections();
  const [docs, seeded] = await Promise.all([
    reviews.find({ status: "approved" }).sort({ createdAt: 1 }).limit(DRIVER_REVIEWS_SHOWN).toArray(),
    meta.findOne({ _id: SEED_MARKER }),
  ]);
  if (!seeded && docs.length === 0) return { items: fallbackReviews(locale), source: "fallback" };
  return { items: docs.map((d) => localizeDriverReview(toAdmin(d), locale)), source: "db" };
}

/* ─── checking what the admin form sends ────────────────────────────── */

const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g;
const oneLine = (v: unknown) => (typeof v === "string" ? v.replace(INVISIBLE, "").replace(/\s+/g, " ").trim() : "");

export type ParsedReview = { ok: true; value: DriverReviewInput } | { ok: false; reason: string; field?: string };

export function parseReview(body: unknown): ParsedReview {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, reason: "body" };
  const b = body as Record<string, unknown>;
  const c = (b.comment && typeof b.comment === "object" ? b.comment : {}) as Record<string, unknown>;
  const value: DriverReviewInput = {
    client: oneLine(b.client),
    car: (isDriverReviewCar(b.car) ? b.car : "") as DriverReviewCar,
    comment: { en: oneLine(c.en), fr: oneLine(c.fr) },
    sample: b.sample === true,
  };
  const errors = validateDriverReview(value);
  const field = Object.keys(errors)[0];
  return field ? { ok: false, reason: errors[field]!, field } : { ok: true, value };
}

/* ─── admin ──────────────────────────────────────────────────────────── */

export async function listReviewsForAdmin(): Promise<AdminDriverReview[]> {
  const { reviews, meta } = await collections();
  await seedOnce(reviews, meta);
  const docs = await reviews.find({}).sort({ createdAt: 1 }).toArray();
  return docs.map(toAdmin);
}

/** New reviews start as pending: they appear on the website once approved. */
export async function createReview(
  value: DriverReviewInput,
): Promise<{ ok: true; item: AdminDriverReview } | { ok: false; reason: "tooMany" }> {
  const { reviews, meta } = await collections();
  await seedOnce(reviews, meta); // so adding one first doesn't hide the samples
  if ((await reviews.countDocuments()) >= DRIVER_REVIEW_LIMITS.max) return { ok: false, reason: "tooMany" };
  const now = new Date();
  const doc: DriverReviewDoc = { _id: new ObjectId(), ...value, status: "pending", createdAt: now, updatedAt: now };
  await reviews.insertOne(doc);
  return { ok: true, item: toAdmin(doc) };
}

export async function updateReview(id: string, value: DriverReviewInput): Promise<AdminDriverReview | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const { reviews } = await collections();
  const updated = await reviews.findOneAndUpdate(
    { _id },
    { $set: { ...value, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return updated ? toAdmin(updated) : null;
}

/** Publish on the Driver page, or take it down again. */
export async function setReviewStatus(id: string, status: DriverReviewStatus): Promise<AdminDriverReview | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const { reviews } = await collections();
  const updated = await reviews.findOneAndUpdate(
    { _id },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return updated ? toAdmin(updated) : null;
}

export async function deleteReview(id: string): Promise<boolean> {
  const _id = toObjectId(id);
  if (!_id) return false;
  const { reviews } = await collections();
  return (await reviews.deleteOne({ _id })).deletedCount === 1;
}
