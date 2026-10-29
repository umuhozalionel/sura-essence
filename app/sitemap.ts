import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getExperienceSlugs } from "@/lib/cms/site-data";
import { SITE_URL } from "@/lib/site-url";

/**
 * Every public page in English and French, each pointing at its other language.
 * Experience pages come from the CMS (published ones with their own page), or
 * from messages/*.json while the database can't answer. Left out: admin, the
 * booking confirmation and the 404 catch-alls.
 */
const PAGES = [
  // SURA Essence
  "/",
  "/contact",
  // SURA Movana
  "/movana",
  "/movana/book",
  "/movana/airport-transfers",
  "/movana/driver-hire",
  "/movana/fleet",
  "/movana/trip-alerts",
  // SURA Iwacu
  "/iwacu",
  "/iwacu/experiences",
  "/iwacu/kigali-tours",
  "/iwacu/events",
  "/iwacu/events/past",
  "/iwacu/gallery",
  "/iwacu/kigali-guide",
];

const url = (locale: string, path: string) => `${SITE_URL}/${locale}${path === "/" ? "" : path}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getExperienceSlugs();
  const paths = [...PAGES, ...slugs.map((slug) => `/iwacu/experiences/${slug}`)];
  return paths.flatMap((path) => {
    const languages = Object.fromEntries(routing.locales.map((l) => [l, url(l, path)]));
    return routing.locales.map((locale) => ({ url: url(locale, path), alternates: { languages } }));
  });
}
