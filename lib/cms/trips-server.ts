/**
 * The trips collection. SERVER ONLY. Shapes are in lib/cms/trips.ts.
 *
 * Until the first visit to Admin → Trips copies lib/trips.ts in, and whenever the
 * database can't answer, the website shows lib/trips.ts as it always has.
 */
import { ObjectId } from "mongodb";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { TRIP_CATEGORIES } from "@/lib/trips";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { CMS_TAGS, cachedRead, collection, invalidate, toObjectId } from "./server";
import { toLocale } from "./localized";
import { Reader, type Parsed } from "./parse";
import { TRIP_LIMITS as L, TRIP_STATUSES, localizeTrip, type AdminTrip, type PublicTrip, type TripInput, type TripPageContent, type TripPhoto } from "./trips";

export type TripDoc = TripInput & { _id: ObjectId; order: number; photos: TripPhoto[]; page?: TripPageContent; createdAt: Date; updatedAt: Date };

const trips = () => collection<TripDoc>("trips", [{ key: { slug: 1 }, unique: true }, { key: { order: 1 } }]);
export const tripsCollection = trips;

function toAdmin(d: TripDoc): AdminTrip {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, order, page, createdAt, updatedAt, ...rest } = d;
  return { ...rest, id: _id.toHexString(), createdAt: createdAt.getTime(), updatedAt: updatedAt.getTime() };
}

/* ─── lib/trips.ts as trips ──────────────────────────────────────────── */

type PlaceWords = { name?: string; summary?: string };
const words = (messages: typeof en | typeof fr, id: string) => ((messages.Trips as unknown as Record<string, PlaceWords>)[id] ?? {});

const builtIn = (): TripInput[] =>
  TRIP_CATEGORIES.flatMap(({ id: category, places }) =>
    places.map((place): TripInput => ({
      slug: place.id.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
      category,
      status: place.status,
      name: { en: words(en, place.id).name ?? place.id, fr: words(fr, place.id).name ?? "" },
      summary: { en: words(en, place.id).summary ?? "", fr: words(fr, place.id).summary ?? "" },
      image: place.image ?? "",
      href: place.href ?? "",
      visible: true,
    })),
  );

const builtInForSite = (): AdminTrip[] =>
  builtIn().map((trip, i) => ({ ...trip, id: `built-in-${i}`, photos: [], createdAt: 0, updatedAt: 0 }));

/* ─── public (cached) ────────────────────────────────────────────────── */

type MetaDoc = { _id: string; at: Date };
const SEED_MARKER = "trips_seeded";

const loadSiteTrips = cachedRead("trips:site", CMS_TAGS.trips, async () => {
  const col = await trips();
  const [items, seeded] = await Promise.all([
    col.find({ visible: true }).sort({ order: 1 }).toArray(),
    (await getDb()).collection<MetaDoc>("app_meta").findOne({ _id: SEED_MARKER }),
  ]);
  return { items: items.map(toAdmin), seeded: Boolean(seeded) };
});

/** What the website lists, in `locale`. Never throws. */
export async function getSiteTrips(locale: string): Promise<PublicTrip[]> {
  const l = toLocale(locale);
  if (isMongoConfigured) {
    try {
      const { items, seeded } = await loadSiteTrips();
      if (seeded) return items.map((trip) => localizeTrip(trip, l));
    } catch (err) {
      console.error("[cms] trips unavailable, using lib/trips.ts:", err);
    }
  }
  return builtInForSite().map((trip) => localizeTrip(trip, l));
}

/* ─── seed: lib/trips.ts ─────────────────────────────────────────────── */

let seeding: Promise<void> | null = null;

/** Copies lib/trips.ts into the collection, once: deleting a trip later never brings it back. */
function seedTripsOnce(): Promise<void> {
  seeding ??= runSeed().finally(() => {
    seeding = null;
  });
  return seeding;
}

async function runSeed() {
  const meta = (await getDb()).collection<MetaDoc>("app_meta");
  if (await meta.findOne({ _id: SEED_MARKER })) return;
  try {
    await meta.insertOne({ _id: SEED_MARKER, at: new Date() }); // only one request wins this
  } catch {
    return; // another request is seeding
  }
  try {
    const now = new Date();
    await (await trips()).insertMany(
      builtIn().map((trip, order): TripDoc => ({ _id: new ObjectId(), ...trip, order, photos: [], createdAt: now, updatedAt: now })),
    );
    invalidate(CMS_TAGS.trips);
  } catch (err) {
    await meta.deleteOne({ _id: SEED_MARKER }).catch(() => undefined); // let the next request try again
    throw err;
  }
}

/* ─── checking what the form sends ───────────────────────────────────── */

export const CLOUDINARY_PHOTO = /^https:\/\/res\.cloudinary\.com\/[A-Za-z0-9_-]+\/image\/upload\/[^\s"'<>]+$/;
export const INTERNAL_LINK = /^\/(?!\/)[A-Za-z0-9\-_/?=&.]*$/;

export function parseTrip(body: unknown): Parsed<TripInput> {
  const r = new Reader();
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const rawImage = typeof b.image === "string" ? b.image.trim() : "";
  const image = CLOUDINARY_PHOTO.test(rawImage) && rawImage.length <= 500 ? rawImage : r.media(rawImage, "image");
  const href = typeof b.href === "string" ? b.href.trim() : "";
  if (href && (href.length > 200 || !INTERNAL_LINK.test(href))) r.fail("href", "invalid");
  const categories = TRIP_CATEGORIES.map((c) => c.id);
  return r.result({
    slug: r.slug(b.slug, "slug"),
    category: r.oneOf(b.category, "category", categories),
    status: r.oneOf(b.status, "status", TRIP_STATUSES),
    name: r.localized(b.name, "name", { max: L.name, required: true }),
    summary: r.localized(b.summary, "summary", { max: L.summary, multiline: true }),
    image,
    href,
    visible: r.bool(b.visible, true),
  });
}

/* ─── admin ──────────────────────────────────────────────────────────── */

export async function listTripsForAdmin(): Promise<AdminTrip[]> {
  await seedTripsOnce(); // the first visit fills the list from lib/trips.ts
  return (await (await trips()).find({}).sort({ order: 1 }).toArray()).map(toAdmin);
}

export async function getTripForAdmin(id: string): Promise<AdminTrip | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await trips()).findOne({ _id });
  return doc ? toAdmin(doc) : null;
}

export async function getTripDoc(id: string): Promise<TripDoc | null> {
  const _id = toObjectId(id);
  return _id ? (await trips()).findOne({ _id }) : null;
}

export async function saveTripPage(id: string, page: TripPageContent) {
  const _id = toObjectId(id);
  if (_id) await (await trips()).updateOne({ _id }, { $set: { page, updatedAt: new Date() } });
}

/** Throws a duplicate-key error (code 11000) when the slug is taken. */
export async function createTrip(value: TripInput): Promise<AdminTrip> {
  await seedTripsOnce(); // so adding one first doesn't hide the existing trips
  const now = new Date();
  const doc: TripDoc = { _id: new ObjectId(), ...value, order: now.getTime(), photos: [], createdAt: now, updatedAt: now };
  await (await trips()).insertOne(doc);
  return toAdmin(doc);
}

/** Saves the form. The slug stays: pages and links are built from it. */
export async function updateTrip(id: string, value: TripInput): Promise<AdminTrip | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { slug, ...rest } = value;
  const updated = await (await trips()).findOneAndUpdate({ _id }, { $set: { ...rest, updatedAt: new Date() } }, { returnDocument: "after" });
  return updated ? toAdmin(updated) : null;
}

/** Returns the deleted trip, so its photos can be removed from Cloudinary too. */
export async function deleteTrip(id: string): Promise<AdminTrip | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const deleted = await (await trips()).findOneAndDelete({ _id });
  return deleted ? toAdmin(deleted) : null;
}

/** Newest first. null when the trip is gone or already holds the most photos it can. */
export async function addTripPhoto(id: string, photo: TripPhoto): Promise<AdminTrip | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const col = await trips();
  const updated = await col.findOneAndUpdate(
    { _id, "photos.id": { $ne: photo.id }, [`photos.${L.photos - 1}`]: { $exists: false } },
    { $push: { photos: { $each: [photo], $position: 0 } }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (updated) return toAdmin(updated);
  // The same upload sent twice is already saved.
  const doc = await col.findOne({ _id, "photos.id": photo.id });
  return doc ? toAdmin(doc) : null;
}

/** Also clears the card's photo when it was this one. Returns the removed photo, or null. */
export async function removeTripPhoto(id: string, photoId: string): Promise<{ item: AdminTrip; removed: TripPhoto } | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const col = await trips();
  const doc = await col.findOne({ _id });
  const removed = doc?.photos.find((p) => p.id === photoId);
  if (!doc || !removed) return null;
  const updated = await col.findOneAndUpdate(
    { _id },
    { $pull: { photos: { id: photoId } }, $set: { updatedAt: new Date(), ...(doc.image === removed.url ? { image: "" } : {}) } },
    { returnDocument: "after" },
  );
  return updated ? { item: toAdmin(updated), removed } : null;
}
