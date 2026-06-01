import { describe, expect, it } from "vitest";
import {
  getStageCorruptionLevel,
  resolveCorruptionProfile,
} from "@/lib/phaser/systems/corruptionSystem";
import type { CheckpointState } from "@/lib/phaser/utils/event-bridge";

function cp(
  stage: number,
  checkpoint: number,
  status: CheckpointState["status"],
  tasks: { t1?: boolean; t2?: boolean; t3?: boolean } = {},
): CheckpointState {
  return {
    id: `${stage}-${checkpoint}`,
    stage,
    checkpoint,
    status,
    t1: tasks.t1 ?? false,
    t2: tasks.t2 ?? false,
    t3: tasks.t3 ?? false,
  };
}

describe("corruptionSystem", () => {
  it("ramps animation density and hostile motion at 100%", () => {
    const high = resolveCorruptionProfile(100);
    const low = resolveCorruptionProfile(0);

    expect(high.animationDensityMul).toBeGreaterThan(low.animationDensityMul * 2);
    expect(high.hostileMotion).toBeGreaterThan(low.hostileMotion);
    expect(high.wildlifeDensity).toBeLessThan(low.wildlifeDensity);
  });

  it("heals stage corruption as checkpoints complete", () => {
    const checkpoints: CheckpointState[] = [
      cp(1, 1, "gold", { t1: true, t2: true, t3: true }),
      cp(1, 2, "completed"),
      cp(1, 3, "locked"),
      cp(1, 4, "locked"),
    ];

    const stressed = getStageCorruptionLevel({
      ventureCorruption: 80,
      stageId: 1,
      checkpoints,
      currentStage: 1,
      slainStages: new Set(),
      totalStages: 8,
    });

    const full = getStageCorruptionLevel({
      ventureCorruption: 80,
      stageId: 1,
      checkpoints: checkpoints.map((c) => ({ ...c, status: "locked" as const })),
      currentStage: 1,
      slainStages: new Set(),
      totalStages: 8,
    });

    expect(stressed).toBeLessThan(full);
  });

  it("at 79% corruption the profile is strongly visible", () => {
    const profile = resolveCorruptionProfile(79);
    expect(profile.overlayAlpha).toBeGreaterThan(0.4);
    expect(profile.hazeAlpha).toBeGreaterThan(0.2);
    expect(profile.desaturate).toBeGreaterThan(0.4);
    expect(profile.cssFilter).not.toBe("none");
  });

  it("active stage tracks venture meter at 79%", () => {
    const level = getStageCorruptionLevel({
      ventureCorruption: 79,
      stageId: 2,
      checkpoints: [
        cp(2, 1, "active"),
        cp(2, 2, "locked"),
        cp(2, 3, "locked"),
      ],
      currentStage: 2,
      slainStages: new Set(),
      totalStages: 8,
    });
    expect(level).toBeGreaterThanOrEqual(72);
  });

  it("purifies slain boss stages", () => {
    const level = getStageCorruptionLevel({
      ventureCorruption: 90,
      stageId: 2,
      checkpoints: [],
      currentStage: 3,
      slainStages: new Set([2]),
      totalStages: 8,
    });

    expect(level).toBeLessThanOrEqual(12);
  });
});
