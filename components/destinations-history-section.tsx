"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, Info, Landmark, MapPin } from "lucide-react";
import { manrope } from "@/lib/fonts";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";


// Same booking link the tours page uses; `tour` picks the venue in the form.
const TOUR_HREF = "/book?tab=city&serviceType=city_tour&vehicle=suv&driver=with";

interface Site {
  id: string;
  /** Venue id on /tours, and the `tour` value the booking form understands. */
  venue: string;
  category: string;
  name: string;
  location: string;
  era: string;
  image: string;
  summary: string;
  context: string;
  note: string;
}

// Content lives in messages/*.json under "Destinations".
export function DestinationsHistorySection() {
  const t = useTranslations("Destinations");
  const sites = t.raw("items") as Site[];
  const [activeId, setActiveId] = useState(sites[0]?.id);
  const site = sites.find((s) => s.id === activeId) ?? sites[0];

  return (
    <section id="destinations" className={`py-28 md:py-32 bg-[#F9F8F6] text-[#0A1128] ${manrope.className}`}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 py-1.5 px-3.5 bg-[#125740]/10 border border-[#125740]/20 mb-8 rounded-2xl">
            <BookOpen className="w-3.5 h-3.5 text-[#125740]" />
            <span className="text-[#125740] text-[10px] font-black uppercase tracking-[0.3em]">{t("badge")}</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] uppercase">
            {t("title")} <br />
            <span className="text-[#125740]">{t("titleHighlight")}</span>
          </h2>
          <p className="mt-6 text-gray-500 text-base md:text-lg leading-relaxed">{t("subtitle")}</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* INDEX: chips on mobile, a table of contents on desktop */}
          <nav aria-label={t("badge")} className="lg:col-span-4 -mx-6 px-6 lg:mx-0 lg:px-0 overflow-x-auto lg:overflow-visible">
            <ol className="flex lg:flex-col gap-3 w-max lg:w-auto">
              {sites.map((s, i) => {
                const selected = s.id === site.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(s.id)}
                      aria-current={selected ? "true" : undefined}
                      className={`w-full text-left flex items-center gap-4 px-5 py-4 rounded-2xl ring-1 transition-all ${
                        selected
                          ? "bg-white ring-[#125740]/30 shadow-xl shadow-black/5"
                          : "bg-transparent ring-black/5 hover:bg-white/70"
                      }`}
                    >
                      <span className={`text-xs font-black tabular-nums ${selected ? "text-[#125740]" : "text-gray-300"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-black tracking-tight leading-tight whitespace-nowrap lg:whitespace-normal">{s.name}</span>
                        <span className="hidden lg:block text-xs text-gray-500 mt-0.5">{s.era}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* ARTICLE */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.article
                key={site.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                className="bg-white rounded-2xl ring-1 ring-black/5 shadow-xl shadow-black/5 overflow-hidden"
              >
                <div className="relative aspect-[16/8] bg-[#0A1128]">
                  <Image
                    src={site.image}
                    alt={site.name}
                    fill
                    sizes="(min-width: 1280px) 52rem, (min-width: 1024px) 66vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128]/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em]">
                        <Landmark className="w-3.5 h-3.5" /> {site.era}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em]">
                        <MapPin className="w-3.5 h-3.5" /> {site.location}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">{site.name}</h3>
                  </div>
                </div>

                <div className="p-6 md:p-10">
                  <p className="text-lg md:text-xl font-bold leading-snug">{site.summary}</p>

                  <h4 className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-[#125740]">{t("contextLabel")}</h4>
                  <p className="mt-3 text-gray-600 leading-relaxed">{site.context}</p>

                  <div className="mt-8 flex items-start gap-3 rounded-xl bg-[#F9F8F6] ring-1 ring-black/5 p-4">
                    <Info className="w-4 h-4 text-[#125740] mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-600">
                      <span className="font-black text-[#0A1128]">{t("noteLabel")}: </span>
                      {site.note}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href={`${TOUR_HREF}&tour=${site.venue}`}
                      className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#125740] text-white text-[11px] font-black uppercase tracking-wide hover:bg-[#0E4231] transition-colors"
                    >
                      {t("book")} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                      href={`/tours?category=${site.category}&venue=${site.venue}`}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gray-50 ring-1 ring-black/5 text-[#0A1128] text-[11px] font-black uppercase tracking-wide hover:bg-gray-100 transition-colors"
                    >
                      {t("explore")}
                    </Link>
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
