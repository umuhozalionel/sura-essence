"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; 
import { 
  Plane, Car, MapPin, MousePointerClick, Shield, ArrowRight,
  Map, Mountain, ShieldCheck, Info, Bed, Coffee, Fuel, ShoppingCart, Utensils, Banknote, Zap, Hospital, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Manrope } from "next/font/google";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
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

  // Upgraded Database returning 8 suggestions per category
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
      
      // Map to strictly 8 dynamic results based on the current sector
      return Array.from({ length: 8 }).map((_, i) => ({
         name: list[i % list.length],
         dist: `${(1.2 + (i * 0.6)).toFixed(1)} km`,
         time: `${4 + (i * 2)} mins`
      }));
  };

  return (
    // pt-32 clears the overlapping booking dock from the hero above
    <section className={`pt-32 pb-20 bg-[#F5F2EA] text-[#111827] relative z-10 ${manrope.className}`}>
      <div className="max-w-[1450px] mx-auto px-6 md:px-10 flex flex-col lg:flex-row gap-16">
        
        {/* ==================================================== */}
        {/* LEFT COLUMN: THE ARTICLE */}
        {/* ==================================================== */}
        <div className="lg:w-7/12 flex flex-col">
          
          <div className="mb-12">
            <div className="flex items-center gap-3 py-2 px-5 bg-white text-[#111827] border border-gray-200 mb-6 self-start inline-flex shadow-sm">
               <Shield className="w-4 h-4 text-[#C97C2F]" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Protocol</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-[#111827] uppercase tracking-tighter leading-[0.9]">
              The SURA <br />
              <span className="text-[#C97C2F]">System Process.</span>
            </h2>
          </div>

          <div className="flex flex-col gap-8 border-l border-gray-200 ml-4 pl-8 md:pl-12 py-4">
            {STEPS.map((step, i) => (
              <div key={i} className="relative group">
                <div className="absolute -left-[45px] md:-left-[61px] top-0 w-6 h-6 rounded-sm bg-white border-2 border-[#111827] flex items-center justify-center group-hover:border-[#C97C2F] transition-colors">
                   <div className="w-2 h-2 bg-[#111827] group-hover:bg-[#C97C2F] transition-colors" />
                </div>
                
                <div className="bg-white border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-300 rounded-sm">
                   <div className="flex items-center gap-4 mb-4">
                     <span className="text-3xl font-black text-[#C97C2F] opacity-50 tracking-tighter">{step.id}</span>
                     <h3 className="text-xl font-black uppercase tracking-tight text-[#111827]">{step.title}</h3>
                   </div>
                   <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                     {step.desc}
                   </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
             <Link href="/book" className="group flex flex-col items-start self-start">
                <span className="text-[11px] font-black text-[#111827] uppercase tracking-[0.4em] mb-2 flex items-center gap-3">
                  Initialize System <ArrowRight className="w-4 h-4 text-[#C97C2F] group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="h-[2px] w-48 bg-[#C97C2F]" />
             </Link>
          </div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: THE SIDEBAR (Live Intelligence) */}
        {/* ==================================================== */}
        <aside className="lg:w-5/12 flex flex-col gap-6">
            
            <div className="flex items-center gap-4 mb-2">
                <div className="h-[1px] flex-1 bg-gray-300" />
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Live Intelligence</span>
                <div className="h-[1px] flex-1 bg-gray-300" />
            </div>

            {/* WIDGET 1: Sector Analysis */}
            <div className="bg-white border border-gray-200 p-6 shadow-md rounded-sm relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                    <span className="text-[#111827] text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Map className="w-4 h-4 text-[#C97C2F]" /> Sector Analysis</span>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-gray-400 text-[8px] font-black uppercase tracking-widest">Syncing</span>
                    </div>
                </div>
                <div className="relative h-20">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeSector.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }} className="grid grid-cols-2 gap-4 absolute inset-0">
                            <div className="flex flex-col gap-1 col-span-2">
                                <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Coordinates</span>
                                <span className="text-[#111827] text-xs font-bold uppercase truncate">{activeSector.district} • {activeSector.area}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-t border-gray-100 pt-2">
                                <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Atmosphere</span>
                                <span className="text-[#111827] text-xs font-bold uppercase">{activeSector.vibe}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-t border-gray-100 pt-2 border-l pl-4">
                                <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Conditions</span>
                                <span className="text-[#C97C2F] text-xs font-black uppercase">{activeSector.weather} • {activeSector.temp}°C</span>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* WIDGET 2: Geo Metrics */}
            <div className="bg-white border border-gray-200 p-6 shadow-md flex items-center justify-between rounded-sm">
                <div className="grid grid-cols-3 w-full gap-2 divide-x divide-gray-100">
                    <div className="flex flex-col items-center text-center px-1">
                        <Mountain className="w-4 h-4 text-[#C97C2F] mb-2" />
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Elevation</span>
                        <span className="text-[9px] font-black text-[#111827] uppercase tracking-wider">1,567m</span>
                    </div>
                    <div className="flex flex-col items-center text-center px-1">
                        <ShieldCheck className="w-4 h-4 text-[#C97C2F] mb-2" />
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Safety Index</span>
                        <span className="text-[9px] font-black text-[#111827] uppercase tracking-wider">Top 5 Africa</span>
                    </div>
                    <div className="flex flex-col items-center text-center px-1">
                        <Info className="w-4 h-4 text-[#C97C2F] mb-2" />
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Timezone</span>
                        <span className="text-[9px] font-black text-[#111827] uppercase tracking-wider">CAT (UTC+2)</span>
                    </div>
                </div>
            </div>

            {/* WIDGET 3: Local Amenities Scanner */}
            <div className="bg-white border border-gray-200 p-6 shadow-md rounded-sm">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                    <span className="text-[#111827] text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Check className="w-4 h-4 text-[#C97C2F]"/> Local Amenities</span>
                    {selectedPlace && <button onClick={() => setSelectedPlace(null)} className="text-[8px] font-black text-[#C97C2F] uppercase underline tracking-widest">Reset</button>}
                </div>

                {selectedPlace ? (
                    <div className="flex items-center justify-between p-5 bg-gray-50 border border-gray-200 animate-in fade-in zoom-in-95 duration-200 rounded-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center rounded-sm shadow-sm">
                                <Check className="w-4 h-4 text-[#C97C2F]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-[#111827] uppercase tracking-widest mb-1">{selectedPlace.name}</span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{selectedPlace.dist} • {selectedPlace.time}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-2">
                        {INFRA_CATEGORIES.map(cat => (
                            <button 
                                key={cat.id} 
                                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)} 
                                className={`flex flex-col gap-2 items-center justify-center py-4 px-2 border transition-all duration-200 rounded-sm shadow-sm
                                ${selectedCategory === cat.id ? 'border-[#C97C2F] bg-gray-50' : 'border-gray-100 bg-white hover:border-[#C97C2F]/50 hover:bg-gray-50'}`}
                            >
                                <cat.icon className={`w-4 h-4 ${selectedCategory === cat.id ? 'text-[#C97C2F]' : 'text-gray-400'}`} />
                                <span className="text-[7px] font-black text-[#111827] uppercase tracking-widest text-center">{cat.id}</span>
                            </button>
                        ))}
                    </div>
                )}
                
                <AnimatePresence>
                    {selectedCategory && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          className="overflow-hidden mt-4"
                        >
                            {/* Scrollable Container for the 8 results */}
                            <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {getNearby(selectedCategory, activeSector).map((place, i) => (
                                    <button key={i} onClick={() => setSelectedPlace(place)} className="flex items-center justify-between p-4 bg-white border border-gray-100 hover:border-[#C97C2F] transition-colors rounded-sm shadow-sm group">
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-[10px] font-black text-[#111827] uppercase mb-0.5">{place.name}</span>
                                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{activeSector.area} Sector</span>
                                        </div>
                                        <div className="flex flex-col items-end text-right">
                                            <span className="text-[10px] font-black text-[#C97C2F] mb-0.5">{place.dist}</span>
                                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-[#111827] transition-colors">{place.time}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </aside>

      </div>

      {/* Global CSS for the scrollbar to keep it clean */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #C97C2F; 
        }
      `}} />
    </section>
  );
}