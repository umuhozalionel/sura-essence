import type { Metadata } from "next";
import { brandLayoutMetadata } from "@/lib/brands/metadata";

// Pages below are titled "Page · SURA Movana" and share Movana's share card and icon.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return brandLayoutMetadata("movana", (await params).locale);
}

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
