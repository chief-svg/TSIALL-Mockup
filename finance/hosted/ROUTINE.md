# Daily 7pm sync Routine

A Claude Code Routine keeps the hosted app fresh without opening it: every day it pulls PocketSmith through your connector, writes the data and the day's debt snapshot into the artifact's database, and sends a push notification with the next two payments.

## Current arrangement

The daily sync is scheduled as a Routine that fires **into the original build session** (which holds the PocketSmith tools), every day at 00:00 UTC (7pm Central Daylight Time). It pulls PocketSmith, runs `sync-compact.js`, writes `state/cache` and `state/snapshots` into the artifact database, and sends a push notification with the summary. The first run seeded the database on 2026-09-07. If that session is ever archived, recreate the Routine from the claude.ai Routines screen using the set-up below.

## Set-up (fallback, in claude.ai)

1. Open **claude.ai → Code → Routines**. A paused Routine named **“Finance command center · 7pm PocketSmith sync”** is already there (created from the build session).
2. Open it and **attach the PocketSmith connector** (Connectors section). Enable **push notifications** if not already on.
3. Set the schedule to **daily at 7:00 PM America/Chicago** (stored as `0 0 * * *` UTC while daylight time is in effect; change to `0 1 * * *` after Nov 1 if you want it to stay at 7pm rather than 6pm).
4. Turn the Routine **on**. Use *Run now* once to confirm the notification arrives.

If the Routine cannot be edited to add a connector, create a new Routine with: environment = this repository's environment, connectors = PocketSmith, fresh session per run, push notifications on, schedule as above, and the prompt below.

## Prompt

```
Daily PocketSmith sync for Sabino's finance command center. The app is the claude.ai artifact at https://claude.ai/code/artifact/949af0fe-1c0a-4bab-a4cc-2f5522d0a7ae ; its code is in this repository on branch claude/finance-dashboard-build-ieogrt under finance/. Your job: pull fresh data from PocketSmith with the connector, compact it with the repo's script, write it into the artifact's database, and reply with a one-paragraph summary. Read-only everywhere except the artifact database.

Steps:
1. Check out the code: `git fetch origin claude/finance-dashboard-build-ieogrt && git checkout claude/finance-dashboard-build-ieogrt`. Never commit, push, or open a pull request.
2. Dates (America/Chicago): TODAY = today's date as YYYY-MM-DD. START = 5 days before the earlier of 2026-09-07 and the first day of TODAY's month. END = TODAY plus 1 day. EV_END = TODAY plus 60 days.
3. With the PocketSmith connector (user_id 882138), call these tools and save each raw result VERBATIM to a file (write exactly the text the tool returned, including any "Page X of Y" preamble; do not reformat):
   - list_accounts {user_id: 882138} → /tmp/sync/in/accounts.json
   - list_categories {user_id: 882138} → /tmp/sync/in/categories.json
   - list_events {user_id: 882138, start_date: TODAY, end_date: EV_END} → /tmp/sync/in/events.json
   - list_transactions {user_id: 882138, start_date: START, end_date: END, per_page: 100, page: N} for N = 1, 2, … until the "Page X of Y" preamble shows X equals Y (or a page returns fewer than 100 rows) → /tmp/sync/in/tx-N.json
   Only these list_* tools. Never call any tool that creates, updates or deletes anything in PocketSmith.
4. Read the existing snapshots document with the Artifact tool: action "read_db", url https://claude.ai/code/artifact/949af0fe-1c0a-4bab-a4cc-2f5522d0a7ae , db_op "get", collection "state", doc_id "snapshots", out_dir "/tmp/sync/db". If the document does not exist, continue without it.
5. Run: `node finance/hosted/sync-compact.js --out /tmp/sync/out --snapshots /tmp/sync/db/state/snapshots.json /tmp/sync/in/*.json`
   It writes /tmp/sync/out/cache.json, snapshots.json and summary.txt. If it exits non-zero, stop, do not write to the database, and reply with the error in one sentence.
6. Write both documents with the Artifact tool: action "write_db", url https://claude.ai/code/artifact/949af0fe-1c0a-4bab-a4cc-2f5522d0a7ae , db_op "batch", writes: [{"op":"set","collection":"state","doc_id":"cache","file_path":"/tmp/sync/out/cache.json"},{"op":"set","collection":"state","doc_id":"snapshots","file_path":"/tmp/sync/out/snapshots.json"}].
7. Final message: exactly the contents of /tmp/sync/out/summary.txt, nothing else. It is delivered as a push notification.

If the PocketSmith connector is unavailable or a call fails after one retry, reply with one sentence saying so and stop.
```

## What the app does with it

The hosted page uses the newer of its own cache and the shared `state/cache` document, so on open it shows the 7pm numbers immediately, then re-syncs live from the connector. The `state/snapshots` document is the “live debt” history drawn on the Projection page — the Routine adds one point per day whether or not the app is opened.
