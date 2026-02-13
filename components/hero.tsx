"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Sun, Clock, Activity, Zap } from "lucide-react";
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
  
  // 1. INDEPENDENT CURRENCY STATE
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
        setRawRates({
            USD: rateData.rates.USD,
            EUR: rateData.rates.EUR,
            GBP: rateData.rates.GBP
        });
      } catch (e) {
        setWeather({ temp: 24, condition: "Clear", desc: "Sunny" }); 
      }
    }
    fetchData();
  }, []);

  // Updated Conversion Logic for Independent Amounts
  const convertToRWF = (ratePerRWF: number, amount: number) => {
      if (!ratePerRWF) return "0";
      return Math.round((1 / ratePerRWF) * amount).toLocaleString();
  };

  // Logic to handle input changes without leading zeros
  const handleAmountChange = (label: string, value: string) => {
      const num = parseFloat(value);
      setAmounts(prev => ({ 
          ...prev, 
          [label]: isNaN(num) ? 0 : num 
      }));
  };

  const formatHMS = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return { h, m, s };
  };

  const formatDate = (date: Date) => date.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <section className={`relative w-full h-[90vh] min-h-[750px] flex items-center overflow-hidden bg-[#111827] rounded-b-[2.5rem] shadow-2xl z-10 ${manrope.className}`}>
      
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/backrounds/pexels-faustin-nkurunziza.jpg')" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#111827]/95 via-[#111827]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/70 via-transparent to-transparent" />
        <div className="absolute bottom-8 right-8 z-20 pointer-events-none">
           <span className="text-[9px] text-white/20 font-medium tracking-widest uppercase">Photo: Faustin Nkurunziza</span>
        </div>
      </div>

      <div className="relative z-10 px-6 md:px-20 w-full max-w-[1550px] mx-auto pt-10 grid lg:grid-cols-12 gap-12 items-center">
        
        <div className="lg:col-span-8 flex flex-col items-start max-w-3xl">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center gap-2 py-1.5 px-3.5 rounded-lg bg-[#C97C2F]/10 border border-[#C97C2F]/20 backdrop-blur-md mb-6">
            <MapPin className="w-3.5 h-3.5 text-[#C97C2F]" /> 
            <span className="text-[#C97C2F] text-[10px] font-bold uppercase tracking-widest">Premium Transport Rwanda</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-6 tracking-tight leading-[1]">
            Your Journey in <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C97C2F] to-orange-200">Absolute Trust.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-base md:text-lg lg:text-xl text-gray-300 mb-6 max-w-xl leading-relaxed font-medium">
            Experience Rwanda with a meticulously curated fleet. <br />
            No hidden costs. No stress. Just the open road.
          </motion.p>

          {/* 2. INDEPENDENT CONVERTER CARDS */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-wrap gap-4 mb-10">
            {[
                { label: "USD", symbol: "$", rate: rawRates?.USD },
                { label: "EUR", symbol: "€", rate: rawRates?.EUR },
                { label: "GBP", symbol: "£", rate: rawRates?.GBP }
            ].map((cur) => (
                <div key={cur.label} className="group flex flex-col bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-sm shadow-xl min-w-[140px] transition-all hover:border-[#C97C2F]/40 hover:bg-white/10">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">{cur.label} / RWF</span>
                    
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400 text-xs font-bold">{cur.symbol}</span>
                            <input 
                                type="number" 
                                // Show empty string if value is 0 to prevent leading zero issues
                                value={amounts[cur.label] === 0 ? "" : amounts[cur.label]}
                                onChange={(e) => handleAmountChange(cur.label, e.target.value)}
                                className="bg-transparent border-none focus:ring-0 p-0 text-white font-bold text-sm w-full outline-none placeholder-gray-600"
                                placeholder="0"
                            />
                        </div>
                        <div className="text-xs font-black text-[#C97C2F] tabular-nums tracking-wider mt-1">
                            {rawRates ? convertToRWF(cur.rate!, amounts[cur.label]) : "---"} 
                            <span className="text-[9px] text-gray-500 font-bold ml-1">RWF</span>
                        </div>
                    </div>
                </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT COL: COMPACT WIDGETS */}
        <div className="hidden lg:flex lg:col-span-4 flex-col items-end justify-center gap-6">
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-3 w-64">
                <Link href="/book" className="w-full">
                    <div className="group relative h-14 bg-[#C97C2F] hover:bg-[#A05D1C] rounded-xl flex items-center justify-center gap-3 shadow-xl transition-all hover:-translate-y-1">
                        <span className="text-white text-xs font-bold uppercase tracking-widest">Book Your Ride</span>
                        <ArrowRight className="text-white w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
                <Link href="#pricing" className="w-full">
                    <div className="h-14 rounded-lg border border-white/20 hover:bg-white hover:text-[#111827] text-white flex items-center justify-center transition-all backdrop-blur-md text-xs font-bold uppercase tracking-widest">
                        View Fleet & Rates
                    </div>
                </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-64 bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl relative overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C97C2F] rounded-full blur-[60px] opacity-10" />
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <span className="text-[#C97C2F] text-[9px] font-bold uppercase tracking-widest mb-0.5 block flex items-center gap-1">
                          <Zap className="w-2 h-2 fill-current" /> Live Status
                        </span>
                        <h3 className="text-white text-lg font-bold tracking-tight">{CITY}, RW</h3>
                    </div>
                    {weather && <Sun className="w-8 h-8 text-[#C97C2F] animate-pulse" />}
                </div>
                <div className="flex items-end gap-2 relative z-10">
                    <span className="text-5xl font-black text-white leading-none">{weather ? `${weather.temp}°` : "--"}</span>
                    <span className="text-gray-400 font-medium text-sm mb-1 capitalize">{weather ? weather.desc : "Syncing..."}</span>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-64 bg-[#111827]/90 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-2xl relative pointer-events-none">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#C97C2F]" />
                        <span className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.2em]">KGL-CHRONO</span>
                    </div>
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
                      <Activity className="w-3.5 h-3.5 text-[#C97C2F]" />
                    </motion.div>
                </div>
                <div className="flex items-baseline gap-1.5">
                    {time ? (
                        <>
                            <div className="text-4xl font-black text-white tabular-nums tracking-tighter">
                                {formatHMS(time).h}:{formatHMS(time).m}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[#C97C2F] font-black text-lg tabular-nums leading-none">{formatHMS(time).s}</span>
                              <span className="text-[8px] font-bold text-gray-600 uppercase">SEC</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-4xl font-black text-white/10">--:--</div>
                    )}
                </div>
            </motion.div>
        </div>
      </div>
    </section>
  );
}