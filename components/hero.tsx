"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

export function Hero() {
  return (
    <section className="relative w-full h-[95vh] min-h-[700px] flex items-center justify-center overflow-hidden bg-[#111827] rounded-b-[3rem] shadow-2xl z-10">
      
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('/backrounds/pexels-faustin-nkurunziza.jpg')", 
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#111827]" />
        
        {/* CREDIT: Subtle Artist Credit */}
        <div className="absolute bottom-8 right-8 z-20 pointer-events-none">
           <span className="text-[10px] text-white/20 font-medium tracking-widest uppercase opacity-50">
             Photo: Faustin Nkurunziza
           </span>
        </div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center mt-12">
        
        <motion.h1
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 tracking-tight leading-[1.1] drop-shadow-xl"
        >
          Your Journey in <br />
          <span className="text-[#C97C2F]">
            Absolute Trust.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed font-light drop-shadow-md"
        >
          Experience Rwanda with a meticulously curated fleet. <br className="hidden md:block" />
          No hidden costs. No stress. Just the open road.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full"
        >
          {/* PRIMARY: Molten Copper Button */}
          <Link href="/book" className="group relative w-full sm:w-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#C97C2F] to-orange-400 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
            <div className="relative px-10 h-16 bg-gradient-to-br from-[#C97C2F] to-[#A05D1C] rounded-full leading-none flex items-center justify-center gap-3 shadow-xl border border-white/10 overflow-hidden">
               <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[30deg] group-hover:animate-shine" />
               
               <span className="text-white text-lg font-bold tracking-wide">Book Your Ride</span>
               <ArrowRight className="text-white w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          
          {/* SECONDARY: Frosted Glass -> Pricing Section */}
          <Link href="#pricing" className="w-full sm:w-auto">
             <div className="px-10 h-16 rounded-full bg-white/5 backdrop-blur-md border border-white/20 hover:bg-white hover:text-[#111827] text-white flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-lg cursor-pointer">
                <span className="text-lg font-bold">View Expeditions</span>
             </div>
          </Link>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-0 right-0 mx-auto w-fit flex flex-col items-center gap-3 z-20"
      >
        <span className="text-xs uppercase tracking-[0.2em] font-bold text-gray-400">
          Plan Your Trip
        </span>
        <ChevronDown className="w-8 h-8 animate-bounce text-[#C97C2F]" strokeWidth={2.5} />
      </motion.div>

    </section>
  );
}