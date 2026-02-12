"use client";

import React from "react";
import Link from "next/link";
import { Manrope } from "next/font/google"; // 1. IMPORT FONT
import { MapPin, ArrowRight, Navigation, Fuel, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// 2. CONFIGURE FONT
const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

const POPULAR_ROUTES = [
  { dest: "Musanze (Volcanoes)", dist: "2.5 Hours", priceStd: "70k", priceComf: "90k" },
  { dest: "Akagera National Park", dist: "3 Hours", priceStd: "100k", priceComf: "120k" },
  { dest: "Huye (Butare)", dist: "3 Hours", priceStd: "60k", priceComf: "80k" },
  { dest: "Lake Kivu (Rubavu)", dist: "3.5 Hours", priceStd: "80k", priceComf: "100k" },
  { dest: "Rusizi (Nyungwe)", dist: "5 Hours", priceStd: "90k", priceComf: "120k" },
  { dest: "Kayonza", dist: "1.5 Hours", priceStd: "50k", priceComf: "70k" },
];

export default function TransfersPage() {
  return (
    // 3. APPLY FONT GLOBALLY
    <main className={`min-h-screen bg-white ${manrope.className} selection:bg-[#C97C2F]/20`}>
      <Header />

      {/* 1. HERO SECTION (Dark & Premium) */}
      <section className="relative pt-40 pb-20 px-6 min-h-[60vh] flex items-center justify-center bg-[#111827] overflow-hidden">
        
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url('/backrounds/winding-road.jpg')" }} 
        >
             {/* Gradient Overlay to ensure text readability */}
             <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/80 via-[#111827]/60 to-[#111827]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 py-1 px-4 rounded-xl bg-[#C97C2F]/10 border border-[#C97C2F]/20 backdrop-blur-md mb-8">
            <Navigation className="w-3 h-3 text-[#C97C2F]" /> 
            <span className="text-[#C97C2F] text-xs font-bold uppercase tracking-widest">Nationwide Coverage</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
            City to City. <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C97C2F] to-orange-400">
              Safe & Sound.
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            Professional transfers to every corner of Rwanda. <br className="hidden md:block"/>
            Fixed pricing, reliable 4x4s, and experienced drivers who know the roads.
          </p>
          
          <div className="flex justify-center gap-4">
             {/* VINTAGE BUTTON: Molten Copper */}
             <Link href="/book?tab=country">
                <div className="group relative px-10 h-16 bg-gradient-to-br from-[#C97C2F] to-[#A05D1C] rounded-xl leading-none flex items-center gap-3 shadow-xl overflow-hidden transition-transform hover:scale-105">
                    <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[30deg] group-hover:animate-shine" />
                    <span className="text-white text-sm font-bold uppercase tracking-widest">Book a Transfer</span>
                    <ArrowRight className="w-5 h-5 text-white" />
                </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE ROUTE BOARD */}
      <section className="py-20 px-6 max-w-6xl mx-auto -mt-10 relative z-20">
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-black/10 border border-gray-100 overflow-hidden">
          
          <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white">
             <div>
               <h2 className="text-2xl font-bold text-[#111827]">Fixed Rates</h2>
               <p className="text-sm text-gray-500 font-medium">One-way fares. Fuel & Driver included.</p>
             </div>
             <div className="hidden md:block">
               <ShieldCheck className="w-8 h-8 text-[#C97C2F]/50" />
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#111827] text-white text-xs font-bold uppercase tracking-widest">
                  <th className="p-6">Destination</th>
                  <th className="p-6">Duration</th>
                  <th className="p-6 text-[#C97C2F]">Standard Car</th>
                  <th className="p-6 text-[#C97C2F]">Comfort SUV</th>
                  <th className="p-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {POPULAR_ROUTES.map((route, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-6 font-bold text-[#111827] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-[#C97C2F] transition-colors">
                         <MapPin className="w-4 h-4 text-gray-400 group-hover:text-white" />
                      </div>
                      {route.dest}
                    </td>
                    <td className="p-6 text-sm text-gray-500 font-medium">{route.dist}</td>
                    <td className="p-6 font-medium text-gray-600">{route.priceStd} RWF</td>
                    <td className="p-6 font-bold text-[#C97C2F]">{route.priceComf} RWF</td>
                    <td className="p-6 text-right">
                      <Link 
                        href={`/book?tab=country&dest=${encodeURIComponent(route.dest)}`} 
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-400 hover:bg-[#111827] hover:text-white hover:border-[#111827] transition-all"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. SAFETY & INFO FAQ */}
      <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            
            {/* Left: Info */}
            <div>
               <span className="text-[#C97C2F] text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
                 Transfer Essentials
               </span>
               <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] mb-8 tracking-tight">
                 What to expect on <br /> the road.
               </h2>

               <div className="space-y-8">
                  <div className="flex gap-5">
                     <div className="w-12 h-12 rounded-xl bg-[#C97C2F]/10 flex items-center justify-center shrink-0">
                        <Fuel className="w-6 h-6 text-[#C97C2F]" />
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-[#111827] mb-1">All-Inclusive Rates</h4>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">
                           Price covers vehicle, professional driver, fuel, and insurance. 
                           Driver's accommodation/meals are covered for multi-day trips.
                        </p>
                     </div>
                  </div>

                  <div className="flex gap-5">
                     <div className="w-12 h-12 rounded-xl bg-[#C97C2F]/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-6 h-6 text-[#C97C2F]" />
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-[#111827] mb-1">Roadside Guarantee</h4>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">
                           Our fleet is meticulously maintained. In the rare event of a breakdown, 
                           a replacement vehicle is dispatched immediately from our nearest depot.
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right: Akagera Card */}
            <div className="bg-[#111827] p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl text-white">
               {/* Decorative Circle */}
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#C97C2F] rounded-full blur-[60px] opacity-20" />
               
               <h3 className="text-2xl font-bold mb-4 relative z-10 tracking-tight">Driving to Akagera?</h3>
               <p className="text-gray-300 mb-8 leading-relaxed relative z-10 font-medium">
                  For the National Park, we highly recommend the <strong className="text-[#C97C2F]">Comfort (SUV)</strong> class. 
                  The roads inside the park are unpaved and require higher clearance for a smooth safari experience.
               </p>
               
               {/* Vintage Button Style */}
               <Button asChild className="w-full h-14 bg-white text-[#111827] hover:bg-gray-100 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg transition-transform hover:scale-[1.02]">
                  <Link href="/book?vehicle=comfort&dest=Akagera">Book SUV for Akagera</Link>
               </Button>
            </div>

          </div>
      </section>

      <Footer />
    </main>
  );
}