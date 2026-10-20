"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Clock, MapPin, Users, Info, Landmark, CalendarDays,
  ChevronLeft, ChevronRight, Camera, X, Phone, Zap, Minus, Plus, Car,
  Sun, CloudRain, Moon, Timer, AlertTriangle, CheckCircle2, Baby,
  type LucideIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { optimizedBg } from "@/lib/optimized-bg";
import { useSolidHeader } from "@/components/site-chrome";
import { VEHICLES } from "@/lib/pricing";
import { kigaliToday } from "@/lib/bookings";
import { OPENWEATHER_KEY } from "@/lib/weather";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { LeadMagnet } from "@/components/lead-magnet";

// WEATHER API CONFIGURATION
const API_KEY = OPENWEATHER_KEY;
const CITY = "Kigali";

/**
 * Collections and venues live in messages/en.json + messages/fr.json
 * (namespace "Tours"). Add a collection or a venue by editing those
 * two files — the images, ids and icon names must match in both.
 */
const HERO_IMAGE = "/marketing/kigali-skyline-night.jpg";

// Book buttons open the booking form on a city tour with a driver (every venue
// here is in Kigali). URL parameters: see readPreset() in booking-form.tsx.
const TOUR_HREF = "/book?tab=city&serviceType=city_tour&driver=with";
const MAX_GUESTS = 40;

/** What the visitor picked in the planner bar; every Book button carries it. */
interface TripPlan { date: string; guests: number }

/** The smallest of SUV, van and coach that seats the group. */
function vehicleFor(guests: number): string {
  const fit = ["suv", "van", "bus"].find((id) => (VEHICLES.find((v) => v.id === id)?.maxPassengers ?? 0) >= guests);
  return fit ?? "bus";
}

function bookHref(plan: TripPlan, tourId?: string): string {
  let href = `${TOUR_HREF}&vehicle=${vehicleFor(plan.guests)}&passengers=${plan.guests}`;
  if (plan.date) href += `&date=${plan.date}`;
  if (tourId) href += `&tour=${tourId}`;
  return href;
}
const WHATSAPP_URL = "https://wa.me/250788564000";

interface Facts {
  duration: string;
  groupSize: string;
  minAge: string;
  bestTime: string;
  driveTime: string;
  outdoor: boolean;
}

interface Venue {
  id: string;
  image: string;
  gallery: string[];
  /** Entry fee in USD. 0 means free; priceType says whether donations are invited. */
  price: number;
  priceType?: "free" | "donation";
  title: string;
  location: string;
  tag: string;
  /** A place of remembrance: shows the etiquette note. */
  memorial?: boolean;
  summary: string;
  history: string[];
  visitorNote: string;
  highlights: string[];
  facts: Facts;
}

interface Collection {
  id: string;
  category: string;
  intro: { image: string; title: string; headline: string; desc: string[] };
  venues: Venue[];
}

/**
 * Date and group size for the visit. Both feed every Book button, so /book
 * opens with the tour, date, passengers and a car that fits the group.
 */
function TripPlanner({ plan, onChange, stacked = false, className = "" }: { plan: TripPlan; onChange: (p: TripPlan) => void; stacked?: boolean; className?: string }) {
  const t = useTranslations("Tours.planner");
  const setGuests = (n: number) => onChange({ ...plan, guests: Math.min(MAX_GUESTS, Math.max(1, n)) });

  return (
    <div className={`bg-card rounded-2xl ring-1 ring-black/5 shadow-2xl shadow-black/10 p-5 md:p-6 ${className}`}>
      <div className={stacked ? "flex flex-col gap-4" : "flex flex-col md:flex-row md:items-end gap-4 md:gap-6"}>
        <div className={stacked ? "" : "md:w-56 shrink-0"}>
          <p className="text-sm font-extrabold tracking-tight text-foreground">{t("title")}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-snug">{t("hint")}</p>
        </div>
        <label className="flex-1 min-w-0">
          <span className="block text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-2">{t("date")}</span>
          <span className="relative block">
            <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
            <input
              type="date"
              value={plan.date}
              min={kigaliToday()}
              onChange={(e) => onChange({ ...plan, date: e.target.value })}
              className="w-full h-14 pl-11 pr-3 rounded-xl bg-background ring-1 ring-black/5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </span>
        </label>
        <div className="flex-1 min-w-0">
          <span className="block text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-2">{t("guests")}</span>
          <div className="h-14 flex items-center justify-between rounded-xl bg-background ring-1 ring-black/5 px-1">
            <button type="button" onClick={() => setGuests(plan.guests - 1)} disabled={plan.guests <= 1} aria-label={t("fewer")} className="w-12 h-12 rounded-lg bg-card shadow-sm flex items-center justify-center text-foreground disabled:opacity-30">
              <Minus className="w-4 h-4" />
            </button>
            <span className="flex items-center gap-2 text-sm font-bold text-foreground tabular-nums" aria-live="polite">
              <Users className="w-4 h-4 text-primary" /> {t("guestsCount", { count: plan.guests })}
            </span>
            <button type="button" onClick={() => setGuests(plan.guests + 1)} disabled={plan.guests >= MAX_GUESTS} aria-label={t("more")} className="w-12 h-12 rounded-lg bg-card shadow-sm flex items-center justify-center text-foreground disabled:opacity-30">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** "$15", or "Free entry" / "Free entry, donations welcome" when there's no fee. */
function usePriceLabel() {
  const t = useTranslations("Tours.labels");
  const format = useFormatter();
  return (v: Venue) =>
    v.price > 0
      ? format.number(v.price, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
      : t(v.priceType === "donation" ? "donation" : "free");
}

/**
 * One tour card, used by the landing grid and the collection grid. The photo
 * sits in a fixed aspect-ratio frame, so cards keep their size while images
 * load. The card opens the venue; "Book now" goes straight to /book with the
 * tour, date and group size pre-filled.
 */
function VenueCard({ venue, collectionId, plan, detailed, onTap }: { venue: Venue; collectionId: string; plan: TripPlan; detailed?: boolean; onTap: () => void }) {
  const t = useTranslations("Tours");
  const priceLabel = usePriceLabel();
  const venueHref = `/tours?category=${collectionId}&venue=${venue.id}`;

  return (
    <div className="group relative flex flex-col h-full bg-card rounded-2xl overflow-hidden ring-1 ring-black/5 shadow-xl shadow-black/5 hover:shadow-2xl transition-shadow duration-300">
      <Link href={venueHref} onClick={onTap} className="flex flex-col flex-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted/70">
          <Image src={venue.image} alt={venue.title} fill sizes="(min-width: 1280px) 30rem, (min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-extrabold uppercase tracking-widest text-primary">{venue.tag}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
            <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-white">
              <span className="flex items-center gap-1.5 text-xs font-bold"><Clock size={13} /> {venue.facts.duration}</span>
              <span className="flex items-center gap-1.5 text-xs font-bold"><MapPin size={13} /> {venue.location}</span>
            </div>
          </div>
        </div>
        <div className="p-6 md:p-8 pb-0 md:pb-0 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight leading-tight">{venue.title}</h3>
            <span className="shrink-0 text-sm font-extrabold text-primary tabular-nums">{venue.price > 0 ? priceLabel(venue) : null}</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">{venue.summary}</p>
          {detailed && (
            <ul className="mt-5 space-y-2">
              {venue.highlights.slice(0, 3).map((h) => (
                <li key={h} className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> {h}
                </li>
              ))}
            </ul>
          )}
          {venue.price === 0 && <p className="mt-4 text-xs font-extrabold text-primary">{priceLabel(venue)}</p>}
        </div>
      </Link>

      <div className="mt-auto p-6 md:p-8 pt-6 md:pt-6 grid grid-cols-2 gap-3">
        <Link href={venueHref} onClick={onTap} className="h-12 rounded-xl bg-muted/40 ring-1 ring-black/5 hover:bg-muted/70 flex items-center justify-center px-3 transition-colors">
          <span className="text-xs font-extrabold text-foreground uppercase tracking-wide truncate">{t("exploreVenue")}</span>
        </Link>
        <Link href={bookHref(plan, venue.id)} onClick={onTap} className="h-12 rounded-xl bg-primary hover:bg-primary-hover flex items-center justify-center gap-2 px-3 transition-colors">
          <span className="text-xs font-extrabold text-white uppercase tracking-wide truncate">{t("bookNow")}</span>
          <ArrowRight size={14} className="text-white shrink-0" />
        </Link>
      </div>
    </div>
  );
}

function ToursContent() {
  const t = useTranslations("Tours");
  const ts = useTranslations("Tours.status");
  const tg = useTranslations("Tours.gallery");
  const tl = useTranslations("Tours.labels");
  const priceLabel = usePriceLabel();
  const collections = t.raw("collections") as Collection[];

  const router = useRouter();
  const searchParams = useSearchParams();

  // The open collection / venue comes straight from the URL. Deriving it during
  // render (instead of copying it into state from an effect) means a link such
  // as /tours?venue=gisozi paints the venue on the first frame, rather than
  // painting the landing page and then jumping to the venue.
  const venueId = searchParams.get("venue");
  const catId = searchParams.get("category");
  const { activeCategory, activeVenue } = ((): { activeCategory: Collection | null; activeVenue: Venue | null } => {
    if (venueId) {
      for (const collection of collections) {
        const venue = collection.venues.find((v) => v.id === venueId);
        if (venue) return { activeCategory: collection, activeVenue: venue };
      }
    } else if (catId) {
      const collection = collections.find((c) => c.id === catId);
      if (collection) return { activeCategory: collection, activeVenue: null };
    }
    return { activeCategory: null, activeVenue: null };
  })();
  const [plan, setPlan] = useState<TripPlan>({ date: "", guests: 1 });
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [showTopBtn, setShowTopBtn] = useState(false);

  // A venue or collection page opens on cream, where the transparent header's
  // white logo and links would vanish.
  useSolidHeader(Boolean(activeVenue || activeCategory));
  useScrollLock(isGalleryOpen && Boolean(activeVenue));

  const [kigaliTime, setKigaliTime] = useState("");
  const [weatherStatus, setWeatherStatus] = useState<{ temp: number; condition: string } | null>(null);

  useEffect(() => {
    async function fetchLiveIntel() {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`);
        const data = await res.json();
        if (res.ok) {
           setWeatherStatus({ temp: Math.round(data.main.temp), condition: data.weather[0].main });
        }
      } catch (e) { setWeatherStatus({ temp: 24, condition: "Clear" }); }
    }
    fetchLiveIntel();
    const interval = setInterval(fetchLiveIntel, 600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setKigaliTime(new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Kigali', hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date()));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const triggerHaptic = () => { if (typeof window !== "undefined" && window.navigator.vibrate) window.navigator.vibrate(10); };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) setShowTopBtn(true);
      else setShowTopBtn(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const missionStatus = useMemo((): { label: string; icon: LucideIcon; color: string } => {
    const hour = parseInt(kigaliTime.split(":")[0]);
    if (isNaN(hour)) return { label: ts("syncing"), icon: Timer, color: "text-muted-foreground" };
    if (hour >= 17 && hour < 18) return { label: ts("goldenHour"), icon: Sun, color: "text-secondary" };
    if (hour >= 18 || hour < 5) return { label: ts("night"), icon: Moon, color: "text-secondary" };
    return { label: ts("optimal"), icon: Zap, color: "text-primary" };
  }, [kigaliTime, ts]);

  const handleBack = () => {
    triggerHaptic();
    if (activeVenue && activeCategory) {
      router.push(`/tours?category=${activeCategory.id}`);
    } else {
      router.push("/tours");
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeVenue) setCurrentGalleryIndex((p) => (p + 1) % activeVenue.gallery.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeVenue) setCurrentGalleryIndex((p) => (p - 1 + activeVenue.gallery.length) % activeVenue.gallery.length);
  };

  return (
    <div className={`min-h-screen bg-background text-foreground relative selection:bg-primary/20`}>
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--foreground) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.08 }}></div>

      <div className="relative z-10">
        {(activeCategory || activeVenue) && (
            <div className="fixed top-[calc(var(--header-h)+1rem)] left-6 z-40">
                <button type="button" onClick={handleBack} aria-label={t("back")} className="flex items-center justify-center w-14 h-14 rounded-2xl bg-card text-foreground hover:bg-foreground hover:text-white shadow-xl border border-border transition-all">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>
        )}

        {activeVenue ? (
            <div className="pt-[calc(var(--header-h)+4rem)] pb-24 md:pb-32 max-w-[1400px] mx-auto px-6 md:px-10 relative z-10 flex flex-col gap-12 md:gap-16">
                {/* Every slot in this bar is always rendered (with a placeholder until the
                    clock and weather arrive), so the bar never changes size after paint. */}
                <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-foreground p-6 border-b-4 border-primary shadow-2xl min-h-[5.5rem]">
                    <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-xs font-extrabold text-white/60 uppercase tracking-widest">{t("systemLive")}</span>
                    </div>
                    <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-xl font-extrabold text-white tabular-nums min-w-[3.5rem]">{kigaliTime || "--:--"} <span className="text-xs text-white/60 ml-1 uppercase">{t("timezone")}</span></span>
                    </div>
                    <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                        <missionStatus.icon className={`w-4 h-4 ${missionStatus.color}`} />
                        <span className="text-xs font-extrabold text-white uppercase tracking-widest">{missionStatus.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CloudRain className="w-4 h-4 text-secondary" />
                        <span className="text-xs font-extrabold text-white uppercase tracking-widest">{weatherStatus ? `${weatherStatus.temp}°C • ${weatherStatus.condition}` : "--°C"}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl border border-border bg-card shadow-2xl h-[360px] md:h-[500px] overflow-hidden">
                    <div className="lg:col-span-8 bg-muted/70 relative group cursor-pointer z-20" onClick={() => { setIsGalleryOpen(true); setCurrentGalleryIndex(0); triggerHaptic(); }}>
                        <Image src={activeVenue.gallery[0]} alt={activeVenue.title} fill priority sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover" />
                        {/* The rain warning arrives with the weather, after paint, so it floats
                            over the photo instead of pushing the page down. */}
                        {weatherStatus?.condition === "Rain" && activeVenue.facts.outdoor && (
                          <div className="absolute top-4 left-4 right-4 md:right-auto md:max-w-md z-30 bg-white/95 backdrop-blur-md border-2 border-destructive p-5 flex items-center gap-4 shadow-2xl pointer-events-none">
                            <AlertTriangle className="w-8 h-8 text-destructive shrink-0" />
                            <div>
                              <h4 className="text-destructive font-extrabold uppercase tracking-widest text-sm">{t("rain.title")}</h4>
                              <p className="text-destructive/70 font-bold uppercase text-xs tracking-widest mt-1">{t("rain.text")}</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 bg-foreground text-white px-8 py-4 z-30 pointer-events-none">
                            <span className="text-xs font-extrabold uppercase tracking-widest">{activeVenue.tag}</span>
                        </div>
                    </div>
                    <div className="hidden lg:grid col-span-4 grid-rows-2 h-full">
                        <div className="bg-muted/70 relative border-l border-b border-border group overflow-hidden cursor-pointer z-20" onClick={() => { setIsGalleryOpen(true); setCurrentGalleryIndex(1); triggerHaptic(); }}>
                            <Image src={activeVenue.gallery[1]} alt="" fill sizes="33vw" className="object-cover" />
                        </div>
                        <button className="bg-foreground relative cursor-pointer h-full w-full flex flex-col items-center justify-center border-l border-border group z-30 hover:bg-foreground transition-colors" onClick={() => { setIsGalleryOpen(true); setCurrentGalleryIndex(2); triggerHaptic(); }}>
                            <Image src={activeVenue.gallery[2]} alt="" fill sizes="33vw" className="object-cover opacity-40 pointer-events-none" />
                            <div className="relative z-40 flex flex-col items-center gap-4 text-white pointer-events-none">
                                <Camera className="w-8 h-8 text-primary" />
                                <span className="font-extrabold text-xs uppercase tracking-widest border-b-2 border-primary pb-2">{t("launchGallery")}</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
                    <article className="flex-1 min-w-0 flex flex-col gap-10">
                        <div className="flex flex-col items-start gap-4">
                            <div className="inline-flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-card ring-1 ring-black/5"><MapPin className="w-4 h-4 text-primary" /><span className="text-xs font-extrabold uppercase tracking-widest">{activeVenue.location}</span></div>
                            <h1 className="text-[length:clamp(2rem,9vw,3.5rem)] md:text-6xl font-extrabold text-foreground tracking-tighter leading-[0.95]">{activeVenue.title}</h1>
                            <p className="text-xl md:text-2xl font-bold text-foreground leading-snug max-w-3xl">{activeVenue.summary}</p>
                        </div>

                        {activeVenue.memorial && (
                            <div className="flex items-start gap-4 rounded-2xl bg-foreground text-white p-6">
                                <Landmark className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                                <p className="text-sm leading-relaxed text-white/85">{tl("memorial")}</p>
                            </div>
                        )}

                        {/* PRACTICAL FACTS */}
                        <section aria-labelledby="facts-heading" className="flex flex-col gap-4">
                            <h2 id="facts-heading" className="text-xs font-extrabold uppercase tracking-widest text-primary">{tl("facts")}</h2>
                            <dl className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {([
                                    { icon: Clock, label: tl("duration"), value: activeVenue.facts.duration },
                                    { icon: Users, label: tl("groupSize"), value: activeVenue.facts.groupSize },
                                    { icon: Baby, label: tl("minAge"), value: activeVenue.facts.minAge },
                                    { icon: Sun, label: tl("bestTime"), value: activeVenue.facts.bestTime },
                                    { icon: Car, label: tl("driveTime"), value: activeVenue.facts.driveTime },
                                    { icon: activeVenue.facts.outdoor ? CloudRain : Landmark, label: tl("setting"), value: tl(activeVenue.facts.outdoor ? "outdoor" : "indoor") },
                                ] as { icon: LucideIcon; label: string; value: string }[]).map((f) => (
                                    <div key={f.label} className="rounded-2xl bg-card ring-1 ring-black/5 shadow-sm p-4 md:p-5">
                                        <dt className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground"><f.icon className="w-3.5 h-3.5 text-primary" /> {f.label}</dt>
                                        <dd className="mt-2 text-sm font-bold text-foreground leading-snug">{f.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>

                        {/* HISTORY */}
                        <section aria-labelledby="history-heading" className="rounded-2xl bg-card ring-1 ring-black/5 shadow-xl shadow-black/5 p-6 md:p-10">
                            <h2 id="history-heading" className="text-xs font-extrabold uppercase tracking-widest text-primary mb-5">{tl("history")}</h2>
                            <div className="space-y-4 text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl">
                                {activeVenue.history.map((p, i) => <p key={i}>{p}</p>)}
                            </div>
                            <h3 className="mt-8 text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-3">{tl("highlights")}</h3>
                            <ul className="flex flex-wrap gap-2">
                                {activeVenue.highlights.map((h) => (
                                    <li key={h} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background ring-1 ring-black/5 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {h}</li>
                                ))}
                            </ul>
                        </section>

                        {/* VISITOR NOTE */}
                        <div className="flex items-start gap-3 rounded-2xl bg-primary/5 ring-1 ring-primary/15 p-5">
                            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-sm text-foreground leading-relaxed"><span className="font-extrabold text-foreground">{tl("visitorNote")}: </span>{activeVenue.visitorNote}</p>
                        </div>
                    </article>

                    <aside className="w-full lg:w-[420px] lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] flex flex-col gap-4">
                        <div className="bg-foreground rounded-2xl p-6 md:p-8 shadow-2xl">
                            <span className="text-xs font-extrabold text-secondary uppercase tracking-widest block mb-3">{t("startingRate")}</span>
                            <p className="text-3xl md:text-4xl font-extrabold text-white tabular-nums tracking-tight">{priceLabel(activeVenue)}</p>
                            <p className="mt-3 text-xs text-white/60 leading-relaxed">{tl("priceNote")}</p>
                        </div>
                        <TripPlanner plan={plan} onChange={setPlan} stacked />
                        <Link href={bookHref(plan, activeVenue.id)} onClick={triggerHaptic} className="w-full h-16 rounded-2xl px-4 bg-primary hover:bg-primary-hover text-white font-extrabold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-3 shadow-lg shadow-primary/20">{t("bookTransfer")} <ArrowRight className="w-5 h-5" /></Link>
                    </aside>
                </div>
            </div>
        ) : activeCategory ? (
            <div className="min-h-screen relative z-10">
                <div className="relative h-[65svh] pt-[var(--header-h)] flex items-center justify-center bg-foreground overflow-hidden">
                    <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: optimizedBg(activeCategory.intro.image, 1200) }} />
                    <div className="relative z-20 text-center max-w-5xl px-6"><h1 className="text-[length:clamp(2rem,11vw,3.75rem)] md:text-7xl font-extrabold text-white uppercase tracking-tighter leading-[0.95]">{activeCategory.intro.title}</h1></div>
                </div>
                <div className="max-w-[1400px] mx-auto px-6 md:px-10 pb-24 md:pb-32 relative z-10 flex flex-col gap-16">
                    <TripPlanner plan={plan} onChange={setPlan} className="-mt-16 relative z-30" />
                    <div className="max-w-4xl border-l-4 border-primary pl-8 flex flex-col gap-3">
                        {activeCategory.intro.desc.map((l, i) => (
                            <p key={i} className={i === 0 ? "text-2xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight" : "text-lg md:text-xl text-muted-foreground leading-relaxed"}>{l}</p>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {activeCategory.venues.map((v) => (
                            <VenueCard key={v.id} venue={v} collectionId={activeCategory.id} plan={plan} detailed onTap={triggerHaptic} />
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div>
                <section className="relative h-[100svh] flex items-center justify-center overflow-hidden bg-foreground">
                    <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: optimizedBg(HERO_IMAGE) }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-foreground/80 via-transparent to-foreground" />
                    <div className="relative z-20 w-full max-w-[1400px] mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-20 items-start h-full pt-[calc(var(--header-h)+4rem)]">
                        <div className="max-w-3xl flex flex-col items-start gap-4">
                            <div className="inline-flex items-center gap-3 py-2 px-6 rounded-2xl bg-primary text-white font-extrabold text-xs uppercase tracking-widest shadow-2xl">{t("hero.badge")}</div>
                            <h1 className="text-[length:clamp(2rem,11vw,3.75rem)] md:text-7xl font-extrabold text-white leading-[0.95] tracking-tighter uppercase drop-shadow-2xl">{t("hero.title")} <br/><span className="text-secondary">{t("hero.titleHighlight")}</span></h1>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex flex-wrap justify-end gap-4">
                                <Link href={bookHref(plan)} onClick={triggerHaptic} className="h-16 px-10 rounded-2xl bg-primary hover:bg-card hover:text-foreground text-white font-extrabold uppercase tracking-widest text-xs transition-all shadow-2xl flex items-center justify-center gap-3">{t("bookTransfer")} <ArrowRight className="w-4 h-4" /></Link>
                                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={triggerHaptic} className="h-16 px-10 rounded-2xl border-2 border-white/20 hover:bg-card hover:text-foreground text-white font-extrabold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3"><Phone className="w-4 h-4" /> {t("whatsapp")}</a>
                            </div>
                        </div>
                    </div>
                </section>
                <section id="collections-section" className="px-6 md:px-10 max-w-[1400px] mx-auto pb-24 md:pb-32 flex flex-col gap-24 md:gap-32">
                    <TripPlanner plan={plan} onChange={setPlan} className="-mt-16 relative z-30" />
                    {collections.map((d, i) => (
                        <div key={d.id} className="relative flex flex-col gap-12 md:gap-16">
                            <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:items-end lg:gap-0">
                                <div><span aria-hidden="true" className="text-8xl font-extrabold text-foreground/5 select-none tracking-tighter">0{i + 1}</span><h2 className="text-[length:clamp(2rem,11vw,3.75rem)] md:text-6xl font-extrabold text-foreground uppercase tracking-tighter leading-[0.95]">{d.category}</h2></div>
                                <Link href={`/tours?category=${d.id}`} onClick={triggerHaptic} className="min-h-12 text-foreground font-extrabold text-xs uppercase tracking-widest flex items-center gap-6 hover:text-primary transition-colors group">{t("expand")} <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" /></Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {d.venues.map((v) => (
                                    <VenueCard key={v.id} venue={v} collectionId={d.id} plan={plan} onTap={triggerHaptic} />
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            </div>
        )}

        <AnimatePresence>
            {isGalleryOpen && activeVenue && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6">
                    <button onClick={() => setIsGalleryOpen(false)} aria-label={tg("close")} className="absolute top-10 right-10 text-white/50 hover:text-primary z-[120]"><X size={48} /></button>
                    <div className="relative w-full max-w-7xl flex items-center justify-center group/nav">
                        <button onClick={handlePrevImage} aria-label={tg("previous")} className="absolute left-4 z-[110] text-white/50 hover:text-white bg-white/10 p-4 rounded-2xl hover:bg-primary transition-all"><ChevronLeft size={48} /></button>
                        <motion.div key={currentGalleryIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full aspect-video flex items-center justify-center">
                            <div className="w-full h-full bg-contain bg-center bg-no-repeat shadow-2xl" style={{ backgroundImage: optimizedBg(activeVenue.gallery[currentGalleryIndex]) }} />
                        </motion.div>
                        <button onClick={handleNextImage} aria-label={tg("next")} className="absolute right-4 z-[110] text-white/50 hover:text-white bg-white/10 p-4 rounded-2xl hover:bg-primary transition-all"><ChevronRight size={48} /></button>
                    </div>
                </div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ToursPage() {
  const t = useTranslations("Tours");

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-foreground flex items-center justify-center text-white font-extrabold uppercase tracking-widest">
          {t("loading")}
        </div>
      }
    >
      <ToursContent />
      <LeadMagnet />
    </Suspense>
  );
}