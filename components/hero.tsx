"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MapPin, Car, Map as MapIcon, Users, ChevronDown, Sun, Moon, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, Clock, Loader2, Search, X, Tag, Star, Calendar, MessageCircle, Check, type LucideIcon } from "lucide-react";
import { Manrope } from "next/font/google";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || "23f292fb66ec335896541f0b5e8b87bf"; 
const CITY = "Kigali";
// Tab labels live in messages/*.json under Hero.tabs.<id>
type TabId = "cityRide" | "interCity" | "driver";
const TABS: TabId[] = ["cityRide", "interCity", "driver"];

const WHATSAPP_NUMBER = "250788564000";

/** Where the glassmorphic hero card sends visitors. */
const NEXT_ACTIVITY_HREF = "/events";
const whatsappLink = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

type Slide = {
  id: number;
  /** Text lives in messages/*.json under Hero.slides.<key> (title, subtitle, and for events cta, highlights, whatsappMessage) */
  key: string;
  image: string;
  /** Internal page for the main button. Leave out on event slides: they open WhatsApp with Hero.slides.<key>.whatsappMessage */
  link?: string;
  duration: number;
  isEvent?: boolean;
  /** Keys under Hero.slides.<key>, shown as chips (e.g. "date" → Hero.slides.nyungwe.date) */
  highlights?: string[];
  /** Last day of the event (YYYY-MM-DD, Kigali time). The slide hides itself automatically after this day. */
  eventDate?: string;
  /** Optional second button for event slides. */
  secondaryLink?: string;
};

/**
 * Which entry below fills the static hero. Change this one line to swap the
 * background, headline and buttons — every slide keeps its translations in
 * messages/en.json + messages/fr.json under Hero.slides.<key>.
 * If you point it at an event whose date has passed, the first evergreen
 * slide is shown instead.
 */
const HERO_SLIDE = "standard";

const SLIDES: Slide[] = [
  { 
    id: 1, 
    key: "nyungwe",
    isEvent: true,
    highlights: ["date", "package", "departure"],
    eventDate: "2026-06-20",
    image: "/nyungwe-hero-bg.jpg",
    secondaryLink: "/events",
    duration: 10000
  },
  { 
    id: 2, 
    key: "transfers",
    image: "/fleet/sedan.webp", 
    link: "/transfers",
    duration: 6000
  },
  { 
    id: 3, 
    key: "standard",
    image: "/backgrounds/sura-experience.jpeg", 
    link: "/#how-it-works",
    duration: 6000
  },
  { 
    id: 4, 
    key: "carFreeDay",
    image: "/backgrounds/car-free-day.jpg", 
    link: "/gallery",
    duration: 6000
  }
];

// ── Kigali clock ────────────────────────────────────────────────────────────
// Always show Rwanda time (CAT), whatever time zone the visitor is in.
const KIGALI_TIME = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Kigali", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const KIGALI_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Kigali", year: "numeric", month: "2-digit", day: "2-digit" }); // → "2026-09-22"

const subscribeToClock = (onTick: () => void) => {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
};
const getKigaliTime = () => KIGALI_TIME.format(new Date()); // "14:25"
const getKigaliDate = () => KIGALI_DATE.format(new Date()); // "2026-09-22"
const getServerSnapshot = () => null; // unknown during server render → avoids hydration mismatches

// "Clear" (and anything unknown) falls back to Sun/Moon depending on the Kigali hour.
const WEATHER_ICONS: Record<string, LucideIcon> = {
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudRain,
  Thunderstorm: CloudLightning,
  Snow: CloudSnow,
  Mist: CloudFog,
  Fog: CloudFog,
  Haze: CloudFog,
};

// Site names live in messages/*.json under Hero.sites.<id>
const RWANDA_SITES = [
  { id: "volcanoes", region: "Musanze", price: 90000, coords: [-1.4748, 29.4831] },
  { id: "akagera", region: "Eastern", price: 120000, coords: [-1.8833, 30.7167] },
  { id: "nyungwe", region: "Southern", price: 150000, coords: [-2.4639, 29.2031] },
  { id: "rubavu", region: "Western", price: 110000, coords: [-1.6853, 29.4101] },
  { id: "huye", region: "Huye", price: 80000, coords: [-2.6000, 29.7333] },
];

// Vehicle names live in messages/*.json under Hero.vehicles.<id>
const VEHICLES = [
  { id: "sedan", capacity: "4 Seats", comfort: "Essential", multiplier: 1 },
  { id: "suv", capacity: "7 Seats", comfort: "Premium", multiplier: 2 },
  { id: "van", capacity: "10 Seats", comfort: "Standard", multiplier: 2.5 },
  { id: "bus", capacity: "20+ Seats", comfort: "Group", multiplier: 5 },
];

// Option labels live in messages/*.json under Hero.passengerOptions.<id>
const PASSENGER_OPTIONS = ["oneAdult", "twoAdults", "group"];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1.4; 
}

function LocationInput({ label, placeholder, zIndex, onSelect }: { label: string, placeholder: string, zIndex: string, onSelect: (coords: [number, number] | null) => void }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.length < 3) return;
      setLoading(true);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${query}&lat=-1.9441&lon=30.0619&limit=5`);
        const data = await res.json();
        setSuggestions(data.features.map((f: any) => ({
            name: `${f.properties.name}${f.properties.city ? `, ${f.properties.city}` : ''}`,
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0]
        })));
        setShowDropdown(true);
      } catch (e) { console.error(e); }
      setLoading(false);
    }, 500);
    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className={`flex flex-col relative ${zIndex} group`}>
        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#006cb7] transition-colors">{label}</label>
        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#006cb7] focus-within:ring-1 focus-within:ring-[#006cb7] transition-all bg-white h-10">
            <input 
                suppressHydrationWarning
                type="text" value={query} onChange={(e) => { setQuery(e.target.value); onSelect(null); }}
                onFocus={() => query.length > 2 && setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder={placeholder} 
                className="w-full h-full px-3 py-2 text-xs text-[#111827] font-bold outline-none placeholder:text-gray-400 placeholder:font-medium" 
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-[#006cb7]" />}
        </div>
        <AnimatePresence>
            {showDropdown && suggestions.length > 0 && (
                <motion.ul initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-[100%] left-0 w-full bg-white border border-gray-200 shadow-2xl rounded-sm max-h-48 overflow-y-auto mt-1 z-50">
                    {suggestions.map((s, idx) => (
                        <li key={idx} onClick={() => { setQuery(s.name); onSelect([s.lat, s.lon]); setShowDropdown(false); }} className="px-3 py-2.5 text-[10px] font-bold text-[#111827] hover:bg-gray-50 hover:text-[#006cb7] cursor-pointer border-b border-gray-100 last:border-0 transition-colors">
                            {s.name}
                        </li>
                    ))}
                </motion.ul>
            )}
        </AnimatePresence>
    </div>
  );
}

export function Hero() {
  const t = useTranslations("Hero");
  const format = useFormatter();
  const [activeTab, setActiveTab] = useState<TabId>("cityRide");
  const kigaliTime = useSyncExternalStore(subscribeToClock, getKigaliTime, getServerSnapshot);
  const kigaliToday = useSyncExternalStore(subscribeToClock, getKigaliDate, getServerSnapshot);

  // The chosen slide fills the hero. An event slide stops showing once its date
  // has passed; the first evergreen slide takes over. The server doesn't know
  // today's date, so that swap happens right after hydration.
  const currentSlide = useMemo(() => {
    const chosen = SLIDES.find((s) => s.key === HERO_SLIDE) ?? SLIDES[0];
    const expired =
      chosen.eventDate !== undefined && kigaliToday !== null && chosen.eventDate < kigaliToday;
    return expired ? SLIDES.find((s) => !s.eventDate) ?? SLIDES[0] : chosen;
  }, [kigaliToday]);


  const [weather, setWeather] = useState<{ temp: number; condition: string; humidity: number; wind: number; precip: number } | null>(null);
  const [weatherStatIndex, setWeatherStatIndex] = useState(0);

  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [duration, setDuration] = useState("3");
  const [passengers, setPassengers] = useState("oneAdult");
  const [vehicleId, setVehicleId] = useState("sedan");
  const [promoCode, setPromoCode] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  // Raw numbers; they're formatted for the current language when the modal renders.
  const [estimate, setEstimate] = useState<{ distKm: number | null; minutes: number; price: number; title: string; vehicleId: string } | null>(null);

  useEffect(() => {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`)
      .then(res => res.json())
      .then(data => setWeather({ 
          temp: Math.round(data.main.temp), 
          condition: data.weather[0].main,
          humidity: data.main.humidity,
          wind: Math.round(data.wind.speed * 3.6), 
          precip: data.clouds ? data.clouds.all : 0 
      }))
      .catch(() => setWeather({ temp: 24, condition: "Clear", humidity: 71, wind: 3, precip: 10 }));
  }, []);

  useEffect(() => {
    const statTimer = setInterval(() => {
      setWeatherStatIndex(prev => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(statTimer);
  }, []);

  // Day/night is based on Kigali time, not the visitor's clock.
  const kigaliHour = kigaliTime ? Number(kigaliTime.slice(0, 2)) : 12;
  const isNight = kigaliHour >= 18 || kigaliHour < 6;
  const CurrentWeatherIcon = WEATHER_ICONS[weather?.condition ?? "Clear"] ?? (isNight ? Moon : Sun);

  const weatherStats = [
    t("weather.temp", { temp: weather?.temp || 24 }),
    t("weather.precipitation", { value: weather?.precip || 10 }),
    t("weather.humidity", { value: weather?.humidity || 71 }),
    t("weather.wind", { value: weather?.wind || 3 })
  ];

  const handleShowFleet = () => {
    let distVal = 0; let timeVal = 0; let priceVal = 0; let title = "";

    if (activeTab === "cityRide") {
      if (!pickupCoords || !dropoffCoords) return alert(t("errors.pickupAndDestination"));
      distVal = calculateDistance(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]);
      timeVal = Math.round(distVal * 3.5); 
      priceVal = Math.round(10000 + (distVal * 1500)); 
      title = t("estimate.cityTitle");
    } 
    else if (activeTab === "interCity") {
      if (!pickupCoords || !selectedSite) return alert(t("errors.pickupAndSite"));
      const site = RWANDA_SITES.find(s => s.id === selectedSite);
      if (!site) return;
      distVal = calculateDistance(pickupCoords[0], pickupCoords[1], site.coords[0], site.coords[1]);
      timeVal = Math.round(distVal * 1.5); 
      priceVal = site.price;
      title = t("estimate.siteTitle", { site: t(`sites.${site.id}`) });
    }
    else if (activeTab === "driver") {
      if (!pickupCoords) return alert(t("errors.pickup"));
      timeVal = parseInt(duration) * 60;
      priceVal = 25000 + ((parseInt(duration) - 3) * 7000);
      title = t("estimate.driverTitle", { hours: parseInt(duration) });
      distVal = 0; 
    }

    const vehicle = VEHICLES.find(v => v.id === vehicleId) || VEHICLES[0];
    priceVal = Math.round(priceVal * vehicle.multiplier);

    setEstimate({
      distKm: distVal > 0 ? distVal : null,
      minutes: timeVal,
      price: priceVal,
      title,
      vehicleId: vehicle.id
    });
    setShowModal(true);
  };

  /*
   * Layout (the alert bar + header are fixed and sit on top of this section):
   *   - Top bar + header = 101px tall on mobile, 109px from md up. The hero is
   *     min-h-screen and the image runs underneath them, so the content column
   *     starts at pt-[124px] / md:pt-[136px].
   *   - The booking card is no longer absolutely positioned: it is its own
   *     section directly below the hero, in normal document flow.
   */
  return (
    <>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section
        className={`relative w-full min-h-screen overflow-hidden bg-[#0a0e1a] ${manrope.className}`}
      >
        {/* Static background */}
        <div aria-hidden="true" className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentSlide.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/35 to-black/80" />
        </div>

        {/* Weather — floating white text, top right */}
        <div className="absolute right-5 md:right-12 top-[118px] md:top-[134px] z-30 flex items-center gap-2 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
          <CurrentWeatherIcon className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
          <div className="relative h-3.5 md:h-4 w-28 md:w-32 overflow-hidden flex items-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={weatherStatIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest absolute whitespace-nowrap"
              >
                {weatherStats[weatherStatIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Kigali clock — floating white text, bottom right */}
        <div className="absolute right-5 md:right-12 bottom-8 md:bottom-12 z-30 flex items-center gap-2 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
          <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest tabular-nums">
            {t("clock", { time: kigaliTime ?? "--:--" })}
          </span>
        </div>

        {/* Feedback tab */}
        <div className="hidden md:block absolute left-0 bottom-28 z-30">
          <button
            className="bg-[#84BD00] hover:bg-[#70a100] text-white py-5 px-2 text-[11px] font-bold tracking-widest uppercase transition-colors shadow-lg rounded-r-sm"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {t("sendFeedback")}
          </button>
        </div>

        {/* Content column */}
        <div className="relative z-20 flex min-h-screen flex-col px-5 sm:px-8 md:pl-24 md:pr-16 pt-[124px] md:pt-[136px] pb-16 md:pb-20">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="my-auto max-w-3xl"
          >
            {currentSlide.isEvent && (
              <div className="mb-4">
                <span className="bg-[#C97C2F] text-white px-3 py-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-md rounded-sm">
                  {t("eventTag")}
                </span>
              </div>
            )}

            <h1 className="font-black text-white uppercase tracking-tighter leading-[1.02] mb-4 md:mb-5 text-4xl sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]">
              {t(`slides.${currentSlide.key}.title`)}
            </h1>

            <p className="text-white/90 text-xs sm:text-sm md:text-base font-bold uppercase tracking-widest mb-6 md:mb-8 max-w-2xl leading-relaxed drop-shadow-[0_2px_16px_rgba(0,0,0,0.75)]">
              {t(`slides.${currentSlide.key}.subtitle`)}
            </p>

            {currentSlide.isEvent && currentSlide.highlights && (
              <div className="flex flex-wrap gap-2 md:gap-3 mb-7 md:mb-9 max-w-xl">
                {currentSlide.highlights.map((h) => (
                  <span
                    key={h}
                    className="bg-white/10 backdrop-blur-md border border-white/25 text-white text-[8px] md:text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-full flex items-center gap-1.5"
                  >
                    <Check className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-[#84BD00]" />
                    {t(`slides.${currentSlide.key}.${h}`)}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {currentSlide.isEvent ? (
                <a
                  href={whatsappLink(t(`slides.${currentSlide.key}.whatsappMessage`))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 py-3.5 px-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-colors rounded-full shadow-xl bg-[#25D366] text-white hover:bg-[#128C7E]"
                >
                  <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {t(`slides.${currentSlide.key}.cta`)}
                </a>
              ) : (
                <Link
                  href={currentSlide.link ?? "/"}
                  className="inline-flex items-center gap-3 py-3.5 px-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-colors rounded-full shadow-xl bg-white text-[#0a0e1a] hover:bg-[#006cb7] hover:text-white"
                >
                  {t("readMore")}
                  <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </Link>
              )}

              {currentSlide.secondaryLink && (
                <Link
                  href={currentSlide.secondaryLink}
                  className="inline-flex items-center gap-3 py-3.5 px-6 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-colors rounded-full shadow-xl backdrop-blur-md border bg-white/10 border-white/25 text-white hover:bg-white hover:text-[#0a0e1a]"
                >
                  {t("learnMore")}
                  <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </Link>
              )}
            </div>
          </motion.div>

          {/* Glassmorphic next-activity card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            className="w-full max-w-sm"
          >
            <Link
              href={NEXT_ACTIVITY_HREF}
              className="group block rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.35)] transition-colors hover:bg-white/15 hover:border-white/35"
            >
              <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-white/70 mb-2.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#84BD00] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#84BD00]" />
                </span>
                {t("nextActivity.eyebrow")}
              </span>

              <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight leading-tight">
                {t("nextActivity.title")}
              </h2>

              {t("nextActivity.meta") && (
                <p className="mt-1.5 text-[11px] font-semibold text-white/65">
                  {t("nextActivity.meta")}
                </p>
              )}

              <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                {t("nextActivity.cta")}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ──────────────────── BOOKING FORM ──────────────────── */}
      <section className={`relative z-30 w-full bg-[#F5F2EA] px-4 py-10 md:py-14 ${manrope.className}`}>
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto w-full max-w-6xl"
        >
        <div className="w-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm overflow-hidden border border-gray-200">
            
            <div className="flex w-full bg-[#f3f5f7] border-b border-gray-200">
                {TABS.map((tab) => (
                    <button 
                        key={tab} aria-label={t(`tabs.${tab}`)} onClick={() => { setActiveTab(tab); setPickupCoords(null); setDropoffCoords(null); }} 
                        className={`flex-1 py-3.5 md:py-4 text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative
                        ${activeTab === tab ? "bg-white text-[#006cb7]" : "text-gray-500 hover:text-[#111827]"}`}
                    >
                        {tab === "cityRide" && <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                        {tab === "interCity" && <MapIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                        {tab === "driver" && <Car className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                        <span className="hidden sm:inline">{t(`tabs.${tab}`)}</span>
                        {activeTab === tab && <motion.div layoutId="activeTab" className="absolute top-0 left-0 w-full h-[2px] md:h-[3px] bg-[#006cb7]" />}
                    </button>
                ))}
            </div>

            <div className="p-4 md:p-5 flex flex-col gap-3 bg-white">
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-3">
                        <LocationInput label={t("form.from")} placeholder={t("form.departurePlaceholder")} zIndex="z-50" onSelect={setPickupCoords} />
                    </div>

                    <div className="md:col-span-3 relative z-40 group">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeTab} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                                {activeTab === "cityRide" && (
                                    <LocationInput label={t("form.to")} placeholder={t("form.destinationPlaceholder")} zIndex="z-40" onSelect={setDropoffCoords} />
                                )}
                                {activeTab === "interCity" && (
                                    <div className="flex flex-col">
                                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#006cb7] transition-colors">{t("form.destinationSite")}</label>
                                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#006cb7] focus-within:ring-1 focus-within:ring-[#006cb7] bg-white h-10 transition-all">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                            <select suppressHydrationWarning onChange={(e) => setSelectedSite(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-[#111827] font-bold outline-none appearance-none bg-transparent">
                                                <option value="" className="font-medium text-gray-400">{t("form.selectSite")}</option>
                                                {RWANDA_SITES.map(s => <option key={s.id} value={s.id}>{t(`sites.${s.id}`)}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                                {activeTab === "driver" && (
                                    <div className="flex flex-col">
                                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#006cb7] transition-colors">{t("form.duration")}</label>
                                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#006cb7] focus-within:ring-1 focus-within:ring-[#006cb7] bg-white h-10 transition-all">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                            <select suppressHydrationWarning value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-[#111827] font-bold outline-none appearance-none bg-transparent">
                                                {[3,4,5,6,8,10,12].map(h => <option key={h} value={h}>{t("form.hours", { count: h })}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="md:col-span-3 flex flex-col group z-30">
                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#006cb7] transition-colors">{t("form.departureDate")}</label>
                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#006cb7] focus-within:ring-1 focus-within:ring-[#006cb7] bg-white h-10 transition-all">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input suppressHydrationWarning type="date" className="w-full h-full px-3 pl-9 py-2 text-xs text-[#111827] font-bold outline-none bg-transparent" />
                        </div>
                    </div>

                    <div className="md:col-span-3 flex flex-col group z-20">
                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#006cb7] transition-colors">{t("form.class")}</label>
                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#006cb7] focus-within:ring-1 focus-within:ring-[#006cb7] bg-white h-10 transition-all">
                            <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <select suppressHydrationWarning value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-[#111827] font-bold outline-none appearance-none bg-transparent">
                                {VEHICLES.map(v => (
                                    <option key={v.id} value={v.id}>{t(`vehicles.${v.id}`)}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-3 flex flex-col group z-10">
                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#006cb7] transition-colors">{t("form.passengers")}</label>
                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#006cb7] focus-within:ring-1 focus-within:ring-[#006cb7] bg-white h-10 transition-all">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <select suppressHydrationWarning value={passengers} onChange={(e) => setPassengers(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-[#111827] font-bold outline-none appearance-none bg-transparent">
                                {PASSENGER_OPTIONS.map(p => (
                                    <option key={p} value={p}>{t(`passengerOptions.${p}`)}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="md:col-span-3 flex flex-col group z-10">
                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#006cb7] transition-colors">{t("form.promoCode")}</label>
                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#006cb7] focus-within:ring-1 focus-within:ring-[#006cb7] bg-white h-10 transition-all">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input 
                                suppressHydrationWarning
                                type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                placeholder={t("form.enterCode")} 
                                className="w-full h-full px-3 pl-9 py-2 text-xs text-[#111827] font-bold uppercase outline-none placeholder:text-gray-400 placeholder:font-medium" 
                            />
                        </div>
                    </div>

                    <div className="md:col-span-6 flex gap-3 h-10 z-10">
                        <motion.button 
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                            onClick={handleShowFleet} 
                            className="flex-1 bg-[#006cb7] hover:bg-[#005b9f] text-white flex items-center justify-center text-[10px] md:text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm shadow-sm"
                        >
                            {t("form.showFleet")}
                        </motion.button>
                        <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                            <Link href="/book" className="w-full h-full bg-white border border-gray-300 hover:border-[#006cb7] hover:text-[#006cb7] text-[#111827] flex items-center justify-center text-[10px] md:text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm">
                                {t("form.learnMore")}
                            </Link>
                        </motion.div>
                    </div>
                </div>

            </div>
        </div>
        </motion.div>
      </section>

      {/* ───────────────────── FLEET ESTIMATE ───────────────────── */}
      <AnimatePresence>
        {showModal && estimate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-[#111827]/60 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden">
                <div className="bg-[#006cb7] p-5 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-base font-black uppercase tracking-widest">{estimate.title}</h3>
                        <p className="text-[9px] text-white/80 mt-1 uppercase tracking-widest flex items-center gap-2">
                           <Star size={10} className="fill-current" /> {t(`vehicles.${estimate.vehicleId}`)}
                           {promoCode && <span className="ml-2 bg-[#84BD00] px-2 py-0.5 rounded-sm">{t("estimate.promo")}</span>}
                        </p>
                    </div>
                    <button onClick={() => setShowModal(false)} aria-label={t("estimate.close")} className="p-1.5 hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
                </div>
                
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {estimate.distKm !== null && (
                            <div className="flex flex-col border-b border-gray-100 pb-3">
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">{t("estimate.distance")}</span>
                                <span className="text-xl font-black text-[#111827]">{format.number(estimate.distKm, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km</span>
                            </div>
                        )}
                        <div className="flex flex-col border-b border-gray-100 pb-3">
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">{t("estimate.duration")}</span>
                            <span className="text-xl font-black text-[#111827]">
                                {estimate.minutes > 60
                                    ? t("estimate.hoursMinutes", { hours: Math.floor(estimate.minutes / 60), minutes: estimate.minutes % 60 })
                                    : t("estimate.minutes", { minutes: estimate.minutes })}
                            </span>
                        </div>
                        <div className="flex flex-col col-span-2 bg-gray-50 p-4 rounded-sm border border-gray-100 relative overflow-hidden mt-2">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#84BD00]" />
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">{t("estimate.price")}</span>
                            <span className="text-3xl font-black text-[#84BD00]">{format.number(estimate.price)} RWF</span>
                        </div>
                    </div>

                    <Link href="/book" className="w-full h-12 bg-[#84BD00] hover:bg-[#70a100] text-white flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm shadow-md">
                        {t("estimate.proceed")} <ArrowRight size={14} />
                    </Link>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}