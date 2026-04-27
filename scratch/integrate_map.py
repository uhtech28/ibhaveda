import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    lines = f.readlines()

# 1. Add private member for tilemap
for i, line in enumerate(lines):
    if "private backgroundLayer!:" in line:
        lines.insert(i, "  private map!: Phaser.Tilemaps.Tilemap;\n")
        break

# 2. Add createTilemap method call in create()
for i, line in enumerate(lines):
    if "this.createBiomeZones();" in line:
        lines.insert(i, "    this.createTilemap();\n")
        break

# 3. Define createTilemap method
new_method = """
  /**
   * Creates the Tiled map and its layers
   */
  private createTilemap(): void {
    this.map = this.make.tilemap({ key: "beginning_fields" });

    // Define tilesets
    // Note: The names here must match the names in the Tiled editor / TSX files
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

    // Create layers
    const groundLayer = this.map.createLayer("Ground", phaserTilesets, 0, 0);
    const roadLayer = this.map.createLayer("Road", phaserTilesets, 0, 0);
    const flowersLayer = this.map.createLayer("Flowers", phaserTilesets, 0, 0);
    const rockSlopesLayer = this.map.createLayer("RockSlopes", phaserTilesets, 0, 0);
    const waterLayer = this.map.createLayer("Water", phaserTilesets, 0, 0);
    const shadowsLayer = this.map.createLayer("Shadows", phaserTilesets, 0, 0);

    // Add to background container
    if (groundLayer) this.backgroundLayer.add(groundLayer);
    if (roadLayer) this.backgroundLayer.add(roadLayer);
    if (flowersLayer) this.backgroundLayer.add(flowersLayer);
    if (rockSlopesLayer) this.backgroundLayer.add(rockSlopesLayer);
    if (waterLayer) this.backgroundLayer.add(waterLayer);
    if (shadowsLayer) this.backgroundLayer.add(shadowsLayer);

    // Scale map to fit biome or use as is
    // For now, let's keep it at origin (0,0)
  }
"""

# Find a good place to insert the method (after createBiomeZones)
for i, line in enumerate(lines):
    if "private createBiomeZones(): void {" in line:
        lines.insert(i, new_method)
        break

with open(file_path, 'w') as f:
    f.writelines(lines)
print("Successfully integrated tilemap into WorldMapScene.ts")
