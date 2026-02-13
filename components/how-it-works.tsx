"use client";

import { useState } from "react";
import Link from "next/link"; 
import { Plane, Car, MapPin, MousePointerClick, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Manrope } from "next/font/google";

const manrope = Manrope({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope"
});

const STEPS = [
  {
    id: "01",
    icon: Plane,
    title: "Arrival & Reception",
    description: "Your journey begins at Kigali International Airport. VIP meet-and-greet .",
    details: "Our team tracks your flight in real-time. Upon exit, a professional handler with a SURA identification board manages your luggage and SIM card assistance.",
    signs: ["Flight Tracking", "VIP Greeting", "Luggage "],
  },
  {
    id: "02",
    icon: Car,
    title: "Choose Your Mode",
    description: "Select your infrastructure from our meticulously maintained fleet.",
    details: "Decide how you move. Select a pristine self-drive vehicle for freedom, or a professional chauffeur for inter-city transfers and business logistics.",
    fleet: [
      { name: "Executive Sedan", price: "$50-80/day", specs: "Late model, City optimized" },
      { name: "Premium SUV", price: "$70-100/day", specs: "High clearance, Business WiFi" },
      { name: "Expedition 4x4", price: "$90-130/day", specs: "All-terrain, Safari ready" }
    ],
    signs: ["Verified Photos", "Strict Maintenance", "Full Insurance"],
  },
  {
    id: "03",
    icon: MapPin,
    title: "Curated Experiences",
    description: "Beyond transit. We organize your full itinerary across Rwanda.",
    details: "Strategic planning for Musanze gorilla treks, Akagera expeditions, and Kigali urban tours. We handle permit logistics and hotel coordination.",
    signs: ["Permit Logistics", "Route Planning", "Boutique Stays"],
  },
  {
    id: "04",
    icon: MousePointerClick,
    title: "Instant Booking",
    description: "Zero paperwork delays. Confirm your  instantly.",
    details: "Secure your vehicle and itinerary via our encrypted portal or direct WhatsApp link. Upfront, all-inclusive pricing with zero hidden fees.",
    signs: ["Encrypted Payment", "Instant Quote", "WhatsApp Support"],
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className={`pt-16 pb-12 bg-white text-[#111827] relative overflow-hidden ${manrope.className}`}>
      
      {/* 1. BACKGROUND SYSTEM */}
      <div className="absolute inset-0 z-0">
         <div 
           className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#111827 1px, transparent 1px), linear-gradient(90deg, #111827 1px, transparent 1px)', backgroundSize: '50px 50px' }} 
         />
         <div className="absolute left-0 top-0 bottom-0 w-24 opacity-20"
              style={{ backgroundImage: 'radial-gradient(#111827 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
         <div className="absolute right-0 top-0 bottom-0 w-24 opacity-20"
              style={{ backgroundImage: 'radial-gradient(#111827 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
      </div>

      <div className="max-w-[1600px] mx-auto px-10 relative z-10">
        
        {/* SECTION HEADER */}
        <div className="mb-12 flex flex-col items-start">
          <div className="flex items-center gap-3 py-2 px-5 bg-[#111827] text-white mb-6 shadow-xl">
             <Shield className="w-4 h-4 text-[#C97C2F]" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational </span>
          </div>
          <h2 className="text-6xl md:text-8xl font-black text-[#111827] uppercase tracking-tighter leading-[0.85]">
            The SURA <br />
            <span className="text-[#C97C2F]">System Process.</span>
          </h2>
        </div>

        {/* INTERACTIVE HUB GRID */}
        <div className="grid lg:grid-cols-12 gap-0 border border-[#111827]/10 bg-white shadow-2xl">
          
          <div className="lg:col-span-5 border-r border-[#111827]/10 divide-y divide-[#111827]/10">
            {STEPS.map((step, i) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(i)}
                className={`w-full flex items-center gap-8 p-10 text-left transition-all duration-500 relative group overflow-hidden ${
                  activeStep === i ? "bg-[#111827] text-white" : "hover:bg-[#F5F2EA]"
                }`}
              >
                <span className={`text-4xl font-black tracking-tighter ${activeStep === i ? "text-[#C97C2F]" : "text-[#111827]/10"}`}>
                  {step.id}
                </span>
                <div className="flex flex-col">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-1">{step.title}</h3>
                  <p className={`text-[11px] font-bold uppercase tracking-widest ${activeStep === i ? "text-gray-400" : "text-gray-500"}`}>
                    {step.description}
                  </p>
                </div>
                {activeStep === i && (
                  <motion.div layoutId="activePointer" className="absolute right-0 top-0 bottom-0 w-1.5 bg-[#C97C2F]" />
                )}
              </button>
            ))}
          </div>

          <div className="lg:col-span-7 bg-[#F5F2EA]/30 p-12 md:p-20 relative overflow-hidden min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 h-full flex flex-col"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-[#111827] flex items-center justify-center">
                    {(() => {
                      const Icon = STEPS[activeStep].icon;
                      return <Icon className="text-[#C97C2F] w-8 h-8" />;
                    })()}
                  </div>
                  <div>
                    <span className="text-[#C97C2F] text-[10px] font-black uppercase tracking-[0.2em] block mb-1">SOP </span>
                    <h4 className="text-3xl font-black text-[#111827] uppercase">{STEPS[activeStep].title}</h4>
                  </div>
                </div>

                <p className="text-xl text-[#111827] font-bold leading-relaxed mb-10 max-w-2xl">
                  {STEPS[activeStep].details}
                </p>

                {activeStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    {STEPS[1].fleet?.map((car) => (
                      <div key={car.name} className="bg-white p-5 border border-[#111827]/10 shadow-lg">
                        <span className="text-[#C97C2F] text-[9px] font-black uppercase tracking-widest block mb-2">{car.price}</span>
                        <h5 className="text-sm font-black text-[#111827] uppercase mb-1">{car.name}</h5>
                        <p className="text-[10px] text-gray-500 font-bold">{car.specs}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-auto grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-[#111827]/10">
                  {STEPS[activeStep].signs.map((sign) => (
                    <div key={sign} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#C97C2F]" />
                      <span className="text-[10px] font-black text-[#111827] uppercase tracking-widest">{sign}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ACTION BAR (SEPARATOR REMOVED) */}
        <div className="mt-10 flex justify-end">
           <Link href="/book" className="group flex flex-col items-end">
              <span className="text-[11px] font-black text-[#111827] uppercase tracking-[0.4em] mb-2 flex items-center gap-3">
                Initialize System <ArrowRight className="w-4 h-4 text-[#C97C2F] group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="h-[2px] w-48 bg-[#C97C2F]" />
           </Link>
        </div>

      </div>
    </section>
  );
}