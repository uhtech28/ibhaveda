import { atom } from "jotai";
import type { Id } from "@convex/_generated/dataModel";

export interface VentureData {
  id: string;
  name: string;
  currentStage: number;
  currentCheckpoint: number;
  totalCheckpoints: number;
}

export interface UserProgress {
  level: number;
  phase: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  qualityScore: number;
  valuationScore: number;
}

export interface CorruptionState {
  level: number;
  phase: "calm" | "creeping" | "desaturated" | "urgent" | "critical";
  bossName: string;
  bossHp: number;
  bossBaseHp: number;
}

export interface HUDVisibility {
  hudVisible: boolean;
  hudExpanded: boolean;
}

export interface QuestTask {
  id: string;
  checkpointId: Id<"ventureCheckpoints">;
  taskLevel: "t1" | "t2" | "t3";
  label: string;
  description: string;
  tool: string;
  points: number;
  done: boolean;
}

export interface CurrentQuest {
  checkpointName: string;
  tasks: QuestTask[];
  stage: number;
  checkpoint: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE-AWARE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type TemplateId = "venture" | "academic" | "lab" | "creative";
export type MetricDirection = "higher_is_better" | "lower_is_better";

/**
 * Template metric state — drives the HUD metric display.
 * Replaces the hardcoded valuationScore for non-Venture templates.
 */
export interface TemplateMetricState {
  templateId: TemplateId;
  /** Label shown in HUD (e.g. "JIF Score", "p-value", "Fan Score") */
  label: string;
  /** Emoji icon shown next to the metric */
  icon: string;
  /** Current metric value */
  value: number;
  /** Human-readable formatted value */
  displayValue: string;
  /** Which direction is better */
  direction: MetricDirection;
  /** Current quality tier */
  qualityTier: "low" | "standard" | "high";
  /** HUD accent color for this template (CSS hex) */
  accentColor: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING ATOMS (preserved for Venture backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export const hudVisibleAtom = atom<boolean>(true);
export const hudExpandedAtom = atom<boolean>(true);
export const activeVentureAtom = atom<VentureData | null>(null);
export const userProgressAtom = atom<UserProgress>({
  level: 1,
  phase: 1,
  xp: 0,
  xpToNextLevel: 100,
  streak: 0,
  qualityScore: 0,
  valuationScore: 0,
});

export const audioSettingsAtom = atom({
  masterVolume: 1.0,
  musicVolume: 1.0,
  sfxVolume: 1.0,
  uiVolume: 1.0,
  muted: false,
});

export const corruptionStateAtom = atom<CorruptionState>({
  level: 0,
  phase: "calm",
  bossName: "Unknown Boss",
  bossHp: 100,
  bossBaseHp: 100,
});

export const stageInfoAtom = atom({
  stageName: "Ideation",
  stageIcon: "💡",
  biomeName: "The Forest",
  stage: 1,
  currentCheckpoint: 1,
  totalCheckpointsInStage: 4,
});

export const checkpointProgressAtom = atom({
  completed: 0,
  total: 36,
  goldCount: 0,
});

// Task system atoms
export interface SubmittingTask {
  id: string;
  checkpointId: Id<"ventureCheckpoints">;
  taskLevel: "t1" | "t2" | "t3";
  title: string;
  description: string;
  toolType: string;
  points: number;
}

export const currentQuestAtom = atom<CurrentQuest | null>(null);
export const submittingTaskAtom = atom<SubmittingTask | null>(null);
export const activeTaskAtom = atom<SubmittingTask | null>(null);

// Gold counter atom
export const goldCountAtom = atom<number>(0);

// ─────────────────────────────────────────────────────────────────────────────
// NEW: TEMPLATE-AWARE ATOMS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Active template ID — drives HUD color scheme, metric label, and icon.
 * Defaults to "venture" for all existing flows.
 */
export const templateIdAtom = atom<TemplateId>("venture");

/**
 * Template metric state — drives the HUD metric display.
 * Updated whenever AI scoring completes or the venture is loaded.
 */
export const templateMetricAtom = atom<TemplateMetricState>({
  templateId: "venture",
  label: "Valuation Score",
  icon: "💰",
  value: 0,
  displayValue: "₹0",
  direction: "higher_is_better",
  qualityTier: "low",
  accentColor: "#6366f1",
});

/**
 * Corruption engine state — extended with template-aware visual phase names.
 * The corruption level (0–100) is the same for all templates.
 */
export const corruptionEngineAtom = atom<{
  level: number;
  phase: "calm" | "creeping" | "desaturated" | "urgent" | "critical";
  lastActivityAt: number;
  daysSinceActivity: number;
  stalledCheckpointDays: number;
  bossEmerging: boolean;
}>({
  level: 0,
  phase: "calm",
  lastActivityAt: Date.now(),
  daysSinceActivity: 0,
  stalledCheckpointDays: 0,
  bossEmerging: false,
});

/**
 * Inter-checkpoint gameplay state.
 */
export const interCheckpointAtom = atom<{
  henchmenEncountered: number;
  treasuresFound: number;
  corruptionShields: number;
  insightFragments: number;
}>({
  henchmenEncountered: 0,
  treasuresFound: 0,
  corruptionShields: 0,
  insightFragments: 0,
});

