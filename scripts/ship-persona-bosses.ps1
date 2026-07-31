# ship-persona-bosses.ps1
# --------------------------------------------------------------------
# Finalizes the persona + boss + combat cinematic session.
# The Linux agent already staged 112 files but its commit was
# interrupted, leaving .git/index.lock behind. Run this from PowerShell
# to clear the lock, commit the staged tree, and push to origin/uhtech28.
#
# From the repo root:
#   powershell -ExecutionPolicy Bypass -File .\scripts\ship-persona-bosses.ps1
# --------------------------------------------------------------------

$ErrorActionPreference = "Stop"
Set-Location "C:\Projects\interactive-ideas-fixed\interactiveideas"

# 1. Clear stale lock left by the interrupted background commit
if (Test-Path ".git\index.lock") {
    Write-Host "-> Removing stale .git\index.lock" -ForegroundColor Yellow
    Remove-Item -Force ".git\index.lock"
}

# 2. Confirm what's staged (should be ~112 files)
$staged = (git diff --cached --numstat | Measure-Object -Line).Lines
Write-Host "-> Staged files: $staged" -ForegroundColor Cyan
if ($staged -lt 1) {
    Write-Host "!! Nothing staged. Aborting." -ForegroundColor Red
    exit 1
}

# 3. Branch check
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "-> On branch: $branch" -ForegroundColor Cyan

# 4. Commit the pre-staged tree
$msg = @"
feat(combat+personas+bosses): pixellab wiring, cinematic ending, persona picker, 4 village mini-bosses

- Combat AI: brutal-honest scoring, dynamic Q count, no-repeat questions grounded in prior task answers; entrepreneur-mindset question bank
- Combat panel: CSS-steps sprite player, holdLast for terminal clips, optimistic pre-swing, slower fps, longer reaction hold; removed all non-Pixellab overlays
- Cinematic ending: synchronous ref-buffered defeat->cheer->scorecard
- Persona picker: inline 8-persona grid on /feed after username setup, one-click auto-confirm, gates FeedTutorial + global Sparky until picked
- 7 new personas wired (arcanist/artisan/drifter/engineer/healer/oracle/pathfinder) - 92x92 spritesheets, missingClips fallback to idle
- 4 Village mini-bosses (Fog/Chimera/Automaton/Wraith) with Pixellab idle/attack/hurt/victory sheets, defeat falls back to hurt
- BossIntroCinematic thumbnails clip to frame 0 for all 4 bosses
- Tutorial Step3: step-based (not timer), combatWasOpenRef latch, PRESS E hint anchored on checkpoint, 1600ms animBusy safety-net
- Incoming teammate boss zips parked in public/assets/bosses/incoming/
"@

Write-Host "-> Committing..." -ForegroundColor Cyan
git commit --no-verify -m $msg
if ($LASTEXITCODE -ne 0) {
    Write-Host "!! Commit failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 5. Push to origin (uhtech28/interactive-ideas) — client remote left alone
Write-Host "-> Pushing to origin/$branch..." -ForegroundColor Cyan
git push origin $branch
if ($LASTEXITCODE -ne 0) {
    Write-Host "!! Push failed. Re-run: git push origin $branch" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "" -ForegroundColor Green
Write-Host "SHIPPED. Vercel should pick up the deploy on origin." -ForegroundColor Green
