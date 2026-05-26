"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
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
  ArrowUpRight,
  CalendarCheck,
  ImageOff,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
// import { Header } from "@/components/header";
// import { Footer } from "@/components/footer";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventCategory = "Nature" | "Culture" | "Exclusive" | "All";

interface PastEvent {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  endDate: string;
  location: string;
  district: string;
  price: number;
  category: Exclude<EventCategory, "All">;
  imageURL: string;
  seats: number;
  duration: string;
  attendees: number;
  highlight: string;
  featured?: boolean;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const PAST_EVENTS_DATA: PastEvent[] = [
  {
    id: "past-001",
    title: "Nyungwe Forest Dawn Walk",
    subtitle: "Canopy trail at first light through Rwanda's oldest rainforest",
    date: "2024-03-04",
    endDate: "2024-03-08",
    location: "Nyungwe Forest National Park",
    district: "Nyamasheke District",
    price: 780000,
    category: "Nature",
    imageURL: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
    seats: 8,
    duration: "5 Days",
    attendees: 8,
    highlight: "Fully Attended",
    featured: true,
  },
  {
    id: "past-002",
    title: "Virunga Gorilla Immersion",
    subtitle: "Private gorilla family tracking across the Virunga slopes",
    date: "2024-04-12",
    endDate: "2024-04-15",
    location: "Volcanoes National Park",
    district: "Musanze District",
    price: 1400000,
    category: "Nature",
    imageURL: "https://images.unsplash.com/photo-1585938389612-a552a28d6914?w=800&q=80",
    seats: 6,
    duration: "4 Days",
    attendees: 6,
    highlight: "Fully Attended",
  },
  {
    id: "past-003",
    title: "Kigali Heritage Circuit",
    subtitle: "Genocide memorials, Inema Arts Centre, and Kimironko market immersion",
    date: "2024-05-20",
    endDate: "2024-05-22",
    location: "Kigali",
    district: "Kigali City",
    price: 320000,
    category: "Culture",
    imageURL: "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800&q=80",
    seats: 12,
    duration: "3 Days",
    attendees: 11,
    highlight: "11 / 12 Attended",
  },
  {
    id: "past-004",
    title: "Lake Kivu Sunset Flotilla",
    subtitle: "Traditional wooden boats, fishermen's rituals, and peninsula dining",
    date: "2024-06-07",
    endDate: "2024-06-10",
    location: "Lake Kivu",
    district: "Rubavu District",
    price: 560000,
    category: "Exclusive",
    imageURL: "https://images.unsplash.com/photo-1504870712357-65ea720d6078?w=800&q=80",
    seats: 8,
    duration: "4 Days",
    attendees: 8,
    highlight: "Fully Attended",
    featured: true,
  },
  {
    id: "past-005",
    title: "Akagera Savanna Traverse",
    subtitle: "Big Five tracking with Rwandan wildlife rangers at golden hour",
    date: "2024-07-18",
    endDate: "2024-07-21",
    location: "Akagera National Park",
    district: "Kayonza District",
    price: 920000,
    category: "Nature",
    imageURL: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
    seats: 10,
    duration: "4 Days",
    attendees: 9,
    highlight: "9 / 10 Attended",
  },
  {
    id: "past-006",
    title: "Musanze Lava Tube Descent",
    subtitle: "Geological exploration of ancient volcanic tunnels beneath the Virungas",
    date: "2024-08-03",
    endDate: "2024-08-05",
    location: "Musanze Caves",
    district: "Musanze District",
    price: 480000,
    category: "Exclusive",
    imageURL: "https://images.unsplash.com/photo-1527489377706-5bf97e608852?w=800&q=80",
    seats: 6,
    duration: "3 Days",
    attendees: 6,
    highlight: "Fully Attended",
  },
  {
    id: "past-007",
    title: "Huye Cultural Dialogue",
    subtitle: "National Museum of Rwanda, Intore dance masters, and artisan workshops",
    date: "2024-09-14",
    endDate: "2024-09-17",
    location: "Huye",
    district: "Huye District",
    price: 390000,
    category: "Culture",
    imageURL: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80",
    seats: 12,
    duration: "4 Days",
    attendees: 12,
    highlight: "Fully Attended",
  },
  {
    id: "past-008",
    title: "Bisoke Summit Ascent",
    subtitle: "Crater lake sunrise from the peak of Mount Bisoke, 3,711 m",
    date: "2024-10-26",
    endDate: "2024-10-28",
    location: "Mount Bisoke",
    district: "Musanze District",
    price: 650000,
    category: "Nature",
    imageURL: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    seats: 8,
    duration: "3 Days",
    attendees: 7,
    highlight: "7 / 8 Attended",
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

// ─── Utility Helpers ──────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-RW", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRWF(amount: number): string {
  return new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getCategoryIcon(category: Exclude<EventCategory, "All">) {
  const map: Record<Exclude<EventCategory, "All">, React.ReactNode> = {
    Nature: <Leaf size={11} />,
    Culture: <Landmark size={11} />,
    Exclusive: <Crown size={11} />,
  };
  return map[category];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AttendanceBadge({ highlight }: { highlight: string }) {
  const isFull = highlight === "Fully Attended";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase border
        ${
          isFull
            ? "bg-[#1B4D3E]/60 text-emerald-300 border-emerald-800/50"
            : "bg-[#0A1128]/60 text-white/50 border-white/10"
        }`}
    >
      <CalendarCheck size={10} />
      {highlight}
    </span>
  );
}

interface PastEventCardProps {
  event: PastEvent;
  index: number;
  featured?: boolean;
}

function PastEventCard({ event, index, featured }: PastEventCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative flex flex-col overflow-hidden border border-white/8
        bg-[#0A1128] rounded-sm hover:border-[#C19A5B]/30 transition-colors duration-500
        ${featured ? "md:col-span-2 md:row-span-2" : ""}`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${featured ? "h-72 md:h-96" : "h-52"}`}>
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center bg-white/4">
            <ImageOff size={28} className="text-white/15" />
          </div>
        ) : (
          <img
            src={event.imageURL}
            alt={event.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale-[25%]"
          />
        )}

        {/* Desaturation scrim — signals "past" */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128] via-[#0A1128]/50 to-[#0A1128]/10" />

        {/* "PAST" watermark */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-black tracking-[0.35em] uppercase text-white/20 border border-white/10 px-2 py-0.5 rounded-sm">
            Past
          </span>
        </div>

        {/* Category tag */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase text-[#C19A5B]/60 font-medium">
            {getCategoryIcon(event.category)}
            {event.category}
          </span>
        </div>

        {/* Price */}
        <div className="absolute bottom-4 right-4">
          <span className="text-white/40 text-sm font-bold tracking-tight">
            {formatRWF(event.price)}
          </span>
          <span className="text-white/25 text-xs ml-1">/ person</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Attendance badge */}
        <AttendanceBadge highlight={event.highlight} />

        {/* Title */}
        <div>
          <h3
            className={`font-extrabold uppercase tracking-tight text-white/80 leading-tight
              ${featured ? "text-2xl md:text-3xl" : "text-lg"}`}
          >
            {event.title}
          </h3>
          <p className="text-white/35 text-sm mt-1 leading-snug">{event.subtitle}</p>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/35">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} className="text-[#C19A5B]/60" />
            {formatDate(event.date)} — {formatDate(event.endDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={12} className="text-[#C19A5B]/60" />
            {event.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} className="text-[#C19A5B]/60" />
            {event.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={12} className="text-[#C19A5B]/60" />
            {event.attendees} / {event.seats} attended
          </span>
        </div>

        {/* District tag */}
        <p className="text-[10px] text-white/20 tracking-widest uppercase">
          {event.district} · Rwanda
        </p>

        {/* Divider */}
        <div className="h-px bg-white/6 mt-auto" />

        {/* CTA */}
        <div className="flex gap-2 pt-1">
          <button className="flex-1 flex items-center justify-center gap-2 border border-white/10 text-white/40 text-xs font-semibold tracking-widest uppercase px-4 py-2.5 rounded-sm hover:border-[#C19A5B]/30 hover:text-[#C19A5B]/70 transition-all duration-200">
            View Recap
            <ArrowUpRight size={13} />
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 border border-[#C19A5B]/25 text-[#C19A5B]/60 text-xs font-semibold tracking-widest uppercase px-4 py-2.5 rounded-sm hover:bg-[#C19A5B]/8 hover:border-[#C19A5B]/50 hover:text-[#C19A5B] transition-all duration-200">
            Request Again
            <Sparkles size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function ArchiveStats() {
  const totalAttendees = PAST_EVENTS_DATA.reduce((s, e) => s + e.attendees, 0);
  const totalEvents = PAST_EVENTS_DATA.length;
  const fillRate = Math.round(
    (PAST_EVENTS_DATA.reduce((s, e) => s + e.attendees, 0) /
      PAST_EVENTS_DATA.reduce((s, e) => s + e.seats, 0)) *
      100
  );

  const stats = [
    { label: "Expeditions Completed", value: totalEvents },
    { label: "Total Guests Hosted", value: totalAttendees },
    { label: "Average Fill Rate", value: `${fillRate}%` },
    { label: "Locations Explored", value: "8" },
  ];

  return (
    <div className="border-b border-white/8 bg-[#1B4D3E]/10">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 + i * 0.08 }}
            className="flex flex-col gap-1"
          >
            <span className="text-2xl md:text-3xl font-extrabold text-[#C19A5B]">
              {value}
            </span>
            <span className="text-[11px] text-white/30 tracking-widest uppercase">
              {label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function PastEventsPage() {
  const [activeCategory, setActiveCategory] = useState<EventCategory>("All");
  const [showBackToTop, setShowBackToTop] = useState(false);

  const filtered = PAST_EVENTS_DATA.filter(
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
      <section className="relative overflow-hidden min-h-[68vh] flex items-end">
        {/* Background gradients */}
        <div
          className="absolute inset-0 bg-[#0A1128]"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 60% 55% at 30% 50%, rgba(193,154,91,0.09) 0%, transparent 65%),
              radial-gradient(ellipse 50% 40% at 75% 30%, rgba(27,77,62,0.18) 0%, transparent 60%)
            `,
          }}
        />

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top rule */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C19A5B]/20 to-transparent" />

        <div className="relative w-full max-w-7xl mx-auto px-6 md:px-10 pb-16 pt-32">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="h-px w-10 bg-[#C19A5B]/60" />
            <span className="text-[#C19A5B]/70 text-xs tracking-[0.3em] uppercase font-semibold">
              Sura Essence · Expedition Archive
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(3rem,9vw,7.5rem)] font-black uppercase tracking-[-0.02em] leading-[0.92] text-white/70"
          >
            The
            <br />
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: "1px rgba(193,154,91,0.35)" }}
            >
              Archive
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-8 max-w-xl text-white/35 text-base md:text-lg leading-relaxed font-light"
          >
            Every expedition we have ever led — a living record of places explored,
            stories gathered, and Rwanda's landscapes witnessed firsthand.
          </motion.p>

          {/* Year tags */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex items-center gap-2 mt-8"
          >
            <span className="text-xs text-white/20 tracking-widest uppercase">
              Seasons on record:
            </span>
            {["2024", "2023"].map((yr) => (
              <span
                key={yr}
                className="text-xs font-semibold tracking-widest border border-white/10 text-white/30 px-2.5 py-1 rounded-sm"
              >
                {yr}
              </span>
            ))}
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/8" />
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <ArchiveStats />

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
                        : "text-white/35 border border-transparent hover:text-white/60 hover:border-white/10"
                    }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {/* Upcoming events nav link */}
            <Link
              href="/events/upcoming"
              className="flex items-center gap-2 text-xs text-white/35 hover:text-[#C19A5B] transition-colors duration-200 font-medium tracking-wide whitespace-nowrap shrink-0 group"
            >
              <CalendarCheck
                size={13}
                className="group-hover:text-[#C19A5B] transition-colors"
              />
              <span className="hidden sm:inline">Upcoming Events</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Event Grid ───────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-14">
        {/* Results count */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-xs text-white/25 tracking-widest uppercase">
            {filtered.length} Expedition{filtered.length !== 1 ? "s" : ""} in Archive
          </span>
          <span className="h-px flex-1 bg-white/5" />
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
              <CalendarCheck size={32} className="text-white/10 mb-4" />
              <p className="text-white/20 text-sm tracking-widest uppercase">
                No archived expeditions in this category
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
                <PastEventCard
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
      <section className="border-t border-white/8 bg-[#0A1128]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[#C19A5B]/70 text-xs tracking-[0.3em] uppercase font-semibold mb-2">
              Returning Guests
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-white/70 leading-tight">
              Loved a past expedition?
            </h2>
            <p className="text-white/30 text-sm mt-2 max-w-md">
              Many of our archived journeys run again by private request. Tell us
              which one moved you.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/events/upcoming"
              className="flex items-center justify-center gap-2 border border-[#C19A5B]/30 text-[#C19A5B]/70 text-xs font-bold tracking-widest uppercase px-6 py-3.5 rounded-sm hover:border-[#C19A5B]/60 hover:text-[#C19A5B] transition-all duration-200"
            >
              View Upcoming
              <ArrowUpRight size={13} />
            </Link>
            <button className="flex items-center justify-center gap-2 bg-[#1B4D3E] text-white text-xs font-bold tracking-widest uppercase px-7 py-3.5 rounded-sm hover:bg-[#256354] transition-colors duration-200">
              Request Private Repeat
              <Sparkles size={13} />
            </button>
          </div>
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
              bg-[#0A1128] border border-[#C19A5B]/20 text-[#C19A5B]/50 rounded-sm shadow-2xl
              hover:bg-[#1B4D3E] hover:border-[#C19A5B]/40 hover:text-[#C19A5B] transition-all duration-200"
          >
            <ChevronUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}