// Chart.js helpers with the dashboard theme. Palette validated (dark surface):
window.VIEWS = window.VIEWS || {};
// debt red #e66767 · live/actual blue #3987e5 · net gold #c98500 · savings aqua #199e70
window.CH = (() => {
  const colors = { debt: '#e66767', live: '#3987e5', net: '#c98500', savings: '#199e70', amber: '#d98c1f', ink: '#e8e6df', muted: '#8b939e', grid: 'rgba(232,230,223,.07)', surface: '#0c1117' };
  const font = { family: "'IBM Plex Mono', ui-monospace, Menlo, monospace", size: 11 };
  const instances = new WeakMap();

  if (window.Chart) {
    Chart.defaults.color = colors.muted;
    Chart.defaults.font = font;
    Chart.defaults.borderColor = colors.grid;
    Chart.defaults.animation = false;
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(17,22,29,.96)';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(232,230,223,.14)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.titleColor = colors.ink;
    Chart.defaults.plugins.tooltip.bodyColor = colors.ink;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.displayColors = true;
    Chart.defaults.plugins.tooltip.boxPadding = 4;
    Chart.defaults.elements.line.borderWidth = 2;
    Chart.defaults.elements.line.tension = 0.15;
    Chart.defaults.elements.point.radius = 0;
    Chart.defaults.elements.point.hoverRadius = 5;
    Chart.defaults.elements.point.hitRadius = 12;
  }

  const money = v => F.compact(v);

  // Plugin: draw the zero line + optional vertical markers {x, label, color}
  const guides = {
    id: 'guides',
    afterDraw(chart, _args, opts) {
      const { ctx, chartArea: a, scales } = chart;
      if (!a) return;
      const y = scales.y, x = scales.x;
      ctx.save();
      if (opts.zero !== false && y && y.min < 0 && y.max > 0) {
        const py = y.getPixelForValue(0);
        ctx.strokeStyle = 'rgba(232,230,223,.35)'; ctx.lineWidth = 1; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(a.left, py); ctx.lineTo(a.right, py); ctx.stroke();
      }
      for (const m of opts.markers || []) {
        if (m.x == null) continue;
        const px = x.getPixelForValue(m.x);
        if (px < a.left || px > a.right) continue;
        ctx.strokeStyle = m.color || 'rgba(232,230,223,.4)'; ctx.lineWidth = 1; ctx.setLineDash(m.dash || [3, 4]);
        ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.stroke();
        if (m.label) {
          ctx.setLineDash([]); ctx.fillStyle = m.color || colors.ink; ctx.font = `500 10px ${font.family}`; ctx.textAlign = m.align || 'left';
          ctx.fillText(m.label, px + (m.align === 'right' ? -6 : 6), a.top + 12 + (m.dy || 0));
        }
      }
      ctx.restore();
    }
  };
  const crosshair = {
    id: 'crosshair',
    afterDraw(chart) {
      const act = chart.tooltip && chart.tooltip.getActiveElements && chart.tooltip.getActiveElements();
      if (!act || !act.length || !chart.chartArea) return;
      const { ctx, chartArea: a } = chart; const x = act[0].element.x;
      ctx.save(); ctx.strokeStyle = 'rgba(232,230,223,.25)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(x, a.top); ctx.lineTo(x, a.bottom); ctx.stroke(); ctx.restore();
    }
  };

  function make(canvas, config) {
    if (!canvas || !window.Chart) return null;
    const prev = instances.get(canvas); if (prev) prev.destroy();
    config.plugins = [guides, crosshair, ...(config.plugins || [])];
    const c = new Chart(canvas.getContext('2d'), config);
    instances.set(canvas, c);
    return c;
  }

  const yMoney = (extra = {}) => ({ grid: { color: colors.grid }, border: { display: false }, ticks: { callback: money, maxTicksLimit: 6, padding: 6 }, ...extra });
  const xClean = (extra = {}) => ({ grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0, autoSkip: true, padding: 6 }, ...extra });

  return { colors, make, money, yMoney, xClean };
})();
