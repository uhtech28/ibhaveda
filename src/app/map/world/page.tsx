"use client";

/**
 * src/app/map/page.tsx
 *
 * Ibhaveda — Venture World Map
 * React overlay layer + Phaser canvas integration
 *
 * Stack: Next.js 15 · React 19 · Framer Motion 12 · Tailwind CSS 4 · Convex · Clerk
 */

import {
  memo,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  useDeferredValue,
  Suspense,
} from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { audioManager } from "@/lib/audio/audioManager";
import { computeCumulativeVentureScores } from "@/lib/scoring/cumulativeVentureScore";
import { api } from "@convex/_generated/api";
import { LEVEL_DEFINITIONS } from "@convex/ventureConstants";
import type { Id } from "@convex/_generated/dataModel";
import { FeedTutorial } from "@/components/tutorial/FeedTutorial";
import { useTutorialOptional } from "@/components/tutorial/v2";
import { eventBridge } from "@/lib/phaser/utils/event-bridge";
import { isLiteMode } from "@/lib/phaser/performance-mode";
import {
  buildCheckpointSyncSignature,
  mapCheckpointsToPhaserState,
} from "@/lib/phaser/checkpoint-sync";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { MessageSquare, X, Users, Send, Share2, ExternalLink, Check, Copy, Lock, ChevronLeft, ChevronRight, Swords, Zap } from "lucide-react";
import { QuestList, BossHPBar, StageInfo, XPBar } from "@/components/hud";
import { InterCheckpointOverlay } from "@/components/map/InterCheckpointOverlay";
import { CombatPanel } from "@/components/combat/CombatPanel";
import { getVillageBoss } from "@/config/village-bosses";
import { getStageBoss, getStageSuperBoss } from "@/config/stage-bosses";
import type { StageBoss } from "@/config/stage-bosses";
import { getTemplate, type TemplateId } from "@/config/templates";
import { getVentureBadgeEmoji } from "@/components/badges/BadgeCard";
import {
  checkpointBossKey,
  isActiveVentureCheckpoint,
  isLastCheckpointInStage,
  mergeBossDefeatedState,
  needsCheckpointBossCombat,
  persistCheckpointBossDefeated,
} from "@/lib/venture/stageBossGate";
import { FirstCheckpointPulse } from "@/components/map/FirstCheckpointPulse";
import { GoldCheckpointPopup } from "@/components/notifications/GoldCheckpointPopup";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { LeftSidebar } from "@/components/map/LeftSidebar";
import { ToolsPanel } from "@/components/map/ToolsPanel";
import { IdeaForgeNavbar } from "@/components/ideaforge/navbar";
import { ContributionDashboard } from "@/components/requests/ContributionDashboard";
import { InvitationSection } from "@/components/requests/invitation-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdeaHierarchyFlowchart } from "@/components/idea/IdeaHierarchyNav";
import { GitBranch, Rss, Calendar as CalendarIcon, LayoutDashboard as KanbanIcon, Scroll as JournalIcon, ListTodo } from "lucide-react";
import { CalendarTool } from "@/components/tools/calendar-tool";
import { KanbanTool } from "@/components/tools/kanban-tool";
import { JournalTool } from "@/components/tools/journal-tool";

// Dynamic/lazy loaded overlay components for faster page loading performance
const LevelUpSequence = dynamic(() => import("@/components/animations/LevelUpSequence").then(mod => mod.LevelUpSequence), { ssr: false });
const BadgeAwardSequence = dynamic(() => import("@/components/animations/BadgeAwardSequence").then(mod => mod.BadgeAwardSequence), { ssr: false });
const VillageCompleteCelebration = dynamic(
  () => import("@/components/village/VillageCompleteCelebration"),
  { ssr: false },
);
const VentureCompleteCelebration = dynamic(
  () => import("@/components/village/VentureCompleteCelebration"),
  { ssr: false },
);
const SuperBossEncounterOverlay = dynamic(
  () => import("@/components/combat/SuperBossEncounterOverlay"),
  { ssr: false },
);
const StageClearedToast = dynamic(
  () => import("@/components/village/StageClearedToast"),
  { ssr: false },
);
const DailyChallengesCard = dynamic(
  () => import("@/components/gamification/DailyChallengesCard").then((m) => m.DailyChallengesCard),
  { ssr: false },
);
const XpFloatingPopover = dynamic(
  () => import("@/components/xp/XpFloatingPopover"),
  { ssr: false },
);
const FlareTriggerButton = dynamic(
  () => import("@/components/flares/FlareTriggerButton").then(mod => mod.FlareTriggerButton),
  { ssr: false },
);
const TaskSubmissionModal = dynamic(() => import("@/components/map/TaskSubmissionModal").then(mod => mod.TaskSubmissionModal), { ssr: false });
const StageClearModal = dynamic(() => import("@/components/map/StageClearModal").then(mod => mod.StageClearModal), { ssr: false });
// WorldMapTour removed — replaced entirely by the v2 tutorial (Sparky).
const ChatThread = dynamic(() => import("@/components/chat/ChatThread"), { ssr: false });
const GroupList = dynamic(() => import("@/components/chat/GroupList"), { ssr: false });
const ChannelList = dynamic(() => import("@/components/chat/ChannelList"), { ssr: false });
import { useChat } from "@/components/chat/ChatContext";
import {
  activeVentureAtom,
  userProgressAtom,
  stageInfoAtom,
  checkpointProgressAtom,
  audioSettingsAtom,
  corruptionStateAtom,
  submittingTaskAtom,
  currentQuestAtom,
  activeTaskAtom,
  templateIdAtom,
  templateMetricAtom,
} from "@/lib/stores/hudStore";
import { useMiniGameLifecycle } from "@/lib/minigames/useMiniGameLifecycle";
import {
  MiniGameOverlay,
  MiniGamePromptDialog,
  MiniGameResultPanel,
  MiniGamesPanel,
} from "@/components/minigames";
import { MINIGAME_SPAWNS } from "@convex/miniGameConstants";

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
  _taskId?: Id<"ventureTasks">;
  _convexCheckpointId?: Id<"ventureCheckpoints">;
  _taskLevel?: "t1" | "t2" | "t3";
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

// All 8 stages — visual metadata mapped from the canonical VENTURE_STAGES constant.
// checkpoints count must match ventureConstants.ts.
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
    glow: "#f472b6", // Pink 400
    checkpoints: 4,
    icon: "✅",
  },
  {
    id: 4,
    name: "Offer Design",
    biome: "The Artisan's Quarter",
    mini: "Unfinished Golem",
    glow: "#34d399", // Emerald 400
    checkpoints: 5,
    icon: "🎨",
  },
  {
    id: 5,
    name: "Build & Deliver",
    biome: "The Mine",
    mini: "Collapse Specter",
    glow: "#fb923c", // Orange 400
    checkpoints: 6,
    icon: "⚙️",
  },
  {
    id: 6,
    name: "Launch",
    biome: "The Harbour",
    mini: "Harbourmaster of Hesitation",
    glow: "#38bdf8", // Cyan 400
    checkpoints: 3,
    icon: "🚀",
  },
  {
    id: 7,
    name: "Iteration",
    biome: "The Crossroads Town",
    mini: "Babel Merchant",
    glow: "#facc15", // Yellow 400
    checkpoints: 4,
    icon: "🔄",
  },
  {
    id: 8,
    name: "Scale",
    biome: "The Capital",
    mini: "Iron Bureaucrat",
    glow: "#c084fc", // Purple 400
    checkpoints: 5,
    icon: "📈",
  },
];

const TOTAL_CHECKPOINTS = STAGES.reduce((s, st) => s + st.checkpoints, 0); // 36

function getStageMetadata(templateId: TemplateId): Stage[] {
  if (templateId === "venture") {
    return STAGES;
  }

  const template = getTemplate(templateId);
  const glowsByTemplate: Record<Exclude<TemplateId, "venture">, string[]> = {
    academic: [
      "#d4a853",
      "#7c8c5e",
      "#4a7c9a",
      "#c87941",
      "#8e44ad",
      "#f0c040",
    ],
    lab: [
      "#1a6b8a",
      "#2d6a4f",
      "#4361ee",
      "#d62828",
      "#7209b7",
      "#f77f00",
      "#06d6a0",
    ],
    creative: [
      "#90e0a0",
      "#e8b4d0",
      "#ffd166",
      "#ff6b6b",
      "#a8dadc",
      "#f4a261",
    ],
  };

  return template.stages.map((stage, index) => ({
    id: stage.id,
    name: stage.name,
    biome: stage.biomeName,
    mini: stage.monster.name,
    glow: glowsByTemplate[templateId][index] ?? "#818cf8",
    checkpoints: stage.checkpoints,
    icon: stage.icon,
  }));
}

const STAGE_ANIMATION: Record<number, string> = {
  1: "Seal Break",
  2: "Rune Inscription",
  3: "Beacon Lighting",
  4: "Bridge Repair",
  5: "Compass Calibration",
  6: "Ward Placement",
  7: "Compass Calibration", // Stage 7 (Iteration) uses Compass Calibration per PRD §5
  8: "Seal Break",
};

const PHASE_ONE_STAGE_LIMIT = 2;

// ─────────────────────────────────────────────────────────────────────────────
// HOOK — Phaser game lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stage → scene key mapping. When the venture's currentStage changes
 * (or the user visits with ?stage=N in the URL), we look up the correct
 * scene key here and swap Phaser scenes.
 */
const STAGE_SCENE_KEY: Record<number, string> = {
  1: "VillageMapScene",     // Ideation · The Village
  2: "ForestMapScene",      // Research · The Forest
  3: "ArenaScene",          // Validation · The Arena
  4: "ArtisansScene",       // Offer Design · The Artisan's Quarter
  5: "MineScene",           // Build & Deliver · The Mine (Ironhold)
  6: "GoldenHarborScene",   // Launch · The Harbour
  7: "CrossroadsScene",     // Iteration · The Crossroads Town
  // Stage 8 (The Capital · Scale) — art pending.
};

function useMapGame() {
  const gameRef = useRef<import("phaser").Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [phaserReady, setPhaserReady] = useState(false);

  // Pause Phaser when any overlay panel is open. Trace showed INP of
  // 2 seconds with only 189ms of JS work — the remaining 1.8s was
  // "presentation delay" caused by the Phaser game loop hogging the
  // main thread every 16ms. When an overlay covers the canvas there's
  // no visual reason to keep rendering, and freeing the main thread
  // lets React's update paint immediately.
  //
  // We accept three trigger sources:
  //   1. Radix-style `[role="dialog"]` + `aria-modal` toggles
  //   2. Any element with `data-phaser-pause="true"`
  //   3. Window events `phaser:pause` / `phaser:resume` for direct
  //      React-driven control (CheckpointPanel uses this)
  useEffect(() => {
    if (typeof document === "undefined") return;
    let manualPause = false;
    // Tracks whether a text-editable element currently has focus.
    // Field data: /feed (no Phaser) keyboard INP = 40ms; /map/world
    // (Phaser running) keyboard INP = 1,400-1,700ms; on the rare frame
    // when a modal happened to pause Phaser the same keypress dropped
    // to 40ms. The single biggest INP win available is sleeping the
    // game loop while the user is actually typing/clicking inside an
    // input. That's what this flag drives.
    let inputFocused = false;
    const isEditableTarget = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.isContentEditable) return true;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return true;
      }
      return false;
    };
    const apply = () => {
      const game = gameRef.current;
      if (!game) return;
      // When a side overlay is open we THROTTLE Phaser instead of
      // pausing it. Pausing froze input so users couldn't scroll/drag
      // the map. Throttling to 15fps drops main-thread work by ~75%
      // (huge INP win) while keeping pointer/wheel handlers active.
      // Full pause is still used for Radix dialogs that genuinely
      // cover the entire viewport (TaskSubmissionModal).
      const fullModalOpen = !!document.querySelector(
        '[role="dialog"][data-state="open"]',
      );
      const sideOverlayOpen = !!document.querySelector(
        '[data-phaser-pause="true"]',
      );

      // `sleeping` is a runtime field on Phaser's TimeStep but the
      // typed surface doesn't expose it.
      const phaserLoop = game.loop as Phaser.Core.TimeStep & { sleeping?: boolean };
      // SLEEP if a text input has focus — keyboard INP drops from
      // ~1,700ms to ~40ms. This is the dominant lag the user feels.
      if (manualPause || fullModalOpen || inputFocused) {
        if (!phaserLoop.sleeping) phaserLoop.sleep();
        return;
      }
      if (phaserLoop.sleeping) phaserLoop.wake();

      // Set FPS based on overlay + lite-mode state. Lite-mode kicks in
      // automatically for advanced ventures (6+ completed checkpoints
      // — see WorldMapScene.setVentureAdvanced) and we drop the steady
      // FPS to 30. With smoothStep on, pixel-art world maps look fine
      // at 30fps and the main thread has roughly half the per-frame
      // cost, which is the dominant remaining lag source for veterans.
      const lite = isLiteMode();
      const baseFps = lite ? 30 : 60;
      const targetFps = sideOverlayOpen ? 15 : baseFps;
      const loop = game.loop as Phaser.Core.TimeStep & { setFpsLimit?: (n: number) => void };
      if (typeof loop.setFpsLimit === "function") {
        loop.setFpsLimit(targetFps);
      } else {
        // Older Phaser versions — set the field directly.
        (loop as unknown as { targetFps: number }).targetFps = targetFps;
      }
    };
    const onPause = () => { manualPause = true; apply(); };
    const onResume = () => { manualPause = false; apply(); };
    const onFocusIn = (e: FocusEvent) => {
      if (isEditableTarget(e.target)) {
        if (!inputFocused) {
          inputFocused = true;
          apply();
        }
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      if (isEditableTarget(e.target)) {
        // Defer: focus may immediately move to another input (e.g.
        // tab between fields in TaskSubmissionModal). Re-check on the
        // next microtask so we don't pause/resume/pause flicker.
        queueMicrotask(() => {
          const active = document.activeElement;
          if (!isEditableTarget(active)) {
            inputFocused = false;
            apply();
          }
        });
      }
    };
    window.addEventListener("phaser:pause", onPause);
    window.addEventListener("phaser:resume", onResume);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    const observer = new MutationObserver(apply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state", "aria-modal", "role", "data-phaser-pause"],
    });
    apply();
    return () => {
      observer.disconnect();
      window.removeEventListener("phaser:pause", onPause);
      window.removeEventListener("phaser:resume", onResume);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const handleReady = () => {
      setPhaserReady(true);
      // Kick off village ambience + music once Phaser finishes booting.
      // Both files already exist in public/audio/ so this is a pure wire-up.
      try {
        audioManager.playAmbienceForStage(1);
        audioManager.playMusic("stage_village", 0.42);
      } catch (err) {
        console.warn("[MapPage] audio startup failed", err);
      }
    };

    eventBridge.onReact("PHASER_READY", handleReady);

    // MAP SWAP: /map/world now uses the new painted VillageMapScene
    // instead of Sahit's procedural WorldMapScene. All React overlays
    // (sidebar, boss HP bar, task panel, bottom HUD) still render on top
    // because they're React components. Phaser events (CHECKPOINT_CLICKED)
    // are still fired the same way.
    Promise.all([
      import("phaser"),
      import("@/lib/phaser/game-config"),
      import("@/lib/phaser/scenes/VillageMapScene"),
      import("@/lib/phaser/scenes/ForestMapScene"),
      import("@/lib/phaser/scenes/ArenaScene"),
      import("@/lib/phaser/scenes/ArtisansScene"),
      import("@/lib/phaser/scenes/MineScene"),
      import("@/lib/phaser/scenes/GoldenHarborScene"),
      import("@/lib/phaser/scenes/CrossroadsScene"),
    ]).then((
      [
        Phaser,
        { createGameConfig },
        { VillageMapScene },
        { ForestMapScene },
        { ArenaScene },
        { ArtisansScene },
        { MineScene },
        { GoldenHarborScene },
        { CrossroadsScene },
      ],
    ) => {
      if (!containerRef.current || gameRef.current) return;
      // Register all playable stage scenes.  Phaser auto-starts the
      // FIRST one (VillageMapScene = Stage 1); later stages launch via
      // `scene.start("<key>")` when the user progresses or ?stage=N.
      const scenes = [
        VillageMapScene,
        ForestMapScene,
        ArenaScene,
        ArtisansScene,
        MineScene,
        GoldenHarborScene,
        CrossroadsScene,
      ];
      const game = new Phaser.Game(
        createGameConfig(
          containerRef.current,
          scenes as unknown as Parameters<typeof createGameConfig>[1],
        ),
      );
      gameRef.current = game;
    });

    return () => {
      eventBridge.off("PHASER_READY", handleReady);
      gameRef.current?.destroy(true);
      gameRef.current = null;
      setPhaserReady(false);
    };
  }, []);

  return { containerRef, phaserReady, gameRef };
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
  // If this checkpoint is the active checkpoint node of the venture,
  // it should remain in active/partial status until the player actually advances.
  // Check this FIRST before checking gold status
  if (cp.stage === currentStage && cp.checkpoint === currentCheckpoint) {
    // If all 3 tasks are done, it's gold but still active
    if (cp.t1Completed && cp.t2Completed && cp.t3Completed) return "gold";
    // If some tasks are done, it's partial
    return (cp.t1Completed || cp.t2Completed || cp.t3Completed) ? "partial" : "active";
  }

  // For non-active checkpoints, check if they're gold (completed with all 3 tasks)
  if (cp.t1Completed && cp.t2Completed && cp.t3Completed) return "gold";

  if (cp.status === "completed") return "completed";
  if (cp.stage < currentStage) return "completed";
  if (cp.stage === currentStage && cp.checkpoint < currentCheckpoint)
    return "completed";
  return "locked";
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Stage pill navigation strip */
function StageStrip({
  activeStage,
  onSelect,
  stages,
}: {
  activeStage: number;
  onSelect: (stage: number) => void;
  stages: Stage[];
}) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="no-scrollbar fixed bottom-4 left-1/2 z-20 flex w-[calc(100vw-1rem)] max-w-full -translate-x-1/2 gap-1.5 overflow-x-auto rounded-full border border-white/10 bg-[#0a0d14]/85 p-2 shadow-[0_0_30px_rgba(30,20,50,0.6)] backdrop-blur-xl sm:bottom-6 sm:w-auto sm:max-w-[calc(100vw-2rem)] sm:gap-2 sm:p-2.5 md:bottom-8 md:max-w-3xl lg:bottom-8 lg:max-w-4xl xl:max-w-5xl"
    >
      {stages.map((st, i) => {
        const isDone = i + 1 < activeStage;
        const isCurrent = i + 1 === activeStage;
        const isUnlocked = i + 1 <= activeStage;
        return (
          <motion.button
            key={st.id}
            onClick={() => {
              audioManager.playTouch(isUnlocked ? "click" : "error");
              if (isUnlocked) onSelect(st.id);
            }}
            onMouseEnter={() => {
              if (isUnlocked) audioManager.playUI("hover");
            }}
            whileHover={isUnlocked ? { scaleY: 1.8, scaleX: 1.15 } : {}}
            whileTap={isUnlocked ? { scale: 0.95 } : {}}
            className="relative group flex-shrink-0"
            title={
              isUnlocked
                ? `${st.name} - ${st.biome}`
                : `Complete Stage ${st.id - 1} to unlock ${st.name}`
            }
          >
            {/* Stage indicator pill */}
            <motion.div
              className="h-[10px] rounded-full relative overflow-hidden"
              style={{
                width: isCurrent ? "56px" : "32px",
                background: isDone
                  ? "linear-gradient(135deg, #4f46e5, #6366f1)"
                  : isCurrent
                    ? st.glow
                    : "rgba(255,255,255,0.06)",
                border: `1.5px solid ${isDone
                  ? "#6366f1"
                  : isCurrent
                    ? st.glow
                    : "rgba(255,255,255,0.12)"
                  }`,
                boxShadow: isCurrent
                  ? `0 0 20px ${st.glow}, 0 0 40px ${st.glow}40`
                  : isDone
                    ? "0 0 10px rgba(99, 102, 241, 0.5)"
                    : "none",
                cursor: isUnlocked ? "pointer" : "not-allowed",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {/* Shimmer effect for current stage */}
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}

              {/* Completion checkmark */}
              {isDone && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center text-white text-[8px]"
                >
                  ✓
                </motion.div>
              )}
            </motion.div>

            {/* Tooltip on hover */}
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
            >
              <div
                className="whitespace-nowrap text-[10px] sm:text-xs tracking-wide font-semibold px-3 py-2 rounded-xl shadow-2xl backdrop-blur-xl border"
                style={{
                  fontFamily: "var(--font-sans)",
                  color: "#e2e8f0",
                  background: "rgba(15, 23, 42, 0.95)",
                  borderColor: isCurrent ? st.glow : "rgba(99, 102, 241, 0.3)",
                  boxShadow: isCurrent
                    ? `0 0 20px ${st.glow}40`
                    : "0 10px 30px rgba(0, 0, 0, 0.5)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{st.icon}</span>
                  <div className="text-left">
                    <div className="font-bold">{st.name}</div>
                    <div className="text-[9px] sm:text-[10px] text-white/60 font-normal">
                      {st.biome}
                    </div>
                  </div>
                </div>
              </div>
              {/* Tooltip arrow */}
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0"
                style={{
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: `6px solid ${isCurrent ? st.glow : "rgba(99, 102, 241, 0.3)"}`,
                }}
              />
            </div>

            {/* Stage number label (shows on hover) */}
            <span
              className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[9px] font-bold tracking-wider"
              style={{
                color: isCurrent ? st.glow : isDone ? "#6366f1" : "#64748b",
              }}
            >
              {st.id}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

/**
 * Lightweight skeleton shown for ONE frame while the real
 * CheckpointPanel is mounting via useDeferredValue. Matches the panel
 * footprint so the user sees the slide-in motion immediately without
 * paying the cost of mounting the real panel's children + subscriptions.
 *
 * On advanced ventures (lots of completed checkpoints) the real panel
 * mount was synchronously taking 4,500ms because of Convex subscriptions
 * + Phaser camera tween + dynamic-imported children all happening in
 * the click handler. With this skeleton showing first, the click can
 * paint in ~50ms and the real panel fills in on the next render.
 */
function CheckpointPanelSkeleton() {
  return (
    <motion.div
      key="cp-skeleton"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="absolute right-4 top-20 bottom-24 z-[75] flex flex-col justify-center pointer-events-none w-[calc(100%-2rem)] sm:w-[360px] md:w-[385px] max-w-full"
      style={{ contain: "layout paint" }}
    >
      <div
        className="pointer-events-auto flex flex-col font-sans w-full rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl h-full"
        style={{
          background:
            "linear-gradient(180deg, rgba(16, 20, 35, 0.95), rgba(10, 12, 22, 0.98))",
          backdropFilter: "blur(24px)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
        }}
      >
        <div className="flex flex-col gap-3.5 p-4 sm:p-5 pt-5 sm:pt-6 flex-1">
          <div className="pr-10">
            <div className="h-7 w-3/4 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="h-4 w-1/2 rounded bg-white/5 animate-pulse" />
          <div className="mt-2 space-y-2.5">
            <div className="h-16 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse" />
            <div className="h-16 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse" />
            <div className="h-16 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Checkpoint detail slide-in panel */
const CheckpointPanel = memo(function CheckpointPanelInner({
  detail,
  onClose,
  onAdvance,
  onTaskToggle,
  onTaskRedo,
  evaluationSummary,
  isAdvancing,
  activeStage,
  activeCheckpoint,
  showBossGateHint = false,
  isCurrentMapCheckpoint = false,
  totalCheckpointsInStage = 4,
  tourActive = false,
  ventureId,
}: {
  detail: CheckpointDetail | null;
  onClose: () => void;
  onAdvance: () => void;
  onTaskToggle: (taskIdx: number) => void;
  onTaskRedo: (taskIdx: number) => void;
  showBossGateHint?: boolean;
  isCurrentMapCheckpoint?: boolean;
  totalCheckpointsInStage?: number;
  /** Current active venture id, forwarded to the contextual Flare button. */
  ventureId?: Id<"ventures">;
  /** First-run product tour active. Relaxes the advance threshold so
   *  the user can fight the Doubt Imp after a single task submission. */
  tourActive?: boolean;
  evaluationSummary?: Array<{
    taskLevel: "t1" | "t2" | "t3";
    taskStatus: string;
    isPending: boolean;
    evaluation: null | {
      qualityTier: string;
      totalScore: number;
      feedback?: string;
    };
  }>;
  isAdvancing: boolean;
  activeStage: number;
  activeCheckpoint: number;
}) {
  if (!detail) return null;

  const totalTasks = detail.tasks.length;
  const doneTasks = detail.tasks.filter((t) => t.done).length;
  // First-run tour users can advance after their very first submission so
  // they reach the Doubt Imp combat without grinding the full checkpoint.
  const canAdvance = doneTasks >= 2 || (tourActive && doneTasks >= 1);
  const isGold = doneTasks >= totalTasks && totalTasks > 0;
  const isLocked = detail.status === "locked";
  const bossEncounterNumber = detail.checkpointIndex;

  return (
    <motion.div
      key="cp-panel"
      data-phaser-pause="true"
      data-tutorial="checkpoint-panel"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="absolute right-4 top-20 bottom-24 z-[75] flex flex-col justify-center pointer-events-none w-[calc(100%-2rem)] sm:w-[360px] md:w-[385px] max-w-full"
      style={{ contain: "layout paint" }}
    >
      <div
        className="pointer-events-auto flex flex-col font-sans w-full rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl h-auto max-h-full"
        style={{
          background:
            "linear-gradient(180deg, rgba(16, 20, 35, 0.95), rgba(10, 12, 22, 0.98))",
          backdropFilter: "blur(24px)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
          contain: "layout style",
        }}
      >
          {/* Close button */}
          <button
            onClick={() => {
              audioManager.playTouch("click");
              onClose();
            }}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all duration-200 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col gap-3.5 p-4 sm:p-5 pt-5 sm:pt-6 flex-1 overflow-y-auto no-scrollbar">
            {/* Checkpoint Title at the top */}
            <div className="pr-10">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight leading-tight text-white mb-1.5 sm:mb-2 md:mb-3">
                {detail.title}
              </h2>
            </div>

            {/* Outcome */}
            <div
              className="text-[12px] sm:text-[13px] md:text-sm lg:text-base leading-relaxed font-medium px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 lg:py-4 rounded-lg sm:rounded-xl backdrop-blur-md"
              style={{
                color: "#cbd5e1",
                borderLeft: `3px solid ${detail.stageGlow}`,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.05), transparent)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {detail.outcome}
            </div>

            {/* Tasks */}
            <div
              className="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3"
              data-tutorial="task-list"
            >
              {detail.tasks.map((task, i) => {
                // Mark the first not-yet-done task so the product tour
                // can pulse its highlight ring around it. Also add
                // a stable per-index marker so the tutorial can find
                // the first row even if the "first-open" logic is out
                // of sync with the current render.
                const isFirstOpenTask =
                  !task.done &&
                  !isLocked &&
                  detail.tasks.findIndex((t) => !t.done) === i;
                return (
                  <div
                    key={i}
                    data-tutorial-task-index={i}
                    data-tutorial={isFirstOpenTask ? "first-task" : undefined}
                  >
                    <TaskCard
                      task={task}
                      index={i}
                      locked={isLocked}
                      evaluationSummary={evaluationSummary?.find(
                        (entry) => entry.taskLevel === task._taskLevel,
                      )}
                      onToggle={() => {
                        audioManager.playTouch("click");
                        onTaskToggle(i);
                      }}
                      onRedo={() => {
                        audioManager.playTouch("click");
                        onTaskRedo(i);
                      }}
                    />
                  </div>
                );
              })}
            </div>

          </div>

          {/* Advance + boss counter — shown on every unlocked checkpoint */}
          {!isLocked && (
              <div className="p-2.5 sm:p-3 pt-0 flex flex-col gap-2">
                {!isGold && canAdvance && (
                  <div className="flex items-center justify-between px-1 text-[9px] font-bold uppercase tracking-wider text-indigo-300/70">
                    <span>Tasks {doneTasks}/{totalTasks}</span>
                  </div>
                )}
                <motion.button
                  data-tutorial={canAdvance ? "combat-trigger" : undefined}
                  onClick={() => {
                    audioManager.playTouch(canAdvance ? "confirm" : "error");
                    if (canAdvance && !isAdvancing) onAdvance();
                  }}
                  disabled={isAdvancing}
                  aria-disabled={!canAdvance || isAdvancing}
                  onMouseEnter={() => {
                    if (canAdvance && !isAdvancing) audioManager.playUI("hover");
                  }}
                  whileHover={
                    canAdvance && !isAdvancing ? { scale: 1.02, y: -1 } : {}
                  }
                  whileTap={canAdvance && !isAdvancing ? { scale: 0.98 } : {}}
                  className="w-full py-1.5 sm:py-2 rounded-md text-[9px] sm:text-[10px] tracking-[0.06em] uppercase font-black transition-all duration-300 relative overflow-hidden"
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
                    color: isGold
                      ? "#fde047"
                      : canAdvance
                        ? "#818cf8"
                        : "#64748b",
                    cursor:
                      canAdvance && !isAdvancing ? "pointer" : "not-allowed",
                    boxShadow: isGold
                      ? "0 2px 12px rgba(234, 179, 8, 0.14)"
                      : canAdvance
                        ? "0 2px 12px rgba(99, 102, 241, 0.14)"
                        : "none",
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
                  <span className="relative z-10 flex flex-col items-center gap-0.5 leading-tight">
                    <span>
                      {isAdvancing
                        ? "Processing..."
                        : isGold
                          ? "Proceed →"
                          : canAdvance
                            ? "Advance →"
                            : `Complete ${2 - doneTasks} more task${2 - doneTasks !== 1 ? "s" : ""} to advance`}
                    </span>
                    {!isCurrentMapCheckpoint && doneTasks >= 2 && !isAdvancing && (
                      <span className="text-[8px] font-semibold normal-case tracking-normal opacity-70 text-amber-400/90">
                        You can advance from here
                      </span>
                    )}
                    {isGold && canAdvance && !isAdvancing && showBossGateHint && (
                      <span className="text-[8px] font-semibold normal-case tracking-normal opacity-80 text-amber-200/90">
                        Beat boss, then move ahead
                      </span>
                    )}
                    {canAdvance && !isGold && !isAdvancing && showBossGateHint && (
                      <span className="text-[8px] font-semibold normal-case tracking-normal opacity-70">
                        Boss encounter opens when you advance
                      </span>
                    )}
                  </span>
                </motion.button>

                {/* Contextual "Fire a Flare" — pre-fills the ventureId and
                    checkpointId so a responder sees exactly where the user
                    is stuck. Sits below the Advance button so it's easy to
                    reach when tasks feel blocked. */}
                <div className="pt-1">
                  <FlareTriggerButton
                    variant="subtle"
                    ventureId={ventureId}
                    checkpointId={detail.id as Id<"ventureCheckpoints">}
                  />
                </div>
              </div>
            )}
      </div>
    </motion.div>
  );
});

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

const TaskCard = memo(function TaskCardInner({
  task,
  locked,
  evaluationSummary,
  onToggle,
  onRedo,
}: {
  task: Task;
  index?: number;
  locked: boolean;
  evaluationSummary?: {
    taskStatus: string;
    isPending: boolean;
    evaluation: null | {
      qualityTier: string;
      totalScore: number;
      feedback?: string;
    };
  };
  onToggle: () => void;
  onRedo?: () => void;
}) {
  const accentColor =
    task.difficulty === "stretch"
      ? "#eab308" // Yellow 500
      : task.difficulty === "medium"
        ? "#a855f7" // Purple 500
        : "#6366f1"; // Indigo 500

  return (
    <motion.div
      onClick={locked ? undefined : task.done ? undefined : onToggle}
      onMouseEnter={() => {
        if (!locked && !task.done) audioManager.playUI("hover");
      }}
      whileHover={locked || task.done ? {} : { x: 4 }}
      whileTap={locked || task.done ? {} : { scale: 0.98 }}
      className="flex items-start gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl relative overflow-hidden group/task transition-colors"
      style={{
        background: task.done
          ? "rgba(99, 102, 241, 0.05)"
          : locked
            ? "rgba(255, 255, 255, 0.01)"
            : "rgba(255, 255, 255, 0.02)",
        border: "1px solid",
        borderColor: task.done
          ? "rgba(99, 102, 241, 0.2)"
          : locked
            ? "rgba(255, 255, 255, 0.02)"
            : "rgba(255,255,255,0.05)",
        cursor: locked ? "default" : task.done ? "default" : "pointer",
        opacity: locked ? 0.4 : task.done ? 0.6 : 1,
      }}
    >
      {/* Hover glow */}
      {!locked && !task.done && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover/task:opacity-100 transition-opacity" />
      )}
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg sm:rounded-l-xl"
        style={{
          background: task.done ? "#818cf8" : locked ? "#475569" : accentColor,
        }}
      />

      {/* Check circle */}
      <motion.div
        className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] sm:text-[10px] font-bold"
        style={{
          background: task.done
            ? "#6366f1"
            : locked
              ? "rgba(255,255,255,0.01)"
              : "rgba(255,255,255,0.05)",
          border: `1.5px solid ${task.done ? "#6366f1" : locked ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.15)"}`,
          color: task.done ? "#ffffff" : locked ? "#64748b" : "transparent",
        }}
        animate={task.done ? { scale: [0.8, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {task.done ? (
          "✓"
        ) : locked ? (
          <Lock className="h-2.5 w-2.5 text-slate-500" />
        ) : (
          ""
        )}
      </motion.div>

      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[12px] sm:text-[13px] leading-relaxed text-slate-300 font-medium flex-1">
            {task.description}
          </p>
          {/* Redo button - always visible for completed tasks */}
          {task.done && onRedo && !locked && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                audioManager.playTouch("click");
                onRedo();
              }}
              onMouseEnter={() => audioManager.playUI("hover")}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-[12px] font-black transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(139, 92, 246, 0.2))",
                border: "1px solid rgba(168, 85, 247, 0.5)",
                color: "#e9d5ff",
                boxShadow: "0 2px 8px rgba(168, 85, 247, 0.2)",
              }}
              title="Redo Task"
            >
              ↺
            </motion.button>
          )}
        </div>
        {evaluationSummary?.isPending && (
          <p className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-300">
            AI evaluating...
          </p>
        )}
        {/* Score badge (STANDARD · 8/12) hidden per user preference —
            keep evaluation data in state for combat logic but do not show
            the tier/score label on task cards. */}
      </div>
    </motion.div>
  );
});

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

function PhaseLaunchBanner({
  onOpenRoadmap,
  onClose,
}: {
  onOpenRoadmap: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute left-4 right-4 top-20 z-40 mx-auto max-w-3xl sm:left-20 sm:right-20"
    >
      <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/75 p-4 shadow-2xl backdrop-blur-xl relative group">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            audioManager.playTouch("click");
            onClose();
          }}
          onMouseEnter={() => audioManager.playUI("hover")}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] text-slate-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white z-10 shadow-sm"
        >
          ✕
        </motion.button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
              Phase 1 Launch Scope
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              Stages 1-2 are fully themed now. Stages 3-8 are live and playable,
              with additional biome polish rolling out in phases.
            </p>
          </div>
          <button
            onClick={() => {
              audioManager.playTouch("click");
              onOpenRoadmap();
            }}
            onMouseEnter={() => audioManager.playUI("hover")}
            className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-cyan-200 transition hover:bg-cyan-400/15"
          >
            View Roadmap
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StageResetNotice({
  baseBrightness,
  stage,
  onClose,
}: {
  baseBrightness: number;
  stage: number;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute bottom-16 left-1/2 z-40 w-[min(92vw,520px)] -translate-x-1/2 sm:bottom-28"
    >
      <div className="rounded-2xl border border-indigo-400/20 bg-slate-950/85 p-4 text-center shadow-2xl backdrop-blur-xl relative group">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            audioManager.playTouch("click");
            onClose();
          }}
          onMouseEnter={() => audioManager.playUI("hover")}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] text-slate-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white z-10 shadow-sm"
        >
          ✕
        </motion.button>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
          New Stage Unlocked
        </p>
        <p className="mt-1 text-sm text-white">
          Stage {stage} begins with your permanent base brightness at{" "}
          <span className="font-black text-indigo-300">
            {baseBrightness.toFixed(2)}%
          </span>
          . The extra stage glow builds back up as you complete this stage’s
          tasks.
        </p>
      </div>
    </motion.div>
  );
}

// TourToggle removed with the WorldMapTour walkthrough deletion.



/** Loading screen */
function LoadingScreen() {
  return (
    <div
      className="absolute inset-0 z-[60] flex flex-col items-center justify-center"
      style={{ background: "#050810" }}
    >
      <div
        className="map-load-glitch"
        data-text="Entering the World..."
      >
        Entering the World…
      </div>
      <div
        className="mt-6 h-[3px] w-40 rounded-full overflow-hidden relative"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <div
          className="absolute inset-y-0 left-0 w-[55%] rounded-full"
          style={{
            background: "linear-gradient(90deg, #4f46e5, #818cf8)",
            animation: "map-load-bar 0.65s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`
        .map-load-glitch {
          position: relative;
          color: #6366f1;
          font-family: "Courier New", "Lucida Console", monospace;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.16em;
          line-height: 1;
          text-transform: uppercase;
          text-shadow: 2px 0 0 rgba(129, 140, 248, 0.38);
          image-rendering: pixelated;
          animation: map-text-jitter 1.15s steps(2, end) infinite;
        }
        .map-load-glitch::before,
        .map-load-glitch::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.65;
        }
        .map-load-glitch::before {
          color: #818cf8;
          transform: translate3d(-1px, 0, 0);
          clip-path: inset(0 0 54% 0);
          animation: map-glitch-top 1.35s steps(2, end) infinite;
        }
        .map-load-glitch::after {
          color: #4f46e5;
          transform: translate3d(1px, 0, 0);
          clip-path: inset(48% 0 0 0);
          animation: map-glitch-bottom 1.05s steps(2, end) infinite;
        }
        @keyframes map-text-jitter {
          0%, 76%, 100% { transform: translate3d(0, 0, 0); }
          78% { transform: translate3d(1px, -1px, 0); }
          80% { transform: translate3d(-1px, 1px, 0); }
          82% { transform: translate3d(0, 0, 0); }
        }
        @keyframes map-glitch-top {
          0%, 72%, 100% { transform: translate3d(-1px, 0, 0); }
          74% { transform: translate3d(4px, -1px, 0); }
          77% { transform: translate3d(-3px, 1px, 0); }
        }
        @keyframes map-glitch-bottom {
          0%, 64%, 100% { transform: translate3d(1px, 0, 0); }
          66% { transform: translate3d(-4px, 1px, 0); }
          70% { transform: translate3d(3px, 0, 0); }
        }
        @keyframes map-load-bar {
          0% { transform: translate3d(-120%, 0, 0); }
          100% { transform: translate3d(220%, 0, 0); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

// Phase boundary checkpoint numbers (cumulative) — triggers phase-transition animation variant.
// Boundaries: Stage 1 ends at 4, Stage 2 at 9, Stage 3 at 13, Stage 4 at 18,
// Stage 5 at 24, Stage 6 at 27, Stage 7 at 31, Stage 8 at 36.
const PHASE_THRESHOLDS = new Set([4, 9, 13, 18, 24, 27, 31, 36]);

// Badge type shared between state and BadgeAwardSequence props
interface BadgePayload {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  shape?: string;
  isProfileStyle?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  tagline?: string;
  category?: string;
  awardedAt?: number;
  scoreEarned?: number;
}

function MapPageInner() {
  const { containerRef, phaserReady, gameRef } = useMapGame();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Stage-based scene routing — reads ?stage=N from the URL. Stage lock
  // (clamp to unlocked ceiling) applied lower down once `venture` loads.
  const paramStage = searchParams?.get("stage");
  const requestedStage = paramStage ? parseInt(paramStage, 10) : null;

  // STAGE_COMPLETE listener is registered further down, after
  // `activeVentureId` is defined — its handler needs a stable, current
  // reference to the venture id to persist stage advancement to Convex.
  useEffect(() => {
    if (!phaserReady || !gameRef.current) return;
    const stage =
      requestedStage && Number.isFinite(requestedStage)
        ? requestedStage
        : null;
    if (!stage || stage === 1) return; // Village is the default; nothing to swap
    const targetKey = STAGE_SCENE_KEY[stage];
    if (!targetKey) return;
    const sceneMgr = gameRef.current.scene;
    // Stop every registered scene, then start the target.
    for (const key of Object.values(STAGE_SCENE_KEY)) {
      if (sceneMgr.isActive(key) || sceneMgr.isVisible(key)) {
        sceneMgr.stop(key);
      }
    }
    sceneMgr.start(targetKey);
  }, [phaserReady, requestedStage, gameRef]);

  const {
    selectedConversationId,
    selectedIdeaId,
    selectedReceiverId,
    closeChat,
    resetSelection,
    openGroupChat,
  } = useChat();

  const handleSelectGroup = useCallback(
    (conversationId: Id<"conversations"> | undefined, ideaId: Id<"ideas">) => {
      openGroupChat(ideaId, conversationId);
    },
    [openGroupChat]
  );

  const handleSelectChannel = useCallback(
    (conversationId: Id<"conversations">) => {
      if (selectedIdeaId) {
        openGroupChat(selectedIdeaId, conversationId);
      }
    },
    [openGroupChat, selectedIdeaId]
  );

  const handleBack = useCallback(() => {
    if (selectedConversationId) {
      if (selectedIdeaId) {
        openGroupChat(selectedIdeaId, undefined);
      } else {
        resetSelection();
      }
    } else if (selectedIdeaId) {
      resetSelection();
    } else {
      resetSelection();
    }
  }, [selectedConversationId, selectedIdeaId, openGroupChat, resetSelection]);

  const handlePopupClose = useCallback(() => {
    setIsGroupChatOpen(false);
    closeChat();
  }, [closeChat]);

  const paramCheckpointId = searchParams.get("checkpointId");
  const paramPanel = searchParams.get("panel");
  const paramTab = searchParams.get("tab");
  const sourceIdeaId = searchParams.get("sourceIdeaId") as Id<"ideas"> | null;

  // Read window.location.search inline so this callback's identity is stable
  // across renders. searchParams (the Next.js hook value) gets a fresh ref
  // every render, which would invalidate every consumer of updateUrlParams
  // (eventBridge listeners, click handlers, advance callbacks).
  const updateUrlParams = useCallback(
    (newParams: Record<string, string | null>, replace = false) => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      const newUrl = `${pathname}?${params.toString()}`;
      if (replace) {
        router.replace(newUrl);
      } else {
        router.push(newUrl);
      }
    },
    [pathname, router],
  );

  // ── Read gender + stage from localStorage (set by /map and /map/stages) ──
  const [selectedGender, setSelectedGender] = useState<"male" | "female">(
    "male",
  );
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [preferredVentureId, setPreferredVentureId] = useState<string | null>(
    null,
  );
  const previousActiveRef = useRef<{ stage: number; checkpoint: number }>({
    stage: 1,
    checkpoint: 1,
  });
  const lastAutoOpenedStageRef = useRef(0);
  const hasAutoOpenedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const g = localStorage.getItem("selectedGender") as
      | "male"
      | "female"
      | null;
    if (g === "male" || g === "female") setSelectedGender(g);
    const s = localStorage.getItem("selectedStage");
    if (s) setSelectedStageId(parseInt(s, 10));
    const queryVentureId = searchParams.get("ventureId");
    if (queryVentureId) {
      // URL param is the authoritative source — overwrite localStorage and use it
      localStorage.setItem("activeVentureId", queryVentureId);
      setPreferredVentureId(queryVentureId);
    } else {
      // No URL param — use whatever was last cached (e.g. returning directly to /map/world)
      const storedVentureId = localStorage.getItem("activeVentureId");
      setPreferredVentureId(storedVentureId);
    }
  }, [searchParams]);

  // Mark the body so map-specific CSS (overscroll-behavior, overflow:hidden) applies
  // only here and never bleeds into other pages like the feed.
  useEffect(() => {
    document.body.setAttribute("data-page", "map");
    return () => {
      document.body.removeAttribute("data-page");
    };
  }, []);

  // Intercept browser back button and redirect to /my-ideas route
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Push a dummy state so that when the user clicks browser back, popstate fires
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      router.push("/my-ideas");
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

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
  const setCorruptionStateAtom = useSetAtom(corruptionStateAtom);
  const setCurrentQuestAtom = useSetAtom(currentQuestAtom);
  const setActiveTaskAtom = useSetAtom(activeTaskAtom);
  const setTemplateIdAtom = useSetAtom(templateIdAtom);
  const setTemplateMetricAtom = useSetAtom(templateMetricAtom);
  const [audioSettings, setAudioSettings] = useAtom(audioSettingsAtom);

  // ── Initialize audio settings from audioManager on first load ──────────────
  useEffect(() => {
    // Force reset to 100% volume if user has old localStorage values
    const VOLUME_VERSION = "v2"; // Increment this to force reset
    const savedVersion = localStorage.getItem("audioVolumeVersion");

    if (savedVersion !== VOLUME_VERSION) {
      // Clear old audio settings and set new defaults
      localStorage.removeItem("audioVolumes");
      localStorage.setItem("audioVolumeVersion", VOLUME_VERSION);
      console.log("[Audio] Resetting to 100% volume defaults");
    }

    // Sync atom with audioManager's localStorage values (or defaults)
    const volumes = audioManager.getVolumes();
    setAudioSettings({
      masterVolume: volumes.master,
      musicVolume: volumes.music,
      sfxVolume: volumes.sfx,
      uiVolume: volumes.ui,
      muted: volumes.muted,
      _backupMaster: volumes.master,
      _backupMusic: volumes.music,
      _backupSFX: volumes.sfx,
      _backupUI: volumes.ui,
    });
  }, []); // Run once on mount

  // ── Convex queries ─────────────────────────────────────────────────────────
  const ventures = useQuery(api.worldMap.getVenturesByUser);

  // Venture resolution priority:
  // 1. URL ?ventureId=<id>  → use ONLY that venture (idea-specific map).
  //    Never silently fall back to another — show "no venture" UI if not found.
  // 2. No URL param         → resume the last cached venture (e.g. nav icon tap).
  const hasUrlVentureParam = !!searchParams.get("ventureId");
  const ventureById = useQuery(
    api.worldMap.getVentureById,
    hasUrlVentureParam && preferredVentureId
      ? { ventureId: preferredVentureId as Id<"ventures"> }
      : "skip",
  );
  // Memoized so referential identity is stable across renders. Without
  // this, every Convex tick produces a fresh `activeVenture` object and
  // the 7+ queries below build new `{ ventureId }` arg literals, which
  // makes Convex's useQuery do a deep-equal check every render.
  const activeVenture = useMemo(
    () =>
      ventures?.find((venture) => venture._id === preferredVentureId) ??
      ventureById ??
      (hasUrlVentureParam ? null : (ventures?.[0] ?? null)),
    [ventures, ventureById, preferredVentureId, hasUrlVentureParam],
  );
  const activeVentureId = activeVenture?._id ?? null;
  const ventureArg = useMemo(
    () => (activeVentureId ? { ventureId: activeVentureId } : "skip"),
    [activeVentureId],
  );

  // Subscribe to notifications for gold checkpoint awards
  const notifications = useQuery(api.notifications.getNotifications, {
    filterReadStatus: "unread",
    filterType: "all",
  });

  const worldMapData = useQuery(api.worldMap.getWorldMapData, ventureArg);

  // Fetch chat channels for Group Chat popup modal integration
  const chatChannels = useQuery(
    api.communities.getChannels,
    activeVenture?.ideaId ? { ideaId: activeVenture.ideaId } : "skip",
  );
  const activeConversationId = chatChannels?.[0]?._id;

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

  // Suppress badge-award modals while the v2 product tutorial is running.
  // The tutorial has its own step-by-step guidance and a "Congratulations"
  // celebration screen popping up mid-flow (e.g. First Spark right after
  // the auto-submitted post) breaks the guided experience.
  const tutorialCtx = useTutorialOptional();
  const tutorialActive = !!tutorialCtx?.active;

  // Venture badge subscription (62-badge system)
  const ventureMyBadges = useQuery(
    api.badges.getVentureBadges,
    currentUser?._id ? { userId: currentUser._id } : "skip",
  );
  const prevVentureBadgeCountRef = useRef<number | null>(null);

  // Cumulative quality scores across ALL stages (grows checkpoint-by-checkpoint)
  const allStageQualities = useQuery(api.aiScoring.getVentureQualityScores, ventureArg);
  // Keep the per-stage query too (still used by the passage event overlay)
  const stageQualityArg = useMemo(
    () =>
      activeVentureId && worldMapData?.venture
        ? {
            ventureId: activeVentureId,
            stageNumber: worldMapData.venture.currentStage,
          }
        : "skip",
    [activeVentureId, worldMapData?.venture?.currentStage],
  );
  const stageQuality = useQuery(api.aiScoring.getStageQualityScore, stageQualityArg);

  // Template metric (JIF Score / p-value / Fan Score)
  const templateMetric = useQuery(
    api.templateMetrics.getTemplateMetric,
    ventureArg,
  );

  // ── Convex mutations ───────────────────────────────────────────────────────
  const advanceCheckpoint = useMutation(api.ventures.advanceCheckpoint);
  const advanceStage = useMutation(api.ventures.advanceStage);
  const ensureVentureStructure = useMutation(
    api.ventures.ensureVentureStructure,
  );
  const backfillPendingEvaluations = useMutation(
    api.worldMap.backfillPendingEvaluations,
  );
  const seedFlags = useMutation(api.aiScoring.seedFeatureFlags);
  const savePersonaGender = useMutation(api.worldMap.savePersonaGender);
  const markNotificationRead = useMutation(api.notifications.markAsRead);

  // ── Local UI state (non-persisted) ────────────────────────────────────────
  const [selectedDetail, setSelectedDetail] = useState<CheckpointDetail | null>(
    null,
  );
  // Deferred mount for CheckpointPanel — paint the skeleton on the
  // same frame as the click (instant feedback), then mount the heavy
  // panel content on the next frame. Old maps were taking 4,500ms
  // pointer INP because clicking a checkpoint synchronously triggered
  // panel mount + Convex subscriptions + Phaser camera tween before
  // the browser could paint. With this two-stage approach the click
  // commits immediately and the slow work happens AFTER paint.
  const deferredSelectedDetail = useDeferredValue(selectedDetail);
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(false);
  const [activeToolsTab, setActiveToolsTab] = useState<
    | "tools"
    | "calendar"
    | "kanban"
    | "roadmap"
    | "write"
    | "map"
    | "journal"
    | "survey"
    | "settings"
    | "help"
  >("tools");
  const [flashTrigger, setFlashTrigger] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showStageResetNotice, setShowStageResetNotice] = useState(false);
  const [showPhaseBanner, setShowPhaseBanner] = useState(true);
  const [isAdvancingCheckpoint, setIsAdvancingCheckpoint] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    oldLevel: number;
    newLevel: number;
    phase: number;
    isPhaseTransition: boolean;
    unlockedTools?: string[];
  }>({
    oldLevel: 1,
    newLevel: 2,
    phase: 1,
    isPhaseTransition: false,
    unlockedTools: [],
  });

  // Group chat popup modal state
  const [isGroupChatOpen, setIsGroupChatOpen] = useState(false);
  // PRD §2 v1.1 — sidebar-driven mini-games panel (replaced the
  // floating-dot easter-egg UX on the world map).
  const [isMiniGamesPanelOpen, setIsMiniGamesPanelOpen] = useState(false);
  const [isContributorsOpen, setIsContributorsOpen] = useState(false);
  const [isContributionsOpen, setIsContributionsOpen] = useState(false);
  const [isHierarchyOpen, setIsHierarchyOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isKanbanOpen, setIsKanbanOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);

  const saveToolData = useMutation(api.worldMap.saveToolData);
  const redoTask = useMutation(api.worldMap.redoTask);

  const kanbanData = useQuery(
    api.worldMap.getToolData,
    isKanbanOpen && activeVenture?._id
      ? { ventureId: activeVenture._id, toolType: "kanban" }
      : "skip",
  );

  const calendarData = useQuery(
    api.worldMap.getToolData,
    isCalendarOpen && activeVenture?._id
      ? { ventureId: activeVenture._id, toolType: "calendar" }
      : "skip",
  );

  const journalData = useQuery(
    api.worldMap.getToolData,
    isJournalOpen && activeVenture?._id
      ? { ventureId: activeVenture._id, toolType: "journal" }
      : "skip",
  );

  const handleToolSubmit = async (toolType: string, data: unknown) => {
    if (!activeVenture?._id) return;
    await saveToolData({
      ventureId: activeVenture._id,
      toolType,
      data,
    });
  };

  // Badge queue — pop-and-show one at a time
  const [badgeQueue, setBadgeQueue] = useState<BadgePayload[]>([]);
  const [activeBadge, setActiveBadge] = useState<BadgePayload | null>(null);
  const badgeBufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Tracks a timestamp of the last local task submission to suppress duplicate
  // DB-driven badge animations for the same event (within 5 seconds window).
  const recentTaskSubmitRef = useRef<number>(0);
  const shownBadgesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (badgeQueue.length === 0) {
      return;
    }

    if (activeBadge) return;

    if (badgeBufferTimeoutRef.current) {
      clearTimeout(badgeBufferTimeoutRef.current);
    }

    badgeBufferTimeoutRef.current = setTimeout(() => {
      setBadgeQueue((currentQueue) => {
        if (currentQueue.length === 0) return currentQueue;

        const taskBadges = currentQueue.filter((b) => b.id.startsWith("task_"));
        const dbBadges = currentQueue.filter((b) => !b.id.startsWith("task_"));

        if (dbBadges.length > 0) {
          // Priority 1: If database badges are present, choose the best one
          const rarityOrder = {
            legendary: 4,
            gold: 4,
            epic: 3,
            diamond: 3,
            rare: 2,
            silver: 2,
            uncommon: 1,
            bronze: 1,
            common: 0,
          };
          const getRarityWeight = (rarity?: string) => {
            if (!rarity) return 0;
            return rarityOrder[rarity.toLowerCase() as keyof typeof rarityOrder] ?? 0;
          };

          const bestDbBadge = [...dbBadges].sort(
            (a, b) => getRarityWeight(b.rarity) - getRarityWeight(a.rarity),
          )[0];

          setActiveBadge(bestDbBadge);
        } else if (taskBadges.length > 0) {
          // Priority 2: If only task badges, show the first one
          setActiveBadge(taskBadges[0]);
        }

        // Clear the entire queue since we only show one animation per batch
        return [];
      });
    }, 400);

    return () => {
      if (badgeBufferTimeoutRef.current) {
        clearTimeout(badgeBufferTimeoutRef.current);
      }
    };
  }, [badgeQueue, activeBadge]);

  // Tutorial: First checkpoint pulse
  const [showFirstCheckpointPulse, setShowFirstCheckpointPulse] =
    useState(false);

  // Gold checkpoint notification state
  const [goldCheckpointNotification, setGoldCheckpointNotification] = useState<{
    ventureName: string;
    stageName: string;
    checkpoint: number;
  } | null>(null);

  // Stage clear modal state
  const [stageClearModal, setStageClearModal] = useState<{
    show: boolean;
    stageNumber: number;
    stageName: string;
    isGold: boolean;
    medalTier?: "gold" | "silver" | "bronze";
    fromBiome?: string;
    nextStageName?: string;
    nextBiome?: string;
  }>({ show: false, stageNumber: 1, stageName: "", isGold: false });

  // Tour walkthrough state
  // showTour removed with WorldMapTour deletion — v2 tutorial replaces it.
  // New product-tour state. Used to suppress the legacy WorldMapTour
  // and to drive the first-checkpoint pulse for first-run users.
  const tourStateForPulse = useQuery(api.tutorial.getMyFeedTutorialState, {});

  // Inter-checkpoint events state
  const [interCheckpointQueue, setInterCheckpointQueue] = useState<Array<"henchman" | "treasure" | "shield" | "insight" | "clear">>([]);
  const [bypassInterCheckpoint, setBypassInterCheckpoint] = useState(false);

  // ── Boss combat gate: one fight per checkpoint before advance ─────────────
  const [bossDefeatedAtCheckpoint, setBossDefeatedAtCheckpoint] = useState<
    Set<string>
  >(() => new Set());
  const [bossCombatTarget, setBossCombatTarget] = useState<{
    stage: number;
    checkpoint: number;
    checkpointId: string;
    isLastInStage: boolean;
    isGold: boolean;
  } | null>(null);

  // HP-based Cross-Question Combat round id, fetched when boss combat target is set.
  const [activeCombatRoundId, setActiveCombatRoundId] = useState<string | null>(null);
  const [combatStartError, setCombatStartError] = useState<string | null>(null);
  const startCombatRoundMutation = useMutation(api.combat.startCombatRound);

  useEffect(() => {
    if (!bossCombatTarget) {
      setActiveCombatRoundId(null);
      setCombatStartError(null);
      return;
    }
    let cancelled = false;
    setCombatStartError(null);
    (async () => {
      try {
        const result = await startCombatRoundMutation({
          checkpointId: bossCombatTarget.checkpointId as Id<"ventureCheckpoints">,
        });
        if (!cancelled) setActiveCombatRoundId(result.roundId);
      } catch (err) {
        if (!cancelled) {
          setCombatStartError(
            err instanceof Error ? err.message : "Failed to start combat",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bossCombatTarget, startCombatRoundMutation]);

  // CombatPanel emits a `combat:retry-started` window event when the
  // player clicks "Retry Combat" on the defeat screen. The event detail
  // carries the new roundId from the server. We swap the active round
  // id here so the panel remounts with the new round and a fresh first
  // question.
  useEffect(() => {
    const onRetry = (e: Event) => {
      const detail = (e as CustomEvent<{ newRoundId: string }>).detail;
      if (detail?.newRoundId) {
        setActiveCombatRoundId(detail.newRoundId);
      }
    };
    window.addEventListener("combat:retry-started", onRetry);
    return () => window.removeEventListener("combat:retry-started", onRetry);
  }, []);

  const dismissBossCombatVisual = useCallback((stage: number) => {
    eventBridge.dispatchToPhaser({
      type: "BOSS_COMBAT_DISMISS",
      stage,
    });
  }, []);

  const interCheckpointData = useQuery(
    api.interCheckpoint.getInterCheckpointEvents,
    activeVenture
      ? {
        ventureId: activeVenture._id,
        currentStage: activeVenture.currentStage,
        currentCheckpoint: activeVenture.currentCheckpoint,
      }
      : "skip"
  );

  // Legacy WorldMapTour open/close effect removed — v2 Sparky is now the
  // only walkthrough on /map/world.

  // Task submission state (now using Jotai atom for global access)
  const [submittingTask, setSubmittingTask] = useAtom(submittingTaskAtom);
  const [optimisticCompletedTaskIds, setOptimisticCompletedTaskIds] = useState<
    Record<string, true>
  >({});

  // Track previous level to detect level-up events
  const prevLevelRef = useRef<number | null>(null);
  const prevStageRef = useRef<number>(1);
  const structureEnsuredForRef = useRef<string | null>(null);
  const lastVenturePhaserSyncRef = useRef<string | null>(null);
  const lastCheckpointPhaserSyncRef = useRef<string>("");
  const lastBrightnessPhaserSyncRef = useRef<number | null>(null);

  // ── Derived values from Convex ─────────────────────────────────────────────
  const venture = worldMapData?.venture ?? null;
  const ideaForContributors = useQuery(
    api.ideas.getIdeaById,
    venture?.ideaId ? { ideaId: venture.ideaId } : "skip",
  );
  const sourceIdea = useQuery(
    api.ideas.getIdeaById,
    sourceIdeaId ? { ideaId: sourceIdeaId } : "skip",
  );
  const templateStages = useMemo(
    () => getStageMetadata((venture?.templateId ?? "venture") as TemplateId),
    [venture?.templateId],
  );
  const totalCheckpointsForTemplate = useMemo(
    () => templateStages.reduce((sum, stage) => sum + stage.checkpoints, 0),
    [templateStages],
  );
  // Stable reference — avoids re-renders on every Convex tick
  const checkpoints = useMemo(
    () => worldMapData?.checkpoints ?? [],
    [worldMapData?.checkpoints],
  );

  const brightness = worldMapData?.brightness;
  const ideaTitle = sourceIdea?.title ?? worldMapData?.ideaTitle ?? "Your Venture";
  const superBoss = worldMapData?.superBoss ?? null;
  type WorldMapCheckpoint = (typeof checkpoints)[number];
  type WorldMapTask = WorldMapCheckpoint["tasks"][number];
  const checkpointEvaluationSummary = useQuery(
    api.aiScoring.getCheckpointEvaluationSummary,
    selectedDetail
      ? { checkpointId: selectedDetail.id as Id<"ventureCheckpoints"> }
      : "skip",
  );

  const activeStage = venture?.currentStage ?? 1;
  const activeCP = venture?.currentCheckpoint ?? 1;

  // Stage lock — if the URL requests a stage the user hasn't unlocked yet,
  // rewrite it to their actual currentStage. Prevents skipping progression
  // via URL fiddling and keeps deep-linked bookmarks honest.
  //
  // Note: allows +1 stage of "preview tour" access beyond currentStage,
  // so demo presenters can walk the next stage without playing through.
  // Real progression (task submits, boss defeats) still requires unlocking.
  useEffect(() => {
    // Dev bypass — `?stagelock=off` or NODE_ENV=development + explicit
    // opt-in URL param lets you preview any painted stage without
    // needing to actually progress a Convex venture through it.  Kept
    // opt-in even in dev so we don't hide the lock's normal behaviour
    // during regular testing.
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("stagelock") === "off"
    ) {
      return;
    }
    if (!venture) return;
    if (!requestedStage || !Number.isFinite(requestedStage)) return;
    const unlockedCeiling = (venture.currentStage ?? 1) + 1;
    if (requestedStage <= unlockedCeiling) return;
    const clamped = Math.max(1, unlockedCeiling);
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    if (clamped === 1) next.delete("stage");
    else next.set("stage", String(clamped));
    const qs = next.toString();
    router.replace(qs ? `/map/world?${qs}` : "/map/world", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venture?.currentStage, requestedStage]);

  useEffect(() => {
    if (!checkpoints.length) return;
    setBossDefeatedAtCheckpoint((prev) =>
      mergeBossDefeatedState(
        checkpoints,
        activeStage,
        activeCP,
        venture?._id,
        prev,
      ),
    );
  }, [venture?._id, activeStage, activeCP, checkpoints]);

  const startBossCombat = useCallback(
    (
      cp: { stage: number; checkpoint: number; _id: string },
      doneTasks: number,
    ) => {
      const isLastCp = isLastCheckpointInStage(
        checkpoints,
        cp.stage,
        cp.checkpoint,
      );
      setBossCombatTarget({
        stage: cp.stage,
        checkpoint: cp.checkpoint,
        checkpointId: cp._id,
        isLastInStage: isLastCp,
        isGold: doneTasks >= 3,
      });
      audioManager.playUI("confirm");
      eventBridge.dispatchToPhaser({
        type: "BOSS_COMBAT_START",
        stage: cp.stage,
        checkpoint: cp.checkpoint,
      });
    },
    [checkpoints],
  );

  const bossCombatTargetRef = useRef(bossCombatTarget);
  bossCombatTargetRef.current = bossCombatTarget;

  const bossFinishInFlightRef = useRef(false);

  const finishBossCombatAndAdvance = useCallback(() => {
    if (bossFinishInFlightRef.current) return;
    const target = bossCombatTargetRef.current;
    if (!target) return;
    bossFinishInFlightRef.current = true;

    const { stage, checkpoint, isLastInStage, isGold } = target;
    const key = checkpointBossKey(stage, checkpoint);
    setBossDefeatedAtCheckpoint((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    if (isLastInStage) {
      eventBridge.dispatchToPhaser({
        type: "BOSS_FINAL_OUTCOME",
        stage,
        outcome: isGold ? "slay_gold" : "retreat_permanent",
      });
    } else {
      eventBridge.dispatchToPhaser({
        type: "BOSS_COMBAT_RETREAT",
        stage,
        checkpoint,
      });
    }

    bossAdvanceCheckpointIdRef.current = target.checkpointId;
    setBossCombatTarget(null);
    advancingFromBossRef.current = true;
    void handleAdvanceRef.current(true, true, true);
  }, []);

  const showBossGateHint = useMemo(() => {
    if (!selectedDetail) return false;
    const cp = checkpoints.find((c) => c._id === selectedDetail.id);
    if (!cp) return false;
    const doneTasks = [cp.t1Completed, cp.t2Completed, cp.t3Completed].filter(
      Boolean,
    ).length;
    return needsCheckpointBossCombat(
      cp,
      doneTasks,
      bossDefeatedAtCheckpoint,
      activeStage,
      activeCP,
      tourStateForPulse?.state === "not_started" ||
        tourStateForPulse?.state === "in_progress",
    );
  }, [
    selectedDetail,
    checkpoints,
    bossDefeatedAtCheckpoint,
    activeStage,
    activeCP,
    tourStateForPulse,
  ]);
  const corruptionLevel = venture?.corruptionLevel ?? 0;
  const corruptionPhase = useMemo(() => {
    if (corruptionLevel >= 90) return "critical" as const;
    if (corruptionLevel >= 75) return "urgent" as const;
    if (corruptionLevel >= 50) return "desaturated" as const;
    if (corruptionLevel >= 25) return "creeping" as const;
    return "calm" as const;
  }, [corruptionLevel]);

  useEffect(() => {
    if (!venture) return;

    const previousStage = prevStageRef.current;
    if (activeStage > previousStage) {
      setViewingStage(activeStage);
      prevStageRef.current = activeStage;
    }

    prevStageRef.current = activeStage;
  }, [activeStage, venture]);

  useEffect(() => {
    if (!activeVenture || typeof window === "undefined") return;
    localStorage.setItem("activeVentureId", activeVenture._id);
  }, [activeVenture]);

  useEffect(() => {
    if (!activeVenture?._id) return;
    if (structureEnsuredForRef.current === activeVenture._id) return;
    // Skip when the viewer is not the venture owner. The mutation
    // requires assertVentureAccess, so for someone else's venture it
    // throws "no access" → catch resets the guard → effect re-fires
    // → infinite failing mutations, which is the dominant lag source
    // on forked-venture views. Stamping the guard with the activeVenture
    // id below ALSO suppresses retry when we did skip.
    if (!currentUser?._id || activeVenture.userId !== currentUser._id) {
      structureEnsuredForRef.current = activeVenture._id;
      return;
    }

    structureEnsuredForRef.current = activeVenture._id;
    ensureVentureStructure({ ventureId: activeVenture._id }).catch((error) => {
      console.error("[MapPage] Failed to ensure venture structure:", error);
      structureEnsuredForRef.current = null;
    });
  }, [activeVenture?._id, activeVenture?.userId, currentUser?._id, ensureVentureStructure]);

  useEffect(() => {
    if (!activeVenture?._id) return;
    backfillPendingEvaluations().catch((error) => {
      console.error("[MapPage] Failed to backfill pending evaluations:", error);
    });
  }, [activeVenture?._id, backfillPendingEvaluations]);

  // ── Detect gold checkpoint notifications ──────────────────────────────────
  // Bail BEFORE the work — previously the spread + sort over `checkpoints`
  // ran on every notifications poll even when there was nothing to show.
  // For advanced ventures `checkpoints` is 30+ items so that allocation
  // chain was paid constantly.
  useEffect(() => {
    if (!notifications || !venture) return;

    // Find unread gold checkpoint notification for this venture (only
    // need the first one — find is O(N) once, not filter+spread+sort).
    const latestNotif = notifications.find(
      (n) =>
        n.type === "gold_checkpoint" &&
        !n.isRead &&
        n.relatedId === venture._id,
    );
    if (!latestNotif) return;

    {
      // Single linear scan to find the most recently gold-completed
      // checkpoint instead of [...checkpoints].sort() (creates a new
      // 30-item array + an O(N log N) sort per run).
      let goldCp: typeof checkpoints[number] | undefined;
      let bestTs = -1;
      for (const cp of checkpoints) {
        if (
          cp.t1Completed &&
          cp.t2Completed &&
          cp.t3Completed &&
          (cp.completedAt ?? 0) > bestTs
        ) {
          bestTs = cp.completedAt ?? 0;
          goldCp = cp;
        }
      }

      const targetStage = goldCp?.stage ?? activeStage;
      const targetCP = goldCp?.checkpoint ?? activeCP;
      const stageData = templateStages[targetStage - 1];

      setGoldCheckpointNotification({
        ventureName: ideaTitle,
        stageName: stageData?.name ?? `Stage ${targetStage}`,
        checkpoint: targetCP,
      });

      // 🔊 Play gold coin SFX for the milestone reward
      audioManager.playGoldGain();

      // Mark notification as read so it doesn't re-trigger on next Convex poll
      markNotificationRead({ notificationId: latestNotif._id }).catch(() => {
        // Non-critical — ignore if notification already read
      });

      // Auto-dismiss gold popup after 6 seconds
      const autoDismissTimer = window.setTimeout(() => {
        setGoldCheckpointNotification(null);
      }, 6000);

      return () => window.clearTimeout(autoDismissTimer);
    }
  }, [
    notifications,
    venture,
    checkpoints,
    activeStage,
    activeCP,
    ideaTitle,
    markNotificationRead,
  ]);

  const completedCount = checkpoints.filter(
    (cp) =>
      cp.status === "completed" ||
      (cp.t1Completed && cp.t2Completed && cp.t3Completed),
  ).length;

  const buildCheckpointDetail = useCallback(
    (cp: WorldMapCheckpoint): CheckpointDetail => {
      const stageData = templateStages[cp.stage - 1];
      return {
        id: cp._id,
        stage: cp.stage,
        stageIdx: cp.stage,
        stageName: stageData?.name ?? `Stage ${cp.stage}`,
        biome: stageData?.biome ?? "Unknown Biome",
        stageGlow: stageData?.glow ?? "rgba(255,255,255,0.5)",
        checkpointIndex: cp.checkpoint,
        title: cp.checkpointName || `Checkpoint ${cp.checkpoint}`,
        outcome: cp.outcome || "Complete tasks to advance your venture.",
        status: deriveCheckpointStatus(cp, activeStage, activeCP),
        tasks: (cp.tasks || []).map((t: WorldMapTask, i: number) => ({
          label: t.taskLevel ? t.taskLevel.toUpperCase() : `TASK ${i + 1}`,
          description: t.prompt || "No description provided.",
          tool: t.toolType || "Unknown Tool",
          difficulty:
            t.taskLevel === "t1"
              ? "easy"
              : t.taskLevel === "t2"
                ? "medium"
                : "stretch",
          done: !!optimisticCompletedTaskIds[t._id] || t.status === "completed",
          _taskId: t._id,
          _convexCheckpointId: cp._id,
          _taskLevel: t.taskLevel,
        })),
      };
    },
    [activeStage, activeCP, optimisticCompletedTaskIds],
  );

  // Refresh selectedDetail when checkpoints tick — but read prev via the
  // setter form so this effect doesn't depend on selectedDetail (which it
  // sets), preventing a self-perpetuating cascade.
  useEffect(() => {
    setSelectedDetail((prev) => {
      if (!prev) return prev;
      const latestSelected = checkpoints.find((cp) => cp._id === prev.id);
      if (!latestSelected) return null;

      const refreshedDetail = buildCheckpointDetail(latestSelected);
      const taskStatesChanged = refreshedDetail.tasks.some(
        (task, index) => task.done !== prev.tasks[index]?.done,
      );

      if (
        refreshedDetail.status !== prev.status ||
        refreshedDetail.title !== prev.title ||
        refreshedDetail.outcome !== prev.outcome ||
        taskStatesChanged
      ) {
        return refreshedDetail;
      }
      return prev;
    });
  }, [checkpoints, buildCheckpointDetail]);

  // ── Sync URL Query Parameters to React state ───────────────────────────────
  // Must include `checkpoints` in deps: if the URL loads with a
  // ?checkpointId=... before the checkpoints Convex query resolves,
  // the initial run of this effect sees an empty checkpoints array,
  // finds nothing, and sets selectedDetail = null. The refresh effect
  // above only reruns when `prev` is non-null, so without a rerun here
  // once checkpoints arrive, the panel never opens (user reported this
  // — task column not visible on /map/world?checkpointId=... after
  // Step2's auto-navigate). Adding checkpoints + buildCheckpointDetail
  // to deps makes the sync try again when the query lands.
  useEffect(() => {
    // 1. Sync Checkpoint detail panel state
    if (paramCheckpointId) {
      const cp = checkpoints.find((c) => c._id === paramCheckpointId);
      if (cp) {
        setSelectedDetail(buildCheckpointDetail(cp));
      } else if (checkpoints.length > 0) {
        // We have checkpoints loaded but the ID isn't among them — the URL
        // param is stale. Clear it.
        setSelectedDetail(null);
      }
      // else: checkpoints still loading, do nothing (rerun once loaded)
    } else {
      setSelectedDetail(null);
    }

    // 2. Sync Tools panel state
    if (paramPanel === "tools") {
      setIsToolsPanelOpen(true);
      if (paramTab) {
        setActiveToolsTab(paramTab as any);
      }
    } else {
      setIsToolsPanelOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramCheckpointId, paramPanel, paramTab, checkpoints, buildCheckpointDetail]);

  // ── Auto-open current active checkpoint on mount if no param is set ────────
  useEffect(() => {
    if (checkpoints.length > 0 && activeStage && activeCP && !paramCheckpointId && !hasAutoOpenedRef.current) {
      const activeCheckpoint = checkpoints.find(
        (cp) => cp.stage === activeStage && cp.checkpoint === activeCP,
      );
      if (activeCheckpoint) {
        hasAutoOpenedRef.current = true;
        updateUrlParams({ checkpointId: activeCheckpoint._id }, true);
      }
    }
  }, [checkpoints, activeStage, activeCP, paramCheckpointId, updateUrlParams]);

  useEffect(() => {
    const previousActive = previousActiveRef.current;
    const activeChanged =
      previousActive.stage !== activeStage ||
      previousActive.checkpoint !== activeCP;

    if (activeChanged) {
      const stageChanged = previousActive.stage !== activeStage;

      if (selectedDetail) {
        const wasFollowingPreviousActive =
          selectedDetail.stage === previousActive.stage &&
          selectedDetail.checkpointIndex === previousActive.checkpoint;

        if (wasFollowingPreviousActive) {
          // Panel was open on the old active checkpoint — auto-advance it to
          // the new active checkpoint (same-stage or cross-stage).
          const nextActiveCheckpoint = checkpoints.find(
            (cp) => cp.stage === activeStage && cp.checkpoint === activeCP,
          );
          if (nextActiveCheckpoint) {
            updateUrlParams({ checkpointId: nextActiveCheckpoint._id }, true);
          }
        }
      } else if (
        stageChanged &&
        lastAutoOpenedStageRef.current !== activeStage
      ) {
        const newActiveCheckpoint = checkpoints.find(
          (cp) => cp.stage === activeStage && cp.checkpoint === activeCP,
        );
        if (newActiveCheckpoint) {
          lastAutoOpenedStageRef.current = activeStage;
          updateUrlParams({ checkpointId: newActiveCheckpoint._id }, true);
          if (phaserReady) {
            window.requestAnimationFrame(() => {
              eventBridge.dispatchToPhaser({
                type: "SCROLL_TO_CHECKPOINT",
                checkpointId: newActiveCheckpoint._id,
              });
            });
          }
        }
      }
    }

    previousActiveRef.current = { stage: activeStage, checkpoint: activeCP };
  }, [
    activeStage,
    activeCP,
    checkpoints,
    selectedDetail,
    updateUrlParams,
    phaserReady,
  ]);

  // ── Persist gender to DB whenever venture + gender are known ─────────────
  // Only writes when the viewer owns the venture — otherwise we'd
  // silently overwrite the author's persona gender on every visit to
  // their map.
  useEffect(() => {
    if (!activeVenture?._id || !selectedGender) return;
    if (!currentUser?._id || activeVenture.userId !== currentUser._id) return;
    savePersonaGender({
      ventureId: activeVenture._id,
      gender: selectedGender,
    }).catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVenture?._id, activeVenture?.userId, currentUser?._id, selectedGender]);

  // Seed feature flags once on first load (idempotent mutation)
  const flagsSeededRef = useRef(false);
  useEffect(() => {
    if (flagsSeededRef.current) return;
    flagsSeededRef.current = true;
    seedFlags().catch(() => {
      // Non-critical — silently ignore if already seeded
    });
  }, [seedFlags]);

  // Listen for the tutorial's "Start the fight" button. Forces the
  // CombatPanel open on the active checkpoint without making the user
  // grind tasks first.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      if (!activeVenture) return;
      const cp = checkpoints.find(
        (c) => c.stage === activeStage && c.checkpoint === activeCP,
      );
      if (!cp) return;
      const doneTasks = [cp.t1Completed, cp.t2Completed, cp.t3Completed].filter(
        Boolean,
      ).length;
      startBossCombat(cp, doneTasks);
    };
    window.addEventListener("tutorial:force-combat", handler);
    return () => window.removeEventListener("tutorial:force-combat", handler);
  }, [activeVenture, checkpoints, activeStage, activeCP, startBossCombat]);

  // Show first-checkpoint pulse for new users on their first venture
  // (stage 1, checkpoint 1). Two trigger paths:
  //   1. The legacy map-intro tutorial flag in localStorage.
  //   2. The new product tour state from Convex (feedTutorialState).
  // Either is enough.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!phaserReady || checkpoints.length === 0) return;
    if (activeStage !== 1 || activeCP !== 1) return;

    const pulseShown =
      localStorage.getItem("first_checkpoint_pulse_shown") === "true";
    if (pulseShown) return;

    const legacyTutorialDone =
      localStorage.getItem("tutorial_completed") === "true";
    const newTourActive =
      tourStateForPulse?.state === "in_progress" ||
      tourStateForPulse?.state === "not_started";

    if (legacyTutorialDone || newTourActive) {
      setShowFirstCheckpointPulse(true);
    }
  }, [phaserReady, checkpoints, activeStage, activeCP, tourStateForPulse]);

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

  // Cumulative score/value grows stage-by-stage (sum of stages 1..activeStage)
  const { qualityScore, valuationScore } = useMemo(() => {
    if (!allStageQualities) {
      return { qualityScore: 0, valuationScore: 0 };
    }

    return computeCumulativeVentureScores(
      allStageQualities.map((row) => ({
        stageNumber: row.stageNumber,
        totalScore: row.totalScore ?? 0,
        valuationScore: row.valuationScore ?? 0,
      })),
      activeStage,
    );
  }, [allStageQualities, activeStage]);

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
      // Skip if a local task submission just happened — the task badge from
      // handleTaskSubmissionSuccess already covers this animation.
      const msSinceSubmit = Date.now() - recentTaskSubmitRef.current;
      if (msSinceSubmit < 5000) {
        prevBadgeCountRef.current = count;
        return;
      }

      // Skip while the v2 tutorial is active — badges awarded during the
      // guided flow (e.g. First Spark from the auto-submitted post) show
      // up right when Sparky is teaching the first task and derail the
      // guided experience. The badge is still recorded server-side; the
      // user just sees the celebration modal later.
      if (tutorialActive) {
        prevBadgeCountRef.current = count;
        return;
      }

      // New badge(s) awarded — enqueue them
      const newCount = count - prevBadgeCountRef.current;
      const newBadges = myBadges.slice(0, newCount);
      const payloads: BadgePayload[] = newBadges.map((b) => ({
        id: b._id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        rarity: b.rarity,
        awardedAt: b.awardedAt,
      }));
      console.log(`[MapPage] 🎖️ New badge(s) detected: ${newCount}`, payloads);
      setBadgeQueue((q) => {
        const existingNames = new Set(q.map((b) => b.name));
        const unique = payloads.filter((p) => !existingNames.has(p.name) && !shownBadgesRef.current.has(p.name));
        return [...q, ...unique];
      });
    }

    prevBadgeCountRef.current = count;
  }, [myBadges, tutorialActive]);

  // ── Detect new venture badges (62-badge system) ───────────────────────────
  useEffect(() => {
    if (!ventureMyBadges) return;
    const count = ventureMyBadges.length;

    if (
      prevVentureBadgeCountRef.current !== null &&
      count > prevVentureBadgeCountRef.current
    ) {
      // Skip if a local task submission just happened — the task badge from
      // handleTaskSubmissionSuccess already covers this animation.
      const msSinceSubmit = Date.now() - recentTaskSubmitRef.current;
      if (msSinceSubmit < 5000) {
        prevVentureBadgeCountRef.current = count;
        return;
      }

      // Skip while the v2 tutorial is active — see the myBadges effect above.
      if (tutorialActive) {
        prevVentureBadgeCountRef.current = count;
        return;
      }

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
          icon: getVentureBadgeEmoji(b.badgeId, b.definition!.name),
          rarity: b.definition!.rarity as
            | "common"
            | "uncommon"
            | "rare"
            | "epic"
            | "legendary",
          category: b.definition!.category,
          shape: b.definition!.shape,
          primaryColor: b.definition!.primaryColor,
          secondaryColor: b.definition!.secondaryColor,
          tagline: b.definition!.tagline,
          awardedAt: b.awardedAt,
        }));

      if (payloads.length > 0) {
        console.log(
          `[MapPage] 🏆 New venture badge(s) detected: ${newCount}`,
          payloads,
        );
        setBadgeQueue((q) => {
          const existingNames = new Set(q.map((b) => b.name));
          const unique = payloads.filter((p) => !existingNames.has(p.name) && !shownBadgesRef.current.has(p.name));
          console.log(
            `[MapPage] Badge queue updated: ${unique.length} new, ${q.length} existing`,
          );
          return [...q, ...unique];
        });
      }
    }

    prevVentureBadgeCountRef.current = count;
  }, [ventureMyBadges, tutorialActive]);

  // ── Play biome ambience + stage music whenever the DISPLAYED stage changes.
  //     Uses the URL-requested stage (?stage=N) when present so the user
  //     hears Forest music while walking the Forest map, even if Convex
  //     venture.currentStage hasn't caught up yet (demo path where CPs
  //     aren't all persisted-complete).
  useEffect(() => {
    if (!phaserReady) return;
    const templateId = (activeVenture?.templateId ?? "venture") as "venture" | "academic" | "lab" | "creative";
    const displayedStage =
      requestedStage && Number.isFinite(requestedStage) && requestedStage >= 1
        ? requestedStage
        : activeStage;
    audioManager.playAmbienceForTemplate(templateId, displayedStage);
    audioManager.playStageMusic(displayedStage);
  }, [activeStage, requestedStage, activeVenture?.templateId, phaserReady]);

  // ── Detect level-up → trigger LevelUpSequence + fanfare ──────────────────
  // Handles multi-level progression (XP overflow) - shows all levels gained in one animation
  useEffect(() => {
    if (levelData === undefined) return;

    if (prevLevelRef.current !== null && level > prevLevelRef.current) {
      const levelsGained = level - prevLevelRef.current;
      const isMultiLevel = levelsGained > 1;

      // Query unlocked tools from level definitions
      const levelDef = LEVEL_DEFINITIONS.find((def) => def.level === level);
      const unlockedTools = levelDef?.unlockedTools || [];

      setLevelUpData({
        oldLevel: prevLevelRef.current,
        newLevel: level,
        phase: levelPhase,
        isPhaseTransition: PHASE_THRESHOLDS.has(level),
        unlockedTools,
      });
      setShowLevelUp(true);

      // Enhanced logging for multi-level gains
      if (isMultiLevel) {
        console.log(
          `[MapPage] 🎉 MULTI-LEVEL UP! ${prevLevelRef.current} → ${level} (+${levelsGained} levels) - XP overflow handled`,
        );
      } else {
        console.log(`[MapPage] Level-up: ${prevLevelRef.current} → ${level}`);
      }
    }
    prevLevelRef.current = level;
  }, [level, levelPhase, levelData]);

  // ── Sync Convex data → Jotai HUD atoms ────────────────────────────────────
  useEffect(() => {
    if (!venture) return;

    const stageData = templateStages[activeStage - 1];

    setActiveVentureAtom({
      id: venture._id,
      name: ideaTitle,
      currentStage: activeStage,
      currentCheckpoint: activeCP,
      totalCheckpoints: totalCheckpointsForTemplate,
    });

    setStageInfoAtom({
      stageName: stageData?.name ?? "Ideation",
      stageIcon: stageData?.icon ?? "💡",
      biomeName: stageData?.biome ?? "The Village",
      stage: activeStage,
      currentCheckpoint: activeCP,
      totalCheckpointsInStage: stageData?.checkpoints ?? 4,
    });

    const goldCount = checkpoints.filter(
      (cp) => cp.t1Completed && cp.t2Completed && cp.t3Completed,
    ).length;

    setCheckpointProgressAtom({
      completed: completedCount,
      total: totalCheckpointsForTemplate,
      goldCount,
    });

    // Populate current quest and active task atoms
    const currentCPData = checkpoints.find(
      (cp) => cp.stage === activeStage && cp.checkpoint === activeCP,
    );

    if (currentCPData) {
      setCurrentQuestAtom({
        checkpointName: currentCPData.checkpointName,
        tasks: currentCPData.tasks.map((t: WorldMapTask) => ({
          id: t._id,
          checkpointId: t.checkpointId,
          taskLevel: t.taskLevel,
          label: t.taskLevel.toUpperCase(),
          description: t.prompt,
          tool: t.toolType,
          points: t.taskLevel === "t3" ? 35 : 20,
          done: !!optimisticCompletedTaskIds[t._id] || t.status === "completed",
        })),
        stage: activeStage,
        checkpoint: activeCP,
      });

      // Find first uncompleted task
      const nextTask = currentCPData.tasks.find(
        (t: WorldMapTask) =>
          !optimisticCompletedTaskIds[t._id] && t.status !== "completed",
      );
      if (nextTask) {
        setActiveTaskAtom({
          id: nextTask._id,
          checkpointId: nextTask.checkpointId,
          taskLevel: nextTask.taskLevel,
          title:
            nextTask.taskLevel.toUpperCase() +
            ": " +
            currentCPData.checkpointName,
          description: nextTask.prompt,
          toolType: nextTask.toolType,
          points:
            nextTask.taskLevel === "t1"
              ? 20
              : nextTask.taskLevel === "t2"
                ? 20
                : 35,
        });
      } else {
        setActiveTaskAtom(null);
      }
    }

    setCorruptionStateAtom({
      level: corruptionLevel,
      phase: corruptionPhase,
      bossName:
        superBoss?.definition?.name ?? superBoss?.bossName ?? "Unknown Boss",
      bossHp: superBoss?.currentHp ?? 100,
      bossBaseHp: superBoss?.baseHp ?? 100,
    });
  }, [
    venture,
    ideaTitle,
    activeStage,
    activeCP,
    checkpoints,
    completedCount,
    corruptionLevel,
    corruptionPhase,
    optimisticCompletedTaskIds,
    superBoss,
    setActiveVentureAtom,
    setStageInfoAtom,
    setCheckpointProgressAtom,
    setCorruptionStateAtom,
    setCurrentQuestAtom,
    setActiveTaskAtom,
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

  // ── Sync template metric to HUD atom ──────────────────────────────────────────
  useEffect(() => {
    if (templateMetric) {
      setTemplateMetricAtom(templateMetric);
    }
  }, [templateMetric, setTemplateMetricAtom]);

  // ── Sync template ID to HUD atom ──────────────────────────────────────────────
  useEffect(() => {
    if (venture?.templateId) {
      setTemplateIdAtom(venture.templateId);
    }
  }, [venture?.templateId, setTemplateIdAtom]);

  // ── Also listen for BADGE_AWARDED events dispatched via the event bridge ──
  // (Covers Phaser-side badge triggers in addition to the Convex subscription)
  useEffect(() => {
    const handleBadge = (event: BadgePayload) => {
      setBadgeQueue((q) => {
        // Deduplicate — don't show same badge twice if subscription already caught it
        if (q.some((b) => b.id === event.id)) return q;
        return [...q, event];
      });
    };
    eventBridge.onReact("BADGE_AWARDED", handleBadge);
    return () => eventBridge.off("BADGE_AWARDED", handleBadge);
  }, []);

  // ── Village demo — final celebration on Unraveller reveal ────────────────
  // The Phaser scene fires VILLAGE_COMPLETE 4s after the boss taunt lands.
  // We render VillageCompleteCelebration as a full-screen overlay to close
  // the emotional arc of Stage 1.
  const [villageComplete, setVillageComplete] = useState<{
    open: boolean;
    checkpointsCleared: number;
    tasksCompleted: number;
  }>({ open: false, checkpointsCleared: 4, tasksCompleted: 12 });

  useEffect(() => {
    const handleVillageComplete = (event: {
      checkpointsCleared: number;
      tasksCompleted: number;
    }) => {
      setVillageComplete({
        open: true,
        checkpointsCleared: event.checkpointsCleared,
        tasksCompleted: event.tasksCompleted,
      });
    };
    eventBridge.onReact("VILLAGE_COMPLETE", handleVillageComplete);
    return () => eventBridge.off("VILLAGE_COMPLETE", handleVillageComplete);
  }, []);

  // ── Venture-wide finale — fires when the final stage (Artisans / 4) is
  //     cleared. The STAGE_COMPLETE event carries `nextStage > 4` in that
  //     case; we open the VentureCompleteCelebration overlay instead of
  //     navigating (there's no stage 5 art yet).
  const [ventureComplete, setVentureComplete] = useState<{
    open: boolean;
    stagesCleared: number;
  }>({ open: false, stagesCleared: 4 });

  // ── Super-boss encounter overlay — opens when Forest/Harbor/Artisans
  //     scenes fire SUPER_BOSS_ENCOUNTER after CP4 mini-boss clears.
  //     The player commits to a "final blow" CTA; on click we call the
  //     scene's defeatSuperBoss() which plays the defeat beat and then
  //     fires STAGE_COMPLETE, wired above.
  const [superBossEncounter, setSuperBossEncounter] = useState<{
    open: boolean;
    stage: number;
    boss: StageBoss | null;
  }>({ open: false, stage: 0, boss: null });

  // Brief toast between mid-arc stage transitions (Forest→Harbor and
  // Harbor→Artisans). Village→Forest has the fuller celebration, and
  // Stage 4 finish has the venture finale, so this only fires for
  // clearedStage of 2 or 3.
  const [stageCleared, setStageCleared] = useState<{ open: boolean; stage: number }>({
    open: false,
    stage: 0,
  });

  useEffect(() => {
    const handleEncounter = (e: { stage: number; bossSlug?: string }) => {
      const boss = getStageSuperBoss(e.stage);
      setSuperBossEncounter({ open: true, stage: e.stage, boss });
      // Layer a dramatic boss theme over the stage ambience for the
      // encounter's duration. Pick track by boss family so each stage's
      // super boss has a distinct sonic identity.
      //   plant → Pale Architect (Forest Colossus)
      //   serpent → Gravemind (Leviathan / Forge Dragon)
      //   default → Unraveller (Village fallback)
      try {
        let track = "boss_unraveller";
        if (boss?.family === "plant") track = "boss_pale_architect";
        else if (boss?.family === "serpent") track = "boss_gravemind";
        audioManager.playMusic(track, 0.55);
      } catch {
        /* audio failure non-blocking */
      }
    };
    eventBridge.onReact("SUPER_BOSS_ENCOUNTER", handleEncounter);
    return () => eventBridge.off("SUPER_BOSS_ENCOUNTER", handleEncounter);
  }, []);

  // Listen for STAGE_COMPLETE events from Forest/Harbor/Artisans scenes.
  // Persists progression to Convex via advanceStage (idempotent — the
  // Convex-side tryAdvanceStage guards with a "all CPs of stage marked
  // completed" check, so this is safe to fire opportunistically).
  //
  // If nextStage <= 4: we swap URL to load next stage.
  // If nextStage > 4: we open the venture-wide finale overlay.
  useEffect(() => {
    const handleStageComplete = (e: { stage: number; nextStage: number }) => {
      // Fire Convex persistence in the background — never block the UX on it.
      if (activeVentureId) {
        advanceStage({ ventureId: activeVentureId as Id<"ventures"> }).catch(
          (err) => {
            console.warn("[stage-complete] advanceStage failed:", err);
          },
        );
      }

      // Venture-wide finale trigger.  Post spec-realignment (Harbor
      // moved to stage 6) the last playable stage in the 4-map demo is
      // Harbor.  When Harbor clears (nextStage advances beyond the
      // painted stages we own), fire the venture-complete overlay.
      const HAS_ART_STAGES = new Set([1, 2, 3, 4, 5, 6, 7]);
      if (!HAS_ART_STAGES.has(e.nextStage)) {
        setVentureComplete({ open: true, stagesCleared: 4 });
        return;
      }
      // Mid-arc transitions (Forest→Artisans, Artisans→Harbor): brief
      // cleared-toast for atmosphere.  Stage 1→2 uses the fuller
      // VillageCompleteCelebration path elsewhere.
      if (e.stage === 2 || e.stage === 4) {
        setStageCleared({ open: true, stage: e.stage });
      }
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.set("stage", String(e.nextStage));
      router.replace(`/map/world?${next.toString()}`, { scroll: false });
    };
    eventBridge.onReact("STAGE_COMPLETE", handleStageComplete);
    return () => eventBridge.off("STAGE_COMPLETE", handleStageComplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVentureId]);

  // ── Sync venture identity → Phaser (not on every task/checkpoint tick) ───────
  useEffect(() => {
    if (!phaserReady || !venture) return;

    const corruptionBucket = Math.round(corruptionLevel);
    const superBossKey = superBoss
      ? `${superBoss.bossSlug}:${superBoss.visualStatus}:${superBoss.status}`
      : "none";
    const ventureSyncKey = [
      venture._id,
      venture.templateId ?? "venture",
      selectedGender,
      corruptionBucket,
      superBossKey,
      worldMapData?.projectState ?? "",
    ].join("|");

    if (lastVenturePhaserSyncRef.current === ventureSyncKey) return;
    lastVenturePhaserSyncRef.current = ventureSyncKey;

    eventBridge.dispatchToPhaser({
      type: "SET_ACTIVE_VENTURE",
      ventureId: venture._id,
      templateId: venture.templateId ?? "venture",
      personaGender: selectedGender,
      userName: currentUser?.displayName || currentUser?.username || "User",
      userImageUrl: currentUser?.displayName
        ? `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(currentUser.displayName)}&size=128&backgroundColor=transparent`
        : currentUser?.username
          ? `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(currentUser.username)}&size=128&backgroundColor=transparent`
          : "https://api.dicebear.com/7.x/adventurer/png?seed=User&size=128&backgroundColor=transparent",
      assignedBosses: Array.isArray(venture.assignedBosses)
        ? venture.assignedBosses.map(String)
        : [],
      currentStage: activeStage,
      corruptionLevel,
      superBoss: superBoss
        ? {
          bossSlug: superBoss.bossSlug,
          bossName:
            superBoss.definition?.name ??
            superBoss.bossName ??
            "Unknown Boss",
          visualStatus: superBoss.visualStatus,
          status: superBoss.status,
          defeatVariant:
            worldMapData?.projectState === "project_perfect"
              ? "gold"
              : "standard",
        }
        : undefined,
    } as Parameters<typeof eventBridge.dispatchToPhaser>[0]);
  }, [
    phaserReady,
    venture?._id,
    venture?.templateId,
    venture?.assignedBosses,
    selectedGender,
    corruptionLevel,
    superBoss?.bossSlug,
    superBoss?.visualStatus,
    superBoss?.status,
    superBoss?.definition?.name,
    superBoss?.bossName,
    worldMapData?.projectState,
    activeStage,
    currentUser?.displayName,
    currentUser?.username,
  ]);

  // ── Live corruption meter → Phaser map visuals ─────────────────────────────
  useEffect(() => {
    if (!phaserReady || !venture) return;
    eventBridge.dispatchToPhaser({
      type: "UPDATE_CORRUPTION",
      corruptionLevel,
    });
  }, [phaserReady, venture?._id, corruptionLevel]);

  // ── Sync checkpoint progress → Phaser (deduped by signature) ───────────────
  useEffect(() => {
    if (!phaserReady || !venture || checkpoints.length === 0) return;

    const signature = buildCheckpointSyncSignature(
      checkpoints,
      activeStage,
      activeCP,
      deriveCheckpointStatus,
    );
    if (lastCheckpointPhaserSyncRef.current === signature) return;
    lastCheckpointPhaserSyncRef.current = signature;

    eventBridge.dispatchToPhaser({
      type: "UPDATE_CHECKPOINTS",
      checkpoints: mapCheckpointsToPhaserState(
        checkpoints,
        activeStage,
        activeCP,
        deriveCheckpointStatus,
      ),
    });
  }, [phaserReady, venture?._id, checkpoints, activeStage, activeCP]);

  // ── PRD §2 — mini-game lifecycle hook + Phaser sync ───────────────────────
  const miniGameLifecycle = useMiniGameLifecycle(
    venture?._id as Id<"ventures"> | undefined,
  );
  const miniGamePhase = miniGameLifecycle.phase;
  const miniGameCompletedSpawnIds = miniGameLifecycle.completedSpawnIds;

  // Belt-and-suspenders: whenever the mini-game phase returns to idle
  // (game finished, abandoned, or dismissed), force a re-focus + scroll
  // unlock. Prevents "map stuck after mini-game" reports caused by the
  // sub-Phaser instance leaving stray global listeners or the scroll
  // lock counter drifting past zero.
  useEffect(() => {
    if (miniGamePhase.kind !== "idle") return;
    // Delay so it runs after React has unmounted the overlay.
    const t = window.setTimeout(() => {
      if (typeof window !== "undefined") {
        window.focus();
        // If document.body still has overflow:hidden but no active
        // scroll-lock consumer (Radix Dialog, tutorial, celebration),
        // stomp it clear. Defensive — never runs if a real overlay is open.
        const openDialogs = document.querySelectorAll("[role='dialog'][data-state='open']").length;
        if (openDialogs === 0 && document.body.style.overflow === "hidden") {
          document.body.style.overflow = "";
          document.documentElement.style.overflow = "";
          document.body.style.paddingRight = "";
        }
      }
    }, 100);
    return () => window.clearTimeout(t);
  }, [miniGamePhase.kind]);

  // The "completed-checkpoint" set Phaser uses to gate spawn visibility.
  // Format mirrors the Phaser-side node-key: "{stage}-{checkpoint}".
  const miniGameCheckpointGate = useMemo(() => {
    return checkpoints
      .filter((c) => deriveCheckpointStatus(c, activeStage, activeCP) === "completed"
        || deriveCheckpointStatus(c, activeStage, activeCP) === "gold")
      .map((c) => `${c.stage}-${c.checkpoint}`);
  }, [checkpoints, activeStage, activeCP]);

  useEffect(() => {
    if (!phaserReady) return;
    eventBridge.dispatchToPhaser({
      type: "MINIGAME_SYNC_STATE",
      completedCheckpointIds: miniGameCheckpointGate,
      completedSpawnIds: miniGameCompletedSpawnIds,
    });
  }, [phaserReady, miniGameCheckpointGate, miniGameCompletedSpawnIds]);

  // Bridge: Phaser fires MINIGAME_SPAWN_ACTIVATED → hook opens the prompt.
  // Prefer the Convex-registered config (canonical difficulty/flavor), but
  // fall back to the event payload for demo/dev spawns that Phaser adds
  // ad-hoc without a matching Convex row (e.g. the visible near-CP1 tag).
  useEffect(() => {
    const handler = (e: {
      spawnPointId: string;
      stage: number;
      archetype: "pattern_match" | "reflex_tap" | "decrypt";
      difficulty: 1 | 2 | 3 | 4 | 5;
      x: number;
      y: number;
      flavorText?: string;
    }) => {
      const registered = MINIGAME_SPAWNS.find((s) => s.id === e.spawnPointId);
      const cfg = registered ?? {
        id: e.spawnPointId,
        stage: e.stage,
        archetype: e.archetype,
        difficulty: e.difficulty,
        x: e.x,
        y: e.y,
        flavorText: e.flavorText,
      };
      miniGameLifecycle.engageWithSpawn(cfg);
    };
    eventBridge.onReact("MINIGAME_SPAWN_ACTIVATED", handler);
    return () => eventBridge.off("MINIGAME_SPAWN_ACTIVATED", handler);
  }, [miniGameLifecycle]);

  // ── Sync world brightness → Phaser ─────────────────────────────────────────
  useEffect(() => {
    if (!phaserReady) return;
    const nextBrightness = brightness?.worldBrightness ?? 0;
    if (lastBrightnessPhaserSyncRef.current === nextBrightness) return;
    lastBrightnessPhaserSyncRef.current = nextBrightness;

    eventBridge.dispatchToPhaser({
      type: "UPDATE_BRIGHTNESS",
      brightness: nextBrightness,
    });
  }, [phaserReady, brightness?.worldBrightness]);

  // ── Checkpoint click from Phaser ───────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e: {
      checkpointId: string;
      stage: number;
      checkpoint: number;
    }) => {
      console.log("[React] Received CHECKPOINT_CLICKED event:", e);

      const ventureId = activeVenture?._id;
      if (!ventureId) return;

      // First try to match by the payload's stage/checkpoint (Sahit path).
      let cp = checkpoints.find(
        (c) => c.stage === e.stage && c.checkpoint === e.checkpoint,
      );

      // Fallback for the new painted-village scene: the demo village emits
      // a synthetic stage/checkpoint that may not exist in Convex venture
      // data. When the exact match fails, open whichever venture checkpoint
      // is currently ACTIVE. This keeps the demo village clickable while
      // preserving old behavior for legacy scenes with real checkpoint IDs.
      if (!cp) {
        cp = checkpoints.find(
          (c) => c.stage === activeStage && c.checkpoint === activeCP,
        );
        if (cp) {
          console.log(
            "[React] Payload CP not found; falling back to active CP",
            { activeStage, activeCP, cpId: cp._id },
          );
        }
      }

      // Hide first checkpoint pulse when any checkpoint is clicked
      if (showFirstCheckpointPulse) {
        setShowFirstCheckpointPulse(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("first_checkpoint_pulse_shown", "true");
        }
      }

      if (cp) {
        const status = deriveCheckpointStatus(cp, activeStage, activeCP);
        if (status === "locked") {
          console.log("[React] Checkpoint is locked, ignoring click.");
          audioManager.playUI("error"); // locked feedback
          return;
        }

        const detail: CheckpointDetail = {
          ...buildCheckpointDetail(cp),
          status,
        };

        console.log("[React] Opening CheckpointPanel with detail:", detail);
        // Directly set the panel state to guarantee the modal opens even
        // if the URL params don't propagate cleanly (avoids race between
        // Phaser click and Next.js router push in the demo village).
        setSelectedDetail(detail);
        updateUrlParams({ checkpointId: cp._id, panel: null, tab: null });
      } else {
        console.warn(
          "[React] No checkpoint matched (payload or active). Falling back to first available checkpoint.",
          { payload: e, activeStage, activeCP, cpCount: checkpoints.length },
        );
        // Last-resort fallback: just open the FIRST checkpoint of the
        // venture so the user always gets a task panel from a click.
        const anyCp = checkpoints[0];
        if (anyCp) {
          const status = deriveCheckpointStatus(anyCp, activeStage, activeCP);
          const detail: CheckpointDetail = {
            ...buildCheckpointDetail(anyCp),
            status,
          };
          setSelectedDetail(detail);
          updateUrlParams({ checkpointId: anyCp._id, panel: null, tab: null });
        }
      }
    };

    eventBridge.onReact("CHECKPOINT_CLICKED", handleClick);
    return () => eventBridge.off("CHECKPOINT_CLICKED", handleClick);
  }, [
    checkpoints,
    activeStage,
    activeCP,
    activeVenture,
    showFirstCheckpointPulse,
    buildCheckpointDetail,
    updateUrlParams,
  ]);

  // ── Task toggle → Convex mutation ─────────────────────────────────────────
  const handleTaskToggle = useCallback(
    async (taskIdx: number) => {
      if (!selectedDetail) return;
      const task = selectedDetail.tasks[taskIdx];
      if (!task || task.done) return; // tasks can only be marked done, not undone

      const checkpointId = task._convexCheckpointId;
      const taskLevelRaw = task._taskLevel;
      const taskLevel = taskLevelRaw;

      if (!checkpointId || !taskLevel) {
        console.error("[React] Missing checkpointId or taskLevel", {
          checkpointId,
          taskLevelRaw,
        });
        return;
      }

      console.log("[React] Opening TaskSubmissionModal for:", {
        checkpointId,
        taskLevel,
      });
      audioManager.playUI("click"); // task open feedback

      // Instead of immediately marking complete, open the submission modal
      setSubmittingTask({
        id: `${checkpointId}_${taskLevel}`,
        checkpointId,
        taskLevel,
        title: task.label,
        description: task.description,
        toolType: task.tool,
        points: taskLevel === "t1" ? 20 : taskLevel === "t2" ? 20 : 35,
      });
    },
    [selectedDetail, setSubmittingTask],
  );

  // ── Task redo → Reset and reopen submission modal ────────────────────────
  const handleTaskRedo = useCallback(
    async (taskIdx: number) => {
      if (!selectedDetail) return;
      const task = selectedDetail.tasks[taskIdx];
      if (!task || !task.done) return; // can only redo completed tasks

      const checkpointId = task._convexCheckpointId;
      const taskLevel = task._taskLevel;

      if (!checkpointId || !taskLevel) {
        console.error("[React] Missing checkpointId or taskLevel for redo", {
          checkpointId,
          taskLevel,
        });
        return;
      }

      try {
        console.log("[React] Redoing task:", { checkpointId, taskLevel });
        audioManager.playUI("confirm");

        // Call the redo mutation to reset the task
        await redoTask({ checkpointId, taskLevel });

        // Remove from optimistic completed state
        const taskId = `${checkpointId}_${taskLevel}`;
        setOptimisticCompletedTaskIds((current) => {
          const updated = { ...current };
          delete updated[taskId];
          return updated;
        });

        // Open the submission modal for resubmission
        setSubmittingTask({
          id: taskId,
          checkpointId,
          taskLevel,
          title: task.label,
          description: task.description,
          toolType: task.tool,
          points: taskLevel === "t1" ? 20 : taskLevel === "t2" ? 20 : 35,
        });
      } catch (err) {
        console.error("[React] Failed to redo task:", err);
        audioManager.playUI("error");
      }
    },
    [selectedDetail, redoTask, setSubmittingTask],
  );

  // Stable ref so handleTaskSubmissionSuccess can call handleAdvance
  // without creating a circular useCallback dependency.
  const handleAdvanceRef = useRef<
    (
      forceBypass?: boolean,
      skipDoneTasksCheck?: boolean,
      fromBossVictory?: boolean,
    ) => void | Promise<void>
  >(() => { });
  const advancingFromBossRef = useRef(false);
  const bossAdvanceCheckpointIdRef = useRef<string | null>(null);

  const handleTaskSubmissionSuccess = useCallback(
    ({
      taskId,
      checkpointId,
      taskLevel,
    }: {
      taskId: string;
      checkpointId: Id<"ventureCheckpoints">;
      taskLevel: "t1" | "t2" | "t3";
    }) => {
      // ── 1. Close the modal immediately ─────────────────────────────────
      setSubmittingTask(null);

      // Stamp the submission time so DB-driven badge detectors (myBadges /
      // ventureMyBadges) skip re-showing a badge for the next 5 seconds —
      // the local task badge animation already covers this event.
      recentTaskSubmitRef.current = Date.now();

      setOptimisticCompletedTaskIds((current) => ({
        ...current,
        [taskId]: true,
      }));

      // ── 2. Task badge — rarity matches corruption, profile-style card ──
      // Gold (legendary)  : corruption < 25  — pristine execution
      // Silver (rare)     : corruption 25–49 — solid but slightly tarnished
      // Bronze (uncommon) : corruption >= 50  — survived, with cost
      const taskBadgeRarity: BadgePayload["rarity"] =
        corruptionLevel < 25
          ? "legendary"
          : corruptionLevel < 50
            ? "rare"
            : "uncommon";

      // Look up target checkpoint and task details dynamically
      const matchedCheckpoint = checkpoints.find((c) => c._id === checkpointId);
      const cpTitle = matchedCheckpoint?.checkpointName || "Task";
      const matchedTask = matchedCheckpoint?.tasks?.find(
        (t) => t._id === taskId || t.taskLevel === taskLevel,
      );
      const toolType = matchedTask?.toolType || "write";

      // Dynamic Emojis based on Tool
      const getToolEmoji = (tool: string, rarity: string) => {
        const t = tool.toLowerCase();
        if (
          t.includes("write") ||
          t.includes("journal") ||
          t.includes("self_report")
        )
          return "✍️";
        if (t.includes("table") || t.includes("poll") || t.includes("chart"))
          return "📊";
        if (t.includes("map") || t.includes("roadmap")) return "🗺️";
        if (t.includes("survey") || t.includes("checklist")) return "📋";
        if (t.includes("link")) return "🔗";
        if (t.includes("upload")) return "📤";
        if (t.includes("kanban") || t.includes("board")) return "🗂️";
        if (t.includes("calendar") || t.includes("date")) return "📅";

        if (rarity === "legendary") return "🏆";
        if (rarity === "rare") return "🥈";
        return "🥉";
      };

      const taskBadgeIcon = getToolEmoji(toolType, taskBadgeRarity);
      const levelName = taskLevel.toUpperCase();
      const statusText =
        corruptionLevel < 25
          ? "Gold"
          : corruptionLevel < 50
            ? "Silver"
            : "Bronze";
      const taskBadgeLabel = `${cpTitle} (${levelName}) — ${statusText}`;

      const taskLevelName =
        taskLevel === "t1" ? "Easy" : taskLevel === "t2" ? "Medium" : "Stretch";
      const promptText = matchedTask?.prompt || "Task completed successfully.";
      const taskBadgeDesc = `Completed ${taskLevelName} Task: "${promptText}"`;

      // Dynamic Theme based on Tool Type
      let taskPrimaryColor = "#EEF2FF";
      let taskSecondaryColor = "#3730A3";
      let taskTagline = "Every small milestone brings the vision closer.";

      const toolLower = toolType.toLowerCase();
      if (
        toolLower.includes("write") ||
        toolLower.includes("journal") ||
        toolLower.includes("self_report")
      ) {
        taskPrimaryColor = "#F5F3FF"; // light violet
        taskSecondaryColor = "#7C3AED"; // violet
        taskTagline = "The pen is mightier than the sword.";
      } else if (
        toolLower.includes("table") ||
        toolLower.includes("poll") ||
        toolLower.includes("chart")
      ) {
        taskPrimaryColor = "#ECFDF5"; // light emerald
        taskSecondaryColor = "#059669"; // emerald
        taskTagline = "In God we trust; all others must bring data.";
      } else if (toolLower.includes("map") || toolLower.includes("roadmap")) {
        taskPrimaryColor = "#EFF6FF"; // light blue
        taskSecondaryColor = "#2563EB"; // blue
        taskTagline =
          "A map shows us where we are; a roadmap shows where we go.";
      } else if (
        toolLower.includes("survey") ||
        toolLower.includes("checklist")
      ) {
        taskPrimaryColor = "#FFF7ED"; // light orange
        taskSecondaryColor = "#EA580C"; // orange
        taskTagline = "Listen to your market, and the market will reward you.";
      } else if (toolLower.includes("link") || toolLower.includes("upload")) {
        taskPrimaryColor = "#FDF2F8"; // light pink
        taskSecondaryColor = "#DB2777"; // pink
        taskTagline = "Connected and validated. The network is the computer.";
      } else if (toolLower.includes("kanban") || toolLower.includes("board")) {
        taskPrimaryColor = "#FFF1F2"; // light rose
        taskSecondaryColor = "#E11D48"; // rose
        taskTagline = "Keep your tasks moving and clear the path ahead.";
      } else if (toolLower.includes("calendar")) {
        taskPrimaryColor = "#F0FDF4"; // light green
        taskSecondaryColor = "#16A34A"; // green
        taskTagline = "Manage your time wisely and build consistency.";
      }

      // Suppress the task-badge celebration while the v2 tutorial is
      // running — it hijacks the guided flow with a full-screen
      // "CONGRATULATIONS!" modal right after Submit Response. Post-tutorial
      // task submissions still trigger the badge normally.
      if (!tutorialActive) {
        setBadgeQueue((q) => {
          if (q.some((b) => b.name === taskBadgeLabel) || shownBadgesRef.current.has(taskBadgeLabel)) {
            return q;
          }
          return [
            ...q,
            {
              id: `task_${checkpointId}_${taskLevel}_${Date.now()}`,
              name: taskBadgeLabel,
              description: taskBadgeDesc,
              icon: taskBadgeIcon,
              rarity: taskBadgeRarity,
              category: "idea_milestones",
              isProfileStyle: true,
              primaryColor: taskPrimaryColor,
              secondaryColor: taskSecondaryColor,
              tagline: taskTagline,
              awardedAt: Date.now(),
              scoreEarned: taskLevel === "t3" ? 35 : 20,
            },
          ];
        });
      }

      const nextLabelMap: Record<"t1" | "t2" | "t3", string> = {
        t1: "T1",
        t2: "T2",
        t3: "T3",
      };

      const current = selectedDetail;
      if (current && current.id === checkpointId) {
        const updatedTasks = current.tasks.map((task) =>
          task._taskId === taskId ? { ...task, done: true } : task,
        );

        const doneCount = updatedTasks.filter((task) => task.done).length;
        const nextTask = updatedTasks.find((task) => !task.done);

        setCurrentQuestAtom({
          checkpointName: current.title,
          tasks: updatedTasks.map((task) => ({
            id:
              task._taskId ?? `${current.id}_${task._taskLevel ?? task.label}`,
            checkpointId:
              task._convexCheckpointId ??
              (current.id as Id<"ventureCheckpoints">),
            taskLevel:
              task._taskLevel ??
              (task.label.toLowerCase() as "t1" | "t2" | "t3"),
            label: task.label,
            description: task.description,
            tool: task.tool,
            points: task._taskLevel === "t3" ? 35 : 20,
            done: task.done,
          })),
          stage: current.stage,
          checkpoint: current.checkpointIndex,
        });

        if (nextTask && nextTask._convexCheckpointId && nextTask._taskLevel) {
          setActiveTaskAtom({
            id:
              nextTask._taskId ??
              `${nextTask._convexCheckpointId}_${nextTask._taskLevel}`,
            checkpointId: nextTask._convexCheckpointId,
            taskLevel: nextTask._taskLevel,
            title: nextLabelMap[nextTask._taskLevel],
            description: nextTask.description,
            toolType: nextTask.tool,
            points:
              nextTask._taskLevel === "t1"
                ? 20
                : nextTask._taskLevel === "t2"
                  ? 20
                  : 35,
          });
        } else {
          setActiveTaskAtom(null);
        }

        setSelectedDetail({
          ...current,
          status:
            doneCount >= 3 ? "gold" : doneCount >= 2 ? "completed" : "partial",
          tasks: updatedTasks,
        });
      }

      console.log("[MapPage] Task submitted successfully", {
        checkpointId,
        taskLevel,
      });

      // Boss weakening — call scene.weakenActiveBoss(doneCount) on
      // whichever stage scene is currently active. All four stage scenes
      // (Village / Forest / GoldenHarbor / Artisans) implement the same
      // weakenActiveBoss(tasksDone, total) contract, so we probe each in
      // turn and forward the call to the first one that's alive.
      // Fixes the audit gap "stages 2-4 have zero boss reactivity to
      // task submissions".
      try {
        let bossDoneCount = 0;
        if (current && current.id === checkpointId) {
          bossDoneCount = current.tasks.filter(
            (t) => t.done || t._taskId === taskId,
          ).length;
        }
        const sceneMgr = gameRef.current?.scene;
        const STAGE_KEYS = [
          "VillageMapScene",
          "ForestMapScene",
          "GoldenHarborScene",
          "ArtisansScene",
        ];
        for (const key of STAGE_KEYS) {
          if (!sceneMgr) break;
          const isLive = sceneMgr.isActive(key) || sceneMgr.isVisible(key);
          if (!isLive) continue;
          const scene = sceneMgr.getScene(key);
          if (scene && "weakenActiveBoss" in scene) {
            (scene as unknown as {
              weakenActiveBoss: (n: number, total?: number) => void;
            }).weakenActiveBoss(bossDoneCount, 3);
            break; // Only fire on the active scene, not all of them
          }
        }
      } catch (err) {
        console.warn("[MapPage] weakenActiveBoss failed", err);
      }

      // Reward feedback — floating "+N XP" popover.  Uses the REAL point
      // value granted by the server (t1/t2 = 20 pts, t3 = 35 pts) so the
      // popover doesn't lie to the user.  Gamification audit surfaced
      // the previous hardcoded "+15 XP" as a UX credibility issue.
      try {
        const rewardAmount =
          taskLevel === "t3" ? 35 : 20;
        eventBridge.dispatchToReact({
          type: "XP_AWARDED",
          amount: rewardAmount,
          label: taskLevel === "t3" ? "Task · Deep" : "Task",
        });
      } catch (err) {
        console.warn("[MapPage] XP_AWARDED dispatch failed", err);
      }

      // v2 tutorial: after the guided first task, auto-advance the
      // checkpoint so the user is taken straight into AI Combat instead
      // of having to hunt for the Advance button.
      //   forceBypass=false → boss combat check RUNS (we want combat)
      //   skipDoneTasksCheck=true → allow advance with just 1 completed
      //     task (the tutorial only submits one)
      //   fromBossVictory=false → default
      // handleAdvance then hits needsCheckpointBossCombat() → true →
      // startBossCombat() → sets bossCombatTarget → CombatPanel mounts.
      if (tutorialActive) {
        window.setTimeout(() => {
          const fn = handleAdvanceRef.current;
          if (fn) void fn(false, true, false);
        }, 800);
      }
    },
    [
      selectedDetail,
      setActiveTaskAtom,
      setCurrentQuestAtom,
      setSubmittingTask,
      setOptimisticCompletedTaskIds,
      setBadgeQueue,
      corruptionLevel,
      checkpoints,
      tutorialActive,
    ],
  );

  // ── Advance checkpoint → Convex mutation ──────────────────────────────────
  const handleAdvance = useCallback(async (
    forceBypass = false,
    skipDoneTasksCheck = false,
    fromBossVictory = false,
  ) => {
    if (!venture || isAdvancingCheckpoint) return;

    const cp = fromBossVictory && bossAdvanceCheckpointIdRef.current
      ? checkpoints.find((c) => c._id === bossAdvanceCheckpointIdRef.current)
      : selectedDetail
        ? checkpoints.find((c) => c._id === selectedDetail.id)
        : undefined;

    if (!cp) {
      if (fromBossVictory) {
        advancingFromBossRef.current = false;
        bossFinishInFlightRef.current = false;
        bossAdvanceCheckpointIdRef.current = null;
      }
      return;
    }

    const doneTasks = [cp.t1Completed, cp.t2Completed, cp.t3Completed].filter(
      Boolean,
    ).length;
    // First-run tour can advance after 1 task to reach the Doubt Imp
    // without grinding all three. Include the v2 product tutorial so a
    // guided-tour user gets the same relaxed threshold.
    const tourActiveNow =
      tourStateForPulse?.state === "not_started" ||
      tourStateForPulse?.state === "in_progress" ||
      tutorialActive;
    const minTasksToAdvance = tourActiveNow ? 1 : 2;
    if (doneTasks < minTasksToAdvance && !skipDoneTasksCheck) return;

    const mapStage = venture.currentStage ?? 1;
    const mapCheckpoint = venture.currentCheckpoint ?? 1;

    // ── Boss combat: required once per checkpoint before advance ────────────
    if (
      !forceBypass &&
      needsCheckpointBossCombat(
        cp,
        doneTasks,
        bossDefeatedAtCheckpoint,
        mapStage,
        mapCheckpoint,
        tourActiveNow,
      )
    ) {
      startBossCombat(cp, doneTasks);
      return;
    }

    // ── Inter-checkpoint passage events removed as requested (only Boss combat and Badge animations should exist)
    const unresolvedEvents: any[] = [];

    const isGold = doneTasks >= 3;

    // Determine if this is the last checkpoint in the stage (stage boundary)
    const isLastInStage = !checkpoints.find(
      (c) => c.stage === cp.stage && c.checkpoint === cp.checkpoint + 1,
    );

    // Find next checkpoint client-side for UI hint only (not used for state)
    const nextCpSameStage = checkpoints.find(
      (c) => c.stage === cp.stage && c.checkpoint === cp.checkpoint + 1,
    );
    const nextCpNextStage = checkpoints.find(
      (c) => c.stage === cp.stage + 1 && c.checkpoint === 1,
    );
    const nextCp = nextCpSameStage ?? nextCpNextStage ?? null;

    const animVariant = isGold ? "gold" : "standard";
    setFlashTrigger((n) => n + 1);
    setIsAdvancingCheckpoint(true);

    const afterBossVictory = fromBossVictory || advancingFromBossRef.current;

    try {
      if (phaserReady) {
        eventBridge.dispatchToPhaser({
          type: "PLAY_CHECKPOINT_ANIMATION",
          checkpointId: cp._id,
          stage: cp.stage,
          variant: animVariant,
        });

        if (!afterBossVictory) {
          await new Promise<void>((resolve) => {
            let settled = false;

            const handleAnimationDone = (event: {
              checkpointId: string;
              stage: number;
            }) => {
              if (settled) return;
              if (event.checkpointId !== cp._id || event.stage !== cp.stage)
                return;

              settled = true;
              window.clearTimeout(timeout);
              eventBridge.off(
                "CHECKPOINT_ANIMATION_COMPLETE",
                handleAnimationDone,
              );
              resolve();
            };

            const timeout = window.setTimeout(() => {
              if (settled) return;
              settled = true;
              eventBridge.off(
                "CHECKPOINT_ANIMATION_COMPLETE",
                handleAnimationDone,
              );
              resolve();
            }, 4000);

            eventBridge.onReact(
              "CHECKPOINT_ANIMATION_COMPLETE",
              handleAnimationDone,
            );
          });
        }
      }

      recentTaskSubmitRef.current = Date.now();
      await advanceCheckpoint({
        checkpointId: cp._id as Id<"ventureCheckpoints">,
      });

      if (afterBossVictory) {
        advancingFromBossRef.current = false;
        bossAdvanceCheckpointIdRef.current = null;
      }

      const clearedKey = checkpointBossKey(cp.stage, cp.checkpoint);
      setBossDefeatedAtCheckpoint((prev) => {
        const next = new Set(prev);
        next.add(clearedKey);
        if (venture._id) {
          persistCheckpointBossDefeated(venture._id, next);
        }
        return next;
      });

      // Reset bypass flag AFTER successful advance
      setBypassInterCheckpoint(false);

      // ── Level (checkpoint) badge — rarity based on corruption meter ────
      // Gold (legendary)  : corruption < 25  — clean, visionary execution
      // Silver (rare)     : corruption 25–49  — solid but slightly compromised
      // Bronze (uncommon) : corruption >= 50  — survived but at a cost
      const levelBadgeRarity: BadgePayload["rarity"] =
        corruptionLevel < 25
          ? "legendary"
          : corruptionLevel < 50
            ? "rare"
            : "uncommon";

      const statusTextCP =
        corruptionLevel < 25
          ? "Gold"
          : corruptionLevel < 50
            ? "Silver"
            : "Bronze";
      const levelBadgeLabel = `${cp.checkpointName} — ${statusTextCP}`;

      // Dynamic Stage-based Checkpoint Icon
      const getStageEmoji = (stageNum: number, rarity: string) => {
        if (stageNum === 1) return "💡"; // Ideation
        if (stageNum === 2) return "🔬"; // Research
        if (stageNum === 3) return "✅"; // Validation
        if (stageNum === 4) return "🎨"; // Offer Design
        if (stageNum === 5) return "⚙️"; // Build & Deliver
        if (stageNum === 6) return "🚀"; // Launch
        if (stageNum === 7) return "🔄"; // Iteration
        if (stageNum === 8) return "👑"; // Scale

        return rarity === "legendary" ? "🏆" : rarity === "rare" ? "🥈" : "🥉";
      };

      const levelBadgeIcon = getStageEmoji(cp.stage, levelBadgeRarity);
      const levelBadgeDesc =
        corruptionLevel < 25
          ? `Checkpoint "${cp.checkpointName}" cleared with gold-standard purity!`
          : corruptionLevel < 50
            ? `Checkpoint "${cp.checkpointName}" cleared with silver integrity. Keep the corruption at bay!`
            : `Checkpoint "${cp.checkpointName}" cleared — bronze earned. Watch the corruption meter!`;
      const checkpointBadgePrimary =
        levelBadgeRarity === "legendary"
          ? "#FBBF24"
          : levelBadgeRarity === "rare"
            ? "#E2E8F0"
            : "#FFF7ED";
      const checkpointBadgeSecondary =
        levelBadgeRarity === "legendary"
          ? "#92400E"
          : levelBadgeRarity === "rare"
            ? "#64748B"
            : "#B45309";

      setBadgeQueue((q) => {
        if (q.some((b) => b.name === levelBadgeLabel) || shownBadgesRef.current.has(levelBadgeLabel)) {
          return q;
        }
        return [
          ...q,
          {
            id: `level_${cp._id}_${Date.now()}`,
            name: levelBadgeLabel,
            description: levelBadgeDesc,
            icon: levelBadgeIcon,
            rarity: levelBadgeRarity,
            category: "idea_milestones",
            shape: "trophy",
            primaryColor: checkpointBadgePrimary,
            secondaryColor: checkpointBadgeSecondary,
            tagline: levelBadgeDesc,
            awardedAt: Date.now(),
            scoreEarned: levelBadgeRarity === "legendary" ? 50 : levelBadgeRarity === "rare" ? 20 : 10,
          },
        ];
      });

      if (isLastInStage) {
        const stageNames = templateStages.map((stage) => stage.name);
        const stageMedalTier: "gold" | "silver" | "bronze" =
          corruptionLevel <= 30
            ? "gold"
            : corruptionLevel <= 70
              ? "silver"
              : "bronze";
        const currentStageMeta = templateStages[cp.stage - 1];
        const nextStageMeta = templateStages[cp.stage];
        const skipStageCeremony = advancingFromBossRef.current;
        if (skipStageCeremony) {
          advancingFromBossRef.current = false;
        }

        if (!skipStageCeremony) {
          setStageClearModal({
            show: true,
            stageNumber: cp.stage,
            stageName: stageNames[cp.stage - 1] || "Stage",
            isGold,
            medalTier: stageMedalTier,
            fromBiome: currentStageMeta?.biome,
            nextStageName: nextStageMeta?.name,
            nextBiome: nextStageMeta?.biome,
          });
        }

        const stageBadgeRarity: BadgePayload["rarity"] =
          stageMedalTier === "gold"
            ? "legendary"
            : stageMedalTier === "silver"
              ? "rare"
              : "uncommon";
        const stageMedalText =
          stageMedalTier === "gold"
            ? "Gold"
            : stageMedalTier === "silver"
              ? "Silver"
              : "Bronze";
        const stageBadgeName = `Stage ${cp.stage}: ${stageNames[cp.stage - 1]} Clear — ${stageMedalText}`;
        const stageBadgeIcon =
          corruptionLevel <= 30 ? "🥇" : corruptionLevel <= 70 ? "🥈" : "🥉";
        const stageBadgeDesc = `Completed Stage ${cp.stage} with ${stageMedalText.toLowerCase()} prestige status!`;
        const stageBadgePrimary =
          stageBadgeRarity === "legendary"
            ? "#FBBF24"
            : stageBadgeRarity === "rare"
              ? "#E2E8F0"
              : "#FFF7ED";
        const stageBadgeSecondary =
          stageBadgeRarity === "legendary"
            ? "#92400E"
            : stageBadgeRarity === "rare"
              ? "#64748B"
              : "#B45309";

        setBadgeQueue((q) => [
          ...q,
          {
            id: `stage_clear_${cp.stage}_${Date.now()}`,
            name: stageBadgeName,
            description: stageBadgeDesc,
            icon: stageBadgeIcon,
            rarity: stageBadgeRarity,
            category: "idea_milestones",
            shape: "medal",
            primaryColor: stageBadgePrimary,
            secondaryColor: stageBadgeSecondary,
            tagline: stageBadgeDesc,
            awardedAt: Date.now(),
            scoreEarned: stageBadgeRarity === "legendary" ? 100 : stageBadgeRarity === "rare" ? 50 : 25,
          },
        ]);

        const nextStageFirst = checkpoints.find(
          (c) => c.stage === cp.stage + 1 && c.checkpoint === 1,
        );
        if (skipStageCeremony && nextStageFirst) {
          setSelectedDetail(buildCheckpointDetail(nextStageFirst));
          updateUrlParams({ checkpointId: nextStageFirst._id }, true);
          if (phaserReady) {
            window.requestAnimationFrame(() => {
              eventBridge.dispatchToPhaser({
                type: "SCROLL_TO_CHECKPOINT",
                checkpointId: nextStageFirst._id,
              });
            });
          }
        } else {
          setSelectedDetail(null);
          updateUrlParams({ checkpointId: null }, true);
        }
      } else if (nextCp) {
        // Same-stage advance — open the next checkpoint panel immediately.
        setSelectedDetail(buildCheckpointDetail(nextCp));
        updateUrlParams({ checkpointId: nextCp._id }, true);
        if (phaserReady) {
          window.requestAnimationFrame(() => {
            eventBridge.dispatchToPhaser({
              type: "SCROLL_TO_CHECKPOINT",
              checkpointId: nextCp._id,
            });
          });
        }
      } else {
        setSelectedDetail(null);
        updateUrlParams({ checkpointId: null }, true);
      }
    } catch (err) {
      console.error("advanceCheckpoint failed:", err);
      advancingFromBossRef.current = false;
      bossFinishInFlightRef.current = false;
      bossAdvanceCheckpointIdRef.current = null;
    } finally {
      setIsAdvancingCheckpoint(false);
      bossFinishInFlightRef.current = false;
    }
  }, [
    selectedDetail,
    venture,
    checkpoints,
    advanceCheckpoint,
    buildCheckpointDetail,
    isAdvancingCheckpoint,
    phaserReady,
    corruptionLevel,
    setBadgeQueue,
    bypassInterCheckpoint,
    interCheckpointData,
    updateUrlParams,
    bossDefeatedAtCheckpoint,
    setBossCombatTarget,
    startBossCombat,
    tourStateForPulse,
    tutorialActive,
  ]);

  // Keep handleAdvanceRef always pointing at the latest handleAdvance
  handleAdvanceRef.current = handleAdvance;

  // ── Destroy audio on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      audioManager.destroy();
    };
  }, []);

  // ── Stage strip select ─────────────────────────────────────────────────────
  const [viewingStage, setViewingStage] = useState(1);
  const viewingStageSyncedRef = useRef(false);

  const handleStageSelect = useCallback(
    (stageId: number) => {
      if (stageId > activeStage || stageId < 1) return;

      setViewingStage(stageId);

      eventBridge.dispatchToPhaser({
        type: "FOCUS_STAGE",
        stage: stageId,
      });
    },
    [activeStage],
  );

  const handlePrevStage = useCallback(() => {
    if (viewingStage <= 1) return;
    audioManager.playUI("click");
    handleStageSelect(viewingStage - 1);
  }, [viewingStage, handleStageSelect]);

  const handleNextStage = useCallback(() => {
    if (viewingStage >= activeStage) return;
    audioManager.playUI("click");
    handleStageSelect(viewingStage + 1);
  }, [viewingStage, activeStage, handleStageSelect]);

  const handleCurrentStage = useCallback(() => {
    if (viewingStage === activeStage) return;
    audioManager.playUI("click");
    handleStageSelect(activeStage);
  }, [viewingStage, activeStage, handleStageSelect]);

  useEffect(() => {
    if (phaserReady && !viewingStageSyncedRef.current) {
      setViewingStage(activeStage);
      viewingStageSyncedRef.current = true;
    }
  }, [phaserReady, activeStage]);

  useEffect(() => {
    const onStageInView = (event: { type: string; stage?: number }) => {
      if (event.type === "STAGE_IN_VIEW" && typeof event.stage === "number") {
        setViewingStage(event.stage);
      }
    };
    eventBridge.on("STAGE_IN_VIEW", onStageInView);
    return () => eventBridge.off("STAGE_IN_VIEW", onStageInView);
  }, []);

  useEffect(() => {
    if (selectedStageId && checkpoints.length > 0 && phaserReady) {
      const timer = setTimeout(() => {
        handleStageSelect(selectedStageId);
        setSelectedStageId(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("selectedStage");
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [selectedStageId, checkpoints, phaserReady, handleStageSelect]);

  // ── Read HUD atom values ───────────────────────────────────────────────────
  const stageInfo = useAtomValue(stageInfoAtom);
  const checkpointProgress = useAtomValue(checkpointProgressAtom);
  const userProgress = useAtomValue(userProgressAtom);
  const corruption = useAtomValue(corruptionStateAtom);

  // Stable callback for LeftSidebar — inlined as a 25-line arrow before,
  // which re-created the closure every render and prevented LeftSidebar
  // from staying memoized.
  const handleSidebarOpenPanel = useCallback(
    (tab: string) => {
      if (tab === "chat") {
        if (activeVenture?.ideaId) {
          openGroupChat(
            activeVenture.ideaId,
            activeConversationId as Id<"conversations"> | undefined,
          );
        }
        setIsGroupChatOpen(true);
      } else if (tab === "contributors") {
        setIsContributorsOpen(true);
      } else if (tab === "feed") {
        setIsContributionsOpen(true);
      } else if (tab === "hierarchy") {
        setIsHierarchyOpen(true);
      } else if (tab === "calendar") {
        setIsCalendarOpen(true);
      } else if (tab === "kanban") {
        setIsKanbanOpen(true);
      } else if (tab === "journal") {
        setIsJournalOpen(true);
      } else if (tab === "minigames") {
        setIsMiniGamesPanelOpen(true);
      } else {
        updateUrlParams({ panel: "tools", tab, checkpointId: null });
      }
    },
    [
      activeVenture?.ideaId,
      activeConversationId,
      openGroupChat,
      updateUrlParams,
    ],
  );

  // ── Loading / no-venture guard ─────────────────────────────────────────────
  // worldMapData is "skip"ped while intro is showing, so only check it after intro

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative h-[100svh] w-full overflow-hidden font-sans"
      style={{ background: "#050810" }}
    >
      {/* Fonts + keyframes + Phaser canvas position lock.
          The Phaser RESIZE scale mode dynamically sets margin-left /
          margin-top on the inserted canvas to center it inside the
          wrapper. Each margin change counts as a layout shift —
          field traces (PerformanceObserver) showed CLS 1.000 with
          the canvas as the largest source. Pinning the canvas to
          inset:0 with !important neutralises those margin writes
          (Phaser still updates them in JS, but CSS overrides them
          visually), so the canvas never moves. The render still
          looks identical because the wrapper itself is full-screen
          inset-0. */}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .phaser-canvas-wrapper > canvas {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>

      {/* IdeaForge Navbar at top */}
      <IdeaForgeNavbar
        currentUser={currentUser}
        searchQuery=""
        onSearchChange={() => { }}
        onOpenComposer={() => { }}
      />

      {/* HUD at bottom - Stage Info, Progress, Level, XP.
          `contain: layout paint` confines re-layout from XPBar/Stage
          updates to this subtree so it can't ripple into the rest of
          the page. min-h-[52px] reserves height even before the inner
          flex content paints, eliminating a CLS contributor on slow
          first paint. */}
      <div
        className="absolute inset-x-0 bottom-4 z-[70] pointer-events-none flex justify-center"
        style={{ contain: "layout paint" }}
      >
        <div
          id="bottom-hud-control"
          className="pointer-events-auto flex items-center gap-3 md:gap-4 rounded-xl border border-white/5 bg-[#0A0D12]/92 backdrop-blur-xl px-3 py-2 md:px-4 md:py-2.5 shadow-2xl min-h-[52px]"
        >
          <button
            onClick={handlePrevStage}
            disabled={viewingStage <= 1}
            onMouseEnter={() => {
              if (viewingStage > 1) audioManager.playUI("hover");
            }}
            className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-300 shrink-0 ${
              viewingStage > 1
                ? "border-amber-500/50 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25 hover:text-white"
                : "border-white/5 bg-white/5 text-slate-600 cursor-not-allowed opacity-50"
            }`}
            title={
              viewingStage > 1
                ? `Go back to Stage ${viewingStage - 1}`
                : "You are on the first stage"
            }
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNextStage}
            disabled={viewingStage >= activeStage}
            onMouseEnter={() => {
              if (viewingStage < activeStage) audioManager.playUI("hover");
            }}
            className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-300 shrink-0 ${
              viewingStage < activeStage
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25 hover:text-white"
                : "border-white/5 bg-white/5 text-slate-600 cursor-not-allowed opacity-50"
            }`}
            title={
              viewingStage < activeStage
                ? `Go forward to Stage ${viewingStage + 1}`
                : "You are on your latest unlocked stage"
            }
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Visibility-toggled (not conditionally mounted) so the
              HUD row's flex layout doesn't shift when the user is on
              vs off their current stage. Conditional mount was a CLS
              source on advanced ventures. */}
          <button
            onClick={handleCurrentStage}
            onMouseEnter={() => audioManager.playUI("hover")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-500/50 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25 hover:text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all duration-300 shrink-0 ${
              viewingStage < activeStage
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!(viewingStage < activeStage)}
            tabIndex={viewingStage < activeStage ? 0 : -1}
            title={`Jump to your current stage (Stage ${activeStage})`}
          >
            <span>Current Map</span>
          </button>

          <div className="hidden h-5 w-px bg-white/10 sm:block shrink-0" />

          <div className="shrink-0">
            <StageInfo
              stageName={stageInfo.stageName}
              stageIcon={stageInfo.stageIcon}
              biomeName={stageInfo.biomeName}
              stage={stageInfo.stage}
              currentCheckpoint={stageInfo.currentCheckpoint}
              totalCheckpointsInStage={stageInfo.totalCheckpointsInStage}
              compact={true}
            />
          </div>

          <div className="hidden h-5 w-px bg-white/10 sm:block shrink-0" />

          {/* Active Tasks panel toggle */}
          <button
            onClick={() => {
              if (checkpoints.length > 0 && activeStage && activeCP) {
                const activeCheckpoint = checkpoints.find(
                  (cp) => cp.stage === activeStage && cp.checkpoint === activeCP,
                );
                if (activeCheckpoint) {
                  updateUrlParams({ checkpointId: activeCheckpoint._id }, true);
                  eventBridge.dispatchToPhaser({
                    type: "SCROLL_TO_CHECKPOINT",
                    checkpointId: activeCheckpoint._id,
                  });
                }
              }
            }}
            className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-300 shrink-0 ${
              !selectedDetail
                ? "border-indigo-500/60 bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 hover:text-white shadow-[0_0_12px_rgba(99,102,241,0.2)] animate-[pulse_2s_infinite]"
                : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
            title="Tasks"
          >
            <ListTodo className={`w-4 h-4 ${!selectedDetail ? "text-indigo-400" : "text-slate-400"}`} />
          </button>

          <div className="hidden h-5 w-px bg-white/10 sm:block shrink-0" />

          <div className="min-w-0 flex-1 sm:w-[320px] md:w-[400px]">
            <XPBar
              currentXP={userProgress.xp}
              maxXP={userProgress.xpToNextLevel}
              compact={true}
              // TEMPORARY: boss overlay hidden for demo — omitting boss props
              // makes XPBar render as an XP-only bar without the "THE HOLLOW
              // KING" HP header and VS panel. Restore by re-passing:
              //   bossHp={corruption.bossHp}
              //   bossBaseHp={corruption.bossBaseHp}
              //   bossName={corruption.bossName}
            />
          </div>


        </div>
      </div>

      {/* Phaser canvas - Fully responsive.
          `contain: strict` confines the entire Phaser subtree from
          contributing to outer layout/paint shifts — when Phaser
          inserts/resizes its canvas element after mount, none of
          those size recalcs can ripple into surrounding HUD/overlays.
          This was a measurable CLS contributor on advanced ventures
          because the canvas is the LCP element and its first paint
          counts as a shift if outer layout is still settling. */}
      <div
        ref={containerRef}
        className="phaser-canvas-wrapper absolute inset-0 z-0 [image-rendering:pixelated] overflow-hidden"
        style={{
          touchAction: "none",
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          width: "100%",
          height: "100%",
          contain: "strict",
        }}
      />

      {/* Loading screen — hide once Phaser canvas is ready; data can sync in background */}
      <AnimatePresence>
        {!phaserReady && (
          <motion.div
            key="loading"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* No venture state */}


      {phaserReady && activeVenture && (
        <>
          {/* Corruption colour wash removed — it dimmed the map with a transparent layer. */}

          {/* Critical-corruption alert ring. Using box-shadow inset
              instead of border-[10px] so the element never affects
              its own content box (border collapses the inner area on
              transition and was a CLS contributor). */}
          {corruptionPhase === "critical" && (
            <div
              className="pointer-events-none absolute inset-0 z-[13] animate-pulse"
              style={{
                boxShadow: "inset 0 0 0 10px rgba(239, 68, 68, 0.25)",
              }}
            />
          )}

          {/* Phase banner removed per user request */}

          <AnimatePresence>
          </AnimatePresence>

          {/* Quest List removed per user request */}

          {/* TEMPORARY: boss HP bar hidden for demo — restore by removing
              the `false &&` guard below. Original condition preserved for
              easy re-enable after client sign-off.  */}
          {false && (corruption.level >= 60 || bossCombatTarget) && (
            <BossHPBar forceVisible={!!bossCombatTarget} />
          )}

          {/* Stage navigation strip removed */}

          {/* WorldMapTour + TourToggle removed — v2 tutorial (Sparky) is
              the only guided walkthrough now. */}

          <CrossingFlash trigger={flashTrigger} />

          {/* Gap 3 fix: use the real LevelUpSequence component.
              Conditionally mount so the audio + RollingCounter hooks
              don't fire while closed. */}
          {showLevelUp && (
            <LevelUpSequence
              isVisible
              oldLevel={levelUpData.oldLevel}
              newLevel={levelUpData.newLevel}
              phase={levelUpData.phase}
              isPhaseTransition={levelUpData.isPhaseTransition}
              unlockedTools={levelUpData.unlockedTools}
              onComplete={() => setShowLevelUp(false)}
              onSkip={() => setShowLevelUp(false)}
            />
          )}

          {activeBadge && (
            <BadgeAwardSequence
              isVisible
              badge={activeBadge}
              onComplete={() => {
                shownBadgesRef.current.add(activeBadge.name);
                setActiveBadge(null);
              }}
              onSkip={() => {
                shownBadgesRef.current.add(activeBadge.name);
                setActiveBadge(null);
              }}
            />
          )}

          {/* Floating "+N XP" popovers on task submit / CP clear / boss defeat */}
          <XpFloatingPopover />

          {/* Daily challenges — fixed to top-right so it's visible on load
              without blocking the map interactions.  Hidden during:
                - the Sparky tutorial (competing focus)
                - CheckpointPanel open (would overlap the task list)
                - Any other modal / boss encounter / celebration (invisible
                  overlays sit on top anyway, but explicit hide avoids
                  z-index race conditions like this Daily card overlapping
                  the checkpoint dialog).
             */}
          {!tutorialActive && !selectedDetail && !bossCombatTarget && (
            <div className="pointer-events-auto fixed right-4 top-20 z-[10005] hidden w-[280px] sm:block">
              <DailyChallengesCard compact />
            </div>
          )}

          {/* Village demo — Stage 1 Complete finale after Unraveller reveal.
              When the user dismisses this we also fire PREVIEW_NEXT_STAGE
              on the event bridge; the Phaser scene handles the camera pan
              east to the silhouetted Forest of Perfectionism. */}
          <VillageCompleteCelebration
            open={villageComplete.open}
            checkpointsCleared={villageComplete.checkpointsCleared}
            tasksCompleted={villageComplete.tasksCompleted}
            onContinue={() => {
              setVillageComplete((s) => ({ ...s, open: false }));
              // Beat 1: brief exit animation + Phaser preview pan east
              window.setTimeout(() => {
                eventBridge.dispatchToPhaser({
                  type: "PREVIEW_NEXT_STAGE",
                  stage: 2,
                });
              }, 350);
              // Beat 2: after the preview pan (~4.2s per previewNextStage
              // choreography) navigate the URL to ?stage=2 so the Forest
              // scene loads. Preserves ventureId so downstream React
              // (CheckpointPanel, boss combat, etc.) stays anchored.
              window.setTimeout(() => {
                const next = new URLSearchParams(
                  searchParams?.toString() ?? "",
                );
                next.set("stage", "2");
                router.replace(`/map/world?${next.toString()}`, {
                  scroll: false,
                });
              }, 5500);
            }}
          />

          {/* Mid-arc stage-clear toast — Forest→Harbor + Harbor→Artisans.
              Fires briefly during the URL swap between stages. */}
          <StageClearedToast
            open={stageCleared.open}
            stage={stageCleared.stage}
            onDismiss={() => setStageCleared((s) => ({ ...s, open: false }))}
          />

          {/* Super-boss encounter for stages 2-4 — sits between the CP4
              mini-boss clear and the STAGE_COMPLETE navigation. Strike
              CTA calls the scene's defeatSuperBoss method, which plays
              the defeat animation and then fires STAGE_COMPLETE. */}
          <SuperBossEncounterOverlay
            open={superBossEncounter.open}
            stage={superBossEncounter.stage}
            boss={superBossEncounter.boss}
            onStrike={() => {
              setSuperBossEncounter((s) => ({ ...s, open: false }));
              const game = gameRef.current;
              if (!game) return;
              const stageKey =
                superBossEncounter.stage === 2
                  ? "ForestMapScene"
                  : superBossEncounter.stage === 3
                    ? "GoldenHarborScene"
                    : superBossEncounter.stage === 4
                      ? "ArtisansScene"
                      : null;
              if (!stageKey) return;
              const scene = game.scene.getScene(stageKey) as
                | { defeatSuperBoss?: () => void }
                | undefined;
              scene?.defeatSuperBoss?.();
            }}
            onDismiss={() => {
              setSuperBossEncounter((s) => ({ ...s, open: false }));
              // Boss theme was layered on when encounter opened — swap
              // back to the stage's ambient music since we're staying on
              // this stage.
              try {
                audioManager.playStageMusic(superBossEncounter.stage);
              } catch {
                /* audio non-critical */
              }
            }}
          />

          {/* Venture-wide finale — fires when the final stage (4) clears.
              Nothing to preview beyond this yet; the CTA drops the user
              back on the World map at their current (final) stage. */}
          <VentureCompleteCelebration
            open={ventureComplete.open}
            stagesCleared={ventureComplete.stagesCleared}
            onContinue={() => {
              setVentureComplete((s) => ({ ...s, open: false }));
              // Clear any ?stage=N deep-link so refreshes land cleanly
              // on the current stage (which by now is 4).
              const next = new URLSearchParams(
                searchParams?.toString() ?? "",
              );
              next.delete("stage");
              const qs = next.toString();
              router.replace(qs ? `/map/world?${qs}` : "/map/world", {
                scroll: false,
              });
            }}
          />


          {/* Gold checkpoint notification popup */}
          {goldCheckpointNotification && (
            <GoldCheckpointPopup
              isVisible
              ventureName={goldCheckpointNotification.ventureName}
              stageName={goldCheckpointNotification.stageName}
              checkpoint={goldCheckpointNotification.checkpoint}
              onDismiss={() => setGoldCheckpointNotification(null)}
            />
          )}

          {/* ── HP-based Cross-Question Combat — replaces the old single-question
                Doubt Imp overlay. Fires when player walks into a boss checkpoint. ── */}
          {bossCombatTarget && activeVenture && activeCombatRoundId && (
            <CombatPanel
              key={activeCombatRoundId}
              roundId={activeCombatRoundId as Id<"combatRounds">}
              checkpointId={bossCombatTarget.checkpointId as Id<"ventureCheckpoints">}
              // Stage-aware boss identity — pulls from the shared
              // stage-bosses config which covers stages 1-4 with real
              // sprites + names + intro lines. Falls back to Village
              // config for stage 1 (both paths return same data).
              boss={
                bossCombatTarget.stage === 1
                  ? getVillageBoss(bossCombatTarget.checkpoint - 1)
                  : getStageBoss(
                      bossCombatTarget.stage,
                      bossCombatTarget.checkpoint - 1,
                    )
              }
              // Founder's actual venture / idea title — replaces the
              // hardcoded "RETLIFY: BOSS CHALLENGE" placeholder in the
              // combat header with the user's real idea name.
              ideaTitle={ideaTitle}
              onRetryStarted={(newRoundId) => {
                // Direct swap to the new round. The key prop above
                // forces a clean CombatPanel remount when activeCombatRoundId changes.
                console.log("[combat] retry: swapping roundId from", activeCombatRoundId, "→", newRoundId);
                setActiveCombatRoundId(newRoundId);
              }}
              onAdvanceCheckpoint={() => {
                setActiveCombatRoundId(null);
                // First-run tour: skip the post-combat ceremony
                // (checkpoint walk + animations) and drop the user
                // straight onto /feed for the final contribute step.
                const tourActiveNow =
                  tourStateForPulse?.state === "not_started" ||
                  tourStateForPulse?.state === "in_progress";
                if (tourActiveNow) {
                  setBossCombatTarget(null);
                  router.push("/feed");
                  return;
                }
                finishBossCombatAndAdvance();
              }}
              onClose={() => {
                dismissBossCombatVisual(bossCombatTarget.stage);
                setBossCombatTarget(null);
                setActiveCombatRoundId(null);
                // Tour exits combat — win or lose — straight to /feed
                // for the contributor step.
                if (
                  tourStateForPulse?.state === "not_started" ||
                  tourStateForPulse?.state === "in_progress"
                ) {
                  router.push("/feed");
                }
              }}
            />
          )}

          {/* Loading / error state while the combat round is being created */}
          {bossCombatTarget && activeVenture && !activeCombatRoundId && (
            <div className="pointer-events-auto fixed inset-0 z-[80] flex items-center justify-center bg-black/85 backdrop-blur-sm">
              <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950 p-8 text-center text-white">
                {combatStartError ? (
                  <>
                    <p className="text-sm text-red-400">
                      Failed to summon the boss: {combatStartError}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        dismissBossCombatVisual(bossCombatTarget.stage);
                        setBossCombatTarget(null);
                      }}
                      className="rounded-md border border-white/20 px-4 py-1.5 text-sm hover:bg-white/5"
                    >
                      Retreat
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                    <p className="text-sm text-white/70">The boss is awakening…</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Inter-checkpoint passage events overlay */}
          {activeVenture && interCheckpointQueue.length > 0 && (() => {
            const currentCp = checkpoints.find(
              (cp) => cp.stage === activeVenture.currentStage && cp.checkpoint === activeVenture.currentCheckpoint
            );
            return (
              <InterCheckpointOverlay
                isOpen
                events={interCheckpointQueue}
                templateId={activeVenture.templateId as any}
                stage={activeVenture.currentStage}
                checkpoint={activeVenture.currentCheckpoint}
                ventureId={activeVenture._id}
                checkpointId={currentCp?._id as any}
                onComplete={() => {
                  setBypassInterCheckpoint(true);
                  setInterCheckpointQueue([]);
                  // Trigger the advance since the events are now resolved.
                  // Small delay lets the overlay exit animation finish first,
                  // then handleAdvance fires the checkpoint animation + persona walk.
                  setTimeout(() => {
                    handleAdvance(true);
                  }, 300);
                }}
                onClose={() => setInterCheckpointQueue([])}
              />
            );
          })()}

          {/* PRD §2 v1.1 — sidebar entry-point for mini-games (the
           *  floating dot UX was replaced because it felt visually
           *  noisy alongside the snake-path checkpoints). Selecting a
           *  game here calls `engageWithSpawn` → prompt → overlay →
           *  result, same downstream flow. */}
          <MiniGamesPanel
            open={isMiniGamesPanelOpen}
            onClose={() => setIsMiniGamesPanelOpen(false)}
            completedSpawnIds={miniGameCompletedSpawnIds}
            onPlay={(spawn) => {
              setIsMiniGamesPanelOpen(false);
              miniGameLifecycle.engageWithSpawn(spawn);
            }}
          />

          {/* Lifecycle surfaces — same as before. Only mount the
              prompt dialog when the prompt phase is actually active,
              otherwise the Radix portal + state machine sits in the
              tree for nothing. */}
          {miniGamePhase.kind === "prompt" && (
            <MiniGamePromptDialog
              spawn={miniGamePhase.spawn}
              onEngage={miniGameLifecycle.acceptPrompt}
              onDismiss={miniGameLifecycle.dismissPrompt}
            />
          )}
          {miniGamePhase.kind === "playing" && (
            <MiniGameOverlay
              spawn={miniGamePhase.spawn}
              onResult={miniGameLifecycle.settle}
              onAbandon={miniGameLifecycle.abandon}
            />
          )}
          {miniGamePhase.kind === "result" && (() => {
            // Pick the next un-cleared spawn. Preference order:
            //   1. Same archetype, next-higher difficulty in catalogue.
            //   2. Any other un-cleared spawn.
            const completedIds = new Set(miniGameCompletedSpawnIds);
            const lastSpawnId = miniGamePhase.completion.spawnPointId;
            const lastSpawn = MINIGAME_SPAWNS.find((s) => s.id === lastSpawnId);
            const candidates = MINIGAME_SPAWNS.filter(
              (s) => !completedIds.has(s.id),
            );
            const sameArchetypeNext = lastSpawn
              ? candidates
                  .filter((s) => s.archetype === lastSpawn.archetype)
                  .sort((a, b) => a.difficulty - b.difficulty)[0]
              : undefined;
            const anyNext = candidates[0];
            const nextSpawn = sameArchetypeNext ?? anyNext ?? null;

            return (
              <MiniGameResultPanel
                completion={miniGamePhase.completion}
                onClose={miniGameLifecycle.closeResult}
                nextSpawn={nextSpawn}
                onPlayNext={(spawn) => {
                  miniGameLifecycle.closeResult();
                  // Tiny delay so the result panel finishes its exit
                  // before the prompt opens — avoids two stacked
                  // modals in the same frame.
                  setTimeout(() => {
                    miniGameLifecycle.engageWithSpawn(spawn);
                  }, 120);
                }}
              />
            );
          })()}

          {/* Left Sidebar & Floating Popup Tools Panel Wrapper.
              `contain: layout` keeps ToolsPanel popover open/close
              from re-laying out the whole map subtree. */}
          <div
            id="left-control-panel"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-[60] sm:left-3 md:left-4 lg:left-5 flex items-center gap-3"
            style={{ contain: "layout" }}
          >
            <LeftSidebar
              ventureName={ideaTitle}
              onOpenPanel={handleSidebarOpenPanel}
            />

            {/* Tools Panel (Left - Floating Popup next to sidebar) */}
            <ToolsPanel
              isOpen={isToolsPanelOpen}
              onClose={() => updateUrlParams({ panel: null, tab: null })}
              activeTab={activeToolsTab}
              onTabChange={(tab) => updateUrlParams({ panel: "tools", tab })}
              activeVentureId={activeVenture?._id}
              onOpenGroupChat={() => {
                if (activeVenture?.ideaId) {
                  openGroupChat(activeVenture.ideaId, activeConversationId as Id<"conversations"> | undefined);
                }
                setIsGroupChatOpen(true);
              }}
              onOpenContributors={() => setIsContributorsOpen(true)}
              onOpenContributions={() => setIsContributionsOpen(true)}
              onOpenHierarchy={() => setIsHierarchyOpen(true)}
              onOpenCalendar={() => setIsCalendarOpen(true)}
              onOpenKanban={() => setIsKanbanOpen(true)}
              onOpenJournal={() => setIsJournalOpen(true)}
            />
          </div>

          {/* Checkpoint detail panel — deferred mount.
              `selectedDetail` flips synchronously on click (React
              commits the state). React then schedules the heavy
              CheckpointPanel render at lower priority via
              `useDeferredValue`, so the click event finishes paint
              before the panel mount work runs. User sees the slide-in
              on the next frame (~16ms, imperceptible). No skeleton —
              an earlier skeleton attempt added CLS because its size
              didn't match the real panel content. */}
          <AnimatePresence>
            {deferredSelectedDetail && (
              <CheckpointPanel
                detail={deferredSelectedDetail}
                onClose={() => updateUrlParams({ checkpointId: null })}
                onAdvance={handleAdvance}
                onTaskToggle={handleTaskToggle}
                onTaskRedo={handleTaskRedo}
                evaluationSummary={checkpointEvaluationSummary ?? undefined}
                isAdvancing={isAdvancingCheckpoint}
                activeStage={activeStage}
                activeCheckpoint={activeCP}
                showBossGateHint={showBossGateHint}
                tourActive={
                  tourStateForPulse?.state === "not_started" ||
                  tourStateForPulse?.state === "in_progress"
                }
                isCurrentMapCheckpoint={
                  deferredSelectedDetail.stage === activeStage &&
                  deferredSelectedDetail.checkpointIndex === activeCP
                }
                totalCheckpointsInStage={
                  templateStages[deferredSelectedDetail.stage - 1]?.checkpoints ?? 4
                }
                ventureId={venture?._id}
              />
            )}
          </AnimatePresence>

          {/* Click-away backdrop (left of panel) */}
          {selectedDetail && (
            <div
              className="absolute inset-0 z-[50] hidden sm:block"
              style={{ right: "min(92vw, 420px)" }}
              onClick={() => updateUrlParams({ checkpointId: null })}
            />
          )}

          {/* Click-away backdrop (right of tools panel) */}
          {isToolsPanelOpen && (
            <div
              className="absolute inset-0 z-[50]"
              style={{ left: "min(92vw, 420px)" }}
              onClick={() => updateUrlParams({ panel: null, tab: null })}
            />
          )}

          {/* First checkpoint pulse tutorial */}
          {showFirstCheckpointPulse && (
            <FirstCheckpointPulse
              onCheckpointClick={() => {
                setShowFirstCheckpointPulse(false);
                if (typeof window !== "undefined") {
                  localStorage.setItem("first_checkpoint_pulse_shown", "true");
                }
              }}
            />
          )}

          {/* Task submission modal */}
          <TaskSubmissionModal
            isOpen={!!submittingTask}
            onClose={() => setSubmittingTask(null)}
            task={submittingTask}
            onSuccess={handleTaskSubmissionSuccess}
          />

          {/* Stage Clear Modal — only mount while it should be visible
              so its timers / dynamic import / framer hooks stay cold
              otherwise. */}
          {stageClearModal.show && (
            <StageClearModal
              show
              stageNumber={stageClearModal.stageNumber}
              stageName={stageClearModal.stageName}
              isGold={stageClearModal.isGold}
              medalTier={stageClearModal.medalTier}
              fromBiome={stageClearModal.fromBiome}
              nextStageName={stageClearModal.nextStageName}
              nextBiome={stageClearModal.nextBiome}
              onComplete={() =>
                setStageClearModal((prev) => ({ ...prev, show: false }))
              }
            />
          )}

          {/* Contributions / Project Feed Popup Modal */}
          <AnimatePresence>
            {isContributionsOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsContributionsOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="relative w-full max-w-[600px] h-[680px] max-h-[88vh] rounded-3xl border border-white/10 overflow-hidden shadow-2xl z-10 flex flex-col"
                  style={{
                    background: "linear-gradient(180deg, rgba(16, 20, 35, 0.95), rgba(10, 12, 22, 0.98))",
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
                  }}
                >
                  <div className="flex-1 h-full min-h-0 flex flex-col p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-white/10 shrink-0">
                      <h2 className="text-md font-bold text-white flex items-center gap-2">
                        <Rss className="w-5 h-5 text-indigo-400" />
                        Project Feed
                      </h2>
                      <button
                        onClick={() => setIsContributionsOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {(() => {
                      if (!activeVenture?.ideaId || !ideaForContributors) {
                        return (
                          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-slate-400">Loading project feed...</span>
                          </div>
                        );
                      }

                      // Safe parsing helper matching our main schema
                      const parseTagsString = (str?: string) => {
                        if (!str) return [];
                        try {
                          const parsed = JSON.parse(str);
                          if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
                        } catch { }
                        return str.split(",").map(s => s.trim()).filter(Boolean);
                      };

                      const tags = [
                        ...parseTagsString(ideaForContributors.category),
                        ...parseTagsString(ideaForContributors.industries),
                      ];

                      return (
                        <MapFeedComposer
                          ideaId={activeVenture.ideaId}
                          ideaTitle={ideaForContributors.title}
                          ideaTags={tags}
                          onPosted={() => { }}
                        />
                      );
                    })()}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Hierarchy Popup Modal */}
          <AnimatePresence>
            {isHierarchyOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsHierarchyOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="relative w-full max-w-[700px] h-[600px] max-h-[85vh] rounded-3xl border border-white/10 overflow-hidden shadow-2xl z-10 flex flex-col"
                  style={{
                    background: "linear-gradient(180deg, rgba(16, 20, 35, 0.95), rgba(10, 12, 22, 0.98))",
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
                  }}
                >
                  <div className="flex-1 h-full min-h-0 flex flex-col p-5">
                    <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-white/10 shrink-0">
                      <h2 className="text-md font-bold text-white flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-indigo-400" />
                        Idea Hierarchy
                      </h2>
                      <button
                        onClick={() => setIsHierarchyOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                      {ideaForContributors ? (
                        <IdeaHierarchyFlowchart
                          ideaId={ideaForContributors._id as Id<"ideas">}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-slate-400">Loading hierarchy...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Calendar Popup Modal */}
          <AnimatePresence>
            {isCalendarOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsCalendarOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="relative w-full max-w-[800px] h-[650px] max-h-[85vh] rounded-3xl border border-white/10 overflow-hidden shadow-2xl z-10 flex flex-col"
                  style={{
                    background: "linear-gradient(180deg, rgba(16, 20, 35, 0.95), rgba(10, 12, 22, 0.98))",
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
                  }}
                >
                  <div className="flex-1 h-full min-h-0 flex flex-col p-5">
                    <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-white/10 shrink-0">
                      <h2 className="text-md font-bold text-white flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-amber-400" />
                        Calendar &amp; Syncs
                      </h2>
                      <button
                        onClick={() => setIsCalendarOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                      <CalendarTool
                        prompt="Plan your venture milestones and team syncs."
                        initialContent={calendarData}
                        kanbanData={kanbanData}
                        journalData={journalData}
                        onSubmit={(data) => handleToolSubmit("calendar", data)}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Kanban Popup Modal */}
          <AnimatePresence>
            {isKanbanOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsKanbanOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="relative w-full max-w-[1000px] h-[700px] max-h-[88vh] rounded-3xl border border-white/10 overflow-hidden shadow-2xl z-10 flex flex-col"
                  style={{
                    background: "linear-gradient(180deg, rgba(16, 20, 35, 0.95), rgba(10, 12, 22, 0.98))",
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
                  }}
                >
                  <div className="flex-1 h-full min-h-0 flex flex-col p-5">
                    <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-white/10 shrink-0">
                      <h2 className="text-md font-bold text-white flex items-center gap-2">
                        <KanbanIcon className="w-5 h-5 text-emerald-400" />
                        Kanban Board
                      </h2>
                      <button
                        onClick={() => setIsKanbanOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                      <KanbanTool
                        prompt="Manage your venture tasks and workflow."
                        initialContent={kanbanData}
                        onSubmit={(data) => handleToolSubmit("kanban", data)}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Journal Popup Modal */}
          <AnimatePresence>
            {isJournalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsJournalOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="relative w-full max-w-[650px] h-[650px] max-h-[85vh] rounded-3xl border border-white/10 overflow-hidden shadow-2xl z-10 flex flex-col"
                  style={{
                    background: "linear-gradient(180deg, rgba(16, 20, 35, 0.95), rgba(10, 12, 22, 0.98))",
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
                  }}
                >
                  <div className="flex-1 h-full min-h-0 flex flex-col p-5">
                    <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-white/10 shrink-0">
                      <h2 className="text-md font-bold text-white flex items-center gap-2">
                        <JournalIcon className="w-5 h-5 text-violet-400" />
                        Journal
                      </h2>
                      <button
                        onClick={() => setIsJournalOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                      <JournalTool
                        prompt="Log your daily progress and thoughts."
                        initialContent={journalData}
                        onSubmit={(data) => handleToolSubmit("journal", data)}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Contributors Popup Modal — same style as Group Chat */}
          <AnimatePresence>
            {isContributorsOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsContributorsOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="relative w-full max-w-[600px] h-[650px] max-h-[85vh] rounded-3xl border border-white/10 overflow-hidden shadow-2xl z-10 flex flex-col"
                  style={{
                    background: "linear-gradient(180deg, rgba(16, 20, 35, 0.95), rgba(10, 12, 22, 0.98))",
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
                  }}
                >
                  <div className="flex-1 h-full min-h-0 flex flex-col p-5">
                    <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-white/10 shrink-0">
                      <h2 className="text-md font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-400" />
                        Team &amp; Contributors
                      </h2>
                      <button
                        onClick={() => setIsContributorsOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                      {ideaForContributors ? (
                        ideaForContributors.isAuthor ? (
                          <Tabs defaultValue="incoming" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-xl p-1 mb-3">
                              <TabsTrigger value="incoming" className="data-[state=active]:bg-white/10 rounded-lg text-xs">Incoming Requests</TabsTrigger>
                              <TabsTrigger value="invite" className="data-[state=active]:bg-white/10 rounded-lg text-xs">Invite Contributors</TabsTrigger>
                            </TabsList>
                            <TabsContent value="incoming">
                              <ContributionDashboard
                                ideaId={ideaForContributors._id as Id<"ideas">}
                                ideaTitle={ideaForContributors.title}
                                authorId={ideaForContributors.authorId}
                                authorName={ideaForContributors.author?.name || ideaForContributors.author?.username}
                                isAuthor
                                onClose={() => setIsContributorsOpen(false)}
                                embedded
                              />
                            </TabsContent>
                            <TabsContent value="invite">
                              <InvitationSection
                                idea={{ _id: ideaForContributors._id as Id<"ideas">, isAuthor: true }}
                                embedded
                              />
                            </TabsContent>
                          </Tabs>
                        ) : (
                          <div className="space-y-4">
                            <ContributionDashboard
                              ideaId={ideaForContributors._id as Id<"ideas">}
                              ideaTitle={ideaForContributors.title}
                              authorId={ideaForContributors.authorId}
                              authorName={ideaForContributors.author?.name || ideaForContributors.author?.username}
                              isAuthor={false}
                              onClose={() => setIsContributorsOpen(false)}
                            />
                            <InvitationSection idea={{ _id: ideaForContributors._id as Id<"ideas">, isAuthor: false }} />
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-slate-400">Loading team dashboard...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Real-time Group Chat Popup Modal */}
          <AnimatePresence>
            {isGroupChatOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop with elegant blur */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handlePopupClose}
                  className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Floating Chat Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="relative w-full max-w-[550px] h-[650px] max-h-[85vh] rounded-3xl border border-white/10 overflow-hidden shadow-2xl z-10 flex flex-col"
                  style={{
                    background: "linear-gradient(180deg, rgba(16, 20, 35, 0.95), rgba(10, 12, 22, 0.98))",
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
                  }}
                >
                  {selectedConversationId || selectedReceiverId ? (
                    <div className="flex-1 h-full min-h-0 flex flex-col overflow-hidden rounded-3xl">
                      <ChatThread
                        conversationId={selectedConversationId}
                        onBack={handleBack}
                        onClose={handlePopupClose}
                        ideaId={selectedIdeaId}
                        receiverId={selectedReceiverId}
                      />
                    </div>
                  ) : selectedIdeaId ? (
                    <div className="flex-1 h-full min-h-0 flex flex-col overflow-hidden rounded-3xl">
                      <ChannelList
                        ideaId={selectedIdeaId}
                        onBack={handleBack}
                        onSelectChannel={handleSelectChannel}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 h-full min-h-0 flex flex-col overflow-hidden rounded-3xl">
                      <GroupList
                        onSelectGroup={handleSelectGroup}
                        onClose={handlePopupClose}
                      />
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MapFeedComposer — inline feed post composer for the Project Contributions popup
// Posts via api.ideas.addComment with auto-prepended project name + tags header
// ─────────────────────────────────────────────────────────────────────────────
function MapFeedComposer({
  ideaId,
  ideaTitle,
  ideaCategory,
  ideaTags,
  onPosted,
}: {
  ideaId: Id<"ideas">;
  ideaTitle: string;
  ideaCategory?: string;
  ideaTags?: string[];
  onPosted?: () => void;
}) {
  const { userId } = useAuth();
  const addCommentMutation = useMutation(api.ideas.addComment);
  const toggleCommentSpark = useMutation(api.ideas.toggleCommentSpark);
  const comments = useQuery(api.ideas.getComments, { ideaId, limit: 50 });

  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [sharingPost, setSharingPost] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tagsArr: string[] = ideaTags ?? (ideaCategory ? [ideaCategory] : []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !userId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const fullContent = content.trim();
      await addCommentMutation({ ideaId, content: fullContent });
      setContent("");
      setPosted(true);
      setSharingPost(fullContent); // Open share modal immediately on post success!
      setTimeout(() => setPosted(false), 2500);
      onPosted?.();
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      }, 100);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRelative = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrls = (text: string) => {
    const cleanText = text.trim();
    const shareText = `${cleanText}\n\nCheck out our venture:`;
    const shareLink = typeof window !== "undefined" ? `${window.location.origin}/idea/${ideaId}` : "";
    return {
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareLink)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareLink)}`,
      instagram: "https://www.instagram.com",
    };
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-3 relative">
      {/* Composer box */}
      <div className="shrink-0">
        <form onSubmit={handlePost}>
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] focus-within:border-indigo-500/40 focus-within:bg-white/[0.04] focus-within:shadow-[0_0_20px_rgba(99,102,241,0.05)] transition-all duration-300">
            <textarea
              placeholder="What's on your mind? Share an update, insight, or files with the team..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1200}
              rows={4}
              className="w-full resize-none rounded-2xl bg-transparent px-4.5 pt-4 pb-12 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-0 leading-relaxed"
              disabled={isSubmitting}
            />
            <div className="absolute bottom-3.5 left-4.5 text-[10px] text-zinc-500 font-medium tracking-wide tabular-nums pointer-events-none">
              {content.length} / 1200
            </div>
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-4 py-1.8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-indigo-900/20 active:scale-[0.98] transition-all"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Post Update</span>
            </button>
          </div>
        </form>
        {posted && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-emerald-400 mt-2 px-1 font-medium flex items-center gap-1"
          >
            <span>✓</span> Post published successfully!
          </motion.p>
        )}
      </div>

      {/* Feed divider */}
      <div className="flex items-center gap-3 shrink-0 py-1">
        <div className="h-[1px] flex-1 bg-white/5" />
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
          </span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Team Updates</span>
        </div>
        <div className="h-[1px] flex-1 bg-white/5" />
      </div>

      {/* Past posts scroll list */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-3.5 pr-0.5">
        {comments === undefined ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-zinc-500">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading activity feed…</span>
          </div>
        ) : comments.filter(c => !c.parentCommentId).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
            <Rss className="w-6 h-6 text-zinc-600 animate-pulse" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-zinc-300">No activity yet</p>
              <p className="text-[10px] text-zinc-500">Be the first to share an update with the team.</p>
            </div>
          </div>
        ) : (
          comments
            .filter(c => !c.parentCommentId)
            .slice()
            .reverse()
            .map(c => {
              const hasSparked = c.userHasSparked;
              return (
                <div 
                  key={c._id} 
                  className="group relative flex gap-3 rounded-2xl border border-white/5 bg-white/[0.01] p-4 transition-all duration-300 hover:bg-white/[0.02] hover:border-white/10"
                >
                  {/* Left: Avatar */}
                  <div className="shrink-0">
                    {c.author?.avatar ? (
                      <img 
                        src={c.author.avatar} 
                        className="w-9.5 h-9.5 rounded-full object-cover border border-white/10 shadow-sm" 
                        alt={c.author.name || "User"}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-9.5 h-9.5 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 shadow-sm uppercase">
                        {getInitials(c.author?.name || c.author?.username)}
                      </div>
                    )}
                  </div>

                  {/* Right: Content details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Header bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="text-xs font-bold text-zinc-100 truncate hover:text-indigo-400 transition-colors">
                          {c.author?.name || c.author?.username || "Someone"}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium shrink-0">
                          {formatRelative(c.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            audioManager.playUI("click");
                            setSharingPost(c.content);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors border border-white/5"
                          title="Share post"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Post Text */}
                    <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap break-words">
                      {c.content}
                    </p>

                    {/* Bottom Actions Row */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={async () => {
                          audioManager.playUI(hasSparked ? "click" : "confirm");
                          try {
                            await toggleCommentSpark({ commentId: c._id });
                          } catch (err) {
                            console.error("Failed to toggle comment spark:", err);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all duration-300 ${
                          hasSparked
                            ? "bg-amber-400/10 border-amber-400/30 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:bg-amber-400/25"
                            : "bg-white/5 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
                        }`}
                        title={hasSparked ? "Unspark this comment" : "Spark this comment"}
                      >
                        <Zap className={`w-3 h-3 ${hasSparked ? "fill-amber-300 stroke-amber-400 animate-pulse" : ""}`} />
                        <span className="tabular-nums">{c.sparkCount || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Premium Social Share Drawer/Modal overlay */}
      <AnimatePresence>
        {sharingPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md rounded-2xl flex flex-col justify-center p-6 z-20"
          >
            <div className="text-center space-y-1 mb-5">
              <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" /> Share Contribution
              </h3>
              <p className="text-xs text-slate-400">Share your latest milestone update with the world</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-5 max-h-[140px] overflow-y-auto no-scrollbar">
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed italic">{sharingPost}</p>
            </div>

            {/* Social Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <a
                href={shareUrls(sharingPost).x}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-white font-semibold text-xs transition-colors"
              >
                𝕏 Share on X
              </a>
              <a
                href={shareUrls(sharingPost).linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0077B5]/20 border border-[#0077B5]/40 hover:bg-[#0077B5]/30 text-white font-semibold text-xs transition-colors"
              >
                LinkedIn
              </a>
              <a
                href={shareUrls(sharingPost).whatsapp}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366]/25 border border-[#25D366]/40 hover:bg-[#25D366]/35 text-white font-semibold text-xs transition-colors"
              >
                WhatsApp
              </a>
              <button
                onClick={() => {
                  handleCopyLink(sharingPost);
                  window.open(shareUrls(sharingPost).instagram, "_blank");
                }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#833AB4]/20 via-[#FD1D1D]/20 to-[#F56040]/20 border border-[#FD1D1D]/30 hover:opacity-90 text-white font-semibold text-xs transition-colors"
              >
                📸 Instagram Info
              </button>
            </div>

            {/* Copy Link Actions */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleCopyLink(sharingPost)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied text!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Post Text
                  </>
                )}
              </button>
              <button
                onClick={() => setSharingPost(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
            {copied && (
              <p className="text-[10px] text-center text-indigo-300 mt-3">
                ✓ Ready to paste! Instagram will open so you can share your milestone.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div
          className="absolute inset-0 z-[60] flex flex-col items-center justify-center"
          style={{ background: "#050810", fontFamily: "var(--font-sans)" }}
        >
          <div
            className="text-xs tracking-[0.3em] uppercase font-black"
            style={{ color: "#6366f1" }}
          >
            Entering the World…
          </div>
        </div>
      }
    >
      <MapPageInner />
      <MapTourMount />
    </Suspense>
  );
}

function MapTourMount() {
  const tutorialState = useQuery(api.tutorial.getMyFeedTutorialState, {});
  // Needed to drive the FeedTutorial's phase machine. FeedTutorial
  // itself no longer queries this (deduped from /feed), so each mount
  // point feeds it in.
  const myIdeaCount = useQuery(api.tutorial_metrics.getMyIdeaCount, {});
  const [show, setShow] = useState(false);
  // Stable callback so the memoized FeedTutorial doesn't re-render.
  const onClose = useCallback(() => {
    setShow(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("feedTourClosed", "1");
    }
  }, []);
  useEffect(() => {
    if (!tutorialState) return;
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("feedTourClosed") === "1"
    ) {
      return;
    }
    if (
      tutorialState.state !== "not_started" &&
      tutorialState.state !== "in_progress"
    ) {
      return;
    }

    // Don't show the tour until Phaser has reported its boot scene
    // finished, plus a 400ms breath so the world-map idle animations
    // can hand off. Fallback timeout of 3.5s in case PHASER_READY
    // never fires (e.g. WebGL unsupported, slow assets).
    let bufferTimer: number | undefined;
    let cancelled = false;

    const arm = () => {
      if (cancelled) return;
      bufferTimer = window.setTimeout(() => {
        if (!cancelled) setShow(true);
      }, 400);
    };

    const off = eventBridge.onReact("PHASER_READY", arm);
    const fallbackTimer = window.setTimeout(arm, 3500);

    return () => {
      cancelled = true;
      off?.();
      if (bufferTimer) window.clearTimeout(bufferTimer);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };
  }, [tutorialState]);
  return (
    <FeedTutorial
      show={show}
      initialStep={tutorialState?.step ?? 0}
      onClose={onClose}
      myIdeaCount={myIdeaCount}
    />
  );
}
