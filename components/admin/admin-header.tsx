"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, Loader2, LogOut, PanelLeftOpen } from "lucide-react";
import { toast } from "sonner";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { activeSection, type AdminUserInfo } from "./admin-nav";
import { ThemeToggle } from "./admin-theme";

/** Signs this browser out: the server clears the HttpOnly cookie, then the layout shows the sign-in form. */
export function useSignOut() {
  const router = useRouter();
  const t = useTranslations("Admin.header");
  const [busy, setBusy] = useState(false);
  const signOut = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
    } catch {
      toast.error(t("signOutError"));
      setBusy(false);
    }
  };
  return { signOut, busy };
}

/** The top bar. Below 1024 px its first item opens the navigation drawer. */
export function AdminHeader({
  user,
  onOpenMenu,
  menuOpen = false,
}: {
  user: AdminUserInfo;
  onOpenMenu: () => void;
  menuOpen?: boolean;
}) {
  const t = useTranslations("Admin.header");
  const tr = useTranslations("Admin.roles");
  const role = tr(user.role);
  const initial = (user.name ?? role).trim().charAt(0).toUpperCase();
  const tn = useTranslations("Admin.nav");
  const section = activeSection(usePathname());
  const { signOut, busy } = useSignOut();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 sm:px-6 lg:px-8">
      {/* Phones and tablets: opens the navigation drawer. */}
      <Button
        variant="outline"
        size="icon"
        className="-ml-1 size-10 shrink-0 border-foreground/25 bg-card shadow-sm lg:hidden"
        onClick={onOpenMenu}
        aria-label={tn("openMenu")}
        title={tn("openMenu")}
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
      >
        <PanelLeftOpen className="size-5" aria-hidden />
      </Button>

      {/* Breadcrumbs */}
      <nav aria-label={t("breadcrumb")} className="min-w-0">
        <ol className="flex items-center gap-1.5 text-sm">
          <li className="hidden sm:block">
            <Link href="/admin" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("root")}
            </Link>
          </li>
          <li className="hidden sm:block" aria-hidden>
            <ChevronRight className="size-3.5 text-muted-foreground/70" />
          </li>
          <li aria-current="page" className="truncate font-semibold">
            {tn(section)}
          </li>
        </ol>
      </nav>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <ThemeToggle />

        {/* Who's signed in */}
        <div className="hidden items-center gap-2.5 rounded-full border bg-card py-1 pr-3.5 pl-1 sm:flex">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary" aria-hidden>
            {initial}
          </span>
          <div className="leading-tight">
            <p className="max-w-[12rem] truncate text-sm font-semibold">{user.name ?? role}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-[var(--status-confirmed)]" aria-hidden />
              {user.name ? role : t("signedIn")}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => void signOut()} disabled={busy} aria-label={t("signOut")}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <LogOut aria-hidden />}
          <span className="hidden sm:inline">{t("signOut")}</span>
        </Button>
      </div>
    </header>
  );
}

/** Sign-out button for the Settings page. */
export function SignOutButton() {
  const t = useTranslations("Admin.header");
  const { signOut, busy } = useSignOut();
  return (
    <Button variant="outline" onClick={() => void signOut()} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" aria-hidden /> : <LogOut aria-hidden />}
      {t("signOut")}
    </Button>
  );
}
