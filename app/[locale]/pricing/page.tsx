import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PricingSection from "@/components/pricing-section";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Header.nav");
  return { title: `${t("pricing")} | SURA Essence` };
}

// Fleet rates, moved off the homepage onto their own page.
// Header (solid on this page) and footer come from components/site-chrome.tsx.
export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen w-full bg-[#F9F8F6] pt-[var(--header-h)] pb-24">
      <PricingSection />
    </div>
  );
}
