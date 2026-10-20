"use client";

import Image from "next/image";
import { Menu, X, MessageCircle, ChevronRight, AlertCircle, ChevronDown, Clock, CloudRain, Sun, Wind, Cloud, Moon, CloudLightning, CloudSnow, CloudFog, CloudDrizzle } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { OPENWEATHER_KEY } from "@/lib/weather";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { useIsClient } from "@/lib/use-is-client";

// Alert text lives in messages/*.json under Header.alerts.<key>. Keep each line
// short (about 55 characters) so it fits the bar; the full story goes on /tripalerts.
const ALERTS = [
  { icon: "🔴", key: "advisory" },
  { icon: "⛽", key: "pricing" },
  { icon: "🚧", key: "burundi" },
  { icon: "⏱️", key: "demand" },
  { icon: "✨", key: "wifi" }
];

// Menu text lives in messages/*.json under Header.nav.<id> and Header.menu.<id>.name / .desc
type MegaMenuId = "experiences" | "carsTransfers" | "activities";

const MEGA_MENUS: Record<MegaMenuId, { id: string; href: string }[]> = {
  // Tours lead the bar so they're one hover away on every page.
  experiences: [
    { id: "tours", href: "/tours" },
    { id: "toursHistory", href: "/tours?category=history" },
    { id: "toursCulture", href: "/tours?category=culture" },
    { id: "toursAdventure", href: "/tours?category=adventure" },
    { id: "toursStrategy", href: "/tours?category=strategy" },
  ],
  carsTransfers: [
    { id: "cityRide", href: "/book?tab=city&serviceType=inter_city" },
    { id: "interCity", href: "/transfers" },
    { id: "carRental", href: "/driver" },
  ],
  activities: [
    { id: "upcomingEvents", href: "/events" },
    { id: "pastEvents", href: "/events/past" },
    { id: "suraSeasons", href: "/activities" },
  ],
};

const NAV_LINKS: ({ id: MegaMenuId; type: "mega" } | { id: string; type: "link"; href: string })[] = [
  { id: "experiences", type: "mega" },
  { id: "carsTransfers", type: "mega" },
  { id: "activities", type: "mega" },
  { id: "howItWorks", type: "link", href: "/how-it-works" },
  { id: "pricing", type: "link", href: "/pricing" },
  { id: "gallery", type: "link", href: "/gallery" },
  { id: "contact", type: "link", href: "/contact" },
];

// EN | FR switch. Keeps the visitor on the same page, e.g. /en/contact ⇄ /fr/contact.
// `solid` follows the header: over the hero image it turns into a frosted white pill.
function LocaleSwitcher({ solid = true, className = "" }: { solid?: boolean; className?: string }) {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={`flex items-center rounded-lg border p-0.5 transition-colors duration-300 ${
        solid
          ? "border-border bg-muted/40"
          : "border-white/25 bg-white/10 backdrop-blur-md"
      } ${className}`}
    >
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          lang={l}
          title={t(l)}
          aria-label={t(l)}
          aria-current={l === locale ? "true" : undefined}
          className={`inline-flex min-h-12 min-w-12 items-center justify-center px-2.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-colors ${
            l === locale
              ? solid
                ? "bg-card text-primary shadow-sm"
                : "bg-card text-foreground shadow-sm"
              : solid
                ? "text-muted-foreground hover:text-foreground"
                : "text-white/75 hover:text-white"
          }`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}

const API_KEY = OPENWEATHER_KEY;
const CITY = "Kigali";

interface WeatherStatus {
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  precip: number;
}

function getWeatherIcon(condition: string, precip: number, isNight: boolean) {
  const c = (condition || "").toLowerCase();

  if (c === "thunderstorm") return CloudLightning;
  if (c === "drizzle" || c === "rain" || precip > 0) return c === "drizzle" ? CloudDrizzle : CloudRain;
  if (c === "snow") return CloudSnow;
  if (c === "mist" || c === "fog" || c === "haze" || c === "smoke" || c === "dust") return CloudFog;
  if (c === "clouds") return Cloud;
  if (c === "clear") return isNight ? Moon : Sun;
  return isNight ? Moon : Sun;
}


/**
 * `forceSolid`: use the solid skin from the start, for pages whose top is light
 * (e.g. the activity calendar), where the transparent skin would be white on cream.
 */
export function Header({ forceSolid = false }: { forceSolid?: boolean } = {}) {
  const t = useTranslations("Header");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(0);
  const [activeMega, setActiveMega] = useState<MegaMenuId | null>(null);
  const isMounted = useIsClient();
  const [kigaliTime, setKigaliTime] = useState("");
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus | null>(null);
  const pathname = usePathname();

  // The header stays mounted between pages, so close its menus when the page changes.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
    setActiveMega(null);
  }

  useEffect(() => {
    // Time Setup
    const updateTime = () => {
      setKigaliTime(new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Kigali', hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date()));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);

    // Weather Setup
    async function fetchLiveUpdates() {
      try {
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`);
        if (weatherRes.ok) {
           const data = await weatherRes.json();
           const precipValue = data.rain ? data.rain['1h'] || 0 : 0;
           setWeatherStatus({ 
             temp: Math.round(data.main.temp), 
             condition: data.weather[0].main,
             humidity: data.main.humidity,
             wind: Math.round(data.wind.speed * 3.6),
             precip: precipValue
           });
        }
      } catch (e) { 
        setWeatherStatus({ temp: 24, condition: "Clear", humidity: 60, wind: 12, precip: 0 }); 
      }
    }
    fetchLiveUpdates();
    const weatherTimer = setInterval(fetchLiveUpdates, 1800000);

    return () => {
      clearInterval(timer);
      clearInterval(weatherTimer);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    // Read the position now too: a reload or back-navigation can land mid-page.
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!open && !activeMega) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setActiveMega(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, activeMega]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAlert((prev) => (prev + 1) % ALERTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useScrollLock(open);

  /* Transparent over the hero image; solid white once the visitor scrolls.
     An open mega menu also forces the solid skin, so its white panel has a
     matching bar above it. */
  const solid = forceSolid || scrolled || activeMega !== null;

  return (
    <>
      {/* One scrim spanning the alert bar AND the header. Rendering it once — rather
          than one gradient per bar — is what keeps the pre-scroll state a single
          unbroken block with no hairline where the two used to meet. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 right-0 z-[55] h-[150px] bg-gradient-to-b from-black/60 via-black/30 to-transparent transition-opacity duration-300 ${
          solid ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Alert & Intelligence Bar — transparent over the hero, solid once scrolled */}
      <div
        className={`fixed top-0 left-0 w-full z-[60] text-white h-9 flex items-center transition-colors duration-300 ${
          solid ? "bg-foreground border-b border-white/5 backdrop-blur-sm" : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between w-full h-full max-w-[1400px] mx-auto px-6 md:px-10">
          
          {/* Left Edge: Weather Button Layout */}
          <div className="hidden sm:flex items-center w-1/3">
            {isMounted && weatherStatus ? (
              <div
                className={`flex items-center gap-3 px-3 py-1 rounded-full transition-colors ${
                  solid
                    ? "border border-white/5 bg-white/5"
                    : "border border-white/15 bg-white/10 backdrop-blur-md"
                }`}
              >
                <div className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-bold uppercase tracking-wider xl:pr-3 xl:border-r border-white/10 ${solid ? "text-white/70" : "text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"}`}>
                  {(() => {
                    const hour = new Date().getHours();
                    const isNight = hour >= 18 || hour < 6;
                    const Icon = getWeatherIcon(weatherStatus.condition, weatherStatus.precip, isNight);
                    const color =
                      weatherStatus.condition === "Rain" || weatherStatus.condition === "Drizzle" || weatherStatus.precip > 0
                        ? "text-secondary"
                        : weatherStatus.condition === "Thunderstorm"
                        ? "text-secondary"
                        : weatherStatus.condition === "Snow"
                        ? "text-white/80"
                        : weatherStatus.condition === "Clouds"
                        ? "text-white/70"
                        : isNight
                        ? "text-secondary"
                        : "text-primary";
                    return <Icon size={12} className={color} />;
                  })()}
                  <span>{weatherStatus.temp}°C {CITY}</span>
                </div>
                {/* The detail readings only fit beside the alerts on wide screens. */}
                <div className="hidden xl:flex items-center gap-3 whitespace-nowrap">
                  <div className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${solid ? "text-white/60" : "text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"}`}>
                    <CloudRain size={12} className="text-white/70" />
                    <span>{weatherStatus.precip}mm</span>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${solid ? "text-white/60" : "text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"}`}>
                    <Cloud size={12} className="text-white/70" />
                    <span>{weatherStatus.humidity}%</span>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${solid ? "text-white/60" : "text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"}`}>
                    <Wind size={12} className="text-white/70" />
                    <span>{weatherStatus.wind} km/h</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Center: Alerts */}
          <div className="flex items-center justify-center gap-3 w-full sm:w-1/3 relative overflow-hidden h-full">
            <AlertCircle className="w-3.5 h-3.5 text-secondary shrink-0" strokeWidth={2} aria-hidden="true" />
            
            <div className="relative w-full max-w-sm h-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentAlert}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Link
                    href="/tripalerts"
                    className={`text-xs sm:text-xs font-semibold tracking-wide truncate hover:underline underline-offset-2 ${solid ? "text-white/90" : "text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"}`}
                  >
                    <span className="mr-2" aria-hidden="true">{ALERTS[currentAlert].icon}</span>
                    {t(`alerts.${ALERTS[currentAlert].key}`)}
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>

            <Link 
              href="/tripalerts" 
              className={`hidden md:flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wide hover:text-white transition-colors group ${
                solid ? "text-secondary" : "text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]"
              }`}
            >
              {t("details")} <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </Link>
          </div>

          {/* Right Edge: Time */}
          <div className="hidden sm:flex items-center justify-end gap-2 w-1/3">
            {isMounted ? (
              <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${solid ? "text-white/70" : "text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"}`}>
                <Clock size={12} className="text-secondary" aria-hidden="true" />
                <span>{kigaliTime} CAT</span>
              </div>
            ) : null}
          </div>

        </div>
      </div>

      {/* Main Header */}
      <header
        onMouseLeave={() => setActiveMega(null)}
        className={`fixed top-9 left-0 right-0 z-50 w-full transition-all duration-300 ${
          solid
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between h-16 md:h-18">
          
          {/* Logo */}
          <div className="flex-shrink-0 z-20">
            <Link 
              href="/" 
              className="relative h-7 w-28 md:h-8 md:w-32 block transition-opacity hover:opacity-75 duration-300"
            >
              <Image
                src="/brand/sura-logo.png"
                alt="SURA Essence"
                fill
                sizes="(min-width: 768px) 128px, 112px"
                className={`object-contain object-left transition-[filter] duration-300 ${
                  solid ? "brightness-0" : "brightness-0 invert"
                }`}
                preload
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          {/* Full text menu from 2xl (1536px): below that the French labels don't fit
              beside the logo and buttons, so laptops get the menu button instead. */}
          <nav className="hidden 2xl:flex flex-1 justify-center items-center z-10 px-4">
            <div className="flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                if (link.type === "mega") {
                  return (
                    <button
                      key={link.id}
                      type="button"
                      aria-expanded={activeMega === link.id}
                      aria-haspopup="true"
                      onMouseEnter={() => setActiveMega(link.id)}
                      onClick={() => setActiveMega(activeMega === link.id ? null : link.id)}
                      className={`min-h-12 px-3 py-2 text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-200 relative flex items-center gap-1.5 rounded-lg group ${
                        activeMega === link.id
                          ? "text-primary bg-primary/5"
                          : solid
                            ? "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            : "text-white/85 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {t(`nav.${link.id}`)}
                      <ChevronDown 
                        className={`w-3.5 h-3.5 transition-transform ${
                          activeMega === link.id ? 'rotate-180' : ''
                        }`} 
                        strokeWidth={2.5}
                      />
                    </button>
                  );
                }
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={`min-h-12 px-3 py-2 text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-200 relative rounded-lg ${
                      pathname === link.href
                        ? solid
                          ? "text-primary bg-primary/5"
                          : "text-white bg-white/15"
                        : solid
                          ? "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                          : "text-white/85 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {t(`nav.${link.id}`)}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Language switch + WhatsApp CTA */}
          <div className="hidden 2xl:flex flex-shrink-0 items-center gap-3 z-20">
            <LocaleSwitcher solid={solid} />
            <a
              href="https://wa.me/250788564000"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("chatWithUs")}
              className="group flex min-h-12 items-center gap-3 px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-all duration-300 hover:shadow-lg hover:"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={2} />
            </a>
          </div>

          {/* Mobile: language switch + menu button */}
          <div className="flex 2xl:hidden items-center gap-2 z-20">
            <LocaleSwitcher solid={solid} />
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className={`flex h-12 w-12 items-center justify-center rounded-lg border transition-colors duration-300 ${
                solid
                  ? "bg-muted/40 border-border text-foreground hover:bg-muted/70"
                  : "bg-white/10 border-white/25 text-white backdrop-blur-md hover:bg-white/20"
              }`}
              aria-label={t("toggleMenu")}
            >
              {open ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {activeMega && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 w-full bg-card border-b border-border shadow-lg z-40 hidden 2xl:block"
            >
              <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8">
                <div className="grid grid-cols-12 gap-8">
                  {/* Menu Items */}
                  <div className="col-span-5">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-5">
                      {t(`nav.${activeMega}`)}
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {MEGA_MENUS[activeMega].map((sub) => (
                        <Link 
                          key={sub.id}
                          href={sub.href}
                          onClick={() => setActiveMega(null)}
                          className="group flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                        >
                          <ChevronRight 
                            className="w-4 h-4 text-primary mt-0.5 transition-transform group-hover:translate-x-1" 
                            strokeWidth={2.5}
                          />
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                              {t(`menu.${sub.id}.name`)}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">
                              {t(`menu.${sub.id}.desc`)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Featured Content */}
                  <div className="col-span-7 border-l border-border pl-8 flex items-center justify-center">
                    <div className="text-center max-w-md">
                      <p className="text-2xl font-bold text-muted-foreground leading-tight mb-3">
                        {t("featured.title")}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        {t("featured.subtitle")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-card z-[70] flex flex-col 2xl:hidden"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex justify-between items-center p-6 border-b border-border"
            >
              <div className="relative h-7 w-28">
                <Image 
                  src="/brand/sura-logo.png" 
                  alt="SURA" 
                  fill 
                  sizes="112px"
                  className="object-contain object-left brightness-0" 
                />
              </div>
              <button 
                onClick={() => setOpen(false)} 
                className="flex h-12 w-12 items-center justify-center bg-muted/40 rounded-lg text-foreground border border-border hover:bg-muted/70 transition-colors"
                aria-label={t("closeMenu")}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </motion.div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-6">
                {NAV_LINKS.map((link, idx) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + (idx * 0.1) }}
                  >
                    {link.type === "mega" ? (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {t(`nav.${link.id}`)}
                        </h3>
                        <div className="flex flex-col gap-3 pl-2">
                          {MEGA_MENUS[link.id].map((sub) => (
                            <Link 
                              key={sub.id}
                              href={sub.href} 
                              onClick={() => setOpen(false)}
                              className="group flex items-start gap-3 p-4 rounded-lg bg-muted/40 border border-border hover:border-primary hover:bg-card transition-all active:scale-[0.98]"
                            >
                              <ChevronRight 
                                className="w-5 h-5 text-primary mt-0.5 transition-transform group-hover:translate-x-1" 
                                strokeWidth={2.5}
                              />
                              <div className="flex flex-col gap-1">
                                <span className="text-base font-bold text-foreground">
                                  {t(`menu.${sub.id}.name`)}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">
                                  {t(`menu.${sub.id}.desc`)}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link 
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border hover:border-primary hover:bg-card transition-all active:scale-[0.98] group"
                      >
                        <span className="text-lg font-bold text-foreground">
                          {t(`nav.${link.id}`)}
                        </span>
                        <ChevronRight 
                          className="w-5 h-5 text-primary transition-transform group-hover:translate-x-1" 
                          strokeWidth={2.5}
                        />
                      </Link>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mobile WhatsApp CTA */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="p-6 border-t border-border bg-muted/40"
            >
              <a
                href="https://wa.me/250788564000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-lg bg-primary text-white font-bold text-sm uppercase tracking-wide shadow-lg active:scale-[0.98] transition-transform"
              >
                <MessageCircle className="w-5 h-5" strokeWidth={2} />
                {t("chatWithUs")}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
