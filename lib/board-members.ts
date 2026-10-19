/**
 * Board members (the founders shown on the homepage): shapes, limits and checks
 * shared by the admin screen, the API routes and the homepage section.
 * Safe to import in the browser. The database side is lib/board-members-server.ts.
 *
 * Text that visitors read (role, tagline, bio) is stored in English and French.
 * French may be left empty, in which case the site falls back to English.
 */

export type BoardLocale = "en" | "fr";
export const BOARD_LOCALES: readonly BoardLocale[] = ["en", "fr"];

export type Localized = Record<BoardLocale, string>;
export type LocalizedParagraphs = Record<BoardLocale, string[]>;

export const SOCIAL_PLATFORMS = ["linkedin", "instagram", "facebook", "twitter", "website"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type SocialLink = { platform: SocialPlatform; url: string };

/** lib/icons.ts names for each platform. */
export const SOCIAL_ICON: Record<SocialPlatform, string> = {
  linkedin: "linkedin",
  instagram: "instagram",
  facebook: "facebook",
  twitter: "twitter",
  website: "globe",
};

export const SOCIAL_LABEL: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X (Twitter)",
  website: "Website",
};

export const BOARD_LIMITS = {
  name: 80,
  role: 60,
  tagline: 140,
  bio: 2000, // per language, all paragraphs together
  email: 120,
  url: 300,
  imageUrl: 500,
  socials: 6,
  members: 24,
} as const;

/** Uploaded portraits: 4:5, the shape of the homepage cards. */
export const BOARD_PHOTO = { width: 960, height: 1200, maxBytes: 900 * 1024 } as const;
export const BOARD_PHOTO_TYPES = ["image/webp", "image/jpeg"] as const;
export type BoardPhotoMime = (typeof BOARD_PHOTO_TYPES)[number];

/** What the admin screen works with. */
export type AdminBoardMember = {
  id: string;
  name: string;
  role: Localized;
  tagline: Localized;
  bio: LocalizedParagraphs;
  email: string;
  socials: SocialLink[];
  /** A link or a /public path, used when no photo has been uploaded. */
  imageUrl: string;
  /** The uploaded photo (admin route), or null. */
  uploadedPhotoUrl: string | null;
  photoBytes: number | null;
  order: number;
  visible: boolean;
  updatedAt: number;
};

/** What the homepage renders: one language, ready to show. */
export type PublicBoardMember = {
  id: string;
  name: string;
  initials: string;
  photo: string;
  role: string;
  tagline: string;
  bio: string[];
  email: string;
  socials: { id: string; icon: string; label: string; href: string }[];
};

/** What the admin form sends. `photo`: undefined keeps the current one, null removes it. */
export type BoardMemberInput = {
  name: string;
  role: Localized;
  tagline: Localized;
  bio: LocalizedParagraphs;
  email: string;
  socials: SocialLink[];
  imageUrl: string;
  visible: boolean;
  photo?: { mime: BoardPhotoMime; base64: string } | null;
};

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const first = Array.from(words[0])[0] ?? "";
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] ?? "" : "";
  return (first + last).toUpperCase();
}

/** Paragraphs from a textarea: separated by a blank line. */
export const toParagraphs = (text: string) =>
  text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

export const fromParagraphs = (paragraphs: string[]) => paragraphs.join("\n\n");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isEmail = (s: string) => EMAIL.test(s);

/** https links only, so a stored link can never run script. */
export function isHttpsUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "https:" && Boolean(u.hostname);
  } catch {
    return false;
  }
}

/** A path under /public ("/images/team/x.jpg") or an https link. */
export const isImageUrl = (s: string) => (s.startsWith("/") && !s.startsWith("//") && !s.includes("..")) || isHttpsUrl(s);

export type BoardFieldError =
  | "nameRequired" | "nameTooLong"
  | "roleRequired" | "roleTooLong"
  | "taglineTooLong" | "bioTooLong"
  | "emailInvalid" | "imageUrlInvalid"
  | "socialInvalid" | "tooManySocials";

/** Field → problem. Empty object = fine. Used by the form and, again, by the server. */
export function validateBoardMember(v: Omit<BoardMemberInput, "photo">): Partial<Record<string, BoardFieldError>> {
  const errors: Partial<Record<string, BoardFieldError>> = {};
  if (!v.name.trim()) errors.name = "nameRequired";
  else if (v.name.length > BOARD_LIMITS.name) errors.name = "nameTooLong";
  if (!v.role.en.trim()) errors["role.en"] = "roleRequired";
  for (const l of BOARD_LOCALES) {
    if (v.role[l].length > BOARD_LIMITS.role) errors[`role.${l}`] = "roleTooLong";
    if (v.tagline[l].length > BOARD_LIMITS.tagline) errors[`tagline.${l}`] = "taglineTooLong";
    if (v.bio[l].join("\n\n").length > BOARD_LIMITS.bio) errors[`bio.${l}`] = "bioTooLong";
  }
  if (v.email && (v.email.length > BOARD_LIMITS.email || !isEmail(v.email))) errors.email = "emailInvalid";
  if (v.imageUrl && (v.imageUrl.length > BOARD_LIMITS.imageUrl || !isImageUrl(v.imageUrl))) errors.imageUrl = "imageUrlInvalid";
  if (v.socials.length > BOARD_LIMITS.socials) errors.socials = "tooManySocials";
  v.socials.forEach((s, i) => {
    if (!SOCIAL_PLATFORMS.includes(s.platform) || s.url.length > BOARD_LIMITS.url || !isHttpsUrl(s.url)) {
      errors[`socials.${i}`] = "socialInvalid";
    }
  });
  return errors;
}

/** One language of a member, for the homepage. French falls back to English. */
export function localize(
  m: Pick<AdminBoardMember, "id" | "name" | "role" | "tagline" | "bio" | "email" | "socials"> & { photo: string },
  locale: BoardLocale,
): PublicBoardMember {
  const pick = (v: Localized) => v[locale].trim() || v.en;
  return {
    id: m.id,
    name: m.name,
    initials: initialsOf(m.name),
    photo: m.photo,
    role: pick(m.role),
    tagline: pick(m.tagline),
    bio: m.bio[locale].length ? m.bio[locale] : m.bio.en,
    email: m.email,
    socials: m.socials.map((s, i) => ({
      id: `${s.platform}-${i}`,
      icon: SOCIAL_ICON[s.platform],
      label: SOCIAL_LABEL[s.platform],
      href: s.url,
    })),
  };
}
