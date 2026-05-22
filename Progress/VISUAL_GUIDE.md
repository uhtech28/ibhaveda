# Visual Integration Guide - Agent 2

## 🎨 What You're Building

### Before Integration
```
[Task Card]
├─ Checkbox (☐)
├─ Task Label
├─ Task Description
└─ Tool Type
```

### After Integration
```
[Task Card with AI Scoring]
├─ Checkbox (☑️)
├─ Task Label  
├─ Task Description
├─ Tool Type
├─ ⏳ "Evaluating quality..." (loading)
└─ [Quality Tier Badge]
    ├─ Tier Label (Low/Standard/High)
    ├─ Total Score (X/12)
    ├─ Completeness: ▓▓▓░ 2/3
    ├─ Specificity:  ▓▓▓░ 2/3
    ├─ Evidence:     ▓▓░░ 2/3
    ├─ Originality:  ▓▓▓░ 3/3
    └─ Feedback: "Great specific examples!"
```

## 🔄 Data Flow Diagram

```
┌─────────────┐
│ User clicks │
│  checkbox   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ handleTaskToggle()  │
└──────┬──────────────┘
       │
       ├─► markTaskComplete() ──► Task marked ✅
       │
       └─► evaluateTaskSubmission() ──┐
                                       │
       ┌───────────────────────────────┘
       │
       ▼
┌─────────────────┐
│ AI Scoring      │
│ ┌─────────────┐ │
│ │Completeness │ │
│ │Specificity  │ │
│ │Evidence     │ │
│ │Originality  │ │
│ └─────────────┘ │
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│ setTaskScores()  │
└──────┬───────────┘
       │
       ▼
┌──────────────────────┐
│ QualityTierBadge    │
│ renders with data   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ HUD Valuation Score │
│ updates (Jotai)     │
└─────────────────────┘
```

## 📁 File Structure

```
interactiveideas/
├── src/
│   ├── app/
│   │   └── map/
│   │       └── world/
│   │           └── page.tsx ◄─── MODIFY THIS FILE
│   │
│   └── components/
│       ├── venture/
│       │   ├── QualityTierBadge.tsx ◄─── ALREADY BUILT ✅
│       │   └── ContributionModal.tsx ◄─── ALREADY BUILT ✅
│       │
│       └── hud/
│           └── QualityScore.tsx ◄─── ALREADY DISPLAYS VALUATION
│
├── convex/
│   ├── aiScoring.ts ◄─── BACKEND READY ✅
│   └── ventures.ts ◄─── BACKEND READY ✅
│
└── Documentation/
    ├── README_AGENT2.md ◄─── START HERE
    ├── INTEGRATION_QUICKSTART.md ◄─── STEP-BY-STEP GUIDE
    ├── TASK_2_INTEGRATION_SUMMARY.md
    ├── AGENT2_COMPLETION_REPORT.md
    ├── INTEGRATION_CHECKLIST.md
    └── VISUAL_GUIDE.md ◄─── YOU ARE HERE
```

## 🎯 Code Changes Visual Map

### File: `src/app/map/world/page.tsx`

```typescript
// LINE 784: Add action hook
const evaluateTaskSubmission = useAction(api.aiScoring.evaluateTaskSubmission);

// LINE 805: Add state
const [taskScoring, setTaskScoring] = useState<Record<string, boolean>>({});
const [taskScores, setTaskScores] = useState<Record<string, {...}>>({});

// LINE 271: Update CheckpointPanel signature
function CheckpointPanel({
  detail,
  onClose,
  onAdvance,
  onTaskToggle,
  taskScores,  ◄─── ADD THIS
  taskScoring, ◄─── ADD THIS
}: {...}) {

// LINE 376: Update task rendering
{detail.tasks.map((task, i) => {
  const scoringKey = ...;
  const score = taskScores[scoringKey];
  const isScoring = taskScoring[scoringKey];
  
  return (
    <TaskCard
      ...
      score={score}      ◄─── ADD THIS
      isScoring={isScoring} ◄─── ADD THIS
    />
  );
})}

// LINE 519: Update TaskCard signature
function TaskCard({
  task,
  locked,
  onToggle,
  score,     ◄─── ADD THIS
  isScoring, ◄─── ADD THIS
}: {...}) {

// LINE 591: Add quality badge
{isScoring && <LoadingSpinner />}
{task.done && score && <QualityTierBadge {...score} />}

// LINE 1225: Update handleTaskToggle
const handleTaskToggle = useCallback(async (taskIdx: number) => {
  ...
  await markTaskComplete({...});
  
  // NEW: Add AI scoring
  setTaskScoring((prev) => ({...prev, [scoringKey]: true}));
  const result = await evaluateTaskSubmission({...});
  setTaskScores((prev) => ({...prev, [scoringKey]: result}));
  ...
}, [... , evaluateTaskSubmission]); ◄─── ADD TO DEPS

// LINE 1500: Wire props
<CheckpointPanel
  ...
  taskScores={taskScores}    ◄─── ADD THIS
  taskScoring={taskScoring}  ◄─── ADD THIS
/>
```

## 🎨 UI Components Visual

### QualityTierBadge Appearance

```
┌─────────────────────────────────────────┐
│ 🔼 High Quality               10 / 12   │
├─────────────────────────────────────────┤
│ ✓ Complete    ▓▓▓░ 2/3                 │
│ 🎯 Specific    ▓▓▓░ 3/3                 │
│ 📄 Evidence    ▓▓░░ 2/3                 │
│ 💡 Original    ▓▓▓░ 3/3                 │
├─────────────────────────────────────────┤
│ Excellent work with specific examples!  │
│ Great use of real-world evidence.       │
└─────────────────────────────────────────┘
 └─ Green glow (High tier)
```

### Tier Colors

| Tier | Score | Color | Glow |
|------|-------|-------|------|
| **Low** | 0-4 | 🔴 Red | Red glow |
| **Standard** | 5-8 | 🔵 Blue | Blue glow |
| **High** | 9-12 | 🟢 Green | Green glow |

## 🔌 Integration Points

### 1. State Management
```
taskScoring: { "cp123-t1": true }  ◄─── Loading state
taskScores: {                      ◄─── Results
  "cp123-t1": {
    completeness: 2,
    specificity: 3,
    evidence: 2,
    originality: 3,
    totalScore: 10,
    qualityTier: "high",
    feedback: "...",
    valuationScore: 2000000
  }
}
```

### 2. Scoring Key Format
```
scoringKey = `${checkpointId}-${taskLevel}`
Example: "j973x9nk8k7n9m8k7-t1"
```

### 3. HUD Integration (Automatic)
```
stageQuality query refetches
      ↓
userProgressAtom updates
      ↓
QualityScore component re-renders
      ↓
Valuation score animates
```

## ⚡ Performance Notes

- **Non-blocking:** Scoring happens after task is marked complete
- **Optimistic UI:** Task checkbox updates immediately
- **Async scoring:** Doesn't block user interaction
- **Error handling:** Falls back to standard tier on failure
- **Caching:** Scores stored in local state (persists during session)

## 🐛 Debugging Checklist

```
❌ Badge not showing?
  → Check task.done === true
  → Check score exists in taskScores
  → Check isScoring === false

❌ Loading spinner stuck?
  → Check taskScoring[scoringKey] === true
  → Check browser console for API errors
  → Verify API keys set

❌ Wrong tier color?
  → Check totalScore calculation
  → Verify tier thresholds (0-4, 5-8, 9-12)
  → Check qualityTier value

❌ HUD not updating?
  → Check stageQuality query
  → Verify Jotai atom subscription
  → Check console for query errors
```

## 🎬 Quick Start Commands

```bash
# 1. Review the integration guide
open INTEGRATION_QUICKSTART.md

# 2. Start development server
npm run dev

# 3. Open the app
open http://localhost:3000

# 4. Navigate to venture map and test
```

## ✅ Success Indicators

When integration is working correctly, you'll see:

1. ✅ Task checkbox toggles instantly
2. ✅ "Evaluating quality..." appears below task
3. ✅ After 2-5 seconds, badge appears
4. ✅ Badge shows correct color (Red/Blue/Green)
5. ✅ 4 dimension bars animate
6. ✅ Feedback text displays
7. ✅ HUD valuation score increases
8. ✅ No console errors

---

**Next Step:** Open `INTEGRATION_QUICKSTART.md` and follow steps 1-8 (15 minutes)
