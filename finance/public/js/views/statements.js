// Statements view — every card's statement, due date and minimum, what the plan does about each,
// when its interest actually stops, and when the grace period comes back.
VIEWS.statements = {
  render(S) {
    const { ctx, d } = S; const B = d.statements;
    const rows = B.cards.map(c => {
      const a = c.acct;
      const stmt = c.statement != null ? `${F.money(c.statement)}<span class="sub">due ${F.fmtDate(c.due, { year: false })}${c.inferred ? UI.ast() : ''} · closes ${c.s.closeDay ? '' : '~'}${F.fmtDate(c.close, { year: false })}${c.s.closeDay ? '' : UI.ast()}</span>` : `<span class="muted">—</span><span class="sub">next due ~${F.fmtDate(c.due, { year: false })}${c.inferred ? UI.ast() : ''}</span>`;
      const min = c.dead ? '—' : c.s.due === c.due ? (c.minDue > 0 ? `<span class="amber">${F.money(c.minDue)}</span><span class="sub">still owed</span>` : `<span class="pos">$0</span><span class="sub">paid</span>`) : `${F.money(c.minEst)}${UI.ast()}<span class="sub">est.</span>`;
      const status = c.dead ? UI.chip('done', 'dead') : c.isFloat ? UI.chip('ok', 'living float') : c.grace ? UI.chip('ok', 'in grace') : c.promo ? UI.chip('ok', '0% promo') : `<span class="chip gap">carrying</span>`;
      const stops = c.dead ? '<span class="muted">already</span>' : c.grace ? `<span class="pos">never charged</span><span class="sub">while each statement is paid in full</span>` : c.promo ? `<span class="muted">no interest</span><span class="sub">promo to ${F.fmtDate(a.promoEnds || '2027-07-17', { year: true })}</span>` : c.deathDate ? `<span class="gold num">☠ ${F.fmtDate(c.deathDate, { year: false })}</span><span class="sub">≈ ${F.money(c.interest)} more interest${UI.ast()}</span>` : '<span class="neg">underfunded</span>';
      const grace = c.dead ? '—' : c.grace ? '<span class="pos">now</span>' : c.graceBack ? `${F.fmtDate(c.graceBack, { year: false })}${UI.ast()}<span class="sub">trailing stmt closes · pay it in full</span>` : '—';
      return `<tr class="${c.dead ? 'dead' : ''}">
        <td><b>${F.esc(a.short)}</b><span class="sub">${F.esc(a.label || '')}</span></td>
        <td class="num">${stmt}</td>
        <td class="num">${min}</td>
        <td class="num neg">${F.money(-c.bal)}<span class="sub">${a.apr ? `${(a.apr * 100).toFixed(2)}% · ${F.money(c.perDay)}/day` : '0%'}</span></td>
        <td>${status}</td>
        <td class="small ${c.actionKind === 'kill' || c.actionKind === 'float' || c.actionKind === 'grace' ? 'gold' : c.actionKind === 'min' ? 'amber' : 'muted'}">${F.esc(c.action)}</td>
        <td class="num">${stops}</td>
        <td class="num">${grace}</td></tr>`;
    }).join('');

    const cal = B.calendar.filter(e => e.date >= ctx.today).slice(0, 24);
    const calRows = cal.map(e => `<tr class="${e.kind === 'kill' ? 'hl' : ''}">
      <td><span class="date">${F.fmtDate(e.date)}</span><span class="sub">${F.weekday(e.date)} · in ${F.daysBetween(ctx.today, e.date)}d</span></td>
      <td><b>${F.esc(e.short)}</b></td>
      <td>${e.kind === 'kill' ? `<span class="gold">☠ Pay the live balance${e.amount ? ` (~${F.money(e.amount)}${UI.ast()})` : ''}</span>` : e.kind === 'statement' ? `<span class="gold">Statement in full ${F.money(e.amount)}${e.est ? UI.ast() : ''}</span>` : e.kind === 'min' ? `Minimum ${F.money(e.amount)}${e.est ? UI.ast() : ''}` : `<span class="muted">Nothing due</span>`}</td>
      <td class="small muted">${F.esc(e.why)}</td></tr>`).join('');

    const carrying = B.cards.filter(c => c.carrying);
    const monthly = B.totalPerDay * 30;
    return `<div class="page-head"><div><h1>Statements</h1><p>Every card's statement balance, due date and minimum, as read from the issuer apps on ${F.fmtDate(B.asOf)}. Due dates decide late fees and penalty rates. They do not decide interest.</p></div>
      <div class="right"><div class="eyebrow">Interest running today</div><div class="big neg">${F.money(B.totalPerDay)}<span class="muted" style="font-size:16px">/day</span></div><div class="small muted">≈ ${F.money(monthly)} a month across ${carrying.length} carrying cards${UI.ast()}</div></div></div>

      <div class="callout" style="margin-bottom:18px"><b>Two kinds of card.</b> <b>In grace</b> (Citi 8018, Citi 3208 — their statements show $0 interest because the previous balance was paid in full): pay the <i>statement balance</i> in full by the due date and nothing on that statement ever pays interest; new charges ride to the next statement, also interest-free if that one is paid in full. The 8018 is the <b>living card</b>: day-to-day spend goes on it and each statement is paid in full on the 20th — a free float. <b>Carrying</b> (Amex Biz Plat, Biz Gold, Sapphire, and the personal Platinum from Sep 21): no grace period, interest accrues daily on the whole balance until it is <b>zero</b>, so they die whole-card, highest rate first, with only the minimum on the ones still waiting. No new charges on carrying cards.</div>

      <div class="panel flush"><div class="ph"><h3>This cycle</h3><span class="small muted">statement · due · minimum · what the plan does</span></div>
        <div class="table-wrap"><table><thead><tr><th>Card</th><th class="num">Statement</th><th class="num">Minimum</th><th class="num">Balance now</th><th>Status</th><th>What to do</th><th class="num">Interest stops</th><th class="num">Grace back</th></tr></thead><tbody>${rows}</tbody>
        <tfoot><tr><td colspan="8" class="small muted">Minimums after the current cycle are estimates${UI.ast()} from the last one paid (Citi ≈ 1% of the statement). They are reserved as bills in every funds check. Closing dates not shown by the issuer are inferred as due − 25 days${UI.ast()}.</td></tr></tfoot></table></div></div>

      <div class="grid g32" style="margin-top:18px">
        <div class="panel flush"><div class="ph"><h3>Due-date calendar</h3><span class="small muted">next ${cal.length} card events</span></div>
          <div class="table-wrap"><table><thead><tr><th>Date</th><th>Card</th><th>Pay</th><th>Why</th></tr></thead><tbody>${calRows || '<tr><td colspan="4" class="muted center">Nothing coming up</td></tr>'}</tbody></table></div></div>
        <div>
          <div class="panel"><div class="ph"><h3>Rules for the cards</h3></div>
            <ol class="small" style="margin:0;padding-left:18px;line-height:1.7">
              <li><b>Grace cards: statement in full by the due date, every month.</b> Miss one and interest is charged on that whole statement from the start of the cycle. The 8018 (living) statement closes on the 24th and is due on the 20th; pay it from Jessica’s 15th check.</li>
              <li><b>Kill day = pay the live balance</b> on carrying cards, not the statement balance. The statement is weeks old; the live balance includes interest since then.</li>
              <li><b>Expect a trailing-interest statement</b> after each kill: the interest from the last close to the kill day. Pay it the day it posts, or the card is not at zero and no grace returns.</li>
              <li><b>Minimums by every due date</b> on waiting cards, nothing more. Extra dollars go to the highest-rate card instead, where they save more.</li>
              <li><b>No new charges</b> on any carrying card. Living goes on the 8018 only. The Discover 0% card carries no interest either, but it is being paid off Feb 27 — don’t add to it.</li>
              <li><b>On a carrying card, paying the statement in full does not stop interest</b> — the remainder keeps accruing and grace only returns after a $0 statement. Only grace cards get the statement-in-full treatment.</li>
            </ol></div>
          <div class="note" style="margin-top:14px">${B.cards.filter(c => c.inferred).map(c => `<b>${F.esc(c.acct.short)}</b>: ${F.esc(c.note)}`).join('<br>')}${B.cards.some(c => c.inferred) ? '<br>' : ''}The personal Platinum was in grace too; the Sep 21 statement is left unpaid on purpose because the same cash keeps the larger 8018 interest-free (cost ≈ $220 once${UI.ast()}). Amex Pay Over Time cards: charges above the Pay Over Time limit can be demanded in full on the due date — if an Amex app shows a “pay in full” amount larger than the minimum here, that amount is the minimum.</div>
        </div>
      </div>`;
  }
};
