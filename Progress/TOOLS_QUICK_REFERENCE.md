# 🚀 TOOLS QUICK REFERENCE CARD

**Last Updated:** 2024 | **Version:** 1.0 | **Status:** Production Ready

---

## 📦 IMPORTS

```typescript
import { CalendarTool } from "@/components/tools/calendar-tool"
import { KanbanTool } from "@/components/tools/kanban-tool"
import { MapTool } from "@/components/tools/map-tool"
import { JournalTool } from "@/components/tools/journal-tool"
import { SelfReportTool } from "@/components/tools/self-report-tool"
```

---

## 🗓️ CALENDAR TOOL

### Usage
```typescript
<CalendarTool
  prompt="Plan your project timeline"
  onSubmit={(content) => console.log(content)}
  isSubmitting={false}
/>
```

### Output Structure
```typescript
{
  events: CalendarEvent[],  // Array of events/milestones
  view: string,              // "week" | "month"
  timestamp: number
}
```

### Key Features
- ✅ Week/Month view toggle
- ✅ Events (blue) and Milestones (amber)
- ✅ Date + time picker
- ✅ Min: 1 event OR milestone

---

## 📊 KANBAN TOOL

### Usage
```typescript
<KanbanTool
  prompt="Organize your tasks"
  onSubmit={(content) => console.log(content)}
  isSubmitting={false}
/>
```

### Output Structure
```typescript
{
  cards: KanbanCard[],      // Array of cards
  columns: string[],         // ["To Do", "In Progress", "Done"]
  timestamp: number
}
```

### Key Features
- ✅ Full drag & drop (using @dnd-kit)
- ✅ 3 columns: To Do, In Progress, Done
- ✅ Visual feedback during drag
- ✅ Min: 1 card

---

## 🎨 MAP/CANVAS TOOL

### Usage
```typescript
<MapTool
  prompt="Create a visual map"
  onSubmit={(content) => console.log(content)}
  isSubmitting={false}
/>
```

### Output Structure
```typescript
{
  elements: CanvasElement[]  // Array of all elements
}

type CanvasElement = PostIt | Shape | Arrow | ImageElement
```

### Key Features
- ✅ Post-it notes (draggable)
- ✅ Shapes: Rectangle, Circle, Triangle, Line
- ✅ Arrows with arrowheads
- ✅ Image upload & resize
- ✅ 12 color options
- ✅ Min: 1 element

---

## 📖 JOURNAL TOOL

### Usage
```typescript
<JournalTool
  prompt="Document your reflections"
  onSubmit={(content) => console.log(content)}
  isSubmitting={false}
/>
```

### Output Structure
```typescript
{
  entries: JournalEntry[],   // Array of entries
  timestamp: number
}

interface JournalEntry {
  id: string
  title: string
  entry: string
  wordCount: number
  timestamp: number
  sharedWithTeam: boolean    // ⭐ NEW
}
```

### Key Features
- ✅ Multiple entries support
- ✅ Per-entry share toggle
- ✅ Default: Private (OFF)
- ✅ Visual indicators: Lock (private) / Users (shared)
- ✅ Min: 1 entry

---

## 📝 SELF-REPORT TOOL

### Usage
```typescript
const fields = [
  { key: "name", label: "Full Name", type: "text" },
  { key: "progress", label: "Progress Update", type: "textarea" }
]

<SelfReportTool
  prompt="Submit your weekly report"
  fields={fields}
  onSubmit={(content) => console.log(content)}
  isSubmitting={false}
/>
```

### Output Structure
```typescript
{
  values: Record<string, string | number>,
  confirmed: boolean,        // ⭐ Always true when submitted
  timestamp: number
}
```

### Key Features
- ✅ Dynamic field configuration
- ✅ Confirmation checkbox required
- ✅ Checkbox disabled until fields complete
- ✅ Visual validation alerts
- ✅ Progress tracking

---

## 🔄 COMMON PROPS

All tools share these props:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `prompt` | `string` | ✅ | User instruction text |
| `onSubmit` | `function` | ✅ | Callback with tool data |
| `isSubmitting` | `boolean` | ❌ | Show loading state |
| `initialContent` | `object` | ❌ | Pre-populate tool |

---

## 📋 VALIDATION RULES

| Tool | Minimum Requirement |
|------|---------------------|
| Calendar | 1 event OR milestone |
| Kanban | 1 card (any column) |
| Map/Canvas | 1 element (any type) |
| Journal | 1 entry |
| Self-Report | All fields + confirmed |

**All tools auto-disable submit button when invalid!**

---

## 💾 BASIC INTEGRATION PATTERN

```typescript
"use client"

import { useState } from "react"
import { CalendarTool } from "@/components/tools/calendar-tool"

export default function TaskPage() {
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (content: any) => {
    setSubmitting(true)
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "calendar",
          content: content,
          taskId: "task-123"
        })
      })
      alert("Submitted!")
    } catch (error) {
      alert("Failed!")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CalendarTool
      prompt="Complete your task"
      onSubmit={handleSubmit}
      isSubmitting={submitting}
    />
  )
}
```

---

## 🎨 VISUAL INDICATORS

### Calendar Tool
- 🔵 **Blue** = Events (with Clock icon)
- 🟡 **Amber** = Milestones (with Milestone icon)

### Journal Tool
- 🔒 **Lock Icon** = Private entry
- 👥 **Users Icon** = Shared entry
- 🔵 **Blue Border** = Shared entry

### Self-Report Tool
- 🟡 **Amber Alert** = Fields incomplete
- 🔵 **Blue Alert** = Ready to confirm
- ✅ **Green Text** = All fields complete

---

## 🔧 DEPENDENCIES USED

| Tool | Dependencies |
|------|--------------|
| Calendar | `date-fns`, `shadcn/ui` |
| Kanban | `@dnd-kit/core`, `@dnd-kit/sortable` |
| Map/Canvas | `shadcn/ui`, SVG, Canvas API |
| Journal | `shadcn/ui` |
| Self-Report | `shadcn/ui` |

**All dependencies already installed in `package.json`**

---

## ⚡ QUICK TIPS

### Calendar Tool
- Week view shows 7 days with colored dots
- Month view shows full calendar
- Time is optional for events
- Milestones don't have time

### Kanban Tool
- Drag cards by grip icon (⋮⋮)
- Drop in any column
- Cards stay in order
- 8px drag threshold prevents accidental drags

### Map/Canvas Tool
- Click tool buttons to add elements
- Arrow: click-drag to draw
- Resize: drag bottom-right corner
- Delete: hover to see X button
- Images converted to base64

### Journal Tool
- Share toggle defaults OFF (private)
- Can toggle after creation
- Word count updates live
- Title optional ("Untitled Entry")

### Self-Report Tool
- Fields array determines form
- `required: false` makes field optional
- Checkbox disabled until valid
- Can't submit without confirmation

---

## 🐛 COMMON ISSUES

| Issue | Solution |
|-------|----------|
| Tool not rendering | Add `"use client"` at top of file |
| Drag not working | Check @dnd-kit installed |
| Date serialization | Use `.toISOString()` before saving |
| Images too large | Compress before upload |
| Validation not working | Check console for errors |

---

## 📊 DATA SIZES (Typical)

| Tool | Typical Size | Max Recommended |
|------|--------------|-----------------|
| Calendar | 1-10 KB | 5-20 items |
| Kanban | 1-5 KB | 50 cards |
| Map/Canvas | 10-100 KB | 30 elements |
| Journal | 1-10 KB | 10 entries |
| Self-Report | <1 KB | 20 fields |

---

## 🎯 PRODUCTION CHECKLIST

Before deploying:
- [ ] Test submission to backend
- [ ] Verify data serialization
- [ ] Test with empty state
- [ ] Test with max data
- [ ] Check loading states
- [ ] Verify error handling
- [ ] Test dark mode
- [ ] Test mobile view
- [ ] Check TypeScript errors
- [ ] Review console logs

---

## 📞 NEED HELP?

1. **Full Documentation:** `TOOLS_COMPLETION_SUMMARY.md`
2. **Testing Guide:** `TOOLS_TESTING_GUIDE.md`
3. **Integration Guide:** `TOOLS_INTEGRATION_GUIDE.md`
4. **Source Code:** `src/components/tools/`

---

## 🚀 ONE-LINER EXAMPLES

```typescript
// Calendar
<CalendarTool prompt="Plan Q1" onSubmit={save} isSubmitting={loading} />

// Kanban
<KanbanTool prompt="Organize tasks" onSubmit={save} isSubmitting={loading} />

// Map/Canvas
<MapTool prompt="Visualize ideas" onSubmit={save} isSubmitting={loading} />

// Journal
<JournalTool prompt="Document progress" onSubmit={save} isSubmitting={loading} />

// Self-Report
<SelfReportTool prompt="Weekly update" fields={fields} onSubmit={save} isSubmitting={loading} />
```

---

**✨ All tools production-ready and 100% PRD compliant! ✨**

**Agent 1** | Status: ✅ Complete | Version: 1.0