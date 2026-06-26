# Illustrated — Architecture

Last updated: 2026-06-25

## Production architecture (unchanged)

The production app at `illustratedvault.com` is still served from the `main` branch as a single-file `index.html` with a `sw.js` service worker. This has not changed and is not being modified during Gate 2.

## Gate 2 target architecture

Gate 2 migrates the single-file MVP into a Vite 5 / React 18 module structure on the `gate-2/vite-migration` branch. The migration is behavior-preserving. No features are added, no UI is changed, and no Supabase objects are modified.

## Data source principles (unchanged)

TCGdex is an ingestion/source-sync provider. Supabase is the runtime source of truth for card display. The frontend does not depend on live TCGdex calls for normal artist pages.

TCGdex runtime usage is now further restricted during Gate 2: `tcgdexService.js` permits only the `entry.isSet` path (fetching a specific set by ID). The illustrator lookup path (`/illustrators/{name}`) is intentionally excluded. See DECISION_LOG.md.

Pricing data is adapted at write time in `sync-cards.mjs`, not at read time in the frontend. Pricing is buying guidance.

## Current Vite module structure (gate-2/vite-migration)

```
src/
  App.jsx
  main.jsx
  assets/
    logo.webp
  constants/
    artists.js
    config.js
    setOrder.js
  services/
    supabaseClient.js
    cardService.js
    collectionService.js
    shareService.js
    cardAdapter.js
    imageService.js
    tcgdexService.js
  styles/
    index.css
  utils/
    cache.js
    cardUtils.js
    format.js
    imageUrl.js
    keys.js
    slug.js
    sort.js
public/
  apple-touch-icon.png
  favicon.png
  manifest.json
  icons/
    icon-192.png
    icon-512.png
  sw.js
index.html
index.legacy.html
package.json
vite.config.js
tailwind.config.js
postcss.config.js
sw.js
```

## Component boundary — current state

`src/App.jsx` is the Vite component root. It is a single 1,266-line file containing the full component tree. This is intentional for Gate 2 — it mirrors the legacy single-file approach while operating inside the Vite module system. Component splitting into `src/components/` files is deferred to Phase 7, after Gate 2 closes and production stability is confirmed.

`src/main.jsx` is the Vite entry point. It:
- imports `{ App, SharedBinder, ErrorBoundary }` from `./App.jsx`
- detects `?share=TOKEN` in the URL
- renders `<ErrorBoundary>{token ? <SharedBinder token={token} /> : <App />}</ErrorBoundary>`

This mirrors the legacy `ReactDOM.createRoot` call at the bottom of `index.legacy.html` exactly.

## Module layer — responsibilities

### Constants (`src/constants/`)

Pure data. No imports. No side effects.

| File | Exports | Source |
|---|---|---|
| `artists.js` | `ARTISTS`, `ARTIST_FACTS`, `ARTIST_META` | index.legacy.html lines 106–212 |
| `config.js` | `CACHE_TTL`, `PRICE_VARIANT_ORDER` | index.legacy.html lines 102, 266 |
| `setOrder.js` | `SET_ORDER` | index.legacy.html lines 225–253 |

`SET_ORDER` is used in both `src/utils/sort.js` (imported) and directly in `ArtistSection` inside `src/App.jsx` (imported). Do not remove or alter values — they are the authoritative sort key for card chronological ordering.

### Utilities (`src/utils/`)

Pure functions. No Supabase. No network.

| File | Exports | Notes |
|---|---|---|
| `cache.js` | `lsGet`, `lsSet`, `lsDel` | localStorage helpers with silent error swallowing |
| `cardUtils.js` | `isTcgPocketCard` | Image URL path test |
| `format.js` | `fmtPrice`, `todayStr` | `fmtPrice` was `fmt$` in legacy; renamed for ESM clarity; behavior identical |
| `imageUrl.js` | `imgSmall`, `imgLarge` | TCGdex image URL suffix builders |
| `keys.js` | `normName`, `normNum`, `normSet`, `makeKeys`, `isCardOwned` | Ownership key builders; `makeKeys` output is persisted in Supabase; do not alter |
| `slug.js` | `toSlug` | URL-safe slug generator |
| `sort.js` | `getBestPrice`, `sortCards` | Imports from `constants/config.js` and `constants/setOrder.js` |

### Services (`src/services/`)

All network and Supabase I/O. Imported by `src/App.jsx`.

| File | Exports | Notes |
|---|---|---|
| `supabaseClient.js` | `supabase` | Single ES module Supabase client; replaces CDN `window.supabase.createClient` in legacy |
| `cardService.js` | `fetchArtistCards` | Artist path: Supabase `cards_effective`; set path: TCGdex via `tcgdexService` |
| `collectionService.js` | `loadUserData`, `saveCollection`, `saveOverride`, `savePricePoint` | All `user_collection`, `card_overrides`, `price_history`, `card_favorites` reads/writes |
| `shareService.js` | `fetchSharedCollection` | Calls `get_shared_collection` RPC |
| `cardAdapter.js` | `supaRowToCard` | Maps `cards_effective` row to TCGdex card shape |
| `imageService.js` | `fetchFallbackImage`, `buildLimitlessGuess` | pokemontcg.io fallback; Limitless CDN guess |
| `tcgdexService.js` | `fetchCardBriefs`, `fetchFullCard` | TCGdex only; `fetchCardBriefs` returns `[]` when `entry.isSet` is false |

## Data flow — artist card display

```
App.useEffect → loadAllEntries
  → fetchArtistCards(entry)           [cardService.js]
    if entry.isSet:
      → fetchCardBriefs(entry)        [tcgdexService.js]
        → GET api.tcgdex.net/sets/{id}
      → fetchFullCard(id) × N         [tcgdexService.js]
        → GET api.tcgdex.net/cards/{id}
    else (artist path):
      → supabase.from('cards_effective').select(...).or(ilikeFilters)
      → supaRowToCard(row) × N        [cardAdapter.js]
  → setCardData(cards)
```

## Data flow — collection / ownership

```
App.useEffect (after auth) → loadUserData(userId)    [collectionService.js]
  → supabase.from('user_collection').select('owned_keys')
  → supabase.from('card_overrides').select(...)
  → supabase.from('price_history').select(...)
  → supabase.from('card_favorites').select(...)
  → returns { ownedKeys, manualOwned, manualMissing, priceHistory, favorites }

checkOwned(card) → isCardOwned(card, ownedKeySet, manualOwned, manualMissing)
  → makeKeys(name, localId, setName).some(k => ownedKeySet.has(k))
```

## Data flow — SharedBinder

```
main.jsx: SHARE_TOKEN → <SharedBinder token={token} />
  → fetchSharedCollection(token)      [shareService.js]
    → supabase.rpc('get_shared_collection', { p_token: token })
  → fetchArtistCards(entry) per artist (same path as App)
```

## Supabase read model — unchanged

`cards_effective` is the frontend read model. No changes to Supabase during Gate 2.

```sql
SELECT id, name, set_id, set_name, local_id, illustrator,
       image_url, rarity, release_date, pricing, pricing_updated_at
FROM cards_effective
WHERE illustrator ILIKE '%{name}%'
  OR  illustrator ILIKE '%{alias}%'
ORDER BY release_date ASC NULLS LAST, set_id, local_id
```

`supaRowToCard` maps this to the TCGdex card shape the components expect. The mapping is stable and must not be altered without a corresponding schema migration.

## Backend RPC dependencies — unchanged

| RPC | Signature | Used by |
|---|---|---|
| `get_shared_collection` | `p_token TEXT` | `fetchSharedCollection` — share/binder read path |

This RPC is the only stored procedure the frontend calls. It powers the public shared binder view. Do not modify its signature or remove it.

## Deployment — current state

The `gate-2/vite-migration` branch has a manual-only GitHub Actions workflow (`deploy-gate2.yml`). It has been triggered only for build validation (producing `dist/`). No deployment to any live URL has occurred from this branch.

Production (`illustratedvault.com`) is unaffected. Service at the custom domain continues to be provided by the `main` branch.

## Service worker — deferred

`public/sw.js` exists and is correct. Service worker registration (the `<script>` tag in `index.html`) is intentionally deferred to Phase 5G, immediately before the production deployment step. Adding SW registration before the preview URL is validated creates unnecessary caching complexity during audit.

## Future direction — post Gate 2

After Gate 2 closes and production stability is confirmed:

- Component extraction: split `src/App.jsx` into `src/components/` files (Phase 7+)
- Shared hooks: `useCardData`, `useCollection` (Phase 8+)
- Artist Directory / Add Artist flow (backlog)
- Set browsing (backlog)
- Freemium model / public collection pages (deferred)

## Constraints active through Gate 2 close

- `index.legacy.html` must not be modified
- `public/CNAME` must not be created
- Supabase schema, SQL, tables, views, policies, RPCs must not be modified
- TCGdex runtime usage must remain limited to `entry.isSet` paths
- `cards_effective` must remain the artist-path read model
- No features added; no UI redesigned
