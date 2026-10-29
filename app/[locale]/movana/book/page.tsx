import { setRequestLocale } from "next-intl/server";
import { BookingPage } from "@/components/booking-page";

/** /movana/book: rides, transfers, drivers by the hour and corporate requests. */
export default async function MovanaBookPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return <BookingPage brand="movana" />;
}
