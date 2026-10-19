/**
 * Server side of board members: MongoDB reads and writes, plus the seed taken
 * from the "Founder" texts in messages/en.json + messages/fr.json.
 * Only the API routes in app/api/board-members/ and app/api/admin/board-members/
 * import this. Admin functions assume the route has already checked the admin cookie.
 *
 * Collection: board_members (schema check created by `npm run db:setup`).
 * The first time the admin screen (or db:setup) runs, the three founders are
 * copied in from the message files. A marker in `app_meta` records that, so
 * deleting members later never brings the seed back.
 */
import { ObjectId, type Collection } from "mongodb";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { getDb, isMongoConfigured } from "./mongodb";
import {
  BOARD_LIMITS, BOARD_PHOTO, BOARD_PHOTO_TYPES, SOCIAL_PLATFORMS, localize, validateBoardMember,
  type AdminBoardMember, type BoardLocale, type BoardMemberInput, type BoardPhotoMime,
  type Localized, type LocalizedParagraphs, type PublicBoardMember, type SocialLink,
} from "./board-members";

/* ─── what's stored ──────────────────────────────────────────────────── */

export type BoardMemberDoc = {
  _id: ObjectId;
  name: string;
  role: Localized;
  tagline: Localized;
  bio: LocalizedParagraphs;
  email: string;
  socials: SocialLink[];
  imageUrl: string;
  photo: { mime: BoardPhotoMime; base64: string; bytes: number } | null;
  order: number;
  visible: boolean;
  /** Which message-file founder this came from ("cyomoro", …); absent for members added later. */
  seedKey?: string;
  createdAt: Date;
  updatedAt: Date;
};

type MetaDoc = { _id: string; at: Date };
const SEED_MARKER = "board_members_seeded";

let indexesReady: Promise<unknown> | null = null;

async function collections() {
  const db = await getDb();
  const members = db.collection<BoardMemberDoc>("board_members");
  const meta = db.collection<MetaDoc>("app_meta");
  indexesReady ??= members.createIndex({ visible: 1, order: 1 }).catch((err) => {
    indexesReady = null;
    throw err;
  });
  await indexesReady;
  return { members, meta };
}

/* ─── seed: the founders from the message files ─────────────────────── */

type SeedFounder = { id: string; name: string; photo: string; role: string; tagline: string; bio: string[]; email: string };

export function seedMembers(): Omit<BoardMemberDoc, "_id" | "createdAt" | "updatedAt">[] {
  const enList = en.Founder.founders as SeedFounder[];
  const frList = fr.Founder.founders as SeedFounder[];
  return enList.map((f, i) => {
    const frf = frList.find((x) => x.id === f.id);
    return {
      name: f.name,
      role: { en: f.role, fr: frf?.role ?? "" },
      tagline: { en: f.tagline, fr: frf?.tagline ?? "" },
      bio: { en: f.bio, fr: frf?.bio ?? [] },
      email: f.email,
      socials: [],
      imageUrl: f.photo,
      photo: null,
      order: i,
      visible: true,
      seedKey: f.id,
    };
  });
}

/** Copies the founders in once. Safe to call from several requests at the same time. */
async function seedOnce(members: Collection<BoardMemberDoc>, meta: Collection<MetaDoc>) {
  if (await meta.findOne({ _id: SEED_MARKER })) return;
  try {
    await meta.insertOne({ _id: SEED_MARKER, at: new Date() }); // only one request wins this
  } catch {
    return; // another request is seeding
  }
  try {
    if ((await members.countDocuments()) > 0) return;
    const now = new Date();
    await members.insertMany(seedMembers().map((m) => ({ ...m, _id: new ObjectId(), createdAt: now, updatedAt: now })));
  } catch (err) {
    await meta.deleteOne({ _id: SEED_MARKER }).catch(() => undefined); // let the next request try again
    throw err;
  }
}

/* ─── shaping ────────────────────────────────────────────────────────── */

type DocWithoutPhoto = Omit<BoardMemberDoc, "photo"> & { photo?: { mime: BoardPhotoMime; bytes: number } | null };

const version = (d: { updatedAt: Date }) => d.updatedAt.getTime().toString(36);

function toAdmin(d: DocWithoutPhoto): AdminBoardMember {
  const id = d._id.toHexString();
  return {
    id,
    name: d.name,
    role: d.role,
    tagline: d.tagline,
    bio: d.bio,
    email: d.email,
    socials: d.socials,
    imageUrl: d.imageUrl,
    uploadedPhotoUrl: d.photo ? `/api/admin/board-members/${id}/photo?v=${version(d)}` : null,
    photoBytes: d.photo?.bytes ?? null,
    order: d.order,
    visible: d.visible,
    updatedAt: d.updatedAt.getTime(),
  };
}

function toPublic(d: DocWithoutPhoto, locale: BoardLocale): PublicBoardMember {
  const id = d._id.toHexString();
  // The version in the URL changes on every save, so the long cache never shows an old photo.
  const photo = d.photo ? `/api/board-members/${id}/photo?v=${version(d)}` : d.imageUrl;
  return localize({ ...toAdmin(d), photo }, locale);
}

const NO_PHOTO_DATA = { projection: { "photo.base64": 0 } } as const;
const toObjectId = (id: string) => (/^[a-f0-9]{24}$/i.test(id) ? new ObjectId(id) : null);

/* ─── public ─────────────────────────────────────────────────────────── */

/** The founders exactly as the message files have them. Used whenever the database can't answer. */
export function fallbackBoard(locale: BoardLocale): PublicBoardMember[] {
  return seedMembers().map((m, i) => {
    const now = new Date(0);
    return toPublic({ ...m, _id: new ObjectId(i.toString(16).padStart(24, "0")), createdAt: now, updatedAt: now }, locale);
  });
}

/** Visible members in display order. Before the first seed, the message-file founders. */
export async function listPublicBoard(locale: BoardLocale): Promise<{ items: PublicBoardMember[]; source: "db" | "fallback" }> {
  if (!isMongoConfigured) return { items: fallbackBoard(locale), source: "fallback" };
  const { members, meta } = await collections();
  const [docs, seeded] = await Promise.all([
    members.find({ visible: true }, NO_PHOTO_DATA).sort({ order: 1, createdAt: 1 }).toArray(),
    meta.findOne({ _id: SEED_MARKER }),
  ]);
  if (!seeded && docs.length === 0) return { items: fallbackBoard(locale), source: "fallback" };
  return { items: docs.map((d) => toPublic(d, locale)), source: "db" };
}

export async function getPhoto(id: string, { includeHidden }: { includeHidden: boolean }) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const { members } = await collections();
  const doc = await members.findOne(includeHidden ? { _id } : { _id, visible: true }, { projection: { photo: 1 } });
  if (!doc?.photo) return null;
  return { mime: doc.photo.mime, bytes: Buffer.from(doc.photo.base64, "base64") };
}

/* ─── checking what the admin form sends ────────────────────────────── */

const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g;
const oneLine = (v: unknown) => (typeof v === "string" ? v.replace(INVISIBLE, "").replace(/\s+/g, " ").trim() : "");
const localized = (v: unknown): Localized => {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return { en: oneLine(o.en), fr: oneLine(o.fr) };
};
const paragraphs = (v: unknown): LocalizedParagraphs => {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const list = (x: unknown) => (Array.isArray(x) ? x.map(oneLine).filter(Boolean).slice(0, 12) : []);
  return { en: list(o.en), fr: list(o.fr) };
};

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
function looksLike(bytes: Buffer, mime: BoardPhotoMime) {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return bytes.toString("latin1", 0, 4) === "RIFF" && bytes.toString("latin1", 8, 12) === "WEBP";
}

export type ParsedMember =
  | { ok: true; value: Omit<BoardMemberInput, "photo">; photo: BoardMemberDoc["photo"] | undefined }
  | { ok: false; reason: string; field?: string };

export function parseMember(body: unknown): ParsedMember {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, reason: "body" };
  const b = body as Record<string, unknown>;

  const socials: SocialLink[] = (Array.isArray(b.socials) ? b.socials : [])
    .map((s) => (s && typeof s === "object" ? (s as Record<string, unknown>) : {}))
    .map((s) => ({ platform: s.platform as SocialLink["platform"], url: oneLine(s.url) }))
    .filter((s) => s.url);

  const value: Omit<BoardMemberInput, "photo"> = {
    name: oneLine(b.name),
    role: localized(b.role),
    tagline: localized(b.tagline),
    bio: paragraphs(b.bio),
    email: oneLine(b.email).toLowerCase(),
    socials,
    imageUrl: oneLine(b.imageUrl),
    visible: b.visible !== false,
  };
  if (socials.some((s) => !SOCIAL_PLATFORMS.includes(s.platform))) return { ok: false, reason: "socialInvalid" };

  const errors = validateBoardMember(value);
  const firstField = Object.keys(errors)[0];
  if (firstField) return { ok: false, reason: errors[firstField]!, field: firstField };

  let photo: BoardMemberDoc["photo"] | undefined;
  if (b.photo === null) photo = null;
  else if (b.photo !== undefined) {
    const p = b.photo as Record<string, unknown>;
    const mime = BOARD_PHOTO_TYPES.find((t) => t === p?.mime);
    if (typeof p !== "object" || !mime || typeof p.base64 !== "string") return { ok: false, reason: "photo" };
    if (p.base64.length > Math.ceil(BOARD_PHOTO.maxBytes / 3) * 4 || !BASE64.test(p.base64)) {
      return { ok: false, reason: "photoSize" };
    }
    const bytes = Buffer.from(p.base64, "base64");
    if (!bytes.length || bytes.length > BOARD_PHOTO.maxBytes) return { ok: false, reason: "photoSize" };
    if (!looksLike(bytes, mime)) return { ok: false, reason: "photoType" };
    photo = { mime, base64: bytes.toString("base64"), bytes: bytes.length };
  }
  return { ok: true, value, photo };
}

/* ─── admin ──────────────────────────────────────────────────────────── */

export async function listBoardForAdmin(): Promise<AdminBoardMember[]> {
  const { members, meta } = await collections();
  await seedOnce(members, meta);
  const docs = await members.find({}, NO_PHOTO_DATA).sort({ order: 1, createdAt: 1 }).toArray();
  return docs.map(toAdmin);
}

export async function createBoardMember(
  value: Omit<BoardMemberInput, "photo">,
  photo: BoardMemberDoc["photo"] | undefined,
): Promise<{ ok: true; item: AdminBoardMember } | { ok: false; reason: "tooMany" }> {
  const { members, meta } = await collections();
  await seedOnce(members, meta); // so adding someone first doesn't hide the founders
  if ((await members.countDocuments()) >= BOARD_LIMITS.members) return { ok: false, reason: "tooMany" };
  const last = await members.find({}, { projection: { order: 1 } }).sort({ order: -1 }).limit(1).next();
  const now = new Date();
  const doc: BoardMemberDoc = {
    _id: new ObjectId(),
    ...value,
    photo: photo ?? null,
    order: (last?.order ?? -1) + 1,
    createdAt: now,
    updatedAt: now,
  };
  await members.insertOne(doc);
  return { ok: true, item: toAdmin(doc) };
}

export async function updateBoardMember(
  id: string,
  value: Omit<BoardMemberInput, "photo">,
  photo: BoardMemberDoc["photo"] | undefined,
): Promise<AdminBoardMember | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const { members } = await collections();
  const updated = await members.findOneAndUpdate(
    { _id },
    { $set: { ...value, ...(photo !== undefined ? { photo } : {}), updatedAt: new Date() } },
    { returnDocument: "after", ...NO_PHOTO_DATA },
  );
  return updated ? toAdmin(updated) : null;
}

/** Show or hide on the website without opening the form. */
export async function setBoardMemberVisible(id: string, visible: boolean): Promise<AdminBoardMember | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const { members } = await collections();
  const updated = await members.findOneAndUpdate(
    { _id },
    { $set: { visible, updatedAt: new Date() } },
    { returnDocument: "after", ...NO_PHOTO_DATA },
  );
  return updated ? toAdmin(updated) : null;
}

export async function deleteBoardMember(id: string): Promise<boolean> {
  const _id = toObjectId(id);
  if (!_id) return false;
  const { members } = await collections();
  return (await members.deleteOne({ _id })).deletedCount === 1;
}

/** Saves a new display order: `ids` from first to last. Unknown ids are ignored. */
export async function reorderBoard(ids: string[]): Promise<AdminBoardMember[]> {
  const { members } = await collections();
  const valid = ids.map(toObjectId).filter((x): x is ObjectId => x !== null);
  if (valid.length) {
    await members.bulkWrite(valid.map((_id, order) => ({ updateOne: { filter: { _id }, update: { $set: { order } } } })));
  }
  const docs = await members.find({}, NO_PHOTO_DATA).sort({ order: 1, createdAt: 1 }).toArray();
  return docs.map(toAdmin);
}
