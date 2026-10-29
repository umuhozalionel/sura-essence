import type { NavItem } from ".";

// SURA Movana: rides, transfers and drivers. Words live in messages/*.json under Brands.movana.nav.
export const MOVANA_NAV: NavItem[] = [
  { type: "link", id: "book", href: "/movana/book" },
  // Corporate transport is a request on the booking page (quoted by the team).
  { type: "link", id: "corporate", href: "/movana/book?tab=corporate" },
  { type: "link", id: "airportTransfers", href: "/movana/airport-transfers" },
  { type: "link", id: "driverHire", href: "/movana/driver-hire" },
  { type: "link", id: "fleet", href: "/movana/fleet" },
  { type: "link", id: "tripAlerts", href: "/movana/trip-alerts" },
];
