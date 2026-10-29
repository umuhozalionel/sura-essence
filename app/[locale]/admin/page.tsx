import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { CalendarCheck, CarFront, Inbox, Plus, Wallet } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requirePage } from "@/lib/admin-page";
import { bookingBrands, can } from "@/lib/admin-rbac";
import { loadDashboard } from "@/lib/admin-data";
import { getActivePricing } from "@/lib/cms/pricing-config-server";
import { kigaliToday } from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { MetricCard } from "@/components/admin/metric-card";
import {
  ContentShortcuts, DbNotice, RatesSnapshot, RecentBookings, ReviewsCard, StatusBreakdown, UpcomingTrips,
} from "@/components/admin/admin-dashboard";
import { formatDay, rwf } from "@/components/admin/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("dashboard") };
}

/**
 * Dashboard — the day at a glance. Every figure is live: bookings come from
 * the bookings log (MongoDB), reviews from testimonials, rates from the live pricing document.
 *
 * What it shows follows the role (lib/admin-rbac.ts): booking figures and
 * revenue only with bookings:view, rates only with fleet:view, reviews only
 * with testimonials:manage. Roles without bookings get shortcuts to their
 * sections instead, and no booking data is loaded for them at all.
 */
export default async function AdminDashboardPage() {
  const access = await requirePage("dashboard:view");
  if (!access.ok) return access.block;
  const { role } = access.session;

  const [t, format] = await Promise.all([getTranslations("Admin.dashboard"), getFormatter()]);
  const today = kigaliToday();

  if (!can(role, "bookings:view")) {
    const sections = (["experiences", "tours", "tripAlerts"] as const).filter((id) => can(role, `${id}:view`));
    return (
      <div className="space-y-8">
        <PageHeader title={t("title")} description={t("shortcuts.subtitle", { date: formatDay(format, today) })} />
        <ContentShortcuts sections={sections} />
      </div>
    );
  }

  const showRates = can(role, "fleet:view");
  const showReviews = can(role, "testimonials:manage");
  const [{ state, summary, pendingReviews }, rates] = await Promise.all([
    loadDashboard(today, role, showReviews),
    showRates ? getActivePricing().then((p) => p.config) : Promise.resolve(null),
  ]);
  const live = state === "ok";
  const count = (n: number) => (live ? format.number(n) : "—");
  // Someone who sees both brands gets this month's revenue split between them.
  const brands = bookingBrands(role);
  const tb = await getTranslations("Admin.brands");
  const revenueSplit = brands.length > 1
    ? brands.map((b) => `${tb(b)} ${rwf(format, summary.revenueByBrand[b], true)}`).join(" · ")
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("title")}
        description={t("subtitle", { date: formatDay(format, today) })}
        actions={
          can(role, "bookings:create") && (
            <Button asChild>
              <Link href="/admin/bookings?new=1">
                <Plus aria-hidden />
                {t("logBooking")}
              </Link>
            </Button>
          )
        }
      />

      {!live && <DbNotice state={state} />}

      {/* Headline numbers */}
      <section aria-label={t("metrics.label")} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t("metrics.total")}
          value={count(summary.total)}
          hint={live ? t("metrics.totalHint", { count: summary.thisMonth }) : undefined}
          icon={CalendarCheck}
          href="/admin/bookings"
        />
        <MetricCard
          label={t("metrics.revenue")}
          value={live ? rwf(format, summary.revenueMonth, true) : "—"}
          hint={
            live
              ? [revenueSplit, t("metrics.revenueHint", { amount: rwf(format, summary.confirmedValue, true) })].filter(Boolean).join(" · ")
              : undefined
          }
          icon={Wallet}
        />
        <MetricCard
          label={t("metrics.active")}
          value={count(summary.activeToday)}
          hint={live ? t("metrics.activeHint", { count: summary.startingThisWeek }) : undefined}
          icon={CarFront}
        />
        <MetricCard
          label={t("metrics.pending")}
          value={count(summary.pending)}
          hint={
            [
              live && summary.awaitingQuote > 0 ? t("metrics.awaitingQuote", { count: summary.awaitingQuote }) : null,
              pendingReviews === null ? null : t("metrics.pendingHint", { count: pendingReviews }),
            ].filter(Boolean).join(" · ") || undefined
          }
          icon={Inbox}
          href="/admin/bookings?status=pending"
        />
      </section>

      {/* What needs attention */}
      <div className="grid gap-6 xl:grid-cols-3">
        <RecentBookings bookings={summary.recent} className="xl:col-span-2" />
        <UpcomingTrips bookings={summary.upcoming} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatusBreakdown byStatus={summary.byStatus} total={summary.total} />
        {rates && <RatesSnapshot cfg={rates} />}
        {showReviews && <ReviewsCard pending={pendingReviews} />}
      </div>
    </div>
  );
}
