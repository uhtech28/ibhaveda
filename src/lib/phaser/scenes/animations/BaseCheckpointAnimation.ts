import * as Phaser from "phaser";

export type AnimationVariant = "standard" | "gold";

export interface AnimationConfig {
  x: number;
  y: number;
  variant: AnimationVariant;
  onComplete?: () => void;
  onSkip?: () => void;
}

export abstract class BaseCheckpointAnimation {
  protected scene: Phaser.Scene;
  protected config: AnimationConfig;
  protected container: Phaser.GameObjects.Container;
  protected isComplete = false;
  protected isSkipped = false;
  protected skipTimer: Phaser.Time.TimerEvent | null = null;
  protected mainTween: Phaser.Tweens.Tween | null = null;

  protected readonly STANDARD_DURATION = 2000;
  protected readonly GOLD_DURATION = 3000;
  protected readonly SKIP_DELAY = 500;

  constructor(scene: Phaser.Scene, config: AnimationConfig) {
    this.scene = scene;
    this.config = config;
    this.container = scene.add.container(config.x, config.y);
  }

  abstract create(): void;

  play(): void {
    this.create();
    this.startSkipTimer();
  }

  protected get duration(): number {
    return this.config.variant === "gold" ? this.GOLD_DURATION : this.STANDARD_DURATION;
  }

  protected getPrimaryColor(): number {
    return this.config.variant === "gold" ? 0xf59e0b : 0x3b82f6;
  }

  protected getSecondaryColor(): number {
    return this.config.variant === "gold" ? 0xfef08a : 0x60a5fa;
  }

  protected getGlowColor(): number {
    return this.config.variant === "gold" ? 0xffd700 : 0x6366f1;
  }

  protected startSkipTimer(): void {
    this.skipTimer = this.scene.time.delayedCall(this.SKIP_DELAY, () => {
      if (!this.isComplete) {
        this.config.onSkip?.();
      }
    });
  }

  complete(): void {
    if (this.isComplete) return;
    this.isComplete = true;
    this.stopTweens();
    this.config.onComplete?.();
  }

  skip(): void {
    if (this.isSkipped || this.isComplete) return;
    this.isSkipped = true;
    this.stopTweens();
    this.config.onSkip?.();
  }

  protected stopTweens(): void {
    if (this.skipTimer) {
      this.skipTimer.remove();
      this.skipTimer = null;
    }
    if (this.mainTween) {
      this.mainTween.stop();
      this.mainTween = null;
    }
  }

  destroy(): void {
    this.stopTweens();
    this.container.destroy();
  }
}