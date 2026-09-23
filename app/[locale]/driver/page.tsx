"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { motion } from "framer-motion";
import { Manrope } from "next/font/google";
import { ArrowRight, Quote, Clock, Sun, Moon, Timer } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

// WEATHER & EXCHANGE CONFIGURATION
const API_KEY = "23f292fb66ec335896541f0b5e8b87bf"; 
const CITY = "Kigali";

// Every piece of text on this page comes from messages/en.json + messages/fr.json
// (namespace "Driver"). Add a service point, a vehicle or a review by editing those two files.
type Feature = { id: string; icon: string; title: string; description: string };
type FleetOption = { id: string; icon: string; image: string; type: string; capacity: string; bestFor: string };
type Review = { id: string; initial: string; client: string; car: string; comment: string };

function DriverContent() {
  const t = useTranslations("Driver");
  const format = useFormatter();
  const standards = t.raw("standards.items") as Feature[];
  const fleet = t.raw("fleet.options") as FleetOption[];
  const reviews = t.raw("reviews.items") as Review[];
  const reviewNote = t("reviews.translatedNote");

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
    if (isNaN(hour)) return { label: t("status.updating"), icon: Timer, color: "text-gray-400" };
    if (hour >= 18 || hour < 5) return { label: t("status.evening"), icon: Moon, color: "text-[#EAB308]" };
    return { label: t("status.day"), icon: Sun, color: "text-[#125740]" };
  }, [kigaliTime, t]);

  return (
    <main className={`min-h-screen bg-[#F9F8F6] ${manrope.className} selection:bg-[#125740]/20 relative`}>
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0A1128 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.08 }}></div>

      <Header />

      {/* 1. CENTERED HERO SECTION */}
      <section className="relative pt-48 pb-32 px-10 bg-[#0A1128] overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30 grayscale"
          style={{ backgroundImage: "url('/backgrounds/Driver-hero.jpg')" }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A1128]/80 to-[#0A1128]" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 py-2 px-6 bg-[#125740] text-white font-black text-[10px] uppercase tracking-[0.4em] mb-12 shadow-2xl">
            {t("badge")}
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-6xl md:text-9xl font-black text-white mb-10 leading-[0.85] tracking-tighter uppercase">
            {t("title")} <br /><span className="text-[#EAB308]">{t("titleHighlight")}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-2xl text-white/60 max-w-3xl mx-auto font-bold uppercase tracking-widest leading-relaxed mb-16 whitespace-pre-line">
            {t("subtitle")}
          </motion.p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/book?tab=hourly" onClick={triggerHaptic} className="h-20 px-12 bg-[#125740] hover:bg-white hover:text-[#0A1128] text-white transition-all flex items-center justify-center gap-6 shadow-2xl">
                <span className="text-sm font-black uppercase tracking-[0.4em]">{t("bookNow")}</span>
                <ArrowRight className="w-6 h-6" />
            </Link>
            <a href="#fleet" onClick={triggerHaptic} className="h-20 px-12 border-2 border-white/20 text-white hover:bg-white hover:text-[#0A1128] transition-all flex items-center justify-center">
                <span className="text-sm font-black uppercase tracking-[0.4em]">{t("viewFleet")}</span>
            </a>
          </div>
        </div>

        {/* FLOATING STATUS BAR */}
        <div className="max-w-[1600px] mx-auto mt-32 grid grid-cols-1 md:grid-cols-4 gap-1 bg-white/5 border border-white/10 backdrop-blur-xl">
           <div className="p-8 border-r border-white/10 flex flex-col gap-2">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{t("status.clock")}</span>
              <div className="flex items-center gap-3">
                 <Clock className="w-5 h-5 text-[#125740]" />
                 <p className="text-3xl font-black text-white tabular-nums">{kigaliTime}</p>
              </div>
           </div>
           <div className="p-8 border-r border-white/10 flex flex-col gap-2">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{t("status.weather")}</span>
              <div className="flex items-center gap-3">
                 <Sun className="w-5 h-5 text-[#125740]" />
                 <p className="text-3xl font-black text-white uppercase">{weatherStatus?.temp}°C • {weatherStatus?.condition}</p>
              </div>
           </div>
           <div className="p-8 border-r border-white/10 flex flex-col gap-2">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{t("status.currency")}</span>
              <p className="text-xl font-black text-white uppercase">{t("status.exchange", { amount: rawRates ? format.number(Math.round(1 / rawRates.USD)) : "---" })}</p>
           </div>
           <div className="p-8 flex items-center gap-4 bg-[#125740]/10">
              <getDayNightStatus.icon className={`w-6 h-6 ${getDayNightStatus.color}`} />
              <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{getDayNightStatus.label}</span>
           </div>
        </div>
      </section>

      {/* 2. SERVICE STANDARDS (FEATURE GRID) */}
      <section className="py-32 px-10 max-w-[1600px] mx-auto relative z-20">
         <div className="mb-20 max-w-2xl border-l-4 border-[#125740] pl-8">
            <h2 className="text-5xl font-black text-[#0A1128] uppercase tracking-tighter mb-4">{t("standards.title")}</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">{t("standards.subtitle")}</p>
         </div>

         <div className="grid md:grid-cols-4 gap-1 border border-gray-200 bg-gray-200 shadow-2xl">
            {standards.map((feature) => {
              const Icon = getIcon(feature.icon);
              return (
              <div key={feature.id} className="bg-white p-12 group hover:bg-[#0A1128] transition-all duration-500">
                <div className="w-16 h-16 bg-[#F9F8F6] group-hover:bg-[#125740]/10 flex items-center justify-center mb-10 transition-colors">
                  <Icon className="w-8 h-8 text-[#125740]" />
                </div>
                <h4 className="text-2xl font-black text-[#0A1128] group-hover:text-white uppercase tracking-tighter mb-4">{feature.title}</h4>
                <p className="text-xs font-bold text-gray-400 leading-relaxed uppercase tracking-widest">{feature.description}</p>
              </div>
              );
            })}
         </div>
      </section>

      {/* 3. THE FLEET BOARD (NOW WITH PICTURES) */}
      <section id="fleet" className="py-32 px-10 max-w-[1600px] mx-auto relative z-20 bg-white border border-gray-200 shadow-2xl">
         <div className="grid lg:grid-cols-12 gap-20 items-start">
            <div className="lg:col-span-4">
                <span className="text-[#125740] text-[11px] font-black uppercase tracking-[0.4em] mb-4 block">{t("fleet.badge")}</span>
                <h2 className="text-6xl font-black text-[#0A1128] uppercase tracking-tighter mb-8 leading-[0.9] whitespace-pre-line">{t("fleet.title")}</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs leading-relaxed mb-10">{t("fleet.subtitle")}</p>
                <div className="bg-[#F9F8F6] p-8 border-l-4 border-[#125740]">
                   <p className="text-[10px] font-black text-[#0A1128] uppercase tracking-widest leading-relaxed">
                      {t("fleet.note")}
                   </p>
                </div>
            </div>

            <div className="lg:col-span-8 grid md:grid-cols-2 gap-1 bg-gray-200 border border-gray-200 overflow-hidden">
               {fleet.map((car) => {
                 const CarIcon = getIcon(car.icon);
                 return (
                 <div key={car.id} className="bg-white group hover:bg-[#0A1128] transition-all duration-500 flex flex-col">
                    {/* CAR IMAGE CONTAINER */}
                    <div className="h-64 relative overflow-hidden">
                       <div 
                         className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                         style={{ backgroundImage: `url('${car.image}')` }} 
                       />
                       <div className="absolute top-0 left-0 bg-[#125740] text-white px-5 py-2">
                          <span className="text-[10px] font-black uppercase tracking-widest">{car.capacity}</span>
                       </div>
                    </div>
                    
                    <div className="p-10 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-6">
                           <CarIcon className="w-6 h-6 text-[#125740]" />
                           <h3 className="text-3xl font-black text-[#0A1128] group-hover:text-white uppercase tracking-tighter leading-none">{car.type}</h3>
                        </div>
                        <p className="text-xs font-bold text-gray-400 group-hover:text-white/50 uppercase tracking-widest leading-relaxed mb-10 flex-grow">{car.bestFor}</p>
                        <Link href="/book" onClick={triggerHaptic} className="h-14 w-full bg-[#0A1128] group-hover:bg-[#125740] flex items-center justify-between px-8 transition-all">
                           <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">{t("fleet.select")}</span>
                           <ArrowRight size={16} className="text-[#125740] group-hover:text-white" />
                        </Link>
                    </div>
                 </div>
                 );
               })}
            </div>
         </div>
      </section>

      {/* 4. CLIENT FEEDBACK */}
      <section className="py-40 px-10 max-w-[1600px] mx-auto text-center">
          <h2 className="text-5xl font-black text-[#0A1128] uppercase tracking-tighter mb-20">{t("reviews.title")}</h2>
          <div className="grid md:grid-cols-2 gap-10 text-left">
             {reviews.map((rev) => (
               <div key={rev.id} className="bg-white p-12 shadow-xl border border-gray-100 relative overflow-hidden group">
                  <Quote className="absolute -top-6 -right-6 w-32 h-32 text-[#F9F8F6] group-hover:text-[#125740]/5 transition-colors" />
                  <div className="relative z-10">
                     <div className="flex items-center gap-6 mb-10">
                        <div className="w-14 h-14 bg-[#0A1128] text-white flex items-center justify-center font-black text-2xl">{rev.initial}</div>
                        <div>
                           <h4 className="text-xl font-black text-[#0A1128] uppercase tracking-tight">{rev.client}</h4>
                           <span className="text-[10px] font-black text-[#125740] uppercase tracking-[0.3em]">{t("reviews.rental", { car: rev.car })}</span>
                        </div>
                     </div>
                     <p className="text-lg font-bold text-[#0A1128] italic leading-relaxed uppercase tracking-tight mb-0">{t("reviews.quote", { text: rev.comment })}</p>
                     {reviewNote && (
                       <p className="text-[9px] font-bold uppercase tracking-widest text-[#0A1128]/30 mt-3">{reviewNote}</p>
                     )}
                  </div>
               </div>
             ))}
          </div>
      </section>

      <Footer />
    </main>
  );
}

export default function DriverPage() {
  const t = useTranslations("Driver");
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A1128] flex items-center justify-center text-white font-black uppercase tracking-[0.5em]">{t("loading")}</div>}>
      <DriverContent />
    </Suspense>
  );
}