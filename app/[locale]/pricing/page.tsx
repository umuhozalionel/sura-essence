import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/header";
import PricingSection from "@/components/pricing-section";
import { Footer } from "@/components/footer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Header.nav");
  return { title: `${t("pricing")} | SURA Essence` };
}

// Fleet rates, moved off the homepage onto their own page.
export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen w-full bg-[#F9F8F6]">
      <Header forceSolid />
      <main id="main" className="pt-20 pb-24">
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
