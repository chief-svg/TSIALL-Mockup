# Command — personal finance command center

Single-user, local web app. Pulls **live** accounts, balances, categories, transactions and budget events from PocketSmith on every load, and layers the debt-payoff → wealth plan on top: what to pay, when, with what; each card's death date; the crossing-zero projection; the post-payoff waterfall; and the path to $1M.

Read-only by design: the proxy forwards only `GET`, so nothing here can change anything in PocketSmith.

## Run

```bash
cd finance
cp .env.example .env         # paste your PocketSmith developer key
npm start                    # → http://localhost:4180
```

No dependencies — Node 18+ only. Get a key at PocketSmith → profile icon → **Security & integrations → Manage developer keys → Create Key**. The key lives in `finance/.env`, which is gitignored. Never commit it.

Want to look around without a key? `npm run demo` serves bundled fixtures (real account structure, synthetic transactions).

## Hosted version (phone)

`node hosted/build.js` bundles the same app into `hosted/dist/command.html` for publishing as a claude.ai artifact. That build swaps the local proxy for the viewer's own **PocketSmith connector** (through the artifact `mcp` runtime — no key, your claude.ai login), keeps manual balance overrides and daily snapshots in the artifact database so they follow you across devices, and reads balance **screenshots** with Claude where the viewer allows images. Open the published link in the Claude app or claude.ai, allow PocketSmith when asked, then use *Add to Home Screen*. Every open re-pulls PocketSmith; **Resync** forces a fresh pull; the **Accounts** page has the fail-safe (screenshots or typed balances); a popup on each load shows the next two scheduled payments.

## Pages

| Key | Page | What it answers |
|---|---|---|
| 1 | **Command** | Net position, the crossing-zero hero, next payment + funds check, living-allowance gauge, this month's cash, death board |
| 2 | **Payoff** | Full schedule with done / sent / due / pending / missed matching, per-card interest-aware simulation, funds check per pay date, PocketSmith calendar cross-check |
| 3 | **Spending** | Live category tree with month-to-date actuals, $150/day allowance pace, bills & income ledger, living transactions |
| 4 | **Projection** | Debt / savings / net through Sep 2027 with live-debt snapshots overlaid, drift vs plan |
| 5 | **After Debt** | Emergency fund → Roth → HSA → brokerage waterfall, 401(k) notes and countdown, month-by-month 2027 |
| 6 | **Path to $1M** | Levers (cash, return, yield, 401(k)s, match), crossing month, milestones, sensitivity grid |
| 7 | **Accounts** | Every account with live balance, role, APR, death date |

`R` resyncs. A `*` marks an assumption or estimate. A manual balance (typed or read from a screenshot) overrides the feed until the feed reports a newer date.

## Where things live

- `public/js/plan.js` — **every constant**: account roles and APRs, income, bills, the payment schedule, post-payoff waterfall, projection table, $1M levers. True-up here as real numbers land.
- `public/js/engine.js` — classification, matching, simulation, projection, allocation, $1M path. Pure functions; unit-testable in Node.
- `public/js/views/*.js` — one file per page.
- `server.js` — 100-line proxy + static server. `DEMO=1` swaps in `public/demo/*.json`.
- `hosted/runtime.js` + `hosted/build.js` — the claude.ai artifact build (connector, db, screenshot reading).

## How matching works

A planned payment is **done** when a credit tagged as a payment appears on the target account within ±5 days and ±15 % of the planned amount (several smaller payments summing to it also count). **Sent** means a matching debit left checking but hasn't posted on the card yet. **Missed** means the window closed with nothing found — the schedule keeps the line and the death board flags the residual.

Living = every debit that isn't a transfer, a debt payment, or a bill. Bills are PocketSmith `is_bill` categories plus payee patterns in `plan.js`.

## Graceful failure

The last good payload is cached in `localStorage`. If PocketSmith is unreachable the app renders the cached data with a **Stale** badge, never a blank screen. Snapshots of total debt are recorded on each successful refresh and drawn as the "live debt" series.
