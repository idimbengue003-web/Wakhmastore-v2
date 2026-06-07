---
Task ID: 1
Agent: Main Agent
Task: Integrate Wakhma Store project and add new features

Work Log:
- Cloned wakhma-store from GitHub into /home/z/my-project/wakhma-store/
- Read and analyzed the entire project structure (Next.js 16 + Prisma + Zustand + JWT)
- Initialized fullstack dev environment with skill initialization
- Set up Prisma schema adapted for SQLite (original was PostgreSQL)
- Ran prisma db push to create database
- Copied all source files (components, pages, API routes, lib) from wakhma-store to main project
- Updated globals.css with Wakhma Store custom theme variables
- Updated layout.tsx with Wakhma Store's layout (Navbar, AuthProvider, Footer)
- Replaced home page with Wakhma Store's home page
- Adapted migrate.ts for SQLite compatibility

New Features Added:
1. **Annonce Detail Page** (`/annonces/[id]`):
   - Full detail view with photo, title, price, description, seller info
   - Trust indicators (verified, fast response, popular)
   - Masked WhatsApp number preview
   - Confirmation modal before revealing phone number
   - Shows cost in points and user balance before confirming
   - Insufficient points warning with link to recharge
   - Share and report buttons
   - Days left before expiry indicator
   - Owner detection (shows "your annonce" message)

2. **Redesigned Recharge & Subscription Page** (`/recharge`):
   - Tab-based navigation between Points and Abonnements
   - Points tiers with visual cards, "Popular" and "Best value" badges
   - Subscription tiers with feature comparison and pulse-glow animation
   - Balance card showing current points and subscription status
   - WhatsApp payment flow with step-by-step instructions
   - Payment confirmation with order reference tracking
   - How points work section

3. **Updated DemandCard component**:
   - Now navigates to detail page instead of inline reveal
   - Cleaner "Voir les détails" CTA button
   - Wrapped in Link component for navigation

4. **Added single demand API** (`/api/demands/[id]`):
   - Fetches single demand with full details
   - Same phone masking and reveal logic as list endpoint

5. **Updated Home Page AnnonceCard**:
   - Links to detail page instead of inline reveal
   - Consistent "Voir les détails" button

Stage Summary:
- All original Wakhma Store features preserved
- New annonce detail page with confirmation before reveal
- New recharge page with improved UI and payment flow
- All pages load correctly (tested with curl)
- Database seeded with demo data
- Lint errors fixed (checkPaymentStatus declaration order)
