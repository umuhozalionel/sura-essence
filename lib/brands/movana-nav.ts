import type { NavItem } from ".";

// SURA Movana: rides, transfers and drivers. Words live in messages/*.json under Brands.movana.nav.
// Corporate (/movana/corporate) joins once its page exists (Phase 3).
export const MOVANA_NAV: NavItem[] = [
  { type: "link", id: "book", href: "/movana/book" },
  { type: "link", id: "airportTransfers", href: "/movana/airport-transfers" },
  { type: "link", id: "driverHire", href: "/movana/driver-hire" },
  { type: "link", id: "fleet", href: "/movana/fleet" },
  { type: "link", id: "tripAlerts", href: "/movana/trip-alerts" },
];
