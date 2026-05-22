# How to Submit Tasks - User Guide
**Interactive Ideas Platform - Task Submission Tutorial**

---

## 🎯 Quick Overview

The task submission system allows you to complete checkpoint tasks by creating actual work (not just clicking checkboxes!). Each task uses one of **11 productivity tools** and requires real content submission.

---

## 📍 Where to Find It

### Method 1: Direct URL Access

Navigate to a checkpoint page using this URL pattern:

```
/venture/[ventureId]/stage/[stageNumber]/checkpoint/[checkpointNumber]
```

**Example URLs**:
- `/venture/abc123/stage/1/checkpoint/1` - Stage 1, Checkpoint 1
- `/venture/abc123/stage/2/checkpoint/3` - Stage 2, Checkpoint 3
- `/venture/k123456789/stage/4/checkpoint/2` - Stage 4, Checkpoint 2

### Method 2: Click From World Map

1. Go to `/map/world`
2. Click on an **active** or **in-progress** checkpoint (blue/orange colored)
3. The checkpoint detail page opens automatically

### Method 3: From Ventures Page

1. Go to `/my-ventures`
2. Click on your active venture
3. Click "Continue" on current checkpoint
4. Opens the checkpoint detail page

---

## 🖥️ What You'll See

### Page Layout

The checkpoint page shows:

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Map                     Stage X: Stage Name  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Checkpoint Title                                         │
│  Checkpoint Description/Outcome                           │
│                                                           │
│  Progress: 1/3 tasks completed ████████░░░░░░░░ 33%      │
│                                                           │
│  ┌──────────────────────────────────────────────┐        │
│  │ Task 1 (t1): Prompt text here...        [✓]  │        │
│  │ Tool: Write (minimum 50 words)                │        │
│  │                                                │        │
│  │ [Click to expand and submit work] ───────────►│        │
│  └──────────────────────────────────────────────┘        │
│                                                           │
│  ┌──────────────────────────────────────────────┐        │
│  │ Task 2 (t2): Another prompt...          [  ]  │        │
│  │ Tool: Table                                   │        │
│  │                                                │        │
│  │ [Click to expand and submit work] ───────────►│        │
│  └──────────────────────────────────────────────┘        │
│                                                           │
│  ┌──────────────────────────────────────────────┐        │
│  │ Task 3 (t3): Final prompt...            [  ]  │        │
│  │ Tool: Upload                                  │        │
│  │                                                │        │
│  │ [Click to expand and submit work] ───────────►│        │
│  └──────────────────────────────────────────────┘        │
│                                                           │
│  [Complete Checkpoint] (enabled after 2+ tasks)          │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## ✍️ How to Submit a Task

### Step-by-Step Process

#### 1. Click on a Task Card

Click anywhere on the task card (the gray box) to expand it.

**Visual Cue**: The card will expand and show the tool interface.

#### 2. Fill Out the Tool

Depending on the tool type, you'll see different interfaces:

**Write Tool** (Most Common):
```
┌────────────────────────────────────────────────┐
│ Write a summary of...                          │
│                                                 │
│ ┌────────────────────────────────────────────┐ │
│ │ [Type your response here...]                │ │
│ │                                              │ │
│ │ This is where you write your answer.        │ │
│ │                                              │ │
│ │                                              │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
│ Word Count: 45 / 50 words                      │
│ ⚠️ 5 more words needed                         │
│                                                 │
│ [Submit Evidence] (disabled until ≥50 words)   │
│ [Cancel]                                        │
└────────────────────────────────────────────────┘
```

**Table Tool**:
```
┌────────────────────────────────────────────────┐
│ Create a table with...                         │
│                                                 │
│ ┌────────────┬────────────┬──────────────┐    │
│ │ Column 1   │ Column 2   │ Column 3 [+] │    │
│ ├────────────┼────────────┼──────────────┤    │
│ │ Data 1     │ Data 2     │ Data 3       │    │
│ │ [Edit]     │ [Edit]     │ [Edit]       │    │
│ └────────────┴────────────┴──────────────┘    │
│                                                 │
│ [Add Row] [Add Column]                         │
│ [Submit Evidence]                               │
│ [Cancel]                                        │
└────────────────────────────────────────────────┘
```

**Upload Tool**:
```
┌────────────────────────────────────────────────┐
│ Upload supporting documentation...             │
│                                                 │
│ ┌────────────────────────────────────────────┐ │
│ │  📁 Drag & drop files here                  │ │
│ │     or click to browse                      │ │
│ │                                              │ │
│ │  Accepted: PDF, DOCX, Images, Audio, Video  │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
│ Selected: presentation.pdf (2.3 MB)            │
│                                                 │
│ [Submit Evidence]                               │
│ [Cancel]                                        │
└────────────────────────────────────────────────┘
```

#### 3. Meet the Requirements

Each tool has specific requirements:

**Text Tools (Write, Journal)**:
- ✅ Minimum 50 words
- ✅ Real-time word counter
- ✅ Submit button disabled until requirement met

**File Tools (Upload)**:
- ✅ Must upload at least one file
- ✅ File must have a valid storageId

**Other Tools (Table, Map, Survey, Poll, etc.)**:
- ✅ Must have content (non-empty)
- ✅ Varies by tool type

#### 4. Click "Submit Evidence"

Once requirements are met:
- Button becomes enabled (blue/purple)
- Click to submit
- Loading spinner shows "Submitting..."

#### 5. AI Evaluation (Automatic)

After submission:
- Your work is sent to AI (GPT-4 or Llama 3)
- Evaluated on 4 dimensions:
  - **Completeness** (0-3): Did you answer fully?
  - **Specificity** (0-3): Is it detailed enough?
  - **Evidence** (0-3): Did you provide proof/examples?
  - **Originality** (0-3): Is it thoughtful/unique?
- Total score: 0-12
- Quality tier assigned: Low (0-4), Standard (5-8), High (9-12)

#### 6. Task Marked Complete

Success! You'll see:
- ✅ Green checkmark appears on task card
- Progress bar updates (e.g., 1/3 → 2/3)
- Card collapses back to summary view

#### 7. Repeat for Other Tasks

- Click next task card
- Fill out tool
- Submit
- Repeat until you have at least **2 out of 3 tasks** complete

#### 8. Complete Checkpoint

Once you've completed 2+ tasks:
- **"Complete Checkpoint"** button becomes enabled
- Click it to finalize the checkpoint
- Checkpoint animation plays
- Checkpoint marked as complete
- XP awarded
- Move to next checkpoint!

---

## 🎨 The 11 Available Tools

### 1. **Write** 📝
**Use for**: Essays, summaries, descriptions, narratives

**Requirements**: Minimum 50 words

**Example Prompts**:
- "Write a summary of your target market..."
- "Describe your value proposition..."
- "Explain the problem you're solving..."

### 2. **Table** 📊
**Use for**: Competitor analysis, feature comparisons, pricing tiers

**Requirements**: At least 1 row and 1 column

**Example Prompts**:
- "Create a competitor comparison table..."
- "List your pricing tiers..."
- "Document your feature set..."

### 3. **Map** 🗺️
**Use for**: User journey maps, system diagrams, process flows

**Requirements**: At least one element on canvas

**Example Prompts**:
- "Map out the user journey..."
- "Create a system architecture diagram..."
- "Show the customer acquisition funnel..."

### 4. **Survey** 📋
**Use for**: User research questionnaires, feedback forms

**Requirements**: At least 3 questions

**Example Prompts**:
- "Design a survey to validate your assumptions..."
- "Create a customer satisfaction survey..."

### 5. **Poll** 🗳️
**Use for**: Quick A/B tests, preference voting

**Requirements**: 2+ options

**Example Prompts**:
- "Poll users on their preferred pricing model..."
- "Vote on feature priorities..."

### 6. **Link** 🔗
**Use for**: Share URLs, reference materials, demos

**Requirements**: Valid URL

**Example Prompts**:
- "Link to your prototype or mockup..."
- "Share competitor websites..."
- "Reference research articles..."

### 7. **Upload** 📤
**Use for**: Files, documents, images, audio, video

**Requirements**: At least 1 file uploaded

**Accepted Formats**: PDF, DOCX, PNG, JPG, MP3, MP4, etc.

**Example Prompts**:
- "Upload your business model canvas..."
- "Share interview recordings..."
- "Attach financial projections..."

### 8. **OAuth** 🔐
**Use for**: Connect third-party accounts, import data

**Requirements**: Successful OAuth connection

**Example Prompts**:
- "Connect your Google Analytics..."
- "Import customer data from CRM..."

### 9. **Self-Report** 📊
**Use for**: Self-assessments, metrics tracking

**Requirements**: Complete all fields

**Example Prompts**:
- "Report your weekly active users..."
- "Self-assess your progress..."

### 10. **Journal** 📖 ⭐ NEW
**Use for**: Daily logs, reflection entries, learning notes

**Requirements**: Minimum 50 words

**Features**:
- Optional title field
- Markdown formatting
- Timestamp on submission

**Example Prompts**:
- "Journal your learnings from this week..."
- "Reflect on customer feedback..."
- "Document your pivot decisions..."

### 11. **Kanban** 📋 ⭐ NEW
**Use for**: Task boards, sprint planning, workflow tracking

**Requirements**: At least 1 card

**Features**:
- 3 columns: To Do, In Progress, Done
- Add/move/delete cards
- Submit board state as JSON

**Example Prompts**:
- "Plan your MVP features on a Kanban board..."
- "Track your weekly tasks..."
- "Organize your launch checklist..."

---

## ✅ Validation & Requirements

### Text Content (Write, Journal)
```
❌ "This is my idea." (4 words - too short!)
✅ "This is my idea to solve the parking problem in urban areas. 
    I've noticed that drivers spend an average of 15 minutes 
    looking for parking, wasting time and fuel. My solution 
    uses real-time sensors and a mobile app to guide drivers 
    to available spots instantly..." (50+ words - valid!)
```

**Word Counter**: Real-time display shows:
- "45 / 50 words" (gray) - Not enough
- "5 more words needed" (amber warning)
- "53 / 50 words" (green) - Ready to submit!
- "✓ Requirement met" (green checkmark)

### File Upload
```
❌ No file selected - Submit disabled
✅ "presentation.pdf (2.3 MB)" - Submit enabled
```

### Other Tools
- Must have content (non-empty fields)
- Validation happens on submit
- Error messages shown if invalid

---

## ⚠️ Error Handling

### Common Errors

**"Contribution too short. Please write at least 50 words."**
- **Cause**: Text submission < 50 words
- **Fix**: Add more content until word count ≥ 50

**"File upload is required. Please upload a file."**
- **Cause**: No file selected in Upload tool
- **Fix**: Click "Browse" or drag-and-drop a file

**"Text content is required"**
- **Cause**: Empty text field
- **Fix**: Write something in the editor

**"Content is required for this tool"**
- **Cause**: Other tools have empty content
- **Fix**: Fill out all required fields

### Error Display

Errors appear as red alert boxes above the tool:
```
┌────────────────────────────────────────────────┐
│ ⚠️ Contribution too short. Please write at     │
│    least 50 words.                              │
└────────────────────────────────────────────────┘
```

Errors clear when:
- You fix the issue and retry
- You click "Cancel" to close the task

---

## 🏆 Gold Checkpoint Bonus

### What is a Gold Checkpoint?

Complete **all 3 tasks** in a checkpoint (instead of just 2) to earn:
- 🌟 Gold Checkpoint status
- 💰 Bonus points (typically +50 points)
- 🎉 Special notification
- ✨ Gold animation on world map

### How to Get Gold

```
Regular Checkpoint:  Complete 2/3 tasks → Standard completion
Gold Checkpoint:     Complete 3/3 tasks → Gold completion + bonus!
```

**Notification**:
```
🌟 You earned a Gold Checkpoint!
   All 3 tasks completed. +50 points
```

---

## 🎯 Tips for Success

### 1. **Plan Before You Start**
- Read all 3 task prompts first
- Decide which tool makes most sense
- Aim for gold (all 3) if possible

### 2. **Use the Right Tool**
- Text prompts → Write or Journal
- Data/comparisons → Table
- Visual/diagrams → Map
- Research questions → Survey
- Files/docs → Upload

### 3. **Meet Quality Standards**
- Don't just hit 50 words with fluff
- AI evaluates quality (completeness, specificity, evidence, originality)
- Higher quality → Higher Valuation Score

### 4. **Save Your Work**
- Some tools auto-save drafts
- Others require submission to save
- Don't refresh page before submitting!

### 5. **Review Feedback**
- After submission, check your quality score
- Learn from AI feedback
- Improve on next checkpoint

---

## 🔄 Progress Tracking

### Visual Indicators

**Progress Bar**:
```
Progress: 2/3 tasks completed ████████████░░░░ 67%
```

**Task Checkmarks**:
- ⬜ Empty box = Not started
- ✅ Green check = Complete

**Checkpoint Status Colors**:
- 🔒 Gray = Locked (can't access yet)
- 🔵 Blue = Active (current checkpoint)
- 🟠 Orange = In Progress (started, not done)
- ✅ Green = Completed
- 🌟 Gold = Completed with bonus

---

## 📱 Mobile Experience

The task submission UI is **fully responsive**:
- Works on desktop, tablet, mobile
- Tool editors adapt to screen size
- Touch-friendly interactions
- Swipe to navigate tasks

---

## 🚀 Quick Start Example

### Complete Your First Task (5 minutes)

1. **Go to**: `/venture/[your-venture-id]/stage/1/checkpoint/1`

2. **Click** on Task 1 card

3. **See** the Write tool appear

4. **Type** your response (aim for 60+ words)

5. **Watch** the word counter: "60 / 50 words ✓"

6. **Click** "Submit Evidence"

7. **Wait** for AI evaluation (2-3 seconds)

8. **See** ✅ appear on Task 1

9. **Repeat** for Task 2

10. **Click** "Complete Checkpoint" button

11. **Enjoy** the animation! 🎉

---

## 🆘 Troubleshooting

### "I don't see the task submission page"

**Check**:
- Are you logged in?
- Is the URL correct? (should have venture ID, stage, checkpoint)
- Is this checkpoint active/unlocked?

**Fix**: Go to `/my-ventures`, select venture, click current checkpoint

### "Submit button is disabled"

**Check**:
- Word count (must be ≥ 50 for text tools)
- File selected (for upload tool)
- Content filled out (for other tools)

**Fix**: Complete requirements, button will auto-enable

### "Nothing happens when I submit"

**Check**:
- Network connection
- Console for errors (F12 → Console tab)

**Fix**: Try refreshing page and re-submitting

### "My work didn't save"

**Cause**: May have refreshed before submission completed

**Fix**: 
- Always wait for ✅ checkmark before closing
- Some tools auto-save drafts (check for "Saved" indicator)
- Re-submit if needed

---

## 📊 What Happens Behind the Scenes

### Submission Flow

```
1. User submits content
   ↓
2. Client validates (50 words, file exists, etc.)
   ↓
3. Content sent to Convex backend
   ↓
4. Server validates again (security!)
   ↓
5. Content saved to database
   ↓
6. AI evaluation triggered (async)
   ↓
7. AI scores 4 dimensions (0-3 each)
   ↓
8. Quality tier calculated (Low/Standard/High)
   ↓
9. Valuation Score updated (5/25/100)
   ↓
10. Task marked complete
   ↓
11. UI updates with ✅
   ↓
12. User sees success!
```

---

## 🎓 Next Steps

After completing your first checkpoint:

1. **Check Quality Score** - View your HUD for Valuation Score
2. **Read AI Feedback** - Learn how to improve
3. **Continue Journey** - Move to next checkpoint
4. **Aim for Gold** - Complete all 3 tasks
5. **Track Progress** - Watch XP and level increase

---

## 📚 Related Documentation

- **Weekly Implementation Plan**: `docs/weekly-implementation-plan.md`
- **Tool Integration**: `WEEK_4_DELIVERY.md`
- **Contribution Validation**: `CONTRIBUTION_VALIDATION_IMPLEMENTATION.md`
- **4-Week Summary**: `4_WEEK_IMPLEMENTATION_COMPLETE.md`

---

**Happy Venturing! 🚀**

*Created: January 2025*  
*Version: 1.0.0*  
*Platform: Interactive Ideas*