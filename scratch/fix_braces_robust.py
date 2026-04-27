import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    content = f.read()

target = "this.backgroundLayer.add(layer);\n      }\n\n  private createBiomeZones"
replacement = "this.backgroundLayer.add(layer);\n      }\n    });\n  }\n\n  private createBiomeZones"

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, 'w') as f:
        f.write(content)
    print("Fixed!")
else:
    # Try with different whitespace
    import re
    content = re.sub(r"this\.backgroundLayer\.add\(layer\);\s+\}\s+private createBiomeZones", 
                     "this.backgroundLayer.add(layer);\n      }\n    });\n  }\n\n  private createBiomeZones", 
                     content)
    with open(file_path, 'w') as f:
        f.write(content)
    print("Fixed with regex!")
