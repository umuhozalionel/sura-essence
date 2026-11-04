import { setRequestLocale } from "next-intl/server";
import { TripBuilder } from "@/components/trips/trip-builder";
import { pageMetadata } from "@/lib/brands/metadata";
import { getActivePricing } from "@/lib/cms/pricing-config-server";
import { getTripRates } from "@/lib/cms/trip-rates-server";

export const generateMetadata = pageMetadata("Brands.iwacu.meta", "tripAkagera");

/** /iwacu/trips/akagera: the customer builds their day, at the live rates. */
export default async function AkageraTripPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [rates, { config }] = await Promise.all([getTripRates(), getActivePricing()]);
  return <TripBuilder rates={rates} pricing={config} />;
}
