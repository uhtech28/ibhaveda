import * as Phaser from "phaser";
import {
  BaseCheckpointAnimation,
  type AnimationConfig,
} from "./BaseCheckpointAnimation";

/**
 * Bridge Repair Animation
 * Used for Stage 5 checkpoint crossings
 *
 * Standard: Bridge planks appear, persona walks across
 * Gold: Bridge transforms wood→stone→marble, gilded chains, plaque, sparkles
 */
export class BridgeRepairAnimation extends BaseCheckpointAnimation {
  private bridgeBaseGraphics!: Phaser.GameObjects.Graphics;
  private plankGraphics: Phaser.GameObjects.Graphics[] = [];
  private ropeGraphics!: Phaser.GameObjects.Graphics;
  private personaGraphics!: Phaser.GameObjects.Graphics;
  private plaqueGraphics?: Phaser.GameObjects.Graphics;
  private glowGraphics!: Phaser.GameObjects.Graphics;
  private sparkles: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene, config: AnimationConfig) {
    super(scene, config);
  }

  create(): void {
    // Create all visual elements
    this.createGlowBase();
    this.createBridgeBase();
    this.createPlanks();
    this.createRopes();
    this.createPersona();

    if (this.config.variant === "gold") {
      this.createPlaque();
    }

    // Start animation sequence
    this.playAnimation();
  }

  private createGlowBase(): void {
    this.glowGraphics = this.scene.add.graphics();
    this.glowGraphics.setAlpha(0);
    this.container.add(this.glowGraphics);
  }

  private createBridgeBase(): void {
    this.bridgeBaseGraphics = this.scene.add.graphics();
    this.container.add(this.bridgeBaseGraphics);

    // Base structure (support beams)
    const baseColor = 0x4a3728;

    // Left support
    this.bridgeBaseGraphics.fillStyle(baseColor, 0.8);
    this.bridgeBaseGraphics.fillRect(-80, -10, 15, 30);
    this.bridgeBaseGraphics.lineStyle(2, 0x2a1718, 1);
    this.bridgeBaseGraphics.strokeRect(-80, -10, 15, 30);

    // Right support
    this.bridgeBaseGraphics.fillRect(65, -10, 15, 30);
    this.bridgeBaseGraphics.strokeRect(65, -10, 15, 30);

    // Main beam underneath
    this.bridgeBaseGraphics.fillStyle(baseColor, 0.6);
    this.bridgeBaseGraphics.fillRect(-70, 8, 140, 8);
    this.bridgeBaseGraphics.strokeRect(-70, 8, 140, 8);

    this.bridgeBaseGraphics.setAlpha(0);
  }

  private createPlanks(): void {
    const numPlanks = 8;
    const plankWidth = 16;
    const plankHeight = 18;
    const spacing = 2;
    const startX = -66;

    for (let i = 0; i < numPlanks; i++) {
      const plank = this.scene.add.graphics();
      plank.setAlpha(0);
      plank.setScale(0);

      const xPos = startX + i * (plankWidth + spacing);

      // Draw wooden plank
      plank.fillStyle(0x8b7355, 0.9);
      plank.fillRect(xPos, -5, plankWidth, plankHeight);

      // Wood grain lines
      plank.lineStyle(1, 0x6b5344, 0.6);
      plank.lineBetween(xPos + 2, -3, xPos + 2, 11);
      plank.lineBetween(xPos + plankWidth - 2, -3, xPos + plankWidth - 2, 11);

      // Edge outline
      plank.lineStyle(2, 0x5a4334, 0.8);
      plank.strokeRect(xPos, -5, plankWidth, plankHeight);

      this.plankGraphics.push(plank);
      this.container.add(plank);
    }
  }

  private createRopes(): void {
    this.ropeGraphics = this.scene.add.graphics();
    this.ropeGraphics.setAlpha(0);
    this.container.add(this.ropeGraphics);

    const ropeColor = 0x8b7355;

    // Top rope (railing)
    this.ropeGraphics.lineStyle(3, ropeColor, 0.8);
    this.ropeGraphics.beginPath();
    this.ropeGraphics.moveTo(-70, -8);

    // Create sagging rope effect
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const x = -70 + t * 140;
      const sag = Math.sin(t * Math.PI) * 3; // Slight sag in middle
      const y = -8 + sag;
      this.ropeGraphics.lineTo(x, y);
    }
    this.ropeGraphics.strokePath();

    // Bottom rope
    this.ropeGraphics.beginPath();
    this.ropeGraphics.moveTo(-70, 10);
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const x = -70 + t * 140;
      const sag = Math.sin(t * Math.PI) * 3;
      const y = 10 + sag;
      this.ropeGraphics.lineTo(x, y);
    }
    this.ropeGraphics.strokePath();

    // Vertical rope supports
    for (let i = 0; i <= 4; i++) {
      const x = -70 + i * 35;
      this.ropeGraphics.lineBetween(x, -8, x, 10);
    }
  }

  private createPersona(): void {
    this.personaGraphics = this.scene.add.graphics();
    this.personaGraphics.setAlpha(0);
    this.container.add(this.personaGraphics);

    const personaColor = this.config.variant === "gold" ? 0xffd700 : 0x4169e1;

    // Simple walking persona
    // Head
    this.personaGraphics.fillStyle(personaColor, 0.8);
    this.personaGraphics.fillCircle(-70, -15, 8);

    // Body
    this.personaGraphics.fillRect(-76, -7, 12, 20);

    // Legs (walking pose)
    this.personaGraphics.fillRect(-76, 13, 5, 12);
    this.personaGraphics.fillRect(-71, 13, 5, 12);

    // Arms
    this.personaGraphics.fillRect(-79, -5, 3, 12);
    this.personaGraphics.fillRect(-64, -5, 3, 12);

    // Outline
    this.personaGraphics.lineStyle(1, personaColor, 1);
    this.personaGraphics.strokeCircle(-70, -15, 8);
    this.personaGraphics.strokeRect(-76, -7, 12, 20);
  }

  private createPlaque(): void {
    this.plaqueGraphics = this.scene.add.graphics();
    this.plaqueGraphics.setAlpha(0);
    this.plaqueGraphics.setScale(0);
    this.container.add(this.plaqueGraphics);

    // Decorative plaque at bridge crest
    this.plaqueGraphics.fillStyle(0xffd700, 1);
    this.plaqueGraphics.fillRect(-15, -25, 30, 15);

    // Border
    this.plaqueGraphics.lineStyle(2, 0xffed4e, 1);
    this.plaqueGraphics.strokeRect(-15, -25, 30, 15);

    // Inner decoration
    this.plaqueGraphics.lineStyle(1, 0xffed4e, 0.8);
    this.plaqueGraphics.strokeRect(-13, -23, 26, 11);

    // Ornamental symbol in center
    this.plaqueGraphics.fillStyle(0x8b4513, 0.8);
    this.plaqueGraphics.fillCircle(0, -17, 4);
    this.plaqueGraphics.lineStyle(1, 0x8b4513, 1);
    this.plaqueGraphics.strokeCircle(0, -17, 6);
  }

  private playAnimation(): void {
    // Step 1: Bridge base appears
    this.scene.tweens.add({
      targets: this.bridgeBaseGraphics,
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.animatePlanks();
      },
    });
  }

  private animatePlanks(): void {
    // Step 2: Bridge planks appear one by one (0.8s total)
    const plankDelay = 100; // 100ms between each plank

    this.plankGraphics.forEach((plank, index) => {
      this.scene.time.delayedCall(index * plankDelay, () => {
        // Plank drops into place
        this.scene.tweens.add({
          targets: plank,
          alpha: { from: 0, to: 1 },
          scale: { from: 0, to: 1 },
          y: { from: -20, to: 0 },
          duration: 200,
          ease: "Bounce.easeOut",
        });

        // Settling dust particles
        for (let i = 0; i < 3; i++) {
          const dust = this.scene.add.graphics();
          dust.fillStyle(0x8b7355, 0.6);
          dust.fillCircle(0, 0, 2);

          const plankX = -66 + index * 18;
          dust.setPosition(
            this.container.x + plankX + Math.random() * 10,
            this.container.y + 5,
          );
          this.container.add(dust);

          this.scene.tweens.add({
            targets: dust,
            y: dust.y + 10 + Math.random() * 10,
            x: dust.x + (Math.random() - 0.5) * 15,
            alpha: 0,
            duration: 300,
            ease: "Cubic.easeOut",
            onComplete: () => dust.destroy(),
          });
        }
      });
    });

    // After all planks are placed
    this.scene.time.delayedCall(
      this.plankGraphics.length * plankDelay + 200,
      () => {
        this.animateRopes();
      },
    );
  }

  private animateRopes(): void {
    // Ropes appear
    this.scene.tweens.add({
      targets: this.ropeGraphics,
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: "Sine.easeIn",
      onComplete: () => {
        if (this.config.variant === "gold") {
          this.animateBridgeTransformation();
        } else {
          this.animatePersonaWalk();
        }
      },
    });
  }

  private animateBridgeTransformation(): void {
    // Gold variant: Bridge transforms wood → stone → marble
    // Stage 1: Wood to Stone (0.5s)
    this.scene.time.delayedCall(200, () => {
      this.plankGraphics.forEach((plank, index) => {
        this.scene.time.delayedCall(index * 60, () => {
          plank.clear();

          const xPos = -66 + index * 18;

          // Stone planks
          plank.fillStyle(0x708090, 0.95);
          plank.fillRect(xPos, -5, 16, 18);

          // Stone texture
          plank.lineStyle(1, 0x505060, 0.7);
          plank.lineBetween(xPos + 4, -3, xPos + 4, 11);
          plank.lineBetween(xPos + 12, -3, xPos + 12, 11);

          plank.lineStyle(2, 0x404050, 0.8);
          plank.strokeRect(xPos, -5, 16, 18);

          // Flash effect
          const flash = this.scene.add.graphics();
          flash.fillStyle(0xffffff, 0.6);
          flash.fillRect(xPos, -5, 16, 18);
          this.container.add(flash);

          this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy(),
          });
        });
      });
    });

    // Stage 2: Stone to Marble (0.5s)
    this.scene.time.delayedCall(700, () => {
      this.plankGraphics.forEach((plank, index) => {
        this.scene.time.delayedCall(index * 60, () => {
          plank.clear();

          const xPos = -66 + index * 18;

          // Marble planks
          plank.fillStyle(0xf5f5f5, 0.98);
          plank.fillRect(xPos, -5, 16, 18);

          // Marble veins
          plank.lineStyle(1, 0xd3d3d3, 0.6);
          const veinY1 = -3 + Math.random() * 6;
          const veinY2 = 3 + Math.random() * 6;
          plank.lineBetween(xPos + 2, veinY1, xPos + 14, veinY1 + 3);
          plank.lineBetween(xPos + 3, veinY2, xPos + 13, veinY2 - 2);

          // Gold trim edges
          plank.lineStyle(2, 0xffd700, 1);
          plank.strokeRect(xPos, -5, 16, 18);

          // Transform flash
          const flash = this.scene.add.graphics();
          flash.fillStyle(0xffd700, 0.7);
          flash.fillRect(xPos, -5, 16, 18);
          this.container.add(flash);

          this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 300,
            onComplete: () => flash.destroy(),
          });
        });
      });
    });

    this.scene.time.delayedCall(1200, () => {
      this.animateGildedChains();
    });
  }

  private animateGildedChains(): void {
    // Rope railings transform to gilded chains
    this.ropeGraphics.clear();

    const chainColor = 0xffd700;

    // Top gilded chain
    this.ropeGraphics.lineStyle(4, chainColor, 0.9);
    this.ropeGraphics.beginPath();
    this.ropeGraphics.moveTo(-70, -8);

    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const x = -70 + t * 140;
      const sag = Math.sin(t * Math.PI) * 3;
      const y = -8 + sag;
      this.ropeGraphics.lineTo(x, y);
    }
    this.ropeGraphics.strokePath();

    // Bottom chain
    this.ropeGraphics.beginPath();
    this.ropeGraphics.moveTo(-70, 10);
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const x = -70 + t * 140;
      const sag = Math.sin(t * Math.PI) * 3;
      const y = 10 + sag;
      this.ropeGraphics.lineTo(x, y);
    }
    this.ropeGraphics.strokePath();

    // Chain links (decorative)
    this.ropeGraphics.lineStyle(2, 0xffed4e, 1);
    for (let i = 0; i <= 7; i++) {
      const x = -70 + i * 20;
      this.ropeGraphics.strokeCircle(x, -8, 3);
      this.ropeGraphics.strokeCircle(x, 10, 3);
    }

    // Shimmer effect along chains
    for (let i = 0; i < 12; i++) {
      const shimmer = this.scene.add.graphics();
      shimmer.fillStyle(0xffffff, 0.9);
      shimmer.fillCircle(0, 0, 2);

      const x = -70 + (i / 12) * 140;
      const y = -8 + Math.sin((i / 12) * Math.PI) * 3;

      shimmer.setPosition(this.container.x + x, this.container.y + y);
      this.container.add(shimmer);
      this.sparkles.push(shimmer);

      this.scene.tweens.add({
        targets: shimmer,
        alpha: 0,
        scale: 2,
        duration: 400,
        delay: i * 40,
        ease: "Cubic.easeOut",
        onComplete: () => shimmer.destroy(),
      });
    }

    this.animatePlaqueAppear();
  }

  private animatePlaqueAppear(): void {
    if (!this.plaqueGraphics) return;

    // Decorative plaque materializes at bridge crest
    this.scene.tweens.add({
      targets: this.plaqueGraphics,
      alpha: { from: 0, to: 1 },
      scale: { from: 0, to: 1 },
      duration: 400,
      ease: "Back.easeOut",
      onComplete: () => {
        this.animateBridgeSparkle();
      },
    });

    // Plaque appearance flash
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffd700, 0.8);
    flash.fillCircle(0, -17, 20);
    this.container.add(flash);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 500,
      ease: "Cubic.easeOut",
      onComplete: () => flash.destroy(),
    });
  }

  private animateBridgeSparkle(): void {
    // Bridge sparkles with completion
    for (let i = 0; i < 20; i++) {
      const sparkle = this.scene.add.graphics();
      sparkle.fillStyle(0xffd700, 1);
      sparkle.fillCircle(0, 0, 2 + Math.random() * 2);

      const x = -60 + Math.random() * 120;
      const y = -10 + Math.random() * 20;

      sparkle.setPosition(this.container.x + x, this.container.y + y);
      sparkle.setAlpha(0);
      this.container.add(sparkle);
      this.sparkles.push(sparkle);

      this.scene.tweens.add({
        targets: sparkle,
        alpha: { from: 0, to: 1 },
        scale: { from: 0, to: 1 },
        duration: 300,
        delay: Math.random() * 400,
        ease: "Back.easeOut",
        onComplete: () => {
          this.scene.tweens.add({
            targets: sparkle,
            alpha: 0,
            y: sparkle.y - 20,
            duration: 500,
            ease: "Cubic.easeOut",
            onComplete: () => sparkle.destroy(),
          });
        },
      });
    }

    this.scene.time.delayedCall(600, () => {
      this.animatePersonaWalk();
    });
  }

  private animatePersonaWalk(): void {
    // Step 3: Persona walks across bridge (0.5s)
    this.scene.tweens.add({
      targets: this.personaGraphics,
      alpha: { from: 0, to: 1 },
      duration: 200,
      ease: "Sine.easeIn",
      onComplete: () => {
        // Walk animation
        this.scene.tweens.add({
          targets: this.personaGraphics,
          x: { from: 0, to: 140 },
          duration: 500,
          ease: "Linear",
          onUpdate: () => {
            // Bobbing walk effect
            const walkProgress = this.personaGraphics.x / 140 || 0;
            const bobAmount = Math.sin(walkProgress * Math.PI * 4) * 2;
            this.personaGraphics.y = bobAmount;
          },
          onComplete: () => {
            // Fade out
            this.scene.tweens.add({
              targets: this.personaGraphics,
              alpha: 0,
              duration: 200,
              onComplete: () => {
                this.animateBridgeComplete();
              },
            });
          },
        });
      },
    });
  }

  private animateBridgeComplete(): void {
    // Final glow effect
    const glowColor = this.config.variant === "gold" ? 0xffd700 : 0x4169e1;

    this.glowGraphics.clear();
    this.glowGraphics.fillStyle(glowColor, 0.3);
    this.glowGraphics.fillRect(-75, -15, 150, 35);
    this.glowGraphics.fillStyle(glowColor, 0.15);
    this.glowGraphics.fillRect(-85, -20, 170, 45);

    this.scene.tweens.add({
      targets: this.glowGraphics,
      alpha: { from: 0, to: 1 },
      duration: 400,
      ease: "Sine.easeOut",
    });

    // Pulse effect
    this.scene.tweens.add({
      targets: this.glowGraphics,
      alpha: { from: 1, to: 0.6 },
      duration: 500,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.complete();
      },
    });
  }

  destroy(): void {
    this.sparkles.forEach((sparkle) => {
      if (sparkle && sparkle.scene) sparkle.destroy();
    });
    super.destroy();
  }
}
