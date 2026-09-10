// Donuts — one doughnut per month: where the month's cash goes (bills, living, card & loan payoffs, savings).
VIEWS.donuts = {
  SLICES: [
    { key: 'rent', label: 'Rent', color: '#c98500' },
    { key: 'loans', label: 'Loan payments / payoff', color: '#3987e5' },
    { key: 'cards', label: 'Card payoff payments', color: '#e66767' },
    { key: 'living', label: 'Living allowance', color: '#199e70' },
    { key: 'car', label: 'Car payment', color: '#c47a12' },
    { key: 'student', label: 'Student loan', color: '#7b6fe0' },
    { key: 'savings', label: 'Savings & investing', color: '#d55181' }
  ],
  months(from, to) { const out = []; let [y, m] = from.split('-').map(Number); while (`${y}-${String(m).padStart(2, '0')}` <= to) { out.push(`${y}-${String(m).padStart(2, '0')}`); m++; if (m > 12) { m = 1; y++; } } return out; },
  month(S, ym) {
    const clampDayYm = (m, day) => `${m}-${String(Math.min(day, F.daysInMonth(m + '-01'))).padStart(2, '0')}`;
    const { ctx, d, prefs } = S; const P = PLAN; const cur = ym === ctx.today.slice(0, 7);
    const dim = F.daysInMonth(ym + '-01');
    const bill = label => P.bills.find(b => b.label === label);
    const active = b => b && !(b.endsAfter && ym + '-01' > b.endsAfter);
    const paid = label => cur && d.ledger.bills.find(x => x.label === label && x.tx);
    const s = { rent: 0, loans: 0, cards: 0, living: 0, car: 0, student: 0, savings: 0 };
    const notes = {};
    const rent = bill('Rent'); if (active(rent)) { s.rent = rent.amount; if (paid('Rent')) notes.rent = 'paid'; }
    const car = bill('Car payment (WF)'); if (active(car)) { s.car = car.amount; if (paid('Car payment (WF)')) notes.car = 'paid'; }
    const sofi = bill('SoFi loan payment'); if (active(sofi)) { s.loans += sofi.amount; }
    const stu = bill('Student loan'); if (active(stu)) { s.student = stu.amount; if (paid('Student loan')) notes.student = 'paid'; }
    s.living = P.living.monthly; if (cur) notes.living = `${F.money(d.living.actual)} spent so far`;
    let cardsDone = 0, loansDone = 0;
    for (const it of d.sched.items) {
      if (it.date.slice(0, 7) !== ym) continue;
      const isLoan = it.acct && it.acct.role === 'loan';
      if (isLoan) { s.loans += it.amount; if (it.status === 'done') loansDone += it.matched; }
      else { s.cards += it.amount; if (it.status === 'done') cardsDone += it.matched; }
    }
    if (cur && cardsDone) notes.cards = `${F.money(cardsDone)} done`;
    if (cur && loansDone) notes.loans = `${F.money(loansDone)} done`;
    if (ym >= P.post.startMonth) {
      const pr = prefs.alloc || {}; const base = pr.base ?? P.post.monthlyCapacity; const over = pr.over || {};
      s.savings = over[ym] ?? base; notes.savings = 'per Allocate page';
    }
    const income = P.income.filter(i => !i.from || clampDayYm(ym, i.day) >= i.from).reduce((a, i) => a + i.amount, 0) + P.oneTimeIncome.filter(o => o.date.slice(0, 7) === ym).reduce((a, o) => a + o.amount, 0);
    const total = Object.values(s).reduce((a, b) => a + b, 0);
    return { ym, s, notes, income, total, net: income - total, cur, dim };
  },
  render(S) {
    const start = S.ctx.today.slice(0, 7);
    const months = this.months(start, '2027-12');
    const rows = months.map(ym => this.month(S, ym));
    const card = r => `<div class="panel ${r.cur ? 'hl-panel' : ''}" data-ym="${r.ym}" ${r.cur ? 'style="border-color:rgba(201,133,0,.45)"' : ''}>
        <div class="ph"><h3>${F.fmtMonth(r.ym)}${r.cur ? ' <span class="chip kill">this month</span>' : ''}</h3><span class="num" style="font-size:16px">${F.money(r.total)}</span></div>
        <div style="height:200px;position:relative"><canvas id="dn-${r.ym}"></canvas></div>
        <div style="margin-top:12px">${this.SLICES.filter(x => r.s[x.key] > 0.5).map(x => `<div style="display:grid;grid-template-columns:12px 1fr auto auto;gap:8px;align-items:center;padding:4px 0;font-size:12.5px"><i style="width:10px;height:10px;border-radius:50%;background:${x.color};display:inline-block"></i><span>${x.label}${r.notes[x.key] ? ` <span class="xs ${r.notes[x.key] === 'paid' ? 'pos' : 'muted'}">${r.notes[x.key] === 'paid' ? '✓ paid' : r.notes[x.key]}</span>` : ''}</span><span class="num">${F.money(r.s[x.key])}</span><span class="num muted xs" style="min-width:38px;text-align:right">${(r.s[x.key] / (r.total || 1) * 100).toFixed(0)}%</span></div>`).join('')}</div>
        <div class="hr"></div>
        <div class="kv"><span class="k">Income${UI.ast()}</span><span class="v">${F.money(r.income)}</span><span class="k">Out</span><span class="v">${F.money(r.total)}</span><span class="k">${r.net >= 0 ? 'Left over' : 'Short'}</span><span class="v ${r.net >= 0 ? 'pos' : 'neg'}">${F.money(Math.abs(r.net))}</span></div>
      </div>`;
    const totals = this.SLICES.map(x => ({ ...x, v: rows.reduce((a, r) => a + r.s[x.key], 0) }));
    const grand = totals.reduce((a, x) => a + x.v, 0);
    return `<div class="page-head"><div><h1>Donuts</h1><p>Every month from now through ${F.fmtMonth('2027-12')}: where the month’s cash goes. Rent, car, SoFi and student loan on their due days; the flat ${F.money(PLAN.living.monthly)} living allowance; planned card and loan payoffs from the schedule; and from ${F.fmtMonth(PLAN.post.startMonth)} the savings put-away from the Allocate page. The current month shows what has already been paid.</p></div>
      <div class="right"><div class="eyebrow">${months.length} months · total out</div><div class="big">${F.money(grand)}</div><div class="small muted">vs ${F.money(rows.reduce((a, r) => a + r.income, 0))} income${UI.ast()}</div></div></div>
      <div class="controls"><div class="legend">${this.SLICES.map(x => `<span><i class="dot" style="background:${x.color}"></i>${x.label}</span>`).join('')}</div></div>
      <div class="grid g3" id="dn-grid">${rows.map(card).join('')}</div>
      <div class="panel flush" style="margin-top:18px"><div class="ph"><h3>Totals · ${F.fmtMonth(months[0])} – ${F.fmtMonth(months[months.length - 1])}</h3></div>
        <div class="table-wrap"><table><thead><tr><th>Destination</th><th class="num">Total</th><th class="num">Share</th><th class="num">Avg / month</th></tr></thead><tbody>${totals.filter(x => x.v > 0).map(x => `<tr><td><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${x.color};margin-right:8px"></i>${x.label}</td><td class="num">${F.money(x.v)}</td><td class="num muted">${(x.v / grand * 100).toFixed(0)}%</td><td class="num">${F.money(x.v / months.length)}</td></tr>`).join('')}</tbody></table></div>
        <div class="note" style="padding:12px 20px">Bills and income are the plan’s recurring amounts${UI.ast()} (car and SoFi payments end Dec 2026; the one-time $10,000 reimbursement lands Sep 27). Card and loan slices are the planned payoff schedule; interest buffer counts with cards. Left over = income − out; a negative month draws on checking.</div></div>`;
  },
  mount(S, root) {
    const V = this;
    root.querySelectorAll('[data-ym]').forEach(card => {
      const r = V.month(S, card.dataset.ym);
      const sl = V.SLICES.filter(x => r.s[x.key] > 0.5);
      CH.make(card.querySelector('canvas'), { type: 'doughnut', data: { labels: sl.map(x => x.label), datasets: [{ data: sl.map(x => r.s[x.key]), backgroundColor: sl.map(x => x.color), borderColor: '#10161d', borderWidth: 2, hoverOffset: 6 }] }, options: { maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: false }, guides: { zero: false }, tooltip: { callbacks: { label: i => { const tot = i.dataset.data.reduce((a, b) => a + b, 0) || 1; return ` ${i.label}: ${F.money(i.parsed)} (${(i.parsed / tot * 100).toFixed(0)}%)`; } } } } } });
    });
  }
};
