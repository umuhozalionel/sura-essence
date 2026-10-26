/**
 * Admin accounts from your terminal.
 *
 *   npm run admin:create -- --email you@example.com --name "Your Name" --role main_admin
 *
 * Roles: main_admin, managing_director, assistant_manager (lib/admin-rbac.ts).
 * The password is asked for on the terminal (not shown, never put on the
 * command line, so it stays out of your shell history), at least 12 characters.
 *
 * Once an active main_admin account exists, the ADMIN_PASSWORD sign-in from
 * .env.local stops working (within a minute): sign in with the email and
 * password from here instead.
 *
 * Reads MONGODB_URI (and optional MONGODB_DB) from .env.local.
 */
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { createInterface } from "node:readline";
import { MongoClient } from "mongodb";

const ROLES = ["main_admin", "managing_director", "assistant_manager"];
const MIN_PASSWORD = 12;
// Same format and settings as lib/admin-users.ts hashPassword(): keep the two in step.
const SCRYPT = { N: 32768, r: 8, p: 1, keyLength: 64 };

function hashPassword(password) {
  const { N, r, p, keyLength } = SCRYPT;
  const salt = randomBytes(16);
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, keyLength, { N, r, p, maxmem: 256 * N * r }, (err, key) =>
      err ? reject(err) : resolve(["scrypt", N, r, p, salt.toString("base64url"), key.toString("base64url")].join("$")),
    ),
  );
}

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const m = /^--([a-z]+)(?:=(.*))?$/.exec(argv[i]);
    if (!m) continue;
    out[m[1]] = m[2] ?? argv[++i];
  }
  return out;
}

/** Reads a line without echoing it. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    rl._writeToOutput = (s) => {
      if (!muted || s.includes("\n")) rl.output.write(muted ? "\n" : s);
    };
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
    muted = true;
  });
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const [command, ...rest] = process.argv.slice(2);
if (command !== "create") fail('Usage: npm run admin:create -- --email <email> --name "<name>" --role <role>');

const opts = args(rest);
const email = String(opts.email ?? "").trim().toLowerCase();
const name = String(opts.name ?? "").trim();
const role = String(opts.role ?? "").trim();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) fail("Give a valid --email.");
if (!name || name.length > 80) fail("Give a --name (up to 80 characters).");
if (!ROLES.includes(role)) fail(`--role must be one of: ${ROLES.join(", ")}.`);
if (!process.env.MONGODB_URI) fail("MONGODB_URI is not set in .env.local.");

const password = await askHidden(`Password for ${email}: `);
if (password.length < MIN_PASSWORD) fail(`The password must be at least ${MIN_PASSWORD} characters.`);
if (password.length > 256) fail("The password must be at most 256 characters.");
const again = await askHidden("Type it again: ");
if (again !== password) fail("The two passwords don't match.");

const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  const users = client.db(process.env.MONGODB_DB || "sura").collection("admin_users");
  await users.createIndexes([{ key: { email: 1 }, unique: true }, { key: { role: 1, status: 1 } }]);

  const now = new Date();
  await users.insertOne({
    email, name, role,
    passwordHash: await hashPassword(password),
    status: "active",
    sessionVersion: 0,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`✓ created ${role} account for ${name} <${email}>`);
  if (role === "main_admin") console.log("  The ADMIN_PASSWORD sign-in now stops working. Sign in with this email and password.");
} catch (err) {
  if (err?.code === 11000) fail(`An account for ${email} already exists.`);
  fail(err?.message ?? String(err));
} finally {
  await client.close();
}
