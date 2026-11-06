"use client";

import React, { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, EyeOff, FileText, ImagePlus, Images, Loader2, Pencil, Plus, RefreshCw, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CmsLocale, Localized } from "@/lib/cms/localized";
import { TRIP_LIMITS as L, TRIP_STATUSES, hasRecap, isTripPage, sizedPhoto, type AdminTrip, type TripInput, type TripPhoto } from "@/lib/cms/trips";
import { TRIP_CATEGORIES } from "@/lib/trips";
import { AdminDialog } from "./admin-dialog";
import { AdminSelect } from "./admin-select";
import { PageHeader } from "./page-header";
import { TripPageEditor } from "./trip-page-editor";
import {
  CheckRow, ConfirmDelete, EmptyRow, Field, FormError, ListSkeleton, LangSwitch, LoadErrorRow, MediaThumb, SaveButton, SessionEnded,
  StatusPill, apiError, cmsApi, jsonInit, useAdminList, useApiErrors, useBusy,
} from "./cms/kit";

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const EMPTY: TripInput = {
  slug: "",
  category: TRIP_CATEGORIES[0].id,
  status: "soon",
  name: { en: "", fr: "" },
  summary: { en: "", fr: "" },
  image: "",
  href: "",
  visible: true,
};

function toInput(trip: AdminTrip): TripInput {
  const { slug, category, status, name, summary, image, href, visible } = trip;
  return { slug, category, status, name, summary, image, href, visible };
}

/** Admin → Trips, the Trips tab: what /iwacu/trips lists, and each trip's recap photos. */
export function TripsAdmin() {
  const t = useTranslations("Admin.trips.manage");
  const tc = useTranslations("Admin.cms");
  const tTrips = useTranslations("Trips.categories");
  const { items, setItems, loadError, loading, reload, sessionEnded } = useAdminList<AdminTrip>("/api/admin/trips");
  const [busy, markBusy] = useBusy<"visible" | "delete">();
  const [editing, setEditing] = useState<AdminTrip | "new" | null>(null);
  const [recapId, setRecapId] = useState<string | null>(null);
  const [pageTrip, setPageTrip] = useState<AdminTrip | null>(null);
  const [toDelete, setToDelete] = useState<AdminTrip | null>(null);

  const replace = (trip: AdminTrip) => setItems((l) => (l ?? []).map((x) => (x.id === trip.id ? trip : x)));
  const recap = items?.find((x) => x.id === recapId) ?? null;

  const toggleVisible = async (trip: AdminTrip) => {
    markBusy(trip.id, "visible");
    try {
      const { item } = await cmsApi<{ item: AdminTrip }>(`/api/admin/trips/${trip.id}`, jsonInit("PUT", { ...toInput(trip), visible: !trip.visible }));
      replace(item);
      toast.success(item.visible ? tc("publishedToast") : tc("unpublishedToast"));
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      toast.error(tc("actionError"));
    } finally {
      markBusy(trip.id, null);
    }
  };

  const remove = async () => {
    const trip = toDelete;
    if (!trip) return;
    setToDelete(null);
    markBusy(trip.id, "delete");
    try {
      await cmsApi(`/api/admin/trips/${trip.id}`, { method: "DELETE" });
      setItems((l) => (l ?? []).filter((x) => x.id !== trip.id));
      toast.success(tc("deletedToast"));
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      toast.error(tc("actionError"));
    } finally {
      markBusy(trip.id, null);
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
        {loadError ? (
          <LoadErrorRow kind={loadError} onRetry={reload} />
        ) : items === null ? (
          <ListSkeleton />
        ) : items.length === 0 ? (
          <EmptyRow>{t("empty")}</EmptyRow>
        ) : (
          <ul className="divide-y">
            {items.map((trip) => {
              const doing = busy[trip.id];
              return (
                <li key={trip.id} className={cn("flex flex-col gap-4 p-5 sm:flex-row", doing === "delete" && "opacity-50")}>
                  <MediaThumb src={sizedPhoto(trip.image, 300)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{trip.name.en}</p>
                        <p className="text-sm text-muted-foreground">{tTrips(trip.category)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusPill tone={trip.status === "live" ? "live" : trip.status === "maintenance" ? "warning" : "muted"}>{t(`status.${trip.status}`)}</StatusPill>
                        {!trip.visible && <StatusPill tone="draft">{t("hidden")}</StatusPill>}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {hasRecap(trip) ? `/iwacu/trips/${trip.slug}/recap · ${t("photoCount", { count: trip.photos.length })}` : t("noRecap")}
                      {!trip.name.fr && ` · ${tc("frenchMissing")}`}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {hasRecap(trip) && (
                        <Button size="sm" onClick={() => setRecapId(trip.id)} disabled={Boolean(doing)}>
                          <Images aria-hidden />
                          {t("recap")}
                        </Button>
                      )}
                      {isTripPage(trip.slug) && (
                        <Button size="sm" variant="outline" onClick={() => setPageTrip(trip)} disabled={Boolean(doing)}>
                          <FileText aria-hidden />
                          {t("pageContent")}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setEditing(trip)} disabled={Boolean(doing)}>
                        <Pencil aria-hidden />
                        {tc("edit")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void toggleVisible(trip)} disabled={Boolean(doing)}>
                        {doing === "visible" ? <Loader2 className="animate-spin" aria-hidden /> : trip.visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                        {trip.visible ? t("hide") : t("show")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setToDelete(trip)} disabled={Boolean(doing)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
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
        <TripEditor
          existing={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(item, isNew) => {
            setItems((l) => (isNew ? [...(l ?? []), item] : (l ?? []).map((x) => (x.id === item.id ? item : x))));
            setEditing(null);
            toast.success(isNew ? tc("createdToast") : tc("savedToast"));
          }}
          onSessionEnded={sessionEnded}
        />
      )}

      {pageTrip && <TripPageEditor trip={pageTrip} onClose={() => setPageTrip(null)} onSessionEnded={sessionEnded} />}

      {recap && <RecapPhotos trip={recap} onChange={replace} onClose={() => setRecapId(null)} onSessionEnded={sessionEnded} />}

      <ConfirmDelete open={toDelete !== null} name={toDelete?.name.en ?? ""} onCancel={() => setToDelete(null)} onConfirm={() => void remove()} />
    </div>
  );
}

/* ─── add or edit a trip ─────────────────────────────────────────────── */

function TripEditor({ existing, onClose, onSaved, onSessionEnded }: {
  existing: AdminTrip | null;
  onClose: () => void;
  onSaved: (item: AdminTrip, isNew: boolean) => void;
  onSessionEnded: () => void;
}) {
  const t = useTranslations("Admin.trips.manage");
  const tc = useTranslations("Admin.cms");
  const tcom = useTranslations("Admin.common");
  const tTrips = useTranslations("Trips.categories");
  const formId = useId();
  const toErrors = useApiErrors();
  const [draft, setDraft] = useState<TripInput>(() => (existing ? toInput(existing) : structuredClone(EMPTY)));
  const [lang, setLang] = useState<CmsLocale>("en");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const flagged = (["en", "fr"] as CmsLocale[]).filter((l) => Object.keys(errors).some((k) => k.endsWith(`.${l}`)));
  const setText = (key: "name" | "summary", value: string) => setDraft((d) => ({ ...d, [key]: { ...d[key], [lang]: value } as Localized }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setErrors({});
    const body = { ...draft, slug: draft.slug.trim() || slugify(draft.name.en) };
    setSaving(true);
    try {
      const { item } = await cmsApi<{ item: AdminTrip }>(existing ? `/api/admin/trips/${existing.id}` : "/api/admin/trips", jsonInit(existing ? "PUT" : "POST", body));
      onSaved(item, !existing);
    } catch (error) {
      if (error instanceof SessionEnded) return onSessionEnded();
      const found = toErrors(error);
      setErrors(found.fields);
      setBanner(found.banner);
      if (found.lang && found.lang !== lang) setLang(found.lang);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminDialog
      open
      onClose={() => !saving && onClose()}
      title={existing ? t("editTitle", { name: existing.name.en }) : t("addTitle")}
      description={t("editorHint")}
      closeLabel={tcom("close")}
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{tcom("cancel")}</Button>
          <SaveButton form={formId} saving={saving} label={saving ? tc("saving") : existing ? tc("save") : tc("create")} />
        </>
      }
    >
      <form id={formId} onSubmit={(e) => void submit(e)} noValidate className="space-y-5">
        <FormError message={banner} />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{tc("langHint")}</p>
          <LangSwitch value={lang} onChange={setLang} flagged={flagged} />
        </div>
        <Field label={`${t("fields.name")} (${lang.toUpperCase()})`} required={lang === "en"} error={errors[`name.${lang}`]} hint={lang === "fr" ? tc("frenchHint") : undefined}>
          <Input value={draft.name[lang]} maxLength={L.name} placeholder={lang === "fr" ? draft.name.en : undefined} onChange={(e) => setText("name", e.target.value)} />
        </Field>
        <Field label={`${t("fields.summary")} (${lang.toUpperCase()})`} error={errors[`summary.${lang}`]} hint={lang === "fr" ? tc("frenchHint") : undefined}>
          <Textarea value={draft.summary[lang]} rows={3} maxLength={L.summary} placeholder={lang === "fr" ? draft.summary.en : undefined} onChange={(e) => setText("summary", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("fields.category")} error={errors.category}>
            <AdminSelect value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as TripInput["category"] }))}>
              {TRIP_CATEGORIES.map(({ id }) => <option key={id} value={id}>{tTrips(id)}</option>)}
            </AdminSelect>
          </Field>
          <Field label={t("fields.status")} error={errors.status} hint={t("hints.status")}>
            <AdminSelect value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as TripInput["status"] }))}>
              {TRIP_STATUSES.map((x) => <option key={x} value={x}>{t(`status.${x}`)}</option>)}
            </AdminSelect>
          </Field>
        </div>
        <Field label={t("fields.slug")} error={errors.slug} hint={existing ? t("hints.slugFixed") : t("hints.slug")}>
          <Input value={draft.slug} maxLength={80} disabled={Boolean(existing)} placeholder={slugify(draft.name.en) || "lake-kivu"} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} />
        </Field>
        <div className="flex items-end gap-3">
          <MediaThumb src={sizedPhoto(draft.image, 300)} className="h-14 w-20" />
          <Field label={t("fields.image")} error={errors.image} hint={t("hints.image")} className="flex-1">
            <Input value={draft.image} placeholder="/backgrounds/akagera.jpg" onChange={(e) => setDraft((d) => ({ ...d, image: e.target.value }))} />
          </Field>
        </div>
        <Field label={t("fields.href")} error={errors.href} hint={t("hints.href")}>
          <Input value={draft.href} placeholder="/iwacu/trips/akagera" onChange={(e) => setDraft((d) => ({ ...d, href: e.target.value }))} />
        </Field>
        <CheckRow checked={draft.visible} onChange={(v) => setDraft((d) => ({ ...d, visible: v }))} label={t("fields.visible")} />
      </form>
    </AdminDialog>
  );
}

/* ─── a trip's recap photos ──────────────────────────────────────────── */

function RecapPhotos({ trip, onChange, onClose, onSessionEnded }: {
  trip: AdminTrip;
  onChange: (trip: AdminTrip) => void;
  onClose: () => void;
  onSessionEnded: () => void;
}) {
  const t = useTranslations("Admin.trips.manage");
  const tc = useTranslations("Admin.cms");
  const tcom = useTranslations("Admin.common");
  const picker = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<TripPhoto | null>(null);
  const uploading = progress !== null;

  /** One photo: a signature from the server, straight to Cloudinary, then the server checks and saves it. */
  const sendOne = async (file: File) => {
    const sig = await cmsApi<{ url: string; fields: Record<string, string | number> }>(`/api/admin/trips/${trip.id}/photos/signature`, jsonInit("POST"));
    const form = new FormData();
    Object.entries(sig.fields).forEach(([k, v]) => form.append(k, String(v)));
    form.append("file", file);
    const sent = await fetch(sig.url, { method: "POST", body: form });
    if (!sent.ok) throw Object.assign(new Error("upload"), { status: 502 });
    const reply = (await sent.json()) as { public_id: string; version: number; signature: string };
    const { item } = await cmsApi<{ item: AdminTrip }>(
      `/api/admin/trips/${trip.id}/photos`,
      jsonInit("POST", { public_id: reply.public_id, version: reply.version, signature: reply.signature }),
    );
    onChange(item);
  };

  const upload = async (files: File[]) => {
    const tooBig = files.filter((f) => f.size > L.photoBytes);
    const ready = files.filter((f) => f.size <= L.photoBytes);
    if (tooBig.length) toast.error(t("photos.tooBig", { count: tooBig.length, mb: Math.round(L.photoBytes / 1024 / 1024) }));
    let saved = 0;
    let failed = 0;
    let off = false;
    setProgress({ done: 0, total: ready.length });
    for (const [i, file] of ready.entries()) {
      try {
        await sendOne(file);
        saved += 1;
      } catch (err) {
        if (err instanceof SessionEnded) {
          setProgress(null);
          return onSessionEnded();
        }
        failed += 1;
        off ||= apiError(err).status === 503;
      }
      setProgress({ done: i + 1, total: ready.length });
    }
    setProgress(null);
    if (saved) toast.success(t("photos.saved", { count: saved }));
    if (failed) toast.error(off ? t("photos.off") : t("photos.failed", { count: failed }));
  };

  const remove = async () => {
    const photo = toDelete;
    if (!photo) return;
    setToDelete(null);
    setWorking(photo.id);
    try {
      const { item } = await cmsApi<{ item: AdminTrip }>(`/api/admin/trips/${trip.id}/photos/${encodeURIComponent(photo.id)}`, { method: "DELETE" });
      onChange(item);
      toast.success(tc("deletedToast"));
    } catch (err) {
      if (err instanceof SessionEnded) return onSessionEnded();
      toast.error(tc("actionError"));
    } finally {
      setWorking(null);
    }
  };

  const putOnCard = async (photo: TripPhoto) => {
    setWorking(photo.id);
    try {
      const { item } = await cmsApi<{ item: AdminTrip }>(`/api/admin/trips/${trip.id}`, jsonInit("PUT", { ...toInput(trip), image: photo.url }));
      onChange(item);
      toast.success(t("photos.cardSet"));
    } catch (err) {
      if (err instanceof SessionEnded) return onSessionEnded();
      toast.error(tc("actionError"));
    } finally {
      setWorking(null);
    }
  };

  return (
    <AdminDialog
      open
      onClose={() => !uploading && onClose()}
      title={t("photos.title", { name: trip.name.en })}
      description={t("photos.hint")}
      closeLabel={tcom("close")}
      size="lg"
      closeOnBackdrop={false}
      footer={<Button variant="outline" onClick={onClose} disabled={uploading}>{tcom("close")}</Button>}
    >
      <div className="space-y-5">
        <input
          ref={picker}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            if (files.length) void upload(files);
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => picker.current?.click()} disabled={uploading || trip.photos.length >= L.photos}>
            {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus aria-hidden />}
            {t("photos.add")}
          </Button>
          <p role="status" className="text-sm text-muted-foreground">
            {progress ? t("photos.progress", { done: progress.done, total: progress.total }) : t("photoCount", { count: trip.photos.length })}
          </p>
        </div>

        {trip.photos.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{t("photos.empty")}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {trip.photos.map((photo) => {
              const isCard = trip.image === photo.url;
              return (
                <li key={photo.id} className={cn("overflow-hidden rounded-lg border", working === photo.id && "opacity-50")}>
                  <MediaThumb src={sizedPhoto(photo.url, 500)} className="h-32 w-full rounded-none border-0" />
                  <div className="flex items-center justify-between gap-1 p-1.5">
                    <Button size="sm" variant="ghost" onClick={() => void putOnCard(photo)} disabled={isCard || Boolean(working) || uploading}>
                      <Star className={cn(isCard && "fill-current text-primary")} aria-hidden />
                      {isCard ? t("photos.isCard") : t("photos.useCard")}
                    </Button>
                    <Button size="icon" variant="ghost" aria-label={tc("delete")} onClick={() => setToDelete(photo)} disabled={Boolean(working) || uploading} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <ConfirmDelete open={toDelete !== null} name={t("photos.thisPhoto")} onCancel={() => setToDelete(null)} onConfirm={() => void remove()} />
    </AdminDialog>
  );
}
