"use client";

import React from "react";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

const reviews = [
  {
    name: "Sarah Jenkins",
    role: "Business Traveler",
    text: "The wifi in the SUV was a lifesaver. Driver Patrick was incredibly professional. This isn't just a taxi, it's a mobile office.",
    location: "London, UK"
  },
  {
    name: "David Miller",
    role: "Safari Tourist",
    text: "Booking the Musanze route was seamless. The car was spotless and the drive through the hills was smooth.",
    location: "California, USA"
  },
  {
    name: "Elena Rodriguez",
    role: "NGO Director",
    text: "We use SURA for all our visiting delegations. Reliable, safe, and the 'Comfort' tier vans are perfect for our teams.",
    location: "Kigali, Rwanda"
  },
];

export function Testimonials() {
  return (
    // LIGHT BACKGROUND to contrast against Dark Pricing
    <section className="py-32 bg-[#F5F2EA] text-[#0B1215] relative overflow-hidden">
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-16">
          
          {/* Left Column: Heading */}
          <div className="md:w-1/3">
            <Quote className="w-16 h-16 text-[#C97C2F] mb-8 opacity-100" />
            <h2 className="text-4xl md:text-5xl font-serif leading-tight mb-6 text-[#0B1215]">
              Voices from <br />
              <span className="text-[#C97C2F] italic">The Journey</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Trusted by global professionals and adventurers exploring the hills of Rwanda.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#C97C2F" stroke="none" />
                ))}
              </div>
              <span className="text-sm font-bold text-[#0B1215]">4.9/5 Average Rating</span>
            </div>
          </div>

          {/* Right Column: Cards (Clean White) */}
          <div className="md:w-2/3 grid gap-6">
            {reviews.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <p className="text-lg md:text-xl text-[#0B1215] font-serif italic mb-6 leading-relaxed">
                  "{review.text}"
                </p>
                <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                  <div>
                    <h4 className="font-bold text-[#0B1215]">{review.name}</h4>
                    <p className="text-[10px] text-[#C97C2F] uppercase tracking-widest">{review.role}</p>
                  </div>
                  <span className="text-sm text-gray-400 font-serif">{review.location}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}