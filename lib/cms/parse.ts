/**
 * Checks what the admin forms send, for every CMS collection.
 *
 * Like the existing parsers (lib/driver-reviews-server.ts, lib/board-members-server.ts),
 * every document is rebuilt from scratch out of checked fields: unknown keys are
 * dropped, text is cleaned of control and text-direction characters, and the
 * first problem is reported as `{ field, reason }`.
 *
 * Media fields are plain strings holding a local /public path ("/activities/akagera/cover.jpg").
 * No uploads and no outside hosts.
 */
import { CMS_LOCALES, type Localized, type LocalizedList } from "./localized";

export type Obj = Record<string, unknown>;
export const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});

export type Parsed<T> = { ok: true; value: T } | { ok: false; reason: string; field: string };

// Control characters and invisible text-direction tricks.
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g;
// Only ordinary whitespace is collapsed: French text keeps its non-breaking spaces (U+00A0, U+202F).
const oneLine = (s: string) => s.replace(INVISIBLE, "").replace(/[ \t\n\r\f\v]+/g, " ").trim();
const multiLine = (s: string) =>
  s.replace(/\r\n?/g, "\n").replace(INVISIBLE, "").replace(/[ \t\f\v]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();

const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID = /^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/; // "eac", "day-1", "premium_suv", "gameDrive"
const MEDIA = /^\/(?!\/)[A-Za-z0-9._~\-/ ()]+\.(?:jpe?g|png|webp|avif|gif|svg|mp4|webm|mov|pdf)$/i;

type TextOpts = { max: number; required?: boolean; multiline?: boolean };

/** Collects the first error per field while reading a body. */
export class Reader {
  private errors: { field: string; reason: string }[] = [];

  fail(field: string, reason: string) {
    this.errors.push({ field, reason });
  }

  result<T>(value: T): Parsed<T> {
    const first = this.errors[0];
    return first ? { ok: false, ...first } : { ok: true, value };
  }

  text(v: unknown, field: string, { max, required = false, multiline = false }: TextOpts): string {
    const s = typeof v === "string" ? (multiline ? multiLine(v) : oneLine(v)) : "";
    if (required && !s) this.fail(field, "required");
    else if (s.length > max) this.fail(field, "tooLong");
    return s;
  }

  /** `required` means the English text is required. */
  localized(v: unknown, field: string, opts: TextOpts): Localized {
    const o = obj(v);
    const out = {} as Localized;
    for (const l of CMS_LOCALES) {
      out[l] = this.text(o[l], `${field}.${l}`, { ...opts, required: Boolean(opts.required) && l === "en" });
    }
    return out;
  }

  /** Paragraphs or bullet points. Empty lines are dropped. */
  localizedList(v: unknown, field: string, { max, items, required = false }: { max: number; items: number; required?: boolean }): LocalizedList {
    const o = obj(v);
    const out = {} as LocalizedList;
    for (const l of CMS_LOCALES) {
      const raw = Array.isArray(o[l]) ? (o[l] as unknown[]) : [];
      const list = raw.map((x, i) => this.text(x, `${field}.${l}.${i}`, { max })).filter(Boolean);
      if (list.length > items) this.fail(`${field}.${l}`, "tooMany");
      if (required && l === "en" && list.length === 0) this.fail(`${field}.en`, "required");
      out[l] = list.slice(0, items);
    }
    return out;
  }

  bool(v: unknown, fallback = false): boolean {
    return typeof v === "boolean" ? v : fallback;
  }

  number(v: unknown, field: string, { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false } = {}): number {
    if (typeof v !== "number" || !Number.isFinite(v)) {
      this.fail(field, "number");
      return min;
    }
    if (integer && !Number.isInteger(v)) this.fail(field, "integer");
    else if (v < min || v > max) this.fail(field, "outOfRange");
    return v;
  }

  /** null, undefined and "" → null; anything else must be a valid number. */
  optionalNumber(v: unknown, field: string, opts: { min?: number; max?: number; integer?: boolean } = {}): number | null {
    return v === null || v === undefined || v === "" ? null : this.number(v, field, opts);
  }

  oneOf<T extends string>(v: unknown, field: string, options: readonly T[], fallback?: T): T {
    if (typeof v === "string" && (options as readonly string[]).includes(v)) return v as T;
    if (fallback !== undefined && (v === undefined || v === null || v === "")) return fallback;
    this.fail(field, "invalid");
    return options[0];
  }

  /** "YYYY-MM-DD", or null when empty and not required. */
  date(v: unknown, field: string, { required = false } = {}): string | null {
    if (v === null || v === undefined || v === "") {
      if (required) this.fail(field, "required");
      return null;
    }
    if (typeof v !== "string" || !ISO_DATE.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`))) {
      this.fail(field, "date");
      return null;
    }
    return v;
  }

  /** "YYYY-MM", or null. */
  month(v: unknown, field: string): string | null {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v !== "string" || !ISO_MONTH.test(v)) {
      this.fail(field, "month");
      return null;
    }
    return v;
  }

  /** URL part: lowercase letters, digits and single hyphens ("akagera-national-park-2026"). */
  slug(v: unknown, field: string): string {
    const s = typeof v === "string" ? v.trim().toLowerCase() : "";
    if (!s) this.fail(field, "required");
    else if (s.length > 80 || !SLUG.test(s)) this.fail(field, "slug");
    return s;
  }

  /** Short key inside a document ("eac", "day-1", "premium_suv", "gameDrive"). */
  key(v: unknown, field: string): string {
    const s = typeof v === "string" ? v.trim() : "";
    if (!s) this.fail(field, "required");
    else if (s.length > 40 || !ID.test(s)) this.fail(field, "key");
    return s;
  }

  /** A file under /public, e.g. "/locations/fazenda-main.jpg". "" when empty and not required. */
  media(v: unknown, field: string, { required = false } = {}): string {
    const s = typeof v === "string" ? v.trim() : "";
    if (!s) {
      if (required) this.fail(field, "required");
      return "";
    }
    if (s.length > 300 || !MEDIA.test(s) || s.includes("..")) this.fail(field, "media");
    return s;
  }

  /** A list of /public files, e.g. a venue's photo gallery. */
  mediaList(v: unknown, field: string, max: number): string[] {
    const raw = Array.isArray(v) ? v : [];
    if (raw.length > max) this.fail(field, "tooMany");
    return raw.slice(0, max).map((x, i) => this.media(x, `${field}.${i}`, { required: true }));
  }

  /** An outside link (sources, socials). https only. */
  url(v: unknown, field: string, { required = false } = {}): string {
    const s = typeof v === "string" ? v.trim() : "";
    if (!s) {
      if (required) this.fail(field, "required");
      return "";
    }
    try {
      const u = new URL(s);
      if (u.protocol !== "https:" || s.length > 500) this.fail(field, "url");
    } catch {
      this.fail(field, "url");
    }
    return s;
  }

  list<T>(v: unknown, field: string, max: number, item: (o: Obj, field: string) => T): T[] {
    const raw = Array.isArray(v) ? v : [];
    if (raw.length > max) this.fail(field, "tooMany");
    return raw.slice(0, max).map((x, i) => item(obj(x), `${field}.${i}`));
  }

  /** Keys inside one list must not repeat. */
  unique(values: string[], field: string) {
    const seen = new Set<string>();
    values.forEach((v, i) => {
      if (seen.has(v)) this.fail(`${field}.${i}`, "duplicate");
      seen.add(v);
    });
  }
}
