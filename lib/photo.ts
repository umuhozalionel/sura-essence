/**
 * Turns whatever the visitor picks into a small, safe square avatar.
 *
 *  - centre-crops to a square and scales to 320 × 320
 *  - honours the phone's EXIF rotation, then throws EXIF away entirely —
 *    re-encoding through a canvas strips GPS location and camera details
 *  - re-encodes to WebP (JPEG on browsers that can't write WebP)
 *
 * A 12 MB phone photo comes out at roughly 20–60 KB, well under the 1 MB cap
 * in storage.rules. The original file never leaves the device.
 */

export const PHOTO_INPUT_MAX_BYTES = 15 * 1024 * 1024;
export const PHOTO_OUTPUT_PX = 320;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export type PreparedPhoto = { blob: Blob; ext: "webp" | "jpg"; type: "image/webp" | "image/jpeg" };
export type PhotoError = "photoType" | "photoSize" | "photoRead";

export class PhotoProblem extends Error {
  constructor(public code: PhotoError) { super(code); }
}

/** For the file input's `accept` attribute. */
export const PHOTO_ACCEPT = ACCEPTED.join(",");

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (!ACCEPTED.includes(file.type)) throw new PhotoProblem("photoType");
  if (file.size > PHOTO_INPUT_MAX_BYTES) throw new PhotoProblem("photoSize");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Corrupt file, or a format this browser can't decode (e.g. HEIC outside Safari).
    throw new PhotoProblem("photoRead");
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_OUTPUT_PX;
  canvas.height = PHOTO_OUTPUT_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PhotoProblem("photoRead");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, PHOTO_OUTPUT_PX, PHOTO_OUTPUT_PX);
  bitmap.close();

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));

  // Browsers that can't write WebP silently hand back a PNG instead.
  const webp = await encode("image/webp");
  if (webp && webp.type === "image/webp") return { blob: webp, ext: "webp", type: "image/webp" };

  const jpeg = await encode("image/jpeg");
  if (jpeg && jpeg.type === "image/jpeg") return { blob: jpeg, ext: "jpg", type: "image/jpeg" };

  throw new PhotoProblem("photoRead");
}
