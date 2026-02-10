"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    // 1. THE CONTAINER: Added 'rounded-b-[3rem]' to match Driver Page styling
    <section className="relative w-full h-[92vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-black rounded-b-[3rem]">
      
      {/* 2. BACKGROUND IMAGE */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          // Using the image from your new organized folder
          backgroundImage: "url('/backrounds/hero-bg.webp')", 
        }}
      >
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* 3. HERO CONTENT */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-16">
        
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6">
            Premium Mobility in Rwanda
          </span>
        </motion.div>

        {/* Animated Headline */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.1 }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Visit. Explore. <br />
            <span className="text-[#c97c2f]">Experience.</span>
          </h1>
        </motion.div>

        {/* Animated Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          From seamless airport transfers to self-drive adventures. 
          Experience Rwanda with the freedom you deserve.
        </motion.p>
        
        {/* Animated Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button 
            asChild 
            size="lg" 
            className="bg-[#c97c2f] hover:bg-[#b06a25] text-white rounded-full px-8 h-14 text-lg font-bold"
          >
            <Link href="/book">
              Book a Ride <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="lg" 
            className="bg-transparent border-white text-white hover:bg-white hover:text-black rounded-full px-8 h-14 text-lg font-bold backdrop-blur-sm"
          >
            <Link href="/locations">
              View Experiences
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}