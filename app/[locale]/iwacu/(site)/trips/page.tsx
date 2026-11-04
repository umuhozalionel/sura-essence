import Image from "next/image";
import { ArrowRight, Wrench } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/brands/metadata";
import { TRIPS } from "@/lib/trips";

export const generateMetadata = pageMetadata("Brands.iwacu.meta", "trips");

/** /iwacu/trips: every trip built around a customer. Akagera is live; the others follow on the same template. */
export default async function TripsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Trips");

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 pb-24 pt-[calc(var(--header-h)+3rem)]">
      <p className="text-xs font-extrabold uppercase tracking-widest text-primary">{t("list.eyebrow")}</p>
      <h1 className="mt-2 text-4xl md:text-6xl font-extrabold tracking-tighter text-foreground">{t("list.title")}</h1>
      <p className="mt-3 max-w-3xl text-base text-muted-foreground">{t("list.intro")}</p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {TRIPS.map((trip) => {
          const card = (
            <>
              <div className="relative aspect-[4/3] bg-muted">
                <Image src={trip.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className={`object-cover ${trip.status === "live" ? "" : "grayscale opacity-70"}`} />
                {trip.status === "maintenance" && (
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-foreground">
                    <Wrench className="h-3.5 w-3.5" aria-hidden /> {t("list.maintenance")}
                  </span>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{t(`${trip.id}.name`)}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t(`${trip.id}.summary`)}</p>
                {trip.status === "live" && (
                  <p className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-primary">
                    {t("list.build")} <ArrowRight className="h-4 w-4" aria-hidden />
                  </p>
                )}
              </div>
            </>
          );
          const cls = "block overflow-hidden rounded-2xl bg-card ring-1 ring-black/5 shadow-xl shadow-black/5";
          return trip.href ? (
            <Link key={trip.id} href={trip.href} className={`${cls} hover:shadow-2xl transition-shadow`}>{card}</Link>
          ) : (
            <div key={trip.id} className={cls}>{card}</div>
          );
        })}
      </div>

      <section className="mt-10 rounded-2xl bg-foreground p-8 md:p-10 text-white flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{t("list.customTitle")}</h2>
          <p className="mt-2 text-sm text-white/75">{t("list.customText")}</p>
        </div>
        <Link href="/iwacu/reserve?tab=custom" className="shrink-0 h-14 px-8 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold uppercase tracking-widest text-xs inline-flex items-center justify-center gap-2">
          {t("list.customCta")} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
