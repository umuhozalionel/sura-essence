/**
 * Server side of Kigali tours. Collections: tour_collections and tour_venues
 * (each venue points at its collection by id). Both share the cache tag
 * CMS_TAGS.tours, because the public read returns them together.
 */
import { ObjectId } from "mongodb";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { CMS_TAGS, cachedRead, collection, invalidate, toObjectId } from "./server";
import { legacyTours } from "./legacy";
import { Reader, obj, type Parsed } from "./parse";
import type { CmsLocale } from "./localized";
import {
  TOUR_CURRENCIES, TOUR_LIMITS as L, TOUR_PRICE_TYPES, TOUR_STATUSES, localizeCollection,
  type AdminTourCollection, type AdminTourVenue, type PublicTourCollection, type TourCollectionInput,
  type TourStatus, type TourVenueInput,
} from "./tours";

/* ─── what's stored ──────────────────────────────────────────────────── */

export type TourCollectionDoc = TourCollectionInput & { _id: ObjectId; createdAt: Date; updatedAt: Date };
export type TourVenueDoc = Omit<TourVenueInput, "collectionId"> & {
  _id: ObjectId;
  collectionId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const tourCollections = () =>
  collection<TourCollectionDoc>("tour_collections", [{ key: { slug: 1 }, unique: true }, { key: { status: 1, order: 1 } }]);

const tourVenues = () =>
  collection<TourVenueDoc>("tour_venues", [
    { key: { slug: 1 }, unique: true },
    { key: { collectionId: 1, status: 1, order: 1 } },
  ]);

function collectionToAdmin(d: TourCollectionDoc): AdminTourCollection {
  const { _id, createdAt, updatedAt, ...rest } = d;
  return { ...rest, id: _id.toHexString(), createdAt: createdAt.getTime(), updatedAt: updatedAt.getTime() };
}

function venueToAdmin(d: TourVenueDoc): AdminTourVenue {
  const { _id, collectionId, createdAt, updatedAt, ...rest } = d;
  return {
    ...rest,
    id: _id.toHexString(),
    collectionId: collectionId.toHexString(),
    createdAt: createdAt.getTime(),
    updatedAt: updatedAt.getTime(),
  };
}

const byOrder = { order: 1, createdAt: 1 } as const;

/* ─── public (cached) ────────────────────────────────────────────────── */

const loadPublished = cachedRead("tours:published", CMS_TAGS.tours, async () => {
  const [cols, venues] = await Promise.all([
    (await tourCollections()).find({ status: "published" }).sort(byOrder).toArray(),
    (await tourVenues()).find({ status: "published" }).sort(byOrder).toArray(),
  ]);
  return { collections: cols.map(collectionToAdmin), venues: venues.map(venueToAdmin) };
});

const loadSiteData = cachedRead("tours:site", CMS_TAGS.tours, async () => {
  const [published, seeded] = await Promise.all([
    loadPublished(),
    (await getDb()).collection<MetaDoc>("app_meta").findOne({ _id: SEED_MARKER }),
  ]);
  return { ...published, seeded: Boolean(seeded) };
});

/**
 * What the Tours page shows, or null when it should keep using messages/*.json
 * (database not set up, unreachable, or never seeded). Never throws.
 */
export async function getSiteTours(): Promise<{ collections: AdminTourCollection[]; venues: AdminTourVenue[] } | null> {
  if (!isMongoConfigured) return null;
  try {
    const { collections, venues, seeded } = await loadSiteData();
    return !seeded && collections.length === 0 ? null : { collections, venues };
  } catch (err) {
    console.error("[cms] tours unavailable, using messages/*.json:", err);
    return null;
  }
}

/* ─── seed: Tours.collections in messages/*.json ─────────────────────── */

type MetaDoc = { _id: string; at: Date };
const SEED_MARKER = "tours_seeded";
let seeding: Promise<number> | null = null;

/**
 * Copies the tour collections and venues from messages/*.json (lib/cms/legacy.ts)
 * in once, through the same checks as an admin save. The app_meta marker stops
 * them coming back after an admin deletes them. Returns how many were added.
 */
export function seedToursOnce(): Promise<number> {
  // The Tours screen asks for collections and venues at the same time: both wait for one seed.
  seeding ??= runToursSeed().finally(() => {
    seeding = null;
  });
  return seeding;
}

async function runToursSeed(): Promise<number> {
  const meta = (await getDb()).collection<MetaDoc>("app_meta");
  if (await meta.findOne({ _id: SEED_MARKER })) return 0;
  try {
    await meta.insertOne({ _id: SEED_MARKER, at: new Date() });
  } catch {
    return 0; // another server instance is seeding
  }
  try {
    const cols = await tourCollections();
    const venuesCol = await tourVenues();
    if ((await cols.countDocuments()) > 0 || (await venuesCol.countDocuments()) > 0) return 0;
    const now = new Date();
    const { collections, venues } = legacyTours();
    const ids = new Map<string, ObjectId>();
    const colDocs: TourCollectionDoc[] = [];
    for (const input of collections) {
      const parsed = parseTourCollection(input);
      if (!parsed.ok) {
        console.error(`[cms] seed: skipped tour collection ${input.slug} (${parsed.field}: ${parsed.reason})`);
        continue;
      }
      const _id = new ObjectId();
      ids.set(input.slug, _id);
      colDocs.push({ _id, ...parsed.value, createdAt: now, updatedAt: now });
    }
    const venueDocs: TourVenueDoc[] = [];
    for (const { collectionSlug, ...input } of venues) {
      const collectionId = ids.get(collectionSlug);
      if (!collectionId) continue;
      const parsed = parseTourVenue({ ...input, collectionId: collectionId.toHexString() });
      if (!parsed.ok) {
        console.error(`[cms] seed: skipped tour venue ${input.slug} (${parsed.field}: ${parsed.reason})`);
        continue;
      }
      venueDocs.push({ _id: new ObjectId(), ...parsed.value, collectionId, createdAt: now, updatedAt: now });
    }
    if (colDocs.length) await cols.insertMany(colDocs);
    if (venueDocs.length) await venuesCol.insertMany(venueDocs);
    invalidate(CMS_TAGS.tours);
    return colDocs.length + venueDocs.length;
  } catch (err) {
    await meta.deleteOne({ _id: SEED_MARKER }).catch(() => undefined);
    throw err;
  }
}

/** Published collections in order, each with its published venues in order. */
export async function listPublicTours(locale: CmsLocale): Promise<PublicTourCollection[]> {
  const { collections, venues } = await loadPublished();
  return collections.map((c) => localizeCollection(c, venues.filter((v) => v.collectionId === c.id), locale));
}

/* ─── checking what the admin forms send ────────────────────────────── */

export function parseTourCollection(body: unknown): Parsed<TourCollectionInput> {
  const r = new Reader();
  const b = obj(body);
  const intro = obj(b.intro);
  return r.result<TourCollectionInput>({
    slug: r.slug(b.slug, "slug"),
    status: r.oneOf(b.status, "status", TOUR_STATUSES, "draft"),
    order: r.optionalNumber(b.order, "order", { min: 0, max: 10_000, integer: true }) ?? 0,
    category: r.localized(b.category, "category", { max: 80, required: true }),
    intro: {
      image: r.media(intro.image, "intro.image", { required: true }),
      title: r.localized(intro.title, "intro.title", { max: 120, required: true }),
      headline: r.localized(intro.headline, "intro.headline", { max: 160 }),
      desc: r.localizedList(intro.desc, "intro.desc", { max: L.line, items: L.paragraphs }),
    },
  });
}

export function parseTourVenue(body: unknown): Parsed<TourVenueInput> {
  const r = new Reader();
  const b = obj(body);
  const facts = obj(b.facts);
  const collectionId = typeof b.collectionId === "string" ? b.collectionId : "";
  if (!toObjectId(collectionId)) r.fail("collectionId", "invalid");
  const short = { max: 80 };
  return r.result<TourVenueInput>({
    slug: r.slug(b.slug, "slug"),
    collectionId,
    status: r.oneOf(b.status, "status", TOUR_STATUSES, "draft"),
    order: r.optionalNumber(b.order, "order", { min: 0, max: 10_000, integer: true }) ?? 0,
    image: r.media(b.image, "image", { required: true }),
    gallery: r.mediaList(b.gallery, "gallery", L.gallery),
    price: r.optionalNumber(b.price, "price", { min: 0, max: 100_000_000, integer: true }),
    currency: r.oneOf(b.currency, "currency", TOUR_CURRENCIES, "USD"),
    priceType: r.oneOf(b.priceType, "priceType", TOUR_PRICE_TYPES, "paid"),
    memorial: r.bool(b.memorial),
    title: r.localized(b.title, "title", { max: 120, required: true }),
    location: r.localized(b.location, "location", { max: 120, required: true }),
    tag: r.localized(b.tag, "tag", { max: 40 }),
    summary: r.localized(b.summary, "summary", { max: L.line }),
    history: r.localizedList(b.history, "history", { max: 1500, items: L.paragraphs }),
    visitorNote: r.localized(b.visitorNote, "visitorNote", { max: L.line }),
    highlights: r.localizedList(b.highlights, "highlights", { max: 160, items: L.highlights }),
    facts: {
      duration: r.localized(facts.duration, "facts.duration", short),
      groupSize: r.localized(facts.groupSize, "facts.groupSize", short),
      minAge: r.localized(facts.minAge, "facts.minAge", short),
      bestTime: r.localized(facts.bestTime, "facts.bestTime", short),
      driveTime: r.localized(facts.driveTime, "facts.driveTime", short),
      outdoor: r.bool(facts.outdoor),
    },
  });
}

export type TourPatch = Partial<{ status: TourStatus; order: number }>;

/** Publish / unpublish or move, without opening the form. */
export function parseTourPatch(body: unknown): Parsed<TourPatch> {
  const r = new Reader();
  const b = obj(body);
  const patch: TourPatch = {};
  if ("status" in b) patch.status = r.oneOf(b.status, "status", TOUR_STATUSES);
  if ("order" in b) patch.order = r.number(b.order, "order", { min: 0, max: 10_000, integer: true });
  if (!Object.keys(patch).length) r.fail("body", "empty");
  return r.result(patch);
}

/* ─── admin: collections ─────────────────────────────────────────────── */

export async function listTourCollectionsForAdmin(): Promise<AdminTourCollection[]> {
  await seedToursOnce(); // the first visit fills Tours with the collections from messages/*.json
  return (await (await tourCollections()).find({}).sort(byOrder).toArray()).map(collectionToAdmin);
}

export async function getTourCollectionForAdmin(id: string): Promise<AdminTourCollection | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await tourCollections()).findOne({ _id });
  return doc ? collectionToAdmin(doc) : null;
}

/** Throws a duplicate-key error (code 11000) when the slug is taken. */
export async function createTourCollection(value: TourCollectionInput): Promise<AdminTourCollection> {
  await seedToursOnce(); // so adding one first doesn't hide the existing collections
  const now = new Date();
  const doc: TourCollectionDoc = { _id: new ObjectId(), ...value, createdAt: now, updatedAt: now };
  await (await tourCollections()).insertOne(doc);
  return collectionToAdmin(doc);
}

export async function updateTourCollection(id: string, value: TourCollectionInput | TourPatch): Promise<AdminTourCollection | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const updated = await (await tourCollections()).findOneAndUpdate(
    { _id },
    { $set: { ...value, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return updated ? collectionToAdmin(updated) : null;
}

/** Refuses while venues still belong to the collection, so none are left pointing at nothing. */
export async function deleteTourCollection(id: string): Promise<{ ok: true } | { ok: false; reason: "notFound" | "hasVenues" }> {
  const _id = toObjectId(id);
  if (!_id) return { ok: false, reason: "notFound" };
  if (await (await tourVenues()).countDocuments({ collectionId: _id }, { limit: 1 })) return { ok: false, reason: "hasVenues" };
  return (await (await tourCollections()).deleteOne({ _id })).deletedCount === 1 ? { ok: true } : { ok: false, reason: "notFound" };
}

/* ─── admin: venues ──────────────────────────────────────────────────── */

export async function listTourVenuesForAdmin(collectionId?: string | null): Promise<AdminTourVenue[]> {
  await seedToursOnce();
  const cid = collectionId ? toObjectId(collectionId) : null;
  if (collectionId && !cid) return [];
  const docs = await (await tourVenues()).find(cid ? { collectionId: cid } : {}).sort({ collectionId: 1, ...byOrder }).toArray();
  return docs.map(venueToAdmin);
}

export async function getTourVenueForAdmin(id: string): Promise<AdminTourVenue | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await tourVenues()).findOne({ _id });
  return doc ? venueToAdmin(doc) : null;
}

export type VenueWrite = { ok: true; item: AdminTourVenue } | { ok: false; reason: "notFound" | "unknownCollection" | "tooMany" };

async function collectionExists(id: ObjectId) {
  return (await (await tourCollections()).countDocuments({ _id: id }, { limit: 1 })) === 1;
}

/** Throws a duplicate-key error (code 11000) when the slug is taken. */
export async function createTourVenue(value: TourVenueInput): Promise<VenueWrite> {
  const collectionId = toObjectId(value.collectionId);
  if (!collectionId || !(await collectionExists(collectionId))) return { ok: false, reason: "unknownCollection" };
  const col = await tourVenues();
  if ((await col.countDocuments({ collectionId })) >= L.venuesPerCollection) return { ok: false, reason: "tooMany" };
  const now = new Date();
  const doc: TourVenueDoc = { _id: new ObjectId(), ...value, collectionId, createdAt: now, updatedAt: now };
  await col.insertOne(doc);
  return { ok: true, item: venueToAdmin(doc) };
}

export async function updateTourVenue(id: string, value: TourVenueInput | TourPatch): Promise<VenueWrite> {
  const _id = toObjectId(id);
  if (!_id) return { ok: false, reason: "notFound" };
  let set: Partial<TourVenueDoc>;
  if ("collectionId" in value) {
    const collectionId = toObjectId(value.collectionId);
    if (!collectionId || !(await collectionExists(collectionId))) return { ok: false, reason: "unknownCollection" };
    set = { ...value, collectionId };
  } else {
    set = value;
  }
  const updated = await (await tourVenues()).findOneAndUpdate(
    { _id },
    { $set: { ...set, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return updated ? { ok: true, item: venueToAdmin(updated) } : { ok: false, reason: "notFound" };
}

export async function deleteTourVenue(id: string): Promise<boolean> {
  const _id = toObjectId(id);
  if (!_id) return false;
  return (await (await tourVenues()).deleteOne({ _id })).deletedCount === 1;
}
