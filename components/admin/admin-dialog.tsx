"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A modal built on the browser's own <dialog>: focus stays inside, Escape and
 * a click on the backdrop close it, and the page behind can't be reached —
 * no extra packages needed.
 */
export function useModal(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden"; // no page scrolling behind the modal
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);
  return ref;
}

const closeOnBackdrop = (onClose: () => void) => (e: React.MouseEvent<HTMLDialogElement>) => {
  if (e.target === e.currentTarget) onClose();
};

export function AdminDialog({
  open,
  onClose,
  title,
  description,
  closeLabel,
  size = "md",
  closeOnBackdrop: backdropCloses = true,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  closeLabel: string;
  size?: "sm" | "md" | "lg";
  /** false for forms, so a stray click outside doesn't throw away what was typed. */
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const ref = useModal(open);
  const titleId = useId();
  const descId = useId();
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onClick={backdropCloses ? closeOnBackdrop(onClose) : undefined}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border bg-card p-0 text-card-foreground shadow-2xl",
        "max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:rounded-none max-sm:border-0",
        size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl",
      )}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col max-sm:h-dvh max-sm:max-h-none">
          <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
              {description && <p id={descId} className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="-mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t bg-muted/40 px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
