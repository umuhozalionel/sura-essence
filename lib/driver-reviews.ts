/**
 * Driver page reviews: the shapes and rules shared by the browser and the
 * server. No database code here, so client components can import it.
 *
 * Reviews are managed in the admin portal (Admin → Driver reviews). The first
 * time that screen opens, the sample reviews from messages/*.json
 * ("Driver.reviews.items") are copied into the database flagged as samples,
 * so they're easy to find and replace with real ones before launch.
 */

export const DRIVER_REVIEW_LOCALES = ["en", "fr"] as const;
export type DriverReviewLocale = (typeof DRIVER_REVIEW_LOCALES)[number];

/** Vehicle ids from lib/pricing.ts; the label comes from BookingForm.vehicles.<id>.name. */
export const DRIVER_REVIEW_CARS = [
  "sedan", "suv", "premium_suv", "luxury_suv", "van", "bus", "electric_sedan", "electric_suv",
] as const;
export type DriverReviewCar = (typeof DRIVER_REVIEW_CARS)[number];

export const DRIVER_REVIEW_LIMITS = { client: 60, comment: 600, commentMin: 20, max: 50 } as const;

/** How many approved reviews the Driver page shows. */
export const DRIVER_REVIEWS_SHOWN = 6;

export type DriverReviewStatus = "pending" | "approved";

export type DriverReviewInput = {
  client: string;
  car: DriverReviewCar;
  comment: { en: string; fr: string };
  /** Marks placeholder reviews that should be replaced with real ones. */
  sample: boolean;
};

export type AdminDriverReview = DriverReviewInput & {
  id: string;
  status: DriverReviewStatus;
  createdAt: number;
  updatedAt: number;
};

/** One review in one language, as the Driver page shows it. */
export type PublicDriverReview = {
  id: string;
  client: string;
  car: DriverReviewCar;
  comment: string;
  /** True when the French text is missing and the English one is shown instead. */
  translated: boolean;
};

export const isDriverReviewCar = (v: unknown): v is DriverReviewCar =>
  typeof v === "string" && (DRIVER_REVIEW_CARS as readonly string[]).includes(v);

/** Field → message key (Admin.driverReviews.errors.<key>). Empty object when everything is fine. */
export function validateDriverReview(v: DriverReviewInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!v.client) errors.client = "clientRequired";
  else if (v.client.length > DRIVER_REVIEW_LIMITS.client) errors.client = "tooLong";
  if (!isDriverReviewCar(v.car)) errors.car = "carInvalid";
  if (v.comment.en.length < DRIVER_REVIEW_LIMITS.commentMin) errors["comment.en"] = "commentShort";
  for (const l of DRIVER_REVIEW_LOCALES) {
    if (v.comment[l].length > DRIVER_REVIEW_LIMITS.comment) errors[`comment.${l}`] = "tooLong";
  }
  return errors;
}

export function localizeDriverReview(r: Pick<AdminDriverReview, "id" | "client" | "car" | "comment">, locale: DriverReviewLocale): PublicDriverReview {
  const text = r.comment[locale];
  return { id: r.id, client: r.client, car: r.car, comment: text || r.comment.en, translated: !text && locale !== "en" };
}
