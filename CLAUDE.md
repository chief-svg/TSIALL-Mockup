# CLAUDE.md — project memory

This repo has two unrelated things: the **Texas State Insurance mockup** (`index.html`, `assets/`) and Sabino's **Finance Command Center** under `finance/`. Work on the finance app happens on branch `claude/finance-dashboard-build-ieogrt`. Read `finance/PROGRESS.md` first for current status.

## Finance app — key components
- `finance/public/js/plan.js` — **all** constants (accounts/roles/APRs, income, bills, payment schedule, waterfall, projection, $1M levers, plan-start balances). Change numbers here, never in views.
- `finance/public/js/engine.js` — pure logic (classify, match ±5d/±15%, simulate with daily APR, buffer sweeps tails, funds check, projection/drift, allocation, million path). Testable in Node: `global.window=global; require(format, plan, engine)`.
- `finance/public/js/app.js` — controller: cached-first boot, refresh, header/strip, popup (next two payments), overrides API, routing (`#/command|payoff|spending|projection|after|allocate|donuts|million|accounts`, keys 1–9, `r` = resync).
- `finance/public/js/store.js` — async KV (localStorage locally; hosted swaps in artifact db for `overrides`/`snapshots`, cache = newer of local/db).
- `finance/public/js/views/*.js` — one file per page; `VIEWS.x = {render(S), mount(S, root)}`.
- `finance/server.js` — GET-only proxy, key from gitignored `finance/.env` (`POCKETSMITH_KEY`). `npm start` / `npm run demo` (`DEMO=1`, fixtures in `public/demo/`).
- `finance/hosted/runtime.js` — artifact runtime: `SERVER = 'PocketSmith Complete Access'` (connector display name), tools `list_accounts|list_categories|list_transactions|list_events`, `unwrap()` strips the `Page X of Y` preamble, `API.onPartial` paints balances early, `VISION` = screenshot reading via `sample`.
- `finance/hosted/build.js` → `finance/hosted/dist/command.html` (single-file bundle, Chart.js inlined). Publish with the Artifact tool to **https://claude.ai/code/artifact/949af0fe-1c0a-4bab-a4cc-2f5522d0a7ae** (pass `url`), capabilities `{mcp:{servers:[{server:'PocketSmith Complete Access', tools:[…4]}]}, db:{}, sample:{}}`.
- `finance/hosted/sync-compact.js` + `ROUTINE.md` — dormant scheduled-sync tooling (writes db docs `state/cache`, `state/snapshots`).

## Facts
- PocketSmith user id **882138**; account ids/roles are in plan.js; plan start 2026-09-07, debt −$120,561.66; debt-free target 2026-12-27; user is in America/Chicago.
- Artifact db docs: `state/cache` `{value:{at,payload},at}`, `state/snapshots` `{value:{date:{debt,cash,savings,net}},at}`, `state/overrides`.
- PocketSmith MCP tools work from a Claude Code session here. The hosted page's connector calls work on iPhone once the manifest uses the display name `PocketSmith Complete Access` (confirmed 2026-09-07; `PocketSmith_Complete_Access` produced “No matching connector found” → `upstream_error: no reply from shell`). Each new published version re-prompts the viewer once for connector consent.

## Conventions
- Live balances are truth; plan figures are targets; mark assumptions with `*` in UI copy.
- Dark-only design, gold accent; validated chart palette: debt `#e66767`, live `#3987e5`, net `#c98500`, savings `#199e70`.
- Never commit `finance/.env` or any key. Read-only against PocketSmith everywhere.
- After changing anything under `finance/public` or `finance/hosted`, run `node finance/hosted/build.js`, then publish; commit and push to the branch.
- Verify with Playwright (`NODE_PATH=$(npm root -g)`, Chromium at `/opt/pw-browsers`); demo server on port 4180. Stop it with `pgrep -f "server\.js"` + kill (not `pkill -f`).
