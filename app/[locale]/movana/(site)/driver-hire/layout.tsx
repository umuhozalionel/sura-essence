import { pageMetadata } from "@/lib/brands/metadata";

// The page itself is a client component, so its title and description are set here.
export const generateMetadata = pageMetadata("Brands.movana.meta", "driverHire");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
