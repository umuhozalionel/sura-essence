/**
 * Testimonials — shared by the browser and the API routes.
 *
 * Flow: a visitor submits → POST /api/testimonials stores it in MongoDB as
 * "pending", photo included as a Base64 string → the visitor sees their own
 * card straight away (remembered in this browser) → once a moderator approves
 * it (npm run testimonials -- approve <id>), it appears in everyone's feed,
 * which re-checks GET /api/testimonials every minute while the page is open.
 *
 * This file never touches the database (see lib/testimonials-server.ts), so
 * it is safe to import from client components.
 */
import type { PreparedPhoto } from "./photo";

export const LIMITS = {
  name: { min: 2, max: 60 },
  profession: { min: 2, max: 80 },
  comment: { min: 20, max: 600 },
} as const;

/** How many approved testimonials the feed shows. */
export const FEED_SIZE = 24;

/** Largest photo the API accepts. Real ones (320px WebP/JPEG from lib/photo.ts) are 15–60 KB. */
export const PHOTO_MAX_BYTES = 150 * 1024;
export const PHOTO_TYPES = ["image/webp", "image/jpeg"] as const;
export type PhotoMime = (typeof PHOTO_TYPES)[number];

/**
 * true when MONGODB_URI was set at build time. next.config.ts turns that into
 * this plain yes/no flag, so the browser knows whether the feed is live without
 * ever seeing the connection string. false → the section shows the sample
 * reviews from messages/*.json.
 */
export const liveEnabled = process.env.TESTIMONIALS_LIVE === "true";

export type Locale = "en" | "fr";

export type Testimonial = {
  id: string;
  name: string;
  profession: string;
  comment: string;
  /** /api/testimonials/<id>/photo for approved ones; a data: URL for your own pending one */
  photoUrl: string | null;
  locale: Locale;
  status: "pending" | "approved";
  /** epoch ms */
  createdAt: number;
};

export type Submission = {
  name: string;
  profession: string;
  comment: string;
  locale: Locale;
  photo: PreparedPhoto | null;
};

/* ─── validation (the API runs the same checks) ──────────────────────── */

export type FieldError =
  | "nameRequired" | "professionRequired" | "commentShort" | "commentLong" | "consentRequired";

export function validate(v: { name: string; profession: string; comment: string; consent: boolean }) {
  const errors: Partial<Record<"name" | "profession" | "comment" | "consent", FieldError>> = {};
  if (v.name.trim().length < LIMITS.name.min) errors.name = "nameRequired";
  if (v.profession.trim().length < LIMITS.profession.min) errors.profession = "professionRequired";
  const c = v.comment.trim().length;
  if (c < LIMITS.comment.min) errors.comment = "commentShort";
  else if (c > LIMITS.comment.max) errors.comment = "commentLong";
  if (!v.consent) errors.consent = "consentRequired";
  return errors;
}

/* ─── talking to the API (browser) ───────────────────────────────────── */

export type SubmitErrorCode = "network" | "notConfigured" | "rateLimited";

export class SubmitError extends Error {
  constructor(public code: SubmitErrorCode) {
    super(code);
  }
}

/** The newest approved testimonials. */
export async function fetchApproved(signal?: AbortSignal): Promise<Testimonial[]> {
  const res = await fetch("/api/testimonials", { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`GET /api/testimonials → ${res.status}`);
  const data = (await res.json()) as { items?: Testimonial[] };
  return Array.isArray(data.items) ? data.items : [];
}

/** Sends a testimonial. Resolves to the saved (pending) entry, ready to show. */
export async function submitTestimonial(input: Submission): Promise<Testimonial> {
  const photo = input.photo
    ? { mime: input.photo.type, base64: await blobToBase64(input.photo.blob) }
    : null;

  let res: Response;
  try {
    res = await fetch("/api/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        profession: input.profession,
        comment: input.comment,
        locale: input.locale,
        consent: true,
        photo,
      }),
    });
  } catch {
    throw new SubmitError("network");
  }

  if (res.status === 429) throw new SubmitError("rateLimited");
  if (res.status === 503) throw new SubmitError("notConfigured");
  if (!res.ok) throw new SubmitError("network");

  const { item } = (await res.json()) as { item: Testimonial };
  // Pending photos aren't served publicly, so show the visitor their own copy.
  return { ...item, photoUrl: photo ? `data:${photo.mime};base64,${photo.base64}` : null };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/* ─── the visitor's own pending submissions (this browser only) ───────── */

const MINE_KEY = "sura:testimonials:mine";
const MINE_MAX = 5;
const MINE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // forget after 30 days (e.g. if declined)

export function loadMine(): Testimonial[] {
  try {
    const raw = window.localStorage.getItem(MINE_KEY);
    const list = raw ? (JSON.parse(raw) as Testimonial[]) : [];
    return Array.isArray(list)
      ? list.filter((t) => t && t.id && Date.now() - t.createdAt < MINE_TTL_MS)
      : [];
  } catch {
    return [];
  }
}

export function rememberMine(t: Testimonial) {
  try {
    const next = [t, ...loadMine().filter((x) => x.id !== t.id)].slice(0, MINE_MAX);
    window.localStorage.setItem(MINE_KEY, JSON.stringify(next));
  } catch {
    /* private mode or storage full — the card still shows for this visit */
  }
}

/** Drop local copies once they've been approved (they're in the live feed now). */
export function forgetApproved(approvedIds: Set<string>) {
  try {
    const mine = loadMine();
    const left = mine.filter((t) => !approvedIds.has(t.id));
    if (left.length !== mine.length) window.localStorage.setItem(MINE_KEY, JSON.stringify(left));
  } catch {
    /* ignore */
  }
}
