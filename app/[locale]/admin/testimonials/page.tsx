import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requirePage } from "@/lib/admin-page";
import { TestimonialsAdmin } from "@/components/admin/testimonials-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("testimonials") };
}

/** Testimonials — approve customer stories for the website, or delete them. */
export default async function AdminTestimonialsPage() {
  const access = await requirePage("testimonials:manage");
  if (!access.ok) return access.block;
  return <TestimonialsAdmin />;
}
