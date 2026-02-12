import type { Metadata } from "next";
import { Manrope } from "next/font/google"; // Switched to Manrope for the Industrial aesthetic
import { Toaster } from "sonner";
import "./globals.css";

// Configure Manrope with the necessary weights for a premium look
const manrope = Manrope({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "SURA Essence | Premium Transport Rwanda", // Updated for branding
  description:
    "Bespoke city experiences, professional inter-city transfers, and private drivers in Rwanda.",
  generator: "Bravonet technologies",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/brand/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${manrope.className} min-h-screen w-full text-[#111827] antialiased bg-white selection:bg-[#C97C2F]/20`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-white focus:text-[#C97C2F] focus:px-3 focus:py-2 focus:rounded-xl z-50 border border-gray-100 shadow-xl"
        >
          Skip to content
        </a>

        <main id="main" className="w-full px-0 min-h-screen relative">
          {children}
        </main>

        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}