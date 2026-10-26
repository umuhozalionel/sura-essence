import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Activity, CircleCheck, CircleX, KeyRound, Languages, Palette, TriangleAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { requirePage } from "@/lib/admin-page";
import { can } from "@/lib/admin-rbac";
import { loadDbHealth } from "@/lib/admin-data";
import { cn } from "@/lib/utils";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { ThemePicker } from "@/components/admin/admin-theme";
import { SignOutButton } from "@/components/admin/admin-header";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("settings") };
}

/**
 * Settings — contact details, appearance, language, session and system status.
 * Everyone gets appearance, language and sign-out; contact details and system
 * status need settings:manage (lib/admin-rbac.ts).
 */
export default async function AdminSettingsPage() {
  const access = await requirePage("dashboard:view");
  if (!access.ok) return access.block;
  const manage = can(access.session.role, "settings:manage");
  const [t, format, locale, db] = await Promise.all([
    getTranslations("Admin.settings"),
    getFormatter(),
    getLocale(),
    manage ? loadDbHealth() : null,
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid gap-6 lg:grid-cols-2">
        {manage && <SiteSettingsForm />}

        <Panel title={t("appearance.title")} description={t("appearance.subtitle")}>
          <Row icon={Palette}>
            <ThemePicker />
          </Row>
        </Panel>

        <Panel title={t("language.title")} description={t("language.subtitle")}>
          <Row icon={Languages}>
            <div className="inline-flex rounded-lg border bg-muted p-1">
              {routing.locales.map((l) => (
                <Link
                  key={l}
                  href="/admin/settings"
                  locale={l}
                  aria-current={l === locale ? "true" : undefined}
                  className={cn(
                    "inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    l === locale ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(`language.${l}`)}
                </Link>
              ))}
            </div>
          </Row>
        </Panel>

        <Panel title={t("security.title")} description={t("security.subtitle")}>
          <Row icon={KeyRound}>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("security.body")}</p>
              <SignOutButton />
            </div>
          </Row>
        </Panel>

        {/*
          System status for staff. Developer notes (kept out of the UI on purpose):
          - "Not available" = MONGODB_URI is missing from .env.local / the hosting settings.
          - Run `npm run db:setup` once per database to add the schema checks and indexes.
          - The admin password lives in ADMIN_PASSWORD (+ ADMIN_SESSION_SECRET); see README.md.
        */}
        {db && (
          <Panel title={t("database.title")} description={t("database.subtitle")}>
            <Row icon={Activity}>
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
            </Row>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Row({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">{children}</div>
    </div>
  );
}
