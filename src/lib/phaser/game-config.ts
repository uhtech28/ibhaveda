/**
 * Phaser Game Configuration Factory
 *
 * Creates the core Phaser game configuration for the Interactive Ideas world map.
 * Optimized for pixel art rendering with proper scaling and physics.
 *
 * @module lib/phaser/game-config
 */

import * as Phaser from "phaser";
import { WorldMapScene } from "./scenes/WorldMapScene";

/**
 * Creates a Phaser game configuration object
 *
 * @param parent - The HTML element that will contain the Phaser canvas
 * @returns Configured Phaser game configuration object
 *
 * @example
 * ```typescript
 * const container = document.getElementById('game-container')
 * const config = createGameConfig(container)
 * const game = new Phaser.Game(config)
 * ```
 */
export function createGameConfig(
  parent: HTMLElement,
): Phaser.Types.Core.GameConfig {
  const isCompactViewport = parent.clientWidth < 768;
  const baseWidth = isCompactViewport ? 960 : 1280;
  const baseHeight = isCompactViewport ? 540 : 720;

  return {
    type: Phaser.AUTO,
    parent,
    width: baseWidth,
    height: baseHeight,
    backgroundColor: "#0A0D12",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: baseWidth,
      height: baseHeight,
      resizeInterval: 200,
    },
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
        gravity: { x: 0, y: 0 },
      },
    },
    scene: [WorldMapScene],
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true,
      powerPreference: "high-performance",
    },
    fps: {
      target: 60,
    },
  };
}
