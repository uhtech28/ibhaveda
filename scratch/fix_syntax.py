import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    content = f.read()

# Fix the double closing braces
content = content.replace("    });\n  }\n    });\n  }", "    });\n  }")
# Also check for other variations
content = content.replace("  }\n    });\n  }\n  private createBiomeZones", "  }\n\n  private createBiomeZones")

with open(file_path, 'w') as f:
    f.write(content)
print("Fixed syntax error in WorldMapScene.ts")
