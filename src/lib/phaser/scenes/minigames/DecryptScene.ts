/**
 * DecryptScene — restore-the-glyph puzzle.
 *
 * Spec: "Decrypt — Production-Level Design" PRD section.
 *
 * Mechanics by tier:
 *   1.  2×2 rotation-only      (4 pieces, just tap to rotate)
 *   2.  3×3 rotation-only      (9 pieces)
 *   3.  3×3 rotate + swap      (mode toggle button)
 *   4.  4×4 rotate + swap      (16 pieces)
 *   5.  4×4 rotate + swap with 2 locked pieces
 *
 * No-fail design — round is untimed, user exits voluntarily.
 * Scoring: 100% on success; partial credit = correctness ratio if
 * the user abandons mid-puzzle.
 *
 * Deterministic seeded RNG keyed off scene key + difficulty so a
 * given spawn always produces the same shuffle/rotation puzzle.
 */

import * as Phaser from "phaser";
import { MiniGameSceneBase } from "./MiniGameSceneBase";
import { ARCHETYPE_PARAMS } from "@convex/miniGameConstants";
import type { DecryptExtra } from "@convex/miniGameTypes";

export const DECRYPT_SCENE_KEY = "minigame:decrypt";

// ────────────────────────────────────────────────────────────────────
// RNG helpers (deterministic per spawn)
// ────────────────────────────────────────────────────────────────────

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

function hashSeed(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ────────────────────────────────────────────────────────────────────
// Glyph library — themed sigils restored by each puzzle.
// One palette ships in v1; per-template variants can drop in by
// keying the array off the venture template id at scene init.
// ────────────────────────────────────────────────────────────────────

const GLYPH_LIBRARY: ReadonlyArray<{ symbol: string; color: number }> = [
  { symbol: "◆", color: 0xf472b6 },
  { symbol: "⬢", color: 0x60a5fa },
  { symbol: "◈", color: 0x4ade80 },
  { symbol: "✦", color: 0xfacc15 },
  { symbol: "⌬", color: 0xc084fc },
  { symbol: "⚛", color: 0x22d3ee },
  { symbol: "❖", color: 0xf97316 },
  { symbol: "✶", color: 0xfb7185 },
];

// ────────────────────────────────────────────────────────────────────
// Piece model
// ────────────────────────────────────────────────────────────────────

interface Piece {
  /** Stable id (its index in the *solved* grid). */
  id: number;
  /** Glyph + tile letter shown on the face. */
  glyphIdx: number;
  /** Single-character tile label (A, B, C, …) for sliding-puzzle clarity. */
  label: string;
  /** Solution slot (row, col) — never changes. */
  solRow: number;
  solCol: number;
  /** Solution rotation in degrees (0). */
  solRotation: 0 | 90 | 180 | 270;
  /** Current slot (row, col). */
  row: number;
  col: number;
  /** Current rotation. */
  rotation: 0 | 90 | 180 | 270;
  /** Locked pieces cannot move or rotate. */
  locked: boolean;
  /** Visual root. */
  container: Phaser.GameObjects.Container;
}

interface TierConfig {
  gridSize: number;
  modes: { rotate: boolean; swap: boolean };
  lockedPieces: number;
  hintAfterMs: number;
}

type ToolMode = "rotate" | "swap";

export class DecryptScene extends MiniGameSceneBase {
  constructor() {
    super(DECRYPT_SCENE_KEY);
  }

  // ─── State ────────────────────────────────────────────────────────
  private cfg!: TierConfig;
  private rng: () => number = Math.random;
  private pieces: Piece[] = [];
  private gridOriginX = 0;
  private gridOriginY = 0;
  private tileSize = 0;
  private chosenGlyph = GLYPH_LIBRARY[0];
  private mode: ToolMode = "rotate";
  private selected: Piece | null = null;
  private resolvedAlready = false;
  private moveCount = 0;

  // ─── HUD refs ────────────────────────────────────────────────────
  private hudStatus?: Phaser.GameObjects.Text;
  private hudMode?: Phaser.GameObjects.Text;
  private modeButton?: Phaser.GameObjects.Container;
  private hintPrompt?: Phaser.GameObjects.Container;
  private hintShownAt = 0;
  private hintLevel = 0;
  private hintGlowed: Set<number> = new Set();

  // ─── Base hooks ──────────────────────────────────────────────────

  protected roundDurationMs(): number {
    return 0; // untimed by spec
  }

  protected buildExtra(): DecryptExtra {
    return {
      archetype: "decrypt",
      cipherLength: this.pieces.length,
      guessesUsed: this.moveCount,
      maxGuesses: this.pieces.length,
    };
  }

  // ─── Mount ───────────────────────────────────────────────────────

  protected mountGameSurface(): void {
    // Defensive wipe — handles StrictMode double-mount.
    for (const p of this.pieces) p.container.destroy(true);
    this.pieces = [];
    this.selected = null;
    this.moveCount = 0;
    this.resolvedAlready = false;
    this.hintLevel = 0;
    this.hintGlowed.clear();

    this.cfg = this.tierConfig();
    this.rng = mulberry32(
      hashSeed(`decrypt:${this.scene.key}:${this.difficulty}`),
    );
    this.chosenGlyph =
      GLYPH_LIBRARY[Math.floor(this.rng() * GLYPH_LIBRARY.length)];
    this.mode = this.cfg.modes.swap ? "rotate" : "rotate";

    this.buildHud();
    this.layoutBoard();
    this.buildSolvedPieces();
    this.shufflePieces();
    this.installInput();
    this.schedulHintPrompt();
  }

  private tierConfig(): TierConfig {
    const tiers = ARCHETYPE_PARAMS.decrypt.tiers;
    const idx = Math.max(0, Math.min(tiers.length - 1, this.difficulty - 1));
    return tiers[idx];
  }

  // ─── HUD ─────────────────────────────────────────────────────────

  private buildHud(): void {
    this.hudStatus = this.add
      .text(this.scale.width / 2, 22, `Restore the glyph: ${this.chosenGlyph.symbol}`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0);

    if (this.cfg.modes.swap) {
      // Mode toggle pill at the bottom — width sized to fit the text.
      const cy = this.scale.height - 28;
      const btnH = 36;
      this.hudMode = this.add
        .text(this.scale.width / 2, cy, this.modeButtonLabel(), {
          fontFamily: "monospace",
          fontSize: "13px",
          color: "#e9d5ff",
        })
        .setOrigin(0.5);
      const padX = 24;
      const btnW = Math.ceil(this.hudMode.width + padX * 2);
      const bg = this.add
        .rectangle(this.scale.width / 2, cy, btnW, btnH, 0x1f1b3a, 0.95)
        .setStrokeStyle(2, 0x7c3aed, 0.85)
        .setInteractive({ useHandCursor: true });
      // Re-add the label on top so the rect doesn't cover it.
      this.hudMode.setDepth(1);
      this.modeButton = this.add.container(0, 0, [bg, this.hudMode]);
      bg.on("pointerdown", () => this.toggleMode());
    }
  }

  private modeButtonLabel(): string {
    return this.mode === "rotate"
      ? "Mode: Rotate — tap to swap"
      : "Mode: Swap — tap to rotate";
  }

  private toggleMode(): void {
    this.mode = this.mode === "rotate" ? "swap" : "rotate";
    if (this.hudMode) {
      this.hudMode.setText(this.modeButtonLabel());
      // Resize the pill background to the new label width.
      if (this.modeButton) {
        const bg = this.modeButton.list[0] as Phaser.GameObjects.Rectangle;
        const padX = 24;
        const newW = Math.ceil(this.hudMode.width + padX * 2);
        bg.setSize(newW, bg.height);
        bg.setInteractive({ useHandCursor: true });
      }
    }
    this.clearSelection();
  }

  // ─── Board layout + pieces ───────────────────────────────────────

  private layoutBoard(): void {
    const padding = 30;
    const headerHeight = 70;
    const footerHeight = this.cfg.modes.swap ? 70 : 30;
    const availW = this.scale.width - padding * 2;
    const availH = this.scale.height - headerHeight - footerHeight;
    const tile = Math.floor(Math.min(availW, availH) / this.cfg.gridSize);
    // Honour mobile minimum hit target (PRD: 64-72px). Tile size is
    // capped only by available space.
    this.tileSize = Math.max(64, tile);
    if (this.tileSize * this.cfg.gridSize > availW) {
      this.tileSize = Math.floor(availW / this.cfg.gridSize);
    }
    if (this.tileSize * this.cfg.gridSize > availH) {
      this.tileSize = Math.floor(availH / this.cfg.gridSize);
    }
    const boardW = this.tileSize * this.cfg.gridSize;
    const boardH = this.tileSize * this.cfg.gridSize;
    this.gridOriginX = (this.scale.width - boardW) / 2;
    this.gridOriginY = headerHeight + (availH - boardH) / 2;

    // Outer frame.
    const frame = this.add.graphics();
    frame.lineStyle(2, 0x7c3aed, 0.55);
    frame.strokeRect(
      this.gridOriginX - 6,
      this.gridOriginY - 6,
      boardW + 12,
      boardH + 12,
    );
  }

  private buildSolvedPieces(): void {
    const N = this.cfg.gridSize;
    let labelCode = 65; // 'A'
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const id = r * N + c;
        const p: Piece = {
          id,
          glyphIdx: 0,
          label: String.fromCharCode(labelCode++),
          solRow: r,
          solCol: c,
          solRotation: 0,
          row: r,
          col: c,
          rotation: 0,
          locked: false,
          container: this.createPieceContainer(0, 0, ""),
        };
        // Will be re-decorated by `renderPieceFace`.
        p.container.destroy(true);
        p.container = this.createPieceContainer(
          this.tileCenterX(c),
          this.tileCenterY(r),
          p.label,
        );
        this.pieces.push(p);
      }
    }
  }

  private createPieceContainer(
    cx: number,
    cy: number,
    label: string,
  ): Phaser.GameObjects.Container {
    const size = this.tileSize - 8;
    const bg = this.add
      .rectangle(0, 0, size, size, 0x111228, 1)
      .setStrokeStyle(2, this.chosenGlyph.color, 0.55);
    // Directional marker — a small wedge at the top edge that makes
    // wrong rotations visually obvious.
    const wedge = this.add.graphics();
    wedge.fillStyle(this.chosenGlyph.color, 1);
    const wedgeW = size * 0.18;
    const wedgeY = -size / 2 + 4;
    wedge.fillTriangle(
      -wedgeW, wedgeY + wedgeW,
       wedgeW, wedgeY + wedgeW,
       0,      wedgeY,
    );
    const text = this.add
      .text(0, 6, label, {
        fontFamily: "monospace",
        fontSize: `${Math.round(size * 0.45)}px`,
        color: "#e9d5ff",
      })
      .setOrigin(0.5);
    const container = this.add.container(cx, cy, [bg, wedge, text]);
    return container;
  }

  private tileCenterX(col: number): number {
    return this.gridOriginX + col * this.tileSize + this.tileSize / 2;
  }
  private tileCenterY(row: number): number {
    return this.gridOriginY + row * this.tileSize + this.tileSize / 2;
  }

  // ─── Shuffle (deterministic) ─────────────────────────────────────

  private shufflePieces(): void {
    // Pick which pieces will be locked (in correct slot + rotation).
    const lockedSet = new Set<number>();
    if (this.cfg.lockedPieces > 0) {
      const candidates = [...this.pieces.map((p) => p.id)];
      for (let i = 0; i < this.cfg.lockedPieces && candidates.length; i++) {
        const idx = Math.floor(this.rng() * candidates.length);
        lockedSet.add(candidates.splice(idx, 1)[0]);
      }
    }

    // Apply rotation shuffle to all non-locked pieces.
    if (this.cfg.modes.rotate) {
      for (const p of this.pieces) {
        if (lockedSet.has(p.id)) continue;
        const rotations: Array<0 | 90 | 180 | 270> = [90, 180, 270];
        p.rotation = rotations[Math.floor(this.rng() * rotations.length)];
      }
    }

    // Apply position shuffle (Fisher-Yates over the non-locked slots).
    if (this.cfg.modes.swap) {
      const movable = this.pieces.filter((p) => !lockedSet.has(p.id));
      // Snapshot positions of movable pieces, then permute.
      const positions = movable.map((p) => ({ r: p.row, c: p.col }));
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      // Ensure not identity — if shuffle accidentally produced solved
      // positions, swap the first two.
      const identityCheck = movable.every(
        (p, idx) => positions[idx].r === p.solRow && positions[idx].c === p.solCol,
      );
      if (identityCheck && positions.length >= 2) {
        [positions[0], positions[1]] = [positions[1], positions[0]];
      }
      movable.forEach((p, idx) => {
        p.row = positions[idx].r;
        p.col = positions[idx].c;
      });
    }

    // Mark locked pieces.
    for (const p of this.pieces) {
      if (lockedSet.has(p.id)) {
        p.locked = true;
        this.decorateLocked(p);
      }
    }

    this.repositionAll(/*animate=*/ false);
  }

  private decorateLocked(p: Piece): void {
    // Small lock-icon overlay.
    const size = this.tileSize - 8;
    const lock = this.add
      .text(size / 2 - 10, -size / 2 + 8, "🔒", {
        fontSize: "12px",
      })
      .setOrigin(0.5);
    p.container.add(lock);
  }

  // ─── Render ──────────────────────────────────────────────────────

  private repositionAll(animate: boolean): void {
    for (const p of this.pieces) {
      const x = this.tileCenterX(p.col);
      const y = this.tileCenterY(p.row);
      if (animate) {
        this.tweens.add({
          targets: p.container,
          x, y,
          rotation: this.degToRad(p.rotation),
          duration: 160,
          ease: "Cubic.easeOut",
        });
      } else {
        p.container.setPosition(x, y);
        p.container.setRotation(this.degToRad(p.rotation));
      }
    }
  }

  private degToRad(d: number): number {
    return (d * Math.PI) / 180;
  }

  // ─── Input ───────────────────────────────────────────────────────

  private installInput(): void {
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.handleTap(p.x, p.y);
    });
    const canvas = this.game.canvas;
    if (canvas) {
      const handler = (e: PointerEvent | MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const sx = canvas.width / rect.width;
        const sy = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * sx;
        const y = (e.clientY - rect.top) * sy;
        this.handleTap(x, y);
      };
      canvas.addEventListener("pointerdown", handler);
      this.events.once("shutdown", () => {
        canvas.removeEventListener("pointerdown", handler);
      });
    }
  }

  private handleTap(x: number, y: number): void {
    if (this.resolvedAlready) return;
    // Mode-toggle button hit-test (already wired via setInteractive,
    // but be defensive in case Phaser's input plugin fails).
    const piece = this.pieceAt(x, y);
    if (!piece) {
      this.clearSelection();
      return;
    }
    if (piece.locked) return;

    if (this.mode === "rotate" || !this.cfg.modes.swap) {
      this.rotatePiece(piece);
      this.moveCount += 1;
      this.checkSolved();
      return;
    }
    // Swap mode.
    if (!this.selected) {
      this.selected = piece;
      this.highlightSelection(piece, true);
      return;
    }
    if (this.selected.id === piece.id) {
      this.clearSelection();
      return;
    }
    this.swapPieces(this.selected, piece);
    this.clearSelection();
    this.moveCount += 1;
    this.checkSolved();
  }

  private pieceAt(x: number, y: number): Piece | null {
    for (const p of this.pieces) {
      const cx = this.tileCenterX(p.col);
      const cy = this.tileCenterY(p.row);
      if (
        Math.abs(x - cx) <= this.tileSize / 2 &&
        Math.abs(y - cy) <= this.tileSize / 2
      ) {
        return p;
      }
    }
    return null;
  }

  private rotatePiece(p: Piece): void {
    p.rotation = ((p.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    this.tweens.add({
      targets: p.container,
      rotation: this.degToRad(p.rotation),
      duration: 180,
      ease: "Cubic.easeOut",
    });
  }

  private swapPieces(a: Piece, b: Piece): void {
    const aRow = a.row;
    const aCol = a.col;
    a.row = b.row;
    a.col = b.col;
    b.row = aRow;
    b.col = aCol;
    this.repositionAll(/*animate=*/ true);
  }

  private highlightSelection(p: Piece, on: boolean): void {
    const bg = p.container.list[0] as Phaser.GameObjects.Rectangle;
    bg.setStrokeStyle(on ? 3 : 2, this.chosenGlyph.color, on ? 1 : 0.55);
  }

  private clearSelection(): void {
    if (this.selected) {
      this.highlightSelection(this.selected, false);
      this.selected = null;
    }
  }

  // ─── Solution check ──────────────────────────────────────────────

  private isSolved(): boolean {
    for (const p of this.pieces) {
      if (p.row !== p.solRow || p.col !== p.solCol) return false;
      if (p.rotation !== p.solRotation) return false;
    }
    return true;
  }

  private checkSolved(): void {
    if (!this.isSolved()) return;
    this.resolvedAlready = true;
    this.playSolvedSequence();
  }

  private playSolvedSequence(): void {
    // Brief gather + glow effect, then resolve.
    this.hudStatus?.setText(`GLYPH RESTORED: ${this.chosenGlyph.symbol}`);
    this.hintPrompt?.destroy();
    for (const p of this.pieces) {
      this.tweens.add({
        targets: p.container,
        scale: 1.06,
        yoyo: true,
        duration: 220,
      });
    }
    this.time.delayedCall(700, () => {
      this.complete({
        score: this.pieces.length,
        maxScore: this.pieces.length,
      });
    });
  }

  // ─── Hint system ─────────────────────────────────────────────────

  private schedulHintPrompt(): void {
    this.time.delayedCall(this.cfg.hintAfterMs, () => {
      if (this.resolvedAlready) return;
      this.showHintPrompt();
    });
  }

  private showHintPrompt(): void {
    if (this.hintPrompt) return;
    const cy = 56;
    const bg = this.add
      .rectangle(this.scale.width / 2, cy, 200, 28, 0x1f1b3a, 0.95)
      .setStrokeStyle(1, 0xfacc15, 0.7)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(this.scale.width / 2, cy, "Need a hint?", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#fde68a",
      })
      .setOrigin(0.5);
    this.hintPrompt = this.add.container(0, 0, [bg, text]);
    bg.on("pointerdown", () => this.advanceHint());
    this.hintShownAt = this.time.now;
  }

  private advanceHint(): void {
    this.hintLevel = Math.min(3, this.hintLevel + 1);
    if (this.hintLevel === 1) {
      // Glow up to one mis-placed / mis-rotated piece.
      const wrong = this.pieces.find(
        (p) =>
          !p.locked &&
          (p.row !== p.solRow ||
            p.col !== p.solCol ||
            p.rotation !== p.solRotation) &&
          !this.hintGlowed.has(p.id),
      );
      if (wrong) {
        this.hintGlowed.add(wrong.id);
        const bg = wrong.container.list[0] as Phaser.GameObjects.Rectangle;
        bg.setStrokeStyle(3, 0xfacc15, 1);
        this.tweens.add({
          targets: bg,
          alpha: 0.7,
          yoyo: true,
          repeat: 4,
          duration: 220,
        });
      }
    } else if (this.hintLevel === 2) {
      // Faint silhouette of the chosen glyph in the centre.
      const t = this.add
        .text(this.scale.width / 2, this.scale.height / 2, this.chosenGlyph.symbol, {
          fontFamily: "serif",
          fontSize: `${Math.round(this.tileSize * this.cfg.gridSize * 0.4)}px`,
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setAlpha(0.08)
        .setDepth(-1);
      this.tweens.add({
        targets: t,
        alpha: 0.16,
        yoyo: true,
        repeat: -1,
        duration: 1200,
      });
    } else {
      // Reveal one piece into its correct slot + rotation.
      const wrong = this.pieces.find(
        (p) =>
          !p.locked &&
          (p.row !== p.solRow ||
            p.col !== p.solCol ||
            p.rotation !== p.solRotation),
      );
      if (wrong) {
        // Swap whoever's in the correct slot with this piece, then
        // rotate it to solved orientation. Doesn't auto-solve the
        // whole puzzle — just removes one variable.
        const blocker = this.pieces.find(
          (p) => p.row === wrong.solRow && p.col === wrong.solCol,
        );
        if (blocker && blocker !== wrong) {
          blocker.row = wrong.row;
          blocker.col = wrong.col;
        }
        wrong.row = wrong.solRow;
        wrong.col = wrong.solCol;
        wrong.rotation = wrong.solRotation;
        this.repositionAll(true);
        this.checkSolved();
      }
    }
  }
}
