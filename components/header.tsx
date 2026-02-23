"use client";

import Link from "next/link";
import Image from "next/image";
import { Manrope } from "next/font/google";
import { Menu, X, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "About Us", href: "/about" },
    { name: "City Experiences", href: "/tours" }, 
    { name: "Inter-City Transfers", href: "/transfers" },
    { name: "Private Driver", href: "/driver" },
    { name: "Contact Us", href: "/contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${manrope.className} bg-[#F5F2EA] border-b border-black/5 py-4 md:py-5`}
    >
      <div className="w-full px-6 md:px-10 flex items-center justify-between">

        {/* 1. LEFT: BLACK LOGO */}
        <div className="flex-shrink-0 z-20">
          <Link href="/" className="relative h-10 w-32 md:w-40 block transition-opacity hover:opacity-80">
            <Image
              src="/brand/sura-logo.png"
              alt="SURA Essence"
              fill
              className="object-contain brightness-0 object-left" 
              priority
            />
          </Link>
        </div>

        {/* 2. CENTER: NAVIGATION (FIXED SCALING: Removed absolute positioning, used flex-1) */}
        <nav className="hidden lg:flex flex-1 justify-center items-center z-10 px-4">
          <div className="flex items-center xl:gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 xl:px-5 py-2.5 rounded-none text-[9px] xl:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative group overflow-hidden whitespace-nowrap ${
                    isActive 
                      ? "text-white bg-[#C97C2F]" 
                      : "text-[#111827]/60 hover:text-[#111827]"
                  }`}
                >
                  <span className="relative z-10">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* 3. RIGHT: CHAT WITH US */}
        <div className="hidden lg:flex flex-shrink-0 items-center z-20">
          <a
            href="https://wa.me/250788845062"
            target="_blank"
            className="group flex items-center gap-4 text-[#111827] hover:text-[#C97C2F] transition-colors"
          >
            <span className="text-[9px] xl:text-[10px] font-black uppercase tracking-[0.2em] text-right">Chat with us</span>
            <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-none bg-black/5 border border-black/5 flex items-center justify-center group-hover:bg-[#C97C2F] group-hover:text-white transition-all duration-300">
               <MessageCircle size={18} className="fill-current" />
            </div>
          </a>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <div className="flex lg:hidden items-center z-20">
            <button
              onClick={() => setOpen(!open)}
              className="p-3 text-[#111827] bg-black/5 rounded-none border border-black/5"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="fixed inset-0 bg-[#F5F2EA] z-[60] flex flex-col p-8 animate-in fade-in duration-300">
           <div className="flex justify-between items-center mb-16">
              <div className="relative h-8 w-32">
                 <Image src="/brand/sura-logo.png" alt="SURA" fill className="object-contain brightness-0 object-left" />
              </div>
              <button onClick={() => setOpen(false)} className="p-4 bg-black/5 rounded-none text-[#111827] border border-black/5">
                <X size={24} />
              </button>
           </div>

           <div className="flex flex-col gap-8 overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-3xl md:text-4xl font-black text-[#111827] hover:text-[#C97C2F] transition-colors uppercase tracking-tighter border-b border-black/5 pb-6"
              >
                {link.name}
              </Link>
            ))}
           </div>

           <div className="mt-auto pt-8">
             <a href="https://wa.me/250788845062" className="flex items-center justify-between text-[#111827] font-black text-xs uppercase tracking-[0.2em] p-8 bg-black/5 rounded-none border border-black/5 transition-colors">
                <span>Chat with us</span>
                <MessageCircle className="text-[#C97C2F]" size={24} /> 
             </a>
           </div>
        </div>
      )}
    </header>
  );
}