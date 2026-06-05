# PRD 3.0 — Deployment Notes for Client

This branch lands 9 new PRD features plus the required schema migration.
Before merging to `main` and deploying to your prod Convex deployment,
read this whole file once.

---

## 1. Convex env vars to set on prod

Set these on the **prod Convex deployment** (`ideal-marmot-240`) via the
Convex dashboard or CLI **before deploying this branch**. The new features
will not work without them.

| Variable | Required for | Example value |
|---|---|---|
| `CLERK_JWT_ISSUER_DOMAIN` | Existing Clerk auth (already set if app currently works) | `https://clerk.theinteractiveideas.com` |
| `REPLICATE_API_TOKEN` | Combat — Llama 3 fallback provider | `r8_xxxxxxxx` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Combat — Gemini primary provider | `AIzaSy...` |
| `COMBAT_AI_PRIMARY` | Switches combat between providers. Set to `gemini` for the recommended default | `gemini` |
| `LEAGUES_ADMIN_CLERK_ID` | Locks `runWeeklyPromotionManual` to a single admin user. Set to the Clerk user id of whoever should be able to trigger a manual league rebalance | `user_2abc...` |
| `VIDEO_PROVIDER` | Picks the managed video service for PRD §5 AC3 compliance. Without it, the platform falls back to Convex storage (v0 path) | `mux` or `cloudflare` |
| `MUX_TOKEN_ID` + `MUX_TOKEN_SECRET` | Only if `VIDEO_PROVIDER=mux`. Get from https://dashboard.mux.com → Settings → Access Tokens | `id_xxx` / `secret_xxx` |
| `CLOUDFLARE_STREAM_ACCOUNT_ID` + `CLOUDFLARE_STREAM_TOKEN` | Only if `VIDEO_PROVIDER=cloudflare`. From Cloudflare dashboard → Stream → API tokens | `abc123...` / `xxxx` |

CLI alternative if you prefer the terminal:

```sh
npx convex env set --prod REPLICATE_API_TOKEN "r8_xxx"
npx convex env set --prod GOOGLE_GENERATIVE_AI_API_KEY "AIzaSy..."
npx convex env set --prod COMBAT_AI_PRIMARY "gemini"
npx convex env set --prod LEAGUES_ADMIN_CLERK_ID "user_xxx"
```

---

## 2. Schema migration safety

This branch adds optional fields to existing tables and 8 new tables.
**No destructive changes.** All new fields on `userLevels`, `userStreaks`,
`messages`, and `notifications` are `v.optional(...)`, so existing rows
will validate cleanly without backfill.

New tables:

- `combatRounds`
- `combatQuestions`
- `combatAiSuspicions`
- `userAccountSuspensions`
- `leagueWeeklyHistory`
- `miniGameSessions`
- `miniGameCompletions`
- `videos`

New indexes on existing tables:

- `userLevels.by_league_tier_xp` — `[currentLeagueTier, weeklyLeagueXp]`
- `notifications.relatedId` union extended with `flares` and `flareResponses` (no index change, just type widening)

You can deploy with `npx convex deploy` and Convex will register the schema atomically.

---

## 3. New cron job that will start running

After deploy, this cron auto-registers and starts running:

| Name | Schedule | What it does |
|---|---|---|
| Weekly League Promotion | Mondays 00:00 UTC | Promotes top of each tier, relegates bottom, resets `weeklyLeagueXp` |

The first run will operate on whatever league state exists at that moment.
If you want to seed initial tiers before the first run, you can manually
patch `userLevels.currentLeagueTier = "bronze"` on existing rows. If you
don't, the bumpWeeklyXp helper auto-assigns "bronze" the first time a user
earns XP after deploy.

---

## 4. Streak v2 — what users will see (updated per PRD §9)

The streak counter advances when a signed-in user performs any one of
the four qualifying actions on a given local day:

- `made_contribution` — a contribution request is accepted
- `submitted_task` — a task is completed
- `fired_flare`
- `responded_to_flare`

Plain logins, posting an idea, sparking, commenting, completing a
checkpoint, and winning combat **no longer** advance the streak. They
remain real engagement (XP / points still award), but per PRD §9.2
streak credit is narrowed to the four actions above.

Day boundaries are evaluated in the user's local IANA timezone (PRD
§9 AC4). The client pushes the zone to Convex on app load via the
`streaks.setMyTimezone` mutation; if a user has not yet sent one,
the server falls back to UTC. New field `userStreaks.timezone` lives
on the existing table — optional, so deploy is a no-op for existing
rows.

Existing rows with `lastLoginDate` continue to work — the streak read
prefers `lastActionDate` and falls back to `lastLoginDate`. A
`migrateLastActionDate` internal mutation exists in `convex/streaks.ts`
if you want to one-shot copy existing rows forward.

The schema's `lastActionType` union still accepts the legacy action
strings (`sparked_idea`, `posted_idea`, `commented`,
`completed_checkpoint`, `won_combat`) for backward-compatibility with
rows persisted before §9 landed. They are no longer written by any
code path; once data is migrated they can be dropped.

---

## 5. Combat — anti-cheat policy

Two-strike policy:

1. First AI-generated submission detected → user sees `AntiCheatWarning`
2. Second offense → permanent ban recorded in `userAccountSuspensions`,
   user sees `CombatBanScreen` indefinitely

Bans are per-user, not per-venture. The `LEAGUES_ADMIN_CLERK_ID` env var
above does **not** confer ban-revoke ability — that's a separate ops
concern. If you need an unban flow, ping me.

---

## 6. Features that ship with their own pages

| Route | Renders |
|---|---|
| `/leagues` | `LeagueProgressCard` + `LeagueLadder` |
| `/videos` | `VideoFeed` with composer trigger |

You'll want to add nav links to these routes in the existing top bar /
sidebar component. I did not modify the nav to avoid touching unrelated
layouts.

---

## 7. Mini-games — fully wired (PRD §2)

Spawn points are now mounted on the world map per PRD §2.3.1:

- **Bridge events** added to `event-bridge.ts`: `MINIGAME_SPAWN_ACTIVATED`
  (Phaser → React) and `MINIGAME_SYNC_STATE` (React → Phaser) carrying
  `completedCheckpointIds` + `completedSpawnIds`.
- **`WorldMapScene`** instantiates `MiniGameSpawnPoint` entities from
  `MINIGAME_SPAWNS` after `createSnakePath()`. A spawn only renders
  when the last checkpoint of the preceding stage is in the user's
  completed set (AC1). The scene ticks each spawn with the live
  persona position so the "?" label fades in within 80px.
- **Page-level wiring** in `src/app/map/world/page.tsx`: the
  `useMiniGameLifecycle` hook is mounted with the active venture id;
  on `MINIGAME_SPAWN_ACTIVATED` it calls `engageWithSpawn`. The page
  renders `MiniGamePromptDialog`, `MiniGameOverlay`, and
  `MiniGameResultPanel` according to phase. The overlay launches a
  **separate** Phaser game instance into its own div — the world-map
  canvas keeps running underneath, so AC6 ("never unmounts the canvas;
  map position preserved") is met by construction.
- **Server-side idempotency** for XP grants is already in
  `convex/miniGames.ts` via the `by_user_spawn` index on
  `miniGameCompletions`. Two-tab races result in exactly one award
  (PRD §2 AC3 / edge case).

---

## 8. Files NOT to commit (already in `.gitignore`)

These local-only scratch files were generated during development:

- `.env.local.prod-backup`
- `convex-output.log`
- `convex-transcript.txt`

`TESTING-CHECKLIST.md` and `PRD3-DEPLOY-NOTES.md` (this file) are
**intended** to be committed as repo docs.

---

## 9. Quick post-deploy verification

After `npx convex deploy` succeeds:

1. **Schema** — Convex dashboard → Schema tab → confirm all new tables visible
2. **Functions** — Functions tab → confirm `leagues.bumpWeeklyXp`, `streaks.recordAction`, `combat.startRound`, `videos.getFeed`, `miniGames.startSession` all listed
3. **Crons** — Schedules tab → "Weekly League Promotion" listed
4. **Smoke** — Log in, comment on any idea → streak should tick. Award any XP → user's `userLevels.weeklyLeagueXp` should increment.

If any of those fails, paste the error and I'll diagnose.
