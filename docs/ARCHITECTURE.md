# Illustrated — Architecture

## Current architecture

The app is currently a single-file MVP.

Current core files:

- `index.html` — main frontend app
- `sw.js` — service worker
- `sync/` — data sync / backfill scripts
- `.github/workflows/` — automation
- `CNAME` — GitHub Pages custom domain

## Current deployment

The app is deployed through GitHub Pages to:

https://illustratedvault.com

## Architecture direction

The target architecture is:

External APIs → ingestion/sync scripts → Supabase → frontend app

## Data source principle

TCGdex should remain an ingestion/source-sync provider.

Supabase should become the runtime source of truth for card display.

The frontend should not rely on live TCGdex calls for normal artist pages or future set pages.

## Why

External APIs can change shape, have missing data, or behave inconsistently.

The frontend should receive predictable, app-shaped data from Supabase.

## Near-term data contract

The frontend should eventually expect a stable card object with fields such as:

- id
- source
- source_card_id
- name
- set_id
- set_name
- local_id
- illustrator
- illustrator_raw
- artist_id
- image_url
- rarity
- release_date
- language
- variants
- pricing
- tcgplayer_url
- ebay_sold_url
- price_confidence

Do not silently invent missing Supabase columns. Missing columns should be identified explicitly.

## Future database direction

Likely core tables:

```text
cards
artists
artist_aliases
sets
collection_items
card_prices
card_extras

Future frontend direction

After Gate 1 stabilization, migrate toward a modular Vite/React structure:

src/
  app/
  components/
  pages/
  services/
  utils/
  hooks/
  data/
Future service layers

Expected service separation:

Supabase client
card service
artist service
set service
price service
collection service
import/CSV service
cache utility
card mapping utility
Migration rule

Do not migrate to Vite until the current MVP behavior is stable.

The first migration should preserve user-facing behavior rather than redesigning or adding features.
