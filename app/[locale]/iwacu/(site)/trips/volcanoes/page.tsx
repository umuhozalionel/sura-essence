import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { TripBuilder } from "@/components/trips/trip-builder";
import { TripWords } from "@/components/trips/trip-words";
import { getActivePricing } from "@/lib/cms/pricing-config-server";
import { getTripPage } from "@/lib/cms/trip-pages-server";
import { getTripRates } from "@/lib/cms/trip-rates-server";
import { getSiteTrips } from "@/lib/cms/trips-server";

/** Each door's feel (app/globals.css, [data-feel]): the place a card opens the trip for, from ?feel= or the activity picked. */
const FEELS = ["bisoke", "karisimbi", "virunga", "caves"] as const;
const FEEL_OF_ACTIVITY: Record<string, (typeof FEELS)[number]> = {
  bisoke: "bisoke", karisimbi: "karisimbi", caves: "caves", sabyinyo: "virunga", gahinga: "virunga", muhabura: "virunga", muhaburaGahinga: "virunga",
};

/** Whether the trip is open for booking (Admin → Trips, status "Open for booking"), and has recap photos. */
async function volcanoesStatus(locale: string) {
  const trip = (await getSiteTrips(locale)).find((t) => t.id === "volcanoes");
  return { live: trip?.status === "live", recap: trip?.status === "live" && (trip.photos.length ?? 0) > 0 };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const [page, { live }] = await Promise.all([getTripPage("volcanoes", locale), volcanoesStatus(locale)]);
  const t = page.translator("Brands.iwacu.meta.tripVolcanoes");
  // Until it opens, the page works by its address for the team to try, but stays out of search.
  return { title: t("title"), description: t("description"), ...(!live && { robots: { index: false, follow: false } }) };
}

/**
 * /iwacu/trips/volcanoes: a day in Volcanoes National Park and Musanze, at the live rates.
 * Cards for one place open it with that activity picked and in that place's feel:
 * ?activity=bisoke, karisimbi or caves, or ?feel=virunga for the volcano chain.
 * Words and photo: Admin → Trips → Page content.
 */
export default async function VolcanoesTripPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { activity, feel } = await searchParams;
  const pick = typeof activity === "string" ? activity : undefined;
  const look = FEELS.find((f) => f === feel) ?? (pick ? FEEL_OF_ACTIVITY[pick] : undefined);
  const [rates, { config }, page, { recap }] = await Promise.all([getTripRates(), getActivePricing(), getTripPage("volcanoes", locale), volcanoesStatus(locale)]);
  return (
    <TripWords trips={page.trips}>
      <TripBuilder tripId="volcanoes" rates={rates} pricing={config} heroImage={page.media("hero")} recap={recap} activity={pick} feel={look} />
    </TripWords>
  );
}
