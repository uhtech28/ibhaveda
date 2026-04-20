"use client";

/**
 * src/app/map/page.tsx
 *
 * Interactive Ideas — Venture World Map
 * React overlay layer + Phaser canvas integration
 *
 * Stack: Next.js 15 · React 19 · Framer Motion 12 · Tailwind CSS 4 · Convex · Clerk
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useAtom, useSetAtom } from "jotai";
import { audioManager } from "@/lib/audio/audioManager";
import type { CheckpointSFXId } from "@/lib/audio/audioManager";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { eventBridge } from "@/lib/phaser/utils/event-bridge";
import type { CheckpointState } from "@/lib/phaser/utils/event-bridge";
import { HUD } from "@/components/hud/HUD";
import { LevelUpSequence } from "@/components/animations/LevelUpSequence";
import { BadgeAwardSequence } from "@/components/animations/BadgeAwardSequence";
import { IntroScreen } from "@/components/map/IntroScreen";
import {
  activeVentureAtom,
  userProgressAtom,
  stageInfoAtom,
  checkpointProgressAtom,
  audioSettingsAtom,
} from "@/lib/stores/hudStore";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type CheckpointStatus = "locked" | "active" | "partial" | "completed" | "gold";

interface Task {
  label: string;
  description: string;
  tool: string;
  difficulty: "easy" | "medium" | "stretch";
  done: boolean;
}

interface CheckpointDetail {
  id: string;
  stage: number;
  stageIdx: number;
  stageName: string;
  biome: string;
  stageGlow: string;
  checkpointIndex: number;
  title: string;
  outcome: string;
  status: CheckpointStatus;
  tasks: Task[];
}

interface Stage {
  id: number;
  name: string;
  biome: string;
  mini: string;
  glow: string;
  checkpoints: number;
  icon: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STAGES: Stage[] = [
  {
    id: 1,
    name: "Ideation",
    biome: "The Village",
    mini: "Fog of Vagueness",
    glow: "#818cf8", // Indigo 400
    checkpoints: 4,
    icon: "💡",
  },
  {
    id: 2,
    name: "Research",
    biome: "The Forest",
    mini: "Pathwarden Wraith",
    glow: "#a78bfa", // Violet 400
    checkpoints: 5,
    icon: "🔬",
  },
  {
    id: 3,
    name: "Validation",
    biome: "The Arena",
    mini: "Advocate of Comfortable Lies",
    glow: "#6366f1", // Indigo 500
    checkpoints: 4,
    icon: "⚔️",
  },
  {
    id: 4,
    name: "Offer Design",
    biome: "Artisan's Quarter",
    mini: "Unfinished Golem",
    glow: "#8b5cf6", // Violet 500
    checkpoints: 5,
    icon: "🎨",
  },
  {
    id: 5,
    name: "Build & Deliver",
    biome: "The Mine",
    mini: "Collapse Specter",
    glow: "#a855f7", // Purple 500
    checkpoints: 6,
    icon: "⚙️",
  },
  {
    id: 6,
    name: "Launch",
    biome: "The Harbour",
    mini: "Harbourmaster of Hesitation",
    glow: "#4f46e5", // Indigo 600
    checkpoints: 3,
    icon: "🚀",
  },
  {
    id: 7,
    name: "Iteration",
    biome: "Crossroads Town",
    mini: "Babel Merchant",
    glow: "#7c3aed", // Violet 600
    checkpoints: 4,
    icon: "🔄",
  },
  {
    id: 8,
    name: "Scale",
    biome: "The Capital",
    mini: "Iron Bureaucrat",
    glow: "#9333ea", // Purple 600
    checkpoints: 5,
    icon: "👑",
  },
];

const TOTAL_CHECKPOINTS = STAGES.reduce((s, st) => s + st.checkpoints, 0); // 36

const STAGE_ANIMATION: Record<number, string> = {
  1: "Seal Break",
  2: "Rune Inscription",
  3: "Beacon Lighting",
  4: "Bridge Repair",
  5: "Compass Calibration",
  6: "Ward Placement",
  7: "Beacon Lighting",
  8: "Seal Break",
};

/** Map stage animation name + variant to a CheckpointSFXId */
const ANIMATION_TO_SFX: Record<string, CheckpointSFXId> = {
  "Seal Break_standard": "seal_break_standard",
  "Seal Break_gold": "seal_break_gold",
  "Rune Inscription_standard": "rune_inscription_standard",
  "Rune Inscription_gold": "rune_inscription_gold",
  "Beacon Lighting_standard": "beacon_lighting_standard",
  "Beacon Lighting_gold": "beacon_lighting_gold",
  "Bridge Repair_standard": "bridge_repair_standard",
  "Bridge Repair_gold": "bridge_repair_gold",
  "Compass Calibration_standard": "compass_calibration_standard",
  "Compass Calibration_gold": "compass_calibration_gold",
  "Ward Placement_standard": "ward_placement_standard",
  "Ward Placement_gold": "ward_placement_gold",
};

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — Phaser game lifecycle
// ─────────────────────────────────────────────────────────────────────────────

function useMapGame() {
  const gameRef = useRef<import("phaser").Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [phaserReady, setPhaserReady] = useState(false);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const handleReady = () => setPhaserReady(true);
    const handleFPS = (e: { fps: number }) => setFps(e.fps);

    eventBridge.onReact("PHASER_READY", handleReady);
    eventBridge.onReact("FPS_UPDATE", handleFPS);

    import("phaser").then((Phaser) =>
      import("@/lib/phaser/game-config").then(({ createGameConfig }) => {
        if (!containerRef.current) return;
        const game = new Phaser.Game(createGameConfig(containerRef.current));
        gameRef.current = game;
      }),
    );

    return () => {
      eventBridge.off("PHASER_READY", handleReady);
      eventBridge.off("FPS_UPDATE", handleFPS);
      gameRef.current?.destroy(true);
      gameRef.current = null;
      setPhaserReady(false);
    };
  }, []);

  return { containerRef, phaserReady, fps };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — derive checkpoint status from Convex row
// ─────────────────────────────────────────────────────────────────────────────

function deriveCheckpointStatus(
  cp: {
    stage: number;
    checkpoint: number;
    status: string;
    t1Completed: boolean;
    t2Completed: boolean;
    t3Completed: boolean;
    goldBonusEarned?: boolean;
  },
  currentStage: number,
  currentCheckpoint: number,
): CheckpointStatus {
  if (cp.t1Completed && cp.t2Completed && cp.t3Completed) return "gold";
  if (cp.status === "completed") return "completed";
  if (cp.stage < currentStage) return "completed";
  if (cp.stage === currentStage && cp.checkpoint < currentCheckpoint)
    return "completed";
  if (
    cp.stage === currentStage &&
    cp.checkpoint === currentCheckpoint &&
    (cp.t1Completed || cp.t2Completed || cp.t3Completed)
  )
    return "partial";
  if (cp.stage === currentStage && cp.checkpoint === currentCheckpoint)
    return "active";
  return "locked";
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Stage pill navigation strip */
function StageStrip({
  activeStage,
  onSelect,
}: {
  activeStage: number;
  onSelect: (stage: number) => void;
}) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 backdrop-blur-md bg-[#0a0d14]/60 p-2 rounded-full border border-white/5 shadow-[0_0_20px_rgba(30,20,50,0.5)]"
    >
      {STAGES.map((st, i) => {
        const isDone = i + 1 < activeStage;
        const isCurrent = i + 1 === activeStage;
        return (
          <motion.button
            key={st.id}
            onClick={() => onSelect(st.id)}
            whileHover={{ scaleY: 1.6, scaleX: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
            title={st.name}
          >
            <motion.div
              className="h-[8px] rounded-full"
              style={{
                width: isCurrent ? "48px" : "28px",
                background: isDone
                  ? "#4f46e5"
                  : isCurrent
                    ? st.glow
                    : "rgba(255,255,255,0.05)",
                border: `1px solid ${
                  isDone
                    ? "#6366f1"
                    : isCurrent
                      ? st.glow
                      : "rgba(255,255,255,0.1)"
                }`,
                boxShadow: isCurrent ? `0 0 15px ${st.glow}` : "none",
                transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease",
              }}
            />
            <span
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap text-[10px] tracking-[0.15em] font-semibold uppercase px-3 py-1.5 rounded-lg pointer-events-none shadow-lg backdrop-blur-xl"
              style={{
                fontFamily: "var(--font-sans)",
                color: "#e2e8f0",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
              }}
            >
              {st.name}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

/** Checkpoint detail slide-in panel */
function CheckpointPanel({
  detail,
  onClose,
  onAdvance,
  onTaskToggle,
}: {
  detail: CheckpointDetail | null;
  onClose: () => void;
  onAdvance: () => void;
  onTaskToggle: (taskIdx: number) => void;
}) {
  if (!detail) return null;

  const doneTasks = detail.tasks.filter((t) => t.done).length;
  const canAdvance = doneTasks >= 2;
  const isGold = doneTasks >= 3;
  const isLocked = detail.status === "locked";

  return (
    <AnimatePresence>
      <motion.div
        key="cp-panel"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="absolute right-0 top-0 bottom-0 z-30 flex flex-col font-sans"
        style={{
          width: "360px",
          background:
            "linear-gradient(180deg, rgba(11, 15, 25, 0.85), rgba(7, 10, 18, 0.95))",
          backdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "-10px 0 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[14px] transition-all duration-200 bg-white/5 hover:bg-white/10"
          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
            (e.currentTarget as HTMLElement).style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLElement).style.color = "#cbd5e1";
          }}
        >
          ✕
        </button>

        <div className="flex flex-col gap-3.5 p-5 flex-1 overflow-y-auto">
          {/* Stage label */}
          <div>
            <p
              className="text-[10px] tracking-[0.2em] font-bold uppercase mb-1.5"
              style={{ color: detail.stageGlow }}
            >
              Stage {detail.stage} · {detail.stageName}
            </p>
            <h2
              className="text-xl font-bold tracking-tight leading-tight text-white mb-2"
            >
              {detail.title}
            </h2>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 mb-1">
            <StatusDot status={detail.status} />
            <span
              className="text-[11px] font-semibold tracking-wider uppercase"
              style={{ color: "#94a3b8" }}
            >
              {detail.status === "completed"
                ? "Completed"
                : detail.status === "gold"
                  ? "Gold"
                  : detail.status === "active"
                    ? "Active"
                    : detail.status === "partial"
                      ? "In Progress"
                      : "Locked"}
            </span>
          </div>

          {/* Outcome */}
          <div
            className="text-[13px] leading-relaxed font-medium px-4 py-3 rounded-xl backdrop-blur-md"
            style={{
              color: "#cbd5e1",
              borderLeft: `3px solid ${detail.stageGlow}`,
              background: "linear-gradient(90deg, rgba(255,255,255,0.05), transparent)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {detail.outcome}
          </div>

          {/* Tasks */}
          <div className="flex flex-col gap-2">
            {detail.tasks.map((task, i) => (
              <TaskCard
                key={i}
                task={task}
                index={i}
                locked={isLocked}
                onToggle={() => onTaskToggle(i)}
              />
            ))}
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-2 px-1 mt-2">
            {detail.tasks.map((t, i) => (
              <div
                key={i}
                className="h-2 flex-1 rounded-full transition-all duration-300 relative overflow-hidden bg-white/5"
              >
                 <motion.div
                   className="absolute inset-y-0 left-0"
                   initial={{ width: 0 }}
                   animate={{ width: t.done ? "100%" : "0%" }}
                   style={{
                     background: i === 2 ? "#eab308" : "#818cf8",
                     boxShadow: t.done ? `0 0 10px ${i === 2 ? "#eab308" : "#818cf8"}` : "none",
                   }}
                 />
              </div>
            ))}
          </div>
          <p
            className="text-[11px] font-medium tracking-wide text-slate-400"
          >
            {doneTasks}/3 tasks ·{" "}
            {2 - doneTasks > 0 && !canAdvance
              ? `${2 - doneTasks} more to advance`
              : canAdvance
                ? "Ready to advance"
                : ""}
          </p>

          {/* Crossing animation label */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] mt-auto"
          >
            <span
              className="text-[10px] tracking-[0.15em] font-semibold uppercase text-slate-500"
            >
              Crossing:
            </span>
            <span
              className="text-[11px] font-bold tracking-wide"
              style={{ color: detail.stageGlow }}
            >
              {STAGE_ANIMATION[detail.stage]}
            </span>
          </div>
        </div>

        {/* Advance button */}
        {!isLocked &&
          detail.status !== "completed" &&
          detail.status !== "gold" && (
            <div className="p-4 pt-0">
              <motion.button
                onClick={onAdvance}
                disabled={!canAdvance}
                whileHover={canAdvance ? { scale: 1.02, y: -2 } : {}}
                whileTap={canAdvance ? { scale: 0.98 } : {}}
                className="w-full py-3.5 rounded-xl text-[12px] tracking-[0.1em] uppercase font-black transition-all duration-300 relative overflow-hidden"
                style={{
                  background: isGold
                    ? "linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(202, 138, 4, 0.1))"
                    : canAdvance
                      ? "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.1))"
                      : "rgba(255, 255, 255, 0.03)",
                  border: isGold
                    ? "1px solid rgba(234, 179, 8, 0.4)"
                    : canAdvance
                      ? "1px solid rgba(99, 102, 241, 0.4)"
                      : "1px solid rgba(255, 255, 255, 0.1)",
                  color: isGold ? "#fde047" : canAdvance ? "#818cf8" : "#64748b",
                  cursor: canAdvance ? "pointer" : "not-allowed",
                  boxShadow: isGold ? "0 4px 20px rgba(234, 179, 8, 0.15)" : canAdvance ? "0 4px 20px rgba(99, 102, 241, 0.15)" : "none",
                }}
              >
                {canAdvance && (
                   <motion.div
                     className="absolute inset-0 bg-white/10"
                     initial={{ x: "-100%" }}
                     whileHover={{ x: "100%" }}
                     transition={{ duration: 0.5, ease: "easeInOut" }}
                   />
                )}
                <span className="relative z-10">
                  {isGold
                    ? "⭐  Gold Checkpoint — Advance"
                    : canAdvance
                      ? "Advance Checkpoint →"
                      : `Complete ${2 - doneTasks} more task${2 - doneTasks !== 1 ? "s" : ""} to advance`}
                </span>
              </motion.button>
            </div>
          )}
      </motion.div>
    </AnimatePresence>
  );
}

function StatusDot({ status }: { status: CheckpointStatus }) {
  const colors: Record<CheckpointStatus, string> = {
    locked: "#475569",
    active: "#6366f1",
    partial: "#a855f7",
    completed: "#818cf8",
    gold: "#eab308",
  };
  const glow: Record<CheckpointStatus, string | undefined> = {
    locked: undefined,
    active: "#818cf8",
    partial: "#c084fc",
    completed: "#a5b4fc",
    gold: "#fde047",
  };
  return (
    <motion.div
      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{
        background: colors[status],
        boxShadow: glow[status] ? `0 0 6px ${glow[status]}` : "none",
      }}
      animate={status === "active" ? { opacity: [1, 0.3, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
}

function TaskCard({
  task,
  locked,
  onToggle,
}: {
  task: Task;
  index?: number;
  locked: boolean;
  onToggle: () => void;
}) {
  const accentColor =
    task.difficulty === "stretch"
      ? "#eab308" // Yellow 500
      : task.difficulty === "medium"
        ? "#a855f7" // Purple 500
        : "#6366f1"; // Indigo 500

  return (
    <motion.div
      onClick={locked ? undefined : onToggle}
      whileHover={locked ? {} : { x: 4 }}
      whileTap={locked ? {} : { scale: 0.98 }}
      className="flex items-start gap-3.5 px-4 py-3 rounded-xl relative overflow-hidden cursor-pointer group/task transition-colors"
      style={{
        background: task.done
          ? "rgba(99, 102, 241, 0.05)"
          : "rgba(255, 255, 255, 0.02)",
        border: "1px solid",
        borderColor: task.done ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.05)",
        cursor: locked ? "default" : "pointer",
        opacity: task.done ? 0.6 : 1,
      }}
    >
      {/* Hover glow */}
      {!locked && !task.done && (
         <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover/task:opacity-100 transition-opacity" />
      )}
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-xl"
        style={{ background: task.done ? "#818cf8" : accentColor }}
      />

      {/* Check circle */}
      <motion.div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-bold"
        style={{
          background: task.done ? "#6366f1" : "rgba(255,255,255,0.05)",
          border: `1.5px solid ${task.done ? "#6366f1" : "rgba(255,255,255,0.15)"}`,
          color: task.done ? "#ffffff" : "transparent",
        }}
        animate={task.done ? { scale: [1.2, 1] } : {}}
        transition={{ duration: 0.2 }}
      >
        {task.done && "✓"}
      </motion.div>

      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[10px] tracking-[0.1em] font-bold uppercase"
            style={{ color: accentColor }}
          >
            {task.label}
          </span>
        </div>
        <p
          className="text-[13px] leading-relaxed text-slate-300 font-medium"
        >
          {task.description}
        </p>
        <p
          className="text-[10px] tracking-[0.1em] mt-2 font-semibold uppercase text-slate-500"
        >
          {task.tool}
        </p>
      </div>
    </motion.div>
  );
}

/** Gold flash overlay on checkpoint advance */
function CrossingFlash({ trigger }: { trigger: number }) {
  return (
    <AnimatePresence>
      {trigger > 0 && (
        <motion.div
          key={trigger}
          className="absolute inset-0 z-50 pointer-events-none"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ background: "rgba(99, 102, 241, 0.15)" }}
        />
      )}
    </AnimatePresence>
  );
}

/** Audio mute toggle */
function AudioToggle({
  muted,
  onToggle,
}: {
  muted: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1 }}
      onClick={onToggle}
      className="absolute bottom-12 right-5 z-20 w-10 h-10 rounded-full flex items-center justify-center text-[16px] backdrop-blur-xl shadow-lg"
      style={{
        background: "rgba(15, 23, 42, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        color: muted ? "#64748b" : "#e2e8f0",
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={muted ? "Unmute" : "Mute"}
    >
      {muted ? "🔇" : "🔊"}
    </motion.button>
  );
}

/** Loading screen */
function LoadingScreen() {
  return (
    <div
      className="absolute inset-0 z-[60] flex flex-col items-center justify-center"
      style={{ background: "#050810", fontFamily: "var(--font-sans)" }}
    >
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-xs tracking-[0.3em] uppercase font-black"
        style={{ color: "#6366f1" }}
      >
        Entering the World…
      </motion.div>
      <div
        className="mt-6 h-[3px] w-40 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <motion.div
          className="h-full"
          style={{ background: "linear-gradient(90deg, #4f46e5, #818cf8)" }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

// Phase boundary levels (trigger phase-transition animation variant)
const PHASE_THRESHOLDS = new Set([7, 16, 29, 40]);

// Badge type shared between state and BadgeAwardSequence props
interface BadgePayload {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

export default function MapPage() {
  const { containerRef, phaserReady } = useMapGame();

  // ── Intro screen (persona gender selection) ───────────────────────────────
  const [showIntro, setShowIntro] = useState(true);
  const [selectedGender, setSelectedGender] = useState<"male" | "female">(
    "male",
  );

  const handleStartJourney = useCallback((gender: "male" | "female") => {
    setSelectedGender(gender);
    setShowIntro(false);
  }, []);

  // ── Audio unlock on first interaction ─────────────────────────────────────
  // audioManager already attaches window listeners for click/keydown/touchstart
  // but we also call unlock() explicitly once the map mounts to be safe.
  useEffect(() => {
    const handleFirstInteraction = () => {
      audioManager.unlock();
    };
    window.addEventListener("pointerdown", handleFirstInteraction, {
      once: true,
    });
    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
    };
  }, []);

  // ── Jotai atom setters (HUD store) ────────────────────────────────────────
  const setActiveVentureAtom = useSetAtom(activeVentureAtom);
  const setUserProgressAtom = useSetAtom(userProgressAtom);
  const setStageInfoAtom = useSetAtom(stageInfoAtom);
  const setCheckpointProgressAtom = useSetAtom(checkpointProgressAtom);
  const [audioSettings, setAudioSettings] = useAtom(audioSettingsAtom);

  // ── Convex queries ─────────────────────────────────────────────────────────
  const ventures = useQuery(api.worldMap.getVenturesByUser);
  const activeVenture = ventures?.[0] ?? null;

  const worldMapData = useQuery(
    api.worldMap.getWorldMapData,
    activeVenture && !showIntro ? { ventureId: activeVenture._id } : "skip",
  );

  // currentUser needed for level + streak + badge lookups
  const currentUser = useQuery(api.users.getCurrentUser);

  const levelData = useQuery(
    api.levels.getUserLevelProgress,
    currentUser?._id ? { userId: currentUser._id } : "skip",
  );

  // getStreak uses the caller's auth identity — no args
  const streakData = useQuery(api.gamification.getStreak);

  // Live badge subscription — detects new awards and fires BadgeAwardSequence
  const myBadges = useQuery(api.badges.getMyBadges);
  const prevBadgeCountRef = useRef<number | null>(null);

  // Venture badge subscription (62-badge system)
  const ventureMyBadges = useQuery(
    api.badges.getVentureBadges,
    currentUser?._id ? { userId: currentUser._id } : "skip",
  );
  const prevVentureBadgeCountRef = useRef<number | null>(null);

  // Quality score for the current stage
  const stageQuality = useQuery(
    api.aiScoring.getStageQualityScore,
    activeVenture && worldMapData?.venture
      ? {
          ventureId: activeVenture._id,
          stageNumber: worldMapData.venture.currentStage,
        }
      : "skip",
  );

  // ── Convex mutations ───────────────────────────────────────────────────────
  const markTaskComplete = useMutation(api.worldMap.markTaskComplete);
  const advanceCheckpoint = useMutation(api.ventures.advanceCheckpoint);
  const seedFlags = useMutation(api.aiScoring.seedFeatureFlags);

  // ── Local UI state (non-persisted) ────────────────────────────────────────
  const [selectedDetail, setSelectedDetail] = useState<CheckpointDetail | null>(
    null,
  );
  const [flashTrigger, setFlashTrigger] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  // fps tracked by useMapGame but only used in debug — keep for future use
  const [levelUpData, setLevelUpData] = useState<{
    oldLevel: number;
    newLevel: number;
    phase: number;
    isPhaseTransition: boolean;
  }>({ oldLevel: 1, newLevel: 2, phase: 1, isPhaseTransition: false });

  // Badge queue — pop-and-show one at a time
  const [badgeQueue, setBadgeQueue] = useState<BadgePayload[]>([]);
  const activeBadge = badgeQueue[0] ?? null;

  // Track previous level to detect level-up events
  const prevLevelRef = useRef<number | null>(null);

  // Seed feature flags once on first load (idempotent mutation)
  const flagsSeededRef = useRef(false);
  useEffect(() => {
    if (flagsSeededRef.current) return;
    flagsSeededRef.current = true;
    seedFlags().catch(() => {
      // Non-critical — silently ignore if already seeded
    });
  }, [seedFlags]);

  // ── Derived values from Convex ─────────────────────────────────────────────
  const venture = worldMapData?.venture ?? null;
  // Stable reference — avoids re-renders on every Convex tick
  const checkpoints = useMemo(
    () => worldMapData?.checkpoints ?? [],
    [worldMapData?.checkpoints],
  );
  const brightness = worldMapData?.brightness;
  const ideaTitle = worldMapData?.ideaTitle ?? "Your Venture";

  const activeStage = venture?.currentStage ?? 1;
  const activeCP = venture?.currentCheckpoint ?? 1;

  const completedCount = checkpoints.filter(
    (cp) =>
      cp.status === "completed" ||
      (cp.t1Completed && cp.t2Completed && cp.t3Completed),
  ).length;

  // XP / Level from Convex
  const level = levelData?.level ?? 1;
  const xpPercent = levelData?.progress ?? 0;
  const levelPhase = levelData?.phase
    ? (() => {
        const p = levelData.phase as string;
        if (p === "tutorial") return 1;
        if (p === "early") return 2;
        if (p === "mid") return 3;
        if (p === "senior") return 4;
        return 5; // mentor
      })()
    : 1;

  // Streak from Convex
  const streak = streakData?.currentStreak ?? 0;

  // Quality score from AI scoring backend (0–12 total, 0 when not yet scored)
  const qualityScore = stageQuality?.totalScore ?? 0;
  const valuationScore = stageQuality?.valuationScore ?? 0;

  // ── Detect new badges via Convex subscription ─────────────────────────────
  // getMyBadges returns badges newest-first. When the count increases, the
  // badge at index 0 is the most recently awarded one.
  useEffect(() => {
    if (!myBadges) return;
    const count = myBadges.length;

    if (
      prevBadgeCountRef.current !== null &&
      count > prevBadgeCountRef.current
    ) {
      // New badge(s) awarded — enqueue them
      const newCount = count - prevBadgeCountRef.current;
      const newBadges = myBadges.slice(0, newCount);
      const payloads: BadgePayload[] = newBadges.map((b) => ({
        id: b._id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        rarity: b.rarity,
      }));
      setBadgeQueue((q) => [...q, ...payloads]);
      // Play SFX for the first new badge
      if (payloads[0]) {
        audioManager.playBadgeSFX(payloads[0].rarity);
      }
    }

    prevBadgeCountRef.current = count;
  }, [myBadges]);

  // ── Detect new venture badges (62-badge system) ───────────────────────────
  useEffect(() => {
    if (!ventureMyBadges) return;
    const count = ventureMyBadges.length;

    if (
      prevVentureBadgeCountRef.current !== null &&
      count > prevVentureBadgeCountRef.current
    ) {
      // New venture badge(s) awarded — enqueue them
      const newCount = count - prevVentureBadgeCountRef.current;
      // Sort by awardedAt descending to get newest first
      const sorted = [...ventureMyBadges].sort(
        (a, b) => b.awardedAt - a.awardedAt,
      );
      const newBadges = sorted.slice(0, newCount);

      const payloads: BadgePayload[] = newBadges
        .filter((b) => b.definition && !b.isHidden)
        .map((b) => ({
          id: b._id,
          name: b.definition!.name,
          description: b.definition!.tagline,
          icon: b.definition!.iconDescription,
          rarity: b.definition!.rarity as
            | "common"
            | "uncommon"
            | "rare"
            | "epic"
            | "legendary",
        }));

      if (payloads.length > 0) {
        setBadgeQueue((q) => {
          // Deduplicate by id to prevent showing the same badge twice
          const existing = new Set(q.map((b) => b.id));
          const unique = payloads.filter((p) => !existing.has(p.id));
          return [...q, ...unique];
        });
        // Play SFX for the first new badge
        if (payloads[0]) {
          audioManager.playBadgeSFX(payloads[0].rarity);
        }
      }
    }

    prevVentureBadgeCountRef.current = count;
  }, [ventureMyBadges]);

  // ── Play biome ambience whenever active stage changes ─────────────────────
  useEffect(() => {
    if (!phaserReady) return;
    audioManager.playAmbienceForStage(activeStage);
  }, [activeStage, phaserReady]);

  // ── Detect level-up → trigger LevelUpSequence + fanfare ──────────────────
  useEffect(() => {
    if (prevLevelRef.current !== null && level > prevLevelRef.current) {
      setLevelUpData({
        oldLevel: prevLevelRef.current,
        newLevel: level,
        phase: levelPhase,
        isPhaseTransition: PHASE_THRESHOLDS.has(level),
      });
      setShowLevelUp(true);
      // Play level-up fanfare
      audioManager.playLevelUp();
    }
    prevLevelRef.current = level;
  }, [level, levelPhase]);

  // ── Sync Convex data → Jotai HUD atoms ────────────────────────────────────
  useEffect(() => {
    if (!venture) return;

    const stageData = STAGES[activeStage - 1];

    setActiveVentureAtom({
      id: venture._id,
      name: ideaTitle,
      currentStage: activeStage,
      currentCheckpoint: activeCP,
      totalCheckpoints: TOTAL_CHECKPOINTS,
    });

    setStageInfoAtom({
      stageName: stageData?.name ?? "Ideation",
      stageIcon: stageData?.icon ?? "💡",
      biomeName: stageData?.biome ?? "The Village",
      stage: activeStage,
    });

    const goldCount = checkpoints.filter(
      (cp) => cp.t1Completed && cp.t2Completed && cp.t3Completed,
    ).length;

    setCheckpointProgressAtom({
      completed: completedCount,
      total: TOTAL_CHECKPOINTS,
      goldCount,
    });
  }, [
    venture,
    ideaTitle,
    activeStage,
    activeCP,
    checkpoints,
    completedCount,
    setActiveVentureAtom,
    setStageInfoAtom,
    setCheckpointProgressAtom,
  ]);

  useEffect(() => {
    setUserProgressAtom({
      level,
      phase: levelPhase,
      xp: xpPercent,
      xpToNextLevel: 100,
      streak,
      qualityScore,
      valuationScore,
    });
  }, [
    level,
    levelPhase,
    xpPercent,
    streak,
    qualityScore,
    valuationScore,
    setUserProgressAtom,
  ]);

  // ── Also listen for BADGE_AWARDED events dispatched via the event bridge ──
  // (Covers Phaser-side badge triggers in addition to the Convex subscription)
  useEffect(() => {
    const handleBadge = (event: BadgePayload) => {
      setBadgeQueue((q) => {
        // Deduplicate — don't show same badge twice if subscription already caught it
        if (q.some((b) => b.id === event.id)) return q;
        return [...q, event];
      });
      audioManager.playBadgeSFX(event.rarity);
    };
    eventBridge.onReact("BADGE_AWARDED", handleBadge);
    return () => eventBridge.off("BADGE_AWARDED", handleBadge);
  }, []);

  // ── Sync Convex checkpoint data → Phaser ───────────────────────────────────
  useEffect(() => {
    if (!phaserReady || !venture || checkpoints.length === 0) return;

    const phaserCheckpoints: CheckpointState[] = checkpoints.map((cp) => {
      const localStatus = deriveCheckpointStatus(cp, activeStage, activeCP);
      const phaserStatus =
        localStatus === "partial" ? "in_progress" : localStatus;
      return {
        id: cp._id,
        stage: cp.stage,
        checkpoint: cp.checkpoint,
        status: phaserStatus as CheckpointState["status"],
        t1: cp.t1Completed,
        t2: cp.t2Completed,
        t3: cp.t3Completed,
      };
    });

    eventBridge.dispatchToPhaser({
      type: "UPDATE_CHECKPOINTS",
      checkpoints: phaserCheckpoints,
    });

    eventBridge.dispatchToPhaser({
      type: "SET_ACTIVE_VENTURE",
      ventureId: venture._id,
      personaGender: selectedGender,
      assignedBosses: Array.isArray(venture.assignedBosses)
        ? venture.assignedBosses.map(String)
        : [],
      currentStage: activeStage,
    } as Parameters<typeof eventBridge.dispatchToPhaser>[0]);

    eventBridge.dispatchToPhaser({
      type: "UPDATE_BRIGHTNESS",
      brightness: brightness?.worldBrightness ?? 0,
    });
  }, [
    phaserReady,
    venture,
    checkpoints,
    activeStage,
    activeCP,
    brightness,
    selectedGender,
  ]);

  // ── Checkpoint click from Phaser ───────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e: {
      checkpointId: string;
      stage: number;
      checkpoint: number;
    }) => {
      // e.checkpointId is the real Convex _id (string) — look it up
      const cp = checkpoints.find((c) => c._id === e.checkpointId);
      if (!cp) return;

      const stageIdx = cp.stage - 1;
      const cpIdx = cp.checkpoint - 1;
      const status = deriveCheckpointStatus(cp, activeStage, activeCP);

      // Build tasks from Convex rows which now include real prompt text
      // (enriched by getWorldMapData joining with CHECKPOINT_DEFINITIONS)
      type ConvexTask = {
        taskLevel: string;
        toolType: string;
        prompt?: string;
        _id: string;
      };
      const convexTasks: ConvexTask[] =
        "tasks" in cp && Array.isArray((cp as { tasks: ConvexTask[] }).tasks)
          ? (cp as { tasks: ConvexTask[] }).tasks
          : [];

      const taskLevels: Array<"t1" | "t2" | "t3"> = ["t1", "t2", "t3"];

      const tasks: Task[] = taskLevels.map((lvl) => {
        const convexTask = convexTasks.find((t) => t.taskLevel === lvl);
        const isDone =
          lvl === "t1"
            ? cp.t1Completed
            : lvl === "t2"
              ? cp.t2Completed
              : cp.t3Completed;

        // Use the real task prompt from CHECKPOINT_DEFINITIONS (via Convex enrichment)
        // Fall back to a clear label if somehow missing
        const description =
          convexTask?.prompt ||
          `Complete task ${lvl.toUpperCase()} for this checkpoint.`;

        return {
          label:
            lvl === "t1"
              ? "T1 Easy"
              : lvl === "t2"
                ? "T2 Medium"
                : "T3 Stretch",
          description,
          tool: convexTask?.toolType ?? "write",
          difficulty:
            lvl === "t1" ? "easy" : lvl === "t2" ? "medium" : "stretch",
          done: isDone,
          _convexCheckpointId: cp._id,
          _taskLevel: lvl,
        } as Task & { _convexCheckpointId: string; _taskLevel: string };
      });

      // Use real checkpoint name and outcome from Convex (enriched from CHECKPOINT_DEFINITIONS)
      const cpWithMeta = cp as typeof cp & {
        outcome?: string;
        checkpointName?: string;
      };

      setSelectedDetail({
        id: cp._id,
        stage: cp.stage,
        stageIdx,
        stageName: STAGES[stageIdx]?.name ?? `Stage ${cp.stage}`,
        biome: STAGES[stageIdx]?.biome ?? "",
        stageGlow: STAGES[stageIdx]?.glow ?? "#C9A84C",
        checkpointIndex: cpIdx,
        title: cpWithMeta.checkpointName ?? `Checkpoint ${cp.checkpoint}`,
        outcome: cpWithMeta.outcome ?? "",
        status,
        tasks,
      });
    };

    eventBridge.onReact("CHECKPOINT_CLICKED", handleClick);
    return () => eventBridge.off("CHECKPOINT_CLICKED", handleClick);
  }, [checkpoints, activeStage, activeCP]);

  // ── Task toggle → Convex mutation ─────────────────────────────────────────
  const handleTaskToggle = useCallback(
    async (taskIdx: number) => {
      if (!selectedDetail) return;
      type TaskWithIds = Task & {
        _convexCheckpointId?: string;
        _taskLevel?: string;
      };
      const task = selectedDetail.tasks[taskIdx] as TaskWithIds;
      if (!task || task.done) return; // tasks can only be marked done, not undone

      const checkpointId = task._convexCheckpointId as
        | Id<"ventureCheckpoints">
        | undefined;
      const taskLevel = task._taskLevel as "t1" | "t2" | "t3" | undefined;

      if (!checkpointId || !taskLevel) return;

      try {
        await markTaskComplete({ checkpointId, taskLevel });
        // Convex subscription will re-fetch worldMapData and auto-update the panel
        // via the useEffect that rebuilds selectedDetail on checkpoints change.
        // Optimistically update the panel immediately so there's no flicker.
        setSelectedDetail((d) =>
          d
            ? {
                ...d,
                tasks: d.tasks.map((t, i) =>
                  i === taskIdx ? { ...t, done: true } : t,
                ),
              }
            : null,
        );
      } catch (err) {
        console.error("markTaskComplete failed:", err);
      }
    },
    [selectedDetail, markTaskComplete],
  );

  // ── Advance checkpoint → Convex mutation ──────────────────────────────────
  const handleAdvance = useCallback(async () => {
    if (!selectedDetail || !venture) return;

    // Find the real Convex checkpoint document
    const cp = checkpoints.find((c) => c._id === selectedDetail.id);
    if (!cp) return;

    const doneTasks = [cp.t1Completed, cp.t2Completed, cp.t3Completed].filter(
      Boolean,
    ).length;
    if (doneTasks < 2) return;

    const isGold = doneTasks >= 3;
    const animVariant = isGold ? "gold" : "standard";
    setFlashTrigger((n) => n + 1);
    setSelectedDetail(null);

    // Dispatch checkpoint animation to Phaser
    eventBridge.dispatchToPhaser({
      type: "PLAY_CHECKPOINT_ANIMATION",
      checkpointId: cp._id,
      stage: cp.stage,
      variant: animVariant,
    });

    // Play the matching checkpoint SFX
    const animName = STAGE_ANIMATION[cp.stage] ?? "Seal Break";
    const sfxKey =
      `${animName}_${animVariant}` as keyof typeof ANIMATION_TO_SFX;
    const sfxId = ANIMATION_TO_SFX[sfxKey];
    if (sfxId) {
      audioManager.playCheckpointSFX(sfxId);
    }

    try {
      await advanceCheckpoint({
        checkpointId: cp._id as Id<"ventureCheckpoints">,
      });
      // Convex will update venture.currentStage / currentCheckpoint in real-time,
      // which re-triggers the Phaser sync useEffect above.

      // Pan camera to the next active checkpoint after data re-arrives
      // (we use a small delay so the Convex subscription has time to fire)
      setTimeout(() => {
        const nextCp = checkpoints.find(
          (c) =>
            (c.stage === activeStage && c.checkpoint === activeCP + 1) ||
            (c.stage === activeStage + 1 && c.checkpoint === 1),
        );
        if (nextCp) {
          eventBridge.dispatchToPhaser({
            type: "SCROLL_TO_CHECKPOINT",
            checkpointId: nextCp._id,
          });
        }
      }, 400);
    } catch (err) {
      console.error("advanceCheckpoint failed:", err);
    }
  }, [
    selectedDetail,
    venture,
    checkpoints,
    activeStage,
    activeCP,
    advanceCheckpoint,
  ]);

  // ── Destroy audio on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      audioManager.destroy();
    };
  }, []);

  // ── Stage strip select ─────────────────────────────────────────────────────
  const handleStageSelect = useCallback(
    (stageId: number) => {
      const firstCp = checkpoints.find(
        (c) => c.stage === stageId && c.checkpoint === 1,
      );
      if (firstCp) {
        eventBridge.dispatchToPhaser({
          type: "SCROLL_TO_CHECKPOINT",
          checkpointId: firstCp._id,
        });
      }
    },
    [checkpoints],
  );

  // ── Loading / no-venture guard ─────────────────────────────────────────────
  // worldMapData is "skip"ped while intro is showing, so only check it after
  const isLoading =
    ventures === undefined ||
    (!showIntro && activeVenture !== null && worldMapData === undefined);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative w-full h-screen overflow-hidden font-sans"
      style={{ background: "#050810" }}
    >
      {/* Fonts + keyframes */}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* Phaser canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-0"
        style={{ touchAction: "none" }}
      />

      {/* Loading screen */}
      <AnimatePresence>
        {!phaserReady && (
          <motion.div
            key="loading"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="data-loading"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* No venture state */}
      {!isLoading && !activeVenture && phaserReady && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-md"
        >
          <div
            className="text-center px-10 py-12 rounded-3xl"
            style={{
              background: "rgba(10, 15, 30, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <p
              className="text-xs tracking-[0.2em] uppercase font-black mb-4"
              style={{ color: "#6366f1" }}
            >
              No Active Venture
            </p>
            <p className="text-sm font-medium mb-8" style={{ color: "#94a3b8" }}>
              Create a venture to begin your journey
            </p>
            <Link
              href="/venture/create"
              className="px-6 py-3 rounded-xl text-xs tracking-wider font-bold uppercase transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.1))",
                border: "1px solid rgba(99, 102, 241, 0.4)",
                color: "#818cf8",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.15)",
              }}
            >
              Create Venture →
            </Link>
          </div>
        </div>
      )}

      {/* Intro / persona selection screen */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-50"
          >
            <IntroScreen
              ventureName={
                worldMapData?.ideaTitle ??
                activeVenture?.ideaId ??
                "Your Venture"
              }
              onStart={handleStartJourney}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!showIntro && phaserReady && activeVenture && (
        <>
          {/* Primary HUD — reads from Jotai atoms populated by Convex data */}
          <HUD />

          {/* Stage navigation strip — bottom pill buttons */}
          <StageStrip activeStage={activeStage} onSelect={handleStageSelect} />

          {/* Audio toggle — syncs Jotai atom AND audioManager */}
          <AudioToggle
            muted={audioSettings.muted}
            onToggle={() => {
              setAudioSettings((prev) => ({ ...prev, muted: !prev.muted }));
              audioManager.setMuted(!audioSettings.muted);
            }}
          />

          <CrossingFlash trigger={flashTrigger} />

          {/* Gap 3 fix: use the real LevelUpSequence component */}
          <LevelUpSequence
            isVisible={showLevelUp}
            oldLevel={levelUpData.oldLevel}
            newLevel={levelUpData.newLevel}
            phase={levelUpData.phase}
            isPhaseTransition={levelUpData.isPhaseTransition}
            onComplete={() => setShowLevelUp(false)}
            onSkip={() => setShowLevelUp(false)}
          />

          {/* Gap 4 fix: BadgeAwardSequence wired to badge queue */}
          <BadgeAwardSequence
            isVisible={!!activeBadge}
            badge={activeBadge}
            onComplete={() => setBadgeQueue((q) => q.slice(1))}
            onSkip={() => setBadgeQueue((q) => q.slice(1))}
          />

          {/* Checkpoint detail panel */}
          <AnimatePresence>
            {selectedDetail && (
              <CheckpointPanel
                detail={selectedDetail}
                onClose={() => setSelectedDetail(null)}
                onAdvance={handleAdvance}
                onTaskToggle={handleTaskToggle}
              />
            )}
          </AnimatePresence>

          {/* Click-away backdrop (left of panel) */}
          {selectedDetail && (
            <div
              className="absolute inset-0 z-[25]"
              style={{ right: "340px" }}
              onClick={() => setSelectedDetail(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
