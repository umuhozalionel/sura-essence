// Booking types for SURA Essence
export interface Booking {
  id: string
  name: string
  phone: string
  email: string
  pickup: string
  dropoff: string
  date: string
  time: string
  serviceType: "airport" | "city" | "hourly" | "package"
  vehicleTier: "standard" | "comfort" | "executive"
  passengers: number
  notes: string
  quoteAmount: number
  status: "pending" | "confirmed" | "completed" | "cancelled"
  createdAt: string
}

export interface BookingFormData {
  name: string
  phone: string
  email: string
  pickup: string
  dropoff: string
  date: string
  time: string
  serviceType: "airport" | "city" | "hourly" | "package"
  vehicleTier: "standard" | "comfort" | "executive"
  passengers: number
  notes: string
}
