import React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { AlertTriangle, ArrowRight, MessageSquareQuote } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  CAB_FARES, CURRENT_FUEL_PRICE_RWF, PROFIT_MARGIN, SERVICE_FEE_PER_DAY, VEHICLES,
} from "@/lib/pricing";
import { BOOKING_STATUSES, type Booking, type BookingStatus } from "@/lib/types";
import type { DbState } from "@/lib/admin-bookings";
import { Panel } from "./page-header";
import { StatusBadge, STATUS_STYLE } from "./status-badge";
import { formatTripDates, rwf } from "./format";
import { useTripLabel } from "./trip-label";

/*
 * The dashboard's panels. Plain components (no "use client"), so they render
 * on the server with the page and ship no JavaScript.
 */

/** Explains why the numbers are empty when the database is missing or down. */
export function DbNotice({ state }: { state: Exclude<DbState, "ok"> }) {
  const t = useTranslations("Admin.common");
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-[var(--status-pending)]/40 bg-card p-4 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--status-pending)]" aria-hidden />
      <p>{t(state === "notConfigured" ? "dbNotConfigured" : "dbUnavailable")}</p>
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline underline-offset-4">
      {label}
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

export function RecentBookings({ bookings, className = "" }: { bookings: Booking[]; className?: string }) {
  const t = useTranslations("Admin.dashboard");
  const format = useFormatter();
  const label = useTripLabel();
  return (
    <Panel
      title={t("recent.title")}
      description={t("recent.subtitle")}
      action={<ViewAll href="/admin/bookings" label={t("viewAll")} />}
      className={className}
      bodyClassName=""
    >
      {bookings.length === 0 ? (
        <EmptyLine>{t("recent.empty")}</EmptyLine>
      ) : (
        <ul className="divide-y">
          {bookings.map((b) => {
            const { trip, detail } = label(b);
            return (
              <li key={b.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_11rem_8rem_7.5rem]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{b.clientName}</p>
                  <p className="truncate text-xs text-muted-foreground">{trip} · {detail}</p>
                </div>
                <p className="hidden text-sm text-muted-foreground sm:block">{formatTripDates(format, b.startDate, b.endDate)}</p>
                <p className="text-right text-sm font-medium tabular-nums">{rwf(format, b.grandTotal)}</p>
                <div className="col-start-2 row-start-2 justify-self-end sm:col-start-auto sm:row-start-auto">
                  <StatusBadge status={b.status} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function UpcomingTrips({ bookings }: { bookings: Booking[] }) {
  const t = useTranslations("Admin.dashboard");
  const format = useFormatter();
  const label = useTripLabel();
  return (
    <Panel title={t("upcoming.title")} description={t("upcoming.subtitle")} bodyClassName="">
      {bookings.length === 0 ? (
        <EmptyLine>{t("upcoming.empty")}</EmptyLine>
      ) : (
        <ul className="divide-y">
          {bookings.map((b) => {
            const { trip } = label(b);
            const [day, month] = [
              format.dateTime(new Date(`${b.startDate}T00:00:00Z`), { day: "numeric", timeZone: "UTC" }),
              format.dateTime(new Date(`${b.startDate}T00:00:00Z`), { month: "short", timeZone: "UTC" }),
            ];
            return (
              <li key={b.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg border bg-background leading-none" aria-hidden>
                  <span className="text-base font-semibold">{day}</span>
                  <span className="mt-0.5 text-[10px] font-medium uppercase text-muted-foreground">{month}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.clientName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="sr-only">{formatTripDates(format, b.startDate, b.endDate)} · </span>
                    {[trip, b.time, b.destination].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/** Counts per status with a thin bar each (one hue; the numbers are printed, so the bars only help scanning). */
export function StatusBreakdown({ byStatus, total }: { byStatus: Record<BookingStatus, number>; total: number }) {
  const t = useTranslations("Admin");
  const format = useFormatter();
  const max = Math.max(1, ...Object.values(byStatus));
  return (
    <Panel title={t("dashboard.statusMix.title")} description={t("dashboard.statusMix.subtitle", { count: total })}>
      <ul className="space-y-3.5">
        {BOOKING_STATUSES.map((status) => {
          const { icon: Icon, className } = STATUS_STYLE[status];
          const count = byStatus[status];
          return (
            <li key={status}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-2">
                  <Icon className={`size-4 ${className}`} aria-hidden />
                  {t(`status.${status}`)}
                </span>
                <span className="font-medium tabular-nums">{format.number(count)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${(count / max) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** Headline rates straight from lib/pricing.ts. */
export function RatesSnapshot() {
  const t = useTranslations("Admin.dashboard.rates");
  const format = useFormatter();
  const cheapestAirport = Math.min(...VEHICLES.map((v) => v.airportRate));
  const rows: [string, string][] = [
    [t("fuel"), `${rwf(format, CURRENT_FUEL_PRICE_RWF)} / L`],
    [t("serviceKigali"), t("perDay", { amount: rwf(format, SERVICE_FEE_PER_DAY.kigali) })],
    [t("serviceOutside"), t("perDay", { amount: rwf(format, SERVICE_FEE_PER_DAY.outside) })],
    [t("margin"), format.number(PROFIT_MARGIN, { style: "percent" })],
    [t("airportFrom"), rwf(format, cheapestAirport)],
    [t("cabFrom"), rwf(format, CAB_FARES.standard.base)],
  ];
  return (
    <Panel title={t("title")} description={t("subtitle")} action={<ViewAll href="/admin/fleet" label={t("link")} />}>
      <dl className="divide-y text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

export function ReviewsCard({ pending }: { pending: number | null }) {
  const t = useTranslations("Admin.dashboard.reviews");
  const format = useFormatter();
  return (
    <Panel title={t("title")} description={t("subtitle")} action={<ViewAll href="/admin/testimonials" label={t("link")} />}>
      <div className="flex items-center gap-4">
        <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden>
          <MessageSquareQuote className="size-5" />
        </span>
        <div>
          <p className="text-2xl font-semibold tracking-tight">{pending === null ? "—" : format.number(pending)}</p>
          <p className="text-sm text-muted-foreground">{t("waiting", { count: pending ?? 0 })}</p>
        </div>
      </div>
    </Panel>
  );
}

