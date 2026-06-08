"use client";

/**
 * The "Fire a Flare" button. Lives on venture and checkpoint pages
 * so it's contextual to where the user is stuck. Opens the compose
 * dialog when clicked.
 *
 * Pre-fills `ventureId` and `checkpointId` for the flare so the
 * person responding sees what the user was working on. Both props
 * are optional — the button still works without context (it just
 * fires a generic flare).
 */

import React, { useState } from "react";
import { Radio } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { FlareComposeDialog } from "./FlareComposeDialog";

interface Props {
  ventureId?: Id<"ventures">;
  checkpointId?: Id<"ventureCheckpoints">;
  /** Visual variant — solid is the main CTA; subtle is for inline placement. */
  variant?: "solid" | "subtle";
}

export function FlareTriggerButton({
  ventureId,
  checkpointId,
  variant = "solid",
}: Props) {
  const [open, setOpen] = useState(false);

  const buttonClass =
    variant === "solid"
      ? "inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/20"
      : "inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        <Radio className={variant === "solid" ? "h-4 w-4" : "h-3.5 w-3.5"} />
        Fire a Flare
      </button>

      <FlareComposeDialog
        open={open}
        onOpenChange={setOpen}
        ventureId={ventureId}
        checkpointId={checkpointId}
      />
    </>
  );
}
