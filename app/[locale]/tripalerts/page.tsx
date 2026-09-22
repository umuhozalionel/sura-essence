"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Calendar, ChevronRight, Globe, Info, ShieldAlert } from "lucide-react";
import { Manrope } from "next/font/google";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

// Alerts come from messages/en.json + messages/fr.json (namespace "TripAlerts").
// Add an alert by adding an entry to the "alerts" array in those two files.
type Alert = { id: string; date: string; isUrgent: boolean; title: string; content: string };

export default function TripAlertsPage() {
  const t = useTranslations("TripAlerts");
  const format = useFormatter();
  const alerts = t.raw("alerts") as Alert[];

  return (
    <main className={`min-h-screen w-full bg-[#F5F2EA] text-[#111827] ${manrope.className}`}>
      {/* Reusing the transparent header, so we need a dark background for this page's top section */}
      <Header />

      {/* Hero Header for Alerts */}
      <div className="bg-[#111827] pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#C97C2F] flex items-center justify-center rounded-none mb-8">
                <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4">
                {t("title")} <span className="text-[#C97C2F]">{t("titleHighlight")}</span>
            </h1>
            <p className="text-white/60 font-black uppercase tracking-widest text-sm md:text-base max-w-2xl">
                {t("subtitle")}
            </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-12 border-b border-gray-200 pb-4">
            <Link href="/" className="hover:text-[#C97C2F] transition-colors">{t("breadcrumbHome")}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#111827]">{t("breadcrumbCurrent")}</span>
        </div>

        {/* Alerts Feed */}
        <div className="space-y-8">
            {alerts.map((alert) => (
                <article key={alert.id} className="bg-white border border-gray-200 shadow-xl rounded-none relative overflow-hidden group">
                    {alert.isUrgent && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#ef4444]" />
                    )}
                    {!alert.isUrgent && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#C97C2F]" />
                    )}
                    
                    <div className="p-8 md:p-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1.5 border border-gray-100">
                                <Calendar className="w-3 h-3 text-[#C97C2F]" />
                                {t("published", { date: format.dateTime(new Date(alert.date), { dateStyle: "long" }) })}
                            </div>
                            {alert.isUrgent && (
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#ef4444] bg-red-50 px-3 py-1.5 border border-red-100">
                                    <ShieldAlert className="w-3 h-3" />
                                    {t("urgent")}
                                </div>
                            )}
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black text-[#111827] uppercase tracking-tighter mb-6 leading-tight">
                            {alert.title}
                        </h2>

                        <div className="prose prose-sm md:prose-base max-w-none text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                            {alert.content}
                        </div>
                    </div>
                </article>
            ))}
        </div>

        {/* Support Block */}
        <div className="mt-20 bg-[#111827] text-white p-10 flex flex-col items-center text-center border-t-4 border-[#C97C2F]">
            <Info className="w-8 h-8 text-[#C97C2F] mb-6" />
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">{t("support.title")}</h3>
            <p className="text-white/70 font-bold uppercase tracking-widest text-xs mb-8 max-w-lg leading-relaxed">
                {t("support.text")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <a href="mailto:Suraessenceltd@gmail.com" className="bg-[#C97C2F] hover:bg-white hover:text-[#111827] text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors rounded-none text-center">
                    {t("support.email")}
                </a>
                <a href="https://wa.me/250788564000" target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white hover:text-[#111827] text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors rounded-none text-center border border-white/20">
                    {t("support.whatsapp")}
                </a>
            </div>
        </div>

      </div>

      <Footer />
    </main>
  );
}