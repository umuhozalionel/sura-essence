"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Manrope } from "next/font/google";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Clock, MapPin, Check, Users, Star,
  ChevronLeft, ChevronRight, Camera, Quote, X, Phone, Zap,
  Sun, TrafficCone, Activity, CloudRain, Moon, Timer, AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getIcon } from "@/lib/icons";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

// WEATHER API CONFIGURATION
const API_KEY = "23f292fb66ec335896541f0b5e8b87bf"; 
const CITY = "Kigali";

/**
 * Collections, venues and quotes live in messages/en.json + messages/fr.json
 * (namespace "Tours"). Add a collection, a venue or a quote by editing those
 * two files — the images, ids and icon names must match in both.
 */
const HERO_IMAGE = "/marketing/kigali-skyline-night.jpg";

interface Quote {
  id: string;
  author: string;
  team: string;
  text: string;
}

interface Expectation {
  id: string;
  icon: string;
  label: string;
}

interface MissionIntel {
  isOutdoor: boolean;
  driveTime: string;
  vibe: string;
  bestTime: string;
}

interface Venue {
  id: string;
  image: string;
  gallery: string[];
  price: number;
  priceLabel?: string;
  rating: number;
  reviews: number;
  title: string;
  location: string;
  tag: string;
  duration: string;
  groupSize: string;
  minAge: string;
  desc: string;
  longDesc: string;
  highlights: string[];
  missionIntel: MissionIntel;
  expect: Expectation[];
}

interface Collection {
  id: string;
  category: string;
  intro: { image: string; title: string; headline: string; desc: string[] };
  venues: Venue[];
}

function ToursContent() {
  const t = useTranslations("Tours");
  const ts = useTranslations("Tours.status");
  const tg = useTranslations("Tours.gallery");
  const format = useFormatter();
  const collections = t.raw("collections") as Collection[];
  const quotes = t.raw("quotes") as Quote[];

  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeCategory, setActiveCategory] = useState<Collection | null>(null);
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0); 
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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
    if (!isPaused) {
        const timer = setInterval(() => setQuoteIndex((p) => (p + 1) % quotes.length), 10000);
        return () => clearInterval(timer);
    }
  }, [isPaused, quotes.length]);

  useEffect(() => {
    const catId = searchParams.get("category");
    const venueId = searchParams.get("venue");
    if (venueId) {
      let foundVenue: Venue | null = null;
      let foundCollection: Collection | null = null;
      for (const collection of collections) {
        const venue = collection.venues.find((v) => v.id === venueId);
        if (venue) { foundVenue = venue; foundCollection = collection; break; }
      }
      if (foundVenue) { setActiveVenue(foundVenue); setActiveCategory(foundCollection); }
    } else if (catId) {
      const foundCollection = collections.find((c) => c.id === catId);
      if (foundCollection) { setActiveCategory(foundCollection); setActiveVenue(null); }
    } else { setActiveCategory(null); setActiveVenue(null); }
  }, [searchParams, collections]);

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
    if (isNaN(hour)) return { label: ts("syncing"), icon: Timer, color: "text-gray-400" };
    if (hour >= 17 && hour < 18) return { label: ts("goldenHour"), icon: Sun, color: "text-orange-400" };
    if (hour >= 18 || hour < 5) return { label: ts("night"), icon: Moon, color: "text-blue-400" };
    return { label: ts("optimal"), icon: Zap, color: "text-[#C97C2F]" };
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
    <main className={`min-h-screen bg-[#F5F2EA] text-[#111827] relative ${manrope.className} selection:bg-[#C97C2F]/20`}>
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#111827 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.08 }}></div>

      <div className="relative z-10">
        <Header />

        {(activeCategory || activeVenue) && (
            <div className="fixed top-24 left-6 z-[60]">
                <button onClick={handleBack} aria-label={t("back")} className="flex items-center justify-center w-14 h-14 bg-white text-[#111827] hover:bg-[#111827] hover:text-white shadow-xl border border-gray-100 transition-all">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>
        )}

        {activeVenue ? (
            <div className="pt-24 pb-20 max-w-[1600px] mx-auto px-10 relative z-10">
                <div className="flex flex-wrap items-center gap-6 mb-12 bg-[#111827] p-6 border-b-4 border-[#C97C2F] shadow-2xl">
                    <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{t("systemLive")}</span>
                    </div>
                    <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                        <Clock className="w-4 h-4 text-[#C97C2F]" />
                        <span className="text-xl font-black text-white tabular-nums">{kigaliTime} <span className="text-[10px] text-white/30 ml-1 uppercase">{t("timezone")}</span></span>
                    </div>
                    <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                        <missionStatus.icon className={`w-4 h-4 ${missionStatus.color}`} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{missionStatus.label}</span>
                    </div>
                    {weatherStatus && (
                      <div className="flex items-center gap-3">
                          <CloudRain className="w-4 h-4 text-blue-400" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{weatherStatus.temp}°C • {weatherStatus.condition}</span>
                      </div>
                    )}
                </div>

                {weatherStatus?.condition === "Rain" && activeVenue.missionIntel?.isOutdoor && (
                  <div className="mb-12 bg-red-600/10 border-2 border-red-600 p-8 flex items-center gap-6">
                    <AlertTriangle className="w-10 h-10 text-red-600 animate-bounce" />
                    <div>
                      <h4 className="text-red-600 font-black uppercase tracking-[0.2em] text-lg">{t("rain.title")}</h4>
                      <p className="text-red-600/70 font-bold uppercase text-[10px] tracking-widest mt-1">{t("rain.text")}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-gray-200 bg-white shadow-2xl h-[500px] mb-16 overflow-hidden">
                    <div className="lg:col-span-8 bg-gray-100 relative group cursor-pointer z-20" onClick={() => { setIsGalleryOpen(true); setCurrentGalleryIndex(0); triggerHaptic(); }}>
                        <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url('${activeVenue.gallery[0]}')` }} />
                        <div className="absolute bottom-0 left-0 bg-[#111827] text-white px-8 py-4 z-30 pointer-events-none">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{activeVenue.tag}</span>
                        </div>
                    </div>
                    <div className="hidden lg:grid col-span-4 grid-rows-2 h-full">
                        <div className="bg-gray-100 relative border-l border-b border-gray-200 group overflow-hidden cursor-pointer z-20" onClick={() => { setIsGalleryOpen(true); setCurrentGalleryIndex(1); triggerHaptic(); }}>
                            <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url('${activeVenue.gallery[1]}')` }} />
                        </div>
                        <button className="bg-[#111827] relative cursor-pointer h-full w-full flex flex-col items-center justify-center border-l border-gray-200 group z-30 hover:bg-[#1f2937] transition-colors" onClick={() => { setIsGalleryOpen(true); setCurrentGalleryIndex(2); triggerHaptic(); }}>
                            <div className="absolute inset-0 bg-cover bg-center opacity-40 transition-all duration-700 pointer-events-none" style={{ backgroundImage: `url('${activeVenue.gallery[2]}')` }} />
                            <div className="relative z-40 flex flex-col items-center gap-4 text-white pointer-events-none">
                                <Camera className="w-8 h-8 text-[#C97C2F]" />
                                <span className="font-black text-[10px] uppercase tracking-[0.4em] border-b-2 border-[#C97C2F] pb-2">{t("launchGallery")}</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-20 items-start">
                    <div className="flex-1 space-y-12">
                        {activeVenue.missionIntel && (
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-[#111827] text-white px-4 py-2 border-l-2 border-[#C97C2F] flex items-center gap-2">
                                    <TrafficCone className="w-3 h-3 text-[#C97C2F]" /><span className="text-[10px] font-black uppercase tracking-widest">{activeVenue.missionIntel.driveTime}</span>
                                </div>
                                <div className="bg-[#111827] text-white px-4 py-2 border-l-2 border-[#C97C2F] flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-[#C97C2F]" /><span className="text-[10px] font-black uppercase tracking-widest">{t("vibe", { vibe: activeVenue.missionIntel.vibe })}</span>
                                </div>
                                <div className="bg-[#111827] text-white px-4 py-2 border-l-2 border-[#C97C2F] flex items-center gap-2">
                                    <Sun className="w-3 h-3 text-[#C97C2F]" /><span className="text-[10px] font-black uppercase tracking-widest">{t("target", { time: activeVenue.missionIntel.bestTime })}</span>
                                </div>
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-3 py-2 px-5 bg-[#111827] text-white mb-8 self-start inline-flex"><MapPin className="w-4 h-4 text-[#C97C2F]" /><span className="text-[10px] font-black uppercase tracking-[0.3em]">{activeVenue.location}</span></div>
                            <h1 className="text-6xl md:text-8xl font-black text-[#111827] mb-8 tracking-tighter leading-none uppercase">{activeVenue.title}</h1>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                               {activeVenue.expect?.map((item) => {
                                  const Icon = getIcon(item.icon);
                                  return (
                                    <div key={item.id} className="bg-white border border-gray-200 p-6 flex items-center gap-5 shadow-sm">
                                        <div className="w-10 h-10 bg-[#F5F2EA] flex items-center justify-center text-[#C97C2F]"><Icon size={20} /></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#111827]">{item.label}</span>
                                    </div>
                                  );
                               })}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 border border-gray-200 bg-white shadow-2xl">
                                {[{ icon: Clock, label: activeVenue.duration }, { icon: Users, label: t("maxGroup", { size: activeVenue.groupSize }) }, { icon: Check, label: t("age", { age: activeVenue.minAge }) }, { icon: Star, label: t("ratingLabel", { rating: activeVenue.rating }) }].map((s, i) => (
                                    <div key={i} className="p-8 border-r last:border-r-0 border-gray-100 flex flex-col items-center gap-2"><s.icon className="w-5 h-5 text-[#C97C2F]" /><span className="text-[10px] font-black text-[#111827] uppercase tracking-widest text-center">{s.label}</span></div>
                                ))}
                            </div>
                        </div>
                        <p className="text-xl font-bold text-[#111827] leading-relaxed uppercase tracking-tight">{activeVenue.longDesc}</p>
                    </div>
                    <div className="lg:w-[450px] sticky top-28">
                        <div className="bg-[#111827] p-12 shadow-2xl border-t-4 border-[#C97C2F]">
                            <span className="text-[10px] font-black text-[#C97C2F] uppercase tracking-[0.4em] block mb-4">{t("startingRate")}</span>
                            <div className="flex items-baseline gap-2 mb-10 border-b border-white/10 pb-10"><span className="text-6xl font-black text-white tabular-nums tracking-tighter">{activeVenue.priceLabel || format.number(activeVenue.price, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</span></div>
                            <button onClick={triggerHaptic} className="w-full h-20 bg-[#C97C2F] hover:bg-white hover:text-[#111827] text-white font-black text-xs uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-4">{t("bookTransfer")} <ArrowRight className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>
            </div>
        ) : activeCategory ? (
            <div className="min-h-screen relative z-10">
                <div className="relative h-[65vh] flex items-center justify-center bg-[#111827] overflow-hidden">
                    <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url('${activeCategory.intro.image}')` }} />
                    <div className="relative z-20 text-center max-w-5xl px-6"><h1 className="text-6xl md:text-9xl font-black text-white mb-8 uppercase tracking-tighter leading-none">{activeCategory.intro.title}</h1></div>
                </div>
                <div className="max-w-[1600px] mx-auto px-10 py-32 relative z-10">
                    <div className="mb-20 max-w-4xl border-l-4 border-[#C97C2F] pl-8">
                        {activeCategory.intro.desc.map((l, i) => (
                            <p key={i} className="text-2xl md:text-4xl font-black text-[#111827] uppercase tracking-wide leading-tight block mb-2">{l}</p>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 border border-gray-200 bg-white shadow-2xl overflow-hidden">
                        {activeCategory.venues.map((v) => (
                            <Link href={`/tours?category=${activeCategory.id}&venue=${v.id}`} onClick={triggerHaptic} key={v.id} className="group transition-all duration-500 cursor-pointer flex flex-col h-full bg-white border border-gray-100 hover:bg-[#111827]">
                                <div className="h-[320px] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url('${v.image}')` }} />
                                    <div className="absolute top-0 left-0 bg-[#C97C2F] text-white px-5 py-2"><span className="text-[10px] font-black uppercase tracking-widest">{v.tag}</span></div>
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                                        <div className="flex gap-4 items-center">
                                            <div className="flex items-center gap-2"><Clock size={12} className="text-[#C97C2F]" /><span className="text-[9px] font-black text-white uppercase tracking-widest">{v.duration}</span></div>
                                            <div className="flex items-center gap-2"><MapPin size={12} className="text-[#C97C2F]" /><span className="text-[9px] font-black text-white uppercase tracking-widest">{v.location}</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-10 flex flex-col h-full">
                                    <h3 className="text-3xl font-black text-[#111827] group-hover:text-white uppercase tracking-tighter mb-8 transition-colors leading-none">{v.title}</h3>
                                    
                                    <div className="space-y-4 mb-10">
                                       {v.expect?.map((ex) => {
                                         const PreviewIcon = getIcon(ex.icon);
                                         return (
                                           <div key={ex.id} className="flex items-center gap-4 border-l border-gray-200 group-hover:border-[#C97C2F]/30 pl-4">
                                              <PreviewIcon size={14} className="text-[#C97C2F]" />
                                              <span className="text-[10px] font-black text-gray-400 group-hover:text-white/70 uppercase tracking-widest">{ex.label}</span>
                                           </div>
                                         );
                                       })}
                                    </div>
                                    <p className="text-gray-400 group-hover:text-white/50 text-[10px] font-bold uppercase tracking-tight flex-grow line-clamp-2 mb-10">{v.desc}</p>

                                    {/* EXPLORE THE VENUE BUTTON - ACTION ORIENTED */}
                                    <div className="mt-auto pt-8 border-t border-gray-100 group-hover:border-white/10">
                                        <div className="h-14 w-full bg-[#111827] group-hover:bg-[#C97C2F] flex items-center justify-between px-8 transition-all">
                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">{t("exploreVenue")}</span>
                                            <ArrowRight size={16} className="text-[#C97C2F] group-hover:text-white transition-transform group-hover:translate-x-2" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div>
                <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#111827]">
                    <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('${HERO_IMAGE}')` }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/80 via-transparent to-[#111827]" />
                    <div className="relative z-20 container mx-auto px-10 grid lg:grid-cols-2 gap-20 items-start h-full pt-40">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-3 py-2 px-6 bg-[#C97C2F] text-white font-black text-[10px] uppercase tracking-[0.4em] mb-10 shadow-2xl">{t("hero.badge")}</div>
                            <h1 className="text-7xl md:text-[9rem] font-black text-white mb-10 leading-[0.85] tracking-tighter uppercase drop-shadow-2xl">{t("hero.title")} <br/><span className="text-[#C97C2F]">{t("hero.titleHighlight")}</span></h1>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex gap-4 mb-12"><a href="https://wa.me/250788564000" target="_blank" onClick={triggerHaptic} className="h-16 px-10 bg-[#C97C2F] hover:bg-white hover:text-[#111827] text-white font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-2xl flex items-center justify-center gap-3"><Phone className="w-4 h-4" /> {t("bookTransfer")}</a></div>
                            <div className="relative max-w-lg text-right self-end min-h-[250px] p-0" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
                                <AnimatePresence mode="wait">
                                    <motion.div key={quoteIndex} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 1 }} className="flex flex-col items-end">
                                        <Quote className="w-10 h-10 text-[#C97C2F] mb-6 ml-auto opacity-60" /><p className="text-xl font-bold text-white leading-tight mb-8 italic uppercase tracking-widest opacity-90 max-w-md">“{quotes[quoteIndex].text}”</p>
                                        <div className="flex flex-col items-end border-t border-white/10 pt-8 opacity-60"><p className="text-[#C97C2F] font-black text-2xl tracking-tighter mb-2">{quotes[quoteIndex].author}</p><p className="text-white font-black text-[10px] uppercase tracking-[0.3em]">{quotes[quoteIndex].team}</p></div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </section>
                <section id="collections-section" className="px-10 max-w-[1600px] mx-auto pb-40 space-y-40">
                    {collections.map((d, i) => (
                        <div key={d.id} className="relative scroll-mt-32">
                            <div className="flex justify-between items-end mb-20">
                                <div><span className="text-8xl font-black text-[#111827]/5 select-none tracking-tighter">0{i + 1}</span><h2 className="text-6xl md:text-[6rem] font-black text-[#111827] mb-8 uppercase tracking-tighter leading-none">{d.category}</h2></div>
                                <Link href={`/tours?category=${d.id}`} onClick={triggerHaptic} className="text-[#111827] font-black text-[11px] uppercase tracking-[0.5em] flex items-center gap-6 hover:text-[#C97C2F] transition-colors group">{t("expand")} <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" /></Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 border border-gray-200 bg-white shadow-2xl overflow-hidden">
                                {d.venues.map((v) => (
                                    <Link href={`/tours?category=${d.id}&venue=${v.id}`} onClick={triggerHaptic} key={v.id} className="group transition-all duration-500 cursor-pointer flex flex-col h-full bg-white border border-gray-100 hover:bg-[#111827]">
                                        <div className="h-[320px] relative overflow-hidden">
                                            <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url('${v.image}')` }} />
                                        </div>
                                        <div className="p-10 flex flex-col h-full">
                                            <h3 className="text-3xl font-black text-[#111827] group-hover:text-white uppercase tracking-tighter mb-4 transition-colors leading-none">{v.title}</h3>
                                            
                                            {/* BUTTON ADDED TO MAIN LANDING GRID AS WELL */}
                                            <div className="mt-auto pt-8 border-t border-gray-100 group-hover:border-white/10">
                                                <div className="h-14 w-full bg-[#111827] group-hover:bg-[#C97C2F] flex items-center justify-between px-8 transition-all">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">{t("exploreVenue")}</span>
                                                    <ArrowRight size={16} className="text-[#C97C2F] group-hover:text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
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
                    <button onClick={() => setIsGalleryOpen(false)} aria-label={tg("close")} className="absolute top-10 right-10 text-white/50 hover:text-[#C97C2F] z-[120]"><X size={48} /></button>
                    <div className="relative w-full max-w-7xl flex items-center justify-center group/nav">
                        <button onClick={handlePrevImage} aria-label={tg("previous")} className="absolute left-4 z-[110] text-white/50 hover:text-white bg-white/10 p-4 rounded-none hover:bg-[#C97C2F] transition-all"><ChevronLeft size={48} /></button>
                        <motion.div key={currentGalleryIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full aspect-video flex items-center justify-center">
                            <div className="w-full h-full bg-contain bg-center bg-no-repeat shadow-2xl" style={{ backgroundImage: `url('${activeVenue.gallery[currentGalleryIndex]}')` }} />
                        </motion.div>
                        <button onClick={handleNextImage} aria-label={tg("next")} className="absolute right-4 z-[110] text-white/50 hover:text-white bg-white/10 p-4 rounded-none hover:bg-[#C97C2F] transition-all"><ChevronRight size={48} /></button>
                    </div>
                </div>
            )}
        </AnimatePresence>
        <Footer />
      </div>
    </main>
  );
}

export default function ToursPage() {
  const t = useTranslations("Tours");

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111827] flex items-center justify-center text-white font-black uppercase tracking-[0.5em]">
          {t("loading")}
        </div>
      }
    >
      <ToursContent />
    </Suspense>
  );
}