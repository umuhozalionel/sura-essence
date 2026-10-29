import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePage } from "@/lib/admin-page";
import { bookingAbilities, bookingBrands } from "@/lib/admin-rbac";
import { loadBookings } from "@/lib/admin-bookings";
import { kigaliToday } from "@/lib/bookings";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/types";
import { isBookingBrand } from "@/lib/bookings";
import { BookingsPanel } from "@/components/admin/bookings-panel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("bookings") };
}

type Props = { searchParams: Promise<{ new?: string; status?: string; brand?: string }> };

/**
 * Bookings: the order log, for the brands this person works with (bookings:brand:*).
 * ?new=1 opens the "Log a booking" form; ?status=pending and ?brand=iwacu pre-filter.
 */
export default async function AdminBookingsPage({ searchParams }: Props) {
  const access = await requirePage("bookings:view");
  if (!access.ok) return access.block;

  // Only these brands' bookings ever leave the server.
  const brands = bookingBrands(access.session.role);
  const [{ state, bookings }, params] = await Promise.all([loadBookings(brands), searchParams]);
  const status = BOOKING_STATUSES.includes(params.status as BookingStatus) ? (params.status as BookingStatus) : "all";
  const brand = isBookingBrand(params.brand) && brands.includes(params.brand) ? params.brand : "all";

  return (
    <BookingsPanel
      initialBookings={bookings}
      dbState={state}
      today={kigaliToday()}
      openNew={params.new === "1"}
      initialStatus={status}
      brands={brands}
      initialBrand={brand}
      abilities={bookingAbilities(access.session.role)}
    />
  );
}
