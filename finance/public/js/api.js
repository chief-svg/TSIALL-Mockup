// PocketSmith client (via local proxy). Per-load memory cache + localStorage
// fallback so an API failure never yields a blank screen.
window.API = (() => {
  const mem = new Map();
  const LS_KEY = 'fd.cache.v1';

  function qs(params) {
    const p = Object.entries(params || {}).filter(([, v]) => v != null && v !== '');
    return p.length ? '?' + new URLSearchParams(p).toString() : '';
  }

  async function get(path, params) {
    const url = '/api' + path + qs(params);
    if (mem.has(url)) return mem.get(url);
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await res.text();
    let body; try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
    if (!res.ok) {
      const msg = (body && (body.error || body.message)) || `HTTP ${res.status}`;
      const err = new Error(`${path}: ${msg}`); err.status = res.status; err.body = body; throw err;
    }
    const out = { body, link: res.headers.get('link') || '', demo: res.headers.get('x-demo') === '1' };
    mem.set(url, out);
    return out;
  }

  // Paginated GET: follows Link rel="next" when present, else increments page until a short page.
  async function getAll(path, params, { perPage = 100, maxPages = 40 } = {}) {
    const all = [];
    let page = 1;
    for (; page <= maxPages; page++) {
      const { body, link } = await get(path, { ...params, per_page: perPage, page });
      const arr = Array.isArray(body) ? body : [];
      all.push(...arr);
      const hasNext = /rel="next"/.test(link);
      if (!hasNext && arr.length < perPage) break;
      if (!arr.length) break;
    }
    return all;
  }

  function health() { return fetch('/api/_health').then(r => r.json()).catch(() => ({ ok: false })); }

  // ---- snapshot cache (last good payload) ------------------------------------
  function saveCache(payload) {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ at: Date.now(), payload })); } catch { /* quota / private mode */ }
  }
  function loadCache() {
    try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  function clearMem() { mem.clear(); }

  // Fetch everything the app needs in one pass.
  async function loadAll({ userId, txStart, txEnd, evStart, evEnd }) {
    const u = `/users/${userId}`;
    const [accounts, categories, transactions, events] = await Promise.all([
      get(`${u}/accounts`).then(r => r.body),
      get(`${u}/categories`).then(r => r.body),
      getAll(`${u}/transactions`, { start_date: txStart, end_date: txEnd }),
      get(`${u}/events`, { start_date: evStart, end_date: evEnd }).then(r => r.body).catch(() => [])
    ]);
    return { accounts, categories, transactions, events, fetchedAt: Date.now() };
  }

  return { get, getAll, health, loadAll, saveCache, loadCache, clearMem };
})();
