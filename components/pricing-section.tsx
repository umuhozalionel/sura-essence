"use client";

import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { motion } from "framer-motion";
import { Manrope } from "next/font/google";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

// Services and perks come from messages/en.json + messages/fr.json (namespace "Pricing").
// Add or edit a card by changing those two files only.
type Perk = { id: string; icon: string; label: string };
type Service = {
  id: string;
  image: string;
  href: string;
  price: { amount: number; from?: boolean };
  title: string;
  period: string;
  description: string;
  features: string[];
};

export default function PricingSection() {
  const t = useTranslations("Pricing");
  const format = useFormatter();

  const perks = t.raw("perks") as Perk[];
  const services = t.raw("services") as Service[];

  // 20000 → "20K RWF" (en) / "20 k RWF" (fr)
  const formatPrice = (price: Service["price"]) =>
    t(price.from ? "priceFrom" : "price", {
      amount: format.number(price.amount, { notation: "compact", maximumFractionDigits: 1 }),
    });

  return (
    <section id="pricing" className={`pt-24 pb-8 bg-[#F5F2EA] text-[#111827] relative overflow-hidden ${manrope.className}`}>
      
      {/* BACKGROUND SYSTEM: DOTS + GRID */}
      <div className="absolute inset-0 z-0">
         <div className="absolute left-0 top-0 bottom-0 w-24 opacity-20"
              style={{ backgroundImage: 'radial-gradient(#111827 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
         <div className="absolute right-0 top-0 bottom-0 w-24 opacity-20"
              style={{ backgroundImage: 'radial-gradient(#111827 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
              style={{ backgroundImage: 'linear-gradient(#111827 1px, transparent 1px), linear-gradient(90deg, #111827 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="max-w-[1600px] mx-auto px-10 relative z-10">
        
        {/* HEADER AREA WITH FADING ENTRANCE */}
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
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t("badge")}</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black text-[#111827] uppercase tracking-tighter leading-[0.85] mb-8">
              {t("title")} <br />
              <span className="text-[#C97C2F]">{t("titleHighlight")}</span>
            </h2>
            <p className="text-[#111827]/60 text-xl leading-relaxed max-w-2xl font-black uppercase tracking-tight">
              {t("subtitle")}
            </p>
          </motion.div>

          <div className="flex flex-col gap-3 min-w-[340px] w-full lg:w-auto">
             {perks.map((perk, idx) => {
                const Icon = getIcon(perk.icon);
                return (
                <motion.div 
                   key={perk.id} 
                   initial={{ opacity: 0 }}
                   whileInView={{ opacity: 1 }}
                   transition={{ duration: 0.5, delay: idx * 0.1 }}
                   viewport={{ once: true }}
                   className="flex items-center gap-4 p-5 bg-white border border-[#111827]/10 shadow-lg group hover:border-[#C97C2F] transition-all"
                >
                   <Icon className="w-5 h-5 text-[#C97C2F]" />
                   <span className="text-xs font-black text-[#111827] uppercase tracking-widest">{perk.label}</span>
                </motion.div>
                );
             })}
          </div>
        </div>

        {/* PRICING GRID WITH FADING ENTRANCE */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#111827]/10 shadow-2xl overflow-hidden">
          {services.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              viewport={{ once: true }}
              className="group bg-white p-8 border-r border-[#111827]/10 last:border-r-0 hover:bg-[#111827] transition-all duration-500 flex flex-col h-full"
            >
               {/* IMAGE SYSTEM: COLOR TO BLACK/WHITE ON HOVER */}
               <div className="relative h-56 w-full grayscale-0 group-hover:grayscale transition-all duration-700 mb-8 border border-[#111827]/5">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 left-0 bg-[#C97C2F] text-white p-2">
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.period}</span>
                  </div>
               </div>

               <div className="flex flex-col flex-grow">
                  <h3 className="text-2xl font-black text-[#111827] group-hover:text-white uppercase tracking-tighter mb-4 transition-colors">
                     {item.title}
                  </h3>
                  <p className="text-sm font-bold text-[#111827]/50 group-hover:text-white/50 mb-8 leading-relaxed uppercase tracking-tight">
                     {item.description}
                  </p>

                  <div className="space-y-4 mb-10">
                     {item.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-3">
                           <div className="w-1.5 h-1.5 bg-[#C97C2F]" />
                           <span className="text-[10px] font-black text-[#111827]/60 group-hover:text-white/60 uppercase tracking-[0.2em]">{feature}</span>
                        </div>
                     ))}
                  </div>
                  
                  <div className="mt-auto pt-8 border-t border-[#111827]/10 group-hover:border-white/10 flex items-end justify-between">
                     <div>
                        <span className="text-[9px] text-[#C97C2F] font-black uppercase tracking-[0.3em] block mb-1">{t("rateLabel")}</span>
                        <p className="text-4xl font-black text-[#111827] group-hover:text-white tabular-nums tracking-tighter transition-colors">{formatPrice(item.price)}</p>
                     </div>

                     <Link href={item.href} aria-label={item.title} className="w-12 h-12 bg-[#111827] group-hover:bg-[#C97C2F] flex items-center justify-center transition-all">
                        <ArrowRight className="w-6 h-6 text-[#C97C2F] group-hover:text-white" />
                     </Link>
                  </div>
               </div>
            </motion.div>
          ))}
        </div>
        
        {/* FOOTER ACTION: SEPARATOR REMOVED & SPACE REDUCED */}
        <motion.div 
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           transition={{ duration: 1, delay: 0.5 }}
           viewport={{ once: true }}
           className="mt-12 flex justify-end"
        >
           <Link href="/book" className="group flex flex-col items-end">
              <span className="text-[11px] font-black text-[#111827] uppercase tracking-[0.4em] mb-2 flex items-center gap-3">
                {t("cta")} <ArrowRight className="w-4 h-4 text-[#C97C2F] group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="h-[2px] w-48 bg-[#C97C2F]" />
           </Link>
        </motion.div>

      </div>
    </section>
  );
}