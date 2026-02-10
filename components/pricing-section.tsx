"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Shield, Star } from 'lucide-react';
import { motion } from "framer-motion";

const SERVICES = [
  {
    id: "transfers",
    title: "City to City",
    subtitle: "Reliable Inter-city rides",
    price: "From 60k RWF",
    image: "/fleet/kigali-suv.png", 
    link: "/transfers",
    features: ["Musanze", "Akagera", "Kivu"]
  },
  {
    id: "hourly",
    title: "Chauffeur",
    subtitle: "Your private driver",
    price: "25k RWF / Hr",
    image: "/fleet/rwanda-chauffeur-hire.jpg",
    link: "/driver",
    features: ["Business", "Errands", "Events"]
  },
  {
    id: "tours",
    title: "Experiences",
    subtitle: "Curated Rwanda tours",
    price: "From 100k RWF",
    image: "/locations/kigali-skyline-night.jpg",
    link: "/tours",
    features: ["City Tour", "Museums", "Art"]
  },
  {
    id: "airport",
    title: "Airport Transfer",
    subtitle: "KGL Pick-up & Drop-off",
    price: "Fixed 20k RWF",
    image: "/fleet/sedan.webp",
    link: "/book",
    features: ["Meet & Greet", "Flight Tracking"]
  }
];

export default function PricingSection() {
  return (
    <section className="py-24 bg-[#F3F4F6]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* SECTION HEADER - TECH STYLE */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              Go anywhere, <br />
              <span className="text-[#C97C2F]">do anything.</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-xl">
              Choose the perfect ride for your journey. Transparent pricing, premium service.
            </p>
          </div>
          <Link 
            href="/book" 
            className="hidden md:flex items-center gap-2 font-bold text-slate-900 hover:text-[#C97C2F] transition-colors"
          >
            See all rates <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* THE APP CARDS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white rounded-[2rem] p-4 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full border border-slate-100"
            >
               <Link href={item.link} className="block h-full flex flex-col">
                  
                  {/* Image Container - Rounded & Distinct */}
                  <div className="relative h-48 w-full bg-slate-100 rounded-[1.5rem] overflow-hidden mb-5">
                     <img 
                       src={item.image} 
                       alt={item.title} 
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                     />
                     <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                        {item.price}
                     </div>
                  </div>

                  {/* Content */}
                  <div className="px-2 flex-grow flex flex-col">
                     <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-[#C97C2F] transition-colors">
                        {item.title}
                     </h3>
                     <p className="text-slate-500 text-sm font-medium mb-4">
                        {item.subtitle}
                     </p>

                     {/* Mini Features Tags */}
                     <div className="flex flex-wrap gap-2 mb-6">
                        {item.features.map((tag, idx) => (
                           <span key={idx} className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                              {tag}
                           </span>
                        ))}
                     </div>
                     
                     {/* Action Button */}
                     <div className="mt-auto w-full bg-slate-50 group-hover:bg-[#C97C2F] group-hover:text-white transition-colors h-12 rounded-xl flex items-center justify-center font-bold text-sm text-slate-900">
                        Book Now
                     </div>
                  </div>
               </Link>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-10 text-center md:hidden">
            <Link href="/book" className="text-slate-900 font-bold border-b-2 border-[#C97C2F]">See all rates</Link>
        </div>

      </div>
    </section>
  );
}