"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Manrope } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  MapPin, ArrowRight, Navigation, Fuel, AlertCircle, ShieldCheck, 
  Clock, Sun, Moon, Zap, Timer, CloudRain, Activity, TrafficCone,
  AlertTriangle, Eye, ShieldAlert, Wifi, HardHat, Car, Users, Bus,
  Mountain, Waves, TreePine, Shovel, DollarSign, Euro, PoundSterling
} from "lucide-react";
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

const POPULAR_ROUTES = [
  { 
    dest: "Musanze (Volcanoes)", 
    dist: "2.5 Hours", 
    km: "95km",
    prices: { sedan: "70k", suv: "90k", van: "150k", bus: "250k" },
    intel: "Highland Ascent / Curvy Passages",
    terrain: "Highland",
    isMountainous: true
  },
  { 
    dest: "Akagera National Park", 
    dist: "3 Hours", 
    km: "110km",
    prices: { sedan: "100k", suv: "120k", van: "180k", bus: "300k" },
    intel: "Savannah Access / Gravel Final Sector",
    terrain: "Savannah",
    isOutdoor: true
  },
  { 
    dest: "Huye (Butare)", 
    dist: "3 Hours", 
    km: "130km",
    prices: { sedan: "60k", suv: "80k", van: "140k", bus: "240k" },
    intel: "Southern Trunk / Steady Grade",
    terrain: "Southern Hills",
    isMountainous: false
  },
  { 
    dest: "Lake Kivu (Rubavu)", 
    dist: "3.5 Hours", 
    km: "155km",
    prices: { sedan: "80k", suv: "100k", van: "160k", bus: "280k" },
    intel: "Western Ridge / Coastal Descent",
    terrain: "Lakeside",
    isMountainous: true
  },
  { 
    dest: "Rusizi (Nyungwe Forest)", 
    dist: "5 Hours", 
    km: "220km",
    prices: { sedan: "110k", suv: "140k", van: "220k", bus: "350k" },
    intel: "Rainforest Transit / Restricted Speed Zones",
    terrain: "Tropical Forest",
    isMountainous: true
  },
  { 
    dest: "Kayonza", 
    dist: "1.5 Hours", 
    km: "75km",
    prices: { sedan: "50k", suv: "70k", van: "120k", bus: "200k" },
    intel: "Eastern Plateau / High Speed Corridor",
    terrain: "Plateau",
    isMountainous: false
  },
];

function TransfersContent() {
  const router = useRouter();
  const [kigaliTime, setKigaliTime] = useState("");
  const [weatherStatus, setWeatherStatus] = useState<{ temp: number; condition: string } | null>(null);
  
  // EXCHANGE RATE ENGINE
  const [rawRates, setRawRates] = useState<{ USD: number, EUR: number, GBP: number } | null>(null);
  const [amounts, setAmounts] = useState<Record<string, number>>({ USD: 1, EUR: 1, GBP: 1 });

  // 1. LIVE INTELLIGENCE ENGINE (WEATHER + EXCHANGE)
  useEffect(() => {
    async function fetchLiveIntelligence() {
      try {
        // Fetch Weather
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`);
        const weatherData = await weatherRes.json();
        if (weatherRes.ok) {
           setWeatherStatus({ temp: Math.round(weatherData.main.temp), condition: weatherData.weather[0].main });
        }

        // Fetch Exchange Rates
        const rateRes = await fetch('https://api.exchangerate-api.com/v4/latest/RWF');
        const rateData = await rateRes.json();
        if (rateRes.ok) {
          setRawRates({ USD: rateData.rates.USD, EUR: rateData.rates.EUR, GBP: rateData.rates.GBP });
        }
      } catch (e) { 
        setWeatherStatus({ temp: 24, condition: "Clear" }); 
      }
    }
    fetchLiveIntelligence();
    const interval = setInterval(fetchLiveIntelligence, 600000);
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

  const convertToRWF = (ratePerRWF: number, amount: number) => {
    if (!ratePerRWF) return "0";
    return Math.round((1 / ratePerRWF) * amount).toLocaleString();
  };

  const handleAmountChange = (label: string, value: string) => {
    const num = parseFloat(value);
    setAmounts(prev => ({ ...prev, [label]: isNaN(num) ? 0 : num }));
  };

  const missionStatus = useMemo(() => {
    const hour = parseInt(kigaliTime.split(":")[0]);
    if (isNaN(hour)) return { label: "Syncing System...", icon: Timer, color: "text-gray-400" };
    if (hour >= 17 && hour < 18) return { label: "Visibility High: Golden Hour", icon: Sun, color: "text-orange-400" };
    if (hour >= 18 || hour < 5) return { label: "Night Ops Mode Active", icon: Moon, color: "text-blue-400" };
    return { label: "Clear Operational Window", icon: Zap, color: "text-[#C97C2F]" };
  }, [kigaliTime]);

  return (
    <main className={`min-h-screen bg-[#F5F2EA] ${manrope.className} selection:bg-[#C97C2F]/20 relative`}>
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#111827 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.08 }}></div>

      <Header />

      {/* TACTICAL HERO MISSION BOARD */}
      <section className="relative pt-40 pb-20 px-10 min-h-[85vh] flex items-center bg-[#111827] overflow-hidden">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40 grayscale" style={{ backgroundImage: "url('/backrounds/winding-road.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/95 via-[#111827]/50 to-[#111827]" />

        <div className="relative z-10 max-w-[1600px] mx-auto w-full grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-3 py-2 px-6 bg-[#C97C2F] text-white font-black text-[10px] uppercase tracking-[0.4em] mb-10 shadow-2xl">
              Logistics Network: READY
            </div>
            <h1 className="text-6xl md:text-9xl font-black text-white mb-10 leading-[0.85] tracking-tighter uppercase">
              Nationwide <br/><span className="text-[#C97C2F]">Coverage.</span>
            </h1>
            <p className="text-lg text-white/50 max-w-xl font-bold uppercase tracking-widest leading-relaxed border-l-4 border-[#C97C2F] pl-8">
              Strategized city-to-city transfers. Professional drivers, 24/7 telemetry monitoring, and the definitive standard for Rwandan long-range mobility.
            </p>
          </div>

          <div className="flex flex-col gap-6 bg-white/5 backdrop-blur-xl p-10 border border-white/10 shadow-2xl">
             <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <span className="text-[10px] font-black text-[#C97C2F] uppercase tracking-[0.4em]">Mission Dashboard</span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] font-black text-white uppercase">System Live</span>
                </div>
             </div>
             
             {/* TIME & WEATHER GRID */}
             <div className="grid grid-cols-2 gap-8 border-b border-white/10 pb-8">
                <div className="space-y-2">
                   <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Kigali Local Time</span>
                   <p className="text-4xl font-black text-white tabular-nums">{kigaliTime}</p>
                </div>
                <div className="space-y-2">
                   <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Atmospheric Metrics</span>
                   <p className="text-4xl font-black text-white uppercase">{weatherStatus?.temp}°C • {weatherStatus?.condition}</p>
                </div>
             </div>

             {/* DYNAMIC CURRENCY INDEX */}
             <div className="space-y-4 border-b border-white/10 pb-8">
                <span className="text-[9px] font-black text-[#C97C2F] uppercase tracking-widest block">Tactical Valuation (RWF Index)</span>
                <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 border border-white/5">
                   {[
                      { label: "USD", symbol: "$", key: "USD" },
                      { label: "EUR", symbol: "€", key: "EUR" },
                      { label: "GBP", symbol: "£", key: "GBP" }
                   ].map((cur) => (
                      <div key={cur.key} className="bg-[#111827] p-4 group transition-all hover:bg-white/5">
                         <div className="flex items-center gap-2 mb-2">
                            <span className="text-white font-black text-xs">{cur.symbol}</span>
                            <input 
                               type="number" 
                               value={amounts[cur.key as keyof typeof amounts] === 0 ? "" : amounts[cur.key as keyof typeof amounts]}
                               onChange={(e) => handleAmountChange(cur.key, e.target.value)}
                               className="bg-transparent border-none focus:ring-0 p-0 text-white font-black text-lg w-full outline-none"
                               placeholder="0"
                            />
                         </div>
                         <div className="text-[9px] font-black text-[#C97C2F] uppercase tabular-nums">
                            {rawRates ? convertToRWF(rawRates[cur.key as keyof typeof rawRates], amounts[cur.key]) : "---"} RWF
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="flex items-center gap-4 py-4 px-6 bg-[#C97C2F]/10 border border-[#C97C2F]/20">
                <missionStatus.icon className={`w-5 h-5 ${missionStatus.color}`} />
                <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{missionStatus.label}</span>
             </div>

             <Link href="/book?tab=country" onClick={triggerHaptic} className="h-20 bg-[#C97C2F] hover:bg-white hover:text-[#111827] text-white transition-all flex items-center justify-between px-10">
                <span className="text-xs font-black uppercase tracking-[0.5em]">Initiate Booking Protocol</span>
                <ArrowRight className="w-6 h-6" />
             </Link>
          </div>
        </div>
      </section>

      {/* THE COMMAND MATRIX (ROUTE BOARD) */}
      <section className="py-40 px-10 max-w-[1600px] mx-auto relative z-20">
        <div className="mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
           <div className="max-w-2xl border-l-4 border-[#C97C2F] pl-8">
              <h2 className="text-6xl font-black text-[#111827] uppercase tracking-tighter mb-4">Route Intelligence Board</h2>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">Fixed-rate nationwide logistics. Comprehensive driver & fuel overhead included.</p>
           </div>
           
           {weatherStatus?.condition === "Rain" && (
             <div className="bg-red-600 text-white px-8 py-4 flex items-center gap-4 animate-pulse">
                <AlertTriangle size={24} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Rain Protocol Engaged</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest opacity-80">4x4 Asset Class Required for Mountain Sectors</span>
                </div>
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 gap-1 bg-gray-200 border border-gray-200 shadow-2xl">
          {POPULAR_ROUTES.map((route, i) => {
             const TerrainIcon = route.terrain === "Highland" ? Mountain : route.terrain === "Savannah" ? Shovel : route.terrain === "Lakeside" ? Waves : TreePine;
             
             return (
               <div 
                 key={i} 
                 className="bg-white hover:bg-[#111827] group transition-all duration-500 p-10 grid lg:grid-cols-12 gap-10 items-center"
               >
                 <div className="lg:col-span-4 flex items-center gap-8">
                    <div className="w-20 h-20 bg-[#F5F2EA] group-hover:bg-[#C97C2F]/10 flex items-center justify-center transition-colors">
                       <TerrainIcon className="w-8 h-8 text-[#C97C2F]" />
                    </div>
                    <div>
                       <h3 className="text-4xl font-black text-[#111827] group-hover:text-white uppercase tracking-tighter mb-2">{route.dest}</h3>
                       <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{route.km} • {route.dist}</span>
                          <div className="w-1 h-1 bg-[#C97C2F] rounded-full" />
                          <span className="text-[10px] font-black text-[#C97C2F] uppercase tracking-widest">{route.terrain} Sector</span>
                       </div>
                    </div>
                 </div>

                 <div className="lg:col-span-3 border-l border-gray-100 group-hover:border-white/5 pl-10">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 block">Field Status</span>
                    <div className="space-y-2">
                       <div className="flex items-center gap-3">
                          <TrafficCone size={12} className="text-[#C97C2F]" />
                          <p className="text-[10px] font-bold text-[#111827] group-hover:text-white/70 uppercase tracking-widest">{route.intel}</p>
                       </div>
                       {weatherStatus?.condition === "Rain" && route.isMountainous && (
                         <div className="flex items-center gap-3">
                            <CloudRain size={12} className="text-blue-400" />
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Visibility Reduced: High Traction Recommended</p>
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="lg:col-span-4 grid grid-cols-4 gap-4 border-l border-gray-100 group-hover:border-white/5 pl-10">
                    {[
                      { icon: Car, label: "Sedan", price: route.prices.sedan },
                      { icon: Activity, label: "SUV", price: route.prices.suv },
                      { icon: Users, label: "VAN", price: route.prices.van },
                      { icon: Bus, label: "Bus", price: route.prices.bus }
                    ].map((asset, idx) => (
                      <div key={idx} className="text-center group/asset">
                         <asset.icon size={16} className="mx-auto text-gray-300 group-hover:text-[#C97C2F] mb-3 transition-colors" />
                         <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{asset.label}</span>
                         <span className="block text-[11px] font-black text-[#111827] group-hover:text-white tabular-nums">{asset.price}</span>
                      </div>
                    ))}
                 </div>

                 <div className="lg:col-span-1 flex justify-end">
                    <Link 
                      href={`/book?tab=country&dest=${encodeURIComponent(route.dest)}`}
                      onClick={triggerHaptic}
                      className="h-16 w-16 bg-[#111827] group-hover:bg-[#C97C2F] flex items-center justify-center text-white transition-all shadow-xl"
                    >
                       <ArrowRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                    </Link>
                 </div>
               </div>
             );
          })}
        </div>

        <div className="mt-20 flex justify-center">
            <Link href="/book?tab=country" onClick={triggerHaptic} className="h-20 px-20 bg-[#111827] text-white hover:bg-[#C97C2F] transition-all flex items-center gap-10 shadow-2xl">
                <span className="text-xs font-black uppercase tracking-[0.5em]">Explore Full Logistics Catalogue</span>
                <ArrowRight size={24} />
            </Link>
        </div>
      </section>

      {/* LOGISTICS PROTOCOL */}
      <section className="py-40 bg-[#111827] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/backrounds/grid.png')] opacity-5" />
          <div className="max-w-[1600px] mx-auto px-10 grid lg:grid-cols-2 gap-32 items-center relative z-10">
            <div>
               <span className="text-[#C97C2F] text-[10px] font-black uppercase tracking-[0.4em] mb-6 block">Fleet Operations v.2026</span>
               <h2 className="text-5xl md:text-[6rem] font-black text-white mb-16 uppercase tracking-tighter leading-none">Standardized <br />Reliability.</h2>

               <div className="space-y-12">
                  {[
                    { icon: ShieldAlert, title: "Diagnostic Protocol", desc: "Every unit undergoes a comprehensive 50-point diagnostics scan before deployment. Zero fleet failure threshold." },
                    { icon: HardHat, title: "Asset Redundancy", desc: "In the rare event of mechanical failure, a replacement logistics unit is dispatched from our nearest sector depot within 45 mins." },
                    { icon: Wifi, title: "GPS Telemetry", desc: "Long-range transfers are monitored via real-time satellite GPS. Your arrival timing is tracked by our central operations desk." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-8 group">
                       <div className="w-20 h-20 bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#C97C2F] group-hover:border-[#C97C2F] transition-all">
                          <item.icon className="w-8 h-8 text-[#C97C2F] group-hover:text-white" />
                       </div>
                       <div className="max-w-md">
                          <h4 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">{item.title}</h4>
                          <p className="text-sm text-white/40 leading-relaxed font-bold uppercase tracking-wider">{item.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-[#C97C2F] p-20 shadow-2xl relative">
               <div className="absolute top-0 right-0 p-10 opacity-20"><Zap size={140} className="text-white" /></div>
               <h3 className="text-5xl font-black text-[#111827] mb-8 uppercase tracking-tighter">Mission: <br />The National Park.</h3>
               <p className="text-[#111827] text-xl mb-12 font-bold uppercase tracking-wide leading-relaxed">
                  Sector Update: The National Park routes require high-clearance 4WD assets. We strictly mandate <strong className="bg-[#111827] text-white px-3">Comfort SUV</strong> class for these deployments to ensure mission success.
               </p>
               <Link href="/book?vehicle=comfort&dest=Akagera" onClick={triggerHaptic} className="h-20 w-full bg-[#111827] text-white font-black uppercase text-[11px] tracking-[0.5em] hover:bg-white hover:text-[#111827] transition-all flex items-center justify-center gap-6">
                  Initialize Akagera Deployment <ArrowRight size={24} />
               </Link>
            </div>
          </div>
      </section>

      <Footer />
    </main>
  );
}

export default function TransfersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111827] flex items-center justify-center text-white font-black uppercase tracking-[0.5em]">Synchronizing Analytics...</div>}>
      <TransfersContent />
    </Suspense>
  );
}