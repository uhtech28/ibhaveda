"use client";

/**
 * StageOverviewMinimap
 *
 * Bottom-right corner HUD showing all stages of the active venture at
 * a glance. Each stage is a tiny tile with a state-driven visual:
 *
 *   - cleared (gold)   — gold filled tile with a gold dot
 *   - cleared (silver) — silver filled tile
 *   - active           — pulsing indigo border
 *   - locked           — dim gray tile
 *
 * Hovering reveals the stage name + monster name in a tooltip.
 * Clicking dispatches FOCUS_STAGE to Phaser so the camera scrolls
 * to the chosen stage.
 *
 * Auto-collapses to a tiny chip on small screens — the player can
 * tap to expand. PRD § 15.1 HUD always-visible elements.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { eventBridge } from "@/lib/phaser/utils/event-bridge";
import { getStageMonster, type StageMonsterTemplate } from "@/config/stageMonsters";

export interface StageOverviewStageState {
  stage: number;
  name: string;
  /** 0..1 — fraction of checkpoints completed in the stage. */
  completion: number;
  /** True if the final checkpoint of this stage was 3/3 gold. */
  isGold: boolean;
  /** True if this stage is the player's current stage. */
  isActive: boolean;
  /** True if this stage is locked behind earlier stages. */
  isLocked: boolean;
}

interface StageOverviewMinimapProps {
  template: StageMonsterTemplate;
  stages: StageOverviewStageState[];
}

export function StageOverviewMinimap({
  template,
  stages,
}: StageOverviewMinimapProps) {
  const [expanded, setExpanded] = useState(true);
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  const tooltipText = useMemo(() => {
    if (hoveredStage == null) return null;
    const stage = stages.find((s) => s.stage === hoveredStage);
    if (!stage) return null;
    const monster = getStageMonster(template, stage.stage);
    return {
      title: `Stage ${stage.stage} — ${stage.name}`,
      monster: monster?.name ?? "???",
      pct: Math.round(stage.completion * 100),
    };
  }, [hoveredStage, stages, template]);

  const handleStageClick = (stage: StageOverviewStageState) => {
    if (stage.isLocked) return;
    eventBridge.dispatchToPhaser({
      type: "FOCUS_STAGE",
      stage: stage.stage,
    });
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-24 right-4 z-[60] flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#0A0D12]/90 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 backdrop-blur-xl shadow-lg hover:bg-white/5 hover:text-white"
        aria-label="Show stage overview"
      >
        🗺️
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed bottom-24 right-4 z-[60] hidden md:flex"
      style={{ contain: "layout paint" }}
    >
      <div className="relative flex flex-col items-end gap-2">
        {/* Tooltip — shows above tiles when hovering */}
        <AnimatePresence>
          {tooltipText && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none rounded-xl border border-white/10 bg-[#0A0D12]/95 px-3 py-2 text-right shadow-2xl backdrop-blur-xl"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
                {tooltipText.title}
              </div>
              <div className="mt-0.5 text-[11px] italic text-slate-300">
                vs {tooltipText.monster}
              </div>
              <div className="mt-1 text-[10px] font-mono text-amber-300">
                {tooltipText.pct}% cleared
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tile rail */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#0A0D12]/92 px-2.5 py-2 shadow-2xl backdrop-blur-xl">
          {/* Collapse handle */}
          <button
            onClick={() => setExpanded(false)}
            className="mr-1 flex h-6 w-6 items-center justify-center rounded-md text-[10px] text-white/30 hover:bg-white/5 hover:text-white"
            aria-label="Collapse stage overview"
          >
            ✕
          </button>

          {stages.map((stage) => (
            <StageTile
              key={stage.stage}
              stage={stage}
              onHover={() => setHoveredStage(stage.stage)}
              onLeave={() =>
                setHoveredStage((prev) =>
                  prev === stage.stage ? null : prev,
                )
              }
              onClick={() => handleStageClick(stage)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Internal: StageTile ────────────────────────────────────────────────────

interface StageTileProps {
  stage: StageOverviewStageState;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function StageTile({ stage, onHover, onLeave, onClick }: StageTileProps) {
  const isCompleted = stage.completion >= 1;
  return (
    <button
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      onClick={onClick}
      disabled={stage.isLocked}
      className={`relative flex h-9 w-9 items-center justify-center rounded-lg border text-[11px] font-black transition-all duration-200 ${
        stage.isActive
          ? "border-indigo-400/80 bg-indigo-500/15 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)] animate-[pulse_2s_infinite]"
          : stage.isLocked
            ? "border-white/5 bg-white/[0.025] text-slate-600 cursor-not-allowed"
            : isCompleted
              ? stage.isGold
                ? "border-amber-400/70 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
                : "border-slate-400/50 bg-slate-500/15 text-slate-200 hover:bg-slate-500/25"
              : "border-white/15 bg-white/[0.05] text-white/70 hover:bg-white/[0.1] hover:text-white"
      }`}
      title={`Stage ${stage.stage} — ${stage.name}`}
    >
      {stage.stage}
      {isCompleted && stage.isGold && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[7px] text-black">
          ★
        </span>
      )}
      {/* Completion arc — partial fill at the bottom */}
      {!stage.isLocked && !isCompleted && stage.completion > 0 && (
        <span
          className="absolute inset-x-0 bottom-0 rounded-b-lg bg-indigo-500/50"
          style={{ height: `${Math.round(stage.completion * 100)}%` }}
        />
      )}
    </button>
  );
}
