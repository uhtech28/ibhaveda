import * as Phaser from "phaser";
import {
  BaseCheckpointAnimation,
  type AnimationConfig,
} from "./BaseCheckpointAnimation";

export class BeaconLightingAnimation extends BaseCheckpointAnimation {
  private beaconGraphics!: Phaser.GameObjects.Graphics;
  private lightRay!: Phaser.GameObjects.Graphics;
  private flame!: Phaser.GameObjects.Graphics;
  private flameParticles: Phaser.GameObjects.Graphics[] = [];
  private lightIntensity = 0;

  constructor(scene: Phaser.Scene, config: AnimationConfig) {
    super(scene, config);
  }

  create(): void {
    this.createBeaconBase();
    this.createLightRays();
    this.createFlame();
    this.playBeaconLighting();
  }

  private createBeaconBase(): void {
    this.beaconGraphics = this.scene.add.graphics();
    this.container.add(this.beaconGraphics);

    const color = this.getPrimaryColor();
    
    this.beaconGraphics.fillStyle(0x2d3748, 0.9);
    this.beaconGraphics.fillRect(-15, 20, 30, 40);

    this.beaconGraphics.fillStyle(color, 0.7);
    this.beaconGraphics.fillCircle(0, 0, 25);

    this.beaconGraphics.lineStyle(2, this.getSecondaryColor(), 0.8);
    this.beaconGraphics.strokeCircle(0, 0, 25);

    this.beaconGraphics.setScale(0);
    this.container.add(this.beaconGraphics);
  }

  private createLightRays(): void {
    this.lightRay = this.scene.add.graphics();
    this.container.add(this.lightRay);

    this.lightRay.setAlpha(0);
    this.container.add(this.lightRay);
  }

  private createFlame(): void {
    this.flame = this.scene.add.graphics();
    this.container.add(this.flame);

    for (let i = 0; i < 5; i++) {
      const particle = this.scene.add.graphics();
      particle.setAlpha(0);
      this.flameParticles.push(particle);
      this.container.add(particle);
    }
  }

  private playBeaconLighting(): void {
    this.scene.tweens.add({
      targets: this.beaconGraphics,
      scale: { from: 0, to: 1 },
      duration: 400,
      ease: "Back.easeOut",
      onComplete: () => {
        this.animateLightRays();
      },
    });
  }

  private animateLightRays(): void {
    const numRays = 12;
    const angleStep = (Math.PI * 2) / numRays;

    this.mainTween = this.scene.tweens.add({
      targets: this,
      lightIntensity: 1,
      duration: this.duration * 0.4,
      ease: "Sine.easeOut",
      onUpdate: () => {
        this.lightRay.clear();
        
        for (let i = 0; i < numRays; i++) {
          const angle = i * angleStep + (this.lightIntensity * 0.5);
          const innerRadius = 30;
          const outerRadius = 80 + this.lightIntensity * 40;
          
          const r = (this.getPrimaryColor() >> 16) & 0xff;
          const g = (this.getPrimaryColor() >> 8) & 0xff;
          const b = this.getPrimaryColor() & 0xff;
          
          const alpha = this.lightIntensity * 0.6;
          const color = (r << 16) | (g << 8) | b;
          
          this.lightRay.lineStyle(4, color, alpha);
          this.lightRay.beginPath();
          this.lightRay.moveTo(
            Math.cos(angle) * innerRadius,
            Math.sin(angle) * innerRadius
          );
          this.lightRay.lineTo(
            Math.cos(angle) * outerRadius,
            Math.sin(angle) * outerRadius
          );
          this.lightRay.strokePath();
        }
        
        this.lightRay.setAlpha(this.lightIntensity);
      },
      onComplete: () => {
        this.animateFlame();
      },
    });
  }

  private animateFlame(): void {
    const flameColors = [0xff4500, 0xff6600, 0xffaa00, 0xffdd00, 0xffffff];
    
    this.flameParticles.forEach((particle, index) => {
      const delay = index * 100;
      
      this.scene.time.delayedCall(delay, () => {
        const flicker = () => {
          if (this.isSkipped || this.isComplete) return;
          
          const offsetX = (Math.random() - 0.5) * 10;
          const offsetY = -20 - Math.random() * 20;
          const size = 8 + Math.random() * 8;
          
          particle.clear();
          particle.fillStyle(flameColors[index % flameColors.length], 0.8);
          particle.fillCircle(offsetX, offsetY, size);
          particle.setAlpha(0.8);
          
          this.scene.tweens.add({
            targets: particle,
            alpha: 0,
            y: offsetY - 30,
            duration: 300,
            ease: "Power2",
            onComplete: () => {
              if (!this.isSkipped && !this.isComplete) {
                flicker();
              }
            },
          });
        };
        
        flicker();
      });
    });

    this.scene.time.delayedCall(this.duration * 0.5, () => {
      this.animateBeaconComplete();
    });
  }

  private animateBeaconComplete(): void {
    this.scene.tweens.add({
      targets: this.container,
      scale: { from: 1, to: 1.2 },
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

    this.scene.tweens.killTweensOf(this.beaconGraphics);
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this);

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