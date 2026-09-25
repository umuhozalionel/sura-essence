/**
 * Admin display preferences, kept in two small cookies so the server can
 * render the right theme and sidebar width straight away (no flash).
 * They hold no personal data and aren't used for sign-in.
 */
export const THEME_COOKIE = "sura_admin_theme";
export const SIDEBAR_COOKIE = "sura_admin_sidebar";

export const ADMIN_THEMES = ["light", "dark", "system"] as const;
export type AdminTheme = (typeof ADMIN_THEMES)[number];

export const parseTheme = (value?: string): AdminTheme =>
  value === "light" || value === "dark" ? value : "system";

/** Browser only. Remembered for a year, for the whole site path (/en/admin and /fr/admin). */
export function savePref(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}
