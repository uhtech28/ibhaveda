# 🚀 Deploy PRD-Compliant World Map NOW

## Quick Deployment (5 Minutes)

### Step 1: Backup Current File
```bash
cd interactiveideas
cp src/lib/phaser/scenes/WorldMapScene.ts src/lib/phaser/scenes/WorldMapScene_BACKUP.ts
```

### Step 2: Deploy New Implementation
```bash
cp src/lib/phaser/scenes/WorldMapScene_NEW.ts src/lib/phaser/scenes/WorldMapScene.ts
```

### Step 3: Test Build
```bash
npm run build
```

**If build fails:** See Troubleshooting section below

### Step 4: Start Dev Server
```bash
npm run dev
```

### Step 5: Open Browser
Navigate to: `http://localhost:3000/map`

---

## ✅ Quick Visual Verification (2 Minutes)

Open the map and check:

- [ ] Map loads without errors
- [ ] Can see multiple biomes (scroll left to right)
- [ ] Path winds in snake pattern (not just smooth wave)
- [ ] Checkpoints are clickable
- [ ] Brightness is very dark at start (~0-10%)
- [ ] Console has no red errors

**If all checked:** Success! 🎉

**If issues:** See Troubleshooting below

---

## 🧪 Detailed Testing (10 Minutes)

### Test 1: Visual Verification
- [ ] Scroll across map - see 8 different biome zones
- [ ] Count checkpoints - should be 36 total
- [ ] Path goes up and down in segments (snake-like)
- [ ] Biome labels visible (Village, Forest, Arena, etc.)
- [ ] Boss visible on right side of map

### Test 2: Brightness System
- [ ] Start new venture → Very dark (~0%)
- [ ] Complete 1 task → Brightness increases slightly
- [ ] Complete Stage 1 → Brightness ~40%
- [ ] Enter Stage 2 → Brightness drops to ~8.57% ⚠️ RESET!
- [ ] Complete Stage 2 → Brightness ~48.57%

**Critical:** Stage layer MUST reset when entering new stage!

### Test 3: Interactions
- [ ] Click checkpoint → Task panel opens
- [ ] Persona visible above active checkpoint
- [ ] Camera drag works smoothly
- [ ] Complete checkpoint → Animation plays
- [ ] No console errors during interaction

---

## 🐛 Troubleshooting

### Build Fails with Import Errors

**Fix:**
```bash
# Verify entity files exist
ls src/lib/phaser/entities/CheckpointNode.ts
ls src/lib/phaser/entities/PersonaSprite.ts
ls src/lib/phaser/utils/event-bridge.ts
```

If any missing, check original WorldMapScene.ts for correct import paths.

### Map Doesn't Load

**Check console for errors:**
1. F12 → Console tab
2. Look for red error messages
3. Common issue: Missing entity class

**Quick fix:**
```bash
# Restore backup
cp src/lib/phaser/scenes/WorldMapScene_BACKUP.ts src/lib/phaser/scenes/WorldMapScene.ts
npm run dev
```

### Brightness Doesn't Reset Between Stages

**Check:**
- Open `WorldMapScene.ts`
- Find `handleUpdateCheckpoints` method
- Verify `completedStages` is calculated as `currentStage - 1` (not `currentStage`)
- Verify `stageTasksCompleted` resets to 0 when stage changes

### Snake Path Looks Wrong

**Adjust constants:**
```typescript
private readonly SNAKE_AMPLITUDE = 150; // Increase for more pronounced waves
private readonly segmentLength = 4;     // Checkpoints per segment
```

### Missing Biomes

**Check:**
- All 8 biome configs defined at top of file
- `createBiomeZones()` called in `create()` method
- All decoration methods exist (drawVillageDecorations, etc.)

---

## 🔄 Rollback (If Needed)

If something goes wrong, restore the original:

```bash
cd interactiveideas
cp src/lib/phaser/scenes/WorldMapScene_BACKUP.ts src/lib/phaser/scenes/WorldMapScene.ts
npm run build
npm run dev
```

Your map will return to the ocean/pirate theme.

---

## 📊 What Changed

| Feature | OLD | NEW |
|---------|-----|-----|
| Theme | 🏴‍☠️ Pirate/Ocean | 🗺️ Land Adventure |
| Biomes | 2 | 8 |
| Path | Sine wave | Snake-path |
| Brightness | Simple | Two-layer formula |
| Checkpoints | 35 | 36 |
| PRD Match | ❌ No | ✅ Yes |

---

## 🎯 Success Criteria

You've successfully deployed when:

✅ Map shows 8 distinct biome zones  
✅ Path follows snake pattern through 36 checkpoints  
✅ Brightness starts very dark (~0%)  
✅ Brightness increases with task completion  
✅ Stage layer resets when entering new stage  
✅ No console errors  
✅ All interactions work (click, scroll, etc.)

---

## 📚 Documentation Reference

For more details, see:
- **WORLDMAP_PRD_IMPLEMENTATION.md** - Technical guide
- **WORLDMAP_IMPLEMENTATION_SUMMARY.md** - Quick reference
- **PRD_WORLDMAP_FINAL_SUMMARY.md** - Executive summary
- **VISUAL_MAP_COMPARISON.md** - Visual comparison
- **DEPLOYMENT_READY.md** - Full deployment guide

---

## 💡 Pro Tips

1. **Test brightness reset carefully** - This is the most important PRD feature
2. **Check all 8 biomes** - Scroll across the entire map
3. **Verify 36 checkpoints** - Count them if needed
4. **Keep backup safe** - Don't delete WorldMapScene_BACKUP.ts

---

## 🎉 You're Done!

Once all checks pass, you have a fully PRD-compliant world map with:
- 8 biome zones (Village → Capital)
- Snake-path layout
- Two-layer brightness system
- Complete boss system
- 36 checkpoints

**Congratulations!** 🚀

---

**Need Help?**  
Check console errors and compare with WORLDMAP_PRD_IMPLEMENTATION.md

**Status:** Ready to deploy  
**Time Required:** 5 minutes deployment + 10 minutes testing  
**Risk:** Low (backup exists)