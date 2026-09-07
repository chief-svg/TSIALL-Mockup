// Projection view — plan lines through Sep 2027 with live-actual debt overlay.
VIEWS.projection = {
  render(S) {
    const { ctx, d } = S; const pr = d.proj; const t = ctx.totals; const N = d.near;
    const rows = pr.pts.map(p => {
      const isCur = p.date.slice(0, 7) === ctx.today.slice(0, 7) && p.label !== 'Now';
      return `<tr class="${isCur ? 'hl' : ''}"><td>${F.esc(p.label)}<span class="sub">${F.fmtDate(p.date)}</span></td><td class="num neg">${F.money(p.debt)}</td><td class="num pos">${F.money(p.savings)}</td><td class="num ${p.net < 0 ? 'neg' : 'pos'}">${F.money(p.net)}</td><td class="small muted">${p.note ? F.esc(p.note) : ''}${isCur ? `<span class="gold">live debt now ${F.money(t.debt)}</span>` : ''}</td></tr>`;
    }).join('');
    const snaps = pr.live.slice().reverse().slice(0, 30).map(s => `<tr><td class="num">${F.fmtDate(s.date)}</td><td class="num neg">${F.money(s.debt)}</td><td class="num">${F.money(s.savings)}</td><td class="num ${s.net < 0 ? 'neg' : 'pos'}">${F.money(s.net)}</td></tr>`).join('');
    return `<div class="page-head"><div><h1>Projection</h1><p>The chart PocketSmith can’t draw: debt, savings and net position through ${F.fmtMonth(pr.pts[pr.pts.length - 1].date)}, with live debt overlaid so drift shows at a glance. Savings series is conservative — excludes 401(k)s, employer match and market growth${UI.ast()}.</p></div>
      <div class="right"><div class="eyebrow">Drift today</div><div class="big ${pr.drift > 500 ? 'neg' : pr.drift < -500 ? 'pos' : ''}">${F.signed(pr.drift)}</div><div class="small muted">live debt ${F.money(t.debt)} vs plan ${F.money(pr.planToday)}</div></div></div>
      <div class="panel" style="margin-bottom:18px"><div class="ph"><h3>Next six weeks</h3><span class="legend"><span><i style="background:${CH.colors.debt}"></i>Total debt (plan path)</span><span><i style="background:${CH.colors.savings}"></i>Checking (plan path)</span><span><i class="dot" style="background:${CH.colors.live}"></i>Live</span></span></div>
        <div style="height:340px;position:relative"><canvas id="c-near"></canvas></div>
        <div class="grid g4" style="margin-top:14px;gap:10px">
          <div><div class="eyebrow">Debt today → ${F.fmtDate(N.end.date, { year: false })}</div><div class="num">${F.money(N.start.debt)} → <span class="pos">${F.money(N.end.debt)}</span></div></div>
          <div><div class="eyebrow">Retired in window</div><div class="num pos">${F.money(N.end.debt - N.start.debt)}</div></div>
          <div><div class="eyebrow">Payments in window</div><div class="num">${N.events.filter(e => e.pay).length} dates · ${F.money(N.events.reduce((s, e) => s + e.pay, 0))}</div></div>
          <div><div class="eyebrow">Checking low point${UI.ast()}</div><div class="num ${N.minCash < 0 ? 'neg' : ''}">${F.money(N.minCash)}<span class="sub">${N.minCashDate ? F.fmtDate(N.minCashDate, { year: false }) : ''}</span></div></div>
        </div>
        <div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>Date</th><th>In</th><th>Out → target</th><th class="num">Debt after</th><th class="num">Checking after</th></tr></thead><tbody>${N.events.map(e => { const s = N.series.find(x => x.date === e.date); return `<tr><td class="num">${F.fmtDate(e.date, { year: false })}<span class="sub">${F.weekday(e.date)} · in ${e.x}d</span></td><td class="num pos">${e.income ? '+' + F.money(e.income) : ''}</td><td>${e.pay ? `<span class="num neg">−${F.money(e.pay)}</span> → ${e.targets.map(t => e.kills.includes(t) ? `<span class="gold">☠ ${F.esc(t)}</span>` : F.esc(t)).join(', ')}` : '<span class="muted">—</span>'}</td><td class="num neg">${s ? F.money(s.debt) : ''}</td><td class="num ${s && s.cash < 0 ? 'neg' : ''}">${s ? F.money(s.cash) : ''}</td></tr>`; }).join('')}</tbody></table></div>
        <div class="note" style="margin-top:10px">Each drop is a planned payment (☠ = card killed); each rise is a paycheck. Interest accrues daily at APR${UI.ast()}; living at $${PLAN.living.perDay}/day; bills on their due days. Blue dots are live snapshots.</div></div>
      <div class="panel"><div class="ph"><h3>Debt → wealth</h3><span class="legend"><span><i style="background:${CH.colors.net}"></i>Net (plan)</span><span><i style="background:${CH.colors.debt}"></i>Debt (plan)</span><span><i style="background:${CH.colors.savings}"></i>Savings (plan)</span><span><i class="dot" style="background:${CH.colors.live}"></i>Live debt (snapshots)</span></span></div>
        <div style="height:420px;position:relative"><canvas id="c-proj"></canvas></div></div>
      <div class="grid g32" style="margin-top:18px">
        <div class="panel flush"><div class="ph"><h3>Month-end plan</h3><span class="small muted">USD · net = savings + debt</span></div><div class="table-wrap"><table><thead><tr><th>Month</th><th class="num">Debt</th><th class="num">Savings</th><th class="num">Net</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>
        <div class="panel flush"><div class="ph"><h3>Live snapshots</h3><span class="small muted">recorded on each refresh, stored in this browser</span></div><table><thead><tr><th>Date</th><th class="num">Debt</th><th class="num">Cash + savings</th><th class="num">Net</th></tr></thead><tbody>${snaps || '<tr><td colspan="4" class="muted center">First snapshot records on the next live refresh</td></tr>'}</tbody></table>
          <div class="note" style="padding:12px 20px">Snapshots are the “actual debt as it evolves” series${UI.ast()}. They live in localStorage — one point per day, whichever refresh was last.</div></div>
      </div>`;
  },
  mount(S) {
    const pr = S.d.proj; const pts = pr.pts; const N = S.d.near;
    const narrow = window.innerWidth < 640;
    const evMarkers = N.events.filter(e => e.pay > 0).map((e, i) => ({ x: e.x, label: narrow ? '' : `${F.compact(-e.pay)} ${e.targets.slice(0, 2).join(', ')}${e.targets.length > 2 ? ' +' : ''}${e.kills.length ? ' ☠' : ''}`, color: CH.colors.debt, dy: (i % 3) * 13, align: e.x > N.days * 0.7 ? 'right' : 'left' }));
    const incMarkers = N.events.filter(e => e.income > 0 && !e.pay).map((e, i) => ({ x: e.x, label: narrow ? '' : `+${F.compact(e.income)}`, color: CH.colors.savings, dy: 40 + (i % 2) * 13, dash: [1, 4] }));
    CH.make(document.getElementById('c-near'), {
      type: 'line',
      data: { datasets: [
        { label: 'Total debt (plan path)', data: N.series.map(s => ({ x: s.x, y: s.debt })), borderColor: CH.colors.debt, backgroundColor: 'rgba(230,103,103,.10)', fill: 'origin', stepped: true, borderWidth: 2.5 },
        { label: 'Checking (plan path)', data: N.series.map(s => ({ x: s.x, y: s.cash })), borderColor: CH.colors.savings, stepped: true, borderWidth: 2 },
        { label: 'Live debt', data: N.live.map(p => ({ x: p.x, y: p.debt })), type: 'scatter', showLine: false, backgroundColor: CH.colors.live, borderColor: '#0c1117', borderWidth: 1.5, pointRadius: 4, pointHoverRadius: 6 }
      ] },
      options: { maintainAspectRatio: false, interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: { x: { type: 'linear', min: 0, max: N.days, grid: { display: false }, border: { display: false }, ticks: { stepSize: 7, autoSkip: false, maxRotation: 0, callback: v => Number.isInteger(v / 7) ? F.fmtDate(F.addDays(N.start.date, v), { year: false }) : '' } }, y: CH.yMoney() },
        plugins: { tooltip: { callbacks: { title: i => { const s = N.series[Math.round(i[0].parsed.x)]; const e = N.events.find(x => x.date === (s && s.date)); return `${F.fmtDate(F.addDays(N.start.date, Math.round(i[0].parsed.x)))}${e && e.pay ? ` · pay ${F.money(e.pay)} → ${e.targets.join(', ')}` : ''}${e && e.income ? ` · +${F.money(e.income)} income` : ''}`; }, label: i => ` ${i.dataset.label}: ${F.money(i.parsed.y)}` } },
          guides: { zero: true, markers: [...evMarkers, ...incMarkers] } } }
    });
    CH.make(document.getElementById('c-proj'), {
      type: 'line',
      data: { datasets: [
        { label: 'Net (plan)', data: pts.map(p => ({ x: p.x, y: p.net })), borderColor: CH.colors.net, borderWidth: 2.5, fill: { target: 'origin', above: 'rgba(25,158,112,.08)', below: 'rgba(230,103,103,.08)' } },
        { label: 'Debt (plan)', data: pts.map(p => ({ x: p.x, y: p.debt })), borderColor: CH.colors.debt, borderWidth: 2 },
        { label: 'Savings (plan)', data: pts.map(p => ({ x: p.x, y: p.savings })), borderColor: CH.colors.savings, borderWidth: 2 },
        { label: 'Live debt', data: pr.live.map(p => ({ x: p.x, y: p.debt })), type: 'scatter', showLine: pr.live.length > 1, borderColor: CH.colors.live, backgroundColor: CH.colors.live, pointRadius: 4, pointHoverRadius: 6, borderWidth: 1.5 }
      ] },
      options: { maintainAspectRatio: false, interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: { x: { type: 'linear', min: 0, max: pts[pts.length - 1].x, grid: { display: false }, border: { display: false }, ticks: { stepSize: 30, autoSkip: true, maxTicksLimit: narrow ? 5 : 14, maxRotation: 0, callback: v => { const p = pts.find(q => Math.abs(q.x - v) < 8); return p ? p.label : ''; } } }, y: CH.yMoney() },
        plugins: { tooltip: { callbacks: { title: i => F.fmtDate(F.addDays(PLAN.planStart, Math.round(i[0].parsed.x))), label: i => ` ${i.dataset.label}: ${F.money(i.parsed.y)}` } }, guides: { markers: [{ x: pr.xToday, label: 'today', color: 'rgba(232,230,223,.5)' }, pr.crossing ? { x: pr.crossing.x, label: `crosses zero · ${pr.crossing.label}`, color: CH.colors.net, dy: 14 } : null].filter(Boolean) } } }
    });
  }
};
