"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, Navigation, Check } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";

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
  green: "bg-secondary",
  copper: "bg-primary",
  blue: "bg-primary",
};

export default function ActivitySeason3() {
  const t = useTranslations("ActivitySeason3");
  const format = useFormatter();

  const details = t.raw("details") as Detail[];
  const itinerary = t.raw("itinerary") as ItineraryStage[];
  const highlights = t.raw("highlights") as Highlight[];
  const packages = t.raw("packages") as Package[];

  return (
    <div className={`min-h-screen bg-background text-foreground`}>

      {/* Hero */}
      <section className="relative w-full h-[50vh] min-h-[460px] pt-[var(--header-h)] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/60 z-10" />
          <Image src={t("image")} alt={t("imageAlt")} fill preload sizes="100vw" className="object-cover object-center" />
        </div>

        <div className="relative z-20 text-center px-6 md:px-10 max-w-4xl flex flex-col items-center gap-4">
          <span className="inline-block bg-muted-foreground text-white px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-widest rounded-2xl shadow-md">
            {t("badge")}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white uppercase tracking-tighter leading-[0.95] drop-shadow-lg">
            {t("title")}
          </h1>
          <p className="text-white/90 text-xs md:text-sm font-bold uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 md:py-32 px-6 md:px-10 max-w-[1400px] mx-auto flex flex-col gap-12">
        <Link
          href={t("backHref")}
          className="self-start inline-flex min-h-12 items-center gap-2 text-xs font-extrabold text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </Link>

        <div className="grid md:grid-cols-12 gap-10 md:gap-12">

          {/* Left Column */}
          <div className="md:col-span-8 flex flex-col gap-10 md:gap-12">

            {/* Event Details Card */}
            <div className="bg-card p-6 md:p-10 border border-border rounded-2xl shadow-sm">
              <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight mb-6 md:mb-8">{t("detailsTitle")}</h2>
              <div className="grid sm:grid-cols-3 gap-6 md:gap-8">
                {details.map((detail) => {
                  const Icon = getIcon(detail.icon);
                  return (
                    <div key={detail.id} className="flex flex-col gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{detail.label}</span>
                      <span className="text-sm font-extrabold text-foreground">{detail.value}</span>
                    </div>
                  );
                })}
              </div>

              {t("deadline") && (
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">
                    {t("deadline")}
                  </p>
                </div>
              )}
            </div>

            {/* Itinerary */}
            <div className="flex flex-col gap-6">
              <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight">{t("itineraryTitle")}</h2>

              <div className="relative pl-8 border-l-2 border-border flex flex-col gap-8">
                {itinerary.map((stage) => (
                  <div key={stage.id} className="relative">
                    <div className={`absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-background ${TONE_DOT[stage.tone] ?? TONE_DOT.green}`} />
                    <h3 className="text-base md:text-lg font-extrabold uppercase mb-3 text-primary">{stage.title}</h3>
                    <ul className="space-y-3">
                      {stage.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Navigation className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="text-sm font-semibold text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="bg-foreground text-white p-6 md:p-8 rounded-2xl shadow-md">
              <h3 className="text-lg font-extrabold uppercase tracking-tight mb-6">{t("highlightsTitle")}</h3>
              <div className="grid sm:grid-cols-2 gap-3.5">
                {highlights.map((item) => {
                  const Icon = getIcon(item.icon);
                  return (
                    <div key={item.id} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-widest">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column – Pricing (Sticky) */}
          <div className="md:col-span-4">
            <div className="sticky top-[calc(var(--header-h)+1.5rem)] flex flex-col gap-5">
              {packages.map((pkg, index) => {
                const price = format.number(pkg.price);

                /* The first package is shown as the large card. */
                return index === 0 ? (
                  <div key={pkg.id} className="bg-card border-2 border-muted-foreground/40 rounded-2xl p-6 shadow-xl relative overflow-hidden opacity-90">
                    {pkg.ribbon && (
                      <div className="absolute top-0 right-0 bg-muted-foreground text-white px-3 py-1 text-xs font-extrabold uppercase tracking-widest">
                        {pkg.ribbon}
                      </div>
                    )}
                    <h3 className="text-xl font-extrabold uppercase tracking-tighter mb-1">{pkg.title}</h3>
                    <div className="text-3xl font-extrabold text-primary mb-1">
                      {price} <span className="text-sm text-muted-foreground font-bold">{pkg.currency}</span>
                    </div>
                    {pkg.note && (
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-5">{pkg.note}</p>
                    )}

                    <ul className="space-y-2.5 mb-7 text-sm font-semibold text-muted-foreground">
                      {pkg.includes.map((inc) => (
                        <li key={inc.id} className={`flex items-center gap-2 ${inc.muted ? "text-muted-foreground italic" : ""}`}>
                          {!inc.muted && <Check className="w-4 h-4 text-primary shrink-0" />}
                          {inc.text}
                        </li>
                      ))}
                    </ul>

                    <div className="w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground py-3.5 text-xs font-extrabold uppercase tracking-widest rounded-2xl cursor-not-allowed">
                      {pkg.cta}
                    </div>
                  </div>
                ) : (
                  <div key={pkg.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm opacity-90">
                    <h3 className="text-lg font-extrabold uppercase tracking-tighter mb-1">{pkg.title}</h3>
                    <div className={`text-2xl font-extrabold text-foreground ${pkg.note ? "mb-2" : "mb-5"}`}>
                      {price} <span className="text-sm text-muted-foreground font-bold">{pkg.currency}</span>
                    </div>
                    {pkg.note && (
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-5">{pkg.note}</p>
                    )}

                    <ul className="space-y-2 mb-6 text-xs font-semibold text-muted-foreground">
                      {pkg.includes.map((inc) => (
                        <li key={inc.id} className={`flex items-center gap-2 ${inc.muted ? "text-muted-foreground italic" : ""}`}>
                          {!inc.muted && <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                          {inc.text}
                        </li>
                      ))}
                    </ul>

                    <div className="w-full flex items-center justify-center gap-2 bg-muted/70 text-muted-foreground py-3 text-xs font-extrabold uppercase tracking-widest rounded-2xl cursor-not-allowed">
                      {pkg.cta}
                    </div>
                  </div>
                );
              })}

              {/* Note */}
              {t("note") && (
                <div className="bg-background border border-border rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-relaxed">
                    {t("note")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
