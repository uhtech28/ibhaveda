import * as Phaser from "phaser";

/**
 * Compass Calibration Animation
 * Used for Stage 1 (Ideation) checkpoint crossings
 *
 * Standard (2/3 tasks): Compass needle spins and snaps to heading, fog lifts
 * Gold (3/3 tasks): Compass emits golden directional beam to next checkpoint
 */
export class CompassCalibrationAnimation {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private compass: Phaser.GameObjects.Graphics;
  private needle: Phaser.GameObjects.Graphics;
  private beam?: Phaser.GameObjects.Graphics;
  private particles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private fogOverlay?: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    variant: "standard" | "gold",
    nextCheckpointX?: number,
    nextCheckpointY?: number
  ) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.compass = scene.add.graphics();
    this.needle = scene.add.graphics();

    // Set depth to render above everything
    this.container.setDepth(1000);
  }

  /**
   * Play the animation
   * Returns a promise that resolves when animation completes
   */
  public async play(
    variant: "standard" | "gold",
    nextCheckpointX?: number,
    nextCheckpointY?: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const duration = variant === "gold" ? 3000 : 2000;

      // Step 1: Create fog overlay (if standard)
      if (variant === "standard") {
        this.createFogOverlay();
      }

      // Step 2: Create compass base
      this.createCompassBase();

      // Step 3: Create needle
      this.createNeedle();

      // Add graphics to container
      if (this.fogOverlay) this.container.add(this.fogOverlay);
      this.container.add(this.compass);
      this.container.add(this.needle);

      // Step 4: Animate compass needle spinning
      this.animateNeedle(variant, () => {
        // Step 5: If gold, create beam
        if (variant === "gold" && nextCheckpointX && nextCheckpointY) {
          this.createBeam(nextCheckpointX, nextCheckpointY);
        }

        // Step 6: Lift fog
        this.liftFog(() => {
          // Animation complete
          setTimeout(() => {
            this.destroy();
            resolve();
          }, 500);
        });
      });
    });
  }

  /**
   * Create compass base (circular with cardinal directions)
   */
  private createCompassBase(): void {
    const radius = 60;

    // Outer circle (bronze/copper color)
    this.compass.lineStyle(4, 0x8b4513, 1);
    this.compass.fillStyle(0xf4a460, 0.9);
    this.compass.fillCircle(0, 0, radius);
    this.compass.strokeCircle(0, 0, radius);

    // Inner circle
    this.compass.lineStyle(2, 0x6b3410, 1);
    this.compass.strokeCircle(0, 0, radius - 10);

    // Cardinal direction markers (N, E, S, W)
    this.compass.lineStyle(2, 0x2c1810, 1);
    // North (top)
    this.compass.lineBetween(0, -radius + 5, 0, -radius + 15);
    // East (right)
    this.compass.lineBetween(radius - 15, 0, radius - 5, 0);
    // South (bottom)
    this.compass.lineBetween(0, radius - 15, 0, radius - 5);
    // West (left)
    this.compass.lineBetween(-radius + 5, 0, -radius + 15, 0);

    // Center pivot
    this.compass.fillStyle(0x2c1810, 1);
    this.compass.fillCircle(0, 0, 5);
  }

  /**
   * Create compass needle
   */
  private createNeedle(): void {
    // Red north-pointing arrow
    this.needle.fillStyle(0xdc143c, 1);
    this.needle.fillTriangle(0, -45, -6, 0, 6, 0);

    // White south-pointing arrow
    this.needle.fillStyle(0xffffff, 1);
    this.needle.fillTriangle(0, 45, -6, 0, 6, 0);

    // Initial random rotation
    this.needle.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
  }

  /**
   * Animate needle spinning and snapping to heading
   */
  private animateNeedle(variant: "standard" | "gold", onComplete: () => void): void {
    const targetRotation = Math.PI / 4; // 45 degrees (northeast)
    const spinDuration = variant === "gold" ? 1500 : 1000;

    // Spin multiple times before settling
    this.scene.tweens.add({
      targets: this.needle,
      rotation: targetRotation + Math.PI * 6, // 3 full rotations + target
      duration: spinDuration,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        // Snap to final position
        this.scene.tweens.add({
          targets: this.needle,
          rotation: targetRotation,
          duration: 200,
          ease: "Back.easeOut",
          onComplete: () => {
            // Pulse effect on snap
            this.scene.tweens.add({
              targets: this.needle,
              scaleX: 1.2,
              scaleY: 1.2,
              duration: 150,
              yoyo: true,
              onComplete,
            });
          },
        });
      },
    });
  }

  /**
   * Create fog overlay that will be lifted
   */
  private createFogOverlay(): void {
    this.fogOverlay = this.scene.add.graphics();

    // Create fog cloud around compass
    this.fogOverlay.fillStyle(0x808080, 0.6);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const distance = 80 + Math.random() * 20;
      const size = 30 + Math.random() * 20;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      this.fogOverlay.fillCircle(x, y, size);
    }
  }

  /**
   * Lift fog overlay
   */
  private liftFog(onComplete: () => void): void {
    if (this.fogOverlay) {
      this.scene.tweens.add({
        targets: this.fogOverlay,
        alpha: 0,
        duration: 800,
        ease: "Sine.easeOut",
        onComplete,
      });
    } else {
      onComplete();
    }
  }

  /**
   * Create directional beam (gold variant only)
   */
  private createBeam(targetX: number, targetY: number): void {
    this.beam = this.scene.add.graphics();
    this.container.add(this.beam);

    const dx = targetX - this.container.x;
    const dy = targetY - this.container.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Draw golden beam
    this.beam.lineStyle(8, 0xffd700, 0.8);
    this.beam.lineBetween(
      0,
      0,
      Math.cos(angle) * distance,
      Math.sin(angle) * distance
    );

    // Animate beam pulsing
    this.scene.tweens.add({
      targets: this.beam,
      alpha: 0.4,
      duration: 500,
      yoyo: true,
      repeat: 3,
    });

    // Add particle trail along beam
    this.createBeamParticles(angle, distance);
  }

  /**
   * Create golden particles along beam
   */
  private createBeamParticles(angle: number, distance: number): void {
    // Create simple particle effect using graphics
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(0xffd700, 1);
      particle.fillCircle(0, 0, 3);

      const particleDistance = (i / 20) * distance;
      const x = this.container.x + Math.cos(angle) * particleDistance;
      const y = this.container.y + Math.sin(angle) * particleDistance;

      particle.setPosition(x, y);
      particle.setDepth(999);

      // Animate particle
      this.scene.tweens.add({
        targets: particle,
        alpha: 0,
        scale: 2,
        duration: 1000,
        delay: i * 50,
        onComplete: () => {
          particle.destroy();
        },
      });
    }
  }

  /**
   * Clean up and destroy all graphics
   */
  private destroy(): void {
    this.compass.destroy();
    this.needle.destroy();
    if (this.beam) this.beam.destroy();
    if (this.fogOverlay) this.fogOverlay.destroy();
    this.container.destroy();
  }
}
