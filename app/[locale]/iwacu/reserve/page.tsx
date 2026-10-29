import { setRequestLocale } from "next-intl/server";
import { BookingPage } from "@/components/booking-page";
import { getReservableExperiences } from "@/lib/cms/site-data";

/**
 * /iwacu/reserve: Kigali tours, trips to a destination, experience packages and
 * custom itineraries. Packages come from Admin → Experiences (booking set to "form").
 */
export default async function IwacuReservePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BookingPage brand="iwacu" experiences={await getReservableExperiences(locale)} />;
}
