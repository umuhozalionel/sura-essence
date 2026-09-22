// The real layout (fonts, <html lang>, translations) now lives in app/[locale]/layout.tsx.
// This file only passes pages through, as next-intl recommends when using a [locale] folder.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
