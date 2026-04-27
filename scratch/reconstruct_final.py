import sys
import re

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip_until_brace = 0
in_skip_method = False

for line in lines:
    # 1. Add map property
    if "private backgroundLayer!:" in line:
        new_lines.append("  private map!: Phaser.Tilemaps.Tilemap;\n")
        new_lines.append(line)
        continue
    
    # 2. Update handleUpdateBrightness to force 100%
    if "this.updateBrightnessFilter(finalBrightness);" in line:
        new_lines.append("    this.updateBrightnessFilter(100); // Forced for visibility\n")
        continue

    # 3. Empty drawBiomeBackground and addBiomeDecorations
    if "private drawBiomeBackground(" in line:
        new_lines.append("  private drawBiomeBackground(container: Phaser.GameObjects.Container, biome: BiomeConfig): void { }\n")
        in_skip_method = True
        skip_until_brace = 0
        continue
    
    if "private addBiomeDecorations(" in line:
        new_lines.append("  private addBiomeDecorations(container: Phaser.GameObjects.Container, biome: BiomeConfig): void { }\n")
        in_skip_method = True
        skip_until_brace = 0
        continue

    if in_skip_method:
        skip_until_brace += line.count('{')
        skip_until_brace -= line.count('}')
        if skip_until_brace < 0:
            in_skip_method = False
        continue

    # 4. Replace createTilemap call in create()
    if "this.createBiomeZones();" in line:
        new_lines.append("    this.createTilemap();\n")
        new_lines.append(line)
        continue
    
    # 5. Comment out specific calls in create()
    if any(x in line for x in ["this.createWaterRipples();", "this.createShorelineFoam();", "this.createSnakePath();", "this.createClouds();", "this.createAtmosphericEffects();", "this.createVolumetricLighting();"]):
        new_lines.append("// " + line)
        continue

    new_lines.append(line)

# 6. Append the new createTilemap method at the end of the class (before the last brace)
# Actually, it's better to insert it before createBiomeZones signature.
final_lines = []
create_tilemap_method = """
  /**
   * Creates the Tiled map and its layers, integrated into the background.
   */
  private createTilemap(): void {
    this.map = this.make.tilemap({ key: "beginning_fields" });

    const tilesetMapping = [
      { name: "Atlas_Buildings", key: "Buildings" },
      { name: "Buildings", key: "House_Hay_1" },
      { name: "Objects_Props", key: "Sign_1" },
      { name: "Objects_Rocks", key: "Rock_Brown_1" },
      { name: "Objects_Trees", key: "Tree_Emerald_1" },
      { name: "Atlas_Props", key: "Props" },
      { name: "Atlas_Rocks", key: "Rocks" },
      { name: "Tileset_Ground", key: "Tileset_Ground" },
      { name: "Tileset_RockSlope", key: "Tileset_RockSlope" },
      { name: "Tileset_RockSlope_Simple", key: "Tileset_RockSlope_Simple" },
      { name: "Tileset_Water", key: "Tileset_Water" },
      { name: "Road", key: "Tileset_Road" },
      { name: "Atlas_Trees_Bushes", key: "Trees_Bushes" },
      { name: "Animation_Flowers_Red", key: "Animation_Flowers_Red" },
      { name: "Animation_Flowers_White", key: "Animation_Flowers_White" },
      { name: "Campfire", key: "Animation_Campfire" },
      { name: "Tileset_Shadow", key: "Tileset_Shadow" },
      { name: "Objects_Shadows", key: "Shadow_Round_16x16_Flat_Black" }
    ];

    const phaserTilesets = tilesetMapping.map(ts => this.map.addTilesetImage(ts.name, ts.key));

    const scale = 2.5; 
    const layerNames = ["Ground", "Road", "Flowers", "RockSlopes", "Water", "Shadows"];
    
    // Repeat map to cover width
    for (let i = 0; i < 8; i++) {
      layerNames.forEach(name => {
        const layer = this.map.createLayer(name, phaserTilesets, i * (this.map.widthInPixels * scale), 0);
        if (layer) {
          layer.setScale(scale);
          layer.setY(this.MAP_HEIGHT - this.map.heightInPixels * scale);
          this.backgroundLayer.add(layer);
        }
      });
    }
  }
"""

for line in new_lines:
    if "private createBiomeZones(): void {" in line:
        final_lines.append(create_tilemap_method)
    final_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(final_lines)
print("Reconstructed WorldMapScene.ts perfectly.")
