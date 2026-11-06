/**
 * Trips: what /iwacu/trips lists and each trip's recap photos, edited in Admin → Trips.
 * A trip is customised for one person or group, so it has no dates or seats: those belong
 * to experiences (lib/cms/experiences.ts), which we plan ourselves and run in seasons.
 * Shapes and pure helpers, safe to import in the browser.
 * The database side is lib/cms/trips-server.ts.
 */
import { pick, type CmsLocale, type Localized } from "./localized";
import type { TripCategoryId, TripStatus } from "@/lib/trips";

export const TRIP_STATUSES = ["live", "tour", "maintenance", "soon"] as const satisfies readonly TripStatus[];

export const TRIP_LIMITS = {
  name: 100,
  summary: 300,
  /** Recap photos on one trip. */
  photos: 200,
  /** Largest photo the browser sends to Cloudinary. */
  photoBytes: 15 * 1024 * 1024,
  /** Largest admin request body, bytes. */
  bodyBytes: 16 * 1024,
} as const;

/** One recap photo. The file lives on Cloudinary; only its details are here. */
export type TripPhoto = { id: string; publicId: string; url: string; width: number; height: number };

export type TripInput = {
  /** The web address: /iwacu/trips/<slug>/recap. Fixed once the trip exists. */
  slug: string;
  category: TripCategoryId;
  status: TripStatus;
  name: Localized;
  summary: Localized;
  /** The card's photo: a file under /public, or a recap photo's Cloudinary address. "" for none. */
  image: string;
  /** Where the card leads, like /iwacu/trips/akagera. "" leads to the recap once it has photos. */
  href: string;
  visible: boolean;
};

export type AdminTrip = TripInput & { id: string; photos: TripPhoto[]; createdAt: number; updatedAt: number };

/** One trip in one language, as the website shows it. */
export type PublicTrip = {
  id: string;
  category: TripCategoryId;
  status: TripStatus;
  name: string;
  summary: string;
  image: string | null;
  href: string | null;
  photos: TripPhoto[];
};

/**
 * Trips with pages of their own. `words`: the messages/*.json sections staff can change
 * (Admin → Trips → Page content). `skip`: wording edited elsewhere, on the trip itself.
 * `media`: its photos and links, with the file or address each one starts from.
 */
export const TRIP_PAGES = {
  akagera: {
    words: ["Trips.akagera", "Trips.builder", "Trips.recap", "Brands.iwacu.meta.tripAkagera"],
    skip: ["Trips.akagera.name", "Trips.akagera.summary"],
    // PICTURE, for Lionel to place: the default photo; Page content replaces it.
    media: [{ key: "hero", kind: "photo", default: "/backgrounds/akagera.jpg" }],
  },
  nyungwe: {
    words: ["Trips.nyungwe", "Trips.builder", "Trips.recap", "Brands.iwacu.meta.tripNyungwe"],
    skip: ["Trips.nyungwe.name", "Trips.nyungwe.summary"],
    // PICTURE, for Lionel to place: the default photo; Page content replaces it.
    media: [{ key: "hero", kind: "photo", default: "/backgrounds/nyungwe-activity.jpg" }],
  },
} as const satisfies Record<string, { words: readonly string[]; skip: readonly string[]; media: readonly { key: string; kind: "photo" | "link"; default: string }[] }>;

export const isTripPage = (slug: string): slug is keyof typeof TRIP_PAGES => Object.hasOwn(TRIP_PAGES, slug);

/** One piece of changed wording, as lines. A single-line text is a list of one. */
export type TripPageText = { key: string; en: string[]; fr: string[] };
/** What staff changed on a trip's own pages; everything else keeps its default. */
export type TripPageContent = { text: TripPageText[]; media: { key: string; value: string }[] };

/** The Page content form: every piece with its default and what's saved. */
export type AdminTripPage = {
  blocks: { key: string; list: boolean; default: { en: string[]; fr: string[] }; saved: { en: string[]; fr: string[] } }[];
  media: { key: string; kind: "photo" | "link"; default: string; saved: string }[];
};

const UPLOAD_PATH = "/image/upload/";

/** A Cloudinary photo at most `width` wide, in the best format for the browser. Local files stay as they are. */
export const sizedPhoto = (url: string, width: number) =>
  url.startsWith("https://") && url.includes(UPLOAD_PATH) ? url.replace(UPLOAD_PATH, `${UPLOAD_PATH}f_auto,q_auto,c_limit,w_${width}/`) : url;

/** Only a trip open for booking has a recap. */
export const hasRecap = (trip: { status: TripStatus }) => trip.status === "live";

export const localizeTrip = (trip: AdminTrip, locale: CmsLocale): PublicTrip => ({
  id: trip.slug,
  category: trip.category,
  status: trip.status,
  name: pick(trip.name, locale),
  summary: pick(trip.summary, locale),
  image: trip.image ? sizedPhoto(trip.image, 1000) : null,
  // An open trip with its own page (TRIP_PAGES) leads there even when Admin → Trips leaves the link empty.
  href: trip.status === "maintenance" ? null
    : trip.href || (hasRecap(trip) && isTripPage(trip.slug) ? `/iwacu/trips/${trip.slug}` : null) || (hasRecap(trip) && trip.photos.length ? `/iwacu/trips/${trip.slug}/recap` : null),
  photos: trip.photos,
});
