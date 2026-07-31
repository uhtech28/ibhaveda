# Persona asset drop guide

Every persona in `src/config/personas.ts` expects three files here:

```
public/assets/personas/<persona-id>/
├── idle.png       ← horizontal spritesheet (4 frames × 32×48 default)
├── walk.png       ← horizontal spritesheet (6 frames × 32×48 default)
└── portrait.png   ← square portrait (96×96 recommended)
```

## Slots

The 8 shipped personas — folder names match the `PersonaId` union:

| Folder id     | Display name |
|---------------|--------------|
| `arcanist`    | Arcanist     |
| `alchemist`   | Alchemist    |
| `artisan`     | Artisan      |
| `drifter`     | Drifter      |
| `engineer`    | Engineer     |
| `healer`      | Healer       |
| `oracle`      | Oracle       |
| `pathfinder`  | Pathfinder   |

## Frame layout

Default sprite config (in `src/config/personas.ts`):

- **Frame width / height:** 32×48 px
- **Idle strip:** 4 frames laid out horizontally → sheet is 128×48
- **Walk strip:** 6 frames laid out horizontally → sheet is 192×48
- **Idle FPS:** 4
- **Walk FPS:** 8

If a PixelLab export uses different frame counts or dimensions, override
the `sprite` field on that persona's entry in `personas.ts`.

## Portrait

`portrait.png` is used in two places:

1. **PersonaSelector** onboarding grid — rendered in a 96×96 tile.
2. **Combat panel** founder slot — rendered as a `contain`-fit portrait
   inside a 128×192 slot.

Square art at 96×96 (or 128×128) with a transparent background works
well in both.

## What happens if a file is missing?

- **Missing `idle.png` / `walk.png`:** VillageMapScene falls back to the
  legacy fantasy character (`/assets/fan-tasy/Character_Idle.png`).
- **Missing `portrait.png`:** PersonaSelector shows the persona's emoji
  in a tinted chip; CombatPanel shows the generic `PlayerSprite` SVG.

Nothing crashes on missing assets — the persona pipeline degrades
gracefully so you can drop files in incrementally.

## Adding a new persona

1. Add a new entry to the `PERSONAS` array in `src/config/personas.ts`
   with a new `PersonaId` literal.
2. Add the id to the `SUPPORTED_PERSONA_IDS` guard in `convex/users.ts`
   (and to the `personaId` schema union in `convex/schema.ts` if the
   field is validated there).
3. Drop `idle.png`, `walk.png`, `portrait.png` under
   `public/assets/personas/<new-id>/`.
