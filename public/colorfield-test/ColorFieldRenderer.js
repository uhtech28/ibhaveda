/**
 * ColorFieldRenderer.js
 * ---------------------------------------------------------
 * Loads a palette-indexed, chunked, RLE/raw-encoded "color field"
 * (village_colorfield.json) and reconstructs it as a Phaser texture.
 * Pixels are NEVER stored as raw RGB in the JSON — only palette
 * indices (packed as base64 uint16 per chunk, optionally RLE-paired).
 *
 * Supports:
 *   - Zoom (it's a normal Phaser texture/sprite, so camera zoom just works)
 *   - Runtime palette animation (water cycling, day/night tint, seasonal recolor)
 *     by mutating the palette and re-blitting only the affected pixels.
 * ---------------------------------------------------------
 */

class ColorFieldScene extends Phaser.Scene {
  constructor() {
    super('ColorFieldScene');
    this.fieldData = null;     // parsed JSON
    this.indexBuffer = null;   // Uint16Array, width*height, one palette index per pixel
    this.palette = null;       // Uint8ClampedArray, paletteSize*4 (RGBA) - LIVE, mutable
    this.basePalette = null;   // Uint8ClampedArray copy of the original palette (for resets/blends)
    this.canvasTexture = null; // Phaser CanvasTexture
    this.imageData = null;     // ImageData backing the canvas, reused every frame
    this._time = 0;
  }

  preload() {
    this.load.json('colorfield', 'village_colorfield.json');
  }

  create() {
    this.fieldData = this.cache.json.get('colorfield');
    this._decodeChunksToIndexBuffer();
    this._buildPaletteBuffer();
    this._buildCanvasTexture();

    // Place the reconstructed image as a normal sprite -> camera zoom works for free
    this.add.image(0, 0, 'colorfield-tex').setOrigin(0, 0);

    this.cameras.main.setZoom(1);
    this.input.on('wheel', (pointer, gameObjects, dx, dy) => {
      const cam = this.cameras.main;
      const newZoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.25, 6);
      cam.setZoom(newZoom);
    });

    // Example runtime animations (call any of these from outside, or wire to UI)
    this.waterCycleTween = null;
    this.startWaterCycling();
  }

  update(time, delta) {
    this._time += delta;
  }

  // -----------------------------------------------------------------
  // DECODE: base64 chunk payloads -> a flat Uint16Array index buffer
  // -----------------------------------------------------------------
  _decodeChunksToIndexBuffer() {
    const { width, height, chunkSize, chunks } = this.fieldData;
    this.indexBuffer = new Uint16Array(width * height);

    for (const chunk of chunks) {
      const { x, y, width: cw, height: ch, encoding, data } = chunk;
      const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      const u16 = new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);

      let dst = 0;
      const localBuf = new Uint16Array(cw * ch);

      if (encoding === 'rle') {
        // pairs: [index, runLength, index, runLength, ...]
        for (let i = 0; i < u16.length; i += 2) {
          const idx = u16[i];
          const run = u16[i + 1];
          localBuf.fill(idx, dst, dst + run);
          dst += run;
        }
      } else {
        // raw flat indices
        localBuf.set(u16);
      }

      // blit chunk into the global index buffer
      for (let row = 0; row < ch; row++) {
        const srcStart = row * cw;
        const dstStart = (y + row) * width + x;
        this.indexBuffer.set(localBuf.subarray(srcStart, srcStart + cw), dstStart);
      }
    }
  }

  // -----------------------------------------------------------------
  // PALETTE: hex strings -> RGBA Uint8ClampedArray (mutable at runtime)
  // -----------------------------------------------------------------
  _buildPaletteBuffer() {
    const hexList = this.fieldData.palette;
    this.palette = new Uint8ClampedArray(hexList.length * 4);
    for (let i = 0; i < hexList.length; i++) {
      const hex = hexList[i];
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      this.palette[i * 4 + 0] = r;
      this.palette[i * 4 + 1] = g;
      this.palette[i * 4 + 2] = b;
      this.palette[i * 4 + 3] = 255;
    }
    this.basePalette = this.palette.slice(); // immutable backup for resets
  }

  // -----------------------------------------------------------------
  // RENDER: index buffer + palette -> CanvasTexture pixels
  // -----------------------------------------------------------------
  _buildCanvasTexture() {
    const { width, height } = this.fieldData;
    this.canvasTexture = this.textures.createCanvas('colorfield-tex', width, height);
    const ctx = this.canvasTexture.getContext();
    this.imageData = ctx.createImageData(width, height);
    this._blitAll();
    this.canvasTexture.refresh();
  }

  /** Re-blit every pixel from indexBuffer through the (possibly animated) palette. */
  _blitAll() {
    const { width, height } = this.fieldData;
    const px = this.imageData.data;
    const idx = this.indexBuffer;
    const pal = this.palette;
    for (let i = 0, n = width * height; i < n; i++) {
      const p = idx[i] * 4;
      const o = i * 4;
      px[o] = pal[p];
      px[o + 1] = pal[p + 1];
      px[o + 2] = pal[p + 2];
      px[o + 3] = 255;
    }
    this.canvasTexture.getContext().putImageData(this.imageData, 0, 0);
    this.canvasTexture.refresh();
  }

  /** Only re-blit pixels whose palette index is in `indices` (fast path for color animation). */
  _blitPaletteIndices(indices) {
    const want = new Set(indices);
    const { width, height } = this.fieldData;
    const px = this.imageData.data;
    const idx = this.indexBuffer;
    const pal = this.palette;
    for (let i = 0, n = width * height; i < n; i++) {
      if (!want.has(idx[i])) continue;
      const p = idx[i] * 4;
      const o = i * 4;
      px[o] = pal[p];
      px[o + 1] = pal[p + 1];
      px[o + 2] = pal[p + 2];
    }
    this.canvasTexture.getContext().putImageData(this.imageData, 0, 0);
    this.canvasTexture.refresh();
  }

  // -----------------------------------------------------------------
  // RUNTIME COLOR ANIMATION EXAMPLES
  // -----------------------------------------------------------------

  /** Identify which palette indices look like "water blue" once, then hue-cycle them. */
  _findWaterIndices() {
    if (this._waterIdx) return this._waterIdx;
    const out = [];
    for (let i = 0; i < this.basePalette.length / 4; i++) {
      const r = this.basePalette[i * 4], g = this.basePalette[i * 4 + 1], b = this.basePalette[i * 4 + 2];
      // crude heuristic: blue-dominant, reasonably saturated
      if (b > 90 && b > r + 20 && b >= g) out.push(i);
    }
    this._waterIdx = out;
    return out;
  }

  startWaterCycling() {
    const waterIdx = this._findWaterIndices();
    this.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        const t = this._time * 0.001;
        for (const i of waterIdx) {
          const br = this.basePalette[i * 4], bg = this.basePalette[i * 4 + 1], bb = this.basePalette[i * 4 + 2];
          // subtle brightness ripple, phase offset by index for a "shimmer" look
          const shimmer = 1 + 0.12 * Math.sin(t * 2 + i * 0.5);
          this.palette[i * 4 + 0] = Phaser.Math.Clamp(br * shimmer, 0, 255);
          this.palette[i * 4 + 1] = Phaser.Math.Clamp(bg * shimmer, 0, 255);
          this.palette[i * 4 + 2] = Phaser.Math.Clamp(bb * (1 + 0.06 * Math.sin(t * 2 + i)), 0, 255);
        }
        this._blitPaletteIndices(waterIdx);
      }
    });
  }

  /** Apply a global day/night tint by multiplying the whole live palette, then re-blit everything. */
  setDayNightTint(tint = { r: 1, g: 1, b: 1 }) {
    for (let i = 0; i < this.basePalette.length / 4; i++) {
      this.palette[i * 4 + 0] = Phaser.Math.Clamp(this.basePalette[i * 4 + 0] * tint.r, 0, 255);
      this.palette[i * 4 + 1] = Phaser.Math.Clamp(this.basePalette[i * 4 + 1] * tint.g, 0, 255);
      this.palette[i * 4 + 2] = Phaser.Math.Clamp(this.basePalette[i * 4 + 2] * tint.b, 0, 255);
    }
    this._blitAll();
  }

  /** Example presets */
  goNight() { this.setDayNightTint({ r: 0.35, g: 0.4, b: 0.65 }); }
  goDay() { this.setDayNightTint({ r: 1, g: 1, b: 1 }); }
  goSunset() { this.setDayNightTint({ r: 1.15, g: 0.8, b: 0.65 }); }

  /** Seasonal recolor: shift "green" palette entries toward autumn orange/brown. */
  applyAutumn(strength = 0.6) {
    for (let i = 0; i < this.basePalette.length / 4; i++) {
      const r = this.basePalette[i * 4], g = this.basePalette[i * 4 + 1], b = this.basePalette[i * 4 + 2];
      const isGreenish = g > r && g > b && g > 60;
      if (isGreenish) {
        this.palette[i * 4 + 0] = Phaser.Math.Clamp(r + (200 - r) * strength * 0.6, 0, 255);
        this.palette[i * 4 + 1] = Phaser.Math.Clamp(g - g * strength * 0.45, 0, 255);
        this.palette[i * 4 + 2] = Phaser.Math.Clamp(b * (1 - strength * 0.3), 0, 255);
      }
    }
    this._blitAll();
  }

  resetPalette() {
    this.palette.set(this.basePalette);
    this._blitAll();
  }
}

const config = {
  type: Phaser.AUTO,
  width: 1788,
  height: 880,
  parent: 'game-container',
  backgroundColor: '#000000',
  scene: [ColorFieldScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
};

const game = new Phaser.Game(config);
// Place village_colorfield.json next to your bundle/public assets folder.
