import { describe, expect, it } from "vitest";
import {
  getBaseTreeBlurStrength,
  getTreeBlurStrength,
  type CheckpointWorldPosition,
} from "@/lib/phaser/systems/StageEnvironmentBlur";

describe("StageEnvironmentBlur", () => {
  it("increases blur with corruption", () => {
    expect(getBaseTreeBlurStrength(79)).toBeGreaterThan(
      getBaseTreeBlurStrength(20),
    );
  });

  it("reduces blur near completed checkpoints", () => {
    const tree = { x: 500, y: 400 };
    const cps: CheckpointWorldPosition[] = [
      {
        stage: 2,
        checkpoint: 1,
        x: 520,
        y: 410,
        status: "completed",
      },
    ];

    const far = getTreeBlurStrength(80, tree.x, tree.y, []);
    const near = getTreeBlurStrength(80, tree.x, tree.y, cps);

    expect(near).toBeLessThan(far);
  });
});
