/**
 * MiniBoss.ts
 *
 * MiniBoss — a Phaser Container representing stage-specific mini-boss enemies
 * that progressively weaken as the player completes checkpoints within a stage.
 *
 * Supported Types:
 * - Fog of Vagueness (Stage 1 - Ideation)
 * - Pathwarden Wraith (Stage 2 - Research)
 * - Advocate of Comfortable Lies (Stage 3 - Validation)
 * - Unfinished Golem (Stage 4 - Offer Design)
 * - Collapse Specter (Stage 5 - Build & Deliver)
 * - Harbourmaster of Hesitation (Stage 6 - Launch)
 * - Babel Merchant (Stage 7 - Iteration)
 * - Iron Bureaucrat (Stage 8 - Scale)
 */

import * as Phaser from "phaser";

// ─────────────────────────────────────────────────────────────────────────────
// Exported types
// ─────────────────────────────────────────────────────────────────────────────

export type MiniBossType = string;

/**
 * Configuration data required to construct a {@link MiniBoss}.
 */
export interface MiniBossConfig {
  /** Unique identifier for this mini-boss. */
  bossId: string;

  /** Boss type determines visual appearance. */
  bossType: MiniBossType;

  /** World-space X coordinate. */
  x: number;

  /** World-space Y coordinate. */
  y: number;

  /** Stage number (1-8) this boss guards. */
  stage: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MiniBoss
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A Phaser Container that renders a stage-specific mini-boss on the world map.
 *
 * Features:
 * - Progressive weakening as checkpoints are completed
 * - Type-specific visual designs (fog cloud vs hooded wraith)
 * - Dramatic slay animation when stage is completed
 * - Procedural graphics (no sprite assets required)
 *
 * @example
 * const boss = new MiniBoss(this, {
 *   bossId: 'fog_of_vagueness',
 *   bossType: 'fog_of_vagueness',
 *   x: 800,
 *   y: 300,
 *   stage: 1
 * });
 * boss.weaken(2, 4); // 2 out of 4 checkpoints complete
 * boss.slay(); // Stage complete, destroy boss
 */
export class MiniBoss extends Phaser.GameObjects.Container {
  // ── Identity ──────────────────────────────────────────────────────────────

  readonly bossId: string;
  readonly bossType: MiniBossType;
  readonly stage: number;

  // ── Private state ─────────────────────────────────────────────────────────

  private bossGraphics: Phaser.GameObjects.Graphics;
  private cracksGraphics: Phaser.GameObjects.Graphics;
  private namePlate: Phaser.GameObjects.Text;
  private eyeLeft: Phaser.GameObjects.Arc | null = null;
  private eyeRight: Phaser.GameObjects.Arc | null = null;
  private currentWeakness: number = 0; // 0 = full strength, 1 = fully weakened

  // ── Constructor ───────────────────────────────────────────────────────────

  /**
   * @param scene  The Phaser Scene this mini-boss belongs to.
   * @param config Full mini-boss configuration including position and type.
   */
  constructor(scene: Phaser.Scene, config: MiniBossConfig) {
    super(scene, config.x, config.y);

    this.bossId = config.bossId;
    this.bossType = config.bossType;
    this.stage = config.stage;

    // ── Boss graphics ───────────────────────────────────────────────────────
    this.bossGraphics = scene.add.graphics();

    // ── Cracks/damage overlay ───────────────────────────────────────────────
    this.cracksGraphics = scene.add.graphics();
    this.cracksGraphics.setAlpha(0);

    // Draw type-specific boss visuals
    switch (this.bossType) {
      case "Fog of Vagueness":
        this.drawFogOfVagueness();
        break;
      case "Pathwarden Wraith":
        this.drawPathwardenWraith();
        break;
      case "Advocate of Comfortable Lies":
        this.drawAdvocateOfComfortableLies();
        break;
      case "Unfinished Golem":
        this.drawUnfinishedGolem();
        break;
      case "Collapse Specter":
        this.drawCollapseSpecter();
        break;
      case "Harbourmaster of Hesitation":
        this.drawHarbourmasterOfHesitation();
        break;
      case "Babel Merchant":
        this.drawBabelMerchant();
        break;
      case "Iron Bureaucrat":
        this.drawIronBureaucrat();
        break;
      default:
        // Generic boss visual for other types
        this.drawGenericBoss();
        break;
    }

    // ── Nameplate Capsule Badge (Modern premium glassmorphism) ─────────────
    const displayName = this.getBossName();
    
    // Create capsule background (semi-transparent dark glass with glowing red stroke)
    const namePlateBg = scene.add.graphics();
    const textWidth = displayName.length * 7;
    const padX = 14;
    const padY = 6;
    const badgeW = textWidth + padX * 2;
    const badgeH = 22;
    const badgeX = -badgeW / 2;
    const badgeY = 88;

    namePlateBg.fillStyle(0x0f172a, 0.85); // Slate 900
    namePlateBg.lineStyle(1.5, 0xef4444, 0.6); // Rose 500
    namePlateBg.fillRoundedRect(badgeX, badgeY, badgeW, badgeH, 11);
    namePlateBg.strokeRoundedRect(badgeX, badgeY, badgeW, badgeH, 11);

    this.namePlate = new Phaser.GameObjects.Text(scene, 0, badgeY + 4, displayName, {
      fontSize: "10px",
      fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
      fontStyle: "bold",
      color: "#fca5a5", // Soft rose text
      align: "center",
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: "#ef4444",
        blur: 4,
        stroke: true,
        fill: true
      }
    });
    this.namePlate.setOrigin(0.5, 0);

    // ── Assemble container ──────────────────────────────────────────────────
    this.add([namePlateBg, this.bossGraphics, this.cracksGraphics, this.namePlate]);
    if (this.eyeLeft) this.add([this.eyeLeft, this.eyeRight!]);

    // Register with scene
    scene.add.existing(this);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Progressively weaken the boss based on checkpoint completion.
   *
   * @param checkpointsComplete - Number of checkpoints completed in this stage
   * @param totalCheckpoints - Total checkpoints in this stage
   */
  weaken(checkpointsComplete: number, totalCheckpoints: number): void {
    if (totalCheckpoints === 0) return;

    const weakness = checkpointsComplete / totalCheckpoints;
    this.currentWeakness = Phaser.Math.Clamp(weakness, 0, 1);

    if (
      this.bossType === "Fog of Vagueness" ||
      this.bossType === "Collapse Specter" ||
      this.bossType === "Babel Merchant"
    ) {
      // Ethereal types dissipate by reducing opacity
      const targetAlpha = 1.0 - this.currentWeakness * 0.7;
      this.scene.tweens.add({
        targets: this.bossGraphics,
        alpha: targetAlpha,
        duration: 600,
        ease: "Sine.easeOut",
      });
      if (this.eyeLeft) {
        this.scene.tweens.add({
          targets: [this.eyeLeft, this.eyeRight],
          alpha: targetAlpha,
          duration: 600,
          ease: "Sine.easeOut",
        });
      }
    } else if (
      this.bossType === "Harbourmaster of Hesitation"
    ) {
      // Sinks lower as hesitation grows
      this.scene.tweens.add({
        targets: this,
        y: this.y + this.currentWeakness * 30,
        alpha: 1.0 - this.currentWeakness * 0.5,
        duration: 700,
        ease: "Sine.easeOut",
      });
    } else {
      // Solid types (Wraith, Golem, Advocate, Bureaucrat) show progressive cracks
      this.drawCracks(this.currentWeakness);
      this.scene.tweens.add({
        targets: this.cracksGraphics,
        alpha: this.currentWeakness,
        duration: 600,
        ease: "Sine.easeOut",
      });
    }
  }

  /**
   * Play the slay animation and destroy the boss.
   * Called when the player completes the stage.
   */
  slay(): void {
    // Safety check - ensure scene and tweens exist
    if (!this.scene || !this.scene.tweens) {
      console.warn("[MiniBoss] Cannot slay - scene or tweens not available");
      this.destroy();
      return;
    }

    // Stop any ongoing tweens
    this.scene.tweens.killTweensOf([
      this,
      this.bossGraphics,
      this.cracksGraphics,
      this.eyeLeft,
      this.eyeRight,
      this.namePlate,
    ]);

    if (
      this.bossType === "Fog of Vagueness" ||
      this.bossType === "Collapse Specter"
    ) {
      // Ethereal types expand and dissolve
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        scaleX: 1.6,
        scaleY: 1.6,
        duration: 2000,
        ease: "Cubic.easeOut",
        onComplete: () => { this.destroy(); },
      });
    } else if (this.bossType === "Babel Merchant") {
      // Babel Merchant implodes in a swirl of chaotic data
      this.scene.tweens.add({
        targets: this,
        angle: 720,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 1800,
        ease: "Cubic.easeIn",
        onComplete: () => { this.destroy(); },
      });
    } else if (this.bossType === "Harbourmaster of Hesitation") {
      // Sinks into the ground with a splash
      this.scene.tweens.add({
        targets: this,
        y: this.y + 200,
        alpha: 0,
        duration: 2200,
        ease: "Cubic.easeIn",
        onComplete: () => { this.destroy(); },
      });
    } else if (this.bossType === "Iron Bureaucrat") {
      // Collapses with a heavy slam
      this.scene.tweens.add({
        targets: this.bossGraphics,
        y: this.bossGraphics.y + 40,
        angle: -15,
        alpha: 0,
        duration: 1600,
        ease: "Bounce.easeOut",
      });
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 2000,
        ease: "Sine.easeOut",
        onComplete: () => { this.destroy(); },
      });
    } else {
      // Wraith / Advocate / Golem — shatters and fades
      this.scene.tweens.add({
        targets: this.bossGraphics,
        alpha: 0,
        y: this.bossGraphics.y + 20,
        duration: 2000,
        ease: "Cubic.easeIn",
      });
      this.scene.tweens.add({
        targets: this.cracksGraphics,
        alpha: 1,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 1000,
        ease: "Back.easeOut",
      });
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 2000,
        ease: "Sine.easeOut",
        onComplete: () => { this.destroy(); },
      });
    }
  }

  /**
   * Play the GOLD slay animation - more dramatic than standard slay.
   * Called when the player completes the stage with a gold checkpoint.
   */
  slayGold(): void {
    // Safety check
    if (!this.scene || !this.scene.tweens) {
      console.warn(
        "[MiniBoss] Cannot slay (gold) - scene or tweens not available",
      );
      this.destroy();
      return;
    }

    // Stop any ongoing tweens
    this.scene.tweens.killTweensOf([
      this,
      this.bossGraphics,
      this.cracksGraphics,
      this.eyeLeft,
      this.eyeRight,
      this.namePlate,
    ]);

    // Create gold particles
    const particles: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.circle(
        this.x,
        this.y,
        Phaser.Math.Between(2, 6),
        0xfbbf24,
        1,
      );
      particles.push(particle);

      const angle = (Math.PI * 2 * i) / 20;
      const distance = Phaser.Math.Between(50, 150);

      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * distance,
        y: this.y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 1500,
        ease: "Cubic.easeOut",
        onComplete: () => {
          particle.destroy();
        },
      });
    }

    if (
      this.bossType === "Fog of Vagueness" ||
      this.bossType === "Collapse Specter"
    ) {
      // Gold: ethereal types explode in massive golden burst
      this.scene.tweens.add({
        targets: this,
        alpha: { from: 1, to: 0 },
        scaleX: { from: 1, to: 2.5 },
        scaleY: { from: 1, to: 2.5 },
        duration: 2500,
        ease: "Expo.easeOut",
        onComplete: () => { this.destroy(); },
      });
    } else if (this.bossType === "Babel Merchant") {
      // Gold: implodes then scatters in all directions
      this.scene.tweens.add({
        targets: this,
        angle: 1080,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 2200,
        ease: "Expo.easeIn",
        onComplete: () => { this.destroy(); },
      });
    } else if (this.bossType === "Harbourmaster of Hesitation") {
      // Gold: dramatic whirlpool sinking
      this.scene.tweens.add({
        targets: this,
        y: this.y + 300,
        angle: -360,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 2800,
        ease: "Cubic.easeIn",
        onComplete: () => { this.destroy(); },
      });
    } else if (this.bossType === "Iron Bureaucrat") {
      // Gold: topples backward with dramatic crash
      this.scene.tweens.add({
        targets: this,
        angle: -90,
        y: this.y + 120,
        alpha: 0,
        duration: 2000,
        ease: "Bounce.easeOut",
        onComplete: () => { this.destroy(); },
      });
    } else {
      // Gold: solid types (Wraith, Advocate, Golem) shatter upward violently
      this.scene.tweens.add({
        targets: this.bossGraphics,
        alpha: 0,
        y: this.bossGraphics.y - 50,
        angle: 360,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 2000,
        ease: "Back.easeIn",
      });
      this.scene.tweens.add({
        targets: this.cracksGraphics,
        alpha: 1,
        scaleX: 2,
        scaleY: 2,
        duration: 1200,
        ease: "Expo.easeOut",
      });
      if (this.eyeLeft) {
        this.scene.tweens.add({
          targets: this.eyeLeft,
          x: this.eyeLeft.x - 60,
          y: this.eyeLeft.y - 40,
          alpha: 0,
          duration: 1500,
          ease: "Cubic.easeOut",
        });
      }
      if (this.eyeRight) {
        this.scene.tweens.add({
          targets: this.eyeRight,
          x: this.eyeRight.x + 60,
          y: this.eyeRight.y - 40,
          alpha: 0,
          duration: 1500,
          ease: "Cubic.easeOut",
        });
      }
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 2500,
        ease: "Sine.easeOut",
        onComplete: () => { this.destroy(); },
      });
    }
  }

  /**
   * Play the retreat animation.
   * Called when a player leaves the stage with partial progress —
   * boss backs off but remains visible as a looming threat.
   *
   * PRD §4.2: "retreat on partial stage complete."
   * Mini-bosses settle at 40% alpha after retreating (still lurking).
   */
  retreat(): void {
    if (!this.scene || !this.scene.tweens) return;

    this.scene.tweens.killTweensOf([
      this,
      this.bossGraphics,
      this.cracksGraphics,
      this.eyeLeft,
      this.eyeRight,
    ]);

    if (
      this.bossType === "Fog of Vagueness" ||
      this.bossType === "Collapse Specter" ||
      this.bossType === "Babel Merchant"
    ) {
      // Ethereal types condense inward — swirl and dim
      this.scene.tweens.add({
        targets: this.bossGraphics,
        scaleX: { from: 1.0, to: 0.6 },
        scaleY: { from: 1.0, to: 0.6 },
        alpha: 0.15,
        duration: 700,
        ease: "Cubic.easeIn",
        onComplete: () => {
          if (!this.scene) return;
          this.scene.tweens.add({
            targets: this.bossGraphics,
            scaleX: 0.85,
            scaleY: 0.85,
            alpha: 0.4,
            duration: 900,
            ease: "Sine.easeOut",
          });
        },
      });
      if (this.eyeLeft) {
        this.scene.tweens.add({
          targets: [this.eyeLeft, this.eyeRight],
          alpha: 0.25,
          duration: 700,
          ease: "Sine.easeOut",
        });
      }
      this.scene.tweens.add({
        targets: this.namePlate,
        alpha: 0.3,
        duration: 500,
      });
    } else if (this.bossType === "Harbourmaster of Hesitation") {
      // Partially sinks then bobs back up, still looming
      this.scene.tweens.add({
        targets: this,
        y: this.y + 60,
        alpha: 0.35,
        duration: 1200,
        ease: "Cubic.easeInOut",
        onComplete: () => {
          if (!this.scene) return;
          this.scene.tweens.add({
            targets: this,
            y: this.y - 20,
            duration: 800,
            ease: "Sine.easeOut",
          });
        },
      });
      this.scene.tweens.add({
        targets: this.namePlate,
        alpha: 0.3,
        duration: 500,
      });
    } else {
      // Solid types (Wraith, Advocate, Golem, Bureaucrat) — sink into the ground and re-emerge dimly
      const retreatY = this.y + 120;

      this.scene.tweens.add({
        targets: this.bossGraphics,
        y: this.bossGraphics.y + 40,
        alpha: 0,
        duration: 700,
        ease: "Cubic.easeIn",
      });
      this.scene.tweens.add({
        targets: this.cracksGraphics,
        alpha: 0,
        duration: 400,
      });
      if (this.eyeLeft) {
        this.scene.tweens.add({
          targets: [this.eyeLeft, this.eyeRight],
          alpha: 0,
          duration: 400,
        });
      }
      this.scene.tweens.add({
        targets: this.namePlate,
        alpha: 0,
        duration: 400,
      });
      this.scene.tweens.add({
        targets: this,
        y: retreatY,
        alpha: 0,
        duration: 900,
        ease: "Cubic.easeIn",
        onComplete: () => {
          this.setPosition(this.x, retreatY - 80);
          this.bossGraphics.setPosition(0, 0);
          this.bossGraphics.setAlpha(0.4);
          this.namePlate.setAlpha(0.3);
          this.setAlpha(0.4);
          if (this.scene) {
            this.scene.tweens.add({
              targets: this,
              y: this.y - 20,
              duration: 600,
              ease: "Sine.easeOut",
            });
          }
        },
      });
    }
  }

  // ── Private: drawing methods ──────────────────────────────────────────────

  /**
   * Draw "Fog of Vagueness" — grey smoky cloud monster with amber glowing eyes
   * and a dark gaping mouth. Matches IMG_9275 reference.
   */
  /**
   * Draw "Fog of Vagueness" — grey smoky cloud monster with amber glowing eyes
   * and a dark gaping mouth. Matches IMG_9275 reference.
   */
  private drawFogOfVagueness(): void {
    const g = this.bossGraphics;
    const cx = 0; // center X
    const cy = 0; // center Y

    g.clear();

    // ── 1. Ghostly Cyan Aura / Back-glow ──────────────────────────────────
    // Makes the specter stand out on any map background
    g.fillStyle(0x06b6d4, 0.15);
    g.fillCircle(cx, cy, 42);
    g.fillCircle(cx - 15, cy + 20, 32);
    g.fillCircle(cx + 15, cy + 20, 32);

    // ── 2. Ethereal Spectral Shroud / Hood ────────────────────────────────
    // Main deep indigo/purple ghost robes
    g.fillStyle(0x1e1b4b, 0.95);
    
    // Draw the hooded head
    g.beginPath();
    g.moveTo(cx - 22, cy);
    g.lineTo(cx + 22, cy);
    g.lineTo(cx + 18, cy - 25);
    g.lineTo(cx, cy - 36); // peak of hood
    g.lineTo(cx - 18, cy - 25);
    g.closePath();
    g.fillPath();

    // Draw the flowing, wispy body trailing downwards
    g.beginPath();
    g.moveTo(cx - 22, cy);
    g.lineTo(cx + 22, cy);
    g.lineTo(cx + 26, cy + 30);
    g.lineTo(cx + 12, cy + 56); // tail end right
    g.lineTo(cx - 6, cy + 62);  // tail end left
    g.lineTo(cx - 24, cy + 26);
    g.closePath();
    g.fillPath();

    // ── 3. Shading & Ethereal Cyan highlights on Robe ──────────────────────
    // Gives definition and depth to the folds of the shroud
    g.fillStyle(0x0891b2, 0.7);
    g.beginPath();
    g.moveTo(cx - 16, cy);
    g.lineTo(cx, cy - 30);
    g.lineTo(cx - 4, cy);
    g.closePath();
    g.fillPath();

    g.beginPath();
    g.moveTo(cx - 20, cy + 8);
    g.lineTo(cx - 10, cy + 42);
    g.lineTo(cx - 4, cy + 12);
    g.closePath();
    g.fillPath();

    g.fillStyle(0x0e7490, 0.55);
    g.beginPath();
    g.moveTo(cx + 18, cy + 10);
    g.lineTo(cx + 8, cy + 44);
    g.lineTo(cx + 4, cy + 14);
    g.closePath();
    g.fillPath();

    // ── 4. Ethereal Gaseous Tail (Bottom mist) ─────────────────────────────
    // Layers of transparent cyan circles that represent floating ectoplasm
    g.fillStyle(0x22d3ee, 0.35);
    g.fillCircle(cx - 8, cy + 48, 14);
    g.fillCircle(cx + 8, cy + 48, 12);
    g.fillCircle(cx - 2, cy + 58, 9);

    g.fillStyle(0x06b6d4, 0.2);
    g.fillCircle(cx - 18, cy + 34, 10);
    g.fillCircle(cx + 18, cy + 34, 10);

    // ── 5. Hollow Shroud Shadow / Dark Face Void ───────────────────────────
    g.fillStyle(0x020617, 1);
    g.fillEllipse(cx, cy - 10, 18, 22);

    // ── 6. Gaping Mouth of the Void ────────────────────────────────────────
    g.fillStyle(0x000000, 1);
    g.fillEllipse(cx, cy - 2, 8, 12);

    // ── 7. Floating Ghostly Particles ──────────────────────────────────────
    const particleColors = [0x22d3ee, 0x06b6d4, 0x3b82f6];
    for (let i = 0; i < 14; i++) {
      const px = cx + Phaser.Math.Between(-32, 32);
      const py = cy + Phaser.Math.Between(-20, 50);
      const size = Phaser.Math.Between(2, 5);
      g.fillStyle(particleColors[i % 3], 0.25);
      g.fillCircle(px, py, size);
    }

    // ── 8. Highly Stylized Glowing Ember Eyes (Amber glowing cores) ────────
    // Matches "Fog of Vagueness" amber eyes look but with premium flares
    const eyeLeftX = cx - 9;
    const eyeLeftY = cy - 12;

    // Left Eye Outer Glow
    const leftGlow = new Phaser.GameObjects.Arc(this.scene, eyeLeftX, eyeLeftY, 9, 0, 360, false, 0xf59e0b, 0.45);
    leftGlow.setBlendMode(Phaser.BlendModes.ADD);

    // Left Eye Core
    this.eyeLeft = new Phaser.GameObjects.Arc(this.scene, eyeLeftX, eyeLeftY, 5, 0, 360, false, 0xfbbf24, 1);
    this.eyeLeft.setStrokeStyle(2, 0xd97706, 1);

    // Left Eye Glint
    const leftGlint = new Phaser.GameObjects.Arc(this.scene, eyeLeftX - 1.5, eyeLeftY - 1.5, 1.5, 0, 360, false, 0xffffff, 0.95);

    // Right Eye components
    const eyeRightX = cx + 9;
    const eyeRightY = cy - 12;

    // Right Eye Outer Glow
    const rightGlow = new Phaser.GameObjects.Arc(this.scene, eyeRightX, eyeRightY, 9, 0, 360, false, 0xf59e0b, 0.45);
    rightGlow.setBlendMode(Phaser.BlendModes.ADD);

    // Right Eye Core
    this.eyeRight = new Phaser.GameObjects.Arc(this.scene, eyeRightX, eyeRightY, 5, 0, 360, false, 0xfbbf24, 1);
    this.eyeRight.setStrokeStyle(2, 0xd97706, 1);

    // Right Eye Glint
    const rightGlint = new Phaser.GameObjects.Arc(this.scene, eyeRightX - 1.5, eyeRightY - 1.5, 1.5, 0, 360, false, 0xffffff, 0.95);

    // Add extra glowing elements to container
    this.add([leftGlow, leftGlint, rightGlow, rightGlint]);

    // ── 9. Mystical Swirling & Floating Tweens ─────────────────────────────
    // Soft breathing + shifting of the cloud wisps
    this.scene.tweens.add({
      targets: g,
      scaleX: { from: 1.0, to: 1.06 },
      scaleY: { from: 1.0, to: 1.06 },
      alpha: { from: 0.9, to: 1.0 },
      duration: 2000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Eye pulse and shimmer
    this.scene.tweens.add({
      targets: [this.eyeLeft, this.eyeRight, leftGlow, rightGlow],
      alpha: { from: 0.45, to: 1.0 },
      scaleX: { from: 0.95, to: 1.18 },
      scaleY: { from: 0.95, to: 1.18 },
      duration: 1200,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Ethereal vertical hover floating animation (custom for ghost)
    this.scene.tweens.add({
      targets: this,
      y: this.y - 12,
      duration: 2500,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Draw "Pathwarden Wraith" — dark navy/purple hooded figure with crumbling
   * pixel base and floating animation. Matches IMG_9274 reference (3 frames).
   */
  private drawPathwardenWraith(): void {
    const g = this.bossGraphics;
    const cx = 0;
    const cy = 0;

    // ── Cloak body — dark navy-purple ────────────────────────────────────────
    g.fillStyle(0x1e1b4b, 0.95); // deep indigo (matches reference blue-black)
    // Main robe trapezoid
    g.beginPath();
    g.moveTo(cx - 18, cy + 10); // left shoulder
    g.lineTo(cx + 18, cy + 10); // right shoulder
    g.lineTo(cx + 28, cy + 65); // bottom right (wider hem)
    g.lineTo(cx - 28, cy + 65); // bottom left
    g.closePath();
    g.fillPath();

    // ── Hood — rounded triangle top ──────────────────────────────────────────
    g.fillStyle(0x1e1b4b, 1);
    g.fillCircle(cx, cy - 5, 20); // head behind hood
    g.fillStyle(0x0f0a24, 1);
    g.beginPath();
    g.moveTo(cx - 20, cy + 10);
    g.lineTo(cx + 20, cy + 10);
    g.lineTo(cx + 14, cy - 10);
    g.lineTo(cx, cy - 28); // hood peak
    g.lineTo(cx - 14, cy - 10);
    g.closePath();
    g.fillPath();

    // ── Face void (inside hood — black ellipse) ───────────────────────────────
    g.fillStyle(0x000000, 1);
    g.fillEllipse(cx, cy + 2, 18, 24);

    // ── Cloak shading layers ─────────────────────────────────────────────────
    g.fillStyle(0x312e81, 0.6); // lighter indigo highlight on left edge
    g.fillRect(cx - 18, cy + 10, 7, 55);
    g.fillStyle(0x000000, 0.25); // dark edge right
    g.fillRect(cx + 11, cy + 10, 7, 55);

    // ── Sleeve tips (hands barely visible) ──────────────────────────────────
    g.fillStyle(0x1e1b4b, 0.9);
    g.fillEllipse(cx - 22, cy + 40, 12, 8);
    g.fillEllipse(cx + 22, cy + 40, 12, 8);

    // ── Pixel dissolve base (crumbling effect — rows of pixels breaking apart)
    const pixRows = [
      { y: cy + 66, pixels: [-20, -12, -4, 4, 12, 20], size: 6 },
      { y: cy + 73, pixels: [-16, -6, 4, 14], size: 5 },
      { y: cy + 79, pixels: [-12, 0, 10], size: 4 },
      { y: cy + 84, pixels: [-6, 6], size: 3 },
    ];
    g.fillStyle(0x2d1b69, 0.8);
    pixRows.forEach((row) => {
      row.pixels.forEach((px) => {
        g.fillRect(px - row.size / 2, row.y, row.size, row.size);
      });
    });
    // scattered dissolve pixels below
    g.fillStyle(0x4c1d95, 0.5);
    [
      [-18, cy + 90],
      [-5, cy + 88],
      [8, cy + 92],
      [18, cy + 87],
    ].forEach(([px, py]) => {
      g.fillRect(px, py as number, 3, 3);
    });

    // ── Eyes — faint red glow in hood shadow ────────────────────────────────
    this.eyeLeft = new Phaser.GameObjects.Arc(
      this.scene,
      cx - 5,
      cy + 2,
      3,
      0,
      360,
      false,
      0xdc2626,
      0.7,
    );
    this.eyeRight = new Phaser.GameObjects.Arc(
      this.scene,
      cx + 5,
      cy + 2,
      3,
      0,
      360,
      false,
      0xdc2626,
      0.7,
    );

    // Eye pulse
    this.scene.tweens.add({
      targets: [this.eyeLeft, this.eyeRight],
      alpha: { from: 0.3, to: 0.9 },
      duration: 1400,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // ── Floating animation (wraith hovers up & down) ─────────────────────────
    this.scene.tweens.add({
      targets: this,
      y: this.y - 14,
      duration: 2200,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Draw progressive cracks on the wraith based on weakness level.
   *
   * @param weakness - 0 to 1, where 1 is fully cracked
   */
  private drawCracks(weakness: number): void {
    this.cracksGraphics.clear();

    if (weakness <= 0) return;

    const offsetX = -40;
    const offsetY = -60;

    this.cracksGraphics.lineStyle(2, 0xffffff, 0.7);

    // Crack 1 (appears at 25% weakness)
    if (weakness >= 0.25) {
      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 25, offsetY + 40);
      this.cracksGraphics.lineTo(offsetX + 20, offsetY + 60);
      this.cracksGraphics.lineTo(offsetX + 15, offsetY + 75);
      this.cracksGraphics.strokePath();
    }

    // Crack 2 (appears at 50% weakness)
    if (weakness >= 0.5) {
      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 55, offsetY + 40);
      this.cracksGraphics.lineTo(offsetX + 60, offsetY + 60);
      this.cracksGraphics.lineTo(offsetX + 65, offsetY + 75);
      this.cracksGraphics.strokePath();
    }

    // Crack 3 (appears at 75% weakness)
    if (weakness >= 0.75) {
      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 40, offsetY + 45);
      this.cracksGraphics.lineTo(offsetX + 40, offsetY + 70);
      this.cracksGraphics.lineTo(offsetX + 35, offsetY + 85);
      this.cracksGraphics.strokePath();

      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 40, offsetY + 70);
      this.cracksGraphics.lineTo(offsetX + 45, offsetY + 85);
      this.cracksGraphics.strokePath();
    }

    // Additional shatter lines at full weakness
    if (weakness >= 1.0) {
      this.cracksGraphics.lineStyle(1, 0xffffff, 0.5);
      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 30, offsetY + 50);
      this.cracksGraphics.lineTo(offsetX + 50, offsetY + 55);
      this.cracksGraphics.strokePath();

      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 25, offsetY + 70);
      this.cracksGraphics.lineTo(offsetX + 55, offsetY + 65);
      this.cracksGraphics.strokePath();
    }
  }

  /**
   * Draw "Unfinished Golem" - a blocky stone figure with glowing cracks.
   */
  private drawUnfinishedGolem(): void {
    const g = this.bossGraphics;
    const offsetX = -45;
    const offsetY = -70;

    g.fillStyle(0x52525b, 1); // Dark stone

    // Head (blocky)
    g.fillRect(offsetX + 30, offsetY + 0, 30, 25);

    // Torso (massive)
    g.fillRect(offsetX + 10, offsetY + 30, 70, 50);

    // Arms (asymmetrical)
    g.fillRect(offsetX + 0, offsetY + 35, 15, 60);
    g.fillRect(offsetX + 75, offsetY + 35, 15, 40);

    // Glowing core
    const core = new Phaser.GameObjects.Arc(
      this.scene,
      offsetX + 45,
      offsetY + 50,
      8,
      0,
      360,
      false,
      0xef4444,
      1,
    );
    this.add(core);
    this.scene.tweens.add({
      targets: core,
      scale: 1.5,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Draw "Collapse Specter" - a drifting phantom with trailing energy.
   */
  private drawCollapseSpecter(): void {
    const g = this.bossGraphics;
    const offsetX = -40;
    const offsetY = -60;

    g.fillStyle(0x312e81, 0.6); // Deep indigo translucent

    // Phantom head
    g.fillCircle(offsetX + 40, offsetY + 20, 18);

    // Tattered cloak
    g.beginPath();
    g.moveTo(offsetX + 40, offsetY + 0);
    g.lineTo(offsetX + 10, offsetY + 100);
    g.lineTo(offsetX + 70, offsetY + 100);
    g.closePath();
    g.fillPath();

    // Floating hands
    g.fillCircle(offsetX + 5, offsetY + 50, 10);
    g.fillCircle(offsetX + 75, offsetY + 50, 10);

    this.scene.tweens.add({
      targets: this,
      y: this.y + 10,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /**
   * Draw "Advocate of Comfortable Lies" — Stage 3 (Validation).
   * A smooth, suited politician-like figure with a painted smile mask,
   * holding a glowing scroll of false promises.
   */
  private drawAdvocateOfComfortableLies(): void {
    const g = this.bossGraphics;
    const cx = 0;
    const cy = 0;

    // ── Body — charcoal suit ──────────────────────────────────────────────────
    g.fillStyle(0x1c1c2e, 1);
    g.beginPath();
    g.moveTo(cx - 22, cy + 10);
    g.lineTo(cx + 22, cy + 10);
    g.lineTo(cx + 30, cy + 80);
    g.lineTo(cx - 30, cy + 80);
    g.closePath();
    g.fillPath();

    // ── Lapels — white ────────────────────────────────────────────────────────
    g.fillStyle(0xf0f0f0, 0.9);
    g.beginPath();
    g.moveTo(cx - 8, cy + 10);
    g.lineTo(cx, cy + 30);
    g.lineTo(cx - 18, cy + 30);
    g.closePath();
    g.fillPath();
    g.beginPath();
    g.moveTo(cx + 8, cy + 10);
    g.lineTo(cx, cy + 30);
    g.lineTo(cx + 18, cy + 30);
    g.closePath();
    g.fillPath();

    // ── Tie — crimson ─────────────────────────────────────────────────────────
    g.fillStyle(0xdc2626, 1);
    g.beginPath();
    g.moveTo(cx - 4, cy + 28);
    g.lineTo(cx + 4, cy + 28);
    g.lineTo(cx + 6, cy + 60);
    g.lineTo(cx, cy + 68);
    g.lineTo(cx - 6, cy + 60);
    g.closePath();
    g.fillPath();

    // ── Head — round, pale ────────────────────────────────────────────────────
    g.fillStyle(0xe8d5b0, 1);
    g.fillCircle(cx, cy - 8, 20);

    // ── Smile mask — painted green grin ──────────────────────────────────────
    g.fillStyle(0x16a34a, 0.85);
    g.fillEllipse(cx, cy - 4, 28, 16);
    g.fillStyle(0x1c1c2e, 1);
    g.fillEllipse(cx, cy - 10, 24, 10);
    // teeth
    g.fillStyle(0xffffff, 1);
    for (let i = -3; i <= 3; i++) {
      g.fillRect(cx + i * 3 - 1, cy - 6, 2, 5);
    }

    // ── Scroll in hand — glowing green ───────────────────────────────────────
    g.fillStyle(0x14532d, 1);
    g.fillRect(cx + 28, cy + 30, 14, 30);
    g.fillStyle(0x4ade80, 0.6);
    g.fillRect(cx + 30, cy + 34, 10, 22);
    // scroll ends
    g.fillStyle(0x78350f, 1);
    g.fillEllipse(cx + 35, cy + 30, 14, 6);
    g.fillEllipse(cx + 35, cy + 60, 14, 6);

    // ── Glowing eye of deceit ─────────────────────────────────────────────────
    this.eyeLeft = new Phaser.GameObjects.Arc(this.scene, cx - 7, cy - 10, 4, 0, 360, false, 0x4ade80, 1);
    this.eyeRight = new Phaser.GameObjects.Arc(this.scene, cx + 7, cy - 10, 4, 0, 360, false, 0x4ade80, 1);
    this.eyeLeft.setStrokeStyle(1, 0x16a34a, 1);
    this.eyeRight.setStrokeStyle(1, 0x16a34a, 1);

    // Sinister eye pulse
    this.scene.tweens.add({
      targets: [this.eyeLeft, this.eyeRight],
      alpha: { from: 0.4, to: 1.0 },
      scaleX: { from: 0.8, to: 1.2 },
      scaleY: { from: 0.8, to: 1.2 },
      duration: 1200,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Sway animation — persuasive bobbing
    this.scene.tweens.add({
      targets: this,
      angle: { from: -3, to: 3 },
      duration: 2400,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Draw "Harbourmaster of Hesitation" — Stage 6 (Launch).
   * A bloated sea-captain silhouette anchored in doubt, with a rusted anchor
   * chain binding its legs. Teal/seafoam palette matches harbour biome.
   */
  private drawHarbourmasterOfHesitation(): void {
    const g = this.bossGraphics;
    const cx = 0;
    const cy = 0;

    // ── Heavy coat — dark teal ────────────────────────────────────────────────
    g.fillStyle(0x0d3d3a, 1);
    g.beginPath();
    g.moveTo(cx - 28, cy + 5);
    g.lineTo(cx + 28, cy + 5);
    g.lineTo(cx + 36, cy + 85);
    g.lineTo(cx - 36, cy + 85);
    g.closePath();
    g.fillPath();

    // ── Coat highlights — ocean sheen ─────────────────────────────────────────
    g.fillStyle(0x1a6b3a, 0.4);
    g.fillRect(cx - 28, cy + 5, 10, 80);
    g.fillRect(cx + 18, cy + 5, 10, 80);

    // ── Epaulettes ───────────────────────────────────────────────────────────
    g.fillStyle(0x38bdf8, 0.8);
    g.fillEllipse(cx - 26, cy + 8, 18, 10);
    g.fillEllipse(cx + 26, cy + 8, 18, 10);

    // ── Head — wide captain's hat ─────────────────────────────────────────────
    g.fillStyle(0x083344, 1);
    g.fillCircle(cx, cy - 10, 22);
    // Hat brim
    g.fillRect(cx - 32, cy - 22, 64, 8);
    // Hat top
    g.fillRect(cx - 18, cy - 50, 36, 30);
    // Gold band
    g.fillStyle(0xfbbf24, 1);
    g.fillRect(cx - 18, cy - 24, 36, 4);

    // ── Face — sunken, uncertain ──────────────────────────────────────────────
    g.fillStyle(0x7f8c8d, 1);
    g.fillEllipse(cx, cy - 8, 30, 22);
    // Drooping brow lines
    g.lineStyle(2, 0x2c3e50, 1);
    g.beginPath(); g.moveTo(cx - 12, cy - 14); g.lineTo(cx - 4, cy - 10); g.strokePath();
    g.beginPath(); g.moveTo(cx + 12, cy - 14); g.lineTo(cx + 4, cy - 10); g.strokePath();

    // ── Anchor chain at legs ──────────────────────────────────────────────────
    g.fillStyle(0x78716c, 0.9);
    for (let i = 0; i < 5; i++) {
      g.fillEllipse(cx, cy + 88 + i * 12, 16, 8);
      g.fillEllipse(cx, cy + 94 + i * 12, 8, 16);
    }
    // Anchor
    g.fillStyle(0x57534e, 1);
    g.fillRect(cx - 2, cy + 148, 4, 20);
    g.fillRect(cx - 14, cy + 155, 28, 4);
    g.fillCircle(cx, cy + 148, 5);

    // ── Eyes — watery blue ────────────────────────────────────────────────────
    this.eyeLeft = new Phaser.GameObjects.Arc(this.scene, cx - 8, cy - 8, 4, 0, 360, false, 0x38bdf8, 0.9);
    this.eyeRight = new Phaser.GameObjects.Arc(this.scene, cx + 8, cy - 8, 4, 0, 360, false, 0x38bdf8, 0.9);

    // Wavering eye glow — indecisive flicker
    this.scene.tweens.add({
      targets: [this.eyeLeft, this.eyeRight],
      alpha: { from: 0.3, to: 0.9 },
      duration: 2000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Rocking on anchor chain
    this.scene.tweens.add({
      targets: this,
      y: this.y + 8,
      duration: 2800,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Draw "Babel Merchant" — Stage 7 (Iteration).
   * A chaotic figure wrapped in scrolling ticker-tape and mismatched data
   * readouts. Purple/lavender crossroads palette.
   */
  private drawBabelMerchant(): void {
    const g = this.bossGraphics;
    const cx = 0;
    const cy = 0;

    // ── Robes — layered mismatched strips ────────────────────────────────────
    const robeColors = [0x7c3aed, 0xa78bfa, 0x4c1d95, 0x6d28d9];
    for (let i = 0; i < 4; i++) {
      g.fillStyle(robeColors[i], 0.85);
      g.fillRect(cx - 26 + i * 3, cy + 10 + i * 5, 52 - i * 6, 70 - i * 4);
    }

    // ── Body core ────────────────────────────────────────────────────────────
    g.fillStyle(0x13082a, 1);
    g.fillRect(cx - 20, cy + 12, 40, 65);

    // ── Ticker-tape scrolls ───────────────────────────────────────────────────
    g.fillStyle(0xf0f0f0, 0.7);
    g.fillRect(cx - 35, cy + 20, 12, 50);
    g.fillRect(cx + 23, cy + 15, 12, 55);
    // Lines on scrolls (data)
    g.lineStyle(1, 0x7c3aed, 0.6);
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(cx - 34, cy + 25 + i * 7);
      g.lineTo(cx - 24, cy + 25 + i * 7);
      g.strokePath();
      g.beginPath();
      g.moveTo(cx + 24, cy + 20 + i * 7);
      g.lineTo(cx + 34, cy + 20 + i * 7);
      g.strokePath();
    }

    // ── Head — faceless orb with runes ───────────────────────────────────────
    g.fillStyle(0x4c1d95, 1);
    g.fillCircle(cx, cy - 5, 22);
    g.fillStyle(0xa78bfa, 0.5);
    g.fillCircle(cx, cy - 5, 14);
    // Rune marks
    g.lineStyle(2, 0xfbbf24, 0.9);
    g.beginPath(); g.moveTo(cx - 10, cy - 14); g.lineTo(cx - 6, cy - 4); g.lineTo(cx - 14, cy - 4); g.strokePath();
    g.beginPath(); g.moveTo(cx + 10, cy - 14); g.lineTo(cx + 6, cy - 4); g.lineTo(cx + 14, cy - 4); g.strokePath();

    // ── Floating coins / tokens around body ───────────────────────────────────
    const coinPositions = [[-42, cy + 35], [42, cy + 40], [-38, cy + 55], [40, cy + 60]];
    coinPositions.forEach(([px, py]) => {
      g.fillStyle(0xfbbf24, 0.8);
      g.fillCircle(cx + px, py as number, 5);
      g.lineStyle(1, 0x92400e, 1);
      g.strokeCircle(cx + px, py as number, 5);
    });

    // ── Eyes — dual-color mismatched ─────────────────────────────────────────
    this.eyeLeft = new Phaser.GameObjects.Arc(this.scene, cx - 8, cy - 5, 5, 0, 360, false, 0xfbbf24, 1);
    this.eyeRight = new Phaser.GameObjects.Arc(this.scene, cx + 8, cy - 5, 5, 0, 360, false, 0xf87171, 1);

    // Mismatched eye pulse — alternating
    this.scene.tweens.add({
      targets: this.eyeLeft,
      alpha: { from: 0.3, to: 1 },
      scaleX: { from: 0.8, to: 1.4 },
      scaleY: { from: 0.8, to: 1.4 },
      duration: 900,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
    this.scene.tweens.add({
      targets: this.eyeRight,
      alpha: { from: 1, to: 0.3 },
      scaleX: { from: 1.4, to: 0.8 },
      scaleY: { from: 1.4, to: 0.8 },
      duration: 900,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Chaotic spin-bob
    this.scene.tweens.add({
      targets: this,
      y: this.y - 12,
      angle: { from: -4, to: 4 },
      duration: 1600,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Draw "Iron Bureaucrat" — Stage 8 (Scale).
   * A towering angular iron golem in a business suit with stamping fists,
   * golden seals, and crushing bureaucratic machinery. Citadel gold palette.
   */
  private drawIronBureaucrat(): void {
    const g = this.bossGraphics;
    const cx = 0;
    const cy = 0;

    // ── Iron frame torso — angular & riveted ──────────────────────────────────
    g.fillStyle(0x292524, 1); // stone-iron
    g.fillRect(cx - 30, cy + 5, 60, 75);

    // Rivets
    g.fillStyle(0x78716c, 1);
    [[-26, 10], [24, 10], [-26, 30], [24, 30], [-26, 60], [24, 60]].forEach(([rx, ry]) => {
      g.fillCircle(cx + rx, cy + ry, 3);
    });

    // ── Suit jacket overlay ───────────────────────────────────────────────────
    g.fillStyle(0x1c1917, 0.9);
    g.fillRect(cx - 24, cy + 8, 20, 68);
    g.fillRect(cx + 4, cy + 8, 20, 68);
    // Lapel gold trim
    g.lineStyle(2, 0xfbbf24, 1);
    g.beginPath(); g.moveTo(cx - 8, cy + 8); g.lineTo(cx, cy + 28); g.strokePath();
    g.beginPath(); g.moveTo(cx + 8, cy + 8); g.lineTo(cx, cy + 28); g.strokePath();

    // ── Stamp arm (right) ─────────────────────────────────────────────────────
    g.fillStyle(0x44403c, 1);
    g.fillRect(cx + 30, cy + 10, 16, 50);
    // Stamp head — red ink
    g.fillStyle(0xdc2626, 1);
    g.fillRect(cx + 28, cy + 55, 20, 12);
    g.fillStyle(0xfca5a5, 0.6);
    g.fillRect(cx + 30, cy + 57, 16, 6);

    // ── Heavy left fist ───────────────────────────────────────────────────────
    g.fillStyle(0x44403c, 1);
    g.fillRect(cx - 46, cy + 15, 16, 45);
    g.fillRect(cx - 52, cy + 42, 22, 18); // fist block

    // ── Iron head — square plated ─────────────────────────────────────────────
    g.fillStyle(0x1c1917, 1);
    g.fillRect(cx - 22, cy - 40, 44, 48);
    // Face plate
    g.fillStyle(0x292524, 1);
    g.fillRect(cx - 16, cy - 34, 32, 36);
    // Gold seal on forehead
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(cx, cy - 20, 8);
    g.fillStyle(0x92400e, 1);
    g.fillCircle(cx, cy - 20, 4);

    // ── Eyes — red data scanners ──────────────────────────────────────────────
    this.eyeLeft = new Phaser.GameObjects.Arc(this.scene, cx - 8, cy - 12, 5, 0, 360, false, 0xdc2626, 1);
    this.eyeRight = new Phaser.GameObjects.Arc(this.scene, cx + 8, cy - 12, 5, 0, 360, false, 0xdc2626, 1);
    this.eyeLeft.setStrokeStyle(2, 0xfca5a5, 0.8);
    this.eyeRight.setStrokeStyle(2, 0xfca5a5, 0.8);

    // Slow menacing scan flicker
    this.scene.tweens.add({
      targets: [this.eyeLeft, this.eyeRight],
      alpha: { from: 0.5, to: 1.0 },
      duration: 600,
      ease: "Stepped",
      easeParams: [3],
      yoyo: true,
      repeat: -1,
    });

    // Stamp arm pump animation
    this.scene.tweens.add({
      targets: this.bossGraphics,
      y: { from: 0, to: 8 },
      duration: 800,
      ease: "Bounce.easeOut",
      yoyo: true,
      repeat: -1,
      repeatDelay: 1200,
    });
  }

  /**
   * Draws an upgraded generic boss with high-fidelity details.
   */
  private drawGenericBoss(): void {
    const g = this.bossGraphics;
    const offsetX = -50;
    const offsetY = -60;

    // Silhouette
    g.fillStyle(0x18181b, 1.0); // Zinc 900
    g.fillRect(offsetX + 15, offsetY + 10, 70, 100);
    g.fillStyle(0x27272a, 1.0); // Zinc 800
    g.fillRect(offsetX + 25, offsetY + 0, 50, 20);

    // Internal Red Rune (Glow)
    g.fillStyle(0xdc2626, 0.4);
    g.fillRect(offsetX + 48, offsetY + 30, 4, 40);

    this.eyeLeft = new Phaser.GameObjects.Arc(
      this.scene,
      offsetX + 40,
      offsetY + 15,
      4,
      0,
      360,
      false,
      0xff0000,
      1,
    );
    this.eyeRight = new Phaser.GameObjects.Arc(
      this.scene,
      offsetX + 60,
      offsetY + 15,
      4,
      0,
      360,
      false,
      0xff0000,
      1,
    );
  }

  /**
   * Returns display name for this boss type
   */
  private getBossName(): string {
    // Boss type is already the display name (PRD-compliant naming)
    return this.bossType;
  }
}
