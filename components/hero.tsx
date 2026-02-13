"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sun, Clock, Activity, Zap, Shield, CheckCircle, MapPin } from "lucide-react";
import { Manrope } from "next/font/google";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

const API_KEY = "23f292fb66ec335896541f0b5e8b87bf"; 
const CITY = "Kigali";

export function Hero() {
  const [time, setTime] = useState<Date | null>(null);
  const [weather, setWeather] = useState<{ temp: number; condition: string; desc: string } | null>(null);
  const [rawRates, setRawRates] = useState<{ USD: number, EUR: number, GBP: number } | null>(null);
  const [amounts, setAmounts] = useState<Record<string, number>>({ USD: 1, EUR: 1, GBP: 1 });

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`);
        const weatherData = await weatherRes.json();
        if (weatherRes.ok) {
           setWeather({
             temp: Math.round(weatherData.main.temp),
             condition: weatherData.weather[0].main,
             desc: weatherData.weather[0].description
           });
        }
        const rateRes = await fetch('https://api.exchangerate-api.com/v4/latest/RWF');
        const rateData = await rateRes.json();
        setRawRates({ USD: rateData.rates.USD, EUR: rateData.rates.EUR, GBP: rateData.rates.GBP });
      } catch (e) {
        setWeather({ temp: 24, condition: "Clear", desc: "Sunny" }); 
      }
    }
    fetchData();
  }, []);

  const convertToRWF = (ratePerRWF: number, amount: number) => {
      if (!ratePerRWF) return "0";
      return Math.round((1 / ratePerRWF) * amount).toLocaleString();
  };

  const handleAmountChange = (label: string, value: string) => {
      const num = parseFloat(value);
      setAmounts(prev => ({ ...prev, [label]: isNaN(num) ? 0 : num }));
  };

  const formatHMS = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return { h, m, s };
  };

  return (
    <section className="relative w-full min-h-screen flex items-center bg-[#F5F2EA] overflow-hidden rounded-b-[4rem] shadow-2xl z-10">
      
      {/* 1. BACKGROUND SYSTEM */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-b-[4rem]">
        <div 
          className="absolute inset-0 bg-cover bg-center grayscale opacity-10" 
          style={{ 
            backgroundImage: "url('/backrounds/pexels-faustin-nkurunziza.jpg')",
            maskImage: 'linear-gradient(to right, black 30%, transparent 80%)',
            WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent 80%)'
          }}
        />
        <div className="absolute left-0 top-0 bottom-0 w-24 z-0 pointer-events-none opacity-20"
             style={{ backgroundImage: 'radial-gradient(#111827 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-0 pointer-events-none opacity-20"
             style={{ backgroundImage: 'radial-gradient(#111827 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
      </div>

      <div className="relative z-10 w-full pt-32 grid lg:grid-cols-2 gap-0 items-stretch min-h-screen">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col justify-center py-12 pl-10 md:pl-20 pr-10 lg:border-r border-[#111827]/5">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="inline-flex items-center gap-3 py-2 px-5 bg-[#111827] text-white mb-10 self-start shadow-xl"
          >
            <Shield className="w-4 h-4 text-[#C97C2F]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Welcome to SURA Essence 👋</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-6xl md:text-8xl font-black text-[#111827] mb-6 uppercase tracking-tighter leading-[0.85]">
            YOUR TRUSTED <br />
            <span className="text-[#C97C2F]">GATEWAY TO RWANDA.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base text-[#111827]/60 mb-10 max-w-xl leading-relaxed font-black uppercase tracking-widest">
            METICULOUSLY CURATED FLEET. ZERO HIDDEN COSTS. <br />
            THE DEFINITIVE STANDARD FOR RWANDAN TRAVEL.
          </motion.p>

          <div className="flex flex-wrap gap-6 mb-12">
            {[
              { label: "All-Inclusive Pricing", icon: CheckCircle },
              { label: "24/7 Professional Support", icon: Activity },
              { label: "Verified Visual Proof", icon: Zap }
            ].map((pillar) => (
              <div key={pillar.label} className="flex items-center gap-2">
                <pillar.icon className="w-4 h-4 text-[#C97C2F]" />
                <span className="text-[10px] font-black text-[#111827] uppercase tracking-widest">{pillar.label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#111827]/10 bg-white shadow-2xl max-w-2xl mb-12 relative group">
            <div className="absolute -top-3 left-6 bg-[#C97C2F] text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest z-20">Live RWF Exchange</div>
            {[
                { label: "USD Index", symbol: "$", key: "USD" },
                { label: "EUR Index", symbol: "€", key: "EUR" },
                { label: "GBP Index", symbol: "£", key: "GBP" }
            ].map((cur) => (
                <div key={cur.key} className="group flex flex-col p-6 border-r border-[#111827]/10 last:border-r-0 transition-all hover:bg-[#F5F2EA]">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">{cur.label}</span>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[#111827] text-lg font-black">{cur.symbol}</span>
                            <input 
                                type="number" 
                                value={amounts[cur.key as keyof typeof amounts] === 0 ? "" : amounts[cur.key as keyof typeof amounts]}
                                onChange={(e) => handleAmountChange(cur.key, e.target.value)}
                                className="bg-transparent border-none focus:ring-0 p-0 text-[#111827] font-black text-2xl w-full outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div className="text-[11px] font-black text-[#C97C2F] tabular-nums tracking-widest mt-3 uppercase">
                            {rawRates ? convertToRWF(rawRates[cur.key as keyof typeof rawRates], amounts[cur.key]) : "---"} RWF
                        </div>
                    </div>
                </div>
            ))}
          </div>

          <div className="flex flex-col self-start">
            <span className="text-[11px] font-black text-[#111827] uppercase tracking-[0.4em] mb-1">
              BEYOND THE RENTAL. A JOURNEY IN TRUST.
            </span>
            <div className="h-[2px] w-full bg-[#C97C2F]" />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col justify-center items-end pr-10 md:pr-20 pl-10 py-12 gap-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-md">
                <div className="bg-white border border-[#111827]/10 p-8 flex flex-col justify-between aspect-square shadow-xl">
                    <div className="flex justify-between items-start">
                        <span className="text-[#C97C2F] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                           <Zap className="w-3 h-3 fill-current" /> ENV.METRIC
                        </span>
                        {weather && <Sun className="w-8 h-8 text-[#111827]" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin size={12} className="text-[#C97C2F]" />
                          <h3 className="text-[#111827] text-sm font-black tracking-[0.2em] uppercase">{CITY}, RW</h3>
                        </div>
                        <span className="text-7xl font-black text-[#111827] leading-none tracking-tighter">{weather ? `${weather.temp}°` : "--"}</span>
                    </div>
                </div>

                <div className="bg-[#111827] p-8 flex flex-col justify-between aspect-square shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-5">
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">CHRONO.SYS</span>
                        <Activity className="w-4 h-4 text-[#C97C2F] animate-pulse" />
                    </div>
                    <div className="flex flex-col text-white">
                        {time ? (
                            <>
                                <span className="text-6xl font-black tabular-nums tracking-tighter leading-none">
                                    {formatHMS(time).h}:{formatHMS(time).m}
                                </span>
                                <span className="text-[#C97C2F] font-black text-2xl tabular-nums mt-2">{formatHMS(time).s}</span>
                            </>
                        ) : (
                            <span className="text-5xl font-black text-white/5">--:--</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-5 w-full max-w-md">
                <Link href="/book" className="w-full">
                    <div className="group h-24 bg-[#111827] flex items-center justify-between px-10 transition-all hover:bg-[#C97C2F] shadow-2xl">
                        <span className="text-[#F5F2EA] text-sm font-black uppercase tracking-[0.3em]">Book Your Ride</span>
                        <ArrowRight className="text-[#C97C2F] group-hover:text-white w-6 h-6 group-hover:translate-x-3 transition-transform" />
                    </div>
                </Link>
                <Link href="#pricing" className="w-full">
                    <div className="h-16 border-2 border-[#111827] flex items-center justify-center text-[#111827] hover:bg-[#111827] hover:text-white transition-all text-[11px] font-black uppercase tracking-[0.25em]">
                        Browse Fleet Catalogue
                    </div>
                </Link>
            </div>

            <Link href="#pricing" className="group flex flex-col w-full max-w-md transition-all hover:-translate-x-1">
              <span className="text-[11px] font-black text-[#111827] uppercase tracking-[0.4em] mb-1 text-right">
                FIND YOUR FLEET
              </span>
              <div className="h-[2px] w-full bg-[#C97C2F] transform scale-x-100 group-hover:scale-x-110 transition-transform origin-right" />
            </Link>
        </div>
      </div>
    </section>
  );
}