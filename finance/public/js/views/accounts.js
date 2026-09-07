// Accounts view — every account, live, plus the balance fail-safe (screenshots / manual entry).
VIEWS.accounts = {
  render(S) {
    const { ctx, d } = S; const t = ctx.totals;
    const simBy = Object.fromEntries(d.sims.sims.map(s => [s.acct.id, s]));
    const group = (title, list) => list.length ? `<tr class="group"><td colspan="6"><span class="eyebrow">${title}</span></td><td class="num" style="font-size:14px">${F.money(list.reduce((s, a) => s + a.balance, 0))}</td><td></td></tr>` + list.map(a => { const s = simBy[a.id]; return `<tr class="${a.isDebt && a.balance >= -0.005 && a.role !== 'display' ? 'dead' : ''}">
      <td><b>${F.esc(a.short)}</b>${a.override ? ` <span class="ovr" title="Manual balance from ${a.override.source}, feed shows ${F.money(a.feedBalance, true)}">${a.override.source}</span>` : ''}<span class="sub">${F.esc(a.title)}${a.number ? ' …' + F.esc(a.number) : ''}</span></td>
      <td class="small">${a.institution ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${a.colour || '#888'};margin-right:6px"></span>${F.esc(a.institution)}` : ''}</td>
      <td class="small muted">${F.esc(a.type)}</td>
      <td>${UI.chip(a.role === 'target' ? 'kill' : a.role === 'loan' ? 'sent' : a.role === 'cash' ? 'ok' : 'pending', a.role)}</td>
      <td class="num muted">${a.apr ? (a.apr * 100).toFixed(2) + '%' : '—'}</td>
      <td class="num muted">${a.balanceDate ? F.fmtDate(a.balanceDate, { year: false }) : '—'}</td>
      <td class="num ${a.balance < 0 ? 'neg' : a.balance > 0 ? 'pos' : 'muted'}">${F.money(a.balance, true)}${a.override ? `<span class="sub">feed ${F.money(a.feedBalance, true)}</span>` : ''}</td>
      <td class="small">${s ? (a.balance >= -0.005 ? UI.chip('done', 'clear') : s.deathDate ? `<span class="gold num">☠ ${F.fmtDate(s.deathDate, { year: false })}</span>` : `<span class="neg">short ${F.money(s.shortfall)}</span>`) : ''}</td></tr>`; }).join('') : '';
    const cash = ctx.accounts.filter(a => a.isCash), sav = ctx.accounts.filter(a => !a.isDebt && !a.isCash), cards = ctx.accounts.filter(a => a.isDebt && a.role !== 'loan'), loans = ctx.accounts.filter(a => a.role === 'loan');
    const ovList = ctx.accounts.filter(a => ctx.overrides[a.id]).map(a => { const o = ctx.overrides[a.id]; return `<tr><td><b>${F.esc(a.short)}</b><span class="sub">${F.esc(o.note || '')}</span></td><td class="num">${F.money(o.balance, true)}</td><td class="num muted">${F.fmtDate(o.asOf, { year: false })}</td><td class="small">${UI.chip('sent', o.source)}${a.override ? '' : '<span class="sub">feed is newer — not applied</span>'}</td><td class="right"><button class="btn sm" data-clear="${a.id}">Clear</button></td></tr>`; }).join('');
    const opts = ctx.accounts.map(a => `<option value="${a.id}">${F.esc(a.short)} · now ${F.money(a.balance, true)}</option>`).join('');
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
      <div class="note" style="margin-top:12px">Balances refresh from PocketSmith’s data feeds; the balance date shows when each feed last updated. APRs are the plan’s assumptions${UI.ast()} — confirm against statements, especially the loan rates.</div>

      <div class="grid g32" style="margin-top:22px">
        <div class="panel"><div class="ph"><h3>Update balances by hand</h3><span class="small muted">fail-safe when a feed lags or breaks</span></div>
          <div id="shot-panel" class="hidden">
            <div class="drop"><b class="ink2">Upload screenshots of your banking apps</b><br>Claude reads the balances and matches them to accounts. You review before anything is applied.<input type="file" id="shot-files" accept="image/*" multiple></div>
            <div style="display:flex;gap:10px;align-items:center;margin-top:10px"><button class="btn sm primary" id="shot-read" disabled>Read screenshots</button><span class="small muted" id="shot-status"></span></div>
            <div id="shot-review" style="margin-top:12px"></div>
            <div class="hr"></div>
          </div>
          <div id="shot-unavail" class="note hidden" style="margin-bottom:12px">Screenshot reading isn’t available in this view — type the balance instead.</div>
          <form class="form" id="manual-form">
            <label>Account<select id="m-acct">${opts}</select></label>
            <label>Balance<input class="num" id="m-bal" type="number" step="0.01" placeholder="-19497.07" required></label>
            <label>As of<input id="m-date" type="date" value="${ctx.today}" required></label>
            <button class="btn primary" type="submit">Save</button>
          </form>
          <div class="note" style="margin-top:10px">Enter what you owe on cards and loans as a <b>negative</b> number, checking as positive. A manual balance overrides the feed until the feed reports a newer date.</div>
        </div>
        <div class="panel flush"><div class="ph"><h3>Manual balances in effect</h3>${ovList ? '<button class="btn sm" data-clear="*">Clear all</button>' : ''}</div>
          <table><tbody>${ovList || '<tr><td class="muted center" style="padding:24px">None — every balance is from the PocketSmith feed</td></tr>'}</tbody></table></div>
      </div>`;
  },
  mount(S, root) {
    root.querySelectorAll('[data-clear]').forEach(b => b.addEventListener('click', () => APP.clearOverride(b.dataset.clear === '*' ? '*' : Number(b.dataset.clear))));
    root.querySelector('#manual-form').addEventListener('submit', e => {
      e.preventDefault();
      const id = Number(root.querySelector('#m-acct').value), balance = Number(root.querySelector('#m-bal').value), asOf = root.querySelector('#m-date').value;
      if (isNaN(balance)) return;
      APP.setOverrides([{ id, balance, asOf, source: 'manual' }]);
    });
    // Screenshot reading, only where the runtime can send images to Claude
    const V = window.VISION;
    (V ? V.available() : Promise.resolve(false)).then(ok => {
      root.querySelector('#shot-panel').classList.toggle('hidden', !ok);
      root.querySelector('#shot-unavail').classList.toggle('hidden', ok);
      if (!ok) return;
      const files = root.querySelector('#shot-files'), btn = root.querySelector('#shot-read'), status = root.querySelector('#shot-status'), review = root.querySelector('#shot-review');
      files.addEventListener('change', () => { btn.disabled = !files.files.length; status.textContent = files.files.length ? `${files.files.length} image${files.files.length > 1 ? 's' : ''} ready` : ''; });
      btn.addEventListener('click', async () => {
        btn.disabled = true; status.textContent = 'Reading… (10–40s)'; review.innerHTML = '';
        try {
          const found = await V.parse(files.files, S.ctx.accounts);
          if (!found.length) { status.textContent = 'No balances recognised. Try a clearer screenshot showing the account name and current balance.'; btn.disabled = false; return; }
          status.textContent = `${found.length} balance${found.length > 1 ? 's' : ''} found — review and apply`;
          review.innerHTML = `<table class="review"><thead><tr><th></th><th>Account</th><th class="num">Read</th><th class="num">Now</th><th>As of</th><th>Evidence</th></tr></thead><tbody>${found.map((f, i) => { const a = S.ctx.byId[f.id]; return `<tr><td><input type="checkbox" data-i="${i}" ${f.confidence >= 0.6 ? 'checked' : ''}></td><td><b>${a ? F.esc(a.short) : f.id}</b><span class="sub">${(f.confidence * 100).toFixed(0)}% confident</span></td><td class="num"><input type="number" step="0.01" value="${f.balance}" data-bal="${i}"></td><td class="num muted">${a ? F.money(a.balance, true) : ''}</td><td><input type="date" value="${f.asOf || S.ctx.today}" data-date="${i}" style="width:130px"></td><td class="small muted">${F.esc(f.evidence || '')}</td></tr>`; }).join('')}</tbody></table>
            <div style="margin-top:10px;display:flex;gap:10px"><button class="btn sm primary" id="shot-apply">Apply selected</button><button class="btn sm" id="shot-cancel">Discard</button></div>`;
          review.querySelector('#shot-cancel').addEventListener('click', () => { review.innerHTML = ''; status.textContent = ''; btn.disabled = false; });
          review.querySelector('#shot-apply').addEventListener('click', () => {
            const picks = [...review.querySelectorAll('input[type=checkbox]:checked')].map(cb => { const i = Number(cb.dataset.i); return { id: found[i].id, balance: Number(review.querySelector(`[data-bal="${i}"]`).value), asOf: review.querySelector(`[data-date="${i}"]`).value, source: 'screenshot', note: found[i].evidence }; }).filter(p => !isNaN(p.balance));
            if (picks.length) APP.setOverrides(picks);
          });
        } catch (err) {
          status.textContent = V.errorCopy ? V.errorCopy(err) : ('Could not read the screenshots: ' + (err.message || err.code || err));
          btn.disabled = false;
        }
      });
    });
  }
};
