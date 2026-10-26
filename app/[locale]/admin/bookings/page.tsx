import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePage } from "@/lib/admin-page";
import { bookingAbilities } from "@/lib/admin-rbac";
import { loadBookings } from "@/lib/admin-bookings";
import { kigaliToday } from "@/lib/bookings";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/types";
import { BookingsPanel } from "@/components/admin/bookings-panel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("bookings") };
}

type Props = { searchParams: Promise<{ new?: string; status?: string }> };

/** Bookings — the WhatsApp order log. ?new=1 opens the "Log a booking" form, ?status=pending pre-filters. */
export default async function AdminBookingsPage({ searchParams }: Props) {
  const access = await requirePage("bookings:view");
  if (!access.ok) return access.block;

  const [{ state, bookings }, params] = await Promise.all([loadBookings(), searchParams]);
  const status = BOOKING_STATUSES.includes(params.status as BookingStatus) ? (params.status as BookingStatus) : "all";

  return (
    <BookingsPanel
      initialBookings={bookings}
      dbState={state}
      today={kigaliToday()}
      openNew={params.new === "1"}
      initialStatus={status}
      abilities={bookingAbilities(access.session.role)}
    />
  );
}
