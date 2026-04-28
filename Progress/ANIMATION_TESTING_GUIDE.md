# 🧪 Checkpoint Animations Testing Guide

Quick reference for testing the 4 new checkpoint crossing animations.

---

## 🚀 Quick Start

### 1. Access Phaser Scene in Browser Console

```javascript
// Open browser console (F12) and run:
const scene = window.__PHASER_GAME__.scene.getScene('WorldMap')

// Verify scene is loaded
console.log(scene ? 'Scene ready!' : 'Scene not found')
```

### 2. Basic Test Command

```javascript
// Format: scene.playCheckpointAnimation(checkpointId, stage, variant)
scene.playCheckpointAnimation('test_cp', 3, 'standard')
```

---

## 🎬 Animation Tests

### Seal Break Animation (Stages 3 & 8)

```javascript
// Standard variant (blue, 1.5-2s)
scene.playCheckpointAnimation('test_cp', 3, 'standard')

// Gold variant (gold, 2.5-3.5s)
scene.playCheckpointAnimation('test_cp', 3, 'gold')
```

**Visual Checklist**:
- [ ] Stone seal appears with runes
- [ ] 12 cracks spread across seal
- [ ] Standard: Seal shatters into ~16 fragments
- [ ] Gold: Seal explodes in gold burst (~30 particles)
- [ ] Wooden gate swings open (standard) OR gilded arch appears (gold)
- [ ] Persona silhouette walks through
- [ ] Gold: Crown materializes above checkpoint
- [ ] Gate closes OR arch remains
- [ ] Blue/gold glow pulses on checkpoint

---

### Rune Inscription Animation (Stage 4)

```javascript
// Standard variant
scene.playCheckpointAnimation('test_cp', 4, 'standard')

// Gold variant
scene.playCheckpointAnimation('test_cp', 4, 'gold')
```

**Visual Checklist**:
- [ ] Stone tablet rises from ground (with dust)
- [ ] First line of 5 runes inscribes with ink particles
- [ ] Second line of 5 runes inscribes
- [ ] Gold: Third line of 5 runes inscribes
- [ ] Energy pulse rings expand from tablet (3x)
- [ ] Standard: Tablet sinks back into ground
- [ ] Gold: Tablet levitates and hovers (floating motion)
- [ ] Gold: Border decoration appears (16 symbols)
- [ ] Blue/gold glow appears

---

### Bridge Repair Animation (Stage 5)

```javascript
// Standard variant
scene.playCheckpointAnimation('test_cp', 5, 'standard')

// Gold variant
scene.playCheckpointAnimation('test_cp', 5, 'gold')
```

**Visual Checklist**:
- [ ] Bridge base structure appears
- [ ] 8 wooden planks drop in one-by-one (bounce effect)
- [ ] Rope railings attach along bridge
- [ ] Gold: Planks transform wood → stone (flash)
- [ ] Gold: Stone transforms to marble (flash)
- [ ] Gold: Ropes become gilded chains
- [ ] Gold: Decorative plaque appears at center
- [ ] Persona walks across bridge (bobbing gait)
- [ ] Gold: 20+ sparkles across bridge
- [ ] Blue/gold glow rectangle

---

### Ward Placement Animation (Stage 6)

```javascript
// Standard variant
scene.playCheckpointAnimation('test_cp', 6, 'standard')

// Gold variant
scene.playCheckpointAnimation('test_cp', 6, 'gold')
```

**Visual Checklist**:
- [ ] Persona appears holding ward stone
- [ ] Persona bends and plants stone (impact particles)
- [ ] Gold: Stone grows ornate carvings (flash)
- [ ] Gold: Second ward stone appears opposite side
- [ ] Energy ripples expand (3x waves, 60-80px)
- [ ] Gold: Energy barrier connects both stones (wavy beam)
- [ ] Boundary circle becomes visible (50-70px)
- [ ] 24 particles sweep outward (clearing effect)
- [ ] Shield shimmer layer appears (rotating, pulsing)
- [ ] Gold: 16 sparkles burst around perimeter
- [ ] Blue/gold glow layers

---

## 🎯 Test All Animations (Quick Run)

```javascript
// Copy-paste this entire block to test all 8 combinations:

const scene = window.__PHASER_GAME__.scene.getScene('WorldMap')
const tests = [
  { name: 'Seal Break Standard', stage: 3, variant: 'standard' },
  { name: 'Seal Break Gold', stage: 3, variant: 'gold' },
  { name: 'Rune Inscription Standard', stage: 4, variant: 'standard' },
  { name: 'Rune Inscription Gold', stage: 4, variant: 'gold' },
  { name: 'Bridge Repair Standard', stage: 5, variant: 'standard' },
  { name: 'Bridge Repair Gold', stage: 5, variant: 'gold' },
  { name: 'Ward Placement Standard', stage: 6, variant: 'standard' },
  { name: 'Ward Placement Gold', stage: 6, variant: 'gold' },
]

let index = 0
const runNext = () => {
  if (index >= tests.length) {
    console.log('✅ All tests complete!')
    return
  }
  
  const test = tests[index++]
  console.log(`▶️ Testing: ${test.name}`)
  scene.playCheckpointAnimation('test_cp', test.stage, test.variant)
  
  setTimeout(runNext, 4000) // Wait 4s between tests
}

runNext()
```

---

## 🔍 What to Look For

### Visual Quality
- **60 FPS**: Animations should be smooth, no stuttering
- **Colors**: Standard = blue tones, Gold = gold/amber tones
- **Timing**: Standard ~2s, Gold ~3s (feels natural, not rushed)
- **Particles**: Clean appearance/disappearance, no orphaned graphics
- **Glows**: Subtle and atmospheric, not overwhelming

### Specific Effects

| Animation | Standard Effect | Gold Effect |
|-----------|----------------|-------------|
| Seal Break | Shatter fragments | Gold explosion burst |
| Rune Inscription | Tablet sinks | Tablet hovers |
| Bridge Repair | Wooden bridge | Marble with gold chains |
| Ward Placement | Single ward | Dual wards with barrier |

### Audio (When Available)
- SFX should trigger immediately on animation start
- Check browser console for: `audioManager.playCheckpointSFX` calls
- No audio errors even if files missing

---

## ⚠️ Common Issues

### Animation Doesn't Appear
```javascript
// Check if checkpoint exists
scene.checkpointNodes.get('test_cp')
// If null, use a real checkpoint ID from your map
```

### Animation Appears at Wrong Position
```javascript
// The animation uses the checkpoint node's position
// Make sure you're using a valid checkpoint ID
// Or test at center:
scene.cameras.main.centerX
scene.cameras.main.centerY
```

### Skip Not Working
- Wait 500ms before trying to skip
- Press ESC key or click anywhere on map
- Check console for errors

### Performance Issues
```javascript
// Check FPS in Chrome DevTools
// Performance tab → Record → Play animation → Stop
// Should maintain ~60 FPS throughout
```

### Memory Leaks
```javascript
// Play animation 10 times, check memory doesn't grow
for (let i = 0; i < 10; i++) {
  setTimeout(() => {
    scene.playCheckpointAnimation('test_cp', 3, 'gold')
  }, i * 4000)
}
// Open Chrome DevTools → Memory → Take heap snapshot before/after
// Should be similar size
```

---

## ✅ Final Verification

Run this checklist before marking complete:

**All Animations**:
- [ ] 8 total variations work (4 animations × 2 variants)
- [ ] Standard variants are blue-themed
- [ ] Gold variants are gold-themed
- [ ] Gold variants are noticeably longer/more elaborate
- [ ] Skip works after 500ms (ESC or click)
- [ ] No console errors
- [ ] No visual glitches
- [ ] Maintains 60 FPS
- [ ] No memory leaks after multiple plays

**Stage Mapping**:
- [ ] Stage 3 → Seal Break
- [ ] Stage 4 → Rune Inscription
- [ ] Stage 5 → Bridge Repair
- [ ] Stage 6 → Ward Placement
- [ ] Stage 8 → Seal Break (reused)

**Audio Integration**:
- [ ] SFX calls appear in console
- [ ] Correct SFX ID for each animation/variant
- [ ] No errors even without audio files

---

## 🎓 Advanced Testing

### Test Rapid-Fire Animations
```javascript
// Test cleanup by playing multiple in quick succession
scene.playCheckpointAnimation('test_cp', 3, 'standard')
setTimeout(() => scene.playCheckpointAnimation('test_cp', 4, 'gold'), 500)
setTimeout(() => scene.playCheckpointAnimation('test_cp', 5, 'standard'), 1000)
// Should cleanly stop previous animation
```

### Test All Stages
```javascript
// Verify stage mapping works for all 8 stages
for (let stage = 1; stage <= 8; stage++) {
  setTimeout(() => {
    console.log(`Testing Stage ${stage}`)
    scene.playCheckpointAnimation('test_cp', stage, 'gold')
  }, stage * 4000)
}
```

### Performance Stress Test
```javascript
// Play 5 animations simultaneously (different positions)
const positions = [[100, 100], [300, 100], [500, 100], [300, 300], [500, 300]]
positions.forEach((pos, i) => {
  setTimeout(() => {
    // Would need to modify playCheckpointAnimation to accept custom positions
    // Or test with multiple real checkpoints
  }, i * 100)
})
```

---

## 📊 Expected Results

### Timing Targets
- **Standard**: 1.5-2.5 seconds (randomized)
- **Gold**: 2.5-3.5 seconds (randomized)
- **Skip Delay**: 500ms exactly

### Visual Targets
- **Frame Rate**: Solid 60 FPS
- **Particle Count**: < 30 active at once
- **Container Depth**: 1000 (above map elements)
- **Cleanup**: All graphics destroyed after completion

### Audio Targets (When Files Available)
- **Trigger Time**: < 50ms from animation start
- **Volume**: Controlled by user SFX settings
- **No Overlap**: Previous animation SFX stops

---

## 🐛 Reporting Issues

If you find bugs, note:
1. **Animation Name**: (Seal Break, Rune Inscription, etc.)
2. **Variant**: (standard or gold)
3. **What Happened**: (Describe the issue)
4. **Expected**: (What should have happened)
5. **Browser**: (Chrome, Firefox, Safari, etc.)
6. **Console Errors**: (Copy any error messages)

---

**Happy Testing!** 🎬