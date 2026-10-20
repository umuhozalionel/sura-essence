"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Quote, Clock, Sun, Moon, Timer } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";
import { OPENWEATHER_KEY } from "@/lib/weather";
import type { DriverReviewCar, PublicDriverReview } from "@/lib/driver-reviews";

// WEATHER & EXCHANGE CONFIGURATION
const API_KEY = OPENWEATHER_KEY;
const CITY = "Kigali";

// Every piece of text on this page comes from messages/en.json + messages/fr.json
// (namespace "Driver"). Add a service point or a vehicle by editing those two files.
// Reviews are managed in Admin → Driver reviews; the message-file ones are the
// samples shown until the database answers (and copied in as samples the first time).
type Feature = { id: string; icon: string; title: string; description: string };
type FleetOption = { id: string; icon: string; image: string; type: string; capacity: string; bestFor: string };
type SampleReview = { id: string; client: string; car: DriverReviewCar; comment: string };

// Book buttons open the booking form on Hourly hire, with a driver, for the
// 3-hour minimum. "Select car" adds the class (fleet option ids are the
// vehicle ids in lib/pricing.ts). URL parameters: see booking-form.tsx.
const DRIVER_HIRE_HREF = "/book?tab=hourly&hours=3&driver=with";

function DriverContent() {
  const t = useTranslations("Driver");
  const format = useFormatter();
  const standards = t.raw("standards.items") as Feature[];
  const fleet = t.raw("fleet.options") as FleetOption[];
  const tv = useTranslations("BookingForm.vehicles");
  const locale = useLocale();
  const samples = (t.raw("reviews.items") as SampleReview[]).map((r) => ({ ...r, translated: false }));
  const [reviews, setReviews] = useState<PublicDriverReview[]>(samples);
  const reviewNote = t("reviews.translatedNote");

  // Approved reviews from Admin → Driver reviews. Until they arrive (or if the
  // request fails), the sample reviews from the message files stay on screen.
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/driver-reviews?locale=${locale}`, { signal: ctrl.signal })
      .then((res) => (res.ok ? (res.json() as Promise<{ items: PublicDriverReview[] }>) : null))
      .then((data) => {
        if (data && Array.isArray(data.items)) setReviews(data.items);
      })
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [locale]);

  const [kigaliTime, setKigaliTime] = useState("");
  const [weatherStatus, setWeatherStatus] = useState<{ temp: number; condition: string } | null>(null);
  const [rawRates, setRawRates] = useState<{ USD: number, EUR: number, GBP: number } | null>(null);

  // LIVE SERVICE DATA ENGINE
  useEffect(() => {
    async function fetchLiveData() {
      try {
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`);
        const weatherData = await weatherRes.json();
        if (weatherRes.ok) {
           setWeatherStatus({ temp: Math.round(weatherData.main.temp), condition: weatherData.weather[0].main });
        }
        const rateRes = await fetch('https://api.exchangerate-api.com/v4/latest/RWF');
        const rateData = await rateRes.json();
        if (rateRes.ok) {
          setRawRates({ USD: rateData.rates.USD, EUR: rateData.rates.EUR, GBP: rateData.rates.GBP });
        }
      } catch (e) { setWeatherStatus({ temp: 24, condition: "Clear" }); }
    }
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 600000);
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

  const getDayNightStatus = useMemo(() => {
    const hour = parseInt(kigaliTime.split(":")[0]);
    if (isNaN(hour)) return { label: t("status.updating"), icon: Timer, color: "text-muted-foreground" };
    if (hour >= 18 || hour < 5) return { label: t("status.evening"), icon: Moon, color: "text-secondary" };
    return { label: t("status.day"), icon: Sun, color: "text-primary" };
  }, [kigaliTime, t]);

  return (
    <div className={`min-h-screen bg-background selection:bg-primary/20 relative`}>
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--foreground) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.08 }}></div>

      {/* 1. CENTERED HERO SECTION */}
      <section className="relative pt-[calc(var(--header-h)+4rem)] pb-24 md:pb-32 bg-foreground overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30 grayscale"
          style={{ backgroundImage: "url('/backgrounds/Driver-hero.jpg')" }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-foreground/80 to-foreground" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-10 text-center flex flex-col items-center gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 py-2 px-6 rounded-2xl bg-primary text-white font-extrabold text-xs uppercase tracking-widest shadow-2xl">
            {t("badge")}
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-extrabold text-white leading-[0.95] tracking-tighter uppercase">
            {t("title")} <br /><span className="text-secondary">{t("titleHighlight")}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-2xl text-white/60 max-w-3xl mx-auto font-bold uppercase tracking-widest leading-relaxed whitespace-pre-line">
            {t("subtitle")}
          </motion.p>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-6">
            <Link href={DRIVER_HIRE_HREF} onClick={triggerHaptic} className="h-20 px-12 rounded-2xl bg-primary hover:bg-card hover:text-foreground text-white transition-all flex items-center justify-center gap-6 shadow-2xl">
                <span className="text-sm font-extrabold uppercase tracking-widest">{t("bookNow")}</span>
                <ArrowRight className="w-6 h-6" />
            </Link>
            <a href="#fleet" onClick={triggerHaptic} className="h-20 px-12 rounded-2xl border-2 border-white/20 text-white hover:bg-card hover:text-foreground transition-all flex items-center justify-center">
                <span className="text-sm font-extrabold uppercase tracking-widest">{t("viewFleet")}</span>
            </a>
          </div>
        </div>

        {/* FLOATING STATUS BAR */}
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 mt-24 md:mt-32">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-1 rounded-2xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-xl">
           <div className="p-6 md:p-8 border-r border-white/10 flex flex-col gap-2">
              <span className="text-xs font-extrabold text-white/30 uppercase tracking-widest">{t("status.clock")}</span>
              <div className="flex items-center gap-3">
                 <Clock className="w-5 h-5 text-primary" />
                 <p className="text-3xl font-extrabold text-white tabular-nums">{kigaliTime}</p>
              </div>
           </div>
           <div className="p-6 md:p-8 border-r border-white/10 flex flex-col gap-2">
              <span className="text-xs font-extrabold text-white/30 uppercase tracking-widest">{t("status.weather")}</span>
              <div className="flex items-center gap-3">
                 <Sun className="w-5 h-5 text-primary" />
                 <p className="text-3xl font-extrabold text-white uppercase">{weatherStatus?.temp}°C • {weatherStatus?.condition}</p>
              </div>
           </div>
           <div className="p-6 md:p-8 border-r border-white/10 flex flex-col gap-2">
              <span className="text-xs font-extrabold text-white/30 uppercase tracking-widest">{t("status.currency")}</span>
              <p className="text-xl font-extrabold text-white uppercase">{t("status.exchange", { amount: rawRates ? format.number(Math.round(1 / rawRates.USD)) : "---" })}</p>
           </div>
           <div className="p-6 md:p-8 flex items-center gap-4 bg-primary/10">
              <getDayNightStatus.icon className={`w-6 h-6 ${getDayNightStatus.color}`} />
              <span className="text-xs font-extrabold text-white uppercase tracking-widest">{getDayNightStatus.label}</span>
           </div>
        </div>
        </div>
      </section>

      {/* 2. SERVICE STANDARDS (FEATURE GRID) */}
      <section className="py-24 md:py-32 px-6 md:px-10 max-w-[1400px] mx-auto relative z-20 flex flex-col gap-12 md:gap-16">
         <div className="max-w-2xl border-l-4 border-primary pl-8 flex flex-col gap-4">
            <h2 className="text-4xl md:text-6xl font-extrabold text-foreground uppercase tracking-tighter leading-[0.95]">{t("standards.title")}</h2>
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">{t("standards.subtitle")}</p>
         </div>

         <div className="grid md:grid-cols-4 gap-1 rounded-2xl overflow-hidden border border-border bg-muted shadow-2xl">
            {standards.map((feature) => {
              const Icon = getIcon(feature.icon);
              return (
              <div key={feature.id} className="bg-card p-6 md:p-8 lg:p-12 group hover:bg-foreground transition-all duration-500">
                <div className="w-16 h-16 bg-background group-hover:bg-primary/10 flex items-center justify-center mb-10 transition-colors">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-extrabold text-foreground group-hover:text-white uppercase tracking-tighter mb-4">{feature.title}</h3>
                <p className="text-xs font-bold text-muted-foreground group-hover:text-white/70 leading-relaxed uppercase tracking-widest">{feature.description}</p>
              </div>
              );
            })}
         </div>
      </section>

      {/* 3. THE FLEET BOARD (NOW WITH PICTURES) */}
      {/* The card sits inside the standard container, so it keeps the page gutter on every screen. */}
      <section id="fleet" className="max-w-[1400px] mx-auto px-6 md:px-10 pb-24 md:pb-32 relative z-20">
        <div className="rounded-2xl bg-card border border-border shadow-2xl p-6 md:p-10 lg:p-16">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-4 flex flex-col items-start gap-4">
                <span className="text-primary text-xs font-extrabold uppercase tracking-widest block">{t("fleet.badge")}</span>
                <h2 className="text-4xl md:text-6xl font-extrabold text-foreground uppercase tracking-tighter leading-[0.95] whitespace-pre-line">{t("fleet.title")}</h2>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs leading-relaxed">{t("fleet.subtitle")}</p>
                <div className="mt-6 bg-background p-6 md:p-8 border-l-4 border-primary">
                   <p className="text-xs font-extrabold text-foreground uppercase tracking-widest leading-relaxed">
                      {t("fleet.note")}
                   </p>
                </div>
            </div>

            <div className="lg:col-span-8 grid md:grid-cols-2 gap-1 rounded-2xl bg-muted border border-border overflow-hidden">
               {fleet.map((car) => {
                 const CarIcon = getIcon(car.icon);
                 return (
                 <div key={car.id} className="bg-card group hover:bg-foreground transition-all duration-500 flex flex-col">
                    {/* CAR IMAGE CONTAINER */}
                    <div className="h-64 relative overflow-hidden">
                       <div 
                         className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                         style={{ backgroundImage: `url('${car.image}')` }} 
                       />
                       <div className="absolute top-0 left-0 bg-primary text-white px-5 py-2">
                          <span className="text-xs font-extrabold uppercase tracking-widest">{car.capacity}</span>
                       </div>
                    </div>
                    
                    <div className="p-6 md:p-8 lg:p-10 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-6">
                           <CarIcon className="w-6 h-6 text-primary" />
                           <h3 className="text-3xl font-extrabold text-foreground group-hover:text-white uppercase tracking-tighter leading-none">{car.type}</h3>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground group-hover:text-white/70 uppercase tracking-widest leading-relaxed mb-10 flex-grow">{car.bestFor}</p>
                        <Link href={`${DRIVER_HIRE_HREF}&vehicle=${car.id}`} onClick={triggerHaptic} className="h-14 w-full bg-foreground group-hover:bg-primary flex items-center justify-between px-8 transition-all">
                           <span className="text-xs font-extrabold text-white uppercase tracking-widest">{t("fleet.select")}</span>
                           <ArrowRight size={16} className="text-primary group-hover:text-white" />
                        </Link>
                    </div>
                 </div>
                 );
               })}
            </div>
         </div>
        </div>
      </section>

      {/* 4. CLIENT FEEDBACK */}
      {reviews.length > 0 && (
      <section className="pt-0 pb-24 md:pb-32 px-6 md:px-10 max-w-[1400px] mx-auto text-center flex flex-col gap-12 md:gap-16">
          <h2 className="text-4xl md:text-6xl font-extrabold text-foreground uppercase tracking-tighter leading-[0.95]">{t("reviews.title")}</h2>
          <div className="grid md:grid-cols-2 gap-10 text-left">
             {reviews.map((rev) => (
               <div key={rev.id} className="rounded-2xl bg-card p-6 md:p-12 shadow-xl border border-border relative overflow-hidden group">
                  <Quote className="absolute -top-6 -right-6 w-32 h-32 text-background group-hover:text-primary/5 transition-colors" />
                  <div className="relative z-10">
                     <div className="flex items-center gap-6 mb-10">
                        <div aria-hidden className="w-14 h-14 shrink-0 bg-foreground text-white flex items-center justify-center font-extrabold text-2xl">{Array.from(rev.client)[0]?.toUpperCase()}</div>
                        <div>
                           <h3 className="text-xl font-extrabold text-foreground uppercase tracking-tight">{rev.client}</h3>
                           <span className="text-xs font-extrabold text-primary uppercase tracking-widest">{t("reviews.rental", { car: tv(`${rev.car}.name`) })}</span>
                        </div>
                     </div>
                     <p className="text-lg font-bold text-foreground italic leading-relaxed tracking-tight">{t("reviews.quote", { text: rev.comment })}</p>
                     {rev.translated && reviewNote && (
                       <p className="text-xs font-bold uppercase tracking-widest text-foreground/60 mt-3">{reviewNote}</p>
                     )}
                  </div>
               </div>
             ))}
          </div>
      </section>
      )}
    </div>
  );
}

export default function DriverPage() {
  const t = useTranslations("Driver");
  return (
    <Suspense fallback={<div className="min-h-screen bg-foreground flex items-center justify-center text-white font-extrabold uppercase tracking-widest">{t("loading")}</div>}>
      <DriverContent />
    </Suspense>
  );
}