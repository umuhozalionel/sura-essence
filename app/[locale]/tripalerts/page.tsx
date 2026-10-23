"use client";

import { Calendar, ChevronRight, ExternalLink, Globe, Info, ShieldAlert } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePricing } from "@/components/pricing-provider";

// Alerts come from messages/en.json + messages/fr.json (namespace "TripAlerts").
// Add an alert by adding an entry to the "alerts" array in those two files
// (newest first). "sources" is optional: official pages the alert is based on.
// In the text, {petrol} and {diesel} are replaced with today's fuel prices from
// lib/pricing.ts, so the pricing alert never goes stale.
// "reviewedOn" (YYYY-MM-DD) is the day the border and entry rules were last checked.
type Source = { label: string; url: string };
type Alert = { id: string; date: string; isUrgent: boolean; title: string; content: string; sources?: Source[] };

/** A calendar date (YYYY-MM-DD) as a Date that shows the same day in every time zone. */
const calendarDay = (iso: string) => new Date(`${iso}T12:00:00Z`);

export default function TripAlertsPage() {
  const t = useTranslations("TripAlerts");
  const format = useFormatter();
  // Fuel prices in the alert texts are the live rates (Admin → Fleet & rates).
  const pricing = usePricing();
  const alerts = t.raw("alerts") as Alert[];
  const day = (iso: string) => format.dateTime(calendarDay(iso), { dateStyle: "long", timeZone: "UTC" });
  const fill = (text: string) =>
    text
      .replaceAll("{petrol}", format.number(pricing.fuelPricePerLitre.petrol))
      .replaceAll("{diesel}", format.number(pricing.fuelPricePerLitre.diesel));

  return (
    <div className={`min-h-screen w-full bg-background text-foreground`}>
      {/* The site header is transparent here, so this page's top section is dark */}
      <div className="bg-foreground pt-[calc(var(--header-h)+4rem)] pb-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
        {/* Standard 1400px container; the copy keeps its narrower reading width inside it. */}
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-primary flex items-center justify-center rounded-2xl mb-4">
                <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white uppercase tracking-tighter">
                {t("title")} <span className="text-secondary">{t("titleHighlight")}</span>
            </h1>
            <p className="text-white/60 font-extrabold uppercase tracking-widest text-sm md:text-base max-w-2xl">
                {t("subtitle")}
            </p>
        </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-24 md:py-32">
      <div className="max-w-4xl mx-auto flex flex-col gap-12">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground border-b border-border pb-4">
            <Link href="/" className="hover:text-primary transition-colors">{t("breadcrumbHome")}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t("breadcrumbCurrent")}</span>
        </div>

        {/* When the rules were last checked */}
        <div role="note" className="flex gap-3 border-l-4 border-secondary bg-card px-5 py-4 text-sm text-foreground shadow-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>
                <span className="font-bold text-foreground">{t("reviewed", { date: day(t("reviewedOn")) })}</span>{" "}
                {t("reviewedNote")}
            </p>
        </div>

        {/* Alerts Feed */}
        <div className="flex flex-col gap-8">
            {alerts.map((alert) => (
                <article key={alert.id} className="bg-card border border-border shadow-xl rounded-2xl relative overflow-hidden group">
                    {alert.isUrgent && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
                    )}
                    {!alert.isUrgent && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                    )}
                    
                    <div className="p-6 md:p-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground bg-muted/40 px-3 py-1.5 border border-border">
                                <Calendar className="w-3 h-3 text-primary" />
                                {t("published", { date: day(alert.date) })}
                            </div>
                            {alert.isUrgent && (
                                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-destructive bg-destructive/10 px-3 py-1.5 border border-destructive/20">
                                    <ShieldAlert className="w-3 h-3" />
                                    {t("urgent")}
                                </div>
                            )}
                        </div>

                        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground uppercase tracking-tighter mb-6 leading-tight">
                            {alert.title}
                        </h2>

                        <div className="max-w-none text-sm md:text-base text-foreground font-medium leading-relaxed whitespace-pre-wrap">
                            {fill(alert.content)}
                        </div>

                        {alert.sources && alert.sources.length > 0 && (
                            <div className="mt-8 border-t border-border pt-5">
                                <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{t("sourcesLabel")}</p>
                                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                                    {alert.sources.map((s) => (
                                        <li key={s.url}>
                                            <a
                                                href={s.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-bold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
                                            >
                                                {s.label}
                                                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </article>
            ))}
        </div>

        {/* Support Block */}
        <div className="mt-8 rounded-2xl bg-foreground text-white p-6 md:p-10 flex flex-col items-center text-center border-t-4 border-primary">
            <Info className="w-8 h-8 text-secondary mb-6" aria-hidden="true" />
            <h3 className="text-2xl font-extrabold uppercase tracking-tighter mb-4">{t("support.title")}</h3>
            <p className="text-white/70 font-bold uppercase tracking-widest text-xs mb-8 max-w-lg leading-relaxed">
                {t("support.text")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <a href="mailto:Suraessenceltd@gmail.com" className="min-h-12 bg-primary hover:bg-card hover:text-foreground text-white px-8 py-4 text-xs font-extrabold uppercase tracking-widest transition-colors rounded-2xl text-center">
                    {t("support.email")}
                </a>
                <a href="https://wa.me/250788564000" target="_blank" rel="noopener noreferrer" className="min-h-12 bg-white/10 hover:bg-card hover:text-foreground text-white px-8 py-4 text-xs font-extrabold uppercase tracking-widest transition-colors rounded-2xl text-center border border-white/20">
                    {t("support.whatsapp")}
                </a>
            </div>
        </div>

      </div>
      </div>
    </div>
  );
}