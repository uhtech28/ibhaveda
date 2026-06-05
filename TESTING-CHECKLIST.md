# PRD 3.0 Local Testing Checklist

How to verify every feature you built. Tick each box as you complete it.

## Before you start

1. Confirm the dev server is running:
   ```powershell
   cd C:\Projects\interactive-ideas-fixed\interactiveideas
   npm run dev
   ```
2. Open `http://localhost:3000` in Chrome or Edge
3. Press **F12** → keep the **Console** tab open the whole time. Watch for red errors
4. Sign in via Clerk so you can access authenticated routes

### What "passing" means right now

The prod Convex backend (`ideal-marmot-240`) does NOT yet have the new schema your bundles added. So when you trigger any feature that writes to a new table (`combatRounds`, `videos`, `miniGameSessions`, etc.), the **mutation will fail at the backend** with errors like `Could not find table` or `Schema validation failed`. **That is expected.**

We are testing two things here:

- **PASS** = the UI renders, navigation works, no React crash, no hydration errors
- **FAIL** = blank page, red React error overlay, `Cannot read property of undefined`, infinite loading spinner, console flooded with hook errors

Backend-call failures are NOT failures for this pass. They only become failures after the client merges and deploys your branch.

---

## 1. Anti-cheat policy (permanent ban on 2nd offense)

**What was built:** Combat-side AI detection that triggers a warning the first time and a permanent ban the second time. New table `userAccountSuspensions`, new component `CombatBanScreen`, new component `AntiCheatWarning`.

**How to verify:**

1. Navigate to a venture: `http://localhost:3000/my-ventures` → click any venture card
2. Click into a checkpoint that has standard tasks completed
3. Look for the **Start Combat** / **Challenge boss** button
4. Click it → the combat panel should open
5. Open DevTools → Network tab → confirm a call to `combat:startRound` is fired
6. **Expected backend fail** but the panel should still render the question card layout

**Pass criteria:** `CombatPanel` mounts, HP bars visible, question card layout renders, no React crash.

**If you want to see the ban screen UI directly without a real ban:** Temporarily import `CombatBanScreen` into any page and render it with a fake `bannedAt={Date.now()}` prop. Tell me if you want help wiring that up.

---

## 2. Free-tier-only cleanup (no Pro CTA, tier locked to free)

**What was built:** Removed all "Upgrade to Pro" buttons and CTAs. Tier defaults to free everywhere.

**How to verify:**

1. Navigate to `http://localhost:3000/profile/[your-username]`
2. Check the profile page header, sidebar, and any settings panel
3. **Search the whole UI for the word "Pro"** — there should be no "Upgrade to Pro" buttons, no "Pro features locked" banners, no premium-tier badges
4. Look at combat / leagues / any monetized surface — should not show any Pro upsell
5. In DevTools console, search if any old gating code references "pro" tier:
   ```js
   // In the console:
   document.body.innerText.includes("Upgrade to Pro")
   ```
   Should return `false`.

**Pass criteria:** No Pro CTA anywhere, no upgrade prompts, tier indicator (if shown) says "Free" or is hidden.

---

## 3. Disable monthly cap

**What was built:** Removed the monthly combat attempts cap. User can attempt combat without hitting a usage limit.

**How to verify:**

1. Go to a checkpoint with combat available
2. Look for any "X / Y attempts used this month" text — should NOT appear
3. Combat panel should not display a "cap reached" gate
4. If you can trigger the combat flow, the start should not be blocked by a quota check

**Pass criteria:** No cap copy visible anywhere, no `cap_exhausted` state showing.

---

## 4. HP-based combat (win/loss flow refactor)

**What was built:** Replaced per-question scoring with HP bars for both player and boss. Win on boss HP = 0, loss on player HP = 0.

**How to verify:**

1. Open a checkpoint → click Start Combat
2. Combat panel should display **two HP bars**:
   - Boss HP bar at the top
   - Player HP bar at the bottom (or wherever the layout puts it)
3. Each HP bar should have a numeric label (e.g. `120 / 150`)
4. The question card layout should match the new design (no more raw "score 0-100" text)
5. The result panel should say **"Victory"** or **"Defeat"** based on which HP hit zero — not a numeric score

**Pass criteria:** HP bars render, numbers visible, no per-question scoring UI leftover.

---

## 5. Remove edit-tasks button + no-repeat-questions policy

**What was built:** Killed the "Edit answers" button on tasks. Combat now uses a normalized-prompt check so the same question never repeats across rounds.

**How to verify:**

1. Open a checkpoint with completed standard tasks
2. Look at each task — there should be **NO "Edit" button** on submitted tasks
3. The "Re-do" / "Submit again" affordance should be gone for tasks that have been answered
4. If you can start combat: do round 1, win or lose, retry. The questions in round 2 should be **different** from round 1 (impossible to verify without backend — note for QA after deploy)

**Pass criteria:** No edit affordance on completed tasks.

---

## 6. Flare UI feature

**What was built:** Backend additions (already in `convex/flares.ts`), new `FlareDetailDialog`, `FlareFeedSection`, `FlareResponseItem` components. Wired into the venture / world map.

**How to verify:**

1. Navigate to `http://localhost:3000/map/world` or a venture page
2. Look for the **flare button** (usually a flame icon) on checkpoints or venture cards
3. Click it → `FlareDetailDialog` should open with:
   - Description input
   - "Send" / "Fire flare" button
   - Existing responses list below
4. Navigate to a feed/community page → look for `FlareFeedSection` showing active flares
5. Click a flare → opens detail dialog with responses

**Pass criteria:** Dialog opens, form renders, responses list renders (even if empty). No React crash.

---

## 7. Streak v2 (action-based, not login-based)

**What was built:** Renamed `lastLoginDate` semantics to `lastActionDate`. Streaks now tick on meaningful actions (submitted_task, sparked_idea, posted_idea, commented, fired_flare, responded_to_flare, completed_checkpoint, won_combat).

**How to verify:**

1. Open the HUD or profile page where the streak counter shows
2. Streak number should display
3. Hover or click for streak details — should mention "action" not "login"
4. The "Last activity" label (if shown) should reflect action-based dating
5. **Backend test (post-deploy only):** Perform any meaningful action → streak should advance the same day

**Pass criteria:** Streak counter renders, no React crash. Backend wiring goes live after merge.

---

## 8. Engagement popups (sparkers + contributors)

**What was built:** `SparkersDialog`, `ContributorsDialog`, `EngagementCounters` row, `UserListItem` component.

**How to verify:**

1. Navigate to any idea page: `http://localhost:3000/idea/[id]`
2. Find the engagement row showing **spark count** and **contributor count**
3. Click the spark count number → `SparkersDialog` opens listing users who sparked
4. Click the contributor count → `ContributorsDialog` opens with author + accepted contributors
5. Each row in the dialog should show:
   - Avatar
   - Display name
   - Username
   - "Author" or "Contributor" badge

**Pass criteria:** Both dialogs open, user rows render, avatars and names visible.

---

## 9. Chat images (upload, preview, lightbox)

**What was built:** Image upload in `ChatInput`, image message rendering, lightbox viewer.

**How to verify:**

1. Navigate to a DM or group conversation
2. In the chat input area, look for an **image / attachment / paperclip icon**
3. Click it → file picker opens, pick any JPG or PNG
4. **Preview** should appear above the input (thumbnail of the picked image)
5. Click **Send** → message should attempt to send (will fail on prod backend without `imageStorageId` field — that's OK)
6. For any **existing** image message in the thread: click it → lightbox should open with full-size view
7. Lightbox should have a close button and keyboard escape support

**Pass criteria:** Picker opens, preview shows, lightbox opens on click.

---

## 10. Double posting (share menu)

**What was built:** Share button that opens a menu with X / LinkedIn / WhatsApp / Email / Copy options.

**How to verify:**

1. Navigate to any shareable item: an idea page, a venture milestone, a flare
2. Look for a **share icon** (usually arrow / share / link icon)
3. Click it → share menu opens with 5 options:
   - **X / Twitter** — should open a tweet compose window in new tab
   - **LinkedIn** — opens LinkedIn share dialog in new tab
   - **WhatsApp** — opens WhatsApp web with prefilled message
   - **Email** — opens default mail client with subject + body prefilled
   - **Copy link** — copies URL to clipboard, shows a toast like "Link copied"

**Test each one individually.** They should all use `target="_blank"` and `rel="noopener noreferrer"`.

**Pass criteria:** Menu opens with all 5 options, each one routes correctly. Copy shows a confirmation.

---

## 11. Leagues (5-tier weekly ladder)

**What was built:** Components `LeagueBadge`, `LeagueLadder`, `LeagueProgressCard`. Backend cron for weekly promotion.

**Important:** I did NOT find a Leagues page wired into the app router. The components exist but no route renders them yet. You'll need to either:

**Option A — quick visual check (recommended):** Add a temporary test route:

```powershell
# Create the file
New-Item -ItemType Directory -Force -Path src\app\test-leagues
```

Create `src\app\test-leagues\page.tsx`:

```tsx
"use client";
import { LeagueLadder } from "@/components/leagues/LeagueLadder";
import { LeagueProgressCard } from "@/components/leagues/LeagueProgressCard";

export default function TestLeaguesPage() {
  return (
    <div className="p-6 space-y-6">
      <LeagueProgressCard />
      <LeagueLadder />
    </div>
  );
}
```

Then visit `http://localhost:3000/test-leagues`.

**Option B — find where it was meant to live:** Search the navbar / sidebar for an unused "Leagues" link.

**How to verify (after one of those):**

1. Page loads showing the 5 tier badges: bronze, silver, gold, platinum, diamond
2. Progress card shows your current tier + weekly XP
3. Ladder shows ranked list of users in your tier (will fail without backend — empty state OK)

**Pass criteria:** Components render, tier visuals look right.

---

## 12. Native video (short-form feed)

**What was built:** Components `VideoCard`, `VideoFeed`, `VideoComposer`. Convex functions for upload + feed.

**Important:** Same as Leagues — components exist, no page wired. Use a test route:

Create `src\app\test-videos\page.tsx`:

```tsx
"use client";
import { VideoFeed } from "@/components/video/VideoFeed";

export default function TestVideosPage() {
  return (
    <div className="mx-auto max-w-md py-6">
      <VideoFeed />
    </div>
  );
}
```

Then visit `http://localhost:3000/test-videos`.

**How to verify:**

1. Page loads with the video feed layout (empty state expected)
2. Look for a **+ Upload video** button — clicking opens `VideoComposer`
3. Composer should have:
   - File picker (accepts MP4 / WebM / MOV)
   - Caption input
   - Submit button
4. Pick a short test video → should show poster preview
5. Validation should reject videos over 60s or 50MB with a clear error message
6. Submit attempt will fail at backend (no `videos` table on prod) — expected

**Pass criteria:** Feed renders, composer opens, file validation works, no crash.

---

## 13. Mini-game easter eggs (Pattern Match, Reflex Tap, Decrypt)

**What was built:** `MiniGameOverlay`, `MiniGameSurface`, `MiniGamePromptDialog`, `MiniGameResultPanel`. Three Phaser scenes. Spawn points should appear on the world map.

**How to verify:**

1. Navigate to `http://localhost:3000/map/world`
2. Walk / scroll around the map
3. Look for **spawn point icons** scattered on the map (small glowing markers)
4. Tap a spawn → `MiniGamePromptDialog` opens with:
   - Game name (e.g., "Pattern Match")
   - Difficulty indicator
   - Start button + Skip button
5. Click Start → `MiniGameSurface` mounts and the Phaser scene loads
6. Play the game (Pattern Match = repeat the sequence, Reflex Tap = hit targets, Decrypt = guess cipher)
7. On completion → `MiniGameResultPanel` shows score + XP reward
8. Reopen the same spawn — should be **gone** (already completed)

**Pass criteria:** Spawns visible on world map, dialog opens, Phaser scene mounts (game plays), result panel shows.

If spawn points are NOT visible on the world map, the spawn config may not be wired into the existing map rendering. You can still test the games directly with a test route:

Create `src\app\test-minigames\page.tsx`:

```tsx
"use client";
import { useState } from "react";
import { MiniGameOverlay } from "@/components/minigames/MiniGameOverlay";

export default function TestMiniGamesPage() {
  const [spawn, setSpawn] = useState<string | null>(null);
  return (
    <div className="p-6 space-y-3">
      <button onClick={() => setSpawn("test_pattern")} className="block border px-4 py-2">Pattern Match</button>
      <button onClick={() => setSpawn("test_reflex")} className="block border px-4 py-2">Reflex Tap</button>
      <button onClick={() => setSpawn("test_decrypt")} className="block border px-4 py-2">Decrypt</button>
      {spawn && <MiniGameOverlay spawnPointId={spawn} onClose={() => setSpawn(null)} />}
    </div>
  );
}
```

You may need to register matching spawn ids in `convex/miniGameConstants.ts` for the games to actually start. If you want help wiring that, tell me.

---

## Final pass — global smoke test

After verifying each feature individually, do a 5-minute global click-through:

1. Land on `http://localhost:3000/` — homepage loads
2. Click through every nav link in the top bar / sidebar
3. Visit each existing page in your nav: my-ideas, my-ventures, feed, map, calendar, community
4. Open at least one idea page and one venture page
5. Try a chat conversation
6. Check the profile page
7. Check the world map renders fully

Through all of this, watch the DevTools console. **Any red error that isn't a backend-call failure is a real bug — paste it and we'll fix it.**

---

## Reporting bugs to me

When you find an issue, paste this format:

```
Feature: [#] Combat
Route: /venture/abc123/stage/1/checkpoint/1
Action: clicked Start Combat
What I expected: combat panel opens
What happened: blank screen, red error overlay
Console error: [paste exact error]
```

That's enough for me to find and fix it fast.
