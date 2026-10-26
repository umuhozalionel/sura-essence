/**
 * Admin accounts as the Users screen sees them, and the checks on what can be
 * typed in. Safe to import anywhere (no secrets); the database side is
 * lib/admin-users.ts.
 */
import { ADMIN_ROLES, isAdminRole, type AdminRole } from "./admin-rbac";

export type AdminAccountStatus = "active" | "disabled";

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminAccountStatus;
  /** ms since epoch, or null if they never signed in */
  lastLoginAt: number | null;
  createdAt: number;
};

export const ACCOUNT_LIMITS = { name: 80, email: 254, passwordMin: 12, passwordMax: 256 } as const;

export type AccountField = "name" | "email" | "role" | "status" | "password";
export type AccountFieldError = "required" | "tooLong" | "tooShort" | "invalid";
export type AccountErrors = Partial<Record<AccountField, AccountFieldError>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NewAccount = { name: string; email: string; role: AdminRole; password: string };
export type AccountChanges = { name?: string; role?: AdminRole; status?: AdminAccountStatus; password?: string };

function checkPassword(v: unknown): AccountFieldError | null {
  if (typeof v !== "string" || !v) return "required";
  if (v.length < ACCOUNT_LIMITS.passwordMin) return "tooShort";
  if (v.length > ACCOUNT_LIMITS.passwordMax) return "tooLong";
  return null;
}

function checkName(v: unknown): AccountFieldError | null {
  const name = typeof v === "string" ? v.trim() : "";
  if (!name) return "required";
  return name.length > ACCOUNT_LIMITS.name ? "tooLong" : null;
}

/** A new staff member from the "Add staff member" form. */
export function parseNewAccount(raw: unknown): { ok: true; value: NewAccount } | { ok: false; errors: AccountErrors } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: AccountErrors = {};

  const nameError = checkName(r.name);
  if (nameError) errors.name = nameError;

  const email = typeof r.email === "string" ? r.email.trim().toLowerCase() : "";
  if (!email) errors.email = "required";
  else if (email.length > ACCOUNT_LIMITS.email) errors.email = "tooLong";
  else if (!EMAIL.test(email)) errors.email = "invalid";

  if (!isAdminRole(r.role)) errors.role = r.role ? "invalid" : "required";

  const passwordError = checkPassword(r.password);
  if (passwordError) errors.password = passwordError;

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { name: String(r.name).trim(), email, role: r.role as AdminRole, password: r.password as string } };
}

/** A change to an account: any of name, role, status and a new password. */
export function parseAccountChanges(raw: unknown): { ok: true; value: AccountChanges } | { ok: false; errors: AccountErrors } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: AccountErrors = {};
  const value: AccountChanges = {};

  if ("name" in r) {
    const e = checkName(r.name);
    if (e) errors.name = e;
    else value.name = String(r.name).trim();
  }
  if ("role" in r) {
    if (isAdminRole(r.role)) value.role = r.role;
    else errors.role = "invalid";
  }
  if ("status" in r) {
    if (r.status === "active" || r.status === "disabled") value.status = r.status;
    else errors.status = "invalid";
  }
  if ("password" in r) {
    const e = checkPassword(r.password);
    if (e) errors.password = e;
    else value.password = r.password as string;
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  if (!Object.keys(value).length) return { ok: false, errors: {} }; // nothing to change
  return { ok: true, value };
}

export { ADMIN_ROLES };

/** Why a change to an account was refused, so nobody locks the portal. */
export type AccountGuard =
  | "selfDemote" // a Main Admin can't take their own Main Admin role away
  | "selfDisable" // …or disable their own account
  | "selfDelete" // …or delete it
  | "lastMainAdmin"; // the last active Main Admin can't be demoted, disabled or deleted
