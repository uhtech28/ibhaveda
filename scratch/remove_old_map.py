import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    content = f.read()

# 1. Comment out createSnakePath in create()
content = content.replace("this.createSnakePath();", "// this.createSnakePath();")

# 2. Make drawBiomeBackground do nothing (or just draw a simple sky)
draw_bg_target = """  private drawBiomeBackground(
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
  }"""

# Actually, the user wants to REMOVE the old map. 
# My previous update_scene.py already added the Tileset_Ground to drawBiomeBackground.
# I should remove the procedural graphics part completely.

draw_bg_replacement = """  private drawBiomeBackground(
    container: Phaser.GameObjects.Container,
    biome: BiomeConfig,
  ): void {
    // Procedural background removed in favor of Tileset map
  }"""

content = content.replace(draw_bg_target, draw_bg_replacement)

# 3. Make addBiomeDecorations do nothing
# Let's find the method block
import re
content = re.sub(r"private addBiomeDecorations\(.*?\{.*?\}", 
                 "private addBiomeDecorations(container: Phaser.GameObjects.Container, biome: BiomeConfig): void { }", 
                 content, flags=re.DOTALL)

with open(file_path, 'w') as f:
    f.write(content)
print("Removed old procedural map background and decorations.")
