import type { NavItem } from ".";

/**
 * SURA Essence's header, item for item the same as NAV_LINKS / MEGA_MENUS in
 * components/header.tsx (same URLs, same Header.nav / Header.menu keys), so
 * swapping that header for BrandHeader changes nothing on screen.
 */
export const SURA_NAV: NavItem[] = [
  {
    type: "mega",
    id: "experiences",
    // Tours lead the bar so they're one hover away on every page.
    links: [
      { id: "tours", href: "/tours" },
      { id: "toursHistory", href: "/tours?category=history" },
      { id: "toursCulture", href: "/tours?category=culture" },
      { id: "toursAdventure", href: "/tours?category=adventure" },
      { id: "toursStrategy", href: "/tours?category=strategy" },
    ],
  },
  {
    type: "mega",
    id: "carsTransfers",
    links: [
      { id: "cityRide", href: "/book?tab=city&serviceType=inter_city" },
      { id: "interCity", href: "/transfers" },
      { id: "carRental", href: "/driver" },
    ],
  },
  {
    type: "mega",
    id: "activities",
    links: [
      { id: "upcomingEvents", href: "/events" },
      { id: "pastEvents", href: "/events/past" },
      { id: "suraSeasons", href: "/activities" },
    ],
  },
  { type: "link", id: "howItWorks", href: "/how-it-works" },
  { type: "link", id: "pricing", href: "/pricing" },
  { type: "link", id: "gallery", href: "/gallery" },
  { type: "link", id: "contact", href: "/contact" },
];
