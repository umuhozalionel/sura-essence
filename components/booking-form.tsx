"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Car, Info, ArrowRight, Plane, Map as MapIcon } from "lucide-react";

// Load Map Client-Side Only to prevent SSR errors
const MapWidget = dynamic(() => import("@/components/ui/map-widget"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-50 animate-pulse flex flex-col items-center justify-center text-muted-foreground">
      <MapPin className="w-8 h-8 mb-2 opacity-20" />
      <span className="text-xs font-medium">Loading Map...</span>
    </div>
  )
});

// --- DATA ---
const COUNTRYSIDE_TRIPS = [
  { id: "musanze", title: "Musanze (Volcanoes)", price: 90000, coords: [-1.5033, 29.6326] as [number, number], img: "/hero-bg/rwanda-chauffeur-hire.jpg" },
  { id: "akagera", title: "Akagera National Park", price: 120000, coords: [-1.8833, 30.7167] as [number, number], img: "/hero-bg/Land-Cruiser-safari-Rwanda.jpg" },
  { id: "huye", title: "Huye (Ethnographic Museum)", price: 80000, coords: [-2.6000, 29.7333] as [number, number], img: "/hero-bg/sedan.jpg" },
  { id: "rusizi", title: "Rusizi (Nyungwe Forest)", price: 120000, coords: [-2.4833, 28.9000] as [number, number], img: "/hero-bg/suv.webp" },
];

export default function BookingForm() {
  const [activeTab, setActiveTab] = useState("city");
  
  // Form State
  const [formData, setFormData] = useState({
    pickup: "",
    dropoff: "",
    serviceType: "airport", // 'airport', 'city_tour', 'inter_city'
    hours: "3",
    vehicle: "standard",
    date: "",
    time: ""
  });

  const [selectedTrip, setSelectedTrip] = useState<typeof COUNTRYSIDE_TRIPS[0] | null>(null);
  const [quote, setQuote] = useState(0);

  // Map State
  const [mapCenter, setMapCenter] = useState<[number, number]>([-1.9441, 30.0619]); // Kigali Center
  const [mapZoom, setMapZoom] = useState(12);
  const [markers, setMarkers] = useState<Array<{ pos: [number, number]; label: string }>>([
    { pos: [-1.9441, 30.0619], label: "Kigali" }
  ]);

  // PRICING ENGINE
  useEffect(() => {
    let price = 0;
    const isComfort = formData.vehicle === "comfort";
    const tierMultiplier = isComfort ? 1.3 : 1;

    if (activeTab === "city") {
      // Base rates for Point-to-Point
      if (formData.serviceType === "airport") price = isComfort ? 40000 : 20000;
      else if (formData.serviceType === "city_tour") price = isComfort ? 130000 : 100000; // Fixed Day Rate
      else price = isComfort ? 15000 : 10000; // Base taxi rate (very rough estimate for visual only)
    } 
    else if (activeTab === "hourly") {
      const base = isComfort ? 35000 : 25000;
      const extra = isComfort ? 9000 : 7000;
      const h = parseInt(formData.hours) || 3;
      price = base + ((h - 3) * extra);
    }
    else if (activeTab === "country" && selectedTrip) {
      price = selectedTrip.price * (isComfort ? 1.2 : 1);
    }

    setQuote(Math.round(price));
  }, [activeTab, formData.vehicle, formData.hours, formData.serviceType, selectedTrip]);

  // Handlers
  const handleTripSelect = (trip: typeof COUNTRYSIDE_TRIPS[0]) => {
    setSelectedTrip(trip);
    setFormData(prev => ({ ...prev, dropoff: trip.title }));
    setMapCenter(trip.coords);
    setMapZoom(9);
    setMarkers([
      { pos: [-1.9441, 30.0619], label: "Kigali Start" },
      { pos: trip.coords, label: trip.title }
    ]);
  };

  const handleWhatsApp = () => {
    const text = `
🚗 *New SURA Booking Request*
Type: ${activeTab.toUpperCase()}
Service: ${activeTab === 'city' ? formData.serviceType : 'Direct'}
Vehicle: ${formData.vehicle.toUpperCase()}
${activeTab === 'country' ? `Destination: ${selectedTrip?.title}` : `From: ${formData.pickup || 'TBD'} \nTo: ${formData.dropoff || 'TBD'}`}
Date: ${formData.date} @ ${formData.time}
${activeTab === 'hourly' ? `Duration: ${formData.hours} Hours` : ''}
💰 Est. Price: ${quote.toLocaleString()} RWF
    `.trim();
    window.open(`https://wa.me/250788123456?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <section id="book" className="w-full py-16 px-4 bg-gray-50/50">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 h-auto lg:h-[700px]">
        
        {/* LEFT: THE SMART FORM */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full">
          <div className="p-6 pb-2 border-b border-gray-100/50">
            <h2 className="text-2xl font-bold mb-1">Book your ride</h2>
            <p className="text-muted-foreground text-sm">Select your journey type below.</p>
          </div>

          <Tabs defaultValue="city" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 rounded-xl">
                <TabsTrigger value="city">City / Airport</TabsTrigger>
                <TabsTrigger value="hourly">Hourly Hire</TabsTrigger>
                <TabsTrigger value="country">Expeditions</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              
              {/* TAB 1: CITY / AIRPORT */}
              <TabsContent value="city" className="space-y-5 mt-0">
                {/* Service Selector Pills */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "airport", label: "Airport", icon: Plane },
                    { id: "city_tour", label: "City Tour", icon: MapIcon },
                    { id: "inter_city", label: "A to B", icon: Car },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setFormData({ ...formData, serviceType: s.id })}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                        formData.serviceType === s.id 
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20" 
                          : "border-gray-100 hover:border-primary/30 hover:bg-gray-50"
                      }`}
                    >
                      <s.icon className="w-5 h-5 mb-1.5" />
                      <span className="text-xs font-bold">{s.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pickup Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder={formData.serviceType === 'airport' ? "e.g. Flight WB402 or Kigali Airport" : "Enter pickup address"} 
                        className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        onChange={(e) => setFormData({...formData, pickup: e.target.value})}
                      />
                    </div>
                  </div>

                  {formData.serviceType !== 'city_tour' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Drop-off Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="Enter destination" 
                          className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                          onChange={(e) => setFormData({...formData, dropoff: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 2: HOURLY */}
              <TabsContent value="hourly" className="space-y-5 mt-0">
                <div className="p-4 bg-yellow-50/50 rounded-xl border border-yellow-100/50 flex gap-3">
                  <Info className="w-5 h-5 text-yellow-600 shrink-0" />
                  <p className="text-xs text-yellow-800 leading-relaxed">
                    <strong>Flexible Chauffeur:</strong> The driver stays with you for meetings, shopping, or events. Fuel included within Kigali.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Pickup Location</Label>
                  <Input 
                    placeholder="Where do we start?" 
                    className="bg-gray-50 border-gray-200" 
                    onChange={(e) => setFormData({...formData, pickup: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                   <Label>Duration</Label>
                   <Select onValueChange={(v) => setFormData({...formData, hours: v})} defaultValue="3">
                    <SelectTrigger className="bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3,4,5,6,8,10,12].map(h => (
                        <SelectItem key={h} value={h.toString()}>{h} Hours {h===3 && "(Min)"}</SelectItem>
                      ))}
                    </SelectContent>
                   </Select>
                </div>
              </TabsContent>

              {/* TAB 3: COUNTRYSIDE (VISUAL CARDS) */}
              <TabsContent value="country" className="space-y-3 mt-0">
                {COUNTRYSIDE_TRIPS.map((trip) => (
                  <button 
                    key={trip.id}
                    onClick={() => handleTripSelect(trip)}
                    className={`w-full flex items-center gap-4 p-2.5 rounded-xl border transition-all text-left group relative overflow-hidden
                      ${selectedTrip?.id === trip.id 
                        ? "border-primary bg-primary/5 ring-1 ring-primary" 
                        : "border-gray-100 hover:border-primary/50 hover:bg-gray-50"}`}
                  >
                    <div className="w-16 h-16 rounded-lg bg-gray-200 shrink-0 overflow-hidden relative shadow-sm">
                       {/* Image Placeholder */}
                       <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${trip.img}')`}} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm truncate">{trip.title}</span>
                        <span className="text-xs font-bold text-primary shrink-0">{trip.price.toLocaleString()} RWF</span>
                      </div>
                      <div className="flex items-center text-[10px] text-muted-foreground gap-3">
                         <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">Premium 4x4</span>
                      </div>
                    </div>
                    {selectedTrip?.id === trip.id && <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary" />}
                  </button>
                ))}
              </TabsContent>

              {/* SHARED FIELDS (Date & Vehicle) */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                 <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500">Date & Time</Label>
                    <div className="flex gap-2">
                       <Input type="date" className="bg-gray-50 text-xs px-2" onChange={(e) => setFormData({...formData, date: e.target.value})} />
                       <Input type="time" className="bg-gray-50 text-xs px-2" onChange={(e) => setFormData({...formData, time: e.target.value})} />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500">Vehicle Class</Label>
                    <Select onValueChange={(v) => setFormData({...formData, vehicle: v})} defaultValue="standard">
                      <SelectTrigger className="bg-gray-50 border-gray-200 text-xs h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (Sedan)</SelectItem>
                        <SelectItem value="comfort">Comfort (SUV/Van)</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
              </div>
            </div>

            {/* FORM FOOTER */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 mt-auto">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500 font-medium">Estimated Total</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary block leading-none">{quote.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">RWF / All Inclusive</span>
                </div>
              </div>
              <Button 
                onClick={handleWhatsApp}
                className="w-full rounded-xl h-12 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Book via WhatsApp <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </Tabs>
        </div>

        {/* RIGHT: MAP WIDGET */}
        <div className="hidden lg:block h-full min-h-[500px] rounded-3xl overflow-hidden shadow-xl border border-white/20 relative bg-white">
          <Suspense fallback={<div className="w-full h-full bg-gray-100 animate-pulse" />}>
            <MapWidget center={mapCenter} zoom={mapZoom} markers={markers} />
          </Suspense>
          
          {/* Map Floating Card */}
          <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100 z-[400] max-w-[240px] animate-in slide-in-from-top-4">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                   <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                   <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Destination</p>
                   <p className="text-sm font-bold truncate w-32">{activeTab === 'country' && selectedTrip ? selectedTrip.title : (formData.dropoff || "Select on form")}</p>
                </div>
             </div>
          </div>
        </div>

      </div>
    </section>
  );
}