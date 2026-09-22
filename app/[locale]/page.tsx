"use client";

import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import PricingSection from "@/components/pricing-section";
import { Testimonials } from "@/components/testimonials";
import { LeadMagnet } from "@/components/lead-magnet";
import { Footer } from "@/components/footer";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("hero");

  // Scroll Spy Logic
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "how-it-works", "pricing", "testimonials"];
      const scrollPosition = window.scrollY + 300; // Offset for triggering

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const spyNodes = [
    { id: "how-it-works", label: "01", name: "The System" },
    { id: "pricing", label: "02", name: "Fleet Rates" },
    { id: "testimonials", label: "03", name: "Journals" }
  ];

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 80, behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen w-full bg-white text-[#111827] relative">
      
      {/* SCROLL SPY (Fixed Right - Only appears AFTER Hero section) */}
      <div 
        className={`hidden xl:flex fixed right-0 top-1/2 -translate-y-1/2 z-50 transition-all duration-500 ease-in-out
        ${activeSection === 'hero' ? 'opacity-0 translate-x-12 pointer-events-none' : 'opacity-100 translate-x-0'}`}
      >
        <div className="bg-white shadow-2xl border border-gray-100 py-6 px-3 flex flex-col gap-8 rounded-l-sm">
          {spyNodes.map((node) => (
            <button 
              key={node.id}
              onClick={() => scrollTo(node.id)}
              className="group relative flex items-center justify-center"
            >
              <span className={`text-[10px] font-black uppercase transition-colors duration-300 ${activeSection === node.id ? "text-[#006cb7]" : "text-gray-300 hover:text-[#111827]"}`}>
                {node.label}
              </span>
              {/* Tooltip (Pops out to the left) */}
              <div className={`absolute right-8 px-4 py-2 bg-[#111827] text-white text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 origin-right ${activeSection === node.id ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100"}`}>
                {node.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Header />
      
      <div id="hero">
        <Hero />
      </div>
      
      <div id="how-it-works">
        <HowItWorks />
      </div>

      <div id="pricing">
        <PricingSection />
      </div>

      <LeadMagnet />

      <div id="testimonials">
        <Testimonials />
      </div>
      
      <Footer />
    </main>
  );
}