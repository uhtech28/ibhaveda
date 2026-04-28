# Idea to Map Flow Implementation

## Overview
Implemented a seamless flow where users post ideas that appear in "My Ideas" page, and clicking on an idea card navigates to the map to start the venture journey. Gender selection is stored in the database as a one-time choice.

## Changes Made

### 1. Database Schema Update (`convex/schema.ts`)
- Added `personaGender` field to users table
- Type: `v.optional(v.union(v.literal("male"), v.literal("female")))`
- Stores the user's character gender selection permanently

### 2. New Convex Mutations (`convex/users.ts`)
- **`updatePersonaGender`**: Saves gender selection to database (one-time)
- **`getPersonaGender`**: Retrieves saved gender from database

### 3. Composer Modal (`src/components/ideaforge/composer-modal.tsx`)
- "Publish Idea" button navigates to `/create-idea` (standard flow)
- Idea gets created and appears in "My Ideas" page

### 4. My Ideas Page Navigation (`src/app/my-feed/page.tsx`)
- Updated `onIdeaClick` handler to navigate to `/map` instead of `/idea/{id}`
- When user clicks on any idea card in "My Ideas", they go to the map

### 5. Map Page Intelligence (`src/app/map/page.tsx`)
- Checks database for saved gender on load
- **If gender exists**: Skips selection screen, navigates directly to stages
- **If no gender**: Shows character selection screen
- Saves gender to database on first selection
- Maintains localStorage sync for backward compatibility

## User Flow

### Posting an Idea
1. User clicks "Post Idea" button
2. Selects category (Venture/Academic/Creative/Lab)
3. Fills in idea details with AI assistance
4. Clicks "Publish Idea"
5. Navigates to `/create-idea` to complete publishing
6. Idea appears in "My Ideas" page

### Starting the Venture Journey
1. User goes to "My Ideas" page
2. Sees their published ideas with venture badges
3. **Clicks on an idea card**
4. **Navigates to `/map`**
5. System checks for saved gender:
   - **First time**: Shows gender selection screen
   - **Returning user**: Skips directly to map stages
6. Venture journey begins!

## Benefits

✅ **Clear Separation**: Ideas are posted and stored first
✅ **One-Time Gender Selection**: Saved permanently in database
✅ **Direct Map Access**: Click any idea card to start venture
✅ **No Repetition**: Gender selection only shown once
✅ **Data Persistence**: Gender stored in Convex database
✅ **Smooth Navigation**: Seamless flow from ideas to map

## Technical Details

- Gender stored in `users.personaGender` field
- Database query on map load checks for existing selection
- Mutation updates user profile with gender choice
- Idea cards in "My Ideas" navigate to `/map` on click
- Feed page idea cards still navigate to `/idea/{id}` for viewing
- Loading states prevent UI flicker during checks
