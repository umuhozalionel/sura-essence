"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Linkedin, ArrowRight, MapPin, Mail, Phone } from "lucide-react";
import { Manrope } from "next/font/google";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

export function Footer() {
  return (
    <footer className={`bg-[#111827] text-white pt-24 pb-10 relative overflow-hidden ${manrope.className}`}>
      
      {/* 1. CONTINUOUS INFRASTRUCTURE DOTS - STANDING OUT ON DARK */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute left-0 top-0 bottom-0 w-24 opacity-10"
              style={{ backgroundImage: 'radial-gradient(#F5F2EA 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
         <div className="absolute right-0 top-0 bottom-0 w-24 opacity-10"
              style={{ backgroundImage: 'radial-gradient(#F5F2EA 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
      </div>

      <div className="max-w-[1600px] mx-auto px-10 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-20">
          
          {/* COL 1: BRAND SYSTEM */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-8">
               <div className="relative h-12 w-40">
                 <Image 
                    src="/brand/sura-logo.png" 
                    alt="SURA Essence" 
                    fill
                    className="object-contain brightness-0 invert" 
                 />
               </div>
            </Link>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-sm">
              Rwanda's premier mobility infrastructure. We combine high-trust technology with premium hospitality to offer seamless transfers and specialized chauffeur protocols.
            </p>
            <div className="flex gap-3">
              <SocialIcon icon={Facebook} />
              <SocialIcon icon={Instagram} />
              <SocialIcon icon={Linkedin} />
              <SocialIcon icon={Twitter} />
            </div>
          </div>

          {/* COL 2: DISCOVER */}
          <div>
            <h4 className="font-black text-[10px] uppercase tracking-[0.4em] mb-8 text-[#C97C2F]">Discover</h4>
            <ul className="space-y-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <li><Link href="/book" className="hover:text-white transition-colors">Book a Ride</Link></li>
              <li><Link href="/locations" className="hover:text-white transition-colors">City Experiences</Link></li>
              <li><Link href="/transfers" className="hover:text-white transition-colors">Inter-City Transfers</Link></li>
              <li><Link href="/driver" className="hover:text-white transition-colors">Private Driver</Link></li>
            </ul>
          </div>

          {/* COL 3: COMPANY */}
          <div>
            <h4 className="font-black text-[10px] uppercase tracking-[0.4em] mb-8 text-[#C97C2F]">Company</h4>
            <ul className="space-y-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Business Accounts</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Become a Partner</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Sustainability</Link></li>
            </ul>
          </div>

          {/* COL 4: CONTACT  */}
          <div>
             <h4 className="font-black text-[10px] uppercase tracking-[0.4em] mb-8 text-[#C97C2F]">Contact</h4>
             <ul className="space-y-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-10">
                <li className="flex items-center gap-3">
                   <Phone size={14} className="text-[#C97C2F]" />
                   <span>+250 788 845 062</span>
                </li>
                <li className="flex items-center gap-3">
                   <Mail size={14} className="text-[#C97C2F]" />
                   <span>Suraessenceltd@gmail.com</span>
                </li>
                <li className="flex items-center gap-3">
                   <MapPin size={14} className="text-[#C97C2F]" />
                   <span>Kigali, Rwanda</span>
                </li>
             </ul>
             
             {/* SHARP RECTANGULAR BUTTON */}
             <a 
               href="https://wa.me/250788845062" 
               target="_blank"
               className="flex items-center justify-center gap-3 w-full bg-[#C97C2F] hover:bg-white hover:text-[#111827] text-white font-black py-4 px-6 rounded-none transition-all text-[10px] uppercase tracking-[0.3em]"
             >
               WhatsApp  <ArrowRight size={14} />
             </a>
          </div>

        </div>

        {/* FOOTER BOTTOM */}
        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
            © {new Date().getFullYear()} SURA ESSENCE LTD. OPERATIONAL .
          </p>
          
          <div className="flex items-center gap-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
             <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
             <Link href="#" className="hover:text-white transition-colors">Terms</Link>
             <Link href="#" className="hover:text-white transition-colors">Sitemap</Link>
          </div>

          {/* UPDATED CREDIT: BRAVONET TECHNOLOGIES */}
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 border border-slate-800 rounded-none">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Powered by</span>
            <span className="text-[9px] font-black text-white tracking-[0.4em] uppercase">BRAVONET TECHNOLOGIES</span>
          </div>
        </div>

      </div>
    </footer>
  )
}

function SocialIcon({ icon: Icon }: { icon: any }) {
   return (
      <a href="#" className="w-10 h-10 bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#C97C2F] hover:text-white transition-all rounded-none">
         <Icon size={16} />
      </a>
   )
}