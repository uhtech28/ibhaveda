export { BaseCheckpointAnimation, type AnimationConfig, type AnimationVariant } from "./BaseCheckpointAnimation";
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
  config: AnimationConfig
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

export function getAnimationTypeForStage(stage: number): CheckpointAnimationType {
  const stageToAnimation: Record<number, CheckpointAnimationType> = {
    1: "seal_break",
    2: "rune_inscription",
    3: "beacon_lighting",
    4: "bridge_repair",
    5: "compass_calibration",
    6: "ward_placement",
    7: "beacon_lighting",
    8: "seal_break",
  };
  return stageToAnimation[stage] || "seal_break";
}