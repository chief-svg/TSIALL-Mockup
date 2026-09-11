// =====================================================================
//  PLAN — every constant the app reasons about lives here.
//  True these up as real numbers land. Live PocketSmith balances are
//  always displayed as truth; these are targets / assumptions (*).
// =====================================================================
window.PLAN = {
  userId: 882138,
  owner: 'Sabino',
  planStart: '2026-09-07',           // total debt $120,561.66 on this date
  debtFreeDate: '2027-02-27',        // 🏁 planned: interest-bearing debt gone Jan 27; the 0% Discover balance cleared Feb 27 (promo runs to 2027-07-17)
  startingDebt: -143574.16,          // cards + loans $120,561.66 at plan start + IRS $15,194.56 + Discover $7,817.94 (both added 2026-09-11)
  // Balances on planStart (from the PocketSmith feed that day) — the death-board bars measure against these
  startingBalances: { 5486598: 1025.72, 5486658: -19497.07, 5486668: -10801.51, 5486678: -16718.31, 5486683: -18998.69, 5486653: -17119.14, 5486703: -12962.08, 5486673: -180.00, 5486688: -29.99, 5486693: 0, 5486593: 0, 5486708: -13736.53, 5486718: -10518.34, irs: -15194.56, discover: -7817.94 },

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

  // Debts that are not in PocketSmith. Balance is the configured figure until a manual override (Accounts page) replaces it.
  extraDebts: [
    { id: 'irs', short: 'IRS installment', label: 'IRS installment agreement (tax years 2023–2025)', institution: 'IRS', role: 'loan', apr: 0.10, balance: -15194.56, asOf: '2026-09-11', order: 13, payoffQuote: true,
      note: 'Interest (~7%) + failure-to-pay penalty (0.25%/mo on an installment plan) ≈ 10%/yr*. Paid from BofA checking, $400/mo.' },
    { id: 'discover', short: 'Discover (0% promo)', label: 'Discover card — 0% purchase promo to Jul 17, 2027', institution: 'Discover', role: 'display', apr: 0, order: 14,
      balance: -7817.94, asOf: '2026-09-11', promoEnds: '2027-07-17', standardApr: 0.2849,
      note: 'True 0% (balance moves to 28.49% at expiry, no retroactive interest). $8,000 limit, nearly maxed — do not charge to it. Minimum ~$153/mo on the 14th.' }
  ],

  // ---- Recurring income (net-pay estimates*) ------------------------------
  // Jessica: W-2, paid ~15th and ~30th. Two-week gross ≈ $11,365 (from the 9/15 one-week stub × 2);
  // net ≈ $7,900 after FICA + MFS federal withholding, Texas, no pre-tax deductions*. First full check 9/30.
  income: [
    { day: 15, amount: 7900,  label: 'Jessica paycheck (mid-month)*', from: '2026-10-01' },
    { day: 27, amount: 26000, label: 'Sabino paycheck*' },
    { day: 30, amount: 7900,  label: 'Jessica paycheck (month-end)*' }
  ],
  oneTimeIncome: [
    { date: '2026-09-12', amount: 10000, label: 'Relocation reimbursement (one-time)*' },
    { date: '2026-09-15', amount: 4300,  label: 'Jessica paycheck — one week only*' }
  ],

  // ---- Bills --------------------------------------------------------------
  // payee: regex used to find the real transaction on checking (±5d, ±15%).
  bills: [
    { day: 1,  amount: 6850, label: 'Rent',                 category: 'Rent',          payee: /rent|apartment|apt|property|realty|leasing|zelle/i },
    { day: 8,  amount: 610,  label: 'Car payment (WF)',     category: 'Car Payment',   payee: /wells|wf |auto/i,  endsAfter: '2026-12-31', account: 5486718 },
    { day: 20, amount: 800,  label: 'SoFi loan payment',    category: 'Loan Payments', payee: /sofi/i,            endsAfter: '2026-12-31', account: 5486708 },
    { day: 28, amount: 750,  label: 'Student loan',         category: 'Loan Payments', payee: /nelnet|mohela|aidvantage|navient|student|edfinancial|dept of ed|great lakes/i },
    // Discover card is not in PocketSmith yet; minimum payment assumed from the 9/8 payment*. Add the card to PocketSmith to bring it into the payoff schedule.
    { day: 14, amount: 153,  label: 'Discover minimum*',      category: 'Payment',       payee: /discover/i, account: 'discover' },
    // IRS installment agreement: $400/mo from checking, due the 28th.
    { day: 28, amount: 400,  label: 'IRS installment',       category: 'Tax',           payee: /irs|usataxpymt|us treasury/i, account: 'irs' }
  ],
  // Checking debits with these payees are bills, not living, even if PocketSmith
  // has them in a generic category (*: e.g. insurance premium tagged "Payment").
  billPayeePatterns: [/standard ins/i, /insurance/i, /irs des|usataxpymt|us treasury/i],

  // ---- Card statements (from the issuer apps, 2026-09-11) --------------------
  // Due dates govern late fees / penalty APR only. On a card that carries a balance,
  // interest accrues DAILY on the whole balance; paying the statement in full does
  // not stop it — only a $0 balance does (then one $0 statement restores the grace
  // period on new purchases). Minimums after the first cycle are estimates*.
  // close = statement closing date, inferred as due − 25 days*.
  statements: {
    asOf: '2026-09-11',
    cards: {
      5486683:   { due: '2026-09-15', dueDay: 15, statement: 18808.97, minDue: 0,   minEst: 648, lastMin: 648,    payee: /amex|american express/i, note: 'Amex Pay Over Time. Sep minimum paid Aug 31.' },
      5486678:   { due: '2026-09-16', dueDay: 16, statement: 16648.32, minDue: 0,   minEst: 568, lastMin: 568,    payee: /amex|american express/i, note: 'Amex Pay Over Time. Sep minimum paid Aug 31.' },
      5486653:   { due: '2026-09-20', dueDay: 20, closeDay: 24, statement: 13463.71, minDue: 0, minEst: 185, lastMin: null, payee: /citi/i, grace: true, float: true, openCharges: 7462.96, note: 'IN GRACE (Aug statement: previous balance paid in full, interest $0). $9,500 paid Sep 11; $3,963.71 more by Sep 20 and it never pays interest. Living card from Sep 11: every statement paid in full on the 20th. Open charges since Aug 24: $4,835.07 posted + $2,627.89 pending (American Airlines $2,535.46, Kraft $92.43)* → on the Sep 24 statement, due Oct 20.' },
      5486668:   { due: '2026-09-21', dueDay: 21, statement: 9426.74,  minDue: 0,   minEst: 192, lastMin: 192.38, payee: /amex|american express/i, note: 'Was in grace (paid to $0 in July, no interest charges). The Sep 21 statement is NOT paid in full — the cash covers the larger 8018 instead — so interest starts Sep 21* (~$220 once). Killed Oct 27.' },
      5486658:   { due: '2026-09-28', dueDay: 28, closeDay: 2, statement: 19291.75, minDue: 196, minEst: 196, lastMin: 196, payee: /citi/i, grace: true, note: 'IN GRACE (Sep statement: previous balance paid in full, interest $0). Killed Sep 27, the day before the due date — no interest ever.' },
      5486703:   { due: '2026-09-22', dueDay: 22, closeDay: 25, statement: 12373.88, minDue: 0, minEst: 325, lastMin: 325, payee: /chase/i,          note: 'Chase app 2026-09-11: due Sep 22, closes Sep 25, statement $12,698.88 (Aug 25). Sep minimum $325 paid Sep 4.' },
      discover:  { due: '2026-09-14', dueDay: 14, statement: null,     minDue: 0,   minEst: 153, lastMin: 153,    billed: true,                    note: '0% promo to Jul 17, 2027 — no interest at all; minimum is already a bill.' }
    }
  },

  // ---- Living allowance ---------------------------------------------------
  // Flat monthly living allowance (chosen 2026-09-07; was $150/day). Daily pace = monthly ÷ days in that month.
  living: { monthly: 4500, amberAt: 1.0, redAt: 1.15,
    // Living is charged to the Citi 8018 (in grace) from this date and paid in full with each statement — interest-free float.
    card: 5486653, cardFrom: '2026-09-11' },

  // ---- Payment matching tolerance ----------------------------------------
  match: { days: 5, pct: 0.15 },

  // ---- Payoff schedule (line items; grouped by date in the UI) ------------
  // amount = planned payment INTO the account. Includes est. accrued interest*.
  payments: [
    // Revised 2026-09-11 (night) around the statements: Citi 8018 + 3208 are IN GRACE (statements show $0 interest), so their statements are paid in full by the due dates and living floats on the 8018.
    // Carrying cards (Amex Plat from Sep 21, Biz Plat, Biz Gold, Sapphire) die avalanche-style with minimums reserved. Kill amounts = pay the LIVE balance that day; figures include est. interest*.
    { date: '2026-09-11', account: 5486653, amount: 9500,                  note: 'PAID Sep 11 — reimbursement to the Citi 8018 Aug statement (in grace → no interest). Part 1 of $13,463.71' },
    { date: '2026-09-16', account: 5486653, amount: 3963.71,               note: 'Rest of the 8018 Aug statement, from Jessica’s Sep 15 check — paid before the Sun Sep 20 due date so the grace period holds' },

    { date: '2026-09-27', account: 5486658, amount: 19550,   kill: true, note: 'PAYOFF — Citi 3208 (pay live balance; statement due Sep 28, in grace → no interest)' },
    { date: '2026-09-27', account: 5486688, amount: 30,      kill: true, note: 'Straggler cleared' },
    { date: '2026-09-27', account: 5486673, amount: 180,     kill: true, note: 'Straggler cleared' },
    { date: '2026-09-27', account: 5486668, amount: 900,                 note: 'Remainder → Amex personal Platinum (its grace lapsed Sep 21). Small because the Oct 20 8018 statement (~$9,400* incl. the American Airlines charge) is held back' },

    { date: '2026-10-27', account: 5486668, amount: 10100,   kill: true, note: 'PAYOFF — Amex personal Platinum (pay live balance)' },
    { date: '2026-10-27', account: 5486678, amount: 14500,               note: 'Bulk of Amex Biz Plat — the tail dies Nov 27' },

    { date: '2026-11-15', account: 5486678, amount: 1500,                note: 'Biz Plat, after the Nov 20 8018 statement, minimums and SoFi' },

    { date: '2026-11-27', account: 5486678, amount: 300,     kill: true, note: 'PAYOFF — Amex Biz Plat tail (pay live balance)' },
    { date: '2026-11-27', account: 5486683, amount: 18900,   kill: true, note: 'PAYOFF — Amex Biz Gold (pay live balance)' },
    { date: '2026-11-27', account: 5486703, amount: 5650,                note: 'Remainder → Sapphire' },

    { date: '2026-12-15', account: 5486703, amount: 2450,                note: '' },

    { date: '2026-12-27', account: 5486703, amount: 4900,    kill: true, note: 'PAYOFF — Chase Sapphire. ALL CARDS DEAD except the 8018 living float (pay live balance)' },
    { date: '2026-12-27', account: 5486708, amount: 11000,   kill: true, note: 'PAYOFF — SoFi (~$11,000*). Request official payoff quote w/ per-diem.' },
    { date: '2026-12-27', account: 'irs',   amount: 9000,                note: 'Remainder → IRS (extra payment on the installment agreement)' },

    { date: '2027-01-15', account: 'irs',   amount: 5100,    kill: true, note: 'PAYOFF — IRS (pay the balance shown in your IRS online account that day)' },

    { date: '2027-01-27', account: 5486718, amount: 8950,    kill: true, note: 'PAYOFF — Wells Fargo auto (~$8,950*). Request payoff quote. 🏁 Interest-bearing debt gone' },
    { date: '2027-01-27', account: null,    amount: 750,                 note: 'Interest true-up buffer* — sweeps residual card interest and payoff-quote variance' },

    { date: '2027-02-27', account: 'discover', amount: 7100, kill: true, note: 'PAYOFF — Discover 0% balance (pay live balance), five months before the promo ends Jul 17, 2027. 🏁 Debt-free (the 8018 living float stays, interest-free)' }
  ],

  // Monthly rhythm shown as a reminder strip
  rhythm: [
    { day: 15, amount: 2300,  from: 'Jessica mid-month check → 8018 statement (living float) on the 20th + minimums + SoFi' },
    { day: 27, amount: 23600, from: 'Sabino check → payoffs (after student loan + IRS $400)' },
    { day: 30, amount: 0,     from: 'Jessica month-end check → held for rent (1st) + car (8th)' }
  ],

  // ---- Post-payoff (from Jan 2027) ----------------------------------------
  post: {
    startMonth: '2027-01',
    monthlyCapacity: 29600,            // income $41,800* − burn ≈ $12,200* (revised 2026-09-10; was $31,400)
    byDay: [{ day: 15, amount: 4800 }, { day: 27, amount: 20000 }, { day: 30, amount: 4800 }],
    postDebtBurn: 12200,               // rent + living + student loan + misc*
    emergencyFund: { target: 63000, months: 6, note: 'HYSA — one-time fill from Jan + Feb 2027 cash flow*' },
    roth: { monthly: 1250, annualEach: 7500, note: 'Backdoor route only (filing MFS). Pro-rata caveat if either spouse holds pre-tax IRA money*' },
    hsa: { monthly: 729, annual: 8750, defaultOn: false, note: 'Only if the HDHP option is chosen*' },
    jessica401k: { annual: 24500, note: 'Payroll-side, not from this cash flow — if eligible*' },
    sabino401k: { eligibleDate: '2027-07-01', annual: 24500, note: 'Eligibility ~mid-2027*; front-load $24,500 across remaining paychecks' },
    brokerage: { note: 'Everything remaining (~$25–29k/mo from March)' },
    jessicaAge: 34                  // for the cash-balance sizing in the W-2 vs 1099 calculator
  },

  // ---- Projection table (month-end, USD). Conservative: excludes 401(k)s,
  //      employer match, market growth.* --------------------------------------
  projection: [
    // Revised 2026-09-11 night (grace cards + 8018 living float)*: debt figures include the ~$4,500–5,500 living float on the 8018, paid in full monthly at 0%. savings from Feb ’27 at $29,600/mo after the Discover payoff.
    { label: 'Now',     date: '2026-09-07', debt: -143574, savings: 0 },
    { label: 'Sep ’26', date: '2026-09-30', debt: -116000, savings: 0 },
    { label: 'Oct ’26', date: '2026-10-31', debt: -84300,  savings: 0 },
    { label: 'Nov ’26', date: '2026-11-30', debt: -55600,  savings: 0 },
    { label: 'Dec ’26', date: '2026-12-31', debt: -26400,  savings: 0,      note: 'cards + SoFi dead; IRS, auto, Discover remain' },
    { label: 'Jan ’27', date: '2027-01-31', debt: -12400,   savings: 10000,  note: 'interest-bearing debt gone Jan 27' },
    { label: 'Feb ’27', date: '2027-02-28', debt: -5400,       savings: 32500,  note: 'Discover cleared' },
    { label: 'Mar ’27', date: '2027-03-31', debt: -4500,       savings: 62100 },
    { label: 'Apr ’27', date: '2027-04-30', debt: -4500,       savings: 91700 },
    { label: 'May ’27', date: '2027-05-31', debt: -4500,       savings: 121300 },
    { label: 'Jun ’27', date: '2027-06-30', debt: -4500,       savings: 150900 },
    { label: 'Jul ’27', date: '2027-07-31', debt: -4500,       savings: 180500 },
    { label: 'Aug ’27', date: '2027-08-31', debt: -4500,       savings: 210100 },
    { label: 'Sep ’27', date: '2027-09-30', debt: -4500,       savings: 239700 }
  ],

  // ---- The $1M objective ---------------------------------------------------
  million: {
    target: 1000000,
    // Levers (defaults; adjustable in the UI, persisted locally)
    monthlyCash: 29600,            // from post.monthlyCapacity
    include401k: true,             // Jessica $24.5k/yr from Jan ’27 + Sabino $24.5k/yr from Jul ’27, both payroll-side*
    employerMatchAnnual: 0,        // unknown — set when known*
    annualReturn: 0.06,            // blended nominal return on invested balances*
    cashYield: 0.04,               // HYSA yield on the emergency fund*
    startingInvested: 0
  }
};
