/**
 * Kigali tours: collections ("Fun & adventure", …) and the venues inside them
 * (Tours.collections[] and its venues[] in messages/*.json today).
 * Safe to import in the browser. The database side is lib/cms/tours-server.ts.
 */
import { isFallback, pick, pickList, type CmsLocale, type Localized, type LocalizedList } from "./localized";

export const TOUR_STATUSES = ["draft", "published"] as const;
export type TourStatus = (typeof TOUR_STATUSES)[number];

export const TOUR_CURRENCIES = ["USD", "RWF"] as const;

/** "paid": the price applies. "free": no entry fee. "donation": free, donations welcome. */
export const TOUR_PRICE_TYPES = ["paid", "free", "donation"] as const;
export type TourPriceType = (typeof TOUR_PRICE_TYPES)[number];
export type TourCurrency = (typeof TOUR_CURRENCIES)[number];

export const TOUR_LIMITS = { gallery: 24, paragraphs: 8, highlights: 16, line: 400, venuesPerCollection: 40 } as const;

export type TourCollectionInput = {
  slug: string;
  status: TourStatus;
  /** Display order, smallest first. */
  order: number;
  category: Localized;
  intro: { image: string; title: Localized; headline: Localized; desc: LocalizedList };
};

export type AdminTourCollection = TourCollectionInput & { id: string; createdAt: number; updatedAt: number };

export type TourVenueFacts = {
  duration: Localized;
  groupSize: Localized;
  minAge: Localized;
  bestTime: Localized;
  driveTime: Localized;
  outdoor: boolean;
};

export type TourVenueInput = {
  slug: string;
  /** The tour collection this venue belongs to (its id). */
  collectionId: string;
  status: TourStatus;
  order: number;
  /** Plain /public paths, no uploads. */
  image: string;
  gallery: string[];
  /** Per person, whole units. null when there's no set price. */
  price: number | null;
  currency: TourCurrency;
  priceType: TourPriceType;
  /** A place of remembrance: the Tours page shows the etiquette note. */
  memorial: boolean;
  title: Localized;
  location: Localized;
  tag: Localized;
  summary: Localized;
  history: LocalizedList;
  visitorNote: Localized;
  highlights: LocalizedList;
  facts: TourVenueFacts;
};

export type AdminTourVenue = TourVenueInput & { id: string; createdAt: number; updatedAt: number };

export type PublicTourVenue = {
  id: string;
  slug: string;
  image: string;
  gallery: string[];
  price: number | null;
  currency: TourCurrency;
  priceType: TourPriceType;
  memorial: boolean;
  title: string;
  location: string;
  tag: string;
  summary: string;
  history: string[];
  visitorNote: string;
  highlights: string[];
  facts: { duration: string; groupSize: string; minAge: string; bestTime: string; driveTime: string; outdoor: boolean };
  translated: boolean;
};

export type PublicTourCollection = {
  id: string;
  slug: string;
  category: string;
  intro: { image: string; title: string; headline: string; desc: string[] };
  venues: PublicTourVenue[];
  translated: boolean;
};

function translator(locale: CmsLocale) {
  let translated = false;
  const t = (v: Localized) => {
    if (isFallback(v, locale)) translated = true;
    return pick(v, locale);
  };
  return { t, translated: () => translated };
}

export function localizeVenue(v: AdminTourVenue, locale: CmsLocale): PublicTourVenue {
  const { t, translated } = translator(locale);
  const out = {
    id: v.id, slug: v.slug, image: v.image, gallery: v.gallery, price: v.price, currency: v.currency,
    priceType: v.priceType, memorial: v.memorial,
    title: t(v.title), location: t(v.location), tag: t(v.tag), summary: t(v.summary),
    history: pickList(v.history, locale), visitorNote: t(v.visitorNote), highlights: pickList(v.highlights, locale),
    facts: {
      duration: t(v.facts.duration), groupSize: t(v.facts.groupSize), minAge: t(v.facts.minAge),
      bestTime: t(v.facts.bestTime), driveTime: t(v.facts.driveTime), outdoor: v.facts.outdoor,
    },
  };
  return { ...out, translated: translated() };
}

export function localizeCollection(c: AdminTourCollection, venues: AdminTourVenue[], locale: CmsLocale): PublicTourCollection {
  const { t, translated } = translator(locale);
  const local = venues.map((v) => localizeVenue(v, locale));
  const out = {
    id: c.id,
    slug: c.slug,
    category: t(c.category),
    intro: { image: c.intro.image, title: t(c.intro.title), headline: t(c.intro.headline), desc: pickList(c.intro.desc, locale) },
    venues: local,
  };
  return { ...out, translated: translated() || local.some((v) => v.translated) };
}
