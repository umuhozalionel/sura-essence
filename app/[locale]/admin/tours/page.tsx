import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { isAdmin } from "@/lib/admin-auth";
import { ToursAdmin } from "@/components/admin/tours-admin";
import { SessionGuard } from "@/components/admin/session-guard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("tours") };
}

/** Tours — Kigali tour collections and the venues inside them. */
export default async function AdminToursPage() {
  if (!(await isAdmin())) return <SessionGuard />;
  return <ToursAdmin />;
}
