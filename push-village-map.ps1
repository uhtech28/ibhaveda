# ====================================================================
# PUSH: New village map to uhtech.in
# ====================================================================
#
# What gets pushed:
#   NEW FILES:
#     - src/lib/phaser/scenes/VillageMapScene.ts (Phaser quest-progression scene)
#     - src/app/village-test/page.tsx (route)
#     - src/app/village-test/VillageTestClient.tsx (client)
#     - public/assets/maps-v2/village-painted/village-map.png (4.7 MB composite)
#     - public/assets/tutorial/sparky-idle-transparent.png (300 KB)
#   DELETED FILES (from earlier cleanup):
#     - Various asset packs and abandoned test files
#
# Route after deploy: https://uhtech.in/village-test
# ====================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " PUSH: village-test map to uhtech.in" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# ─── Step 1: Show what will be committed ────────────────────
Write-Host "[1/5] Reviewing changes..." -ForegroundColor Yellow
git status --short
Write-Host ""

$confirm = Read-Host "Continue with these changes? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

# ─── Step 2: Typecheck ───────────────────────────────────────
Write-Host ""
Write-Host "[2/5] Running typecheck (30s)..." -ForegroundColor Yellow
npx tsc --noEmit 2>&1 | Select-Object -Last 20

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "TYPECHECK FAILED. Fix errors above before pushing." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Typecheck passed." -ForegroundColor Green
Write-Host ""

# ─── Step 3: Stage all changes ───────────────────────────────
Write-Host "[3/5] Staging changes..." -ForegroundColor Yellow
git add -A

$stagedCount = (git diff --cached --numstat | Measure-Object -Line).Lines
Write-Host ("Staged " + $stagedCount + " files.") -ForegroundColor Green

# ─── Step 4: Commit ──────────────────────────────────────────
Write-Host ""
Write-Host "[4/5] Committing..." -ForegroundColor Yellow

$commitMsg = @"
feat: painted village map with quest progression at /village-test

- Add VillageMapScene: LDtk composite PNG + drag-pan camera + 4 pulsing gold checkpoints (active/completed/locked states)
- Add /village-test route (SSR-safe Phaser boot + task modal + progress HUD)
- Quest progression system: click active checkpoint -> task modal -> Complete advances camera to next
- Deep cleanup: removed 30 MB of abandoned asset packs (kenney-rpg, sprout-lands, tinyswords, serene-village, SERENE_VILLAGE_REVAMPED, forest-painted, village-project LDtk source)
- Removed unused scenes: ForestMapScene, VillageMapV2Scene, forest-test route
- Removed 60+ stale historical docs and empty MD placeholders
- Add sparky-idle-transparent.png (background stripped for map overlay)

Route: https://uhtech.in/village-test
"@

git commit -m $commitMsg

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "COMMIT FAILED." -ForegroundColor Red
    exit 1
}

Write-Host "Committed." -ForegroundColor Green
Write-Host ""

# ─── Step 5: Push ────────────────────────────────────────────
Write-Host "[5/5] Pushing to origin/main..." -ForegroundColor Yellow

$confirmPush = Read-Host "Push to origin/main now? Vercel will auto-deploy in ~3 min. (y/n)"
if ($confirmPush -ne "y") {
    Write-Host "Push skipped. Run 'git push origin main' when ready." -ForegroundColor Yellow
    exit 0
}

git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "PUSH FAILED. Check network or credentials." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host " [DONE] Pushed to origin/main." -ForegroundColor Green
Write-Host " Vercel deploys in ~3-5 min." -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host " Verify at: https://uhtech.in/village-test" -ForegroundColor Cyan
Write-Host " (Hard-refresh Ctrl+Shift+R after deploy completes)" -ForegroundColor Gray
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""
