import { BrandChrome } from "@/components/chrome/brand-chrome";

/** Iwacu pages with the Iwacu header and footer. */
export default function IwacuSiteLayout({ children }: { children: React.ReactNode }) {
  return <BrandChrome brand="iwacu">{children}</BrandChrome>;
}
