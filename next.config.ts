import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Points next-intl at i18n/request.ts
const withNextIntl = createNextIntlPlugin();

/**
 * The three hand-made season pages became /activities/<slug> (one page per
 * experience, edited in Admin → Experiences). Keep in step with LEGACY_TRIPS
 * in lib/cms/legacy.ts. Strict 301s, with and without the language prefix.
 */
const SEASON_REDIRECTS: [string, string][] = [
  ["activity-season1", "discover-bigogwe-2026"],
  ["activity-season2", "akagera-national-park-2026"],
  ["activity-season3", "nyungwe-forest-escape-2026"],
];

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
  async redirects() {
    return SEASON_REDIRECTS.flatMap(([from, to]) => [
      { source: `/:locale(en|fr)/activities/${from}`, destination: `/:locale/activities/${to}`, statusCode: 301 as const },
      { source: `/activities/${from}`, destination: `/activities/${to}`, statusCode: 301 as const },
    ]);
  },
  env: {
    // Lets the browser know whether live testimonials are switched on, without
    // exposing the connection string itself (MONGODB_URI stays on the server).
    TESTIMONIALS_LIVE: process.env.MONGODB_URI ? "true" : "false",
  },
};

export default withNextIntl(nextConfig);
