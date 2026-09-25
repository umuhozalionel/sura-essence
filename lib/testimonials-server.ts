/**
 * Server side of testimonials: checks every submission, limits abuse and
 * talks to MongoDB. Only the route handlers in app/api/testimonials/ import it.
 *
 * Browsers never reach the database directly, so THIS file is the gatekeeper:
 * it builds each document from scratch out of checked fields, so a visitor can
 * never choose the status or the date, or slip in fields of their own.
 */
import { createHmac } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import {
  FEED_SIZE, LIMITS, PHOTO_MAX_BYTES, PHOTO_TYPES, validate,
  type Locale, type PhotoMime, type Testimonial,
} from "./testimonials";

/* ─── what's stored ──────────────────────────────────────────────────── */

export type TestimonialDoc = {
  _id: ObjectId;
  name: string;
  profession: string;
  comment: string;
  locale: Locale;
  status: "pending" | "approved";
  consent: true;
  /** The compressed avatar, stored inside the document as Base64. */
  photo: { mime: PhotoMime; base64: string; bytes: number } | null;
  createdAt: Date;
  approvedAt?: Date;
};

/** One row per accepted submission, kept for a day — only used for rate limiting. */
type SubmissionLog = { ipHash: string; at: Date };

const PER_IP_PER_HOUR = process.env.NODE_ENV === "production" ? 3 : 50;
/** Stops a flood from filling the database while nobody is moderating. */
const MAX_PENDING = 300;

let indexesReady: Promise<unknown> | null = null;

async function collections() {
  const db = await getDb();
  const testimonials = db.collection<TestimonialDoc>("testimonials");
  const log = db.collection<SubmissionLog>("testimonial_submissions");

  // Idempotent; runs once per server instance. `npm run db:setup` creates the
  // same indexes plus a schema validator, so this is just a safety net.
  indexesReady ??= Promise.all([
    testimonials.createIndex({ status: 1, createdAt: -1 }),
    log.createIndex({ ipHash: 1, at: -1 }),
    log.createIndex({ at: 1 }, { expireAfterSeconds: 24 * 60 * 60 }),
  ]).catch((err) => {
    indexesReady = null;
    throw err;
  });
  await indexesReady;

  return { testimonials, log };
}

function toPublic(d: Omit<TestimonialDoc, "photo"> & { photo?: { mime: PhotoMime } | null }): Testimonial {
  const id = d._id.toHexString();
  return {
    id,
    name: d.name,
    profession: d.profession,
    comment: d.comment,
    locale: d.locale,
    status: d.status,
    createdAt: d.createdAt.getTime(),
    photoUrl: d.photo ? `/api/testimonials/${id}/photo` : null,
  };
}

/* ─── reading ────────────────────────────────────────────────────────── */

export async function listApproved(): Promise<Testimonial[]> {
  const { testimonials } = await collections();
  const docs = await testimonials
    .find({ status: "approved" }, { projection: { "photo.base64": 0 } }) // photos go out separately
    .sort({ createdAt: -1 })
    .limit(FEED_SIZE)
    .toArray();
  return docs.map(toPublic);
}

/** Only approved photos are ever served. */
export async function getApprovedPhoto(id: string): Promise<{ mime: PhotoMime; bytes: Buffer } | null> {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  const { testimonials } = await collections();
  const doc = await testimonials.findOne(
    { _id: new ObjectId(id), status: "approved" },
    { projection: { photo: 1 } },
  );
  if (!doc?.photo) return null;
  return { mime: doc.photo.mime, bytes: Buffer.from(doc.photo.base64, "base64") };
}

/* ─── checking a submission ──────────────────────────────────────────── */

export type CleanSubmission = Pick<TestimonialDoc, "name" | "profession" | "comment" | "locale" | "photo">;

export type Parsed =
  | { ok: true; bot: false; value: CleanSubmission }
  | { ok: true; bot: true }
  | { ok: false; reason: string };

// Control characters and invisible text-direction tricks.
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g;
const oneLine = (s: string) => s.replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
const paragraph = (s: string) => s.replace(/\r\n?/g, "\n").replace(INVISIBLE, "").trim();

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

function looksLike(bytes: Buffer, mime: PhotoMime) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return bytes.toString("latin1", 0, 4) === "RIFF" && bytes.toString("latin1", 8, 12) === "WEBP";
}

export function parseSubmission(body: unknown): Parsed {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, reason: "body" };
  const b = body as Record<string, unknown>;

  // Honeypot filled in → pretend it worked, store nothing.
  if (typeof b.website === "string" && b.website.trim() !== "") return { ok: true, bot: true };

  if (typeof b.name !== "string" || typeof b.profession !== "string" || typeof b.comment !== "string") {
    return { ok: false, reason: "fields" };
  }
  const name = oneLine(b.name);
  const profession = oneLine(b.profession);
  const comment = paragraph(b.comment);
  const locale: Locale | null = b.locale === "en" || b.locale === "fr" ? b.locale : null;
  if (!locale) return { ok: false, reason: "locale" };

  const errors = validate({ name, profession, comment, consent: b.consent === true });
  if (Object.keys(errors).length) return { ok: false, reason: Object.values(errors)[0]! };
  if (name.length > LIMITS.name.max || profession.length > LIMITS.profession.max) {
    return { ok: false, reason: "tooLong" };
  }

  let photo: CleanSubmission["photo"] = null;
  if (b.photo !== null && b.photo !== undefined) {
    const p = b.photo as Record<string, unknown>;
    const mime = PHOTO_TYPES.find((t) => t === p?.mime);
    if (typeof p !== "object" || !mime || typeof p.base64 !== "string") return { ok: false, reason: "photo" };
    if (p.base64.length > Math.ceil(PHOTO_MAX_BYTES / 3) * 4 || !BASE64.test(p.base64)) {
      return { ok: false, reason: "photoEncoding" };
    }
    const bytes = Buffer.from(p.base64, "base64");
    if (bytes.length === 0 || bytes.length > PHOTO_MAX_BYTES) return { ok: false, reason: "photoSize" };
    if (!looksLike(bytes, mime)) return { ok: false, reason: "photoType" }; // e.g. HTML or SVG renamed
    photo = { mime, base64: bytes.toString("base64"), bytes: bytes.length };
  }

  return { ok: true, bot: false, value: { name, profession, comment, locale, photo } };
}

/* ─── saving ─────────────────────────────────────────────────────────── */

// Store a keyed hash, never the raw IP address. Keyed with the (secret)
// connection string so the hashes can't be reversed by trying every IP.
function hashIp(ip: string) {
  return createHmac("sha256", process.env.MONGODB_URI ?? "sura").update(ip).digest("hex").slice(0, 32);
}

export async function createSubmission(
  value: CleanSubmission,
  ip: string | null,
): Promise<{ ok: true; item: Testimonial } | { ok: false; reason: "rateLimited" }> {
  const { testimonials, log } = await collections();
  const now = new Date();
  const ipHash = hashIp(ip ?? "unknown");

  const [recent, pending] = await Promise.all([
    log.countDocuments({ ipHash, at: { $gte: new Date(now.getTime() - 60 * 60 * 1000) } }),
    testimonials.countDocuments({ status: "pending" }),
  ]);
  if (recent >= PER_IP_PER_HOUR || pending >= MAX_PENDING) return { ok: false, reason: "rateLimited" };

  const doc: TestimonialDoc = {
    _id: new ObjectId(),
    ...value,
    status: "pending", // always — approval happens outside the website
    consent: true,
    createdAt: now,
  };
  await testimonials.insertOne(doc);
  await log.insertOne({ ipHash, at: now });

  return { ok: true, item: toPublic(doc) };
}

/* ─── admin — only called by routes that have already checked the admin cookie ─── */

export type AdminTestimonial = Testimonial & {
  /** Size of the stored photo, or null when there isn't one. */
  photoBytes: number | null;
  approvedAt: number | null;
};

function toAdmin(d: Omit<TestimonialDoc, "photo"> & { photo?: { mime: PhotoMime; bytes: number } | null }): AdminTestimonial {
  const item = toPublic(d);
  return {
    ...item,
    // Pending photos aren't public, so the dashboard loads them through its own signed-in route.
    photoUrl: d.photo ? `/api/admin/testimonials/${item.id}/photo` : null,
    photoBytes: d.photo?.bytes ?? null,
    approvedAt: d.approvedAt ? d.approvedAt.getTime() : null,
  };
}

const toObjectId = (id: string) => (/^[a-f0-9]{24}$/i.test(id) ? new ObjectId(id) : null);

/** Everything, newest first — pending and approved. */
export async function listAllForAdmin(max = 500): Promise<AdminTestimonial[]> {
  const { testimonials } = await collections();
  const docs = await testimonials
    .find({}, { projection: { "photo.base64": 0 } })
    .sort({ createdAt: -1 })
    .limit(max)
    .toArray();
  return docs.map(toAdmin);
}

/** Approve (publish) or move back to pending. null when the id doesn't exist. */
export async function setTestimonialStatus(
  id: string,
  status: "approved" | "pending",
): Promise<AdminTestimonial | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const { testimonials } = await collections();
  const current = await testimonials.findOne({ _id }, { projection: { "photo.base64": 0 } });
  if (!current) return null;
  if (current.status !== status) {
    await testimonials.updateOne(
      { _id },
      status === "approved"
        ? { $set: { status, approvedAt: new Date() } }
        : { $set: { status }, $unset: { approvedAt: "" } },
    );
  }
  const updated = await testimonials.findOne({ _id }, { projection: { "photo.base64": 0 } });
  return updated ? toAdmin(updated) : null;
}

/** Removes the testimonial and its photo for good. */
export async function deleteTestimonial(id: string): Promise<boolean> {
  const _id = toObjectId(id);
  if (!_id) return false;
  const { testimonials } = await collections();
  const res = await testimonials.deleteOne({ _id });
  return res.deletedCount === 1;
}

/** Any photo, pending or approved — for the dashboard only. */
export async function getPhotoForAdmin(id: string): Promise<{ mime: PhotoMime; bytes: Buffer } | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const { testimonials } = await collections();
  const doc = await testimonials.findOne({ _id }, { projection: { photo: 1 } });
  if (!doc?.photo) return null;
  return { mime: doc.photo.mime, bytes: Buffer.from(doc.photo.base64, "base64") };
}

/** How many testimonials are waiting for review — for the admin sidebar and dashboard. */
export async function countPendingTestimonials(): Promise<number> {
  const { testimonials } = await collections();
  return testimonials.countDocuments({ status: "pending" });
}
