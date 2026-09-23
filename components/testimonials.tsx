"use client";

import React, { useState } from "react";
import { Star, Quote, Sparkles, Send, MessageCircle, Globe, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Manrope } from "next/font/google";
import { useTranslations } from "next-intl";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

const CONTACT_EMAIL = "Suraessenceltd@gmail.com";

// Reviews come from messages/en.json + messages/fr.json (namespace "Testimonials").
// Add a review by adding an entry to the "reviews" array in those two files.
type Review = { id: string; name: string; occupation: string; country: string; text: string };

export function Testimonials() {
  const t = useTranslations("Testimonials");
  const ti = useTranslations("Testimonials.inquiry");
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });

  const reviews = t.raw("reviews") as Review[];
  const translatedNote = t("translatedNote");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // The visitor's own mail app opens with the message in their language
    const subject = encodeURIComponent(ti("emailSubject"));
    const body = encodeURIComponent(
      ti("emailBody", { name: formState.name, email: formState.email, message: formState.message })
    );
    
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    
    setFormState({ name: "", email: "", message: "" });
  };

  return (
    <section id="testimonials" className={`py-28 md:py-32 bg-white text-[#0A1128] relative overflow-hidden ${manrope.className}`}>
      
      {/* 1. BACKGROUND SYSTEM: CONTINUOUS DOTS + GRID */}
      <div className="absolute inset-0 z-0">
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
            <div className="flex items-center gap-3 py-2 px-5 rounded-full bg-[#0A1128] text-white mb-8 self-start shadow-xl">
               <Zap className="w-4 h-4 text-[#125740]" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t("badge")}</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black text-[#0A1128] uppercase tracking-tighter leading-[0.85] mb-8">
              {t("title")} <br />
              <span className="text-[#125740]">{t("titleHighlight")}</span>
            </h2>
            <p className="text-[#0A1128]/60 text-xl leading-relaxed max-w-2xl font-black uppercase tracking-tight">
              {t("subtitle")}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex flex-col gap-3 min-w-[300px] w-full lg:w-auto"
          >
             <div className="flex items-center gap-4 p-5 bg-white rounded-2xl ring-1 ring-black/5 shadow-lg group hover:border-[#125740] transition-all">
                <div className="w-10 h-10 bg-[#0A1128] flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-[#125740] fill-[#125740]" stroke="none" />
                </div>
                <div className="flex flex-col">
                    <div className="flex gap-0.5 mb-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} fill="#125740" className="text-[#125740]" stroke="none" />
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-[#0A1128] tracking-widest uppercase">{t("rating")}</span>
                </div>
             </div>
          </motion.div>
        </div>

        {/* 3. REVIEWS GRID: SHARP & INDUSTRIAL */}
        <div className="grid lg:grid-cols-3 gap-0 rounded-2xl ring-1 ring-black/5 bg-white shadow-2xl shadow-black/10 mb-24 overflow-hidden">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              viewport={{ once: true }}
              className="p-12 border-r border-black/5 last:border-r-0 hover:bg-[#0A1128] group transition-all duration-500 flex flex-col"
            >
              <Quote className="w-10 h-10 text-[#125740] mb-10 group-hover:scale-110 transition-transform" />
              
              <p className="text-xl font-bold text-[#0A1128] group-hover:text-white mb-4 leading-tight tracking-tight italic uppercase transition-colors">
                {t("quote", { text: review.text })}
              </p>
              {translatedNote && (
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#0A1128]/30 group-hover:text-white/30 mb-8 transition-colors">
                  {translatedNote}
                </p>
              )}

              <div className="mt-auto pt-8 border-t border-black/5 group-hover:border-white/10">
                <h4 className="text-lg font-black text-[#0A1128] group-hover:text-white uppercase mb-1 transition-colors">{review.name}</h4>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[#125740] font-black uppercase tracking-[0.2em]">
                    {review.occupation}
                  </span>
                  <div className="flex items-center gap-2 text-[#0A1128]/40 group-hover:text-white/40">
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
          <div className="bg-white p-12 md:p-16 rounded-2xl ring-1 ring-black/5 shadow-2xl shadow-black/10 relative overflow-hidden">
            <div className="grid md:grid-cols-2 gap-16 relative z-10">
              <div>
                <div className="inline-flex items-center gap-3 py-2 px-5 rounded-full bg-[#0A1128] text-white mb-8 shadow-xl">
                  <MessageCircle className="w-4 h-4 text-[#125740]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{ti("badge")}</span>
                </div>
                <h3 className="text-5xl font-black text-[#0A1128] mb-6 uppercase tracking-tighter leading-none">{ti("title")}</h3>
                <p className="text-[#0A1128]/60 font-bold uppercase tracking-tight mb-10 leading-relaxed">
                  {ti("text")}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F9F8F6] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#125740]" />
                  </div>
                  <span className="text-[10px] font-black text-[#0A1128] uppercase tracking-[0.3em]">{ti("support")}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input 
                    type="text" 
                    placeholder={ti("namePlaceholder")}
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({...formState, name: e.target.value.toUpperCase()})}
                    className="w-full bg-[#F9F8F6] border-none p-5 text-[10px] font-black tracking-widest outline-none focus:ring-2 focus:ring-[#125740] transition-all rounded-2xl"
                  />
                  <input 
                    type="email" 
                    placeholder={ti("emailPlaceholder")}
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({...formState, email: e.target.value})}
                    className="w-full bg-[#F9F8F6] border-none p-5 text-[10px] font-black tracking-widest outline-none focus:ring-2 focus:ring-[#125740] transition-all rounded-2xl"
                  />
                </div>
                <textarea 
                  placeholder={ti("messagePlaceholder")}
                  required
                  rows={4}
                  value={formState.message}
                  onChange={(e) => setFormState({...formState, message: e.target.value})}
                  className="w-full bg-[#F9F8F6] border-none p-5 text-[10px] font-black tracking-widest outline-none focus:ring-2 focus:ring-[#125740] transition-all rounded-2xl resize-none"
                />
                <button 
                  type="submit"
                  className="w-full h-16 bg-[#0A1128] hover:bg-[#125740] text-white flex items-center justify-center gap-3 transition-all font-black uppercase tracking-[0.4em] text-xs shadow-xl active:scale-95 rounded-2xl"
                >
                  <Send className="w-4 h-4" />
                  <span>{ti("submit")}</span>
                </button>
              </form>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}