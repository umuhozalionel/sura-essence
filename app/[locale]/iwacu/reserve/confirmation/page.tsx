import { setRequestLocale } from "next-intl/server";
import { BookingConfirmation } from "@/components/booking-confirmation";

/** After an Iwacu booking is sent, with an airport pickup offered for the first day. */
export default async function IwacuConfirmationPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return <BookingConfirmation brand="iwacu" />;
}
