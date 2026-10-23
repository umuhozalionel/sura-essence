"use client";

import React from 'react';
import Image from "next/image";
import { ArrowRight, Zap } from 'lucide-react';
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useSiteText } from "@/components/site-text";
import { Link } from "@/i18n/navigation";
import { getIcon } from "@/lib/icons";

// Card words and links come from messages/en.json + messages/fr.json (namespace "Pricing").
// The cards show no prices: each one links to the booking form with that service
// pre-selected (e.g. href "/book?tab=hourly&hours=3"), where the exact total is quoted.
type Perk = { id: string; icon: string; label: string };
type Service = {
  id: string;
  image: string;
  href: string;
  title: string;
  period: string;
  description: string;
  features: string[];
};

export default function PricingSection() {
  const t = useTranslations("Pricing");
  // Heading and button text: Admin → Site content, falling back to messages/*.json.
  const text = useSiteText("pricing", "Pricing");

  const perks = t.raw("perks") as Perk[];
  const services = t.raw("services") as Service[];

  return (
    <section id="pricing" className={`pt-0 pb-24 md:pb-32 bg-background text-foreground relative overflow-hidden`}>
      
      {/* BACKGROUND SYSTEM: DOTS + GRID */}
      <div className="absolute inset-0 z-0">
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 relative z-10 flex flex-col gap-12 md:gap-16">
        
        {/* HEADER AREA WITH FADING ENTRANCE */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl flex flex-col items-start gap-4"
          >
            <div className="flex items-center gap-3 py-2 px-5 rounded-full bg-foreground text-white shadow-xl">
               <Zap className="w-4 h-4 text-primary" />
               <span className="text-xs font-extrabold uppercase tracking-widest">{text("badge")}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-foreground uppercase tracking-tighter leading-[0.95]">
              {text("title")} <br />
              <span className="text-primary">{text("titleHighlight")}</span>
            </h1>
            <p className="text-foreground/60 text-xl leading-relaxed max-w-2xl font-extrabold uppercase tracking-tight">
              {text("subtitle")}
            </p>
          </motion.div>

          <div className="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[340px]">
             {perks.map((perk, idx) => {
                const Icon = getIcon(perk.icon);
                return (
                <motion.div 
                   key={perk.id} 
                   initial={{ opacity: 0 }}
                   whileInView={{ opacity: 1 }}
                   transition={{ duration: 0.5, delay: idx * 0.1 }}
                   viewport={{ once: true }}
                   className="flex items-center gap-4 p-5 bg-card rounded-2xl ring-1 ring-black/5 shadow-lg group hover:border-primary transition-all"
                >
                   <Icon className="w-5 h-5 text-primary" />
                   <span className="text-xs font-extrabold text-foreground uppercase tracking-widest">{perk.label}</span>
                </motion.div>
                );
             })}
          </div>
        </div>

        {/* PRICING GRID WITH FADING ENTRANCE */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 rounded-2xl ring-1 ring-black/5 shadow-2xl shadow-black/10 overflow-hidden">
          {services.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              viewport={{ once: true }}
              className="group bg-card p-6 md:p-8 border-r border-black/5 last:border-r-0 hover:bg-foreground transition-all duration-500 flex flex-col gap-8 h-full"
            >
               {/* IMAGE SYSTEM: COLOR TO BLACK/WHITE ON HOVER */}
               <div className="relative h-56 w-full grayscale-0 group-hover:grayscale transition-all duration-700 rounded-2xl ring-1 ring-black/5 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-secondary text-foreground px-3 py-1 shadow-lg shadow-black/10">
                    <span className="text-xs font-extrabold uppercase tracking-widest">{item.period}</span>
                  </div>
               </div>

               <div className="flex flex-col flex-grow gap-8">
                  <div className="flex flex-col gap-4">
                  <h3 className="text-2xl font-extrabold text-foreground group-hover:text-white uppercase tracking-tighter transition-colors">
                     {item.title}
                  </h3>
                  <p className="text-sm font-bold text-foreground/50 group-hover:text-white/50 leading-relaxed uppercase tracking-tight">
                     {item.description}
                  </p>
                  </div>

                  <div className="flex flex-col gap-4">
                     {item.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-3">
                           <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                           <span className="text-xs font-extrabold text-foreground/60 group-hover:text-white/60 uppercase tracking-widest">{feature}</span>
                        </div>
                     ))}
                  </div>
                  
                  <div className="mt-auto pt-8 border-t border-black/5 group-hover:border-white/10 flex items-end justify-end">
                     <Link href={item.href} aria-label={item.title} className="w-12 h-12 rounded-full bg-foreground group-hover:bg-primary flex items-center justify-center transition-all">
                        <ArrowRight className="w-6 h-6 text-primary group-hover:text-white" />
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
           className="flex justify-end"
        >
           <Link href="/book" className="group flex min-h-12 flex-col items-end justify-center gap-2">
              <span className="text-xs font-extrabold text-foreground uppercase tracking-widest flex items-center gap-3">
                {text("cta")} <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="h-[2px] w-48 bg-primary" />
           </Link>
        </motion.div>

      </div>
    </section>
  );
}
