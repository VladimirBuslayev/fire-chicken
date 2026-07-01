# Illustrated — Current State

Last updated: 2026-06-25

## Production version

Version: v0.1.4 — Gate 1 enrichment read-model (deployed and validated)

Production app: https://illustratedvault.com

The production app is served from the `main` branch as a single-file `index.html` with `sw.js` service worker and GitHub Pages deployment. This has not changed.

## Gate 2 migration — branch status

Branch: `gate-2/vite-migration`

Gate 2 is in progress. It is not closed. The Vite app is not deployed to production. `illustratedvault.com` continues to serve the single-file `index.html` from `main`.

### Gate 2 phases — completed and validated

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Vite scaffold (index.html, package.json, vite.config.js, tailwind, postcss, src/main.jsx stub, deploy workflow) | Closed / build-validated |
| Phase 2A | Static asset extraction (base64 blobs → public/ and src/assets/) | Closed / build-validated |
| Phase 2B | Service worker placement (public/sw.js byte-for-byte copy of root sw.js) | Closed / build-validated |
| Phase 3 | Constants and utilities extraction (setOrder.js, artists.js, config.js, cache.js, slug.js, keys.js, cardUtils.js, sort.js) | Closed / build-validated |
| Phase 4A | Supabase client boundary (src/services/supabaseClient.js) | Closed / build-validated |
| Phase 4B | Legacy inventory audit | Closed / no code changes |
| Phase 4C | Remaining pure utilities (format.js, imageUrl.js) | Closed / build-validated |
| Phase 4D | Service extraction (collectionService.js, shareService.js, cardAdapter.js, imageService.js, tcgdexService.js, cardService.js) | Closed / build-validated |
| Phase 4D Repair | Repaired broken self-import stubs in Phase 4C/4D files | Closed / build-validated |
| Phase 5A | Vite boundary smoke test (minimal src/App.jsx proving ES module resolution) | Closed / build-validated |
| Phase 5B | Full App port (complete React component tree from index.legacy.html into src/App.jsx) | Closed / build-validated |
| Phase 5C | Local core parity audit | Passed |
| Phase 5D | Gate 2 checkpoint documentation update | This document |

### Gate 2 phases — remaining before close

| Phase | Description | Blocking? |
|---|---|---|
| Phase 5E | Isolated HTTPS preview deployment (Vercel or Netlify; not GitHub Pages) | Yes |
| Phase 5F | Auth/OTP validation on live HTTPS URL; SharedBinder real-token validation | Yes |
| Phase 5G | Service worker registration (add SW registration script to index.html) | Yes |
| Phase 5H | Production deployment (replace live app with Vite build) | Yes |
| Phase 5I | Gate 2 close (update docs, archive index.legacy.html) | Yes |

Component extraction (splitting src/App.jsx into per-component files) is deferred to Phase 7 or later, after Gate 2 closes and production stability is confirmed.

## Current repo structure — gate-2/vite-migration branch

### New Vite/React structure (on branch, not yet in production)

```
src/
  App.jsx              — full React component tree (1,266 lines); single file for now
  main.jsx             — entry point; wires App, SharedBinder, ErrorBoundary, ?share= routing
  assets/
    logo.webp          — Blaziken logo (extracted from base64 in Phase 2A)
  constants/
    artists.js         — ARTISTS, ARTIST_FACTS, ARTIST_META
    config.js          — CACHE_TTL, PRICE_VARIANT_ORDER
    setOrder.js        — SET_ORDER (chronological set sort index)
  services/
    supabaseClient.js  — ES module Supabase client (sb → supabase)
    cardService.js     — fetchArtistCards (artist path: Supabase cards_effective)
    collectionService.js — loadUserData, saveCollection, saveOverride, savePricePoint
    shareService.js    — fetchSharedCollection (RPC call)
    cardAdapter.js     — supaRowToCard (Supabase row → TCGdex card shape)
    imageService.js    — fetchFallbackImage, buildLimitlessGuess
    tcgdexService.js   — fetchCardBriefs, fetchFullCard (entry.isSet path only)
  styles/
    index.css          — all global CSS verbatim from index.legacy.html <style> block
  utils/
    cache.js           — lsGet, lsSet, lsDel
    cardUtils.js       — isTcgPocketCard
    format.js          — fmtPrice, todayStr
    imageUrl.js        — imgSmall, imgLarge
    keys.js            — normName, normNum, normSet, makeKeys, isCardOwned
    slug.js            — toSlug
    sort.js            — getBestPrice, sortCards
public/
  apple-touch-icon.png — extracted Phase 2A
  favicon.png          — extracted Phase 2A
  manifest.json        — extracted Phase 2A
  icons/
    icon-192.png       — extracted Phase 2A
    icon-512.png       — extracted Phase 2A
  sw.js                — byte-for-byte copy of root sw.js (Phase 2B)
index.html             — minimal Vite entry (PWA meta tags, font links, root div)
index.legacy.html      — 1,680-line single-file legacy app; source-of-truth reference; untouched
package.json           — Vite 5, React 18, @supabase/supabase-js, papaparse
vite.config.js         — Vite configuration
tailwind.config.js     — custom color tokens matching legacy inline config
postcss.config.js      — PostCSS configuration
sw.js                  — root service worker (original; preserved)
```

### Production structure (main branch, unchanged)

```
index.html             — single-file MVP app (production)
sw.js                  — service worker (production)
CNAME                  — custom domain (illustratedvault.com)
sync/                  — data sync / backfill scripts
.github/workflows/     — GitHub Actions
```

## Current architecture — Vite branch

### Component root

`src/App.jsx` is the current Vite component root. It contains the full component tree as a single file, which matches the legacy approach and is intentional for Gate 2. Component splitting into `src/components/` is deferred to Phase 7.

Components in `src/App.jsx` (in order):
- Icons: Ico, IcoSearch, IcoUpload, IcoX, IcoGear, IcoCheck, IcoRetry, IcoEdit, IcoSpin, IcoChev, IcoNoImage, IcoInfo, IcoEye, IcoContrast
- BlazLogo (uses imported `logoSrc` from `./assets/logo.webp`)
- FlameBackground
- LandingPage
- Dashboard
- CardTile
- PriceChart (hand-coded SVG; no external chart library)
- CardModal
- ArtistPage
- ArtistSection
- ArtistPicker
- ShareLinkPanel
- SettingsPanel
- ErrorBoundary (class component; React 18 compatible)
- SharedBinder
- App

### Entry point

`src/main.jsx` wires:
- `<ErrorBoundary>` as the top-level boundary
- `?share=TOKEN` URL detection → `<SharedBinder token={TOKEN} />`
- All other routes → `<App />`

This mirrors the legacy `ReactDOM.createRoot` call at the bottom of `index.legacy.html` exactly.

### Service layer (wired; not yet in production)

All service functions are in `src/services/`. The extracted service modules are imported by `src/App.jsx` and called from component event handlers and effects — the same call sites as the legacy inline functions. No new Supabase calls, no new product behavior.

### Data flow — unchanged

Artist-path card display: `src/App.jsx` → `cardService.fetchArtistCards` → Supabase `cards_effective`

Set-path card display (e.g. Pokémon GO set): `cardService.fetchArtistCards` → `tcgdexService.fetchCardBriefs` → TCGdex `/sets/{setId}` → `tcgdexService.fetchFullCard`

TCGdex illustrator lookup (`/illustrators/`) is not used. The illustrator branch was intentionally excluded from `tcgdexService.js` during Gate 2 (see DECISION_LOG.md).

### Service worker

`public/sw.js` exists and is correct. Service worker registration (the `<script>` tag in `index.html`) is intentionally deferred to Phase 5G, immediately before production deployment.

## Product direction

Unchanged from Gate 1. See v0.1.4 CURRENT_STATE for the full product statement.

Illustrated is a premium visual archive and collection companion for Pokémon card collectors. The differentiator is artist-first and artwork-first browsing. Pricing is present as buying guidance, not price authority.

## Supabase objects — unchanged

No Supabase schema, SQL, tables, views, policies, or RPCs were modified during Gate 2. The Supabase state is exactly as it was at v0.1.4.

`cards_effective` remains the frontend read model. `get_shared_collection` RPC is preserved. All RLS policies, view access, and data contracts are unchanged.

See v0.1.4 CURRENT_STATE for the full Supabase object inventory.

## Known limitations — unchanged from Gate 1

- Null illustrator enrichment for swsh9–swsh12.5: bulk data-quality pass pending; not a Gate 2 blocker
- Artist alias confirmation for Saya Tsuruta (full-width space) and Masakazu Fukuda (typo variant): unconfirmed
- Pricing features deferred: confidence labels, staleness display, Cardmarket link button, price alerts

## Gate 2 constraints active

- Do not modify `index.legacy.html`
- Do not create `public/CNAME`
- Do not trigger production deployment
- Do not modify Supabase schema, SQL, policies, tables, views, or RPCs
- Do not change pricing behavior
- Do not change owned/missing/favorites/share behavior
- Do not expand TCGdex usage beyond the existing `entry.isSet` path
- Do not extract components until Gate 2 is closed
- Do not add features
- Do not redesign
