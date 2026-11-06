import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { TripBuilder } from "@/components/trips/trip-builder";
import { TripWords } from "@/components/trips/trip-words";
import { getActivePricing } from "@/lib/cms/pricing-config-server";
import { getTripPage } from "@/lib/cms/trip-pages-server";
import { getTripRates } from "@/lib/cms/trip-rates-server";
import { getSiteTrips } from "@/lib/cms/trips-server";

/** Whether Nyungwe is open for booking (Admin → Trips, status "Open for booking"), and has recap photos. */
async function nyungweStatus(locale: string) {
  const trip = (await getSiteTrips(locale)).find((t) => t.id === "nyungwe");
  return { live: trip?.status === "live", recap: trip?.status === "live" && (trip.photos.length ?? 0) > 0 };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const [page, { live }] = await Promise.all([getTripPage("nyungwe", locale), nyungweStatus(locale)]);
  const t = page.translator("Brands.iwacu.meta.tripNyungwe");
  // Until it opens, the page works by its address for the team to try, but stays out of search.
  return { title: t("title"), description: t("description"), ...(!live && { robots: { index: false, follow: false } }) };
}

/**
 * /iwacu/trips/nyungwe: the customer builds a day in Nyungwe Forest, at the live rates. The
 * trips list links here once Nyungwe is switched to "Open for booking" in Admin → Trips with
 * this address as its link. Words and photo: Admin → Trips → Page content.
 */
export default async function NyungweTripPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [rates, { config }, page, { recap }] = await Promise.all([getTripRates(), getActivePricing(), getTripPage("nyungwe", locale), nyungweStatus(locale)]);
  return (
    <TripWords trips={page.trips}>
      <TripBuilder tripId="nyungwe" rates={rates} pricing={config} heroImage={page.media("hero")} recap={recap} />
    </TripWords>
  );
}
