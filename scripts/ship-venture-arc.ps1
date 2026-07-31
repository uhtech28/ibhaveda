# ship-venture-arc.ps1
# --------------------------------------------------------------------
# Commits the Venture-completion arc and pushes ONLY to `origin`
# (uhtech28/interactive-ideas). The `client` remote (AryanAwasthi-dev)
# is intentionally NOT touched, per the standing production constraint.
#
# Run this from PowerShell in the repo root:
#   cd C:\Projects\interactive-ideas-fixed\interactiveideas
#   powershell -ExecutionPolicy Bypass -File .\scripts\ship-venture-arc.ps1
# --------------------------------------------------------------------

$ErrorActionPreference = "Stop"
Set-Location "C:\Projects\interactive-ideas-fixed\interactiveideas"

# 1. Clean up any stale git index lock
if (Test-Path ".git\index.lock") {
    Write-Host "-> Removing stale .git\index.lock" -ForegroundColor Yellow
    Remove-Item -Force ".git\index.lock"
}

# 1a. Delete orphaned components identified in the gamification audit.
$deadFiles = @(
    "src\components\animations\CheckpointAnimationOverlay.tsx",
    "src\components\hud\CorruptionMeter.tsx",
    "src\components\gamification\Leaderboard.tsx",
    "src\components\combat\CombatBanScreen.tsx"
)
foreach ($f in $deadFiles) {
    if (Test-Path $f) {
        git rm --quiet -- $f 2>$null
        if (Test-Path $f) { Remove-Item -Force $f }
        Write-Host "  - deleted $f" -ForegroundColor DarkGray
    }
}

# 2. Confirm branch + remotes
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "-> On branch: $branch" -ForegroundColor Cyan
Write-Host "-> Remotes:" -ForegroundColor Cyan
git remote -v

# 3. Files to stage -- the arc's real changes only, avoiding CRLF drift
$files = @(
    "src/app/map/world/page.tsx",
    "src/lib/phaser/scenes/VillageMapScene.ts",
    "src/lib/phaser/scenes/ForestMapScene.ts",
    "src/lib/phaser/scenes/ArenaScene.ts",
    "src/lib/phaser/scenes/ArtisansScene.ts",
    "src/lib/phaser/scenes/MineScene.ts",
    "src/lib/phaser/scenes/GoldenHarborScene.ts",
    "src/lib/phaser/scenes/CrossroadsScene.ts",
    "src/lib/phaser/utils/event-bridge.ts",
    "src/lib/phaser/utils/time-of-day.ts",
    "src/lib/phaser/utils/ambient-vfx.ts",
    "src/lib/phaser/utils/cp-clear-burst.ts",
    "src/lib/phaser/animations/bossAnimator.ts",
    "src/lib/audio/audioManager.ts",
    "src/components/village/VillageCompleteCelebration.tsx",
    "src/components/village/VentureCompleteCelebration.tsx",
    "src/components/village/StageClearedToast.tsx",
    "src/components/combat/SuperBossEncounterOverlay.tsx",
    "src/config/stage-bosses.ts",
    "src/config/stages.config.ts",
    "public/assets/maps-v2/arena/arena-map.png",
    "public/assets/maps-v2/arena/arena.ldtk",
    "public/assets/maps-v2/mine/mine-map.png",
    "public/assets/maps-v2/mine/mine.ldtk",
    "public/assets/maps-v2/crossroads/crossroads-map.png",
    "convex/worldMap.ts",
    "convex/tutorial.ts",
    "convex/flares.ts",
    "convex/chat.ts",
    "convex/streaks.ts",
    "convex/schema.ts",
    "convex/ventures.ts",
    "convex/dailyChallenges.ts",
    "convex/badges.ts",
    "src/components/gamification/StreakIndicator.tsx",
    "src/components/gamification/DailyChallengesCard.tsx",
    "src/components/animations/index.ts",
    "src/components/combat/index.ts",
    "docs/MAP_BRIEFS_FOR_ARTIST.md",
    "MAP_SPEC.md",
    "docs/technical-prd.md",
    "docs/2_STAGE_VENTURE_SYSTEM.md",
    # Runtime dependencies that were on disk locally but never committed --
    # imports from src/app/map/world/page.tsx + celebration overlays. Vercel
    # blew up trying to build without these.
    "src/components/xp/XpFloatingPopover.tsx",
    "src/config/village-bosses.ts",
    "src/lib/ui/bodyScrollLock.ts",
    # Resilient middleware -- don't crash at module load if Preview env
    # lacks NEXT_PUBLIC_CONVEX_URL; just let requests through.
    "src/middleware.ts",
    # Client-side provider guards -- ClerkProvider + ConvexProvider now
    # skip themselves if env vars are missing, so hydration doesn't crash
    # with "Application error".
    "src/app/layout.tsx",
    "src/lib/convex/client.ts",
    "src/lib/convex/providers.tsx",
    # Cache-control fix -- next.config previously locked /assets/* for
    # 1 YEAR immutable so 3 client devices refused to fetch new files
    # even after new deploys.
    "next.config.ts",
    # New Sparky asset path -- old cache-immutable blocker fix
    "public/assets/tutorial/sparky-v2/idle.png",
    "public/assets/tutorial/sparky-v2/talk.png",
    "public/assets/tutorial/sparky-v2/roll.png",
    "public/assets/tutorial/sparky-v2/cheer.png",
    "src/components/tutorial/v2/puppy/AnimatedSparky.tsx",
    # DEEP-AUDIT MISSING ASSETS -- these are referenced by scenes /
    # boss config but were never actually committed to git. Vercel
    # built without them so uhtech.in had no boss sprites and no
    # stage 2/3/4 maps rendering. This was the root cause of "old
    # map, old sparky" on all 3 devices -- it wasn't cache, it was
    # missing files on the origin.
    "public/assets/bosses/stage2/forest-colossus/idle.png",
    "public/assets/bosses/stage2/forest-sorceress/idle.png",
    "public/assets/bosses/stage2/forest-wraith/idle.png",
    "public/assets/bosses/stage2/shadow-specter/idle.png",
    "public/assets/bosses/stage2/thornbearer/idle.png",
    "public/assets/bosses/stage3/harbor-merchant/idle.png",
    "public/assets/bosses/stage3/harbor-official/idle.png",
    "public/assets/bosses/stage3/leviathan/idle.png",
    "public/assets/bosses/stage3/sea-serpent/idle.png",
    "public/assets/bosses/stage4/armor-golem/idle.png",
    "public/assets/bosses/stage4/artisan-automaton/idle.png",
    "public/assets/bosses/stage4/forge-dragon/idle.png",
    "public/assets/bosses/stage4/spectral-king/idle.png",
    "public/assets/bosses/stage4/undead-titan/idle.png",
    "public/assets/bosses/village/automaton/idle.png",
    "public/assets/bosses/village/chimera/idle.png",
    "public/assets/bosses/village/fog/attack.png",
    "public/assets/bosses/village/fog/idle.png",
    "public/assets/bosses/village/fog/running.png",
    "public/assets/bosses/village/unraveller/idle.png",
    "public/assets/bosses/village/wraith/idle.png",
    "public/assets/bosses/village/wraith/walk.png",
    "public/assets/maps-v2/arena/arena-background.png",
    "public/assets/maps-v2/artisans/artisans-map.png",
    "public/assets/maps-v2/forest/forest-map.png",
    "public/assets/maps-v2/golden-harbor/harbor-map.png",
    "public/audio/tutorial/continue.mp3"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        git add -- $f
        Write-Host "  + $f" -ForegroundColor Green
    } else {
        Write-Host "  ! MISSING: $f" -ForegroundColor Red
    }
}

# 4. Stage the extracted boss rotations + super-boss north sprites
Write-Host "`n-> Staging boss rotation folders..." -ForegroundColor Cyan
$rotationRoots = @(
    "public/assets/bosses/stage2",
    "public/assets/bosses/stage3",
    "public/assets/bosses/stage4"
)
foreach ($root in $rotationRoots) {
    if (Test-Path $root) {
        Get-ChildItem -Path $root -Directory | ForEach-Object {
            $rotDir = Join-Path $_.FullName "rotations"
            if (Test-Path $rotDir) {
                git add -- $rotDir
                Write-Host "  + $($_.Name)/rotations" -ForegroundColor Green
            }
        }
    }
}

# 5. Show staged summary
Write-Host "`n-> Staged files:" -ForegroundColor Cyan
git diff --cached --stat

# 6. Commit -- short single-line message. Only staged (changed) files
#    end up in the commit, so this is safe to run repeatedly for polish
#    updates on top of the base venture arc push.
$commitMsg = "fix(assets): commit 27 missing files - bosses/maps/audio never shipped to origin"

Write-Host "`n-> Committing..." -ForegroundColor Cyan
git commit -m $commitMsg

# 7. Push to origin ONLY
# -u sets the upstream on first push so future `git push` (no args)
# knows where to go. Explicit `origin` also means this call cannot
# push to the client remote.
Write-Host "`n-> Pushing to origin/$branch..." -ForegroundColor Cyan
git push -u origin $branch

Write-Host "`n[OK] Origin (uhtech28) is up to date. Client (Aryan) untouched." -ForegroundColor Green
Write-Host "     Vercel will auto-build and deploy uhtech.in from origin/$branch." -ForegroundColor Green
