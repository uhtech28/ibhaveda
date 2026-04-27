import sys

file_path = "/home/Sahi0045/Documents/interactiveideas/src/lib/phaser/utils/asset-loader.ts"
with open(file_path, 'r') as f:
    content = f.read()

# Add the missing objects to the loading list
missing_objects = [
    "Shadow_Round_16x16_Flat_Black", "Shadow_Round_16x16_Long_Black", "Shadow_Round_16x16_Medium_Black", "Shadow_Round_16x16_Short_Black",
    "Shadow_Round_16x32_Flat_Black", "Shadow_Round_16x32_Long_Black", "Shadow_Round_16x32_Medium_Black", "Shadow_Round_16x32_Short_Black",
    "Shadow_Round_24x24_Flat_Black", "Shadow_Round_24x24_Long_Black", "Shadow_Round_24x24_Medium_Black", "Shadow_Round_24x24_Short_Black",
    "Shadow_Round_24x48_Flat_Black", "Shadow_Round_24x48_Long_Black", "Shadow_Round_24x48_Medium_Black", "Shadow_Round_24x48_Short_Black",
    "Shadow_Round_32x16_Flat_Black", "Shadow_Round_32x16_Long_Black", "Shadow_Round_32x16_Medium_Black", "Shadow_Round_32x16_Short_Black",
    "Shadow_Round_32x32_Flat_Black", "Shadow_Round_32x32_Long_Black", "Shadow_Round_32x32_Medium_Black", "Shadow_Round_32x32_Short_Black",
    "Shadow_Round_40x40_Flat_Black", "Shadow_Round_40x40_Long_Black", "Shadow_Round_40x40_Medium_Black", "Shadow_Round_40x40_Short_Black",
    "Shadow_Round_48x24_Flat_Black", "Shadow_Round_48x24_Long_Black", "Shadow_Round_48x24_Medium_Black", "Shadow_Round_48x24_Short_Black",
    "Shadow_Round_48x48_Flat_Black", "Shadow_Round_48x48_Long_Black", "Shadow_Round_48x48_Medium_Black", "Shadow_Round_48x48_Short_Black"
]

# Find the objects array in AssetLoader.ts and extend it
# Or just add a new loop
new_loading = f"""    const extraShadows = {missing_objects};
    extraShadows.forEach(obj => scene.load.image(obj, `${fanTasyPath}/${obj}.png`));
"""

# Insert it after the existing objects loop
content = content.replace("objects.forEach(obj => scene.load.image(obj, `${fanTasyPath}/${obj}.png`));", 
                         "objects.forEach(obj => scene.load.image(obj, `${fanTasyPath}/${obj}.png`));\n" + new_loading)

with open(file_path, 'w') as f:
    f.write(content)
print("Added missing shadow assets to AssetLoader.ts")
