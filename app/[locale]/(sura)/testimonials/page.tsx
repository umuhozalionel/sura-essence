import { setRequestLocale } from "next-intl/server";
import { TestimonialsWall } from "@/components/testimonials-wall";
import { pageMetadata } from "@/lib/brands/metadata";

export const generateMetadata = pageMetadata("Hub.pages", "testimonials");

/** /testimonials: every approved guest story, and a way to add your own. */
export default async function TestimonialsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TestimonialsWall />;
}
