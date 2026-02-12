"use client"

import Link from "next/link"
import { Download, Check, FileText } from "lucide-react"

export function LeadMagnet() {
  return (
    // LIGHT BACKGROUND: Breaks the dark block between Testimonials and Footer
    <section className="py-24 bg-white text-[#111827] relative overflow-hidden">
      
      {/* Background Decor: Subtle Copper Mesh */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#C97C2F 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
      />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        
        {/* MAIN CARD CONTAINER - Dark Asphalt Card on White BG for Pop */}
        <div className="relative bg-[#111827] rounded-[2.5rem] p-8 md:p-16 overflow-hidden shadow-2xl group hover:shadow-[#C97C2F]/20 transition-all duration-500">
          
          {/* Copper Glow Effect (Top Right) */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#C97C2F] rounded-full blur-[100px] opacity-10 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            
            {/* LEFT: CONTENT */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 py-1 px-3 border border-[#C97C2F]/30 rounded-full bg-[#C97C2F]/10 mb-6">
                 <FileText className="w-3 h-3 text-[#C97C2F]" />
                 <span className="text-[#C97C2F] text-xs font-bold uppercase tracking-wider">
                   Traveler Essentials
                 </span>
              </div>
              
              <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                The Rwanda <br />
                <span className="text-[#C97C2F]">
                  Arrival Checklist
                </span>
              </h3>
              
              <p className="text-gray-400 mb-10 text-lg leading-relaxed max-w-md mx-auto md:mx-0">
                Curated by our concierge team. Everything you need to know before you land—from visa protocols to hidden gems in Kigali.
              </p>
              
              {/* ACTION: Molten Copper Button */}
              <div className="flex justify-center md:justify-start">
                 <button className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#C97C2F] to-orange-400 rounded-full blur opacity-20 group-hover:opacity-60 transition duration-500" />
                    <div className="relative px-8 h-14 bg-gradient-to-br from-[#C97C2F] to-[#A05D1C] rounded-full leading-none flex items-center gap-3 shadow-xl overflow-hidden">
                       <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[30deg] group-hover:animate-shine" />
                       
                       <Download className="w-5 h-5 text-white" />
                       <span className="text-white text-base font-bold tracking-wide">Download PDF Guide</span>
                    </div>
                 </button>
              </div>
            </div>

            {/* RIGHT: VISUAL CARD (Light Paper Look) */}
            <div className="w-full md:w-1/3 perspective-1000">
               <div className="bg-white border border-gray-100 rounded-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500 shadow-xl relative">
                  
                  {/* Decorative Elements */}
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

                  <div className="space-y-5">
                    {[
                      "Visa Requirements", 
                      "Currency & Payments", 
                      "Cultural Etiquette", 
                      "Safety Protocols"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 group/item">
                         <div className="w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center group-hover/item:bg-[#C97C2F] transition-colors">
                            <Check className="w-3 h-3 text-gray-400 group-hover/item:text-white" />
                         </div>
                         <span className="text-[#111827] text-sm font-bold">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                     <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Verified 2026</span>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}