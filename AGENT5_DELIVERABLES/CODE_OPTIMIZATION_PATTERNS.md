# CODE OPTIMIZATION PATTERNS

Best practices and patterns used in Agent 5 optimization.

---

## 1. REACT PERFORMANCE PATTERNS

### Pattern 1: React.memo for Component Memoization

**When to use:** Components that re-render frequently but props rarely change

```typescript
// Before
export function MyComponent({ data }: Props) {
  return <div>{data.name}</div>;
}

// After  
const MyComponentInternal = ({ data }: Props) => {
  return <div>{data.name}</div>;
};

export const MyComponent = React.memo(MyComponentInternal);
```

**Applied to:**
- HUD.tsx
- XPBar.tsx
- LevelDisplay.tsx
- StageInfo.tsx

---

### Pattern 2: useMemo for Expensive Calculations

**When to use:** Computing derived data from props/state

```typescript
// Before
const checkpoints = worldMapData?.checkpoints ?? [];

// After
const checkpoints = useMemo(
  () => worldMapData?.checkpoints ?? [],
  [worldMapData?.checkpoints]
);
```

**Applied to:**
- Checkpoint array memoization
- Phase color calculations
- Badge filtering

---

### Pattern 3: useCallback for Event Handlers

**When to use:** Passing callbacks to memoized child components

```typescript
// Before
<button onClick={() => setExpanded(!expanded)}>Toggle</button>

// After
const toggleExpanded = useCallback(() => {
  setExpanded(!expanded);
}, [expanded, setExpanded]);

<button onClick={toggleExpanded}>Toggle</button>
```

**Applied to:**
- HUD toggle button
- Task completion handlers
- Form submissions

---

## 2. TYPESCRIPT PATTERNS

### Pattern 1: Proper Type Annotations

**Before:**
```typescript
onSelect={(date) => date && setDate(date)}  // Implicit any
```

**After:**
```typescript
onSelect={(date: Date | undefined) => date && setDate(date)}
```

---

### Pattern 2: Type Guards for Union Types

**Before:**
```typescript
if (el.type !== "arrow" && el.type !== "postit" && el.type !== "image") {
  // Error: Types don't overlap
}
```

**After:**
```typescript
if (el.type !== "arrow") {
  // TypeScript narrows to Shape | PostIt | ImageElement
}
```

---

### Pattern 3: Convex Id Types

**Before:**
```typescript
taskId: checkpointId as any
```

**After:**
```typescript
taskId: checkpointId as Id<"ventureTasks">
```

---

## 3. INPUT VALIDATION PATTERNS

### Pattern 1: Real-time Word Count

```typescript
useEffect(() => {
  if (selectedFormat === "text") {
    const words = textContent.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    
    if (words.length < 50 && textContent.trim()) {
      setValidationError(`Need ${50 - words.length} more words`);
    } else {
      setValidationError(null);
    }
  }
}, [textContent, selectedFormat]);
```

---

### Pattern 2: File Type Whitelist

```typescript
const validTypes: Record<string, string[]> = {
  video: ["video/mp4", "video/webm", "video/quicktime"],
  image: ["image/png", "image/jpeg", "image/jpg"],
  file: ["application/pdf", "application/vnd.ms-powerpoint"],
};

const allowedTypes = validTypes[selectedFormat];
if (!allowedTypes.includes(file.type)) {
  setValidationError(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`);
  return;
}
```

---

## 4. CONVEX QUERY PATTERNS

### Pattern 1: Conditional Queries

**Use "skip" when query depends on data not yet available:**

```typescript
const worldMapData = useQuery(
  api.worldMap.getWorldMapData,
  activeVenture ? { ventureId: activeVenture._id } : "skip"
);
```

---

### Pattern 2: Query Result Memoization

**Prevent re-renders when Convex re-fetches but data hasn't changed:**

```typescript
const checkpoints = useMemo(
  () => worldMapData?.checkpoints ?? [],
  [worldMapData?.checkpoints]
);
```

---

## 5. ERROR HANDLING PATTERNS

### Pattern 1: Try-Catch with User Feedback

```typescript
try {
  await submitEvidence({ taskId, content });
  setShowSuccess(true);
} catch (err) {
  console.error("Submit failed:", err);
  setValidationError("Submission failed. Please try again.");
}
```

---

### Pattern 2: Graceful Degradation

```typescript
const brightness = worldMapData?.brightness ?? 100; // Default value
const ideaTitle = worldMapData?.ideaTitle ?? "Your Venture";
```

---

## 6. BUNDLE SIZE PATTERNS

### Pattern 1: Dynamic Imports (Future Enhancement)

```typescript
// Instead of:
import { HeavyTool } from "./HeavyTool";

// Use:
const HeavyTool = lazy(() => import("./HeavyTool"));

// Wrap in Suspense:
<Suspense fallback={<Loading />}>
  <HeavyTool />
</Suspense>
```

---

### Pattern 2: Tree Shaking

**Import only what you need:**

```typescript
// Before
import * as Icons from "lucide-react";

// After
import { Check, Plus, Trash } from "lucide-react";
```

---

## 7. SECURITY PATTERNS

### Pattern 1: Authentication Checks

```typescript
export const myMutation = mutation({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // Mutation logic...
  }
});
```

---

### Pattern 2: XSS Prevention

**React auto-escapes by default, but verify:**

```typescript
// Safe (auto-escaped)
<div>{userGeneratedContent}</div>

// Unsafe (avoid unless sanitized)
<div dangerouslySetInnerHTML={{ __html: sanitize(content) }} />
```

---

## 8. ANTI-PATTERNS TO AVOID

### ❌ Anti-Pattern 1: Unnecessary Re-renders

```typescript
// Bad: Creates new object on every render
<Component style={{ margin: 10 }} />

// Good: Define outside or memoize
const style = { margin: 10 };
<Component style={style} />
```

---

### ❌ Anti-Pattern 2: Inline Functions in Memoized Components

```typescript
// Bad: Breaks memoization
const MyComponent = React.memo(({ onSubmit }) => {
  return <button onClick={() => onSubmit()}>Submit</button>;
});

<MyComponent onSubmit={() => console.log("submit")} />

// Good: Use useCallback
const handleSubmit = useCallback(() => {
  console.log("submit");
}, []);

<MyComponent onSubmit={handleSubmit} />
```

---

### ❌ Anti-Pattern 3: Missing Dependency Arrays

```typescript
// Bad: Runs on every render
useEffect(() => {
  fetchData();
}); // Missing dependency array

// Good: Runs only when deps change
useEffect(() => {
  fetchData();
}, [fetchData]);
```

---

## 9. TESTING PATTERNS

### Pattern 1: Unit Test Performance-Critical Components

```typescript
describe("XPBar", () => {
  it("memoizes correctly", () => {
    const { rerender } = render(<XPBar currentXP={50} maxXP={100} />);
    const firstRender = screen.getByText("50");
    
    // Re-render with same props
    rerender(<XPBar currentXP={50} maxXP={100} />);
    
    // Should be same instance (not re-rendered)
    expect(screen.getByText("50")).toBe(firstRender);
  });
});
```

---

## 10. MONITORING PATTERNS

### Pattern 1: Performance Logging

```typescript
useEffect(() => {
  const start = performance.now();
  
  // Expensive operation
  const result = processData(largeDataset);
  
  const end = performance.now();
  if (end - start > 100) {
    console.warn(`Slow operation: ${end - start}ms`);
  }
}, [largeDataset]);
```

---

**Use these patterns as a reference for future optimizations.**
