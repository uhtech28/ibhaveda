import os
import urllib.request
import shutil

# Base directory
public_dir = "public/audio"

# URLs for placeholder audio
urls = {
    "sfx": "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
    "ui": "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
    "music": "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3"
}

# The files expected by audioManager.ts
paths = {
    "sfx": [
        "seal_break_standard.ogg", "seal_break_gold.ogg",
        "rune_inscription_standard.ogg", "rune_inscription_gold.ogg",
        "beacon_lighting_standard.ogg", "beacon_lighting_gold.ogg",
        "bridge_repair_standard.ogg", "bridge_repair_gold.ogg",
        "compass_calibration_standard.ogg", "compass_calibration_gold.ogg",
        "ward_placement_standard.ogg", "ward_placement_gold.ogg",
        "level_up.ogg",
        "badge_common.ogg", "badge_uncommon.ogg", "badge_rare.ogg", "badge_epic.ogg", "badge_legendary.ogg"
    ],
    "ui": [
        "click.ogg", "confirm.ogg", "error.ogg", "hover.ogg"
    ],
    "music": [
        "boss_unraveller.ogg", "boss_pale_architect.ogg", "boss_gravemind.ogg",
        "stage_village.ogg", "stage_forest.ogg", "stage_arena.ogg", "stage_artisan.ogg",
        "stage_mine.ogg", "stage_harbour.ogg", "stage_crossroads.ogg", "stage_capital.ogg"
    ]
}

os.makedirs(public_dir, exist_ok=True)

for category, url in urls.items():
    cat_dir = os.path.join(public_dir, category)
    os.makedirs(cat_dir, exist_ok=True)
    
    # Download placeholder file
    tmp_path = os.path.join(public_dir, f"tmp_{category}.ogg")
    print(f"Downloading {category} placeholder...")
    try:
        urllib.request.urlretrieve(url, tmp_path)
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        continue
    
    # Copy to all expected paths ONLY IF IT DOESN'T EXIST (or we just copy because it's .ogg and shouldn't overwrite .mp3)
    for filename in paths[category]:
        dest_path = os.path.join(cat_dir, filename)
        shutil.copy(tmp_path, dest_path)
        print(f"Created {dest_path}")
    
    os.remove(tmp_path)

print("Done generating placeholder .ogg audio files.")
