import { pageMetadata } from "@/lib/brands/metadata";

// Title and description for the page below.
export const generateMetadata = pageMetadata("Brands.movana.meta", "tripAlerts");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
