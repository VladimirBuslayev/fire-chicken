#!/usr/bin/env node
// Syncs the TCGdex card catalog into Supabase's `cards` table, resolving
// each card's illustrator string against `artists.aliases` to set artist_id.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node sync-cards.mjs
//   SYNC_MODE=full node sync-cards.mjs   (default: incremental)

import { createClient } from '@supabase/supabase-js';

const TCGDEX_BASE = 'https://api.tcgdex.net/v2/en';
const BATCH_SIZE = 10;        // concurrent card-detail fetches per batch
const BATCH_DELAY_MS = 250;   // pause between batches
const UPSERT_CHUNK = 500;     // rows per Supabase upsert call

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SYNC_MODE = process.env.SYNC_MODE || 'incremental'; // 'incremental' | 'full'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function loadArtistAliasMap() {
  const { data, error } = await supabase.from('artists').select('id, aliases');
  if (error) throw error;
  const map = new Map();
  for (const artist of data) {
    for (const alias of artist.aliases || []) {
      map.set(alias.trim().toLowerCase(), artist.id);
    }
  }
  return map;
}

function resolveArtistId(illustrator, aliasMap) {
  if (!illustrator) return null;
  return aliasMap.get(illustrator.trim().toLowerCase()) || null;
}

function mapCardToRow(card, aliasMap) {
  return {
    id: card.id,
    local_id: card.localId ?? null,
    name: card.name,
    category: card.category ?? null,
    illustrator: card.illustrator ?? null,
    artist_id: resolveArtistId(card.illustrator, aliasMap),
    rarity: card.rarity ?? null,
    set_id: card.set?.id ?? null,
    set_name: card.set?.name ?? null,
    series: card.set?.serie?.name ?? null,
    release_date: card.set?.releaseDate ?? null,
    pokemon_dex_ids: card.dexId ?? null,
    types: card.types ?? null,
    hp: card.hp ?? null,
    regulation_mark: card.regulationMark ?? null,
    variants: card.variants ?? null,
    image_url: card.image ?? null,
    legal_standard: card.legal?.standard ?? null,
    legal_expanded: card.legal?.expanded ?? null,
    last_synced_at: new Date().toISOString(),
  };
}

async function upsertRows(rows) {
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error } = await supabase.from('cards').upsert(chunk, { onConflict: 'id' });
    if (error) throw error;
  }
}

async function getStoredCountForSet(setId) {
  const { count, error } = await supabase
    .from('cards')
    .select('id', { count: 'exact', head: true })
    .eq('set_id', setId);
  if (error) throw error;
  return count ?? 0;
}

async function syncSet(setSummary, aliasMap, unmatched) {
  const setDetail = await fetchJson(`${TCGDEX_BASE}/sets/${setSummary.id}`);
  const briefCards = setDetail.cards || [];

  if (SYNC_MODE === 'incremental') {
    const storedCount = await getStoredCountForSet(setSummary.id);
    if (storedCount >= briefCards.length && briefCards.length > 0) {
      console.log(`Skip ${setSummary.id} (${setSummary.name}) — already synced (${storedCount}/${briefCards.length})`);
      return { synced: 0 };
    }
  }

  console.log(`Syncing ${setSummary.id} (${setSummary.name}) — ${briefCards.length} cards`);

  const rows = [];
  for (let i = 0; i < briefCards.length; i += BATCH_SIZE) {
    const batch = briefCards.slice(i, i + BATCH_SIZE);
    const details = await Promise.all(
      batch.map((c) =>
        fetchJson(`${TCGDEX_BASE}/cards/${c.id}`).catch((err) => {
          console.error(`  Failed to fetch ${c.id}: ${err.message}`);
          return null;
        })
      )
    );
    for (const card of details) {
      if (!card) continue;
      const row = mapCardToRow(card, aliasMap);
      if (card.illustrator && !row.artist_id) {
        unmatched.add(card.illustrator);
      }
      rows.push(row);
    }
    await sleep(BATCH_DELAY_MS);
  }

  await upsertRows(rows);
  return { synced: rows.length };
}

async function main() {
  console.log(`Starting card sync — mode: ${SYNC_MODE}`);

  const aliasMap = await loadArtistAliasMap();
  console.log(`Loaded ${aliasMap.size} artist aliases`);

  const sets = await fetchJson(`${TCGDEX_BASE}/sets`);
  console.log(`Found ${sets.length} sets`);

  const unmatched = new Set();
  let totalSynced = 0;

  for (const setSummary of sets) {
    try {
      const { synced } = await syncSet(setSummary, aliasMap, unmatched);
      totalSynced += synced;
    } catch (err) {
      console.error(`Error syncing set ${setSummary.id}: ${err.message}`);
    }
  }

  console.log(`\nDone. Upserted ${totalSynced} cards.`);
  if (unmatched.size > 0) {
    console.log(`\n${unmatched.size} unmatched illustrator strings (no artist alias match):`);
    for (const name of [...unmatched].sort()) {
      console.log(`  - ${name}`);
    }
  }
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
