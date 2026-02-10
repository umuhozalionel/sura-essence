"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "City Experiences", href: "/tours" },
    { name: "Inter-City Transfers", href: "/transfers" },
    { name: "Private Driver", href: "/driver" }, // Renamed from Chauffeur
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md py-3 shadow-sm" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8">
        
        <Link href="/" className="flex items-center gap-2 group">
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              scrolled ? "bg-[#c97c2f]" : "bg-white"
            }`}
          >
            <span className={`font-bold text-lg ${scrolled ? "text-white" : "text-[#c97c2f]"}`}>IM</span>
          </div>
          <span className={`text-xl font-bold tracking-tight ${scrolled ? "text-slate-900" : "text-white"}`}>
            SURA
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              href={link.href} 
              className={`text-sm font-medium transition-colors hover:text-[#c97c2f] ${
                scrolled ? "text-slate-600" : "text-white/90"
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          <a 
            href="https://wa.me/250788845062" 
            target="_blank"
            className={`text-sm font-bold transition-colors ${
              scrolled ? "text-slate-900" : "text-white"
            }`}
          >
            WhatsApp Us
          </a>

          <Button 
            asChild 
            className="rounded-full px-6 font-bold hover:opacity-90 transition-opacity"
            style={{ 
              backgroundColor: scrolled ? "#c97c2f" : "white",
              color: scrolled ? "white" : "#c97c2f"
            }}
          >
             <Link href="/book">Book a Ride</Link>
          </Button>
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className={`md:hidden p-2 rounded-full ${scrolled ? "bg-slate-100 text-black" : "bg-white/20 text-white"}`}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 p-6 shadow-xl flex flex-col gap-6 md:hidden h-screen animate-in slide-in-from-top-5">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              href={link.href} 
              onClick={() => setOpen(false)} 
              className="text-xl font-medium text-slate-800 hover:text-[#c97c2f] transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <div className="h-px bg-gray-100 my-2" />
          <a href="https://wa.me/250788845062" className="text-xl font-bold text-slate-900">WhatsApp Us</a>
          <Link href="/book" onClick={() => setOpen(false)} className="text-xl font-bold text-[#c97c2f]">Book Now</Link>
        </div>
      )}
    </header>
  );
}