/**
 * Cloudinary, for admin profile photos and CVs. No SDK: every request is signed
 * here with node:crypto (SHA-1 of the sorted parameters + the API secret), the
 * way Cloudinary documents it.
 *
 * Files never pass through this server: the browser uploads straight to
 * Cloudinary with a signature from /api/admin/profile/upload-signature, which
 * fixes where the file goes (sura-admin/<account id>/avatar or /cv). The server
 * then checks Cloudinary's reply before it saves anything.
 *
 *   avatar  preset "sura_admin_avatar", delivery type "upload" (public), jpg/png/webp
 *   cv      preset "sura_admin_cv", delivery type "authenticated": only reachable
 *           through a short-lived signed link (privateDownloadUrl)
 *
 * The presets (allowed formats, maximum size, incoming crop) are set in the
 * Cloudinary console; see README.md.
 *
 * SERVER ONLY. CLOUDINARY_API_SECRET never leaves this file.
 */
import { createHash, timingSafeEqual } from "node:crypto";

export type UploadKind = "avatar" | "cv";

const KINDS = {
  avatar: { preset: "sura_admin_avatar", type: "upload", formats: ["jpg", "jpeg", "png", "webp"], maxBytes: 5 * 1024 * 1024 },
  cv: { preset: "sura_admin_cv", type: "authenticated", formats: ["pdf"], maxBytes: 10 * 1024 * 1024 },
} as const;

/** Limits the browser checks before uploading (Cloudinary's presets enforce them too). */
export const UPLOAD_LIMITS = { avatar: KINDS.avatar.maxBytes, cv: KINDS.cv.maxBytes } as const;

function settings() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  };
}

export const isCloudinaryConfigured = () => {
  const s = settings();
  return Boolean(s.cloudName && s.apiKey && s.apiSecret);
};

type Params = Record<string, string | number>;

/** Cloudinary's signature: "a=1&b=2" (sorted, no api_key / file / resource_type) + secret, SHA-1 hex. */
function sign(params: Params): string {
  const payload = Object.keys(params)
    .filter((k) => params[k] !== "" && params[k] !== undefined)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(payload + settings().apiSecret).digest("hex");
}

const now = () => Math.floor(Date.now() / 1000);

/** Where each person's files live. Fixed by the server, so nobody can write over someone else's. */
export const publicIdFor = (userId: string, kind: UploadKind) => `sura-admin/${userId}/${kind}`;

/** Everything the browser needs to upload one file directly to Cloudinary. */
export function uploadSignature(userId: string, kind: UploadKind) {
  const { cloudName, apiKey } = settings();
  const k = KINDS[kind];
  const params: Params = {
    invalidate: "true",
    overwrite: "true",
    public_id: publicIdFor(userId, kind),
    timestamp: now(),
    type: k.type,
    upload_preset: k.preset,
  };
  return {
    url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    fields: { ...params, api_key: apiKey, signature: sign(params) } as Record<string, string | number>,
    maxBytes: k.maxBytes,
  };
}

/** Cloudinary signs its upload reply with sha1("public_id=…&version=…" + secret). */
export function isGenuineUpload(publicId: string, version: number, signature: string): boolean {
  if (typeof signature !== "string") return false;
  const expected = Buffer.from(sign({ public_id: publicId, version }));
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export type StoredFile = { publicId: string; version: number; format: string; bytes: number; width: number; height: number };

/**
 * Reads the uploaded file's real details from Cloudinary (Admin API), so the
 * format and size come from Cloudinary rather than from the browser.
 * null when the file isn't there or isn't an allowed one.
 */
export async function fetchUploaded(userId: string, kind: UploadKind): Promise<StoredFile | null> {
  const { cloudName, apiKey, apiSecret } = settings();
  const k = KINDS[kind];
  const publicId = publicIdFor(userId, kind);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/${k.type}/${publicId.split("/").map(encodeURIComponent).join("/")}`,
    { headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}` }, cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Cloudinary resources ${res.status}`);
  const r = (await res.json()) as { public_id: string; version: number; format: string; bytes: number; width?: number; height?: number };
  if (r.public_id !== publicId || !(k.formats as readonly string[]).includes(r.format) || r.bytes > k.maxBytes) return null;
  return { publicId, version: r.version, format: r.format, bytes: r.bytes, width: r.width ?? 0, height: r.height ?? 0 };
}

/** Removes a person's file (photo or CV). Missing files count as removed. */
export async function destroyUpload(userId: string, kind: UploadKind): Promise<void> {
  if (!isCloudinaryConfigured()) return;
  const { cloudName, apiKey } = settings();
  const params: Params = { invalidate: "true", public_id: publicIdFor(userId, kind), timestamp: now(), type: KINDS[kind].type };
  const body = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([a, b]) => [a, String(b)])), api_key: apiKey, signature: sign(params) });
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: "POST", body, cache: "no-store" });
  if (!res.ok) throw new Error(`Cloudinary destroy ${res.status}`);
}

/** A profile photo, cropped square around the face, in the best format for the browser. */
export function avatarUrl(publicId: string, version: number, size = 128): string {
  const { cloudName } = settings();
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_face,w_${size},h_${size},f_auto,q_auto/v${version}/${publicId}`;
}

/** A signed link to a private CV that stops working after `seconds`. */
export function privateDownloadUrl(publicId: string, format: string, seconds = 300): string {
  const { cloudName, apiKey } = settings();
  const params: Params = {
    attachment: "true",
    expires_at: now() + seconds,
    format,
    public_id: publicId,
    timestamp: now(),
    type: "authenticated",
  };
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([a, b]) => [a, String(b)])),
    api_key: apiKey,
    signature: sign(params),
  });
  return `https://api.cloudinary.com/v1_1/${cloudName}/image/download?${query}`;
}
