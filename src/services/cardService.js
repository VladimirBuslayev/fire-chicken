// src/services/cardService.js
// Artist card fetch orchestrator — Supabase artist path + legacy TCGdex set path.
// Source: index.legacy.html lines 401–444.
//
// Runtime source-of-truth rule:
//   Artist entries → Supabase cards_effective (fast, reliable, never TCGdex live).
//   Set entries    → TCGdex (existing legacy behavior; only for entry.isSet paths).
//   Do NOT expand TCGdex usage. Do NOT use TCGdex for artist card display.
//
// This module is NOT imported into index.legacy.html.
// It becomes the canonical version when App/SharedBinder migrate in a later phase.
//
// Do not add retries, logging, validation, normalization, or new data sources.
// Do not change cache keys, cache TTL, sort behavior, or return shape.

import { supabase }                      from './supabaseClient.js';
import { lsGet, lsSet }                  from '../utils/cache.js';
import { toSlug }                        from '../utils/slug.js';
import { CACHE_TTL }                     from '../constants/config.js';
import { fetchCardBriefs, fetchFullCard } from './tcgdexService.js';
import { supaRowToCard }                 from './cardAdapter.js';

// Source: index.legacy.html line 104.
// Module-local only — not exported. Used only in the set-based fetch loop below.
const FETCH_BATCH = 10;

async function fetchArtistCards(entry) {
  // Set-based entries (e.g. Pokémon GO promo set) keep the TCGdex path.
  if (entry.isSet) {
    const ck = `pb6_cards_${toSlug(entry.name)}`;
    const cached = lsGet(ck);
    if (cached && cached.ts && Date.now() - cached.ts < CACHE_TTL) return cached.cards;
    const rawBriefs = await fetchCardBriefs(entry);
    const seen = new Set();
    const briefs = rawBriefs.filter(b => { if (!b || !b.id || seen.has(b.id)) return false; seen.add(b.id); return true; });
    const fullCards = []; let failCount = 0;
    for (let i = 0; i < briefs.length; i += FETCH_BATCH) {
      const batch = briefs.slice(i, i + FETCH_BATCH);
      const results = await Promise.all(batch.map(b => fetchFullCard(b.id).catch(() => null)));
      results.forEach(c => { if (c) fullCards.push(c); else failCount++; });
    }
    if (briefs.length > 0 && fullCards.length === 0) throw new Error(`Found ${briefs.length} cards but all detail fetches failed — likely rate-limited`);
    if (failCount > 0) throw new Error(`${failCount} of ${briefs.length} card detail fetches failed — likely rate-limited, retry shortly`);
    fullCards.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    lsSet(ck, { cards: fullCards, ts: Date.now() });
    return fullCards;
  }
  // Artist-based entries: query the local Supabase cards table instead of
  // hitting TCGdex live. This is faster, more reliable, and avoids the
  // per-card detail fetch loop that caused rate-limit errors.
  const ck = `pb7_supa_${toSlug(entry.name)}`;
  const cached = lsGet(ck);
  if (cached && cached.ts && Date.now() - cached.ts < CACHE_TTL) return cached.cards;
  // Build OR filter: canonical name + any aliases defined on the entry.
  const names = [entry.name, ...(entry.aliases || [])];
  const ilikeFilters = names.map(n => `illustrator.ilike.%${n}%`).join(",");
  const { data, error } = await supabase.from("cards_effective")
    .select("id,name,set_id,set_name,local_id,illustrator,image_url,rarity,release_date,pricing,pricing_updated_at")
    .or(ilikeFilters)
    .order("release_date", { ascending: true, nullsFirst: false })
    .order("set_id")
    .order("local_id");
  if (error) throw new Error(`Supabase artist fetch error: ${error.message}`);
  const seen = new Set();
  const cards = (data || [])
    .filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; })
    .map(supaRowToCard);
  lsSet(ck, { cards, ts: Date.now() });
  return cards;
}

export { fetchArtistCards };
