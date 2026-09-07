// App controller: data load, derived state, routing, header.
window.VIEWS = window.VIEWS || {};
window.UI = {
  chip: (status, label) => `<span class="chip ${F.esc(status)}">${F.esc(label || status)}</span>`,
  bar: (ratio, cls = '', tick) => `<div class="bar"><i class="${cls}" style="width:${F.clamp(ratio * 100, 0, 100).toFixed(1)}%"></i>${tick != null ? `<span class="tick" style="left:${F.clamp(tick * 100, 0, 100).toFixed(1)}%"></span>` : ''}</div>`,
  ast: () => '<span class="ast" title="Assumption / estimate — see notes">*</span>',
  money: (n, cls = true) => `<span class="num ${cls ? (n < 0 ? 'neg' : n > 0 ? 'pos' : '') : ''}">${F.money(n)}</span>`,
  signed: n => `<span class="num ${n < 0 ? 'neg' : n > 0 ? 'pos' : ''}">${F.signed(n)}</span>`
};

window.APP = (() => {
  const ROUTES = [
    ['command', 'Command', '1'], ['payoff', 'Payoff', '2'], ['spending', 'Spending', '3'], ['projection', 'Projection', '4'],
    ['after', 'After Debt', '5'], ['million', 'Path to $1M', '6'], ['accounts', 'Accounts', '7']
  ];
  const PREF_KEY = 'fd.prefs.v1';
  const state = { ctx: null, d: null, raw: null, meta: { mode: 'live', stale: false, fetchedAt: null, error: null, cachedAt: null }, prefs: loadPrefs(), loading: false };

  function loadPrefs() { try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { return {}; } }
  function setPref(k, v) { state.prefs[k] = v; try { localStorage.setItem(PREF_KEY, JSON.stringify(state.prefs)); } catch { /* ignore */ } }

  function derive(ctx) {
    const sched = ENGINE.schedule(ctx);
    const ledger = ENGINE.monthLedger(ctx);
    const sims = ENGINE.simulateAll(ctx, sched, ledger);
    const living = ENGINE.livingTracker(ctx);
    const spend = ENGINE.spendingTree(ctx, living.from, ctx.today);
    const proj = ENGINE.projectionSeries(ctx);
    const funds = ENGINE.fundsCheck(ctx, sched, ledger);
    return { sched, ledger, sims, living, spend, proj, funds };
  }

  function applyData(raw, meta) {
    state.raw = raw;
    state.ctx = ENGINE.buildContext(raw);
    if (!meta.stale) ENGINE.recordSnapshot(state.ctx);
    state.d = derive(state.ctx);
    Object.assign(state.meta, meta);
    render();
  }

  async function refresh() {
    if (state.loading) return;
    state.loading = true; renderHeader();
    const P = window.PLAN, today = F.today();
    const txStart = F.addDays([P.planStart, F.monthStart(today)].sort()[0], -P.match.days);
    const cached = API.loadCache();
    try {
      API.clearMem();
      const health = await API.health();
      const raw = await API.loadAll({ userId: P.userId, txStart, txEnd: F.addDays(today, 1), evStart: today, evEnd: F.addDays(today, 60) });
      API.saveCache(raw);
      applyData(raw, { mode: health.demo ? 'demo' : 'live', stale: false, fetchedAt: new Date(raw.fetchedAt), error: null });
    } catch (err) {
      console.error(err);
      if (cached && cached.payload) {
        applyData(cached.payload, { mode: 'live', stale: true, fetchedAt: new Date(cached.at), error: err.message, cachedAt: new Date(cached.at) });
        toast(`Live refresh failed — showing data cached ${F.fmtTime(new Date(cached.at))}. ${err.message}`);
      } else {
        state.meta.error = err.message; state.meta.mode = 'error';
        renderHeader(); renderSetup(err);
      }
    } finally { state.loading = false; renderHeader(); }
  }

  // ---- render --------------------------------------------------------------
  function route() { const h = (location.hash || '#/command').replace(/^#\//, '').split('?')[0]; return ROUTES.some(r => r[0] === h) ? h : 'command'; }

  function renderHeader() {
    const r = route();
    document.getElementById('tabs').innerHTML = ROUTES.map(([id, label, k]) => `<a href="#/${id}" class="${id === r ? 'on' : ''}"><span class="k">${k}</span>${label}</a>`).join('');
    const b = document.getElementById('mode-badge');
    const m = state.meta;
    if (state.loading) { b.className = 'badge'; b.textContent = 'Refreshing'; }
    else if (m.mode === 'error') { b.className = 'badge err'; b.textContent = 'Offline'; }
    else if (m.stale) { b.className = 'badge stale'; b.textContent = 'Stale · cached'; }
    else if (m.mode === 'demo') { b.className = 'badge demo'; b.textContent = 'Demo data'; }
    else { b.className = 'badge live'; b.textContent = 'Live · PocketSmith'; }
    document.getElementById('refreshed').textContent = m.fetchedAt ? `as of ${F.fmtTime(m.fetchedAt)}` : '';
    document.getElementById('refresh').disabled = state.loading;
    document.title = `${ROUTES.find(x => x[0] === r)[1]} · Command`;
  }

  function renderStrip() {
    const el = document.getElementById('strip');
    document.querySelector('.strip').classList.toggle('hidden', !state.ctx);
    if (!state.ctx) { el.innerHTML = ''; return; }
    const t = state.ctx.totals, d = state.d;
    const days = F.daysBetween(state.ctx.today, d.sims.debtFree || PLAN.debtFreeDate);
    const drift = d.proj.drift;
    el.innerHTML = `
      <div class="stat"><div class="eyebrow">Net position</div><div class="v ${t.net < 0 ? 'neg' : 'pos'}">${F.money(t.net)}</div><div class="s">cash + savings + debt</div></div>
      <div class="stat"><div class="eyebrow">Total debt</div><div class="v neg">${F.money(t.debt)}</div><div class="s">cards ${F.money(t.cards)} · loans ${F.money(t.loans)}</div></div>
      <div class="stat"><div class="eyebrow">Cash</div><div class="v">${F.money(t.cash)}</div><div class="s">BofA checking</div></div>
      <div class="stat"><div class="eyebrow">Savings & invested</div><div class="v">${F.money(t.savings)}</div><div class="s">${t.savings ? 'non-operating balances' : 'nothing yet — starts Jan ’27'}</div></div>
      <div class="stat"><div class="eyebrow">Plan drift</div><div class="v ${drift > 500 ? 'neg' : drift < -500 ? 'pos' : ''}">${F.signed(drift)}</div><div class="s">${drift > 500 ? 'more debt than plan today' : drift < -500 ? 'ahead of plan today' : 'on plan today'}</div></div>
      <div class="stat"><div class="eyebrow">Debt-free</div><div class="v gold">${days} d</div><div class="s">${F.fmtDate(d.sims.debtFree || PLAN.debtFreeDate)}${d.sims.debtFree ? '' : ' (plan)'}</div></div>`;
  }

  function render() {
    renderHeader(); renderStrip();
    const main = document.getElementById('main');
    if (!state.ctx) return;
    const v = VIEWS[route()];
    const S = { ctx: state.ctx, d: state.d, meta: state.meta, prefs: state.prefs, setPref, raw: state.raw };
    main.innerHTML = v.render(S) + footer();
    if (v.mount) v.mount(S, main);
    window.scrollTo({ top: 0 });
  }

  function footer() {
    const m = state.meta;
    return `<div class="footer"><span>Live balances are truth; plan figures are targets. <span class="ast">*</span> marks an assumption or estimate — edit <span class="mono">js/plan.js</span> to true-up.</span><span>${m.mode === 'demo' ? 'Demo fixtures' : 'PocketSmith API via local proxy'} · user ${PLAN.userId} · ${state.ctx ? state.ctx.txs.length + ' transactions loaded' : ''}</span></div>`;
  }

  function renderSetup(err) {
    document.getElementById('strip').innerHTML = ''; document.querySelector('.strip').classList.add('hidden');
    document.getElementById('main').innerHTML = `
      <div class="setup">
        <h1 class="serif" style="font-weight:300;font-size:34px">Connect PocketSmith</h1>
        <p class="muted" style="margin:10px 0 18px">${F.esc(err.message)}</p>
        <div class="panel">
          <ol style="margin:0;padding-left:18px;line-height:1.9">
            <li>PocketSmith → profile icon → <b>Security &amp; integrations → Manage developer keys → Create Key</b></li>
            <li>In <span class="mono">finance/</span>: copy <span class="mono">.env.example</span> → <span class="mono">.env</span> and paste the key as <span class="mono">POCKETSMITH_KEY=…</span> (it is gitignored)</li>
            <li>Restart the server (<span class="mono">npm start</span>) and hit Refresh.</li>
          </ol>
          <div class="hr"></div>
          <div class="note">No key handy? Run <span class="mono">npm run demo</span> to explore the UI with bundled fixtures. The proxy only ever forwards GET requests — the app cannot modify anything in PocketSmith.</div>
        </div>
      </div>`;
  }

  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 6000);
  }

  // ---- boot ----------------------------------------------------------------
  window.addEventListener('hashchange', render);
  document.getElementById('refresh').addEventListener('click', refresh);
  document.addEventListener('keydown', e => {
    if (e.target && /input|select|textarea/i.test(e.target.tagName)) return;
    const r = ROUTES.find(x => x[2] === e.key); if (r) location.hash = '#/' + r[0];
    if (e.key === 'r' && !e.metaKey && !e.ctrlKey) refresh();
  });
  refresh();

  return { state, refresh, render, setPref, toast };
})();
