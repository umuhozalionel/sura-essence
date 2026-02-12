"use client";

import Link from "next/link"
import Image from "next/image"
import { Facebook, Twitter, Instagram, Linkedin, ArrowRight, MapPin, Mail, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#111827] text-white pt-20 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          {/* COL 1: BRAND */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
               <div className="relative h-10 w-32">
                 <Image 
                    src="/brand/sura-logo.png" 
                    alt="SURA Essence" 
                    fill
                    className="object-contain brightness-0 invert" 
                 />
               </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
              SURA Essence is Rwanda's premier mobility provider. We combine technology with premium hospitality to offer seamless transfers, tours, and chauffeur services.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon={Facebook} />
              <SocialIcon icon={Instagram} />
              <SocialIcon icon={Linkedin} />
              <SocialIcon icon={Twitter} />
            </div>
          </div>

          {/* COL 2: DISCOVER */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">Discover</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link href="/book" className="hover:text-[#C97C2F] transition-colors">Book a Ride</Link></li>
              <li><Link href="/locations" className="hover:text-[#C97C2F] transition-colors">City Experiences</Link></li>
              <li><Link href="/transfers" className="hover:text-[#C97C2F] transition-colors">Inter-City Transfers</Link></li>
              <li><Link href="/driver" className="hover:text-[#C97C2F] transition-colors">Private Driver</Link></li>
            </ul>
          </div>

          {/* COL 3: COMPANY */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">Company</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-[#C97C2F] transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-[#C97C2F] transition-colors">Business Accounts</Link></li>
              <li><Link href="#" className="hover:text-[#C97C2F] transition-colors">Become a Partner</Link></li>
              <li><Link href="#" className="hover:text-[#C97C2F] transition-colors">Sustainability</Link></li>
            </ul>
          </div>

          {/* COL 4: CONTACT & ACTION */}
          <div>
             <h4 className="font-bold text-lg mb-6 text-white">Contact</h4>
             <ul className="space-y-4 text-sm text-slate-400 mb-8">
                <li className="flex items-center gap-3">
                   <Phone size={16} className="text-[#C97C2F]" />
                   <span>+250 788 845 062</span>
                </li>
                <li className="flex items-center gap-3">
                   <Mail size={16} className="text-[#C97C2F]" />
                   <span>Suraessenceltd@gmail.com</span>
                </li>
                <li className="flex items-center gap-3">
                   <MapPin size={16} className="text-[#C97C2F]" />
                   <span>Kigali, Rwanda</span>
                </li>
             </ul>
             
             <a 
               href="https://wa.me/250788845062" 
               target="_blank"
               className="flex items-center justify-center gap-2 w-full bg-[#C97C2F] hover:bg-[#b06a25] text-white font-bold py-3 px-4 rounded-xl transition-all"
             >
               Book on WhatsApp <ArrowRight size={16} />
             </a>
          </div>

        </div>

        {/* FOOTER BOTTOM */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SURA Essence. All rights reserved.</p>
          
          <div className="flex items-center gap-6">
             <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
             <Link href="#" className="hover:text-white transition-colors">Terms</Link>
             <Link href="#" className="hover:text-white transition-colors">Sitemap</Link>
          </div>

          {/* CREDIT */}
          <div className="flex items-center gap-1 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
            <span className="text-slate-400">Powered by</span>
            <span className="font-bold text-white tracking-wide">BRAVONET</span>
          </div>
        </div>

      </div>
    </footer>
  )
}

function SocialIcon({ icon: Icon }: { icon: any }) {
   return (
      <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#C97C2F] hover:text-white transition-all">
         <Icon size={18} />
      </a>
   )
}