/**
 * StageEnvironmentBlur.ts
 *
 * Gaussian blur on trees / canopy props. Strength follows corruption;
 * clears around completed checkpoints (CP healing).
 */

import * as Phaser from "phaser";
import type { CheckpointState } from "@/lib/phaser/utils/event-bridge";

export interface CheckpointWorldPosition {
  stage: number;
  checkpoint: number;
  x: number;
  y: number;
  status: CheckpointState["status"];
}

/** Phaser blur strength (0 = off, ~4 = heavy at 100% corruption). */
export function getBaseTreeBlurStrength(corruptionLevel: number): number {
  const t = Math.max(0, Math.min(1, corruptionLevel / 100));
  const s = t * t * (3 - 2 * t);
  return s * 4.2;
}

/**
 * Per-tree blur: stage corruption minus relief bubbles on cleared CPs.
 */
export function getTreeBlurStrength(
  corruptionLevel: number,
  treeX: number,
  treeY: number,
  checkpoints: CheckpointWorldPosition[],
): number {
  const base = getBaseTreeBlurStrength(corruptionLevel);
  if (base < 0.08 || checkpoints.length === 0) return base;

  let relief = 0;
  for (const cp of checkpoints) {
    const dist = Math.hypot(treeX - cp.x, treeY - cp.y);
    const radius = 420;
    const falloff = Math.max(0, 1 - dist / radius);

    if (cp.status === "gold" || cp.status === "completed") {
      relief = Math.max(relief, falloff * 0.92);
    } else if (cp.status === "in_progress" || cp.status === "partial") {
      relief = Math.max(relief, falloff * 0.45);
    } else if (cp.status === "active") {
      relief = Math.max(relief, falloff * 0.2);
    }
  }

  return Math.max(0, base * (1 - relief));
}

type BlurFx = Phaser.FX.Blur;

export class StageEnvironmentBlur {
  private readonly targets = new Map<
    number,
    Set<Phaser.GameObjects.GameObject>
  >();
  private readonly blurByObject = new WeakMap<
    Phaser.GameObjects.GameObject,
    BlurFx
  >();

  register(stageId: number, gameObject: Phaser.GameObjects.GameObject): void {
    if (!this.targets.has(stageId)) {
      this.targets.set(stageId, new Set());
    }
    this.targets.get(stageId)!.add(gameObject);
  }

  destroy(): void {
    for (const set of this.targets.values()) {
      for (const obj of set) {
        this.clearBlur(obj);
      }
    }
    this.targets.clear();
  }

  updateStage(
    stageId: number,
    corruptionLevel: number,
    checkpoints: CheckpointWorldPosition[],
  ): void {
    const set = this.targets.get(stageId);
    if (!set || set.size === 0) return;

    const stageCps = checkpoints.filter((cp) => cp.stage === stageId);

    for (const obj of set) {
      if (!obj.active) continue;

      const strength = getTreeBlurStrength(
        corruptionLevel,
        obj.x,
        obj.y,
        stageCps,
      );
      this.applyBlur(obj, strength);
    }
  }

  private applyBlur(
    gameObject: Phaser.GameObjects.GameObject,
    strength: number,
  ): void {
    if (strength < 0.12) {
      this.clearBlur(gameObject);
      return;
    }

    const postFx = (
      gameObject as Phaser.GameObjects.GameObject & {
        postFX?: Phaser.GameObjects.Components.PostPipeline &
          Phaser.GameObjects.Components.FX;
      }
    ).postFX;

    if (!postFx?.addBlur) return;

    let fx = this.blurByObject.get(gameObject);
    if (!fx) {
      fx = postFx.addBlur(0, 2, 2, 1, 0x1a0a24, 4) as BlurFx;
      this.blurByObject.set(gameObject, fx);
    }

    const amount = Math.min(6, strength);
    fx.strength = amount;
    fx.x = amount * 1.1;
    fx.y = amount * 1.1;
    fx.steps = strength > 2.5 ? 4 : 2;
  }

  private clearBlur(gameObject: Phaser.GameObjects.GameObject): void {
    const fx = this.blurByObject.get(gameObject);
    if (!fx) return;

    const postFx = (
      gameObject as Phaser.GameObjects.GameObject & {
        postFX?: { remove?: (fx: BlurFx) => void };
      }
    ).postFX;

    postFx?.remove?.(fx);
    this.blurByObject.delete(gameObject);
  }
}
