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
  ArrowRight,
  CalendarCheck,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventCategory = "Nature" | "Culture" | "Exclusive" | "All";

interface PastEvent {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  endDate: string;
  location: string;
  country: string;
  price: number;
  currency: string;
  category: Exclude<EventCategory, "All">;
  imageURL: string;
  seats: number;
  duration: string;
  attendees: number;
  featured?: boolean;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const PAST_EVENTS_DATA: PastEvent[] = [
  {
    id: "past-001",
    title: "Discover Bigogwe",
    subtitle: "Green Hills · Cattle Culture · Highland Experience",
    date: "2026-03-28",
    endDate: "2026-03-29",
    location: "Bigogwe, Gisenyi",
    country: "Rwanda",
    price: 80000,
    currency: "RWF",
    category: "Culture",
    imageURL: "/backrounds/bigogwe_march.jpg",
    seats: 15,
    duration: "1 Night, 2 Days",
    attendees: 15,
    featured: true,
  }
];

// ─── Utility Components ───────────────────────────────────────────────────────

const formatDate = (dateString: string, endDateString?: string) => {
  const date = new Date(dateString);
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = date.getDate();

  if (endDateString) {
    const endDate = new Date(endDateString);
    const endDay = endDate.getDate();
    return `${month} ${day}-${endDay}`;
  }
  return `${month} ${day}`;
};

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function PastEventsPage() {
  const [filter, setFilter] = useState<EventCategory>("All");
  const [showBackToTop, setShowBackToTop] = useState(false);

  const filteredEvents = PAST_EVENTS_DATA.filter(
    (event) => filter === "All" || event.category === filter
  );

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
    <main className="min-h-screen bg-background text-foreground font-manrope selection:bg-secondary/30 selection:text-secondary-foreground relative">
      <Header />

      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="relative h-[75vh] min-h-[550px] flex items-center justify-center overflow-hidden bg-[#0A1128]">
        {/* Crisp clean asset view - NO GRADIENTS */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-500 scale-100 opacity-60 grayscale-[30%]"
          style={{ backgroundImage: "url('/backrounds/bigogwe_march.jpg')" }}
        />

        {/* Hero Content Panel */}
        <div className="relative z-10 text-center px-6 mt-16 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 bg-black/50 backdrop-blur-md rounded-sm mb-6 shadow-2xl">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-white tracking-[0.25em] uppercase">
                Sura Essence Archive
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-6 drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
              The <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-[#e5c185] to-secondary drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                Archive
              </span>
            </h1>

            <p className="text-white font-medium text-base md:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)] bg-black/30 p-4 rounded-sm backdrop-blur-sm">
              Every expedition we have ever led — a living record of places explored, stories gathered, and Rwanda's landscapes witnessed firsthand.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Filter & Navigation Segment ───────────────────────────────────────── */}
      <div className="sticky top-[72px] z-40 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 hide-scrollbar">
            <SlidersHorizontal size={14} className="text-muted-foreground mr-2 shrink-0" />
            {(["All", "Nature", "Culture", "Exclusive"] as EventCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap rounded-sm transition-all duration-150 ${
                  filter === cat
                    ? "bg-secondary text-secondary-foreground shadow-md shadow-secondary/10"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Link
            href="/events"
            className="group flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <CalendarCheck size={14} className="group-hover:-rotate-12 transition-transform duration-200" />
            View Upcoming
          </Link>
        </div>
      </div>

      {/* ── Event Display System ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-10 max-w-[1400px] mx-auto min-h-[45vh]">
        
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-sm">
            <p className="text-muted-foreground text-sm uppercase tracking-wider">No archived entries inside this track.</p>
            <button 
              onClick={() => setFilter("All")}
              className="mt-3 text-secondary hover:text-primary text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Reset Filters
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
                  {/* Event Image without gradients */}
                  <div className="relative h-60 overflow-hidden bg-muted">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-102 grayscale-[20%]"
                      style={{ backgroundImage: `url('${event.imageURL}')` }}
                    />
                    
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border border-secondary/50 bg-secondary/20 text-secondary backdrop-blur-md rounded-sm shadow-lg">
                        Completed
                      </span>
                      {event.featured && (
                        <span className="bg-primary text-primary-foreground px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-1 shadow-2xl">
                          <Crown size={10} /> Featured
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-4 left-4 flex flex-col">
                      <span className="text-3xl font-black text-white leading-none tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {formatDate(event.date, event.endDate).split(" ")[1]}
                      </span>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {formatDate(event.date, event.endDate).split(" ")[0]}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 p-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        {event.category === "Nature" && <Leaf size={12} className="text-primary" />}
                        {event.category === "Culture" && <Landmark size={12} className="text-secondary" />}
                        {event.category === "Exclusive" && <Crown size={12} className="text-purple-500" />}
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {event.category}
                        </span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-card-foreground uppercase tracking-tight leading-tight mb-2 group-hover:text-secondary transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium line-clamp-2">
                        {event.subtitle}
                      </p>
                    </div>

                    <div className="mt-auto space-y-3 pb-6 border-b border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin size={14} className="text-secondary" />
                        <span className="truncate">{event.location}, {event.country}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={14} className="text-secondary" />
                        <span>{event.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users size={14} className="text-secondary" />
                        <span>{event.attendees} / {event.seats} Attended</span>
                      </div>
                    </div>

                    <div className="pt-5 flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Past Ticket Price
                        </span>
                        <span className="text-lg font-black text-card-foreground">
                          {event.price.toLocaleString()} <span className="text-sm text-secondary">{event.currency}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                         <Link
                           href={`/events/recap/${event.id}`}
                           className="h-10 px-6 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors bg-muted hover:bg-secondary text-foreground hover:text-secondary-foreground"
                         >
                           View Recap
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

      {/* ── Contact Bridge Section ────────────────────────────────────────────── */}
      <section className="border-t border-border bg-gradient-to-b from-transparent to-muted/20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground leading-tight">
              Loved a past expedition?
            </h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-md">
              Many of our archived journeys run again by private request. Perfect for couples on honeymoon, intimate getaways, or corporate groups. Tell us which one moved you.
            </p>
          </div>
          <a 
            href="https://wa.me/250788564000?text=Hello,%20I%20would%20like%20to%20request%20a%20private%20bespoke%20journey%20based%20on%20a%20past%20event."
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-secondary text-secondary-foreground text-xs font-bold tracking-widest uppercase px-7 py-3.5 rounded-sm hover:bg-secondary/90 transition-colors duration-200 shrink-0 shadow-sm"
          >
            Request Private Repeat
            <Sparkles size={14} />
          </a>
        </div>
      </section>

      <Footer />

      {/* ── Top-Retract Trigger ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-8 right-8 z-50 size-11 flex items-center justify-center bg-primary border border-secondary/20 text-primary-foreground hover:bg-secondary rounded-sm transition-colors shadow-xl"
          >
            <ChevronUp size={20} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}