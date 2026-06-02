/**
 * Per-checkpoint boss gate: every Advance on the venture's current checkpoint
 * opens boss combat once, then the map advances.
 */

export type StageBossCheckpoint = {
  stage: number;
  checkpoint: number;
  status: string;
  t1Completed?: boolean;
  t2Completed?: boolean;
  t3Completed?: boolean;
  goldBonusEarned?: boolean;
};

export function countDoneTasks(cp: StageBossCheckpoint): number {
  return [cp.t1Completed, cp.t2Completed, cp.t3Completed].filter(Boolean)
    .length;
}

export function checkpointBossKey(stage: number, checkpoint: number): string {
  return `${stage}-${checkpoint}`;
}

export function isActiveVentureCheckpoint(
  cp: StageBossCheckpoint,
  currentStage: number,
  currentCheckpoint: number,
): boolean {
  return cp.stage === currentStage && cp.checkpoint === currentCheckpoint;
}

export function isLastCheckpointInStage(
  checkpoints: StageBossCheckpoint[],
  stage: number,
  checkpoint: number,
): boolean {
  return !checkpoints.some(
    (c) => c.stage === stage && c.checkpoint === checkpoint + 1,
  );
}

/** Venture pointer has already moved past this checkpoint on the map. */
export function isCheckpointPassedOnMap(
  cp: StageBossCheckpoint,
  currentStage: number,
  currentCheckpoint: number,
): boolean {
  if (cp.stage < currentStage) return true;
  if (cp.stage === currentStage && cp.checkpoint < currentCheckpoint) {
    return true;
  }
  return false;
}

/** Boss already cleared for checkpoints the player has passed on the map. */
export function hydrateBossDefeatedFromCheckpoints(
  checkpoints: StageBossCheckpoint[],
  currentStage: number,
  currentCheckpoint: number,
): Set<string> {
  const defeated = new Set<string>();
  for (const cp of checkpoints) {
    if (isCheckpointPassedOnMap(cp, currentStage, currentCheckpoint)) {
      defeated.add(checkpointBossKey(cp.stage, cp.checkpoint));
    }
  }
  return defeated;
}

export function mergeBossDefeatedSets(
  base: Set<string>,
  additions: Set<string>,
): Set<string> {
  const merged = new Set(base);
  for (const key of additions) {
    merged.add(key);
  }
  return merged;
}

/**
 * Merge map + storage boss state. Never treat stale storage on the *active*
 * checkpoint as defeated — only an in-session defeat (after winning) counts.
 */
export function mergeBossDefeatedState(
  checkpoints: StageBossCheckpoint[],
  currentStage: number,
  currentCheckpoint: number,
  ventureId: string | undefined,
  sessionDefeats: Set<string>,
): Set<string> {
  const fromMap = hydrateBossDefeatedFromCheckpoints(
    checkpoints,
    currentStage,
    currentCheckpoint,
  );
  const fromStorage = ventureId
    ? loadCheckpointBossDefeatedFromStorage(ventureId)
    : new Set<string>();
  const activeKey = checkpointBossKey(currentStage, currentCheckpoint);
  fromStorage.delete(activeKey);

  const merged = mergeBossDefeatedSets(fromMap, fromStorage);
  if (sessionDefeats.has(activeKey)) {
    merged.add(activeKey);
  }
  return merged;
}

/**
 * True when Advance must open boss combat before the map can move forward.
 */
export function needsCheckpointBossCombat(
  cp: StageBossCheckpoint,
  doneTasks: number,
  bossDefeatedAtCheckpoint: Set<string>,
  currentStage: number,
  currentCheckpoint: number,
): boolean {
  if (!isActiveVentureCheckpoint(cp, currentStage, currentCheckpoint)) {
    return false;
  }
  if (doneTasks < 2) return false;

  const key = checkpointBossKey(cp.stage, cp.checkpoint);
  return !bossDefeatedAtCheckpoint.has(key);
}

const CHECKPOINT_BOSS_STORAGE_PREFIX = "ventureCheckpointBoss_";

export function loadCheckpointBossDefeatedFromStorage(
  ventureId: string,
): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(
      `${CHECKPOINT_BOSS_STORAGE_PREFIX}${ventureId}`,
    );
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(
      parsed.filter((k) => typeof k === "string" && k.includes("-")),
    );
  } catch {
    return new Set();
  }
}

export function persistCheckpointBossDefeated(
  ventureId: string,
  defeated: Set<string>,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${CHECKPOINT_BOSS_STORAGE_PREFIX}${ventureId}`,
      JSON.stringify([...defeated]),
    );
  } catch {
    // ignore quota / private mode
  }
}
