# Stage 7 Tilemap Integration Guide
## Free Tileset Assets for Shadow Crossroads

Based on research of the best free CC0/CC-BY tilesets available in 2024-2026, here are the recommended options for Stage 7 (Shadow Crossroads - Iteration theme):

---

## 🎨 Recommended Free Tilesets

### Option 1: **Purple City Asset Pack** (BEST MATCH)
- **URL**: https://svor.itch.io/purple-city-assetpack
- **License**: Free for commercial/non-commercial use
- **Perfect for**: Cyberpunk/night aesthetic with purple tones
- **Includes**: 
  - 7 building designs
  - 8 wall types
  - 7 platform variations
  - 12 misc items (including animated chest)
  - 16×16 grid (matches your current setup!)
- **Why it's perfect**: Purple/violet color scheme matches Stage 7's twilight theme perfectly

### Option 2: **Open RPG Fantasy Tilesets** (CC0)
- **URL**: https://finalbossblues.itch.io/openrtp-tiles
- **License**: CC0 Public Domain (no credit required)
- **Perfect for**: Classic RPG town/dungeon aesthetic
- **Includes**:
  - Overworld tiles
  - Town and castle exteriors
  - Interior tiles (homes, shops)
  - Dungeon tiles (caves, mines)
  - 16×16 tilebase
- **Why it's good**: Completely free, can be tinted purple in Phaser

### Option 3: **Kenney Fantasy Town Kit** (CC0)
- **URL**: https://kenney.nl/assets/fantasy-town-kit
- **License**: Creative Commons CC0
- **Perfect for**: Medieval town/crossroads
- **Includes**: 160+ 3D assets (can be rendered as 2D sprites)
- **Why it's good**: High quality, professional, completely free

### Option 4: **Medieval Town Tilemap**
- **URL**: https://lukas311202.itch.io/medieval-town-tilemap
- **License**: Free (check page for details)
- **Perfect for**: Medieval crossroads town
- **Includes**: 32×32 grid wall tileset
- **Why it's good**: Specifically designed for towns

---

## 📥 Download & Setup Instructions

### Step 1: Download Assets

**For Purple City (Recommended):**
```bash
# 1. Visit: https://svor.itch.io/purple-city-assetpack
# 2. Click "Download Now"
# 3. Extract the ZIP file
# 4. Copy PNG files to: public/assets/tilesets/stage7/
```

**For Open RPG Tiles:**
```bash
# 1. Visit: https://finalbossblues.itch.io/openrtp-tiles
# 2. Download the pack
# 3. Extract and copy to: public/assets/tilesets/stage7/
```

### Step 2: File Structure
```
public/
└── assets/
    └── tilesets/
        └── stage7/
            ├── tileset.png          # Main tileset image
            ├── buildings.png        # Building sprites
            ├── decorations.png      # Props and decorations
            └── stage7_map.json      # Tiled map (if using Tiled)
```

---

## 🔧 Integration Code

### Method 1: Using Purple City Tileset (Simple Sprite Approach)

```typescript
// In WorldMapScene.ts preload()
preload(): void {
  // Load Stage 7 tileset
  this.load.image('stage7-tileset', 'assets/tilesets/stage7/tileset.png');
  this.load.image('stage7-buildings', 'assets/tilesets/stage7/buildings.png');
  this.load.image('stage7-platforms', 'assets/tilesets/stage7/platforms.png');
}

// Updated createCrossroadsTilePanel method
private createCrossroadsTilePanel(
  panelX: number,
  panelOffsetY: number,
  scale: number,
  biome: BiomeConfig,
  biomeIndex: number,
): void {
  const TILE_SIZE = 16 * scale;
  const COLS = this.map.width;
  const ROWS = this.map.height;
  
  // Create tilemap from sprite sheet
  const tilemap = this.add.tileSprite(
    panelX,
    panelOffsetY,
    COLS * TILE_SIZE,
    ROWS * TILE_SIZE,
    'stage7-tileset'
  );
  tilemap.setOrigin(0, 0);
  tilemap.setTint(0xc4b5fd); // Purple tint for twilight effect
  tilemap.setDepth(1);
  this.backgroundLayer.add(tilemap);
  
  // Add buildings at specific positions
  const buildingPositions = [
    { x: 5, y: 10 },
    { x: 15, y: 8 },
    { x: 25, y: 12 },
  ];
  
  buildingPositions.forEach(pos => {
    const building = this.add.sprite(
      panelX + pos.x * TILE_SIZE,
      panelOffsetY + pos.y * TILE_SIZE,
      'stage7-buildings'
    );
    building.setOrigin(0.5, 1);
    building.setScale(scale);
    building.setTint(0xddd6fe); // Light purple tint
    building.setDepth(8);
    this.midgroundLayer.add(building);
  });
  
  // Add crossroads path
  this.createCrossroadsPath(panelX, panelOffsetY, TILE_SIZE, COLS, ROWS);
}

private createCrossroadsPath(
  panelX: number,
  panelOffsetY: number,
  tileSize: number,
  cols: number,
  rows: number
): void {
  const midRow = Math.floor(rows / 2);
  const midCol = Math.floor(cols / 2);
  
  // Horizontal road
  const hRoad = this.add.rectangle(
    panelX + (cols * tileSize) / 2,
    panelOffsetY + midRow * tileSize,
    cols * tileSize,
    tileSize * 3,
    0x1e0d40,
    1
  );
  hRoad.setDepth(2);
  this.backgroundLayer.add(hRoad);
  
  // Vertical road
  const vRoad = this.add.rectangle(
    panelX + midCol * tileSize,
    panelOffsetY + (rows * tileSize) / 2,
    tileSize * 3,
    rows * tileSize,
    0x1e0d40,
    1
  );
  vRoad.setDepth(2);
  this.backgroundLayer.add(vRoad);
  
  // Intersection marker
  const marker = this.add.circle(
    panelX + midCol * tileSize,
    panelOffsetY + midRow * tileSize,
    tileSize,
    0x7c3aed,
    0.5
  );
  marker.setDepth(3);
  this.backgroundLayer.add(marker);
}
```

### Method 2: Using Tiled Editor (Professional Approach)

```typescript
// In preload()
preload(): void {
  // Load Tiled JSON map
  this.load.tilemapTiledJSON('stage7-map', 'assets/tilesets/stage7/stage7_map.json');
  this.load.image('stage7-tiles', 'assets/tilesets/stage7/tileset.png');
}

// In createCrossroadsTilePanel()
private createCrossroadsTilePanel(
  panelX: number,
  panelOffsetY: number,
  scale: number,
  biome: BiomeConfig,
  biomeIndex: number,
): void {
  // Create tilemap from Tiled JSON
  const map = this.make.tilemap({ key: 'stage7-map' });
  const tileset = map.addTilesetImage('stage7-tileset', 'stage7-tiles');
  
  // Create layers
  const groundLayer = map.createLayer('Ground', tileset!, panelX, panelOffsetY);
  const pathLayer = map.createLayer('Paths', tileset!, panelX, panelOffsetY);
  const decorLayer = map.createLayer('Decorations', tileset!, panelX, panelOffsetY);
  
  // Apply scale and tint
  [groundLayer, pathLayer, decorLayer].forEach(layer => {
    if (layer) {
      layer.setScale(scale);
      layer.setTint(0xc4b5fd); // Purple twilight tint
      layer.setDepth(layer === decorLayer ? 6 : 2);
      this.backgroundLayer.add(layer);
    }
  });
  
  // Spawn objects from Tiled object layer
  const objectLayer = map.getObjectLayer('Objects');
  objectLayer?.objects.forEach(obj => {
    if (obj.name === 'Building') {
      const sprite = this.add.sprite(
        panelX + obj.x!,
        panelOffsetY + obj.y!,
        'stage7-buildings'
      );
      sprite.setScale(scale);
      sprite.setDepth(8);
      this.midgroundLayer.add(sprite);
    }
  });
}
```

---

## 🎨 Color Tinting for Twilight Effect

To match Stage 7's purple twilight theme, apply these tints:

```typescript
// Purple twilight color palette
const STAGE7_COLORS = {
  sky: 0x13082a,        // Deep purple
  ground: 0x1e0d40,     // Dark violet
  accent: 0x7c3aed,     // Bright purple
  highlight: 0xa78bfa,  // Lavender
  glow: 0xddd6fe,       // Light purple
};

// Apply tint to any sprite/tilemap
sprite.setTint(STAGE7_COLORS.glow);
tilemap.setTint(STAGE7_COLORS.ground);
```

---

## 🚀 Quick Start (Minimal Setup)

If you want to get started immediately without downloading:

```typescript
private createCrossroadsTilePanel(
  panelX: number,
  panelOffsetY: number,
  scale: number,
  biome: BiomeConfig,
  biomeIndex: number,
): void {
  const TILE_SIZE = 16 * scale;
  const COLS = this.map.width;
  const ROWS = this.map.height;
  
  // Use existing tileset from your project
  // Check if you already have compatible tiles loaded
  if (this.textures.exists('Tileset_Ground')) {
    const tilemap = this.add.tileSprite(
      panelX,
      panelOffsetY,
      COLS * TILE_SIZE,
      ROWS * TILE_SIZE,
      'Tileset_Ground'
    );
    tilemap.setOrigin(0, 0);
    tilemap.setTint(0x7c3aed); // Purple tint
    tilemap.setDepth(1);
    this.backgroundLayer.add(tilemap);
  }
  
  // Add crossroads using simple shapes (current approach)
  // ... rest of your existing code
}
```

---

## 📝 Next Steps

1. **Choose your tileset** (Purple City recommended for best match)
2. **Download and extract** to `public/assets/tilesets/stage7/`
3. **Update preload()** to load the new assets
4. **Replace createCrossroadsTilePanel()** with one of the methods above
5. **Test in browser** and adjust colors/positions as needed

---

## 🔗 Asset Links Summary

| Asset Pack | URL | License | Best For |
|------------|-----|---------|----------|
| Purple City | https://svor.itch.io/purple-city-assetpack | Free | Night/purple theme ⭐ |
| Open RPG Tiles | https://finalbossblues.itch.io/openrtp-tiles | CC0 | Classic RPG style |
| Kenney Fantasy | https://kenney.nl/assets/fantasy-town-kit | CC0 | Medieval town |
| Medieval Town | https://lukas311202.itch.io/medieval-town-tilemap | Free | Town walls |

---

## 💡 Pro Tips

1. **Use TileSprite for repeating patterns** - More efficient than individual sprites
2. **Apply purple tints** to any tileset to match Stage 7 theme
3. **Layer your tiles** - Ground → Paths → Buildings → Decorations
4. **Use Tiled Editor** for complex layouts (free tool: mapeditor.org)
5. **Test performance** - TileSprite is faster than hundreds of individual sprites

---

*Content was researched and compiled from public domain and CC0 sources. All recommended assets are free for commercial use.*
