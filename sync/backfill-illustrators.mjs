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
// Map of our Supabase set_id -> pokemontcg.io set id (they differ for some sets).
const NULL_SETS = [
  { supaId: "swsh9",    ptcgId: "swsh9"    },
  { supaId: "swsh10",   ptcgId: "swsh10"   },
  { supaId: "swsh10.5", ptcgId: "swsh45"   }, // pokemontcg.io calls this swsh45
  { supaId: "swsh11",   ptcgId: "swsh11"   },
  { supaId: "swsh12",   ptcgId: "swsh12"   },
  { supaId: "swsh12.5", ptcgId: "swsh12pt5" }, // pokemontcg.io calls this swsh12pt5
  { supaId: "mee",      ptcgId: "mee"      },
  { supaId: "ru1",      ptcgId: "ru1"      },
  { supaId: "sve",      ptcgId: "sve"      },
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

async function backfillSet(set) {
  const { supaId, ptcgId } = set;
  console.log(`\n[${supaId}] Fetching from pokemontcg.io (ptcg id: ${ptcgId})...`);
  const ptcgCards = await fetchPtcgSet(set.ptcgId);
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
    .eq("set_id", supaId)
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
    // Update each row individually — upsert requires all NOT NULL columns.
    for (const id of batch) {
      const { error: updateErr } = await sb
        .from("cards")
        .update({ illustrator: artistMap[id] })
        .eq("id", id)
        .is("illustrator", null);
      if (updateErr) {
        console.error(`  Update error for ${id}: ${updateErr.message}`);
      } else {
        updated++;
      }
    }
    process.stdout.write(`  Updated ${updated}/${toUpdate.length}\r`);
  }

  // Count how many pokemontcg.io IDs had no match in Supabase at all
  const supaIds = new Set(toUpdate);
  const missing = ids.filter((id) => !supaIds.has(id)).length;

  console.log(`\n  Done: ${updated} updated, ${missing} pokemontcg.io cards not in Supabase`);
  return { updated, missing };
}

async function main() {
  console.log("=== Illustrator Backfill ===");
  console.log(`Sets to process: ${NULL_SETS.map(s=>s.supaId).join(", ")}\n`);

  let totalUpdated = 0;

  for (const set of NULL_SETS) {
    const { updated } = await backfillSet(set);
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
