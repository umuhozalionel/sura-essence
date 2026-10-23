"use client";

/**
 * Building blocks shared by the CMS screens (Experiences, Tours, Trip alerts,
 * Site settings, Fleet & rates). Same look and behaviour as the Driver reviews
 * and Board screens: filter chips, skeleton rows, sonner toasts, a 401 sends
 * you back to the sign-in form. Every request is made with cache: "no-store".
 */
import React, { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertCircle, ArrowDown, ArrowUp, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CMS_LOCALES, type CmsLocale } from "@/lib/cms/localized";
import { SessionEnded, boardApi } from "../board-shared";
import { AdminDialog } from "../admin-dialog";

/* ─── networking ─────────────────────────────────────────────────────── */

export { SessionEnded };

/** fetch with cache: "no-store". Throws SessionEnded on 401, else an Error with { status, error, reason, field }. */
export const cmsApi = boardApi;

export type ApiError = { status?: number; error?: string; reason?: string; field?: string };
export const apiError = (err: unknown) => err as ApiError;

export const jsonInit = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body ?? {}),
});

/** A toast and a refresh, which makes the admin layout show the sign-in form. */
export function useSessionEnded() {
  const tc = useTranslations("Admin.common");
  const router = useRouter();
  return useCallback(() => {
    toast.error(tc("sessionEnded"));
    router.refresh();
  }, [router, tc]);
}

type LoadError = "load" | "notConfigured";
type LoadResult<T> = { items: T[] } | { error: LoadError } | { sessionEnded: true };

/** Loads `url` (which answers { items }) on mount, with reload, loading and error state. */
export function useAdminList<T>(url: string) {
  const sessionEnded = useSessionEnded();
  const [items, setItems] = useState<T[] | null>(null);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<LoadResult<T>> => {
    try {
      const { items: next } = await cmsApi<{ items: T[] }>(url);
      return { items: next };
    } catch (err) {
      if (err instanceof SessionEnded) return { sessionEnded: true };
      return { error: apiError(err).status === 503 ? "notConfigured" : "load" };
    }
  }, [url]);

  const apply = useCallback(
    (r: LoadResult<T>) => {
      if ("sessionEnded" in r) return sessionEnded();
      if ("error" in r) setLoadError(r.error);
      else {
        setItems(r.items);
        setLoadError(null);
      }
      setLoading(false);
    },
    [sessionEnded],
  );

  useEffect(() => {
    let live = true;
    void load().then((r) => {
      if (live) apply(r);
    });
    return () => {
      live = false;
    };
  }, [load, apply]);

  const reload = useCallback(() => {
    setLoading(true);
    void load().then(apply);
  }, [load, apply]);

  return { items, setItems, loadError, loading, reload, sessionEnded };
}

/** Which rows have a request in flight, and what kind. */
export function useBusy<B extends string>() {
  const [busy, setBusy] = useState<Record<string, B>>({});
  const mark = useCallback(
    (id: string, what: B | null) =>
      setBusy((b) => {
        const next = { ...b };
        if (what) next[id] = what;
        else delete next[id];
        return next;
      }),
    [],
  );
  return [busy, mark] as const;
}

/* ─── list pieces ────────────────────────────────────────────────────── */

export function FilterChips<F extends string>({
  filters,
  value,
  onChange,
  counts,
  label,
  labelFor,
  format,
}: {
  filters: readonly F[];
  value: F;
  onChange: (f: F) => void;
  counts: Record<F, number>;
  label: string;
  labelFor: (f: F) => string;
  format: (n: number) => string;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b px-4 py-2.5" role="group" aria-label={label}>
      {filters.map((f) => (
        <button
          key={f}
          type="button"
          aria-pressed={value === f}
          onClick={() => onChange(f)}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            value === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {labelFor(f)}
          <span className="text-xs tabular-nums opacity-80">{format(counts[f])}</span>
        </button>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4 p-5">
          <div className="h-16 w-24 animate-pulse rounded-lg bg-muted" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full max-w-md animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadErrorRow({ kind, onRetry }: { kind: LoadError; onRetry: () => void }) {
  const t = useTranslations("Admin.cms");
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 px-5 py-10 text-sm">
      <AlertCircle className="size-5 text-destructive" aria-hidden />
      {kind === "notConfigured" ? t("notConfigured") : t("loadError")}
      {kind === "load" && (
        <Button variant="link" className="h-auto p-0" onClick={onRetry}>{t("retry")}</Button>
      )}
    </div>
  );
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-16 text-center text-sm text-muted-foreground">{children}</p>;
}

export type PillTone = "live" | "draft" | "muted" | "warning";

export function StatusPill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tone === "live" && "border-[var(--status-confirmed)]/40 bg-background",
        tone === "draft" && "border-dashed bg-background text-muted-foreground",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "warning" && "border-destructive/40 bg-destructive/5 text-destructive",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          tone === "live" ? "bg-[var(--status-confirmed)]" : tone === "warning" ? "bg-destructive" : "bg-muted-foreground/60",
        )}
      />
      {children}
    </span>
  );
}

/** A small image from /public, or a plain tile when the path is empty or broken. */
export function MediaThumb({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <div className={cn("relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border bg-gradient-to-br from-[#125740] to-[#0A1128]", className)}>
      {src && failed !== src && (
        // Local /public files shown as they are; this is an admin preview, not a public page.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" loading="lazy" onError={() => setFailed(src)} />
      )}
    </div>
  );
}

/** Delete confirmation, shared by every screen. */
export function ConfirmDelete({ name, open, onCancel, onConfirm }: { name: string; open: boolean; onCancel: () => void; onConfirm: () => void }) {
  const t = useTranslations("Admin.cms");
  const tc = useTranslations("Admin.common");
  return (
    <AdminDialog
      open={open}
      onClose={onCancel}
      title={t("confirmTitle")}
      description={t("confirmDelete", { name })}
      closeLabel={tc("close")}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>{tc("cancel")}</Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 aria-hidden />
            {t("confirmYes")}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{t("confirmNote")}</p>
    </AdminDialog>
  );
}

/** Up / down buttons for ordered lists. */
export function MoveButtons({ index, count, onMove, disabled }: { index: number; count: number; onMove: (delta: -1 | 1) => void; disabled?: boolean }) {
  const t = useTranslations("Admin.cms");
  return (
    <div className="flex">
      <Button type="button" size="icon" variant="ghost" className="size-8" aria-label={t("moveUp")} disabled={disabled || index === 0} onClick={() => onMove(-1)}>
        <ArrowUp aria-hidden />
      </Button>
      <Button type="button" size="icon" variant="ghost" className="size-8" aria-label={t("moveDown")} disabled={disabled || index === count - 1} onClick={() => onMove(1)}>
        <ArrowDown aria-hidden />
      </Button>
    </div>
  );
}

export const moveItem = <T,>(list: T[], index: number, delta: -1 | 1): T[] => {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export const removeAt = <T,>(list: T[], index: number): T[] => list.filter((_, i) => i !== index);

export const replaceAt = <T,>(list: T[], index: number, value: T): T[] => list.map((x, i) => (i === index ? value : x));

/* ─── form pieces ────────────────────────────────────────────────────── */

/** Label + control + hint/error, wired together for screen readers. */
export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactElement<Record<string, unknown>>;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;
  return (
    <div className={cn("space-y-2", className)}>
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

export function CheckRow({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 accent-primary" />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

/** EN | FR switch for the localized fields of a form. A dot marks a language with an error. */
export function LangSwitch({ value, onChange, flagged = [] }: { value: CmsLocale; onChange: (l: CmsLocale) => void; flagged?: CmsLocale[] }) {
  const t = useTranslations("Admin.cms");
  return (
    <div className="inline-flex rounded-lg border bg-muted p-1" role="group" aria-label={t("language")}>
      {CMS_LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={value === l}
          onClick={() => onChange(l)}
          className={cn(
            "relative inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            value === l ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(`lang.${l}`)}
          {flagged.includes(l) && <span className="absolute top-1 right-1 size-1.5 rounded-full bg-destructive" aria-label={t("langHasError")} />}
        </button>
      ))}
    </div>
  );
}

/** Section heading inside a long form. */
export function FormSection({ title, hint, action, children }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <div className="flex items-end justify-between gap-3 border-b pb-2">
        <div>
          <legend className="text-sm font-semibold">{title}</legend>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </fieldset>
  );
}

/** A repeated block (a gallery item, a price tier…) with move and remove buttons. */
export function RepeatCard({
  index,
  count,
  onMove,
  onRemove,
  children,
}: {
  index: number;
  count: number;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslations("Admin.cms");
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground tabular-nums">#{index + 1}</span>
        <div className="flex items-center">
          <MoveButtons index={index} count={count} onMove={onMove} />
          <Button type="button" size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" aria-label={t("remove")} onClick={onRemove}>
            <X aria-hidden />
          </Button>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/** Banner at the top of a form for a problem that isn't tied to one visible field. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
      {message}
    </p>
  );
}

/** Save button with a spinner. */
export function SaveButton({ form, saving, label }: { form: string; saving: boolean; label: string }) {
  return (
    <Button type="submit" form={form} disabled={saving}>
      {saving && <Loader2 className="animate-spin" aria-hidden />}
      {label}
    </Button>
  );
}

/**
 * Turns an API error into what a form shows: `fieldErrors` for the field the
 * server named, plus a banner message. The language of the field is returned
 * so the form can switch to it.
 */
export function useApiErrors() {
  const t = useTranslations("Admin.cms");
  return useCallback(
    (err: unknown): { fields: Record<string, string>; banner: string; lang: CmsLocale | null } => {
      const e = apiError(err);
      if (e.status === 400 && e.field && e.reason) {
        const reason = t.has(`errors.${e.reason}`) ? t(`errors.${e.reason}`) : t("errors.invalid");
        const lang = e.field.endsWith(".fr") || e.field.includes(".fr.") ? "fr" : e.field.endsWith(".en") || e.field.includes(".en.") ? "en" : null;
        return { fields: { [e.field]: reason }, banner: t("fieldProblem", { field: e.field, reason }), lang };
      }
      if (e.status === 409 && e.error === "slug_taken") return { fields: { slug: t("errors.slugTaken") }, banner: t("errors.slugTaken"), lang: null };
      if (e.status === 413) return { fields: {}, banner: t("errors.tooLarge"), lang: null };
      return { fields: {}, banner: t("saveError"), lang: null };
    },
    [t],
  );
}

/** Lines of a textarea ↔ a list of strings (blank lines dropped). */
export const linesToList = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
export const listToLines = (l: string[]) => l.join("\n");

/** Paragraphs separated by a blank line ↔ a list of paragraphs. */
export const textToParagraphs = (s: string) => s.split(/\n\s*\n/).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);
export const paragraphsToText = (l: string[]) => l.join("\n\n");
