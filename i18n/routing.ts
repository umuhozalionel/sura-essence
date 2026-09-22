import { defineRouting } from "next-intl/routing";

// Every page lives under /en/... or /fr/...
// Visiting a URL without a prefix (e.g. /contact) redirects to the visitor's language,
// based on their previous choice (cookie) or browser language, falling back to English.
export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
});
