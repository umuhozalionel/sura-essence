"use client";

import Link from "next/link";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Sun, Moon, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog,
  Clock, Zap, Shield, MapPin, Plane, Building2, Map, Users, Calendar, 
  ChevronDown, Info, ShieldCheck, Mountain, Headset, Edit2, Check,
  Bed, Coffee, Fuel, ShoppingCart, Utensils, Banknote, Scissors, Car, 
  Droplets, PlusSquare, Hospital
} from "lucide-react";
import { Manrope } from "next/font/google";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

const API_KEY = "23f292fb66ec335896541f0b5e8b87bf"; 
const CITY = "Kigali";

const KIGALI_LOCATIONS = [
  "Kigali International Airport (KGL)",
  "Kigali Convention Center",
  "Kigali Marriott Hotel",
  "Radisson Blu Hotel",
  "Serena Hotel",
  "Kimironko Market",
  "Nyamirambo Women's Center",
  "Kigali Genocide Memorial"
];

const SECTORS = [
  { id: 'k1', province: 'Kigali', district: 'Gasabo', area: 'Nyarutarama', vibe: 'Luxury Residential & Golf', weather: 'Clear', temp: 24, dist: '8 km', time: '15 min' },
  { id: 'k2', province: 'Kigali', district: 'Gasabo', area: 'Kacyiru', vibe: 'Diplomatic & Administrative', weather: 'Clouds', temp: 23, dist: '6 km', time: '12 min' },
  { id: 'k3', province: 'Kigali', district: 'Gasabo', area: 'Kimironko', vibe: 'Bustling Market & Vibrant', weather: 'Clear', temp: 25, dist: '5 km', time: '10 min' },
  { id: 'k4', province: 'Kigali', district: 'Gasabo', area: 'Gaculiro', vibe: 'Modern Estates & Quiet', weather: 'Clear', temp: 24, dist: '9 km', time: '18 min' },
  { id: 'k5', province: 'Kigali', district: 'Gasabo', area: 'Kagugu', vibe: 'High-end Suburban Calm', weather: 'Partly Cloudy', temp: 23, dist: '11 km', time: '22 min' },
  { id: 'k6', province: 'Kigali', district: 'Nyarugenge', area: 'Kiyovu', vibe: 'Leafy Serene & Heritage', weather: 'Clear', temp: 24, dist: '10 km', time: '20 min' },
  { id: 'k7', province: 'Kigali', district: 'Nyarugenge', area: 'Nyamirambo', vibe: 'Cultural Heart & Nightlife', weather: 'Clouds', temp: 25, dist: '12 km', time: '25 min' },
  { id: 'k8', province: 'Kigali', district: 'Nyarugenge', area: 'Muhima', vibe: 'Commercial Transit Hub', weather: 'Clear', temp: 26, dist: '10 km', time: '20 min' },
  { id: 'k9', province: 'Kigali', district: 'Nyarugenge', area: 'Nyakabanda', vibe: 'Dense Local Community', weather: 'Clouds', temp: 24, dist: '13 km', time: '28 min' },
  { id: 'k10', province: 'Kigali', district: 'Nyarugenge', area: 'Kigali Sector', vibe: 'Mount Kigali Views', weather: 'Mist', temp: 21, dist: '15 km', time: '35 min' },
  { id: 'k11', province: 'Kigali', district: 'Kicukiro', area: 'Rebero', vibe: 'Scenic Hills & Retreats', weather: 'Clear', temp: 22, dist: '14 km', time: '30 min' },
  { id: 'k12', province: 'Kigali', district: 'Kicukiro', area: 'Niboye', vibe: 'Quiet Residential Grid', weather: 'Clear', temp: 24, dist: '7 km', time: '15 min' },
  { id: 'k13', province: 'Kigali', district: 'Kicukiro', area: 'Kanombe', vibe: 'Airport & Gateway', weather: 'Clear', temp: 25, dist: '2 km', time: '5 min' },
  { id: 'k14', province: 'Kigali', district: 'Kicukiro', area: 'Gikondo', vibe: 'Industrial & Urban Mix', weather: 'Clouds', temp: 24, dist: '8 km', time: '18 min' },
  { id: 'k15', province: 'Kigali', district: 'Kicukiro', area: 'Kagarama', vibe: 'Elevated & Breezy', weather: 'Clear', temp: 23, dist: '9 km', time: '20 min' },
  { id: 'n1', province: 'North', district: 'Musanze', area: 'Kinigi', vibe: 'Gorilla Trekking Base', weather: 'Mist', temp: 16, dist: '105 km', time: '2h 15m' },
  { id: 'n2', province: 'North', district: 'Musanze', area: 'Muhoza', vibe: 'Urban Musanze Center', weather: 'Rain', temp: 18, dist: '95 km', time: '2h 00m' },
  { id: 'n3', province: 'North', district: 'Gicumbi', area: 'Byumba', vibe: 'High Altitude Cool', weather: 'Clouds', temp: 17, dist: '60 km', time: '1h 15m' },
  { id: 's1', province: 'South', district: 'Huye', area: 'Ngoma', vibe: 'Academic & Historic', weather: 'Rain', temp: 20, dist: '130 km', time: '2h 40m' },
  { id: 's2', province: 'South', district: 'Nyanza', area: 'Busasamana', vibe: 'Royal Heritage', weather: 'Clear', temp: 22, dist: '85 km', time: '1h 50m' },
  { id: 's3', province: 'South', district: 'Muhanga', area: 'Nyamabuye', vibe: 'Central Trading Hub', weather: 'Clouds', temp: 21, dist: '50 km', time: '1h 10m' },
  { id: 'e1', province: 'East', district: 'Bugesera', area: 'Nyamata', vibe: 'Emerging Hub & Calm', weather: 'Clear', temp: 28, dist: '35 km', time: '45 min' },
  { id: 'e2', province: 'East', district: 'Rwamagana', area: 'Kigabiro', vibe: 'Agricultural Center', weather: 'Sun', temp: 27, dist: '55 km', time: '1h 10m' },
  { id: 'e3', province: 'East', district: 'Kayonza', area: 'Mukarange', vibe: 'Transit Gateway', weather: 'Sun', temp: 29, dist: '75 km', time: '1h 30m' },
  { id: 'w1', province: 'West', district: 'Rubavu', area: 'Gisenyi', vibe: 'Lakeside Resort Charm', weather: 'Sun', temp: 26, dist: '155 km', time: '3h 10m' },
  { id: 'w2', province: 'West', district: 'Karongi', area: 'Bwishyura', vibe: 'Pine & Kivu Shores', weather: 'Clouds', temp: 24, dist: '135 km', time: '3h 00m' },
  { id: 'w3', province: 'West', district: 'Rusizi', area: 'Kamembe', vibe: 'Border Trade & Views', weather: 'Rain', temp: 23, dist: '270 km', time: '5h 30m' },
];

const INFRA_CATEGORIES = [
  { id: "Hotels", icon: Bed },
  { id: "Restaurants", icon: Utensils },
  { id: "Coffee", icon: Coffee },
  { id: "Groceries", icon: ShoppingCart },
  { id: "Gas / Petrol", icon: Fuel },
  { id: "EV Stations", icon: Zap },
  { id: "Hospitals", icon: Hospital },
  { id: "ATMs", icon: Banknote },
];

export function Hero() {
  const [time, setTime] = useState<Date | null>(null);
  const [weather, setWeather] = useState<{ temp: number; condition: string; desc: string } | null>(null);
  const [rawRates, setRawRates] = useState<{ USD: number, EUR: number, GBP: number } | null>(null);
  const [amounts, setAmounts] = useState<Record<string, number>>({ USD: 1, EUR: 1, GBP: 1 });
  const [localHour, setLocalHour] = useState<number>(12);

  const [bookingStep, setBookingStep] = useState(1);
  const [form, setForm] = useState({ pickup: "", dropoff: "", date: "", time: "", passengers: "1 Adult" });
  const [showPickup, setShowPickup] = useState(false);
  const [showDropoff, setShowDropoff] = useState(false);

  const [activeSectorIndex, setActiveSectorIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateHour = () => {
      const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Kigali', hour: 'numeric', hour12: false });
      const hour = parseInt(formatter.format(new Date()));
      if (!isNaN(hour)) setLocalHour(hour);
    };
    updateHour();
    const timer = setInterval(updateHour, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const sectorTimer = setInterval(() => {
        setActiveSectorIndex((prev) => (prev + 1) % SECTORS.length);
    }, 4500);
    return () => clearInterval(sectorTimer);
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
    return { h, m };
  };

  const WeatherIcon = useMemo(() => {
    const isNight = localHour >= 18 || localHour < 6;
    const condition = weather?.condition || "Clear";

    switch (condition) {
      case "Clear": return isNight ? Moon : Sun;
      case "Clouds": return Cloud;
      case "Rain":
      case "Drizzle": return CloudRain;
      case "Thunderstorm": return CloudLightning;
      case "Snow": return CloudSnow;
      case "Mist":
      case "Fog":
      case "Haze": return CloudFog;
      default: return isNight ? Moon : Sun;
    }
  }, [weather?.condition, localHour]);

  const activeSector = SECTORS[activeSectorIndex];

  const getNearby = (category: string, sector: typeof activeSector) => {
      const db: Record<string, string[]> = {
          "Hotels": ["Radisson Blu", "Kigali Marriott", "One&Only Gorilla's Nest", "Bisate Lodge", "Mantis Kivu Marina", "Cleo Lake Kivu", "The Retreat Kigali", "Ubumwe Grande", "Serena Hotel", "Epic Hotel Nyagatare"],
          "Restaurants": ["Repub Lounge", "Heaven Restaurant", "Soy Asian Table", "Pili Pili", "Khana Khazana", "Meze Fresh", "Kivu Breeze", "Highland Dine", "Brasserie"],
          "Coffee": ["Question Coffee", "Inzora Rooftop", "Kivu Noir", "Bourbon Cafe", "Neo Specialty", "Staff Cafe", "Aroma Brew", "Rubavu Roast"],
          "Groceries": ["Simba Supermarket", "Sawa Citi", "Woodland Grocery", "Ndoli Mart", "Kimironko Fresh", "Gisenyi Market", "Huye Hub", "Frulep"],
          "Gas / Petrol": ["SP Station", "Mount Meru", "Engen", "Rubis Energy", "Lake Oil", "Merez", "Hashi"],
          "EV Stations": ["VW Station", "Kigali Arena Hub", "Ampersand Point", "City Center Plug", "Airport Charge", "Remera Hub", "Gisozi EV"],
          "Hospitals": ["King Faisal Hospital", "CHUK", "Rwanda Military Hospital", "Legacy Clinics", "Bahia", "Kibagabaga Hospital", "Ruhengeri Hospital"],
          "ATMs": ["Bank of Kigali", "Equity Bank", "I&M Bank", "Ecobank", "KCB Rwanda", "Cogebanque", "Access Bank"]
      };
      
      const seed = sector.id.charCodeAt(0) + sector.id.charCodeAt(1);
      const list = db[category] || db["Hotels"];
      const isKigali = sector.province === 'Kigali';
      
      return [
         { name: list[seed % list.length], dist: isKigali ? `${((seed % 5) + 0.8).toFixed(1)} km` : sector.dist, time: isKigali ? `${(seed % 8) + 2} mins` : sector.time },
         { name: list[(seed + 1) % list.length], dist: isKigali ? `${((seed % 4) + 2.1).toFixed(1)} km` : sector.dist, time: isKigali ? `${(seed % 6) + 6} mins` : sector.time },
         { name: list[(seed + 2) % list.length], dist: isKigali ? `${((seed % 6) + 3.5).toFixed(1)} km` : sector.dist, time: isKigali ? `${(seed % 10) + 11} mins` : sector.time },
      ];
  };

  return (
    <section className={`relative w-full min-h-screen flex items-center bg-[#F5F2EA] overflow-hidden ${manrope.className} z-10 pt-24 pb-12`}>
      
      <div className="absolute left-0 top-0 bottom-0 w-full z-0 pointer-events-none opacity-[0.05]"
           style={{ backgroundImage: 'radial-gradient(#111827 2px, transparent 2px)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10 w-full max-w-[1800px] mx-auto grid lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 xl:gap-16 items-stretch h-full px-4 sm:px-6 md:px-12">
        
        <div className="flex flex-col py-6 h-full">
          
          <div className="flex flex-col mb-auto">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="inline-flex items-center gap-3 py-2 px-4 sm:px-5 bg-white border border-gray-200 text-[#111827] mb-6 self-start shadow-sm rounded-none"
            >
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-[#C97C2F]" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Premium Mobility & Hospitality</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black text-[#111827] mb-4 uppercase tracking-tighter leading-[0.9]">
              YOUR TRUSTED <br />
              <span className="text-[#C97C2F]">GATEWAY.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xs sm:text-sm text-gray-700 mb-8 max-w-lg leading-relaxed font-bold uppercase tracking-widest">
              A meticulously curated fleet. Zero hidden costs. The definitive standard for local circulation and transport in Rwanda.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 sm:p-8 border border-gray-200 shadow-xl rounded-none relative mb-8 min-h-[300px] flex flex-col">
               <div className="absolute top-0 left-0 w-full h-1 bg-[#C97C2F]" />
               
               <AnimatePresence mode="wait">
                   {bookingStep === 1 ? (
                       <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex-1 flex flex-col">
                           <div className="flex items-center gap-3 mb-6">
                              <MapPin className="w-5 h-5 text-[#C97C2F]" />
                              <h3 className="text-sm font-black text-[#111827] uppercase tracking-widest">Initiate Local Booking</h3>
                           </div>
                           
                           <form className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                              <div className="flex flex-col gap-1 relative z-30">
                                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Pickup Location</label>
                                 <input 
                                   type="text" 
                                   value={form.pickup}
                                   onChange={(e) => setForm({...form, pickup: e.target.value})}
                                   onFocus={() => setShowPickup(true)}
                                   onBlur={() => setTimeout(() => setShowPickup(false), 200)}
                                   placeholder="e.g., Kigali Airport" 
                                   className="bg-[#F5F2EA] p-3 text-xs font-bold text-[#111827] outline-none border border-transparent focus:border-[#C97C2F] transition-colors rounded-none placeholder:text-gray-400" 
                                 />
                                 {showPickup && (
                                     <ul className="absolute top-[100%] left-0 w-full bg-white border border-gray-200 shadow-xl rounded-none max-h-40 overflow-y-auto">
                                         {KIGALI_LOCATIONS.filter(l => l.toLowerCase().includes(form.pickup.toLowerCase())).map((loc, idx) => (
                                             <li key={idx} onClick={() => setForm({...form, pickup: loc})} className="p-3 text-[10px] font-bold text-[#111827] uppercase tracking-widest hover:bg-[#C97C2F]/10 hover:text-[#C97C2F] cursor-pointer border-b border-gray-50 last:border-0">{loc}</li>
                                         ))}
                                     </ul>
                                 )}
                              </div>

                              <div className="flex flex-col gap-1 relative z-20">
                                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Destination</label>
                                 <input 
                                   type="text" 
                                   value={form.dropoff}
                                   onChange={(e) => setForm({...form, dropoff: e.target.value})}
                                   onFocus={() => setShowDropoff(true)}
                                   onBlur={() => setTimeout(() => setShowDropoff(false), 200)}
                                   placeholder="e.g., Convention Center" 
                                   className="bg-[#F5F2EA] p-3 text-xs font-bold text-[#111827] outline-none border border-transparent focus:border-[#C97C2F] transition-colors rounded-none placeholder:text-gray-400" 
                                 />
                                 {showDropoff && (
                                     <ul className="absolute top-[100%] left-0 w-full bg-white border border-gray-200 shadow-xl rounded-none max-h-40 overflow-y-auto">
                                         {KIGALI_LOCATIONS.filter(l => l.toLowerCase().includes(form.dropoff.toLowerCase())).map((loc, idx) => (
                                             <li key={idx} onClick={() => setForm({...form, dropoff: loc})} className="p-3 text-[10px] font-bold text-[#111827] uppercase tracking-widest hover:bg-[#C97C2F]/10 hover:text-[#C97C2F] cursor-pointer border-b border-gray-50 last:border-0">{loc}</li>
                                         ))}
                                     </ul>
                                 )}
                              </div>

                              <div className="flex flex-col gap-1">
                                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Date & Time</label>
                                 <div className="grid grid-cols-2 gap-2">
                                    <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="w-full bg-[#F5F2EA] p-3 text-xs font-bold text-[#111827] outline-none border border-transparent focus:border-[#C97C2F] transition-colors rounded-none" />
                                    <input type="time" value={form.time} onChange={(e) => setForm({...form, time: e.target.value})} className="w-full bg-[#F5F2EA] p-3 text-xs font-bold text-[#111827] outline-none border border-transparent focus:border-[#C97C2F] transition-colors rounded-none" />
                                 </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Passengers</label>
                                 <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C97C2F]" />
                                    <select value={form.passengers} onChange={(e) => setForm({...form, passengers: e.target.value})} className="w-full bg-[#F5F2EA] p-3 pl-10 text-xs font-bold text-[#111827] outline-none border border-transparent focus:border-[#C97C2F] transition-colors rounded-none appearance-none">
                                       <option>1 Adult</option>
                                       <option>2 Adults</option>
                                       <option>3-4 Adults</option>
                                       <option>Group (5+)</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                 </div>
                              </div>

                              <button type="button" onClick={() => setBookingStep(2)} className="md:col-span-2 mt-2 h-14 bg-[#111827] hover:bg-[#C97C2F] text-white flex items-center justify-center gap-3 transition-colors shadow-lg rounded-none">
                                 <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em]">Review & Proceed</span>
                                 <ArrowRight size={16} />
                              </button>
                           </form>
                       </motion.div>
                   ) : (
                       <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex-1 flex flex-col justify-between">
                           <div>
                               <div className="flex items-center justify-between mb-6">
                                  <h3 className="text-sm font-black text-[#111827] uppercase tracking-widest flex items-center gap-3"><Check className="text-green-600 w-5 h-5" /> Mission Overview</h3>
                                  <button onClick={() => setBookingStep(1)} className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 hover:text-[#C97C2F] transition-colors"><Edit2 size={10} /> Edit</button>
                               </div>
                               
                               <div className="bg-[#F5F2EA] p-6 border-l-4 border-[#111827] rounded-none grid grid-cols-1 gap-4 mb-6">
                                  <div className="flex items-center gap-4">
                                      <div className="flex flex-col items-center">
                                          <div className="w-2 h-2 rounded-full bg-[#111827]" />
                                          <div className="w-0.5 h-6 bg-gray-300" />
                                          <div className="w-2 h-2 rounded-full bg-[#C97C2F]" />
                                      </div>
                                      <div className="flex flex-col gap-3">
                                          <span className="text-[11px] font-black text-[#111827] uppercase tracking-wider">{form.pickup || "Not Specified"}</span>
                                          <span className="text-[11px] font-black text-[#111827] uppercase tracking-wider">{form.dropoff || "Not Specified"}</span>
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200 mt-2">
                                      <div>
                                          <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</span>
                                          <span className="text-[10px] font-black text-[#111827] uppercase">{form.date || "Any"}</span>
                                      </div>
                                      <div>
                                          <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Time</span>
                                          <span className="text-[10px] font-black text-[#111827] uppercase">{form.time || "Any"}</span>
                                      </div>
                                      <div>
                                          <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Pax</span>
                                          <span className="text-[10px] font-black text-[#111827] uppercase">{form.passengers}</span>
                                      </div>
                                  </div>
                               </div>
                           </div>
                           
                           <div className="flex flex-col gap-3">
                              <Link href="/book" className="h-14 bg-[#C97C2F] hover:bg-[#111827] text-white flex items-center justify-center gap-3 transition-colors shadow-lg rounded-none">
                                 <span className="text-[11px] font-black uppercase tracking-[0.3em]">Confirm Deployment</span>
                                 <ArrowRight size={16} />
                              </Link>
                           </div>
                       </motion.div>
                   )}
               </AnimatePresence>
            </motion.div>
          </div>

          <div className="flex items-stretch gap-0 bg-white border border-gray-200 shadow-sm w-full overflow-hidden rounded-none mt-auto min-h-[72px]">
            <div className="bg-[#111827] text-white px-4 sm:px-6 py-0 flex flex-col justify-center h-full">
               <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap"><Zap size={10} className="text-[#C97C2F]" /> Live RWF</span>
            </div>
            <div className="flex-1 grid grid-cols-3 divide-x divide-gray-100 py-2">
                {[
                    { label: "USD", symbol: "$", key: "USD" },
                    { label: "EUR", symbol: "€", key: "EUR" },
                    { label: "GBP", symbol: "£", key: "GBP" }
                ].map((cur) => (
                    <div key={cur.key} className="flex flex-col items-center justify-center py-1 px-1 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-1 justify-center">
                            <span className="text-[#111827] text-[10px] sm:text-xs font-black">{cur.symbol}</span>
                            <input 
                                type="number" 
                                value={amounts[cur.key as keyof typeof amounts] === 0 ? "" : amounts[cur.key as keyof typeof amounts]}
                                onChange={(e) => handleAmountChange(cur.key, e.target.value)}
                                className="bg-transparent border-none focus:ring-0 p-0 text-[#111827] font-black text-xs sm:text-sm w-8 sm:w-12 text-center outline-none"
                                placeholder="1"
                            />
                        </div>
                        <div className="text-[8px] sm:text-[9px] font-black text-[#C97C2F] tabular-nums tracking-widest mt-0.5 uppercase text-center">
                            {rawRates ? convertToRWF(rawRates[cur.key as keyof typeof rawRates], amounts[cur.key]) : "---"}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>

        <div className="relative w-full flex flex-col h-full py-6">
            
            <div className="relative w-full flex-1 flex flex-col mb-6 overflow-hidden shadow-2xl rounded-none">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105" style={{ backgroundImage: "url('/backrounds/pexels-faustin-nkurunziza.jpg')" }} />

                <div className="relative z-10 flex flex-col h-full p-4 sm:p-6 md:p-8 gap-3">
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/95 backdrop-blur-md p-4 sm:p-6 shadow-xl flex flex-col justify-center rounded-none border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[#111827] text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Env.Status</span>
                                {weather && <WeatherIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#C97C2F]" />}
                            </div>
                            <div className="flex items-end gap-2 sm:gap-3">
                                <span className="text-3xl sm:text-4xl xl:text-5xl font-black text-[#111827] leading-none tracking-tighter">
                                  {weather ? `${weather.temp}°` : "--"}
                                </span>
                                <div className="flex flex-col pb-0.5 sm:pb-1">
                                    <span className="text-[#C97C2F] text-[8px] sm:text-[10px] font-black tracking-[0.2em] uppercase leading-none mb-1">{CITY}</span>
                                    <span className="text-gray-500 text-[7px] sm:text-[9px] font-bold uppercase tracking-widest leading-none">{weather?.condition || "Loading"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#C97C2F]/95 backdrop-blur-md p-4 sm:p-6 shadow-xl flex flex-col justify-center rounded-none border border-[#C97C2F]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Local Time</span>
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                            </div>
                            <div className="flex items-baseline text-white">
                                {time ? (
                                    <span className="text-3xl sm:text-4xl xl:text-5xl font-black tabular-nums tracking-tighter leading-none">
                                        {formatHMS(time).h}:{formatHMS(time).m}
                                    </span>
                                ) : (
                                    <span className="text-3xl sm:text-4xl xl:text-5xl font-black text-white/50">--:--</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#111827]/80 backdrop-blur-xl border border-white/10 p-5 sm:p-6 shadow-xl rounded-none">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                            <span className="text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                               <Map className="w-4 h-4 text-[#C97C2F]" />
                               Live Sector Intelligence
                            </span>
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                               <span className="text-white/70 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Tracking</span>
                            </div>
                        </div>
                        
                        <div className="relative h-16 overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeSector.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 absolute inset-0"
                                >
                                   <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2 text-white/50 mb-1">
                                         <MapPin className="w-3 h-3" />
                                         <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Location</span>
                                      </div>
                                      <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">{activeSector.province} • {activeSector.district}</span>
                                      <span className="text-[#C97C2F] text-[9px] font-black uppercase tracking-widest">{activeSector.area}</span>
                                   </div>
                                   
                                   <div className="flex flex-col gap-1 md:border-l border-white/10 md:pl-4">
                                      <div className="flex items-center gap-2 text-white/50 mb-1">
                                         <Building2 className="w-3 h-3" />
                                         <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Sector Vibe</span>
                                      </div>
                                      <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider line-clamp-2">{activeSector.vibe}</span>
                                   </div>

                                   <div className="flex flex-col gap-1 md:border-l border-white/10 md:pl-4">
                                      <div className="flex items-center gap-2 text-white/50 mb-1">
                                         <Sun className="w-3 h-3" />
                                         <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Atmosphere</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider">{activeSector.weather}</span>
                                          <span className="text-white/50 text-[10px] font-black">{activeSector.temp}°C</span>
                                      </div>
                                   </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 shadow-xl flex items-center justify-between gap-6 rounded-none border border-gray-100">
                        <div className="grid grid-cols-2 md:flex md:items-center gap-4 sm:gap-6 lg:gap-8 w-full">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                    <Mountain className="w-3 h-3 text-[#C97C2F]" />
                                    <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">Elevation</span>
                                </div>
                                <span className="text-xs sm:text-sm font-black text-[#111827] uppercase tracking-widest">1,567m AMSL</span>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                    <ShieldCheck className="w-3 h-3 text-[#C97C2F]" />
                                    <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">Safety Index</span>
                                </div>
                                <span className="text-xs sm:text-sm font-black text-[#111827] uppercase tracking-widest">Top 5 Africa</span>
                            </div>
                            <div className="flex flex-col col-span-2 md:col-span-1">
                                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                    <Info className="w-3 h-3 text-[#C97C2F]" />
                                    <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">Timezone</span>
                                </div>
                                <span className="text-xs sm:text-sm font-black text-[#111827] uppercase tracking-widest">CAT (UTC+2)</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 shadow-xl border border-gray-100 rounded-none mb-auto">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">Nearby Infrastructure</span>
                           {selectedPlace && (
                               <button onClick={() => setSelectedPlace(null)} className="text-[8px] font-black text-[#C97C2F] uppercase tracking-widest hover:text-[#111827] transition-colors underline">Reset Scanner</button>
                           )}
                        </div>

                        {selectedPlace ? (
                            <div className="flex items-center justify-between p-4 bg-[#111827] text-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-none bg-white/10 flex items-center justify-center border border-white/10">
                                        {React.createElement(INFRA_CATEGORIES.find(c => c.id === selectedPlace.category)?.icon || MapPin, { className: "w-4 h-4 text-[#C97C2F]" })}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest">{selectedPlace.name}</span>
                                        <span className="text-[8px] text-white/50 font-bold uppercase tracking-widest">{selectedPlace.dist} • {selectedPlace.time} from {activeSector.area}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-4 lg:grid-cols-4 gap-2">
                                    {INFRA_CATEGORIES.map(cat => (
                                        <button 
                                           key={cat.id}
                                           onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                           className={`flex flex-col gap-1.5 items-center justify-center p-3 border transition-colors ${selectedCategory === cat.id ? 'border-[#C97C2F] bg-[#C97C2F]/5' : 'border-gray-100 hover:border-gray-300 bg-white'}`}
                                        >
                                            <cat.icon className={`w-4 h-4 ${selectedCategory === cat.id ? 'text-[#C97C2F]' : 'text-gray-400'}`} />
                                            <span className="text-[7px] sm:text-[8px] font-bold text-[#111827] uppercase tracking-wider text-center">{cat.id}</span>
                                        </button>
                                    ))}
                                </div>
                                
                                <AnimatePresence>
                                    {selectedCategory && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                            <div className="border-t border-gray-100 mt-3 pt-3 flex flex-col gap-1.5">
                                                {getNearby(selectedCategory, activeSector).map((place: any, i: number) => (
                                                    <button 
                                                        key={i} 
                                                        onClick={() => { setSelectedPlace({...place, category: selectedCategory}); setSelectedCategory(null); }}
                                                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-[#F5F2EA] transition-colors border border-transparent hover:border-[#C97C2F]/30 text-left"
                                                    >
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-[10px] font-black text-[#111827] uppercase">{place.name}</span>
                                                            <span className="text-[8px] text-gray-500 font-bold uppercase">{activeSector.area} Sector</span>
                                                        </div>
                                                        <div className="flex flex-col items-end text-right">
                                                            <span className="text-[10px] font-black text-[#C97C2F]">{place.dist}</span>
                                                            <span className="text-[8px] text-gray-400 font-bold uppercase">{place.time} route</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </div>

                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto min-h-[72px]">
                <Link href="#support" className="bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] flex items-center justify-center gap-2 transition-colors shadow-sm rounded-none h-full py-4">
                    <Headset className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C97C2F]"/>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Live Desk</span>
                </Link>
                <Link href="#pricing" className="bg-[#111827] hover:bg-[#C97C2F] text-white flex items-center justify-center gap-2 sm:gap-3 transition-colors shadow-md rounded-none h-full py-4">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">View Fleet</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
            </div>
        </div>

      </div>
    </section>
  );
}