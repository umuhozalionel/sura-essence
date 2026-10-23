"use client";

import React, { useId, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Archive, Eye, EyeOff, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CmsLocale } from "@/lib/cms/localized";
import { ALERT_LIMITS, ALERT_STATUSES, type AdminTripAlert, type AlertStatus, type TripAlertInput } from "@/lib/cms/trip-alerts";
import { PageHeader } from "./page-header";
import { AdminDialog } from "./admin-dialog";
import { AdminSelect } from "./admin-select";
import { formatDay } from "./format";
import {
  CheckRow, ConfirmDelete, EmptyRow, Field, FilterChips, FormError, FormSection, LangSwitch, ListSkeleton, LoadErrorRow,
  RepeatCard, SaveButton, SessionEnded, StatusPill, cmsApi, jsonInit, moveItem, removeAt, useAdminList, useApiErrors, useBusy,
} from "./cms/kit";

const FILTERS = ["all", "published", "draft", "archived"] as const;
type Filter = (typeof FILTERS)[number];
type Busy = "status" | "urgent" | "delete";

/** Trip alerts: travel notices for the Trip alerts page. */
export function TripAlertsAdmin() {
  const t = useTranslations("Admin.tripAlerts");
  const tc = useTranslations("Admin.cms");
  const format = useFormatter();
  const { items, setItems, loadError, loading, reload, sessionEnded } = useAdminList<AdminTripAlert>("/api/admin/trip-alerts");
  const [busy, markBusy] = useBusy<Busy>();
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<AdminTripAlert | "new" | null>(null);
  const [toDelete, setToDelete] = useState<AdminTripAlert | null>(null);

  const all = items ?? [];
  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === "all" ? all.length : all.filter((a) => a.status === f).length])) as Record<Filter, number>;
  const visible = all.filter((a) => filter === "all" || a.status === filter);

  const patch = async (a: AdminTripAlert, body: { status?: AlertStatus; urgent?: boolean }, what: Busy, done: string) => {
    markBusy(a.id, what);
    try {
      const { item } = await cmsApi<{ item: AdminTripAlert }>(`/api/admin/trip-alerts/${a.id}`, jsonInit("PATCH", body));
      setItems((l) => (l ?? []).map((x) => (x.id === item.id ? item : x)));
      toast.success(done);
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      toast.error(tc("actionError"));
    } finally {
      markBusy(a.id, null);
    }
  };

  const remove = async () => {
    const a = toDelete;
    if (!a) return;
    setToDelete(null);
    markBusy(a.id, "delete");
    try {
      await cmsApi(`/api/admin/trip-alerts/${a.id}`, { method: "DELETE" });
      setItems((l) => (l ?? []).filter((x) => x.id !== a.id));
      toast.success(tc("deletedToast"));
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      toast.error(tc("actionError"));
    } finally {
      markBusy(a.id, null);
    }
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
        <FilterChips filters={FILTERS} value={filter} onChange={setFilter} counts={counts} label={tc("filterLabel")}
          labelFor={(f) => (f === "all" ? t("filters.all") : tc(`status.${f}`))} format={(n) => format.number(n)} />

        {loadError ? (
          <LoadErrorRow kind={loadError} onRetry={reload} />
        ) : items === null ? (
          <ListSkeleton />
        ) : visible.length === 0 ? (
          <EmptyRow>{t(`empty.${filter}`)}</EmptyRow>
        ) : (
          <ul className="divide-y">
            {visible.map((a) => {
              const doing = busy[a.id];
              const published = a.status === "published";
              return (
                <li key={a.id} className={cn("p-5", doing === "delete" && "opacity-50")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold">
                        {a.urgent && <AlertTriangle className="size-4 shrink-0 text-destructive" aria-label={t("urgent")} />}
                        {a.title.en}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDay(format, a.date)} · /{a.slug} · {t("sourceCount", { count: a.sources.length })}
                        {!a.title.fr && ` · ${tc("frenchMissing")}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {a.urgent && <StatusPill tone="warning">{t("urgent")}</StatusPill>}
                      <StatusPill tone={published ? "live" : a.status === "draft" ? "draft" : "muted"}>{tc(`status.${a.status}`)}</StatusPill>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 max-w-3xl text-sm text-muted-foreground">{a.content.en}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(a)} disabled={Boolean(doing)}>
                      <Pencil aria-hidden />
                      {tc("edit")}
                    </Button>
                    {published ? (
                      <Button size="sm" variant="outline" onClick={() => void patch(a, { status: "draft" }, "status", tc("unpublishedToast"))} disabled={Boolean(doing)}>
                        {doing === "status" ? <Loader2 className="animate-spin" aria-hidden /> : <EyeOff aria-hidden />}
                        {tc("unpublish")}
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => void patch(a, { status: "published" }, "status", tc("publishedToast"))} disabled={Boolean(doing)}>
                        {doing === "status" ? <Loader2 className="animate-spin" aria-hidden /> : <Eye aria-hidden />}
                        {tc("publish")}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => void patch(a, { urgent: !a.urgent }, "urgent", a.urgent ? t("notUrgentToast") : t("urgentToast"))} disabled={Boolean(doing)}>
                      {doing === "urgent" ? <Loader2 className="animate-spin" aria-hidden /> : <AlertTriangle aria-hidden />}
                      {a.urgent ? t("markNotUrgent") : t("markUrgent")}
                    </Button>
                    {a.status !== "archived" && (
                      <Button size="sm" variant="ghost" onClick={() => void patch(a, { status: "archived" }, "status", tc("archivedToast"))} disabled={Boolean(doing)}>
                        <Archive aria-hidden />
                        {tc("archive")}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setToDelete(a)} disabled={Boolean(doing)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 aria-hidden />
                      {tc("delete")}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editing && (
        <AlertEditor
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

const EMPTY_L = { en: "", fr: "" };

function AlertEditor({ existing, onClose, onSaved, onSessionEnded }: {
  existing: AdminTripAlert | null;
  onClose: () => void;
  onSaved: (item: AdminTripAlert, isNew: boolean) => void;
  onSessionEnded: () => void;
}) {
  const t = useTranslations("Admin.tripAlerts");
  const tc = useTranslations("Admin.cms");
  const tcom = useTranslations("Admin.common");
  const formId = useId();
  const toErrors = useApiErrors();
  const [draft, setDraft] = useState<TripAlertInput>(() =>
    existing
      ? { slug: existing.slug, status: existing.status, date: existing.date, urgent: existing.urgent, title: { ...existing.title }, content: { ...existing.content }, sources: structuredClone(existing.sources) }
      : { slug: "", status: "draft", date: new Date().toISOString().slice(0, 10), urgent: false, title: { ...EMPTY_L }, content: { ...EMPTY_L }, sources: [] },
  );
  const [lang, setLang] = useState<CmsLocale>("en");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const flagged = (["en", "fr"] as CmsLocale[]).filter((l) => Object.keys(errors).some((k) => k.endsWith(`.${l}`)));
  const set = (patch: Partial<TripAlertInput>) => setDraft((d) => ({ ...d, ...patch }));
  const setSource = (i: number, patch: Partial<TripAlertInput["sources"][number]>) =>
    setDraft((d) => ({ ...d, sources: d.sources.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBanner(null);
    setErrors({});
    setSaving(true);
    try {
      const { item } = await cmsApi<{ item: AdminTripAlert }>(
        existing ? `/api/admin/trip-alerts/${existing.id}` : "/api/admin/trip-alerts",
        jsonInit(existing ? "PUT" : "POST", draft),
      );
      onSaved(item, !existing);
    } catch (err) {
      if (err instanceof SessionEnded) return onSessionEnded();
      const f = toErrors(err);
      setErrors(f.fields);
      setBanner(f.banner);
      if (f.lang) setLang(f.lang);
    } finally {
      setSaving(false);
    }
  };

  const ph = (v: { en: string }) => (lang === "fr" ? v.en : undefined);

  return (
    <AdminDialog
      open
      onClose={() => !saving && onClose()}
      title={existing ? t("editTitle") : t("addTitle")}
      closeLabel={tcom("close")}
      size="lg"
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{tcom("cancel")}</Button>
          <SaveButton form={formId} saving={saving} label={saving ? tc("saving") : existing ? tc("save") : tc("create")} />
        </>
      }
    >
      <form id={formId} onSubmit={(ev) => void submit(ev)} noValidate className="space-y-6">
        <FormError message={banner} />
        <div className="flex justify-end"><LangSwitch value={lang} onChange={setLang} flagged={flagged} /></div>
        <Field label={`${t("fields.title")} (${lang.toUpperCase()})`} required={lang === "en"} error={errors[`title.${lang}`]} hint={lang === "fr" ? tc("frenchHint") : undefined}>
          <Input value={draft.title[lang]} maxLength={ALERT_LIMITS.title} placeholder={ph(draft.title)} onChange={(e) => set({ title: { ...draft.title, [lang]: e.target.value } })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("fields.date")} required error={errors.date}>
            <Input type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label={t("fields.status")}>
            <AdminSelect value={draft.status} onChange={(e) => set({ status: e.target.value as AlertStatus })}>
              {ALERT_STATUSES.map((x) => <option key={x} value={x}>{tc(`status.${x}`)}</option>)}
            </AdminSelect>
          </Field>
          <Field label={t("fields.slug")} error={errors.slug} hint={t("hints.slug")}>
            <Input value={draft.slug} maxLength={80} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} />
          </Field>
        </div>
        <CheckRow checked={draft.urgent} onChange={(v) => set({ urgent: v })} label={t("fields.urgent")} hint={t("hints.urgent")} />
        <Field label={`${t("fields.content")} (${lang.toUpperCase()})`} required={lang === "en"} error={errors[`content.${lang}`]} hint={t("hints.content")}>
          <Textarea value={draft.content[lang]} rows={10} maxLength={ALERT_LIMITS.content} placeholder={ph(draft.content)} onChange={(e) => set({ content: { ...draft.content, [lang]: e.target.value } })} />
        </Field>

        <FormSection
          title={t("sections.sources")}
          hint={t("hints.sources")}
          action={
            <Button type="button" size="sm" variant="outline" disabled={draft.sources.length >= ALERT_LIMITS.sources}
              onClick={() => set({ sources: [...draft.sources, { label: { ...EMPTY_L }, url: "" }] })}>
              <Plus aria-hidden />
              {t("addSource")}
            </Button>
          }
        >
          {draft.sources.map((s, i) => (
            <RepeatCard key={i} index={i} count={draft.sources.length}
              onMove={(d) => set({ sources: moveItem(draft.sources, i, d) })}
              onRemove={() => set({ sources: removeAt(draft.sources, i) })}>
              <Field label={`${t("fields.sourceLabel")} (${lang.toUpperCase()})`} required={lang === "en"} error={errors[`sources.${i}.label.${lang}`]}>
                <Input value={s.label[lang]} maxLength={160} placeholder={ph(s.label)} onChange={(e) => setSource(i, { label: { ...s.label, [lang]: e.target.value } })} />
              </Field>
              <Field label={t("fields.sourceUrl")} required error={errors[`sources.${i}.url`]}>
                <Input type="url" value={s.url} placeholder="https://" onChange={(e) => setSource(i, { url: e.target.value })} />
              </Field>
            </RepeatCard>
          ))}
        </FormSection>
      </form>
    </AdminDialog>
  );
}
