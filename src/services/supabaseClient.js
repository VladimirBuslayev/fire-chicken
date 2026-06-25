// src/services/supabaseClient.js
// Supabase client for the Vite/React module world.
// Source values: index.legacy.html lines 96–98 (SUPA_URL, SUPA_KEY, createClient call).
//
// WIRING NOTE: This module is NOT imported into index.legacy.html.
// The legacy app initialises its own Supabase client via window.supabase.createClient
// (CDN UMD), which is incompatible with ES module imports. This module becomes
// the canonical client when React components migrate into the Vite module world
// in Phase 5+.
//
// Do not add query functions here. Do not add auth logic here.
// This file is the client/config boundary only.

import { createClient } from '@supabase/supabase-js';

const SUPA_URL = 'https://hbpjbefohkcnovlwvqhc.supabase.co';
const SUPA_KEY = 'sb_publishable_UM5rWTAunNLDNbIXmtL8MQ_I8yl0iIH';

const supabase = createClient(SUPA_URL, SUPA_KEY);

export { supabase };
