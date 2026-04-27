import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/utils/asset-loader.ts"
with open(file_path, 'r') as f:
    lines = f.readlines()

# Find the Fan-tasy loading block and replace it
start_line = -1
end_line = -1
for i, line in enumerate(lines):
    if "// --- Fan-tasy Tileset Assets ---" in line or "// Fan-tasy Tileset Assets" in line:
        start_line = i
    if start_line != -1 and "scene.load.tilemapTiledJSON" in line:
        end_line = i
        break

if start_line != -1 and end_line != -1:
    new_loading = """    // --- Fan-tasy Tileset Assets ---
    const fanTasyPath = "/assets/fan-tasy";
    
    // Core Tilesets
    scene.load.image("Tileset_Ground", `${fanTasyPath}/Tileset_Ground.png`);
    scene.load.image("Tileset_Water", `${fanTasyPath}/Tileset_Water.png`);
    scene.load.image("Tileset_RockSlope", `${fanTasyPath}/Tileset_RockSlope.png`);
    scene.load.image("Tileset_RockSlope_Simple", `${fanTasyPath}/Tileset_RockSlope_Simple.png`);
    scene.load.image("Tilesets_Road", `${fanTasyPath}/Tilesets_Road.png`);
    scene.load.image("Tileset_Shadow", `${fanTasyPath}/Tileset_Shadow.png`);

    // Atlases
    scene.load.image("Buildings", `${fanTasyPath}/Buildings.png`);
    scene.load.image("Props", `${fanTasyPath}/Props.png`);
    scene.load.image("Rocks", `${fanTasyPath}/Rocks.png`);
    scene.load.image("Trees_Bushes", `${fanTasyPath}/Trees_Bushes.png`);

    // Animations
    scene.load.image("Animation_Flowers_Red", `${fanTasyPath}/Flowers_Red.png`);
    scene.load.image("Animation_Flowers_White", `${fanTasyPath}/Flowers_White.png`);
    scene.load.image("Animation_Campfire", `${fanTasyPath}/Animation_Campfire.png`);

    // Image Collections (Individual objects)
    const objects = [
      "House_Hay_1", "House_Hay_2", "House_Hay_3", "House_Hay_4_Purple",
      "CityWall_Gate_1", "Well_Hay_1", "Sign_1", "Sign_2", "Table_Medium_1",
      "Bench_1", "Bench_3", "Barrel_Small_Empty", "Basket_Empty", 
      "Crate_Large_Empty", "Crate_Medium_Closed", "Crate_Water_1",
      "LampPost_3", "BulletinBoard_1", "HayStack_2", "Plant_2", "Sack_3",
      "Rock_Brown_1", "Rock_Brown_2", "Rock_Brown_4", "Rock_Brown_6", "Rock_Brown_9",
      "Tree_Emerald_1", "Tree_Emerald_2", "Tree_Emerald_3", "Tree_Emerald_4",
      "Bush_Emerald_1", "Bush_Emerald_2", "Bush_Emerald_3", "Bush_Emerald_4",
      "Bush_Emerald_5", "Bush_Emerald_6", "Bush_Emerald_7"
    ];
    objects.forEach(obj => scene.load.image(obj, `${fanTasyPath}/${obj}.png`));

    // Load main Tilemap (JSON with embedded tilesets)
    scene.load.tilemapTiledJSON("beginning_fields", `${fanTasyPath}/Beginning Fields.tmj`);
"""
    lines[start_line:end_line+1] = [new_loading]
    with open(file_path, 'w') as f:
        f.writelines(lines)
    print("Successfully updated AssetLoader.ts with correct image keys and embedded map.")
else:
    print(f"Could not find Fan-tasy block: {start_line}, {end_line}")
