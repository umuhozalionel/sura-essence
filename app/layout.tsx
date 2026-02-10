import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SURA Essence — Your Journey, Welcomed",
  description:
    "Premium transportation services in Rwanda. Airport transfers, city rides, and hourly packages with professional drivers.",
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
    <html lang="en" className={geist.className}>
      <body className="min-h-screen w-full text-foreground antialiased font-sans bg-white selection:bg-primary/20 selection:text-black">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-white focus:text-indigo-600 focus:px-3 focus:py-2 focus:rounded z-50"
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