import * as Phaser from "phaser";
import {
  BaseCheckpointAnimation,
  type AnimationConfig,
} from "./BaseCheckpointAnimation";

/**
 * Seal Break Animation
 * Used for Stages 3 & 8 checkpoint crossings
 *
 * Standard: Seal cracks, shatters, gate opens, persona walks through
 * Gold: Seal explodes in gold burst, gilded arch, crown appears, sustained glow
 */
export class SealBreakAnimation extends BaseCheckpointAnimation {
  private sealGraphics!: Phaser.GameObjects.Graphics;
  private crackLines: Phaser.GameObjects.Graphics[] = [];
  private gateGraphics!: Phaser.GameObjects.Graphics;
  private personaGraphics!: Phaser.GameObjects.Graphics;
  private crownGraphics?: Phaser.GameObjects.Graphics;
  private glowGraphics!: Phaser.GameObjects.Graphics;
  private shatterPieces: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene, config: AnimationConfig) {
    super(scene, config);
  }

  create(): void {
    // Create all visual elements
    this.createGlowBase();
    this.createGate();
    this.createSeal();
    this.createCracks();
    this.createPersona();

    if (this.config.variant === "gold") {
      this.createCrown();
    }

    // Start animation sequence
    this.playAnimation();
  }

  private createGlowBase(): void {
    this.glowGraphics = this.scene.add.graphics();
    this.glowGraphics.setAlpha(0);
    this.container.add(this.glowGraphics);

    const glowColor = this.getGlowColor();
    this.glowGraphics.fillStyle(glowColor, 0.3);
    this.glowGraphics.fillCircle(0, 0, 70);
    this.glowGraphics.fillStyle(glowColor, 0.2);
    this.glowGraphics.fillCircle(0, 0, 90);
  }

  private createGate(): void {
    this.gateGraphics = this.scene.add.graphics();
    this.gateGraphics.setAlpha(0);
    this.container.add(this.gateGraphics);

    const isGold = this.config.variant === "gold";
    const gateColor = isGold ? 0x8b7355 : 0x5a4a3a;
    const trimColor = isGold ? 0xffd700 : 0x3a2a1a;

    // Left door
    this.gateGraphics.fillStyle(gateColor, 0.9);
    this.gateGraphics.fillRect(-50, -60, 45, 120);
    this.gateGraphics.lineStyle(2, trimColor, 1);
    this.gateGraphics.strokeRect(-50, -60, 45, 120);

    // Right door
    this.gateGraphics.fillRect(5, -60, 45, 120);
    this.gateGraphics.strokeRect(5, -60, 45, 120);

    // Decorative details
    this.gateGraphics.lineStyle(2, trimColor, 0.8);
    for (let i = 0; i < 3; i++) {
      const y = -40 + i * 40;
      this.gateGraphics.lineBetween(-45, y, -10, y);
      this.gateGraphics.lineBetween(10, y, 45, y);
    }

    // Gold trim for gold variant
    if (isGold) {
      this.gateGraphics.lineStyle(3, 0xffd700, 0.9);
      this.gateGraphics.strokeRect(-50, -60, 45, 120);
      this.gateGraphics.strokeRect(5, -60, 45, 120);
    }
  }

  private createSeal(): void {
    this.sealGraphics = this.scene.add.graphics();
    this.container.add(this.sealGraphics);

    const sealColor = 0x708090; // Stone gray
    const runeColor = this.config.variant === "gold" ? 0xffd700 : 0x4682b4;

    // Stone disc
    this.sealGraphics.fillStyle(0x2f4f4f, 1);
    this.sealGraphics.fillCircle(0, 0, 50);

    this.sealGraphics.fillStyle(sealColor, 0.95);
    this.sealGraphics.fillCircle(0, 0, 45);

    this.sealGraphics.lineStyle(3, 0x1c1c1c, 1);
    this.sealGraphics.strokeCircle(0, 0, 45);

    // Inner rune circle
    this.sealGraphics.lineStyle(2, runeColor, 0.9);
    this.sealGraphics.strokeCircle(0, 0, 35);

    // Rune patterns
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x1 = Math.cos(angle) * 28;
      const y1 = Math.sin(angle) * 28;
      const x2 = Math.cos(angle) * 35;
      const y2 = Math.sin(angle) * 35;
      this.sealGraphics.lineBetween(x1, y1, x2, y2);
    }

    // Center rune symbol
    this.sealGraphics.lineStyle(3, runeColor, 1);
    this.sealGraphics.strokeCircle(0, 0, 8);
    this.sealGraphics.lineBetween(-10, 0, 10, 0);
    this.sealGraphics.lineBetween(0, -10, 0, 10);

    // Start scaled down
    this.sealGraphics.setScale(0);
    this.sealGraphics.setAlpha(0);
  }

  private createCracks(): void {
    for (let i = 0; i < 12; i++) {
      const crack = this.scene.add.graphics();
      crack.setAlpha(0);
      this.container.add(crack);
      this.crackLines.push(crack);
    }
  }

  private createPersona(): void {
    this.personaGraphics = this.scene.add.graphics();
    this.personaGraphics.setAlpha(0);
    this.container.add(this.personaGraphics);

    const personaColor = this.config.variant === "gold" ? 0xffd700 : 0x4169e1;

    // Simple persona silhouette
    // Head
    this.personaGraphics.fillStyle(personaColor, 0.8);
    this.personaGraphics.fillCircle(0, -75, 12);

    // Body
    this.personaGraphics.fillRect(-8, -63, 16, 30);

    // Arms
    this.personaGraphics.fillTriangle(-8, -60, -18, -45, -8, -40);
    this.personaGraphics.fillTriangle(8, -60, 18, -45, 8, -40);

    // Legs
    this.personaGraphics.fillRect(-8, -33, 7, 20);
    this.personaGraphics.fillRect(1, -33, 7, 20);

    // Outline
    this.personaGraphics.lineStyle(2, personaColor, 1);
    this.personaGraphics.strokeCircle(0, -75, 12);
    this.personaGraphics.strokeRect(-8, -63, 16, 30);

    // Position behind gate initially
    this.personaGraphics.setPosition(0, -80);
  }

  private createCrown(): void {
    this.crownGraphics = this.scene.add.graphics();
    this.crownGraphics.setAlpha(0);
    this.crownGraphics.setScale(0);
    this.container.add(this.crownGraphics);

    // Gold crown
    this.crownGraphics.fillStyle(0xffd700, 1);
    this.crownGraphics.lineStyle(2, 0xffed4e, 1);

    // Crown base
    this.crownGraphics.fillRect(-20, -80, 40, 8);
    this.crownGraphics.strokeRect(-20, -80, 40, 8);

    // Crown points
    this.crownGraphics.fillTriangle(-15, -80, -10, -95, -5, -80);
    this.crownGraphics.fillTriangle(-3, -80, 0, -100, 3, -80);
    this.crownGraphics.fillTriangle(5, -80, 10, -95, 15, -80);

    // Jewels
    this.crownGraphics.fillStyle(0xff0000, 1);
    this.crownGraphics.fillCircle(-10, -87, 3);
    this.crownGraphics.fillCircle(0, -90, 4);
    this.crownGraphics.fillCircle(10, -87, 3);
  }

  private playAnimation(): void {
    // Step 1: Seal appears (0.3s)
    this.scene.tweens.add({
      targets: [this.sealGraphics, this.gateGraphics],
      alpha: 1,
      duration: 200,
      ease: "Sine.easeIn",
    });

    this.scene.tweens.add({
      targets: this.sealGraphics,
      scale: { from: 0, to: 1 },
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        this.animateCracks();
      },
    });
  }

  private animateCracks(): void {
    // Step 2: Cracks spread (0.3s)
    const crackAngles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

    this.crackLines.forEach((crack, index) => {
      const delay = index * 25;
      this.scene.time.delayedCall(delay, () => {
        const angle = (crackAngles[index] * Math.PI) / 180;
        const startX = Math.cos(angle) * 20;
        const startY = Math.sin(angle) * 20;
        const endX = Math.cos(angle) * 45;
        const endY = Math.sin(angle) * 45;

        crack.clear();
        crack.lineStyle(2, 0xffffff, 0.9);
        crack.beginPath();
        crack.moveTo(startX, startY);

        // Jagged crack path
        const midX = (startX + endX) / 2 + (Math.random() - 0.5) * 10;
        const midY = (startY + endY) / 2 + (Math.random() - 0.5) * 10;
        crack.lineTo(midX, midY);
        crack.lineTo(endX, endY);
        crack.strokePath();
        crack.setAlpha(1);
      });
    });

    this.scene.time.delayedCall(300, () => {
      if (this.config.variant === "gold") {
        this.animateGoldExplosion();
      } else {
        this.animateShatter();
      }
    });
  }

  private animateShatter(): void {
    // Step 3: Seal shatters (0.4s)
    for (let i = 0; i < 16; i++) {
      const piece = this.scene.add.graphics();
      const angle = (i / 16) * Math.PI * 2;
      const size = 8 + Math.random() * 8;

      piece.fillStyle(0x708090, 0.9);
      piece.fillCircle(0, 0, size);
      piece.setPosition(this.container.x, this.container.y);

      this.container.add(piece);
      this.shatterPieces.push(piece);

      const distance = 60 + Math.random() * 40;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      this.scene.tweens.add({
        targets: piece,
        x: targetX,
        y: targetY,
        alpha: 0,
        rotation: Math.random() * Math.PI * 2,
        duration: 400,
        ease: "Cubic.easeOut",
      });
    }

    this.scene.tweens.add({
      targets: [this.sealGraphics, ...this.crackLines],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.animateGateOpen();
      },
    });
  }

  private animateGoldExplosion(): void {
    // Gold variant: Seal explodes in particle burst
    for (let i = 0; i < 30; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(0xffd700, 1);
      particle.fillCircle(0, 0, 4 + Math.random() * 4);
      particle.setPosition(this.container.x, this.container.y);

      this.container.add(particle);
      this.shatterPieces.push(particle);

      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 60;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: { from: 1, to: 0 },
        duration: 600,
        ease: "Cubic.easeOut",
      });
    }

    // Flash effect
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffffff, 0.8);
    flash.fillCircle(0, 0, 60);
    this.container.add(flash);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    this.scene.tweens.add({
      targets: [this.sealGraphics, ...this.crackLines],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.animateGoldGate();
      },
    });
  }

  private animateGateOpen(): void {
    // Step 4: Gate swings open (0.5s)
    // Split gate into left and right doors
    const leftDoor = this.scene.add.graphics();
    const rightDoor = this.scene.add.graphics();

    const gateColor = 0x5a4a3a;
    const trimColor = 0x3a2a1a;

    // Draw left door
    leftDoor.fillStyle(gateColor, 0.9);
    leftDoor.fillRect(0, -60, 45, 120);
    leftDoor.lineStyle(2, trimColor, 1);
    leftDoor.strokeRect(0, -60, 45, 120);

    // Draw right door
    rightDoor.fillStyle(gateColor, 0.9);
    rightDoor.fillRect(0, -60, 45, 120);
    rightDoor.lineStyle(2, trimColor, 1);
    rightDoor.strokeRect(0, -60, 45, 120);

    leftDoor.setPosition(-50, 0);
    rightDoor.setPosition(5, 0);

    this.container.add(leftDoor);
    this.container.add(rightDoor);

    this.gateGraphics.clear();

    // Swing doors open
    this.scene.tweens.add({
      targets: leftDoor,
      x: -80,
      rotation: -0.3,
      duration: 500,
      ease: "Cubic.easeOut",
    });

    this.scene.tweens.add({
      targets: rightDoor,
      x: 35,
      rotation: 0.3,
      duration: 500,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.animatePersonaWalk(leftDoor, rightDoor);
      },
    });
  }

  private animateGoldGate(): void {
    // Gold variant: Gate transforms to gilded arch
    this.gateGraphics.clear();

    // Gilded arch
    this.gateGraphics.lineStyle(5, 0xffd700, 1);
    this.gateGraphics.strokeCircle(0, 0, 60);

    this.gateGraphics.fillStyle(0xffd700, 0.2);
    this.gateGraphics.fillCircle(0, 0, 60);

    // Decorative elements
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * 60;
      const y = Math.sin(angle) * 60;
      this.gateGraphics.fillStyle(0xffd700, 1);
      this.gateGraphics.fillCircle(x, y, 5);
    }

    this.gateGraphics.setAlpha(0);
    this.scene.tweens.add({
      targets: this.gateGraphics,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 500,
      ease: "Back.easeOut",
      onComplete: () => {
        this.animatePersonaWalk();
        this.animateCrownAppear();
      },
    });
  }

  private animatePersonaWalk(
    leftDoor?: Phaser.GameObjects.Graphics,
    rightDoor?: Phaser.GameObjects.Graphics,
  ): void {
    // Step 5: Persona steps through (0.3s)
    this.scene.tweens.add({
      targets: this.personaGraphics,
      alpha: { from: 0, to: 1 },
      y: { from: -80, to: 0 },
      duration: 300,
      ease: "Sine.easeOut",
      onComplete: () => {
        // Briefly sustain
        this.scene.time.delayedCall(200, () => {
          // Fade persona and close gate
          this.scene.tweens.add({
            targets: this.personaGraphics,
            alpha: 0,
            duration: 300,
          });

          if (leftDoor && rightDoor) {
            // Close gates
            this.scene.tweens.add({
              targets: leftDoor,
              x: -50,
              rotation: 0,
              duration: 400,
              ease: "Cubic.easeIn",
            });

            this.scene.tweens.add({
              targets: rightDoor,
              x: 5,
              rotation: 0,
              duration: 400,
              ease: "Cubic.easeIn",
              onComplete: () => {
                leftDoor.destroy();
                rightDoor.destroy();
                this.animateCheckpointGlow();
              },
            });
          } else {
            this.animateCheckpointGlow();
          }
        });
      },
    });
  }

  private animateCrownAppear(): void {
    if (!this.crownGraphics) return;

    // Crown materializes above checkpoint
    this.scene.time.delayedCall(400, () => {
      this.scene.tweens.add({
        targets: this.crownGraphics,
        alpha: { from: 0, to: 1 },
        scale: { from: 0, to: 1 },
        y: { from: -100, to: -85 },
        duration: 500,
        ease: "Back.easeOut",
      });

      // Crown sparkle effect
      for (let i = 0; i < 12; i++) {
        const sparkle = this.scene.add.graphics();
        sparkle.fillStyle(0xffd700, 1);
        sparkle.fillCircle(0, -85, 2);
        sparkle.setPosition(this.container.x, this.container.y);
        this.container.add(sparkle);

        const angle = (i / 12) * Math.PI * 2;
        const distance = 30;
        const targetX = Math.cos(angle) * distance;
        const targetY = -85 + Math.sin(angle) * distance;

        this.scene.tweens.add({
          targets: sparkle,
          x: targetX,
          y: targetY,
          alpha: 0,
          duration: 600,
          delay: 100,
          onComplete: () => sparkle.destroy(),
        });
      }
    });
  }

  private animateCheckpointGlow(): void {
    // Final glow
    const glowColor = this.config.variant === "gold" ? 0xffd700 : 0x4169e1;

    this.glowGraphics.clear();
    this.glowGraphics.fillStyle(glowColor, 0.4);
    this.glowGraphics.fillCircle(0, 0, 60);
    this.glowGraphics.fillStyle(glowColor, 0.2);
    this.glowGraphics.fillCircle(0, 0, 80);

    this.scene.tweens.add({
      targets: this.glowGraphics,
      alpha: { from: 0, to: 1 },
      duration: 400,
      ease: "Sine.easeOut",
    });

    // Pulse effect
    this.scene.tweens.add({
      targets: this.glowGraphics,
      scale: { from: 1, to: 1.2 },
      alpha: { from: 1, to: 0.6 },
      duration: 600,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.complete();
      },
    });
  }

  destroy(): void {
    this.shatterPieces.forEach((piece) => {
      if (piece && piece.scene) piece.destroy();
    });
    super.destroy();
  }
}
