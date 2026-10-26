/**
 * Admin sign-in. Each person has an account in "admin_users" (lib/admin-users.ts)
 * with a role (lib/admin-rbac.ts). Until the first Main Admin account exists,
 * ADMIN_PASSWORD from .env.local still signs in as Main Admin, so nobody is
 * locked out while accounts are set up (`npm run admin:create`).
 *
 * Signing in sets a session cookie that is
 *   - HttpOnly  → page scripts (and anything injected into them) can't read it
 *   - Secure    → only sent over HTTPS in production
 *   - SameSite=Strict → other websites can't make your browser use it
 *   - signed with ADMIN_SESSION_SECRET (HMAC-SHA256) → can't be forged or edited
 *   - expiring after SESSION_HOURS
 *
 * The cookie names the account, never the role: the role is read from the
 * database on every request, so a change of role or a disabled account takes
 * effect at once. Changing ADMIN_SESSION_SECRET signs every device out;
 * changing ADMIN_PASSWORD signs out the first-run (environment) sessions.
 *
 * SERVER ONLY — the password and secret never reach the browser.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { getDb } from "./mongodb";
import { can, type AdminRole, type Permission } from "./admin-rbac";
import { bootstrapLoginAllowed, findActiveUserById } from "./admin-users";

export const ADMIN_COOKIE = "sura_admin";
const SESSION_HOURS = 12;
const MIN_PASSWORD_LENGTH = 12;
const MIN_SECRET_LENGTH = 32;

// Brute-force guard: after this many wrong passwords from one address (or for one email), wait.
const MAX_FAILURES = 5;
const LOCKOUT_MINUTES = 15;

/** The session subject for the first-run ADMIN_PASSWORD sign-in. */
const ENV_SUBJECT = "env";

export type AdminConfig = "ok" | "missing" | "weak";

/** Who is signed in. `source: "environment"` is the first-run ADMIN_PASSWORD sign-in. */
export type AdminSession = {
  userId: string;
  name: string;
  email: string | null;
  role: AdminRole;
  source: "account" | "environment";
};

/** Stored with changes (bookings, pricing) so the history says who made them. */
export type AdminActor = { id: string; name: string };
export const actorOf = (s: AdminSession): AdminActor => ({ id: s.userId, name: s.name });

function settings() {
  return {
    password: process.env.ADMIN_PASSWORD ?? "",
    secret: process.env.ADMIN_SESSION_SECRET ?? "",
  };
}

/** The secret is required; ADMIN_PASSWORD is optional once accounts exist, but must be strong if set. */
export function adminConfig(): AdminConfig {
  const { password, secret } = settings();
  if (!secret) return "missing";
  if (secret.length < MIN_SECRET_LENGTH || (password && password.length < MIN_PASSWORD_LENGTH)) return "weak";
  return "ok";
}

const sha256 = (s: string) => createHash("sha256").update(s).digest();
const sign = (payload: string) =>
  createHmac("sha256", settings().secret).update(payload).digest("base64url");

/** The first-run ADMIN_PASSWORD. Constant-time, so response timing reveals nothing about it. */
export function envPasswordMatches(input: string): boolean {
  const { password } = settings();
  if (adminConfig() !== "ok" || !password) return false;
  return timingSafeEqual(sha256(input), sha256(password));
}

// Ties first-run sessions to the current ADMIN_PASSWORD: change it → those cookies stop working.
const passwordTag = () => sha256(`sura-admin:${settings().password}`).toString("base64url").slice(0, 16);

/*
 * Token: v2.<subject>.<sessionVersion>.<expires>.<nonce>.<signature>
 *   subject         the account id (24 hex), or "env" for the first-run sign-in
 *   sessionVersion  must match the account's; raising it signs that person out everywhere
 */
const subjectTag = (subject: string) => (subject === ENV_SUBJECT ? passwordTag() : "account");

export function createSessionToken(subject: string, sessionVersion: number, now = Date.now()): string {
  const expires = now + SESSION_HOURS * 60 * 60 * 1000;
  const nonce = randomBytes(12).toString("base64url");
  const payload = `v2.${subject}.${sessionVersion}.${expires}.${nonce}`;
  return `${payload}.${sign(`${payload}.${subjectTag(subject)}`)}`;
}

export const createEnvSessionToken = () => createSessionToken(ENV_SUBJECT, 0);

/** Checks the signature and expiry only. Returns who the token is for. */
export function readSessionToken(token: string | undefined, now = Date.now()): { subject: string; sessionVersion: number } | null {
  if (!token || adminConfig() !== "ok") return null;
  const parts = token.split(".");
  if (parts.length !== 6 || parts[0] !== "v2") return null;
  const [version, subject, versionRaw, expiresRaw, nonce, signature] = parts;
  const expires = Number(expiresRaw);
  const sessionVersion = Number(versionRaw);
  if (!Number.isFinite(expires) || expires < now || !Number.isInteger(sessionVersion)) return null;
  if (subject !== ENV_SUBJECT && !/^[a-f0-9]{24}$/i.test(subject)) return null;

  const expected = Buffer.from(sign(`${version}.${subject}.${versionRaw}.${expiresRaw}.${nonce}.${subjectTag(subject)}`));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return { subject, sessionVersion };
}

export function sessionCookie(token: string) {
  return {
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  };
}

export const clearedSessionCookie = () => ({ ...sessionCookie(""), maxAge: 0 });

/**
 * The signed-in person, or null. For server components and route handlers.
 * Cached per request, so the layout and the page share one lookup.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const jar = await cookies();
  const token = readSessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!token) return null;

  if (token.subject === ENV_SUBJECT) {
    if (!settings().password || !(await bootstrapLoginAllowed())) return null;
    return { userId: ENV_SUBJECT, name: "Main Admin", email: null, role: "main_admin", source: "environment" };
  }

  try {
    const user = await findActiveUserById(token.subject);
    if (!user || user.sessionVersion !== token.sessionVersion) return null;
    return { userId: user._id.toHexString(), name: user.name, email: user.email, role: user.role, source: "account" };
  } catch (err) {
    console.error("[admin] loading the signed-in account failed:", err);
    return null;
  }
});

/** Signed in at all (any role). */
export async function isAdmin(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

/** Signed in and allowed `permission`: the session, or null. */
export async function sessionWith(permission: Permission): Promise<AdminSession | null> {
  const session = await getAdminSession();
  return session && can(session.role, permission) ? session : null;
}

/**
 * Extra CSRF protection for anything that changes data: browsers always send
 * an Origin header on POST/PATCH/DELETE, and it must be this site.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser client; the SameSite cookie already blocks cross-site use
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/* ─── wrong-password limiter ─────────────────────────────────────────── */

type Attempt = { ipHash: string; at: Date };
const memoryAttempts = new Map<string, number[]>(); // used when MongoDB isn't set up

// `key` is an IP address, or "email:<address>" for the per-account limit.
const hashKey = (key: string) =>
  createHmac("sha256", settings().secret || "sura").update(`login:${key}`).digest("hex").slice(0, 32);

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function attemptsCollection() {
  if (!process.env.MONGODB_URI) return null;
  try {
    const col = (await getDb()).collection<Attempt>("admin_login_attempts");
    await col.createIndex({ at: 1 }, { expireAfterSeconds: LOCKOUT_MINUTES * 60 });
    return col;
  } catch {
    return null;
  }
}

export async function isLockedOut(key: string): Promise<boolean> {
  const ipHash = hashKey(key);
  const since = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000);
  const col = await attemptsCollection();
  if (col) return (await col.countDocuments({ ipHash, at: { $gte: since } })) >= MAX_FAILURES;
  const recent = (memoryAttempts.get(ipHash) ?? []).filter((t) => t >= since.getTime());
  memoryAttempts.set(ipHash, recent);
  return recent.length >= MAX_FAILURES;
}

export async function recordFailure(key: string) {
  const ipHash = hashKey(key);
  const col = await attemptsCollection();
  if (col) await col.insertOne({ ipHash, at: new Date() });
  else memoryAttempts.set(ipHash, [...(memoryAttempts.get(ipHash) ?? []), Date.now()]);
}

export async function clearFailures(key: string) {
  const ipHash = hashKey(key);
  const col = await attemptsCollection();
  if (col) await col.deleteMany({ ipHash });
  memoryAttempts.delete(ipHash);
}
