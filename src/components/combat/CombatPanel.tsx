"use client";

/**
 * Top-level combat overlay. Mounts above the checkpoint view when the
 * user clicks Advance with 2 of 3 standard tasks submitted. Owns no
 * business state — orchestrates `useCombatRound` and renders the
 * sub-view for the current phase.
 *
 * Visual frame: Undertale-inspired terminal panel with pixel-art
 * corner brackets, hard borders, and a black ground colour.
 */

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Id } from "@convex/_generated/dataModel";
import { useCombatRound, type CombatPhase } from "@/lib/hooks/useCombatRound";
import { CombatQuestionCard } from "./CombatQuestionCard";
import { CombatResultPanel } from "./CombatResultPanel";
import { AntiCheatWarning } from "./AntiCheatWarning";
import type { KeystrokeTelemetry } from "@/lib/combat/types";

interface Props {
  roundId: Id<"combatRounds">;
  checkpointId: Id<"ventureCheckpoints">;
  /** Called when the user closes the panel after a win. */
  onAdvanceCheckpoint: () => void;
  /** Called when the user closes the panel any other way. */
  onClose: () => void;
  /** Called when the user clicks Retry Combat on the defeat screen.
   * Parent should swap the active roundId to remount the panel. */
  onRetryStarted?: (newRoundId: Id<"combatRounds">) => void;
}

export function CombatPanel({
  roundId,
  checkpointId,
  onAdvanceCheckpoint,
  onClose,
  onRetryStarted,
}: Props) {
  const { phase, submitAnswer, retryCombat, abandon } = useCombatRound(
    roundId,
    checkpointId,
  );

  const [submitting, setSubmitting] = useState(false);
  const [showAntiCheatWarning, setShowAntiCheatWarning] = useState(false);

  const doSubmit = useCallback(
    async (
      answer: string,
      telemetry: KeystrokeTelemetry,
      wasExpiry: boolean,
    ) => {
      if (submitting) return;
      setSubmitting(true);
      try {
        await submitAnswer(answer, telemetry, wasExpiry);
      } finally {
        setSubmitting(false);
      }
    },
    [submitAnswer, submitting],
  );

  const handleClose = useCallback(async () => {
    if (phase.kind === "active") {
      await abandon();
    }
    onClose();
  }, [phase.kind, abandon, onClose]);

  const handleAdvance = useCallback(() => {
    onAdvanceCheckpoint();
  }, [onAdvanceCheckpoint]);

  const handleRetry = useCallback(async () => {
    try {
      const result = await retryCombat();
      const newRoundId = result?.roundId;
      if (newRoundId && onRetryStarted) {
        // Direct callback — parent swaps the active roundId, which
        // remounts this panel on the new round (parent should pass
        // key={roundId} for guaranteed clean remount).
        onRetryStarted(newRoundId);
      } else if (newRoundId && typeof window !== "undefined") {
        // Legacy fallback: dispatch window event if no callback prop.
        window.dispatchEvent(
          new CustomEvent("combat:retry-started", { detail: { newRoundId } }),
        );
      }
    } catch (err) {
      console.error("[combat] retryCombat failed:", err);
    }
  }, [retryCombat, onRetryStarted]);

  // Encounter intro plays once per mount. After 1.8s the combat UI fades in.
  const [introPlayed, setIntroPlayed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIntroPlayed(true), 1700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI cross-question combat"
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden"
    >
      {/* Semi-transparent dimming overlay so the world-map scene
          remains visible behind the combat dialogue, matching
          Undertale's overlay-on-scene pattern. */}
      <div className="pointer-events-none absolute inset-0 bg-black/65 backdrop-blur-[1px]" />

      {/* Subtle CRT scanlines for retro flavour over the dimmed world */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.05) 3px, transparent 4px)",
        }}
      />

      {/* Encounter intro — Undertale's classic "* A foe approaches." line.
          Plain white text on black, no glow, no gradient. */}
      <AnimatePresence>
        {!introPlayed && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-0 z-[90] flex items-center justify-center"
          >
            <div className="border-2 border-white bg-black px-10 py-6 text-center">
              <p
                className="font-mono text-base uppercase tracking-[0.3em] text-white"
                style={{ fontFamily: "var(--font-pixel-display), monospace" }}
              >
                * The Skeptic blocks your path.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative mx-auto w-full max-w-2xl px-4 sm:max-w-3xl lg:max-w-5xl"
        initial={{ opacity: 0 }}
        animate={introPlayed ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <CornerBrackets />

        <div className="relative max-h-[88vh] overflow-y-auto border-2 border-white bg-black p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close combat panel"
            className="absolute right-3 top-3 font-mono text-lg leading-none text-white/40 transition hover:text-white"
          >
            ×
          </button>

          <PhaseSwitch
            phase={phase}
            submitting={submitting}
            onSubmit={(a, t) => doSubmit(a, t, false)}
            onExpire={(a, t) => doSubmit(a, t, true)}
            onAdvance={handleAdvance}
            onRetry={handleRetry}
          />
        </div>
      </motion.div>

      <AntiCheatWarning
        open={showAntiCheatWarning}
        onAcknowledge={() => setShowAntiCheatWarning(false)}
      />
    </div>
  );
}

/**
 * Pixel-art encounter zone — approximates an Undertale-style "room"
 * using CSS-drawn brick walls + stone tile floor in perspective.
 * No image assets; everything is procedural.
 */
function AtmosphericBackground() {
  return (
    <>
      {/* Base black void */}
      <div className="pointer-events-none absolute inset-0 bg-black" />

      {/* Faint CRT scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.05) 3px, transparent 4px)",
        }}
      />

      {/* Brick-wall pattern across the upper third — suggests a stone
          chamber wall behind the combatants. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1/3"
        style={{
          backgroundImage: `
            linear-gradient(180deg, transparent 0%, transparent 90%, rgba(255,255,255,0.12) 90%, rgba(255,255,255,0.12) 100%),
            linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 48px),
            linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 24px)
          `,
          backgroundSize: "auto, 48px 24px, 48px 24px",
          opacity: 0.6,
          maskImage:
            "linear-gradient(180deg, black 30%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, black 30%, transparent 100%)",
        }}
      />

      {/* Stone tile floor with perspective — diagonal lines suggesting
          a tiled floor receding into the distance. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 64px),
            linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 32px)
          `,
          backgroundSize: "64px 32px",
          transform: "perspective(400px) rotateX(60deg)",
          transformOrigin: "center bottom",
          opacity: 0.7,
          maskImage:
            "linear-gradient(0deg, black 0%, transparent 80%)",
          WebkitMaskImage:
            "linear-gradient(0deg, black 0%, transparent 80%)",
        }}
      />

      {/* A few flickering torch-light points along the walls */}
      {[
        { left: "12%", top: "8%", delay: 0 },
        { left: "88%", top: "10%", delay: 0.7 },
        { left: "50%", top: "5%", delay: 1.2 },
      ].map((torch, i) => (
        <motion.div
          key={`torch-${i}`}
          className="pointer-events-none absolute h-3 w-3"
          style={{
            left: torch.left,
            top: torch.top,
            imageRendering: "pixelated",
          }}
          animate={{
            opacity: [0.5, 1, 0.7, 1, 0.5],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: torch.delay,
          }}
        >
          <div
            className="h-full w-full"
            style={{
              background: "#FFE066",
              boxShadow:
                "0 0 12px 4px rgba(255,224,102,0.55), 0 0 24px 8px rgba(255,140,0,0.25)",
            }}
          />
        </motion.div>
      ))}

      {/* Subtle ambient star pinpoints far back */}
      {[
        { left: "22%", top: "22%", delay: 0 },
        { left: "76%", top: "18%", delay: 0.9 },
        { left: "40%", top: "14%", delay: 1.8 },
      ].map((s, i) => (
        <motion.div
          key={`star-${i}`}
          className="pointer-events-none absolute h-[2px] w-[2px] bg-white"
          style={{ left: s.left, top: s.top, imageRendering: "pixelated" }}
          animate={{ opacity: [0.15, 0.8, 0.15] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: s.delay,
          }}
        />
      ))}
    </>
  );
}

/**
 * Player SOUL heart — iconic red Undertale soul. Renders as scalable
 * SVG with pixel-perfect heart shape. Optionally pulses on idle.
 */
export function PlayerSoul({ size = 18 }: { size?: number }) {
  return (
    <motion.svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      style={{ imageRendering: "pixelated" }}
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      aria-label="Player soul"
    >
      {/* Heart outline (deeper red) */}
      <path
        d="M2 5h2v1h1v1h1V6h2v1h1V6h1V5h2v3h-1v1h-1v1h-1v1h-1v1h-1v-1H6v-1H5v-1H4V9H3V8H2V5z"
        fill="#7a0d0d"
      />
      {/* Heart fill (bright red) */}
      <path
        d="M3 5h1v1h1v1h1V6h2v1h1V6h1V5h1v3h-1v1h-1v1h-1v1h-1v-1H6v-1H5v-1H4V8H3V5z"
        fill="#FF0033"
      />
      {/* Highlight */}
      <rect x="4" y="6" width="1" height="1" fill="#FFB3B3" />
    </motion.svg>
  );
}

interface PhaseSwitchProps {
  phase: CombatPhase;
  submitting: boolean;
  onSubmit: (answer: string, telemetry: KeystrokeTelemetry) => void;
  onExpire: (answer: string, telemetry: KeystrokeTelemetry) => void;
  onAdvance: () => void;
  onRetry: () => void;
}

function PhaseSwitch({
  phase,
  submitting,
  onSubmit,
  onExpire,
  onAdvance,
  onRetry,
}: PhaseSwitchProps) {
  switch (phase.kind) {
    case "loading":
      return <LoadingState />;
    case "cap_exhausted":
      return <CapExhaustedState />;
    case "active":
      // Even when waiting for the next question to be generated, render
      // the battle scene + HP cards + sidebar so the reaction animations
      // play on the HP delta and the user sees their answer's impact.
      // The dialogue panel falls back to a "next question incoming" prompt.
      return (
        <CombatQuestionCard
          question={phase.view.currentQuestion ?? {
            _id: "transition" as never,
            order: phase.view.currentQuestionIndex + 1,
            prompt: "* Your answer struck home. Bracing for the next question…",
            persona: "villain",
            complexityTier: "medium",
            durationMs: 90_000,
            servedAt: Date.now(),
          }}
          bossHpCurrent={phase.view.bossHpCurrent}
          bossHpInitial={phase.view.bossHpInitial}
          playerHpCurrent={phase.view.playerHpCurrent}
          playerHpInitial={phase.view.playerHpInitial}
          questionsAnsweredCount={phase.view.currentQuestionIndex}
          totalQuestions={phase.view.totalQuestions}
          onSubmit={onSubmit}
          onExpire={onExpire}
          isLocked={submitting || !phase.view.currentQuestion}
        />
      );
    case "settled":
      return (
        <CombatResultPanel
          result={phase.result}
          bossHpInitial={phase.view.bossHpInitial}
          playerHpInitial={phase.view.playerHpInitial}
          onAdvance={onAdvance}
          onRetryCombat={onRetry}
        />
      );
  }
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <p
        className="font-mono text-[10px] uppercase tracking-widest text-white/50"
        style={{ fontFamily: "var(--font-pixel-display), monospace" }}
      >
        Preparing combat…
      </p>
    </div>
  );
}

function CapExhaustedState() {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <h2
        className="text-lg font-semibold text-white"
        style={{ fontFamily: "var(--font-pixel-display), monospace" }}
      >
        Monthly combat limit reached
      </h2>
      <p className="max-w-md text-sm text-white/60">
        Your standard-task answers have been scored normally. Your combat
        rounds reset at the start of next month.
      </p>
    </div>
  );
}

function CornerBrackets() {
  // Pixel-art corner brackets reinforcing the terminal feel.
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-white/60"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-white/60"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-white/60"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-white/60"
      />
    </>
  );
}
