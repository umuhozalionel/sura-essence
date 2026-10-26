import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePage } from "@/lib/admin-page";
import { TripAlertsAdmin } from "@/components/admin/trip-alerts-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("tripAlerts") };
}

/** Trip alerts — travel notices shown on the Trip alerts page. */
export default async function AdminTripAlertsPage() {
  const access = await requirePage("tripAlerts:view");
  if (!access.ok) return access.block;
  return <TripAlertsAdmin />;
}
