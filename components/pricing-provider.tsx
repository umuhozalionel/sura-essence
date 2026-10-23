"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing";

/**
 * The rates the website prices with, handed down from the server and kept fresh.
 *
 * app/[locale]/layout.tsx reads the live pricing document (cached under
 * "cms:pricing", cleared on every admin save) and passes it here. Because an
 * admin can change a rate at any moment, an open tab re-checks /api/pricing:
 *   - when the tab comes back into view,
 *   - every minute while it's visible,
 *   - and on demand with refresh(), which the booking form calls just before sending.
 * The server re-prices every booking anyway; this keeps what the visitor sees in step.
 */
export type Pricing = { config: PricingConfig; revision: number };

type Ctx = Pricing & { refresh: () => Promise<Pricing> };

const PricingContext = createContext<Ctx>({
  config: DEFAULT_PRICING,
  revision: 0,
  refresh: async () => ({ config: DEFAULT_PRICING, revision: 0 }),
});

const REFRESH_MS = 60_000;

export function PricingProvider({ value, children }: { value: Pricing; children: React.ReactNode }) {
  const [pricing, setPricing] = useState<Pricing>(value);
  const latest = useRef(pricing);
  useEffect(() => {
    latest.current = pricing;
  }, [pricing]);

  // A newer server render (e.g. after navigating) wins over what this tab holds.
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    if (value.revision >= pricing.revision) setPricing(value);
  }

  const refresh = useCallback(async (): Promise<Pricing> => {
    try {
      const res = await fetch("/api/pricing", { cache: "no-store" });
      if (!res.ok) return latest.current;
      const data = (await res.json()) as { config?: PricingConfig; revision?: number };
      if (!data.config || typeof data.revision !== "number") return latest.current;
      const next = { config: data.config, revision: data.revision };
      if (next.revision !== latest.current.revision || data.revision === 0) setPricing(next);
      return next;
    } catch {
      return latest.current; // offline: keep pricing with what we have; the server re-prices anyway
    }
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const ctx = useMemo(() => ({ ...pricing, refresh }), [pricing, refresh]);
  return <PricingContext.Provider value={ctx}>{children}</PricingContext.Provider>;
}

/** The live PricingConfig, to pass to quote(), destinationPrice() and quoteRequest(). */
export const usePricing = () => useContext(PricingContext).config;

/** The revision the rates came from (0 = built-in), and a way to re-check it now. */
export const usePricingState = () => useContext(PricingContext);
