# Illustrated — Current State

Last updated: 2026-06-23

## Current version

Version: v0.1.3 — Pricing Phase 2 live

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

Pricing is present as buying guidance and should always be treated as a reference, not an authority. Illustrated Vault is not a price tracker.

## Current architecture

Current state:

- Single-file MVP: yes
- Frontend runtime: `index.html`
- Deployment: GitHub Pages
- Domain: `illustratedvault.com`
- Database: Supabase
- External card source: TCGdex
- Intended direction: TCGdex as ingestion/sync source; Supabase as runtime source of truth

## Working features

- Artist pages — sourced from Supabase
- Card grid with owned/missing states
- Card modal with full image, rarity, artist, set
- TCGPlayer Market price, Low / Mid / High breakdown
- All Variants pricing section (multi-variant cards)
- Cardmarket Trend section (where data exists)
- $↓ and $↑ price sort modes
- Price history recording per card per user
- CSV import (Collectr export)
- Manual owned/missing overrides
- Bookmarks / Most Wanted list
- Share / binder view
- Image fallback logic (pokemontcg.io archive, Limitless TCG)
- eBay sold links
- Cache / localStorage behavior
- GitHub Pages deployment

## Supabase data contract — current status

Fields selected and mapped in `fetchArtistCards` / `supaRowToCard`:

| Column | Selected | Mapped as | Status |
|---|---|---|---|
| `id` | yes | `id` | Live |
| `name` | yes | `name` | Live |
| `set_id` | yes | `set.id` | Live |
| `set_name` | yes | `set.name` | Live |
| `local_id` | yes | `localId` | Live |
| `illustrator` | yes | `illustrator` | Live |
| `image_url` | yes | `image` | Live |
| `rarity` | yes | `rarity` | Live |
| `release_date` | yes | `releaseDate` | Live (v0.1.1) |
| `pricing` | yes | `pricing` | Live (v0.1.3) |
| `pricing_updated_at` | yes | `pricingUpdatedAt` | Live (v0.1.3) — not yet rendered |
| `pricing_source` | no | — | In Supabase; not selected (not needed by frontend) |

Pricing coverage: 19,415 of 23,314 cards have pricing data (83%). Cards without pricing are primarily WotC-era sets where TCGdex carries no TCGPlayer data.

Fields listed in the architecture data contract but not yet implemented in the frontend: `source`, `source_card_id`, `artist_id`, `illustrator_raw`, `language`, `variants`, `tcgplayer_url`, `ebay_sold_url`, `price_confidence`.

## Known limitations

### Pricing — framing and scope

Pricing reflects TCGPlayer market data sourced through TCGdex, updated weekly by the sync pipeline. It is buying guidance, not a price authority. TCGPlayer Market price may not reflect realistic buying price — for any significant purchase, the eBay Sold link provides a more grounded view of recent actual sales.

The following pricing features remain deferred:

- Pricing confidence labels
- Price staleness display (`pricingUpdatedAt` is mapped but not rendered)
- Cardmarket link button (`cmUrl` is computed in the modal but not rendered)
- Price alerts and watchlists
- Advanced price history analytics

### Artist alias coverage — unconfirmed

The following aliases have not been confirmed against live Supabase data:

- Saya Tsuruta — full-width Unicode space variant
- Masakazu Fukuda — typo variant ("Masayuki Fukuda")

## Known follow-up items

### 1. Some previously corrected cards appear missing after sync

After the full re-sync for pricing, some cards that were previously visible appear to be absent for specific artists. Known examples:

- Giratina from Lost Origin (Shinji Kanda)
- Altaria from Crown Zenith (Asako Ito)

The root cause is not yet confirmed. Possible explanations, in order of likelihood:

- Cards are present in Supabase but `artist_id` was not resolved (illustrator string didn't match an alias), so they don't surface when the frontend queries by illustrator name
- Cards are absent from TCGdex's current catalog (removed, renamed, or not yet added)
- The sync incremental logic skipped these sets and they were not re-fetched
- A manual correction applied via the frontend was overwritten by the full sync upsert

Needs investigation before next feature work. Do not assume the sync is correct without spot-checking against known card counts.

### 2. TCGPlayer Market may not be the most useful primary price

The modal currently leads with TCGPlayer Market price. For buying decisions at card shows, the more practically useful signals are NM Low (the cheapest near-mint copy listed), recent eBay sold prices, or a buylist price. Market price averages across all listed copies and conditions. This framing should be revisited when the pricing display is next touched — but requires no code change until then. Document the concern here so it is not forgotten.

### 3. Artist page summary has no collapse control

The artist bio / story section on individual artist pages expands to full text with no way to collapse it. On mobile this adds significant scroll distance before reaching the card grid. A collapse toggle (or truncation with "read more") is a UX follow-up, particularly relevant for the card-show use case where fast browsing matters.

## Current gate

Gate 1 — Stabilize current MVP. Substantially complete.

Items resolved across Gate 1:

- Clear Cache cancel behavior fixed (v0.1.1)
- Clear Cache confirm copy corrected (v0.1.1)
- `release_date` mapped in `supaRowToCard` (v0.1.1)
- `pb_fallback_img_*` keys purged by Clear Cache (v0.1.1)
- Stale TCGdex concurrency comment corrected (v0.1.1)
- Supabase pricing schema added (v0.1.2)
- Sync script pricing adapter implemented (v0.1.2)
- Pricing activated in frontend (v0.1.3)

Items that remain open before Gate 2 migration:

- Missing card investigation (Giratina / Altaria — see Known Follow-up Items)
- Artist alias confirmation for Saya Tsuruta and Masakazu Fukuda
- Decision on whether `cmUrl` / Cardmarket link should be activated before migration

Do not migrate to Vite until the missing card investigation is resolved and alias coverage is confirmed.

## Do not do yet

- Do not redesign UI
- Do not migrate to Vite yet
- Do not add set browsing yet
- Do not add Japanese cards yet
- Do not add pricing confidence yet
- Do not add Cardmarket link button yet
- Do not silently invent Supabase columns

