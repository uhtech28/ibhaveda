# Ibhaveda — Deep Map Generation Prompts

> **For AI image generation** (Midjourney v6+, DALL·E 3, Flux, Stable Diffusion XL, Ideogram).
> Each stage below has a copy-paste-ready prompt tuned for painted top-down pixel-art maps
> that match the shipped Village aesthetic. Paste the prompt block, then use the size /
> negative-prompt / parameter hints beneath it.
>
> **Written after** the Forest map delivery came back with a transparent background and
> 76% empty canvas. Every prompt below enforces "**fully opaque, no transparency, no
> alpha channel**" up front to prevent a repeat.

---

## Universal instructions (prepend to every prompt if your generator drops style easily)

```
STYLE: Top-down 3/4-perspective 2D pixel art in the tradition of Stardew
Valley and Chrono Trigger. Hand-painted look, not procedurally generated.
Warm painterly lighting with clear silhouettes. Tile scale ~32-48 pixels
per world tile. Fully opaque flat rectangular canvas — NO transparency,
NO alpha channel, NO letterboxing, NO borders, edges must reach the frame.
The entire canvas is covered in painted terrain (grass, stone, sand, water,
snow, etc.) — no empty areas, no black gaps, no vignette.

The image is a MAP for a game character to walk across. No characters,
no NPCs, no HUD, no text labels, no UI, no compass, no watermark, no
signature. Camera is top-down 3/4 with buildings drawn at a slight angle
so both front facades and rooftops are visible.
```

**Universal negative prompt** (works for SD / Flux / Ideogram):

```
transparent background, alpha channel, checkered background, empty canvas,
letterbox, black bars, vignette, watermark, signature, text, letters,
numbers, ui, hud, characters, people, ncps, hero sprite, monsters,
weapons in hand, party banner, minimap, compass, border, frame, torn edges
```

---

## Canvas sizes per stage (do not deviate)

| Stage | Biome | Size (px) | Aspect |
|-------|-------|-----------|--------|
| 1 | Village | 1536 × 1024 | 3:2 |
| 2 | Forest | 2304 × 1440 | 8:5 |
| 3 | Arena | 2624 × 1630 | 16:10 |
| 4 | Artisan's Quarter | 2624 × 1630 | 16:10 |
| 5 | Mine | 1536 × 1024 | 3:2 |
| 6 | Golden Harbour | 2612 × 1632 | 16:10 |
| 7 | Crossroads Town | 1536 × 1024 | 3:2 |
| 8 | The Capital | 2624 × 1630 | 16:10 |

Some generators need `--ar` (Midjourney) or width/height overrides (SDXL/Flux). Match the ratio exactly — the checkpoint markers in `/dev/maps` are placed by percentage against these canvas dimensions.

---

# STAGE 1 — The Village (Ideation)

**Boss:** The Fog of Vagueness — pale blue-grey mist that thins the more precisely you name your problem
**Emotional register:** Waking up. First morning of a new venture. Small, intimate, hopeful.

```
Top-down 3/4 pixel-art map of a peaceful medieval village at dawn.
1536×1024 pixels, hand-painted Stardew Valley / Chrono Trigger style,
warm morning sunlight, mossy green grass, painterly stone paths, fully
opaque flat background — every pixel covered in scene.

COMPOSITION (left→right):
- LEFT: an old wooden village signboard covered in nailed-up notices,
  set on a grassy knoll with dew (this is CP1, "The Signboard").
- CENTER: a small stone-and-plank bridge crossing a shallow blue stream
  that runs top-to-bottom through the middle of the map (this is CP2).
- CENTER-RIGHT: a thatched-roof barn with wooden fence, hay bales, and
  a chicken coop (this is CP3, "The Barn").
- RIGHT: a mossy circular stone well with a wooden crank and bucket,
  ringed by wildflowers (this is CP4, "The Well").
- Scatter around: 3-4 pitched-roof cottages with yellow lantern light in
  windows, wooden fences, garden patches with vegetables, hay bales,
  wildflower clusters, small footpaths connecting the landmarks.
- Trees: soft-canopy oaks and birches at the map edges only, never
  covering the walkable path.

PALETTE: mossy greens, warm brown thatch, cream stone, wildflower yellow
and pink, misty blue stream, honey-gold lantern glow.
MOOD: dawn, hopeful, intimate, unspoiled.
```

- **Midjourney params:** `--ar 3:2 --v 6.1 --style raw --stylize 250`
- **Reference asset (already shipped, good):** `/public/assets/maps-v2/village-painted/village-map.png`

---

# STAGE 2 — The Forest (Research)

**Boss:** Pathwarden Wraith / Forest Colossus family — the "just one more version" perfectionist that falls when you name one thing to ship this week
**Emotional register:** Charting the unknown. Alert. Careful footsteps.

```
Top-down 3/4 pixel-art map of a dense enchanted forest at moonlit dusk.
2304×1440 pixels, hand-painted Stardew Valley / Chrono Trigger style.
CRITICAL: fully opaque flat rectangular canvas — every single pixel
must be painted forest floor (grass, moss, dirt, fallen leaves). NO
transparent regions, NO black gaps, NO empty areas anywhere. The forest
floor extends unbroken from edge to edge.

COMPOSITION (west→east):
- WEST EDGE: an old moss-covered stone archway marking the forest
  entrance, with a wooden trail sign (this is CP1, "West Threshold").
- INNER WEST: a whispering grove of tall birches around a burnt-out
  campfire ring with old logs pulled up as seats — competitors' campfire
  still smoldering (this is CP2, "Whispering Grove").
- CENTER: a moonlit clearing with a shallow stream cutting through and
  glowing white mushrooms in a ring, footprints pressed into damp mud
  leading in and out (this is CP3, "Moonlit Clearing").
- CENTER-SOUTH: a sunken glade with a broken ancient shrine at its
  middle, cracked flagstones ringed by twisted roots (this is CP4,
  "Boss Glade").
- EAST EDGE: a second stone archway matching the west, with rope bridges
  disappearing into brighter light beyond (this is CP5, "East Exit").
- BETWEEN LANDMARKS: dense pine and oak canopy overhead broken by
  narrow winding dirt paths, mossy boulders, mushroom clusters, fern
  patches, small streams. Every gap between the landmarks is filled
  with forest floor and undergrowth — never bare canvas.

PALETTE: cool blue-greens, deep shadow, silver-blue moonlight breaking
through canopy in soft god-rays, warm firefly amber near campfire.
MOOD: mysterious, alert, on-the-verge-of-something.
```

- **Midjourney params:** `--ar 8:5 --v 6.1 --style raw --stylize 300`
- **Known issue with current asset:** transparent background, 76% empty. Regenerate with this prompt.

---

# STAGE 3 — The Arena (Validation)

**Boss:** The Advocate of Comfortable Lies — slick barrister who falls silent when real evidence lands
**Emotional register:** Public trial. Ceremonial. High-stakes. Everyone is watching.

```
Top-down 3/4 pixel-art map of a stone gladiator arena carved into a
desert-mesa plateau at noon. 2624×1630 pixels, hand-painted Stardew
Valley / Chrono Trigger style, harsh sun, painted stone terraces,
fully opaque flat background — no empty areas, no transparency.

COMPOSITION:
- LEFT ENTRANCE: an angel-statue archway on cracked flagstones marking
  the entrance from the west, banners fluttering (this is CP1, "The
  Naming Post" — where assumptions get dragged into light and ranked).
- CENTER: a massive circular sand pit taking up the middle third of
  the map, packed golden sand with faint drag-marks and hoofprints,
  ringed by tall stone terraces (this is CP2, "The Sand").
- UPPER RIGHT: a raised stone judges' bench with three tall thrones,
  red carpet, brass rings along the balustrade (this is CP3, "The
  Judges' Bench").
- LOWER RIGHT: a purple mystical portal-pillar of stacked runic stones
  ringed by candles at the bottom-right corner (this is CP4, "The
  Verdict Pillar").
- SURROUNDING: rising stone terraces of the arena bowl with worn steps,
  scattered spectator benches, banners on poles, small guard braziers
  with faint orange flame, arrow-slit walls.
- Sand overspill trails into cracked flagstone paths connecting the
  four landmarks. Small red pennants mark judge tents.

PALETTE: warm golden sand, cream/tan stone, red banners, brass fittings,
deep violet portal-pillar accents, brown wood, orange brazier glow.
MOOD: ceremonial, tense, exposed under harsh light.
```

- **Midjourney params:** `--ar 16:10 --v 6.1 --style raw --stylize 250`

---

# STAGE 4 — The Artisan's Quarter (Offer Design)

**Boss:** The Unfinished Golem — a half-forged stone giant that crumbles when you commit to one buyable version of your offer
**Emotional register:** Craft district hum. Focused hands. Working late.

```
Top-down 3/4 pixel-art map of a busy medieval craftsmen's quarter at
late afternoon. 2624×1630 pixels, hand-painted Stardew Valley /
Chrono Trigger style, warm golden hour, cobblestone streets, fully
opaque flat background — every pixel covered.

COMPOSITION (west→east, five workshops connected by cobbled alleyways):
- WEST: a "Craft Workshop" — long wooden building with double-doors
  swung open showing a lit forge, workbenches with half-finished chairs
  spilling into the alley (this is CP1, "Craft Workshop").
- CENTER-WEST: a "Weaver's Alley" — a narrow street strung with
  drying colored cloths on lines overhead, spinning wheels on porches
  (this is CP2, "Weaver's Alley").
- CENTER: a "Potter's Kiln" — a domed brick kiln with visible orange
  glow, stacks of unfired pots, wet clay on wheels (this is CP3,
  "Potter's Kiln").
- LOWER RIGHT: a "Jeweller's Row" — a curved row of shopfronts with
  tiny bay windows displaying gems on velvet, lanterns swinging on
  chains (this is CP4, "Jeweller's Row").
- EAST: a "Master's Forge" — the largest structure, a two-story timber
  smithy with a massive chimney belching sparks, an anvil-and-hammer
  crest above the door (this is CP5, "Master's Forge").
- BETWEEN WORKSHOPS: cobblestone alleys connect all five landmarks with
  wooden crates, barrel-stacks, apprentice wheelbarrows, tool racks,
  scattered wood shavings, small courtyards with fountains. Overhead
  banners strung between roofs. NO empty patches — cobblestone or
  courtyard flagstones cover every gap between landmarks.

PALETTE: warm sandstone walls, dark timber beams, orange forge glow,
copper roofs, cream cobble, deep red awnings, hanging brass lanterns.
MOOD: industrious, warm, everyone-is-working.
```

- **Midjourney params:** `--ar 16:10 --v 6.1 --style raw --stylize 250`

---

# STAGE 5 — The Mine (Build & Deliver)

**Boss:** The Collapse Specter — a dark-grey rubble-shrouded wraith that dispels when you ship the smallest working version
**Emotional register:** Descending underground. Focused. Getting dirty.

```
Top-down 3/4 pixel-art map of an active mining operation — surface
buildings on the upper half, descending cavern chambers on the lower
half. 1536×1024 pixels, hand-painted Stardew Valley / Chrono Trigger
style, mixed daylight above and torchlight below, fully opaque flat
background — every pixel painted terrain, no transparency.

COMPOSITION (split horizontally, surface up / cavern below):
- UPPER LEFT: a "Mine Head" — timber A-frame lift over a black square
  shaft, blueprint table on a stool nearby, crates of gear (this is
  CP1, "Mine Head").
- UPPER RIGHT: a "Tool Yard" — a cart-crane rail system, iron picks
  and shovels racked on wall pegs, a wooden ore cart on tracks (this
  is CP2, "Tool Yard").
- MIDDLE LEFT: a "First Shaft" — the upper cavern descent, jagged
  rock walls with wooden support beams, a wall-torch casting orange
  glow (this is CP3, "First Shaft").
- MIDDLE CENTER: a "Support Beam" — a forge-and-rail junction with
  crossbeams reinforcing the ceiling, a small anvil, spare rail
  segments (this is CP4, "Support Beam").
- LOWER LEFT: a "Pilot Chamber" — a deep chamber with clusters of
  glowing blue crystals in the walls, a small workbench with a
  half-finished contraption (this is CP5, "Pilot Chamber").
- LOWER RIGHT: a "Loading Bay" — bottom-right deep chamber with
  clusters of purple crystals, stacked filled ore carts ready to
  haul up, chain hoists (this is CP6, "Loading Bay").
- SURFACE UPPER HALF: dirt yard, wooden fences, one small foreman's
  shack, mine tailings piles, a water pump.
- CAVERN LOWER HALF: dark stone walls, jagged rock, scattered ore
  chunks on floor, wall torches at intervals, wooden support beams
  forming corridor walls between chambers.

PALETTE: earthy browns and greys, warm torch orange, teal-blue crystal
glow (CP5), violet crystal glow (CP6), dark stone shadows below,
sunlit dirt above.
MOOD: focused, echoing, deep-underground, slightly cold.
```

- **Midjourney params:** `--ar 3:2 --v 6.1 --style raw --stylize 250`

---

# STAGE 6 — The Golden Harbour (Launch)

**Boss:** The Harbourmaster of Hesitation — bureaucrat wreathed in blue-grey storm-fog that clears when you name the launch date out loud
**Emotional register:** Standing on the pier. Wind in the sails. About to leave shore.

```
Top-down 3/4 pixel-art map of a bustling harbour town at golden hour.
2612×1632 pixels, hand-painted Stardew Valley / Chrono Trigger style,
warm sunset colors, deep blue harbour water, fully opaque flat
background — every pixel painted, no transparency.

COMPOSITION (west→east, harbour water dominant along the south edge):
- LOWER LEFT: a "Dockside Arrival" — long wooden pier with a tall
  ship moored, gangplank down, cargo nets, coiled ropes, seagulls
  overhead, harbormaster's lantern post at the pier head (this is
  CP1, "Dockside Arrival").
- CENTER: a "Market Square" — cobblestone plaza inland from the
  water, striped market stalls, fish-drying racks, barrels of
  spice and salt, a central stone fountain, awnings in orange and
  cream (this is CP2, "Market Square").
- LOWER RIGHT: a "Warehouse District" — long low sandstone
  warehouses with double-doors, stacked crates and barrels, a crane
  arm loading a smaller ship at a side dock (this is CP3,
  "Warehouse District").
- HARBOUR WATER: fills the entire lower quarter of the map — deep
  blue with white foam wakes, 4-5 boats of varying sizes moored or
  approaching, a stone breakwater with a small lighthouse on the
  west side.
- INLAND: harbourside taverns with pitched tile roofs, coiled rope
  yards, ropewalk sheds, seagull-covered rooftops, cobbled streets
  connecting the three landmarks, small park with palms.

PALETTE: golden sunset (warm yellows, coral, peach), deep sea blues,
sandstone cream, dark timber piers, red-tile roofs, brass lantern
gleam, white sails and foam.
MOOD: departure, gold-lit, salt-air, on-the-cusp.
```

- **Midjourney params:** `--ar 16:10 --v 6.1 --style raw --stylize 250`

---

# STAGE 7 — The Crossroads Town (Iteration)

**Boss:** The Babel Merchant — a shrouded figure of black-and-white static who dissipates when you commit to one message
**Emotional register:** Standing where roads meet. Deciding what stays. Small revisions.

```
Top-down 3/4 pixel-art map of a small crossroads town at dusk with
lanterns beginning to light. 1536×1024 pixels, hand-painted Stardew
Valley / Chrono Trigger style, cool blue evening light broken by
warm lantern amber, fully opaque flat background — every pixel painted,
no transparency.

COMPOSITION (four landmarks around a central four-way road junction):
- UPPER LEFT: an "Inn Yard" — outdoor wooden tables and benches
  outside The Copper Kettle (a two-story timber tavern with brass
  copper sign), warm lantern light spilling from open windows,
  patrons' cloaks on pegs by the door (this is CP1, "The Inn Yard").
- CENTER: a "Signpost" — a tall wooden multi-arrow post with 5-6
  wooden arrow signs pointing to different distant cities, at the
  exact center where four cobbled roads meet, a stone bench beside
  it (this is CP2, "The Signpost").
- CENTER-RIGHT: a "Roadworks" area — a repair crew's site with a
  cart of fresh-cut cobbles, half-laid cobblestone patch, wheelbarrows,
  wooden barricades painted red-and-white, a small brazier for tar
  (this is CP3, "The Roadworks").
- LOWER LEFT: a "Milestone Marker" — a tall stone gateway with a
  weathered milestone plaque reading "WESTMERE" in painted engraved
  lettering, ivy climbing the pillars, a lantern hanging from the
  arch (this is CP4, "The Milestone Marker").
- SURROUNDING: cobblestone streets radiating in four directions to
  the map edges, stone lanterns lit with warm amber flame at
  intervals, small side buildings (bakery, cobbler, guild office)
  with awnings and window boxes of flowers, water pump, hitching
  posts. Cobbled paving covers every inch between buildings.

PALETTE: cool dusk blues in the sky/shadow, warm amber lantern glow
in windows and on cobbles, weathered grey stone, dark brown timber,
copper trim on the inn sign, red-and-white barricade stripes.
MOOD: pause between journeys, warm-among-cold, small-scale civic.
```

- **Midjourney params:** `--ar 3:2 --v 6.1 --style raw --stylize 250`

---

# STAGE 8 — The Capital (Scale)  ⚠️ MISSING — needs first generation

**Boss:** The Iron Bureaucrat — an armored chain-wrapped figure that shatters when you name one system to automate this quarter
**Emotional register:** Standing in the seat of power. Everything is bigger now. Consequences travel further.

```
Top-down 3/4 pixel-art map of a grand imperial capital city district
at midday. 2624×1630 pixels, hand-painted Stardew Valley / Chrono
Trigger style, cool white marble and gold accents, fully opaque flat
background — every pixel painted, no transparency.

COMPOSITION (a governmental plaza + four surrounding landmarks):
- CENTER: a vast circular white-marble plaza with a golden compass
  rose inlaid in the center, ringed by tall banners on brass poles,
  patterned marble tiles radiating outward. Broad ceremonial steps
  lead up to the plaza from four cardinal directions.
- NORTH: a domed Senate building with tall columns, golden-tiled
  roof, wide staircase, guards on either side, banners of state
  (this is CP1, "The Senate Steps").
- EAST: a Chancery of Records — a boxy administrative building with
  many small barred windows, chained gates, stacks of scrolls
  visible through open doors, ink-well fountain outside (this is
  CP2, "The Chancery").
- SOUTH: a Grand Bank / Treasury with pillared portico, gold-inlaid
  double doors, a guarded coin-cart yard behind, chain-fenced (this
  is CP3, "The Treasury").
- WEST: a Ministry of Standards — a stern grey-stone building with
  regulation plaques mounted on the facade, sundials and standard
  weights on public display, brass measuring rods (this is CP4,
  "The Ministry").
- SURROUNDING: broad tree-lined avenues in the four directions,
  ornamental hedges, marble fountains at intersections, gilded
  lampposts, brass-railed benches, official carriages parked at
  curbs, an obelisk in a side park. Every gap filled with plaza
  paving, garden bed, avenue cobbles, or building — no bare canvas.

PALETTE: white and cream marble, gold trim, deep imperial blue and
crimson banners, black wrought-iron gates, cool grey shadow, warm
midday sun.
MOOD: seat of power, monumental, watchful, everything-matters.
```

- **Midjourney params:** `--ar 16:10 --v 6.1 --style raw --stylize 250`

---

## Delivery checklist (make the artist confirm before accepting the file)

Before merging a new map into `public/assets/maps-v2/<stage>/`, verify:

- [ ] **Exact canvas size** — matches the "Canvas sizes per stage" table above
- [ ] **Fully opaque** — open the PNG in a checkered-transparency viewer; there must be zero transparent pixels
- [ ] **Every named checkpoint landmark is visually distinct** — I can point to each without ambiguity
- [ ] **Camera-safe framing** — nothing critical (landmarks, main paths) within 40px of any edge (the camera can pan up to the edge)
- [ ] **No baked-in UI** — no letters, numbers, HUD, characters, sprites, watermarks
- [ ] **Consistent perspective** — top-down 3/4, no isometric mixups, no first-person elements
- [ ] **Palette matches this stage's mood keyword** (dawn / dusk / midday / torchlight etc.)

Quick verification script (run from repo root):

```bash
python3 -c "
from PIL import Image
im = Image.open('public/assets/maps-v2/YOUR_STAGE/YOUR_MAP.png').convert('RGBA')
w,h=im.size
corners = [im.getpixel((5,5))[3], im.getpixel((w-5,5))[3], im.getpixel((5,h-5))[3], im.getpixel((w-5,h-5))[3]]
print(f'size={w}x{h}, corner alpha={corners}')
assert all(a==255 for a in corners), 'FAIL: transparent corners — reject the delivery'
print('OK: fully opaque')"
```

---

## Preview after delivery

Once a map is in `public/assets/maps-v2/`, open `/dev/maps` in the browser to verify:

- Checkpoint markers land on the intended landmarks
- No black gaps between landmarks
- Aspect ratio matches (image should not letterbox in the preview card)

If a CP marker is off-position, edit its `{x, y}` in the corresponding `*MapScene.ts` file — coordinates are in native map pixels.
