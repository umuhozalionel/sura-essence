import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// Loads the right messages file for each request.
// `requestLocale` is the [locale] segment of the URL. (On Next.js 16.3+ this can move to
// `next/root-params`; the approach below is the one that works on this project's Next 16.1.)
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // Format dates and times in Rwanda time for every visitor, and avoid server/browser mismatches.
    timeZone: "Africa/Kigali",
  };
});
