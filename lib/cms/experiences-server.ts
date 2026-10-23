/**
 * Server side of experiences: MongoDB reads and writes, and the parser for the
 * admin form. Only the API routes import this; admin functions assume the
 * route has already run adminGuard().
 *
 * Collection: experiences. Public reads are cached under CMS_TAGS.experiences
 * and cleared by every admin write.
 */
import { ObjectId } from "mongodb";
import { kigaliToday } from "@/lib/bookings";
import { DESTINATIONS } from "@/lib/pricing";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { CMS_TAGS, cachedRead, collection, invalidate, toObjectId } from "./server";
import { legacyExperiences } from "./legacy";
import { Reader, type Parsed } from "./parse";
import type { CmsLocale } from "./localized";
import {
  BOOKING_MODES, DATE_PRECISION, EXPERIENCE_AVAILABILITY, EXPERIENCE_CURRENCIES, EXPERIENCE_LIMITS as L,
  EXPERIENCE_STATUSES, MEDIA_TYPES, compareExperiences, localizeExperience,
  type AdminExperience, type ExperienceInput, type ExperienceStatus, type ExperienceWhen, type PublicExperience,
} from "./experiences";

/* ─── what's stored ──────────────────────────────────────────────────── */

export type ExperienceDoc = ExperienceInput & { _id: ObjectId; createdAt: Date; updatedAt: Date };

const experiences = () =>
  collection<ExperienceDoc>("experiences", [
    { key: { slug: 1 }, unique: true },
    { key: { status: 1, "schedule.startDate": 1 } },
    { key: { featured: 1 } },
  ]);

function toAdmin(d: ExperienceDoc): AdminExperience {
  const { _id, createdAt, updatedAt, ...rest } = d;
  return { ...rest, id: _id.toHexString(), createdAt: createdAt.getTime(), updatedAt: updatedAt.getTime() };
}

/* ─── public (cached) ────────────────────────────────────────────────── */

/** Every published experience, plain data so it can sit in the cache. Dates are judged per request. */
const loadPublished = cachedRead("experiences:published", CMS_TAGS.experiences, async (): Promise<AdminExperience[]> => {
  const col = await experiences();
  return (await col.find({ status: "published" }).toArray()).map(toAdmin);
});

const loadSiteData = cachedRead("experiences:site", CMS_TAGS.experiences, async () => {
  const [items, seeded] = await Promise.all([
    loadPublished(),
    (await getDb()).collection<MetaDoc>("app_meta").findOne({ _id: SEED_MARKER }),
  ]);
  return { items, seeded: Boolean(seeded) };
});

/**
 * What the public pages show: the published experiences, or null when the
 * pages should keep using messages/*.json — the database isn't set up, can't
 * answer, or hasn't been seeded yet (nothing there and never filled).
 * Never throws.
 */
export async function getSiteExperiences(): Promise<AdminExperience[] | null> {
  if (!isMongoConfigured) return null;
  try {
    const { items, seeded } = await loadSiteData();
    return !seeded && items.length === 0 ? null : items;
  } catch (err) {
    console.error("[cms] experiences unavailable, using messages/*.json:", err);
    return null;
  }
}

/* ─── seed: the trips in messages/*.json ─────────────────────────────── */

type MetaDoc = { _id: string; at: Date };
const SEED_MARKER = "experiences_seeded";

/**
 * Copies every trip from messages/*.json (lib/cms/legacy.ts) into the collection,
 * once. A marker in app_meta records it, so deleting them later never brings
 * them back. Each one goes through parseExperience first, like an admin save.
 * Returns how many were added (0 when already done).
 */
let seeding: Promise<number> | null = null;

export function seedExperiencesOnce(): Promise<number> {
  seeding ??= runExperiencesSeed().finally(() => {
    seeding = null;
  });
  return seeding;
}

async function runExperiencesSeed(): Promise<number> {
  const meta = (await getDb()).collection<MetaDoc>("app_meta");
  if (await meta.findOne({ _id: SEED_MARKER })) return 0;
  try {
    await meta.insertOne({ _id: SEED_MARKER, at: new Date() }); // only one request wins this
  } catch {
    return 0; // another request is seeding
  }
  try {
    const col = await experiences();
    if ((await col.countDocuments()) > 0) return 0;
    const now = new Date();
    const docs: ExperienceDoc[] = [];
    for (const input of legacyExperiences()) {
      const parsed = parseExperience(input);
      if (!parsed.ok) {
        console.error(`[cms] seed: skipped experience ${input.slug} (${parsed.field}: ${parsed.reason})`);
        continue;
      }
      docs.push({ _id: new ObjectId(), ...parsed.value, createdAt: now, updatedAt: now });
    }
    if (docs.length) await col.insertMany(docs);
    invalidate(CMS_TAGS.experiences);
    return docs.length;
  } catch (err) {
    await meta.deleteOne({ _id: SEED_MARKER }).catch(() => undefined); // let the next request try again
    throw err;
  }
}

export type ExperienceQuery = { locale: CmsLocale; when?: ExperienceWhen | "all"; category?: string | null; gallery?: boolean };

/** Upcoming soonest first, then past newest first. `gallery: true` keeps only trips with photos. */
export async function listPublicExperiences({ locale, when = "all", category = null, gallery = false }: ExperienceQuery): Promise<PublicExperience[]> {
  const today = kigaliToday();
  return (await loadPublished())
    .filter((e) => (!category || e.category === category) && (!gallery || e.media.gallery.length > 0))
    .map((e) => localizeExperience(e, locale, today))
    .filter((e) => when === "all" || e.when === when)
    .sort(compareExperiences);
}

export async function getPublicExperience(slug: string, locale: CmsLocale): Promise<PublicExperience | null> {
  const found = (await loadPublished()).find((e) => e.slug === slug);
  return found ? localizeExperience(found, locale, kigaliToday()) : null;
}

/* ─── checking what the admin form sends ────────────────────────────── */

const DESTINATION_IDS = DESTINATIONS.map((d) => d.id);

export function parseExperience(body: unknown): Parsed<ExperienceInput> {
  const r = new Reader();
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const o = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
  const line = { max: L.line };

  const schedule = o(b.schedule);
  const precision = r.oneOf(schedule.precision, "schedule.precision", DATE_PRECISION, "day");
  const startDate = r.date(schedule.startDate, "schedule.startDate", { required: precision === "day" });
  const endDate = r.date(schedule.endDate, "schedule.endDate");
  if (startDate && endDate && endDate < startDate) r.fail("schedule.endDate", "beforeStart");
  const month = r.month(schedule.month, "schedule.month");
  if (precision === "month" && !month) r.fail("schedule.month", "required");

  const location = o(b.location);
  const destinationId = typeof location.destinationId === "string" && location.destinationId ? location.destinationId : null;
  if (destinationId && !DESTINATION_IDS.includes(destinationId)) r.fail("location.destinationId", "invalid");

  const media = o(b.media);
  const tiers = r.list(o(b.pricing).tiers, "pricing.tiers", L.tiers, (t, f) => ({
    id: r.key(t.id, `${f}.id`),
    label: r.localized(t.label, `${f}.label`, { max: 80, required: true }),
    note: r.localized(t.note, `${f}.note`, line),
    amount: r.number(t.amount, `${f}.amount`, { min: 0, max: 100_000_000, integer: true }),
    currency: r.oneOf(t.currency, `${f}.currency`, EXPERIENCE_CURRENCIES, "RWF"),
    highlight: r.bool(t.highlight),
  }));
  r.unique(tiers.map((t) => t.id), "pricing.tiers");

  const packages = r.list(b.packages, "packages", L.packages, (p, f) => {
    const tierId = r.key(p.tierId, `${f}.tierId`);
    if (tierId && !tiers.some((t) => t.id === tierId)) r.fail(`${f}.tierId`, "unknownTier");
    return {
      id: r.key(p.id, `${f}.id`),
      title: r.localized(p.title, `${f}.title`, { max: 120, required: true }),
      ribbon: r.localized(p.ribbon, `${f}.ribbon`, { max: 40 }),
      featured: r.bool(p.featured),
      tierId,
      includes: r.list(p.includes, `${f}.includes`, L.includes, (i, fi) => ({
        text: r.localized(i.text, `${fi}.text`, { ...line, required: true }),
        muted: r.bool(i.muted),
      })),
      cta: r.localized(p.cta, `${f}.cta`, { max: 60 }),
    };
  });
  r.unique(packages.map((p) => p.id), "packages");

  const details = r.list(b.details, "details", L.details, (d, f) => ({
    id: r.key(d.id, `${f}.id`),
    icon: r.text(d.icon, `${f}.icon`, { max: 40 }),
    label: r.localized(d.label, `${f}.label`, { max: 80, required: true }),
    value: r.localized(d.value, `${f}.value`, { ...line, required: true }),
  }));
  r.unique(details.map((d) => d.id), "details");

  const itinerary = r.list(b.itinerary, "itinerary", L.itinerary, (d, f) => ({
    id: r.key(d.id, `${f}.id`),
    tone: r.text(d.tone, `${f}.tone`, { max: 20 }),
    title: r.localized(d.title, `${f}.title`, { max: 120, required: true }),
    items: r.localizedList(d.items, `${f}.items`, { max: L.line, items: L.itineraryItems }),
  }));
  r.unique(itinerary.map((d) => d.id), "itinerary");

  const highlights = r.list(b.highlights, "highlights", L.highlights, (h, f) => ({
    id: r.key(h.id, `${f}.id`),
    icon: r.text(h.icon, `${f}.icon`, { max: 40 }),
    text: r.localized(h.text, `${f}.text`, { ...line, required: true }),
  }));
  r.unique(highlights.map((h) => h.id), "highlights");

  const capacity = o(b.capacity);
  const booking = o(b.booking);
  const hero = o(b.hero);

  return r.result<ExperienceInput>({
    slug: r.slug(b.slug, "slug"),
    status: r.oneOf(b.status, "status", EXPERIENCE_STATUSES, "draft"),
    availability: r.oneOf(b.availability, "availability", EXPERIENCE_AVAILABILITY, "open"),
    featured: r.bool(b.featured),
    category: r.key(b.category, "category"),
    schedule: {
      startDate,
      endDate,
      precision,
      month,
      bookingDeadline: r.date(schedule.bookingDeadline, "schedule.bookingDeadline"),
      departure: r.localized(schedule.departure, "schedule.departure", line),
    },
    title: r.localized(b.title, "title", { max: L.title, required: true }),
    shortTitle: r.localized(b.shortTitle, "shortTitle", { max: L.shortTitle }),
    subtitle: r.localized(b.subtitle, "subtitle", { max: L.subtitle }),
    description: r.localized(b.description, "description", { max: L.description, multiline: true }),
    location: {
      name: r.localized(location.name, "location.name", { max: 120, required: true }),
      region: r.localized(location.region, "location.region", { max: 120 }),
      country: r.text(location.country, "location.country", { max: 60 }) || "Rwanda",
      destinationId,
    },
    duration: r.localized(b.duration, "duration", { max: 80 }),
    media: {
      cover: r.media(media.cover, "media.cover", { required: true }),
      flyer: r.media(media.flyer, "media.flyer"),
      hero: r.media(media.hero, "media.hero"),
      gallery: r.list(media.gallery, "media.gallery", L.gallery, (g, f) => ({
        src: r.media(g.src, `${f}.src`, { required: true }),
        type: r.oneOf(g.type, `${f}.type`, MEDIA_TYPES, "image"),
        caption: r.localized(g.caption, `${f}.caption`, { max: 160 }),
        inPreview: r.bool(g.inPreview),
      })),
    },
    pricing: { tiers },
    packages,
    details,
    itinerary,
    highlights,
    capacity: {
      seats: r.optionalNumber(capacity.seats, "capacity.seats", { min: 0, max: 10_000, integer: true }),
      attendees: r.optionalNumber(capacity.attendees, "capacity.attendees", { min: 0, max: 10_000, integer: true }),
    },
    booking: {
      mode: r.oneOf(booking.mode, "booking.mode", BOOKING_MODES, "whatsapp"),
      whatsappText: r.localized(booking.whatsappText, "booking.whatsappText", { max: 500 }),
      itinerary: r.media(booking.itinerary, "booking.itinerary"),
    },
    hero: { promote: r.bool(hero.promote), until: r.date(hero.until, "hero.until") },
  });
}

/* ─── admin ──────────────────────────────────────────────────────────── */

/** Everything, drafts and archived included, newest trip first. */
export async function listExperiencesForAdmin(): Promise<AdminExperience[]> {
  await seedExperiencesOnce(); // the first visit fills the list with the trips from messages/*.json
  const col = await experiences();
  return (await col.find({}).sort({ "schedule.startDate": -1, createdAt: -1 }).toArray()).map(toAdmin);
}

export async function getExperienceForAdmin(id: string): Promise<AdminExperience | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await experiences()).findOne({ _id });
  return doc ? toAdmin(doc) : null;
}

/** Throws a duplicate-key error (code 11000) when the slug is taken. */
export async function createExperience(value: ExperienceInput): Promise<AdminExperience> {
  await seedExperiencesOnce(); // so adding one first doesn't hide the existing trips
  const now = new Date();
  const doc: ExperienceDoc = { _id: new ObjectId(), ...value, createdAt: now, updatedAt: now };
  await (await experiences()).insertOne(doc);
  return toAdmin(doc);
}

/** Replaces the whole form. null when the id doesn't exist. */
export async function updateExperience(id: string, value: ExperienceInput): Promise<AdminExperience | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const updated = await (await experiences()).findOneAndUpdate(
    { _id },
    { $set: { ...value, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return updated ? toAdmin(updated) : null;
}

export type ExperiencePatch = Partial<{ status: ExperienceStatus; featured: boolean; availability: AdminExperience["availability"] }>;

/** Quick changes from the list without opening the form: publish, archive, feature, availability. */
export function parseExperiencePatch(body: unknown): Parsed<ExperiencePatch> {
  const r = new Reader();
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const patch: ExperiencePatch = {};
  if ("status" in b) patch.status = r.oneOf(b.status, "status", EXPERIENCE_STATUSES);
  if ("featured" in b) patch.featured = r.bool(b.featured);
  if ("availability" in b) patch.availability = r.oneOf(b.availability, "availability", EXPERIENCE_AVAILABILITY);
  if (!Object.keys(patch).length) r.fail("body", "empty");
  return r.result(patch);
}

export async function patchExperience(id: string, patch: ExperiencePatch): Promise<AdminExperience | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const updated = await (await experiences()).findOneAndUpdate(
    { _id },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return updated ? toAdmin(updated) : null;
}

export async function deleteExperience(id: string): Promise<boolean> {
  const _id = toObjectId(id);
  if (!_id) return false;
  return (await (await experiences()).deleteOne({ _id })).deletedCount === 1;
}
