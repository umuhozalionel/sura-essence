/**
 * Site settings: one document (`_id: "site"`) with the contact details that are
 * hardcoded in 14 files today (phone, WhatsApp, email) and the social links.
 * Safe to import in the browser. The database side is lib/cms/site-settings-server.ts.
 */

export const SETTINGS_SOCIALS = ["instagram", "facebook", "linkedin", "twitter", "tiktok", "youtube"] as const;
export type SettingsSocial = (typeof SETTINGS_SOCIALS)[number];

export type SiteSettings = {
  contact: {
    /** As people read it: "+250 788 564 000". */
    phone: string;
    /** Digits only, for wa.me links: "250788564000". */
    whatsapp: string;
    email: string;
  };
  socials: { platform: SettingsSocial; url: string }[];
};

export type AdminSiteSettings = SiteSettings & { updatedAt: number | null };

/** The official details, used to seed the database and whenever it can't answer. */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  contact: { phone: "+250 788 564 000", whatsapp: "250788564000", email: "hello@sura.rw" },
  socials: [],
};
