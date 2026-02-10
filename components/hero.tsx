"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-black">
      
      {/* 1. Background Image with Gradient Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('/hero-bg/kigali-suv.png')", 
        }}
      >
        {/* Gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      </div>

      {/* 2. Centered Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium tracking-wider uppercase mb-6">
            Premium Mobility
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight mb-6 leading-tight"
        >
          Welcome to <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
            Kigali.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-300 font-medium mb-10 max-w-2xl leading-relaxed"
        >
          Experience professional chauffeur services tailored for your comfort. 
          From airport pickups to city tours, we ensure you arrive in style.
        </motion.p>

        {/* 3. Standardized CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Button
            asChild
            size="lg"
            className="rounded-full bg-white text-black hover:bg-gray-100 font-bold px-8 h-14 text-base transition-all"
          >
            <Link href="/book">
              Book a Ride
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full border-white/30 text-white hover:bg-white/10 hover:text-white font-bold px-8 h-14 text-base backdrop-blur-sm bg-transparent"
          >
            <Link href="#pricing" className="flex items-center gap-2">
              View Rates <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}