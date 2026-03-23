"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; 
import { 
  Plane, Car, MapPin, MousePointerClick, Shield, ArrowRight,
  Map, Mountain, ShieldCheck, Info, Bed, Coffee, Fuel, ShoppingCart, Utensils, Banknote, Zap, Hospital, Check
} from "lucide-react";
import { Manrope } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope"
});

const STEPS = [
  { id: "01", icon: Plane, title: "Arrival & Reception", desc: "Your journey begins at KGL. Our team tracks your flight in real-time. Upon exit, a professional handler manages your luggage and logistics." },
  { id: "02", icon: Car, title: "Choose Your Mode", desc: "Select a pristine self-drive vehicle for freedom, or a professional chauffeur for inter-city transfers and seamless business logistics." },
  { id: "03", icon: MapPin, title: "Curated Experiences", desc: "Strategic planning for Musanze gorilla treks, Akagera expeditions, and Kigali tours. We handle permit logistics and boutique stays." },
  { id: "04", icon: MousePointerClick, title: "Instant Booking", desc: "Secure your vehicle and itinerary via our encrypted portal or direct WhatsApp link. Upfront pricing with zero hidden fees." },
];

const SECTORS = [
    { id: 'k1', district: 'Gasabo', area: 'Nyarutarama', vibe: 'Luxury Residential', weather: 'Clear', temp: 24, dist: '8 km', time: '15 min' },
    { id: 'k6', district: 'Nyarugenge', area: 'Kiyovu', vibe: 'Leafy Serene', weather: 'Clear', temp: 24, dist: '10 km', time: '20 min' },
    { id: 'n1', district: 'Musanze', area: 'Kinigi', vibe: 'Gorilla Trek Base', weather: 'Mist', temp: 16, dist: '105 km', time: '2h 15m' },
];

const INFRA_CATEGORIES = [
    { id: "Hotels", icon: Bed }, { id: "Dining", icon: Utensils }, { id: "Coffee", icon: Coffee }, { id: "Markets", icon: ShoppingCart },
    { id: "Petrol", icon: Fuel }, { id: "EV Charge", icon: Zap }, { id: "Hospitals", icon: Hospital }, { id: "ATMs", icon: Banknote },
];

export function HowItWorks() {
  const [activeSectorIndex, setActiveSectorIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);

  useEffect(() => {
    const s = setInterval(() => setActiveSectorIndex((prev) => (prev + 1) % SECTORS.length), 5500);
    return () => clearInterval(s);
  }, []);

  const activeSector = SECTORS[activeSectorIndex];

  const getNearby = (category: string, sector: typeof activeSector) => {
      const db: Record<string, string[]> = {
          "Hotels": ["Radisson Blu", "Kigali Marriott", "Serena Hotel", "The Retreat", "Mantis Kivu Marina", "Cleo Lake Kivu", "Ubumwe Grande", "Mille Collines"],
          "Dining": ["Repub Lounge", "Heaven Restaurant", "Soy Asian Table", "Pili Pili", "Khana Khazana", "Meze Fresh", "Brasserie", "Kivu Breeze"],
          "Coffee": ["Question Coffee", "Inzora Rooftop", "Kivu Noir", "Bourbon Cafe", "Neo Specialty", "Staff Cafe", "Aroma Brew", "Rubavu Roast"],
          "Markets": ["Simba Supermarket", "Sawa Citi", "Ndoli Mart", "Woodland Grocery", "Kimironko Fresh", "Frulep", "Kigali Market", "Gisenyi Market"],
          "Petrol": ["SP Station", "Engen", "Rubis Energy", "Mount Meru", "Kobil", "Hashi", "Lake Oil", "Merez"],
          "EV Charge": ["VW Station", "Arena Hub", "Ampersand Point", "City Center Plug", "Remera Hub", "Gisozi EV", "Airport Charge", "Kigali Heights"],
          "Hospitals": ["King Faisal", "CHUK", "Legacy Clinics", "RMH", "Kibagabaga Hospital", "Polyfam Clinic", "Bahia", "Ruhengeri Hospital"],
          "ATMs": ["Bank of Kigali", "Equity Bank", "I&M Bank", "Ecobank", "KCB Rwanda", "Cogebanque", "Access Bank", "GT Bank"]
      };
      
      const list = db[category] || db["Hotels"];
      
      return Array.from({ length: 8 }).map((_, i) => ({
         name: list[i % list.length],
         dist: `${(1.2 + (i * 0.6)).toFixed(1)} km`,
         time: `${4 + (i * 2)} mins`
      }));
  };

  return (
    <section className={`pt-24 pb-20 bg-[#fafbfc] text-[#111827] relative ${manrope.className}`}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col lg:flex-row gap-12 lg:gap-16">
        
        {/* ==================================================== */}
        {/* LEFT COLUMN: THE PROCESS */}
        {/* ==================================================== */}
        <div className="lg:w-[58%] flex flex-col">
          
          {/* Header */}
          <div className="mb-14">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 py-2 px-4 bg-white border border-gray-200 mb-5 rounded-full shadow-sm"
            >
               <Shield className="w-3.5 h-3.5 text-[#006cb7]" strokeWidth={2.5} />
               <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-600">Operational Protocol</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[clamp(2.5rem,5vw,4rem)] font-bold text-[#0a0e1a] leading-[1.1] tracking-tight mb-4"
            >
              The SURA System
              <span className="block text-[#006cb7]">Process</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-600 text-base font-medium max-w-xl leading-relaxed"
            >
              From airport arrival to unforgettable adventures, our streamlined process ensures every detail is handled with precision.
            </motion.p>
          </div>

          {/* Process Steps */}
          <div className="flex flex-col gap-6 relative">
            {/* Timeline connector */}
            <div className="absolute left-5 top-8 bottom-8 w-[2px] bg-gray-200" />
            
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + (i * 0.1) }}
                  className="relative group"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-[11px] top-6 w-[18px] h-[18px] rounded-full bg-white border-[3px] border-gray-300 z-10 transition-all duration-300 group-hover:border-[#006cb7] group-hover:scale-110" />
                  
                  {/* Card */}
                  <div className="ml-16 bg-white border border-gray-200 p-7 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300 group-hover:translate-x-1">
                     <div className="flex items-start gap-5 mb-4">
                       {/* Icon */}
                       <div className="flex-shrink-0 w-12 h-12 bg-[#006cb7]/5 rounded-lg flex items-center justify-center group-hover:bg-[#006cb7]/10 transition-colors">
                         <Icon className="w-6 h-6 text-[#006cb7]" strokeWidth={2} />
                       </div>
                       
                       {/* Content */}
                       <div className="flex-1">
                         <div className="flex items-baseline gap-3 mb-2">
                           <span className="text-sm font-bold text-[#84BD00] tracking-tight">{step.id}</span>
                           <h3 className="text-xl font-bold text-[#0a0e1a] tracking-tight">{step.title}</h3>
                         </div>
                         <p className="text-sm text-gray-600 leading-relaxed font-medium">
                           {step.desc}
                         </p>
                       </div>
                     </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-12 pt-10 border-t border-gray-200"
          >
             <Link 
               href="/book" 
               className="group inline-flex items-center gap-3 px-6 py-3.5 bg-[#006cb7] text-white rounded-lg font-semibold text-sm transition-all duration-300 hover:bg-[#005a9e] hover:shadow-lg hover:shadow-[#006cb7]/20 hover:translate-y-[-2px]"
             >
                <span>Initialize Booking System</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
             </Link>
          </motion.div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: LIVE INTELLIGENCE */}
        {/* ==================================================== */}
        <aside className="lg:w-[42%] flex flex-col gap-5">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-2 mb-2"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
              <div className="w-2 h-2 bg-[#84BD00] rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-600">Live Intelligence</span>
            </div>
          </motion.div>

          {/* WIDGET 1: Active Sector Monitor */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700 flex items-center gap-2">
                  <Map className="w-4 h-4 text-[#006cb7]" strokeWidth={2} />
                  Active Sector
                </h3>
                <div className="flex gap-1">
                  {SECTORS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSectorIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        idx === activeSectorIndex 
                          ? 'bg-[#006cb7] w-6' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to sector ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 relative min-h-[140px]">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeSector.id} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }} 
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Location */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Location</span>
                    <div className="text-lg font-bold text-[#0a0e1a]">
                      {activeSector.district} · <span className="text-[#006cb7]">{activeSector.area}</span>
                    </div>
                  </div>

                  {/* Grid Info */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Atmosphere</span>
                      <div className="text-sm font-semibold text-[#0a0e1a]">{activeSector.vibe}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Conditions</span>
                      <div className="text-sm font-semibold">
                        <span className="text-[#84BD00]">{activeSector.weather}</span>
                        <span className="text-gray-400 mx-1">·</span>
                        <span className="text-[#0a0e1a]">{activeSector.temp}°C</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* WIDGET 2: Geo Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-6"
          >
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-[#006cb7]/5 rounded-lg flex items-center justify-center mb-3">
                  <Mountain className="w-5 h-5 text-[#006cb7]" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Elevation</span>
                <span className="text-sm font-bold text-[#0a0e1a]">1,567m</span>
              </div>
              <div className="flex flex-col items-center text-center border-l border-r border-gray-100">
                <div className="w-10 h-10 bg-[#84BD00]/5 rounded-lg flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5 text-[#84BD00]" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Safety</span>
                <span className="text-sm font-bold text-[#0a0e1a]">Top 5 Africa</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-[#006cb7]/5 rounded-lg flex items-center justify-center mb-3">
                  <Info className="w-5 h-5 text-[#006cb7]" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Timezone</span>
                <span className="text-sm font-bold text-[#0a0e1a]">CAT +2</span>
              </div>
            </div>
          </motion.div>

          {/* WIDGET 3: Local Amenities Scanner */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700 flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#006cb7]" strokeWidth={2.5} />
                  Local Amenities
                </h3>
                {selectedPlace && (
                  <button 
                    onClick={() => setSelectedPlace(null)} 
                    className="text-[10px] font-bold text-[#006cb7] uppercase tracking-wider hover:underline transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {selectedPlace ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-4 p-5 bg-[#006cb7]/5 border border-[#006cb7]/20 rounded-lg"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                    <Check className="w-5 h-5 text-[#84BD00]" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#0a0e1a] mb-0.5 truncate">{selectedPlace.name}</div>
                    <div className="text-xs text-gray-600 font-medium">
                      {selectedPlace.dist} · {selectedPlace.time}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-4 gap-2.5">
                  {INFRA_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button 
                        key={cat.id} 
                        onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)} 
                        className={`flex flex-col gap-2 items-center justify-center py-4 px-2 rounded-lg border-2 transition-all duration-200 ${
                          selectedCategory === cat.id 
                            ? 'border-[#006cb7] bg-[#006cb7]/5 shadow-sm' 
                            : 'border-gray-200 bg-white hover:border-[#006cb7]/40 hover:bg-[#006cb7]/5'
                        }`}
                      >
                        <Icon className={`w-4 h-4 transition-colors ${
                          selectedCategory === cat.id ? 'text-[#006cb7]' : 'text-gray-400'
                        }`} strokeWidth={2} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider text-center transition-colors ${
                          selectedCategory === cat.id ? 'text-[#006cb7]' : 'text-gray-600'
                        }`}>
                          {cat.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              
              <AnimatePresence>
                {selectedCategory && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-2 mt-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                      {getNearby(selectedCategory, activeSector).map((place, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setSelectedPlace(place)} 
                          className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 hover:border-[#006cb7] hover:bg-white transition-all rounded-lg group"
                        >
                          <div className="flex flex-col items-start text-left">
                            <span className="text-xs font-bold text-[#0a0e1a] mb-0.5">{place.name}</span>
                            <span className="text-[10px] text-gray-500 font-medium">{activeSector.area}</span>
                          </div>
                          <div className="flex flex-col items-end text-right">
                            <span className="text-xs font-bold text-[#006cb7] mb-0.5">{place.dist}</span>
                            <span className="text-[10px] text-gray-500 font-medium group-hover:text-[#0a0e1a] transition-colors">{place.time}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </aside>

      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #006cb7;
        }
      `}</style>
    </section>
  );
}
