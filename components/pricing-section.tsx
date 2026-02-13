"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield, Wifi } from 'lucide-react';
import { motion } from "framer-motion";
import { Manrope } from "next/font/google";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

const SERVICES = [
  {
    id: "airport",
    title: "Airport Transfer",
    subtitle: "Seamless Arrival & Departure",
    price: "20k RWF",
    period: "Fixed Rate",
    image: "/fleet/sedan.webp",
    link: "/book",
    description: "VIP Meet & Greet at KGL. We track your flight delays so you never wait.",
    features: ["Flight Tracking", "Luggage Assist", "45min Wait Time"]
  },
  {
    id: "hourly",
    title: "Chauffeur Hire",
    subtitle: "Business & Errands",
    price: "25k RWF",
    period: "Per Hour",
    image: "/fleet/rwanda-chauffeur-hire.jpg",
    link: "/driver",
    description: "Your mobile office. Perfect for back-to-back meetings in Kigali.",
    features: ["In-Car Wi-Fi", "Fuel Included", "Pro Driver"]
  },
  {
    id: "transfers",
    title: "Inter-City Drop",
    subtitle: "Musanze • Akagera • Rubavu",
    price: "From 60k RWF",
    period: "One Way",
    image: "/fleet/kigali-suv.png", 
    link: "/transfers",
    description: "Safe, comfortable transfers to Rwanda's major provinces and parks.",
    features: ["Door-to-Door", "Refreshments", "Comfort SUV"]
  },
  {
    id: "tours",
    title: "Full Day Explorer",
    subtitle: "Custom Tourism Itinerary",
    price: "From 100k RWF",
    period: "Per Day",
    image: "/locations/kigali-skyline-night.jpg",
    link: "/tours",
    description: "Total freedom. A 4x4 and a local expert guide for the whole day.",
    features: ["Unlimited Mileage", "Safari Ready", "Flexible Schedule"]
  }
];

export default function PricingSection() {
  return (
    <section id="pricing" className={`py-24 bg-[#F3F4F6] relative ${manrope.className}`}>
      <div className="max-w-7xl mx-auto px-6">
        
        {/* 1. HEADER & PHILOSOPHY */}
        <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-12">
          
          <div className="max-w-2xl">
            <span className="text-[#C97C2F] text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
              Transparent Value
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#111827] tracking-tight mb-6 leading-tight">
              Simple Pricing. <br />
              <span className="text-slate-400">No Hidden Costs.</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-8 font-medium">
              We believe in "What You See Is What You Pay." Our rates are all-inclusive, covering fuel, insurance, and your professional chauffeur. No surprise fees at the end of the trip.
            </p>
            
            {/* STYLED: Squircle Button (rounded-xl) */}
            <Link 
              href="/book" 
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-[#111827] text-white font-bold hover:bg-[#C97C2F] transition-all shadow-xl hover:shadow-[#C97C2F]/20 group uppercase tracking-widest text-sm"
            >
              <span>Download Rate Card</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="flex flex-col gap-4 min-w-[240px] w-full lg:w-auto">
             <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#C97C2F]/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#C97C2F]/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-[#C97C2F]" />
                </div>
                <span className="text-sm font-bold text-[#111827] uppercase tracking-wider">Full Insurance</span>
             </div>
             
             <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#C97C2F]/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#C97C2F]/10 flex items-center justify-center shrink-0">
                  <Wifi className="w-5 h-5 text-[#C97C2F]" />
                </div>
                <span className="text-sm font-bold text-[#111827] uppercase tracking-wider">Free Wi-Fi</span>
             </div>
             
             <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#C97C2F]/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#C97C2F]/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-[#C97C2F]" />
                </div>
                <span className="text-sm font-bold text-[#111827] uppercase tracking-wider">Free Cancellation</span>
             </div>
          </div>
        </div>

        {/* 2. THE PRICING CARDS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col h-full"
            >
               <Link href={item.link} className="flex flex-col h-full">
                  
                  <div className="relative h-48 w-full bg-slate-50 rounded-[1.5rem] overflow-hidden mb-6">
                     <img 
                       src={item.image} 
                       alt={item.title} 
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                     />
                  </div>

                  <div className="px-1 flex-grow flex flex-col">
                     <h3 className="text-xl font-bold text-[#111827] mb-2 group-hover:text-[#C97C2F] transition-colors">
                        {item.title}
                     </h3>
                     <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed font-medium">
                        {item.description}
                     </p>

                     <div className="space-y-3 mb-8">
                        {item.features.map((feature, idx) => (
                           <div key={idx} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#C97C2F]" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{feature}</span>
                           </div>
                        ))}
                     </div>
                     
                     <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between gap-2">
                        <div>
                           <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em] mb-0.5">{item.period}</p>
                           <p className="text-xl font-extrabold text-[#111827] leading-none tracking-tight">{item.price}</p>
                        </div>

                        {/* STYLED: Squircle card button */}
                        <div className="w-11 h-11 rounded-xl border border-slate-100 group-hover:border-[#C97C2F] group-hover:bg-[#C97C2F] flex items-center justify-center transition-all duration-300 shadow-sm">
                           <ArrowRight className="w-5 h-5 text-[#111827] group-hover:text-white" />
                        </div>
                     </div>
                  </div>
               </Link>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center lg:hidden">
            <Link href="/book" className="inline-flex items-center gap-3 text-[#111827] font-bold border-b-2 border-[#C97C2F] pb-1 uppercase tracking-widest text-xs">
              Full Rate Card <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
      </div>
    </section>
  );
}