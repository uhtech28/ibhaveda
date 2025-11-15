# UI Components Documentation

## 🎨 Overview

The Interactive Ideas Platform uses a comprehensive component library built with Radix UI primitives, Tailwind CSS, and custom shadcn/ui components. This documentation covers all UI components, their usage, and implementation details.

## 📋 Component Categories

### Layout Components
- [Header](#header-component) - Main navigation and branding
- [Footer](#footer-component) - Site footer with links
- [Sidebar](#sidebar-component) - Navigation sidebar
- [Hero Section](#hero-section-component) - Landing page hero

### Form Components
- [Idea Form](#idea-form-component) - Idea creation and editing
- [User Profile Form](#user-profile-form-component) - Profile management
- [Search Bar](#search-bar-component) - Global search interface
- [Multi-Select Components](#multi-select-components) - Skills and industry selection

### Collaboration Components
- [Kanban Board](#kanban-board-component) - Task management interface
- [Contribution Request Card](#contribution-request-card-component) - Request display and management
- [Invitation Section](#invitation-section-component) - Collaboration invitations
- [Chat Components](#chat-components) - Real-time messaging

### Data Display Components
- [Idea Card](#idea-card-component) - Idea preview in feeds
- [User Profile Components](#user-profile-components) - User information display
- [Notification List](#notification-list-component) - Notification management
- [Calendar Component](#calendar-component) - Date/time selection

### UI Primitive Components
- [Button](#button-component) - Action buttons
- [Input](#input-component) - Text input fields
- [Card](#card-component) - Content containers
- [Dialog](#dialog-component) - Modal overlays

## 🧩 Layout Components

### Header Component

**Purpose**: Main navigation header with branding, navigation links, and user controls.

**File**: `src/components/header.tsx`

**Features**:
- Responsive navigation menu
- User authentication status
- Theme toggle
- Notification bell
- Mobile hamburger menu

**Props**:
```typescript
interface HeaderProps {
  user?: User
  onThemeToggle?: () => void
}
```

**Usage**:
```tsx
import { Header } from '@/components/header'

export default function Layout({ children }) {
  return (
    <div>
      <Header />
      <main>{children}</main>
    </div>
  )
}
```

### Footer Component

**Purpose**: Site footer with platform information and links.

**File**: `src/components/footer.tsx`

**Sections**:
- Platform description
- Navigation links
- Social media links
- Copyright information

## 📝 Form Components

### Idea Form Component

**Purpose**: Comprehensive form for creating and editing ideas.

**File**: `src/app/create-idea/page.tsx`

**Form Fields**:
- Title (text input, required)
- Description (rich text editor, required)
- Category (select dropdown)
- Industries (multi-select)
- Visibility (public/private toggle)
- File attachments (drag & drop)

**Validation**:
```typescript
const ideaSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(50),
  category: z.string().min(1),
  industries: z.array(z.string()).optional(),
  visibility: z.enum(['public', 'private']),
  attachments: z.array(fileSchema).optional()
})
```

**Implementation**:
```tsx
'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

export default function CreateIdeaForm() {
  const [formData, setFormData] = useState(initialData)
  const createIdea = useMutation(api.ideas.create)

  const handleSubmit = async (e) => {
    e.preventDefault()
    await createIdea(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### Multi-Select Components

**Purpose**: Advanced multi-selection for skills and industries.

**Files**:
- `src/components/SkillsMultiSelect.tsx`
- `src/components/IndustriesMultiSelect.tsx`

**Features**:
- Searchable dropdown
- Custom option creation
- Validation and error handling
- Keyboard navigation

**Props**:
```typescript
interface MultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  maxItems?: number
}
```

## 📋 Collaboration Components

### Kanban Board Component

**Purpose**: Visual task management with drag-and-drop functionality.

**File**: `src/components/ui/kibo-ui/kanban/index.tsx`

**Features**:
- Drag-and-drop between columns
- Task creation and editing
- Column management
- Real-time updates

**Board Structure**:
```typescript
interface KanbanBoard {
  columns: KanbanColumn[]
  tasks: Task[]
}

interface KanbanColumn {
  id: string
  title: string
  tasks: Task[]
  order: number
}

interface Task {
  id: string
  title: string
  description?: string
  assignedTo?: string
  status: TaskStatus
  dueDate?: number
}
```

### Contribution Request Card

**Purpose**: Display and manage contribution requests.

**File**: `src/components/requests/request-status-card.tsx`

**States**:
- Pending: Waiting for author response
- Accepted: Collaboration approved
- Rejected: Request declined

**Actions**:
- Accept/Reject (for authors)
- Withdraw (for requesters)
- Message author

## 💬 Communication Components

### Chat Components

**Purpose**: Real-time messaging between collaborators.

**Files**:
- `src/components/chat/ChatWidget.tsx` - Main chat interface
- `src/components/chat/ChatInput.tsx` - Message input component
- `src/components/chat/MessageBubble.tsx` - Individual message display
- `src/components/chat/UserList.tsx` - Active users list

**Features**:
- Real-time message delivery
- Message reactions
- File sharing
- Typing indicators
- Read receipts

**Message Schema**:
```typescript
interface Message {
  id: string
  senderId: string
  content: string
  timestamp: number
  type: 'text' | 'image' | 'file'
  reactions: MessageReaction[]
}
```

## 📊 Data Display Components

### Idea Card Component

**Purpose**: Compact idea display in feeds and search results.

**Features**:
- Idea title and description preview
- Author information
- Engagement metrics (sparks, comments)
- Category and industry tags
- Quick action buttons

**Props**:
```typescript
interface IdeaCardProps {
  idea: Idea
  showActions?: boolean
  onSpark?: (ideaId: string) => void
  onComment?: (ideaId: string) => void
}
```

### User Profile Components

**Files**:
- `src/components/user/CompactProfileView.tsx` - Condensed profile
- `src/components/user/DetailedProfileView.tsx` - Full profile display

**Sections**:
- Avatar and basic info
- Bio and location
- Skills and industries
- Social links
- Activity statistics

### Notification List Component

**File**: `src/components/notifications/notification-list.tsx`

**Features**:
- Real-time notification updates
- Mark as read/unread
- Bulk actions
- Notification filtering
- Action buttons for quick responses

## 🧰 UI Primitive Components

### Button Component

**File**: `src/components/ui/button.tsx`

**Variants**:
- Default, destructive, outline, secondary, ghost, link
- Sizes: sm, default, lg

**Usage**:
```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="default">
  Click me
</Button>
```

### Input Component

**File**: `src/components/ui/input.tsx`

**Features**:
- Standard text input
- Password input
- Search input
- Error states
- Validation feedback

### Card Component

**File**: `src/components/ui/card.tsx`

**Structure**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
  <CardFooter>
    {/* Card actions */}
  </CardFooter>
</Card>
```

### Dialog Component

**File**: `src/components/ui/dialog.tsx`

**Usage**:
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

## 🎨 Styling System

### Design Tokens

**Color Palette**:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96%;
  --muted: 210 40% 96%;
  --accent: 210 40% 96%;
}
```

**Typography Scale**:
- `text-xs`: 12px
- `text-sm`: 14px
- `text-base`: 16px
- `text-lg`: 18px
- `text-xl`: 20px
- `text-2xl`: 24px
- `text-3xl`: 30px

**Spacing Scale**:
- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-6`: 24px

### Theme Support

**Dark Mode Implementation**:
```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
}
```

**Theme Toggle Hook**:
```typescript
import { useTheme } from 'next-themes'

export const useThemeToggle = () => {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return { theme, toggleTheme }
}
```

## 📱 Responsive Design

### Breakpoint System
- `sm`: 640px and up
- `md`: 768px and up
- `lg`: 1024px and up
- `xl`: 1280px and up

### Responsive Utilities
```tsx
{/* Responsive grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

{/* Responsive text */}
<h1 className="text-2xl md:text-3xl lg:text-4xl">

{/* Responsive spacing */}
<div className="p-4 md:p-6 lg:p-8">
```

## ♿ Accessibility

### ARIA Support
- Proper ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- Color contrast compliance

### Focus Management
```tsx
// Focus trap in modals
import { FocusTrap } from 'focus-trap-react'

<Dialog>
  <FocusTrap>
    <DialogContent>
      {/* Modal content */}
    </DialogContent>
  </FocusTrap>
</Dialog>
```

## 🔧 Component Development

### File Structure
```
src/components/
├── ui/                    # Reusable UI primitives
│   ├── button.tsx
│   ├── input.tsx
│   └── card.tsx
├── forms/                 # Form components
│   ├── idea-form.tsx
│   └── profile-form.tsx
├── layout/                # Layout components
│   ├── header.tsx
│   └── sidebar.tsx
└── features/              # Feature-specific components
    ├── chat/
    ├── notifications/
    └── kanban/
```

### Component Guidelines
1. **TypeScript**: All components are fully typed
2. **Composition**: Use composition over inheritance
3. **Props Interface**: Define clear prop interfaces
4. **Default Props**: Provide sensible defaults
5. **Error Boundaries**: Wrap complex components
6. **Performance**: Use React.memo for expensive renders

### Testing Components
```typescript
// Component test example
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('renders button with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

## 🚀 Performance Optimization

### Component Optimization
- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Memoize expensive operations
- **Lazy Loading**: Dynamic imports for heavy components
- **Virtual Scrolling**: For large lists

### Bundle Optimization
- **Code Splitting**: Route-based splitting
- **Tree Shaking**: Remove unused code
- **Image Optimization**: Next.js automatic optimization
- **Font Loading**: Optimized font loading

This comprehensive component library provides a solid foundation for building consistent, accessible, and performant user interfaces across the Interactive Ideas Platform.