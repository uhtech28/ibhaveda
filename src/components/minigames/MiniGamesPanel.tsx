"use client";

/**
 * Side panel that lists the available mini-games. Replaces the
 * floating-dot easter-egg UX with a cleaner sidebar entry — same
 * archetype catalogue, same reward backend (PRD §2.3.3 idempotency
 * still applies: each spawn pays XP at most once per user).
 *
 * Lifecycle is owned by the parent page via `useMiniGameLifecycle`,
 * which exposes:
 *   - `engageWithSpawn(spawn)` — open the prompt for a spawn config
 *   - `completedSpawnIds`      — which spawns have already paid XP
 *
 * The "first completion grants XP, replays grant zero" gate is on the
 * server (`miniGames.startSession` refuses already-completed spawns),
 * so the UI can offer "Play again (no XP)" without risking duplicate
 * grants.
 */

import React from "react";
import { Gamepad2, Sparkles, Zap, KeyRound, X, Check } from "lucide-react";
import type { MiniGameSpawnConfig, MiniGameArchetype } from "@convex/miniGameConstants";
import { MINIGAME_SPAWNS, REWARD_TABLE } from "@convex/miniGameConstants";

const ARCHETYPE_META: Record<
  MiniGameArchetype,
  { label: string; description: string; accent: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pattern_match: {
    label: "Pattern Match",
    description: "Memorise a sequence of glyphs and play it back.",
    accent: "purple",
    icon: Sparkles,
  },
  reflex_tap: {
    label: "Reflex Tap",
    description: "Hit targets before they vanish from the grid.",
    accent: "emerald",
    icon: Zap,
  },
  decrypt: {
    label: "Decrypt",
    description: "Crack a hidden cipher in six guesses.",
    accent: "amber",
    icon: KeyRound,
  },
};

interface Props {
  open: boolean;
  onClose: () => void;
  /** Already-cleared spawn ids — these show as "Done" instead of "Play". */
  completedSpawnIds: string[];
  /** Open the prompt for a spawn (calls the lifecycle hook upstream). */
  onPlay: (spawn: MiniGameSpawnConfig) => void;
}

export function MiniGamesPanel({ open, onClose, completedSpawnIds, onPlay }: Props) {
  if (!open) return null;

  const completed = new Set(completedSpawnIds);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mini games"
      className="fixed inset-y-0 left-[60px] sm:left-[72px] z-[70] flex w-full max-w-[420px] flex-col border-r border-white/10 bg-[#0E0C17]/95 backdrop-blur-xl shadow-2xl"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-fuchsia-300" />
          <h2 className="font-mono text-sm uppercase tracking-widest text-white/80">
            Mini Games
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Close mini games panel"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <p className="shrink-0 px-4 pt-3 text-xs text-white/50">
        Quick puzzles you can take a break with. Each grants XP the first
        time you clear it; replays are just for fun.
      </p>

      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15">
        {MINIGAME_SPAWNS.map((spawn) => {
          const meta = ARCHETYPE_META[spawn.archetype];
          const Icon = meta.icon;
          const isDone = completed.has(spawn.id);
          const xp =
            REWARD_TABLE.base[spawn.archetype] *
            REWARD_TABLE.difficultyMultiplier[spawn.difficulty - 1];
          return (
            <li
              key={spawn.id}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-3 transition hover:border-white/20"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border bg-${meta.accent}-500/10 border-${meta.accent}-500/30`}
                >
                  <Icon className={`h-4 w-4 text-${meta.accent}-300`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium text-white">
                      {meta.label}
                    </p>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-white/40">
                      Lv. {spawn.difficulty}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-white/50">
                    {spawn.flavorText ?? meta.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] tabular-nums text-white/40">
                      {isDone ? "Already cleared" : `~${Math.round(xp)} XP`}
                    </span>
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300">
                        <Check className="h-3 w-3" />
                        Done
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onPlay(spawn)}
                        className="rounded-md border border-fuchsia-500/40 bg-fuchsia-500/15 px-2.5 py-1 text-[11px] font-medium text-fuchsia-200 transition hover:bg-fuchsia-500/25"
                      >
                        Play
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
