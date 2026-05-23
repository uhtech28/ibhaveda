import os
import json

paths = {
    "ambience": [
        "village.mp3", "village.ogg",
        "forest.mp3", "forest.ogg",
        "arena.mp3", "arena.ogg",
        "artisan.mp3", "artisan.ogg",
        "mine.mp3", "mine.ogg",
        "harbour.mp3", "harbour.ogg",
        "crossroads.mp3", "crossroads.ogg",
        "capital.mp3", "capital.ogg"
    ],
    "sfx": [
        "seal_break_standard.mp3", "seal_break_standard.ogg",
        "seal_break_gold.mp3", "seal_break_gold.ogg",
        "rune_inscription_standard.mp3", "rune_inscription_standard.ogg",
        "rune_inscription_gold.mp3", "rune_inscription_gold.ogg",
        "beacon_lighting_standard.mp3", "beacon_lighting_standard.ogg",
        "beacon_lighting_gold.mp3", "beacon_lighting_gold.ogg",
        "bridge_repair_standard.mp3", "bridge_repair_standard.ogg",
        "bridge_repair_gold.mp3", "bridge_repair_gold.ogg",
        "compass_calibration_standard.mp3", "compass_calibration_standard.ogg",
        "compass_calibration_gold.mp3", "compass_calibration_gold.ogg",
        "ward_placement_standard.mp3", "ward_placement_standard.ogg",
        "ward_placement_gold.mp3", "ward_placement_gold.ogg",
        "level_up.mp3", "level_up.ogg",
        "badge_common.mp3", "badge_common.ogg",
        "badge_uncommon.mp3", "badge_uncommon.ogg",
        "badge_rare.mp3", "badge_rare.ogg",
        "badge_epic.mp3", "badge_epic.ogg",
        "badge_legendary.mp3", "badge_legendary.ogg",
        "gold_gain.mp3",
    ],
    "ui": [
        "click.mp3", "click.ogg",
        "confirm.mp3", "confirm.ogg",
        "error.mp3", "error.ogg",
        "hover.mp3", "hover.ogg",
    ],
    "music": [
        "boss_unraveller.mp3", "boss_unraveller.ogg",
        "boss_pale_architect.mp3", "boss_pale_architect.ogg",
        "boss_gravemind.mp3", "boss_gravemind.ogg",
        "stage_village.mp3", "stage_village.ogg",
        "stage_forest.mp3", "stage_forest.ogg",
        "stage_arena.mp3", "stage_arena.ogg",
        "stage_artisan.mp3", "stage_artisan.ogg",
        "stage_mine.mp3", "stage_mine.ogg",
        "stage_harbour.mp3", "stage_harbour.ogg",
        "stage_crossroads.mp3", "stage_crossroads.ogg",
        "stage_capital.mp3", "stage_capital.ogg",
    ]
}

missing = []
present = []
for cat, files in paths.items():
    for f in files:
        path = f"public/audio/{cat}/{f}"
        if os.path.exists(path):
            present.append(path)
        else:
            missing.append(path)

print(f"Missing: {len(missing)}")
for m in missing:
    print(m)
print(f"Present: {len(present)}")
