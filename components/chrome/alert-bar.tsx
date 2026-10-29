"use client";

import { AlertCircle, ChevronRight, Clock, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Moon, Sun, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { OPENWEATHER_KEY } from "@/lib/weather";
import { useIsClient } from "@/lib/use-is-client";
import type { BrandId } from "@/lib/brands";
import { BrandSwitcher } from "./brand-switcher";

// Alert text lives in messages/*.json under Header.alerts.<key>, shared by every
// brand. Keep each line short (about 55 characters) so it fits the bar.
const ALERTS = [
  { icon: "🔴", key: "advisory" },
  { icon: "⛽", key: "pricing" },
  { icon: "🚧", key: "burundi" },
  { icon: "⏱️", key: "demand" },
  { icon: "✨", key: "wifi" }
];

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

function weatherIconColor(w: WeatherStatus, isNight: boolean) {
  if (w.condition === "Rain" || w.condition === "Drizzle" || w.precip > 0) return "text-secondary";
  if (w.condition === "Thunderstorm") return "text-secondary";
  if (w.condition === "Snow") return "text-white/80";
  if (w.condition === "Clouds") return "text-white/70";
  return isNight ? "text-secondary" : "text-primary-on-dark";
}

/**
 * The 36px bar above the header: Kigali weather, rotating trip alerts, the
 * brand switcher (wide screens) and the time in Kigali. Transparent over the
 * hero, solid ink once `solid`.
 */
export function AlertBar({ brand, alertsHref, solid }: { brand: BrandId; alertsHref: string; solid: boolean }) {
  const t = useTranslations("Header");
  const [currentAlert, setCurrentAlert] = useState(0);
  const isMounted = useIsClient();
  const [kigaliTime, setKigaliTime] = useState("");
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus | null>(null);

  useEffect(() => {
    const updateTime = () => {
      setKigaliTime(new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Kigali", hour: "2-digit", minute: "2-digit", hour12: false
      }).format(new Date()));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);

    async function fetchLiveUpdates() {
      try {
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${OPENWEATHER_KEY}`);
        if (weatherRes.ok) {
          const data = await weatherRes.json();
          setWeatherStatus({
            temp: Math.round(data.main.temp),
            condition: data.weather[0].main,
            humidity: data.main.humidity,
            wind: Math.round(data.wind.speed * 3.6),
            precip: data.rain ? data.rain["1h"] || 0 : 0,
          });
        }
      } catch {
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
    const timer = setInterval(() => {
      setCurrentAlert((prev) => (prev + 1) % ALERTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const onPhoto = "text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]";
  const detail = `flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${solid ? "text-white/60" : "text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"}`;

  return (
    <div
      className={`fixed top-0 left-0 w-full z-[60] text-white h-9 flex items-center transition-colors duration-300 ${
        solid ? "bg-foreground border-b border-white/5 backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between w-full h-full max-w-[1400px] mx-auto px-6 md:px-10">

        {/* Left: Kigali weather */}
        <div className="hidden sm:flex items-center w-1/3">
          {isMounted && weatherStatus ? (
            <div
              className={`flex items-center gap-3 px-3 py-1 rounded-full transition-colors ${
                solid
                  ? "border border-white/5 bg-white/5"
                  : "border border-white/15 bg-white/10 backdrop-blur-md"
              }`}
            >
              <div className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-bold uppercase tracking-wider xl:pr-3 xl:border-r border-white/10 ${solid ? "text-white/70" : onPhoto}`}>
                {(() => {
                  const hour = new Date().getHours();
                  const isNight = hour >= 18 || hour < 6;
                  const Icon = getWeatherIcon(weatherStatus.condition, weatherStatus.precip, isNight);
                  return <Icon size={12} className={weatherIconColor(weatherStatus, isNight)} />;
                })()}
                <span>{weatherStatus.temp}°C {CITY}</span>
              </div>
              {/* The detail readings only fit beside the alerts on wide screens. */}
              <div className="hidden xl:flex items-center gap-3 whitespace-nowrap">
                <div className={detail}>
                  <CloudRain size={12} className="text-white/70" />
                  <span>{weatherStatus.precip}mm</span>
                </div>
                <div className={detail}>
                  <Cloud size={12} className="text-white/70" />
                  <span>{weatherStatus.humidity}%</span>
                </div>
                <div className={detail}>
                  <Wind size={12} className="text-white/70" />
                  <span>{weatherStatus.wind} km/h</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Centre: rotating alerts */}
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
                  href={alertsHref}
                  className={`text-xs font-semibold tracking-wide truncate hover:underline underline-offset-2 ${solid ? "text-white/90" : onPhoto}`}
                >
                  <span className="mr-2" aria-hidden="true">{ALERTS[currentAlert].icon}</span>
                  {t(`alerts.${ALERTS[currentAlert].key}`)}
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

          <Link
            href={alertsHref}
            className={`hidden md:flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wide hover:text-white transition-colors group ${
              solid ? "text-secondary" : "text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]"
            }`}
          >
            {t("details")} <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Right: brand switcher (wide screens; the mobile menu has its own) and Kigali time */}
        <div className="hidden sm:flex items-center justify-end gap-5 w-1/3 h-full">
          <div className="hidden 2xl:flex h-full">
            <BrandSwitcher current={brand} variant="bar" solid={solid} />
          </div>
          {isMounted ? (
            <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${solid ? "text-white/70" : onPhoto}`}>
              <Clock size={12} className="text-secondary" aria-hidden="true" />
              <span>{kigaliTime} CAT</span>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
