# 🧪 TOOLS TESTING GUIDE - Visual Verification

**Purpose:** Step-by-step manual testing instructions for all 5 completed tools
**Target Users:** QA Engineers, Developers, Product Managers
**Estimated Testing Time:** ~30 minutes for complete suite

---

## 📋 PRE-TESTING CHECKLIST

Before testing, ensure:
- [ ] Development server is running (`npm run dev`)
- [ ] Browser console is open (F12)
- [ ] Network tab is visible
- [ ] No existing console errors
- [ ] Test in both light and dark modes

---

## 🗓️ CALENDAR TOOL - Complete Test Suite

### Test 1: Basic Event Creation
**Steps:**
1. Open Calendar Tool
2. Verify default view is "Month View"
3. Click "Add Event" button
4. Event form should appear with blue header
5. Select a date from calendar picker
6. Enter time: "10:00"
7. Enter title: "Team Meeting"
8. Enter description: "Quarterly review meeting"
9. Click "Add Event"
10. Verify event appears in list with:
    - Blue border
    - Clock icon
    - Formatted date and time
    - Title and description visible

**Expected Result:** ✅ Event created successfully with blue styling

---

### Test 2: Basic Milestone Creation
**Steps:**
1. Click "Add Milestone" button
2. Milestone form should appear with amber header
3. Select a date (different from event)
4. Enter title: "Project Launch"
5. Enter description: "Official product release"
6. Click "Add Milestone"
7. Verify milestone appears in list with:
    - Amber border
    - Milestone icon
    - Formatted date
    - Title and description visible

**Expected Result:** ✅ Milestone created successfully with amber styling

---

### Test 3: Week/Month View Toggle
**Steps:**
1. With existing events/milestones, click "Week View" tab
2. Verify display changes to 7-day grid
3. Verify current week is shown with day names
4. Verify dots appear on days with items (blue for events, amber for milestones)
5. Click "Month View" tab
6. Verify calendar returns to full month display
7. Verify items still visible in list below

**Expected Result:** ✅ Views toggle smoothly, data persists

---

### Test 4: Validation - Empty Submission
**Steps:**
1. Delete all events and milestones (click X button on each)
2. Verify counter shows "0 items"
3. Verify submit button is disabled
4. Verify message: "Add at least one event or milestone to submit"

**Expected Result:** ✅ Cannot submit empty calendar

---

### Test 5: Validation - Minimum Requirement Met
**Steps:**
1. Add just 1 event OR 1 milestone
2. Verify counter shows "1 item"
3. Verify submit button becomes enabled
4. Click submit
5. Verify loading state appears
6. Check console for submitted data

**Expected Result:** ✅ Can submit with minimum 1 item

---

### Test 6: Multiple Items & Summary
**Steps:**
1. Add 3 events on different dates
2. Add 2 milestones on different dates
3. Verify summary shows: "3 Events" and "2 Milestones"
4. Verify total counter shows "5 items"
5. Click submit button
6. Verify button text: "Submit Calendar (5 items)"

**Expected Result:** ✅ Summary counts accurate

---

## 📊 KANBAN TOOL - Complete Test Suite

### Test 1: Card Creation
**Steps:**
1. Open Kanban Tool
2. Enter card title: "Design wireframes"
3. Select column: "To Do"
4. Click + button
5. Verify card appears in "To Do" column with:
    - Grip icon on left
    - Title text in center
    - Delete button (X) on right
6. Verify "To Do" column shows "1 card"

**Expected Result:** ✅ Card created in correct column

---

### Test 2: Drag & Drop - Basic
**Steps:**
1. Create 1 card in "To Do" column
2. Hover over card - verify cursor becomes "grab"
3. Click and hold grip icon
4. Drag card toward "In Progress" column
5. Observe:
    - Card becomes semi-transparent (50% opacity)
    - Cursor changes to "grabbing"
    - Ghost overlay appears
6. Drop card in "In Progress" column
7. Verify card now exists in "In Progress"
8. Verify column counts updated

**Expected Result:** ✅ Card moves between columns smoothly

---

### Test 3: Drag & Drop - Multiple Cards
**Steps:**
1. Create 5 cards in "To Do" column
2. Drag 2 cards to "In Progress"
3. Drag 2 cards to "Done"
4. Keep 1 card in "To Do"
5. Verify each column shows correct count:
    - To Do: 1 card
    - In Progress: 2 cards
    - Done: 2 cards
6. Verify total at bottom: "Total cards: 5"

**Expected Result:** ✅ All cards tracked correctly

---

### Test 4: Drag & Drop - Ordering
**Steps:**
1. Create 3 cards in "To Do": "Card A", "Card B", "Card C"
2. Drag "Card A" below "Card C"
3. Verify new order: "Card B", "Card C", "Card A"
4. Drag "Card C" to "In Progress"
5. Verify "Card C" removed from "To Do"
6. Verify "Card B" and "Card A" remain in original order

**Expected Result:** ✅ Card order persists correctly

---

### Test 5: Delete Functionality
**Steps:**
1. Create 3 cards across different columns
2. Hover over a card
3. Click delete (X) button
4. Verify card disappears immediately
5. Verify column count decrements
6. Verify total count decrements
7. Delete all cards
8. Verify submit button disabled when empty

**Expected Result:** ✅ Delete removes cards, validation works

---

### Test 6: Visual Feedback
**Steps:**
1. Create 1 card
2. Start dragging card
3. Observe during drag:
    - Original card 50% opacity
    - Overlay card follows cursor
    - Cursor is "grabbing"
    - Smooth animation
4. Drop in different column
5. Verify instant update with transition
6. No lag or glitches

**Expected Result:** ✅ Smooth visual feedback throughout

---

## 🎨 MAP/CANVAS TOOL - Complete Test Suite

### Test 1: Post-it Creation
**Steps:**
1. Open Map/Canvas Tool
2. Click "Post-it" button
3. Verify post-it appears on canvas with:
    - Pastel color background
    - "New note" default text
    - Editable text field
4. Click text and type: "First idea"
5. Verify text updates live
6. Drag post-it to new position
7. Verify position updates smoothly

**Expected Result:** ✅ Post-it created and movable

---

### Test 2: Shape Creation - All Types
**Steps:**
1. Click "Rectangle" button
2. Verify rectangle appears on canvas with selected color
3. Click "Circle" button
4. Verify circle/ellipse appears
5. Click "Triangle" button
6. Verify triangle appears
7. Click different color in color picker
8. Click "Rectangle" again
9. Verify new rectangle has new color

**Expected Result:** ✅ All shapes render correctly with colors

---

### Test 3: Arrow Drawing
**Steps:**
1. Select a color from color picker
2. Click "Arrow" button in toolbar
3. Canvas cursor should change to crosshair
4. Click and hold on canvas at point A
5. Drag to point B (150px away)
6. Observe dashed preview arrow while dragging
7. Release mouse
8. Verify solid arrow appears with:
    - Correct start/end points
    - Arrowhead at end
    - Selected color
9. Draw 2 more arrows in different directions
10. Verify all arrows render correctly

**Expected Result:** ✅ Arrows drawn with proper arrowheads

---

### Test 4: Image Upload
**Steps:**
1. Click "Image" button
2. File picker should open
3. Select an image file (JPG/PNG)
4. Verify image appears on canvas
5. Verify image renders correctly (not distorted)
6. Drag image to new position
7. Hover over image - verify resize handle in bottom-right
8. Drag resize handle
9. Verify image resizes proportionally
10. Verify delete button appears on hover

**Expected Result:** ✅ Images upload, display, and resize

---

### Test 5: Element Manipulation
**Steps:**
1. Add 2 post-its, 2 shapes, 1 arrow, 1 image (6 elements total)
2. Drag each element - verify all movable
3. Hover over each element
4. Verify delete button appears on shapes, post-its, and images
5. Note: Arrows don't have delete button after creation (by design)
6. Resize shapes by dragging bottom-right corner
7. Verify resize works for rectangles, circles, triangles
8. Verify element count: "6 elements on canvas"

**Expected Result:** ✅ All elements manipulable

---

### Test 6: Delete & Validation
**Steps:**
1. Start with 5 elements on canvas
2. Hover and delete each element one by one
3. Verify count decrements: 5 → 4 → 3 → 2 → 1 → 0
4. When count reaches 0, verify:
    - Submit button disabled
    - Message: "Add at least one element to submit"
5. Add 1 post-it
6. Verify submit button enabled
7. Click submit
8. Verify submission data in console

**Expected Result:** ✅ Validation prevents empty canvas submission

---

### Test 7: Color Picker
**Steps:**
1. Observe 12 colors in color picker
2. Click first color (blue)
3. Verify border appears around selected color
4. Add a rectangle - verify it's blue
5. Click different color (red)
6. Verify border moves to red
7. Add a circle - verify it's red
8. Draw an arrow - verify it's red
9. Verify color selection works for all tools

**Expected Result:** ✅ Color picker controls element colors

---

## 📖 JOURNAL TOOL - Complete Test Suite

### Test 1: Entry Creation - Private
**Steps:**
1. Open Journal Tool
2. Verify share toggle shows "Private" with Lock icon
3. Verify toggle is OFF (default)
4. Enter title: "Day 1 Reflection"
5. Enter content: "Today I made significant progress on the project..."
6. Verify word count updates: "10 words"
7. Verify share toggle still OFF
8. Click "Add Entry"
9. Verify entry appears in list with:
    - Lock icon
    - "Private" label
    - Regular border (not blue)
10. Verify form clears after adding

**Expected Result:** ✅ Private entry created successfully

---

### Test 2: Entry Creation - Shared
**Steps:**
1. Enter title: "Team Update"
2. Enter content: "Sharing today's achievements with the team..."
3. Toggle "Share with team" to ON
4. Verify:
    - Toggle switches to right
    - Users icon appears
    - Text: "This entry will be visible to your team"
5. Click "Add Entry"
6. Verify entry appears with:
    - Users icon (blue)
    - "Shared with team" label (blue)
    - Blue border
    - Blue background tint

**Expected Result:** ✅ Shared entry created with visual distinction

---

### Test 3: Toggle Existing Entry
**Steps:**
1. Create 1 private entry
2. Create 1 shared entry
3. Locate private entry in list
4. Find toggle at bottom of entry card
5. Click toggle to turn ON
6. Observe:
    - Entry border changes to blue
    - Background tint changes to blue
    - Icon changes from Lock to Users
    - Label changes from "Private" to "Shared with team"
7. Click toggle to turn OFF
8. Verify reverse: blue → normal, Users → Lock

**Expected Result:** ✅ Share status toggles live

---

### Test 4: Multiple Entries & Summary
**Steps:**
1. Create 3 private entries
2. Create 2 shared entries
3. Verify list shows all 5 entries
4. Check summary at bottom:
    - "3 Private" with Lock icon
    - "2 Shared" with Users icon
5. Toggle 1 private to shared
6. Verify summary updates to:
    - "2 Private"
    - "3 Shared"
7. Verify submit button text: "Submit Journal (5 entries)"

**Expected Result:** ✅ Summary counts dynamic and accurate

---

### Test 5: Delete Entry
**Steps:**
1. Create 2 entries
2. Hover over entry header
3. Click "×" button in top-right
4. Verify entry disappears
5. Verify entry count decrements
6. Delete all entries
7. Verify submit button disabled
8. Verify message: "Add at least one journal entry to submit"

**Expected Result:** ✅ Delete and validation work correctly

---

### Test 6: Visual Indicators
**Steps:**
1. Create 1 private and 1 shared entry
2. Compare visual differences:
    - **Private:** Gray border, Lock icon, no blue tint
    - **Shared:** Blue border, Users icon, blue background
3. Verify indicators consistent throughout
4. Toggle states back and forth
5. Verify smooth transitions

**Expected Result:** ✅ Clear visual distinction between private/shared

---

## 📝 SELF-REPORT TOOL - Complete Test Suite

### Test 1: Initial State
**Steps:**
1. Open Self-Report Tool with fields:
    - Name (text)
    - Progress (textarea)
    - Hours (number)
2. Verify all fields empty
3. Verify confirmation checkbox visible
4. Verify checkbox is DISABLED (grayed out)
5. Verify submit button is DISABLED
6. Verify amber alert: "Please complete all required fields"

**Expected Result:** ✅ Initial state prevents submission

---

### Test 2: Field Completion Tracking
**Steps:**
1. Enter name: "John Doe"
2. Verify "1 of 3 fields filled"
3. Verify checkbox still disabled
4. Enter progress: "Completed task A and B"
5. Verify "2 of 3 fields filled"
6. Enter hours: "8"
7. Verify "✓ All fields completed" (green text)
8. Verify amber alert disappears
9. Verify blue alert appears: "One more step!"
10. Verify checkbox now ENABLED (clickable)

**Expected Result:** ✅ Progress tracking accurate

---

### Test 3: Confirmation Checkbox Behavior
**Steps:**
1. With all fields filled
2. Verify checkbox enabled
3. Verify submit button still disabled
4. Click checkbox
5. Observe:
    - Checkmark appears inside checkbox
    - Checkbox border turns blue
    - Card border turns blue
    - Background tint turns blue
6. Verify submit button becomes ENABLED
7. Verify blue alert disappears
8. Verify status shows: "✓ Confirmed" (blue text)
9. Uncheck checkbox
10. Verify submit button disables again

**Expected Result:** ✅ Checkbox controls submission

---

### Test 4: Required Field Validation
**Steps:**
1. Fill all fields
2. Check confirmation checkbox
3. Verify submit enabled
4. Clear the "Name" field
5. Observe:
    - Checkbox becomes disabled
    - Checkmark disappears
    - Submit button disables
    - Amber alert reappears
6. Re-fill name field
7. Verify checkbox re-enables
8. Check checkbox again
9. Verify submit re-enables

**Expected Result:** ✅ Clearing fields re-triggers validation

---

### Test 5: Visual States - Complete Flow
**Steps:**
1. Start empty - observe state:
    - Amber alert visible
    - Checkbox disabled + grayed out
    - Submit button disabled
    - Counter: "0 of 3 fields filled"
2. Fill all fields - observe state:
    - Blue alert visible ("One more step")
    - Checkbox enabled
    - Submit button still disabled
    - Counter: "✓ All fields completed"
3. Check checkbox - observe state:
    - No alerts
    - Checkbox checked + blue
    - Submit button enabled
    - Status: "✓ Confirmed"

**Expected Result:** ✅ Visual states guide user through flow

---

### Test 6: Submission
**Steps:**
1. Complete all fields:
    - Name: "Jane Smith"
    - Progress: "Finished all milestones on time"
    - Hours: "12"
2. Check confirmation checkbox
3. Verify all validation passed
4. Click "Submit Report"
5. Verify button shows loading state:
    - Spinner icon
    - Text: "Submitting..."
    - Button disabled during submission
6. Check console for submitted data:
    ```javascript
    {
      values: { name: "Jane Smith", progress: "...", hours: 12 },
      confirmed: true,
      timestamp: 1234567890
    }
    ```

**Expected Result:** ✅ Submission successful with correct data

---

### Test 7: Alert Messages
**Steps:**
1. Verify alerts appear at correct times:
    - **Amber Alert:** When fields incomplete
    - **Blue Alert:** When fields complete but not confirmed
    - **No Alert:** When confirmed and ready to submit
2. Verify alert icons:
    - AlertCircle icon present
    - Correct colors (amber/blue)
3. Verify alert text is clear and helpful

**Expected Result:** ✅ Alerts provide clear guidance

---

## 🎯 CROSS-TOOL VALIDATION

### Test 1: Consistent UI
**Steps:**
1. Open each tool sequentially
2. Verify all use same Card layout
3. Verify all have icon + title in header
4. Verify all have CardDescription with prompt
5. Verify submit buttons all say "Submit [Tool Name]"
6. Verify loading states all use same spinner

**Expected Result:** ✅ Consistent design language

---

### Test 2: Dark Mode
**Steps:**
1. Switch to dark mode
2. Test each tool
3. Verify:
    - Text readable
    - Borders visible
    - Icons clear
    - Colors adjusted appropriately
    - No white backgrounds bleeding through

**Expected Result:** ✅ Dark mode works for all tools

---

### Test 3: Mobile Responsiveness
**Steps:**
1. Resize browser to 375px width (mobile)
2. Test each tool
3. Verify:
    - Layouts adapt
    - Buttons remain clickable
    - Text remains readable
    - No horizontal scroll
    - Touch targets adequate (44px+)

**Expected Result:** ✅ Mobile-friendly layouts

---

## 🐛 EDGE CASE TESTING

### Calendar Tool:
- [ ] Add event on today's date
- [ ] Add milestone in past
- [ ] Add 20+ items (scrolling works)
- [ ] Add item with very long title/description

### Kanban Tool:
- [ ] Create card with 200+ character title
- [ ] Drag card very quickly
- [ ] Create 50+ cards (performance test)
- [ ] Drag and drop on same column

### Map/Canvas Tool:
- [ ] Draw arrow with 0 length (click-release same spot)
- [ ] Upload very large image (5MB+)
- [ ] Add 50+ elements (performance test)
- [ ] Drag element outside canvas bounds

### Journal Tool:
- [ ] Create entry with 5000+ words
- [ ] Create 20+ entries (scrolling)
- [ ] Toggle share status rapidly
- [ ] Entry with empty title (uses "Untitled")

### Self-Report Tool:
- [ ] Enter negative number in number field
- [ ] Enter very long text in textarea (1000+ words)
- [ ] Rapidly check/uncheck confirmation
- [ ] All fields optional (test with required: false)

---

## ✅ FINAL VERIFICATION CHECKLIST

**Before marking tools as complete:**

- [ ] All 5 tools tested individually
- [ ] All validation rules work correctly
- [ ] All visual feedback present
- [ ] No console errors in any tool
- [ ] Dark mode works for all tools
- [ ] Mobile responsive verified
- [ ] Loading states tested
- [ ] Empty states tested
- [ ] Delete functionality works
- [ ] Submit functionality works
- [ ] Data structure correct in console
- [ ] TypeScript errors: 0
- [ ] Console warnings: minimal/acceptable
- [ ] Performance smooth on all tools
- [ ] Animations are 60fps
- [ ] All icons render correctly
- [ ] All colors consistent
- [ ] All text readable
- [ ] All buttons clickable
- [ ] All forms functional

---

## 📊 TESTING SUMMARY TEMPLATE

Use this template to document your testing:

```
TOOL: [Tool Name]
TESTER: [Your Name]
DATE: [Date]
BROWSER: [Chrome/Firefox/Safari/Edge]
DEVICE: [Desktop/Mobile/Tablet]

TESTS PASSED: [X/X]
BUGS FOUND: [Count]
SEVERITY: [Critical/High/Medium/Low]

NOTES:
- [Any observations]
- [Any issues found]
- [Any improvements suggested]

STATUS: ✅ APPROVED / ⚠️ NEEDS FIXES / ❌ REJECTED
```

---

## 🚀 SIGN-OFF

**When all tests pass:**
- All 5 tools verified working
- No critical bugs found
- All features match PRD
- UI/UX consistent and polished
- Performance acceptable
- Ready for production deployment

**Testing Completed By:** _______________
**Date:** _______________
**Signature:** _______________

---

**Happy Testing! 🧪✨**