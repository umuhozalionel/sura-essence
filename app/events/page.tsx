"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  MapPin,
  Calendar,
  Users,
  ArrowUpRight,
  ChevronUp,
  Leaf,
  Landmark,
  Crown,
  SlidersHorizontal,
  Clock,
  ArrowRight,
  History,
} from "lucide-react";
import Link from "next/link";
// Imports commented out to resolve the build error
// import Header from "@/components/Header";
// import Footer from "@/components/Footer";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventStatus = "Limited Seats" | "Booking Open" | "Sold Out" | "Coming Soon";
type EventCategory = "Nature" | "Culture" | "Exclusive" | "All";

interface SuraEvent {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  endDate?: string;
  location: string;
  country: string;
  price: number;
  currency: string;
  status: EventStatus;
  category: Exclude<EventCategory, "All">;
  imageURL: string;
  seats?: number;
  duration: string;
  featured?: boolean;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const EVENTS_DATA: SuraEvent[] = [
  {
    id: "evt-001",
    title: "Volcanoes Night Traverse",
    subtitle: "Gorilla tracking at dusk, above the clouds",
    date: "2025-08-14",
    endDate: "2025-08-18",
    location: "Virunga Massif",
    country: "Rwanda",
    price: 4800,
    currency: "USD",
    status: "Limited Seats",
    category: "Nature",
    imageURL: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
    seats: 6,
    duration: "5 Days",
    featured: true,
  },
  {
    id: "evt-002",
    title: "Rift Valley Symposium",
    subtitle: "Private sessions with East Africa's leading conservationists",
    date: "2025-09-03",
    endDate: "2025-09-06",
    location: "Lake Naivasha",
    country: "Kenya",
    price: 3200,
    currency: "USD",
    status: "Booking Open",
    category: "Culture",
    imageURL: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80",
    seats: 12,
    duration: "4 Days",
  },
  {
    id: "evt-003",
    title: "Kalahari Solstice Expedition",
    subtitle: "Celestial navigation & star lore with San trackers",
    date: "2025-09-21",
    endDate: "2025-09-25",
    location: "Central Kalahari",
    country: "Botswana",
    price: 6500,
    currency: "USD",
    status: "Limited Seats",
    category: "Exclusive",
    imageURL: "https://images.unsplash.com/photo-1504870712357-65ea720d6078?w=800&q=80",
    seats: 4,
    duration: "5 Days",
    featured: true,
  },
  {
    id: "evt-004",
    title: "Swahili Coastal Immersion",
    subtitle: "Dhow sailing, spice routes, and living heritage",
    date: "2025-10-10",
    endDate: "2025-10-15",
    location: "Lamu Archipelago",
    country: "Kenya",
    price: 2900,
    currency: "USD",
    status: "Booking Open",
    category: "Culture",
    imageURL: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
    seats: 10,
    duration: "6 Days",
  },
  {
    id: "evt-005",
    title: "Namib Dune Crossing",
    subtitle: "Dawn ascent of the world's oldest desert",
    date: "2025-11-01",
    endDate: "2025-11-04",
    location: "Sossusvlei",
    country: "Namibia",
    price: 3800,
    currency: "USD",
    status: "Booking Open",
    category: "Nature",
    imageURL: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
    seats: 8,
    duration: "4 Days",
  },
  {
    id: "evt-006",
    title: "The Founders' Safari",
    subtitle: "An invitation-adjacent journey for twelve discerning guests",
    date: "2025-12-06",
    endDate: "2025-12-12",
    location: "Okavango Delta",
    country: "Botswana",
    price: 12000,
    currency: "USD",
    status: "Coming Soon",
    category: "Exclusive",
    imageURL: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
    seats: 12,
    duration: "7 Days",
    featured: true,
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { label: EventCategory; icon: React.ReactNode }[] = [
  { label: "All", icon: <SlidersHorizontal size={14} /> },
  { label: "Nature", icon: <Leaf size={14} /> },
  { label: "Culture", icon: <Landmark size={14} /> },
  { label: "Exclusive", icon: <Crown size={14} /> },
];

const STATUS_CONFIG: Record<
  EventStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  "Limited Seats": {
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    border: "border-amber-700/50",
    dot: "bg-amber-400",
  },
  "Booking Open": {
    bg: "bg-emerald-950/60",
    text: "text-emerald-300",
    border: "border-emerald-700/50",
    dot: "bg-emerald-400",
  },
  "Sold Out": {
    bg: "bg-red-950/60",
    text: "text-red-300",
    border: "border-red-800/50",
    dot: "bg-red-500",
  },
  "Coming Soon": {
    bg: "bg-slate-800/60",
    text: "text-slate-300",
    border: "border-slate-600/50",
    dot: "bg-slate-400",
  },
};

// ─── Utility helpers ──────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(price);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EventStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {status}
    </span>
  );
}

function CategoryIcon({ category }: { category: Exclude<EventCategory, "All"> }) {
  const map: Record<Exclude<EventCategory, "All">, React.ReactNode> = {
    Nature: <Leaf size={11} />,
    Culture: <Landmark size={11} />,
    Exclusive: <Crown size={11} />,
  };
  return (
    <span className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase text-[#C19A5B]/70 font-medium">
      {map[category]}
      {category}
    </span>
  );
}

interface EventCardProps {
  event: SuraEvent;
  index: number;
  featured?: boolean;
}

function EventCard({ event, index, featured }: EventCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative flex flex-col overflow-hidden border border-white/8 bg-[#0A1128] rounded-sm
        ${featured ? "md:col-span-2 md:row-span-2" : ""}
        hover:border-[#C19A5B]/40 transition-colors duration-500`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${featured ? "h-72 md:h-96" : "h-52"}`}>
        <img
          src={event.imageURL}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128] via-[#0A1128]/40 to-transparent" />

        {/* Top row badges */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <CategoryIcon category={event.category} />
          <StatusBadge status={event.status} />
        </div>

        {/* Price tag */}
        <div className="absolute bottom-4 right-4">
          <span className="text-[#C19A5B] font-bold text-lg tracking-tight">
            {formatPrice(event.price, event.currency)}
          </span>
          <span className="text-white/40 text-xs ml-1">/ person</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Title */}
        <div>
          <h3
            className={`font-extrabold uppercase tracking-tight text-white leading-tight
              ${featured ? "text-2xl md:text-3xl" : "text-lg"}`}
          >
            {event.title}
          </h3>
          <p className="text-white/50 text-sm mt-1 leading-snug">{event.subtitle}</p>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} className="text-[#C19A5B]" />
            {formatDate(event.date)}
            {event.endDate && ` — ${formatDate(event.endDate)}`}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={12} className="text-[#C19A5B]" />
            {event.location}, {event.country}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} className="text-[#C19A5B]" />
            {event.duration}
          </span>
          {event.seats && (
            <span className="flex items-center gap-1.5">
              <Users size={12} className="text-[#C19A5B]" />
              {event.seats} seats
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8 mt-auto" />

        {/* CTA row */}
        <div className="flex gap-2 pt-1">
          <button
            className="flex-1 flex items-center justify-center gap-2 border border-[#C19A5B]/50 text-[#C19A5B]
              text-xs font-semibold tracking-widest uppercase px-4 py-2.5 rounded-sm
              hover:bg-[#C19A5B]/10 hover:border-[#C19A5B] transition-all duration-200"
          >
            Details
            <ArrowUpRight size={13} />
          </button>
          <button
            disabled={event.status === "Sold Out" || event.status === "Coming Soon"}
            className="flex-1 flex items-center justify-center gap-2 bg-[#1B4D3E] text-white
              text-xs font-semibold tracking-widest uppercase px-4 py-2.5 rounded-sm
              hover:bg-[#256354] disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-200 border border-[#1B4D3E]"
          >
            Book Event
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function UpcomingEventsPage() {
  const [activeCategory, setActiveCategory] = useState<EventCategory>("All");
  const [showBackToTop, setShowBackToTop] = useState(false);

  const filtered = EVENTS_DATA.filter(
    (e) => activeCategory === "All" || e.category === activeCategory
  );

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div
      className="min-h-screen bg-[#0A1128] text-white"
      style={{ fontFamily: "var(--font-manrope), Manrope, sans-serif" }}
    >
      {/* <Header /> */}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[72vh] flex items-end">
        {/* Background texture / gradient */}
        <div
          className="absolute inset-0 bg-[#0A1128]"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 70% 60% at 60% 40%, rgba(27,77,62,0.28) 0%, transparent 70%),
              radial-gradient(ellipse 50% 50% at 20% 80%, rgba(193,154,91,0.10) 0%, transparent 60%)
            `,
          }}
        />

        {/* Grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Horizontal rule decorations */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C19A5B]/30 to-transparent" />

        <div className="relative w-full max-w-7xl mx-auto px-6 md:px-10 pb-16 pt-32">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="h-px w-10 bg-[#C19A5B]" />
            <span className="text-[#C19A5B] text-xs tracking-[0.3em] uppercase font-semibold">
              Sura Essence · Curated Journeys
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(3rem,9vw,7.5rem)] font-black uppercase tracking-[-0.02em] leading-[0.92] text-white"
          >
            Sura
            <br />
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: "1px rgba(193,154,91,0.6)" }}
            >
              Experiences
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-8 max-w-xl text-white/50 text-base md:text-lg leading-relaxed font-light"
          >
            Each expedition is engineered for the uncommon traveller — where
            wilderness, culture, and craft converge at the edge of the possible.
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap gap-8 mt-10"
          >
            {[
              { label: "Active Expeditions", value: EVENTS_DATA.length },
              { label: "Countries", value: "4" },
              { label: "Max Group Size", value: "12" },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-2xl font-extrabold text-[#C19A5B]">{value}</span>
                <span className="text-xs text-white/35 tracking-widest uppercase">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/8" />
      </section>

      {/* ── Filter / Nav Bar ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="sticky top-0 z-40 border-b border-white/8 bg-[#0A1128]/90 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Category filters */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {CATEGORIES.map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => setActiveCategory(label)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold tracking-widest uppercase whitespace-nowrap rounded-sm transition-all duration-200
                    ${
                      activeCategory === label
                        ? "bg-[#1B4D3E] text-white border border-[#1B4D3E]"
                        : "text-white/40 border border-transparent hover:text-white/70 hover:border-white/10"
                    }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {/* Past events nav link */}
            <Link
              href="/events/past"
              className="flex items-center gap-2 text-xs text-white/35 hover:text-[#C19A5B] transition-colors duration-200 font-medium tracking-wide whitespace-nowrap shrink-0 group"
            >
              <History size={13} className="group-hover:text-[#C19A5B] transition-colors" />
              <span className="hidden sm:inline">Past Events</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Event Grid ───────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-14">
        {/* Results count */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-xs text-white/30 tracking-widest uppercase">
            {filtered.length} Expedition{filtered.length !== 1 ? "s" : ""}
          </span>
          <span className="h-px flex-1 bg-white/6" />
        </div>

        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <Leaf size={32} className="text-white/15 mb-4" />
              <p className="text-white/30 text-sm tracking-widest uppercase">
                No expeditions in this category yet
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto"
            >
              {filtered.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={i}
                  featured={event.featured && activeCategory === "All"}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="border-t border-white/8 bg-[#1B4D3E]/15">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[#C19A5B] text-xs tracking-[0.3em] uppercase font-semibold mb-2">
              Bespoke Journeys
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-white leading-tight">
              Can't find what you're looking for?
            </h2>
            <p className="text-white/40 text-sm mt-2 max-w-md">
              Every Sura experience can be crafted privately. Speak to a journey architect.
            </p>
          </div>
          <button className="flex items-center gap-2 bg-[#C19A5B] text-[#0A1128] text-xs font-bold tracking-widest uppercase px-7 py-3.5 rounded-sm hover:bg-[#d4af70] transition-colors duration-200 shrink-0">
            Request Private Journey
            <ArrowUpRight size={14} />
          </button>
        </div>
      </section>

      {/* <Footer /> */}

      {/* ── Back to Top ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-8 right-8 z-50 size-11 flex items-center justify-center
              bg-[#1B4D3E] border border-[#C19A5B]/30 text-[#C19A5B] rounded-sm shadow-2xl
              hover:bg-[#256354] hover:border-[#C19A5B]/60 transition-all duration-200"
          >
            <ChevronUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}