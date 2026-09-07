// After-debt view — the allocation waterfall from Jan 2027.
VIEWS.after = {
  render(S) {
    const { ctx, prefs } = S; const post = PLAN.post;
    const hsaOn = prefs.hsaOn ?? post.hsa.defaultOn;
    const efLive = ctx.totals.savings; // live non-operating balances count toward the EF
    const A = ENGINE.allocationTable({ hsaOn, efStart: efLive });
    const efPct = F.clamp(efLive / post.emergencyFund.target, 0, 1);
    const elig = post.sabino401k.eligibleDate; const daysTo401k = F.daysBetween(ctx.today, elig);
    const monthsLeft2027 = 12 - (Number(elig.slice(5, 7)) - 1);
    const typical = A.rows.find(r => r.efDone && r.toEF === 0) || A.rows[A.rows.length - 1];
    const wf = [
      { k: 'Emergency fund', v: typical.toEF, c: CH.colors.live, note: `${F.money(post.emergencyFund.target)} target in a HYSA · ≈${post.emergencyFund.months} months of the ${F.money(post.postDebtBurn)}/mo post-debt burn${UI.ast()}` },
      { k: 'Backdoor Roth IRAs', v: typical.roth, c: CH.colors.savings, note: `${F.money(post.roth.annualEach)} each · ${post.roth.note}` },
      { k: 'HSA', v: typical.hsa, c: CH.colors.amber, note: hsaOn ? `${F.money(post.hsa.annual)} family limit · ${post.hsa.note}` : 'Off — toggle on if the HDHP is chosen' },
      { k: 'Brokerage', v: typical.brokerage, c: CH.colors.net, note: post.brokerage.note }
    ];
    const rows = A.rows.map(r => `<tr class="${r.ym === ctx.today.slice(0, 7) ? 'hl' : ''}"><td>${F.fmtMonth(r.ym)}</td><td class="num blue">${r.toEF ? F.money(r.toEF) : '—'}<span class="sub">${F.money(r.ef)} ${r.efDone ? '✓ full' : ''}</span></td><td class="num pos">${r.roth ? F.money(r.roth) : '—'}</td><td class="num amber">${r.hsa ? F.money(r.hsa) : '—'}</td><td class="num gold">${r.brokerage ? F.money(r.brokerage) : '—'}</td><td class="num muted">${F.money(r.jessica401k)}${r.sabino401k ? ` + ${F.money(r.sabino401k)}` : ''}</td></tr>`).join('');
    return `<div class="page-head"><div><h1>After debt</h1><p>From ${F.fmtMonth(post.startMonth)} the same rhythm that killed the debt — ${post.byDay.map(b => `${F.money(b.amount)} on the ${b.day}th`).join(', ')} — becomes ${F.money(post.monthlyCapacity)}/month of savings capacity${UI.ast()}. It flows down this waterfall in priority order.</p></div>
      <div class="controls" style="margin:0"><div class="ctl"><label>HSA (HDHP chosen)</label><button class="switch ${hsaOn ? 'on' : ''}" id="tg-hsa" aria-label="toggle HSA"></button></div></div></div>

      <div class="grid g32">
        <div class="panel"><div class="ph"><h3>Waterfall · a typical month from ${A.efCompleteMonth ? F.fmtMonth(A.rows[A.rows.indexOf(A.rows.find(r => r.ym === A.efCompleteMonth)) + 1]?.ym || A.efCompleteMonth) : 'Mar ’27'}</h3><span class="num">${F.money(post.monthlyCapacity)} / mo</span></div>
          <div style="display:flex;height:22px;border-radius:4px;overflow:hidden;gap:2px;background:var(--bg)">${wf.filter(w => w.v > 0).map(w => `<div title="${F.esc(w.k)} ${F.money(w.v)}" style="flex:${w.v};background:${w.c}"></div>`).join('')}</div>
          <div class="table-wrap" style="margin-top:16px"><div style="min-width:640px">${wf.map((w, i) => `<div class="cardrow" style="grid-template-columns:24px 170px 1fr 110px"><div class="num muted">${i + 1}</div><div class="name"><span class="sw" style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${w.c};margin-right:8px"></span>${w.k}</div><div class="note">${w.note}</div><div class="num right">${w.v ? F.money(w.v) : '—'}</div></div>`).join('')}</div></div>
          <div class="hr"></div>
          <div class="grid g2 note"><div><b>Jessica’s 401(k)</b> — ${F.money(post.jessica401k.annual)}/yr, ${post.jessica401k.note}. Shown as a note, not a cash-flow line.</div><div><b>Sabino’s 401(k)</b> — eligible ${F.fmtDate(elig)}${UI.ast()} (<span class="num gold">${daysTo401k} days</span>). Front-load ${F.money(post.sabino401k.annual)} over the remaining ${monthsLeft2027} months of 2027 ≈ <span class="num">${F.money(post.sabino401k.annual / monthsLeft2027)}/mo</span> from payroll; take-home drops by roughly that less the tax saving${UI.ast()}.</div></div>
        </div>
        <div>
          <div class="panel"><div class="ph"><h3>Emergency fund</h3><span class="num">${F.money(efLive)} <span class="muted">/ ${F.money(post.emergencyFund.target)}</span></span></div>
            ${UI.bar(efPct, 'blue')}
            <div class="note" style="margin-top:10px">${efLive > 0 ? `${(efPct * 100).toFixed(0)}% funded from live non-operating balances.` : 'Nothing yet — open the HYSA in December so January’s first transfer has a home.'} Fills from ${F.fmtMonth(post.startMonth)} cash flow (+ the Dec ’26 ${F.money(13000)} buffer${UI.ast()}); full by <b>${A.efCompleteMonth ? F.fmtMonth(A.efCompleteMonth) : '—'}</b>.</div></div>
          <div class="panel" style="margin-top:14px"><div class="ph"><h3>Roth timing</h3></div>
            <div class="note">Roth starts once the EF is full, leaving ${A.rows.filter(r => r.efDone).length} months in 2027. To land the full ${F.money(post.roth.annualEach * 2)} for the year, contribute <b class="num">${A.rothCatchUp ? F.money(A.rothCatchUp) : '—'}/mo</b> instead of ${F.money(post.roth.monthly)}, or top up before the Apr 15, 2028 deadline. Filing MFS → backdoor route only: non-deductible traditional contribution, then convert. Check both spouses for pre-tax IRA balances first (pro-rata)${UI.ast()}.</div></div>
          <div class="panel" style="margin-top:14px"><div class="ph"><h3>Set-up checklist</h3></div>
            <div class="note" style="line-height:1.9">☐ Open HYSA (emergency fund) — Dec 2026<br>☐ Open two traditional + two Roth IRAs (backdoor)<br>☐ Confirm HDHP election → HSA ${hsaOn ? 'on' : 'off'}<br>☐ Jessica 401(k) election at max<br>☐ Brokerage account, auto-invest on the 15th/27th/30th<br>☐ Sabino 401(k) enrollment reminder · ${F.fmtDate(elig)}</div></div>
        </div>
      </div>

      <div class="panel flush" style="margin-top:18px"><div class="ph"><h3>Month by month · 2027</h3><span class="small muted">cash allocations; 401(k) column is payroll-side</span></div>
        <div class="table-wrap"><table><thead><tr><th>Month</th><th class="num">→ Emergency fund</th><th class="num">→ Roth (both)</th><th class="num">→ HSA</th><th class="num">→ Brokerage</th><th class="num">401(k) payroll${UI.ast()}</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  },
  mount(S) {
    document.getElementById('tg-hsa').addEventListener('click', () => { S.setPref('hsaOn', !(S.prefs.hsaOn ?? PLAN.post.hsa.defaultOn)); APP.render(); });
  }
};
