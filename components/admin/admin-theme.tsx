"use client";

import React, { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ADMIN_THEMES, THEME_COOKIE, savePref, type AdminTheme } from "./admin-prefs";

type ThemeState = { theme: AdminTheme; resolved: "light" | "dark"; setTheme: (t: AdminTheme) => void };
const ThemeContext = createContext<ThemeState>({ theme: "system", resolved: "light", setTheme: () => {} });
export const useAdminTheme = () => useContext(ThemeContext);

const DARK_QUERY = "(prefers-color-scheme: dark)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/**
 * The root of every admin screen. Colours come from app/[locale]/admin/admin.css
 * via data-theme; the extra `dark` class switches on Tailwind's dark: styles.
 */
export function AdminThemeRoot({ initialTheme, children }: { initialTheme: AdminTheme; children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>(initialTheme);
  // The server can't see the device setting, so "system" starts light and settles after hydration.
  const systemDark = useSyncExternalStore(subscribe, () => window.matchMedia(DARK_QUERY).matches, () => false);
  const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next);
    savePref(THEME_COOKIE, next);
  }, []);
  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <div
        data-theme={theme}
        className={cn("sura-admin min-h-screen bg-background text-foreground antialiased", resolved === "dark" && "dark")}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/** Header button: flips between light and dark. */
export function ThemeToggle() {
  const t = useTranslations("Admin.theme");
  const { resolved, setTheme } = useAdminTheme();
  const next = resolved === "dark" ? "light" : "dark";
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(next)} aria-label={t(next === "dark" ? "toDark" : "toLight")} title={t(next === "dark" ? "toDark" : "toLight")}>
      {resolved === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

/** Settings: Light / Dark / System. */
export function ThemePicker() {
  const t = useTranslations("Admin.theme");
  const { theme, setTheme } = useAdminTheme();
  return (
    <div role="radiogroup" aria-label={t("label")} className="inline-flex rounded-lg border bg-muted p-1">
      {ADMIN_THEMES.map((option) => {
        const Icon = THEME_ICONS[option];
        const selected = theme === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(option)}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              selected ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {t(option)}
          </button>
        );
      })}
    </div>
  );
}
