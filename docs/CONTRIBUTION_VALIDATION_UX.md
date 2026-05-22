# Contribution Validation - User Experience Flow

This document describes the visual user experience when submitting evidence for venture checkpoint tasks with validation requirements.

## Overview

The contribution validation system provides real-time feedback to users as they create their submissions, ensuring they meet minimum requirements before allowing completion.

## Visual States

### State 1: Task Not Started

```
┌─────────────────────────────────────────────────────┐
│ Task 1 — Easy                    20% points         │
│                                                     │
│ 📝 Write Your Response                             │
│                                                     │
│ Tool: write                                        │
│                                                     │
│ [Start This Task]                                  │
└─────────────────────────────────────────────────────┘
```

**Visual Elements:**
- Task card with light green background
- Badge showing "20% points"
- Gray "Pending" badge with X icon
- "Start This Task" button in default state

---

### State 2: Task Active - No Content (0 words)

```
┌─────────────────────────────────────────────────────┐
│ Write Your Response                                 │
│ Describe your market research findings             │
├─────────────────────────────────────────────────────┤
│ Your response                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Write your response here...                     │ │
│ │ [cursor blinking]                               │ │
│ │                                                 │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 0 / 50 words                                       │
│                                                     │
│ [Submit Response] (DISABLED - grayed out)          │
└─────────────────────────────────────────────────────┘
```

**Visual Elements:**
- Empty textarea with placeholder text
- Word counter: "0 / 50 words" in gray
- Submit button disabled (grayed out, not clickable)
- No checkmark or warning messages yet

---

### State 3: Task Active - Insufficient Content (25 words)

```
┌─────────────────────────────────────────────────────┐
│ Write Your Response                                 │
│ Describe your market research findings             │
├─────────────────────────────────────────────────────┤
│ Your response                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ I conducted market research by surveying        │ │
│ │ potential customers and analyzing competitors.  │ │
│ │ The results show strong demand for our          │ │
│ │ solution in the target market.                  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 25 / 50 words          🟡 25 more words needed     │
│                                                     │
│ [Submit Response] (DISABLED - grayed out)          │
└─────────────────────────────────────────────────────┘
```

**Visual Elements:**
- Word counter: "25 / 50 words" in gray/default color
- Amber/yellow indicator: "25 more words needed"
- Submit button still disabled
- User can see real-time progress

---

### State 4: Task Active - Requirement Met (50+ words)

```
┌─────────────────────────────────────────────────────┐
│ Write Your Response                                 │
│ Describe your market research findings             │
├─────────────────────────────────────────────────────┤
│ Your response                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ I conducted comprehensive market research by    │ │
│ │ surveying potential customers and analyzing     │ │
│ │ competitors. The results show strong demand     │ │
│ │ for our solution in the target market. Key     │ │
│ │ findings include high willingness to pay and   │ │
│ │ clear pain points that our product addresses.  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 52 / 50 words          ✅ ✓ Requirement met        │
│                                                     │
│ [✓ Submit Response] (ENABLED - blue/primary)       │
└─────────────────────────────────────────────────────┘
```

**Visual Elements:**
- Word counter: "52 / 50 words" in **green bold**
- Green checkmark: "✓ Requirement met" in **green bold**
- Submit button **ENABLED** - blue/primary color with checkmark icon
- Clear visual indication that submission is now allowed

---

### State 5: Submission Error (Backend Validation Failed)

```
┌─────────────────────────────────────────────────────┐
│ Write Your Response                                 │
│ Describe your market research findings             │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ⚠️ Contribution too short. Please write at     │ │
│ │ least 50 words. (Current: 30 words)            │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Your response                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ I did some research and found...               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 30 / 50 words          🟡 20 more words needed     │
│                                                     │
│ [Submit Response] (DISABLED)                       │
└─────────────────────────────────────────────────────┘
```

**Visual Elements:**
- **Red error box** at top with light red background
- Border in destructive/red color
- Warning icon ⚠️ with error message
- Word counter still shows current status
- Submit button disabled
- User can immediately see what went wrong

---

### State 6: Task Completed

```
┌─────────────────────────────────────────────────────┐
│ Task 1 — Easy                    20% points         │
│                               ✅ Done               │
│                                                     │
│ 📝 Write Your Response                             │
│                                                     │
│ Tool: write                                        │
│                                                     │
│ Evidence submitted:                                │
│ ┌─────────────────────────────────────────────────┐ │
│ │ I conducted comprehensive market research...    │ │
│ │ (full text shown in smaller font)              │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Visual Elements:**
- Green "Done" badge with checkmark
- Evidence displayed in read-only box
- No edit or submit buttons
- Task card indicates completion

---

## Upload Tool Visual States

### Upload Tool - No File Selected

```
┌─────────────────────────────────────────────────────┐
│ 📤 Upload Evidence                                 │
│ Upload your market research report                 │
├─────────────────────────────────────────────────────┤
│ Choose a file                                       │
│ [Browse...] (no file chosen)                       │
│                                                     │
│ Maximum file size: 50MB                            │
│ Supported: PDF, DOC, DOCX, PNG, JPG, MP4          │
│                                                     │
│ [✓ Submit File] (DISABLED - grayed out)            │
└─────────────────────────────────────────────────────┘
```

### Upload Tool - File Selected

```
┌─────────────────────────────────────────────────────┐
│ 📤 Upload Evidence                                 │
│ Upload your market research report                 │
├─────────────────────────────────────────────────────┤
│ Choose a file                                       │
│ [Browse...] [X]                                    │
│                                                     │
│ 📄 market-research.pdf (2.3 MB)                    │
│                                                     │
│ Maximum file size: 50MB                            │
│ Supported: PDF, DOC, DOCX, PNG, JPG, MP4          │
│                                                     │
│ [✓ Submit File] (ENABLED - blue/primary)           │
└─────────────────────────────────────────────────────┘
```

---

## Complete User Journey

### Journey 1: Successful Text Submission

```
START
  │
  ├─► User clicks "Start This Task"
  │
  ├─► Task card expands
  │   └─► Shows write tool interface
  │   └─► Word counter: "0 / 50 words"
  │   └─► Submit button DISABLED
  │
  ├─► User types first 25 words
  │   └─► Counter updates: "25 / 50 words"
  │   └─► Shows: "25 more words needed" (amber)
  │   └─► Submit still DISABLED
  │
  ├─► User types to 50 words
  │   └─► Counter turns GREEN: "50 / 50 words"
  │   └─► Shows: "✓ Requirement met" (green)
  │   └─► Submit button ENABLED (blue)
  │
  ├─► User clicks "Submit Response"
  │   └─► Button shows loading: "Submitting..."
  │   └─► Backend validates (✓ passes)
  │
  ├─► Success!
  │   └─► Task card collapses
  │   └─► Shows "Done" badge
  │   └─► Evidence displayed
  │
END (Task Complete)
```

### Journey 2: Error and Recovery

```
START
  │
  ├─► User somehow submits with <50 words
  │   └─► (e.g., JavaScript disabled)
  │
  ├─► Backend validation FAILS
  │   └─► Returns error message
  │
  ├─► Error displayed in RED BOX
  │   └─► "⚠️ Contribution too short..."
  │   └─► Shows current word count
  │
  ├─► User adds more words
  │   └─► Error message remains visible
  │   └─► Counter updates in real-time
  │
  ├─► User reaches 50+ words
  │   └─► Counter turns GREEN
  │   └─► Submit button enabled
  │
  ├─► User clicks "Submit Response"
  │   └─► Error message clears
  │   └─► Backend validates (✓ passes)
  │
  ├─► Success!
  │   └─► Task marked complete
  │
END (Task Complete)
```

---

## Color Coding System

### Status Colors

| State | Color | Usage |
|-------|-------|-------|
| **Not Met** | Gray (#6B7280) | Default state, requirement not met |
| **In Progress** | Amber (#F59E0B) | Partial progress, needs more |
| **Met** | Green (#10B981) | Requirement satisfied, ready to submit |
| **Error** | Red (#EF4444) | Validation failed, needs correction |
| **Complete** | Blue (#3B82F6) | Task successfully completed |

### UI Element Colors

```
Word Counter (Not Met):     "25 / 50 words" in gray
Word Counter (Met):         "52 / 50 words" in GREEN BOLD

Progress Indicator:         "X more words needed" in amber
Success Indicator:          "✓ Requirement met" in GREEN BOLD

Submit Button (Disabled):   Gray background, white text, not clickable
Submit Button (Enabled):    Blue background, white text, with checkmark

Error Box:                  Light red background (#FEE2E2)
Error Border:               Red border (#DC2626)
Error Text:                 Dark red text (#991B1B)
```

---

## Accessibility Features

### Screen Reader Announcements

```
When word count updates:
"Word count: 25 of 50 words. 25 more words needed."

When requirement met:
"Requirement met. You have 52 words. You may now submit."

When validation fails:
"Error: Contribution too short. Please write at least 50 words. Current: 30 words."

When submission succeeds:
"Success! Evidence submitted. Task marked complete."
```

### Keyboard Navigation

- **Tab** - Move between textarea and buttons
- **Enter** - Submit (when button enabled)
- **Esc** - Close/cancel task
- Focus indicators visible on all interactive elements

### Visual Indicators

- ✓ Checkmark for success
- ⚠️ Warning triangle for errors
- 🟡 Amber circle for in-progress
- 🔴 Red circle for errors
- 🟢 Green circle for success

---

## Mobile Responsive Behavior

### Mobile View (< 768px)

```
┌─────────────────────┐
│ Write Your Response │
│                     │
│ ┌─────────────────┐ │
│ │ Your text here │ │
│ │                │ │
│ │                │ │
│ └─────────────────┘ │
│                     │
│ 52 / 50 words      │
│ ✓ Requirement met  │
│                     │
│ [Submit Response]  │
│     (full width)   │
└─────────────────────┘
```

**Mobile Optimizations:**
- Full-width submit button
- Larger touch targets (min 44px)
- Stacked layout for indicators
- Readable font sizes (min 16px)

---

## Animation & Transitions

### Word Counter Updates
```
Duration: 150ms
Easing: ease-out
Property: color, font-weight

When crossing 50-word threshold:
- Color fades from gray → green
- Font weight transitions to bold
- Checkmark icon fades in
```

### Submit Button Enable
```
Duration: 200ms
Easing: ease-in-out
Properties: background-color, cursor

Disabled → Enabled:
- Background: gray → blue
- Cursor: not-allowed → pointer
- Slight scale effect (1.0 → 1.02 → 1.0)
```

### Error Message Appearance
```
Duration: 300ms
Easing: ease-out
Animation: slide down + fade in

Error appears:
- Slides down from top
- Opacity 0 → 1
- Height auto-expands
```

---

## Best Practices for Users

### ✅ Do's

1. **Start typing** - Counter updates in real-time
2. **Watch the counter** - Know exactly how many more words needed
3. **Wait for green checkmark** - Indicates ready to submit
4. **Read error messages** - They tell you exactly what's wrong

### ❌ Don'ts

1. **Don't bypass client validation** - Server will catch it anyway
2. **Don't submit before 50 words** - Button disabled for a reason
3. **Don't ignore error messages** - They guide you to success

---

## Edge Case Handling

### Very Long Text (500+ words)
- Counter shows actual count: "523 / 50 words"
- Green checkmark remains
- Submit button stays enabled
- No maximum word limit enforced

### Special Characters
```
Input: "Hello, world! This is a test... Can you count?"
Word count: 8 words
- Punctuation ignored
- Contractions count as 1 word
- Numbers count as words
```

### Copy/Paste
- Word count updates immediately
- Same validation rules apply
- Real-time feedback provided

---

## Summary

The contribution validation UX provides:

✅ **Clear Requirements** - Users know exactly what's needed  
✅ **Real-Time Feedback** - Immediate updates as they type  
✅ **Visual Indicators** - Color-coded status at a glance  
✅ **Error Prevention** - Disabled buttons prevent invalid submissions  
✅ **Error Recovery** - Clear messages guide users to fix issues  
✅ **Success Confirmation** - Green indicators show when ready  

**Result**: Users successfully complete tasks with confidence and minimal frustration.