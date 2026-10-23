"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPin, Car, Map as MapIcon, Users, ChevronDown, Sun, Moon, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, Clock, Loader2, Search, X, Tag, Star, Calendar, MessageCircle, type LucideIcon } from "lucide-react";
import { useScrollLock } from "@/lib/use-scroll-lock";
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
import { usePricing } from "@/components/pricing-provider";
import { OPENWEATHER_KEY } from "@/lib/weather";


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

/** Slideshow photos, in order. Files live in public/. */
const HERO_IMAGES: { src: string; position?: string }[] = [
  { src: "/backgrounds/hero1.jpeg" },                                    
  { src: "/backgrounds/hero2.jpg", position: "center 35%" }, 
  { src: "/backgrounds/hero3.jpg" },                    
  { src: "/backgrounds/hero4.png" },                                   
  { src: "/backgrounds/hero5.jpg" },                              
];

/** How long each photo stays before the next one fades in, and how long the fade takes. */
const SLIDE_INTERVAL_MS = 3000;
const CROSSFADE_SECONDS = 1.2;

/**
 * The flyer shown when isEventMode is true (the headline, date and buttons come
 * from Hero.event.*).
 *
 * REMINDER: public/images/activities/bisoke-poster.jpg is a branded placeholder.
 * Replace it with the real poster (same name) before switching isEventMode on.
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
type HeroPlace = { coords: [number, number] | null; name: string };
const NO_PLACE: HeroPlace = { coords: null, name: "" };

/** A picked place as booking-form link parameters, e.g. pickup, pickupLat, pickupLon. */
const placeParams = (prefix: "pickup" | "dropoff", place: HeroPlace): Record<string, string> =>
  place.coords && place.name
    ? { [prefix]: place.name, [`${prefix}Lat`]: place.coords[0].toFixed(5), [`${prefix}Lon`]: place.coords[1].toFixed(5) }
    : {};

/** The head count each passenger option passes on to the booking form. */
const PASSENGER_COUNT: Record<string, number> = { oneAdult: 1, twoAdults: 2, group: 3 };

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
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-2xl border border-muted-foreground/40 bg-background p-0.5">
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
              className={`h-8 px-4 rounded-[2px] text-xs font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                selected ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <span className="text-xs font-semibold text-muted-foreground">{hint}</span>
    </div>
  );
}

function LocationInput({ label, placeholder, zIndex, onSelect }: { label: string, placeholder: string, zIndex: string, onSelect: (coords: [number, number] | null, name: string) => void }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Photon is a free public service and is sometimes slow, rate-limited or
    // unreachable (offline, ad blockers). Then the field just shows no
    // suggestions: the visitor can keep typing, and nothing is logged as an error.
    const controller = new AbortController();
    const delay = setTimeout(async () => {
      if (query.length < 3) return;
      setLoading(true);
      try {
        const url = new URL("https://photon.komoot.io/api/");
        url.searchParams.set("q", query);
        url.searchParams.set("lat", "-1.9441");
        url.searchParams.set("lon", "30.0619");
        url.searchParams.set("limit", "5");
        const giveUp = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(giveUp));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        type PhotonFeature = { properties: { name?: string; city?: string }; geometry: { coordinates: [number, number] } };
        setSuggestions(((data.features ?? []) as PhotonFeature[]).map((f) => ({
            name: [f.properties.name, f.properties.city].filter(Boolean).join(", "),
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0]
        })));
        setShowDropdown(true);
      } catch {
        // Aborted means the visitor typed more and a newer search is on its way.
        if (!controller.signal.aborted) setSuggestions([]);
      }
      setLoading(false);
    }, 500);
    return () => {
      clearTimeout(delay);
      controller.abort(); // drop the answer to an older query
    };
  }, [query]);

  return (
    <div className={`flex flex-col relative ${zIndex} group`}>
        <label className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider group-focus-within:text-primary transition-colors">{label}</label>
        <div className="relative border border-muted-foreground/40 rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all bg-card h-12">
            <input 
                suppressHydrationWarning
                type="text" value={query} onChange={(e) => { setQuery(e.target.value); onSelect(null, ""); }}
                onFocus={() => query.length > 2 && setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder={placeholder} 
                className="w-full h-full px-3 py-2 text-xs text-foreground font-bold outline-none placeholder:text-muted-foreground placeholder:font-medium" 
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-primary" />}
        </div>
        <AnimatePresence>
            {showDropdown && suggestions.length > 0 && (
                <motion.ul initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-[100%] left-0 w-full bg-card border border-border shadow-2xl rounded-2xl max-h-60 overflow-y-auto mt-1 z-50">
                    {suggestions.map((s, idx) => (
                        <li key={idx} onClick={() => { setQuery(s.name); onSelect([s.lat, s.lon], s.name); setShowDropdown(false); }} className="px-3 py-2.5 text-xs leading-snug font-bold text-foreground [overflow-wrap:anywhere] hover:bg-muted/40 hover:text-primary cursor-pointer border-b border-border last:border-0 transition-colors">
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

  // What was picked from the address search: the name is passed on to the booking form.
  const [pickup, setPickup] = useState<HeroPlace>(NO_PLACE);
  const [dropoff, setDropoff] = useState<HeroPlace>(NO_PLACE);
  const pickupCoords = pickup.coords;
  const dropoffCoords = dropoff.coords;
  const [departureDate, setDepartureDate] = useState("");
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [duration, setDuration] = useState("3");
  const [passengers, setPassengers] = useState("oneAdult");
  const [vehicleId, setVehicleId] = useState("sedan");
  const pricing = usePricing();
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
  useScrollLock(showModal && estimate !== null);

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

    const result = quote(trip, vehicleId, pricing);
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
      // Everything typed here goes along, so it needn't be typed again on /book.
      bookHref: `/book?${new URLSearchParams({
        ...booking,
        vehicle: vehicleId,
        ...placeParams("pickup", pickup),
        ...(activeTab === "cityRide" ? placeParams("dropoff", dropoff) : {}),
        ...(departureDate ? { date: departureDate } : {}),
        passengers: String(Math.min(PASSENGER_COUNT[passengers] ?? 1, vehicle.maxPassengers)),
      }).toString()}`,
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
        className={`relative w-full min-h-[100svh] overflow-hidden bg-foreground`}
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
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/45 to-foreground/5" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-transparent to-foreground/45" />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(234,179,8,0.18),transparent_55%)]" />

        {/* Weather and clock sit in a layer the width of the content column, so their
            right edge lines up with the 1400px container instead of the viewport. */}
        <div className="pointer-events-none absolute inset-0 z-30 mx-auto max-w-[1400px]">
        {/* Weather — floating white text, top right */}
        <div className="absolute right-6 md:right-10 top-[calc(var(--header-h)+1.25rem)] z-30 flex items-center gap-2 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
          <CurrentWeatherIcon className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
          <div className="relative h-3.5 md:h-4 w-28 md:w-32 overflow-hidden flex items-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={weatherStatIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-xs md:text-xs font-bold uppercase tracking-widest absolute whitespace-nowrap"
              >
                {weatherStats[weatherStatIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Kigali clock — floating white text, bottom right */}
        <div className="absolute right-6 md:right-10 bottom-8 md:bottom-12 z-30 flex items-center gap-2 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
          <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="text-xs md:text-xs font-bold uppercase tracking-widest tabular-nums">
            {t("clock", { time: kigaliTime ?? "--:--" })}
          </span>
        </div>
        </div>

        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1400px] flex-col px-6 md:px-10 pt-[calc(var(--header-h)+4rem)] pb-20 md:pb-24">
          {showEvent ? (
            /* ── Event flyer ── */
            <div className="my-auto grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-xl flex flex-col items-start gap-4"
              >
                <span className="inline-flex items-center rounded-full bg-secondary px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-widest text-foreground">
                  {t("event.eyebrow")}
                </span>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
                  {t("event.title")}
                </h1>
                <p className="flex items-center gap-2 text-base md:text-lg font-semibold text-white/85">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-secondary" aria-hidden="true" />
                  {t("event.meta")}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={whatsappLink(t("event.whatsappMessage"))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-secondary px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-foreground shadow-lg transition-colors hover:bg-secondary-hover"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    {t("event.cta")}
                  </a>
                  <Link
                    href={EVENT.detailsHref}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-colors hover:bg-card hover:text-foreground"
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
                className="max-w-2xl flex flex-col items-start gap-4"
              >
                <p className="flex items-center gap-3 text-xs md:text-xs font-bold uppercase tracking-widest text-secondary">
                  <span aria-hidden="true" className="h-px w-8 bg-secondary" />
                  {t("welcome.eyebrow")}
                </p>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
                  {t("welcome.title")}
                </h1>
                <p className="max-w-xl text-base md:text-lg leading-relaxed text-white/85 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                  {t("welcome.subtitle")}
                </p>
                <div className="mt-4 md:mt-6">
                  {/* A text link, not a button: brand yellow, arrow slides on hover */}
                  <Link
                    href={EXPERIENCES_HREF}
                    className="group inline-flex min-h-12 items-center gap-2.5 rounded-2xl py-1 text-xs md:text-sm font-bold uppercase tracking-widest text-secondary drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] transition-colors hover:text-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-4 focus-visible:ring-offset-foreground"
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
                  className="group block rounded-2xl border border-white/20 bg-foreground/45 p-5 md:p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors hover:border-white/35 hover:bg-foreground/60"
                >
                  <span className="mb-2.5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-white/75">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75 motion-reduce:animate-none" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-secondary" />
                    </span>
                    {t("nextActivity.eyebrow")}
                  </span>
                  <h2 className="text-lg md:text-xl font-extrabold leading-tight tracking-tight text-white">
                    {t("nextActivity.title")}
                  </h2>
                  {t("nextActivity.meta") && (
                    <p className="mt-1.5 text-xs font-semibold text-white/70">{t("nextActivity.meta")}</p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-white">
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
      <section id={QUOTE_SECTION_ID} className={`relative z-30 w-full bg-background pt-10 md:pt-14 pb-24 md:pb-32`}>
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto w-full max-w-[1400px] px-6 md:px-10"
        >
        {/* No overflow-hidden here: the place-search dropdowns must be able to hang below the card. */}
        <div className="w-full bg-card shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl border border-border">

            <div className="flex w-full bg-background border-b border-border rounded-t-2xl overflow-hidden">
                {TABS.map((tab) => (
                    <button 
                        key={tab} aria-label={t(`tabs.${tab}`)} onClick={() => { setActiveTab(tab); setPickup(NO_PLACE); setDropoff(NO_PLACE); }} 
                        className={`flex-1 py-3.5 md:py-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative
                        ${activeTab === tab ? "bg-card text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        {tab === "cityRide" && <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                        {tab === "interCity" && <MapIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                        {tab === "driver" && <Car className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                        <span className="hidden sm:inline">{t(`tabs.${tab}`)}</span>
                        {activeTab === tab && <motion.div layoutId="activeTab" className="absolute top-0 left-0 w-full h-[2px] md:h-[3px] bg-primary" />}
                    </button>
                ))}
            </div>

            <div className="p-4 md:p-5 flex flex-col gap-3 bg-card rounded-b-2xl">

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
                        <LocationInput label={t("form.from")} placeholder={t("form.departurePlaceholder")} zIndex="z-50" onSelect={(coords, name) => setPickup({ coords, name })} />
                    </div>

                    <div className="md:col-span-3 relative z-40 group">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeTab} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                                {activeTab === "cityRide" && (
                                    <LocationInput label={t("form.to")} placeholder={t("form.destinationPlaceholder")} zIndex="z-40" onSelect={(coords, name) => setDropoff({ coords, name })} />
                                )}
                                {activeTab === "interCity" && (
                                    <div className="flex flex-col">
                                        <label className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider group-focus-within:text-primary transition-colors">{t("form.destinationSite")}</label>
                                        <div className="relative border border-muted-foreground/40 rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-card h-12 transition-all">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                            <select suppressHydrationWarning aria-label={t("form.destinationSite")} onChange={(e) => setSelectedSite(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-foreground font-bold outline-none appearance-none bg-transparent">
                                                <option value="" className="font-medium text-muted-foreground">{t("form.selectSite")}</option>
                                                {HERO_DESTINATION_IDS.map(id => <option key={id} value={id}>{t(`sites.${id}`)}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                                {activeTab === "driver" && (
                                    <div className="flex flex-col">
                                        <label className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider group-focus-within:text-primary transition-colors">{t("form.duration")}</label>
                                        <div className="relative border border-muted-foreground/40 rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-card h-12 transition-all">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                            <select suppressHydrationWarning aria-label={t("form.duration")} value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-foreground font-bold outline-none appearance-none bg-transparent">
                                                {HIRE_HOUR_OPTIONS.map(h => <option key={h} value={h}>{t("form.hours", { count: h })}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="md:col-span-3 flex flex-col group z-30">
                        <label className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider group-focus-within:text-primary transition-colors">{t("form.departureDate")}</label>
                        <div className="relative border border-muted-foreground/40 rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-card h-12 transition-all">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input suppressHydrationWarning type="date" aria-label={t("form.departureDate")} value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-foreground font-bold outline-none bg-transparent" />
                        </div>
                    </div>

                    <div className="md:col-span-3 flex flex-col group z-20">
                        <label className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider group-focus-within:text-primary transition-colors">{t("form.class")}</label>
                        <div className="relative border border-muted-foreground/40 rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-card h-12 transition-all">
                            <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <select suppressHydrationWarning aria-label={t("form.class")} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-foreground font-bold outline-none appearance-none bg-transparent">
                                {VEHICLES.map(v => (
                                    <option key={v.id} value={v.id}>{t(`vehicles.${v.id}`)}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-3 flex flex-col group z-10">
                        <label className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider group-focus-within:text-primary transition-colors">{t("form.passengers")}</label>
                        <div className="relative border border-muted-foreground/40 rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-card h-12 transition-all">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <select suppressHydrationWarning aria-label={t("form.passengers")} value={passengers} onChange={(e) => setPassengers(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-foreground font-bold outline-none appearance-none bg-transparent">
                                {PASSENGER_OPTIONS.map(p => (
                                    <option key={p} value={p}>{t(`passengerOptions.${p}`)}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    <div className="md:col-span-3 flex flex-col group z-10">
                        <label className="text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider group-focus-within:text-primary transition-colors">{t("form.promoCode")}</label>
                        <div className="relative border border-muted-foreground/40 rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-card h-12 transition-all">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input 
                                suppressHydrationWarning
                                type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                placeholder={t("form.enterCode")} 
                                className="w-full h-full px-3 pl-9 py-2 text-xs text-foreground font-bold uppercase outline-none placeholder:text-muted-foreground placeholder:font-medium" 
                            />
                        </div>
                    </div>

                    <div className="md:col-span-6 flex gap-3 h-12 z-10">
                        <motion.button 
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                            onClick={handleShowFleet} 
                            className="flex-1 bg-primary hover:bg-primary-hover text-white flex items-center justify-center text-xs md:text-xs font-bold uppercase tracking-wider transition-colors rounded-2xl shadow-sm"
                        >
                            {t("form.showFleet")}
                        </motion.button>
                        <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                            <Link href="/how-it-works" className="w-full h-full bg-card border border-muted-foreground/40 hover:border-primary hover:text-primary text-foreground flex items-center justify-center text-xs md:text-xs font-bold uppercase tracking-wider transition-colors rounded-2xl">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-primary p-5 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-base font-extrabold uppercase tracking-widest">{estimate.title}</h3>
                        <p className="text-xs text-white/80 mt-1 uppercase tracking-widest flex items-center gap-2">
                           <Star size={10} className="fill-current" /> {t(`vehicles.${estimate.vehicleId}`)} · {estimate.option}
                           {promoCode && <span className="ml-2 bg-secondary px-2 py-0.5 rounded-2xl">{t("estimate.promo")}</span>}
                        </p>
                    </div>
                    <button onClick={() => setShowModal(false)} aria-label={t("estimate.close")} className="flex h-12 w-12 items-center justify-center hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
                </div>
                
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {estimate.distKm !== null && (
                            <div className="flex flex-col border-b border-border pb-3">
                                <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-bold">{t("estimate.distance")}</span>
                                <span className="text-xl font-extrabold text-foreground">{format.number(estimate.distKm, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km</span>
                            </div>
                        )}
                        <div className="flex flex-col border-b border-border pb-3">
                            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-bold">{t("estimate.duration")}</span>
                            <span className="text-xl font-extrabold text-foreground">
                                {estimate.minutes > 60
                                    ? t("estimate.hoursMinutes", { hours: Math.floor(estimate.minutes / 60), minutes: estimate.minutes % 60 })
                                    : t("estimate.minutes", { minutes: estimate.minutes })}
                            </span>
                        </div>
                        <div className="flex flex-col col-span-2 bg-muted/40 p-4 rounded-2xl border border-border relative overflow-hidden mt-2">
                            <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
                            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-bold">{t("estimate.price")}</span>
                            <span className="text-3xl font-extrabold text-primary">{format.number(estimate.price)} RWF</span>
                            <span className="mt-2 text-xs font-semibold text-muted-foreground">{t(`estimate.notes.${estimate.note}`)}</span>
                        </div>
                    </div>

                    <Link href={estimate.bookHref} className="w-full h-12 bg-secondary hover:bg-secondary-hover text-foreground flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors rounded-2xl shadow-md">
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