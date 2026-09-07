// Bundles the app into one self-contained HTML body for publishing as a
// claude.ai artifact:  node hosted/build.js  → hosted/dist/command.html
const fs = require('fs'), path = require('path');
const PUB = path.join(__dirname, '..', 'public');
const r = p => fs.readFileSync(path.join(PUB, p), 'utf8');
const html = r('index.html');
const body = html.slice(html.indexOf('<header'), html.indexOf('<script src='));
const scripts = ['js/plan.js', 'js/format.js', 'js/store.js', 'js/engine.js', 'js/charts.js', 'js/views/command.js', 'js/views/payoff.js', 'js/views/spending.js', 'js/views/projection.js', 'js/views/after.js', 'js/views/allocate.js', 'js/views/million.js', 'js/views/accounts.js'].map(r)
  .concat([fs.readFileSync(path.join(__dirname, 'runtime.js'), 'utf8'), r('js/app.js')]).join('\n;\n');
const chart = r('vendor/chart.umd.js');
for (const s of [scripts, chart]) if (/<\/script/i.test(s)) throw new Error('script terminator inside bundle');
const out = `<title>Command</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;1,8..60,300;1,8..60,400&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
${r('css/app.css')}
</style>
${body}
<script>
${chart}
</script>
<script>
${scripts}
</script>
`;
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'command.html'), out);
console.log('hosted/dist/command.html', Math.round(out.length / 1024) + ' KB');
