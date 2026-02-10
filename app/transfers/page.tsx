"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Car, ArrowRight, CheckCircle2, Navigation, Fuel, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const POPULAR_ROUTES = [
  { dest: "Musanze (Volcanoes)", dist: "2.5 Hours", priceStd: "70k", priceComf: "90k" },
  { dest: "Akagera National Park", dist: "3 Hours", priceStd: "100k", priceComf: "120k" },
  { dest: "Huye (Butare)", dist: "3 Hours", priceStd: "60k", priceComf: "80k" },
  { dest: "Lake Kivu (Rubavu)", dist: "3.5 Hours", priceStd: "80k", priceComf: "100k" },
  { dest: "Rusizi (Nyungwe)", dist: "5 Hours", priceStd: "90k", priceComf: "120k" },
  { dest: "Kayonza", dist: "1.5 Hours", priceStd: "50k", priceComf: "70k" },
];

export default function TransfersPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* 1. HERO */}
      <section className="bg-white pt-32 pb-20 px-6 border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
            <Navigation className="w-3 h-3" /> Nationwide Coverage
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            City to City. <br /> Safe & Sound.
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            Professional transfers to every corner of Rwanda. 
            Fixed pricing, reliable 4x4s, and experienced drivers who know the roads.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8 font-bold bg-primary text-primary-foreground hover:bg-primary/90">
               <Link href="/book?tab=country">Book a Transfer</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. THE ROUTE BOARD */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
             <h2 className="text-2xl font-bold text-gray-900">Fixed Rates (One-Way)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-6">Destination</th>
                  <th className="p-6">Duration</th>
                  <th className="p-6">Standard</th>
                  <th className="p-6">Comfort</th>
                  <th className="p-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {POPULAR_ROUTES.map((route, i) => (
                  <tr key={i} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-6 font-bold text-gray-900 flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                      {route.dest}
                    </td>
                    <td className="p-6 text-sm text-gray-500">{route.dist}</td>
                    <td className="p-6 font-medium text-gray-600">{route.priceStd} RWF</td>
                    <td className="p-6 font-bold text-primary">{route.priceComf} RWF</td>
                    <td className="p-6 text-right">
                      <Link href={`/book?tab=country&dest=${encodeURIComponent(route.dest)}`} className="text-sm font-bold text-primary hover:underline">
                        Book
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. SAFETY FAQ */}
      <section className="py-16 bg-white border-t border-gray-100">
         <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-12">
            <div>
               <h2 className="text-2xl font-bold mb-6">Transfer Essentials</h2>
               <div className="space-y-6">
                  <div className="flex gap-4">
                     <Fuel className="w-6 h-6 text-primary shrink-0" />
                     <div>
                        <h4 className="font-bold text-gray-900">Fuel Policy</h4>
                        <p className="text-sm text-gray-500">All prices include fuel and driver allowance. No hidden costs on the road.</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <AlertCircle className="w-6 h-6 text-primary shrink-0" />
                     <div>
                        <h4 className="font-bold text-gray-900">Breakdown Cover</h4>
                        <p className="text-sm text-gray-500">In the rare event of an issue, a replacement vehicle is dispatched immediately.</p>
                     </div>
                  </div>
               </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl">
               <h3 className="font-bold mb-4">Driving to Akagera?</h3>
               <p className="text-sm text-gray-600 mb-4">
                  For the National Park, we highly recommend the <strong>Comfort (SUV)</strong> class. The roads inside the park are unpaved and require higher clearance.
               </p>
               <Button asChild variant="outline" className="w-full rounded-full border-2">
                  <Link href="/book?vehicle=comfort&dest=Akagera">Book SUV for Akagera</Link>
               </Button>
            </div>
         </div>
      </section>

      <Footer />
    </main>
  );
}