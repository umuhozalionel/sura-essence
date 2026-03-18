"use client";

import Link from "next/link";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MapPin, Car, Map as MapIcon, Users, ChevronDown, Sun, Moon, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, Clock, Loader2, Search, X, Tag, Star, Calendar } from "lucide-react";
import { Manrope } from "next/font/google";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || "23f292fb66ec335896541f0b5e8b87bf"; 
const CITY = "Kigali";
const TABS = ["CITY RIDE", "INTER-CITY", "CHAUFFEUR"];

const SLIDES = [
  { id: 1, title: "EXECUTIVE TRANSFERS", subtitle: "Seamless premium mobility across the land of a thousand hills.", image: "/fleet/sedan.webp", link: "/fleet" },
  { id: 2, title: "EXPLORE THE HILLS OF BIGOGWE", subtitle: "Explore the aesthetic look with us.", image: "/locations/bigogwe-hills.jpg", link: "/experiences" },
  { id: 3, title: "THE SURA STANDARD", subtitle: "Zero hidden costs. The definitive standard for safe, luxury travel.", image: "/backrounds/sura-experience.jpg", link: "/about" },
  { id: 4, title: "KIGALI CAR FREE DAY", subtitle: "Experience the city's famous wellness and green transport initiative.", image: "/backrounds/car-free-day.jpg", link: "/experiences" }
];

const RWANDA_SITES = [
  { id: "volcanoes", title: "Volcanoes National Park", region: "Musanze", price: 90000, coords: [-1.4748, 29.4831] },
  { id: "akagera", title: "Akagera National Park", region: "Eastern", price: 120000, coords: [-1.8833, 30.7167] },
  { id: "nyungwe", title: "Nyungwe Forest", region: "Southern", price: 150000, coords: [-2.4639, 29.2031] },
  { id: "rubavu", title: "Lake Kivu (Rubavu)", region: "Western", price: 110000, coords: [-1.6853, 29.4101] },
  { id: "huye", title: "Ethnographic Museum", region: "Huye", price: 80000, coords: [-2.6000, 29.7333] },
];

const VEHICLES = [
  { id: "sedan", name: "Standard (Sedan)", capacity: "4 Seats", comfort: "Essential", multiplier: 1 },
  { id: "suv", name: "Executive (SUV)", capacity: "7 Seats", comfort: "Premium", multiplier: 2 },
  { id: "van", name: "Group (Van)", capacity: "10 Seats", comfort: "Standard", multiplier: 2.5 },
  { id: "bus", name: "Coach (Bus)", capacity: "20+ Seats", comfort: "Group", multiplier: 5 },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1.4; 
}

function LocationInput({ label, placeholder, zIndex, onSelect }: { label: string, placeholder: string, zIndex: string, onSelect: (coords: [number, number] | null) => void }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.length < 3) return;
      setLoading(true);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${query}&lat=-1.9441&lon=30.0619&limit=5`);
        const data = await res.json();
        setSuggestions(data.features.map((f: any) => ({
            name: `${f.properties.name}${f.properties.city ? `, ${f.properties.city}` : ''}`,
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0]
        })));
        setShowDropdown(true);
      } catch (e) { console.error(e); }
      setLoading(false);
    }, 500);
    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className={`flex flex-col relative ${zIndex} group`}>
        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#006cb7] transition-colors">{label}</label>
        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#006cb7] focus-within:ring-1 focus-within:ring-[#006cb7] transition-all bg-white h-10">
            <input 
                type="text" value={query} onChange={(e) => { setQuery(e.target.value); onSelect(null); }}
                onFocus={() => query.length > 2 && setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder={placeholder} 
                className="w-full h-full px-3 py-2 text-xs text-[#111827] font-bold outline-none placeholder:text-gray-400 placeholder:font-medium" 
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-[#006cb7]" />}
        </div>
        <AnimatePresence>
            {showDropdown && suggestions.length > 0 && (
                <motion.ul initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-[100%] left-0 w-full bg-white border border-gray-200 shadow-2xl rounded-sm max-h-48 overflow-y-auto mt-1 z-50">
                    {suggestions.map((s, idx) => (
                        <li key={idx} onClick={() => { setQuery(s.name); onSelect([s.lat, s.lon]); setShowDropdown(false); }} className="px-3 py-2.5 text-[10px] font-bold text-[#111827] hover:bg-gray-50 hover:text-[#006cb7] cursor-pointer border-b border-gray-100 last:border-0 transition-colors">
                            {s.name}
                        </li>
                    ))}
                </motion.ul>
            )}
        </AnimatePresence>
    </div>
  );
}

export function Hero() {
  const [bgIndex, setBgIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("CITY RIDE");
  const [time, setTime] = useState<Date | null>(null);
  
  const [weather, setWeather] = useState<{ temp: number; condition: string; humidity: number; wind: number; precip: number } | null>(null);
  const [weatherStatIndex, setWeatherStatIndex] = useState(0);

  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [duration, setDuration] = useState("3");
  const [passengers, setPassengers] = useState("1 Adult");
  const [vehicleId, setVehicleId] = useState("sedan");
  const [promoCode, setPromoCode] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [estimate, setEstimate] = useState<{ dist: string; time: string; price: string; title: string; appliedClass: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setBgIndex((prev) => (prev + 1) % SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 1000);
    
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`)
      .then(res => res.json())
      .then(data => setWeather({ 
          temp: Math.round(data.main.temp), 
          condition: data.weather[0].main,
          humidity: data.main.humidity,
          wind: Math.round(data.wind.speed * 3.6), 
          precip: data.clouds ? data.clouds.all : 0 
      }))
      .catch(() => setWeather({ temp: 24, condition: "Clear", humidity: 71, wind: 3, precip: 10 }));
      
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const statTimer = setInterval(() => {
      setWeatherStatIndex(prev => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(statTimer);
  }, []);

  const CurrentWeatherIcon = useMemo(() => {
    const condition = weather?.condition || "Clear";
    const currentHour = time ? time.getHours() : 12;
    const isNight = currentHour >= 18 || currentHour < 6;

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
  }, [weather?.condition, time]);

  const weatherStats = [
    `${weather?.temp || 24}° KIGALI`,
    `Precipitation: ${weather?.precip || 10}%`,
    `Humidity: ${weather?.humidity || 71}%`,
    `Wind: ${weather?.wind || 3} km/h`
  ];

  const handleShowFleet = () => {
    let distVal = 0; let timeVal = 0; let priceVal = 0; let title = activeTab;

    if (activeTab === "CITY RIDE") {
      if (!pickupCoords || !dropoffCoords) return alert("Please select both Pickup and Destination.");
      distVal = calculateDistance(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]);
      timeVal = Math.round(distVal * 3.5); 
      priceVal = Math.round(10000 + (distVal * 1500)); 
      title = "City Transfer Estimate";
    } 
    else if (activeTab === "INTER-CITY") {
      if (!pickupCoords || !selectedSite) return alert("Please select Pickup and a Destination Site.");
      const site = RWANDA_SITES.find(s => s.id === selectedSite);
      if (!site) return;
      distVal = calculateDistance(pickupCoords[0], pickupCoords[1], site.coords[0], site.coords[1]);
      timeVal = Math.round(distVal * 1.5); 
      priceVal = site.price;
      title = `${site.title} Expedition`;
    }
    else if (activeTab === "CHAUFFEUR") {
      if (!pickupCoords) return alert("Please select a Pickup location.");
      timeVal = parseInt(duration) * 60;
      priceVal = 25000 + ((parseInt(duration) - 3) * 7000);
      title = `Hourly Chauffeur (${duration} Hours)`;
      distVal = 0; 
    }

    const vehicle = VEHICLES.find(v => v.id === vehicleId) || VEHICLES[0];
    priceVal = Math.round(priceVal * vehicle.multiplier);

    setEstimate({
      dist: distVal > 0 ? `${distVal.toFixed(1)} km` : "N/A",
      time: timeVal > 60 ? `${Math.floor(timeVal/60)}h ${timeVal%60}m` : `${timeVal} mins`,
      price: `${priceVal.toLocaleString()} RWF`,
      title,
      appliedClass: vehicle.name
    });
    setShowModal(true);
  };

  return (
    <section className={`relative w-full h-[75vh] min-h-[650px] max-h-[900px] bg-[#F5F2EA] z-20 ${manrope.className}`}>
      
      {/* Background container with overflow-hidden to prevent animation scroll issues, leaving main section un-clipped for the booking dock */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <AnimatePresence initial={false}>
          <motion.div 
             key={bgIndex} 
             initial={{ x: "100%" }} 
             animate={{ x: 0 }} 
             exit={{ x: "-100%" }} 
             transition={{ duration: 1, ease: "easeInOut" }} 
             className="absolute inset-0 bg-cover bg-center" 
             style={{ backgroundImage: `url(${SLIDES[bgIndex].image})` }} 
          />
        </AnimatePresence>
      </div>

      {/* TOP RIGHT: WEATHER WIDGET */}
      <div className="absolute right-0 top-32 md:top-40 z-40 bg-[#006cb7]/95 hover:bg-[#006cb7] transition-colors backdrop-blur-md border-l-[3px] border-[#84BD00] shadow-lg rounded-l-sm pr-4 pl-6 py-2.5 flex items-center gap-3 cursor-default">
          <CurrentWeatherIcon className="w-4 h-4 text-white shrink-0" />
          <div className="relative h-4 w-32 overflow-hidden flex items-center">
              <AnimatePresence mode="wait">
                  <motion.span
                      key={weatherStatIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-[10px] font-bold text-white uppercase tracking-widest absolute whitespace-nowrap"
                  >
                      {weatherStats[weatherStatIndex]}
                  </motion.span>
              </AnimatePresence>
          </div>
      </div>

      {/* BOTTOM RIGHT: CLOCK WIDGET */}
      <div className="absolute right-0 bottom-40 md:bottom-48 z-40 bg-[#006cb7]/95 hover:bg-[#006cb7] transition-colors backdrop-blur-md border-l-[3px] border-[#84BD00] shadow-lg rounded-l-sm pr-4 pl-6 py-2.5 flex items-center gap-3 cursor-default">
          <Clock className="w-4 h-4 text-white" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest tabular-nums">
              {time ? `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}` : "00:00"} CAT
          </span>
      </div>

      {/* LEFT EDGE: FEEDBACK BUTTON (Parallel to the center of the booking dock) */}
      <div className="absolute left-0 bottom-0 translate-y-1/2 z-50">
        <button className="bg-[#84BD00] hover:bg-[#70a100] text-white py-5 px-2 text-[11px] font-bold tracking-widest uppercase transition-colors shadow-lg rounded-r-sm" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
          Send Feedback
        </button>
      </div>

      <div className="absolute bottom-48 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        {SLIDES.map((_, i) => (
          <div key={i} className="w-16 h-1.5 bg-white/30 backdrop-blur-sm overflow-hidden cursor-pointer shadow-sm" onClick={() => setBgIndex(i)}>
            {i === bgIndex && <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 6, ease: "linear" }} className="h-full bg-[#84BD00]" />}
            {i < bgIndex && <div className="h-full bg-[#84BD00] w-full" />}
          </div>
        ))}
      </div>

      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 max-w-4xl z-20 pointer-events-none mt-[-100px]">
          <AnimatePresence mode="wait">
            <motion.h2 
              key={`h2-${bgIndex}`} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.6 }} 
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-[1] mb-4 drop-shadow-[0_4px_20px_#006cb7]"
            >
              {SLIDES[bgIndex].title}
            </motion.h2>
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            <motion.p
              key={`p-${bgIndex}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-white text-sm md:text-base font-bold uppercase tracking-widest mb-8 max-w-2xl leading-relaxed drop-shadow-[0_2px_15px_#84BD00]"
            >
              {SLIDES[bgIndex].subtitle}
            </motion.p>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div 
              key={`btn-${bgIndex}`} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }} 
              className="pointer-events-auto self-start"
            >
              <Link href={SLIDES[bgIndex].link} className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-[#006cb7] hover:text-white text-white py-3.5 px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-colors rounded-sm shadow-xl">
                Read More <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </AnimatePresence>
      </div>

      {/* BOOKING DOCK */}
      <motion.div 
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-6xl z-40 px-4"
      >
        <div className="w-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm overflow-hidden border border-gray-200">
            
            <div className="flex w-full bg-[#f3f5f7] border-b border-gray-200">
                {TABS.map((tab) => (
                    <button 
                        key={tab} onClick={() => { setActiveTab(tab); setPickupCoords(null); setDropoffCoords(null); }} 
                        className={`flex-1 py-3 md:py-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative
                        ${activeTab === tab ? "bg-white text-[#006cb7]" : "text-gray-500 hover:text-[#111827]"}`}
                    >
                        {tab === "CITY RIDE" && <MapPin className="w-3.5 h-3.5" />}
                        {tab === "INTER-CITY" && <MapIcon className="w-3.5 h-3.5" />}
                        {tab === "CHAUFFEUR" && <Car className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{tab}</span>
                        {activeTab === tab && <motion.div layoutId="activeTab" className="absolute top-0 left-0 w-full h-[3px] bg-[#006cb7]" />}
                    </button>
                ))}
            </div>

            <div className="p-4 md:p-5 flex flex-col gap-3 bg-white">
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-3">
                        <LocationInput label="From" placeholder="Departure location" zIndex="z-50" onSelect={setPickupCoords} />
                    </div>

                    <div className="md:col-span-3 relative z-40 group">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeTab} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                                {activeTab === "CITY RIDE" && (
                                    <LocationInput label="To" placeholder="Destination" zIndex="z-40" onSelect={setDropoffCoords} />
                                )}
                                {activeTab === "INTER-CITY" && (
                                    <div className="flex flex-col">
                                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#006cb7] transition-colors">Destination Site</label>
                                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#006cb7] focus-within:ring-1 focus-within:ring-[#006cb7] bg-white h-10 transition-all">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                            <select onChange={(e) => setSelectedSite(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-[#111827] font-bold outline-none appearance-none bg-transparent">
                                                <option value="" className="font-medium text-gray-400">Select Site...</option>
                                                {RWANDA_SITES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                                {activeTab === "CHAUFFEUR" && (
                                    <div className="flex flex-col">
                                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#006cb7] transition-colors">Duration</label>
                                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#006cb7] focus-within:ring-1 focus-within:ring-[#006cb7] bg-white h-10 transition-all">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-[#111827] font-bold outline-none appearance-none bg-transparent">
                                                {[3,4,5,6,8,10,12].map(h => <option key={h} value={h}>{h} Hours</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="md:col-span-3 flex flex-col group z-30">
                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#006cb7] transition-colors">Departure Date</label>
                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#006cb7] focus-within:ring-1 focus-within:ring-[#006cb7] bg-white h-10 transition-all">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input type="date" className="w-full h-full px-3 pl-9 py-2 text-xs text-[#111827] font-bold outline-none bg-transparent" />
                        </div>
                    </div>

                    <div className="md:col-span-3 flex flex-col group z-20">
                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#006cb7] transition-colors">Class</label>
                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#006cb7] focus-within:ring-1 focus-within:ring-[#006cb7] bg-white h-10 transition-all">
                            <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-[#111827] font-bold outline-none appearance-none bg-transparent">
                                {VEHICLES.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-3 flex flex-col group z-10">
                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#006cb7] transition-colors">Passenger(s)</label>
                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#006cb7] focus-within:ring-1 focus-within:ring-[#006cb7] bg-white h-10 transition-all">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <select value={passengers} onChange={(e) => setPassengers(e.target.value)} className="w-full h-full px-3 pl-9 py-2 text-xs text-[#111827] font-bold outline-none appearance-none bg-transparent">
                                <option>1 Adult, 0 Children</option>
                                <option>2 Adults, 0 Children</option>
                                <option>Group (3+)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="md:col-span-3 flex flex-col group z-10">
                        <label className="text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider group-focus-within:text-[#006cb7] transition-colors">Promo Code</label>
                        <div className="relative border border-gray-300 rounded-sm overflow-hidden focus-within:border-[#006cb7] focus-within:ring-1 focus-within:ring-[#006cb7] bg-white h-10 transition-all">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input 
                                type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                placeholder="ENTER CODE" 
                                className="w-full h-full px-3 pl-9 py-2 text-xs text-[#111827] font-bold uppercase outline-none placeholder:text-gray-400 placeholder:font-medium" 
                            />
                        </div>
                    </div>

                    <div className="md:col-span-6 flex gap-3 h-10 z-10">
                        <motion.button 
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                            onClick={handleShowFleet} 
                            className="flex-1 bg-[#006cb7] hover:bg-[#005b9f] text-white flex items-center justify-center text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm shadow-sm"
                        >
                            Show Fleet
                        </motion.button>
                        <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                            <Link href="/book" className="w-full h-full bg-white border border-gray-300 hover:border-[#006cb7] hover:text-[#006cb7] text-[#111827] flex items-center justify-center text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm">
                                Learn More
                            </Link>
                        </motion.div>
                    </div>
                </div>

            </div>
        </div>
      </motion.div>

      {/* ESTIMATION MODAL */}
      <AnimatePresence>
        {showModal && estimate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-[#111827]/60 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden">
                <div className="bg-[#006cb7] p-5 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-base font-black uppercase tracking-widest">{estimate.title}</h3>
                        <p className="text-[9px] text-white/80 mt-1 uppercase tracking-widest flex items-center gap-2">
                           <Star size={10} className="fill-current" /> {estimate.appliedClass}
                           {promoCode && <span className="ml-2 bg-[#84BD00] px-2 py-0.5 rounded-sm">PROMO</span>}
                        </p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
                </div>
                
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {estimate.dist !== "N/A" && (
                            <div className="flex flex-col border-b border-gray-100 pb-3">
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Est. Route Distance</span>
                                <span className="text-xl font-black text-[#111827]">{estimate.dist}</span>
                            </div>
                        )}
                        <div className="flex flex-col border-b border-gray-100 pb-3">
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Est. Duration</span>
                            <span className="text-xl font-black text-[#111827]">{estimate.time}</span>
                        </div>
                        <div className="flex flex-col col-span-2 bg-gray-50 p-4 rounded-sm border border-gray-100 relative overflow-hidden mt-2">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#84BD00]" />
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Base Fleet Estimate</span>
                            <span className="text-3xl font-black text-[#84BD00]">{estimate.price}</span>
                        </div>
                    </div>

                    <Link href="/book" className="w-full h-12 bg-[#84BD00] hover:bg-[#70a100] text-white flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm shadow-md">
                        Proceed to Booking <ArrowRight size={14} />
                    </Link>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}