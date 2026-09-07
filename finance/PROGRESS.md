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
- 2026-09-07: living allowance changed from $150/day to a flat **$4,500/month** so no month runs short; daily pace is derived.

## Assumptions to true-up (all marked * in the UI)
Loan APRs (SoFi 12%, WF auto 7%); net-pay estimates; Dec ’26 $13k buffer counted toward the EF; “Payment”-category checking debits to non-issuers treated as bills; 401(k) eligibility Jul 1, 2027; $31,400/mo post-debt capacity.

## Next candidates
- Re-enable the 7pm routine (with push notification) if wanted: `hosted/ROUTINE.md`.
- True-up plan.js as real September paychecks/payments land (Sep 15 first payment: $5,500 → Citi 3208).
- Merge the branch into `main` when Sabino is happy.
