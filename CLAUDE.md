# CLAUDE.md — project memory

This repo has two unrelated things: the **Texas State Insurance mockup** (`index.html`, `assets/`) and Sabino's **Finance Command Center** under `finance/`. Work on the finance app happens on branch `claude/finance-dashboard-build-ieogrt`. Read `finance/PROGRESS.md` first for current status.

## Finance app — key components
- `finance/public/js/plan.js` — **all** constants (accounts/roles/APRs, income, bills, payment schedule, waterfall, projection, $1M levers, plan-start balances). Change numbers here, never in views.
- `finance/public/js/engine.js` — pure logic (classify, match ±5d/±15%, simulate with daily APR, buffer sweeps tails, funds check, projection/drift, allocation, million path). Testable in Node: `global.window=global; require(format, plan, engine)`.
- `finance/public/js/app.js` — controller: cached-first boot, refresh, header/strip, popup (today's allowance, next two payments, manual-balance prompt for `extraDebts` accounts — stale after 7 days), overrides API, routing (`#/command|payoff|spending|projection|after|allocate|donuts|million|accounts|statements`, keys 1–9, 0, `r` = resync).
- `finance/public/js/store.js` — async KV (localStorage locally; hosted swaps in artifact db for `overrides`/`snapshots`, cache = newer of local/db).
- `finance/public/js/views/*.js` — one file per page; `VIEWS.x = {render(S), mount(S, root)}`.
- `finance/server.js` — GET-only proxy, key from gitignored `finance/.env` (`POCKETSMITH_KEY`). `npm start` / `npm run demo` (`DEMO=1`, fixtures in `public/demo/`).
- `finance/hosted/runtime.js` — artifact runtime: `SERVER = 'PocketSmith Complete Access'` (connector display name), tools `list_accounts|list_categories|list_transactions|list_events`, `unwrap()` strips the `Page X of Y` preamble, `API.onPartial` paints balances early, `VISION` = screenshot reading via `sample`.
- `finance/hosted/build.js` → `finance/hosted/dist/command.html` (single-file bundle, Chart.js inlined). Publish with the Artifact tool to **https://claude.ai/code/artifact/949af0fe-1c0a-4bab-a4cc-2f5522d0a7ae** (pass `url`), capabilities `{mcp:{servers:[{server:'PocketSmith Complete Access', tools:[…4]}]}, db:{}, sample:{}}`.
- `finance/hosted/sync-compact.js` + `ROUTINE.md` — dormant scheduled-sync tooling (writes db docs `state/cache`, `state/snapshots`).

## Facts
- Income model (2026-09-10): Jessica W-2 net ≈ $7,900 per check on the ~15th/~30th (first full check 9/30; 9/15 is one week ≈ $4,300), Sabino $26,000 on the 27th, $10,000 reimbursement ~9/12. Post-debt capacity $29,600/mo. `income[].from` gates the start month.
- IRS installment agreement (not in PocketSmith): $15,194.56 on 2026-09-11, ~10%/yr*, $400/mo from checking, due the 28th. Modelled via `plan.extraDebts` → synthetic account id `irs`; payoff Dec 27 → Jan 27 after SoFi, before the auto loan.
- Discover card (not in PocketSmith): $7,817.94, 0% on purchases to 2027-07-17 (true promo, standard 28.49% after), $8,000 limit, min ~$153 on the 14th. `extraDebts` id `discover`; payoff Feb 27, 2027.
- Jessica's Citi Diamond Preferred …1991 (not in PocketSmith): $5,786.91, true 0% intro to **2026-09-28**, then `standardApr` 0.2799*, min $58 due the 1st (closes 3rd). `extraDebts` id `jess1991`; engine `aprOn(acct, d)` switches promo → standard APR by date. Killed Nov 27 / Dec 15.
- **Grace cards** (statements show $0 interest, previous balance paid in full): Citi 8018 and Citi 3208 → `grace: true` (sim 0%). The 8018 is the **living float card** (`plan.living.card = 5486653`, `cardFrom 2026-09-11`): living accrues on it, engine generates monthly statement bills (close 24th → due 20th; first = `openCharges` $4,835.07* + living), sim never kills it (`deathDate 'float'`), projection debt includes the float. Carrying (interest posts monthly): Biz Plat, Biz Gold, Sapphire, Amex Plat from Sep 21. Rule: statement-in-full only helps a card that is in grace.
- Card statements (2026-09-11, from issuer apps) live in `plan.statements.cards` {due, dueDay, closeDay, statement, minDue, minEst, payee, grace, float, openCharges}: Biz Gold 15th, Biz Plat 16th, 8018 20th, Amex Plat 21st, 3208 28th, Sapphire 22nd (closes 25th), Discover 14th (already a bill). `ENGINE.bills()` = `P.bills` + generated minimums (until the kill date); `ENGINE.statementBoard()` feeds the Statements page (`#/statements`, key 0). Rule: carrying cards accrue daily, so kill them whole and pay only minimums on the rest; grace cards pay statements in full by the due date.
- Living allowance is a flat **$4,500/month** (`plan.living.monthly`, chosen 2026-09-07; daily pace = monthly ÷ days in month). The spec's $150/day is superseded.
- PocketSmith user id **882138**; account ids/roles are in plan.js; plan start 2026-09-07, debt −$120,561.66; interest-bearing debt gone **2027-01-27**, Discover 0% balance cleared **2027-02-27** = debt-free target (revised 2026-09-11; 09-10: 01-15; original 2026-12-27); user is in America/Chicago.
- Artifact db docs: `state/cache` `{value:{at,payload},at}`, `state/snapshots` `{value:{date:{debt,cash,savings,net}},at}`, `state/overrides`.
- PocketSmith MCP tools work from a Claude Code session here. The hosted page's connector calls work on iPhone once the manifest uses the display name `PocketSmith Complete Access` (confirmed 2026-09-07; `PocketSmith_Complete_Access` produced “No matching connector found” → `upstream_error: no reply from shell`). Each new published version re-prompts the viewer once for connector consent.

## Conventions
- Live balances are truth; plan figures are targets; mark assumptions with `*` in UI copy.
- Dark-only design, gold accent; validated chart palette: debt `#e66767`, live `#3987e5`, net `#c98500`, savings `#199e70`.
- Never commit `finance/.env` or any key. Read-only against PocketSmith everywhere.
- After changing anything under `finance/public` or `finance/hosted`, run `node finance/hosted/build.js`, then publish; commit and push to the branch.
- Verify with Playwright (`NODE_PATH=$(npm root -g)`, Chromium at `/opt/pw-browsers`); demo server on port 4180. Stop it with `pgrep -f "server\.js"` + kill (not `pkill -f`).
