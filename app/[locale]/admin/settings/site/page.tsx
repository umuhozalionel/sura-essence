import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Activity, CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import { requirePage } from "@/lib/admin-page";
import { loadDbHealth } from "@/lib/admin-data";
import { Panel } from "@/components/admin/page-header";
import { SettingsRow } from "@/components/admin/settings-row";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.settings.tabs");
  return { title: t("site") };
}

/** Settings → Site settings: the company's contact details and system status. Needs settings:manage (Main Admin). */
export default async function AdminSiteSettingsPage() {
  const access = await requirePage("settings:manage");
  if (!access.ok) return access.block;
  const [t, format, db] = await Promise.all([getTranslations("Admin.settings"), getFormatter(), loadDbHealth()]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SiteSettingsForm />

      {/*
        System status for staff. Developer notes (kept out of the UI on purpose):
        - "Not available" = MONGODB_URI is missing from .env.local / the hosting settings.
        - Run `npm run db:setup` once per database to add the schema checks and indexes.
      */}
      <Panel title={t("database.title")} description={t("database.subtitle")}>
        <SettingsRow icon={Activity}>
          <div className="space-y-3 text-sm">
            {db.state === "ok" ? (
              <>
                <p className="inline-flex items-center gap-2 font-medium">
                  <CircleCheck className="size-4 text-[var(--status-confirmed)]" aria-hidden />
                  {t("database.connected")}
                </p>
                <p className="text-muted-foreground">
                  {t("database.counts", { bookings: format.number(db.bookings), reviews: format.number(db.pendingReviews) })}
                </p>
              </>
            ) : db.state === "notConfigured" ? (
              <p className="inline-flex items-start gap-2 font-medium">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--status-pending)]" aria-hidden />
                {t("database.notConfigured")}
              </p>
            ) : (
              <p className="inline-flex items-start gap-2 font-medium">
                <CircleX className="mt-0.5 size-4 shrink-0 text-[var(--status-cancelled)]" aria-hidden />
                {t("database.unavailable")}
              </p>
            )}
          </div>
        </SettingsRow>
      </Panel>
    </div>
  );
}
