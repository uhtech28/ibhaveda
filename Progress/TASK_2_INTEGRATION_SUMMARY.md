# Agent 2 Mission: AI Scoring & Contribution System Integration

## Status: IN PROGRESS

---

## COMPLETED DELIVERABLES ✅

### 1. QualityTierBadge Component
**File:** `src/components/venture/QualityTierBadge.tsx`

**Features Implemented:**
- ✅ 4-dimension score breakdown (Completeness, Specificity, Evidence, Originality)
- ✅ Visual quality tier display (Low/Standard/High)
- ✅ Color-coded badges (Red for Low, Blue for Standard, Green for High)
- ✅ Animated progress bars for each dimension
- ✅ Feedback text display
- ✅ Total score display (0-12)
- ✅ Responsive design with Framer Motion animations

**Usage:**
```tsx
<QualityTierBadge
  completeness={2}
  specificity={3}
  evidence={2}
  originality={3}
  totalScore={10}
  qualityTier="high"
  feedback="Excellent work with specific examples!"
/>
```

---

### 2. ContributionModal Component
**File:** `src/components/venture/ContributionModal.tsx`

**Features Implemented:**
- ✅ Multi-format support (Text, Audio, Video, Image, File)
- ✅ Tab-based format selection UI
- ✅ Text input with live word count (50-word minimum validation)
- ✅ Audio recording with playback controls
- ✅ Video upload with preview
- ✅ Image upload with preview
- ✅ File upload (PDF, PPT, XLS, DOC) with validation
- ✅ Drag-and-drop file upload
- ✅ File type validation per format
- ✅ Submit button disabled until requirements met
- ✅ Loading and success states
- ✅ Error handling and validation feedback
- ✅ Integration with Convex file upload
- ✅ Beautiful modal UI with animations

**Usage:**
```tsx
<ContributionModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  checkpointId={checkpointId}
  taskLevel={taskLevel}
  isGoldCheckpoint={doneTasks >= 3}
  onSuccess={handleSuccess}
/>
```

---

## REMAINING WORK 🚧

### 3. Wire AI Scoring to Frontend

**Required Changes in:** `src/app/map/world/page.tsx`

#### Step 1: Import Updates (PARTIALLY DONE)
- ✅ Add `useAction` to imports
- ✅ Import QualityTierBadge component

#### Step 2: Add Convex Action Hook
Add after line 784:
```tsx
const evaluateTaskSubmission = useAction(api.aiScoring.evaluateTaskSubmission);
```

#### Step 3: Add AI Scoring State
Add after line 805 (showFirstCheckpointPulse):
```tsx
// AI Scoring state
const [taskScoring, setTaskScoring] = useState<Record<string, boolean>>({});
const [taskScores, setTaskScores] = useState<
  Record<
    string,
    {
      completeness: number;
      specificity: number;
      evidence: number;
      originality: number;
      totalScore: number;
      qualityTier: "low" | "standard" | "high";
      feedback: string;
      valuationScore: number;
    }
  >
>({});
```

#### Step 4: Update handleTaskToggle Function (Line 1225)

**Current signature:**
```tsx
const handleTaskToggle = useCallback(
  async (taskIdx: number) => {
    if (!selectedDetail) return;
```

**Update to:**
```tsx
const handleTaskToggle = useCallback(
  async (taskIdx: number) => {
    if (!selectedDetail || !venture || !currentUser) return;
```

**Add after markTaskComplete call:**
```tsx
// Generate scoring key
const scoringKey = `${checkpointId}-${taskLevel}`;

// Set loading state
setTaskScoring((prev) => ({ ...prev, [scoringKey]: true }));

// Call AI scoring asynchronously
try {
  const userTier = currentUser.tier || "free";
  const result = await evaluateTaskSubmission({
    taskId,
    checkpointId,
    ventureId: venture._id,
    stageNumber: venture.currentStage,
    content: task.label, // Use task description
    checkpointOutcome: selectedDetail.outcome || "",
    userTier: userTier as "free" | "pro",
  });

  // Store result
  setTaskScores((prev) => ({
    ...prev,
    [scoringKey]: result,
  }));

  console.log(`✅ Task scored: ${result.qualityTier} (${result.totalScore}/12)`);
} catch (error) {
  console.error("AI scoring failed:", error);
  // Fallback to standard tier
  setTaskScores((prev) => ({
    ...prev,
    [scoringKey]: {
      completeness: 2,
      specificity: 2,
      evidence: 1,
      originality: 2,
      totalScore: 7,
      qualityTier: "standard",
      feedback: "Scoring unavailable - task marked complete",
      valuationScore: 500000,
    },
  }));
} finally {
  setTaskScoring((prev) => ({ ...prev, [scoringKey]: false }));
}
```

**Update dependencies:**
```tsx
[selectedDetail, venture, currentUser, markTaskComplete, evaluateTaskSubmission]
```

#### Step 5: Update CheckpointPanel Component (Line 271)

**Add props:**
```tsx
function CheckpointPanel({
  detail,
  onClose,
  onAdvance,
  onTaskToggle,
  taskScores,      // ADD THIS
  taskScoring,     // ADD THIS
}: {
  detail: CheckpointDetail | null;
  onClose: () => void;
  onAdvance: () => void;
  onTaskToggle: (taskIdx: number) => void;
  taskScores: Record<string, { ... }>;    // ADD THIS
  taskScoring: Record<string, boolean>;   // ADD THIS
})
```

**Update TaskCard rendering (around line 376):**
```tsx
{detail.tasks.map((task, i) => {
  const taskWithIds = task as Task & {
    _convexCheckpointId?: string;
    _taskLevel?: string;
  };
  const scoringKey = taskWithIds._convexCheckpointId && taskWithIds._taskLevel
    ? `${taskWithIds._convexCheckpointId}-${taskWithIds._taskLevel}`
    : "";
  const score = scoringKey ? taskScores[scoringKey] : undefined;
  const isScoring = scoringKey ? taskScoring[scoringKey] : false;

  return (
    <TaskCard
      key={i}
      task={task}
      index={i}
      locked={isLocked}
      onToggle={() => onTaskToggle(i)}
      score={score}          // ADD THIS
      isScoring={isScoring}  // ADD THIS
    />
  );
})}
```

#### Step 6: Update TaskCard Component (Line 519)

**Add props:**
```tsx
function TaskCard({
  task,
  locked,
  onToggle,
  score,       // ADD THIS
  isScoring,   // ADD THIS
}: {
  task: Task;
  index?: number;
  locked: boolean;
  onToggle: () => void;
  score?: { ... };        // ADD THIS
  isScoring?: boolean;    // ADD THIS
})
```

**Add at end of component (before closing div):**
```tsx
{/* AI Scoring Loading */}
{isScoring && (
  <div className="mt-2 text-xs text-indigo-400 flex items-center gap-1">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full"
    />
    Evaluating quality...
  </div>
)}

{/* AI Scoring Result */}
{task.done && score && !isScoring && (
  <QualityTierBadge
    completeness={score.completeness}
    specificity={score.specificity}
    evidence={score.evidence}
    originality={score.originality}
    totalScore={score.totalScore}
    qualityTier={score.qualityTier}
    feedback={score.feedback}
  />
)}
```

#### Step 7: Pass Props to CheckpointPanel (Line 1583)

**Update:**
```tsx
<CheckpointPanel
  detail={selectedDetail}
  onClose={() => setSelectedDetail(null)}
  onAdvance={handleAdvance}
  onTaskToggle={handleTaskToggle}
  taskScores={taskScores}      // ADD THIS
  taskScoring={taskScoring}    // ADD THIS
/>
```

---

### 4. Integrate ContributionModal into Advance Flow

**Location:** `src/app/map/world/page.tsx` - `handleAdvance` function (Line 1265)

**Add state:**
```tsx
const [showContributionModal, setShowContributionModal] = useState(false);
const [contributionCheckpoint, setContributionCheckpoint] = useState<{
  checkpointId: Id<"ventureCheckpoints">;
  taskLevel: "t1" | "t2" | "t3";
  isGold: boolean;
} | null>(null);
```

**Update handleAdvance:**
Before checkpoint advance, check if contribution is required:
```tsx
const handleAdvance = useCallback(async () => {
  if (!selectedDetail || !venture) return;
  const cp = checkpoints.find((c) => c._id === selectedDetail.id);
  if (!cp) return;

  const doneTasks = [cp.t1Completed, cp.t2Completed, cp.t3Completed].filter(Boolean).length;
  if (doneTasks < 2) return;

  const isGold = doneTasks >= 3;
  
  // Show contribution modal for gold checkpoints
  if (isGold) {
    setContributionCheckpoint({
      checkpointId: cp._id,
      taskLevel: "t3", // Use last completed task
      isGold: true,
    });
    setShowContributionModal(true);
    return; // Don't advance yet
  }

  // Continue with normal advance...
  setFlashTrigger((n) => n + 1);
  // ... rest of advance logic
}, [selectedDetail, venture, checkpoints]);
```

**Add modal rendering:**
```tsx
{showContributionModal && contributionCheckpoint && (
  <ContributionModal
    isOpen={showContributionModal}
    onClose={() => {
      setShowContributionModal(false);
      setContributionCheckpoint(null);
    }}
    checkpointId={contributionCheckpoint.checkpointId}
    taskLevel={contributionCheckpoint.taskLevel}
    isGoldCheckpoint={contributionCheckpoint.isGold}
    onSuccess={() => {
      setShowContributionModal(false);
      setContributionCheckpoint(null);
      // Trigger checkpoint advance animation
      handleAdvance();
    }}
  />
)}
```

---

### 5. Verify Backend Validation

**File:** `convex/ventures.ts` (Lines 187-240)

**Status:** ✅ ALREADY WORKING

The `validateContributionRequirement` function correctly:
- Enforces 50-word minimum for text
- Validates file uploads for all formats
- Accepts PDF, PPT, XLS, DOC, PNG, JPG, MP4, MP3
- Returns clear error messages

**No changes needed.**

---

## VALUATION SCORE ANIMATION 🎯

The valuation score is automatically updated via the Convex query:
- `stageQuality` query refetches after scoring
- HUD's `QualityScore` component displays animated ticker
- The value updates reactively through Jotai atoms

**Integration Point:**
- Valuation score calculated in `convex/aiScoring.ts` (VALUATION_MAP)
- Displayed in `src/components/hud/QualityScore.tsx`
- Updates automatically when `stageQuality` changes

---

## TESTING CHECKLIST 🧪

- [ ] Task completion triggers AI scoring
- [ ] Quality badge appears after scoring completes
- [ ] Badge shows correct tier (Low/Standard/High)
- [ ] 4 dimension breakdown displays correctly
- [ ] Feedback text shows up
- [ ] Valuation score updates in HUD
- [ ] HUD ticker animates on score change
- [ ] Contribution modal opens for gold checkpoints
- [ ] Text format: 50-word validation works
- [ ] Audio recording and playback works
- [ ] Video upload and preview works
- [ ] Image upload and preview works
- [ ] File upload works (PDF, PPT, etc.)
- [ ] Drag-and-drop file upload works
- [ ] Submit disabled until requirements met
- [ ] Error handling for failed scoring
- [ ] Fallback to standard tier on error
- [ ] Loading states display correctly
- [ ] Success confirmation shows

---

## INTEGRATION NOTES 📝

### AI Scoring Flow
1. User marks task complete → `handleTaskToggle`
2. Mutation: `markTaskComplete` (marks done immediately)
3. Action: `evaluateTaskSubmission` (async scoring)
4. Result stored in `taskScores` state
5. `QualityTierBadge` component renders result
6. HUD updates valuation score automatically

### Contribution Flow
1. User completes 3 tasks (gold checkpoint)
2. Clicks "Advance Checkpoint"
3. Modal opens: `ContributionModal`
4. User submits evidence (text/audio/video/image/file)
5. Mutation: `submitEvidence` (stores to Convex)
6. Modal closes with success animation
7. Checkpoint advances with animation

### Error Handling
- AI scoring fails → fallback to standard tier (7/12)
- File upload fails → show error message
- Contribution invalid → show validation error
- Task complete always succeeds even if scoring fails

---

## FILES CREATED ✨

1. `src/components/venture/QualityTierBadge.tsx` (127 lines)
2. `src/components/venture/ContributionModal.tsx` (613 lines)
3. `TASK_2_INTEGRATION_SUMMARY.md` (this file)

---

## NEXT STEPS FOR COMPLETION 🚀

1. Apply Step-by-Step changes to `src/app/map/world/page.tsx`
2. Test AI scoring integration end-to-end
3. Test contribution modal with all formats
4. Verify valuation score updates in HUD
5. Test error scenarios
6. Run production build to check for TypeScript errors
7. Deploy and verify in production

---

**Estimated Time to Complete:** 30-45 minutes
**Complexity:** Medium
**Risk Level:** Low (all backend functions already exist)

---

**Agent 2 Mission Status:** 60% Complete
- Components built ✅
- Backend verified ✅
- Frontend integration pending 🚧