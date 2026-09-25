"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "./brand-mark";

/**
 * The password goes to /api/admin/login, which checks it on the server and
 * sets an HttpOnly cookie. Nothing secret lives in this file.
 */
export function AdminLogin({ configured }: { configured: boolean }) {
  const tl = useTranslations("Admin.login");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(configured ? null : tl("notConfigured"));
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setPassword("");
        router.refresh(); // the server now sees the cookie and renders the portal
        return;
      }
      setError(
        res.status === 401 ? tl("incorrect")
        : res.status === 429 ? tl("tooMany")
        : res.status === 503 ? tl("notConfigured")
        : tl("error"),
      );
    } catch {
      setError(tl("error"));
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <BrandMark className="size-10" />
          <div className="leading-tight">
            <p className="font-semibold">SURA Essence</p>
            <p className="text-sm text-muted-foreground">{tl("portal")}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-8 text-card-foreground shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">{tl("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tl("description")}</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="admin-password">{tl("passwordLabel")}</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tl("passwordPlaceholder")}
                disabled={busy}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "admin-login-error" : undefined}
                className="h-10"
              />
            </div>

            {error && (
              <p id="admin-login-error" role="alert" className="flex items-start gap-2 text-sm font-medium text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}

            <Button type="submit" disabled={busy || !password} className="h-10 w-full">
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              {busy ? tl("signingIn") : tl("submit")}
            </Button>
          </form>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {tl("backHome")}
        </Link>
      </div>
    </div>
  );
}
