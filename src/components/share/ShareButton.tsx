"use client";

/**
 * Drop-in share button. Two visual variants:
 *   - "icon" — square icon-only button, for use inside action rails
 *   - "labeled" — icon + "Share" label, for prominent surfaces
 *
 * Pass the `ShareablePayload` once; the button owns the dialog state.
 * Use this anywhere — idea pages, venture pages, profile pages.
 */

import React, { useState } from "react";
import { Share2 } from "lucide-react";
import type { ShareablePayload } from "@/lib/share/types";
import { ShareDialog } from "./ShareDialog";

interface Props {
  payload: ShareablePayload;
  variant?: "icon" | "labeled";
  /** ARIA label for the icon-only variant; defaults to "Share". */
  ariaLabel?: string;
  className?: string;
}

export function ShareButton({
  payload,
  variant = "icon",
  ariaLabel = "Share",
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  const baseClasses =
    variant === "icon"
      ? "inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/60 transition hover:border-white/30 hover:text-white"
      : "inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.02] px-3 py-1.5 text-sm font-medium text-white/70 transition hover:border-white/30 hover:text-white";

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={variant === "icon" ? ariaLabel : undefined}
        className={`${baseClasses} ${className ?? ""}`}
      >
        <Share2 className={variant === "icon" ? "h-4 w-4" : "h-4 w-4"} />
        {variant === "labeled" && "Share"}
      </button>

      <ShareDialog open={open} onOpenChange={setOpen} payload={payload} />
    </>
  );
}
