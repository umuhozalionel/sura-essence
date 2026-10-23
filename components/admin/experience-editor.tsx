"use client";

import React, { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DESTINATIONS } from "@/lib/pricing";
import type { CmsLocale } from "@/lib/cms/localized";
import {
  BOOKING_MODES, DATE_PRECISION, EXPERIENCE_AVAILABILITY, EXPERIENCE_CURRENCIES, EXPERIENCE_LIMITS as L, EXPERIENCE_STATUSES, MEDIA_TYPES,
  type AdminExperience, type ExperienceInput,
} from "@/lib/cms/experiences";
import { AdminDialog } from "./admin-dialog";
import { AdminSelect } from "./admin-select";
import {
  CheckRow, Field, FormError, FormSection, LangSwitch, MediaThumb, RepeatCard, SaveButton, SessionEnded,
  cmsApi, jsonInit, moveItem, removeAt, useApiErrors,
} from "./cms/kit";

const EMPTY_L = { en: "", fr: "" };

/** Categories used on the Events page today (Events.categories in messages, minus "all"). */
const CATEGORIES = ["nature", "culture", "exclusive"] as const;

const EMPTY: ExperienceInput = {
  slug: "",
  status: "draft",
  availability: "open",
  featured: false,
  category: "nature",
  schedule: { startDate: null, endDate: null, precision: "day", month: null, bookingDeadline: null, departure: { ...EMPTY_L } },
  title: { ...EMPTY_L },
  shortTitle: { ...EMPTY_L },
  subtitle: { ...EMPTY_L },
  description: { ...EMPTY_L },
  location: { name: { ...EMPTY_L }, region: { ...EMPTY_L }, country: "Rwanda", destinationId: null },
  duration: { ...EMPTY_L },
  media: { cover: "", flyer: "", hero: "", gallery: [] },
  pricing: { tiers: [] },
  packages: [],
  details: [],
  itinerary: [],
  highlights: [],
  capacity: { seats: null, attendees: null },
  booking: { mode: "whatsapp", whatsappText: { ...EMPTY_L }, itinerary: "" },
  hero: { promote: false, until: null },
};

/** The sections edited as JSON for now: they're nested lists of EN/FR text. */
const ADVANCED = ["packages", "details", "itinerary", "highlights"] as const;
type Advanced = (typeof ADVANCED)[number];

function toInput(e: AdminExperience): ExperienceInput {
  const copy: Partial<AdminExperience> = structuredClone(e);
  delete copy.id;
  delete copy.createdAt;
  delete copy.updatedAt;
  return copy as ExperienceInput;
}

/** Sets a nested value by path, returning a new object. */
function setIn<T>(obj: T, path: (string | number)[], value: unknown): T {
  const next = structuredClone(obj) as Record<string | number, unknown>;
  let o = next;
  for (const k of path.slice(0, -1)) o = o[k] as Record<string | number, unknown>;
  o[path[path.length - 1]] = value;
  return next as T;
}

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

/** Add or edit one experience. Upcoming / past comes from the dates, so there's no status for it here. */
export function ExperienceEditor({
  existing,
  onClose,
  onSaved,
  onSessionEnded,
}: {
  existing: AdminExperience | null;
  onClose: () => void;
  onSaved: (item: AdminExperience, isNew: boolean) => void;
  onSessionEnded: () => void;
}) {
  const t = useTranslations("Admin.experiences");
  const tc = useTranslations("Admin.cms");
  const tcom = useTranslations("Admin.common");
  const ts = useTranslations("BookingForm.sites");
  const formId = useId();
  const toErrors = useApiErrors();

  const [draft, setDraft] = useState<ExperienceInput>(() => (existing ? toInput(existing) : structuredClone(EMPTY)));
  const [lang, setLang] = useState<CmsLocale>("en");
  const [advanced, setAdvanced] = useState<Record<Advanced, string>>(() =>
    Object.fromEntries(ADVANCED.map((k) => [k, JSON.stringify((existing ?? EMPTY)[k], null, 2)])) as Record<Advanced, string>,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (path: (string | number)[], value: unknown) => setDraft((d) => setIn(d, path, value));
  const err = (path: string) => errors[path];
  const flagged = (["en", "fr"] as CmsLocale[]).filter((l) => Object.keys(errors).some((k) => k.endsWith(`.${l}`) || k.includes(`.${l}.`)));

  /** One EN/FR text field showing the language picked at the top. */
  const text = (path: string[], label: string, opts: { max: number; required?: boolean; rows?: number; hint?: string } = { max: L.line }) => {
    const key = `${path.join(".")}.${lang}`;
    const value = path.reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], draft) as Record<CmsLocale, string>;
    const control = opts.rows ? (
      <Textarea value={value[lang]} rows={opts.rows} maxLength={opts.max} placeholder={lang === "fr" ? value.en : undefined} onChange={(e) => set([...path, lang], e.target.value)} />
    ) : (
      <Input value={value[lang]} maxLength={opts.max} placeholder={lang === "fr" ? value.en : undefined} onChange={(e) => set([...path, lang], e.target.value)} />
    );
    return (
      <Field label={`${label} (${lang.toUpperCase()})`} required={opts.required && lang === "en"} error={err(key)} hint={opts.hint ?? (lang === "fr" ? tc("frenchHint") : undefined)}>
        {control}
      </Field>
    );
  };

  const mediaField = (path: string[], label: string, required = false) => {
    const value = path.reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], draft) as string;
    return (
      <div className="flex items-end gap-3">
        <MediaThumb src={value} className="h-14 w-20" />
        <Field label={label} required={required} error={err(path.join("."))} hint={tc("mediaHint")} className="flex-1">
          <Input value={value} placeholder="/activities/…/cover.jpg" onChange={(e) => set(path, e.target.value)} />
        </Field>
      </div>
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    setErrors({});

    // The JSON sections must parse before anything is sent.
    const body: ExperienceInput = structuredClone(draft);
    for (const k of ADVANCED) {
      try {
        const parsed = JSON.parse(advanced[k] || "[]") as unknown;
        if (!Array.isArray(parsed)) throw new Error("not a list");
        (body as Record<Advanced, unknown>)[k] = parsed;
      } catch {
        setErrors({ [k]: tc("errors.json") });
        setBanner(tc("errors.jsonIn", { section: t(`advanced.${k}`) }));
        return;
      }
    }
    body.slug = body.slug.trim() || slugify(body.title.en);

    setSaving(true);
    try {
      const { item } = await cmsApi<{ item: AdminExperience }>(
        existing ? `/api/admin/experiences/${existing.id}` : "/api/admin/experiences",
        jsonInit(existing ? "PUT" : "POST", body),
      );
      onSaved(item, !existing);
    } catch (error) {
      if (error instanceof SessionEnded) return onSessionEnded();
      const found = toErrors(error);
      setErrors(found.fields);
      setBanner(found.banner);
      if (found.lang && found.lang !== lang) setLang(found.lang);
    } finally {
      setSaving(false);
    }
  };

  const s = draft.schedule;

  return (
    <AdminDialog
      open
      onClose={() => !saving && onClose()}
      title={existing ? t("editTitle", { name: existing.title.en }) : t("addTitle")}
      description={t("editorHint")}
      closeLabel={tcom("close")}
      size="lg"
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>{tcom("cancel")}</Button>
          <SaveButton form={formId} saving={saving} label={saving ? tc("saving") : existing ? tc("save") : tc("create")} />
        </>
      }
    >
      <form id={formId} onSubmit={(e) => void submit(e)} noValidate className="space-y-8">
        <FormError message={banner} />
        <div className="sticky -top-5 z-10 -mx-6 -mt-5 flex items-center justify-between gap-3 border-b bg-card/95 px-6 py-3 backdrop-blur">
          <p className="text-xs text-muted-foreground">{tc("langHint")}</p>
          <LangSwitch value={lang} onChange={setLang} flagged={flagged} />
        </div>

        <FormSection title={t("sections.basics")}>
          {text(["title"], t("fields.title"), { max: L.title, required: true })}
          <div className="grid gap-4 sm:grid-cols-2">
            {text(["shortTitle"], t("fields.shortTitle"), { max: L.shortTitle, hint: t("hints.shortTitle") })}
            <Field label={t("fields.slug")} error={err("slug")} hint={t("hints.slug")}>
              <Input value={draft.slug} maxLength={80} placeholder={slugify(draft.title.en) || "akagera-national-park-2026"} onChange={(e) => set(["slug"], e.target.value.toLowerCase())} />
            </Field>
          </div>
          {text(["subtitle"], t("fields.subtitle"), { max: L.subtitle })}
          {text(["description"], t("fields.description"), { max: L.description, rows: 5 })}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("fields.status")} error={err("status")}>
              <AdminSelect value={draft.status} onChange={(e) => set(["status"], e.target.value)}>
                {EXPERIENCE_STATUSES.map((x) => <option key={x} value={x}>{tc(`status.${x}`)}</option>)}
              </AdminSelect>
            </Field>
            <Field label={t("fields.availability")} error={err("availability")}>
              <AdminSelect value={draft.availability} onChange={(e) => set(["availability"], e.target.value)}>
                {EXPERIENCE_AVAILABILITY.map((x) => <option key={x} value={x}>{t(`availability.${x}`)}</option>)}
              </AdminSelect>
            </Field>
            <Field label={t("fields.category")} error={err("category")}>
              <AdminSelect value={draft.category} onChange={(e) => set(["category"], e.target.value)}>
                {[...new Set([...CATEGORIES, draft.category])].map((x) => <option key={x} value={x}>{t.has(`categories.${x}`) ? t(`categories.${x}`) : x}</option>)}
              </AdminSelect>
            </Field>
          </div>
          <CheckRow checked={draft.featured} onChange={(v) => set(["featured"], v)} label={t("fields.featured")} hint={t("hints.featured")} />
        </FormSection>

        <FormSection title={t("sections.dates")} hint={t("hints.dates")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("fields.precision")} error={err("schedule.precision")}>
              <AdminSelect value={s.precision} onChange={(e) => set(["schedule", "precision"], e.target.value)}>
                {DATE_PRECISION.map((x) => <option key={x} value={x}>{t(`precision.${x}`)}</option>)}
              </AdminSelect>
            </Field>
            {s.precision === "month" ? (
              <Field label={t("fields.month")} required error={err("schedule.month")}>
                <Input type="month" value={s.month ?? ""} onChange={(e) => set(["schedule", "month"], e.target.value || null)} />
              </Field>
            ) : (
              <>
                <Field label={t("fields.startDate")} required={s.precision === "day"} error={err("schedule.startDate")}>
                  <Input type="date" value={s.startDate ?? ""} onChange={(e) => set(["schedule", "startDate"], e.target.value || null)} />
                </Field>
                <Field label={t("fields.endDate")} error={err("schedule.endDate")} hint={t("hints.endDate")}>
                  <Input type="date" value={s.endDate ?? ""} min={s.startDate ?? undefined} onChange={(e) => set(["schedule", "endDate"], e.target.value || null)} />
                </Field>
              </>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fields.bookingDeadline")} error={err("schedule.bookingDeadline")}>
              <Input type="date" value={s.bookingDeadline ?? ""} onChange={(e) => set(["schedule", "bookingDeadline"], e.target.value || null)} />
            </Field>
            {text(["duration"], t("fields.duration"), { max: 80 })}
          </div>
          {text(["schedule", "departure"], t("fields.departure"), { max: L.line })}
        </FormSection>

        <FormSection title={t("sections.place")}>
          <div className="grid gap-4 sm:grid-cols-2">
            {text(["location", "name"], t("fields.locationName"), { max: 120, required: true })}
            {text(["location", "region"], t("fields.region"), { max: 120 })}
            <Field label={t("fields.country")} error={err("location.country")}>
              <Input value={draft.location.country} maxLength={60} onChange={(e) => set(["location", "country"], e.target.value)} />
            </Field>
            <Field label={t("fields.destination")} error={err("location.destinationId")} hint={t("hints.destination")}>
              <AdminSelect value={draft.location.destinationId ?? ""} onChange={(e) => set(["location", "destinationId"], e.target.value || null)}>
                <option value="">{t("noDestination")}</option>
                {DESTINATIONS.map((d) => <option key={d.id} value={d.id}>{ts(`${d.id}.title`)}</option>)}
              </AdminSelect>
            </Field>
          </div>
        </FormSection>

        <FormSection title={t("sections.media")} hint={t("hints.media")}>
          {mediaField(["media", "cover"], t("fields.cover"), true)}
          <div className="grid gap-4 sm:grid-cols-2">
            {mediaField(["media", "flyer"], t("fields.flyer"))}
            {mediaField(["media", "hero"], t("fields.hero"))}
          </div>
        </FormSection>

        <FormSection
          title={t("sections.gallery")}
          hint={t("hints.gallery")}
          action={
            <Button type="button" size="sm" variant="outline" disabled={draft.media.gallery.length >= L.gallery}
              onClick={() => set(["media", "gallery"], [...draft.media.gallery, { src: "", type: "image", caption: { ...EMPTY_L }, inPreview: false }])}>
              <Plus aria-hidden />
              {t("addPhoto")}
            </Button>
          }
        >
          {draft.media.gallery.length === 0 && <p className="text-sm text-muted-foreground">{t("noPhotos")}</p>}
          {draft.media.gallery.map((g, i) => (
            <RepeatCard key={i} index={i} count={draft.media.gallery.length}
              onMove={(d) => set(["media", "gallery"], moveItem(draft.media.gallery, i, d))}
              onRemove={() => set(["media", "gallery"], removeAt(draft.media.gallery, i))}>
              <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
                {mediaField(["media", "gallery", String(i), "src"], t("fields.file"), true)}
                <Field label={t("fields.type")}>
                  <AdminSelect value={g.type} onChange={(e) => set(["media", "gallery", i, "type"], e.target.value)}>
                    {MEDIA_TYPES.map((x) => <option key={x} value={x}>{t(`mediaTypes.${x}`)}</option>)}
                  </AdminSelect>
                </Field>
              </div>
              {text(["media", "gallery", String(i), "caption"], t("fields.caption"), { max: 160 })}
              <CheckRow checked={g.inPreview} onChange={(v) => set(["media", "gallery", i, "inPreview"], v)} label={t("fields.inPreview")} />
            </RepeatCard>
          ))}
        </FormSection>

        <FormSection
          title={t("sections.prices")}
          hint={t("hints.prices")}
          action={
            <Button type="button" size="sm" variant="outline" disabled={draft.pricing.tiers.length >= L.tiers}
              onClick={() => set(["pricing", "tiers"], [...draft.pricing.tiers, { id: `tier-${draft.pricing.tiers.length + 1}`, label: { ...EMPTY_L }, note: { ...EMPTY_L }, amount: 0, currency: "RWF", highlight: false }])}>
              <Plus aria-hidden />
              {t("addTier")}
            </Button>
          }
        >
          {draft.pricing.tiers.length === 0 && <p className="text-sm text-muted-foreground">{t("noTiers")}</p>}
          {draft.pricing.tiers.map((tier, i) => (
            <RepeatCard key={i} index={i} count={draft.pricing.tiers.length}
              onMove={(d) => set(["pricing", "tiers"], moveItem(draft.pricing.tiers, i, d))}
              onRemove={() => set(["pricing", "tiers"], removeAt(draft.pricing.tiers, i))}>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t("fields.tierId")} required error={err(`pricing.tiers.${i}.id`)} hint={t("hints.tierId")}>
                  <Input value={tier.id} maxLength={40} onChange={(e) => set(["pricing", "tiers", i, "id"], e.target.value)} />
                </Field>
                <Field label={t("fields.amount")} required error={err(`pricing.tiers.${i}.amount`)}>
                  <Input inputMode="numeric" value={Number.isFinite(tier.amount) ? String(tier.amount) : ""}
                    onChange={(e) => set(["pricing", "tiers", i, "amount"], e.target.value === "" ? NaN : Number(e.target.value.replace(/[\s,]/g, "")))} />
                </Field>
                <Field label={t("fields.currency")}>
                  <AdminSelect value={tier.currency} onChange={(e) => set(["pricing", "tiers", i, "currency"], e.target.value)}>
                    {EXPERIENCE_CURRENCIES.map((x) => <option key={x} value={x}>{x}</option>)}
                  </AdminSelect>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {text(["pricing", "tiers", String(i), "label"], t("fields.tierLabel"), { max: 80, required: true })}
                {text(["pricing", "tiers", String(i), "note"], t("fields.tierNote"), { max: L.line })}
              </div>
              <CheckRow checked={tier.highlight} onChange={(v) => set(["pricing", "tiers", i, "highlight"], v)} label={t("fields.highlight")} />
            </RepeatCard>
          ))}
        </FormSection>

        <FormSection title={t("sections.booking")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("fields.bookingMode")} error={err("booking.mode")}>
              <AdminSelect value={draft.booking.mode} onChange={(e) => set(["booking", "mode"], e.target.value)}>
                {BOOKING_MODES.map((x) => <option key={x} value={x}>{t(`bookingModes.${x}`)}</option>)}
              </AdminSelect>
            </Field>
            <Field label={t("fields.seats")} error={err("capacity.seats")}>
              <Input inputMode="numeric" value={draft.capacity.seats ?? ""} onChange={(e) => set(["capacity", "seats"], e.target.value === "" ? null : Number(e.target.value))} />
            </Field>
            <Field label={t("fields.attendees")} error={err("capacity.attendees")} hint={t("hints.attendees")}>
              <Input inputMode="numeric" value={draft.capacity.attendees ?? ""} onChange={(e) => set(["capacity", "attendees"], e.target.value === "" ? null : Number(e.target.value))} />
            </Field>
          </div>
          {text(["booking", "whatsappText"], t("fields.whatsappText"), { max: 500, rows: 2 })}
          {mediaField(["booking", "itinerary"], t("fields.itineraryFile"))}
        </FormSection>

        <FormSection title={t("sections.hero")}>
          <CheckRow checked={draft.hero.promote} onChange={(v) => set(["hero", "promote"], v)} label={t("fields.promote")} hint={t("hints.promote")} />
          {draft.hero.promote && (
            <Field label={t("fields.promoteUntil")} error={err("hero.until")} className="max-w-xs">
              <Input type="date" value={draft.hero.until ?? ""} onChange={(e) => set(["hero", "until"], e.target.value || null)} />
            </Field>
          )}
        </FormSection>

        <FormSection title={t("sections.advanced")} hint={t("hints.advanced")}>
          {ADVANCED.map((k) => (
            <Field key={k} label={t(`advanced.${k}`)} error={errors[k] ?? Object.entries(errors).find(([p]) => p.startsWith(`${k}.`))?.[1]}>
              <Textarea value={advanced[k]} rows={5} spellCheck={false} className="font-mono text-xs"
                onChange={(e) => setAdvanced((a) => ({ ...a, [k]: e.target.value }))} />
            </Field>
          ))}
        </FormSection>
      </form>
    </AdminDialog>
  );
}
