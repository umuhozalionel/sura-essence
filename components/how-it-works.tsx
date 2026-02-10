"use client";

import { MousePointerClick, MessageSquare, CarFront, Map, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function HowItWorks() {
  const steps = [
    { 
      id: "01",
      icon: Map, 
      title: "Curate Your Journey", 
      desc: "Select your route or experience. From city hills to volcanic peaks." 
    },
    { 
      id: "02",
      icon: CheckCircle2, 
      title: "Secure Your Passage", 
      desc: "Instant confirmation via WhatsApp. We handle the logistics." 
    },
    { 
      id: "03",
      icon: CarFront, 
      title: "The Experience Begins", 
      desc: "Your chauffeur awaits. Pristine vehicle, premium amenities." 
    }
  ];

  return (
    // CHANGED: Removed negative margin. Switched to Light Linen BG (#F5F2EA) to reveal Hero Curve.
    <section className="py-24 bg-[#F5F2EA] text-[#0B1215] relative overflow-hidden">
      
      {/* Background Decor: Subtle Dark Topographic Lines */}
      <div className="absolute inset-0 opacity-[0.05]" 
           style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.span 
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             className="text-[#C97C2F] text-sm font-bold uppercase tracking-[0.2em] mb-4 block"
          >
            Seamless Mobility
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif text-[#0B1215]"
          >
            How Your Journey Unfolds
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          
          {/* The Connecting Line (Gold) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[1px] bg-gradient-to-r from-transparent via-[#C97C2F]/40 to-transparent" />

          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="relative flex flex-col items-center text-center group"
            >
              {/* Step Number Circle - Dark Variant */}
              <div className="w-24 h-24 rounded-full bg-white border border-[#C97C2F]/20 flex items-center justify-center mb-8 relative z-10 group-hover:border-[#C97C2F] transition-colors duration-500 shadow-xl">
                <step.icon strokeWidth={1} className="w-10 h-10 text-[#0B1215] group-hover:text-[#C97C2F] transition-colors duration-500" />
                
                {/* Small floating badge number */}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#C97C2F] text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {step.id}
                </div>
              </div>

              <h3 className="text-2xl font-serif text-[#0B1215] mb-4 group-hover:text-[#C97C2F] transition-colors">
                {step.title}
              </h3>
              <p className="text-gray-600 max-w-xs leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}