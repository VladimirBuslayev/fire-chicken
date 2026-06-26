// src/main.jsx
// Gate 2 — Phase 5B: Render real application.
//
// Mirrors the legacy render at index.legacy.html lines 1666–1667:
//   const SHARE_TOKEN = new URLSearchParams(window.location.search).get("share");
//   ReactDOM.createRoot(document.getElementById("root"))
//     .render(<ErrorBoundary>{SHARE_TOKEN?<SharedBinder .../>:<App/>}</ErrorBoundary>)
//
// SharedBinder path: any ?share= URL renders the public read-only binder.
// App path: everything else renders the authenticated main application.

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import { App, SharedBinder, ErrorBoundary } from './App.jsx';

const SHARE_TOKEN = new URLSearchParams(window.location.search).get('share');

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    {SHARE_TOKEN ? <SharedBinder token={SHARE_TOKEN} /> : <App />}
  </ErrorBoundary>
);

