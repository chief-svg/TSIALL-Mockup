// Small async key/value store. Local build: localStorage. Hosted build swaps in
// an artifact-db backend (see finance/hosted/runtime.js) so overrides and
// snapshots follow the user across devices.
window.STORE = (() => {
  const P = 'fd.store.';
  const local = {
    async get(k) { try { const r = localStorage.getItem(P + k); return r ? JSON.parse(r) : null; } catch { return null; } },
    async set(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch { /* quota / private mode */ } }
  };
  let backend = local;
  return {
    get: k => backend.get(k),
    set: (k, v) => backend.set(k, v),
    local,
    use(b) { backend = { get: k => b.get(k).catch(() => local.get(k)), set: (k, v) => Promise.all([local.set(k, v), b.set(k, v).catch(() => {})]) }; }
  };
})();
