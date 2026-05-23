# Contribution Validation Testing Guide

This guide explains how to test the contribution validation feature that ensures users meet minimum requirements before completing checkpoint tasks.

## Quick Start

### Running Automated Tests

```bash
cd interactiveideas
npm run test test/contribution-validation.test.ts
```

### Manual Testing in the App

1. Start the development server:
```bash
npm run dev
```

2. Navigate to a venture checkpoint with tasks
3. Try submitting evidence with different content to test validation

## Test Scenarios

### Scenario 1: Write Tool - Too Few Words ❌

**Steps:**
1. Open a checkpoint task that uses the "write" tool
2. Type less than 50 words (e.g., "This is a short response")
3. Click "Submit Response"

**Expected Result:**
- Client-side: Submit button is disabled
- Word counter shows: "10 / 50 words" and "40 more words needed" (example for 10 words)
- If bypassed: Server returns error "Contribution too short. Please write at least 50 words. (Current: 10 words)"
- Error displayed in red alert box above the tool
- Task remains incomplete

### Scenario 2: Write Tool - Exactly 50 Words ✅

**Steps:**
1. Open a checkpoint task that uses the "write" tool
2. Type exactly 50 words
3. Click "Submit Response"

**Expected Result:**
- Word counter shows: "50 / 50 words"
- Green checkmark appears: "✓ Requirement met"
- Submit button is enabled
- Evidence is accepted
- Task is marked complete

### Scenario 3: Write Tool - More Than 50 Words ✅

**Steps:**
1. Open a checkpoint task that uses the "write" tool
2. Type 75+ words
3. Click "Submit Response"

**Expected Result:**
- Word counter shows: "75 / 50 words"
- "✓ Requirement met" indicator visible
- Submit button is enabled
- Evidence is accepted
- Task is marked complete

### Scenario 4: Upload Tool - No File ❌

**Steps:**
1. Open a checkpoint task that uses the "upload" tool
2. Don't select any file
3. Try to click "Submit File"

**Expected Result:**
- Submit button is disabled (no file selected)
- If bypassed: Server returns error "File upload is required. Please upload a file."
- Error displayed in red alert box
- Task remains incomplete

### Scenario 5: Upload Tool - With File ✅

**Steps:**
1. Open a checkpoint task that uses the "upload" tool
2. Select any valid file (PDF, image, etc.)
3. Click "Submit File"

**Expected Result:**
- File uploads successfully
- Evidence is accepted with storageId
- Task is marked complete

### Scenario 6: Other Tools (Table, Map, Survey, Poll, Link) ✅

**Steps:**
1. Open a checkpoint task with any other tool type
2. Fill in the required fields
3. Click submit

**Expected Result:**
- Content is validated
- As long as content object exists, submission is accepted
- Task is marked complete

### Scenario 7: Error Message Clears on Close ✅

**Steps:**
1. Submit invalid evidence (e.g., <50 words in write tool)
2. See error message displayed
3. Click "Cancel" button

**Expected Result:**
- Task card closes
- Error message disappears
- When reopening task, no error is shown

### Scenario 8: Error Message Clears on Retry ✅

**Steps:**
1. Submit invalid evidence (e.g., <50 words)
2. See error message displayed
3. Add more words to meet requirement
4. Submit again

**Expected Result:**
- Error message clears when new submission starts
- If valid, submission succeeds
- Task is marked complete

## Validation Rules Summary

| Tool Type | Requirement | Error Message |
|-----------|-------------|---------------|
| Write | ≥50 words | "Contribution too short. Please write at least 50 words. (Current: X words)" |
| Upload | File with storageId | "File upload is required. Please upload a file." |
| Table | Content exists | "Contribution content is required" |
| Map | Content exists | "Contribution content is required" |
| Survey | Content exists | "Contribution content is required" |
| Poll | Content exists | "Contribution content is required" |
| Link | Content exists | "Contribution content is required" |
| OAuth | Content exists | "Contribution content is required" |
| Self Report | Content exists | "Contribution content is required" |

## Testing Checklist

Use this checklist to verify all functionality:

### Client-Side Validation (UX)
- [ ] Write tool shows real-time word count
- [ ] Word count updates as user types
- [ ] Counter turns green at 50+ words
- [ ] "X more word(s) needed" message displays correctly
- [ ] "✓ Requirement met" appears at 50+ words
- [ ] Submit button disabled when <50 words
- [ ] Submit button enabled when ≥50 words
- [ ] Upload tool submit disabled without file
- [ ] Upload tool submit enabled with file

### Server-Side Validation (Security)
- [ ] Write tool rejects <50 words
- [ ] Write tool accepts exactly 50 words
- [ ] Write tool accepts >50 words
- [ ] Upload tool rejects missing storageId
- [ ] Upload tool accepts valid storageId
- [ ] Other tools reject null/undefined content
- [ ] Other tools accept valid content
- [ ] Validation cannot be bypassed via API

### Error Handling
- [ ] Error messages display in UI
- [ ] Error messages are user-friendly
- [ ] Errors clear when closing task
- [ ] Errors clear when retrying submission
- [ ] Multiple validation attempts work correctly

### Edge Cases
- [ ] Empty string handled correctly (0 words)
- [ ] Whitespace-only text handled correctly (0 words)
- [ ] Very long text (1000+ words) accepted
- [ ] Special characters in text counted correctly
- [ ] Multiple spaces between words counted as one word
- [ ] File upload with various file types work

## Troubleshooting

### Issue: Submit button not enabling at 50 words

**Check:**
- Ensure word count calculation is correct
- Check for leading/trailing whitespace
- Verify `meetsRequirement` logic in `write-tool.tsx`

**Fix:**
```typescript
const meetsRequirement = wordCount >= 50;
disabled={!text.trim() || wordCount < 50 || isSubmitting}
```

### Issue: Server accepts invalid submissions

**Check:**
- Verify `validateContributionRequirement` is called in `submitEvidence`
- Check that validation happens before database writes
- Ensure error is thrown when validation fails

**Fix:**
```typescript
const validation = validateContributionRequirement(
  task.toolType,
  args.content,
  args.storageId,
);

if (!validation.valid) {
  throw new Error(validation.reason || "Invalid contribution");
}
```

### Issue: Error messages not displaying

**Check:**
- Verify `errorMessage` state exists in page-content.tsx
- Ensure `setErrorMessage` is called in catch block
- Check that `errorMessage` prop is passed to TaskCard
- Verify error display JSX is present in TaskCard

**Fix:**
```typescript
// In handleSubmitEvidence
catch (error) {
  const errorMsg = error instanceof Error
    ? error.message
    : "Failed to submit evidence. Please try again.";
  setErrorMessage(errorMsg);
}

// In TaskCard JSX
{errorMessage && (
  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
    <p className="font-medium">⚠️ {errorMessage}</p>
  </div>
)}
```

### Issue: Word count not updating

**Check:**
- Verify `setText` updates state correctly
- Check word count calculation logic
- Ensure component re-renders on text change

**Fix:**
```typescript
const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
```

## Test Data

### Sample 50-word text:
```
This is a sample text that contains exactly fifty words for testing purposes here. 
It demonstrates what users need to write to meet the minimum requirement for task 
completion. The validation system will count each word separated by whitespace. 
This text should pass validation and allow successful submission of evidence when used.
```

### Sample 100-word text:
```
This is a longer sample text containing one hundred words for testing purposes. 
It provides an example of content that exceeds the minimum requirement significantly. 
Users who write this much text will definitely meet the validation criteria. The 
word counter will show that requirements are met and submission will be allowed. 
This demonstrates that the system properly handles submissions that exceed minimums. 
The green checkmark indicator should appear immediately when typing reaches fifty 
words. Additional words beyond the minimum are perfectly acceptable and encouraged. 
More detailed responses help provide better evidence of task completion for venture 
checkpoints. This text serves as comprehensive test data for validation testing scenarios.
```

## Notes

- **Client validation is for UX only** - Always verify server validation is working
- **Server validation is authoritative** - Client validation can be bypassed, server cannot
- **Test both layers** - Ensure client provides good UX and server provides security
- **Error messages should be helpful** - Users need clear guidance on what's wrong
- **Word counting matches industry standard** - Split on whitespace, trim edges

## Related Files

- `convex/ventures.ts` - Server-side validation function
- `src/components/tools/write-tool.tsx` - Client-side word counter
- `src/app/venture/[id]/stage/[stage]/checkpoint/[checkpoint]/page-content.tsx` - Error display
- `test/contribution-validation.test.ts` - Automated tests

## Success Criteria

The feature is working correctly when:
1. ✅ Users cannot submit <50 words in write tool
2. ✅ Users get immediate feedback on word count
3. ✅ Invalid submissions are rejected by server
4. ✅ Clear error messages guide users
5. ✅ Valid submissions are accepted
6. ✅ All validation rules are enforced consistently