"use client";

import React from "react";
import { ArrowLeft, Navigation, Check } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getIcon } from "@/lib/icons";
import { Manrope } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

/* Text, itinerary, highlights and packages live in messages/en.json +
   messages/fr.json (namespace "ActivitySeason3"). This season is over, so its
   packages use the "disabled" style — no booking link is rendered. */

interface Detail {
  id: string;
  icon: string;
  label: string;
  value: string;
}

interface ItineraryStage {
  id: string;
  tone: string;
  title: string;
  items: string[];
}

interface Highlight {
  id: string;
  icon: string;
  text: string;
}

interface Inclusion {
  id: string;
  muted?: boolean;
  text: string;
}

interface Package {
  id: string;
  featured: boolean;
  style: string;
  price: number;
  currency: string;
  ribbon: string;
  title: string;
  note: string;
  includes: Inclusion[];
  cta: string;
}

const TONE_DOT: Record<string, string> = {
  green: "bg-[#EAB308]",
  copper: "bg-[#125740]",
  blue: "bg-[#125740]",
};

export default function ActivitySeason3() {
  const t = useTranslations("ActivitySeason3");
  const format = useFormatter();

  const details = t.raw("details") as Detail[];
  const itinerary = t.raw("itinerary") as ItineraryStage[];
  const highlights = t.raw("highlights") as Highlight[];
  const packages = t.raw("packages") as Package[];

  return (
    <main className={`min-h-screen bg-[#F9F8F6] text-[#0A1128] ${manrope.className}`}>
      <Header />

      {/* Hero */}
      <section className="relative w-full h-[50vh] min-h-[420px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/60 z-10" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={t("image")}
            alt={t("imageAlt")}
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="relative z-20 text-center px-6 mt-12 md:mt-16 max-w-4xl">
          <span className="inline-block bg-gray-600 text-white px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm mb-5 shadow-md">
            {t("badge")}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-[0.95] mb-4 drop-shadow-lg">
            {t("title")}
          </h1>
          <p className="text-white/90 text-xs md:text-sm font-bold uppercase tracking-[0.18em] max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-20 px-5 sm:px-6 md:px-10 max-w-6xl mx-auto">
        <Link
          href={t("backHref")}
          className="inline-flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-[#125740] uppercase tracking-[0.2em] transition-colors mb-10 md:mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </Link>

        <div className="grid md:grid-cols-12 gap-10 md:gap-12">

          {/* Left Column */}
          <div className="md:col-span-8 flex flex-col gap-10 md:gap-12">

            {/* Event Details Card */}
            <div className="bg-white p-7 md:p-10 border border-gray-200 rounded-sm shadow-sm">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-6 md:mb-8">{t("detailsTitle")}</h2>
              <div className="grid sm:grid-cols-3 gap-6 md:gap-8">
                {details.map((detail) => {
                  const Icon = getIcon(detail.icon);
                  return (
                    <div key={detail.id} className="flex flex-col gap-2">
                      <Icon className="w-5 h-5 text-[#125740]" />
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{detail.label}</span>
                      <span className="text-sm font-black text-[#0A1128]">{detail.value}</span>
                    </div>
                  );
                })}
              </div>

              {t("deadline") && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-[#125740] uppercase tracking-widest">
                    {t("deadline")}
                  </p>
                </div>
              )}
            </div>

            {/* Itinerary */}
            <div className="flex flex-col gap-6">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">{t("itineraryTitle")}</h2>

              <div className="relative pl-8 border-l-2 border-gray-200 flex flex-col gap-8">
                {itinerary.map((stage) => (
                  <div key={stage.id} className="relative">
                    <div className={`absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-[#F9F8F6] ${TONE_DOT[stage.tone] ?? TONE_DOT.green}`} />
                    <h3 className="text-base md:text-lg font-black uppercase mb-3 text-[#125740]">{stage.title}</h3>
                    <ul className="space-y-3">
                      {stage.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <span className="text-sm font-semibold text-gray-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="bg-[#0A1128] text-white p-7 md:p-9 rounded-sm shadow-md">
              <h3 className="text-lg font-black uppercase tracking-tight mb-6">{t("highlightsTitle")}</h3>
              <div className="grid sm:grid-cols-2 gap-3.5">
                {highlights.map((item) => {
                  const Icon = getIcon(item.icon);
                  return (
                    <div key={item.id} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3.5 rounded-sm">
                      <Icon className="w-4 h-4 text-[#125740] shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column – Pricing (Sticky) */}
          <div className="md:col-span-4">
            <div className="sticky top-28 flex flex-col gap-5">
              {packages.map((pkg, index) => {
                const price = format.number(pkg.price);

                /* The first package is shown as the large card. */
                return index === 0 ? (
                  <div key={pkg.id} className="bg-white border-2 border-gray-300 rounded-sm p-6 shadow-xl relative overflow-hidden opacity-90">
                    {pkg.ribbon && (
                      <div className="absolute top-0 right-0 bg-gray-500 text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                        {pkg.ribbon}
                      </div>
                    )}
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-1">{pkg.title}</h3>
                    <div className="text-3xl font-black text-[#125740] mb-1">
                      {price} <span className="text-sm text-gray-500 font-bold">{pkg.currency}</span>
                    </div>
                    {pkg.note && (
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-5">{pkg.note}</p>
                    )}

                    <ul className="space-y-2.5 mb-7 text-sm font-semibold text-gray-600">
                      {pkg.includes.map((inc) => (
                        <li key={inc.id} className={`flex items-center gap-2 ${inc.muted ? "text-gray-400 italic" : ""}`}>
                          {!inc.muted && <Check className="w-4 h-4 text-[#125740] shrink-0" />}
                          {inc.text}
                        </li>
                      ))}
                    </ul>

                    <div className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-500 py-3.5 text-[11px] font-black uppercase tracking-widest rounded-sm cursor-not-allowed">
                      {pkg.cta}
                    </div>
                  </div>
                ) : (
                  <div key={pkg.id} className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm opacity-90">
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-1">{pkg.title}</h3>
                    <div className="text-2xl font-black text-[#0A1128] mb-5">
                      {price} <span className="text-sm text-gray-500 font-bold">{pkg.currency}</span>
                    </div>
                    {pkg.note && (
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-5 -mt-3">{pkg.note}</p>
                    )}

                    <ul className="space-y-2 mb-6 text-xs font-semibold text-gray-500">
                      {pkg.includes.map((inc) => (
                        <li key={inc.id} className={`flex items-center gap-2 ${inc.muted ? "text-gray-400 italic" : ""}`}>
                          {!inc.muted && <Check className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                          {inc.text}
                        </li>
                      ))}
                    </ul>

                    <div className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-400 py-3 text-[10px] font-black uppercase tracking-widest rounded-sm cursor-not-allowed">
                      {pkg.cta}
                    </div>
                  </div>
                );
              })}

              {/* Note */}
              {t("note") && (
                <div className="bg-[#F9F8F6] border border-gray-200 rounded-sm p-4 text-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-relaxed">
                    {t("note")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
