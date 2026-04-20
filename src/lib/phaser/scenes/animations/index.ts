export {
  BaseCheckpointAnimation,
  type AnimationConfig,
  type AnimationVariant,
} from "./BaseCheckpointAnimation";
export { SealBreakAnimation } from "./SealBreakAnimation";
export { RuneInscriptionAnimation } from "./RuneInscriptionAnimation";
export { BeaconLightingAnimation } from "./BeaconLightingAnimation";
export { BridgeRepairAnimation } from "./BridgeRepairAnimation";
export { CompassCalibrationAnimation } from "./CompassCalibrationAnimation";
export { WardPlacementAnimation } from "./WardPlacementAnimation";

import { SealBreakAnimation } from "./SealBreakAnimation";
import { RuneInscriptionAnimation } from "./RuneInscriptionAnimation";
import { BeaconLightingAnimation } from "./BeaconLightingAnimation";
import { BridgeRepairAnimation } from "./BridgeRepairAnimation";
import { CompassCalibrationAnimation } from "./CompassCalibrationAnimation";
import { WardPlacementAnimation } from "./WardPlacementAnimation";
import type { AnimationConfig } from "./BaseCheckpointAnimation";
import * as Phaser from "phaser";

export type CheckpointAnimationType =
  | "seal_break"
  | "rune_inscription"
  | "beacon_lighting"
  | "bridge_repair"
  | "compass_calibration"
  | "ward_placement";

export function createCheckpointAnimation(
  scene: Phaser.Scene,
  type: CheckpointAnimationType,
  config: AnimationConfig,
) {
  switch (type) {
    case "seal_break":
      return new SealBreakAnimation(scene, config);
    case "rune_inscription":
      return new RuneInscriptionAnimation(scene, config);
    case "beacon_lighting":
      return new BeaconLightingAnimation(scene, config);
    case "bridge_repair":
      return new BridgeRepairAnimation(scene, config);
    case "compass_calibration":
      return new CompassCalibrationAnimation(scene, config);
    case "ward_placement":
      return new WardPlacementAnimation(scene, config);
    default:
      console.warn(`Unknown animation type: ${type}, defaulting to seal_break`);
      return new SealBreakAnimation(scene, config);
  }
}

export function getAnimationTypeForStage(
  stage: number,
): CheckpointAnimationType {
  // 2-Stage MVP System
  const stageToAnimation: Record<number, CheckpointAnimationType> = {
    1: "compass_calibration", // Stage 1: Ideation - Compass snaps to new heading
    2: "beacon_lighting", // Stage 2: Research - Watchtower beacon ignites
  };
  return stageToAnimation[stage] || "compass_calibration";
}
