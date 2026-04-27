import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    lines = f.readlines()

# Update createTilemap with the correct mapping
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "private createTilemap(): void {" in line:
        start_idx = i
    if start_idx != -1 and line.strip() == "}":
        if i > start_idx:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    new_method = """  /**
   * Creates the Tiled map and its layers, integrated into the background.
   */
  private createTilemap(): void {
    this.map = this.make.tilemap({ key: "beginning_fields" });

    // Map Tileset Name in Tiled -> Asset Key in Phaser
    const tilesetMapping = [
      { name: "Atlas_Buildings", key: "Buildings" },
      { name: "Objects_Buildings", key: "House_Hay_1" }, // Note: collection tilesets use dummy keys but we need to provide one
      { name: "Objects_Props", key: "Sign_1" },
      { name: "Objects_Rocks", key: "Rock_Brown_1" },
      { name: "Objects_Trees", key: "Tree_Emerald_1" },
      { name: "Atlas_Props", key: "Props" },
      { name: "Atlas_Rocks", key: "Rocks" },
      { name: "Tileset_Ground", key: "Tileset_Ground" },
      { name: "Tileset_RockSlope", key: "Tileset_RockSlope" },
      { name: "Tileset_RockSlope_Simple", key: "Tileset_RockSlope_Simple" },
      { name: "Tileset_Water", key: "Tileset_Water" },
      { name: "Tilesets_Road", key: "Tilesets_Road" },
      { name: "Atlas_Trees_Bushes", key: "Trees_Bushes" },
      { name: "Animation_Flowers_Red", key: "Animation_Flowers_Red" },
      { name: "Animation_Flowers_White", key: "Animation_Flowers_White" },
      { name: "Animation_Campfire", key: "Animation_Campfire" },
      { name: "Tileset_Shadow", key: "Tileset_Shadow" },
      { name: "Objects_Shadows", key: "Shadow_Round_16x16_Flat_Black" }
    ];

    const phaserTilesets = tilesetMapping.map(ts => this.map.addTilesetImage(ts.name, ts.key));

    // Create layers
    const scale = 2.5; 
    const layerNames = ["Ground", "Road", "Flowers", "RockSlopes", "Water", "Shadows"];
    
    layerNames.forEach(name => {
      const layer = this.map.createLayer(name, phaserTilesets, 0, 0);
      if (layer) {
        layer.setScale(scale);
        layer.setY(this.MAP_HEIGHT - this.map.heightInPixels * scale);
        this.backgroundLayer.add(layer);
      }
    });
  }
"""
    lines[start_idx:end_idx+1] = [new_method]
    with open(file_path, 'w') as f:
        f.writelines(lines)
    print("Updated WorldMapScene.ts with correct tileset mappings.")
else:
    print(f"Could not find createTilemap block: {start_idx}, {end_idx}")
