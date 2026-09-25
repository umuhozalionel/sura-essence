"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertCircle, Check, CircleCheck, Clock, Loader2, RefreshCw, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminTestimonial } from "@/lib/testimonials-server";
import { PageHeader } from "./page-header";
import { AdminDialog } from "./admin-dialog";

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

/** Testimonials moderation: approve stories for the website, unpublish or delete them. */
export function TestimonialsAdmin() {
  const t = useTranslations("Admin.testimonials");
  const tc = useTranslations("Admin.common");
  const format = useFormatter();
  const router = useRouter();

  const [items, setItems] = useState<AdminTestimonial[] | null>(null);
  const [loadError, setLoadError] = useState<"load" | "notConfigured" | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [busy, setBusy] = useState<Record<string, Busy>>({});
  const [toDelete, setToDelete] = useState<AdminTestimonial | null>(null);

  const sessionEnded = useCallback(() => {
    toast.error(tc("sessionEnded"));
    router.refresh(); // the layout sees no cookie and shows the sign-in form
  }, [router, tc]);

  const apply = useCallback(
    (result: LoadResult) => {
      if ("sessionEnded" in result) return sessionEnded();
      if ("error" in result) setLoadError(result.error);
      else {
        setItems(result.items);
        setLoadError(null);
      }
      setLoading(false);
    },
    [sessionEnded],
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
      router.refresh(); // sidebar badge
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      toast.error(t("actionError"));
    } finally {
      markBusy(item.id, null);
    }
  };

  const remove = async () => {
    const item = toDelete;
    if (!item) return;
    setToDelete(null);
    markBusy(item.id, "delete");
    try {
      await api(`/api/admin/testimonials/${item.id}`, { method: "DELETE" });
      setItems((list) => list?.filter((x) => x.id !== item.id) ?? list);
      toast.success(t("deletedToast"));
      router.refresh();
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      toast.error(t("actionError"));
    } finally {
      markBusy(item.id, null);
    }
  };

  const counts: Record<Filter, number> = {
    pending: items?.filter((i) => i.status === "pending").length ?? 0,
    approved: items?.filter((i) => i.status === "approved").length ?? 0,
    all: items?.length ?? 0,
  };
  const visible = (items ?? []).filter((i) => filter === "all" || i.status === filter);
  const when = (ms: number) => format.dateTime(new Date(ms), { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button variant="outline" onClick={reload} disabled={loading}>
            <RefreshCw className={cn(loading && "animate-spin")} aria-hidden />
            {t("refresh")}
          </Button>
        }
      />

      <section aria-label={t("title")} className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
        {/* Filter */}
        <div className="flex gap-1 overflow-x-auto border-b px-4 py-2.5" role="group" aria-label={t("filterLabel")}>
          {(["pending", "approved", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t(`filters.${f}`)}
              <span className="text-xs tabular-nums opacity-80">{format.number(counts[f])}</span>
            </button>
          ))}
        </div>

        {loadError ? (
          <div role="alert" className="flex flex-wrap items-center gap-3 px-5 py-10 text-sm">
            <AlertCircle className="size-5 text-destructive" aria-hidden />
            {loadError === "notConfigured" ? t("notConfigured") : t("loadError")}
            {loadError === "load" && (
              <Button variant="link" className="h-auto p-0" onClick={reload}>{t("retry")}</Button>
            )}
          </div>
        ) : items === null ? (
          <div className="divide-y" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-4 p-5">
                <div className="size-16 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full max-w-md animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-muted-foreground">{t(`empty.${filter}`)}</p>
        ) : (
          <ul className="divide-y">
            {visible.map((item) => {
              const doing = busy[item.id];
              const pending = item.status === "pending";
              return (
                <li key={item.id} className={cn("p-5", doing === "delete" && "opacity-50")}>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <Photo item={item} label={t("openPhoto", { name: item.name })} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.profession}</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium">
                          {pending ? (
                            <Clock className="size-3.5 text-[var(--status-pending)]" aria-hidden />
                          ) : (
                            <CircleCheck className="size-3.5 text-[var(--status-confirmed)]" aria-hidden />
                          )}
                          {t(`status.${item.status}`)}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("submitted", { date: when(item.createdAt) })}
                        {item.approvedAt ? ` · ${t("published", { date: when(item.approvedAt) })}` : ""}
                        {" · "}
                        {t(`language.${item.locale}`)}
                      </p>

                      <p className="mt-3 max-w-3xl text-sm leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">{item.comment}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {pending ? (
                          <Button size="sm" onClick={() => void setStatus(item, "approved")} disabled={Boolean(doing)}>
                            {doing === "approve" ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
                            {t("approve")}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => void setStatus(item, "pending")} disabled={Boolean(doing)}>
                            {doing === "unpublish" ? <Loader2 className="animate-spin" aria-hidden /> : <Undo2 aria-hidden />}
                            {t("unpublish")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setToDelete(item)}
                          disabled={Boolean(doing)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          {doing === "delete" ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
                          {t("delete")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AdminDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={t("confirmTitle")}
        description={toDelete ? t("confirmDelete", { name: toDelete.name }) : undefined}
        closeLabel={tc("close")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setToDelete(null)}>{tc("cancel")}</Button>
            <Button variant="destructive" onClick={() => void remove()}>
              <Trash2 aria-hidden />
              {t("confirmYes")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">{t("confirmNote")}</p>
      </AdminDialog>
    </div>
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
      <div aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary">
        {initials}
      </div>
    );
  }
  return (
    <a href={item.photoUrl} target="_blank" rel="noopener" aria-label={label} className="shrink-0 self-start">
      {/* The stored Base64 photo, decoded by /api/admin/testimonials/<id>/photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.photoUrl}
        alt=""
        width={64}
        height={64}
        loading="lazy"
        className="size-16 rounded-xl border object-cover transition hover:opacity-90"
      />
    </a>
  );
}
