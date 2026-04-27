import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    lines = f.readlines()

# Find the end of the layerNames.forEach block
for i, line in enumerate(lines):
    if "this.backgroundLayer.add(layer);" in line:
        # Check next lines
        if i + 1 < len(lines) and "}" in lines[i+1]:
             if i + 2 < len(lines) and "private createBiomeZones" in lines[i+2]:
                 # Missing two closing braces
                 lines.insert(i+2, "    });\n  }\n\n")
                 break

with open(file_path, 'w') as f:
    f.writelines(lines)
print("Manually fixed braces in WorldMapScene.ts")
