import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeView } from "./home-view";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Hub.meta" });
  // The hub is the parent brand itself, so no " · SURA Essence" template here.
  return { title: { absolute: t("title") }, description: t("description") };
}

/** The SURA Essence hub: a door to Movana (a live quote) and one to Iwacu, then who we are. */
export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeView />;
}
