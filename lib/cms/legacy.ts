/**
 * The trips, seasons, gallery and tours that live in messages/en.json + fr.json
 * today, mapped onto the CMS collections. Used for two things:
 *   1. Seeding: the first time the admin opens Experiences or Tours, these are
 *      copied into MongoDB (lib/cms/seed.ts), so every existing event and
 *      season can be edited there.
 *   2. The /activities/[slug] page while the database can't answer.
 *
 * The same trip appears in up to five namespaces (Events or PastEvents,
 * Activities.seasons, ActivitySeasonN, Gallery.trips). TRIPS below says which
 * record belongs to which trip; each field takes the value from the namespace
 * that shows it today (see the comments on `fromLegacy`).
 *
 * Pure data, no database. Messages are imported directly, both languages at once.
 */
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import type { ExperienceAvailability, ExperienceInput, PriceTier } from "./experiences";
import type { Localized, LocalizedList } from "./localized";
import type { TourCollectionInput, TourVenueInput } from "./tours";

type Messages = typeof en;
const MESSAGES: Record<"en" | "fr", Messages> = { en, fr: fr as unknown as Messages };

/* ─── the shapes in the message files ────────────────────────────────── */

type LegacyEvent = {
  id: string; date: string; endDate?: string; image: string; price: number; currency: string; seats?: number; attendees?: number;
  status?: string; category: string; featured?: boolean; whatsappText?: string;
  title: string; subtitle: string; location: string; country: string; duration: string;
};
type LegacySeason = {
  id: string; slug?: string; image: string; date?: string; endDate?: string; dateLabel?: string; status: string;
  title: string; shortTitle: string; location: string; price: string; description: string; departure: string; deadline?: string; whatsappText?: string;
};
type LegacyMedia = { id: string; type: "image" | "video"; src: string; caption: string };
type LegacyTrip = { id: string; title: string; shortTitle: string; subtitle: string; location: string; cover: string; preview: LegacyMedia[]; all: LegacyMedia[] };
type LegacyPackage = {
  id: string; featured: boolean; price: number; currency: string; ribbon: string; title: string; note: string;
  includes: { id: string; muted?: boolean; text: string }[]; cta: string;
};
type LegacyDetail = {
  image: string; whatsappText: string; details: { id: string; icon: string; label: string; value: string }[];
  itinerary: { id: string; tone: string; title: string; items: string[] }[];
  highlights: { id: string; icon: string; text: string }[]; packages: LegacyPackage[];
};
type LegacyVenue = {
  id: string; image: string; gallery: string[]; price: number; priceType?: "free" | "donation"; memorial?: boolean;
  title: string; location: string; tag: string; summary: string; history: string[]; visitorNote: string; highlights: string[];
  facts: { duration: string; groupSize: string; minAge: string; bestTime: string; driveTime: string; outdoor: boolean };
};
type LegacyCollection = { id: string; category: string; intro: { image: string; title: string; headline: string; desc: string[] }; venues: LegacyVenue[] };

type DetailNamespace = "ActivitySeason1" | "ActivitySeason2" | "ActivitySeason3";

/**
 * One row per real trip. `event` is its id in Events.items or PastEvents.items,
 * `season` in Activities.seasons, `detail` the season page namespace, `gallery`
 * its id in Gallery.trips. `oldPath` is the season page it replaces (301 redirect).
 */
export const LEGACY_TRIPS: {
  slug: string; event: string; season?: string; detail?: DetailNamespace; gallery?: string; oldPath?: string;
}[] = [
  { slug: "bisoke-musanze-retreat-2026", event: "evt-006", season: "season4" },
  { slug: "akagera-national-park-2026", event: "past-003", season: "season2", detail: "ActivitySeason2", gallery: "akagera", oldPath: "/activities/activity-season2" },
  { slug: "nyungwe-forest-escape-2026", event: "past-002", season: "season3", detail: "ActivitySeason3", gallery: "nyungwe", oldPath: "/activities/activity-season3" },
  { slug: "discover-bigogwe-2026", event: "past-001", season: "season1", detail: "ActivitySeason1", gallery: "bigogwe", oldPath: "/activities/activity-season1" },
  // Placeholder slots on the Events page ("TBA" until the trip is announced).
  { slug: "coming-soon-october-2026", event: "evt-003" },
  { slug: "coming-soon-november-2026", event: "evt-004" },
  { slug: "coming-soon-december-2026", event: "evt-005" },
];

/** Old season page → new detail page, for the 301 redirects in next.config.ts. */
export const LEGACY_REDIRECTS = LEGACY_TRIPS.flatMap((t) => (t.oldPath ? [{ from: t.oldPath, slug: t.slug }] : []));

/* ─── reading both languages at once ─────────────────────────────────── */

const both = <T>(read: (m: Messages) => T): { en: T; fr: T } => ({ en: read(MESSAGES.en), fr: read(MESSAGES.fr) });
const L = (read: (m: Messages) => string | undefined | null): Localized => {
  const v = both(read);
  return { en: v.en ?? "", fr: v.fr ?? "" };
};
const LList = (read: (m: Messages) => string[] | undefined): LocalizedList => {
  const v = both(read);
  return { en: v.en ?? [], fr: v.fr ?? [] };
};

const findEvent = (m: Messages, id: string) =>
  ((m.Events.items as LegacyEvent[]).find((e) => e.id === id) ?? (m.PastEvents.items as LegacyEvent[]).find((e) => e.id === id))!;
const isPastEvent = (id: string) => (MESSAGES.en.PastEvents.items as LegacyEvent[]).some((e) => e.id === id);
const findSeason = (m: Messages, id?: string) => (id ? (m.Activities.seasons as LegacySeason[]).find((s) => s.id === id) : undefined);
const findTrip = (m: Messages, id?: string) => (id ? (m.Gallery.trips as LegacyTrip[]).find((t) => t.id === id) : undefined);
const findDetail = (m: Messages, ns?: DetailNamespace) => (ns ? (m[ns] as unknown as LegacyDetail) : undefined);

/** Events.statuses → availability. Past trips are closed. */
const AVAILABILITY: Record<string, ExperienceAvailability> = {
  limitedSeats: "limited", bookingOpen: "open", soldOut: "soldOut", comingSoon: "closed", dateTba: "notifyMe",
};

/* ─── experiences ────────────────────────────────────────────────────── */

/**
 * Every trip as an experience document, both languages filled in.
 *   card (cover, subtitle, location, duration, price)  ← Events / PastEvents
 *   season card (flyer, short title, region, departure) ← Activities.seasons
 *   detail page (hero image, details, itinerary, …)      ← ActivitySeasonN
 *   gallery (photos, captions, preview)                  ← Gallery.trips
 */
export function legacyExperiences(): ExperienceInput[] {
  return LEGACY_TRIPS.map((row): ExperienceInput => {
    const event = findEvent(MESSAGES.en, row.event);
    const season = findSeason(MESSAGES.en, row.season);
    const trip = findTrip(MESSAGES.en, row.gallery);
    const detail = findDetail(MESSAGES.en, row.detail);
    const past = isPastEvent(row.event);
    // "dateTba" / "comingSoon": only the month is known, so the trip stays upcoming until it's dated.
    const undated = event.status === "dateTba" || event.status === "comingSoon";

    // Prices: the season page's packages when there is one, else the card price.
    const tiers: PriceTier[] = detail
      ? detail.packages.map((p, i) => ({
          id: p.id,
          label: L((m) => findDetail(m, row.detail)!.packages[i].title),
          note: L((m) => findDetail(m, row.detail)!.packages[i].note),
          amount: p.price,
          currency: p.currency === "USD" ? "USD" : "RWF",
          highlight: p.featured,
        }))
      : event.price > 0
        ? [{ id: "standard", label: { en: "Per person", fr: "Par personne" }, note: { en: "", fr: "" }, amount: event.price, currency: "RWF", highlight: true }]
        : [];

    const preview = new Set(trip?.preview.map((p) => p.src) ?? []);

    return {
      slug: row.slug,
      status: "published",
      availability: past ? "closed" : AVAILABILITY[event.status ?? ""] ?? "open",
      featured: Boolean(event.featured),
      category: event.category,
      schedule: {
        startDate: event.date ?? null,
        endDate: event.endDate ?? null,
        precision: undated ? "month" : "day",
        month: undated && event.date ? event.date.slice(0, 7) : null,
        bookingDeadline: null,
        departure: L((m) => findSeason(m, row.season)?.departure),
      },
      title: L((m) => findEvent(m, row.event).title),
      shortTitle: L((m) => findSeason(m, row.season)?.shortTitle ?? findTrip(m, row.gallery)?.shortTitle),
      subtitle: L((m) => findEvent(m, row.event).subtitle),
      description: L((m) => findSeason(m, row.season)?.description ?? findTrip(m, row.gallery)?.subtitle),
      location: {
        name: L((m) => findEvent(m, row.event).location),
        region: L((m) => findSeason(m, row.season)?.location),
        country: event.country || "Rwanda",
        destinationId: null,
      },
      duration: L((m) => findEvent(m, row.event).duration),
      media: {
        cover: event.image,
        flyer: season?.image ?? "",
        hero: detail?.image ?? "",
        gallery: (trip?.all ?? []).map((g, i) => ({
          src: g.src,
          type: g.type,
          caption: L((m) => findTrip(m, row.gallery)!.all[i].caption),
          inPreview: preview.has(g.src),
        })),
      },
      pricing: { tiers },
      packages: detail
        ? detail.packages.map((p, i) => ({
            id: p.id,
            title: L((m) => findDetail(m, row.detail)!.packages[i].title),
            ribbon: L((m) => findDetail(m, row.detail)!.packages[i].ribbon),
            featured: p.featured,
            tierId: p.id,
            includes: p.includes.map((inc, j) => ({
              text: L((m) => findDetail(m, row.detail)!.packages[i].includes[j].text),
              muted: Boolean(inc.muted),
            })),
            cta: L((m) => findDetail(m, row.detail)!.packages[i].cta),
          }))
        : [],
      details: (detail?.details ?? []).map((d, i) => ({
        id: d.id,
        icon: d.icon,
        label: L((m) => findDetail(m, row.detail)!.details[i].label),
        value: L((m) => findDetail(m, row.detail)!.details[i].value),
      })),
      itinerary: (detail?.itinerary ?? []).map((d, i) => ({
        id: d.id,
        tone: d.tone,
        title: L((m) => findDetail(m, row.detail)!.itinerary[i].title),
        items: LList((m) => findDetail(m, row.detail)!.itinerary[i].items),
      })),
      highlights: (detail?.highlights ?? []).map((h, i) => ({
        id: h.id,
        icon: h.icon,
        text: L((m) => findDetail(m, row.detail)!.highlights[i].text),
      })),
      capacity: { seats: event.seats ?? null, attendees: event.attendees ?? null },
      booking: {
        mode: "whatsapp",
        whatsappText: L((m) => findEvent(m, row.event).whatsappText ?? findSeason(m, row.season)?.whatsappText ?? findDetail(m, row.detail)?.whatsappText),
        itinerary: "",
      },
      hero: { promote: false, until: null },
    };
  });
}

/* ─── tours ──────────────────────────────────────────────────────────── */

export type LegacyTourVenue = Omit<TourVenueInput, "collectionId"> & { collectionSlug: string };

/** Tours.collections and their venues, in page order. Venue slugs are the ids the Tours page uses in its URLs. */
export function legacyTours(): { collections: TourCollectionInput[]; venues: LegacyTourVenue[] } {
  const cols = (m: Messages) => m.Tours.collections as LegacyCollection[];
  const collections = cols(MESSAGES.en).map((c, ci): TourCollectionInput => ({
    slug: c.id,
    status: "published",
    order: ci,
    category: L((m) => cols(m)[ci].category),
    intro: {
      image: c.intro.image,
      title: L((m) => cols(m)[ci].intro.title),
      headline: L((m) => cols(m)[ci].intro.headline),
      desc: LList((m) => cols(m)[ci].intro.desc),
    },
  }));
  const venues = cols(MESSAGES.en).flatMap((c, ci) =>
    c.venues.map((v, vi): LegacyTourVenue => {
      const V = (m: Messages) => cols(m)[ci].venues[vi];
      return {
        collectionSlug: c.id,
        slug: v.id,
        status: "published",
        order: vi,
        image: v.image,
        gallery: v.gallery,
        price: v.price,
        currency: "USD",
        priceType: v.priceType ?? "paid",
        memorial: Boolean(v.memorial),
        title: L((m) => V(m).title),
        location: L((m) => V(m).location),
        tag: L((m) => V(m).tag),
        summary: L((m) => V(m).summary),
        history: LList((m) => V(m).history),
        visitorNote: L((m) => V(m).visitorNote),
        highlights: LList((m) => V(m).highlights),
        facts: {
          duration: L((m) => V(m).facts.duration),
          groupSize: L((m) => V(m).facts.groupSize),
          minAge: L((m) => V(m).facts.minAge),
          bestTime: L((m) => V(m).facts.bestTime),
          driveTime: L((m) => V(m).facts.driveTime),
          outdoor: Boolean(v.facts.outdoor),
        },
      };
    }),
  );
  return { collections, venues };
}
