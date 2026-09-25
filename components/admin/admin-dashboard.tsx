"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, CalendarCheck, LogOut, MessageSquareQuote } from "lucide-react";
import { Link } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import { TestimonialsAdmin } from "./testimonials-admin";

// Bookings live in this browser's localStorage (lib/bookings.ts), so that panel
// is rendered in the browser only.
const BookingsPanel = dynamic(() => import("./bookings-panel").then((m) => m.BookingsPanel), { ssr: false });

type Tab = "testimonials" | "bookings";

export function AdminDashboard() {
  const t = useTranslations("Admin.top");
  const tt = useTranslations("Admin.testimonials");
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("testimonials");
  const [pending, setPending] = useState<number | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.refresh();
    }
  };

  const onSessionEnded = useCallback(() => {
    toast.error(tt("sessionExpired"));
    router.refresh();
  }, [router, tt]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number | null }[] = [
    { id: "testimonials", label: t("tabs.testimonials"), icon: <MessageSquareQuote className="h-4 w-4" aria-hidden />, badge: pending },
    { id: "bookings", label: t("tabs.bookings"), icon: <CalendarCheck className="h-4 w-4" aria-hidden /> },
  ];

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Top bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="SURA Essence"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0A1128] ring-1 ring-[#0A1128]/10 transition hover:bg-[#0A1128] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-[#0A1128] md:text-3xl">{t("heading")}</h1>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[#0A1128] ring-1 ring-[#0A1128]/10 transition hover:bg-[#0A1128] hover:text-white disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t("signOut")}
          </button>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label={t("heading")} className="mb-8 inline-flex rounded-full bg-white p-1 ring-1 ring-[#0A1128]/[0.08]">
          {tabs.map((item) => (
            <button
              key={item.id}
              id={`admin-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls={`admin-panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-bold transition ${
                tab === item.id ? "bg-[#0A1128] text-white" : "text-[#0A1128]/70 hover:text-[#0A1128]"
              }`}
            >
              {item.icon}
              {item.label}
              {item.badge ? (
                <span className="rounded-full bg-[#EAB308] px-2 py-0.5 text-[11px] font-extrabold text-[#0A1128]">{item.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Both panels stay mounted so switching tabs keeps their state. */}
        <div id="admin-panel-testimonials" role="tabpanel" aria-labelledby="admin-tab-testimonials" hidden={tab !== "testimonials"}>
          <TestimonialsAdmin onPendingCount={setPending} onSessionEnded={onSessionEnded} />
        </div>
        <div id="admin-panel-bookings" role="tabpanel" aria-labelledby="admin-tab-bookings" hidden={tab !== "bookings"}>
          <BookingsPanel />
        </div>
      </div>
    </div>
  );
}
