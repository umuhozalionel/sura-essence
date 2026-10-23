/**
 * Experiences: one document per real trip, replacing Events.items, PastEvents.items,
 * Activities.seasons, ActivitySeason1/2/3 and Gallery.trips in messages/*.json.
 * Shapes and pure helpers, safe to import in the browser.
 * The database side is lib/cms/experiences-server.ts.
 *
 * Upcoming or past is never stored: `experienceWhen()` works it out from the
 * dates every time, so a trip moves to "past" by itself the day after it ends.
 */
import { isFallback, pick, pickList, type CmsLocale, type Localized, type LocalizedList } from "./localized";

export const EXPERIENCE_STATUSES = ["draft", "published", "archived"] as const;
export type ExperienceStatus = (typeof EXPERIENCE_STATUSES)[number];

/** What the booking button says; replaces Events.statuses (limitedSeats, bookingOpen, …). */
export const EXPERIENCE_AVAILABILITY = ["open", "limited", "soldOut", "closed", "notifyMe"] as const;
export type ExperienceAvailability = (typeof EXPERIENCE_AVAILABILITY)[number];

/** "day": the dates are fixed. "month": only the month is known. "tba": no date yet. */
export const DATE_PRECISION = ["day", "month", "tba"] as const;
export type DatePrecision = (typeof DATE_PRECISION)[number];

export const EXPERIENCE_CURRENCIES = ["RWF", "USD"] as const;
export type ExperienceCurrency = (typeof EXPERIENCE_CURRENCIES)[number];

export const BOOKING_MODES = ["whatsapp", "form", "closed"] as const;
export type BookingMode = (typeof BOOKING_MODES)[number];

export const MEDIA_TYPES = ["image", "video"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const EXPERIENCE_LIMITS = {
  title: 140,
  shortTitle: 60,
  subtitle: 200,
  description: 4000,
  line: 300,
  gallery: 60,
  tiers: 8,
  packages: 6,
  includes: 20,
  details: 16,
  itinerary: 12,
  itineraryItems: 20,
  highlights: 16,
  /** Largest admin request body, bytes. */
  bodyBytes: 256 * 1024,
} as const;

export type ExperienceSchedule = {
  /** "YYYY-MM-DD", null while the day isn't known. */
  startDate: string | null;
  endDate: string | null;
  precision: DatePrecision;
  /** "YYYY-MM" when precision is "month". */
  month: string | null;
  bookingDeadline: string | null;
  /** "Departure 6:00 from Kigali Heights" */
  departure: Localized;
};

export type GalleryItem = {
  /** A file under /public, e.g. "/activities/akagera/1.jpg". */
  src: string;
  type: MediaType;
  caption: Localized;
  /** Shown in the short preview strip as well as the full gallery. */
  inPreview: boolean;
};

export type PriceTier = {
  id: string;
  label: Localized;
  note: Localized;
  /** Whole currency units: 110000 (RWF) or 180 (USD). */
  amount: number;
  currency: ExperienceCurrency;
  highlight: boolean;
};

export type ExperiencePackage = {
  id: string;
  title: Localized;
  ribbon: Localized;
  featured: boolean;
  /** The tier this package is priced at: the amount is never repeated here. */
  tierId: string;
  includes: { text: Localized; muted: boolean }[];
  cta: Localized;
};

export type ExperienceInput = {
  slug: string;
  status: ExperienceStatus;
  availability: ExperienceAvailability;
  featured: boolean;
  /** Events.categories id: "nature", "culture", "exclusive"… */
  category: string;
  schedule: ExperienceSchedule;
  title: Localized;
  shortTitle: Localized;
  subtitle: Localized;
  description: Localized;
  location: { name: Localized; region: Localized; country: string; destinationId: string | null };
  duration: Localized;
  media: {
    /** Card image. Plain /public paths, no uploads. */
    cover: string;
    flyer: string;
    hero: string;
    gallery: GalleryItem[];
  };
  pricing: { tiers: PriceTier[] };
  packages: ExperiencePackage[];
  details: { id: string; icon: string; label: Localized; value: Localized }[];
  itinerary: { id: string; tone: string; title: Localized; items: LocalizedList }[];
  highlights: { id: string; icon: string; text: Localized }[];
  capacity: { seats: number | null; attendees: number | null };
  booking: { mode: BookingMode; whatsappText: Localized; itinerary: string };
  /** Promote on the homepage hero until this date (replaces isEventMode / EVENT.lastDay). */
  hero: { promote: boolean; until: string | null };
};

export type AdminExperience = ExperienceInput & { id: string; createdAt: number; updatedAt: number };

export type ExperienceWhen = "upcoming" | "past";

/**
 * Upcoming while the last day (endDate, or startDate for one-day trips) hasn't
 * passed in Kigali. Trips without a fixed day ("month" or "tba") count as upcoming.
 */
export function experienceWhen(s: Pick<ExperienceSchedule, "startDate" | "endDate" | "precision">, todayKigali: string): ExperienceWhen {
  const last = s.endDate ?? s.startDate;
  if (s.precision !== "day" || !last) return "upcoming";
  return last >= todayKigali ? "upcoming" : "past";
}

/** Sort key: upcoming soonest first, past newest first. Undated trips go after dated ones. */
export function compareExperiences(a: PublicExperience, b: PublicExperience): number {
  if (a.when !== b.when) return a.when === "upcoming" ? -1 : 1;
  const da = a.schedule.startDate ?? "9999-12-31";
  const db = b.schedule.startDate ?? "9999-12-31";
  return a.when === "upcoming" ? da.localeCompare(db) : db.localeCompare(da);
}

/** One experience in one language, as the website shows it. */
export type PublicExperience = {
  id: string;
  slug: string;
  when: ExperienceWhen;
  availability: ExperienceAvailability;
  featured: boolean;
  category: string;
  schedule: Omit<ExperienceSchedule, "departure"> & { departure: string };
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  location: { name: string; region: string; country: string; destinationId: string | null };
  duration: string;
  media: { cover: string; flyer: string; hero: string; gallery: { src: string; type: MediaType; caption: string; inPreview: boolean }[] };
  tiers: { id: string; label: string; note: string; amount: number; currency: ExperienceCurrency; highlight: boolean }[];
  /** Lowest RWF tier, for "From …" on cards. null when there's no RWF price. */
  fromRwf: number | null;
  packages: { id: string; title: string; ribbon: string; featured: boolean; tierId: string; includes: { text: string; muted: boolean }[]; cta: string }[];
  details: { id: string; icon: string; label: string; value: string }[];
  itinerary: { id: string; tone: string; title: string; items: string[] }[];
  highlights: { id: string; icon: string; text: string }[];
  capacity: { seats: number | null; attendees: number | null };
  booking: { mode: BookingMode; whatsappText: string; itinerary: string };
  hero: { promote: boolean; until: string | null };
  /** True when any French text was missing and English is shown instead. */
  translated: boolean;
};

export function localizeExperience(e: AdminExperience, locale: CmsLocale, todayKigali: string): PublicExperience {
  let translated = false;
  const t = (v: Localized) => {
    if (isFallback(v, locale)) translated = true;
    return pick(v, locale);
  };
  const rwf = e.pricing.tiers.filter((x) => x.currency === "RWF").map((x) => x.amount);
  const out: Omit<PublicExperience, "translated"> = {
    id: e.id,
    slug: e.slug,
    when: experienceWhen(e.schedule, todayKigali),
    availability: e.availability,
    featured: e.featured,
    category: e.category,
    schedule: { ...e.schedule, departure: t(e.schedule.departure) },
    title: t(e.title),
    shortTitle: t(e.shortTitle) || t(e.title),
    subtitle: t(e.subtitle),
    description: t(e.description),
    location: { name: t(e.location.name), region: t(e.location.region), country: e.location.country, destinationId: e.location.destinationId },
    duration: t(e.duration),
    media: {
      cover: e.media.cover,
      flyer: e.media.flyer,
      hero: e.media.hero,
      gallery: e.media.gallery.map((g) => ({ src: g.src, type: g.type, caption: t(g.caption), inPreview: g.inPreview })),
    },
    tiers: e.pricing.tiers.map((x) => ({ ...x, label: t(x.label), note: t(x.note) })),
    fromRwf: rwf.length ? Math.min(...rwf) : null,
    packages: e.packages.map((p) => ({
      id: p.id, title: t(p.title), ribbon: t(p.ribbon), featured: p.featured, tierId: p.tierId,
      includes: p.includes.map((i) => ({ text: t(i.text), muted: i.muted })), cta: t(p.cta),
    })),
    details: e.details.map((d) => ({ id: d.id, icon: d.icon, label: t(d.label), value: t(d.value) })),
    itinerary: e.itinerary.map((d) => ({ id: d.id, tone: d.tone, title: t(d.title), items: pickList(d.items, locale) })),
    highlights: e.highlights.map((h) => ({ id: h.id, icon: h.icon, text: t(h.text) })),
    capacity: e.capacity,
    booking: { mode: e.booking.mode, whatsappText: t(e.booking.whatsappText), itinerary: e.booking.itinerary },
    hero: e.hero,
  };
  return { ...out, translated };
}
