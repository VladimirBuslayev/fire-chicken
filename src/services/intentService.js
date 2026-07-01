// src/services/intentService.js
// Supabase read/write layer for user_card_intent.
//
// Intent is a collecting-planning signal, separate from ownership, favorites,
// and manual overrides. It is never used to determine owned/missing state.
//
// All functions require an authenticated userId (auth.uid()).
// No localStorage caching — intent is always read from Supabase on session load.
// RLS on user_card_intent enforces user_id = auth.uid() at the DB level.
//
// Do not add caching, retries, or normalization here.
// Do not read or write user_collection, card_overrides, card_favorites, or price_history.

import { supabase } from './supabaseClient.js';

// Valid intent statuses — kept here as the single source of truth for the frontend.
// Must match the CHECK constraint on user_card_intent.status.
const INTENT_STATUSES = ['want', 'hunting', 'maybe', 'ignore'];

// fetchUserIntent
// Loads all intent rows for the authenticated user and returns them as a Map
// keyed by card_id for O(1) lookup per card tile / modal render.
//
// Returns: Map<cardId: string, status: string>
// Throws on Supabase error.
async function fetchUserIntent(userId) {
  const { data, error } = await supabase
    .from('user_card_intent')
    .select('card_id, status')
    .eq('user_id', userId);

  if (error) throw new Error(`fetchUserIntent error: ${error.message}`);

  const map = new Map();
  (data || []).forEach(row => map.set(row.card_id, row.status));
  return map;
}

// setCardIntent
// Upserts a single intent row. Overwrites any existing status for that card.
// status must be one of INTENT_STATUSES.
//
// Returns: void
// Throws on invalid status or Supabase error.
async function setCardIntent(userId, cardId, status) {
  if (!INTENT_STATUSES.includes(status)) {
    throw new Error(`Invalid intent status: "${status}". Must be one of: ${INTENT_STATUSES.join(', ')}`);
  }

  const { error } = await supabase
    .from('user_card_intent')
    .upsert(
      {
        user_id:    userId,
        card_id:    cardId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,card_id' }
    );

  if (error) throw new Error(`setCardIntent error: ${error.message}`);
}

// clearCardIntent
// Deletes the intent row for a card, returning it to the unactioned state.
// Safe to call if no row exists (no-op).
//
// Returns: void
// Throws on Supabase error.
async function clearCardIntent(userId, cardId) {
  const { error } = await supabase
    .from('user_card_intent')
    .delete()
    .eq('user_id', userId)
    .eq('card_id', cardId);

  if (error) throw new Error(`clearCardIntent error: ${error.message}`);
}

export { fetchUserIntent, setCardIntent, clearCardIntent, INTENT_STATUSES };
