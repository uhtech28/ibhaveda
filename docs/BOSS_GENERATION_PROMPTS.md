# Ibhaveda — Boss Sprite Generation Prompts

Step-by-step generation prompts organized **one monster at a time**. For each boss: character generation prompt first, then 5 animation clip prompts (idle · attack · taking damage · victory · died).

Primary tool: **PixelLab.ai**. Fallback: any pixel-art image generator.

---

## Universal setup (read once, applies to every monster)

**Frame size:** 92×92 px per frame · **Sheet:** 828×92 px horizontal (9 frames left→right) · **Background:** transparent (alpha 0 outside the character silhouette)

**PixelLab settings:** Size 92×92 · Style "Retro RPG" or "Pixel Art Game" · Palette-lock ON

**Style anchor to prepend to every character prompt:**
```
STYLE: 92×92 pixel-art game-boss character sprite in the exact style of
Ibhaveda's Village bosses (Fog of Vagueness, Chimera, Automaton, Wraith).
Chunky 32-bit pixel art, hand-painted shading, warm rim-light from upper-
left, soft directional shadow to lower-right. Character centered, filling
~70% of the 92×92 canvas. Silhouette must be instantly recognizable at
small size. NO weapons in hand unless specified. NO text, HUD, or numbers.
BACKGROUND: fully transparent alpha 0 outside the silhouette — no ground
shadow, no scenery, no other characters.
```

**Universal animation-clip contract** (applies to every monster's 5 clips):

| Clip | Frames | fps | Loop? | Hold last? |
|---|---|---|---|---|
| idle | 9 | 7 | ∞ | — |
| attack | 9 | 8 | play once | no |
| taking damage | 9 | 8 | play once | no |
| victory (evil) | 9 | 8 | play once | no |
| died | 9 | 6 | play once | **YES** |

**Universal frame-by-frame direction for each clip type** — use these skeletons; only the boss-specific motion changes:

- **IDLE** — subtle breathing/hover loop. Frames 1 and 9 nearly identical. No foot movement, no limb leaving silhouette envelope. Reads as "alive but calm menace" from 3m away.
- **ATTACK** — full commit windup → strike → follow-through → recovery. Frames 5-6 are the impact moment (must sync with HP-tick). Real weight shift, not a wave.
- **TAKING DAMAGE** — recoil from invisible hit. Frame 1 = impact snap-back. Frames 2-3 = peak recoil. Frames 4-7 = catch balance. Frames 8-9 = near-idle return. Boss does NOT die here.
- **EVIL VICTORY** — plays when boss beats the player. Frames 1-2 raise arms/weapon triumphantly. Frames 3-4 peak menacing pose. Frames 5-6 hold with "shake of triumph". Frames 7-9 lower to near-idle. Smug/dominant, never friendly.
- **DIED** — lethal collapse. Frames 1-3 knees buckle. Frames 4-5 torso slump. Frames 6-7 begin dissolve/crumple. Frame 8 near-final. **Frame 9 = STABLE END POSE the game holds for 3+ seconds during cinematic** — must obviously read as ended, not mid-motion.

---

# ═══ SUPER-BOSSES (12-pool) ═══

## MONSTER 1 — The Unraveller
*Doubt and loss of direction · Village super-boss · currently only has idle*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Tall spectral humanoid in tattered dark purple hooded robes. No visible
face inside the deep hood — a swirl of dark purple cracks and torn
parchment fragments where the face should be. Long thin skeletal hands
with black smoky tips extending from the sleeves. Robe hem dissolves
into swirling dark-purple cracks and floating parchment shreds.
Sinister but sorrowful, not evil-cackling.

PALETTE: deep royal purple robe, muted lavender lining, black smoke
accents, faint white glow inside the hood, silvery parchment fragments.
```

### 2) Animations
**Idle:** floating slightly above ground, robe swaying, arms crossed over chest holding invisible torn paper, head tilted down as if reading something you can't see. Small purple crack-particles drift off the robe hem.

**Attack:** unfolds arms, extends both skeletal hands outward, dark purple cracks shoot forward from fingertips like a shockwave, then hands retract and re-cross. Strike frames 5-6 = crack-shockwave at full extension.

**Taking damage:** upper body snaps back, hood tilts up briefly revealing a flash of white glow inside, parchment fragments scatter outward, then robe re-settles and hood tilts back down.

**Evil victory:** slowly raises both arms overhead, robe billows dramatically, hood-cracks pulse brighter purple, hangs the pose for 2 frames as if reveling in doubt, then lowers arms.

**Died:** hood collapses inward as if the invisible occupant vanished, robe crumples to the ground in slow motion, parchment fragments scatter outward and fade. **Frame 9:** empty robe puddled on the floor with a single last parchment shred drifting away.

---

## MONSTER 2 — The Pale Architect
*Perfectionism and paralysis*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Skeletal humanoid in a stiff pale-grey draftsman's coat. Face hidden
behind large round white-lensed spectacles that reflect grey blueprint
grid lines. Both hands hold identical bone-white drafting compasses.
Chest and shoulders wrapped in unfurled blueprint scrolls that never
seem to reach a finished plan. Stiff, rigid, upright.

PALETTE: bone white, cool grey, faint architect-blue blueprint accents,
matte black spectacle frames.
```

### 2) Animations
**Idle:** standing rigidly upright, compasses held out at 90° measuring the air, head slowly ticks side to side like a broken pendulum.

**Attack:** slams both compasses together in front of chest — a burst of pale blueprint-blue lines radiates outward, then compasses snap back apart. Strike frames 5-6 = compass slam + burst at max.

**Taking damage:** head snaps back, spectacles briefly fall forward on chain-strap, blueprint scrolls scatter loose sheets, then head rights and spectacles return.

**Evil victory:** holds both compasses up in a "measure of perfection" pose, slowly rotates them in opposite directions, blueprint lines swirl behind the head like a halo.

**Died:** stiffens completely, then all blueprint scrolls unfurl and cascade down around the figure, spectacles fall off. **Frame 9:** figure collapsed under a pile of unfurled blueprints, single compass rolling to a stop nearby.

---

## MONSTER 3 — The Hollow King
*Loss of purpose*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Tall armored king in tarnished grey plate mail sat on an invisible
throne. Cracked gold crown tilted on his head. Chest cavity is EMPTY —
a black void where the heart should be with faint dust motes drifting
out. Long sword point-down on the ground in front, holding pommel
loosely with both hands. Face grey and drawn, eyes gone dim.

PALETTE: tarnished silver-grey armor, dulled gold crown, black void
in chest cavity, dust-mote grey particles.
```

### 2) Animations
**Idle:** shoulders slumped forward, weight resting on sword pommel, occasional slow deep sigh that makes dust drift out of the chest cavity.

**Attack:** raises the great sword slowly with one hand (surprisingly menacing given the fatigue), one big overhead cleave downward, sword strikes ground creating small dust ring, then returns to leaning pose. Strike frames 5-6 = sword impact + dust ring.

**Taking damage:** head snaps back, more dust pours from chest void as if the wound loosens him further, sword nearly falls but catches, staggers back one step then rights.

**Evil victory:** slowly stands taller than idle for the first time, raises sword overhead with both hands, crown briefly straightens on head, chest void pulses black for a moment — as if triumph briefly filled him.

**Died:** sword slips from hands and clatters, then king slumps forward off the invisible throne, crown falls off and rolls, entire figure crumples inward as chest void expands. **Frame 9:** empty pile of armor on the floor with the crown resting to one side, no body visible inside the plate.

---

## MONSTER 4 — The Thornwarden
*Bureaucracy and friction*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Hulking figure made of tangled brown thorny vine-brambles in a rough
humanoid shape. No clear head or face — a denser knot of thorns where
the head should be, with two small red-glowing eyes. Vines constantly
writhing, extending stamp-shaped and form-shaped thorny growths.
Chest hung with rusted iron chains and official-looking wax seals.

PALETTE: warm dark brown vines, rust-red thorns, glowing crimson eyes,
tarnished iron chain, wax-seal red.
```

### 2) Animations
**Idle:** planted like a wall, vines slowly writhing, occasional thorny growth extends outward then retracts, red eyes blink in unsynced rhythm, chains sway.

**Attack:** thorny vines shoot out from the torso like whipping tentacles toward the player, wrap and constrict, then snap back. Strike frames 5-6 = vines fully extended and constricting.

**Taking damage:** whole vine-body shudders, several vines snap and hang limp, chains rattle loose, red eyes flicker off then back on.

**Evil victory:** vines fan outward like a peacock display, chains rattle triumphantly, red eyes flash brighter, one thorny arm slams a giant wax-seal shape onto an invisible document with a satisfying finality.

**Died:** vines all shrivel inward and turn from brown to grey, chains fall clanking to the ground, red eyes wink out. **Frame 9:** shriveled grey vine-heap on the floor with rusted chains scattered around it.

---

## MONSTER 5 — The Mirror Witch
*Self-deception*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Tall slender feminine figure in flowing light-blue silk robes covered
in dozens of tiny triangular mirror shards. Face is a larger polished
silver mirror with no features — anyone looking sees a warped version
of themselves. Long silver hair ending in floating shard fragments.

PALETTE: light sky-blue silk, silver mirror shards, cool white
reflective highlights, pale platinum hair.
```

### 2) Animations
**Idle:** hovering slightly, robes swirling in unfelt wind, shard fragments circling in slow orbit, mirror-face tilts considering the player.

**Attack:** raises both hands, mirror shards from her robe detach and shoot forward like a hail of daggers, then new shards regenerate onto the robe. Strike frames 5-6 = shard hail at full extension.

**Taking damage:** mirror-face cracks with a spiderweb pattern, several shards fall from the robe and shatter, then the face-crack seals itself and shards regrow.

**Evil victory:** mirror-face pulses with a warped reflection of the player's own defeat, shards on the robe all catch light and flash in sequence, hair-shards spin faster in triumph.

**Died:** every shard on the robe cracks simultaneously, mirror-face shatters into a spider-web, then all shards fall away like broken glass. **Frame 9:** silver skeleton silhouette collapsed in a pile of broken mirror-shards, silk robe puddled beneath.

---

## MONSTER 6 — The Ashen Drake
*Abandonment and inertia*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Medium-sized four-legged dragon sitting on haunches. Scales the color
of cooled campfire ash — grey with faint dying-ember orange glowing
through cracks. Wings folded back and drooped. Small dying flames
flicker at nostrils and along spine ridge. Tail curled around itself.
Eyes half-closed, tired.

PALETTE: cooled-ash grey dominant, dying-ember orange in scale cracks,
small orange flame at nostrils, dark charcoal wing membranes.
```

### 2) Animations
**Idle:** sitting on haunches, chest rises and falls slowly, occasional small puff of smoke from nostrils, ember glow pulses dim to slightly brighter.

**Attack:** rears up, chest ember-glow flares bright orange, exhales a wide cone of orange flame forward, then settles back down onto haunches, coughing smoke. Strike frames 5-6 = flame breath at full extension.

**Taking damage:** whole body flinches, ember glow flickers as if losing heat, one wing sags further, small ash particles fall from scales.

**Evil victory:** rears up onto hind legs, wings unfurl fully for the first time revealing full orange fire-veins, roars silently (mouth open, small flame column shooting up), then folds back down slowly savoring the win.

**Died:** ember glow drains from all scales turning them uniform cold grey, wings collapse, head slumps to floor, tail unwinds. **Frame 9:** dragon body curled on the ground like ash sculpture, all glow gone, small pile of cold ash beside the head.

---

## MONSTER 7 — The Tide Caller
*Distraction and scope creep*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Robed figure in flowing deep-blue-and-green ocean-colored robes
patterned like waves. Arms raised in summoning gesture with water
rippling out from fingertips. Face hidden beneath a wide conch-shell
mask with barnacles. Base of the robes dissolves into small painterly
waves lapping outward.

PALETTE: deep ocean blue, sea green, white foam highlights, cream
conch-shell mask, coral pink barnacle accents.
```

### 2) Animations
**Idle:** arms slowly rise and lower in wave-summoning rhythm, ripples emanate from the base, mask tilts as if listening to the sea.

**Attack:** brings both arms sharply down, a large wave crest rises from the base and rolls forward, then arms rise back up and the wave dissipates. Strike frames 5-6 = wave crest at full forward extension.

**Taking damage:** the base-waves briefly still, arms drop halfway, mask tilts down as if the sea itself flinched, then rhythm resumes.

**Evil victory:** raises arms fully overhead, waves swell around the base into a full ring of foam, conch-mask emits silent wave-echo lines, robe billows outward like a filling sail.

**Died:** waves recede into the base and vanish, robes collapse inward, mask falls off. **Frame 9:** conch-mask lying face-up on wet flagstones with a small puddle spreading around it, no figure remaining.

---

## MONSTER 8 — The Gravemind
*Fear of failure*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Large rounded burial mound of dark green earth-and-turf with weathered
grey headstones jutting out at odd angles from the top and sides. A
single pale ghostly whisper-face made of green mist floats out from
between the headstones. Small dark green mist trails constantly curl
off the mound.

PALETTE: dark forest green mound, weathered grey stone, pale sickly-
green mist, small white ghost-face glow.
```

### 2) Animations
**Idle:** mound stationary; ghost-face weaves slowly between headstones, opening and closing its mouth whispering, mist trails intensify then fade.

**Attack:** ghost-face lunges forward out of the mound, mouth stretches into a scream, sends a wave of sickly-green mist rolling toward the player, then retreats back into the headstones. Strike frames 5-6 = mist wave at full forward extent.

**Taking damage:** ghost-face flinches back into the mound, several headstones crack, mist trails briefly stop.

**Evil victory:** three more ghost-faces rise from between the headstones and swirl around the mound in triumph, all whispering, mist trails intensify into a small tornado.

**Died:** all ghost-faces sink back into the mound, mist stops entirely, headstones topple one by one. **Frame 9:** flattened mound of earth with all headstones lying broken and toppled, no mist remaining.

---

## MONSTER 9 — The Rusted Oracle
*Imposter syndrome*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Mechanical brass-and-copper humanoid oracle statue seated cross-legged,
entire body covered in flaking rust and TV-static-pattern dither. Where
the face should be is a cracked crystal-ball orb showing scrambled
rust-orange static. One hand raised as if giving a proclamation but
the fingers glitch and flicker.

PALETTE: rust-orange dominant, tarnished brass and copper accents,
cracked-crystal blue-white ball, TV-static black-and-white dither patches.
```

### 2) Animations
**Idle:** sitting cross-legged, one hand raised in oracular gesture, static-orb face flickering, occasional small mechanical twitch of finger or elbow with a puff of rust dust.

**Attack:** static-orb face flashes bright, both hands shoot forward emitting a static-electricity crackle beam, rust dust bursts off shoulders from the recoil. Strike frames 5-6 = beam at full extension.

**Taking damage:** static-orb briefly clears to reveal a distressed brass mask underneath, then re-scrambles, rust flakes cascade off the body, one hand drops.

**Evil victory:** static-orb face displays a warped "PROPHECY FULFILLED" pattern (no actual text — just abstract triumph glyphs), both hands raise skyward, rust flakes drift upward instead of down defying gravity.

**Died:** static-orb cracks in half, all mechanical joints seize with a puff of steam, body rusts through visibly in seconds and crumbles inward. **Frame 9:** rust-heap on the floor in a rough cross-legged silhouette, cracked orb halves resting on top.

---

## MONSTER 10 — The Wraith Council
*Decision paralysis*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Five semi-transparent pale-violet robed spectral figures in a tight
council-huddle circle facing each other, each pointing in a different
direction with a skeletal hand. Faces hidden inside deep hoods except
for glowing white eyes. Reads as a single monster unit. Feet dissolve
into pale mist merging into one shared base.

PALETTE: pale violet robes, deeper indigo shadow, glowing white eye
pinpoints, cool grey skeletal hands, shared mist base.
```

### 2) Animations
**Idle:** the five figures rotate slowly around each other in a tight orbit as if arguing, pointing arms shift direction, no consensus reached.

**Attack:** all five figures suddenly point at the player in unison, five violet spectral beams converge forward into a single blast, then they resume disagreeing. Strike frames 5-6 = beam convergence at full extension.

**Taking damage:** all five figures recoil back away from the center, hoods tilt back briefly showing wider white-eye pinpoints, then they close ranks again.

**Evil victory:** for once, all five figures agree — they align in a tight formation facing outward, arms raised in synchronized victory, mist base swells outward triumphantly.

**Died:** the five figures collapse inward into each other, robes tangle into a single knot, all white-eye pinpoints wink out one by one. **Frame 9:** small pile of tangled violet robes on the floor with faint mist still curling off it.

---

## MONSTER 11 — The Stonecaller
*Overwhelm*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Massive humanoid giant made of stacked grey angular boulders with dark
mossy cracks between them. Boulder-head, boulder-shoulders, boulder-
fists. Small avalanche of new boulders constantly falling onto its
shoulders and back from above. Body posture strained under the load.
Faint green moss between joints.

PALETTE: grey stone dominant, dark moss-green in cracks, small warm
brown dirt puffs when boulders land.
```

### 2) Animations
**Idle:** standing hunched under the weight, occasional shudder as a new boulder falls onto the shoulder from above, brief dust-puff.

**Attack:** raises both boulder-fists overhead in a huge two-handed slam, brings them crashing down in front, ground shakes and rock chunks scatter forward. Strike frames 5-6 = fists impact ground + chunks flying.

**Taking damage:** several boulders fall off the body and shatter on the ground, whole figure shudders and hunches lower, moss cracks deepen.

**Evil victory:** stands taller than idle for the first time, both boulder-fists thrust upward, more boulders rain down but this time they add to the shoulders without weighing him down.

**Died:** all boulders lose cohesion at once and cascade down, moss withers to grey. **Frame 9:** giant pile of unstacked boulders on the ground with no figure remaining, a small cloud of dust settling.

---

## MONSTER 12 — The Veilwalker
*Isolation and fear of irrelevance*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Tall thin humanoid completely wrapped head-to-toe in dark indigo cloth
veils hanging like a heavy stage curtain. No visible face, hands, or
feet — just draped fabric in the shape of a person. Multiple veil
layers hang loosely, some floating gently. Occasionally the topmost
veil parts to reveal a glimpse of empty darkness behind, then falls back.

PALETTE: dark indigo dominant, midnight blue shadow, single faint
silver highlight thread along veil edges.
```

### 2) Animations
**Idle:** standing very still, veils shift slowly in unfelt wind, occasional slow parting of the topmost veil revealing empty darkness then closing.

**Attack:** veils fling outward like a wing-spread, from the empty darkness inside a wave of black tendrils shoots forward, then veils close and re-drape. Strike frames 5-6 = tendrils at full extension.

**Taking damage:** all veils flutter violently as if hit by wind, several loose ends tear off and drift away, then veils re-settle.

**Evil victory:** all veils lift and fan outward around the figure like a full theater curtain rise, the empty darkness inside grows larger and pulses, veils lower back slowly with dramatic weight.

**Died:** all veils lose their support and collapse, drifting to the floor like dropped stage curtains. **Frame 9:** heap of indigo cloth puddled on the floor with a single silver-edge veil-strip drifting away in the wind.

---

# ═══ STAGE MINI-BOSSES ═══

## MONSTER 13 — Forest Colossus
*Stage 2 · Research · perfectionism-that-keeps-growing*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Massive humanoid tree-giant, trunk-body covered in bark, arms made of
thick gnarled branches with hanging moss. Face is a carved knothole
with two glowing green eye-pinpoints. Crown of layered leaves in
autumn oranges. Small mushrooms sprouting along shoulders and elbows.

PALETTE: dark brown bark, autumn-orange canopy, moss green, glowing
green eyes.
```

### 2) Animations
**Idle:** standing tall, chest rises with slow breathing, small falling-leaf particles drift off shoulders.

**Attack:** rears back one huge branch-arm, swings it forward in a wide horizontal sweep, leaves and small twigs scatter, then arm retracts.

**Taking damage:** whole trunk shudders, several branches crack and hang lower, leaves rain down, glowing green eyes flicker.

**Evil victory:** rises fuller, canopy expands wider with fresh growth bursting outward, both branch-arms thrust to the sky raining leaves down victoriously.

**Died:** trunk splits vertically down the middle, canopy topples backward, all leaves fall at once. **Frame 9:** cracked hollow trunk fallen on its side with a pile of dead orange leaves around it.

---

## MONSTER 14 — Forest Sorceress
*Stage 2 · endless iteration*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Slender feminine figure in tattered moss-green witch's cloak, wide-
brimmed pointed hat with hanging vines. Face partially obscured by
hat brim, revealing only glowing yellow eyes. Holds a tall gnarled
wooden staff topped with a floating orb of drifting green fireflies.

PALETTE: forest green cloak, dark brown staff, warm firefly-yellow
orb glow.
```

### 2) Animations
**Idle:** staff held vertically in front, free hand traces small mystical patterns in the air, fireflies orbit slowly around her.

**Attack:** raises staff overhead, orb-fireflies shoot forward as a swarm-projectile, then fireflies regenerate around the orb.

**Taking damage:** hat tips forward briefly hiding the yellow eyes, staff wavers, several fireflies fall dead to the ground, then eyes re-emerge and staff steadies.

**Evil victory:** raises staff and free hand overhead, fireflies swarm dramatically upward in a cyclone, hat brim tilts back revealing a full sinister glowing-yellow face for one triumphant frame.

**Died:** staff falls from her hand, all fireflies wink out at once, cloak crumples inward. **Frame 9:** empty cloak and hat piled on the ground with the staff lying across them, no fireflies remaining.

---

## MONSTER 15 — Forest Wraith (Pathwarden variant)
*Stage 2 · almost-ready ghost*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Semi-transparent ghostly figure of a lost traveler in tattered
wanderer's cloak and hood, faint silver body under torn robes. Holds
a broken wooden walking staff. Face is a pale sad glowing mask. Feet
don't touch the ground — dissolves into wisps below the knees.

PALETTE: pale silver-white body, tattered moss-grey cloak, faint
blue-green ghost aura.
```

### 2) Animations
**Idle:** floating slightly above ground, cloak billows in unfelt wind, staff held loosely, mask-face turns slowly side to side searching.

**Attack:** raises broken staff overhead, points it forward, a ghostly blue-green shockwave shoots out from the staff-tip, then arm lowers.

**Taking damage:** ghost-body flickers between visible and semi-transparent, mask cracks briefly, cloak billows chaotically then settles.

**Evil victory:** floats higher above ground, cloak spreads wide like a phantom cape, mask brightens and mouth-slit opens wider in silent triumph, staff points skyward.

**Died:** ghost-body fades from bottom up, mask flickers three times then goes dark, cloak falls to the ground with no body inside. **Frame 9:** empty cloak crumpled on the floor with the broken staff and a still-glowing pale mask resting on top.

---

## MONSTER 16 — Shadow Specter (Second-Guessing)
*Stage 2 · undead/plant*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Small crouching hunched shadow-figure made of pitch black smoke with
two floating white eye-pinpoints. Torn raggy black cloak edges dissolve
into smoke. Two long thin shadow-arms with clawed fingers. Constantly
whispering (indicated by faint grey speech-wisps rising from where the
mouth would be).

PALETTE: deep black smoke body, faint dark purple shadow highlights,
white eye pinpoints, grey whisper-wisps.
```

### 2) Animations
**Idle:** crouched low, arms wrapped around own knees, rocking slightly, whispering non-stop with wisps rising.

**Attack:** lunges upward from the crouch, both clawed shadow-arms shoot forward in a slashing X-pattern, then re-crouches.

**Taking damage:** flattens closer to the ground, wisps briefly stop, white eyes squeeze narrow, then re-inflates.

**Evil victory:** stretches upward from the crouch to nearly twice its idle height, both shadow-arms spread wide, wisps intensify into a full whisper-cloud around the head, white eyes glow brighter.

**Died:** collapses inward, wisps dissipate, eye-pinpoints wink out. **Frame 9:** small puddle of black smoke on the floor slowly evaporating, no figure remaining.

---

## MONSTER 17 — Thornbearer Champion
*Stage 2 · plant knight*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Armored knight whose armor is made entirely of interwoven brown thorny
vines shaped into plate, gauntlets, helm. Helmet has two large curved
thorn-horns. Holds a wicked sword whose blade is a single long dark
thorn. Small red rose blossoms sprout at random joints.

PALETTE: warm brown thorn-armor, deep red rose blossoms, dark green
under-cloak at joints.
```

### 2) Animations
**Idle:** standing at attention, sword point-down in front, both gauntleted hands rest on the pommel, occasional thorn twitch, roses bloom slightly then close.

**Attack:** lifts sword overhead, cleaves down in a vertical slash, thorns extend along the blade at impact, then raises sword back to guard.

**Taking damage:** takes a step back, several thorn-armor plates rattle loose and fall, rose blossoms wilt briefly, helmet tilts.

**Evil victory:** raises sword high overhead, all rose blossoms bloom fully in triumph, thorn-horns on the helmet extend longer, thorn-armor bristles outward.

**Died:** sword falls from hands and clatters, thorn-armor withers turning grey, roses die and drop, figure crumples. **Frame 9:** pile of grey withered thorn-armor pieces on the ground with the thorn-sword lying broken across them.

---

## MONSTER 18 — Advocate of Comfortable Lies
*Stage 3 · Arena · slick barrister*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Slick barrister figure in a crimson high-collared judge's robe with
gold trim, tall powdered white wig, gold monocle over one eye. Holds
a golden gavel in one hand and a rolled scroll of "evidence" in the
other. Smug and polished, not obviously monstrous — the horror is that
he looks respectable.

PALETTE: crimson red robe, gold trim, powdered-white wig, ivory skin
tone.
```

### 2) Animations
**Idle:** standing straight, gavel resting on shoulder, scroll held out as if presenting evidence, occasional smirk twitch.

**Attack:** brings the gavel down in a sharp overhead strike, a golden shockwave ripples out from the impact, then raises gavel back to shoulder.

**Taking damage:** wig slips forward over the monocle, scroll drops open spilling papers, one step back stagger, then wig re-seats and scroll re-rolls.

**Evil victory:** slams gavel down repeatedly with a triumphant grin, scroll unfurls dramatically overhead showing meaningless glyphs of "PROOF", monocle flashes gold.

**Died:** gavel falls, wig slides completely off revealing a bald cracked mannequin head, scroll bursts open showing blank paper, whole figure sags. **Frame 9:** collapsed crimson robe with the bald cracked head lolling to one side and the gavel + blank scroll strewn on the floor.

---

## MONSTER 19 — Judge of False Precedent
*Stage 3 · Arena · heavier magistrate*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Heavier magistrate figure in a long midnight-black robe with gold
chain of office, tall black cap, face heavily lined and stern. Holds
a massive iron-bound tome under one arm, quill in the other hand.

PALETTE: midnight-black robe, gold chain accents, cream book pages,
matte-black cap.
```

### 2) Animations
**Idle:** standing rigidly, tome open in front, quill taps the page rhythmically.

**Attack:** slams the tome closed and thrusts it forward like a shield-bash, pages fly out and swirl toward the player, then reopens the book.

**Taking damage:** tome drops open at his feet, quill snaps in his hand, cap tilts, gold chain rattles.

**Evil victory:** slams tome open dramatically, quill enters the page and inscribes glowing gold judgment-glyphs in the air, chain lifts as if by unseen wind.

**Died:** tome falls closed with finality, quill drops, robe crumples with the chain pooling on top. **Frame 9:** closed iron-bound tome lying on the floor with the black cap resting on top and the chain coiled beside it.

---

## MONSTER 20 — Herald of Public Opinion
*Stage 3 · Arena · brass trumpet mask-of-many-faces*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Trumpet-blowing herald in red-and-gold tabard, holds a massive brass
trumpet to lips. Head completely covered by an over-sized golden face-
mask shaped like a crowd of murmuring faces.

PALETTE: brass trumpet, red tabard, gold face-mask with many faces,
cream tights.
```

### 2) Animations
**Idle:** trumpet raised to lips, cheeks-of-many-faces puffed as if about to blow, mask-faces subtly murmuring.

**Attack:** blows a full trumpet blast, mask-faces all open mouths in sync, a wave of golden sound-lines rolls forward, then trumpet lowers slightly.

**Taking damage:** trumpet drops away from lips, mask-faces briefly freeze in shock, tabard billows out, then trumpet returns.

**Evil victory:** raises trumpet overhead one-handed, mask-faces all cheer in unison, gold sound-lines swirl upward like a fireworks pattern.

**Died:** trumpet clangs to the floor, mask-faces all fall silent with mouths open in surprise, whole figure sags. **Frame 9:** brass trumpet lying on the ground with the gold mask beside it, red tabard puddled below.

---

## MONSTER 21 — Masked Challenger
*Stage 3 · Arena · dual-sword gladiator*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Lean gladiator in dark leather harness and pants, bare-chested, face
covered by a blank white mask with only two slits for eyes. Twin
curved short swords crossed in front.

PALETTE: tanned leather brown, dark oiled skin, matte-white blank mask,
silver blade edges.
```

### 2) Animations
**Idle:** crouched slightly in fighting stance, both swords held low and crossed, subtle sway.

**Attack:** launches into an X-slash — both swords swing outward and cross forward in an X-pattern in front, then return to guard.

**Taking damage:** takes a step back, one sword drops slightly, mask tilts, then recovers stance.

**Evil victory:** raises both swords overhead crossing at the tips, mask tilts back showing only the two eye-slits burning bright, chest puffs out, weight shifts to a triumphant hero-pose.

**Died:** both swords fall from hands and clatter, mask cracks down the middle, body drops to knees then falls forward. **Frame 9:** figure face-down on the ground with the two curved swords crossed above the cracked mask on his back.

---

## MONSTER 22 — Oracle of Doubt
*Stage 3 · Arena · blindfolded three-eyed seer*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Blindfolded seer in flowing violet robes, long white hair, blindfold
covers eyes but three glowing purple third-eyes hover in a triangle
above the head. Fingertips glow faint violet.

PALETTE: deep violet robes, white hair, glowing lavender third-eyes,
gold blindfold trim.
```

### 2) Animations
**Idle:** standing serenely, arms outstretched palms-up, three third-eyes pulse gently in and out of sync with each other.

**Attack:** brings palms forward, all three third-eyes flash bright and shoot converging violet beams forward that meet at a point in front of the player, then eyes return to gentle pulse.

**Taking damage:** all three third-eyes squeeze shut, blindfold slips slightly, hair whips backward, then eyes reopen dimmer.

**Evil victory:** all three third-eyes flash simultaneously bright white, blindfold falls away revealing normal closed eyes underneath, arms rise overhead as a fourth larger third-eye briefly opens on the forehead.

**Died:** third-eyes wink out one by one, blindfold falls off, hair goes limp, body crumples forward. **Frame 9:** violet robe puddled on the floor with white hair fanned out and the empty blindfold resting on top.

---

## MONSTER 23 — Unfinished Golem
*Stage 4 · Artisan's Quarter · half-built stone giant*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Massive stone-and-timber humanoid half-built — right arm is a completed
granite fist, left arm is scaffolded wooden frames not yet filled in.
Chest cavity has visible half-carved runes. Head is a rough-chiselled
stone block with two glowing amber slit-eyes. Wooden scaffolding
pieces still cling to its back.

PALETTE: warm sandstone body, dark timber scaffolding, glowing amber
eyes, deep-etched rune black.
```

### 2) Animations
**Idle:** standing hunched, completed arm swings slowly, scaffold arm creaks, chest runes pulse dim to bright.

**Attack:** raises the granite fist and slams it down in an overhead pound, scaffold arm swings for counterbalance, chest runes flash bright at impact.

**Taking damage:** scaffold pieces on the back rattle loose and fall, chest runes flicker off then back on dimmer, granite fist drops to side.

**Evil victory:** raises the granite fist high, chest runes all light up simultaneously in gold, scaffold arm briefly fills in with phantom stone as if the golem is about to become complete.

**Died:** granite fist falls off shattering, scaffold pieces all break away, chest runes go dark, head-block tumbles from the shoulders. **Frame 9:** collapsed pile of sandstone chunks with wooden scaffold pieces on top and the head-block lying to one side, amber eyes gone dark.

---

## MONSTER 24 — Armor Golem
*Stage 4 · full-plate empty armor*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Full-plate suit of heavy silver-and-blue armor animated by no visible
occupant — helmet visor slit shows only faint blue glow inside. Holds
a massive kite shield and heavy mace.

PALETTE: polished silver plate, blue-steel edge highlights, faint
inner-glow cyan, brass rivets.
```

### 2) Animations
**Idle:** standing at attention, shield planted forward, mace resting on shoulder.

**Attack:** shield-bashes forward with the kite shield, then follows with an overhead mace swing, returns to guard.

**Taking damage:** helmet tilts back, one shoulder pauldron rattles loose and drops, blue inner-glow flickers off then back on.

**Evil victory:** raises the mace overhead and slams it repeatedly onto the shield edge like a drumbeat of triumph, blue inner-glow flares brighter with each hit.

**Died:** shield falls forward, mace drops, then the whole suit of armor collapses piece by piece — pauldrons, breastplate, gauntlets, helmet. **Frame 9:** disassembled pile of silver plate pieces on the floor with the empty helmet on top, blue glow gone.

---

## MONSTER 25 — Artisan Automaton
*Stage 4 · brass clockwork with many tool-arms*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Brass-and-copper clockwork humanoid, visible gears turning through
cutaway chest panel, wide-brimmed artisan's hat pinned with tiny
finished-project trophies. Multiple extra tool-arms (screwdriver,
hammer, calipers) extending from the back.

PALETTE: brass and copper dominant, teal-oxidized joints, warm
mahogany hat, glowing amber pilot-light chest.
```

### 2) Animations
**Idle:** standing centered, tool-arms swing in and out of frame in a rhythmic assembly-line motion, chest gears turn.

**Attack:** all tool-arms shoot forward simultaneously in a coordinated multi-strike (hammer, screwdriver, calipers), then retract into the back.

**Taking damage:** several gears in the chest panel jam and grind, tool-arms flail chaotically, hat tips forward, then rhythm resumes.

**Evil victory:** all tool-arms extend fully and spread outward like a peacock's tail, chest pilot-light glows brighter, hat's trophy-pins jingle in triumph.

**Died:** all gears seize with a screech and puff of steam, tool-arms drop limp, chest pilot-light fades, hat falls off. **Frame 9:** slumped clockwork body on the floor with tool-arms sprawled outward and the mahogany hat lying beside it, all glow gone.

---

## MONSTER 26 — Forge Dragon
*Stage 4 · black iron scales with a burning forge chest*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Small stocky four-legged dragon of black iron-scale hide, chest cavity
is a visible burning forge with orange flames roaring out through iron
gate-bars. Small horns like anvil tips. Mouth open showing tiny forge-
flames inside.

PALETTE: black iron scales, bright forge-orange chest flame, warm
soot-grey underbelly.
```

### 2) Animations
**Idle:** sitting on haunches, chest-forge glowing pulse, occasional puff of orange flame from mouth.

**Attack:** rears up and unleashes a wide cone of forge-flame from the mouth, chest-gate opens wider to feed the breath, then settles back.

**Taking damage:** flame in the chest-forge briefly dims to embers, one wing drops, small orange sparks scatter from the scales.

**Evil victory:** chest-forge gate flings open fully revealing a huge blast of orange flame within, rears onto hind legs, breathes a triumphant column of fire straight upward.

**Died:** chest-forge fire goes out with a hiss of steam, iron scales dull to grey, body collapses onto its side, wings splay. **Frame 9:** cold dragon body lying on the side with the chest-gate hanging open showing a dark empty forge inside, small pile of cool ash spilling out.

---

## MONSTER 27 — Spectral King
*Stage 4 · ghostly fallen artisan-king*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Tall ghostly figure of a fallen artisan-king in translucent pale-blue
royal robes, crowned with a smith's crown of intertwined tools instead
of jewels, holds a spectral hammer loosely in one hand. Feet dissolve
into blue mist. Face is a sad noble bearded ghost.

PALETTE: pale spectral blue, ghostly white robe highlights, gold
crown-of-tools, misty base.
```

### 2) Animations
**Idle:** floating slightly above ground, robes drift, hammer swings slow and idle, beard drifts in unfelt wind.

**Attack:** raises the spectral hammer overhead and swings it down with sudden weight, a shockwave of blue mist rolls forward, then hammer returns to loose grip.

**Taking damage:** ghost-body flickers, crown slips to one side, hammer nearly falls, mist-base briefly stills.

**Evil victory:** floats higher, robes spread like a full king's mantle, hammer raised overhead in a triumphant royal pose, crown-tools glow gold.

**Died:** ghost-body fades from feet upward, crown falls first, hammer drops through the disappearing hand, mist evaporates. **Frame 9:** gold crown-of-tools resting on the floor with the spectral hammer beside it, no body remaining.

---

## MONSTER 28 — Undead Titan
*Stage 4 · massive skeleton with great-sword*

### 1) Character generation prompt
```
[UNIVERSAL STYLE ANCHOR]

Massive skeletal humanoid twice the height of a normal person, bones
weathered ivory-yellow, empty eye sockets glow faint green. Wrapped
in tattered burial shrouds around the hips. Holds a rusted iron great-
sword point-down.

PALETTE: yellowed bone-ivory, tattered grey shroud, glowing sickly-
green eye sockets, rust-red great-sword.
```

### 2) Animations
**Idle:** standing hunched, great-sword point-planted in front, both bone-hands rest on the pommel, slow chest rise-and-fall.

**Attack:** lifts great-sword with both hands, swings it in a huge horizontal sweep, then plants point back down.

**Taking damage:** skull snaps back, several rib bones crack and hang loose, green eye-sockets flicker, one hand slips from the pommel.

**Evil victory:** raises great-sword overhead with both bone-hands, skull tilts back with jaw wide in silent triumphant scream, shroud billows outward, green eye-glow brightens.

**Died:** great-sword falls first, then the whole skeleton collapses into a pile of disarticulated bones, skull rolling to a stop. **Frame 9:** pile of scattered ivory bones on the ground with the rusted great-sword lying across and the skull tilted to one side, green glow gone.

---

## Delivery gate (per monster)

Before merging into `public/assets/bosses/<slot>/<boss-id>/`:

```bash
python3 -c "
from PIL import Image
import os
BOSS_DIR = 'public/assets/bosses/incoming/YOUR_BOSS'
for clip in ['idle.png','attack.png','hurt.png','defeat.png','victory.png']:
    p = os.path.join(BOSS_DIR, clip)
    assert os.path.exists(p), f'MISSING: {clip}'
    w, h = Image.open(p).size
    assert (w, h) == (828, 92), f'{clip}: got {w}x{h}, expected 828x92 (9 frames of 92x92)'
    print(f'OK: {clip}')
print('ALL 5 CLIPS PASS')"
```

Then preview at `/dev/bosses` before wiring into `stage-bosses.ts`.

---

## Priority order

1. **Monster 1 (Unraveller)** — finish the 5 clips (idle exists, needs 4 more)
2. **Monster 18 (Advocate)** — currently idle only, needs 5 clips
3. **Monsters 2-12** — 11 super-bosses × 5 clips = 55 sheets
4. **Monsters 13-17** (Forest) — 5 × 5 = 25 sheets
5. **Monsters 19-22** (Arena) — 4 × 5 = 20 sheets
6. **Monsters 23-28** (Artisan) — 6 × 5 = 30 sheets

Total to full coverage: **~135 sheets**. Batch on PixelLab over 2-3 focused weeks.
