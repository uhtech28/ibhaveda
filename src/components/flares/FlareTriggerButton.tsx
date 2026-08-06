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
// Icon: uses the same user-supplied menu-flare art (v2, background
// stripped) that renders on the Adventurer's Menu Flare tile — keeps
// visual identity consistent between the tile that opens the compose
// dialog and the button that also opens it from the CheckpointPanel.
import { PixelIcon } from "@/components/ui/PixelIcon";
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass}
        data-tutorial="flare-button"
      >
        <PixelIcon
          name="menu-flare-v2"
          size={variant === "solid" ? 20 : 18}
          alt="Flare"
        />
        Flare
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
