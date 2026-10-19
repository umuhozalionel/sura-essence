"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// Pages that bring their own frame: the booking app and the admin portal.
const BARE_ROUTES = ["/book", "/admin"];

// Pages whose top is light, so the header starts solid instead of transparent.
const SOLID_HEADER_ROUTES = ["/activities", "/how-it-works", "/pricing"];

const matches = (pathname: string, routes: string[]) =>
  routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

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

/** The site header and footer around every public page. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pageWantsSolid, setPageWantsSolid] = useState(false);

  if (matches(pathname, BARE_ROUTES)) {
    return <main id="main" className="w-full min-h-screen">{children}</main>;
  }

  return (
    <SolidHeaderContext.Provider value={setPageWantsSolid}>
      <Header forceSolid={pageWantsSolid || matches(pathname, SOLID_HEADER_ROUTES)} />
      <main id="main" className="w-full min-h-screen">
        {children}
      </main>
      <Footer />
    </SolidHeaderContext.Provider>
  );
}
