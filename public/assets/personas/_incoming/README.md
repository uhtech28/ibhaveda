# Persona sprite drop zone

Drop individual per-pose PNGs here, then run:

```bash
npm run personas:compose
```

The composer tiles your poses into the proper spritesheets under
`public/assets/personas/<id>/` and the map + combat pick them up
automatically on the next reload.

## Naming convention

Files are matched by name (case-insensitive):

```
<persona-id>-idle-<frame>.png       ← e.g. arcanist-idle-0.png
<persona-id>-walk-<frame>.png       ← e.g. arcanist-walk-3.png
<persona-id>-portrait.png           ← e.g. arcanist-portrait.png
```

Frame numbers are sorted numerically, so `-0`, `-1`, `-2` … tile
left-to-right into the strip. You can use `-1`, `-2`, `-3` if you
prefer 1-indexed — sort order is the same.

## The 8 personas

| id           | Character in your batch                     |
| ------------ | ------------------------------------------- |
| `arcanist`   | Blue wizard with pointy hat                 |
| `alchemist`  | Bald monk in orange robe                    |
| `artisan`    | Bearded warrior with hammer + shield        |
| `drifter`    | Dark-cloak assassin                         |
| `engineer`   | Military / tactical figure                  |
| `healer`     | Orange-hair character in blue overalls      |
| `oracle`     | Purple-hair figure in white robe            |
| `pathfinder` | Fedora explorer                             |

*(The curly-hair yellow-jacket sprite is a spare — swap it for any
of the above if you prefer that read.)*

## Example — full drop for one persona

```
arcanist-idle-0.png     ← breathing pose 1
arcanist-idle-1.png     ← breathing pose 2
arcanist-idle-2.png     ← breathing pose 3
arcanist-idle-3.png     ← breathing pose 4
arcanist-walk-0.png     ← walk cycle frame 1
arcanist-walk-1.png     ← walk cycle frame 2
arcanist-walk-2.png     ← walk cycle frame 3
arcanist-walk-3.png     ← walk cycle frame 4
arcanist-walk-4.png     ← walk cycle frame 5
arcanist-walk-5.png     ← walk cycle frame 6
arcanist-portrait.png   ← selection art (any size, gets fit to 128×128)
```

Not all frames are required. The composer builds whatever it finds
and pads the strip contiguously. A single-frame idle is fine — it
just won't animate.

## What the composer does

- **Portraits:** fit-contained to 128×128 with transparent letterbox,
  nearest-neighbor scaling (preserves pixel-art crispness).
- **Idle / walk strips:** each source pose fit-contained to 32×48
  frames, then tiled horizontally into a single strip. Frame width
  and height match `DEFAULT_SPRITE` in `src/config/personas.ts`.
- **Missing pieces:** logged but not fatal. Personas without idle
  or walk fall back to the legacy fantasy sprite on the map.
- **Unrecognised filenames:** left in `_incoming/` and reported, so
  nothing gets lost or overwritten silently.

## Overriding frame sizes

If a persona's export uses different frame dimensions, override its
`sprite` field in `src/config/personas.ts`. The composer always
normalises to `FRAME_W × FRAME_H` at the top of the script — bump
those constants if you're re-composing at a different scale.

## What happens after compose

The composer writes to `public/assets/personas/<id>/{idle,walk,portrait}.png`.
The Next.js dev server will hot-reload the assets; the persona picker
+ VillageMapScene + CombatPanel all consume them via paths already
wired up in code.

Note: `_incoming/` is gitignored (see `.gitignore`) so raw drops
don't accidentally land in the repo — only the composed sheets are
committed.
