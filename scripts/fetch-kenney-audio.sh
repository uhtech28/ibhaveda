#!/usr/bin/env bash
# Fetch CC0 Kenney audio (via OpenGameArt mirrors + Godot ports) into public/audio/.
# License: CC0 — https://kenney.nl — see public/audio/ATTRIBUTION.md

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUDIO="$ROOT/public/audio"
TMP="${TMPDIR:-/tmp}/ibhaveda-audio-$$"
mkdir -p "$TMP" "$AUDIO/ui" "$AUDIO/sfx" "$AUDIO/ambience" "$AUDIO/music"

download() {
  local url="$1" out="$2"
  echo "Downloading $(basename "$out")..."
  curl -fsSL "$url" -o "$out"
}

unzip_to() {
  local zip="$1" dir="$2"
  mkdir -p "$dir"
  unzip -q -o "$zip" -d "$dir"
}

# First match under dir (Kenney zips vary in layout)
find_one() {
  local dir="$1" pattern="$2"
  find "$dir" -type f -iname "$pattern" 2>/dev/null | head -1
}

copy_src() {
  local src="$1" dest="$2"
  if [[ -n "$src" && -f "$src" ]]; then
    cp "$src" "$dest"
    echo "  -> ${dest#$AUDIO/}"
  else
    echo "  MISSING: ${dest#$AUDIO/}" >&2
  fi
}

mirror_mp3() {
  local base="$1"
  if [[ -f "${base}.ogg" && ! -f "${base}.mp3" ]]; then
    cp "${base}.ogg" "${base}.mp3"
  elif [[ -f "${base}.wav" && ! -f "${base}.mp3" ]]; then
    cp "${base}.wav" "${base}.mp3"
  fi
}

echo "=== Fetching packs ==="
download "https://opengameart.org/sites/default/files/kenney_interfaceSounds.zip" "$TMP/interface.zip"
download "https://github.com/Boyquotes/kenney-impact-sounds-for-godot/archive/refs/heads/main.zip" "$TMP/impact.zip"
download "https://opengameart.org/sites/default/files/RPGsounds_Kenney.zip" "$TMP/rpg.zip"
download "https://opengameart.org/sites/default/files/kenney_casino-audio.zip" "$TMP/casino.zip"
unzip_to "$TMP/interface.zip" "$TMP/interface"
unzip_to "$TMP/impact.zip" "$TMP/impact"
unzip_to "$TMP/rpg.zip" "$TMP/rpg"
unzip_to "$TMP/casino.zip" "$TMP/casino"

IF="$TMP/interface"
IM="$TMP/impact"
IR="$TMP/rpg"
IC="$TMP/casino"

echo "=== UI sounds ==="
copy_src "$(find_one "$IF" 'click_001.ogg')" "$AUDIO/ui/click.ogg"
copy_src "$(find_one "$IF" 'confirmation_001.ogg')" "$AUDIO/ui/confirm.ogg"
copy_src "$(find_one "$IF" 'error_001.ogg')" "$AUDIO/ui/error.ogg"
copy_src "$(find_one "$IF" 'tick_001.ogg')" "$AUDIO/ui/hover.ogg"

echo "=== Progression SFX ==="
copy_src "$(find_one "$IC" 'chips-collide-1.ogg')" "$AUDIO/sfx/gold_gain.ogg" || \
  copy_src "$(find_one "$IC" 'chips*.ogg')" "$AUDIO/sfx/gold_gain.ogg"

copy_src "$(find_one "$IR" 'handleCoins.ogg')" "$AUDIO/sfx/badge_common.ogg"
copy_src "$(find_one "$IR" 'handleCoins2.ogg')" "$AUDIO/sfx/badge_uncommon.ogg"
copy_src "$(find_one "$IR" 'metalClick.ogg')" "$AUDIO/sfx/badge_rare.ogg"
copy_src "$(find_one "$IR" 'chop.ogg')" "$AUDIO/sfx/level_up.ogg"
copy_src "$(find_one "$IR" 'metalPot3.ogg')" "$AUDIO/sfx/badge_epic.ogg"
copy_src "$(find_one "$IR" 'doorOpen_2.ogg')" "$AUDIO/sfx/badge_legendary.ogg"

echo "=== Checkpoint SFX ==="
copy_src "$(find_one "$IM" 'impact_mining_000.ogg')" "$AUDIO/sfx/seal_break_standard.ogg"
copy_src "$(find_one "$IM" 'impact_mining_001.ogg')" "$AUDIO/sfx/seal_break_gold.ogg"
copy_src "$(find_one "$IR" 'bookOpen.ogg')" "$AUDIO/sfx/rune_inscription_standard.ogg"
copy_src "$(find_one "$IR" 'bookPlace3.ogg')" "$AUDIO/sfx/rune_inscription_gold.ogg"
copy_src "$(find_one "$IM" 'impact_bell_heavy_000.ogg')" "$AUDIO/sfx/beacon_lighting_standard.ogg"
copy_src "$(find_one "$IM" 'impact_bell_heavy_001.ogg')" "$AUDIO/sfx/beacon_lighting_gold.ogg"
copy_src "$(find_one "$IM" 'impact_wood_heavy_000.ogg')" "$AUDIO/sfx/bridge_repair_standard.ogg"
copy_src "$(find_one "$IM" 'impact_wood_heavy_001.ogg')" "$AUDIO/sfx/bridge_repair_gold.ogg"
copy_src "$(find_one "$IM" 'impact_metal_medium_000.ogg')" "$AUDIO/sfx/compass_calibration_standard.ogg"
copy_src "$(find_one "$IM" 'impact_metal_medium_001.ogg')" "$AUDIO/sfx/compass_calibration_gold.ogg"
copy_src "$(find_one "$IM" 'impact_glass_medium_000.ogg')" "$AUDIO/sfx/ward_placement_standard.ogg"
copy_src "$(find_one "$IM" 'impact_glass_medium_001.ogg')" "$AUDIO/sfx/ward_placement_gold.ogg"

echo "=== MP3 mirrors for Howler fallback ==="
for dir in ui sfx; do
  for f in "$AUDIO/$dir"/*.{ogg,wav}; do
    [[ -f "$f" ]] || continue
    mirror_mp3 "${f%.*}"
  done
done

rm -rf "$TMP"
echo "Done. Kenney CC0 UI/SFX installed under public/audio/"
