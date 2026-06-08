"use client";

/**
 * Post-game result panel. Renders one of three states:
 *
 *   - won       — score + XP reward, "back to map" button
 *   - lost      — score + "try later" copy, "back to map"
 *   - flagged   — anti-cheat suspicion, reward suppressed, support note
 *
 * The reward payload is the typed union from `miniGameTypes`; v1
 * always emits the `xp` variant but we render through the same
 * branch-matching pattern so future cosmetic + portal variants drop
 * in cleanly.
 */

import React from "react";
import { CheckCircle2, ShieldAlert, X, ChevronRight } from "lucide-react";
import type { MiniGameCompletionView } from "@convex/miniGameTypes";
import type { MiniGameSpawnConfig } from "@convex/miniGameConstants";

interface Props {
  completion: MiniGameCompletionView;
  onClose: () => void;
  /** Next un-cleared spawn (if any) — enables a "Play next" jump. */
  nextSpawn?: MiniGameSpawnConfig | null;
  /** Click handler for the next-spawn button. */
  onPlayNext?: (spawn: MiniGameSpawnConfig) => void;
}

const ARCHETYPE_LABEL: Record<string, string> = {
  pattern_match: "Pattern Match",
  reflex_tap: "Reflex Tap",
  decrypt: "Decrypt",
};

export function MiniGameResultPanel({
  completion,
  onClose,
  nextSpawn,
  onPlayNext,
}: Props) {
  const canPlayNext = nextSpawn != null && onPlayNext != null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mini-game result"
      className="fixed inset-0 z-[86] flex items-center justify-center bg-black/85 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md border-2 border-white/20 bg-[#0E0C17] p-6">
        <header className="mb-4 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
            Result
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-white/40 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {completion.flagged ? (
          <FlaggedBody reason={completion.flagReason ?? "Unexpected result"} />
        ) : completion.outcome === "won" ? (
          <WonBody completion={completion} />
        ) : (
          <LostBody completion={completion} />
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/30 bg-black px-4 py-2 font-mono text-xs uppercase tracking-wider text-white/70 transition hover:border-white/60 hover:text-white"
          >
            Back to map
          </button>
          {canPlayNext && (
            <button
              type="button"
              onClick={() => onPlayNext!(nextSpawn!)}
              className="inline-flex items-center gap-1 rounded-md border border-fuchsia-400 bg-fuchsia-500/20 px-4 py-2 font-mono text-xs uppercase tracking-wider text-fuchsia-100 transition hover:bg-fuchsia-500/40"
            >
              Next: {ARCHETYPE_LABEL[nextSpawn!.archetype]} · Lv.{" "}
              {nextSpawn!.difficulty}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Bodies
// ─────────────────────────────────────────────────────────────────────

function WonBody({ completion }: { completion: MiniGameCompletionView }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-2xl font-bold text-emerald-300">
        <CheckCircle2 className="h-6 w-6" />
        Cleared
      </h2>
      <p className="text-sm text-white/70">
        Difficulty {completion.difficulty}/5 — score {" "}
        {Math.round(completion.scoreNormalized * 100)}%
      </p>
      <RewardLine reward={completion.reward} />
    </div>
  );
}

function LostBody({ completion }: { completion: MiniGameCompletionView }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold text-red-300">Not this time</h2>
      <p className="text-sm text-white/70">
        Score: {Math.round(completion.scoreNormalized * 100)}%. The spawn is
        still there — try again when you're ready.
      </p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
        No XP earned
      </p>
    </div>
  );
}

function FlaggedBody({ reason }: { reason: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-2xl font-bold text-yellow-300">
        <ShieldAlert className="h-6 w-6" />
        Result flagged
      </h2>
      <p className="text-sm text-white/80">
        Your result didn't pass the integrity check. No XP was awarded.
      </p>
      <p className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2 font-mono text-[11px] text-yellow-200">
        {reason}
      </p>
      <p className="text-xs text-white/40">
        If you believe this is a mistake, contact support.
      </p>
    </div>
  );
}

function RewardLine({
  reward,
}: {
  reward: MiniGameCompletionView["reward"];
}) {
  switch (reward.kind) {
    case "xp":
      return (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-300">
            Reward
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-200">
            +{reward.amount} XP
          </p>
        </div>
      );
    case "cosmetic":
      return (
        <div className="rounded-md border border-purple-500/30 bg-purple-500/10 p-3 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-purple-300">
            Cosmetic unlocked
          </p>
          <p className="mt-1 text-base font-semibold text-purple-200">
            {reward.label}
          </p>
        </div>
      );
    case "portal":
      return (
        <div className="rounded-md border border-sky-500/30 bg-sky-500/10 p-3 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-sky-300">
            Portal opened
          </p>
          <p className="mt-1 text-base font-semibold text-sky-200">
            {reward.label}
          </p>
        </div>
      );
  }
}
