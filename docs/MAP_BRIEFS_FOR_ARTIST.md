# Ibhaveda — Venture Map Painting Briefs

**For the artist / teammate producing painted stage maps.**

The Venture arc has 8 stages. Each stage is a top-down pixel-art scene the
player walks through, defeating one mini-boss per checkpoint (CP) and one
super-boss at the end before advancing to the next stage.

This document is the source of truth for what to paint per stage. Villager,
Forest, Arena, Artisan, Mine, Harbor, Crossroads are already delivered
(some can be polished further); The Capital (Stage 8) is missing.

---

## Universal rules (apply to every map)

**File format.** LDtk (Level Designer Toolkit) source `.ldtk` file +
composited PNG export. Simplified Super-Simple Export is fine — one flat
PNG per level with all layers composited.

**Canvas size.** Aim for **~2400 × 1600 pixels** (16:10-ish landscape) OR
**1536 × 1024** if that's the natural LDtk grid. **Fill the entire canvas
with painted content — no grey padding.** If your LDtk world is smaller than
the export, crop it before delivery. Grey filler on the right/bottom breaks
the game camera bounds.

**Perspective.** Top-down 3/4 perspective (Stardew Valley / Chrono Trigger
style). Buildings are drawn at an angle you can see the front + roof.
Terrain reads top-down.

**Tile scale.** ~32-48 px per world tile. The player character sprite is
~55 px tall × 40 px wide, so buildings should be 3-6 tiles tall to feel like
real structures.

**Numbered checkpoint markers.** Paint a visible landmark at each CP
position — a bench, a well, a signpost, a monument, a lantern post — so the
player knows "this is a stop". Add a small painted number **1 / 2 / 3 / 4
/ 5 / 6** in a coin/plaque style at the landmark. This is only a reference
for placement; the game engine paints the gold CP disc over it, so the
number itself doesn't need to be pixel-perfect.

**Walkable paths.** The character walks between CPs on visible paths
(cobbles, dirt, wooden planks, sand). Draw a clear path connecting all CPs
in numerical order so the walk animation makes visual sense.

**Boss slots.** For every CP, leave ~120 × 120 px of open, uncluttered
space **immediately to the east or west** of the CP marker. That's where
the mini-boss sprite renders. Don't paint anything crucial there.

**Super-boss slot.** The super-boss appears after the last CP is cleared.
Reserve a large focal area (~300 × 300 px) past the final CP — a throne, a
gate, a summit, an altar — where the super-boss reveal cinematic plays.

**Ambient hooks.** Include recognisable "life" details the game can animate
over: chimney smoke sources (paint the chimney, engine adds smoke),
lantern/torch fires (paint the lantern, engine adds flicker glow), water
edges (engine adds ripples), forge glow spots (engine adds sparks).

---

## Colour reference

Use a **limited pixel-art palette** (12-24 colours per map) so the map has
a consistent painted feel. Each stage's palette shifts to match its
emotional tone.

Do **not** use pure black (`#000000`) or pure white (`#FFFFFF`) except in
tiny accents (star sparkle, water highlight). It flattens the pixel art.

Match the atmospheric tone described in each brief — the game applies a
gentle time-of-day tint overlay on top so the map should be readable at
its natural colours, not pre-shaded for night.

---

# Stage 1 — The Village (Ideation)

**Status:** delivered ✓ (`public/assets/maps-v2/village-painted/village-map.png`)
Use as the reference for style and CP layout across all other maps.

**Mood.** Cozy pastoral farming village at dawn. The founder's origin
point. Optimistic, warm, hand-built.

**Key landmarks.** Founder's cottage (start), village signboard, wooden
bridge, barn/stables, stone well at the town square, mill on the horizon.

**Palette.** Warm greens (grass), earth browns (dirt paths, wood),
terracotta roofs, cream walls, soft yellow lantern glow.

**CPs (4).** Signboard → Bridge → Barn → Well. (Names match
VillageMapScene.ts — do not rename.)

**Super-boss slot.** East edge — a stone archway or gate where "The
Unraveller" reveals itself.

---

# Stage 2 — The Forest (Uncertainty)

**Status:** delivered ✓ (`public/assets/maps-v2/forest/forest-map.png`)

**Mood.** Deep ancient forest at dusk / early night. Fog wisps, moonlight
through canopy, the path is barely visible. This is the "step into the
unknown" stage — should feel a little intimidating but navigable.

**Key landmarks.** Trailhead marker, gnarled hollow oak, moss-covered
standing stones, a lantern post (someone was here before you), a fork in
the trail.

**Palette.** Deep forest greens (multiple shades), slate greys, silver
moonlight edges, hints of teal/indigo in shadows. Small warm accents from
mushroom glow or lantern points.

**CPs (5).** Trailhead → hollow oak → standing stones → lantern post →
clearing where the Forest Colossus super-boss awaits.

**Super-boss slot.** Center of a moonlit clearing — the Forest Colossus
rises from behind the tree line.

---

# Stage 3 — The Arena (Validation)

**Status:** delivered ✓ (`public/assets/maps-v2/arena/arena-map.png`)

**Mood.** Roman-style pixel arena at midday. Bright, hot, exposed —
"public trial by opinion". Sand in the centre, stone tiers around the
edges.

**Key landmarks.** Arena entrance archway, oath post at the arena mouth,
sand fighting pit at centre, wooden judges' bench raised above the sand,
verdict pillar (tall stone monument), banner poles.

**Palette.** Sun-bleached tans, terracotta stone, warm sand yellows,
weathered wood browns, blood-red banner accents, deep shadows under the
stone tiers.

**CPs (4).** Naming Post at entrance → Sand pit (centre) → Judges' Bench
→ Verdict Pillar (past the pit, opposite the entrance).

**Super-boss slot.** Behind the Verdict Pillar — the "Advocate of
Comfortable Lies" boss materialises from the upper stone tiers.

---

# Stage 4 — The Artisan's Quarter (Building)

**Status:** delivered ✓ (`public/assets/maps-v2/artisans/artisans-map.png`)

**Mood.** Bustling medieval craft district in golden late afternoon. Forge
smoke rising, workshops with open doors, market tents. Everything is
half-built and being built — this is the "put hands on it" stage.

**Key landmarks.** Blacksmith's forge (with visible glowing coals),
carpenter's workshop with wood shavings piled, potter's wheel and drying
racks, cloth dyer's vats, market plaza with awning tents.

**Palette.** Rich workshop browns, forge-ember oranges and reds, brick
tan, cream cloth, sooty greys near the forge, hints of copper and brass.

**CPs (5).** Craft Workshop → Weaver's Alley → Potter's Kiln → Jeweller's
Row → Master's Forge. (Names match ArtisansScene.ts — the super-boss
"Forge Dragon" reveals at Master's Forge.)

**Super-boss slot.** Great kiln at the far end of the quarter — the
"Forge Dragon" super-boss emerges from the fire chamber.

---

# Stage 5 — Ironhold Mine (Efficiency)

**Status:** delivered ✓ (`public/assets/maps-v2/mine/mine-map.png`) —
cropped to 1536 × 1024 after the padding fix.

**Mood.** Deep multi-level industrial mine, mostly interior. Torches
casting warm orange pools of light. Wooden support beams. Rail carts. Ore
veins glittering in the walls. This is the "grind stage" — repetitive,
heavy, but rewarding.

**Key landmarks.** Surface mine head with a blueprint table and cart
crane, first vertical shaft with a wooden lift, forge/smelter chamber, a
carved-out storage area with sacks and barrels, deep chamber with blue
ore crystals, loading bay with purple crystal veins.

**Palette.** Deep browns and coal-blacks, warm torchlight orange,
occasional blue-crystal accents on ore veins, cool grey stone. Reserve
purple for the deepest chamber only.

**CPs (6).** Mine Head (surface) → Tool Yard (crane) → First Shaft →
Support Beam (forge & rail junction) → Pilot Chamber (blue crystals) →
Loading Bay (purple crystals). (Names match MineScene.ts.)

**Super-boss slot.** Beyond the Loading Bay — the "Collapse Specter"
super-boss rises from the deepest tunnel behind the purple crystals.

---

# Stage 6 — The Golden Harbor (Market Fit)

**Status:** delivered ✓ (`public/assets/maps-v2/golden-harbor/harbor-map.png`)

**Mood.** Bustling coastal trading port at warm late-afternoon /
sunset — "the goods finally cross the sea". Wooden piers, moored merchant
ships, stacked cargo crates, lighthouse silhouettes, seagulls in the sky.

**Key landmarks.** Customs house at the pier gate, cargo yard with
crates and barrels, main pier with two moored ships, lighthouse at the
harbour edge, market bazaar with awnings, deep-water dock with the flag
ship.

**Palette.** Amber sunset skies, deep teal ocean, weathered dockwood
browns, canvas cream sails, brass ship fittings, ropes and net textures.

**CPs (3).** Dockside Arrival → Market Square → Warehouse District.
(Names match GoldenHarborScene.ts and the Convex Stage-6 template
of 3 CPs. Earlier drafts of this brief listed 4-5 CPs — that was
before the Convex template locked to 3.)

**Super-boss slot.** The lighthouse tip at the far dock (world coords
~2300, 520) — the "Leviathan of Market Rejection" super-boss rises
from the water beside the lighthouse. This used to be a 4th CP; it
is now a landmark-only anchor for the reveal cinematic.

---

# Stage 7 — Crossroads Town (Iteration)

**Status:** delivered ✓ (`public/assets/maps-v2/crossroads/crossroads-map.png`) —
cropped to 1536 × 1024 after the padding fix.

**Mood.** Autumn junction town where four roads meet. Warm afternoon
light, fallen orange and red leaves on cobbles, harvest carts. "Where you
listen to travellers, pick a direction, and lay the next stretch of
road." Reflective and warm.

**Key landmarks.** The Copper Kettle inn (with visible tables and
lanterns), signpost cluster at the centre road junction, market stall
selling apples and pumpkins, roadworks (repair crew laying cobbles),
milestone marker stones ("8 Miles", "9 Miles", "12 Miles", "15 Miles"),
windmill and vegetable garden on one flank.

**Palette.** Autumn oranges and rust reds, harvest yellows, weathered
cobble greys, warm inn-wood browns, cool blue stream water. Falling
leaves as ambient texture.

**CPs (4).** Inn Yard (Copper Kettle) → Signpost (centre) → Roadworks
→ Milestone Marker (bottom gateway).

**Super-boss slot.** Past the Milestone gateway, at the road that leads
out of town — "The Babel Merchant" super-boss stands with a wagon of
mixed goods.

---

# Stage 8 — The Capital (Scale / Bureaucracy) — TO PAINT

**Status:** MISSING — this is the main thing your teammate should paint.

**Mood.** Imperial city centre at cold golden hour. Grand marble
architecture. Wide plazas. Fluttering banners. Long queues at bureaucratic
offices. This is the "scale but every rule has a form" stage. Should feel
imposing, cold, powerful — the founder is no longer a scrappy villager,
they're negotiating with an empire.

The visual difference from Stage 7 (warm autumn Crossroads) should be
stark: **cold marble whites, deep imperial navy, gilded gold trim, and
purple imperial banners**. Streets are wider, buildings taller and more
symmetrical. No cottages or workshops — everything is monumental.

**Canvas size.** ~2400 × 1600 (or 2624 × 1630 to match Arena/Artisans).
**Fill the whole canvas with painted content.**

**Key landmarks to paint.**
1. **Grand Gate** — massive arched entry with two guard statues, at the
   left edge of the map. This is where the player enters.
2. **Petition Plaza** — wide open marble plaza with a long queue of NPCs
   waiting at a clerk's window. Fountain in the centre.
3. **Ministry Building** — 4-storey imperial office building with rows of
   identical windows and a small crowd on the steps. Very orderly.
4. **Court of Records** — smaller stone building with a domed roof and a
   scroll icon over the door.
5. **Treasury Bridge** — stone bridge crossing an ornamental canal, with
   gold coin motifs carved into the railings.
6. **Throne Approach** — a long red-carpeted stair leading up to the
   Bureaucrat's throne chamber at the top-right of the map. This is
   where the super-boss reveal happens.

**Ambient life.** Marching guards on patrol paths (paint them, engine
animates), banner poles with imperial banners (engine adds a wind flap),
fountain water (engine ripples), torch braziers on the throne approach
(engine adds flicker).

**Palette.**
- Cold marble whites: `#e8e6dd`, `#c9c6bb`
- Deep imperial navy: `#1f2a4a`, `#141a30`
- Gilded gold: `#d4af37`, `#a07d1a`
- Imperial purple banners: `#4a2b6b`, `#6d3a97`
- Cobalt canal water: `#2d5a8a`
- Warm brazier fire: `#ff9932`, `#ffdb70`

Do **not** use warm browns / cottage tans — those belong to Stages 1-4.
The Capital should feel like a completely different world.

**CPs (5).** Paint numbered plaques at these positions:

| # | World coords (approx) | Landmark | What happens here |
|---|---|---|---|
| 1 | (300, 400) | Grand Gate | Player arrives — first mini-boss |
| 2 | (800, 500) | Petition Plaza (fountain) | Second mini-boss |
| 3 | (1300, 600) | Ministry Steps | Third mini-boss |
| 4 | (1700, 500) | Court of Records | Fourth mini-boss |
| 5 | (2100, 700) | Treasury Bridge | Fifth mini-boss |

Adjust coordinates to your actual canvas — the game will read them from
the painted positions. Keep at least ~150 px between CPs so the walk
animation has room.

**Boss slots per CP.** Leave a 120 × 120 px empty area to the east of
each CP marker for the mini-boss sprite.

**Super-boss slot.** The **Throne Approach** at the top-right of the map
(around world coords `(2200, 300)`). Paint an empty red-carpeted platform
~300 × 300 px with a throne silhouette. The "Iron Bureaucrat" super-boss
reveal cinematic plays here.

**Walkable path.** Draw a clear marble/cobble path connecting CPs 1 → 2
→ 3 → 4 → 5 → Throne Approach. The path should curve through the plaza
so it's not just a straight line — imperial cities aren't grid-simple.

---

# Deliverables checklist per map

For each map, please deliver:

1. `<stage-name>.ldtk` — the editable LDtk source file
2. `<stage-name>-map.png` — the composited PNG (whole canvas filled with
   painted content, no grey padding)
3. Any tileset PNGs used by the LDtk file (if you used custom tiles)

Drop into a ZIP named `<stage-name>-map.zip` and send it back to me.

---

# Quality checklist (before delivering)

- [ ] Canvas is completely filled — no grey/transparent padding on right or
      bottom edges
- [ ] All 4-6 CP landmarks are clearly visible and numbered on the map
- [ ] A walkable path connects all CPs in order
- [ ] ~120 × 120 px empty space east of each CP for the mini-boss sprite
- [ ] ~300 × 300 px empty area for the super-boss reveal at the end
- [ ] Palette matches the emotional tone of the stage
- [ ] No pure black or pure white outside of tiny accents
- [ ] Ambient life sources included (torches, chimneys, water) for the
      engine to animate over

If any of these are unclear, ping me before painting and I'll clarify.
