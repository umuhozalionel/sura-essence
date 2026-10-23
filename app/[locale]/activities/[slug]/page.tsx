import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, MessageCircle, Navigation } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";
import { getExperienceSlugs, getSiteExperienceDetail } from "@/lib/cms/site-data";
import { getSiteSettings } from "@/lib/cms/site-settings-server";

/*
 * One page per experience: /activities/<slug>. It replaces the three hand-made
 * season pages (activity-season1/2/3 now redirect here, see next.config.ts).
 * Everything on it is edited in Admin → Experiences: details, itinerary,
 * highlights, packages and prices. While MongoDB can't answer, the same trips
 * are built from messages/*.json (lib/cms/legacy.ts).
 *
 * Upcoming trips can be reserved on WhatsApp; past ones keep their packages
 * on show, greyed out.
 */

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  return (await getExperienceSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const detail = await getSiteExperienceDetail(slug, locale);
  if (!detail) return {};
  return { title: detail.title, description: detail.subtitle };
}

const TONE_DOT: Record<string, string> = {
  green: "bg-secondary",
  copper: "bg-primary",
  blue: "bg-primary",
};

export default async function ExperiencePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [detail, t, format, { settings }] = await Promise.all([
    getSiteExperienceDetail(slug, locale),
    getTranslations("ExperienceDetail"),
    getFormatter(),
    getSiteSettings(),
  ]);
  if (!detail) notFound();

  const past = detail.when === "past";
  const whatsapp = `https://wa.me/${settings.contact.whatsapp}?text=${encodeURIComponent(detail.whatsappText || detail.title)}`;
  const cta = (label: string, large: boolean) =>
    detail.bookable ? (
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full flex items-center justify-center gap-2 ${large ? "bg-primary text-primary-foreground py-3.5" : "bg-foreground text-white py-3"} text-xs font-extrabold uppercase tracking-widest rounded-2xl transition-opacity hover:opacity-90`}
      >
        <MessageCircle className="w-4 h-4" aria-hidden /> {label || t("reserve")}
      </a>
    ) : (
      <div className={`w-full flex items-center justify-center gap-2 ${large ? "bg-muted py-3.5" : "bg-muted/70 py-3"} text-muted-foreground text-xs font-extrabold uppercase tracking-widest rounded-2xl cursor-not-allowed`}>
        {past ? t("pastCta") : label}
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative w-full h-[50vh] min-h-[460px] pt-[var(--header-h)] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/60 z-10" />
          {detail.heroImage && (
            <Image src={detail.heroImage} alt={detail.title} fill preload sizes="100vw" className="object-cover object-center" />
          )}
        </div>
        <div className="relative z-20 text-center px-6 md:px-10 max-w-4xl flex flex-col items-center gap-4">
          <span className={`inline-block ${past ? "bg-muted-foreground" : "bg-primary"} text-white px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-widest rounded-2xl shadow-md`}>
            {past ? t("badgePast") : t("badgeUpcoming")}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white uppercase tracking-tighter leading-[0.95] drop-shadow-lg">
            {detail.title}
          </h1>
          {detail.subtitle && (
            <p className="text-white/90 text-xs md:text-sm font-bold uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">{detail.subtitle}</p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-24 md:py-32 px-6 md:px-10 max-w-[1400px] mx-auto flex flex-col gap-12">
        <Link
          href="/activities"
          className="self-start inline-flex min-h-12 items-center gap-2 text-xs font-extrabold text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden /> {t("back")}
        </Link>

        <div className="grid md:grid-cols-12 gap-10 md:gap-12">
          <div className="md:col-span-8 flex flex-col gap-10 md:gap-12">
            {detail.details.length > 0 && (
              <div className="bg-card p-6 md:p-10 border border-border rounded-2xl shadow-sm">
                <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight mb-6 md:mb-8">{t("detailsTitle")}</h2>
                <div className="grid sm:grid-cols-3 gap-6 md:gap-8">
                  {detail.details.map((d) => {
                    const Icon = getIcon(d.icon);
                    return (
                      <div key={d.id} className="flex flex-col gap-2">
                        <Icon className="w-5 h-5 text-primary" aria-hidden />
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{d.label}</span>
                        <span className="text-sm font-extrabold text-foreground">{d.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {detail.itinerary.length > 0 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight">{t("itineraryTitle")}</h2>
                <div className="relative pl-8 border-l-2 border-border flex flex-col gap-8">
                  {detail.itinerary.map((stage) => (
                    <div key={stage.id} className="relative">
                      <div className={`absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-background ${TONE_DOT[stage.tone] ?? TONE_DOT.green}`} />
                      <h3 className="text-base md:text-lg font-extrabold uppercase mb-3 text-primary">{stage.title}</h3>
                      <ul className="space-y-3">
                        {stage.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <Navigation className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                            <span className="text-sm font-semibold text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.highlights.length > 0 && (
              <div className="bg-foreground text-white p-6 md:p-8 rounded-2xl shadow-md">
                <h3 className="text-lg font-extrabold uppercase tracking-tight mb-6">{t("highlightsTitle")}</h3>
                <div className="grid sm:grid-cols-2 gap-3.5">
                  {detail.highlights.map((h) => {
                    const Icon = getIcon(h.icon);
                    return (
                      <div key={h.id} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                        <Icon className="w-4 h-4 text-primary shrink-0" aria-hidden />
                        <span className="text-xs font-bold uppercase tracking-widest">{h.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Packages (sticky) */}
          <div className="md:col-span-4">
            <div className="sticky top-[calc(var(--header-h)+1.5rem)] flex flex-col gap-5">
              {detail.packages.map((pkg, index) => {
                const price = format.number(pkg.price);
                return index === 0 ? (
                  <div key={pkg.id} className={`bg-card border-2 ${past ? "border-muted-foreground/40 opacity-90" : "border-primary"} rounded-2xl p-6 shadow-xl relative overflow-hidden`}>
                    {pkg.ribbon && (
                      <div className={`absolute top-0 right-0 ${past ? "bg-muted-foreground" : "bg-primary"} text-white px-3 py-1 text-xs font-extrabold uppercase tracking-widest`}>
                        {pkg.ribbon}
                      </div>
                    )}
                    <h3 className="text-xl font-extrabold uppercase tracking-tighter mb-1">{pkg.title}</h3>
                    <div className="text-3xl font-extrabold text-primary mb-1">
                      {price} <span className="text-sm text-muted-foreground font-bold">{pkg.currency}</span>
                    </div>
                    {pkg.note && <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-5">{pkg.note}</p>}
                    <ul className="space-y-2.5 mb-7 text-sm font-semibold text-muted-foreground">
                      {pkg.includes.map((inc) => (
                        <li key={inc.id} className={`flex items-center gap-2 ${inc.muted ? "text-muted-foreground italic" : ""}`}>
                          {!inc.muted && <Check className="w-4 h-4 text-primary shrink-0" aria-hidden />}
                          {inc.text}
                        </li>
                      ))}
                    </ul>
                    {cta(pkg.cta, true)}
                  </div>
                ) : (
                  <div key={pkg.id} className={`bg-card border border-border rounded-2xl p-6 shadow-sm ${past ? "opacity-90" : ""}`}>
                    <h3 className="text-lg font-extrabold uppercase tracking-tighter mb-1">{pkg.title}</h3>
                    <div className={`text-2xl font-extrabold text-foreground ${pkg.note ? "mb-2" : "mb-5"}`}>
                      {price} <span className="text-sm text-muted-foreground font-bold">{pkg.currency}</span>
                    </div>
                    {pkg.note && <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-5">{pkg.note}</p>}
                    <ul className="space-y-2 mb-6 text-xs font-semibold text-muted-foreground">
                      {pkg.includes.map((inc) => (
                        <li key={inc.id} className={`flex items-center gap-2 ${inc.muted ? "text-muted-foreground italic" : ""}`}>
                          {!inc.muted && <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />}
                          {inc.text}
                        </li>
                      ))}
                    </ul>
                    {cta(pkg.cta, false)}
                  </div>
                );
              })}

              {past && (
                <div className="bg-background border border-border rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-relaxed">{t("pastNote")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
