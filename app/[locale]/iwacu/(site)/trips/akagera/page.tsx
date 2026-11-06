import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { TripBuilder } from "@/components/trips/trip-builder";
import { TripWords } from "@/components/trips/trip-words";
import { getActivePricing } from "@/lib/cms/pricing-config-server";
import { getTripPage } from "@/lib/cms/trip-pages-server";
import { getTripRates } from "@/lib/cms/trip-rates-server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = (await getTripPage("akagera", (await params).locale)).translator("Brands.iwacu.meta.tripAkagera");
  return { title: t("title"), description: t("description") };
}

/** /iwacu/trips/akagera: the customer builds their day, at the live rates. Words and photo: Admin → Trips → Page content. */
export default async function AkageraTripPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [rates, { config }, page] = await Promise.all([getTripRates(), getActivePricing(), getTripPage("akagera", locale)]);
  return (
    <TripWords trips={page.trips}>
      <TripBuilder tripId="akagera" rates={rates} pricing={config} heroImage={page.media("hero")} />
    </TripWords>
  );
}
