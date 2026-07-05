/**
 * VillageMapScene — quest-progression map (character-less version)
 * ----------------------------------------------------------------
 * Design:
 *   - No character on the map (will be added when user provides sprites).
 *   - 4 checkpoints painted onto the composite village PNG.
 *   - Checkpoint states:
 *       completed  = small green disc with ✓
 *       active     = gold pulsing disc with number
 *       locked     = grey disc with 🔒
 *   - User drags the map to explore.
 *   - Clicking the ACTIVE checkpoint fires CHECKPOINT_CLICKED.
 *   - React calls scene.advanceToNextCheckpoint() when task completes →
 *     camera pans to next CP + state updates.
 *
 * Public API:
 *   scene.getCurrentIndex()          → number  (0..3)
 *   scene.advanceToNextCheckpoint()  → void    (pans camera + advances)
 *   scene.setCurrentIndex(i)         → void    (jump without animation)
 *
 * Events emitted:
 *   CHECKPOINT_CLICKED  { id, title, x, y }
 *   CHECKPOINT_REACHED  { id, title }
 *   VILLAGE_COMPLETE    { }
 */

import * as Phaser from "phaser";

const MAP_ASSET = "/assets/maps-v2/village-painted/village-map.png";

const MAP_WIDTH = 1536;
const MAP_HEIGHT = 1024;

interface CheckpointDef {
  id: number;
  x: number;
  y: number;
  title: string;
}

interface CheckpointVisual {
  def: CheckpointDef;
  glow: Phaser.GameObjects.Arc;
  overlay: Phaser.GameObjects.Arc; // dims the painted number when locked/completed
  stateBadge: Phaser.GameObjects.Text; // ✓ or 🔒 stamped over the number
  hitZone: Phaser.GameObjects.Zone;
  glowTween?: Phaser.Tweens.Tween;
}

// Coordinates auto-detected from the painted composite PNG by scanning for
// the LDtk checkpoint disc pattern (dark center + gold ring at radius ~22px).
const CHECKPOINTS: readonly CheckpointDef[] = [
  { id: 1, x: 160, y: 200, title: "The Signboard" },
  { id: 2, x: 590, y: 630, title: "The Bridge" },
  { id: 3, x: 1160, y: 650, title: "The Barn" },
  { id: 4, x: 1300, y: 320, title: "The Well" },
];

export class VillageMapScene extends Phaser.Scene {
  private currentIndex = 0;
  private visuals: CheckpointVisual[] = [];
  private isAnimating = false;

  constructor() {
    super({ key: "VillageMapScene" });
  }

  preload(): void {
    this.load.image("village-composite", MAP_ASSET);
  }

  create(): void {
    // 1. Painted village background
    this.add.image(0, 0, "village-composite").setOrigin(0, 0).setDepth(0);

    // 2. Camera — centered on first checkpoint, drag-to-pan
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    cam.setZoom(1.4);
    const start = CHECKPOINTS[0];
    cam.centerOn(start.x, start.y);

    // 3. Drag-to-pan
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      dragging = true;
      lastX = p.x;
      lastY = p.y;
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!dragging) return;
      cam.scrollX -= (p.x - lastX) / cam.zoom;
      cam.scrollY -= (p.y - lastY) / cam.zoom;
      lastX = p.x;
      lastY = p.y;
    });
    this.input.on("pointerup", () => {
      dragging = false;
    });

    // 4. Checkpoints
    for (const cp of CHECKPOINTS) {
      this.visuals.push(this.buildCheckpoint(cp));
    }
    this.refreshCheckpointStates();
  }

  // ─── Public API ─────────────────────────────────────────

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public setCurrentIndex(i: number): void {
    this.currentIndex = Phaser.Math.Clamp(i, 0, CHECKPOINTS.length - 1);
    this.refreshCheckpointStates();
    const cp = CHECKPOINTS[this.currentIndex];
    this.cameras.main.centerOn(cp.x, cp.y);
  }

  public advanceToNextCheckpoint(): void {
    if (this.isAnimating) return;
    if (this.currentIndex >= CHECKPOINTS.length - 1) {
      this.celebrate();
      return;
    }
    this.isAnimating = true;
    this.currentIndex += 1;
    const to = CHECKPOINTS[this.currentIndex];

    // Refresh states immediately so the newly-active CP starts pulsing
    this.refreshCheckpointStates();

    // Pan camera to next checkpoint
    this.cameras.main.pan(to.x, to.y, 1200, "Sine.easeInOut");
    this.time.delayedCall(1200, () => {
      this.isAnimating = false;
      this.game.events.emit("CHECKPOINT_REACHED", {
        id: to.id,
        title: to.title,
      });
    });
  }

  // ─── Internals ──────────────────────────────────────────

  private buildCheckpoint(cp: CheckpointDef): CheckpointVisual {
    // The user painted the CP numbers directly into the map (LDtk export
    // has the "1", "2", "3", "4" markers baked in). We ENHANCE them
    // instead of drawing our own — just a soft glow + state overlay.
    const radius = 30;

    // Soft pulsing glow BEHIND the painted number
    const glow = this.add.circle(cp.x, cp.y, radius + 4, 0xffd700, 0.35);
    glow.setDepth(85); // under the painted map elements? Actually keep above bg but under UI
    glow.setBlendMode(Phaser.BlendModes.ADD);

    // Overlay disc — only visible in locked/completed states to dim the
    // painted number. Fully transparent for active state.
    const overlay = this.add.circle(cp.x, cp.y, radius - 2, 0x000000, 0);
    overlay.setDepth(91);

    // State badge — small ✓ or 🔒 or nothing overlaid on the number
    const stateBadge = this.add.text(cp.x, cp.y, "", {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "24px",
      color: "#4ade80",
      fontStyle: "bold",
    });
    stateBadge.setOrigin(0.5, 0.5);
    stateBadge.setDepth(93);

    // Invisible hit zone — click target
    const hitZone = this.add.zone(cp.x, cp.y, 70, 70);
    hitZone.setInteractive(
      new Phaser.Geom.Circle(35, 35, 35),
      Phaser.Geom.Circle.Contains,
    );
    hitZone.input!.cursor = "pointer";
    hitZone.on("pointerover", () => this.onHover(cp, true));
    hitZone.on("pointerout", () => this.onHover(cp, false));
    hitZone.on("pointerdown", () => this.onCheckpointClicked(cp));

    return { def: cp, glow, overlay, stateBadge, hitZone };
  }

  private onHover(cp: CheckpointDef, hovering: boolean): void {
    if (cp.id !== CHECKPOINTS[this.currentIndex].id) return;
    const vis = this.visuals[this.currentIndex];
    if (!vis) return;
    this.tweens.add({
      targets: [vis.glow],
      scale: hovering ? 1.25 : 1,
      duration: 140,
      ease: "Sine.easeOut",
    });
  }

  private onCheckpointClicked(cp: CheckpointDef): void {
    const activeCp = CHECKPOINTS[this.currentIndex];
    if (cp.id !== activeCp.id) return;

    this.game.events.emit("CHECKPOINT_CLICKED", {
      id: cp.id,
      title: cp.title,
      x: cp.x,
      y: cp.y,
    });

    const vis = this.visuals[this.currentIndex];
    this.tweens.add({
      targets: [vis.glow],
      scale: 1.4,
      duration: 90,
      yoyo: true,
    });
  }

  private refreshCheckpointStates(): void {
    this.visuals.forEach((vis, idx) => {
      const isCompleted = idx < this.currentIndex;
      const isActive = idx === this.currentIndex;

      // Kill any active pulse tween
      if (vis.glowTween) {
        vis.glowTween.stop();
        vis.glowTween = undefined;
      }
      vis.glow.setScale(1);

      if (isCompleted) {
        // Green glow around the painted number + green ✓ badge overlay
        vis.glow.setFillStyle(0x4ade80, 0.4);
        vis.glow.setAlpha(0.5);
        vis.overlay.setFillStyle(0x000000, 0.55); // dims the painted number
        vis.stateBadge.setText("✓");
        vis.stateBadge.setColor("#4ade80");
      } else if (isActive) {
        // Gold pulsing glow behind the painted number, no overlay dim
        vis.glow.setFillStyle(0xffd700, 0.55);
        vis.glow.setAlpha(0.8);
        vis.overlay.setFillStyle(0x000000, 0); // no dim
        vis.stateBadge.setText(""); // painted number shows through

        vis.glowTween = this.tweens.add({
          targets: vis.glow,
          scale: { from: 1, to: 1.45 },
          alpha: { from: 0.9, to: 0.25 },
          duration: 1300,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
        });
      } else {
        // Locked — dim the painted number with a dark overlay + 🔒 badge
        vis.glow.setFillStyle(0x555555, 0.1);
        vis.glow.setAlpha(0.2);
        vis.overlay.setFillStyle(0x000000, 0.65); // heavy dim
        vis.stateBadge.setText("🔒");
        vis.stateBadge.setColor("#dddddd");
      }
    });
  }

  private celebrate(): void {
    this.game.events.emit("VILLAGE_COMPLETE", {});
    const cp = CHECKPOINTS[this.currentIndex];
    this.cameras.main.pan(cp.x, cp.y, 800, "Sine.easeInOut");
  }

  shutdown(): void {
    this.tweens.killAll();
    this.input.removeAllListeners();
  }
}
