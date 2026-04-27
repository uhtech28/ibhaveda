import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "// Ground texture with premium details" in line:
        skip = True
        continue
    if "case 6: // The Harbour" in line:
        skip = False
        # continue to add this line
    
    if not skip:
        new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)

# Also fix the create() method
with open(file_path, 'r') as f:
    content = f.read()

content = content.replace("this.createBiomeZones();\n    this.createWaterRipples();\n    this.createShorelineFoam();\n    this.createSnakePath();", 
                         "this.createTilemap();\n    this.createBiomeZones();\n    // this.createWaterRipples();\n    // this.createShorelineFoam();\n    // this.createSnakePath();")

with open(file_path, 'w') as f:
    f.write(content)

print("Cleaned up leftovers and updated create() method.")
