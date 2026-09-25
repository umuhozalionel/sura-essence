import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { CalendarCheck, CarFront, Inbox, Plus, Wallet } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { loadDashboard } from "@/lib/admin-data";
import { kigaliToday } from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { MetricCard } from "@/components/admin/metric-card";
import { SessionGuard } from "@/components/admin/session-guard";
import {
  DbNotice, RatesSnapshot, RecentBookings, ReviewsCard, StatusBreakdown, UpcomingTrips,
} from "@/components/admin/admin-dashboard";
import { formatDay, rwf } from "@/components/admin/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("dashboard") };
}

/**
 * Dashboard — the day at a glance. Every figure is live: bookings come from
 * the bookings log (MongoDB), reviews from testimonials, rates from lib/pricing.ts.
 */
export default async function AdminDashboardPage() {
  if (!(await isAdmin())) return <SessionGuard />;

  const [t, format] = await Promise.all([getTranslations("Admin.dashboard"), getFormatter()]);
  const today = kigaliToday();
  const { state, summary, pendingReviews } = await loadDashboard(today);
  const live = state === "ok";
  const count = (n: number) => (live ? format.number(n) : "—");

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("title")}
        description={t("subtitle", { date: formatDay(format, today) })}
        actions={
          <Button asChild>
            <Link href="/admin/bookings?new=1">
              <Plus aria-hidden />
              {t("logBooking")}
            </Link>
          </Button>
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
          hint={live ? t("metrics.revenueHint", { amount: rwf(format, summary.confirmedValue, true) }) : undefined}
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
          hint={pendingReviews === null ? undefined : t("metrics.pendingHint", { count: pendingReviews })}
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
        <RatesSnapshot />
        <ReviewsCard pending={pendingReviews} />
      </div>
    </div>
  );
}
