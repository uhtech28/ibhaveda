# Demo Walkthrough Checklist

> Run this end-to-end before you show the client. Each step has a **check** — a specific thing to look for. If a check fails, jot down the step number and message me the failure — most bugs I've built are one-liners to fix.

---

## Pre-flight — do these FIRST

### 0.1. Deploy the code
Open PowerShell in the repo:
```powershell
cd C:\Projects\interactive-ideas-fixed\interactiveideas
powershell -ExecutionPolicy Bypass -File .\scripts\ship-venture-arc.ps1
```
**Check:** script prints "Done. Origin (uhtech28) is up to date." and no red errors.

### 0.2. Start Convex
In another terminal:
```powershell
cd C:\Projects\interactive-ideas-fixed\interactiveideas
npx convex dev
```
**Check:** first run auto-provisions the new `dailyChallenges` table. You'll see it in the schema-change output. Leave this running the whole demo.

### 0.3. Verify Vercel deploy
Wait ~2 min after push, then open **uhtech.in** in a new incognito window. 
**Check:** homepage loads with your latest commit's hash visible (right-click → view page source, look for build timestamp).

### 0.4. Sound on
Turn your speakers on (audio is a big part of the demo). Confirm mute icon isn't set.

---

## Path A — Fresh account playthrough (the "cold" demo)

Recommended for the client demo because it shows the full onboarding arc.

### 1. Sign up
- Go to **uhtech.in**, click Sign Up
- Use a throwaway email (or Clerk's magic-link path)
- **Check:** you land in the feed or a "post your first idea" state without errors

### 2. Sparky tutorial — post the first idea
- Sparky (mascot) should appear in bottom-right with a bubble
- Bubble text: "Post your first idea"
- Click through until you hit the idea composer
- **Check:** #wiz-title and #wiz-description fields are visible; Sparky auto-fills them
- After submit: **Check for a "Founder Awakens" notification** (this is my Fix 3 — first-time tutorial completion should grant +100 XP + badge). If no notification fires, tell me.

### 3. Navigate to World Map
- Click "Go to my world map" (Sparky may guide you)
- **Check:** URL becomes `/map/world`
- **Check:** Painted village map loads
- **Check:** Character avatar visible on CP1 (west end of the map)
- **Check for audio:** village ambience should crossfade in within a few seconds

---

## Village stage playthrough (Stage 1)

### 4. Open the first checkpoint
- Click on the gold CP1 disc
- **Check:** CheckpointPanel opens with 3 tasks (t1/t2/t3)

### 5. Submit Task 1
- Click "Start Task" on t1
- TaskSubmissionModal opens
- Type at least ~20 chars in the response
- Click Submit
- **Check for XP popover:** floating **"+20 XP · Task"** rises from top-center (NOT +15 — that was the old lie).
- **Check the XP bar in HUD:** should visibly move forward. This is my Fix 1 — if the bar doesn't move, tell me.
- **Check the CP1 boss (Fog of Vagueness) reacts:** boss visually dims/hit-flashes on the map.
- **Check Daily Challenges card (top-right):** "Submit 3 tasks" progress bar increments from 0/3 → 1/3.

### 6. Submit Task 2 (repeat step 5)
- Same flow, another task
- **Check XP popover: +20 XP**
- **Check Daily card: 2/3**
- After task 2, the "Advance" button should activate

### 7. Advance to combat
- Click "Advance to Combat" on the CP panel
- CombatPanel opens with Fog of Vagueness on the right
- **Check the arena backdrop:** painted arena, not the plain village map
- **Check the founder sprite (left side):** pixel-art character, not a white photo box
- Answer 2-3 questions. Type substantive answers to hit the boss.
- **Check on victory:** confetti / celebration, +100 XP boss-slay reward
- **Check for Stage 1 badge notifications** — "The Spark Struck" or similar might fire during recalculation (this is Fix 9 — stage badges finally working)

### 8. Repeat for CPs 2, 3, 4
- Walk to CP2, submit tasks, defeat boss (Everyone Chimera)
- CP3 (Feature Automaton), CP4 (Assumption Wraith)
- **Check between CPs:** persona walks, gold burst plays on the cleared CP, boss on the next CP does a "startle" squash animation as you arrive.

### 9. Village Complete finale
- After CP4 boss falls, the Unraveller sprite rises east of CP4
- Persona victory pose plays
- **Check:** Full-screen "STAGE 1 COMPLETE" celebration overlay
- **Check for +50 XP popover** (this is Fix 10 — was previously +500 hardcoded lie)
- Click "Continue Your Quest"
- **Check:** Phaser camera pans east 4-5 seconds → shows Forest preview
- **Check:** URL auto-changes to `?stage=2`

---

## Forest playthrough (Stage 2)

### 10. Forest scene loads
- URL is `/map/world?stage=2`
- **Check the map:** painted Forest map, cool green atmosphere
- **Check for time-of-day tint** subtly visible
- **Check for ambient VFX:** fireflies (small glowing dots) and drifting leaves
- **Check for audio:** ambience should crossfade to forest music
- Character spawns on CP1 (West Threshold)

### 11. Walk through Forest CPs
- 5 CPs: West Threshold → Whispering Grove → Moonlit Clearing → Boss Glade → East Exit
- Boss on CP1 = Shadow of Second-Guessing (undead-family)
- Repeat submit-tasks-then-combat for each CP
- **Check daily challenges** — the "Clear a checkpoint" easy challenge should complete + fire its XP grant

### 12. Forest super-boss reveal
- After CP4 mini-boss (Wraith of Almost-Ready), advance
- **Check:** Forest Colossus rises east of CP4, initially facing away
- **Check for the head-snap turn:** at ~1.9s the boss's texture swaps as it turns to face you (this is Step 12)
- **Check for audio:** boss theme swells (boss_pale_architect for plant family)
- **Check:** SuperBossEncounterOverlay opens after ~2.2s

### 13. Forest super-boss combat (3 questions)
- Overlay shows Forest Colossus + HP bar at 100%
- 4-second arm delay before the Strike button activates
- **Question 1:** "When was perfectionism the enemy of your progress? Name a specific moment."
- Type at least 20 chars
- Click Strike — **Check:** boss reels (screen shake, red aura pulse), HP drops to 66%
- **Question 2:** answer, HP → 33%
- **Question 3:** answer, HP → 0%
- **Check final:** "Boss Defeated" message + boss sprite rotates/fades
- Auto-navigates to `?stage=3`
- **Check:** brief "Stage 2 Cleared · Forest of Perfectionism → Golden Harbor" toast appears at top

---

## Golden Harbor playthrough (Stage 3)

### 14. Harbor scene loads
- URL `?stage=3`
- **Check:** painted Golden Harbor map (2612×1632, ports/docks)
- **Check for VFX:** sea mist wisps + seagull silhouettes flying overhead
- **Check for audio:** harbour ambience (this is Fix 9 — was previously "arena" audio due to biome mismatch)

### 15. Harbor 4-CP walkthrough
- CPs: Dockside Arrival, Market Square, Warehouse District, Lighthouse Tip
- Mini-bosses: Silver-Tongued Merchant, Harbormaster of Gatekeeping, Colossal Sea Serpent, Mist of Bad Reviews
- Same submit → combat → advance loop

### 16. Leviathan super-boss encounter
- After CP4 clears, Leviathan of Market Rejection rises
- Same reveal choreography + 3-question combat
- Prompts are market-rejection themed
- **Check on victory:** navigates to `?stage=4`

---

## Artisans District playthrough (Stage 4 — the finale)

### 17. Artisans scene loads
- URL `?stage=4`
- **Check for VFX:** forge sparks near kiln areas + rising smoke motes
- **Check for audio:** artisan ambience

### 18. Artisans 5-CP walkthrough
- CPs: Craft Workshop, Weaver's Alley, Potter's Kiln, Jeweller's Row, Master's Forge
- Mini-bosses: Armored Perfectionist, Automaton of Delegated Dreams, Titan of Old Habits, Spectral King of Feedback

### 19. Forge Dragon super-boss
- After CP4 clears, Forge Dragon rises east of CP4
- 3-question combat (mastery-themed prompts)
- **Check on final victory:** Instead of navigating to Stage 5 (doesn't exist), the **Venture Complete finale** overlay opens.

### 20. Venture Complete finale
- **Check for the Crown icon** (not Trophy — that's Stage 1's)
- Title: "VENTURE COMPLETE · FOUNDER · REBORN"
- **Check for 36 orbiting gold particles** (denser than Village overlay)
- Stats: "Stages Cleared: 4/4"
- Narrative: "From doubt in a misted village…"
- Click "Return to the World"
- **Check:** URL returns to `/map/world` (no ?stage= param), user is back on the map

---

## Side systems — check these anytime

### 21. Daily Challenges card (top-right)
- **Check:** 3 challenges visible with progress bars
- After all 3 complete, **check:** "Claim +75 XP" button appears with animation
- Click it — **Check for +75 XP toast**

### 22. Streak indicator (top-right area)
- **Check:** flame icon shows current streak day
- Hover for tooltip
- If your streak is broken and ≥ 7 days: **check for a "Restore Streak" button** at the bottom of the tooltip (Fix 7)

### 23. Chat XP
- Open a chat / DM
- Send a message ≥ 20 chars
- **Check:** +2 XP fires via the level system (may be silent — check XP bar shifts if you send several)

### 24. Flare feature
- Click the Flare button in the feed or a CheckpointPanel
- Fire a flare with description
- **Check for +5 XP** popover
- **Check:** flare appears in feed

### 25. Badges page
- Go to `/profile/[your-username]/badges`
- **Check:** you have at least "Founder Awakens" (from tutorial completion)
- After clearing Stage 1, you should see venture stage-1 badges like "The Spark Struck", "The Ideation Mastered" (if perfect play)

---

## When things fail — what to send me

For any check that fails:

1. **Which step number failed**
2. **Screenshot of the current state**
3. **Browser console errors** (F12 → Console tab)
4. **Convex logs** — check the terminal running `npx convex dev`
5. **The URL you were on**

Most bugs I've built are:
- A typo in a slug
- A missing dispatch
- A wrong `.tsx` import path
- A schema field name mismatch

Each is a 1-2 minute fix once I see the error.

---

## Priority skip list — if you're running short on demo time

If you're short on time in the actual client demo, skip these WITHOUT losing the story:

- Stages 3 and 4 mini-boss combat — just walk through them, don't do combat. Super-boss encounters still land.
- Chat XP — invisible to the eye anyway
- Streak restore — only matters if the demo user actually has a broken streak

**Never skip:**
- Village playthrough end-to-end (the tutorial arc is your emotional hook)
- At least ONE super-boss encounter (Forest Colossus is the cleanest)
- Venture Complete finale (the payoff)

Good luck.
