import * as Phaser from "phaser";
import {
  BaseCheckpointAnimation,
  type AnimationConfig,
} from "./BaseCheckpointAnimation";

/**
 * Ward Placement Animation
 * Used for Stage 6 checkpoint crossings
 *
 * Standard: Persona holds ward stone, plants it, energy ripple, boundary appears
 * Gold: Ornate carvings, dual wards, connecting barrier, larger boundary, golden shimmer
 */
export class WardPlacementAnimation extends BaseCheckpointAnimation {
  private personaGraphics!: Phaser.GameObjects.Graphics;
  private wardStone1Graphics!: Phaser.GameObjects.Graphics;
  private wardStone2Graphics?: Phaser.GameObjects.Graphics;
  private boundaryGraphics!: Phaser.GameObjects.Graphics;
  private energyRipples: Phaser.GameObjects.Graphics[] = [];
  private barrierGraphics?: Phaser.GameObjects.Graphics;
  private shieldGraphics!: Phaser.GameObjects.Graphics;
  private glowGraphics!: Phaser.GameObjects.Graphics;
  private particles: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene, config: AnimationConfig) {
    super(scene, config);
  }

  create(): void {
    // Create all visual elements
    this.createGlowBase();
    this.createPersona();
    this.createWardStone1();
    this.createBoundary();
    this.createShield();

    if (this.config.variant === "gold") {
      this.createWardStone2();
      this.createBarrier();
    }

    // Start animation sequence
    this.playAnimation();
  }

  private createGlowBase(): void {
    this.glowGraphics = this.scene.add.graphics();
    this.glowGraphics.setAlpha(0);
    this.container.add(this.glowGraphics);
  }

  private createPersona(): void {
    this.personaGraphics = this.scene.add.graphics();
    this.personaGraphics.setAlpha(0);
    this.container.add(this.personaGraphics);

    const personaColor = this.config.variant === "gold" ? 0xffd700 : 0x6366f1;

    // Simple persona figure
    // Head
    this.personaGraphics.fillStyle(personaColor, 0.9);
    this.personaGraphics.fillCircle(0, -50, 10);

    // Body
    this.personaGraphics.fillRect(-7, -40, 14, 25);

    // Arms extended (holding stone)
    this.personaGraphics.fillTriangle(-7, -35, -15, -20, -7, -15);
    this.personaGraphics.fillTriangle(7, -35, 15, -20, 7, -15);

    // Legs
    this.personaGraphics.fillRect(-7, -15, 6, 18);
    this.personaGraphics.fillRect(1, -15, 6, 18);

    // Outline
    this.personaGraphics.lineStyle(2, personaColor, 1);
    this.personaGraphics.strokeCircle(0, -50, 10);
    this.personaGraphics.strokeRect(-7, -40, 14, 25);
  }

  private createWardStone1(): void {
    this.wardStone1Graphics = this.scene.add.graphics();
    this.wardStone1Graphics.setAlpha(0);
    this.wardStone1Graphics.setScale(0);
    this.container.add(this.wardStone1Graphics);

    const stoneColor = this.config.variant === "gold" ? 0xa89968 : 0x708090;
    const runeColor = this.config.variant === "gold" ? 0xffd700 : 0x4169e1;

    // Main ward stone (obelisk shape)
    this.wardStone1Graphics.fillStyle(stoneColor, 0.95);
    this.wardStone1Graphics.fillRect(-10, -25, 20, 30);

    // Pointed top
    this.wardStone1Graphics.beginPath();
    this.wardStone1Graphics.moveTo(-10, -25);
    this.wardStone1Graphics.lineTo(0, -35);
    this.wardStone1Graphics.lineTo(10, -25);
    this.wardStone1Graphics.closePath();
    this.wardStone1Graphics.fillPath();

    // Stone edge
    this.wardStone1Graphics.lineStyle(2, 0x404050, 1);
    this.wardStone1Graphics.strokeRect(-10, -25, 20, 30);
    this.wardStone1Graphics.beginPath();
    this.wardStone1Graphics.moveTo(-10, -25);
    this.wardStone1Graphics.lineTo(0, -35);
    this.wardStone1Graphics.lineTo(10, -25);
    this.wardStone1Graphics.strokePath();

    // Basic rune symbol
    this.wardStone1Graphics.lineStyle(2, runeColor, 1);
    this.wardStone1Graphics.strokeCircle(0, -10, 6);
    this.wardStone1Graphics.lineBetween(0, -16, 0, -4);
    this.wardStone1Graphics.lineBetween(-6, -10, 6, -10);

    // Position in persona's hands initially
    this.wardStone1Graphics.setPosition(0, -30);
  }

  private createWardStone2(): void {
    this.wardStone2Graphics = this.scene.add.graphics();
    this.wardStone2Graphics.setAlpha(0);
    this.wardStone2Graphics.setScale(0);
    this.container.add(this.wardStone2Graphics);

    const stoneColor = 0xa89968;
    const runeColor = 0xffd700;

    // Second ward stone (mirrored)
    this.wardStone2Graphics.fillStyle(stoneColor, 0.95);
    this.wardStone2Graphics.fillRect(-10, -25, 20, 30);

    // Pointed top
    this.wardStone2Graphics.beginPath();
    this.wardStone2Graphics.moveTo(-10, -25);
    this.wardStone2Graphics.lineTo(0, -35);
    this.wardStone2Graphics.lineTo(10, -25);
    this.wardStone2Graphics.closePath();
    this.wardStone2Graphics.fillPath();

    // Edge
    this.wardStone2Graphics.lineStyle(2, 0x404050, 1);
    this.wardStone2Graphics.strokeRect(-10, -25, 20, 30);
    this.wardStone2Graphics.beginPath();
    this.wardStone2Graphics.moveTo(-10, -25);
    this.wardStone2Graphics.lineTo(0, -35);
    this.wardStone2Graphics.lineTo(10, -25);
    this.wardStone2Graphics.strokePath();

    // Ornate rune (more complex for second stone)
    this.wardStone2Graphics.lineStyle(2, runeColor, 1);
    this.wardStone2Graphics.strokeCircle(0, -10, 6);
    this.wardStone2Graphics.lineBetween(0, -16, 0, -4);
    this.wardStone2Graphics.lineBetween(-6, -10, 6, -10);
    this.wardStone2Graphics.lineBetween(-4, -14, 4, -6);
    this.wardStone2Graphics.lineBetween(-4, -6, 4, -14);

    // Position opposite side
    this.wardStone2Graphics.setPosition(60, 0);
  }

  private createBoundary(): void {
    this.boundaryGraphics = this.scene.add.graphics();
    this.boundaryGraphics.setAlpha(0);
    this.container.add(this.boundaryGraphics);

    const boundaryColor = this.config.variant === "gold" ? 0xffd700 : 0x6366f1;
    const radius = this.config.variant === "gold" ? 70 : 50;

    // Protected boundary circle
    this.boundaryGraphics.lineStyle(3, boundaryColor, 0.6);
    this.boundaryGraphics.strokeCircle(0, 0, radius);

    // Inner boundary
    this.boundaryGraphics.lineStyle(2, boundaryColor, 0.4);
    this.boundaryGraphics.strokeCircle(0, 0, radius - 10);

    // Boundary markers (cardinal directions)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x1 = Math.cos(angle) * (radius - 5);
      const y1 = Math.sin(angle) * (radius - 5);
      const x2 = Math.cos(angle) * (radius + 5);
      const y2 = Math.sin(angle) * (radius + 5);

      this.boundaryGraphics.lineBetween(x1, y1, x2, y2);
    }
  }

  private createBarrier(): void {
    this.barrierGraphics = this.scene.add.graphics();
    this.barrierGraphics.setAlpha(0);
    this.container.add(this.barrierGraphics);

    // Energy barrier connecting two ward stones
    this.barrierGraphics.lineStyle(4, 0xffd700, 0.7);

    // Draw energy beam with wave effect
    this.barrierGraphics.beginPath();
    this.barrierGraphics.moveTo(-10, 0);

    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = -10 + t * 70;
      const wave = Math.sin(t * Math.PI * 4) * 3;
      const y = wave;
      this.barrierGraphics.lineTo(x, y);
    }
    this.barrierGraphics.strokePath();

    // Parallel beam
    this.barrierGraphics.beginPath();
    this.barrierGraphics.moveTo(-10, -5);
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = -10 + t * 70;
      const wave = Math.sin(t * Math.PI * 4 + Math.PI / 4) * 3;
      const y = -5 + wave;
      this.barrierGraphics.lineTo(x, y);
    }
    this.barrierGraphics.strokePath();
  }

  private createShield(): void {
    this.shieldGraphics = this.scene.add.graphics();
    this.shieldGraphics.setAlpha(0);
    this.container.add(this.shieldGraphics);

    const shieldColor = this.config.variant === "gold" ? 0xffd700 : 0x6366f1;
    const radius = this.config.variant === "gold" ? 65 : 45;

    // Shield shimmer layer
    this.shieldGraphics.fillStyle(shieldColor, 0.2);
    this.shieldGraphics.fillCircle(0, 0, radius);

    this.shieldGraphics.fillStyle(shieldColor, 0.15);
    this.shieldGraphics.fillCircle(0, 0, radius + 10);

    this.shieldGraphics.lineStyle(2, shieldColor, 0.5);
    this.shieldGraphics.strokeCircle(0, 0, radius);
  }

  private playAnimation(): void {
    // Step 1: Ward stone appears in persona's hand (0.2s)
    this.scene.tweens.add({
      targets: this.personaGraphics,
      alpha: { from: 0, to: 1 },
      duration: 200,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.animateStoneAppear();
      },
    });
  }

  private animateStoneAppear(): void {
    // Ward stone materializes
    this.scene.tweens.add({
      targets: this.wardStone1Graphics,
      alpha: { from: 0, to: 1 },
      scale: { from: 0, to: 0.6 },
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        // Sparkle effect on appearance
        this.createSparkles(0, -30, 8);
        this.animatePlanting();
      },
    });
  }

  private animatePlanting(): void {
    // Step 2: Persona plants stone (0.4s)
    // Move stone down and scale up
    this.scene.tweens.add({
      targets: this.wardStone1Graphics,
      y: { from: -30, to: 0 },
      scale: { from: 0.6, to: 1 },
      duration: 400,
      ease: "Cubic.easeIn",
      onComplete: () => {
        // Stone impacts ground
        this.createImpactEffect();

        if (this.config.variant === "gold") {
          this.animateOrnateGrowth();
        } else {
          this.animateEnergyRipple();
        }
      },
    });

    // Persona bends down
    this.scene.tweens.add({
      targets: this.personaGraphics,
      scaleY: { from: 1, to: 0.85 },
      duration: 300,
      ease: "Sine.easeInOut",
      yoyo: true,
    });
  }

  private createImpactEffect(): void {
    // Ground impact particles
    for (let i = 0; i < 12; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(0x8b7355, 0.7);
      particle.fillCircle(0, 0, 2 + Math.random() * 2);
      particle.setPosition(this.container.x, this.container.y);
      this.container.add(particle);
      this.particles.push(particle);

      const angle = (i / 12) * Math.PI * 2;
      const distance = 15 + Math.random() * 15;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 400,
        ease: "Cubic.easeOut",
        onComplete: () => particle.destroy(),
      });
    }
  }

  private animateOrnateGrowth(): void {
    // Gold variant: Ward stone grows ornate carvings
    this.wardStone1Graphics.clear();

    const stoneColor = 0xa89968;
    const runeColor = 0xffd700;

    // Enhanced ward stone with carvings
    this.wardStone1Graphics.fillStyle(stoneColor, 0.95);
    this.wardStone1Graphics.fillRect(-10, -25, 20, 30);

    // Pointed top
    this.wardStone1Graphics.beginPath();
    this.wardStone1Graphics.moveTo(-10, -25);
    this.wardStone1Graphics.lineTo(0, -35);
    this.wardStone1Graphics.lineTo(10, -25);
    this.wardStone1Graphics.closePath();
    this.wardStone1Graphics.fillPath();

    // Ornate edge with gold trim
    this.wardStone1Graphics.lineStyle(3, 0xffd700, 1);
    this.wardStone1Graphics.strokeRect(-10, -25, 20, 30);
    this.wardStone1Graphics.beginPath();
    this.wardStone1Graphics.moveTo(-10, -25);
    this.wardStone1Graphics.lineTo(0, -35);
    this.wardStone1Graphics.lineTo(10, -25);
    this.wardStone1Graphics.strokePath();

    // Complex rune patterns
    this.wardStone1Graphics.lineStyle(2, runeColor, 1);
    this.wardStone1Graphics.strokeCircle(0, -18, 6);
    this.wardStone1Graphics.lineBetween(0, -24, 0, -12);
    this.wardStone1Graphics.lineBetween(-6, -18, 6, -18);
    this.wardStone1Graphics.lineBetween(-4, -22, 4, -14);
    this.wardStone1Graphics.lineBetween(-4, -14, 4, -22);

    this.wardStone1Graphics.strokeCircle(0, -2, 5);
    this.wardStone1Graphics.lineBetween(-3, -2, 3, -2);

    // Vertical decorative lines
    for (let i = 0; i < 3; i++) {
      const x = -6 + i * 6;
      this.wardStone1Graphics.lineBetween(x, -8, x, 2);
    }

    // Flash effect on growth
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffd700, 0.8);
    flash.fillRect(-15, -40, 30, 45);
    flash.setPosition(this.container.x, this.container.y);
    this.container.add(flash);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });

    this.scene.time.delayedCall(200, () => {
      this.animateSecondWard();
    });
  }

  private animateSecondWard(): void {
    if (!this.wardStone2Graphics) return;

    // Second ward stone materializes opposite side
    this.scene.tweens.add({
      targets: this.wardStone2Graphics,
      alpha: { from: 0, to: 1 },
      scale: { from: 0, to: 1 },
      duration: 500,
      ease: "Back.easeOut",
      onComplete: () => {
        this.createSparkles(60, 0, 12);
        this.animateEnergyConnection();
      },
    });

    // Second impact
    this.scene.time.delayedCall(400, () => {
      this.createSecondImpactEffect();
    });
  }

  private createSecondImpactEffect(): void {
    for (let i = 0; i < 10; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(0x8b7355, 0.7);
      particle.fillCircle(0, 0, 2);
      particle.setPosition(this.container.x + 60, this.container.y);
      this.container.add(particle);
      this.particles.push(particle);

      const angle = (i / 10) * Math.PI * 2;
      const distance = 12 + Math.random() * 12;
      const targetX = 60 + Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 350,
        ease: "Cubic.easeOut",
        onComplete: () => particle.destroy(),
      });
    }
  }

  private animateEnergyConnection(): void {
    if (!this.barrierGraphics) return;

    // Energy connects both stones (barrier effect)
    this.scene.tweens.add({
      targets: this.barrierGraphics,
      alpha: { from: 0, to: 0.8 },
      duration: 600,
      ease: "Sine.easeOut",
      onComplete: () => {
        // Pulsing barrier
        this.scene.tweens.add({
          targets: this.barrierGraphics,
          alpha: { from: 0.8, to: 0.5 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });

        this.animateEnergyRipple();
      },
    });

    // Energy particles along barrier
    for (let i = 0; i < 15; i++) {
      this.scene.time.delayedCall(i * 40, () => {
        const particle = this.scene.add.graphics();
        particle.fillStyle(0xffd700, 1);
        particle.fillCircle(0, 0, 3);

        const t = i / 15;
        const x = -10 + t * 70;
        const wave = Math.sin(t * Math.PI * 4) * 3;

        particle.setPosition(this.container.x + x, this.container.y + wave);
        this.container.add(particle);
        this.particles.push(particle);

        this.scene.tweens.add({
          targets: particle,
          alpha: { from: 1, to: 0 },
          scale: { from: 1, to: 0 },
          duration: 400,
          ease: "Cubic.easeOut",
          onComplete: () => particle.destroy(),
        });
      });
    }
  }

  private animateEnergyRipple(): void {
    // Step 3: Energy ripple expands from stone (0.6s)
    const numRipples = this.config.variant === "gold" ? 5 : 3;

    for (let i = 0; i < numRipples; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        const ripple = this.scene.add.graphics();
        const rippleColor =
          this.config.variant === "gold" ? 0xffd700 : 0x6366f1;

        ripple.lineStyle(3, rippleColor, 0.8);
        ripple.strokeCircle(0, 0, 0);
        ripple.setPosition(this.container.x, this.container.y);
        this.container.add(ripple);
        this.energyRipples.push(ripple);

        const maxRadius = this.config.variant === "gold" ? 80 : 60;

        this.scene.tweens.add({
          targets: ripple,
          scaleX: { from: 0.1, to: maxRadius / 10 },
          scaleY: { from: 0.1, to: maxRadius / 10 },
          alpha: { from: 0.8, to: 0 },
          duration: 600,
          ease: "Cubic.easeOut",
          onComplete: () => ripple.destroy(),
        });

        // Redraw as circle grows
        this.scene.tweens.addCounter({
          from: 0,
          to: maxRadius,
          duration: 600,
          ease: "Cubic.easeOut",
          onUpdate: (t) => {
            const radius = t.getValue() as number;
            ripple.clear();
            ripple.lineStyle(3, rippleColor, 0.8 - (radius / maxRadius) * 0.8);
            ripple.strokeCircle(0, 0, radius);
          },
        });
      });
    }

    this.scene.time.delayedCall(numRipples * 150 + 200, () => {
      this.animateBoundaryReveal();
    });
  }

  private animateBoundaryReveal(): void {
    // Step 4: Protected boundary area becomes visible
    this.scene.tweens.add({
      targets: this.boundaryGraphics,
      alpha: { from: 0, to: 0.8 },
      duration: 500,
      ease: "Sine.easeOut",
      onComplete: () => {
        // Boundary pulses
        this.scene.tweens.add({
          targets: this.boundaryGraphics,
          scaleX: { from: 1, to: 1.05 },
          scaleY: { from: 1, to: 1.05 },
          alpha: { from: 0.8, to: 0.6 },
          duration: 600,
          yoyo: true,
          repeat: 1,
          ease: "Sine.easeInOut",
        });

        this.animateAreaClear();
      },
    });
  }

  private animateAreaClear(): void {
    // Step 5: Nearby area clears (visual effect)
    // Create outward clearing particles
    for (let i = 0; i < 24; i++) {
      const particle = this.scene.add.graphics();
      const particleColor =
        this.config.variant === "gold" ? 0xffd700 : 0x6366f1;

      particle.fillStyle(particleColor, 0.6);
      particle.fillCircle(0, 0, 3);
      particle.setPosition(this.container.x, this.container.y);
      this.container.add(particle);
      this.particles.push(particle);

      const angle = (i / 24) * Math.PI * 2;
      const distance = 40 + Math.random() * 30;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 800,
        delay: Math.random() * 200,
        ease: "Cubic.easeOut",
        onComplete: () => particle.destroy(),
      });
    }

    // Persona fades out
    this.scene.tweens.add({
      targets: this.personaGraphics,
      alpha: 0,
      duration: 400,
      delay: 200,
    });

    this.scene.time.delayedCall(400, () => {
      this.animateShieldShimmer();
    });
  }

  private animateShieldShimmer(): void {
    // Final shield shimmer on protected area
    this.scene.tweens.add({
      targets: this.shieldGraphics,
      alpha: { from: 0, to: 0.7 },
      duration: 500,
      ease: "Sine.easeOut",
    });

    // Rotating shimmer effect
    this.scene.tweens.add({
      targets: this.shieldGraphics,
      rotation: { from: 0, to: Math.PI * 2 },
      duration: 3000,
      repeat: -1,
      ease: "Linear",
    });

    // Pulsing shimmer
    this.scene.tweens.add({
      targets: this.shieldGraphics,
      alpha: { from: 0.7, to: 0.4 },
      scaleX: { from: 1, to: 1.08 },
      scaleY: { from: 1, to: 1.08 },
      duration: 800,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.animateCheckpointLit();
      },
    });

    // Golden variant gets additional sparkles
    if (this.config.variant === "gold") {
      for (let i = 0; i < 16; i++) {
        this.scene.time.delayedCall(i * 50, () => {
          const angle = (i / 16) * Math.PI * 2;
          const radius = 60;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          this.createSparkles(x, y, 3);
        });
      }
    }
  }

  private createSparkles(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const sparkle = this.scene.add.graphics();
      sparkle.fillStyle(0xffd700, 1);
      sparkle.fillCircle(0, 0, 2);
      sparkle.setPosition(this.container.x + x, this.container.y + y);
      sparkle.setAlpha(0);
      this.container.add(sparkle);
      this.particles.push(sparkle);

      const offsetX = (Math.random() - 0.5) * 15;
      const offsetY = (Math.random() - 0.5) * 15;

      this.scene.tweens.add({
        targets: sparkle,
        alpha: { from: 0, to: 1 },
        x: x + offsetX,
        y: y + offsetY,
        scale: { from: 0, to: 1 },
        duration: 300,
        delay: i * 50,
        ease: "Back.easeOut",
        onComplete: () => {
          this.scene.tweens.add({
            targets: sparkle,
            alpha: 0,
            duration: 300,
            onComplete: () => sparkle.destroy(),
          });
        },
      });
    }
  }

  private animateCheckpointLit(): void {
    // Final checkpoint lit glow
    const glowColor = this.config.variant === "gold" ? 0xffd700 : 0x6366f1;

    this.glowGraphics.clear();
    this.glowGraphics.fillStyle(glowColor, 0.4);
    this.glowGraphics.fillCircle(0, 0, 55);
    this.glowGraphics.fillStyle(glowColor, 0.25);
    this.glowGraphics.fillCircle(0, 0, 75);
    this.glowGraphics.fillStyle(glowColor, 0.15);
    this.glowGraphics.fillCircle(0, 0, 95);

    this.scene.tweens.add({
      targets: this.glowGraphics,
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: "Sine.easeOut",
    });

    // Final pulse
    this.scene.tweens.add({
      targets: this.glowGraphics,
      scaleX: { from: 1, to: 1.15 },
      scaleY: { from: 1, to: 1.15 },
      alpha: { from: 1, to: 0.7 },
      duration: 700,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.complete();
      },
    });
  }

  destroy(): void {
    this.particles.forEach((particle) => {
      if (particle && particle.scene) particle.destroy();
    });
    this.energyRipples.forEach((ripple) => {
      if (ripple && ripple.scene) ripple.destroy();
    });
    super.destroy();
  }
}
