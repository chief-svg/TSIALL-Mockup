// Allocate — where each month's put-away goes (three doughnuts), with a live slider.
VIEWS.allocate = {
  SLICES: [
    { key: 'toEF', label: 'Emergency fund', color: '#3987e5' },
    { key: 'brokerage', label: 'Brokerage', color: '#c98500' },
    { key: 'k401', label: '401(k) payroll', color: '#7b6fe0', payroll: true },
    { key: 'roth', label: 'Backdoor Roth IRAs', color: '#199e70' },
    { key: 'hsa', label: 'HSA', color: '#c47a12' }
  ],
  prefs(S) { const p = S.prefs.alloc || {}; return { base: p.base ?? PLAN.post.monthlyCapacity, over: p.over || {}, start: p.start || PLAN.post.startMonth }; },
  compute(S, pr) {
    const hsaOn = S.prefs.hsaOn ?? PLAN.post.hsa.defaultOn;
    const A = ENGINE.allocationTable({ hsaOn, efStart: S.ctx.totals.savings, startMonth: pr.start, months: 3, capacity: ym => pr.over[ym] ?? pr.base });
    return A.rows.map(r => ({ ...r, k401: r.jessica401k + r.sabino401k, total: r.capacity, totalAll: r.capacity + r.jessica401k + r.sabino401k }));
  },
  monthAdd(ym, n) { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; },
  render(S) {
    const pr = this.prefs(S); const rows = this.compute(S, pr); const post = PLAN.post;
    const hsaOn = S.prefs.hsaOn ?? post.hsa.defaultOn;
    const months = rows.map(r => r.ym);
    const monthCard = r => `<div class="panel" data-ym="${r.ym}">
        <div class="ph"><h3>${F.fmtMonth(r.ym)}</h3><span class="num" style="font-size:16px" data-total>${F.money(r.total)}</span></div>
        <div style="height:220px;position:relative"><canvas id="pie-${r.ym}"></canvas></div>
        <div class="legend-list" data-legend style="margin-top:12px"></div>
        <div class="hr"></div>
        <div class="ctl" style="justify-content:space-between"><label>This month</label><input type="range" min="0" max="45000" step="500" value="${pr.over[r.ym] ?? pr.base}" data-month="${r.ym}" style="flex:1"><span class="val num" data-monthval>${F.money(pr.over[r.ym] ?? pr.base)}</span><button class="btn sm" data-reset="${r.ym}" ${pr.over[r.ym] == null ? 'disabled' : ''}>Reset</button></div>
        <div class="note" style="margin-top:8px" data-efnote></div>
      </div>`;
    return `<div class="page-head"><div><h1>Allocate</h1><p>Where each month’s put-away goes once the debt is gone. Slide the monthly amount to make it more aggressive, or pull a single month back for a big expense — the pies re-slice as you drag. Waterfall order: emergency fund → Roth → HSA → brokerage${UI.ast()}. 401(k) is payroll-side and shown for the full picture.</p></div>
      <div class="controls" style="margin:0;flex-direction:column;align-items:stretch;min-width:300px">
        <div class="ctl" style="justify-content:space-between"><label>Put away per month</label><span class="val num gold" style="font-size:18px;min-width:90px;text-align:right" id="al-baseval">${F.money(pr.base)}</span></div>
        <input type="range" id="al-base" min="0" max="45000" step="500" value="${pr.base}" style="width:100%">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span class="xs muted">$0</span><span class="xs muted">plan ${F.money(post.monthlyCapacity)}</span><span class="xs muted">$45k</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-preset="scaled">Scaled back −25%</button><button class="btn sm" data-preset="plan">Plan</button><button class="btn sm" data-preset="aggressive">Aggressive +15%</button><button class="btn sm" id="al-clear">Clear month overrides</button></div>
      </div></div>

      <div class="controls" style="justify-content:space-between">
        <div style="display:flex;gap:8px;align-items:center"><button class="btn sm" id="al-prev">‹</button><span class="eyebrow" style="min-width:150px;text-align:center">${F.fmtMonth(months[0])} – ${F.fmtMonth(months[2])}</span><button class="btn sm" id="al-next">›</button></div>
        <div class="ctl"><label>HSA (HDHP chosen)</label><button class="switch ${hsaOn ? 'on' : ''}" id="al-hsa" aria-label="toggle HSA"></button></div>
        <div class="legend" id="al-key">${this.SLICES.filter(s => s.key !== 'hsa' || hsaOn).map(s => `<span><i class="dot" style="background:${s.color}"></i>${s.label}</span>`).join('')}</div>
      </div>

      <div class="grid g3" id="al-months">${rows.map(monthCard).join('')}</div>

      <div class="panel flush" style="margin-top:18px"><div class="ph"><h3>Three-month totals</h3><span class="small muted" id="al-window">${F.fmtMonth(months[0])} – ${F.fmtMonth(months[2])}</span></div>
        <div class="table-wrap"><table id="al-totals"><thead><tr><th>Destination</th>${months.map(m => `<th class="num">${F.fmtMonth(m)}</th>`).join('')}<th class="num">Total</th></tr></thead><tbody></tbody></table></div>
        <div class="note" style="padding:12px 20px">Emergency fund fills to ${F.money(post.emergencyFund.target)} first (live savings + the Dec ’26 ${F.money(13000)} buffer count toward it${UI.ast()}); Roth ${F.money(post.roth.monthly)}/mo up to ${F.money(post.roth.annualEach * 2)}/yr; HSA ${F.money(post.hsa.monthly)}/mo when on; brokerage takes the remainder. 401(k): Jessica ${F.money(post.jessica401k.annual)}/yr from Jan; Sabino ${F.money(post.sabino401k.annual)}/yr from ${F.fmtDate(post.sabino401k.eligibleDate)}${UI.ast()}. Changes here are saved on this device and feed nothing else — the plan’s ${F.money(post.monthlyCapacity)} stays the reference.</div></div>`;
  },
  mount(S, root) {
    const V = this; let pr = V.prefs(S); const charts = {};
    const save = () => S.setPref('alloc', pr);
    const slicesFor = (r) => V.SLICES.map(s => ({ ...s, v: s.key === 'k401' ? r.k401 : (r[s.key] || 0) })).filter(s => s.v > 0.5 && (s.key !== 'hsa' || (S.prefs.hsaOn ?? PLAN.post.hsa.defaultOn)));
    const draw = () => {
      const rows = V.compute(S, pr);
      rows.forEach(r => {
        const card = root.querySelector(`[data-ym="${r.ym}"]`); if (!card) return;
        const sl = slicesFor(r); const all = r.totalAll || 1;
        card.querySelector('[data-total]').textContent = F.money(r.total);
        card.querySelector('[data-monthval]').textContent = F.money(pr.over[r.ym] ?? pr.base);
        card.querySelector('[data-reset]').disabled = pr.over[r.ym] == null;
        card.querySelector('[data-month]').value = pr.over[r.ym] ?? pr.base;
        card.querySelector('[data-legend]').innerHTML = sl.map(s => `<div style="display:grid;grid-template-columns:12px 1fr auto auto;gap:8px;align-items:center;padding:4px 0;font-size:12.5px"><i style="width:10px;height:10px;border-radius:50%;background:${s.color};display:inline-block"></i><span>${s.label}${s.payroll ? ' <span class="xs muted">payroll</span>' : ''}</span><span class="num">${F.money(s.v)}</span><span class="num muted xs" style="min-width:38px;text-align:right">${(s.v / all * 100).toFixed(0)}%</span></div>`).join('') || '<div class="muted small">Nothing put away this month</div>';
        card.querySelector('[data-efnote]').innerHTML = r.efDone ? `Emergency fund full (${F.money(PLAN.post.emergencyFund.target)}) ✓` : `Emergency fund ${F.money(r.ef)} / ${F.money(PLAN.post.emergencyFund.target)} after this month`;
        const cfg = { labels: sl.map(s => s.label), data: sl.map(s => s.v), colors: sl.map(s => s.color) };
        if (charts[r.ym]) { const c = charts[r.ym]; c.data.labels = cfg.labels; c.data.datasets[0].data = cfg.data; c.data.datasets[0].backgroundColor = cfg.colors; c.update('none'); }
        else charts[r.ym] = CH.make(card.querySelector('canvas'), { type: 'doughnut', data: { labels: cfg.labels, datasets: [{ data: cfg.data, backgroundColor: cfg.colors, borderColor: '#10161d', borderWidth: 2, hoverOffset: 6 }] }, options: { maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: false }, guides: { zero: false }, tooltip: { callbacks: { label: i => { const tot = i.dataset.data.reduce((a, b) => a + b, 0) || 1; return ` ${i.label}: ${F.money(i.parsed)} (${(i.parsed / tot * 100).toFixed(0)}%)`; } } } } } });
      });
      // totals table
      const keys = V.SLICES.filter(s => s.key !== 'hsa' || (S.prefs.hsaOn ?? PLAN.post.hsa.defaultOn));
      const tb = root.querySelector('#al-totals tbody');
      tb.innerHTML = keys.map(s => { const vals = rows.map(r => s.key === 'k401' ? r.k401 : (r[s.key] || 0)); return `<tr><td><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:8px"></i>${s.label}${s.payroll ? ' <span class="xs muted">payroll</span>' : ''}</td>${vals.map(v => `<td class="num">${v ? F.money(v) : '—'}</td>`).join('')}<td class="num"><b>${F.money(vals.reduce((a, b) => a + b, 0))}</b></td></tr>`; }).join('')
        + `<tr class="group"><td>Put away (cash)</td>${rows.map(r => `<td class="num">${F.money(r.total)}</td>`).join('')}<td class="num"><b>${F.money(rows.reduce((a, r) => a + r.total, 0))}</b></td></tr>`;
      root.querySelector('#al-baseval').textContent = F.money(pr.base);
    };
    const base = root.querySelector('#al-base');
    base.addEventListener('input', () => { pr.base = Number(base.value); draw(); });
    base.addEventListener('change', save);
    root.querySelectorAll('[data-month]').forEach(inp => {
      inp.addEventListener('input', () => { pr.over[inp.dataset.month] = Number(inp.value); draw(); });
      inp.addEventListener('change', save);
    });
    root.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', () => { delete pr.over[b.dataset.reset]; save(); draw(); }));
    root.querySelector('#al-clear').addEventListener('click', () => { pr.over = {}; save(); draw(); });
    root.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => { const p = PLAN.post.monthlyCapacity; pr.base = b.dataset.preset === 'plan' ? p : b.dataset.preset === 'aggressive' ? Math.round(p * 1.15 / 500) * 500 : Math.round(p * 0.75 / 500) * 500; base.value = pr.base; save(); draw(); }));
    root.querySelector('#al-prev').addEventListener('click', () => { pr.start = V.monthAdd(pr.start, -1); save(); APP.render(); });
    root.querySelector('#al-next').addEventListener('click', () => { pr.start = V.monthAdd(pr.start, 1); save(); APP.render(); });
    root.querySelector('#al-hsa').addEventListener('click', () => { S.setPref('hsaOn', !(S.prefs.hsaOn ?? PLAN.post.hsa.defaultOn)); APP.render(); });
    draw();
  }
};
