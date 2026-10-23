/**
 * Experiences and tours from MongoDB, reshaped into exactly what the existing
 * public pages already render (the item shapes they used to read from
 * messages/*.json). The pages stay the same; only where the data comes from changes.
 *
 * Pure functions: no database, safe anywhere. `today` is a Kigali date (YYYY-MM-DD).
 */
import { pick, pickList, type CmsLocale, type Localized } from "./localized";
import { experienceWhen, type AdminExperience } from "./experiences";
import type { AdminTourCollection, AdminTourVenue } from "./tours";

/* ─── shapes the public pages use ────────────────────────────────────── */

export type SiteEvent = {
  id: string; date: string; endDate?: string; image: string; price: number; currency: string; seats?: number; attendees?: number;
  status: string; category: string; featured?: boolean; hasModal?: boolean; itineraryHref?: string; whatsappText?: string;
  title: string; subtitle: string; location: string; country: string; duration: string;
};

export type SiteSeason = {
  id: string; slug?: string; image: string; date?: string; endDate?: string; dateLabel?: string; status: "upcoming" | "past";
  title: string; shortTitle: string; location: string; price: string; description: string; departure: string; deadline?: string; whatsappText?: string;
};

export type SiteMedia = { id: string; type: "image" | "video"; src: string; caption: string };
export type SiteTrip = {
  id: string; title: string; shortTitle: string; subtitle: string; date: string; endDate?: string; location: string;
  status: "upcoming" | "past"; cover: string; preview: SiteMedia[]; all: SiteMedia[];
};

export type SiteVenue = {
  id: string; image: string; gallery: string[]; price: number; priceType?: "free" | "donation"; memorial?: boolean;
  title: string; location: string; tag: string; summary: string; history: string[]; visitorNote: string; highlights: string[];
  facts: { duration: string; groupSize: string; minAge: string; bestTime: string; driveTime: string; outdoor: boolean };
};
export type SiteCollection = { id: string; category: string; intro: { image: string; title: string; headline: string; desc: string[] }; venues: SiteVenue[] };

/** What /activities/[slug] renders. */
export type SiteExperienceDetail = {
  slug: string;
  when: "upcoming" | "past";
  title: string;
  subtitle: string;
  heroImage: string;
  whatsappText: string;
  bookable: boolean;
  details: { id: string; icon: string; label: string; value: string }[];
  itinerary: { id: string; tone: string; title: string; items: string[] }[];
  highlights: { id: string; icon: string; text: string }[];
  packages: { id: string; featured: boolean; price: number; currency: string; ribbon: string; title: string; note: string; includes: { id: string; muted: boolean; text: string }[]; cta: string }[];
};

/** Words the pages need around the data, from their own message namespaces. */
export type ShapeLabels = {
  /** "October (date TBA)" for a trip dated by month. */
  monthTba: (monthIso: string) => string;
  /** "From 110K RWF" */
  priceFrom: (amount: number, currency: string) => string;
  /** "Price TBA" */
  priceTba: string;
};

/* ─── helpers ────────────────────────────────────────────────────────── */

const t = (v: Localized, l: CmsLocale) => pick(v, l);
const opt = <T,>(v: T | null | undefined) => (v === null || v === undefined || v === "" ? undefined : v);
/** The end date only when the trip spans more than one day (how Activities and Gallery list them). */
const spanEnd = (e: AdminExperience) => (e.schedule.endDate && e.schedule.endDate !== e.schedule.startDate ? e.schedule.endDate : undefined);

/** The day the card shows: the start date, or the first of the month for month-dated trips. */
const cardDate = (e: AdminExperience) => e.schedule.startDate ?? (e.schedule.month ? `${e.schedule.month}-01` : "");

/** Events.statuses id for the card badge. */
function statusOf(e: AdminExperience): string {
  if (e.schedule.precision !== "day") return e.availability === "closed" ? "comingSoon" : "dateTba";
  switch (e.availability) {
    case "limited": return "limitedSeats";
    case "soldOut": return "soldOut";
    case "closed": return "comingSoon";
    case "notifyMe": return "dateTba";
    default: return "bookingOpen";
  }
}

/** The price a card shows: the highlighted RWF tier, else the lowest RWF one, else none (0). */
function cardPrice(e: AdminExperience): { price: number; currency: string } {
  const rwf = e.pricing.tiers.filter((x) => x.currency === "RWF");
  const main = rwf.find((x) => x.highlight) ?? [...rwf].sort((a, b) => a.amount - b.amount)[0];
  return main ? { price: main.amount, currency: "RWF" } : { price: 0, currency: "RWF" };
}

const published = (list: AdminExperience[]) => list.filter((e) => e.status === "published");
const byDate = (dir: 1 | -1) => (a: AdminExperience, b: AdminExperience) => dir * cardDate(a).localeCompare(cardDate(b));

/** Has the content for its own page (/activities/<slug>). */
export const hasDetailPage = (e: AdminExperience) =>
  e.details.length > 0 || e.itinerary.length > 0 || e.packages.length > 0 || e.highlights.length > 0;

/* ─── experiences → pages ────────────────────────────────────────────── */

function toEvent(e: AdminExperience, l: CmsLocale, past: boolean): SiteEvent {
  const { price, currency } = cardPrice(e);
  return {
    id: e.slug,
    date: cardDate(e),
    endDate: opt(e.schedule.endDate),
    image: e.media.cover,
    price,
    currency,
    seats: opt(e.capacity.seats),
    attendees: past ? opt(e.capacity.attendees) : undefined,
    status: statusOf(e),
    category: e.category,
    featured: e.featured,
    itineraryHref: !past && hasDetailPage(e) ? `/activities/${e.slug}` : undefined,
    whatsappText: past ? undefined : opt(t(e.booking.whatsappText, l)),
    title: t(e.title, l),
    subtitle: t(e.subtitle, l),
    location: t(e.location.name, l),
    country: e.location.country,
    duration: t(e.duration, l),
  };
}

/** /events: upcoming, soonest first. */
export const toUpcomingEvents = (list: AdminExperience[], l: CmsLocale, today: string) =>
  published(list).filter((e) => experienceWhen(e.schedule, today) === "upcoming").sort(byDate(1)).map((e) => toEvent(e, l, false));

export type SitePastEvent = Omit<SiteEvent, "status" | "whatsappText" | "itineraryHref">;

/** /events/past: past, newest first. Past cards have no booking status or WhatsApp button. */
export const toPastEvents = (list: AdminExperience[], l: CmsLocale, today: string): SitePastEvent[] =>
  published(list)
    .filter((e) => experienceWhen(e.schedule, today) === "past")
    .sort(byDate(-1))
    .map((e) => {
      const { status: _s, whatsappText: _w, itineraryHref: _i, ...card } = toEvent(e, l, true);
      void _s; void _w; void _i;
      return card;
    });

/** /activities: the trips with a season flyer, upcoming first, then past newest first. */
export function toSeasons(list: AdminExperience[], l: CmsLocale, today: string, labels: ShapeLabels): SiteSeason[] {
  const withFlyer = published(list).filter((e) => e.media.flyer);
  const upcoming = withFlyer.filter((e) => experienceWhen(e.schedule, today) === "upcoming").sort(byDate(1));
  const past = withFlyer.filter((e) => experienceWhen(e.schedule, today) === "past").sort(byDate(-1));
  return [...upcoming, ...past].map((e): SiteSeason => {
    const when = experienceWhen(e.schedule, today);
    const dated = e.schedule.precision === "day" && e.schedule.startDate;
    const rwf = e.pricing.tiers.filter((x) => x.currency === "RWF").map((x) => x.amount);
    const detail = hasDetailPage(e);
    return {
      id: e.slug,
      slug: detail ? `/activities/${e.slug}` : undefined,
      image: e.media.flyer,
      date: dated ? e.schedule.startDate! : undefined,
      endDate: dated ? spanEnd(e) : undefined,
      dateLabel: dated ? undefined : labels.monthTba(e.schedule.month ?? cardDate(e).slice(0, 7)),
      status: when,
      title: t(e.title, l),
      shortTitle: t(e.shortTitle, l) || t(e.title, l),
      location: t(e.location.region, l) || t(e.location.name, l),
      price: rwf.length ? labels.priceFrom(Math.min(...rwf), "RWF") : labels.priceTba,
      description: t(e.description, l) || t(e.subtitle, l),
      departure: t(e.schedule.departure, l),
      whatsappText: detail ? undefined : opt(t(e.booking.whatsappText, l)),
    };
  });
}

/** /gallery and the homepage gallery: trips with photos, newest first. The first photo is the cover. */
export function toGalleryTrips(list: AdminExperience[], l: CmsLocale, today: string): SiteTrip[] {
  return published(list)
    .filter((e) => e.media.gallery.length > 0)
    .sort(byDate(-1))
    .map((e): SiteTrip => {
      const all = e.media.gallery.map((g, i): SiteMedia => ({ id: `${e.slug}-${i + 1}`, type: g.type, src: g.src, caption: t(g.caption, l) }));
      const preview = e.media.gallery.flatMap((g, i) => (g.inPreview ? [all[i]] : []));
      const region = t(e.location.region, l) || t(e.location.name, l);
      return {
        id: e.slug,
        title: t(e.title, l),
        shortTitle: t(e.shortTitle, l) || t(e.title, l),
        subtitle: t(e.description, l) || t(e.subtitle, l),
        date: cardDate(e),
        endDate: spanEnd(e),
        location: [region, e.location.country].filter(Boolean).join(", "),
        status: experienceWhen(e.schedule, today),
        cover: all[0].src,
        preview: preview.length ? preview : all.slice(0, 5),
        all,
      };
    });
}

/** /activities/<slug>. Upcoming trips can be booked (WhatsApp); past ones show their packages greyed out. */
export function toExperienceDetail(e: AdminExperience, l: CmsLocale, today: string): SiteExperienceDetail {
  const when = experienceWhen(e.schedule, today);
  const tier = (id: string) => e.pricing.tiers.find((x) => x.id === id);
  return {
    slug: e.slug,
    when,
    title: t(e.title, l),
    subtitle: t(e.description, l) || t(e.subtitle, l),
    heroImage: e.media.hero || e.media.flyer || e.media.cover,
    whatsappText: t(e.booking.whatsappText, l),
    bookable: when === "upcoming" && e.booking.mode !== "closed" && e.availability !== "soldOut" && e.availability !== "closed",
    details: e.details.map((d) => ({ id: d.id, icon: d.icon, label: t(d.label, l), value: t(d.value, l) })),
    itinerary: e.itinerary.map((d) => ({ id: d.id, tone: d.tone, title: t(d.title, l), items: pickList(d.items, l) })),
    highlights: e.highlights.map((h) => ({ id: h.id, icon: h.icon, text: t(h.text, l) })),
    packages: e.packages.map((p) => {
      const price = tier(p.tierId);
      return {
        id: p.id,
        featured: p.featured,
        price: price?.amount ?? 0,
        currency: price?.currency ?? "RWF",
        ribbon: t(p.ribbon, l),
        title: t(p.title, l),
        note: price ? t(price.note, l) : "",
        includes: p.includes.map((inc, i) => ({ id: `${p.id}-${i}`, muted: inc.muted, text: t(inc.text, l) })),
        cta: t(p.cta, l),
      };
    }),
  };
}

/* ─── tours → page ───────────────────────────────────────────────────── */

export function toCollections(cols: AdminTourCollection[], venues: AdminTourVenue[], l: CmsLocale): SiteCollection[] {
  return cols
    .filter((c) => c.status === "published")
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      id: c.slug,
      category: t(c.category, l),
      intro: { image: c.intro.image, title: t(c.intro.title, l), headline: t(c.intro.headline, l), desc: pickList(c.intro.desc, l) },
      venues: venues
        .filter((v) => v.collectionId === c.id && v.status === "published")
        .sort((a, b) => a.order - b.order)
        .map((v): SiteVenue => ({
          id: v.slug,
          image: v.image,
          gallery: v.gallery,
          price: v.price ?? 0,
          priceType: v.priceType === "paid" ? undefined : v.priceType,
          memorial: v.memorial || undefined,
          title: t(v.title, l),
          location: t(v.location, l),
          tag: t(v.tag, l),
          summary: t(v.summary, l),
          history: pickList(v.history, l),
          visitorNote: t(v.visitorNote, l),
          highlights: pickList(v.highlights, l),
          facts: {
            duration: t(v.facts.duration, l), groupSize: t(v.facts.groupSize, l), minAge: t(v.facts.minAge, l),
            bestTime: t(v.facts.bestTime, l), driveTime: t(v.facts.driveTime, l), outdoor: v.facts.outdoor,
          },
        })),
    }))
    .filter((c) => c.venues.length > 0);
}
