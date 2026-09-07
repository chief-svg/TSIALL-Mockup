// Minimal local proxy + static server for the finance command center.
// No dependencies: Node 18+ (built-in http + fetch).
//
//   npm start            → http://localhost:4180
//   DEMO=1 npm start     → same UI, bundled fixtures, no key needed
//
// The browser never sees the developer key: it calls /api/<path> and this
// process forwards to https://api.pocketsmith.com/v2/<path> with the header.
// Only GET is forwarded — this tool is read-only by design.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');

// ---- config: .env (KEY=VALUE lines) then process.env -----------------------
function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnv();

const KEY = process.env.POCKETSMITH_KEY || '';
const PORT = Number(process.env.PORT || 4180);
const DEMO = process.env.DEMO === '1' || process.env.DEMO === 'true';
const API_BASE = 'https://api.pocketsmith.com/v2';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.map': 'application/json'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}
function sendJSON(res, status, obj, headers = {}) {
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', ...headers });
}

// ---- demo fixtures ---------------------------------------------------------
function demoFile(apiPath) {
  // /users/882138/accounts → demo/accounts.json etc.
  const last = apiPath.split('/').filter(Boolean).pop();
  const map = { me: 'me', accounts: 'accounts', transaction_accounts: 'transaction_accounts', categories: 'categories', transactions: 'transactions', events: 'events' };
  return map[last] ? path.join(PUBLIC, 'demo', map[last] + '.json') : null;
}

async function proxy(req, res, url) {
  const apiPath = url.pathname.replace(/^\/api/, '') || '/';

  if (apiPath === '/_health') {
    return sendJSON(res, 200, { ok: true, demo: DEMO, keyConfigured: Boolean(KEY), userIdHint: 882138 });
  }
  if (req.method !== 'GET') return sendJSON(res, 405, { error: 'Read-only proxy: only GET is forwarded.' });

  if (DEMO) {
    const f = demoFile(apiPath);
    if (!f || !fs.existsSync(f)) return sendJSON(res, 404, { error: 'No demo fixture for ' + apiPath });
    let body = fs.readFileSync(f, 'utf8');
    // Demo transactions ignore paging: only page 1 has content.
    const page = Number(url.searchParams.get('page') || 1);
    if (apiPath.endsWith('/transactions') && page > 1) body = '[]';
    return send(res, 200, body, { 'Content-Type': 'application/json; charset=utf-8', 'X-Demo': '1' });
  }

  if (!KEY) return sendJSON(res, 503, { error: 'POCKETSMITH_KEY is not set. Copy .env.example to .env and add your developer key, or run with DEMO=1.' });

  const target = API_BASE + apiPath + (url.search || '');
  try {
    const upstream = await fetch(target, {
      headers: { 'X-Developer-Key': KEY, 'Accept': 'application/json', 'User-Agent': 'sabino-finance-command/1.0' }
    });
    const text = await upstream.text();
    const headers = { 'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8' };
    // Forward pagination + rate-limit metadata so the client can follow pages.
    for (const h of ['link', 'x-total-count', 'per-page', 'total', 'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset', 'retry-after']) {
      const v = upstream.headers.get(h);
      if (v) headers[h] = v;
    }
    send(res, upstream.status, text, headers);
  } catch (err) {
    sendJSON(res, 502, { error: 'Upstream request failed: ' + (err && err.message) });
  }
}

function serveStatic(res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/' || p === '') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC)) return send(res, 403, 'Forbidden');
  fs.readFile(file, (err, data) => {
    if (err) {
      // SPA fallback: unknown paths render index.html (hash routing is used, so this is rare)
      if (!path.extname(p)) return fs.readFile(path.join(PUBLIC, 'index.html'), (e2, d2) => e2 ? send(res, 404, 'Not found') : send(res, 200, d2, { 'Content-Type': MIME['.html'] }));
      return send(res, 404, 'Not found');
    }
    send(res, 200, data, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) return proxy(req, res, url);
  serveStatic(res, url);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Finance command center → http://localhost:${PORT}`);
  console.log(DEMO ? '  Mode: DEMO (bundled fixtures)\n' : KEY ? '  Mode: LIVE (PocketSmith key loaded from .env)\n' : '  Mode: LIVE but no key found — copy .env.example to .env\n');
});
