/**
 * Admin sign-in: one password from .env.local, no user accounts, no packages.
 *
 * Signing in sets a session cookie that is
 *   - HttpOnly  → page scripts (and anything injected into them) can't read it
 *   - Secure    → only sent over HTTPS in production
 *   - SameSite=Strict → other websites can't make your browser use it
 *   - signed with ADMIN_SESSION_SECRET (HMAC-SHA256) → can't be forged or edited
 *   - expiring after SESSION_HOURS
 *
 * Changing ADMIN_PASSWORD or ADMIN_SESSION_SECRET signs every device out.
 *
 * SERVER ONLY — the password and secret never reach the browser.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./mongodb";

export const ADMIN_COOKIE = "sura_admin";
const SESSION_HOURS = 12;
const MIN_PASSWORD_LENGTH = 12;
const MIN_SECRET_LENGTH = 32;

// Brute-force guard: after this many wrong passwords from one address, wait.
const MAX_FAILURES = 5;
const LOCKOUT_MINUTES = 15;

export type AdminConfig = "ok" | "missing" | "weak";

function settings() {
  return {
    password: process.env.ADMIN_PASSWORD ?? "",
    secret: process.env.ADMIN_SESSION_SECRET ?? "",
  };
}

export function adminConfig(): AdminConfig {
  const { password, secret } = settings();
  if (!password || !secret) return "missing";
  if (password.length < MIN_PASSWORD_LENGTH || secret.length < MIN_SECRET_LENGTH) return "weak";
  return "ok";
}

const sha256 = (s: string) => createHash("sha256").update(s).digest();
const sign = (payload: string) =>
  createHmac("sha256", settings().secret).update(payload).digest("base64url");

/** Constant-time comparison, so response timing reveals nothing about the password. */
export function passwordMatches(input: string): boolean {
  if (adminConfig() !== "ok") return false;
  return timingSafeEqual(sha256(input), sha256(settings().password));
}

// Ties a session to the current password: change the password → old cookies stop working.
const passwordTag = () => sha256(`sura-admin:${settings().password}`).toString("base64url").slice(0, 16);

export function createSessionToken(now = Date.now()): string {
  const expires = now + SESSION_HOURS * 60 * 60 * 1000;
  const nonce = randomBytes(12).toString("base64url");
  const payload = `v1.${expires}.${nonce}`;
  return `${payload}.${sign(`${payload}.${passwordTag()}`)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token || adminConfig() !== "ok") return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;
  const [version, expiresRaw, nonce, signature] = parts;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < now) return false;

  const expected = Buffer.from(sign(`${version}.${expiresRaw}.${nonce}.${passwordTag()}`));
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected);
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

/** For server components and route handlers. */
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
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

const hashIp = (ip: string) =>
  createHmac("sha256", settings().secret || "sura").update(`login:${ip}`).digest("hex").slice(0, 32);

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

export async function isLockedOut(ip: string): Promise<boolean> {
  const ipHash = hashIp(ip);
  const since = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000);
  const col = await attemptsCollection();
  if (col) return (await col.countDocuments({ ipHash, at: { $gte: since } })) >= MAX_FAILURES;
  const recent = (memoryAttempts.get(ipHash) ?? []).filter((t) => t >= since.getTime());
  memoryAttempts.set(ipHash, recent);
  return recent.length >= MAX_FAILURES;
}

export async function recordFailure(ip: string) {
  const ipHash = hashIp(ip);
  const col = await attemptsCollection();
  if (col) await col.insertOne({ ipHash, at: new Date() });
  else memoryAttempts.set(ipHash, [...(memoryAttempts.get(ipHash) ?? []), Date.now()]);
}

export async function clearFailures(ip: string) {
  const ipHash = hashIp(ip);
  const col = await attemptsCollection();
  if (col) await col.deleteMany({ ipHash });
  memoryAttempts.delete(ipHash);
}
