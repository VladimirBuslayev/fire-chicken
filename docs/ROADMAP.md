# Illustrated — Roadmap

## Gate 1 — Stabilize current MVP

Objective:

Make the current single-file app reliable before migration.

Acceptance criteria:

- Artist pages render from Supabase where intended
- Card modal opens for Supabase-fetched cards
- Pricing displays when pricing data exists
- No-pricing state remains clean
- eBay sold links still work
- CSV import still works
- Owned/missing state still works
- Manual owned/missing overrides still work
- Bookmarks/favorites still work
- Share/binder view still works
- Cache clearing works
- Console has no obvious errors
- Deployment still works

Do not add features during this gate.

## Gate 2 — Modular migration

Objective:

Move existing behavior into a maintainable app structure.

Target:

- Vite
- React modules
- separated services
- centralized card mapping
- centralized pricing logic
- centralized collection/import logic
- centralized cache utility

Acceptance criteria:

- Same visible app behavior as MVP
- No feature regression
- GitHub Pages deployment still works
- Domain still works
- Project structure is understandable

## Gate 3 — Data model improvement

Objective:

Prepare the app for larger scale and better data quality.

Priorities:

- normalized artists
- artist aliases
- set table
- language/source identity
- card extras/manual corrections
- better card identity handling

## Gate 4 — Product expansion

Features to consider after foundation:

- set browsing
- wishlist
- collection dashboard
- improved binder/share view
- Japanese cards
- pricing confidence labels
- last-updated pricing context
- manual card corrections
- richer artist pages

## Gate 5 — App readiness

Objective:

Move toward a polished public beta.

Priorities:

- mobile polish
- onboarding
- account settings
- PWA install flow
- freemium boundaries
- app-store wrapper decision
- performance and image loading polish
