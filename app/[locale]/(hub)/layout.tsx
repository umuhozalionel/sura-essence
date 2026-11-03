import type { Metadata } from "next";
import { BrandHeader } from "@/components/chrome/brand-header";
import { brandLayoutMetadata } from "@/lib/brands/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return brandLayoutMetadata("sura", (await params).locale);
}

/** The chooser at /: a slim header and no footer. Everything else of SURA Essence's is in (sura)/. */
export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BrandHeader brand="sura" slim />
      <main id="main" className="w-full min-h-svh">
        {children}
      </main>
    </>
  );
}
