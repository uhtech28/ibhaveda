"use client";

/**
 * Warning dialog shown after the FIRST anti-cheat detection.
 *
 * The user is told the system believes their last answer was
 * AI-generated and that ANY second occurrence — with no time limit —
 * will permanently suspend the account. The warning itself stays on
 * the user's record permanently.
 *
 * No appeal flow in v1; false positives are handled through normal
 * support channels.
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onAcknowledge: () => void;
}

export function AntiCheatWarning({ open, onAcknowledge }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onAcknowledge()}>
      <DialogContent className="max-w-md border-red-600/40 bg-[#1a0a14]">
        <DialogHeader>
          <DialogTitle className="text-red-300">
            Possible AI-generated answer detected
          </DialogTitle>
          <DialogDescription className="space-y-3 text-white/80">
            <span className="block">
              Your last answer in the combat round looked machine-written
              rather than typed in real time.
            </span>
            <span className="block">
              Cross-question combat is meant to test your own thinking.
              Using an AI assistant to draft answers defeats the point and
              is not allowed.
            </span>
            <span className="block font-medium text-yellow-200">
              This is your only warning. Any further detection — at any
              point in the future — will result in a permanent account
              suspension.
            </span>
            <span className="block text-xs text-white/50">
              If you believe this is a false positive, reach out to support
              before continuing.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            onClick={onAcknowledge}
            className="rounded-md border border-red-500/60 bg-red-600/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600/40"
          >
            I understand
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
