# Ibhaveda — Super Boss Generation Prompts (12 Boss Pool)

> Deep, PixelLab-ready character + animation prompts for the **12-boss Super Boss Pool** — the project-scoped villains that get randomly assigned per idea run (per `Ibhaveda_monsters_and_mechanics_reconciled` xlsx, Boss Pool sheet). Each boss's attack and defeat clips are tuned to their thematic "how it corrupts" verb so the animation reads narratively, not generically.
>
> Frame spec: **92 × 92 px per frame · 9 frames per clip · 828 × 92 horizontal spritesheet · transparent background.**
>
> Delivery folder: `public/assets/bosses/superpool/<boss-slug>/{idle,attack,hurt,victory,defeat}.png`

---

## Universal PixelLab prompt (prepend to every character prompt)

```
STYLE: 92×92 pixel-art super-boss character sprite in Ibhaveda's Village
boss style (matches Fog of Vagueness, Chimera, Automaton, Wraith visual
consistency). Chunky 32-bit pixel art, hand-painted shading, warm rim-
light from upper-left, soft directional shadow to lower-right. Character
centered, filling ~75% of the 92×92 canvas (super-bosses read one notch
larger than stage mini-bosses).

Silhouette must be instantly recognizable and intimidating at small size —
super-bosses only spawn once per project run so first impression matters.

BACKGROUND: fully transparent alpha 0 outside the character silhouette.
NO ground shadow baked in. NO scenery. NO other characters. NO text or UI.
```

## Universal animation contract (all 12 bosses, all 5 clips)

| Clip | Frames | fps | Loop? | Hold last? | Purpose |
|---|---|---|---|---|---|
| idle | 9 | 6 | ∞ | — | Slow ominous breathing / hovering. Super-bosses idle *slower* than stage mini-bosses to feel weighty |
| attack | 9 | 8 | play once | no | The specific corruption verb (unravel, freeze, drain, overgrow, mirror, burn, flood, raise, prophesy, argue, petrify, veil) — see per-boss brief |
| hurt (taking damage) | 9 | 8 | play once | no | Recoil. Frame 1 impact snap-back → frames 2-4 stagger → 5-7 catch → 8-9 return |
| victory (evil) | 9 | 8 | play once | no | Dominant menacing pose — arms/wings/tendrils fully deployed. Reads as "you lost, I remain" |
| defeat (died / slain) | 9 | 5 | play once | **YES** | The specific "how it is ultimately defeated" verb (weave, ship, reconnect, cut, break-mirror, feed-fire, drain-tide, bury, silence-voice, dismiss-councillor, prove-movable, tear-veil). Frame 9 = stable end pose held for cinematic. See the xlsx "Slay" description for each boss's final visual |

---

# ═══ THE 12 SUPER BOSSES ═══

## SUPER BOSS 1 — The Unraveller
*Ancient Void Serpent · Doubt and loss of direction · pulls threads from reality*

### 1) Character prompt
```
[UNIVERSAL STYLE ANCHOR]

Massive serpent-like void entity coiled in a vertical S-shape. Body is
made of dozens of loose black-purple thread-strands rather than solid
scales — some threads dangle loose, some knot together, some end in
raw torn ends. Head is a triangular void-mask with two glowing purple
pinpoint eyes. Slitted mouth stitched horizontally with silver thread.
No visible legs — body tapers into more loose threads at the base.

PALETTE: deep royal purple threads, black voids between them, glowing
lavender eye pinpoints, silver stitch-thread accents.
```

### 2) Animations
**Idle:** slow hovering coil, thread-strands drift in unfelt wind, purple eye-pinpoints pulse dim to bright.

**Attack (UNRAVEL):** rears up, head lunges forward while two long thread-tendrils shoot out from the body and PULL — as if grabbing an invisible thread from the player's world and yanking it loose. Threads recoil back into the serpent.

**Taking damage:** whole coil recoils backward, several thread-strands snap and unravel outward, mask cracks briefly showing more void inside.

**Evil victory:** unfurls to full height (twice idle), body fans out into a wide thread-halo, mask splits open horizontally revealing an inner second mask, eye pinpoints flash bright violet.

**Died (SLAY — "the world knits back together"):** all loose threads pull inward and TIE together into a single tight knot. Body compresses into a small dense orb. Silver stitch-threads glow bright, then the orb shatters into fine silver dust. **Frame 9:** floating silver dust cloud in the rough shape of the coil, slowly dissipating.

---

## SUPER BOSS 2 — The Pale Architect
*Undead Perfectionist Titan · Paralysis and perfectionism · freezes progress in amber*

### 1) Character prompt
```
[UNIVERSAL STYLE ANCHOR]

Towering undead architect encased from the waist down in translucent
pale-amber crystal that traps its lower body. Skeletal-thin upper body
wearing a stiff bone-white draftsman's coat with high stiff collar.
Face hidden behind a large pair of round white-lensed spectacles
reflecting blueprint grid lines. Both skeletal hands hold identical
bone-white measuring compasses frozen mid-measurement. Chest is wrapped
in unfurled blueprint scrolls that never quite reach a finished plan.

PALETTE: bone white body, translucent pale-amber crystal encasement,
faint architect-blue grid lines in spectacles, matte black frames.
```

### 2) Animations
**Idle:** upper body ticks side to side like a broken pendulum, compasses hold their frozen position, blueprint scrolls flutter faintly.

**Attack (FREEZE):** raises both compasses overhead and slams them together — a translucent amber wave radiates outward FREEZING everything it touches. Compasses return to frozen mid-measure position.

**Taking damage:** spectacles slip forward on chain-strap briefly revealing empty eye sockets, several blueprint scrolls tear loose, whole upper body jerks.

**Evil victory:** amber crystal encasement grows UP the body, encasing more of the torso, spectacles flash white with new blueprint grids, compasses spin in triumph.

**Died (SLAY — "amber cracks and the world breathes again"):** amber crystal encasement develops deep cracks that spider-web outward. Upper body strains upward with sudden released momentum. All amber shatters simultaneously. **Frame 9:** shattered amber shards on the floor with the bone-white coat crumpled on top, no body inside.

---

## SUPER BOSS 3 — The Hollow King
*Spectral Sovereign · Loss of purpose · drains meaning, world greyscales*

### 1) Character prompt
```
[UNIVERSAL STYLE ANCHOR]

Tall crowned king in tarnished grey plate mail sat on an invisible
throne. Cracked gold crown tilted on his head. Chest cavity is empty —
a black void where the heart should be with faint grey dust motes
drifting out. Long sword point-down in front, holding pommel loosely
with both gauntlets. Face grey and drawn, eyes gone dim and greyscale.
His whole silhouette reads slightly desaturated compared to other
bosses — as if he pulls color out of nearby pixels.

PALETTE: tarnished silver-grey armor, dulled gold crown, black void in
chest, grey dust motes, ashen skin.
```

### 2) Animations
**Idle:** shoulders slumped forward, weight resting on sword pommel, slow deep sigh drifts dust from chest void every 3s.

**Attack (DRAIN):** slowly raises sword hand and points outward — a grey wave of desaturation radiates from the sword tip toward the player, briefly sucking color from the frame. Sword returns to slumped rest.

**Taking damage:** head snaps back, more dust pours from chest void, sword nearly falls but catches, one step back stagger.

**Evil victory:** stands taller than idle for the first time (releasing throne), raises sword overhead with both hands, crown briefly straightens on head, chest void pulses black then expands wider — as if triumph briefly restored purpose.

**Died (SLAY — "colour floods back stage by stage in reverse order"):** sword slips from hands and clatters, chest void starts SPILLING out saturated color instead of grey dust — vivid greens, blues, gold. Crown falls off and rolls (in full color). King crumbles forward. **Frame 9:** empty pile of armor on floor with the gold crown resting brightly on top, colored light streaming outward from the pile.

---

## SUPER BOSS 4 — The Thornwarden
*Ancient Forest Colossus · Bureaucracy and friction · overgrows paths with thorns*

### 1) Character prompt
```
[UNIVERSAL STYLE ANCHOR]

Massive humanoid tree-giant of tangled brown thorny vine-brambles
shaped roughly into a hulking figure. No clear head — a denser knot
of thorns where the head should be with two glowing red pinpoint eyes.
Vines constantly writhing, sometimes extending long thorny tendrils
that grip invisible obstacles. Chest hung with rusted iron chains and
official-looking wax seals (bureaucratic decrees). Feet planted in a
tangle of roots.

PALETTE: warm dark brown vines, rust-red thorns, glowing crimson eyes,
tarnished iron chains, wax-seal red.
```

### 2) Animations
**Idle:** planted like a wall, vines slowly writhe, occasional thorny growth extends outward then retracts, red eyes blink unsynced, chains sway with tiny wax-seal jingle.

**Attack (OVERGROW):** rears back, thorny vines shoot out from the torso as long whipping tendrils that grip and constrict forward — as if entangling the path ahead. Chains rattle violently on the release.

**Taking damage:** whole vine-body shudders, several vines snap and hang limp, chains rattle loose, red eyes flicker off then back on dimmer.

**Evil victory:** vines fan outward like a peacock's tail forming a large thorn-halo, chains lift and stamp invisible documents with wax seals, red eyes flash brighter, more thorn-tendrils erupt from the body.

**Died (SLAY — "forest opens and a clear road appears"):** thorns retract inward, vines wither from brown to grey, chains fall clanking to the ground, red eyes wink out. As vines shrivel a clear straight PATH becomes visible through where the body stood. **Frame 9:** shriveled grey vine-heap with a bright dirt path running through the middle, chains scattered.

---

## SUPER BOSS 5 — The Mirror Witch
*Illusionist Sorceress · Confirmation bias and self-deception · replaces progress with reflections*

### 1) Character prompt
```
[UNIVERSAL STYLE ANCHOR]

Tall slender feminine figure in flowing light-blue silk robes covered
entirely in dozens of tiny triangular mirror shards that flash
distorted reflections. Face is a larger polished silver mirror with
no features — anyone looking sees a warped version of themselves.
Long silver hair ending in floating shard fragments that orbit her
slowly. Hovers slightly above the ground.

PALETTE: light sky-blue silk, silver mirror shards, cool white
reflective highlights, pale platinum hair.
```

### 2) Animations
**Idle:** hovering slightly, robes swirling in unfelt wind, shard fragments orbit slowly, mirror-face tilts as if considering.

**Attack (REFLECT):** raises both hands, mirror shards from her robe detach and shoot forward like a hail of daggers each showing a different distorted reflection of the target. New shards regenerate onto the robe.

**Taking damage:** mirror-face cracks with spider-web pattern briefly showing a real face beneath, several shards fall from robe and shatter, then face reseals and shards regrow.

**Evil victory:** all shards on the robe catch light and flash in choreographed sequence, mirror-face pulses with a warped image of the player's own defeat, hair-shards spin faster in triumph.

**Died (SLAY — "every mirror broken, world sharpens into clear focus"):** every shard on the robe cracks simultaneously with a piercing note. Mirror-face shatters into a spider-web. All shards fall away like broken glass. **Frame 9:** silver-skeleton silhouette collapsed in a pile of broken mirror-glass, silk robe puddled beneath, single unbroken shard catching a clear undistorted light.

---

## SUPER BOSS 6 — The Ashen Drake
*Fire Dragon of Entropy · Abandonment and inertia · burns idle work to ash*

### 1) Character prompt
```
[UNIVERSAL STYLE ANCHOR]

Medium-sized four-legged dragon sitting on haunches with wings folded
low and drooped. Scales the color of cooled campfire ash — grey with
faint dying-ember orange glowing through the cracks. Small dying flames
flicker at nostrils and along the spine ridge. Tail curled around
itself. Eyes half-closed and tired-looking. Wings tattered at the
edges from having burned themselves too many times.

PALETTE: cooled-ash grey dominant, dying-ember orange glow in scale
cracks, small orange flame at nostrils, dark charcoal wing membranes.
```

### 2) Animations
**Idle:** slow chest rise-and-fall, occasional small smoke puff from nostrils, ember glow pulses dim to slightly brighter.

**Attack (BURN):** rears up, chest ember-glow flares to bright orange, exhales a wide cone of orange flame forward that visibly turns invisible objects into ash. Settles back on haunches coughing smoke.

**Taking damage:** whole body flinches, ember glow flickers as if losing heat, one wing sags further, small ash particles fall from scales.

**Evil victory:** rears onto hind legs, wings unfurl fully revealing bright orange fire-veins for the first time, roars silently with small flame column shooting straight up, folds back down slowly savoring the win.

**Died (SLAY — "ash transforms into gold dust on every completed stage"):** ember glow drains from all scales turning them uniform cold grey. Wings collapse, head slumps to floor. Then the grey ash starts glinting with GOLD flecks. **Frame 9:** dragon body curled like an ash sculpture on ground, with a bright pile of gold dust spilling out from where the chest-fire was.

---

## SUPER BOSS 7 — The Tide Caller
*Oceanic Leviathan · Distraction and scope creep · floods landscape with noise*

### 1) Character prompt
```
[UNIVERSAL STYLE ANCHOR]

Massive ocean-priest figure in flowing deep-blue-and-green wave-
patterned robes. Arms raised in eternal summoning gesture. Face
completely hidden beneath a wide conch-shell mask covered in
barnacles and dripping seaweed. Base of the robes dissolves into
small painterly waves that constantly lap outward from the figure —
he stands in his own personal tide. Multiple tentacle-thin arms
extending from beneath the main robe (leviathan hint).

PALETTE: deep ocean blue, sea green, white foam highlights, cream
conch-shell mask, coral-pink barnacles, seaweed dark green.
```

### 2) Animations
**Idle:** arms slowly rise and lower in wave-summoning rhythm, ripples emanate outward from the robe base, conch-mask tilts as if listening.

**Attack (FLOOD):** brings both arms sharply DOWN, a large wave crest rises from the base and rolls forward, secondary tentacle-arms whip out from under the robe striking simultaneously, then arms rise back up and wave dissipates.

**Taking damage:** base-waves briefly still, arms drop halfway, mask tilts down as if the sea itself flinched, tentacles retract, then rhythm resumes.

**Evil victory:** raises arms fully overhead, waves swell around the base into a full ring of foam that reaches the character's shoulders, conch-mask emits silent wave-echo lines, robe billows outward like a filling sail, tentacles fan out.

**Died (SLAY — "tide recedes revealing solid ground"):** waves recede rapidly back into the robe base and vanish. Tentacles slither back inside. Robes collapse inward, conch-mask falls off. **Frame 9:** conch-mask lying face-up on newly-revealed dry flagstones, a small clean puddle spreading around it, no figure remaining. Solid stone shows through where the endless tide once was.

---

## SUPER BOSS 8 — The Gravemind
*Necromantic Hive Intelligence · Fear of failure · raises corpses of abandoned ideas*

### 1) Character prompt
```
[UNIVERSAL STYLE ANCHOR]

Large rounded burial mound of dark green earth-and-turf with dozens
of weathered grey headstones jutting out at odd angles from the top
and sides — each headstone represents an abandoned idea. Multiple
pale ghostly whisper-faces made of green mist float out from between
the headstones, all mouthing warnings simultaneously. Small dark
green mist trails constantly curl off the mound. A single skeletal
hand pushes up out of the top of the mound holding a rusty scroll.

PALETTE: dark forest green mound, weathered grey stone, pale sickly-
green mist, small white ghost-face glows, bone-white skeletal hand.
```

### 2) Animations
**Idle:** mound is stationary; the ghost-faces weave slowly between headstones opening and closing mouths whispering, mist trails intensify then fade, skeletal hand slowly waves the scroll.

**Attack (RAISE):** all ghost-faces lunge forward simultaneously screaming, sending a wave of sickly-green mist rolling toward the player. Skeletal hand punches down and pulls up a SECOND bony hand from the mound. Retreat back.

**Taking damage:** ghost-faces flinch back into the mound, several headstones crack, mist trails briefly stop, skeletal hand drops scroll.

**Evil victory:** three more ghost-faces rise from between the headstones and swirl around the mound in triumph, all whispering, mist intensifies into a small tornado, more skeletal hands push up out of the mound in a triumphant chorus.

**Died (SLAY — "graveyard transforms into a garden of monuments"):** all ghost-faces sink back into the mound, mist stops entirely, headstones topple one by one. Then GRASS and small white flowers spring up covering the toppled stones. **Frame 9:** flat green meadow with the toppled stones repurposed as small white monument bases, tiny white flowers blooming across the surface, no mist remaining.

---

## SUPER BOSS 9 — The Rusted Oracle
*Corrupted Mechanical Prophet · Imposter syndrome · speaks only outdated truths*

### 1) Character prompt
```
[UNIVERSAL STYLE ANCHOR]

Mechanical brass-and-copper humanoid oracle statue seated cross-legged
on a stone pedestal. Entire body covered in flaking rust and TV-static
pattern dither. Where the face should be is a cracked crystal-ball orb
showing scrambled rust-orange static with occasional flickers of stale
"prophecies" (unreadable glyphs). Multiple raised hands (four visible)
each giving different oracular gestures that contradict each other.
Small gears visible through gaps in the rusted chest plate.

PALETTE: rust-orange dominant, tarnished brass and copper accents,
cracked-crystal blue-white orb, TV-static black-and-white dither.
```

### 2) Animations
**Idle:** sitting cross-legged, four hands raised in different oracular gestures, static-orb face flickering, occasional mechanical twitch of a finger with a puff of rust dust.

**Attack (PROPHESY):** static-orb face flashes bright with a rush of scrambled glyphs, all four hands shoot forward emitting static-electricity crackle beams that converge on the target. Rust dust bursts off shoulders from recoil.

**Taking damage:** static-orb briefly clears revealing a distressed brass mask underneath, then re-scrambles, rust flakes cascade off body, two hands drop.

**Evil victory:** static-orb face displays a warped "PROPHECY FULFILLED" pattern (abstract triumph glyphs, no readable text), all four hands raise skyward, rust flakes drift UPWARD defying gravity.

**Died (SLAY — "Oracle shatters, gears become the monument's clockwork"):** static-orb cracks in half, all mechanical joints seize with a puff of steam. Rust flakes cascade off. Body crumbles inward. Then the exposed gears fly outward and arrange themselves into a small ordered clockwork monument. **Frame 9:** small rust-heap silhouette on the floor with a tidy clockwork monument beside it made of the oracle's own gears, ticking cleanly.

---

## SUPER BOSS 10 — The Wraith Council
*Parliament of Failed Founders · Decision paralysis and committee thinking · seven arguing spectres*

### 1) Character prompt
```
[UNIVERSAL STYLE ANCHOR]

Seven semi-transparent pale-violet robed spectral figures in a tight
council-huddle circle facing each other. Each pointing in a different
direction with a skeletal hand. Faces hidden inside deep hoods except
for glowing white eye-pinpoints. Reads as a SINGLE monster unit even
though it's seven figures. Feet dissolve into pale mist that merges
into one shared circular base — they cannot separate. Each spectre
has a subtly different hood-shape / posture / stance suggesting
different failed-founder personalities.

PALETTE: pale violet robes, deeper indigo shadow, glowing white eye
pinpoints, cool grey skeletal hands, shared mist base.
```

### 2) Animations
**Idle:** the seven figures rotate slowly around each other in a tight orbit as if arguing, pointing arms shift direction, no consensus reached.

**Attack (ARGUE):** all seven figures suddenly point at the player in unison for a single sync-moment, seven violet spectral beams converge forward into a single blast at the target, then immediately return to disagreeing.

**Taking damage:** all seven figures recoil back away from the center, hoods tilt back briefly showing wider white-eye pinpoints, then close ranks again with hurried whispers.

**Evil victory:** for one glorious moment all seven agree — they align in tight formation facing outward, arms raised in synchronized victory, mist base swells outward triumphantly. Then they immediately start arguing again.

**Died (SLAY — "council dissolves, chamber becomes the idea's own council hall"):** the seven figures dismiss one by one, each fading into pale mist after briefly nodding in defeat. Order of dismissal: outermost first, innermost last. **Frame 9:** empty circular mist-base with just a faint outline of where the seven stood, and a single simple wooden council table having appeared in the center.

---

## SUPER BOSS 11 — The Stonecaller
*Mountain Elemental Warlord · Overwhelm · petrifies momentum, tasks feel like moving boulders*

### 1) Character prompt
```
[UNIVERSAL STYLE ANCHOR]

Massive humanoid giant made of stacked grey angular boulders with dark
mossy cracks between them. Boulder-head, boulder-shoulders, boulder-
fists that reach nearly to the ground. Small avalanche of new boulders
constantly falling onto the shoulders and back from above — the
figure is always straining under increasing load. Faint green moss
between joints. Two red-glowing eyes deep inside the boulder-head.
Chest has a hollow cavity where a mountain-warhorn is visible.

PALETTE: grey stone dominant, dark moss-green in cracks, small warm
brown dirt puffs when boulders land, glowing crimson eyes, dull brass
warhorn.
```

### 2) Animations
**Idle:** standing hunched under weight, occasional shudder as a new boulder falls onto the shoulder from above, brief dust-puff, warhorn glints in chest cavity.

**Attack (PETRIFY):** raises both boulder-fists overhead in a huge two-handed slam, brings them crashing down in front, ground shakes and rock chunks scatter forward. Warhorn briefly sounds a low grey wave that petrifies the space in front.

**Taking damage:** several boulders fall off body and shatter, whole figure shudders and hunches lower, moss cracks deepen, red eyes flicker.

**Evil victory:** stands TALLER than idle for the first time (defying the load), both boulder-fists thrust upward, more boulders rain down but now add to shoulders without weighing him down, warhorn sounds a triumphant blast.

**Died (SLAY — "mountain becomes the foundation the monument stands on"):** all boulders lose cohesion at once and cascade down. Moss withers to grey. Warhorn falls silent. Then the fallen boulders start ARRANGING themselves into a flat ordered stone platform — a foundation. **Frame 9:** neat rectangular stone platform of ordered slabs where the giant stood, with the warhorn lying atop it as a monument, no giant remaining.

---

## SUPER BOSS 12 — The Veilwalker
*Interdimensional Shadow Predator · Isolation and fear of irrelevance · makes idea invisible to others*

### 1) Character prompt
```
[UNIVERSAL STYLE ANCHOR]

Tall thin humanoid figure completely wrapped head-to-toe in dark
indigo cloth veils hanging like heavy stage curtains. No visible
face, hands, or feet — just draped fabric in the shape of a person.
Multiple veil layers hang loosely around the figure like theater
curtains, some floating gently as if partially in another dimension.
Occasionally the topmost veil parts revealing empty starless
darkness behind, then falls back. Silhouette is deliberately harder
to read than other bosses — it feels HIDDEN even when you're
looking at it.

PALETTE: dark indigo dominant, midnight blue shadow, single faint
silver highlight thread along veil edges, empty starless black
inside the veils.
```

### 2) Animations
**Idle:** standing very still, veils shift slowly in an unfelt wind, occasional slow parting of the topmost veil revealing empty darkness then closing.

**Attack (VEIL):** veils fling outward like a wing-spread revealing the empty starless darkness inside, from that darkness a wave of black tendrils shoots forward to shroud the target, then veils close and re-drape.

**Taking damage:** all veils flutter violently as if hit by wind from another dimension, several loose ends tear off and drift away, then veils re-settle heavier.

**Evil victory:** all veils lift and fan outward around the figure like a full theater curtain rise. The empty darkness inside GROWS LARGER and pulses. Then veils lower back slowly with dramatic weight.

**Died (SLAY — "veil becomes a banner visible across the shared world map"):** all veils lose their support and collapse toward the ground. As they fall, the largest veil UNFURLS into a bright banner-shape catching the light. The indigo brightens into a saturated purple-and-gold banner. **Frame 9:** clean bright banner unfurled on the ground where the figure stood, the empty darkness gone, gold thread edges gleaming, an idea now visibly claimed.

---

## Delivery gate per boss

Before merging into `public/assets/bosses/superpool/<slug>/`:

```bash
python3 -c "
from PIL import Image
import os
BOSS_DIR = 'public/assets/bosses/superpool/YOUR_BOSS'
CLIPS = ['idle.png','attack.png','hurt.png','victory.png','defeat.png']
for clip in CLIPS:
    p = os.path.join(BOSS_DIR, clip)
    assert os.path.exists(p), f'MISSING: {clip}'
    w, h = Image.open(p).size
    assert (w, h) == (828, 92), f'{clip}: got {w}x{h}, expected 828x92'
    print(f'OK: {clip}')
print('ALL 5 CLIPS PASS')"
```

Then preview at `/dev/bosses` before wiring into the super-boss randomizer.

---

## Priority order

The random assignment picks 1 of 12 per project run, so all 12 need coverage before the feature can ship. Recommended batch order (highest client impact first):

1. **Unraveller** (thematic hero — already assigned as Village super-boss in current builds — finish first)
2. **Pale Architect** (perfectionism boss — universally relatable)
3. **Ashen Drake** (visually striking + abandonment resonates in dev context)
4. **Mirror Witch** (best visual set-piece — mirrors reflect real player)
5-12. Remaining 8 in any order

Each boss = 5 clips × 9 frames = 45 individual frames. At PixelLab's animate-from-sprite throughput, budget ~15 min per boss = **3 focused hours total** for all 12.

---

## Related docs

- Source spec: `Ibhaveda_monsters_and_mechanics_reconciled.xlsx` — Boss Pool sheet
- Existing stage-mini-boss prompts: `docs/BOSS_GENERATION_PROMPTS.md` (28 monsters, includes older super-boss sketches — this new file supersedes those for the 12 super-bosses)
- Config target: `src/config/templates/venture.config.ts` — `SUPER_BOSS_POOL` array (12 entries already wired, waiting for art)
- Preview: `/dev/bosses` (gallery auto-adds new packs when installed under `public/assets/bosses/`)
