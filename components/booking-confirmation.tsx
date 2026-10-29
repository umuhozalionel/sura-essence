"use client";

import Image from "next/image";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle, Home, MessageCircle, Plane, RotateCcw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { BookingBrand } from "@/lib/types";
import type { IwacuSpotlight } from "@/lib/cms/site-data";

/*
 * Where a website booking lands once it's sent (after WhatsApp opens in its own
 * tab): /movana/book/confirmation or /iwacu/reserve/confirmation, each in its
 * brand's colours. The query carries ?ref=A1B2C3&service=airport&date=2026-11-02.
 *
 * Each brand points to the other: an Iwacu booking offers an airport pickup on
 * its first day, a Movana airport transfer offers two Iwacu experiences.
 * Words: BookingConfirmation (Movana) and ReserveConfirmation (Iwacu).
 */

const BRAND: Record<BookingBrand, { messages: "BookingConfirmation" | "ReserveConfirmation"; home: string; again: string }> = {
  movana: { messages: "BookingConfirmation", home: "/movana", again: "/movana/book" },
  iwacu: { messages: "ReserveConfirmation", home: "/iwacu", again: "/iwacu/reserve" },
};

function Content({ brand, highlights }: { brand: BookingBrand; highlights: IwacuSpotlight[] }) {
  const b = BRAND[brand];
  const t = useTranslations(b.messages);
  const params = useSearchParams();
  const ref = params.get("ref") || t("unknownId");
  const service = params.get("service");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.get("date") ?? "") ? params.get("date")! : "";
  // Corporate and custom itinerary requests get a quote; everything else was priced when it was sent.
  const quote = service === "corporate" || service === "custom_itinerary";

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-xl shadow-black/10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mb-6 text-muted-foreground">{t(quote ? "quoteText" : "text")}</p>

        <div className="mb-6 rounded-xl bg-muted p-4">
          <p className="mb-1 text-sm text-muted-foreground">{t("idLabel")}</p>
          <p className="font-mono text-xl font-bold text-foreground">{ref}</p>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-xl bg-primary/5 p-4 text-left">
          <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-semibold text-foreground">{t("whatsappTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("whatsappText")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={b.home}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            {t("home")}
          </Link>
          <Link
            href={b.again}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border px-5 text-xs font-extrabold uppercase tracking-widest text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t("bookAnother")}
          </Link>
        </div>
      </div>

      {/* Iwacu → Movana: a pickup on the day they arrive. */}
      {brand === "iwacu" && (
        <Link
          href={`/movana/book?tab=city&serviceType=airport${date ? `&date=${date}` : ""}`}
          className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-lg shadow-black/5 transition-colors hover:border-primary"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Plane className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold text-foreground">{t("pickupTitle")}</span>
            <span className="block text-sm text-muted-foreground">{t("pickupText")}</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      )}

      {/* Movana airport transfer → two Iwacu experiences. */}
      {brand === "movana" && service === "airport" && highlights.length > 0 && (
        <section aria-labelledby="cross-sell" className="rounded-2xl border border-border bg-card p-5 shadow-lg shadow-black/5">
          <h2 id="cross-sell" className="font-extrabold text-foreground">{t("crossSellTitle")}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{t("crossSellText")}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {highlights.map((h) => (
              <li key={h.slug} data-brand="iwacu">
                <Link href={h.href} className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary">
                  <span className="relative block aspect-[16/10] bg-muted">
                    <Image src={h.image} alt="" fill sizes="(min-width: 640px) 16rem, 100vw" className="object-cover" />
                  </span>
                  <span className="block p-3">
                    <span className="block text-sm font-extrabold text-foreground">{h.title}</span>
                    <span className="block text-xs text-muted-foreground">{h.when}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function BookingConfirmation({ brand, highlights = [] }: { brand: BookingBrand; highlights?: IwacuSpotlight[] }) {
  const t = useTranslations(BRAND[brand].messages);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Suspense fallback={<p className="text-center text-muted-foreground">{t("loading")}</p>}>
        <Content brand={brand} highlights={highlights} />
      </Suspense>
    </div>
  );
}
