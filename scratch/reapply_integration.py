import sys
import re

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/scenes/WorldMapScene.ts"
with open(file_path, 'r') as f:
    content = f.read()

# 1. Comment out createSnakePath in create()
content = content.replace("this.createSnakePath();", "// this.createSnakePath();")

# 2. Add createTilemap() call if missing (it should be there after git checkout? No, git checkout restored it to BEFORE my changes!)
# Wait, if I did git checkout, I lost my createTilemap method!
# I need to re-add it.

# Let's re-apply the whole "new map" integration on top of the restored file.
print("File restored. Re-applying new map integration...")
