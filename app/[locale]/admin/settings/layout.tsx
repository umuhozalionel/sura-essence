import { getTranslations } from "next-intl/server";
import { getAdminSession } from "@/lib/admin-auth";
import { can } from "@/lib/admin-rbac";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsTabs } from "@/components/admin/settings-tabs";

/**
 * Settings, in two tabs:
 *   My profile     /admin/settings/profile  every role (profile:edit)
 *   Site settings  /admin/settings/site     settings:manage (Main Admin)
 * Tabs a role doesn't have are left out here, and each page checks again.
 */
export default async function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) return children; // the page shows the SessionGuard

  const t = await getTranslations("Admin.settings");
  const tabs = [
    can(session.role, "profile:edit") && { href: "/admin/settings/profile", label: t("tabs.profile") },
    can(session.role, "settings:manage") && { href: "/admin/settings/site", label: t("tabs.site") },
  ].filter((tab): tab is { href: string; label: string } => Boolean(tab));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <SettingsTabs tabs={tabs} label={t("tabs.label")} />
      {children}
    </div>
  );
}
