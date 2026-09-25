"use client";

import React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ExternalLink, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, activeSection, type NavCounts } from "./admin-nav";
import { BrandMark } from "./brand-mark";

/**
 * The left navigation. On large screens it sits beside the content and can be
 * collapsed to an icon rail; on phones and tablets it opens as a drawer.
 */
export function AdminSidebar({
  collapsed = false,
  counts,
  onToggle,
  onNavigate,
}: {
  collapsed?: boolean;
  counts: NavCounts;
  /** Shows the collapse button (desktop only). */
  onToggle?: () => void;
  /** Called after a link is chosen (closes the mobile drawer). */
  onNavigate?: () => void;
}) {
  const t = useTranslations("Admin.nav");
  const format = useFormatter();
  const active = activeSection(usePathname());

  return (
    <div className="flex h-full w-full flex-col">
      {/* Brand */}
      <div className={cn("flex h-16 shrink-0 items-center gap-3 border-b", collapsed ? "justify-center px-2" : "px-5")}>
        <BrandMark className="size-8" />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">SURA Essence</p>
            <p className="text-xs text-muted-foreground">{t("portal")}</p>
          </div>
        )}
      </div>

      {/* Sections */}
      <nav aria-label={t("label")} className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === active;
            const label = t(item.id);
            const count = item.id === "bookings" ? counts?.bookings : item.id === "testimonials" ? counts?.testimonials : 0;
            const badgeText = count ? t("pendingCount", { count }) : "";
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? (badgeText ? `${label} · ${badgeText}` : label) : undefined}
                  className={cn(
                    "group relative flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    collapsed ? "justify-center px-0" : "px-3",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-[18px] shrink-0" aria-hidden />
                  {collapsed ? (
                    <>
                      <span className="sr-only">{label}{badgeText && `, ${badgeText}`}</span>
                      {count ? <span className="absolute top-2 right-2.5 size-2 rounded-full bg-primary ring-2 ring-card" aria-hidden /> : null}
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate">{label}</span>
                      {count ? (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
                          <span aria-hidden>{format.number(count)}</span>
                          <span className="sr-only">{badgeText}</span>
                        </span>
                      ) : null}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="shrink-0 space-y-1 border-t p-3">
        <Link
          href="/"
          onClick={onNavigate}
          title={collapsed ? t("viewSite") : undefined}
          className={cn(
            "flex h-10 items-center gap-3 rounded-lg text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
            collapsed ? "justify-center" : "px-3",
          )}
        >
          <ExternalLink className="size-[18px] shrink-0" aria-hidden />
          <span className={collapsed ? "sr-only" : "truncate"}>{t("viewSite")}</span>
        </Link>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            title={collapsed ? t("expand") : undefined}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-lg text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
              collapsed ? "justify-center" : "px-3",
            )}
          >
            {collapsed ? <PanelLeftOpen className="size-[18px]" aria-hidden /> : <PanelLeftClose className="size-[18px]" aria-hidden />}
            <span className={collapsed ? "sr-only" : "truncate"}>{collapsed ? t("expand") : t("collapse")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
