"use client";

import React, { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertCircle, Check, CircleCheck, Clock, FlaskConical, Loader2, Pencil, Plus, RefreshCw, Trash2, Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DRIVER_REVIEW_CARS, DRIVER_REVIEW_LIMITS, DRIVER_REVIEW_LOCALES, validateDriverReview,
  type AdminDriverReview, type DriverReviewCar, type DriverReviewInput, type DriverReviewLocale,
} from "@/lib/driver-reviews";
import { PageHeader } from "./page-header";
import { AdminDialog } from "./admin-dialog";
import { AdminSelect } from "./admin-select";

type Filter = "all" | "approved" | "pending" | "samples";
type Busy = "approve" | "unpublish" | "delete";

/** Admin-only calls. A 401 means the session ended (expired, or password changed). */
class SessionEnded extends Error {}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (res.status === 401) throw new SessionEnded();
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  return (await res.json()) as T;
}

type LoadResult = { items: AdminDriverReview[] } | { error: "load" | "notConfigured" } | { sessionEnded: true };

async function fetchAll(): Promise<LoadResult> {
  try {
    return await api<{ items: AdminDriverReview[] }>("/api/admin/driver-reviews");
  } catch (err) {
    if (err instanceof SessionEnded) return { sessionEnded: true };
    return { error: (err as { status?: number }).status === 503 ? "notConfigured" : "load" };
  }
}

const EMPTY: DriverReviewInput = { client: "", car: "sedan", comment: { en: "", fr: "" }, sample: false };

/** Driver page reviews: write, edit, approve and replace the sample ones. */
export function DriverReviewsAdmin() {
  const t = useTranslations("Admin.driverReviews");
  const tc = useTranslations("Admin.common");
  const tv = useTranslations("BookingForm.vehicles");
  const format = useFormatter();
  const router = useRouter();

  const [items, setItems] = useState<AdminDriverReview[] | null>(null);
  const [loadError, setLoadError] = useState<"load" | "notConfigured" | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<Record<string, Busy>>({});
  const [toDelete, setToDelete] = useState<AdminDriverReview | null>(null);
  /** The review being edited, "new" for the add form, or null when closed. */
  const [editing, setEditing] = useState<AdminDriverReview | "new" | null>(null);

  const carName = (car: DriverReviewCar) => tv(`${car}.name`);

  const sessionEnded = useCallback(() => {
    toast.error(tc("sessionEnded"));
    router.refresh();
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

  const replace = (updated: AdminDriverReview) =>
    setItems((list) => list?.map((x) => (x.id === updated.id ? updated : x)) ?? list);

  const setStatus = async (item: AdminDriverReview, status: "approved" | "pending") => {
    markBusy(item.id, status === "approved" ? "approve" : "unpublish");
    try {
      const { item: updated } = await api<{ item: AdminDriverReview }>(`/api/admin/driver-reviews/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      replace(updated);
      toast.success(status === "approved" ? t("approvedToast") : t("unpublishedToast"));
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
      await api(`/api/admin/driver-reviews/${item.id}`, { method: "DELETE" });
      setItems((list) => list?.filter((x) => x.id !== item.id) ?? list);
      toast.success(t("deletedToast"));
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      toast.error(t("actionError"));
    } finally {
      markBusy(item.id, null);
    }
  };

  const saved = (item: AdminDriverReview, isNew: boolean) => {
    setItems((list) => (isNew ? [...(list ?? []), item] : (list ?? []).map((x) => (x.id === item.id ? item : x))));
    setEditing(null);
    toast.success(isNew ? t("createdToast") : t("savedToast"));
  };

  const all = items ?? [];
  const counts: Record<Filter, number> = {
    all: all.length,
    approved: all.filter((i) => i.status === "approved").length,
    pending: all.filter((i) => i.status === "pending").length,
    samples: all.filter((i) => i.sample).length,
  };
  const visible = all.filter((i) =>
    filter === "all" ? true : filter === "samples" ? i.sample : i.status === filter,
  );
  const when = (ms: number) => format.dateTime(new Date(ms), { dateStyle: "medium" });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={reload} disabled={loading}>
              <RefreshCw className={cn(loading && "animate-spin")} aria-hidden />
              {t("refresh")}
            </Button>
            <Button onClick={() => setEditing("new")} disabled={Boolean(loadError) || items === null}>
              <Plus aria-hidden />
              {t("add")}
            </Button>
          </>
        }
      />

      {counts.samples > 0 && (
        <div role="note" className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/40 px-4 py-3 text-sm">
          <FlaskConical className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p>{t("samplesNote", { count: counts.samples })}</p>
        </div>
      )}

      <section aria-label={t("title")} className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
        <div className="flex gap-1 overflow-x-auto border-b px-4 py-2.5" role="group" aria-label={t("filterLabel")}>
          {(["all", "approved", "pending", "samples"] as Filter[]).map((f) => (
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
            {[0, 1].map((i) => (
              <div key={i} className="space-y-2 p-5">
                <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full max-w-md animate-pulse rounded bg-muted" />
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
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{item.client}</p>
                      <p className="text-sm text-muted-foreground">{carName(item.car)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.sample && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
                          <FlaskConical className="size-3.5" aria-hidden />
                          {t("sampleBadge")}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium">
                        {pending ? (
                          <Clock className="size-3.5 text-[var(--status-pending)]" aria-hidden />
                        ) : (
                          <CircleCheck className="size-3.5 text-[var(--status-confirmed)]" aria-hidden />
                        )}
                        {t(`status.${item.status}`)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("updated", { date: when(item.updatedAt) })}
                    {!item.comment.fr && ` · ${t("noFrench")}`}
                  </p>

                  <p className="mt-3 max-w-3xl text-sm leading-relaxed [overflow-wrap:anywhere]">{item.comment.en}</p>

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
                    <Button size="sm" variant="outline" onClick={() => setEditing(item)} disabled={Boolean(doing)}>
                      <Pencil aria-hidden />
                      {t("edit")}
                    </Button>
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
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editing !== null && (
        <ReviewEditor
          key={editing === "new" ? "new" : editing.id}
          review={editing === "new" ? null : editing}
          carName={carName}
          onClose={() => setEditing(null)}
          onSaved={saved}
          onSessionEnded={sessionEnded}
        />
      )}

      <AdminDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={t("confirmTitle")}
        description={toDelete ? t("confirmDelete", { name: toDelete.client }) : undefined}
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

/** Add or edit one review. New reviews are saved as pending until approved. */
function ReviewEditor({
  review,
  carName,
  onClose,
  onSaved,
  onSessionEnded,
}: {
  review: AdminDriverReview | null;
  carName: (car: DriverReviewCar) => string;
  onClose: () => void;
  onSaved: (item: AdminDriverReview, isNew: boolean) => void;
  onSessionEnded: () => void;
}) {
  const t = useTranslations("Admin.driverReviews");
  const tc = useTranslations("Admin.common");
  const formId = useId();
  const isNew = review === null;

  const [draft, setDraft] = useState<DriverReviewInput>(() =>
    review ? { client: review.client, car: review.car, comment: { ...review.comment }, sample: review.sample } : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof DriverReviewInput>(key: K, value: DriverReviewInput[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setComment = (l: DriverReviewLocale, value: string) =>
    setDraft((d) => ({ ...d, comment: { ...d.comment, [l]: value } }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value: DriverReviewInput = {
      ...draft,
      client: draft.client.trim(),
      comment: { en: draft.comment.en.trim(), fr: draft.comment.fr.trim() },
    };
    const found = validateDriverReview(value);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const { item } = await api<{ item: AdminDriverReview }>(
        isNew ? "/api/admin/driver-reviews" : `/api/admin/driver-reviews/${review.id}`,
        { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) },
      );
      onSaved(item, isNew);
    } catch (err) {
      if (err instanceof SessionEnded) return onSessionEnded();
      toast.error((err as { status?: number }).status === 409 ? t("tooMany") : t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const errorText = (key: string) => (errors[key] ? t(`errors.${errors[key]}`) : undefined);

  return (
    <AdminDialog
      open
      onClose={onClose}
      title={isNew ? t("addTitle") : t("editTitle")}
      description={isNew ? t("addHint") : undefined}
      closeLabel={tc("close")}
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{tc("cancel")}</Button>
          <Button type="submit" form={formId} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
            {t("save")}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={(e) => void submit(e)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("client")} hint={t("clientHint")} error={errorText("client")} required>
            <Input
              value={draft.client}
              onChange={(e) => set("client", e.target.value)}
              maxLength={DRIVER_REVIEW_LIMITS.client}
              autoComplete="off"
            />
          </Field>
          <Field label={t("car")} error={errorText("car")} required>
            <AdminSelect value={draft.car} onChange={(e) => set("car", e.target.value as DriverReviewCar)}>
              {DRIVER_REVIEW_CARS.map((c) => (
                <option key={c} value={c}>{carName(c)}</option>
              ))}
            </AdminSelect>
          </Field>
        </div>

        {DRIVER_REVIEW_LOCALES.map((l) => (
          <Field
            key={l}
            label={t(`comment.${l}`)}
            hint={l === "fr" ? t("frenchHint") : undefined}
            error={errorText(`comment.${l}`)}
            required={l === "en"}
          >
            <Textarea
              value={draft.comment[l]}
              onChange={(e) => setComment(l, e.target.value)}
              rows={4}
              maxLength={DRIVER_REVIEW_LIMITS.comment}
              placeholder={l === "fr" ? draft.comment.en : undefined}
            />
          </Field>
        ))}

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
          <input
            type="checkbox"
            checked={draft.sample}
            onChange={(e) => set("sample", e.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            <span className="block text-sm font-medium">{t("sampleLabel")}</span>
            <span className="block text-xs text-muted-foreground">{t("sampleHint")}</span>
          </span>
        </label>
      </form>
    </AdminDialog>
  );
}

/** Label + control + hint/error, wired together for screen readers. */
function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactElement<Record<string, unknown>>;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-muted-foreground" aria-hidden>*</span>}
      </Label>
      {React.cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": note ? noteId : undefined,
        "aria-required": required || undefined,
      })}
      {note && (
        <p id={noteId} className={cn("text-xs", error ? "font-medium text-destructive" : "text-muted-foreground")}>
          {note}
        </p>
      )}
    </div>
  );
}
