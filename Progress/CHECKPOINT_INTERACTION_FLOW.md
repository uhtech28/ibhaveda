# Checkpoint Interaction Flow - Current & Improved Design
**Interactive Ideas — World Map Checkpoint System**  
**Date**: April 20, 2026

---

## Current Implementation

### What Happens When You Click a Checkpoint?

#### 1. User Clicks Checkpoint on Map
```
User clicks checkpoint node in Phaser canvas
    ↓
Phaser emits "CHECKPOINT_CLICKED" event
    ↓
React receives event via event bridge
    ↓
CheckpointPanel slides in from right side
```

#### 2. CheckpointPanel Shows (Right Sidebar)

**Panel Contents**:
```
┌─────────────────────────────────────┐
│  ✕ Close                            │
│                                     │
│  Stage 1 · Ideation                 │
│  Define Problem Statement           │
│                                     │
│  ● Active                           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Identify a clear problem    │   │
│  │ worth solving               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ☐ Task 1: Market Research  │   │
│  │   Research existing pain    │   │
│  │   points                    │   │
│  │   Tool: Write               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ☐ Task 2: Problem Analysis │   │
│  │   Define problem statement  │   │
│  │   Tool: Table               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ☐ Task 3: Validation        │   │
│  │   Validate problem          │   │
│  │   significance              │   │
│  │   Tool: Survey              │   │
│  └─────────────────────────────┘   │
│                                     │
│  Progress: ▓▓▓░░░ 0/3 tasks        │
│  Complete 2 more tasks to advance  │
│                                     │
│  Crossing: Seal Break               │
│                                     │
│  [  Advance Checkpoint →  ]         │
│  (disabled until 2 tasks done)      │
└─────────────────────────────────────┘
```

#### 3. User Clicks Task Checkbox
```
User clicks task checkbox
    ↓
Task is marked as "done" (checkmark appears)
    ↓
Convex mutation: markTaskComplete()
    ↓
Progress bar updates
    ↓
When 2+ tasks done: "Advance" button enables
```

#### 4. User Clicks "Advance Checkpoint"
```
User clicks "Advance Checkpoint" button
    ↓
Checkpoint animation plays (Seal Break, etc.)
    ↓
Audio SFX plays
    ↓
Checkpoint status changes to "completed" or "gold"
    ↓
Panel closes
    ↓
Map updates to show next checkpoint
```

---

## Problem with Current Flow

### ❌ Missing: Actual Work Submission

**Current Issue**:
- User just clicks checkboxes ✓
- No actual work is submitted
- No content is created
- No proof of completion

**What's Missing**:
1. **Submission Form** - Where user enters their work
2. **Content Upload** - Text, files, images, videos
3. **Tool Integration** - Write tool, Table tool, etc.
4. **Validation** - Minimum 50 words, file requirements
5. **Review System** - AI scoring, peer feedback

---

## Improved Design: Checkpoint with Submission Form

### Recommended Flow

#### Option 1: Task-Level Submissions (Recommended)

```
User clicks checkpoint
    ↓
CheckpointPanel opens (right sidebar)
    ↓
User clicks on a task card
    ↓
Task Detail Modal opens (center screen)
    ↓
Shows submission form with tool
    ↓
User completes work and submits
    ↓
AI evaluates submission
    ↓
Task marked as complete
    ↓
Return to CheckpointPanel
```

**Visual Flow**:
```
┌─────────────────────────────────────┐
│  Checkpoint Panel (Right Sidebar)   │
│                                     │
│  Task 1: Market Research            │
│  [Click to work on this task]       │
│      ↓                              │
│      Opens Modal                    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Task Submission Modal      │   │
│  │                             │   │
│  │  Market Research            │   │
│  │  ─────────────────────────  │   │
│  │                             │   │
│  │  [Write Tool Editor]        │   │
│  │  ┌───────────────────────┐ │   │
│  │  │ Type your research... │ │   │
│  │  │                       │ │   │
│  │  │ (minimum 50 words)    │ │   │
│  │  └───────────────────────┘ │   │
│  │                             │   │
│  │  [Upload Files] (optional)  │   │
│  │                             │   │
│  │  [ Cancel ]  [ Submit ]     │   │
│  └─────────────────────────────┘   │
│                                     │
│  After submission:                  │
│  ✓ Task 1: Completed                │
│  Quality Score: 8/12 (High)         │
└─────────────────────────────────────┘
```

#### Option 2: Checkpoint-Level Submission

```
User clicks checkpoint
    ↓
CheckpointPanel opens
    ↓
Shows all 3 tasks with descriptions
    ↓
User clicks "Start Working"
    ↓
Full-screen workspace opens
    ↓
User completes all tasks in one session
    ↓
Submits entire checkpoint
    ↓
AI evaluates all tasks
    ↓
Checkpoint marked complete
```

---

## Detailed Implementation: Task-Level Submissions

### 1. Update CheckpointPanel Component

**Add Click Handler to Task Cards**:
```typescript
function TaskCard({
  task,
  locked,
  onToggle,
  onOpenSubmission, // NEW
}: {
  task: Task;
  locked: boolean;
  onToggle: () => void;
  onOpenSubmission: () => void; // NEW
}) {
  return (
    <motion.div
      onClick={locked ? undefined : task.done ? undefined : onOpenSubmission}
      className="cursor-pointer"
    >
      {/* Task content */}
      {!task.done && !locked && (
        <button className="text-xs text-indigo-400 mt-2">
          Click to work on this task →
        </button>
      )}
    </motion.div>
  );
}
```

### 2. Create TaskSubmissionModal Component

**File**: `src/components/checkpoint/TaskSubmissionModal.tsx`

```typescript
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

// Tool components
import { WriteTool } from "@/components/tools/write-tool";
import { TableTool } from "@/components/tools/table-tool";
import { SurveyTool } from "@/components/tools/survey-tool";
// ... import other tools

interface TaskSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    label: string;
    description: string;
    tool: string;
    checkpointId: Id<"ventureCheckpoints">;
    taskLevel: "t1" | "t2" | "t3";
  };
  onSubmitSuccess: () => void;
}

export function TaskSubmissionModal({
  isOpen,
  onClose,
  task,
  onSubmitSuccess,
}: TaskSubmissionModalProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  
  const submitTask = useMutation(api.worldMap.submitTaskContent);
  
  const handleSubmit = async () => {
    if (wordCount < 50) {
      alert("Please write at least 50 words");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await submitTask({
        checkpointId: task.checkpointId,
        taskLevel: task.taskLevel,
        content,
      });
      
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    const words = newContent.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  };
  
  // Render appropriate tool based on task.tool
  const renderTool = () => {
    switch (task.tool.toLowerCase()) {
      case "write":
        return (
          <WriteTool
            value={content}
            onChange={handleContentChange}
            placeholder="Write your response here..."
          />
        );
      case "table":
        return <TableTool onDataChange={handleContentChange} />;
      case "survey":
        return <SurveyTool onResponseChange={handleContentChange} />;
      // ... other tools
      default:
        return (
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full h-64 p-4 bg-slate-900 text-white rounded-lg"
            placeholder="Write your response here..."
          />
        );
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {task.label}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                        Tool: {task.tool}
                      </span>
                      <span className="text-xs text-slate-500">
                        Minimum: 50 words
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {renderTool()}
              </div>
              
              {/* Footer */}
              <div className="p-6 border-t border-white/10 bg-slate-950/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className={wordCount >= 50 ? "text-green-400" : "text-slate-400"}>
                      {wordCount} words
                    </span>
                    {wordCount < 50 && (
                      <span className="text-slate-500 ml-2">
                        ({50 - wordCount} more needed)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={wordCount < 50 || isSubmitting}
                      className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Task"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### 3. Update Convex Backend

**File**: `convex/worldMap.ts`

```typescript
// Add new mutation for task submission
export const submitTaskContent = mutation({
  args: {
    checkpointId: v.id("ventureCheckpoints"),
    taskLevel: v.union(v.literal("t1"), v.literal("t2"), v.literal("t3")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    // Validate content length
    const wordCount = args.content.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 50) {
      throw new Error("Content must be at least 50 words");
    }
    
    // Get checkpoint
    const checkpoint = await ctx.db.get(args.checkpointId);
    if (!checkpoint) throw new Error("Checkpoint not found");
    
    // Create task submission record
    const submissionId = await ctx.db.insert("taskSubmissions", {
      checkpointId: args.checkpointId,
      taskLevel: args.taskLevel,
      content: args.content,
      userId: identity.subject as Id<"users">,
      submittedAt: Date.now(),
      wordCount,
    });
    
    // Trigger AI evaluation
    await ctx.scheduler.runAfter(0, internal.aiScoring.evaluateTaskSubmission, {
      submissionId,
      content: args.content,
    });
    
    // Mark task as complete
    await ctx.db.patch(args.checkpointId, {
      [`${args.taskLevel}Completed`]: true,
    });
    
    return { success: true, submissionId };
  },
});
```

### 4. Add Database Schema

**File**: `convex/schema.ts`

```typescript
taskSubmissions: defineTable({
  checkpointId: v.id("ventureCheckpoints"),
  taskLevel: v.union(v.literal("t1"), v.literal("t2"), v.literal("t3")),
  content: v.string(),
  userId: v.id("users"),
  submittedAt: v.number(),
  wordCount: v.number(),
  aiScore: v.optional(v.number()),
  aiFeedback: v.optional(v.string()),
}).index("by_checkpoint", ["checkpointId"]),
```

---

## User Experience Flow

### Complete Journey

```
1. User clicks checkpoint on map
   ↓
2. CheckpointPanel slides in (right sidebar)
   Shows: 3 tasks, progress, outcome
   ↓
3. User clicks "Task 1: Market Research"
   ↓
4. TaskSubmissionModal opens (center screen)
   Shows: Write tool editor
   ↓
5. User types their research (minimum 50 words)
   Word counter shows: "127 words ✓"
   ↓
6. User clicks "Submit Task"
   ↓
7. Loading state: "Submitting..."
   ↓
8. AI evaluates submission (2-3 seconds)
   ↓
9. Modal closes, returns to CheckpointPanel
   ↓
10. Task 1 now shows:
    ✓ Task 1: Completed
    Quality Score: 8/12 (High)
    AI Feedback: "Good research with specific examples"
   ↓
11. Progress bar updates: ▓▓▓▓░░ 1/3 tasks
   ↓
12. User repeats for Task 2 and Task 3
   ↓
13. After 2 tasks: "Advance" button enables
   ↓
14. User clicks "Advance Checkpoint"
   ↓
15. Checkpoint animation plays
   ↓
16. Checkpoint marked complete
   ↓
17. Next checkpoint becomes active
```

---

## Benefits of This Approach

### ✅ Advantages

1. **Real Work Submission**
   - Users create actual content
   - Proof of completion
   - Portfolio building

2. **AI Quality Scoring**
   - Immediate feedback
   - Quality assessment
   - Learning opportunity

3. **Tool Integration**
   - Each task uses appropriate tool
   - Write, Table, Survey, etc.
   - Flexible and powerful

4. **Progressive Disclosure**
   - Checkpoint panel shows overview
   - Modal focuses on one task
   - Not overwhelming

5. **Validation**
   - Minimum word count
   - Required fields
   - Quality standards

6. **Gamification**
   - Clear progress tracking
   - Quality scores
   - Achievement unlocks

---

## Implementation Priority

### Phase 1: Core Submission (1-2 days)
- [ ] Create TaskSubmissionModal component
- [ ] Add submitTaskContent mutation
- [ ] Add taskSubmissions table
- [ ] Wire up basic text submission

### Phase 2: Tool Integration (2-3 days)
- [ ] Integrate Write tool
- [ ] Integrate Table tool
- [ ] Integrate Survey tool
- [ ] Add file upload support

### Phase 3: AI Evaluation (1-2 days)
- [ ] Wire AI scoring to submissions
- [ ] Display quality scores
- [ ] Show AI feedback

### Phase 4: Polish (1 day)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success animations
- [ ] Mobile responsive

**Total Time**: 5-8 days

---

## Recommendation

**Implement Task-Level Submissions** (Option 1)

**Why**:
- More granular progress tracking
- Better user experience (one task at a time)
- Easier to implement incrementally
- More flexible for different tools
- Better for mobile

**Next Steps**:
1. Create TaskSubmissionModal component
2. Add backend mutation
3. Test with Write tool
4. Expand to other tools
5. Add AI evaluation

---

**Document Created**: April 20, 2026  
**Status**: Design Complete, Ready for Implementation  
**Estimated Time**: 5-8 days
