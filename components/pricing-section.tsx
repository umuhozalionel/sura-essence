"use client";

import React from 'react';
import Link from 'next/link';
import { Plane, MapPin, Clock, Car, ArrowRight } from 'lucide-react';
import { motion } from "framer-motion";

const SERVICES = [
  {
    id: "transfers",
    title: "Inter-City Transfers",
    subtitle: "Safe travel to Musanze, Akagera & beyond.",
    price: "From 60k RWF",
    icon: Car,
    link: "/transfers",
    bg: "bg-blue-50 text-blue-600"
  },
  {
    id: "tours",
    title: "Kigali City Tours",
    subtitle: "Full-day curated cultural experiences.",
    price: "From 100k RWF",
    icon: MapPin,
    link: "/tours",
    bg: "bg-orange-50 text-orange-600"
  },
  {
    id: "chauffeur",
    title: "Hourly Chauffeur",
    subtitle: "Your private driver for meetings & events.",
    price: "25k RWF / Hour",
    icon: Clock,
    link: "/chauffeur",
    bg: "bg-green-50 text-green-600"
  },
  {
    id: "airport",
    title: "Airport Pickup",
    subtitle: "VIP Meet & Greet at KGL Arrival.",
    price: "20k RWF",
    icon: Plane,
    link: "/book?tab=city", // Direct to booking for simple airport jobs
    bg: "bg-purple-50 text-purple-600"
  }
];

export default function PricingSection() {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-black mb-6">
            Choose Your <span className="text-primary">Journey</span>
          </h2>
          <p className="text-lg text-gray-600">
            Transparent pricing. Professional drivers. Select a service to see details.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${service.bg} group-hover:scale-110 transition-transform`}>
                <service.icon className="w-7 h-7" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
              <p className="text-sm text-gray-500 mb-6 flex-grow">{service.subtitle}</p>
              
              <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                <span className="font-bold text-primary text-sm">{service.price}</span>
                <Link 
                  href={service.link}
                  className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}