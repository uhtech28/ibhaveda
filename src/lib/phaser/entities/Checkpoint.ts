/**
 * Checkpoint.ts
 *
 * CheckpointNode — a Phaser Container representing a single checkpoint on the
 * Interactive Ideas world-map. Manages status-driven textures, tween animations,
 * and progress indicators without destroying or recreating the object on state
 * transitions.
 */

import * as Phaser from "phaser";

// ─────────────────────────────────────────────────────────────────────────────
// Exported types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The five mutually-exclusive visual states a checkpoint can occupy.
 */
export type CheckpointStatus =
  | "locked"
  | "active"
  | "in_progress"
  | "completed"
  | "gold";

/**
 * All data required to construct a {@link CheckpointNode}.
 */
export interface CheckpointConfig {
  /** Unique identifier — matches the Convex checkpoint document `_id`. */
  id: string;
  /** Parent stage index (1–8). */
  stage: number;
  /** Checkpoint index within its stage (1-based). */
  checkpoint: number;
  /** Initial visual status. */
  status: CheckpointStatus;
  /** World-space X coordinate (scene pixels). */
  x: number;
  /** World-space Y coordinate (scene pixels). */
  y: number;
  /** Sub-task 1 completion flag. */
  t1: boolean;
  /** Sub-task 2 completion flag. */
  t2: boolean;
  /** Sub-task 3 completion flag. */
  t3: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// CheckpointNode
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A Phaser Container that renders a single checkpoint node on the world map.
 *
 * @example
 * const node = new CheckpointNode(this, {
 *   id: 'cp_001', stage: 1, checkpoint: 1,
 *   status: 'active', x: 400, y: 300,
 *   t1: false, t2: false, t3: false,
 * });
 * node.setInteractive();
 * this.events.on('checkpoint_clicked', (payload) => console.log(payload));
 */
export class CheckpointNode extends Phaser.GameObjects.Container {
  // ── Identity ──────────────────────────────────────────────────────────────

  readonly checkpointId: string;
  readonly stage: number;
  readonly checkpoint: number;

  // ── Private state ─────────────────────────────────────────────────────────

  private _status: CheckpointStatus;

  // ── Public getters ────────────────────────────────────────────────────────

  /**
   * Get the current status of this checkpoint
   */
  get status(): CheckpointStatus {
    return this._status;
  }
  private mainSprite: Phaser.GameObjects.Image;
  private pulseRing: Phaser.GameObjects.Arc;
  private glowCircle: Phaser.GameObjects.Arc;
  private labelText: Phaser.GameObjects.Text;
  private progressDots: Phaser.GameObjects.Arc[];
  private pulseTween: Phaser.Tweens.Tween | null = null;
  private shimmerTween: Phaser.Tweens.Tween | null = null;

  // ── Constructor ───────────────────────────────────────────────────────────

  /**
   * @param scene  The Phaser Scene this node belongs to.
   * @param config Full checkpoint configuration including position and status.
   */
  constructor(scene: Phaser.Scene, config: CheckpointConfig) {
    super(scene, config.x, config.y);

    this.checkpointId = config.id;
    this.stage = config.stage;
    this.checkpoint = config.checkpoint;
    this._status = config.status;

    // ── Glow circle (behind everything) ─────────────────────────────────────
    this.glowCircle = new Phaser.GameObjects.Arc(
      scene,
      0,
      0,
      40,
      0,
      360,
      false,
      0x3b82f6,
      0.3,
    );
    this.glowCircle.setVisible(false);

    // ── Pulse ring (animated for active state) ─────────────────────────────
    this.pulseRing = new Phaser.GameObjects.Arc(
      scene,
      0,
      0,
      35,
      0,
      360,
      false,
      0x3b82f6,
      0.5,
    );
    this.pulseRing.setStrokeStyle(3, 0x3b82f6, 0.8);
    this.pulseRing.setVisible(false);

    // ── Main sprite (64×64 checkpoint texture) ──────────────────────────────
    this.mainSprite = new Phaser.GameObjects.Image(
      scene,
      0,
      0,
      `cp_${config.status}`,
    );
    this.mainSprite.setOrigin(0.5, 0.5);

    // ── Progress dots (T1, T2, T3) ──────────────────────────────────────────
    this.progressDots = [];
    const dotSpacing = 14;
    const dotY = 46;
    const startX = -dotSpacing;

    for (let i = 0; i < 3; i++) {
      const dot = new Phaser.GameObjects.Arc(
        scene,
        startX + i * dotSpacing,
        dotY,
        6,
        0,
        360,
        false,
        0x374151,
      );
      this.progressDots.push(dot);
    }

    // Update progress dot colors based on config
    this.updateProgressDots(config.t1, config.t2, config.t3);

    // ── Label text ──────────────────────────────────────────────────────────
    this.labelText = new Phaser.GameObjects.Text(
      scene,
      0,
      62,
      `S${config.stage}·C${config.checkpoint}`,
      {
        fontSize: "11px",
        fontFamily: '"Courier New", Courier, monospace',
        color: "#94A3B8",
        align: "center",
        stroke: "#0a0a14",
        strokeThickness: 3,
      },
    );
    this.labelText.setOrigin(0.5, 0);

    // ── Assemble container ──────────────────────────────────────────────────
    this.add([
      this.glowCircle,
      this.pulseRing,
      this.mainSprite,
      ...this.progressDots,
      this.labelText,
    ]);

    scene.add.existing(this);

    // Apply initial visual state
    this.applyStatusVisuals();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Transitions the node to a new status, updating all visuals and animations.
   *
   * @param status The new checkpoint status.
   */
  updateStatus(status: CheckpointStatus): void {
    if (this._status === status) return;
    this._status = status;
    this.applyStatusVisuals();
  }

  /**
   * Update the progress dots to reflect task completion.
   *
   * @param t1 Task 1 completion.
   * @param t2 Task 2 completion.
   * @param t3 Task 3 completion.
   * @param isGold Optional flag indicating if checkpoint is gold status.
   */
  updateProgressDots(
    t1: boolean,
    t2: boolean,
    t3: boolean,
    isGold = false,
  ): void {
    const tasks = [t1, t2, t3];

    for (let i = 0; i < 3; i++) {
      const dot = this.progressDots[i];
      if (!dot) continue;

      if (tasks[i]) {
        // Completed task
        dot.setFillStyle(isGold ? 0xf59e0b : 0x22c55e);
      } else {
        // Incomplete task
        dot.setFillStyle(0x374151);
      }
    }
  }

  /**
   * Activates pointer input on this node and wires up event listeners.
   *
   * Emits `'checkpoint_clicked'` on the scene's event bus with a payload of
   * `{ id, stage, checkpoint }` whenever the user clicks or taps the node.
   */
  override setInteractive(): this {
    // Register a circular hit area matching the 64 px diameter sprite
    super.setInteractive(
      new Phaser.Geom.Circle(0, 0, 32),
      Phaser.Geom.Circle.Contains,
    );

    // Click / tap
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.scene.events.emit("checkpoint_clicked", {
        id: this.checkpointId,
        stage: this.stage,
        checkpoint: this.checkpoint,
      });
    });

    // Hover in
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      this.mainSprite.setScale(1.1);
      if (typeof document !== "undefined") {
        document.body.style.cursor = "pointer";
      }
    });

    // Hover out
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      this.mainSprite.setScale(1.0);
      if (typeof document !== "undefined") {
        document.body.style.cursor = "default";
      }
    });

    return this;
  }

  // ── Private: animations ───────────────────────────────────────────────────

  /**
   * Starts the active-state pulse animation on the pulse ring.
   */
  private startPulse(): void {
    this.pulseTween?.stop();
    this.pulseRing.setVisible(true);

    this.pulseTween = this.scene.tweens.add({
      targets: this.pulseRing,
      alpha: { from: 0.3, to: 0.8 },
      scaleX: { from: 1.0, to: 1.4 },
      scaleY: { from: 1.0, to: 1.4 },
      duration: 900,
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Starts the gold-shimmer tween on the main sprite.
   */
  private startGoldShimmer(): void {
    this.shimmerTween?.stop();

    const startColor = Phaser.Display.Color.IntegerToColor(0xf59e0b);
    const endColor = Phaser.Display.Color.IntegerToColor(0xfef08a);

    const counter = { t: 0 };

    this.shimmerTween = this.scene.tweens.add({
      targets: counter,
      t: 1,
      duration: 1500,
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        const t = counter.t;
        const r = Math.round(
          Phaser.Math.Linear(startColor.red, endColor.red, t),
        );
        const g = Math.round(
          Phaser.Math.Linear(startColor.green, endColor.green, t),
        );
        const b = Math.round(
          Phaser.Math.Linear(startColor.blue, endColor.blue, t),
        );
        this.mainSprite.setTint(Phaser.Display.Color.GetColor(r, g, b));
      },
    });
  }

  /**
   * Stops all running tweens and resets visuals.
   */
  private stopAnimations(): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = null;
    }
    if (this.shimmerTween) {
      this.shimmerTween.stop();
      this.shimmerTween = null;
    }

    this.pulseRing.setVisible(false);
    this.glowCircle.setVisible(false);
    this.mainSprite.setScale(1.0);
    this.mainSprite.setAlpha(1.0);
    this.mainSprite.clearTint();
  }

  // ── Private: visual state ─────────────────────────────────────────────────

  /**
   * Applies the full visual treatment for the current status.
   */
  private applyStatusVisuals(): void {
    this.stopAnimations();

    // Swap to the matching texture
    this.mainSprite.setTexture(`cp_${this._status}`);

    switch (this._status) {
      case "locked":
        this.mainSprite.setAlpha(0.72);
        this.labelText.setColor("#6B7280");
        break;

      case "active":
        this.mainSprite.setAlpha(1.0);
        this.labelText.setColor("#93C5FD");
        this.startPulse();
        break;

      case "in_progress":
        this.mainSprite.setAlpha(1.0);
        this.labelText.setColor("#FCD34D");
        break;

      case "completed":
        this.mainSprite.setAlpha(1.0);
        this.labelText.setColor("#4ADE80");
        break;

      case "gold":
        this.mainSprite.setAlpha(1.0);
        this.labelText.setColor("#FEF08A");
        this.startGoldShimmer();
        this.glowCircle.setVisible(true);
        this.glowCircle.setFillStyle(0xf59e0b, 0.25);
        break;
    }
  }
}
