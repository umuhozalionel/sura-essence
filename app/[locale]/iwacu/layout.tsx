import type { Metadata } from "next";
import { brandLayoutMetadata } from "@/lib/brands/metadata";

// Pages below are titled "Page · SURA Iwacu" and share Iwacu's share card and icon.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return brandLayoutMetadata("iwacu", (await params).locale);
}

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
