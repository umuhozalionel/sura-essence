import Image from "next/image";
import { ArrowLeft, ArrowRight, Footprints, Milk, Sparkles, Utensils, Wrench } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/brands/metadata";

export const generateMetadata = pageMetadata("Brands.iwacu.meta", "tripBigogwe");

// PICTURE, for Lionel to place: the top photo and the scenery. Files live in public/.
const HERO_IMAGE = "/locations/bigogwe-hills.jpg";
const SCENERY = [
  { id: "hills", src: "/activities/bigogwe/cover.jpg" },
  { id: "forest", src: "/activities/bigogwe/3.jpg" },
  { id: "river", src: "/activities/bigogwe/4.jpg" },
  { id: "climb", src: "/activities/bigogwe/bigogwe_march.jpg" },
] as const;

// From the Discover Bigogwe flyer. Words: Trips.bigogwe.activities.<id>.
const ACTIVITIES = [
  { id: "hiking", icon: Footprints },
  { id: "cows", icon: Milk },
  { id: "food", icon: Utensils },
  { id: "acrobatics", icon: Sparkles },
] as const;

/** /iwacu/trips/bigogwe: the place and what we did there. It can't be reserved yet, so there's no price or form. */
export default async function BigogweTripPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Trips.bigogwe");
  const tList = await getTranslations("Trips.list");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative h-[55vh] min-h-[420px] short:min-h-[300px] pt-[var(--header-h)] flex items-center justify-center overflow-hidden bg-foreground">
        <Image src={HERO_IMAGE} alt={t("heroAlt")} fill priority sizes="100vw" className="object-cover" />
        <span aria-hidden="true" className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 text-center px-6 md:px-10 max-w-5xl mx-auto flex flex-col items-center gap-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 bg-black/50 backdrop-blur-md rounded-2xl text-xs font-bold text-white tracking-widest uppercase">
            <Wrench className="h-3.5 w-3.5" aria-hidden="true" /> {tList("maintenance")}
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white uppercase tracking-tighter leading-[0.95]">{t("name")}</h1>
          <p className="text-white font-medium text-base md:text-lg max-w-2xl leading-relaxed">{t("tagline")}</p>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-14 flex flex-col gap-12">
        <Link href="/iwacu/trips" className="self-start inline-flex min-h-12 items-center gap-2 text-xs font-extrabold text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("back")}
        </Link>

        <section aria-labelledby="bigogwe-scenery">
          <h2 id="bigogwe-scenery" className="text-3xl md:text-4xl font-extrabold tracking-tighter leading-tight">{t("sceneryTitle")}</h2>
          <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
            {SCENERY.map(({ id, src }) => (
              <div key={id} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted/70">
                <Image src={src} alt={t(`scenery.${id}`)} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="bigogwe-activities">
          <h2 id="bigogwe-activities" className="text-3xl md:text-4xl font-extrabold tracking-tighter leading-tight">{t("activitiesTitle")}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ACTIVITIES.map(({ id, icon: Icon }) => (
              <li key={id} className="rounded-2xl bg-card ring-1 ring-black/5 p-6">
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <p className="mt-3 text-base font-extrabold text-foreground">{t(`activities.${id}`)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="bigogwe-days">
          <h2 id="bigogwe-days" className="text-3xl md:text-4xl font-extrabold tracking-tighter leading-tight">{t("daysTitle")}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(["day1", "day2"] as const).map((day) => (
              <div key={day} className="rounded-2xl bg-card ring-1 ring-black/5 p-6">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-primary">{t(`${day}.title`)}</h3>
                <ul className="mt-3 space-y-2 text-sm text-foreground">
                  {(t.raw(`${day}.items`) as string[]).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-foreground p-8 md:p-12 text-white flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl text-lg md:text-xl font-extrabold tracking-tight">{t("notOpen")}</p>
          <Link href="/iwacu/experiences/discover-bigogwe-2026" className="shrink-0 h-14 px-8 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold uppercase tracking-widest text-xs inline-flex items-center justify-center gap-2 transition-colors">
            {t("pastCta")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
