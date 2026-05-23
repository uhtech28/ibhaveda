# ✅ PRODUCTION READINESS CHECKLIST
## Interactive Ideas - Venture Quest World v1.0

**Last Updated:** April 21, 2024  
**Target Launch:** 3 weeks from today  
**Current Status:** 78/100 (Not Ready)

---

## 🎯 LAUNCH BLOCKERS (Must Complete Before Production)

### Critical Tools (5 items)

- [ ] **Calendar Tool** - Build from scratch
  - [ ] Component file: `src/components/tools/calendar-tool.tsx`
  - [ ] Week/month view toggle
  - [ ] Event creation form
  - [ ] Milestone creation form
  - [ ] Visual distinction between events and milestones
  - [ ] Minimum validation: 1 event or milestone
  - [ ] Submit button blocked until requirement met
  - **Owner:** Frontend Team  
  - **Estimate:** 1 day  
  - **Priority:** CRITICAL

- [ ] **Kanban Tool** - Add drag-and-drop
  - [ ] Install @dnd-kit or react-beautiful-dnd
  - [ ] Implement drag handlers for cards
  - [ ] Implement drop handlers for columns
  - [ ] Update card position on drop
  - [ ] Visual feedback during drag
  - [ ] Test: Drag card between columns
  - **Owner:** Frontend Team  
  - **Estimate:** 0.5 day  
  - **Priority:** CRITICAL

- [ ] **Map/Canvas Tool** - Add shapes and arrows
  - [ ] Add shape selector (rectangle, circle, triangle)
  - [ ] Add arrow drawing tool
  - [ ] Add image drop functionality
  - [ ] Update minimum validation to include shapes/arrows
  - [ ] Test: Create canvas with all element types
  - **Owner:** Frontend Team  
  - **Estimate:** 0.5 day  
  - **Priority:** CRITICAL

- [ ] **Journal Tool** - Add selective share toggle
  - [ ] Add per-entry share toggle UI
  - [ ] Store share preference in submission
  - [ ] Update backend to respect share setting
  - [ ] Test: Create entry, toggle share, verify privacy
  - **Owner:** Frontend Team  
  - **Estimate:** 0.25 day  
  - **Priority:** CRITICAL

- [ ] **Self-report Tool** - Add confirmation checkbox
  - [ ] Add "I confirm this information is accurate" checkbox
  - [ ] Enforce checkbox before submit
  - [ ] Update validation logic
  - [ ] Test: Cannot submit without checkbox
  - **Owner:** Frontend Team  
  - **Estimate:** 0.25 day  
  - **Priority:** CRITICAL

**Total Estimate:** 2.5 days

---

### AI Scoring Integration (1 item)

- [ ] **Wire AI Scoring to Frontend**
  - [ ] Import scoreEvidence mutation in map page
  - [ ] Call scoreEvidence after task submission
  - [ ] Add loading state during scoring
  - [ ] Display quality tier badge (Low/Standard/High)
  - [ ] Trigger Valuation Score update on score return
  - [ ] Add ticker animation for Valuation Score change
  - [ ] Test: Submit task, verify scoring occurs, see updated valuation
  - [ ] Handle scoring errors gracefully
  - **File:** `src/app/map/world/page.tsx` Line 1225-1262
  - **Owner:** Full-stack Team  
  - **Estimate:** 1 day  
  - **Priority:** CRITICAL

**Total Estimate:** 1 day

---

## 🔥 HIGH PRIORITY (Should Complete Before Launch)

### Assets (2 items)

- [ ] **Persona Sprite Sheets**
  - [ ] Commission pixel artist OR source existing assets
  - [ ] Male idle sprite (128×48px, 4 frames)
  - [ ] Male walk sprite (192×48px, 6 frames)
  - [ ] Female idle sprite (128×48px, 4 frames)
  - [ ] Female walk sprite (192×48px, 6 frames)
  - [ ] Verify transparency and frame layout
  - [ ] Place in `public/assets/persona/` directory
  - [ ] Test: Load map, verify sprites render correctly
  - [ ] Remove placeholder generation code (optional)
  - **Owner:** Design Team + Asset Coordinator  
  - **Estimate:** 3-5 days (external dependency)  
  - **Cost:** $200-500  
  - **Priority:** HIGH

- [ ] **Audio Assets**
  - [ ] Commission audio designer OR source royalty-free audio
  - [ ] 16 ambient loops (8 biomes × MP3/OGG)
  - [ ] 12 checkpoint crossing SFX
  - [ ] 6 progression sounds (level-up + 5 badge rarities)
  - [ ] 4 UI sounds (click, confirm, error, hover)
  - [ ] 11 music tracks (3 boss + 8 stage themes)
  - [ ] Verify all files are loop-friendly where required
  - [ ] Normalize audio levels
  - [ ] Place in `public/audio/` subdirectories
  - [ ] Test: Play through entire game, verify all audio triggers
  - **Owner:** Design Team + Asset Coordinator  
  - **Estimate:** 1-2 weeks (external dependency)  
  - **Cost:** $500-1,500 (or $0 if royalty-free)  
  - **Priority:** HIGH

**Total Estimate:** 1-2 weeks (external dependencies)

---

### Missing Animations (4 items)

- [ ] **Seal Break Animation**
  - [ ] Create `src/lib/phaser/animations/SealBreakAnimation.ts`
  - [ ] Standard variant: Seal cracks and shatters (1.5-2s)
  - [ ] Gold variant: Seal explodes in gold particles (2.5-3.5s)
  - [ ] Add gold crown placement on node
  - [ ] Wire audio: crack SFX → gate creak → flash
  - [ ] Test on Stage 3 (Validation) and Stage 8 (Scale)
  - **Owner:** Game Engine Team  
  - **Estimate:** 0.5 day  
  - **Priority:** HIGH

- [ ] **Rune Inscription Animation**
  - [ ] Create `src/lib/phaser/animations/RuneInscriptionAnimation.ts`
  - [ ] Standard variant: 2 of 3 rune lines inscribe (1.5-2s)
  - [ ] Gold variant: All 3 lines complete, tablet rises (2.5-3.5s)
  - [ ] Wire audio: ink fill → glow pulse → stone rumble
  - [ ] Test on Stage 4 (Offer Design)
  - **Owner:** Game Engine Team  
  - **Estimate:** 0.5 day  
  - **Priority:** HIGH

- [ ] **Bridge Repair Animation**
  - [ ] Create `src/lib/phaser/animations/BridgeRepairAnimation.ts`
  - [ ] Standard variant: Bridge assembles plank by plank (1.5-2s)
  - [ ] Gold variant: Upgrades to marble, gilded chain (2.5-3.5s)
  - [ ] Persona walk animation during crossing
  - [ ] Wire audio: build SFX → settle → footsteps
  - [ ] Test on Stage 5 (Build & Deliver)
  - **Owner:** Game Engine Team  
  - **Estimate:** 0.5 day  
  - **Priority:** HIGH

- [ ] **Ward Placement Animation**
  - [ ] Create `src/lib/phaser/animations/WardPlacementAnimation.ts`
  - [ ] Standard variant: Ward stone planted (1.5-2s)
  - [ ] Gold variant: Second ward stone appears (2.5-3.5s)
  - [ ] Party boundary expansion effect
  - [ ] Wire audio: plant SFX → glow spread → hum
  - [ ] Test on Stage 6 (Launch)
  - **Owner:** Game Engine Team  
  - **Estimate:** 0.5 day  
  - **Priority:** HIGH

**Total Estimate:** 2 days

---

### Bug Fixes & Polish (5 items)

- [ ] **Fix Persona Walk Animation During Stage Transition**
  - [ ] Trigger walk animation when stage transition starts
  - [ ] Sync walk animation with camera scroll (800ms)
  - [ ] Persona arrives at next checkpoint as camera stops
  - [ ] Switch to idle animation when arrived
  - **File:** `src/lib/phaser/scenes/WorldMapScene.ts` Lines 515-541
  - **Owner:** Game Engine Team  
  - **Estimate:** 0.25 day  
  - **Priority:** HIGH

- [ ] **Fix XP Overflow Handling (Multi-level Progression)**
  - [ ] Calculate XP remainder after level-up
  - [ ] Recursively check if remainder triggers another level-up
  - [ ] Chain level-up animations
  - [ ] Continue until all XP consumed
  - [ ] Test: Award 500 XP when threshold is 200 (should level twice)
  - **File:** `src/app/map/world/page.tsx` Lines 986-1005
  - **Owner:** Frontend Team  
  - **Estimate:** 0.5 day  
  - **Priority:** HIGH

- [ ] **Create Unified Contribution Modal**
  - [ ] Create `src/components/venture/ContributionModal.tsx`
  - [ ] Rich text editor with word count display
  - [ ] Audio/video recorder
  - [ ] Image uploader
  - [ ] File uploader (PDF, PPT, XLS, DOC)
  - [ ] 50-word minimum validation for text
  - [ ] Submit button blocked until requirements met
  - [ ] Wire to checkpoint advance flow
  - **Owner:** Frontend Team  
  - **Estimate:** 1 day  
  - **Priority:** HIGH

- [ ] **Fix Badge Animation Triggering**
  - [ ] Debug badge queue logic
  - [ ] Ensure new badges are added to queue
  - [ ] Verify BadgeAwardSequence component receives queue
  - [ ] Test: Earn badge, verify animation plays
  - **File:** `src/app/map/world/page.tsx` Lines 901-965
  - **Owner:** Frontend Team  
  - **Estimate:** 0.25 day  
  - **Priority:** HIGH

- [ ] **Move Persona Selection to Venture Creation**
  - [ ] Add persona selection step in venture creation flow
  - [ ] Remove persona selection from `/map` route
  - [ ] Store selected persona with venture on creation
  - [ ] Test: Create venture, select persona, arrive at map with correct sprite
  - **Files:** `src/app/project/new` + `src/app/map/page.tsx`
  - **Owner:** Frontend Team  
  - **Estimate:** 0.5 day  
  - **Priority:** MODERATE

**Total Estimate:** 2.5 days

---

## ⚠️ MODERATE PRIORITY (Nice to Have)

### Boss System Polish (2 items)

- [ ] **Complete Mini-Boss Custom Visuals**
  - [ ] Design custom visuals for bosses 3-8:
    - [ ] Advocate of Comfortable Lies (Stage 3)
    - [ ] Unfinished Golem (Stage 4)
    - [ ] Collapse Specter (Stage 5)
    - [ ] Harbourmaster of Hesitation (Stage 6)
    - [ ] Babel Merchant (Stage 7)
    - [ ] Iron Bureaucrat (Stage 8)
  - [ ] Implement drawing methods in MiniBoss.ts
  - [ ] Add per-boss weakening effects
  - [ ] Test: Play through all stages, verify boss visuals
  - **File:** `src/lib/phaser/entities/MiniBoss.ts`
  - **Owner:** Game Engine Team + Artist  
  - **Estimate:** 1-2 weeks  
  - **Priority:** MODERATE

- [ ] **Implement Super Boss State Transitions**
  - [ ] Stage 5 entered: Opacity 15% → 50%
  - [ ] Stage 7 entered: Opacity 50% → 100%, idle animation
  - [ ] All stages complete: Trigger slay animation
  - [ ] Build 3 unique slay animations (one per boss)
  - [ ] Build 1 standardized retreat animation
  - [ ] Test: Play through to final stage
  - **File:** `src/lib/phaser/entities/Boss.ts`
  - **Owner:** Game Engine Team  
  - **Estimate:** 1 week  
  - **Priority:** MODERATE

**Total Estimate:** 2-3 weeks

---

### Social Integration (2 items)

- [ ] **Add Gold Checkpoint Notification Popup**
  - [ ] Create notification listener in map page
  - [ ] Display popup when gold checkpoint earned
  - [ ] Show venture name, stage, checkpoint
  - [ ] Auto-dismiss after 4 seconds
  - [ ] Test: Complete gold checkpoint, verify popup
  - **File:** `src/app/map/world/page.tsx`
  - **Owner:** Frontend Team  
  - **Estimate:** 0.5 day  
  - **Priority:** MODERATE

- [ ] **Add Stage Completion Feed Post**
  - [ ] Verify backend creates feed post (already implemented)
  - [ ] Ensure feed displays stage completion cards
  - [ ] Test: Complete stage, check feed
  - **Owner:** Frontend Team  
  - **Estimate:** 0.25 day  
  - **Priority:** MODERATE

**Total Estimate:** 0.75 day

---

## 🧪 TESTING CHECKLIST

### End-to-End User Journey (Complete This Before Launch)

- [ ] **Onboarding Flow**
  - [ ] User signs up
  - [ ] User completes profile setup
  - [ ] User creates an idea
  - [ ] User converts idea to venture
  - [ ] User selects persona sprite
  - [ ] Map loads with Stage 1 Checkpoint 1 active

- [ ] **Task Submission Flow**
  - [ ] User clicks active checkpoint
  - [ ] Checkpoint panel opens
  - [ ] User clicks task card
  - [ ] Tool modal opens
  - [ ] User completes tool requirements
  - [ ] Submit button enables
  - [ ] User submits
  - [ ] Task marked complete
  - [ ] AI scoring runs (verify in logs)
  - [ ] Valuation Score updates

- [ ] **Checkpoint Advancement Flow**
  - [ ] User completes 2 of 3 tasks
  - [ ] Advance button appears
  - [ ] User clicks Advance
  - [ ] Contribution modal opens
  - [ ] User submits contribution (50+ words)
  - [ ] Checkpoint crossing animation plays
  - [ ] Next checkpoint becomes active
  - [ ] Persona moves to new checkpoint
  - [ ] XP bar fills
  - [ ] Points awarded correctly

- [ ] **Stage Completion Flow**
  - [ ] User completes final checkpoint of stage
  - [ ] Mini-boss slay/retreat animation plays
  - [ ] Camera scrolls to next biome
  - [ ] Persona walks during scroll
  - [ ] New stage becomes active
  - [ ] Stage brightness resets
  - [ ] Accumulated brightness increases

- [ ] **Progression System**
  - [ ] XP bar fills on task completion
  - [ ] Level-up animation triggers at threshold
  - [ ] Level number updates in HUD
  - [ ] Badge earned triggers badge animation
  - [ ] Badge appears in profile

- [ ] **Audio System**
  - [ ] Biome ambient loops play
  - [ ] Crossfade between biomes on stage transition
  - [ ] Checkpoint crossing SFX play
  - [ ] Level-up fanfare plays
  - [ ] Badge award SFX play
  - [ ] UI sounds play on interactions
  - [ ] Volume controls work
  - [ ] Mute toggle works
  - [ ] Settings persist in localStorage

- [ ] **Real-time Collaboration**
  - [ ] User A completes task
  - [ ] User B (collaborator) sees update in real-time
  - [ ] Gold checkpoint creates feed notification
  - [ ] Stage completion creates feed post
  - [ ] Both users' maps stay in sync

- [ ] **All 11 Tools Work**
  - [ ] Write tool (50-word minimum enforced)
  - [ ] Upload tool (all formats accepted)
  - [ ] Table tool (2+ rows required)
  - [ ] Map/Canvas tool (shapes, arrows, post-its)
  - [ ] Survey tool (create, distribute, collect)
  - [ ] Poll tool (2-4 options, broadcast)
  - [ ] Link tool (URL + annotation required)
  - [ ] Self-report tool (confirmation checkbox)
  - [ ] Journal tool (selective share toggle)
  - [ ] Kanban tool (drag-and-drop working)
  - [ ] Calendar tool (events + milestones)

---

## 🚀 PRE-LAUNCH CHECKLIST

### Technical (10 items)

- [ ] All TypeScript errors resolved (run `npm run build`)
- [ ] All tests passing (run `npm run test`)
- [ ] No console errors on happy path
- [ ] Loading states implemented for all async operations
- [ ] Error states implemented for all failure cases
- [ ] Empty states implemented for all lists
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Performance audit (Lighthouse score > 80)
- [ ] Bundle size under 500KB gzipped

### Security (5 items)

- [ ] Environment variables configured in production
- [ ] API keys rotated for production
- [ ] File upload size limits enforced
- [ ] Rate limiting configured (or Convex defaults acceptable)
- [ ] No sensitive data logged to console

### Content (3 items)

- [ ] All placeholder text replaced with final copy
- [ ] All images have alt text
- [ ] 404 page implemented

### Deployment (5 items)

- [ ] Production build succeeds
- [ ] Deployed to staging environment
- [ ] Staging tested by QA team
- [ ] Production environment variables set
- [ ] Rollback plan documented

---

## 📊 PROGRESS TRACKER

### Week 1: Critical Fixes
**Target:** Complete all blockers  
**Status:** Not Started

- [ ] Day 1: Calendar Tool
- [ ] Day 2: Kanban + Map/Canvas Tools
- [ ] Day 3: Journal + Self-report Tools
- [ ] Day 4: AI Scoring Integration
- [ ] Day 5: XP Overflow + Contribution Modal

**Milestone:** All critical functionality working

---

### Week 2: Assets & Polish
**Target:** Replace placeholders  
**Status:** Not Started

- [ ] Day 6-7: Receive persona sprites
- [ ] Day 8: Build missing animations
- [ ] Day 9: Build missing animations
- [ ] Day 10: Integration + testing

**Milestone:** Beta-ready with temporary audio

---

### Week 3: Audio & Launch
**Target:** Production-ready  
**Status:** Not Started

- [ ] Day 11-13: Receive audio assets
- [ ] Day 14: Audio integration + testing
- [ ] Day 15: Production deployment

**Milestone:** v1.0 SHIPPED ✅

---

## ✅ DEFINITION OF DONE

Production is ready when:

1. ✅ All 6 critical blockers resolved
2. ✅ All 11 tools complete and tested
3. ✅ AI scoring connected and working
4. ✅ All 6 checkpoint animations built
5. ✅ Persona sprites replaced (or documented as placeholders)
6. ✅ Audio assets integrated (or documented as silent)
7. ✅ End-to-end user journey tested and passing
8. ✅ No critical bugs in issue tracker
9. ✅ Security audit passed
10. ✅ Deployment successful on staging

**Current Status:** 0/10 ❌  
**Target Date:** 3 weeks from today  
**Go/No-Go Decision:** Based on this checklist completion

---

**Last Updated:** April 21, 2024  
**Next Review:** Weekly (every Monday)