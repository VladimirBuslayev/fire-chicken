# Illustrated — Changelog

## v0.1 — Current single-file MVP

Date: 2026-06-23

State:

- GitHub Pages deployment works
- Custom domain works
- App is still primarily contained in `index.html`
- Service worker exists in `sw.js`
- Sync/backfill scripts exist in `sync/`
- Supabase is being introduced as runtime card source
- TCGdex remains a source/sync provider

Known working areas to preserve:

- artist browsing
- card modal
- CSV import
- owned/missing state
- manual overrides
- bookmarks/favorites
- share/binder view
- eBay sold links
- pricing display where available
- image fallback behavior

Known risk:

The app is becoming too large and fragile as a single-file MVP.

Next planned step:

Gate 1 stabilization audit.
