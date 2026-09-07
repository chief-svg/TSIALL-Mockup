// Formatting helpers (all pure).
window.F = (() => {
  const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct1 = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

  const money = (n, cents = false) => (n == null || isNaN(n)) ? '—' : (cents ? usd2 : usd0).format(n);
  // Signed, with unicode minus for negatives
  const signed = (n, cents = false) => {
    if (n == null || isNaN(n)) return '—';
    const s = money(Math.abs(n), cents);
    return n < 0 ? '−' + s : n > 0 ? '+' + s : s;
  };
  const compact = n => {
    if (n == null || isNaN(n)) return '—';
    const a = Math.abs(n);
    const s = a >= 1e6 ? (a / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M' : a >= 1e3 ? (a / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'k' : a.toFixed(0);
    return (n < 0 ? '−$' : '$') + s;
  };
  const pct = n => (n == null || isNaN(n)) ? '—' : pct1.format(n);

  // Dates are handled as 'YYYY-MM-DD' strings to avoid timezone drift.
  const pad = n => String(n).padStart(2, '0');
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => toISO(new Date());
  const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
  const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
  const monthStart = iso => iso.slice(0, 7) + '-01';
  const monthEnd = iso => { const d = parseISO(iso); return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };
  const daysInMonth = iso => parseISO(monthEnd(iso)).getDate();
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = (iso, opts = {}) => {
    if (!iso) return '—';
    const d = parseISO(iso);
    const base = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
    return opts.year === false ? base : `${base}, ${d.getFullYear()}`;
  };
  const fmtMonth = iso => { const d = parseISO(iso.length === 7 ? iso + '-01' : iso); return `${MONTHS[d.getMonth()]} ’${String(d.getFullYear()).slice(2)}`; };
  const weekday = iso => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseISO(iso).getDay()];
  const fmtTime = d => d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  const perDay = iso => (window.PLAN ? window.PLAN.living.monthly : 0) / daysInMonth(iso || today());
  return { money, signed, compact, pct, perDay, toISO, parseISO, today, addDays, daysBetween, monthStart, monthEnd, daysInMonth, fmtDate, fmtMonth, weekday, fmtTime, esc, clamp, MONTHS };
})();
