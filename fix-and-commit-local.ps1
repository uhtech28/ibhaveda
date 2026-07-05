# ====================================================================
# FIX typecheck + COMMIT locally (DO NOT PUSH)
# ====================================================================
#
# 1. Clears .next cache (stale references to deleted forest-test)
# 2. Re-runs typecheck
# 3. Commits locally
# 4. STOPS - does NOT push to origin/main (aryan domain untouched)
#
# Push manually later when ready:
#   git push origin main
# ====================================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=== FIX & COMMIT LOCAL (no push) ===" -ForegroundColor Cyan
Write-Host ""

# ─── Step 1: Clear stale Next.js cache ──────────────────────
Write-Host "[1/4] Clearing .next cache (has stale forest-test types)..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "  [OK] .next removed" -ForegroundColor Green
} else {
    Write-Host "  [skip] .next already gone" -ForegroundColor DarkGray
}
Write-Host ""

# ─── Step 2: Typecheck ───────────────────────────────────────
Write-Host "[2/4] Running typecheck (30-60s)..." -ForegroundColor Yellow
$typecheckOutput = npx tsc --noEmit 2>&1
$typecheckExit = $LASTEXITCODE

if ($typecheckExit -ne 0) {
    Write-Host ""
    Write-Host "TYPECHECK FAILED - errors below:" -ForegroundColor Red
    $typecheckOutput | Select-Object -Last 30
    Write-Host ""
    Write-Host "Fix errors before continuing. Nothing was committed." -ForegroundColor Yellow
    exit 1
}

Write-Host "  [OK] Typecheck passed." -ForegroundColor Green
Write-Host ""

# ─── Step 3: Stage all changes ───────────────────────────────
Write-Host "[3/4] Staging changes..." -ForegroundColor Yellow
git add -A
$stagedFiles = git diff --cached --name-only | Measure-Object -Line
Write-Host ("  [OK] " + $stagedFiles.Lines + " files staged") -ForegroundColor Green
Write-Host ""

# ─── Step 4: Commit (LOCAL only) ─────────────────────────────
Write-Host "[4/4] Committing locally (no push)..." -ForegroundColor Yellow

$commitMsg = @"
feat: painted village map with quest progression at /village-test

- Add VillageMapScene: LDtk composite PNG + drag-pan camera + 4 pulsing gold checkpoints
- Add /village-test route (SSR-safe Phaser boot + task modal + progress HUD)
- Quest progression: click active checkpoint -> task modal -> Complete advances camera
- Deep cleanup: removed 200+ stale files (asset packs, historical docs, empty MDs, screenshots)
- Removed unused scenes: ForestMapScene, VillageMapV2Scene, forest-test route
- Add sparky-idle-transparent.png (background stripped for map overlay)
"@

git commit -m $commitMsg

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "COMMIT FAILED." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host " [DONE] Committed LOCALLY only. aryan domain untouched." -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host " Latest commit:" -ForegroundColor Cyan
git log -1 --oneline
Write-Host ""
Write-Host " When ready to ship to production, run:" -ForegroundColor Cyan
Write-Host "   git push origin main" -ForegroundColor White
Write-Host ""
Write-Host " To undo the commit if you change your mind:" -ForegroundColor Cyan
Write-Host "   git reset --soft HEAD~1" -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""
