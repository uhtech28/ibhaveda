/**
 * @file zoneEditor.ts
 * @description In-map walkability zone editor. Enable with `?editZones=1`
 *   on any scene that calls `attachZoneEditor(this, storageKey)`.
 *
 * UX:
 *   - Right-click-drag → pan camera (falls back to scene's own pan)
 *   - Left-click-drag on empty ground → draw a NEW rectangle
 *   - Left-click on an existing custom rectangle → select it (green ring)
 *   - Delete / Backspace → remove selected rectangle
 *   - HUD (top-right DOM overlay):
 *       · Count of zones · Copy JSON · Clear all · Close editor
 *
 * The custom zones are also passed to the scene's collision system via
 * `getCustomZones()` so blocking works LIVE while editing — walk into a
 * zone you just drew and the character stops. Persistence via
 * localStorage under the given storageKey (survives page reloads).
 *
 * The zones drawn here are ADDITIVE to whatever's hardcoded in the
 * scene's `BLOCKED_ZONES` array. Copy the JSON output into that array
 * once you're happy — then clear the editor's local set.
 */

import * as Phaser from "phaser";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Editor {
  scene: Phaser.Scene;
  storageKey: string;
  zones: Rect[];
  graphics: Phaser.GameObjects.Graphics;
  drag: { x0: number; y0: number; x1: number; y1: number } | null;
  selectedIdx: number | null;
  hud: HTMLDivElement | null;
}

/** Attach the editor to a scene. Idempotent per-scene. Returns a getter
 *  for the current live custom zones the scene's collision code should
 *  additionally check. */
export function attachZoneEditor(
  scene: Phaser.Scene,
  storageKey: string,
): { getCustomZones: () => readonly Rect[] } {
  // No-op unless editor mode is on.
  const enabled =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("editZones") === "1";
  if (!enabled) {
    return { getCustomZones: () => [] };
  }

  const editor: Editor = {
    scene,
    storageKey,
    zones: loadFromStorage(storageKey),
    graphics: scene.add.graphics().setDepth(200),
    drag: null,
    selectedIdx: null,
    hud: null,
  };

  render(editor);
  mountHud(editor);
  bindPointers(editor);
  bindKeys(editor);

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    editor.hud?.remove();
    editor.graphics.destroy();
  });

  return { getCustomZones: () => editor.zones };
}

// ─── Storage ─────────────────────────────────────────────────────────────

function loadFromStorage(key: string): Rect[] {
  try {
    const raw = localStorage.getItem(`ibhaveda-zones-${key}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is Rect =>
        r &&
        typeof r.x === "number" &&
        typeof r.y === "number" &&
        typeof r.w === "number" &&
        typeof r.h === "number",
    );
  } catch {
    return [];
  }
}

function saveToStorage(key: string, zones: Rect[]): void {
  try {
    localStorage.setItem(`ibhaveda-zones-${key}`, JSON.stringify(zones));
  } catch { /* quota / private-mode / SSR — ignore */ }
}

// ─── Rendering ───────────────────────────────────────────────────────────

function render(editor: Editor): void {
  editor.graphics.clear();
  // Existing custom zones — cyan
  editor.zones.forEach((z, i) => {
    const isSelected = i === editor.selectedIdx;
    editor.graphics.fillStyle(0x22ccff, isSelected ? 0.55 : 0.3);
    editor.graphics.lineStyle(isSelected ? 3 : 2, isSelected ? 0x00ffcc : 0x22ccff, 1);
    editor.graphics.fillRect(z.x, z.y, z.w, z.h);
    editor.graphics.strokeRect(z.x, z.y, z.w, z.h);
  });
  // In-progress drag rectangle — yellow dashed
  if (editor.drag) {
    const { x0, y0, x1, y1 } = editor.drag;
    const rx = Math.min(x0, x1);
    const ry = Math.min(y0, y1);
    const rw = Math.abs(x1 - x0);
    const rh = Math.abs(y1 - y0);
    editor.graphics.lineStyle(2, 0xffff00, 1);
    editor.graphics.strokeRect(rx, ry, rw, rh);
  }
}

// ─── Pointer handlers ────────────────────────────────────────────────────

function bindPointers(editor: Editor): void {
  const scene = editor.scene;
  const cam = scene.cameras.main;

  // Use Phaser's built-in world-point converter (handles canvas
  // resize + scale + zoom correctly). Manual arithmetic with p.x/cam.zoom
  // is wrong when the canvas is rendered at a size different from its
  // internal resolution — cursor and drawn rect end up in different
  // spots. `getWorldPoint` always maps screen→world accurately.
  const toWorld = (p: Phaser.Input.Pointer): { x: number; y: number } => {
    const wp = cam.getWorldPoint(p.x, p.y);
    return { x: wp.x, y: wp.y };
  };

  scene.input.on(
    "pointerdown",
    (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) return; // let camera pan
      const { x: wx, y: wy } = toWorld(p);
      // Check if click hit an existing zone → select mode
      const hitIdx = editor.zones.findIndex(
        (z) => wx >= z.x && wx <= z.x + z.w && wy >= z.y && wy <= z.y + z.h,
      );
      if (hitIdx >= 0) {
        editor.selectedIdx = hitIdx;
        editor.drag = null;
        render(editor);
        updateHud(editor);
        return;
      }
      // Empty ground → begin drag to draw new
      editor.selectedIdx = null;
      editor.drag = { x0: wx, y0: wy, x1: wx, y1: wy };
      render(editor);
    },
  );

  scene.input.on(
    "pointermove",
    (p: Phaser.Input.Pointer) => {
      if (!editor.drag) return;
      const { x: wx, y: wy } = toWorld(p);
      editor.drag.x1 = wx;
      editor.drag.y1 = wy;
      render(editor);
    },
  );

  scene.input.on("pointerup", () => {
    if (!editor.drag) return;
    const { x0, y0, x1, y1 } = editor.drag;
    editor.drag = null;
    const rx = Math.round(Math.min(x0, x1));
    const ry = Math.round(Math.min(y0, y1));
    const rw = Math.round(Math.abs(x1 - x0));
    const rh = Math.round(Math.abs(y1 - y0));
    // Ignore tiny click-drags (misclicks)
    if (rw < 20 || rh < 20) {
      render(editor);
      return;
    }
    editor.zones.push({ x: rx, y: ry, w: rw, h: rh });
    saveToStorage(editor.storageKey, editor.zones);
    render(editor);
    updateHud(editor);
  });
}

function bindKeys(editor: Editor): void {
  editor.scene.input.keyboard?.on(
    "keydown",
    (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (editor.selectedIdx === null) return;
        editor.zones.splice(editor.selectedIdx, 1);
        editor.selectedIdx = null;
        saveToStorage(editor.storageKey, editor.zones);
        render(editor);
        updateHud(editor);
      }
    },
  );
}

// ─── HUD (DOM overlay, not Phaser text — needs clipboard access) ─────────

function mountHud(editor: Editor): void {
  if (typeof document === "undefined") return;
  const hud = document.createElement("div");
  hud.id = "zone-editor-hud";
  hud.style.cssText = `
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 9999;
    background: rgba(15, 20, 30, 0.94);
    color: white;
    padding: 12px;
    border: 1px solid rgba(34, 204, 255, 0.5);
    border-radius: 8px;
    font-family: monospace;
    font-size: 11px;
    width: 320px;
    max-height: 60vh;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  `;
  hud.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <strong style="color:#22ccff; font-size:12px; letter-spacing:0.1em;">ZONE EDITOR</strong>
      <button data-role="close" style="background:transparent; border:1px solid rgba(255,255,255,0.2); color:white; padding:2px 8px; cursor:pointer; border-radius:4px; font-size:11px;">✕</button>
    </div>
    <div style="color:#9ca3af; font-size:10px; line-height:1.5;">
      Left-click-drag: draw · Click zone: select · Del/Backspace: remove selected · Right-click-drag: pan
    </div>
    <div data-role="count" style="color:#22ccff; font-weight:bold;"></div>
    <textarea data-role="json" readonly rows="8" style="width:100%; background:#0a0d12; color:#e2e8f0; border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:6px; font-family:monospace; font-size:10px; resize:vertical;"></textarea>
    <div style="display:flex; gap:6px;">
      <button data-role="copy" style="flex:1; background:#22ccff; color:#0a0d12; border:none; padding:6px; cursor:pointer; border-radius:4px; font-weight:bold; font-size:11px;">COPY JSON</button>
      <button data-role="clear" style="flex:1; background:transparent; border:1px solid #ef4444; color:#ef4444; padding:6px; cursor:pointer; border-radius:4px; font-weight:bold; font-size:11px;">CLEAR ALL</button>
    </div>
  `;
  document.body.appendChild(hud);
  editor.hud = hud;

  hud.querySelector<HTMLButtonElement>('[data-role="close"]')!.onclick = () => {
    hud.remove();
    // Strip the query param so a refresh exits editor mode.
    const url = new URL(window.location.href);
    url.searchParams.delete("editZones");
    window.history.replaceState({}, "", url.toString());
    // Reload so the scene reboots without the editor.
    window.location.reload();
  };

  hud.querySelector<HTMLButtonElement>('[data-role="copy"]')!.onclick = () => {
    const json = zonesToPrettyJson(editor.zones);
    navigator.clipboard.writeText(json).then(
      () => flashButton(hud, "copy", "COPIED ✓"),
      () => flashButton(hud, "copy", "COPY FAILED"),
    );
  };

  hud.querySelector<HTMLButtonElement>('[data-role="clear"]')!.onclick = () => {
    if (!confirm(`Delete all ${editor.zones.length} custom zones?`)) return;
    editor.zones = [];
    editor.selectedIdx = null;
    saveToStorage(editor.storageKey, editor.zones);
    render(editor);
    updateHud(editor);
  };

  updateHud(editor);
}

function updateHud(editor: Editor): void {
  const hud = editor.hud;
  if (!hud) return;
  const count = editor.zones.length;
  hud.querySelector('[data-role="count"]')!.textContent =
    count === 0
      ? "No custom zones yet. Left-click-drag on the map to draw one."
      : `${count} custom zone${count === 1 ? "" : "s"}${editor.selectedIdx !== null ? " (1 selected)" : ""}`;
  const ta = hud.querySelector<HTMLTextAreaElement>('[data-role="json"]')!;
  ta.value = zonesToPrettyJson(editor.zones);
}

function zonesToPrettyJson(zones: Rect[]): string {
  if (zones.length === 0) return "[]";
  const lines = zones.map(
    (z) => `  { x: ${z.x}, y: ${z.y}, w: ${z.w}, h: ${z.h} },`,
  );
  return `[\n${lines.join("\n")}\n]`;
}

function flashButton(hud: HTMLDivElement, role: string, msg: string): void {
  const btn = hud.querySelector<HTMLButtonElement>(`[data-role="${role}"]`);
  if (!btn) return;
  const original = btn.textContent;
  btn.textContent = msg;
  setTimeout(() => {
    btn.textContent = original;
  }, 1400);
}
