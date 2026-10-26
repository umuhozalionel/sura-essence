import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePage } from "@/lib/admin-page";
import { SiteContentAdmin } from "@/components/admin/site-content-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("content") };
}

/** Site content — reword text blocks (Fleet page steps, the Pricing page heading) without a deploy. */
export default async function AdminContentPage() {
  const access = await requirePage("content:manage");
  if (!access.ok) return access.block;
  return <SiteContentAdmin />;
}
