import * as Phaser from "phaser";
import {
  BaseCheckpointAnimation,
  type AnimationConfig,
} from "./BaseCheckpointAnimation";

export class BridgeRepairAnimation extends BaseCheckpointAnimation {
  private bridgeGraphics!: Phaser.GameObjects.Graphics;
  private plankGraphics: Phaser.GameObjects.Graphics[] = [];
  private ropeGraphics!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: AnimationConfig) {
    super(scene, config);
  }

  create(): void {
    this.createBridgeBase();
    this.createPlanks();
    this.createRopes();
    this.playBridgeRepair();
  }

  private createBridgeBase(): void {
    this.bridgeGraphics = this.scene.add.graphics();
    this.container.add(this.bridgeGraphics);

    const color = this.getPrimaryColor();
    
    this.bridgeGraphics.fillStyle(0x4a3728, 0.9);
    this.bridgeGraphics.fillRect(-60, -10, 120, 20);

    this.bridgeGraphics.lineStyle(2, color, 0.6);
    this.bridgeGraphics.strokeRect(-60, -10, 120, 20);

    this.bridgeGraphics.setAlpha(0.3);
    this.container.add(this.bridgeGraphics);
  }

  private createPlanks(): void {
    const plankPositions = [-45, -25, -5, 15, 35, 55];
    
    plankPositions.forEach((xPos, index) => {
      const plank = this.scene.add.graphics();
      plank.setAlpha(0);
      plank.setScale(0);
      
      plank.fillStyle(0x8b7355, 0.9);
      plank.fillRect(xPos, -5, 18, 12);
      
      plank.lineStyle(1, 0x6b5344, 0.8);
      plank.strokeRect(xPos, -5, 18, 12);

      this.plankGraphics.push(plank);
      this.container.add(plank);
    });
  }

  private createRopes(): void {
    this.ropeGraphics = this.scene.add.graphics();
    this.container.add(this.ropeGraphics);

    this.ropeGraphics.setAlpha(0);
  }

  private playBridgeRepair(): void {
    this.animateBridgeAppear();
  }

  private animateBridgeAppear(): void {
    this.scene.tweens.add({
      targets: this.bridgeGraphics,
      alpha: { from: 0.3, to: 1 },
      duration: 500,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.animatePlanks();
      },
    });
  }

  private animatePlanks(): void {
    this.plankGraphics.forEach((plank, index) => {
      const delay = index * 150;
      
      this.scene.time.delayedCall(delay, () => {
        this.scene.tweens.add({
          targets: plank,
          alpha: { from: 0, to: 1 },
          scale: { from: 0, to: 1 },
          duration: 300,
          ease: "Back.easeOut",
        });

        this.animateRopeAttach(index);
      });
    });

    const totalDuration = this.plankGraphics.length * 150 + 400;
    this.scene.time.delayedCall(totalDuration, () => {
      this.animateBridgeComplete();
    });
  }

  private animateRopeAttach(plankIndex: number): void {
    const yPositions = [-15, 15];
    
    yPositions.forEach((yPos) => {
      this.scene.tweens.add({
        targets: this.ropeGraphics,
        alpha: { from: 0, to: 0.8 },
        duration: 200,
        onComplete: () => {
          this.ropeGraphics.lineStyle(2, this.getSecondaryColor(), 0.6);
          
          const startX = -50 + plankIndex * 20;
          this.ropeGraphics.beginPath();
          this.ropeGraphics.moveTo(startX, yPos);
          
          for (let i = 0; i < 5; i++) {
            const waveX = startX + i * 5;
            const waveY = yPos + Math.sin(i * 0.8) * 3;
            this.ropeGraphics.lineTo(waveX, waveY);
          }
          this.ropeGraphics.strokePath();
        },
      });
    });
  }

  private animateBridgeComplete(): void {
    this.scene.tweens.add({
      targets: this.container,
      scale: { from: 1, to: 1.1 },
      duration: 200,
      yoyo: true,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.container,
          scale: 1,
          duration: 100,
          onComplete: () => {
            this.complete();
          },
        });
      },
    });
  }

  skip(): void {
    if (this.isSkipped || this.isComplete) return;
    this.isSkipped = true;
    this.stopTweens();

    this.scene.tweens.killTweensOf(this.bridgeGraphics);
    this.plankGraphics.forEach(plank => this.scene.tweens.killTweensOf(plank));

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