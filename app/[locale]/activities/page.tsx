"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { 
  ArrowLeft, 
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  PanelLeftOpen,
  PanelLeftClose,
  PanelRightOpen,
  PanelRightClose
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Manrope } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

// Seasons and every piece of text come from messages/en.json + messages/fr.json
// (namespace "Activities"). Add a season by adding an entry to "seasons" in those two files.
type Season = {
  id: string;
  slug: string;
  image: string;
  date: string;
  endDate?: string;
  status: "upcoming" | "past";
  title: string;
  shortTitle: string;
  location: string;
  price: string;
  description: string;
  departure: string;
  deadline?: string;
};

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const parseDay = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

function DigitalCalendar({ 
  seasons, 
  activeId,
  onSelectSeason 
}: { 
  seasons: Season[]; 
  activeId: string;
  onSelectSeason: (idx: number) => void 
}) {
  const locale = useLocale();
  const format = useFormatter();
  const today = new Date();
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(7);

  const eventsByDay = useMemo(() => {
    const map: Record<string, Season> = {};
    seasons.forEach((s) => {
      map[dayKey(parseDay(s.date))] = s;
      if (s.endDate) map[dayKey(parseDay(s.endDate))] = s;
    });
    return map;
  }, [seasons]);

  // Weekday names in the page's language; French weeks start on Monday
  const weekStart = locale === "en" ? 0 : 1;
  const weekdays = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(2024, 0, 7 + ((weekStart + i) % 7)); // 2024-01-07 is a Sunday
      return formatter.format(day).replace(".", "").slice(0, 2);
    });
  }, [locale, weekStart]);

  const firstDay = (new Date(viewYear, viewMonth, 1).getDay() - weekStart + 7) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-sm font-black uppercase tracking-wider text-[#111827]">
          {format.dateTime(new Date(viewYear, viewMonth, 1), { month: "long", year: "numeric" })}
        </span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((d, i) => (
          <div key={`${d}-${i}`} className="text-center text-[9px] font-bold uppercase tracking-wider text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="aspect-square" />;

          const key = `${viewYear}-${viewMonth}-${day}`;
          const event = eventsByDay[key];
          const isToday =
            day === today.getDate() &&
            viewMonth === today.getMonth() &&
            viewYear === today.getFullYear();
          const isActive = event && event.id === activeId;

          return (
            <button
              key={key}
              onClick={() => {
                if (event) {
                  const idx = seasons.findIndex(s => s.id === event.id);
                  if (idx >= 0) onSelectSeason(idx);
                }
              }}
              className={`
                aspect-square rounded-full flex flex-col items-center justify-center relative text-[11px] font-bold transition-all
                ${event ? "cursor-pointer" : "cursor-default"}
                ${isToday ? "ring-2 ring-[#006cb7] ring-offset-1" : ""}
                ${event && event.status === "upcoming" && !isActive ? "bg-[#C97C2F] text-white shadow-md shadow-[#C97C2F]/30" : ""}
                ${event && event.status === "upcoming" && isActive ? "bg-[#C97C2F] text-white ring-2 ring-[#C97C2F] ring-offset-2 shadow-lg" : ""}
                ${event && event.status === "past" ? "bg-gray-200 text-gray-600" : ""}
                ${!event ? "text-gray-700 hover:bg-gray-50" : ""}
              `}
            >
              {day}
              {event && (
                <span className={`absolute -bottom-0.5 w-1 h-1 rounded-full ${
                  event.status === "upcoming" ? "bg-white" : "bg-[#84BD00]"
                }`} />
              )}
            </button>
          );
        })}
      </div>

      <CalendarLegend />
    </div>
  );
}

function CalendarLegend() {
  const t = useTranslations("Activities");
  return (
    <div className="mt-5 flex flex-wrap gap-3 text-[9px] font-bold uppercase tracking-wider text-gray-500">
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#C97C2F]" /> {t("legendUpcoming")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> {t("legendPast")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full ring-2 ring-[#006cb7]" /> {t("legendToday")}
      </span>
    </div>
  );
}

export default function ActivitiesPage() {
  const t = useTranslations("Activities");
  const format = useFormatter();
  const seasons = t.raw("seasons") as Season[];

  const seasonDate = (season: Season) => {
    if (season.endDate && season.endDate !== season.date) {
      return `${format.dateTime(parseDay(season.date), { day: "numeric" })}–${format.dateTime(parseDay(season.endDate), { day: "numeric", month: "long", year: "numeric" })}`;
    }
    return format.dateTime(parseDay(season.date), { day: "numeric", month: "long", year: "numeric" });
  };
  const seasonTag = (season: Season) => (season.status === "upcoming" ? t("tagUpcoming") : t("tagPast"));

  const [activeIndex, setActiveIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const current = seasons[activeIndex % seasons.length];

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      setSidebarOpen(desktop);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const goPrev = () => setActiveIndex((prev) => (prev === 0 ? seasons.length - 1 : prev - 1));
  const goNext = () => setActiveIndex((prev) => (prev === seasons.length - 1 ? 0 : prev + 1));

  const selectSeason = (idx: number) => {
    setActiveIndex(idx);
    if (!isDesktop) setSidebarOpen(false);
  };

  // Mobile = right side, Desktop (lg+) = left side
  const isRight = !isDesktop;

  return (
    <main className={`min-h-screen bg-[#F5F2EA] text-[#111827] ${manrope.className}`}>
      <Header />

      <div className="flex relative">
        {/* Overlay – mobile/tablet only */}
        <AnimatePresence>
          {sidebarOpen && isRight && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/25 z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* ── SIDEBAR ── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: isRight ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRight ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 340 }}
              className={`
                fixed z-40 flex flex-col bg-white
                top-[100px] bottom-0
                w-[min(85vw,320px)]
                ${isRight 
                  ? "right-0 left-auto border-l border-gray-200 shadow-[-4px_0_24px_rgba(0,0,0,0.08)]" 
                  : "left-0 right-auto border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.08)] lg:shadow-none"
                }
              `}
            >
              <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#006cb7]" />
                  <span className="text-sm font-black uppercase tracking-wider">{t("sidebarTitle")}</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                  aria-label={t("closeSidebar")}
                >
                  {isRight 
                    ? <PanelRightClose className="w-4 h-4 text-gray-500" />
                    : <PanelLeftClose className="w-4 h-4 text-gray-500" />
                  }
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 sm:py-5 space-y-7 sm:space-y-8">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                    {t("calendarTitle")}
                  </h4>
                  <DigitalCalendar
                    seasons={seasons}
                    activeId={current.id}
                    onSelectSeason={selectSeason}
                  />
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                    {t("allExperiences")}
                  </h4>
                  <div className="space-y-2.5">
                    {seasons.map((s, i) => (
                      <button
                        key={s.id}
                        onClick={() => selectSeason(i)}
                        className={`w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-sm border transition-all text-left ${
                          activeIndex === i
                            ? "border-[#84BD00] bg-[#84BD00]/5 shadow-sm"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-sm overflow-hidden shrink-0 bg-gray-100">
                          <img src={s.image} alt={s.shortTitle} className="w-full h-full object-cover object-top" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                              s.status === "upcoming" ? "bg-[#C97C2F] text-white" : "bg-gray-200 text-gray-600"
                            }`}>
                              {seasonTag(s)}
                            </span>
                          </div>
                          <p className="text-sm font-black text-[#111827] truncate">{s.shortTitle}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{seasonDate(s)}</p>
                        </div>
                        <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          activeIndex === i ? "text-[#84BD00]" : "text-gray-300"
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Toggle tab – RIGHT on mobile, LEFT on desktop */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className={`fixed top-[130px] sm:top-[140px] z-40 group ${
              isRight ? "right-0 left-auto" : "left-0 right-auto"
            }`}
            aria-label={t("openSidebar")}
          >
            <div className={`
              bg-[#006cb7] group-hover:bg-[#005b9f] text-white shadow-xl shadow-[#006cb7]/25 
              transition-all duration-300 flex items-center overflow-hidden
              ${isRight ? "rounded-l-md" : "rounded-r-md"}
            `}>
              <div className="flex flex-col items-center justify-center py-4 sm:py-5 px-2 sm:px-2.5 gap-1.5 sm:gap-2">
                {isRight 
                  ? <PanelRightOpen className="w-4 h-4 shrink-0" />
                  : <PanelLeftOpen className="w-4 h-4 shrink-0" />
                }
                <span
                  className="text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap"
                  style={{ writingMode: "vertical-rl", transform: isRight ? "rotate(180deg)" : undefined }}
                >
                  {t("sidebarTab")}
                </span>
              </div>
            </div>
          </button>
        )}

        {/* ── MAIN CONTENT ── */}
        <div 
          className={`
            flex-1 min-w-0 transition-all duration-300 ease-out
            ${sidebarOpen && isDesktop ? "lg:ml-[320px]" : "ml-0"}
          `}
        >
          <section className="pt-28 md:pt-32 pb-6 sm:pb-8 px-4 sm:px-6 md:px-8 lg:px-12 max-w-6xl mx-auto">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-[#006cb7] uppercase tracking-[0.2em] transition-colors mb-6 sm:mb-8"
            >
              <ArrowLeft className="w-4 h-4" /> {t("backHome")}
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 sm:gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d1121b]">
                    {t("eyebrow")}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-tight">
                  {t("title")}
                </h1>
                <p className="mt-2 sm:mt-3 text-sm text-gray-500 font-medium max-w-md">
                  {t("subtitle")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={goPrev}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-sm border border-gray-300 bg-white hover:border-[#006cb7] hover:text-[#006cb7] flex items-center justify-center transition-colors"
                  aria-label={t("previous")}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 min-w-[70px] sm:min-w-[80px] text-center">
                  {t("counter", { current: activeIndex + 1, total: seasons.length })}
                </span>
                <button 
                  onClick={goNext}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-sm border border-gray-300 bg-white hover:border-[#006cb7] hover:text-[#006cb7] flex items-center justify-center transition-colors"
                  aria-label={t("next")}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>

          <section className="px-4 sm:px-6 md:px-8 lg:px-12 max-w-6xl mx-auto mb-12 sm:mb-16">
            <div className="mb-4 sm:mb-5 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${current.status === "upcoming" ? "bg-[#C97C2F] animate-pulse" : "bg-gray-400"}`} />
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${current.status === "upcoming" ? "text-[#C97C2F]" : "text-gray-500"}`}>
                {current.status === "upcoming" ? t("statusUpcoming") : t("statusPast")}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
              >
                <Link href={current.slug} className="block group">
                  <div className="relative bg-white rounded-sm overflow-hidden shadow-xl border border-gray-200 group-hover:border-[#84BD00]/60 group-hover:shadow-[0_0_40px_rgba(132,189,0,0.25)] transition-all duration-400">
                    <div className="grid grid-cols-1 md:grid-cols-12">
                      <div className="md:col-span-5 relative bg-[#1a1a1a]">
                        <div className="aspect-[3/4] sm:aspect-[4/5] md:aspect-auto md:h-full min-h-[320px] sm:min-h-[380px] md:min-h-[420px] relative overflow-hidden">
                          <img 
                            src={current.image}
                            alt={current.title}
                            className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                          />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-[inset_0_0_60px_rgba(132,189,0,0.2)]" />
                        </div>
                      </div>

                      <div className="md:col-span-7 p-5 sm:p-7 md:p-9 lg:p-10 flex flex-col justify-center">
                        <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                          <span className={`text-white text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-sm ${
                            current.status === "upcoming" ? "bg-[#C97C2F]" : "bg-gray-500"
                          }`}>
                            {seasonTag(current)}
                          </span>
                          <span className="bg-gray-100 text-gray-600 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm">
                            {seasonDate(current)}
                          </span>
                        </div>

                        <h2 className="text-xl sm:text-2xl md:text-[1.75rem] lg:text-[2rem] font-black text-[#111827] uppercase tracking-tighter leading-tight mb-2 sm:mb-3">
                          {current.title}
                        </h2>
                        
                        <p className="text-gray-500 text-sm font-medium mb-5 sm:mb-6 max-w-md leading-relaxed">
                          {current.description}
                        </p>

                        <div className="flex flex-col gap-2.5 sm:gap-3 mb-6 sm:mb-8">
                          <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                            <MapPin className="w-4 h-4 text-[#84BD00] shrink-0" />
                            {current.location}
                          </div>
                          <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                            <Clock className="w-4 h-4 text-[#84BD00] shrink-0" />
                            {current.departure}
                          </div>
                          <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                            <Users className="w-4 h-4 text-[#84BD00] shrink-0" />
                            {current.price}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                          <span className="inline-flex items-center gap-2 bg-[#006cb7] text-white text-[11px] font-black uppercase tracking-[0.15em] px-5 sm:px-6 py-3 sm:py-3.5 rounded-sm group-hover:bg-[#005b9f] transition-colors">
                            {t("viewFull")}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                          {current.status === "upcoming" && (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {current.deadline}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </AnimatePresence>
          </section>

          <section className="px-4 sm:px-6 md:px-8 lg:px-12 max-w-6xl mx-auto pb-16 sm:pb-20">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight mb-5 sm:mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#006cb7]" />
              {t("allSeasons")}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {seasons.map((season, index) => (
                <button 
                  key={season.id}
                  onClick={() => setActiveIndex(index)}
                  className={`group relative block rounded-sm overflow-hidden border transition-all duration-300 text-left ${
                    activeIndex === index
                      ? "border-[#84BD00] shadow-lg ring-2 ring-[#84BD00]/30"
                      : season.status === "upcoming" 
                        ? "border-[#84BD00]/50 hover:shadow-[0_0_30px_rgba(132,189,0,0.2)]" 
                        : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="relative h-44 sm:h-52 md:h-56">
                    <img 
                      src={season.image}
                      alt={season.title}
                      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className={`absolute inset-0 ${
                      season.status === "upcoming"
                        ? "bg-gradient-to-t from-black/80 via-black/35 to-transparent"
                        : "bg-gradient-to-t from-black/85 via-black/50 to-black/20"
                    }`} />

                    {activeIndex === index && (
                      <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(132,189,0,0.25)] pointer-events-none" />
                    )}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ${
                        season.status === "upcoming" 
                          ? "bg-[#C97C2F] text-white" 
                          : "bg-white/20 text-white"
                      }`}>
                        {seasonTag(season)}
                      </span>
                      <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider">
                        {seasonDate(season)}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-tight">
                      {season.shortTitle}
                    </h4>
                    <p className="text-[11px] text-white/70 mt-1 font-medium">
                      {season.price}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-6 sm:mt-8 text-center text-[11px] text-gray-400 font-medium uppercase tracking-wider">
              {t("hint")}
            </p>
          </section>

          <Footer />
        </div>
      </div>
    </main>
  );
}
