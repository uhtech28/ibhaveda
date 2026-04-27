import os
import shutil
import re
import xml.etree.ElementTree as ET

source_dir = "/home/Sahi0045/Documents/interactiveideas/The Fan-tasy Tileset (Free) 1.5.7/The Fan-tasy Tileset (Free)"
dest_dir = "/home/Sahi0045/Documents/interactiveideas/public/assets/fan-tasy"

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

# 1. Find and copy all files
all_files = []
for root, dirs, files in os.walk(source_dir):
    for file in files:
        if file.endswith((".png", ".tsx", ".tmx", ".tsj", ".tmj")):
            src_path = os.path.join(root, file)
            dest_path = os.path.join(dest_dir, file)
            shutil.copy2(src_path, dest_path)
            all_files.append(dest_path)

# 2. Fix references in TSX and TMX files
for file_path in all_files:
    if file_path.endswith((".tsx", ".tmx")):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace image sources: source="../../Art/..." -> source="filename.png"
        content = re.sub(r'source="[^"]*/([^"/]+\.png)"', r'source="\1"', content)
        
        # Replace tileset sources in TMX: source="../Tilesets/..." -> source="filename.tsx"
        content = re.sub(r'source="[^"]*/([^"/]+\.tsx)"', r'source="\1"', content)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

print(f"Successfully processed {len(all_files)} files into {dest_dir}")
