"use client";

/**
 * Standalone Phaser game instance that hosts a single mini-game
 * scene. The world map's main Phaser instance keeps running
 * underneath; this overlay instance mounts above it inside a modal
 * canvas so the mini-game is visually isolated.
 *
 * `launchMiniGame` returns a Promise that resolves with the scene
 * result (or null if the user abandoned). The caller is responsible
 * for destroying the Phaser instance via the returned disposer.
 */

import * as Phaser from "phaser";
import { PatternMatchScene, PATTERN_MATCH_SCENE_KEY } from "@/lib/phaser/scenes/minigames/PatternMatchScene";
import { ReflexTapScene, REFLEX_TAP_SCENE_KEY } from "@/lib/phaser/scenes/minigames/ReflexTapScene";
import { DecryptScene, DECRYPT_SCENE_KEY } from "@/lib/phaser/scenes/minigames/DecryptScene";
import type { MiniGameArchetype } from "@convex/miniGameConstants";
import type { MiniGameSceneResult } from "@convex/miniGameTypes";

const SCENE_KEY: Record<MiniGameArchetype, string> = {
  pattern_match: PATTERN_MATCH_SCENE_KEY,
  reflex_tap: REFLEX_TAP_SCENE_KEY,
  decrypt: DECRYPT_SCENE_KEY,
};

export interface LaunchOptions {
  parent: HTMLElement;
  archetype: MiniGameArchetype;
  difficulty: 1 | 2 | 3 | 4 | 5;
  width: number;
  height: number;
}

export interface LaunchHandle {
  /** Resolves with a result, or null if the user abandoned. */
  done: Promise<MiniGameSceneResult | null>;
  /** Stops the Phaser instance and frees the canvas. Idempotent. */
  dispose: () => void;
}

export function launchMiniGame(opts: LaunchOptions): LaunchHandle {
  let resolveDone: (
    value: MiniGameSceneResult | null,
  ) => void = () => undefined;
  const done = new Promise<MiniGameSceneResult | null>((resolve) => {
    resolveDone = resolve;
  });

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: opts.parent,
    width: opts.width,
    height: opts.height,
    backgroundColor: "#0E0C17",
    scene: [PatternMatchScene, ReflexTapScene, DecryptScene],
    scale: {
      // The host React div has explicit width/height matching the
      // requested canvas size, so the canvas renders 1:1 with no CSS
      // scaling. This keeps pointer-event coordinates aligned with
      // Phaser's world coords (Scale.FIT can introduce subtle CSS
      // transforms that desync taps from hit areas).
      mode: Phaser.Scale.NONE,
    },
    // The mini-games don't play sound and React StrictMode in dev
    // can mount/unmount the overlay twice in quick succession, which
    // makes Phaser's sound manager try to suspend a closed AudioContext
    // ("Cannot suspend a closed AudioContext"). Skipping the WebAudio
    // bring-up entirely sidesteps the problem.
    audio: { noAudio: true },
  });

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    try {
      game.destroy(true);
    } catch (err) {
      // Defensive — Phaser sometimes throws during double-dispose.
      // Logging is enough; the canvas is already detached from the DOM.
      // eslint-disable-next-line no-console
      console.warn("[minigames] dispose error (non-fatal):", err);
    }
  };

  // Wait for the game's first paint before starting the chosen scene
  // — scenes added to `Phaser.Game.scene` aren't auto-started.
  game.events.once("ready", () => {
    game.scene.start(SCENE_KEY[opts.archetype], {
      difficulty: opts.difficulty,
      onResult: (result: MiniGameSceneResult) => {
        resolveDone(result);
      },
      onAbandon: () => {
        resolveDone(null);
      },
    });
  });

  return { done, dispose };
}
