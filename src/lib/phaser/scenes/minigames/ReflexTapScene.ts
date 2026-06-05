/**
 * ReflexTapScene — grid-based signal-stabilisation mini-game.
 *
 * Spec: "Reflex Tap — Production-Level Design" PRD section.
 *
 *   - 5×5 cell grid.
 *   - Three target types: Normal (◉, +1), Golden (✦, +2, Tier 3+),
 *     Corrupted (☒, -1, Tier 4+ — never causes failure).
 *   - Deterministic seeded RNG keyed off the spawn point id, so all
 *     users see the same sequence (fair + debuggable).
 *   - Instant win when `currentHits >= targetHits` — don't wait for
 *     the timer. Failure only on timeout with insufficient hits.
 *   - Mobile-first: every target's effective hit area is at least
 *     56×56px even when the visual sprite is smaller.
 *   - Juice: combo counter, pixel-burst on hit, near-win glow at 90%.
 *
 * Score: number of effective hits. Max score = configured targetHits.
 */

import * as Phaser from "phaser";
import { MiniGameSceneBase } from "./MiniGameSceneBase";
import { ARCHETYPE_PARAMS } from "@convex/miniGameConstants";
import type { ReflexTapExtra } from "@convex/miniGameTypes";

export const REFLEX_TAP_SCENE_KEY = "minigame:reflex_tap";

const GRID_COLS = 5;
const GRID_ROWS = 5;
const MIN_TOUCH_PX = 56;

type TargetKind = "normal" | "golden" | "corrupted";

interface TargetInfo {
  id: number;
  cellRow: number;
  cellCol: number;
  cx: number;
  cy: number;
  hitR: number; // hit-test radius (>= MIN_TOUCH_PX / 2 always)
  kind: TargetKind;
  /** Visible sprite container, removed on hit / despawn. */
  container: Phaser.GameObjects.Container;
  expiresAt: number;
  hit: boolean;
}

interface TierConfig {
  targetHits: number;
  durationMs: number;
  targetLifetimeMs: number;
  spawnIntervalMs: number;
  goldenChance: number;
  corruptedChance: number;
}

/** Tiny seeded PRNG (mulberry32). Deterministic, no external dep. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a string id into a 32-bit seed. */
function hashSeed(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export class ReflexTapScene extends MiniGameSceneBase {
  constructor() {
    super(REFLEX_TAP_SCENE_KEY);
  }

  // ─── State ─────────────────────────────────────────────────────────
  private cfg!: TierConfig;
  private rng: () => number = Math.random;
  private hits = 0;
  private targetsResolved = 0;
  private combo = 0;
  private maxCombo = 0;
  private active: Map<number, TargetInfo> = new Map();
  private nextTargetId = 1;

  // ─── UI refs ──────────────────────────────────────────────────────
  private hudProgress?: Phaser.GameObjects.Text;
  private hudCombo?: Phaser.GameObjects.Text;
  private nearWinGlow?: Phaser.GameObjects.Rectangle;
  private gridOriginX = 0;
  private gridOriginY = 0;
  private cellSize = 0;

  // ─── Base hooks ───────────────────────────────────────────────────

  protected roundDurationMs(): number {
    return this.cfg?.durationMs ?? ARCHETYPE_PARAMS.reflex_tap.roundDurationMs;
  }

  protected buildExtra(): ReflexTapExtra {
    return {
      archetype: "reflex_tap",
      targetsHit: this.hits,
      targetsMissed: Math.max(0, this.targetsResolved - this.hits),
      targetsTotal: this.cfg.targetHits,
    };
  }

  protected onTimeUp(): void {
    if (this.hits >= this.cfg.targetHits) {
      this.complete({ score: this.hits, maxScore: this.cfg.targetHits });
    } else {
      this.fail({ score: this.hits, maxScore: this.cfg.targetHits });
    }
  }

  // ─── Mount ────────────────────────────────────────────────────────

  protected mountGameSurface(): void {
    // Defensive — wipe any prior state if create() runs twice.
    for (const t of this.active.values()) t.container.destroy(true);
    this.active.clear();
    this.hits = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.targetsResolved = 0;
    this.nextTargetId = 1;

    this.cfg = this.tierConfig();
    this.rng = mulberry32(hashSeed(`reflex:${this.scene.key}:${this.difficulty}:${Date.now() >>> 16}`));

    this.buildHud();
    this.layoutGrid();
    this.installInput();
    this.startSpawnLoop();
  }

  private tierConfig(): TierConfig {
    const tiers = ARCHETYPE_PARAMS.reflex_tap.tiers;
    const idx = Math.max(0, Math.min(tiers.length - 1, this.difficulty - 1));
    return tiers[idx];
  }

  // ─── HUD ──────────────────────────────────────────────────────────

  private buildHud(): void {
    this.hudProgress = this.add
      .text(this.scale.width / 2, 24, this.progressLabel(), {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0);

    this.hudCombo = this.add
      .text(this.scale.width / 2, 48, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#facc15",
      })
      .setOrigin(0.5, 0);

    // Near-win glow overlay — invisible until ≥90% progress.
    this.nearWinGlow = this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x4ade80,
        0.0,
      )
      .setStrokeStyle(0)
      .setDepth(-1);
  }

  private progressLabel(): string {
    return `Progress: ${this.hits} / ${this.cfg.targetHits}`;
  }

  private updateHud(): void {
    this.hudProgress?.setText(this.progressLabel());
    this.hudCombo?.setText(this.combo > 1 ? `Combo ×${this.combo}` : "");

    // Near-win: pulse a faint green border-glow when within 90%.
    const ratio = this.hits / this.cfg.targetHits;
    if (ratio >= 0.9 && this.nearWinGlow) {
      // Set alpha; the tween below pulses it.
      if (this.nearWinGlow.fillAlpha < 0.05) {
        this.tweens.add({
          targets: this.nearWinGlow,
          fillAlpha: 0.12,
          yoyo: true,
          repeat: -1,
          duration: 600,
          ease: "Sine.easeInOut",
        });
      }
    }
  }

  // ─── Grid + spawn ─────────────────────────────────────────────────

  private layoutGrid(): void {
    const padding = 24;
    const headerHeight = 80;
    const footerHeight = 40;
    const availW = this.scale.width - padding * 2;
    const availH = this.scale.height - headerHeight - footerHeight;
    this.cellSize = Math.floor(Math.min(availW / GRID_COLS, availH / GRID_ROWS));
    const gridW = this.cellSize * GRID_COLS;
    const gridH = this.cellSize * GRID_ROWS;
    this.gridOriginX = (this.scale.width - gridW) / 2;
    this.gridOriginY = headerHeight + (availH - gridH) / 2;

    // Faint cell outlines so the grid is visible without being noisy.
    const g = this.add.graphics();
    g.lineStyle(1, 0xffffff, 0.05);
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = this.gridOriginX + c * this.cellSize;
        const y = this.gridOriginY + r * this.cellSize;
        g.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
      }
    }
  }

  private startSpawnLoop(): void {
    this.time.addEvent({
      delay: this.cfg.spawnIntervalMs,
      loop: true,
      callback: () => this.spawnOne(),
    });
    // Spawn one immediately so the first cell appears without waiting
    // for the first interval tick.
    this.spawnOne();
  }

  private spawnOne(): void {
    if (this.hits >= this.cfg.targetHits) return; // already won

    // Pick an empty cell (no active target on it).
    const occupied = new Set<string>();
    for (const t of this.active.values()) {
      occupied.add(`${t.cellRow},${t.cellCol}`);
    }
    if (occupied.size >= GRID_COLS * GRID_ROWS) return;

    let row = 0;
    let col = 0;
    for (let attempt = 0; attempt < 25; attempt++) {
      row = Math.floor(this.rng() * GRID_ROWS);
      col = Math.floor(this.rng() * GRID_COLS);
      if (!occupied.has(`${row},${col}`)) break;
    }
    if (occupied.has(`${row},${col}`)) return;

    const kind = this.rollTargetKind();
    this.createTarget(row, col, kind);
  }

  private rollTargetKind(): TargetKind {
    const roll = this.rng();
    const corruptedSlot = this.cfg.corruptedChance;
    const goldenSlot = corruptedSlot + this.cfg.goldenChance;
    if (roll < corruptedSlot) return "corrupted";
    if (roll < goldenSlot) return "golden";
    return "normal";
  }

  private createTarget(row: number, col: number, kind: TargetKind): void {
    const cx = this.gridOriginX + col * this.cellSize + this.cellSize / 2;
    const cy = this.gridOriginY + row * this.cellSize + this.cellSize / 2;
    const radius = Math.max(MIN_TOUCH_PX / 2, this.cellSize * 0.36);

    const container = this.add.container(cx, cy);
    const id = this.nextTargetId++;

    // Visuals per kind.
    let primary: number;
    let glyph: string;
    switch (kind) {
      case "golden":
        primary = 0xfacc15;
        glyph = "✦";
        break;
      case "corrupted":
        primary = 0xef4444;
        glyph = "✕";
        break;
      default:
        primary = 0x9f7aea;
        glyph = "●";
    }
    const fill = this.add.circle(0, 0, radius * 0.72, primary, 0.95);
    fill.setStrokeStyle(2, 0xffffff, 0.85);
    const label = this.add
      .text(0, 0, glyph, {
        fontFamily: "monospace",
        fontSize: `${Math.round(radius * 0.9)}px`,
        color: kind === "corrupted" ? "#ffffff" : "#0e0c17",
      })
      .setOrigin(0.5);
    container.add([fill, label]);
    container.setScale(0.2);
    container.setAlpha(0);

    // Pop in.
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 120,
      ease: "Back.easeOut",
    });

    // Continuous pulse for golden, flicker for corrupted.
    if (kind === "golden") {
      this.tweens.add({
        targets: container,
        scale: 1.12,
        yoyo: true,
        repeat: -1,
        duration: 420,
        ease: "Sine.easeInOut",
      });
    } else if (kind === "corrupted") {
      this.tweens.add({
        targets: container,
        alpha: 0.55,
        yoyo: true,
        repeat: -1,
        duration: 110,
      });
    }

    const info: TargetInfo = {
      id,
      cellRow: row,
      cellCol: col,
      cx,
      cy,
      hitR: radius,
      kind,
      container,
      expiresAt: this.time.now + this.cfg.targetLifetimeMs,
      hit: false,
    };
    this.active.set(id, info);

    // Schedule despawn.
    this.time.delayedCall(this.cfg.targetLifetimeMs, () => {
      if (info.hit) return;
      this.despawnTarget(info, /*hit=*/ false);
    });
  }

  private despawnTarget(t: TargetInfo, hit: boolean): void {
    this.active.delete(t.id);
    this.targetsResolved += 1;
    if (hit) {
      this.spawnPixelBurst(t.cx, t.cy, t.kind);
      this.tweens.add({
        targets: t.container,
        scale: 1.6,
        alpha: 0,
        duration: 160,
        onComplete: () => t.container.destroy(true),
      });
    } else {
      this.tweens.add({
        targets: t.container,
        alpha: 0,
        duration: 240,
        onComplete: () => t.container.destroy(true),
      });
      // Missed → break combo.
      this.combo = 0;
      this.updateHud();
    }
  }

  // ─── Input ────────────────────────────────────────────────────────

  private installInput(): void {
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.tryTap(p.x, p.y);
    });
    const canvas = this.game.canvas;
    if (canvas) {
      const handler = (e: PointerEvent | MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const sx = canvas.width / rect.width;
        const sy = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * sx;
        const y = (e.clientY - rect.top) * sy;
        this.tryTap(x, y);
      };
      canvas.addEventListener("pointerdown", handler);
      this.events.once("shutdown", () => {
        canvas.removeEventListener("pointerdown", handler);
      });
    }
  }

  private tryTap(x: number, y: number): void {
    // Closest in-range target wins (in case two overlap).
    let best: TargetInfo | null = null;
    let bestD2 = Infinity;
    for (const t of this.active.values()) {
      const dx = x - t.cx;
      const dy = y - t.cy;
      const d2 = dx * dx + dy * dy;
      if (d2 <= t.hitR * t.hitR && d2 < bestD2) {
        best = t;
        bestD2 = d2;
      }
    }
    if (!best) return;
    this.resolveHit(best);
  }

  private resolveHit(t: TargetInfo): void {
    if (t.hit) return;
    t.hit = true;

    switch (t.kind) {
      case "normal":
        this.hits += 1;
        this.combo += 1;
        break;
      case "golden":
        this.hits += 2;
        this.combo += 1;
        break;
      case "corrupted":
        this.hits = Math.max(0, this.hits - 1);
        // Corrupted hit breaks combo.
        this.combo = 0;
        break;
    }
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.updateHud();
    this.despawnTarget(t, /*hit=*/ true);

    // Instant win.
    if (this.hits >= this.cfg.targetHits) {
      this.complete({ score: this.hits, maxScore: this.cfg.targetHits });
    }
  }

  // ─── Juice: pixel-burst on hit ────────────────────────────────────

  private spawnPixelBurst(x: number, y: number, kind: TargetKind): void {
    const baseColor =
      kind === "golden" ? 0xfacc15 : kind === "corrupted" ? 0xef4444 : 0x9f7aea;
    const PIECES = 8;
    for (let i = 0; i < PIECES; i++) {
      const ang = (Math.PI * 2 * i) / PIECES;
      const dist = 18 + Math.floor(this.rng() * 14);
      const px = this.add.rectangle(x, y, 5, 5, baseColor, 1);
      this.tweens.add({
        targets: px,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist,
        alpha: 0,
        duration: 360,
        ease: "Quad.easeOut",
        onComplete: () => px.destroy(),
      });
    }
  }
}
