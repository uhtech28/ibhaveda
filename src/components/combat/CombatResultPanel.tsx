"use client";

/**
 * Win / loss screen at the end of a combat round.
 *
 *   WIN  → "You defeated the boss" message, HP timeline replay,
 *          single "Advance" button that closes the panel and lets
 *          the surrounding venture flow move the user to the next
 *          checkpoint.
 *
 *   LOSS → "The boss wore you down" message, HP timeline replay,
 *          single "Retry combat" button. The retry always pulls
 *          fresh, never-seen questions — enforced server-side via
 *          the by_user_normalized index.
 *
 * The HP timeline replays the round's exchanges as small chips so
 * the user can see how the fight progressed — useful for learning
 * which questions they did well or poorly on.
 */

import React from "react";
import { motion } from "framer-motion";
import type { CombatRoundResult } from "@/lib/combat/types";

interface Props {
  result: CombatRoundResult;
  bossHpInitial: number;
  playerHpInitial: number;
  onAdvance: () => void;
  onRetryCombat: () => void;
}

export function CombatResultPanel({
  result,
  bossHpInitial,
  playerHpInitial,
  onAdvance,
  onRetryCombat,
}: Props) {
  const isWin = result.outcome === "won";

  return (
    <div className="relative flex flex-col gap-6">
      {/* Full-panel victory burst — green-gold radial flash + six
          radiating sparkles. Plays once on mount of the win result. */}
      {isWin && (
        <>
          <motion.div
            key="victory-flash"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.7, 0], scale: [0.6, 1.4, 1.6] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="pointer-events-none absolute -inset-4 z-30"
            style={{
              background:
                "radial-gradient(circle, rgba(52,211,153,0.7) 0%, rgba(253,224,71,0.3) 40%, transparent 70%)",
            }}
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.span
              key={`spark-${i}`}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 0],
                x: Math.cos((i * Math.PI) / 3) * 160,
                y: Math.sin((i * Math.PI) / 3) * 160,
                scale: [0.5, 1.4, 0.4],
              }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="pointer-events-none absolute left-1/2 top-1/3 z-30 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_14px_#fde047]"
            />
          ))}
        </>
      )}

      {/* Defeat vignette — heavy red wash closing in from the edges. */}
      {!isWin && (
        <motion.div
          key="defeat-vignette"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0.45] }}
          transition={{ duration: 1.3, ease: "easeInOut" }}
          className="pointer-events-none absolute -inset-4 z-30"
          style={{
            background:
              "radial-gradient(circle, transparent 25%, rgba(239,68,68,0.55) 90%)",
          }}
        />
      )}

      <Header isWin={isWin} attemptNumber={result.attemptNumber} />

      <HpReplay
        timeline={result.hpTimeline}
        bossHpInitial={bossHpInitial}
        playerHpInitial={playerHpInitial}
        finalScores={result.perQuestionScores}
      />

      <XpSummary points={result.individualPointsAwarded} />

      {isWin ? (
        <WinActions onAdvance={onAdvance} />
      ) : (
        <LossActions onRetryCombat={onRetryCombat} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Header — keys the visual tone of the panel
// ─────────────────────────────────────────────────────────────────────

function Header({
  isWin,
  attemptNumber,
}: {
  isWin: boolean;
  attemptNumber: number;
}) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <p
          className="font-mono text-[10px] uppercase tracking-widest text-white/40"
          style={{ fontFamily: "var(--font-pixel-display), monospace" }}
        >
          {isWin ? "Victory" : "Defeat"}
        </p>
        <h2
          className={`mt-1 text-2xl font-bold ${
            isWin ? "text-emerald-300" : "text-red-300"
          }`}
          style={{ fontFamily: "var(--font-pixel-display), monospace" }}
        >
          {isWin ? "Boss defeated" : "You were worn down"}
        </h2>
      </div>
      <span className="font-mono text-[11px] text-white/40">
        Attempt #{attemptNumber}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// HP timeline replay — a small chip per question
// ─────────────────────────────────────────────────────────────────────

function HpReplay({
  timeline,
  bossHpInitial,
  playerHpInitial,
  finalScores,
}: {
  timeline: Array<{ bossHpAfter: number; playerHpAfter: number }>;
  bossHpInitial: number;
  playerHpInitial: number;
  finalScores: number[];
}) {
  return (
    <div className="border-2 border-white/20 bg-black p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
        Round replay
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
        {timeline.map((step, i) => {
          const score = finalScores[i] ?? 1;
          return (
            <div
              key={i}
              className="flex flex-col gap-2 border border-white/10 bg-black/40 p-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-white/50">
                  Q{i + 1}
                </span>
                <span
                  className={`font-mono text-xs font-semibold ${scoreColour(
                    score,
                  )}`}
                >
                  {score}/5
                </span>
              </div>
              <ReplayBar
                label="Boss"
                current={step.bossHpAfter}
                initial={bossHpInitial}
                colour="#FF6B6B"
              />
              <ReplayBar
                label="You"
                current={step.playerHpAfter}
                initial={playerHpInitial}
                colour="#7CFFB3"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReplayBar({
  label,
  current,
  initial,
  colour,
}: {
  label: string;
  current: number;
  initial: number;
  colour: string;
}) {
  const frac = initial > 0 ? Math.max(0, current / initial) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-[10px]">
        <span className="font-mono text-white/50">{label}</span>
        <span className="font-mono tabular-nums text-white/60">
          {Math.max(0, current)}
        </span>
      </div>
      <div className="h-1.5 w-full bg-black border border-white/20">
        <div
          className="h-full transition-[width] duration-300"
          style={{ width: `${frac * 100}%`, background: colour }}
        />
      </div>
    </div>
  );
}

function scoreColour(s: number): string {
  if (s <= 1) return "text-red-300";
  if (s === 2) return "text-orange-300";
  if (s === 3) return "text-yellow-300";
  if (s === 4) return "text-emerald-300";
  return "text-purple-300";
}

// ─────────────────────────────────────────────────────────────────────
// XP summary
// ─────────────────────────────────────────────────────────────────────

function XpSummary({ points }: { points: number }) {
  return (
    <div className="flex items-center justify-between border-2 border-white/20 bg-black px-4 py-3">
      <span className="font-mono text-xs uppercase tracking-widest text-white/60">
        Individual XP
      </span>
      <span
        className={`text-lg font-bold tabular-nums ${
          points >= 0 ? "text-emerald-300" : "text-red-300"
        }`}
      >
        {points >= 0 ? "+" : ""}
        {points}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Action rows
// ─────────────────────────────────────────────────────────────────────

function WinActions({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        onClick={onAdvance}
        className="border-2 border-emerald-400 bg-emerald-500/20 px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wider text-emerald-200 transition hover:bg-emerald-500/40"
        style={{ fontFamily: "var(--font-pixel-display), monospace" }}
      >
        Advance ▶
      </button>
    </div>
  );
}

function LossActions({ onRetryCombat }: { onRetryCombat: () => void }) {
  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => {
          console.log("[combat] Retry button clicked");
          onRetryCombat();
        }}
        className="border-2 border-red-400 bg-red-500/20 px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wider text-red-200 transition hover:bg-red-500/40"
        style={{ fontFamily: "var(--font-pixel-display), monospace" }}
      >
        Retry combat
      </button>
      <span className="font-mono text-[10px] text-white/40">
        Fresh questions every attempt
      </span>
    </div>
  );
}
