import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PricingSection from "@/components/pricing-section";
import { SiteTextProvider } from "@/components/site-text";
import { getSiteText } from "@/lib/cms/site-content-server";

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
  // The heading text is editable in Admin → Site content (section "pricing").
  const pricing = await getSiteText("pricing", locale);

  return (
    <div className="min-h-screen w-full bg-background pt-[calc(var(--header-h)+4rem)]">
      <SiteTextProvider texts={{ pricing }}>
        <PricingSection />
      </SiteTextProvider>
    </div>
  );
}
