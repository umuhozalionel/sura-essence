// app/book/page.tsx
"use client";

import Link from "next/link";
import BookingForm from "@/components/booking-form";
import { ArrowLeft, Car } from "lucide-react";

export default function BookPage() {
  return (
    <main
      className="min-h-screen py-8"
      style={{
        backgroundImage: "url('/bookings/booking-bg.jpg')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-foreground/90 bg-transparent backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="flex items-center gap-2 text-foreground/90 bg-transparent backdrop-blur-sm px-2 py-1 rounded">
            <div className="w-8 h-8 rounded-full bg-primary/95 flex items-center justify-center">
              <Car className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">SURA Essence</span>
          </div>
        </div>

        <BookingForm />
      </div>
    </main>
  );
}