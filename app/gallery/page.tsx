"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Manrope } from "next/font/google";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  MapPin,
  Calendar,
  ZoomIn,
  Film,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope",
});

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
type MediaType = "image" | "video";
type Category = "all" | "events" | "nature" | "city" | "fleet";
type Span = "normal" | "wide" | "tall" | "featured";

interface GalleryItem {
  id: number;
  type: MediaType;
  src: string;
  poster?: string; // thumbnail / poster for videos
  category: Exclude<Category, "all">;
  event: string;
  description: string;
  date: string;
  location: string;
  span: Span;
}

/* ─────────────────────────────────────────────────────────
   CATEGORIES
───────────────────────────────────────────────────────── */
const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all",    label: "All Moments"   },
  { id: "events", label: "Events"        },
  { id: "nature", label: "Nature & Parks" },
  { id: "city",   label: "City Life"     },
  { id: "fleet",  label: "Fleet & Rides" },
];

/* ─────────────────────────────────────────────────────────
   GALLERY DATA
   ──
   Paths marked ✓ are confirmed from your existing pages.
   Paths marked ✦ live in /public/gallery/ — add your own
   images there (follow the same naming convention).
───────────────────────────────────────────────────────── */
const ITEMS: GalleryItem[] = [
  // ✓ confirmed paths
  {
    id: 1,
    type: "image",
    src: "/backgrounds/car-free-day.jpg",
    category: "events",
    event: "Kigali Car Free Day",
    description:
      "Our crew joins Kigali's signature Sunday wellness tradition — cycling, community, and clean city air.",
    date: "May 2025",
    location: "Kigali City",
    span: "wide",
  },
  {
    id: 2,
    type: "image",
    src: "/backgrounds/sura-experience.jpg",
    category: "fleet",
    event: "The SURA Standard",
    description:
      "Every vehicle prepared and inspected to the highest standard before each journey begins.",
    date: "April 2025",
    location: "Kigali",
    span: "tall",
  },
  {
    id: 3,
    type: "image",
    src: "/fleet/sedan.webp",
    category: "fleet",
    event: "Executive Fleet Preview",
    description:
      "Our premium sedan lineup — the choice for solo and duo transfers across Kigali and beyond.",
    date: "March 2025",
    location: "Kigali",
    span: "normal",
  },
  {
    id: 4,
    type: "image",
    src: "/nyungwe-hero-bg.jpg",       // ✓ used in hero.tsx
    category: "events",
    event: "Nyungwe Forest Escape",
    description:
      "Deep in the ancient canopy of Nyungwe — the largest tropical montane forest in Central Africa.",
    date: "June 2025",
    location: "Nyungwe, Southern Rwanda",
    span: "featured",
  },
  // ✦ add images to /public/gallery/
  {
    id: 5,
    type: "image",
    src: "/gallery/volcanoes-park.jpg",
    category: "nature",
    event: "Volcanoes National Park",
    description:
      "The iconic Virunga peaks rise above the mist — home to mountain gorillas and golden monkeys.",
    date: "Feb 2025",
    location: "Musanze, North Rwanda",
    span: "tall",
  },
  {
    id: 6,
    type: "image",
    src: "/gallery/lake-kivu-sunset.jpg",
    category: "nature",
    event: "Lake Kivu Sunset Drive",
    description:
      "Golden hour over Lake Kivu — the reward at the end of a 3.5-hour coastal highway journey.",
    date: "Jan 2025",
    location: "Rubavu, Western Rwanda",
    span: "wide",
  },
  {
    id: 7,
    type: "image",
    src: "/gallery/kigali-city-night.jpg",
    category: "city",
    event: "Kigali After Dark",
    description:
      "The City of a Thousand Hills never sleeps — premium night transfers across every district.",
    date: "Dec 2024",
    location: "Kigali",
    span: "normal",
  },
  {
    id: 8,
    type: "image",
    src: "/gallery/akagera-safari.jpg",
    category: "nature",
    event: "Akagera National Park",
    description:
      "East Africa's great savannah at Rwanda's eastern border — lions, hippos, and open horizons.",
    date: "Nov 2024",
    location: "Eastern Rwanda",
    span: "wide",
  },
  {
    id: 9,
    type: "image",
    src: "/gallery/car-free-day-2.jpg",
    category: "events",
    event: "Car Free Day Community",
    description:
      "Community and connection at Kigali's beloved weekly wellness gathering.",
    date: "Oct 2024",
    location: "Kigali",
    span: "normal",
  },
  {
    id: 10,
    type: "image",
    src: "/gallery/fleet-suv.jpg",
    category: "fleet",
    event: "Comfort SUV Fleet",
    description:
      "Our executive SUV lineup — the recommended choice for mountain routes and national park transfers.",
    date: "Sep 2024",
    location: "Kigali",
    span: "normal",
  },
  {
    id: 11,
    type: "video",
    src: "/gallery/nyungwe-canopy-walk.mp4",
    poster: "/nyungwe-hero-bg.jpg",
    category: "events",
    event: "Nyungwe Canopy Walk",
    description:
      "70 metres above the forest floor — the most spectacular trail in all of Rwanda.",
    date: "June 2025",
    location: "Nyungwe Forest",
    span: "normal",
  },
  {
    id: 12,
    type: "image",
    src: "/gallery/gorilla-trek-prep.jpg",
    category: "events",
    event: "Gorilla Trekking Prep",
    description:
      "Gearing up at the Volcanoes park gates — SURA delivers guests in comfort to the start line.",
    date: "March 2025",
    location: "Musanze",
    span: "normal",
  },
  {
    id: 13,
    type: "image",
    src: "/gallery/kigali-panorama.jpg",
    category: "city",
    event: "Kigali Panorama",
    description:
      "The City of a Thousand Hills — captured during a sunrise city tour from the heights.",
    date: "Aug 2024",
    location: "Kigali Heights",
    span: "wide",
  },
  {
    id: 14,
    type: "image",
    src: "/gallery/huye-museum.jpg",
    category: "nature",
    event: "Ethnographic Museum, Huye",
    description:
      "Rwanda's history and culture on display — a curated 3-hour transfer south from Kigali.",
    date: "Jul 2024",
    location: "Huye, Southern Rwanda",
    span: "normal",
  },
  {
    id: 15,
    type: "video",
    src: "/gallery/sura-fleet-showcase.mp4",
    poster: "/backgrounds/sura-experience.jpg",
    category: "fleet",
    event: "Fleet Showcase 2024",
    description:
      "A full walkthrough of the SURA fleet — sedans, SUVs, vans, and coaches.",
    date: "Jun 2024",
    location: "Kigali",
    span: "wide",
  },
];

/* ─────────────────────────────────────────────────────────
   SPAN → TAILWIND CLASS MAP
───────────────────────────────────────────────────────── */
const SPAN_CLASSES: Record<Span, string> = {
  normal:   "",
  wide:     "col-span-2",
  tall:     "row-span-2",
  featured: "col-span-2 row-span-2",
};

/* ─────────────────────────────────────────────────────────
   LIGHTBOX
───────────────────────────────────────────────────────── */
function Lightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
  onJump,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onJump: (i: number) => void;
}) {
  const item = items[index];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [direction, setDirection] = useState(1);

  // keyboard navigation
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")  { setDirection(-1); onPrev(); }
      if (e.key === "ArrowRight") { setDirection(1);  onNext(); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose, onPrev, onNext]);

  // lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // reset video when item changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setPlaying(false);
    }
  }, [index]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else         { videoRef.current.play();  setPlaying(true);  }
  };

  const handlePrev = () => { setDirection(-1); onPrev(); };
  const handleNext = () => { setDirection(1);  onNext(); };

  const slideVariants = {
    enter:  (d: number) => ({ x: d > 0 ?  "6%" : "-6%", opacity: 0 }),
    center: ()          => ({ x: 0,                       opacity: 1 }),
    exit:   (d: number) => ({ x: d < 0 ?  "6%" : "-6%", opacity: 0 }),
  };

  // adjacent thumbnails for the strip
  const stripItems = items.filter((_, i) => i !== index).slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[100] flex flex-col md:flex-row"
    >
      {/* blurred backdrop */}
      <div
        className="absolute inset-0 bg-[#0a0e1a]/97 backdrop-blur-2xl"
        onClick={onClose}
      />

      {/* ── Media pane ──────────────────────────────── */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden z-10 min-h-[50vh] md:min-h-0">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={item.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {item.type === "image" ? (
              <Image
                src={item.src}
                alt={item.event}
                fill
                priority
                className="object-contain"
                sizes="80vw"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={item.src}
                  poster={item.poster}
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-contain"
                />
                {/* big play button */}
                <AnimatePresence>
                  {!playing && (
                    <motion.button
                      key="play-btn"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1,   opacity: 1 }}
                      exit={{   scale: 0.8, opacity: 0 }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={togglePlay}
                      className="relative z-10 w-20 h-20 rounded-full bg-[#C97C2F]/90 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/10"
                    >
                      <Play size={28} className="text-white ml-1" />
                    </motion.button>
                  )}
                </AnimatePresence>
                {/* small pause button while playing */}
                {playing && (
                  <button
                    onClick={togglePlay}
                    className="absolute bottom-6 left-6 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors border border-white/10"
                  >
                    <Pause size={15} className="text-white" />
                  </button>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* nav arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#0a0e1a]/70 hover:bg-[#C97C2F] flex items-center justify-center transition-all border border-white/10 backdrop-blur-sm"
          aria-label="Previous"
        >
          <ChevronLeft size={18} className="text-white" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#0a0e1a]/70 hover:bg-[#C97C2F] flex items-center justify-center transition-all border border-white/10 backdrop-blur-sm"
          aria-label="Next"
        >
          <ChevronRight size={18} className="text-white" />
        </button>

        {/* counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[#0a0e1a]/70 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] font-bold text-white/50 tracking-widest">
          {index + 1} / {items.length}
        </div>
      </div>

      {/* ── Info panel ──────────────────────────────── */}
      <motion.aside
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0,  opacity: 1 }}
        exit={{   x: 60, opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full md:w-80 lg:w-96 bg-[#0f1420] border-t border-white/5 md:border-t-0 md:border-l md:border-white/5 flex flex-col p-7 md:p-8 shrink-0"
      >
        {/* header row */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#C97C2F]">
            {item.type === "video" ? "▶ VIDEO" : "◆ PHOTO"}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={15} className="text-white/60" />
          </button>
        </div>

        {/* animated caption */}
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{   opacity: 0, y: -8  }}
            transition={{ duration: 0.28 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-xl font-black text-white leading-tight tracking-tight mb-3">
              {item.event}
            </h2>
            <p className="text-sm text-white/45 font-medium leading-relaxed mb-8">
              {item.description}
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-white/5 flex items-center justify-center shrink-0">
                  <Calendar size={13} className="text-[#C97C2F]" />
                </div>
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  {item.date}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-white/5 flex items-center justify-center shrink-0">
                  <MapPin size={13} className="text-[#C97C2F]" />
                </div>
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  {item.location}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* thumbnail strip */}
        <div className="mt-auto pt-7 border-t border-white/5">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/20 mb-4">
            More Moments
          </p>
          <div className="flex gap-2">
            {stripItems.map((thumb, si) => {
              const realIdx = items.findIndex((x) => x.id === thumb.id);
              return (
                <button
                  key={thumb.id}
                  onClick={() => onJump(realIdx)}
                  className="relative w-16 h-11 rounded-sm overflow-hidden opacity-40 hover:opacity-100 transition-opacity border border-white/10 shrink-0"
                >
                  <Image
                    src={thumb.poster ?? thumb.src}
                    alt={thumb.event}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                  {thumb.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play size={10} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   GALLERY GRID ITEM
───────────────────────────────────────────────────────── */
function GridItem({
  item,
  index,
  onClick,
}: {
  item: GalleryItem;
  index: number;
  onClick: () => void;
}) {
  const thumbSrc = item.poster ?? item.src;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.93 }}
      transition={{
        duration: 0.38,
        delay: index * 0.035,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`relative group cursor-pointer overflow-hidden rounded-sm bg-[#1a2040] ${SPAN_CLASSES[item.span]}`}
      onClick={onClick}
    >
      {/* image */}
      <Image
        src={thumbSrc}
        alt={item.event}
        fill
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
        sizes="(max-width: 768px) 50vw, 33vw"
      />

      {/* subtle base tint */}
      <div className="absolute inset-0 bg-[#0a0e1a]/20 group-hover:bg-[#0a0e1a]/40 transition-colors duration-500" />

      {/* bottom gradient — slides up on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/90 via-[#0a0e1a]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* video badge */}
      {item.type === "video" && (
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#C97C2F] text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">
          <Film size={9} />
          <span>VIDEO</span>
        </div>
      )}

      {/* hover info */}
      <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none">
        <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-[#C97C2F] mb-1.5 block">
          {item.location}
        </span>
        <h3 className="text-base font-black text-white leading-tight tracking-tight mb-2">
          {item.event}
        </h3>
        <div className="flex items-center gap-1.5 text-[9px] text-white/50 font-bold uppercase tracking-wider">
          <Calendar size={9} className="text-white/40" />
          <span>{item.date}</span>
        </div>
      </div>

      {/* centre icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
        {item.type === "video" ? (
          <Play size={14} className="text-white ml-0.5" />
        ) : (
          <ZoomIn size={14} className="text-white" />
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const filtered =
    activeCategory === "all"
      ? ITEMS
      : ITEMS.filter((i) => i.category === activeCategory);

  const counts = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.id] =
        cat.id === "all"
          ? ITEMS.length
          : ITEMS.filter((i) => i.category === cat.id).length;
      return acc;
    },
    {} as Record<Category, number>
  );

  const openAt   = useCallback((item: GalleryItem) => {
    const idx = filtered.findIndex((i) => i.id === item.id);
    if (idx !== -1) setLightboxIdx(idx);
  }, [filtered]);

  const close    = useCallback(() => setLightboxIdx(null), []);
  const prev     = useCallback(() => setLightboxIdx((i) => i !== null ? (i - 1 + filtered.length) % filtered.length : null), [filtered.length]);
  const next     = useCallback(() => setLightboxIdx((i) => i !== null ? (i + 1) % filtered.length : null), [filtered.length]);
  const jump     = useCallback((i: number) => setLightboxIdx(i), []);

  return (
    <main className={`${manrope.variable} font-[family-name:var(--font-manrope)] min-h-screen bg-white`}>
      <Header />

      {/* ━━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative pt-[110px] pb-20 bg-[#0a0e1a] overflow-hidden">
        {/* ambient glows */}
        <div className="pointer-events-none absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-[#006cb7]/8 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/3  w-[350px] h-[350px] rounded-full bg-[#C97C2F]/7 blur-[90px]" />
        {/* grid texture from your other pages */}
        <div className="pointer-events-none absolute inset-0 bg-[url('/backgrounds/grid.png')] opacity-[0.04]" />

        <div className="max-w-[1600px] mx-auto px-6 md:px-10 relative z-10">
          <div className="grid lg:grid-cols-[1fr_auto] gap-16 items-center">

            {/* copy */}
            <div>
              <span className="inline-block text-[9px] font-bold uppercase tracking-[0.35em] text-[#C97C2F] mb-6 px-3 py-1.5 border border-[#C97C2F]/30 rounded-sm">
                Our Activities
              </span>
              <h1 className="text-6xl md:text-[90px] font-black text-white leading-[0.88] tracking-[-0.02em] mb-6">
                MOMENTS
                <br />
                <span className="text-[#006cb7]">CAPTURED.</span>
              </h1>
              <p className="text-sm text-white/40 font-medium leading-relaxed max-w-md mb-12">
                Every trip we run becomes a memory worth keeping. Browse the
                highlights — canopy walks, gorilla treks, city rides, and
                everything in between.
              </p>

              {/* stats */}
              <div className="flex items-end gap-10">
                {[
                  { value: `${ITEMS.length}+`, label: "Moments" },
                  { value: "12+",              label: "Trips"    },
                  { value: "8",                label: "Destinations" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-4xl font-black text-white leading-none">{value}</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30 mt-2">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* preview mosaic — tall left, two stacked right */}
            <div className="hidden lg:grid grid-cols-[1fr_1fr] gap-2 w-72 h-72 shrink-0">
              {/* left: tall */}
              <div className="relative row-span-2 rounded-sm overflow-hidden">
                <Image
                  src="/backgrounds/car-free-day.jpg"
                  alt="Car Free Day"
                  fill
                  className="object-cover"
                  sizes="144px"
                />
                <div className="absolute inset-0 bg-[#0a0e1a]/25" />
              </div>
              {/* right top */}
              <div className="relative rounded-sm overflow-hidden">
                <Image
                  src="/backgrounds/sura-experience.jpg"
                  alt="SURA Experience"
                  fill
                  className="object-cover"
                  sizes="144px"
                />
                <div className="absolute inset-0 bg-[#0a0e1a]/25" />
              </div>
              {/* right bottom */}
              <div className="relative rounded-sm overflow-hidden">
                <Image
                  src="/nyungwe-hero-bg.jpg"
                  alt="Nyungwe"
                  fill
                  className="object-cover"
                  sizes="144px"
                />
                <div className="absolute inset-0 bg-[#0a0e1a]/25" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━ FILTER BAR ━━━━━━━━━━━━━━━━━━━ */}
      <div className="sticky top-[100px] z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 md:px-10">
          <div
            className="flex items-center gap-1 py-3 overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-sm text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-200 ${
                    active
                      ? "bg-[#0a0e1a] text-white"
                      : "text-gray-400 hover:text-[#0a0e1a] hover:bg-gray-50"
                  }`}
                >
                  {cat.label}
                  <span
                    className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-[9px] font-black transition-colors ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {counts[cat.id]}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━ GALLERY GRID ━━━━━━━━━━━━━━━━━ */}
      <section className="py-6 bg-[#f3f4f6]">
        <div className="max-w-[1600px] mx-auto px-3 md:px-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3"
              style={{ gridAutoRows: "240px", gridAutoFlow: "dense" }}
            >
              {filtered.map((item, idx) => (
                <GridItem
                  key={item.id}
                  item={item}
                  index={idx}
                  onClick={() => openAt(item)}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="py-40 text-center">
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                No moments in this category yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━ CTA BANNER ━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-[#006cb7] py-14">
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 mb-2 block">
              Join the next one
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
              Your next memory starts<br className="hidden md:block" /> with one booking.
            </h2>
          </div>
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href="https://wa.me/250788564000?text=Hello!%20I%20would%20like%20to%20book%20an%20upcoming%20trip."
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 h-13 px-8 py-4 bg-white text-[#006cb7] flex items-center gap-3 text-[11px] font-black uppercase tracking-widest rounded-sm shadow-xl hover:bg-[#0a0e1a] hover:text-white transition-colors"
          >
            Book via WhatsApp
            <ChevronRight size={15} />
          </motion.a>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━ LIGHTBOX ━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox
            items={filtered}
            index={lightboxIdx}
            onClose={close}
            onPrev={prev}
            onNext={next}
            onJump={jump}
          />
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}