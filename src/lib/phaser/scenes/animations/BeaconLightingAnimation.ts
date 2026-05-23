import * as Phaser from "phaser";
import {
  BaseCheckpointAnimation,
  type AnimationConfig,
} from "./BaseCheckpointAnimation";

export class BeaconLightingAnimation extends BaseCheckpointAnimation {
  private beaconGraphics!: Phaser.GameObjects.Graphics;
  private watchtowerBase!: Phaser.GameObjects.Graphics;
  private lightRay!: Phaser.GameObjects.Graphics;
  private flame!: Phaser.GameObjects.Graphics;
  private flameParticles: Phaser.GameObjects.Graphics[] = [];
  private notificationRings!: Phaser.GameObjects.Graphics;
  private lightIntensity = 0;

  constructor(scene: Phaser.Scene, config: AnimationConfig) {
    super(scene, config);
  }

  create(): void {
    this.createWatchtowerBase();
    this.createBeaconBase();
    this.createLightRays();
    this.createFlame();
    if (this.config.variant === "gold") {
      this.createNotificationRings();
    }
    this.playBeaconLighting();
  }

  private createWatchtowerBase(): void {
    this.watchtowerBase = this.scene.add.graphics();
    this.container.add(this.watchtowerBase);

    // Stone tower structure
    this.watchtowerBase.fillStyle(0x4a5568, 0.9);
    this.watchtowerBase.fillRect(-20, 10, 40, 50);

    // Tower details - stone blocks
    this.watchtowerBase.lineStyle(1, 0x2d3748, 0.3);
    for (let i = 0; i < 5; i++) {
      const y = 15 + i * 10;
      this.watchtowerBase.strokeRect(-20, y, 40, 10);
    }

    // Tower top platform
    this.watchtowerBase.fillStyle(0x2d3748, 0.9);
    this.watchtowerBase.fillRect(-25, 5, 50, 10);

    // Support beams
    this.watchtowerBase.lineStyle(3, 0x1a202c, 0.8);
    this.watchtowerBase.lineBetween(-18, 10, -18, 60);
    this.watchtowerBase.lineBetween(18, 10, 18, 60);

    this.watchtowerBase.setScale(0);
    this.container.add(this.watchtowerBase);
  }

  private createBeaconBase(): void {
    this.beaconGraphics = this.scene.add.graphics();
    this.container.add(this.beaconGraphics);

    const color = this.getPrimaryColor();

    // Beacon bowl/brazier
    this.beaconGraphics.fillStyle(0x78350f, 0.9);
    this.beaconGraphics.fillRect(-18, -5, 36, 8);

    // Inner beacon chamber
    this.beaconGraphics.fillStyle(color, 0.3);
    this.beaconGraphics.fillCircle(0, -10, 20);

    // Beacon rim
    this.beaconGraphics.lineStyle(2, this.getSecondaryColor(), 0.8);
    this.beaconGraphics.strokeCircle(0, -10, 20);

    this.beaconGraphics.setScale(0);
    this.container.add(this.beaconGraphics);
  }

  private createLightRays(): void {
    this.lightRay = this.scene.add.graphics();
    this.lightRay.setAlpha(0);
    this.container.add(this.lightRay);
  }

  private createNotificationRings(): void {
    this.notificationRings = this.scene.add.graphics();
    this.notificationRings.setAlpha(0);
    this.container.add(this.notificationRings);
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
    // Watchtower rises first
    this.scene.tweens.add({
      targets: this.watchtowerBase,
      scale: { from: 0, to: 1 },
      duration: 500,
      ease: "Back.easeOut",
      onComplete: () => {
        // Then beacon appears
        this.scene.tweens.add({
          targets: this.beaconGraphics,
          scale: { from: 0, to: 1 },
          duration: 400,
          ease: "Back.easeOut",
          onComplete: () => {
            this.animateLightRays();
          },
        });
      },
    });
  }

  private animateLightRays(): void {
    const numRays = 16;
    const angleStep = (Math.PI * 2) / numRays;

    this.mainTween = this.scene.tweens.add({
      targets: this,
      lightIntensity: 1,
      duration: this.duration * 0.4,
      ease: "Sine.easeOut",
      onUpdate: () => {
        this.lightRay.clear();

        for (let i = 0; i < numRays; i++) {
          const angle = i * angleStep + this.lightIntensity * 0.5;
          const innerRadius = 25;
          const outerRadius = 100 + this.lightIntensity * 50;

          // Main beam color
          const color = this.getPrimaryColor();
          const alpha = this.lightIntensity * 0.7;

          this.lightRay.lineStyle(5, color, alpha);
          this.lightRay.beginPath();
          this.lightRay.moveTo(
            Math.cos(angle) * innerRadius,
            Math.sin(angle) * innerRadius - 10,
          );
          this.lightRay.lineTo(
            Math.cos(angle) * outerRadius,
            Math.sin(angle) * outerRadius - 10,
          );
          this.lightRay.strokePath();

          // Alternate rays with secondary color
          if (i % 2 === 0) {
            this.lightRay.lineStyle(3, this.getSecondaryColor(), alpha * 0.5);
            this.lightRay.beginPath();
            this.lightRay.moveTo(
              Math.cos(angle) * (innerRadius + 10),
              Math.sin(angle) * (innerRadius + 10) - 10,
            );
            this.lightRay.lineTo(
              Math.cos(angle) * (outerRadius - 20),
              Math.sin(angle) * (outerRadius - 20) - 10,
            );
            this.lightRay.strokePath();
          }
        }

        this.lightRay.setAlpha(this.lightIntensity);
      },
      onComplete: () => {
        this.animateFlame();
      },
    });
  }

  private animateFlame(): void {
    // Different flame colors for standard vs gold
    const flameColors =
      this.config.variant === "gold"
        ? [0xffd700, 0xffed4e, 0xffffff, 0xfef3c7, 0xffffff] // Gold/white flames
        : [0xff4500, 0xff6600, 0xffaa00, 0xffdd00, 0xff8800]; // Orange/red flames

    this.flameParticles.forEach((particle, index) => {
      const delay = index * 100;

      this.scene.time.delayedCall(delay, () => {
        const flicker = () => {
          if (this.isSkipped || this.isComplete) return;

          const offsetX = (Math.random() - 0.5) * 12;
          const offsetY = -25 - Math.random() * 25;
          const size = 10 + Math.random() * 10;

          particle.clear();
          particle.fillStyle(flameColors[index % flameColors.length], 0.85);
          particle.fillCircle(offsetX, offsetY, size);

          // Gold variant has brighter glow
          if (this.config.variant === "gold") {
            particle.fillStyle(0xffffff, 0.6);
            particle.fillCircle(offsetX, offsetY, size * 0.5);
          }

          particle.setAlpha(0.9);

          this.scene.tweens.add({
            targets: particle,
            alpha: 0,
            y: offsetY - 40,
            duration: this.config.variant === "gold" ? 400 : 300,
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

    // For gold variant, show community notification
    if (this.config.variant === "gold") {
      this.scene.time.delayedCall(600, () => {
        this.animateCommunityNotification();
      });
    }

    this.scene.time.delayedCall(this.duration * 0.5, () => {
      this.animateBeaconComplete();
    });
  }

  private animateCommunityNotification(): void {
    // Expanding rings to represent community notification broadcast
    let ringCount = 0;
    const maxRings = 4;

    const createRing = () => {
      if (ringCount >= maxRings || this.isSkipped || this.isComplete) return;

      ringCount++;

      const ring = this.scene.add.graphics();
      this.container.add(ring);

      this.scene.tweens.add({
        targets: ring,
        duration: 2000,
        ease: "Sine.easeOut",
        onUpdate: (tween) => {
          const progress = tween.progress;
          const radius = 40 + progress * 120;
          const alpha = (1 - progress) * 0.6;

          ring.clear();
          ring.lineStyle(3, this.getGlowColor(), alpha);
          ring.strokeCircle(0, -10, radius);

          // Add sparkles around ring
          if (progress < 0.8) {
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2 + progress * Math.PI;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius - 10;
              ring.fillStyle(0xffffff, alpha * 0.8);
              ring.fillCircle(x, y, 2);
            }
          }
        },
        onComplete: () => {
          ring.destroy();
        },
      });

      // Create next ring
      this.scene.time.delayedCall(400, createRing);
    };

    createRing();
  }

  private animateBeaconComplete(): void {
    // Pulse the entire beacon
    this.scene.tweens.add({
      targets: this.container,
      scale: { from: 1, to: 1.15 },
      duration: 400,
      yoyo: true,
      ease: "Sine.easeInOut",
    });

    // Add final glow burst
    const finalGlow = this.scene.add.graphics();
    this.container.add(finalGlow);

    this.scene.tweens.add({
      targets: finalGlow,
      duration: 800,
      ease: "Cubic.easeOut",
      onUpdate: (tween) => {
        const progress = tween.progress;
        const radius = 30 + progress * 50;
        const alpha = (1 - progress) * 0.5;

        finalGlow.clear();
        finalGlow.fillStyle(this.getGlowColor(), alpha);
        finalGlow.fillCircle(0, -10, radius);
      },
      onComplete: () => {
        finalGlow.destroy();
        this.complete();
      },
    });
  }

  skip(): void {
    if (this.isSkipped || this.isComplete) return;
    this.isSkipped = true;
    this.stopTweens();

    this.scene.tweens.killTweensOf(this.watchtowerBase);
    this.scene.tweens.killTweensOf(this.beaconGraphics);
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this);
    if (this.notificationRings) {
      this.scene.tweens.killTweensOf(this.notificationRings);
    }

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
