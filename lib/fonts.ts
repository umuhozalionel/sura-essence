import { Manrope } from "next/font/google";

// The one Manrope instance for the whole site. Import this instead of calling
// Manrope() in a component: every call creates its own font family and files,
// which then load (and swap in) at different moments.
export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});
