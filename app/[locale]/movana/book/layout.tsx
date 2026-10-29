import { sectionMetadata } from "@/lib/brands/metadata";

// The booking page is a client component, so its title and description are set here;
// sectionMetadata keeps "· SURA Movana" on the confirmation page below too.
export const generateMetadata = sectionMetadata("movana", "Brands.movana.meta", "book");

// The booking app brings its own frame: no Movana header or footer here.
export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <main id="main" className="w-full min-h-screen">{children}</main>;
}
