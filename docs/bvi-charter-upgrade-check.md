# BVI Charter Trip — Flight Plan & SWU Upgrade Check

Status as of 2026-09-08. Prepared in a Claude Code on the web session.

## Bottom line

**C-inventory checks (items 1–3) could not be run.** The session's network egress
policy blocks every tool named in the brief and every schedule aggregator tried:

| Host | Result |
|------|--------|
| expertflyer.com | blocked by egress proxy (403) |
| seats.aero | blocked |
| aa.com | blocked |
| google.com/travel/flights, flightaware.com, flightstats.com | blocked |
| flightsfrom.com, flightconnections.com, flightmapper.net, airportia.com, aviability.com, directflights.com, flight.info, flyteam.jp, caribjournal.com | blocked |

Credentials would not have helped: the block is at the network layer, before any
login. Only web-search result snippets were reachable, so everything below is
drawn from **currently published schedules (Sept 2026)**, not the loaded
Jan 30 / Feb 7 2027 schedule. Treat every time as "verify on aa.com".

### To unblock
1. In the Claude Code on the web environment settings, set the network policy to
   allow `expertflyer.com`, `seats.aero`, `aa.com` (and `*.aa.com`), or to
   unrestricted. Docs: https://code.claude.com/docs/en/claude-code-on-the-web
2. Start a new session on this branch and supply ExpertFlyer (and optionally
   seats.aero Pro) credentials at that point.
3. Or run the same brief from the Claude Code CLI on a local machine, where there
   is no egress proxy and Chromium can drive a logged-in ExpertFlyer / aa.com.

## Per-segment table

C inventory and award J/F columns are **NOT CHECKED** for the reason above.

| # | Date | Segment | Flight | Dep | Arr | Aircraft | C inv | Award J/F | Notes |
|---|------|---------|--------|-----|-----|----------|-------|-----------|-------|
| 1 | Sat 30 Jan 2027 | SAT→MIA | AA1604 (current-schedule number) | 05:00 | 08:12–08:52 (sources disagree) | 737-800 | not checked | not checked | Only daily nonstop; confirm number and arrival for the Feb-2027 schedule load |
| 2 | Sat 30 Jan 2027 | MIA→EIS | TBD (Envoy 3xxx/4xxx) | target ~11:00 | ~14:00 | E175 | not checked | not checked | Current pattern: 4x daily 08:00–19:00. **Winter 2026-27 goes up to 6x daily** (Caribbean Journal, 5 Jul 2026), so the frequency closest to 11:00 may differ from last year |
| 3 | Sun 7 Feb 2027 | EIS→MIA | TBD (Envoy) | target ~14:30 | ~16:45 | E175 | not checked | not checked | Current pattern: 4x daily 07:00–17:59, 28/week (so Sunday operates). Example current flight AA3667 EIS–MIA 16:41→19:54 |
| 4 | Sun 7 Feb 2027 | MIA→SAT | AA1468 | 19:57 (brief) / 19:42 (current summer schedule) | ~22:00 (21:58 current) | 737-800 | not checked | not checked | Published as operating Sun; one source lists Mon/Tue/Wed/Thu/Sun, another "daily". Feb-2027 Sunday time unverified |

## Schedule flags (item 4)

- **MIA–EIS frequency change.** American announced up to six daily MIA–Tortola
  flights for winter 2026-27, its largest BVI schedule ever. The brief assumes
  four. More frequencies = more chances at C2 on the E175 legs, but the departure
  times will not match last winter's pattern. Re-pick "closest to 11:00" and
  "~14:30 return" from the actual Feb-2027 timetable.
- **Late-night / early-morning pair.** Since 18 Dec 2025 AA runs a MIA–EIS flight
  arriving ~22:14 (AA3668) and an EIS–MIA departure at 08:00 (AA3398), daily
  through March. Not relevant to the targets, but confirms EIS now has a
  wider operating window than the 08:00–19:00 / 07:00–18:00 pattern.
- **AA1468.** Current published time is 19:42 MIA → 21:58 SAT (summer). The
  brief's 19:57 Sunday time could not be confirmed or refuted for Feb 2027.
- **EIS–MIA ~14:30 on Sunday** exists in the current pattern (4 daily, Sunday
  included). Not confirmed for 7 Feb 2027 specifically.

## Connection sanity check (item 5), using brief target times

| Connection | Arr | Dep | Cushion | Minimum | OK? |
|-----------|-----|-----|---------|---------|-----|
| MIA outbound (dom→intl, same terminal) | 08:50 | 11:00 | 2h10 | 1h30 | Yes. Still OK if SAT–MIA lands 08:52 |
| MIA return (intl arrival, immigration + bag recheck + TSA) | 16:45 | 19:57 | 3h12 | 2h30 | Yes. Note: sample EIS–MIA on-time departure rate ~57%, avg 29 min late; cushion absorbs that |

If the actual Feb-2027 EIS–MIA closest to 14:30 lands after ~17:25, the return
connection drops under 2h30 and the ~12:30 EIS–MIA becomes the primary, not the
fallback.

## Fallback ladder (return Sun 7 Feb) — existence check, current schedule only

| Option | What was found | Feb 7 2027 verified? |
|--------|----------------|----------------------|
| EIS–MIA ~12:30 | Pattern supports a midday departure (4–6 daily). Number/time TBD | No |
| MIA–DFW ~18:30–19:00 → DFW–SAT ~22:15 | MIA–DFW has an evening bank (e.g. AA3259 19:35; last 21:30→00:06). DFW–SAT last departure 23:00 | No |
| MIA–AUS 19:41 → 21:43 | AA2629 currently 19:50→21:14 | No |
| MIA–AUS ~21:45 / ~22:13 → 23:59 / 00:40 | AA1427 currently 22:00→23:59; another listing 21:43→00:59 | No |

All exist in the current schedule. None verified for the actual date.

## SWU recommendation (not data-backed; C not checked)

One SWU covers one passenger's full one-way direction (up to 3 segments), so the
4 SWUs cover both directions for both passengers. Apply all four at ticketing and
waitlist whatever does not clear. If only one direction can be confirmed:

1. **Return (EIS→MIA→SAT) first.** Longest day, post-charter, immigration at
   MIA, home ~22:00 with work Monday.
2. **Within a direction, the E175 leg is the constraint.** MIA–EIS / EIS–MIA F
   has 12 seats in peak Caribbean season; the 05:00 Saturday and Sunday-evening
   737 legs to/from SAT will usually have more C. Expect the E175 legs to
   waitlist and clear late or at the gate, if at all.
3. If the ~14:30 EIS–MIA shows C0 but the ~12:30 shows C2 once checked, take
   the 12:30 — it also adds return cushion.

## Not done
- C inventory on any of the 4 segments (item 1) and on the alternate MIA–EIS /
  EIS–MIA frequencies (item 2).
- ExpertFlyer / seats.aero alerts (item 3).
- Any award J/F visibility.
