/**
 * integration/index.ts
 *
 * Phase 17 — Gameplay Integration Layer
 *
 * Central export point for all integration functions.
 * Import this module to wire systems together.
 */

export {
  gameplayIntegration,
  updateBiomeState,
  executeCheckpointFlow,
  applyBiomeParticles,
  initializeAudio,
  updateAudioLayers,
  syncHUDState,
  updateBossVisuals,
  type CheckpointFlowOptions,
} from "./gameplayIntegration";

/**
 * Usage Example:
 *
 * ```typescript
 * import { gameplayIntegration } from "@/lib/phaser/integration";
 *
 * // Update biome when stage changes
 * gameplayIntegration.updateBiomeState(scene, "venture", 2, 30);
 *
 * // Apply particle effects
 * gameplayIntegration.applyBiomeParticles(scene, "academic", 3);
 *
 * // Orchestrate checkpoint completion flow
 * await gameplayIntegration.executeCheckpointFlow(scene, {
 *   checkpointId: "cp-123",
 *   stage: 2,
 *   checkpoint: 3,
 *   isGold: true,
 *   isStageComplete: false,
 *   corruptionLevel: 45,
 * });
 * ```
 */
