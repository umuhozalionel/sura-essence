"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ImagePlus, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CmsLocale, Localized } from "@/lib/cms/localized";
import { TRIP_LIMITS, sizedPhoto, type AdminTrip, type AdminTripPage } from "@/lib/cms/trips";
import { AdminDialog } from "./admin-dialog";
import {
  Field, FormError, LangSwitch, ListSkeleton, MediaThumb, SaveButton, SessionEnded, apiError, cmsApi, jsonInit, useApiErrors,
} from "./cms/kit";

/** "Trips.builder.packages.basic.note" → "Packages › Basic › Note". */
const words = (key: string) => key.replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
const labelOf = (key: string) => key.split(".").slice(2).map(words).join(" › ") || words(key);
/** Groups the form: "Trips.builder.packages.basic.note" → "builder packages"; single lines stay under "builder". */
const groupOf = (key: string) => {
  const [root, section, sub, ...rest] = key.split(".");
  return root === "Brands" ? "searchResults" : rest.length ? `${section} ${sub}` : section;
};

/** Every word, photo and link on a trip's own pages. Whatever stays empty shows the default, shown greyed out. */
export function TripPageEditor({ trip, onClose, onSessionEnded }: { trip: AdminTrip; onClose: () => void; onSessionEnded: () => void }) {
  const t = useTranslations("Admin.trips.manage.page");
  const tc = useTranslations("Admin.cms");
  const tcom = useTranslations("Admin.common");
  const formId = useId();
  const toErrors = useApiErrors();
  const picker = useRef<HTMLInputElement>(null);
  const pickingFor = useRef<string | null>(null);
  const [page, setPage] = useState<AdminTripPage | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [text, setText] = useState<Record<string, Localized>>({});
  const [media, setMedia] = useState<Record<string, string>>({});
  const [lang, setLang] = useState<CmsLocale>("en");
  const [filter, setFilter] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const fill = (item: AdminTripPage) => {
    setPage(item);
    setText(Object.fromEntries(item.blocks.map((b) => [b.key, { en: b.saved.en.join("\n"), fr: b.saved.fr.join("\n") }])));
    setMedia(Object.fromEntries(item.media.map((m) => [m.key, m.saved])));
  };

  useEffect(() => {
    let live = true;
    cmsApi<{ item: AdminTripPage }>(`/api/admin/trips/${trip.id}/page`)
      .then(({ item }) => {
        if (live) fill(item);
      })
      .catch((err) => {
        if (!live) return;
        if (err instanceof SessionEnded) return onSessionEnded();
        setLoadFailed(true);
      });
    return () => {
      live = false;
    };
  }, [trip.id, onSessionEnded]);

  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const out = new Map<string, NonNullable<typeof page>["blocks"]>();
    for (const b of page?.blocks ?? []) {
      const match = !q || [b.key, ...b.default.en, ...b.default.fr, text[b.key]?.en ?? "", text[b.key]?.fr ?? ""].some((s) => s.toLowerCase().includes(q));
      if (match) out.set(groupOf(b.key), [...(out.get(groupOf(b.key)) ?? []), b]);
    }
    return [...out];
  }, [page, filter, text]);

  const flagged = (["en", "fr"] as CmsLocale[]).filter((l) => Object.keys(errors).some((k) => k.endsWith(`.${l}`)));

  /** A page photo goes to Cloudinary like a recap photo, but doesn't join the recap. */
  const upload = async (key: string, file: File) => {
    if (file.size > TRIP_LIMITS.photoBytes) return void toast.error(t("tooBig", { mb: Math.round(TRIP_LIMITS.photoBytes / 1024 / 1024) }));
    setUploading(key);
    try {
      const sig = await cmsApi<{ url: string; fields: Record<string, string | number> }>(`/api/admin/trips/${trip.id}/photos/signature`, jsonInit("POST"));
      const form = new FormData();
      Object.entries(sig.fields).forEach(([k, v]) => form.append(k, String(v)));
      form.append("file", file);
      const sent = await fetch(sig.url, { method: "POST", body: form });
      if (!sent.ok) throw Object.assign(new Error("upload"), { status: 502 });
      const reply = (await sent.json()) as { public_id: string; version: number; signature: string };
      const { url } = await cmsApi<{ url: string }>(
        `/api/admin/trips/${trip.id}/photos`,
        jsonInit("POST", { public_id: reply.public_id, version: reply.version, signature: reply.signature, target: "page" }),
      );
      setMedia((m) => ({ ...m, [key]: url }));
    } catch (err) {
      if (err instanceof SessionEnded) return onSessionEnded();
      toast.error(apiError(err).status === 503 ? t("uploadsOff") : t("uploadFailed"));
    } finally {
      setUploading(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setErrors({});
    const split = (s: string, list: boolean) => (list ? s.split("\n").map((x) => x.trim()).filter(Boolean) : s.trim() ? [s] : []);
    const body = {
      text: Object.fromEntries((page?.blocks ?? []).map((b) => [b.key, { en: split(text[b.key].en, b.list), fr: split(text[b.key].fr, b.list) }])),
      media,
    };
    setSaving(true);
    try {
      const { item } = await cmsApi<{ item: AdminTripPage }>(`/api/admin/trips/${trip.id}/page`, jsonInit("PUT", body));
      fill(item);
      toast.success(tc("savedToast"));
      onClose();
    } catch (error) {
      if (error instanceof SessionEnded) return onSessionEnded();
      const found = toErrors(error);
      setErrors(found.fields);
      setBanner(found.banner);
      if (found.lang && found.lang !== lang) setLang(found.lang);
      const bad = Object.keys(found.fields)[0];
      if (bad) setFilter(bad.replace(/\.(en|fr)$/, ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminDialog
      open
      onClose={() => !saving && onClose()}
      title={t("title", { name: trip.name.en })}
      description={t("hint")}
      closeLabel={tcom("close")}
      size="lg"
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{tcom("cancel")}</Button>
          <SaveButton form={formId} saving={saving} label={saving ? tc("saving") : tc("save")} />
        </>
      }
    >
      {loadFailed ? (
        <FormError message={tc("loadError")} />
      ) : !page ? (
        <ListSkeleton rows={3} />
      ) : (
        <form id={formId} onSubmit={(e) => void submit(e)} noValidate className="space-y-6">
          <FormError message={banner} />
          <input
            ref={picker}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file && pickingFor.current) void upload(pickingFor.current, file);
            }}
          />

          {page.media.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">{t("files")}</h3>
              {page.media.map((m) => (
                <div key={m.key} className="flex items-end gap-3">
                  {m.kind === "photo" && <MediaThumb src={sizedPhoto(media[m.key] || m.default, 300)} className="h-14 w-20" />}
                  <Field label={labelOf(`x.x.${m.key}`)} error={errors[`media.${m.key}`]} className="flex-1">
                    <Input value={media[m.key] ?? ""} placeholder={m.default} onChange={(e) => setMedia((d) => ({ ...d, [m.key]: e.target.value }))} />
                  </Field>
                  {m.kind === "photo" && (
                    <Button type="button" variant="outline" disabled={Boolean(uploading)} onClick={() => { pickingFor.current = m.key; picker.current?.click(); }}>
                      {uploading === m.key ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus aria-hidden />}
                      {t("upload")}
                    </Button>
                  )}
                  <Button type="button" size="icon" variant="ghost" aria-label={t("reset")} disabled={!media[m.key]} onClick={() => setMedia((d) => ({ ...d, [m.key]: "" }))}>
                    <RotateCcw aria-hidden />
                  </Button>
                </div>
              ))}
            </section>
          )}

          <section className="space-y-3">
            <div className="sticky -top-5 z-10 -mx-6 flex flex-wrap items-center gap-3 border-y bg-card/95 px-6 py-3 backdrop-blur">
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="min-w-40 flex-1" />
              <LangSwitch value={lang} onChange={setLang} flagged={flagged} />
            </div>
            {groups.length === 0 && <p className="text-sm text-muted-foreground">{t("noMatch")}</p>}
            {groups.map(([group, blocks]) => (
              <details key={group} open={Boolean(filter.trim()) || groups.length === 1} className="rounded-lg border">
                <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">{words(group)} <span className="font-normal text-muted-foreground">({blocks.length})</span></summary>
                <div className="space-y-4 border-t p-4">
                  {blocks.map((b) => {
                    const value = text[b.key][lang];
                    const fallback = b.default[lang].join("\n");
                    const set = (v: string) => setText((d) => ({ ...d, [b.key]: { ...d[b.key], [lang]: v } }));
                    const live = [...fallback.matchAll(/\{\s*(\w+)/g)].map((x) => `{${x[1]}}`);
                    const hint = [b.list ? t("onePerLine") : null, live.length ? t("keep", { list: [...new Set(live)].join(" ") }) : null].filter(Boolean).join(" ");
                    return (
                      <Field key={b.key} label={`${labelOf(b.key)} (${lang.toUpperCase()})`} error={errors[`${b.key}.${lang}`]} hint={hint || undefined}>
                        {b.list || fallback.length > 70 ? (
                          <Textarea value={value} rows={b.list ? Math.max(3, b.default[lang].length + 1) : 2} placeholder={fallback} onChange={(e) => set(e.target.value)} />
                        ) : (
                          <Input value={value} placeholder={fallback} onChange={(e) => set(e.target.value)} />
                        )}
                      </Field>
                    );
                  })}
                </div>
              </details>
            ))}
          </section>
        </form>
      )}
    </AdminDialog>
  );
}
