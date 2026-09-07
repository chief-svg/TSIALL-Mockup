// Accounts view — every account, live.
VIEWS.accounts = {
  render(S) {
    const { ctx, d } = S; const t = ctx.totals;
    const simBy = Object.fromEntries(d.sims.sims.map(s => [s.acct.id, s]));
    const group = (title, list) => list.length ? `<tr class="group"><td colspan="6"><span class="eyebrow">${title}</span></td><td class="num" style="font-size:14px">${F.money(list.reduce((s, a) => s + a.balance, 0))}</td><td></td></tr>` + list.map(a => { const s = simBy[a.id]; return `<tr class="${a.isDebt && a.balance >= -0.005 && a.role !== 'display' ? 'dead' : ''}">
      <td><b>${F.esc(a.short)}</b><span class="sub">${F.esc(a.title)}${a.number ? ' …' + F.esc(a.number) : ''}</span></td>
      <td class="small">${a.institution ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${a.colour || '#888'};margin-right:6px"></span>${F.esc(a.institution)}` : ''}</td>
      <td class="small muted">${F.esc(a.type)}</td>
      <td>${UI.chip(a.role === 'target' ? 'kill' : a.role === 'loan' ? 'sent' : a.role === 'cash' ? 'ok' : 'pending', a.role)}</td>
      <td class="num muted">${a.apr ? (a.apr * 100).toFixed(2) + '%' : '—'}</td>
      <td class="num muted">${a.balanceDate ? F.fmtDate(a.balanceDate, { year: false }) : '—'}</td>
      <td class="num ${a.balance < 0 ? 'neg' : a.balance > 0 ? 'pos' : 'muted'}">${F.money(a.balance, true)}</td>
      <td class="small">${s ? (a.balance >= -0.005 ? UI.chip('done', 'clear') : s.deathDate ? `<span class="gold num">☠ ${F.fmtDate(s.deathDate, { year: false })}</span>` : `<span class="neg">short ${F.money(s.shortfall)}</span>`) : ''}</td></tr>`; }).join('') : '';
    const cash = ctx.accounts.filter(a => a.isCash), sav = ctx.accounts.filter(a => !a.isDebt && !a.isCash), cards = ctx.accounts.filter(a => a.isDebt && a.role !== 'loan'), loans = ctx.accounts.filter(a => a.role === 'loan');
    return `<div class="page-head"><div><h1>Accounts</h1><p>Every PocketSmith account container with its live balance. Roles and APRs come from plan.js; unknown accounts are classified by PocketSmith type.</p></div>
      <div class="right"><div class="eyebrow">Net position</div><div class="big ${t.net < 0 ? 'neg' : 'pos'}">${F.money(t.net, true)}</div><div class="small muted">${ctx.accounts.length} accounts</div></div></div>
      <div class="grid g4" style="margin-bottom:18px">
        <div class="panel"><div class="eyebrow">Cash</div><div class="big">${F.money(t.cash)}</div></div>
        <div class="panel"><div class="eyebrow">Savings & invested</div><div class="big">${F.money(t.savings)}</div></div>
        <div class="panel"><div class="eyebrow">Cards</div><div class="big neg">${F.money(t.cards)}</div></div>
        <div class="panel"><div class="eyebrow">Loans</div><div class="big neg">${F.money(t.loans)}</div></div>
      </div>
      <div class="panel flush"><div class="table-wrap"><table><thead><tr><th>Account</th><th>Institution</th><th>Type</th><th>Role</th><th class="num">APR${UI.ast()}</th><th class="num">Balance date</th><th class="num">Balance</th><th>Death date</th></tr></thead><tbody>
        ${group('Cash', cash)}${group('Savings & investments', sav)}${group('Credit cards', cards)}${group('Loans', loans)}
      </tbody></table></div></div>
      <div class="note" style="margin-top:12px">Balances refresh from PocketSmith’s data feeds; the balance date shows when each feed last updated. APRs are the plan’s assumptions${UI.ast()} — confirm against statements, especially the loan rates.</div>`;
  }
};
