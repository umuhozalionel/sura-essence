import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Points next-intl at i18n/request.ts
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  env: {
    // Lets the browser know whether live testimonials are switched on, without
    // exposing the connection string itself (MONGODB_URI stays on the server).
    TESTIMONIALS_LIVE: process.env.MONGODB_URI ? "true" : "false",
  },
};

export default withNextIntl(nextConfig);
