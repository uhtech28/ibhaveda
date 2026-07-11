# Venture Map Specification — 8 Stage Biomes

> Deep analysis of what each painted map needs to show, derived from the venture-template spec (Ibhaveda_gamified_checkpoints_v2). For each stage: the story beat, the boss's emotional register, the checkpoint locations that MUST be visible on the map, and a paint/generate brief.
>
> Art style baseline (from existing Village map): **top-down 2D pixel art**, ~1500-2600px wide, tile-friendly, warm-lit, painterly grass/stone/water, hand-painted look (not procedurally generated).
>
> **Camera behavior**: player camera pans between checkpoints. Map needs enough compositional interest at zoom 0.85 that both a wide view AND a close-in CP view read well.

---

## STAGE 1 — The Village (Ideation)

**Status:** ✅ Painted, shipped
**Boss:** *The Fog of Vagueness* (mist family) — dissolves the more you name your problem precisely
**Emotional register:** Waking up. Naming what hurts. Small, intimate, first-morning-of-something.

**4 Checkpoints:**
1. **The Signboard** — a wooden village noticeboard where the problem gets named publicly
2. **The Bridge** — where the "burdened soul" (target user) is documented crossing
3. **The Barn** — where the solution weapon is imagined but not yet forged
4. **The Well** — deep pool where the party formally accepts the quest

**Palette:** Warm dawn — mossy greens, brown thatch, yellow lantern light, misty blue in the tree line
**Must-have elements:** cottages with pitched roofs, a stream cutting through, wildflower patches, a wooden bridge, a stone well, a communal signboard/notice tree

**Existing map is good.** No changes needed.

---

## STAGE 2 — The Forest (Research)

**Status:** ✅ Painted, shipped
**Boss (super):** *The Forest Colossus* (plant family) — the walking embodiment of "just one more version" perfectionism; falls when the founder names one thing to ship this week unpolished
**Mini-bosses:** Shadow of Second-Guessing, Sorceress of Endless Iteration, Thornbearer Champion, Wraith of Almost-Ready
*(Historical note: earlier drafts of this doc called the boss "Pathwarden Wraith" — that was the 2-stage MVP scope. Roster now matches src/config/stage-bosses.ts.)*
**Emotional register:** Charting the unknown. Careful. Alert.

**5 Checkpoints:**
1. **West Threshold** — where the market landscape starts being mapped
2. **Whispering Grove** — competitors' campfires still smoldering
3. **Moonlit Clearing** — the customer's real footprints
4. **Boss Glade** — the winds shift, timing is read
5. **East Exit** — all fragments assembled into one true map

**Palette:** Cool blue-greens, deep shadow, silver moonlight breaks through canopy
**Must-have elements:** dense conifers, mist between trunks, a moonlit clearing at center, a shallow stream, moss-covered rocks, mushroom rings, half-visible paths splitting

**Existing map is good.** Slightly under-painted in the SW quadrant — could add a small ancient shrine there if regenerating.

---

## STAGE 3 — The Arena (Validation)

**Status:** ⚪ MISSING — needs generation
**Boss:** *The Advocate of Comfortable Lies* (arcane family) — a slick barrister who makes false beliefs feel true; falls silent when real evidence is presented
**Emotional register:** Public trial. Ceremonial. High-stakes. Everyone is watching.

**4 Checkpoints** (order matches ArenaScene.ts):
1. **The Naming Post** — where assumptions are dragged into public light, ranked
2. **The Sand** — the arena floor itself, where the trial gets run
3. **The Judges' Bench** — where the validation method is designed
4. **The Verdict Pillar** — the raised platform where the evidence-based decision is declared

*(Historical note: earlier drafts of this doc listed CP2/CP3 in reverse order — the scene ships Sand before Judges' Bench, as the fight happens on the sand first and judges rule afterwards.)*

**Palette:** Sandy ochre floor, red banners, marble white columns, hot-noon sunlight, banner-blue accents
**Must-have elements:**
- **Large circular sand pit at center** (the trial ground)
- **Terraced stone seating** around 60-70% of the perimeter (audience amphitheatre)
- **Raised judge's plinth** on one side with a wooden bench
- **Trophy pillar / verdict stone** near center
- **Naming posts** — 4-6 wooden stakes around the sand's edge, each with a scroll or wax seal
- **Torch braziers** at cardinal points

**Camera intent:** The trial should feel gladiatorial. Wide arena in center, checkpoints ARRAYED around the rim so the player character walks the amphitheatre's edge.

**Reference vibe:** Colosseum meets village fair — not too grand, still feels like the venture's hometown court. Think medieval-fantasy small-town arena, ~1500 seats not 50,000.

**One-line generation prompt:**
> Top-down 2D pixel art of a small medieval fantasy amphitheatre. Circular sandy pit at center, terraced stone seating rising around 70% of the perimeter, wooden judge's platform on one side, 6 wooden verdict stakes ringing the sand, torch braziers at cardinal compass points, red hanging banners, warm noon sunlight, painterly tile-friendly style, ~2400×1600px, palette of ochre sand + red banners + weathered stone.

---

## STAGE 4 — The Artisan's Quarter (Offer Design)

**Status:** ✅ Painted, shipped
**Boss:** *The Unfinished Golem* (machine family) — an incomplete clay figure that comes apart wherever the specification has gaps
**Emotional register:** Craft. Precision. Care.

**5 Checkpoints:**
1. **Craft Workshop** — customer journey mapped end-to-end
2. **Weaver's Alley** — offer specified in every seam
3. **Potter's Kiln** — identity raised as the maker's mark
4. **Jeweller's Row** — offer put in real customer hands
5. **Master's Forge** — offer finalised, Golem stilled

**Palette:** Warm terracotta, aged cobblestone, jewel-tone shop awnings
**Must-have elements:** narrow winding cobblestone lanes, awnings, workshop windows, kilns, a jeweller's tent, an anvil, hanging sign-boards

**Existing map is good.** No changes needed.

---

## STAGE 5 — The Mine (Build & Deliver)

**Status:** ⚪ MISSING — needs generation
**Boss:** *The Collapse Specter* (undead family) — a shadowy tunnel-wraith that appears where the dig was unplanned
**Emotional register:** Determined labor. Dangerous. Depth. Underground breath.

**6 Checkpoints** (this stage has the MOST checkpoints — biggest map):
1. **Mine Head / Blueprint Table** — mineworks planned, every shaft mapped
2. **The Tool Yard** — build environment set up, tooling confirmed
3. **The First Shaft** — core offer built, ore reaches surface
4. **The Support Beam** — internal quality check, tunnels shored
5. **The Pilot Chamber** — real crews walk the works (beta)
6. **The Loading Bay** — cart loaded, launch-ready

**Palette:** Rusty iron, torchlight amber against cool blue-black stone, lamp-oil yellow, iron-track gray, mineral vein turquoise for accents
**Must-have elements:**
- **Cross-section view** — the map should show the exterior mine mouth AND a subtle cutaway of tunnels beneath (like a Terraria-style world)
- **Blueprint table** near the mine mouth with scrolls and lanterns
- **Rail tracks** on the surface leading to a wooden cart at the loading bay
- **Wooden support beams** in a visible tunnel
- **Support beams / scaffolding** every ~200px so it reads as "under construction"
- **Lantern glows** dotted through the tunnels
- **A small crushing/sorting operation** — piles of rock, sieves
- **Steam** rising from a smelting area near the loading bay

**Camera intent:** Feels like a working industrial site, not an abandoned mine. Steam and torchlight = active labor.

**Reference vibe:** Dwarven fantasy meets 19th-century coal shaft. Not Diablo dark — this is a functioning mine, not a horror set.

**One-line generation prompt:**
> Top-down 2D pixel art of an active fantasy mine complex. Central mine mouth with a blueprint table and lanterns, rail tracks running out to a wooden loading cart, visible tunnel network cut into the earth beneath (cross-section style), wooden support beams every few tiles, torch glows in each shaft, steam rising from a smelting bay, piles of ore and sorting sieves, warm amber torchlight against cool blue-black stone, painterly tile-friendly style, ~2400×1600px.

---

## STAGE 6 — The Harbour (Launch)

**Status:** ✅ Painted (as "Golden Harbor"), shipped
**Boss (super):** *The Leviathan of Market Rejection* (serpent family) — rises when the founder faces down real customer rejection; questions the "who are your next three customers and why" close
**Mini-bosses:** Silver-Tongued Merchant, Harbormaster of Gatekeeping, Colossal Sea Serpent
**Emotional register:** Casting off. Wind in the sails. Nervous excitement.

**3 Checkpoints** (matches Convex venture template + GoldenHarborScene.ts):
1. **Dockside Arrival** — launch assets prepared
2. **Market Square** — product live and announced
3. **Warehouse District** — first users acquired

The **Lighthouse Tip** at (2300, 520) is no longer a CP — it's the super-boss reveal anchor only.

**Palette:** Blue-teal water, gold-hour sunlight, red-brown hulls, white sail canvas
**Must-have elements:** docks, tall ships with rigging, harbour master's office, a lighthouse on the point, seagulls, warehouses along the quay

*(Historical note: earlier drafts of this doc named the super-boss "Harbourmaster of Hesitation" — that was superseded when the roster in stage-bosses.ts locked in "Leviathan of Market Rejection" and the config caught up. The Harbourmaster is now the mini-boss "Harbormaster of Gatekeeping" at CP2.)*

---

## STAGE 7 — The Crossroads Town (Iteration)

**Status:** ⚪ MISSING — needs generation
**Boss:** *The Babel Merchant* (arcane family) — a hooded trader who gives a different map to every traveller he meets
**Emotional register:** Reflection. Choose one road. Repair what's broken. Cheerful pragmatism.

**4 Checkpoints:**
1. **The Inn Yard** — feedback collected from every traveller
2. **The Signpost** — one road chosen from the evidence
3. **The Roadworks** — improvements delivered, road rebuilt
4. **The Milestone Marker** — impact measured, difference walked

**Palette:** Sunset gold on cobblestone, weathered wood signs, russet autumn leaves, warm inn firelight
**Must-have elements:**
- **A visible junction** — four or five roads converging at center point (the actual crossroads)
- **A tall wooden signpost** at the center with arrows pointing every direction, each with a small town name burned in
- **An inn** on one corner (open door, hanging sign, chimney smoke)
- **A merchant's cart** with piled goods on another corner (the Babel Merchant's rig)
- **Milestone stones** planted along each road exiting the frame
- **Road-repair scene** on one of the roads — cobbles being replaced by a small crew
- **Seasonal detail:** autumn (russet leaves scattered, harvest wagon in background)

**Camera intent:** The junction itself is the star. The map is small-town commerce + reflection, not medieval bustle.

**Reference vibe:** Wayside village at harvest time. Think a Studio Ghibli countryside crossroads.

**One-line generation prompt:**
> Top-down 2D pixel art of a fantasy small-town crossroads at golden hour. Five cobblestone roads converging on a central junction with a tall wooden signpost bearing directional arrows, an inn on one corner with chimney smoke, a merchant's cart with piled goods on another, milestone stones along each exit road, a small crew repairing cobbles on one road, russet autumn leaves scattered, warm sunset lighting, painterly tile-friendly style, ~2400×1600px.

---

## STAGE 8 — The Capital (Scale)

**Status:** ⚪ MISSING — needs generation
**Boss:** *The Iron Bureaucrat* (machine family) — an armored administrator who demands proof of every coin, treaty, and process before granting expansion
**Emotional register:** Grandeur. Ambition. Established institutions. Something built to last.

**5 Checkpoints:**
1. **The Approach Roads** — growth channels scouted
2. **The Merchants' Guild** — revenue model validated
3. **The City Gate** — operations scaled to hold the crowd
4. **The Treaty Hall** — partnerships secured
5. **The Palace Ledger** — long-term sustainability read

**Palette:** Grey stone, deep blue banners, gold trim, marble white, imperial crimson accents
**Must-have elements:**
- **A large walled city** at center, dominant fortress silhouette
- **Multiple approach roads** entering from map edges, meeting at the main gate
- **The Merchants' Guild** — a domed building with an ornate sign, scale-and-coins motif
- **The City Gate** — a MASSIVE iron portcullis with guards, the visual anchor
- **The Treaty Hall** — a colonnaded building with flags of multiple factions flying
- **The Palace / Ledger tower** — the tallest structure, at the back of the city, with a distinctive spire
- **A wide central plaza** connecting all buildings
- **Bridges, aqueducts** — evidence of infrastructure that supports scale

**Camera intent:** Should feel BIGGEST of all maps. Player character on this map should look small. The wide plaza + walled skyline should be a "we made it" reveal.

**Reference vibe:** Byzantine + Roman imperial capital. Not a fairy-tale castle — a functioning capital of a mercantile kingdom.

**One-line generation prompt:**
> Top-down 2D pixel art of a grand fantasy walled capital city. Massive iron portcullis gate as visual anchor, multiple approach roads converging from map edges, a domed merchants' guild with scales-and-coins insignia, a colonnaded treaty hall with faction flags flying, a tall palace ledger tower with distinctive spire, wide central plaza, aqueducts, bridges, grey stone with deep blue banners and gold trim, imperial grandeur, painterly tile-friendly style, ~2600×1800px (largest of all stage maps).

---

## Generation checklist per new map

For each of the 4 missing maps (Arena, Mine, Crossroads, Capital), the output should:

- [ ] Be **≥2400px wide** so camera zoom 0.85 has enough resolution
- [ ] Have **6+ visible landmarks** so 3-6 CP nodes can be placed distinctly
- [ ] Read at **both zoom levels** — wide (whole map visible) and close (one CP framed)
- [ ] Match **top-down pixel art style** consistent with the shipped Village and Forest maps
- [ ] Have **walkable ground colour** distinct from **impassable colour** (grass green vs water blue, or path tan vs building grey)
- [ ] Include enough **negative space between CPs** for character sprites to be legible
- [ ] Not embed any **UI/text markers** — those are added at runtime by Phaser

## Boss art already delivered per stage

All 15 boss idle sprites + 8-angle rotations already extracted for:
- Village: Fog, Chimera, Automaton, Wraith, Unraveller
- Forest: Shadow-Specter, Sorceress, Thornbearer, Wraith-of-Almost, Forest Colossus
- Harbor (labelled stage3 on disk): Merchant, Harbormaster, Sea Serpent, Mist, Leviathan
- Artisans: Armored Perfectionist, Automaton, Titan, Spectral King, Forge Dragon

**Still needed:** boss sprites for Arena (Advocate + minis), Mine (Collapse Specter + minis), Crossroads (Babel Merchant + minis), Capital (Iron Bureaucrat + minis).

## Filename convention

If your artist follows the existing convention:
```
public/assets/maps-v2/arena/arena-map.png
public/assets/maps-v2/mine/mine-map.png
public/assets/maps-v2/crossroads/crossroads-map.png
public/assets/maps-v2/capital/capital-map.png
```

Once dropped in, the corresponding scene file (I'll build these when art lands) just imports the path.

---

## Priority order for the client demo

If painting all 4 is too much before demo, ship in this order:

1. **The Arena** — Stage 3 (Validation) is the emotional core of the spec (public trial). Highest narrative payoff.
2. **The Capital** — Stage 8 finale, the "we made it" reveal at the end of the arc.
3. **The Mine** — Stage 5 industrial working scene, biggest map, most CPs.
4. **The Crossroads Town** — Stage 7 reflection stage, smallest scope, safest to ship late.
