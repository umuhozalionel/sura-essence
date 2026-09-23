"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Users,
  ChevronUp,
  Leaf,
  Landmark,
  Crown,
  SlidersHorizontal,
  Clock,
  CalendarCheck,
  Sparkles
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// ─── Types ────────────────────────────────────────────────────────────────────

// Past events, categories and every piece of text come from messages/en.json +
// messages/fr.json (namespace "PastEvents"). Add an entry to "items" in those two files.
type Category = { id: string; icon?: string; label: string };

type PastEvent = {
  id: string;
  date: string;
  endDate?: string;
  image: string;
  price: number;
  currency: string;
  seats: number;
  attendees: number;
  category: string;
  featured?: boolean;
  title: string;
  subtitle: string;
  location: string;
  country: string;
  duration: string;
};

const CATEGORY_TONES: Record<string, string> = {
  nature: "text-primary",
  culture: "text-primary",
  exclusive: "text-[#125740]",
};

export default function PastEventsPage() {
  const t = useTranslations("PastEvents");
  const format = useFormatter();

  const categories = t.raw("categories") as Category[];
  const events = t.raw("items") as PastEvent[];

  const [filter, setFilter] = useState("all");
  const [showBackToTop, setShowBackToTop] = useState(false);

  const filteredEvents = events.filter(
    (event) => filter === "all" || event.category === filter
  );

  const eventDay = (event: PastEvent) => {
    const day = format.dateTime(new Date(event.date), { day: "numeric" });
    if (event.endDate && event.endDate !== event.date) {
      return `${day}-${format.dateTime(new Date(event.endDate), { day: "numeric" })}`;
    }
    return day;
  };
  const eventMonth = (event: PastEvent) => format.dateTime(new Date(event.date), { month: "short" });

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-manrope selection:bg-secondary/30 selection:text-primary-foreground relative">
      <Header />

      <section className="relative h-[75vh] min-h-[550px] flex items-center justify-center overflow-hidden bg-[#0A1128]">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-500 scale-100 opacity-60 grayscale-[30%]"
          style={{ backgroundImage: "url('/backgrounds/bigogwe_march.jpg')" }}
        />

        <div className="relative z-10 text-center px-6 mt-16 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 bg-black/50 backdrop-blur-md rounded-sm mb-6 shadow-2xl">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-white tracking-[0.25em] uppercase">
                {t("badge")}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-6 drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
              {t("title")} <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-[#EAB308] to-secondary drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                {t("titleHighlight")}
              </span>
            </h1>

            <p className="text-white font-medium text-base md:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)] bg-black/30 p-4 rounded-sm backdrop-blur-sm">
              {t("subtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="sticky top-[72px] z-40 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 hide-scrollbar">
            <SlidersHorizontal size={14} className="text-muted-foreground mr-2 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap rounded-sm transition-all duration-150 ${
                  filter === cat.id
                    ? "bg-secondary text-primary-foreground shadow-md shadow-secondary/10"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <Link
            href="/events"
            className="group flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <CalendarCheck size={14} className="group-hover:-rotate-12 transition-transform duration-200" />
            {t("viewUpcoming")}
          </Link>
        </div>
      </div>

      <section className="py-20 px-6 lg:px-10 max-w-[1400px] mx-auto min-h-[45vh]">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-sm">
            <p className="text-muted-foreground text-sm uppercase tracking-wider">{t("emptyText")}</p>
            <button 
              onClick={() => setFilter("all")}
              className="mt-3 text-primary hover:text-primary text-xs font-bold uppercase tracking-widest transition-colors"
            >
              {t("resetFilters")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  key={event.id}
                  className="group flex flex-col bg-card border border-border hover:border-secondary/40 rounded-sm overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl"
                >
                  <div className="relative h-60 overflow-hidden bg-muted">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-102 grayscale-[20%]"
                      style={{ backgroundImage: `url('${event.image}')` }}
                    />
                    
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border border-secondary/50 bg-secondary/20 text-primary backdrop-blur-md rounded-sm shadow-lg">
                        {t("completed")}
                      </span>
                      {event.featured && (
                        <span className="bg-primary text-primary-foreground px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-1 shadow-2xl">
                          <Crown size={10} /> {t("featured")}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-4 left-4 flex flex-col">
                      <span className="text-3xl font-black text-white leading-none tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {eventDay(event)}
                      </span>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {eventMonth(event)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 p-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        {(() => {
                          const category = categories.find((c) => c.id === event.category);
                          const CategoryIcon = getIcon(category?.icon);
                          return (
                            <>
                              <CategoryIcon size={12} className={CATEGORY_TONES[event.category] ?? "text-primary"} />
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {category?.label ?? event.category}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-card-foreground uppercase tracking-tight leading-tight mb-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium line-clamp-2">
                        {event.subtitle}
                      </p>
                    </div>

                    <div className="mt-auto space-y-3 pb-6 border-b border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin size={14} className="text-primary" />
                        <span className="truncate">{event.location}, {event.country}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={14} className="text-primary" />
                        <span>{event.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users size={14} className="text-primary" />
                        <span>{t("attended", { attendees: event.attendees, seats: event.seats })}</span>
                      </div>
                    </div>

                    <div className="pt-5 flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {t("priceLabel")}
                        </span>
                        <span className="text-lg font-black text-card-foreground">
                          {format.number(event.price)} <span className="text-sm text-primary">{event.currency}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                         <Link
                           href={`/events/recap/${event.id}`}
                           className="h-10 px-6 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors bg-muted hover:bg-secondary text-foreground hover:text-primary-foreground"
                         >
                           {t("viewRecap")}
                         </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <section className="border-t border-border bg-gradient-to-b from-transparent to-muted/20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground leading-tight">
              {t("repeat.title")}
            </h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-md">
              {t("repeat.text")}
            </p>
          </div>
          <a 
            href={`https://wa.me/250788564000?text=${encodeURIComponent(t("repeat.whatsappText"))}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-secondary text-primary-foreground text-xs font-bold tracking-widest uppercase px-7 py-3.5 rounded-sm hover:bg-secondary/90 transition-colors duration-200 shrink-0 shadow-sm"
          >
            {t("repeat.cta")}
            <Sparkles size={14} />
          </a>
        </div>
      </section>

      <Footer />

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            aria-label={t("backToTop")}
            className="fixed bottom-8 right-8 z-50 size-11 flex items-center justify-center bg-primary border border-secondary/20 text-primary-foreground hover:bg-secondary rounded-sm transition-colors shadow-xl"
          >
            <ChevronUp size={20} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}