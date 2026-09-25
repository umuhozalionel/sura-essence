import React from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * One headline number. `sample` marks figures that are placeholders until a
 * real data source exists, so nobody mistakes them for live numbers.
 */
export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  sample,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  /** Text of the "Sample" tag; leave out for live figures. */
  sample?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {(hint || sample) && (
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {sample && (
            <span className="rounded-md border border-dashed px-1.5 py-px text-[11px] font-semibold uppercase tracking-wide">
              {sample}
            </span>
          )}
          {hint}
        </p>
      )}
    </>
  );

  const card = "block rounded-xl border bg-card p-5 text-card-foreground shadow-xs";
  return href ? (
    <Link
      href={href}
      className={`${card} transition-colors outline-none hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/50`}
    >
      {body}
    </Link>
  ) : (
    <div className={card}>{body}</div>
  );
}
