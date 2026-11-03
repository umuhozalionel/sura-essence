import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";
import PricingSection from "@/components/pricing-section";
import { QuoteSearch } from "@/components/quote-search";

/*
 * The SURA Movana home: the brand line and a live quote (the same QuoteSearch as
 * the hub), one card per Movana page, then the fleet and rates.
 */

// Card order, link and icon. Words: Brands.movana.nav.<id> and Brands.movana.home.cards.<id>.
const CARDS = [
  { id: "book", href: "/movana/book", icon: "car" },
  { id: "airportTransfers", href: "/movana/airport-transfers", icon: "plane" },
  { id: "driverHire", href: "/movana/driver-hire", icon: "users" },
  { id: "fleet", href: "/movana/fleet", icon: "banknote" },
  { id: "tripAlerts", href: "/movana/trip-alerts", icon: "alertTriangle" },
] as const;

// PICTURE, for Lionel to place: the full-screen photo behind this page's top. File lives in public/.
const HERO_IMAGE = "/backgrounds/aerial-view.jpg";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Brands.movana" });
  // The layout's template would add " · SURA Movana" to a plain title; the home page is the brand itself.
  return { title: { absolute: `SURA Movana · ${t("tagline")}` }, description: t("footer.description") };
}

export default async function MovanaHomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Brands.movana");

  return (
    <>
      {/* A full-screen photo under the transparent header. Only the photo's box clips, so place suggestions can hang below the card. */}
      <section className="relative z-10 flex min-h-svh flex-col justify-center bg-foreground text-white pt-[calc(var(--header-h)+2rem)] pb-16 md:pb-24">
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <Image src={HERO_IMAGE} alt="" fill preload sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/25" />
        </div>
        <div className="relative w-full max-w-[1400px] mx-auto px-6 md:px-10 grid gap-10 lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div className="flex min-w-0 flex-col gap-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">{t("home.eyebrow")}</span>
            <h1 className="font-display text-4xl md:text-6xl [@media(max-height:760px)]:text-4xl font-medium tracking-[-0.01em] leading-[1.05] max-w-4xl">{t("home.title")}</h1>
            <p className="text-base md:text-lg text-white/90 max-w-2xl">{t("home.intro")}</p>
            <div>
              <Link
                href="/movana/book"
                className="inline-flex min-h-12 items-center gap-3 px-6 py-3 rounded-2xl bg-primary-on-dark text-primary-on-dark-foreground hover:bg-card hover:text-foreground text-xs font-extrabold uppercase tracking-widest transition-colors"
              >
                {t("nav.book")} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* The quick quote. Nothing here clips, so place suggestions can hang below the card. */}
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl md:text-3xl font-medium tracking-[-0.01em]">{t("home.quoteTitle")}</h2>
              <p className="text-sm md:text-base text-white/90">{t("home.quoteSubtitle")}</p>
            </div>
            <QuoteSearch layout="compact" />
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <ul className="max-w-[1400px] mx-auto px-6 md:px-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CARDS.map((card) => {
            const Icon = getIcon(card.icon);
            return (
              <li key={card.id}>
                <Link
                  href={card.href}
                  className="group flex h-full min-h-12 flex-col gap-4 rounded-2xl border border-border bg-card p-6 hover:border-primary transition-colors"
                >
                  <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  <span className="text-base font-extrabold text-foreground">{t(`nav.${card.id}`)}</span>
                  <span className="text-sm text-muted-foreground">{t(`home.cards.${card.id}`)}</span>
                  <ArrowRight className="mt-auto w-5 h-5 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <PricingSection />
    </>
  );
}
