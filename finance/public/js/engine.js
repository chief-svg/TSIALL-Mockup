// =====================================================================
//  ENGINE — pure functions over (PLAN, live PocketSmith data).
//  Nothing here touches the DOM.
// =====================================================================
window.ENGINE = (() => {
  const P = window.PLAN;

  // ---------------------------------------------------------------- accounts
  function buildAccounts(apiAccounts, overrides = {}) {
    return (apiAccounts || []).map(a => {
      const ov = overrides && overrides[a.id];
      const useOv = ov && typeof ov.balance === 'number' && (!a.current_balance_date || (ov.asOf || '') >= a.current_balance_date);
      const meta = P.accounts[a.id] || {};
      const type = a.type || '';
      const isDebt = /credit|loan|mortgage/.test(type) || (meta.role && ['target', 'straggler', 'display', 'loan'].includes(meta.role));
      const role = meta.role || (isDebt ? (/loan/.test(type) ? 'loan' : 'display') : /bank/.test(type) ? 'cash' : 'savings');
      const ta = a.primary_transaction_account || {};
      return {
        id: a.id,
        title: a.title,
        short: meta.short || a.title,
        label: meta.label || a.title,
        type,
        role,
        order: meta.order ?? 99,
        apr: meta.apr ?? null,
        payoffQuote: !!meta.payoffQuote,
        balance: useOv ? ov.balance : Number(a.current_balance || 0),
        balanceDate: useOv ? ov.asOf : a.current_balance_date,
        feedBalance: Number(a.current_balance || 0),
        feedDate: a.current_balance_date,
        override: useOv ? ov : null,
        institution: ta.institution ? ta.institution.title : '',
        colour: ta.institution ? ta.institution.colour : null,
        number: ta.number || '',
        isDebt,
        isCash: role === 'cash',
        isSavings: role === 'savings' || (!isDebt && role !== 'cash' && Number(a.current_balance || 0) > 0)
      };
    }).sort((x, y) => x.order - y.order || x.title.localeCompare(y.title));
  }

  function totals(accts) {
    const t = { debt: 0, cards: 0, loans: 0, cash: 0, savings: 0, net: 0 };
    for (const a of accts) {
      if (a.isDebt) { t.debt += Math.min(0, a.balance); (a.role === 'loan' ? (t.loans += Math.min(0, a.balance)) : (t.cards += Math.min(0, a.balance))); }
      else if (a.isCash) t.cash += a.balance;
      else t.savings += a.balance;
    }
    t.net = t.debt + t.cash + t.savings;
    return t;
  }

  // -------------------------------------------------------------- categories
  function indexCategories(tree) {
    const idx = {};
    const walk = (nodes, parent) => (nodes || []).forEach(c => {
      idx[c.id] = { id: c.id, title: c.title, colour: c.colour, parentId: parent ? parent.id : null, rootId: parent ? (idx[parent.id].rootId) : c.id, isTransfer: !!c.is_transfer, isBill: !!c.is_bill, refund: c.refund_behaviour, children: (c.children || []).map(k => k.id) };
      walk(c.children, c);
    });
    walk(tree, null);
    return idx;
  }

  // ---------------------------------------------------------------- classify
  const RX = {
    paymentPayee: /payment|pymt|thank you|autopay|ach pmt|epay|online pmt|mobile pmt/i,
    issuer: /american express|amex|citi|chase|sofi|wells|bank of america|bofa|capital one|discover|barclay|synchrony/i,
    interest: /interest charge|purchase interest|finance charge|interest on/i,
    fee: /annual fee|late fee|membership fee|returned payment fee|foreign transaction fee/i
  };
  function isBillPayee(payee) { return (P.billPayeePatterns || []).some(rx => rx.test(payee)); }

  // kinds: transfer | income | debt_payment_in | debt_payment_out | refund | interest | fee | bill | living
  function classify(tx, ctx) {
    const cat = tx.category ? ctx.catIndex[tx.category.id] : null;
    const acct = ctx.byId[tx.transaction_account && tx.transaction_account.account_id];
    const amt = Number(tx.amount);
    const payee = `${tx.payee || ''} ${tx.original_payee || ''} ${tx.memo || ''}`;
    const paymentCat = cat && /^(Payment|Card Paydown|Loan Payments|Car Payment)$/i.test(cat.title);

    if (tx.is_transfer || (cat && cat.isTransfer)) return 'transfer';

    if (acct && acct.isDebt) {
      if (amt > 0) return (paymentCat || RX.paymentPayee.test(payee)) ? 'debt_payment_in' : 'refund';
      if (RX.interest.test(payee)) return 'interest';
      if (RX.fee.test(payee) || (cat && cat.title === 'Bank Fees')) return 'fee';
      if (cat && cat.isBill) return 'bill';
      if (isBillPayee(payee)) return 'bill';
      return 'living';
    }
    // cash / checking / savings
    if (amt > 0) return 'income';
    if (cat && cat.isBill) return 'bill';
    if (paymentCat && (RX.issuer.test(payee) || RX.paymentPayee.test(payee))) return 'debt_payment_out';
    if (RX.issuer.test(payee) && RX.paymentPayee.test(payee)) return 'debt_payment_out';
    if (isBillPayee(payee)) return 'bill';
    if (cat && /^Payment$/i.test(cat.title)) return 'bill'; // generic "Payment" to a non-issuer from checking = a bill*
    return 'living';
  }

  function buildContext(data) {
    const accounts = buildAccounts(data.accounts, data.overrides || {});
    const byId = Object.fromEntries(accounts.map(a => [a.id, a]));
    const catIndex = indexCategories(data.categories);
    const ctx = { accounts, byId, catIndex, categories: data.categories || [], today: F.today(), events: data.events || [], snapshots: data.snapshots || {}, overrides: data.overrides || {} };
    ctx.txs = (data.transactions || []).map(t => ({ ...t, amount: Number(t.amount), kind: classify(t, ctx), acctId: t.transaction_account && t.transaction_account.account_id }))
      .sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
    ctx.totals = totals(accounts);
    return ctx;
  }

  // ---------------------------------------------------------------- spending
  const SPEND_KINDS = new Set(['living', 'bill', 'refund', 'interest', 'fee']);

  function spendingTree(ctx, from, to) {
    const sums = {}; // catId → {total, count, kinds}
    const add = (id, tx) => { const s = sums[id] || (sums[id] = { total: 0, count: 0, kinds: {}, txs: [] }); s.total += tx.amount; s.count++; s.kinds[tx.kind] = (s.kinds[tx.kind] || 0) + tx.amount; s.txs.push(tx); };
    for (const tx of ctx.txs) {
      if (tx.date < from || tx.date > to) continue;
      if (!SPEND_KINDS.has(tx.kind)) continue;
      add(tx.category ? tx.category.id : 'uncat', tx);
    }
    const node = (c) => {
      const own = sums[c.id] || { total: 0, count: 0, kinds: {}, txs: [] };
      const kids = (c.children || []).map(node);
      const total = own.total + kids.reduce((s, k) => s + k.total, 0);
      const count = own.count + kids.reduce((s, k) => s + k.count, 0);
      return { id: c.id, title: c.title, colour: c.colour, isBill: !!c.is_bill, isTransfer: !!c.is_transfer, own: own.total, total, count, kinds: own.kinds, children: kids.sort((a, b) => a.total - b.total), txs: own.txs };
    };
    const roots = ctx.categories.map(node);
    if (sums.uncat) roots.push({ id: 'uncat', title: 'Uncategorized', colour: '#6b7280', own: sums.uncat.total, total: sums.uncat.total, count: sums.uncat.count, kinds: sums.uncat.kinds, children: [], txs: sums.uncat.txs });
    const spend = roots.reduce((s, r) => s + Math.min(0, r.total), 0);
    return { roots: roots.sort((a, b) => a.total - b.total), spend, from, to };
  }

  function livingTracker(ctx, day = ctx.today) {
    const from = F.monthStart(day), to = F.monthEnd(day);
    const dim = F.daysInMonth(day), elapsed = F.parseISO(day).getDate();
    const per = P.living.perDay;
    const byDay = {};
    let actual = 0, pendingCount = 0, txCount = 0;
    const living = [];
    for (const tx of ctx.txs) {
      if (tx.date < from || tx.date > day) continue;
      const catIsBill = tx.category && ctx.catIndex[tx.category.id] && ctx.catIndex[tx.category.id].isBill;
      if (tx.kind === 'living' || (tx.kind === 'refund' && !catIsBill)) {
        actual += -tx.amount; txCount++; if (tx.status === 'pending') pendingCount++;
        byDay[tx.date] = (byDay[tx.date] || 0) + -tx.amount;
        living.push(tx);
      }
    }
    const budgetToDate = per * elapsed, budgetMonth = per * dim;
    const ratio = budgetToDate ? actual / budgetToDate : 0;
    const status = ratio <= P.living.amberAt ? 'green' : ratio <= P.living.redAt ? 'amber' : 'red';
    const daysLeft = dim - elapsed;
    const remaining = budgetMonth - actual;
    const series = []; let cum = 0;
    for (let d = 1; d <= dim; d++) {
      const iso = `${from.slice(0, 7)}-${String(d).padStart(2, '0')}`;
      if (iso <= day) { cum += byDay[iso] || 0; series.push({ date: iso, actual: cum, budget: per * d }); }
      else series.push({ date: iso, actual: null, budget: per * d });
    }
    // Largest merchants this month
    const byPayee = {};
    for (const tx of living) { const k = (tx.payee || '?').replace(/\s+/g, ' ').trim().slice(0, 28); byPayee[k] = (byPayee[k] || 0) + -tx.amount; }
    const topPayees = Object.entries(byPayee).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return { from, to, elapsed, dim, per, actual, budgetToDate, budgetMonth, ratio, status, daysLeft, remaining, perDayLeft: daysLeft > 0 ? remaining / daysLeft : 0, series, txCount, pendingCount, topPayees, txs: living };
  }

  // ------------------------------------------------------------ month ledger
  function within(a, b, pct) { return Math.abs(Math.abs(a) - Math.abs(b)) <= Math.abs(b) * pct; }
  function dateInWindow(d, target, days) { return Math.abs(F.daysBetween(d, target)) <= days; }
  function clampDay(monthISO, day) { const dim = F.daysInMonth(monthISO + '-01'); return `${monthISO}-${String(Math.min(day, dim)).padStart(2, '0')}`; }

  function monthLedger(ctx, day = ctx.today) {
    const ym = day.slice(0, 7);
    const chk = ctx.txs.filter(t => t.acctId === P.checkingId);
    const { days, pct } = P.match;
    const stat = (expected, matched) => matched ? 'paid' : F.daysBetween(expected, day) > days ? 'overdue' : F.daysBetween(day, expected) <= 3 ? 'due' : 'upcoming';

    const bills = P.bills.filter(b => !b.endsAfter || ym + '-01' <= b.endsAfter).map(b => {
      const expected = clampDay(ym, b.day);
      const candidates = chk.filter(t => t.amount < 0 && within(t.amount, b.amount, pct) && dateInWindow(t.date, expected, days));
      const tx = candidates.find(t => b.payee && b.payee.test(`${t.payee} ${t.original_payee}`)) || candidates.find(t => t.category && t.category.title === b.category) || candidates[0] || null;
      return { ...b, expected, tx, status: stat(expected, tx), actual: tx ? -tx.amount : null };
    });

    const incomes = P.income.map(i => ({ ...i, expected: clampDay(ym, i.day) }))
      .concat(P.oneTimeIncome.filter(o => o.date.slice(0, 7) === ym).map(o => ({ ...o, expected: o.date, day: Number(o.date.slice(8)) })))
      .map(i => {
        const tx = chk.find(t => t.kind === 'income' && within(t.amount, i.amount, pct) && dateInWindow(t.date, i.expected, days)) || null;
        return { ...i, tx, status: tx ? 'received' : F.daysBetween(i.expected, day) > days ? 'late' : F.daysBetween(day, i.expected) <= 3 ? 'due' : 'upcoming', actual: tx ? tx.amount : null };
      }).sort((a, b) => a.expected < b.expected ? -1 : 1);

    // Unplanned income this month (not matched to a plan line)
    const matchedIds = new Set(incomes.filter(i => i.tx).map(i => i.tx.id));
    const otherIncome = chk.filter(t => t.kind === 'income' && t.date.slice(0, 7) === ym && !matchedIds.has(t.id));

    const debtOut = chk.filter(t => t.kind === 'debt_payment_out' && t.date.slice(0, 7) === ym);
    return { ym, bills, incomes, otherIncome, debtOut,
      billsExpected: bills.reduce((s, b) => s + b.amount, 0), billsPaid: bills.reduce((s, b) => s + (b.actual || 0), 0),
      incomeExpected: incomes.reduce((s, i) => s + i.amount, 0), incomeReceived: incomes.reduce((s, i) => s + (i.actual || 0), 0) + otherIncome.reduce((s, t) => s + t.amount, 0),
      debtOutTotal: debtOut.reduce((s, t) => s + -t.amount, 0) };
  }

  // ----------------------------------------------------------------- payoff
  function matchPayment(item, ctx) {
    const { days, pct } = P.match;
    const today = ctx.today;
    if (!item.account) {
      return { status: today > F.addDays(item.date, days) ? 'review' : today >= item.date ? 'due' : 'pending', tx: null, matched: 0 };
    }
    const acct = ctx.byId[item.account];
    const credits = ctx.txs.filter(t => t.acctId === item.account && t.amount > 0 && (t.kind === 'debt_payment_in' || (acct && acct.role === 'loan')) && dateInWindow(t.date, item.date, days));
    const exact = credits.find(t => within(t.amount, item.amount, pct));
    if (exact) return { status: 'done', tx: exact, matched: exact.amount };
    const sum = credits.reduce((s, t) => s + t.amount, 0);
    if (credits.length > 1 && sum >= item.amount * (1 - pct)) return { status: 'done', tx: credits[0], matched: sum, multi: credits.length };
    // Payment left checking but hasn't posted on the target yet
    const sent = ctx.txs.find(t => t.acctId === P.checkingId && t.amount < 0 && within(t.amount, item.amount, pct) && dateInWindow(t.date, item.date, days) && t.kind !== 'income' && (RX.issuer.test(`${t.payee} ${t.original_payee}`) || t.kind === 'debt_payment_out' || t.kind === 'bill'));
    if (sent) return { status: 'sent', tx: sent, matched: -sent.amount };
    if (today > F.addDays(item.date, days)) return { status: 'missed', tx: null, matched: 0 };
    if (F.daysBetween(today, item.date) <= 3) return { status: 'due', tx: null, matched: 0 };
    return { status: 'pending', tx: null, matched: 0 };
  }

  function schedule(ctx) {
    const items = P.payments.map((p, i) => ({ ...p, idx: i, acct: p.account ? ctx.byId[p.account] : null, ...matchPayment(p, ctx) }));
    const groups = [];
    for (const it of items) {
      let g = groups.find(x => x.date === it.date);
      if (!g) { g = { date: it.date, items: [], total: 0, done: 0 }; groups.push(g); }
      g.items.push(it); g.total += it.amount; if (it.status === 'done') g.done += it.amount;
    }
    for (const g of groups) {
      const st = g.items.map(i => i.status);
      g.status = st.every(s => s === 'done') ? 'done' : st.some(s => s === 'missed') ? 'missed' : st.some(s => s === 'sent') ? 'sent' : st.some(s => s === 'due') ? 'due' : st.some(s => s === 'review') ? 'review' : 'pending';
      g.kills = g.items.filter(i => i.kill && i.acct).map(i => i.acct.short);
      g.daysUntil = F.daysBetween(ctx.today, g.date);
    }
    const next = groups.find(g => g.status !== 'done' && g.date >= ctx.today) || groups.find(g => g.status !== 'done') || null;
    const planned = items.reduce((s, i) => s + i.amount, 0);
    const completed = items.filter(i => i.status === 'done').reduce((s, i) => s + i.matched, 0);
    return { items, groups, next, planned, completed };
  }

  // Interest-aware forward simulation of one debt account against its planned
  // payments (+ recurring bill payments that hit loans). Assumes no new charges*
  // and daily compounding at the configured APR*.
  function simulateAccount(acct, sched, ctx, ledger, horizon = '2027-01-31') {
    const start = Math.max(0, -acct.balance);
    let bal = start;
    const path = [{ date: ctx.today, balance: bal }];
    const mine = sched.items.filter(i => i.account === acct.id && i.status !== 'done' && i.status !== 'missed' && (i.date >= ctx.today || i.status === 'sent'));
    const byDate = {};
    for (const i of mine) byDate[i.date] = (byDate[i.date] || 0) + i.amount;
    // Recurring bills that pay down this account (car, SoFi) until they end
    for (const b of P.bills.filter(b => b.account === acct.id)) {
      for (let k = 0; k < 6; k++) {
        const m = new Date(F.parseISO(ctx.today).getFullYear(), F.parseISO(ctx.today).getMonth() + k, 1);
        const ym = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
        if (b.endsAfter && ym + '-01' > b.endsAfter) break;
        const d = clampDay(ym, b.day);
        const paidThisMonth = ledger && ledger.ym === ym && ledger.bills.find(x => x.label === b.label && x.tx);
        if (d >= ctx.today && !paidThisMonth) byDate[d] = (byDate[d] || 0) + b.amount;
      }
    }
    const planned = Object.values(byDate).reduce((s, v) => s + v, 0);
    if (bal <= 0.005) return { acct, start, deathDate: 'paid', residual: 0, shortfall: 0, overpay: 0, interest: 0, path, alreadyDead: true, planned, lastPay: null };
    const r = (acct.apr || 0) / 365;
    let interest = 0, deathDate = null, overpay = 0, d = ctx.today;
    const dates = Object.keys(byDate).sort();
    const lastPay = dates.length ? dates[dates.length - 1] : null;
    while (d <= horizon) {
      const acc = bal * r; interest += acc; bal += acc;
      if (byDate[d]) {
        bal -= byDate[d]; path.push({ date: d, balance: Math.max(0, bal), payment: byDate[d] });
        if (bal <= 0) { deathDate = d; overpay = -bal; bal = 0; break; }
      }
      d = F.addDays(d, 1);
    }
    // Residual after the last planned payment. A small tail (≤ 2% of today's
    // balance, or ≤ $250) is an interest true-up, not a plan failure*.
    const residual = deathDate ? 0 : bal;
    return { acct, start, deathDate, tail: false, residual, shortfall: residual, overpay, interest, path, lastPay, planned };
  }

  function simulateAll(ctx, sched, ledger) {
    const debts = ctx.accounts.filter(a => a.isDebt && (a.balance < 0 || ['target', 'straggler', 'loan'].includes(a.role)));
    const sims = debts.map(a => simulateAccount(a, sched, ctx, ledger));
    // Card residuals after their last planned payment are interest tails; the
    // Dec 15 buffer sweeps them (smallest first). Anything past the buffer is a
    // genuine shortfall that needs a bigger payment*.
    const buffer = P.payments.find(p => !p.account);
    let left = buffer ? buffer.amount : 0;
    for (const s of sims.filter(s => s.acct.role !== 'loan' && s.residual > 0).sort((a, b) => a.residual - b.residual)) {
      if (s.residual <= left) { left -= s.residual; s.tail = true; s.shortfall = 0; s.deathDate = s.lastPay; s.sweptBy = buffer ? buffer.date : null; }
      else { s.tail = false; s.shortfall = s.residual; s.deathDate = null; }
    }
    for (const s of sims.filter(s => s.acct.role === 'loan' && s.residual > 0)) { s.tail = false; s.shortfall = s.residual; s.deathDate = null; }
    const tails = sims.reduce((s, x) => s + (x.tail ? x.residual : 0), 0);
    const allDead = sims.every(s => s.deathDate);
    const debtFree = allDead ? sims.map(s => s.deathDate).filter(d => d && d !== 'paid').sort().pop() || ctx.today : null;
    return { sims, debtFree, totalShortfall: sims.reduce((s, x) => s + x.shortfall, 0), totalOverpay: sims.reduce((s, x) => s + x.overpay, 0), totalInterest: sims.reduce((s, x) => s + x.interest, 0), tails, bufferLeft: left, bufferDate: buffer ? buffer.date : null, bufferAmount: buffer ? buffer.amount : 0 };
  }

  // Cash sufficiency for each upcoming payment date (checking-only model*)
  function fundsCheck(ctx, sched, ledger) {
    const chk = ctx.byId[P.checkingId];
    let cash = chk ? chk.balance : 0;
    const out = [];
    const today = ctx.today;
    const upcoming = sched.groups.filter(g => g.status !== 'done' && g.date >= today);
    let cursor = today;
    for (const g of upcoming) {
      const inc = expectedFlows(ctx, ledger, cursor, g.date);
      cash += inc.income - inc.bills - inc.living;
      const need = g.items.filter(i => i.status !== 'done').reduce((s, i) => s + i.amount, 0);
      out.push({ date: g.date, income: inc.income, bills: inc.bills, living: inc.living, available: cash, need, ok: cash - need >= 0, gap: cash - need });
      cash -= need;
      cursor = F.addDays(g.date, 1);
      if (out.length >= 6) break;
    }
    return out;
  }
  // Expected (still unmatched) income, bills and living between two dates, inclusive.
  function expectedFlows(ctx, ledger, from, to) {
    let income = 0, bills = 0;
    const months = new Set([from.slice(0, 7), to.slice(0, 7)]);
    for (const ym of months) {
      for (const i of P.income) { const d = clampDay(ym, i.day); if (d >= from && d <= to && !(ledger.ym === ym && ledger.incomes.find(x => x.day === i.day && x.tx && !x.date))) income += i.amount; }
      for (const o of P.oneTimeIncome) { if (o.date >= from && o.date <= to && !(ledger.ym === ym && ledger.incomes.find(x => x.date === o.date && x.tx))) income += o.amount; }
      for (const b of P.bills) { const d = clampDay(ym, b.day); if (b.endsAfter && ym + '-01' > b.endsAfter) continue; if (d >= from && d <= to && !(ledger.ym === ym && ledger.bills.find(x => x.label === b.label && x.tx))) bills += b.amount; }
    }
    // Only count strictly future days for living (today's spend is already reflected in the balance*)
    const days = Math.max(0, F.daysBetween(from, to));
    return { income, bills, living: days * P.living.perDay };
  }

  // ------------------------------------------------------------- near term
  // Day-by-day path of total debt and checking for the next N days: interest
  // accrues daily*, planned payments and loan bills step debt down, paychecks
  // step cash up, bills and $150/day living step cash down.
  function nearTerm(ctx, sched, ledger, days = 42) {
    const today = ctx.today, end = F.addDays(today, days);
    const debts = ctx.accounts.filter(a => a.isDebt && a.balance < 0);
    const bal = Object.fromEntries(debts.map(a => [a.id, -a.balance]));
    const apr = Object.fromEntries(debts.map(a => [a.id, (a.apr || 0) / 365]));
    const chk = ctx.byId[P.checkingId];
    let cash = chk ? chk.balance : 0;
    const onDate = {}; // date → { pay: [{account, amount, label, kill}], income: [{amount, label}], bills: [{amount, label, account}] }
    const slot = d => onDate[d] || (onDate[d] = { pay: [], income: [], bills: [] });
    for (const i of sched.items) {
      if (i.status === 'done' || i.status === 'missed' || i.date < today || i.date > end) continue;
      if (i.status === 'sent') continue; // already left checking; posts on the card shortly
      slot(i.date).pay.push({ account: i.account, amount: i.amount, label: i.acct ? i.acct.short : 'buffer', kill: !!i.kill });
    }
    const months = new Set(); for (let d = today; d <= end; d = F.addDays(d, 1)) months.add(d.slice(0, 7));
    for (const ym of months) {
      const cur = ledger && ledger.ym === ym;
      for (const inc of P.income) { const d = clampDay(ym, inc.day); if (d < today || d > end) continue; if (cur && ledger.incomes.find(x => x.day === inc.day && !x.date && x.tx)) continue; slot(d).income.push({ amount: inc.amount, label: inc.label }); }
      for (const o of P.oneTimeIncome) { if (o.date.slice(0, 7) !== ym || o.date < today || o.date > end) continue; if (cur && ledger.incomes.find(x => x.date === o.date && x.tx)) continue; slot(o.date).income.push({ amount: o.amount, label: o.label }); }
      for (const b of P.bills) { if (b.endsAfter && ym + '-01' > b.endsAfter) continue; const d = clampDay(ym, b.day); if (d < today || d > end) continue; if (cur && ledger.bills.find(x => x.label === b.label && x.tx)) continue; slot(d).bills.push({ amount: b.amount, label: b.label, account: b.account || null }); }
    }
    const series = [], events = [];
    for (let d = today, k = 0; d <= end; d = F.addDays(d, 1), k++) {
      if (k > 0) { for (const id in bal) bal[id] += bal[id] * apr[id]; cash -= P.living.perDay; }
      const s = onDate[d];
      if (s) {
        for (const i of s.income) cash += i.amount;
        for (const b of s.bills) { cash -= b.amount; if (b.account && bal[b.account] != null) bal[b.account] = Math.max(0, bal[b.account] - b.amount); }
        for (const p of s.pay) { cash -= p.amount; if (p.account && bal[p.account] != null) bal[p.account] = Math.max(0, bal[p.account] - p.amount); }
        if (s.pay.length || s.income.length) events.push({ date: d, x: k, pay: s.pay.reduce((a, p) => a + p.amount, 0), income: s.income.reduce((a, i) => a + i.amount, 0), targets: [...new Set(s.pay.map(p => p.label))], kills: s.pay.filter(p => p.kill).map(p => p.label) });
      }
      series.push({ date: d, x: k, debt: -Object.values(bal).reduce((a, b) => a + b, 0), cash });
    }
    const live = Object.entries(ctx.snapshots || {}).filter(([d]) => d >= today && d <= end).map(([d, v]) => ({ date: d, x: F.daysBetween(today, d), debt: v.debt, cash: v.cash }));
    const minCash = Math.min(...series.map(s => s.cash));
    return { series, events, live, start: series[0], end: series[series.length - 1], minCash, minCashDate: (series.find(s => s.cash === minCash) || {}).date, days };
  }

  // -------------------------------------------------------------- snapshots
  // One point per day of live totals; persisted by the app via STORE.
  function recordSnapshot(ctx, snapshots) {
    const s = { ...(snapshots || ctx.snapshots || {}) };
    s[ctx.today] = { debt: ctx.totals.debt, cash: ctx.totals.cash, savings: ctx.totals.savings, net: ctx.totals.net, at: Date.now() };
    return s;
  }

  function projectionSeries(ctx) {
    const x0 = P.planStart;
    const pts = P.projection.map(p => ({ ...p, x: F.daysBetween(x0, p.date), net: p.debt + p.savings }));
    const snaps = ctx.snapshots || {};
    const live = Object.entries(snaps).sort().map(([date, v]) => ({ date, x: F.daysBetween(x0, date), debt: v.debt, savings: v.savings + v.cash, net: v.net }));
    // Plan-vs-reality: interpolate the plan debt at today
    const tx = F.daysBetween(x0, ctx.today);
    let planToday = null;
    for (let i = 1; i < pts.length; i++) {
      if (tx >= pts[i - 1].x && tx <= pts[i].x) { const f = (tx - pts[i - 1].x) / (pts[i].x - pts[i - 1].x || 1); planToday = pts[i - 1].debt + f * (pts[i].debt - pts[i - 1].debt); break; }
    }
    if (planToday == null) planToday = tx < 0 ? pts[0].debt : 0;
    const crossing = pts.find(p => p.net >= 0 && p.date > x0);
    return { pts, live, planToday, drift: ctx.totals.debt - planToday, crossing, xToday: tx };
  }

  // ------------------------------------------------------------ post payoff
  function allocationTable(opts = {}) {
    const post = P.post;
    const hsaOn = opts.hsaOn ?? post.hsa.defaultOn;
    const efStart = opts.efStart ?? 0; // live savings balances counted toward the EF
    const buffer = 13000;              // Dec ’26 cash buffer from the projection*
    let ef = efStart + (opts.includeBuffer === false ? 0 : buffer);
    const rows = [];
    const [sy, sm] = post.startMonth.split('-').map(Number);
    let rothYTD = 0, hsaYTD = 0;
    for (let k = 0; k < 12; k++) {
      const m = new Date(sy, sm - 1 + k, 1);
      const ym = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      let cash = post.monthlyCapacity;
      const toEF = Math.min(Math.max(0, post.emergencyFund.target - ef), cash); ef += toEF; cash -= toEF;
      const efDone = ef >= post.emergencyFund.target - 0.5;
      const roth = efDone ? Math.min(post.roth.monthly, cash, Math.max(0, post.roth.annualEach * 2 - rothYTD)) : 0; rothYTD += roth; cash -= roth;
      const hsa = efDone && hsaOn ? Math.min(post.hsa.monthly, cash, Math.max(0, post.hsa.annual - hsaYTD)) : 0; hsaYTD += hsa; cash -= hsa;
      const brokerage = Math.max(0, cash);
      const sabino401k = ym >= post.sabino401k.eligibleDate.slice(0, 7) ? post.sabino401k.annual / (12 - (Number(post.sabino401k.eligibleDate.slice(5, 7)) - 1)) : 0;
      rows.push({ ym, toEF, ef, efDone, roth, hsa, brokerage, sabino401k, jessica401k: post.jessica401k.annual / 12 });
    }
    const rothMonthsLeft = rows.filter(r => r.efDone).length;
    return { rows, hsaOn, efStart, rothCatchUp: rothMonthsLeft ? (post.roth.annualEach * 2) / rothMonthsLeft : null, efCompleteMonth: (rows.find(r => r.efDone) || {}).ym || null };
  }

  // ----------------------------------------------------------------- $1M path
  function millionPath(opts = {}) {
    const M = { ...P.million, ...opts };
    const post = P.post;
    const rows = [];
    // Phase 1: debt payoff months (Sep–Dec ’26) follow the projection table
    for (const p of P.projection.slice(1, 5)) rows.push({ ym: p.date.slice(0, 7), debt: p.debt, cash: p.savings, invested: 0, retirement: 0, total: p.debt + p.savings, contrib: 0 });
    let cash = 13000, invested = M.startingInvested || 0, retirement = 0;
    const rm = M.annualReturn / 12, cy = M.cashYield / 12;
    const jess = M.include401k ? post.jessica401k.annual / 12 : 0;
    const matchM = (M.employerMatchAnnual || 0) / 12;
    let crossed = null; const milestones = {};
    for (let k = 0; k < 240; k++) {
      const m = new Date(2027, k, 1);
      const ym = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      // growth first
      cash *= 1 + cy; invested *= 1 + rm; retirement *= 1 + rm;
      // contributions
      let c = M.monthlyCash;
      const toEF = Math.min(Math.max(0, post.emergencyFund.target - cash), c); cash += toEF; c -= toEF;
      invested += c;
      let sab = 0;
      if (M.include401k && ym >= post.sabino401k.eligibleDate.slice(0, 7)) {
        const y = m.getFullYear();
        sab = y === 2027 ? post.sabino401k.annual / (12 - (Number(post.sabino401k.eligibleDate.slice(5, 7)) - 1)) : post.sabino401k.annual / 12;
      }
      retirement += jess + sab + matchM;
      const total = cash + invested + retirement;
      const row = { ym, debt: 0, cash, invested, retirement, total, contrib: M.monthlyCash + jess + sab + matchM };
      rows.push(row);
      for (const ms of [100000, 250000, 500000, 750000, 1000000]) if (!milestones[ms] && total >= ms) milestones[ms] = ym;
      if (!crossed && total >= M.target) { crossed = ym; }
      if (crossed && rows.length > 40 && total >= M.target * 1.15) break;
    }
    return { rows, crossed, milestones, opts: M, monthsFromNow: crossed ? monthsBetween(F.today().slice(0, 7), crossed) : null };
  }
  function monthsBetween(a, b) { const [ay, am] = a.split('-').map(Number), [by, bm] = b.split('-').map(Number); return (by - ay) * 12 + (bm - am); }

  function millionSensitivity(base = {}) {
    const returns = [0, 0.04, 0.06, 0.08];
    const cashes = [25000, 28000, P.million.monthlyCash, 35000];
    return returns.map(r => ({ r, cells: cashes.map(c => ({ c, crossed: millionPath({ ...base, annualReturn: r, monthlyCash: c }).crossed })) }));
  }

  return { buildAccounts, totals, buildContext, classify, spendingTree, livingTracker, monthLedger, schedule, matchPayment, simulateAccount, simulateAll, fundsCheck, nearTerm, recordSnapshot, projectionSeries, allocationTable, millionPath, millionSensitivity, monthsBetween };
})();
