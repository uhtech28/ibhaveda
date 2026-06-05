/**
 * PatternMatchScene — memory-match pairs game.
 *
 * A grid of face-down cards. Click to flip; reveals a coloured pattern
 * glyph. Match two cards with the same glyph to keep them face-up.
 * Clear every pair to win.
 *
 * Card grid scales with difficulty:
 *   d=1 → 3 pairs (2×3)    d=4 → 7 pairs (2×7 / 7×2)
 *   d=2 → 4 pairs (2×4)    d=5 → 8 pairs (4×4)
 *   d=3 → 6 pairs (3×4)
 *
 * Score = pairs found. Max score = total pairs.
 */

import * as Phaser from "phaser";
import { MiniGameSceneBase } from "./MiniGameSceneBase";
import { ARCHETYPE_PARAMS } from "@convex/miniGameConstants";
import type { PatternMatchExtra } from "@convex/miniGameTypes";

export const PATTERN_MATCH_SCENE_KEY = "minigame:pattern_match";

// Glyph palette — each entry is a (color, shape) tuple so even the
// simplest grids look visually distinct.
const GLYPH_PALETTE: ReadonlyArray<{ color: number; shape: GlyphShape }> = [
  { color: 0xf472b6, shape: "circle" },
  { color: 0x60a5fa, shape: "triangle" },
  { color: 0x4ade80, shape: "square" },
  { color: 0xfacc15, shape: "diamond" },
  { color: 0xc084fc, shape: "plus" },
  { color: 0xf97316, shape: "star" },
  { color: 0x22d3ee, shape: "hexagon" },
  { color: 0xfb7185, shape: "heart" },
];

type GlyphShape =
  | "circle"
  | "triangle"
  | "square"
  | "diamond"
  | "plus"
  | "star"
  | "hexagon"
  | "heart";

interface Card {
  /** Index into GLYPH_PALETTE. Two cards with the same glyphId are a pair. */
  glyphId: number;
  container: Phaser.GameObjects.Container;
  back: Phaser.GameObjects.Rectangle;
  face: Phaser.GameObjects.Container;
  bounds: Phaser.Geom.Rectangle;
  state: "face_down" | "face_up" | "matched";
}

const CARD_BACK_COLOR = 0x1f1b3a;
const CARD_BACK_STROKE = 0x7c3aed;
const CARD_FACE_BG = 0x0e0c17;
const FLIP_MS = 280;

export class PatternMatchScene extends MiniGameSceneBase {
  constructor() {
    super(PATTERN_MATCH_SCENE_KEY);
  }

  private cards: Card[] = [];
  private firstPick: Card | null = null;
  private secondPick: Card | null = null;
  private pairsFound = 0;
  private totalPairs = 0;
  private inputLocked = false;
  private statusText?: Phaser.GameObjects.Text;

  protected roundDurationMs(): number {
    return ARCHETYPE_PARAMS.pattern_match.roundDurationMs;
  }

  protected buildExtra(): PatternMatchExtra {
    return {
      archetype: "pattern_match",
      sequenceLength: this.totalPairs,
      stepsCompleted: this.pairsFound,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // Layout
  // ─────────────────────────────────────────────────────────────────

  protected mountGameSurface(): void {
    // Reset state in case create() ran on this instance before
    // (React StrictMode double-mount).
    if (this.cards.length > 0) {
      for (const c of this.cards) c.container.destroy(true);
      this.cards = [];
      this.firstPick = null;
      this.secondPick = null;
      this.pairsFound = 0;
      this.inputLocked = false;
    }

    const { cols, rows } = this.gridForDifficulty();
    this.totalPairs = (cols * rows) / 2;

    this.statusText = this.add
      .text(
        this.scale.width / 2,
        32,
        `Find all ${this.totalPairs} pairs`,
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#ffffff",
        },
      )
      .setOrigin(0.5, 0);

    this.buildCards(cols, rows);
    this.installPointerHandler();
  }

  private gridForDifficulty(): { cols: number; rows: number } {
    switch (this.difficulty) {
      case 1:
        return { cols: 3, rows: 2 }; // 3 pairs
      case 2:
        return { cols: 4, rows: 2 }; // 4 pairs
      case 3:
        return { cols: 4, rows: 3 }; // 6 pairs
      case 4:
        return { cols: 4, rows: 4 }; // 8 pairs (capped — palette has 8)
      case 5:
        return { cols: 4, rows: 4 }; // 8 pairs
      default:
        return { cols: 3, rows: 2 };
    }
  }

  private buildCards(cols: number, rows: number): void {
    const totalCards = cols * rows;
    const pairs = totalCards / 2;

    // Build the glyph deck — each id appears twice — then shuffle.
    const deck: number[] = [];
    for (let i = 0; i < pairs; i++) {
      deck.push(i % GLYPH_PALETTE.length);
      deck.push(i % GLYPH_PALETTE.length);
    }
    Phaser.Utils.Array.Shuffle(deck);

    // Compute card size to fit the playing field with padding.
    const padding = 24;
    const headerHeight = 80;
    const footerHeight = 40;
    const availableW = this.scale.width - padding * 2;
    const availableH = this.scale.height - headerHeight - footerHeight;
    const gap = 12;
    const cardW = (availableW - gap * (cols - 1)) / cols;
    const cardH = (availableH - gap * (rows - 1)) / rows;
    const size = Math.min(cardW, cardH);

    const gridW = size * cols + gap * (cols - 1);
    const gridH = size * rows + gap * (rows - 1);
    const startX = (this.scale.width - gridW) / 2;
    const startY = headerHeight + (availableH - gridH) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const glyphId = deck[idx];
        const x = startX + c * (size + gap);
        const y = startY + r * (size + gap);
        const card = this.buildCard(x, y, size, glyphId);
        this.cards.push(card);
      }
    }
  }

  private buildCard(
    x: number,
    y: number,
    size: number,
    glyphId: number,
  ): Card {
    const container = this.add.container(x + size / 2, y + size / 2);

    // Card back — visible when face-down.
    const back = this.add
      .rectangle(0, 0, size, size, CARD_BACK_COLOR)
      .setStrokeStyle(2, CARD_BACK_STROKE, 0.8);
    // Subtle ornament on the back (a "?" mark in monospace) so it
    // doesn't look like an empty rectangle.
    const backMark = this.add
      .text(0, 0, "?", {
        fontFamily: "monospace",
        fontSize: `${Math.round(size * 0.5)}px`,
        color: "#a78bfa",
      })
      .setOrigin(0.5, 0.5);

    // Face — hidden at start (alpha 0). Built once and reused.
    const face = this.add.container(0, 0).setAlpha(0);
    const faceBg = this.add
      .rectangle(0, 0, size, size, CARD_FACE_BG)
      .setStrokeStyle(2, GLYPH_PALETTE[glyphId].color, 0.95);
    face.add(faceBg);
    face.add(this.drawGlyph(0, 0, size * 0.55, glyphId));

    container.add([back, backMark, face]);

    return {
      glyphId,
      container,
      back,
      face,
      bounds: new Phaser.Geom.Rectangle(x, y, size, size),
      state: "face_down",
    };
  }

  private drawGlyph(
    cx: number,
    cy: number,
    size: number,
    glyphId: number,
  ): Phaser.GameObjects.GameObject {
    const { color, shape } = GLYPH_PALETTE[glyphId];
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.lineStyle(2, 0xffffff, 0.8);

    const r = size / 2;
    switch (shape) {
      case "circle":
        g.fillCircle(cx, cy, r);
        g.strokeCircle(cx, cy, r);
        break;
      case "square":
        g.fillRect(cx - r, cy - r, size, size);
        g.strokeRect(cx - r, cy - r, size, size);
        break;
      case "triangle": {
        const path = new Phaser.Geom.Polygon([
          cx, cy - r,
          cx + r, cy + r * 0.8,
          cx - r, cy + r * 0.8,
        ]);
        g.fillPoints(path.points, true);
        g.strokePoints(path.points, true);
        break;
      }
      case "diamond": {
        const path = new Phaser.Geom.Polygon([
          cx, cy - r,
          cx + r, cy,
          cx, cy + r,
          cx - r, cy,
        ]);
        g.fillPoints(path.points, true);
        g.strokePoints(path.points, true);
        break;
      }
      case "plus": {
        const thick = r * 0.45;
        g.fillRect(cx - thick, cy - r, thick * 2, size);
        g.fillRect(cx - r, cy - thick, size, thick * 2);
        break;
      }
      case "star": {
        const pts: number[] = [];
        for (let i = 0; i < 10; i++) {
          const ang = (Math.PI / 5) * i - Math.PI / 2;
          const radius = i % 2 === 0 ? r : r * 0.45;
          pts.push(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius);
        }
        const path = new Phaser.Geom.Polygon(pts);
        g.fillPoints(path.points, true);
        g.strokePoints(path.points, true);
        break;
      }
      case "hexagon": {
        const pts: number[] = [];
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI / 3) * i;
          pts.push(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
        }
        const path = new Phaser.Geom.Polygon(pts);
        g.fillPoints(path.points, true);
        g.strokePoints(path.points, true);
        break;
      }
      case "heart": {
        // Two arcs + a triangle approximation.
        const r2 = r * 0.55;
        g.fillCircle(cx - r2 * 0.6, cy - r2 * 0.3, r2);
        g.fillCircle(cx + r2 * 0.6, cy - r2 * 0.3, r2);
        const path = new Phaser.Geom.Polygon([
          cx - r, cy - r2 * 0.1,
          cx + r, cy - r2 * 0.1,
          cx, cy + r,
        ]);
        g.fillPoints(path.points, true);
        break;
      }
    }
    return g;
  }

  // ─────────────────────────────────────────────────────────────────
  // Input + flip logic
  // ─────────────────────────────────────────────────────────────────

  private installPointerHandler(): void {
    // Phaser's per-object setInteractive() has been unreliable when the
    // canvas mounts inside a backdrop-blurred modal — events occasionally
    // don't reach the scene. A direct DOM listener on the canvas with
    // explicit CSS→canvas coordinate mapping is bulletproof, so that's
    // the path we use.
    const canvas = this.game.canvas;
    if (!canvas) return;
    const handler = (e: PointerEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.tryFlipAt(
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top) * scaleY,
      );
    };
    canvas.addEventListener("pointerdown", handler);
    this.events.once("shutdown", () => {
      canvas.removeEventListener("pointerdown", handler);
    });
  }

  private tryFlipAt(x: number, y: number): void {
    if (this.inputLocked) return;
    const card = this.cardAt(x, y);
    if (!card || card.state !== "face_down") return;
    void this.flipCard(card);
  }

  private cardAt(x: number, y: number): Card | null {
    for (const card of this.cards) {
      if (Phaser.Geom.Rectangle.Contains(card.bounds, x, y)) return card;
    }
    return null;
  }

  private async flipCard(card: Card): Promise<void> {
    card.state = "face_up";
    await this.animateFlip(card, /*toFace=*/ true);

    if (!this.firstPick) {
      this.firstPick = card;
      return;
    }

    // Second pick — lock until we resolve.
    this.secondPick = card;
    this.inputLocked = true;
    if (this.firstPick.glyphId === this.secondPick.glyphId) {
      this.handleMatch();
    } else {
      this.handleMismatch();
    }
  }

  private animateFlip(card: Card, toFace: boolean): Promise<void> {
    return new Promise<void>((resolve) => {
      this.tweens.add({
        targets: card.container,
        scaleX: 0,
        duration: FLIP_MS / 2,
        ease: "Cubic.easeIn",
        onComplete: () => {
          if (toFace) {
            card.back.setAlpha(0);
            card.face.setAlpha(1);
          } else {
            card.back.setAlpha(1);
            card.face.setAlpha(0);
          }
          this.tweens.add({
            targets: card.container,
            scaleX: 1,
            duration: FLIP_MS / 2,
            ease: "Cubic.easeOut",
            onComplete: () => resolve(),
          });
        },
      });
    });
  }

  private handleMatch(): void {
    const first = this.firstPick!;
    const second = this.secondPick!;
    first.state = "matched";
    second.state = "matched";
    this.pairsFound += 1;
    this.statusText?.setText(
      `Pairs found: ${this.pairsFound} / ${this.totalPairs}`,
    );

    // Brief celebrate pulse.
    this.tweens.add({
      targets: [first.container, second.container],
      scale: 1.08,
      yoyo: true,
      duration: 150,
      onComplete: () => {
        this.firstPick = null;
        this.secondPick = null;
        this.inputLocked = false;
        if (this.pairsFound >= this.totalPairs) {
          this.complete({
            score: this.totalPairs,
            maxScore: this.totalPairs,
          });
        }
      },
    });
  }

  private handleMismatch(): void {
    const first = this.firstPick!;
    const second = this.secondPick!;
    // Brief "wrong" flash on the strokes.
    this.tweens.add({
      targets: [first.container, second.container],
      alpha: 0.7,
      yoyo: true,
      duration: 180,
      onComplete: async () => {
        await Promise.all([
          this.animateFlip(first, /*toFace=*/ false),
          this.animateFlip(second, /*toFace=*/ false),
        ]);
        first.state = "face_down";
        second.state = "face_down";
        this.firstPick = null;
        this.secondPick = null;
        this.inputLocked = false;
      },
    });
  }

  protected onTimeUp(): void {
    this.fail({ score: this.pairsFound, maxScore: this.totalPairs });
  }
}
