import * as Phaser from "phaser";
import {
  BaseCheckpointAnimation,
  type AnimationConfig,
} from "./BaseCheckpointAnimation";

export class RuneInscriptionAnimation extends BaseCheckpointAnimation {
  private runeGraphics!: Phaser.GameObjects.Graphics;
  private runeSymbols: Phaser.GameObjects.Text[] = [];
  private glowRing!: Phaser.GameObjects.Arc;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, config: AnimationConfig) {
    super(scene, config);
  }

  create(): void {
    this.createGlowRing();
    this.createRuneBase();
    this.createRuneSymbols();
    this.createParticles();
    this.playRuneInscription();
  }

  private createGlowRing(): void {
    this.glowRing = this.scene.add.arc(
      0,
      0,
      60,
      0,
      360,
      false,
      this.getGlowColor(),
      0,
    );
    this.glowRing.setStrokeStyle(4, this.getGlowColor(), 0);
    this.container.add(this.glowRing);
  }

  private createRuneBase(): void {
    this.runeGraphics = this.scene.add.graphics();
    this.container.add(this.runeGraphics);

    const color = this.getPrimaryColor();

    this.runeGraphics.fillStyle(color, 0.6);
    this.runeGraphics.fillCircle(0, 0, 45);

    this.runeGraphics.fillStyle(0x000000, 0.5);
    this.runeGraphics.fillCircle(0, 0, 35);

    this.runeGraphics.lineStyle(2, this.getSecondaryColor(), 0.8);
    this.runeGraphics.strokeCircle(0, 0, 40);

    this.runeGraphics.setScale(0);
    this.container.add(this.runeGraphics);
  }

  private createRuneSymbols(): void {
    const runeChars = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ"];
    const radius = 25;

    runeChars.forEach((char, index) => {
      const angle = (index / runeChars.length) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const rune = this.scene.add.text(x, y, char, {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#ffffff",
      });
      rune.setOrigin(0.5);
      rune.setAlpha(0);
      rune.setScale(0);

      this.runeSymbols.push(rune);
      this.container.add(rune);
    });
  }

  private createParticles(): void {
    const texture = this.scene.textures.exists("particle")
      ? "particle"
      : "__WHITE";
    this.particles = this.scene.add.particles(0, 0, texture, {
      speed: { min: 30, max: 80 },
      scale: { start: 0.3, end: 0 },
      lifespan: 600,
      blendMode: "ADD",
      emitting: false,
    });

    this.container.add(this.particles);
  }

  private playRuneInscription(): void {
    this.scene.tweens.add({
      targets: this.runeGraphics,
      scale: { from: 0, to: 1 },
      duration: 400,
      ease: "Back.easeOut",
      onComplete: () => {
        this.animateGlowRing();
        this.animateRuneSymbols();
      },
    });
  }

  private animateGlowRing(): void {
    this.scene.tweens.add({
      targets: this.glowRing,
      alpha: { from: 0, to: 1 },
      strokeAlpha: { from: 0, to: 1 },
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      duration: 600,
      ease: "Sine.easeOut",
      yoyo: true,
      repeat: 2,
    });
  }

  private animateRuneSymbols(): void {
    this.runeSymbols.forEach((rune, index) => {
      const delay = 200 + index * 80;

      this.scene.time.delayedCall(delay, () => {
        this.scene.tweens.add({
          targets: rune,
          alpha: { from: 0, to: 1 },
          scale: { from: 0, to: 1 },
          duration: 300,
          ease: "Back.easeOut",
        });

        if (this.particles) {
          this.particles.setPosition(rune.x, rune.y);
          this.particles.explode(3);
        }
      });
    });

    this.scene.time.delayedCall(1000, () => {
      this.animateRuneActivation();
    });
  }

  private animateRuneActivation(): void {
    const activationRing = this.scene.add.arc(
      0,
      0,
      40,
      0,
      360,
      false,
      this.getSecondaryColor(),
      0,
    );
    activationRing.setStrokeStyle(3, this.getSecondaryColor(), 0);
    this.container.add(activationRing);

    this.scene.tweens.add({
      targets: activationRing,
      scaleX: { from: 0.5, to: 2 },
      scaleY: { from: 0.5, to: 2 },
      alpha: { from: 1, to: 0 },
      duration: 800,
      ease: "Power2",
      onComplete: () => {
        activationRing.destroy();
      },
    });

    this.runeSymbols.forEach((rune) => {
      this.scene.tweens.add({
        targets: rune,
        scale: { from: 1, to: 1.3 },
        duration: 200,
        yoyo: true,
        repeat: 1,
      });
    });

    this.scene.time.delayedCall(600, () => {
      this.complete();
    });
  }

  skip(): void {
    if (this.isSkipped || this.isComplete) return;
    this.isSkipped = true;
    this.stopTweens();

    this.scene.tweens.killTweensOf(this.runeGraphics);
    this.scene.tweens.killTweensOf(this.glowRing);
    this.runeSymbols.forEach((rune) => this.scene.tweens.killTweensOf(rune));

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
