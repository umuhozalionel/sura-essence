"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Manrope } from "next/font/google";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, ArrowRight, Car, Clock, Plane, Wallet, 
  MapPin, Check, Users, Calendar, Star, ChevronLeft, ChevronRight,
  Camera, HelpCircle, Sparkles, Quote, ArrowUp, X, Phone, Mail, Zap,
  Sun, TrafficCone, Activity, CloudRain, Moon, Timer, AlertTriangle,
  Eye, Coffee, ShieldCheck, Thermometer, Target, Mountain, Waves,
  Search, Palette
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

// WEATHER API CONFIGURATION
const API_KEY = "23f292fb66ec335896541f0b5e8b87bf"; 
const CITY = "Kigali";

const IMAGES = {
  hero: "/marketing/kigali-skyline-night.jpg",
  funHero: "/marketing/fun-general.jpg",
  histHero: "/marketing/memorial-general.jpg",
  cultHero: "/marketing/market-general.jpg",
  stratHero: "/marketing/museum-general.jpg",
  fazenda: { main: "/locations/fazenda-main.jpg", g1: "/locations/fazenda-1.jpg", g2: "/locations/fazenda-2.jpg" },
  golf: { main: "/locations/golf-main.jpg", g1: "/locations/golf-1.jpg", g2: "/locations/golf-2.jpg" },
  mamba: { main: "/locations/mamba-main.webp", g1: "/locations/mamba-1.webp", g2: "/locations/mamba-2.jpg" },
  gisozi: { main: "/locations/gisozi-main.jpg", g1: "/locations/gisozi-1.jpg", g2: "/locations/gisozi-2.jpg" },
  kandt: { main: "/locations/kandt-main.jpg", g1: "/locations/kandt-1.png", g2: "/locations/kandt-2.png" },
  nyamata: { main: "/locations/nyamata-main.jpg", g1: "/locations/nyamata-1.webp", g2: "/locations/nyamata-2.jpg" },
  kimironko: { main: "/locations/kimironko-main.jpg", g1: "/locations/kimironko-1.jpg", g2: "/locations/kimironko-2.jpg" },
  nyamirambo: { main: "/locations/nyamirambo-main.jpg", g1: "/locations/nyamirambo-1.jpg", g2: "/locations/nyamirambo-2.jpg" },
  inema: { main: "/locations/inema-main.jpg", g1: "/locations/inema-1.jpg", g2: "/locations/inema-2.jpg" },
  campaign: { main: "/locations/campaign-main.jpg", g1: "/locations/campaign-1.jpg", g2: "/locations/campaign-2.jpg" },
  palace: { main: "/locations/palace-main.jpg", g1: "/locations/palace-1.jpg", g2: "/locations/palace-2.jpg" },
  rebero: { main: "/locations/rebero-main.jpg", g1: "/locations/rebero-1.jpg", g2: "/locations/rebero-2.jpg" },
};

const QUOTES = [
  { text: "Excellence is not an option in our fleet, it is the fundamental infrastructure upon which we build trust.", author: "IK", team: "The SURA Team" },
  { text: "The city pulses with art galleries, rooftop lounges, and a history that is both heartbreaking and inspiring.", author: "DS", team: "Logistics Lead" },
  { text: "Precision is the baseline of our mobility system; every transfer is a calculated sequence of safety and speed.", author: "PM", team: "Field Coordinator" },
  { text: "We don't just navigate Kigali; we integrate into its rhythm to ensure your arrival is silent and seamless.", author: "AT", team: "Fleet Management" },
  { text: "Rwanda's hills demand respect, and our drivers deliver it through mastered terrain navigation and poise.", author: "MK", team: "Senior Chauffeur" },
  { text: "A mobile office isn't just about Wi-Fi; it's about the security and focus that our private environment provides.", author: "SJ", team: "Executive Services" },
  { text: "The sunset from Rebero is a tactical victory for the senses, coordinated by our dedicated experience scouts.", author: "RK", team: "Tourism Operations" },
  { text: "From the cabin to the city, our arrival process is designed to eliminate the friction of international travel.", author: "EL", team: "Concierge SOP" },
  { text: "High-trust technology meets premium hospitality; this is the new standard of East African mobility.", author: "BN", team: "Technical Director" },
  { text: "Your schedule is our mission objective; we track the variables so you can focus on the destination.", author: "FH", team: "Dispatch Command" }
];

const COLLECTIONS = [
  {
    id: "adventure",
    category: "Fun & Adventure",
    intro: {
        title: "Kigali Unleashed",
        image: IMAGES.funHero,
        headline: "Beyond the Hills",
        desc: ["Experience the thrill of the thousand hills.", "From adrenaline on the mountain peaks to laid-back weekends by the pool."],
    },
    venues: [
      { 
        id: "fazenda",
        title: "Fazenda Sengha", 
        location: "Mount Kigali",
        tag: "Adrenaline",
        image: IMAGES.fazenda.main,
        gallery: [IMAGES.fazenda.main, IMAGES.fazenda.g1, IMAGES.fazenda.g2],
        price: 40,
        duration: "3-5 Hours",
        groupSize: "1-20",
        minAge: "6+",
        rating: 4.8,
        reviews: 124,
        desc: "Mount Kigali's premier outdoor adventure park.",
        longDesc: "Escape the city noise without leaving the city. Fazenda Sengha is an outdoor recreational center located on top of Mount Kigali.",
        highlights: ["Zipline over the valley", "Horseback Riding", "Quad Biking", "Archery"],
        missionIntel: { driveTime: "25m from CBD", vibe: "High Energy", isOutdoor: true, bestTime: "16:00 Sunset" },
        expect: [
          { label: "High Altitude Vibe", icon: Mountain },
          { label: "Tactical Safety Gear", icon: ShieldCheck },
          { label: "Adrenaline Focus", icon: Zap }
        ]
      },
      { 
        id: "golf",
        title: "Kigali Golf Resort", 
        location: "Nyarutarama",
        tag: "Luxury",
        image: IMAGES.golf.main,
        gallery: [IMAGES.golf.main, IMAGES.golf.g1, IMAGES.golf.g2],
        price: 120,
        duration: "Half Day",
        groupSize: "1-4",
        minAge: "10+",
        rating: 5.0,
        reviews: 45,
        desc: "World-class 18-hole course & tennis club.",
        longDesc: "Experience luxury at the Kigali Golf Resort & Villas.",
        highlights: ["18-Hole Course", "Tennis", "Fine Dining"],
        missionIntel: { driveTime: "15m from CBD", vibe: "Exclusive", isOutdoor: true, bestTime: "07:00 Morning" },
        expect: [
          { label: "Elite Atmosphere", icon: Target },
          { label: "Premium Lounge", icon: Coffee },
          { label: "Meticulous Terrain", icon: Activity }
        ]
      },
      { 
        id: "mamba",
        title: "Mamba Club", 
        location: "Kimihurura",
        tag: "Recreation",
        image: IMAGES.mamba.main,
        gallery: [IMAGES.mamba.main, IMAGES.mamba.g1, IMAGES.mamba.g2],
        price: 20,
        duration: "3 Hours",
        groupSize: "2-10",
        minAge: "All Ages",
        rating: 4.5,
        reviews: 200,
        desc: "Bowling, volleyball, and chill vibes.",
        longDesc: "Rwanda's first bowling alley and a favorite local hangout.",
        highlights: ["Bowling", "Volleyball", "Hostel Vibe"],
        missionIntel: { driveTime: "10m from CBD", vibe: "Social/Chill", isOutdoor: false, bestTime: "Thursday PM" },
        expect: [
          { label: "Urban Pool Vibe", icon: Waves },
          { label: "Active Socializing", icon: Users },
          { label: "Casual Logistics", icon: Clock }
        ]
      }
    ]
  },
  {
    id: "history",
    category: "Memorials & History",
    intro: {
        title: "Remembrance",
        image: IMAGES.histHero,
        headline: "A Tale of Two Eras",
        desc: ["A Journey Through Time.", "We distinguish clearly between Memorials (sacred sites) and Museums (educational)."],
    },
    venues: [
      { 
        id: "gisozi",
        title: "Kigali Genocide Memorial", 
        location: "Gisozi",
        tag: "Memorial",
        image: IMAGES.gisozi.main,
        gallery: [IMAGES.gisozi.main, IMAGES.gisozi.g1, IMAGES.gisozi.g2],
        price: 0,
        priceLabel: "Donation",
        duration: "2-3 Hours",
        groupSize: "Unlimited",
        minAge: "12+",
        rating: 5.0,
        reviews: 2500,
        desc: "The final resting place for 250,000 victims.",
        longDesc: "This is sacred ground. It serves as a place for survivors to remember their loved ones.",
        highlights: ["Main Exhibition", "Gardens", "Wall of Names"],
        missionIntel: { driveTime: "15m from CBD", vibe: "Solemn", isOutdoor: false, bestTime: "Morning" },
        expect: [
          { label: "Silent Protocol", icon: Eye },
          { label: "Deep Reflection", icon: Sparkles },
          { label: "Audio Guide Ready", icon: Activity }
        ]
      },
      { 
        id: "kandt",
        title: "Kandt House", 
        location: "Nyarugenge",
        tag: "Museum",
        image: IMAGES.kandt.main,
        gallery: [IMAGES.kandt.main, IMAGES.kandt.g1, IMAGES.kandt.g2],
        price: 10,
        duration: "1-2 Hours",
        groupSize: "1-15",
        minAge: "All Ages",
        rating: 4.5,
        reviews: 320,
        desc: "Natural history and early colonial times.",
        longDesc: "Dedicated to Richard Kandt, the first colonial resident.",
        highlights: ["History", "Reptiles", "Architecture"],
        missionIntel: { driveTime: "05m from CBD", vibe: "Educational", isOutdoor: false, bestTime: "Anytime" },
        expect: [
          { label: "Historical Briefing", icon: Target },
          { label: "Wildlife Exhibit", icon: Activity },
          { label: "Colonial Intel", icon: Search }
        ]
      },
      { 
        id: "nyamata",
        title: "Nyamata Church", 
        location: "Bugesera",
        tag: "Memorial",
        image: IMAGES.nyamata.main,
        gallery: [IMAGES.nyamata.main, IMAGES.nyamata.g1, IMAGES.nyamata.g2],
        price: 0,
        priceLabel: "Donation",
        duration: "3-4 Hours",
        groupSize: "1-10",
        minAge: "16+",
        rating: 4.9,
        reviews: 150,
        desc: "A visceral, untouched site of history 30km out.",
        longDesc: "A heavier, deeply moving experience preserving the physical evidence of the tragedy.",
        highlights: ["Church", "Crypts", "Clothing"],
        missionIntel: { driveTime: "45m from CBD", vibe: "Reflective", isOutdoor: false, bestTime: "Early Day" },
        expect: [
          { label: "Sacred Silence", icon: ShieldCheck },
          { label: "Visceral History", icon: Zap },
          { label: "Rural Access", icon: Car }
        ]
      }
    ]
  },
  {
    id: "culture",
    category: "Markets & Culture",
    intro: {
        title: "Urban Pulse",
        image: IMAGES.cultHero,
        headline: "Colors, Crafts & Chaos",
        desc: ["Dive into the daily life of Kigali.", "From bustling alleys to creative studios."],
    },
    venues: [
      { 
        id: "kimironko",
        title: "Kimironko Market", 
        location: "Kimironko",
        tag: "Shopping",
        image: IMAGES.kimironko.main,
        gallery: [IMAGES.kimironko.main, IMAGES.kimironko.g1, IMAGES.kimironko.g2],
        price: 0,
        priceLabel: "Free",
        duration: "1-2 Hours",
        groupSize: "Small Groups",
        minAge: "All Ages",
        rating: 4.7,
        reviews: 1800,
        desc: "The largest covered market in the city.",
        longDesc: "If you want LIFE, you go here. We know the 'mamas' in the fabric section.",
        highlights: ["Tailoring", "Fabrics", "Fruit"],
        missionIntel: { driveTime: "20m from CBD", vibe: "Chaotic", isOutdoor: false, bestTime: "09:00 - 11:00" },
        expect: [
          { label: "High Energy Chaos", icon: Activity },
          { label: "Fabric Sourcing", icon: Sparkles },
          { label: "Live Negotiation", icon: Wallet }
        ]
      },
      { 
        id: "inema",
        title: "Inema Arts", 
        location: "Kacyiru",
        tag: "Art",
        image: IMAGES.inema.main,
        gallery: [IMAGES.inema.main, IMAGES.inema.g1, IMAGES.inema.g2],
        price: 0,
        priceLabel: "Free",
        duration: "1 Hour",
        groupSize: "Unlimited",
        minAge: "All Ages",
        rating: 4.6,
        reviews: 450,
        desc: "Contemporary art gallery & happy hour spot.",
        longDesc: "A beacon for African contemporary art.",
        highlights: ["Art", "Painting", "Cocktails"],
        missionIntel: { driveTime: "10m from CBD", vibe: "Artsy", isOutdoor: false, bestTime: "Thursday PM" },
        expect: [
          { label: "Creative Vibe", icon: Palette },
          { label: "Modern Social", icon: Coffee },
          { label: "Visual Intel", icon: Eye }
        ]
      },
      { 
        id: "nyamirambo",
        title: "Nyamirambo Walking", 
        location: "Nyamirambo",
        tag: "Culture",
        image: IMAGES.nyamirambo.main,
        gallery: [IMAGES.nyamirambo.main, IMAGES.nyamirambo.g1, IMAGES.nyamirambo.g2],
        price: 35,
        duration: "2-4 Hours",
        groupSize: "2-10",
        minAge: "10+",
        rating: 4.9,
        reviews: 600,
        desc: "Walking tours through the Muslim quarter.",
        longDesc: "Walk the vibrant streets, visit salons, and enjoy a traditional meal.",
        highlights: ["Walk", "Cooking", "Lunch"],
        missionIntel: { driveTime: "15m from CBD", vibe: "Community", isOutdoor: true, bestTime: "Lunchtime" },
        expect: [
          { label: "Authentic Food", icon: Coffee },
          { label: "Street Level Intel", icon: MapPin },
          { label: "Cultural Exchange", icon: Users }
        ]
      }
    ]
  },
  {
    id: "strategy",
    category: "Strategic History",
    intro: {
        title: "The Tactical View",
        image: IMAGES.stratHero,
        headline: "Power & Strategy",
        desc: ["Power & Strategy.", "Understand the military and political history that shaped modern Rwanda."],
    },
    venues: [
      { 
        id: "campaign",
        title: "Campaign Museum", 
        location: "Parliament",
        tag: "Museum",
        image: IMAGES.campaign.main,
        gallery: [IMAGES.campaign.main, IMAGES.campaign.g1, IMAGES.campaign.g2],
        price: 15,
        duration: "1.5 Hours",
        groupSize: "1-20",
        minAge: "12+",
        rating: 4.8,
        reviews: 210,
        desc: "Military history museum at Parliament.",
        longDesc: "Located in the Parliament building, this museum details military strategy.",
        highlights: ["Maps", "Monument", "Parliament"],
        missionIntel: { driveTime: "10m from CBD", vibe: "Strategic", isOutdoor: false, bestTime: "Afternoon" },
        expect: [
          { label: "Tactical Overlays", icon: Target },
          { label: "Political Intel", icon: Eye },
          { label: "Military Focus", icon: ShieldCheck }
        ]
      },
      { 
        id: "palace",
        title: "Presidential Palace", 
        location: "Kanombe",
        tag: "History",
        image: IMAGES.palace.main,
        gallery: [IMAGES.palace.main, IMAGES.palace.g1, IMAGES.palace.g2],
        price: 15,
        duration: "1-2 Hours",
        groupSize: "1-15",
        minAge: "All Ages",
        rating: 4.4,
        reviews: 180,
        desc: "The former state house near the airport.",
        longDesc: "Known as the Kanombe Museum, this residence is key to understanding history.",
        highlights: ["House", "Debris", "History"],
        missionIntel: { driveTime: "30m (Airport)", vibe: "Historical", isOutdoor: false, bestTime: "Morning" },
        expect: [
          { label: "Interior Intel", icon: Timer },
          { label: "Evidence Sites", icon: AlertTriangle },
          { label: "Lush Perimeter", icon: Mountain }
        ]
      },
      { 
        id: "rebero",
        title: "Rebero Viewpoint", 
        location: "Rebero",
        tag: "View",
        image: IMAGES.rebero.main,
        gallery: [IMAGES.rebero.main, IMAGES.rebero.g1, IMAGES.rebero.g2],
        price: 0,
        priceLabel: "Free",
        duration: "1 Hour",
        groupSize: "Unlimited",
        minAge: "All Ages",
        rating: 4.9,
        reviews: 120,
        desc: "Strategic hill with 360-degree views.",
        longDesc: "A strategic military position in the past, now the best viewpoint for Kigali.",
        highlights: ["Views", "Sunset", "Breeze"],
        missionIntel: { driveTime: "25m from CBD", vibe: "Scenic", isOutdoor: true, bestTime: "17:30 Sunset" },
        expect: [
          { label: "360 Visuals", icon: Eye },
          { label: "High Ground", icon: Mountain },
          { label: "Wind Protocol", icon: Activity }
        ]
      }
    ]
  }
];

function ToursContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeCategory, setActiveCategory] = useState<any | null>(null);
  const [activeVenue, setActiveVenue] = useState<any | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0); 
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [kigaliTime, setKigaliTime] = useState("");
  const [weatherStatus, setWeatherStatus] = useState<{ temp: number; condition: string } | null>(null);

  useEffect(() => {
    async function fetchLiveIntel() {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`);
        const data = await res.json();
        if (res.ok) {
           setWeatherStatus({ temp: Math.round(data.main.temp), condition: data.weather[0].main });
        }
      } catch (e) { setWeatherStatus({ temp: 24, condition: "Clear" }); }
    }
    fetchLiveIntel();
    const interval = setInterval(fetchLiveIntel, 600000);
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

  useEffect(() => {
    if (!isPaused) {
        const timer = setInterval(() => setQuoteIndex((p) => (p + 1) % QUOTES.length), 10000);
        return () => clearInterval(timer);
    }
  }, [isPaused]);

  useEffect(() => {
    const catId = searchParams.get("category");
    const venueId = searchParams.get("venue");
    if (venueId) {
      let fV = null, fC = null;
      for (const col of COLLECTIONS) {
        const v = col.venues.find(v => v.id === venueId);
        if (v) { fV = v; fC = col; break; }
      }
      if (fV) { setActiveVenue(fV); setActiveCategory(fC); }
    } else if (catId) {
      const fC = COLLECTIONS.find(c => c.id === catId);
      if (fC) { setActiveCategory(fC); setActiveVenue(null); }
    } else { setActiveCategory(null); setActiveVenue(null); }
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) setShowTopBtn(true);
      else setShowTopBtn(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const missionStatus = useMemo(() => {
    const hour = parseInt(kigaliTime.split(":")[0]);
    if (isNaN(hour)) return { label: "Syncing...", icon: Timer, color: "text-gray-400" };
    if (hour >= 17 && hour < 18) return { label: "Golden Hour Active", icon: Sun, color: "text-orange-400" };
    if (hour >= 18 || hour < 5) return { label: "Night Operations", icon: Moon, color: "text-blue-400" };
    return { label: "Optimal Conditions", icon: Zap, color: "text-[#C97C2F]" };
  }, [kigaliTime]);

  const handleBack = () => {
    triggerHaptic();
    if (activeVenue) {
      router.push(`?category=${activeCategory.id}`);
    } else {
      router.push("/tours");
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeVenue) setCurrentGalleryIndex((p) => (p + 1) % activeVenue.gallery.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeVenue) setCurrentGalleryIndex((p) => (p - 1 + activeVenue.gallery.length) % activeVenue.gallery.length);
  };

  return (
    <main className={`min-h-screen bg-[#F5F2EA] text-[#111827] relative ${manrope.className} selection:bg-[#C97C2F]/20`}>
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#111827 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.08 }}></div>

      <div className="relative z-10">
        <Header />

        {(activeCategory || activeVenue) && (
            <div className="fixed top-24 left-6 z-[60]">
                <button onClick={handleBack} className="flex items-center justify-center w-14 h-14 bg-white text-[#111827] hover:bg-[#111827] hover:text-white shadow-xl border border-gray-100 transition-all">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>
        )}

        {activeVenue ? (
            <div className="pt-24 pb-20 max-w-[1600px] mx-auto px-10 relative z-10">
                <div className="flex flex-wrap items-center gap-6 mb-12 bg-[#111827] p-6 border-b-4 border-[#C97C2F] shadow-2xl">
                    <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">System Live</span>
                    </div>
                    <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                        <Clock className="w-4 h-4 text-[#C97C2F]" />
                        <span className="text-xl font-black text-white tabular-nums">{kigaliTime} <span className="text-[10px] text-white/30 ml-1 uppercase">CAT</span></span>
                    </div>
                    <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                        <missionStatus.icon className={`w-4 h-4 ${missionStatus.color}`} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{missionStatus.label}</span>
                    </div>
                    {weatherStatus && (
                      <div className="flex items-center gap-3">
                          <CloudRain className="w-4 h-4 text-blue-400" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{weatherStatus.temp}°C • {weatherStatus.condition}</span>
                      </div>
                    )}
                </div>

                {weatherStatus?.condition === "Rain" && activeVenue.missionIntel?.isOutdoor && (
                  <div className="mb-12 bg-red-600/10 border-2 border-red-600 p-8 flex items-center gap-6">
                    <AlertTriangle className="w-10 h-10 text-red-600 animate-bounce" />
                    <div>
                      <h4 className="text-red-600 font-black uppercase tracking-[0.2em] text-lg">Rain Protocol Engaged</h4>
                      <p className="text-red-600/70 font-bold uppercase text-[10px] tracking-widest mt-1">Outdoor venue detected. Switch to Indoor categories recommended.</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-gray-200 bg-white shadow-2xl h-[500px] mb-16 overflow-hidden">
                    <div className="lg:col-span-8 bg-gray-100 relative group cursor-pointer z-20" onClick={() => { setIsGalleryOpen(true); setCurrentGalleryIndex(0); triggerHaptic(); }}>
                        <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url('${activeVenue.gallery[0]}')` }} />
                        <div className="absolute bottom-0 left-0 bg-[#111827] text-white px-8 py-4 z-30 pointer-events-none">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{activeVenue.tag}</span>
                        </div>
                    </div>
                    <div className="hidden lg:grid col-span-4 grid-rows-2 h-full">
                        <div className="bg-gray-100 relative border-l border-b border-gray-200 group overflow-hidden cursor-pointer z-20" onClick={() => { setIsGalleryOpen(true); setCurrentGalleryIndex(1); triggerHaptic(); }}>
                            <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url('${activeVenue.gallery[1]}')` }} />
                        </div>
                        <button className="bg-[#111827] relative cursor-pointer h-full w-full flex flex-col items-center justify-center border-l border-gray-200 group z-30 hover:bg-[#1f2937] transition-colors" onClick={() => { setIsGalleryOpen(true); setCurrentGalleryIndex(2); triggerHaptic(); }}>
                            <div className="absolute inset-0 bg-cover bg-center opacity-40 transition-all duration-700 pointer-events-none" style={{ backgroundImage: `url('${activeVenue.gallery[2]}')` }} />
                            <div className="relative z-40 flex flex-col items-center gap-4 text-white pointer-events-none">
                                <Camera className="w-8 h-8 text-[#C97C2F]" />
                                <span className="font-black text-[10px] uppercase tracking-[0.4em] border-b-2 border-[#C97C2F] pb-2">Launch Gallery</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-20 items-start">
                    <div className="flex-1 space-y-12">
                        {activeVenue.missionIntel && (
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-[#111827] text-white px-4 py-2 border-l-2 border-[#C97C2F] flex items-center gap-2">
                                    <TrafficCone className="w-3 h-3 text-[#C97C2F]" /><span className="text-[10px] font-black uppercase tracking-widest">{activeVenue.missionIntel.driveTime}</span>
                                </div>
                                <div className="bg-[#111827] text-white px-4 py-2 border-l-2 border-[#C97C2F] flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-[#C97C2F]" /><span className="text-[10px] font-black uppercase tracking-widest">{activeVenue.missionIntel.vibe} Vibe</span>
                                </div>
                                <div className="bg-[#111827] text-white px-4 py-2 border-l-2 border-[#C97C2F] flex items-center gap-2">
                                    <Sun className="w-3 h-3 text-[#C97C2F]" /><span className="text-[10px] font-black uppercase tracking-widest">Target: {activeVenue.missionIntel.bestTime}</span>
                                </div>
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-3 py-2 px-5 bg-[#111827] text-white mb-8 self-start inline-flex"><MapPin className="w-4 h-4 text-[#C97C2F]" /><span className="text-[10px] font-black uppercase tracking-[0.3em]">{activeVenue.location}</span></div>
                            <h1 className="text-6xl md:text-8xl font-black text-[#111827] mb-8 tracking-tighter leading-none uppercase">{activeVenue.title}</h1>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                               {activeVenue.expect?.map((item: any, i: number) => {
                                  const Icon = item.icon;
                                  return (
                                    <div key={i} className="bg-white border border-gray-200 p-6 flex items-center gap-5 shadow-sm">
                                        <div className="w-10 h-10 bg-[#F5F2EA] flex items-center justify-center text-[#C97C2F]"><Icon size={20} /></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#111827]">{item.label}</span>
                                    </div>
                                  );
                               })}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 border border-gray-200 bg-white shadow-2xl">
                                {[{ icon: Clock, label: activeVenue.duration }, { icon: Users, label: `Max ${activeVenue.groupSize}` }, { icon: Check, label: `Age ${activeVenue.minAge}` }, { icon: Star, label: `${activeVenue.rating} Rating` }].map((s, i) => (
                                    <div key={i} className="p-8 border-r last:border-r-0 border-gray-100 flex flex-col items-center gap-2"><s.icon className="w-5 h-5 text-[#C97C2F]" /><span className="text-[10px] font-black text-[#111827] uppercase tracking-widest text-center">{s.label}</span></div>
                                ))}
                            </div>
                        </div>
                        <p className="text-xl font-bold text-[#111827] leading-relaxed uppercase tracking-tight">{activeVenue.longDesc}</p>
                    </div>
                    <div className="lg:w-[450px] sticky top-28">
                        <div className="bg-[#111827] p-12 shadow-2xl border-t-4 border-[#C97C2F]">
                            <span className="text-[10px] font-black text-[#C97C2F] uppercase tracking-[0.4em] block mb-4">Starting Rate</span>
                            <div className="flex items-baseline gap-2 mb-10 border-b border-white/10 pb-10"><span className="text-6xl font-black text-white tabular-nums tracking-tighter">{activeVenue.priceLabel || `$${activeVenue.price}`}</span></div>
                            <button onClick={triggerHaptic} className="w-full h-20 bg-[#C97C2F] hover:bg-white hover:text-[#111827] text-white font-black text-xs uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-4">Book Transfer <ArrowRight className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>
            </div>
        ) : activeCategory ? (
            <div className="min-h-screen relative z-10">
                <div className="relative h-[65vh] flex items-center justify-center bg-[#111827] overflow-hidden">
                    <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url('${activeCategory.intro.image}')` }} />
                    <div className="relative z-20 text-center max-w-5xl px-6"><h1 className="text-6xl md:text-9xl font-black text-white mb-8 uppercase tracking-tighter leading-none">{activeCategory.intro.title}</h1></div>
                </div>
                <div className="max-w-[1600px] mx-auto px-10 py-32 relative z-10">
                    <div className="mb-20 max-w-4xl border-l-4 border-[#C97C2F] pl-8">
                        {Array.isArray(activeCategory.intro.desc) && activeCategory.intro.desc.map((l: string, i: number) => (
                            <p key={i} className="text-2xl md:text-4xl font-black text-[#111827] uppercase tracking-wide leading-tight block mb-2">{l}</p>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 border border-gray-200 bg-white shadow-2xl overflow-hidden">
                        {activeCategory.venues.map((v: any) => (
                            <Link href={`?category=${activeCategory.id}&venue=${v.id}`} onClick={triggerHaptic} key={v.id} className="group transition-all duration-500 cursor-pointer flex flex-col h-full bg-white border border-gray-100 hover:bg-[#111827]">
                                <div className="h-[320px] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url('${v.image}')` }} />
                                    <div className="absolute top-0 left-0 bg-[#C97C2F] text-white px-5 py-2"><span className="text-[10px] font-black uppercase tracking-widest">{v.tag}</span></div>
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                                        <div className="flex gap-4 items-center">
                                            <div className="flex items-center gap-2"><Clock size={12} className="text-[#C97C2F]" /><span className="text-[9px] font-black text-white uppercase tracking-widest">{v.duration}</span></div>
                                            <div className="flex items-center gap-2"><MapPin size={12} className="text-[#C97C2F]" /><span className="text-[9px] font-black text-white uppercase tracking-widest">{v.location}</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-10 flex flex-col h-full">
                                    <h3 className="text-3xl font-black text-[#111827] group-hover:text-white uppercase tracking-tighter mb-8 transition-colors leading-none">{v.title}</h3>
                                    
                                    <div className="space-y-4 mb-10">
                                       {v.expect?.map((ex: any, idx: number) => {
                                         const PreviewIcon = ex.icon;
                                         return (
                                           <div key={idx} className="flex items-center gap-4 border-l border-gray-200 group-hover:border-[#C97C2F]/30 pl-4">
                                              <PreviewIcon size={14} className="text-[#C97C2F]" />
                                              <span className="text-[10px] font-black text-gray-400 group-hover:text-white/70 uppercase tracking-widest">{ex.label}</span>
                                           </div>
                                         );
                                       })}
                                    </div>
                                    <p className="text-gray-400 group-hover:text-white/50 text-[10px] font-bold uppercase tracking-tight flex-grow line-clamp-2 mb-10">{v.desc}</p>

                                    {/* EXPLORE THE VENUE BUTTON - ACTION ORIENTED */}
                                    <div className="mt-auto pt-8 border-t border-gray-100 group-hover:border-white/10">
                                        <div className="h-14 w-full bg-[#111827] group-hover:bg-[#C97C2F] flex items-center justify-between px-8 transition-all">
                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Explore Venue</span>
                                            <ArrowRight size={16} className="text-[#C97C2F] group-hover:text-white transition-transform group-hover:translate-x-2" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div>
                <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#111827]">
                    <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('${IMAGES.hero}')` }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/80 via-transparent to-[#111827]" />
                    <div className="relative z-20 container mx-auto px-10 grid lg:grid-cols-2 gap-20 items-start h-full pt-40">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-3 py-2 px-6 bg-[#C97C2F] text-white font-black text-[10px] uppercase tracking-[0.4em] mb-10 shadow-2xl">Premium Mobility Infrastructure</div>
                            <h1 className="text-7xl md:text-[9rem] font-black text-white mb-10 leading-[0.85] tracking-tighter uppercase drop-shadow-2xl">Kigali <br/><span className="text-[#C97C2F]">Unscripted.</span></h1>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex gap-4 mb-12"><a href="https://wa.me/250788845062" target="_blank" onClick={triggerHaptic} className="h-16 px-10 bg-[#C97C2F] hover:bg-white hover:text-[#111827] text-white font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-2xl flex items-center justify-center gap-3"><Phone className="w-4 h-4" /> Book Transfer</a></div>
                            <div className="relative max-w-lg text-right self-end min-h-[250px] p-0" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
                                <AnimatePresence mode="wait">
                                    <motion.div key={quoteIndex} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 1 }} className="flex flex-col items-end">
                                        <Quote className="w-10 h-10 text-[#C97C2F] mb-6 ml-auto opacity-60" /><p className="text-xl font-bold text-white leading-tight mb-8 italic uppercase tracking-widest opacity-90 max-w-md">"{QUOTES[quoteIndex].text}"</p>
                                        <div className="flex flex-col items-end border-t border-white/10 pt-8 opacity-60"><p className="text-[#C97C2F] font-black text-2xl tracking-tighter mb-2">{QUOTES[quoteIndex].author}</p><p className="text-white font-black text-[10px] uppercase tracking-[0.3em]">{QUOTES[quoteIndex].team}</p></div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </section>
                <section id="collections-section" className="px-10 max-w-[1600px] mx-auto pb-40 space-y-40">
                    {COLLECTIONS.map((d, i) => (
                        <div key={d.id} className="relative scroll-mt-32">
                            <div className="flex justify-between items-end mb-20">
                                <div><span className="text-8xl font-black text-[#111827]/5 select-none tracking-tighter">0{i + 1}</span><h2 className="text-6xl md:text-[6rem] font-black text-[#111827] mb-8 uppercase tracking-tighter leading-none">{d.category}</h2></div>
                                <Link href={`?category=${d.id}`} onClick={triggerHaptic} className="text-[#111827] font-black text-[11px] uppercase tracking-[0.5em] flex items-center gap-6 hover:text-[#C97C2F] transition-colors group">Expand Collection <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" /></Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 border border-gray-200 bg-white shadow-2xl overflow-hidden">
                                {d.venues.map((v) => (
                                    <Link href={`?category=${d.id}&venue=${v.id}`} onClick={triggerHaptic} key={v.id} className="group transition-all duration-500 cursor-pointer flex flex-col h-full bg-white border border-gray-100 hover:bg-[#111827]">
                                        <div className="h-[320px] relative overflow-hidden">
                                            <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url('${v.image}')` }} />
                                        </div>
                                        <div className="p-10 flex flex-col h-full">
                                            <h3 className="text-3xl font-black text-[#111827] group-hover:text-white uppercase tracking-tighter mb-4 transition-colors leading-none">{v.title}</h3>
                                            
                                            {/* BUTTON ADDED TO MAIN LANDING GRID AS WELL */}
                                            <div className="mt-auto pt-8 border-t border-gray-100 group-hover:border-white/10">
                                                <div className="h-14 w-full bg-[#111827] group-hover:bg-[#C97C2F] flex items-center justify-between px-8 transition-all">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Explore Venue</span>
                                                    <ArrowRight size={16} className="text-[#C97C2F] group-hover:text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            </div>
        )}

        <AnimatePresence>
            {isGalleryOpen && activeVenue && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6">
                    <button onClick={() => setIsGalleryOpen(false)} className="absolute top-10 right-10 text-white/50 hover:text-[#C97C2F] z-[120]"><X size={48} /></button>
                    <div className="relative w-full max-w-7xl flex items-center justify-center group/nav">
                        <button onClick={handlePrevImage} className="absolute left-4 z-[110] text-white/50 hover:text-white bg-white/10 p-4 rounded-none hover:bg-[#C97C2F] transition-all"><ChevronLeft size={48} /></button>
                        <motion.div key={currentGalleryIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full aspect-video flex items-center justify-center">
                            <div className="w-full h-full bg-contain bg-center bg-no-repeat shadow-2xl" style={{ backgroundImage: `url('${activeVenue.gallery[currentGalleryIndex]}')` }} />
                        </motion.div>
                        <button onClick={handleNextImage} className="absolute right-4 z-[110] text-white/50 hover:text-white bg-white/10 p-4 rounded-none hover:bg-[#C97C2F] transition-all"><ChevronRight size={48} /></button>
                    </div>
                </div>
            )}
        </AnimatePresence>
        <Footer />
      </div>
    </main>
  );
}

export default function ToursPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111827] flex items-center justify-center text-white font-black uppercase tracking-[0.5em]">Initializing...</div>}>
      <ToursContent />
    </Suspense>
  );
}