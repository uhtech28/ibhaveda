/**
 * Brightness Calculator Tests
 *
 * Comprehensive unit tests for the two-layer world brightness formula.
 *
 * Test coverage:
 * - Core brightness calculation with the 4 spec examples
 * - Phaser post-FX mapping
 * - Venture data integration
 * - Edge cases and boundary conditions
 * - Formula correctness and rounding
 */

import { describe, it, expect } from "vitest";
import {
  calculateBrightness,
  brightnessToPhaser,
  getBrightnessFromVentureData,
  type BrightnessInput,
  type BrightnessResult,
} from "../../src/lib/phaser/utils/brightness-calculator";

describe("Brightness Calculator - Core Formula", () => {
  describe("Worked Examples from Specification", () => {
    it("Example 1: Stage 1 start - completedStages=0, tasks=0/12 → 0.00% + 0.00% = 0.00%", () => {
      const input: BrightnessInput = {
        completedStages: 0,
        tasksDoneInCurrentStage: 0,
        totalTasksInCurrentStage: 12,
      };

      const result = calculateBrightness(input);

      expect(result.accumulatedBase).toBe(0.0);
      expect(result.stageLayer).toBe(0.0);
      expect(result.worldBrightness).toBe(0.0);
    });

    it("Example 2: Entering Stage 2 - completedStages=1, tasks=0/15 → 8.57% + 0.00% = 8.57%", () => {
      const input: BrightnessInput = {
        completedStages: 1,
        tasksDoneInCurrentStage: 0,
        totalTasksInCurrentStage: 15,
      };

      const result = calculateBrightness(input);

      expect(result.accumulatedBase).toBeCloseTo(8.57, 2);
      expect(result.stageLayer).toBe(0.0);
      expect(result.worldBrightness).toBeCloseTo(8.57, 2);
    });

    it("Example 3: Mid-Stage 5 (50% tasks) - completedStages=4, tasks=9/18 → 34.29% + 20.00% = 54.29%", () => {
      const input: BrightnessInput = {
        completedStages: 4,
        tasksDoneInCurrentStage: 9,
        totalTasksInCurrentStage: 18,
      };

      const result = calculateBrightness(input);

      expect(result.accumulatedBase).toBeCloseTo(34.29, 1);
      expect(result.stageLayer).toBeCloseTo(20.0, 1);
      expect(result.worldBrightness).toBeCloseTo(54.29, 1);
    });

    it("Example 4: Final stage complete - completedStages=7, tasks=all → 60.00% + 40.00% = 100.00%", () => {
      const input: BrightnessInput = {
        completedStages: 7,
        tasksDoneInCurrentStage: 15,
        totalTasksInCurrentStage: 15,
      };

      const result = calculateBrightness(input);

      expect(result.accumulatedBase).toBe(60.0);
      expect(result.stageLayer).toBe(40.0);
      expect(result.worldBrightness).toBe(100.0);
    });
  });

  describe("Accumulated Base Layer", () => {
    it("should award ~8.57% per completed stage", () => {
      const basePerStage = 60 / 7;

      for (let stage = 0; stage <= 7; stage++) {
        const input: BrightnessInput = {
          completedStages: stage,
          tasksDoneInCurrentStage: 0,
          totalTasksInCurrentStage: 10,
        };

        const result = calculateBrightness(input);
        const expectedBase = Math.min(stage * basePerStage, 60);

        expect(result.accumulatedBase).toBeCloseTo(expectedBase, 2);
      }
    });

    it("should cap accumulated base at 60% after 7 completed stages", () => {
      const input: BrightnessInput = {
        completedStages: 7,
        tasksDoneInCurrentStage: 0,
        totalTasksInCurrentStage: 10,
      };

      const result = calculateBrightness(input);

      expect(result.accumulatedBase).toBe(60.0);
    });

    it("should not exceed 60% even with more than 7 completed stages", () => {
      const input: BrightnessInput = {
        completedStages: 10, // Hypothetical over-completion
        tasksDoneInCurrentStage: 0,
        totalTasksInCurrentStage: 10,
      };

      const result = calculateBrightness(input);

      expect(result.accumulatedBase).toBe(60.0);
    });

    it("should handle negative completedStages gracefully", () => {
      const input: BrightnessInput = {
        completedStages: -1,
        tasksDoneInCurrentStage: 0,
        totalTasksInCurrentStage: 10,
      };

      const result = calculateBrightness(input);

      // Negative stages result in negative accumulated base (no lower bound clamp)
      expect(result.accumulatedBase).toBeLessThanOrEqual(0);
      // worldBrightness can be negative in this edge case
      expect(result.worldBrightness).toBeLessThanOrEqual(0);
    });
  });

  describe("Stage Layer (Task Progress)", () => {
    it("should award 0% when no tasks are completed", () => {
      const input: BrightnessInput = {
        completedStages: 0,
        tasksDoneInCurrentStage: 0,
        totalTasksInCurrentStage: 12,
      };

      const result = calculateBrightness(input);

      expect(result.stageLayer).toBe(0.0);
    });

    it("should award 40% when all tasks in current stage are completed", () => {
      const input: BrightnessInput = {
        completedStages: 0,
        tasksDoneInCurrentStage: 18,
        totalTasksInCurrentStage: 18,
      };

      const result = calculateBrightness(input);

      expect(result.stageLayer).toBe(40.0);
    });

    it("should interpolate linearly between 0% and 40%", () => {
      const testCases = [
        { done: 0, total: 12, expected: 0.0 },
        { done: 3, total: 12, expected: 10.0 }, // 25% of tasks → 10% brightness
        { done: 6, total: 12, expected: 20.0 }, // 50% of tasks → 20% brightness
        { done: 9, total: 12, expected: 30.0 }, // 75% of tasks → 30% brightness
        { done: 12, total: 12, expected: 40.0 }, // 100% of tasks → 40% brightness
      ];

      testCases.forEach(({ done, total, expected }) => {
        const input: BrightnessInput = {
          completedStages: 0,
          tasksDoneInCurrentStage: done,
          totalTasksInCurrentStage: total,
        };

        const result = calculateBrightness(input);

        expect(result.stageLayer).toBeCloseTo(expected, 1);
      });
    });

    it("should cap stage layer at 40% even if tasksDone exceeds total", () => {
      const input: BrightnessInput = {
        completedStages: 0,
        tasksDoneInCurrentStage: 25, // More than total
        totalTasksInCurrentStage: 20,
      };

      const result = calculateBrightness(input);

      expect(result.stageLayer).toBe(40.0);
    });

    it("should return 0% stage layer when totalTasksInCurrentStage is 0", () => {
      const input: BrightnessInput = {
        completedStages: 0,
        tasksDoneInCurrentStage: 5,
        totalTasksInCurrentStage: 0,
      };

      const result = calculateBrightness(input);

      expect(result.stageLayer).toBe(0.0);
    });
  });

  describe("Combined Brightness (Accumulated + Stage Layer)", () => {
    it("should sum both layers correctly", () => {
      const input: BrightnessInput = {
        completedStages: 3, // 3 × 8.57 ≈ 25.71%
        tasksDoneInCurrentStage: 6, // 6/12 = 50% → 20%
        totalTasksInCurrentStage: 12,
      };

      const result = calculateBrightness(input);

      const expectedBase = (60 / 7) * 3;
      const expectedLayer = (6 / 12) * 40;
      const expectedTotal = expectedBase + expectedLayer;

      expect(result.worldBrightness).toBeCloseTo(expectedTotal, 1);
    });

    it("should never exceed 100% total brightness", () => {
      const input: BrightnessInput = {
        completedStages: 7, // Max base: 60%
        tasksDoneInCurrentStage: 15, // Max layer: 40%
        totalTasksInCurrentStage: 15,
      };

      const result = calculateBrightness(input);

      expect(result.worldBrightness).toBe(100.0);
      expect(result.worldBrightness).toBeLessThanOrEqual(100);
    });

    it("should handle the progression through all 8 stages", () => {
      const stages = [
        { completed: 0, tasks: 0, total: 12, expectedMin: 0, expectedMax: 5 },
        { completed: 1, tasks: 0, total: 15, expectedMin: 8, expectedMax: 10 },
        { completed: 2, tasks: 0, total: 15, expectedMin: 17, expectedMax: 18 },
        { completed: 3, tasks: 0, total: 18, expectedMin: 25, expectedMax: 26 },
        { completed: 4, tasks: 0, total: 18, expectedMin: 34, expectedMax: 35 },
        { completed: 5, tasks: 0, total: 21, expectedMin: 42, expectedMax: 43 },
        { completed: 6, tasks: 0, total: 21, expectedMin: 51, expectedMax: 52 },
        { completed: 7, tasks: 0, total: 24, expectedMin: 60, expectedMax: 60 },
      ];

      stages.forEach(
        ({ completed, tasks, total, expectedMin, expectedMax }) => {
          const input: BrightnessInput = {
            completedStages: completed,
            tasksDoneInCurrentStage: tasks,
            totalTasksInCurrentStage: total,
          };

          const result = calculateBrightness(input);

          expect(result.worldBrightness).toBeGreaterThanOrEqual(expectedMin);
          expect(result.worldBrightness).toBeLessThanOrEqual(expectedMax);
        },
      );
    });
  });

  describe("Rounding and Precision", () => {
    it("should round values to 2 decimal places", () => {
      const input: BrightnessInput = {
        completedStages: 1,
        tasksDoneInCurrentStage: 1,
        totalTasksInCurrentStage: 3,
      };

      const result = calculateBrightness(input);

      // Check that values have at most 2 decimal places
      const checkPrecision = (value: number) => {
        const str = value.toString();
        if (str.includes(".")) {
          const decimals = str.split(".")[1].length;
          expect(decimals).toBeLessThanOrEqual(2);
        }
      };

      checkPrecision(result.accumulatedBase);
      checkPrecision(result.stageLayer);
      checkPrecision(result.worldBrightness);
    });
  });
});

describe("Brightness Calculator - Phaser Post-FX Mapping", () => {
  describe("brightnessToPhaser() - Linear Interpolation", () => {
    it("should map 0% brightness to dark Phaser values", () => {
      const result = brightnessToPhaser(0);

      expect(result.brightness).toBe(0.15);
      expect(result.contrast).toBe(-0.3);
    });

    it("should map 100% brightness to fully lit Phaser values", () => {
      const result = brightnessToPhaser(100);

      expect(result.brightness).toBe(1.0);
      expect(result.contrast).toBe(0.1);
    });

    it("should map 50% brightness to midpoint values", () => {
      const result = brightnessToPhaser(50);

      // Brightness: 0.15 + 0.5 × 0.85 = 0.575
      expect(result.brightness).toBeCloseTo(0.575, 4);

      // Contrast: -0.3 + 0.5 × 0.4 = -0.1
      expect(result.contrast).toBeCloseTo(-0.1, 4);
    });

    it("should interpolate correctly at 25% brightness", () => {
      const result = brightnessToPhaser(25);

      // Brightness: 0.15 + 0.25 × 0.85 = 0.3625
      expect(result.brightness).toBeCloseTo(0.3625, 4);

      // Contrast: -0.3 + 0.25 × 0.4 = -0.2
      expect(result.contrast).toBeCloseTo(-0.2, 4);
    });

    it("should interpolate correctly at 75% brightness", () => {
      const result = brightnessToPhaser(75);

      // Brightness: 0.15 + 0.75 × 0.85 = 0.7875
      expect(result.brightness).toBeCloseTo(0.7875, 4);

      // Contrast: -0.3 + 0.75 × 0.4 = 0.0
      expect(result.contrast).toBeCloseTo(0.0, 4);
    });

    it("should clamp negative brightness to 0%", () => {
      const result = brightnessToPhaser(-50);

      expect(result.brightness).toBe(0.15);
      expect(result.contrast).toBe(-0.3);
    });

    it("should clamp brightness above 100% to 100%", () => {
      const result = brightnessToPhaser(150);

      expect(result.brightness).toBe(1.0);
      expect(result.contrast).toBe(0.1);
    });

    it("should round Phaser values to 4 decimal places", () => {
      const result = brightnessToPhaser(54.28);

      const checkPrecision = (value: number) => {
        const str = value.toFixed(4);
        expect(parseFloat(str)).toBe(value);
      };

      checkPrecision(result.brightness);
      checkPrecision(result.contrast);
    });
  });

  describe("brightnessToPhaser() - Worked Examples", () => {
    it("should map Stage 1 start (0%) correctly", () => {
      const brightness = 0;
      const result = brightnessToPhaser(brightness);

      expect(result.brightness).toBe(0.15);
      expect(result.contrast).toBe(-0.3);
    });

    it("should map Entering Stage 2 (8.57%) correctly", () => {
      const brightness = 8.57;
      const result = brightnessToPhaser(brightness);

      // 0.15 + 0.0857 × 0.85 ≈ 0.2228
      expect(result.brightness).toBeCloseTo(0.2228, 3);

      // -0.3 + 0.0857 × 0.4 ≈ -0.2657
      expect(result.contrast).toBeCloseTo(-0.2657, 3);
    });

    it("should map Mid-Stage 5 (54.29%) correctly", () => {
      const brightness = 54.29;
      const result = brightnessToPhaser(brightness);

      // 0.15 + 0.5429 × 0.85 ≈ 0.6115
      expect(result.brightness).toBeCloseTo(0.6115, 3);

      // -0.3 + 0.5429 × 0.4 ≈ -0.0828
      expect(result.contrast).toBeCloseTo(-0.0828, 3);
    });

    it("should map Final stage complete (100%) correctly", () => {
      const brightness = 100;
      const result = brightnessToPhaser(brightness);

      expect(result.brightness).toBe(1.0);
      expect(result.contrast).toBe(0.1);
    });
  });
});

describe("Brightness Calculator - Venture Data Integration", () => {
  describe("getBrightnessFromVentureData()", () => {
    const VENTURE_STAGES = [
      { id: 1, checkpoints: 4 },
      { id: 2, checkpoints: 5 },
      { id: 3, checkpoints: 5 },
      { id: 4, checkpoints: 6 },
      { id: 5, checkpoints: 6 },
      { id: 6, checkpoints: 7 },
      { id: 7, checkpoints: 7 },
      { id: 8, checkpoints: 8 },
    ];

    it("should calculate brightness for brand new venture (Stage 1, no progress)", () => {
      const checkpoints = [
        {
          stage: 1,
          status: "active",
          t1Completed: false,
          t2Completed: false,
          t3Completed: false,
        },
      ];

      const result = getBrightnessFromVentureData(
        checkpoints,
        1,
        VENTURE_STAGES,
      );

      expect(result.accumulatedBase).toBe(0);
      expect(result.stageLayer).toBe(0);
      expect(result.worldBrightness).toBe(0);
    });

    it("should calculate brightness when entering Stage 2 (Stage 1 complete)", () => {
      const checkpoints = [
        // Stage 1 - all completed
        {
          stage: 1,
          status: "completed",
          t1Completed: true,
          t2Completed: true,
          t3Completed: true,
        },
        {
          stage: 1,
          status: "completed",
          t1Completed: true,
          t2Completed: true,
          t3Completed: true,
        },
        {
          stage: 1,
          status: "completed",
          t1Completed: true,
          t2Completed: true,
          t3Completed: true,
        },
        {
          stage: 1,
          status: "completed",
          t1Completed: true,
          t2Completed: true,
          t3Completed: true,
        },
        // Stage 2 - just started
        {
          stage: 2,
          status: "active",
          t1Completed: false,
          t2Completed: false,
          t3Completed: false,
        },
      ];

      const result = getBrightnessFromVentureData(
        checkpoints,
        2,
        VENTURE_STAGES,
      );

      expect(result.accumulatedBase).toBeCloseTo(8.57, 1);
      expect(result.stageLayer).toBe(0);
      expect(result.worldBrightness).toBeCloseTo(8.57, 1);
    });

    it("should count tasks completed in current stage", () => {
      const checkpoints = [
        // Current stage with partial progress
        {
          stage: 3,
          status: "in_progress",
          t1Completed: true,
          t2Completed: true,
          t3Completed: false,
        },
        {
          stage: 3,
          status: "in_progress",
          t1Completed: true,
          t2Completed: false,
          t3Completed: false,
        },
        {
          stage: 3,
          status: "active",
          t1Completed: false,
          t2Completed: false,
          t3Completed: false,
        },
      ];

      const result = getBrightnessFromVentureData(
        checkpoints,
        3,
        VENTURE_STAGES,
      );

      // Tasks done: 3 out of (5 checkpoints × 3 = 15 tasks)
      // Stage layer: (3 / 15) × 40 = 8%
      expect(result.stageLayer).toBeCloseTo(8, 1);
    });

    it("should handle gold status checkpoints as completed", () => {
      const checkpoints = [
        {
          stage: 1,
          status: "gold",
          t1Completed: true,
          t2Completed: true,
          t3Completed: true,
        },
        {
          stage: 1,
          status: "gold",
          t1Completed: true,
          t2Completed: true,
          t3Completed: true,
        },
        {
          stage: 1,
          status: "completed",
          t1Completed: true,
          t2Completed: true,
          t3Completed: false,
        },
        {
          stage: 1,
          status: "completed",
          t1Completed: true,
          t2Completed: true,
          t3Completed: false,
        },
      ];

      const result = getBrightnessFromVentureData(
        checkpoints,
        2,
        VENTURE_STAGES,
      );

      // Stage 1 fully complete → 8.57% base
      expect(result.accumulatedBase).toBeCloseTo(8.57, 1);
    });

    it("should handle skipped checkpoints as completed for stage calculation", () => {
      const checkpoints = [
        {
          stage: 1,
          status: "completed",
          t1Completed: true,
          t2Completed: true,
          t3Completed: true,
        },
        {
          stage: 1,
          status: "skipped",
          t1Completed: false,
          t2Completed: false,
          t3Completed: false,
        },
        {
          stage: 1,
          status: "completed",
          t1Completed: true,
          t2Completed: true,
          t3Completed: false,
        },
        {
          stage: 1,
          status: "completed",
          t1Completed: true,
          t2Completed: true,
          t3Completed: false,
        },
      ];

      const result = getBrightnessFromVentureData(
        checkpoints,
        2,
        VENTURE_STAGES,
      );

      // Stage 1 fully complete (skipped counts as complete)
      expect(result.accumulatedBase).toBeCloseTo(8.57, 1);
    });

    it("should correctly calculate mid-stage 5 example", () => {
      // Create checkpoints for fully completed stages 1-4
      const completedCheckpoints = [];
      for (let stage = 1; stage <= 4; stage++) {
        const stageDef = VENTURE_STAGES.find((s) => s.id === stage)!;
        for (let i = 0; i < stageDef.checkpoints; i++) {
          completedCheckpoints.push({
            stage,
            status: "completed",
            t1Completed: true,
            t2Completed: true,
            t3Completed: true,
          });
        }
      }

      // Stage 5 has 6 checkpoints = 18 tasks total
      // 50% tasks = 9 tasks
      const stage5Checkpoints = [
        {
          stage: 5,
          status: "completed",
          t1Completed: true,
          t2Completed: true,
          t3Completed: true,
        }, // 3 tasks
        {
          stage: 5,
          status: "completed",
          t1Completed: true,
          t2Completed: true,
          t3Completed: true,
        }, // 3 tasks
        {
          stage: 5,
          status: "in_progress",
          t1Completed: true,
          t2Completed: true,
          t3Completed: true,
        }, // 3 tasks
        {
          stage: 5,
          status: "active",
          t1Completed: false,
          t2Completed: false,
          t3Completed: false,
        }, // 0 tasks
        {
          stage: 5,
          status: "locked",
          t1Completed: false,
          t2Completed: false,
          t3Completed: false,
        }, // 0 tasks
        {
          stage: 5,
          status: "locked",
          t1Completed: false,
          t2Completed: false,
          t3Completed: false,
        }, // 0 tasks
      ];

      const allCheckpoints = [...completedCheckpoints, ...stage5Checkpoints];

      const result = getBrightnessFromVentureData(
        allCheckpoints,
        5,
        VENTURE_STAGES,
      );

      expect(result.accumulatedBase).toBeCloseTo(34.29, 1);
      expect(result.stageLayer).toBeCloseTo(20.0, 1);
      expect(result.worldBrightness).toBeCloseTo(54.29, 1);
    });

    it("should reach 100% at final stage completion", () => {
      // All stages 1-7 complete
      const completedCheckpoints = [];
      for (let stage = 1; stage <= 7; stage++) {
        const stageDef = VENTURE_STAGES.find((s) => s.id === stage)!;
        for (let i = 0; i < stageDef.checkpoints; i++) {
          completedCheckpoints.push({
            stage,
            status: "completed",
            t1Completed: true,
            t2Completed: true,
            t3Completed: true,
          });
        }
      }

      // Stage 8 all complete
      const stage8Checkpoints = [];
      for (let i = 0; i < 8; i++) {
        stage8Checkpoints.push({
          stage: 8,
          status: "completed",
          t1Completed: true,
          t2Completed: true,
          t3Completed: true,
        });
      }

      const allCheckpoints = [...completedCheckpoints, ...stage8Checkpoints];

      const result = getBrightnessFromVentureData(
        allCheckpoints,
        8,
        VENTURE_STAGES,
      );

      expect(result.accumulatedBase).toBe(60);
      expect(result.stageLayer).toBe(40);
      expect(result.worldBrightness).toBe(100);
    });

    it("should handle missing stage definition gracefully", () => {
      const checkpoints = [
        {
          stage: 99,
          status: "active",
          t1Completed: false,
          t2Completed: false,
          t3Completed: false,
        },
      ];

      const result = getBrightnessFromVentureData(
        checkpoints,
        99,
        VENTURE_STAGES,
      );

      // Should not crash, should use fallback value of 1
      expect(result).toBeDefined();
      expect(result.worldBrightness).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("Brightness Calculator - Edge Cases", () => {
  it("should handle empty venture (no checkpoints)", () => {
    const result = getBrightnessFromVentureData([], 1, []);

    expect(result.worldBrightness).toBe(0);
  });

  it("should handle fractional task completion gracefully", () => {
    const input: BrightnessInput = {
      completedStages: 2,
      tasksDoneInCurrentStage: 7.5, // Fractional (shouldn't happen, but test robustness)
      totalTasksInCurrentStage: 15,
    };

    const result = calculateBrightness(input);

    expect(result.worldBrightness).toBeGreaterThan(0);
    expect(result.worldBrightness).toBeLessThanOrEqual(100);
  });

  it("should maintain precision across multiple calculations", () => {
    const results = [];

    for (let stage = 0; stage <= 7; stage++) {
      for (let tasks = 0; tasks <= 10; tasks++) {
        const input: BrightnessInput = {
          completedStages: stage,
          tasksDoneInCurrentStage: tasks,
          totalTasksInCurrentStage: 10,
        };

        const result = calculateBrightness(input);
        results.push(result);

        // All results should be valid numbers
        expect(result.worldBrightness).not.toBeNaN();
        expect(result.worldBrightness).toBeGreaterThanOrEqual(0);
        expect(result.worldBrightness).toBeLessThanOrEqual(100);
      }
    }

    expect(results).toHaveLength(88); // 8 stages × 11 task values
  });
});
