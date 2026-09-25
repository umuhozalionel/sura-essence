"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertCircle, Check, Clock, Loader2, RefreshCw, Trash2, Undo2 } from "lucide-react";
import type { AdminTestimonial } from "@/lib/testimonials-server";

type Filter = "pending" | "approved" | "all";
type Busy = "approve" | "unpublish" | "delete";

/** Admin-only calls. A 401 means the session ended (expired, or password changed). */
class SessionEnded extends Error {}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (res.status === 401) throw new SessionEnded();
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  return (await res.json()) as T;
}

type LoadResult =
  | { items: AdminTestimonial[] }
  | { error: "load" | "notConfigured" }
  | { sessionEnded: true };

async function fetchAll(): Promise<LoadResult> {
  try {
    return await api<{ items: AdminTestimonial[] }>("/api/admin/testimonials");
  } catch (err) {
    if (err instanceof SessionEnded) return { sessionEnded: true };
    return { error: (err as { status?: number }).status === 503 ? "notConfigured" : "load" };
  }
}

export function TestimonialsAdmin({
  onPendingCount,
  onSessionEnded,
}: {
  onPendingCount: (n: number) => void;
  onSessionEnded: () => void;
}) {
  const t = useTranslations("Admin.testimonials");
  const format = useFormatter();

  const [items, setItems] = useState<AdminTestimonial[] | null>(null);
  const [loadError, setLoadError] = useState<"load" | "notConfigured" | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [busy, setBusy] = useState<Record<string, Busy>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const apply = useCallback(
    (result: LoadResult) => {
      if ("sessionEnded" in result) return onSessionEnded();
      if ("error" in result) setLoadError(result.error);
      else {
        setItems(result.items);
        setLoadError(null);
      }
      setLoading(false);
    },
    [onSessionEnded],
  );

  useEffect(() => {
    let live = true;
    void fetchAll().then((result) => {
      if (live) apply(result);
    });
    return () => {
      live = false;
    };
  }, [apply]);

  const reload = () => {
    setLoading(true);
    void fetchAll().then(apply);
  };

  const pendingCount = items?.filter((i) => i.status === "pending").length ?? 0;
  useEffect(() => {
    if (items) onPendingCount(pendingCount);
  }, [items, pendingCount, onPendingCount]);

  const markBusy = (id: string, what: Busy | null) =>
    setBusy((b) => {
      const next = { ...b };
      if (what) next[id] = what;
      else delete next[id];
      return next;
    });

  const setStatus = async (item: AdminTestimonial, status: "approved" | "pending") => {
    markBusy(item.id, status === "approved" ? "approve" : "unpublish");
    try {
      const { item: updated } = await api<{ item: AdminTestimonial }>(`/api/admin/testimonials/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setItems((list) => list?.map((x) => (x.id === updated.id ? updated : x)) ?? list);
      toast.success(status === "approved" ? t("approvedToast") : t("unpublishedToast"));
    } catch (err) {
      if (err instanceof SessionEnded) return onSessionEnded();
      toast.error(t("actionError"));
    } finally {
      markBusy(item.id, null);
    }
  };

  const remove = async (item: AdminTestimonial) => {
    setConfirmId(null);
    markBusy(item.id, "delete");
    try {
      await api(`/api/admin/testimonials/${item.id}`, { method: "DELETE" });
      setItems((list) => list?.filter((x) => x.id !== item.id) ?? list);
      toast.success(t("deletedToast"));
    } catch (err) {
      if (err instanceof SessionEnded) return onSessionEnded();
      toast.error(t("actionError"));
    } finally {
      markBusy(item.id, null);
    }
  };

  const counts: Record<Filter, number> = {
    pending: pendingCount,
    approved: items?.filter((i) => i.status === "approved").length ?? 0,
    all: items?.length ?? 0,
  };
  const visible = (items ?? []).filter((i) => filter === "all" || i.status === filter);
  const when = (ms: number) => format.dateTime(new Date(ms), { dateStyle: "medium", timeStyle: "short" });

  return (
    <section aria-labelledby="admin-testimonials-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="admin-testimonials-title" className="text-xl font-extrabold tracking-tight text-[#0A1128]">{t("title")}</h2>
          <p className="mt-1 max-w-xl text-sm font-medium text-[#0A1128]/60">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#0A1128] ring-1 ring-[#0A1128]/10 transition hover:ring-[#125740] disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
          {t("refresh")}
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label={t("title")}>
        {(["pending", "approved", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-bold transition ${
              filter === f ? "bg-[#125740] text-white" : "bg-white text-[#0A1128]/70 ring-1 ring-[#0A1128]/10 hover:text-[#0A1128]"
            }`}
          >
            {t(`filters.${f}`)}
            <span className={`tabular-nums ${filter === f ? "text-white/80" : "text-[#0A1128]/60"}`}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {loadError ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-6 text-sm font-semibold text-[#0A1128]/70 ring-1 ring-[#0A1128]/10">
          <AlertCircle className="h-5 w-5 text-[#B42318]" aria-hidden />
          {loadError === "notConfigured" ? t("notConfigured") : t("loadError")}
          {loadError === "load" && (
            <button type="button" onClick={reload} className="font-bold text-[#125740] underline underline-offset-4">
              {t("retry")}
            </button>
          )}
        </div>
      ) : items === null ? (
        <div className="space-y-4" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-[#0A1128]/[0.06]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl bg-white p-10 text-center text-sm font-semibold text-[#0A1128]/60 ring-1 ring-[#0A1128]/[0.06]">
          {t(`empty.${filter}`)}
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map((item) => {
            const doing = busy[item.id];
            const pending = item.status === "pending";
            return (
              <li
                key={item.id}
                className={`rounded-2xl bg-white p-5 ring-1 transition md:p-6 ${
                  pending ? "ring-[#EAB308]/50" : "ring-[#0A1128]/[0.06]"
                } ${doing === "delete" ? "opacity-50" : ""}`}
              >
                <div className="flex flex-col gap-5 sm:flex-row">
                  <Photo item={item} label={t("openPhoto", { name: item.name })} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-extrabold tracking-tight text-[#0A1128]">{item.name}</p>
                        <p className="text-sm font-semibold text-[#125740]">{item.profession}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                          pending ? "bg-[#EAB308] text-[#0A1128]" : "bg-[#125740] text-white"
                        }`}
                      >
                        {pending ? <Clock className="h-3 w-3" aria-hidden /> : <Check className="h-3 w-3" aria-hidden />}
                        {t(`status.${item.status}`)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs font-medium text-[#0A1128]/60">
                      {t("submitted", { date: when(item.createdAt) })}
                      {item.approvedAt ? ` · ${t("published", { date: when(item.approvedAt) })}` : ""}
                      {" · "}
                      {t(`language.${item.locale}`)}
                    </p>

                    <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-[#0A1128]/85 [overflow-wrap:anywhere]">
                      {item.comment}
                    </p>

                    {/* Actions */}
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      {confirmId === item.id ? (
                        <>
                          <span className="mr-1 text-sm font-bold text-[#B42318]">{t("confirmDelete")}</span>
                          <button
                            type="button"
                            onClick={() => void remove(item)}
                            className="inline-flex h-9 items-center gap-2 rounded-full bg-[#B42318] px-4 text-sm font-bold text-white transition hover:bg-[#912018]"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                            {t("confirmYes")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="inline-flex h-9 items-center rounded-full px-4 text-sm font-bold text-[#0A1128]/70 hover:bg-[#0A1128]/5"
                          >
                            {t("cancel")}
                          </button>
                        </>
                      ) : (
                        <>
                          {pending ? (
                            <button
                              type="button"
                              onClick={() => void setStatus(item, "approved")}
                              disabled={Boolean(doing)}
                              className="inline-flex h-9 items-center gap-2 rounded-full bg-[#125740] px-4 text-sm font-bold text-white transition hover:bg-[#0E4231] disabled:opacity-60"
                            >
                              {doing === "approve" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                              {t("approve")}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void setStatus(item, "pending")}
                              disabled={Boolean(doing)}
                              className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#0A1128] ring-1 ring-[#0A1128]/15 transition hover:ring-[#0A1128]/40 disabled:opacity-60"
                            >
                              {doing === "unpublish" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Undo2 className="h-4 w-4" aria-hidden />}
                              {t("unpublish")}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmId(item.id)}
                            disabled={Boolean(doing)}
                            className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-bold text-[#B42318] ring-1 ring-[#B42318]/30 transition hover:bg-[#B42318]/[0.06] disabled:opacity-60"
                          >
                            {doing === "delete" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
                            {t("delete")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Photo({ item, label }: { item: AdminTestimonial; label: string }) {
  const initials = item.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => Array.from(p)[0]?.toUpperCase() ?? "")
    .join("");

  if (!item.photoUrl) {
    return (
      <div aria-hidden className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#125740] text-2xl font-black text-white">
        {initials}
      </div>
    );
  }
  return (
    <a href={item.photoUrl} target="_blank" rel="noopener" aria-label={label} className="shrink-0">
      {/* The stored Base64 photo, decoded by /api/admin/testimonials/<id>/photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.photoUrl}
        alt=""
        width={96}
        height={96}
        loading="lazy"
        className="h-24 w-24 rounded-2xl object-cover ring-1 ring-black/5 transition hover:opacity-90"
      />
    </a>
  );
}
