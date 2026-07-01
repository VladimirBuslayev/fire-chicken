# Illustrated — Changelog

## Gate 2 close — Phase 5I — 2026-07-01

Gate 2 Vite migration is complete. `gate-2/vite-migration` merged into `main`
via PR #2 (merge commit `a03aff7`). No app code, Supabase schema, or product
behavior was changed during Phase 5I. No feature work was introduced during Gate 2.

Phase 5I status: In progress — PR merged; docs/tag pending.

### Phase 5I — Gate 2 PR and main cleanup

- PR #2 conflict resolved: single file `.github/workflows/build-check-gate2.yml`.
  Accepted `main`-side version (includes parameterized branch input).
- PR #2 merged to `main` using merge commit strategy (merge commit `a03aff7`).
- Merging to `main` created a Vercel Preview deployment only. Production was
  not affected; it continues to run from the `gate-2/vite-migration` branch.
- `gate-2/vite-migration` branch retained as rollback reference.

### Phase 5H — Production cutover

- Vercel production branch set to `gate-2/vite-migration`.
- Apex DNS updated: `A @ 216.198.79.1` → Vercel.
- Supabase site URL updated to `https://illustratedvault.com`.
- Supabase redirect URLs updated (old GitHub Pages URL retained for rollback).
- Production domain `https://illustratedvault.com` now serves Vite/React app.
- Original production-validated cutover commit: `d707abc`
  ("Register service worker for Vite app").
- Validated: auth, session, owned/missing, favorites, pricing, SharedBinder,
  PWA assets, `/manifest.json`, `/icons/icon-192.png`, `/sw.js`.
- No Supabase schema changes. No product behavior changes.

Note on subsequent production deployment: after the workflow conflict-resolution
merge ("Merge branch 'main' into gate-2/vite-migration", commit `4198689`) was
pushed to `gate-2/vite-migration`, Vercel deployed a new production build. This
commit changed only `.github/workflows/build-check-gate2.yml`; app behavior is
identical to `d707abc`.

### Phase 5I www cleanup

- `www.illustratedvault.com` added to Vercel.
- Redirect configured: `www.illustratedvault.com` → `illustratedvault.com` (307).
- Porkbun `www` CNAME updated from GitHub Pages to Vercel DNS target.
- `https://www.illustratedvault.com` redirects cleanly to apex. Validated.

### Phase 5G — Service worker registration

- SW registration script added to `index.html` (Phase 5G).
- `/sw.js` registered and validated on production.

### Phase 5F — Auth and SharedBinder validation

- Auth/OTP flow validated on live Vercel preview HTTPS URL.
- SharedBinder real-token resolution validated.
- Bad share token failure confirmed graceful.

### Phase 5E — Vercel preview deployment

- Vercel project created: `illustrated-vault` (team: Illustrated Vault).
- PR #2 opened as Draft to trigger Vercel preview integration.
- Preview deployment validated before production cutover.

### Rollback artifacts retained (not yet cleaned up)

- Root `CNAME` (GitHub Pages domain record)
- Root `sw.js` (legacy service worker)
- `index.legacy.html` (single-file source-of-truth reference)
- `gate-2/vite-migration` branch
- Old Supabase redirect URL (`https://vladimirbuslayev.github.io/fire-chicken/`)
- GitHub Pages configuration (not yet disabled)

### Deferred cleanup items

- Vercel production branch → `main` (when stabilization confirmed)
- GitHub Pages disable
- Old Supabase redirect URL removal
- Root `sw.js` and `CNAME` removal from `main`
- `gate-2/vite-migration` branch deletion
- `deploy-gate2.yml` review (no longer the production deployment path)

---

## gate-2/vite-migration branch — 2026-06-25

### Phase 5D — Gate 2 checkpoint documentation update

Status: This update.

Updated CURRENT_STATE.md, CHANGELOG.md, ARCHITECTURE.md, DECISION_LOG.md to reflect the validated state of the Gate 2 migration through Phase 5C. No code changes.

---

### Phase 5C — Local core parity audit

Status: Passed.

Ran `npm run build` locally and opened `npm run preview`. Compared Vite app behavior against `index.legacy.html` across core flows:

- App loads; spinner → dashboard with valid session; landing page with no session
- Binder opens; artist sections load from Supabase `cards_effective`
- Cards display correctly; owned/missing states visually consistent with legacy
- Console showed only expected pokemontcg.io fallback 404s (no ReferenceError, no TypeError)
- Network tab confirmed `cards_effective` requests after cache clear; no TCGdex `/illustrators/` calls observed
- Overall visual behavior consistent with legacy

Remaining flows requiring a live HTTPS URL (OTP login, SharedBinder real-token, auth redirect handling) are deferred to Phase 5E/5F.

---

### Phase 5B — Full App port

Status: Closed / build-validated. GitHub Actions: npm install succeeded, npm run build succeeded, Vite transformed 92 modules, dist/ produced, logo asset bundled correctly, no deploy occurred.

Replaced the Phase 5A smoke-test `src/App.jsx` with the full React component tree from `index.legacy.html` lines 446–1665. Updated `src/main.jsx` to wire ErrorBoundary, SharedBinder, and `?share=` routing.

Files changed:
- `src/App.jsx` — 1,266 lines; full component tree
- `src/main.jsx` — 23 lines; real entry point

Substitutions applied (behavior unchanged):
- `LOGO_DATA_URI` inline base64 → `import logoSrc from './assets/logo.webp'`
- `fmt$(...)` → `fmtPrice(...)` at 8 call sites (Dashboard, PriceChart ×2, CardModal ×5)
- `sb.*` → `supabase.*` at 12 call sites (auth handlers in App, ShareLinkPanel, handleToggleFavorite, clearManual)
- `window.Papa` → `import Papa from 'papaparse'`
- `SET_ORDER` direct usage in ArtistSection confirmed and import added (gap caught during implementation)
- `REDIRECT` constant (line 103): defined in legacy but never referenced in component code; omitted
- `useEnter`/`useLeave`: confirmed to be `onMouseEnter`/`onMouseLeave` JSX props, not custom hooks; no action needed

PriceChart confirmed to use hand-coded SVG only. No new npm dependency added.

`index.legacy.html` md5 `fa281f58d7152f8e5b9487c2c5f1e17e` — confirmed unchanged throughout.

---

### Phase 5A — Vite boundary smoke test

Status: Closed / build-validated. GitHub Actions: npm install succeeded, npm run build succeeded, dist/ produced, no deploy occurred.

Created a minimal `src/App.jsx` smoke-test component that imports `ARTISTS` from `./constants/artists.js` and `toSlug` from `./utils/slug.js` to prove ES module resolution. Updated `src/main.jsx` to render `<App />` instead of the placeholder div.

No SharedBinder routing, no ErrorBoundary, no auth, no Supabase calls — intentionally minimal for boundary validation only.

Files changed:
- `src/App.jsx` — created (smoke test)
- `src/main.jsx` — placeholder div → `<App />`

---

### Phase 4D Repair — Service-layer stub repair

Status: Closed / build-validated. Included in Phase 5A build validation.

Seven Phase 4C/4D files were discovered to be broken self-import stubs (each file imported from itself, providing no actual implementation). All seven were replaced with real function bodies copied mechanically from `index.legacy.html`.

Files repaired:

| File | Functions repaired |
|---|---|
| `src/utils/format.js` | `fmtPrice` (renamed from `fmt$`), `todayStr` |
| `src/utils/imageUrl.js` | `imgSmall`, `imgLarge` |
| `src/services/cardAdapter.js` | `supaRowToCard` |
| `src/services/tcgdexService.js` | `fetchCardBriefs` (set path only), `fetchFullCard` |
| `src/services/imageService.js` | `fetchFallbackImage`, `buildLimitlessGuess` |
| `src/services/collectionService.js` | `loadUserData`, `saveCollection`, `saveOverride`, `savePricePoint` |
| `src/services/shareService.js` | `fetchSharedCollection` |

`tcgdexService.js` note: the repaired version intentionally excludes the legacy illustrator lookup branch (`/illustrators/{name}`). That branch is not repaired or carried forward. `fetchCardBriefs` returns `[]` immediately when `entry?.isSet` is false. This enforces the Gate 2 rule that TCGdex is permitted only for `entry.isSet` paths. Artist-path display uses Supabase `cards_effective` exclusively.

`fmt$` renamed to `fmtPrice` in the module export. The legacy single-file shorthand used a trailing `$` character; the module name is cleaner for ESM. Function behavior is identical.

---

### Phase 4D — Service extraction

Status: Closed / build-validated.

Created:
- `src/services/collectionService.js`
- `src/services/shareService.js`
- `src/services/cardAdapter.js`
- `src/services/imageService.js`
- `src/services/tcgdexService.js`
- `src/services/cardService.js`

None of these were wired into `index.legacy.html`. They exist as the module-world service layer ready for Phase 5B.

`cardService.js` artist path queries `cards_effective`. Cache keys and TTL behavior are preserved.

---

### Phase 4C — Remaining pure utilities extraction

Status: Closed / build-validated. (Stubs later repaired in Phase 4D Repair.)

Created:
- `src/utils/format.js`
- `src/utils/imageUrl.js`

---

### Phase 4B — Legacy inventory audit

Status: Closed / no code changes.

Conclusion: auth/session handling should wait until a real Vite React app boundary exists (deferred to Phase 5B), because auth drives `setUser`, `setView`, and `loadData`.

---

### Phase 4A — Supabase client boundary

Status: Closed / build-validated.

Created `src/services/supabaseClient.js`. Additive only; not wired into legacy.

---

### Phase 3 — Constants and utilities extraction

Status: Closed / build-validated.

Created:
- `src/constants/setOrder.js`
- `src/constants/artists.js`
- `src/constants/config.js`
- `src/utils/cache.js`
- `src/utils/slug.js`
- `src/utils/keys.js`
- `src/utils/cardUtils.js`
- `src/utils/sort.js`

All values are verbatim copies from `index.legacy.html`. `makeKeys` output format is unchanged — any modification would break Supabase `user_collection.owned_keys` matching.

---

### Phase 2B — Service worker placement

Status: Closed / build-validated.

Created `public/sw.js` as a byte-for-byte copy of root `sw.js`. Root `sw.js` left in place. Service worker registration in `index.html` intentionally deferred to Phase 5G.

---

### Phase 2A — Static asset extraction

Status: Closed / build-validated.

Extracted base64-embedded assets from `index.legacy.html`:
- `public/apple-touch-icon.png`
- `public/favicon.png`
- `public/manifest.json`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `src/assets/logo.webp`

`index.html` updated with `<link>` tags referencing these assets.

---

### Phase 1 — Vite scaffold

Status: Closed / build-validated.

Created:
- `index.legacy.html` (copy of legacy `index.html` at Gate 2 start; untouched source of truth)
- New minimal Vite `index.html`
- `package.json` (Vite 5, React 18, @supabase/supabase-js, papaparse)
- `vite.config.js`
- `tailwind.config.js` (custom color tokens: bg, surface, card, border, accent, text, muted, ok, err)
- `postcss.config.js`
- `src/main.jsx` (scaffold placeholder)
- `src/styles/index.css` (verbatim CSS from legacy `<style>` block)
- `.github/workflows/deploy-gate2.yml` (manual-only; no longer the production deployment path)
- `.github/workflows/build-check-gate2.yml` (build-only validation, no deploy)
- `.gitignore`

---

## v0.1.4 — 2026-06-23

Gate 1 enrichment read-model. Deployed and validated at illustratedvault.com.

- `card_extras_and_view.sql` deployed to Supabase
- `cards_effective` view live with `security_invoker = true`
- Five verified seed rows inserted into `card_extras`
- `index.html` updated to query `cards_effective` instead of `cards`
- Live validation confirmed: corrected cards appear on correct artist pages

---

## v0.1.3 — 2026-06-23

Pricing activated in frontend.

- TCGPlayer Market price display in card modal
- Low / Mid / High breakdown
- All Variants section (multi-variant cards)
- Cardmarket Trend section (where data exists)
- `$↓` and `$↑` sort modes
- Price history recording per card per user (first open per day)

---

## v0.1.2 — 2026-06-23

Supabase pricing schema. Sync script pricing adapter.

---

## v0.1.1 — 2026-06-23

Bug fixes:
- Clear Cache cancel behavior fixed
- Clear Cache confirm copy corrected
- `release_date` mapped in `supaRowToCard`
- `pb_fallback_img_*` keys purged by Clear Cache
- Stale TCGdex concurrency comment corrected

---

## v0.1.0 — 2026-06-23 (approximate)

Initial single-file MVP. Artist binder, card grid, owned/missing states, CSV import, favorites, share links, image fallback logic, manual overrides.
