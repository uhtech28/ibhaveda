# Tutorial Sparky Mascot Assets

Drop **four** Sparky pose images here:

| Filename | Pose | When it shows |
|---|---|---|
| `sparky-idle.png` | Sitting upright, calm, eyes open | Waiting / neutral |
| `sparky-talk.png` | Mouth open, hands gesturing or paw out | While Sparky is speaking |
| `sparky-point.png` | Paw raised pointing forward | When highlighting a UI element |
| `sparky-cheer.png` | Jumping, paws up, excited expression | Celebrating progress |

## Image specs
- Format: **PNG with transparent background**
- Recommended size: **512×512** (will scale down to ~170×170 on screen)
- Aspect: square works best
- Style: stay consistent across all 4 — same colors, same proportions, just different pose

## Where to get them

**AI-generate (fastest, best quality):**
Use ChatGPT, Midjourney, or DALL-E. Generate all 4 at once with consistent style:

```
Create 4 PNG images of a cute golden cartoon puppy mascot named Sparky.
All 4 must use IDENTICAL art style, colors, and proportions — only the
pose changes. Transparent background. Mascot style like Duolingo's owl.

Pose 1 — sitting upright, calm friendly smile, eyes open
Pose 2 — same puppy talking, mouth slightly open, one paw raised in a small wave
Pose 3 — same puppy pointing forward with right paw raised dramatically
Pose 4 — same puppy mid-jump, both paws up, big excited grin, tongue out

Save as: sparky-idle.png, sparky-talk.png, sparky-point.png, sparky-cheer.png
```

**Hire on Fiverr (~$25, 1-day turnaround):**
Search "pixel art mascot dog 4 poses" → most pixel artists deliver in 24h.

**Free pixel-art tilesets:**
- itch.io free section, search "dog character poses"
- opengameart.org "dog mascot sprite"

## Fallback behavior

If any of the 4 PNGs are missing, that mood will gracefully fall back
to `sparky-idle.png` (and if that's missing too, to a 🐶 emoji). So you
can ship with just `sparky-idle.png` first and add the other 3 poses later.

The tutorial code is already wired to use all 4 — just drop them in.
