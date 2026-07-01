// src/services/tcgdexService.js
// TCGdex API calls: set-based card brief list and full card detail.
// Source: index.legacy.html lines 101 (TCG_BASE), 321-342 (fetchCardBriefs, fetchFullCard).
//
// Gate 2 rule: TCGdex is permitted ONLY for entry.isSet paths (e.g. Pokémon GO promo set).
// Artist-path card display uses Supabase cards_effective via cardService.js.
// The illustrator lookup branch that existed in the legacy fetchCardBriefs is
// intentionally excluded here — it is not repaired or carried forward during this
// migration. If entry.isSet is false, fetchCardBriefs returns [] immediately.

const TCG_BASE = 'https://api.tcgdex.net/v2/en';

async function fetchCardBriefs(entry) {
  if (!entry?.isSet) return [];
  const res = await fetch(`${TCG_BASE}/sets/${entry.setId}`);
  if (!res.ok) throw new Error(`Set "${entry.setId}" error ${res.status}`);
  const json = await res.json();
  return json.cards || [];
}

async function fetchFullCard(id) {
  const res = await fetch(`${TCG_BASE}/cards/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export { fetchCardBriefs, fetchFullCard };
