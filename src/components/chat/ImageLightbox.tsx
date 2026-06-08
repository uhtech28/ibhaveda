"use client";

/**
 * Full-screen image viewer triggered by clicking an image in a
 * message bubble. Pinch / scroll zoom intentionally not implemented
 * in v1 — the browser's native ctrl+scroll handles desktop, and
 * mobile users get an "open in new tab" affordance via long-press.
 *
 * Closes on background click, Esc key, or the close button.
 */

import React, { useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  url: string | null;
  alt: string;
  width?: number;
  height?: number;
  onClose: () => void;
}

export function ImageLightbox({ url, alt, width, height, onClose }: Props) {
  // Esc to close — Radix's Dialog handles this, but we add an explicit
  // listener for the case where the dialog has been styled out of the
  // tree (e.g. by an ancestor focus trap).
  useEffect(() => {
    if (!url) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [url, onClose]);

  return (
    <Dialog
      open={url !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-w-[95vw] border-0 bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative flex items-center justify-center">
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={alt}
              width={width}
              height={height}
              className="max-h-[90vh] max-w-full rounded-md object-contain"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image"
            className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black text-white transition hover:bg-white hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
