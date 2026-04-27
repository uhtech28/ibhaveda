import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    content = f.read()

# 1. Force brightness to 100%
content = content.replace("this.updateBrightnessFilter(finalBrightness);", "this.updateBrightnessFilter(100);")

# 2. Repeat Tilemap across the whole width
# We'll create 8 tilemaps, one for each biome
repeat_map = """
    // Create 8 copies of the map to cover the whole world width
    const scale = 2.5;
    for (let i = 0; i < 8; i++) {
      layerNames.forEach(name => {
        const layer = this.map.createLayer(name, phaserTilesets, i * this.BIOME_WIDTH, 0);
        if (layer) {
          layer.setScale(scale);
          layer.setY(this.MAP_HEIGHT - this.map.heightInPixels * scale);
          this.backgroundLayer.add(layer);
        }
      });
    }
"""

content = content.replace('layerNames.forEach(name => {', '/* Original map loop removed */')
# Wait, I'll just replace the whole createTilemap body

new_body = """  private createTilemap(): void {
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
  }"""

import re
content = re.sub(r"private createTilemap\(\): void \{.*?\}", new_body, content, flags=re.DOTALL)

# 3. Comment out distracting effects
content = content.replace("this.createClouds();", "// this.createClouds();")
content = content.replace("this.createAtmosphericEffects();", "// this.createAtmosphericEffects();")
content = content.replace("this.createVolumetricLighting();", "// this.createVolumetricLighting();")

with open(file_path, 'w') as f:
    f.write(content)
print("Updated map repetition, fixed brightness, and disabled distracting effects.")
