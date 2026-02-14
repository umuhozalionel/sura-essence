"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Manrope } from "next/font/google";
import Link from "next/link";
import { 
  UserCheck, Wifi, Star, ArrowRight, ShieldCheck, Quote, 
  Clock, Sun, Moon, Zap, Timer, Activity, 
  Navigation, WifiHigh, Car, Users, Bus, 
  DollarSign, Euro, PoundSterling, CheckCircle2
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

const FLEET_OPTIONS = [
  { 
    type: "Standard Sedan", 
    capacity: "3-4 Seats", 
    bestFor: "Perfect for solo travelers or small groups needing a quick, efficient way to move through the city.", 
    image: "/fleet/standard-sedan.jpg",
    icon: Car 
  },
  { 
    type: "Comfort SUV", 
    capacity: "4-5 Seats", 
    bestFor: "Ideal for longer trips, rougher terrain, or travelers with extra luggage. High-clearance and very comfortable.", 
    image: "/fleet/comfort-suv.jpg",
    icon: Activity 
  },
  { 
    type: "Private Van", 
    capacity: "7-10 Seats", 
    bestFor: "The best choice for large families or business teams traveling together with equipment.", 
    image: "/fleet/private-van.jpg",
    icon: Users 
  },
  { 
    type: "Executive Bus", 
    capacity: "20+ Seats", 
    bestFor: "Tailored for large events, conferences, and wedding guest transportation across the country.", 
    image: "/fleet/executive-bus.webp",
    icon: Bus 
  }
];

const REVIEWS = [
  {
    initial: "B",
    client: "Business Team",
    comment: "Our driver knew every shortcut in Kigali. He stayed with us for 10 hours and made sure we were never late for our meetings.",
    car: "Comfort Van"
  },
  {
    initial: "W",
    client: "Wedding Guest",
    comment: "I booked a driver for a late-night return from a party. He was on time, professional, and I felt very safe getting home at 2 AM.",
    car: "Standard Sedan"
  }
];

function DriverContent() {
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
    if (isNaN(hour)) return { label: "Updating System...", icon: Timer, color: "text-gray-400" };
    if (hour >= 18 || hour < 5) return { label: "Evening Service Active", icon: Moon, color: "text-blue-400" };
    return { label: "Standard Day Service", icon: Sun, color: "text-[#C97C2F]" };
  }, [kigaliTime]);

  return (
    <main className={`min-h-screen bg-[#F5F2EA] ${manrope.className} selection:bg-[#C97C2F]/20 relative`}>
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#111827 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.08 }}></div>

      <Header />

      {/* 1. CENTERED HERO SECTION */}
      <section className="relative pt-48 pb-32 px-10 bg-[#111827] overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30 grayscale"
          style={{ backgroundImage: "url('/backrounds/chauffeur-hero.jpg')" }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#111827]/80 to-[#111827]" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 py-2 px-6 bg-[#C97C2F] text-white font-black text-[10px] uppercase tracking-[0.4em] mb-12 shadow-2xl">
            Reliable Driver Service
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-6xl md:text-9xl font-black text-white mb-10 leading-[0.85] tracking-tighter uppercase">
            Your Private <br /><span className="text-[#C97C2F]">Driver In Rwanda.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-2xl text-white/60 max-w-3xl mx-auto font-bold uppercase tracking-widest leading-relaxed mb-16">
            Rent a professional driver and car for the day. <br />
            Skip the stress of driving and focus on your trip, meetings, or guests.
          </motion.p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/book?tab=hourly" onClick={triggerHaptic} className="h-20 px-12 bg-[#C97C2F] hover:bg-white hover:text-[#111827] text-white transition-all flex items-center justify-center gap-6 shadow-2xl">
                <span className="text-sm font-black uppercase tracking-[0.4em]">Book Now</span>
                <ArrowRight className="w-6 h-6" />
            </Link>
            <a href="#fleet" onClick={triggerHaptic} className="h-20 px-12 border-2 border-white/20 text-white hover:bg-white hover:text-[#111827] transition-all flex items-center justify-center">
                <span className="text-sm font-black uppercase tracking-[0.4em]">View Fleet</span>
            </a>
          </div>
        </div>

        {/* FLOATING STATUS BAR */}
        <div className="max-w-[1600px] mx-auto mt-32 grid grid-cols-1 md:grid-cols-4 gap-1 bg-white/5 border border-white/10 backdrop-blur-xl">
           <div className="p-8 border-r border-white/10 flex flex-col gap-2">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Kigali Clock</span>
              <div className="flex items-center gap-3">
                 <Clock className="w-5 h-5 text-[#C97C2F]" />
                 <p className="text-3xl font-black text-white tabular-nums">{kigaliTime}</p>
              </div>
           </div>
           <div className="p-8 border-r border-white/10 flex flex-col gap-2">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Local Weather</span>
              <div className="flex items-center gap-3">
                 <Sun className="w-5 h-5 text-[#C97C2F]" />
                 <p className="text-3xl font-black text-white uppercase">{weatherStatus?.temp}°C • {weatherStatus?.condition}</p>
              </div>
           </div>
           <div className="p-8 border-r border-white/10 flex flex-col gap-2">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Currency Check</span>
              <p className="text-xl font-black text-white uppercase">1 USD = {rawRates ? Math.round(1 / rawRates.USD).toLocaleString() : "---"} RWF</p>
           </div>
           <div className="p-8 flex items-center gap-4 bg-[#C97C2F]/10">
              <getDayNightStatus.icon className={`w-6 h-6 ${getDayNightStatus.color}`} />
              <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{getDayNightStatus.label}</span>
           </div>
        </div>
      </section>

      {/* 2. SERVICE STANDARDS (FEATURE GRID) */}
      <section className="py-32 px-10 max-w-[1600px] mx-auto relative z-20">
         <div className="mb-20 max-w-2xl border-l-4 border-[#C97C2F] pl-8">
            <h2 className="text-5xl font-black text-[#111827] uppercase tracking-tighter mb-4">Quality Service</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">What you can expect from our professional team.</p>
         </div>

         <div className="grid md:grid-cols-4 gap-1 border border-gray-200 bg-gray-200 shadow-2xl">
            {[
              { icon: ShieldCheck, title: "Background Checked", desc: "Every driver is fully vetted, speaks English or French, and is trained in safe driving." },
              { icon: Clock, title: "Always Punctual", desc: "We respect your time. Your driver will be at your location 15 minutes before the pickup." },
              { icon: Navigation, title: "Local Navigation", desc: "Expert knowledge of all Kigali neighborhoods and the best routes to avoid traffic." },
              { icon: WifiHigh, title: "Free Wi-Fi", desc: "Stay online while you travel. High-speed internet is available in all our Comfort cars." }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-12 group hover:bg-[#111827] transition-all duration-500">
                <div className="w-16 h-16 bg-[#F5F2EA] group-hover:bg-[#C97C2F]/10 flex items-center justify-center mb-10 transition-colors">
                  <feature.icon className="w-8 h-8 text-[#C97C2F]" />
                </div>
                <h4 className="text-2xl font-black text-[#111827] group-hover:text-white uppercase tracking-tighter mb-4">{feature.title}</h4>
                <p className="text-xs font-bold text-gray-400 leading-relaxed uppercase tracking-widest">{feature.desc}</p>
              </div>
            ))}
         </div>
      </section>

      {/* 3. THE FLEET BOARD (NOW WITH PICTURES) */}
      <section id="fleet" className="py-32 px-10 max-w-[1600px] mx-auto relative z-20 bg-white border border-gray-200 shadow-2xl">
         <div className="grid lg:grid-cols-12 gap-20 items-start">
            <div className="lg:col-span-4">
                <span className="text-[#C97C2F] text-[11px] font-black uppercase tracking-[0.4em] mb-4 block">Our Vehicles</span>
                <h2 className="text-6xl font-black text-[#111827] uppercase tracking-tighter mb-8 leading-[0.9]">Choose the <br />Right Car.</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs leading-relaxed mb-10">We offer a range of vehicles to fit your group size and luggage needs.</p>
                <div className="bg-[#F5F2EA] p-8 border-l-4 border-[#C97C2F]">
                   <p className="text-[10px] font-black text-[#111827] uppercase tracking-widest leading-relaxed">
                      Daily rentals include the driver, fuel for Kigali city, and full insurance coverage.
                   </p>
                </div>
            </div>

            <div className="lg:col-span-8 grid md:grid-cols-2 gap-1 bg-gray-200 border border-gray-200 overflow-hidden">
               {FLEET_OPTIONS.map((car, i) => (
                 <div key={i} className="bg-white group hover:bg-[#111827] transition-all duration-500 flex flex-col">
                    {/* CAR IMAGE CONTAINER */}
                    <div className="h-64 relative overflow-hidden">
                       <div 
                         className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                         style={{ backgroundImage: `url('${car.image}')` }} 
                       />
                       <div className="absolute top-0 left-0 bg-[#C97C2F] text-white px-5 py-2">
                          <span className="text-[10px] font-black uppercase tracking-widest">{car.capacity}</span>
                       </div>
                    </div>
                    
                    <div className="p-10 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-6">
                           <car.icon className="w-6 h-6 text-[#C97C2F]" />
                           <h3 className="text-3xl font-black text-[#111827] group-hover:text-white uppercase tracking-tighter leading-none">{car.type}</h3>
                        </div>
                        <p className="text-xs font-bold text-gray-400 group-hover:text-white/50 uppercase tracking-widest leading-relaxed mb-10 flex-grow">{car.bestFor}</p>
                        <Link href="/book" onClick={triggerHaptic} className="h-14 w-full bg-[#111827] group-hover:bg-[#C97C2F] flex items-center justify-between px-8 transition-all">
                           <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Select Car</span>
                           <ArrowRight size={16} className="text-[#C97C2F] group-hover:text-white" />
                        </Link>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* 4. CLIENT FEEDBACK */}
      <section className="py-40 px-10 max-w-[1600px] mx-auto text-center">
          <h2 className="text-5xl font-black text-[#111827] uppercase tracking-tighter mb-20">Customer Feedback</h2>
          <div className="grid md:grid-cols-2 gap-10 text-left">
             {REVIEWS.map((rev, i) => (
               <div key={i} className="bg-white p-12 shadow-xl border border-gray-100 relative overflow-hidden group">
                  <Quote className="absolute -top-6 -right-6 w-32 h-32 text-[#F5F2EA] group-hover:text-[#C97C2F]/5 transition-colors" />
                  <div className="relative z-10">
                     <div className="flex items-center gap-6 mb-10">
                        <div className="w-14 h-14 bg-[#111827] text-white flex items-center justify-center font-black text-2xl">{rev.initial}</div>
                        <div>
                           <h4 className="text-xl font-black text-[#111827] uppercase tracking-tight">{rev.client}</h4>
                           <span className="text-[10px] font-black text-[#C97C2F] uppercase tracking-[0.3em]">{rev.car} Rental</span>
                        </div>
                     </div>
                     <p className="text-lg font-bold text-[#111827] italic leading-relaxed uppercase tracking-tight mb-0">"{rev.comment}"</p>
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
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111827] flex items-center justify-center text-white font-black uppercase tracking-[0.5em]">Preparing Service...</div>}>
      <DriverContent />
    </Suspense>
  );
}