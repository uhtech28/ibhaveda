import sys
import re

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    content = f.read()

# 1. Add map property
if "private map!:" not in content:
    content = content.replace("private backgroundLayer!:", "private map!: Phaser.Tilemaps.Tilemap;\n  private backgroundLayer!:")

# 2. Add createTilemap call and comment out snake path
if "this.createTilemap();" not in content:
    content = content.replace("this.createBiomeZones();", "this.createTilemap();\n    this.createBiomeZones();")

content = content.replace("this.createSnakePath();", "// this.createSnakePath();")

# 3. Add createTilemap method
create_tilemap_method = """
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

if "private createTilemap(): void {" not in content:
    content = content.replace("private createBiomeZones(): void {", create_tilemap_method + "\n  private createBiomeZones(): void {")

# 4. Empty drawBiomeBackground and addBiomeDecorations SAFELY
# We match the entire method from the keyword to the closing brace (assuming simple structure)
# This is tricky with regex, so I'll do it line by line for these methods.

lines = content.splitlines()
new_lines = []
skip_until_brace_count = 0
in_target_method = False

for line in lines:
    if "private drawBiomeBackground(" in line:
        new_lines.append("  private drawBiomeBackground(container: Phaser.GameObjects.Container, biome: BiomeConfig): void {")
        new_lines.append("    // Procedural background removed")
        new_lines.append("  }")
        in_target_method = True
        skip_until_brace_count = 0
        continue
    
    if "private addBiomeDecorations(" in line:
        new_lines.append("  private addBiomeDecorations(container: Phaser.GameObjects.Container, biome: BiomeConfig): void {")
        new_lines.append("    // Procedural decorations removed")
        new_lines.append("  }")
        in_target_method = True
        skip_until_brace_count = 0
        continue
    
    if in_target_method:
        # Track braces to find the end of the method we are skipping
        skip_until_brace_count += line.count('{')
        skip_until_brace_count -= line.count('}')
        if skip_until_brace_count < 0: # We found the final closing brace
            in_target_method = False
        continue
        
    new_lines.append(line)

with open(file_path, 'w') as f:
    f.write("\n".join(new_lines) + "\n")
print("Successfully re-applied integration and safely removed old map elements.")
