import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BrandLogo } from "@/components/chrome/brand-logo";
import { FounderSection } from "@/components/founder-section";
import { SeamlessStaySection } from "@/components/seamless-stay-section";
import { Link } from "@/i18n/navigation";
import { getBrand } from "@/lib/brands";
import { pageMetadata } from "@/lib/brands/metadata";

export const generateMetadata = pageMetadata("Hub.pages", "about");

// PICTURE, for Lionel to place: the photo at the top of this page. File lives in public/.
const HERO_IMAGE = "/backgrounds/hero1.jpeg";

const BRAND_CARDS = [
  { id: "movana", href: "/movana" },
  { id: "iwacu", href: "/iwacu" },
] as const;

/** /about: what SURA Essence is, a card for each of its two brands, the board (Admin → Team), and how a stay works. */
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");
  const tBrands = await getTranslations("Brands");

  return (
    <>
      <section className="relative h-[40vh] min-h-[300px] pt-[var(--header-h)] flex items-center justify-center overflow-hidden bg-foreground">
        <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="object-cover" />
        <span aria-hidden="true" className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 text-center px-6 md:px-10 max-w-4xl mx-auto flex flex-col items-center gap-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">{t("eyebrow")}</span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.05]">{t("title")}</h1>
        </div>
      </section>

      <section id="brands" className="py-12 md:py-16 bg-background text-foreground">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col gap-8">
          <p className="max-w-3xl text-base md:text-lg leading-relaxed text-muted-foreground">{t("intro")}</p>
          <ul className="grid gap-5 md:grid-cols-2">
            {BRAND_CARDS.map((card) => (
              <li key={card.id} data-brand={card.id}>
                <Link href={card.href} className="group flex h-full flex-col gap-4 rounded-2xl bg-card p-6 md:p-8 text-foreground ring-1 ring-black/5 shadow-lg shadow-black/5 transition-shadow hover:shadow-xl hover:ring-primary/40">
                  <span className="sr-only">{getBrand(card.id).name}</span>
                  <BrandLogo brand={card.id} tone="dark" size="footer" />
                  <span className="text-xl md:text-2xl font-extrabold tracking-tight">{tBrands(`${card.id}.tagline`)}</span>
                  <span className="text-sm md:text-base text-muted-foreground leading-relaxed">{tBrands(`${card.id}.footer.description`)}</span>
                  <span className="mt-auto inline-flex items-center gap-2 text-sm font-extrabold text-primary">
                    {t(`${card.id}Cta`)}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FounderSection />

      <div className="bg-background pt-16">
        <p className="mx-auto mb-10 max-w-[1400px] px-6 text-center text-sm font-semibold text-primary md:px-10">{t("sections.stay")}</p>
        <SeamlessStaySection />
      </div>
    </>
  );
}
