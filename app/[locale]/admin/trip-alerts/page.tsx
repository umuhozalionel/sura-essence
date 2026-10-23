import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { isAdmin } from "@/lib/admin-auth";
import { TripAlertsAdmin } from "@/components/admin/trip-alerts-admin";
import { SessionGuard } from "@/components/admin/session-guard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("tripAlerts") };
}

/** Trip alerts — travel notices shown on the Trip alerts page. */
export default async function AdminTripAlertsPage() {
  if (!(await isAdmin())) return <SessionGuard />;
  return <TripAlertsAdmin />;
}
