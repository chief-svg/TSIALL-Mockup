// Command view — the hero (crossing zero), next payment, living gauge, death board.
VIEWS.command = {
  render(S) {
    const { ctx, d } = S; const t = ctx.totals;
    const next = d.sched.next;
    const debtFree = d.sims.debtFree || PLAN.debtFreeDate;
    const days = F.daysBetween(ctx.today, debtFree);
    const crossing = d.proj.crossing;
    const paidSoFar = PLAN.startingDebt - t.debt; // negative start → positive progress
    const progress = F.clamp(paidSoFar / -PLAN.startingDebt, 0, 1);
    const fund = next ? d.funds.find(f => f.date === next.date) : null;
    const liv = d.living;

    const hero = `
    <section class="hero">
      <div class="hero-grid">
        <div class="headline">
          <div>
            <div class="eyebrow">The crossing</div>
            <div class="lead" style="margin-top:8px">Net position <b class="num ${t.net < 0 ? 'neg' : 'pos'}">${F.money(t.net)}</b> today. The plan crosses zero in <b>${crossing ? F.fmtMonth(crossing.date) : '—'}</b> and reaches <b>${F.money(PLAN.projection[PLAN.projection.length - 1].savings)}</b> by ${F.fmtMonth(PLAN.projection[PLAN.projection.length - 1].date)}${UI.ast()}.</div>
          </div>
          <div>
            <div class="countdown">
              <div><div class="n gold">${days}</div><div class="l">days to debt-free · ${F.fmtDate(debtFree)}${d.sims.debtFree ? '' : ' (plan)'}</div></div>
              <div><div class="n">${(progress * 100).toFixed(0)}<span class="muted" style="font-size:22px">%</span></div><div class="l">of ${F.money(-PLAN.startingDebt)} retired</div></div>
            </div>
            <div style="margin-top:14px">${UI.bar(progress, '')}</div>
            <div class="note" style="margin-top:8px">${F.money(paidSoFar)} paid down since ${F.fmtDate(PLAN.planStart, { year: false })} · ${F.money(-t.debt)} to go · drift vs plan ${UI.signed(d.proj.drift)}</div>
          </div>
        </div>
        <div>
          <div class="chart"><canvas id="c-hero"></canvas></div>
          <div class="legend" style="margin-top:8px"><span><i style="background:${CH.colors.net}"></i>Net (plan)</span><span><i style="background:${CH.colors.debt}"></i>Debt (plan)</span><span><i style="background:${CH.colors.savings}"></i>Savings (plan)</span><span><i class="dot" style="background:${CH.colors.live}"></i>Live debt</span></div>
        </div>
      </div>
    </section>`;

    const nextPanel = next ? `
    <div class="panel">
      <div class="ph"><h3>Next payment</h3>${UI.chip(next.status, next.status)}</div>
      <div class="next">
        <div>
          <div class="amt gold">${F.money(next.items.filter(i => i.status !== 'done').reduce((s, i) => s + i.amount, 0))}</div>
          <div class="small muted" style="margin-top:6px">${F.weekday(next.date)} ${F.fmtDate(next.date)} · ${next.daysUntil === 0 ? 'today' : next.daysUntil > 0 ? `in ${next.daysUntil} days` : `${-next.daysUntil} days ago`}${next.kills.length ? ` · kills ${next.kills.join(', ')}` : ''}</div>
        </div>
        <div class="right">
          ${fund ? `<div class="eyebrow">Funds check${UI.ast()}</div><div class="num ${fund.ok ? 'pos' : 'neg'}" style="font-size:18px">${fund.ok ? 'covered' : 'short ' + F.money(-fund.gap)}</div><div class="xs muted">${F.money(fund.available)} available by then</div>` : ''}
        </div>
      </div>
      <div class="split">
        ${next.items.map(i => `<div class="row"><div class="to">${i.acct ? F.esc(i.acct.short) : 'Buffer'}<span class="sub">${F.esc(i.note || '')}${i.acct ? ` · live balance ${F.money(i.acct.balance)}` : ''}</span></div><div class="num">${F.money(i.amount)}</div>${UI.chip(i.status, i.kill ? (i.status === 'done' ? 'dead' : 'kill') : i.status)}</div>`).join('')}
      </div>
      <div class="note" style="margin-top:10px">Pay from BofA checking. Plan amounts include estimated interest${UI.ast()}; pay the card’s live statement balance when it differs.</div>
    </div>` : `<div class="panel"><div class="ph"><h3>Next payment</h3></div><div class="callout green">Every planned payment is matched. 🏁</div></div>`;

    const livingPanel = `
    <div class="panel">
      <div class="ph"><h3>Living allowance</h3><span class="small muted">${F.fmtMonth(liv.from)} · day ${liv.elapsed}/${liv.dim}</span></div>
      <div class="gauge">
        <div class="ring">${ring(liv.ratio, liv.status)}<div class="c"><div><div class="p">${(liv.ratio * 100).toFixed(0)}%</div><div class="xs muted">of pace</div></div></div></div>
        <div class="kv">
          <span class="k"><b>Left to spend today</b></span><span class="v ${liv.todayLeft > 0 ? 'pos' : 'neg'}" style="font-size:16px">${F.money(liv.todayLeft)}</span>
          <span class="k">Tomorrow, if nothing more today</span><span class="v">${F.money(liv.tomorrowLeft)}</span>
          <span class="k">Spent so far</span><span class="v">${F.money(liv.actual)}</span>
          <span class="k">Budget to date</span><span class="v">${F.money(liv.budgetToDate)}</span>
          <span class="k">Variance</span><span class="v ${liv.budgetToDate - liv.actual >= 0 ? 'pos' : 'neg'}">${F.signed(liv.budgetToDate - liv.actual)}</span>
          <span class="k">Left this month</span><span class="v">${F.money(liv.remaining)}</span>
          <span class="k">Per day, today + ${liv.daysLeft} days</span><span class="v ${liv.perDayInclToday < liv.per * 0.8 ? 'amber' : ''}">${F.money(Math.max(0, liv.perDayInclToday))}</span>
        </div>
      </div>
      <div class="note" style="margin-top:12px">${F.money(PLAN.living.monthly)}/month (${F.money(liv.per)}/day this month) · everything that isn’t a bill, debt payment, or transfer. ${liv.pendingCount ? `${liv.pendingCount} pending` : ''}</div>
    </div>`;

    const L = d.ledger;
    const monthPanel = `
    <div class="panel">
      <div class="ph"><h3>This month’s cash</h3><span class="small muted">${F.fmtMonth(L.ym)}</span></div>
      <div class="kv">
        <span class="k">Income received / expected</span><span class="v">${F.money(L.incomeReceived)} <span class="muted">/ ${F.money(L.incomeExpected)}</span></span>
        <span class="k">Bills paid / expected</span><span class="v">${F.money(L.billsPaid)} <span class="muted">/ ${F.money(L.billsExpected)}</span></span>
        <span class="k">Debt payments sent</span><span class="v">${F.money(L.debtOutTotal)}</span>
        <span class="k">Living spent</span><span class="v">${F.money(liv.actual)}</span>
        <span class="k">Checking now</span><span class="v">${F.money(t.cash)}</span>
      </div>
      <div class="hr"></div>
      <div class="tl">
        ${L.bills.concat(L.incomes.map(i => ({ ...i, isIncome: true }))).sort((a, b) => a.expected < b.expected ? -1 : 1).map(x => `<div class="ev ${x.status === 'paid' || x.status === 'received' ? 'done' : x.status === 'overdue' || x.status === 'late' ? 'missed' : x.status === 'due' ? 'next' : ''}"><div class="d">${F.fmtDate(x.expected, { year: false })}</div><div class="t">${F.esc(x.label)} <span class="num ${x.isIncome ? 'pos' : ''}">${x.isIncome ? '+' : '−'}${F.money(x.actual != null ? Math.abs(x.actual) : x.amount)}</span> ${UI.chip(x.status)}</div></div>`).join('')}
      </div>
    </div>`;

    const board = `
    <div class="panel">
      <div class="ph"><h3>Death board</h3><span class="small muted">live balance vs. plan start · projected kill date${UI.ast()}</span></div>
      ${d.sims.sims.filter(s => s.acct.role !== 'display' || s.acct.balance < 0).map(s => {
        const a = s.acct; const start = Math.max(-(PLAN.startingBalances && PLAN.startingBalances[a.id] || 0), -a.balance, 1);
        const dead = a.balance >= -0.005;
        return `<div class="cardrow ${dead ? 'dead' : ''}">
          <div class="name">${F.esc(a.short)}<span class="sub">${a.apr ? (a.apr * 100).toFixed(2) + '% APR' : ''}${a.role === 'loan' ? ' · payoff quote needed' : ''}</span></div>
          <div>${UI.bar(dead ? 0 : Math.min(1, -a.balance / start), dead ? 'green' : a.role === 'loan' ? 'blue' : '')}<div class="xs muted" style="margin-top:4px">${dead ? 'cleared' : `${((1 - Math.min(1, -a.balance / start)) * 100).toFixed(0)}% of ${F.money(start)} retired`}</div></div>
          <div class="num right ${dead ? 'pos' : 'neg'}">${dead ? 'paid' : F.money(a.balance)}</div>
          <div class="right small">${dead ? UI.chip('done', 'dead') : s.deathDate ? `<span class="gold num">☠ ${F.fmtDate(s.deathDate, { year: false })}</span>${s.tail ? `<span class="sub xs muted">${F.money(s.residual)} tail → buffer</span>` : ''}` : `<span class="neg">short ${F.money(s.shortfall)}</span>`}</div>
        </div>`;
      }).join('')}
      <div class="note" style="margin-top:10px">Interest tails (${F.money(d.sims.tails)}) are swept by the ${F.fmtDate(d.sims.bufferDate, { year: false })} buffer; ${F.money(d.sims.bufferLeft)} of it remains unallocated${UI.ast()}.</div>
    </div>`;

    const timeline = `
    <div class="panel">
      <div class="ph"><h3>Schedule</h3><a class="small gold" href="#/payoff">Full detail →</a></div>
      <div class="tl">
        ${d.sched.groups.map(g => `<div class="ev ${g.status === 'done' ? 'done' : g === next ? 'next' : g.status === 'missed' ? 'missed' : ''}"><div class="d">${F.fmtDate(g.date, { year: false })} · ${F.weekday(g.date)}</div><div class="t"><span class="num">${F.money(g.total)}</span> → ${g.items.map(i => i.acct ? F.esc(i.acct.short) : 'buffer').filter((v, i, a) => a.indexOf(v) === i).join(', ')} ${g.kills.length ? `<span class="gold">☠ ${g.kills.join(', ')}</span>` : ''}</div></div>`).join('')}
      </div>
    </div>`;

    return `<div class="page-head"><div><h1>Command</h1><p>Where the money is, what gets paid next, and how the plan is tracking against reality.</p></div></div>
      ${hero}
      <div class="grid g3 start" style="margin-top:18px">${nextPanel}${livingPanel}${monthPanel}</div>
      <div class="grid g32" style="margin-top:18px">${board}${timeline}</div>`;

    function ring(ratio, status) {
      const r = 52, c = 2 * Math.PI * r, p = F.clamp(ratio, 0, 1.25) / 1.25;
      const col = status === 'green' ? CH.colors.savings : status === 'amber' ? CH.colors.amber : CH.colors.debt;
      return `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${r}" fill="none" stroke="rgba(232,230,223,.08)" stroke-width="8"/><circle cx="60" cy="60" r="${r}" fill="none" stroke="rgba(232,230,223,.35)" stroke-width="8" stroke-dasharray="${c * (1 / 1.25)} ${c}" stroke-linecap="butt"/><circle cx="60" cy="60" r="${r}" fill="none" stroke="${col}" stroke-width="8" stroke-dasharray="${c * p} ${c}" stroke-linecap="round"/></svg>`;
    }
  },
  mount(S) {
    const { d } = S; const pr = d.proj;
    const pts = pr.pts;
    CH.make(document.getElementById('c-hero'), {
      type: 'line',
      data: { datasets: [
        { label: 'Net (plan)', data: pts.map(p => ({ x: p.x, y: p.net })), borderColor: CH.colors.net, backgroundColor: 'rgba(201,133,0,.10)', fill: { target: 'origin', above: 'rgba(25,158,112,.10)', below: 'rgba(230,103,103,.10)' }, borderWidth: 2.5 },
        { label: 'Debt (plan)', data: pts.map(p => ({ x: p.x, y: p.debt })), borderColor: CH.colors.debt, borderDash: [4, 4], borderWidth: 1.5 },
        { label: 'Savings (plan)', data: pts.map(p => ({ x: p.x, y: p.savings })), borderColor: CH.colors.savings, borderWidth: 1.5 },
        { label: 'Live debt', data: pr.live.map(p => ({ x: p.x, y: p.debt })), type: 'scatter', showLine: false, pointRadius: 4, pointHoverRadius: 6, backgroundColor: CH.colors.live, borderColor: '#0c1117', borderWidth: 1.5 }
      ] },
      options: {
        maintainAspectRatio: false, interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: { x: { type: 'linear', min: 0, max: pts[pts.length - 1].x, grid: { display: false }, border: { display: false }, ticks: { callback: v => { const p = pts.find(q => Math.abs(q.x - v) < 8); return p ? p.label.replace('Now', '') : ''; }, autoSkip: true, maxTicksLimit: window.innerWidth < 640 ? 5 : 14, maxRotation: 0, stepSize: 30 } }, y: CH.yMoney() },
        plugins: { tooltip: { callbacks: { title: items => { const x = items[0].parsed.x; return F.fmtDate(F.addDays(PLAN.planStart, Math.round(x))); }, label: i => ` ${i.dataset.label}: ${F.money(i.parsed.y)}` } },
          guides: { markers: [{ x: pr.xToday, label: 'today', color: 'rgba(232,230,223,.5)' }, pr.crossing ? { x: pr.crossing.x, label: 'crosses zero', color: CH.colors.net, dy: 14 } : null].filter(Boolean) } }
      }
    });
  }
};
