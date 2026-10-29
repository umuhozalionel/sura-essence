import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Points next-intl at i18n/request.ts
const withNextIntl = createNextIntlPlugin();

/**
 * The three hand-made season pages became one page per experience, now at
 * /iwacu/experiences/<slug> (edited in Admin → Experiences). Keep in step with
 * LEGACY_TRIPS in lib/cms/legacy.ts. They go straight to the new address, so
 * there's no chain through /activities/<slug>.
 */
const SEASON_REDIRECTS: [string, string][] = [
  ["/activities/activity-season1", "/iwacu/experiences/discover-bigogwe-2026"],
  ["/activities/activity-season2", "/iwacu/experiences/akagera-national-park-2026"],
  ["/activities/activity-season3", "/iwacu/experiences/nyungwe-forest-escape-2026"],
];

/**
 * Pages that moved into the brands (October 2026). Order matters: the first
 * match wins, so specific paths come before the general ones. Query strings
 * pass through (e.g. /tours?category=history → /iwacu/kigali-tours?category=history).
 * ":slug([^/.]+)" skips files: /activities/akagera-recap.jpg is a photo in public/.
 */
const BRAND_MOVES: [string, string][] = [
  ...SEASON_REDIRECTS,
  // SURA Movana
  ["/book/:path*", "/movana/book/:path*"],
  ["/book", "/movana/book"],
  ["/transfers", "/movana/airport-transfers"],
  ["/driver", "/movana/driver-hire"],
  ["/pricing", "/movana/fleet"],
  ["/tripalerts", "/movana/trip-alerts"],
  // SURA Iwacu
  ["/activities/:slug([^/.]+)", "/iwacu/experiences/:slug"],
  ["/activities", "/iwacu/experiences"],
  ["/tours", "/iwacu/kigali-tours"],
  ["/events/past", "/iwacu/events/past"],
  ["/events", "/iwacu/events"],
  ["/gallery", "/iwacu/gallery"],
  ["/how-it-works", "/iwacu/kigali-guide"],
  // Never had a page; the Iwacu home lists the experiences.
  ["/itineraries", "/iwacu"],
];

/**
 * Tours, trips to a destination and event reservations moved from the Movana
 * booking form to SURA Iwacu's (October 2026, Phase 4). Old links that ask for
 * one of them by query go straight to /iwacu/reserve, query kept, which opens
 * the matching tab. Checked before BRAND_MOVES, so an old /book?tour=… link
 * doesn't take two hops.
 */
const IWACU_BOOKING_QUERIES: { type: "query"; key: string; value?: string }[] = [
  { type: "query", key: "serviceType", value: "city_tour" },
  { type: "query", key: "tab", value: "country|trips" },
  { type: "query", key: "tour" },
  { type: "query", key: "event" },
];
const OLD_BOOKING_PATHS = ["/movana/book", "/book"];

/**
 * Admin screens and admin API answers must never be stored by the browser or a
 * CDN: Back after signing out has to ask the server again. Next already sends this
 * for the (dynamic) admin pages; pinned here so a later change can't weaken it.
 */
const NO_STORE_HEADERS = [
  { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
  { key: "Vary", value: "Cookie" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:locale(en|fr)/admin", headers: NO_STORE_HEADERS },
      { source: "/:locale(en|fr)/admin/:path*", headers: NO_STORE_HEADERS },
      { source: "/admin", headers: NO_STORE_HEADERS },
      { source: "/admin/:path*", headers: NO_STORE_HEADERS },
      { source: "/api/admin/:path*", headers: NO_STORE_HEADERS },
    ];
  },
  // Strict 301s, with and without the language prefix. Without one, the visitor
  // then gets their language from proxy.ts, as for any unprefixed address.
  async redirects() {
    const toIwacu = OLD_BOOKING_PATHS.flatMap((from) =>
      IWACU_BOOKING_QUERIES.flatMap((query) => [
        { source: `/:locale(en|fr)${from}`, has: [query], destination: "/:locale/iwacu/reserve", statusCode: 301 as const },
        { source: from, has: [query], destination: "/iwacu/reserve", statusCode: 301 as const },
      ]),
    );
    return [
      ...toIwacu,
      ...BRAND_MOVES.flatMap(([from, to]) => [
        { source: `/:locale(en|fr)${from}`, destination: `/:locale${to}`, statusCode: 301 as const },
        { source: from, destination: to, statusCode: 301 as const },
      ]),
    ];
  },
  env: {
    // Lets the browser know whether live testimonials are switched on, without
    // exposing the connection string itself (MONGODB_URI stays on the server).
    TESTIMONIALS_LIVE: process.env.MONGODB_URI ? "true" : "false",
  },
};

export default withNextIntl(nextConfig);
