import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";
import PricingSection from "@/components/pricing-section";

/*
 * TEMPORARY Movana home, built from existing pieces only: a short intro, one
 * card per Movana page and the fleet & rates section. Phase 3 replaces it with
 * the real Movana home (quote hero, services, fleet strip).
 */

// Card order, link and icon. Words: Brands.movana.nav.<id> and Brands.movana.home.cards.<id>.
const CARDS = [
  { id: "book", href: "/movana/book", icon: "car" },
  { id: "airportTransfers", href: "/movana/airport-transfers", icon: "plane" },
  { id: "driverHire", href: "/movana/driver-hire", icon: "users" },
  { id: "fleet", href: "/movana/fleet", icon: "banknote" },
  { id: "tripAlerts", href: "/movana/trip-alerts", icon: "alertTriangle" },
] as const;

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
      {/* Dark top, so the transparent header reads over it like it does over a photo. */}
      <section className="bg-foreground text-white pt-[calc(var(--header-h)+4rem)] pb-16 md:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col gap-6">
          <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">{t("home.eyebrow")}</span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] max-w-4xl">{t("home.title")}</h1>
          <p className="text-base md:text-lg text-white/70 max-w-2xl">{t("home.intro")}</p>
          <div>
            <Link
              href="/movana/book"
              className="inline-flex min-h-12 items-center gap-3 px-6 py-3 rounded-2xl bg-primary-on-dark text-primary-on-dark-foreground hover:bg-card hover:text-foreground text-xs font-extrabold uppercase tracking-widest transition-colors"
            >
              {t("nav.book")} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
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
