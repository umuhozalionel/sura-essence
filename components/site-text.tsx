"use client";

import { createContext, useCallback, useContext } from "react";
import { useTranslations } from "next-intl";
import { fillText, type ContentSectionId, type SectionText } from "@/lib/cms/site-content";

/**
 * Editable text blocks (site_content), handed down from a server page.
 * A page loads its section with getSiteText() and wraps its content in
 * <SiteTextProvider>; components read a block with useSiteText(). Without a
 * provider, or for a block that isn't editable, the text comes from
 * messages/*.json as usual.
 */
const SiteTextContext = createContext<Partial<Record<ContentSectionId, SectionText>>>({});

export function SiteTextProvider({ texts, children }: { texts: Partial<Record<ContentSectionId, SectionText>>; children: React.ReactNode }) {
  const parent = useContext(SiteTextContext);
  return <SiteTextContext.Provider value={{ ...parent, ...texts }}>{children}</SiteTextContext.Provider>;
}

/**
 * Text for `section` (see CONTENT_SECTIONS), with the messages namespace it
 * defaults to. `key` is the block key ("methods.cabBody"); `vars` fill {placeholders}.
 */
export function useSiteText(section: ContentSectionId, namespace: string) {
  const texts = useContext(SiteTextContext)[section];
  const t = useTranslations(namespace);
  return useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const saved = texts?.[key];
      return saved !== undefined ? fillText(saved, vars) : t(key, vars);
    },
    [texts, t],
  );
}
