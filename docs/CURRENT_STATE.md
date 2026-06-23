# Illustrated — Current State

Last updated: 2026-06-23

## Current version

Version: v0.1.1 — Gate 1 stabilization patch applied

Illustrated is currently deployed at:

https://illustratedvault.com

The app is still primarily built from a single `index.html` file, with a supporting `sw.js` service worker, GitHub Pages deployment, and sync scripts.

## Current repo structure

- `.github/workflows/` — GitHub Actions workflows
- `sync/` — data sync / backfill scripts
- `CNAME` — custom domain configuration
- `README.md` — basic repo readme
- `index.html` — main single-file app
- `sw.js` — service worker

## Product direction

Illustrated is a premium visual archive and collection companion for Pokémon card collectors.

The differentiator is artist-first and artwork-first browsing, not simply price tracking.

The product should feel:

- premium
- calm
- visual
- curated
- collector-focused
- less gaming UI
- more archive / vault / gallery

## Current architecture

Current state:

- Single-file MVP: yes
- Frontend runtime: `index.html`
- Deployment: GitHub Pages
- Domain: `illustratedvault.com`
- Database: Supabase
- External card source: TCGdex
- Intended direction: TCGdex as ingestion/sync source; Supabase as runtime source of truth

## Working features to preserve

Before any refactor or migration, preserve:

- artist pages
- card grid
- card modal
- CSV import
- collection ownership state
- manual owned/missing overrides
- bookmarks/favorites
- share/binder view
- image fallback logic
- eBay sold links
- pricing display where available
- cache/localStorage behavior
- GitHub Pages deployment

## Known limitations

### Pricing — intentionally stubbed

Pricing is intentionally not implemented for Supabase-backed artist cards. `supaRowToCard` sets `pricing: null` because no pricing column or pricing table exists in Supabase yet. As a result:

- The card modal always shows "No pricing data" for artist cards
- TCGPlayer and Cardmarket price display are inactive
- Price-based sort modes fall back to name sort
- Price history recording does not run for artist cards

This is a known gap, not a bug. Pricing will be addressed when a Supabase pricing column or dedicated pricing table is introduced. Do not patch around this by hardcoding values or inventing columns.

### Supabase data contract — partially implemented

The following fields are currently selected and mapped in `fetchArtistCards` / `supaRowToCard`:

- `id`, `name`, `set_id`, `set_name`, `local_id`, `illustrator`, `image_url`, `rarity` — selected and mapped
- `release_date` — selected, ordered by, and now mapped as `releaseDate` (added in v0.1.1)
- `pricing` — not yet in Supabase; hardcoded `null` in mapping

Fields listed in the architecture data contract but not yet implemented: `source`, `source_card_id`, `artist_id`, `illustrator_raw`, `language`, `variants`, `tcgplayer_url`, `ebay_sold_url`, `price_confidence`.

### Artist alias coverage — unconfirmed

The following aliases have not been confirmed against live Supabase data:

- Saya Tsuruta — full-width Unicode space variant
- Masakazu Fukuda — typo variant ("Masayuki Fukuda")

## Known strategic risk

The app is becoming too large and fragile as a single-file MVP.

The next priority is not new features. The next priority is continued stabilization, then migration readiness.

## Current gate

Gate 1 — Stabilize current MVP.

The Gate 1 stabilization patch (v0.1.1) has been merged. The following items from the original audit have been resolved:

- Clear Cache cancel behavior fixed
- Clear Cache confirm copy corrected
- `release_date` now mapped as `releaseDate` in `supaRowToCard`
- `pb_fallback_img_*` keys now purged by Clear Cache
- Stale TCGdex concurrency comment corrected

The following items identified in the audit remain open and are tracked above under Known Limitations:

- Pricing is intentionally stubbed pending a Supabase pricing column
- `cmUrl` computed but not rendered (deferred until pricing is live)
- Artist alias coverage for Saya Tsuruta and Masakazu Fukuda unconfirmed

Do not add major new features until the Supabase pricing data contract is defined and the remaining open items are resolved or explicitly deferred.

## Do not do yet

- Do not redesign UI
- Do not migrate to Vite yet
- Do not add set browsing yet
- Do not add Japanese cards yet
- Do not add pricing confidence yet
- Do not silently invent Supabase columns

