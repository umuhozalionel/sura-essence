/**
 * Text in English and French, shared by every CMS collection.
 * Safe to import in the browser.
 *
 * English is required wherever a field is required; French may be left empty,
 * in which case the website shows the English text (same rule as board members).
 */

export const CMS_LOCALES = ["en", "fr"] as const;
export type CmsLocale = (typeof CMS_LOCALES)[number];

export type Localized = Record<CmsLocale, string>;
export type LocalizedList = Record<CmsLocale, string[]>;

export const EMPTY_LOCALIZED: Localized = { en: "", fr: "" };

export const toLocale = (v: unknown): CmsLocale => (v === "fr" ? "fr" : "en");

/** The text in `locale`, or the English text when that's empty. */
export const pick = (v: Localized, locale: CmsLocale): string => v[locale] || v.en;

/** The list in `locale`, or the English list when that's empty. */
export const pickList = (v: LocalizedList, locale: CmsLocale): string[] => (v[locale].length ? v[locale] : v.en);

/** True when the French text is missing and the English one would be shown instead. */
export const isFallback = (v: Localized, locale: CmsLocale) => locale !== "en" && !v[locale] && Boolean(v.en);
