// =====================================================================
//  PLAN — every constant the app reasons about lives here.
//  True these up as real numbers land. Live PocketSmith balances are
//  always displayed as truth; these are targets / assumptions (*).
// =====================================================================
window.PLAN = {
  userId: 882138,
  owner: 'Sabino',
  planStart: '2026-09-07',           // total debt $120,561.66 on this date
  debtFreeDate: '2026-12-27',        // 🏁 planned
  startingDebt: -120561.66,
  // Balances on planStart (from the PocketSmith feed that day) — the death-board bars measure against these
  startingBalances: { 5486598: 1025.72, 5486658: -19497.07, 5486668: -10801.51, 5486678: -16718.31, 5486683: -18998.69, 5486653: -17119.14, 5486703: -12962.08, 5486673: -180.00, 5486688: -29.99, 5486693: 0, 5486593: 0, 5486708: -13736.53, 5486718: -10518.34 },

  // ---- Accounts: PocketSmith container ids → role in the plan -------------
  checkingId: 5486598,
  accounts: {
    5486598: { short: 'BofA Checking',        role: 'cash',      label: 'BofA Adv Plus Banking', order: 0 },
    5486658: { short: 'Citi 3208',            role: 'target',    label: 'Citi AAdvantage Platinum Select …3208', apr: 0.2949, order: 1 },
    5486668: { short: 'Amex Plat',            role: 'target',    label: 'Amex Platinum (personal) …1001',        apr: 0.292,  order: 2 },
    5486678: { short: 'Amex Biz Plat',        role: 'target',    label: 'Amex Business Platinum …1007',          apr: 0.292,  order: 3 },
    5486683: { short: 'Amex Biz Gold',        role: 'target',    label: 'Amex Business Gold …1000',              apr: 0.292,  order: 4 },
    5486653: { short: 'Citi 8018',            role: 'target',    label: 'Citi AAdvantage Executive …8018',       apr: 0.2849, order: 5 },
    5486703: { short: 'Chase Sapphire',       role: 'target',    label: 'Chase Sapphire Preferred …0011',        apr: 0.2574, order: 6 },
    5486673: { short: 'Amex Add’l Gold',      role: 'straggler', label: 'Amex Additional Gold …1016',            apr: 0.292,  order: 7 },
    5486688: { short: 'Amex Blue Cash 1002',  role: 'straggler', label: 'Amex Blue Cash …1002',                  apr: 0.292,  order: 8 },
    5486693: { short: 'Amex Blue Cash 2011',  role: 'display',   label: 'Amex Blue Cash …2011',                  apr: 0.292,  order: 9 },
    5486593: { short: 'BofA Card 8598',       role: 'display',   label: 'BankAmericard …8598',                   apr: 0.25,   order: 10 },
    5486708: { short: 'SoFi Loan',            role: 'loan',      label: 'SoFi Personal Loan',                    apr: 0.12,   order: 11, payoffQuote: true },
    5486718: { short: 'WF Auto Loan',         role: 'loan',      label: 'Wells Fargo Auto Loan …7205',           apr: 0.07,   order: 12, payoffQuote: true }
  },

  // ---- Recurring income (net-pay estimates*) ------------------------------
  income: [
    { day: 15, amount: 8800,  label: 'Jessica paycheck (mid-month)*' },
    { day: 27, amount: 26000, label: 'Sabino paycheck*' },
    { day: 30, amount: 8800,  label: 'Jessica paycheck (month-end)*' }
  ],
  oneTimeIncome: [
    { date: '2026-09-27', amount: 10000, label: 'Relocation reimbursement (one-time)' }
  ],

  // ---- Bills --------------------------------------------------------------
  // payee: regex used to find the real transaction on checking (±5d, ±15%).
  bills: [
    { day: 1,  amount: 6850, label: 'Rent',                 category: 'Rent',          payee: /rent|apartment|apt|property|realty|leasing|zelle/i },
    { day: 8,  amount: 610,  label: 'Car payment (WF)',     category: 'Car Payment',   payee: /wells|wf |auto/i,  endsAfter: '2026-12-31', account: 5486718 },
    { day: 20, amount: 800,  label: 'SoFi loan payment',    category: 'Loan Payments', payee: /sofi/i,            endsAfter: '2026-12-31', account: 5486708 },
    { day: 28, amount: 750,  label: 'Student loan',         category: 'Loan Payments', payee: /nelnet|mohela|aidvantage|navient|student|edfinancial|dept of ed|great lakes/i }
  ],
  // Checking debits with these payees are bills, not living, even if PocketSmith
  // has them in a generic category (*: e.g. insurance premium tagged "Payment").
  billPayeePatterns: [/standard ins/i, /insurance/i],

  // ---- Living allowance ---------------------------------------------------
  living: { perDay: 150, amberAt: 1.0, redAt: 1.15 },

  // ---- Payment matching tolerance ----------------------------------------
  match: { days: 5, pct: 0.15 },

  // ---- Payoff schedule (line items; grouped by date in the UI) ------------
  // amount = planned payment INTO the account. Includes est. accrued interest*.
  payments: [
    { date: '2026-09-15', account: 5486658, amount: 5500,  note: 'Sized to Jessica’s check; leaves room for living + SoFi' },

    { date: '2026-09-27', account: 5486658, amount: 14200, kill: true,  note: 'PAYOFF — Citi 3208 (incl. est. interest*)' },
    { date: '2026-09-27', account: 5486668, amount: 10900, kill: true,  note: 'PAYOFF — Amex personal Platinum (incl. est. interest*)' },
    { date: '2026-09-27', account: 5486678, amount: 1400,               note: 'Spillover from the $26,500 (paycheck + reimbursement)' },
    { date: '2026-09-27', account: 5486673, amount: 180,   kill: true,  note: 'Straggler cleared' },
    { date: '2026-09-27', account: 5486688, amount: 30,    kill: true,  note: 'Straggler cleared' },

    { date: '2026-09-30', account: 5486678, amount: 8000,               note: 'Month-end check → Biz Plat' },
    { date: '2026-10-15', account: 5486678, amount: 5500,               note: '' },
    { date: '2026-10-27', account: 5486678, amount: 2100,  kill: true,  note: 'PAYOFF — Amex Biz Plat' },
    { date: '2026-10-27', account: 5486683, amount: 14400,              note: 'Remainder of the $16,500 → Biz Gold' },
    { date: '2026-10-30', account: 5486683, amount: 5000,  kill: true,  note: 'PAYOFF — Amex Biz Gold' },
    { date: '2026-10-30', account: 5486653, amount: 3000,               note: 'Remainder of the $8,000 → Citi 8018' },
    { date: '2026-11-15', account: 5486653, amount: 5500,               note: '' },
    { date: '2026-11-27', account: 5486653, amount: 8900,  kill: true,  note: 'PAYOFF — Citi 8018' },
    { date: '2026-11-27', account: 5486703, amount: 7600,               note: 'Remainder of the $16,500 → Sapphire' },
    { date: '2026-11-30', account: 5486703, amount: 5800,  kill: true,  note: 'PAYOFF — Chase Sapphire. ALL CARDS DEAD. (Nov trimmed to fit)' },

    { date: '2026-12-15', account: null,    amount: 2000,               note: 'Interest true-up buffer* — apply to whichever card shows residual interest' },
    { date: '2026-12-27', account: 5486708, amount: 11100, kill: true,  note: 'PAYOFF — SoFi (~$11,100*). Request official payoff quote w/ per-diem.' },
    { date: '2026-12-27', account: 5486718, amount: 8900,  kill: true,  note: 'PAYOFF — Wells Fargo auto (~$8,900*). Request official payoff quote w/ per-diem.' }
  ],

  // Monthly rhythm shown as a reminder strip
  rhythm: [
    { day: 15, amount: 5500,  from: 'Jessica mid-month check' },
    { day: 27, amount: 16500, from: 'Sabino check' },
    { day: 30, amount: 8000,  from: 'Jessica month-end check' }
  ],

  // ---- Post-payoff (from Jan 2027) ----------------------------------------
  post: {
    startMonth: '2027-01',
    monthlyCapacity: 31400,
    byDay: [{ day: 15, amount: 8000 }, { day: 27, amount: 15400 }, { day: 30, amount: 8000 }],
    postDebtBurn: 12200,               // rent + living + student loan + misc*
    emergencyFund: { target: 63000, months: 6, note: 'HYSA — one-time fill from Jan + Feb 2027 cash flow*' },
    roth: { monthly: 1250, annualEach: 7500, note: 'Backdoor route only (filing MFS). Pro-rata caveat if either spouse holds pre-tax IRA money*' },
    hsa: { monthly: 729, annual: 8750, defaultOn: false, note: 'Only if the HDHP option is chosen*' },
    jessica401k: { annual: 24500, note: 'Payroll-side, not from this cash flow — if eligible*' },
    sabino401k: { eligibleDate: '2027-07-01', annual: 24500, note: 'Eligibility ~mid-2027*; front-load $24,500 across remaining paychecks' },
    brokerage: { note: 'Everything remaining (~$25–29k/mo from March)' }
  },

  // ---- Projection table (month-end, USD). Conservative: excludes 401(k)s,
  //      employer match, market growth.* --------------------------------------
  projection: [
    { label: 'Now',     date: '2026-09-07', debt: -120562, savings: 0 },
    { label: 'Sep ’26', date: '2026-09-30', debt: -81600,  savings: 0 },
    { label: 'Oct ’26', date: '2026-10-31', debt: -51400,  savings: 0 },
    { label: 'Nov ’26', date: '2026-11-30', debt: -21000,  savings: 0 },
    { label: 'Dec ’26', date: '2026-12-31', debt: 0,       savings: 13000, note: 'cash buffer' },
    { label: 'Jan ’27', date: '2027-01-31', debt: 0,       savings: 44400 },
    { label: 'Feb ’27', date: '2027-02-28', debt: 0,       savings: 75800 },
    { label: 'Mar ’27', date: '2027-03-31', debt: 0,       savings: 107200 },
    { label: 'Apr ’27', date: '2027-04-30', debt: 0,       savings: 138600 },
    { label: 'May ’27', date: '2027-05-31', debt: 0,       savings: 170000 },
    { label: 'Jun ’27', date: '2027-06-30', debt: 0,       savings: 201400 },
    { label: 'Jul ’27', date: '2027-07-31', debt: 0,       savings: 232800 },
    { label: 'Aug ’27', date: '2027-08-31', debt: 0,       savings: 264200 },
    { label: 'Sep ’27', date: '2027-09-30', debt: 0,       savings: 295600 }
  ],

  // ---- The $1M objective ---------------------------------------------------
  million: {
    target: 1000000,
    // Levers (defaults; adjustable in the UI, persisted locally)
    monthlyCash: 31400,            // from post.monthlyCapacity
    include401k: true,             // Jessica $24.5k/yr from Jan ’27 + Sabino $24.5k/yr from Jul ’27, both payroll-side*
    employerMatchAnnual: 0,        // unknown — set when known*
    annualReturn: 0.06,            // blended nominal return on invested balances*
    cashYield: 0.04,               // HYSA yield on the emergency fund*
    startingInvested: 0
  }
};
