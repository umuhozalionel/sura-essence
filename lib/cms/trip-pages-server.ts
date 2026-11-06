/**
 * What Admin → Trips → Page content changes on a trip's own pages. SERVER ONLY.
 * The defaults stay in messages/*.json; a trip's document stores only what staff changed,
 * in `page`. A language left empty shows that language's default, so nothing is ever blank.
 */
import { createTranslator } from "next-intl";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { isMongoConfigured } from "@/lib/mongodb";
import { CMS_TAGS, cachedRead } from "./server";
import { pick, toLocale, type CmsLocale } from "./localized";
import { Reader, obj, type Parsed } from "./parse";
import { TRIP_PAGES, isTripPage, type AdminTripPage, type TripPageContent, type TripPageText } from "./trips";
import { CLOUDINARY_PHOTO, INTERNAL_LINK, tripsCollection } from "./trips-server";

const MESSAGES = { en, fr } as const;
type Tree = Record<string, unknown>;

const at = (root: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((o, k) => (o as Tree | undefined)?.[k], root);

function setAt(root: Tree, path: string, value: unknown) {
  const keys = path.split(".");
  let o = root;
  for (const k of keys.slice(0, -1)) {
    o[k] = Array.isArray(o[k]) ? [...(o[k] as unknown[])] : { ...(o[k] as Tree | undefined) };
    o = o[k] as Tree;
  }
  o[keys[keys.length - 1]] = value;
}

type Leaf = { key: string; list: boolean };

/** Every piece of wording under `path`: a line of text, or a list of lines edited together. */
function leaves(value: unknown, path: string): Leaf[] {
  if (typeof value === "string") return [{ key: path, list: false }];
  if (Array.isArray(value)) {
    return value.every((x) => typeof x === "string") ? [{ key: path, list: true }] : value.flatMap((x, i) => leaves(x, `${path}.${i}`));
  }
  return value && typeof value === "object" ? Object.entries(value).flatMap(([k, v]) => leaves(v, `${path}.${k}`)) : [];
}

const namespacesOf = (slug: string): readonly string[] => (isTripPage(slug) ? TRIP_PAGES[slug].words : ["Trips.recap"]);
const skipOf = (slug: string): readonly string[] => (isTripPage(slug) ? TRIP_PAGES[slug].skip : []);
const mediaOf = (slug: string): readonly { key: string; kind: "photo" | "link"; default: string }[] => (isTripPage(slug) ? TRIP_PAGES[slug].media : []);

const leavesOf = (slug: string) =>
  namespacesOf(slug).flatMap((ns) => leaves(at(en, ns), ns)).filter((leaf) => !skipOf(slug).includes(leaf.key));

const loadPages = cachedRead("trips:pages", CMS_TAGS.trips, async () => {
  const docs = await (await tripsCollection()).find({}, { projection: { slug: 1, name: 1, page: 1 } }).toArray();
  return docs.map((d) => ({ slug: d.slug, name: d.name, page: d.page ?? null }));
});

/** The site's wording for this trip in one language, with what staff changed on top. */
export function tripMessages(slug: string, l: CmsLocale, page: TripPageContent | undefined): Tree {
  const messages: Tree = {};
  for (const ns of namespacesOf(slug)) setAt(messages, ns, at(MESSAGES[l], ns));
  for (const saved of page?.text ?? []) {
    const value = saved[l];
    if (value.length) setAt(messages, saved.key, Array.isArray(at(en, saved.key)) ? value : value[0]);
  }
  return messages;
}

/** A trip's words and files in one language, with what staff changed on top. Never throws. */
export async function getTripPage(slug: string, locale: string) {
  const l: CmsLocale = toLocale(locale);
  let doc: Awaited<ReturnType<typeof loadPages>>[number] | undefined;
  if (isMongoConfigured) {
    try {
      doc = (await loadPages()).find((d) => d.slug === slug);
    } catch (err) {
      console.error("[cms] trip pages unavailable, using messages/*.json:", err);
    }
  }

  const messages = tripMessages(slug, l, doc?.page ?? undefined);
  if (doc && isTripPage(slug)) setAt(messages, `Trips.${slug}.name`, pick(doc.name, l));

  const files = new Map((doc?.page?.media ?? []).map((m) => [m.key, m.value]));
  return {
    /** Words for a server page: createTranslator() over them, like getTranslations(). */
    translator: <N extends string>(namespace: N) =>
      createTranslator({ locale: l, messages: messages as never, namespace: namespace as never }) as unknown as ((key: string, values?: Record<string, string | number>) => string) & { raw: (key: string) => unknown },
    /** Words for client components, through <TripWords>. */
    trips: messages.Trips as Tree,
    media: (key: string) => files.get(key) ?? mediaOf(slug).find((m) => m.key === key)?.default ?? "",
  };
}

/* ─── admin ──────────────────────────────────────────────────────────── */

const lines = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : typeof v === "string" && v ? [v] : []);

export function adminTripPage(slug: string, page: TripPageContent | undefined): AdminTripPage {
  const text = new Map((page?.text ?? []).map((t) => [t.key, t]));
  const media = new Map((page?.media ?? []).map((m) => [m.key, m.value]));
  return {
    blocks: leavesOf(slug).map(({ key, list }) => ({
      key,
      list,
      default: { en: lines(at(en, key)), fr: lines(at(fr, key)) },
      saved: { en: text.get(key)?.en ?? [], fr: text.get(key)?.fr ?? [] },
    })),
    media: mediaOf(slug).map((m) => ({ key: m.key, kind: m.kind, default: m.default, saved: media.get(m.key) ?? "" })),
  };
}

const variables = (s: string) => [...s.matchAll(/\{\s*(\w+)/g)].map((m) => m[1]);
const balanced = (s: string) => {
  let depth = 0;
  for (const c of s) {
    if (c === "{") depth += 1;
    if (c === "}" && --depth < 0) return false;
  }
  return depth === 0;
};

/**
 * What the form sends. Live figures like {price} must stay as the default has them,
 * because a broken one would show as an error on the page.
 */
export function parseTripPage(slug: string, body: unknown): Parsed<TripPageContent> {
  const r = new Reader();
  const b = obj(body);
  const sent = obj(b.text);
  const text: TripPageText[] = [];
  for (const { key, list } of leavesOf(slug)) {
    const o = obj(sent[key]);
    const allowed = new Set([...lines(at(en, key)), ...lines(at(fr, key))].flatMap(variables));
    const read = (l: CmsLocale) => {
      const raw = Array.isArray(o[l]) ? (o[l] as unknown[]) : [];
      if (raw.length > 40) r.fail(`${key}.${l}`, "tooMany");
      const out = raw.slice(0, 40).map((x) => r.text(x, `${key}.${l}`, { max: 2000, multiline: true })).filter(Boolean);
      if (!list && out.length > 1) r.fail(`${key}.${l}`, "invalid");
      if (out.some((s) => !balanced(s) || variables(s).some((v) => !allowed.has(v)))) r.fail(`${key}.${l}`, "placeholder");
      return out;
    };
    const value = { key, en: read("en"), fr: read("fr") };
    if (value.en.length || value.fr.length) text.push(value);
  }
  const sentMedia = obj(b.media);
  const media: TripPageContent["media"] = [];
  for (const m of mediaOf(slug)) {
    const value = typeof sentMedia[m.key] === "string" ? (sentMedia[m.key] as string).trim() : "";
    if (!value) continue;
    if (m.kind === "link") {
      if (value.length > 200 || !INTERNAL_LINK.test(value)) r.fail(`media.${m.key}`, "invalid");
    } else if (!CLOUDINARY_PHOTO.test(value) || value.length > 500) {
      r.media(value, `media.${m.key}`);
    }
    media.push({ key: m.key, value });
  }
  return r.result({ text, media });
}
