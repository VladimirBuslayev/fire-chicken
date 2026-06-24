# Illustrated — Current State

Last updated: 2026-06-23

## Current version

Version: v0.1.4 — Gate 1 enrichment read-model (SQL pending Supabase deployment)

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
- Frontend read surface: `cards_effective` view (pending Supabase deployment and frontend switch)

## Working features

- Artist pages — sourced from Supabase (currently via `cards`; will switch to `cards_effective` after deployment)
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

## Supabase objects — current state

### Tables

| Table | Owner | Written by | Purpose |
|---|---|---|---|
| `cards` | sync pipeline | `sync-cards.mjs` upsert | Raw TCGdex card data; source of truth for sync |
| `card_extras` | editorial | Manual (table editor) | Illustrator overrides and other manual corrections |
| `artists` | admin | Manual | Artist canonical names, aliases, metadata |
| `user_collection` | app | Frontend | Per-user owned card key set |
| `card_overrides` | app | Frontend | Per-user force-owned / force-missing |
| `price_history` | app | Frontend | Per-user price point log |
| `card_favorites` | app | Frontend | Per-user bookmarks |
| `share_links` | app | Frontend | Public binder share tokens |

### Views (pending creation)

| View | Source tables | Purpose |
|---|---|---|
| `cards_effective` | `cards` LEFT JOIN `card_extras` | Frontend read surface; exposes COALESCE(illustrator_override, illustrator) |

### View access (pending creation)

`cards_effective` will be created with `security_invoker = true`. anon and authenticated roles will have SELECT. No INSERT/UPDATE/DELETE is possible on a non-updatable view. `card_extras` will have RLS enabled with a SELECT-only policy for anon/authenticated; write access is service-role only.

## Supabase data contract — current status

The frontend currently selects from `cards`. After deployment of `card_extras_and_view.sql` and the `index.html` switch, it will select from `cards_effective`. Column shapes are identical; `supaRowToCard` requires no changes.

| Column | Source | Selected by frontend | Notes |
|---|---|---|---|
| `id` | `cards` | yes | — |
| `name` | `cards` | yes | — |
| `set_id` | `cards` | yes | — |
| `set_name` | `cards` | yes | — |
| `local_id` | `cards` | yes | — |
| `illustrator` | `COALESCE(card_extras.illustrator_override, cards.illustrator)` | yes | View resolves the best available value |
| `image_url` | `cards` | yes | — |
| `rarity` | `cards` | yes | — |
| `release_date` | `cards` | yes | Mapped as `releaseDate` |
| `pricing` | `cards` | yes | JSONB; adapted from TCGdex at sync time |
| `pricing_updated_at` | `cards` | yes | Mapped as `pricingUpdatedAt`; not yet rendered |

Pricing coverage: 19,415 of 23,314 cards have pricing data (83%).

## Known limitations

### Null illustrator — enrichment read-model ready, deployment pending

Six set ranges have `illustrator: null` in the `cards` table due to a TCGdex data gap:

- swsh9 (Brilliant Stars)
- swsh10 (Astral Radiance)
- swsh10.5 (Pokémon GO promo)
- swsh11 (Lost Origin)
- swsh12 (Silver Tempest)
- swsh12.5 (Crown Zenith)

The SQL for the `card_extras` table and `cards_effective` view is written and ready to run (`card_extras_and_view.sql`). The frontend switch (`sb.from("cards_effective")`) is prepared in `index.html`. Neither is deployed yet — deployment follows the validation sequence in the SQL file. Once deployed and the high-priority seed rows are inserted (Giratina, Altaria in the named sets, verified against physical cards), those cards will appear on artist pages. The remaining null-illustrator cards in those six sets are a separate data-quality pass tracked below.

### Pricing — framing and scope

Pricing reflects TCGPlayer market data sourced through TCGdex, updated weekly by the sync pipeline. It is buying guidance, not a price authority.

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

### 1. Deploy enrichment read-model and validate

Run `card_extras_and_view.sql` in Supabase, insert the verified high-priority `card_extras` rows (Giratina and Altaria cards in swsh11, swsh12, swsh12.5), deploy the updated `index.html`, clear the card cache, and validate the corrected cards appear on the expected artist pages. Full regression: pricing UI, owned/missing, favorites, eBay links, share/binder.

### 2. Bulk enrichment of null-illustrator cards across swsh9–swsh12.5

Once the read-model is validated, the remaining work is a one-time data-quality pass: query Supabase for all cards in swsh9–swsh12.5 where `illustrator` is null, verify each against a trusted source (Bulbapedia, pokemontcg.io, physical card scan), and insert `card_extras` rows with the correct illustrator name and a `source_note`. Do not bulk-insert unverified data. This is a follow-up pass and does not block Gate 2 migration once the read-model itself is validated.

### 3. TCGPlayer Market pricing framing

The modal leads with TCGPlayer Market price. For buying decisions at card shows, NM Low or recent eBay sold prices may be more practically useful. Framing should be revisited when pricing display is next touched.

### 4. Artist page summary has no collapse control

The artist bio section has no collapse toggle. On mobile this adds significant scroll distance before the card grid. A follow-up UX improvement, especially relevant for card-show use.

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
- `card_extras_and_view.sql` written; `index.html` updated to target `cards_effective` (v0.1.4 — pending deployment and validation)

Remaining open before Gate 2:

- Deploy `card_extras_and_view.sql`, insert verified seed rows, deploy frontend switch, validate (v0.1.4)
- Bulk enrichment of null-illustrator cards across swsh9–swsh12.5 (follow-up data-quality pass; not a hard Gate 2 blocker once the read-model is validated)
- Artist alias confirmation for Saya Tsuruta and Masakazu Fukuda

Gate 2 migration (Vite/React) may proceed once the read-model is deployed and validated and alias coverage is resolved. The bulk enrichment data-quality pass can continue in parallel with or after Gate 2.

## Do not do yet

- Do not redesign UI
- Do not migrate to Vite yet
- Do not add set browsing yet
- Do not add Japanese cards yet
- Do not add pricing confidence yet
- Do not add Cardmarket link button yet
- Do not silently invent Supabase columns

