"use client";

import React from "react";
import { Star, Quote, CheckCircle2, User } from "lucide-react";
import { motion } from "framer-motion";

// ============================================
// TYPES & DATA
// ============================================
interface Review {
  id: string;
  name: string;
  initials: string;
  role: string;
  location: string;
  text: string;
  stars: number;
  date: string;
}

const reviews: Review[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    initials: "SJ",
    role: "Business Traveler",
    location: "London, UK",
    text: "The wifi in the SUV was a lifesaver for my meetings between airport and hotel. Driver Patrick was incredibly professional, punctual, and knew exactly how to navigate Kigali traffic.",
    stars: 5,
    date: "2 weeks ago"
  },
  {
    id: "2",
    name: "David Miller",
    initials: "DM",
    role: "Safari Tourist",
    location: "California, USA",
    text: "Booking the Musanze route was seamless. The car was spotless and the drive through the hills was smooth. I appreciated the transparent pricing—no haggling needed.",
    stars: 5,
    date: "1 month ago"
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    initials: "ER",
    role: "NGO Director",
    location: "Kigali, Rwanda",
    text: "We use SURA for all our visiting delegations. Reliable, safe, and the 'Comfort' tier vans are perfect for our teams. Best invoices system in town.",
    stars: 5,
    date: "3 days ago"
  },
];

// ============================================
// SUB-COMPONENT: TESTIMONIAL CARD
// ============================================
const TestimonialCard = ({ review, index }: { review: Review; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="h-full"
    >
      <div className="h-full bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative group flex flex-col">
        
        {/* Decor: Big Quote Icon */}
        <Quote className="absolute top-6 right-6 text-gray-100 w-12 h-12 rotate-180 group-hover:text-primary/10 transition-colors duration-300" />

        {/* 1. Header: User Info */}
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold border border-gray-200 group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-colors duration-300">
            {review.initials}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 leading-tight flex items-center gap-1">
              {review.name}
              <CheckCircle2 className="w-3 h-3 text-primary" />
            </h4>
            <p className="text-xs text-gray-500 font-medium">{review.role} • {review.location}</p>
          </div>
        </div>

        {/* 2. Rating */}
        <div className="flex gap-1 mb-4 relative z-10">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={14} 
              className={`${i < review.stars ? "fill-primary text-primary" : "fill-gray-200 text-gray-200"}`} 
            />
          ))}
        </div>

        {/* 3. Review Text */}
        <div className="flex-grow relative z-10">
          <p className="text-gray-600 leading-relaxed italic text-sm">
            "{review.text}"
          </p>
        </div>

        {/* 4. Footer: Date */}
        <div className="pt-6 mt-6 border-t border-gray-50 relative z-10">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
            Verified Review • {review.date}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export function Testimonials() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Decor: Subtle Pattern */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
              Trusted by <span className="text-primary">Global Travelers</span>
            </h2>
            
            {/* Social Proof Badge */}
            <div className="inline-flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-full px-6 py-2 shadow-sm">
               <div className="flex -space-x-2">
                 {[1,2,3,4].map((_,i) => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                      <User className="w-4 h-4 text-gray-400" />
                   </div>
                 ))}
               </div>
               <div className="text-left">
                  <div className="flex text-primary gap-0.5">
                    <Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" />
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    <span className="font-bold text-black">4.9/5</span> from 120+ rides
                  </p>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <TestimonialCard key={review.id} review={review} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}