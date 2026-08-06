"use client";

/**
 * Win / loss screen at the end of a combat round — ornate pixel-art
 * VICTORY panel per product mock. Owns its own chrome (golden border,
 * corner ornaments, winged banner, XP badge) — the parent CombatPanel
 * strips its default black/white pixel frame while `displayPhase.kind`
 * is "settled" so this component can dominate the layout.
 *
 *   WIN  → gold VICTORY banner, "BOSS RETREATED" ribbon, HP timeline
 *          Q-cards with pixel avatars, animated XP badge burst,
 *          STATS + ADVANCE actions.
 *
 *   LOSS → red DEFEAT variant, "YOU WERE WORN DOWN" ribbon, timeline
 *          replay + STATS + RETRY COMBAT actions.
 *
 * The HP timeline replays the round's exchanges as small chips so
 * the user can see how the fight progressed — useful for learning
 * which questions they did well or poorly on.
 */

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CombatRoundResult } from "@/lib/combat/types";
import { useTutorial } from "@/components/tutorial/v2/useTutorial";

interface Props {
  result: CombatRoundResult;
  bossHpInitial: number;
  playerHpInitial: number;
  onAdvance: () => void;
  onRetryCombat: () => void;
  /**
   * Boss idle-sprite asset path (e.g. `/assets/bosses/village/fog/idle.png`).
   * Rendered in the Q1/Q2 replay-card BOSS row. Falls back to the
   * procedural pixel imp when unavailable. Same asset used by the
   * combat arena so the icons match what the user just fought.
   */
  bossAsset?: string | null;
  /**
   * Founder / persona idle-sprite asset path (e.g.
   * `/assets/personas/alchemist/portrait.png`). Rendered in the Q1/Q2
   * replay-card YOU row. Falls back to the procedural pixel knight.
   */
  founderAsset?: string | null;
  /**
   * Current boss's display name — e.g. "Fog of Vagueness". Rendered
   * in the outcome ribbon ("FOG OF VAGUENESS RETREATED") in place of
   * the generic "BOSS" word. Falls back to "BOSS" when omitted.
   */
  bossName?: string | null;
}

export function CombatResultPanel({
  result,
  bossHpInitial,
  playerHpInitial,
  onAdvance,
  onRetryCombat,
  bossAsset = null,
  founderAsset = null,
  bossName = null,
}: Props) {
  const isWin = result.outcome === "won";
  // STATS toggle — reveals per-question raw scores under each replay
  // card. Collapsed by default so the panel stays compact; expanded
  // when the user wants to inspect their round in depth. Also removes
  // the ambiguity of what a hypothetical "Stats" click would do.
  const [showStats, setShowStats] = useState(false);

  // Tutorial focus mode — when the guided tutorial is on the combat
  // step (7 = intro/retreat text, 8 = active fight, 9 = flare
  // transition), the ONLY action that should register is CONTINUE.
  // STATS is dimmed + disabled, replay-card chevrons deactivate, and
  // CONTINUE gets a pulsing highlight so users can't miss it and
  // can't wander off the guided path.
  const tutorial = useTutorial();
  const tutorialMode =
    tutorial.active && tutorial.step >= 7 && tutorial.step <= 9;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2 shadow-[0_0_60px_rgba(0,0,0,0.7)]"
      style={{
        // Layered navy background — subtle gradient + parchment star
        // field on top. Slightly warmer on top, deeper toward the
        // bottom, mimicking the reference mock.
        background:
          "radial-gradient(ellipse at center top, #14224a 0%, #0b1030 55%, #05081a 100%)",
        borderColor: isWin ? "rgba(250,204,21,0.55)" : "rgba(239,68,68,0.55)",
        boxShadow: isWin
          ? "0 0 60px rgba(250,204,21,0.2), inset 0 0 40px rgba(250,204,21,0.06)"
          : "0 0 60px rgba(239,68,68,0.2), inset 0 0 40px rgba(239,68,68,0.06)",
      }}
    >
      {/* Golden corner ornaments — small bracket-style flourishes in
          each corner, matching the pixel-art fantasy frame in the mock. */}
      <CornerOrnament corner="tl" isWin={isWin} />
      <CornerOrnament corner="tr" isWin={isWin} />
      <CornerOrnament corner="bl" isWin={isWin} />
      <CornerOrnament corner="br" isWin={isWin} />

      {/* Twinkling star field — layered over the gradient */}
      <StarField />

      {/* Full-panel victory burst — green-gold radial flash + six
          radiating sparkles. Plays once on mount of the win result. */}
      {isWin && (
        <>
          <motion.div
            key="victory-flash"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.55, 0], scale: [0.6, 1.4, 1.6] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "radial-gradient(circle, rgba(250,204,21,0.6) 0%, rgba(253,224,71,0.25) 40%, transparent 70%)",
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
              className="pointer-events-none absolute left-1/2 top-1/3 z-10 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_14px_#fde047]"
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
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "radial-gradient(circle, transparent 25%, rgba(239,68,68,0.55) 90%)",
          }}
        />
      )}

      {/* Winged VICTORY / DEFEAT banner header — compact top padding
          so the whole panel fits on one screen without scrolling. */}
      <div className="relative z-20 flex flex-col items-center px-4 pb-2 pt-4 sm:px-6 sm:pt-5">
        <VictoryBanner isWin={isWin} />
        <OutcomeRibbon isWin={isWin} bossName={bossName} />
      </div>

      {/* Round replay — ornate golden bordered panel like reference REWARDS box */}
      <div className="relative z-20 px-4 pb-2 sm:px-6">
        <PanelBox label="ROUND REPLAY" isWin={isWin} disabled={tutorialMode}>
          <HpReplay
            timeline={result.hpTimeline}
            bossHpInitial={bossHpInitial}
            playerHpInitial={playerHpInitial}
            finalScores={result.perQuestionScores}
            showStats={showStats}
            isWin={isWin}
            bossAsset={bossAsset}
            founderAsset={founderAsset}
          />
        </PanelBox>
      </div>

      {/* XP badge reveal — ornate golden bordered panel like reference SCORE SUMMARY box */}
      <div className="relative z-20 px-4 pb-2 sm:px-6">
        <PanelBox label="INDIVIDUAL XP" isWin={isWin} disabled={tutorialMode}>
          <XpBadgeReveal points={result.individualPointsAwarded} isWin={isWin} />
        </PanelBox>
      </div>

      {/* Actions — STATS toggle + ADVANCE / RETRY. In tutorial mode
          STATS is disabled + dimmed and CONTINUE gets a pulsing
          highlight so the only thing the user can (or wants to) do
          is press it. */}
      <div className="relative z-20 flex flex-wrap items-center justify-center gap-3 px-4 pb-4 pt-1 sm:px-6 sm:pb-6">
        <StatsButton
          expanded={showStats}
          onClick={() => setShowStats((v) => !v)}
          disabled={tutorialMode}
        />
        {isWin ? (
          <AdvanceButton onClick={onAdvance} highlight={tutorialMode} />
        ) : (
          <RetryButton onClick={onRetryCombat} highlight={tutorialMode} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Corner ornaments — small L-shaped golden brackets in each corner.
// Renders as an SVG so it scales crisply and the corner points can
// carry a subtle inner glow.
// ─────────────────────────────────────────────────────────────────────

function CornerOrnament({
  corner,
  isWin,
}: {
  corner: "tl" | "tr" | "bl" | "br";
  isWin: boolean;
}) {
  // Rotate the same SVG so we only maintain one asset.
  const rotate =
    corner === "tr"
      ? "rotate(90deg)"
      : corner === "br"
        ? "rotate(180deg)"
        : corner === "bl"
          ? "rotate(270deg)"
          : "none";
  const positionClass =
    corner === "tl"
      ? "left-2 top-2"
      : corner === "tr"
        ? "right-2 top-2"
        : corner === "bl"
          ? "bottom-2 left-2"
          : "bottom-2 right-2";
  const color = isWin ? "#fde047" : "#f87171";
  return (
    <svg
      className={`pointer-events-none absolute z-30 h-6 w-6 ${positionClass}`}
      viewBox="0 0 24 24"
      style={{
        transform: rotate,
        filter: `drop-shadow(0 0 4px ${color}88)`,
      }}
      aria-hidden
    >
      {/* L-shape bracket */}
      <path
        d="M2 2 L14 2 M2 2 L2 14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
        fill="none"
      />
      {/* Little diamond stud at the elbow */}
      <rect
        x="1"
        y="1"
        width="4"
        height="4"
        transform="rotate(45 3 3)"
        fill={color}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Star field — twinkling background dots
// ─────────────────────────────────────────────────────────────────────

function StarField() {
  // Deterministic pseudo-random positions so the star field stays
  // stable across re-renders (no useMemo-random churn).
  const stars = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        top: ((i * 137) % 100) + Math.floor(i / 8),
        left: ((i * 89) % 100) + Math.floor(i / 6),
        delay: (i * 0.23) % 3,
        size: i % 5 === 0 ? 3 : 2,
        duration: 2.4 + ((i * 0.17) % 2),
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {stars.map((s, i) => (
        <motion.span
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            boxShadow: "0 0 6px rgba(255,255,255,0.6)",
          }}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: s.delay,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// VICTORY banner — winged golden banner with a rising sword
// ─────────────────────────────────────────────────────────────────────

function VictoryBanner({ isWin }: { isWin: boolean }) {
  // Reference-mock rework — the small winged plaque was replaced with
  // a big flat gold pixel-art title crowned by a sword-with-wings
  // ornament floating ABOVE the text, and a thin gold underline
  // divider below. Matches the client's pinned reference layout
  // ("VICTORY! / BOSS DEFEATED" heading over a navy card).
  const label = isWin ? "VICTORY!" : "DEFEAT!";
  const gold = isWin ? "#F5C542" : "#fca5a5";
  const goldDeep = isWin ? "#8a5a0f" : "#7f1d1d";
  const outline = isWin ? "#1a0f00" : "#2a0a0a";
  const glow = isWin ? "rgba(245,197,66,0.55)" : "rgba(239,68,68,0.45)";

  return (
    <div className="relative flex flex-col items-center gap-1">
      {/* Sword-with-wings crest above the title — compact (32px tall)
          so the header doesn't eat vertical space. */}
      <SwordWithWings gold={gold} goldDeep={goldDeep} />

      {/* Big pixel-art title — CSS text with heavy layered strokes
          so it reads as chunky pixel gold matching the reference
          without needing a bespoke bitmap font. Sized down from the
          previous clamp(48,8vw,88) so the whole panel fits above
          the fold on typical laptop screens. */}
      <div
        className="relative"
        style={{ filter: `drop-shadow(0 0 16px ${glow})` }}
      >
        <span
          className="block leading-none"
          style={{
            fontFamily: "var(--font-pixel-display), monospace",
            fontSize: "clamp(36px, 6vw, 60px)",
            fontWeight: 900,
            letterSpacing: "0.05em",
            color: gold,
            WebkitTextStroke: `2px ${outline}`,
            textShadow: `0 3px 0 ${goldDeep}, 0 5px 0 ${outline}, 0 7px 10px rgba(0,0,0,0.7)`,
            imageRendering: "pixelated",
          }}
        >
          {label}
        </span>
      </div>

      {/* Thin dividing line below the title — matches the reference's
          horizontal gold rule between VICTORY and BOSS DEFEATED. */}
      <div
        className="mt-1 h-px w-full max-w-[440px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${gold} 15%, ${gold} 85%, transparent)`,
          opacity: 0.7,
        }}
      />
    </div>
  );
}

/** Sword-with-wings ornament above the VICTORY title — thin pixel-art
 *  crest that centres the sword blade with two feathered wings flared
 *  out either side, all rendered in the same gold palette as the
 *  title. Sits at ~40px tall so it doesn't dominate the header. */
function SwordWithWings({
  gold,
  goldDeep,
}: {
  gold: string;
  goldDeep: string;
}) {
  return (
    <svg
      aria-hidden
      width={106}
      height={32}
      viewBox="0 0 140 42"
      style={{ filter: `drop-shadow(0 3px 4px rgba(0,0,0,0.5))` }}
    >
      {/* Central sword — vertical blade + crossguard + pommel */}
      <polygon points="70,2 73,8 73,30 67,30 67,8" fill="#e5e7eb" />
      <polygon points="70,2 71,8 71,30 70,30" fill="#f9fafb" />
      <rect x="60" y="28" width="20" height="4" fill={gold} />
      <rect x="60" y="28" width="20" height="1" fill="#fff8e1" opacity="0.6" />
      <rect x="60" y="31" width="20" height="1" fill={goldDeep} />
      <rect x="68" y="32" width="4" height="6" fill={goldDeep} />
      <circle cx="70" cy="40" r="2.5" fill={gold} />

      {/* Left wing */}
      <path
        d="M60 22 C 45 12, 25 10, 10 18 C 18 20, 35 24, 50 30 C 55 32, 58 28, 60 22 Z"
        fill={gold}
        stroke={goldDeep}
        strokeWidth="1"
      />
      {/* Right wing (mirror) */}
      <g transform="translate(140 0) scale(-1 1)">
        <path
          d="M60 22 C 45 12, 25 10, 10 18 C 18 20, 35 24, 50 30 C 55 32, 58 28, 60 22 Z"
          fill={gold}
          stroke={goldDeep}
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}

// Legacy `Wing` component removed — the new SwordWithWings crest
// above VictoryBanner supersedes it. Old callsites were only inside
// the old VictoryBanner block that was rewritten above.

// ─────────────────────────────────────────────────────────────────────
// Outcome ribbon — "BOSS RETREATED" / "YOU WERE WORN DOWN"
// ─────────────────────────────────────────────────────────────────────

function OutcomeRibbon({
  isWin,
  bossName,
}: {
  isWin: boolean;
  bossName: string | null;
}) {
  // Reference-matched subtitle — no thin dashes, just a bold gold
  // outlined line ("BOSS DEFEATED / RETREATED") sitting directly
  // under the VICTORY! title. Same chunky pixel-art voice.
  const gold = isWin ? "#F5C542" : "#fca5a5";
  const goldDeep = isWin ? "#8a5a0f" : "#7f1d1d";
  const outline = isWin ? "#1a0f00" : "#2a0a0a";
  const displayName = (bossName && bossName.trim().length > 0
    ? bossName
    : "Boss"
  ).toUpperCase();
  const label = isWin
    ? `${displayName} RETREATED`
    : `${displayName} STRUCK YOU DOWN`;
  return (
    <div className="mt-1 flex items-center justify-center">
      <span
        className="text-[11px] font-black uppercase tracking-[0.4em] sm:text-xs"
        style={{
          fontFamily: "var(--font-pixel-display), monospace",
          color: gold,
          WebkitTextStroke: `0.8px ${outline}`,
          textShadow: `0 2px 0 ${goldDeep}, 0 3px 4px rgba(0,0,0,0.55)`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Section divider — "◇ LABEL ◇" with hairline gold rules
// ─────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────
// PanelBox — ornate gold-bordered container that wraps a labeled
// section (ROUND REPLAY / INDIVIDUAL XP), styled to match the
// reference REWARDS / SCORE SUMMARY panels: chunky double-line pixel
// border, corner studs, and an inline notched header ribbon with the
// section name in pixel-art gold. Loss variant uses red accents.
// ─────────────────────────────────────────────────────────────────────

function PanelBox({
  label,
  isWin,
  children,
  disabled = false,
}: {
  label: string;
  isWin: boolean;
  children: React.ReactNode;
  /** Tutorial-mode: dim the content so the eye is drawn to CONTINUE. */
  disabled?: boolean;
}) {
  const gold = isWin ? "#F5C542" : "#f87171";
  const goldDeep = isWin ? "#8a5a0f" : "#7f1d1d";
  const goldSoft = isWin ? "rgba(245,197,66,0.35)" : "rgba(248,113,113,0.35)";
  const bgFill = isWin ? "rgba(9,14,36,0.55)" : "rgba(36,9,9,0.55)";
  const outline = isWin ? "#1a0f00" : "#2a0a0a";
  return (
    <div className="relative mt-2">
      {/* Outer border box */}
      <div
        className="relative rounded-md px-3 pb-3 pt-5 sm:px-4 sm:pt-6"
        style={{
          border: `2px solid ${gold}`,
          boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.55), inset 0 0 22px ${goldSoft}, 0 0 12px rgba(0,0,0,0.4)`,
          background: bgFill,
          backdropFilter: "blur(1px)",
        }}
      >
        {/* Inline notched header ribbon — floats over the top border */}
        <div className="pointer-events-none absolute -top-3 left-1/2 z-10 -translate-x-1/2 select-none">
          <span
            className="inline-block px-3 py-[3px] text-[10px] font-black uppercase tracking-[0.4em] sm:text-xs"
            style={{
              fontFamily: "var(--font-pixel-display), monospace",
              color: gold,
              WebkitTextStroke: `0.6px ${outline}`,
              textShadow: `0 1px 0 ${goldDeep}, 0 2px 3px rgba(0,0,0,0.55)`,
              background:
                "linear-gradient(180deg, #14224a 0%, #0b1030 100%)",
              border: `2px solid ${gold}`,
              boxShadow: `0 0 8px ${goldSoft}, inset 0 0 6px rgba(0,0,0,0.55)`,
              // Faceted "banner" edges — clipped notches on both sides.
              clipPath:
                "polygon(6px 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0 50%)",
            }}
          >
            {label}
          </span>
        </div>

        {/* Corner studs — small diamond markers at each inner corner */}
        {(["tl", "tr", "bl", "br"] as const).map((c) => (
          <span
            key={c}
            aria-hidden
            className="pointer-events-none absolute z-0"
            style={{
              width: 6,
              height: 6,
              transform: "rotate(45deg)",
              background: gold,
              boxShadow: `0 0 4px ${gold}`,
              top: c.startsWith("t") ? -3 : undefined,
              bottom: c.startsWith("b") ? -3 : undefined,
              left: c.endsWith("l") ? -3 : undefined,
              right: c.endsWith("r") ? -3 : undefined,
            }}
          />
        ))}

        {/* Wrapper applies the tutorial-focus dim so the box's title
            ribbon + border still read normally, but the inner content
            (HP bars, XP badge) recedes visually to nudge attention
            toward CONTINUE. Pointer-events off in dim mode so the
            HP-replay cells + STATS toggle stay unclickable. */}
        <div
          style={{
            opacity: disabled ? 0.42 : 1,
            pointerEvents: disabled ? "none" : "auto",
            transition: "opacity 240ms ease-out",
            filter: disabled ? "saturate(0.6)" : "none",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SectionDivider — legacy thin divider (kept for potential reuse; no
// longer called by the main layout, which now uses PanelBox).
// ─────────────────────────────────────────────────────────────────────

function SectionDivider({
  label,
  isWin,
}: {
  label: string;
  isWin: boolean;
}) {
  const color = isWin ? "#fde047" : "#fca5a5";
  return (
    <div className="mb-3 flex items-center justify-center gap-3">
      <span
        className="h-px flex-1 max-w-[120px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}77 40%, ${color}77 60%, transparent)`,
        }}
      />
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          transform: "rotate(45deg)",
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <span
        className="text-xs font-black uppercase tracking-[0.35em]"
        style={{
          fontFamily: "var(--font-pixel-display), monospace",
          color,
        }}
      >
        {label}
      </span>
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          transform: "rotate(45deg)",
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <span
        className="h-px flex-1 max-w-[120px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}77 40%, ${color}77 60%, transparent)`,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// HP timeline replay — a card per question with pixel avatars
// ─────────────────────────────────────────────────────────────────────

function HpReplay({
  timeline,
  bossHpInitial,
  playerHpInitial,
  finalScores,
  showStats,
  isWin,
  bossAsset,
  founderAsset,
}: {
  timeline: Array<{ bossHpAfter: number; playerHpAfter: number }>;
  bossHpInitial: number;
  playerHpInitial: number;
  finalScores: number[];
  showStats: boolean;
  isWin: boolean;
  bossAsset: string | null;
  founderAsset: string | null;
}) {
  const cols = Math.max(1, Math.min(2, timeline.length));
  return (
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {timeline.map((step, i) => (
        <ReplayCard
          key={i}
          qIndex={i}
          step={step}
          bossHpInitial={bossHpInitial}
          playerHpInitial={playerHpInitial}
          score={finalScores?.[i]}
          showScore={showStats}
          isWin={isWin}
          bossAsset={bossAsset}
          founderAsset={founderAsset}
        />
      ))}
    </div>
  );
}

function ReplayCard({
  qIndex,
  step,
  bossHpInitial,
  playerHpInitial,
  score,
  showScore,
  isWin,
  bossAsset,
  founderAsset,
}: {
  qIndex: number;
  step: { bossHpAfter: number; playerHpAfter: number };
  bossHpInitial: number;
  playerHpInitial: number;
  score: number | undefined;
  showScore: boolean;
  isWin: boolean;
  bossAsset: string | null;
  founderAsset: string | null;
}) {
  const bossFrac =
    bossHpInitial > 0 ? Math.max(0, step.bossHpAfter / bossHpInitial) : 0;
  const playerFrac =
    playerHpInitial > 0
      ? Math.max(0, step.playerHpAfter / playerHpInitial)
      : 0;
  const borderColor = isWin ? "rgba(250,204,21,0.35)" : "rgba(239,68,68,0.35)";

  return (
    <div
      className="relative rounded-lg border p-3"
      style={{
        borderColor,
        background:
          "linear-gradient(180deg, rgba(10,15,40,0.65) 0%, rgba(5,8,26,0.65) 100%)",
        boxShadow: "inset 0 0 12px rgba(0,0,0,0.4)",
      }}
    >
      {/* Q label centered up top */}
      <div className="mb-2 flex items-center justify-center">
        <span
          className="rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
          style={{
            fontFamily: "var(--font-pixel-display), monospace",
            color: "#fde047",
            borderColor: "rgba(250,204,21,0.4)",
            background: "rgba(250,204,21,0.08)",
          }}
        >
          Q{qIndex + 1}
        </span>
      </div>

      {/* Boss row — real boss sprite when the parent panel passed a
          bossAsset (same idle spritesheet the arena used). Falls back
          to the procedural pixel imp if no asset was provided. */}
      <div className="mb-2 flex items-center gap-2">
        {bossAsset ? (
          <RealAvatar src={bossAsset} alt="Boss" mirror clip="left" />
        ) : (
          <PixelBossAvatar />
        )}
        <div className="flex-1">
          <div className="flex items-baseline justify-between text-[10px]">
            <span
              className="font-mono uppercase tracking-widest text-white/70"
              style={{ fontFamily: "var(--font-pixel-display), monospace" }}
            >
              Boss
            </span>
            <span
              className="font-mono tabular-nums text-white/70"
              style={{ fontFamily: "var(--font-pixel-display), monospace" }}
            >
              {Math.max(0, step.bossHpAfter)} / {bossHpInitial}
            </span>
          </div>
          <BarSegmented
            fraction={bossFrac}
            colorFrom="#ef4444"
            colorTo="#f87171"
          />
        </div>
      </div>

      {/* Player row — real founder / persona portrait when passed. */}
      <div className="flex items-center gap-2">
        {founderAsset ? (
          <RealAvatar src={founderAsset} alt="You" />
        ) : (
          <PixelPlayerAvatar />
        )}
        <div className="flex-1">
          <div className="flex items-baseline justify-between text-[10px]">
            <span
              className="font-mono uppercase tracking-widest text-white/70"
              style={{ fontFamily: "var(--font-pixel-display), monospace" }}
            >
              You
            </span>
            <span
              className="font-mono tabular-nums text-white/70"
              style={{ fontFamily: "var(--font-pixel-display), monospace" }}
            >
              {Math.max(0, step.playerHpAfter)} / {playerHpInitial}
            </span>
          </div>
          <BarSegmented
            fraction={playerFrac}
            colorFrom="#22c55e"
            colorTo="#4ade80"
          />
        </div>
      </div>

      {/* Optional per-question score chip — only visible when STATS is
          toggled on. Kept subtle so it doesn't dominate the card in
          the default view. */}
      {showScore && typeof score === "number" && (
        <div className="mt-2 flex items-center justify-end">
          <span
            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${scoreColour(score)}`}
            style={{
              borderColor: "currentColor",
              fontFamily: "var(--font-pixel-display), monospace",
            }}
          >
            Score {score}/5
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Segmented HP bar — subtle inner ticks give a pixel-art feel while
 * keeping the fill perfectly smooth. Border + inset shadow mimic the
 * embossed look in the reference mock.
 */
function BarSegmented({
  fraction,
  colorFrom,
  colorTo,
}: {
  fraction: number;
  colorFrom: string;
  colorTo: string;
}) {
  return (
    <div
      className="relative mt-0.5 h-2 w-full overflow-hidden rounded-sm border"
      style={{
        borderColor: "rgba(255,255,255,0.15)",
        background: "rgba(0,0,0,0.65)",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.7)",
      }}
    >
      <motion.div
        className="h-full"
        style={{
          background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
          boxShadow: `0 0 6px ${colorFrom}66`,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${fraction * 100}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      {/* Faint segment ticks — one every 10% */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0, transparent 9%, rgba(0,0,0,0.6) 9%, rgba(0,0,0,0.6) 10%)",
        }}
      />
    </div>
  );
}

/**
 * 32×32 pixel-art boss portrait — small purple imp-style monster.
 * Static SVG so no asset dependency + always crisp.
 */
function PixelBossAvatar() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-8 w-8 shrink-0"
      style={{ imageRendering: "pixelated" }}
    >
      {/* Halo shadow */}
      <ellipse cx="8" cy="14" rx="5" ry="1" fill="#000" opacity="0.4" />
      {/* Horns */}
      <rect x="3" y="1" width="2" height="2" fill="#7c3aed" />
      <rect x="11" y="1" width="2" height="2" fill="#7c3aed" />
      {/* Head */}
      <rect x="3" y="3" width="10" height="7" fill="#a78bfa" />
      <rect x="4" y="4" width="8" height="1" fill="#c4b5fd" opacity="0.6" />
      {/* Eyes */}
      <rect x="5" y="5" width="2" height="2" fill="#fff" />
      <rect x="9" y="5" width="2" height="2" fill="#fff" />
      <rect x="5" y="5" width="1" height="1" fill="#1e1b4b" />
      <rect x="9" y="5" width="1" height="1" fill="#1e1b4b" />
      {/* Fangs */}
      <rect x="5" y="8" width="2" height="1" fill="#fff" />
      <rect x="9" y="8" width="2" height="1" fill="#fff" />
      {/* Cloak */}
      <rect x="2" y="10" width="12" height="4" fill="#6d28d9" />
      <rect x="2" y="10" width="12" height="1" fill="#7c3aed" opacity="0.7" />
    </svg>
  );
}

/**
 * 32×32 pixel-art player avatar — hooded blue knight matching the
 * default hero silhouette used in the arena. Not persona-specific
 * because the timeline is per-round not per-persona; the point is
 * "this is you" in a recognisable-at-a-glance way.
 */
function PixelPlayerAvatar() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-8 w-8 shrink-0"
      style={{ imageRendering: "pixelated" }}
    >
      <ellipse cx="8" cy="14" rx="5" ry="1" fill="#000" opacity="0.4" />
      {/* Helmet */}
      <rect x="4" y="1" width="8" height="4" fill="#3b82f6" />
      <rect x="4" y="1" width="8" height="1" fill="#60a5fa" opacity="0.7" />
      {/* Visor slit */}
      <rect x="5" y="3" width="6" height="1" fill="#0b1030" />
      {/* Face plate */}
      <rect x="5" y="5" width="6" height="3" fill="#fbd29c" />
      <rect x="6" y="6" width="1" height="1" fill="#0b1030" />
      <rect x="9" y="6" width="1" height="1" fill="#0b1030" />
      {/* Armor body */}
      <rect x="3" y="8" width="10" height="6" fill="#1e40af" />
      <rect x="3" y="8" width="10" height="1" fill="#3b82f6" opacity="0.7" />
      {/* Chest crest */}
      <rect x="7" y="10" width="2" height="2" fill="#facc15" />
      {/* Belt */}
      <rect x="3" y="12" width="10" height="1" fill="#78350f" />
    </svg>
  );
}

/**
 * 32×32 avatar cell backed by a real sprite asset (boss idle sheet
 * OR persona portrait). Handles two shapes:
 *   - Wide horizontal spritesheets (e.g. Fog of Vagueness 828×92,
 *     9 × 92-px idle frames) — clipped to the first frame by keying
 *     `background-size` to fit the square-frame height.
 *   - Single-image portraits — rendered normally with `cover`.
 *
 * `clip="left"` shows the leftmost portion of the source (useful
 * for spritesheets where frame 0 is the first frame — the arena's
 * idle pose). Default `center` for portraits.
 * `mirror` flips horizontally (bosses face left in the arena but
 * the icon looks more expected facing right in a compact row).
 */
function RealAvatar({
  src,
  alt,
  clip = "center",
  mirror = false,
}: {
  src: string;
  alt: string;
  clip?: "left" | "center";
  mirror?: boolean;
}) {
  return (
    <div
      aria-label={alt}
      role="img"
      className="h-8 w-8 shrink-0 rounded-md border border-white/10 overflow-hidden"
      style={{
        backgroundImage: `url(${src})`,
        // `auto 100%` sizes by height so wide spritesheets show one
        // frame's worth of horizontal pixels; single-image portraits
        // fit exactly into the box.
        backgroundSize: "auto 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: clip === "left" ? "left center" : "center center",
        imageRendering: "pixelated",
        transform: mirror ? "scaleX(-1)" : undefined,
      }}
    />
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
// XP badge reveal — hex shield + counter + 8-way spark burst
// ─────────────────────────────────────────────────────────────────────

function XpBadgeReveal({
  points,
  isWin,
}: {
  points: number;
  isWin: boolean;
}) {
  const isPositive = points > 0;
  const target = Math.abs(points);
  const [display, setDisplay] = useState<number>(isPositive ? 0 : points);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (!isPositive) {
      setDisplay(points);
      return;
    }
    // Linear 1-by-1 increment per product request ("start from 1-2-3-4-5
    // increasing till the amount"). Previously used a 16%-of-remaining
    // ease-out that jumped 0→10→18→25→…, which is what the user saw as
    // "not counting up properly". Now: +1 per tick.
    //
    // Tick timing is target-aware so the whole animation completes in
    // roughly the same visible window regardless of magnitude:
    //   - Small awards (≤120 xp) → 12ms per tick (60 xp = 720ms).
    //   - Larger awards → cap total duration around 1500ms by
    //     stepping in chunks (still visually smooth).
    setDisplay(0);
    setBurst(false);
    // Chunk size: 1 for normal awards, bigger for huge ones so we
    // don't sit at "23... 24... 25..." for six seconds.
    const stepJump = target > 200 ? Math.max(1, Math.ceil(target / 150)) : 1;
    const stepMs = Math.max(12, Math.min(28, Math.floor(1500 / (target / stepJump))));
    let current = 0;
    const id = window.setInterval(() => {
      current = Math.min(target, current + stepJump);
      setDisplay(current);
      if (current >= target) {
        window.clearInterval(id);
        // Spark burst on the exact reveal frame — matches "then at 60
        // a spark like professional games have" from the product spec.
        setBurst(true);
        window.setTimeout(() => setBurst(false), 900);
      }
    }, stepMs);
    return () => window.clearInterval(id);
  }, [points, target, isPositive]);

  const accent = isPositive ? "#22d3ee" : "#f87171";
  const glow = isPositive ? "rgba(34,211,238,0.7)" : "rgba(239,68,68,0.7)";

  return (
    <div className="relative flex items-center justify-center gap-4 py-2">
      {/* Hex XP badge */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 64, height: 72 }}
      >
        {/* Sparkle stars around badge */}
        {[
          { top: -6, left: -8 },
          { top: -4, right: -8 },
          { top: 20, left: -14 },
          { top: 24, right: -14 },
          { bottom: -4, left: 4 },
          { bottom: -8, right: 4 },
        ].map((pos, i) => (
          <motion.span
            key={`badge-star-${i}`}
            className="pointer-events-none absolute h-1.5 w-1.5"
            style={{
              ...pos,
              background: accent,
              transform: "rotate(45deg)",
              boxShadow: `0 0 6px ${glow}`,
            }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.7, 1.2, 0.7] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.22,
            }}
          />
        ))}

        {/* Hex badge SVG */}
        <svg
          viewBox="0 0 64 72"
          width={64}
          height={72}
          aria-hidden
          style={{ filter: `drop-shadow(0 0 12px ${glow})` }}
        >
          <defs>
            <linearGradient id="xp-badge-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0e7490" />
              <stop offset="100%" stopColor="#0b3b52" />
            </linearGradient>
          </defs>
          {/* Hex outline */}
          <polygon
            points="32,2 60,18 60,54 32,70 4,54 4,18"
            fill="url(#xp-badge-fill)"
            stroke={accent}
            strokeWidth="2.5"
          />
          {/* Inner hex bevel */}
          <polygon
            points="32,8 55,21 55,51 32,64 9,51 9,21"
            fill="none"
            stroke={accent}
            strokeOpacity="0.4"
            strokeWidth="1"
          />
          {/* XP text */}
          <text
            x="32"
            y="42"
            textAnchor="middle"
            fontSize="18"
            fontWeight="900"
            fill="#e0f2fe"
            style={{
              fontFamily: "var(--font-pixel-display), monospace",
              textShadow: "0 2px 4px rgba(0,0,0,0.6)",
            }}
          >
            XP
          </text>
        </svg>
      </div>

      {/* Counter with burst */}
      <div className="relative">
        <motion.span
          key={`xp-num-${points}`}
          className="inline-block text-3xl font-black tabular-nums sm:text-4xl"
          style={{
            fontFamily: "var(--font-pixel-display), monospace",
            color: isPositive ? "#fde047" : "#fca5a5",
            textShadow: `0 2px 0 ${isWin ? "#78350f" : "#7f1d1d"}, 0 4px 8px rgba(0,0,0,0.6)`,
          }}
          animate={
            burst
              ? {
                  scale: [1, 1.35, 1],
                }
              : { scale: 1 }
          }
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          {isPositive ? `+${display}` : `${display}`}
        </motion.span>
        <AnimatePresence>
          {burst && (
            <>
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const dx = Math.cos(angle) * 42;
                const dy = Math.sin(angle) * 42;
                return (
                  <motion.span
                    key={`xp-spark-${i}`}
                    className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200"
                    style={{
                      boxShadow: "0 0 10px rgba(253,224,71,0.9)",
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                    animate={{ x: dx, y: dy, opacity: 0, scale: 1.3 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                );
              })}
              <motion.span
                key="xp-ring"
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-200"
                initial={{ width: 4, height: 4, opacity: 0.95 }}
                animate={{ width: 74, height: 74, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Action buttons — STATS toggle + ADVANCE / RETRY primary
// ─────────────────────────────────────────────────────────────────────

function StatsButton({
  expanded,
  onClick,
  disabled = false,
}: {
  expanded: boolean;
  onClick: () => void;
  /** Tutorial focus mode — dim + block clicks. */
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-pressed={expanded}
      aria-disabled={disabled}
      disabled={disabled}
      className="group inline-flex items-center gap-2 rounded-md border-2 px-5 py-2.5 font-mono text-xs font-black uppercase tracking-widest transition-all"
      style={{
        fontFamily: "var(--font-pixel-display), monospace",
        color: "#fde047",
        background: "rgba(0,0,0,0.55)",
        borderColor: "rgba(250,204,21,0.55)",
        boxShadow:
          "0 4px 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        filter: disabled ? "saturate(0.5)" : "none",
      }}
    >
      {/* Simple bar-chart icon */}
      <svg
        aria-hidden
        width={14}
        height={14}
        viewBox="0 0 14 14"
        style={{ imageRendering: "pixelated" }}
      >
        <rect x="1" y="8" width="3" height="5" fill="#fde047" />
        <rect x="5.5" y="5" width="3" height="8" fill="#fde047" />
        <rect x="10" y="2" width="3" height="11" fill="#fde047" />
      </svg>
      Stats
    </button>
  );
}

function AdvanceButton({
  onClick,
  highlight = false,
}: {
  onClick: () => void;
  /** Tutorial focus mode — add a pulsing gold ring so users can't
   *  miss the only enabled control on the panel. */
  highlight?: boolean;
}) {
  // "CONTINUE" pixel-art button matching the reference theme:
  // gold-outlined navy pill flanked by chunky arrow flourishes on each
  // side. Retains the green advance semantics via the interior fill
  // hue but adopts the ornate pixel border language of the panel.
  const gold = "#F5C542";
  const goldDeep = "#8a5a0f";
  const outline = "#1a0f00";
  return (
    <div className="relative flex items-center gap-2">
      {/* Pulsing highlight ring — only in tutorial mode. Framer-motion
          scale + opacity loop reads as a soft "look here" beacon
          without being obnoxious. */}
      {highlight && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md"
          style={{
            boxShadow: `0 0 0 3px ${gold}, 0 0 24px 4px rgba(245,197,66,0.6)`,
          }}
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.06, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <PixelArrowFlourish direction="left" color={gold} />
      <button
        type="button"
        onClick={onClick}
        className="group inline-flex items-center gap-3 rounded-md px-7 py-3 font-mono text-sm font-black uppercase tracking-[0.35em] transition-all hover:brightness-110"
        style={{
          fontFamily: "var(--font-pixel-display), monospace",
          color: gold,
          background:
            "linear-gradient(180deg, #14224a 0%, #0b1030 100%)",
          border: `2px solid ${gold}`,
          WebkitTextStroke: `0.6px ${outline}`,
          textShadow: `0 2px 0 ${goldDeep}, 0 3px 4px rgba(0,0,0,0.55)`,
          boxShadow: highlight
            ? "0 4px 0 rgba(0,0,0,0.55), inset 0 0 16px rgba(245,197,66,0.4), 0 0 26px rgba(245,197,66,0.55)"
            : "0 4px 0 rgba(0,0,0,0.55), inset 0 0 12px rgba(245,197,66,0.25), 0 0 18px rgba(245,197,66,0.35)",
        }}
      >
        Continue
        <svg
          aria-hidden
          width={12}
          height={12}
          viewBox="0 0 12 12"
          style={{ imageRendering: "pixelated" }}
        >
          <polygon points="2,1 11,6 2,11" fill={gold} />
        </svg>
      </button>
      <PixelArrowFlourish direction="right" color={gold} />
    </div>
  );
}

// Chunky pixel-art arrow flourish rendered on either side of the
// CONTINUE button (mirrors the reference theme). Purely decorative.
function PixelArrowFlourish({
  direction,
  color,
}: {
  direction: "left" | "right";
  color: string;
}) {
  return (
    <svg
      aria-hidden
      width={22}
      height={16}
      viewBox="0 0 22 16"
      style={{
        transform: direction === "right" ? "scaleX(-1)" : undefined,
        filter: `drop-shadow(0 0 4px ${color}66)`,
        imageRendering: "pixelated",
      }}
    >
      {/* Two stacked chevrons pointing at the button */}
      <polygon points="0,8 8,0 12,0 4,8 12,16 8,16" fill={color} />
      <polygon
        points="10,8 18,0 22,0 14,8 22,16 18,16"
        fill={color}
        opacity={0.7}
      />
    </svg>
  );
}

function RetryButton({
  onClick,
  highlight = false,
}: {
  onClick: () => void;
  /** Tutorial focus mode — add a pulsing red ring so users notice
   *  the only enabled action after a defeat. */
  highlight?: boolean;
}) {
  return (
    <div className="relative inline-flex items-center">
      {highlight && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md"
          style={{
            boxShadow:
              "0 0 0 3px #f87171, 0 0 24px 4px rgba(248,113,113,0.6)",
          }}
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.06, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <button
      type="button"
      onClick={() => {
        console.log("[combat] Retry button clicked");
        onClick();
      }}
      className="inline-flex items-center gap-2 rounded-md border-2 px-6 py-2.5 font-mono text-xs font-black uppercase tracking-widest transition-all hover:brightness-110"
      style={{
        fontFamily: "var(--font-pixel-display), monospace",
        color: "#fee2e2",
        background: "linear-gradient(180deg, #dc2626 0%, #7f1d1d 100%)",
        borderColor: "#f87171",
        boxShadow:
          "0 4px 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 22px rgba(248,113,113,0.35)",
      }}
    >
      Retry Combat
      <svg aria-hidden width={12} height={12} viewBox="0 0 12 12">
        <polygon points="2,1 11,6 2,11" fill="#fee2e2" />
      </svg>
    </button>
    </div>
  );
}
