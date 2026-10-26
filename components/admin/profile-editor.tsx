"use client";

import React, { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ExternalLink, FileText, KeyRound, Loader2, LogOut, Trash2, Upload, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PROFILE_LIMITS, type OwnProfile, type ProfileField } from "@/lib/admin-profile";
import { Panel } from "./page-header";
import { AdminDialog } from "./admin-dialog";
import { SignOutButton } from "./admin-header";

/**
 * Settings → My profile: the signed-in person's own details, photo, CV,
 * password and sessions. Everything is saved through /api/admin/profile,
 * which only ever changes this person's own account.
 *
 * Photos and CVs go straight from the browser to Cloudinary with a signature
 * from /api/admin/profile/upload-signature; the server then checks the upload
 * before saving it (lib/cloudinary.ts).
 */

class SessionEnded extends Error {}

async function api<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    cache: "no-store",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401) throw new SessionEnded();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, data });
  return data as T;
}

type ApiError = { status?: number; data?: { error?: string; fields?: Record<string, string> } };
type Kind = "avatar" | "cv";

const ACCEPT: Record<Kind, string[]> = { avatar: ["image/jpeg", "image/png", "image/webp"], cv: ["application/pdf"] };

export function ProfileEditor({
  initial,
  userId,
  uploads,
}: {
  initial: OwnProfile;
  userId: string;
  /** Size limits per kind, or null while uploads aren't set up. */
  uploads: { avatar: number; cv: number } | null;
}) {
  const t = useTranslations("Admin.settings.profile");
  const ta = useTranslations("Admin");
  const router = useRouter();
  const locale = useLocale();
  const [profile, setProfile] = useState(initial);

  const sessionEnded = () => {
    toast.error(ta("common.sessionEnded"));
    router.refresh();
  };

  /** Browser → Cloudinary → our server. false (after a message saying why) when it didn't work. */
  const upload = async (kind: Kind, file: File): Promise<boolean> => {
    if (!uploads) return false;
    if (!ACCEPT[kind].includes(file.type)) {
      toast.error(t(`${kind}.wrongType`));
      return false;
    }
    if (file.size > uploads[kind]) {
      toast.error(t(`${kind}.tooBig`, { mb: Math.round(uploads[kind] / 1024 / 1024) }));
      return false;
    }
    try {
      const sig = await api<{ url: string; fields: Record<string, string | number> }>("/api/admin/profile/upload-signature", "POST", { kind });
      const form = new FormData();
      for (const [k, v] of Object.entries(sig.fields)) form.append(k, String(v));
      form.append("file", file);
      const sent = await fetch(sig.url, { method: "POST", body: form });
      if (!sent.ok) throw Object.assign(new Error("upload"), { status: 502 });
      const reply = (await sent.json()) as { public_id: string; version: number; signature: string };
      const { item } = await api<{ item: OwnProfile }>(`/api/admin/profile/files/${kind}`, "POST", {
        public_id: reply.public_id,
        version: reply.version,
        signature: reply.signature,
      });
      setProfile(item);
      toast.success(t(`${kind}.saved`));
      if (kind === "avatar") router.refresh(); // header photo
      return true;
    } catch (err) {
      if (err instanceof SessionEnded) sessionEnded();
      else toast.error((err as ApiError).status === 503 ? t("uploadsOff") : t("uploadError"));
      return false;
    }
  };

  const removeFile = async (kind: Kind) => {
    try {
      const { item } = await api<{ item: OwnProfile }>(`/api/admin/profile/files/${kind}`, "DELETE");
      setProfile(item);
      toast.success(t(`${kind}.removed`));
      if (kind === "avatar") router.refresh();
    } catch (err) {
      if (err instanceof SessionEnded) sessionEnded();
      else toast.error(t("error"));
    }
  };

  return (
    <div className="space-y-6">
      <DetailsPanel
        profile={profile}
        uploads={uploads}
        onUpload={upload}
        onRemove={removeFile}
        onSaved={(p) => {
          setProfile(p);
          router.refresh(); // the name in the header
        }}
        onSessionEnded={sessionEnded}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <CvPanel profile={profile} userId={userId} uploads={uploads} onUpload={upload} onRemove={removeFile} />
        <SecurityPanel locale={locale} onSessionEnded={sessionEnded} />
      </div>
    </div>
  );
}

/* ─── details + photo ────────────────────────────────────────────────── */

function DetailsPanel({
  profile,
  uploads,
  onUpload,
  onRemove,
  onSaved,
  onSessionEnded,
}: {
  profile: OwnProfile;
  uploads: { avatar: number; cv: number } | null;
  onUpload: (kind: Kind, file: File) => Promise<boolean>;
  onRemove: (kind: Kind) => Promise<void>;
  onSaved: (p: OwnProfile) => void;
  onSessionEnded: () => void;
}) {
  const t = useTranslations("Admin.settings.profile");
  const ta = useTranslations("Admin");
  const [draft, setDraft] = useState({ name: profile.name, title: profile.title, phone: profile.phone, bio: profile.bio });
  const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: ProfileField) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const dirty = (Object.keys(draft) as ProfileField[]).some((k) => draft[k] !== profile[k]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return setErrors({ name: "required" });
    setBusy(true);
    setErrors({});
    try {
      const { item } = await api<{ item: OwnProfile }>("/api/admin/profile", "PATCH", draft);
      onSaved(item);
      setDraft({ name: item.name, title: item.title, phone: item.phone, bio: item.bio });
      toast.success(t("saved"));
    } catch (err) {
      if (err instanceof SessionEnded) onSessionEnded();
      else {
        const { status, data } = err as ApiError;
        if (status === 422 && data?.fields) setErrors(data.fields as Partial<Record<ProfileField, string>>);
        else toast.error(t("error"));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title={t("details.title")} description={t("details.subtitle", { role: ta(`roles.${profile.role}`), email: profile.email })}>
      <form onSubmit={save} className="grid gap-6 md:grid-cols-[auto_1fr]" noValidate>
        <PhotoPicker profile={profile} uploads={uploads} onUpload={onUpload} onRemove={onRemove} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t("fields.name")} error={errors.name} required>
            {(f) => <Input {...f} value={draft.name} onChange={set("name")} maxLength={PROFILE_LIMITS.name} autoComplete="name" />}
          </TextField>
          <TextField label={t("fields.title")} hint={t("fields.titleHint")} error={errors.title}>
            {(f) => <Input {...f} value={draft.title} onChange={set("title")} maxLength={PROFILE_LIMITS.title} autoComplete="organization-title" />}
          </TextField>
          <TextField label={t("fields.phone")} error={errors.phone}>
            {(f) => <Input {...f} type="tel" value={draft.phone} onChange={set("phone")} maxLength={PROFILE_LIMITS.phone} autoComplete="tel" />}
          </TextField>
          <div className="sm:col-span-2">
            <TextField label={t("fields.bio")} hint={t("fields.bioHint", { count: draft.bio.length, max: PROFILE_LIMITS.bio })} error={errors.bio}>
              {(f) => <Textarea {...f} value={draft.bio} onChange={set("bio")} maxLength={PROFILE_LIMITS.bio} rows={5} />}
            </TextField>
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={busy || !dirty}>
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              {t("save")}
            </Button>
          </div>
        </div>
      </form>
    </Panel>
  );
}

function PhotoPicker({
  profile,
  uploads,
  onUpload,
  onRemove,
}: {
  profile: OwnProfile;
  uploads: { avatar: number; cv: number } | null;
  onUpload: (kind: Kind, file: File) => Promise<boolean>;
  onRemove: (kind: Kind) => Promise<void>;
}) {
  const t = useTranslations("Admin.settings.profile.avatar");
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    await onUpload("avatar", file);
    setBusy(false);
  };
  const remove = async () => {
    setBusy(true);
    await onRemove("avatar");
    setBusy(false);
  };
  return (
    <div className="flex flex-col items-center gap-3 md:w-44">
      <div className="relative size-32 overflow-hidden rounded-full border bg-muted">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- already sized and optimised by Cloudinary
          <img src={profile.avatarUrl} alt={t("alt", { name: profile.name })} className="size-full object-cover" />
        ) : (
          <UserRound className="absolute inset-0 m-auto size-12 text-muted-foreground" aria-hidden />
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-6 animate-spin" aria-hidden />
          </span>
        )}
      </div>
      <input ref={input} type="file" accept={ACCEPT.avatar.join(",")} className="sr-only" tabIndex={-1} onChange={pick} aria-hidden />
      {uploads ? (
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()} disabled={busy}>
            <Upload aria-hidden />
            {profile.avatarUrl ? t("replace") : t("upload")}
          </Button>
          {profile.avatarUrl && (
            <Button type="button" size="sm" variant="ghost" onClick={() => void remove()} disabled={busy} aria-label={t("remove")} title={t("remove")}>
              <Trash2 aria-hidden />
            </Button>
          )}
        </div>
      ) : (
        <UploadsOff />
      )}
      {uploads && <p className="text-center text-xs text-muted-foreground">{t("hint", { mb: Math.round(uploads.avatar / 1024 / 1024) })}</p>}
    </div>
  );
}

function UploadsOff({ className = "text-center" }: { className?: string }) {
  const t = useTranslations("Admin.settings.profile");
  return <p className={cn("text-xs text-muted-foreground", className)}>{t("uploadsOff")}</p>;
}

/* ─── CV ─────────────────────────────────────────────────────────────── */

function CvPanel({
  profile,
  userId,
  uploads,
  onUpload,
  onRemove,
}: {
  profile: OwnProfile;
  userId: string;
  uploads: { avatar: number; cv: number } | null;
  onUpload: (kind: Kind, file: File) => Promise<boolean>;
  onRemove: (kind: Kind) => Promise<void>;
}) {
  const t = useTranslations("Admin.settings.profile.cv");
  const format = useFormatter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const run = async (task: () => Promise<unknown>) => {
    setBusy(true);
    await task();
    setBusy(false);
  };
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void run(() => onUpload("cv", file));
  };
  const cv = profile.cv;

  return (
    <Panel title={t("title")} description={t("subtitle")}>
      <div className="flex items-start gap-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
          {busy ? <Loader2 className="size-[18px] animate-spin" /> : <FileText className="size-[18px]" />}
        </span>
        <div className="min-w-0 flex-1 space-y-3 pt-0.5">
          <p className="text-sm">
            {cv
              ? t("onFile", {
                  size: format.number(cv.bytes / 1024 / 1024, { maximumFractionDigits: 1 }),
                  date: format.dateTime(new Date(cv.uploadedAt), { dateStyle: "medium" }),
                })
              : t("none")}
          </p>
          <input ref={input} type="file" accept={ACCEPT.cv.join(",")} className="sr-only" tabIndex={-1} onChange={pick} aria-hidden />
          {uploads ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()} disabled={busy}>
                <Upload aria-hidden />
                {cv ? t("replace") : t("upload")}
              </Button>
              {cv && (
                <>
                  <Button asChild size="sm" variant="outline">
                    <a href={`/api/admin/users/${userId}/cv`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink aria-hidden />
                      {t("view")}
                    </a>
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => void run(() => onRemove("cv"))} disabled={busy}>
                    <Trash2 aria-hidden />
                    {t("remove")}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <UploadsOff className="text-left" />
          )}
          {uploads && <p className="text-xs text-muted-foreground">{t("hint", { mb: Math.round(uploads.cv / 1024 / 1024) })}</p>}
        </div>
      </div>
    </Panel>
  );
}

/* ─── password + sessions ────────────────────────────────────────────── */

function SecurityPanel({ locale, onSessionEnded }: { locale: string; onSessionEnded: () => void }) {
  const t = useTranslations("Admin.settings.profile.security");
  const ta = useTranslations("Admin");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string; again?: string }>({});
  const [busy, setBusy] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [allBusy, setAllBusy] = useState(false);

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    const local: typeof errors = {};
    if (!current) local.current = "required";
    if (next.length < PROFILE_LIMITS.passwordMin) local.next = "tooShort";
    else if (again !== next) local.again = "mismatch";
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      await api("/api/admin/profile/password", "POST", { current, next });
      setCurrent("");
      setNext("");
      setAgain("");
      toast.success(t("changed"));
    } catch (err) {
      if (err instanceof SessionEnded) onSessionEnded();
      else {
        const { status, data } = err as ApiError;
        if (status === 422 && data?.fields) setErrors(data.fields);
        else toast.error(status === 429 ? t("tooMany") : t("error"));
      }
    } finally {
      setBusy(false);
    }
  };

  const signOutAll = async () => {
    setAllBusy(true);
    try {
      await api("/api/admin/profile/sign-out-everywhere", "POST");
      window.location.replace(`/${locale}/admin`);
    } catch {
      toast.error(t("error"));
      setAllBusy(false);
      setConfirmAll(false);
    }
  };

  return (
    <Panel title={t("title")} description={t("subtitle")}>
      <form onSubmit={change} className="space-y-4" noValidate>
        <TextField label={t("current")} error={errors.current}>
          {(f) => <Input {...f} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} maxLength={PROFILE_LIMITS.passwordMax} />}
        </TextField>
        <TextField label={t("next")} hint={t("nextHint", { min: PROFILE_LIMITS.passwordMin })} error={errors.next}>
          {(f) => <Input {...f} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} maxLength={PROFILE_LIMITS.passwordMax} />}
        </TextField>
        <TextField label={t("again")} error={errors.again}>
          {(f) => <Input {...f} type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} maxLength={PROFILE_LIMITS.passwordMax} />}
        </TextField>
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <KeyRound aria-hidden />}
            {t("submit")}
          </Button>
        </div>
      </form>

      <div className="mt-6 space-y-3 border-t pt-5">
        <p className="text-sm text-muted-foreground">{t("sessionsBody")}</p>
        <div className="flex flex-wrap gap-2">
          <SignOutButton />
          <Button type="button" variant="outline" onClick={() => setConfirmAll(true)}>
            <LogOut aria-hidden />
            {t("everywhere")}
          </Button>
        </div>
      </div>

      <AdminDialog
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        title={t("everywhereTitle")}
        description={t("everywhereBody")}
        closeLabel={ta("common.close")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmAll(false)} disabled={allBusy}>{ta("common.cancel")}</Button>
            <Button onClick={() => void signOutAll()} disabled={allBusy}>
              {allBusy ? <Loader2 className="animate-spin" aria-hidden /> : <LogOut aria-hidden />}
              {t("everywhereConfirm")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">{t("everywhereNote")}</p>
      </AdminDialog>
    </Panel>
  );
}

/* ─── field ──────────────────────────────────────────────────────────── */

function TextField({
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
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string; "aria-required"?: boolean }) => React.ReactNode;
}) {
  const t = useTranslations("Admin.settings.profile.errors");
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ? t(error, { min: PROFILE_LIMITS.passwordMin }) : hint;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-muted-foreground" aria-hidden>*</span>}
      </Label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": note ? noteId : undefined, "aria-required": required || undefined })}
      {note && <p id={noteId} className={cn("text-xs", error ? "font-medium text-destructive" : "text-muted-foreground")}>{note}</p>}
    </div>
  );
}
