"use client";

import { Plane, Car, MapPin, MousePointerClick } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  {
    id: "01",
    icon: Plane,
    title: "Arrival & Reception",
    description: "Your journey begins at Kigali International Airport. Our team tracks your flight, provides a VIP meet-and-greet, and handles your luggage for a seamless exit.",
  },
  {
    id: "02",
    icon: Car,
    title: "Choose Your Mode",
    description: "Decide how you move. Select a pristine self-drive vehicle for freedom, or a professional chauffeur for inter-city transfers and business logistics.",
  },
  {
    id: "03",
    icon: MapPin,
    title: "Curated Experiences",
    description: "Beyond transit. We organize your itinerary—from Kigali city tours and museum visits to securing permits for Musanze and Akagera expeditions.",
  },
  {
    id: "04",
    icon: MousePointerClick,
    title: "Instant Booking",
    description: "No paperwork delays. Confirm your vehicle, driver, or full itinerary instantly via WhatsApp or our secure online portal.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-white text-[#111827] relative overflow-hidden">
      
      {/* Background: Subtle Industrial Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'linear-gradient(#111827 1px, transparent 1px), linear-gradient(90deg, #111827 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <motion.span 
             initial={{ opacity: 0, y: 10 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
             className="text-[#C97C2F] text-xs font-bold uppercase tracking-[0.2em] mb-4 block"
          >
            The SURA Process
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-[#111827] tracking-tight"
          >
            Your Path to Discovery
          </motion.h2>
        </div>

        {/* Timeline Grid */}
        <div className="relative grid md:grid-cols-4 gap-8">
          
          {/* Connecting Line (Desktop Only) */}
          <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-[2px] bg-gray-100 z-0">
            <div className="h-full bg-[#C97C2F]/20 w-full" />
          </div>

          {STEPS.map((step, i) => (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center group z-10"
            >
              {/* Icon Container */}
              <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 shadow-lg flex items-center justify-center mb-8 relative group-hover:border-[#C97C2F] group-hover:-translate-y-2 transition-all duration-300">
                <step.icon strokeWidth={1.5} className="w-8 h-8 text-[#111827] group-hover:text-[#C97C2F] transition-colors duration-300" />
                
                {/* Step Indicator */}
                <div className="absolute -bottom-3 bg-[#111827] text-white text-[10px] font-bold py-1 px-3 rounded-full border-2 border-white">
                  {step.id}
                </div>
              </div>

              {/* Text Content */}
              <h3 className="text-lg font-bold text-[#111827] mb-3 group-hover:text-[#C97C2F] transition-colors duration-300">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-[240px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}