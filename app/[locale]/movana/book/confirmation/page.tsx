import { setRequestLocale } from "next-intl/server";
import { BookingConfirmation } from "@/components/booking-confirmation";
import { getIwacuHighlights } from "@/lib/cms/site-data";

/** After a Movana booking is sent. Airport transfers also see two SURA Iwacu experiences. */
export default async function MovanaConfirmationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BookingConfirmation brand="movana" highlights={await getIwacuHighlights(locale)} />;
}
