"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Calendar, ChevronRight, ExternalLink, Globe, Info, ShieldAlert } from "lucide-react";
import { Manrope } from "next/font/google";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DIESEL_PRICE_RWF, PETROL_PRICE_RWF } from "@/lib/pricing";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

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
  const alerts = t.raw("alerts") as Alert[];
  const day = (iso: string) => format.dateTime(calendarDay(iso), { dateStyle: "long", timeZone: "UTC" });
  const fill = (text: string) =>
    text
      .replaceAll("{petrol}", format.number(PETROL_PRICE_RWF))
      .replaceAll("{diesel}", format.number(DIESEL_PRICE_RWF));

  return (
    <div className={`min-h-screen w-full bg-[#F9F8F6] text-[#0A1128] ${manrope.className}`}>
      {/* Reusing the transparent header, so we need a dark background for this page's top section */}
      <Header />

      {/* Hero Header for Alerts */}
      <div className="bg-[#0A1128] pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#125740] flex items-center justify-center rounded-none mb-8">
                <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4">
                {t("title")} <span className="text-[#EAB308]">{t("titleHighlight")}</span>
            </h1>
            <p className="text-white/60 font-black uppercase tracking-widest text-sm md:text-base max-w-2xl">
                {t("subtitle")}
            </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-12 border-b border-gray-200 pb-4">
            <Link href="/" className="hover:text-[#125740] transition-colors">{t("breadcrumbHome")}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#0A1128]">{t("breadcrumbCurrent")}</span>
        </div>

        {/* When the rules were last checked */}
        <div role="note" className="mb-12 flex gap-3 border-l-4 border-[#EAB308] bg-white px-5 py-4 text-sm text-gray-700 shadow-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#125740]" aria-hidden="true" />
            <p>
                <span className="font-bold text-[#0A1128]">{t("reviewed", { date: day(t("reviewedOn")) })}</span>{" "}
                {t("reviewedNote")}
            </p>
        </div>

        {/* Alerts Feed */}
        <div className="space-y-8">
            {alerts.map((alert) => (
                <article key={alert.id} className="bg-white border border-gray-200 shadow-xl rounded-none relative overflow-hidden group">
                    {alert.isUrgent && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#ef4444]" />
                    )}
                    {!alert.isUrgent && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#125740]" />
                    )}
                    
                    <div className="p-8 md:p-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 px-3 py-1.5 border border-gray-100">
                                <Calendar className="w-3 h-3 text-[#125740]" />
                                {t("published", { date: day(alert.date) })}
                            </div>
                            {alert.isUrgent && (
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-700 bg-red-50 px-3 py-1.5 border border-red-100">
                                    <ShieldAlert className="w-3 h-3" />
                                    {t("urgent")}
                                </div>
                            )}
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black text-[#0A1128] uppercase tracking-tighter mb-6 leading-tight">
                            {alert.title}
                        </h2>

                        <div className="max-w-none text-sm md:text-base text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
                            {fill(alert.content)}
                        </div>

                        {alert.sources && alert.sources.length > 0 && (
                            <div className="mt-8 border-t border-gray-100 pt-5">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-500">{t("sourcesLabel")}</p>
                                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                                    {alert.sources.map((s) => (
                                        <li key={s.url}>
                                            <a
                                                href={s.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-bold text-[#125740] underline decoration-[#125740]/30 underline-offset-4 hover:decoration-[#125740]"
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
        <div className="mt-20 bg-[#0A1128] text-white p-10 flex flex-col items-center text-center border-t-4 border-[#125740]">
            <Info className="w-8 h-8 text-[#EAB308] mb-6" aria-hidden="true" />
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">{t("support.title")}</h3>
            <p className="text-white/70 font-bold uppercase tracking-widest text-xs mb-8 max-w-lg leading-relaxed">
                {t("support.text")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <a href="mailto:Suraessenceltd@gmail.com" className="bg-[#125740] hover:bg-white hover:text-[#0A1128] text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors rounded-none text-center">
                    {t("support.email")}
                </a>
                <a href="https://wa.me/250788564000" target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white hover:text-[#0A1128] text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors rounded-none text-center border border-white/20">
                    {t("support.whatsapp")}
                </a>
            </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}