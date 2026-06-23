/**
 * backfill-illustrators.mjs
 *
 * One-time script to patch null `illustrator` values in the Supabase `cards`
 * table using pokemontcg.io as a secondary source.
 *
 * Only updates rows where illustrator IS NULL — never overwrites existing data.
 * Run with: node backfill-illustrators.mjs
 *
 * Requires env vars (same as sync-cards.mjs):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY   (the sb_secret_... key)
 *   POKEMONTCG_API_KEY     (optional but recommended for higher rate limits)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const POKEMONTCG_API_KEY = process.env.POKEMONTCG_API_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Sets confirmed to have 0 illustrators in Supabase (from diagnostic query).
// Add or remove set IDs here as needed.
const NULL_SETS = [
  "swsh9",
  "swsh10",
  "swsh10.5",
  "swsh11",
  "swsh12",
  "swsh12.5",
  "mee",
  "ru1",
  "sve",
  // tk- sets — lower priority, mostly Japanese promos
  // "tk-bw-e", "tk-bw-z", "tk-sm-l", "tk-sm-r",
  // "tk-xy-b", "tk-xy-latia", "tk-xy-latio",
  // "tk-xy-n", "tk-xy-p", "tk-xy-su", "tk-xy-sy", "tk-xy-w",
];

const PTCG_BASE = "https://api.pokemontcg.io/v2/cards";
const PAGE_SIZE = 250;

async function fetchPtcgSet(setId) {
  const headers = { "Content-Type": "application/json" };
  if (POKEMONTCG_API_KEY) headers["X-Api-Key"] = POKEMONTCG_API_KEY;

  let page = 1;
  const cards = [];

  while (true) {
    const url = `${PTCG_BASE}?q=set.id:${setId}&select=id,artist&pageSize=${PAGE_SIZE}&page=${page}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      console.warn(`  pokemontcg.io returned ${res.status} for set ${setId}`);
      break;
    }

    const json = await res.json();
    const data = json.data || [];
    cards.push(...data);

    if (data.length < PAGE_SIZE) break; // last page
    page++;
  }

  return cards;
}

async function backfillSet(setId) {
  console.log(`\n[${setId}] Fetching from pokemontcg.io...`);
  const ptcgCards = await fetchPtcgSet(setId);
  console.log(`  ${ptcgCards.length} cards returned`);

  // Build a map: id -> artist (only where artist is non-empty)
  const artistMap = {};
  for (const c of ptcgCards) {
    if (c.id && c.artist) artistMap[c.id] = c.artist;
  }

  const ids = Object.keys(artistMap);
  if (ids.length === 0) {
    console.log(`  No artist data found — skipping`);
    return { updated: 0, missing: 0 };
  }

  console.log(`  ${ids.length} cards have artist data`);

  // Fetch which of these IDs exist in Supabase with null illustrator
  const { data: supaCards, error: fetchErr } = await sb
    .from("cards")
    .select("id")
    .eq("set_id", setId)
    .is("illustrator", null)
    .in("id", ids);

  if (fetchErr) {
    console.error(`  Supabase fetch error: ${fetchErr.message}`);
    return { updated: 0, missing: 0 };
  }

  if (!supaCards || supaCards.length === 0) {
    console.log(`  No null-illustrator rows found in Supabase for this set`);
    return { updated: 0, missing: 0 };
  }

  console.log(`  ${supaCards.length} rows to update`);

  // Update in batches of 50
  let updated = 0;
  const BATCH = 50;
  const toUpdate = supaCards.map((r) => r.id);

  for (let i = 0; i < toUpdate.length; i += BATCH) {
    const batch = toUpdate.slice(i, i + BATCH);
    const updates = batch.map((id) => ({ id, illustrator: artistMap[id] }));

    // Upsert using id as the conflict key
    const { error: upsertErr } = await sb
      .from("cards")
      .upsert(updates, { onConflict: "id", ignoreDuplicates: false });

    if (upsertErr) {
      console.error(`  Upsert error (batch ${i / BATCH + 1}): ${upsertErr.message}`);
    } else {
      updated += batch.length;
      process.stdout.write(`  Updated ${updated}/${toUpdate.length}\r`);
    }
  }

  // Count how many pokemontcg.io IDs had no match in Supabase at all
  const supaIds = new Set(toUpdate);
  const missing = ids.filter((id) => !supaIds.has(id)).length;

  console.log(`\n  Done: ${updated} updated, ${missing} pokemontcg.io cards not in Supabase`);
  return { updated, missing };
}

async function main() {
  console.log("=== Illustrator Backfill ===");
  console.log(`Sets to process: ${NULL_SETS.join(", ")}\n`);

  let totalUpdated = 0;

  for (const setId of NULL_SETS) {
    const { updated } = await backfillSet(setId);
    totalUpdated += updated;
    // Polite pause between sets to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n=== Complete. Total rows updated: ${totalUpdated} ===`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
