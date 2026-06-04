"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Users,
  ChevronUp,
  Leaf,
  Landmark,
  Crown,
  SlidersHorizontal,
  Clock,
  ArrowRight,
  History,
  X,
  CheckCircle2,
  MessageCircle,
  Mail,
  Phone
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventStatus = "Limited Seats" | "Booking Open" | "Sold Out" | "Coming Soon";
type EventCategory = "Nature" | "Culture" | "Exclusive" | "All";

interface SuraEvent {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  endDate?: string;
  location: string;
  country: string;
  price: number;
  currency: string;
  status: EventStatus;
  category: Exclude<EventCategory, "All">;
  imageURL: string;
  seats?: number;
  duration: string;
  featured?: boolean;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const EVENTS_DATA: SuraEvent[] = [
  {
    id: "evt-001",
    title: "Nyungwe Forest Escape",
    subtitle: "Canopy Walk & Zipline Adventure",
    date: "2026-06-20",
    location: "Nyungwe Forest",
    country: "Rwanda",
    price: 100000,
    currency: "RWF",
    status: "Limited Seats",
    category: "Nature",
    imageURL: "/backrounds/aerial-view.jpg",
    seats: 15,
    duration: "Full Day (5:00 AM - 11:00 PM)",
    featured: true,
  },
  {
    id: "evt-002",
    title: "Akagera Big 5 Expedition",
    subtitle: "Premium Safari with Guided Game Drives",
    date: "2026-07-13",
    location: "Akagera National Park",
    country: "Rwanda",
    price: 250000,
    currency: "RWF",
    status: "Coming Soon",
    category: "Exclusive",
    imageURL: "/backrounds/akagera.jpg",
    duration: "2 Nights, 3 Days",
  },
  {
    id: "evt-003",
    title: "TBA",
    subtitle: "INFORMATION TO BE ANNOUNCED SOON",
    date: "2026-10-01",
    location: "Rwanda",
    country: "Rwanda",
    price: 0,
    currency: "RWF",
    status: "Coming Soon",
    category: "Culture",
    imageURL: "/backrounds/car-free-day.jpg",
    duration: "TBA",
  },
  {
    id: "evt-004",
    title: "TBA",
    subtitle: "INFORMATION TO BE ANNOUNCED SOON",
    date: "2026-11-15",
    location: "Rwanda",
    country: "Rwanda",
    price: 0,
    currency: "RWF",
    status: "Coming Soon",
    category: "Nature",
    imageURL: "/backrounds/bisoke.jpg",
    duration: "TBA",
  },
  {
    id: "evt-005",
    title: "TBA",
    subtitle: "INFORMATION TO BE ANNOUNCED SOON",
    date: "2026-12-05",
    location: "Rwanda",
    country: "Rwanda",
    price: 0,
    currency: "RWF",
    status: "Coming Soon",
    category: "Exclusive",
    imageURL: "/backrounds/sura-experience.jpg",
    duration: "TBA",
  },
];

// ─── Utility Components ───────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: EventStatus }) => {
  const styles = {
    "Limited Seats": "bg-[#C19A5B] text-[#0A1128] border-[#C19A5B]",
    "Booking Open": "bg-primary text-primary-foreground border-primary",
    "Sold Out": "bg-red-500 text-white border-red-500",
    "Coming Soon": "bg-gray-500 text-white border-gray-500",
  };

  return (
    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border shadow-lg rounded-sm ${styles[status]}`}>
      {status}
    </span>
  );
};

const formatDate = (dateString: string, endDateString?: string) => {
  const date = new Date(dateString);
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = date.getDate();

  if (endDateString) {
    const endDate = new Date(endDateString);
    const endDay = endDate.getDate();
    return `${month} ${day}-${endDay}`;
  }
  return `${month} ${day}`;
};

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function UpcomingEventsPage() {
  const [filter, setFilter] = useState<EventCategory>("All");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const filteredEvents = EVENTS_DATA.filter(
    (event) => filter === "All" || event.category === filter
  );

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (bookingModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [bookingModalOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-manrope selection:bg-secondary/30 selection:text-secondary-foreground relative">
      <Header />

      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="relative h-[75vh] min-h-[550px] flex items-center justify-center overflow-hidden bg-[#0A1128]">
        {/* Crisp clean asset view from nyungwe_sky.jpg */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-500 scale-100"
          style={{ backgroundImage: "url('/backrounds/nyungwe_sky.jpg')" }}
        />

        {/* Hero Content Panel */}
        <div className="relative z-10 text-center px-6 mt-16 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 bg-black/50 backdrop-blur-md rounded-sm mb-6 shadow-2xl">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-white tracking-[0.25em] uppercase">
                Explore Upcoming Events
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-6 drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
              Sura <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-[#e5c185] to-secondary drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                Experiences
              </span>
            </h1>

            <p className="text-white font-medium text-base md:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)] bg-black/30 p-4 rounded-sm backdrop-blur-sm">
              Discover Rwanda through our meticulously crafted journeys. From the dense canopy of Nyungwe to the serene waters of Kivu, experience mobility redefined.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Filter & Navigation Segment ───────────────────────────────────────── */}
      <div className="sticky top-[72px] z-40 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 hide-scrollbar">
            <SlidersHorizontal size={14} className="text-muted-foreground mr-2 shrink-0" />
            {(["All", "Nature", "Culture", "Exclusive"] as EventCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap rounded-sm transition-all duration-150 ${
                  filter === cat
                    ? "bg-secondary text-secondary-foreground shadow-md shadow-secondary/10"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Link
            href="/events/past"
            className="group flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <History size={14} className="group-hover:-rotate-45 transition-transform duration-200" />
            View Past Events
          </Link>
        </div>
      </div>

      {/* ── Event Display System ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-10 max-w-[1400px] mx-auto min-h-[45vh]">
        
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-sm">
            <p className="text-muted-foreground text-sm uppercase tracking-wider">No scheduled entries inside this track.</p>
            <button 
              onClick={() => setFilter("All")}
              className="mt-3 text-secondary hover:text-primary text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  key={event.id}
                  className="group flex flex-col bg-card border border-border hover:border-secondary/40 rounded-sm overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl"
                >
                  {/* Event Image without gradients */}
                  <div className="relative h-60 overflow-hidden bg-muted">
                    <div
                      className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-102 ${event.status === 'Coming Soon' ? 'opacity-50 grayscale' : 'opacity-100'}`}
                      style={{ backgroundImage: `url('${event.imageURL}')` }}
                    />
                    
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      <StatusBadge status={event.status} />
                      {event.featured && (
                        <span className="bg-primary text-primary-foreground px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-1 shadow-2xl">
                          <Crown size={10} /> Featured
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-4 left-4 flex flex-col">
                      <span className="text-3xl font-black text-white leading-none tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {event.status === "Coming Soon" ? "--" : formatDate(event.date, event.endDate).split(" ")[1]}
                      </span>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {event.status === "Coming Soon" ? "TBA" : formatDate(event.date, event.endDate).split(" ")[0]}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 p-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        {event.category === "Nature" && <Leaf size={12} className="text-primary" />}
                        {event.category === "Culture" && <Landmark size={12} className="text-secondary" />}
                        {event.category === "Exclusive" && <Crown size={12} className="text-purple-500" />}
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {event.category}
                        </span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-card-foreground uppercase tracking-tight leading-tight mb-2 group-hover:text-secondary transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium line-clamp-2">
                        {event.subtitle}
                      </p>
                    </div>

                    <div className="mt-auto space-y-3 pb-6 border-b border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin size={14} className="text-secondary" />
                        <span className="truncate">{event.location}, {event.country}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={14} className="text-secondary" />
                        <span>{event.duration}</span>
                      </div>
                      {event.seats && event.status !== "Coming Soon" && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users size={14} className="text-secondary" />
                          <span>{event.seats} Spots Remaining</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-5 flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {event.status === "Coming Soon" ? "Pricing" : "Starting From"}
                        </span>
                        <span className="text-lg font-black text-card-foreground">
                          {event.price === 0 ? "TBA" : event.price.toLocaleString()} <span className="text-sm text-secondary">{event.price === 0 ? "" : event.currency}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {event.id === "evt-001" ? (
                           <button
                             onClick={() => setBookingModalOpen(true)}
                             className="h-10 px-6 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors bg-primary hover:bg-primary/90 text-primary-foreground"
                           >
                             Reserve
                           </button>
                        ) : (
                           <Link
                             href={event.status === "Sold Out" || event.status === "Coming Soon" ? "#" : `/book?event=${event.id}`}
                             className={`h-10 px-6 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors ${
                               event.status === "Sold Out" || event.status === "Coming Soon"
                                 ? "bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
                                 : "bg-primary hover:bg-primary/90 text-primary-foreground"
                             }`}
                           >
                             {event.status === "Sold Out" ? "Waitlist" : event.status === "Coming Soon" ? "Notify Me" : "Reserve"}
                           </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* ── Nyungwe Forest Escape Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {bookingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
             <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-card w-full max-w-5xl rounded-sm shadow-2xl flex flex-col lg:flex-row overflow-hidden max-h-full"
             >
                <button 
                  onClick={() => setBookingModalOpen(false)}
                  className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                >
                  <X size={20} />
                </button>

                {/* Left Side: Visual / Info Area */}
                <div className="lg:w-2/5 bg-primary relative overflow-hidden flex flex-col justify-between p-8 text-primary-foreground">
                   <div className="absolute inset-0 bg-[url('/backrounds/aerial-view.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay" />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128]/90 via-primary/80 to-primary/50" />
                   
                   <div className="relative z-10">
                      <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground text-[10px] font-black tracking-widest uppercase mb-4 shadow-lg rounded-sm">
                        Limited to 15 Spots Only
                      </span>
                      <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tight leading-[0.9] mb-4">
                        Nyungwe <br/> Forest Escape
                      </h2>
                      <p className="text-sm font-medium text-white/80 uppercase tracking-widest border-l-2 border-secondary pl-3">
                        Unforgettable one-day adventure to the south east of the country
                      </p>
                   </div>

                   <div className="relative z-10 mt-8 space-y-4 bg-black/20 p-5 rounded-sm backdrop-blur-sm border border-white/10">
                      <div className="flex items-center gap-3">
                         <Calendar className="text-secondary" size={20} />
                         <div>
                            <span className="block text-[10px] text-white/50 font-bold uppercase tracking-widest">Date</span>
                            <span className="font-bold text-sm">20th June 2026</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <Clock className="text-secondary" size={20} />
                         <div>
                            <span className="block text-[10px] text-white/50 font-bold uppercase tracking-widest">Time</span>
                            <span className="font-bold text-sm">5:00 AM Sharp</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <MapPin className="text-secondary" size={20} />
                         <div>
                            <span className="block text-[10px] text-white/50 font-bold uppercase tracking-widest">Pick Up</span>
                            <span className="font-bold text-sm">CHIC Building, Down Town (KN 02 Ave)</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Right Side: Pricing & Actions */}
                <div className="lg:w-3/5 p-6 lg:p-10 bg-background overflow-y-auto custom-scrollbar">
                   <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6 border-b border-border pb-2">
                     Investment Packages
                   </h3>

                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                      {/* EAC / Rwandans - POPULAR */}
                      <div className="bg-primary border border-primary p-4 rounded-sm text-center shadow-lg transform sm:-translate-y-2 relative">
                         <div className="absolute -top-2 inset-x-0 flex justify-center"><span className="bg-secondary text-secondary-foreground text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">Popular</span></div>
                         <span className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">EAC / Rwandans</span>
                         <span className="block text-3xl font-black text-white">100K <span className="text-sm">RWF</span></span>
                         <span className="block text-[9px] text-white/60 mt-2 uppercase">Rwandans and EAC Citizens</span>
                      </div>
                      {/* Resident Int'l */}
                      <div className="bg-muted border border-border p-4 rounded-sm text-center shadow-sm">
                         <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Resident Int'l</span>
                         <span className="block text-2xl font-black text-secondary">$140</span>
                         <span className="block text-[9px] text-muted-foreground mt-2 uppercase">Int'l Citizens Living in Rwanda</span>
                      </div>
                      {/* Non-Resident Int'l */}
                      <div className="bg-muted border border-border p-4 rounded-sm text-center shadow-sm">
                         <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Non-Resident Int'l</span>
                         <span className="block text-2xl font-black text-foreground">$220</span>
                         <span className="block text-[9px] text-muted-foreground mt-2 uppercase">All International Citizens</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                      <div>
                         <h4 className="text-[11px] font-bold bg-secondary text-secondary-foreground inline-block px-2 py-1 uppercase tracking-widest mb-4 rounded-sm">Our Package</h4>
                         <ul className="space-y-2">
                            {["Transport", "Park Entry", "Professional Tour Guiding", "Lunch & Breakfast", "Free WiFi"].map(item => (
                               <li key={item} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                  <CheckCircle2 size={14} className="text-secondary" /> {item}
                               </li>
                            ))}
                         </ul>
                      </div>
                      <div>
                         <h4 className="text-[11px] font-bold bg-primary text-primary-foreground inline-block px-2 py-1 uppercase tracking-widest mb-4 rounded-sm">Activities</h4>
                         <ul className="space-y-2">
                            {["Guided Waterfall & Hiking", "Canopy Walk & Zipline Experience", "Traditional King's Palace Museum", "Comfortable SUV 4x4 Round Trip"].map(item => (
                               <li key={item} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                  <CheckCircle2 size={14} className="text-secondary" /> {item}
                               </li>
                            ))}
                         </ul>
                      </div>
                   </div>

                   <div className="border-t border-border pt-6">
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4 text-center">Secure Your Spot</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                         <a 
                            href="https://wa.me/250788564000?text=Hello,%20I%20would%20like%20to%20reserve%20a%20spot%20for%20the%20Nyungwe%20Forest%20Escape." 
                            target="_blank" rel="noreferrer"
                            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm"
                         >
                            <MessageCircle size={16} /> WhatsApp
                         </a>
                         <a 
                            href="tel:+250788564000" 
                            className="flex items-center justify-center gap-2 bg-foreground hover:bg-primary text-background hover:text-primary-foreground px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm"
                         >
                            <Phone size={16} /> Call Us
                         </a>
                         <a 
                            href="mailto:suraessenceltd@gmail.com?subject=Booking:%20Nyungwe%20Forest%20Escape" 
                            className="flex items-center justify-center gap-2 bg-muted hover:bg-secondary hover:text-secondary-foreground border border-border text-foreground px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm"
                         >
                            <Mail size={16} /> Email
                         </a>
                      </div>
                   </div>

                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Contact Bridge Section ────────────────────────────────────────────── */}
      <section className="border-t border-border bg-gradient-to-b from-transparent to-muted/20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground leading-tight">
              Can't find what you're looking for?
            </h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-md">
              Every Sura experience can be crafted privately. Perfect for couples on honeymoon, intimate getaways, or corporate groups. Speak to a journey architect.
            </p>
          </div>
          <a 
            href="https://wa.me/250788564000?text=Hello,%20I%20would%20like%20to%20request%20a%20private%20bespoke%20journey."
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-secondary text-secondary-foreground text-xs font-bold tracking-widest uppercase px-7 py-3.5 rounded-sm hover:bg-secondary/90 transition-colors duration-200 shrink-0 shadow-sm"
          >
            Request Private Journey
            <ArrowRight size={14} />
          </a>
        </div>
      </section>

      <Footer />

      {/* ── Top-Retract Trigger ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-8 right-8 z-50 size-11 flex items-center justify-center bg-primary border border-secondary/20 text-primary-foreground hover:bg-secondary rounded-sm transition-colors shadow-xl"
          >
            <ChevronUp size={20} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}