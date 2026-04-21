import * as Phaser from "phaser";

/**
 * Beacon Lighting Animation
 * Used for Stage 2 (Research) checkpoint crossings
 *
 * Standard (2/3 tasks): Watchtower beacon ignites, orange flame visible
 * Gold (3/3 tasks): Beacon burns gold/white flame with particle burst
 */
export class BeaconLightingAnimation {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private tower: Phaser.GameObjects.Graphics;
  private flame: Phaser.GameObjects.Graphics;
  private glow?: Phaser.GameObjects.Graphics;
  private particles: Phaser.GameObjects.Graphics[] = [];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    variant: "standard" | "gold"
  ) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.tower = scene.add.graphics();
    this.flame = scene.add.graphics();

    // Set depth to render above everything
    this.container.setDepth(1000);
  }

  /**
   * Play the animation
   * Returns a promise that resolves when animation completes
   */
  public async play(variant: "standard" | "gold"): Promise<void> {
    return new Promise((resolve) => {
      const duration = variant === "gold" ? 3000 : 2000;

      // Step 1: Create watchtower
      this.createWatchtower();

      // Step 2: Create flame (initially invisible)
      this.createFlame(variant);

      // Add graphics to container
      this.container.add(this.tower);
      this.container.add(this.flame);

      // Initially hide flame
      this.flame.setAlpha(0);

      // Step 3: Ignite flame after tower appears
      setTimeout(() => {
        this.igniteFlame(variant, () => {
          // Step 4: If gold, create glow and particles
          if (variant === "gold") {
            this.createGoldenGlow();
            this.createGoldenParticles();
          }

          // Step 5: Sustain flame for a moment
          setTimeout(() => {
            // Animation complete
            this.destroy();
            resolve();
          }, variant === "gold" ? 1500 : 800);
        });
      }, 300);
    });
  }

  /**
   * Create watchtower base structure
   */
  private createWatchtower(): void {
    const baseWidth = 40;
    const height = 80;

    // Tower base (stone gray)
    this.tower.fillStyle(0x5a5a5a, 1);
    this.tower.fillRect(-baseWidth / 2, -height / 2, baseWidth, height);

    // Tower outline (darker)
    this.tower.lineStyle(2, 0x3a3a3a, 1);
    this.tower.strokeRect(-baseWidth / 2, -height / 2, baseWidth, height);

    // Stone texture lines
    this.tower.lineStyle(1, 0x4a4a4a, 0.5);
    for (let i = 0; i < 4; i++) {
      const y = -height / 2 + (i + 1) * (height / 5);
      this.tower.lineBetween(-baseWidth / 2, y, baseWidth / 2, y);
    }

    // Beacon platform at top
    const platformWidth = 50;
    const platformHeight = 8;
    const platformY = -height / 2 - platformHeight;

    this.tower.fillStyle(0x6b4423, 1); // Wood brown
    this.tower.fillRect(
      -platformWidth / 2,
      platformY,
      platformWidth,
      platformHeight
    );
    this.tower.lineStyle(2, 0x4a2f1a, 1);
    this.tower.strokeRect(
      -platformWidth / 2,
      platformY,
      platformWidth,
      platformHeight
    );

    // Brazier/fire bowl
    this.tower.lineStyle(2, 0x8b4513, 1);
    this.tower.fillStyle(0xa0522d, 1);
    this.tower.beginPath();
    this.tower.moveTo(-20, platformY);
    this.tower.lineTo(-15, platformY - 10);
    this.tower.lineTo(15, platformY - 10);
    this.tower.lineTo(20, platformY);
    this.tower.closePath();
    this.tower.fillPath();
    this.tower.strokePath();

    // Scale in animation
    this.tower.setScale(0);
    this.scene.tweens.add({
      targets: this.tower,
      scale: 1,
      duration: 400,
      ease: "Back.easeOut",
    });
  }

  /**
   * Create flame graphics
   */
  private createFlame(variant: "standard" | "gold"): void {
    const flameY = -50; // Position above brazier

    if (variant === "gold") {
      // Gold/white flame
      // Center white-hot core
      this.flame.fillStyle(0xffffff, 1);
      this.flame.fillTriangle(0, flameY - 30, -8, flameY, 8, flameY);

      // Golden middle layer
      this.flame.fillStyle(0xffd700, 0.9);
      this.flame.fillTriangle(0, flameY - 35, -12, flameY, 12, flameY);

      // Outer orange glow
      this.flame.fillStyle(0xff8c00, 0.7);
      this.flame.fillTriangle(0, flameY - 38, -15, flameY, 15, flameY);
    } else {
      // Standard orange/red flame
      // Red core
      this.flame.fillStyle(0xff4500, 1);
      this.flame.fillTriangle(0, flameY - 25, -8, flameY, 8, flameY);

      // Orange middle
      this.flame.fillStyle(0xff8c00, 0.9);
      this.flame.fillTriangle(0, flameY - 30, -12, flameY, 12, flameY);

      // Yellow tips
      this.flame.fillStyle(0xffff00, 0.7);
      this.flame.fillTriangle(0, flameY - 33, -10, flameY - 10, 10, flameY - 10);
    }
  }

  /**
   * Ignite the flame with animation
   */
  private igniteFlame(variant: "standard" | "gold", onComplete: () => void): void {
    // Flash of ignition
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffff00, 0.8);
    flash.fillCircle(0, -50, 30);
    this.container.add(flash);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => {
        flash.destroy();
      },
    });

    // Fade in flame
    this.scene.tweens.add({
      targets: this.flame,
      alpha: 1,
      duration: 400,
      ease: "Sine.easeIn",
      onComplete: () => {
        // Flickering animation
        this.flickerFlame(variant);
        onComplete();
      },
    });
  }

  /**
   * Create flickering effect on flame
   */
  private flickerFlame(variant: "standard" | "gold"): void {
    const flickerIntensity = variant === "gold" ? 1.1 : 1.05;

    this.scene.tweens.add({
      targets: this.flame,
      scaleX: flickerIntensity,
      scaleY: flickerIntensity,
      duration: 200,
      yoyo: true,
      repeat: variant === "gold" ? 5 : 3,
      ease: "Sine.easeInOut",
    });

    // Slight rotation wobble
    this.scene.tweens.add({
      targets: this.flame,
      rotation: 0.1,
      duration: 150,
      yoyo: true,
      repeat: variant === "gold" ? 5 : 3,
      ease: "Sine.easeInOut",
    });
  }

  /**
   * Create golden glow (gold variant only)
   */
  private createGoldenGlow(): void {
    this.glow = this.scene.add.graphics();
    this.container.add(this.glow);

    // Multiple glow rings
    this.glow.fillStyle(0xffd700, 0.3);
    this.glow.fillCircle(0, -50, 60);
    this.glow.fillStyle(0xffd700, 0.2);
    this.glow.fillCircle(0, -50, 80);
    this.glow.fillStyle(0xffd700, 0.1);
    this.glow.fillCircle(0, -50, 100);

    // Pulsing glow
    this.scene.tweens.add({
      targets: this.glow,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut",
    });
  }

  /**
   * Create golden particle burst (gold variant only)
   */
  private createGoldenParticles(): void {
    const particleCount = 30;
    const centerX = this.container.x;
    const centerY = this.container.y - 50;

    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(0xffd700, 1);
      particle.fillCircle(0, 0, 4);

      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 50 + Math.random() * 50;
      const targetX = centerX + Math.cos(angle) * speed;
      const targetY = centerY + Math.sin(angle) * speed - Math.random() * 30;

      particle.setPosition(centerX, centerY);
      particle.setDepth(1001);

      this.particles.push(particle);

      // Animate particle outward
      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.5,
        duration: 1000 + Math.random() * 500,
        ease: "Cubic.easeOut",
        onComplete: () => {
          particle.destroy();
        },
      });
    }

    // Add upward floating embers
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const ember = this.scene.add.graphics();
        ember.fillStyle(0xff8c00, 0.8);
        ember.fillCircle(0, 0, 2);

        const offsetX = (Math.random() - 0.5) * 20;
        ember.setPosition(centerX + offsetX, centerY);
        ember.setDepth(1001);

        this.particles.push(ember);

        this.scene.tweens.add({
          targets: ember,
          y: centerY - 100,
          x: centerX + offsetX + (Math.random() - 0.5) * 30,
          alpha: 0,
          duration: 2000,
          ease: "Sine.easeOut",
          onComplete: () => {
            ember.destroy();
          },
        });
      }, i * 100);
    }
  }

  /**
   * Clean up and destroy all graphics
   */
  private destroy(): void {
    this.tower.destroy();
    this.flame.destroy();
    if (this.glow) this.glow.destroy();
    this.particles.forEach((p) => {
      if (p && !p.scene) return; // Already destroyed
      p.destroy();
    });
    this.container.destroy();
  }
}
