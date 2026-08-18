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

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useCombatRound, type CombatPhase } from "@/lib/hooks/useCombatRound";
import {
  CombatQuestionCard,
  deriveBiomeMap,
  focusForCheckpoint,
} from "./CombatQuestionCard";
import { CombatResultPanel } from "./CombatResultPanel";
import { AntiCheatWarning } from "./AntiCheatWarning";
import type { KeystrokeTelemetry } from "@/lib/combat/types";
import {
  FAMILY_PALETTE,
  type VillageBossFamily,
  type VillageBossInfo,
} from "@/config/village-bosses";
import { getPersona, isValidPersonaId } from "@/config/personas";
import { useKeyboardInsets } from "@/lib/hooks/useKeyboardInsets";

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
  /** Boss metadata for the current checkpoint — drives the intro line,
   *  projectile tint, and boss sprite in the combat frame. When absent,
   *  falls back to generic "* A foe blocks your path." + red projectile. */
  boss?: VillageBossInfo | null;
  /** The user's actual venture / idea title (e.g. "Retlify AI").  Rendered
   *  in the combat header instead of the demo's hardcoded slug. */
  ideaTitle?: string | null;
  /** 1-based checkpoint number the boss is guarding (1..N). Used to
   *  focus the OUTER combat scrim on the specific area of the map
   *  where the encounter is happening — "take map area near
   *  checkpoint as ai combat background". Village keeps its bespoke
   *  painted backdrop; every other biome falls back to a CP-zoomed
   *  crop of the painted world map. Optional so legacy callers still
   *  work (a null / undefined value → whole-map centered scrim). */
  checkpointIndex?: number | null;
}

export function CombatPanel({
  roundId,
  checkpointId,
  onAdvanceCheckpoint,
  onClose,
  onRetryStarted,
  boss = null,
  ideaTitle = null,
  checkpointIndex = null,
}: Props) {
  const { phase, submitAnswer, retryCombat, abandon } = useCombatRound(
    roundId,
    checkpointId,
  );
  // Keyboard-aware sizing — the Attack button + textarea sit at the
  // bottom of the panel. Without this the on-screen keyboard covers
  // both on iOS Safari + Android Chrome. Applied via inline style to
  // the scroll container below so max-h shrinks to the visible
  // visualViewport when the keyboard opens.
  const kb = useKeyboardInsets();

  // Persona portrait — the founder sprite shown facing the boss.
  // Uses the user's picked persona (all 8 personas now have real
  // Pixellab portraits + full extended animation sets).
  const personaIdRaw = useQuery(api.users.getMyPersonaId, {});
  const personaId = isValidPersonaId(personaIdRaw) ? personaIdRaw : "alchemist";
  const persona = getPersona(personaId);
  const founderAssetPath = persona.assets.portrait;

  const [submitting, setSubmitting] = useState(false);
  const [showAntiCheatWarning, setShowAntiCheatWarning] = useState(false);

  // ── Cinematic ending buffer ────────────────────────────────────────
  // The server flips `phase.kind` from "active" → "settled" the instant
  // the last damage lands. Without a buffer, the CombatQuestionCard
  // (with its BattleScene endgame beat: loser DEFEAT then winner
  // VICTORY loop) unmounts immediately and the user is dropped straight
  // into the static result panel. We want a proper cinematic sequence:
  //   0.0-1.6s  (win only) RETREAT banner reads "<Boss> is retreating!"
  //             over a still arena — Sparky-narrated ending beat
  //   1.6-3.8s  loser plays DEFEAT (slow crumble); winner holds idle
  //   3.8-6.5s  loser fades, winner slides to center + slow VICTORY loop
  //   6.5s+     result score card
  //
  // On LOSS we skip the retreat beat so the sequence is ~4.5s. The
  // hold is a single value that covers both — the extra second of
  // buffer on loss just means the winner (boss) VICTORY loop runs a
  // little longer, which reads fine.
  //
  // We accomplish this by holding the outer phase as "active" for
  // CINEMATIC_HOLD_MS after we first see `settled`, while pinning the
  // last known active-phase view so BattleScene has HP=0 to react to.
  // Bumped again 2026-08-16 (again): 9500 → 10200 to cover the split
  // finisher beat. Product refined the ask: "first damage is playing
  // then attack, first attack should be played" — so the finisher was
  // divided into two sub-beats so the swing runs BEFORE the recoil.
  // Full WIN sequence:
  //   finisher-swing   900ms  (persona sword arc, boss still upright)
  //   finisher-impact 1800ms  (boss HURT recoil, persona follow-through)
  //   retreat         2200ms  (villain slides off, fades, shrinks)
  //   defeat          2200ms  (holds off-screen)
  //   cheer          ~3100ms  buffer (persona VICTORY loop centered)
  // Total ~10200ms.
  const CINEMATIC_HOLD_MS = 10200;
  // Reset the cinematic ref whenever the roundId changes, so a retry
  // round's ending gets its own fresh cinematic buffer.
  useEffect(() => {
    cinematicUntilRef.current = null;
    lastActiveViewRef.current = null;
  }, [roundId]);
  // ── SYNCHRONOUS cinematic arming ────────────────────────────────────
  // We MUST arm the cinematic timer during the same render that first
  // sees `phase.kind === "settled"`, otherwise `CombatResultPanel`
  // renders once before our useEffect fires and the user sees the
  // score card flash BEFORE the cinematic (that's the bug).
  //
  // Both the "when did we first see settled" timestamp AND the "last
  // known active view snapshot" live in refs updated synchronously
  // during render — no useEffect race.
  const cinematicUntilRef = useRef<number | null>(null);
  const lastActiveViewRef = useRef<
    | {
        currentQuestion: null;
        currentQuestionIndex: number;
        totalQuestions: number;
        bossHpInitial: number;
        playerHpInitial: number;
        bossHpCurrent: number;
        playerHpCurrent: number;
      }
    | null
  >(null);
  // Snapshot the active view every render it's active (cheap; refs
  // don't trigger re-renders on mutation). This means the moment the
  // outer phase flips to settled, the ref holds the last live HP.
  if (phase.kind === "active") {
    lastActiveViewRef.current = {
      currentQuestion: null,
      currentQuestionIndex: phase.view.currentQuestionIndex,
      totalQuestions: phase.view.totalQuestions,
      bossHpInitial: phase.view.bossHpInitial,
      playerHpInitial: phase.view.playerHpInitial,
      bossHpCurrent: phase.view.bossHpCurrent,
      playerHpCurrent: phase.view.playerHpCurrent,
    };
  }
  // Arm the buffer on the FIRST render we see settled. Ref write is
  // idempotent — we only set it if it hasn't been set yet.
  if (phase.kind === "settled" && cinematicUntilRef.current === null) {
    cinematicUntilRef.current = Date.now() + CINEMATIC_HOLD_MS;
  }
  const cinematicUntil = cinematicUntilRef.current;
  const inCinematic =
    cinematicUntil !== null && Date.now() < cinematicUntil;
  // Force a single re-render at the moment the cinematic buffer
  // expires, so displayPhase re-evaluates and the score card can
  // appear.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (cinematicUntil === null) return;
    const remaining = cinematicUntil - Date.now();
    if (remaining <= 0) return;
    const id = window.setTimeout(() => forceTick((n) => n + 1), remaining + 30);
    return () => window.clearTimeout(id);
  }, [cinematicUntil]);
  // Compose the phase we actually render: while in the cinematic
  // window, synthesize an "active" phase using the last known active
  // view so BattleScene stays mounted and its outcome flips to
  // won/lost (which drives the defeat → cheer cinematic).
  const displayPhase: typeof phase =
    phase.kind === "settled" && inCinematic && lastActiveViewRef.current !== null
      ? ({
          kind: "active",
          view: {
            ...lastActiveViewRef.current,
            // Force loser's HP to 0 so BattleScene's `outcome`
            // resolves reliably even if the ref captured a tick
            // before the final damage landed.
            bossHpCurrent:
              phase.result.status === "won"
                ? 0
                : lastActiveViewRef.current.bossHpCurrent,
            playerHpCurrent:
              phase.result.status === "lost"
                ? 0
                : lastActiveViewRef.current.playerHpCurrent,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      : phase;

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
        onRetryStarted(newRoundId);
      } else if (newRoundId && typeof window !== "undefined") {
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

  // Boss projectile intro — during the encounter intro, the boss lobs a
  // corrupted energy orb at the player. Purely for cinematic weight.
  const [projectileState, setProjectileState] = useState<
    "hidden" | "flying" | "impact"
  >("hidden");
  useEffect(() => {
    const flyT = window.setTimeout(() => setProjectileState("flying"), 400);
    const hitT = window.setTimeout(() => setProjectileState("impact"), 1150);
    const clearT = window.setTimeout(() => setProjectileState("hidden"), 1650);
    return () => {
      window.clearTimeout(flyT);
      window.clearTimeout(hitT);
      window.clearTimeout(clearT);
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI cross-question combat"
      data-tutorial="combat-panel"
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden"
    >
      {/* ── Biome-themed background ────────────────────────────────
          Village: uses its dedicated painted combat backdrop (art
          already attached), rendered `cover` so nothing is cropped.
          Every other biome: shows the biome's painted world map
          ZOOMED IN on the specific checkpoint the boss guards — per
          product ask "take map area near checkpoint as ai combat
          background for all map except village". `focusForCheckpoint`
          returns background-size 180% + a CP-percentage position so
          the scrim reads as "this exact spot on the map" instead of a
          generic biome shot. When a CP index isn't available (legacy
          call sites) the helper falls back to a centered cover crop.
          40% brightness + 85% saturation keeps the terrain readable
          without overpowering the combat UI on top. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={(() => {
          const bossAsset = boss?.idleAsset ?? null;
          const isVillage = !!bossAsset?.includes("/bosses/village/");
          if (isVillage) {
            return {
              backgroundImage: `url(${deriveBiomeMap(bossAsset)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: "brightness(0.4) saturate(0.85)",
            };
          }
          const focus = focusForCheckpoint(
            bossAsset,
            // focusForCheckpoint uses 0-based indexing internally
            // (CP1 → index 0) — match that convention.
            typeof checkpointIndex === "number"
              ? checkpointIndex - 1
              : null,
          );
          return {
            backgroundImage: `url(${deriveBiomeMap(bossAsset)})`,
            backgroundSize: focus.size,
            backgroundPosition: `${focus.positionX} ${focus.positionY}`,
            backgroundRepeat: "no-repeat",
            filter: "brightness(0.4) saturate(0.85)",
          };
        })()}
      />
      {/* Dark base overlay so the terrain doesn't overpower the combat UI */}
      <div className="pointer-events-none absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      {/* Family-tinted corruption vignette — mist/undead/machine/etc. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: boss?.family
            ? `radial-gradient(circle at 50% 50%, transparent 40%, ${FAMILY_PALETTE[boss.family].auraColor}44 100%)`
            : "radial-gradient(circle at 50% 50%, transparent 40%, rgba(120,0,0,0.35) 100%)",
        }}
      />

      {/* Outer floating boss sprite removed — the BattleScene inside
          CombatQuestionCard now renders the boss prominently in the arena,
          so a second floating copy on the right edge would double up. */}

      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.05) 3px, transparent 4px)",
        }}
      />

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
                {boss?.introLine ?? `* ${boss?.name ?? "A foe"} blocks your path.`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BossProjectileIntro state={projectileState} family={boss?.family ?? null} />

      <AnimatePresence>
        {projectileState === "impact" && (
          <motion.div
            key="impact-flash"
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 z-[92]"
            style={{
              background:
                "radial-gradient(circle at 30% 65%, rgba(255,50,50,0.85) 0%, rgba(180,0,60,0.5) 25%, rgba(0,0,0,0) 55%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Panel width narrowed from lg:max-w-5xl → lg:max-w-3xl so
          Sparky's bottom-right speech bubble (rendered outside this
          modal, portalled by the tutorial layer) no longer overlaps
          the Advance button + score column. The 3xl cap (48rem) still
          fits every arena/dialogue/answer element comfortably on
          desktop while leaving a clear gutter for the mascot bubble. */}
      <motion.div
        className="relative mx-auto w-full max-w-2xl px-4 sm:max-w-3xl"
        initial={{ opacity: 0 }}
        animate={
          projectileState === "impact"
            ? {
                opacity: introPlayed ? 1 : 0,
                x: [0, -14, 12, -8, 6, -3, 0],
                y: [0, 4, -6, 3, -2, 1, 0],
              }
            : { opacity: introPlayed ? 1 : 0, x: 0, y: 0 }
        }
        transition={{
          duration: projectileState === "impact" ? 0.45 : 0.25,
          ease: projectileState === "impact" ? "easeOut" : "easeInOut",
        }}
      >
        {/* Corner brackets removed per product request. */}

        {/*
          Outer chrome is dropped for the SETTLED phase so the new
          ornate victory panel (border + banner + XP badge) can own
          the visual language of the result screen. During active
          combat / cinematic we keep the black + white pixel frame —
          same look users have been fighting inside since the arena
          loaded.
        */}
        <div
          className={
            displayPhase.kind === "settled"
              ? "relative max-h-[92dvh] overflow-y-auto overscroll-contain no-scrollbar"
              : "relative max-h-[92dvh] overflow-y-auto overscroll-contain no-scrollbar border-2 border-white bg-black p-3 shadow-[0_20px_60px_rgba(0,0,0,0.7)] sm:p-6"
          }
          style={
            kb.isKeyboardOpen && kb.viewportHeight > 0
              ? { maxHeight: `${Math.floor(kb.viewportHeight * 0.92)}px` }
              : undefined
          }
          onWheelCapture={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close combat panel"
            className={
              displayPhase.kind === "settled"
                ? "absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-md border border-yellow-500/40 bg-black/60 font-mono text-2xl leading-none text-yellow-200/80 transition hover:border-yellow-400 hover:bg-black/80 hover:text-yellow-100"
                : "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded font-mono text-3xl leading-none text-white/70 transition hover:bg-white/10 hover:text-white"
            }
          >
            ×
          </button>

          <PhaseSwitch
            phase={displayPhase}
            submitting={submitting}
            onSubmit={(a, t) => doSubmit(a, t, false)}
            onExpire={(a, t) => doSubmit(a, t, true)}
            onAdvance={handleAdvance}
            onRetry={handleRetry}
            boss={boss}
            ideaTitle={ideaTitle}
            // Persona portrait — 96x96 hero art rendered as a static
            // combat portrait. Same persona the user picked in onboarding
            // and rides through the venture map.
            founderAsset={founderAssetPath}
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
      <path
        d="M2 5h2v1h1v1h1V6h2v1h1V6h1V5h2v3h-1v1h-1v1h-1v1h-1v1h-1v-1H6v-1H5v-1H4V9H3V8H2V5z"
        fill="#7a0d0d"
      />
      <path
        d="M3 5h1v1h1v1h1V6h2v1h1V6h1V5h1v3h-1v1h-1v1h-1v1h-1v-1H6v-1H5v-1H4V8H3V5z"
        fill="#FF0033"
      />
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
  /** Village boss metadata forwarded to CombatQuestionCard. */
  boss?: VillageBossInfo | null;
  /** Founder persona asset path forwarded to CombatQuestionCard. */
  founderAsset?: string | null;
  /** User's actual idea/venture title forwarded to CombatQuestionCard. */
  ideaTitle?: string | null;
}

function PhaseSwitch({
  phase,
  submitting,
  onSubmit,
  onExpire,
  onAdvance,
  onRetry,
  boss = null,
  founderAsset = null,
  ideaTitle = null,
}: PhaseSwitchProps) {
  // Track the previous playerHp so we can pick the correct transition
  // line between questions. Product spec (verbatim): use one of
  //   "Your attack was effective."
  //   "Your attack was ineffective. You've been hurt!"
  // depending on whether the last answer landed. The old fallback of
  // "Your answer struck home" was off-brand and always positive even
  // when the player got smacked — a bug per the screenshot review.
  const prevPlayerHpRef = useRef<number | null>(null);
  const prevBossHpRef = useRef<number | null>(null);
  if (phase.kind === "active" && phase.view.currentQuestion) {
    // Steady state — remember these HPs so the next transition window
    // can compare against them.
    prevPlayerHpRef.current = phase.view.playerHpCurrent;
    prevBossHpRef.current = phase.view.bossHpCurrent;
  }
  const transitionPrompt = (() => {
    if (phase.kind !== "active") return "";
    if (phase.view.currentQuestionIndex === 0) {
      return `* ${boss?.name ?? "The foe"} is preparing its first challenge…`;
    }
    const prevPlayer = prevPlayerHpRef.current;
    if (prevPlayer !== null && phase.view.playerHpCurrent < prevPlayer) {
      return "* Your attack was ineffective. You've been hurt!";
    }
    return "* Your attack was effective.";
  })();
  switch (phase.kind) {
    case "loading":
      return <LoadingState />;
    case "cap_exhausted":
      return <CapExhaustedState />;
    case "active":
      return (
        <CombatQuestionCard
          question={phase.view.currentQuestion ?? {
            _id: "transition" as never,
            order: phase.view.currentQuestionIndex + 1,
            prompt: transitionPrompt,
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
          boss={boss}
          founderAsset={founderAsset}
          ideaTitle={ideaTitle}
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
          // Real sprites for the Q1/Q2 replay cards — same idle-frame
          // assets the arena rendered. Replaces the procedural pixel
          // avatars per product request ("boss and persona should be
          // real").
          bossAsset={boss?.idleAsset ?? null}
          founderAsset={founderAsset}
          // Boss display name for the "{BossName} RETREATED" ribbon
          // on the victory card. Falls back inside CombatResultPanel
          // to "BOSS" if null.
          bossName={boss?.name ?? null}
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

/**
 * Corrupted energy orb the boss lobs at the player during the encounter
 * intro. Renders as an SVG projectile with a trailing tail; on impact it
 * bursts into 10 crackling shards.
 */
function BossProjectileIntro({
  state,
  family,
}: {
  state: "hidden" | "flying" | "impact";
  family: VillageBossFamily | null;
}) {
  const ORIGIN = { x: "82%", y: "32%" };
  const TARGET = { x: "28%", y: "68%" };
  // Pull palette from the shared config so the projectile matches the
  // boss's family (mist=blue, undead=purple, machine=orange, etc.).
  // Falls back to red for unknown/missing family.
  const palette = family
    ? FAMILY_PALETTE[family]
    : { particleColor: "#dc2626", coreColor: "#fca5a5", auraColor: "#9333ea" };

  return (
    <AnimatePresence>
      {state === "flying" && (
        <motion.div
          key="orb"
          initial={{
            left: ORIGIN.x,
            top: ORIGIN.y,
            opacity: 0,
            scale: 0.4,
          }}
          animate={{
            left: [ORIGIN.x, "55%", TARGET.x],
            top: [ORIGIN.y, "38%", TARGET.y],
            opacity: [0, 1, 1],
            scale: [0.4, 1, 1.15],
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            duration: 0.75,
            ease: [0.4, 0, 0.6, 1],
            times: [0, 0.55, 1],
          }}
          className="pointer-events-none absolute z-[95] -translate-x-1/2 -translate-y-1/2"
          style={{ imageRendering: "pixelated" }}
        >
          <svg
            viewBox="0 0 32 32"
            width={44}
            height={44}
            style={{
              filter: `drop-shadow(0 0 8px ${palette.particleColor}) drop-shadow(0 0 20px ${palette.auraColor})`,
            }}
          >
            {/* Family-tinted outer aura */}
            <circle cx="16" cy="16" r="13" fill={palette.auraColor} fillOpacity="0.35" />
            {/* Family-tinted mid glow */}
            <circle cx="16" cy="16" r="10" fill={palette.particleColor} fillOpacity="0.65" />
            {/* Family-tinted core */}
            <circle cx="16" cy="16" r="6.5" fill={palette.coreColor} />
            {/* Bright hot spot */}
            <circle cx="14" cy="14" r="2.5" fill="#fef2f2" />
            {/* Crackling edges use the outer particle color */}
            <rect x="15" y="1" width="2" height="4" fill={palette.particleColor} />
            <rect x="15" y="27" width="2" height="4" fill={palette.particleColor} />
            <rect x="1" y="15" width="4" height="2" fill={palette.particleColor} />
            <rect x="27" y="15" width="4" height="2" fill={palette.particleColor} />
          </svg>

          <motion.div
            className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0, 0.6, 0.4], scale: [1, 1.4, 1.8] }}
            transition={{
              duration: 0.75,
              times: [0, 0.5, 1],
              ease: "linear",
            }}
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(220,38,38,0.55) 0%, rgba(147,51,234,0.25) 50%, rgba(0,0,0,0) 75%)",
            }}
          />
        </motion.div>
      )}

      {state === "impact" && <ProjectileImpactBurst target={TARGET} />}
    </AnimatePresence>
  );
}

function ProjectileImpactBurst({
  target,
}: {
  target: { x: string; y: string };
}) {
  const shards = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2;
    return {
      id: i,
      dx: Math.cos(angle) * 90,
      dy: Math.sin(angle) * 90,
      rot: (angle * 180) / Math.PI,
      tint: i % 3 === 0 ? "#fef2f2" : i % 3 === 1 ? "#fca5a5" : "#dc2626",
    };
  });

  return (
    <motion.div
      key="impact-burst"
      className="pointer-events-none absolute z-[95] -translate-x-1/2 -translate-y-1/2"
      style={{ left: target.x, top: target.y }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        initial={{ width: 4, height: 4, opacity: 1 }}
        animate={{ width: 90, height: 90, opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-500"
        initial={{ width: 8, height: 8, opacity: 0.9 }}
        animate={{ width: 140, height: 140, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {shards.map((s) => (
        <motion.div
          key={s.id}
          className="absolute left-1/2 top-1/2"
          initial={{ x: 0, y: 0, opacity: 1, rotate: s.rot }}
          animate={{
            x: s.dx,
            y: s.dy,
              opacity: 0,
            rotate: s.rot + 90,
          }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{
            width: 6,
            height: 3,
            background: s.tint,
            boxShadow: `0 0 6px ${s.tint}`,
            imageRendering: "pixelated",
          }}
        />
      ))}
    </motion.div>
  );
}
