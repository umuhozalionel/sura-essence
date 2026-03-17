"use client";

import Link from "next/link";
import Image from "next/image";
import { Manrope } from "next/font/google";
import { Menu, X, MessageCircle, ChevronRight, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

const ALERTS = [
  "🔴 TRAVEL ADVISORY: UPDATED BORDER PROTOCOLS FOR REGIONAL TRANSFERS.",
  "✨ THE SURA STANDARD: COMPLIMENTARY 5G WI-FI NOW ACTIVE ACROSS ALL FLEETS.",
  "⏱️ HIGH DEMAND: PLEASE RESERVE INTER-CITY TRANSFERS 48 HOURS IN ADVANCE."
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(0);
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAlert((prev) => (prev + 1) % ALERTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const megaMenus: Record<string, any> = {
    "Fleet & Transfers": [
      { name: "City Ride", href: "/book" },
      { name: "Inter City Transfers", href: "/book" },
      { name: "Private Driver", href: "/book" },
      { name: "Car Rent", href: "/driver" },
    ],
    "SURA Experiences": [
      { name: "Kigali Tours & Activities", href: "/tours" },
      { name: "Outside Kigali Activities", href: "/transfers" },
    ]
  };

  const navLinks = [
    { name: "The Standard", href: "/about" },
    { name: "Fleet & Transfers", type: "mega" },
    { name: "SURA Experiences", type: "mega" },
    { name: "Contact Us", href: "/contact" },
  ];

  return (
    <>
      {/* LAYER 1: RESTORED EYEBROW BAR */}
      <div className="fixed top-0 left-0 w-full z-[60] bg-white text-[#111827] h-8 flex items-center justify-center border-b border-gray-200 px-4">
        <div className="flex items-center gap-4 max-w-7xl mx-auto w-full justify-center relative overflow-hidden h-full">
          <AlertCircle className="w-3.5 h-3.5 text-[#C97C2F] shrink-0" />
          <div className="relative w-full max-w-2xl h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentAlert}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] truncate">
                  {ALERTS[currentAlert]}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
          <Link href="/tripalerts" className="shrink-0 flex items-center gap-1 text-[9px] font-black text-[#C97C2F] uppercase tracking-[0.2em] hover:text-[#111827] transition-colors">
            Read More <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* LAYER 2: MAIN HEADER (RESTORED TRANSPARENT LOGIC & SLIM HEIGHT) */}
      <header
        onMouseLeave={() => setActiveMega(null)}
        className={`fixed top-8 left-0 right-0 z-50 w-full transition-all duration-300 ${manrope.className} py-2 md:py-3 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-transparent"
        }`}
      >
        <div className="w-full px-6 md:px-10 flex items-center justify-between">
          
          <div className="flex-shrink-0 z-20">
            <Link href="/" className="relative h-8 w-28 md:w-36 block transition-opacity hover:opacity-80">
              <Image
                src="/brand/sura-logo.png"
                alt="SURA Essence"
                fill
                className={`object-contain object-left transition-all ${!scrolled ? "brightness-0 invert" : ""}`} 
                priority
              />
            </Link>
          </div>

          <nav className="hidden lg:flex flex-1 justify-center items-center z-10 px-4">
            <div className="flex items-center xl:gap-2">
              {navLinks.map((link) => {
                if (link.type === "mega") {
                  return (
                    <button
                      key={link.name}
                      onMouseEnter={() => setActiveMega(link.name)}
                      className={`px-4 xl:px-5 py-2 rounded-none text-[9px] xl:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative flex items-center gap-1 ${
                        activeMega === link.name 
                          ? "text-[#C97C2F]" 
                          : scrolled ? "text-[#111827]/70 hover:text-[#111827]" : "text-white/90 hover:text-white"
                      }`}
                    >
                      {link.name}
                    </button>
                  );
                }
                return (
                  <Link
                    key={link.name}
                    href={link.href!}
                    className={`px-4 xl:px-5 py-2 rounded-none text-[9px] xl:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative group overflow-hidden whitespace-nowrap ${
                      pathname === link.href 
                        ? "text-[#C97C2F]" 
                        : scrolled ? "text-[#111827]/70 hover:text-[#111827]" : "text-white/90 hover:text-white"
                    }`}
                  >
                    <span className="relative z-10">{link.name}</span>
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C97C2F] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="hidden lg:flex flex-shrink-0 items-center z-20">
            <a
              href="https://wa.me/250788845062"
              target="_blank"
              className={`group flex items-center gap-4 transition-colors ${scrolled ? "text-[#111827] hover:text-[#C97C2F]" : "text-white hover:text-[#C97C2F]"}`}
            >
              <span className="text-[9px] xl:text-[10px] font-black uppercase tracking-[0.2em] text-right">Chat with us</span>
              <div className={`w-8 h-8 xl:w-10 xl:h-10 rounded-none border flex items-center justify-center transition-all duration-300 backdrop-blur-md group-hover:bg-[#C97C2F] group-hover:border-[#C97C2F] group-hover:text-white ${scrolled ? "bg-gray-50 border-gray-200" : "bg-white/10 border-white/20"}`}>
                 <MessageCircle size={16} className="fill-current" />
              </div>
            </a>
          </div>

          <div className="flex lg:hidden items-center z-20">
              <button
                onClick={() => setOpen(!open)}
                className={`p-2 rounded-none border backdrop-blur-md ${scrolled ? "text-[#111827] bg-gray-50 border-gray-200" : "text-white bg-white/10 border-white/20"}`}
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
          </div>
        </div>

        {/* RESTORED DESKTOP POP-UP CARD (MEGA MENU) */}
        <AnimatePresence>
          {activeMega && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 w-full bg-white border-b border-black/10 shadow-[0_20px_40px_rgba(0,0,0,0.1)] z-0 hidden lg:block"
            >
              <div className="max-w-[1450px] mx-auto px-10 py-12 grid grid-cols-4 gap-12">
                <div className="col-span-1">
                  <h4 className="text-[11px] font-black text-[#C97C2F] uppercase tracking-[0.3em] mb-6">{activeMega}</h4>
                  <div className="flex flex-col gap-4">
                    {megaMenus[activeMega].map((sub: any) => (
                      <Link 
                        key={sub.name} 
                        href={sub.href}
                        onClick={() => setActiveMega(null)}
                        className="group flex items-center gap-2 text-xs font-bold text-[#111827]/70 hover:text-[#C97C2F] transition-colors uppercase tracking-widest"
                      >
                        <ChevronRight className="w-3 h-3 text-[#C97C2F] opacity-0 group-hover:opacity-100 transition-all -ml-4 group-hover:ml-0" />
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="col-span-3 border-l border-black/5 pl-12 flex items-center">
                   <p className="text-3xl font-black text-[#111827] uppercase tracking-tighter max-w-md leading-none opacity-5 select-none">
                     Premium mobility and hospitality standard.
                   </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MOBILE MENU */}
        {open && (
          <div className="fixed inset-0 bg-white z-[60] flex flex-col p-8 animate-in fade-in duration-300">
             <div className="flex justify-between items-center mb-16 mt-6">
                <div className="relative h-8 w-32">
                   <Image src="/brand/sura-logo.png" alt="SURA" fill className="object-contain object-left" />
                </div>
                <button onClick={() => setOpen(false)} className="p-3 bg-gray-50 rounded-none text-[#111827] border border-gray-200">
                  <X size={24} />
                </button>
             </div>
             <div className="flex flex-col gap-6 overflow-y-auto">
              {navLinks.map((link) => (
                <div key={link.name}>
                  {link.type === "mega" ? (
                    <div className="space-y-4">
                      <span className="text-[10px] font-black text-[#C97C2F] uppercase tracking-widest">{link.name}</span>
                      <div className="pl-4 flex flex-col gap-4">
                        {megaMenus[link.name].map((sub: any) => (
                          <Link key={sub.name} href={sub.href} onClick={() => setOpen(false)} className="text-xl font-black text-[#111827] uppercase tracking-tighter">{sub.name}</Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link href={link.href!} onClick={() => setOpen(false)} className="text-3xl font-black text-[#111827] uppercase tracking-tighter border-b border-gray-100 pb-2 block">{link.name}</Link>
                  )}
                </div>
              ))}
             </div>
          </div>
        )}
      </header>
    </>
  );
}