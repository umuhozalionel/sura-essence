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

const nextConfig: NextConfig = {
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
