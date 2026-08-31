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

  // ── WIN variant — use the ornate reference PNG as the frame ────────
  // The image already contains the border, corner ornaments, sword-
  // with-wings crest, "VICTORY!" title, gold rule and CONTINUE button.
  // We just position our dynamic data (boss subtitle, Q1/Q2 replay,
  // XP badge) inside the empty navy field, and drop a transparent
  // clickable button on top of the baked CONTINUE.
  //
  // Percentages below are measured against the source image
  // (1370×1148 → aspect 1.193). Kept in one place so future tweaks
  // are trivial.
  if (isWin) {
    return (
      <div
        className="relative w-full mx-auto"
        // data-tutorial marker lets Step3MapGuide's "victory" stage
        // anchor Sparky's "Congratulations, X retreated!" bubble
        // NEXT TO this panel (product ask: "move that conversation
        // of sparky next to victory box"). Previously the outer
        // combat-panel wrapper was the only marker and it's a
        // fixed-inset-0 full-screen div — TutorialMascot bails on
        // targets larger than 75%×60% of the viewport and falls
        // back to bottom-right, which is why the bubble appeared in
        // the corner instead of beside the Victory panel.
        data-tutorial="combat-victory-panel"
        style={{
          maxWidth: 720,
          aspectRatio: "1370 / 1148",
          backgroundImage: "url(/assets/ui/victory-frame.png)",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          imageRendering: "pixelated",
        }}
      >
        {/* Boss subtitle — sits directly under the gold rule
            (~26% down from the top of the frame). */}
        <div
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: "26%" }}
        >
          <BossSubtitle bossName={bossName} isWin={true} />
        </div>

        {/* Round replay — spans ~34%–58% of the frame, inside the
            navy inner field. */}
        <div
          className="absolute left-[6%] right-[6%]"
          style={{ top: "32%" }}
        >
          <HpReplay
            timeline={result.hpTimeline}
            bossHpInitial={bossHpInitial}
            playerHpInitial={playerHpInitial}
            finalScores={result.perQuestionScores}
            showStats={showStats}
            isWin={true}
            bossAsset={bossAsset}
            founderAsset={founderAsset}
          />
        </div>

        {/* Individual XP — bottom of the content field, above the
            baked CONTINUE button. */}
        <div
          className="absolute left-[6%] right-[6%] flex items-center justify-center"
          style={{ top: "66%", height: "18%" }}
        >
          <XpBadgeReveal
            points={result.individualPointsAwarded}
            isWin={true}
          />
        </div>

        {/* STATS button removed per product ask ("remove the stats
            option"). Users advance via CONTINUE only. */}

        {/* Transparent clickable overlay on the baked-in CONTINUE
            button. Product ask reverted — the tutorial's Sparky
            Continue button and the Victory panel's own CONTINUE
            button are now BOTH live during the tutorial. Either one
            advances (both call onAdvance). Users can pick whichever
            they see first. */}
        <BakedContinueOverlay
          onClick={onAdvance}
          highlight={tutorialMode}
        />
      </div>
    );
  }

  // ── LOSS variant — code-drawn frame (no red-frame image supplied) ──
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "#0d1a3d",
        border: "3px solid #b04b3a",
        boxShadow:
          "0 0 0 3px #050912, 0 6px 0 rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.55)",
        borderRadius: 6,
      }}
    >
      <CornerOrnament corner="tl" isWin={false} />
      <CornerOrnament corner="tr" isWin={false} />
      <CornerOrnament corner="bl" isWin={false} />
      <CornerOrnament corner="br" isWin={false} />

      <motion.div
        key="defeat-vignette"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.35, 0.25] }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(180deg, transparent 40%, rgba(239,68,68,0.28) 100%)",
        }}
      />

      <div className="relative z-20 flex flex-col items-center px-4 pb-2 pt-4 sm:px-6 sm:pt-5">
        <VictoryBanner isWin={false} />
        <OutcomeRibbon isWin={false} bossName={bossName} />
      </div>
      <div className="relative z-20 px-4 pb-2 sm:px-6">
        <PanelBox label="ROUND REPLAY" isWin={false} disabled={tutorialMode}>
          <HpReplay
            timeline={result.hpTimeline}
            bossHpInitial={bossHpInitial}
            playerHpInitial={playerHpInitial}
            finalScores={result.perQuestionScores}
            showStats={showStats}
            isWin={false}
            bossAsset={bossAsset}
            founderAsset={founderAsset}
          />
        </PanelBox>
      </div>
      <div className="relative z-20 px-4 pb-2 sm:px-6">
        <PanelBox label="INDIVIDUAL XP" isWin={false} disabled={tutorialMode}>
          <XpBadgeReveal points={result.individualPointsAwarded} isWin={false} />
        </PanelBox>
      </div>
      <div className="relative z-20 flex flex-wrap items-center justify-center gap-3 px-4 pb-4 pt-1 sm:px-6 sm:pb-6">
        {/* STATS button removed per product ask; users advance via
            Retry only on loss screens. */}
        <RetryButton onClick={onRetryCombat} highlight={tutorialMode} />
      </div>
    </div>
  );
}

/** Boss subtitle used inside the image-backed WIN frame. Pixel-gold
 *  text matching the reference's typography. Extracted so we can
 *  render it without the outer OutcomeRibbon wrapper (which adds
 *  its own margins). */
function BossSubtitle({
  bossName,
  isWin,
}: {
  bossName: string | null;
  isWin: boolean;
}) {
  const color = isWin ? "#e6b34b" : "#e07a6a";
  const shade = isWin ? "#7a4a0a" : "#5a1a0a";
  const displayName = (bossName && bossName.trim().length > 0
    ? bossName
    : "Boss"
  ).toUpperCase();
  const label = isWin
    ? `${displayName} RETREATED`
    : `${displayName} STRUCK YOU DOWN`;
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-[0.36em] sm:text-[12px]"
      style={{
        fontFamily: "var(--font-pixel-display), monospace",
        color,
        textShadow: `0 1px 0 ${shade}, 0 2px 3px rgba(0,0,0,0.5)`,
      }}
    >
      {label}
    </span>
  );
}

/** Transparent overlay sized + positioned to sit exactly on top of the
 *  CONTINUE button baked into victory-frame.png. Coordinates are the
 *  same percentages used by the surrounding content blocks so the
 *  hit-area matches what the user sees. Renders a subtle pulsing ring
 *  when the tutorial is guiding the user toward Continue. */
function BakedContinueOverlay({
  onClick,
  highlight,
}: {
  onClick: () => void;
  highlight: boolean;
}) {
  return (
    <>
      {highlight && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute rounded-md"
          style={{
            left: "36%",
            right: "36%",
            top: "88%",
            height: "8%",
            boxShadow:
              "0 0 0 3px #e6b34b, 0 0 24px 6px rgba(230,179,75,0.55)",
          }}
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.04, 1] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <button
        type="button"
        onClick={onClick}
        aria-label="Continue"
        className="absolute cursor-pointer rounded-md bg-transparent transition-transform hover:scale-[1.02] active:scale-[0.98]"
        style={{
          left: "36%",
          right: "36%",
          top: "88%",
          height: "8%",
        }}
      />
    </>
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
  const gold = isWin ? "#e6b34b" : "#c85a4a";
  const goldDeep = isWin ? "#8a5a0f" : "#5a1a0a";
  return (
    <svg
      className={`pointer-events-none absolute z-30 h-8 w-8 sm:h-10 sm:w-10 ${positionClass}`}
      viewBox="0 0 32 32"
      style={{ transform: rotate, imageRendering: "pixelated" }}
      aria-hidden
    >
      {/* Greek-key / meander-style ornate corner bracket — chunky
          pixel-art gold, matching the reference image's corners.
          Built from a few rectangles so it stays crisp. */}
      <g fill={gold}>
        {/* Outer L */}
        <rect x="2" y="2" width="16" height="2" />
        <rect x="2" y="2" width="2" height="16" />
        {/* Inner meander hook */}
        <rect x="6" y="6" width="10" height="2" />
        <rect x="6" y="6" width="2" height="10" />
        <rect x="10" y="10" width="6" height="2" />
        <rect x="10" y="10" width="2" height="6" />
      </g>
      {/* Deep-gold shadow layer for a pixel-bevel look */}
      <g fill={goldDeep} opacity="0.6">
        <rect x="4" y="4" width="14" height="1" />
        <rect x="4" y="4" width="1" height="14" />
      </g>
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
  // Reference-matched ornate banner: sword-with-wings crest above,
  // chunky pixel-gold title with cross flourishes on each side, gold
  // divider with center diamond stud below.
  const label = isWin ? "VICTORY!" : "DEFEAT!";
  const gold = isWin ? "#e6b34b" : "#e07a6a";
  const goldHi = isWin ? "#ffdd7a" : "#ffb0a0";
  const goldDeep = isWin ? "#7a4a0a" : "#5a1a0a";
  const outline = isWin ? "#1a0a00" : "#2a0a05";

  return (
    <div className="relative flex flex-col items-center gap-1">
      {/* Sword-with-wings crest */}
      <SwordWithWings gold={gold} goldDeep={goldDeep} />

      {/* Title row: cross flourish – TITLE – cross flourish */}
      <div className="flex items-center gap-3 sm:gap-4">
        <CrossFlourish gold={gold} goldDeep={goldDeep} />
        <span
          className="block leading-none"
          style={{
            fontFamily: "var(--font-pixel-display), monospace",
            fontSize: "clamp(32px, 6vw, 56px)",
            fontWeight: 900,
            letterSpacing: "0.06em",
            color: gold,
            // Layered pixel bevel: hard drop shadows in deep gold +
            // black outline, plus a bright top-highlight so the glyphs
            // read as chiseled gold blocks like the reference art.
            textShadow: [
              `1px 0 0 ${goldHi}`,
              `-1px 0 0 ${goldHi}`,
              `0 -1px 0 ${goldHi}`,
              `0 2px 0 ${goldDeep}`,
              `0 3px 0 ${goldDeep}`,
              `0 4px 0 ${outline}`,
              `0 5px 0 ${outline}`,
              `0 6px 8px rgba(0,0,0,0.6)`,
            ].join(", "),
            imageRendering: "pixelated",
          }}
        >
          {label}
        </span>
        <CrossFlourish gold={gold} goldDeep={goldDeep} />
      </div>

      {/* Gold rule with center diamond stud */}
      <div className="mt-2 flex w-full items-center justify-center">
        <div
          className="h-[2px] flex-1"
          style={{ background: gold, maxWidth: 200, boxShadow: `0 1px 0 ${goldDeep}` }}
        />
        <span
          aria-hidden
          className="mx-2"
          style={{
            width: 8,
            height: 8,
            transform: "rotate(45deg)",
            background: gold,
            boxShadow: `inset -1px -1px 0 ${goldDeep}`,
            display: "inline-block",
          }}
        />
        <div
          className="h-[2px] flex-1"
          style={{ background: gold, maxWidth: 200, boxShadow: `0 1px 0 ${goldDeep}` }}
        />
      </div>
    </div>
  );
}

/** Small cross flourish rendered on either side of the title
 *  ("+ VICTORY! +" per the reference). Two thin gold bars flanking
 *  a tiny diamond stud. */
function CrossFlourish({
  gold,
  goldDeep,
}: {
  gold: string;
  goldDeep: string;
}) {
  return (
    <svg
      aria-hidden
      width={54}
      height={16}
      viewBox="0 0 54 16"
      style={{ imageRendering: "pixelated", flexShrink: 0 }}
    >
      <rect x="0" y="7" width="20" height="2" fill={gold} />
      <rect x="0" y="9" width="20" height="1" fill={goldDeep} />
      <rect x="22" y="6" width="4" height="4" fill={gold} transform="rotate(45 24 8)" />
      <rect x="34" y="7" width="20" height="2" fill={gold} />
      <rect x="34" y="9" width="20" height="1" fill={goldDeep} />
    </svg>
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
  // Ornate crest matching the reference: chunky pixel-art sword
  // pointing down with a blue gem in the crossguard, flanked by two
  // three-tier feathered wings. Rendered pixel-crisp via rectangular
  // primitives + polygons.
  return (
    <svg
      aria-hidden
      width={140}
      height={44}
      viewBox="0 0 140 44"
      style={{ imageRendering: "pixelated" }}
    >
      {/* ── Left wing — three tiers of feathers ─────────────────── */}
      <g>
        {/* Upper feather */}
        <polygon
          points="24,8 44,10 60,18 46,18 30,14"
          fill={gold}
          stroke={goldDeep}
          strokeWidth="0.5"
        />
        {/* Middle feather */}
        <polygon
          points="14,14 40,16 58,22 44,22 24,20"
          fill={gold}
          stroke={goldDeep}
          strokeWidth="0.5"
        />
        {/* Lower feather */}
        <polygon
          points="10,20 38,22 56,26 42,26 22,26"
          fill={gold}
          stroke={goldDeep}
          strokeWidth="0.5"
        />
        {/* Feather midlines for texture */}
        <line x1="30" y1="12" x2="52" y2="17" stroke={goldDeep} strokeWidth="0.6" opacity="0.6" />
        <line x1="22" y1="18" x2="50" y2="21" stroke={goldDeep} strokeWidth="0.6" opacity="0.6" />
        <line x1="18" y1="23" x2="46" y2="25" stroke={goldDeep} strokeWidth="0.6" opacity="0.6" />
      </g>

      {/* ── Right wing (mirror) ─────────────────────────────────── */}
      <g transform="translate(140 0) scale(-1 1)">
        <polygon
          points="24,8 44,10 60,18 46,18 30,14"
          fill={gold}
          stroke={goldDeep}
          strokeWidth="0.5"
        />
        <polygon
          points="14,14 40,16 58,22 44,22 24,20"
          fill={gold}
          stroke={goldDeep}
          strokeWidth="0.5"
        />
        <polygon
          points="10,20 38,22 56,26 42,26 22,26"
          fill={gold}
          stroke={goldDeep}
          strokeWidth="0.5"
        />
        <line x1="30" y1="12" x2="52" y2="17" stroke={goldDeep} strokeWidth="0.6" opacity="0.6" />
        <line x1="22" y1="18" x2="50" y2="21" stroke={goldDeep} strokeWidth="0.6" opacity="0.6" />
        <line x1="18" y1="23" x2="46" y2="25" stroke={goldDeep} strokeWidth="0.6" opacity="0.6" />
      </g>

      {/* ── Central sword pointing down ─────────────────────────── */}
      {/* Silver blade (down-pointing triangle body) */}
      <polygon points="66,18 74,18 74,38 70,42 66,38" fill="#e5e7eb" stroke="#4a4a52" strokeWidth="0.5" />
      {/* Blade highlight (left edge) */}
      <polygon points="66,18 68,18 68,38 67,40 66,38" fill="#f9fafb" />
      {/* Crossguard — gold horizontal bar */}
      <rect x="56" y="14" width="28" height="4" fill={gold} />
      <rect x="56" y="14" width="28" height="1" fill="#fff2a8" />
      <rect x="56" y="17" width="28" height="1" fill={goldDeep} />
      {/* Guard end caps (little cross-tips) */}
      <rect x="54" y="15" width="2" height="2" fill={gold} />
      <rect x="84" y="15" width="2" height="2" fill={gold} />
      {/* Handle grip */}
      <rect x="68" y="6" width="4" height="8" fill="#4a2a10" />
      <rect x="68" y="6" width="1" height="8" fill="#7a4a20" />
      {/* Blue gem in the crossguard center */}
      <rect x="68" y="15" width="4" height="2" fill="#5aa0ff" />
      <rect x="69" y="15" width="2" height="1" fill="#a8d0ff" />
      {/* Pommel (round cap on top) */}
      <rect x="66" y="2" width="8" height="4" fill={gold} />
      <rect x="66" y="2" width="8" height="1" fill="#fff2a8" />
      <rect x="66" y="5" width="8" height="1" fill={goldDeep} />
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
  // Pixel-gold subtitle matching the reference "BOSS DEFEATED" ribbon.
  const color = isWin ? "#e6b34b" : "#e07a6a";
  const shade = isWin ? "#7a4a0a" : "#5a1a0a";
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
        className="text-[11px] font-bold uppercase tracking-[0.32em] sm:text-[12px]"
        style={{
          fontFamily: "var(--font-pixel-display), monospace",
          color,
          textShadow: `0 1px 0 ${shade}, 0 2px 3px rgba(0,0,0,0.5)`,
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
  // Ornate gold-bordered container matching the reference frame.
  // 2px gold border with a subtle inner shadow that hints at pixel
  // bevel; the header label sits over the top border on a solid navy
  // chip flanked by tiny gold diamond studs.
  const gold = isWin ? "#e6b34b" : "#c85a4a";
  const goldDeep = isWin ? "#7a4a0a" : "#5a1a0a";
  return (
    <div className="relative mt-3">
      <div
        className="relative rounded-md px-3 pb-3 pt-4 sm:px-4 sm:pt-5"
        style={{
          border: `2px solid ${gold}`,
          background: "rgba(9,18,50,0.6)",
          boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.55)`,
        }}
      >
        {/* Header label ribbon — pixel-gold text on a solid navy chip
            with a tiny diamond stud on each side (matches reference
            "◆ ROUND REPLAY ◆" style badge). */}
        <div className="pointer-events-none absolute -top-[10px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 select-none">
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              transform: "rotate(45deg)",
              background: gold,
              display: "inline-block",
              boxShadow: `inset -1px -1px 0 ${goldDeep}`,
            }}
          />
          <span
            className="inline-block px-2 text-[11px] font-bold uppercase tracking-[0.36em] sm:text-[12px]"
            style={{
              fontFamily: "var(--font-pixel-display), monospace",
              color: gold,
              background: "#0d1a3d",
              textShadow: `0 1px 0 ${goldDeep}`,
            }}
          >
            {label}
          </span>
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              transform: "rotate(45deg)",
              background: gold,
              display: "inline-block",
              boxShadow: `inset -1px -1px 0 ${goldDeep}`,
            }}
          />
        </div>


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
  const borderColor = isWin
    ? "rgba(230,179,75,0.35)"
    : "rgba(239,68,68,0.35)";

  return (
    <div
      className="relative rounded-md border p-3"
      style={{
        borderColor,
        background: "rgba(9,18,50,0.7)",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.4)",
      }}
    >
      {/* Q label centered up top — ornate gold-outlined pill. */}
      <div className="mb-2 flex items-center justify-center">
        <span
          className="rounded-full border-2 px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest"
          style={{
            fontFamily: "var(--font-pixel-display), monospace",
            color: "#e6b34b",
            borderColor: "rgba(230,179,75,0.6)",
            background: "rgba(230,179,75,0.08)",
            textShadow: "0 1px 0 rgba(122,74,10,0.7)",
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
    // Slot-machine-style count-up. Uses requestAnimationFrame for
    // frame-perfect timing with an ease-out cubic curve so the
    // number starts fast and decelerates into the target — feels
    // way more celebratory than a linear rise, and gives the user
    // enough visible seconds to watch the score climb.
    //
    // Timing:
    //   START_DELAY_MS — panel is fully in view before counting begins
    //   TOTAL_DURATION_MS — how long the count itself takes
    // Duration scales gently with magnitude so huge awards don't
    // spend forever crawling from 0 → 300, but small ones still get
    // the full drama.
    const START_DELAY_MS = 350;
    const TOTAL_DURATION_MS = Math.max(
      1600,
      Math.min(3500, 1200 + target * 22),
    );
    setDisplay(0);
    setBurst(false);
    let rafId = 0;
    let startTs = 0;
    let cancelled = false;
    // Ease-out cubic: 1 - (1-t)^3
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (ts: number) => {
      if (cancelled) return;
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs;
      const raw = Math.min(1, elapsed / TOTAL_DURATION_MS);
      const eased = easeOut(raw);
      const shown = Math.min(target, Math.round(eased * target));
      setDisplay(shown);
      if (raw < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Spark burst on the exact reveal frame.
        setBurst(true);
        window.setTimeout(() => setBurst(false), 900);
      }
    };
    const startTimer = window.setTimeout(() => {
      rafId = requestAnimationFrame(tick);
    }, START_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [points, target, isPositive]);

  // Gold accent for wins, red for losses. Ornate hex XP badge with
  // gold outline + inner glow matching the reference's stat pill style.
  const accent = isPositive ? "#e6b34b" : "#f87171";
  const accentDeep = isPositive ? "#7a4a0a" : "#7f1d1d";

  return (
    <div className="relative flex items-center justify-center gap-4 py-2">
      {/* Ornate hex XP badge — gold outline, dark navy fill, gold XP label. */}
      {/* 64x72 -> 48x54 (2026-08-31). At the old size the hex crowded
          the +XP counter beside it and, on a phone, overhung the panel's
          inner border. The viewBox is unchanged so every polygon and the
          label scale together; only the rendered box shrinks. */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 48, height: 54 }}
      >
        <svg viewBox="0 0 64 72" width={48} height={54} aria-hidden>
          {/* Outer hex */}
          <polygon
            points="32,2 60,18 60,54 32,70 4,54 4,18"
            fill="#0d1a3d"
            stroke={accent}
            strokeWidth="2.5"
          />
          {/* Inner bevel line */}
          <polygon
            points="32,7 55,20 55,52 32,65 9,52 9,20"
            fill="none"
            stroke={accent}
            strokeOpacity="0.4"
            strokeWidth="1"
          />
          {/* XP text */}
          <text
            x="32"
            y="44"
            textAnchor="middle"
            fontSize="18"
            fontWeight="900"
            fill={accent}
            style={{
              fontFamily: "var(--font-pixel-display), monospace",
              letterSpacing: "0.08em",
            }}
          >
            XP
          </text>
        </svg>
      </div>

      {/* Counter with burst. Uses `key={display}` on the inner span
          so framer-motion mounts a fresh instance every tick — that
          gives us a tiny 1.02→1 scale pulse per number change even
          while the count is still climbing (looks alive during the
          rapid opening ticks). The outer `key={points}` still resets
          the whole component when a fresh round result comes in. */}
      <div className="relative">
        <motion.span
          key={`xp-outer-${points}`}
          className="relative inline-block text-3xl font-black tabular-nums sm:text-4xl"
          style={{
            fontFamily: "var(--font-pixel-display), monospace",
            color: isPositive ? "#e6b34b" : "#fca5a5",
            textShadow: isPositive
              ? "0 2px 0 #7a4a0a, 0 3px 6px rgba(0,0,0,0.55)"
              : "0 2px 0 #7f1d1d, 0 3px 6px rgba(0,0,0,0.55)",
          }}
          animate={
            burst
              ? {
                  scale: [1, 1.45, 1],
                }
              : { scale: 1 }
          }
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.span
            key={`xp-tick-${display}`}
            initial={{ scale: 1.05, opacity: 0.85 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.09, ease: "easeOut" }}
            style={{ display: "inline-block" }}
          >
            {isPositive ? `+${display}` : `${display}`}
          </motion.span>
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
      className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 uppercase transition-all hover:brightness-110"
      style={{
        fontFamily: "var(--font-pixel-display), monospace",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.24em",
        color: "#e6b34b",
        background: "#0d1a3d",
        border: "2px solid rgba(230,179,75,0.55)",
        boxShadow: "0 3px 0 rgba(0,0,0,0.45)",
        textShadow: "0 1px 0 rgba(122,74,10,0.7)",
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <svg
        aria-hidden
        width={12}
        height={12}
        viewBox="0 0 14 14"
        style={{ imageRendering: "pixelated" }}
      >
        <rect x="1" y="8" width="3" height="5" fill="#e6b34b" />
        <rect x="5.5" y="5" width="3" height="8" fill="#e6b34b" />
        <rect x="10" y="2" width="3" height="11" fill="#e6b34b" />
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
  // Ornate CONTINUE button matching the reference — gold-outlined
  // navy pill with pixel-gold "CONTINUE" text, flanked by chunky
  // right-pointing pixel arrow flourishes on each side.
  const gold = "#e6b34b";
  const goldDeep = "#7a4a0a";
  const outline = "#1a0a00";
  return (
    <div className="relative flex items-center gap-2">
      {highlight && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md"
          style={{
            boxShadow: `0 0 0 3px ${gold}, 0 0 22px 4px rgba(230,179,75,0.55)`,
          }}
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.05, 1] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <PixelArrowFlourish direction="left" color={gold} />
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-3 rounded-md px-7 py-2.5 uppercase transition-all hover:brightness-110"
        style={{
          fontFamily: "var(--font-pixel-display), monospace",
          fontSize: "14px",
          fontWeight: 900,
          letterSpacing: "0.28em",
          color: gold,
          background: "#0d1a3d",
          border: `2px solid ${gold}`,
          boxShadow: `0 4px 0 rgba(0,0,0,0.5), inset 0 0 0 1px ${outline}`,
          textShadow: `0 2px 0 ${goldDeep}, 0 3px 3px rgba(0,0,0,0.5)`,
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

// Chunky pixel arrow flourish flanking the CONTINUE button per the
// reference art. Two stacked chevrons + a small trailing bar.
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
      width={26}
      height={16}
      viewBox="0 0 26 16"
      style={{
        transform: direction === "right" ? undefined : "scaleX(-1)",
        imageRendering: "pixelated",
      }}
    >
      {/* Two right-pointing chevrons */}
      <polygon points="0,8 8,0 12,0 4,8 12,16 8,16" fill={color} />
      <polygon
        points="10,8 18,0 22,0 14,8 22,16 18,16"
        fill={color}
        opacity={0.75}
      />
      {/* Trailing bar to give the flourish a "sword tip" tail */}
      <rect x="22" y="7" width="4" height="2" fill={color} />
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
          className="pointer-events-none absolute inset-0 rounded"
          style={{ boxShadow: "0 0 0 2px #ef4444" }}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <button
        type="button"
        onClick={() => {
          console.log("[combat] Retry button clicked");
          onClick();
        }}
        className="inline-flex items-center gap-2 rounded px-6 py-2.5 uppercase transition-colors hover:brightness-110"
        style={{
          fontFamily: "var(--font-pixel-display), monospace",
          fontSize: "12px",
          letterSpacing: "0.24em",
          color: "#F9FAFB",
          background: "#ef4444",
          border: "1px solid #ef4444",
          boxShadow: "0 2px 0 rgba(0,0,0,0.35)",
        }}
      >
        Retry Combat
        <svg aria-hidden width={10} height={10} viewBox="0 0 12 12">
          <polygon points="2,1 11,6 2,11" fill="#F9FAFB" />
        </svg>
      </button>
    </div>
  );
}
