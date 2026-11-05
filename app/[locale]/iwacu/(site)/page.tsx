import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getIwacuSpotlights, getSiteData, getSiteToursData } from "@/lib/cms/site-data";
import { IwacuHomeView } from "./iwacu-home-view";

/*
 * The SURA Iwacu home: the promoted (or next) experience, then Trips, Experiences,
 * a taste of the Kigali tours, the stay, guest stories and the gallery.
 * Everything comes from the CMS, or messages/*.json until it's seeded.
 */

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Brands.iwacu" });
  // The layout's template would add " · SURA Iwacu" to a plain title; the home page is the brand itself.
  return { title: { absolute: `SURA Iwacu · ${t("tagline")}` }, description: t("footer.description") };
}

export default async function IwacuHomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [data, spotlights, collections] = await Promise.all([getSiteData(locale), getIwacuSpotlights(locale), getSiteToursData(locale)]);
  return (
    <IwacuHomeView
      promoted={spotlights.promoted}
      next={spotlights.next}
      upcoming={data?.upcoming}
      past={data?.past}
      trips={data?.trips}
      collections={collections ?? undefined}
    />
  );
}
