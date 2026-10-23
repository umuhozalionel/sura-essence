/**
 * Server side of site content. Collection: site_content, one document per
 * section: { _id: "fleet", blocks: [{ key: "methods.cabBody", text: { en, fr } }, …], updatedAt }.
 * (A list, not an object: block keys contain dots, which MongoDB field names shouldn't.)
 * Only blocks an admin has changed are stored; the rest come from messages/*.json.
 * Reads are cached under CMS_TAGS.siteContent and cleared by every save.
 */
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { isMongoConfigured } from "@/lib/mongodb";
import { CMS_TAGS, cachedRead, collection, invalidate } from "./server";
import { Reader, obj, type Parsed } from "./parse";
import { toLocale, type Localized } from "./localized";
import {
  CONTENT_LIMITS, CONTENT_SECTIONS, placeholdersIn,
  type AdminContentSection, type ContentBlock, type ContentSectionId, type SectionText,
} from "./site-content";

type StoredBlock = { key: string; text: Localized };
type SiteContentDoc = { _id: ContentSectionId; blocks: StoredBlock[]; createdAt: Date; updatedAt: Date };
const asMap = (blocks: StoredBlock[]) => Object.fromEntries(blocks.map((b) => [b.key, b.text])) as Record<string, Localized>;

const siteContent = () => collection<SiteContentDoc>("site_content");
const MESSAGES = { en, fr } as const;

/** The messages/*.json text for a block. */
function defaultText(section: ContentSectionId, key: string, locale: "en" | "fr"): string {
  const path = `${CONTENT_SECTIONS[section].messages}.${key}`.split(".");
  const v = path.reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], MESSAGES[locale]);
  return typeof v === "string" ? v : "";
}

const blocksOf = (section: ContentSectionId): readonly ContentBlock[] => CONTENT_SECTIONS[section].blocks;

/* ─── public (cached) ────────────────────────────────────────────────── */

const loadSaved = cachedRead("site-content:all", CMS_TAGS.siteContent, async (): Promise<Partial<Record<ContentSectionId, Record<string, Localized>>>> => {
  const docs = await (await siteContent()).find({}).toArray();
  return Object.fromEntries(docs.map((d) => [d._id, asMap(d.blocks)]));
});

/**
 * Every block of a section in one language: the saved text when there is one,
 * else the default from messages/*.json.
 * Never throws: without the database it's simply the defaults.
 */
export async function getSiteText(section: ContentSectionId, locale: string): Promise<SectionText> {
  const l = toLocale(locale);
  let saved: Record<string, Localized> = {};
  if (isMongoConfigured) {
    try {
      saved = (await loadSaved())[section] ?? {};
    } catch (err) {
      console.error("[cms] site content unavailable, using messages/*.json:", err);
    }
  }
  return Object.fromEntries(
    blocksOf(section).map((b) => {
      const s = saved[b.key];
      // A language left empty shows that language's default text, never the other language.
      return [b.key, s?.[l] || defaultText(section, b.key, l)];
    }),
  );
}

/* ─── admin ──────────────────────────────────────────────────────────── */

export async function listContentForAdmin(): Promise<AdminContentSection[]> {
  const docs = await (await siteContent()).find({}).toArray();
  const byId = new Map(docs.map((d) => [d._id, d]));
  return (Object.keys(CONTENT_SECTIONS) as ContentSectionId[]).map((id) => {
    const doc = byId.get(id);
    return {
      id,
      audience: CONTENT_SECTIONS[id].audience,
      blocks: blocksOf(id).map((b) => ({
        key: b.key,
        multiline: Boolean(b.multiline),
        vars: [...(b.vars ?? [])],
        default: { en: defaultText(id, b.key, "en"), fr: defaultText(id, b.key, "fr") },
        saved: (doc ? asMap(doc.blocks)[b.key] : undefined) ?? { en: "", fr: "" },
      })),
      updatedAt: doc ? doc.updatedAt.getTime() : null,
    };
  });
}

/** A section's blocks as sent by the editor. Empty text = use the default. Placeholders must be ones the block offers. */
export function parseSectionBlocks(section: ContentSectionId, body: unknown): Parsed<Record<string, Localized>> {
  const r = new Reader();
  const b = obj(obj(body).blocks);
  const out: Record<string, Localized> = {};
  for (const block of blocksOf(section)) {
    const value = r.localized(b[block.key], block.key, { max: CONTENT_LIMITS.block, multiline: Boolean(block.multiline) });
    const allowed = new Set(block.vars ?? []);
    for (const l of ["en", "fr"] as const) {
      const bad = placeholdersIn(value[l]).find((p) => !allowed.has(p));
      if (bad) r.fail(`${block.key}.${l}`, "placeholder");
    }
    if (value.en || value.fr) out[block.key] = value;
  }
  for (const key of Object.keys(b)) if (!blocksOf(section).some((x) => x.key === key)) r.fail(key, "unknownKey");
  return r.result(out);
}

export async function saveSection(section: ContentSectionId, blocks: Record<string, Localized>): Promise<AdminContentSection> {
  const now = new Date();
  await (await siteContent()).updateOne(
    { _id: section },
    { $set: { blocks: Object.entries(blocks).map(([key, text]) => ({ key, text })), updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
  invalidate(CMS_TAGS.siteContent);
  return (await listContentForAdmin()).find((s) => s.id === section)!;
}

export const isContentSection = (v: string): v is ContentSectionId => v in CONTENT_SECTIONS;
