import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    content = f.read()

# Fix initial brightness in create()
content = content.replace("this.updateBrightnessFilter(0);", "this.updateBrightnessFilter(100);")

# Fix log in handleUpdateBrightness to show 100%
content = content.replace("`[WorldMapScene] Brightness: ${finalBrightness.toFixed(2)}%", "`[WorldMapScene] Brightness: 100% (Forced) Original: ${finalBrightness.toFixed(2)}%")

with open(file_path, 'w') as f:
    f.write(content)
print("Forced 100% brightness in create() and updated log.")
