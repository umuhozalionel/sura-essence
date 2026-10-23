/**
 * Site content: text blocks that staff can reword without a deploy, kept in
 * the site_content collection (one document per section). Safe to import in
 * the browser; the database side is lib/cms/site-content-server.ts.
 *
 * Every block has a default in messages/*.json (`messages` + `key` below). A
 * block left empty in the admin shows that default, so nothing is ever blank.
 * Placeholders in braces ({km}, {margin}…) are filled with live figures when
 * the text is shown; the editor only accepts the ones listed for the block.
 */
import type { Localized } from "./localized";

export type ContentBlock = {
  /** Path under the section's messages namespace, e.g. "methods.cabBody". */
  key: string;
  multiline?: boolean;
  /** Placeholders this block may use. */
  vars?: string[];
};

export type ContentSection = {
  /** messages/*.json namespace holding the defaults. */
  messages: string;
  /** Where the text appears: "admin" (staff pages) or "public". */
  audience: "admin" | "public";
  blocks: ContentBlock[];
};

export const CONTENT_SECTIONS = {
  /** Admin → Fleet & rates: headings and the "How trips are priced" steps. */
  fleet: {
    messages: "Admin.fleet",
    audience: "admin",
    blocks: [
      { key: "title" },
      { key: "classes.title" },
      { key: "classes.subtitle" },
      { key: "destinations.title" },
      { key: "destinations.subtitle" },
      { key: "methods.title" },
      { key: "methods.subtitle", vars: ["step"] },
      { key: "methods.airportTitle" },
      { key: "methods.airportBody", multiline: true },
      { key: "methods.cabTitle" },
      { key: "methods.cabBody", multiline: true, vars: ["km"] },
      { key: "methods.hourlyTitle" },
      { key: "methods.hourlyBody", multiline: true, vars: ["hours", "min", "max", "km"] },
      { key: "methods.longTitle" },
      { key: "methods.longBody", multiline: true, vars: ["margin"] },
    ],
  },
  /** The public /pricing page heading. */
  pricing: {
    messages: "Pricing",
    audience: "public",
    blocks: [
      { key: "badge" },
      { key: "title" },
      { key: "titleHighlight" },
      { key: "subtitle", multiline: true },
      { key: "cta" },
    ],
  },
} as const satisfies Record<string, ContentSection>;

export type ContentSectionId = keyof typeof CONTENT_SECTIONS;
export const CONTENT_SECTION_IDS = Object.keys(CONTENT_SECTIONS) as ContentSectionId[];

export const CONTENT_LIMITS = { block: 1200 } as const;

/** One section as the admin edits it: every block with its default and what's saved. */
export type AdminContentSection = {
  id: ContentSectionId;
  audience: "admin" | "public";
  blocks: { key: string; multiline: boolean; vars: string[]; default: Localized; saved: Localized }[];
  updatedAt: number | null;
};

/** Resolved text for one section in one language: block key → text (placeholders not filled yet). */
export type SectionText = Record<string, string>;

/** Fills {name} placeholders. Unknown ones are left as they are. */
export function fillText(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

/** Placeholders used in a text: "{km} km" → ["km"]. */
export const placeholdersIn = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
