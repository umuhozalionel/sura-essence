import type { NavItem } from ".";

// SURA Movana: rides, transfers and drivers. Words live in messages/*.json under Brands.movana.nav.
// These pages arrive in Phase 2; until then the links lead to the catch-all 404.
export const MOVANA_NAV: NavItem[] = [
  { type: "link", id: "book", href: "/movana/book" },
  { type: "link", id: "airportTransfers", href: "/movana/airport-transfers" },
  { type: "link", id: "driverHire", href: "/movana/driver-hire" },
  { type: "link", id: "fleet", href: "/movana/fleet" },
  { type: "link", id: "corporate", href: "/movana/corporate" },
  { type: "link", id: "tripAlerts", href: "/movana/trip-alerts" },
];
