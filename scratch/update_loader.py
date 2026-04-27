import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/utils/asset-loader.ts"
with open(file_path, 'r') as f:
    lines = f.readlines()

target_line = -1
for i, line in enumerate(lines):
    if "scene.load.spritesheet(" in line and "persona_female_idle_sheet" in line:
        # Find the closing bracket and semicolon
        for j in range(i, len(lines)):
            if ");" in lines[j]:
                target_line = j
                break
        if target_line != -1:
            break

if target_line != -1:
    new_loading = """
    // --- Fan-tasy Tileset Assets ---
    const fanTasyPath = "/assets/fan-tasy";
    const tilesetImages = [
      "Tileset_Ground", "Tileset_Water", "Tileset_RockSlope", "Tilesets_Road",
      "Atlas_Buildings", "Atlas_Props", "Atlas_Rocks", "Atlas_Trees_Bushes",
      "Animation_Flowers_Red", "Animation_Flowers_White", "Animation_Campfire",
      "Objects_Buildings", "Objects_Props", "Objects_Rocks", "Objects_Shadows",
      "Objects_Trees", "Tileset_Shadow"
    ];

    tilesetImages.forEach(key => {
      scene.load.image(key, `${fanTasyPath}/${key}.png`);
    });

    // Load main TMX map
    scene.load.xml("beginning_fields_tmx", `${fanTasyPath}/Beginning Fields.tmx`);
"""
    lines.insert(target_line + 1, new_loading)
    with open(file_path, 'w') as f:
        f.writelines(lines)
    print("Successfully updated AssetLoader.ts")
else:
    print("Could not find the target line in AssetLoader.ts")
    # Debug: print first 20 non-comment lines
    uncommented = [l for l in lines if l.strip() and not l.strip().startswith("//")]
    print("First 10 uncommented lines:")
    for l in uncommented[:10]:
        print(f"  {l.strip()}")
