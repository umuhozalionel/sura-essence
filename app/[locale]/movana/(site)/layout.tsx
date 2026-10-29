import { BrandChrome } from "@/components/chrome/brand-chrome";

/** Movana pages with the Movana header and footer. The booking app (../book) brings its own frame. */
export default function MovanaSiteLayout({ children }: { children: React.ReactNode }) {
  return <BrandChrome brand="movana">{children}</BrandChrome>;
}
