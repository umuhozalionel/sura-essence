import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/header";
import { HowItWorks } from "@/components/how-it-works";
import { Footer } from "@/components/footer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Header.nav");
  return { title: `${t("howItWorks")} | SURA Essence` };
}

// The "How it works" walkthrough, moved off the homepage onto its own page.
export default async function HowItWorksPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen w-full bg-white">
      <Header forceSolid />
      <main id="main" className="pt-20">
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
