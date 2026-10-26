import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePage } from "@/lib/admin-page";
import { ToursAdmin } from "@/components/admin/tours-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("tours") };
}

/** Tours — Kigali tour collections and the venues inside them. */
export default async function AdminToursPage() {
  const access = await requirePage("tours:view");
  if (!access.ok) return access.block;
  return <ToursAdmin />;
}
