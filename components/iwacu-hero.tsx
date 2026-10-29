"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Sun, Moon, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, Clock, Calendar, MessageCircle, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { OPENWEATHER_KEY } from "@/lib/weather";
import { useSiteContact } from "@/components/site-settings-provider";
import { whatsAppHref } from "@/lib/cms/site-settings";
import type { IwacuSpotlight } from "@/lib/cms/site-data";

const API_KEY = OPENWEATHER_KEY;
const CITY = "Kigali";

// ── Hero setup ──────────────────────────────────────────────────────────────
// Words live in messages/*.json under Brands.iwacu.home (the welcome), and
// Hero.event, Hero.nextActivity, Hero.weather and Hero.clock.

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

/** Where "Explore experiences" goes. */
const EXPERIENCES_HREF = "/iwacu/experiences";

// ── Kigali time ────────────────────────────────────────────────────────────
// Always Rwanda time (CAT), whatever time zone the visitor is in.
const KIGALI_TIME = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Kigali", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

const subscribeToClock = (onTick: () => void) => {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
};
const getKigaliTime = () => KIGALI_TIME.format(new Date()); // "14:25"
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

/** The promoted experience's flyer, uncropped whatever its proportions; or its photo, framed. */
function SpotlightImage({ spot }: { spot: IwacuSpotlight }) {
  if (spot.isFlyer) {
    return (
      <Image
        src={spot.image}
        alt={spot.title}
        width={0}
        height={0}
        sizes="(min-width: 1024px) 34vw, 88vw"
        preload
        className="h-auto max-h-[46svh] w-auto max-w-full rounded-2xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/15 lg:max-h-[68svh]"
      />
    );
  }
  return (
    <span className="relative block aspect-[4/5] w-[min(88vw,22rem)] overflow-hidden rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/15 lg:w-[26rem]">
      <Image src={spot.image} alt={spot.title} fill sizes="(min-width: 1024px) 26rem, 88vw" preload className="object-cover" />
    </span>
  );
}

/**
 * The Iwacu home hero. With a `promoted` experience (Admin → Experiences →
 * "Promote on the homepage hero") its flyer fills the hero until its promotion
 * ends; otherwise the photo slideshow welcomes visitors, with `next` beside it.
 */
export function IwacuHero({ promoted, next }: { promoted: IwacuSpotlight | null; next: IwacuSpotlight | null }) {
  const contact = useSiteContact();
  const t = useTranslations("Hero");
  const tHome = useTranslations("Brands.iwacu.home");
  const kigaliTime = useSyncExternalStore(subscribeToClock, getKigaliTime, getServerSnapshot);

  const [weather, setWeather] = useState<{ temp: number; condition: string; humidity: number; wind: number; precip: number } | null>(null);
  const [weatherStatIndex, setWeatherStatIndex] = useState(0);

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
   * Layout: the alert bar + header (--header-h) are fixed and sit on top of the
   * hero, so the content starts below them. The text shares the header's 1400px
   * container, so left edges line up.
   */
  return (
    <section
      aria-label={promoted ? promoted.title : tHome("title")}
      className="relative w-full min-h-[100svh] overflow-hidden bg-foreground"
      data-hero-mode={promoted ? "event" : "slideshow"}
    >
      {/* Background: the slideshow, or the flyer blurred into a backdrop */}
      {promoted ? (
        <div aria-hidden="true" className="absolute inset-0">
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-60 blur-2xl"
            style={{ backgroundImage: `url("${promoted.image}")` }}
          />
        </div>
      ) : (
        <HeroSlideshow />
      )}

      {/* Warm scrims: darker behind the text on the left and along the bottom, a soft gold glow */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/45 to-foreground/5" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-transparent to-foreground/45" />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,color-mix(in_oklab,var(--secondary)_18%,transparent),transparent_55%)]" />

      {/* Weather and clock sit in a layer the width of the content column, so their
          right edge lines up with the 1400px container instead of the viewport. */}
      <div className="pointer-events-none absolute inset-0 z-30 mx-auto max-w-[1400px]">
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
                className="text-xs font-bold uppercase tracking-widest absolute whitespace-nowrap"
              >
                {weatherStats[weatherStatIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute right-6 md:right-10 bottom-8 md:bottom-12 z-30 flex items-center gap-2 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
          <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="text-xs font-bold uppercase tracking-widest tabular-nums">
            {t("clock", { time: kigaliTime ?? "--:--" })}
          </span>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1400px] flex-col px-6 md:px-10 pt-[calc(var(--header-h)+4rem)] pb-20 md:pb-24">
        {promoted ? (
          /* ── The promoted experience ── */
          <div className="my-auto grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-xl flex flex-col items-start gap-4"
            >
              <span className="inline-flex items-center rounded-full bg-secondary px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-widest text-secondary-foreground">
                {t("event.eyebrow")}
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
                {promoted.title}
              </h1>
              {promoted.subtitle && (
                <p className="max-w-lg text-base md:text-lg leading-relaxed text-white/85">{promoted.subtitle}</p>
              )}
              <p className="flex items-center gap-2 text-base md:text-lg font-semibold text-white/85">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-secondary" aria-hidden="true" />
                {promoted.when}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={whatsAppHref(contact.whatsapp, promoted.whatsappText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-secondary px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-secondary-foreground shadow-lg transition-colors hover:bg-secondary-hover"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {tHome("reserve")}
                </a>
                <Link
                  href={promoted.href}
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
              <SpotlightImage spot={promoted} />
            </motion.div>
          </div>
        ) : (
          /* ── Welcome: headline on the left, the next experience on the right ── */
          <div className="my-auto grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl flex flex-col items-start gap-4"
            >
              <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-secondary">
                <span aria-hidden="true" className="h-px w-8 bg-secondary" />
                {tHome("eyebrow")}
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
                {tHome("title")}
              </h1>
              <p className="max-w-xl text-base md:text-lg leading-relaxed text-white/85 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                {tHome("intro")}
              </p>
              <div className="mt-4 md:mt-6">
                {/* A text link, not a button: brand yellow, arrow slides on hover */}
                <Link
                  href={EXPERIENCES_HREF}
                  className="group inline-flex min-h-12 items-center gap-2.5 rounded-2xl py-1 text-xs md:text-sm font-bold uppercase tracking-widest text-secondary drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] transition-colors hover:text-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-4 focus-visible:ring-offset-foreground"
                >
                  <span className="relative">
                    {tHome("explore")}
                    <span aria-hidden="true" className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none" />
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5 motion-reduce:transition-none" aria-hidden="true" />
                </Link>
              </div>
            </motion.div>

            {next && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
                className="w-full max-w-sm md:justify-self-end lg:max-w-none"
              >
                <Link
                  href={next.href}
                  className="group block rounded-2xl border border-white/20 bg-foreground/45 p-5 md:p-6 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors hover:border-white/35 hover:bg-foreground/60"
                >
                  <span className="mb-2.5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-white/75">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75 motion-reduce:animate-none" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-secondary" />
                    </span>
                    {t("nextActivity.eyebrow")}
                  </span>
                  <h2 className="text-lg md:text-xl font-extrabold leading-tight tracking-tight text-white">{next.title}</h2>
                  <p className="mt-1.5 text-xs font-semibold text-white/70">{next.when}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-white">
                    {t("nextActivity.cta")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
