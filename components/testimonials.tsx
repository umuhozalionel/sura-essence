"use client";

import React, { useState } from "react";
import { Star, Quote, UserCheck, Sparkles, Send, MessageCircle, MapPin, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Manrope } from "next/font/google";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

const REVIEWS = [
  {
    name: "Sarah Jenkins",
    occupation: "Business Executive",
    country: "United Kingdom",
    text: "The Wi-Fi in the SUV was a lifesaver. Driver Patrick was incredibly professional. This isn't just a taxi, it's a mobile office.",
    location: "London",
    date: "Feb 2025"
  },
  {
    name: "David Miller",
    occupation: "Travel Photographer",
    country: "United States",
    text: "Booking the Musanze route was seamless. The car was spotless and the drive through the hills was smooth. Felt completely safe.",
    location: "California",
    date: "Jan 2025"
  },
  {
    name: "Elena Rodriguez",
    occupation: "NGO Director",
    country: "Rwanda",
    text: "We use SURA for all our visiting delegations. Reliable, safe, and the 'Comfort' tier vans are perfect for our teams.",
    location: "Kigali",
    date: "Dec 2024"
  },
];

export function Testimonials() {
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Feedback submitted:", formState);
    alert("Thank you for your feedback! Our team will review it.");
    setFormState({ name: "", email: "", message: "" });
  };

  return (
    // PRICING FORMULA: Matches the #F3F4F6 background and padding of your PricingSection
    <section id="testimonials" className={`py-24 bg-[#F3F4F6] relative ${manrope.className}`}>
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HEADER: Exactly replicates the PricingSection header layout */}
        <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-12">
          <div className="max-w-2xl">
            <span className="text-[#C97C2F] text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
              Verified Journals
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#111827] tracking-tight mb-6 leading-tight">
              Real Stories. <br />
              <span className="text-slate-400">Pure Trust.</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              Hear from travelers who trust SURA Essence for every kilometer across Rwanda.
            </p>
          </div>

          <div className="flex flex-col gap-4 min-w-[240px] w-full lg:w-auto">
             <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#C97C2F]/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#C97C2F]/10 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-[#C97C2F] fill-[#C97C2F]" stroke="none" />
                </div>
                <div className="flex flex-col">
                    <div className="flex gap-0.5 mb-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} fill="#C97C2F" className="text-[#C97C2F]" stroke="none" />
                        ))}
                    </div>
                    <span className="text-xs font-bold text-[#111827] tracking-widest uppercase">4.9/5 Avg. Rating</span>
                </div>
             </div>
          </div>
        </div>

        {/* REVIEWS SECTION: Removed individual cards to keep text in the spotlight */}
        <div className="grid md:grid-cols-3 gap-16 mb-24 border-b border-slate-200 pb-20">
          {REVIEWS.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col"
            >
              <Quote className="w-10 h-10 text-[#C97C2F] opacity-20 mb-6" />
              
              <p className="text-xl font-bold text-[#111827] mb-8 leading-tight tracking-tight italic">
                "{review.text}"
              </p>

              <div className="mt-auto">
                <h4 className="text-base font-black text-[#111827] leading-none mb-2">{review.name}</h4>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[#C97C2F] font-black uppercase tracking-[0.2em]">
                    {review.occupation}
                  </span>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Globe className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{review.country}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* INQUIRY & FEEDBACK FORM */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C97C2F] rounded-full blur-[100px] opacity-[0.03] pointer-events-none" />
            
            <div className="relative z-10 grid md:grid-cols-2 gap-12">
              <div>
                <div className="inline-flex items-center gap-2 py-1.5 px-3.5 rounded-lg bg-[#C97C2F]/10 border border-[#C97C2F]/20 mb-6">
                  <MessageCircle className="w-3.5 h-3.5 text-[#C97C2F]" />
                  <span className="text-[#C97C2F] text-[10px] font-bold uppercase tracking-[0.2em]">Communication</span>
                </div>
                <h3 className="text-3xl font-extrabold text-[#111827] mb-4 tracking-tight">Have an Inquiry?</h3>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                  Our concierge team is listening. Send your feedback or special requests below.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#C97C2F]" />
                  </div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">24/7 Support Channel</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Name"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({...formState, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm outline-none focus:border-[#C97C2F]/40 transition-all font-medium"
                  />
                  <input 
                    type="email" 
                    placeholder="Email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({...formState, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm outline-none focus:border-[#C97C2F]/40 transition-all font-medium"
                  />
                </div>
                <textarea 
                  placeholder="Your message or feedback..."
                  required
                  rows={4}
                  value={formState.message}
                  onChange={(e) => setFormState({...formState, message: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm outline-none focus:border-[#C97C2F]/40 transition-all font-medium resize-none"
                />
                <button 
                  type="submit"
                  className="w-full h-14 bg-[#111827] hover:bg-[#C97C2F] text-white rounded-xl flex items-center justify-center gap-3 transition-all font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}