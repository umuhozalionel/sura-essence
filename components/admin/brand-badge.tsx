import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { BookingBrand } from "@/lib/types";

/** Colour per brand (--brand-movana / --brand-iwacu in admin.css); the name is always the label. */
const DOT: Record<BookingBrand, string> = {
  movana: "bg-[var(--brand-movana)]",
  iwacu: "bg-[var(--brand-iwacu)]",
};

/** "Movana" or "Iwacu", on rows for people who see both brands. */
export function BrandBadge({ brand, className }: { brand: BookingBrand; className?: string }) {
  const t = useTranslations("Admin.brands");
  return (
    <span className={cn("inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full border bg-background px-2 text-[11px] font-semibold", className)}>
      <span className={cn("size-1.5 rounded-full", DOT[brand])} aria-hidden />
      {t(brand)}
    </span>
  );
}
