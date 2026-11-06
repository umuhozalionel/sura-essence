import { redirect } from "@/i18n/navigation";

/** Bigogwe is under maintenance, with only its card on /iwacu/trips, so old links land there. */
export default async function BigogweTripPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/iwacu/trips?category=mountains", locale });
}
