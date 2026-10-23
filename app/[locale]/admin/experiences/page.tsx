import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { isAdmin } from "@/lib/admin-auth";
import { ExperiencesAdmin } from "@/components/admin/experiences-admin";
import { SessionGuard } from "@/components/admin/session-guard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("experiences") };
}

/** Experiences — every trip: upcoming, past, seasons and gallery, in one list. */
export default async function AdminExperiencesPage() {
  if (!(await isAdmin())) return <SessionGuard />;
  return <ExperiencesAdmin />;
}
