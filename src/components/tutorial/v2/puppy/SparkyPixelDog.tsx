"use client";

/**
 * SparkyPixelDog -- a true pixel-art puppy rendered via SVG <rect>
 * grid. No external assets, no GIFs, no PNGs. Pure code.
 *
 * The dog is encoded as an ASCII grid (one character per pixel)
 * which is then expanded into <rect> elements. Each character maps
 * to a colour in PALETTE. "." = transparent.
 *
 * Grid is 24 columns x 22 rows. Each cell renders as one SVG
 * "pixel" at viewBox scale. The crispEdges shape-rendering hint
 * keeps the pixel art sharp at every zoom level.
 *
 * Moods change the dog's expression + animation:
 *   idle        -- mouth closed, slow breath
 *   talking     -- mouth open + tongue, gentle bob
 *   pointing    -- one paw raised, tilted head
 *   celebrating -- arms up, sparkle pixels
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export type DogMood = "idle" | "talking" | "pointing" | "celebrating";

// Palette -- single character -> CSS color
const PALETTE: Record<string, string> = {
  ".": "transparent",        // empty
  "K": "#0a0a14",            // outline black
  "B": "#7a3f1c",            // dark brown (ears, accents)
  "O": "#e6822f",            // orange (body main)
  "L": "#f4a85e",            // light orange (belly, highlights)
  "C": "#fff5e6",            // cream (chest, face inner)
  "N": "#1a1a1a",            // nose
  "E": "#1a1a1a",            // eye
  "W": "#ffffff",            // eye sparkle
  "T": "#ff5577",            // tongue
  "P": "#ffe66d",            // sparkles for celebration
  "G": "#94d977",            // green (collar tag if needed)
};

// IDLE pose -- mouth closed, looking forward, tail down
const FRAME_IDLE = [
  ".........BBBBBB........BBBBBB...",
  "........BOOOOBB.........BOOOOB..",
  ".......BOOLLOBB........BOLLOOB..",
  ".......BOLLLLOB........BOLLLLB..",
  "........BBBBBB...........BBBBB..",
  "...........BOOOOOOOOOOOOB.......",
  "..........BOOLLLLLLLLLOOB.......",
  ".........BOOLLLCCCCCLLOOB.......",
  "........BOOLCCWEKKKEWCCLOB......",
  "........BOOLCCKKKKKKKCCLOB......",
  "........BOOLCCKNNNNNKCCLOB......",
  "........BOOLCCCKKKKKCCCLOB......",
  ".........BOLLCCCCCCCCCLLOB......",
  "..........BOOLLLLLLLLLOOB.......",
  "..........BOOLLLLLLLLLOOB.......",
  "..........BOOLLLLLLLLLOOB.......",
  "..........BOOLLLLLLLLLOOB.......",
  "..........BOOOOOOOOOOOOB........",
  ".........BOOB.BOOB.BOOB.........",
  ".........BOOB.BOOB.BOOB.........",
  "..........BB...BB...BB..........",
  "................................",
];

// TALKING pose -- mouth open with tongue, ears slightly perked
const FRAME_TALK = [
  ".........BBBBBB........BBBBBB...",
  "........BOOOOBB.........BOOOOB..",
  ".......BOOLLOBB........BOLLOOB..",
  ".......BOLLLLOB........BOLLLLB..",
  "........BBBBBB...........BBBBB..",
  "...........BOOOOOOOOOOOOB.......",
  "..........BOOLLLLLLLLLOOB.......",
  ".........BOOLLLCCCCCLLOOB.......",
  "........BOOLCCWEKKKEWCCLOB......",
  "........BOOLCCKKKKKKKCCLOB......",
  "........BOOLCCKNNNNNKCCLOB......",
  "........BOOLCCCKTTTKCCCLOB......",
  ".........BOLLCCCTTTTCCLLOB......",
  "..........BOOLLLCCCCCLLOOB......",
  "..........BOOLLLLLLLLLOOB.......",
  "..........BOOLLLLLLLLLOOB.......",
  "..........BOOLLLLLLLLLOOB.......",
  "..........BOOOOOOOOOOOOB........",
  ".........BOOB.BOOB.BOOB.........",
  ".........BOOB.BOOB.BOOB.........",
  "..........BB...BB...BB..........",
  "................................",
];

// POINTING pose -- right paw raised
const FRAME_POINT = [
  ".........BBBBBB........BBBBBB...",
  "........BOOOOBB.........BOOOOB..",
  ".......BOOLLOBB........BOLLOOB..",
  ".......BOLLLLOB........BOLLLLB..",
  "........BBBBBB...........BBBBB..",
  "...........BOOOOOOOOOOOOB.......",
  "..........BOOLLLLLLLLLOOBB......",
  ".........BOOLLLCCCCCLLOOBOB.....",
  "........BOOLCCWEKKKEWCCLOOBOB...",
  "........BOOLCCKKKKKKKCCLOOBOLB..",
  "........BOOLCCKNNNNNKCCLOOBLOB..",
  "........BOOLCCCKKKKKCCCLOOBBB...",
  ".........BOLLCCCCCCCCCLLOB......",
  "..........BOOLLLLLLLLLOOB.......",
  "..........BOOLLLLLLLLLOOB.......",
  "..........BOOLLLLLLLLLOOB.......",
  "..........BOOLLLLLLLLLOOB.......",
  "..........BOOOOOOOOOOOOB........",
  ".........BOOB.BOOB.BOOB.........",
  ".........BOOB.BOOB.BOOB.........",
  "..........BB...BB...BB..........",
  "................................",
];

// CELEBRATING pose -- arms up + sparkle pixels
const FRAME_CHEER = [
  "....P....BBBBBB........BBBBBB..P",
  "....P...BOOOOBB.........BOOOOB.P",
  "...PPP.BOOLLOBB........BOLLOOB..",
  "....P..BOLLLLOB........BOLLLLB.P",
  ".P......BBBBBB...........BBBBBPP",
  ".PP........BOOOOOOOOOOOOB....P..",
  "..........BOOLLLLLLLLLOOB.......",
  ".........BOOLLLCCCCCLLOOB....P..",
  "........BOOLCCWEKKKEWCCLOB..PPP.",
  "........BOOLCCKKKKKKKCCLOB...P..",
  "........BOOLCCKNNNNNKCCLOB......",
  "........BOOLCCCKTTTKCCCLOB....P.",
  ".........BOLLCCCTTTTCCLLOB...PPP",
  "..........BOOLLLCCCCCLLOOB....P.",
  ".B........BOOLLLLLLLLLOOB.....B.",
  "BOB.......BOOLLLLLLLLLOOB....BOB",
  "BOB.......BOOLLLLLLLLLOOB....BOB",
  ".B........BOOOOOOOOOOOOB......B.",
  ".........BOOB.BOOB.BOOB.........",
  ".........BOOB.BOOB.BOOB.........",
  "..........BB...BB...BB..........",
  "................................",
];

function frameFor(mood: DogMood, alt: boolean): string[] {
  if (mood === "talking") {
    // Alternate between closed-ish and open mouth for talking effect
    return alt ? FRAME_IDLE : FRAME_TALK;
  }
  if (mood === "pointing") return FRAME_POINT;
  if (mood === "celebrating") {
    return alt ? FRAME_IDLE : FRAME_CHEER;
  }
  return FRAME_IDLE;
}

interface SparkyPixelDogProps {
  mood: DogMood;
  /** Rendered size in pixels (the SVG scales to fit). Default 170. */
  size?: number;
}

export function SparkyPixelDog({ mood, size = 170 }: SparkyPixelDogProps) {
  // Toggle "alt" flag every 350-500ms so talking and cheering animate
  const [alt, setAlt] = useState(false);
  useEffect(() => {
    const interval = mood === "celebrating" ? 220 : mood === "talking" ? 320 : 1400;
    const id = window.setInterval(() => setAlt((a) => !a), interval);
    return () => window.clearInterval(id);
  }, [mood]);

  const grid = frameFor(mood, alt);
  const cols = grid[0]?.length ?? 32;
  const rows = grid.length;

  // Subtle full-body bob to add life
  const bobAmount = mood === "celebrating" ? 4 : mood === "talking" ? 2 : 1.5;
  const bobDuration = mood === "celebrating" ? 0.4 : 1.8;

  return (
    <motion.svg
      width={size}
      height={size * (rows / cols)}
      viewBox={`0 0 ${cols} ${rows}`}
      shapeRendering="crispEdges"
      style={{
        imageRendering: "pixelated",
        filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))",
      }}
      animate={{ y: [0, -bobAmount, 0] }}
      transition={{
        duration: bobDuration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {grid.flatMap((row, y) =>
        row.split("").map((ch, x) => {
          const color = PALETTE[ch];
          if (!color || color === "transparent") return null;
          return (
            <rect
              key={`${x}-${y}-${ch}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={color}
            />
          );
        }),
      )}
    </motion.svg>
  );
}
