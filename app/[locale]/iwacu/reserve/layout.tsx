import { sectionMetadata } from "@/lib/brands/metadata";

// sectionMetadata keeps "· SURA Iwacu" on the confirmation page below too.
export const generateMetadata = sectionMetadata("iwacu", "Brands.iwacu.meta", "reserve");

// Like /movana/book, the booking page brings its own frame: no Iwacu header or footer here.
export default function ReserveLayout({ children }: { children: React.ReactNode }) {
  return <main id="main" className="w-full min-h-screen">{children}</main>;
}
