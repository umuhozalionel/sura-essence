/**
 * Reads a JSON request body with a size cap, for admin routes that accept an
 * uploaded portrait (at most ~1.2 MB once Base64-encoded).
 */
const DEFAULT_MAX_BYTES = 1.6 * 1024 * 1024;

export async function readJsonBody(
  req: Request,
  maxBytes = DEFAULT_MAX_BYTES,
): Promise<{ ok: true; value: unknown } | { ok: false; error: string; status: number }> {
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { ok: false, error: "unsupported_media_type", status: 415 };
  }
  if (Number(req.headers.get("content-length") ?? 0) > maxBytes) return { ok: false, error: "too_large", status: 413 };
  const raw = await req.text();
  if (raw.length > maxBytes) return { ok: false, error: "too_large", status: 413 };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, error: "invalid_json", status: 400 };
  }
}
