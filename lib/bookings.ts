// Booking storage utilities
// Currently uses localStorage, can be swapped for Postgres/Firebase

import type { Booking, BookingFormData } from "./types"
import { calculateQuote } from "./pricing"

const STORAGE_KEY = "SURA_bookings"

function generateId(): string {
  return `IKZ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
}

export function getBookings(): Booking[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function saveBooking(formData: BookingFormData): Booking {
  const bookings = getBookings()

  const newBooking: Booking = {
    id: generateId(),
    ...formData,
    quoteAmount: calculateQuote(formData.serviceType, formData.vehicleTier),
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  bookings.unshift(newBooking)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))

  return newBooking
}

export function updateBookingStatus(id: string, status: Booking["status"]): Booking | null {
  const bookings = getBookings()
  const index = bookings.findIndex((b) => b.id === id)

  if (index === -1) return null

  bookings[index].status = status
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))

  return bookings[index]
}

export function exportBookingsCSV(): string {
  const bookings = getBookings()
  const headers = [
    "ID",
    "Name",
    "Phone",
    "Email",
    "Pickup",
    "Dropoff",
    "Date",
    "Time",
    "Service",
    "Vehicle",
    "Passengers",
    "Quote",
    "Status",
    "Created",
  ]

  const rows = bookings.map((b) =>
    [
      b.id,
      b.name,
      b.phone,
      b.email,
      b.pickup,
      b.dropoff,
      b.date,
      b.time,
      b.serviceType,
      b.vehicleTier,
      b.passengers,
      b.quoteAmount,
      b.status,
      b.createdAt,
    ].join(","),
  )

  return [headers.join(","), ...rows].join("\n")
}
