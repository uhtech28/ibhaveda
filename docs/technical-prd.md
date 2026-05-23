    # Technical Product Requirements Document
    **Interactive Ideas Platform - Game Mechanics Implementation**

    **Version:** 1.0  
    **Date:** April 17, 2026  
    **Status:** Implementation Roadmap  
    **Target Audience:** Development Team

    ---

    ## Executive Summary

    This document provides a clear technical roadmap for implementing the Interactive Ideas game mechanics on top of the existing codebase. It outlines what's already built, what needs to be developed, and provides concrete deliverables, timelines, and milestones.

    ### Current State (Verified from Codebase)
    - **Framework:** Next.js 15.5.7 (App Router), React 19.1.0, TypeScript 5
    - **Database:** Convex (548-line schema, 28 core tables + gamification tables)
    - **Auth:** Clerk 6.31.6 with sign-in/sign-up modals
    - **Styling:** Tailwind CSS 4, Radix UI primitives, Dark mode with next-themes
    - **Animations:** Framer Motion 12.23.12 + Motion One (motion/react) installed
    - **File Storage:** Convex Storage (PDF, Excel, PowerPoint, Word, images)
    - **Real-time:** Convex subscriptions for chat, notifications, live updates
    - **Tools Implemented (9/11):** Write, Table, Map, Survey, Poll, Link, Upload, OAuth, Self-report
    - **Tools Missing:** Journal, Kanban (exists but not venture-integrated), Calendar (exists but not integrated)
    - **Testing:** Vitest (60+ passing tests)
    - **Build:** Turbopack configured

    #### Venture System (Single Template - Fully Functional)
    - **8 Stages:** Ideation → Research → Validation → Design → Development → Launch → Iteration → Scale
    - **36 Checkpoints:** 3 tasks each (T1 Easy, T2 Medium, T3 Stretch)
    - **Advancement:** 2/3 tasks required (standard), 3/3 = gold bonus
    - **Evidence:** Task completion with file/URL/text proof
    - **Tracking:** ventureCheckpoints table with T1/T2/T3 completion flags

    #### Boss System (Complete)
    - **12 Bosses:** Defined in convex/ventureConstants.ts
    - **Assignment:** Random 1-2 bosses per venture
    - **Corruption:** 0-100% meter with daily increase cron (+5%/day)
    - **States:** active, retreated, slain
    - **Corruption Effects:** -12% per standard clear, -25% per gold clear
    - **Missing:** Visual corruption effects on world map, boss-specific defeat methods

    #### Gamification (Fully Operational)
    - **Levels:** 50 levels (1-6 tutorial, 7-15 early, 16-28 mid, 29-39 senior, 40-50 mentor)
    - **Badges:** 62 badges across 7 categories with rarity tiers
    - **Points:** Wallet system with transaction history (convex/gamification.ts)
    - **Streaks:** Daily login tracking with recovery (convex/users.ts)
    - **Leaderboard:** Daily winners (convex/leaderboard.ts)
    - **Mentorship:** Level 40+ mentors tracked (convex/mentorship.ts)

    #### Social Features (Complete)
    - Ideas (create/edit/spark/comment)
    - Contribution requests + invitations
    - Realtime chat (direct/group)
    - Flares (help requests with responses)
    - Notifications system
    - User search + skills + industries

    ### Target State (PRD Vision)
    - **4 Project Templates:** Venture (8), Academic (6), Lab (7), Creative (6) stages
    - **2D World Map:** Phaser 3 sidescroller with 8 biomes + persona movement + boss encounters
    - **AI Layer:** Quality scoring (0-12) + skill/industry tag suggestions + tiered matching algorithm
    - **Audio System:** Howler.js implementation with 50+ SFX + music + ambience
    - **HUD:** Persistent overlay with XP, Level, Stage, Checkpoint, Corruption, Quality
    - **Checkpoint Animations:** 6 patterns (Seal Break, Rune Inscription, Beacon Lighting, Bridge Repair, Compass Calibration, Ward Placement) × 2 variants (standard/gold)
    - **Persona System:** 10 predefined pixel personas + Pro character creator + photo-to-pixel
    - **Inter-Checkpoint Gameplay:** Henchmen encounters, treasure chests, journey sequences
    - **Points Economy Hardening:** Daily caps, word count validation, stage multipliers, weekly quests, leagues

    ---

    ## Table of Contents

    1. [Current Implementation Status](#1-current-implementation-status)
    2. [Technical Architecture](#2-technical-architecture)
    3. [What Needs to Be Built](#3-what-needs-to-be-built)
    4. [Deliverables by Phase](#4-deliverables-by-phase)
    5. [Frontend Scope](#5-frontend-scope)
    6. [Backend Scope](#6-backend-scope)
    7. [Database Changes](#7-database-changes)
    8. [Integrations](#8-integrations)
    9. [Deployment Strategy](#9-deployment-strategy)
    10. [Timeline & Milestones](#10-timeline--milestones)
    11. [Team Requirements](#11-team-requirements)
    12. [Risk Mitigation](#12-risk-mitigation)

    ---

    ## 1. Current Implementation Status

    ### ✅ Completed Features (Production-Ready)

    #### Core Platform
    - **Authentication:** Clerk integration with user management
    - **Database:** Convex real-time database with 28 tables
    - **UI Framework:** Next.js 15, React 19, Tailwind CSS 4, Radix UI
    - **File Storage:** Convex storage for attachments (PDF, PPT, XLS, DOC, images, video)
    - **Real-time Features:** Chat, notifications, live updates

    #### Venture System (Single Template)
    - **8 Stages:** Ideation → Research → Validation → Design → Development → Launch → Iteration → Scale
    - **36 Checkpoints:** Fully defined with outcomes and task prompts
    - **3-Task System:** T1 (Easy), T2 (Medium), T3 (Stretch) per checkpoint
    - **9 Tool Types:** Write, Table, Map, Survey, Poll, Link, Upload, OAuth, Self-report
    - **Evidence Submission:** Task completion with proof tracking
    - **Progress Tracking:** Checkpoint/stage advancement logic

    #### Boss System
    - **12 Boss Definitions:** Complete lore, corruption mechanics, defeat methods
    - **Boss Assignment:** Random 1-2 bosses per venture
    - **Corruption Tracking:** 0-100% meter with database persistence
    - **Boss States:** Active, Retreated, Slain
    - **Cron Jobs:** Daily corruption increase for inactive ventures

    #### Gamification
    - **50 Levels:** Tutorial (1-6), Early (7-15), Mid (16-28), Senior (29-39), Mentor (40-50)
    - **62 Badges:** Onboarding, Idea Milestones, Community, Consistency, Hidden, Aspirational
    - **Points Economy:** Wallet system, transactions, XP tracking
    - **Streaks:** Daily login tracking with recovery mechanics
    - **Leaderboard:** Daily winners tracking

    #### Social Features
    - **Ideas:** Create, edit, spark (like), comment, visibility controls
    - **Collaboration:** Contribution requests, invitations, team management
    - **Chat:** Direct messages, group chats, conversation management
    - **Flares:** Help request system with community responses
    - **Mentorship:** Level 40+ mentor tracking

    #### UI Components (110+ Components)
    - **Venture Pages:** Detail view, checkpoint view, create venture
    - **Tools:** 9 task completion tools fully functional
    - **Gamification:** Badge grid, level badge, leaderboard, streak indicator
    - **Boss Display:** Boss encounter, monument display components
    - **Navigation:** Feed, My Ideas, My Ventures, Profile, Community

    #### Testing & Quality
    - **60 Passing Tests:** Vitest test suite covering venture logic
    - **Type Safety:** Full TypeScript implementation
    - **Build:** Clean production builds with Turbopack

    ### 🚧 Partially Implemented

    - **Kanban Tool:** Exists but not integrated with ventures
    - **Calendar Tool:** Exists but not integrated with ventures
    - **Monument System:** Component exists, needs full integration
    - **Badge Evaluation:** Framework exists, needs automation
    - **Corruption Rules:** Basic implementation, needs completion

    ### ❌ Not Implemented (PRD Requirements)

    - **Additional Templates:** Academic, Lab, Creative (0 of 3)
    - **2D World Map:** Phaser 3 sidescroller system
    - **AI Systems:** Quality scoring, tag generation, matching algorithm
    - **Persona System:** Character selection and animation
    - **Audio System:** Music, SFX, ambience
    - **Animations:** Checkpoint crossing, level-up, badge awards
    - **HUD:** Always-visible game elements
    - **Inter-Checkpoint Gameplay:** Henchmen, treasure chests

    ---

    ## 2. Technical Architecture

    ### Current Stack

    ```
    Frontend:
    ├── Next.js 15 (App Router)
    ├── React 19
    ├── TypeScript 5
    ├── Tailwind CSS 4
    ├── Radix UI (primitives)
    ├── Framer Motion (animations)
    └── Turbopack (build)

    Backend:
    ├── Convex (serverless functions + real-time DB)
    ├── Clerk (authentication)
    └── Google Generative AI (@google/generative-ai)

    Storage:
    ├── Convex Storage (files)
    └── Convex Database (28 tables)

    Deployment:
    ├── Vercel (frontend)
    └── Convex Cloud (backend)
    ```

    ### Proposed Additions

    ```
    Game Engine:
    └── Phaser 3 (2D canvas rendering)

    Audio:
    └── Howler.js (audio management)

    AI/ML:
    ├── Open-weight model (free tier) - TBD
    └── Frontier model (Pro tier) - OpenAI GPT-4 or Anthropic Claude

    Image Processing:
    └── Sharp or Canvas API (photo-to-pixel conversion)

    Testing:
    ├── Vitest (unit tests) ✅
    ├── Playwright (E2E tests) - NEW
    └── Storybook (component library) - NEW
    ```

    ### Architecture Diagram

    ```
    ┌─────────────────────────────────────────────────────────────┐
    │                        User Browser                          │
    ├─────────────────────────────────────────────────────────────┤
    │  Next.js App (React)                                        │
    │  ├── UI Components (Radix + Tailwind)                      │
    │  ├── Phaser 3 Canvas (World Map) ← NEW                     │
    │  ├── Framer Motion (Animations)                            │
    │  └── Howler.js (Audio) ← NEW                               │
    └─────────────────────────────────────────────────────────────┘
                            ↓ ↑
    ┌─────────────────────────────────────────────────────────────┐
    │                    Convex Backend                            │
    │  ├── Mutations (write operations)                          │
    │  ├── Queries (read operations)                             │
    │  ├── Cron Jobs (scheduled tasks)                           │
    │  ├── Actions (external API calls) ← AI Integration         │
    │  └── Real-time Subscriptions                               │
    └─────────────────────────────────────────────────────────────┘
                            ↓ ↑
    ┌─────────────────────────────────────────────────────────────┐
    │                   External Services                          │
    │  ├── Clerk (Auth)                                           │
    │  ├── OpenAI / Anthropic (AI Scoring) ← NEW                 │
    │  ├── Open-weight Model API ← NEW                           │
    │  └── Convex Storage (Files)                                │
    └─────────────────────────────────────────────────────────────┘
    ```

    ---

    ## 3. What Needs to Be Built

    ### Priority 1: Foundation (Months 1-3)

    #### 3.1 Phaser 3 Integration
    **Status:** Not Started  
    **Complexity:** High  
    **Dependencies:** None

    **Deliverables:**
    - Phaser 3 setup in Next.js App Router
    - React-Phaser event bridge
    - Canvas mounting system
    - Camera and viewport management
    - Performance optimization for mobile

    **Technical Details:**
    ```typescript
    // New files to create:
    src/lib/phaser/
    ├── game-config.ts          // Phaser configuration
    ├── scenes/
    │   ├── WorldMapScene.ts    // Main world map scene
    │   ├── CheckpointScene.ts  // Checkpoint detail scene
    │   └── BossScene.ts        // Boss encounter scene
    ├── entities/
    │   ├── Persona.ts          // Player character
    │   ├── Checkpoint.ts       // Checkpoint node
    │   └── Boss.ts             // Boss entity
    └── utils/
        ├── event-bridge.ts     // React ↔ Phaser communication
        └── asset-loader.ts     // Asset management
    ```

    #### 3.2 World Map System
    **Status:** Not Started  
    **Complexity:** High  
    **Dependencies:** Phaser 3 Integration

    **Deliverables:**
    - Snake-path overworld map
    - 8 biome visual designs (Village, Forest, Arena, Quarry, Mine, Harbour, Crossroads, Capital)
    - Checkpoint node rendering
    - Stage progression visualization
    - Boss silhouette system
    - Horizontal scrolling with camera follow

    **Asset Requirements:**
    - 8 biome background images (2048x512px each)
    - Checkpoint node sprites (64x64px, 3 states: locked, active, completed)
    - Path/road tileset
    - Boss silhouette sprites (256x256px, 12 bosses)
    - Particle effects (gold burst, corruption overlay)

    #### 3.3 Template System
    **Status:** Venture Complete, 3 Missing  
    **Complexity:** Medium  
    **Dependencies:** None (can parallelize)

    **Deliverables:**

    **Academic Template (6 stages):**
    - 6 stage definitions
    - ~20 checkpoint definitions
    - Stage-specific settings and monsters
    - JIF Score quality metric

    **Lab Template (7 stages):**
    - 7 stage definitions
    - ~25 checkpoint definitions
    - Stage-specific settings and monsters
    - p-value quality metric

    **Creative Template (6 stages):**
    - 6 stage definitions
    - ~20 checkpoint definitions
    - Stage-specific settings and monsters
    - Fan Score quality metric

    **Technical Details:**
    ```typescript
    // Extend existing:
    convex/ventureConstants.ts
    ├── ACADEMIC_STAGES[]
    ├── LAB_STAGES[]
    ├── CREATIVE_STAGES[]
    ├── ACADEMIC_CHECKPOINTS[]
    ├── LAB_CHECKPOINTS[]
    └── CREATIVE_CHECKPOINTS[]

    // New schema fields:
    ventures table:
    ├── projectType: "venture" | "academic" | "lab" | "creative"
    └── qualityScore: number
    ```

    #### 3.4 Quality Metric Framework
    **Status:** Not Started  
    **Complexity:** Medium  
    **Dependencies:** Template System

    **Deliverables:**
    - Quality score calculation engine
    - Template-specific metric displays
    - Boss HP scaling based on quality
    - Quality history tracking

    **Technical Details:**
    ```typescript
    // New files:
    convex/qualityScoring.ts
    ├── calculateQualityScore()
    ├── getTemplateMetric()
    ├── updateBossHP()
    └── getQualityHistory()

    // New table:
    qualityScores {
    ventureId: Id<"ventures">
    stage: number
    score: number
    metric: "valuation" | "jif" | "pvalue" | "fanscore"
    calculatedAt: number
    }
    ```

    ---

    ### Priority 2: AI & Intelligence (Months 2-4)

    #### 3.5 AI Quality Scoring System
    **Status:** Not Started  
    **Complexity:** High  
    **Dependencies:** Quality Metric Framework

    **Deliverables:**
    - AI model integration (open-weight + frontier)
    - Task submission evaluation (4 dimensions: Completeness, Specificity, Evidence, Originality)
    - Quality tier mapping (Low 0-4, Standard 5-8, High 9-12)
    - Free vs Pro tier differentiation
    - A/B testing framework

    **Technical Details:**
    ```typescript
    // New files:
    convex/ai/
    ├── scoring.ts              // AI scoring logic
    ├── models.ts               // Model configurations
    └── evaluation.ts           // Evaluation criteria

    // New Convex actions:
    convex/actions/aiScoring.ts
    ├── evaluateTaskSubmission()
    ├── generateQualityFeedback()
    └── calculateQualityTier()

    // Environment variables:
    OPENAI_API_KEY              // Frontier model (Pro)
    OPEN_WEIGHT_MODEL_URL       // Free tier model
    ```

    **AI Scoring Criteria:**
    ```typescript
    interface ScoringDimensions {
    completeness: 0 | 1 | 2 | 3    // Does it address the task?
    specificity: 0 | 1 | 2 | 3     // Concrete vs vague?
    evidence: 0 | 1 | 2 | 3        // Supported by data/sources?
    originality: 0 | 1 | 2 | 3     // Beyond minimum?
    }
    // Total: 0-12 → Quality Tier
    ```

    #### 3.6 AI Tag Generation & Matching
    **Status:** Not Started  
    **Complexity:** Medium  
    **Dependencies:** AI Integration

    **Deliverables:**
    - AI-powered title generation from brief
    - Skill tag suggestions (2-5 from taxonomy)
    - Industry tag suggestions (2-4 from taxonomy)
    - Fixed taxonomy system (skills + industries)
    - Tiered matching algorithm

    **Technical Details:**
    ```typescript
    // New files:
    convex/ai/tagging.ts
    ├── generateTitle()
    ├── suggestSkillTags()
    ├── suggestIndustryTags()
    └── validateTags()

    convex/matching.ts
    ├── calculateMatchScore()
    ├── getTierForMatch()
    ├── applyModifiers()
    └── rankCollaborators()

    // New tables:
    skillTaxonomy {
    slug: string
    name: string
    category: string
    }

    industryTaxonomy {
    slug: string
    name: string
    category: string
    }
    ```

    **Matching Algorithm:**
    ```typescript
    // Tier 1: Skill + Industry overlap
    baseScore = 100
    + (15 * skillMatches)
    + (10 * industryMatches)

    // Tier 2: Skill only
    baseScore = 60
    + (15 * skillMatches)

    // Tier 3: Industry only
    baseScore = 30
    + (10 * industryMatches)

    // Tier 4: Random
    baseScore = random(0, 10)

    // Modifiers:
    + 5 if level >= 10
    + 8 if currently online
    - 20 if prior collaboration
    ```

    ---

    ### Priority 3: Visual & UX (Months 3-6)

    #### 3.7 HUD System
    **Status:** Not Started  
    **Complexity:** Medium  
    **Dependencies:** Quality Metric Framework

    **Deliverables:**
    - Persistent HUD overlay
    - XP bar with current/target display
    - Level number with title tooltip
    - Stage name display
    - Checkpoint progress (e.g., 3/7)
    - Streak counter
    - Corruption meter (color-coded)
    - Quality score display
    - Audio controls

    **Technical Details:**
    ```typescript
    // New components:
    src/components/hud/
    ├── HUD.tsx                 // Main HUD container
    ├── XPBar.tsx              // Experience bar
    ├── LevelDisplay.tsx       // Level + title
    ├── StageInfo.tsx          // Current stage
    ├── CheckpointProgress.tsx // Progress indicator
    ├── StreakCounter.tsx      // Daily streak
    ├── CorruptionMeter.tsx    // Corruption bar
    ├── QualityScore.tsx       // Quality metric
    └── AudioControls.tsx      // Volume controls

    // State management:
    src/lib/stores/hudStore.ts // Jotai atoms for HUD state
    ```

    #### 3.8 Checkpoint Crossing Animations
    **Status:** Not Started  
    **Complexity:** Medium  
    **Dependencies:** Phaser 3 Integration

    **Deliverables:**
    - 6 animation patterns (Seal Break, Rune Inscription, Beacon Lighting, Bridge Repair, Compass Calibration, Ward Placement)
    - Standard (2/3) and Gold (3/3) variants for each
    - Stage-to-pattern mapping
    - Audio cue integration
    - 1.5-3.5 second sequences

    **Technical Details:**
    ```typescript
    // New Phaser scenes:
    src/lib/phaser/scenes/animations/
    ├── SealBreakAnimation.ts
    ├── RuneInscriptionAnimation.ts
    ├── BeaconLightingAnimation.ts
    ├── BridgeRepairAnimation.ts
    ├── CompassCalibrationAnimation.ts
    └── WardPlacementAnimation.ts

    // Animation config:
    convex/animationConstants.ts
    ├── ANIMATION_PATTERNS[]
    ├── STAGE_ANIMATION_MAP
    └── AUDIO_CUES
    ```

    #### 3.9 Persona System (MVP)
    **Status:** Not Started  
    **Complexity:** Medium  
    **Dependencies:** Phaser 3 Integration

    **Deliverables:**
    - 10 predefined pixel personas (32x48px sprites)
    - Idle animation loop
    - Walk/run cycle
    - Persona selection UI
    - Project-specific persona storage

    **Asset Requirements:**
    - 10 character sprite sheets (32x48px per frame)
    - 4 frames idle animation
    - 6 frames walk cycle
    - Character portraits (96x96px)

    **Technical Details:**
    ```typescript
    // New files:
    src/lib/phaser/entities/Persona.ts
    src/components/persona/PersonaSelector.tsx

    // New table field:
    ventures {
    personaId: number  // 1-10
    }

    // Asset structure:
    public/assets/personas/
    ├── persona-1-idle.png
    ├── persona-1-walk.png
    ├── persona-1-portrait.png
    └── ... (x10)
    ```

    ---

    ### Priority 4: Audio & Polish (Months 5-7)

    #### 3.10 Audio System
    **Status:** Not Started  
    **Complexity:** Medium  
    **Dependencies:** None (can parallelize)

    **Deliverables:**
    - Howler.js integration
    - 8 stage ambience loops
    - 12 checkpoint SFX (6 patterns x 2 variants)
    - 12 boss entrance themes
    - Level-up fanfare
    - Badge award sounds (per rarity)
    - UI action sounds (click, hover, confirm, error)
    - Global audio controls (Master, Music, SFX)
    - LocalStorage persistence

    **Asset Requirements:**
    - 8 ambient loops (2-3 min each, loopable)
    - 12 checkpoint SFX (2-4 sec each)
    - 12 boss themes (4 sec each)
    - 5 badge fanfares (2-4 sec, by rarity)
    - 1 level-up fanfare (2 sec)
    - 4 UI sounds (0.1-0.5 sec each)

    **Technical Details:**
    ```typescript
    // New files:
    src/lib/audio/
    ├── audioManager.ts         // Howler.js wrapper
    ├── soundLibrary.ts         // Sound definitions
    └── audioStore.ts           // Volume state

    // Audio config:
    public/assets/audio/
    ├── ambience/
    │   ├── village.mp3
    │   ├── forest.mp3
    │   └── ... (x8)
    ├── sfx/
    │   ├── seal-break-standard.mp3
    │   ├── seal-break-gold.mp3
    │   └── ... (x12)
    ├── bosses/
    │   ├── unraveller-theme.mp3
    │   └── ... (x12)
    └── ui/
        ├── click.mp3
        ├── hover.mp3
        ├── confirm.mp3
        └── error.mp3
    ```

    #### 3.11 Level-Up & Badge Animations
    **Status:** Not Started  
    **Complexity:** Low  
    **Dependencies:** Audio System

    **Deliverables:**
    - Level-up animation sequence (2s, skippable after 0.5s)
    - Badge award animation (4s, Legendary unskippable)
    - Phase transition effects (1.2s)
    - Particle effects (gold burst, screen flash)

    **Technical Details:**
    ```typescript
    // New components:
    src/components/animations/
    ├── LevelUpAnimation.tsx
    ├── BadgeAwardAnimation.tsx
    └── PhaseTransitionAnimation.tsx

    // Animation specs:
    - Screen edge burst: 0.3s
    - Level counter spin: 0.5s (bounce easing)
    - Title fade-in: 0.4s (gold glow)
    - Phase transition: 1.2s (world-map unlock)
    - Tool unlock cards: 0.8s (floating)
    ```

    ---

    ## 4. Deliverables by Phase

    ### Phase 1: Foundation (Weeks 1-12)

    **Milestone 1.1: Phaser Integration (Weeks 1-3)**
    - [ ] Phaser 3 setup in Next.js
    - [ ] React-Phaser event bridge
    - [ ] Basic canvas rendering
    - [ ] Performance benchmarks (60 FPS target)

    **Milestone 1.2: World Map MVP (Weeks 4-8)**
    - [ ] Snake-path rendering
    - [ ] 2 biome designs (Village + Forest)
    - [ ] Checkpoint node system
    - [ ] Camera scrolling
    - [ ] Venture template integration

    **Milestone 1.3: Quality Framework (Weeks 9-12)**
    - [ ] Quality score calculation
    - [ ] Valuation metric for Venture
    - [ ] Boss HP scaling
    - [ ] Quality history tracking

    **Deliverables:**
    - Working 2D world map for Venture template
    - Quality scoring system operational
    - Documentation for Phaser integration

    ---

    ### Phase 2: AI & Templates (Weeks 13-24)

    **Milestone 2.1: AI Integration (Weeks 13-17)**
    - [ ] OpenAI/Anthropic API integration
    - [ ] Open-weight model setup
    - [ ] Task evaluation system
    - [ ] Quality tier mapping
    - [ ] A/B testing framework

    **Milestone 2.2: Academic Template (Weeks 18-20)**
    - [ ] 6 stage definitions
    - [ ] ~20 checkpoint definitions
    - [ ] JIF Score metric
    - [ ] 2 biome designs (Library + Ruins)

    **Milestone 2.3: Lab Template (Weeks 21-23)**
    - [ ] 7 stage definitions
    - [ ] ~25 checkpoint definitions
    - [ ] p-value metric
    - [ ] 2 biome designs (Observatory + Laboratory)

    **Milestone 2.4: Creative Template (Week 24)**
    - [ ] 6 stage definitions
    - [ ] ~20 checkpoint definitions
    - [ ] Fan Score metric
    - [ ] 2 biome designs (Grove + Gallery)

    **Deliverables:**
    - AI quality scoring operational
    - 4 complete project templates
    - 8 biome designs complete
    - Template selection UI

    ---

    ### Phase 3: UX & Engagement (Weeks 25-36)

    **Milestone 3.1: HUD System (Weeks 25-28)**
    - [ ] Persistent HUD overlay
    - [ ] All 8 HUD elements
    - [ ] Responsive design
    - [ ] State management

    **Milestone 3.2: Animations (Weeks 29-32)**
    - [ ] 6 checkpoint crossing patterns
    - [ ] Standard + Gold variants
    - [ ] Level-up animation
    - [ ] Badge award animation

    **Milestone 3.3: Persona System (Weeks 33-36)**
    - [ ] 10 pixel art characters
    - [ ] Animation system
    - [ ] Persona selector UI
    - [ ] World map integration

    **Deliverables:**
    - Complete HUD system
    - Full animation suite
    - Persona system operational
    - Enhanced visual feedback

    ---

    ### Phase 4: Audio & Polish (Weeks 37-48)

    **Milestone 4.1: Audio System (Weeks 37-42)**
    - [ ] Howler.js integration
    - [ ] 8 ambient loops
    - [ ] 12 checkpoint SFX
    - [ ] 12 boss themes
    - [ ] Audio controls UI

    **Milestone 4.2: Matching & AI Tags (Weeks 43-46)**
    - [ ] AI title generation
    - [ ] Tag suggestion system
    - [ ] Tiered matching algorithm
    - [ ] Matching UI panel

    **Milestone 4.3: Final Polish (Weeks 47-48)**
    - [ ] Performance optimization
    - [ ] Mobile responsiveness
    - [ ] Bug fixes
    - [ ] Documentation

    **Deliverables:**
    - Complete audio system
    - AI matching operational
    - Production-ready platform
    - Full documentation

    ---

    ## 5. Frontend Scope

    ### New Dependencies

    ```json
    {
    "dependencies": {
        "phaser": "^3.80.1",              // 2D game engine
        "howler": "^2.2.4",               // Audio management
        "@types/howler": "^2.2.11"
    },
    "devDependencies": {
        "@playwright/test": "^1.45.0",    // E2E testing
        "storybook": "^8.0.0",            // Component library
        "@storybook/react": "^8.0.0"
    }
    }
    ```

    ### New Components (Estimated 40+)

    ```
    src/components/
    ├── phaser/
    │   ├── PhaserCanvas.tsx            // Phaser mount point
    │   ├── WorldMapContainer.tsx       // World map wrapper
    │   └── GameControls.tsx            // Game UI controls
    ├── hud/
    │   ├── HUD.tsx                     // Main HUD
    │   ├── XPBar.tsx
    │   ├── LevelDisplay.tsx
    │   ├── StageInfo.tsx
    │   ├── CheckpointProgress.tsx
    │   ├── StreakCounter.tsx
    │   ├── CorruptionMeter.tsx
    │   ├── QualityScore.tsx
    │   └── AudioControls.tsx
    ├── persona/
    │   ├── PersonaSelector.tsx         // Character selection
    │   ├── PersonaCard.tsx             // Character preview
    │   └── PersonaCustomizer.tsx       // Pro feature
    ├── animations/
    │   ├── LevelUpAnimation.tsx
    │   ├── BadgeAwardAnimation.tsx
    │   └── PhaseTransitionAnimation.tsx
    ├── templates/
    │   ├── TemplateSelector.tsx        // Project type selection
    │   ├── TemplateCard.tsx
    │   └── TemplateBrief.tsx           // Brief input
    ├── matching/
    │   ├── CollaboratorPanel.tsx       // Matching UI
    │   ├── MatchTierBadge.tsx
    │   └── CollaboratorCard.tsx
    └── quality/
        ├── QualityScoreDisplay.tsx
        ├── QualityHistory.tsx
        └── AIFeedback.tsx
    ```

    ### Page Updates

    ```
    src/app/
    ├── venture/create/page.tsx         // Add template selection
    ├── venture/[id]/page.tsx           // Add world map
    ├── venture/[id]/stage/[stage]/checkpoint/[checkpoint]/page.tsx
    │                                   // Add animations
    └── profile/[username]/page.tsx     // Add persona display
    ```

    ### State Management

    ```typescript
    // New Jotai atoms:
    src/lib/stores/
    ├── hudStore.ts                     // HUD state
    ├── audioStore.ts                   // Audio preferences
    ├── gameStore.ts                    // Phaser game state
    └── qualityStore.ts                 // Quality scores
    ```

    ### Asset Organization

    ```
    public/assets/
    ├── personas/
    │   ├── persona-1/
    │   │   ├── idle.png
    │   │   ├── walk.png
    │   │   └── portrait.png
    │   └── ... (x10)
    ├── biomes/
    │   ├── village-bg.png
    │   ├── forest-bg.png
    │   └── ... (x8)
    ├── checkpoints/
    │   ├── node-locked.png
    │   ├── node-active.png
    │   ├── node-completed.png
    │   └── node-gold.png
    ├── bosses/
    │   ├── boss-1-silhouette.png
    │   └── ... (x12)
    ├── particles/
    │   ├── gold-burst.png
    │   ├── corruption-overlay.png
    │   └── sparkle.png
    └── audio/
        ├── ambience/
        ├── sfx/
        ├── bosses/
        └── ui/
    ```

    ---

    ## 6. Backend Scope

    ### New Convex Files

    ```
    convex/
    ├── ai/
    │   ├── scoring.ts                  // AI quality scoring
    │   ├── tagging.ts                  // AI tag generation
    │   ├── models.ts                   // Model configs
    │   └── evaluation.ts               // Evaluation logic
    ├── actions/
    │   ├── aiScoring.ts                // External AI API calls
    │   └── aiTagging.ts                // External AI API calls
    ├── templates/
    │   ├── academic.ts                 // Academic template logic
    │   ├── lab.ts                      // Lab template logic
    │   └── creative.ts                 // Creative template logic
    ├── matching.ts                     // Collaborator matching
    ├── qualityScoring.ts               // Quality calculation
    ├── animationConstants.ts           // Animation configs
    └── taxonomies.ts                   // Skill/industry taxonomies
    ```

    ### Extended Existing Files

    ```
    convex/
    ├── ventureConstants.ts
    │   ├── + ACADEMIC_STAGES
    │   ├── + LAB_STAGES
    │   ├── + CREATIVE_STAGES
    │   ├── + ACADEMIC_CHECKPOINTS
    │   ├── + LAB_CHECKPOINTS
    │   └── + CREATIVE_CHECKPOINTS
    ├── ventures.ts
    │   ├── + createVentureWithTemplate()
    │   ├── + calculateQualityScore()
    │   └── + updateBossHPFromQuality()
    ├── levels.ts
    │   └── + checkQualifyingActions()
    └── badges.ts
        └── + evaluateAllBadges()
    ```

    ### New Mutations

    ```typescript
    // Template creation
    createVentureWithTemplate(ideaId, templateType)

    // AI operations
    evaluateTaskSubmission(taskId, evidenceId)
    generateTitleFromBrief(brief)
    suggestTags(brief)

    // Quality scoring
    calculateQualityScore(ventureId, stage)
    updateQualityMetric(ventureId, score)

    // Matching
    getMatchedCollaborators(ventureId, limit)
    calculateMatchScore(userId, ventureId)

    // Persona
    selectPersona(ventureId, personaId)
    ```

    ### New Queries

    ```typescript
    // Templates
    getTemplateDefinition(templateType)
    getTemplateCheckpoints(templateType, stage)

    // Quality
    getQualityScore(ventureId)
    getQualityHistory(ventureId)

    // Matching
    getCollaboratorMatches(ventureId)
    getMatchTier(userId, ventureId)

    // Taxonomies
    getSkillTaxonomy()
    getIndustryTaxonomy()
    ```

    ### New Actions (External API Calls)

    ```typescript
    // AI Scoring
    actions.aiScoring.evaluateSubmission(content, criteria)
    actions.aiScoring.generateFeedback(score, content)

    // AI Tagging
    actions.aiTagging.generateTitle(brief)
    actions.aiTagging.suggestSkills(brief)
    actions.aiTagging.suggestIndustries(brief)
    ```

    ---

    ## 7. Database Changes

    ### New Tables

    ```typescript
    // Quality scoring
    qualityScores: defineTable({
    ventureId: v.id("ventures"),
    stage: v.number(),
    score: v.number(),              // 0-12
    metric: v.union(
        v.literal("valuation"),
        v.literal("jif"),
        v.literal("pvalue"),
        v.literal("fanscore")
    ),
    metricValue: v.number(),        // Template-specific value
    calculatedAt: v.number(),
    })
    .index("by_venture", ["ventureId"])
    .index("by_venture_stage", ["ventureId", "stage"])

    // Skill taxonomy
    skillTaxonomy: defineTable({
    slug: v.string(),
    name: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])

    // Industry taxonomy
    industryTaxonomy: defineTable({
    slug: v.string(),
    name: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])

    // AI evaluation history
    aiEvaluations: defineTable({
    taskId: v.id("ventureTasks"),
    evidenceId: v.id("ventureEvidence"),
    completeness: v.number(),       // 0-3
    specificity: v.number(),        // 0-3
    evidence: v.number(),           // 0-3
    originality: v.number(),        // 0-3
    totalScore: v.number(),         // 0-12
    qualityTier: v.union(
        v.literal("low"),
        v.literal("standard"),
        v.literal("high")
    ),
    feedback: v.optional(v.string()),
    modelUsed: v.string(),          // "open-weight" | "frontier"
    evaluatedAt: v.number(),
    })
    .index("by_task", ["taskId"])
    .index("by_evidence", ["evidenceId"])

    // Collaborator match cache
    collaboratorMatches: defineTable({
    ventureId: v.id("ventures"),
    userId: v.id("users"),
    matchScore: v.number(),
    tier: v.number(),               // 1-4
    skillMatches: v.number(),
    industryMatches: v.number(),
    calculatedAt: v.number(),
    })
    .index("by_venture", ["ventureId"])
    .index("by_venture_score", ["ventureId", "matchScore"])
    ```

    ### Modified Tables

    ```typescript
    // ventures table - add new fields
    ventures: defineTable({
    // ... existing fields
    projectType: v.union(
        v.literal("venture"),
        v.literal("academic"),
        v.literal("lab"),
        v.literal("creative")
    ),                              // NEW
    personaId: v.optional(v.number()), // NEW (1-10)
    qualityScore: v.optional(v.number()), // NEW (current quality)
    // ... rest of fields
    })

    // ideas table - add AI-generated fields
    ideas: defineTable({
    // ... existing fields
    aiGeneratedTitle: v.optional(v.string()), // NEW
    aiSuggestedSkills: v.optional(v.array(v.string())), // NEW
    aiSuggestedIndustries: v.optional(v.array(v.string())), // NEW
    // ... rest of fields
    })

    // users table - add activity tracking
    users: defineTable({
    // ... existing fields
    isOnline: v.optional(v.boolean()), // NEW
    lastSeenAt: v.optional(v.number()), // NEW
    // ... rest of fields
    })
    ```

    ### Data Migration

    ```typescript
    // Migration script for existing ventures
    // convex/migrations/addProjectType.ts
    export default migration({
    table: "ventures",
    migrateOne: async (ctx, doc) => {
        return {
        ...doc,
        projectType: "venture",  // Default existing to venture
        qualityScore: 0,
        }
    },
    })
    ```

    ---

    ## 8. Integrations

    ### 8.1 AI Model Integration

    **Open-Weight Model (Free Tier)**
    - **Options:** Llama 3, Mistral, or similar
    - **Hosting:** Replicate, HuggingFace Inference API, or self-hosted
    - **Use Cases:** Tag suggestions, basic quality scoring
    - **Cost:** ~$0.001 per request

    **Frontier Model (Pro Tier)**
    - **Options:** OpenAI GPT-4, Anthropic Claude 3.5
    - **Use Cases:** Advanced quality scoring, detailed feedback
    - **Cost:** ~$0.01-0.03 per request

    **Implementation:**
    ```typescript
    // convex/ai/models.ts
    export const AI_MODELS = {
    free: {
        provider: "replicate",
        model: "meta/llama-3-70b-instruct",
        apiKey: process.env.REPLICATE_API_KEY,
    },
    pro: {
        provider: "openai",
        model: "gpt-4-turbo",
        apiKey: process.env.OPENAI_API_KEY,
    },
    }

    // Environment variables needed:
    REPLICATE_API_KEY=xxx
    OPENAI_API_KEY=xxx
    ```

    ### 8.2 Asset Delivery

    **Image Assets**
    - **Storage:** Convex Storage or Cloudinary
    - **Optimization:** Next.js Image component with automatic optimization
    - **CDN:** Vercel Edge Network (automatic)

    **Audio Assets**
    - **Storage:** Convex Storage or dedicated CDN
    - **Format:** MP3 (broad compatibility) + OGG (fallback)
    - **Compression:** 128kbps for ambience, 192kbps for music

    ### 8.3 Analytics (Optional)

    **User Behavior Tracking**
    - **Tool:** PostHog or Mixpanel
    - **Events:**
    - Template selection
    - Checkpoint completion
    - Boss encounters
    - Quality score milestones
    - Audio interactions

    **Performance Monitoring**
    - **Tool:** Vercel Analytics + Sentry
    - **Metrics:**
    - Phaser FPS
    - Canvas render time
    - API response times
    - Error rates

    ---

    ## 9. Deployment Strategy

    ### 9.1 Environment Setup

    ```
    Development:
    ├── Local Next.js (localhost:3000)
    ├── Convex Dev (auto-deployed)
    └── Test AI APIs (sandbox keys)

    Staging:
    ├── Vercel Preview (PR deployments)
    ├── Convex Preview (branch deployments)
    └── Test AI APIs (sandbox keys)

    Production:
    ├── Vercel Production (main branch)
    ├── Convex Production (manual promotion)
    └── Production AI APIs (production keys)
    ```

    ### 9.2 Deployment Checklist

    **Phase 1 Deployment (Week 12)**
    - [ ] Phaser 3 integration tested on mobile
    - [ ] World map performance benchmarks met (60 FPS)
    - [ ] Quality scoring system validated
    - [ ] Database migrations applied
    - [ ] Environment variables configured
    - [ ] Rollback plan documented

    **Phase 2 Deployment (Week 24)**
    - [ ] All 4 templates tested end-to-end
    - [ ] AI scoring A/B test configured
    - [ ] Template selection UI tested
    - [ ] Performance regression tests passed
    - [ ] User migration plan for existing ventures

    **Phase 3 Deployment (Week 36)**
    - [ ] HUD tested across devices
    - [ ] Animations performance validated
    - [ ] Persona system tested
    - [ ] Mobile responsiveness verified

    **Phase 4 Deployment (Week 48)**
    - [ ] Audio system tested (all browsers)
    - [ ] Matching algorithm validated
    - [ ] Full E2E test suite passing
    - [ ] Documentation complete
    - [ ] Launch announcement ready

    ### 9.3 Feature Flags

    ```typescript
    // Use Convex for feature flags
    featureFlags: defineTable({
    flag: v.string(),
    enabled: v.boolean(),
    rolloutPercentage: v.number(),  // 0-100
    enabledForUsers: v.array(v.id("users")),
    })

    // Flags to implement:
    - phaser_world_map
    - ai_quality_scoring
    - academic_template
    - lab_template
    - creative_template
    - persona_system
    - audio_system
    - ai_matching
    ```

    ### 9.4 Rollback Strategy

    **Database Rollback:**
    - Convex supports schema versioning
    - Keep previous schema version for 7 days
    - Test rollback in staging before production

    **Code Rollback:**
    - Vercel instant rollback to previous deployment
    - Feature flags to disable new features without redeployment

    **Data Integrity:**
    - Backup Convex database before major migrations
    - Test migrations on staging data first
    - Monitor error rates post-deployment

    ---

    ## 10. Timeline & Milestones

    ### Overview Timeline (48 Weeks / 12 Months)

    ```
    Month 1-3:  Foundation (Phaser, World Map, Quality Framework)
    Month 2-6:  AI & Templates (AI Integration, 3 New Templates)
    Month 3-9:  UX & Engagement (HUD, Animations, Personas)
    Month 5-12: Audio & Polish (Audio System, Matching, Final Polish)
    ```

    ### Detailed Milestone Schedule

    #### Q1 (Weeks 1-12): Foundation

    | Week | Milestone | Deliverables | Team |
    |------|-----------|--------------|------|
    | 1-3 | Phaser Integration | Phaser setup, React bridge, basic canvas | 2 FE devs |
    | 4-8 | World Map MVP | Snake path, 2 biomes, checkpoint nodes | 2 FE devs + 1 designer |
    | 9-12 | Quality Framework | Quality calculation, boss HP scaling | 1 BE dev |

    **Key Deliverable:** Working 2D world map for Venture template

    #### Q2 (Weeks 13-24): AI & Templates

    | Week | Milestone | Deliverables | Team |
    |------|-----------|--------------|------|
    | 13-17 | AI Integration | OpenAI/open-weight setup, evaluation system | 1 BE dev |
    | 18-20 | Academic Template | 6 stages, 20 checkpoints, JIF metric, 2 biomes | 1 BE dev + 1 designer |
    | 21-23 | Lab Template | 7 stages, 25 checkpoints, p-value, 2 biomes | 1 BE dev + 1 designer |
    | 24 | Creative Template | 6 stages, 20 checkpoints, Fan Score, 2 biomes | 1 BE dev + 1 designer |

    **Key Deliverable:** 4 complete project templates with AI scoring

    #### Q3 (Weeks 25-36): UX & Engagement

    | Week | Milestone | Deliverables | Team |
    |------|-----------|--------------|------|
    | 25-28 | HUD System | 8 HUD elements, responsive design | 2 FE devs |
    | 29-32 | Animations | 6 checkpoint patterns, level-up, badges | 1 FE dev + 1 designer |
    | 33-36 | Persona System | 10 characters, animations, selector UI | 1 FE dev + 1 designer |

    **Key Deliverable:** Complete HUD and animation system

    #### Q4 (Weeks 37-48): Audio & Polish

    | Week | Milestone | Deliverables | Team |
    |------|-----------|--------------|------|
    | 37-42 | Audio System | Howler.js, 8 ambience, 12 SFX, 12 themes | 1 FE dev + 1 audio designer |
    | 43-46 | Matching & AI Tags | Title gen, tag suggestions, matching algo | 1 BE dev |
    | 47-48 | Final Polish | Performance, mobile, bugs, docs | Full team |

    **Key Deliverable:** Production-ready platform with full feature set

    ---

    ### Critical Path Dependencies

    ```mermaid
    graph TD
        A[Phaser Integration] --> B[World Map MVP]
        B --> C[Animations]
        B --> D[Persona System]
        
        E[Quality Framework] --> F[AI Integration]
        F --> G[Template System]
        
        H[HUD System] --> I[Final Polish]
        C --> I
        D --> I
        J[Audio System] --> I
        K[Matching] --> I
    ```

    ### Risk Buffer

    - **Built-in buffer:** 20% (9.6 weeks) distributed across phases
    - **High-risk items:** Phaser integration (+2 weeks), AI calibration (+2 weeks)
    - **Contingency:** Can defer audio system and matching to post-launch

    ---

    ## 11. Team Requirements

    ### Recommended Team Composition

    #### Core Team (Months 1-6)

    **Frontend Developers (2)**
    - React/Next.js expertise
    - Phaser 3 or game engine experience (at least 1)
    - Animation and canvas rendering
    - Responsive design

    **Backend Developer (1)**
    - Convex experience
    - AI API integration
    - Database schema design
    - Performance optimization

    **UI/UX Designer (1)**
    - Pixel art and sprite design
    - Game UI/UX patterns
    - Animation design
    - Asset creation

    **Total:** 4 people

    #### Expanded Team (Months 7-12)

    **Audio Designer (1)**
    - Game audio experience
    - Music composition
    - SFX creation
    - Audio implementation

    **QA Engineer (1)**
    - E2E testing
    - Performance testing
    - Cross-browser testing
    - Mobile testing

    **Total:** 6 people

    ### Skill Requirements

    **Must Have:**
    - React 19 + Next.js 15
    - TypeScript
    - Convex (or willingness to learn)
    - Tailwind CSS
    - Git/GitHub

    **Nice to Have:**
    - Phaser 3 or similar game engine
    - Pixel art creation
    - Audio design
    - AI/ML API integration
    - Performance optimization

    ### External Resources

    **Design Assets:**
    - Pixel art sprites: Fiverr/Upwork (~$500-1000 per character set)
    - Biome backgrounds: Fiverr/Upwork (~$200-400 per biome)
    - Audio assets: AudioJungle or custom composer (~$2000-5000 total)

    **AI APIs:**
    - OpenAI: ~$500-1000/month (estimated)
    - Replicate: ~$100-300/month (estimated)

    ---

    ## 12. Risk Mitigation

    ### Technical Risks

    #### Risk 1: Phaser Performance on Mobile
    **Probability:** Medium  
    **Impact:** High  
    **Mitigation:**
    - Early mobile testing (Week 3)
    - Performance benchmarks (60 FPS target)
    - Fallback to static images if needed
    - Progressive enhancement approach

    #### Risk 2: AI Model Quality Gap
    **Probability:** Medium  
    **Impact:** Medium  
    **Mitigation:**
    - A/B testing framework from day 1
    - User feedback collection
    - Model fine-tuning budget
    - Manual review fallback

    #### Risk 3: Asset Creation Delays
    **Probability:** High  
    **Impact:** Medium  
    **Mitigation:**
    - Start asset creation early (Week 1)
    - Use placeholder assets initially
    - Parallel asset creation with development
    - Asset library as fallback

    #### Risk 4: Scope Creep
    **Probability:** High  
    **Impact:** High  
    **Mitigation:**
    - Strict feature prioritization
    - MVP-first approach
    - Feature flags for gradual rollout
    - Post-launch roadmap for deferred features

    ### Business Risks

    #### Risk 1: User Adoption of Game Mechanics
    **Probability:** Medium  
    **Impact:** High  
    **Mitigation:**
    - User testing at each phase
    - Analytics on engagement metrics
    - Iterative improvements based on data
    - Optional game mode (can disable)

    #### Risk 2: AI Cost Overruns
    **Probability:** Medium  
    **Impact:** Medium  
    **Mitigation:**
    - Rate limiting on AI calls
    - Caching of AI responses
    - Batch processing where possible
    - Cost monitoring and alerts

    ---

    ## 13. Success Metrics

    ### Phase 1 Success Criteria (Week 12)

    **Technical:**
    - [ ] Phaser canvas renders at 60 FPS on desktop
    - [ ] Phaser canvas renders at 30+ FPS on mobile
    - [ ] World map displays correctly for Venture template
    - [ ] Quality score calculation is accurate
    - [ ] Zero critical bugs

    **User Experience:**
    - [ ] Users can navigate world map intuitively
    - [ ] Checkpoint progression is visually clear
    - [ ] Quality score is understandable

    ### Phase 2 Success Criteria (Week 24)

    **Technical:**
    - [ ] All 4 templates functional
    - [ ] AI scoring accuracy >80% (vs manual review)
    - [ ] AI response time <3 seconds
    - [ ] Template switching works seamlessly

    **User Experience:**
    - [ ] Users understand template differences
    - [ ] AI feedback is perceived as valuable
    - [ ] Template selection is intuitive

    ### Phase 3 Success Criteria (Week 36)

    **Technical:**
    - [ ] HUD updates in real-time
    - [ ] Animations run smoothly (60 FPS)
    - [ ] Persona system works on all devices
    - [ ] No memory leaks in long sessions

    **User Experience:**
    - [ ] HUD is not intrusive
    - [ ] Animations feel rewarding
    - [ ] Persona selection is engaging

    ### Phase 4 Success Criteria (Week 48)

    **Technical:**
    - [ ] Audio plays correctly on all browsers
    - [ ] Matching algorithm produces relevant results
    - [ ] Full E2E test coverage
    - [ ] Performance benchmarks met

    **User Experience:**
    - [ ] Audio enhances experience (not annoying)
    - [ ] Matching suggestions are useful
    - [ ] Overall platform feels polished

    ### Launch Metrics (Post-Week 48)

    **Engagement:**
    - 70%+ of users complete at least 1 checkpoint
    - 40%+ of users complete at least 1 stage
    - 20%+ of users complete a full venture
    - Average session time: 15+ minutes

    **Retention:**
    - Day 1: 60%+
    - Day 7: 40%+
    - Day 30: 25%+

    **Quality:**
    - AI scoring satisfaction: 4+/5
    - Template variety satisfaction: 4+/5
    - Overall platform satisfaction: 4+/5

    ---

    ## 14. Next Steps & Immediate Actions

    ### Week 1 Actions

    **Development Team:**
    1. [ ] Set up Phaser 3 in Next.js project
    2. [ ] Create basic canvas mounting system
    3. [ ] Implement React-Phaser event bridge POC
    4. [ ] Set up Storybook for component development

    **Design Team:**
    1. [ ] Start Village biome concept art
    2. [ ] Create checkpoint node sprite designs
    3. [ ] Design HUD mockups
    4. [ ] Create persona concept sketches

    **Backend Team:**
    1. [ ] Design quality scoring schema
    2. [ ] Set up AI API accounts (OpenAI, Replicate)
    3. [ ] Create template system architecture doc
    4. [ ] Plan database migrations

    **Project Management:**
    1. [ ] Set up project tracking (Jira/Linear)
    2. [ ] Create detailed sprint plans for Q1
    3. [ ] Schedule weekly sync meetings
    4. [ ] Set up staging environment

    ### Week 2-4 Focus

    - Complete Phaser integration
    - Finalize world map architecture
    - Begin Village + Forest biome development
    - Set up AI integration infrastructure

    ---

    ## 15. Appendix

    ### A. Technology Decisions

    **Why Phaser 3?**
    - Mature 2D game engine
    - Good React integration patterns
    - Strong community support
    - Performance optimized
    - Free and open source

    **Why Howler.js?**
    - Industry standard for web audio
    - Cross-browser compatibility
    - Sprite sheet support
    - Volume controls built-in
    - Lightweight

    **Why OpenAI/Anthropic?**
    - Best-in-class language models
    - Reliable API
    - Good documentation
    - Reasonable pricing
    - Easy integration

    ### B. Alternative Approaches Considered

    **PixiJS instead of Phaser:**
    - Pros: Lighter weight, more flexible
    - Cons: Less game-specific features, more custom code
    - Decision: Phaser for game-specific features

    **Three.js for 3D:**
    - Pros: More impressive visuals
    - Cons: Higher complexity, performance concerns
    - Decision: 2D for MVP, 3D for future

    **Custom audio system:**
    - Pros: Full control
    - Cons: Browser compatibility nightmare
    - Decision: Howler.js for reliability

    ### C. Glossary

    - **Checkpoint:** A node in the venture progression (36 total)
    - **Stage:** A major phase of the venture (8 total)
    - **Boss:** An antagonist representing a challenge
    - **Corruption:** A meter representing project entropy
    - **Quality Score:** AI-assessed measure of work quality
    - **Template:** A project type (Venture, Academic, Lab, Creative)
    - **Persona:** User's character avatar in the game world
    - **HUD:** Heads-Up Display (always-visible UI elements)

    ---

    ## Document Control

    **Version History:**
    - v1.0 (April 17, 2026): Initial technical PRD

    **Approvals Required:**
    - [ ] Engineering Lead
    - [ ] Product Manager
    - [ ] Design Lead
    - [ ] CTO

    **Next Review:** End of Week 12 (Phase 1 completion)

    ---

    **END OF DOCUMENT**

