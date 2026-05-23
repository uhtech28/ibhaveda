# Stage 7 Visual Guide

## 🗺️ Tilemap Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    STAGE 7: SHADOW CROSSROADS               │
│                    (Twilight Purple Theme)                  │
└─────────────────────────────────────────────────────────────┘

     0   1   2   3   4   5   6   7   8   9  10  11  12  13  14
   ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
 0 │ G │ G │ G │ G │ G │ G │ G │ V │ G │ G │ G │ G │ G │ G │ G │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 1 │ G │ G │ T │ G │ G │ G │ G │ V │ G │ G │ G │ G │ G │ T │ G │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 2 │ G │ G │ G │ G │ G │ M │ G │ V │ G │ G │ G │ G │ G │ G │ G │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 3 │ G │ G │ G │ G │ G │ G │ G │ V │ G │ G │ T │ G │ G │ G │ G │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 4 │ H │ H │ H │ H │ H │ H │ H │ X │ H │ H │ H │ H │ H │ H │ H │ ← Horizontal Path
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 5 │ G │ G │ G │ G │ G │ G │ G │ V │ G │ G │ G │ M │ G │ G │ G │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 6 │ G │ T │ G │ G │ G │ G │ G │ V │ G │ G │ G │ G │ G │ G │ T │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 7 │ G │ G │ G │ M │ G │ G │ G │ V │ G │ G │ G │ G │ G │ G │ G │
   └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
                                 ↑
                          Vertical Path

Legend:
  G = Ground (Purple twilight)
  H = Horizontal Path
  V = Vertical Path
  X = Intersection (Center marker)
  T = Tree (Purple-tinted)
  M = Mushroom (Glowing)
```

---

## 🎨 Color Palette Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                    STAGE 7 COLOR PALETTE                    │
└─────────────────────────────────────────────────────────────┘

Sky/Background:
████████  0x13082a  (Deep Purple)

Ground:
████████  0x1e0d40  (Dark Violet)

Ground Alt:
████████  0x180a30  (Darker Purple)

Accent:
████████  0x7c3aed  (Bright Purple)

Highlight:
████████  0xa78bfa  (Lavender)

Glow:
████████  0xddd6fe  (Light Purple)

Tree:
████████  0x3d1d6e  (Purple Tree)

Tree Dark:
████████  0x2d0f5a  (Dark Purple Trunk)
```

---

## 🏗️ Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      RENDER LAYERS                          │
└─────────────────────────────────────────────────────────────┘

Depth 9: Lamp Posts (Front decorations)
         ↑
Depth 8: Buildings (Houses, structures)
         ↑
Depth 7: Intersection Marker
         ↑
Depth 6: Trees (Tall decorations)
         ↑
Depth 5: Tree Trunks
         ↑
Depth 4: Glowing Mushrooms (ADD blend)
         ↑
Depth 3: Path Edge Highlights
         ↑
Depth 2: Paths (Crossroads)
         ↑
Depth 1: Ground Tiles (Base layer)
```

---

## 🔄 Code Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              createCrossroadsTilePanel()                    │
│              (Main entry point)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─ Check: External tileset exists?
                       │
           ┌───────────┴───────────┐
           │                       │
          YES                     NO
           │                       │
           ▼                       ▼
┌──────────────────────┐  ┌──────────────────────┐
│ External Tileset     │  │ Existing Assets      │
│ Method               │  │ Method               │
├──────────────────────┤  ├──────────────────────┤
│ • Load TileSprite    │  │ • Generate 2D array  │
│ • Add buildings      │  │ • Render tiles       │
│ • Create paths       │  │ • Reuse sprites      │
│ • Add decorations    │  │ • Apply tints        │
└──────────────────────┘  └──────────────────────┘
           │                       │
           └───────────┬───────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │  Stage 7 Complete!    │
           │  (Purple Crossroads)  │
           └───────────────────────┘
```

---

## 📦 Asset Detection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ASSET DETECTION                          │
└─────────────────────────────────────────────────────────────┘

Check: stage7-tileset exists?
  │
  ├─ YES → Use external tileset (TileSprite)
  │
  └─ NO → Check: Tree_Emerald_1 exists?
           │
           ├─ YES → Use existing tree sprite (tinted purple)
           │
           └─ NO → Use simple shapes (ellipse + rectangle)

Check: stage7-buildings exists?
  │
  ├─ YES → Use external buildings
  │
  └─ NO → Check: House_Hay_2 exists?
           │
           ├─ YES → Use existing house (tinted purple)
           │
           └─ NO → Skip buildings

Check: LampPost_3 exists?
  │
  ├─ YES → Add lamp posts (tinted purple)
  │
  └─ NO → Skip lamp posts
```

---

## 🎯 Tile Type Mapping

```
┌─────────────────────────────────────────────────────────────┐
│                    TILE TYPE SYSTEM                         │
└─────────────────────────────────────────────────────────────┘

Tile ID │ Name      │ Visual           │ Depth │ Blend Mode
────────┼───────────┼──────────────────┼───────┼────────────
   0    │ EMPTY     │ (nothing)        │   -   │ Normal
   1    │ GROUND    │ Purple square    │   1   │ Normal
   2    │ PATH_H    │ Horizontal path  │   2   │ Normal
   3    │ PATH_V    │ Vertical path    │   2   │ Normal
   4    │ TREE      │ Tree sprite      │   6   │ Normal
   5    │ GLOW      │ Mushroom glow    │   4   │ ADD

Rendering Logic:
  for each tile in 2D array:
    switch (tileType):
      case GROUND: → Draw purple rectangle
      case PATH_H: → Draw path + edge glow
      case PATH_V: → Draw path
      case TREE:   → Draw tree sprite or shape
      case GLOW:   → Draw mushroom with ADD blend
```

---

## 🌟 Visual Effects

```
┌─────────────────────────────────────────────────────────────┐
│                    VISUAL EFFECTS                           │
└─────────────────────────────────────────────────────────────┘

1. Checkerboard Ground Pattern
   ┌───┬───┬───┐
   │ ▓ │ ░ │ ▓ │  Alternating dark/light purple
   ├───┼───┼───┤
   │ ░ │ ▓ │ ░ │  Creates subtle texture
   ├───┼───┼───┤
   │ ▓ │ ░ │ ▓ │
   └───┴───┴───┘

2. Path Edge Highlights
   ═══════════════  ← Bright purple edge (0x7c3aed)
   ───────────────  ← Dark path (0x1e0d40)
   ═══════════════  ← Bright purple edge

3. Glowing Mushrooms (ADD Blend)
        ✧
       ╱ ╲
      ╱   ╲    ← Outer glow (0xa78bfa, alpha 0.15)
     ╱  ●  ╲   ← Inner mushroom (0x6d28d9, alpha 0.6)
    ╱       ╲
   ───────────

4. Purple Tint on Sprites
   Original Sprite → setTint(0xddd6fe) → Purple-tinted Sprite
   🏠 (brown)      →                   → 🏠 (purple)
```

---

## 📐 Coordinate System

```
┌─────────────────────────────────────────────────────────────┐
│                  COORDINATE CONVERSION                      │
└─────────────────────────────────────────────────────────────┘

Tile Coordinates (Grid):
  (0,0)  (1,0)  (2,0)  (3,0)
  (0,1)  (1,1)  (2,1)  (3,1)
  (0,2)  (1,2)  (2,2)  (3,2)

Pixel Coordinates (Screen):
  toX(col) = panelX + col * TILE_SIZE + TILE_SIZE / 2
  toY(row) = panelOffsetY + row * TILE_SIZE + TILE_SIZE / 2

Example (TILE_SIZE = 32):
  Tile (2, 1) → Pixel (panelX + 80, panelOffsetY + 48)
                        ↑              ↑
                    2 * 32 + 16    1 * 32 + 16
```

---

## 🎮 Interactive Elements

```
┌─────────────────────────────────────────────────────────────┐
│                  INTERACTIVE ELEMENTS                       │
└─────────────────────────────────────────────────────────────┘

Checkpoint Nodes (placed on paths):
  ○ ─── ○ ─── ○ ─── ○
  │             │
  ○             ○
  │             │
  ○ ─── ● ─── ○
        ↑
    Active checkpoint
    (Persona floats here)

Crossroads Intersection:
        │
        │
  ──────●──────  ← Center marker (0x5b2ea3)
        │
        │

Buildings (decorative):
    🏠        🏠
  (House)   (House)
  Purple    Purple
  tinted    tinted
```

---

## 🔧 Customization Points

```
┌─────────────────────────────────────────────────────────────┐
│                  EASY CUSTOMIZATION                         │
└─────────────────────────────────────────────────────────────┘

1. Change Colors:
   const COLORS = {
     sky: 0x13082a,     ← Change this
     ground: 0x1e0d40,  ← Or this
     accent: 0x7c3aed,  ← Or this
   };

2. Adjust Tree Density:
   (row + col) % 7 === 0  ← Change 7 to 5 (more trees)
                          ← Change 7 to 10 (fewer trees)

3. Modify Path Width:
   row >= midRow - 1 && row <= midRow + 1
                  ↑                    ↑
              Change these for wider/narrower paths

4. Add New Tile Types:
   const TORCH = 6;  ← Add new constant
   
   // In array generation:
   if (condition) return TORCH;
   
   // In switch statement:
   case TORCH: { /* render torch */ }
```

---

## 📊 Performance Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                  PERFORMANCE COMPARISON                     │
└─────────────────────────────────────────────────────────────┘

Old Implementation:
  Graphics Objects: ████████████████████████████ (50+)
  Render Calls:     ████████████████████ (Multiple)
  Memory:           ████████████████ (Higher)

New Implementation:
  Graphics Objects: ████████████████ (30-40)
  Render Calls:     ██████████ (Batched)
  Memory:           ██████████ (Lower)

With External Tileset:
  Graphics Objects: ████████ (20-30)
  Render Calls:     ████ (TileSprite batch)
  Memory:           ████████ (Optimized)
```

---

## 🎨 Theme Variations

```
┌─────────────────────────────────────────────────────────────┐
│                  EASY THEME CHANGES                         │
└─────────────────────────────────────────────────────────────┘

Current (Twilight Purple):
  Sky: ████ 0x13082a
  Ground: ████ 0x1e0d40
  Accent: ████ 0x7c3aed

Alternative 1 (Dark Blue):
  Sky: ████ 0x0a1628
  Ground: ████ 0x1e3a5f
  Accent: ████ 0x3b82f6

Alternative 2 (Green Forest):
  Sky: ████ 0x0f2a1a
  Ground: ████ 0x1e4d2b
  Accent: ████ 0x22c55e

Alternative 3 (Red Volcanic):
  Sky: ████ 0x2a0a0a
  Ground: ████ 0x4d1e1e
  Accent: ████ 0xef4444

Just change the COLORS object!
```

---

**Visual guide complete!** Use this to understand the tilemap structure and customize Stage 7 to your needs.
