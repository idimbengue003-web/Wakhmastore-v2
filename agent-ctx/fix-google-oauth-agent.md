# Task: Fix Google OAuth Reliability Issue in AuthForms

## Problem
The Google OAuth button in the Wakhma Store v2 AuthForms component was sometimes unresponsive when clicked. The root causes were:
1. No existing Google OAuth implementation — the AuthForms had only phone/password login
2. The Google Identity Services (GIS) library needs to be loaded asynchronously before the button can work
3. No loading states or error handling for when the GIS library isn't ready yet

## Changes Made

### 1. Prisma Schema Update (`prisma/schema.prisma`)
- Added `email String?` field to User model
- Added `googleId String? @unique` field to User model
- Added `@@index([googleId])` index
- Pushed schema to database successfully

### 2. TypeScript Declaration (`src/types/google.d.ts`) — NEW FILE
- Created type declarations for Google Identity Services API
- Includes interfaces for: `Window.google`, `GoogleIdConfig`, `GoogleCredentialResponse`, `GooglePromptNotification`, `GoogleRenderButtonOptions`

### 3. Google Auth API Route (`src/app/api/auth/google/route.ts`) — NEW FILE
- POST endpoint that receives a Google credential token
- Verifies the token server-side using `google-auth-library` (OAuth2Client)
- Looks up existing users by `googleId` or `email`
- Creates new users with placeholder phone `goog_{googleId}` for Google-only accounts
- Links existing accounts by adding the `googleId` when matched by email
- Signs a JWT token and sets it as `wakhma_token` cookie (same as existing auth flow)
- Returns the user object in the same format as `/api/auth/login`

### 4. AuthForms Component (`src/components/AuthForms.tsx`) — MAJOR UPDATE
- **Shared GIS Script Loader** (`loadGoogleGisScript`): Singleton promise that loads the GIS script exactly once across all component instances, with timeout and retry support
- **GoogleSignInButton Component**: Reusable button shared between Login and Register forms
  - Tracks 3 states: `googleLoading` (GIS script loading), `googleLoaded` (GIS ready), `submitting` (auth in progress)
  - Uses `google.accounts.id.prompt()` (more reliable than `renderButton`)
  - Handles `isNotDisplayed()` and `isSkippedMoment()` callback with specific error messages
  - Shows spinner/loader when GIS is not ready yet — button is disabled until library loads
  - Uses refs for callbacks to avoid re-initializing Google on prop changes
  - If GIS fails to load, shows error and retries on click
- **LoginForm**: Added Google button above "ou" divider, with error handling
- **RegisterForm**: Added Google button above "ou" divider, with error handling

### 5. Dependencies Installed
- `google-auth-library@10.7.0` — Server-side Google token verification
- `bcryptjs@3.0.3` — Was missing, needed by auth.ts
- `jsonwebtoken@9.0.3` — Was missing, needed by auth.ts

## Key Reliability Fixes
1. **Script loaded on mount**: GIS script starts loading as soon as the component mounts, not on click
2. **Loading state visible**: Button shows "Chargement..." with spinner while GIS loads
3. **Button disabled until ready**: Prevents clicks before the library is initialized
4. **Shared script loader**: `gisLoadPromise` singleton ensures script loads exactly once
5. **Retry on click**: If GIS somehow isn't ready when clicked, attempts to load again
6. **Error handling**: Specific French error messages for: cancelled, browser not supported, general unavailability
7. **Callback via refs**: `callbackRef` and `errorRef` prevent stale closures and avoid re-initializing Google

## Database
- SQLite database at `file:/home/z/my-project/db/custom.db`
- Schema pushed and verified — `email` and `googleId` columns present in User table
