/**
 * Plumbing shared by every CMS collection and its API routes. SERVER ONLY.
 *
 * Caching: public reads go through `cachedRead()` (Next's data cache, tagged
 * per collection). Every admin write calls `invalidate()` for that tag, so the
 * next public request reads MongoDB again. Public responses themselves are sent
 * with `max-age=0, must-revalidate`, so no CDN copy outlives an edit.
 */
import { NextResponse } from "next/server";
import { revalidateTag, unstable_cache } from "next/cache";
import { ObjectId, type Collection, type Document, type IndexDescription } from "mongodb";
import { getAdminSession, isSameOrigin } from "@/lib/admin-auth";
import { can, type Permission } from "@/lib/admin-rbac";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { readJsonBody } from "@/lib/read-json-body";

/* ─── cache tags, one per collection group ───────────────────────────── */

export const CMS_TAGS = {
  experiences: "cms:experiences",
  pricing: "cms:pricing",
  tours: "cms:tours",
  siteSettings: "cms:site-settings",
  tripAlerts: "cms:trip-alerts",
  siteContent: "cms:site-content",
} as const;
export type CmsTag = (typeof CMS_TAGS)[keyof typeof CMS_TAGS];

/** Longest a cached public read may live without an edit (an hour); edits clear it at once. */
const CACHE_SECONDS = 3600;

/** A public read, cached under `tag` until an admin write invalidates it. */
export function cachedRead<A extends unknown[], R>(key: string, tag: CmsTag, fn: (...args: A) => Promise<R>) {
  return unstable_cache(fn, [key], { tags: [tag], revalidate: CACHE_SECONDS });
}

/** Called by admin routes after a successful write: the next public read goes to the database. */
export function invalidate(...tags: CmsTag[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}

/* ─── collections ────────────────────────────────────────────────────── */

const indexed = new Map<string, Promise<unknown>>();

/** The collection, with its indexes created once per server instance (retried after a failure). */
export async function collection<T extends Document>(name: string, indexes: IndexDescription[] = []): Promise<Collection<T>> {
  const col = (await getDb()).collection<T>(name);
  if (indexes.length && !indexed.has(name)) {
    indexed.set(
      name,
      col.createIndexes(indexes).catch((err) => {
        indexed.delete(name);
        throw err;
      }),
    );
  }
  await indexed.get(name);
  return col;
}

export const toObjectId = (id: string) => (/^[a-f0-9]{24}$/i.test(id) ? new ObjectId(id) : null);

/** A clash on a unique index (e.g. a slug that's already used). */
export const isDuplicateKey = (err: unknown) => (err as { code?: number })?.code === 11000;

/* ─── responses ──────────────────────────────────────────────────────── */

export const NO_STORE = { "Cache-Control": "no-store" };
/** Browsers and CDNs ask again every time; the server answers from its tagged cache. */
export const PUBLIC_CACHE = { "Cache-Control": "public, max-age=0, must-revalidate" };

export const fail = (error: string, status: number, extra?: Record<string, unknown>) =>
  NextResponse.json({ error, ...extra }, { status, headers: NO_STORE });

export const adminJson = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

export const publicJson = (body: unknown) => NextResponse.json(body, { headers: PUBLIC_CACHE });

export function serverError(label: string, err: unknown) {
  console.error(`[cms] ${label} failed:`, err);
  return fail("unavailable", 500);
}

/**
 * Every admin route starts with this: signed in (401), same site for writes (403),
 * the role has `perm` (403, lib/admin-rbac.ts), database set up (503).
 */
export async function adminGuard(req: Request, { write, perm }: { write: boolean; perm: Permission }) {
  const session = await getAdminSession();
  if (!session) return fail("unauthorized", 401);
  if (write && !isSameOrigin(req)) return fail("forbidden", 403);
  if (!can(session.role, perm)) return fail("forbidden", 403);
  if (!isMongoConfigured) return fail("not_configured", 503);
  return null;
}

/** A further check after adminGuard, e.g. one that depends on the request body. */
export async function requirePermission(perm: Permission) {
  const session = await getAdminSession();
  if (!session) return fail("unauthorized", 401);
  return can(session.role, perm) ? null : fail("forbidden", 403);
}

/** Admin JSON body with a size cap. Large documents (experiences) pass a bigger cap. */
export async function adminBody(req: Request, maxBytes = 64 * 1024) {
  return readJsonBody(req, maxBytes);
}

/** `{ ok: false, reason, field }` from a parser → 400 the admin form can point at. */
export const invalid = (p: { reason: string; field: string }) => fail("invalid", 400, { reason: p.reason, field: p.field });

export type RouteCtx = { params: Promise<{ id: string }> };

/**
 * For "My profile" routes: adminGuard with profile:edit, plus a real account
 * (the first-run ADMIN_PASSWORD sign-in has no profile: 403 "no_account").
 * The account id always comes from this session, never from the request.
 */
export async function ownAccountGuard(req: Request, { write }: { write: boolean }) {
  const blocked = await adminGuard(req, { write, perm: "profile:edit" });
  if (blocked) return { blocked };
  const session = await getAdminSession();
  if (!session) return { blocked: fail("unauthorized", 401) };
  if (session.source !== "account") return { blocked: fail("no_account", 403) };
  return { session };
}
