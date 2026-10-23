/**
 * Trip alerts: the travel notices on /tripalerts (TripAlerts.alerts in messages/*.json today).
 * Safe to import in the browser. The database side is lib/cms/trip-alerts-server.ts.
 */
import { isFallback, pick, type CmsLocale, type Localized } from "./localized";

export const ALERT_STATUSES = ["draft", "published", "archived"] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

export const ALERT_LIMITS = { title: 160, content: 6000, sources: 8 } as const;

export type TripAlertInput = {
  slug: string;
  status: AlertStatus;
  /** "YYYY-MM-DD", the date the notice was issued or last checked. */
  date: string;
  urgent: boolean;
  title: Localized;
  /** Paragraphs separated by blank lines; "• " lines are bullet points. */
  content: Localized;
  sources: { label: Localized; url: string }[];
};

export type AdminTripAlert = TripAlertInput & { id: string; createdAt: number; updatedAt: number };

export type PublicTripAlert = {
  id: string;
  slug: string;
  date: string;
  urgent: boolean;
  title: string;
  content: string;
  sources: { label: string; url: string }[];
  translated: boolean;
};

export function localizeTripAlert(a: AdminTripAlert, locale: CmsLocale): PublicTripAlert {
  return {
    id: a.id,
    slug: a.slug,
    date: a.date,
    urgent: a.urgent,
    title: pick(a.title, locale),
    content: pick(a.content, locale),
    sources: a.sources.map((s) => ({ label: pick(s.label, locale), url: s.url })),
    translated: isFallback(a.title, locale) || isFallback(a.content, locale),
  };
}
