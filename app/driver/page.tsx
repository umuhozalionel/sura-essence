"use client";

import React from "react";
import Link from "next/link";
import { Shield, Wifi, Star, Clock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function DriverPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* 1. HERO */}
      <section className="bg-gray-900 text-white pt-32 pb-24 px-6 rounded-b-[3rem]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-primary text-black text-xs font-bold uppercase tracking-wider mb-6">
             Premium Service
          </span>
          <h1 className="text-4xl md:text-7xl font-extrabold mb-8 leading-tight">
            Your Private Driver.<br /> Not just a taxi.
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            A dedicated vehicle and professional driver at your disposal. For meetings, events, or just a seamless day in Kigali.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-10 py-6 text-lg font-bold bg-primary text-black hover:bg-white">
               <Link href="/book?tab=hourly">Book for Today</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-10 py-6 text-lg font-bold border-gray-700 hover:bg-gray-800 text-white">
               <a href="#stories">Read Stories</a>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. DRIVER STORIES (The "Article" Vibe) */}
      <section id="stories" className="py-20 px-6 max-w-6xl mx-auto">
         <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Who uses a Private Driver?</h2>
            <p className="text-gray-500">Real stories from our clients.</p>
         </div>

         <div className="grid md:grid-cols-2 gap-8">
            {/* Story 1 */}
            <div className="bg-gray-50 p-8 rounded-3xl relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">B</div>
                     <div>
                        <h4 className="font-bold">The Business Delegation</h4>
                        <p className="text-xs text-gray-500">UN Conference Team</p>
                     </div>
                  </div>
                  <p className="text-gray-700 italic mb-6">
                     "We had 4 meetings in different parts of town. Our driver, Eric, knew the shortcuts to avoid the Convention Center traffic. He kept the AC running while we grabbed quick coffees. Efficiency we needed."
                  </p>
                  <div className="text-sm font-bold text-primary">Service: Comfort Van (10 Hours)</div>
               </div>
            </div>

            {/* Story 2 */}
            <div className="bg-gray-50 p-8 rounded-3xl relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">W</div>
                     <div>
                        <h4 className="font-bold">The Wedding Guest</h4>
                        <p className="text-xs text-gray-500">Weekend Rental</p>
                     </div>
                  </div>
                  <p className="text-gray-700 italic mb-6">
                     "I didn't want to drive after the reception. Having a driver meant I could enjoy the party, leave my heels in the car, and get home safely at 2 AM. Worth every franc."
                  </p>
                  <div className="text-sm font-bold text-primary">Service: Standard Sedan (6 Hours)</div>
               </div>
            </div>
         </div>
      </section>

      {/* 3. FLEET HIGHLIGHT */}
      <section className="py-20 border-t border-gray-100">
         <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <div className="h-[500px] bg-gray-100 rounded-[2.5rem] bg-cover bg-center" style={{ backgroundImage: "url('/fleet/rwanda-chauffeur-hire.jpg')" }} />
            <div>
               <h2 className="text-4xl font-bold mb-6">Discretion & Comfort.</h2>
               <ul className="space-y-6 mb-8">
                  <li className="flex items-start gap-4">
                     <UserCheck className="w-6 h-6 text-primary shrink-0" />
                     <div>
                        <h4 className="font-bold">Vetted Professionals</h4>
                        <p className="text-gray-500">Background checked, English speaking, and uniformed.</p>
                     </div>
                  </li>
                  <li className="flex items-start gap-4">
                     <Wifi className="w-6 h-6 text-primary shrink-0" />
                     <div>
                        <h4 className="font-bold">Connected Ride</h4>
                        <p className="text-gray-500">Wi-Fi and chargers in all Comfort class vehicles.</p>
                     </div>
                  </li>
               </ul>
               <Button asChild className="rounded-full font-bold px-8">
                  <Link href="/book?vehicle=comfort">Book Your Driver</Link>
               </Button>
            </div>
         </div>
      </section>

      <Footer />
    </main>
  );
}