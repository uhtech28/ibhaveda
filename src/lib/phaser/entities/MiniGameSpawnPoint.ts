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
  private sprite?: Phaser.GameObjects.Arc | Phaser.GameObjects.Text;
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
    // Render the mini-game marker as a small 🚩 flag emoji so it reads
    // as a "capture-the-flag" side objective on the world map — visually
    // distinct from checkpoint markers and the player character. Emoji
    // is a Text object so it's crisp at any zoom and needs no asset
    // preload. Small (18px) so it reads as an easter-egg not a CTA.
    this.sprite = this.scene.add
      .text(this.config.x, this.config.y, "🚩", {
        fontFamily: "'Segoe UI Emoji', 'Apple Color Emoji', system-ui, sans-serif",
        fontSize: "18px",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(900)
      // Explicit larger hit area — Text object's default bounds are just
      // the glyph, which makes emoji hard to click. 32×32 rect centered
      // on the emoji ensures a comfortable click target.
      .setInteractive(
        new Phaser.Geom.Rectangle(-8, -8, 32, 32),
        Phaser.Geom.Rectangle.Contains,
      );
    (this.sprite as Phaser.GameObjects.Text).input!.cursor = "pointer";

    // Hover-only "?" that shows when player is within interaction range.
    this.label = this.scene.add
      .text(this.config.x, this.config.y - 18, "?", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(901)
      .setAlpha(0);

    // Use "pointerup" with movement threshold so taps activate but drags
    // don't. We deliberately do NOT stopPropagation — the scene's global
    // pointerup handler must still fire to reset its `dragging` flag,
    // otherwise the camera stays in "held-drag" state after the tap and
    // subsequent mouse moves scroll the map without any button press.
    this.sprite.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      const moved = Phaser.Math.Distance.Between(
        pointer.downX,
        pointer.downY,
        pointer.upX,
        pointer.upY,
      );
      if (moved < 8) {
        this.activate();
      }
    });
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
