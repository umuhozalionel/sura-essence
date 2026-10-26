import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePage } from "@/lib/admin-page";
import { isMongoConfigured } from "@/lib/mongodb";
import { listAccounts } from "@/lib/admin-users";
import type { AdminAccount } from "@/lib/admin-accounts";
import { UsersAdmin } from "@/components/admin/users-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("users") };
}

/** Users — staff accounts and their roles. Main Admin only (users:manage). */
export default async function AdminUsersPage() {
  const access = await requirePage("users:manage");
  if (!access.ok) return access.block;

  let dbState: "ok" | "notConfigured" | "unavailable" = isMongoConfigured ? "ok" : "notConfigured";
  let accounts: AdminAccount[] = [];
  if (isMongoConfigured) {
    try {
      accounts = await listAccounts();
    } catch (err) {
      console.error("[admin] loading admin accounts failed:", err);
      dbState = "unavailable";
    }
  }

  return (
    <UsersAdmin
      initialAccounts={accounts}
      dbState={dbState}
      me={access.session.userId}
      setupSignIn={access.session.source === "environment"}
    />
  );
}
