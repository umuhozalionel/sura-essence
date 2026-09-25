"use client";

import React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ChevronDown, Loader2, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tripDays } from "@/lib/bookings";
import { BOOKING_STATUSES, type Booking, type BookingStatus } from "@/lib/types";
import { STATUS_STYLE, StatusBadge } from "./status-badge";
import { useTripLabel } from "./trip-label";
import { formatTripDates, rwf } from "./format";

type Props = {
  bookings: Booking[];
  newestFirst: boolean;
  onToggleSort: () => void;
  onEdit: (b: Booking) => void;
  onDelete: (b: Booking) => void;
  onStatus: (b: Booking, s: BookingStatus) => void;
  busy: Record<string, boolean>;
  canEdit: boolean;
};

/** The bookings as a table on tablets and desktops, as cards on phones. */
export function BookingsTable(props: Props) {
  const t = useTranslations("Admin.bookings");
  const { bookings, newestFirst, onToggleSort } = props;
  const SortIcon = newestFirst ? ArrowDown : ArrowUp;

  return (
    <>
      {/* ≥ md: table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 pl-4 text-xs font-medium text-muted-foreground">{t("columns.client")}</TableHead>
              <TableHead className="h-11 text-xs font-medium text-muted-foreground">{t("columns.trip")}</TableHead>
              <TableHead className="h-11 text-xs font-medium text-muted-foreground" aria-sort={newestFirst ? "descending" : "ascending"}>
                <button
                  type="button"
                  onClick={onToggleSort}
                  className="-ml-1 inline-flex items-center gap-1 rounded px-1 transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {t("columns.dates")}
                  <SortIcon className="size-3.5" aria-hidden />
                  <span className="sr-only">{t(newestFirst ? "sortedNewest" : "sortedOldest")}</span>
                </button>
              </TableHead>
              <TableHead className="h-11 text-right text-xs font-medium text-muted-foreground">{t("columns.total")}</TableHead>
              <TableHead className="h-11 text-xs font-medium text-muted-foreground">{t("columns.status")}</TableHead>
              <TableHead className="h-11 pr-4 text-right text-xs font-medium text-muted-foreground">
                <span className="sr-only">{t("columns.actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <Row key={b.id} booking={b} {...props} />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* < md: cards */}
      <ul className="divide-y md:hidden">
        {bookings.map((b) => (
          <Card key={b.id} booking={b} {...props} />
        ))}
      </ul>
    </>
  );
}

type ItemProps = Props & { booking: Booking };

function Row({ booking: b, onEdit, onDelete, onStatus, busy, canEdit }: ItemProps) {
  const t = useTranslations("Admin.bookings");
  const format = useFormatter();
  const label = useTripLabel();
  const { trip, detail } = label(b);
  const days = tripDays(b);
  return (
    <TableRow className={cn(busy[b.id] && "opacity-60")}>
      <TableCell className="py-3 pl-4">
        <p className="max-w-[14rem] truncate font-medium">{b.clientName}</p>
        <ClientPhone booking={b} />
      </TableCell>
      <TableCell className="py-3">
        <p className="font-medium">{trip}</p>
        <p className="max-w-[16rem] truncate text-xs text-muted-foreground">
          {[detail, route(b)].filter(Boolean).join(" · ")}
        </p>
      </TableCell>
      <TableCell className="py-3">
        <p>{formatTripDates(format, b.startDate, b.endDate)}</p>
        <p className="text-xs text-muted-foreground">
          {[b.time, days > 1 && t("days", { count: days })].filter(Boolean).join(" · ") || " "}
        </p>
      </TableCell>
      <TableCell className="py-3 text-right font-medium tabular-nums">{rwf(format, b.grandTotal)}</TableCell>
      <TableCell className="py-3">
        {canEdit ? <StatusSelect booking={b} onStatus={onStatus} disabled={busy[b.id]} /> : <StatusBadge status={b.status} />}
      </TableCell>
      <TableCell className="py-3 pr-4 text-right">
        <RowActions booking={b} onEdit={onEdit} onDelete={onDelete} disabled={!canEdit || busy[b.id]} />
      </TableCell>
    </TableRow>
  );
}

function Card({ booking: b, onEdit, onDelete, onStatus, busy, canEdit }: ItemProps) {
  const format = useFormatter();
  const label = useTripLabel();
  const { trip, detail } = label(b);
  return (
    <li className={cn("space-y-3 px-4 py-4", busy[b.id] && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{b.clientName}</p>
          <ClientPhone booking={b} />
        </div>
        <p className="shrink-0 font-semibold tabular-nums">{rwf(format, b.grandTotal)}</p>
      </div>
      <div className="text-sm">
        <p>
          <span className="font-medium">{trip}</span>
          <span className="text-muted-foreground"> · {detail}</span>
        </p>
        <p className="text-muted-foreground">
          {[formatTripDates(format, b.startDate, b.endDate), b.time, route(b)].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        {canEdit ? <StatusSelect booking={b} onStatus={onStatus} disabled={busy[b.id]} /> : <StatusBadge status={b.status} />}
        <RowActions booking={b} onEdit={onEdit} onDelete={onDelete} disabled={!canEdit || busy[b.id]} />
      </div>
    </li>
  );
}

const route = (b: Booking) => [b.pickup, b.destination].filter(Boolean).join(" → ");

/** The number, linked to a WhatsApp chat with the client. */
function ClientPhone({ booking }: { booking: Booking }) {
  const t = useTranslations("Admin.bookings");
  const digits = booking.clientPhone.replace(/\D/g, "");
  if (!booking.clientPhone) return <p className="text-xs text-muted-foreground">—</p>;
  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("openChat", { name: booking.clientName })}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
    >
      <MessageCircle className="size-3" aria-hidden />
      {booking.clientPhone}
    </a>
  );
}

/** Change the status right in the list. Native select: keyboard- and phone-friendly. */
function StatusSelect({
  booking,
  onStatus,
  disabled,
}: {
  booking: Booking;
  onStatus: (b: Booking, s: BookingStatus) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("Admin");
  const { icon: Icon, className } = STATUS_STYLE[booking.status];
  return (
    <div className="relative inline-flex">
      {disabled ? (
        <Loader2 className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
      ) : (
        <Icon className={`pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 ${className}`} aria-hidden />
      )}
      <select
        value={booking.status}
        disabled={disabled}
        onChange={(e) => onStatus(booking, e.target.value as BookingStatus)}
        aria-label={t("bookings.statusFor", { name: booking.clientName })}
        className="h-8 appearance-none rounded-full border bg-background pr-7 pl-7 text-xs font-medium shadow-xs outline-none transition-[color,box-shadow] hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-70"
      >
        {BOOKING_STATUSES.map((s) => (
          <option key={s} value={s}>{t(`status.${s}`)}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  );
}

function RowActions({
  booking,
  onEdit,
  onDelete,
  disabled,
}: {
  booking: Booking;
  onEdit: (b: Booking) => void;
  onDelete: (b: Booking) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("Admin.bookings");
  return (
    <div className="inline-flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={() => onEdit(booking)} disabled={disabled} aria-label={t("edit", { name: booking.clientName })} title={t("editShort")}>
        <Pencil aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onDelete(booking)}
        disabled={disabled}
        aria-label={t("remove", { name: booking.clientName })}
        title={t("removeShort")}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 aria-hidden />
      </Button>
    </div>
  );
}
