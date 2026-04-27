import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    lines = f.readlines()

start_line = -1
end_line = -1

for i, line in enumerate(lines):
    if "private drawBiomeBackground(" in line:
        start_line = i
    if start_line != -1 and "container.add(graphics);" in line:
        if i > start_line:
            end_line = i
            break

if start_line != -1 and end_line != -1:
    new_content = """  private drawBiomeBackground(
    container: Phaser.GameObjects.Container,
    biome: BiomeConfig,
  ): void {
    const graphics = this.add.graphics();

    // Sky - Keep procedural for now
    graphics.fillStyle(biome.colors.sky, 1);
    graphics.fillRect(0, 0, this.BIOME_WIDTH, this.MAP_HEIGHT * 0.6);

    // Ground - Use the new Tileset_Ground
    const groundSprite = this.add.tileSprite(
      0, 
      this.MAP_HEIGHT * 0.6, 
      this.BIOME_WIDTH, 
      this.MAP_HEIGHT * 0.4, 
      "Tileset_Ground"
    );
    groundSprite.setOrigin(0, 0);
    container.add(groundSprite);

    container.add(graphics);
  }
"""
    lines[start_line:end_line+2] = [new_content]
    with open(file_path, 'w') as f:
        f.writelines(lines)
    print("Successfully updated WorldMapScene.ts")
else:
    print(f"Could not find the target block: {start_line}, {end_line}")
