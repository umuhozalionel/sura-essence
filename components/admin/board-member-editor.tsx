"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImageUp, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PHOTO_ACCEPT, PhotoProblem, preparePhoto } from "@/lib/photo";
import {
  BOARD_LIMITS, BOARD_LOCALES, BOARD_PHOTO, SOCIAL_LABEL, SOCIAL_PLATFORMS,
  fromParagraphs, toParagraphs, validateBoardMember,
  type AdminBoardMember, type BoardLocale, type BoardMemberInput, type BoardPhotoMime, type SocialPlatform,
} from "@/lib/board-members";
import { AdminDialog } from "./admin-dialog";
import { AdminSelect } from "./admin-select";
import { Thumb, SessionEnded, boardApi } from "./board-shared";

type Draft = {
  name: string;
  email: string;
  visible: boolean;
  imageUrl: string;
  role: Record<BoardLocale, string>;
  tagline: Record<BoardLocale, string>;
  bio: Record<BoardLocale, string>;
  socials: { key: number; platform: SocialPlatform; url: string }[];
};

/** What the photo control holds: keep what's stored, a new upload, or remove it. */
type PhotoState =
  | { kind: "keep" }
  | { kind: "new"; mime: BoardPhotoMime; base64: string; preview: string; bytes: number }
  | { kind: "remove" };

let socialKey = 0;

function toDraft(m: AdminBoardMember | null): Draft {
  return {
    name: m?.name ?? "",
    email: m?.email ?? "",
    visible: m?.visible ?? true,
    imageUrl: m?.imageUrl ?? "",
    role: { en: m?.role.en ?? "", fr: m?.role.fr ?? "" },
    tagline: { en: m?.tagline.en ?? "", fr: m?.tagline.fr ?? "" },
    bio: { en: fromParagraphs(m?.bio.en ?? []), fr: fromParagraphs(m?.bio.fr ?? []) },
    socials: (m?.socials ?? []).map((s) => ({ key: ++socialKey, ...s })),
  };
}

function toInput(d: Draft): Omit<BoardMemberInput, "photo"> {
  return {
    name: d.name.trim(),
    email: d.email.trim(),
    visible: d.visible,
    imageUrl: d.imageUrl.trim(),
    role: { en: d.role.en.trim(), fr: d.role.fr.trim() },
    tagline: { en: d.tagline.en.trim(), fr: d.tagline.fr.trim() },
    bio: { en: toParagraphs(d.bio.en), fr: toParagraphs(d.bio.fr) },
    socials: d.socials.map(({ platform, url }) => ({ platform, url: url.trim() })).filter((s) => s.url),
  };
}

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/** Add / edit dialog. `member`: "new" to add, a member to edit, null when closed. */
export function BoardMemberEditor({
  member,
  onClose,
  onSaved,
  onSessionEnded,
}: {
  member: AdminBoardMember | "new" | null;
  onClose: () => void;
  onSaved: (saved: AdminBoardMember, created: boolean) => void;
  onSessionEnded: () => void;
}) {
  const t = useTranslations("Admin.team.editor");
  const tc = useTranslations("Admin.common");
  const formId = useId();
  const open = member !== null;
  const existing = member && member !== "new" ? member : null;

  // The parent gives this component a new `key` per member, so every opening starts from a fresh form.
  const [draft, setDraft] = useState<Draft>(() => toDraft(existing));
  const [photo, setPhoto] = useState<PhotoState>({ kind: "keep" });
  const [lang, setLang] = useState<BoardLocale>("en");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Free the preview's memory when it's replaced or the dialog closes.
  useEffect(() => {
    if (photo.kind !== "new") return;
    return () => URL.revokeObjectURL(photo.preview);
  }, [photo]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setLocalized = (key: "role" | "tagline" | "bio", value: string) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key], [lang]: value } }));

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    setPreparing(true);
    try {
      const prepared = await preparePhoto(file, BOARD_PHOTO); // 960×1200, EXIF (incl. GPS) removed
      if (prepared.blob.size > BOARD_PHOTO.maxBytes) throw new PhotoProblem("photoSize");
      setPhoto({
        kind: "new",
        mime: prepared.type,
        base64: await blobToBase64(prepared.blob),
        preview: URL.createObjectURL(prepared.blob),
        bytes: prepared.blob.size,
      });
    } catch (err) {
      setPhotoError(t(`photoErrors.${err instanceof PhotoProblem ? err.code : "photoRead"}`));
    } finally {
      setPreparing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const input = toInput(draft);
    const found = validateBoardMember(input);
    const messages = Object.fromEntries(Object.entries(found).map(([k, code]) => [k, t(`errors.${code}`)]));
    setErrors(messages);
    if (Object.keys(found).length) {
      // Jump to the language that has the problem.
      const badLang = BOARD_LOCALES.find((l) => Object.keys(found).some((k) => k.endsWith(`.${l}`)));
      if (badLang && !Object.keys(found).some((k) => k.endsWith(`.${lang}`))) setLang(badLang);
      return;
    }

    const body: BoardMemberInput = { ...input };
    if (photo.kind === "new") body.photo = { mime: photo.mime, base64: photo.base64 };
    if (photo.kind === "remove") body.photo = null;

    setSaving(true);
    try {
      const { item } = await boardApi<{ item: AdminBoardMember }>(
        existing ? `/api/admin/board-members/${existing.id}` : "/api/admin/board-members",
        {
          method: existing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      onSaved(item, !existing);
    } catch (err) {
      if (err instanceof SessionEnded) return onSessionEnded();
      const e2 = err as { status?: number; reason?: string; field?: string };
      if (e2.status === 400 && e2.field && e2.reason) {
        setErrors({ [e2.field]: t(`errors.${e2.reason}` as "errors.nameRequired") });
      } else {
        setFormError(
          e2.status === 409 ? t("tooMany", { max: BOARD_LIMITS.members })
          : e2.status === 413 || e2.reason?.startsWith("photo") ? t("photoErrors.photoSize")
          : t("saveError"),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const storedUpload = existing?.uploadedPhotoUrl && photo.kind === "keep" ? existing.uploadedPhotoUrl : null;
  const previewSrc = photo.kind === "new" ? photo.preview : storedUpload;
  const hasUpload = photo.kind === "new" || Boolean(storedUpload);
  const langError = (l: BoardLocale) => ["role", "tagline", "bio"].some((k) => errors[`${k}.${l}`]);

  return (
    <AdminDialog
      open={open}
      onClose={() => !saving && onClose()}
      title={existing ? t("titleEdit", { name: existing.name }) : t("titleNew")}
      description={t("description")}
      closeLabel={tc("close")}
      size="lg"
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{tc("cancel")}</Button>
          <Button type="submit" form={formId} disabled={saving || preparing}>
            {saving && <Loader2 className="animate-spin" aria-hidden />}
            {saving ? t("saving") : existing ? t("save") : t("create")}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="space-y-8">
        {formError && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
            {formError}
          </p>
        )}

        {/* PROFILE + PHOTO */}
        <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
          <div className="space-y-3">
            <p className="text-sm font-medium">{t("photo")}</p>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border bg-muted">
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewSrc} alt={t("previewAlt")} className="size-full object-cover" />
              ) : (
                <Thumb
                  item={{ name: draft.name || "?", imageUrl: draft.imageUrl.trim(), uploadedPhotoUrl: null }}
                  className="absolute inset-0 size-full rounded-none border-0 [&>span]:text-3xl"
                />
              )}
              {preparing && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <Loader2 className="size-6 animate-spin text-primary" aria-label={t("preparingPhoto")} />
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={PHOTO_ACCEPT}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => void pickPhoto(e.target.files?.[0])}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={preparing}>
                <ImageUp aria-hidden />
                {hasUpload ? t("replacePhoto") : t("uploadPhoto")}
              </Button>
              {hasUpload && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setPhoto(storedUpload || existing?.uploadedPhotoUrl ? { kind: "remove" } : { kind: "keep" })}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 aria-hidden />
                  {t("removePhoto")}
                </Button>
              )}
            </div>
            <p className={cn("text-xs", photoError ? "font-medium text-destructive" : "text-muted-foreground")} role={photoError ? "alert" : undefined}>
              {photoError ?? t("photoHint")}
            </p>
          </div>

          <div className="space-y-4">
            <Field label={t("name")} required error={errors.name}>
              <Input value={draft.name} onChange={(e) => set("name", e.target.value)} maxLength={BOARD_LIMITS.name} autoComplete="off" />
            </Field>
            <Field label={t("email")} hint={t("emailHint")} error={errors.email}>
              <Input type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} maxLength={BOARD_LIMITS.email} autoComplete="off" placeholder="name@suraessence.com" />
            </Field>
            <Field label={t("imageUrl")} hint={hasUpload ? t("imageUrlHintUploaded") : t("imageUrlHint")} error={errors.imageUrl}>
              <Input value={draft.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} maxLength={BOARD_LIMITS.imageUrl} autoComplete="off" placeholder="https://…" />
            </Field>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <input
                type="checkbox"
                checked={draft.visible}
                onChange={(e) => set("visible", e.target.checked)}
                className="mt-0.5 size-4 accent-primary"
              />
              <span>
                <span className="block text-sm font-medium">{t("visible")}</span>
                <span className="block text-xs text-muted-foreground">{t("visibleHint")}</span>
              </span>
            </label>
          </div>
        </div>

        {/* TEXT, PER LANGUAGE */}
        <fieldset className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("textSection")}</legend>
            <div role="tablist" aria-label={t("language")} className="inline-flex rounded-lg border bg-muted p-1">
              {BOARD_LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  role="tab"
                  aria-selected={lang === l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "relative inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    lang === l ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(`languages.${l}`)}
                  {langError(l) && <span className="size-1.5 rounded-full bg-destructive" aria-label={t("hasErrors")} />}
                </button>
              ))}
            </div>
          </div>
          {lang === "fr" && <p className="text-xs text-muted-foreground">{t("frenchHint")}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("role")} required={lang === "en"} error={errors[`role.${lang}`]}>
              <Input
                value={draft.role[lang]}
                onChange={(e) => setLocalized("role", e.target.value)}
                maxLength={BOARD_LIMITS.role}
                placeholder={lang === "fr" ? draft.role.en : t("rolePlaceholder")}
                autoComplete="off"
              />
            </Field>
            <Field label={t("tagline")} error={errors[`tagline.${lang}`]}>
              <Input
                value={draft.tagline[lang]}
                onChange={(e) => setLocalized("tagline", e.target.value)}
                maxLength={BOARD_LIMITS.tagline}
                placeholder={lang === "fr" ? draft.tagline.en : undefined}
                autoComplete="off"
              />
            </Field>
            <Field label={t("bio")} hint={t("bioHint")} error={errors[`bio.${lang}`]} wide>
              <Textarea
                value={draft.bio[lang]}
                onChange={(e) => setLocalized("bio", e.target.value)}
                rows={7}
                className="min-h-40"
                placeholder={lang === "fr" ? draft.bio.en : undefined}
              />
            </Field>
          </div>
        </fieldset>

        {/* SOCIAL LINKS */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("socials")}</legend>
          {draft.socials.length === 0 && <p className="text-sm text-muted-foreground">{t("noSocials")}</p>}
          <ul className="space-y-2">
            {draft.socials.map((s, i) => (
              <li key={s.key}>
                <div className="flex gap-2">
                  <AdminSelect
                    className="w-40 shrink-0"
                    value={s.platform}
                    aria-label={t("platform")}
                    onChange={(e) =>
                      set("socials", draft.socials.map((x) => (x.key === s.key ? { ...x, platform: e.target.value as SocialPlatform } : x)))
                    }
                  >
                    {SOCIAL_PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p === "website" ? t("website") : SOCIAL_LABEL[p]}</option>
                    ))}
                  </AdminSelect>
                  <Input
                    value={s.url}
                    aria-label={t("url")}
                    aria-invalid={errors[`socials.${i}`] ? true : undefined}
                    placeholder="https://…"
                    maxLength={BOARD_LIMITS.url}
                    autoComplete="off"
                    onChange={(e) => set("socials", draft.socials.map((x) => (x.key === s.key ? { ...x, url: e.target.value } : x)))}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={t("removeLink")}
                    onClick={() => set("socials", draft.socials.filter((x) => x.key !== s.key))}
                  >
                    <X aria-hidden />
                  </Button>
                </div>
                {errors[`socials.${i}`] && <p className="mt-1 text-xs font-medium text-destructive">{errors[`socials.${i}`]}</p>}
              </li>
            ))}
          </ul>
          {draft.socials.length < BOARD_LIMITS.socials && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => set("socials", [...draft.socials, { key: ++socialKey, platform: "linkedin", url: "" }])}
            >
              <Plus aria-hidden />
              {t("addLink")}
            </Button>
          )}
        </fieldset>
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
  wide,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  wide?: boolean;
  children: React.ReactElement<Record<string, unknown>>;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;
  return (
    <div className={cn("space-y-2", wide && "sm:col-span-2")}>
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
