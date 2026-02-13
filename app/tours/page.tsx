"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Manrope } from "next/font/google"; // REVERTED TO MANROPE ONLY
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, ArrowRight, Car, Clock, Plane, Wallet, 
  MapPin, Check, Users, Calendar, Star, 
  Camera, HelpCircle, Sparkles, Quote, ArrowUp, X, Phone, Mail, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

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
  { text: "Excellence is not an option in our fleet, it is the fundamental infrastructure upon which we build trust.", author: "IK", team: "The SURA Team", sub: "Operational " },
  { text: "The city pulses with art galleries, rooftop lounges, and a history that is both heartbreaking and inspiring.", author: "DS", team: "Logistics Lead", sub: "Operational " },
  { text: "Precision is the baseline of our mobility system; every transfer is a calculated sequence of safety and speed.", author: "PM", team: "Field Coordinator", sub: "Operational " },
  { text: "We don't just navigate Kigali; we integrate into its rhythm to ensure your arrival is silent and seamless.", author: "AT", team: "Fleet Management", sub: "Operational " },
  { text: "Rwanda's hills demand respect, and our drivers deliver it through mastered terrain navigation and poise.", author: "MK", team: "Senior Chauffeur", sub: "Operational " },
  { text: "A mobile office isn't just about Wi-Fi; it's about the security and focus that our private environment provides.", author: "SJ", team: "Executive Services", sub: "Operational " },
  { text: "The sunset from Rebero is a tactical victory for the senses, coordinated by our dedicated experience scouts.", author: "RK", team: "Tourism Operations", sub: "Operational " },
  { text: "From the cabin to the city, our arrival  is designed to eliminate the friction of international travel.", author: "EL", team: "Concierge SOP", sub: "Operational " },
  { text: "High-trust technology meets premium hospitality; this is the new standard of East African mobility.", author: "BN", team: "Technical Director", sub: "Operational " },
  { text: "Your schedule is our mission objective; we track the variables so you can focus on the destination.", author: "FH", team: "Dispatch Command", sub: "Operational " }
];

const COLLECTIONS = [
  {
    id: "adventure",
    category: "Fun & Adventure",
    intro: {
        title: "Kigali Unleashed",
        image: IMAGES.funHero,
        headline: "Beyond the Hills",
        desc: "Kigali isn't just about business. It's a city that knows how to play. From adrenaline on the mountain peaks to laid-back weekends by the pool.",
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
        itinerary: [{ time: "09:00", title: "Pickup", desc: "Pickup from your hotel in Kigali." }],
        faqs: [{ q: "Is it safe?", a: "Yes, fully instructed." }],
        includes: ["Entrance", "Gear"],
        excludes: ["Lunch"]
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
        longDesc: "Experience luxury at the Kigali Golf Resort & Villas. Designed by Gary Player, this 18-hole course is a masterpiece.",
        highlights: ["18-Hole Course", "Tennis", "Fine Dining"],
        itinerary: [{ time: "Flexible", title: "Tee Time", desc: "Arrive 30 mins before." }],
        faqs: [{ q: "Clubs rental?", a: "Available on site." }],
        includes: ["Green Fees", "Caddy"],
        excludes: ["Club Rental"]
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
        longDesc: "Rwanda's first bowling alley and a favorite local hangout. Great for casual afternoons.",
        highlights: ["Bowling", "Volleyball", "Hostel Vibe"],
        itinerary: [{ time: "Flexible", title: "Game Time", desc: "Lanes reserved for 2 hours." }],
        faqs: [{ q: "Food?", a: "Restaurant available." }],
        includes: ["Bowling Shoes", "Game"],
        excludes: ["Food/Drinks"]
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
        desc: "We distinguish clearly between Memorials (sacred sites) and Museums (educational).",
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
        itinerary: [{ time: "10:00", title: "Intro Film", desc: "Watch documentary." }],
        faqs: [{ q: "Photography?", a: "Gardens only." }],
        includes: ["Entry"],
        excludes: ["Audio Guide"]
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
        longDesc: "Dedicated to Richard Kandt, the first colonial resident. Focuses on pre-colonial era and reptiles.",
        highlights: ["History", "Reptiles", "Architecture"],
        itinerary: [{ time: "09:00", title: "Tour", desc: "Guided walk." }],
        faqs: [{ q: "Snakes safe?", a: "Yes, secured." }],
        includes: ["Entry", "Guide"],
        excludes: ["Transport"]
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
        itinerary: [{ time: "09:00", title: "Drive", desc: "45 min drive from Kigali." }],
        faqs: [{ q: "Dress code?", a: "Respectful attire required." }],
        includes: ["Entry", "Guide"],
        excludes: ["Transport"]
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
        desc: "Dive into the daily life of Kigali. From bustling alleys to creative studios.",
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
        itinerary: [{ time: "10:00", title: "Shop", desc: "Browse and buy." }],
        faqs: [{ q: "Cards?", a: "Cash preferred." }],
        includes: ["Guide"],
        excludes: ["Purchases"]
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
        longDesc: "A beacon for African contemporary art. View the gallery, watch live painting sessions.",
        highlights: ["Art", "Painting", "Cocktails"],
        itinerary: [{ time: "Flexible", title: "Visit", desc: "Open daily." }],
        faqs: [{ q: "Buy art?", a: "Yes, available." }],
        includes: ["Entry"],
        excludes: ["Drinks"]
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
        longDesc: "Walk the vibrant streets, visit salons, and enjoy a traditional meal prepared by the women of the cooperative.",
        highlights: ["Walk", "Cooking", "Lunch"],
        itinerary: [{ time: "09:00", title: "Meet", desc: "Women's Center." }],
        faqs: [{ q: "Lunch?", a: "Included in full tour." }],
        includes: ["Guide", "Lunch"],
        excludes: ["Transport"]
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
        desc: "Understand the military and political history that shaped modern Rwanda.",
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
        longDesc: "Located in the Parliament building, this museum details the military strategy used by the RPA.",
        highlights: ["Maps", "Monument", "Parliament"],
        itinerary: [{ time: "09:00", title: "Check-in", desc: "Security check." }],
        faqs: [{ q: "ID?", a: "Passport required." }],
        includes: ["Entry", "Guide"],
        excludes: ["Transport"]
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
        itinerary: [{ time: "10:00", title: "Tour", desc: "House and garden." }],
        faqs: [{ q: "Location?", a: "Near airport." }],
        includes: ["Entry", "Guide"],
        excludes: ["Transport"]
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
        longDesc: "A strategic military position in the past, now a viewpoint for Kigali.",
        highlights: ["Views", "Sunset", "Breeze"],
        itinerary: [{ time: "17:00", title: "Sunset", desc: "Best time to visit." }],
        faqs: [{ q: "Food?", a: "Hotel nearby." }],
        includes: ["Views"],
        excludes: ["Transport"]
      }
    ]
  }
];

function ToursContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeCategory, setActiveCategory] = useState<any | null>(null);
  const [activeVenue, setActiveVenue] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("itinerary"); 
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0); 
  
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingGuests, setBookingGuests] = useState("1");

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const catId = searchParams.get("category");
    const venueId = searchParams.get("venue");
    if (venueId) {
      let foundVenue = null;
      let foundCat = null;
      for (const col of COLLECTIONS) {
        const v = col.venues.find(v => v.id === venueId);
        if (v) { foundVenue = v; foundCat = col; break; }
      }
      if (foundVenue) { setActiveVenue(foundVenue); setActiveCategory(foundCat); }
    } else if (catId) {
      const foundCat = COLLECTIONS.find(c => c.id === catId);
      if (foundCat) { setActiveCategory(foundCat); setActiveVenue(null); }
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

  const scrollToTop = () => { window.scrollTo({ top: 0, behavior: "smooth" }); };
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const updateUrl = (catId: string | null, venueId: string | null) => {
    const params = new URLSearchParams();
    if (catId) params.set("category", catId);
    if (venueId) params.set("venue", venueId);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleOpenCategory = (collection: any) => { updateUrl(collection.id, null); scrollToTop(); };
  const handleOpenVenue = (venue: any) => {
    const parentCat = COLLECTIONS.find(c => c.venues.some(v => v.id === venue.id));
    updateUrl(parentCat?.id || null, venue.id);
    scrollToTop();
  };

  const handleBack = () => {
    if (activeVenue) {
      const parentCat = COLLECTIONS.find(c => c.venues.some(v => v.id === activeVenue.id));
      if (parentCat) { updateUrl(parentCat.id, null); } 
      else { router.push("?"); }
    } else if (activeCategory) { updateUrl(null, null); }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVenue) return;
    const phoneNumber = "250788845062"; 
    const message = `Hello, I would like to book a trip to *${activeVenue.title}*.%0ADate: ${bookingDate}%0AGuests: ${bookingGuests}`;
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    setIsBookingOpen(false);
  };

  return (
    <main className={`min-h-screen bg-[#F5F2EA] text-[#111827] relative ${manrope.className} selection:bg-[#C97C2F]/20`}>
      <Header />

      {(activeCategory || activeVenue) && (
        <div className="fixed top-24 left-6 z-50">
            <Button onClick={handleBack} className="rounded-none w-14 h-14 bg-white text-[#111827] hover:bg-[#111827] hover:text-white shadow-xl border border-gray-100 flex items-center justify-center p-0 transition-all">
                <ArrowLeft className="w-6 h-6" />
            </Button>
        </div>
      )}

      {activeVenue ? (
        /* VENUE VIEW */
        <div className="pt-24 pb-20 max-w-[1600px] mx-auto px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-gray-200 bg-white shadow-2xl h-[500px] mb-16 overflow-hidden">
                <div className="lg:col-span-8 bg-gray-100 relative group cursor-pointer" onClick={() => setIsGalleryOpen(true)}>
                    <div className="absolute inset-0 bg-cover bg-center grayscale-0 group-hover:grayscale transition-all duration-700" style={{ backgroundImage: `url('${activeVenue.gallery[0]}')` }} />
                    <div className="absolute bottom-0 left-0 bg-[#111827] text-white px-8 py-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{activeVenue.tag}</span>
                    </div>
                </div>
                <div className="hidden lg:grid col-span-4 grid-rows-2 h-full">
                    <div className="bg-gray-100 relative border-l border-b border-gray-200 group overflow-hidden" style={{ cursor: 'pointer' }} onClick={() => setIsGalleryOpen(true)}>
                        <div className="absolute inset-0 bg-cover bg-center grayscale-0 group-hover:grayscale transition-all duration-700" style={{ backgroundImage: `url('${activeVenue.gallery[1]}')` }} />
                    </div>
                    <div className="bg-[#111827] relative cursor-pointer h-full flex flex-col items-center justify-center border-l border-gray-200 group" onClick={() => setIsGalleryOpen(true)}>
                        <div className="absolute inset-0 bg-cover bg-center opacity-40 grayscale-0 group-hover:grayscale transition-all duration-700" style={{ backgroundImage: `url('${activeVenue.gallery[2]}')` }} />
                        <div className="relative z-10 flex flex-col items-center gap-4 text-white">
                            <Camera className="w-8 h-8 text-[#C97C2F]" />
                            <span className="font-black text-[10px] uppercase tracking-[0.4em] border-b-2 border-[#C97C2F] pb-2">Launch Gallery</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-20 items-start">
                <div className="flex-1 space-y-12">
                    <div>
                        <div className="flex items-center gap-3 py-2 px-5 bg-[#111827] text-white mb-8 self-start inline-flex">
                            <MapPin className="w-4 h-4 text-[#C97C2F]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{activeVenue.location} </span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-[#111827] mb-8 tracking-tighter leading-none uppercase">{activeVenue.title}</h1>
                        <div className="grid grid-cols-2 md:grid-cols-4 border border-gray-200 bg-white">
                            {[
                                { icon: Clock, label: activeVenue.duration },
                                { icon: Users, label: `Max ${activeVenue.groupSize}` },
                                { icon: Check, label: `Age ${activeVenue.minAge}` },
                                { icon: Star, label: `${activeVenue.rating} Rating` }
                            ].map((stat, idx) => (
                                <div key={idx} className="p-8 border-r last:border-r-0 border-gray-100 flex flex-col items-center gap-2">
                                    <stat.icon className="w-5 h-5 text-[#C97C2F]" />
                                    <span className="text-[10px] font-black text-[#111827] uppercase tracking-widest text-center">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-xl font-bold text-[#111827] leading-relaxed uppercase tracking-tight">{activeVenue.longDesc}</p>
                    <div className="bg-white p-10 border border-gray-200 shadow-xl">
                        <h3 className="font-black text-2xl text-[#111827] mb-8 uppercase tracking-tighter">System Highlights</h3>
                        <div className="grid sm:grid-cols-2 gap-6">
                            {activeVenue.highlights.map((h: string, i: number) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-[#C97C2F]" />
                                    <span className="text-[#111827] font-black text-[11px] uppercase tracking-widest">{h}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:w-[450px] sticky top-28">
                    <div className="bg-[#111827] p-12 shadow-2xl">
                        <span className="text-[10px] font-black text-[#C97C2F] uppercase tracking-[0.4em] block mb-4">Starting Infrastructure Rate</span>
                        <div className="flex items-baseline gap-2 mb-10 border-b border-white/10 pb-10">
                            <span className="text-6xl font-black text-white tabular-nums tracking-tighter">{activeVenue.priceLabel || `$${activeVenue.price}`}</span>
                        </div>
                        <button onClick={() => setIsBookingOpen(true)} className="w-full h-20 bg-[#C97C2F] hover:bg-white hover:text-[#111827] text-white font-black text-xs uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-4">
                            Book Transfer <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      ) : activeCategory ? (
        /* CATEGORY VIEW */
        <div className="min-h-screen">
            <div className="relative h-[65vh] flex items-center justify-center bg-[#111827] overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center opacity-40 grayscale" style={{ backgroundImage: `url('${activeCategory.intro.image}')` }} />
                <div className="relative z-20 text-center max-w-5xl px-6">
                    <h1 className="text-6xl md:text-9xl font-black text-white mb-8 uppercase tracking-tighter leading-none">{activeCategory.intro.title}</h1>
                    <p className="text-xl text-white/60 font-bold uppercase tracking-tight max-w-3xl mx-auto leading-relaxed">{activeCategory.intro.desc}</p>
                </div>
            </div>
            <div className="max-w-[1600px] mx-auto px-10 py-32">
                <div className="grid grid-cols-1 md:grid-cols-3 border border-gray-200 bg-white shadow-2xl">
                    {activeCategory.venues.map((venue: any) => (
                        <div key={venue.id} onClick={() => handleOpenVenue(venue)} className="p-10 border-r border-b border-gray-100 hover:bg-[#111827] group transition-all duration-500 cursor-pointer flex flex-col h-full">
                            <div className="h-80 relative overflow-hidden mb-10 grayscale-0 group-hover:grayscale transition-all duration-700">
                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${venue.image}')` }} />
                                <div className="absolute top-0 left-0 bg-[#C97C2F] text-white px-5 py-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest">{venue.tag} </span>
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-[#111827] group-hover:text-white uppercase tracking-tighter mb-4 transition-colors">{venue.title}</h3>
                            <p className="text-[#111827]/50 group-hover:text-white/50 mb-10 text-xs font-bold uppercase tracking-tight leading-relaxed flex-grow line-clamp-2">{venue.desc}</p>
                            <div className="pt-8 border-t border-gray-100 group-hover:border-white/10 flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{venue.duration}</span>
                                <span className="text-2xl font-black text-[#111827] group-hover:text-white tabular-nums tracking-tighter">{venue.priceLabel || `$${venue.price}`}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      ) : (
        /* LANDING VIEW */
        <div>
            <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#111827]">
                <div className="absolute inset-0 bg-cover bg-center opacity-30 grayscale" style={{ backgroundImage: `url('${IMAGES.hero}')` }} />
                <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/80 via-transparent to-[#111827]" />
                
                <div className="relative z-20 container mx-auto px-10 grid lg:grid-cols-2 gap-20 items-start h-full pt-40">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-3 py-2 px-6 bg-[#C97C2F] text-white font-black text-[10px] uppercase tracking-[0.4em] mb-10 shadow-2xl">
                             Premium Mobility Infrastructure
                        </div>
                        <h1 className="text-7xl md:text-[9rem] font-black text-white mb-10 leading-[0.85] tracking-tighter uppercase drop-shadow-2xl">
                            Kigali <br/><span className="text-[#C97C2F]">Unscripted.</span>
                        </h1>
                        
                        {/* RE-STYLED TAGLINE AS SEPARATOR */}
                        <p className="text-xs font-bold text-white/30 uppercase tracking-[0.4em] mb-16 leading-relaxed max-w-2xl border-l border-[#C97C2F] pl-6">
                            Skip the "cookie-cutter" tours. From airport pickups to hidden spots, we provide professional transfers that double as local experiences.
                        </p>
                    </div>

                    {/* TOP RIGHT CORNER: QUOTE SLIDER */}
                    <div className="flex flex-col items-end">
                        <div className="flex gap-4 mb-12">
                            <a href="https://wa.me/250788845062" target="_blank" className="h-16 px-10 bg-[#C97C2F] hover:bg-white hover:text-[#111827] text-white font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-2xl flex items-center justify-center gap-3">
                                <Phone className="w-4 h-4" /> Book Transfer
                            </a>
                            <a href="mailto:Suraessenceltd@gmail.com" className="h-16 px-10 border-2 border-white/20 hover:bg-white hover:text-[#111827] text-white font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-3">
                                <Mail className="w-4 h-4" /> Send Inquiry
                            </a>
                        </div>
                        
                        <div className="relative max-w-lg text-right self-end min-h-[250px] p-0">
                           <AnimatePresence mode="wait">
                              <motion.div 
                                 key={quoteIndex}
                                 initial={{ opacity: 0, x: 10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 exit={{ opacity: 0, x: -10 }}
                                 transition={{ duration: 1 }}
                                 className="flex flex-col items-end"
                              >
                                 <Quote className="w-10 h-10 text-[#C97C2F] mb-6 ml-auto opacity-60" />
                                 {/* UPDATED READABLE FONT & SIZE */}
                                 <p className="text-xl font-bold text-white leading-tight mb-8 italic uppercase tracking-widest opacity-90 max-w-md">
                                     "{QUOTES[quoteIndex].text}"
                                 </p>
                                 <div className="flex flex-col items-end border-t border-white/10 pt-8 opacity-60">
                                     <p className="text-[#C97C2F] font-black text-2xl tracking-tighter mb-2">{QUOTES[quoteIndex].author}</p>
                                     <p className="text-white font-black text-[10px] uppercase tracking-[0.3em]">{QUOTES[quoteIndex].team}</p>
                                     <p className="text-white/40 text-[8px] uppercase tracking-[0.5em] mt-1">{QUOTES[quoteIndex].sub}</p>
                                 </div>
                              </motion.div>
                           </AnimatePresence>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative z-30 -mt-20 container mx-auto px-10 mb-4">
                <div className="bg-white shadow-2xl grid md:grid-cols-3 border border-gray-200">
                    {[
                        { icon: Plane, title: "Airport Meet & Greet", desc: "Flight monitoring & gate pickup standard." },
                        { icon: Clock, title: "Hourly Chauffeur", desc: "Flexible private car bookings." },
                        { icon: Wallet, title: "Transparent Pricing", desc: "Fixed rates, no surprises." }
                    ].map((feature, idx) => (
                        <div key={idx} className="p-12 border-r last:border-r-0 border-gray-100 flex items-start gap-8 hover:bg-[#F5F2EA] transition-all group">
                            <div className="w-16 h-16 bg-[#111827] group-hover:bg-[#C97C2F] rounded-none flex items-center justify-center text-[#C97C2F] group-hover:text-white shrink-0 transition-colors shadow-xl">
                                <feature.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="font-black text-[#111827] text-xl uppercase tracking-tighter mb-2">{feature.title}</h4>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            
            <section id="collections-section" className="px-10 max-w-[1600px] mx-auto pb-40 space-y-40">
                {COLLECTIONS.map((dest, i) => (
                    <div key={dest.id} id={dest.id} className="relative scroll-mt-32">
                        <div className="flex justify-between items-end mb-20">
                            <div className="max-w-4xl">
                                <div className="flex items-center gap-6 mb-8">
                                    <span className="text-8xl font-black text-[#111827]/5 select-none tracking-tighter">0{i + 1}</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C97C2F] px-5 py-2 bg-[#111827] shadow-xl">{dest.category}</span>
                                </div>
                                <h2 className="text-6xl md:text-[6rem] font-black text-[#111827] mb-8 uppercase tracking-tighter leading-none">{dest.intro.title}</h2>
                                <p className="text-2xl font-bold text-[#111827]/30 uppercase tracking-tight leading-relaxed">{dest.intro.desc}</p>
                            </div>
                            <button onClick={() => handleOpenCategory(dest)} className="text-[#111827] font-black text-[11px] uppercase tracking-[0.5em] flex items-center gap-6 hover:text-[#C97C2F] transition-colors group">
                                Expand  <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 border border-gray-200 bg-white shadow-2xl">
                            {dest.venues.map((venue) => (
                                <div key={venue.id} onClick={() => handleOpenVenue(venue)} className="p-10 border-r border-b border-gray-100 hover:bg-[#111827] group transition-all duration-500 cursor-pointer flex flex-col h-full">
                                    <div className="h-80 relative overflow-hidden mb-10 grayscale-0 group-hover:grayscale transition-all duration-700">
                                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${venue.image}')` }} />
                                        <div className="absolute top-0 left-0 bg-[#C97C2F] text-white px-5 py-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest">{venue.tag} SOP</span>
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-black text-[#111827] group-hover:text-white uppercase tracking-tighter mb-4 transition-colors leading-none">{venue.title}</h3>
                                    <p className="text-gray-400 group-hover:text-white/50 mb-10 text-xs font-bold uppercase tracking-tight flex-grow line-clamp-2">{venue.desc}</p>
                                    <div className="pt-8 border-t border-gray-100 group-hover:border-white/10 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{venue.duration}</span>
                                        <span className="text-2xl font-black text-[#111827] group-hover:text-white tabular-nums tracking-tighter">{venue.priceLabel || `$${venue.price}`}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </section>
        </div>
      )}

      <AnimatePresence>
        {showTopBtn && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={scrollToTop} className="fixed bottom-10 right-10 z-50 w-16 h-16 bg-[#111827] text-white rounded-none shadow-2xl flex items-center justify-center hover:bg-[#C97C2F] transition-all group border border-white/10">
                <ArrowUp className="w-7 h-7 group-hover:-translate-y-2 transition-transform" />
            </motion.button>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}

export default function ToursPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111827] flex items-center justify-center text-white font-black uppercase tracking-[0.5em]">Initializing ...</div>}>
      <ToursContent />
    </Suspense>
  );
}