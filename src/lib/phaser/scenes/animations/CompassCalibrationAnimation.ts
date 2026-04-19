import * as Phaser from "phaser";
import {
  BaseCheckpointAnimation,
  type AnimationConfig,
} from "./BaseCheckpointAnimation";

export class CompassCalibrationAnimation extends BaseCheckpointAnimation {
  private compassGraphics!: Phaser.GameObjects.Graphics;
  private needleGraphics!: Phaser.GameObjects.Graphics;
  private cardinalPoints: Phaser.GameObjects.Text[] = [];
  private indicatorRing!: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, config: AnimationConfig) {
    super(scene, config);
  }

  create(): void {
    this.createCompassBase();
    this.createCardinalPoints();
    this.createNeedle();
    this.createIndicatorRing();
    this.playCompassCalibration();
  }

  private createCompassBase(): void {
    this.compassGraphics = this.scene.add.graphics();
    this.container.add(this.compassGraphics);

    const color = this.getPrimaryColor();
    
    this.compassGraphics.fillStyle(0x1a1a2e, 0.9);
    this.compassGraphics.fillCircle(0, 0, 50);

    this.compassGraphics.fillStyle(color, 0.3);
    this.compassGraphics.fillCircle(0, 0, 45);

    this.compassGraphics.lineStyle(3, this.getSecondaryColor(), 0.8);
    this.compassGraphics.strokeCircle(0, 0, 45);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const innerRadius = 38;
      const outerRadius = 42;
      
      this.compassGraphics.lineStyle(2, this.getSecondaryColor(), 0.5);
      this.compassGraphics.beginPath();
      this.compassGraphics.moveTo(
        Math.cos(angle) * innerRadius,
        Math.sin(angle) * innerRadius
      );
      this.compassGraphics.lineTo(
        Math.cos(angle) * outerRadius,
        Math.sin(angle) * outerRadius
      );
      this.compassGraphics.strokePath();
    }

    this.compassGraphics.setScale(0);
    this.container.add(this.compassGraphics);
  }

  private createCardinalPoints(): void {
    const directions = ["N", "E", "S", "W"];
    const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    const radius = 35;

    directions.forEach((dir, index) => {
      const angle = angles[index];
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const text = this.scene.add.text(x, y, dir, {
        fontSize: "14px",
        fontFamily: "Arial",
        color: dir === "N" ? "#ff4444" : "#ffffff",
        fontStyle: "bold",
      });
      text.setOrigin(0.5);
      text.setAlpha(0);
      text.setScale(0);

      this.cardinalPoints.push(text);
      this.container.add(text);
    });
  }

  private createNeedle(): void {
    this.needleGraphics = this.scene.add.graphics();
    this.container.add(this.needleGraphics);

    this.needleGraphics.fillStyle(0xff4444, 0.9);
    this.needleGraphics.fillTriangle(0, -30, -6, 0, 6, 0);
    
    this.needleGraphics.fillStyle(0xffffff, 0.9);
    this.needleGraphics.fillTriangle(0, 30, -6, 0, 6, 0);

    this.needleGraphics.setAlpha(0);
    this.container.add(this.needleGraphics);
  }

  private createIndicatorRing(): void {
    this.indicatorRing = this.scene.add.arc(0, 0, 55, 0, 360, false, this.getGlowColor(), 0);
    this.indicatorRing.setStrokeStyle(3, this.getGlowColor(), 0);
    this.indicatorRing.setAlpha(0);
    this.container.add(this.indicatorRing);
  }

  private playCompassCalibration(): void {
    this.scene.tweens.add({
      targets: this.compassGraphics,
      scale: { from: 0, to: 1 },
      duration: 400,
      ease: "Back.easeOut",
      onComplete: () => {
        this.animateCardinalPoints();
      },
    });
  }

  private animateCardinalPoints(): void {
    this.cardinalPoints.forEach((point, index) => {
      const delay = index * 100;
      
      this.scene.time.delayedCall(delay, () => {
        this.scene.tweens.add({
          targets: point,
          alpha: { from: 0, to: 1 },
          scale: { from: 0, to: 1 },
          duration: 300,
          ease: "Back.easeOut",
        });
      });
    });

    this.scene.time.delayedCall(500, () => {
      this.animateNeedle();
    });
  }

  private animateNeedle(): void {
    this.scene.tweens.add({
      targets: this.needleGraphics,
      alpha: { from: 0, to: 1 },
      duration: 300,
      onComplete: () => {
        this.animateNeedleSpin();
      },
    });
  }

  private animateNeedleSpin(): void {
    const targetRotation = Math.PI * 4;
    let rotation = 0;
    
    this.mainTween = this.scene.tweens.addCounter({
      from: 0,
      to: targetRotation,
      duration: this.duration * 0.5,
      ease: "Quad.easeInOut",
      onUpdate: (tween) => {
        rotation = tween.getValue() as number;
        this.needleGraphics.setRotation(rotation);
        
        const intensity = Math.sin(rotation * 2) * 0.5 + 0.5;
        this.indicatorRing.setStrokeStyle(3, this.getGlowColor(), intensity * 0.8);
        this.indicatorRing.setAlpha(intensity);
      },
      onComplete: () => {
        this.needleGraphics.setRotation(0);
        this.animateCalibrationComplete();
      },
    });
  }

  private animateCalibrationComplete(): void {
    this.scene.tweens.add({
      targets: this.indicatorRing,
      scaleX: { from: 1, to: 1.3 },
      scaleY: { from: 1, to: 1.3 },
      alpha: { from: 1, to: 0 },
      duration: 500,
      ease: "Power2",
    });

    this.scene.tweens.add({
      targets: this.container,
      scale: { from: 1, to: 1.15 },
      duration: 300,
      yoyo: true,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.complete();
      },
    });
  }

  skip(): void {
    if (this.isSkipped || this.isComplete) return;
    this.isSkipped = true;
    this.stopTweens();

    this.scene.tweens.killTweensOf(this.compassGraphics);
    this.scene.tweens.killTweensOf(this.needleGraphics);
    this.scene.tweens.killTweensOf(this.indicatorRing);
    this.cardinalPoints.forEach(point => this.scene.tweens.killTweensOf(point));

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
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