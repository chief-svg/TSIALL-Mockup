// Path to $1M — levers, crossing date, milestones, sensitivity.
VIEWS.million = {
  opts(S) {
    const M = PLAN.million, p = S.prefs.million || {};
    return { monthlyCash: p.monthlyCash ?? M.monthlyCash, annualReturn: p.annualReturn ?? M.annualReturn, cashYield: p.cashYield ?? M.cashYield, include401k: p.include401k ?? M.include401k, employerMatchAnnual: p.employerMatchAnnual ?? M.employerMatchAnnual, startingInvested: S.ctx.totals.savings };
  },
  render(S) {
    const o = this.opts(S); const R = ENGINE.millionPath(o); const sens = ENGINE.millionSensitivity({ include401k: o.include401k, cashYield: o.cashYield, employerMatchAnnual: o.employerMatchAnnual, startingInvested: o.startingInvested });
    const ms = [100000, 250000, 500000, 750000, 1000000];
    const last = R.rows[R.rows.length - 1];
    const cross = R.rows.find(r => r.ym === R.crossed);
    const contribTotal = R.rows.filter(r => r.ym <= (R.crossed || last.ym)).reduce((s, r) => s + r.contrib, 0);
    const growth = cross ? cross.total - contribTotal - 13000 : 0;
    const milestoneRows = ms.map(m => `<tr><td class="num">${F.money(m)}</td><td class="num gold">${R.milestones[m] ? F.fmtMonth(R.milestones[m]) : '—'}</td><td class="num muted">${R.milestones[m] ? ENGINE.monthsBetween(S.ctx.today.slice(0, 7), R.milestones[m]) + ' mo' : ''}</td></tr>`).join('');
    const sensRows = sens.map(r => `<tr><td class="num">${(r.r * 100).toFixed(0)}% return</td>${r.cells.map(c => `<td class="num ${c.c === o.monthlyCash && r.r === o.annualReturn ? 'gold' : ''}">${c.crossed ? F.fmtMonth(c.crossed) : '—'}</td>`).join('')}</tr>`).join('');
    return `<div class="page-head"><div><h1>Path to $1M</h1><p>From debt-free day, every dollar of the ${F.money(PLAN.post.monthlyCapacity)}/mo capacity is deployed. The target is <b>${F.money(PLAN.million.target)}</b> across all accounts — HYSA, IRAs, HSA, 401(k)s, brokerage. Drag the levers; the date is the answer${UI.ast()}.</p></div>
      <div class="right"><div class="eyebrow">$1M crossed</div><div class="huge gold">${R.crossed ? F.fmtMonth(R.crossed) : '—'}</div><div class="small muted">${R.monthsFromNow != null ? `${R.monthsFromNow} months from now · ${(R.monthsFromNow / 12).toFixed(1)} years` : 'not within horizon'}</div></div></div>

      <div class="controls">
        <div class="ctl"><label>Monthly cash</label><input type="range" id="m-cash" min="15000" max="45000" step="500" value="${o.monthlyCash}"><span class="val num">${F.money(o.monthlyCash)}</span></div>
        <div class="ctl"><label>Return</label><input type="range" id="m-ret" min="0" max="0.12" step="0.005" value="${o.annualReturn}"><span class="val num">${(o.annualReturn * 100).toFixed(1)}%</span></div>
        <div class="ctl"><label>HYSA yield</label><input type="range" id="m-cy" min="0" max="0.06" step="0.0025" value="${o.cashYield}"><span class="val num">${(o.cashYield * 100).toFixed(2)}%</span></div>
        <div class="ctl"><label>401(k)s</label><button class="switch ${o.include401k ? 'on' : ''}" id="m-401k" aria-label="include 401k"></button><span class="muted small">both, payroll-side</span></div>
        <div class="ctl"><label>Employer match / yr</label><input type="number" id="m-match" min="0" step="500" value="${o.employerMatchAnnual}"></div>
        <button class="btn sm" id="m-reset">Reset</button>
      </div>

      <div class="grid g32">
        <div class="panel"><div class="ph"><h3>Total across all accounts</h3><span class="legend"><span><i style="background:${CH.colors.net}"></i>Total</span><span><i style="background:${CH.colors.live}"></i>Cash (EF)</span><span><i style="background:${CH.colors.savings}"></i>Taxable + IRA/HSA</span><span><i style="background:#9085e9"></i>401(k)</span></span></div>
          <div style="height:380px;position:relative"><canvas id="c-million"></canvas></div></div>
        <div>
          <div class="panel flush"><div class="ph"><h3>Milestones</h3></div><div class="table-wrap narrow-ok"><table><thead><tr><th class="num">Level</th><th class="num">Month</th><th class="num">From now</th></tr></thead><tbody>${milestoneRows}</tbody></table></div></div>
          <div class="panel" style="margin-top:14px"><div class="ph"><h3>Composition at the crossing</h3></div>
            ${cross ? `<div class="kv"><span class="k">Contributed (cash + 401k)</span><span class="v">${F.money(contribTotal)}</span><span class="k">Dec ’26 buffer</span><span class="v">${F.money(13000)}</span><span class="k">Growth</span><span class="v pos">${F.money(growth)}</span><span class="k">Cash (EF)</span><span class="v">${F.money(cross.cash)}</span><span class="k">Taxable + IRA/HSA</span><span class="v">${F.money(cross.invested)}</span><span class="k">401(k)</span><span class="v">${F.money(cross.retirement)}</span></div>` : '<div class="muted">Raise a lever to bring the crossing inside the 20-year horizon.</div>'}</div>
        </div>
      </div>

      <div class="grid g32" style="margin-top:18px">
        <div class="panel flush"><div class="ph"><h3>Sensitivity · month $1M is crossed</h3><span class="small muted">rows: return · columns: monthly cash</span></div>
          <div class="table-wrap"><table><thead><tr><th></th>${sens[0].cells.map(c => `<th class="num">${F.money(c.c)}/mo</th>`).join('')}</tr></thead><tbody>${sensRows}</tbody></table></div>
          <div class="note" style="padding:12px 20px">Monthly cash matters more than return in the first three years — each extra $1,000/mo pulls the date forward roughly a month. Return compounds later.</div></div>
        <div class="panel"><div class="ph"><h3>What accelerates it</h3></div>
          <div class="note" style="line-height:1.8">
            <b>1.</b> Hold the $${PLAN.living.perDay}/day line after debt-free — lifestyle creep is the only real threat to ${F.money(PLAN.post.monthlyCapacity)}/mo.<br>
            <b>2.</b> Capture every pre-tax dollar: both 401(k)s to the limit, HSA if HDHP, backdoor Roths — tax drag on a brokerage-only path costs years.<br>
            <b>3.</b> Employer match is free money — enter it above once known${UI.ast()}.<br>
            <b>4.</b> Bonuses, RSUs, tax refunds → straight to brokerage the day they land (one-time income lines in plan.js).<br>
            <b>5.</b> Keep the EF at exactly ${F.money(PLAN.post.emergencyFund.target)} in a HYSA; everything above it is invested. Cash beyond six months is a drag.<br>
            <b>6.</b> Rebalance annually, never by feel. Costs and taxes are the only controllable returns.
          </div>
          <div class="hr"></div>
          <div class="note">Assumptions${UI.ast()}: nominal returns, no taxes on growth modelled, contributions constant, income and limits fixed at 2026/27 values. Not advice — a planning model.</div></div>
      </div>

      <div class="panel flush" style="margin-top:18px"><div class="ph"><h3>Year-end checkpoints</h3></div>
        <div class="table-wrap"><table><thead><tr><th>Year end</th><th class="num">Cash (EF)</th><th class="num">Taxable + IRA/HSA</th><th class="num">401(k)</th><th class="num">Total</th><th class="num">Contributed that year</th></tr></thead><tbody>
          ${R.rows.filter(r => r.ym.endsWith('-12') && (R.crossed ? r.ym <= R.crossed.slice(0, 4) + '-12' : true)).map(r => { const yr = r.ym.slice(0, 4); const c = R.rows.filter(x => x.ym.startsWith(yr)).reduce((s, x) => s + x.contrib, 0); return `<tr class="${R.crossed && R.crossed.slice(0, 4) === yr ? 'hl' : ''}"><td>${yr}</td><td class="num">${F.money(r.cash)}</td><td class="num">${F.money(r.invested)}</td><td class="num">${F.money(r.retirement)}</td><td class="num gold">${F.money(r.total)}</td><td class="num muted">${F.money(c)}</td></tr>`; }).join('')}
        </tbody></table></div></div>`;
  },
  mount(S) {
    const o = this.opts(S); const R = ENGINE.millionPath(o);
    const save = (k, v) => { S.setPref('million', { ...(S.prefs.million || {}), [k]: v }); APP.render(); };
    const bind = (id, k, parse = Number) => { const el = document.getElementById(id); el.addEventListener('change', () => save(k, parse(el.value))); el.addEventListener('input', () => { const v = el.nextElementSibling; if (v && v.classList.contains('val')) v.textContent = k === 'monthlyCash' ? F.money(Number(el.value)) : (Number(el.value) * 100).toFixed(k === 'cashYield' ? 2 : 1) + '%'; }); };
    bind('m-cash', 'monthlyCash'); bind('m-ret', 'annualReturn'); bind('m-cy', 'cashYield'); bind('m-match', 'employerMatchAnnual');
    document.getElementById('m-401k').addEventListener('click', () => save('include401k', !o.include401k));
    document.getElementById('m-reset').addEventListener('click', () => { S.setPref('million', {}); APP.render(); });
    const rows = R.rows;
    const labels = rows.map(r => r.ym);
    const idx = ym => labels.indexOf(ym);
    CH.make(document.getElementById('c-million'), {
      type: 'line',
      data: { labels, datasets: [
        { label: 'Total', data: rows.map(r => r.total), borderColor: CH.colors.net, borderWidth: 2.5, fill: false, order: 0 },
        { label: 'Cash (EF)', data: rows.map(r => r.cash), borderColor: CH.colors.live, backgroundColor: 'rgba(57,135,229,.35)', fill: true, stack: 's', borderWidth: 1, order: 3 },
        { label: 'Taxable + IRA/HSA', data: rows.map(r => r.invested), borderColor: CH.colors.savings, backgroundColor: 'rgba(25,158,112,.35)', fill: true, stack: 's', borderWidth: 1, order: 2 },
        { label: '401(k)', data: rows.map(r => r.retirement), borderColor: '#9085e9', backgroundColor: 'rgba(144,133,233,.35)', fill: true, stack: 's', borderWidth: 1, order: 1 }
      ] },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        scales: { x: CH.xClean({ ticks: { maxTicksLimit: 12, callback: (v, i) => labels[i] && labels[i].endsWith('-01') ? labels[i].slice(0, 4) : '' } }), y: { ...CH.yMoney(), stacked: true, min: Math.min(0, rows[0].total) } },
        plugins: { tooltip: { callbacks: { title: i => F.fmtMonth(labels[i[0].dataIndex]), label: i => ` ${i.dataset.label}: ${F.money(i.parsed.y)}` } },
          guides: { zero: true, markers: [R.crossed ? { x: idx(R.crossed), label: `$1M · ${F.fmtMonth(R.crossed)}`, color: CH.colors.net, align: idx(R.crossed) > labels.length * 0.5 ? 'right' : 'left' } : null, R.milestones[500000] ? { x: idx(R.milestones[500000]), label: `$500k · ${F.fmtMonth(R.milestones[500000])}`, color: 'rgba(232,230,223,.45)', align: 'right', dy: 16 } : null].filter(Boolean) } } }
    });
  }
};
