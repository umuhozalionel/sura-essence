"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

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
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "bg-[#111827]/95 backdrop-blur-md py-4 shadow-xl border-b border-white/5" // Scrolled
          : "bg-gradient-to-b from-black/90 via-black/60 to-transparent py-6" // Top: The "Scrim"
      }`}
    >
      {/* FULL WIDTH CONTAINER: No max-width, pushing items to extremities */}
      <div className="w-full px-4 md:px-8 flex items-center justify-between relative">

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

        {/* 2. ABSOLUTE CENTER: NAVIGATION LINKS */}
        <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-10 z-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-[15px] font-medium tracking-wide transition-all duration-300 hover:text-[#C97C2F] relative group ${
                pathname === link.href ? "text-[#C97C2F]" : "text-white"
              }`}
            >
              {link.name}
              {/* Hover Underline Animation */}
              <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-[#C97C2F] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* 3. RIGHT EXTREMITY: ACTIONS (WhatsApp + Book Button) */}
        <div className="hidden md:flex items-center gap-6 z-20">
          
          {/* WhatsApp Action */}
          <a
            href="https://wa.me/250788845062"
            target="_blank"
            className="group flex items-center gap-2 text-white hover:text-[#C97C2F] transition-colors"
          >
            <div className="p-2 rounded-full bg-white/10 group-hover:bg-[#C97C2F] group-hover:text-white transition-colors backdrop-blur-sm">
               <MessageCircle size={20} className="fill-current" />
            </div>
            <span className="text-sm font-bold hidden xl:block">WhatsApp</span>
          </a>

          {/* BOOK BUTTON: Molten Copper */}
          <Link href="/book">
            <div className="relative group px-8 h-12 rounded-full bg-gradient-to-r from-[#C97C2F] to-[#A05D1C] flex items-center justify-center shadow-lg shadow-[#C97C2F]/20 overflow-hidden transition-transform hover:scale-105 border border-white/10">
               {/* Shine Effect */}
               <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[30deg] group-hover:animate-shine" />
               <span className="text-white text-sm font-bold tracking-widest uppercase">Book Now</span>
            </div>
          </Link>
        </div>

        {/* MOBILE MENU TOGGLE (Visible only on mobile) */}
        <div className="flex md:hidden items-center gap-4 z-20">
            <Link href="/book">
                <Button size="sm" className="bg-[#C97C2F] text-white rounded-full text-xs font-bold h-9">
                    Book
                </Button>
            </Link>
            <button
            onClick={() => setOpen(!open)}
            className="p-2 text-white bg-white/10 rounded-full backdrop-blur-md"
            >
            {open ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN (Dark Theme) */}
      {open && (
        <div className="fixed inset-0 bg-[#111827] z-[60] flex flex-col p-8 animate-in slide-in-from-top-10">
           <div className="flex justify-between items-center mb-12">
              <div className="relative h-10 w-32">
                 <Image src="/brand/sura-logo.png" alt="SURA" fill className="object-contain brightness-0 invert object-left" />
              </div>
              <button onClick={() => setOpen(false)} className="p-2 bg-white/10 rounded-full text-white"><X size={28} /></button>
           </div>

           <div className="flex flex-col gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-3xl font-bold text-white hover:text-[#C97C2F] transition-colors"
              >
                {link.name}
              </Link>
            ))}
           </div>

           <div className="mt-auto flex flex-col gap-6">
             <a href="https://wa.me/250788845062" className="flex items-center gap-4 text-white font-bold text-lg p-4 bg-white/5 rounded-2xl border border-white/10">
                <MessageCircle className="text-[#C97C2F]" size={24} /> 
                <span>WhatsApp Support</span>
             </a>
             <Link href="/book" onClick={() => setOpen(false)}>
               <Button className="w-full h-16 text-xl font-bold bg-gradient-to-r from-[#C97C2F] to-[#A05D1C] hover:bg-[#A05D1C] rounded-full text-white shadow-xl shadow-orange-900/20">
                 Book Your Ride
               </Button>
             </Link>
           </div>
        </div>
      )}
    </header>
  );
}