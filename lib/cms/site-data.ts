/**
 * What the public pages render, from MongoDB. SERVER ONLY.
 *
 * Each getter returns null when the pages should keep showing messages/*.json
 * exactly as before: MongoDB isn't set up, can't answer, or hasn't been seeded
 * yet. The reads themselves are cached under the "cms:experiences" /
 * "cms:tours" tags and cleared by every admin edit.
 */
import { getFormatter, getTranslations } from "next-intl/server";
import { kigaliToday } from "@/lib/bookings";
import { pick, toLocale } from "./localized";
import { getSiteExperiences } from "./experiences-server";
import { getSiteTours } from "./tours-server";
import {
  hasDetailPage, toCollections, toExperienceDetail, toGalleryTrips, toPastEvents, toSeasons, toSpotlights, toUpcomingEvents, toUpcomingSpotlights, type ShapeLabels, type SiteSpotlight,
} from "./site-shapes";
import { legacyExperiences } from "./legacy";
import { experienceWhen, type AdminExperience } from "./experiences";

async function labels(locale: string): Promise<ShapeLabels> {
  const [t, format] = await Promise.all([getTranslations({ locale, namespace: "Activities.cms" }), getFormatter({ locale })]);
  const month = (iso: string) => {
    const name = format.dateTime(new Date(`${iso}-01T00:00:00Z`), { month: "long", timeZone: "UTC" });
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  return {
    monthTba: (iso) => t("monthTba", { month: month(iso) }),
    priceFrom: (amount, currency) => t("priceFrom", { price: format.number(amount, { notation: "compact", maximumFractionDigits: 1 }), currency }),
    priceTba: t("priceTba"),
  };
}

/** Events, past events, seasons and gallery trips, or null to use messages/*.json. */
export async function getSiteData(locale: string) {
  const list = await getSiteExperiences();
  if (!list) return null;
  const l = toLocale(locale);
  const today = kigaliToday();
  return {
    upcoming: toUpcomingEvents(list, l, today),
    past: toPastEvents(list, l, today),
    seasons: toSeasons(list, l, today, await labels(locale)),
    trips: toGalleryTrips(list, l, today),
  };
}

/** Tours page collections, or null to use messages/*.json. */
export async function getSiteToursData(locale: string) {
  const tours = await getSiteTours();
  return tours ? toCollections(tours.collections, tours.venues, toLocale(locale)) : null;
}

/** The trips as experiences built from messages/*.json, for /activities/[slug] when MongoDB can't answer. */
const legacyAsAdmin = (): AdminExperience[] =>
  legacyExperiences().map((e, i) => ({ ...e, id: `legacy-${i}`, createdAt: 0, updatedAt: 0 }));

/**
 * One experience page. From MongoDB when it answers, else from messages/*.json.
 * null when there's no published experience with this slug (or it has nothing
 * for a page of its own).
 */
export async function getSiteExperienceDetail(slug: string, locale: string) {
  const list = (await getSiteExperiences()) ?? legacyAsAdmin();
  const found = list.find((e) => e.slug === slug && e.status === "published" && hasDetailPage(e));
  return found ? toExperienceDetail(found, toLocale(locale), kigaliToday()) : null;
}

/** A spotlight with its date worded for the page: "12–14 October", "October (date TBA)". */
export type IwacuSpotlight = Omit<SiteSpotlight, "schedule"> & { when: string };

/**
 * The Iwacu home hero: the promoted experience and the next featured one, from
 * MongoDB or, when it can't answer, from messages/*.json. Either can be null.
 */
export async function getIwacuSpotlights(locale: string): Promise<{ promoted: IwacuSpotlight | null; next: IwacuSpotlight | null }> {
  const list = (await getSiteExperiences()) ?? legacyAsAdmin();
  const { promoted, next } = toSpotlights(list, toLocale(locale), kigaliToday());
  const [format, tHome, shape] = await Promise.all([
    getFormatter({ locale }),
    getTranslations({ locale, namespace: "HomeActivities" }),
    labels(locale),
  ]);
  const day = (iso: string) => new Date(`${iso}T12:00:00Z`);
  const word = (s: SiteSpotlight | null): IwacuSpotlight | null => {
    if (!s) return null;
    const { schedule, ...rest } = s;
    let when = tHome("dateTba");
    if (schedule.precision === "day" && schedule.startDate) {
      const opts = { day: "numeric", month: "long", timeZone: "UTC" } as const;
      when = schedule.endDate
        ? format.dateTimeRange(day(schedule.startDate), day(schedule.endDate), opts)
        : format.dateTime(day(schedule.startDate), opts);
    } else if (schedule.month) {
      when = shape.monthTba(schedule.month);
    }
    return { ...rest, when };
  };
  return { promoted: word(promoted), next: word(next) };
}

/** Every slug with a page of its own, for generateStaticParams. */
export async function getExperienceSlugs(): Promise<string[]> {
  const list = (await getSiteExperiences()) ?? legacyAsAdmin();
  return list.filter((e) => e.status === "published" && hasDetailPage(e)).map((e) => e.slug);
}

/* ─── packages booked on /iwacu/reserve ─────────────────────────────── */

/** One package of an experience, priced per guest at its tier. */
export type ReservablePackage = { id: string; title: string; amount: number; currency: "RWF" | "USD" };
/** An experience the Iwacu booking form can book. */
export type ReservableExperience = { slug: string; title: string; image: string; startDate: string | null; packages: ReservablePackage[] };

/**
 * Bookable on the website: published, still to come, open, set to "form" in
 * Admin → Experiences (WhatsApp-only trips keep WhatsApp), with packages to pick.
 */
const reservable = (e: AdminExperience, today: string) =>
  e.status === "published" &&
  e.booking.mode === "form" &&
  e.availability !== "closed" &&
  e.availability !== "soldOut" &&
  experienceWhen(e.schedule, today) === "upcoming" &&
  e.packages.length > 0;

function toReservable(e: AdminExperience, l: ReturnType<typeof toLocale>): ReservableExperience {
  const packages = e.packages.flatMap((p): ReservablePackage[] => {
    const tier = e.pricing.tiers.find((x) => x.id === p.tierId);
    return tier ? [{ id: p.id, title: pick(p.title, l), amount: tier.amount, currency: tier.currency }] : [];
  });
  return {
    slug: e.slug,
    title: pick(e.title, l),
    image: e.media.cover || e.media.hero,
    startDate: e.schedule.precision === "day" ? e.schedule.startDate : null,
    packages,
  };
}

/** Experiences with packages the Iwacu booking form offers, soonest first. */
export async function getReservableExperiences(locale: string): Promise<ReservableExperience[]> {
  const list = (await getSiteExperiences()) ?? legacyAsAdmin();
  const today = kigaliToday();
  return list
    .filter((e) => reservable(e, today))
    .sort((a, b) => (a.schedule.startDate ?? "9999").localeCompare(b.schedule.startDate ?? "9999"))
    .map((e) => toReservable(e, toLocale(locale)))
    .filter((e) => e.packages.length > 0);
}

/**
 * The server's price for `guests` places on one package: the tier's amount ×
 * guests, in its currency. null when the experience or package can't be booked.
 */
export async function quotePackage(slug: string, packageId: string | null, guests: number) {
  const list = (await getSiteExperiences()) ?? legacyAsAdmin();
  const e = list.find((x) => x.slug === slug);
  if (!e || !reservable(e, kigaliToday())) return null;
  const r = toReservable(e, "en");
  const pkg = r.packages.find((p) => p.id === packageId) ?? (packageId ? null : r.packages[0]);
  if (!pkg) return null;
  return { experienceTitle: r.title, packageId: pkg.id, packageTitle: pkg.title, currency: pkg.currency, total: pkg.amount * guests };
}

/** A few upcoming SURA Iwacu experiences, for the Movana airport confirmation's cross-sell. */
export async function getIwacuHighlights(locale: string, count = 2): Promise<IwacuSpotlight[]> {
  const list = (await getSiteExperiences()) ?? legacyAsAdmin();
  const [format, tHome] = await Promise.all([getFormatter({ locale }), getTranslations({ locale, namespace: "HomeActivities" })]);
  return toUpcomingSpotlights(list, toLocale(locale), kigaliToday())
    .slice(0, count)
    .map(({ schedule, ...rest }) => ({
      ...rest,
      when:
        schedule.precision === "day" && schedule.startDate
          ? format.dateTime(new Date(`${schedule.startDate}T12:00:00Z`), { day: "numeric", month: "long", timeZone: "UTC" })
          : tHome("dateTba"),
    }));
}
