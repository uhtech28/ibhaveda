# 🔌 TOOLS INTEGRATION GUIDE - Developer Documentation

**Version:** 1.0
**Last Updated:** 2024
**Author:** Agent 1
**Target Audience:** Frontend Developers, Integration Engineers

---

## 📚 TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Calendar Tool](#calendar-tool)
3. [Kanban Tool](#kanban-tool)
4. [Map/Canvas Tool](#mapcanvas-tool)
5. [Journal Tool](#journal-tool)
6. [Self-Report Tool](#self-report-tool)
7. [Common Patterns](#common-patterns)
8. [Data Structures](#data-structures)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## 🚀 QUICK START

### Installation
All tools are already included in the project. No additional dependencies needed beyond what's in `package.json`.

### Basic Import Pattern
```typescript
import { CalendarTool } from "@/components/tools/calendar-tool"
import { KanbanTool } from "@/components/tools/kanban-tool"
import { MapTool } from "@/components/tools/map-tool"
import { JournalTool } from "@/components/tools/journal-tool"
import { SelfReportTool } from "@/components/tools/self-report-tool"
```

### Minimal Working Example
```typescript
"use client"

import { useState } from "react"
import { CalendarTool } from "@/components/tools/calendar-tool"

export default function MyPage() {
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (content: any) => {
    setSubmitting(true)
    try {
      // Send to backend
      await saveToDatabase(content)
      console.log("Saved:", content)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CalendarTool
      prompt="Plan your project timeline"
      onSubmit={handleSubmit}
      isSubmitting={submitting}
    />
  )
}
```

---

## 🗓️ CALENDAR TOOL

### Import
```typescript
import { CalendarTool } from "@/components/tools/calendar-tool"
```

### Props Interface
```typescript
interface CalendarToolProps {
  prompt: string                    // User instruction text
  onSubmit: (content: {
    events: CalendarEvent[]
    view: string
    timestamp: number
  }) => void
  initialContent?: {                // Optional: Pre-populate
    events: CalendarEvent[]
    view: string
    timestamp: number
  }
  isSubmitting?: boolean            // Optional: Show loading state
}

interface CalendarEvent {
  id: string
  type: "event" | "milestone"
  date: Date
  time?: string                     // HH:MM format, optional
  title: string
  description: string
}
```

### Basic Usage
```typescript
<CalendarTool
  prompt="Create a project timeline with key events and milestones"
  onSubmit={(content) => {
    console.log("Events:", content.events)
    console.log("View used:", content.view)
  }}
  isSubmitting={false}
/>
```

### With Pre-populated Data
```typescript
const initialData = {
  events: [
    {
      id: "evt-1",
      type: "event" as const,
      date: new Date("2024-12-25"),
      time: "10:00",
      title: "Team Meeting",
      description: "Quarterly review"
    },
    {
      id: "mls-1",
      type: "milestone" as const,
      date: new Date("2024-12-31"),
      title: "Project Launch",
      description: "Go-live date"
    }
  ],
  view: "month",
  timestamp: Date.now()
}

<CalendarTool
  prompt="Review and update your timeline"
  onSubmit={handleSubmit}
  initialContent={initialData}
  isSubmitting={isLoading}
/>
```

### Handling Submission
```typescript
const handleSubmit = async (content: {
  events: CalendarEvent[]
  view: string
  timestamp: number
}) => {
  setIsLoading(true)
  
  try {
    // Separate events and milestones
    const events = content.events.filter(e => e.type === "event")
    const milestones = content.events.filter(e => e.type === "milestone")
    
    // Save to backend
    const response = await fetch("/api/calendar/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: events.map(e => ({
          ...e,
          date: e.date.toISOString() // Serialize dates
        })),
        milestones: milestones.map(m => ({
          ...m,
          date: m.date.toISOString()
        })),
        timestamp: content.timestamp
      })
    })
    
    const result = await response.json()
    console.log("Saved:", result)
    
  } catch (error) {
    console.error("Save failed:", error)
    alert("Failed to save calendar")
  } finally {
    setIsLoading(false)
  }
}
```

### Validation Rules
- Minimum 1 event OR 1 milestone required
- Title is required for each item
- Date must be selected
- Submit button auto-disabled when invalid

---

## 📊 KANBAN TOOL

### Import
```typescript
import { KanbanTool } from "@/components/tools/kanban-tool"
```

### Props Interface
```typescript
interface KanbanToolProps {
  prompt: string
  onSubmit: (content: {
    cards: KanbanCard[]
    columns: string[]
    timestamp: number
  }) => void
  initialContent?: {
    cards: KanbanCard[]
    columns: string[]
    timestamp: number
  }
  isSubmitting?: boolean
}

interface KanbanCard {
  id: string
  title: string
  column: "todo" | "inprogress" | "done"
}
```

### Basic Usage
```typescript
<KanbanTool
  prompt="Organize your tasks into columns"
  onSubmit={(content) => {
    console.log("Cards:", content.cards)
    console.log("Columns:", content.columns)
  }}
  isSubmitting={false}
/>
```

### Handling Drag & Drop Results
```typescript
const handleSubmit = (content: {
  cards: KanbanCard[]
  columns: string[]
  timestamp: number
}) => {
  // Group cards by column
  const todoCards = content.cards.filter(c => c.column === "todo")
  const inProgressCards = content.cards.filter(c => c.column === "inprogress")
  const doneCards = content.cards.filter(c => c.column === "done")
  
  console.log("To Do:", todoCards.length)
  console.log("In Progress:", inProgressCards.length)
  console.log("Done:", doneCards.length)
  
  // Save to backend
  saveKanbanBoard({
    board_id: "project-123",
    cards: content.cards,
    last_updated: content.timestamp
  })
}
```

### Restoring Board State
```typescript
const [savedBoard, setSavedBoard] = useState(null)

useEffect(() => {
  // Load from backend
  fetch("/api/kanban/load/project-123")
    .then(res => res.json())
    .then(data => setSavedBoard(data))
}, [])

return (
  <KanbanTool
    prompt="Continue organizing your tasks"
    onSubmit={handleSubmit}
    initialContent={savedBoard}
    isSubmitting={false}
  />
)
```

### Validation Rules
- Minimum 1 card required
- Cards can exist in any column
- Empty title not allowed
- Drag & drop automatically updates column

---

## 🎨 MAP/CANVAS TOOL

### Import
```typescript
import { MapTool } from "@/components/tools/map-tool"
```

### Props Interface
```typescript
interface MapToolProps {
  prompt: string
  onSubmit: (content: {
    elements: CanvasElement[]
  }) => void
  initialContent?: {
    elements: CanvasElement[]
  }
  isSubmitting?: boolean
}

type CanvasElement = PostIt | Shape | Arrow | ImageElement

interface PostIt {
  id: string
  type: "postit"
  x: number
  y: number
  text: string
  color: string
}

interface Shape {
  id: string
  type: "rectangle" | "circle" | "triangle" | "line"
  x: number
  y: number
  width: number
  height: number
  color: string
}

interface Arrow {
  id: string
  type: "arrow"
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
}

interface ImageElement {
  id: string
  type: "image"
  x: number
  y: number
  width: number
  height: number
  src: string // Base64 or URL
}
```

### Basic Usage
```typescript
<MapTool
  prompt="Create a visual map of your concept"
  onSubmit={(content) => {
    console.log("Elements:", content.elements)
    console.log("Element types:", content.elements.map(e => e.type))
  }}
  isSubmitting={false}
/>
```

### Processing Different Element Types
```typescript
const handleSubmit = (content: { elements: CanvasElement[] }) => {
  const postits = content.elements.filter(e => e.type === "postit")
  const shapes = content.elements.filter(e => 
    ["rectangle", "circle", "triangle", "line"].includes(e.type)
  )
  const arrows = content.elements.filter(e => e.type === "arrow")
  const images = content.elements.filter(e => e.type === "image")
  
  console.log(`Canvas summary:
    - ${postits.length} post-its
    - ${shapes.length} shapes
    - ${arrows.length} arrows
    - ${images.length} images
  `)
  
  // Save to backend
  saveCanvas({
    elements: content.elements.map(element => {
      // Serialize images if needed
      if (element.type === "image" && element.src.startsWith("data:")) {
        return {
          ...element,
          src: uploadImageAndGetUrl(element.src) // Convert base64 to URL
        }
      }
      return element
    })
  })
}
```

### Image Handling
```typescript
const uploadImageAndGetUrl = async (base64: string): Promise<string> => {
  // Convert base64 to blob
  const response = await fetch(base64)
  const blob = await response.blob()
  
  // Upload to storage service
  const formData = new FormData()
  formData.append("image", blob)
  
  const uploadResponse = await fetch("/api/upload", {
    method: "POST",
    body: formData
  })
  
  const result = await uploadResponse.json()
  return result.url // Return permanent URL
}
```

### Validation Rules
- Minimum 1 element required (any type)
- Post-it text can be empty
- Coordinates must be positive
- Images stored as base64 or URLs

---

## 📖 JOURNAL TOOL

### Import
```typescript
import { JournalTool } from "@/components/tools/journal-tool"
```

### Props Interface
```typescript
interface JournalToolProps {
  prompt: string
  onSubmit: (content: {
    entries: JournalEntry[]
    timestamp: number
  }) => void
  initialContent?: {
    entries: JournalEntry[]
    timestamp: number
  }
  isSubmitting?: boolean
}

interface JournalEntry {
  id: string
  title: string
  entry: string
  wordCount: number
  timestamp: number
  sharedWithTeam: boolean // NEW: Share toggle
}
```

### Basic Usage
```typescript
<JournalTool
  prompt="Document your progress and reflections"
  onSubmit={(content) => {
    console.log("Entries:", content.entries)
    
    // Check share status
    const sharedEntries = content.entries.filter(e => e.sharedWithTeam)
    const privateEntries = content.entries.filter(e => !e.sharedWithTeam)
    
    console.log(`${sharedEntries.length} shared, ${privateEntries.length} private`)
  }}
  isSubmitting={false}
/>
```

### Handling Privacy Settings
```typescript
const handleSubmit = async (content: {
  entries: JournalEntry[]
  timestamp: number
}) => {
  for (const entry of content.entries) {
    if (entry.sharedWithTeam) {
      // Save to team-visible storage
      await fetch("/api/journal/shared", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_id: entry.id,
          title: entry.title,
          content: entry.entry,
          shared: true,
          timestamp: entry.timestamp
        })
      })
    } else {
      // Save to private storage
      await fetch("/api/journal/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_id: entry.id,
          title: entry.title,
          content: entry.entry,
          shared: false,
          timestamp: entry.timestamp
        })
      })
    }
  }
}
```

### Permission-Based Loading
```typescript
const loadJournalEntries = async (userId: string, canViewTeam: boolean) => {
  const response = await fetch(`/api/journal/${userId}`)
  const data = await response.json()
  
  // Filter based on permissions
  const visibleEntries = data.entries.filter((entry: JournalEntry) => {
    if (entry.sharedWithTeam && canViewTeam) return true
    if (!entry.sharedWithTeam && entry.userId === currentUserId) return true
    return false
  })
  
  return {
    entries: visibleEntries,
    timestamp: Date.now()
  }
}
```

### Validation Rules
- Minimum 1 entry required
- Entry content must have text
- Title optional (defaults to "Untitled Entry")
- Share toggle defaults to OFF (private)

---

## 📝 SELF-REPORT TOOL

### Import
```typescript
import { SelfReportTool } from "@/components/tools/self-report-tool"
```

### Props Interface
```typescript
interface SelfReportToolProps {
  prompt: string
  fields: FieldDef[]
  onSubmit: (content: {
    values: Record<string, string | number>
    confirmed: boolean
    timestamp: number
  }) => void
  initialContent?: {
    values: Record<string, string | number>
    confirmed: boolean
    timestamp: number
  }
  isSubmitting?: boolean
}

interface FieldDef {
  key: string
  label: string
  type: "text" | "textarea" | "number"
  required?: boolean // Optional, defaults to true
}
```

### Basic Usage
```typescript
const fields: FieldDef[] = [
  { key: "name", label: "Full Name", type: "text" },
  { key: "email", label: "Email Address", type: "text" },
  { key: "progress", label: "Progress Update", type: "textarea" },
  { key: "hours", label: "Hours Worked", type: "number" }
]

<SelfReportTool
  prompt="Submit your weekly progress report"
  fields={fields}
  onSubmit={(content) => {
    console.log("Report values:", content.values)
    console.log("Confirmed:", content.confirmed)
  }}
  isSubmitting={false}
/>
```

### Dynamic Fields
```typescript
const getFieldsForStage = (stage: string): FieldDef[] => {
  const commonFields = [
    { key: "name", label: "Name", type: "text" },
  ]
  
  if (stage === "design") {
    return [
      ...commonFields,
      { key: "wireframes", label: "Wireframes Completed", type: "number" },
      { key: "feedback", label: "Design Feedback", type: "textarea" }
    ]
  } else if (stage === "development") {
    return [
      ...commonFields,
      { key: "commits", label: "Commits Made", type: "number" },
      { key: "tests", label: "Tests Written", type: "number" },
      { key: "blockers", label: "Any Blockers?", type: "textarea", required: false }
    ]
  }
  
  return commonFields
}

<SelfReportTool
  prompt="Report your progress"
  fields={getFieldsForStage(currentStage)}
  onSubmit={handleSubmit}
  isSubmitting={false}
/>
```

### Validation & Confirmation
```typescript
const handleSubmit = (content: {
  values: Record<string, string | number>
  confirmed: boolean
  timestamp: number
}) => {
  // Confirmation is always true when this is called
  // (submit button disabled until confirmed)
  console.assert(content.confirmed === true)
  
  // Process form data
  const reportData = {
    user_id: currentUserId,
    form_data: content.values,
    confirmed_at: content.timestamp,
    stage: currentStage
  }
  
  // Save to backend
  fetch("/api/reports/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reportData)
  })
}
```

### Optional Fields
```typescript
const fields: FieldDef[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "project", label: "Project", type: "text" },
  { key: "notes", label: "Additional Notes", type: "textarea", required: false },
  { key: "rating", label: "Self Rating (1-10)", type: "number", required: false }
]

// Required fields: name, project
// Optional fields: notes, rating (won't block submission)
```

### Validation Rules
- All required fields must be filled
- Confirmation checkbox must be checked
- Submit blocked until both conditions met
- Checkbox disabled until fields complete
- Visual indicators guide user through flow

---

## 🔄 COMMON PATTERNS

### Pattern 1: Backend Integration
```typescript
const ToolWrapper = ({ toolType, taskId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialData, setInitialData] = useState(null)
  
  // Load existing data
  useEffect(() => {
    fetch(`/api/tasks/${taskId}/evidence`)
      .then(res => res.json())
      .then(data => setInitialData(data))
  }, [taskId])
  
  // Handle submission
  const handleSubmit = async (content: any) => {
    setIsSubmitting(true)
    try {
      await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_type: toolType,
          content: content,
          submitted_at: Date.now()
        })
      })
      alert("Submitted successfully!")
    } catch (error) {
      alert("Submission failed")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <CalendarTool
      prompt="Complete your task"
      onSubmit={handleSubmit}
      initialContent={initialData}
      isSubmitting={isSubmitting}
    />
  )
}
```

### Pattern 2: Multi-Tool Workflow
```typescript
const MultiStepForm = () => {
  const [currentTool, setCurrentTool] = useState("calendar")
  const [submissions, setSubmissions] = useState({})
  
  const handleToolSubmit = (toolName: string, content: any) => {
    setSubmissions(prev => ({ ...prev, [toolName]: content }))
    
    // Move to next tool
    const sequence = ["calendar", "kanban", "journal"]
    const currentIndex = sequence.indexOf(toolName)
    if (currentIndex < sequence.length - 1) {
      setCurrentTool(sequence[currentIndex + 1])
    } else {
      // All tools complete
      submitAllData(submissions)
    }
  }
  
  return (
    <>
      {currentTool === "calendar" && (
        <CalendarTool
          prompt="Step 1: Plan timeline"
          onSubmit={(content) => handleToolSubmit("calendar", content)}
        />
      )}
      {currentTool === "kanban" && (
        <KanbanTool
          prompt="Step 2: Organize tasks"
          onSubmit={(content) => handleToolSubmit("kanban", content)}
        />
      )}
      {currentTool === "journal" && (
        <JournalTool
          prompt="Step 3: Reflect on plan"
          onSubmit={(content) => handleToolSubmit("journal", content)}
        />
      )}
    </>
  )
}
```

### Pattern 3: Auto-save Draft
```typescript
const AutoSaveToolWrapper = ({ tool: Tool, taskId }) => {
  const [content, setContent] = useState(null)
  const debouncedSave = useDebouncedCallback((data) => {
    // Auto-save draft
    fetch(`/api/tasks/${taskId}/draft`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft: data })
    })
  }, 2000)
  
  // Load draft on mount
  useEffect(() => {
    fetch(`/api/tasks/${taskId}/draft`)
      .then(res => res.json())
      .then(draft => setContent(draft))
  }, [taskId])
  
  // Listen for changes (would need tool modification)
  const handleChange = (newContent: any) => {
    setContent(newContent)
    debouncedSave(newContent)
  }
  
  const handleSubmit = async (finalContent: any) => {
    // Submit final version
    await fetch(`/api/tasks/${taskId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalContent)
    })
    
    // Clear draft
    await fetch(`/api/tasks/${taskId}/draft`, { method: "DELETE" })
  }
  
  return (
    <Tool
      prompt="Continue your work"
      onSubmit={handleSubmit}
      initialContent={content}
    />
  )
}
```

---

## 📊 DATA STRUCTURES

### Storage Schema Example (PostgreSQL)
```sql
-- Calendar Tool
CREATE TABLE calendar_submissions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  events JSONB NOT NULL, -- Array of CalendarEvent
  view VARCHAR(10),
  submitted_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Kanban Tool
CREATE TABLE kanban_submissions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  cards JSONB NOT NULL, -- Array of KanbanCard
  columns JSONB NOT NULL,
  submitted_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Map/Canvas Tool
CREATE TABLE canvas_submissions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  elements JSONB NOT NULL, -- Array of CanvasElement
  submitted_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Journal Tool
CREATE TABLE journal_submissions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  entries JSONB NOT NULL, -- Array of JournalEntry
  submitted_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Self-Report Tool
CREATE TABLE report_submissions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  values JSONB NOT NULL, -- Key-value pairs
  confirmed BOOLEAN NOT NULL,
  confirmed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### MongoDB Schema Example
```typescript
// Calendar Tool
const CalendarSubmissionSchema = {
  userId: ObjectId,
  taskId: ObjectId,
  events: [{
    id: String,
    type: String, // "event" | "milestone"
    date: Date,
    time: String,
    title: String,
    description: String
  }],
  view: String,
  submittedAt: Number,
  createdAt: Date
}

// Kanban Tool
const KanbanSubmissionSchema = {
  userId: ObjectId,
  taskId: ObjectId,
  cards: [{
    id: String,
    title: String,
    column: String // "todo" | "inprogress" | "done"
  }],
  columns: [String],
  submittedAt: Number,
  createdAt: Date
}
```

---

## ⚠️ ERROR HANDLING

### Network Errors
```typescript
const handleSubmit = async (content: any) => {
  setIsSubmitting(true)
  setError(null)
  
  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    toast.success("Submitted successfully!")
    return result
    
  } catch (error) {
    console.error("Submission error:", error)
    setError(error.message)
    toast.error("Failed to submit. Please try again.")
    
  } finally {
    setIsSubmitting(false)
  }
}
```

### Validation Errors
```typescript
// Tools handle their own validation
// Submit callback only fires when valid
// But you can add extra validation:

const handleSubmit = (content: any) => {
  // Extra business logic validation
  if (content.events.length > 100) {
    alert("Maximum 100 events allowed")
    return
  }
  
  if (hasProfanity(content.text)) {
    alert("Please remove inappropriate content")
    return
  }
  
  // Proceed with submission
  saveToBackend(content)
}
```

---

## ✅ BEST PRACTICES

### 1. Always Handle Loading States
```typescript
const [isSubmitting, setIsSubmitting] = useState(false)

<CalendarTool
  prompt="Plan your timeline"
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting} // IMPORTANT: Pass this
/>
```

### 2. Provide Clear Prompts
```typescript
// ❌ Bad
<CalendarTool prompt="Calendar" />

// ✅ Good
<CalendarTool 
  prompt="Create a project timeline with key events and milestones for Q1 2024"
/>
```

### 3. Serialize Dates Properly
```typescript
// When saving to backend
const serializedEvents = events.map(event => ({
  ...event,
  date: event.date.toISOString() // Convert Date to string
}))

// When loading from backend
const deserializedEvents = savedEvents.map(event => ({
  ...event,
  date: new Date(event.date) // Convert string back to Date
}))
```

### 4. Handle Component Unmounting
```typescript
const handleSubmit = async (content: any) => {
  let cancelled = false
  
  setIsSubmitting(true)
  
  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      body: JSON.stringify(content)
    })
    
    if (!cancelled) {
      const result = await response.json()
      // Handle success
    }
  } finally {
    if (!cancelled) {
      setIsSubmitting(false)
    }
  }
  
  return () => { cancelled = true }
}
```

### 5. Provide Feedback
```typescript
import { toast } from "@/components/ui/use-toast"

const handleSubmit = async (content: any) => {
  try {
    await saveToBackend(content)
    toast({
      title: "Success!",
      description: "Your work has been saved.",
      variant: "default"
    })
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to save. Please try again.",
      variant: "destructive"
    })
  }
}
```

---

## 🔧 TROUBLESHOOTING

### Issue: Tool not rendering
**Solution:**
```typescript
// Check imports
import { CalendarTool } from "@/components/tools/calendar-tool"

// Ensure it's a client component
"use client"

// Check for errors in console
// Verify all required props provided
```

### Issue: Drag & drop not working (Kanban)
**Solution:**
```typescript
// Verify @dnd-kit is installed
npm install @dnd-kit/core @dnd-kit/sortable

// Check browser compatibility (modern browsers only)
// Ensure no CSS overflow issues on parent
```

### Issue: Images not uploading (Map Tool)
**Solution:**
```typescript
// Check file size (very large images may fail)
// Verify image format is supported (PNG, JPG, GIF, etc.)
// Check browser console for errors
// Ensure FileReader API is available
```

### Issue: Validation not working
**Solution:**
```typescript
// Tools handle their own validation
// Submit button auto-disables when invalid
// Check console for warnings
// Ensure required fields have content
```

### Issue: Initial content not loading
**Solution:**
```typescript
// Verify data structure matches interface
// Check Date objects are properly deserialized
// Use useEffect to load async data:

const [initialData, setInitialData] = useState(null)

useEffect(() => {
  loadData().then(data => setInitialData(data))
}, [])

<CalendarTool initialContent={initialData} />
```

---

## 📞 SUPPORT & RESOURCES

### Code Examples Repository
All integration examples available at:
`/docs/examples/tools-integration/`

### Type Definitions
Full TypeScript interfaces available in each tool file:
- `src/components/tools/calendar-tool.tsx`
- `src/components/tools/kanban-tool.tsx`
- `src/components/tools/map-tool.tsx`
- `src/components/tools/journal-tool.tsx`
- `src/components/tools/self-report-tool.tsx`

### Testing
See `TOOLS_TESTING_GUIDE.md` for complete testing procedures.

### Questions?
- Check the inline code comments
- Review existing tool implementations
- Test in isolation before integrating
- Use browser DevTools for debugging

---

## 🎓 ADVANCED TOPICS

### Custom Tool Wrapper
```typescript
import { ComponentType } from "react"

interface ToolWrapperProps<T> {
  Tool: ComponentType<any>
  taskId: string
  onComplete?: () => void
}

function ToolWrapper<T>({ Tool, taskId, onComplete }: ToolWrapperProps