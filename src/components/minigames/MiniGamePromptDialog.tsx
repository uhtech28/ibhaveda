"use client";

/**
 * Pre-game prompt shown after the world-map detects the player has
 * activated a mini-game spawn. The user can engage or dismiss; once
 * engaged, the overlay mounts the Phaser scene.
 */

import React from "react";
import { Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MiniGameSpawnConfig } from "@convex/miniGameConstants";

interface Props {
  spawn: MiniGameSpawnConfig | null;
  onEngage: () => void;
  onDismiss: () => void;
}

const ARCHETYPE_LABEL: Record<string, string> = {
  pattern_match: "Pattern Match",
  reflex_tap: "Reflex Tap",
  decrypt: "Decrypt",
};

const ARCHETYPE_DESCRIPTION: Record<string, string> = {
  pattern_match: "Watch the sequence, repeat it back. Each round adds one step.",
  reflex_tap: "Tap targets before they vanish. Hit 60% to clear.",
  decrypt: "Crack a hidden symbol cipher in six guesses.",
};

export function MiniGamePromptDialog({ spawn, onEngage, onDismiss }: Props) {
  return (
    <Dialog open={spawn !== null} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Easter egg discovered
          </DialogTitle>
          <DialogDescription>
            {spawn?.flavorText ??
              "Something pulses with possibility. Engage?"}
          </DialogDescription>
        </DialogHeader>

        {spawn && (
          <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-white/60">
                Challenge
              </span>
              <span className="font-mono text-xs text-amber-300">
                Difficulty {spawn.difficulty}/5
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-white">
              {ARCHETYPE_LABEL[spawn.archetype]}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              {ARCHETYPE_DESCRIPTION[spawn.archetype]}
            </p>
          </div>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-md border border-white/20 px-3 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
          >
            <span className="inline-flex items-center gap-1">
              <X className="h-3.5 w-3.5" />
              Walk away
            </span>
          </button>
          <button
            type="button"
            onClick={onEngage}
            className="rounded-md border border-amber-400 bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/40"
          >
            Engage
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
