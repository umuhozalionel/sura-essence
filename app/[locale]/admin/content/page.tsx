import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { isAdmin } from "@/lib/admin-auth";
import { SiteContentAdmin } from "@/components/admin/site-content-admin";
import { SessionGuard } from "@/components/admin/session-guard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("content") };
}

/** Site content — reword text blocks (Fleet page steps, the Pricing page heading) without a deploy. */
export default async function AdminContentPage() {
  if (!(await isAdmin())) return <SessionGuard />;
  return <SiteContentAdmin />;
}
