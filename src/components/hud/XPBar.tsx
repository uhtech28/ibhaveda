"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Shield, Skull } from "lucide-react";
import { useAtomValue } from "jotai";
import { activeVentureAtom, userProgressAtom, checkpointProgressAtom, corruptionStateAtom, currentQuestAtom } from "@/lib/stores/hudStore";

interface XPBarProps {
  currentXP: number;
  maxXP: number;
  compact?: boolean;
  bossHp?: number;
  bossBaseHp?: number;
  bossName?: string;
  /** User's display name / username shown on the left side of the
   *  compact HUD bar (matches the feed post card layout). Falls back
   *  to the venture / checkpoint name when omitted. */
  userName?: string;
}

function formatINR(value: number): string {
  if (value >= 10_000_000) {
    return `₹${(value / 10_000_000).toFixed(1).replace(/\.0$/, "")}Cr`;
  }
  if (value >= 100_000) {
    return `₹${(value / 100_000).toFixed(1).replace(/\.0$/, "")}L`;
  }
  if (value >= 1_000) {
    return `₹${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}


function getScoreColor(score: number) {
  // Cumulative score: 8 stages × 12 max = 96 total max.
  // Thresholds scaled accordingly: ≥48 (≥4/stage) = amber, ≥64 (≥8/stage) = cyan, ≥80 = emerald
  if (score >= 64) return { bar: "from-emerald-600 via-green-400 to-emerald-300", text: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]", glow: "rgba(52,211,153,0.6)" };
  if (score >= 48) return { bar: "from-cyan-700 via-cyan-500 to-cyan-300", text: "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]", glow: "rgba(34,211,238,0.6)" };
  if (score >= 24) return { bar: "from-amber-700 via-amber-500 to-amber-300", text: "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]", glow: "rgba(245,158,11,0.5)" };
  return { bar: "from-rose-800 via-rose-600 to-rose-400", text: "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]", glow: "rgba(244,63,94,0.4)" };
}

const XPBarComponent = ({
  currentXP,
  maxXP,
  compact = false,
  bossHp,
  bossBaseHp,
  bossName,
  userName,
}: XPBarProps) => {
  const percentage = Math.min((currentXP / maxXP) * 100, 100);
  const isNearlyFull = percentage >= 90;

  const activeVenture = useAtomValue(activeVentureAtom);
  const userProgress = useAtomValue(userProgressAtom);
  const checkpointProgress = useAtomValue(checkpointProgressAtom);
  const corruption = useAtomValue(corruptionStateAtom);
  // Current active checkpoint quest info — used to show the quest name
  // ("The Signboard", "The Bridge", etc.) in the HUD bar instead of the
  // venture's ambiguous "UNTITLED PROJECT" title.
  const currentQuest = useAtomValue(currentQuestAtom);

  const totalCP = checkpointProgress.total || 36;
  const completedCP = checkpointProgress.completed || 0;
  const venturePercentage = Math.min((completedCP / totalCP) * 100, 100);

  const hasBoss = bossHp !== undefined && bossBaseHp !== undefined && bossHp > 0;
  const bossPercentage = hasBoss ? Math.min((bossHp! / bossBaseHp!) * 100, 100) : 0;

  // HUD bar label: prefer the current quest / checkpoint name (from
  // PRD, e.g. "The Signboard") over the venture's raw title. Falls
  // back to venture name when no quest is active.
  const projectName =
    currentQuest?.checkpointName?.trim() ||
    activeVenture?.name ||
    "Your Project";
  const projectScore = userProgress.qualityScore ?? 0;
  const valuationScore = userProgress.valuationScore ?? 0;
  const scoreColors = getScoreColor(projectScore);

  // ─── COMPACT MODE WITH BOSS ACTIVE (VS COMBAT HUD) ─────────────────────────
  if (compact && hasBoss) {
    return (
      // CSS Grid layout with `minmax(0, 1fr) auto minmax(0, 1fr)` —
      // this is what actually forces truncate to bite. With plain
      // flex-1 the two columns still let their long text bleed past
      // their share into the VS badge and adjacent column (visible
      // as "INNOVATIVE FINTECH APPLICATIONFOG OF VAGUENESS" mash-up).
      // `minmax(0, 1fr)` establishes both a hard MIN-width of 0 AND a
      // flex share of 1fr, so truncate can shrink the text all the way
      // down to just the ellipsis if needed.
      <div className="relative grid items-stretch w-full min-w-0 select-none overflow-hidden rounded-xl animate-fade-in"
        style={{
          gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
          background: "linear-gradient(135deg, rgba(6,14,35,0.95) 0%, rgba(10,10,20,0.98) 50%, rgba(35,6,10,0.95) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 0 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Ambient glow layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-r from-cyan-500/8 to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-rose-500/8 to-transparent" />
        </div>

        {/* ── PROJECT SIDE ── */}
        <div className="min-w-0 overflow-hidden flex flex-col justify-center gap-1.5 px-3 py-2 relative">
          {/* Top: shield icon + project name.
              `min-w-0` on this inner flex row is what actually makes
              `truncate` kick in — without it the row expanded past
              its parent and pushed the project name across the VS
              divider into the boss name column (visible collision:
              "INNOVATIVE FINTECH APPLICATIONFOG OF VAGUENESS"). */}
          <div className="flex min-w-0 items-center gap-1.5">
            <Shield className="w-3 h-3 shrink-0 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
            <span
              className="text-[9.5px] font-black uppercase tracking-wider text-cyan-200 truncate leading-none drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
              title={projectName}
            >
              {projectName}
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative h-[5px] w-full overflow-hidden rounded-full"
            style={{ background: "rgba(0,0,0,0.7)", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8)" }}
          >
            {/* width: 100% + scaleX animation is compositor-only and
                doesn't trigger layout (and so doesn't count toward
                CLS). The old `width: 0 → X%` animation was a
                measurable CLS contributor on the bottom HUD. */}
            <motion.div
              className={`h-full w-full rounded-full bg-gradient-to-r ${scoreColors.bar} origin-left`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: venturePercentage / 100 }}
              transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
            />
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/3"
              animate={{ x: ["-100%", "350%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            />
            {/* Bar glow */}
            <div className="absolute inset-0 rounded-full"
              style={{ boxShadow: `0 0 6px ${scoreColors.glow}` }}
            />
          </div>

          {/* Value row */}
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Value:</span>
              <span className={`text-[10px] font-black font-mono leading-none ${scoreColors.text}`}>
                {formatINR(valuationScore)}
              </span>
            </div>
          </div>
        </div>

        {/* ── VS DIVIDER ── */}
        <div className="shrink-0 flex flex-col items-center justify-center px-2 py-2 gap-0.5 relative z-10">
          {/* Vertical lines */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(245,158,11,0.3), rgba(245,158,11,0.6), rgba(245,158,11,0.3), transparent)" }}
          />
          {/* VS badge */}
          <motion.div
            className="relative flex h-[16px] w-[16px] items-center justify-center rounded-full z-10"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #b45309 50%, #92400e 100%)",
              border: "1px solid rgba(253,230,138,0.8)",
              boxShadow: "0 0 8px rgba(245,158,11,0.7), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-[7.5px] font-black text-black italic tracking-tighter drop-shadow-none select-none leading-none">
              VS
            </span>
            {/* Outer ring pulse */}
            <motion.div
              className="absolute -inset-[2px] rounded-full pointer-events-none"
              style={{ border: "0.5px solid rgba(245,158,11,0.4)" }}
              animate={{ scale: [1, 1.3, 1.3], opacity: [0.8, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
          </motion.div>
        </div>

        {/* ── BOSS SIDE ── (grid column 3 — bounded by minmax(0, 1fr)
            above so `truncate` on the boss name actually clips it
            instead of bleeding into the VS badge column). */}
        <div className="min-w-0 overflow-hidden flex flex-col justify-center gap-1.5 px-3 py-2 relative">
          {/* Top: skull icon + boss name.
              Same `min-w-0` fix as the project side — otherwise the
              boss name would grow past its column and the two
              names would visually collide across the VS badge. */}
          <div className="flex min-w-0 items-center gap-1.5 flex-row-reverse">
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Skull className="w-3 h-3 shrink-0 text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
            </motion.div>
            <span
              className="text-[9.5px] font-black uppercase tracking-wider text-rose-200 truncate leading-none text-right drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              title={bossName || "BOSS"}
            >
              {bossName || "BOSS"}
            </span>
          </div>
          {/* Boss HP bar */}
          <div className="relative h-[5px] w-full overflow-hidden rounded-full"
            style={{ background: "rgba(0,0,0,0.7)", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8)" }}
          >
            <motion.div
              className="h-full w-full rounded-full bg-gradient-to-r from-rose-700 via-red-500 to-rose-300 origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: bossPercentage / 100 }}
              transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
            />
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent w-1/3"
              animate={{ x: ["-100%", "350%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 rounded-full"
              style={{ boxShadow: "0 0 6px rgba(244,63,94,0.5)" }}
            />
          </div>

          {/* HP info row */}
          <div className="flex items-center justify-end mt-0.5">
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">HP:</span>
              <span className="text-[10.5px] font-black font-mono leading-none text-rose-400 shrink-0">
                {Math.round(bossPercentage)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STANDARD COMPACT MODE (NO BOSS ACTIVE) ──────────────────────────────────
  // Rebuilt to match the venture bar rendered on feed post cards
  // (see idea-cards.tsx line 377+): user name + XP progress + stage
  // label on the left, central "VS" chip, boss name + HP + HP% on
  // the right.  Uses the same gradient background and glow strips.
  if (compact) {
    // LEFT — show the founder's username (matches feed post card
    // layout). Falls back to the checkpoint name / venture name when
    // no userName is passed so the bar still reads sensibly.
    const stageLabel =
      userName?.trim() ||
      currentQuest?.checkpointName?.trim() ||
      activeVenture?.name ||
      "Your Venture";
    // "1/8" style stage index from checkpointProgress; falls back to
    // the raw completed/total count when no explicit stage counter
    // is available yet.
    const stageIndex =
      currentQuest?.stage != null
        ? `${currentQuest.stage}/8`
        : totalCP > 0
          ? `${completedCP}/${totalCP}`
          : "1/8";
    // Boss chip on the right — use the props passed by the parent
    // (bossHp / bossBaseHp / bossName). When no active boss, show
    // the default stage-boss placeholder so the bar keeps its
    // three-column shape.
    const shownBossName = bossName || "Stage Boss";
    const shownBossPct = hasBoss ? Math.round(bossPercentage) : 100;
    return (
      // Same grid trick as the compact+boss variant above — three
      // strict columns (project | VS | boss placeholder). Prevents
      // long stage labels from bleeding across the VS chip.
      <div
        className="relative grid min-w-0 w-full items-stretch overflow-hidden rounded-xl border border-white/8 select-none"
        style={{
          gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
          background:
            "linear-gradient(135deg, rgba(6,14,35,0.95) 0%, rgba(10,10,20,0.98) 50%, rgba(35,6,10,0.95) 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Side glow strips */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-0 top-0 w-1/3 bg-gradient-to-r from-violet-500/10 to-transparent" />
          <div className="absolute bottom-0 right-0 top-0 w-1/3 bg-gradient-to-l from-rose-500/8 to-transparent" />
        </div>

        {/* LEFT — stage label + XP bar + progress */}
        <div className="relative min-w-0 overflow-hidden flex flex-col justify-center gap-1.5 px-3 py-2">
          <div className="inline-flex w-fit items-center gap-1.5">
            <Shield className="h-3 w-3 shrink-0 text-violet-300 drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]" />
            <span
              className="truncate text-[9.5px] font-black uppercase leading-none tracking-wider text-violet-100 drop-shadow-[0_0_8px_rgba(167,139,250,0.45)]"
              title={stageLabel}
            >
              {stageLabel}
            </span>
          </div>
          <div className="relative h-[5px] w-full overflow-hidden rounded-full bg-black/70 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
            <motion.div
              className="h-full origin-left rounded-full bg-gradient-to-r from-violet-700 via-fuchsia-500 to-violet-300"
              initial={{ width: 0 }}
              animate={{ width: `${venturePercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              animate={{ x: ["-100%", "350%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div className="flex min-w-0 items-baseline gap-1">
            <span className="truncate text-[8px] font-bold uppercase tracking-wider text-violet-300/90">
              {stageLabel}
            </span>
            <span className="shrink-0 font-mono text-[10px] font-black leading-none text-violet-300">
              ({stageIndex})
            </span>
          </div>
        </div>

        {/* CENTER — VS chip with vertical rule */}
        <div className="relative z-10 flex shrink-0 flex-col items-center justify-center px-2 py-2">
          <div
            className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2"
            style={{
              background:
                "linear-gradient(to bottom, transparent, rgba(245,158,11,0.3), rgba(245,158,11,0.65), rgba(245,158,11,0.3), transparent)",
            }}
          />
          <motion.div
            className="relative z-10 grid h-5 w-5 place-items-center rounded-full bg-[#FACC15] text-[#0A0D12] shadow-[0_0_8px_rgba(250,204,21,0.45)]"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="select-none text-[7px] font-black leading-none">VS</span>
          </motion.div>
        </div>

        {/* RIGHT — boss name + HP bar + HP% (grid column 3) */}
        <div className="relative min-w-0 overflow-hidden flex flex-col justify-center gap-1.5 px-3 py-2">
          <div className="flex min-w-0 flex-row-reverse items-center gap-1.5">
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Skull className="h-3 w-3 shrink-0 text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
            </motion.div>
            <span
              className="truncate text-right text-[9.5px] font-black uppercase leading-none tracking-wider text-rose-200 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              title={shownBossName}
            >
              {shownBossName}
            </span>
          </div>
          <div className="relative h-[5px] w-full overflow-hidden rounded-full bg-black/70 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
            <motion.div
              className="h-full origin-left rounded-full bg-gradient-to-r from-rose-700 via-red-500 to-rose-300"
              initial={{ width: 0 }}
              animate={{ width: `${shownBossPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "350%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">HP:</span>
            <span className="font-mono text-[10.5px] font-black leading-none text-rose-400">
              {shownBossPct}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── STANDARD WIDE VS BATTLEROYALE BAR (NON-COMPACT COMBAT SCREEN) ─────────
  if (!compact && hasBoss) {
    return (
      <div className="flex flex-col gap-4 font-sans w-full max-w-[500px] rounded-2xl overflow-hidden relative select-none"
        style={{
          background: "linear-gradient(135deg, rgba(6,14,35,0.97) 0%, rgba(8,8,18,0.99) 50%, rgba(35,6,10,0.97) 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 0 50px rgba(0,0,0,0.8), 0 0 100px rgba(0,0,0,0.4)",
          padding: "20px",
        }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-0 bottom-0 w-2/5 bg-gradient-to-r from-cyan-500/6 to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 w-2/5 bg-gradient-to-l from-rose-500/6 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <div className="flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-200 truncate max-w-[140px]" title={projectName}>
                {projectName}
              </span>
            </div>
          </div>
          <div className="text-[8px] text-white/25 font-mono uppercase tracking-widest">COMBAT</div>
          <div className="flex items-center gap-2 flex-row-reverse">
            <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
              <Skull className="h-4 w-4 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            </motion.div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-200 truncate max-w-[140px]">
                {bossName || "BOSS"}
              </span>
              <span className="text-[8px] font-bold text-rose-400">
                HP {Math.round(bossPercentage)}%
              </span>
            </div>
          </div>
        </div>

        {/* Bars + VS */}
        <div className="flex items-center gap-3 relative z-10">
          {/* Project bar */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="relative h-6 w-full overflow-hidden rounded-lg"
              style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(34,211,238,0.15)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.6)" }}
            >
              <motion.div
                className={`h-full rounded-lg bg-gradient-to-r ${scoreColors.bar} relative overflow-hidden`}
                initial={{ width: 0 }}
                animate={{ width: `${venturePercentage}%` }}
                transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
              </motion.div>
              <div className="absolute inset-0 rounded-lg" style={{ boxShadow: `inset 0 0 12px ${scoreColors.glow}30` }} />
            </div>
            <div className="flex justify-end text-[9px] font-bold font-mono">
              <span className="text-white/40">Valuation: <span className={scoreColors.text}>{formatINR(valuationScore)}</span></span>
            </div>
          </div>

          {/* VS Badge */}
          <motion.div
            className="shrink-0 relative flex h-12 w-12 items-center justify-center rounded-full z-10"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #b45309 60%, #78350f 100%)",
              border: "2px solid rgba(253,230,138,0.9)",
              boxShadow: "0 0 25px rgba(245,158,11,0.8), 0 0 50px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-[14px] font-black text-black italic tracking-tighter select-none drop-shadow-sm">VS</span>
            <motion.div
              className="absolute -inset-[4px] rounded-full pointer-events-none"
              style={{ border: "1px solid rgba(245,158,11,0.5)" }}
              animate={{ scale: [1, 1.6, 1.6], opacity: [0.8, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
          </motion.div>

          {/* Boss bar */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="relative h-6 w-full overflow-hidden rounded-lg"
              style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(244,63,94,0.15)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.6)" }}
            >
              <div className="absolute inset-0 flex justify-end">
                <motion.div
                  className="h-full rounded-lg bg-gradient-to-l from-rose-700 via-red-500 to-rose-300 relative overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: `${bossPercentage}%` }}
                  transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
                </motion.div>
              </div>
              <div className="absolute inset-0 rounded-lg" style={{ boxShadow: "inset 0 0 12px rgba(244,63,94,0.15)" }} />
            </div>
            <div className="flex justify-between text-[9px] font-bold font-mono">
              <span className="text-white/40">{bossHp} / {bossBaseHp} pts</span>
              <span className="text-rose-300">HP: {Math.round(bossPercentage)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STANDARD EXPANDED MODE (NO BOSS) ────────────────────────────────────
  return (
    <div className="flex items-center gap-2.5 font-sans group">
      <div
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-md transition-transform group-hover:scale-105 ${
          isNearlyFull
            ? "border-emerald-400/50 bg-zinc-900/60 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            : "border-white/10 bg-zinc-900/40 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        }`}
      >
        <Zap
          className={`h-4 w-4 ${isNearlyFull ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]" : "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]"}`}
          fill="currentColor"
        />
        <div className={`absolute inset-0 rounded-xl pointer-events-none ${isNearlyFull ? "bg-gradient-to-br from-emerald-500/20 to-transparent" : "bg-gradient-to-br from-cyan-500/10 to-transparent"}`} />
        {isNearlyFull && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-emerald-400/40 pointer-events-none"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black leading-none">Progression</span>
            <span className="text-[10px] text-cyan-400/80 font-bold tabular-nums">{Math.round(percentage)}%</span>
          </div>

          <div
            className={`relative flex h-3 w-28 items-center overflow-hidden rounded-full border p-[1px] backdrop-blur-sm sm:w-36 lg:w-40 ${
              isNearlyFull
                ? "border-emerald-400/30 bg-black/50 shadow-[inset_0_1px_4px_rgba(255,255,255,0.05),0_0_15px_rgba(16,185,129,0.3)]"
                : "border-white/5 bg-black/40 shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)]"
            }`}
          >
            <motion.div
              className="h-full rounded-full relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className={`absolute inset-0 ${isNearlyFull ? "bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-400" : "bg-gradient-to-r from-cyan-600 via-indigo-500 to-cyan-400"}`} />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-x-0 top-0 h-[1px] bg-white/20 rounded-full" />
            </motion.div>

            {isNearlyFull && (
              <motion.div
                className="absolute inset-0 bg-emerald-400/25 pointer-events-none rounded-full"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-1 hidden min-w-[62px] flex-col items-end sm:flex">
        <div className="text-[12px] font-black tracking-tight text-white tabular-nums leading-none">{currentXP.toLocaleString()}</div>
        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter mt-1">/ {maxXP.toLocaleString()} Score</div>
      </div>
    </div>
  );
};

export const XPBar = React.memo(XPBarComponent);
