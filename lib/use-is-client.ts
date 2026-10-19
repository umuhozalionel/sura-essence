"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false during the server render and hydration, true afterwards. Use it to show
 * browser-only values (local time, weather) without a hydration mismatch, in
 * place of a `mounted` flag set from an effect.
 */
export function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
