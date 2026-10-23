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
import { toLocale } from "./localized";
import { getSiteExperiences } from "./experiences-server";
import { getSiteTours } from "./tours-server";
import {
  hasDetailPage, toCollections, toExperienceDetail, toGalleryTrips, toPastEvents, toSeasons, toUpcomingEvents, type ShapeLabels,
} from "./site-shapes";
import { legacyExperiences } from "./legacy";
import type { AdminExperience } from "./experiences";

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

/** Every slug with a page of its own, for generateStaticParams. */
export async function getExperienceSlugs(): Promise<string[]> {
  const list = (await getSiteExperiences()) ?? legacyAsAdmin();
  return list.filter((e) => e.status === "published" && hasDetailPage(e)).map((e) => e.slug);
}
