"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { bookingsToCsv, lastDay, matchesSearch, type FieldError } from "@/lib/bookings";
import {
  BOOKING_STATUSES, TRIP_TYPES, type Booking, type BookingInput, type BookingStatus, type TripType,
} from "@/lib/types";
import type { DbState } from "@/lib/admin-bookings";
import { PageHeader } from "./page-header";
import { AdminSelect } from "./admin-select";
import { AdminDialog } from "./admin-dialog";
import { DbNotice } from "./admin-dashboard";
import { BookingsTable } from "./bookings-table";
import { BookingEditor } from "./booking-editor";
import { useTripLabel } from "./trip-label";
import { formatDay, rwf } from "./format";

/**
 * Bookings manager — the WhatsApp order log. Admins log each order that comes
 * in on WhatsApp, then move it through Pending → Confirmed → Completed (or
 * Cancelled). Search, filters, sorting and paging all run in the browser; every
 * change is saved through /api/admin/bookings.
 */

type DateFilter = "all" | "upcoming" | "past" | "thisMonth";
const DATE_FILTERS: DateFilter[] = ["all", "upcoming", "past", "thisMonth"];
const PAGE_SIZE = 15;

type Editor = { mode: "new" } | { mode: "edit"; booking: Booking } | null;
type FieldErrors = Partial<Record<keyof BookingInput, FieldError>>;
export type SaveOutcome = { ok: true } | { ok: false; fields?: FieldErrors };

class SessionEnded extends Error {}

/** Admin API call. Throws SessionEnded on 401, an Error with .status otherwise. */
async function api<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    cache: "no-store",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401) throw new SessionEnded();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, data });
  return data as T;
}

function matchesDate(b: Booking, filter: DateFilter, today: string) {
  if (filter === "upcoming") return lastDay(b) >= today;
  if (filter === "past") return lastDay(b) < today;
  if (filter === "thisMonth") return b.startDate.slice(0, 7) === today.slice(0, 7);
  return true;
}

export function BookingsPanel({
  initialBookings,
  dbState,
  today,
  openNew,
  initialStatus,
}: {
  initialBookings: Booking[];
  dbState: DbState;
  today: string;
  openNew: boolean;
  initialStatus: BookingStatus | "all";
}) {
  const t = useTranslations("Admin.bookings");
  const ta = useTranslations("Admin");
  const format = useFormatter();
  const router = useRouter();
  const label = useTripLabel();
  const canEdit = dbState === "ok";

  const [bookings, setBookings] = useState(initialBookings);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all">(initialStatus);
  const [trip, setTrip] = useState<TripType | "all">("all");
  const [when, setWhen] = useState<DateFilter>("all");
  const [newestFirst, setNewestFirst] = useState(true);
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<Editor>(openNew && canEdit ? { mode: "new" } : null);
  const [toDelete, setToDelete] = useState<Booking | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  /* ── filtering ──────────────────────────────────────── */
  const matching = useMemo(
    () => bookings.filter((b) => matchesSearch(b, query) && (trip === "all" || b.tripType === trip) && matchesDate(b, when, today)),
    [bookings, query, trip, when, today],
  );
  const counts = useMemo(() => {
    const c = { all: matching.length } as Record<BookingStatus | "all", number>;
    for (const s of BOOKING_STATUSES) c[s] = matching.filter((b) => b.status === s).length;
    return c;
  }, [matching]);
  const filtered = useMemo(() => {
    const list = matching.filter((b) => status === "all" || b.status === status);
    const dir = newestFirst ? -1 : 1;
    return list.sort((a, b) => dir * (a.startDate.localeCompare(b.startDate) || a.time.localeCompare(b.time)) || b.createdAt - a.createdAt);
  }, [matching, status, newestFirst]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filtersOn = query !== "" || trip !== "all" || when !== "all" || status !== "all";

  // Any filter change starts again from page 1.
  const withReset = <A,>(set: (v: A) => void) => (v: A) => {
    set(v);
    setPage(1);
  };
  const clearFilters = () => {
    setQuery("");
    setTrip("all");
    setWhen("all");
    setStatus("all");
    setPage(1);
  };

  /* ── saving ─────────────────────────────────────────── */
  const sessionEnded = () => {
    toast.error(ta("common.sessionEnded"));
    router.refresh();
  };
  const markBusy = (id: string, on: boolean) =>
    setBusy((b) => {
      const next = { ...b };
      if (on) next[id] = true;
      else delete next[id];
      return next;
    });

  const closeEditor = () => {
    setEditor(null);
    if (openNew) window.history.replaceState(null, "", window.location.pathname); // drop ?new=1
  };

  const save = async (input: BookingInput): Promise<SaveOutcome> => {
    const editing = editor?.mode === "edit" ? editor.booking : null;
    try {
      const { item } = editing
        ? await api<{ item: Booking }>(`/api/admin/bookings/${editing.id}`, "PATCH", input)
        : await api<{ item: Booking }>("/api/admin/bookings", "POST", input);
      setBookings((list) => (editing ? list.map((b) => (b.id === item.id ? item : b)) : [item, ...list]));
      toast.success(editing ? t("toast.updated") : t("toast.created", { name: item.clientName }));
      closeEditor();
      router.refresh(); // sidebar badges and dashboard figures
      return { ok: true };
    } catch (err) {
      if (err instanceof SessionEnded) {
        sessionEnded();
        return { ok: false };
      }
      const { status: code, data } = err as { status?: number; data?: { fields?: FieldErrors } };
      if (code === 422 && data?.fields) return { ok: false, fields: data.fields };
      toast.error(code === 404 ? t("toast.gone") : t("toast.error"));
      return { ok: false };
    }
  };

  const changeStatus = async (booking: Booking, next: BookingStatus) => {
    if (booking.status === next) return;
    markBusy(booking.id, true);
    setBookings((list) => list.map((b) => (b.id === booking.id ? { ...b, status: next } : b))); // show it straight away
    try {
      const { item } = await api<{ item: Booking }>(`/api/admin/bookings/${booking.id}`, "PATCH", { status: next });
      setBookings((list) => list.map((b) => (b.id === item.id ? item : b)));
      toast.success(t("toast.status", { name: booking.clientName, status: ta(`status.${next}`) }));
      router.refresh();
    } catch (err) {
      setBookings((list) => list.map((b) => (b.id === booking.id ? booking : b))); // undo
      if (err instanceof SessionEnded) sessionEnded();
      else toast.error(t("toast.error"));
    } finally {
      markBusy(booking.id, false);
    }
  };

  const remove = async () => {
    const booking = toDelete;
    if (!booking) return;
    setToDelete(null);
    markBusy(booking.id, true);
    try {
      await api(`/api/admin/bookings/${booking.id}`, "DELETE");
      setBookings((list) => list.filter((b) => b.id !== booking.id));
      toast.success(t("toast.deleted"));
      router.refresh();
    } catch (err) {
      if (err instanceof SessionEnded) sessionEnded();
      else toast.error(t("toast.error"));
    } finally {
      markBusy(booking.id, false);
    }
  };

  /* ── export ─────────────────────────────────────────── */
  const exportCsv = () => {
    const csv = bookingsToCsv(filtered, t.raw("csv") as Record<string, string>, {
      tripType: (x) => ta(`tripTypes.${x}`),
      status: (x) => ta(`status.${x}`),
      vehicle: (id) => label.vehicleName(id),
      driver: (withDriver) => ta(withDriver ? "common.withDriver" : "common.selfDrive"),
    });
    // The BOM makes Excel read the file as UTF-8 (accents in names).
    const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `sura-bookings-${today}.csv` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const shownFrom = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const shownTo = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
              <Download aria-hidden />
              {t("export")}
            </Button>
            <Button onClick={() => setEditor({ mode: "new" })} disabled={!canEdit}>
              <Plus aria-hidden />
              {t("new")}
            </Button>
          </>
        }
      />

      {dbState !== "ok" && <DbNotice state={dbState} />}

      <section aria-label={t("tableLabel")} className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
        {/* Search + filters */}
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => withReset(setQuery)(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchLabel")}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:flex">
            <AdminSelect value={trip} onChange={(e) => withReset(setTrip)(e.target.value as TripType | "all")} aria-label={t("filters.trip")} className="lg:w-44">
              <option value="all">{t("filters.allTrips")}</option>
              {TRIP_TYPES.map((x) => (
                <option key={x} value={x}>{ta(`tripTypes.${x}`)}</option>
              ))}
            </AdminSelect>
            <AdminSelect value={when} onChange={(e) => withReset(setWhen)(e.target.value as DateFilter)} aria-label={t("filters.dates")} className="lg:w-40">
              {DATE_FILTERS.map((x) => (
                <option key={x} value={x}>{t(`filters.when.${x}`)}</option>
              ))}
            </AdminSelect>
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-1 overflow-x-auto border-b px-4 py-2.5" role="group" aria-label={t("filters.status")}>
          {(["all", ...BOOKING_STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => withReset(setStatus)(s)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                status === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {s === "all" ? t("filters.allStatuses") : ta(`status.${s}`)}
              <span className="text-xs tabular-nums opacity-80">{format.number(counts[s])}</span>
            </button>
          ))}
        </div>

        {/* Rows */}
        {bookings.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-medium">{t("empty.title")}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{t("empty.body")}</p>
            {canEdit && (
              <Button className="mt-5" onClick={() => setEditor({ mode: "new" })}>
                <Plus aria-hidden />
                {t("new")}
              </Button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-medium">{t("noMatch.title")}</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              {t("noMatch.clear")}
            </Button>
          </div>
        ) : (
          <BookingsTable
            bookings={visible}
            newestFirst={newestFirst}
            onToggleSort={() => setNewestFirst((v) => !v)}
            onEdit={(booking) => setEditor({ mode: "edit", booking })}
            onDelete={setToDelete}
            onStatus={changeStatus}
            busy={busy}
            canEdit={canEdit}
          />
        )}

        {/* Paging */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
            <p aria-live="polite">
              {t("showing", { from: shownFrom, to: shownTo, total: filtered.length })}
              {filtersOn && (
                <>
                  {" · "}
                  <button type="button" onClick={clearFilters} className="font-medium text-primary hover:underline underline-offset-4">
                    {t("noMatch.clear")}
                  </button>
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="tabular-nums">{t("page", { page: currentPage, pages: pageCount })}</span>
              <Button variant="outline" size="icon-sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1} aria-label={t("previous")}>
                <ChevronLeft aria-hidden />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount} aria-label={t("next")}>
                <ChevronRight aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </section>

      <BookingEditor
        open={editor !== null}
        booking={editor?.mode === "edit" ? editor.booking : null}
        today={today}
        onClose={closeEditor}
        onSave={save}
      />

      <AdminDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={t("delete.title")}
        description={
          toDelete
            ? t("delete.body", {
                name: toDelete.clientName,
                date: formatDay(format, toDelete.startDate),
                total: rwf(format, toDelete.grandTotal),
              })
            : undefined
        }
        closeLabel={ta("common.close")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setToDelete(null)}>{ta("common.cancel")}</Button>
            <Button variant="destructive" onClick={() => void remove()}>
              <Trash2 aria-hidden />
              {t("delete.confirm")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">{t("delete.note")}</p>
      </AdminDialog>
    </div>
  );
}

