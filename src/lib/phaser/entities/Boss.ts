/**
 * Boss.ts
 *
 * BossSilhouette — a Phaser Container representing a Super Boss enemy on the
 * Interactive Ideas world-map. Renders a menacing humanoid silhouette with
 * status-based alpha transitions.
 *
 * Each of the 3 Super Bosses (The Gravemind, The Unraveller, The Pale Architect)
 * has unique entrance(), retreat(), and slay() cinematics per PRD §4.2.
 */

import * as Phaser from "phaser";

// ─────────────────────────────────────────────────────────────────────────────
// Exported types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The five possible visual states for a boss encounter.
 */
export type BossStatus =
  | "silhouette"
  | "present"
  | "foreground"
  | "slain"
  | "retreated";

/**
 * Configuration data required to construct a {@link BossSilhouette}.
 */
export interface BossConfig {
  /** Unique identifier for this boss. */
  bossId: string;

  /** Optional display name (shown on nameplate). */
  bossName?: string;

  /** Initial visual status. */
  status: BossStatus;

  /** World-space X coordinate. */
  x: number;

  /** World-space Y coordinate. */
  y: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// BossSilhouette
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A Phaser Container that renders a Super Boss silhouette on the world map.
 *
 * Features:
 * - Menacing humanoid silhouette (~96×128px) with jagged crown/horns
 * - Glowing red eyes
 * - Status-based alpha (silhouette: 0.15, present: 0.5, foreground: 1.0)
 * - Optional nameplate text
 * - Per-boss-ID unique entrance(), retreat(), slay() animations
 *
 * @example
 * const boss = new BossSilhouette(this, {
 *   bossId: 'super_boss',
 *   bossName: 'The Gravemind',
 *   status: 'silhouette',
 *   x: 800,
 *   y: 400,
 * });
 */
export class BossSilhouette extends Phaser.GameObjects.Container {
  // ── Identity ──────────────────────────────────────────────────────────────

  readonly bossId: string;

  // ── Private state ─────────────────────────────────────────────────────────

  private status: BossStatus;
  private config: BossConfig;
  private silhouetteGraphics: Phaser.GameObjects.Graphics;
  private cracksGraphics: Phaser.GameObjects.Graphics;
  private auraGraphics: Phaser.GameObjects.Graphics;
  private namePlate: Phaser.GameObjects.Text;
  private corruptionLevel: number = 0;
  private currentWeakness: number = 0;

  // ── Constructor ───────────────────────────────────────────────────────────

  /**
   * @param scene  The Phaser Scene this boss belongs to.
   * @param config Full boss configuration including position and status.
   */
  constructor(scene: Phaser.Scene, config: BossConfig) {
    super(scene, config.x, config.y);

    this.bossId = config.bossId;
    this.config = config;
    this.status = config.status;

    // ── Aura graphics (behind the silhouette) ───────────────────────────────
    this.auraGraphics = scene.add.graphics();

    // ── Silhouette graphics ─────────────────────────────────────────────────
    this.silhouetteGraphics = this.drawSilhouette(scene);

    // ── Cracks/damage overlay ───────────────────────────────────────────────
    this.cracksGraphics = scene.add.graphics();
    this.cracksGraphics.setAlpha(0);

    // ── Nameplate ───────────────────────────────────────────────────────────
    const displayName = config.bossName ?? "???";
    this.namePlate = new Phaser.GameObjects.Text(scene, 0, 140, displayName, {
      fontSize: "14px",
      fontFamily: '"Courier New", Courier, monospace',
      color: "#DC2626",
      align: "center",
      stroke: "#0a0a14",
      strokeThickness: 4,
    });
    this.namePlate.setOrigin(0.5, 0);

    // ── Assemble container ──────────────────────────────────────────────────
    this.add([this.auraGraphics, this.silhouetteGraphics, this.cracksGraphics, this.namePlate]);

    // Register with scene
    scene.add.existing(this);

    // Breathing/floating animation to feel alive
    scene.tweens.add({
      targets: this.silhouetteGraphics,
      y: { from: 0, to: -8 },
      scaleY: { from: 1.0, to: 1.03 },
      duration: 1800 + Math.random() * 400,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Apply initial alpha based on status
    this.updateStatus(this.status, false);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Update boss status with smooth opacity transition.
   */
  updateStatus(status: BossStatus, smooth: boolean = true): void {
    if (this.status === status) return;

    this.status = status;

    const targetAlpha = this.getAlphaForStatus(status);

    if (smooth) {
      this.scene.tweens.add({
        targets: this,
        alpha: targetAlpha,
        duration: 800,
        ease: "Sine.easeInOut",
      });
    } else {
      this.setAlpha(targetAlpha);
    }

    if (status === "foreground" && this.config.bossName) {
      this.namePlate.setText(this.config.bossName);
    }
  }

  // ── Public cinematics ─────────────────────────────────────────────────────

  /**
   * Play the entrance animation.
   * Each Super Boss has a thematically distinct materialisation sequence (~1s).
   * PRD §4.2: "entrance animation per Super Boss."
   */
  entrance(): void {
    if (!this.scene || !this.scene.tweens) return;
    this.setAlpha(0);
    this.setScale(0.5);

    switch (this.bossId) {
      // ── The Unraveller — indigo threads converge and weave the form ─────────
      case "the_unraveller": {
        for (let i = 0; i < 12; i++) {
          const thread = this.scene.add.graphics();
          thread.lineStyle(2, 0x818cf8, 0.8);
          const startX = (Math.random() - 0.5) * 300;
          thread.lineBetween(startX, -200, 0, 0);
          this.add(thread);
          this.scene.tweens.add({
            targets: thread,
            alpha: 0,
            duration: 700,
            delay: i * 60,
            onComplete: () => thread.destroy(),
          });
        }
        this.scene.tweens.add({
          targets: this,
          alpha: 0.5,
          scaleX: 1,
          scaleY: 1,
          duration: 900,
          ease: "Cubic.easeOut",
        });
        break;
      }

      // ── The Pale Architect — geometric fragments assemble ────────────────────
      case "the_pale_architect": {
        const cols = 4;
        const rows = 5;
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const frag = this.scene.add.graphics();
            frag.fillStyle(0xe2e8f0, 0.85);
            frag.fillRect(0, 0, 22, 22);
            frag.setPosition(
              (c - cols / 2) * 26 + (Math.random() - 0.5) * 120,
              (r - rows / 2) * 26 + (Math.random() - 0.5) * 120,
            );
            this.add(frag);
            this.scene.tweens.add({
              targets: frag,
              x: (c - cols / 2) * 26,
              y: (r - rows / 2) * 26,
              alpha: { from: 0, to: 0.7 },
              duration: 600,
              delay: (c + r) * 60,
              ease: "Cubic.easeOut",
              onComplete: () => {
                this.scene.tweens.add({
                  targets: frag,
                  alpha: 0,
                  duration: 400,
                  onComplete: () => frag.destroy(),
                });
              },
            });
          }
        }
        this.scene.tweens.add({
          targets: this,
          alpha: 0.5,
          scaleX: 1,
          scaleY: 1,
          delay: 600,
          duration: 600,
          ease: "Linear",
        });
        break;
      }

      // ── The Gravemind — void rings expand, form rises from darkness ──────────
      case "super_boss":
      case "the_gravemind":
      default: {
        for (let ring = 0; ring < 3; ring++) {
          const ringG = this.scene.add.graphics();
          ringG.lineStyle(2, 0x4f46e5, 0.6);
          ringG.strokeCircle(0, 0, 30 + ring * 25);
          ringG.setAlpha(0);
          this.add(ringG);
          this.scene.tweens.add({
            targets: ringG,
            alpha: { from: 0.6, to: 0 },
            scaleX: 2.5,
            scaleY: 2.5,
            duration: 900,
            delay: ring * 200,
            ease: "Cubic.easeOut",
            onComplete: () => ringG.destroy(),
          });
        }
        this.scene.tweens.add({
          targets: this,
          alpha: 0.5,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 800,
          ease: "Cubic.easeOut",
          onComplete: () => {
            this.scene.tweens.add({
              targets: this,
              scaleX: 1,
              scaleY: 1,
              duration: 400,
              ease: "Back.easeOut",
            });
          },
        });
        this.scene.tweens.add({
          targets: this,
          y: this.y + 15,
          duration: 600,
          ease: "Sine.easeOut",
          yoyo: true,
          repeat: 2,
        });
      }
    }
  }

  /**
   * Play the retreat animation — boss backs off when player leaves a stage
   * partially complete. Returns boss to silhouette state (alpha 0.15).
   * PRD §4.2: "retreat on partial stage complete" (~2s per boss).
   */
  retreat(): void {
    if (!this.scene || !this.scene.tweens) return;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.silhouetteGraphics);

    switch (this.bossId) {
      // ── The Unraveller — threads re-absorb the body rightward ───────────────
      case "the_unraveller": {
        for (let i = 0; i < 8; i++) {
          const thread = this.scene.add.graphics();
          thread.lineStyle(2, 0x818cf8, 0.6);
          thread.lineBetween(0, (i - 4) * 18, 120, (i - 4) * 18);
          this.add(thread);
          this.scene.tweens.add({
            targets: thread,
            x: 200,
            alpha: 0,
            duration: 900,
            delay: i * 80,
            ease: "Cubic.easeIn",
            onComplete: () => thread.destroy(),
          });
        }
        this.scene.tweens.add({
          targets: this.silhouetteGraphics,
          scaleX: 0.2,
          alpha: 0,
          duration: 800,
          delay: 200,
          ease: "Cubic.easeIn",
        });
        const retreatX = this.x + 180;
        this.scene.tweens.add({
          targets: this,
          x: retreatX,
          alpha: 0,
          duration: 1500,
          ease: "Cubic.easeIn",
          onComplete: () => {
            this.setPosition(retreatX - 180, this.y);
            this.silhouetteGraphics.setScale(1);
            this.setAlpha(0.15);
          },
        });
        break;
      }

      // ── The Pale Architect — fragments drop away, form fades ────────────────
      case "the_pale_architect": {
        const cols = 3;
        const rows = 4;
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const frag = this.scene.add.graphics();
            frag.fillStyle(0xe2e8f0, 0.5);
            frag.fillRect(0, 0, 26, 22);
            frag.setPosition(
              this.x + (c - cols / 2) * 28,
              this.y + (r - rows / 2) * 24,
            );
            this.scene.add.existing(frag);
            this.scene.tweens.add({
              targets: frag,
              y: frag.y + 300,
              alpha: 0,
              scaleX: 0.5,
              scaleY: 0.5,
              duration: 1200,
              delay: (c + r) * 50,
              ease: "Cubic.easeIn",
              onComplete: () => frag.destroy(),
            });
          }
        }
        this.scene.tweens.add({
          targets: [this.silhouetteGraphics, this],
          alpha: 0,
          scaleY: 0.8,
          duration: 800,
          delay: 400,
          ease: "Sine.easeIn",
          onComplete: () => {
            this.silhouetteGraphics.setScale(1);
            this.setAlpha(0.15);
          },
        });
        break;
      }

      // ── The Gravemind — void tendrils retract, sinks below ──────────────────
      case "super_boss":
      case "the_gravemind":
      default: {
        for (let i = 0; i < 12; i++) {
          const tendril = this.scene.add.graphics();
          tendril.lineStyle(2, 0x4f46e5, 0.5);
          const angle = (i / 12) * Math.PI * 2;
          tendril.lineBetween(
            Math.cos(angle) * 80, Math.sin(angle) * 80,
            Math.cos(angle) * 30, Math.sin(angle) * 30,
          );
          tendril.setPosition(this.x, this.y);
          this.scene.add.existing(tendril);
          this.scene.tweens.add({
            targets: tendril,
            alpha: 0,
            scale: 0.2,
            duration: 800,
            delay: i * 40,
            ease: "Cubic.easeIn",
            onComplete: () => tendril.destroy(),
          });
        }
        this.scene.tweens.add({
          targets: this.silhouetteGraphics,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: 900,
          delay: 300,
          ease: "Back.easeIn",
        });
        const sinkY = this.y + 60;
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          y: sinkY,
          duration: 1500,
          ease: "Cubic.easeIn",
          onComplete: () => {
            this.setPosition(this.x, sinkY - 60);
            this.silhouetteGraphics.setScale(1);
            this.setAlpha(0.15);
          },
        });
      }
    }
  }

  /**
   * Play the slay animation and destroy the boss.
   * Standard clears in 2s; gold uses the unique per-boss 3-4s sequence.
   * PRD §4.2: "slay animation per Super Boss."
   */
  slay(variant: "standard" | "gold" = "gold"): void {
    if (variant === "standard") {
      this.slayStandard();
      return;
    }

    if (!this.scene || !this.scene.tweens) return;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.silhouetteGraphics);
    this.scene.tweens.killTweensOf(this.namePlate);

    // Nameplate always fades first
    this.scene.tweens.add({
      targets: this.namePlate,
      alpha: 0,
      duration: 300,
      ease: "Sine.easeOut",
    });

    switch (this.bossId) {
      // ── The Unraveller — body shreds into 18 horizontal streaks (3.5s) ────
      case "the_unraveller": {
        const streaks = 18;
        for (let i = 0; i < streaks; i++) {
          const streak = this.scene.add.graphics();
          const dir = i % 2 === 0 ? 1 : -1;
          streak.lineStyle(2 + Math.random() * 2, 0x818cf8, 0.9);
          streak.lineBetween(0, (i - streaks / 2) * 10, dir * 20, (i - streaks / 2) * 10);
          this.add(streak);
          this.scene.tweens.add({
            targets: streak,
            x: dir * (150 + Math.random() * 100),
            alpha: 0,
            duration: 1800,
            delay: i * 50,
            ease: "Cubic.easeIn",
            onComplete: () => streak.destroy(),
          });
        }
        this.scene.tweens.add({
          targets: this.silhouetteGraphics,
          alpha: 0,
          scaleX: 0.1,
          duration: 1500,
          ease: "Cubic.easeIn",
        });
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          duration: 3500,
          ease: "Linear",
          onComplete: () => this.destroy(),
        });
        break;
      }

      // ── The Pale Architect — 5×7 geometric grid shatters outward (3.5s) ───
      case "the_pale_architect": {
        const cols = 5;
        const rows = 7;
        const pieceW = 20;
        const pieceH = 18;
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const piece = this.scene.add.graphics();
            piece.fillStyle(0xe2e8f0, 0.9);
            piece.fillRect(0, 0, pieceW, pieceH);
            piece.setPosition(
              this.x + (c - cols / 2) * pieceW - pieceW / 2,
              this.y + (r - rows / 2) * pieceH - pieceH / 2,
            );
            this.scene.add.existing(piece);
            const angle = Math.atan2(r - rows / 2, c - cols / 2);
            const dist = 200 + Math.random() * 150;
            this.scene.tweens.add({
              targets: piece,
              x: piece.x + Math.cos(angle) * dist,
              y: piece.y + Math.sin(angle) * dist,
              alpha: 0,
              rotation: (Math.random() - 0.5) * Math.PI,
              duration: 2500,
              delay: (c + r) * 40,
              ease: "Cubic.easeIn",
              onComplete: () => piece.destroy(),
            });
          }
        }
        this.scene.tweens.add({
          targets: [this.silhouetteGraphics, this],
          alpha: 0,
          duration: 800,
          ease: "Sine.easeOut",
          onComplete: () => this.destroy(),
        });
        break;
      }

      // ── The Gravemind — 3-phase: spiral implosion → collapse → shockwave ─
      case "super_boss":
      case "the_gravemind":
      default: {
        // Phase 1: 24 void particles spiral inward (0–1.2s)
        for (let i = 0; i < 24; i++) {
          const particle = this.scene.add.graphics();
          particle.fillStyle(0x4f46e5, 0.8);
          particle.fillCircle(0, 0, 4 + Math.random() * 3);
          const angle = (i / 24) * Math.PI * 2;
          particle.setPosition(
            this.x + Math.cos(angle) * 120,
            this.y + Math.sin(angle) * 120,
          );
          this.scene.add.existing(particle);
          this.scene.tweens.add({
            targets: particle,
            x: this.x,
            y: this.y,
            alpha: 0,
            scale: 0,
            duration: 1200,
            delay: i * 20,
            ease: "Cubic.easeIn",
            onComplete: () => particle.destroy(),
          });
        }
        // Phase 2: Silhouette collapses (0.8–2.0s)
        this.scene.tweens.add({
          targets: this.silhouetteGraphics,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: 1200,
          delay: 800,
          ease: "Back.easeIn",
        });
        // Phase 3: Dark energy shockwave + scatter (2.0–3.5s)
        this.scene.time.delayedCall(2000, () => {
          if (!this.scene) return;
          const shockwave = this.scene.add.graphics();
          shockwave.lineStyle(4, 0x1a0a2e, 1);
          shockwave.strokeCircle(this.x, this.y, 10);
          this.scene.add.existing(shockwave);
          this.scene.tweens.add({
            targets: shockwave,
            scaleX: 15,
            scaleY: 15,
            alpha: 0,
            duration: 1000,
            ease: "Cubic.easeOut",
            onComplete: () => shockwave.destroy(),
          });
          for (let j = 0; j < 16; j++) {
            const vp = this.scene.add.graphics();
            vp.fillStyle(0x6366f1, 1);
            vp.fillCircle(0, 0, 5);
            vp.setPosition(this.x, this.y);
            this.scene.add.existing(vp);
            const ang = (j / 16) * Math.PI * 2;
            this.scene.tweens.add({
              targets: vp,
              x: this.x + Math.cos(ang) * (160 + Math.random() * 60),
              y: this.y + Math.sin(ang) * (160 + Math.random() * 60),
              alpha: 0,
              scale: 0,
              duration: 900,
              ease: "Cubic.easeOut",
              onComplete: () => vp.destroy(),
            });
          }
        });
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          duration: 3500,
          ease: "Linear",
          onComplete: () => this.destroy(),
        });
      }
    }
  }

  private slayStandard(): void {
    if (!this.scene || !this.scene.tweens) return;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.silhouetteGraphics);
    this.scene.tweens.killTweensOf(this.namePlate);

    this.scene.tweens.add({
      targets: this.namePlate,
      alpha: 0,
      duration: 200,
      ease: "Sine.easeOut",
    });

    for (let i = 0; i < 12; i++) {
      const mote = this.scene.add.graphics();
      mote.fillStyle(0x818cf8, 0.75);
      mote.fillCircle(0, 0, 3 + Math.random() * 3);
      mote.setPosition(this.x, this.y);
      this.scene.add.existing(mote);

      const angle = (i / 12) * Math.PI * 2;
      this.scene.tweens.add({
        targets: mote,
        x: this.x + Math.cos(angle) * (90 + Math.random() * 40),
        y: this.y + Math.sin(angle) * (90 + Math.random() * 40),
        alpha: 0,
        scale: 0,
        duration: 1100,
        delay: i * 35,
        ease: "Cubic.easeOut",
        onComplete: () => mote.destroy(),
      });
    }

    this.scene.tweens.add({
      targets: this.silhouetteGraphics,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 1600,
      ease: "Back.easeIn",
    });

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 2000,
      ease: "Linear",
      onComplete: () => this.destroy(),
    });
  }

  // ── Private: drawing ──────────────────────────────────────────────────────

  /**
   * Draws the boss silhouette — a menacing procedural humanoid (~96×128px).
   */
  private drawSilhouette(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics();

    const offsetX = -48;
    const offsetY = -64;

    g.fillStyle(0x1a0a2e);

    // Jagged crown / horns
    g.fillTriangle(offsetX + 18, offsetY + 0, offsetX + 28, offsetY - 30, offsetX + 38, offsetY + 0);
    g.fillTriangle(offsetX + 43, offsetY + 0, offsetX + 48, offsetY - 40, offsetX + 53, offsetY + 0);
    g.fillTriangle(offsetX + 58, offsetY + 0, offsetX + 68, offsetY - 30, offsetX + 78, offsetY + 0);

    // Massive shoulders
    g.fillRect(offsetX + 0, offsetY + 0, 96, 20);

    // Torso
    g.fillRect(offsetX + 20, offsetY + 20, 56, 60);

    // Legs
    g.fillRect(offsetX + 16, offsetY + 70, 24, 40);
    g.fillRect(offsetX + 56, offsetY + 70, 24, 40);

    // Glowing red eyes
    g.fillStyle(0xff4400, 0.8);
    g.fillRect(offsetX + 30, offsetY + 10, 6, 4);
    g.fillRect(offsetX + 60, offsetY + 10, 6, 4);

    return g;
  }

  // ── Private: visual state ─────────────────────────────────────────────────

  private getAlphaForStatus(status: BossStatus): number {
    switch (status) {
      case "silhouette": return 0.15;
      case "present":    return 0.5;
      case "foreground": return 1.0;
      case "slain":
      case "retreated":  return 0;
    }
  }

  /**
   * Updates the menacing boss aura based on the current corruption level (0-100)
   */
  updateCorruptionAura(level: number): void {
    this.corruptionLevel = level;
    if (!this.auraGraphics || !this.scene) return;

    this.auraGraphics.clear();
    if (level <= 0) return;

    const auraColor = level > 50 ? 0xdc2626 : 0x4f46e5;
    const maxRadius = 60 + (level / 100) * 40;
    const alpha = 0.15 + (level / 100) * 0.35;

    // Draw a radial gradient-like aura using multiple semi-transparent shapes
    this.auraGraphics.fillStyle(auraColor, alpha * 0.4);
    this.auraGraphics.fillCircle(0, 0, maxRadius);
    this.auraGraphics.fillStyle(auraColor, alpha * 0.7);
    this.auraGraphics.fillCircle(0, 0, maxRadius * 0.6);
    this.auraGraphics.fillStyle(0x000000, 0.2);
    this.auraGraphics.fillCircle(0, 0, maxRadius * 0.3);

    // Add a pulsing effect to the aura
    this.scene.tweens.killTweensOf(this.auraGraphics);
    this.scene.tweens.add({
      targets: this.auraGraphics,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: alpha * 0.5,
      duration: 1000 + (100 - level) * 10,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Progressively weaken the super boss based on progress / insight fragments.
   * Renders glowing energy cracks on the dark silhouette.
   */
  weaken(completed: number, total: number): void {
    if (total === 0 || !this.scene) return;
    const weakness = completed / total;
    this.currentWeakness = Phaser.Math.Clamp(weakness, 0, 1);

    this.drawCracks(this.currentWeakness);
    
    this.scene.tweens.add({
      targets: this.cracksGraphics,
      alpha: this.currentWeakness,
      duration: 600,
      ease: "Sine.easeOut",
    });

    // When weakened, dim the corruption aura
    if (this.auraGraphics) {
      this.scene.tweens.add({
        targets: this.auraGraphics,
        scaleX: 1 - this.currentWeakness * 0.3,
        scaleY: 1 - this.currentWeakness * 0.3,
        alpha: (0.15 + (this.corruptionLevel / 100) * 0.35) * (1 - this.currentWeakness * 0.5),
        duration: 800,
        ease: "Sine.easeOut",
      });
    }
  }

  private drawCracks(weakness: number): void {
    if (!this.cracksGraphics) return;
    this.cracksGraphics.clear();
    if (weakness <= 0) return;

    const offsetX = -48;
    const offsetY = -64;

    // Glowing purple/cyan cracks for super boss
    const crackColor = 0xc084fc; // Light purple
    this.cracksGraphics.lineStyle(2, crackColor, 0.95);

    // Main crack down the head/torso (starts at 20% weakness)
    if (weakness >= 0.2) {
      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 48, offsetY + 15);
      this.cracksGraphics.lineTo(offsetX + 48, offsetY + 40);
      this.cracksGraphics.lineTo(offsetX + 40, offsetY + 60);
      this.cracksGraphics.strokePath();
    }

    // Branching crack to left shoulder (starts at 40% weakness)
    if (weakness >= 0.4) {
      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 48, offsetY + 30);
      this.cracksGraphics.lineTo(offsetX + 30, offsetY + 25);
      this.cracksGraphics.lineTo(offsetX + 15, offsetY + 10);
      this.cracksGraphics.strokePath();
    }

    // Branching crack to right shoulder (starts at 60% weakness)
    if (weakness >= 0.6) {
      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 48, offsetY + 35);
      this.cracksGraphics.lineTo(offsetX + 65, offsetY + 30);
      this.cracksGraphics.lineTo(offsetX + 80, offsetY + 10);
      this.cracksGraphics.strokePath();
    }

    // Cracks spreading to the legs (starts at 80% weakness)
    if (weakness >= 0.8) {
      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 40, offsetY + 60);
      // Left leg
      this.cracksGraphics.lineTo(offsetX + 30, offsetY + 80);
      this.cracksGraphics.lineTo(offsetX + 25, offsetY + 105);
      this.cracksGraphics.strokePath();

      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 40, offsetY + 60);
      // Right leg
      this.cracksGraphics.lineTo(offsetX + 55, offsetY + 80);
      this.cracksGraphics.lineTo(offsetX + 65, offsetY + 105);
      this.cracksGraphics.strokePath();
    }
  }
}
