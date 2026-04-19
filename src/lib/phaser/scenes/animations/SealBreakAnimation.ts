import * as Phaser from "phaser";
import {
  BaseCheckpointAnimation,
  type AnimationConfig,
} from "./BaseCheckpointAnimation";

export class SealBreakAnimation extends BaseCheckpointAnimation {
  private sealGraphics!: Phaser.GameObjects.Graphics;
  private crackLines: Phaser.GameObjects.Graphics[] = [];
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, config: AnimationConfig) {
    super(scene, config);
  }

  create(): void {
    this.createSeal();
    this.createCrackPattern();
    this.createParticles();
    this.playSealBreak();
  }

  private createSeal(): void {
    this.sealGraphics = this.scene.add.graphics();
    this.container.add(this.sealGraphics);

    const color = this.getPrimaryColor();
    const glowColor = this.getGlowColor();

    this.sealGraphics.fillStyle(glowColor, 0.3);
    this.sealGraphics.fillCircle(0, 0, 50);

    this.sealGraphics.fillStyle(color, 0.8);
    this.sealGraphics.fillCircle(0, 0, 40);

    this.sealGraphics.lineStyle(3, this.getSecondaryColor(), 1);
    this.sealGraphics.strokeCircle(0, 0, 35);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x1 = Math.cos(angle) * 25;
      const y1 = Math.sin(angle) * 25;
      const x2 = Math.cos(angle) * 33;
      const y2 = Math.sin(angle) * 33;
      this.sealGraphics.lineBetween(x1, y1, x2, y2);
    }

    this.sealGraphics.setScale(0);
    this.container.add(this.sealGraphics);
  }

  private createCrackPattern(): void {
    const colors = [0xffffff, this.getSecondaryColor(), this.getPrimaryColor()];

    for (let i = 0; i < 8; i++) {
      const crack = this.scene.add.graphics();
      const color = colors[i % colors.length];
      crack.lineStyle(2, color, 0);
      this.container.add(crack);
      this.crackLines.push(crack);
    }
  }

  private createParticles(): void {
    const texture = this.scene.textures.exists("particle")
      ? "particle"
      : "__WHITE";
    this.particles = this.scene.add.particles(0, 0, texture, {
      speed: { min: 50, max: 150 },
      scale: { start: 0.4, end: 0 },
      lifespan: 800,
      blendMode: "ADD",
      emitting: false,
    });

    this.container.add(this.particles);
  }

  private playSealBreak(): void {
    this.scene.tweens.add({
      targets: this.sealGraphics,
      scale: { from: 0, to: 1 },
      duration: 400,
      ease: "Back.easeOut",
      onComplete: () => {
        this.animateCracks();
      },
    });
  }

  private animateCracks(): void {
    const crackAngles = [0, 45, 90, 135, 180, 225, 270, 315];

    this.crackLines.forEach((crack, index) => {
      const delay = index * 100;

      this.scene.time.delayedCall(delay, () => {
        const angle = (crackAngles[index] * Math.PI) / 180;
        const startX = Math.cos(angle) * 35;
        const startY = Math.sin(angle) * 35;
        const endX = Math.cos(angle) * (35 + Math.random() * 10);
        const endY = Math.sin(angle) * (35 + Math.random() * 10);

        crack.clear();
        crack.lineStyle(2 + Math.random(), this.getSecondaryColor(), 0.8);
        crack.beginPath();
        crack.moveTo(startX, startY);
        crack.lineTo(endX, endY);
        crack.strokePath();

        if (this.particles) {
          this.particles.setPosition(endX, endY);
          this.particles.explode(5);
        }
      });
    });

    this.scene.time.delayedCall(800, () => {
      this.animateSealShatter();
    });
  }

  private animateSealShatter(): void {
    const pieces: Phaser.GameObjects.Graphics[] = [];

    for (let i = 0; i < 12; i++) {
      const piece = this.scene.add.graphics();
      const angle = (i / 12) * Math.PI * 2;
      const distance = 20 + Math.random() * 30;

      piece.fillStyle(this.getPrimaryColor(), 0.8);
      piece.fillCircle(0, 0, 5 + Math.random() * 8);
      piece.setPosition(this.container.x, this.container.y);

      this.container.add(piece);
      pieces.push(piece);

      const targetX = this.container.x + Math.cos(angle) * distance;
      const targetY = this.container.y + Math.sin(angle) * distance;

      this.scene.tweens.add({
        targets: piece,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0,
        duration: this.duration * 0.4,
        ease: "Power2",
      });
    }

    this.scene.tweens.add({
      targets: this.sealGraphics,
      alpha: 0,
      scale: 1.5,
      duration: this.duration * 0.3,
      ease: "Power2",
      onComplete: () => {
        pieces.forEach((p) => p.destroy());
        this.complete();
      },
    });
  }

  skip(): void {
    if (this.isSkipped || this.isComplete) return;
    this.isSkipped = true;
    this.stopTweens();

    this.scene.tweens.killTweensOf(this.sealGraphics);
    this.crackLines.forEach((crack) => this.scene.tweens.killTweensOf(crack));

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scale: 1,
      duration: 200,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  destroy(): void {
    super.destroy();
  }
}
