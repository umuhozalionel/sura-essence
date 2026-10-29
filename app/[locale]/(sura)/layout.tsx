import type { Metadata } from "next";
import { BrandChrome } from "@/components/chrome/brand-chrome";
import { brandLayoutMetadata } from "@/lib/brands/metadata";

// Pages below are titled "Page · SURA Essence"; the hub sets its own full title.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return brandLayoutMetadata("sura", (await params).locale);
}

/** SURA Essence, the parent brand: the hub, contact and anything not under /movana or /iwacu. */
export default function SuraLayout({ children }: { children: React.ReactNode }) {
  return <BrandChrome brand="sura">{children}</BrandChrome>;
}
