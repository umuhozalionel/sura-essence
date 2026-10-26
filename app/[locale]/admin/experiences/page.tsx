import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePage } from "@/lib/admin-page";
import { ExperiencesAdmin } from "@/components/admin/experiences-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("experiences") };
}

/** Experiences — every trip: upcoming, past, seasons and gallery, in one list. */
export default async function AdminExperiencesPage() {
  const access = await requirePage("experiences:view");
  if (!access.ok) return access.block;
  return <ExperiencesAdmin />;
}
