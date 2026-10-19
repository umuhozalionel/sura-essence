"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import { Manrope } from "next/font/google";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FALLBACK_IMAGE } from "@/lib/optimized-bg";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope",
});

interface EventItem {
  id: string;
  date: string;
  image: string;
  status?: string;
  title: string;
  subtitle: string;
  location: string;
  duration: string;
}

/** Event photo in a fixed-ratio frame; a missing file falls back to the branded placeholder. */
function EventImage({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  const [missing, setMissing] = useState(!src);
  return (
    <Image
      src={missing ? FALLBACK_IMAGE : src}
      alt={alt}
      fill
      sizes={sizes}
      className="object-cover transition-transform duration-700 group-hover:scale-105"
      onError={() => setMissing(true)}
    />
  );
}

// Events come straight from the Events and PastEvents namespaces, so the
// homepage always matches /events and /events/past.
export function ActivitiesSection() {
  const t = useTranslations("HomeActivities");
  const format = useFormatter();
  const upcomingAll = useTranslations("Events").raw("items") as EventItem[];
  const past = useTranslations("PastEvents").raw("items") as EventItem[];

  // "comingSoon" items are placeholders with no title yet: count them, don't show them.
  const upcoming = upcomingAll.filter((e) => e.status !== "comingSoon");
  const planned = upcomingAll.length - upcoming.length;

  const dateLabel = (e: EventItem) =>
    e.status === "dateTba"
      ? t("dateTba")
      : format.dateTime(new Date(e.date), { day: "numeric", month: "long", year: "numeric" });

  return (
    <section id="activities" className={`py-28 md:py-32 bg-white text-[#0A1128] ${manrope.className}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 py-1.5 px-3.5 bg-[#125740]/10 border border-[#125740]/20 mb-8 rounded-2xl">
              <Sparkles className="w-3.5 h-3.5 text-[#125740]" />
              <span className="text-[#125740] text-[10px] font-black uppercase tracking-[0.3em]">{t("badge")}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] uppercase">
              {t("title")} <br />
              <span className="text-[#125740]">{t("titleHighlight")}</span>
            </h2>
          </div>
          <p className="text-gray-500 text-base md:text-lg max-w-md leading-relaxed">{t("subtitle")}</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* UPCOMING */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-[#125740]">
                <span className="w-2 h-2 rounded-full bg-[#125740] animate-pulse" /> {t("upcoming")}
              </h3>
              <Link href="/events" className="group inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-gray-500 hover:text-[#125740]">
                {t("viewUpcoming")} <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="space-y-5">
              {upcoming.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  <Link
                    href="/events"
                    className="group block rounded-2xl overflow-hidden bg-white ring-1 ring-black/5 shadow-xl shadow-black/5 hover:shadow-2xl transition-shadow"
                  >
                    <div className="relative aspect-[16/9] bg-[#0A1128]">
                      <EventImage src={e.image} alt={e.title} sizes="(min-width: 1024px) 42rem, 100vw" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128]/90 via-[#0A1128]/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                          <CalendarDays className="w-3.5 h-3.5" /> {dateLabel(e)}
                        </span>
                        <p className="text-2xl md:text-3xl font-black tracking-tight leading-tight">{e.title}</p>
                        <p className="mt-2 flex items-center gap-2 text-sm text-white/75">
                          <MapPin className="w-4 h-4" /> {e.location}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}

              {planned > 0 && (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 px-6 py-5 text-sm font-bold text-gray-500">
                  {t("morePlanned", { count: planned })}
                </div>
              )}
            </div>
          </div>

          {/* SETTLED / PAST */}
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t("past")}
              </h3>
              <Link href="/events/past" className="group inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-gray-500 hover:text-[#125740]">
                {t("viewPast")} <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="space-y-4">
              {past.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  <Link
                    href="/events/past"
                    className="group flex items-center gap-4 p-3 rounded-2xl bg-[#F9F8F6] ring-1 ring-black/5 hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all"
                  >
                    <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-[#0A1128]">
                      <EventImage src={e.image} alt={e.title} sizes="96px" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{dateLabel(e)}</p>
                      <p className="mt-1 font-black tracking-tight leading-tight line-clamp-2">{e.title}</p>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-1">{e.subtitle}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
