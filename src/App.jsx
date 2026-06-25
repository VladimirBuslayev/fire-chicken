// src/App.jsx
// Gate 2 — Phase 5A: Vite React boundary smoke test.
//
// PURPOSE: Prove that src/main.jsx can render a real React component
// via the Vite module system, and that ES imports from Phase 3
// constants/utils resolve correctly at build time.
//
// THIS IS NOT THE REAL APPLICATION SHELL.
// The real application lives in index.legacy.html (untouched).
// Replace this file with the full legacy port in Phase 5B.
//
// Phase 5A hard constraints (enforced here):
//   - No Supabase calls.
//   - No auth calls.
//   - No loadUserData.
//   - No fetchArtistCards.
//   - No real dashboard, no SharedBinder.
//   - No product behaviour changes.
//   - Imports only from known-good, fully-implemented Phase 3 modules.

import React from 'react';
import { ARTISTS } from './constants/artists.js';
import { toSlug } from './utils/slug.js';

// ── Simple label/value row for the status panel ───────────────────────────────
function Row({ label, value, ok, neutral }) {
  const valueColor = ok ? '#6ee7b7' : neutral ? '#8b6cd8' : '#6b6b90';
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 16,
      padding: '7px 0',
      borderBottom: '1px solid #1a1a2e',
      fontSize: '.83rem',
    }}>
      <span style={{ color: '#6b6b90', flexShrink: 0 }}>{label}</span>
      <span style={{ color: valueColor, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// ── Smoke-test shell ─────────────────────────────────────────────────────────
function App() {
  const mainArtists      = ARTISTS.filter(a => a.tier === 'main');
  const secondaryArtists = ARTISTS.filter(a => a.tier === 'secondary');
  const sampleSlug       = toSlug('Yuka Morii');  // expected: "yuka-morii"

  return (
    <div style={{
      minHeight: '100vh',
      background: '#07070f',
      color: '#e8e8f4',
      fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 20,
    }}>
      {/* ── Status card ───────────────────────────────────────────────── */}
      <div style={{
        background: '#0f0f1c',
        border: '1px solid #1e1e35',
        borderRadius: 12,
        padding: '28px 32px',
        maxWidth: 540,
        width: '100%',
      }}>
        <p style={{
          fontSize: '.7rem',
          color: '#52527a',
          marginBottom: 6,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          Gate 2 · Phase 5A · Branch validation only
        </p>

        <h1 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: '1.7rem',
          fontWeight: 700,
          marginBottom: 6,
          color: '#c0a0f8',
        }}>
          Vite boundary confirmed
        </h1>

        <p style={{
          color: '#6b6b90',
          fontSize: '.85rem',
          lineHeight: 1.65,
          marginBottom: 24,
        }}>
          This render proves the Vite module system is wired correctly.
          The real application shell is in{' '}
          <code style={{ color: '#8b6cd8', fontSize: '.8rem' }}>index.legacy.html</code>{' '}
          and will be ported in Phase 5B.
        </p>

        {/* ── Module resolution checks ──────────────────────────────── */}
        <p style={{ fontSize: '.7rem', color: '#52527a', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, marginBottom: 10 }}>
          Module resolution
        </p>

        <Row
          label="constants/artists.js"
          value={`ARTISTS imported (${ARTISTS.length} entries)`}
          ok
        />
        <Row
          label="utils/slug.js"
          value={`toSlug("Yuka Morii") → "${sampleSlug}"`}
          ok={sampleSlug === 'yuka-morii'}
        />
        <Row
          label="Main artists"
          value={`${mainArtists.length} entries`}
          ok
        />
        <Row
          label="Secondary artists"
          value={`${secondaryArtists.length} entries`}
          ok
        />

        {/* ── Constraints respected ─────────────────────────────────── */}
        <p style={{ fontSize: '.7rem', color: '#52527a', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, margin: '18px 0 10px' }}>
          Phase 5A constraints respected
        </p>

        <Row label="Supabase"         value="not called"         neutral />
        <Row label="Auth / session"   value="not called"         neutral />
        <Row label="loadUserData"     value="not called"         neutral />
        <Row label="fetchArtistCards" value="not called"         neutral />
        <Row label="SharedBinder"     value="not rendered"       neutral />
        <Row label="Real dashboard"   value="not rendered"       neutral />
      </div>

      {/* ── Footer note ───────────────────────────────────────────────── */}
      <p style={{ fontSize: '.7rem', color: '#46466a', textAlign: 'center', maxWidth: 420, lineHeight: 1.6 }}>
        Production app:{' '}
        <code style={{ color: '#6b6b90' }}>index.legacy.html</code> (byte-for-byte unchanged)
        {' · '}
        This build: branch{' '}
        <code style={{ color: '#6b6b90' }}>gate-2/vite-migration</code>
        {' · '}
        Not deployed
      </p>
    </div>
  );
}

export default App;

