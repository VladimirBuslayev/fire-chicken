// src/services/cardAdapter.js
// Maps a Supabase cards_effective row to the TCGdex card shape the UI expects.
// Source: index.legacy.html lines 387-399.
//
// Do NOT alter field mappings — the card shape is consumed throughout the app
// and must stay stable until a deliberate data-shape migration is planned.
// cards_effective is the frontend read model; this adapter is its translation layer.

function supaRowToCard(row) {
  return {
    id:               row.id,
    name:             row.name,
    localId:          row.local_id,
    rarity:           row.rarity             || null,
    illustrator:      row.illustrator,
    image:            row.image_url          || null,
    set:              { id: row.set_id, name: row.set_name || row.set_id },
    pricing:          row.pricing            || null,
    pricingUpdatedAt: row.pricing_updated_at || null,
    releaseDate:      row.release_date       || null,
  };
}

export { supaRowToCard };
