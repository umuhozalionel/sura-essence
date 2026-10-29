import type { NavItem } from ".";

// SURA Iwacu: tours, events and Kigali know-how. Words live in messages/*.json
// under Brands.iwacu.nav and Brands.iwacu.menu.
// Itineraries (/iwacu/itineraries) joins once its page exists (Phase 3).
export const IWACU_NAV: NavItem[] = [
  { type: "link", id: "experiences", href: "/iwacu/experiences" },
  {
    type: "mega",
    id: "kigaliTours",
    links: [
      { id: "tours", href: "/iwacu/kigali-tours" },
      { id: "toursHistory", href: "/iwacu/kigali-tours?category=history" },
      { id: "toursCulture", href: "/iwacu/kigali-tours?category=culture" },
      { id: "toursAdventure", href: "/iwacu/kigali-tours?category=adventure" },
      { id: "toursStrategy", href: "/iwacu/kigali-tours?category=strategy" },
    ],
  },
  {
    type: "mega",
    id: "events",
    links: [
      { id: "upcomingEvents", href: "/iwacu/events" },
      { id: "pastEvents", href: "/iwacu/events/past" },
    ],
  },
  { type: "link", id: "gallery", href: "/iwacu/gallery" },
  { type: "link", id: "kigaliGuide", href: "/iwacu/kigali-guide" },
  { type: "link", id: "reserve", href: "/iwacu/reserve" },
];
