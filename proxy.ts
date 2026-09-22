import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 name for middleware. Sends every visitor to /en/... or /fr/...
export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next.js internals and files with an extension (images, PDFs, favicon…)
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
