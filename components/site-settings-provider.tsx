"use client";

import { createContext, useContext } from "react";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/cms/site-settings";

/**
 * The site settings (phone, WhatsApp, email, socials) for client components.
 * app/[locale]/layout.tsx reads them once (cached under the site-settings tag,
 * cleared on every admin save) and passes them here. Outside the provider, and
 * whenever the database can't answer, the official defaults stand in.
 */
const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SITE_SETTINGS);

export function SiteSettingsProvider({ value, children }: { value: SiteSettings; children: React.ReactNode }) {
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export const useSiteSettings = () => useContext(SiteSettingsContext);

/** Just the contact details: { phone, whatsapp, email }. */
export const useSiteContact = () => useContext(SiteSettingsContext).contact;
