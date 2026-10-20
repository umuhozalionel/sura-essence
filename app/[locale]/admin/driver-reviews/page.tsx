import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { isAdmin } from "@/lib/admin-auth";
import { DriverReviewsAdmin } from "@/components/admin/driver-reviews-admin";
import { SessionGuard } from "@/components/admin/session-guard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("driverReviews") };
}

/** Driver reviews — edit, approve or replace the reviews shown on the Driver page. */
export default async function AdminDriverReviewsPage() {
  if (!(await isAdmin())) return <SessionGuard />;
  return <DriverReviewsAdmin />;
}
