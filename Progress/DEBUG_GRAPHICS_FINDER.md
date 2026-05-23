# Debug Graphics Finder

This document provides tools and instructions to locate unwanted debug graphics (like green squares) in the Phaser world map.

## Quick Browser Console Checks

### 1. Find All Phaser Graphics Objects

Paste this in your browser console while on the world map page:

```javascript
// Access the Phaser game instance
const phaserCanvas = document.querySelector('canvas');
const game = phaserCanvas?.__phaser_game;

if (game) {
  const scene = game.scene.scenes[0];
  
  // Find all graphics objects
  const graphics = scene.children.list.filter(child => 
    child.type === 'Graphics'
  );
  
  console.log(`Found ${graphics.length} Graphics objects:`);
  graphics.forEach((g, i) => {
    console.log(`Graphics ${i}:`, {
      x: g.x,
      y: g.y,
      depth: g.depth,
      visible: g.visible,
      alpha: g.alpha
    });
  });
} else {
  console.log('Phaser game not found');
}
```

### 2. Find Green-Colored Elements

```javascript
// Find all green graphics (0x00ff00 or similar)
const scene = document.querySelector('canvas').__phaser_game?.scene?.scenes[0];

if (scene) {
  scene.children.list.forEach((child, i) => {
    if (child.fillColor === 0x00ff00 || 
        child.strokeColor === 0x00ff00 ||
        (child.tint && (child.tint === 0x00ff00 || child.tint === 0x00ff00))) {
      console.warn(`GREEN OBJECT FOUND at index ${i}:`, child);
    }
  });
}
```

### 3. Highlight All Graphics Objects

```javascript
// Make all Phaser graphics flash to identify them
const scene = document.querySelector('canvas').__phaser_game?.scene?.scenes[0];

if (scene) {
  const graphics = scene.children.list.filter(child => child.type === 'Graphics');
  
  graphics.forEach(g => {
    scene.tweens.add({
      targets: g,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: 3
    });
  });
  
  console.log(`Flashing ${graphics.length} graphics objects`);
}
```

### 4. Find All Rectangle/Square Shapes

```javascript
// Search for any fillRect or strokeRect calls
const scene = document.querySelector('canvas').__phaser_game?.scene?.scenes[0];

if (scene) {
  scene.children.list.forEach((child, i) => {
    if (child.type === 'Graphics' && child._displayOriginX !== undefined) {
      console.log(`Graphics object ${i}:`, {
        position: {x: child.x, y: child.y},
        depth: child.depth,
        visible: child.visible,
        container: child.parentContainer?.name || 'none'
      });
    }
  });
}
```

## Visual Inspection Steps

### Step 1: Check React Overlays

1. Open browser DevTools (F12)
2. Click "Elements" tab
3. Use element picker (Ctrl+Shift+C)
4. Click on the green square
5. Check if it's:
   - HTML element (React component)
   - Canvas element (Phaser graphic)
   - CSS background

### Step 2: Check Phaser Debug Mode

Check `interactiveideas/src/lib/phaser/game-config.ts`:

```typescript
physics: {
  arcade: {
    debug: false,  // ← Should be false
  }
}
```

### Step 3: Check Physics Bodies

If physics debug is enabled, green boxes show collision boundaries:

```javascript
// Disable physics debug
const game = document.querySelector('canvas').__phaser_game;
game.scene.scenes[0].physics.world.debugGraphic.clear();
game.scene.scenes[0].physics.world.drawDebug = false;
```

### Step 4: Check Container Bounds

```javascript
// List all containers and their bounds
const scene = document.querySelector('canvas').__phaser_game?.scene?.scenes[0];

if (scene) {
  const containers = scene.children.list.filter(c => c.type === 'Container');
  
  containers.forEach((container, i) => {
    console.log(`Container ${i}:`, {
      name: container.name,
      x: container.x,
      y: container.y,
      children: container.list.length,
      visible: container.visible
    });
  });
}
```

## Common Debug Graphics Sources

### 1. Checkpoint Hit Areas

Check if checkpoints have visible debug boundaries:

```javascript
const scene = document.querySelector('canvas').__phaser_game?.scene?.scenes[0];
const checkpoints = scene.children.list.filter(c => 
  c.type === 'Container' && c.name?.includes('checkpoint')
);

checkpoints.forEach(cp => {
  console.log('Checkpoint:', cp.input?.hitArea);
});
```

### 2. Boss Silhouettes

```javascript
const scene = document.querySelector('canvas').__phaser_game?.scene?.scenes[0];
const bosses = scene.children.list.filter(c => 
  c.type === 'Container' && c.name?.includes('boss')
);

console.log(`Found ${bosses.length} boss containers`);
```

### 3. Biome Backgrounds

```javascript
const scene = document.querySelector('canvas').__phaser_game?.scene?.scenes[0];
const biomeGraphics = scene.children.list.filter(child => 
  child.type === 'Graphics' && child.depth < 0
);

console.log(`Found ${biomeGraphics.length} background graphics`);
```

## Export Scene for Analysis

```javascript
// Export full scene structure
const scene = document.querySelector('canvas').__phaser_game?.scene?.scenes[0];

const sceneData = {
  children: scene.children.list.length,
  graphics: scene.children.list.filter(c => c.type === 'Graphics').length,
  containers: scene.children.list.filter(c => c.type === 'Container').length,
  sprites: scene.children.list.filter(c => c.type === 'Sprite').length,
  images: scene.children.list.filter(c => c.type === 'Image').length,
  texts: scene.children.list.filter(c => c.type === 'Text').length
};

console.table(sceneData);
```

## Color Code Reference

Common debug colors in Phaser:

- `0x00ff00` - Bright green (common debug color)
- `0xff0000` - Red
- `0x0000ff` - Blue
- `0xffff00` - Yellow
- `0xff00ff` - Magenta

## Finding the Source in Code

### Search Patterns

If you find a green object, search the codebase for:

```bash
# In terminal
cd interactiveideas

# Search for hex green
grep -r "0x00ff00" src/lib/phaser/

# Search for bright colors
grep -r "0xff" src/lib/phaser/ | grep fillStyle

# Search for debug-related code
grep -r "debug.*true" src/lib/phaser/

# Search for test graphics
grep -r -i "test\|debug\|TODO.*remove" src/lib/phaser/
```

## Temporary Debug Graphics Removal

If you find a specific graphics object causing issues:

```javascript
// Get the scene
const scene = document.querySelector('canvas').__phaser_game?.scene?.scenes[0];

// Find and destroy a specific graphic
const badGraphic = scene.children.list[INDEX_HERE]; // Replace with actual index
badGraphic.destroy();

// Or hide it
badGraphic.setVisible(false);
```

## Report Template

If issue persists, report with this information:

```
**Green Square Details:**
- Position: (x, y)
- Size: width × height
- Layer: (React overlay / Phaser canvas)
- Appears when: (always / on specific action)
- Browser console errors: (paste any errors)

**Scene Object Count:**
(paste output from "Export Scene for Analysis" above)

**Screenshot:**
(attach screenshot with browser DevTools open)
```

---

**Note**: Run these scripts only in development environment. Do not use in production.