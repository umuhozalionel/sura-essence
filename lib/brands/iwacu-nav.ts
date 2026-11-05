import type { NavItem } from ".";

// SURA Iwacu: exactly three links. Words live in messages/*.json under
// Brands.iwacu.nav and Brands.iwacu.menu.
export const IWACU_NAV: NavItem[] = [
  { type: "link", id: "trips", href: "/iwacu/trips" },
  {
    type: "mega",
    id: "experiences",
    href: "/iwacu/experiences",
    links: [
      { id: "calendar", href: "/iwacu/experiences" },
      { id: "upcomingEvents", href: "/iwacu/experiences/upcoming" },
      { id: "pastEvents", href: "/iwacu/experiences/past" },
      { id: "gallery", href: "/iwacu/experiences/gallery" },
    ],
  },
  {
    type: "mega",
    id: "kigaliTours",
    href: "/iwacu/kigali-tours",
    links: [
      { id: "tours", href: "/iwacu/kigali-tours" },
      { id: "kigaliGuide", href: "/iwacu/kigali-guide" },
      { id: "rwandaStory", href: "/iwacu/rwanda-story" },
    ],
  },
];
