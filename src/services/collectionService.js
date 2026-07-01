// src/services/collectionService.js
// Supabase read/write for user collection, card overrides, price history, favorites.
// Source: index.legacy.html lines 296-313 (loadUserData, saveCollection,
//         saveOverride, savePricePoint).
//
// Wiring note: legacy used a global `sb` variable (CDN UMD client).
// This module imports the ES module client from supabaseClient.js — behavior
// is identical; only the reference changes from `sb` to `supabase`.
//
// Do NOT add query logic beyond what exists here.
// Do NOT change table names, column names, or conflict targets.
// Do NOT change the shape of the object returned by loadUserData — App depends
// on destructuring { ownedKeys, manualOwned, manualMissing, priceHistory, favorites }.

import { supabase } from './supabaseClient.js';

async function loadUserData(userId) {
  const [colRes, ovRes, phRes, favRes] = await Promise.all([
    supabase.from('user_collection').select('owned_keys').eq('user_id', userId).maybeSingle(),
    supabase.from('card_overrides').select('card_id,override_type').eq('user_id', userId),
    supabase.from('price_history').select('card_id,price,recorded_date').eq('user_id', userId).order('recorded_date'),
    supabase.from('card_favorites').select('card_id').eq('user_id', userId),
  ]);
  const ownedKeys = new Set(colRes.data?.owned_keys ?? []);
  const manualOwned = new Set(), manualMissing = new Set();
  (ovRes.data ?? []).forEach(r =>
    r.override_type === 'owned' ? manualOwned.add(r.card_id) : manualMissing.add(r.card_id)
  );
  const priceHistory = {};
  (phRes.data ?? []).forEach(r => {
    if (!priceHistory[r.card_id]) priceHistory[r.card_id] = [];
    priceHistory[r.card_id].push({ date: r.recorded_date, price: Number(r.price) });
  });
  const favorites = new Set((favRes.data ?? []).map(r => r.card_id));
  return { ownedKeys, manualOwned, manualMissing, priceHistory, favorites };
}

async function saveCollection(uid, keys) {
  return supabase.from('user_collection').upsert(
    { user_id: uid, owned_keys: Array.from(keys), updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
}

async function saveOverride(uid, cardId, action) {
  if (action === 'reset')
    return supabase.from('card_overrides').delete().eq('user_id', uid).eq('card_id', cardId);
  return supabase.from('card_overrides').upsert(
    { user_id: uid, card_id: cardId, override_type: action },
    { onConflict: 'user_id,card_id' }
  );
}

async function savePricePoint(uid, cardId, price, date) {
  return supabase.from('price_history').upsert(
    { user_id: uid, card_id: cardId, price, recorded_date: date },
    { onConflict: 'user_id,card_id,recorded_date' }
  );
}

export { loadUserData, saveCollection, saveOverride, savePricePoint };
