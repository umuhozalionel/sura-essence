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
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative h-[75vh] min-h-[480px] pt-[var(--header-h)] flex items-center justify-center overflow-hidden bg-foreground">
        <Image src="/backgrounds/winding-road.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <span aria-hidden="true" className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 text-center px-6 md:px-10 max-w-5xl mx-auto flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 bg-black/50 backdrop-blur-md rounded-2xl">
            <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
            <span className="text-xs font-bold text-white tracking-widest uppercase">{t("list.eyebrow")}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white uppercase tracking-tighter leading-[0.95]">{t("list.title")}</h1>
          <p className="text-white font-medium text-base md:text-lg max-w-2xl leading-relaxed">{t("list.intro")}</p>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-24">
        <div className="grid gap-6 md:grid-cols-3">
          {TRIPS.map((trip) => {
            const live = trip.status === "live";
            const card = (
              <>
                <div className="relative aspect-[4/3] overflow-hidden bg-muted/70">
                  <Image src={trip.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw"
                    className={`object-cover transition-transform duration-700 ${live ? "group-hover:scale-105" : "grayscale opacity-70"}`} />
                  {!live && (
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-foreground">
                      <Wrench className="h-3.5 w-3.5" aria-hidden="true" /> {t("list.maintenance")}
                    </span>
                  )}
                </div>
                <div className="p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight text-foreground">{t(`${trip.id}.name`)}</h2>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{t(`${trip.id}.summary`)}</p>
                  {live && (
                    <p className="mt-6 h-12 rounded-xl bg-primary group-hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-wide text-white">
                      {t("list.build")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </p>
                  )}
                </div>
              </>
            );
            const cls = "group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-black/5 shadow-xl shadow-black/5";
            return trip.href ? (
              <Link key={trip.id} href={trip.href} className={`${cls} hover:shadow-2xl transition-shadow duration-300`}>{card}</Link>
            ) : (
              <div key={trip.id} className={cls}>{card}</div>
            );
          })}
        </div>

        <section className="mt-12 rounded-2xl bg-foreground p-8 md:p-12 text-white flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter leading-[0.95]">{t("list.customTitle")}</h2>
            <p className="mt-3 text-sm md:text-base text-white/75 leading-relaxed">{t("list.customText")}</p>
          </div>
          <Link href="/iwacu/reserve?tab=custom" className="shrink-0 h-14 px-8 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold uppercase tracking-widest text-xs inline-flex items-center justify-center gap-2 transition-colors">
            {t("list.customCta")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
