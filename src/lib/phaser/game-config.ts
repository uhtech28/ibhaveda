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
  // Detect device type and screen size
  const width = parent.clientWidth || window.innerWidth;
  const height = parent.clientHeight || window.innerHeight;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isSmallMobile = width < 480;

  // Adaptive base dimensions
  let baseWidth: number;
  let baseHeight: number;

  if (isSmallMobile) {
    baseWidth = 640;
    baseHeight = 360;
  } else if (isMobile) {
    baseWidth = 960;
    baseHeight = 540;
  } else if (isTablet) {
    baseWidth = 1280;
    baseHeight = 720;
  } else {
    baseWidth = 1920;
    baseHeight = 1080;
  }

  return {
    type: Phaser.AUTO,
    parent,
    width: baseWidth,
    height: baseHeight,
    backgroundColor: "#0A0D12",
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: baseWidth,
      height: baseHeight,
      min: {
        width: 320,
        height: 180,
      },
      max: {
        width: 3840,
        height: 2160,
      },
      resizeInterval: 100,
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
      forceSetTimeOut: isMobile, // Better performance on mobile
    },
    audio: {
      disableWebAudio: false,
    },
  };
}
