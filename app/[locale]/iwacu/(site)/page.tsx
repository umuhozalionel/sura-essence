import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSiteData } from "@/lib/cms/site-data";
import { IwacuHomeView } from "./iwacu-home-view";

/*
 * TEMPORARY Iwacu home, built from the homepage's existing sections only
 * (activities, destinations & history, gallery). Phase 3 replaces it with the
 * real editorial Iwacu home.
 */

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Brands.iwacu" });
  return { title: { absolute: `SURA Iwacu · ${t("tagline")}` }, description: t("footer.description") };
}

export default async function IwacuHomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await getSiteData(locale);
  return <IwacuHomeView upcoming={data?.upcoming} past={data?.past} trips={data?.trips} />;
}
