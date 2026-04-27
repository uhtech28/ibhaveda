import sys
import re

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    lines = f.readlines()

# 1. Add private member for tilemap
for i, line in enumerate(lines):
    if "private backgroundLayer!:" in line:
        lines.insert(i, "  private map!: Phaser.Tilemaps.Tilemap;\n")
        break

# 2. Update create()
for i, line in enumerate(lines):
    if "this.createBiomeZones();" in line:
        lines.insert(i, "    this.createTilemap();\n")
        # Comment out snake path
        for j in range(i, i+10):
            if "this.createSnakePath();" in lines[j]:
                lines[j] = lines[j].replace("this.createSnakePath();", "// this.createSnakePath();")
                break
        break

# 3. Define createTilemap method
new_method = """
  /**
   * Creates the Tiled map and its layers, integrated into the background.
   */
  private createTilemap(): void {
    this.map = this.make.tilemap({ key: "beginning_fields" });

    const tilesetMapping = [
      { name: "Atlas_Buildings", key: "Buildings" },
      { name: "Objects_Buildings", key: "House_Hay_1" },
      { name: "Objects_Props", key: "Sign_1" },
      { name: "Objects_Rocks", key: "Rock_Brown_1" },
      { name: "Objects_Trees", key: "Tree_Emerald_1" },
      { name: "Atlas_Props", key: "Props" },
      { name: "Atlas_Rocks", key: "Rocks" },
      { name: "Tileset_Ground", key: "Tileset_Ground" },
      { name: "Tileset_RockSlope", key: "Tileset_RockSlope" },
      { name: "Tileset_RockSlope_Simple", key: "Tileset_RockSlope_Simple" },
      { name: "Tileset_Water", key: "Tileset_Water" },
      { name: "Tilesets_Road", key: "Tileset_Road" },
      { name: "Atlas_Trees_Bushes", key: "Trees_Bushes" },
      { name: "Animation_Flowers_Red", key: "Animation_Flowers_Red" },
      { name: "Animation_Flowers_White", key: "Animation_Flowers_White" },
      { name: "Animation_Campfire", key: "Animation_Campfire" },
      { name: "Tileset_Shadow", key: "Tileset_Shadow" },
      { name: "Objects_Shadows", key: "Shadow_Round_16x16_Flat_Black" }
    ];

    const phaserTilesets = tilesetMapping.map(ts => this.map.addTilesetImage(ts.name, ts.key));

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

# Insert createTilemap before createBiomeZones
for i, line in enumerate(lines):
    if "private createBiomeZones(): void {" in line:
        lines.insert(i, new_method)
        break

# 4. Empty drawBiomeBackground and addBiomeDecorations
for i, line in enumerate(lines):
    if "private drawBiomeBackground(" in line:
        # Find closing brace
        for j in range(i+1, len(lines)):
            if lines[j].strip() == "}":
                lines[i+1:j] = ["    // Procedural background removed\n"]
                break
    if "private addBiomeDecorations(" in line:
        # Find closing brace
        for j in range(i+1, len(lines)):
            if lines[j].strip() == "}":
                lines[i+1:j] = ["    // Procedural decorations removed\n"]
                break

with open(file_path, 'w') as f:
    f.writelines(lines)
print("Successfully re-applied integration and removed old map elements.")
