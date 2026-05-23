# 📥 Download Free Tilesets for Stage 7

## 🎯 Recommended: Purple City Asset Pack

**Perfect match for Stage 7's twilight crossroads theme!**

### Download Instructions

1. **Visit the page**:
   ```
   https://svor.itch.io/purple-city-assetpack
   ```

2. **Click "Download Now"** (it's FREE!)

3. **Extract the ZIP file** to a temporary folder

4. **Copy files to your project**:
   ```bash
   # Create the directory
   mkdir -p public/assets/tilesets/stage7
   
   # Copy the main tileset
   cp downloaded-folder/tileset.png public/assets/tilesets/stage7/stage7-tileset.png
   
   # Copy buildings (if available)
   cp downloaded-folder/buildings.png public/assets/tilesets/stage7/stage7-buildings.png
   ```

5. **Add to your code** (in `WorldMapScene.ts` preload method):
   ```typescript
   preload(): void {
     // ... existing code ...
     
     // Add Stage 7 tileset
     this.load.image('stage7-tileset', 'assets/tilesets/stage7/stage7-tileset.png');
     this.load.image('stage7-buildings', 'assets/tilesets/stage7/stage7-buildings.png');
   }
   ```

6. **Test**:
   ```bash
   npm run dev
   # Navigate to Stage 7 in your game
   ```

---

## 🎨 Alternative Option 1: Open RPG Fantasy Tiles (CC0)

**Best for classic RPG aesthetic**

### Download Instructions

1. **Visit**:
   ```
   https://finalbossblues.itch.io/openrtp-tiles
   ```

2. **Download** (completely free, CC0 license)

3. **Extract** and look for:
   - `Overworld` folder (for ground tiles)
   - `Town` folder (for buildings)
   - `Dungeon` folder (for dark atmosphere)

4. **Copy to project**:
   ```bash
   mkdir -p public/assets/tilesets/stage7
   cp openrtp-tiles/overworld.png public/assets/tilesets/stage7/stage7-tileset.png
   cp openrtp-tiles/town.png public/assets/tilesets/stage7/stage7-buildings.png
   ```

5. **Apply purple tint** in code (these are neutral colors):
   ```typescript
   tilemap.setTint(0xc4b5fd); // Purple tint
   ```

---

## 🏰 Alternative Option 2: Kenney Fantasy Town Kit (CC0)

**Professional quality, public domain**

### Download Instructions

1. **Visit**:
   ```
   https://kenney.nl/assets/fantasy-town-kit
   ```

2. **Click "Download"** (free, no account needed)

3. **Extract** the ZIP file

4. **Note**: This is a 3D asset pack, but you can:
   - Use the preview images as 2D sprites
   - Render the 3D models to 2D sprites
   - Or just use for inspiration

5. **Copy sprites**:
   ```bash
   mkdir -p public/assets/tilesets/stage7
   # Copy individual building sprites
   cp kenney-fantasy/building1.png public/assets/tilesets/stage7/
   cp kenney-fantasy/building2.png public/assets/tilesets/stage7/
   ```

---

## 🗺️ Alternative Option 3: Medieval Town Tilemap

**Specifically designed for towns**

### Download Instructions

1. **Visit**:
   ```
   https://lukas311202.itch.io/medieval-town-tilemap
   ```

2. **Download** (check license on page)

3. **Extract** and copy:
   ```bash
   mkdir -p public/assets/tilesets/stage7
   cp medieval-town/tileset.png public/assets/tilesets/stage7/stage7-tileset.png
   ```

4. **Note**: 32×32 grid (your project uses 16×16)
   - Scale down in image editor, OR
   - Adjust scale in code: `setScale(scale * 0.5)`

---

## 🎨 Alternative Option 4: Use Tiled Editor

**Create your own custom tilemap!**

### Setup Instructions

1. **Download Tiled**:
   ```
   https://www.mapeditor.org/
   ```

2. **Install** (free, open source)

3. **Create new map**:
   - File → New → New Map
   - Tile size: 16×16
   - Map size: 40×30 (or match your COLS/ROWS)
   - Orientation: Orthogonal

4. **Import tileset**:
   - Use any of the above tilesets
   - Or create your own in Aseprite/Photoshop

5. **Paint your map**:
   - Create layers: Ground, Paths, Decorations
   - Paint tiles
   - Add object layer for buildings

6. **Export**:
   - File → Export As → JSON
   - Save to: `public/assets/tilesets/stage7/stage7_map.json`

7. **Load in Phaser**:
   ```typescript
   preload(): void {
     this.load.tilemapTiledJSON('stage7-map', 'assets/tilesets/stage7/stage7_map.json');
     this.load.image('stage7-tiles', 'assets/tilesets/stage7/tileset.png');
   }
   
   create(): void {
     const map = this.make.tilemap({ key: 'stage7-map' });
     const tileset = map.addTilesetImage('stage7-tileset', 'stage7-tiles');
     const layer = map.createLayer('Ground', tileset!, 0, 0);
   }
   ```

---

## 📦 File Structure After Download

```
your-project/
├── public/
│   └── assets/
│       └── tilesets/
│           └── stage7/
│               ├── stage7-tileset.png      ← Main tileset
│               ├── stage7-buildings.png    ← Buildings (optional)
│               ├── stage7-decorations.png  ← Props (optional)
│               └── stage7_map.json         ← Tiled map (optional)
└── src/
    └── lib/
        └── phaser/
            └── scenes/
                └── WorldMapScene.ts
```

---

## ✅ Verification Checklist

After downloading and copying files:

- [ ] Files are in `public/assets/tilesets/stage7/`
- [ ] File names match exactly: `stage7-tileset.png`, `stage7-buildings.png`
- [ ] Preload code added to `WorldMapScene.ts`
- [ ] Project runs without errors: `npm run dev`
- [ ] Stage 7 displays correctly in browser
- [ ] Tileset is visible (not just colored rectangles)
- [ ] Buildings appear (if using buildings)
- [ ] Purple tint is applied correctly

---

## 🎨 Quick Tint Reference

If your tileset has neutral colors, apply these tints:

```typescript
// Light purple (for buildings, decorations)
sprite.setTint(0xddd6fe);

// Medium purple (for ground)
tilemap.setTint(0xc4b5fd);

// Dark purple (for shadows)
shadow.setTint(0x7c3aed);

// Bright purple (for highlights)
glow.setTint(0xa78bfa);
```

---

## 🔧 Troubleshooting

### "Cannot find image 'stage7-tileset'"
- Check file path: `public/assets/tilesets/stage7/stage7-tileset.png`
- Verify file name matches exactly (case-sensitive!)
- Restart dev server: `npm run dev`

### "Tileset appears but wrong colors"
- Add `setTint(0xc4b5fd)` to apply purple tint
- Adjust COLORS object in code
- Check if tileset already has colors

### "Tileset is too small/large"
- Check tile size: should be 16×16
- If 32×32, use `setScale(scale * 0.5)`
- If 8×8, use `setScale(scale * 2)`

### "Buildings not showing"
- Check if `stage7-buildings.png` exists
- Verify preload code includes buildings
- Check browser console for errors

---

## 💡 Pro Tips

1. **Start with Purple City** - Best match for Stage 7 theme
2. **Test without tileset first** - Current implementation works great!
3. **Use Tiled for complex maps** - Visual editor is easier
4. **Keep original files** - Don't delete downloaded ZIPs
5. **Backup your work** - Copy files before modifying

---

## 📚 Additional Resources

### Free Tileset Sites
- **itch.io**: https://itch.io/game-assets/free/tag-tileset
- **OpenGameArt**: https://opengameart.org/
- **Kenney**: https://kenney.nl/assets
- **Craftpix**: https://craftpix.net/freebies/

### Tileset Creation Tools
- **Aseprite**: https://www.aseprite.org/ (paid, best for pixel art)
- **Piskel**: https://www.piskelapp.com/ (free, browser-based)
- **GIMP**: https://www.gimp.org/ (free, powerful)
- **Tiled**: https://www.mapeditor.org/ (free, map editor)

### Tutorials
- **Phaser Tilemap Tutorial**: https://generalistprogrammer.com/tutorials/phaser-tilemap-tutorial
- **Tiled Tutorial**: https://doc.mapeditor.org/en/stable/manual/introduction/
- **Pixel Art Tutorial**: https://lospec.com/pixel-art-tutorials

---

## 🎉 You're Ready!

1. **Choose a tileset** (Purple City recommended)
2. **Download and extract**
3. **Copy to project folder**
4. **Add preload code**
5. **Test in browser**
6. **Enjoy your professional Stage 7 tilemap!**

---

**Questions?** Check the other documentation files:
- `QUICK_START_STAGE7_TILESET.md` - Quick setup guide
- `STAGE7_TILEMAP_INTEGRATION_GUIDE.md` - Detailed integration
- `STAGE7_VISUAL_GUIDE.md` - Visual reference
- `README_STAGE7_TILEMAP.md` - Overview

**Happy mapping! 🗺️✨**
