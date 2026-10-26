"use client";

import React, { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { CircleCheck, CircleSlash, Eye, EyeOff, FileText, KeyRound, Loader2, Pencil, Plus, Trash2, Wand2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ADMIN_ROLES, type AdminRole } from "@/lib/admin-rbac";
import {
  ACCOUNT_LIMITS, type AccountField, type AccountFieldError, type AccountGuard, type AdminAccount, type AdminAccountStatus,
} from "@/lib/admin-accounts";
import { PageHeader } from "./page-header";
import { AdminDialog } from "./admin-dialog";
import { AdminSelect } from "./admin-select";

/**
 * Users — the staff who can sign in to the admin portal, and their roles.
 * Main Admin only (users:manage). Every change goes through /api/admin/users,
 * which also enforces the guardrails: nobody can lock themself out, and there
 * is always at least one active Main Admin.
 */

type DbState = "ok" | "notConfigured" | "unavailable";
type Dialog =
  | { kind: "new" }
  | { kind: "edit"; account: AdminAccount }
  | { kind: "password"; account: AdminAccount }
  | { kind: "delete"; account: AdminAccount }
  | null;

class SessionEnded extends Error {}

/** Admin API call. Throws SessionEnded on 401, an Error with .status and .data otherwise. */
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

type FieldErrorKey = AccountFieldError | "duplicate";
type Errors = Partial<Record<AccountField, FieldErrorKey>>;
type ApiError = { status?: number; data?: { fields?: Errors; guard?: AccountGuard } };

/** A strong temporary password, made in the browser. */
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function UsersAdmin({
  initialAccounts,
  dbState,
  me,
  setupSignIn,
}: {
  initialAccounts: AdminAccount[];
  dbState: DbState;
  /** The signed-in account's id ("env" for the first-run sign-in). */
  me: string;
  /** Signed in with the first-run password rather than an account. */
  setupSignIn: boolean;
}) {
  const t = useTranslations("Admin.users");
  const ta = useTranslations("Admin");
  const format = useFormatter();
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const live = dbState === "ok";

  const sessionEnded = () => {
    toast.error(ta("common.sessionEnded"));
    router.refresh();
  };
  const markBusy = (id: string, on: boolean) =>
    setBusy((b) => {
      const next = { ...b };
      if (on) next[id] = true;
      else delete next[id];
      return next;
    });
  const replace = (a: AdminAccount) => setAccounts((list) => list.map((x) => (x.id === a.id ? a : x)));

  /** Shared error handling: field errors go back to the form, the rest become a toast. */
  const failed = (err: unknown): Errors | undefined => {
    if (err instanceof SessionEnded) {
      sessionEnded();
      return undefined;
    }
    const { status, data } = err as ApiError;
    if ((status === 422 || status === 409) && data?.fields) return data.fields; // 409 + fields: the email already has an account
    toast.error(
      status === 409 && data?.guard ? t(`guard.${data.guard}`)
      : status === 403 ? ta("common.notAllowed")
      : status === 404 ? t("toast.gone")
      : t("toast.error"),
    );
    return undefined;
  };

  const create = async (input: { name: string; email: string; role: AdminRole; password: string }) => {
    try {
      const { item } = await api<{ item: AdminAccount }>("/api/admin/users", "POST", input);
      setAccounts((list) => [...list, item]);
      toast.success(t("toast.created", { name: item.name }));
      setDialog(null);
      if (setupSignIn && item.role === "main_admin") router.refresh(); // the setup sign-in ends here
      return undefined;
    } catch (err) {
      return failed(err);
    }
  };

  const change = async (account: AdminAccount, changes: Partial<{ name: string; role: AdminRole; status: AdminAccountStatus; password: string }>, done: string) => {
    markBusy(account.id, true);
    try {
      const { item } = await api<{ item: AdminAccount }>(`/api/admin/users/${account.id}`, "PATCH", changes);
      replace(item);
      toast.success(done);
      setDialog(null);
      if (account.id === me) router.refresh(); // own name or role in the header
      return undefined;
    } catch (err) {
      return failed(err);
    } finally {
      markBusy(account.id, false);
    }
  };

  const remove = async (account: AdminAccount) => {
    setDialog(null);
    markBusy(account.id, true);
    try {
      await api(`/api/admin/users/${account.id}`, "DELETE");
      setAccounts((list) => list.filter((x) => x.id !== account.id));
      toast.success(t("toast.deleted", { name: account.name }));
    } catch (err) {
      failed(err);
    } finally {
      markBusy(account.id, false);
    }
  };

  const lastLogin = (a: AdminAccount) =>
    a.lastLoginAt ? format.dateTime(new Date(a.lastLoginAt), { dateStyle: "medium", timeStyle: "short" }) : t("never");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button onClick={() => setDialog({ kind: "new" })} disabled={!live}>
            <Plus aria-hidden />
            {t("add")}
          </Button>
        }
      />

      {setupSignIn && (
        <p className="rounded-xl border border-dashed bg-card px-5 py-4 text-sm text-muted-foreground">{t("setupNotice")}</p>
      )}
      {!live && (
        <p role="alert" className="rounded-xl border bg-card px-5 py-4 text-sm font-medium">
          {t(dbState === "notConfigured" ? "notConfigured" : "unavailable")}
        </p>
      )}

      {live && (
        <section aria-label={t("listLabel")} className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
          {accounts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-medium">{t("empty.title")}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{t("empty.body")}</p>
            </div>
          ) : (
            <>
              {/* ≥ md: table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-11 pl-4 text-xs font-medium text-muted-foreground">{t("columns.name")}</TableHead>
                      <TableHead className="h-11 text-xs font-medium text-muted-foreground">{t("columns.role")}</TableHead>
                      <TableHead className="h-11 text-xs font-medium text-muted-foreground">{t("columns.status")}</TableHead>
                      <TableHead className="h-11 text-xs font-medium text-muted-foreground">{t("columns.lastLogin")}</TableHead>
                      <TableHead className="h-11 pr-4 text-right text-xs font-medium text-muted-foreground">
                        <span className="sr-only">{t("columns.actions")}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((a) => (
                      <TableRow key={a.id} className={cn(busy[a.id] && "opacity-60")}>
                        <TableCell className="py-3 pl-4">
                          <NameCell account={a} isMe={a.id === me} />
                        </TableCell>
                        <TableCell className="py-3">{ta(`roles.${a.role}`)}</TableCell>
                        <TableCell className="py-3"><StatusTag status={a.status} /></TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground">{lastLogin(a)}</TableCell>
                        <TableCell className="py-3 pr-4 text-right">
                          <Actions account={a} isMe={a.id === me} disabled={busy[a.id]} onOpen={setDialog} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* < md: cards */}
              <ul className="divide-y md:hidden">
                {accounts.map((a) => (
                  <li key={a.id} className={cn("space-y-3 px-4 py-4", busy[a.id] && "opacity-60")}>
                    <NameCell account={a} isMe={a.id === me} />
                    <p className="text-sm">
                      <span className="font-medium">{ta(`roles.${a.role}`)}</span>
                      <span className="text-muted-foreground"> · {t("lastLoginShort", { when: lastLogin(a) })}</span>
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <StatusTag status={a.status} />
                      <Actions account={a} isMe={a.id === me} disabled={busy[a.id]} onOpen={setDialog} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <AdminDialog
        open={dialog?.kind === "new"}
        onClose={() => setDialog(null)}
        title={t("new.title")}
        description={t("new.subtitle")}
        closeLabel={ta("common.close")}
        closeOnBackdrop={false}
      >
        {dialog?.kind === "new" && <NewAccountForm onCancel={() => setDialog(null)} onSave={create} />}
      </AdminDialog>

      <AdminDialog
        open={dialog?.kind === "edit"}
        onClose={() => setDialog(null)}
        title={dialog?.kind === "edit" ? t("edit.title", { name: dialog.account.name }) : ""}
        description={t("edit.subtitle")}
        closeLabel={ta("common.close")}
        closeOnBackdrop={false}
      >
        {dialog?.kind === "edit" && (
          <EditAccountForm
            key={dialog.account.id}
            account={dialog.account}
            isMe={dialog.account.id === me}
            onCancel={() => setDialog(null)}
            onSave={(changes) => change(dialog.account, changes, t("toast.saved"))}
          />
        )}
      </AdminDialog>

      <AdminDialog
        open={dialog?.kind === "password"}
        onClose={() => setDialog(null)}
        title={dialog?.kind === "password" ? t("password.title", { name: dialog.account.name }) : ""}
        description={t("password.subtitle")}
        closeLabel={ta("common.close")}
        size="sm"
        closeOnBackdrop={false}
      >
        {dialog?.kind === "password" && (
          <PasswordForm
            key={dialog.account.id}
            onCancel={() => setDialog(null)}
            onSave={(password) => change(dialog.account, { password }, t("toast.passwordReset", { name: dialog.account.name }))}
          />
        )}
      </AdminDialog>

      <AdminDialog
        open={dialog?.kind === "delete"}
        onClose={() => setDialog(null)}
        title={t("delete.title")}
        description={dialog?.kind === "delete" ? t("delete.body", { name: dialog.account.name, email: dialog.account.email }) : undefined}
        closeLabel={ta("common.close")}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDialog(null)}>{ta("common.cancel")}</Button>
            <Button variant="destructive" onClick={() => dialog?.kind === "delete" && void remove(dialog.account)}>
              <Trash2 aria-hidden />
              {t("delete.confirm")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">{t("delete.note")}</p>
      </AdminDialog>
    </div>
  );
}

function NameCell({ account, isMe }: { account: AdminAccount; isMe: boolean }) {
  const t = useTranslations("Admin.users");
  return (
    <div className="flex min-w-0 items-center gap-3">
      {account.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- already sized and optimised by Cloudinary
        <img src={account.avatarUrl} alt={t("photoAlt", { name: account.name })} className="size-9 shrink-0 rounded-full border object-cover" />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary" aria-hidden>
          {account.name.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-medium">
          <span className="max-w-[16rem] truncate">{account.name}</span>
          {isMe && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{t("you")}</span>}
        </p>
        <p className="max-w-[18rem] truncate text-xs text-muted-foreground">{account.email}</p>
      </div>
    </div>
  );
}

function StatusTag({ status }: { status: AdminAccountStatus }) {
  const t = useTranslations("Admin.users.status");
  const Icon = status === "active" ? CircleCheck : CircleSlash;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium whitespace-nowrap">
      <Icon className={cn("size-3.5", status === "active" ? "text-[var(--status-confirmed)]" : "text-muted-foreground")} aria-hidden />
      {t(status)}
    </span>
  );
}

function Actions({
  account,
  isMe,
  disabled,
  onOpen,
}: {
  account: AdminAccount;
  isMe: boolean;
  disabled?: boolean;
  onOpen: (d: Dialog) => void;
}) {
  const t = useTranslations("Admin.users");
  return (
    <div className="inline-flex items-center gap-1">
      {account.hasCv && (
        <Button asChild variant="ghost" size="icon-sm" title={t("actions.viewCvShort")}>
          <a href={`/api/admin/users/${account.id}/cv`} target="_blank" rel="noopener noreferrer" aria-label={t("actions.viewCv", { name: account.name })}>
            <FileText aria-hidden />
          </a>
        </Button>
      )}
      <Button variant="ghost" size="icon-sm" onClick={() => onOpen({ kind: "edit", account })} disabled={disabled} aria-label={t("actions.edit", { name: account.name })} title={t("actions.editShort")}>
        <Pencil aria-hidden />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => onOpen({ kind: "password", account })} disabled={disabled} aria-label={t("actions.password", { name: account.name })} title={t("actions.passwordShort")}>
        <KeyRound aria-hidden />
      </Button>
      {!isMe && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onOpen({ kind: "delete", account })}
          disabled={disabled}
          aria-label={t("actions.delete", { name: account.name })}
          title={t("actions.deleteShort")}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 aria-hidden />
        </Button>
      )}
    </div>
  );
}

/* ─── forms ──────────────────────────────────────────────────────────── */

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: FieldErrorKey;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const t = useTranslations("Admin.users.errors");
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ? t(error, { min: ACCOUNT_LIMITS.passwordMin }) : hint;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": note ? noteId : undefined })}
      {note && (
        <p id={noteId} className={cn("text-xs", error ? "font-medium text-destructive" : "text-muted-foreground")}>
          {note}
        </p>
      )}
    </div>
  );
}

function RoleSelect({ value, onChange, disabled, field }: { value: AdminRole; onChange: (r: AdminRole) => void; disabled?: boolean; field: object }) {
  const ta = useTranslations("Admin");
  return (
    <AdminSelect {...field} value={value} onChange={(e) => onChange(e.target.value as AdminRole)} disabled={disabled}>
      {ADMIN_ROLES.map((r) => (
        <option key={r} value={r}>{ta(`roles.${r}`)}</option>
      ))}
    </AdminSelect>
  );
}

function PasswordInput({ value, onChange, field, autoFocus }: { value: string; onChange: (v: string) => void; field: object; autoFocus?: boolean }) {
  const t = useTranslations("Admin.users.password");
  const [shown, setShown] = useState(true);
  return (
    <div className="flex gap-2">
      <Input
        {...field}
        type={shown ? "text" : "password"}
        autoComplete="new-password"
        spellCheck={false}
        autoFocus={autoFocus}
        value={value}
        maxLength={ACCOUNT_LIMITS.passwordMax}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono"
      />
      <Button type="button" variant="outline" size="icon" onClick={() => setShown((s) => !s)} aria-label={shown ? t("hide") : t("show")} title={shown ? t("hide") : t("show")}>
        {shown ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
      </Button>
      <Button type="button" variant="outline" onClick={() => onChange(generatePassword())}>
        <Wand2 aria-hidden />
        {t("generate")}
      </Button>
    </div>
  );
}

function FormFooter({ busy, onCancel, submit }: { busy: boolean; onCancel: () => void; submit: string }) {
  const ta = useTranslations("Admin");
  return (
    <div className="flex flex-wrap justify-end gap-2 pt-2">
      <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>{ta("common.cancel")}</Button>
      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="animate-spin" aria-hidden />}
        {submit}
      </Button>
    </div>
  );
}

function NewAccountForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (input: { name: string; email: string; role: AdminRole; password: string }) => Promise<Errors | undefined>;
}) {
  const t = useTranslations("Admin.users");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("assistant_manager");
  const [password, setPassword] = useState(generatePassword);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const local: Errors = {};
    if (!name.trim()) local.name = "required";
    if (!email.trim()) local.email = "required";
    if (password.length < ACCOUNT_LIMITS.passwordMin) local.password = "tooShort";
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    const result = await onSave({ name: name.trim(), email: email.trim(), role, password });
    setBusy(false);
    if (result) setErrors(result);
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label={t("fields.name")} error={errors.name}>
        {(f) => <Input {...f} value={name} onChange={(e) => setName(e.target.value)} maxLength={ACCOUNT_LIMITS.name} autoFocus />}
      </Field>
      <Field label={t("fields.email")} error={errors.email}>
        {(f) => <Input {...f} type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={ACCOUNT_LIMITS.email} />}
      </Field>
      <Field label={t("fields.role")} hint={t(`roleHints.${role}`)} error={errors.role}>
        {(f) => <RoleSelect field={f} value={role} onChange={setRole} />}
      </Field>
      <Field label={t("fields.tempPassword")} hint={t("fields.tempPasswordHint", { min: ACCOUNT_LIMITS.passwordMin })} error={errors.password}>
        {(f) => <PasswordInput field={f} value={password} onChange={setPassword} />}
      </Field>
      <FormFooter busy={busy} onCancel={onCancel} submit={t("new.submit")} />
    </form>
  );
}

function EditAccountForm({
  account,
  isMe,
  onCancel,
  onSave,
}: {
  account: AdminAccount;
  isMe: boolean;
  onCancel: () => void;
  onSave: (changes: Partial<{ name: string; role: AdminRole; status: AdminAccountStatus }>) => Promise<Errors | undefined>;
}) {
  const t = useTranslations("Admin.users");
  const [name, setName] = useState(account.name);
  const [role, setRole] = useState(account.role);
  const [status, setStatus] = useState(account.status);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  // A Main Admin can't take their own access away (the server refuses it too).
  const lockedForMe = isMe && account.role === "main_admin";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrors({ name: "required" });
    const changes: Partial<{ name: string; role: AdminRole; status: AdminAccountStatus }> = {};
    if (name.trim() !== account.name) changes.name = name.trim();
    if (role !== account.role) changes.role = role;
    if (status !== account.status) changes.status = status;
    if (!Object.keys(changes).length) return onCancel();
    setBusy(true);
    const result = await onSave(changes);
    setBusy(false);
    if (result) setErrors(result);
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label={t("fields.name")} error={errors.name}>
        {(f) => <Input {...f} value={name} onChange={(e) => setName(e.target.value)} maxLength={ACCOUNT_LIMITS.name} autoFocus />}
      </Field>
      <Field label={t("fields.email")} hint={t("fields.emailFixed")}>
        {(f) => <Input {...f} value={account.email} readOnly disabled />}
      </Field>
      <Field label={t("fields.role")} hint={lockedForMe ? t("fields.ownRole") : t(`roleHints.${role}`)} error={errors.role}>
        {(f) => <RoleSelect field={f} value={role} onChange={setRole} disabled={lockedForMe} />}
      </Field>
      <Field label={t("fields.status")} hint={isMe ? t("fields.ownStatus") : t(`statusHints.${status}`)} error={errors.status}>
        {(f) => (
          <AdminSelect {...f} value={status} onChange={(e) => setStatus(e.target.value as AdminAccountStatus)} disabled={isMe}>
            <option value="active">{t("status.active")}</option>
            <option value="disabled">{t("status.disabled")}</option>
          </AdminSelect>
        )}
      </Field>
      <FormFooter busy={busy} onCancel={onCancel} submit={t("edit.submit")} />
    </form>
  );
}

function PasswordForm({ onCancel, onSave }: { onCancel: () => void; onSave: (password: string) => Promise<Errors | undefined> }) {
  const t = useTranslations("Admin.users");
  const [password, setPassword] = useState(generatePassword);
  const [error, setError] = useState<FieldErrorKey | undefined>();
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < ACCOUNT_LIMITS.passwordMin) return setError("tooShort");
    setBusy(true);
    const result = await onSave(password);
    setBusy(false);
    if (result?.password) setError(result.password);
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label={t("fields.tempPassword")} hint={t("password.hint")} error={error}>
        {(f) => <PasswordInput field={f} value={password} onChange={setPassword} autoFocus />}
      </Field>
      <FormFooter busy={busy} onCancel={onCancel} submit={t("password.submit")} />
    </form>
  );
}
