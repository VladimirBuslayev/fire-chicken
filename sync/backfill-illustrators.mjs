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
    const url = `${PTCG_BASE}?q=set.id:${setId}&select=id,number,artist&pageSize=${PAGE_SIZE}&page=${page}`;
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

  // Build a map: local_id (card number) -> artist.
  // We use `number` (e.g. "GG19") not the full composite id (e.g. "swsh12pt5-GG19")
  // because TCGdex and pokemontcg.io use different set ID prefixes.
  const artistMap = {};
  for (const c of ptcgCards) {
    if (c.number && c.artist) artistMap[c.number] = c.artist;
  }

  const localIds = Object.keys(artistMap);
  if (localIds.length === 0) {
    console.log(`  No artist data found — skipping`);
    return { updated: 0, missing: 0 };
  }

  console.log(`  ${localIds.length} cards have artist data`);

  // Fetch null-illustrator rows from Supabase, matching by local_id within the set.
  const { data: supaCards, error: fetchErr } = await sb
    .from("cards")
    .select("id, local_id")
    .eq("set_id", supaId)
    .is("illustrator", null)
    .in("local_id", localIds);

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

  for (let i = 0; i < supaCards.length; i += BATCH) {
    const batch = supaCards.slice(i, i + BATCH);
    for (const row of batch) {
      const illustrator = artistMap[row.local_id];
      if (!illustrator) continue;
      const { error: updateErr } = await sb
        .from("cards")
        .update({ illustrator })
        .eq("id", row.id)
        .is("illustrator", null);
      if (updateErr) {
        console.error(`  Update error for ${row.id}: ${updateErr.message}`);
      } else {
        updated++;
      }
    }
    process.stdout.write(`  Updated ${updated}/${supaCards.length}\r`);
  }

  const supaLocalIds = new Set(supaCards.map(r => r.local_id));
  const missing = localIds.filter(lid => !supaLocalIds.has(lid)).length;

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
