"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, MessageCircle, Home, Car } from "lucide-react"
import { Suspense } from "react"

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("id") || "Unknown"

  return (
    <main className="min-h-screen py-8 px-4 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center">
          {/* Success icon */}
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h1>

          <p className="text-muted-foreground mb-6">
            Thank you for choosing SURA Essence. Your ride has been booked successfully.
          </p>

          {/* Booking ID */}
          <div className="bg-muted rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-1">Your Booking ID</p>
            <p className="text-xl font-mono font-bold text-foreground">{bookingId}</p>
          </div>

          {/* WhatsApp notice */}
          <div className="flex items-start gap-3 text-left bg-primary/5 rounded-lg p-4 mb-6">
            <MessageCircle className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">We'll message you on WhatsApp</p>
              <p className="text-sm text-muted-foreground">
                Expect a confirmation message with your driver details before your ride.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/book">
                <Car className="w-4 h-4 mr-2" />
                Book Another Ride
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen py-8 px-4 flex items-center justify-center">
          <div className="text-center">Loading confirmation...</div>
        </main>
      }
    >
      <ConfirmationContent />
    </Suspense>
  )
}
