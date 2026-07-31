# Ibhaveda — Map PRD

**Version 1.0 · Owner: Product · Consumers: Artist, Frontend, QA**

Single source of truth for what a painted stage map is, what it must contain,
how it's delivered, and how the game consumes it. Complements the artist brief
(`docs/MAP_BRIEFS_FOR_ARTIST.md`), the generation prompts
(`docs/MAP_GENERATION_PROMPTS.md`), and the deep design analysis (`MAP_SPEC.md`).

---

## 1. What a map is

A **map** is a single painted PNG that serves as the walkable ground of one
stage in the venture arc. Every venture consists of 8 sequential stages; each
stage has exactly one map. The player character walks freely across the map
between numbered checkpoints, engaging mini-bosses in AI Combat at each
checkpoint and a super-boss at the end of the stage before advancing to the
next stage's map.

**Player experience the map must support:**

1. A camera-followed persona character walks across the painted ground using
   WASD / arrow keys / mobile joystick.
2. Between three and six visually distinct **checkpoint landmarks** the player
   navigates to.
3. A mini-boss sprite hovers over each active checkpoint; it fades / weakens
   as the player completes the checkpoint's tasks (3 tasks per CP).
4. A super-boss silhouette dominates the horizon and reveals in a cinematic
   when the stage is cleared.
5. Environmental corruption (per-segment overlay tiles that fade as tasks
   complete — the "corruption model" from `Ibhaveda_boss_corruption_table`).
6. Ambient VFX (fireflies, fog, weather) themed to the stage.

---

## 2. Universal requirements (apply to every map)

**File format & delivery**

- Deliverable: one composite PNG per stage. LDtk source `.ldtk` file
  optional but appreciated.
- File name: `<biome>-map.png` (lowercase kebab-case, no spaces)
- Location: `public/assets/maps-v2/<biome>/<biome>-map.png`
- Delivery channel: zip file uploaded via Cowork; frontend swaps into place.

**Canvas**

- **Fully opaque** — every pixel must have alpha = 255. Zero transparent
  regions. Corner-alpha check must pass (see §7 QA gate).
- **Exact size per stage** — see §5 per-stage table. No cropping, no
  letterboxing, no border, no vignette.
- **100% painted coverage** — no empty areas, no black gaps, no bare
  canvas anywhere. Frame edges naturally show the biome boundary
  (forest edge trees, cliff drop, waterline, city wall).

**Perspective & art style**

- Top-down 3/4 perspective (Stardew Valley / Chrono Trigger tradition).
  Buildings show both front facade and roof.
- Hand-painted 32-bit pixel-art aesthetic. Chunky visible pixels with
  painterly shading. Not procedural. Not smooth vector.
- Tile scale: ~32-48 pixels per world tile.
- Player sprite is ~55px tall × 40px wide — buildings should be 3-6
  tiles tall to feel like real structures.

**Must-NOT contain**

- No text, letters, numbers, HUD, UI, watermarks, signatures
- No character sprites, NPCs, monsters, or hero silhouettes baked in
- No borders, frames, torn edges, vignettes
- No compass, minimap, or map-legend elements
- No baked-in checkpoint markers or gold discs (the engine paints those
  over the landmarks at runtime)

**Palette & mood**

Must match the stage's mood keyword (see §5). Palette should feel cohesive —
a single dominant color family plus 2-3 accent colors.

---

## 3. Checkpoint landmark requirements

Each CP position (defined in the Phaser scene's `CHECKPOINTS` array — see §6)
must sit ON TOP OF a visually distinct **landmark**. The landmark makes the
CP feel like a real place in the world, not an abstract dot.

**A landmark is:** a bench, well, signboard, monument, lantern post, kiln,
pier, market stall, gateway, brazier, shrine, or any other single-purpose
structure the player can recognize at a glance.

**Rules:**

1. Every CP position in `CHECKPOINTS` must have a landmark painted at that
   exact pixel coordinate.
2. Landmarks must be visually distinct from each other within the same stage
   (no two "wooden benches"; if the stage has multiple benches, differentiate
   with color, size, or accessory).
3. Landmark must be **camera-safe** — nothing critical within 40px of any
   canvas edge (the camera can pan to the edge).
4. Landmarks must NOT block the walk path. The player must be able to walk
   AROUND the landmark to interact with it.

**CP layout is fixed** — the artist does not choose positions; positions are
listed in the per-stage sections below and must be honored to within ±30px.

---

## 4. Camera behavior (informational — the artist doesn't need to code this)

- Camera follows the player character with smoothing.
- Initial zoom: adaptive by viewport width. Desktop = 1.4×, tablet = 1.15×,
  large phone = 0.9×, small phone = 0.7×.
- Camera bounds: (0, 0) to (`MAP_WIDTH`, `MAP_HEIGHT`) — the camera cannot
  scroll past the canvas edges.
- Drag-to-pan enabled for mouse and touch.

**Design implication:** the entire map must read well both at wide zoom-out
(mobile, seeing 60% of the map) AND at close-in zoom (desktop, seeing ~30%
of the map centered on the character).

---

## 5. Per-stage map specification

Canvas sizes are fixed. CP counts are fixed. Position coordinates are pixel
values in native map coordinates.

### Stage 1 — The Village (Ideation)

- **Size:** 1536 × 1024
- **Boss:** The Fog of Vagueness (mist family)
- **Mood:** dawn, hopeful, intimate, unspoiled
- **Palette:** mossy greens, warm brown thatch, cream stone, honey lantern
- **CPs (4):**
  1. `(173, 215)` — **The Signboard**
  2. `(587, 633)` — **The Bridge**
  3. `(1177, 662)` — **The Barn**
  4. `(1304, 325)` — **The Well**
- **Status:** ✅ Shipped, reference-quality

### Stage 2 — The Forest (Research)

- **Size:** 2304 × 1440
- **Boss:** Pathwarden Wraith / Forest Colossus (plant family)
- **Mood:** mysterious, alert, moonlit dusk, on-the-verge-of-something
- **Palette:** cool blue-greens, silver-blue moonlight, warm firefly amber
- **CPs (5):**
  1. `(340, 900)` — **West Threshold**
  2. `(780, 720)` — **Whispering Grove**
  3. `(1200, 550)` — **Moonlit Clearing**
  4. `(1550, 1000)` — **Boss Glade**
  5. `(2000, 480)` — **East Exit**
- **Status:** ✅ Shipped (redelivered opaque, 100% coverage)

### Stage 3 — The Arena (Validation)

- **Size:** 2624 × 1630
- **Boss:** The Advocate of Comfortable Lies (arcane family)
- **Mood:** ceremonial, tense, exposed under harsh noon sun
- **Palette:** warm golden sand, cream stone, deep red banners, brass, violet accent
- **CPs (4):**
  1. `(280, 600)` — **The Naming Post**
  2. `(1300, 800)` — **The Sand**
  3. `(1950, 420)` — **The Judges' Bench**
  4. `(2280, 1150)` — **The Verdict Pillar**
- **Status:** ⏳ Needs re-generation to match Village quality

### Stage 4 — The Artisan's Quarter (Offer Design)

- **Size:** 2624 × 1630
- **Boss:** The Unfinished Golem (machine family)
- **Mood:** industrious, warm golden hour, everyone-is-working
- **Palette:** warm sandstone, dark timber, orange forge glow, copper, cream cobble
- **CPs (5):**
  1. `(420, 950)` — **Craft Workshop**
  2. `(900, 720)` — **Weaver's Alley**
  3. `(1350, 500)` — **Potter's Kiln**
  4. `(1900, 1100)` — **Jeweller's Row**
  5. `(2400, 480)` — **Master's Forge**
- **Status:** ✅ Shipped

### Stage 5 — The Mine (Build & Deliver)

- **Size:** 1536 × 1024
- **Boss:** The Collapse Specter (undead family)
- **Mood:** focused, echoing, deep-underground, faintly cold
- **Palette:** earthy browns and greys, torch orange, teal-blue crystal, violet crystal
- **CPs (6):**
  1. `(270, 220)` — **Mine Head** (surface)
  2. `(1400, 260)` — **Tool Yard** (surface)
  3. `(600, 550)` — **First Shaft** (cavern)
  4. `(1050, 620)` — **Support Beam** (cavern)
  5. `(770, 900)` — **Pilot Chamber** (cavern, blue crystals)
  6. `(1420, 820)` — **Loading Bay** (cavern, purple crystals)
- **Status:** ✅ Shipped

### Stage 6 — The Golden Harbour (Launch)

- **Size:** 2612 × 1632
- **Boss:** The Harbourmaster of Hesitation (mist family)
- **Mood:** departure, gold-lit, salt-air, on-the-cusp
- **Palette:** warm sunset gold/coral, deep sea aquamarine to indigo, red-tile roofs
- **CPs (3):**
  1. `(380, 900)` — **Dockside Arrival**
  2. `(1050, 700)` — **Market Square**
  3. `(1700, 1150)` — **Warehouse District**
- **Status:** ⏳ Needs re-generation to match Village quality

### Stage 7 — The Crossroads Town (Iteration)

- **Size:** 1536 × 1024
- **Boss:** The Babel Merchant (arcane family)
- **Mood:** pause between journeys, warm-among-cold, small-scale civic dusk
- **Palette:** cool dusk blues, warm amber lantern glow, weathered grey stone, copper trim
- **CPs (4):**
  1. `(500, 400)` — **The Inn Yard**
  2. `(920, 620)` — **The Signpost**
  3. `(1200, 780)` — **The Roadworks**
  4. `(700, 900)` — **The Milestone Marker**
- **Status:** ⏳ Needs re-generation to match Village quality

### Stage 8 — The Capital (Scale)

- **Size:** 2624 × 1630
- **Boss:** The Iron Bureaucrat (machine family)
- **Mood:** seat of power, monumental, watchful, everything-matters
- **Palette:** white/cream marble, gold trim, imperial blue and crimson banners, wrought-iron black
- **CPs (4):**
  1. `(TBD)` — **The Senate Steps** (North of central plaza)
  2. `(TBD)` — **The Chancery** (East)
  3. `(TBD)` — **The Treasury** (South)
  4. `(TBD)` — **The Ministry** (West)
- **Status:** ❌ NO PNG YET — highest priority regeneration target

---

## 6. Code integration points (informational)

Each stage map is loaded by a dedicated Phaser scene:

| Stage | Scene file | Loader key |
|-------|-----------|------------|
| 1 | `src/lib/phaser/scenes/VillageMapScene.ts` | `village-composite` |
| 2 | `src/lib/phaser/scenes/ForestMapScene.ts` | `forest-composite` |
| 3 | `src/lib/phaser/scenes/ArenaScene.ts` | `arena-composite` |
| 4 | `src/lib/phaser/scenes/ArtisansScene.ts` | `artisans-composite` |
| 5 | `src/lib/phaser/scenes/MineScene.ts` | `mine-composite` |
| 6 | `src/lib/phaser/scenes/GoldenHarborScene.ts` | `harbor-composite` |
| 7 | `src/lib/phaser/scenes/CrossroadsScene.ts` | `crossroads-composite` |
| 8 | *(not yet built)* | *(pending)* |

Each scene declares its own `CHECKPOINTS: readonly Checkpoint[]` array with
the `{index, x, y, label}` positions listed in §5. If a landmark's painted
position shifts by more than ±30px from spec, update the coordinates in the
scene file to match — the CP marker is painted by the engine at these exact
coordinates.

---

## 7. Delivery gate — QA checklist

Every map delivery MUST pass every check before merge. Failing any check
sends the file back to the artist.

**Automated (must-pass):**

```bash
python3 -c "
from PIL import Image
im = Image.open('public/assets/maps-v2/YOUR_STAGE/YOUR_MAP.png').convert('RGBA')
w,h = im.size

# 1. Exact size per spec
EXPECTED = (2624, 1630)  # ← change to match stage's spec
assert (w,h) == EXPECTED, f'FAIL: got {w}x{h}, expected {EXPECTED}'

# 2. Fully opaque corners
corners = [im.getpixel((5,5))[3], im.getpixel((w-5,5))[3],
           im.getpixel((5,h-5))[3], im.getpixel((w-5,h-5))[3]]
assert all(a==255 for a in corners), f'FAIL: transparent corners {corners}'

# 3. 100% painted coverage (>95% non-empty pixels)
small = im.resize((w//4, h//4))
sw, sh = small.size
d = small.load()
painted = sum(1 for y in range(sh) for x in range(sw)
              if d[x,y][3]>20 and sum(d[x,y][:3])>30)
pct = painted*100/(sw*sh)
assert pct > 95, f'FAIL: only {pct:.1f}% painted (need >95%)'

print(f'OK — {w}x{h} fully opaque, {pct:.1f}% painted coverage')"
```

**Manual review (`/dev/maps` gallery):**

- [ ] All CP markers land ON the intended landmark (not floating in empty space)
- [ ] No two landmarks in the stage are visually identical
- [ ] Mood keyword matches the palette at a glance
- [ ] No baked-in UI, characters, text, or watermarks visible
- [ ] Aspect ratio matches (image should not letterbox in preview card)
- [ ] Frame edges show natural biome boundary, not sharp cutoff

**Playtest (`/map/world?stage=<N>&stagelock=off`):**

- [ ] Player character can walk across the entire map without invisible walls
- [ ] Camera can pan to all four canvas edges without showing empty space
- [ ] Mini-boss sprites are readable against the map background at each CP
- [ ] Corruption overlay tiles read clearly against the map (not lost in busy detail)

---

## 8. Change process

- CP position changes: PM approves → update `src/lib/phaser/scenes/<Stage>Scene.ts`
  CHECKPOINTS array → update this PRD §5 coordinates → re-verify at `/dev/maps`.
- Boss / mood / palette changes: PM approves → update this PRD + `MAP_SPEC.md`
  → notify artist → regenerate map if visual impact is material.
- Adding a new stage: this PRD gets a new §5 entry, `stages.config.ts` +
  `stage-bosses.ts` get entries, new scene file gets scaffolded, biome asset
  folder gets created under `public/assets/maps-v2/`.

---

## 9. Priority order (as of this PRD)

1. **Stage 8 — The Capital** (no PNG at all, blocks final venture completion)
2. **Stage 3 — The Arena** (existing PNG doesn't match Village quality)
3. **Stage 6 — The Golden Harbour** (same)
4. **Stage 7 — The Crossroads Town** (same)

Village / Forest / Artisan / Mine are considered current-quality.

---

## 10. Related docs

- `MAP_SPEC.md` — deeper analysis of each stage's story beats and emotional register
- `docs/MAP_BRIEFS_FOR_ARTIST.md` — artist-facing brief with tileset recommendations and LDtk workflow
- `docs/MAP_GENERATION_PROMPTS.md` — copy-paste AI generation prompts (Midjourney / DALL·E / Flux)
- `Ibhaveda_boss_corruption_table (1).xlsx` — the corruption overlay spec that consumes the CP positions defined here
