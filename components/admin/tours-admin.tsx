"use client";

import React, { useId, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CmsLocale, Localized, LocalizedList } from "@/lib/cms/localized";
import {
  TOUR_CURRENCIES, TOUR_LIMITS, TOUR_PRICE_TYPES, TOUR_STATUSES,
  type AdminTourCollection, type AdminTourVenue, type TourCollectionInput, type TourStatus, type TourVenueInput,
} from "@/lib/cms/tours";
import { PageHeader, Panel } from "./page-header";
import { AdminDialog } from "./admin-dialog";
import { AdminSelect } from "./admin-select";
import {
  CheckRow, ConfirmDelete, EmptyRow, Field, FormError, FormSection, LangSwitch, ListSkeleton, LoadErrorRow, MediaThumb,
  MoveButtons, SaveButton, SessionEnded, StatusPill, apiError, cmsApi, jsonInit, linesToList, listToLines,
  paragraphsToText, textToParagraphs, useAdminList, useApiErrors, useBusy,
} from "./cms/kit";

const EMPTY_L: Localized = { en: "", fr: "" };
const EMPTY_LIST: LocalizedList = { en: [], fr: [] };

type Busy = "status" | "move" | "delete";
type Deleting = { kind: "collection"; item: AdminTourCollection } | { kind: "venue"; item: AdminTourVenue };

/** Kigali tours: collections and the venues inside them. */
export function ToursAdmin() {
  const t = useTranslations("Admin.tours");
  const tc = useTranslations("Admin.cms");
  const format = useFormatter();
  const cols = useAdminList<AdminTourCollection>("/api/admin/tour-collections");
  const venues = useAdminList<AdminTourVenue>("/api/admin/tour-venues");
  const [busy, markBusy] = useBusy<Busy>();
  const [editCollection, setEditCollection] = useState<AdminTourCollection | "new" | null>(null);
  const [editVenue, setEditVenue] = useState<{ venue: AdminTourVenue | null; collectionId: string } | null>(null);
  const [toDelete, setToDelete] = useState<Deleting | null>(null);

  const loading = cols.loading || venues.loading;
  const loadError = cols.loadError ?? venues.loadError;
  const reload = () => {
    cols.reload();
    venues.reload();
  };
  const sessionEnded = cols.sessionEnded;
  const collections = [...(cols.items ?? [])].sort((a, b) => a.order - b.order);
  const venuesOf = (id: string) => (venues.items ?? []).filter((v) => v.collectionId === id).sort((a, b) => a.order - b.order);

  const patchCollection = async (c: AdminTourCollection, body: { status?: TourStatus; order?: number }, what: Busy) => {
    markBusy(c.id, what);
    try {
      const { item } = await cmsApi<{ item: AdminTourCollection }>(`/api/admin/tour-collections/${c.id}`, jsonInit("PATCH", body));
      cols.setItems((l) => (l ?? []).map((x) => (x.id === item.id ? item : x)));
      return item;
    } catch (err) {
      if (err instanceof SessionEnded) sessionEnded();
      else toast.error(tc("actionError"));
      return null;
    } finally {
      markBusy(c.id, null);
    }
  };

  const patchVenue = async (v: AdminTourVenue, body: { status?: TourStatus; order?: number }, what: Busy) => {
    markBusy(v.id, what);
    try {
      const { item } = await cmsApi<{ item: AdminTourVenue }>(`/api/admin/tour-venues/${v.id}`, jsonInit("PATCH", body));
      venues.setItems((l) => (l ?? []).map((x) => (x.id === item.id ? item : x)));
      return item;
    } catch (err) {
      if (err instanceof SessionEnded) sessionEnded();
      else toast.error(tc("actionError"));
      return null;
    } finally {
      markBusy(v.id, null);
    }
  };

  /** Swaps two neighbours by giving each a clean position (0, 1, 2…), so orders never collide. */
  async function move<T extends { id: string; order: number }>(list: T[], index: number, delta: -1 | 1, patch: (x: T, body: { order: number }, what: Busy) => Promise<T | null>) {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    await Promise.all(next.map((x, i) => (x.order === i ? null : patch(x, { order: i }, "move"))));
    toast.success(tc("orderToast"));
  }

  const remove = async () => {
    const d = toDelete;
    if (!d) return;
    setToDelete(null);
    markBusy(d.item.id, "delete");
    try {
      if (d.kind === "collection") {
        await cmsApi(`/api/admin/tour-collections/${d.item.id}`, { method: "DELETE" });
        cols.setItems((l) => (l ?? []).filter((x) => x.id !== d.item.id));
      } else {
        await cmsApi(`/api/admin/tour-venues/${d.item.id}`, { method: "DELETE" });
        venues.setItems((l) => (l ?? []).filter((x) => x.id !== d.item.id));
      }
      toast.success(tc("deletedToast"));
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      toast.error(apiError(err).error === "has_venues" ? t("hasVenues") : tc("actionError"));
    } finally {
      markBusy(d.item.id, null);
    }
  };

  const toggle = (status: TourStatus): TourStatus => (status === "published" ? "draft" : "published");

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
            <Button onClick={() => setEditCollection("new")} disabled={Boolean(loadError) || cols.items === null}>
              <Plus aria-hidden />
              {t("addCollection")}
            </Button>
          </>
        }
      />

      {loadError ? (
        <section className="rounded-xl border bg-card shadow-xs"><LoadErrorRow kind={loadError} onRetry={reload} /></section>
      ) : cols.items === null || venues.items === null ? (
        <section className="rounded-xl border bg-card shadow-xs"><ListSkeleton /></section>
      ) : collections.length === 0 ? (
        <section className="rounded-xl border bg-card shadow-xs"><EmptyRow>{t("empty")}</EmptyRow></section>
      ) : (
        collections.map((c, ci) => {
          const list = venuesOf(c.id);
          const doing = busy[c.id];
          return (
            <Panel
              key={c.id}
              title={c.category.en}
              description={`${c.intro.title.en} · /${c.slug} · ${t("venueCount", { count: list.length })}`}
              bodyClassName=""
              className={cn(doing === "delete" && "opacity-50")}
              action={
                <div className="flex flex-wrap items-center justify-end gap-1">
                  <StatusPill tone={c.status === "published" ? "live" : "draft"}>{tc(`status.${c.status}`)}</StatusPill>
                  <MoveButtons index={ci} count={collections.length} disabled={Boolean(doing)} onMove={(d) => void move(collections, ci, d, patchCollection)} />
                  <Button size="sm" variant="ghost" onClick={() => setEditCollection(c)} disabled={Boolean(doing)}>
                    <Pencil aria-hidden />
                    {tc("edit")}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={Boolean(doing)}
                    onClick={() => void patchCollection(c, { status: toggle(c.status) }, "status").then((x) => x && toast.success(x.status === "published" ? tc("publishedToast") : tc("unpublishedToast")))}>
                    {doing === "status" ? <Loader2 className="animate-spin" aria-hidden /> : c.status === "published" ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                    {c.status === "published" ? tc("unpublish") : tc("publish")}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={Boolean(doing)} onClick={() => setToDelete({ kind: "collection", item: c })} className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={tc("delete")}>
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              }
            >
              {list.length === 0 ? (
                <EmptyRow>{t("noVenues")}</EmptyRow>
              ) : (
                <ul className="divide-y">
                  {list.map((v, vi) => {
                    const vd = busy[v.id];
                    return (
                      <li key={v.id} className={cn("flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center", vd === "delete" && "opacity-50")}>
                        <MediaThumb src={v.image} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{v.title.en}</p>
                          <p className="text-sm text-muted-foreground">
                            {v.location.en}
                            {v.price !== null && ` · ${format.number(v.price)} ${v.currency}`}
                            {!v.title.fr && ` · ${tc("frenchMissing")}`}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <StatusPill tone={v.status === "published" ? "live" : "draft"}>{tc(`status.${v.status}`)}</StatusPill>
                          <MoveButtons index={vi} count={list.length} disabled={Boolean(vd)} onMove={(d) => void move(list, vi, d, patchVenue)} />
                          <Button size="sm" variant="ghost" onClick={() => setEditVenue({ venue: v, collectionId: c.id })} disabled={Boolean(vd)}>
                            <Pencil aria-hidden />
                            {tc("edit")}
                          </Button>
                          <Button size="sm" variant="ghost" disabled={Boolean(vd)}
                            onClick={() => void patchVenue(v, { status: toggle(v.status) }, "status").then((x) => x && toast.success(x.status === "published" ? tc("publishedToast") : tc("unpublishedToast")))}>
                            {vd === "status" ? <Loader2 className="animate-spin" aria-hidden /> : v.status === "published" ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                            {v.status === "published" ? tc("unpublish") : tc("publish")}
                          </Button>
                          <Button size="sm" variant="ghost" disabled={Boolean(vd)} onClick={() => setToDelete({ kind: "venue", item: v })} className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={tc("delete")}>
                            <Trash2 aria-hidden />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="border-t px-5 py-3">
                <Button size="sm" variant="outline" onClick={() => setEditVenue({ venue: null, collectionId: c.id })} disabled={list.length >= TOUR_LIMITS.venuesPerCollection}>
                  <Plus aria-hidden />
                  {t("addVenue")}
                </Button>
              </div>
            </Panel>
          );
        })
      )}

      {editCollection && (
        <CollectionEditor
          existing={editCollection === "new" ? null : editCollection}
          nextOrder={collections.length}
          onClose={() => setEditCollection(null)}
          onSaved={(item, isNew) => {
            cols.setItems((l) => (isNew ? [...(l ?? []), item] : (l ?? []).map((x) => (x.id === item.id ? item : x))));
            setEditCollection(null);
            toast.success(isNew ? tc("createdToast") : tc("savedToast"));
          }}
          onSessionEnded={sessionEnded}
        />
      )}

      {editVenue && (
        <VenueEditor
          existing={editVenue.venue}
          collectionId={editVenue.collectionId}
          collections={collections}
          nextOrder={venuesOf(editVenue.collectionId).length}
          onClose={() => setEditVenue(null)}
          onSaved={(item, isNew) => {
            venues.setItems((l) => (isNew ? [...(l ?? []), item] : (l ?? []).map((x) => (x.id === item.id ? item : x))));
            setEditVenue(null);
            toast.success(isNew ? tc("createdToast") : tc("savedToast"));
          }}
          onSessionEnded={sessionEnded}
        />
      )}

      <ConfirmDelete
        open={toDelete !== null}
        name={toDelete ? (toDelete.kind === "collection" ? toDelete.item.category.en : toDelete.item.title.en) : ""}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}

/* ─── shared editor plumbing ─────────────────────────────────────────── */

function useEditor<T>(initial: () => T) {
  const [draft, setDraft] = useState<T>(initial);
  const [lang, setLang] = useState<CmsLocale>("en");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const flagged = (["en", "fr"] as CmsLocale[]).filter((l) => Object.keys(errors).some((k) => k.endsWith(`.${l}`) || k.includes(`.${l}.`)));
  return { draft, setDraft, lang, setLang, errors, setErrors, banner, setBanner, saving, setSaving, flagged };
}

/** One EN/FR single-line or multi-line text field for the chosen language. */
function LText({ label, value, lang, onChange, error, required, rows, max }: {
  label: string; value: Localized; lang: CmsLocale; onChange: (v: Localized) => void; error?: string; required?: boolean; rows?: number; max: number;
}) {
  const tc = useTranslations("Admin.cms");
  const props = { value: value[lang], maxLength: max, placeholder: lang === "fr" ? value.en : undefined };
  const change = (s: string) => onChange({ ...value, [lang]: s });
  return (
    <Field label={`${label} (${lang.toUpperCase()})`} required={required && lang === "en"} error={error} hint={lang === "fr" ? tc("frenchHint") : undefined}>
      {rows ? <Textarea {...props} rows={rows} onChange={(e) => change(e.target.value)} /> : <Input {...props} onChange={(e) => change(e.target.value)} />}
    </Field>
  );
}

/** A list (paragraphs or one item per line) in the chosen language. Kept as text while typing. */
function LList({ label, hint, value, lang, onChange, error, paragraphs = false }: {
  label: string; hint?: string; value: LocalizedList; lang: CmsLocale; onChange: (v: LocalizedList) => void; error?: string; paragraphs?: boolean;
}) {
  const toText = paragraphs ? paragraphsToText : listToLines;
  const fromText = paragraphs ? textToParagraphs : linesToList;
  const [text, setText] = useState<Record<CmsLocale, string>>({ en: toText(value.en), fr: toText(value.fr) });
  return (
    <Field label={`${label} (${lang.toUpperCase()})`} hint={hint} error={error}>
      <Textarea
        value={text[lang]}
        rows={paragraphs ? 5 : 4}
        placeholder={lang === "fr" ? text.en : undefined}
        onChange={(e) => {
          setText((t) => ({ ...t, [lang]: e.target.value }));
          onChange({ ...value, [lang]: fromText(e.target.value) });
        }}
      />
    </Field>
  );
}

const firstError = (errors: Record<string, string>, prefix: string) => Object.entries(errors).find(([k]) => k.startsWith(prefix))?.[1];

/* ─── collection editor ──────────────────────────────────────────────── */

function CollectionEditor({ existing, nextOrder, onClose, onSaved, onSessionEnded }: {
  existing: AdminTourCollection | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: (item: AdminTourCollection, isNew: boolean) => void;
  onSessionEnded: () => void;
}) {
  const t = useTranslations("Admin.tours");
  const tc = useTranslations("Admin.cms");
  const tcom = useTranslations("Admin.common");
  const formId = useId();
  const toErrors = useApiErrors();
  const e = useEditor<TourCollectionInput>(() =>
    existing
      ? { slug: existing.slug, status: existing.status, order: existing.order, category: existing.category, intro: structuredClone(existing.intro) }
      : { slug: "", status: "draft", order: nextOrder, category: { ...EMPTY_L }, intro: { image: "", title: { ...EMPTY_L }, headline: { ...EMPTY_L }, desc: { ...EMPTY_LIST } } },
  );
  const d = e.draft;
  const set = (patch: Partial<TourCollectionInput>) => e.setDraft((x) => ({ ...x, ...patch }));
  const setIntro = (patch: Partial<TourCollectionInput["intro"]>) => e.setDraft((x) => ({ ...x, intro: { ...x.intro, ...patch } }));

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    e.setBanner(null);
    e.setErrors({});
    e.setSaving(true);
    try {
      const { item } = await cmsApi<{ item: AdminTourCollection }>(
        existing ? `/api/admin/tour-collections/${existing.id}` : "/api/admin/tour-collections",
        jsonInit(existing ? "PUT" : "POST", d),
      );
      onSaved(item, !existing);
    } catch (err) {
      if (err instanceof SessionEnded) return onSessionEnded();
      const f = toErrors(err);
      e.setErrors(f.fields);
      e.setBanner(f.banner);
      if (f.lang) e.setLang(f.lang);
    } finally {
      e.setSaving(false);
    }
  };

  return (
    <AdminDialog
      open
      onClose={() => !e.saving && onClose()}
      title={existing ? t("editCollection") : t("addCollection")}
      closeLabel={tcom("close")}
      size="lg"
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={e.saving}>{tcom("cancel")}</Button>
          <SaveButton form={formId} saving={e.saving} label={e.saving ? tc("saving") : existing ? tc("save") : tc("create")} />
        </>
      }
    >
      <form id={formId} onSubmit={(ev) => void submit(ev)} noValidate className="space-y-6">
        <FormError message={e.banner} />
        <div className="flex justify-end"><LangSwitch value={e.lang} onChange={e.setLang} flagged={e.flagged} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <LText label={t("fields.category")} value={d.category} lang={e.lang} onChange={(v) => set({ category: v })} error={e.errors[`category.${e.lang}`]} required max={80} />
          <Field label={t("fields.slug")} error={e.errors.slug} hint={t("hints.slug")}>
            <Input value={d.slug} maxLength={80} onChange={(ev) => set({ slug: ev.target.value.toLowerCase() })} />
          </Field>
          <Field label={t("fields.status")}>
            <AdminSelect value={d.status} onChange={(ev) => set({ status: ev.target.value as TourStatus })}>
              {TOUR_STATUSES.map((x) => <option key={x} value={x}>{tc(`status.${x}`)}</option>)}
            </AdminSelect>
          </Field>
        </div>
        <FormSection title={t("sections.intro")}>
          <div className="flex items-end gap-3">
            <MediaThumb src={d.intro.image} className="h-14 w-20" />
            <Field label={t("fields.image")} required error={e.errors["intro.image"]} hint={tc("mediaHint")} className="flex-1">
              <Input value={d.intro.image} placeholder="/marketing/…jpg" onChange={(ev) => setIntro({ image: ev.target.value })} />
            </Field>
          </div>
          <LText label={t("fields.introTitle")} value={d.intro.title} lang={e.lang} onChange={(v) => setIntro({ title: v })} error={e.errors[`intro.title.${e.lang}`]} required max={120} />
          <LText label={t("fields.headline")} value={d.intro.headline} lang={e.lang} onChange={(v) => setIntro({ headline: v })} error={e.errors[`intro.headline.${e.lang}`]} max={160} />
          <LList key={`desc-${e.lang}`} label={t("fields.desc")} hint={t("hints.paragraphs")} value={d.intro.desc} lang={e.lang} paragraphs
            onChange={(v) => setIntro({ desc: v })} error={firstError(e.errors, "intro.desc")} />
        </FormSection>
      </form>
    </AdminDialog>
  );
}

/* ─── venue editor ───────────────────────────────────────────────────── */

const FACTS = ["duration", "groupSize", "minAge", "bestTime", "driveTime"] as const;

function VenueEditor({ existing, collectionId, collections, nextOrder, onClose, onSaved, onSessionEnded }: {
  existing: AdminTourVenue | null;
  collectionId: string;
  collections: AdminTourCollection[];
  nextOrder: number;
  onClose: () => void;
  onSaved: (item: AdminTourVenue, isNew: boolean) => void;
  onSessionEnded: () => void;
}) {
  const t = useTranslations("Admin.tours");
  const tc = useTranslations("Admin.cms");
  const tcom = useTranslations("Admin.common");
  const formId = useId();
  const toErrors = useApiErrors();
  const e = useEditor<TourVenueInput>(() => {
    if (existing) {
      const copy: Partial<AdminTourVenue> = structuredClone(existing);
      delete copy.id;
      delete copy.createdAt;
      delete copy.updatedAt;
      return copy as TourVenueInput;
    }
    return {
      slug: "", collectionId, status: "draft", order: nextOrder, image: "", gallery: [], price: null, currency: "USD", priceType: "paid", memorial: false,
      title: { ...EMPTY_L }, location: { ...EMPTY_L }, tag: { ...EMPTY_L }, summary: { ...EMPTY_L }, history: { ...EMPTY_LIST },
      visitorNote: { ...EMPTY_L }, highlights: { ...EMPTY_LIST },
      facts: { duration: { ...EMPTY_L }, groupSize: { ...EMPTY_L }, minAge: { ...EMPTY_L }, bestTime: { ...EMPTY_L }, driveTime: { ...EMPTY_L }, outdoor: false },
    };
  });
  const d = e.draft;
  const set = (patch: Partial<TourVenueInput>) => e.setDraft((x) => ({ ...x, ...patch }));
  const [galleryText, setGalleryText] = useState(listToLines(d.gallery));
  const L = (k: keyof TourVenueInput) => e.errors[`${k}.${e.lang}`];

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    e.setBanner(null);
    e.setErrors({});
    e.setSaving(true);
    try {
      const { item } = await cmsApi<{ item: AdminTourVenue }>(
        existing ? `/api/admin/tour-venues/${existing.id}` : "/api/admin/tour-venues",
        jsonInit(existing ? "PUT" : "POST", d),
      );
      onSaved(item, !existing);
    } catch (err) {
      if (err instanceof SessionEnded) return onSessionEnded();
      const f = toErrors(err);
      e.setErrors(f.fields);
      e.setBanner(f.banner);
      if (f.lang) e.setLang(f.lang);
    } finally {
      e.setSaving(false);
    }
  };

  return (
    <AdminDialog
      open
      onClose={() => !e.saving && onClose()}
      title={existing ? t("editVenue", { name: existing.title.en }) : t("addVenue")}
      closeLabel={tcom("close")}
      size="lg"
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={e.saving}>{tcom("cancel")}</Button>
          <SaveButton form={formId} saving={e.saving} label={e.saving ? tc("saving") : existing ? tc("save") : tc("create")} />
        </>
      }
    >
      <form id={formId} onSubmit={(ev) => void submit(ev)} noValidate className="space-y-8">
        <FormError message={e.banner} />
        <div className="flex justify-end"><LangSwitch value={e.lang} onChange={e.setLang} flagged={e.flagged} /></div>

        <FormSection title={t("sections.basics")}>
          <LText label={t("fields.venueTitle")} value={d.title} lang={e.lang} onChange={(v) => set({ title: v })} error={L("title")} required max={120} />
          <div className="grid gap-4 sm:grid-cols-2">
            <LText label={t("fields.location")} value={d.location} lang={e.lang} onChange={(v) => set({ location: v })} error={L("location")} required max={120} />
            <LText label={t("fields.tag")} value={d.tag} lang={e.lang} onChange={(v) => set({ tag: v })} error={L("tag")} max={40} />
            <Field label={t("fields.collection")} error={e.errors.collectionId}>
              <AdminSelect value={d.collectionId} onChange={(ev) => set({ collectionId: ev.target.value })}>
                {collections.map((c) => <option key={c.id} value={c.id}>{c.category.en}</option>)}
              </AdminSelect>
            </Field>
            <Field label={t("fields.slug")} error={e.errors.slug} hint={t("hints.slug")}>
              <Input value={d.slug} maxLength={80} onChange={(ev) => set({ slug: ev.target.value.toLowerCase() })} />
            </Field>
            <Field label={t("fields.status")}>
              <AdminSelect value={d.status} onChange={(ev) => set({ status: ev.target.value as TourStatus })}>
                {TOUR_STATUSES.map((x) => <option key={x} value={x}>{tc(`status.${x}`)}</option>)}
              </AdminSelect>
            </Field>
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <Field label={t("fields.price")} error={e.errors.price} hint={t("hints.price")}>
                <Input inputMode="numeric" value={d.price ?? ""} onChange={(ev) => set({ price: ev.target.value === "" ? null : Number(ev.target.value.replace(/[\s,]/g, "")) })} />
              </Field>
              <Field label={t("fields.currency")}>
                <AdminSelect value={d.currency} onChange={(ev) => set({ currency: ev.target.value as TourVenueInput["currency"] })}>
                  {TOUR_CURRENCIES.map((x) => <option key={x} value={x}>{x}</option>)}
                </AdminSelect>
              </Field>
            </div>
            <Field label={t("fields.priceType")} error={e.errors.priceType}>
              <AdminSelect value={d.priceType} onChange={(ev) => set({ priceType: ev.target.value as TourVenueInput["priceType"] })}>
                {TOUR_PRICE_TYPES.map((x) => <option key={x} value={x}>{t(`priceTypes.${x}`)}</option>)}
              </AdminSelect>
            </Field>
          </div>
          <CheckRow checked={d.memorial} onChange={(v) => set({ memorial: v })} label={t("fields.memorial")} hint={t("hints.memorial")} />
          <LText label={t("fields.summary")} value={d.summary} lang={e.lang} onChange={(v) => set({ summary: v })} error={L("summary")} max={400} rows={2} />
        </FormSection>

        <FormSection title={t("sections.photos")}>
          <div className="flex items-end gap-3">
            <MediaThumb src={d.image} className="h-14 w-20" />
            <Field label={t("fields.image")} required error={e.errors.image} hint={tc("mediaHint")} className="flex-1">
              <Input value={d.image} placeholder="/locations/…jpg" onChange={(ev) => set({ image: ev.target.value })} />
            </Field>
          </div>
          <Field label={t("fields.gallery")} hint={t("hints.gallery")} error={firstError(e.errors, "gallery")}>
            <Textarea value={galleryText} rows={4} spellCheck={false} className="font-mono text-xs"
              onChange={(ev) => {
                setGalleryText(ev.target.value);
                set({ gallery: linesToList(ev.target.value) });
              }} />
          </Field>
          {d.gallery.length > 0 && (
            <div className="flex flex-wrap gap-2">{d.gallery.map((src, i) => <MediaThumb key={`${src}-${i}`} src={src} className="h-12 w-16" />)}</div>
          )}
        </FormSection>

        <FormSection title={t("sections.story")}>
          <LList key={`history-${e.lang}`} label={t("fields.history")} hint={t("hints.paragraphs")} value={d.history} lang={e.lang} paragraphs
            onChange={(v) => set({ history: v })} error={firstError(e.errors, "history")} />
          <LList key={`highlights-${e.lang}`} label={t("fields.highlights")} hint={t("hints.lines")} value={d.highlights} lang={e.lang}
            onChange={(v) => set({ highlights: v })} error={firstError(e.errors, "highlights")} />
          <LText label={t("fields.visitorNote")} value={d.visitorNote} lang={e.lang} onChange={(v) => set({ visitorNote: v })} error={L("visitorNote")} max={400} rows={2} />
        </FormSection>

        <FormSection title={t("sections.facts")}>
          <div className="grid gap-4 sm:grid-cols-2">
            {FACTS.map((k) => (
              <LText key={k} label={t(`facts.${k}`)} value={d.facts[k]} lang={e.lang} max={80}
                onChange={(v) => set({ facts: { ...d.facts, [k]: v } })} error={e.errors[`facts.${k}.${e.lang}`]} />
            ))}
          </div>
          <CheckRow checked={d.facts.outdoor} onChange={(v) => set({ facts: { ...d.facts, outdoor: v } })} label={t("facts.outdoor")} />
        </FormSection>
      </form>
    </AdminDialog>
  );
}
