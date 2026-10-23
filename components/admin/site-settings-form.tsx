"use client";

import React, { useEffect, useId, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SETTINGS_SOCIALS, type AdminSiteSettings, type SiteSettings } from "@/lib/cms/site-settings";
import { Panel } from "./page-header";
import { AdminSelect } from "./admin-select";
import {
  Field, FormError, LoadErrorRow, RepeatCard, SaveButton, SessionEnded, apiError, cmsApi, jsonInit, moveItem, removeAt,
  useApiErrors, useSessionEnded,
} from "./cms/kit";

/** Contact details and social links used across the website (site_settings). */
export function SiteSettingsForm() {
  const t = useTranslations("Admin.siteSettings");
  const tc = useTranslations("Admin.cms");
  const format = useFormatter();
  const formId = useId();
  const sessionEnded = useSessionEnded();
  const toErrors = useApiErrors();
  const [loaded, setLoaded] = useState<AdminSiteSettings | null>(null);
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [loadError, setLoadError] = useState<"load" | "notConfigured" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    cmsApi<{ item: AdminSiteSettings }>("/api/admin/site-settings")
      .then(({ item }) => {
        if (!live) return;
        setLoaded(item);
        setDraft({ contact: { ...item.contact }, socials: structuredClone(item.socials) });
        setLoadError(null);
      })
      .catch((err) => {
        if (!live) return;
        if (err instanceof SessionEnded) return sessionEnded();
        setLoadError(apiError(err).status === 503 ? "notConfigured" : "load");
      });
    return () => {
      live = false;
    };
  }, [attempt, sessionEnded]);

  const setContact = (k: keyof SiteSettings["contact"], v: string) => setDraft((d) => d && { ...d, contact: { ...d.contact, [k]: v } });
  const setSocials = (socials: SiteSettings["socials"]) => setDraft((d) => d && { ...d, socials });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setBanner(null);
    setErrors({});
    setSaving(true);
    try {
      const { item } = await cmsApi<{ item: AdminSiteSettings }>("/api/admin/site-settings", jsonInit("PUT", draft));
      setLoaded(item);
      setDraft({ contact: { ...item.contact }, socials: structuredClone(item.socials) });
      toast.success(t("savedToast"));
    } catch (err) {
      if (err instanceof SessionEnded) return sessionEnded();
      const f = toErrors(err);
      setErrors(f.fields);
      setBanner(f.banner);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title={t("title")}
      description={
        loaded?.updatedAt
          ? t("savedOn", { date: format.dateTime(new Date(loaded.updatedAt), { dateStyle: "medium", timeStyle: "short" }) })
          : t("notSaved")
      }
      className="lg:col-span-2"
    >
      {loadError ? (
        <LoadErrorRow kind={loadError} onRetry={() => setAttempt((a) => a + 1)} />
      ) : !draft ? (
        <div className="grid gap-4 sm:grid-cols-3" aria-hidden>
          {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : (
        <form id={formId} onSubmit={(e) => void submit(e)} noValidate className="space-y-6">
          <FormError message={banner} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("phone")} required error={errors["contact.phone"]} hint={t("phoneHint")}>
              <Input type="tel" value={draft.contact.phone} maxLength={24} onChange={(e) => setContact("phone", e.target.value)} />
            </Field>
            <Field label={t("whatsapp")} error={errors["contact.whatsapp"]} hint={t("whatsappHint")}>
              <Input inputMode="numeric" value={draft.contact.whatsapp} maxLength={15} onChange={(e) => setContact("whatsapp", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label={t("email")} required error={errors["contact.email"]}>
              <Input type="email" value={draft.contact.email} maxLength={120} onChange={(e) => setContact("email", e.target.value)} />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t("socials")}</p>
              <Button type="button" size="sm" variant="outline" disabled={draft.socials.length >= SETTINGS_SOCIALS.length}
                onClick={() => {
                  const free = SETTINGS_SOCIALS.find((p) => !draft.socials.some((s) => s.platform === p)) ?? "instagram";
                  setSocials([...draft.socials, { platform: free, url: "" }]);
                }}>
                <Plus aria-hidden />
                {t("addSocial")}
              </Button>
            </div>
            {draft.socials.length === 0 && <p className="text-sm text-muted-foreground">{t("noSocials")}</p>}
            {draft.socials.map((s, i) => (
              <RepeatCard key={i} index={i} count={draft.socials.length}
                onMove={(d) => setSocials(moveItem(draft.socials, i, d))}
                onRemove={() => setSocials(removeAt(draft.socials, i))}>
                <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
                  <Field label={t("platform")} error={errors[`socials.${i}.platform`]}>
                    <AdminSelect value={s.platform} onChange={(e) => setSocials(draft.socials.map((x, j) => (j === i ? { ...x, platform: e.target.value as typeof s.platform } : x)))}>
                      {SETTINGS_SOCIALS.map((p) => <option key={p} value={p}>{t(`platforms.${p}`)}</option>)}
                    </AdminSelect>
                  </Field>
                  <Field label={t("url")} required error={errors[`socials.${i}.url`]}>
                    <Input type="url" value={s.url} placeholder="https://" onChange={(e) => setSocials(draft.socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                  </Field>
                </div>
              </RepeatCard>
            ))}
          </div>

          <div className="flex justify-end border-t pt-4">
            <SaveButton form={formId} saving={saving} label={saving ? tc("saving") : tc("save")} />
          </div>
        </form>
      )}
    </Panel>
  );
}
