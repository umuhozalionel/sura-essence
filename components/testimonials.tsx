"use client";

import React, { useState } from "react";
import { Star, Quote, Sparkles, Send, MessageCircle, Globe, Zap } from "lucide-react";
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
    
    // Constructing the email 
    const subject = encodeURIComponent("New Inquiry: SURA Essence ");
    const body = encodeURIComponent(
      ` Report:\n\nName: ${formState.name}\nClient Email: ${formState.email}\n\nMessage:\n${formState.message}`
    );
    
    // Initialize system mailer
    window.location.href = `mailto:Suraessenceltd@gmail.com?subject=${subject}&body=${body}`;
    
    // Clear buffer
    setFormState({ name: "", email: "", message: "" });
  };

  return (
    <section id="testimonials" className={`py-24 bg-[#F5F2EA] text-[#111827] relative overflow-hidden ${manrope.className}`}>
      
      {/* 1. BACKGROUND SYSTEM: CONTINUOUS DOTS + GRID */}
      <div className="absolute inset-0 z-0">
         <div className="absolute left-0 top-0 bottom-0 w-24 opacity-20"
              style={{ backgroundImage: 'radial-gradient(#111827 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
         <div className="absolute right-0 top-0 bottom-0 w-24 opacity-20"
              style={{ backgroundImage: 'radial-gradient(#111827 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
              style={{ backgroundImage: 'linear-gradient(#111827 1px, transparent 1px), linear-gradient(90deg, #111827 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="max-w-[1600px] mx-auto px-10 relative z-10">
        
        {/* 2. HEADER: ALIGNED TO  STYLE */}
        <div className="flex flex-col lg:flex-row justify-between items-start mb-20 gap-12">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 py-2 px-5 bg-[#111827] text-white mb-8 self-start shadow-xl">
               <Zap className="w-4 h-4 text-[#C97C2F]" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Verified Journals</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black text-[#111827] uppercase tracking-tighter leading-[0.85] mb-8">
              Real Stories. <br />
              <span className="text-[#C97C2F]">Pure Trust.</span>
            </h2>
            <p className="text-[#111827]/60 text-xl leading-relaxed max-w-2xl font-black uppercase tracking-tight">
              Hear from travelers who trust SURA Essence for every kilometer across Rwanda.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex flex-col gap-3 min-w-[300px] w-full lg:w-auto"
          >
             <div className="flex items-center gap-4 p-5 bg-white border border-[#111827]/10 shadow-lg group hover:border-[#C97C2F] transition-all">
                <div className="w-10 h-10 bg-[#111827] flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-[#C97C2F] fill-[#C97C2F]" stroke="none" />
                </div>
                <div className="flex flex-col">
                    <div className="flex gap-0.5 mb-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} fill="#C97C2F" className="text-[#C97C2F]" stroke="none" />
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-[#111827] tracking-widest uppercase">4.9/5 Avg. Operational Rating</span>
                </div>
             </div>
          </motion.div>
        </div>

        {/* 3. REVIEWS GRID: SHARP & INDUSTRIAL */}
        <div className="grid lg:grid-cols-3 gap-0 border border-[#111827]/10 bg-white shadow-2xl mb-24 overflow-hidden">
          {REVIEWS.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              viewport={{ once: true }}
              className="p-12 border-r border-[#111827]/10 last:border-r-0 hover:bg-[#111827] group transition-all duration-500 flex flex-col"
            >
              <Quote className="w-10 h-10 text-[#C97C2F] mb-10 group-hover:scale-110 transition-transform" />
              
              <p className="text-xl font-bold text-[#111827] group-hover:text-white mb-12 leading-tight tracking-tight italic uppercase transition-colors">
                "{review.text}"
              </p>

              <div className="mt-auto pt-8 border-t border-[#111827]/10 group-hover:border-white/10">
                <h4 className="text-lg font-black text-[#111827] group-hover:text-white uppercase mb-1 transition-colors">{review.name}</h4>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[#C97C2F] font-black uppercase tracking-[0.2em]">
                    {review.occupation}
                  </span>
                  <div className="flex items-center gap-2 text-[#111827]/40 group-hover:text-white/40">
                    <Globe className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{review.country}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 4. INQUIRY FORM: SHARP RECTANGULAR */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-white p-12 md:p-16 border border-[#111827]/10 shadow-2xl relative overflow-hidden">
            <div className="grid md:grid-cols-2 gap-16 relative z-10">
              <div>
                <div className="inline-flex items-center gap-3 py-2 px-5 bg-[#111827] text-white mb-8 shadow-xl">
                  <MessageCircle className="w-4 h-4 text-[#C97C2F]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Communication Hub</span>
                </div>
                <h3 className="text-5xl font-black text-[#111827] mb-6 uppercase tracking-tighter leading-none">Have an Inquiry?</h3>
                <p className="text-[#111827]/60 font-bold uppercase tracking-tight mb-10 leading-relaxed">
                  Our concierge team is listening. Send your feedback or special requests below.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F5F2EA] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#C97C2F]" />
                  </div>
                  <span className="text-[10px] font-black text-[#111827] uppercase tracking-[0.3em]">24/7 Support </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input 
                    type="text" 
                    placeholder="NAME"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({...formState, name: e.target.value.toUpperCase()})}
                    className="w-full bg-[#F5F2EA] border-none p-5 text-[10px] font-black tracking-widest outline-none focus:ring-2 focus:ring-[#C97C2F] transition-all rounded-none"
                  />
                  <input 
                    type="email" 
                    placeholder="EMAIL"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({...formState, email: e.target.value})}
                    className="w-full bg-[#F5F2EA] border-none p-5 text-[10px] font-black tracking-widest outline-none focus:ring-2 focus:ring-[#C97C2F] transition-all rounded-none"
                  />
                </div>
                <textarea 
                  placeholder="MESSAGE OR FEEDBACK..."
                  required
                  rows={4}
                  value={formState.message}
                  onChange={(e) => setFormState({...formState, message: e.target.value})}
                  className="w-full bg-[#F5F2EA] border-none p-5 text-[10px] font-black tracking-widest outline-none focus:ring-2 focus:ring-[#C97C2F] transition-all rounded-none resize-none"
                />
                <button 
                  type="submit"
                  className="w-full h-16 bg-[#111827] hover:bg-[#C97C2F] text-white flex items-center justify-center gap-3 transition-all font-black uppercase tracking-[0.4em] text-xs shadow-xl active:scale-95 rounded-none"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Inquiry</span>
                </button>
              </form>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}