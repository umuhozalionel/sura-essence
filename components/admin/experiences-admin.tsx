"use client";

import React, { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Archive, Eye, EyeOff, Loader2, Pencil, Plus, RefreshCw, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { kigaliToday } from "@/lib/bookings";
import { experienceWhen, type AdminExperience, type ExperienceStatus } from "@/lib/cms/experiences";
import { PageHeader } from "./page-header";
import { formatTripDates } from "./format";
import { ExperienceEditor } from "./experience-editor";
import {
  ConfirmDelete, EmptyRow, FilterChips, ListSkeleton, LoadErrorRow, MediaThumb, SessionEnded, StatusPill,
  cmsApi, jsonInit, useAdminList, useBusy,
} from "./cms/kit";

const FILTERS = ["all", "upcoming", "past", "draft", "archived"] as const;
type Filter = (typeof FILTERS)[number];
type Busy = "status" | "featured" | "delete";

/** Experiences: every trip (events, past events, seasons, gallery) in one list. */
export function ExperiencesAdmin() {
  const t = useTranslations("Admin.experiences");
  const tc = useTranslations("Admin.cms");
  const format = useFormatter();
  const { items, setItems, loadError, loading, reload, sessionEnded } = useAdminList<AdminExperience>("/api/admin/experiences");
  const [busy, markBusy] = useBusy<Busy>();
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<AdminExperience | "new" | null>(null);
  const [toDelete, setToDelete] = useState<AdminExperience | null>(null);

  const today = kigaliToday();
  const whenOf = (e: AdminExperience) => experienceWhen(e.schedule, today);
  const matches = (e: AdminExperience, f: Filter) =>
    f === "all" ? true
    : f === "draft" || f === "archived" ? e.status === f
    : e.status === "published" && whenOf(e) === f;

  const all = items ?? [];
  const counts = Object.fromEntries(FILTERS.map((f) => [f, all.filter((e) => matches(e, f)).length])) as Record<Filter, number>;
  const visible = all.filter((e) => matches(e, filter));

  const replace = (e: AdminExperience) => setItems((l) => (l ?? []).map((x) => (x.id === e.id ? e : x)));

  const patch = async (e: AdminExperience, body: { status?: ExperienceStatus; featured?: boolean }, what: Busy, done: string) => {
    markBusy(e.id, what);
    try {
      const { item } = await cmsApi<{ item: AdminExperience }>(`/api/admin/experiences/${e.id}`, jsonInit("PATCH", body));
      replace(item);
      toast.success(done);
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      toast.error(tc("actionError"));
    } finally {
      markBusy(e.id, null);
    }
  };

  const remove = async () => {
    const e = toDelete;
    if (!e) return;
    setToDelete(null);
    markBusy(e.id, "delete");
    try {
      await cmsApi(`/api/admin/experiences/${e.id}`, { method: "DELETE" });
      setItems((l) => (l ?? []).filter((x) => x.id !== e.id));
      toast.success(tc("deletedToast"));
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      toast.error(tc("actionError"));
    } finally {
      markBusy(e.id, null);
    }
  };

  const dateLine = (e: AdminExperience) => {
    const s = e.schedule;
    if (s.precision === "tba" || (!s.startDate && !s.month)) return t("dateTba");
    if (s.precision === "month" && s.month) return format.dateTime(new Date(`${s.month}-01T00:00:00Z`), { month: "long", year: "numeric", timeZone: "UTC" });
    return s.startDate ? formatTripDates(format, s.startDate, s.endDate) : t("dateTba");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={reload} disabled={loading}>
              <RefreshCw className={cn(loading && "animate-spin")} aria-hidden />
              {tc("refresh")}
            </Button>
            <Button onClick={() => setEditing("new")} disabled={Boolean(loadError) || items === null}>
              <Plus aria-hidden />
              {t("add")}
            </Button>
          </>
        }
      />

      <section aria-label={t("title")} className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
        <FilterChips
          filters={FILTERS}
          value={filter}
          onChange={setFilter}
          counts={counts}
          label={tc("filterLabel")}
          labelFor={(f) => t(`filters.${f}`)}
          format={(n) => format.number(n)}
        />

        {loadError ? (
          <LoadErrorRow kind={loadError} onRetry={reload} />
        ) : items === null ? (
          <ListSkeleton />
        ) : visible.length === 0 ? (
          <EmptyRow>{t(`empty.${filter}`)}</EmptyRow>
        ) : (
          <ul className="divide-y">
            {visible.map((e) => {
              const doing = busy[e.id];
              const published = e.status === "published";
              const when = whenOf(e);
              return (
                <li key={e.id} className={cn("flex flex-col gap-4 p-5 sm:flex-row", doing === "delete" && "opacity-50")}>
                  <MediaThumb src={e.media.cover} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-semibold">
                          {e.title.en}
                          {e.featured && <Star className="size-4 fill-current text-primary" aria-label={t("featured")} />}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {dateLine(e)} · {e.location.name.en}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {published ? (
                          <StatusPill tone={when === "upcoming" ? "live" : "muted"}>{t(`when.${when}`)}</StatusPill>
                        ) : (
                          <StatusPill tone={e.status === "draft" ? "draft" : "muted"}>{tc(`status.${e.status}`)}</StatusPill>
                        )}
                        <StatusPill tone="muted">{t(`availability.${e.availability}`)}</StatusPill>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      /{e.slug}
                      {e.pricing.tiers.length > 0 && ` · ${t("tierCount", { count: e.pricing.tiers.length })}`}
                      {e.media.gallery.length > 0 && ` · ${t("photoCount", { count: e.media.gallery.length })}`}
                      {!e.title.fr && ` · ${tc("frenchMissing")}`}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(e)} disabled={Boolean(doing)}>
                        <Pencil aria-hidden />
                        {tc("edit")}
                      </Button>
                      {published ? (
                        <Button size="sm" variant="outline" onClick={() => void patch(e, { status: "draft" }, "status", t("unpublishedToast"))} disabled={Boolean(doing)}>
                          {doing === "status" ? <Loader2 className="animate-spin" aria-hidden /> : <EyeOff aria-hidden />}
                          {tc("unpublish")}
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => void patch(e, { status: "published" }, "status", t("publishedToast"))} disabled={Boolean(doing)}>
                          {doing === "status" ? <Loader2 className="animate-spin" aria-hidden /> : <Eye aria-hidden />}
                          {tc("publish")}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => void patch(e, { featured: !e.featured }, "featured", e.featured ? t("unfeaturedToast") : t("featuredToast"))} disabled={Boolean(doing)}>
                        {doing === "featured" ? <Loader2 className="animate-spin" aria-hidden /> : <Star aria-hidden />}
                        {e.featured ? t("unfeature") : t("feature")}
                      </Button>
                      {e.status !== "archived" && (
                        <Button size="sm" variant="ghost" onClick={() => void patch(e, { status: "archived" }, "status", t("archivedToast"))} disabled={Boolean(doing)}>
                          <Archive aria-hidden />
                          {tc("archive")}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setToDelete(e)} disabled={Boolean(doing)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        {doing === "delete" ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
                        {tc("delete")}
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editing && (
        <ExperienceEditor
          existing={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(item, isNew) => {
            setItems((l) => (isNew ? [item, ...(l ?? [])] : (l ?? []).map((x) => (x.id === item.id ? item : x))));
            setEditing(null);
            toast.success(isNew ? tc("createdToast") : tc("savedToast"));
          }}
          onSessionEnded={sessionEnded}
        />
      )}

      <ConfirmDelete open={toDelete !== null} name={toDelete?.title.en ?? ""} onCancel={() => setToDelete(null)} onConfirm={() => void remove()} />
    </div>
  );
}
