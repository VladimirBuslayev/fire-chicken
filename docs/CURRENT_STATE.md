# Illustrated — Current State

Last updated: 2026-07-01

## Production version

Gate 2 complete — Vite/React app deployed and validated.

Production app: https://illustratedvault.com

Production is served from Vercel. Vercel production branch: `gate-2/vite-migration`.

Commit history for current Vercel production deployments:
- `d707abc` — "Register service worker for Vite app" — original Phase 5H production
  cutover validated commit. This is the commit that was validated end-to-end before
  production was declared stable.
- `4198689` — later deployment on `gate-2/vite-migration` after the workflow
  conflict-resolution merge ("Merge branch 'main' into gate-2/vite-migration").
  This is the current Vercel production deployment. It changed only
  `.github/workflows/build-check-gate2.yml`; app behavior is identical to `d707abc`.

`main` branch:
- Contains the complete Vite/React project structure.
- Merged from `gate-2/vite-migration` via PR #2 on 2026-07-01 (merge commit `a03aff7`).
- Merging to `main` created a Vercel Preview deployment only. Production continues
  to run from the `gate-2/vite-migration` branch.
- Migrating the Vercel production branch from `gate-2/vite-migration` to `main`
  is a deferred cleanup item.

Phase 5I status: In progress — PR merged; docs/tag pending.

## Gate 2 migration — status

Gate 2 is complete. The Vite/React app is in production. `gate-2/vite-migration`
has been merged into `main` via PR #2. No feature work or product behavior changes
were introduced during Gate 2.

### Gate 2 phases — all completed and validated

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
| Phase 5D | Gate 2 checkpoint documentation update | Closed |
| Phase 5E | Vercel preview deployment (isolated HTTPS) | Closed / validated |
| Phase 5F | Auth/OTP + SharedBinder real-token validation on live HTTPS | Closed / validated |
| Phase 5G | Service worker registration in index.html | Closed / validated |
| Phase 5H | Production cutover (Vercel, apex DNS, Supabase site URL/redirects) | Closed / validated |
| Phase 5I | Gate 2 PR close (conflict resolution, merge to main, docs, tag) | In progress — PR merged; docs/tag pending |

## Current repo structure — main branch (post-Gate-2 merge)

### Vite/React structure (production)

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
  sw.js                — Vite app service worker (byte-for-byte copy of root sw.js)
index.html             — Vite entry point (PWA meta tags, font links, root div, SW registration)
index.legacy.html      — 1,680-line single-file legacy app; rollback reference; do not delete yet
package.json           — Vite 5, React 18, @supabase/supabase-js, papaparse
vite.config.js         — Vite configuration
tailwind.config.js     — custom color tokens matching legacy inline config
postcss.config.js      — PostCSS configuration
sw.js                  — root service worker (legacy; rollback reference; do not delete yet)
CNAME                  — custom domain record (GitHub Pages; rollback reference; do not delete yet)
sync/                  — data sync / backfill scripts
.github/workflows/     — GitHub Actions workflows
```

## Current architecture — Vite/React app

### Component root

`src/App.jsx` is the current component root. It contains the full component tree as a single
file, which matches the legacy approach and is intentional for Gate 2. Component splitting into
`src/components/` is deferred to Phase 7.

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

### Service layer

All service functions are in `src/services/`. The extracted service modules are imported by
`src/App.jsx` and called from component event handlers and effects — the same call sites as
the legacy inline functions. No new Supabase calls, no new product behavior.

### Data flow — unchanged

Artist-path card display: `src/App.jsx` → `cardService.fetchArtistCards` → Supabase `cards_effective`

Set-path card display (e.g. Pokémon GO set): `cardService.fetchArtistCards` → `tcgdexService.fetchCardBriefs` → TCGdex `/sets/{setId}` → `tcgdexService.fetchFullCard`

TCGdex illustrator lookup (`/illustrators/`) is not used. The illustrator branch was intentionally excluded from `tcgdexService.js` during Gate 2 (see DECISION_LOG.md).

### Service worker

`public/sw.js` is the Vite app service worker. SW registration script is present in `index.html`
(added in Phase 5G). Service worker is registered and validated in production.

## Product direction

Unchanged from Gate 1. See PRODUCT_BRIEF.md.

Illustrated is a premium visual archive and collection companion for Pokémon card collectors.
The differentiator is artist-first and artwork-first browsing. Pricing is present as buying
guidance, not price authority.

## Supabase objects — unchanged

No Supabase schema, SQL, tables, views, policies, or RPCs were modified during Gate 2.
The Supabase state is exactly as it was at v0.1.4.

`cards_effective` remains the frontend read model. `get_shared_collection` RPC is preserved.
All RLS policies, view access, and data contracts are unchanged.

See v0.1.4 CURRENT_STATE (CHANGELOG.md) for the full Supabase object inventory.

## Known limitations — unchanged from Gate 1

- Null illustrator enrichment for swsh9–swsh12.5: bulk data-quality pass pending; not a Gate 2 blocker
- Artist alias confirmation for Saya Tsuruta (full-width space) and Masakazu Fukuda (typo variant): unconfirmed
- Pricing features deferred: confidence labels, staleness display, Cardmarket link button, price alerts

## Rollback artifacts — retained

The following are preserved for rollback safety. Do not delete until Gate 2 stabilization
is confirmed and explicit cleanup approval is given:

- Root `CNAME` — GitHub Pages domain record
- Root `sw.js` — legacy service worker
- `index.legacy.html` — single-file source-of-truth reference
- `gate-2/vite-migration` branch
- Old Supabase redirect URL: `https://vladimirbuslayev.github.io/fire-chicken/`
- GitHub Pages configuration (not yet disabled)

## Deferred cleanup items

| Item | Notes |
|---|---|
| Vercel production branch → `main` | After stabilization is confirmed |
| GitHub Pages disable | After rollback window closes |
| Old Supabase redirect URL removal | After rollback window closes |
| Root `sw.js` and `CNAME` removal from `main` | After GitHub Pages disable |
| `gate-2/vite-migration` branch deletion | After rollback window closes |
| `deploy-gate2.yml` workflow review | Historical artifact; no longer production deploy path |
