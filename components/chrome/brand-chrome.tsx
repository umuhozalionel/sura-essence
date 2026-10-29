"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { wantsSolidHeader, type BrandId } from "@/lib/brands";
import { BrandHeader } from "./brand-header";
import { BrandFooter } from "./brand-footer";

const SolidHeaderContext = createContext<(solid: boolean) => void>(() => {});

/**
 * Asks for the solid header while the calling page is shown, e.g. a tour
 * venue whose top is cream rather than a dark photo.
 */
export function useSolidHeader(solid: boolean) {
  const setSolid = useContext(SolidHeaderContext);
  useEffect(() => {
    setSolid(solid);
    return () => setSolid(false);
  }, [setSolid, solid]);
}

/**
 * One brand's header and footer around its pages. Rendered by the brand's
 * layout ((sura)/, movana/(site)/, iwacu/(site)/), so it stays mounted while
 * the visitor moves between that brand's pages. Pages without chrome (the
 * booking app, admin) live outside those folders.
 */
export function BrandChrome({ brand, children }: { brand: BrandId; children: React.ReactNode }) {
  const pathname = usePathname();
  const [pageWantsSolid, setPageWantsSolid] = useState(false);

  return (
    <SolidHeaderContext.Provider value={setPageWantsSolid}>
      <BrandHeader brand={brand} forceSolid={pageWantsSolid || wantsSolidHeader(brand, pathname)} />
      <main id="main" className="w-full min-h-screen">
        {children}
      </main>
      <BrandFooter brand={brand} />
    </SolidHeaderContext.Provider>
  );
}
