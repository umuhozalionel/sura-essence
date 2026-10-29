/**
 * Titles, descriptions, Open Graph defaults and icons per brand. SERVER ONLY
 * (reads messages through next-intl/server).
 *
 * Each brand layout calls brandLayoutMetadata(), so every page below it is
 * titled "Page · SURA Movana" (or Iwacu, or Essence) and shares the brand's
 * Open Graph card. Pages call pageMetadata() for their own title and description.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getBrand, type BrandId } from ".";

type Params = { params: Promise<{ locale: string }> };

/** Each brand's share image and browser-tab icon. Files live in public/. */
const BRAND_ASSETS: Record<BrandId, { ogImage: string; icon: string }> = {
  sura: { ogImage: "/backgrounds/hero1.jpeg", icon: "/brand/sura-logo.png" },
  movana: { ogImage: "/backgrounds/winding-road.jpg", icon: "/brand/movana-icon.svg" },
  iwacu: { ogImage: "/backgrounds/akagera.jpg", icon: "/brand/iwacu-icon.svg" },
};

/** Where each brand's default description lives in messages/*.json. */
const DESCRIPTION: Record<BrandId, { namespace: string; key: string }> = {
  sura: { namespace: "Hub.meta", key: "description" },
  movana: { namespace: "Brands.movana.footer", key: "description" },
  iwacu: { namespace: "Brands.iwacu.footer", key: "description" },
};

/** The brand's title template, description, Open Graph card and icons. */
export async function brandLayoutMetadata(id: BrandId, locale: string): Promise<Metadata> {
  const brand = getBrand(id);
  const { ogImage, icon } = BRAND_ASSETS[id];
  const t = await getTranslations({ locale, namespace: DESCRIPTION[id].namespace });
  const description = t(DESCRIPTION[id].key);
  return {
    title: { default: brand.name, template: `%s · ${brand.name}` },
    description,
    openGraph: {
      type: "website",
      siteName: brand.name,
      locale: locale === "fr" ? "fr_FR" : "en_GB",
      description,
      images: [{ url: ogImage, alt: brand.name }],
    },
    icons: { icon, shortcut: icon, apple: "/brand/sura-logo.png" },
  };
}

/**
 * generateMetadata for a page whose words live at `<namespace>.<page>.title`
 * and `.description`. The brand layout's template adds " · SURA …".
 */
export const pageMetadata = (namespace: string, page: string) =>
  async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace });
    return { title: t(`${page}.title`), description: t(`${page}.description`) };
  };

/**
 * Like pageMetadata(), for a layout that has pages of its own below it (e.g.
 * /movana/book and its confirmation). A plain title there would stop the brand's
 * template from reaching those pages, so this one carries it on.
 */
export const sectionMetadata = (id: BrandId, namespace: string, page: string) =>
  async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace });
    const name = getBrand(id).name;
    return {
      title: { absolute: `${t(`${page}.title`)} · ${name}`, template: `%s · ${name}` },
      description: t(`${page}.description`),
    };
  };
