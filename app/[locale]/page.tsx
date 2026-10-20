"use client";

import { Hero } from "@/components/hero";
import { ActivitiesSection } from "@/components/activities-section";
import { DestinationsHistorySection } from "@/components/destinations-history-section";
import { SeamlessStaySection } from "@/components/seamless-stay-section";
import { GallerySection } from "@/components/gallery-section";
import { Testimonials } from "@/components/testimonials";
import { FounderSection } from "@/components/founder-section";
import { LeadMagnet } from "@/components/lead-magnet";
import { useState, useEffect } from "react";

// Each section renders its own id, so the scroll spy can find it.
const spyNodes = [
  { id: "seamless-stay", label: "01", name: "Full Service" },
  { id: "activities", label: "02", name: "Activities" },
  { id: "destinations", label: "03", name: "Destinations" },
  { id: "gallery", label: "04", name: "Gallery" },
  { id: "testimonials", label: "05", name: "Journals" },
  { id: "founders", label: "06", name: "Founders" }
];

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("hero");

  // Scroll Spy Logic
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", ...spyNodes.map((n) => n.id)];
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

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Land the section just below the fixed header (--header-h in globals.css).
      const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
      window.scrollTo({ top: element.offsetTop - headerH, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground relative">

      {/* SCROLL SPY (Fixed Right - Only appears AFTER Hero section) */}
      <div
        className={`hidden xl:flex fixed right-0 top-1/2 -translate-y-1/2 z-50 transition-all duration-500 ease-in-out
        ${activeSection === 'hero' ? 'opacity-0 translate-x-12 pointer-events-none' : 'opacity-100 translate-x-0'}`}
      >
        <div className="bg-card shadow-2xl border border-border py-6 px-3 flex flex-col gap-8 rounded-l-sm">
          {spyNodes.map((node) => (
            <button
              key={node.id}
              onClick={() => scrollTo(node.id)}
              className="group relative flex items-center justify-center"
            >
              <span className={`text-xs font-extrabold uppercase transition-colors duration-300 ${activeSection === node.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {node.label}
              </span>
              {/* Tooltip (Pops out to the left) */}
              <div className={`absolute right-8 px-4 py-2 bg-foreground text-white text-xs font-extrabold uppercase tracking-widest whitespace-nowrap transition-all duration-300 origin-right ${activeSection === node.id ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100"}`}>
                {node.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div id="hero">
        <Hero />
      </div>

      <SeamlessStaySection />
      <ActivitiesSection />
      <DestinationsHistorySection />
      <GallerySection />
      {/* Guest stories first, to build trust before introducing the team. */}
      <Testimonials />
      <FounderSection />
      {/* The arrival guide shows here and on /tours only, not on every page. */}
      <LeadMagnet />
    </div>
  );
}
