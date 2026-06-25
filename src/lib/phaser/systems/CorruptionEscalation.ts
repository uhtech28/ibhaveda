/**
 * CorruptionEscalation
 *
 * PRD § 6.2 — Corruption Visual Thresholds. Applies camera-anchored
 * full-screen effects as the venture corruption % climbs through 5
 * distinct visual bands:
 *
 *   0-25%   Baseline. Faint purple tinting on horizon.
 *           Boss silhouette barely visible. (handled by Boss.ts)
 *   25-50%  Corruption overlay creeps from map edges. Ahead
 *           checkpoints slightly dimmed.
 *   50-75%  World desaturates noticeably. Boss begins slow
 *           movement. Purple vignette on HUD border.
 *   75-90%  Map heavily corrupted. Boss fully visible. Active
 *           checkpoint shakes. HUD border pulses.
 *   90-100% Full corruption. Boss enters foreground. Screen edge
 *           cracks. Flash warning every 30s.
 *
 * Complements the existing CorruptionRenderer (which paints per-stage
 * overlays + particles inside the world). This class owns the
 * camera-relative, full-screen effects that don't belong to any
 * specific stage.
 *
 * Updates are idempotent — calling setLevel() with the same level
 * does nothing. Cleanup is automatic on destroy().
 */

import * as Phaser from "phaser";

export type CorruptionBand = "calm" | "creeping" | "desaturated" | "heavy" | "critical";

export function bandForLevel(level: number): CorruptionBand {
  const lvl = Math.max(0, Math.min(100, level));
  if (lvl < 25) return "calm";
  if (lvl < 50) return "creeping";
  if (lvl < 75) return "desaturated";
  if (lvl < 90) return "heavy";
  return "critical";
}

export class CorruptionEscalation {
  private scene: Phaser.Scene;
  private currentBand: CorruptionBand = "calm";

  // ── Visual layers (fixed to camera, drawn once and tweened) ───────────────
  private edgeOverlay: Phaser.GameObjects.Graphics | null = null;
  private vignette: Phaser.GameObjects.Graphics | null = null;
  private screenCracks: Phaser.GameObjects.Graphics | null = null;
  private vignetteTween: Phaser.Tweens.Tween | null = null;
  private flashWarningTimer: Phaser.Time.TimerEvent | null = null;
  private desaturationFx: Phaser.FX.ColorMatrix | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Set the current corruption level (0-100). Resolves which band it
   * belongs to and applies/removes the appropriate effects. Idempotent
   * — same band call is a no-op.
   */
  setLevel(level: number): void {
    const band = bandForLevel(level);
    if (band === this.currentBand) return;
    const prev = this.currentBand;
    this.currentBand = band;
    this.onBandChange(prev, band);
  }

  /** Tear down all effects and timers. Call on scene shutdown. */
  destroy(): void {
    this.removeEdgeOverlay();
    this.removeVignette();
    this.removeScreenCracks();
    this.removeFlashWarning();
    this.removeDesaturation();
  }

  // ── Band transitions ─────────────────────────────────────────────────────

  private onBandChange(prev: CorruptionBand, next: CorruptionBand): void {
    // Apply effects required by the new band; remove those not needed.
    const wantEdge = next !== "calm";
    const wantVignette = next === "desaturated" || next === "heavy" || next === "critical";
    const wantDesat = next === "desaturated" || next === "heavy" || next === "critical";
    const wantCracks = next === "critical";
    const wantFlash = next === "critical";

    if (wantEdge && !this.edgeOverlay) this.addEdgeOverlay(next);
    else if (wantEdge && this.edgeOverlay) this.updateEdgeOverlay(next);
    else if (!wantEdge && this.edgeOverlay) this.removeEdgeOverlay();

    if (wantVignette && !this.vignette) this.addVignette(next);
    else if (wantVignette) this.updateVignette(next);
    else if (!wantVignette) this.removeVignette();

    if (wantDesat && !this.desaturationFx) this.addDesaturation(next);
    else if (wantDesat) this.updateDesaturation(next);
    else if (!wantDesat) this.removeDesaturation();

    if (wantCracks && !this.screenCracks) this.addScreenCracks();
    else if (!wantCracks) this.removeScreenCracks();

    if (wantFlash && !this.flashWarningTimer) this.addFlashWarning();
    else if (!wantFlash) this.removeFlashWarning();
  }

  // ── Edge overlay (purple creep from screen edges) ─────────────────────────

  private addEdgeOverlay(band: CorruptionBand): void {
    const camera = this.scene.cameras.main;
    const w = camera.width;
    const h = camera.height;
    this.edgeOverlay = this.scene.add.graphics();
    this.edgeOverlay.setScrollFactor(0);
    this.edgeOverlay.setDepth(1900);
    this.drawEdgeOverlay(band, w, h);
    this.edgeOverlay.setAlpha(0);
    this.scene.tweens.add({
      targets: this.edgeOverlay,
      alpha: 1,
      duration: 700,
      ease: "Sine.easeIn",
    });
  }

  private updateEdgeOverlay(band: CorruptionBand): void {
    if (!this.edgeOverlay) return;
    const camera = this.scene.cameras.main;
    this.edgeOverlay.clear();
    this.drawEdgeOverlay(band, camera.width, camera.height);
  }

  private drawEdgeOverlay(band: CorruptionBand, w: number, h: number): void {
    if (!this.edgeOverlay) return;
    // Thicker + darker as band escalates
    const thickness =
      band === "creeping" ? 60 :
      band === "desaturated" ? 90 :
      band === "heavy" ? 130 :
      170;
    const color = 0x4a1d6b; // purple
    const alpha =
      band === "creeping" ? 0.18 :
      band === "desaturated" ? 0.28 :
      band === "heavy" ? 0.38 :
      0.48;
    // Top + bottom + left + right gradient bands using stacked
    // semi-transparent rectangles (simulates a vignette feathering)
    for (let i = 0; i < 4; i++) {
      const layerAlpha = alpha * (1 - i * 0.22);
      const t = thickness - i * (thickness / 5);
      this.edgeOverlay.fillStyle(color, layerAlpha);
      this.edgeOverlay.fillRect(0, 0, w, t); // top
      this.edgeOverlay.fillRect(0, h - t, w, t); // bottom
      this.edgeOverlay.fillRect(0, 0, t, h); // left
      this.edgeOverlay.fillRect(w - t, 0, t, h); // right
    }
  }

  private removeEdgeOverlay(): void {
    if (!this.edgeOverlay) return;
    const overlay = this.edgeOverlay;
    this.edgeOverlay = null;
    this.scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 500,
      ease: "Sine.easeOut",
      onComplete: () => overlay.destroy(),
    });
  }

  // ── Vignette (purple ring around the viewport — desaturated band+) ────────

  private addVignette(band: CorruptionBand): void {
    const camera = this.scene.cameras.main;
    this.vignette = this.scene.add.graphics();
    this.vignette.setScrollFactor(0);
    this.vignette.setDepth(1920);
    this.drawVignette(band, camera.width, camera.height);
    this.vignette.setAlpha(0);
    this.scene.tweens.add({
      targets: this.vignette,
      alpha: 1,
      duration: 700,
      ease: "Sine.easeIn",
    });
    // Heavy + critical bands pulse the vignette
    if (band === "heavy" || band === "critical") {
      this.vignetteTween = this.scene.tweens.add({
        targets: this.vignette,
        alpha: 0.5,
        duration: band === "critical" ? 700 : 1200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  private updateVignette(band: CorruptionBand): void {
    if (!this.vignette) return;
    const camera = this.scene.cameras.main;
    this.vignette.clear();
    this.drawVignette(band, camera.width, camera.height);
    // Restart pulse if band escalated into heavy/critical
    if (this.vignetteTween) {
      this.vignetteTween.stop();
      this.vignetteTween = null;
    }
    if (band === "heavy" || band === "critical") {
      this.vignetteTween = this.scene.tweens.add({
        targets: this.vignette,
        alpha: 0.5,
        duration: band === "critical" ? 700 : 1200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  private drawVignette(band: CorruptionBand, w: number, h: number): void {
    if (!this.vignette) return;
    // Concentric purple gradient rings darkening toward the edges
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.max(w, h) * 0.7;
    const startR = Math.max(w, h) * 0.45;
    const stops = 5;
    for (let i = 0; i < stops; i++) {
      const r = startR + (maxR - startR) * (i / stops);
      const a = (band === "desaturated" ? 0.06 : band === "heavy" ? 0.09 : 0.14) * (i + 1) / stops;
      this.vignette.fillStyle(0x3b0a52, a);
      this.vignette.fillCircle(cx, cy, r);
    }
  }

  private removeVignette(): void {
    if (this.vignetteTween) {
      this.vignetteTween.stop();
      this.vignetteTween = null;
    }
    if (!this.vignette) return;
    const v = this.vignette;
    this.vignette = null;
    this.scene.tweens.add({
      targets: v,
      alpha: 0,
      duration: 500,
      ease: "Sine.easeOut",
      onComplete: () => v.destroy(),
    });
  }

  // ── World desaturation (Phaser ColorMatrix FX on the camera) ──────────────

  private addDesaturation(band: CorruptionBand): void {
    const camera = this.scene.cameras.main;
    try {
      this.desaturationFx = camera.postFX.addColorMatrix();
      this.applyDesaturationStrength(band);
    } catch {
      // Some platforms don't support postFX; degrade silently.
      this.desaturationFx = null;
    }
  }

  private updateDesaturation(band: CorruptionBand): void {
    if (!this.desaturationFx) return;
    this.applyDesaturationStrength(band);
  }

  private applyDesaturationStrength(band: CorruptionBand): void {
    if (!this.desaturationFx) return;
    // saturate(value): 0 = grayscale, 1 = identity
    const value =
      band === "desaturated" ? 0.75 :
      band === "heavy" ? 0.55 :
      band === "critical" ? 0.4 :
      1.0;
    try {
      this.desaturationFx.saturate(value, false);
    } catch {
      // Older Phaser versions throw — ignore.
    }
  }

  private removeDesaturation(): void {
    if (!this.desaturationFx) return;
    try {
      this.scene.cameras.main.postFX.remove(this.desaturationFx);
    } catch {
      // ignore
    }
    this.desaturationFx = null;
  }

  // ── Screen edge cracks (critical band only) ───────────────────────────────

  private addScreenCracks(): void {
    const camera = this.scene.cameras.main;
    const w = camera.width;
    const h = camera.height;
    this.screenCracks = this.scene.add.graphics();
    this.screenCracks.setScrollFactor(0);
    this.screenCracks.setDepth(1950);
    this.screenCracks.lineStyle(2, 0xff4444, 0.7);

    // 4 jagged crack lines emanating from each corner
    const drawCrack = (sx: number, sy: number, ex: number, ey: number) => {
      const segments = 6;
      let x = sx;
      let y = sy;
      this.screenCracks!.beginPath();
      this.screenCracks!.moveTo(x, y);
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const nx = sx + (ex - sx) * t + (Math.random() - 0.5) * 14;
        const ny = sy + (ey - sy) * t + (Math.random() - 0.5) * 14;
        this.screenCracks!.lineTo(nx, ny);
        x = nx;
        y = ny;
      }
      this.screenCracks!.strokePath();
    };
    drawCrack(0, 0, w * 0.18, h * 0.22);
    drawCrack(w, 0, w * 0.82, h * 0.22);
    drawCrack(0, h, w * 0.18, h * 0.78);
    drawCrack(w, h, w * 0.82, h * 0.78);

    this.screenCracks.setAlpha(0);
    this.scene.tweens.add({
      targets: this.screenCracks,
      alpha: 1,
      duration: 600,
      ease: "Sine.easeIn",
    });
  }

  private removeScreenCracks(): void {
    if (!this.screenCracks) return;
    const c = this.screenCracks;
    this.screenCracks = null;
    this.scene.tweens.add({
      targets: c,
      alpha: 0,
      duration: 500,
      ease: "Sine.easeOut",
      onComplete: () => c.destroy(),
    });
  }

  // ── Flash warning every 30s (critical band only) ──────────────────────────

  private addFlashWarning(): void {
    this.flashWarningTimer = this.scene.time.addEvent({
      delay: 30000,
      loop: true,
      callback: () => {
        const camera = this.scene.cameras.main;
        camera.flash(180, 200, 30, 30, false);
      },
    });
  }

  private removeFlashWarning(): void {
    if (!this.flashWarningTimer) return;
    this.flashWarningTimer.destroy();
    this.flashWarningTimer = null;
  }
}
