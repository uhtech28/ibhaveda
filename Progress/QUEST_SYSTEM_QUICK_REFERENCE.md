# Quest System Quick Reference 🎯

## Components Overview

### 🗒️ QuestList
**Location:** `src/components/hud/QuestList.tsx`  
**Purpose:** Floating panel showing current checkpoint's 3 tasks  
**Position:** Top-right corner (auto-positioned)

### 💰 GoldCounter
**Location:** `src/components/hud/GoldCounter.tsx`  
**Purpose:** Display gold with animated coin sprite  
**Position:** In main HUD bar (left side)

### 🏔️ StageInfo (Updated)
**Location:** `src/components/hud/StageInfo.tsx`  
**Purpose:** Show biome name and stage info  
**Variants:** Standard (HUD) or Centered (floating banner)

### ⚡ XPBar (Updated)
**Location:** `src/components/hud/XPBar.tsx`  
**Purpose:** Experience progress bar  
**Style:** Pixel-art with 8 segments

### 🎖️ LevelDisplay (Updated)
**Location:** `src/components/hud/LevelDisplay.tsx`  
**Purpose:** Show player level and phase  
**Features:** Pixel-art frame, mentor crown at L40+

---

## Quick Setup

### 1. Import Atoms
```typescript
import { 
  currentQuestAtom, 
  goldCountAtom, 
  stageInfoAtom 
} from "@/lib/stores/hudStore";
```

### 2. Use in Component
```typescript
const [currentQuest, setCurrentQuest] = useAtom(currentQuestAtom);
const [gold, setGold] = useAtom(goldCountAtom);
const [stageInfo, setStageInfo] = useAtom(stageInfoAtom);
```

---

## Common Patterns

### Pattern 1: Show Quest on Checkpoint Click
```typescript
import { CHECKPOINT_DEFINITIONS } from "@convex/ventureConstants";

const handleCheckpointClick = (stage: number, cp: number, data: any) => {
  const def = CHECKPOINT_DEFINITIONS.find(
    d => d.stage === stage && d.checkpoint === cp
  );
  
  setCurrentQuest({
    checkpointName: def.name,
    stage,
    checkpoint: cp,
    tasks: [
      {
        label: "T1 Easy",
        description: def.t1.prompt,
        tool: def.t1.tool,
        done: data.t1Completed
      },
      {
        label: "T2 Medium",
        description: def.t2.prompt,
        tool: def.t2.tool,
        done: data.t2Completed
      },
      {
        label: "T3 Stretch",
        description: def.t3.prompt,
        tool: def.t3.tool,
        done: data.t3Completed
      }
    ]
  });
};
```

### Pattern 2: Update Gold
```typescript
// Simple update
setGold(250);

// Increment
setGold(prev => prev + 10);

// From checkpoint count
const completedCount = checkpoints.filter(cp => 
  cp.t1Completed && cp.t2Completed && cp.t3Completed
).length;
setGold(completedCount * 10);
```

### Pattern 3: Update Stage Info
```typescript
import { VENTURE_BIOMES } from "@/lib/phaser/config/venture-biomes";

const biome = VENTURE_BIOMES.find(b => b.id === stage);
setStageInfo({
  stageName: biome.name,
  stageIcon: biome.icon,
  biomeName: biome.biomeName,
  stage
});
```

### Pattern 4: Mark Task Complete
```typescript
const completeTask = (taskIndex: 0 | 1 | 2) => {
  setCurrentQuest(prev => {
    if (!prev) return prev;
    const tasks = [...prev.tasks];
    tasks[taskIndex] = { ...tasks[taskIndex], done: true };
    return { ...prev, tasks };
  });
};
```

### Pattern 5: Hide Quest Panel
```typescript
setCurrentQuest(null); // Panel auto-hides
```

---

## Data Structures

### CurrentQuest
```typescript
{
  checkpointName: string;  // "Problem identified"
  stage: number;           // 1-8
  checkpoint: number;      // 1-6
  tasks: [
    {
      label: string;       // "T1 Easy"
      description: string; // Full prompt text
      tool: string;        // "write", "table", "map", etc.
      done: boolean        // Completion status
    }
  ]
}
```

### StageInfo
```typescript
{
  stageName: string;   // "IDEATION"
  stageIcon: string;   // "🌳"
  biomeName: string;   // "The Forest"
  stage: number;       // 1
}
```

---

## Atom Reference

| Atom | Type | Default | Purpose |
|------|------|---------|---------|
| `currentQuestAtom` | `CurrentQuest \| null` | `null` | Active quest data |
| `goldCountAtom` | `number` | `0` | Player's gold |
| `stageInfoAtom` | `object` | See below | Current stage/biome |

**stageInfoAtom default:**
```typescript
{
  stageName: "Ideation",
  stageIcon: "💡",
  biomeName: "The Forest",
  stage: 1
}
```

---

## Styling Classes

### Pixel-Art Borders
```tsx
className="border-2 border-white/20 rounded-none"
style={{ boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.8)" }}
```

### Pixel Corners
```tsx
<div className="absolute -top-1 -left-1 w-2 h-2 bg-white/30 border border-white/50" />
<div className="absolute -top-1 -right-1 w-2 h-2 bg-white/30 border border-white/50" />
<div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white/30 border border-white/50" />
<div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white/30 border border-white/50" />
```

### Text Shadow (Pixel Style)
```tsx
style={{ textShadow: "2px 2px 0px rgba(0, 0, 0, 0.9)" }}
```

### Retro Colors
- Background: `bg-[#0f1419]`
- Borders: `border-white/20`
- Gold: `text-amber-400`, `border-amber-500/40`
- Emerald (complete): `text-emerald-400`, `border-emerald-500/50`
- Indigo (XP): `text-indigo-400`, `border-indigo-500/40`

---

## Component Props

### QuestList
```typescript
// No props - reads from currentQuestAtom
<QuestList />
```

### GoldCounter
```typescript
<GoldCounter />              // Full version
<GoldCounter compact />      // Compact version
```

### StageInfo
```typescript
<StageInfo
  stageName="Ideation"
  stageIcon="🌳"
  biomeName="The Forest"
  stage={1}
  centered={false}  // Default: inline HUD version
/>

<StageInfo
  stageName="Ideation"
  stageIcon="🌳"
  biomeName="The Forest"
  stage={1}
  centered={true}   // Floating centered banner
/>
```

---

## Event Handlers

### On Checkpoint Open
```typescript
const openCheckpoint = (stage: number, cp: number) => {
  const def = CHECKPOINT_DEFINITIONS.find(/*...*/);
  const data = await fetchCheckpointData(stage, cp);
  setCurrentQuest({
    checkpointName: def.name,
    stage, checkpoint: cp,
    tasks: [/* map from def + data */]
  });
};
```

### On Checkpoint Close
```typescript
const closeCheckpoint = () => {
  setCurrentQuest(null);
};
```

### On Task Complete
```typescript
const onTaskComplete = (taskLevel: "t1" | "t2" | "t3") => {
  // Award gold
  setGold(prev => prev + 5);
  
  // Update task in currentQuest
  const taskIndex = { t1: 0, t2: 1, t3: 2 }[taskLevel];
  setCurrentQuest(prev => {
    const tasks = [...prev.tasks];
    tasks[taskIndex] = { ...tasks[taskIndex], done: true };
    return { ...prev, tasks };
  });
  
  // Update in database
  await updateCheckpointTask(stage, cp, taskLevel, true);
};
```

### On Biome Enter
```typescript
const enterBiome = (stage: number) => {
  const biome = VENTURE_BIOMES.find(b => b.id === stage);
  setStageInfo({
    stageName: biome.name,
    stageIcon: biome.icon,
    biomeName: biome.biomeName,
    stage
  });
};
```

---

## Animation Triggers

### Gold Increase
```typescript
setGold(prev => prev + 50); // Triggers:
// - Coin rotation
// - Sparkle effect
// - Floating "+50" indicator
// - Scale pulse
```

### Quest Task Complete
```typescript
// Update task.done = true triggers:
// - Checkmark animation
// - Green glow effect
// - Line-through text
// - Completion banner (if all tasks done)
```

### Level Up
```typescript
// Handled by LevelDisplay automatically when level changes
// Shows mentor crown at level 40+
```

---

## Debugging

### Quest Panel Not Showing
```typescript
// Check atom value
const [currentQuest] = useAtom(currentQuestAtom);
console.log("Current quest:", currentQuest);

// Should return object or null
// If null, panel is hidden
```

### Gold Not Updating
```typescript
const [gold] = useAtom(goldCountAtom);
console.log("Current gold:", gold);

// Check if setGold is being called
setGold(prev => {
  console.log("Old gold:", prev, "New gold:", prev + 10);
  return prev + 10;
});
```

### Stage Info Wrong
```typescript
const [stageInfo] = useAtom(stageInfoAtom);
console.log("Stage info:", stageInfo);

// Ensure all fields present
// stageName, stageIcon, biomeName, stage
```

---

## Integration Checklist

- [ ] Import atoms in map/checkpoint page
- [ ] Set `currentQuestAtom` on checkpoint click
- [ ] Set `goldCountAtom` on venture load
- [ ] Set `stageInfoAtom` on stage change
- [ ] Update quest tasks when completed
- [ ] Clear quest on checkpoint close
- [ ] HUD.tsx includes `<QuestList />` and `<GoldCounter />`

---

## File Locations

```
src/
├── components/hud/
│   ├── QuestList.tsx        ← Quest panel
│   ├── GoldCounter.tsx      ← Gold display
│   ├── StageInfo.tsx        ← Biome/stage info
│   ├── XPBar.tsx            ← Experience bar
│   ├── LevelDisplay.tsx     ← Level/phase display
│   └── HUD.tsx              ← Main container
├── lib/stores/
│   └── hudStore.ts          ← Atoms defined here
└── app/map/
    └── page.tsx             ← Integration point
```

---

## Support

See full documentation: `QUEST_SYSTEM_UPDATE.md`  
See examples: `QUEST_SYSTEM_INTEGRATION_EXAMPLE.tsx`
