"use client";

import { createContext, useContext } from "react";

export type TripAlertLine = { title: string; urgent: boolean };

/**
 * The published trip alerts for the alert bar. app/[locale]/layout.tsx reads them
 * once (cached under the trip-alerts tag, cleared on every admin save) and passes
 * them here. null: not seeded yet or the database can't answer, so the bar keeps
 * Header.alerts from messages/*.json.
 */
const TripAlertsContext = createContext<TripAlertLine[] | null>(null);

export function TripAlertsProvider({ value, children }: { value: TripAlertLine[] | null; children: React.ReactNode }) {
  return <TripAlertsContext.Provider value={value}>{children}</TripAlertsContext.Provider>;
}

export const useTripAlertLines = () => useContext(TripAlertsContext);
