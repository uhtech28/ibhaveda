import type { CheckpointState } from "@/lib/phaser/utils/event-bridge";

export type ConvexCheckpointRow = {
  _id: string;
  stage: number;
  checkpoint: number;
  status: string;
  t1Completed: boolean;
  t2Completed: boolean;
  t3Completed: boolean;
  goldBonusEarned?: boolean;
};

export type DerivedCheckpointStatus =
  | "locked"
  | "active"
  | "partial"
  | "completed"
  | "gold";

/** Stable string for skipping redundant Phaser UPDATE_CHECKPOINTS dispatches. */
export function buildCheckpointSyncSignature(
  checkpoints: ConvexCheckpointRow[],
  activeStage: number,
  activeCP: number,
  deriveStatus: (
    cp: ConvexCheckpointRow,
    stage: number,
    cpNum: number,
  ) => DerivedCheckpointStatus,
): string {
  const rows = checkpoints
    .map((cp) => {
      const status = deriveStatus(cp, activeStage, activeCP);
      return `${cp._id}:${cp.t1Completed}:${cp.t2Completed}:${cp.t3Completed}:${status}`;
    })
    .join("|");
  return `${activeStage}:${activeCP}:${rows}`;
}

export function mapCheckpointsToPhaserState(
  checkpoints: ConvexCheckpointRow[],
  activeStage: number,
  activeCP: number,
  deriveStatus: (
    cp: ConvexCheckpointRow,
    stage: number,
    cpNum: number,
  ) => DerivedCheckpointStatus,
): CheckpointState[] {
  return checkpoints.map((cp) => {
    const localStatus = deriveStatus(cp, activeStage, activeCP);
    const phaserStatus = localStatus === "partial" ? "in_progress" : localStatus;
    return {
      id: cp._id,
      stage: cp.stage,
      checkpoint: cp.checkpoint,
      status: phaserStatus as CheckpointState["status"],
      t1: cp.t1Completed,
      t2: cp.t2Completed,
      t3: cp.t3Completed,
      goldBonusEarned:
        !!cp.goldBonusEarned ||
        (cp.t1Completed && cp.t2Completed && cp.t3Completed),
    };
  });
}
