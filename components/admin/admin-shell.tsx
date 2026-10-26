"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";
import { AdminThemeRoot } from "./admin-theme";
import { useModal } from "./admin-dialog";
import { SIDEBAR_COOKIE, savePref, type AdminTheme } from "./admin-prefs";
import type { AdminNavId, AdminUserInfo, NavCounts } from "./admin-nav";

/**
 * The signed-in frame: sidebar + header around every admin page.
 *   ≥ 1024 px  sidebar beside the content, collapsible to an icon rail (remembered)
 *   < 1024 px  sidebar hidden; it opens as a drawer
 * The open / close icon sits above "View website" in the sidebar (desktop), or
 * first in the top bar (phones and tablets).
 */
export function AdminShell({
  theme,
  sidebarCollapsed,
  allowed,
  user,
  counts,
  children,
}: {
  theme: AdminTheme;
  sidebarCollapsed: boolean;
  /** Sidebar sections this person may open (from lib/admin-rbac.ts, on the server). */
  allowed: readonly AdminNavId[];
  user: AdminUserInfo;
  counts: NavCounts;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(sidebarCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    savePref(SIDEBAR_COOKIE, next ? "collapsed" : "expanded");
  };

  return (
    <AdminThemeRoot initialTheme={theme}>
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 border-r bg-card transition-[width] duration-200 lg:flex",
            collapsed ? "w-[72px]" : "w-64",
          )}
        >
          <AdminSidebar collapsed={collapsed} allowed={allowed} counts={counts} onToggle={toggleSidebar} />
        </aside>

        <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)}>
          <AdminSidebar allowed={allowed} counts={counts} onNavigate={() => setMenuOpen(false)} onClose={() => setMenuOpen(false)} />
        </MobileDrawer>

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader user={user} onOpenMenu={() => setMenuOpen(true)} menuOpen={menuOpen} />
          <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </div>
      </div>
    </AdminThemeRoot>
  );
}

function MobileDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const t = useTranslations("Admin.nav");
  const ref = useModal(open);
  const pathname = usePathname();

  // Close when the page changes (e.g. browser back while the drawer is open).
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on navigation
  }, [pathname]);

  return (
    <dialog
      ref={ref}
      aria-label={t("label")}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] border-r bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/40 lg:hidden"
    >
      {/* The close button sits in the drawer's own top bar (AdminSidebar onClose). */}
      <div className="h-full">{children}</div>
    </dialog>
  );
}
