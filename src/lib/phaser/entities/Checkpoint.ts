// /**
//  * Checkpoint.ts
//  *
//  * CheckpointNode — a Phaser Container representing a single checkpoint on the
//  * Interactive Ideas world-map. Manages status-driven textures, tween animations,
//  * and progress indicators without destroying or recreating the object on state
//  * transitions.
//  */

// import * as Phaser from "phaser";

// // ─────────────────────────────────────────────────────────────────────────────
// // Exported types
// // ─────────────────────────────────────────────────────────────────────────────

// /**
//  * The five mutually-exclusive visual states a checkpoint can occupy.
//  */
// export type CheckpointStatus =
//   | "locked"
//   | "active"
//   | "in_progress"
//   | "completed"
//   | "gold";

// /**
//  * All data required to construct a {@link CheckpointNode}.
//  */
// export interface CheckpointConfig {
//   /** Unique identifier — matches the Convex checkpoint document `_id`. */
//   id: string;
//   /** Parent stage index (1–8). */
//   stage: number;
//   /** Checkpoint index within its stage (1-based). */
//   checkpoint: number;
//   /** Initial visual status. */
//   status: CheckpointStatus;
//   /** World-space X coordinate (scene pixels). */
//   x: number;
//   /** World-space Y coordinate (scene pixels). */
//   y: number;
//   /** Sub-task 1 completion flag. */
//   t1: boolean;

//   t2: boolean;
//   /** Sub-task 3 completion flag. */
//   t3: boolean;
//   /** The 1-based global checkpoint number (1 to 36) */
//   globalIndex: number;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // CheckpointNode
// // ─────────────────────────────────────────────────────────────────────────────

// /**
//  * A Phaser Container that renders a single checkpoint node on the world map.
//  *
//  * @example
//  * const node = new CheckpointNode(this, {
//  *   id: 'cp_001', stage: 1, checkpoint: 1,
//  *   status: 'active', x: 400, y: 300,
//  *   t1: false, t2: false, t3: false,
//  * });
//  * node.setInteractive();
//  * this.events.on('checkpoint_clicked', (payload) => console.log(payload));
//  */
// export class CheckpointNode extends Phaser.GameObjects.Container {
//   // ── Identity ──────────────────────────────────────────────────────────────

//   readonly checkpointId: string;
//   readonly stage: number;
//   readonly checkpoint: number;

//   // ── Private state ─────────────────────────────────────────────────────────

//   private _status: CheckpointStatus;

//   // ── Public getters ────────────────────────────────────────────────────────

//   /**
//    * Get the current status of this checkpoint
//    */
//   get status(): CheckpointStatus {
//     return this._status;
//   }
//   private mainSprite: Phaser.GameObjects.Image;
//   private pulseRing: Phaser.GameObjects.Arc;
//   private glowCircle: Phaser.GameObjects.Arc;
//   private numberText: Phaser.GameObjects.Text;
//   private pulseTween: Phaser.Tweens.Tween | null = null;
//   private shimmerTween: Phaser.Tweens.Tween | null = null;

//   // ── Constructor ───────────────────────────────────────────────────────────

//   /**
//    * @param scene  The Phaser Scene this node belongs to.
//    * @param config Full checkpoint configuration including position and status.
//    */
//   constructor(scene: Phaser.Scene, config: CheckpointConfig) {
//     super(scene, config.x, config.y);

//     this.checkpointId = config.id;
//     this.stage = config.stage;
//     this.checkpoint = config.checkpoint;
//     this._status = config.status;

//     // ── Glow circle (behind everything) ─────────────────────────────────────
//     this.glowCircle = new Phaser.GameObjects.Arc(
//       scene, 0, 0, 48, 0, 360, false, 0xe8003d, 0.35,
//     );
//     this.glowCircle.setVisible(false);

//     // ── Pulse ring (animated for active state) ─────────────────────────────
//     this.pulseRing = new Phaser.GameObjects.Arc(
//       scene, 0, 0, 42, 0, 360, false, 0xff4081, 0.5,
//     );
//     this.pulseRing.setStrokeStyle(4, 0xffffff, 0.9);
//     this.pulseRing.setVisible(false);

//     // ── Main sprite (64×64 checkpoint texture) ──────────────────────────────
//     this.mainSprite = new Phaser.GameObjects.Image(
//       scene,
//       0,
//       0,
//       `cp_${config.status}`,
//     );
//     this.mainSprite.setOrigin(0.5, 0.5);

//     // ── Global Number Text (large white bold inside button) ─────────────────
//     this.numberText = new Phaser.GameObjects.Text(
//       scene, 0, 2,
//       `${config.globalIndex}`,
//       {
//         fontSize: "22px",
//         fontFamily: '"Fredoka One", "Comic Sans MS", Impact, cursive',
//         color: "#ffffff",
//         align: "center",
//         fontStyle: "bold",
//         stroke: "#7f0020",
//         strokeThickness: 3,
//       },
//     );
//     this.numberText.setOrigin(0.5, 0.5);

//     // ── Assemble container ──────────────────────────────────────────────────
//     this.add([
//       this.glowCircle,
//       this.pulseRing,
//       this.mainSprite,
//       this.numberText,
//     ]);

//     scene.add.existing(this);

//     // Apply initial visual state
//     this.applyStatusVisuals();
//   }

//   // ── Public API ────────────────────────────────────────────────────────────

//   /**
//    * Transitions the node to a new status, updating all visuals and animations.
//    *
//    * @param status The new checkpoint status.
//    */
//   updateStatus(status: CheckpointStatus): void {
//     if (this._status === status) return;
//     this._status = status;
//     this.applyStatusVisuals();
//   }

//   /**
//    * Updates progress visual states (no-op for new design)
//    */
//   updateProgressDots(t1: boolean, t2: boolean, t3: boolean, isGold = false): void {
//     // Progress stars disabled in favor of purely numbered map nodes
//   }

//   /**
//    * Get the absolute world position of this checkpoint node.
//    *
//    * @returns Object with x and y world coordinates.
//    */
//   getWorldPosition(): { x: number; y: number } {
//     return { x: this.x, y: this.y };
//   }

//   /**
//    * Activates pointer input on this node and wires up event listeners.
//    *
//    * Emits `'checkpoint_clicked'` on the scene's event bus with a payload of
//    * `{ id, stage, checkpoint }` whenever the user clicks or taps the node.
//    */
//   override setInteractive(): this {
//     // Register a circular hit area matching the 80 px diameter sprite
//     super.setInteractive(
//       new Phaser.Geom.Circle(0, 0, 40),
//       Phaser.Geom.Circle.Contains,
//     );

//     // Click / tap
//     this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
//       this.scene.events.emit("checkpoint_clicked", {
//         id: this.checkpointId,
//         stage: this.stage,
//         checkpoint: this.checkpoint,
//       });
//     });

//     // Hover in
//     this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
//       this.mainSprite.setScale(1.12);
//       this.numberText.setStyle({ color: "#fde68a" });
//       if (typeof document !== "undefined") {
//         document.body.style.cursor = "pointer";
//       }
//     });

//     // Hover out
//     this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
//       this.mainSprite.setScale(1.0);
//       this.numberText.setStyle({ color: "#ffffff" });
//       if (typeof document !== "undefined") {
//         document.body.style.cursor = "default";
//       }
//     });

//     return this;
//   }

//   // ── Private: animations ───────────────────────────────────────────────────

//   /**
//    * Starts the active-state pulse animation on the pulse ring.
//    */
//   private startPulse(): void {
//     this.pulseTween?.stop();
//     this.pulseRing.setVisible(true);

//     this.pulseTween = this.scene.tweens.add({
//       targets: this.pulseRing,
//       alpha: { from: 0.2, to: 0.7 },
//       scaleX: { from: 1.0, to: 1.2 },
//       scaleY: { from: 1.0, to: 1.2 },
//       duration: 800,
//       ease: Phaser.Math.Easing.Sine.InOut,
//       yoyo: true,
//       repeat: -1,
//     });
//   }

//   /**
//    * Starts the gold-shimmer tween on the main sprite.
//    */
//   private startGoldShimmer(): void {
//     this.shimmerTween?.stop();

//     const startColor = Phaser.Display.Color.IntegerToColor(0xf59e0b);
//     const endColor = Phaser.Display.Color.IntegerToColor(0xfef08a);

//     const counter = { t: 0 };

//     this.shimmerTween = this.scene.tweens.add({
//       targets: counter,
//       t: 1,
//       duration: 1500,
//       ease: Phaser.Math.Easing.Sine.InOut,
//       yoyo: true,
//       repeat: -1,
//       onUpdate: () => {
//         const t = counter.t;
//         const r = Math.round(
//           Phaser.Math.Linear(startColor.red, endColor.red, t),
//         );
//         const g = Math.round(
//           Phaser.Math.Linear(startColor.green, endColor.green, t),
//         );
//         const b = Math.round(
//           Phaser.Math.Linear(startColor.blue, endColor.blue, t),
//         );
//         this.mainSprite.setTint(Phaser.Display.Color.GetColor(r, g, b));
//       },
//     });
//   }

//   /**
//    * Stops all running tweens and resets visuals.
//    */
//   private stopAnimations(): void {
//     if (this.pulseTween) {
//       this.pulseTween.stop();
//       this.pulseTween = null;
//     }
//     if (this.shimmerTween) {
//       this.shimmerTween.stop();
//       this.shimmerTween = null;
//     }

//     this.pulseRing.setVisible(false);
//     this.glowCircle.setVisible(false);
//     this.mainSprite.setScale(1.0);
//     this.mainSprite.setAlpha(1.0);
//     this.mainSprite.clearTint();
//   }

//   // ── Private: visual state ─────────────────────────────────────────────────

//   /**
//    * Applies the full visual treatment for the current status.
//    */
//   private applyStatusVisuals(): void {
//     this.stopAnimations();

//     // Swap to the matching texture
//     this.mainSprite.setTexture(`cp_${this._status}`);

//     switch (this._status) {
//       case "locked":
//         this.mainSprite.setAlpha(0.55);
//         this.numberText.setStyle({ color: "#94a3b8" });
//         break;

//       case "active":
//         this.mainSprite.setAlpha(1.0);
//         this.numberText.setStyle({ color: "#ffffff" });
//         this.startPulse();
//         break;

//       case "in_progress":
//         this.mainSprite.setAlpha(0.9);
//         this.numberText.setStyle({ color: "#ffffff" });
//         break;

//       case "completed":
//         this.mainSprite.setAlpha(1.0);
//         this.numberText.setStyle({ color: "#fde68a" });
//         break;

//       case "gold":
//         this.mainSprite.setAlpha(1.0);
//         this.numberText.setStyle({ color: "#ffffff" });
//         this.startGoldShimmer();
//         // glowCircle kept hidden — the shimmer tint is enough visual feedback
//         break;
//     }
//   }
// }

/**
 * Checkpoint.ts
 *
 * CheckpointNode — a Phaser Container representing a single checkpoint on the
 * Interactive Ideas world-map.
 *
 * Theme: Dark Tech Platform
 * Active: Indigo glow + pulse ring
 * Gold:   Amber shimmer
 * Locked: Muted slate
 * Complete: Indigo-gold gradient button
 */

import * as Phaser from "phaser";

// ─────────────────────────────────────────────────────────────────────────────
// Exported types
// ─────────────────────────────────────────────────────────────────────────────

export type CheckpointStatus =
  | "locked"
  | "active"
  | "in_progress"
  | "partial"
  | "completed"
  | "gold";

export interface CheckpointConfig {
  id: string;
  stage: number;
  checkpoint: number;
  status: CheckpointStatus;
  x: number;
  y: number;
  t1: boolean;
  t2: boolean;
  t3: boolean;
  /** 1-based global checkpoint number across all stages */
  globalIndex: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CheckpointNode
// ─────────────────────────────────────────────────────────────────────────────

export class CheckpointNode extends Phaser.GameObjects.Container {
  readonly checkpointId: string;
  readonly stage: number;
  readonly checkpoint: number;

  private _status: CheckpointStatus;

  get status(): CheckpointStatus {
    return this._status;
  }

  private mainSprite: Phaser.GameObjects.Image;

  /**
   * Outer glow ring — indigo for active, amber for gold, hidden otherwise.
   * Rendered as a fat-stroked circle outside the button.
   */
  private glowRing: Phaser.GameObjects.Arc;

  /**
   * Inner pulse ring — animated scale+alpha tween on "active" state.
   */
  private pulseRing: Phaser.GameObjects.Arc;

  /** Stage + checkpoint label (e.g. "1-1", "2-3") */
  private stageLabel: Phaser.GameObjects.Text;

  /** Global sequential number shown inside the button */
  private numberText: Phaser.GameObjects.Text;

  /** Small stage indicator dot above the button */
  private stageDot: Phaser.GameObjects.Arc;

  private pulseTween: Phaser.Tweens.Tween | null = null;
  private shimmerTween: Phaser.Tweens.Tween | null = null;

  // Website palette constants kept local for readability
  private static readonly C = {
    bg: 0x0f0f1a,
    surface: 0x1a1a2e,
    indigo: 0x6366f1,
    indigoLight: 0x818cf8,
    indigoDark: 0x4f46e5,
    purple: 0x8b5cf6,
    cyan: 0x06b6d4,
    amber: 0xf59e0b,
    amberLight: 0xfcd34d,
    slate: 0x475569,
    slateDim: 0x334155,
    white: 0xffffff,
    gold: 0xfbbf24,
  };

  constructor(scene: Phaser.Scene, config: CheckpointConfig) {
    super(scene, config.x, config.y);

    this.checkpointId = config.id;
    this.stage = config.stage;
    this.checkpoint = config.checkpoint;
    this._status = config.status;

    const C = CheckpointNode.C;

    // ── Premium depth shadow (creates 3D effect) ────────────────────────────
    const shadow = new Phaser.GameObjects.Arc(
      scene,
      2,
      4,
      46,
      0,
      360,
      false,
      0x000000,
      0.4,
    );
    shadow.setStrokeStyle(2, 0x000000, 0.2);
    this.add(shadow);

    // ── Outer premium frame (Sokoban-style border) ──────────────────────────
    const outerFrame = scene.add.graphics();
    outerFrame.lineStyle(4, 0x18181b, 1); // Zinc 900
    outerFrame.strokeCircle(0, 0, 50);
    outerFrame.lineStyle(2, C.indigoLight, 0.4);
    outerFrame.strokeCircle(0, 0, 48);
    this.add(outerFrame);

    // ── Inner decorative ring ───────────────────────────────────────────────
    const innerRing = scene.add.graphics();
    
    // Premium Gradient Island Base
    innerRing.fillGradientStyle(
      C.indigoDark, C.indigoDark, C.indigo, C.indigo, 1
    );
    innerRing.fillCircle(0, 0, 42);
    
    // Shoreline highlight (3D edge)
    innerRing.lineStyle(2, 0xffffff, 0.1);
    innerRing.strokeCircle(0, 0, 42);
    
    this.add(innerRing);

    // ── Outer glow ring (hidden by default, shown for active / gold) ────────
    this.glowRing = new Phaser.GameObjects.Arc(
      scene,
      0,
      0,
      58,
      0,
      360,
      false,
      C.indigo,
      0,
    );
    this.glowRing.setStrokeStyle(8, C.indigoLight, 0.4);

    // ── Pulse ring ──────────────────────────────────────────────────────────
    this.pulseRing = new Phaser.GameObjects.Arc(
      scene,
      0,
      0,
      48,
      0,
      360,
      false,
      C.indigo,
      0.3,
    );
    this.pulseRing.setStrokeStyle(3, C.indigoLight, 0.6);
    this.pulseRing.setVisible(false);

    // ── Floating animation ──────────────────────────────────────────────────
    scene.tweens.add({
      targets: this,
      y: config.y - 5,
      duration: 2000 + Math.random() * 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: Math.random() * 2000
    });

    // ── Small stage indicator dot ──────────────────────────────────────────
    // Stage 1 → Indigo, Stage 2 → Purple, others → Cyan
    const stageDotColor =
      config.stage === 1 ? C.indigo : config.stage === 2 ? C.purple : C.cyan;
    this.stageDot = new Phaser.GameObjects.Arc(
      scene,
      0,
      -50,
      6,
      0,
      360,
      false,
      stageDotColor,
      1.0,
    );
    this.stageDot.setStrokeStyle(2, C.white, 0.4);

    // ── Main sprite (80×80 texture key: cp_<status>) ────────────────────────
    this.mainSprite = new Phaser.GameObjects.Image(
      scene,
      0,
      0,
      `cp_${config.status}`,
    );
    this.mainSprite.setOrigin(0.5, 0.5);

    // ── Global number text inside button ────────────────────────────────────
    this.numberText = new Phaser.GameObjects.Text(
      scene,
      0,
      1,
      `${config.globalIndex}`,
      {
        fontSize: "20px",
        fontFamily:
          '"Space Grotesk", "Plus Jakarta Sans", "Segoe UI", sans-serif',
        color: "#ffffff",
        align: "center",
        fontStyle: "bold",
        stroke: "#1e1b4b",
        strokeThickness: 3,
      },
    );
    this.numberText.setOrigin(0.5, 0.5);

    // ── Stage.Checkpoint label below the button ─────────────────────────────
    this.stageLabel = new Phaser.GameObjects.Text(
      scene,
      0,
      50,
      `${config.stage}.${config.checkpoint}`,
      {
        fontSize: "10px",
        fontFamily: '"Space Mono", monospace',
        color: "#64748b",
        align: "center",
      },
    );
    this.stageLabel.setOrigin(0.5, 0.5);

    // ── Assemble ─────────────────────────────────────────────────────────────
    this.add([
      this.glowRing,
      this.pulseRing,
      this.mainSprite,
      this.stageDot,
      this.stageLabel,
      this.numberText,
    ]);

    // ── Interactive hover effects ───────────────────────────────────────────
    this.setSize(100, 100);
    this.setInteractive();

    this.on("pointerover", () => {
      if (this._status !== "locked") {
        this.scene.tweens.add({
          targets: this,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 200,
          ease: "Back.easeOut",
        });
        this.glowRing.setStrokeStyle(8, C.indigoLight, 0.8);
      }
    });

    this.on("pointerout", () => {
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 150,
        ease: "Quad.easeOut",
      });
      if (this._status === "active") {
        this.glowRing.setStrokeStyle(6, C.indigoLight, 0.5);
      } else {
        this.glowRing.setStrokeStyle(0);
      }
    });

    this.on("pointerdown", () => {
      if (this._status !== "locked") {
        this.scene.tweens.add({
          targets: this,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 100,
          yoyo: true,
          ease: "Quad.easeOut",
        });
      }
    });

    scene.add.existing(this);
    this.applyStatusVisuals();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  updateStatus(status: CheckpointStatus): void {
    if (this._status === status) return;
    this._status = status;
    this.applyStatusVisuals();
  }

  /** No-op — progress dots replaced by numbered style */
  updateProgressDots(
    _t1: boolean,
    _t2: boolean,
    _t3: boolean,
    _isGold = false,
  ): void {}

  getWorldPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  override setInteractive(): this {
    super.setInteractive(
      new Phaser.Geom.Circle(0, 0, 40),
      Phaser.Geom.Circle.Contains,
    );

    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      console.log(`[Phaser] CheckpointNode pointerup: ${this.checkpointId}`);
      this.scene.events.emit("checkpoint_clicked", {
        id: this.checkpointId,
        stage: this.stage,
        checkpoint: this.checkpoint,
      });
    });

    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      this.mainSprite.setScale(1.1);
      this.numberText.setStyle({ color: "#e0e7ff" });
      if (typeof document !== "undefined")
        document.body.style.cursor = "pointer";
    });

    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      this.mainSprite.setScale(1.0);
      this.numberText.setStyle({ color: "#ffffff" });
      if (typeof document !== "undefined")
        document.body.style.cursor = "default";
    });

    return this;
  }

  // ── Private: animations ───────────────────────────────────────────────────

  private startPulse(): void {
    this.pulseTween?.stop();
    this.pulseRing.setVisible(true);
    this.pulseRing.setAlpha(0.5);
    this.pulseRing.setScale(1.0);

    this.pulseTween = this.scene.tweens.add({
      targets: this.pulseRing,
      alpha: { from: 0.15, to: 0.6 },
      scaleX: { from: 0.95, to: 1.25 },
      scaleY: { from: 0.95, to: 1.25 },
      duration: 900,
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
    });
  }

  private startGoldShimmer(): void {
    this.shimmerTween?.stop();
    const start = Phaser.Display.Color.IntegerToColor(CheckpointNode.C.amber);
    const end = Phaser.Display.Color.IntegerToColor(
      CheckpointNode.C.amberLight,
    );
    const counter = { t: 0 };

    this.shimmerTween = this.scene.tweens.add({
      targets: counter,
      t: 1,
      duration: 1400,
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        const r = Math.round(Phaser.Math.Linear(start.red, end.red, counter.t));
        const g = Math.round(
          Phaser.Math.Linear(start.green, end.green, counter.t),
        );
        const b = Math.round(
          Phaser.Math.Linear(start.blue, end.blue, counter.t),
        );
        this.mainSprite.setTint(Phaser.Display.Color.GetColor(r, g, b));
      },
    });
  }

  private stopAnimations(): void {
    this.pulseTween?.stop();
    this.pulseTween = null;
    this.shimmerTween?.stop();
    this.shimmerTween = null;

    this.pulseRing.setVisible(false);
    this.mainSprite.setScale(1.0);
    this.mainSprite.setAlpha(1.0);
    this.mainSprite.clearTint();
  }

  // ── Private: visual state ─────────────────────────────────────────────────

  private applyStatusVisuals(): void {
    this.stopAnimations();
    this.mainSprite.setTexture(
      `cp_${this._status === "partial" ? "in_progress" : this._status}`,
    );

    const C = CheckpointNode.C;

    switch (this._status) {
      case "locked":
        this.mainSprite.setAlpha(0.45);
        this.numberText.setStyle({ color: "#475569" });
        this.stageLabel.setStyle({ color: "#334155" });
        this.stageDot.setAlpha(0.3);
        this.glowRing.setAlpha(0);
        break;

      case "active":
        this.mainSprite.setAlpha(1.0);
        this.numberText.setStyle({ color: "#ffffff" });
        this.stageLabel.setStyle({ color: "#818cf8" });
        this.stageDot.setAlpha(1.0);
        // Show the glow ring softly
        this.glowRing.setFillStyle(C.indigo, 0.2);
        this.glowRing.setAlpha(1);
        this.startPulse();
        break;

      case "in_progress":
        this.mainSprite.setAlpha(0.92);
        this.numberText.setStyle({ color: "#ffffff" });
        this.stageLabel.setStyle({ color: "#fcd34d" });
        this.stageDot.setAlpha(1.0);
        this.glowRing.setFillStyle(C.amber, 0.12);
        this.glowRing.setAlpha(1);
        break;

      case "partial":
        // One or two tasks completed — amber partial glow
        this.mainSprite.setAlpha(0.96);
        this.numberText.setStyle({ color: "#ffffff" });
        this.stageLabel.setStyle({ color: "#fbbf24" });
        this.stageDot.setAlpha(1.0);
        this.glowRing.setFillStyle(C.amber, 0.18);
        this.glowRing.setAlpha(1);
        break;

      case "completed":
        this.mainSprite.setAlpha(1.0);
        this.numberText.setStyle({ color: "#e0e7ff" });
        this.stageLabel.setStyle({ color: "#6366f1" });
        this.stageDot.setAlpha(1.0);
        this.glowRing.setAlpha(0);
        break;

      case "gold":
        this.mainSprite.setAlpha(1.0);
        this.numberText.setStyle({ color: "#1c1917" });
        this.stageLabel.setStyle({ color: "#f59e0b" });
        this.stageDot.setFillStyle(C.gold, 1);
        this.stageDot.setAlpha(1.0);
        this.glowRing.setFillStyle(C.amber, 0.25);
        this.glowRing.setAlpha(1);
        this.startGoldShimmer();
        break;
    }
  }
}
