/**
 * Base class for mini-game scenes.
 *
 * Provides:
 *   - Shared lifecycle (start, complete, abandon)
 *   - Round timer rendering (optional — Decrypt is untimed)
 *   - A standardised hand-off to React via a single result callback
 *     supplied through scene data on `scene.start`
 *
 * Subclasses implement `mountGameSurface()` to build their own
 * gameplay layer, and call `this.complete({ completed, score, ... })`
 * or `this.fail({...})` when the user reaches a terminal state.
 *
 * The scene is intentionally framework-light — no sprites or
 * physics. Each archetype renders with primitive shapes so we don't
 * have to ship new art assets in v1.
 */

import * as Phaser from "phaser";
import type {
  MiniGameSceneResult,
  PatternMatchExtra,
  ReflexTapExtra,
  DecryptExtra,
} from "@convex/miniGameTypes";

export interface MiniGameSceneInit {
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Called exactly once when the scene resolves. */
  onResult: (result: MiniGameSceneResult) => void;
  /** Called if the user pressed Esc / closed the overlay. */
  onAbandon: () => void;
}

export abstract class MiniGameSceneBase extends Phaser.Scene {
  protected difficulty: 1 | 2 | 3 | 4 | 5 = 1;
  protected startedAt = 0;
  private timerText?: Phaser.GameObjects.Text;
  private remainingMs = 0;
  private resolved = false;
  private onResult: ((result: MiniGameSceneResult) => void) | null = null;
  private onAbandon: (() => void) | null = null;

  init(data: MiniGameSceneInit): void {
    this.difficulty = data.difficulty;
    this.onResult = data.onResult;
    this.onAbandon = data.onAbandon;
    this.startedAt = performance.now();
    this.resolved = false;
  }

  create(): void {
    this.drawBackground();
    this.bindAbandonKeys();
    this.mountGameSurface();

    // Force the canvas to grab focus so keyboard ESC works and the
    // browser doesn't route the pointer event to a sibling element.
    if (this.game.canvas) {
      this.game.canvas.tabIndex = 0;
      this.game.canvas.style.outline = "none";
      this.game.canvas.focus();
    }

    const budget = this.roundDurationMs();
    if (budget > 0) {
      this.remainingMs = budget;
      this.timerText = this.add
        .text(this.scale.width - 16, 16, this.timerLabel(budget), {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#ffffff",
        })
        .setOrigin(1, 0);
      this.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => this.tickTimer(),
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Lifecycle — subclasses implement these
  // ─────────────────────────────────────────────────────────────────

  /** Build the gameplay surface. Called once during `create()`. */
  protected abstract mountGameSurface(): void;

  /** Per-archetype round budget in ms (0 = untimed). */
  protected abstract roundDurationMs(): number;

  /** Build the archetype-specific `extra` field for the result. */
  protected abstract buildExtra():
    | PatternMatchExtra
    | ReflexTapExtra
    | DecryptExtra;

  // ─────────────────────────────────────────────────────────────────
  // Lifecycle — subclasses call these
  // ─────────────────────────────────────────────────────────────────

  /** Resolve the scene with a won outcome. */
  protected complete(args: {
    score: number;
    maxScore: number;
  }): void {
    if (this.resolved) return;
    this.resolved = true;
    this.onResult?.({
      completed: true,
      score: args.score,
      maxScore: args.maxScore,
      durationMs: Math.round(performance.now() - this.startedAt),
      extra: this.buildExtra(),
    });
  }

  /** Resolve the scene with a lost outcome (failed / timed out). */
  protected fail(args: {
    score: number;
    maxScore: number;
  }): void {
    if (this.resolved) return;
    this.resolved = true;
    this.onResult?.({
      completed: false,
      score: args.score,
      maxScore: args.maxScore,
      durationMs: Math.round(performance.now() - this.startedAt),
      extra: this.buildExtra(),
    });
  }

  /** Abandon the scene without producing a result row. */
  protected abandon(): void {
    if (this.resolved) return;
    this.resolved = true;
    this.onAbandon?.();
  }

  // ─────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────

  private drawBackground(): void {
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x0e0c17)
      .setOrigin(0, 0);
  }

  private bindAbandonKeys(): void {
    this.input.keyboard?.on("keydown-ESC", () => this.abandon());
  }

  private tickTimer(): void {
    this.remainingMs = Math.max(0, this.remainingMs - 100);
    this.timerText?.setText(this.timerLabel(this.remainingMs));
    if (this.remainingMs <= 0) {
      this.onTimeUp();
    }
  }

  /**
   * Called when the round budget expires. Default: fail with current
   * score. Subclasses may override to handle partial completion.
   */
  protected onTimeUp(): void {
    this.fail({ score: 0, maxScore: 0 });
  }

  private timerLabel(ms: number): string {
    const totalSec = Math.ceil(ms / 1000);
    const s = String(totalSec % 60).padStart(2, "0");
    const m = Math.floor(totalSec / 60);
    return `${m}:${s}`;
  }
}
