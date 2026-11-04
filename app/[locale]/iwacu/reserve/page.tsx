import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BookingPage } from "@/components/booking-page";
import { getReservableExperiences } from "@/lib/cms/site-data";

/**
 * /iwacu/reserve: Kigali tours, experience packages and custom itineraries.
 * Packages come from Admin → Experiences (booking set to "form"). Trips have their
 * own page now, so old links that ask for one go there.
 */
export default async function IwacuReservePage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { tab, dest, destination } = await searchParams;
  if (tab === "country" || tab === "trips" || dest || destination) {
    redirect(`/${locale}/iwacu/trips${dest === "akagera" || destination === "akagera" ? "/akagera" : ""}`);
  }
  return <BookingPage brand="iwacu" experiences={await getReservableExperiences(locale)} />;
}
