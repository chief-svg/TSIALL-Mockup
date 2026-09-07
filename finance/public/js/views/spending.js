// Spending view — live category tree with MTD actuals, living tracker, month ledger.
VIEWS.spending = {
  render(S) {
    const { ctx, d, prefs } = S; const liv = d.living; const tree = d.spend; const L = d.ledger;
    const showBills = prefs.spendBills !== false;
    const roots = tree.roots.filter(r => r.count > 0 && !r.isTransfer && (showBills || !(r.isBill && r.total < 0)));
    const spendTotal = roots.reduce((s, r) => s + Math.min(0, r.total), 0);
    const catRow = (c, child) => {
      const share = spendTotal ? Math.min(0, c.total) / spendTotal : 0;
      return `<div class="cat ${child ? 'child' : ''}"><span class="sw" style="background:${c.colour || '#6b7280'}"></span><div><span>${F.esc(c.title)}</span>${c.isBill ? ' <span class="chip">bill</span>' : ''}<span class="xs muted" style="margin-left:8px">${c.count} tx</span></div><div>${UI.bar(share, '')}</div><div class="num right ${c.total > 0 ? 'pos' : ''}">${F.money(c.total)}</div></div>`;
    };
    const treeHTML = roots.map(r => catRow(r, false) + r.children.filter(k => k.count > 0).map(k => catRow(k, true)).join('')).join('');

    const top = liv.topPayees.map(([p, v]) => `<tr><td>${F.esc(p)}</td><td class="num">${F.money(v)}</td></tr>`).join('');
    const billRows = L.bills.map(b => `<tr><td>${F.esc(b.label)}<span class="sub">due ${F.fmtDate(b.expected, { year: false })}${b.tx ? ` · ${F.esc((b.tx.payee || '').slice(0, 36))}` : ''}</span></td><td class="num">${F.money(b.amount)}</td><td class="num">${b.actual != null ? F.money(b.actual) : '—'}</td><td>${UI.chip(b.status)}</td></tr>`).join('');
    const incRows = L.incomes.map(i => `<tr><td>${F.esc(i.label)}<span class="sub">expected ${F.fmtDate(i.expected, { year: false })}${i.tx ? ` · ${F.esc((i.tx.payee || '').slice(0, 36))}` : ''}</span></td><td class="num">${F.money(i.amount)}</td><td class="num">${i.actual != null ? F.money(i.actual) : '—'}</td><td>${UI.chip(i.status)}</td></tr>`).join('')
      + L.otherIncome.map(t => `<tr><td>${F.esc((t.payee || '').slice(0, 40))}<span class="sub">unplanned · ${F.fmtDate(t.date, { year: false })}</span></td><td class="num muted">—</td><td class="num pos">${F.money(t.amount)}</td><td>${UI.chip('received')}</td></tr>`).join('');
    const debtRows = L.debtOut.slice(0, 12).map(t => `<tr><td>${F.esc((t.payee || '').slice(0, 44))}<span class="sub">${F.fmtDate(t.date, { year: false })}</span></td><td class="num">${F.money(-t.amount)}</td></tr>`).join('');

    const recent = liv.txs.slice(0, 40).map(t => `<tr><td class="num muted">${F.fmtDate(t.date, { year: false })}</td><td>${F.esc((t.payee || '').slice(0, 44))}${t.status === 'pending' ? ' <span class="chip">pending</span>' : ''}</td><td class="small muted">${F.esc(t.category ? t.category.title : 'Uncategorized')}</td><td class="small muted">${F.esc(ctx.byId[t.acctId] ? ctx.byId[t.acctId].short : '')}</td><td class="num ${t.amount > 0 ? 'pos' : ''}">${F.money(t.amount)}</td></tr>`).join('');

    return `<div class="page-head"><div><h1>Spending</h1><p>PocketSmith’s live category tree with month-to-date actuals, and the ${F.money(PLAN.living.monthly)}/month living allowance against reality. Bills, debt payments and transfers are separated out so “living” means living.</p></div>
        <div class="right"><div class="eyebrow">Left to spend today</div><div class="big ${liv.todayLeft > 0 ? 'pos' : 'neg'}">${F.money(liv.todayLeft)} <span class="muted" style="font-size:20px">· ${F.money(liv.tomorrowLeft)} tomorrow</span></div><div class="small muted">${F.money(liv.actual)} spent MTD vs ${F.money(liv.budgetToDate)} budget · ${(liv.ratio * 100).toFixed(0)}% of pace · ${F.money(Math.max(0, liv.perDayInclToday))}/day lands the month</div></div></div>

      <div class="grid g32">
        <div class="panel"><div class="ph"><h3>Allowance pace</h3><span class="legend"><span><i style="background:${CH.colors.net}"></i>Actual, cumulative</span><span><i style="background:rgba(232,230,223,.4)"></i>${F.money(liv.per)}/day pace</span></span></div>
          <div class="spark" style="height:200px"><canvas id="c-living"></canvas></div>
          <div class="grid g4" style="margin-top:14px;gap:10px">
            <div><div class="eyebrow">Status</div><div>${UI.chip(liv.status, liv.status === 'green' ? 'on pace' : liv.status === 'amber' ? 'over pace' : 'well over')}</div></div>
            <div><div class="eyebrow">Left this month</div><div class="num">${F.money(liv.remaining)}</div></div>
            <div><div class="eyebrow">Per day, today + ${liv.daysLeft} left</div><div class="num ${liv.perDayInclToday < liv.per * 0.8 ? 'amber' : ''}">${F.money(Math.max(0, liv.perDayInclToday))}</div></div>
            <div><div class="eyebrow">Month budget</div><div class="num">${F.money(liv.budgetMonth)}</div></div>
          </div></div>
        <div class="panel flush"><div class="ph"><h3>Where living went</h3><span class="small muted">top merchants MTD</span></div><table><tbody>${top || '<tr><td class="muted center">No living spend yet this month</td></tr>'}</tbody></table></div>
      </div>

      <div class="grid g32" style="margin-top:18px">
        <div class="panel"><div class="ph"><h3>Categories · month to date</h3><div class="ctl"><label>include bills</label><button class="switch ${showBills ? 'on' : ''}" id="tg-bills" aria-label="toggle bills"></button></div></div>
          ${treeHTML || '<div class="muted">No spending transactions this month yet.</div>'}
          <div class="hr"></div>
          <div class="kv"><span class="k">Total shown</span><span class="v">${F.money(spendTotal)}</span></div>
          <div class="note" style="margin-top:8px">Tree and colours come straight from PocketSmith. Refunds net against their category. Card interest and fees show under their PocketSmith category but never count as living.</div></div>
        <div>
          <div class="panel flush"><div class="ph"><h3>Bills · ${F.fmtMonth(L.ym)}</h3><span class="num small">${F.money(L.billsPaid)} / ${F.money(L.billsExpected)}</span></div><table><thead><tr><th>Bill</th><th class="num">Plan</th><th class="num">Actual</th><th>Status</th></tr></thead><tbody>${billRows}</tbody></table></div>
          <div class="panel flush" style="margin-top:14px"><div class="ph"><h3>Income · ${F.fmtMonth(L.ym)}</h3><span class="num small">${F.money(L.incomeReceived)} / ${F.money(L.incomeExpected)}</span></div><table><thead><tr><th>Source</th><th class="num">Plan${UI.ast()}</th><th class="num">Actual</th><th>Status</th></tr></thead><tbody>${incRows}</tbody></table></div>
          <div class="panel flush" style="margin-top:14px"><div class="ph"><h3>Debt payments out of checking</h3><span class="num small">${F.money(L.debtOutTotal)}</span></div><table><tbody>${debtRows || '<tr><td class="muted center">None yet this month</td></tr>'}</tbody></table></div>
        </div>
      </div>

      <div class="panel flush" style="margin-top:18px"><div class="ph"><h3>Living transactions</h3><span class="small muted">${liv.txCount} this month · newest first</span></div>
        <div class="table-wrap"><table><thead><tr><th>Date</th><th>Payee</th><th>Category</th><th>Account</th><th class="num">Amount</th></tr></thead><tbody>${recent || '<tr><td colspan="5" class="muted center">Nothing yet</td></tr>'}</tbody></table></div></div>

      <div class="panel" style="margin-top:18px"><div class="ph"><h3>How transactions are classified</h3></div>
        <div class="grid g3 note">
          <div><b>Excluded from spending</b><br>Transfers (PocketSmith flag or Transfer category) · card/loan payments (credits on a debt account tagged Payment / Card Paydown / Loan Payments, or a “payment / thank you” payee; the matching checking debit to an issuer) · income.</div>
          <div><b>Bills</b><br>Categories PocketSmith marks as bills (Rent, Car Payment, Loan Payments) plus payees matching the bill patterns in plan.js${UI.ast()} (e.g. insurance premiums tagged “Payment”).</div>
          <div><b>Living</b><br>Everything else that is a debit — groceries, dining, gas, shopping, subscriptions, parking. Refunds offset. Pending transactions are included and flagged.</div>
        </div></div>`;
  },
  mount(S) {
    const liv = S.d.living;
    document.getElementById('tg-bills').addEventListener('click', () => { S.setPref('spendBills', S.prefs.spendBills === false); APP.render(); });
    CH.make(document.getElementById('c-living'), {
      type: 'line',
      data: { labels: liv.series.map(s => s.date.slice(8)), datasets: [
        { label: 'Actual', data: liv.series.map(s => s.actual), borderColor: CH.colors.net, backgroundColor: 'rgba(201,133,0,.12)', fill: true, borderWidth: 2.5, spanGaps: false },
        { label: 'Budget', data: liv.series.map(s => s.budget), borderColor: 'rgba(232,230,223,.4)', borderDash: [4, 4], borderWidth: 1.5 }
      ] },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { x: CH.xClean({ ticks: { maxTicksLimit: 10 } }), y: CH.yMoney({ beginAtZero: true }) }, plugins: { guides: { zero: false }, tooltip: { callbacks: { title: i => F.fmtDate(liv.series[i[0].dataIndex].date), label: i => ` ${i.dataset.label}: ${F.money(i.parsed.y)}` } } } }
    });
  }
};
