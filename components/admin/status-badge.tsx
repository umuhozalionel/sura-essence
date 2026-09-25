import React from "react";
import { useTranslations } from "next-intl";
import { CheckCheck, CircleCheck, CircleX, Clock, type LucideIcon } from "lucide-react";
import type { BookingStatus } from "@/lib/types";

/** Icon + label for each booking status — the colour is never the only cue. */
export const STATUS_STYLE: Record<BookingStatus, { icon: LucideIcon; className: string }> = {
  pending: { icon: Clock, className: "text-[var(--status-pending)]" },
  confirmed: { icon: CircleCheck, className: "text-[var(--status-confirmed)]" },
  completed: { icon: CheckCheck, className: "text-[var(--status-completed)]" },
  cancelled: { icon: CircleX, className: "text-[var(--status-cancelled)]" },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const t = useTranslations("Admin.status");
  const { icon: Icon, className } = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium whitespace-nowrap">
      <Icon className={`size-3.5 ${className}`} aria-hidden />
      {t(status)}
    </span>
  );
}
