import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { isAdmin } from "@/lib/admin-auth";
import { BoardAdmin } from "@/components/admin/board-admin";
import { SessionGuard } from "@/components/admin/session-guard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("team") };
}

/** Board members — who appears in the founders section of the homepage. */
export default async function AdminTeamPage() {
  if (!(await isAdmin())) return <SessionGuard />;
  return <BoardAdmin />;
}
