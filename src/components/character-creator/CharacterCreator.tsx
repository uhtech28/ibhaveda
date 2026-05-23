"use client";

/**
 * CharacterCreator.tsx
 *
 * Pixel avatar builder — 32×48 canvas renderer.
 * Supports layered sprite rendering: body → hair → outfit → accessories.
 *
 * Produces a 4-frame walk cycle animation from the selected options.
 * Template-specific outfits available based on active template.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtomValue } from "jotai";
import { templateIdAtom } from "@/lib/stores/hudStore";
import type { TemplateId } from "@/config/templates";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CANVAS_W = 32;
const CANVAS_H = 48;
const DISPLAY_SCALE = 6;  // 192×288 display size

// 16-color palette (indexed)
const PALETTE_16 = [
  "#000000", "#1a1a2e", "#16213e", "#0f3460",
  "#533483", "#e94560", "#f5a623", "#f0e68c",
  "#8fbc8f", "#3cb371", "#20b2aa", "#87ceeb",
  "#deb887", "#8b4513", "#ffdead", "#ffffff",
];

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface PixelSprite {
  /** 32×48 pixel grid as 1D array of palette indices (-1 = transparent) */
  pixels: number[];
}

interface LayerOption {
  id: string;
  name: string;
  icon: string;
  templateOnly?: TemplateId;
  sprite: PixelSprite;
}

interface CharacterConfig {
  bodyType: string;
  hairStyle: string;
  outfit: string;
  accessory: string;
  skinTone: string;
  hairColor: string;
  outfitColor: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SPRITE GENERATORS (procedural pixel art)
// ─────────────────────────────────────────────────────────────────────────────

/** Create a blank 32×48 sprite (all transparent) */
function blankSprite(): PixelSprite {
  return { pixels: new Array(CANVAS_W * CANVAS_H).fill(-1) };
}

/** Set a pixel in the sprite at (x, y) */
function setPixel(sprite: PixelSprite, x: number, y: number, colorIdx: number): void {
  if (x < 0 || x >= CANVAS_W || y < 0 || y >= CANVAS_H) return;
  sprite.pixels[y * CANVAS_W + x] = colorIdx;
}

/** Draw a filled rectangle */
function fillRect(
  sprite: PixelSprite,
  x: number, y: number,
  w: number, h: number,
  colorIdx: number,
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(sprite, x + dx, y + dy, colorIdx);
    }
  }
}

/** Generate a base body sprite */
function generateBodySprite(skinIdx: number): PixelSprite {
  const s = blankSprite();
  // Head
  fillRect(s, 12, 4, 8, 8, skinIdx);
  // Neck
  fillRect(s, 14, 12, 4, 2, skinIdx);
  // Torso
  fillRect(s, 10, 14, 12, 10, skinIdx);
  // Left arm
  fillRect(s, 7, 14, 3, 8, skinIdx);
  // Right arm
  fillRect(s, 22, 14, 3, 8, skinIdx);
  // Left leg
  fillRect(s, 10, 24, 5, 12, skinIdx);
  // Right leg
  fillRect(s, 17, 24, 5, 12, skinIdx);
  return s;
}

/** Generate an outfit layer */
function generateOutfitSprite(colorIdx: number, style: "plain" | "robe" | "lab_coat" | "artistic"): PixelSprite {
  const s = blankSprite();
  switch (style) {
    case "robe":
      // Long academic robe
      fillRect(s, 8, 14, 16, 16, colorIdx);
      fillRect(s, 6, 20, 20, 18, colorIdx); // wider lower robe
      break;
    case "lab_coat":
      // Lab coat — white with pockets
      fillRect(s, 9, 14, 14, 14, colorIdx);
      fillRect(s, 9, 24, 5, 12, colorIdx);
      fillRect(s, 18, 24, 5, 12, colorIdx);
      // Pocket
      fillRect(s, 20, 17, 3, 4, 0); // pocket outline
      break;
    case "artistic":
      // Layered creative outfit
      fillRect(s, 10, 14, 12, 10, colorIdx);
      fillRect(s, 8, 16, 14, 8, colorIdx + 1 < 16 ? colorIdx + 1 : colorIdx);
      fillRect(s, 10, 24, 5, 12, colorIdx);
      fillRect(s, 17, 24, 5, 12, colorIdx);
      break;
    default: // plain
      fillRect(s, 10, 14, 12, 10, colorIdx);
      fillRect(s, 10, 24, 5, 12, colorIdx);
      fillRect(s, 17, 24, 5, 12, colorIdx);
      break;
  }
  return s;
}

/** Generate hair layer */
function generateHairSprite(hairColorIdx: number, style: "short" | "long" | "bun" | "wild"): PixelSprite {
  const s = blankSprite();
  switch (style) {
    case "long":
      fillRect(s, 11, 2, 10, 10, hairColorIdx);
      fillRect(s, 11, 10, 2, 6, hairColorIdx); // left drape
      fillRect(s, 19, 10, 2, 6, hairColorIdx); // right drape
      break;
    case "bun":
      fillRect(s, 12, 2, 8, 6, hairColorIdx);
      fillRect(s, 14, 0, 4, 3, hairColorIdx); // top bun
      break;
    case "wild":
      fillRect(s, 10, 1, 12, 8, hairColorIdx);
      setPixel(s, 9, 3, hairColorIdx);
      setPixel(s, 9, 2, hairColorIdx);
      setPixel(s, 22, 3, hairColorIdx);
      setPixel(s, 22, 2, hairColorIdx);
      setPixel(s, 15, 0, hairColorIdx);
      setPixel(s, 16, 0, hairColorIdx);
      break;
    default: // short
      fillRect(s, 11, 2, 10, 6, hairColorIdx);
      break;
  }
  return s;
}

/** Merge two sprites (top sprite's non-transparent pixels override) */
function mergeSprites(base: PixelSprite, top: PixelSprite): PixelSprite {
  const result: PixelSprite = { pixels: [...base.pixels] };
  for (let i = 0; i < top.pixels.length; i++) {
    if (top.pixels[i] >= 0) {
      result.pixels[i] = top.pixels[i];
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS RENDERER
// ─────────────────────────────────────────────────────────────────────────────

function renderSpriteToCanvas(
  canvas: HTMLCanvasElement,
  sprite: PixelSprite,
  scale: number = 1,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = CANVAS_W * scale;
  canvas.height = CANVAS_H * scale;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < CANVAS_H; y++) {
    for (let x = 0; x < CANVAS_W; x++) {
      const colorIdx = sprite.pixels[y * CANVAS_W + x];
      if (colorIdx >= 0) {
        ctx.fillStyle = PALETTE_16[colorIdx] ?? "#000000";
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER SELECTION PANELS
// ─────────────────────────────────────────────────────────────────────────────

interface SelectionPanelProps {
  label: string;
  options: { id: string; name: string; icon: string }[];
  selected: string;
  onSelect: (id: string) => void;
  accentColor: string;
}

function SelectionPanel({ label, options, selected, onSelect, accentColor }: SelectionPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-white/50">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
            style={{
              background: selected === opt.id ? `${accentColor}33` : "rgba(255,255,255,0.05)",
              border: `1px solid ${selected === opt.id ? accentColor : "rgba(255,255,255,0.1)"}`,
              color: selected === opt.id ? accentColor : "rgba(255,255,255,0.6)",
              boxShadow: selected === opt.id ? `0 0 8px ${accentColor}44` : "none",
            }}
          >
            <span>{opt.icon}</span>
            <span>{opt.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PALETTE PICKER
// ─────────────────────────────────────────────────────────────────────────────

interface PalettePickerProps {
  label: string;
  selected: number;
  onSelect: (idx: number) => void;
}

function PalettePicker({ label, selected, onSelect }: PalettePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-white/50">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {PALETTE_16.map((color, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className="rounded-full transition-all"
            style={{
              width: 20,
              height: 20,
              background: color,
              border: selected === idx ? "2px solid white" : "2px solid transparent",
              boxShadow: selected === idx ? `0 0 6px ${color}` : "none",
            }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER CREATOR MAIN
// ─────────────────────────────────────────────────────────────────────────────

const HAIR_OPTIONS = [
  { id: "short", name: "Short", icon: "✂️" },
  { id: "long", name: "Long", icon: "🌊" },
  { id: "bun", name: "Bun", icon: "🔵" },
  { id: "wild", name: "Wild", icon: "⚡" },
];

const OUTFIT_OPTIONS = [
  { id: "plain", name: "Casual", icon: "👕" },
  { id: "robe", name: "Academic Robe", icon: "🎓" },
  { id: "lab_coat", name: "Lab Coat", icon: "🥼" },
  { id: "artistic", name: "Artist Smock", icon: "🎨" },
];

const TEMPLATE_ACCENT_COLORS: Record<TemplateId, string> = {
  venture: "#6366f1",
  academic: "#d4a853",
  lab: "#06d6a0",
  creative: "#ffd166",
};

export function CharacterCreator() {
  const templateId = useAtomValue(templateIdAtom);
  const accentColor = TEMPLATE_ACCENT_COLORS[templateId];

  const [config, setConfig] = useState<CharacterConfig>({
    bodyType: "standard",
    hairStyle: "short",
    outfit: "plain",
    accessory: "none",
    skinTone: "14",   // Palette index
    hairColor: "7",
    outfitColor: "3",
  });

  const [animFrame, setAnimFrame] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compose sprite from layers
  const composedSprite = useCallback((): PixelSprite => {
    const skinIdx = parseInt(config.skinTone);
    const hairIdx = parseInt(config.hairColor);
    const outfitIdx = parseInt(config.outfitColor);

    const body = generateBodySprite(skinIdx);
    const outfit = generateOutfitSprite(outfitIdx, config.outfit as "plain" | "robe" | "lab_coat" | "artistic");
    const hair = generateHairSprite(hairIdx, config.hairStyle as "short" | "long" | "bun" | "wild");

    return mergeSprites(mergeSprites(body, outfit), hair);
  }, [config]);

  // Render to canvas when config changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sprite = composedSprite();
    renderSpriteToCanvas(canvas, sprite, DISPLAY_SCALE);
  }, [config, composedSprite]);

  // Animate walk cycle (4 frames)
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimFrame((f) => (f + 1) % 4);
    }, 180);
    return () => clearInterval(interval);
  }, []);

  const updateConfig = (key: keyof CharacterConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div
      className="flex flex-col gap-6 p-6 rounded-2xl max-w-2xl mx-auto"
      style={{
        background: "rgba(10, 10, 20, 0.95)",
        border: `1px solid ${accentColor}33`,
        boxShadow: `0 0 40px ${accentColor}22`,
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">🧙</span>
        <div>
          <h2 className="text-lg font-bold text-white">Character Creator</h2>
          <p className="text-xs text-white/40">Design your pixel avatar</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Preview */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: `2px solid ${accentColor}44`,
              padding: 8,
              imageRendering: "pixelated",
            }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W * DISPLAY_SCALE}
              height={CANVAS_H * DISPLAY_SCALE}
              style={{
                imageRendering: "pixelated",
                display: "block",
              }}
            />
          </div>
          <span className="text-xs text-white/40 font-mono">Frame {animFrame + 1}/4</span>
          <button
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{
              background: `${accentColor}22`,
              border: `1px solid ${accentColor}`,
              color: accentColor,
            }}
          >
            Save Avatar
          </button>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 360 }}>
          <SelectionPanel
            label="Hair Style"
            options={HAIR_OPTIONS}
            selected={config.hairStyle}
            onSelect={(id) => updateConfig("hairStyle", id)}
            accentColor={accentColor}
          />
          <SelectionPanel
            label="Outfit"
            options={OUTFIT_OPTIONS}
            selected={config.outfit}
            onSelect={(id) => updateConfig("outfit", id)}
            accentColor={accentColor}
          />
          <PalettePicker
            label="Skin Tone"
            selected={parseInt(config.skinTone)}
            onSelect={(idx) => updateConfig("skinTone", String(idx))}
          />
          <PalettePicker
            label="Hair Color"
            selected={parseInt(config.hairColor)}
            onSelect={(idx) => updateConfig("hairColor", String(idx))}
          />
          <PalettePicker
            label="Outfit Color"
            selected={parseInt(config.outfitColor)}
            onSelect={(idx) => updateConfig("outfitColor", String(idx))}
          />
        </div>
      </div>
    </div>
  );
}

export default CharacterCreator;
