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
    glow: "#C9A84C",
    checkpoints: 4,
    icon: "💡",
  },
  {
    id: 2,
    name: "Research",
    biome: "The Forest",
    mini: "Pathwarden Wraith",
    glow: "#4ADE80",
    checkpoints: 5,
    icon: "🔬",
  },
  {
    id: 3,
    name: "Validation",
    biome: "The Arena",
    mini: "Advocate of Comfortable Lies",
    glow: "#F97316",
    checkpoints: 4,
    icon: "⚔️",
  },
  {
    id: 4,
    name: "Offer Design",
    biome: "Artisan's Quarter",
    mini: "Unfinished Golem",
    glow: "#94A3B8",
    checkpoints: 5,
    icon: "🎨",
  },
  {
    id: 5,
    name: "Build & Deliver",
    biome: "The Mine",
    mini: "Collapse Specter",
    glow: "#FBBF24",
    checkpoints: 6,
    icon: "⚙️",
  },
  {
    id: 6,
    name: "Launch",
    biome: "The Harbour",
    mini: "Harbourmaster of Hesitation",
    glow: "#22D3EE",
    checkpoints: 3,
    icon: "🚀",
  },
  {
    id: 7,
    name: "Iteration",
    biome: "Crossroads Town",
    mini: "Babel Merchant",
    glow: "#FB923C",
    checkpoints: 4,
    icon: "🔄",
  },
  {
    id: 8,
    name: "Scale",
    biome: "The Capital",
    mini: "Iron Bureaucrat",
    glow: "#A78BFA",
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
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-1.5"
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
              className="h-[6px] rounded-full"
              style={{
                width: isCurrent ? "36px" : "24px",
                background: isDone
                  ? "#7A6128"
                  : isCurrent
                    ? st.glow
                    : "rgba(20,34,51,0.9)",
                border: `1px solid ${
                  isDone
                    ? "#C9A84C"
                    : isCurrent
                      ? st.glow
                      : "rgba(58,90,114,0.5)"
                }`,
                boxShadow: isCurrent ? `0 0 10px ${st.glow}` : "none",
                transition: "width 0.3s ease, box-shadow 0.3s ease",
              }}
            />
            <span
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap text-[9px] tracking-[2px] uppercase px-2 py-1 rounded pointer-events-none"
              style={{
                fontFamily: "'Cinzel', serif",
                color: st.glow,
                background: "rgba(7,13,20,0.95)",
                border: "1px solid rgba(201,168,76,0.25)",
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
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="absolute right-0 top-0 bottom-0 z-30 flex flex-col"
        style={{
          width: "340px",
          background:
            "linear-gradient(180deg, rgba(10,20,32,0.98), rgba(7,13,20,0.99))",
          borderLeft: "1px solid rgba(201,168,76,0.18)",
          fontFamily: "'Cinzel', serif",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center text-[13px] transition-colors duration-150"
          style={{ border: "1px solid rgba(58,90,114,0.6)", color: "#6A90AA" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#C9A84C";
            (e.currentTarget as HTMLElement).style.color = "#C9A84C";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(58,90,114,0.6)";
            (e.currentTarget as HTMLElement).style.color = "#6A90AA";
          }}
        >
          ✕
        </button>

        <div className="flex flex-col gap-3.5 p-5 flex-1 overflow-y-auto">
          {/* Stage label */}
          <div>
            <p
              className="text-[9px] tracking-[3px] uppercase mb-1"
              style={{ color: detail.stageGlow }}
            >
              Stage {detail.stage} · {detail.stageName}
            </p>
            <h2
              className="text-[18px] font-semibold leading-tight"
              style={{ color: "#D4E8F5" }}
            >
              {detail.title}
            </h2>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <StatusDot status={detail.status} />
            <span
              className="text-[10px] tracking-[2px] uppercase"
              style={{ color: "#6A90AA" }}
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
            className="text-[13px] leading-relaxed italic px-3 py-2 rounded"
            style={{
              color: "#8AAFCC",
              borderLeft: `2px solid ${detail.stageGlow}`,
              background: "rgba(255,255,255,0.025)",
              fontFamily: "'Crimson Pro', serif",
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
          <div className="flex items-center gap-1.5 px-1">
            {detail.tasks.map((t, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{
                  background: t.done
                    ? i === 2
                      ? "#C9A84C"
                      : "#2EC99A"
                    : "rgba(58,90,114,0.4)",
                  boxShadow: t.done
                    ? `0 0 4px ${i === 2 ? "#C9A84C" : "#2EC99A"}`
                    : "none",
                }}
              />
            ))}
          </div>
          <p
            className="text-[10px] tracking-[1px]"
            style={{ color: "#3A5A72" }}
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
            className="flex items-center gap-2 px-3 py-2 rounded"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span
              className="text-[10px] tracking-[2px] uppercase"
              style={{ color: "#3A5A72" }}
            >
              Crossing:
            </span>
            <span
              className="text-[10px] tracking-[1px]"
              style={{ color: detail.stageGlow, opacity: 0.8 }}
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
                whileHover={canAdvance ? { scale: 1.02 } : {}}
                whileTap={canAdvance ? { scale: 0.98 } : {}}
                className="w-full py-3 rounded-lg text-[11px] tracking-[2px] uppercase font-bold transition-all duration-250"
                style={{
                  background: isGold
                    ? "linear-gradient(135deg, rgba(201,168,76,0.35), rgba(240,208,128,0.15))"
                    : canAdvance
                      ? "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))"
                      : "rgba(20,35,50,0.4)",
                  border: isGold
                    ? "1px solid #C9A84C"
                    : canAdvance
                      ? "1px solid rgba(201,168,76,0.4)"
                      : "1px solid rgba(58,90,114,0.3)",
                  color: canAdvance ? "#C9A84C" : "#3A5A72",
                  cursor: canAdvance ? "pointer" : "not-allowed",
                  boxShadow: isGold ? "0 0 20px rgba(201,168,76,0.25)" : "none",
                }}
              >
                {isGold
                  ? "⭐  Gold Checkpoint — Advance"
                  : canAdvance
                    ? "Advance Checkpoint →"
                    : `Complete ${2 - doneTasks} more task${2 - doneTasks !== 1 ? "s" : ""} to advance`}
              </motion.button>
            </div>
          )}
      </motion.div>
    </AnimatePresence>
  );
}

function StatusDot({ status }: { status: CheckpointStatus }) {
  const colors: Record<CheckpointStatus, string> = {
    locked: "#3A5A72",
    active: "#1ECFCF",
    partial: "#FBBF24",
    completed: "#2EC99A",
    gold: "#C9A84C",
  };
  const glow: Record<CheckpointStatus, string | undefined> = {
    locked: undefined,
    active: "#1ECFCF",
    partial: "#FBBF24",
    completed: "#2EC99A",
    gold: "#C9A84C",
  };
  return (
    <motion.div
      className="w-2 h-2 rounded-full flex-shrink-0"
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
      ? "#C9A84C"
      : task.difficulty === "medium"
        ? "#1ECFCF"
        : "#2EC99A";

  return (
    <motion.div
      onClick={locked ? undefined : onToggle}
      whileHover={locked ? {} : { x: 3 }}
      whileTap={locked ? {} : { scale: 0.99 }}
      className="flex items-start gap-3 px-3 py-2.5 rounded-lg relative overflow-hidden cursor-pointer"
      style={{
        background: task.done
          ? "rgba(46,201,154,0.04)"
          : "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        cursor: locked ? "default" : "pointer",
        opacity: task.done ? 0.7 : 1,
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
        style={{ background: task.done ? "#2EC99A" : accentColor }}
      />

      {/* Check circle */}
      <motion.div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px]"
        style={{
          background: task.done ? "#2EC99A" : "transparent",
          border: `1.5px solid ${task.done ? "#2EC99A" : "rgba(58,90,114,0.6)"}`,
          color: task.done ? "#000" : "transparent",
        }}
        animate={task.done ? { scale: [1.2, 1] } : {}}
        transition={{ duration: 0.2 }}
      >
        {task.done && "✓"}
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-[9px] tracking-[2px] uppercase"
            style={{ color: accentColor, opacity: 0.8 }}
          >
            {task.label}
          </span>
        </div>
        <p
          className="text-[12.5px] leading-snug"
          style={{
            color: "#D4E8F5",
            fontFamily: "'Crimson Pro', serif",
            fontWeight: 300,
          }}
        >
          {task.description}
        </p>
        <p
          className="text-[9px] tracking-[1px] mt-1 uppercase"
          style={{ color: "#1ECFCF", opacity: 0.65 }}
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
          style={{ background: "rgba(201,168,76,0.12)" }}
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
      className="absolute bottom-12 right-5 z-20 w-9 h-9 rounded-full flex items-center justify-center text-[14px]"
      style={{
        background: "rgba(7,13,20,0.85)",
        border: "1px solid rgba(58,90,114,0.5)",
        color: muted ? "#3A5A72" : "#C9A84C",
        backdropFilter: "blur(8px)",
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
      style={{ background: "#070D14", fontFamily: "'Cinzel', serif" }}
    >
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-[11px] tracking-[5px] uppercase"
        style={{ color: "#C9A84C" }}
      >
        Entering the World…
      </motion.div>
      <div
        className="mt-4 h-[2px] w-32 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <motion.div
          className="h-full"
          style={{ background: "linear-gradient(90deg, #7A6128, #C9A84C)" }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
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
      className="relative w-full h-screen overflow-hidden"
      style={{ background: "#070D14" }}
    >
      {/* Fonts + keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');
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
          className="absolute inset-0 z-30 flex items-center justify-center"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <div
            className="text-center px-8 py-10 rounded-2xl"
            style={{
              background: "rgba(7,13,20,0.96)",
              border: "1px solid rgba(201,168,76,0.25)",
            }}
          >
            <p
              className="text-[10px] tracking-[4px] uppercase mb-3"
              style={{ color: "#C9A84C" }}
            >
              No Active Venture
            </p>
            <p className="text-[14px] mb-6" style={{ color: "#6A90AA" }}>
              Create a venture to begin your journey
            </p>
            <Link
              href="/venture/create"
              className="px-5 py-2.5 rounded-lg text-[11px] tracking-[2px] uppercase"
              style={{
                background: "rgba(201,168,76,0.15)",
                border: "1px solid rgba(201,168,76,0.4)",
                color: "#C9A84C",
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
