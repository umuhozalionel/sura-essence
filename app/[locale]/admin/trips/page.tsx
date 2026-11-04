import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePage } from "@/lib/admin-page";
import { TripRatesAdmin } from "@/components/admin/trip-rates-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("trips") };
}

/** Trips: the exchange rate and the fees /iwacu/trips prices with (lib/cms/trip-rates-server.ts). */
export default async function AdminTripsPage() {
  const access = await requirePage("trips:view");
  if (!access.ok) return access.block;
  return <TripRatesAdmin />;
}
