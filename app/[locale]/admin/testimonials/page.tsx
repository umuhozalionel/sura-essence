import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { isAdmin } from "@/lib/admin-auth";
import { TestimonialsAdmin } from "@/components/admin/testimonials-admin";
import { SessionGuard } from "@/components/admin/session-guard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("testimonials") };
}

/** Testimonials — approve customer stories for the website, or delete them. */
export default async function AdminTestimonialsPage() {
  if (!(await isAdmin())) return <SessionGuard />;
  return <TestimonialsAdmin />;
}
