// App controller: data load, derived state, routing, header, upcoming-payments popup, balance overrides.
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
  const state = { ctx: null, d: null, raw: null, overrides: {}, snapshots: {}, meta: { mode: 'live', stale: false, syncing: true, fetchedAt: null, error: null, cachedAt: null }, prefs: loadPrefs(), loading: false, popupShown: false, progress: '' };

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
    const near = ENGINE.nearTerm(ctx, sched, ledger, 42);
    return { sched, ledger, sims, living, spend, proj, funds, near };
  }

  function rebuild() {
    state.ctx = ENGINE.buildContext({ ...state.raw, overrides: state.overrides, snapshots: state.snapshots });
    state.d = derive(state.ctx);
  }

  function applyData(raw, meta) {
    state.raw = raw;
    Object.assign(state.meta, meta);
    rebuild();
    if (!meta.stale && !meta.partial) { state.snapshots = ENGINE.recordSnapshot(state.ctx, state.snapshots); STORE.set('snapshots', state.snapshots); rebuild(); }
    render();
    if (!state.popupShown) { state.popupShown = true; showUpcoming(); }
  }

  // Keep the cached payload small: only fields the engine reads.
  function compact(raw) {
    return { ...raw, transactions: (raw.transactions || []).map(t => ({ id: t.id, date: t.date, amount: t.amount, payee: t.payee, original_payee: t.original_payee, memo: t.memo, type: t.type, status: t.status, is_transfer: t.is_transfer, category: t.category ? { id: t.category.id, title: t.category.title, is_transfer: t.category.is_transfer, is_bill: t.category.is_bill } : null, transaction_account: t.transaction_account ? { id: t.transaction_account.id, account_id: t.transaction_account.account_id } : null })) };
  }

  function progress(msg) { state.progress = msg || ''; renderHeader(); const el = document.getElementById('load-progress'); if (el) el.textContent = state.progress; }

  // Paint whatever this device synced last, immediately, then go live.
  async function boot() {
    const [cached, ov, sn] = await Promise.all([STORE.local.get('cache'), STORE.local.get('overrides'), STORE.local.get('snapshots')]);
    if (cached && cached.payload) {
      state.overrides = ov || {}; state.snapshots = sn || {};
      applyData(cached.payload, { mode: 'live', stale: true, syncing: true, fetchedAt: new Date(cached.at), cachedAt: new Date(cached.at), error: null });
    } else {
      document.getElementById('main').innerHTML = `<div class="empty"><h2 class="serif">Loading live data…</h2><div class="muted" id="load-progress">${F.esc(state.progress || 'Connecting…')}</div></div>`;
    }
    progress(window.READY ? 'Waiting for claude.ai to grant access…' : 'Connecting…');
    await (window.READY || Promise.resolve());
    refresh();
  }

  async function refresh() {
    if (state.loading) return;
    state.loading = true; state.meta.syncing = true; renderHeader();
    const P = window.PLAN, today = F.today();
    const txStart = F.addDays([P.planStart, F.monthStart(today)].sort()[0], -P.match.days);
    const [overrides, snapshots, cached] = await Promise.all([STORE.get('overrides'), STORE.get('snapshots'), STORE.get('cache')]);
    state.overrides = overrides || {}; state.snapshots = snapshots || {};
    // A shared cache newer than what is on screen (e.g. from the scheduled sync) paints right away
    if (cached && cached.payload && (!state.meta.fetchedAt || cached.at > state.meta.fetchedAt.getTime())) applyData(cached.payload, { mode: 'live', stale: true, syncing: true, fetchedAt: new Date(cached.at), cachedAt: new Date(cached.at), error: null });
    API.onProgress = progress;
    API.onPartial = raw => { if (raw && raw.accounts && raw.accounts.length) applyData(raw, { mode: 'live', stale: false, syncing: true, partial: true, fetchedAt: new Date(raw.fetchedAt || Date.now()), error: null }); };
    try {
      if (API.clearMem) API.clearMem();
      const health = await API.health();
      const raw = await API.loadAll({ userId: P.userId, txStart, txEnd: F.addDays(today, 1), evStart: today, evEnd: F.addDays(today, 60) });
      const failed = raw.failed || [];
      if (!failed.length) STORE.set('cache', { at: Date.now(), payload: compact(raw) });
      applyData(raw, { mode: health.demo ? 'demo' : 'live', stale: false, syncing: false, partial: failed.length > 0, fetchedAt: new Date(raw.fetchedAt || Date.now()), error: null });
      if (failed.length) toast(`Balances are live, but ${failed.map(f => f.key).join(', ')} could not be loaded: ${failed[0].message}`);
    } catch (err) {
      console.error(err);
      if (cached && cached.payload) {
        applyData(cached.payload, { mode: 'live', stale: true, syncing: false, fetchedAt: new Date(cached.at), error: err.message, cachedAt: new Date(cached.at) });
        toast(`Live sync unavailable here (${err.code || 'error'}). Showing the ${F.fmtDate(F.toISO(new Date(cached.at)), { year: false })} ${F.fmtTime(new Date(cached.at))} sync.`);
      } else {
        state.meta.error = err.message; state.meta.mode = 'error'; state.meta.syncing = false;
        renderHeader(); renderSetup(err);
      }
    } finally { state.loading = false; state.meta.syncing = false; progress(''); renderHeader(); }
  }

  // ---- balance overrides (fail-safe) -----------------------------------------
  async function setOverrides(list) {
    for (const o of list) { if (o && o.id && typeof o.balance === 'number') state.overrides[o.id] = { balance: o.balance, asOf: o.asOf || F.today(), source: o.source || 'manual', note: o.note || '', at: Date.now() }; }
    await STORE.set('overrides', state.overrides);
    if (state.raw) { rebuild(); render(); }
    toast(`${list.length} balance${list.length === 1 ? '' : 's'} updated`);
  }
  async function clearOverride(id) {
    if (id === '*') state.overrides = {}; else delete state.overrides[id];
    await STORE.set('overrides', state.overrides);
    if (state.raw) { rebuild(); render(); }
  }

  // ---- render --------------------------------------------------------------
  function route() { const h = (location.hash || '#/command').replace(/^#\//, '').split('?')[0]; return ROUTES.some(r => r[0] === h) ? h : 'command'; }

  function renderHeader() {
    const r = route();
    document.getElementById('tabs').innerHTML = ROUTES.map(([id, label, k]) => `<a href="#/${id}" class="${id === r ? 'on' : ''}"><span class="k">${k}</span>${label}</a>`).join('');
    const b = document.getElementById('mode-badge');
    const m = state.meta;
    if (state.loading || m.syncing) { b.className = 'badge'; b.textContent = 'Syncing…'; }
    else if (m.mode === 'error') { b.className = 'badge err'; b.textContent = 'Offline'; }
    else if (m.stale) {
      const ageH = m.fetchedAt ? (Date.now() - m.fetchedAt.getTime()) / 36e5 : 999;
      const via = state.raw && state.raw.syncedBy === 'routine' ? 'scheduled sync' : 'last sync';
      if (ageH <= 26) { b.className = 'badge demo'; b.textContent = `Synced · ${via}`; }
      else { b.className = 'badge stale'; b.textContent = `Stale · ${Math.round(ageH / 24)}d old`; }
    }
    else if (m.mode === 'demo') { b.className = 'badge demo'; b.textContent = 'Demo data'; }
    else if (m.partial) { b.className = 'badge stale'; b.textContent = 'Live · partial'; }
    else { b.className = 'badge live'; b.textContent = 'Live · PocketSmith'; }
    const stamp = m.fetchedAt ? `${F.toISO(m.fetchedAt) === F.today() ? 'today' : F.fmtDate(F.toISO(m.fetchedAt), { year: false })} ${F.fmtTime(m.fetchedAt)}` : '';
    document.getElementById('refreshed').textContent = (state.loading || m.syncing) && state.progress ? state.progress : m.fetchedAt ? `PocketSmith pulled ${stamp}` : '';
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
    const ovCount = state.ctx.accounts.filter(a => a.override).length;
    const feedDate = state.ctx.accounts.map(a => a.feedDate).filter(Boolean).sort().pop();
    el.innerHTML = `
      <div class="stat"><div class="eyebrow">Net position</div><div class="v ${t.net < 0 ? 'neg' : 'pos'}">${F.money(t.net)}</div><div class="s">cash + savings + debt</div></div>
      <div class="stat"><div class="eyebrow">Total debt</div><div class="v neg">${F.money(t.debt)}</div><div class="s">cards ${F.money(t.cards)} · loans ${F.money(t.loans)}${feedDate ? ` · bank feeds ${F.fmtDate(feedDate, { year: false })}` : ''}</div></div>
      <div class="stat"><div class="eyebrow">Cash</div><div class="v">${F.money(t.cash)}</div><div class="s">BofA checking${ovCount ? ` · <a href="#/accounts" class="blue">${ovCount} manual balance${ovCount > 1 ? 's' : ''}</a>` : ''}</div></div>
      <div class="stat"><div class="eyebrow">Savings & invested</div><div class="v">${F.money(t.savings)}</div><div class="s">${t.savings ? 'non-operating balances' : 'nothing yet — starts Jan ’27'}</div></div>
      <div class="stat"><div class="eyebrow">Plan drift</div><div class="v ${drift > 500 ? 'neg' : drift < -500 ? 'pos' : ''}">${F.signed(drift)}</div><div class="s">${drift > 500 ? 'more debt than plan today' : drift < -500 ? 'ahead of plan today' : 'on plan today'}</div></div>
      <div class="stat"><div class="eyebrow">Debt-free</div><div class="v gold">${days} d</div><div class="s">${F.fmtDate(d.sims.debtFree || PLAN.debtFreeDate)}${d.sims.debtFree ? '' : ' (plan)'}</div></div>`;
  }

  function render() {
    renderHeader(); renderStrip();
    const main = document.getElementById('main');
    if (!state.ctx) return;
    const v = VIEWS[route()];
    const S = { ctx: state.ctx, d: state.d, meta: state.meta, prefs: state.prefs, setPref, raw: state.raw, overrides: state.overrides };
    main.innerHTML = v.render(S) + footer();
    if (v.mount) v.mount(S, main);
    window.scrollTo({ top: 0 });
  }

  function footer() {
    const m = state.meta;
    return `<div class="footer"><span>Live balances are truth; plan figures are targets. <span class="ast">*</span> marks an assumption or estimate — edit <span class="mono">js/plan.js</span> to true-up.</span><span>${m.mode === 'demo' ? 'Demo fixtures' : API.sourceLabel || 'PocketSmith API via local proxy'}${state.raw && state.raw.syncedBy === 'routine' ? ' · data written by the scheduled sync' : ''} · user ${PLAN.userId} · ${state.ctx ? state.ctx.txs.length + ' transactions loaded' : ''}</span></div>`;
  }

  function renderSetup(err) {
    document.getElementById('strip').innerHTML = ''; document.querySelector('.strip').classList.add('hidden');
    const custom = API.setupCopy ? API.setupCopy(err) : null;
    document.getElementById('main').innerHTML = custom || `
      <div class="setup">
        <h1 class="serif" style="font-weight:300;font-size:34px">Connect PocketSmith</h1>
        <p class="muted" style="margin:10px 0 18px">${F.esc(err.message)}</p>
        <div class="panel">
          <ol style="margin:0;padding-left:18px;line-height:1.9">
            <li>PocketSmith → profile icon → <b>Security &amp; integrations → Manage developer keys → Create Key</b></li>
            <li>In <span class="mono">finance/</span>: copy <span class="mono">.env.example</span> → <span class="mono">.env</span> and paste the key as <span class="mono">POCKETSMITH_KEY=…</span> (it is gitignored)</li>
            <li>Restart the server (<span class="mono">npm start</span>) and hit Resync.</li>
          </ol>
          <div class="hr"></div>
          <div class="note">No key handy? Run <span class="mono">npm run demo</span> to explore the UI with bundled fixtures. The proxy only ever forwards GET requests — the app cannot modify anything in PocketSmith.</div>
        </div>
      </div>`;
  }

  // ---- upcoming payments popup ----------------------------------------------
  function showUpcoming() {
    if (!state.d) return;
    const groups = state.d.sched.groups.filter(g => g.status !== 'done').slice(0, 2);
    if (!groups.length) return;
    const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.setAttribute('role', 'dialog'); bg.setAttribute('aria-modal', 'true');
    bg.innerHTML = `<div class="modal">
      <div class="eyebrow">Next two payments</div>
      <h2>${state.meta.stale ? 'Balances are from cache — ' : ''}${groups[0].daysUntil <= 0 ? 'A payment is due now' : `Next payment in ${groups[0].daysUntil} day${groups[0].daysUntil === 1 ? '' : 's'}`}</h2>
      <div class="upc">${groups.map((g, i) => {
        const fund = state.d.funds.find(f => f.date === g.date);
        const need = g.items.filter(x => x.status !== 'done').reduce((s, x) => s + x.amount, 0);
        return `<div class="item ${i === 0 ? 'first' : ''}">
          <div class="top"><div><div class="amt gold">${F.money(need)}</div><div class="when">${F.weekday(g.date)} ${F.fmtDate(g.date)} · ${g.daysUntil === 0 ? 'today' : g.daysUntil > 0 ? `in ${g.daysUntil}d` : `${-g.daysUntil}d overdue`}${g.kills.length ? ` · ☠ ${g.kills.join(', ')}` : ''}</div></div>
          <div class="right">${UI.chip(g.status)}${fund ? `<div class="xs ${fund.ok ? 'pos' : 'neg'}" style="margin-top:6px">${fund.ok ? 'funds covered' : 'short ' + F.money(-fund.gap)}${UI.ast()}</div>` : ''}</div></div>
          <div class="lines">${g.items.filter(x => x.status !== 'done').map(x => `<div><span>${x.acct ? F.esc(x.acct.short) : 'Interest buffer'}${x.acct ? ` <span class="muted xs">live ${F.money(x.acct.balance)}</span>` : ''}</span><span class="num">${F.money(x.amount)}</span></div>`).join('')}</div>
        </div>`; }).join('')}</div>
      <div class="actions"><a class="btn sm" href="#/payoff" id="upc-open">Open schedule</a><button class="btn sm primary" id="upc-ok">Got it</button></div>
    </div>`;
    const close = () => bg.remove();
    bg.addEventListener('click', e => { if (e.target === bg) close(); });
    bg.querySelector('#upc-ok').addEventListener('click', close);
    bg.querySelector('#upc-open').addEventListener('click', close);
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(bg);
    bg.querySelector('#upc-ok').focus();
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
  boot();

  return { state, refresh, render, setPref, toast, setOverrides, clearOverride, showUpcoming };
})();
