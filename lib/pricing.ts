// SURA Essence Pricing Logic
// Prices in RWF (Rwandan Francs)

export const PRICING = {
  airport: {
    base: 25000,
    perKm: 0, // flat rate for airport
  },
  city: {
    base: 5000,
    perKm: 500,
  },
  hourly: {
    "2hr": 30000,
    "4hr": 55000,
    "8hr": 100000,
  },
  package: {
    halfDay: 60000,
    fullDay: 110000,
  },
  vehicleMultiplier: {
    standard: 1,
    comfort: 1.3,
    executive: 1.8,
  },
}

export function calculateQuote(
  serviceType: "airport" | "city" | "hourly" | "package",
  vehicleTier: "standard" | "comfort" | "executive",
  distanceKm = 10, // default estimate
): number {
  const multiplier = PRICING.vehicleMultiplier[vehicleTier]

  switch (serviceType) {
    case "airport":
      return Math.round(PRICING.airport.base * multiplier)
    case "city":
      return Math.round((PRICING.city.base + PRICING.city.perKm * distanceKm) * multiplier)
    case "hourly":
      return Math.round(PRICING.hourly["4hr"] * multiplier)
    case "package":
      return Math.round(PRICING.package.halfDay * multiplier)
    default:
      return 0
  }
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
  }).format(amount)
}
