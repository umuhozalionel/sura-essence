"use client";

import Link from "next/link";
import Image from "next/image";
import { Manrope } from "next/font/google";
import { Menu, X, MessageCircle, ChevronRight, AlertCircle, ChevronDown, Clock, CloudRain, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope"
});

const ALERTS = [
  { icon: "🔴", text: "Travel Advisory: Updated border protocols for regional transfers" },
  { icon: "✨", text: "The SURA Standard: Complimentary 5G Wi-Fi now active across all fleets" },
  { icon: "⏱️", text: "High Demand: Please reserve inter-city transfers 48 hours in advance" }
];

const API_KEY = "23f292fb66ec335896541f0b5e8b87bf"; 
const CITY = "Kigali";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(0);
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const pathname = usePathname();

  // Time & Weather State
  const [isMounted, setIsMounted] = useState(false);
  const [kigaliTime, setKigaliTime] = useState("");
  const [weatherStatus, setWeatherStatus] = useState<{ temp: number; condition: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Time Setup
    const updateTime = () => {
      setKigaliTime(new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Kigali', hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date()));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);

    // Weather Setup
    async function fetchLiveUpdates() {
      try {
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`);
        if (weatherRes.ok) {
           const weatherData = await weatherRes.json();
           setWeatherStatus({ temp: Math.round(weatherData.main.temp), condition: weatherData.weather[0].main });
        }
      } catch (e) { 
        setWeatherStatus({ temp: 24, condition: "Clear" }); 
      }
    }
    fetchLiveUpdates();
    const weatherTimer = setInterval(fetchLiveUpdates, 1800000);

    return () => {
      clearInterval(timer);
      clearInterval(weatherTimer);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAlert((prev) => (prev + 1) % ALERTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const megaMenus: Record<string, any> = {
    "Fleet & Transfers": [
      { name: "City Ride", href: "/tours", desc: "Urban transportation within Kigali" },
      { name: "Inter-City Transfers", href: "/transfers", desc: "Seamless travel between cities" },
      { name: "Car Rental", href: "/driver", desc: "Self-drive vehicle options" },
    ],
    "SURA Experiences": [
      { name: "Upcoming Events", href: "/events", desc: "Discover and join our next adventures" },
      { name: "Past Events", href: "/events/past", desc: "Explore memories from our previous trips" },
      { name: "Gallery", href: "/gallery", desc: "Visuals and highlights of our journeys" },
    ]
  };

  const navLinks = [
    { name: "Fleet & Transfers", type: "mega" },
    { name: "SURA Experiences", type: "mega" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <>
      {/* Alert & Intelligence Bar */}
      <div className="fixed top-0 left-0 w-full z-[60] bg-[#0a0e1a] text-white h-9 flex items-center border-b border-white/5 backdrop-blur-sm px-4 md:px-6">
        <div className="flex items-center justify-between w-full h-full max-w-[1600px] mx-auto">
          
          {/* Left Edge: Weather */}
          <div className="hidden sm:flex items-center gap-2 w-1/3">
            {isMounted && weatherStatus ? (
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                {weatherStatus.condition === 'Rain' ? <CloudRain size={12} className="text-blue-400" /> : <Sun size={12} className="text-[#C97C2F]" />}
                <span>{weatherStatus.temp}°C {CITY}</span>
              </div>
            ) : null}
          </div>

          {/* Center: Alerts */}
          <div className="flex items-center justify-center gap-3 w-full sm:w-1/3 relative overflow-hidden h-full">
            <AlertCircle className="w-3.5 h-3.5 text-[#C97C2F] shrink-0" strokeWidth={2} />
            
            <div className="relative w-full max-w-sm h-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentAlert}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide truncate text-gray-200">
                    <span className="mr-2">{ALERTS[currentAlert].icon}</span>
                    {ALERTS[currentAlert].text}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            <Link 
              href="/tripalerts" 
              className="hidden md:flex shrink-0 items-center gap-1 text-[10px] font-bold text-[#C97C2F] uppercase tracking-wide hover:text-white transition-colors group"
            >
              Details <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </Link>
          </div>

          {/* Right Edge: Time */}
          <div className="hidden sm:flex items-center justify-end gap-2 w-1/3">
            {isMounted ? (
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                <Clock size={12} className="text-[#C97C2F]" />
                <span>{kigaliTime} CAT</span>
              </div>
            ) : null}
          </div>

        </div>
      </div>

      {/* Main Header */}
      <header
        onMouseLeave={() => setActiveMega(null)}
        className={`fixed top-9 left-0 right-0 z-50 w-full transition-all duration-300 ${manrope.className} ${
          scrolled 
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200" 
            : "bg-white border-b border-gray-100"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between h-16 md:h-18">
          
          {/* Logo */}
          <div className="flex-shrink-0 z-20">
            <Link 
              href="/" 
              className="relative h-7 w-28 md:h-8 md:w-32 block transition-opacity hover:opacity-75 duration-300"
            >
              <Image
                src="/brand/sura-logo.png"
                alt="SURA Essence"
                fill
                className="object-contain object-left brightness-0" 
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-1 justify-center items-center z-10 px-4">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                if (link.type === "mega") {
                  return (
                    <button
                      key={link.name}
                      onMouseEnter={() => setActiveMega(link.name)}
                      className={`px-4 xl:px-5 py-2 text-[11px] font-bold uppercase tracking-wide transition-all duration-200 relative flex items-center gap-1.5 rounded-lg group ${
                        activeMega === link.name 
                          ? "text-[#C97C2F] bg-[#C97C2F]/5" 
                          : "text-gray-600 hover:text-[#0a0e1a] hover:bg-gray-50"
                      }`}
                    >
                      {link.name}
                      <ChevronDown 
                        className={`w-3.5 h-3.5 transition-transform ${
                          activeMega === link.name ? 'rotate-180' : ''
                        }`} 
                        strokeWidth={2.5}
                      />
                    </button>
                  );
                }
                return (
                  <Link
                    key={link.name}
                    href={link.href!}
                    className={`px-4 xl:px-5 py-2 text-[11px] font-bold uppercase tracking-wide transition-all duration-200 relative rounded-lg ${
                      pathname === link.href 
                        ? "text-[#C97C2F] bg-[#C97C2F]/5" 
                        : "text-gray-600 hover:text-[#0a0e1a] hover:bg-gray-50"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* WhatsApp CTA */}
          <div className="hidden lg:flex flex-shrink-0 items-center z-20">
            <a
              href="https://wa.me/250788845062"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#C97C2F] text-white hover:bg-[#b56d28] transition-all duration-300 hover:shadow-lg hover:shadow-[#C97C2F]/20"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={2} />
              <span className="text-[11px] font-bold uppercase tracking-wide">Chat with us</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center z-20">
            <button
              onClick={() => setOpen(!open)}
              className="p-2.5 rounded-lg border bg-gray-50 border-gray-200 text-[#0a0e1a] hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {open ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {activeMega && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-lg z-40 hidden lg:block"
            >
              <div className="max-w-[1400px] mx-auto px-10 py-8">
                <div className="grid grid-cols-12 gap-8">
                  {/* Menu Items */}
                  <div className="col-span-5">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">
                      {activeMega}
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {megaMenus[activeMega].map((sub: any) => (
                        <Link 
                          key={sub.name} 
                          href={sub.href}
                          onClick={() => setActiveMega(null)}
                          className="group flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-[#C97C2F]/30 hover:bg-[#C97C2F]/5 transition-all duration-200"
                        >
                          <ChevronRight 
                            className="w-4 h-4 text-[#C97C2F] mt-0.5 transition-transform group-hover:translate-x-1" 
                            strokeWidth={2.5}
                          />
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-[#0a0e1a] group-hover:text-[#C97C2F] transition-colors">
                              {sub.name}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              {sub.desc}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Featured Content */}
                  <div className="col-span-7 border-l border-gray-100 pl-8 flex items-center justify-center">
                    <div className="text-center max-w-md">
                      <p className="text-2xl font-bold text-gray-200 leading-tight mb-3">
                        Premium Mobility & Hospitality Standard
                      </p>
                      <p className="text-sm text-gray-400 font-medium">
                        Elevating your travel experience across Rwanda
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white z-[70] flex flex-col lg:hidden"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex justify-between items-center p-6 border-b border-gray-100"
            >
              <div className="relative h-7 w-28">
                <Image 
                  src="/brand/sura-logo.png" 
                  alt="SURA" 
                  fill 
                  className="object-contain object-left brightness-0" 
                />
              </div>
              <button 
                onClick={() => setOpen(false)} 
                className="p-2.5 bg-gray-50 rounded-lg text-[#0a0e1a] border border-gray-200 hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </motion.div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-6">
                {navLinks.map((link, idx) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + (idx * 0.1) }}
                  >
                    {link.type === "mega" ? (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {link.name}
                        </h3>
                        <div className="flex flex-col gap-3 pl-2">
                          {megaMenus[link.name].map((sub: any) => (
                            <Link 
                              key={sub.name} 
                              href={sub.href} 
                              onClick={() => setOpen(false)}
                              className="group flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-[#C97C2F] hover:bg-white transition-all active:scale-[0.98]"
                            >
                              <ChevronRight 
                                className="w-5 h-5 text-[#C97C2F] mt-0.5 transition-transform group-hover:translate-x-1" 
                                strokeWidth={2.5}
                              />
                              <div className="flex flex-col gap-1">
                                <span className="text-base font-bold text-[#0a0e1a]">
                                  {sub.name}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">
                                  {sub.desc}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link 
                        href={link.href!} 
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-[#C97C2F] hover:bg-white transition-all active:scale-[0.98] group"
                      >
                        <span className="text-lg font-bold text-[#0a0e1a]">
                          {link.name}
                        </span>
                        <ChevronRight 
                          className="w-5 h-5 text-[#C97C2F] transition-transform group-hover:translate-x-1" 
                          strokeWidth={2.5}
                        />
                      </Link>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mobile WhatsApp CTA */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="p-6 border-t border-gray-100 bg-gray-50/50"
            >
              <a
                href="https://wa.me/250788845062"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-lg bg-[#C97C2F] text-white font-bold text-sm uppercase tracking-wide shadow-lg shadow-[#C97C2F]/20 active:scale-[0.98] transition-transform"
              >
                <MessageCircle className="w-5 h-5" strokeWidth={2} />
                Chat with us on WhatsApp
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}