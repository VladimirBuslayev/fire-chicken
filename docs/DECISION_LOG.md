# Illustrated — Decision Log

## 2026-06-23 — Product identity

Decision:

Illustrated is a premium visual archive and collection companion for Pokémon card collectors.

It is not merely a price tracker.

Reason:

The strongest differentiation is artist-first and artwork-first browsing, combined with physical collection tracking.

Status:

Accepted.

## 2026-06-23 — TCGdex role

Decision:

TCGdex should remain an ingestion/source-sync provider.

Supabase should become the runtime source of truth for card display.

Reason:

The frontend should not depend on live external API shape during normal browsing.

Status:

Accepted.

## 2026-06-23 — Stabilize before migrating

Decision:

The current single-file MVP should be stabilized before migrating to Vite/React modules.

Reason:

Migrating unstable behavior risks moving bugs into the new architecture.

Status:

Accepted.

## 2026-06-23 — No major features before Gate 1

Decision:

Do not add set browsing, Japanese cards, pricing confidence, or major UI redesigns before Gate 1 stabilization is complete.

Reason:

Adding features before stabilizing the data contract increases fragility.

Status:

Accepted.

## 2026-06-23 — Pricing philosophy

Decision:

Pricing should eventually be confidence-based, not presented as absolute truth.

Reason:

TCGplayer and other automated pricing sources can be inconsistent. eBay sold links are useful for verification.

Status:

Accepted.

## 2026-06-23 — Japanese card identity

Decision:

Japanese and English cards should not overwrite each other.

Reason:

They are separate physical collector items, even if they may share artwork.

Status:

Accepted.
