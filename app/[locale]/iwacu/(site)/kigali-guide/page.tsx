import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/brands/metadata";
import { HowItWorks } from "@/components/how-it-works";

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = pageMetadata("Brands.iwacu.meta", "kigaliGuide");

// The "How it works" walkthrough, moved off the homepage onto its own page.
// Header (solid on this page, see lib/brands) and footer come from ../layout.tsx.
export default async function HowItWorksPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen w-full bg-background pt-[calc(var(--header-h)+4rem)]">
      <HowItWorks />
    </div>
  );
}
