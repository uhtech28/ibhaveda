# Adventure Map Transformation Plan
## Overhaul World Map to Adventure Style (36 Checkpoints)

**Status:** Implementation Ready  
**Priority:** High  
**Estimated Effort:** 3-4 weeks  
**Date:** April 20, 2026

---

## Executive Summary

Transform the current "Among Us" spaceship-themed world map into a pixel-art adventure-style map with 8 distinct biomes, matching the reference videos. This includes implementing unique visual themes for each stage, organic path layouts, adventure-themed checkpoint markers, and a comprehensive quest/XP system.

### Key Changes
- Replace spaceship rooms with organic biomes (Forest, Desert, Dungeon, Tundra, Mine, Harbour, Floating Isle, Capital)
- Transform rectangular room layouts into flowing adventure paths
- Update checkpoint visuals from task icons to fantasy markers (flags, campfires, statues)
- Implement stage-specific quest objectives and enemy types
- Add leveling/XP system with visual feedback

---

## Current State Analysis

### Existing Implementation (Among Us Theme)
```typescript
// Current VENTURE_ROOMS structure (WorldMapScene.ts)
VENTURE_ROOMS = [
  { id: 1, name: "IDEATION", subtitle: "Stage 1 · The Village", type: "cafeteria" },
  { id: 2, name: "RESEARCH", subtitle: "Stage 2 · The Forest", type: "medbay" },
  // ... 8 total rooms with spaceship aesthetics
]
```

**Current Features:**
- ✅ 8 stages with 36 total checkpoints (4,5,4,5,6,3,4,5)
- ✅ Checkpoint status system (locked, active, in_progress, completed, gold)
- ✅ Persona character with idle/walk animations
- ✅ Boss silhouette system
- ✅ Camera panning and scrolling
- ✅ Lazy loading for performance
- ✅ Parallax background layers
- ✅ Event bridge for React ↔ Phaser communication

**Current Limitations:**
- ❌ Spaceship/industrial aesthetic (needs organic adventure theme)
- ❌ Rectangular room layouts (needs flowing paths)
- ❌ Task-based checkpoint icons (needs fantasy markers)
- ❌ Generic stage names (needs adventure-themed names)
- ❌ No quest/objective system
- ❌ No enemy type definitions

---

## Target State: Adventure Map Design

### Stage & Biome Breakdown

| Stage | Name | Biome | CP Count | Theme | Quests | Enemies |
|-------|------|-------|----------|-------|--------|---------|
| 1 | Ideation | Forest | 4 | Green grassy area | Collect Herbs, Defeat Slimes | Slimes |
| 2 | Research | Desert | 5 | Sandy wasteland | Navigate stone blocks, defeat Birds | Vultures |
| 3 | Validation | Dungeon | 4 | Dark maze | Navigate corridors, defeat Undead, collect Blue Orbs | Undead |
| 4 | Offer Design | Tundra | 5 | Snowy plains | Ice obstacles, defeat Frost Wraiths, secure campfires | Frost Wraiths |
| 5 | Build & Deliver | Mine | 6 | Gem-lit caverns | Break ore blocks, defeat Golems, build infrastructure | Golems |
| 6 | Launch | Harbour | 3 | Ocean/docks | Navigate piers, defeat Sea Serpents, signal ship | Sea Serpents |
| 7 | Iteration | Floating Isle | 4 | Sky ruins | Floating platforms, defeat Harpies, calibrate runes | Harpies |
| 8 | Scale | Capital | 5 | Golden city | City streets, defeat Iron Bureaucrats, scale throne | Iron Bureaucrats |

### Visual Design Specifications

#### Biome Color Palettes
```typescript
const BIOME_PALETTES = {
  forest: {
    primary: 0x2d5016,    // Deep forest green
    secondary: 0x4a7c2f,  // Grass green
    accent: 0x8bc34a,     // Light green
    path: 0x6b4423,       // Dirt brown
  },
  desert: {
    primary: 0xd4a574,    // Sand
    secondary: 0xc19a6b,  // Dark sand
    accent: 0xf4e4c1,     // Light sand
    path: 0xa67c52,       // Packed sand
  },
  dungeon: {
    primary: 0x2c2c3e,    // Dark stone
    secondary: 0x1a1a2e,  // Darker stone
    accent: 0x4a4a6a,     // Light stone
    path: 0x3a3a4a,       // Stone floor
  },
  tundra: {
    primary: 0xe8f4f8,    // Snow white
    secondary: 0xb8d4e8,  // Ice blue
    accent: 0x7fb3d5,     // Deep ice
    path: 0xc8d8e8,       // Packed snow
  },
  mine: {
    primary: 0x3e2723,    // Dark rock
    secondary: 0x5d4037,  // Brown rock
    accent: 0xffa726,     // Gem glow (amber)
    path: 0x4e342e,       // Mine floor
  },
  harbour: {
    primary: 0x1565c0,    // Deep water
    secondary: 0x1976d2,  // Water
    accent: 0x64b5f6,     // Light water
    path: 0x8d6e63,       // Wooden dock
  },
  floatingIsle: {
    primary: 0x81c784,    // Sky grass
    secondary: 0x66bb6a,  // Isle green
    accent: 0xe1f5fe,     // Sky blue
    path: 0x9e9e9e,       // Stone path
  },
  capital: {
    primary: 0xffd54f,    // Gold
    secondary: 0xffb300,  // Deep gold
    accent: 0xffe082,     // Light gold
    path: 0xbcaaa4,       // Marble
  },
};
```

#### Checkpoint Marker Designs
```typescript
const CHECKPOINT_MARKERS = {
  forest: "🌳",      // Tree/flag
  desert: "🗿",      // Stone pillar
  dungeon: "🔮",     // Crystal orb
  tundra: "🔥",      // Campfire
  mine: "⛏️",       // Pickaxe/ore
  harbour: "⚓",     // Anchor
  floatingIsle: "🏛️", // Rune stone
  capital: "👑",     // Crown/throne
};
```

---

## Implementation Plan

### Phase 1: Asset Creation & Texture System (Week 1)

#### 1.1 Update AssetLoader.ts
**File:** `src/lib/phaser/utils/asset-loader.ts`

**New Methods to Add:**
```typescript
// Biome texture creators
static createForestTiles(scene: Phaser.Scene): void
static createDesertTiles(scene: Phaser.Scene): void
static createDungeonTiles(scene: Phaser.Scene): void
static createTundraTiles(scene: Phaser.Scene): void
static createMineTiles(scene: Phaser.Scene): void
static createHarbourTiles(scene: Phaser.Scene): void
static createFloatingIsleTiles(scene: Phaser.Scene): void
static createCapitalTiles(scene: Phaser.Scene): void

// Organic path textures
static createOrganicPathTextures(scene: Phaser.Scene): void

// Adventure checkpoint markers
static createAdventureCheckpointTextures(scene: Phaser.Scene): void

// Enemy silhouettes
static createEnemyTextures(scene: Phaser.Scene): void
```

**Implementation Details:**
- Each biome gets 3-4 tile variations for visual variety
- Organic paths with varying widths (32-64px)
- Checkpoint markers sized 64x64px with biome-specific designs
- Enemy silhouettes for boss overlays (Slimes, Vultures, Undead, etc.)

#### 1.2 Checkpoint Texture Updates
Replace current task-style icons with adventure markers:
- **Locked:** Gray stone with lock symbol
- **Active:** Glowing marker with pulsing animation
- **In Progress:** Half-lit marker
- **Completed:** Fully lit marker with checkmark
- **Gold:** Golden marker with star burst

---

### Phase 2: World Map Scene Transformation (Week 2)

#### 2.1 Restructure VENTURE_ROOMS → VENTURE_BIOMES
**File:** `src/lib/phaser/scenes/WorldMapScene.ts`

**Current Structure:**
```typescript
private readonly VENTURE_ROOMS = [
  { id: 1, name: "IDEATION", subtitle: "Stage 1 · The Village", x: 1000, y: 100, ... }
]
```

**New Structure:**
```typescript
private readonly VENTURE_BIOMES = [
  {
    id: 1,
    name: "IDEATION",
    biomeName: "The Forest",
    subtitle: "Stage 1 · Collect Herbs & Defeat Slimes",
    x: 200,
    y: 300,
    width: 600,
    height: 400,
    biomeType: "forest",
    checkpoints: 4,
    enemies: ["Slime"],
    quests: [
      "Collect 5 Healing Herbs",
      "Defeat 3 Slimes",
      "Find the Ancient Tree"
    ],
    pathColor: 0x6b4423,
    decorations: ["trees", "bushes", "flowers"],
  },
  // ... 7 more biomes
]
```

#### 2.2 Update createSpaceshipRooms() → createBiomeZones()
**Changes:**
- Remove metallic/industrial graphics
- Add organic shapes using Phaser.Geom.Polygon
- Implement tile-based backgrounds
- Add biome-specific decorations (trees, rocks, crystals, etc.)
- Create flowing transitions between biomes

**New Method:**
```typescript
private createBiomeZones(): void {
  for (const biome of this.VENTURE_BIOMES) {
    const container = this.add.container(biome.x, biome.y);
    
    // Background tiles
    this.createBiomeBackground(container, biome);
    
    // Decorations
    this.addBiomeDecorations(container, biome);
    
    // Border (organic, not rectangular)
    this.createOrganicBorder(container, biome);
    
    this.backgroundLayer.add(container);
  }
}
```

#### 2.3 Update createSpaceshipPath() → createAdventurePath()
**Changes:**
- Replace red dotted lines with dirt/grass paths
- Implement varying path widths
- Add path decorations (pebbles, grass tufts)
- Create smooth curves between checkpoints

---

### Phase 3: HUD & Quest System (Week 2-3)

#### 3.1 Update MapHUD.tsx
**File:** `src/components/map/MapHUD.tsx`

**New Components to Add:**
```typescript
// Stage title with biome name
<div className="stage-title">
  Stage {currentStage}: {biomeName}
</div>

// Quest list (top-right)
<div className="quest-panel">
  <h3>Active Quests</h3>
  {quests.map(quest => (
    <QuestItem key={quest.id} quest={quest} />
  ))}
</div>

// Gold counter
<div className="gold-counter">
  <CoinIcon />
  <span>{goldAmount}</span>
</div>

// XP bar with level-up animation
<XPBar 
  current={xp} 
  target={xpToNext} 
  level={level}
  onLevelUp={handleLevelUp}
/>
```

**Styling Updates:**
- Pixel-art style borders
- Fantasy-themed color scheme (browns, golds, greens)
- Retro shadow effects on text
- Animated quest completion checkmarks

#### 3.2 Quest System Integration
**New Files:**
```
src/lib/phaser/systems/
├── QuestSystem.ts       // Quest tracking and completion
├── XPSystem.ts          // XP calculation and level-up
└── GoldSystem.ts        // Gold rewards and tracking
```

**Quest System Features:**
- Track active quests per checkpoint
- Display quest objectives in HUD
- Trigger quest completion animations
- Award XP and Gold on completion

---

### Phase 4: Checkpoint & Animation Updates (Week 3)

#### 4.1 Update Checkpoint Positioning
**Method:** `calculateCheckpointPosition()`

**Changes:**
- Remove grid-based layout
- Implement organic path following
- Add slight randomization for natural feel
- Ensure proper spacing (80-120px between checkpoints)

**New Algorithm:**
```typescript
private calculateCheckpointPosition(
  stage: number,
  checkpoint: number,
  globalIndex: number
): { x: number; y: number } {
  const biome = this.VENTURE_BIOMES[stage - 1];
  
  // Calculate position along organic path
  const pathProgress = checkpoint / biome.checkpoints;
  const baseX = biome.x + (biome.width * pathProgress);
  const baseY = biome.y + biome.height / 2;
  
  // Add sine wave for natural path curve
  const waveOffset = Math.sin(pathProgress * Math.PI) * 60;
  
  // Add slight randomization
  const randomX = (Math.random() - 0.5) * 20;
  const randomY = (Math.random() - 0.5) * 20;
  
  return {
    x: baseX + randomX,
    y: baseY + waveOffset + randomY
  };
}
```

#### 4.2 Checkpoint Animation Updates
**File:** `src/lib/phaser/scenes/animations/`

**Update Existing Animations:**
- Seal Break → Forest theme (green particles)
- Rune Inscription → Desert theme (sand swirls)
- Beacon Lighting → Dungeon theme (blue flames)
- Bridge Repair → Tundra theme (ice crystals)
- Compass Calibration → Mine theme (gem sparkles)
- Ward Placement → Harbour theme (water ripples)

**Add New Animations:**
- Sky Ascension (Floating Isle)
- Crown Coronation (Capital)

---

### Phase 5: Enemy & Boss System (Week 3-4)

#### 5.1 Enemy Definitions
**File:** `convex/ventureConstants.ts`

**Add Enemy Definitions:**
```typescript
export const ENEMY_TYPES = [
  {
    id: "slime",
    name: "Slime",
    stage: 1,
    color: 0x4caf50,
    description: "Gelatinous forest dweller",
  },
  {
    id: "vulture",
    name: "Desert Vulture",
    stage: 2,
    color: 0x8d6e63,
    description: "Scavenger of the wasteland",
  },
  // ... 8 total enemy types
];
```

#### 5.2 Update Boss Silhouettes
**File:** `src/lib/phaser/entities/Boss.ts`

**Changes:**
- Update boss positions to biome boundaries
- Add biome-specific boss designs
- Implement enemy-themed mini-bosses per stage
- Update opacity progression based on stage

---

### Phase 6: Testing & Polish (Week 4)

#### 6.1 Automated Tests
**Update Test Files:**
- `test/snake-path-layout.test.ts` → Update for organic paths
- `test/phaser/brightness-calculator.test.ts` → Verify with new biomes
- Add new test: `test/phaser/biome-transitions.test.ts`

#### 6.2 Manual Verification Checklist
- [ ] All 8 biomes render correctly
- [ ] Checkpoint markers match biome themes
- [ ] Organic paths connect all checkpoints
- [ ] Quest system displays active objectives
- [ ] XP bar updates on checkpoint completion
- [ ] Gold counter increments correctly
- [ ] Level-up animation triggers at correct thresholds
- [ ] Boss silhouettes appear at biome boundaries
- [ ] Camera panning follows persona smoothly
- [ ] Lazy loading works for all biomes
- [ ] Performance maintains 60 FPS

---

## File Modification Summary

### Files to Modify
1. **src/lib/phaser/utils/asset-loader.ts** (Major)
   - Add 8 biome texture creators
   - Update checkpoint textures
   - Add enemy textures

2. **src/lib/phaser/scenes/WorldMapScene.ts** (Major)
   - Rename VENTURE_ROOMS → VENTURE_BIOMES
   - Update createSpaceshipRooms() → createBiomeZones()
   - Update createSpaceshipPath() → createAdventurePath()
   - Update calculateCheckpointPosition()
   - Add biome decoration methods

3. **src/components/map/MapHUD.tsx** (Moderate)
   - Add quest panel
   - Add gold counter
   - Update styling for adventure theme

4. **convex/ventureConstants.ts** (Minor)
   - Add ENEMY_TYPES array
   - Add QUEST_DEFINITIONS array

5. **src/lib/phaser/entities/Boss.ts** (Minor)
   - Update boss positioning logic
   - Add enemy-themed designs

### New Files to Create
1. **src/lib/phaser/systems/QuestSystem.ts**
2. **src/lib/phaser/systems/XPSystem.ts**
3. **src/lib/phaser/systems/GoldSystem.ts**
4. **test/phaser/biome-transitions.test.ts**

---

## Open Questions & Decisions Needed

### 1. Checkpoint Task Distribution
**Question:** Should we distribute the 36 checkpoints' tasks progressively?

**Options:**
- **Option A:** Each checkpoint has 3 distinct tasks (T1: Easy, T2: Medium, T3: Stretch)
- **Option B:** Tasks build on each other (CP1: Gather Herbs → CP2: Craft Potion → CP3: Deliver Potion)

**Recommendation:** Option A (maintains current system, easier to implement)

### 2. Level-Up Animation Trigger
**Question:** When should the level-up animation play?

**Options:**
- **Option A:** Every time a gold checkpoint is crossed
- **Option B:** When a full stage is completed
- **Option C:** Based on XP thresholds (every 1000 XP)

**Recommendation:** Option C (most flexible, matches RPG conventions)

### 3. Gold Economy
**Question:** What should gold be used for?

**Options:**
- **Option A:** Cosmetic only (persona skins, checkpoint markers)
- **Option B:** Functional (unlock hints, skip tasks)
- **Option C:** Both cosmetic and functional

**Recommendation:** Option A for MVP (prevents pay-to-win concerns)

### 4. Quest Objectives
**Question:** Should quests be auto-generated or manually defined?

**Options:**
- **Option A:** Manually defined per checkpoint (more control, better narrative)
- **Option B:** Auto-generated from task types (faster implementation)

**Recommendation:** Option A (better user experience, worth the effort)

---

## Implementation Timeline

### Week 1: Asset Creation
- **Days 1-2:** Create biome textures (Forest, Desert, Dungeon, Tundra)
- **Days 3-4:** Create biome textures (Mine, Harbour, Floating Isle, Capital)
- **Day 5:** Create checkpoint markers and enemy textures

### Week 2: World Map Transformation
- **Days 1-2:** Restructure VENTURE_BIOMES and update scene creation
- **Days 3-4:** Implement organic path system
- **Day 5:** Update checkpoint positioning algorithm

### Week 3: HUD & Systems
- **Days 1-2:** Update MapHUD with quest panel and gold counter
- **Days 3-4:** Implement Quest, XP, and Gold systems
- **Day 5:** Update checkpoint animations for biome themes

### Week 4: Polish & Testing
- **Days 1-2:** Update boss system and enemy integration
- **Days 3-4:** Automated and manual testing
- **Day 5:** Bug fixes and performance optimization

---

## Success Metrics

### Performance Targets
- **FPS:** Maintain 60 FPS on desktop, 30 FPS on mobile
- **Load Time:** Initial scene load < 2 seconds
- **Memory:** < 200MB RAM usage

### Visual Quality
- **Biome Distinction:** Each biome should be immediately recognizable
- **Path Flow:** Organic paths should feel natural, not forced
- **Checkpoint Clarity:** Markers should be clear at all zoom levels

### User Experience
- **Quest Clarity:** Users should understand objectives without confusion
- **Progress Feedback:** XP and gold gains should feel rewarding
- **Navigation:** Camera should smoothly follow persona movement

---

## Risk Mitigation

### Technical Risks
1. **Performance Degradation**
   - **Risk:** Complex biome graphics may reduce FPS
   - **Mitigation:** Use lazy loading, optimize textures, implement LOD system

2. **Asset Creation Time**
   - **Risk:** Creating 8 unique biomes may take longer than estimated
   - **Mitigation:** Start with 2-3 biomes for MVP, add others incrementally

3. **Path Algorithm Complexity**
   - **Risk:** Organic path generation may be difficult to implement
   - **Mitigation:** Use Bezier curves or spline interpolation libraries

### Design Risks
1. **Theme Consistency**
   - **Risk:** Biomes may not feel cohesive
   - **Mitigation:** Establish color palette and style guide upfront

2. **Quest Clarity**
   - **Risk:** Users may not understand quest objectives
   - **Mitigation:** User testing with 5-10 beta testers before full rollout

---

## Next Steps

1. **Approval:** Review this plan with stakeholders
2. **Asset Design:** Create mockups for 2-3 biomes
3. **Prototype:** Build Forest biome as proof-of-concept
4. **Iterate:** Gather feedback and refine approach
5. **Full Implementation:** Roll out remaining biomes

---

## Appendix: Code Snippets

### A. Biome Background Creator Template
```typescript
static createForestTiles(scene: Phaser.Scene): void {
  const gfx = scene.add.graphics();
  const SIZE = 64;
  
  // Base grass tile
  gfx.fillStyle(0x2d5016, 1);
  gfx.fillRect(0, 0, SIZE, SIZE);
  
  // Grass texture
  gfx.fillStyle(0x4a7c2f, 0.6);
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    gfx.fillRect(x, y, 2, 4);
  }
  
  // Flowers (random spots)
  gfx.fillStyle(0xffeb3b, 1);
  for (let i = 0; i < 3; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    gfx.fillCircle(x, y, 2);
  }
  
  gfx.generateTexture("forest_tile", SIZE, SIZE);
  gfx.destroy();
}
```

### B. Organic Path Creator
```typescript
static createOrganicPathTextures(scene: Phaser.Scene): void {
  const gfx = scene.add.graphics();
  const WIDTH = 64;
  const HEIGHT = 32;
  
  // Dirt path with varying width
  gfx.fillStyle(0x6b4423, 1);
  gfx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Edge grass
  gfx.fillStyle(0x4a7c2f, 0.8);
  gfx.fillRect(0, 0, 8, HEIGHT);
  gfx.fillRect(WIDTH - 8, 0, 8, HEIGHT);
  
  // Pebbles
  gfx.fillStyle(0x5a3a1a, 0.7);
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * WIDTH;
    const y = Math.random() * HEIGHT;
    gfx.fillCircle(x, y, 1);
  }
  
  gfx.generateTexture("organic_path", WIDTH, HEIGHT);
  gfx.destroy();
}
```

### C. Adventure Checkpoint Marker
```typescript
static createForestCheckpointTexture(scene: Phaser.Scene): void {
  const gfx = scene.add.graphics();
  const SIZE = 64;
  
  // Wooden post
  gfx.fillStyle(0x6b4423, 1);
  gfx.fillRect(SIZE/2 - 4, SIZE/2, 8, SIZE/2);
  
  // Flag
  gfx.fillStyle(0x4caf50, 1);
  gfx.fillTriangle(
    SIZE/2, SIZE/2 - 10,
    SIZE/2, SIZE/2 + 10,
    SIZE/2 + 20, SIZE/2
  );
  
  // Flag border
  gfx.lineStyle(2, 0x2d5016, 1);
  gfx.strokeTriangle(
    SIZE/2, SIZE/2 - 10,
    SIZE/2, SIZE/2 + 10,
    SIZE/2 + 20, SIZE/2
  );
  
  gfx.generateTexture("cp_forest_active", SIZE, SIZE);
  gfx.destroy();
}
```

---

**Document Version:** 1.0  
**Last Updated:** April 20, 2026  
**Author:** Kiro AI Assistant  
**Status:** Ready for Implementation
