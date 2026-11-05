"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FALLBACK_IMAGE } from "@/lib/optimized-bg";


export interface EventItem {
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
// homepage always matches /iwacu/experiences/upcoming and /past.
export type HomeEvent = EventItem;

/**
 * The next experience and the latest recap, each leading to its full list.
 * `upcoming` / `past` come from the CMS; without them, Events and PastEvents from messages/*.json.
 */
export function ActivitiesSection({ upcoming: upcomingCms, past: pastCms }: { upcoming?: EventItem[]; past?: EventItem[] } = {}) {
  const t = useTranslations("HomeActivities");
  const format = useFormatter();
  const tEvents = useTranslations("Events");
  const tPast = useTranslations("PastEvents");
  const upcomingAll = upcomingCms ?? (tEvents.raw("items") as EventItem[]);
  const past = pastCms ?? (tPast.raw("items") as EventItem[]);

  // "comingSoon" items are placeholders with no title yet: count them, don't show them.
  const upcoming = upcomingAll.filter((e) => e.status !== "comingSoon");
  const next = upcoming[0];
  const others = upcomingAll.length - (next ? 1 : 0);
  const latest = [...past].sort((a, b) => b.date.localeCompare(a.date))[0];

  const dateLabel = (e: EventItem) =>
    e.status === "dateTba"
      ? t("dateTba")
      : format.dateTime(new Date(e.date), { day: "numeric", month: "long", year: "numeric" });

  const tile = (e: EventItem, href: string, label: string, sizes: string) => (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="h-full">
      <Link href={href} className="group relative flex h-full min-h-72 flex-col justify-end overflow-hidden rounded-2xl bg-foreground p-6 text-white shadow-lg shadow-black/5">
        <EventImage src={e.image} alt={e.title} sizes={sizes} />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
        <span className="relative text-xs font-extrabold text-secondary">{label}</span>
        <span className="relative mt-2 text-xl md:text-2xl font-extrabold tracking-tight leading-tight">{e.title}</span>
        <span className="relative mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" aria-hidden="true" /> {dateLabel(e)}</span>
          {e.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden="true" /> {e.location}</span>}
        </span>
      </Link>
    </motion.div>
  );

  return (
    <section id="activities" className="py-12 md:py-16 bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col gap-8">
        <div className="max-w-2xl flex flex-col gap-2">
          <span className="text-primary text-xs font-extrabold uppercase tracking-widest">{t("badge")}</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">{t("title")} {t("titleHighlight")}</h2>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{t("subtitle")}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          {next && (
            <div className="lg:col-span-7">
              {tile(next, "/iwacu/experiences/upcoming", t("upcoming"), "(min-width: 1024px) 58vw, 100vw")}
            </div>
          )}
          {latest && (
            <div className={next ? "lg:col-span-5" : "lg:col-span-12"}>
              {tile(latest, "/iwacu/experiences/past", t("past"), "(min-width: 1024px) 42vw, 100vw")}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <Link href="/iwacu/experiences/upcoming" className="group inline-flex min-h-12 items-center gap-2 text-sm font-extrabold text-primary">
            {t("viewUpcoming")} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link href="/iwacu/experiences/past" className="group inline-flex min-h-12 items-center gap-2 text-sm font-extrabold text-foreground">
            {t("viewPast")} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          {others > 0 && <p className="text-sm font-semibold text-muted-foreground">{t("morePlanned", { count: others })}</p>}
        </div>
      </div>
    </section>
  );
}
