"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { Manrope } from "next/font/google";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  ArrowRight,
  Maximize2,
  Images,
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

interface MediaItem {
  id: string;
  type: MediaType;
  src: string;
  poster?: string;
  caption: string;
}

interface Trip {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  date: string;
  location: string;
  status: "upcoming" | "past";
  cover: string;
  /** Shown on the main gallery strip (cover is always first) */
  preview: MediaItem[];
  /** Full set for the experience modal */
  all: MediaItem[];
}

/* ─────────────────────────────────────────────────────────
   DATA — exact files from public/activities/
───────────────────────────────────────────────────────── */
const TRIPS: Trip[] = [
  {
    id: "akagera",
    title: "Akagera National Park Experience",
    shortTitle: "Akagera",
    subtitle: "Wildlife Game Drive • Bicaca Bush Feast • Scenic Savanna",
    date: "22 August 2026",
    location: "Eastern Province, Rwanda",
    status: "upcoming",
    cover: "/activities/akagera/cover.jpg",
    preview: [
      { id: "ak-c", type: "image", src: "/activities/akagera/cover.jpg", caption: "Akagera National Park" },
      { id: "ak-p1", type: "image", src: "/activities/akagera/akagera-park.jpg", caption: "Park landscape" },
      { id: "ak-p2", type: "image", src: "/activities/akagera/1.jpg", caption: "On the track" },
      { id: "ak-v1", type: "video", src: "/activities/akagera/v1.mp4", poster: "/activities/akagera/2.jpg", caption: "Game drive" },
      { id: "ak-v2", type: "video", src: "/activities/akagera/v2.mp4", poster: "/activities/akagera/3.jpg", caption: "Bush moments" },
    ],
    all: [
      { id: "ak-c", type: "image", src: "/activities/akagera/cover.jpg", caption: "Akagera National Park" },
      { id: "ak-p0", type: "image", src: "/activities/akagera/akagera-park.jpg", caption: "Park landscape" },
      { id: "ak-p1", type: "image", src: "/activities/akagera/1.jpg", caption: "Wildlife game drive" },
      { id: "ak-p2", type: "image", src: "/activities/akagera/2.jpg", caption: "Safari track" },
      { id: "ak-p3", type: "image", src: "/activities/akagera/3.jpg", caption: "Scenic views" },
      { id: "ak-p4", type: "image", src: "/activities/akagera/4.jpg", caption: "Savanna horizon" },
      { id: "ak-v1", type: "video", src: "/activities/akagera/v1.mp4", poster: "/activities/akagera/2.jpg", caption: "Game drive highlights" },
      { id: "ak-v2", type: "video", src: "/activities/akagera/v2.mp4", poster: "/activities/akagera/3.jpg", caption: "Bush feast" },
      { id: "ak-v3", type: "video", src: "/activities/akagera/v3.mp4", poster: "/activities/akagera/1.jpg", caption: "Park arrival" },
      { id: "ak-v4", type: "video", src: "/activities/akagera/v4.mp4", poster: "/activities/akagera/4.jpg", caption: "Savanna sunset" },
    ],
  },
  {
    id: "bigogwe",
    title: "Discover Bigogwe",
    shortTitle: "Bigogwe",
    subtitle: "Green Hills • Cattle Culture • Highland Experience",
    date: "28–29 March 2026",
    location: "Western Highlands, Rwanda",
    status: "past",
    cover: "/activities/bigogwe/cover.jpg",
    preview: [
      { id: "bg-c", type: "image", src: "/activities/bigogwe/cover.jpg", caption: "Bigogwe highlands" },
      { id: "bg-p1", type: "image", src: "/activities/bigogwe/bigogwe_march.jpg", caption: "March expedition" },
      { id: "bg-p2", type: "image", src: "/activities/bigogwe/1.jpg", caption: "Cattle culture" },
      { id: "bg-v1", type: "video", src: "/activities/bigogwe/v1.MOV", poster: "/activities/bigogwe/2.jpg", caption: "Arrival" },
      { id: "bg-v2", type: "video", src: "/activities/bigogwe/v2.MOV", poster: "/activities/bigogwe/3.jpg", caption: "Highland walk" },
    ],
    all: [
      { id: "bg-c", type: "image", src: "/activities/bigogwe/cover.jpg", caption: "Bigogwe highlands" },
      { id: "bg-p0", type: "image", src: "/activities/bigogwe/bigogwe_march.jpg", caption: "March expedition" },
      { id: "bg-p1", type: "image", src: "/activities/bigogwe/1.jpg", caption: "Cattle culture" },
      { id: "bg-p2", type: "image", src: "/activities/bigogwe/2.jpg", caption: "Green hills" },
      { id: "bg-p3", type: "image", src: "/activities/bigogwe/3.jpg", caption: "Community life" },
      { id: "bg-p4", type: "image", src: "/activities/bigogwe/4.jpg", caption: "Highland paths" },
      { id: "bg-v1", type: "video", src: "/activities/bigogwe/v1.MOV", poster: "/activities/bigogwe/2.jpg", caption: "Arrival in Bigogwe" },
      { id: "bg-v2", type: "video", src: "/activities/bigogwe/v2.MOV", poster: "/activities/bigogwe/3.jpg", caption: "Cattle culture walk" },
      { id: "bg-v3", type: "video", src: "/activities/bigogwe/v3.MOV", poster: "/activities/bigogwe/1.jpg", caption: "Highland trails" },
      { id: "bg-v4", type: "video", src: "/activities/bigogwe/v4.MOV", poster: "/activities/bigogwe/4.jpg", caption: "Community moments" },
    ],
  },
  {
    id: "nyungwe",
    title: "Nyungwe Forest Escape",
    shortTitle: "Nyungwe",
    subtitle: "Waterfall Trail • Canopy Walk & Zipline • King's Palace",
    date: "20 June 2026",
    location: "Southern Province, Rwanda",
    status: "past",
    cover: "/activities/nyungwe/cover.jpg",
    preview: [
      { id: "ny-c", type: "image", src: "/activities/nyungwe/cover.jpg", caption: "Nyungwe canopy" },
      { id: "ny-p1", type: "image", src: "/activities/nyungwe/aerial-view.jpg", caption: "Aerial view" },
      { id: "ny-p2", type: "image", src: "/activities/nyungwe/nyungwe-activity.jpg", caption: "On the trail" },
      { id: "ny-v1", type: "video", src: "/activities/nyungwe/v1.MP4", poster: "/activities/nyungwe/nyungwe_sky.jpg", caption: "Canopy walk" },
      { id: "ny-v2", type: "video", src: "/activities/nyungwe/v2.MP4", poster: "/activities/nyungwe/1.jpg", caption: "Forest moments" },
    ],
    all: [
      { id: "ny-c", type: "image", src: "/activities/nyungwe/cover.jpg", caption: "Nyungwe canopy" },
      { id: "ny-p0", type: "image", src: "/activities/nyungwe/nyungwe_sky.jpg", caption: "Forest sky" },
      { id: "ny-p1", type: "image", src: "/activities/nyungwe/aerial-view.jpg", caption: "Aerial view" },
      { id: "ny-p2", type: "image", src: "/activities/nyungwe/nyungwe-activity.jpg", caption: "On the trail" },
      { id: "ny-p3", type: "image", src: "/activities/nyungwe/1.jpg", caption: "Canopy walkway" },
      { id: "ny-p4", type: "image", src: "/activities/nyungwe/2.jpg", caption: "Waterfall trail" },
      { id: "ny-p5", type: "image", src: "/activities/nyungwe/3.jpg", caption: "Forest floor" },
      { id: "ny-p6", type: "image", src: "/activities/nyungwe/4.jpg", caption: "Deep forest" },
      { id: "ny-v1", type: "video", src: "/activities/nyungwe/v1.MP4", poster: "/activities/nyungwe/nyungwe_sky.jpg", caption: "Canopy walk" },
      { id: "ny-v2", type: "video", src: "/activities/nyungwe/v2.MP4", poster: "/activities/nyungwe/1.jpg", caption: "Waterfall approach" },
      { id: "ny-v3", type: "video", src: "/activities/nyungwe/v3.MP4", poster: "/activities/nyungwe/2.jpg", caption: "Forest drive" },
      { id: "ny-v4", type: "video", src: "/activities/nyungwe/v4.MP4", poster: "/activities/nyungwe/3.jpg", caption: "Zipline & trails" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────
   MEDIA TILE (shared)
───────────────────────────────────────────────────────── */
function MediaTile({
  item,
  featured,
  onClick,
}: {
  item: MediaItem;
  featured?: boolean;
  onClick: () => void;
}) {
  const isVideo = item.type === "video";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative group overflow-hidden rounded-sm bg-[#1a2040] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C97C2F] ${
        featured
          ? "col-span-2 row-span-2 min-h-[240px] sm:min-h-[300px]"
          : "min-h-[130px] sm:min-h-[150px]"
      }`}
    >
      <Image
        src={item.poster ?? item.src}
        alt={item.caption}
        fill
        className={`object-cover transition-transform duration-700 group-hover:scale-105 ${
          isVideo ? "brightness-[0.5] saturate-75" : ""
        }`}
        sizes={featured ? "(max-width:768px) 100vw, 50vw" : "25vw"}
      />

      {isVideo ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
      ) : (
        <div className="absolute inset-0 bg-black/15 group-hover:bg-black/40 transition-colors duration-400" />
      )}

      {isVideo && (
        <>
          <span className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-[#C97C2F] text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm">
            <Film size={9} /> Video
          </span>
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <span className="w-11 h-11 rounded-full bg-[#C97C2F] border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play size={16} className="text-white ml-0.5" />
            </span>
          </div>
        </>
      )}

      {!isVideo && (
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
            <ZoomIn size={15} className="text-white" />
          </span>
        </div>
      )}

      <div
        className={`absolute bottom-0 inset-x-0 p-3 z-10 ${
          isVideo ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        } transition-opacity`}
      >
        <p className="text-[11px] font-bold text-white line-clamp-1 drop-shadow">
          {item.caption}
        </p>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   LIGHTBOX (single media)
───────────────────────────────────────────────────────── */
function Lightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  items: MediaItem[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[index];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        setDirection(-1);
        onPrev();
      }
      if (e.key === "ArrowRight") {
        setDirection(1);
        onNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setVideoError(false);
    setPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [index]);

  const togglePlay = () => {
    if (!videoRef.current || videoError) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play().catch(() => setVideoError(true));
      setPlaying(true);
    }
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "6%" : "-6%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? "6%" : "-6%", opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
        aria-label="Close"
      >
        <X size={18} className="text-white" />
      </button>
      <button
        onClick={() => {
          setDirection(-1);
          onPrev();
        }}
        className="absolute left-3 sm:left-5 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-[#C97C2F] flex items-center justify-center"
        aria-label="Previous"
      >
        <ChevronLeft size={20} className="text-white" />
      </button>
      <button
        onClick={() => {
          setDirection(1);
          onNext();
        }}
        className="absolute right-3 sm:right-5 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-[#C97C2F] flex items-center justify-center"
        aria-label="Next"
      >
        <ChevronRight size={20} className="text-white" />
      </button>

      <div className="relative z-10 w-full max-w-5xl px-14 sm:px-20">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={item.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[16/10] w-full bg-[#0d0d0d] rounded-sm overflow-hidden"
          >
            {item.type === "image" ? (
              <Image src={item.src} alt={item.caption} fill className="object-contain" sizes="90vw" priority />
            ) : videoError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40 px-6">
                <Film size={28} />
                <p className="text-sm">Could not play this video</p>
                <p className="text-[10px] font-mono text-white/25 break-all text-center">{item.src}</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={item.src}
                  poster={item.poster}
                  loop
                  playsInline
                  preload="metadata"
                  onError={() => setVideoError(true)}
                  className="absolute inset-0 w-full h-full object-contain"
                />
                {!playing && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#C97C2F] flex items-center justify-center shadow-xl"
                  >
                    <Play size={24} className="text-white ml-1" />
                  </button>
                )}
                {playing && (
                  <button
                    onClick={togglePlay}
                    className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
                  >
                    <Pause size={16} className="text-white" />
                  </button>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mt-3 flex justify-between text-white/55 text-sm">
          <span>{item.caption}</span>
          <span className="text-[11px] font-bold tracking-widest">
            {index + 1} / {items.length}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   EXPERIENCE MODAL — half-screen creative panel
───────────────────────────────────────────────────────── */
function ExperienceModal({
  trip,
  onClose,
  onOpenMedia,
}: {
  trip: Trip;
  onClose: () => void;
  onOpenMedia: (items: MediaItem[], index: number) => void;
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const photoCount = trip.all.filter((m) => m.type === "image").length;
  const videoCount = trip.all.filter((m) => m.type === "video").length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#0a0e1a]/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel — slides up on mobile, scales on desktop */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`trip-modal-${trip.id}`}
        initial={
          reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 40, scale: 0.98 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={
          reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 24, scale: 0.98 }
        }
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="relative z-10 w-full sm:max-w-3xl lg:max-w-4xl max-h-[92vh] sm:max-h-[85vh] bg-white rounded-t-2xl sm:rounded-sm shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Cover band */}
        <div className="relative h-40 sm:h-48 shrink-0">
          <Image
            src={trip.cover}
            alt={trip.title}
            fill
            className="object-cover"
            sizes="800px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={16} className="text-white" />
          </button>
          <div className="absolute bottom-4 left-5 right-5">
            <span
              className={`inline-block text-[9px] font-black uppercase tracking-[0.18em] px-2 py-0.5 rounded-sm mb-2 ${
                trip.status === "upcoming"
                  ? "bg-[#C97C2F] text-white"
                  : "bg-white/20 text-white"
              }`}
            >
              {trip.status === "upcoming" ? "Upcoming" : "Past Experience"}
            </span>
            <h2
              id={`trip-modal-${trip.id}`}
              className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-tight"
            >
              {trip.title}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 sm:px-7 pt-5 pb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} className="text-[#C97C2F]" />
              {trip.date}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-[#84BD00]" />
              {trip.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Images size={12} className="text-[#006cb7]" />
              {photoCount} photos · {videoCount} videos
            </span>
          </div>

          <p className="px-5 sm:px-7 text-sm text-gray-500 font-medium mb-5">
            {trip.subtitle}
          </p>

          {/* Full media grid */}
          <div className="px-4 sm:px-6 pb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {trip.all.map((item, idx) => (
                <MediaTile
                  key={item.id}
                  item={item}
                  featured={idx === 0}
                  onClick={() => onOpenMedia(trip.all, idx)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer strip */}
        <div className="shrink-0 border-t border-gray-100 px-5 sm:px-7 py-4 flex items-center justify-between gap-4 bg-gray-50/80">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden sm:block">
            Tap any media to expand
          </p>
          <button
            onClick={onClose}
            className="ml-auto text-[11px] font-black uppercase tracking-widest text-[#006cb7] hover:text-[#0a0e1a] transition-colors flex items-center gap-1.5"
          >
            Close
            <X size={13} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   TRIP SECTION (preview only)
───────────────────────────────────────────────────────── */
function TripSection({
  trip,
  onOpenPreview,
  onOpenExperience,
}: {
  trip: Trip;
  onOpenPreview: (items: MediaItem[], index: number) => void;
  onOpenExperience: () => void;
}) {
  return (
    <section className="border-b border-gray-100 last:border-b-0">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-sm ${
                  trip.status === "upcoming"
                    ? "bg-[#C97C2F] text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {trip.status === "upcoming" ? "Upcoming" : "Past Experience"}
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={11} />
                {trip.date}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0a0e1a] uppercase tracking-tight leading-tight mb-2">
              {trip.title}
            </h2>
            <p className="text-sm text-gray-500 font-medium max-w-lg mb-2">
              {trip.subtitle}
            </p>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={12} className="text-[#84BD00]" />
              {trip.location}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenExperience}
            className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white bg-[#006cb7] hover:bg-[#0a0e1a] px-5 py-3 rounded-sm transition-colors group shrink-0"
          >
            <Maximize2 size={14} />
            View full experience
            <ArrowRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        </div>

        {/* Preview: cover + 2 photos + 2 videos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {trip.preview.map((item, idx) => (
            <MediaTile
              key={item.id}
              item={item}
              featured={idx === 0}
              onClick={() => onOpenPreview(trip.preview, idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function GalleryPage() {
  const [lightbox, setLightbox] = useState<{
    items: MediaItem[];
    index: number;
  } | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);

  const activeTrip = useMemo(
    () => TRIPS.find((t) => t.id === activeTripId) ?? null,
    [activeTripId]
  );

  const totalMedia = useMemo(
    () => TRIPS.reduce((sum, t) => sum + t.all.length, 0),
    []
  );

  const openLightbox = useCallback((items: MediaItem[], index: number) => {
    setLightbox({ items, index });
  }, []);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  const prev = useCallback(() => {
    setLightbox((curr) => {
      if (!curr) return null;
      return {
        ...curr,
        index: (curr.index - 1 + curr.items.length) % curr.items.length,
      };
    });
  }, []);

  const next = useCallback(() => {
    setLightbox((curr) => {
      if (!curr) return null;
      return {
        ...curr,
        index: (curr.index + 1) % curr.items.length,
      };
    });
  }, []);

  return (
    <main
      className={`${manrope.variable} font-[family-name:var(--font-manrope)] min-h-screen bg-white`}
    >
      <Header />

      {/* Hero */}
      <section className="relative pt-[110px] pb-16 sm:pb-20 overflow-hidden min-h-[400px] sm:min-h-[460px] flex items-end">
        <div className="absolute inset-0 z-0">
          <Image
            src="/nyungwe-hero-bg.jpg"
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/70 to-[#0a0e1a]/35" />
        </div>

        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 relative z-10 w-full">
          <span className="inline-block text-[9px] font-bold uppercase tracking-[0.35em] text-[#C97C2F] mb-5 px-3 py-1.5 border border-[#C97C2F]/40 bg-black/30 backdrop-blur-sm rounded-sm">
            Gallery
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.92] tracking-tight mb-4 drop-shadow-lg">
            TRIPS WE
            <br />
            <span className="text-[#84BD00]">LIVED.</span>
          </h1>
          <p className="text-sm text-white/70 font-medium max-w-md leading-relaxed mb-10">
            Akagera, Bigogwe, and Nyungwe — the journeys we ran together.
          </p>
          <div className="flex gap-10">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white leading-none">
                {TRIPS.length}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/45 mt-1.5">
                Experiences
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white leading-none">
                {totalMedia}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/45 mt-1.5">
                Moments
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trip previews */}
      <div className="bg-white">
        {TRIPS.map((trip) => (
          <TripSection
            key={trip.id}
            trip={trip}
            onOpenPreview={openLightbox}
            onOpenExperience={() => setActiveTripId(trip.id)}
          />
        ))}
      </div>

      {/* CTA */}
      <section className="bg-[#006cb7] py-12 sm:py-14">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 mb-2 block">
              Next chapter
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
              Be part of the next Sura experience.
            </h2>
          </div>
          <a
            href="https://wa.me/250788564000?text=Hello!%20I%20would%20like%20to%20join%20an%20upcoming%20Sura%20experience."
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-7 py-3.5 bg-white text-[#006cb7] flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest rounded-sm hover:bg-[#0a0e1a] hover:text-white transition-colors"
          >
            Book via WhatsApp
            <ArrowRight size={14} />
          </a>
        </div>
      </section>

      {/* Experience modal */}
      <AnimatePresence>
        {activeTrip && (
          <ExperienceModal
            trip={activeTrip}
            onClose={() => setActiveTripId(null)}
            onOpenMedia={(items, index) => {
              // Keep modal open underneath; lightbox stacks above
              openLightbox(items, index);
            }}
          />
        )}
      </AnimatePresence>

      {/* Lightbox on top of everything */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            items={lightbox.items}
            index={lightbox.index}
            onClose={closeLightbox}
            onPrev={prev}
            onNext={next}
          />
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
