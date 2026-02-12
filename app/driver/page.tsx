"use client";

import React from "react";
import Link from "next/link";
import { Manrope } from "next/font/google";
import { UserCheck, Wifi, Star, ArrowRight, ShieldCheck, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// 1. CONFIGURE FONT
const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

export default function DriverPage() {
  return (
    // 2. APPLY FONT GLOBALLY
    <main className={`min-h-screen bg-white ${manrope.className} selection:bg-[#C97C2F]/20`}>
      <Header />

      {/* 1. HERO SECTION */}
      <section className="relative pt-40 pb-24 px-6 min-h-[70vh] flex items-center justify-center bg-[#111827] overflow-hidden rounded-b-[3rem]">
        
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: "url('/backrounds/chauffeur-hero.jpg')" }} 
        >
             <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/90 via-[#111827]/70 to-[#111827]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 py-1 px-4 rounded-xl bg-[#C97C2F]/10 border border-[#C97C2F]/20 backdrop-blur-md mb-8">
            <UserCheck className="w-4 h-4 text-[#C97C2F]" />
            <span className="text-[#C97C2F] text-xs font-bold uppercase tracking-widest">
              Premium Chauffeur Service
            </span>
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold text-white mb-8 leading-[1.1] tracking-tight">
            Your Private Driver.<br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C97C2F] to-orange-400">
              Not just a taxi.
            </span>
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            A dedicated vehicle and professional driver at your disposal. <br className="hidden md:block"/>
            For meetings, events, or just a seamless day in Kigali.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-5">
            {/* VINTAGE BUTTON: Molten Copper */}
            <Link href="/book?tab=hourly">
                <div className="group relative px-10 h-16 bg-[#C97C2F] hover:bg-[#A05D1C] rounded-xl leading-none flex items-center justify-center gap-3 shadow-xl overflow-hidden transition-transform hover:scale-105">
                    <span className="text-white text-sm font-bold uppercase tracking-widest">Book for Today</span>
                    <ArrowRight className="w-5 h-5 text-white" />
                </div>
            </Link>

            {/* VINTAGE BUTTON: Glass/Outline */}
            <a href="#stories">
                <div className="px-10 h-16 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-[#111827] transition-all duration-300 cursor-pointer text-sm font-bold uppercase tracking-widest">
                    Read Stories
                </div>
            </a>
          </div>
        </div>
      </section>

      {/* 2. DRIVER STORIES */}
      <section id="stories" className="py-24 px-6 bg-white relative">
         <div className="max-w-6xl mx-auto">
             <div className="text-center mb-20">
                <h2 className="text-3xl md:text-5xl font-extrabold text-[#111827] mb-4 tracking-tight">Who uses a Private Driver?</h2>
                <p className="text-gray-500 text-lg font-medium">Real stories from our clients.</p>
             </div>

             <div className="grid md:grid-cols-2 gap-8">
                {/* Story 1 */}
                <div className="group bg-gray-50 p-10 rounded-[2.5rem] relative overflow-hidden transition-all hover:shadow-2xl hover:bg-white hover:-translate-y-1 border border-transparent hover:border-gray-100">
                    <Quote className="absolute top-8 right-8 text-gray-200 w-16 h-16 group-hover:text-[#C97C2F]/20 transition-colors" />
                    
                    <div className="relative z-10">
                       <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 rounded-xl bg-[#111827] text-white flex items-center justify-center font-bold text-xl">B</div>
                          <div>
                             <h4 className="font-bold text-[#111827] text-lg">The Business Delegation</h4>
                             <p className="text-xs text-[#C97C2F] uppercase font-bold tracking-wider">UN Conference Team</p>
                          </div>
                       </div>
                       <p className="text-gray-600 italic text-lg leading-relaxed mb-8 font-medium">
                          "We had 4 meetings in different parts of town. Our driver, Eric, knew the shortcuts to avoid the Convention Center traffic. He kept the AC running while we grabbed quick coffees. Efficiency we needed."
                       </p>
                       <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C97C2F]/10 rounded-xl">
                          <Star className="w-4 h-4 text-[#C97C2F] fill-current" />
                          <span className="text-sm font-bold text-[#111827] uppercase tracking-wide">Comfort Van (10 Hours)</span>
                       </div>
                    </div>
                </div>

                {/* Story 2 */}
                <div className="group bg-gray-50 p-10 rounded-[2.5rem] relative overflow-hidden transition-all hover:shadow-2xl hover:bg-white hover:-translate-y-1 border border-transparent hover:border-gray-100">
                    <Quote className="absolute top-8 right-8 text-gray-200 w-16 h-16 group-hover:text-[#C97C2F]/20 transition-colors" />
                    
                    <div className="relative z-10">
                       <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 rounded-xl bg-[#111827] text-white flex items-center justify-center font-bold text-xl">W</div>
                          <div>
                             <h4 className="font-bold text-[#111827] text-lg">The Wedding Guest</h4>
                             <p className="text-xs text-[#C97C2F] uppercase font-bold tracking-wider">Weekend Rental</p>
                          </div>
                       </div>
                       <p className="text-gray-600 italic text-lg leading-relaxed mb-8 font-medium">
                          "I didn't want to drive after the reception. Having a driver meant I could enjoy the party, leave my heels in the car, and get home safely at 2 AM. Worth every franc."
                       </p>
                       <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C97C2F]/10 rounded-xl">
                          <Star className="w-4 h-4 text-[#C97C2F] fill-current" />
                          <span className="text-sm font-bold text-[#111827] uppercase tracking-wide">Standard Sedan (6 Hours)</span>
                       </div>
                    </div>
                </div>
             </div>
         </div>
      </section>

      {/* 3. FLEET HIGHLIGHT */}
      <section className="py-24 bg-[#F3F4F6]">
         <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            
            {/* Image Side */}
            <div className="h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                  style={{ backgroundImage: "url('/fleet/rwanda-chauffeur-hire.jpg')" }} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-8 left-8 text-white">
                    <p className="font-bold text-lg uppercase tracking-wide">Toyota Land Cruiser V8</p>
                    <p className="text-sm opacity-80 font-medium">Our Flagship Comfort Vehicle</p>
                </div>
            </div>

            {/* Content Side */}
            <div>
               <span className="text-[#C97C2F] text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
                 Why Choose SURA?
               </span>
               <h2 className="text-4xl font-extrabold text-[#111827] mb-8 leading-tight tracking-tight">
                 Discretion & <br /> Comfort Guaranteed.
               </h2>
               
               <ul className="space-y-8 mb-12">
                  <li className="flex items-start gap-5">
                     <div className="w-12 h-12 rounded-xl bg-[#111827] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6 text-white" />
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-[#111827] mb-1">Vetted Professionals</h4>
                        <p className="text-gray-500 leading-relaxed font-medium">
                           Every driver is background checked, fluent in English/French, and trained in defensive driving.
                        </p>
                     </div>
                  </li>
                  <li className="flex items-start gap-5">
                     <div className="w-12 h-12 rounded-xl bg-[#111827] flex items-center justify-center shrink-0">
                        <Wifi className="w-6 h-6 text-white" />
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-[#111827] mb-1">Connected Ride</h4>
                        <p className="text-gray-500 leading-relaxed font-medium">
                           High-speed Wi-Fi and universal chargers available in all Comfort class vehicles.
                        </p>
                     </div>
                  </li>
               </ul>

               <Link href="/book?vehicle=comfort">
                  <button className="h-16 px-12 rounded-xl bg-[#C97C2F] hover:bg-[#A05D1C] text-white font-bold text-sm uppercase tracking-widest shadow-xl hover:shadow-[#C97C2F]/20 transition-all hover:-translate-y-1">
                     Book Your Driver
                  </button>
               </Link>
            </div>
         </div>
      </section>

      <Footer />
    </main>
  );
}