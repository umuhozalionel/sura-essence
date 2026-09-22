"use client";

import React, { useState, useEffect } from "react";
import { Shield, ArrowRight, Map, Check } from "lucide-react";
import { Manrope } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope"
});

// Everything below comes from messages/en.json + messages/fr.json (namespace "HowItWorks").
// Add a step, a sector, a metric or an amenity category by editing those two files only.
type Step = { id: string; icon: string; title: string; description: string };
type Sector = { id: string; district: string; area: string; temp: number; vibe: string; conditions: string };
type Metric = { id: string; icon: string; label: string; value: string; tone?: string };
type Amenity = { id: string; icon: string; label: string; places: string[] };
type Place = { name: string; km: number; minutes: number };

export function HowItWorks() {
  const t = useTranslations("HowItWorks");
  const tl = useTranslations("HowItWorks.live");
  const format = useFormatter();

  const steps = t.raw("steps") as Step[];
  const sectors = tl.raw("sectors") as Sector[];
  const metrics = tl.raw("metrics") as Metric[];
  const amenities = tl.raw("amenities") as Amenity[];

  const [activeSectorIndex, setActiveSectorIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    const s = setInterval(() => setActiveSectorIndex((prev) => (prev + 1) % sectors.length), 5500);
    return () => clearInterval(s);
  }, [sectors.length]);

  const activeSector = sectors[activeSectorIndex % sectors.length];

  const getNearby = (categoryId: string): Place[] => {
      const category = amenities.find(a => a.id === categoryId);
      const list = category?.places ?? [];
      if (!list.length) return [];
      
      return Array.from({ length: 8 }).map((_, i) => ({
         name: list[i % list.length],
         km: 1.2 + (i * 0.6),
         minutes: 4 + (i * 2)
      }));
  };

  const formatKm = (km: number) => tl("distance", { km: format.number(km, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });

  return (
    // The booking form is its own section now, so the old pt-48 clearance is gone.
    <section className={`pt-24 pb-20 bg-[#fafbfc] text-[#111827] relative ${manrope.className}`}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col lg:flex-row gap-12 lg:gap-16">
        
        {/* ==================================================== */}
        {/* LEFT COLUMN: THE PROCESS */}
        {/* ==================================================== */}
        <div className="lg:w-[58%] flex flex-col">
          
          {/* Header */}
          <div className="mb-14">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 py-2 px-4 bg-white border border-gray-200 mb-5 rounded-full shadow-sm"
            >
               <Shield className="w-3.5 h-3.5 text-[#006cb7]" strokeWidth={2.5} />
               <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-600">{t("badge")}</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[clamp(2.5rem,5vw,4rem)] font-bold text-[#0a0e1a] leading-[1.1] tracking-tight mb-4"
            >
              {t("title")}
              <span className="block text-[#006cb7]">{t("titleHighlight")}</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-600 text-base font-medium max-w-xl leading-relaxed"
            >
              {t("subtitle")}
            </motion.p>
          </div>

          {/* Process Steps */}
          <div className="flex flex-col gap-6 relative">
            {/* Timeline connector */}
            <div className="absolute left-5 top-8 bottom-8 w-[2px] bg-gray-200" />
            
            {steps.map((step, i) => {
              const Icon = getIcon(step.icon);
              return (
                <motion.div 
                  key={step.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + (i * 0.1) }}
                  className="relative group"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-[11px] top-6 w-[18px] h-[18px] rounded-full bg-white border-[3px] border-gray-300 z-10 transition-all duration-300 group-hover:border-[#006cb7] group-hover:scale-110" />
                  
                  {/* Card */}
                  <div className="ml-16 bg-white border border-gray-200 p-7 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300 group-hover:translate-x-1">
                     <div className="flex items-start gap-5 mb-4">
                       {/* Icon */}
                       <div className="flex-shrink-0 w-12 h-12 bg-[#006cb7]/5 rounded-lg flex items-center justify-center group-hover:bg-[#006cb7]/10 transition-colors">
                         <Icon className="w-6 h-6 text-[#006cb7]" strokeWidth={2} />
                       </div>
                       
                       {/* Content */}
                       <div className="flex-1">
                         <div className="flex items-baseline gap-3 mb-2">
                           <span className="text-sm font-bold text-[#84BD00] tracking-tight">{String(i + 1).padStart(2, "0")}</span>
                           <h3 className="text-xl font-bold text-[#0a0e1a] tracking-tight">{step.title}</h3>
                         </div>
                         <p className="text-sm text-gray-600 leading-relaxed font-medium">
                           {step.description}
                         </p>
                       </div>
                     </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-12 pt-10 border-t border-gray-200"
          >
             <Link 
               href="/book" 
               className="group inline-flex items-center gap-3 px-6 py-3.5 bg-[#006cb7] text-white rounded-lg font-semibold text-sm transition-all duration-300 hover:bg-[#005a9e] hover:shadow-lg hover:shadow-[#006cb7]/20 hover:translate-y-[-2px]"
             >
                <span>{t("cta")}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
             </Link>
          </motion.div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: LIVE INTELLIGENCE */}
        {/* ==================================================== */}
        <aside className="lg:w-[42%] flex flex-col gap-5">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-2 mb-2"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
              <div className="w-2 h-2 bg-[#84BD00] rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600">{tl("badge")}</span>
            </div>
          </motion.div>

          {/* WIDGET 1: Active Sector Monitor */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700 flex items-center gap-2">
                  <Map className="w-4 h-4 text-[#006cb7]" strokeWidth={2} />
                  {tl("sectorTitle")}
                </h3>
                <div className="flex gap-1">
                  {sectors.map((sector, idx) => (
                    <button
                      key={sector.id}
                      onClick={() => setActiveSectorIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        idx === activeSectorIndex 
                          ? 'bg-[#006cb7] w-6' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={tl("goToSector", { number: idx + 1 })}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 relative min-h-[140px]">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeSector.id} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }} 
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Location */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{tl("location")}</span>
                    <div className="text-lg font-bold text-[#0a0e1a]">
                      {activeSector.district} · <span className="text-[#006cb7]">{activeSector.area}</span>
                    </div>
                  </div>

                  {/* Grid Info */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{tl("atmosphere")}</span>
                      <div className="text-sm font-semibold text-[#0a0e1a]">{activeSector.vibe}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{tl("conditions")}</span>
                      <div className="text-sm font-semibold">
                        <span className="text-[#84BD00]">{activeSector.conditions}</span>
                        <span className="text-gray-400 mx-1">·</span>
                        <span className="text-[#0a0e1a]">{tl("temperature", { temp: activeSector.temp })}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* WIDGET 2: Geo Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-6"
          >
            <div className="grid grid-cols-3 gap-6 divide-x divide-gray-100">
              {metrics.map((metric) => {
                const Icon = getIcon(metric.icon);
                const green = metric.tone === "green";
                return (
                  <div key={metric.id} className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${green ? "bg-[#84BD00]/5" : "bg-[#006cb7]/5"}`}>
                      <Icon className={`w-5 h-5 ${green ? "text-[#84BD00]" : "text-[#006cb7]"}`} strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{metric.label}</span>
                    <span className="text-sm font-bold text-[#0a0e1a]">{metric.value}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* WIDGET 3: Local Amenities Scanner */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700 flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#006cb7]" strokeWidth={2.5} />
                  {tl("amenitiesTitle")}
                </h3>
                {selectedPlace && (
                  <button 
                    onClick={() => setSelectedPlace(null)} 
                    className="text-[10px] font-bold text-[#006cb7] uppercase tracking-wider hover:underline transition-all"
                  >
                    {tl("clear")}
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {selectedPlace ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-4 p-5 bg-[#006cb7]/5 border border-[#006cb7]/20 rounded-lg"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                    <Check className="w-5 h-5 text-[#84BD00]" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#0a0e1a] mb-0.5 truncate">{selectedPlace.name}</div>
                    <div className="text-xs text-gray-600 font-medium">
                      {formatKm(selectedPlace.km)} · {tl("minutes", { count: selectedPlace.minutes })}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-4 gap-2.5">
                  {amenities.map(cat => {
                    const Icon = getIcon(cat.icon);
                    return (
                      <button 
                        key={cat.id} 
                        onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)} 
                        className={`flex flex-col gap-2 items-center justify-center py-4 px-2 rounded-lg border-2 transition-all duration-200 ${
                          selectedCategory === cat.id 
                            ? 'border-[#006cb7] bg-[#006cb7]/5 shadow-sm' 
                            : 'border-gray-200 bg-white hover:border-[#006cb7]/40 hover:bg-[#006cb7]/5'
                        }`}
                      >
                        <Icon className={`w-4 h-4 transition-colors ${
                          selectedCategory === cat.id ? 'text-[#006cb7]' : 'text-gray-400'
                        }`} strokeWidth={2} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider text-center transition-colors ${
                          selectedCategory === cat.id ? 'text-[#006cb7]' : 'text-gray-600'
                        }`}>
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              
              <AnimatePresence>
                {selectedCategory && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-2 mt-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                      {getNearby(selectedCategory).map((place, i) => (
                        <motion.button
                          key={`${place.name}-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setSelectedPlace(place)} 
                          className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 hover:border-[#006cb7] hover:bg-white transition-all rounded-lg group"
                        >
                          <div className="flex flex-col items-start text-left">
                            <span className="text-xs font-bold text-[#0a0e1a] mb-0.5">{place.name}</span>
                            <span className="text-[10px] text-gray-500 font-medium">{activeSector.area}</span>
                          </div>
                          <div className="flex flex-col items-end text-right">
                            <span className="text-xs font-bold text-[#006cb7] mb-0.5">{formatKm(place.km)}</span>
                            <span className="text-[10px] text-gray-500 font-medium group-hover:text-[#0a0e1a] transition-colors">{tl("minutes", { count: place.minutes })}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </aside>

      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #006cb7;
        }
      `}</style>
    </section>
  );
}