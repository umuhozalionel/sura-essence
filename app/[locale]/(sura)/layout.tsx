import { BrandChrome } from "@/components/chrome/brand-chrome";

/** SURA Essence, the parent brand: the hub, contact and anything not under /movana or /iwacu. */
export default function SuraLayout({ children }: { children: React.ReactNode }) {
  return <BrandChrome brand="sura">{children}</BrandChrome>;
}
