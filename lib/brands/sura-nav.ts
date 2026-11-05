import type { NavItem } from ".";

// SURA Essence's header: who we are and how to reach us. Rides and tours live under Movana and Iwacu.
// Words live in messages/*.json under Header.nav.
export const SURA_NAV: NavItem[] = [
  { type: "link", id: "home", href: "/" },
  { type: "link", id: "about", href: "/about" },
  { type: "link", id: "contact", href: "/contact" },
];
