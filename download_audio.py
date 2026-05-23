import os
import urllib.request
import shutil

# Base directory
public_dir = "public/audio"

# URLs for placeholder audio
urls = {
    "ambience": "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
    "sfx": "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
    "ui": "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
    "music": "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3"
}

# The files expected by audioManager.ts
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
        "seal_break_standard.mp3", "seal_break_gold.mp3",
        "rune_inscription_standard.mp3", "rune_inscription_gold.mp3",
        "beacon_lighting_standard.mp3", "beacon_lighting_gold.mp3",
        "bridge_repair_standard.mp3", "bridge_repair_gold.mp3",
        "compass_calibration_standard.mp3", "compass_calibration_gold.mp3",
        "ward_placement_standard.mp3", "ward_placement_gold.mp3",
        "level_up.mp3",
        "badge_common.mp3", "badge_uncommon.mp3", "badge_rare.mp3", "badge_epic.mp3", "badge_legendary.mp3"
    ],
    "ui": [
        "click.mp3", "confirm.mp3", "error.mp3", "hover.mp3"
    ],
    "music": [
        "boss_unraveller.mp3", "boss_pale_architect.mp3", "boss_gravemind.mp3",
        "stage_village.mp3", "stage_forest.mp3", "stage_arena.mp3", "stage_artisan.mp3",
        "stage_mine.mp3", "stage_harbour.mp3", "stage_crossroads.mp3", "stage_capital.mp3"
    ]
}

os.makedirs(public_dir, exist_ok=True)

for category, url in urls.items():
    cat_dir = os.path.join(public_dir, category)
    os.makedirs(cat_dir, exist_ok=True)
    
    # Download placeholder file
    tmp_path = os.path.join(public_dir, f"tmp_{category}.mp3")
    print(f"Downloading {category} placeholder...")
    try:
        urllib.request.urlretrieve(url, tmp_path)
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        continue
    
    # Copy to all expected paths
    for filename in paths[category]:
        dest_path = os.path.join(cat_dir, filename)
        shutil.copy(tmp_path, dest_path)
        print(f"Created {dest_path}")
    
    os.remove(tmp_path)

print("Done generating placeholder audio files.")
