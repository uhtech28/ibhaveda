# Contribution Validation Implementation

## Overview
This document describes the implementation of contribution requirements validation for checkpoint completion in the Interactive Ideas venture system.

## Requirements
Block checkpoint completion until a valid contribution is posted:
- **Text (write tool)**: Minimum 50 words
- **Audio/Video/Image/File (upload tool)**: Any file with valid storageId
- **Other tools**: Content must exist

## Implementation

### 1. Backend Validation Function

**File**: `convex/ventures.ts`

Added `validateContributionRequirement()` helper function before the `submitEvidence` mutation:

```typescript
function validateContributionRequirement(
  toolType: string,
  content: any,
  storageId?: string,
): { valid: boolean; reason?: string }
```

**Validation Rules**:

- **Write Tool** (`toolType === "write"`):
  - Checks for `content.text` presence
  - Counts words (uses `content.wordCount` or calculates from `content.text`)
  - Requires minimum 50 words
  - Returns error: "Contribution too short. Please write at least 50 words. (Current: X words)"

- **Upload Tool** (`toolType === "upload"`):
  - Checks for `storageId` (either as parameter or in `content.storageId`)
  - Requires file to exist
  - Returns error: "File upload is required. Please upload a file."

- **Other Tools** (table, map, survey, poll, link, oauth, self_report):
  - Simply checks that `content` exists
  - Returns error: "Contribution content is required"

### 2. Integration with submitEvidence Mutation

**File**: `convex/ventures.ts`

Updated the `submitEvidence` mutation to call validation before creating evidence:

```typescript
// Validate contribution requirements
const validation = validateContributionRequirement(
  task.toolType,
  args.content,
  args.storageId,
);

if (!validation.valid) {
  throw new Error(validation.reason || "Invalid contribution");
}
```

This ensures:
- Validation runs server-side (cannot be bypassed)
- User-friendly error messages are returned
- Invalid submissions are rejected before database writes

### 3. Client-Side Write Tool Validation

**File**: `src/components/tools/write-tool.tsx`

Enhanced the WriteTool component with real-time validation feedback:

**Features**:
- Real-time word counter: "X / 50 words"
- Green text when requirement met (≥50 words)
- Shows remaining words needed: "X more word(s) needed"
- Success indicator: "✓ Requirement met"
- Submit button disabled until 50 words reached

**User Experience**:
```typescript
const meetsRequirement = wordCount >= 50;
disabled={!text.trim() || wordCount < 50 || isSubmitting}
```

Users see immediate feedback as they type and cannot submit until requirements are met.

### 4. Error Display in UI

**File**: `src/app/venture/[id]/stage/[stage]/checkpoint/[checkpoint]/page-content.tsx`

**Changes**:

1. **Added error state**:
```typescript
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

2. **Enhanced error handling in handleSubmitEvidence**:
```typescript
try {
  await submitEvidence({ taskId: taskId as any, content });
  setActiveTask(null);
} catch (error) {
  const errorMsg = error instanceof Error
    ? error.message
    : "Failed to submit evidence. Please try again.";
  setErrorMessage(errorMsg);
}
```

3. **Added errorMessage prop to TaskCard component**:
```typescript
errorMessage?: string | null;
```

4. **Error message display in TaskCard**:
```tsx
{errorMessage && (
  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
    <p className="font-medium">⚠️ {errorMessage}</p>
  </div>
)}
```

5. **Clear error on task close**:
```typescript
onClose={() => {
  setActiveTask(null);
  setErrorMessage(null);
}}
```

## Validation Flow

### Happy Path (Valid Submission)
1. User types 50+ words in WriteTool
2. Real-time counter shows "✓ Requirement met"
3. Submit button becomes enabled
4. User clicks Submit
5. Backend validates: ✓ 50+ words
6. Evidence created successfully
7. Task marked complete

### Error Path (Invalid Submission)
1. User types <50 words in WriteTool
2. Counter shows "X more word(s) needed"
3. User clicks Submit (if they somehow bypass client validation)
4. Backend validates: ✗ Less than 50 words
5. Error thrown with message: "Contribution too short. Please write at least 50 words. (Current: 30 words)"
6. Error displayed in red alert box in UI
7. Task remains incomplete
8. User can retry

## Testing Checklist

- [ ] Write tool: Submit with <50 words → Error displayed
- [ ] Write tool: Submit with exactly 50 words → Success
- [ ] Write tool: Submit with >50 words → Success
- [ ] Upload tool: Submit without file → Error displayed
- [ ] Upload tool: Submit with file → Success
- [ ] Other tools: Submit without content → Error displayed
- [ ] Other tools: Submit with content → Success
- [ ] Error message clears when closing task
- [ ] Error message clears when starting new submission
- [ ] Client-side validation prevents invalid submissions (UX)
- [ ] Backend validation blocks invalid submissions (security)

## Files Modified

1. `convex/ventures.ts` - Added validation function and integrated into submitEvidence
2. `src/components/tools/write-tool.tsx` - Added real-time word counter and validation
3. `src/app/venture/[id]/stage/[stage]/checkpoint/[checkpoint]/page-content.tsx` - Added error handling and display

## Security Notes

- **Server-side validation is primary** - Client validation is for UX only
- All submissions validated before database writes
- Error messages are user-friendly but don't expose system internals
- Validation cannot be bypassed by client manipulation

## Future Enhancements

Potential improvements for future iterations:

1. **Audio/Video validation**: Check actual file type and duration
2. **Configurable minimums**: Store word count requirements in checkpoint definitions
3. **Rich text support**: Better word counting for formatted text
4. **Draft saving**: Auto-save partial submissions
5. **Validation hints**: Show requirements before user starts typing
6. **Progress indicators**: Visual progress bars for word count

## Conclusion

The contribution validation system successfully prevents checkpoint completion without meeting minimum requirements while providing clear feedback to users. The dual-layer approach (client + server validation) ensures both good UX and security.