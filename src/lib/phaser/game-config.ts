/**
 * Phaser Game Configuration Factory
 *
 * Creates the core Phaser game configuration for the Ibhaveda world map.
 * Optimized for pixel art rendering with proper scaling and physics.
 *
 * @module lib/phaser/game-config
 */

import * as Phaser from "phaser";
// NOTE: WorldMapScene is intentionally NOT statically imported here. The
// scene module is ~9k lines and was being parse+compiled on every
// /map/world hydration as part of the phaser-boot chunk. Callers should
// dynamic-import it themselves and pass the resolved class into
// createGameConfig(). See createGameConfigWithScene() below for the
// async helper that keeps the scene off the initial Phaser bundle.
import type { WorldMapScene as WorldMapSceneType } from "./scenes/WorldMapScene";

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
  SceneClass?: typeof WorldMapSceneType,
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
    scene: SceneClass ? [SceneClass] : [],
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true,
      // "default" instead of "high-performance" — the latter forces the
      // discrete/integrated GPU choice and on many machines (especially
      // laptops) pegs CPU/GPU usage even when nothing is moving on
      // screen. "default" lets the browser pick lazily.
      powerPreference: "default",
      batchSize: 4096,
    },
    fps: {
      // Back to 60fps — 30fps was making pan/scroll feel choppy even on
      // good devices. Real per-frame cost is already aggressively
      // trimmed (frustum culling, idle-tween skip, parallax batch tick).
      target: 60,
      smoothStep: true,
      panicMax: 120,
      forceSetTimeOut: false,
    },
    // Pause game loop while the tab is hidden — by default Phaser keeps
    // ticking even when minimised. With multiple tabs open this is
    // significant background CPU.
    autoFocus: true,
    disableContextMenu: true,
    audio: {
      // The world map has no audio cues — all UX sounds run through
      // audioManager (HTMLAudio). Disabling Phaser's WebAudio path
      // avoids "Cannot suspend a closed AudioContext" errors when the
      // game pauses/resumes during dialog overlays (CombatPanel,
      // CheckpointPanel, mini-game spawns).
      noAudio: true,
    },
  };
}
