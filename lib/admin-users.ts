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
 * every device at their next click. The Users screen (/admin/users) and
 * /api/admin/users manage accounts through the functions at the bottom.
 *
 * SERVER ONLY.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb, isMongoConfigured } from "./mongodb";
import type { AdminRole } from "./admin-rbac";
import type { AccountChanges, AccountGuard, AdminAccount, NewAccount } from "./admin-accounts";

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

/* ─── the Users screen (users:manage) ────────────────────────────────── */

const toAccount = (d: AdminUserDoc): AdminAccount => ({
  id: d._id.toHexString(),
  name: d.name,
  email: d.email,
  role: d.role,
  status: d.status,
  lastLoginAt: d.lastLoginAt ? d.lastLoginAt.getTime() : null,
  createdAt: d.createdAt.getTime(),
});

/** Every account: active first, then by name. Password hashes never leave this file. */
export async function listAccounts(): Promise<AdminAccount[]> {
  const docs = await (await usersCollection())
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ status: 1, name: 1 })
    .limit(500)
    .toArray();
  return docs.map(toAccount);
}

export async function createAccount(input: NewAccount): Promise<{ ok: true; account: AdminAccount } | { ok: false; reason: "duplicate" }> {
  const now = new Date();
  const doc: AdminUserDoc = {
    _id: new ObjectId(),
    email: normalizeEmail(input.email),
    name: input.name,
    role: input.role,
    passwordHash: await hashPassword(input.password),
    status: "active",
    sessionVersion: 0,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await (await usersCollection()).insertOne(doc);
  } catch (err) {
    if ((err as { code?: number })?.code === 11000) return { ok: false, reason: "duplicate" };
    throw err;
  }
  if (doc.role === "main_admin") bootstrap = null; // the first-run sign-in ends with the first Main Admin
  return { ok: true, account: toAccount(doc) };
}

const isActiveMainAdmin = (d: Pick<AdminUserDoc, "role" | "status">) => d.role === "main_admin" && d.status === "active";

async function otherActiveMainAdmins(id: ObjectId) {
  return (await usersCollection()).countDocuments({ _id: { $ne: id }, role: "main_admin", status: "active" }, { limit: 1 });
}

export type AccountResult =
  | { ok: true; account: AdminAccount; sessionVersion: number }
  | { ok: false; reason: "notFound" }
  | { ok: false; reason: "guard"; guard: AccountGuard };

/**
 * Changes an account. `actorId` is who is making the change (the account id,
 * or "env" for the first-run sign-in). Refused (AccountGuard) when it would
 * leave the portal without an active Main Admin, or take a Main Admin's own
 * access away. Disabling an account or setting a new password signs that
 * person out everywhere.
 */
export async function updateAccount(id: string, changes: AccountChanges, actorId: string): Promise<AccountResult> {
  if (!/^[a-f0-9]{24}$/i.test(id)) return { ok: false, reason: "notFound" };
  const _id = new ObjectId(id);
  const col = await usersCollection();
  const current = await col.findOne({ _id });
  if (!current) return { ok: false, reason: "notFound" };

  const next = { role: changes.role ?? current.role, status: changes.status ?? current.status };
  const self = actorId === id;
  if (self && changes.role && changes.role !== "main_admin" && current.role === "main_admin") return { ok: false, reason: "guard", guard: "selfDemote" };
  if (self && next.status === "disabled") return { ok: false, reason: "guard", guard: "selfDisable" };
  if (isActiveMainAdmin(current) && !isActiveMainAdmin(next) && (await otherActiveMainAdmins(_id)) === 0) {
    return { ok: false, reason: "guard", guard: "lastMainAdmin" };
  }

  const signOut = Boolean(changes.password) || (changes.status === "disabled" && current.status !== "disabled");
  const $set: Partial<AdminUserDoc> = { updatedAt: new Date() };
  if (changes.name) $set.name = changes.name;
  if (changes.role) $set.role = changes.role;
  if (changes.status) $set.status = changes.status;
  if (changes.password) $set.passwordHash = await hashPassword(changes.password);

  const saved = await col.findOneAndUpdate(
    { _id },
    { $set, ...(signOut && { $inc: { sessionVersion: 1 } }) },
    { returnDocument: "after", projection: { passwordHash: 0 } },
  );
  if (!saved) return { ok: false, reason: "notFound" };
  bootstrap = null; // Main Admins may have changed
  return { ok: true, account: toAccount(saved), sessionVersion: saved.sessionVersion };
}

/** Removes an account for good, with the same guardrails as updateAccount. */
export async function deleteAccount(id: string, actorId: string): Promise<{ ok: true } | Exclude<AccountResult, { ok: true }>> {
  if (!/^[a-f0-9]{24}$/i.test(id)) return { ok: false, reason: "notFound" };
  if (actorId === id) return { ok: false, reason: "guard", guard: "selfDelete" };
  const _id = new ObjectId(id);
  const col = await usersCollection();
  const current = await col.findOne({ _id }, { projection: { role: 1, status: 1 } });
  if (!current) return { ok: false, reason: "notFound" };
  if (isActiveMainAdmin(current) && (await otherActiveMainAdmins(_id)) === 0) {
    return { ok: false, reason: "guard", guard: "lastMainAdmin" };
  }
  const res = await col.deleteOne({ _id });
  bootstrap = null;
  return res.deletedCount === 1 ? { ok: true } : { ok: false, reason: "notFound" };
}
