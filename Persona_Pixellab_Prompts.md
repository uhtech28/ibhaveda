# Persona Pixellab Animation Prompt Compendium

Companion to the base sprite sheet compendium. These prompts are tuned for the **Pixellab.ai** pipeline that produced the Alchemist's live animations:

- **Frame size:** 88×88 (native pixel art, no anti-aliasing)
- **Sheet layout:** 9 frames laid out horizontally on a single PNG (792×88 total)
- **Output style:** 16-bit SNES-era pixel art, clean black outlines, flat cel shading, transparent background, saturated palette
- **Style reference:** re-use the Alchemist reference image (curly-haired scholar with green vial) as the "style reference" upload in Pixellab so all personas share the same look-and-feel

For each persona there are **6 prompts** — one for the base reference and one for each animation state (walking uses 4-directional variants). Paste each prompt into Pixellab's "generate character animation" flow.

Alchemist is already done — start with any of the seven below.

---

## 1. ARCANIST — The Spellweaving Wizard

**Base character description (reuse across all prompts):**
Young male pixel-art wizard, slender build, deep indigo blue robe with silver trim and glowing star patterns along the hem, tall pointed wide-brimmed wizard hat, pale skin, short messy dark hair peeking under the hat, wooden staff topped with a glowing pale-blue crystal, simple rope belt, brown leather boots, soft blue magical glow around the staff tip.

### 1.1 — Character Generation (idle / breathing)
> A young male pixel-art wizard as described (indigo robe with silver trim, tall pointed hat, blue crystal staff, pale skin, short dark hair). Static reference sheet, front view, standing in a calm neutral stance with staff held vertically in the right hand, subtle chest breathing motion suggested. Output: single 88×88 pixel-art sprite on transparent background, 16-bit SNES RPG style, clean black outlines, flat cel-shading, saturated palette, no anti-aliasing.

### 1.2 — Walking (generate 4 sheets — one per direction)
> **[WALK — SOUTH]** The Arcanist wizard walking toward the viewer, staff held in the right hand tapping the ground on each step, robe hem swishing side-to-side, hat bobbing slightly, blue crystal pulses softly. 9-frame horizontal walk cycle animation spritesheet, 88×88 per frame, side view / front view depending on direction, 16-bit SNES RPG pixel art, transparent background, clean outlines, no anti-aliasing.
>
> Duplicate the same prompt swapping `SOUTH` for **NORTH** (walking away), **EAST** (walking right, side profile), **WEST** (walking left, side profile).

### 1.3 — Attacking
> The Arcanist wizard casting a spell — plants his feet, raises the staff overhead with both hands, blue crystal charges then releases a crackling arc of blue lightning forward. 9-frame horizontal one-shot attack spritesheet, 88×88 per frame, side view facing right, 16-bit SNES RPG pixel art, transparent background, saturated palette, dramatic magical burst on final frames, no anti-aliasing.

### 1.4 — Giving / Taking Damage (hurt)
> The Arcanist wizard taking a hit — head snaps back, robe flares from the impact, staff wobbles in his grip, brief red flash overlay on the middle frames, recovers to standing by the final frame. 9-frame horizontal one-shot hurt animation spritesheet, 88×88 per frame, front-facing 3/4 view, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

### 1.5 — Defeat / Losing
> The Arcanist wizard collapsing in defeat — staff slips from his hand, knees buckle, he falls forward slowly to hands and knees, hat tips off, blue crystal glow fades out completely by the final frame. 9-frame horizontal one-shot defeat animation spritesheet, 88×88 per frame, front-facing 3/4 view, 16-bit SNES RPG pixel art, transparent background, hold last frame on the defeated pose, no anti-aliasing.

### 1.6 — Victory / Celebration
> The Arcanist wizard celebrating — raises his staff high overhead with both hands, spins in place once, releases a bright burst of blue sparkles from the crystal, ends with a triumphant pose with staff planted and free hand raised in a fist. 9-frame horizontal one-shot victory animation spritesheet loopable, 88×88 per frame, front view, 16-bit SNES RPG pixel art, transparent background, magical sparkle particles around him, no anti-aliasing.

---

## 2. ARTISAN — The Maker with a Hammer

**Base character description:**
Female pixel-art artisan, medium build, paint-splattered denim overalls over a red-and-white striped shirt, curly orange hair tied up in a bun with a yellow pencil sticking through it, fair skin with freckles, small tool satchel on the hip, holding a small wooden mallet in one hand and a paintbrush in the other, sneakers, cheerful confident stance.

### 2.1 — Character Generation (idle / breathing)
> A female pixel-art artisan as described (denim overalls, striped shirt, orange bun with pencil, mallet and paintbrush, freckled fair skin). Static reference sheet, front view, standing in an energetic ready-to-work stance, subtle chest breathing motion suggested. Output: single 88×88 pixel-art sprite on transparent background, 16-bit SNES RPG style, clean black outlines, flat cel-shading, saturated palette, no anti-aliasing.

### 2.2 — Walking (4 sheets)
> **[WALK — SOUTH]** The Artisan walking toward the viewer with a bouncy energetic step, mallet swinging at one side, paintbrush in the other hand, curly bun bobs, tool satchel jostles gently. 9-frame horizontal walk cycle animation spritesheet, 88×88 per frame, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.
>
> Duplicate for **NORTH**, **EAST**, **WEST**.

### 2.3 — Attacking
> The Artisan attacking — winds up with the wooden mallet gripped in both hands, swings a big overhead HAMMER STRIKE forward, follow-through pose with mallet planted low, small yellow impact stars on the strike frame. 9-frame horizontal one-shot attack spritesheet, 88×88 per frame, side view facing right, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

### 2.4 — Giving / Taking Damage (hurt)
> The Artisan taking a hit — flinches backward, mallet drops to one side, one arm covers her face, orange bun jostles loose slightly, brief red flash on middle frames, recovers by final frame. 9-frame horizontal one-shot hurt animation spritesheet, 88×88 per frame, front-facing 3/4 view, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

### 2.5 — Defeat / Losing
> The Artisan collapsing in defeat — mallet and paintbrush fall to the ground, she sits down heavily on her heels, head bowed, one hand on the ground, curly bun droops. 9-frame horizontal one-shot defeat animation spritesheet, 88×88 per frame, front-facing 3/4 view, 16-bit SNES RPG pixel art, transparent background, hold last frame on the seated defeated pose, no anti-aliasing.

### 2.6 — Victory / Celebration
> The Artisan celebrating — jumps in the air with mallet raised triumphantly in one hand and paintbrush in the other, colorful paint splatters and confetti pixel bursts around her, lands in a wide victory stance with a huge grin. 9-frame horizontal one-shot loopable victory animation spritesheet, 88×88 per frame, front view, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

---

## 3. DRIFTER — The Shadow Scout

**Base character description:**
Male pixel-art rogue, lean build, worn dark grey hooded traveling cloak over a tattered tan tunic, scruffy short brown hair partly hidden by the hood, olive skin, fingerless dark leather gloves, a curved silver dagger sheathed at his belt (drawn in combat frames), tan travel boots, relaxed slouched stance with hands near pockets.

### 3.1 — Character Generation (idle)
> A male pixel-art rogue as described (grey hooded cloak, tan tunic, scruffy brown hair under hood, dagger at belt, olive skin, fingerless gloves). Static reference sheet, front view, standing in a relaxed slouched neutral stance with hands near pockets, subtle chest breathing motion. Output: single 88×88 pixel-art sprite on transparent background, 16-bit SNES RPG style, clean black outlines, flat cel-shading, saturated palette, no anti-aliasing.

### 3.2 — Walking (4 sheets)
> **[WALK — SOUTH]** The Drifter walking toward the viewer with a quiet stealthy gait, cloak swaying behind him, hood slightly bobbing, hands relaxed at his sides. 9-frame horizontal walk cycle animation spritesheet, 88×88 per frame, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.
>
> Duplicate for **NORTH**, **EAST**, **WEST**.

### 3.3 — Attacking
> The Drifter attacking — draws the curved dagger from his belt in a quick flourish, lunges forward with a fast horizontal slash, ends in a low crouched follow-through pose, thin silver motion arc across the strike frame. 9-frame horizontal one-shot attack spritesheet, 88×88 per frame, side view facing right, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

### 3.4 — Giving / Taking Damage (hurt)
> The Drifter taking a hit — his cloak flares from impact, he stumbles one step back gripping his side with the free hand, hood shifts to obscure his face, brief red flash on middle frames, recovers by final frame. 9-frame horizontal one-shot hurt animation spritesheet, 88×88 per frame, front-facing 3/4 view, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

### 3.5 — Defeat / Losing
> The Drifter collapsing — dagger slips from his fingers, he drops to one knee then rolls onto his side, hood covers his face, cloak settles around him. 9-frame horizontal one-shot defeat animation spritesheet, 88×88 per frame, side view, 16-bit SNES RPG pixel art, transparent background, hold last frame on fallen pose, no anti-aliasing.

### 3.6 — Victory / Celebration
> The Drifter celebrating — a cool smirking pose, spins the dagger in one hand, tosses it up and catches it, ends with the hood pushed back and a rare grin, arms crossed. 9-frame horizontal one-shot loopable victory animation spritesheet, 88×88 per frame, front view, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

---

## 4. ENGINEER — The Tactical Operator

**Base character description:**
Male pixel-art builder-engineer, stocky sturdy build, dark blue overalls over a light grey work shirt with rolled sleeves, brown leather tool belt visibly holding a wrench and small brass gears, medium skin tone, short brown hair mostly under a small dark flat cap, round brass safety goggles pushed up on the forehead, sturdy brown work boots, holding a large iron wrench in his right hand, ready-to-work posture.

### 4.1 — Character Generation (idle)
> A male pixel-art builder-engineer as described (blue overalls, grey work shirt, flat cap, brass goggles on forehead, tool belt, iron wrench in right hand). Static reference sheet, front view, standing in a solid ready stance with wrench resting on the shoulder, subtle chest breathing motion. Output: single 88×88 pixel-art sprite on transparent background, 16-bit SNES RPG style, clean black outlines, flat cel-shading, saturated palette, no anti-aliasing.

### 4.2 — Walking (4 sheets)
> **[WALK — SOUTH]** The Engineer walking toward the viewer with a heavy determined step, wrench held over one shoulder, tool belt jingles slightly, boots stomp the ground. 9-frame horizontal walk cycle animation spritesheet, 88×88 per frame, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.
>
> Duplicate for **NORTH**, **EAST**, **WEST**.

### 4.3 — Attacking
> The Engineer attacking — grips the wrench in both hands, winds up and swings a heavy overhead WRENCH SMASH forward, sparks fly from the impact frame, follow-through with the wrench low and body angled forward. 9-frame horizontal one-shot attack spritesheet, 88×88 per frame, side view facing right, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

### 4.4 — Giving / Taking Damage (hurt)
> The Engineer taking a hit — his stocky frame absorbs the blow, he grunts and stumbles a half-step back with one arm shielding his face, cap tips forward briefly, brief red flash on middle frames, recovers by final frame planting the wrench for balance. 9-frame horizontal one-shot hurt animation spritesheet, 88×88 per frame, front-facing 3/4 view, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

### 4.5 — Defeat / Losing
> The Engineer collapsing — wrench falls with a clang, he drops to both knees then slumps forward onto his hands, flat cap falls off, tool belt gears scatter. 9-frame horizontal one-shot defeat animation spritesheet, 88×88 per frame, front-facing 3/4 view, 16-bit SNES RPG pixel art, transparent background, hold last frame on defeated pose, no anti-aliasing.

### 4.6 — Victory / Celebration
> The Engineer celebrating — pumps the wrench triumphantly overhead, small mechanical gear-shaped confetti bursts around him, ends with the wrench on the shoulder and a confident thumbs-up. 9-frame horizontal one-shot loopable victory animation spritesheet, 88×88 per frame, front view, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

---

## 5. PATHFINDER — The Field Explorer

**Base character description:**
Nonbinary pixel-art explorer, athletic build, khaki adventurer's vest with brown leather straps over a long-sleeve olive-green shirt, dark tan cargo pants, wide-brimmed brown safari hat over short tousled brown hair, tan skin, brown hiking boots, small brass compass hanging from the vest, a rolled parchment map tucked under one arm, alert forward-leaning ready stance, wooden walking stick in the other hand.

### 5.1 — Character Generation (idle)
> A nonbinary pixel-art explorer as described (khaki vest, olive shirt, safari hat, cargo pants, compass, rolled map under arm, walking stick, tan skin). Static reference sheet, front view, standing in an alert forward-leaning explorer's stance, subtle chest breathing motion. Output: single 88×88 pixel-art sprite on transparent background, 16-bit SNES RPG style, clean black outlines, flat cel-shading, saturated palette, no anti-aliasing.

### 5.2 — Walking (4 sheets)
> **[WALK — SOUTH]** The Pathfinder walking toward the viewer with a confident purposeful stride, walking stick planted with each other step, map bounces under one arm, compass swings gently, safari hat brim bobs. 9-frame horizontal walk cycle animation spritesheet, 88×88 per frame, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.
>
> Duplicate for **NORTH**, **EAST**, **WEST**.

### 5.3 — Attacking
> The Pathfinder attacking — grips the wooden walking stick in both hands, spins it once, thrusts forward like a spear-jab, follow-through pose braced low, small dust puff at the strike frame. 9-frame horizontal one-shot attack spritesheet, 88×88 per frame, side view facing right, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

### 5.4 — Giving / Taking Damage (hurt)
> The Pathfinder taking a hit — recoils backward one step, walking stick wobbles, map drops from under the arm, safari hat brim tilts down over the eyes, brief red flash on middle frames, recovers by final frame. 9-frame horizontal one-shot hurt animation spritesheet, 88×88 per frame, front-facing 3/4 view, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

### 5.5 — Defeat / Losing
> The Pathfinder collapsing — walking stick clatters to the ground, they drop to one knee holding the side of the hat, map unrolls partially on the ground beside them, head bowed. 9-frame horizontal one-shot defeat animation spritesheet, 88×88 per frame, front-facing 3/4 view, 16-bit SNES RPG pixel art, transparent background, hold last frame, no anti-aliasing.

### 5.6 — Victory / Celebration
> The Pathfinder celebrating — plants the walking stick like a flag, unfurls the map overhead in triumph, tips the safari hat forward with a wide smile, compass swings freely, ends with fists on hips in a heroic explorer pose. 9-frame horizontal one-shot loopable victory animation spritesheet, 88×88 per frame, front view, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

---

## 6. ORACLE — The Visionary Seer

**Base character description:**
Female pixel-art seer, graceful slender build, flowing pale lavender and white robes with golden embroidery along the hem, long silver-white hair flowing past the shoulders, small golden circlet on the forehead with a single violet gemstone, soft violet eyes, holding a small floating crystal orb glowing faintly with pale violet light above her open palm, fair skin, barefoot with softly glowing footfalls, serene composed posture.

### 6.1 — Character Generation (idle)
> A female pixel-art seer as described (pale lavender-and-white robes with gold embroidery, silver-white long hair, gold circlet, violet crystal orb floating above her open palm, fair skin, barefoot). Static reference sheet, front view, standing in a serene composed stance, robes gently flowing, subtle chest breathing motion. Output: single 88×88 pixel-art sprite on transparent background, 16-bit SNES RPG style, clean black outlines, flat cel-shading, saturated palette, no anti-aliasing.

### 6.2 — Walking (4 sheets)
> **[WALK — SOUTH]** The Oracle walking toward the viewer with a gliding graceful step, robes flowing softly around her legs, silver hair drifting behind, crystal orb orbits slowly above her outstretched palm, faint violet sparkle trail. 9-frame horizontal walk cycle animation spritesheet, 88×88 per frame, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.
>
> Duplicate for **NORTH**, **EAST**, **WEST**.

### 6.3 — Attacking
> The Oracle attacking — she extends her open palm, the crystal orb glows brightly and pulses, releases a thin violet beam of foresight-light forward, ends with the orb settled back above her palm and free arm raised gracefully. 9-frame horizontal one-shot attack spritesheet, 88×88 per frame, side view facing right, 16-bit SNES RPG pixel art, transparent background, violet magical particles around the beam, no anti-aliasing.

### 6.4 — Giving / Taking Damage (hurt)
> The Oracle taking a hit — she gasps and drifts back slightly (feet barely touching ground), crystal orb flickers, silver hair whips, one hand raised protectively across her chest, brief red flash on middle frames, recovers her serene composure by the final frame. 9-frame horizontal one-shot hurt animation spritesheet, 88×88 per frame, front-facing 3/4 view, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

### 6.5 — Defeat / Losing
> The Oracle collapsing — crystal orb dims and shatters into pixel fragments that drift downward, she sinks slowly to her knees with her hair falling forward, robes settling around her, golden circlet slips from her brow. 9-frame horizontal one-shot defeat animation spritesheet, 88×88 per frame, front-facing 3/4 view, 16-bit SNES RPG pixel art, transparent background, hold last frame on the kneeling defeated pose, no anti-aliasing.

### 6.6 — Victory / Celebration
> The Oracle celebrating — the crystal orb splits into three glowing orbs that orbit around her, she raises her arms overhead gracefully, silver hair lifted in a magical updraft, ends with hands clasped over her heart and a soft luminous smile, faint violet halo behind her. 9-frame horizontal one-shot loopable victory animation spritesheet, 88×88 per frame, front view, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

---

## 7. HEALER — The Compassionate Builder

**Base character description:**
Female pixel-art cleric-healer, gentle warm build, white and soft pink robes with a small red-cross emblem stitched on the chest, a white headscarf loosely covering her head with a few blonde strands visible at the front, fair skin, holding a wooden staff topped with a glowing pink heart-shaped crystal, small satchel at her hip filled with herbs and bandages, warm kind expression, gentle standing posture.

### 7.1 — Character Generation (idle)
> A female pixel-art cleric-healer as described (white and soft pink robes with red cross, white headscarf with blonde strands, pink heart-crystal staff, herb satchel, fair skin, warm expression). Static reference sheet, front view, standing in a gentle welcoming stance, staff held vertically, subtle chest breathing motion. Output: single 88×88 pixel-art sprite on transparent background, 16-bit SNES RPG style, clean black outlines, flat cel-shading, saturated palette, no anti-aliasing.

### 7.2 — Walking (4 sheets)
> **[WALK — SOUTH]** The Healer walking toward the viewer with a calm gentle stride, staff tapping the ground softly with each step, pink heart-crystal pulses gently, headscarf edges flutter, robes sway. 9-frame horizontal walk cycle animation spritesheet, 88×88 per frame, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.
>
> Duplicate for **NORTH**, **EAST**, **WEST**.

### 7.3 — Attacking
> The Healer attacking — raises the staff, the pink heart-crystal charges bright, releases a radiant pink healing-blast wave forward that could as easily heal an ally as smite an enemy, follow-through with the staff planted and free hand outstretched. 9-frame horizontal one-shot attack spritesheet, 88×88 per frame, side view facing right, 16-bit SNES RPG pixel art, transparent background, warm pink glow particles, no anti-aliasing.

### 7.4 — Giving / Taking Damage (hurt)
> The Healer taking a hit — she winces and takes a half-step back, one hand clutching the front of her robe, staff wobbles, heart-crystal flickers dimly, headscarf shifts revealing more blonde hair, brief red flash on middle frames, recovers her gentle composure by the final frame. 9-frame horizontal one-shot hurt animation spritesheet, 88×88 per frame, front-facing 3/4 view, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

### 7.5 — Defeat / Losing
> The Healer collapsing — staff falls from her hand and lays on the ground with the pink crystal dimming, she sinks to her knees with hands folded softly in her lap, headscarf slips back, head bowed peacefully. 9-frame horizontal one-shot defeat animation spritesheet, 88×88 per frame, front-facing 3/4 view, 16-bit SNES RPG pixel art, transparent background, hold last frame on the kneeling defeated pose, no anti-aliasing.

### 7.6 — Victory / Celebration
> The Healer celebrating — lifts the staff high with both hands, pink heart-crystal bursts into a shower of small pink hearts and sparkles falling around her, ends with staff held across her chest and a warm beaming smile, gentle pink halo behind her. 9-frame horizontal one-shot loopable victory animation spritesheet, 88×88 per frame, front view, 16-bit SNES RPG pixel art, transparent background, no anti-aliasing.

---

## Pixellab pipeline tips (same recipe used for Alchemist)

1. **Style-lock:** upload the finished Alchemist reference (e.g. `alchemist/idle.png` first frame) as the "style reference" on every generation so all 7 personas share the exact 16-bit look-and-feel.
2. **Frame count:** 9 frames per animation. Pixellab's default is usually 8 — bump to 9 in the panel before generation.
3. **Frame size:** 88 × 88. Match Alchemist's dims exactly so all personas can share the same `AnimatedPersonaSprite` code with no config changes.
4. **Directional walks:** run the walking prompt 4 times with only the direction word swapped (SOUTH → NORTH → EAST → WEST). Save as `walk-south.png` / `walk-north.png` / `walk-east.png` / `walk-west.png`.
5. **Naming — match Alchemist exactly** so the code picks them up automatically:
   ```
   /public/assets/personas/{personaId}/
     idle.png
     walk-north.png  walk-south.png  walk-east.png  walk-west.png
     attack.png
     hurt.png
     defeat.png
     victory.png
     portrait.png  (crop of idle frame 0, 128×128, for combat panel)
   ```
6. **Once files are dropped in**, add each persona's `extended` block in `src/config/personas.ts` (copy `ALCHEMIST_EXTENDED` and rename), and they'll be live everywhere — map free-roam, checkpoint walk-tos, combat panel — with no other code changes.
