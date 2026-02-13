"use client"

import { Download, Check, FileText, Plane, CreditCard, Info, MapPin, Wifi, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { Manrope } from "next/font/google";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

export function LeadMagnet() {
  return (
    <section className={`py-24 bg-white text-[#111827] relative overflow-hidden ${manrope.className}`}>
      
      {/* 1. BACKGROUND DECOR: GRIDS + SIDE DOTS */}
      <div className="absolute inset-0 z-0">
         {/* Industrial Grid */}
         <div 
           className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#111827 1px, transparent 1px), linear-gradient(90deg, #111827 1px, transparent 1px)', backgroundSize: '50px 50px' }} 
         />
         
         {/* Side Dots */}
         <div className="absolute left-0 top-0 bottom-0 w-24 opacity-20"
              style={{ backgroundImage: 'radial-gradient(#111827 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
         <div className="absolute right-0 top-0 bottom-0 w-24 opacity-20"
              style={{ backgroundImage: 'radial-gradient(#111827 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
      </div>
      
      {/* Animated Styled Icons */}
      <motion.div 
        initial={{ opacity: 0, x: -100, rotate: -15 }}
        whileInView={{ opacity: 0.04, x: 0, rotate: -12 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute top-20 -left-20 pointer-events-none"
      >
        <Plane size={400} strokeWidth={0.5} />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 100, rotate: 15 }}
        whileInView={{ opacity: 0.04, x: 0, rotate: 12 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute bottom-10 -right-20 pointer-events-none"
      >
        <CreditCard size={450} strokeWidth={0.5} />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="grid lg:grid-cols-12 gap-16 items-start">
          
          {/* 2. LEFT CONTENT: Editorial/Vlog Style */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 py-1.5 px-3.5 bg-[#C97C2F]/10 border border-[#C97C2F]/20 mb-8 rounded-none"
            >
              <Zap className="w-3.5 h-3.5 text-[#C97C2F] fill-[#C97C2F]" />
              <span className="text-[#C97C2F] text-[10px] font-black uppercase tracking-[0.3em]">Arrival Sura Essence  2026</span>
            </motion.div>
            
            <motion.h3 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-[#111827] mb-8 tracking-tighter leading-[0.95] uppercase"
            >
              Know Before <br />
              <span className="text-[#C97C2F]">You Touch Down.</span>
            </motion.h3>
            
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-6 text-gray-500 mb-12 max-w-xl"
            >
              <p className="text-lg font-bold leading-relaxed uppercase tracking-tight">
                Rwanda is seamless, but preparation is key. Our arrival  is designed to get you from the cabin to the city in record time.
              </p>
              
              <div className="bg-gray-50 border-l-4 border-[#C97C2F] p-5 rounded-none">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-[#C97C2F]" />
                  <span className="text-[#111827] text-xs font-black uppercase tracking-widest">Concierge Pro-Tip</span>
                </div>
                <p className="text-sm italic font-medium">
                  "Skip the airport exchange desks. Your SURA driver can facilitate local currency needs at mid-market rates upon your first stop."
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <a 
                href="/arrival-guide.pdf" 
                download
                className="inline-flex h-16 px-10 bg-[#C97C2F] hover:bg-[#A05D1C] text-white rounded-none items-center gap-3 transition-all font-black uppercase tracking-widest text-sm shadow-xl shadow-[#C97C2F]/20"
              >
                <Download className="w-5 h-5" />
                <span>Get the Full PDF Guide</span>
              </a>
            </motion.div>
          </div>

          {/* 3. RIGHT CONTENT: Animated Visual Checklist */}
          <div className="lg:col-span-5 relative">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white border border-[#111827]/10 rounded-none p-10 shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Checklist</span>
                <div className="flex gap-2">
                   <div className="w-2 h-2 bg-green-500" />
                   <div className="w-2 h-2 bg-gray-100" />
                   <div className="w-2 h-2 bg-gray-100" />
                </div>
              </div>

              <div className="space-y-8">
                {[
                  { icon: MapPin, t: "Visa on Arrival", d: "30-Day free entry for AU, Commonwealth & Francophonie citizens." },
                  { icon: CreditCard, t: "Card Payments", d: "Kigali is highly digital; Visa/Mastercard are accepted in 90% of shops." },
                  { icon: Wifi, t: "Connectivity", d: "Get a local SIM at the airport (MTN/Airtel) in under 5 minutes." },
                  { icon: Plane, t: "Customs (Plastic)", d: "Rwanda is plastic-free. Ensure your luggage has no polythene bags." }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    className="flex items-start gap-5 group"
                  >
                    <div className="w-10 h-10 bg-gray-50 border border-[#111827]/10 flex items-center justify-center shrink-0 group-hover:border-[#C97C2F]/30 transition-colors rounded-none">
                       <item.icon className="w-5 h-5 text-[#C97C2F]" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[#111827] text-sm font-black uppercase tracking-tight mb-1">{item.t}</p>
                      <p className="text-gray-400 text-[11px] leading-relaxed font-bold uppercase tracking-tighter">{item.d}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 pt-6 border-t border-gray-50 text-center">
                 <p className="text-[9px] text-gray-400 uppercase tracking-[0.4em] font-black italic">Verified by SURA Concierge Team • 2026</p>
              </div>
            </motion.div>
            
            <div className="absolute -bottom-6 -right-6 w-full h-full border border-[#111827]/5 rounded-none -z-10 bg-gray-50/50" />
          </div>

        </div>
      </div>
    </section>
  )
}