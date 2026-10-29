import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/brands/metadata";
import PricingSection from "@/components/pricing-section";
import { SiteTextProvider } from "@/components/site-text";
import { getSiteText } from "@/lib/cms/site-content-server";

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = pageMetadata("Brands.movana.meta", "fleet");

// Fleet rates, moved off the homepage onto their own page.
// Header (solid on this page, see lib/brands) and footer come from ../layout.tsx.
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
