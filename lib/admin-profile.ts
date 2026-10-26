/**
 * "My profile" in admin Settings: what each person may change about themself,
 * and the checks on it. Safe to import anywhere (no secrets); the database side
 * is lib/admin-users.ts (getOwnProfile, updateOwnProfile).
 *
 * Only these fields can ever be written through the profile routes. The
 * account's role, status, email and password are out of reach here (the
 * password has its own route, which asks for the current one).
 */
import type { AdminRole } from "./admin-rbac";

export const PROFILE_LIMITS = { name: 80, title: 80, bio: 1000, phone: 30, passwordMin: 12, passwordMax: 256 } as const;

export type OwnProfile = {
  name: string;
  email: string;
  role: AdminRole;
  title: string;
  bio: string;
  phone: string;
  /** Square photo link, or null. */
  avatarUrl: string | null;
  cv: { bytes: number; uploadedAt: number } | null;
};

export type ProfileField = "name" | "title" | "bio" | "phone";
export type ProfileFieldError = "required" | "tooLong" | "invalid";
export type ProfileChanges = Partial<Record<ProfileField, string>>;

const oneLine = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

/** The text fields of the profile form. Empty title / bio / phone clear them; the name is required. */
export function parseProfileChanges(
  raw: unknown,
): { ok: true; value: ProfileChanges } | { ok: false; errors: Partial<Record<ProfileField, ProfileFieldError>> } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: Partial<Record<ProfileField, ProfileFieldError>> = {};
  const value: ProfileChanges = {};

  if ("name" in r) {
    const name = oneLine(r.name);
    if (!name) errors.name = "required";
    else if (name.length > PROFILE_LIMITS.name) errors.name = "tooLong";
    else value.name = name;
  }
  if ("title" in r) {
    const title = oneLine(r.title);
    if (title.length > PROFILE_LIMITS.title) errors.title = "tooLong";
    else value.title = title;
  }
  if ("bio" in r) {
    const bio = typeof r.bio === "string" ? r.bio.replace(/\r\n/g, "\n").trim() : "";
    if (bio.length > PROFILE_LIMITS.bio) errors.bio = "tooLong";
    else value.bio = bio;
  }
  if ("phone" in r) {
    const phone = oneLine(r.phone);
    if (phone.length > PROFILE_LIMITS.phone) errors.phone = "tooLong";
    else if (phone && !/^[+\d][\d\s().-]{5,}$/.test(phone)) errors.phone = "invalid";
    else value.phone = phone;
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value };
}
