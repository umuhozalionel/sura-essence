import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePage } from "@/lib/admin-page";
import { BoardAdmin } from "@/components/admin/board-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("team") };
}

/** Board members — who appears in the founders section of the homepage. */
export default async function AdminTeamPage() {
  const access = await requirePage("team:manage");
  if (!access.ok) return access.block;
  return <BoardAdmin />;
}
