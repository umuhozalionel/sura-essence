import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePage } from "@/lib/admin-page";
import { DriverReviewsAdmin } from "@/components/admin/driver-reviews-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("driverReviews") };
}

/** Driver reviews — edit, approve or replace the reviews shown on the Driver page. */
export default async function AdminDriverReviewsPage() {
  const access = await requirePage("driverReviews:manage");
  if (!access.ok) return access.block;
  return <DriverReviewsAdmin />;
}
