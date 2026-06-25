/**
 * TimeOfDayCycle
 *
 * Applies a subtle camera-anchored tint to the world map based on the
 * user's real-world clock. The painted biome backgrounds are
 * uniformly bathed in a colour that shifts from cool dawn → bright
 * noon → warm dusk → deep night.
 *
 * Effect is intentionally subtle (lower opacity overlay) so the
 * painted art still reads cleanly. The point is atmospheric
 * variation across the day, not full day/night-cycle simulation.
 *
 * Five bands:
 *   dawn       05:00 – 08:00   warm coral overlay, soft
 *   morning    08:00 – 12:00   no overlay (the baseline)
 *   afternoon  12:00 – 17:00   slight gold overlay
 *   dusk       17:00 – 20:00   warm orange-red overlay
 *   night      20:00 – 05:00   deep blue overlay, more pronounced
 *
 * Updates every 5 minutes via a scene timer. Transitions between
 * bands tween over 30s so the user sees the world breathing if they
 * happen to be playing at the boundary.
 *
 * Disabled in lite mode (advanced ventures) so we don't add per-frame
 * compositor work on already-stressed maps.
 */

import * as Phaser from "phaser";
import { isLiteMode } from "../performance-mode";

type Band = "dawn" | "morning" | "afternoon" | "dusk" | "night";

interface BandConfig {
  /** Hex color of the tint overlay. */
  color: number;
  /** Overlay alpha — 0 means no overlay (e.g. morning). */
  alpha: number;
}

const BAND_CONFIG: Record<Band, BandConfig> = {
  dawn:      { color: 0xff9a76, alpha: 0.10 }, // warm coral
  morning:   { color: 0xffffff, alpha: 0.00 }, // neutral baseline
  afternoon: { color: 0xfde68a, alpha: 0.06 }, // gold sheen
  dusk:      { color: 0xfb7185, alpha: 0.14 }, // warm orange-red
  night:     { color: 0x4338ca, alpha: 0.20 }, // deep indigo blue
};

function bandForHour(hour: number): Band {
  if (hour < 5) return "night";
  if (hour < 8) return "dawn";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 20) return "dusk";
  return "night";
}

export class TimeOfDayCycle {
  private scene: Phaser.Scene;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private currentBand: Band | null = null;
  private updateTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Initialise the cycle. Creates the overlay rectangle anchored to
   * the camera, picks the right band for the current local clock,
   * and starts a 5-minute refresh timer that handles band crossings.
   *
   * Lite-mode ventures skip the cycle entirely — the camera FX cost
   * is small but every per-frame compositor draw counts on those.
   */
  start(): void {
    if (isLiteMode()) return;
    const camera = this.scene.cameras.main;
    this.overlay = this.scene.add.rectangle(
      camera.width / 2,
      camera.height / 2,
      camera.width,
      camera.height,
      0xffffff,
      0,
    );
    this.overlay.setScrollFactor(0);
    // Draw above world but below cinematics + HUD overlays
    this.overlay.setDepth(1880);

    this.applyBandForNow(false);

    // Refresh every 5 minutes — band changes happen on hour
    // boundaries so we don't need a tight cadence
    this.updateTimer = this.scene.time.addEvent({
      delay: 5 * 60 * 1000,
      loop: true,
      callback: () => this.applyBandForNow(true),
    });

    // Handle window resize so the overlay always fills the viewport
    this.scene.scale.on("resize", this.onResize, this);
  }

  /** Manually trigger a band refresh — useful in tests / debug. */
  refresh(): void {
    this.applyBandForNow(true);
  }

  destroy(): void {
    if (this.updateTimer) {
      this.updateTimer.destroy();
      this.updateTimer = null;
    }
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
    this.scene.scale.off("resize", this.onResize, this);
    this.currentBand = null;
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private applyBandForNow(animated: boolean): void {
    if (!this.overlay) return;
    const hour = new Date().getHours();
    const band = bandForHour(hour);
    if (band === this.currentBand) return;
    this.currentBand = band;
    const config = BAND_CONFIG[band];

    // Apply colour immediately (Phaser Rectangle.setFillStyle does not
    // play well with tweening colour values, so the colour swap is
    // instant but the alpha tween across 30s sells the transition).
    this.overlay.setFillStyle(config.color, this.overlay.fillAlpha);
    if (animated) {
      this.scene.tweens.add({
        targets: this.overlay,
        fillAlpha: config.alpha,
        duration: 30_000,
        ease: "Sine.easeInOut",
      });
    } else {
      // Initial mount — snap straight to target alpha so the user
      // doesn't see a 30s "dawn" transition when opening a map at noon.
      this.overlay.setFillStyle(config.color, config.alpha);
    }
  }

  private onResize = (): void => {
    if (!this.overlay) return;
    const camera = this.scene.cameras.main;
    this.overlay.setPosition(camera.width / 2, camera.height / 2);
    this.overlay.setSize(camera.width, camera.height);
  };
}
