/**
 * MiniGameSpawnPoint — a tappable entity placed on the world map.
 *
 * Rendered as a small pulsing circle in the spawn's archetype colour.
 * When the player walks within `INTERACT_RADIUS_PX` and presses E (or
 * taps the spawn), the world-map scene emits `minigame:spawn_entered`
 * via the event-bridge so the React layer can show the prompt dialog.
 *
 * The spawn hides itself when its id appears in the user's
 * `completedSpawnIds` set (queried at world-map mount and refreshed
 * after each completion).
 */

import * as Phaser from "phaser";
import type { MiniGameSpawnConfig } from "@convex/miniGameConstants";

const INTERACT_RADIUS_PX = 80;

const ARCHETYPE_COLOR: Record<string, number> = {
  pattern_match: 0x9f7aea,
  reflex_tap: 0x4ade80,
  decrypt: 0xfacc15,
};

export interface MiniGameSpawnPointOptions {
  config: MiniGameSpawnConfig;
  scene: Phaser.Scene;
  /** Fires when the player enters the interaction radius AND presses E. */
  onActivate: (config: MiniGameSpawnConfig) => void;
}

export class MiniGameSpawnPoint {
  readonly config: MiniGameSpawnConfig;
  private scene: Phaser.Scene;
  private sprite?: Phaser.GameObjects.Arc;
  private label?: Phaser.GameObjects.Text;
  private onActivate: (config: MiniGameSpawnConfig) => void;
  private isVisible = true;
  private playerInRange = false;

  constructor(opts: MiniGameSpawnPointOptions) {
    this.config = opts.config;
    this.scene = opts.scene;
    this.onActivate = opts.onActivate;
    this.mount();
  }

  // ─────────────────────────────────────────────────────────────────
  // Mount + render
  // ─────────────────────────────────────────────────────────────────

  private mount(): void {
    const color = ARCHETYPE_COLOR[this.config.archetype] ?? 0xffffff;
    this.sprite = this.scene.add
      .circle(this.config.x, this.config.y, 18, color, 0.92)
      .setStrokeStyle(3, 0xffffff, 1)
      // Push above tilemap layers, biome overlays, and atmospheric
      // effects so the dot is reliably visible. Below the persona's
      // depth so the player sprite still walks over it correctly.
      .setDepth(900)
      .setInteractive({ useHandCursor: true });
    this.label = this.scene.add
      .text(this.config.x, this.config.y - 34, "?", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(901)
      .setAlpha(0);

    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1.3,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: "Sine.easeInOut",
    });

    // Outer halo so the spawn is visible from across the map.
    const halo = this.scene.add
      .circle(this.config.x, this.config.y, 28, color, 0)
      .setStrokeStyle(2, color, 0.6)
      .setDepth(899);
    this.scene.tweens.add({
      targets: halo,
      scale: 1.8,
      alpha: 0,
      duration: 1400,
      repeat: -1,
      ease: "Sine.easeOut",
    });

    this.sprite.on("pointerdown", () => this.activate());
  }

  /** Call from the scene's update loop with the current player position. */
  update(playerX: number, playerY: number): void {
    if (!this.isVisible || !this.sprite || !this.label) return;
    const dx = this.config.x - playerX;
    const dy = this.config.y - playerY;
    const inRange = dx * dx + dy * dy <= INTERACT_RADIUS_PX * INTERACT_RADIUS_PX;
    if (inRange !== this.playerInRange) {
      this.playerInRange = inRange;
      this.scene.tweens.add({
        targets: this.label,
        alpha: inRange ? 1 : 0,
        duration: 180,
      });
    }
  }

  /** Returns true if the player is currently in interaction range. */
  isPlayerInRange(): boolean {
    return this.playerInRange;
  }

  /** Trigger the prompt — called by tap or by keyboard E while in range. */
  activate(): void {
    if (!this.isVisible) return;
    if (!this.playerInRange) {
      // Tapping from afar still works (mobile UX); range-check is
      // advisory, not a hard gate.
    }
    this.onActivate(this.config);
  }

  /** Hide and detach the spawn — call once the user has cleared it. */
  hide(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.sprite?.disableInteractive();
    this.scene.tweens.add({
      targets: [this.sprite, this.label],
      alpha: 0,
      duration: 280,
      onComplete: () => {
        this.sprite?.destroy();
        this.label?.destroy();
      },
    });
  }
}
