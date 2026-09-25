import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { CircleCheck, CircleX, Database, KeyRound, Languages, Palette, TriangleAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { isAdmin } from "@/lib/admin-auth";
import { loadDbHealth } from "@/lib/admin-data";
import { cn } from "@/lib/utils";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { SessionGuard } from "@/components/admin/session-guard";
import { ThemePicker } from "@/components/admin/admin-theme";
import { SignOutButton } from "@/components/admin/admin-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("settings") };
}

/** Settings — appearance, language, session and a database health check. */
export default async function AdminSettingsPage() {
  if (!(await isAdmin())) return <SessionGuard />;
  const [t, format, locale, db] = await Promise.all([
    getTranslations("Admin.settings"),
    getFormatter(),
    getLocale(),
    loadDbHealth(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid gap-6 lg:grid-cols-2">
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

        <Panel title={t("database.title")} description={t("database.subtitle")}>
          <Row icon={Database}>
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
              <p className="text-muted-foreground">{t("database.setupTip")}</p>
            </div>
          </Row>
        </Panel>
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
