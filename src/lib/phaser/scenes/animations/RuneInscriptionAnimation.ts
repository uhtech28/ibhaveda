import * as Phaser from "phaser";
import {
  BaseCheckpointAnimation,
  type AnimationConfig,
} from "./BaseCheckpointAnimation";

/**
 * Rune Inscription Animation
 * Used for Stage 4 checkpoint crossings
 *
 * Standard: Stone tablet rises, 2 rune lines inscribe, pulses, sinks
 * Gold: 3 rune lines, tablet levitates, border inscription, remains visible
 */
export class RuneInscriptionAnimation extends BaseCheckpointAnimation {
  private tabletGraphics!: Phaser.GameObjects.Graphics;
  private runeLines: Phaser.GameObjects.Graphics[] = [];
  private borderInscription?: Phaser.GameObjects.Graphics;
  private glowGraphics!: Phaser.GameObjects.Graphics;
  private inkParticles: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene, config: AnimationConfig) {
    super(scene, config);
  }

  create(): void {
    // Create all visual elements
    this.createGlowBase();
    this.createTablet();
    this.createRuneLines();

    if (this.config.variant === "gold") {
      this.createBorderInscription();
    }

    // Start animation sequence
    this.playAnimation();
  }

  private createGlowBase(): void {
    this.glowGraphics = this.scene.add.graphics();
    this.glowGraphics.setAlpha(0);
    this.container.add(this.glowGraphics);
  }

  private createTablet(): void {
    this.tabletGraphics = this.scene.add.graphics();
    this.container.add(this.tabletGraphics);

    const isGold = this.config.variant === "gold";
    const stoneColor = isGold ? 0xa89968 : 0x8b8b8b;
    const edgeColor = isGold ? 0xffd700 : 0x5a5a5a;

    // Main tablet body (rectangular stone)
    this.tabletGraphics.fillStyle(stoneColor, 1);
    this.tabletGraphics.fillRect(-40, -60, 80, 100);

    // Stone texture/shading
    this.tabletGraphics.fillStyle(0x000000, 0.1);
    this.tabletGraphics.fillRect(-40, -60, 80, 5);
    this.tabletGraphics.fillRect(-40, -60, 5, 100);

    // Edge highlight
    this.tabletGraphics.lineStyle(3, edgeColor, 0.8);
    this.tabletGraphics.strokeRect(-40, -60, 80, 100);

    // Inner frame for runes
    this.tabletGraphics.lineStyle(2, edgeColor, 0.6);
    this.tabletGraphics.strokeRect(-35, -55, 70, 90);

    // Decorative corner marks
    const cornerSize = 8;
    this.tabletGraphics.lineStyle(2, edgeColor, 0.7);
    // Top-left
    this.tabletGraphics.lineBetween(-35, -55, -35 + cornerSize, -55);
    this.tabletGraphics.lineBetween(-35, -55, -35, -55 + cornerSize);
    // Top-right
    this.tabletGraphics.lineBetween(35, -55, 35 - cornerSize, -55);
    this.tabletGraphics.lineBetween(35, -55, 35, -55 + cornerSize);
    // Bottom-left
    this.tabletGraphics.lineBetween(-35, 35, -35 + cornerSize, 35);
    this.tabletGraphics.lineBetween(-35, 35, -35, 35 - cornerSize);
    // Bottom-right
    this.tabletGraphics.lineBetween(35, 35, 35 - cornerSize, 35);
    this.tabletGraphics.lineBetween(35, 35, 35, 35 - cornerSize);

    // Start position (below ground)
    this.tabletGraphics.setPosition(0, 80);
    this.tabletGraphics.setAlpha(0.8);
  }

  private createRuneLines(): void {
    const numLines = this.config.variant === "gold" ? 3 : 2;

    for (let i = 0; i < numLines; i++) {
      const line = this.scene.add.graphics();
      line.setAlpha(0);
      this.container.add(line);
      this.runeLines.push(line);
    }
  }

  private createBorderInscription(): void {
    this.borderInscription = this.scene.add.graphics();
    this.borderInscription.setAlpha(0);
    this.container.add(this.borderInscription);

    // Draw border runes (decorative symbols around edge)
    this.borderInscription.lineStyle(1, 0xffd700, 1);

    // Top border symbols
    for (let i = 0; i < 4; i++) {
      const x = -30 + i * 20;
      this.borderInscription.fillStyle(0xffd700, 0.8);
      // Small decorative marks
      this.borderInscription.fillCircle(x, -58, 2);
    }

    // Side borders
    for (let i = 0; i < 5; i++) {
      const y = -45 + i * 20;
      this.borderInscription.fillCircle(-38, y, 2);
      this.borderInscription.fillCircle(38, y, 2);
    }

    // Bottom border
    for (let i = 0; i < 4; i++) {
      const x = -30 + i * 20;
      this.borderInscription.fillCircle(x, 38, 2);
    }
  }

  private playAnimation(): void {
    // Step 1: Tablet rises from ground (0.3s)
    this.scene.tweens.add({
      targets: this.tabletGraphics,
      y: { from: 80, to: 0 },
      alpha: { from: 0.8, to: 1 },
      duration: 300,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.animateFirstRuneLine();
      },
    });

    // Ground dust effect
    for (let i = 0; i < 8; i++) {
      const dust = this.scene.add.graphics();
      dust.fillStyle(0x8b7355, 0.6);
      dust.fillCircle(0, 0, 3 + Math.random() * 3);
      dust.setPosition(
        this.container.x + (Math.random() - 0.5) * 60,
        this.container.y + 40,
      );
      this.container.add(dust);

      this.scene.tweens.add({
        targets: dust,
        y: dust.y + 20 + Math.random() * 20,
        x: dust.x + (Math.random() - 0.5) * 30,
        alpha: 0,
        duration: 400,
        ease: "Cubic.easeOut",
        onComplete: () => dust.destroy(),
      });
    }
  }

  private animateFirstRuneLine(): void {
    // Step 2: First rune line inscribes (0.4s)
    const line = this.runeLines[0];
    if (!line) return;

    const runeColor = this.config.variant === "gold" ? 0xffd700 : 0x4169e1;

    // Draw rune symbols as they "inscribe"
    const runeText = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ"];
    const currentX = -30;

    runeText.forEach((rune, index) => {
      this.scene.time.delayedCall(index * 80, () => {
        line.fillStyle(runeColor, 1);
        line.lineStyle(2, runeColor, 0.8);

        // Draw mystical rune symbol
        const x = currentX + index * 15;
        const y = -30;

        // Glow effect
        line.fillStyle(runeColor, 0.3);
        line.fillCircle(x, y, 8);

        // Main symbol
        line.fillStyle(runeColor, 1);
        line.fillCircle(x, y, 4);
        line.lineBetween(x - 5, y - 5, x + 5, y + 5);
        line.lineBetween(x - 5, y + 5, x + 5, y - 5);

        // Ink particles
        this.createInkParticles(x, y, runeColor);
      });
    });

    line.setAlpha(1);

    this.scene.time.delayedCall(400, () => {
      this.animateSecondRuneLine();
    });
  }

  private animateSecondRuneLine(): void {
    // Step 3: Second rune line inscribes (0.4s)
    const line = this.runeLines[1];
    if (!line) return;

    const runeColor = this.config.variant === "gold" ? 0xffd700 : 0x4169e1;

    const runeText = ["ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ"];
    const currentX = -30;

    runeText.forEach((rune, index) => {
      this.scene.time.delayedCall(index * 80, () => {
        line.fillStyle(runeColor, 1);
        line.lineStyle(2, runeColor, 0.8);

        const x = currentX + index * 15;
        const y = 0;

        // Glow
        line.fillStyle(runeColor, 0.3);
        line.fillCircle(x, y, 8);

        // Symbol (different pattern)
        line.fillStyle(runeColor, 1);
        line.fillRect(x - 3, y - 5, 6, 10);
        line.lineBetween(x, y - 5, x, y + 5);

        this.createInkParticles(x, y, runeColor);
      });
    });

    line.setAlpha(1);

    this.scene.time.delayedCall(400, () => {
      if (this.config.variant === "gold") {
        this.animateThirdRuneLine();
      } else {
        this.animateTabletPulse();
      }
    });
  }

  private animateThirdRuneLine(): void {
    // Gold variant: Third rune line (0.4s)
    const line = this.runeLines[2];
    if (!line) return;

    const runeColor = 0xffd700;

    const runeText = ["ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ"];
    const currentX = -30;

    runeText.forEach((rune, index) => {
      this.scene.time.delayedCall(index * 80, () => {
        line.fillStyle(runeColor, 1);
        line.lineStyle(2, runeColor, 0.8);

        const x = currentX + index * 15;
        const y = 30;

        // Glow
        line.fillStyle(runeColor, 0.3);
        line.fillCircle(x, y, 8);

        // Symbol (ornate pattern)
        line.fillStyle(runeColor, 1);
        line.fillCircle(x, y, 5);
        line.lineBetween(x - 6, y, x + 6, y);
        line.lineBetween(x, y - 6, x, y + 6);

        this.createInkParticles(x, y, runeColor);
      });
    });

    line.setAlpha(1);

    this.scene.time.delayedCall(400, () => {
      this.animateTabletLevitation();
    });
  }

  private createInkParticles(x: number, y: number, color: number): void {
    for (let i = 0; i < 4; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 2);
      particle.setPosition(this.container.x + x, this.container.y + y);
      this.container.add(particle);
      this.inkParticles.push(particle);

      const angle = Math.random() * Math.PI * 2;
      const distance = 10 + Math.random() * 10;
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 300,
        ease: "Cubic.easeOut",
        onComplete: () => particle.destroy(),
      });
    }
  }

  private animateTabletPulse(): void {
    // Step 4: Tablet pulses with energy (0.4s)
    const runeColor = this.config.variant === "gold" ? 0xffd700 : 0x4169e1;

    // Energy pulse rings
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        const ring = this.scene.add.graphics();
        ring.lineStyle(2, runeColor, 0.8);
        ring.strokeRect(-40, -60, 80, 100);
        ring.setPosition(this.container.x, this.container.y);
        this.container.add(ring);

        this.scene.tweens.add({
          targets: ring,
          scaleX: { from: 1, to: 1.3 },
          scaleY: { from: 1, to: 1.3 },
          alpha: { from: 0.8, to: 0 },
          duration: 400,
          ease: "Cubic.easeOut",
          onComplete: () => ring.destroy(),
        });
      });
    }

    // Glow from runes
    this.glowGraphics.clear();
    this.glowGraphics.fillStyle(runeColor, 0.4);
    this.glowGraphics.fillRect(-40, -60, 80, 100);

    this.scene.tweens.add({
      targets: this.glowGraphics,
      alpha: { from: 0, to: 0.6 },
      duration: 300,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.animateTabletSink();
      },
    });
  }

  private animateTabletLevitation(): void {
    // Gold variant: Tablet rises and hovers (0.5s)
    this.scene.tweens.add({
      targets: this.tabletGraphics,
      y: { from: 0, to: -20 },
      duration: 500,
      ease: "Cubic.easeOut",
      onComplete: () => {
        // Hovering float animation
        this.scene.tweens.add({
          targets: this.tabletGraphics,
          y: { from: -20, to: -15 },
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });

        this.animateBorderInscription();
      },
    });

    // Levitation glow underneath
    this.glowGraphics.clear();
    this.glowGraphics.fillStyle(0xffd700, 0.5);
    this.glowGraphics.fillEllipse(0, 20, 80, 20);

    this.scene.tweens.add({
      targets: this.glowGraphics,
      alpha: { from: 0, to: 0.7 },
      duration: 500,
      ease: "Sine.easeOut",
    });
  }

  private animateBorderInscription(): void {
    if (!this.borderInscription) return;

    // Secondary inscription appears around border
    this.scene.tweens.add({
      targets: this.borderInscription,
      alpha: { from: 0, to: 1 },
      duration: 600,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.animateGoldGlow();
      },
    });

    // Border sparkle effect
    for (let i = 0; i < 16; i++) {
      const sparkle = this.scene.add.graphics();
      sparkle.fillStyle(0xffd700, 1);
      sparkle.fillCircle(0, 0, 2);

      const angle = (i / 16) * Math.PI * 2;
      const x = Math.cos(angle) * 42;
      const y = Math.sin(angle) * 65;

      sparkle.setPosition(this.container.x + x, this.container.y + y);
      this.container.add(sparkle);

      this.scene.tweens.add({
        targets: sparkle,
        alpha: { from: 0, to: 1 },
        scale: { from: 0, to: 1 },
        duration: 200,
        delay: i * 40,
        ease: "Back.easeOut",
        onComplete: () => {
          this.scene.tweens.add({
            targets: sparkle,
            alpha: 0,
            duration: 400,
            delay: 200,
            onComplete: () => sparkle.destroy(),
          });
        },
      });
    }
  }

  private animateGoldGlow(): void {
    // Gold glow emanates from all three runes
    this.glowGraphics.clear();
    this.glowGraphics.fillStyle(0xffd700, 0.3);
    this.glowGraphics.fillRect(-45, -65, 90, 110);
    this.glowGraphics.fillStyle(0xffd700, 0.2);
    this.glowGraphics.fillRect(-50, -70, 100, 120);

    this.scene.tweens.add({
      targets: this.glowGraphics,
      alpha: { from: 0.7, to: 0.9 },
      duration: 600,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.complete();
      },
    });

    // All rune lines pulse
    this.runeLines.forEach((line, index) => {
      this.scene.tweens.add({
        targets: line,
        alpha: { from: 1, to: 0.6 },
        duration: 400,
        delay: index * 100,
        yoyo: true,
        repeat: 2,
        ease: "Sine.easeInOut",
      });
    });
  }

  private animateTabletSink(): void {
    // Step 5: Tablet sinks back into ground (0.4s)
    this.scene.tweens.add({
      targets: this.tabletGraphics,
      y: { from: 0, to: 80 },
      alpha: { from: 1, to: 0.8 },
      duration: 400,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.animateCheckpointGlow();
      },
    });

    // Ground settling dust
    for (let i = 0; i < 6; i++) {
      const dust = this.scene.add.graphics();
      dust.fillStyle(0x8b7355, 0.5);
      dust.fillCircle(0, 0, 2 + Math.random() * 2);
      dust.setPosition(
        this.container.x + (Math.random() - 0.5) * 50,
        this.container.y + 40,
      );
      this.container.add(dust);

      this.scene.tweens.add({
        targets: dust,
        y: dust.y + 10,
        alpha: 0,
        duration: 300,
        ease: "Cubic.easeOut",
        onComplete: () => dust.destroy(),
      });
    }
  }

  private animateCheckpointGlow(): void {
    // Final checkpoint lit glow
    const runeColor = this.config.variant === "gold" ? 0xffd700 : 0x4169e1;

    this.glowGraphics.clear();
    this.glowGraphics.fillStyle(runeColor, 0.4);
    this.glowGraphics.fillCircle(0, 0, 50);
    this.glowGraphics.fillStyle(runeColor, 0.2);
    this.glowGraphics.fillCircle(0, 0, 70);

    this.scene.tweens.add({
      targets: this.glowGraphics,
      alpha: { from: 0, to: 1 },
      duration: 400,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.complete();
      },
    });
  }

  destroy(): void {
    this.inkParticles.forEach((particle) => {
      if (particle && particle.scene) particle.destroy();
    });
    super.destroy();
  }
}
