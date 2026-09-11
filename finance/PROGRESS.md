# Progress log — Finance Command Center

Owner: Sabino · Started 2026-09-07 · Branch `claude/finance-dashboard-build-ieogrt` · Build session: https://claude.ai/code/session_018LtM87MMoVFeFvzrvYBmob

## Where things stand (2026-09-07 evening)

**Hosted app (phone/desktop):** https://claude.ai/code/artifact/949af0fe-1c0a-4bab-a4cc-2f5522d0a7ae — private, owner-only. Open in Safari → share → *Add to Home Screen*.
**Local app:** `cd finance && cp .env.example .env && npm start` → http://localhost:4180 (`npm run demo` for fixtures).
**Sync model:** live pull from PocketSmith on every open and on **Resync**, via the viewer's PocketSmith connector. No scheduled sync (removed at Sabino's request; helper + prompt kept in `hosted/`).
**Data in the app's database (`state/cache`, `state/snapshots`):** seeded once from this session on 2026-09-07 ~4:09pm CT with real PocketSmith data (debt −$120,562; checking $1,026; 71 September transactions). Replaced automatically by the first successful live pull.

### Confirmed 2026-09-07 4:51pm CT
Connector name fix worked: the permissions dialog shows **PocketSmith Complete Access · Can only read** (4 tools) plus **Use Claude**, both toggled on, and the page reached **Live · PocketSmith — PocketSmith pulled today 4:33 PM** on the iPhone. Live sync on open/Resync is working. That dialog appears once per published version.

## What was built

1. **Plan engine** (`public/js/plan.js`, `engine.js`) — every constant in one object; pure functions for classification, payment matching (±5d, ±15%), interest-aware per-card simulation (daily APR compounding, no new charges*), Dec 15 buffer sweeping interest tails, funds check per pay date, projection + drift, post-payoff waterfall, $1M path + sensitivity.
2. **Seven pages** — Command (crossing-zero hero, next payment, living gauge, month cash, death board), Payoff, Spending, Projection, After Debt, Path to $1M, Accounts.
3. **Local build** — dependency-free Node proxy (`server.js`, GET-only, key from gitignored `.env`), demo fixtures, vendored Chart.js.
4. **Hosted build** (`hosted/build.js` → `hosted/dist/command.html`) — `hosted/runtime.js` swaps the proxy for the artifact runtime: `mcp` (PocketSmith connector), `db` (overrides + snapshots + shared cache), `sample` (Claude reads balance screenshots).
5. **Fail-safe balances** — Accounts page: typed manual balance or screenshot review; override supersedes the feed until the feed reports a newer date.
6. **Popup on every load** — next two scheduled payments with amounts, targets, kill markers, funds check.
7. **Load behaviour** — paints last data instantly (local or shared cache, whichever is newer), then syncs; accounts first, then categories/events/transactions in parallel; partial results degrade to a “Live · partial” badge instead of an error page; 180s budget with one retry when nothing is on screen, 60s without retry once data is showing.
8. **Freshness labels** — header “PocketSmith pulled today 4:09 PM”; badge Live / Synced / Stale (>26h); Total-debt tile shows latest bank-feed date.
9. **Scheduled sync tooling (dormant)** — `hosted/sync-compact.js` + `hosted/ROUTINE.md`.

## Verified
- Engine reproduces the plan: every card dies on its scheduled date, interest tails ≈$1,913 fit inside the $2,000 Dec 15 buffer, debt-free Dec 27, 2026; $1M crossed Mar 2029 at 6% return with both 401(k)s.
- Headless Chromium: all pages render without script errors, desktop + 390px mobile; popup, manual override persistence, screenshot flow (mocked), partial-failure path, cached-first boot all pass.
- Real PocketSmith shapes observed: `list_transactions` returns text with a `Page X of Y (N total)` preamble before the JSON; `list_accounts`/`list_categories` return plain JSON arrays; `list_events` returns a text content block.

## Lessons / gotchas
- Claude mobile app + mobile Safari artifact viewers returned `upstream_error: no reply from shell` on connector calls; root cause is most likely the connector-name mismatch above (the dialog literally said no match).
- A per-call abort of 45s fired while the user was still on the consent prompt → `cancelled: call aborted`. Keep budgets long on first load.
- Artifact watch subscriptions are refused from this session (403) — don't rely on comment wakes.
- `create_trigger` can't attach connectors in this org; a routine that needs PocketSmith must be created in claude.ai → Code → Routines with the connector attached.
- cdnjs/jsdelivr are unreachable from the sandbox; Chart.js is vendored (`public/vendor/chart.umd.js`) and inlined in the hosted bundle.
- Killing the demo server with `pkill -f "node server.js"` kills the calling shell too; use `pgrep -f "server\.js"` + kill.

## Decisions
- 2026-09-11 (late): $10,000 reimbursement received; Sabino paid **$9,500** to the 8018 on Sep 11 (kept $500 back); $3,963.71 remains, scheduled Sep 16. A pending **$2,535.46 American Airlines** charge + $92.43 Kraft on the 8018 go to the Sep 24 statement → Oct 20 statement ≈ $9,400* (`openCharges` 7,462.96). Re-solved: Sep 27 Amex Plat only $900; Biz Plat tail dies Nov 27 (was Oct 27); IRS Jan 15; auto Jan 27; Feb 27 unchanged. Interest ≈ $4,300*.
- 2026-09-11 (night): **Grace-period plan.** Sabino's Citi statements (8018 Aug, 3208 Sep) show the previous balance paid in full and $0 interest → both Citis are IN GRACE; PocketSmith shows no interest charges on the personal Amex Platinum either (paid to $0 in July), while Biz Plat, Biz Gold and Sapphire post interest monthly (carrying). Earlier advice that “paying the statement in full doesn't avoid interest” was wrong for the Citis — corrected. New plan: 8018 Aug statement $13,463.71 in full by Sep 20 (reimbursement + Jessica's check, ~$370 cushion); 3208 killed Sep 27 (due Sep 28); the 8018 becomes the **living float card** (`plan.living.card`, from 2026-09-11): living is charged to it and each statement (closes 24th, due 20th) is paid in full — modelled as generated statement bills (`ENGINE.bills()` → `statement: true`), sim treats grace cards as 0% and the float card as never dying (`deathDate: 'float'`). Amex Plat's grace is allowed to lapse Sep 21 (~$220 once) because the cash covers the larger 8018. Carrying cards die avalanche: Amex Plat + Biz Plat Oct 27, Biz Gold Nov 27, Sapphire + SoFi Dec 27, IRS Jan 15, auto Jan 27, Discover Feb 27. Interest ≈ $4,100* (was ≈ $5,000). Projection debt figures now include the ~$4,500 float.
- 2026-09-11 (evening): **Statements page** (`#/statements`, key 0) + card minimums. Sabino asked to pay statement balances in full by due date to “avoid interest”; explained that on a carrying card interest accrues daily on the whole balance regardless of due dates, so kills stay whole-card avalanche and waiting cards get minimums only. `plan.statements` holds each card's statement/due/min (from the issuer apps); the engine generates minimum bills (`from` = day after the paid cycle, `until` = kill date) and they flow into ledger, funds check, near-term path and sims. Schedule re-solved with the minimums: Oct 15 $4,000, Oct 27 Biz Plat kill $10,500 + $10,800 Biz Gold, Nov 15 $4,300, Nov 27 Biz Gold kill + $18,900 to 8018, **8018 tail dies Dec 15 (~$200)**, Dec 27 Sapphire $7,900 + SoFi + $4,100 IRS, Jan 27 IRS $4,950 + auto + $750 buffer. Debt-free still Feb 27; checking never below ≈$590 (min Oct 26). Sapphire confirmed from the Chase app: due 22nd, closes 25th, statement $12,373.88 remaining, min $325 paid Sep 4.
- 2026-09-11: Discover card added ($7,817.94; 0% purchase promo to Jul 17, 2027; true promo, not deferred interest; limit $8,000). Kept at the minimum until everything else is gone; payoff Feb 27, 2027. Debt-free = Feb 27 (interest-bearing debt gone Jan 27).
- 2026-09-11: IRS installment agreement added ($15,194.56: TY2023 $11,217.76, TY2024 $1,271.37, TY2025 $2,705.43; $400/mo from checking, due the 28th). Slotted after SoFi, before the auto loan (≈10% effective vs 7%*). Debt-free → **Jan 27, 2027**. Plan-start debt restated to $135,756.
- 2026-09-10: replanned from live balances (checking $333; cards $97.6k). Reimbursement arrives ~9/12 → straight to Citi 3208. Jessica's 9/15 check is one week (~$4,300 net); full checks ≈ $7,900 net on the 15th/30th (from a $5,682 one-week gross stub). Month-end check now covers rent + car; the “$8,000 on the 30th” payments are gone. Cards still die in avalanche order; debt-free slips to **Jan 15, 2027**. Post-debt capacity $29,600/mo. Untracked: a Discover card — modelled as a $153* bill on the 14th (Sep paid; next due Oct 14) until it is added to PocketSmith. Sep car payment was made Aug 31 from checking; bill matching now accepts payments up to 12 days early. Discover: 0% promo for ~5 months (to ~Feb 2027) — payoff line to be added once the balance and promo terms (deferred interest?) are known.
- 2026-09-07: living allowance changed from $150/day to a flat **$4,500/month** so no month runs short; daily pace is derived.

## Assumptions to true-up (all marked * in the UI)
Loan APRs (SoFi 12%, WF auto 7%); net-pay estimates; Dec ’26 $13k buffer counted toward the EF; “Payment”-category checking debits to non-issuers treated as bills; 401(k) eligibility Jul 1, 2027; $31,400/mo post-debt capacity.

## Next candidates
- Re-enable the 7pm routine (with push notification) if wanted: `hosted/ROUTINE.md`.
- True-up plan.js as real September paychecks/payments land (Sep 12 $8,750 → Citi 3208). Confirm the Amex Pay Over Time minimums when the October statements post.
- Merge the branch into `main` when Sabino is happy.
