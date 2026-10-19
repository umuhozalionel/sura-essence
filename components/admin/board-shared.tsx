"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { initialsOf, type AdminBoardMember } from "@/lib/board-members";

/** Admin-only calls. A 401 means the session ended (expired, or password changed). */
export class SessionEnded extends Error {}

/** Throws SessionEnded on 401, otherwise an Error carrying the status and the route's { error, reason, field }. */
export async function boardApi<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (res.status === 401) throw new SessionEnded();
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; reason?: string; field?: string };
    throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, ...body });
  }
  return (await res.json()) as T;
}

/** Small 4:5 portrait, the same shape as the homepage card. Initials when there's no image. */
export function Thumb({
  item,
  className,
}: {
  item: Pick<AdminBoardMember, "name" | "imageUrl" | "uploadedPhotoUrl">;
  className?: string;
}) {
  const src = item.uploadedPhotoUrl ?? item.imageUrl;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;

  return (
    <div className={cn("relative h-[72px] w-[58px] shrink-0 overflow-hidden rounded-lg border bg-gradient-to-br from-[#125740] to-[#0A1128]", className)}>
      {src && !failed ? (
        // Uploaded photos come from an admin-only route, so next/image's optimizer can't fetch them.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" loading="lazy" onError={() => setFailedSrc(src)} />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white" aria-hidden>
          {initialsOf(item.name)}
        </span>
      )}
    </div>
  );
}
