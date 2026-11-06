import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Images } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getTripPage } from "@/lib/cms/trip-pages-server";
import { hasRecap, sizedPhoto } from "@/lib/cms/trips";
import { getSiteTrips } from "@/lib/cms/trips-server";

type Props = { params: Promise<{ locale: string; place: string }> };

// PICTURE, for Lionel to place: the top photo for a trip that has no photo of its own.
const FALLBACK_IMAGE = "/backgrounds/winding-road.jpg";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, place: id } = await params;
  const trip = (await getSiteTrips(locale)).find((x) => x.id === id);
  if (!trip || !hasRecap(trip)) return {};
  const t = (await getTripPage(id, locale)).translator("Trips");
  return { title: t("recap.metaTitle", { name: trip.name }), description: t("recap.metaDescription", { name: trip.name }) };
}

/** /iwacu/trips/<trip>/recap: the photos uploaded to this trip in Admin → Trips, newest first. */
export default async function TripRecapPage({ params }: Props) {
  const { locale, place: id } = await params;
  setRequestLocale(locale);
  const place = (await getSiteTrips(locale)).find((x) => x.id === id);
  if (!place || !hasRecap(place)) notFound();
  const t = (await getTripPage(id, locale)).translator("Trips");
  const name = place.name;

  const backLink = "inline-flex min-h-12 items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative flex h-[40vh] min-h-[300px] items-center justify-center overflow-hidden bg-foreground pt-[var(--header-h)]">
        <Image src={place.image ?? FALLBACK_IMAGE} alt="" fill priority unoptimized={place.image?.startsWith("https://")} sizes="100vw" className="object-cover" />
        <span aria-hidden="true" className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-3 px-6 text-center md:px-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-secondary">{t("recap.button")}</span>
          <h1 className="text-4xl font-extrabold uppercase leading-[0.95] tracking-tighter text-white md:text-6xl">{name}</h1>
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-white md:text-base">{t("recap.intro", { name })}</p>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-12 px-6 py-10 md:px-10 md:py-14">
        <nav className="flex flex-wrap gap-x-6">
          <Link href="/iwacu/trips" className={backLink}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("recap.allTrips")}
          </Link>
          {place.href && (
            <Link href={place.href} className={backLink}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {name}
            </Link>
          )}
        </nav>

        {place.photos.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <Images className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-extrabold tracking-tight">{t("recap.emptyTitle")}</h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{t("recap.emptyText", { name })}</p>
          </div>
        )}

        {place.photos.length > 0 && (
          <div className="columns-2 gap-4 lg:columns-4">
            {place.photos.map((photo) => (
              <figure key={photo.id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-muted/70">
                {/* Plain <img>: Cloudinary already sizes these and picks the format. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sizedPhoto(photo.url, 800)} alt={name} width={photo.width || undefined} height={photo.height || undefined} loading="lazy" decoding="async" className="h-auto w-full" />
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
