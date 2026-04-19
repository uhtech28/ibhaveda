import * as Phaser from "phaser";
import {
  BaseCheckpointAnimation,
  type AnimationConfig,
} from "./BaseCheckpointAnimation";

export class WardPlacementAnimation extends BaseCheckpointAnimation {
  private wardGraphics!: Phaser.GameObjects.Graphics;
  private protectionCircles: Phaser.GameObjects.Arc[] = [];
  private runeIcons: Phaser.GameObjects.Text[] = [];
  private shieldGraphics!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: AnimationConfig) {
    super(scene, config);
  }

  create(): void {
    this.createWardBase();
    this.createProtectionCircles();
    this.createRuneIcons();
    this.createShield();
    this.playWardPlacement();
  }

  private createWardBase(): void {
    this.wardGraphics = this.scene.add.graphics();
    this.container.add(this.wardGraphics);

    const color = this.getPrimaryColor();
    
    this.wardGraphics.fillStyle(0x1e293b, 0.8);
    this.wardGraphics.fillCircle(0, 0, 45);

    this.wardGraphics.fillStyle(color, 0.5);
    this.wardGraphics.fillCircle(0, 0, 35);

    this.wardGraphics.lineStyle(3, this.getSecondaryColor(), 0.8);
    this.wardGraphics.strokeCircle(0, 0, 40);

    this.wardGraphics.setScale(0);
    this.container.add(this.wardGraphics);
  }

  private createProtectionCircles(): void {
    const radii = [25, 35, 45];
    
    radii.forEach((radius, index) => {
      const circle = this.scene.add.arc(0, 0, radius, 0, 360, false, this.getSecondaryColor(), 0);
      circle.setStrokeStyle(2, this.getSecondaryColor(), 0);
      circle.setAlpha(0);
      circle.setScale(0);
      
      this.protectionCircles.push(circle);
      this.container.add(circle);
    });
  }

  private createRuneIcons(): void {
    const runeSymbols = ["᛭", "᛫", "⁂", "※", "⌘", "⚠"];
    const numRunes = 6;
    
    for (let i = 0; i < numRunes; i++) {
      const angle = (i / numRunes) * Math.PI * 2;
      const radius = 30;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const rune = this.scene.add.text(x, y, runeSymbols[i], {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#ffffff",
      });
      rune.setOrigin(0.5);
      rune.setAlpha(0);
      rune.setScale(0);

      this.runeIcons.push(rune);
      this.container.add(rune);
    }
  }

  private createShield(): void {
    this.shieldGraphics = this.scene.add.graphics();
    this.container.add(this.shieldGraphics);

    this.shieldGraphics.setAlpha(0);
    this.shieldGraphics.setScale(0);
  }

  private playWardPlacement(): void {
    this.scene.tweens.add({
      targets: this.wardGraphics,
      scale: { from: 0, to: 1 },
      duration: 400,
      ease: "Back.easeOut",
      onComplete: () => {
        this.animateProtectionCircles();
      },
    });
  }

  private animateProtectionCircles(): void {
    this.protectionCircles.forEach((circle, index) => {
      const delay = index * 150;
      
      this.scene.time.delayedCall(delay, () => {
        this.scene.tweens.add({
          targets: circle,
          alpha: { from: 0, to: 0.7 },
          scale: { from: 0, to: 1 },
          duration: 400,
          ease: "Back.easeOut",
        });

        this.scene.tweens.add({
          targets: circle,
          strokeAlpha: { from: 0, to: 0.8 },
          duration: 400,
        });
      });
    });

    this.scene.time.delayedCall(600, () => {
      this.animateRuneIcons();
    });
  }

  private animateRuneIcons(): void {
    this.runeIcons.forEach((rune, index) => {
      const delay = index * 80;
      
      this.scene.time.delayedCall(delay, () => {
        this.scene.tweens.add({
          targets: rune,
          alpha: { from: 0, to: 1 },
          scale: { from: 0, to: 1 },
          duration: 300,
          ease: "Back.easeOut",
        });
      });
    });

    this.scene.time.delayedCall(700, () => {
      this.animateShieldFormation();
    });
  }

  private animateShieldFormation(): void {
    this.drawShield();
    
    this.scene.tweens.add({
      targets: this.shieldGraphics,
      alpha: { from: 0, to: 0.6 },
      scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.animateShieldPulse();
      },
    });
  }

  private drawShield(): void {
    const color = this.getPrimaryColor();
    const glowColor = this.getGlowColor();
    
    this.shieldGraphics.fillStyle(glowColor, 0.3);
    this.shieldGraphics.fillCircle(0, 0, 55);
    
    this.shieldGraphics.fillStyle(color, 0.5);
    this.shieldGraphics.fillCircle(0, 0, 50);
    
    this.shieldGraphics.lineStyle(3, this.getSecondaryColor(), 0.9);
    this.shieldGraphics.strokeCircle(0, 0, 50);
  }

  private animateShieldPulse(): void {
    this.mainTween = this.scene.tweens.addCounter({
      from: 1,
      to: 1.1,
      duration: 500,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut",
      onUpdate: (tween) => {
        const scale = (tween.getValue() as number) || 1;
        this.protectionCircles.forEach((circle, index) => {
          const offset = index * 0.02;
          circle.setScale(scale + offset);
        });
      },
      onComplete: () => {
        this.animateWardComplete();
      },
    });
  }

  private animateWardComplete(): void {
    this.scene.tweens.add({
      targets: this.container,
      scale: { from: 1, to: 1.2 },
      duration: 300,
      yoyo: true,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.runeIcons,
          scale: 1.2,
          duration: 200,
          yoyo: true,
          ease: "Sine.easeInOut",
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

    this.scene.tweens.killTweensOf(this.wardGraphics);
    this.scene.tweens.killTweensOf(this.shieldGraphics);
    this.protectionCircles.forEach(circle => this.scene.tweens.killTweensOf(circle));
    this.runeIcons.forEach(rune => this.scene.tweens.killTweensOf(rune));

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