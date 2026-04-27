import { atom } from "jotai";

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

export interface HUDVisibility {
  hudVisible: boolean;
  hudExpanded: boolean;
}

export interface QuestTask {
  label: string;
  description: string;
  tool: string;
  done: boolean;
}

export interface CurrentQuest {
  checkpointName: string;
  tasks: QuestTask[];
  stage: number;
  checkpoint: number;
}

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
  masterVolume: 0.8,
  musicVolume: 0.6,
  sfxVolume: 0.7,
  muted: false,
});

export const corruptionAtom = atom<number>(0);

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

export const isAnimatingAtom = atom<boolean>(false);
export const animationTypeAtom = atom<string | null>(null);

// Quest system atoms
export const currentQuestAtom = atom<CurrentQuest | null>(null);

// Gold counter atom
export const goldCountAtom = atom<number>(0);
