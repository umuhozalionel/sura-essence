"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, ArrowRight, Car, Clock, Plane, Wallet, 
  MapPin, Check, Users, Calendar, Star, 
  Camera, HelpCircle, ChevronDown, Sparkles, Quote, ArrowUp, X, Phone, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

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
        longDesc: "Escape the city noise without leaving the city. Fazenda Sengha is an outdoor recreational center located on top of Mount Kigali. It offers a unique combination of adrenaline-pumping activities and serene picnic spots.",
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
        longDesc: "This is sacred ground. It serves as a place for survivors to remember their loved ones and for visitors to understand the magnitude of the 1994 Genocide against the Tutsi.",
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
        longDesc: "A heavier, deeply moving experience preserving the physical evidence of the tragedy inside the church itself.",
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
        longDesc: "If you want LIFE, you go here. We know the 'mamas' in the fabric section who give the best prices.",
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
        longDesc: "Known as the Kanombe Museum, this residence is key to understanding the events of April 1994.",
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
        longDesc: "A strategic military position in the past, now the best spot to view Kigali's rapid expansion.",
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
  
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingGuests, setBookingGuests] = useState("1");

  useEffect(() => {
    const catId = searchParams.get("category");
    const venueId = searchParams.get("venue");

    if (venueId) {
      let foundVenue = null;
      let foundCat = null;
      for (const col of COLLECTIONS) {
        const v = col.venues.find(v => v.id === venueId);
        if (v) {
          foundVenue = v;
          foundCat = col;
          break;
        }
      }
      if (foundVenue) {
        setActiveVenue(foundVenue);
        setActiveCategory(foundCat);
      }
    } else if (catId) {
      const foundCat = COLLECTIONS.find(c => c.id === catId);
      if (foundCat) {
        setActiveCategory(foundCat);
        setActiveVenue(null);
      }
    } else {
      setActiveCategory(null);
      setActiveVenue(null);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) setShowTopBtn(true);
      else setShowTopBtn(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const handleOpenCategory = (collection: any) => {
    updateUrl(collection.id, null);
    scrollToTop();
  };

  const handleOpenVenue = (venue: any) => {
    const parentCat = COLLECTIONS.find(c => c.venues.some(v => v.id === venue.id));
    updateUrl(parentCat?.id || null, venue.id);
    scrollToTop();
  };

  const handleBack = () => {
    if (activeVenue) {
      const parentCat = COLLECTIONS.find(c => c.venues.some(v => v.id === activeVenue.id));
      const venueId = activeVenue.id;
      
      if (parentCat) {
        updateUrl(parentCat.id, null);
        setTimeout(() => {
            const element = document.getElementById(`card-${venueId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
      } else {
        router.push("?");
      }
    } else if (activeCategory) {
      const catId = activeCategory.id;
      updateUrl(null, null); 
      
      setTimeout(() => {
        scrollToSection(catId);
      }, 100);
    }
  };

  const handleGalleryOpen = () => {
    setCurrentGalleryIndex(0);
    setIsGalleryOpen(true);
  }

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVenue) return;

    const phoneNumber = "250788845062"; 
    const message = `Hello, I would like to book a trip to *${activeVenue.title}*.%0A%0ADate: ${bookingDate}%0AGuests: ${bookingGuests}%0APrice: ${activeVenue.priceLabel || '$'+activeVenue.price}%0A%0APlease confirm availability.`;
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    setIsBookingOpen(false);
  };

  return (
    <main className="min-h-screen bg-white font-sans selection:bg-primary/20">
      <Header />

      <AnimatePresence>
        {(activeCategory || activeVenue) && (
            <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="fixed top-24 left-6 z-50"
            >
                <Button 
                    onClick={handleBack} 
                    className="rounded-full w-12 h-12 bg-white text-black hover:bg-black hover:text-white shadow-xl border border-gray-100 flex items-center justify-center p-0 transition-transform hover:scale-110"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {activeVenue ? (
          <motion.div 
            key="venue-detail"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white min-h-screen relative z-40"
          >
             <div className="container mx-auto px-6 py-12 pt-24 max-w-[1400px]">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[500px] mb-12 rounded-[2rem] overflow-hidden">
                    <div className="lg:col-span-8 bg-gray-100 relative group cursor-pointer h-full" onClick={handleGalleryOpen}>
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${activeVenue.gallery[0]}')` }} />
                        <div className="absolute bottom-6 left-6">
                            <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-bold shadow-sm">{activeVenue.tag}</span>
                        </div>
                    </div>
                    <div className="hidden lg:grid col-span-4 grid-rows-2 gap-4 h-full">
                        <div className="bg-gray-100 relative group h-full" onClick={handleGalleryOpen}>
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${activeVenue.gallery[1]}')` }} />
                        </div>
                        <div className="bg-black relative group cursor-pointer h-full flex items-center justify-center" onClick={handleGalleryOpen}>
                            <div className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${activeVenue.gallery[2]}')` }} />
                            <div className="relative z-10 flex flex-col items-center gap-2 text-white">
                                <Camera className="w-8 h-8" />
                                <span className="font-bold border-b border-white/50 pb-1">View Gallery</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-16 items-start">
                    
                    <div className="flex-1 space-y-10">
                        <div>
                            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-3">
                                <MapPin className="w-4 h-4" /> {activeVenue.location}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-black mb-6">{activeVenue.title}</h1>
                            
                            <div className="flex flex-wrap gap-4 md:gap-8 text-sm font-medium text-gray-600 border-y border-gray-100 py-6">
                                <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-gray-400" /> {activeVenue.duration}</div>
                                <div className="flex items-center gap-2"><Users className="w-5 h-5 text-gray-400" /> Max: {activeVenue.groupSize}</div>
                                <div className="flex items-center gap-2"><Check className="w-5 h-5 text-gray-400" /> Age: {activeVenue.minAge}</div>
                                <div className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> {activeVenue.rating} Rating</div>
                            </div>
                        </div>

                        <div className="prose prose-lg text-gray-600 leading-loose max-w-none">
                            <p>{activeVenue.longDesc}</p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                            <h3 className="font-bold text-xl text-black mb-6">Experience Highlights</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {activeVenue.highlights.map((h: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className="text-gray-700 font-medium">{h}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8">
                            <div className="flex border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
                                {['Itinerary', 'FAQ', 'Reviews'].map((tab) => (
                                    <button 
                                        key={tab}
                                        onClick={() => setActiveTab(tab.toLowerCase())}
                                        className={`px-8 py-4 font-bold text-sm uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'border-primary text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="min-h-[200px]">
                                {activeTab === 'itinerary' && (
                                    <div className="space-y-8 relative pl-4 border-l border-gray-100 ml-4">
                                        {activeVenue.itinerary?.map((item: any, i: number) => (
                                            <div key={i} className="relative pl-8">
                                                <div className="absolute -left-[21px] top-1 w-10 h-10 rounded-full bg-white border-4 border-gray-50 shadow-sm flex items-center justify-center z-10">
                                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.time}</span>
                                                    <h4 className="font-bold text-lg text-black mt-1">{item.title}</h4>
                                                    <p className="text-gray-600 mt-2">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {activeTab === 'faq' && (
                                    <div className="space-y-4">
                                        {activeVenue.faqs?.map((faq: any, i: number) => (
                                            <div key={i} className="border border-gray-100 rounded-xl p-6 hover:border-gray-200 transition-colors bg-white">
                                                <h4 className="font-bold text-black flex items-center gap-3 text-sm"><HelpCircle className="w-4 h-4 text-primary" /> {faq.q}</h4>
                                                <p className="text-gray-600 mt-3 ml-7 text-sm leading-relaxed">{faq.a}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {activeTab === 'reviews' && (
                                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                                        <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 mx-auto mb-4" />
                                        <h3 className="font-bold text-2xl text-black">{activeVenue.rating} Excellent</h3>
                                        <p className="text-gray-500 mt-2">Based on {activeVenue.reviews} verified reviews from real travelers.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-[400px]">
                        <div className="sticky top-28">
                            <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-gray-100">
                                <div className="flex justify-between items-baseline mb-8 border-b border-gray-100 pb-6">
                                    <div>
                                        <span className="text-sm text-gray-400 font-medium">Starting from</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-black">
                                                {activeVenue.priceLabel ? activeVenue.priceLabel : `$${activeVenue.price}`}
                                            </span>
                                            {!activeVenue.priceLabel && <span className="text-gray-400 font-medium">/ person</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                                            <Check className="w-4 h-4 text-green-500" /> Best Price Guarantee
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Check className="w-4 h-4 text-green-500" /> Instant Confirmation
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        onClick={() => setIsBookingOpen(true)}
                                        size="lg" 
                                        className="w-full h-14 text-lg font-bold bg-black text-white hover:bg-primary rounded-xl shadow-lg transition-all hover:scale-[1.02]"
                                    >
                                        Proceed to Book
                                    </Button>
                                    <p className="text-center text-xs text-gray-400 font-medium">No charge until confirmation</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
          </motion.div>

        ) : activeCategory ? (

          <motion.div 
            key="category-page"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white min-h-screen relative z-40"
          >
             <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${activeCategory.intro.image}')` }} />
                <div className="relative z-20 text-center max-w-4xl px-6">
                    <span className="text-primary font-bold uppercase tracking-widest text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-md mb-6 inline-block">
                        Collection
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black text-white mb-6 drop-shadow-2xl">{activeCategory.intro.title}</h1>
                    <p className="text-xl text-gray-200">{activeCategory.intro.desc}</p>
                </div>
             </div>

             <div className="container mx-auto px-6 py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {activeCategory.venues.map((venue: any) => (
                        <motion.div 
                            key={venue.id}
                            id={`card-${venue.id}`}
                            whileHover={{ y: -10 }}
                            onClick={() => handleOpenVenue(venue)}
                            className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-300 group"
                        >
                            <div className="h-72 bg-gray-100 relative overflow-hidden">
                                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url('${venue.image}')` }} />
                                <div className="absolute top-4 left-4">
                                    <span className="bg-white/90 backdrop-blur text-black px-3 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wide">
                                        {venue.tag}
                                    </span>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
                                    <div className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        Explore <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-8">
                                <h3 className="text-2xl font-bold text-black mb-2 group-hover:text-primary transition-colors">{venue.title}</h3>
                                <p className="text-gray-500 line-clamp-2 mb-6">{venue.desc}</p>
                                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase">
                                        <Clock className="w-3.5 h-3.5" /> {venue.duration}
                                    </div>
                                    <span className="block text-lg font-black text-black">
                                        {venue.priceLabel ? venue.priceLabel : `$${venue.price}`}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
             </div>
          </motion.div>

        ) : (

          <motion.div 
            key="landing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-white/5 z-10" />
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${IMAGES.hero}')` }} />
                
                <div className="relative z-20 container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center h-full">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary font-bold text-xs uppercase tracking-widest mb-6">
                            <Sparkles className="w-3 h-3" /> Premium City Experiences
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight drop-shadow-2xl">
                            Kigali <br/><span className="text-primary">Unscripted.</span>
                        </h1>
                        <p className="text-lg text-gray-200 mb-8 leading-relaxed font-medium max-w-lg">
                            Skip the "cookie-cutter" tours. From airport pickups to hidden sunset spots, we provide professional transfers that double as local experiences.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Button 
                                onClick={() => scrollToSection('booking-section')}
                                size="lg" 
                                className="rounded-full bg-white text-black hover:bg-primary hover:text-white font-bold px-8 h-14 transition-colors"
                            >
                                Book a Transfer
                            </Button>
                            <Button 
                                onClick={() => scrollToSection('collections-section')}
                                variant="outline" 
                                size="lg" 
                                className="rounded-full border-white text-white hover:bg-white hover:text-black font-bold px-8 h-14 bg-transparent transition-colors"
                            >
                                View Routes
                            </Button>
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[2.5rem] shadow-2xl relative transform rotate-1 hover:rotate-0 transition-transform duration-500">
                            <Quote className="w-10 h-10 text-primary mb-6 opacity-80" />
                            <p className="text-2xl font-medium text-white leading-relaxed mb-8 italic">
                                "Today, the city pulses with art galleries, rooftop lounges, and a history that is both heartbreaking and inspiring."
                            </p>
                            <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">IK</div>
                                <div>
                                    <p className="text-white font-bold text-sm">The SURA Team</p>
                                    <p className="text-primary/80 text-xs uppercase tracking-wider">Your Local Guides</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative z-30 -mt-12 container mx-auto px-6 mb-32">
                <div className="bg-white shadow-2xl rounded-3xl p-6 md:p-10 grid md:grid-cols-3 gap-8 border border-gray-100">
                    <div className="flex items-start gap-5">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-primary"><Plane className="w-6 h-6" /></div>
                        <div><h4 className="font-bold text-black text-lg">Airport Meet & Greet</h4><p className="text-sm text-gray-500 mt-1 leading-relaxed">Flight monitoring & gate pickup standard.</p></div>
                    </div>
                    <div className="flex items-start gap-5 border-x border-gray-100 px-8">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-primary"><Clock className="w-6 h-6" /></div>
                        <div><h4 className="font-bold text-black text-lg">Hourly Chauffeur</h4><p className="text-sm text-gray-500 mt-1 leading-relaxed">Flexible private car bookings.</p></div>
                    </div>
                    <div className="flex items-start gap-5">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-primary"><Wallet className="w-6 h-6" /></div>
                        <div><h4 className="font-bold text-black text-lg">Transparent Pricing</h4><p className="text-sm text-gray-500 mt-1 leading-relaxed">Fixed rates, no surprises.</p></div>
                    </div>
                </div>
            </section>

            <section id="collections-section" className="px-6 max-w-[1600px] mx-auto pb-32 space-y-40">
                {COLLECTIONS.map((dest, i) => (
                    <div key={dest.id} id={dest.id} className="relative scroll-mt-32">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="text-6xl font-black text-gray-100 select-none">0{i + 1}</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 bg-primary/5 rounded-full border border-primary/10">{dest.category}</span>
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black text-black mb-4">{dest.intro.title}</h2>
                                <p className="text-lg text-gray-500">{dest.intro.desc}</p>
                            </div>
                            <Button 
                                onClick={() => handleOpenCategory(dest)}
                                variant="ghost" 
                                className="hidden md:flex group text-black font-bold"
                            >
                                See all in {dest.category} <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {dest.venues.map((venue) => (
                                <motion.div 
                                    key={venue.id}
                                    id={`card-${venue.id}`}
                                    whileHover={{ y: -10 }}
                                    onClick={() => handleOpenVenue(venue)}
                                    className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-300 group"
                                >
                                    <div className="h-64 bg-gray-100 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url('${venue.image}')` }} />
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-white/90 backdrop-blur text-black px-3 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wide">
                                                {venue.tag}
                                            </span>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
                                            <div className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                Explore <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-8">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-black mb-1 group-hover:text-primary transition-colors">{venue.title}</h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <MapPin className="w-3 h-3" /> {venue.location}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-lg font-black text-black">
                                                    {venue.priceLabel ? venue.priceLabel : `$${venue.price}`}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-6 leading-relaxed">
                                            {venue.desc}
                                        </p>

                                        <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" /> {venue.duration}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> {venue.rating}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            <section id="booking-section" className="py-24 bg-black text-white px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-6xl font-black mb-6">Ready to Ride?</h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                        Whether you need a quick airport transfer or a full-day city exploration, 
                        our team is ready to coordinate your logistics.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="h-14 px-8 rounded-full bg-primary text-black hover:bg-white font-bold text-lg">
                            <Phone className="w-5 h-5 mr-2" /> Book via WhatsApp
                        </Button>
                        <Button size="lg" className="h-14 px-8 rounded-full bg-white text-black hover:bg-gray-200 font-bold text-lg border-none">
                            <Mail className="w-5 h-5 mr-2" /> Request Quote
                        </Button>
                    </div>
                </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTopBtn && (
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={scrollToTop}
                className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-primary transition-colors group"
            >
                <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
            </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBookingOpen && activeVenue && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsBookingOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                    className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="bg-black p-6 text-white flex justify-between items-center">
                        <h3 className="font-bold text-lg">Confirm Booking</h3>
                        <button onClick={() => setIsBookingOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url('${activeVenue.image}')` }} />
                            <div>
                                <h4 className="font-bold text-black">{activeVenue.title}</h4>
                                <p className="text-sm text-gray-500">{activeVenue.priceLabel || `$${activeVenue.price}`}</p>
                            </div>
                        </div>
                        <form onSubmit={handleBookingSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Travel Date</label>
                                <input required type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Number of Guests</label>
                                <input required type="number" min="1" value={bookingGuests} onChange={(e) => setBookingGuests(e.target.value)} className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <Button type="submit" size="lg" className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl mt-4">
                                Confirm via WhatsApp
                            </Button>
                        </form>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGalleryOpen && activeVenue && (
            <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center p-4">
                <button onClick={() => setIsGalleryOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white p-2">
                    <X className="w-8 h-8" />
                </button>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-5xl aspect-video rounded-xl overflow-hidden relative"
                >
                    <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url('${activeVenue.gallery[currentGalleryIndex]}')` }} />
                </motion.div>

                <div className="flex gap-4 mt-8 overflow-x-auto max-w-full pb-4">
                    {activeVenue.gallery.map((img: string, i: number) => (
                        <button 
                            key={i} 
                            onClick={() => setCurrentGalleryIndex(i)}
                            className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${i === currentGalleryIndex ? 'border-primary scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        >
                            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${img}')` }} />
                        </button>
                    ))}
                </div>
            </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}

export default function ToursPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ToursContent />
    </Suspense>
  );
}