import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    lines = f.readlines()

# Update createTilemap to scale and position it better
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "private createTilemap(): void {" in line:
        start_idx = i
    if start_idx != -1 and line.strip() == "}":
        if i > start_idx:
            end_idx = i
            # Check if this is the end of the method (next line should be empty or next method)
            break

if start_idx != -1 and end_idx != -1:
    new_method = """  /**
   * Creates the Tiled map and its layers, integrated into the background.
   */
  private createTilemap(): void {
    this.map = this.make.tilemap({ key: "beginning_fields" });

    const tilesets = [
      { name: "Atlas_Buildings", key: "Atlas_Buildings" },
      { name: "Objects_Buildings", key: "Objects_Buildings" },
      { name: "Objects_Props", key: "Objects_Props" },
      { name: "Objects_Rocks", key: "Objects_Rocks" },
      { name: "Objects_Trees", key: "Objects_Trees" },
      { name: "Atlas_Props", key: "Atlas_Props" },
      { name: "Atlas_Rocks", key: "Atlas_Rocks" },
      { name: "Tileset_Ground", key: "Tileset_Ground" },
      { name: "Tileset_RockSlope", key: "Tileset_RockSlope" },
      { name: "Tileset_RockSlope_Simple", key: "Tileset_RockSlope_Simple" },
      { name: "Tileset_Water", key: "Tileset_Water" },
      { name: "Tilesets_Road", key: "Tilesets_Road" },
      { name: "Atlas_Trees_Bushes", key: "Atlas_Trees_Bushes" },
      { name: "Animation_Flowers_Red", key: "Animation_Flowers_Red" },
      { name: "Animation_Flowers_White", key: "Animation_Flowers_White" },
      { name: "Animation_Campfire", key: "Animation_Campfire" },
      { name: "Tileset_Shadow", key: "Tileset_Shadow" },
      { name: "Objects_Shadows", key: "Objects_Shadows" }
    ];

    const phaserTilesets = tilesets.map(ts => this.map.addTilesetImage(ts.name, ts.key));

    // Create layers with a scale factor to make them fit the world better
    // The map is 640x640, let's scale it up to cover a biome area
    const scale = 2.5; 
    
    const layerNames = ["Ground", "Road", "Flowers", "RockSlopes", "Water", "Shadows"];
    layerNames.forEach(name => {
      const layer = this.map.createLayer(name, phaserTilesets, 0, 0);
      if (layer) {
        layer.setScale(scale);
        // Place it at the start of the map
        layer.setY(this.MAP_HEIGHT - this.map.heightInPixels * scale);
        this.backgroundLayer.add(layer);
      }
    });
  }
"""
    lines[start_idx:end_idx+1] = [new_method]
    with open(file_path, 'w') as f:
        f.writelines(lines)
    print("Updated createTilemap with scaling and positioning.")
else:
    print(f"Could not find createTilemap block: {start_idx}, {end_idx}")
