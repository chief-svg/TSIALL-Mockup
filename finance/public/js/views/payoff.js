// Payoff view — the full schedule with matching status, per-card simulation, funds checks.
VIEWS.payoff = {
  render(S) {
    const { ctx, d } = S; const sc = d.sched; const next = sc.next;
    const rows = sc.groups.map(g => {
      const fund = d.funds.find(f => f.date === g.date);
      const head = `<tr class="group ${g === next ? 'hl' : ''} ${g.date < ctx.today && g.status === 'done' ? 'past' : ''}">
        <td><span class="date">${F.fmtDate(g.date)}</span><span class="sub">${F.weekday(g.date)} · ${g.daysUntil === 0 ? 'today' : g.daysUntil > 0 ? `in ${g.daysUntil}d` : `${-g.daysUntil}d ago`}</span></td>
        <td colspan="2">${g.kills.length ? `<span class="gold">☠ ${g.kills.join(' · ')}</span>` : ''}${g.date === PLAN.debtFreeDate ? ' <span class="gold">🏁 debt-free</span>' : ''}${g.items.some(i => i.acct && i.acct.payoffQuote) ? `<span class="sub amber">Request official payoff quotes (per-diem interest) before paying</span>` : ''}</td>
        <td class="num" style="font-size:15px">${F.money(g.total)}</td>
        <td class="num">${g.done ? F.money(g.done) : '—'}</td>
        <td>${fund ? `<span class="chip ${fund.ok ? 'ok' : 'gap'}">${fund.ok ? 'funds ok' : 'short ' + F.money(-fund.gap)}</span>` : ''}</td>
        <td>${UI.chip(g.status)}</td></tr>`;
      const items = g.items.map(i => `<tr>
        <td></td>
        <td>${i.acct ? `<b>${F.esc(i.acct.short)}</b><span class="sub">${F.esc(i.acct.label)}</span>` : `<b>Interest true-up buffer</b>${UI.ast()}`}</td>
        <td class="small muted">${F.esc(i.note || '')}</td>
        <td class="num">${F.money(i.amount)}</td>
        <td class="num">${i.tx ? `${F.money(i.matched)}<span class="sub">${F.fmtDate(i.tx.date, { year: false })}${i.multi ? ` · ${i.multi} payments` : ''}</span>` : '—'}</td>
        <td class="num ${i.acct && i.acct.balance < 0 ? 'neg' : 'pos'}">${i.acct ? F.money(i.acct.balance) : ''}</td>
        <td>${UI.chip(i.status, i.kill && i.status === 'done' ? 'dead' : i.status)}</td></tr>`).join('');
      return head + items;
    }).join('');

    const sims = d.sims.sims.filter(s => s.acct.role !== 'display' || s.acct.balance < 0);
    const simRows = sims.map(s => { const a = s.acct; const dead = a.balance >= -0.005; return `<tr class="${dead ? 'dead' : ''}">
      <td><b>${F.esc(a.short)}</b><span class="sub">${a.institution ? F.esc(a.institution) + ' · ' : ''}${a.role}</span></td>
      <td class="num">${a.apr ? (a.apr * 100).toFixed(2) + '%' : '—'}</td>
      <td class="num neg">${F.money(a.balance)}</td>
      <td class="num">${F.money(s.planned)}</td>
      <td class="num muted">${F.money(s.interest)}</td>
      <td class="num">${s.overpay > 0 ? `<span class="pos">+${F.money(s.overpay)} over</span>` : s.residual > 0 ? `<span class="${s.tail ? 'amber' : 'neg'}">${F.money(s.residual)} ${s.tail ? 'tail' : 'short'}</span>` : '—'}</td>
      <td>${dead ? UI.chip('done', 'dead') : s.deathDate ? `<span class="gold num">☠ ${F.fmtDate(s.deathDate)}</span>${s.sweptBy ? `<span class="sub">tail swept ${F.fmtDate(s.sweptBy, { year: false })}</span>` : ''}` : `<span class="neg">underfunded</span>`}</td></tr>`; }).join('');

    const events = (ctx.events || []).filter(e => e.date >= ctx.today).sort((a, b) => a.date < b.date ? -1 : 1).slice(0, 14);
    const evRows = events.map(e => `<tr><td class="num muted">${F.fmtDate(e.date, { year: false })}</td><td>${F.esc(e.category ? e.category.title : '')}<span class="sub">${F.esc((e.note || '').slice(0, 80))}</span></td><td class="small muted">${F.esc(e.scenario ? e.scenario.title : '')}</td><td class="num ${e.amount < 0 ? 'neg' : 'pos'}">${F.signed(e.amount)}</td></tr>`).join('');

    return `<div class="page-head"><div><h1>Payoff</h1><p>Who gets paid, when, and how much. A payment is <b>done</b> when a matching credit lands on the target account within ±${PLAN.match.days} days and ±${PLAN.match.pct * 100}% of plan; <b>sent</b> when it has left checking but not yet posted.</p></div>
      <div class="right"><div class="eyebrow">Completed / planned</div><div class="big">${F.money(sc.completed)} <span class="muted" style="font-size:18px">/ ${F.money(sc.planned)}</span></div></div></div>

      <div class="controls">${PLAN.rhythm.map(r => `<div class="ctl"><label>${r.day}th</label><span class="num gold">${F.money(r.amount)}</span><span class="muted">← ${F.esc(r.from)}</span></div>`).join('')}<div class="ctl muted small">Monthly rhythm during payoff · Sep 27 is larger with the reimbursement · Nov trims to fit · Dec is cleanup + loan kills</div></div>

      <div class="panel flush"><div class="ph"><h3>Schedule</h3><span class="small muted">${sc.groups.length} payment dates · ${sc.items.length} line items</span></div>
        <div class="table-wrap"><table><thead><tr><th>Date</th><th>Target</th><th>Note</th><th class="num">Planned</th><th class="num">Matched</th><th class="num">Live balance</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></div>

      <div class="grid g32" style="margin-top:18px">
        <div class="panel flush"><div class="ph"><h3>Per-account simulation${UI.ast()}</h3><span class="small muted">daily interest at APR, no new charges, live balance as the start</span></div>
          <div class="table-wrap"><table><thead><tr><th>Account</th><th class="num">APR</th><th class="num">Live</th><th class="num">Planned in</th><th class="num">Est. interest</th><th class="num">Residual</th><th>Death date</th></tr></thead><tbody>${simRows}</tbody>
          <tfoot><tr><td colspan="4" class="small muted">Est. interest to payoff ${F.money(d.sims.totalInterest)} · tails ${F.money(d.sims.tails)} vs buffer ${F.money(d.sims.bufferAmount)} (${F.money(d.sims.bufferLeft)} left)</td><td colspan="3" class="right small ${d.sims.totalShortfall > 0 ? 'neg' : 'pos'}">${d.sims.totalShortfall > 0 ? `Plan underfunded by ${F.money(d.sims.totalShortfall)} — raise a payment` : `Plan fully funds every balance · debt-free ${F.fmtDate(d.sims.debtFree)}`}</td></tr></tfoot></table></div></div>
        <div>
          <div class="panel"><div class="ph"><h3>Funds check${UI.ast()}</h3></div>
            <table><thead><tr><th>Pay date</th><th class="num">Available</th><th class="num">Need</th><th>Result</th></tr></thead><tbody>${d.funds.map(f => `<tr><td class="num">${F.fmtDate(f.date, { year: false })}<span class="sub">+${F.money(f.income)} income · −${F.money(f.bills)} bills · −${F.money(f.living)} living</span></td><td class="num">${F.money(f.available)}</td><td class="num">${F.money(f.need)}</td><td>${f.ok ? UI.chip('ok', 'covered') : UI.chip('gap', 'short ' + F.money(-f.gap))}</td></tr>`).join('')}</tbody></table>
            <div class="note" style="margin-top:10px">Checking balance + unmatched expected income − unmatched bills − living at ${F.money(PLAN.living.monthly)}/month, rolled forward date by date. Net-pay figures are estimates${UI.ast()}.</div></div>
          <div class="callout" style="margin-top:14px"><b>December loans.</b> SoFi and the Wells Fargo auto loan need an official payoff quote with per-diem interest before the Dec 27 wires — the ~$11,100 / ~$8,900 figures are estimates${UI.ast()}. Confirm the lien release process for the auto title.</div>
        </div>
      </div>

      <div class="panel flush" style="margin-top:18px"><div class="ph"><h3>PocketSmith calendar cross-check</h3><span class="small muted">next 60 days of budget events from the API</span></div>
        <div class="table-wrap"><table><thead><tr><th>Date</th><th>Event</th><th>Account</th><th class="num">Amount</th></tr></thead><tbody>${evRows || '<tr><td colspan="4" class="muted center">No upcoming events returned</td></tr>'}</tbody></table></div></div>`;
  }
};
