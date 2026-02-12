"use client";

import React from "react";
import { Star, Quote, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

const REVIEWS = [
  {
    name: "Sarah Jenkins",
    role: "Business Traveler",
    text: "The Wi-Fi in the SUV was a lifesaver. Driver Patrick was incredibly professional. This isn't just a taxi, it's a mobile office.",
    location: "London, UK",
    date: "Feb 2025"
  },
  {
    name: "David Miller",
    role: "Safari Tourist",
    text: "Booking the Musanze route was seamless. The car was spotless and the drive through the hills was smooth. Felt completely safe.",
    location: "California, USA",
    date: "Jan 2025"
  },
  {
    name: "Elena Rodriguez",
    role: "NGO Director",
    text: "We use SURA for all our visiting delegations. Reliable, safe, and the 'Comfort' tier vans are perfect for our teams.",
    location: "Kigali, Rwanda",
    date: "Dec 2024"
  },
];

export function Testimonials() {
  return (
    // DARK THEME: Contrasts against the light Pricing Section above
    <section className="py-24 bg-[#111827] text-white relative overflow-hidden">
      
      {/* Background: Subtle Map Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          {/* LEFT: Sticky Header */}
          <div className="lg:w-1/3 lg:sticky lg:top-32">
            <Quote className="w-16 h-16 text-[#C97C2F] mb-6 opacity-80" />
            
            <span className="text-[#C97C2F] text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
              Client Stories
            </span>
            
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              Voices from <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C97C2F] to-orange-400">
                The Journey.
              </span>
            </h2>
            
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Trusted by global professionals, diplomats, and adventurers exploring the hills of Rwanda.
            </p>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 w-fit">
              <div className="flex -space-x-2">
                {[1,2,3].map((_,i) => (
                   <div key={i} className="w-8 h-8 rounded-full bg-gray-600 border-2 border-[#111827] flex items-center justify-center">
                      <UserCheck size={14} className="text-gray-300" />
                   </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="#C97C2F" className="text-[#C97C2F]" stroke="none" />
                    ))}
                </div>
                <span className="text-xs font-bold text-gray-300">4.9/5 Average Rating</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Scrollable Cards (Glass Effect) */}
          <div className="lg:w-2/3 grid gap-6">
            {REVIEWS.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-[#C97C2F]/50 hover:bg-white/10 transition-all duration-300"
              >
                {/* Decorative Quote Mark */}
                <div className="absolute top-6 right-8 text-white/5 font-serif text-8xl leading-none select-none group-hover:text-[#C97C2F]/10 transition-colors">
                  "
                </div>

                <p className="text-xl md:text-2xl text-gray-200 font-medium leading-relaxed mb-8 relative z-10">
                  {review.text}
                </p>

                <div className="flex items-center justify-between border-t border-white/10 pt-6">
                  <div>
                    <h4 className="text-lg font-bold text-white">{review.name}</h4>
                    <p className="text-xs text-[#C97C2F] uppercase tracking-widest font-bold">{review.role}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm text-gray-400">{review.location}</span>
                    <span className="text-xs text-gray-600">{review.date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}