// Hosted runtime: replaces api.js when the app is published as a claude.ai
// artifact. Data comes from the viewer's own PocketSmith connector via the
// artifact `mcp` capability (no key, no proxy); overrides and snapshots live in
// the artifact database (`db`); screenshots are read by Claude (`sample`).
(function () {
  const SERVER = 'PocketSmith_Complete_Access';
  const TOOLS = { accounts: 'list_accounts', categories: 'list_categories', transactions: 'list_transactions', events: 'list_events' };
  const has = typeof window.claude === 'object' && window.claude && typeof window.claude.use === 'function';
  const use = name => has ? window.claude.use(name).catch(() => null) : Promise.resolve(null);
  const mcpP = use('mcp'), dbP = use('db'), sampleP = use('sample');

  // Connector results arrive as text blocks; list_transactions prefixes a
  // "Page 1 of 3 (81 total)" line before the JSON.
  function text(res) { return res && Array.isArray(res.content) ? res.content.filter(b => b.type === 'text').map(b => b.text).join('\n') : ''; }
  function unwrap(res) {
    let p = res && res.structuredContent != null ? res.structuredContent : res && res.payload != null ? res.payload : text(res);
    if (typeof p === 'string') {
      const idx = [p.indexOf('['), p.indexOf('{')].filter(i => i >= 0).sort((a, b) => a - b)[0];
      if (idx == null) throw new Error('Unexpected response from PocketSmith: ' + p.slice(0, 80));
      p = JSON.parse(p.slice(idx));
    }
    return p;
  }
  function pages(res) { const m = /Page\s+(\d+)\s+of\s+(\d+)/i.exec(text(res) || (typeof res.payload === 'string' ? res.payload : '')); return m ? { page: Number(m[1]), pages: Number(m[2]) } : null; }

  const timeout = ms => (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(ms) : undefined;
  async function call(mcp, tool, input) { return mcp.callTool(SERVER, tool, input, { cache: false, signal: timeout(45000) }); }
  const prog = m => { try { if (window.API && window.API.onProgress) window.API.onProgress(m); } catch { /* ignore */ } };

  window.API = {
    sourceLabel: 'PocketSmith connector (your claude.ai login)',
    async health() { const mcp = await mcpP; return { ok: true, demo: false, connector: !!mcp }; },
    async loadAll({ userId, txStart, txEnd, evStart, evEnd }) {
      prog('Connecting to PocketSmith…');
      const mcp = await mcpP;
      if (!mcp) { const e = new Error('This page can only reach PocketSmith when opened inside claude.ai.'); e.code = 'no_runtime'; throw e; }
      const wrap = p => p.catch(err => { const e = new Error(copyFor(err)); e.code = err && err.code; e.raw = err; throw e; });
      prog('Pulling accounts, categories, calendar, transactions…');
      const txInput = page => ({ user_id: userId, start_date: txStart, end_date: txEnd, per_page: 100, page });
      const [accounts, categories, events, first] = await Promise.all([
        wrap(call(mcp, TOOLS.accounts, { user_id: userId })).then(unwrap),
        wrap(call(mcp, TOOLS.categories, { user_id: userId })).then(unwrap),
        wrap(call(mcp, TOOLS.events, { user_id: userId, start_date: evStart, end_date: evEnd })).then(unwrap).catch(() => []),
        wrap(call(mcp, TOOLS.transactions, txInput(1)))
      ]);
      const transactions = [];
      const firstList = unwrap(first); transactions.push(...(Array.isArray(firstList) ? firstList : []));
      const pg = pages(first);
      const total = pg ? Math.min(pg.pages, 40) : (transactions.length >= 100 ? 2 : 1);
      if (total > 1) {
        prog(`Transactions: ${total} pages…`);
        if (pg) {
          // Known page count → fetch the rest in parallel
          const rest = await Promise.all(Array.from({ length: total - 1 }, (_, i) => wrap(call(mcp, TOOLS.transactions, txInput(i + 2))).then(unwrap)));
          for (const l of rest) transactions.push(...(Array.isArray(l) ? l : []));
        } else {
          for (let page = 2; page <= 40; page++) { const l = unwrap(await wrap(call(mcp, TOOLS.transactions, txInput(page)))); const list = Array.isArray(l) ? l : []; transactions.push(...list); if (list.length < 100) break; }
        }
      }
      prog('Building views…');
      return { accounts: Array.isArray(accounts) ? accounts : [], categories: Array.isArray(categories) ? categories : [], transactions, events: Array.isArray(events) ? events : [], fetchedAt: Date.now() };
    },
    setupCopy(err) {
      const code = err && err.code;
      const fix = {
        no_runtime: ['Open it inside claude.ai', 'Connectors are only reachable when this page runs in the claude.ai artifact viewer. Open the link from the Claude app or claude.ai, then add it to your home screen from there.'],
        server_not_connected: ['Add the PocketSmith connector', 'claude.ai → Settings → Connectors → add PocketSmith (Complete Access). Then reopen this page.'],
        not_granted: ['Allow PocketSmith for this page', 'When claude.ai asks whether this page may use your PocketSmith connector, choose Allow. Then tap Resync.'],
        approval_required: ['Approve the connector request', 'Confirm the PocketSmith prompt from claude.ai, then tap Resync.'],
        server_unavailable: ['PocketSmith is not answering', 'The connector timed out or returned an error. Tap Resync in a minute — cached balances stay visible when available.'],
        auth_expired: ['Reconnect PocketSmith', 'The connector’s login expired. claude.ai → Settings → Connectors → reconnect PocketSmith, then Resync.'],
        rate_limited: ['Too many requests', 'PocketSmith throttled the connector. Wait a minute, then Resync.']
      }[code] || ['Could not load PocketSmith', err && err.message ? err.message : 'Unknown error'];
      return `<div class="setup"><h1 class="serif" style="font-weight:300;font-size:34px">${fix[0]}</h1><p class="muted" style="margin:10px 0 18px">${fix[1]}</p>
        <div class="panel"><div class="kv"><span class="k">Error</span><span class="v">${code || 'unknown'}</span><span class="k">Detail</span><span class="v small">${(err && err.message || '').replace(/[<>]/g, '')}</span></div>
        <div class="hr"></div><div class="note">Reads only: this page lists accounts, categories, transactions and calendar events. It never changes anything in PocketSmith. Balances you enter by hand or from screenshots are stored with this page, not sent to PocketSmith.</div>
        <div style="margin-top:14px"><button class="btn primary" onclick="APP.refresh()">Resync</button></div></div></div>`;
    }
  };
  function copyFor(err) {
    const code = err && err.code;
    return ({ server_not_connected: 'PocketSmith connector is not added in claude.ai', not_granted: 'PocketSmith access was not allowed for this page', approval_required: 'PocketSmith access needs your approval', server_unavailable: 'PocketSmith did not respond', auth_expired: 'PocketSmith login expired — reconnect in claude.ai', rate_limited: 'PocketSmith rate limit hit', not_in_manifest: 'Page manifest is missing a tool', tool_error: 'PocketSmith returned an error: ' + (err.message || '') })[code] || (err && err.message) || String(err);
  }

  // ---- db-backed store (overrides + snapshots follow the user across devices)
  const dbReady = dbP.then(db => {
    if (!db) return;
    STORE.use({
      async get(k) {
        if (k === 'cache') {
          // Newer of this device's cache and the shared one (written by the page or the 7pm sync routine)
          const [l, s] = await Promise.all([STORE.local.get(k), db.doc('state/cache').get().catch(() => null)]);
          const d = s && s.exists ? (s.data() || {}).value : null;
          return d && (!l || (d.at || 0) > (l.at || 0)) ? d : l;
        }
        const s = await db.doc('state/' + k).get(); return s.exists ? (s.data() || {}).value ?? null : null;
      },
      async set(k, v) { await db.doc('state/' + k).set({ value: v, at: Date.now() }); }
    });
  });
  window.READY = Promise.all([mcpP, dbReady]);

  // ---- screenshot reading via Claude
  window.VISION = {
    async available() { const s = await sampleP; if (!s) return false; try { const l = await s.limits(); return !!(l && l.images); } catch { return false; } },
    async parse(files, accounts) {
      const s = await sampleP; if (!s) throw { code: 'not_granted' };
      const list = accounts.map(a => ({ id: a.id, name: a.short, fullName: a.label, institution: a.institution, last4: a.number, kind: a.isDebt ? (a.role === 'loan' ? 'loan' : 'credit card') : 'bank', currentBalance: a.balance }));
      const prompt = `You are reading screenshots of banking / credit-card / loan apps to update account balances.\n\nKnown accounts (JSON):\n${JSON.stringify(list)}\n\nFor every account you can identify in the images, return the CURRENT balance (not "statement balance", "minimum due", "available credit" or "credit limit"). Sign convention: money OWED on credit cards and loans is NEGATIVE; bank/checking balances are POSITIVE. Match by institution, card name and last-4 digits; use currentBalance only as a sanity check. If a date is visible ("as of"), include it as YYYY-MM-DD, else null.\n\nRespond with ONLY a JSON array, no prose: [{"id": <account id number>, "balance": <number>, "asOf": "YYYY-MM-DD" or null, "confidence": 0..1, "evidence": "<short text you read, e.g. 'Platinum Card …1001 current balance $10,801.51'>"}]. Return [] if nothing is legible.`;
      const out = await s.json(prompt, { images: files, modelTier: 'default', cache: false });
      const byId = Object.fromEntries(accounts.map(a => [String(a.id), a]));
      return (Array.isArray(out) ? out : []).map(o => ({ id: Number(o.id), balance: Number(o.balance), asOf: /^\d{4}-\d{2}-\d{2}$/.test(o.asOf || '') ? o.asOf : null, confidence: Math.max(0, Math.min(1, Number(o.confidence) || 0)), evidence: String(o.evidence || '').slice(0, 120) }))
        .filter(o => byId[String(o.id)] && !isNaN(o.balance));
    },
    errorCopy(err) {
      const code = err && err.code;
      return ({ not_granted: 'Allow this page to ask Claude when prompted, then try again.', rate_limited: 'Too many requests — wait a minute and try again.', images_unavailable: 'This view cannot send images to Claude.', image_rejected: 'One of the files was not accepted — use PNG or JPEG screenshots.', invalid_json: 'Claude could not produce a clean reading — try a clearer screenshot.', cancelled: 'Cancelled.' })[code] || ('Could not read the screenshots: ' + (err && err.message || code || err));
    }
  };
})();
