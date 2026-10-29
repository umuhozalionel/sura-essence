"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { QuoteSearch } from "@/components/quote-search";
import { SeamlessStaySection } from "@/components/seamless-stay-section";
import { Testimonials } from "@/components/testimonials";
import { FounderSection } from "@/components/founder-section";
import { LeadMagnet } from "@/components/lead-magnet";
import { BrandLogo } from "@/components/chrome/brand-logo";
import { getBrand } from "@/lib/brands";

/** The two doors' photos. Files live in public/. */
const IWACU_IMAGE = "/backgrounds/akagera.jpg";
const MOVANA_IMAGE = "/backgrounds/winding-road.jpg";

/**
 * Two doors in one hero. From lg up they sit side by side: Iwacu's photo on
 * the left, Movana's live quote on the right. On phones the quote comes first,
 * above the fold, and Iwacu follows as a shorter photo band.
 *
 * Only the Iwacu photo is preloaded. Movana's backdrop shows from lg up only:
 * a lazy image inside a display:none box isn't fetched on phones. Nothing
 * between the quote card and the page clips, so place suggestions can hang
 * below the card.
 */
function DualHero() {
  const t = useTranslations("Hub.hero");

  return (
    <section className="relative z-10 bg-foreground text-white">
      <h1 className="sr-only">{t("srTitle")}</h1>
      <div className="mx-auto grid max-w-[1400px] gap-6 px-6 md:px-10 pt-[calc(var(--header-h)+1.5rem)] pb-10 lg:min-h-[100svh] lg:grid-cols-2 lg:pt-[calc(var(--header-h)+2rem)] lg:pb-12">

        {/* ── Movana: where to? ── */}
        <div className="relative order-1 flex min-w-0 flex-col justify-center gap-5 lg:order-2 lg:p-10">
          <div aria-hidden="true" className="absolute inset-0 hidden overflow-hidden rounded-2xl lg:block">
            <Image src={MOVANA_IMAGE} alt="" fill loading="lazy" sizes="50vw" className="object-cover" />
            <div className="absolute inset-0 bg-foreground/75" />
          </div>
          <div className="relative flex flex-col gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">{t("movana.eyebrow")}</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">{t("movana.title")}</h2>
            <p className="max-w-md text-sm md:text-base text-white/75">{t("movana.subtitle")}</p>
          </div>
          {/* Movana's colours inside the card: ink actions, gold highlights. */}
          <div data-brand="movana" className="relative z-20">
            <QuoteSearch layout="compact" />
          </div>
          <Link
            href="/movana"
            className="group relative inline-flex min-h-12 items-center gap-2 self-start rounded-2xl text-xs font-extrabold uppercase tracking-widest text-white/85 hover:text-white"
          >
            {t("movana.more")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        {/* ── Iwacu: the photo door ── */}
        <div className="relative order-2 flex min-h-[42svh] min-w-0 flex-col justify-end overflow-hidden rounded-2xl p-6 md:p-10 lg:order-1 lg:min-h-0">
          <Image
            src={IWACU_IMAGE}
            alt={t("iwacu.imageAlt")}
            fill
            preload
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/35 to-foreground/10" />
          <div className="relative flex max-w-lg flex-col items-start gap-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">{t("iwacu.eyebrow")}</span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">{t("iwacu.title")}</h2>
            <p className="text-sm md:text-base text-white/85">{t("iwacu.text")}</p>
            <Link
              href="/iwacu"
              className="group mt-2 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-secondary px-6 text-xs font-extrabold uppercase tracking-widest text-secondary-foreground transition-colors hover:bg-secondary-hover"
            >
              {t("iwacu.cta")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Card order and link. Taglines and descriptions come from Brands.<id>, the call to action from Hub.brands.<id>.
const BRAND_CARDS = [
  { id: "movana", href: "/movana" },
  { id: "iwacu", href: "/iwacu" },
] as const;

/** What SURA Essence is, and a card for each of its two brands, each in its own colours. */
function BrandStory() {
  const t = useTranslations("Hub.brands");
  const tBrands = useTranslations("Brands");

  return (
    <section id="brands" className="py-24 md:py-32 bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl flex flex-col gap-5 mb-12 md:mb-16">
          <span className="text-primary text-xs font-extrabold uppercase tracking-widest">{t("eyebrow")}</span>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[0.95]">{t("title")}</h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{t("intro")}</p>
        </div>
        <ul className="grid gap-6 md:grid-cols-2">
          {BRAND_CARDS.map((card) => (
            <li key={card.id} data-brand={card.id}>
              <Link
                href={card.href}
                className="group flex h-full flex-col gap-6 rounded-2xl border border-border bg-card p-8 md:p-10 text-foreground transition-colors hover:border-primary"
              >
                <span className="sr-only">{getBrand(card.id).name}</span>
                <BrandLogo brand={card.id} tone="dark" size="footer" />
                <span className="text-2xl md:text-3xl font-extrabold tracking-tight">{tBrands(`${card.id}.tagline`)}</span>
                <span className="text-base text-muted-foreground leading-relaxed">{tBrands(`${card.id}.footer.description`)}</span>
                <span className="mt-auto inline-flex min-h-12 items-center gap-2 self-start rounded-2xl bg-primary px-6 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-colors group-hover:bg-primary-hover">
                  {t(`${card.id}.cta`)}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * The SURA Essence hub. Activities, destinations and the gallery moved to the
 * Iwacu home; with four sections left the old scroll spy went too.
 */
export function HomeView() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <DualHero />
      {/* SeamlessStay starts flush (pt-0), so it gets the gap here. */}
      <div className="pt-24 md:pt-32">
        <SeamlessStaySection />
      </div>
      <BrandStory />
      {/* Guest stories first, to build trust before introducing the team. */}
      <Testimonials />
      <FounderSection />
      {/* The arrival guide shows here and on /tours only, not on every page. */}
      <LeadMagnet />
    </div>
  );
}
