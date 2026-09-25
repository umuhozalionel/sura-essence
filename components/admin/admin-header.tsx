"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, Loader2, LogOut, Menu } from "lucide-react";
import { toast } from "sonner";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { activeSection } from "./admin-nav";
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

export function AdminHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const t = useTranslations("Admin.header");
  const tn = useTranslations("Admin.nav");
  const section = activeSection(usePathname());
  const { signOut, busy } = useSignOut();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6 lg:px-8">
      <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={onOpenMenu} aria-label={tn("openMenu")}>
        <Menu aria-hidden />
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
            A
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">{t("role")}</p>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-[var(--status-confirmed)]" aria-hidden />
              {t("signedIn")}
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
