"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { AlertCircle, Check, ImagePlus, Loader2, PenLine, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PHOTO_ACCEPT, PhotoProblem, preparePhoto, type PhotoError, type PreparedPhoto } from "@/lib/photo";
import {
  LIMITS, SubmitError, validate,
  type Locale, type Submission, type SubmitErrorCode, type Testimonial,
} from "@/lib/testimonials";

type Props = {
  /** false when MONGODB_URI isn't set — the form explains and won't submit */
  enabled: boolean;
  submit: (input: Submission) => Promise<Testimonial>;
  onSubmitted: (item: Testimonial) => void;
  onClose: () => void;
};

type Phase = "idle" | "saving" | "success";
type Field = "name" | "profession" | "comment" | "consent";

const SUBMIT_TIMEOUT_MS = 30_000;
const ERROR_TEXT = "text-[#B42318]";

export function TestimonialForm({ enabled, submit, onSubmitted, onClose }: Props) {
  const t = useTranslations("Testimonials.form");
  const locale = useLocale() as Locale;

  const titleId = useId();
  const subtitleId = useId();
  const fieldId = useId();
  const id = (f: string) => `${fieldId}-${f}`;

  const panelRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [values, setValues] = useState({ name: "", profession: "", comment: "", consent: false, website: "" });
  const [showErrors, setShowErrors] = useState(false);
  const [photo, setPhoto] = useState<{ prepared: PreparedPhoto; url: string } | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<PhotoError | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [submitError, setSubmitError] = useState<SubmitErrorCode | null>(null);

  const sending = phase === "saving";
  const errors = validate(values);
  const visibleErrors = showErrors ? errors : {};

  /* ── dialog behaviour: scroll lock, focus in/out, Esc, Tab trap ── */
  const requestClose = useCallback(() => {
    if (!sending) onClose();
  }, [sending, onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    const focusTimer = window.setTimeout(() => document.getElementById(id("name"))?.focus(), 60);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      opener?.focus?.({ preventScroll: true });
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per opening
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose]);

  /* ── photo ── */
  const pickPhoto = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    setPhotoBusy(true);
    try {
      const prepared = await preparePhoto(file); // 320×320 WebP, EXIF (incl. GPS) removed
      const url = URL.createObjectURL(prepared.blob);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = url;
      setPhoto({ prepared, url });
    } catch (err) {
      setPhotoError(err instanceof PhotoProblem ? err.code : "photoRead");
    } finally {
      setPhotoBusy(false);
    }
  }, []);

  const removePhoto = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPhoto(null);
    setPhotoError(null);
  };

  /* ── submit ── */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || photoBusy) return;
    setSubmitError(null);

    const found = validate(values);
    const firstInvalid = (["name", "profession", "comment", "consent"] as Field[]).find((f) => found[f]);
    if (firstInvalid) {
      setShowErrors(true);
      document.getElementById(id(firstInvalid))?.focus();
      return;
    }
    if (!enabled) {
      setSubmitError("notConfigured");
      return;
    }
    // Honeypot: real people never see this field. Bots that fill it get a
    // polite "thank you" and nothing is saved.
    if (values.website) {
      setPhase("success");
      return;
    }

    try {
      setPhase("saving");
      const item = await withTimeout(
        submit({
          name: values.name,
          profession: values.profession,
          comment: values.comment,
          locale,
          photo: photo?.prepared ?? null,
        }),
        SUBMIT_TIMEOUT_MS,
      );
      onSubmitted(item);
      setPhase("success");
    } catch (err) {
      setPhase("idle");
      setSubmitError(err instanceof SubmitError ? err.code : "network");
    }
  };

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const commentCount = values.comment.trim().length;
  const errorText = (f: Field) => {
    const code = visibleErrors[f];
    if (!code) return null;
    if (code === "commentShort") return t("errors.commentShort", { min: LIMITS.comment.min });
    if (code === "commentLong") return t("errors.commentLong", { max: LIMITS.comment.max });
    return t(`errors.${code}`);
  };

  const inputClass = (f: Field) =>
    [
      "w-full rounded-2xl bg-[#F9F8F6] px-5 text-[15px] font-medium text-[#0A1128] outline-none transition-all",
      "placeholder:text-[#0A1128]/50 focus:bg-white disabled:opacity-60",
      visibleErrors[f]
        ? "ring-2 ring-[#B42318]/70 focus:ring-[#B42318]"
        : "ring-1 ring-[#0A1128]/10 focus:ring-2 focus:ring-[#125740]",
    ].join(" ");

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0A1128]/60 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitleId}
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-h-[94vh] w-full overflow-y-auto overscroll-contain rounded-t-2xl bg-white/95 shadow-2xl shadow-black/40 ring-1 ring-white/60 backdrop-blur-2xl sm:max-w-2xl sm:rounded-2xl"
      >
        {/* ── Header band ── */}
        <div className="relative overflow-hidden bg-[#125740] px-6 pb-8 pt-7 text-white sm:px-10 sm:pb-10 sm:pt-9">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#EAB308]/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

          <button
            type="button"
            onClick={requestClose}
            disabled={sending}
            aria-label={t("close")}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 disabled:opacity-40 sm:right-6 sm:top-6"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 ring-1 ring-white/20">
              <PenLine className="h-3.5 w-3.5 text-[#EAB308]" aria-hidden />
              <span className="text-[10px] font-black uppercase tracking-[0.25em]">{t("badge")}</span>
            </div>
            <h2 id={titleId} className="pr-12 text-3xl font-black tracking-tight sm:text-4xl">
              {phase === "success" ? t("successTitle") : t("title")}
            </h2>
            <p id={subtitleId} className="mt-3 max-w-lg text-sm font-medium leading-relaxed text-white/80 sm:text-base">
              {phase === "success" ? t("successText") : t("subtitle")}
            </p>
          </div>
        </div>

        {phase === "success" ? (
          /* ── Success ── */
          <div className="flex flex-col items-center px-6 py-12 text-center sm:px-10">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[#0A1128] shadow-xl"
            >
              <Check className="h-9 w-9 text-[#EAB308]" strokeWidth={3} aria-hidden />
            </motion.div>
            <button
              type="button"
              onClick={onClose}
              autoFocus
              className="inline-flex h-14 items-center justify-center rounded-full bg-[#0A1128] px-10 text-sm font-extrabold text-white shadow-xl transition hover:bg-[#125740]"
            >
              {t("done")}
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <form noValidate onSubmit={onSubmit} className="relative space-y-6 px-6 py-8 sm:px-10 sm:py-10">
            {!enabled && (
              <p className="flex items-start gap-3 rounded-2xl bg-[#EAB308]/15 px-5 py-4 text-sm font-semibold text-[#0A1128] ring-1 ring-[#EAB308]/40">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {t("errors.notConfigured")}
              </p>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <FieldShell label={t("name")} htmlFor={id("name")} error={errorText("name")} errorId={id("name-error")}>
                <input
                  id={id("name")}
                  type="text"
                  autoComplete="name"
                  maxLength={LIMITS.name.max}
                  placeholder={t("namePlaceholder")}
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  disabled={sending}
                  aria-invalid={Boolean(visibleErrors.name)}
                  aria-describedby={visibleErrors.name ? id("name-error") : undefined}
                  className={`${inputClass("name")} h-14`}
                />
              </FieldShell>

              <FieldShell label={t("profession")} htmlFor={id("profession")} error={errorText("profession")} errorId={id("profession-error")}>
                <input
                  id={id("profession")}
                  type="text"
                  autoComplete="organization-title"
                  maxLength={LIMITS.profession.max}
                  placeholder={t("professionPlaceholder")}
                  value={values.profession}
                  onChange={(e) => set("profession", e.target.value)}
                  disabled={sending}
                  aria-invalid={Boolean(visibleErrors.profession)}
                  aria-describedby={visibleErrors.profession ? id("profession-error") : undefined}
                  className={`${inputClass("profession")} h-14`}
                />
              </FieldShell>
            </div>

            <FieldShell
              label={t("comment")}
              htmlFor={id("comment")}
              error={errorText("comment")}
              errorId={id("comment-error")}
              aside={
                <span
                  id={id("comment-count")}
                  className={`text-xs font-bold tabular-nums ${
                    commentCount > LIMITS.comment.max ? ERROR_TEXT : "text-[#0A1128]/60"
                  }`}
                >
                  {t("counter", { count: commentCount, max: LIMITS.comment.max })}
                </span>
              }
            >
              <textarea
                id={id("comment")}
                rows={5}
                maxLength={LIMITS.comment.max}
                placeholder={t("commentPlaceholder")}
                value={values.comment}
                onChange={(e) => set("comment", e.target.value)}
                disabled={sending}
                aria-invalid={Boolean(visibleErrors.comment)}
                aria-describedby={[id("comment-count"), visibleErrors.comment ? id("comment-error") : ""].join(" ").trim()}
                className={`${inputClass("comment")} resize-none py-4 leading-relaxed`}
              />
            </FieldShell>

            {/* ── Photo ── */}
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0A1128]/70">{t("photo")}</span>
                <span className="text-xs font-semibold text-[#0A1128]/60">{t("optional")}</span>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept={PHOTO_ACCEPT}
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  void pickPhoto(e.target.files?.[0]);
                  e.target.value = ""; // allow picking the same file again
                }}
              />

              {photo ? (
                <div className="flex items-center gap-5 rounded-2xl bg-[#F9F8F6] p-4 ring-1 ring-[#0A1128]/10">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                  <img src={photo.url} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover shadow-md ring-2 ring-white" />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={sending || photoBusy}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[#0A1128] ring-1 ring-[#0A1128]/10 transition hover:ring-[#125740] disabled:opacity-50"
                    >
                      <ImagePlus className="h-4 w-4 text-[#125740]" aria-hidden />
                      {t("photoChange")}
                    </button>
                    <button
                      type="button"
                      onClick={removePhoto}
                      disabled={sending || photoBusy}
                      className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-xs font-bold text-[#0A1128]/60 transition hover:text-[#B42318] disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      {t("photoRemove")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    void pickPhoto(e.dataTransfer.files?.[0]);
                  }}
                  disabled={sending || photoBusy}
                  aria-describedby={id("photo-hint")}
                  className={[
                    "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition",
                    dragOver
                      ? "border-[#125740] bg-[#125740]/5"
                      : "border-[#0A1128]/15 bg-[#F9F8F6] hover:border-[#125740]/60",
                  ].join(" ")}
                >
                  {photoBusy ? (
                    <>
                      <Loader2 className="h-7 w-7 animate-spin text-[#125740]" aria-hidden />
                      <span className="text-sm font-semibold text-[#0A1128]/70" role="status">{t("steps.preparing")}</span>
                    </>
                  ) : (
                    <>
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#125740]/10">
                        <ImagePlus className="h-5 w-5 text-[#125740]" aria-hidden />
                      </span>
                      <span className="text-sm font-semibold text-[#0A1128]/80">
                        {t("photoDrop")} <span className="text-[#125740] underline underline-offset-4">{t("photoBrowse")}</span>
                      </span>
                      <span id={id("photo-hint")} className="text-xs font-medium text-[#0A1128]/60">{t("photoHint")}</span>
                    </>
                  )}
                </button>
              )}
              {photoError && (
                <p role="alert" className={`mt-2 text-sm font-semibold ${ERROR_TEXT}`}>{t(`errors.${photoError}`)}</p>
              )}
            </div>

            {/* Honeypot — invisible to people, tempting to bots */}
            <div aria-hidden className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
              <label>
                {t("honeypot")}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.website}
                  onChange={(e) => set("website", e.target.value)}
                />
              </label>
            </div>

            {/* ── Consent ── */}
            <div>
              <label htmlFor={id("consent")} className="flex cursor-pointer items-start gap-3">
                <input
                  id={id("consent")}
                  type="checkbox"
                  checked={values.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                  disabled={sending}
                  aria-invalid={Boolean(visibleErrors.consent)}
                  aria-describedby={visibleErrors.consent ? id("consent-error") : undefined}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-[#125740]"
                />
                <span className="text-sm font-medium leading-relaxed text-[#0A1128]/75">{t("consent")}</span>
              </label>
              {errorText("consent") && (
                <p id={id("consent-error")} className={`mt-2 pl-8 text-sm font-semibold ${ERROR_TEXT}`}>
                  {errorText("consent")}
                </p>
              )}
            </div>

            {submitError && (
              <p role="alert" className="flex items-start gap-3 rounded-2xl bg-[#B42318]/[0.06] px-5 py-4 text-sm font-semibold text-[#B42318] ring-1 ring-[#B42318]/20">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {t(`errors.${submitError}`)}
              </p>
            )}

            {/* ── Actions ── */}
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={requestClose}
                disabled={sending}
                className="inline-flex h-14 items-center justify-center rounded-full px-8 text-sm font-bold text-[#0A1128]/70 transition hover:bg-[#0A1128]/5 hover:text-[#0A1128] disabled:opacity-40"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={sending || photoBusy || !enabled}
                aria-busy={sending}
                className="inline-flex h-14 min-w-[220px] items-center justify-center gap-3 rounded-full bg-[#EAB308] px-8 text-sm font-extrabold text-[#0A1128] shadow-xl shadow-[#EAB308]/25 transition-all hover:bg-[#CA9A04] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    <span role="status">{t("steps.saving")}</span>
                  </>
                ) : (
                  t("submit")
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function FieldShell({
  label, htmlFor, error, errorId, aside, children,
}: {
  label: string;
  htmlFor: string;
  error: string | null;
  errorId: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <label htmlFor={htmlFor} className="text-xs font-bold uppercase tracking-widest text-[#0A1128]/70">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {error && (
        <p id={errorId} className={`mt-2 text-sm font-semibold ${ERROR_TEXT}`}>
          {error}
        </p>
      )}
    </div>
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
