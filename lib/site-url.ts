/**
 * The public address of the site, for the sitemap, robots.txt and metadataBase.
 * Set NEXT_PUBLIC_SITE_URL in each environment (e.g. https://sura.rw).
 */
// PLACEHOLDER: only used when NEXT_PUBLIC_SITE_URL isn't set. Replace once the domain is final.
const FALLBACK_SITE_URL = "https://sura.rw";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL).replace(/\/+$/, "");
