import type { Metadata } from "next";
import { getBrand } from "@/lib/brands";

const BRAND = getBrand("iwacu");

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
};

/**
 * Everything under /iwacu: experiences, Kigali tours, events and the guide.
 * data-brand switches the colour tokens (app/globals.css); the wrapper paints
 * Iwacu's sand ground under every page. Header and footer come from (site)/.
 */
export default function IwacuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-brand="iwacu" className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
