"use client";

/**
 * QualityScoreCard
 *
 * PRD § 8.2 — AI Scoring Criteria visual breakdown. After the AI
 * scores a task submission, render the 4 dimensions (Completeness,
 * Specificity, Evidence, Originality) each on a 0-3 scale, plus the
 * total 0-12 score and its tier classification (Low/Standard/High).
 *
 * Used in the TaskSubmissionModal and the CheckpointPanel evidence
 * summary. Self-contained — pass the 4 dimension scores and let the
 * card compute the tier and animate the bars in.
 *
 * Bars animate via scaleX (compositor-only, no CLS impact).
 */

import { motion } from "framer-motion";
import { useMemo } from "react";

export type QualityTier = "low" | "standard" | "high";

export interface QualityScoreCardProps {
  /** Completeness: does the submission address what the task asked for? */
  completeness: number;
  /** Specificity: are claims concrete and grounded, or vague? */
  specificity: number;
  /** Evidence: is the reasoning or finding supported by real data/sources? */
  evidence: number;
  /** Originality: does the submission add something beyond task minimum? */
  originality: number;
  /** Optional title — defaults to "AI Quality Assessment". */
  title?: string;
  /** Tighter/looser visual rhythm. Default "regular". */
  size?: "compact" | "regular";
}

interface Dimension {
  label: string;
  score: number;
  copy: Record<number, string>;
}

const COMPLETENESS_COPY = {
  0: "Missing — the brief was not addressed",
  1: "Partial — pieces present but incomplete",
  2: "Adequate — the brief is covered",
  3: "Thorough — every angle addressed",
} as const;

const SPECIFICITY_COPY = {
  0: "Vague — claims have no edges",
  1: "General — broad strokes only",
  2: "Specific — claims are concrete",
  3: "Highly specific — every claim has detail",
} as const;

const EVIDENCE_COPY = {
  0: "None — claims float without support",
  1: "Weak — anecdotal or thin",
  2: "Adequate — claims are supported",
  3: "Strong — claims rest on real data",
} as const;

const ORIGINALITY_COPY = {
  0: "None — restates the task",
  1: "Minor — small original insight",
  2: "Notable — adds clear value",
  3: "Exceptional — a real contribution",
} as const;

function clampDim(value: number): number {
  return Math.max(0, Math.min(3, Math.round(value)));
}

function tierForTotal(total: number): QualityTier {
  if (total <= 4) return "low";
  if (total <= 8) return "standard";
  return "high";
}

const TIER_LABEL: Record<QualityTier, string> = {
  low: "LOW",
  standard: "STANDARD",
  high: "HIGH",
};

const TIER_COLOR: Record<QualityTier, { fg: string; bg: string; ring: string }> = {
  low:      { fg: "#fca5a5", bg: "rgba(220, 38, 38, 0.12)",  ring: "rgba(220, 38, 38, 0.5)" },
  standard: { fg: "#fde68a", bg: "rgba(251, 191, 36, 0.12)", ring: "rgba(251, 191, 36, 0.5)" },
  high:     { fg: "#86efac", bg: "rgba(34, 197, 94, 0.12)",  ring: "rgba(34, 197, 94, 0.5)" },
};

export function QualityScoreCard({
  completeness,
  specificity,
  evidence,
  originality,
  title = "AI Quality Assessment",
  size = "regular",
}: QualityScoreCardProps) {
  const dimensions: Dimension[] = useMemo(
    () => [
      { label: "Completeness", score: clampDim(completeness), copy: COMPLETENESS_COPY },
      { label: "Specificity",  score: clampDim(specificity),  copy: SPECIFICITY_COPY },
      { label: "Evidence",     score: clampDim(evidence),     copy: EVIDENCE_COPY },
      { label: "Originality",  score: clampDim(originality),  copy: ORIGINALITY_COPY },
    ],
    [completeness, specificity, evidence, originality],
  );

  const total = useMemo(
    () => dimensions.reduce((sum, d) => sum + d.score, 0),
    [dimensions],
  );
  const tier = useMemo(() => tierForTotal(total), [total]);
  const tierStyle = TIER_COLOR[tier];

  const compact = size === "compact";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`relative w-full rounded-2xl border border-white/10 bg-[#0A0D12]/95 backdrop-blur-xl shadow-xl overflow-hidden ${
        compact ? "p-3 sm:p-4" : "p-4 sm:p-6"
      }`}
      style={{ contain: "layout style" }}
    >
      {/* Subtle tier-color glow ring */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ boxShadow: `inset 0 0 0 1px ${tierStyle.ring}` }}
      />

      <div className="flex items-center justify-between mb-3">
        <h3
          className={`font-black uppercase tracking-[0.25em] text-white/70 ${
            compact ? "text-[10px]" : "text-[11px] sm:text-xs"
          }`}
        >
          {title}
        </h3>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3, type: "spring", stiffness: 220 }}
          className={`flex items-center gap-2 rounded-full px-3 py-1 font-black uppercase tracking-[0.2em] ${
            compact ? "text-[10px]" : "text-[11px]"
          }`}
          style={{
            color: tierStyle.fg,
            background: tierStyle.bg,
            border: `1px solid ${tierStyle.ring}`,
          }}
        >
          <span>{TIER_LABEL[tier]}</span>
          <span className="font-mono text-white/70">·</span>
          <span className="font-mono text-white/90">{total}/12</span>
        </motion.div>
      </div>

      <div className="space-y-3">
        {dimensions.map((dim, idx) => (
          <DimensionRow key={dim.label} dim={dim} delay={0.15 + idx * 0.08} compact={compact} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Internal: DimensionRow ────────────────────────────────────────────────

interface DimensionRowProps {
  dim: Dimension;
  delay: number;
  compact: boolean;
}

function DimensionRow({ dim, delay, compact }: DimensionRowProps) {
  const fraction = dim.score / 3;
  const copy = dim.copy[dim.score] ?? "";

  return (
    <div>
      <div className={`flex items-baseline justify-between ${compact ? "mb-1" : "mb-1.5"}`}>
        <span
          className={`font-black uppercase tracking-[0.18em] text-white/80 ${
            compact ? "text-[10px]" : "text-[11px]"
          }`}
        >
          {dim.label}
        </span>
        <span
          className={`font-mono text-white/60 ${
            compact ? "text-[10px]" : "text-[11px]"
          }`}
        >
          {dim.score} / 3
        </span>
      </div>
      <div
        className={`relative w-full overflow-hidden rounded-full bg-white/[0.05] ${
          compact ? "h-1.5" : "h-2"
        }`}
      >
        <motion.div
          className="absolute inset-y-0 left-0 origin-left rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-300"
          style={{ width: "100%" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: fraction }}
          transition={{ duration: 0.65, delay, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>
      <p
        className={`mt-1.5 italic text-white/50 ${
          compact ? "text-[10px]" : "text-[11px] sm:text-xs"
        }`}
      >
        {copy}
      </p>
    </div>
  );
}
