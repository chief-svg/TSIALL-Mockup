// Statements view — every card's statement, due date and minimum, what the plan does about each,
// when its interest actually stops, and when the grace period comes back.
VIEWS.statements = {
  render(S) {
    const { ctx, d } = S; const B = d.statements;
    const rows = B.cards.map(c => {
      const a = c.acct;
      const stmt = c.statement != null ? `${F.money(c.statement)}<span class="sub">due ${F.fmtDate(c.due, { year: false })}${c.inferred ? UI.ast() : ''} · closes ~${F.fmtDate(c.close, { year: false })}${UI.ast()}</span>` : `<span class="muted">—</span><span class="sub">next due ~${F.fmtDate(c.due, { year: false })}${c.inferred ? UI.ast() : ''}</span>`;
      const min = c.dead ? '—' : c.s.due === c.due ? (c.minDue > 0 ? `<span class="amber">${F.money(c.minDue)}</span><span class="sub">still owed</span>` : `<span class="pos">$0</span><span class="sub">paid</span>`) : `${F.money(c.minEst)}${UI.ast()}<span class="sub">est.</span>`;
      const status = c.dead ? UI.chip('done', 'dead') : c.promo ? UI.chip('ok', '0% promo') : `<span class="chip gap">carrying</span>`;
      const stops = c.dead ? '<span class="muted">already</span>' : c.promo ? `<span class="muted">no interest</span><span class="sub">promo to ${F.fmtDate(a.promoEnds || '2027-07-17', { year: true })}</span>` : c.deathDate ? `<span class="gold num">☠ ${F.fmtDate(c.deathDate, { year: false })}</span><span class="sub">≈ ${F.money(c.interest)} more interest${UI.ast()}</span>` : '<span class="neg">underfunded</span>';
      const grace = c.dead ? '—' : c.graceBack ? `${F.fmtDate(c.graceBack, { year: false })}${UI.ast()}<span class="sub">trailing stmt closes · pay it in full</span>` : '—';
      return `<tr class="${c.dead ? 'dead' : ''}">
        <td><b>${F.esc(a.short)}</b><span class="sub">${F.esc(a.label || '')}</span></td>
        <td class="num">${stmt}</td>
        <td class="num">${min}</td>
        <td class="num neg">${F.money(-c.bal)}<span class="sub">${a.apr ? `${(a.apr * 100).toFixed(2)}% · ${F.money(c.perDay)}/day` : '0%'}</span></td>
        <td>${status}</td>
        <td class="small ${c.actionKind === 'kill' ? 'gold' : c.actionKind === 'min' ? 'amber' : 'muted'}">${F.esc(c.action)}</td>
        <td class="num">${stops}</td>
        <td class="num">${grace}</td></tr>`;
    }).join('');

    const cal = B.calendar.filter(e => e.date >= ctx.today).slice(0, 24);
    const calRows = cal.map(e => `<tr class="${e.kind === 'kill' ? 'hl' : ''}">
      <td><span class="date">${F.fmtDate(e.date)}</span><span class="sub">${F.weekday(e.date)} · in ${F.daysBetween(ctx.today, e.date)}d</span></td>
      <td><b>${F.esc(e.short)}</b></td>
      <td>${e.kind === 'kill' ? `<span class="gold">☠ Pay the live balance${e.amount ? ` (~${F.money(e.amount)}${UI.ast()})` : ''}</span>` : e.kind === 'min' ? `Minimum ${F.money(e.amount)}${e.est ? UI.ast() : ''}` : `<span class="muted">Nothing due</span>`}</td>
      <td class="small muted">${F.esc(e.why)}</td></tr>`).join('');

    const carrying = B.cards.filter(c => c.carrying);
    const monthly = B.totalPerDay * 30;
    return `<div class="page-head"><div><h1>Statements</h1><p>Every card's statement balance, due date and minimum, as read from the issuer apps on ${F.fmtDate(B.asOf)}. Due dates decide late fees and penalty rates. They do not decide interest.</p></div>
      <div class="right"><div class="eyebrow">Interest running today</div><div class="big neg">${F.money(B.totalPerDay)}<span class="muted" style="font-size:16px">/day</span></div><div class="small muted">≈ ${F.money(monthly)} a month across ${carrying.length} carrying cards${UI.ast()}</div></div></div>

      <div class="callout" style="margin-bottom:18px"><b>How to actually avoid the interest.</b> A card that carried a balance last month has no grace period: every dollar on it, old or new, accrues interest daily until the balance is <b>zero</b>. Paying the statement balance in full while a remainder stays on the card does not stop the meter, and the remainder is what the next statement charges you for. So the plan pays each card to <b>zero</b> in one go, highest rate first, and only the minimum on the cards still waiting. Once a card is at zero, its next statement closes at $0 and the grace period returns for new purchases. Until then, pay living from checking.</div>

      <div class="panel flush"><div class="ph"><h3>This cycle</h3><span class="small muted">statement · due · minimum · what the plan does</span></div>
        <div class="table-wrap"><table><thead><tr><th>Card</th><th class="num">Statement</th><th class="num">Minimum</th><th class="num">Balance now</th><th>Status</th><th>What to do</th><th class="num">Interest stops</th><th class="num">Grace back</th></tr></thead><tbody>${rows}</tbody>
        <tfoot><tr><td colspan="8" class="small muted">Minimums after the current cycle are estimates${UI.ast()} from the last one paid (Citi ≈ 1% of the statement). They are reserved as bills in every funds check. Closing dates are inferred as due − 25 days${UI.ast()}.</td></tr></tfoot></table></div></div>

      <div class="grid g32" style="margin-top:18px">
        <div class="panel flush"><div class="ph"><h3>Due-date calendar</h3><span class="small muted">next ${cal.length} card events</span></div>
          <div class="table-wrap"><table><thead><tr><th>Date</th><th>Card</th><th>Pay</th><th>Why</th></tr></thead><tbody>${calRows || '<tr><td colspan="4" class="muted center">Nothing coming up</td></tr>'}</tbody></table></div></div>
        <div>
          <div class="panel"><div class="ph"><h3>Rules for the cards</h3></div>
            <ol class="small" style="margin:0;padding-left:18px;line-height:1.7">
              <li><b>Kill day = pay the live balance</b>, not the statement balance. The statement is weeks old; the live balance includes interest since then.</li>
              <li><b>Expect a trailing-interest statement</b> after each kill: the interest from the last close to the kill day. Pay it the day it posts, or the card is not at zero and no grace returns.</li>
              <li><b>Minimums by every due date</b> on waiting cards, nothing more. Extra dollars go to the highest-rate card instead, where they save more.</li>
              <li><b>No new charges</b> on any carrying card. Living comes out of checking. The Discover 0% card is the only card that can carry spend without interest, and it is being paid off Feb 27.</li>
              <li><b>Never pay a statement in full and leave a remainder</b> on purpose. It costs the same interest as any other payment of that size and does not restore the grace period.</li>
            </ol></div>
          <div class="note" style="margin-top:14px">${B.cards.filter(c => c.inferred).map(c => `<b>${F.esc(c.acct.short)}</b>: ${F.esc(c.note)}`).join('<br>')}${B.cards.some(c => c.inferred) ? '<br>' : ''}Amex Pay Over Time cards: charges above the Pay Over Time limit can be demanded in full on the due date — if an Amex app shows a “pay in full” amount larger than the minimum here, that amount is the minimum.</div>
        </div>
      </div>`;
  }
};
