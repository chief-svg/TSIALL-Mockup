// After-debt view — the allocation waterfall from Jan 2027.
VIEWS.after = {
  render(S) {
    const { ctx, prefs } = S; const post = PLAN.post;
    const hsaOn = prefs.hsaOn ?? post.hsa.defaultOn;
    const efLive = ctx.totals.savings; // live non-operating balances count toward the EF
    const A = ENGINE.allocationTable({ hsaOn, efStart: efLive });
    const cmp = { w2Gross: 260000, c1099: 260000, matchPct: 0, health: 8000, idrRate: 0.10, hsa: hsaOn ? PLAN.post.hsa.annual : 0, cb: { on: false, age: PLAN.post.jessicaAge || 40, amount: null, fee: 3000 }, ...(prefs.w2cmp || {}) };
    cmp.cb = { on: false, age: PLAN.post.jessicaAge || 40, amount: null, fee: 3000, ...(cmp.cb || {}) };
    if (prefs.w2cmp && prefs.w2cmp.hsa === undefined) cmp.hsa = hsaOn ? PLAN.post.hsa.annual : 0;
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

      <div class="panel" style="margin-top:18px" id="w2-panel">
        <div class="ph"><h3>Jessica: W-2 or 1099?</h3><span class="small muted">2026 rules · married filing separately · Texas · estimates${UI.ast()}</span></div>
        <div class="controls" style="margin-bottom:14px">
          <div class="ctl"><label>W-2 gross</label><input type="range" id="w2-g" min="100000" max="500000" step="5000" value="${cmp.w2Gross}"><span class="val num" id="w2-gv">${F.money(cmp.w2Gross)}</span></div>
          <div class="ctl"><label>1099 rate</label><input type="range" id="w2-c" min="100000" max="500000" step="5000" value="${cmp.c1099}"><span class="val num" id="w2-cv">${F.money(cmp.c1099)}</span></div>
          <div class="ctl"><label>401(k) match</label><input type="range" id="w2-m" min="0" max="0.08" step="0.005" value="${cmp.matchPct}"><span class="val num" id="w2-mv">${(cmp.matchPct * 100).toFixed(1)}%</span></div>
          <div class="ctl"><label>Health premium / yr</label><input type="range" id="w2-h" min="0" max="24000" step="500" value="${cmp.health}"><span class="val num" id="w2-hv">${F.money(cmp.health)}</span></div>
          <div class="ctl"><label>IDR rate</label><input type="range" id="w2-r" min="0.05" max="0.15" step="0.01" value="${cmp.idrRate}"><span class="val num" id="w2-rv">${(cmp.idrRate * 100).toFixed(0)}%</span></div>
          <div class="ctl"><label>HSA</label><button class="switch ${cmp.hsa ? 'on' : ''}" id="w2-hsa" aria-label="HSA"></button></div>
          <div class="ctl"><label>Cash balance plan</label><button class="switch ${cmp.cb.on ? 'on' : ''}" id="w2-cb" aria-label="cash balance plan"></button></div>
          <div class="ctl ${cmp.cb.on ? '' : 'hidden'}" id="w2-cb-ctl"><label>Age</label><input type="number" id="w2-age" min="25" max="65" value="${cmp.cb.age}" style="width:64px"><label>Contribution</label><input type="range" id="w2-cba" min="0" max="${ENGINE.cbMaxByAge(cmp.cb.age)}" step="1000" value="${cmp.cb.amount ?? ENGINE.cbMaxByAge(cmp.cb.age)}"><span class="val num" id="w2-cbav">${F.money(cmp.cb.amount ?? ENGINE.cbMaxByAge(cmp.cb.age))}</span></div>
          <button class="btn sm" id="w2-reset">Reset</button>
        </div>
        <div class="grid g32">
          <div class="table-wrap"><table id="w2-table"><thead><tr><th></th><th class="num">W-2</th><th class="num">1099</th><th class="num">1099 − W-2</th></tr></thead><tbody></tbody></table></div>
          <div>
            <div class="callout" id="w2-verdict"></div>
            <div class="note" style="margin-top:12px">How it's modelled: W-2 pays employee FICA and defers ${F.money(ENGINE.TAX26.deferral)} pre-tax (+ match). 1099 pays full self-employment tax (half deductible), defers ${F.money(ENGINE.TAX26.deferral)} plus a Solo 401(k) employer contribution of 20% of net profit (combined cap ${F.money(ENGINE.TAX26.solo401kTotal)}), and deducts the health premium above the line. Health is self-purchased in both cases (no employer coverage). Income tax uses 2026 MFS brackets and standard deduction; loan payment = IDR rate × (AGI − 150% FPL). Ignored: QBI deduction (likely phased out), PTO, disability/life cover, S-corp election, business expenses — all favour or penalise 1099 modestly.</div>
          </div>
        </div>
      </div>

      <div class="panel flush" style="margin-top:18px"><div class="ph"><h3>Month by month · 2027</h3><span class="small muted">cash allocations; 401(k) column is payroll-side</span></div>
        <div class="table-wrap"><table><thead><tr><th>Month</th><th class="num">→ Emergency fund</th><th class="num">→ Roth (both)</th><th class="num">→ HSA</th><th class="num">→ Brokerage</th><th class="num">401(k) payroll${UI.ast()}</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  },
  mount(S, root) {
    document.getElementById('tg-hsa').addEventListener('click', () => { S.setPref('hsaOn', !(S.prefs.hsaOn ?? PLAN.post.hsa.defaultOn)); APP.render(); });
    const hsaOn = S.prefs.hsaOn ?? PLAN.post.hsa.defaultOn;
    let cmp = { w2Gross: 260000, c1099: 260000, matchPct: 0, health: 8000, idrRate: 0.10, hsa: hsaOn ? PLAN.post.hsa.annual : 0, cb: { on: false, age: PLAN.post.jessicaAge || 40, amount: null, fee: 3000 }, ...(S.prefs.w2cmp || {}) };
    cmp.cb = { on: false, age: PLAN.post.jessicaAge || 40, amount: null, fee: 3000, ...(cmp.cb || {}) };
    const $ = id => root.querySelector('#' + id);
    const row = (k, a, b, fmt = v => F.money(v), good) => { const d = b - a; return `<tr><td>${k}</td><td class="num">${fmt(a)}</td><td class="num">${fmt(b)}</td><td class="num ${d === 0 ? 'muted' : (good ? d > 0 : d < 0) ? 'pos' : 'neg'}">${d === 0 ? '—' : (d > 0 ? '+' : '−') + fmt(Math.abs(d))}</td></tr>`; };
    const draw = () => {
      const R = ENGINE.compareW2vs1099(cmp); const w = R.w2, c = R.c1099; const R0 = ENGINE.compareW2vs1099({ ...cmp, cb: { ...cmp.cb, on: false } });
      $('w2-table').querySelector('tbody').innerHTML = [
        row('Gross pay', w.gross, c.gross, undefined, true),
        row('Payroll / SE tax', w.payrollTax, c.payrollTax, undefined, false),
        row('401(k) pre-tax (incl. employer)', w.deferral + w.employer, c.deferral + c.employer, undefined, true),
        ...(c.cb ? [row('Cash balance plan', 0, c.cb, undefined, true), row('Plan admin / actuary', 0, c.cbFee, undefined, false)] : []),
        row('<b>AGI</b>', w.agi, c.agi, undefined, false),
        row('Federal income tax', w.tax, c.tax, undefined, false),
        row('Student loan payment (IDR) / yr', w.idr, c.idr, undefined, false),
        row('Health premium', w.health, c.health, undefined, false),
        row('Take-home cash', w.takeHome, c.takeHome, undefined, true),
        row('<b>Cash + retirement built / yr</b>', w.build, c.build, undefined, true)
      ].join('');
      const better = R.delta.build > 0;
      $('w2-verdict').className = 'callout ' + (better ? 'green' : 'red');
      $('w2-verdict').innerHTML = `<b>${better ? '1099 comes out ahead' : 'W-2 comes out ahead'} by ${F.money(Math.abs(R.delta.build))}/yr</b> in cash plus retirement, with AGI ${F.money(Math.abs(R.delta.agi))} ${R.delta.agi < 0 ? 'lower' : 'higher'} and the loan payment ${F.money(Math.abs(R.delta.idr))}/yr ${R.delta.idr < 0 ? 'lower' : 'higher'}.<br><span class="small">Break-even 1099 rate at these settings: <b class="num">${F.money(R.breakEven)}</b> (${((R.breakEven / cmp.w2Gross - 1) * 100).toFixed(0)}% vs the W-2 gross). Ask for at least the W-2 gross plus the employer’s 7.65% FICA saving${UI.ast()}.</span>`;
      if (c.cb) $('w2-verdict').innerHTML += `<div class="small" style="margin-top:8px">Cash balance at age ${cmp.cb.age}: up to about <b class="num">${F.money(c.cbMax)}</b>/yr${UI.ast()}; 401(k) employer piece drops to 6% of comp. Over 5 years: ≈ <b class="num">${F.money(c.cb * 5)}</b> into the pension and ≈ <b class="num">${F.money(((R0.c1099.tax + R0.c1099.idr) - (c.tax + c.idr)) * 5)}</b> of tax + loan payments avoided vs Solo 401(k) alone.</div>`;
      $('w2-gv').textContent = F.money(cmp.w2Gross); $('w2-cv').textContent = F.money(cmp.c1099); $('w2-mv').textContent = (cmp.matchPct * 100).toFixed(1) + '%'; $('w2-hv').textContent = F.money(cmp.health); $('w2-rv').textContent = (cmp.idrRate * 100).toFixed(0) + '%';
    };
    const bind = (id, key) => { const el = $(id); el.addEventListener('input', () => { cmp[key] = Number(el.value); draw(); }); el.addEventListener('change', () => S.setPref('w2cmp', cmp)); };
    bind('w2-g', 'w2Gross'); bind('w2-c', 'c1099'); bind('w2-m', 'matchPct'); bind('w2-h', 'health'); bind('w2-r', 'idrRate');
    $('w2-cb').addEventListener('click', () => { cmp.cb.on = !cmp.cb.on; $('w2-cb').classList.toggle('on', cmp.cb.on); $('w2-cb-ctl').classList.toggle('hidden', !cmp.cb.on); S.setPref('w2cmp', cmp); draw(); });
    $('w2-age').addEventListener('change', () => { cmp.cb.age = Number($('w2-age').value); const mx = ENGINE.cbMaxByAge(cmp.cb.age); $('w2-cba').max = mx; cmp.cb.amount = null; $('w2-cba').value = mx; $('w2-cbav').textContent = F.money(mx); S.setPref('w2cmp', cmp); draw(); });
    $('w2-cba').addEventListener('input', () => { cmp.cb.amount = Number($('w2-cba').value); $('w2-cbav').textContent = F.money(cmp.cb.amount); draw(); });
    $('w2-cba').addEventListener('change', () => S.setPref('w2cmp', cmp));
    $('w2-hsa').addEventListener('click', () => { cmp.hsa = cmp.hsa ? 0 : PLAN.post.hsa.annual; $('w2-hsa').classList.toggle('on', !!cmp.hsa); S.setPref('w2cmp', cmp); draw(); });
    $('w2-reset').addEventListener('click', () => { S.setPref('w2cmp', undefined); APP.render(); });
    draw();
  }
};
