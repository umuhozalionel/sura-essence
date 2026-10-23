"use client";

import React, { useId, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CmsLocale, Localized } from "@/lib/cms/localized";
import { placeholdersIn, type AdminContentSection } from "@/lib/cms/site-content";
import { PageHeader, Panel } from "./page-header";
import {
  Field, FormError, LangSwitch, ListSkeleton, LoadErrorRow, SaveButton, SessionEnded, StatusPill,
  cmsApi, jsonInit, useAdminList, useApiErrors,
} from "./cms/kit";

/**
 * Site content: the text blocks staff can reword (site_content). One panel per
 * section, English and French, each block showing its default from
 * messages/*.json. Leaving a block empty puts the default back.
 */
export function SiteContentAdmin() {
  const t = useTranslations("Admin.content");
  const tc = useTranslations("Admin.cms");
  const { items, setItems, loadError, loading, reload, sessionEnded } = useAdminList<AdminContentSection>("/api/admin/site-content");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button variant="outline" onClick={reload} disabled={loading}>
            <RefreshCw className={cn(loading && "animate-spin")} aria-hidden />
            {tc("refresh")}
          </Button>
        }
      />
      {loadError ? (
        <section className="rounded-xl border bg-card shadow-xs"><LoadErrorRow kind={loadError} onRetry={reload} /></section>
      ) : items === null ? (
        <section className="rounded-xl border bg-card shadow-xs"><ListSkeleton rows={2} /></section>
      ) : (
        items.map((s) => (
          <SectionEditor
            key={`${s.id}:${s.updatedAt ?? 0}`}
            section={s}
            onSaved={(next) => setItems((l) => (l ?? []).map((x) => (x.id === next.id ? next : x)))}
            onSessionEnded={sessionEnded}
          />
        ))
      )}
    </div>
  );
}

function SectionEditor({ section, onSaved, onSessionEnded }: {
  section: AdminContentSection;
  onSaved: (s: AdminContentSection) => void;
  onSessionEnded: () => void;
}) {
  const t = useTranslations("Admin.content");
  const tc = useTranslations("Admin.cms");
  const format = useFormatter();
  const formId = useId();
  const toErrors = useApiErrors();
  const [lang, setLang] = useState<CmsLocale>("en");
  const [draft, setDraft] = useState<Record<string, Localized>>(() =>
    Object.fromEntries(section.blocks.map((b) => [b.key, { ...b.saved }])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = section.blocks.some((b) => draft[b.key].en !== b.saved.en || draft[b.key].fr !== b.saved.fr);
  const flagged = (["en", "fr"] as CmsLocale[]).filter((l) => Object.keys(errors).some((k) => k.endsWith(`.${l}`)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    // The same placeholder check as the server, so mistakes show next to the field.
    const found: Record<string, string> = {};
    for (const b of section.blocks) {
      for (const l of ["en", "fr"] as const) {
        const bad = placeholdersIn(draft[b.key][l]).find((p) => !b.vars.includes(p));
        if (bad) found[`${b.key}.${l}`] = t("badPlaceholder", { name: `{${bad}}` });
      }
    }
    setErrors(found);
    if (Object.keys(found).length) {
      const l = flagged[0] ?? (Object.keys(found)[0].endsWith(".fr") ? "fr" : "en");
      setLang(l);
      return;
    }
    setSaving(true);
    try {
      const { item } = await cmsApi<{ item: AdminContentSection }>(`/api/admin/site-content/${section.id}`, jsonInit("PUT", { blocks: draft }));
      onSaved(item);
      toast.success(t("savedToast", { section: t(`sections.${section.id}.title`) }));
    } catch (err) {
      if (err instanceof SessionEnded) return onSessionEnded();
      const f = toErrors(err);
      setErrors(f.fields);
      setBanner(f.banner);
      if (f.lang) setLang(f.lang);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title={t(`sections.${section.id}.title`)}
      description={t(`sections.${section.id}.where`)}
      action={
        <div className="flex items-center gap-2">
          <StatusPill tone={section.audience === "public" ? "live" : "muted"}>{t(`audience.${section.audience}`)}</StatusPill>
          <LangSwitch value={lang} onChange={setLang} flagged={flagged} />
        </div>
      }
    >
      <form id={formId} onSubmit={(e) => void submit(e)} noValidate className="space-y-5">
        <FormError message={banner} />
        {section.blocks.map((b) => {
          const value = draft[b.key][lang];
          const fallback = b.default[lang];
          const set = (v: string) => setDraft((d) => ({ ...d, [b.key]: { ...d[b.key], [lang]: v } }));
          const hint = [
            value ? null : t("usingDefault"),
            b.vars.length ? t("placeholders", { list: b.vars.map((v) => `{${v}}`).join(" ") }) : null,
          ].filter(Boolean).join(" ");
          return (
            <div key={b.key} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
              <Field label={`${t.has(`blocks.${b.key}`) ? t(`blocks.${b.key}`) : b.key} (${lang.toUpperCase()})`} hint={hint || undefined} error={errors[`${b.key}.${lang}`]}>
                {b.multiline ? (
                  <Textarea value={value} rows={3} maxLength={1200} placeholder={fallback} onChange={(e) => set(e.target.value)} />
                ) : (
                  <Input value={value} maxLength={1200} placeholder={fallback} onChange={(e) => set(e.target.value)} />
                )}
              </Field>
              <Button type="button" size="sm" variant="ghost" className="sm:mt-7" onClick={() => set("")} disabled={!value} title={t("resetHint")}>
                <RotateCcw aria-hidden />
                {t("reset")}
              </Button>
            </div>
          );
        })}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {section.updatedAt ? t("savedOn", { date: format.dateTime(new Date(section.updatedAt), { dateStyle: "medium", timeStyle: "short" }) }) : t("neverSaved")}
          </p>
          <SaveButton form={formId} saving={saving} label={saving ? tc("saving") : dirty ? tc("save") : t("noChanges")} />
        </div>
      </form>
    </Panel>
  );
}
