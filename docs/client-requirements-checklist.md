# Client Requirements Checklist — REVISED
**What Developers Actually Need from Client Based on Current Implementation**

*Updated after Codebase Verification — April 2026*

---

## ⚠️ IMPORTANT: Read This First

This checklist has been **revised based on actual codebase analysis**. The original checklist assumed features (Phaser game engine, audio system, AI scoring) that are **NOT currently implemented**.

**Current State**: The codebase has a fully functional React-based web application with:
- Complete 8-stage venture system (36 checkpoints, 108 tasks)
- 62-badge achievement system
- 50-level XP progression
- 9 working tools (Write, Table, Map, Survey, Poll, Link, Upload, OAuth, Self-Report)
- Real-time chat and notifications
- Contribution/collaboration system

**What's Missing**: Visual game rendering (Phaser), audio system (Howler.js), AI scoring integration.

---

## Critical Decision Required Before Proceeding

**The client must decide V1 scope:**

### Option A: React Web App (Current Implementation)
- Timeline: 4-6 weeks to polish and launch
- Assets needed: Minimal (legal docs, monitoring setup)
- Cost: Low
- Risk: Low

### Option B: Visual 2D Game (Requires New Development)
- Timeline: 8-12 weeks additional development
- Assets needed: Extensive (sprites, backgrounds, animations, audio)
- Cost: High (asset production + development)
- Risk: Medium-High

**This checklist assumes Option A unless client confirms Option B.**

---

## Overview

Items are organized by priority level:

**Critical**: Blocks launch if not provided
**High**: Causes delays if not provided on time
**Medium**: Can work around temporarily with placeholders
**Conditional**: Only needed if specific features are confirmed for V1

---

## 1. Design Assets

### ✅ NO VISUAL ASSETS NEEDED FOR CURRENT IMPLEMENTATION

**Status**: The current React-based implementation uses:
- Lucide icons for badges (no custom sprites needed)
- Radix UI Progress components for XP/level display
- Tailwind CSS for styling
- Text-based boss encounter cards

**Client Action**: NONE required unless visual game rendering (Phaser) is confirmed for V1.

---

### 🔄 CONDITIONAL: Only if Visual Game Rendering (Phaser) is Confirmed for V1

**⚠️ WARNING**: These assets cannot be used until Phaser integration is complete (2-3 weeks of development). Do not commission these assets until technical foundation is built.

**If Phaser is confirmed, the following will be needed:**

<details>
<summary>Click to expand: Visual Game Assets (Phaser Only)</summary>

**Checkpoint Node Sprites** (After Phaser integration)
- Format: PNG with transparency
- Size: 64×64px per sprite
- Quantity: 4 sprites (locked, active, standard-complete, gold-complete)
- Alternative: CSS/SVG indicators work for React UI

**Persona Sprite Sheets** (After Phaser integration)
- Format: PNG sprite sheets
- Size: 32×48px per frame
- Quantity: 2 sheets (male/female)
- Alternative: Use existing user avatar system

**Boss Silhouettes** (After Phaser integration)
- Format: PNG with transparency
- Size: 256×256px
- Quantity: 11 total (3 Super Bosses + 8 mini-bosses)
- Alternative: Current text-based boss cards are functional

**Biome Backgrounds** (After Phaser integration)
- Format: PNG
- Size: 2048×512px per background
- Quantity: 8 backgrounds
- Alternative: Not needed for React UI

**Checkpoint Animation Assets** (After Phaser integration)
- Format: PNG sprite sheets
- Quantity: 12 animations (6 patterns × 2 variants)
- Alternative: Use Framer Motion or CSS animations in React

**Particle Effects** (After Phaser integration)
- Format: PNG sprite sheets
- Quantity: 5 particle types
- Alternative: Use Framer Motion or CSS animations in React

</details>

---

### 🔄 CONDITIONAL: Only if Audio System is Confirmed for V1

**⚠️ WARNING**: No audio system currently exists. Howler.js integration required first (1 week of development). Audio production is expensive—confirm priority before commissioning.

**Current State**: Application is completely silent. No audio controls, no Howler.js integration.

**If audio is confirmed, the following will be needed:**

<details>
<summary>Click to expand: Audio Assets (Requires Howler.js Integration)</summary>

**Audio Assets** (42 files × 2 formats = 84 total files)
- 8 biome ambient loops (MP3 + OGG)
- 12 checkpoint SFX (MP3 + OGG)
- 3 Super Boss entrance themes (MP3 + OGG)
- 8 mini-boss stage themes (MP3 + OGG)
- 6 progression SFX (MP3 + OGG)
- 4 UI action SFX (MP3 + OGG)

**Estimated Cost**: $5,000-$15,000 for professional audio production
**Timeline**: 3-4 weeks for audio production after commissioning

</details>

---

## 2. API Keys & Credentials

### ✅ ALREADY CONFIGURED

**Convex Deployment**
- Status: ✅ Configured in `.env.local`
- Evidence: Database queries work, real-time subscriptions active
- Client Action: NONE required

**Clerk Authentication**
- Status: ✅ Configured with production keys
- Evidence: Sign-in/sign-up flows work, Google OAuth functional
- Client Action: NONE required

---

### 🔄 CONDITIONAL: Only if AI Scoring is Confirmed for V1

**⚠️ WARNING**: No AI integration currently exists in codebase. Current system uses fixed point values from `POINT_VALUES` constants. AI scoring requires 1-2 weeks of development (prompt engineering, testing, calibration).

**Current State**: 
- Points awarded based on fixed values (create_idea: 50, spark: 1-3, comment: 1-3, etc.)
- No AI model calls
- No quality scoring logic
- Package.json has `@google/generative-ai` but no implementation

**If AI scoring is confirmed, the following will be needed:**

<details>
<summary>Click to expand: AI API Keys (Requires AI Integration Development)</summary>

**Option 1: OpenAI (Recommended for Pro Tier)**
- API Key for GPT-4
- Estimated usage: ~1000 requests/day initially
- Estimated cost: $100-300/month
- Required permissions: Chat completions

**Option 2: Replicate (Recommended for Free Tier)**
- API Key for Llama 3 / Mistral
- Estimated usage: ~5000 requests/day initially
- Estimated cost: $50-150/month
- Required permissions: Model inference

**Option 3: Google Generative AI (Already in package.json)**
- API Key for Gemini
- May be preferred if already using Google Cloud
- Estimated cost: Similar to OpenAI

**Deliverable format**: Secure credential sharing (1Password, LastPass, or encrypted email)

**Environment Variables Needed**:
```bash
# Choose based on AI provider decision
OPENAI_API_KEY=sk-...
# OR
REPLICATE_API_KEY=r8_...
# OR
GOOGLE_AI_API_KEY=...
```

</details>

---

## 3. Content & Copy

### ✅ ALREADY DEFINED IN CODEBASE — REVIEW REQUIRED

**Checkpoint Task Content** — HIGH PRIORITY
- Status: ✅ FULLY DEFINED in `convex/ventureConstants.ts`
- Content: All 36 checkpoints × 3 tasks = 108 tasks with prompts, outcomes, tool assignments
- File Location: `convex/ventureConstants.ts` (lines 1-800+)
- **Client Action**: REVIEW AND APPROVE existing content in codebase
- **Alternative**: Provide annotated changes if modifications needed
- **Note**: Content is already live in production database

**Badge Content** — HIGH PRIORITY
- Status: ✅ FULLY DEFINED in `convex/ventureConstants.ts`
- Content: All 62 badges with names, descriptions, icons (Lucide), categories, criteria
- File Location: `convex/ventureConstants.ts` (BADGE_DEFINITIONS)
- **Client Action**: REVIEW AND APPROVE existing content
- **Note**: Only 5 badges currently seeded in database; remaining 57 need seeding

**Level Content** — MEDIUM PRIORITY
- Status: ✅ FULLY DEFINED in `convex/ventureConstants.ts`
- Content: 50 levels with XP thresholds, exponential scaling formula
- File Location: `convex/gamification.ts` (calculateLevelFromXP function)
- **Client Action**: REVIEW AND APPROVE existing progression curve

**Monster/Boss Lore** — MEDIUM PRIORITY
- Status: ✅ FULLY DEFINED in `convex/ventureConstants.ts`
- Content: 12 bosses with names, types, corruption descriptions, defeat methods
- File Location: `convex/ventureConstants.ts` (BOSS_DEFINITIONS)
- **Client Action**: REVIEW AND APPROVE existing lore

**Stage Names** — HIGH PRIORITY
- Status: ✅ DEFINED in `convex/ventureConstants.ts`
- Current Names: Ideation, Research, Validation, Design, Development, Launch, Iteration, Scale
- **Client Action**: CONFIRM these are final names or request changes

**Deliverable format**: Email approval or Google Doc with requested changes

---

### ❌ NOT NEEDED FOR CURRENT IMPLEMENTATION

**Biome Descriptions**
- Status: NOT APPLICABLE - No biome/world map system implemented
- Recommendation: DEFER until visual game rendering is confirmed

**HUD Label Copy**
- Status: NOT APPLICABLE - No unified HUD exists
- Current: Individual components (XP bar, level display, streak counter) have their own labels
- Recommendation: Audit existing component labels if needed

---

### 📝 RECOMMENDED: Tooltip Audit

**Existing Component Tooltips** — MEDIUM PRIORITY
- Status: PARTIALLY DEFINED - Some components have tooltips, others don't
- **Client Action**: Review existing UI and identify where tooltips are missing or unclear
- Components to audit:
  - Badge grid (`src/components/badges/badge-grid.tsx`)
  - Level progress (`src/components/gamification/LevelProgress.tsx`)
  - Streak indicator (`src/components/gamification/StreakIndicator.tsx`)
  - Boss encounter cards (`src/components/venture/boss-encounter.tsx`)
  - Checkpoint progress displays

**Deliverable format**: Google Doc with tooltip text for components needing clarification

---

## 4. Business & Product Decisions

### 🚨 CRITICAL — NEEDED IMMEDIATELY

**V1 Scope Clarification** — BLOCKS ALL PLANNING
- **Decision Required**: Is V1 a React web app OR a visual 2D game?
- **Current State**: Codebase is React web app with game mechanics (data-driven)
- **Impact**: Determines timeline (4-6 weeks vs 8-12 weeks) and budget
- **Questions to Answer**:
  1. Is Phaser game engine integration required for V1?
  2. Is audio system required for V1?
  3. Is AI scoring required for V1?
  4. Are Journal/Kanban/Calendar tools required for V1? (currently don't exist)

**Deliverable format**: Email or meeting to confirm V1 scope

---

**Pricing Tier Definition** — CRITICAL
- **Current State**: No tier restrictions in codebase; all features available to all users
- **Decision Required**: Define Free vs Explorer Pro feature split
- **Questions to Answer**:
  1. What features are Free vs Pro?
  2. Monthly/annual pricing for Explorer Pro?
  3. Trial period duration?
  4. Payment provider (Stripe, Paddle, etc.)?
- **Blocker**: Cannot implement paywalls or AI model allocation without tier definition

**Deliverable format**: Product spec document or pricing strategy doc

---

**Legal Documents** — CRITICAL (BLOCKS LAUNCH)
- **Status**: NOT IMPLEMENTED - No ToS or Privacy Policy pages exist
- **Required Before Launch**:
  1. Terms of Service
  2. Privacy Policy
  3. Cookie Policy (if applicable)
  4. Content Moderation Policy
- **Recommendation**: Engage legal counsel immediately
- **Timeline**: Legal review typically takes 2-4 weeks

**Deliverable format**: Legal documents (PDF or Google Docs) + hosting location

---

### 📋 HIGH PRIORITY — NEEDED WITHIN 2 WEEKS

**Feature Flag System** — HIGH
- **Status**: NOT IMPLEMENTED - No feature flags table in schema
- **Decision Required**: Rollout strategy for new features
- **Recommendation**: Add `featureFlags` table to `convex/schema.ts`
- **Suggested Rollout**:
  - Initial: 5% of users
  - Week 2: 25% of users
  - Week 3: 50% of users
  - Week 4: 100% of users
- **Rollback Criteria**: Define error rate threshold, user complaint threshold

**Deliverable format**: Email confirmation of rollout strategy

---

**Community Notification Rules** — HIGH
- **Status**: PARTIALLY IMPLEMENTED - 50+ notification types exist, but no gold checkpoint trigger
- **Decision Required**:
  1. Should gold checkpoint completion trigger community feed notification?
  2. Notification visibility: public vs followers only?
  3. Opt-out options for users?
- **Recommendation**: Add "gold_checkpoint_completed" notification type

**Deliverable format**: Email or product spec document

---

**Contribution Requirements** — MEDIUM
- **Status**: IMPLEMENTED - Contribution requests and invitations work
- **Current State**: No minimum word count enforcement
- **Decision Required**:
  1. Minimum word count for text contributions? (suggested: 50 words)
  2. Accepted file types for uploads? (currently: PDF, PPT, XLS, DOC)
  3. Image/video size limits?
  4. Plagiarism detection needed?

**Deliverable format**: Email confirmation

---

### 🔄 CONDITIONAL — Only if Features Are Confirmed for V1

**Animation Skip Rules** — CONDITIONAL
- **Status**: NOT APPLICABLE - No animations currently exist
- **Decision Required** (if animations are built):
  1. Which animations can be skipped and when?
  2. Can users disable animations entirely (accessibility)?
- **Recommendation**: Define rules only if animations are implemented

---

**AI Scoring Calibration** — CONDITIONAL
- **Status**: NOT APPLICABLE - No AI scoring system exists
- **Decision Required** (if AI scoring is built):
  1. Quality score distribution targets (Low/Standard/High percentages)
  2. Should targets differ between Free and Pro tiers?
  3. Show AI feedback to users or just score?
- **Recommendation**: Define targets only if AI scoring is V1 priority

---

**Additional Tools** — CONDITIONAL
- **Status**: Journal, Kanban, Calendar tools DO NOT EXIST in codebase
- **Current**: Only 9 tools implemented (Write, Table, Map, Survey, Poll, Link, Upload, OAuth, Self-Report)
- **Decision Required**: Are these 3 tools required for V1?
- **Timeline**: 1-2 weeks development per tool
- **Recommendation**: Defer to post-V1 unless critical

---

## 5. Technical Infrastructure

### ✅ ALREADY CONFIGURED

**Convex Deployment**
- Production: ✅ Configured and working
- Staging: ✅ Assumed same deployment (confirm if separate needed)
- Backup: ✅ Convex handles automatic backups
- Client Action: NONE required

**Clerk Authentication**
- Production keys: ✅ Configured
- Sign-in/sign-up flows: ✅ Working
- Social auth: ✅ Google OAuth configured
- Client Action: NONE required

**Convex Storage**
- Status: ✅ Configured for file uploads (PDFs, images, documents)
- Current: Handles all user-uploaded files
- Client Action: NONE required

---

### 🚨 CRITICAL — NEEDED BEFORE LAUNCH

**Performance Monitoring** — CRITICAL
- **Status**: NOT CONFIGURED - No error tracking or analytics
- **Required Tools**:
  1. Vercel Analytics (built-in, easy to enable)
  2. Sentry for error tracking
  3. Optional: PostHog or Mixpanel for product analytics
- **Performance Targets to Confirm**:
  - Desktop: 60 FPS minimum (if game rendering)
  - Mobile: 30 FPS minimum (if game rendering)
  - Page load: <3 seconds
  - Time to Interactive: <5 seconds
- **Action Required**: Set up monitoring tools and provide API keys

**Deliverable format**: API keys for Sentry + confirmation of analytics tool choice

---

### 📋 MEDIUM PRIORITY

**CDN for Assets** — MEDIUM (OPTIONAL)
- **Status**: NOT CONFIGURED - Currently using Convex Storage
- **Current State**: Convex Storage handles all file uploads and serving
- **Question**: Is separate CDN needed or is Convex Storage sufficient?
- **Recommendation**: Convex Storage is adequate for V1; defer CDN to post-V1
- **Only needed if**: Expecting very high traffic (10k+ concurrent users) or serving large media files

**Deliverable format**: Decision on whether CDN is needed for V1

---

## 6. Testing & QA Support

### 📋 HIGH PRIORITY — NEEDED WITHIN 2 WEEKS

**Test Accounts** — HIGH
- **Status**: Can create via sign-up flow, but need pre-populated data
- **Action Required**: Client should create 5-10 test accounts with various states:
  1. New user (no progress)
  2. Mid-progress user (Stage 3-4, some badges)
  3. Advanced user (Stage 7-8, many badges, high level)
  4. Pro tier user (if tiers are implemented)
  5. User with multiple ventures
  6. User with active collaborations
  7. User with chat history
- **Deliverable format**: Spreadsheet with test account credentials (email/password)

---

**Test Devices** — HIGH
- **Action Required**: Confirm available devices for testing
- **Critical Platforms**:
  - Desktop: Windows, Mac, Linux
  - Mobile: iOS (which versions?), Android (which versions?)
  - Tablets: iPad, Android tablets
- **Browsers to Test**:
  - Chrome, Firefox, Safari, Edge
  - Mobile browsers: Safari iOS, Chrome Android
- **Deliverable format**: List of available test devices and OS versions

---

**Bug Tracking System** — HIGH
- **Status**: NOT CONFIGURED - No bug tracker set up
- **Action Required**: Choose and set up bug tracking tool
- **Options**:
  - Linear (recommended for startups)
  - GitHub Issues (free, integrated with code)
  - Jira (enterprise-grade)
- **Define Bug Priority Levels**:
  - P0: Critical (blocks launch, data loss, security)
  - P1: High (major feature broken, affects many users)
  - P2: Medium (minor feature broken, workaround exists)
  - P3: Low (cosmetic, nice-to-have)
- **Deliverable format**: Bug tracker access + priority definitions document

---

### 📋 MEDIUM PRIORITY — NEEDED BEFORE LAUNCH

**User Acceptance Testing (UAT)** — MEDIUM
- **Status**: NOT PLANNED - No UAT plan exists
- **Action Required**: Define UAT plan
- **Questions to Answer**:
  1. Who are UAT participants? (internal team, beta users, friends/family?)
  2. How many participants? (recommended: 10-20)
  3. UAT timeline? (recommended: 1-2 weeks)
  4. Feedback collection method? (Google Form, Typeform, Slack, email?)
  5. Success criteria? (what needs to work before launch?)
- **Deliverable format**: UAT plan document with participant list and timeline

---

**GDPR/Data Privacy Compliance** — MEDIUM (CRITICAL FOR EU LAUNCH)
- **Status**: NOT IMPLEMENTED - No data export/deletion features
- **Required for GDPR Compliance**:
  1. User data export functionality (download all my data)
  2. User data deletion functionality (delete my account)
  3. Cookie consent banner (if using analytics cookies)
  4. Data retention policies
  5. Privacy policy (see Legal section)
- **Timeline**: 1-2 weeks development for export/deletion features
- **Recommendation**: Implement before EU launch; can defer if US-only initially

**Deliverable format**: Compliance requirements document

---

## 7. Legal & Compliance

### 🚨 CRITICAL — BLOCKS LAUNCH

**Terms of Service** — CRITICAL
- **Status**: NOT IMPLEMENTED - No ToS page exists
- **Required Before Launch**: Cannot launch without ToS
- **Action Required**: Engage legal counsel to draft ToS
- **Timeline**: 2-4 weeks for legal review
- **Must Cover**:
  - User rights and responsibilities
  - Intellectual property (who owns user-generated content?)
  - Liability limitations
  - Dispute resolution
  - Account termination conditions
- **Deliverable format**: Legal document (PDF or Google Doc) + hosting location

---

**Privacy Policy** — CRITICAL
- **Status**: NOT IMPLEMENTED - No Privacy Policy page exists
- **Required Before Launch**: Legally required in most jurisdictions
- **Action Required**: Engage legal counsel to draft Privacy Policy
- **Timeline**: 2-4 weeks for legal review
- **Must Cover**:
  - What data is collected
  - How data is used
  - Data sharing with third parties (Convex, Clerk, analytics)
  - User rights (access, deletion, export)
  - Cookie usage
  - International data transfers
- **Deliverable format**: Legal document (PDF or Google Doc) + hosting location

---

**Content Moderation Policy** — CRITICAL
- **Status**: NOT IMPLEMENTED - No moderation tools or policies
- **Current State**: User-generated content (ideas, comments, chat) has no moderation
- **Action Required**: Define moderation rules and implement flagging mechanism
- **Questions to Answer**:
  1. What content is prohibited? (hate speech, spam, illegal content, etc.)
  2. How do users report inappropriate content?
  3. Who reviews reports? (internal team, automated, third-party?)
  4. What are the consequences? (warning, content removal, account suspension, ban?)
  5. Appeal process?
- **Timeline**: 1 week for policy definition, 1-2 weeks for implementation
- **Deliverable format**: Moderation policy document + implementation plan

---

**Cookie Consent** — HIGH (REQUIRED FOR EU)
- **Status**: NOT IMPLEMENTED - No cookie consent banner
- **Required If**: Using analytics cookies (Google Analytics, Mixpanel, etc.)
- **Not Required If**: Only using essential cookies (authentication)
- **Action Required**: Implement cookie consent banner if using analytics
- **Recommendation**: Use cookie consent library (e.g., CookieYes, Osano)
- **Deliverable format**: Confirmation of cookie usage + consent implementation

---

**GDPR Compliance** — HIGH (REQUIRED FOR EU USERS)
- **Status**: PARTIALLY COMPLIANT - Auth system exists, but no data export/deletion
- **Required for GDPR**:
  1. ✅ Privacy Policy (see above)
  2. ✅ User consent for data collection (Clerk handles this)
  3. ❌ Data export functionality (download all my data)
  4. ❌ Data deletion functionality (right to be forgotten)
  5. ❌ Data retention policies
  6. ❌ Data breach notification procedures
- **Timeline**: 1-2 weeks for data export/deletion features
- **Recommendation**: Implement before EU launch; can defer if US-only initially
- **Deliverable format**: GDPR compliance checklist + implementation plan

---

## 8. Post-Launch Support

### 📋 HIGH PRIORITY — NEEDED BEFORE LAUNCH

**Launch Date** — HIGH
- **Action Required**: Confirm target launch date
- **Considerations**:
  - Legal documents ready? (ToS, Privacy Policy)
  - Monitoring tools configured? (Sentry, analytics)
  - UAT completed?
  - Bug tracker set up?
  - Support team trained?
- **Recommendation**: Soft launch (invite-only) before public launch
- **Deliverable format**: Email confirmation of launch date

---

**Launch Communication Plan** — HIGH
- **Action Required**: Define launch strategy
- **Questions to Answer**:
  1. Launch announcement channels? (email, social media, Product Hunt, etc.)
  2. Launch messaging and copy?
  3. Target audience for initial launch?
  4. Press/media outreach?
  5. Influencer partnerships?
- **Deliverable format**: Launch plan document with timeline and messaging

---

**Support Team Availability** — HIGH
- **Action Required**: Confirm support coverage for launch week
- **Questions to Answer**:
  1. Who handles user support? (email, chat, social media?)
  2. Support hours? (24/7, business hours, specific timezone?)
  3. Response time SLA? (within 24 hours, within 1 hour?)
  4. Escalation process for critical issues?
- **Deliverable format**: Support plan document with team assignments

---

**Monitoring & Incident Response** — HIGH
- **Action Required**: Define incident response plan
- **Questions to Answer**:
  1. Who is on-call for launch week?
  2. Incident escalation process?
  3. Rollback procedure if critical issues arise?
  4. Communication plan for outages? (status page, social media?)
  5. Postmortem process?
- **Deliverable format**: Incident response plan + on-call schedule

---

### 📋 RECOMMENDED

**Soft Launch / Beta Testing** — RECOMMENDED
- **Recommendation**: Invite-only beta before public launch
- **Benefits**:
  - Test with real users in controlled environment
  - Gather feedback before public launch
  - Identify and fix critical bugs
  - Build early community of advocates
- **Suggested Timeline**:
  - Week 1-2: Closed beta (50-100 users)
  - Week 3-4: Open beta (500-1000 users)
  - Week 5+: Public launch
- **Deliverable format**: Beta testing plan with participant recruitment strategy

---

## Summary: What's Actually Needed for V1 Launch

### 🚨 CRITICAL PATH ITEMS (BLOCKS LAUNCH)

| Item | Priority | Timeline | Blocker |
|------|----------|----------|---------|
| V1 Scope Clarification | CRITICAL | Immediate | Blocks all planning |
| Terms of Service | CRITICAL | 2-4 weeks | Legal requirement |
| Privacy Policy | CRITICAL | 2-4 weeks | Legal requirement |
| Pricing Tier Definition | CRITICAL | 1 week | Blocks paywall implementation |
| Content Review & Approval | HIGH | 1 week | Content already in codebase |
| Performance Monitoring Setup | CRITICAL | 1 week | Needed for launch |
| Bug Tracking System | HIGH | 1 week | Needed for QA |
| Test Accounts | HIGH | 1 week | Needed for testing |

### ✅ ALREADY CONFIGURED (NO ACTION NEEDED)

- Convex deployment and database
- Clerk authentication
- Convex Storage for file uploads
- 8-stage venture system with 36 checkpoints
- 62-badge achievement system
- 50-level XP progression
- 9 working tools
- Real-time chat and notifications
- Contribution/collaboration system

### 🔄 CONDITIONAL (ONLY IF CONFIRMED FOR V1)

- Visual game assets (sprites, backgrounds, animations) — Only if Phaser is V1 requirement
- Audio assets (84 files) — Only if audio system is V1 requirement
- AI API keys — Only if AI scoring is V1 requirement
- Journal/Kanban/Calendar tools — Only if these tools are V1 requirements

### ⏭️ DEFERRED (POST-V1)

- CDN setup (Convex Storage sufficient for V1)
- Biome descriptions (no world map in current implementation)
- HUD label copy (no unified HUD in current implementation)
- Animation skip rules (no animations in current implementation)

---

## Revised Asset Delivery Checklist

### Week 1: Critical Decisions & Legal
- [ ] V1 scope clarification (React app vs visual game)
- [ ] Pricing tier definition (Free vs Pro features)
- [ ] Engage legal counsel for ToS and Privacy Policy
- [ ] Review checkpoint task content in `convex/ventureConstants.ts`
- [ ] Review badge content in `convex/ventureConstants.ts`
- [ ] Review level progression in `convex/gamification.ts`
- [ ] Review boss lore in `convex/ventureConstants.ts`
- [ ] Confirm stage names are final

### Week 2: Infrastructure & Testing
- [ ] Set up performance monitoring (Sentry + Vercel Analytics)
- [ ] Set up bug tracking system (Linear/Jira/GitHub Issues)
- [ ] Create 5-10 test accounts with various progress states
- [ ] Confirm available test devices (desktop, mobile, tablet)
- [ ] Define community notification rules
- [ ] Define contribution requirement rules
- [ ] Define feature flag rollout strategy

### Week 3: Compliance & QA
- [ ] Finalize Terms of Service
- [ ] Finalize Privacy Policy
- [ ] Define content moderation policy
- [ ] Implement cookie consent (if needed)
- [ ] Define UAT plan and recruit participants
- [ ] Define bug priority levels (P0/P1/P2/P3)
- [ ] Audit existing UI tooltips

### Week 4: Launch Preparation
- [ ] Complete UAT and address critical bugs
- [ ] Confirm launch date
- [ ] Define launch communication plan
- [ ] Define support team availability
- [ ] Define incident response plan and on-call schedule
- [ ] Implement GDPR data export/deletion (if EU launch)
- [ ] Seed remaining 57 badges in database

### Conditional (Only if Confirmed for V1)
- [ ] Commission visual game assets (if Phaser confirmed)
- [ ] Commission audio assets (if audio system confirmed)
- [ ] Provide AI API keys (if AI scoring confirmed)
- [ ] Develop Journal/Kanban/Calendar tools (if confirmed)

---

## Realistic Timeline Estimates

### Option A: React Web App (Current Implementation)
- Week 1-2: Content review, legal docs, infrastructure setup
- Week 3-4: Testing, bug fixes, compliance implementation
- Week 5-6: UAT, launch preparation
- **Total: 6-8 weeks to launch**

### Option B: Visual 2D Game (Requires New Development)
- Week 1-2: Phaser integration and world map rendering
- Week 3-4: Animation system and checkpoint animations
- Week 5-6: Audio system integration
- Week 7-8: AI scoring integration (if required)
- Week 9-10: Asset integration and polish
- Week 11-12: Testing and launch preparation
- **Total: 12-16 weeks to launch**

---

## Contact & Communication

**For V1 Scope Questions**: [Product Owner/Stakeholder]
**For Legal Questions**: [Legal Counsel]
**For Technical Questions**: [Development Team Lead]
**For Asset Production**: [Design Team Lead]

**Preferred Communication Channels**:
- Urgent (blocks development): Slack #urgent or phone
- High priority: Slack #dev-team or email
- Medium priority: Email or project management tool
- Low priority: Weekly sync meeting

---

## Next Steps

1. **Schedule Scoping Meeting** — Clarify V1 requirements (React app vs visual game)
2. **Engage Legal Counsel** — Begin ToS and Privacy Policy drafting
3. **Review Codebase Content** — Approve checkpoint tasks, badges, levels, bosses
4. **Set Up Infrastructure** — Performance monitoring, bug tracking, test accounts
5. **Define Business Rules** — Pricing tiers, feature flags, notification rules
6. **Plan Launch** — Timeline, communication, support, incident response

---

*This revised checklist is based on actual codebase analysis as of April 2026. It reflects what's truly needed for V1 launch based on current implementation, not aspirational features documented elsewhere.*
