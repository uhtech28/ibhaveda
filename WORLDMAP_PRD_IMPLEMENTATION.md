# WorldMapScene PRD Implementation Guide

## Overview

This document provides a complete implementation guide for rebuilding the WorldMapScene to match PRD specifications exactly.

## PRD Requirements Summary

### 1. Snake-Path Overworld
- **Layout**: Horizontal left-to-right progression across 8 biome zones
- **Pattern**: Snake/serpentine path that winds up and down
- **Total Checkpoints**: 36 checkpoints across 8 stages
- **Distribution**: [4, 5, 4, 5, 6, 3, 4, 5] checkpoints per stage

### 2. Two-Layer Brightness System

**Formula (from PRD):**
```
Accumulated Base = (completed stages × 8.57%), capped at 60%
Stage Layer = (current stage tasks done / current stage tasks total) × 40%
World Brightness = Accumulated Base + Stage Layer (0% to 100%)
```

**Key Rules:**
- Accumulated base increases ONLY when a stage is fully completed
- Stage layer resets to 0% when entering a new stage
- Maximum accumulated base is 60% (after 7 complete stages)
- Current stage progress contributes 0-40%
- Total possible brightness: 0% (start) to 100% (all complete)

**Example Calculations:**
- Stage 1, Task 1/12: Base=0%, Stage=3.33%, Total=3.33%
- Stage 1, Task 12/12: Base=0%, Stage=40%, Total=40%
- Stage 2, Task 1/15: Base=8.57%, Stage=2.67%, Total=11.24%
- Stage 8, Task 1/15: Base=60%, Stage=2.67%, Total=62.67%
- Stage 8, Task 15/15: Base=60%, Stage=40%, Total=100%

### 3. Eight Biome Zones

Each biome represents a venture stage with unique visual theme:

| Stage | Biome Name | Theme | Visual Style |
|-------|------------|-------|--------------|
| 1 | The Village | Ideation | Pastoral, cozy buildings, green fields |
| 2 | The Forest | Research | Dense trees, mysterious paths |
| 3 | The Arena | Validation | Colosseum, pillars, competitive atmosphere |
| 4 | The Artisan's Quarter | Offer Design | Workshops, crafts, creative tools |
| 5 | The Mine | Build & Deliver | Dark tunnels, carts, industrial |
| 6 | The Harbour | Launch | Ships, docks, ocean, launching |
| 7 | The Crossroads Town | Iteration | Signposts, markets, multiple paths |
| 8 | The Capital | Scale | Grand buildings, towers, monuments |

### 4. Checkpoint System

**Four States:**
- `locked`: Gray, inaccessible
- `active`: Blue glow, clickable, current position
- `standard-complete`: Green/blue, all tasks done
- `gold-complete`: Gold/amber, all tasks perfect

**Visual Requirements:**
- Checkpoints positioned along snake path
- Clear visual distinction between states
- Click interactions enabled
- Task indicators (t1, t2, t3) visible

### 5. Persona System

**Requirements:**
- Sprite floats 80px above active checkpoint
- Moves with player progress
- Smooth transitions between checkpoints
- Idle animation when stationary

### 6. Boss System

**Super Boss:**
- Visible as silhouette across entire map from start
- Positioned at the end (right side of map)
- Weakens as overall progress increases
- Three opacity states: silhouette → present → foreground

**Mini-Bosses (8 total):**
- One per stage/biome
- Positioned near final checkpoint of each stage
- Weakens as stage checkpoints complete
- Defeated when stage fully completes

## Current Implementation Issues

1. **Incorrect Path Algorithm**: Uses simple sine wave, not proper snake pattern
2. **Wrong Brightness Formula**: Doesn't use two-layer system
3. **Only 2 Biomes**: Should be 8 distinct zones
4. **Ocean Theme**: Should be land-based adventure themes
5. **Checkpoint Positioning**: Doesn't follow proper snake distribution

## Implementation Steps

### Step 1: Define Map Constants

```typescript
// Map dimensions
private readonly TOTAL_CHECKPOINTS = 36;
private readonly BIOME_WIDTH = 1400;  // Each biome is 1400px wide
private readonly MAP_WIDTH = this.BIOME_WIDTH * 8;  // 11,200px total
private readonly MAP_HEIGHT = 1200;

// Snake path configuration
private readonly CHECKPOINT_SPACING = 220;
private readonly SNAKE_AMPLITUDE = 180;  // How far up/down the snake goes
private readonly PATH_Y_CENTER = this.MAP_HEIGHT / 2;
```

### Step 2: Define Biome Configurations

```typescript
interface BiomeConfig {
  id: number;
  name: string;
  theme: string;
  colors: {
    sky: number;
    ground: number;
    accent1: number;
    accent2: number;
    path: number;
  };
}

const BIOME_CONFIGS: BiomeConfig[] = [
  {
    id: 1,
    name: "The Village",
    theme: "Ideation",
    colors: {
      sky: 0x87CEEB,      // Sky blue
      ground: 0x90EE90,   // Light green
      accent1: 0x8B4513,  // Brown (buildings)
      accent2: 0xFFD700,  // Gold (roofs)
      path: 0xD2B48C,     // Tan
    },
  },
  // ... 7 more biomes
];
```

### Step 3: Snake Path Algorithm

The snake path alternates between going up and down every few checkpoints:

```typescript
private calculateSnakePosition(index: number, total: number): { x: number; y: number } {
  // Horizontal progress (left to right)
  const progressRatio = index / (total - 1);
  const x = 200 + progressRatio * (this.MAP_WIDTH - 400);
  
  // Vertical snake wave
  const segmentLength = 4;  // Checkpoints per snake segment
  const segment = Math.floor(index / segmentLength);
  const isUp = segment % 2 === 0;  // Alternates: up, down, up, down...
  const localProgress = (index % segmentLength) / segmentLength;
  
  // Smooth sine wave within each segment
  const wavePhase = localProgress * Math.PI;
  let yOffset: number;
  
  if (isUp) {
    yOffset = -this.SNAKE_AMPLITUDE * Math.sin(wavePhase);
  } else {
    yOffset = this.SNAKE_AMPLITUDE * Math.sin(wavePhase);
  }
  
  const y = this.PATH_Y_CENTER + yOffset;
  
  return { x, y };
}
```

**Visual Pattern:**
```
Checkpoints:  0  1  2  3  4  5  6  7  8  9  10 11 ...
Segments:     [  Seg 0  ] [  Seg 1  ] [  Seg 2  ] ...
Direction:       UP         DOWN        UP       ...

Height:       ╱‾‾╲        ╱‾‾╲        ╱‾‾╲
             ╱    ╲      ╱    ╲      ╱    ╲
            ·      ·────·      ·────·      ·────
```

### Step 4: Two-Layer Brightness Implementation

```typescript
// State tracking
private currentStage: number = 1;
private completedStages: number = 0;  // Stages fully completed
private stageTasksCompleted: number = 0;
private stageTasksTotal: number = 0;

private handleUpdateCheckpoints(event: { checkpoints: CheckpointState[] }): void {
  const checkpoints = event.checkpoints;
  
  // Find current active stage
  const activeCheckpoint = checkpoints.find(
    (cp) => cp.status === "active" || cp.status === "in_progress"
  );
  
  if (activeCheckpoint) {
    this.currentStage = activeCheckpoint.stage;
    
    // Completed stages = all stages before current
    this.completedStages = this.currentStage - 1;
    
    // Count tasks in current stage
    const currentStageCheckpoints = checkpoints.filter(
      (cp) => cp.stage === this.currentStage
    );
    
    this.stageTasksTotal = currentStageCheckpoints.length * 3;  // 3 tasks per checkpoint
    this.stageTasksCompleted = 0;
    
    currentStageCheckpoints.forEach((cp) => {
      if (cp.t1) this.stageTasksCompleted++;
      if (cp.t2) this.stageTasksCompleted++;
      if (cp.t3) this.stageTasksCompleted++;
    });
    
    // Calculate and apply brightness
    this.updateBrightness();
  }
}

private updateBrightness(): void {
  // Accumulated base (completed stages only)
  const accumulatedBase = Math.min(this.completedStages * 8.57, 60);
  
  // Stage layer (current stage progress)
  const stageLayer = this.stageTasksTotal > 0
    ? (this.stageTasksCompleted / this.stageTasksTotal) * 40
    : 0;
  
  // Total brightness
  const worldBrightness = accumulatedBase + stageLayer;
  const finalBrightness = Math.max(0, Math.min(100, worldBrightness));
  
  this.applyBrightnessFilter(finalBrightness);
  
  console.log(
    `Brightness: ${finalBrightness.toFixed(2)}%`,
    `(Base: ${accumulatedBase.toFixed(2)}% + Stage: ${stageLayer.toFixed(2)}%)`
  );
}

private applyBrightnessFilter(brightnessPercent: number): void {
  if (!this.brightnessFilter) return;
  
  const brightness = brightnessPercent / 100;
  
  // Scale from dark (0.1) to bright (1.0)
  const minBrightness = 0.1;
  const brightnessValue = minBrightness + (brightness * (1.0 - minBrightness));
  
  this.brightnessFilter.brightness(brightnessValue);
}
```

### Step 5: Create Biome Zones

```typescript
private createBiomeZones(): void {
  BIOME_CONFIGS.forEach((biome, index) => {
    const container = this.add.container(index * this.BIOME_WIDTH, 0);
    this.biomeContainers.set(biome.id, container);
    this.backgroundLayer.add(container);
    
    // Draw background
    this.drawBiomeBackground(container, biome);
    
    // Add decorations
    this.addBiomeDecorations(container, biome);
    
    // Add label
    this.addBiomeLabel(container, biome);
  });
}

private drawBiomeBackground(
  container: Phaser.GameObjects.Container,
  biome: BiomeConfig
): void {
  const graphics = this.add.graphics();
  
  // Sky (top 60%)
  graphics.fillStyle(biome.colors.sky, 1);
  graphics.fillRect(0, 0, this.BIOME_WIDTH, this.MAP_HEIGHT * 0.6);
  
  // Ground (bottom 40%)
  graphics.fillStyle(biome.colors.ground, 1);
  graphics.fillRect(
    0,
    this.MAP_HEIGHT * 0.6,
    this.BIOME_WIDTH,
    this.MAP_HEIGHT * 0.4
  );
  
  container.add(graphics);
}
```

### Step 6: Create Snake Path

```typescript
private createSnakePath(): void {
  const pathGraphics = this.add.graphics();
  const positions: { x: number; y: number }[] = [];
  
  // Calculate all checkpoint positions
  let globalIndex = 0;
  VENTURE_STAGES.forEach((stage) => {
    for (let cp = 0; cp < stage.checkpoints; cp++) {
      const pos = this.calculateSnakePosition(globalIndex, this.TOTAL_CHECKPOINTS);
      positions.push(pos);
      globalIndex++;
    }
  });
  
  // Draw path connecting checkpoints
  pathGraphics.lineStyle(12, 0x8B7355, 1);  // Brown path
  pathGraphics.beginPath();
  pathGraphics.moveTo(positions[0].x, positions[0].y);
  
  for (let i = 1; i < positions.length; i++) {
    pathGraphics.lineTo(positions[i].x, positions[i].y);
  }
  pathGraphics.strokePath();
  this.midgroundLayer.add(pathGraphics);
  
  // Create checkpoint nodes at each position
  globalIndex = 0;
  VENTURE_STAGES.forEach((stage) => {
    for (let cp = 0; cp < stage.checkpoints; cp++) {
      const pos = positions[globalIndex];
      const checkpointId = `${stage.id}-${cp + 1}`;
      
      const node = new CheckpointNode(this, {
        id: checkpointId,
        stage: stage.id,
        checkpoint: cp + 1,
        status: "locked",
        x: pos.x,
        y: pos.y,
        t1: null,
        t2: null,
        t3: null,
        globalIndex: globalIndex,
      });
      
      this.checkpointNodes.set(checkpointId, node);
      this.gameLayer.add(node);
      
      globalIndex++;
    }
  });
}
```

### Step 7: Position Persona

```typescript
private positionPersonaOnActiveCheckpoint(): void {
  if (!this.persona) return;
  
  // Find active checkpoint
  for (const [id, node] of this.checkpointNodes.entries()) {
    if (node.status === "active" || node.status === "in_progress") {
      // Position persona 80px above checkpoint
      this.persona.setPosition(node.x, node.y - 80);
      this.persona.playIdle();
      return;
    }
  }
}
```

### Step 8: Create Boss System

```typescript
private createSuperBoss(): void {
  const superBossX = this.MAP_WIDTH - 400;
  const superBossY = this.MAP_HEIGHT / 2;
  
  const superBoss = new BossSilhouette(this, {
    bossId: "super_boss",
    bossName: "The Gravemind",
    status: "silhouette",
    x: superBossX,
    y: superBossY,
  });
  
  this.bosses.set("super_boss", superBoss);
  this.gameLayer.add(superBoss);
}

private createMiniBosses(): void {
  const miniBossNames = [
    "The Doubter",
    "The Fogwalker",
    "The Naysayer",
    "The Perfectionist",
    "The Underminer",
    "The Waverer",
    "The Stagnator",
    "The Overwhelmer",
  ];
  
  VENTURE_STAGES.forEach((stage, index) => {
    // Position at end of each stage
    let globalIndex = 0;
    for (let s = 0; s < stage.id - 1; s++) {
      globalIndex += VENTURE_STAGES[s].checkpoints;
    }
    globalIndex += stage.checkpoints - 1;
    
    const pos = this.calculateSnakePosition(globalIndex, this.TOTAL_CHECKPOINTS);
    
    const miniBoss = new MiniBoss(this, {
      bossId: `mini_boss_${stage.id}`,
      bossType: miniBossNames[index],
      stage: stage.id,
      x: pos.x + 100,
      y: pos.y - 120,
    });
    
    this.miniBosses.set(stage.id, miniBoss);
    this.gameLayer.add(miniBoss);
  });
}
```

## Testing Checklist

- [ ] All 8 biomes visible left to right
- [ ] Snake path winds correctly through all checkpoints
- [ ] Total 36 checkpoints positioned correctly
- [ ] Brightness starts at ~10% (very dark)
- [ ] Brightness increases as tasks complete
- [ ] Stage completion adds 8.57% to accumulated base
- [ ] Moving to new stage resets stage layer to 0%
- [ ] Final brightness reaches 100% at full completion
- [ ] Persona appears above active checkpoint
- [ ] Super boss visible from start
- [ ] 8 mini-bosses positioned correctly
- [ ] Checkpoint states update correctly
- [ ] Click handlers work on all checkpoints

## Visual Reference

### Map Layout
```
[Village][Forest][Arena][Artisan][Mine][Harbour][Crossroads][Capital]
   4cp     5cp     4cp     5cp     6cp    3cp       4cp       5cp
   
   ╱‾╲    ╱‾╲    ╱‾╲    ╱‾╲    ╱‾╲   ╱‾╲   ╱‾╲    ╱‾╲
  ·   ·──·   ·──·   ·──·   ·──·   ·─·   ·─·   ·──·   ·
 ·                                                      · (Boss)
```

### Brightness Progression Example

| Stage | Tasks | Acc.Base | Stage | Total | Visual |
|-------|-------|----------|-------|-------|--------|
| 1     | 0/12  | 0%       | 0%    | 0%    | ▁▁▁▁▁ Very dark |
| 1     | 6/12  | 0%       | 20%   | 20%   | ▂▂▂▂▂ Dark |
| 1     | 12/12 | 0%       | 40%   | 40%   | ▃▃▃▃▃ Dim |
| 2     | 0/15  | 8.57%    | 0%    | 8.57% | ▂▂▂▂▂ Reset! |
| 2     | 15/15 | 8.57%    | 40%   | 48.57%| ▄▄▄▄▄ Medium |
| 3     | 0/12  | 17.14%   | 0%    | 17.14%| ▂▂▂▂▂ Reset! |
| ...   | ...   | ...      | ...   | ...   | ... |
| 8     | 0/15  | 60%      | 0%    | 60%   | ▆▆▆▆▆ Bright |
| 8     | 15/15 | 60%      | 40%   | 100%  | ██████ Full! |

## Notes

1. **Stage resets are intentional** - Creates motivation peaks and valleys
2. **60% cap on accumulated base** - Ensures stage 8 progress still matters
3. **Snake pattern** - More engaging than straight line
4. **Biome progression** - Visual storytelling of venture journey
5. **Boss weakening** - Progress visualization feedback

## Files to Modify

1. `src/lib/phaser/scenes/WorldMapScene.ts` - Main implementation
2. `src/lib/phaser/entities/CheckpointNode.ts` - May need state updates
3. `src/lib/phaser/entities/Persona.ts` - Positioning logic
4. `src/lib/phaser/entities/Boss.ts` - Silhouette states
5. `src/lib/phaser/entities/MiniBoss.ts` - Weakness system

## Implementation Priority

1. **High Priority** (MVP):
   - Snake path algorithm
   - Two-layer brightness system
   - 8 biome zones (simple backgrounds)
   - Checkpoint positioning

2. **Medium Priority** (Polish):
   - Biome decorations
   - Boss positioning
   - Persona movement

3. **Low Priority** (Enhancement):
   - Biome transitions
   - Path decorations
   - Additional visual effects