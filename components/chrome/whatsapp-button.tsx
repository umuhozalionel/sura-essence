"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { WHATSAPP_URL } from "./contact";

/**
 * `icon`: the desktop header button, icon only (the label is for screen readers).
 * `full`: the wide button at the foot of the mobile menu.
 */
export function WhatsAppButton({ variant }: { variant: "icon" | "full" }) {
  const t = useTranslations("Header");

  if (variant === "icon") {
    return (
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("chatWithUs")}
        className="group flex min-h-12 items-center gap-3 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-all duration-300 hover:shadow-lg"
      >
        <MessageCircle className="w-4 h-4" strokeWidth={2} />
      </a>
    );
  }

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-12 items-center justify-center gap-3 w-full px-6 py-4 rounded-lg bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wide shadow-lg active:scale-[0.98] transition-transform"
    >
      <MessageCircle className="w-5 h-5" strokeWidth={2} />
      {t("chatWithUs")}
    </a>
  );
}
