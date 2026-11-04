import type { NavItem } from ".";

/**
 * SURA Essence's header: the same menus and Header.nav / Header.menu words as
 * before the brand split, now leading into Movana and Iwacu pages.
 */
export const SURA_NAV: NavItem[] = [
  {
    type: "mega",
    id: "experiences",
    // Tours lead the bar so they're one hover away on every page.
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
    id: "carsTransfers",
    links: [
      { id: "cityRide", href: "/movana/book?tab=city&serviceType=inter_city" },
      { id: "interCity", href: "/movana/airport-transfers" },
      { id: "carRental", href: "/movana/driver-hire" },
    ],
  },
  {
    type: "mega",
    id: "activities",
    links: [
      { id: "upcomingEvents", href: "/iwacu/experiences/upcoming" },
      { id: "pastEvents", href: "/iwacu/experiences/past" },
      { id: "suraSeasons", href: "/iwacu/experiences" },
    ],
  },
  { type: "link", id: "howItWorks", href: "/iwacu/kigali-guide" },
  { type: "link", id: "pricing", href: "/movana/fleet" },
  { type: "link", id: "gallery", href: "/iwacu/experiences/gallery" },
  { type: "link", id: "contact", href: "/contact" },
];
