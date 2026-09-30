"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPin, Car, Map as MapIcon, Users, ChevronDown, Sun, Moon, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, Clock, Loader2, Search, X, Tag, Star, Calendar, MessageCircle, type LucideIcon } from "lucide-react";
import { Manrope } from "next/font/google";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  HERO_DESTINATION_IDS,
  HIRE_HOUR_OPTIONS,
  VEHICLES,
  getDestination,
  getVehicle,
  priceNoteKind,
  quote,
  roadDistanceKm,
  trips,
  type CityRideMode,
  type PriceNoteKind,
  type Trip,
} from "@/lib/pricing";
import { OPENWEATHER_KEY } from "@/lib/weather";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

const API_KEY = OPENWEATHER_KEY;
const CITY = "Kigali";
// Tab labels live in messages/*.json under Hero.tabs.<id>
type TabId = "cityRide" | "interCity" | "driver";
const TABS: TabId[] = ["cityRide", "interCity", "driver"];

const WHATSAPP_NUMBER = "250788564000";
const whatsappLink = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

// ── Hero setup ──────────────────────────────────────────────────────────────
// Every text in the hero lives in messages/en.json + messages/fr.json under
// Hero.welcome, Hero.event, Hero.nextActivity, Hero.weather and Hero.clock.

/**
 * false → the welcoming hero: the photos in HERO_IMAGES fade into each other.
 * true  → the slideshow is skipped and the event flyer (EVENT below) fills the hero.
 */
const isEventMode = false;

/** Slideshow photos, in order. Files live in public/ (write the path without "public"). */
const HERO_IMAGES: { src: string; position?: string }[] = [
  { src: "/backgrounds/h.jpg" },                                    // Kigali, from the air
  { src: "/backgrounds/sura-experience.jpeg", position: "center 35%" }, // a SURA group in Nyungwe
  { src: "/backgrounds/sura-experience2.jpg" },                     // Volcanoes National Park
  { src: "/nyungwe-hero-bg.jpg" },                                   // Nyungwe forest
  { src: "/activities/akagera/1.jpg" },                              // Akagera wildlife
];

/** How long each photo stays before the next one fades in, and how long the fade takes. */
const SLIDE_INTERVAL_MS = 3000;
const CROSSFADE_SECONDS = 1.2;

/**
 * The flyer shown when isEventMode is true (the headline, date and buttons come
 * from Hero.event.*).
 *
 * REMINDER: put the poster in public/images/activities/ with exactly this name:
 * bisoke-poster.jpg. Switch isEventMode on only once the file is there.
 */
const EVENT = {
  poster: "/images/activities/bisoke-poster.jpg",
  /** Where "Event Details" goes. */
  detailsHref: "/events",
  /**
   * Optional last day of the event (YYYY-MM-DD, Kigali time). After that day the
   * hero goes back to the slideshow on its own, even if isEventMode is still true.
   */
  lastDay: undefined as string | undefined,
};

/** Where the "Explore Experiences" button and the next-adventure card send visitors. */
const EXPERIENCES_HREF = "/events";

/** Anchor of the quick-quote card below the hero (e.g. /#quote). */
const QUOTE_SECTION_ID = "quote";

// ── Kigali time ────────────────────────────────────────────────────────────
// Always Rwanda time (CAT), whatever time zone the visitor is in.
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

/**
 * Background photos that cross-fade every SLIDE_INTERVAL_MS, with no controls.
 * All photos stay mounted so each fade is instant; the slideshow waits while the
 * tab is hidden, and visitors who ask for reduced motion get the first photo only.
 */
function HeroSlideshow() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || HERO_IMAGES.length < 2) return;
    const id = setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const active = reduceMotion ? 0 : index;
  return (
    <div aria-hidden="true" className="absolute inset-0" data-slide={active}>
      {HERO_IMAGES.map((image, i) => (
        <motion.div
          key={image.src}
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: i === active ? 1 : 0, scale: i === active || reduceMotion ? 1 : 1.05 }}
          transition={{
            opacity: { duration: CROSSFADE_SECONDS, ease: "easeInOut" },
            scale: { duration: SLIDE_INTERVAL_MS / 1000 + CROSSFADE_SECONDS, ease: "linear" },
          }}
        >
          <Image
            src={image.src}
            alt=""
            fill
            sizes="100vw"
            preload={i === 0}
            className="object-cover"
            style={{ objectPosition: image.position ?? "center" }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/** The event flyer, uncropped, whatever its proportions. */
function EventPoster({ alt }: { alt: string }) {
  return (
    <Image
      src={EVENT.poster}
      alt={alt}
      width={0}
      height={0}
      sizes="(min-width: 1024px) 34vw, 88vw"
      preload
      className="h-auto max-h-[46svh] w-auto max-w-full rounded-2xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/15 lg:max-h-[68svh]"
    />
  );
}

// Prices, destinations (with their distances) and vehicle classes all come from
// lib/pricing.ts. Names live in messages/*.json under Hero.sites.<id> and Hero.vehicles.<id>.

// Option labels live in messages/*.json under Hero.passengerOptions.<id>
const PASSENGER_OPTIONS = ["oneAdult", "twoAdults", "group"];

/** Two-way segmented switch: Cab / Private, or With Driver / Self-Drive. */
function ChoiceSwitch<T extends string>({ label, value, options, onChange, hint }: {
  label: string;
  value: T;
  options: { id: T; label: string; disabled?: boolean }[];
  onChange: (value: T) => void;
  hint: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-sm border border-gray-300 bg-[#F9F8F6] p-0.5">
        {options.map((o) => {
          const selected = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={o.disabled}
              onClick={() => onChange(o.id)}
              className={`h-8 px-4 rounded-[2px] text-[10px] font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                selected ? "bg-[#125740] text-white shadow-sm" : "text-gray-500 hover:text-[#0A1128]"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <span className="text-[10px] font-semibold text-gray-500">{hint}</span>
    </div>
  );
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
        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#125740] transition-colors">{label}</label>
        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#125740] focus-within:ring-1 focus-within:ring-[#125740] transition-all bg-white h-10">
            <input 
                suppressHydrationWarning
                type="text" value={query} onChange={(e) => { setQuery(e.target.value); onSelect(null); }}
                onFocus={() => query.length > 2 && setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder={placeholder} 
                className="w-full h-full px-3 py-2 text-xs text-[#0A1128] font-bold outline-none placeholder:text-gray-400 placeholder:font-medium" 
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-[#125740]" />}
        </div>
        <AnimatePresence>
            {showDropdown && suggestions.length > 0 && (
                <motion.ul initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-[100%] left-0 w-full bg-white border border-gray-200 shadow-2xl rounded-sm max-h-48 overflow-y-auto mt-1 z-50">
                    {suggestions.map((s, idx) => (
                        <li key={idx} onClick={() => { setQuery(s.name); onSelect([s.lat, s.lon]); setShowDropdown(false); }} className="px-3 py-2.5 text-[10px] font-bold text-[#0A1128] hover:bg-gray-50 hover:text-[#125740] cursor-pointer border-b border-gray-100 last:border-0 transition-colors">
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

  // Event mode shows the flyer until EVENT.lastDay (if set) has passed in Kigali.
  // The server doesn't know today's date, so that check happens right after hydration.
  const kigaliToday = useSyncExternalStore(subscribeToClock, getKigaliDate, getServerSnapshot);
  const showEvent =
    isEventMode && !(EVENT.lastDay !== undefined && kigaliToday !== null && EVENT.lastDay < kigaliToday);

  const [weather, setWeather] = useState<{ temp: number; condition: string; humidity: number; wind: number; precip: number } | null>(null);
  const [weatherStatIndex, setWeatherStatIndex] = useState(0);

  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [duration, setDuration] = useState("3");
  const [passengers, setPassengers] = useState("oneAdult");
  const [vehicleId, setVehicleId] = useState("sedan");
  const [promoCode, setPromoCode] = useState("");
  // City Ride: Cab or Private. Inter-City and Hourly: with a driver or self-drive.
  const [rideMode, setRideMode] = useState<CityRideMode>("cab");
  const [withDriver, setWithDriver] = useState(true);

  // Coach has no cab fares; Premium SUV, Luxury SUV and Coach are with-driver only.
  // The visitor's own choice comes back if they switch to a class that offers it.
  const vehicle = getVehicle(vehicleId);
  const cabAllowed = vehicle.cab !== null;
  const selfDriveAllowed = vehicle.selfDrive;
  const effectiveRideMode: CityRideMode = cabAllowed ? rideMode : "private";
  const effectiveWithDriver = selfDriveAllowed ? withDriver : true;

  const [showModal, setShowModal] = useState(false);
  // Raw numbers; they're formatted for the current language when the modal renders.
  const [estimate, setEstimate] = useState<{ distKm: number | null; minutes: number; price: number; title: string; vehicleId: string; option: string; note: PriceNoteKind; bookHref: string } | null>(null);

  const handleShowFleet = () => {
    // Build the trip, then let lib/pricing.ts price it.
    let trip: Trip | null = null;
    let minutes = 0;
    let title = "";
    // The same choices as URL parameters, so "Proceed to Booking" opens the
    // booking form with this trip already selected (see booking-form.tsx).
    let booking: Record<string, string> = {};
    const driver = effectiveWithDriver ? "with" : "self";

    if (activeTab === "cityRide") {
      if (!pickupCoords || !dropoffCoords) return alert(t("errors.pickupAndDestination"));
      const km = roadDistanceKm(pickupCoords, dropoffCoords);
      trip = trips.cityRide(effectiveRideMode, km);
      minutes = Math.round(km * 3.5);
      title = t("estimate.cityTitle");
      booking = { tab: "city", serviceType: "inter_city", rideMode: effectiveRideMode };
    }
    else if (activeTab === "interCity") {
      if (!pickupCoords || !selectedSite) return alert(t("errors.pickupAndSite"));
      const site = getDestination(selectedSite);
      trip = trips.destination(selectedSite, { withDriver: effectiveWithDriver });
      if (!site || !trip) return;
      minutes = Math.round(site.km * 1.5);
      title = t("estimate.siteTitle", { site: t(`sites.${site.id}`) });
      booking = { tab: "country", dest: site.id, driver };
    }
    else if (activeTab === "driver") {
      if (!pickupCoords) return alert(t("errors.pickup"));
      const hours = parseInt(duration, 10);
      trip = trips.hourly(hours, { withDriver: effectiveWithDriver });
      minutes = hours * 60;
      title = t("estimate.driverTitle", { hours });
      booking = { tab: "hourly", hours: String(hours), driver };
    }
    if (!trip) return;

    const result = quote(trip, vehicleId);
    setEstimate({
      distKm: activeTab === "driver" ? null : result.distanceKm,
      minutes,
      price: result.total,
      title,
      vehicleId,
      option:
        activeTab === "cityRide"
          ? t(`modes.${result.method === "cab" ? "cab" : "private"}`)
          : t(result.withDriver ? "modes.withDriver" : "modes.selfDrive"),
      // What the total covers: fixed fare (Cab), vehicle + fuel (self-drive), or + service fee (with a driver).
      note: priceNoteKind(result),
      bookHref: `/book?${new URLSearchParams({ ...booking, vehicle: vehicleId }).toString()}`,
    });
    setShowModal(true);
  };

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

  /*
   * Layout: the alert bar + header (101px tall on mobile, 109px from md up) are
   * fixed and sit on top of the hero, so the content starts below them. The text
   * shares the header's 1400px container, so left edges line up. The quick-quote
   * card is its own section right below the hero (id="quote").
   */
  return (
    <>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section
        aria-label={showEvent ? t("event.title") : t("welcome.title")}
        className={`relative w-full min-h-[100svh] overflow-hidden bg-[#0A1128] ${manrope.className}`}
        data-hero-mode={showEvent ? "event" : "slideshow"}
      >
        {/* Background: the slideshow, or the flyer blurred into a backdrop */}
        {showEvent ? (
          <div aria-hidden="true" className="absolute inset-0">
            <div
              className="absolute inset-0 scale-110 bg-cover bg-center opacity-60 blur-2xl"
              style={{ backgroundImage: `url("${EVENT.poster}")` }}
            />
          </div>
        ) : (
          <HeroSlideshow />
        )}

        {/* Warm scrims: darker behind the text on the left and along the bottom, a soft gold glow */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#0A1128]/85 via-[#0A1128]/45 to-[#0A1128]/5" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0A1128]/85 via-transparent to-[#0A1128]/45" />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(234,179,8,0.18),transparent_55%)]" />

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

        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1400px] flex-col px-6 md:px-10 pt-[150px] md:pt-[170px] pb-20 md:pb-24">
          {showEvent ? (
            /* ── Event flyer ── */
            <div className="my-auto grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-xl"
              >
                <span className="inline-flex items-center rounded-full bg-[#EAB308] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#0A1128]">
                  {t("event.eyebrow")}
                </span>
                <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
                  {t("event.title")}
                </h1>
                <p className="mt-4 flex items-center gap-2 text-base md:text-lg font-semibold text-white/85">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-[#EAB308]" aria-hidden="true" />
                  {t("event.meta")}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={whatsappLink(t("event.whatsappMessage"))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#EAB308] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0A1128] shadow-lg transition-colors hover:bg-[#CA9A04]"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    {t("event.cta")}
                  </a>
                  <Link
                    href={EVENT.detailsHref}
                    className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[#0A1128]"
                  >
                    {t("event.details")}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
                className="justify-self-center lg:justify-self-end"
              >
                <EventPoster alt={t("event.posterAlt")} />
              </motion.div>
            </div>
          ) : (
            /* ── Welcome: headline on the left, next adventure on the right ── */
            <div className="my-auto grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-2xl"
              >
                <p className="flex items-center gap-3 text-[11px] md:text-xs font-bold uppercase tracking-[0.3em] text-[#EAB308]">
                  <span aria-hidden="true" className="h-px w-8 bg-[#EAB308]" />
                  {t("welcome.eyebrow")}
                </p>
                <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
                  {t("welcome.title")}
                </h1>
                <p className="mt-5 md:mt-6 max-w-xl text-base md:text-lg leading-relaxed text-white/85 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                  {t("welcome.subtitle")}
                </p>
                <div className="mt-8 md:mt-10">
                  {/* A text link, not a button: brand yellow, arrow slides on hover */}
                  <Link
                    href={EXPERIENCES_HREF}
                    className="group inline-flex items-center gap-2.5 rounded-sm py-1 text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#EAB308] drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] transition-colors hover:text-[#FACC15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0A1128]"
                  >
                    <span className="relative">
                      {t("welcome.secondaryCta")}
                      <span aria-hidden="true" className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none" />
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5 motion-reduce:transition-none" aria-hidden="true" />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
                className="w-full max-w-sm md:justify-self-end lg:max-w-none"
              >
                <Link
                  href={EXPERIENCES_HREF}
                  className="group block rounded-2xl border border-white/20 bg-[#0A1128]/45 p-5 md:p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors hover:border-white/35 hover:bg-[#0A1128]/60"
                >
                  <span className="mb-2.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/75">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EAB308] opacity-75 motion-reduce:animate-none" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#EAB308]" />
                    </span>
                    {t("nextActivity.eyebrow")}
                  </span>
                  <h2 className="text-lg md:text-xl font-extrabold leading-tight tracking-tight text-white">
                    {t("nextActivity.title")}
                  </h2>
                  {t("nextActivity.meta") && (
                    <p className="mt-1.5 text-xs font-semibold text-white/70">{t("nextActivity.meta")}</p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    {t("nextActivity.cta")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────── BOOKING FORM ──────────────────── */}
      <section id={QUOTE_SECTION_ID} className={`relative z-30 w-full scroll-mt-[101px] md:scroll-mt-[109px] bg-[#F9F8F6] px-4 py-10 md:py-14 ${manrope.className}`}>
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto w-full max-w-6xl"
        >
        <div className="w-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm overflow-hidden border border-gray-200">
            
            <div className="flex w-full bg-[#F9F8F6] border-b border-gray-200">
                {TABS.map((tab) => (
                    <button 
                        key={tab} aria-label={t(`tabs.${tab}`)} onClick={() => { setActiveTab(tab); setPickupCoords(null); setDropoffCoords(null); }} 
                        className={`flex-1 py-3.5 md:py-4 text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative
                        ${activeTab === tab ? "bg-white text-[#125740]" : "text-gray-500 hover:text-[#0A1128]"}`}
                    >
                        {tab === "cityRide" && <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                        {tab === "interCity" && <MapIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                        {tab === "driver" && <Car className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                        <span className="hidden sm:inline">{t(`tabs.${tab}`)}</span>
                        {activeTab === tab && <motion.div layoutId="activeTab" className="absolute top-0 left-0 w-full h-[2px] md:h-[3px] bg-[#125740]" />}
                    </button>
                ))}
            </div>

            <div className="p-4 md:p-5 flex flex-col gap-3 bg-white">

                {/* City Ride: Cab / Private · Inter-City and Hourly: With Driver / Self-Drive */}
                {activeTab === "cityRide" ? (
                    <ChoiceSwitch<CityRideMode>
                        label={t("modes.rideLabel")}
                        value={effectiveRideMode}
                        onChange={setRideMode}
                        options={[
                            { id: "cab", label: t("modes.cab"), disabled: !cabAllowed },
                            { id: "private", label: t("modes.private") },
                        ]}
                        hint={
                            cabAllowed
                                ? t(effectiveRideMode === "cab" ? "modes.cabHint" : "modes.privateHint")
                                : t("modes.cabUnavailable", { vehicle: t(`vehicles.${vehicle.id}`) })
                        }
                    />
                ) : (
                    <ChoiceSwitch<"with" | "self">
                        label={t("modes.driverLabel")}
                        value={effectiveWithDriver ? "with" : "self"}
                        onChange={(choice) => setWithDriver(choice === "with")}
                        options={[
                            { id: "with", label: t("modes.withDriver") },
                            { id: "self", label: t("modes.selfDrive"), disabled: !selfDriveAllowed },
                        ]}
                        hint={
                            selfDriveAllowed
                                ? t(effectiveWithDriver ? "modes.withDriverHint" : "modes.selfDriveHint")
                                : t("modes.chauffeurOnly", { vehicle: t(`vehicles.${vehicle.id}`) })
                        }
                    />
                )}

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
                                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#125740] transition-colors">{t("form.destinationSite")}</label>
                                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#125740] focus-within:ring-1 focus-within:ring-[#125740] bg-white h-10 transition-all">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                            <select suppressHydrationWarning aria-label={t("form.destinationSite")} onChange={(e) => setSelectedSite(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-[#0A1128] font-bold outline-none appearance-none bg-transparent">
                                                <option value="" className="font-medium text-gray-400">{t("form.selectSite")}</option>
                                                {HERO_DESTINATION_IDS.map(id => <option key={id} value={id}>{t(`sites.${id}`)}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                                {activeTab === "driver" && (
                                    <div className="flex flex-col">
                                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#125740] transition-colors">{t("form.duration")}</label>
                                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#125740] focus-within:ring-1 focus-within:ring-[#125740] bg-white h-10 transition-all">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                            <select suppressHydrationWarning aria-label={t("form.duration")} value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-[#0A1128] font-bold outline-none appearance-none bg-transparent">
                                                {HIRE_HOUR_OPTIONS.map(h => <option key={h} value={h}>{t("form.hours", { count: h })}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="md:col-span-3 flex flex-col group z-30">
                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#125740] transition-colors">{t("form.departureDate")}</label>
                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#125740] focus-within:ring-1 focus-within:ring-[#125740] bg-white h-10 transition-all">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input suppressHydrationWarning type="date" aria-label={t("form.departureDate")} className="w-full h-full px-3 pl-9 py-2 text-xs text-[#0A1128] font-bold outline-none bg-transparent" />
                        </div>
                    </div>

                    <div className="md:col-span-3 flex flex-col group z-20">
                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#125740] transition-colors">{t("form.class")}</label>
                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#125740] focus-within:ring-1 focus-within:ring-[#125740] bg-white h-10 transition-all">
                            <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <select suppressHydrationWarning aria-label={t("form.class")} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-[#0A1128] font-bold outline-none appearance-none bg-transparent">
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
                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#125740] transition-colors">{t("form.passengers")}</label>
                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#125740] focus-within:ring-1 focus-within:ring-[#125740] bg-white h-10 transition-all">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <select suppressHydrationWarning aria-label={t("form.passengers")} value={passengers} onChange={(e) => setPassengers(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-[#0A1128] font-bold outline-none appearance-none bg-transparent">
                                {PASSENGER_OPTIONS.map(p => (
                                    <option key={p} value={p}>{t(`passengerOptions.${p}`)}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="md:col-span-3 flex flex-col group z-10">
                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#125740] transition-colors">{t("form.promoCode")}</label>
                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#125740] focus-within:ring-1 focus-within:ring-[#125740] bg-white h-10 transition-all">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input 
                                suppressHydrationWarning
                                type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                placeholder={t("form.enterCode")} 
                                className="w-full h-full px-3 pl-9 py-2 text-xs text-[#0A1128] font-bold uppercase outline-none placeholder:text-gray-400 placeholder:font-medium" 
                            />
                        </div>
                    </div>

                    <div className="md:col-span-6 flex gap-3 h-10 z-10">
                        <motion.button 
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                            onClick={handleShowFleet} 
                            className="flex-1 bg-[#125740] hover:bg-[#0E4231] text-white flex items-center justify-center text-[10px] md:text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm shadow-sm"
                        >
                            {t("form.showFleet")}
                        </motion.button>
                        <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                            <Link href="/book" className="w-full h-full bg-white border border-gray-300 hover:border-[#125740] hover:text-[#125740] text-[#0A1128] flex items-center justify-center text-[10px] md:text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-[#0A1128]/60 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden">
                <div className="bg-[#125740] p-5 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-base font-black uppercase tracking-widest">{estimate.title}</h3>
                        <p className="text-[9px] text-white/80 mt-1 uppercase tracking-widest flex items-center gap-2">
                           <Star size={10} className="fill-current" /> {t(`vehicles.${estimate.vehicleId}`)} · {estimate.option}
                           {promoCode && <span className="ml-2 bg-[#EAB308] px-2 py-0.5 rounded-sm">{t("estimate.promo")}</span>}
                        </p>
                    </div>
                    <button onClick={() => setShowModal(false)} aria-label={t("estimate.close")} className="p-1.5 hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
                </div>
                
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {estimate.distKm !== null && (
                            <div className="flex flex-col border-b border-gray-100 pb-3">
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">{t("estimate.distance")}</span>
                                <span className="text-xl font-black text-[#0A1128]">{format.number(estimate.distKm, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km</span>
                            </div>
                        )}
                        <div className="flex flex-col border-b border-gray-100 pb-3">
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">{t("estimate.duration")}</span>
                            <span className="text-xl font-black text-[#0A1128]">
                                {estimate.minutes > 60
                                    ? t("estimate.hoursMinutes", { hours: Math.floor(estimate.minutes / 60), minutes: estimate.minutes % 60 })
                                    : t("estimate.minutes", { minutes: estimate.minutes })}
                            </span>
                        </div>
                        <div className="flex flex-col col-span-2 bg-gray-50 p-4 rounded-sm border border-gray-100 relative overflow-hidden mt-2">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#EAB308]" />
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">{t("estimate.price")}</span>
                            <span className="text-3xl font-black text-[#125740]">{format.number(estimate.price)} RWF</span>
                            <span className="mt-2 text-[11px] font-semibold text-gray-500">{t(`estimate.notes.${estimate.note}`)}</span>
                        </div>
                    </div>

                    <Link href={estimate.bookHref} className="w-full h-12 bg-[#EAB308] hover:bg-[#CA9A04] text-[#0A1128] flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm shadow-md">
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