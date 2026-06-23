# Illustrated — Changelog

## v0.1.3 — Pricing Phase 2: frontend activation

Date: 2026-06-23

Merged: yes

### `fetchArtistCards` — `pricing` and `pricing_updated_at` added to Supabase select

The Supabase `.select()` string in `fetchArtistCards` now includes `pricing` and `pricing_updated_at`. These fields were already present in the `cards` table following the Phase 1 schema migration; this change routes them to the frontend.

### `supaRowToCard` — pricing stub replaced with live mapping

The `pricing: null` stub (and its accompanying "does not exist in Supabase yet" comment) has been replaced with `pricing: row.pricing || null`. The field `pricingUpdatedAt: row.pricing_updated_at || null` has also been added and is available for future use.

No other changes to `supaRowToCard`, `getBestPrice`, the modal, or price sort logic were needed. All pricing UI was already written against the correct shape — it was dormant because pricing was always `null`. Opening the data gate was the only change required.

### Live validation results

Manual validation confirmed across artist cards:

- TCGPlayer Market price displays in the card modal
- Low / Mid / High breakdown displays
- All Variants section displays for multi-variant cards
- Cardmarket Trend section displays where Cardmarket data exists
- $↓ and $↑ price sort modes work; unpriced cards sort to the end
- Cards with no pricing data (WotC-era and others) still show "No pricing data" cleanly
- Owned/missing state, manual overrides, favorites, eBay links, and share/binder view unaffected

### Pricing framing note

Pricing in Illustrated Vault is buying guidance, not a price authority. TCGPlayer Market is displayed as a reference point. For buying decisions, the eBay Sold link remains important for verification against recent actual sales. Confidence labels, price alerts, Cardmarket link button, and price history analytics remain deferred.

---

## v0.1.2 — Pricing Phase 1: schema and sync adapter

Date: 2026-06-23

Merged: yes

### Supabase schema — three nullable columns added to `cards`

```sql
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS pricing            JSONB        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pricing_updated_at TIMESTAMPTZ  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pricing_source     TEXT         DEFAULT NULL;
```

All columns are nullable. Existing rows were unaffected by the migration.

### `sync-cards.mjs` — pricing adapter added

Three adapter functions were added before `mapCardToRow`:

- `adaptTcgplayer(raw)` — normalizes TCGdex's flat TCGPlayer pricing object. Renames known variant keys (`holo` → `holofoil`, `reverse` → `reverse-holofoil`); passes unknown keys through unchanged. Preserves `updated` and `unit` metadata siblings. Property names (`marketPrice`, `lowPrice`, `midPrice`, `highPrice`) were already compatible — no renaming required for those.
- `adaptCardmarket(raw)` — restructures TCGdex's flat Cardmarket fields into the `{ url, prices: { averageSellPrice, lowPrice, trendPrice } }` shape the frontend expects. Maps `avg` → `averageSellPrice`, `low` → `lowPrice`, `trend` → `trendPrice`.
- `adaptPricing(raw)` — top-level coordinator; returns `null` if both sections are absent.

`mapCardToRow` was updated to compute `adaptPricing(card.pricing ?? null)` once per card and write three new fields to the Supabase row:

```js
pricing:            pricing,
pricing_updated_at: pricing ? new Date().toISOString() : null,
pricing_source:     pricing ? 'tcgdex' : null,
```

### Full sync results

A `SYNC_MODE=full` run populated pricing for 19,415 of 23,314 cards (83%). The 3,899 cards without pricing are primarily WotC-era sets where TCGdex carries no TCGPlayer data. These cards correctly store `pricing: null` and display "No pricing data" in the modal.

Variant key spot-check confirmed all observed keys in Supabase are frontend-compatible:
`normal`, `holofoil`, `reverse-holofoil`, `1st-edition`, `1st-edition-holofoil`, `unlimited`, `unlimited-holofoil`, `updated`, `unit`.

No entries in `VARIANT_KEY_MAP` needed beyond `normal`, `holo`, and `reverse`. First-edition and unlimited variants appear to have been already in the correct kebab-case format from TCGdex — no normalization was needed for those keys.

---

## v0.1.1 — Gate 1 stabilization patch

Date: 2026-06-23

Merged: yes (PR merged to `stabilization/gate-1`)

Changes:

### Clear Cache — cancel behavior fixed

The "Clear card cache" button in Settings previously called `onClose()` unconditionally, closing the Settings panel even when the user clicked Cancel on the confirm dialog. This has been fixed. Cancel now leaves the Settings panel open.

### Clear Cache — confirm copy corrected

The confirm dialog previously read "Will re-fetch from Supabase on next load." This was inaccurate: `clearCache` triggers an immediate re-fetch via `loadAllEntries()`. The copy now reads "Cards will be re-fetched from Supabase immediately."

### `supaRowToCard` — `release_date` now mapped

`release_date` was already selected from Supabase and used as the primary `ORDER BY` on the `fetchArtistCards` query, but was not mapped to the returned card object. It is now mapped as `releaseDate: row.release_date || null`. The UI's visual date sort continues to use `SET_ORDER`, so no display behavior changes. The field is available on the card object for future use.

### Clear Cache — `pb_fallback_img_*` keys now purged

`clearCache` previously purged `pb6_cards_*` (old TCGdex cache) and `pb7_supa_*` (current Supabase cache) keys, but did not touch `pb_fallback_img_${cardId}` keys. These keys cache pokemontcg.io fallback image lookups — including permanent `false` values for cards where no image was found. `clearCache` now also purges all keys matching the `pb_fallback_img_` prefix, so stale "not found" results do not persist after TCGdex gains images for previously imageless cards.

### Stale comment corrected in `loadAllEntries`

A comment describing the `ARTIST_CONCURRENCY=4` chunked loading strategy referred to "simultaneous requests to TCGdex and risks silent throttling." Artist entries no longer hit TCGdex live — they query Supabase. The comment now reads "simultaneous Supabase queries and risks connection pool pressure."

---

## v0.1 — Initial single-file MVP

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

