/**
 * Admin accounts in MongoDB (collection "admin_users"): one per person, each
 * with a role from lib/admin-rbac.ts.
 *
 * Passwords are stored as scrypt hashes (node:crypto, no packages), in the form
 *   scrypt$<N>$<r>$<p>$<salt>$<hash>     salt and hash in base64url
 * scripts/admin-users.mjs (npm run admin:create) writes the same format: keep
 * the two in step.
 *
 * Disabling an account or raising its sessionVersion signs that person out on
 * every device at their next click.
 *
 * SERVER ONLY.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb, isMongoConfigured } from "./mongodb";
import type { AdminRole } from "./admin-rbac";

export type AdminUserDoc = {
  _id: ObjectId;
  /** Lowercased; unique. */
  email: string;
  name: string;
  role: AdminRole;
  passwordHash: string;
  status: "active" | "disabled";
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
};

export const MIN_ACCOUNT_PASSWORD = 12;

/* ─── password hashing ───────────────────────────────────────────────── */

const SCRYPT = { N: 32768, r: 8, p: 1, keyLength: 64 };

function scrypt(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, keyLength, options, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

// 128 · N · r bytes are needed; Node's default limit (32 MB) is just too small for N = 32768.
const maxmem = (N: number, r: number) => 256 * N * r;

export async function hashPassword(password: string): Promise<string> {
  const { N, r, p, keyLength } = SCRYPT;
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, keyLength, { N, r, p, maxmem: maxmem(N, r) });
  return ["scrypt", N, r, p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const N = Number(n), R = Number(r), P = Number(p);
  if (![N, R, P].every(Number.isInteger)) return false;
  const expected = Buffer.from(hash, "base64url");
  try {
    const key = await scrypt(password, Buffer.from(salt, "base64url"), expected.length, { N, r: R, p: P, maxmem: maxmem(N, R) });
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

// Checked when the email is unknown, so the reply takes as long as for a real account.
let dummyHash: Promise<string> | null = null;
export async function burnPasswordCheck(password: string) {
  dummyHash ??= hashPassword(randomBytes(18).toString("base64url"));
  await verifyPassword(password, await dummyHash);
}

/* ─── collection ─────────────────────────────────────────────────────── */

let indexesReady: Promise<unknown> | null = null;

async function usersCollection() {
  const col = (await getDb()).collection<AdminUserDoc>("admin_users");
  indexesReady ??= Promise.all([
    col.createIndex({ email: 1 }, { unique: true }),
    col.createIndex({ role: 1, status: 1 }),
  ]).catch((err) => {
    indexesReady = null;
    throw err;
  });
  await indexesReady;
  return col;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function findActiveUserByEmail(email: string): Promise<AdminUserDoc | null> {
  return (await usersCollection()).findOne({ email: normalizeEmail(email), status: "active" });
}

export async function findActiveUserById(id: string): Promise<AdminUserDoc | null> {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  return (await usersCollection()).findOne({ _id: new ObjectId(id), status: "active" });
}

export async function recordLogin(id: ObjectId) {
  await (await usersCollection()).updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } });
}

/* ─── first-run sign-in ──────────────────────────────────────────────── */

/*
 * Until an active Main Admin account exists, the ADMIN_PASSWORD from the
 * environment still signs in (as Main Admin), so nobody is locked out while
 * accounts are being set up. The answer is remembered for a minute. If the
 * database can't be reached, the last answer stands (allowed, if there never
 * was one: the password itself is still required).
 */
const BOOTSTRAP_CHECK_MS = 60_000;
let bootstrap: { allowed: boolean; at: number } | null = null;

export async function bootstrapLoginAllowed(): Promise<boolean> {
  if (!isMongoConfigured) return true;
  if (bootstrap && Date.now() - bootstrap.at < BOOTSTRAP_CHECK_MS) return bootstrap.allowed;
  try {
    const mainAdmins = await (await usersCollection()).countDocuments({ role: "main_admin", status: "active" }, { limit: 1 });
    bootstrap = { allowed: mainAdmins === 0, at: Date.now() };
  } catch (err) {
    console.error("[admin] checking admin accounts failed:", err);
    return bootstrap?.allowed ?? true;
  }
  return bootstrap.allowed;
}
