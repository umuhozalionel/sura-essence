"use client";

import Link from "next/link";
import Image from "next/image";
import { Manrope } from "next/font/google";
import { Menu, X, MessageCircle, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

// 1. CONFIGURE FONT
const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "600", "700", "800"],
  variable: "--font-manrope"
});

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Handle Scroll State
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "City Experiences", href: "/tours" }, 
    { name: "Inter-City Transfers", href: "/transfers" },
    { name: "Private Driver", href: "/driver" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${manrope.className} ${
        scrolled
          ? "bg-[#111827]/95 backdrop-blur-xl py-4 shadow-2xl border-b border-white/5" // Scrolled
          : "bg-gradient-to-b from-[#111827] via-[#111827]/60 to-transparent py-6" // Top Scrim
      }`}
    >
      {/* FULL WIDTH CONTAINER */}
      <div className="w-full px-6 md:px-10 flex items-center justify-between relative">

        {/* 1. LEFT EXTREMITY: LOGO */}
        <div className="flex-shrink-0 z-20">
          <Link href="/" className="relative h-10 w-40 block transition-opacity hover:opacity-80">
            <Image
              src="/brand/sura-logo.png"
              alt="SURA Essence"
              fill
              className="object-contain brightness-0 invert object-left" 
              priority
            />
          </Link>
        </div>

        {/* 2. ABSOLUTE CENTER: NAVIGATION LINKS (VISUALLY IMPROVED) */}
        <nav className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center z-10">
          {/* Glass Capsule Container */}
          <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md border border-white/10 px-2 py-2 rounded-xl shadow-lg">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 relative group overflow-hidden ${
                    isActive 
                      ? "text-[#111827] bg-white shadow-md" 
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="relative z-10">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* 3. RIGHT EXTREMITY: ACTIONS */}
        <div className="hidden md:flex items-center gap-4 z-20">
          
          {/* WhatsApp Action - Vintage Square */}
          <a
            href="https://wa.me/250788845062"
            target="_blank"
            className="group flex items-center gap-3 text-white hover:text-[#C97C2F] transition-colors pr-2"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#C97C2F] group-hover:border-[#C97C2F] group-hover:text-white transition-all duration-300">
               <MessageCircle size={18} className="fill-current" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest hidden xl:block">WhatsApp</span>
          </a>

          {/* BOOK BUTTON: Vintage Molten Copper */}
          <Link href="/book">
            <div className="relative group px-8 h-12 rounded-xl bg-gradient-to-br from-[#C97C2F] to-[#A05D1C] flex items-center justify-center shadow-lg shadow-[#C97C2F]/20 overflow-hidden transition-transform hover:scale-105 border border-white/10">
               {/* Shine Effect */}
               <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[30deg] group-hover:animate-shine" />
               <span className="text-white text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                 Book Now <ArrowRight className="w-3 h-3" />
               </span>
            </div>
          </Link>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <div className="flex lg:hidden items-center gap-4 z-20">
            <Link href="/book">
                <div className="bg-[#C97C2F] text-white rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide">
                    Book
                </div>
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="p-2.5 text-white bg-white/10 rounded-lg backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN (Vintage Dark Theme) */}
      {open && (
        <div className="fixed inset-0 bg-[#111827] z-[60] flex flex-col p-8 animate-in slide-in-from-top-10">
           <div className="flex justify-between items-center mb-16">
              <div className="relative h-8 w-32">
                 <Image src="/brand/sura-logo.png" alt="SURA" fill className="object-contain brightness-0 invert object-left" />
              </div>
              <button onClick={() => setOpen(false)} className="p-3 bg-white/5 rounded-xl text-white border border-white/10"><X size={24} /></button>
           </div>

           <div className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-3xl font-bold text-white hover:text-[#C97C2F] transition-colors uppercase tracking-tight flex items-center justify-between group border-b border-white/5 pb-6"
              >
                {link.name}
                <ArrowRight className="w-6 h-6 text-gray-700 group-hover:text-[#C97C2F] -rotate-45 group-hover:rotate-0 transition-transform" />
              </Link>
            ))}
           </div>

           <div className="mt-auto flex flex-col gap-6">
             <a href="https://wa.me/250788845062" className="flex items-center gap-4 text-white font-bold text-sm uppercase tracking-widest p-5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <MessageCircle className="text-[#C97C2F]" size={20} /> 
                <span>WhatsApp Support</span>
             </a>
             <Link href="/book" onClick={() => setOpen(false)}>
               <Button className="w-full h-16 text-lg font-bold bg-[#C97C2F] hover:bg-[#A05D1C] rounded-xl text-white shadow-xl uppercase tracking-widest">
                 Book Your Ride
               </Button>
             </Link>
           </div>
        </div>
      )}
    </header>
  );
}