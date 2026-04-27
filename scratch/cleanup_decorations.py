import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "private addBiomeDecorations" in line:
        new_lines.append("  private addBiomeDecorations(container: Phaser.GameObjects.Container, biome: BiomeConfig): void { }\n")
        skip = True
        continue
    
    # If we are skipping, wait until we find the next method
    if skip:
        if "private drawVillageDecorations" in line:
            skip = False # Stop skipping, but we want to skip this method too!
        else:
            continue

    # We want to skip all the drawing helper methods too
    if "private drawVillageDecorations" in line or \
       "private drawForestDecorations" in line or \
       "private drawMountainDecorations" in line or \
       "private drawCanyonDecorations" in line or \
       "private drawDesertDecorations" in line or \
       "private drawIceDecorations" in line or \
       "private drawSwampDecorations" in line or \
       "private drawOasisDecorations" in line:
        skip = True
        continue
    
    if not skip:
        new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)
print("Cleaned up WorldMapScene.ts by removing old procedural decoration methods.")
