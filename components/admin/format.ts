import type { useFormatter } from "next-intl";

/** next-intl's formatter (from useFormatter() or getFormatter()). */
export type Formatter = ReturnType<typeof useFormatter>;

/** 1250000 → "1,250,000 RWF", or "1.3M RWF" with compact. Follows the admin's language. */
export function rwf(format: Formatter, amount: number, compact = false): string {
  const options = compact && amount >= 100_000 ? ({ notation: "compact", maximumFractionDigits: 1 } as const) : {};
  return `${format.number(amount, options)} RWF`;
}

// Booking dates are calendar dates (YYYY-MM-DD), so they're formatted in UTC to never shift a day.
const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** "12 Oct 2026", or without the year. */
export function formatDay(format: Formatter, iso: string, withYear = true): string {
  return format.dateTime(asDate(iso), { day: "numeric", month: "short", ...(withYear && { year: "numeric" }), timeZone: "UTC" });
}

/** "12 Oct 2026" or "12–14 Oct 2026" for multi-day trips. */
export function formatTripDates(format: Formatter, start: string, end: string | null): string {
  if (!end || end === start) return formatDay(format, start);
  return format.dateTimeRange(asDate(start), asDate(end), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
