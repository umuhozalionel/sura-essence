import type { Metadata } from "next";
import { getBrand } from "@/lib/brands";

const BRAND = getBrand("movana");

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
};

/**
 * Everything under /movana: rides, transfers, drivers and the booking app.
 * data-brand switches the colour tokens (app/globals.css); the wrapper paints
 * the brand's ground under every page. Header and footer come from (site)/.
 */
export default function MovanaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-brand="movana" className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
