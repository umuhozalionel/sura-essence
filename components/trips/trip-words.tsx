"use client";

import { useMemo } from "react";
import { NextIntlClientProvider, useLocale, useMessages, useTimeZone } from "next-intl";

/** Gives everything below it a trip's wording from Admin → Trips → Page content, on top of the site's own. */
export function TripWords({ trips, children }: { trips: Record<string, unknown>; children: React.ReactNode }) {
  const messages = useMessages();
  const locale = useLocale();
  const timeZone = useTimeZone();
  const merged = useMemo(() => ({ ...messages, Trips: { ...(messages.Trips as Record<string, unknown>), ...trips } }), [messages, trips]);
  return (
    <NextIntlClientProvider locale={locale} timeZone={timeZone} messages={merged as never}>
      {children}
    </NextIntlClientProvider>
  );
}
