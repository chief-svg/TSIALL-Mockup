#!/usr/bin/env node
// Daily-sync helper for the scheduled Routine.
//   node finance/hosted/sync-compact.js --out /tmp/sync [--snapshots existing.json] file1.json file2.json ...
// Inputs: raw PocketSmith connector results saved to files (accounts, categories,
// transactions pages, events) in any order / any wrapper. Outputs in --out:
//   cache.json      → value for artifact db doc  state/cache
//   snapshots.json  → value for artifact db doc  state/snapshots (merged with --snapshots)
//   summary.txt     → one-paragraph human summary (for the notification)
const fs = require('fs'), path = require('path');
global.window = global;
require('../public/js/plan.js'); require('../public/js/format.js'); require('../public/js/engine.js');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const out = opt('--out', '/tmp/sync');
const snapFile = opt('--snapshots', null);
const files = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out' && args[i - 1] !== '--snapshots');
if (!files.length) { console.error('no input files'); process.exit(2); }

function parseLoose(text) {
  const i = [text.indexOf('['), text.indexOf('{')].filter(x => x >= 0).sort((a, b) => a - b)[0];
  if (i == null) throw new Error('no JSON found');
  return JSON.parse(text.slice(i));
}
function unwrap(v) {
  // MCP content wrappers: [{type:'text',text}] or {content:[...]} or {text}
  if (Array.isArray(v) && v.length && v.every(b => b && b.type === 'text' && typeof b.text === 'string')) return parseLoose(v.map(b => b.text).join('\n'));
  if (v && Array.isArray(v.content)) return unwrap(v.content);
  if (v && typeof v.text === 'string' && !v.amount) return parseLoose(v.text);
  if (v && v.payload != null) return typeof v.payload === 'string' ? parseLoose(v.payload) : v.payload;
  return v;
}
const data = { accounts: [], categories: [], transactions: [], events: [] };
for (const f of files) {
  let v; try { v = unwrap(parseLoose(fs.readFileSync(f, 'utf8'))); } catch (e) { console.error('skip', f, e.message); continue; }
  if (!Array.isArray(v)) { console.error('skip (not an array)', f); continue; }
  if (!v.length) continue;
  const s = v[0];
  if (s.current_balance !== undefined && s.title !== undefined) data.accounts = v;
  else if (s.amount !== undefined && s.transaction_account !== undefined) data.transactions.push(...v);
  else if (s.amount !== undefined && (s.scenario !== undefined || s.series_id !== undefined)) data.events.push(...v);
  else if (s.title !== undefined && (s.children !== undefined || s.is_transfer !== undefined)) data.categories = v;
  else console.error('skip (unrecognised shape)', f);
}
if (!data.accounts.length) { console.error('no accounts found — refusing to write a cache without balances'); process.exit(3); }
// dedupe transactions by id
const seen = new Set(); data.transactions = data.transactions.filter(t => !seen.has(t.id) && seen.add(t.id));

const compact = t => ({ id: t.id, date: t.date, amount: Number(t.amount), payee: t.payee, original_payee: t.original_payee, memo: t.memo, type: t.type, status: t.status, is_transfer: t.is_transfer, category: t.category ? { id: t.category.id, title: t.category.title, is_transfer: t.category.is_transfer, is_bill: t.category.is_bill } : null, transaction_account: t.transaction_account ? { id: t.transaction_account.id, account_id: t.transaction_account.account_id } : null });
const slimAccount = a => ({ id: a.id, title: a.title, type: a.type, current_balance: a.current_balance, current_balance_date: a.current_balance_date, primary_transaction_account: a.primary_transaction_account ? { id: a.primary_transaction_account.id, number: a.primary_transaction_account.number, institution: a.primary_transaction_account.institution ? { title: a.primary_transaction_account.institution.title, colour: a.primary_transaction_account.institution.colour } : null } : null });
const slimEvent = e => ({ id: e.id, date: e.date, amount: e.amount, note: e.note, repeat_type: e.repeat_type, category: e.category ? { title: e.category.title } : null, scenario: e.scenario ? { title: e.scenario.title, account_id: e.scenario.account_id } : null });
const now = Date.now();
const payload = { accounts: data.accounts.map(slimAccount), categories: data.categories, transactions: data.transactions.map(compact), events: data.events.map(slimEvent), fetchedAt: now, syncedBy: 'routine' };

// Snapshot + summary via the same engine the page uses
const prev = snapFile && fs.existsSync(snapFile) ? (() => { try { const j = JSON.parse(fs.readFileSync(snapFile, 'utf8')); return j.value || j; } catch { return {}; } })() : {};
const ctx = ENGINE.buildContext({ ...payload, snapshots: prev });
const snapshots = ENGINE.recordSnapshot(ctx, prev);
const sched = ENGINE.schedule(ctx);
const ledger = ENGINE.monthLedger(ctx);
const sims = ENGINE.simulateAll(ctx, sched, ledger);
const funds = ENGINE.fundsCheck(ctx, sched, ledger);
const next = sched.groups.filter(g => g.status !== 'done').slice(0, 2);
const t = ctx.totals;
const line = g => { const need = g.items.filter(x => x.status !== 'done').reduce((s, x) => s + x.amount, 0); const f = funds.find(x => x.date === g.date); return `${F.money(need)} on ${F.fmtDate(g.date, { year: false })} (${g.daysUntil === 0 ? 'today' : g.daysUntil > 0 ? 'in ' + g.daysUntil + 'd' : (-g.daysUntil) + 'd overdue'}) → ${g.items.filter(x => x.status !== 'done').map(x => (x.acct ? x.acct.short : 'buffer') + ' ' + F.money(x.amount)).join(', ')}${g.kills.length ? ' · kills ' + g.kills.join(', ') : ''}${f ? (f.ok ? ' · funds covered' : ' · SHORT ' + F.money(-f.gap)) : ''}`; };
const living = ENGINE.livingTracker(ctx);
const summary = [
  `Synced ${F.fmtDate(ctx.today)}: debt ${F.money(t.debt)} (drift vs plan ${F.signed(ENGINE.projectionSeries(ctx).drift)}), checking ${F.money(t.cash)}, net ${F.money(t.net)}.`,
  next.length ? `Next: ${next.map(line).join(' | ')}.` : 'All planned payments matched.',
  `Living: ${F.money(living.actual)} vs ${F.money(living.budgetToDate)} budget (${(living.ratio * 100).toFixed(0)}% of pace).`,
  sims.debtFree ? `Debt-free ${F.fmtDate(sims.debtFree)}.` : `Plan underfunded by ${F.money(sims.totalShortfall)}.`,
  `${payload.transactions.length} transactions, ${payload.accounts.length} accounts.`
].join(' ');

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'cache.json'), JSON.stringify({ value: { at: now, payload }, at: now }));
fs.writeFileSync(path.join(out, 'snapshots.json'), JSON.stringify({ value: snapshots, at: now }));
fs.writeFileSync(path.join(out, 'summary.txt'), summary + '\n');
console.log(summary);
console.log(`\nwrote ${out}/cache.json (${Math.round(fs.statSync(path.join(out, 'cache.json')).size / 1024)} KB), snapshots.json (${Object.keys(snapshots).length} days), summary.txt`);
