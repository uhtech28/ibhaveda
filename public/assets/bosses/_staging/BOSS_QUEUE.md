# Boss Art Delivery Queue

Running catalog. **Do NOT wire into code** until user explicitly says "implement".

## Delivery 1 — Pool #1: The Unraveller
- **Slot:** Pool boss #1 (spec: "Ancient Void Serpent — pulls threads from reality")
- **Directions delivered:** 4-directional sprite sheet (thumbnail shows 2×2 grid of purple serpent poses)
- **Notes from user:** "these are for all 4 directions so use professionally"
- **Staged files:** `public/assets/bosses/_staging/unraveller/unraveller_delivery_[1..3].png`
- **Status:** SAVED, awaiting further deliveries + user confirmation before wiring
- **Wiring plan on "implement":**
  - Move to `public/assets/bosses/pool/unraveller/` (or `village/unraveller/` if user prefers to keep the venture-stage-1 path)
  - Split into 4 direction frames (N/S/E/W) — need to know layout order once user confirms
  - Extend `SUPER_BOSS_POOL` entry in `src/config/templates/venture.config.ts` with `attackClip/hurtClip/defeatClip/victoryClip` + directional idle fields
  - Update `village-bosses.ts` STAGE_1 super entry to use directional sheets instead of single `unraveller/idle.png`

---

## Delivery 2 — Pool #2: The Pale Architect
- **Slot:** Pool boss #2 (spec: "Undead Perfectionist Titan — freezes progress in amber")
- **Directions/frames delivered:** thumbnail shows armored figure in orange/rust armor with shoulder spikes and weapon on back
- **Staged files:** `public/assets/bosses/_staging/pale-architect/pale_architect_delivery_[1..3].png`
- **Status:** SAVED, awaiting wiring
- **Wiring plan on "implement":**
  - Move to `public/assets/bosses/pool/pale-architect/`
  - Add clip fields to `SUPER_BOSS_POOL` entry `super_pale_architect` in `venture.config.ts` (currently `idleAsset` only)
  - The Pale Architect currently has NO art at all in repo — this fills a spec gap

---

## Delivery 3 — Pool #3: The Hollow King
- **Slot:** Pool boss #3 (spec: "Spectral Sovereign — drains meaning, greyscales world")
- **Directions/frames delivered:** thumbnail shows crowned skeletal/spectral king seated on throne holding staff
- **Staged files:** `public/assets/bosses/_staging/hollow-king/hollow_king_delivery_[1..3].png`
- **Status:** SAVED, awaiting wiring
- **Wiring plan on "implement":**
  - Move to `public/assets/bosses/pool/hollow-king/`
  - Add clip fields to `SUPER_BOSS_POOL` entry `super_hollow_king` in `venture.config.ts` (currently no `idleAsset` at all)
  - Fills a spec gap (Hollow King previously had zero art)

---

## Delivery 4 — Pool #4: The Thornwarden
- **Slot:** Pool boss #4 (spec: "Ancient Forest Colossus — overgrows paths with thorns; represents bureaucracy and friction")
- **Directions/frames delivered:** thumbnail shows large brown/bronze creature with thorny/spiked overgrowth
- **Staged files:** `public/assets/bosses/_staging/thornwarden/thornwarden_delivery_[1..3].png` (sandbox-placeholder bytes)
- **Status:** SAVED, awaiting wiring
- **Wiring plan on "implement":**
  - Move to `public/assets/bosses/pool/thornwarden/`
  - Add clip fields to `SUPER_BOSS_POOL` entry `super_thornwarden` in `venture.config.ts` (currently no `idleAsset`)
  - Fills a spec gap (Thornwarden previously had zero art)

---

## Delivery 5 — Pool #5: The Mirror Witch
- **Slot:** Pool boss #5 (spec: "Illusionist Sorceress — replaces real progress with reflections; represents self-deception")
- **Directions/frames delivered:** thumbnail shows robed sorceress figure with mirror/water shard motifs around her
- **Staged files:** `public/assets/bosses/_staging/mirror-witch/mirror_witch_delivery_[1..3].png` (sandbox-placeholder bytes)
- **Status:** SAVED, awaiting wiring
- **Wiring plan on "implement":**
  - Move to `public/assets/bosses/pool/mirror-witch/`
  - Add clip fields to `SUPER_BOSS_POOL` entry `super_mirror_witch` in `venture.config.ts` (currently no `idleAsset`)
  - Fills a spec gap (Mirror Witch previously had zero art)

---

## Delivery 6 — Pool #6: The Ashen Drake
- **Slot:** Pool boss #6 (spec: "represents Abandonment and inertia")
- **Directions/frames delivered:** thumbnail shows winged black/red dragon creature, wings spread
- **Staged files:** `public/assets/bosses/_staging/ashen-drake/ashen_drake_delivery_[1..3].png` (sandbox-placeholder bytes)
- **Status:** SAVED, awaiting wiring
- **Wiring plan on "implement":**
  - Move to `public/assets/bosses/pool/ashen-drake/`
  - Add clip fields to `SUPER_BOSS_POOL` entry `super_ashen_drake` in `venture.config.ts` (currently no `idleAsset`)
  - Fills a spec gap (Ashen Drake previously had zero art)

---

## Delivery 7 — Pool #11: The Stonecaller  ★ REAL FILES ★
- **Slot:** Pool boss #11 (spec: "represents Overwhelm")
- **Source zip:** `uploads/idle_stonecaller.zip` (Pixellab export v3.1, template `mannequin`, view `low top-down`, 8-direction)
- **Delivered:** 8 idle rotations, 256×256 PNG each
- **Staged files (real bytes):**
  - `public/assets/bosses/_staging/stonecaller/Idle/rotations/north.png`
  - `north-east.png`
  - `east.png`
  - `south-east.png`
  - `south.png`
  - `south-west.png`
  - `west.png`
  - `north-west.png`
  - `metadata.json` (Pixellab manifest — kept alongside for reference)
- **Overwrites repo?** Repo already has `public/assets/bosses/super-pool/stonecaller/{idle,attack,victory}.png` (single-facing sheets, 3 clips). New delivery is **idle-only but 8-directional at 256×256** — richer for the "moving" boss walk feel, poorer for combat state clips.
- **Status:** SAVED, awaiting wiring
- **Wiring plan on "implement":**
  - Move Idle/rotations/*.png → `public/assets/bosses/super-pool/stonecaller/rotations/` (keeps existing idle/attack/victory sheets intact)
  - Extend `SUPER_BOSS_POOL` `super_stonecaller` entry with directional idle asset paths (need a new `rotations` field on `SuperBoss` type)
  - Preserve existing `attack.png`/`victory.png` for combat state machine

---

## Delivery 8 — Pool #12: The Veilwalker  ★ REAL FILES (2 zips consolidated) ★
- **Slot:** Pool boss #12 (spec: "represents Distraction and drift" — "cloth veils hanging like a stage curtain")
- **Source zips:**
  - `uploads/the_veilwalker.zip` — full Idle pack (rotations + 3 animation sequences)
  - `uploads/v_eilwalker_hurt.zip` — hurt-state 8-direction rotations
- **Delivered content (staged, real bytes):**
  - `Idle/rotations/*.png` — 8 dirs at 256×256 (N/NE/E/SE/S/SW/W/NW)
  - `Idle/animations/Breathing_Idle/south/frame_000..003.png` — 4-frame idle loop
  - `Idle/animations/The_cloaked_figure_lunges_forward_slightly_raising/south/frame_000..008.png` — 9-frame ATTACK
  - `Idle/animations/The_hooded_figure_slowly_slumps_forward_its_postur/south/frame_000..008.png` — 9-frame HURT/DEFEAT sequence
  - `Hurt/rotations/*.png` — 8 dirs at 256×256 (from separate zip, hurt state)
  - `metadata_idle.json`, `metadata_hurt.json`
- **Total files staged:** 38 PNG + 2 JSON
- **Overwrites repo?** Repo already has `super-pool/veilwalker/{idle,attack,defeat}.png` as single-facing sheets. New delivery is **much richer** — 8-dir rotations + per-state animation frame sequences (south only) at 256×256.
- **Status:** SAVED, awaiting wiring
- **Wiring plan on "implement":**
  - Move to `public/assets/bosses/super-pool/veilwalker/rotations/{idle,hurt}/*` + `super-pool/veilwalker/anims/{breathing,attack,slump}/*`
  - Extend `SuperBoss` type with `rotations` (per-state 8-dir) and `frameSequences` (per-anim south frames)
  - Existing single-facing sheets can be replaced by the south rotation once wired
  - Prompt from metadata is prime taunt copy — grab for `midFightTaunts`

---

## ~~Pool #7 — The Tide Caller~~ (SKIP: already in repo)
- **Repo status:** Full 5-clip sheet already at `public/assets/bosses/super-pool/tide-caller/{idle,attack,hurt,defeat,victory}.png`
- User confirmed "tide caller is already there" — no new delivery needed
- **On "implement" pass:** just wire clip fields into `SUPER_BOSS_POOL.super_tide_caller` entry (currently `idleAsset` only)

---

## Delivery 9 — <pending>

---

## Sandbox note

The mount is returning the same 3 PNG files for every delivery. When you say "implement", drop the actual boss art into a known folder (e.g. `public/assets/bosses/_incoming/<boss-name>/`) and I'll pick them up from there — the staged files above are placeholders that catalog the DELIVERY, not necessarily the real bytes.

