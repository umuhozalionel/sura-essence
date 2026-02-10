"use client"

import { Button } from "@/components/ui/button"
import { Download, Check } from "lucide-react"

export function LeadMagnet() {
  return (
    // DARK BACKGROUND for final contrast
    <section className="py-24 bg-[#0B1215] text-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-[#152022] rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden shadow-2xl border border-white/5">
          
          {/* Abstract Gold Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C97C2F] rounded-full blur-[100px] opacity-10 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block py-1 px-3 border border-[#C97C2F]/30 rounded-full text-[#C97C2F] text-xs font-bold uppercase tracking-wider mb-6">
                Traveler Essentials
              </span>
              <h3 className="text-3xl md:text-4xl font-serif text-white mb-6">
                The Rwanda Arrival Checklist
              </h3>
              <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                Curated by our concierge team. Everything you need to know before you land—from visa protocols to hidden gems in Kigali.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button 
                   size="lg" 
                   className="bg-[#C97C2F] hover:bg-[#b06a25] text-white rounded-full px-8 h-12 font-bold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF Guide
                </Button>
              </div>
            </div>

            {/* Visual Guide Representation */}
            <div className="w-full md:w-1/3 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md transform rotate-2 hover:rotate-0 transition-transform duration-500">
               <div className="space-y-4">
                  {[
                    "Visa Requirements", 
                    "Currency & Payments", 
                    "Cultural Etiquette", 
                    "Safety Protocols"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 border-b border-white/5 pb-2 last:border-0">
                       <div className="w-6 h-6 rounded-full bg-[#C97C2F]/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-[#C97C2F]" />
                       </div>
                       <span className="text-gray-300 text-sm font-medium">{item}</span>
                    </div>
                  ))}
               </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}