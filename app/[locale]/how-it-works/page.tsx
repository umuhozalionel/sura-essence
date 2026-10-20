import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HowItWorks } from "@/components/how-it-works";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Header.nav");
  return { title: `${t("howItWorks")} | SURA Essence` };
}

// The "How it works" walkthrough, moved off the homepage onto its own page.
// Header (solid on this page) and footer come from components/site-chrome.tsx.
export default async function HowItWorksPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen w-full bg-background pt-[calc(var(--header-h)+4rem)]">
      <HowItWorks />
    </div>
  );
}
