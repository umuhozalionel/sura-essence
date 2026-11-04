import type { NavItem } from ".";

// SURA Iwacu: exactly three links. Words live in messages/*.json under
// Brands.iwacu.nav and Brands.iwacu.menu.
export const IWACU_NAV: NavItem[] = [
  {
    type: "mega",
    id: "experiences",
    links: [
      { id: "calendar", href: "/iwacu/experiences" },
      { id: "upcomingEvents", href: "/iwacu/experiences/upcoming" },
      { id: "pastEvents", href: "/iwacu/experiences/past" },
      { id: "gallery", href: "/iwacu/experiences/gallery" },
    ],
  },
  { type: "link", id: "trips", href: "/iwacu/trips" },
  {
    type: "mega",
    id: "kigaliTours",
    links: [
      { id: "tours", href: "/iwacu/kigali-tours" },
      { id: "toursHistory", href: "/iwacu/kigali-tours?category=history" },
      { id: "toursCulture", href: "/iwacu/kigali-tours?category=culture" },
      { id: "toursAdventure", href: "/iwacu/kigali-tours?category=adventure" },
      { id: "toursStrategy", href: "/iwacu/kigali-tours?category=strategy" },
      { id: "kigaliGuide", href: "/iwacu/kigali-guide" },
    ],
  },
];
