// Generates the Balcony Oasis mockups: four concept artboards + a brief board
// (as Design Component .dc.html files for the canvas) and a plain index.html.
// Balcony: 162" long rail side, 74" deep, 43" rail with 3" posts, top floor, San Antonio.
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const IN = 6; // px per inch, elevation
const L = 162, D = 74, RAIL = 43, POST = 3, MESH = 4;

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const r2 = (n) => Math.round(n * 100) / 100;

// ---------- drawing primitives (elevation, straight-on view of the long rail) ----------
const EL = { w: 1040, h: 560, x0: 34, floor: 470 };
EL.railTop = EL.floor - RAIL * IN;

function backdrop(c) {
  const rnd = rng(11);
  let s = `<rect x="0" y="0" width="${EL.w}" height="${EL.floor}" fill="${c.sky}"/>`;
  // distant city: soft blocks in the brick tones of the real view
  const tones = c.city;
  let x = -20;
  while (x < EL.w + 40) {
    const w = 90 + rnd() * 160, h = 120 + rnd() * 200;
    const y = EL.railTop + 40 - h + rnd() * 60;
    const t = tones[Math.floor(rnd() * tones.length)];
    s += `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h + 400)}" fill="${t}"/>`;
    for (let wy = y + 24; wy < EL.railTop + 60; wy += 34) for (let wx = x + 14; wx < x + w - 20; wx += 30)
      s += `<rect x="${r2(wx)}" y="${r2(wy)}" width="14" height="18" fill="${c.window}"/>`;
    x += w + 8 + rnd() * 30;
  }
  s += `<rect x="0" y="0" width="${EL.w}" height="${EL.floor}" fill="${c.haze}"/>`;
  return s;
}

function rail(c) {
  const { x0, railTop, floor } = EL;
  const railBottom = floor - 4 * IN; // bottom rail sits ~4" up
  let s = '';
  // mesh
  s += `<g stroke="${c.rail}" stroke-width="1.3" opacity=".9">`;
  for (let i = 0; i <= L / MESH; i++) { const x = x0 + i * MESH * IN; s += `<line x1="${x}" y1="${railTop}" x2="${x}" y2="${railBottom}"/>`; }
  for (let y = railTop; y <= railBottom; y += MESH * IN) s += `<line x1="${x0}" y1="${y}" x2="${x0 + L * IN}" y2="${y}"/>`;
  s += `</g>`;
  // bottom rail, top rail cap, posts
  s += `<rect x="${x0}" y="${railBottom - 8}" width="${L * IN}" height="8" fill="${c.rail}"/>`;
  for (const p of [0, 54, 108, 162]) { const x = x0 + p * IN - (p === 162 ? POST * IN : 0); s += `<rect x="${x}" y="${railTop}" width="${POST * IN}" height="${floor - railTop}" fill="${c.rail}"/>`; }
  s += `<rect x="${x0 - 4}" y="${railTop - 6}" width="${L * IN + 8}" height="12" rx="2" fill="${c.railCap}"/>`;
  return s;
}

function floorBand(c) {
  return `<rect x="0" y="${EL.floor}" width="${EL.w}" height="${EL.h - EL.floor}" fill="${c.floor}"/>` +
    `<rect x="0" y="${EL.floor}" width="${EL.w}" height="3" fill="${c.floorEdge}"/>`;
}

const POTS = {
  stone: { fill: '#d9d1c0', edge: '#b9ae99', rim: '#e6dfd0' },
  terracotta: { fill: '#c9764e', edge: '#a95d3b', rim: '#d98a62' },
  zinc: { fill: '#a3a8ab', edge: '#7c8285', rim: '#b9bec1' },
  charcoal: { fill: '#3b3e41', edge: '#232527', rim: '#4b4f53' },
  wood: { fill: '#946d47', edge: '#6d4d30', rim: '#a87f57' },
  black: { fill: '#26282a', edge: '#121314', rim: '#3a3d40' },
};

function trough(x, y, w, h, style) {
  const p = POTS[style];
  let s = `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="${p.fill}" stroke="${p.edge}" stroke-width="2"/>`;
  s += `<rect x="${r2(x - 3)}" y="${r2(y)}" width="${r2(w + 6)}" height="9" fill="${p.rim}" stroke="${p.edge}" stroke-width="1.5"/>`;
  if (style === 'wood') for (let i = 1; i < 4; i++) s += `<line x1="${r2(x)}" y1="${r2(y + i * h / 4)}" x2="${r2(x + w)}" y2="${r2(y + i * h / 4)}" stroke="${p.edge}" stroke-width="1"/>`;
  return s;
}

function pot(cx, base, w, h, style) {
  const p = POTS[style];
  const x = cx - w / 2;
  let s = `<path d="M${r2(x)} ${r2(base - h)} L${r2(x + w)} ${r2(base - h)} L${r2(x + w - w * .12)} ${r2(base)} L${r2(x + w * .12)} ${r2(base)} Z" fill="${p.fill}" stroke="${p.edge}" stroke-width="2"/>`;
  s += `<rect x="${r2(x - 4)}" y="${r2(base - h)}" width="${r2(w + 8)}" height="12" rx="2" fill="${p.rim}" stroke="${p.edge}" stroke-width="1.5"/>`;
  return s;
}

function hedge(x, y, w, h, greens, seed, shape = 'clipped') {
  const rnd = rng(seed);
  let s = '';
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    const ry = y + h - (r + 0.5) * (h / rows);
    const g = greens[Math.min(Math.floor(r * greens.length / rows), greens.length - 1)];
    const off = (r % 2) * 7;
    for (let px = x + 6 + off; px < x + w - 4; px += 11) {
      const rx = 10 + rnd() * 7, ryy = 8 + rnd() * 6;
      s += `<ellipse cx="${r2(px + rnd() * 5)}" cy="${r2(ry + (rnd() - .5) * 14)}" rx="${r2(rx)}" ry="${r2(ryy)}" fill="${rnd() < .25 ? greens[Math.floor(rnd() * greens.length)] : g}"/>`;
    }
  }
  if (shape === 'ball') for (let i = 0; i < 12; i++) s += `<ellipse cx="${r2(x + w / 2 + (rnd() - .5) * w * .6)}" cy="${r2(y + 10 + rnd() * 8)}" rx="${r2(6 + rnd() * 4)}" ry="${r2(5 + rnd() * 2)}" fill="${greens[greens.length - 1]}"/>`;
  if (shape === 'clipped') for (let px = x + 4; px < x + w - 4; px += 9) s += `<ellipse cx="${r2(px + rnd() * 4)}" cy="${r2(y + 5 + rnd() * 4)}" rx="${r2(7 + rnd() * 4)}" ry="${r2(4 + rnd() * 2)}" fill="${greens[greens.length - 1]}"/>`;
  for (let i = 0; i < w / 5; i++) s += `<circle cx="${r2(x + 6 + rnd() * (w - 12))}" cy="${r2(y + 6 + rnd() * (h - 10))}" r="${r2(1.4 + rnd() * 1.8)}" fill="${rnd() < .5 ? greens[0] : greens[greens.length - 1]}" opacity=".8"/>`;
  return s;
}

function vine(x, yBottom, yTop, o, seed) {
  const rnd = rng(seed);
  let s = '';
  const strands = o.strands ?? 3;
  for (let k = 0; k < strands; k++) {
    let px = x + (k - (strands - 1) / 2) * 16, py = yBottom;
    const pts = [[px, py]];
    let d = `M${r2(px)} ${r2(py)}`;
    while (py > yTop) {
      const ny = Math.max(yTop, py - 40 - rnd() * 30);
      const nx = px + (rnd() - 0.5) * 70 + (k - (strands - 1) / 2) * 6;
      const cx = px + (rnd() - 0.5) * 50, cy = (py + ny) / 2;
      d += ` Q${r2(cx)} ${r2(cy)} ${r2(nx)} ${r2(ny)}`;
      pts.push([nx, ny]); px = nx; py = ny;
    }
    s += `<path d="${d}" fill="none" stroke="${o.stem}" stroke-width="2.2" stroke-linecap="round"/>`;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      for (let t = 0.15; t < 1; t += 0.28) {
        const lx = ax + (bx - ax) * t + (rnd() - 0.5) * 22, ly = ay + (by - ay) * t + (rnd() - 0.5) * 12;
        const rot = -60 + rnd() * 120;
        s += `<ellipse cx="${r2(lx)}" cy="${r2(ly)}" rx="${o.leaf[0]}" ry="${o.leaf[1]}" transform="rotate(${r2(rot)} ${r2(lx)} ${r2(ly)})" fill="${o.leafFill[Math.floor(rnd() * o.leafFill.length)]}"/>`;
        if (o.flower && rnd() < (o.flowerRate ?? 0.5)) s += flower(lx + (rnd() - .5) * 14, ly + (rnd() - .5) * 14, o.flower, rnd);
      }
    }
  }
  return s;
}

function flower(x, y, f, rnd) {
  if (f.kind === 'bract') { // bougainvillea: three papery bracts
    let s = '';
    for (let i = 0; i < 3; i++) { const a = i * 120 + rnd() * 30; s += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="7" ry="4" transform="rotate(${r2(a)} ${r2(x)} ${r2(y)}) translate(5 0)" fill="${f.color}" opacity=".95"/>`; }
    return s;
  }
  if (f.kind === 'star') { // jasmine pinwheel
    let s = '';
    for (let i = 0; i < 5; i++) { const a = i * 72 + rnd() * 10; s += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="4.2" ry="1.9" transform="rotate(${r2(a)} ${r2(x)} ${r2(y)}) translate(3.2 0)" fill="${f.color}"/>`; }
    return s + `<circle cx="${r2(x)}" cy="${r2(y)}" r="1.3" fill="${f.center ?? '#f4e39a'}"/>`;
  }
  if (f.kind === 'cluster') { // lantana / geranium heads
    let s = '';
    for (let i = 0; i < 7; i++) { const a = rnd() * 6.28, d = rnd() * 6; s += `<circle cx="${r2(x + Math.cos(a) * d)}" cy="${r2(y + Math.sin(a) * d)}" r="2.6" fill="${f.color}"/>`; }
    return s;
  }
  if (f.kind === 'spike') { // lavender
    let s = `<line x1="${r2(x)}" y1="${r2(y + 16)}" x2="${r2(x)}" y2="${r2(y - 6)}" stroke="${f.stem ?? '#8a9a6a'}" stroke-width="1.4"/>`;
    for (let i = 0; i < 5; i++) s += `<ellipse cx="${r2(x)}" cy="${r2(y - 4 + i * 3.4)}" rx="3" ry="2" fill="${f.color}"/>`;
    return s;
  }
  if (f.kind === 'berry') return `<circle cx="${r2(x)}" cy="${r2(y)}" r="3.6" fill="${f.color}"/><circle cx="${r2(x - 1.2)}" cy="${r2(y - 1.2)}" r="1" fill="#fff" opacity=".6"/>`;
  return `<circle cx="${r2(x)}" cy="${r2(y)}" r="3.4" fill="${f.color}"/>`;
}

function hangingPlanter(cx, w, o, seed) {
  const rnd = rng(seed);
  const p = POTS[o.style];
  const top = EL.railTop - 4, h = 8 * IN, x = cx - w / 2;
  let s = '';
  // trailing growth first (behind the box front? no: it spills over the front)
  const drops = Math.max(4, Math.round(w / 22));
  for (let i = 0; i < drops; i++) {
    const sx = x + 8 + (w - 16) * (i / (drops - 1)) + (rnd() - .5) * 8;
    const len = o.trailLen[0] + rnd() * (o.trailLen[1] - o.trailLen[0]);
    const ex = sx + (rnd() - .5) * 26, ey = top + h + len;
    const d = `M${r2(sx)} ${r2(top + h - 2)} Q${r2(sx + (rnd() - .5) * 30)} ${r2(top + h + len * .55)} ${r2(ex)} ${r2(ey)}`;
    s += `<path d="${d}" fill="none" stroke="${o.trailStem}" stroke-width="1.8"/>`;
    const n = Math.round(len / 13);
    for (let k = 1; k <= n; k++) {
      const t = k / n, lx = sx + (ex - sx) * t + (rnd() - .5) * 12, ly = top + h + len * t;
      s += `<ellipse cx="${r2(lx)}" cy="${r2(ly)}" rx="${o.trailLeaf[0]}" ry="${o.trailLeaf[1]}" transform="rotate(${r2(rnd() * 360)} ${r2(lx)} ${r2(ly)})" fill="${o.trailFill[Math.floor(rnd() * o.trailFill.length)]}"/>`;
      if (o.trailFlower && rnd() < .3) s += flower(lx + 5, ly, o.trailFlower, rnd);
    }
  }
  // box + rail hook
  s += `<rect x="${r2(x)}" y="${r2(top)}" width="${r2(w)}" height="${r2(h)}" rx="2" fill="${p.fill}" stroke="${p.edge}" stroke-width="2"/>`;
  s += `<rect x="${r2(x - 2)}" y="${r2(top)}" width="${r2(w + 4)}" height="7" fill="${p.rim}" stroke="${p.edge}" stroke-width="1.2"/>`;
  s += `<rect x="${r2(x + 10)}" y="${r2(top - 10)}" width="4" height="12" fill="${p.edge}"/><rect x="${r2(x + w - 14)}" y="${r2(top - 10)}" width="4" height="12" fill="${p.edge}"/>`;
  // upright bloom mound above box
  for (let i = 0; i < w / 7; i++) {
    const bx = x + 6 + rnd() * (w - 12), by = top - 6 - rnd() * 26;
    s += `<ellipse cx="${r2(bx)}" cy="${r2(by + 8)}" rx="6" ry="4.5" fill="${o.moundFill[Math.floor(rnd() * o.moundFill.length)]}"/>`;
    if (o.moundFlower && rnd() < .7) s += flower(bx, by, o.moundFlower, rnd);
  }
  return s;
}

function tree(kind, cx, base, o, seed) {
  const rnd = rng(seed);
  let s = pot(cx, base, o.potW, o.potH, o.pot);
  const soil = base - o.potH;
  if (kind === 'olive') {
    s += `<path d="M${cx - 3} ${soil} C${cx - 8} ${soil - 60} ${cx + 8} ${soil - 90} ${cx + 2} ${soil - 150}" fill="none" stroke="#7d6a50" stroke-width="7" stroke-linecap="round"/>`;
    s += `<path d="M${cx} ${soil - 100} C${cx + 30} ${soil - 120} ${cx + 32} ${soil - 150} ${cx + 44} ${soil - 175}" fill="none" stroke="#7d6a50" stroke-width="4"/>`;
    s += `<path d="M${cx} ${soil - 110} C${cx - 30} ${soil - 130} ${cx - 36} ${soil - 150} ${cx - 46} ${soil - 170}" fill="none" stroke="#7d6a50" stroke-width="4"/>`;
    const fills = ['#8f9a80', '#a9b39a', '#7a8669', '#c1c8b3'];
    for (let i = 0; i < 90; i++) {
      const a = rnd() * 6.28, d = rnd() * 78, x = cx + Math.cos(a) * d * 1.05, y = soil - 195 + Math.sin(a) * d * .8;
      s += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="9" ry="3.2" transform="rotate(${r2(rnd() * 180)} ${r2(x)} ${r2(y)})" fill="${fills[Math.floor(rnd() * 4)]}"/>`;
    }
  } else if (kind === 'cypress') {
    const H = o.height ?? 330, W = 46;
    s += `<path d="M${cx} ${soil - H} C${cx + W * .45} ${soil - H * .7} ${cx + W * .55} ${soil - H * .3} ${cx + W * .42} ${soil} L${cx - W * .42} ${soil} C${cx - W * .55} ${soil - H * .3} ${cx - W * .45} ${soil - H * .7} ${cx} ${soil - H} Z" fill="#3f5b3c"/>`;
    for (let i = 0; i < 70; i++) {
      const t = rnd(), y = soil - H * t, wAt = W * .42 * (t < .5 ? 1 - (0.5 - t) * .5 : (1 - t) * 1.6 + .2);
      const x = cx + (rnd() - .5) * 2 * wAt;
      s += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="4" ry="9" fill="${rnd() < .5 ? '#4c6b46' : '#31492f'}" transform="rotate(${r2((rnd() - .5) * 30)} ${r2(x)} ${r2(y)})"/>`;
    }
  } else if (kind === 'lemon' || kind === 'bay') {
    s += `<rect x="${cx - 4}" y="${soil - 70}" width="8" height="70" fill="#7a6247"/>`;
    const fills = kind === 'lemon' ? ['#4e7a3e', '#6a9652', '#3e6431'] : ['#3f5f3a', '#557a4d', '#2f4a2c'];
    const R = kind === 'lemon' ? 74 : 56;
    for (let i = 0; i < 110; i++) {
      const a = rnd() * 6.28, d = Math.sqrt(rnd()) * R, x = cx + Math.cos(a) * d, y = soil - 70 - R * .9 + Math.sin(a) * d * .95;
      s += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="8" ry="4.5" transform="rotate(${r2(rnd() * 180)} ${r2(x)} ${r2(y)})" fill="${fills[Math.floor(rnd() * 3)]}"/>`;
    }
    if (kind === 'lemon') for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * R * .8; s += `<ellipse cx="${r2(cx + Math.cos(a) * d)}" cy="${r2(soil - 70 - R * .9 + Math.sin(a) * d)}" rx="6" ry="7.5" fill="#ecc84a"/>`; }
  } else if (kind === 'fig') {
    s += `<path d="M${cx} ${soil} C${cx - 6} ${soil - 50} ${cx + 6} ${soil - 80} ${cx} ${soil - 120}" fill="none" stroke="#8b7a66" stroke-width="8" stroke-linecap="round"/>`;
    for (const [dx, dy] of [[-40, -95], [42, -105], [-22, -150], [26, -160], [0, -135]]) s += `<path d="M${cx} ${soil - 90} Q${cx + dx * .5} ${soil + dy * .8} ${cx + dx} ${soil + dy}" fill="none" stroke="#8b7a66" stroke-width="4"/>`;
    for (let i = 0; i < 22; i++) {
      const a = rnd() * 6.28, d = 20 + rnd() * 70, x = cx + Math.cos(a) * d * 1.1, y = soil - 150 + Math.sin(a) * d * .75;
      const rot = rnd() * 360;
      s += `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${r2(rot)})"><path d="M0 -20 C10 -22 18 -10 14 0 C20 6 14 20 4 16 C0 24 -6 22 -6 14 C-16 18 -22 6 -14 0 C-20 -10 -10 -22 0 -20 Z" fill="${rnd() < .5 ? '#5b8049' : '#4a6b3b'}" stroke="#3d5a31" stroke-width="1"/></g>`;
    }
  }
  return s;
}

function chairs(c) {
  // the existing black iron chairs with white cushions, in the foreground
  const y = EL.floor - 14;
  const one = (x) => `<g transform="translate(${x} ${y})">
    <path d="M6 0 C6 -60 78 -60 78 0" fill="none" stroke="${c.iron}" stroke-width="3"/>
    ${[18, 30, 42, 54, 66].map(px => `<line x1="${px}" y1="-6" x2="${px}" y2="-${44 - Math.abs(px - 42) * .5}" stroke="${c.iron}" stroke-width="1.6"/>`).join('')}
    <rect x="2" y="-10" width="80" height="14" rx="6" fill="${c.cushion}" stroke="${c.iron}" stroke-width="1.5"/>
    <line x1="10" y1="4" x2="6" y2="34" stroke="${c.iron}" stroke-width="2.5"/><line x1="74" y1="4" x2="78" y2="34" stroke="${c.iron}" stroke-width="2.5"/>
  </g>`;
  const table = (x) => `<g transform="translate(${x} ${y})"><ellipse cx="30" cy="-26" rx="30" ry="6" fill="${c.tableTop}" stroke="${c.iron}" stroke-width="1.5"/><line x1="30" y1="-20" x2="30" y2="32" stroke="${c.iron}" stroke-width="3"/><path d="M12 32 Q30 22 48 32" fill="none" stroke="${c.iron}" stroke-width="2.5"/></g>`;
  return one(330) + table(430) + one(500);
}

function spindleChair(x, y, c, scale = 1) {
  // high curved back of vertical spindles, hairpin arms, thin splayed legs, white cushion with black piping
  const W = 29 * IN * scale, seatH = 16.5 * IN * scale, backH = 30.75 * IN * scale;
  let s = `<g transform="translate(${x} ${y})">`;
  s += `<path d="M${W * .08} ${-seatH} C${W * .02} ${-backH * .55} ${W * .12} ${-backH} ${W * .5} ${-backH} C${W * .88} ${-backH} ${W * .98} ${-backH * .55} ${W * .92} ${-seatH}" fill="none" stroke="${c.iron}" stroke-width="3"/>`;
  for (let i = 1; i < 9; i++) { const px = W * .12 + (W * .76) * i / 9; const top = -backH + Math.abs(i - 4.5) * 4; s += `<line x1="${r2(px)}" y1="${-seatH + 2}" x2="${r2(px)}" y2="${r2(top + 6)}" stroke="${c.iron}" stroke-width="1.6"/>`; }
  s += `<path d="M${W * .04} ${-seatH - 8} C${-W * .06} ${-seatH - 34} ${W * .18} ${-seatH - 44} ${W * .22} ${-seatH - 30}" fill="none" stroke="${c.iron}" stroke-width="2.6"/><path d="M${W * .96} ${-seatH - 8} C${W * 1.06} ${-seatH - 34} ${W * .82} ${-seatH - 44} ${W * .78} ${-seatH - 30}" fill="none" stroke="${c.iron}" stroke-width="2.6"/>`;
  s += `<rect x="${W * .02}" y="${-seatH - 4}" width="${W * .96}" height="${5 * IN * scale}" rx="7" fill="${c.cushion}" stroke="${c.iron}" stroke-width="2"/><rect x="${W * .02 + 5}" y="${-seatH + 1}" width="${W * .96 - 10}" height="${5 * IN * scale - 10}" rx="5" fill="none" stroke="${c.iron}" stroke-width="1"/>`;
  s += `<line x1="${W * .1}" y1="${-seatH + 5 * IN * scale}" x2="${W * .04}" y2="0" stroke="${c.iron}" stroke-width="2.6"/><line x1="${W * .9}" y1="${-seatH + 5 * IN * scale}" x2="${W * .96}" y2="0" stroke="${c.iron}" stroke-width="2.6"/><line x1="${W * .3}" y1="${-seatH + 5 * IN * scale}" x2="${W * .28}" y2="0" stroke="${c.iron}" stroke-width="2"/><line x1="${W * .7}" y1="${-seatH + 5 * IN * scale}" x2="${W * .72}" y2="0" stroke="${c.iron}" stroke-width="2"/>`;
  return s + `</g>`;
}

function spindleSofa(x, y, c, len = 76) {
  const W = len * IN, seatH = 17 * IN, backH = 30.75 * IN;
  let s = `<g transform="translate(${x} ${y})">`;
  // frame: low back rail of spindles, hairpin arms
  s += `<path d="M10 ${-seatH} C4 ${-backH * .7} 8 ${-backH} 24 ${-backH} L${W - 24} ${-backH} C${W - 8} ${-backH} ${W - 4} ${-backH * .7} ${W - 10} ${-seatH}" fill="none" stroke="${c.iron}" stroke-width="3"/>`;
  for (let px = 30; px < W - 20; px += 14) s += `<line x1="${px}" y1="${-seatH + 2}" x2="${px}" y2="${-backH + 3}" stroke="${c.iron}" stroke-width="1.5"/>`;
  s += `<path d="M6 ${-seatH - 6} C-6 ${-seatH - 38} 22 ${-seatH - 50} 30 ${-seatH - 34}" fill="none" stroke="${c.iron}" stroke-width="2.6"/><path d="M${W - 6} ${-seatH - 6} C${W + 6} ${-seatH - 38} ${W - 22} ${-seatH - 50} ${W - 30} ${-seatH - 34}" fill="none" stroke="${c.iron}" stroke-width="2.6"/>`;
  // back bolster cushion + seat cushion, white with black piping
  s += `<rect x="16" y="${-backH + 10}" width="${W - 32}" height="${backH - seatH - 4}" rx="18" fill="${c.cushion}" stroke="${c.iron}" stroke-width="2"/><rect x="22" y="${-backH + 16}" width="${W - 44}" height="${backH - seatH - 16}" rx="14" fill="none" stroke="${c.iron}" stroke-width="1"/>`;
  s += `<rect x="4" y="${-seatH - 4}" width="${W - 8}" height="${5 * IN}" rx="8" fill="${c.cushion}" stroke="${c.iron}" stroke-width="2"/><rect x="10" y="${-seatH + 1}" width="${W - 20}" height="${5 * IN - 10}" rx="6" fill="none" stroke="${c.iron}" stroke-width="1"/>`;
  for (const px of [W / 3, 2 * W / 3]) s += `<line x1="${r2(px)}" y1="${-seatH - 2}" x2="${r2(px)}" y2="${-seatH + 5 * IN - 6}" stroke="${c.iron}" stroke-width="1" opacity=".5"/>`;
  s += `<line x1="14" y1="${-seatH + 5 * IN}" x2="8" y2="0" stroke="${c.iron}" stroke-width="2.6"/><line x1="${W - 14}" y1="${-seatH + 5 * IN}" x2="${W - 8}" y2="0" stroke="${c.iron}" stroke-width="2.6"/><line x1="${W * .38}" y1="${-seatH + 5 * IN}" x2="${W * .37}" y2="0" stroke="${c.iron}" stroke-width="2"/><line x1="${W * .62}" y1="${-seatH + 5 * IN}" x2="${W * .63}" y2="0" stroke="${c.iron}" stroke-width="2"/>`;
  return s + `</g>`;
}

function pillow(x, y, w, h, fill, c) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${c.iron}" stroke-width="1" transform="rotate(-6 ${x + w / 2} ${y + h / 2})"/>`;
}

function stringLights(c) {
  let s = '';
  const spans = [[EL.x0 + 40, 30], [EL.x0 + 54 * IN + 9, 26], [EL.x0 + 108 * IN + 9, 26], [EL.x0 + L * IN - 40, 30]];
  for (let i = 0; i < spans.length - 1; i++) {
    const [ax, ay] = spans[i], [bx, by] = spans[i + 1];
    s += `<path d="M${ax} ${ay} Q${(ax + bx) / 2} ${ay + 70} ${bx} ${by}" fill="none" stroke="#1a1a1a" stroke-width="1.6"/>`;
    for (let t = .08; t < .97; t += .11) {
      const x = ax + (bx - ax) * t, y = ay + (by - ay) * t + 4 * t * (1 - t) * 70 * .5 * 2;
      s += `<circle cx="${r2(x)}" cy="${r2(y + 9)}" r="9" fill="${c.glow}" opacity=".25"/><circle cx="${r2(x)}" cy="${r2(y + 9)}" r="3.4" fill="${c.bulb}"/>`;
    }
  }
  return s;
}

// ---------- plan view (74 x 162, wall side at the bottom) ----------
const PL = { s: 4, mx: 46, my: 42 };
function plan(c, o) {
  const s = PL.s, X = (i) => PL.mx + i * s, Y = (i) => PL.my + i * s;
  const W = L * s, H = D * s;
  const vb = `0 0 ${W + PL.mx * 2} ${H + PL.my + 60}`;
  let g = `<rect x="${X(0)}" y="${Y(0)}" width="${W}" height="${H}" fill="${c.planFloor}" stroke="${c.ink}" stroke-width="1"/>`;
  // rails on three sides
  g += `<g fill="${c.rail}"><rect x="${X(0)}" y="${Y(0)}" width="${W}" height="${3 * s}"/><rect x="${X(0)}" y="${Y(0)}" width="${3 * s}" height="${H}"/><rect x="${X(L - 3)}" y="${Y(0)}" width="${3 * s}" height="${H}"/></g>`;
  // wall + door
  g += `<rect x="${X(0) - 8}" y="${Y(D)}" width="${W + 16}" height="10" fill="${c.wall}"/>`;
  const door = o.door ?? { x: 47, w: 72, openAt: 'left', label: 'sliding door (position approximate)' };
  const openX = door.openAt === 'right' ? door.x + door.w / 2 : door.x;
  g += `<rect x="${X(door.x)}" y="${Y(D) - 2}" width="${door.w * s}" height="14" fill="${c.planFloor}" stroke="${c.ink}" stroke-width="1"/><line x1="${X(openX)}" y1="${Y(D) + 5}" x2="${X(openX + door.w / 2)}" y2="${Y(D) + 5}" stroke="${c.ink}" stroke-width="2"/><path d="M${X(door.openAt === 'right' ? openX : openX + door.w / 2)} ${Y(D) - 2} l0 -8" stroke="${c.ink}" stroke-width="1"/>`;
  g += `<text x="${X(Math.max(door.x, 2))}" y="${Y(D) + 32}" text-anchor="start" font-size="11" fill="${c.muted}" font-family="Work Sans, system-ui, sans-serif">${door.label}</text>`;
  // troughs: 3 x 48" on the long rail, 1 x 32" on each return, clear of the corner pots
  const pot = POTS[o.pot];
  const tr = (x, y, w, h) => `<rect x="${X(x)}" y="${Y(y)}" width="${w * s}" height="${h * s}" fill="${pot.fill}" stroke="${pot.edge}" stroke-width="1.5"/>` +
    `<rect x="${X(x) + 2}" y="${Y(y) + 2}" width="${w * s - 4}" height="${h * s - 4}" fill="${o.hedgeTop}" opacity=".85"/>`;
  for (const [px, w] of (o.longTroughs ?? [[3, 48], [57, 48], [111, 48]])) g += tr(px, 3, w, o.troughDepth ?? 12);
  for (const rt of (o.returns ?? [[3, 40, 12, 32], [L - 15, 40, 12, 32]])) g += tr(...rt);
  // hanging planters (hang outside the rail line)
  const hb = (x, y, w, h) => `<rect x="${X(x)}" y="${Y(y)}" width="${w * s}" height="${h * s}" fill="${pot.fill}" stroke="${pot.edge}" stroke-width="1.2"/>`;
  for (const p of [0, 54, 108]) { g += hb(p + 5, -8, 20, 8); g += hb(p + 29, -8, 20, 8); }
  for (const hp of (o.returnHangers ?? [[-8, 46, 8, 20], [L, 46, 8, 20]])) g += hb(...hp);
  // corner anchors
  const anc = (x, y, r, fill, label) => `<circle cx="${X(x)}" cy="${Y(y)}" r="${r * s}" fill="${fill}" stroke="${c.ink}" stroke-width="1"/><text x="${X(x)}" y="${Y(y) + 4}" text-anchor="middle" font-size="10" fill="#fff" font-family="Work Sans, system-ui, sans-serif">${label}</text>`;
  for (const a of o.anchors) g += anc(a.x, a.y, a.r, a.fill, a.label);
  // furniture: existing two chairs + bistro table, plus the loveseat/daybed if the concept adds one
  const chair = (x, y, rot = 0, sz = 22) => `<g transform="rotate(${rot} ${X(x + sz / 2)} ${Y(y + sz / 2)})"><rect x="${X(x)}" y="${Y(y)}" width="${sz * s}" height="${sz * s}" rx="8" fill="${c.cushion}" stroke="${c.iron}" stroke-width="1.5"/><path d="M${X(x)} ${Y(y) + 8} q${sz / 2 * s} -${12 * s} ${sz * s} 0" fill="none" stroke="${c.iron}" stroke-width="2"/></g>`;
  for (const f of o.furniture) {
    if (f.kind === 'chair') g += chair(f.x, f.y, f.rot ?? 0, f.size ?? 22);
    if (f.kind === 'table') g += `<circle cx="${X(f.x)}" cy="${Y(f.y)}" r="${12 * s}" fill="${c.tableTop}" stroke="${c.iron}" stroke-width="1.5"/>`;
    if (f.kind === 'sofa') g += `<rect x="${X(f.x)}" y="${Y(f.y)}" width="${f.w * s}" height="${f.h * s}" rx="8" fill="${c.cushion}" stroke="${c.iron}" stroke-width="1.5"/><rect x="${X(f.x)}" y="${Y(f.y)}" width="${f.w * s}" height="${6 * s}" rx="6" fill="${c.iron}" opacity=".85"/>`;
    if (f.kind === 'sofaWall') g += `<rect x="${X(f.x)}" y="${Y(f.y)}" width="${f.w * s}" height="${f.h * s}" rx="8" fill="${c.cushion}" stroke="${c.iron}" stroke-width="1.5"/><rect x="${X(f.x) + 4}" y="${Y(f.y + f.h - 7)}" width="${f.w * s - 8}" height="${6 * s}" rx="6" fill="#e2ddd0" stroke="${c.iron}" stroke-width="1"/><text x="${X(f.x + f.w / 2)}" y="${Y(f.y + 13)}" text-anchor="middle" font-size="10" fill="${c.muted}" font-family="Work Sans, system-ui, sans-serif">${f.label ?? `your sofa, ${f.w}"`}</text>`;
    if (f.kind === 'side') g += `<circle cx="${X(f.x)}" cy="${Y(f.y)}" r="${(f.r ?? 8) * s}" fill="${c.tableTop}" stroke="${c.iron}" stroke-width="1.5"/>`;
    if (f.kind === 'pot') g += `<circle cx="${X(f.x)}" cy="${Y(f.y)}" r="${f.r * s}" fill="${f.fill}" stroke="${c.ink}" stroke-width="1"/><text x="${X(f.x)}" y="${Y(f.y) + 4}" text-anchor="middle" font-size="9" fill="#fff" font-family="Work Sans, system-ui, sans-serif">${f.label}</text>`;
    if (f.kind === 'rug') g += `<rect x="${X(f.x)}" y="${Y(f.y)}" width="${f.w * s}" height="${f.h * s}" fill="none" stroke="${f.stroke}" stroke-width="2" stroke-dasharray="6 4"/>`;
  }
  // walkway
  if (!o.noPathLabel) g += `<text x="${X(81)}" y="${Y(52)}" text-anchor="middle" font-size="11" fill="${c.muted}" font-family="Work Sans, system-ui, sans-serif">36" clear path to the door stays open</text>`;
  // dimensions
  const dim = (x1, y1, x2, y2, label, tx, ty) => `<g stroke="${c.muted}" stroke-width="1"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><line x1="${x1}" y1="${y1 - 4}" x2="${x1}" y2="${y1 + 4}"/><line x1="${x2}" y1="${y2 - 4}" x2="${x2}" y2="${y2 + 4}"/></g><text x="${tx}" y="${ty}" text-anchor="middle" font-size="12" fill="${c.muted}" font-family="Work Sans, system-ui, sans-serif">${label}</text>`;
  g += dim(X(0), Y(0) - 22, X(L), Y(0) - 22, '162" rail', X(81), Y(0) - 27);
  g += `<g stroke="${c.muted}" stroke-width="1"><line x1="${X(L) + 26}" y1="${Y(0)}" x2="${X(L) + 26}" y2="${Y(D)}"/><line x1="${X(L) + 22}" y1="${Y(0)}" x2="${X(L) + 30}" y2="${Y(0)}"/><line x1="${X(L) + 22}" y1="${Y(D)}" x2="${X(L) + 30}" y2="${Y(D)}"/></g><text transform="translate(${X(L) + 40} ${Y(37)}) rotate(90)" text-anchor="middle" font-size="12" fill="${c.muted}" font-family="Work Sans, system-ui, sans-serif">74" deep</text>`;
  return `<svg viewBox="${vb}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Floor plan">${g}</svg>`;
}

// ---------- the four concepts ----------
const base = { ink: '#2a2723', muted: '#7a7369', rail: '#4b4d50', railCap: '#5a5c5f', iron: '#1e1e1e', cushion: '#f3f0e8', tableTop: '#e6e0d3', wall: '#8b8f92', planFloor: '#eae5da', floorEdge: '#c9c1b0' };

const concepts = [
  {
    id: 'Provence', n: 1, name: 'Provence', tag: 'Lavender, olive and clipped green against pale stone',
    mood: 'The quiet version. A tight boxwood hedge in limestone-toned troughs swallows the lower rail, star jasmine laces the mesh, and lavender spills from over-rail planters. One olive tree, one bistro table, mostly silver and green with lavender as the only color.',
    fonts: 'Cormorant Garamond', theme: { bg: '#f4f0e7', panel: '#ece6d9', accent: '#8b84b4', text: '#2a2723', muted: '#7a7369' },
    el: { ...base, sky: '#e9e4d6', city: ['#cbb59a', '#c4ad90', '#b9a68e'], window: '#ded4c2', haze: 'rgba(244,240,231,.55)', floor: '#d8d1c2' },
    pot: 'stone', hedgeGreens: ['#4f6b3e', '#5f7f4b', '#6f8f58'], hedgeTop: '#5f7f4b',
    vine: { stem: '#6b7d4f', leaf: [7, 4], leafFill: ['#4e6f3f', '#5f8250', '#3f5a33'], flower: { kind: 'star', color: '#fbfaf3' }, flowerRate: .45, strands: 3 },
    hang: { style: 'stone', trailLen: [70, 120], trailStem: '#a2ad94', trailLeaf: [5, 3.5], trailFill: ['#b7c1ab', '#cfd6c5', '#a3ae97'], trailFlower: { kind: 'cluster', color: '#f7f5ee' }, moundFill: ['#98a382', '#aab595'], moundFlower: { kind: 'spike', color: '#8b84b4' } },
    anchorsEl: (c) => tree('olive', 96, EL.floor + 20, { pot: 'stone', potW: 120, potH: 110 }, 3) + tree('cypress', 988, EL.floor + 10, { pot: 'stone', potW: 84, potH: 90, height: 320 }, 4),
    plan: {
      anchors: [{ x: 24, y: 28, r: 11, fill: '#8f9a80', label: 'olive' }, { x: 138, y: 28, r: 8, fill: '#3f5b3c', label: 'cyp.' }, { x: 138, y: 62, r: 6, fill: '#6f8f58', label: 'rsm' }],
      furniture: [{ kind: 'chair', x: 60, y: 22 }, { kind: 'table', x: 96, y: 32 }, { kind: 'chair', x: 110, y: 22 }],
    },
    layers: [
      ['Hedge at the rail base', 'Japanese boxwood “Wintergreen”, clipped to 16–18". Three 48" × 12" × 14" fiberglass troughs in a limestone tone on the long rail, one 32" trough on each return. Takes San Antonio heat with a little afternoon relief; if the rail faces west, swap to dwarf yaupon “Micron”, which shrugs off full sun.', '#5f7f4b'],
      ['On the mesh', 'Star jasmine (Trachelospermum jasminoides), one plant per 27" of rail, tied into the 4" grid with green garden wire. Evergreen, fragrant in April, and it laughs at 100° afternoons. Two seasons to a solid green screen.', '#fbfaf3'],
      ['Over the rail', 'Six 20" over-rail planters sized for the 3" top cap. “Phenomenal” lavender for the upright color, white trailing lantana and “Silver Falls” dichondra to spill 18–24" down the outside of the mesh.', '#8b84b4'],
      ['Anchors', 'An Arbequina olive in a 24" stone urn at the left corner, a pair of dwarf Italian cypress “Tiny Tower” at the right, and two rosemary balls in low bowls. Pea-gravel mulch on every planter for the Provence look and less splash.', '#8f9a80'],
    ],
    materials: [['Limestone-tone fiberglass', '#d9d1c0'], ['Pea gravel mulch', '#c5b9a3'], ['Natural linen', '#ede6d8'], ['Lavender accent', '#8b84b4'], ['Olive silver', '#a9b39a']],
    water: 'Every trough here is a self-watering planter with a sealed reservoir and a fill tube: you pour a measured amount into the tube and nothing ever leaves the bottom. Over-rail planters get the same treatment, with the water gauge on the inside face so you check it without leaning out.',
    list: ['3 × 48" self-watering troughs, limestone finish', '2 × 32" self-watering troughs (returns)', '6 × 20" over-rail planters, 3" rail fit', '1 × 24" urn + Arbequina olive, 15-gal', '2 × Italian cypress “Tiny Tower”, 5-gal', '14 × boxwood “Wintergreen”, 3-gal', '6 × star jasmine, 1-gal + green wire', '6 × lavender “Phenomenal”, 12 × trailing lantana, 12 × dichondra', '2 × rosemary, low stone bowls', 'Pea gravel, 4 bags · linen cushion covers · lantern'],
  },
  {
    id: 'Riviera', n: 2, name: 'Riviera', tag: 'Bougainvillea on the mesh, terracotta and a lemon tree',
    mood: 'The loud one. Magenta bougainvillea is trained across the entire long rail so the mesh reads as a wall of color from May to Thanksgiving. Rosemary hedges below, a Meyer lemon and a blue agave as anchors, blue-and-white stripes on the ground. Terracotta everywhere.',
    fonts: 'Cormorant Garamond', theme: { bg: '#f8f3ea', panel: '#f0e7d8', accent: '#c2306c', text: '#2a2723', muted: '#7a7369' },
    el: { ...base, sky: '#dfe8ee', city: ['#cbb59a', '#c4ad90', '#d4bfa4'], window: '#e8dfcf', haze: 'rgba(248,243,234,.45)', floor: '#dcd3c3' },
    pot: 'terracotta', hedgeGreens: ['#5c7a5a', '#6d8c68', '#83a07a'], hedgeTop: '#6d8c68',
    vine: { stem: '#6e5a48', leaf: [7, 4.2], leafFill: ['#4f7a42', '#5e8c4d', '#3f6335'], flower: { kind: 'bract', color: '#c2306c' }, flowerRate: .85, strands: 4 },
    hang: { style: 'terracotta', trailLen: [60, 110], trailStem: '#5e7a4a', trailLeaf: [5, 3.2], trailFill: ['#5e8c4d', '#7aa066', '#4f7a42'], trailFlower: { kind: 'cluster', color: '#9a6bc7' }, moundFill: ['#4f7a42', '#5e8c4d'], moundFlower: { kind: 'cluster', color: '#d63a3a' } },
    anchorsEl: (c) => tree('lemon', 100, EL.floor + 20, { pot: 'terracotta', potW: 130, potH: 110 }, 5) + pot(980, EL.floor + 12, 110, 60, 'terracotta') + agave(980, EL.floor - 48),
    plan: {
      anchors: [{ x: 24, y: 28, r: 11, fill: '#4e7a3e', label: 'lemon' }, { x: 138, y: 28, r: 11, fill: '#7f98a6', label: 'agave' }, { x: 138, y: 62, r: 6, fill: '#6d8c68', label: 'herb' }],
      furniture: [{ kind: 'rug', x: 40, y: 20, w: 90, h: 48, stroke: '#3a63a8' }, { kind: 'chair', x: 56, y: 24 }, { kind: 'table', x: 90, y: 34 }, { kind: 'chair', x: 104, y: 24 }],
    },
    layers: [
      ['Hedge at the rail base', 'Rosemary “Tuscan Blue” planted tight in three 48" terracotta-look troughs, clipped flat at 18". Evergreen, drought-happy, smells like the coast every time you brush it. Dwarf myrtle (Myrtus communis “Compacta”) on the returns for a finer texture.', '#6d8c68'],
      ['On the mesh', 'Bougainvillea “Barbara Karst”, three plants on the long rail, canes fanned and tied across the grid. Blooms hardest when it is hot, dry and root-bound, which is exactly a top-floor balcony in July. On the handful of freezing nights each winter, throw frost cloth over it.', '#c2306c'],
      ['Over the rail', 'Terracotta-tone rail planters with red geraniums October through May, swapped for trailing purple lantana and blue plumbago through the summer, when geraniums give up here.', '#d63a3a'],
      ['Anchors', 'A Meyer lemon in a 24" terracotta pot at the left corner (fragrant, fruits in a pot, wants the sunniest spot), a “Blue Glow” agave in a wide low bowl at the right, and a striped blue-and-white outdoor rug under the table.', '#4e7a3e'],
    ],
    materials: [['Terracotta', '#c9764e'], ['Riviera blue', '#3a63a8'], ['Bougainvillea', '#c2306c'], ['Lemon', '#ecc84a'], ['Whitewash', '#f8f3ea']],
    water: 'Terracotta dries out fast in a high wind, so these are glazed-inside or lined planters with saucer trays that clip on. A gravity drip kit runs from a 5-gallon reservoir tucked behind the lemon pot: half-gallon-per-hour emitters on a battery timer before dawn, short enough runs that nothing overflows.',
    list: ['3 × 48" troughs + clip-on saucer trays, terracotta finish', '2 × 32" troughs (returns)', '6 × over-rail planters with saucers, 3" rail fit', '3 × bougainvillea “Barbara Karst”, 3-gal + trellis ties', '12 × rosemary “Tuscan Blue”, 6 × dwarf myrtle', '1 × 24" pot + Meyer lemon, 10-gal', '1 × 28" low bowl + agave “Blue Glow”', 'Geraniums (cool season), lantana + plumbago (summer)', 'Gravity drip kit, 5-gal reservoir, battery timer', 'Striped outdoor rug 5×8, blue cushion covers'],
  },
  {
    id: 'Potager', n: 3, name: 'Potager', tag: 'A French kitchen garden: grapes, figs, herbs and strawberries',
    mood: 'The useful one. Everything on this balcony can be picked. A rosemary-thyme-oregano hedge in zinc troughs, a Texas-tough grape trained across the mesh, strawberries and tumbling tomatoes over the rail, a fig and a bay laurel in barrels. Farmhouse zinc and weathered wood, gingham on the table.',
    fonts: 'Cormorant Garamond', theme: { bg: '#f3efe4', panel: '#e9e3d4', accent: '#5f7f4a', text: '#2a2723', muted: '#7a7369' },
    el: { ...base, sky: '#e4e6de', city: ['#c3ad91', '#b9a68e', '#cbb59a'], window: '#ddd4c3', haze: 'rgba(243,239,228,.5)', floor: '#d5cebd' },
    pot: 'zinc', hedgeGreens: ['#5c7a5a', '#7a9367', '#94a878'], hedgeTop: '#7a9367',
    vine: { stem: '#7a6248', leaf: [11, 7], leafFill: ['#5b8a4a', '#6f9c5a', '#4a7340'], flower: { kind: 'berry', color: '#4a2b55' }, flowerRate: .35, strands: 2 },
    hang: { style: 'zinc', trailLen: [50, 95], trailStem: '#5e8a49', trailLeaf: [6, 4], trailFill: ['#5e8a49', '#7aa565', '#4b7a3d'], trailFlower: { kind: 'berry', color: '#c6342c' }, moundFill: ['#5e8a49', '#7aa565'], moundFlower: { kind: 'dot', color: '#f6f2e6' } },
    anchorsEl: (c) => tree('fig', 100, EL.floor + 20, { pot: 'wood', potW: 130, potH: 100 }, 7) + tree('bay', 985, EL.floor + 14, { pot: 'zinc', potW: 90, potH: 90 }, 8),
    plan: {
      anchors: [{ x: 24, y: 28, r: 11, fill: '#5b8049', label: 'fig' }, { x: 138, y: 28, r: 10, fill: '#3f5f3a', label: 'bay' }, { x: 136, y: 62, r: 7, fill: '#4e7a3e', label: 'lemon' }],
      furniture: [{ kind: 'chair', x: 58, y: 22 }, { kind: 'table', x: 92, y: 32 }, { kind: 'chair', x: 106, y: 22 }, { kind: 'sofa', x: 20, y: 44, w: 16, h: 26 }],
    },
    layers: [
      ['Hedge at the rail base', 'A mixed herb hedge: upright rosemary at the posts, Greek oregano and lemon thyme between, dwarf sage on the returns. All Mediterranean natives that thrive in our heat; clip them and use the clippings. Zinc-look troughs on a cedar frame with a chicken-wire panel fronting the mesh.', '#7a9367'],
      ['On the mesh', '“Black Spanish” (Lenoir) grape, two vines, canes trained horizontally along the grid. It is the grape that actually fruits in South Texas heat, and nothing says French countryside like a vine over the rail. Star jasmine on the returns for winter green.', '#5b8a4a'],
      ['Over the rail', 'Zinc rail troughs with “Chandler” strawberries planted in October (Texas grows them as a winter crop), “Tumbling Tom” cherry tomatoes in spring, and basil and nasturtium through summer.', '#c6342c'],
      ['Anchors', 'A “Celeste” fig in a half wine barrel at the left corner, kept to 5 feet; a bay laurel topiary at the right; a Meyer lemon by the door. A cedar potting bench doubles as the drinks table.', '#5b8049'],
    ],
    materials: [['Galvanized zinc', '#a3a8ab'], ['Weathered cedar', '#946d47'], ['Herb green', '#7a9367'], ['Gingham red', '#c6342c'], ['Chalk white', '#f3efe4']],
    water: 'Edibles drink more than anything else on this page, so this concept leans hardest on sub-irrigated troughs with a fill tube and a float gauge: no holes in the bottom, and you water by the gauge instead of by guess. Tomatoes and strawberries over the rail sit in planters with an attached 1-quart reservoir. Mulch with straw so the soil never crusts and splashes.',
    list: ['3 × 48" sub-irrigated zinc troughs, 2 × 32" (returns)', 'Cedar frame + chicken-wire panel, 13.5 ft', '6 × over-rail reservoir planters, 3" rail fit', '2 × grape “Black Spanish”, 2-gal + trellis wire', 'Rosemary ×4, oregano ×6, lemon thyme ×6, dwarf sage ×4', 'Strawberries “Chandler” ×18 (fall), “Tumbling Tom” ×6 (spring)', 'Half wine barrel + fig “Celeste”, 7-gal', 'Bay laurel topiary, 5-gal · Meyer lemon, 5-gal', 'Cedar potting bench 36"', 'Straw mulch · gingham cloth · enamel pitcher'],
  },
  {
    id: 'Dusk', n: 4, name: 'Bastide at Dusk', tag: 'A white-and-silver evening garden lit by festoon lights',
    mood: 'The one for evenings. It keeps your black iron and charcoal pots and builds around them: white bougainvillea and jasmine on the mesh, silver dichondra and white lantana over the rail, cypress columns at the corners, and a low daybed under a run of festoon lights strung post to post. White flowers glow at dusk; everything else disappears into the dark.',
    fonts: 'Cormorant Garamond', dark: true, theme: { bg: '#1f2226', panel: '#2a2e33', accent: '#e8b86a', text: '#ede9e0', muted: '#a49f95' },
    el: { ...base, ink: '#ede9e0', muted: '#a49f95', sky: '#2b3550', city: ['#3a3d46', '#44474f', '#33363e'], window: '#e0b36a', haze: 'rgba(31,34,38,.25)', floor: '#3b3e42', floorEdge: '#2a2c2f', rail: '#5b5e63', railCap: '#6a6d72', cushion: '#f1eee6', tableTop: '#d9d4c8', wall: '#4a4d52', planFloor: '#35383c', glow: '#f2c77c', bulb: '#ffe6b0' },
    pot: 'charcoal', hedgeGreens: ['#2f4a33', '#3c5e40', '#4a704c'], hedgeTop: '#3c5e40',
    vine: { stem: '#4d5a45', leaf: [7, 4], leafFill: ['#3d5a3c', '#4b6d48', '#2f4a30'], flower: { kind: 'bract', color: '#f4f1e8' }, flowerRate: .8, strands: 4 },
    hang: { style: 'black', trailLen: [70, 125], trailStem: '#8b9585', trailLeaf: [5, 3.5], trailFill: ['#b5bcae', '#cfd4c9', '#9aa394'], trailFlower: { kind: 'cluster', color: '#f6f3ea' }, moundFill: ['#7c8a72', '#95a38a'], moundFlower: { kind: 'dot', color: '#f6f3ea' } },
    anchorsEl: (c) => tree('cypress', 82, EL.floor + 10, { pot: 'charcoal', potW: 90, potH: 96, height: 350 }, 9) + tree('olive', 990, EL.floor + 20, { pot: 'charcoal', potW: 120, potH: 110 }, 10) + stringLights(c),
    plan: {
      anchors: [{ x: 24, y: 28, r: 9, fill: '#3f5b3c', label: 'cyp.' }, { x: 138, y: 28, r: 11, fill: '#8f9a80', label: 'olive' }, { x: 24, y: 60, r: 6, fill: '#95a38a', label: 'sant.' }],
      furniture: [{ kind: 'sofa', x: 38, y: 20, w: 56, h: 30 }, { kind: 'table', x: 106, y: 30 }, { kind: 'chair', x: 120, y: 46 }],
    },
    layers: [
      ['Hedge at the rail base', 'Dwarf myrtle clipped tight and low (14") in charcoal fiberglass troughs that match your two existing pots. Fine, dark, glossy leaves that read as a clean line at night rather than a fluffy hedge.', '#3c5e40'],
      ['On the mesh', 'Bougainvillea “Jamaica White” on the long rail with star jasmine woven between: white bracts all summer, white pinwheels and scent in spring. White is the color that still reads after sunset.', '#f4f1e8'],
      ['Over the rail', 'Matte black rail planters (they vanish against the rail) with “Silver Falls” dichondra, white trailing lantana and “Diamond Frost” euphorbia. The silver cascade catches the string lights.', '#cfd4c9'],
      ['Anchors', 'Italian cypress “Tiny Tower” pair at the left corner, an Arbequina olive at the right, santolina and a Mexican feather grass in low charcoal bowls. Festoon lights clamped to the 3" rail cap at each post and back to the wall, on a dusk timer; a low daybed with your white cushions along the left return.', '#e8b86a'],
    ],
    materials: [['Charcoal fiberglass', '#3b3e41'], ['Matte black iron', '#26282a'], ['Warm festoon light', '#e8b86a'], ['White bloom', '#f4f1e8'], ['Silver foliage', '#b5bcae']],
    water: 'Same self-watering troughs and rail planters as Provence, in charcoal. Because this garden is used at night, the drip is the quiet kind: a small pump in a 7-gallon reservoir hidden under the daybed, feeding quarter-inch line to every planter, on a timer at 5 a.m. Reservoirs mean you can leave for two weeks in August and come home to a live garden and a dry floor below.',
    list: ['3 × 48" self-watering troughs, charcoal; 2 × 32" (returns)', '6 × matte black over-rail planters, 3" rail fit', '2 × bougainvillea “Jamaica White”, 4 × star jasmine', '14 × dwarf myrtle, 1-gal', 'Dichondra ×12, white lantana ×12, euphorbia ×6', '2 × cypress “Tiny Tower” + Arbequina olive, 15-gal', 'Santolina ×3, Mexican feather grass ×3, low bowls', 'Festoon lights 48 ft, rail clamps ×4, dusk timer', 'Pump drip kit, 7-gal reservoir, 1/4" line', 'Outdoor daybed 60" × 30", white cushions'],
  },
];


// ---------- the final plan: Provence, built around the sofa and armchair ----------
const provence = concepts[0];
const finalPlan = {
  ...provence, n: 1, id: 'Main', name: 'The Provence plan', tag: 'Built around your black spindle sofa and armchair',
  mood: 'Your sofa stays where it is, between the fixed door panel and the far return, and becomes the center of the room. At 33.5\" deep it takes nearly half the balcony, so the troughs on the long rail are 11\" deep and 30\" stays open in front of the cushions. The armchair takes the near rail corner, beside the door opening, and faces the sofa down the length of the balcony. Around them: a clipped boxwood hedge that swallows the lower rail, star jasmine laced through the mesh, lavender and silver dichondra spilling over the top cap, an olive in a stone urn at the far corner, and a pair of cypress against the near return behind the armchair. Black iron and white piping against silver, green and lavender.',
  shortLast: true,
  troughsEl: [[34, 48], [84, 48], [134, 24]],
  furnitureEl: (e) => '',
  anchorsEl: (e) => tree('cypress', 62, EL.floor + 10, { pot: 'stone', potW: 80, potH: 86, height: 300 }, 4) + tree('cypress', 122, EL.floor + 26, { pot: 'stone', potW: 84, potH: 90, height: 320 }, 12) + pot(178, EL.floor + 40, 56, 42, 'charcoal') + hedge(157, EL.floor + 40 - 42 - 50, 44, 54, ['#5f7f4b', '#6f8f58', '#7e9a68'], 79, 'ball') + tree('olive', 940, EL.floor + 36, { pot: 'stone', potW: 120, potH: 110 }, 3) + pot(858, EL.floor + 30, 60, 44, 'charcoal') + hedge(836, EL.floor + 30 - 44 - 52, 48, 56, ['#5f7f4b', '#6f8f58', '#7e9a68'], 78, 'ball')
,
  plan: {
    door: { x: 18, w: 58, openAt: 'left', label: 'sliding door (width approximate): opening panel toward the near return, fixed panel beside the sofa' },
    longTroughs: [[34, 48], [84, 48], [134, 24]], troughDepth: 11,
    returns: [],
    returnHangers: [[-8, 6, 8, 20]],
    noPathLabel: true,
    anchors: [{ x: 150, y: 24, r: 9, fill: '#8f9a80', label: 'olive' }, { x: 10, y: 52, r: 6.5, fill: '#3f5b3c', label: 'cyp.' }, { x: 10, y: 66, r: 6.5, fill: '#3f5b3c', label: 'cyp.' }],
    furniture: [
      { kind: 'sofaWall', x: 76, y: 40.5, w: 78.5, h: 33.5, label: 'your sofa, 78.5" × 33.5"' },
      { kind: 'chair', x: 3, y: 4, rot: -90, size: 29 },
      { kind: 'pot', x: 9, y: 39, r: 5, fill: '#6f8f58', label: 'rsm' }, { kind: 'pot', x: 136, y: 25, r: 5, fill: '#6f8f58', label: 'rsm' },
    ],
  },
  layers: [
    ['Hedge at the rail base', 'Japanese boxwood “Wintergreen”, clipped to 16–18", in three white self-watering troughs along the long rail: 48", 48" and 24", 11" deep, starting past the armchair\'s corner and stopping short of the far corner so the olive urn stands in front of the last one. Neither return gets a trough: the near one belongs to the chair and the cypress, the far one is a hand\'s width from the sofa. If the long rail takes full west sun, use dwarf yaupon “Micron” instead.', '#5f7f4b'],
    ['On the mesh', 'Star jasmine, one plant per 27" of rail, tied into the 4" grid with green wire and trained sideways so the mesh fills in as a green wall behind the hedge. Evergreen, fragrant in April, unbothered by 100° afternoons. Solid cover in two seasons.', '#fbfaf3'],
    ['Over the rail', 'Seven 24" over-rail planters made for a 3" top cap: six on the long rail, two per panel, and one on the near return above the armchair. “Phenomenal” lavender upright, white trailing lantana and “Silver Falls” dichondra spilling 18–24" down the outside of the mesh, so the color reads from the street too.', '#8b84b4'],
    ['Anchors', 'An Arbequina olive in a 24" stone urn at the far corner, standing on the floor in front of the last trough. Two dwarf Italian cypress “Tiny Tower” in tall stone pots against the near return, between the armchair and the wall, beside the door opening. Your two charcoal pots take clipped rosemary balls, one by the chair and one by the urn. Pea gravel on every planter.', '#8f9a80'],
  ],
  materials: [['Limestone-tone fiberglass', '#d9d1c0'], ['Your black iron, white piping', '#26282a'], ['Lavender linen pillows', '#9a93bf'], ['Oatmeal ticking stripe', '#e9e4d6'], ['Olive silver', '#a9b39a']],
  water: 'Every rail-line planter is self-watering with a sealed reservoir and fill tube, so nothing exits the bottom. The seven over-rail planters are the reservoir type with the gauge on the inside face. Behind the sofa there is room for a slim 5-gallon reservoir with a battery pump on a pre-dawn timer feeding quarter-inch line along the base of the troughs; nothing is watered by hose, and the concrete stays dry.',
  list: ['2 × 48" + 1 × 24" self-watering troughs, 11" deep, white', '7 × 24" over-rail reservoir planters, 3" rail fit', '2 × 24" tall stone pots + Italian cypress “Tiny Tower”, 5-gal', '1 × 24" stone urn + Arbequina olive, 15-gal', '10 × boxwood “Wintergreen”, 3-gal · 6 × star jasmine, 1-gal + green wire', '7 × lavender “Phenomenal”, 14 × white trailing lantana, 14 × “Silver Falls” dichondra', '2 × rosemary balls for your existing charcoal pots', '3 outdoor pillows: two lavender linen, one oatmeal ticking stripe, for the sofa', 'Wall lantern (solar or plug-in) above the sofa · pea gravel, 4 bags · pump drip kit, 5-gal reservoir'],
};


function renderPrompts(t) {
  const views = [["Message 1 · Set the rules", "Attach the photo taken from the door looking along the railing, with the chair and gray pots at the far end. Check its answer: if it miscounts the panels, correct it before going on.", "This is a photo of my balcony. We are going to edit it in small steps. In every step you keep the camera, framing, railing, floor, wall, door, buildings and light exactly as they are, so that the output lines up with the input if laid on top of it. You never extend the balcony, add railing panels, move posts, or change the viewpoint.\n\nFirst, before making any image, describe what you see so we agree on the fixed geometry: how many mesh panels on the long railing, how many posts, where the armchair is, where the two gray pots are, where the door is. Use these as scale anchors from now on: the top cap of the railing is 43 inches high; the armchair seat is 16.5 inches off the floor; the gray pots are about 14 inches wide; the long railing is 13.5 feet with three mesh panels."], ["Message 2 · Troughs and hedge", "", "Edit the photo. Add only this: along the base of the long railing, three matte white rectangular trough planters in a row, set 2 inches back from the mesh. Their tops come to just below the armchair's seat cushion (11 inches). Lengths 48, 48 and 36 inches: together they span the three mesh panels, stopping short of the far corner where the gray pots stand. Each is planted with a clipped Japanese boxwood hedge, flat-topped at the height of the armchair's armrest (about 28 inches off the floor), with an inch of pale pea gravel on the soil. Nothing else changes."], ["Message 3 · Jasmine", "", "Edit the last image. Add only this: star jasmine vines climbing from the troughs into the wire mesh, fanned sideways, covering about 60 percent of the mesh above the hedge, glossy dark green leaves with small white pinwheel flowers, the grid still visible through them. Nothing else changes."], ["Message 4 · Rail planters", "", "Edit the last image. Add only this: six matte white rail planters, each 24 inches long and 7 inches tall (about one-sixth the height of the railing), hung over the 43-inch top cap with their bodies on the balcony side, two per mesh panel, evenly spaced. Each holds one upright lavender in purple bloom in the center, with silver dichondra and white trailing lantana spilling through the mesh and about 18 inches down the outside. Nothing else changes."], ["Message 5 · Olive", "", "Edit the last image. Change only this: replace the two gray pots in the far corner with one limestone-toned stone urn, 24 inches wide and 24 inches tall (its rim about half the railing's height), holding an Arbequina olive tree that reaches about 7 feet, a foot and a half above the top cap, with silver-green leaves and a slightly leaning trunk. Nothing else changes."], ["Message 6 · Chair and rosemary", "", "Edit the last image. Change only this: move the armchair to sit in front of the fixed panel of the sliding door, turned to face along the balcony toward the sofa end, angled slightly toward the view. Put the two gray pots on the narrow strip of wall just past the door frame, each with a clipped rosemary ball. Nothing else changes."], ["Message 7 · The sofa side", "Switch to the photo of the sofa with the door on its left; the cypress corner is behind the camera in the first photo.", "This is a second photo of the same balcony, looking the other way, with the sofa against the wall beside the door. Same rules: edit, never rebuild, keep the camera and everything in the frame. Change only this: remove the plastic wrap from the sofa so it shows white cushions with black piping. Add two lavender linen throw pillows and one oatmeal ticking-stripe pillow. In the corner beyond the sofa's far arm, add two limestone-toned tapered pots, 16 inches wide and 22 inches tall, each with a slim Italian cypress about 6 feet tall. At the sofa's near arm, by the door, add a 12-inch round drink table with a pale stone top and a thin black iron base. Nothing else changes."], ["Message 8 · Lantern", "", "Edit the last image. Add only this: a black iron wall lantern with a warm glowing bulb, mounted on the gray wall panel above the center of the sofa, about 46 inches off the floor. Nothing else changes."], ["When a step goes wrong", "Look at the railing posts after every step. If they moved or a panel appeared, do not continue.", "That changed the balcony's geometry. Go back to the previous image and apply the same edit again without extending the railing or moving the camera. The posts must stay exactly where they were."]];
  return `<div style="display:flex;flex-direction:column;gap:12px">
    <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:${t.text}">Turning the plan into a photograph</h2>
    <p style="margin:0;font-size:13.5px;line-height:1.5;max-width:900px;color:${t.text};opacity:.9">These drawings are to scale but they are drawings. For a photo-real version of your own balcony, edit your photos in ChatGPT one small step at a time, in the order below, each step on the previous image. Asking for the whole design at once makes the model rebuild the balcony at the wrong size; one change per message keeps the real geometry. Sizes are given against things in the photo (the chair seat, the top cap) because that is what the model can actually see. For 4K, take the largest image the app produces and upscale it 2× to 4× with Upscayl, Topaz Gigapixel or Photoshop Super Resolution.</p>
    <div style="display:flex;flex-direction:column;gap:14px">${views.map(([h, sub, body]) => `<div style="display:flex;flex-direction:column;gap:8px;padding:18px;background:${t.panel}">
      <h3 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:600;line-height:1.1;color:${t.text}">${h}</h3>
      <p style="margin:0;font-size:12.5px;color:${t.muted}">${sub}</p>
      <pre style="margin:0;font:12.5px/1.5 'Work Sans',system-ui,sans-serif;white-space:pre-wrap;color:${t.text};opacity:.92;user-select:all">${body}</pre></div>`).join('')}</div>
  </div>`;
}

// ---------- the build plan: exact products, counts, plants, sources ----------
function buildBody() {
  const t = { bg: '#f4f0e7', panel: '#ece6d9', accent: '#6b7a55', text: '#2a2723', muted: '#7a7369' };
  const H2 = (x) => `<h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:600;color:${t.text}">${x}</h2>`;
  const H3 = (x) => `<h3 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:600;line-height:1.1;color:${t.text}">${x}</h3>`;
  const P = (x) => `<p style="margin:0;font-size:13.5px;line-height:1.5;color:${t.text};opacity:.9">${x}</p>`;
  const table = (head, rows) => `<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:13px;line-height:1.4;color:${t.text}"><thead><tr>${head.map(h => `<th style="text-align:left;padding:8px 10px;border-bottom:2px solid ${t.accent};font-weight:600;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${t.muted}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td style="padding:9px 10px;border-bottom:1px solid rgba(0,0,0,.12);vertical-align:top">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const card = (h, body) => `<div style="display:flex;flex-direction:column;gap:8px;padding:18px;background:${t.panel};border-top:3px solid ${t.accent}">${H3(h)}${body}</div>`;

  const planters = table(['Where', 'Product', 'Size', 'Qty', 'Notes', 'Buy'], [
    ['Long rail, base', 'Mayne Fairfield 4 ft Window Box (self-watering)', '48" × 11" × 10.8"; 9.5 gal soil, 4 gal reservoir', '2', 'Built-in overflow. White reads as limestone; Graphite Grey matches the rail. Ignore the wall brackets: it sits on the floor.', 'Home Depot, Lowe\'s, Walmart, Tractor Supply, Amazon (order for pickup)'],
    ['Long rail, base (far end)', 'Mayne Fairfield 2 ft Window Box', '24" × 11" × 11"', '1', 'Short so the olive urn stands in front of its end at the far corner.', 'Same'],
    ['Over the top rail', 'Gardener\'s Supply Adjustable Self-Watering Railing Planter, 24"', '23.25" × 7.5" × 7"; fits rails 1" to 4.25"; 1 qt reservoir; 12 qt mix', '7', 'Six on the long rail, two per panel, and one on the near return above the armchair. Hang the body on your side of the rail. The reservoir is small, so summer means a daily top-up; the upgrade is the Lechuza Balconera 80 (31" × 7" × 7", bigger reservoir) if its bracket fits a 3" flat cap.', 'gardeners.com or Amazon'],
    ['Far corner', 'Olive urn: lightweight fiberglass or cast-stone, limestone tone', '24" wide × 22–24" tall, with a 24" saucer', '1', 'The olive is the one plant here that drains, so it gets a deep saucer you empty after rain.', 'JustPots (Redland Rd), Ten Thousand Pots (US-281), Rainbow Gardens pottery yard'],
    ['Sofa-end corner', 'Tall tapered pots for the cypress pair, same finish', '16" wide × 22" tall, with 16" saucers', '2', 'Tall pots give the columns height without a 15-gal tree.', 'Same'],
    ['Beside the chair', 'Your two charcoal pots', 'as is', '2', 'Add 12" saucers underneath.', 'Any nursery'],
    ['Under the troughs (if rain reaches the floor)', 'Heavy-duty boot trays', '48" × 14" or the largest you can find', '3', 'Orient each trough\'s overflow hole toward your floor and over the tray. Skip these if the balcony is roofed and stays dry in rain.', 'Amazon, Home Depot'],
  ]);

  const plants = table(['Plant', 'Botanical name', 'Size', 'Qty', 'Goes in', 'Where in San Antonio'], [
    ['Wintergreen boxwood', 'Buxus microphylla \'Wintergreen\'', '3 gal', '10', 'The three troughs, 12" apart: 4 + 4 + 2', 'Rainbow Gardens (listed in their online shop), Milberger\'s, The Garden Center'],
    ['Star jasmine', 'Trachelospermum jasminoides', '1 gal', '6', 'Back edge of each trough against the mesh, two per trough', 'All four nurseries stock it; it is a San Antonio staple'],
    ['Phenomenal lavender', 'Lavandula × intermedia \'Phenomenal\'', '1 gal', '7', 'One per rail planter, centered', 'Rainbow Gardens, Milberger\'s (the humidity-tolerant lavender; skip English types)'],
    ['White trailing lantana', 'Lantana montevidensis \'Alba\'', '4"', '14', 'Two per rail planter, front corners', 'Everywhere in spring; plant in April'],
    ['Silver Falls dichondra', 'Dichondra argentea \'Silver Falls\'', '4"', '14', 'Two per rail planter, front edge', 'Everywhere spring through fall'],
    ['Arbequina olive', 'Olea europaea \'Arbequina\'', '15 gal', '1', 'The urn', 'Rainbow Gardens lists it; Milberger\'s carries it in the fruit-tree yard. Call for 15-gal stock'],
    ['Tiny Tower Italian cypress', 'Cupressus sempervirens \'Monshel\'', '5 gal', '2', 'The two tall pots', 'A Monrovia plant: ask Rainbow Gardens, Milberger\'s or The Garden Center to pull it; if not in stock, standard Italian cypress in 5 gal stays pot-sized for years, or order Tiny Tower from an online grower'],
    ['Rosemary', 'Salvia rosmarinus \'Tuscan Blue\'', '1 gal', '2', 'Your charcoal pots, clipped into balls', 'Any nursery, herb section'],
    ['If the rail faces west', 'Ilex vomitoria \'Micron\' (dwarf yaupon)', '3 gal', '10', 'Swap for the boxwood', 'Rainbow Gardens, Milberger\'s'],
  ]);

  const soil = table(['Material', 'Amount', 'Notes'], [
    ['Container potting mix (FoxFarm Happy Frog, Ocean Forest, or the nursery\'s house mix)', 'About 16 cu ft: eight 2-cu-ft bags', 'Troughs 24 gal, rail planters 21 gal, urn and tall pots the rest. Not garden soil, not "moisture control" mixes, which stay soggy in reservoir planters.'],
    ['Pea gravel', '4 bags, 0.5 cu ft', 'One inch on every planter: the Provence look, less splash, less evaporation.'],
    ['Slow-release fertilizer (Osmocote Plus or similar)', '1 box', 'March and June. Lavender and rosemary get half rate.'],
    ['Green stretch tie or soft garden wire', '1 roll', 'Tying jasmine canes into the mesh.'],
    ['Rubber pads or composite shims', '6', 'Under the troughs so air moves beneath and the concrete dries.'],
  ]);

  const steps = [
    ['1 · Before you buy (this week)', 'Measure the door frame and note which panel opens. Stand at the long rail with your phone compass and note the direction it faces; west sun means the yaupon swap. Check whether rain reaches the floor by the rail (that decides the boot trays). Call Rainbow Gardens Thousand Oaks and Milberger\'s to hold a 15-gal Arbequina and ask about Tiny Tower cypress.'],
    ['2 · Order the planters', 'Mayne boxes and the rail planters ship; order them first, they take a week. Buy the urn, tall pots and saucers in person so you can match the finish. Nurseries and pottery yards deliver; a 15-gal olive in a 24" urn is a two-person carry.'],
    ['3 · One loop for plants and pottery', 'Rainbow Gardens Thousand Oaks, JustPots on Redland Rd and Milberger\'s on 1604 are within a few miles of each other in the 281/1604 corner. Do them in one morning. Boxwood, jasmine, lavender, rosemary and the olive now (fall is the best planting season here). Lantana and dichondra go in next April; over winter, fill the rail planters with white alyssum and dusty miller.'],
    ['4 · Set the troughs', 'Place the Mayne boxes 2–3" back from the mesh on rubber pads (and trays if needed), overflow holes facing your floor. Fill to an inch below the rim with mix, water once from the top to settle it, then only ever fill the reservoir through the tube.'],
    ['5 · Plant the base', 'Jasmine first, at the back edge against the mesh, canes fanned and tied into the grid at 45°. Boxwood in front, 12" apart, root balls roughened. Gravel on top. Clip the boxwood flat at 16–18" the following spring and again in August.'],
    ['6 · Hang the rail planters', 'Set the brackets to 3", hang each planter with its body on your side of the rail, lavender in the middle, trailing plants at the front edge. Once the dichondra and lantana are 8" long, thread them through the mesh to the outside.'],
    ['7 · The corners', 'Olive in the urn with 2" of gravel on top and the saucer under it, on the floor at the far corner in front of the last trough. The armchair into the near rail corner, back to the mesh, facing the sofa. Cypress in the tall pots against the near return behind it. Rosemary in your charcoal pots, one by the chair and one by the urn. Then the pillows.'],
    ['8 · The watering routine', 'Troughs: fill by the gauge, roughly every 5–7 days in summer, every 2 weeks in spring and fall, every 3 weeks in winter. Rail planters: 1 qt reservoir, so daily in July and August, every 2–3 days otherwise. Olive, cypress, rosemary: a measured gallon or two once a week in summer, then empty the saucers after rain. Nothing is ever watered with a hose.'],
    ['9 · Later, if you want it', 'A gravity Blumat kit or a pump-on-timer kit can feed every reservoir from a hidden 5-gal tank so you can leave for two weeks in August. Ewing Irrigation and SiteOne in San Antonio carry the tubing and fittings; Sustainable Village sells the Blumat kits. Skip it the first season: the reservoirs already do most of the work.'],
  ].map(([h, body]) => card(h, P(body))).join('');

  const sources = table(['Source', 'Address', 'Use it for'], [
    ['Rainbow Gardens (Thousand Oaks)', '2585 Thousand Oaks Dr, 78232 · (210) 494-6131', 'Boxwood, jasmine, lavender, rosemary, Arbequina olive, pottery, potting mix'],
    ['Rainbow Gardens (Bandera)', '8516 Bandera Rd, 78250 · (210) 680-2394', 'Same stock, northwest side'],
    ['Milberger\'s Landscaping & Nursery', '3920 N Loop 1604 E, 78247 · (210) 497-3760 · Mon–Sat 9–6, Sun 10–5', 'Olive trees, cypress, shrubs, pottery, delivery'],
    ['The Garden Center', '10682 Bandera Rd, 78250 · (210) 647-7900 · 9–6 daily', 'Five acres of trees and shrubs; second call for cypress'],
    ['Fanick\'s Garden Center', '1025 Holmgreen Rd, 78220', 'Old-line southeast-side nursery, trees and shrubs'],
    ['JustPots', '17115 Redland Rd, 78247 · Mon–Sat 9–6, Sun 9–5', 'Urn, tall pots, saucers: fiberglass, terracotta, glazed'],
    ['Ten Thousand Pots', '4510 US-281, Spring Branch, 78070 · (512) 584-8889 · 9:30–6 daily', 'Large ceramic and stone-look planters, 30 minutes north'],
    ['Home Depot / Lowe\'s / Walmart / Tractor Supply', 'any San Antonio store, order for pickup', 'Mayne Fairfield boxes, boot trays, gravel, fertilizer'],
    ['gardeners.com', 'online', 'Adjustable self-watering railing planters'],
    ['Ewing Irrigation', '5826 Hawk Springs Ste 1103 (and other SA branches)', 'Drip tubing and fittings, later'],
    ['SiteOne Landscape Supply', 'two San Antonio branches', 'Drip parts, bulk gravel'],
  ]);

  return `<div style="width:1120px;box-sizing:border-box;padding:44px 40px 48px;background:${t.bg};color:${t.text};font-family:'Work Sans',system-ui,sans-serif;display:flex;flex-direction:column;gap:28px">
  <header style="display:flex;flex-direction:column;gap:8px">
    <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:${t.muted}">Balcony Oasis · San Antonio · build plan</div>
    <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:64px;font-weight:500;line-height:.98;letter-spacing:-.01em;color:${t.text}">How to build it</h1>
    <p style="margin:6px 0 0;font-size:15px;line-height:1.55;max-width:900px;color:${t.text};opacity:.9">Everything the Provence plan needs, with exact products, counts, plant names and where to get them in San Antonio. Planter products are named because their dimensions were checked against the balcony; swap brands if you find a better finish in the same size. Nursery stock changes weekly, so call before you drive.</p>
  </header>
  <div style="display:flex;flex-direction:column;gap:12px">${H2('Planters')}${planters}</div>
  <div style="display:flex;flex-direction:column;gap:12px">${H2('Plants')}${plants}</div>
  <div style="display:flex;flex-direction:column;gap:12px">${H2('Soil and supplies')}${soil}</div>
  <div style="display:flex;flex-direction:column;gap:12px">${H2('Step by step')}<div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:16px">${steps}</div></div>
  <div style="display:flex;flex-direction:column;gap:12px">${H2('Where to buy')}${sources}${P('Older San Antonio nursery lists still show Shades of Green on Sunset Rd, Schulz Nursery on Broadway and Sandy Oaks Olive Orchard in Elmendorf. All three have closed.')}</div>
  <div style="display:flex;flex-direction:column;gap:8px;padding:18px 20px;background:${t.panel};border:1px solid ${t.accent}">${H3('Weight, in case the building asks')}${P('Fully wet, the three troughs, seven rail planters, urn and two tall pots come to roughly 750 lb spread along 20 ft of rail line, well inside what a code balcony carries. Keep the heavy pieces at the corners and along the edge rather than clustered in the middle.')}</div>
</div>`;
}

function finalBody(c, imgPrefix = '') {
  const t = c.theme;
  const sw = (label, hex) => `<div style="display:flex;align-items:center;gap:10px"><span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${hex};border:1px solid rgba(0,0,0,.18)"></span><span style="font-size:13px;color:${t.text}">${label}</span></div>`;
  const layerCards = c.layers.map(([h, p, hex]) => `<div style="display:flex;flex-direction:column;gap:8px;padding:18px 18px 20px;background:${t.panel};border-top:3px solid ${hex}">
      <h3 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;line-height:1.1;color:${t.text}">${h}</h3>
      <p style="margin:0;font-size:13.5px;line-height:1.5;color:${t.text};opacity:.88">${p}</p></div>`).join('');
  const list = c.list.map(i => `<li style="padding:6px 0;border-bottom:1px solid rgba(128,128,128,.25);font-size:13px;line-height:1.4">${i}</li>`).join('');
  const furniture = [
    ['The sofa', 'Stays exactly where it is: its door-end arm against the fixed panel of the door, its far arm a few inches from the far return. It fixes everything else: 11"-deep troughs on the long rail keep a 30" path in front of the cushions, and the door\'s opening panel is on the far side of the door from the sofa, so people come out beside the chair, not the sofa.'],
    ['The armchair', 'At 29" square it takes the near rail corner, against the near return with its back to the mesh, turned to face the sofa down the balcony. Coming out of the door you pass its side. One of your charcoal pots sits beside it with a rosemary ball; the other stands by the olive urn at the far corner.'],
    ['Pillows, and no table', 'The black frames and white piping are already French; what they need is softness. Two lavender linen pillows and one oatmeal ticking-stripe pillow on the sofa. There is no wall left for a side table, so a tray on the sofa cushion does that job.'],
  ].map(([h, p]) => `<div style="display:flex;flex-direction:column;gap:6px"><h3 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;color:${t.text}">${h}</h3><p style="margin:0;font-size:13.5px;line-height:1.5;color:${t.text};opacity:.9">${p}</p></div>`).join('');
  return `<div style="width:1120px;box-sizing:border-box;padding:44px 40px 48px;background:${t.bg};color:${t.text};font-family:'Work Sans',system-ui,sans-serif;display:flex;flex-direction:column;gap:26px">
  <header style="display:flex;flex-direction:column;gap:8px">
    <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:${t.muted}">Balcony Oasis · San Antonio · final plan</div>
    <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:64px;font-weight:500;line-height:.98;letter-spacing:-.01em;color:${t.text}">${c.name}</h1>
    <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:24px;line-height:1.25;color:${t.accent}">${c.tag}</p>
    <p style="margin:6px 0 0;font-size:15px;line-height:1.55;max-width:900px;color:${t.text};opacity:.9">${c.mood}</p>
  </header>
  <div style="display:flex;flex-direction:column;gap:10px">
    <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:${t.text}">What it looks like</h2>
    <p style="margin:0;font-size:13.5px;line-height:1.5;max-width:900px;color:${t.text};opacity:.9">Edits of your own photos, made one step at a time from the drawings below, so the railing, floor, buildings and furniture are the real ones and everything added is sized to them.</p>
    <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:16px">
      <figure style="margin:0;display:flex;flex-direction:column;gap:6px"><img src="${imgPrefix}render-along-the-balcony.jpg" alt="Render looking along the balcony from the door end" style="width:100%;height:auto;display:block;border:1px solid rgba(0,0,0,.15)"><figcaption style="font-size:12.5px;color:${t.muted}">From the door end, late afternoon: hedge and jasmine on the long rail, lavender over the cap, the olive urn in the far corner, the armchair at the far return facing back, rosemary in your pots on the wall strip, the sofa with its pillows and the lantern above.</figcaption></figure>
      <figure style="margin:0;display:flex;flex-direction:column;gap:6px"><img src="${imgPrefix}render-from-the-door.jpg" alt="Render looking out across the long rail from the sofa" style="width:100%;height:auto;display:block;border:1px solid rgba(0,0,0,.15)"><figcaption style="font-size:12.5px;color:${t.muted}">From the sofa, looking out across the three panels: troughs, hedge, jasmine on the mesh, six rail planters, and the olive in the corner.</figcaption></figure>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px">
    <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:${t.text}">Looking out from the sofa</h2>
    <div style="border:1px solid rgba(128,128,128,.3);background:${c.el.sky}">${elevation(c)}</div>
    <div style="display:flex;justify-content:space-between;font-size:12px;color:${t.muted}"><span>The 162" rail, 43" high: hedge, jasmine on the mesh, planters over the cap; the armchair in the near corner at left with a rosemary pot, the cypress pair behind it on the near return, olive urn in front of the last trough at the far corner (right) with the second rosemary pot</span><span>6 px per inch</span></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px">
    <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:${t.text}">Looking back at the wall</h2>
    <div style="border:1px solid rgba(128,128,128,.3);background:#9a9b98">${wallElevation(c)}</div>
    <div style="display:flex;justify-content:space-between;font-size:12px;color:${t.muted}"><span>The short wall with the outlet at far right, then the door with its opening panel toward it, then your sofa with pillows and the lantern above, ending a few inches from the far return; the cypress pair and a rosemary pot in the foreground at right, the olive urn and the other pot at left</span><span>6 px per inch</span></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:26px;align-items:start">
    <div style="display:flex;flex-direction:column;gap:10px">
      <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:${t.text}">Floor plan, 74" × 162"</h2>
      <div style="background:${t.panel};padding:8px">${plan(c.el, { pot: c.pot, hedgeTop: c.hedgeTop, ...c.plan })}</div>
      <p style="margin:0;font-size:12.5px;line-height:1.5;color:${t.muted}">Sofa 78.5" × 33.5" and chair 29" × 29.25" from the maker's dimensions. The door is drawn at an estimated 58" with about 18" of wall (the one with the outlet) between it and the near return; the sofa's far arm is scaled from the photos at about 8" from the far return.</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:22px">
      <div style="display:grid;grid-template-columns:repeat(1, minmax(0, 1fr));gap:16px">${furniture}</div>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:12px">
    <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:${t.text}">The planting, layer by layer</h2>
    <div style="display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:16px">${layerCards}</div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:26px;align-items:start">
    <div style="display:flex;flex-direction:column;gap:12px">
      <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:${t.text}">Materials and palette</h2>
      <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:10px 16px">${c.materials.map(([l, h]) => sw(l, h)).join('')}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;padding:18px 20px;background:${t.panel};border:1px solid ${t.accent}">
      <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;color:${t.text}">Keeping the floor below dry</h2>
      <p style="margin:0;font-size:13.5px;line-height:1.5;color:${t.text};opacity:.9">${c.water}</p>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px">
    <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:${t.text}">Shopping list</h2>
    <ul style="list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:0 32px;color:${t.text}">${list}</ul>
  </div>
</div>`;
}

function recipeBody() {
  const t = { bg: '#f1ede4', panel: '#e7e1d3', text: '#2a2723', muted: '#7a7369', accent: '#6b7a55' };
  return `<div style="width:1120px;box-sizing:border-box;padding:44px 40px 48px;background:${t.bg};color:${t.text};font-family:'Work Sans',system-ui,sans-serif;display:flex;flex-direction:column;gap:20px">
  <header style="display:flex;flex-direction:column;gap:8px">
    <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:${t.muted}">Balcony Oasis · appendix</div>
    <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:48px;font-weight:500;line-height:.98;color:${t.text}">How the renders were made</h1>
    <p style="margin:6px 0 0;font-size:14px;line-height:1.55;max-width:900px;color:${t.text};opacity:.9">Kept here in case a view needs redoing. The finished images came from ChatGPT editing the original photos one change at a time, then a realism and 4K pass in Adobe Firefly with the Gemini Nano Banana Pro model.</p>
  </header>
  ${renderPrompts(t)}
</div>`;
}

function agave(cx, base) {
  let s = '';
  for (let i = 0; i < 14; i++) {
    const a = -90 + (i - 6.5) * 14, len = 70 + (i % 3) * 14;
    s += `<path d="M${cx} ${base} Q${cx + Math.cos((a - 6) * Math.PI / 180) * len * .6} ${base + Math.sin((a - 6) * Math.PI / 180) * len * .6} ${cx + Math.cos(a * Math.PI / 180) * len} ${base + Math.sin(a * Math.PI / 180) * len} Q${cx + Math.cos((a + 6) * Math.PI / 180) * len * .6} ${base + Math.sin((a + 6) * Math.PI / 180) * len * .6} ${cx} ${base} Z" fill="${i % 2 ? '#7f98a6' : '#93aab6'}" stroke="#5f7583" stroke-width="1"/>`;
  }
  return s;
}

function wallElevation(c) {
  // looking back at the building from the rail: door at left, sofa to its right, the corner urn at far right
  const e = c.el, seed = 900;
  const x0 = EL.x0, floor = EL.floor, wallTop = 40;
  let s = `<rect x="0" y="0" width="${EL.w}" height="${floor}" fill="#9a9b98"/>`;
  for (let px = x0 - 40; px < EL.w; px += 120) s += `<rect x="${px}" y="0" width="118" height="${floor}" fill="#a3a4a1" stroke="#8c8d8a" stroke-width="1"/>`;
  s += `<rect x="0" y="${floor - 6}" width="${EL.w}" height="6" fill="#2b2b2b"/>`;
  // door: mirrored plan position (plan x 82..152 from return A) -> from the left when facing the wall
  const dX = x0 + (L - 76) * IN, dW = 58 * IN, dTop = floor - 84 * IN;
  s += `<rect x="${dX - 6}" y="${dTop - 6}" width="${dW + 12}" height="${84 * IN + 6}" fill="#2a2b2d"/>`;
  s += `<rect x="${dX}" y="${dTop}" width="${dW / 2 - 3}" height="${84 * IN}" fill="#33393f"/><rect x="${dX + dW / 2 + 3}" y="${dTop}" width="${dW / 2 - 3}" height="${84 * IN}" fill="#4b5560"/>`;
  s += `<rect x="${dX + 22}" y="${dTop + 40}" width="${dW / 2 - 44}" height="${84 * IN - 80}" fill="#22262a" opacity=".5"/><rect x="${dX + dW / 2 + 18}" y="${dTop + 40}" width="${dW / 2 - 40}" height="${84 * IN - 80}" fill="#5c6570" opacity=".6"/>`;
  s += `<rect x="${dX + dW / 2 + 5}" y="${floor - 40 * IN}" width="5" height="60" rx="2" fill="#9ea2a6"/>`;
  s += `<text x="${dX + 3 * dW / 4}" y="${floor - 66 * IN}" text-anchor="middle" font-size="12" fill="#ecebe6" font-family="Work Sans, system-ui, sans-serif">opening side</text>`;
  s += `<rect x="${dX + dW + 40}" y="${floor - 46 * IN}" width="26" height="22" rx="3" fill="#d9d3c2" stroke="#7a7a76" stroke-width="1"/>`;
  // sofa against the wall, right of the door, plus pillows
  const sofaX = x0 + (L - 154.5) * IN;
  s += spindleSofa(sofaX, floor - 2, e, 78.5);
  s += pillow(sofaX + 30, floor - 2 - 26 * IN, 90, 80, '#9a93bf', e) + pillow(sofaX + 78.5 * IN - 120, floor - 2 - 26 * IN, 90, 80, '#e9e4d6', e) + pillow(sofaX + 78.5 * IN - 190, floor - 2 - 24 * IN, 70, 66, '#c8c1d8', e);
  // wall lantern above the sofa's near arm, side table at the door end
  const lx = sofaX + 78.5 * IN / 2 - 15, ly = floor - 46 * IN;
  s += `<rect x="${lx}" y="${ly}" width="30" height="46" rx="3" fill="none" stroke="${e.iron}" stroke-width="2.5"/><rect x="${lx + 6}" y="${ly + 8}" width="18" height="30" fill="#f2d9a0" opacity=".8"/><line x1="${lx + 15}" y1="${ly}" x2="${lx + 15}" y2="${ly - 18}" stroke="${e.iron}" stroke-width="2"/>`;
  s += pot(118, floor + 44, 62, 46, 'charcoal') + hedge(92, floor + 44 - 46 - 56, 52, 60, ['#5f7f4b', '#6f8f58', '#7e9a68'], 77, 'ball') + pot(EL.w - 138, floor + 40, 56, 44, 'charcoal') + hedge(EL.w - 160, floor + 40 - 44 - 50, 46, 54, ['#5f7f4b', '#6f8f58', '#7e9a68'], 78, 'ball');
  // the olive urn stands in the far right corner (rail side), so it reads in the foreground here
  s += floorBand(e);
  s += tree('olive', 40, floor + 28, { pot: 'stone', potW: 120, potH: 110 }, 3);
  // the cypress pair stands at the door end, in the foreground at right
  s += tree('cypress', EL.w - 100, floor + 26, { pot: 'stone', potW: 84, potH: 90, height: 300 }, 4) + tree('cypress', EL.w - 44, floor + 40, { pot: 'stone', potW: 84, potH: 90, height: 280 }, 12);
  return `<svg viewBox="0 0 ${EL.w} ${EL.h}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Elevation of the wall side with the sofa and door">${s}</svg>`;
}

function elevation(c) {
  const e = c.el, seed = c.n * 100;
  let s = backdrop(e) + rail(e);
  // hanging planters (behind hedge, in front of mesh)
  let k = 0;
  for (const p of [0, 54, 108]) for (const off of [15, 39]) s += hangingPlanter(EL.x0 + (p + off) * IN, 20 * IN, c.hang, seed + 20 + k++);
  // vines climb from the troughs next to each post
  for (const p of [6, 50, 60, 104, 114, 158]) s += vine(EL.x0 + p * IN, EL.floor - 14 * IN - 30, EL.railTop + 30, c.vine, seed + 40 + p);
  // troughs and hedges
  for (const [px, wIn] of (c.troughsEl ?? [[3, 48], [57, 48], [111, c.shortLast ? 36 : 48]])) {
    const p = px, x = EL.x0 + px * IN, w = wIn * IN, ty = EL.floor - 14 * IN;
    s += trough(x, ty, w, 14 * IN, c.pot);
    s += hedge(x - 4, ty - 17 * IN, w + 8, 18 * IN, c.hedgeGreens, seed + 60 + p);
  }
  s += floorBand(e);
  s += c.anchorsEl(e);
  s += c.furnitureEl ? c.furnitureEl(e) : chairs(e);
  return `<svg viewBox="0 0 ${EL.w} ${EL.h}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Elevation of the long rail">${s}</svg>`;
}

// ---------- HTML assembly ----------
const FONT_LINK = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&amp;family=Work+Sans:wght@400;500;600&amp;display=swap">`;

function conceptBody(c, { forCanvas }) {
  const t = c.theme;
  const W = 1120;
  const sw = (label, hex) => `<div style="display:flex;align-items:center;gap:10px"><span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${hex};border:1px solid rgba(0,0,0,.18)"></span><span style="font-size:13px;color:${t.text}">${label}</span></div>`;
  const layerCards = c.layers.map(([h, p, hex]) => `<div style="display:flex;flex-direction:column;gap:8px;padding:18px 18px 20px;background:${t.panel};border-top:3px solid ${hex}">
      <h3 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;line-height:1.1;color:${t.text}">${h}</h3>
      <p style="margin:0;font-size:13.5px;line-height:1.5;color:${t.text};opacity:.88">${p}</p></div>`).join('');
  const list = c.list.map(i => `<li style="padding:6px 0;border-bottom:1px solid rgba(128,128,128,.25);font-size:13px;line-height:1.4">${i}</li>`).join('');
  return `<div style="width:${W}px;box-sizing:border-box;padding:44px 40px 48px;background:${t.bg};color:${t.text};font-family:'Work Sans',system-ui,sans-serif;display:flex;flex-direction:column;gap:26px">
  <header style="display:flex;flex-direction:column;gap:8px">
    <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:${t.muted}">Concept ${c.n} of 4 · Balcony Oasis · San Antonio</div>
    <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:64px;font-weight:500;line-height:.98;letter-spacing:-.01em;color:${t.text}">${c.name}</h1>
    <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:24px;line-height:1.25;color:${t.accent}">${c.tag}</p>
    <p style="margin:6px 0 0;font-size:15px;line-height:1.55;max-width:900px;color:${t.text};opacity:.9">${c.mood}</p>
  </header>
  <div style="border:1px solid rgba(128,128,128,.3);background:${c.el.sky}">${elevation(c)}</div>
  <div style="display:flex;justify-content:space-between;font-size:12px;color:${t.muted}"><span>Looking out from the door: the 162" rail, 43" high, 4" welded mesh on 3" posts</span><span>Drawn to scale, 6 px per inch</span></div>
  <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:26px;align-items:start">
    <div style="display:flex;flex-direction:column;gap:10px">
      <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:${t.text}">Floor plan, 74" × 162"</h2>
      <div style="background:${t.panel};padding:8px">${plan(c.el, { pot: c.pot, hedgeTop: c.hedgeTop, ...c.plan })}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:22px">
      <div style="display:flex;flex-direction:column;gap:12px">
        <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:${t.text}">Materials and palette</h2>
        <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:10px 16px">${c.materials.map(([l, h]) => sw(l, h)).join('')}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;padding:18px 20px;background:${t.panel};border:1px solid ${t.accent}">
        <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;color:${t.text}">Keeping the floor below dry</h2>
        <p style="margin:0;font-size:13.5px;line-height:1.5;color:${t.text};opacity:.9">${c.water}</p>
      </div>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:12px">
    <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:${t.text}">The planting, layer by layer</h2>
    <div style="display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:16px">${layerCards}</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px">
    <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:${t.text}">Shopping list</h2>
    <ul style="list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:0 32px;color:${t.text}">${list}</ul>
  </div>
</div>`;
}

function briefBody() {
  const t = { bg: '#f1ede4', panel: '#e7e1d3', text: '#2a2723', muted: '#7a7369', accent: '#6b7a55' };
  const card = (c) => `<div style="display:flex;flex-direction:column;gap:10px;padding:18px;background:${c.dark ? '#25282c' : c.theme.panel};color:${c.dark ? '#ede9e0' : '#2a2723'};border-top:4px solid ${c.theme.accent}">
      <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;opacity:.7">Concept ${c.n}</div>
      <h3 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:600;line-height:1">${c.name}</h3>
      <p style="margin:0;font-size:13.5px;line-height:1.5;opacity:.9">${c.tag}.</p>
      <div style="display:flex;gap:6px;margin-top:4px">${c.materials.map(([, h]) => `<span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${h};border:1px solid rgba(0,0,0,.15)"></span>`).join('')}</div>
    </div>`;
  const given = [
    ['The balcony', '162" along the rail, 74" deep. A top-floor corner with rail on three sides and the sliding door on the fourth. Bare concrete floor, grey composite wall panels.'],
    ['The rail', '43" high, 3" posts at 54" centers, a 3" flat top cap, 4" welded-wire mesh. The mesh is the asset: it is a ready-made trellis for anything that climbs.'],
    ['What you already have', 'Two black iron chairs and a two-seat bench with white cushions, two charcoal round pots. Every concept keeps them; concept 4 is designed around them.'],
    ['The climate', 'San Antonio, USDA zone 9a: 100° afternoons June to September, a few nights below freezing, and high-rise wind that dries a pot twice as fast as one on the ground. The plants here are the Mediterranean ones that already do well in Alamo Heights and King William gardens.'],
  ].map(([h, p]) => `<div style="display:flex;flex-direction:column;gap:6px"><h3 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;color:${t.text}">${h}</h3><p style="margin:0;font-size:13.5px;line-height:1.5;color:${t.text};opacity:.9">${p}</p></div>`).join('');
  const rules = [
    ['No drain holes', 'Every planter on the rail line is self-watering or sub-irrigated: a sealed reservoir under the soil, filled through a tube, with a gauge. Water goes in measured; nothing comes out the bottom. It also means fewer waterings in August.'],
    ['Over-rail planters with a reservoir', 'Rail planters are the classic drip offender. Buy the ones with an attached reservoir or clip-on saucer, sized for a 3" top cap, and mount the gauge on the inside face.'],
    ['Drip, not a hose', 'A small reservoir (5–7 gallons) with a battery pump or gravity feed runs quarter-inch line to every planter on a pre-dawn timer. Short runs, half-gallon-per-hour emitters, no overflow. Refill the reservoir from the kitchen.'],
    ['Mulch and sweep', 'Pea gravel or straw on the soil stops splash; a broom, not a hose, cleans the floor. Optional: limestone-tone composite deck tiles over the concrete for the look and a dry surface underfoot.'],
  ].map(([h, p]) => `<div style="display:flex;flex-direction:column;gap:6px;padding:16px 18px;background:${t.panel};border-top:3px solid ${t.accent}"><h3 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:600;color:${t.text}">${h}</h3><p style="margin:0;font-size:13px;line-height:1.5;color:${t.text};opacity:.9">${p}</p></div>`).join('');
  return `<div style="width:1120px;box-sizing:border-box;padding:44px 40px 48px;background:${t.bg};color:${t.text};font-family:'Work Sans',system-ui,sans-serif;display:flex;flex-direction:column;gap:30px">
  <header style="display:flex;flex-direction:column;gap:10px">
    <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:${t.muted}">Balcony Oasis · San Antonio · four directions</div>
    <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:72px;font-weight:500;line-height:.95;letter-spacing:-.01em;color:${t.text}">A Mediterranean balcony, thirteen feet long</h1>
    <p style="margin:6px 0 0;font-size:16px;line-height:1.55;max-width:880px;color:${t.text};opacity:.9">Four ways to turn a bare top-floor balcony into a French-countryside room: a hedge to swallow the lower rail, climbers to soften the mesh, planters spilling over the top cap, and one or two anchor trees at the corners. All four share the same bones and the same no-drip watering system; they differ in color, mood and how much you want to pick and eat.</p>
  </header>
  <div style="display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:16px">${concepts.map(card).join('')}</div>
  <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:22px 40px">${given}</div>
  <div style="display:flex;flex-direction:column;gap:12px">
    <h2 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:600;color:${t.text}">The no-drip system every concept uses</h2>
    <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:16px">${rules}</div>
  </div>
  <p style="margin:0;font-size:12.5px;line-height:1.5;color:${t.muted}">Assumed from the photos: rail on three sides, door roughly centered on the wall side, sun exposure unknown. If the long rail faces west, take the full-sun swaps noted in each concept.</p>
</div>`;
}

function dcWrap(body, bg) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  ${FONT_LINK}
  <style>
    body { margin: 0; background: ${bg}; }
    a { color: #6b7a55; } a:hover { color: #4f5b3e; }
    h1, h2, h3 { text-wrap: balance; }
    p { text-wrap: pretty; }
  </style>
</helmet>
${body}
</x-dc>
</body>
</html>
`;
}

// ---- write canvas working files ----
writeFileSync(join(here, 'Main.dc.html'), dcWrap(finalBody(finalPlan), finalPlan.theme.bg));
writeFileSync(join(here, 'Brief.dc.html'), dcWrap(briefBody(), '#f1ede4'));
writeFileSync(join(here, 'BuildPlan.dc.html'), dcWrap(buildBody(), '#f4f0e7'));
writeFileSync(join(here, 'Recipe.dc.html'), dcWrap(recipeBody(), '#f1ede4'));
for (const c of concepts) writeFileSync(join(here, `${c.id}.dc.html`), dcWrap(conceptBody(c, { forCanvas: true }), c.theme.bg));
const H = 1820;
writeFileSync(join(here, 'canvas.json'), JSON.stringify({
  pages: [{ id: 'page-1', name: 'Final plan' }, { id: 'page-2', name: 'Directions' }],
  artboards: [
    { file: 'Main.dc.html', x: 0, y: 0, w: 1120, h: 3700, title: 'The Provence plan', page: 'page-1' },
    { file: 'BuildPlan.dc.html', x: 1220, y: 0, w: 1120, h: 2900, title: 'How to build it', page: 'page-1' },
    { file: 'Recipe.dc.html', x: 2440, y: 0, w: 1120, h: 2600, title: 'How the renders were made', page: 'page-1' },
    { file: 'Brief.dc.html', x: 0, y: 0, w: 1120, h: 1500, title: 'Brief and water plan', page: 'page-2' },
    ...concepts.map((c, i) => ({ file: `${c.id}.dc.html`, x: i * 1220, y: 1720, w: 1120, h: H, title: `Concept ${c.n} · ${c.name}`, page: 'page-2' })),
  ],
  launch: { view: 'canvas', page: 'page-1' },
}, null, 2));

// ---- plain page for the repo ----
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Balcony Oasis Mockups</title>
${FONT_LINK}
<style>
  :root { color-scheme: light; --bg: #efeae0; --ink: #2a2723; --muted: #7a7369; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font-family: 'Work Sans', system-ui, sans-serif; }
  .wrap { max-width: 1120px; margin: 0 auto; padding-inline: 16px; padding-block: 24px 64px; display: flex; flex-direction: column; gap: 32px; }
  .board { width: 100%; overflow-x: auto; border: 1px solid rgba(0,0,0,.12); box-shadow: 0 30px 60px -40px rgba(20,20,20,.35); }
  .board > div { max-width: 100%; }
  nav { display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 14px; }
  nav a { color: var(--ink); text-decoration: none; border-bottom: 1px solid rgba(0,0,0,.3); }
  nav a:hover { border-bottom-color: currentColor; }
  @media (max-width: 1160px) { .board > div { width: 100% !important; } .board [style*="grid-template-columns:repeat(4"] { grid-template-columns: repeat(2, minmax(0,1fr)) !important; } }
  @media (max-width: 720px) { .board > div { padding: 28px 16px 32px !important; } .board [style*="grid-template-columns"] { grid-template-columns: 1fr !important; } .board h1 { font-size: 42px !important; } .board header p:first-of-type { font-size: 20px !important; } }
</style>
</head>
<body>
<div class="wrap">
  <nav aria-label="Sections"><a href="#plan">The plan</a><a href="#build">How to build it</a><a href="#recipe">How the renders were made</a></nav>
  <section class="board" id="plan">${finalBody(finalPlan, 'INLINE:')}</section>
  <section class="board" id="build">${buildBody()}</section>
  <section class="board" id="recipe">${recipeBody()}</section>
</div>
</body>
</html>
`;
const inline = (name) => `data:image/jpeg;base64,${readFileSync(join(here, '..', 'renders', name)).toString('base64')}`;
writeFileSync(join(here, '..', 'index.html'), page.replace(/INLINE:(render-[a-z-]+\.jpg)/g, (m, n) => inline(n)));
console.log('wrote', ['Main', 'BuildPlan', 'Brief', ...concepts.map(c => c.id)].map(n => n + '.dc.html').join(', '), 'canvas.json, ../index.html');
