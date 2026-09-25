"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft, Loader2, LockKeyhole } from "lucide-react";
import { Link } from "@/i18n/navigation";

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
        router.refresh(); // the server now sees the cookie and renders the dashboard
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
    <div className="flex min-h-screen items-center justify-center bg-[#F9F8F6] px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_30px_80px_-40px_rgba(10,17,40,0.35)] ring-1 ring-[#0A1128]/[0.06]">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A1128]">
          <LockKeyhole className="h-5 w-5 text-[#EAB308]" aria-hidden />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0A1128]">{tl("title")}</h1>
        <p className="mt-1 text-sm font-medium text-[#0A1128]/60">{tl("description")}</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <div>
            <label htmlFor="admin-password" className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#0A1128]/70">
              {tl("passwordLabel")}
            </label>
            <input
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
              className={`h-12 w-full rounded-2xl bg-[#F9F8F6] px-4 text-[15px] font-medium text-[#0A1128] outline-none transition placeholder:text-[#0A1128]/50 focus:bg-white ${
                error ? "ring-2 ring-[#B42318]/60" : "ring-1 ring-[#0A1128]/10 focus:ring-2 focus:ring-[#125740]"
              }`}
            />
          </div>

          {error && (
            <p id="admin-login-error" role="alert" className="flex items-start gap-2 text-sm font-semibold text-[#B42318]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !password}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0A1128] text-sm font-extrabold text-white transition hover:bg-[#125740] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {busy ? tl("signingIn") : tl("submit")}
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#125740] underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {tl("backHome")}
        </Link>
      </div>
    </div>
  );
}
