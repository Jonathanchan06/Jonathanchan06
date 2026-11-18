// Generates assets/hero.svg: a pixel-art Victoria Harbour night skyline.
// Run:  node scripts/build-hero.mjs
// Every "pixel" is one grid unit; the whole scene is scaled up by S.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const W = 225, H = 105, S = 4; // 900 x 420 px
const WL = 82;                 // waterline row

// deterministic RNG so the picture is stable between rebuilds
let seed = 20260617;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (a) => a[Math.floor(rnd() * a.length)];
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const out = [];
const defs = [];
const lights = []; // [x, color] samples used for harbour reflections
const anim = (cls, delay) => ` class="${cls}"` + (delay !== undefined ? ` style="animation-delay:${delay.toFixed(2)}s"` : '');
const r = (x, y, w, h, fill, extra = '') =>
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`);

const NEON = ['#ff4fa3', '#5ef2ff', '#ffd36b', '#b388ff'];
const WARM = ['#ffd36b', '#ffe6a3', '#ffc266'];
const COOL = ['#8fe9ff', '#bfefff'];

// ---------------------------------------------------------------- sky
const bands = [
  [0, '#0d0b26'], [14, '#141035'], [26, '#1c1446'], [37, '#271957'],
  [47, '#361e62'], [56, '#4b246b'], [64, '#652b71'], [72, '#82326f'],
];
bands.forEach(([y, c], i) => {
  const next = i + 1 < bands.length ? bands[i + 1][0] : WL;
  r(0, y, W, next - y, c);
});
// checkerboard dithering between bands
bands.slice(1).forEach(([y, c], i) => {
  defs.push(`<pattern id="d${i}" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="${c}"/><rect x="1" y="1" width="1" height="1" fill="${c}"/></pattern>`);
  r(0, y - 2, W, 2, `url(#d${i})`);
});

// ---------------------------------------------------------------- moon
const MX = 198, MY = 13, MR = 6;
for (let y = -MR - 2; y <= MR + 2; y++) for (let x = -MR - 2; x <= MR + 2; x++) {
  const d = x * x + y * y;
  if (d <= MR * MR) r(MX + x, MY + y, 1, 1, (x === -2 && y === 1) || (x === 2 && y === -2) || (x === 1 && y === 3) ? '#e2cf8f' : '#f8ebb8');
  else if (d <= (MR + 2) * (MR + 2)) r(MX + x, MY + y, 1, 1, '#f8ebb8', ' fill-opacity=".08"');
}

// ---------------------------------------------------------------- stars
for (let n = 0; n < 75; n++) {
  const x = ri(0, W - 1), y = ri(1, 44);
  if (x >= 5 && x <= 165 && y <= 30) continue;                 // keep text clean
  if (Math.abs(x - MX) <= MR + 3 && Math.abs(y - MY) <= MR + 3) continue;
  const tw = rnd() < 0.4;
  r(x, y, 1, 1, rnd() < 0.7 ? '#ffffff' : '#c9c3ff', (rnd() < 0.5 ? ' fill-opacity=".55"' : '') + (tw ? anim('tw', rnd() * 4) : ''));
}

// ---------------------------------------------------------------- pixel fonts
const F5 = {
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};
const F3 = {
  U: ['101', '101', '101', '101', '111'], O: ['111', '101', '101', '101', '111'],
  F: ['111', '100', '110', '100', '100'], T: ['111', '010', '010', '010', '010'],
  C: ['111', '100', '100', '100', '111'], S: ['111', '100', '111', '001', '111'],
  M: ['101', '111', '111', '101', '101'], A: ['111', '101', '111', '101', '101'],
  H: ['101', '101', '111', '101', '101'], R: ['110', '101', '110', '101', '101'],
  N: ['110', '101', '101', '101', '101'], K: ['101', '101', '110', '101', '101'],
  G: ['111', '100', '101', '101', '111'], L: ['100', '100', '100', '100', '111'],
  '+': ['000', '010', '111', '010', '000'], '/': ['001', '001', '010', '100', '100'],
  '<': ['001', '010', '100', '010', '001'], '>': ['100', '010', '001', '010', '100'],
  '-': ['000', '000', '111', '000', '000'], ' ': ['000', '000', '000', '000', '000'],
};
function text(str, x0, y0, font, scale, color, extra = '') {
  let x = x0;
  for (const ch of str) {
    const g = font[ch];
    if (!g) throw new Error(`no glyph for "${ch}"`);
    g.forEach((row, gy) => [...row].forEach((b, gx) => {
      if (b === '1') r(x + gx * scale, y0 + gy * scale, scale, scale, color, extra);
    }));
    x += (g[0].length + 1) * scale;
  }
}
text('JONATHAN CHAN', 9, 7, F5, 2, '#ff4fa3');   // neon drop shadow
text('JONATHAN CHAN', 8, 6, F5, 2, '#fff4e0');
text('UOFT CS + MATH // TORONTO <> HONG KONG', 8, 24, F3, 1, '#5ef2ff');

// ---------------------------------------------------------------- airplane
out.push(`<g class="pl"><rect x="0" y="31" width="3" height="1" fill="#c9c3ff" fill-opacity=".7"/><rect x="0" y="31" width="1" height="1" fill="#ff5d5d" class="bk"/></g>`);

// ---------------------------------------------------------------- mountains
function ridge(points, color) {
  for (let x = 0; x < W; x++) {
    let i = 0;
    while (i < points.length - 2 && x > points[i + 1][0]) i++;
    const [x1, y1] = points[i], [x2, y2] = points[i + 1];
    const top = Math.round(y1 + ((y2 - y1) * (x - x1)) / (x2 - x1));
    r(x, top, 1, WL - top, color);
  }
}
ridge([[0, 52], [22, 45], [48, 40], [70, 45], [98, 37], [124, 43], [152, 39], [182, 46], [206, 41], [225, 48]], '#2a1b52');
ridge([[0, 60], [30, 55], [62, 58], [100, 53], [140, 57], [178, 52], [225, 58]], '#1f1545');

// ---------------------------------------------------------------- buildings
function windows(x, y, w, h, lit, cols, rowStep = 2) {
  for (let yy = y + 1; yy < y + h - 1; yy += rowStep)
    for (let xx = x + 1; xx < x + w - 1; xx += 2)
      if (rnd() < lit) {
        const c = pick(cols);
        r(xx, yy, 1, 1, c, rnd() < 0.05 ? anim('fl', rnd() * 8) : '');
        lights.push([xx, c]);
      }
}
function tower(x, w, top, body, lit, cols) {
  r(x, top, w, WL - top, body);
  windows(x, top, w, WL - top, lit, cols);
  if (rnd() < 0.3) {
    const ax = x + Math.floor(w / 2), ah = ri(2, 4);
    r(ax, top - ah, 1, ah, '#3a3566');
    r(ax, top - ah - 1, 1, 1, '#ff5d5d', anim('bk', rnd() * 2));
  }
}

// back row
for (let x = 0; x < W;) {
  const w = ri(4, 9);
  tower(x, w, ri(50, 66), pick(['#1a1840', '#201c4b', '#16143a']), 0.22, [...WARM, ...COOL]);
  x += w + (rnd() < 0.3 ? 1 : 0);
}

// IFC (two-tiered crown with fins)
{
  const x = 28, body = '#2c3466';
  r(x, 46, 11, WL - 46, body);
  r(x, 46, 1, WL - 46, '#3a4580');
  r(x + 1, 42, 9, 4, body);
  r(x + 2, 38, 7, 4, body);
  for (let y = 48; y < WL - 1; y += 3) { r(x + 1, y, 9, 1, '#6fb2ff', ' fill-opacity=".55"'); lights.push([x + 3, '#6fb2ff'], [x + 7, '#6fb2ff']); }
  for (let y = 43; y < 46; y += 2) r(x + 2, y, 7, 1, '#6fb2ff', ' fill-opacity=".55"');
  for (let fx = x + 2; fx <= x + 8; fx += 2) r(fx, 33, 1, 5, '#a9bdff');
  r(x + 3, 36, 1, 2, body); r(x + 5, 36, 1, 2, body); r(x + 7, 36, 1, 2, body);
  r(x + 5, 31, 1, 2, '#a9bdff');
  r(x + 5, 30, 1, 1, '#ff5d5d', anim('bk', 0.3));
}

// The Center (neon chase stripes)
{
  const x = 58, body = '#1a1842';
  r(x, 48, 8, WL - 48, body);
  r(x + 1, 46, 6, 2, body);
  r(x + 3, 41, 1, 5, '#3a3566');
  r(x + 3, 40, 1, 1, '#ff5d5d', anim('bk', 1.1));
  for (let k = 0, y = 48; y <= 62; y += 2, k++) { r(x, y, 8, 1, '#ff4fa3', anim('cy', -k * 0.4)); lights.push([x + 2, pick(NEON)], [x + 5, pick(NEON)]); }
  windows(x, 63, 8, WL - 63, 0.4, WARM);
}

// Cheung Kong Center (silver grid box)
{
  const x = 70;
  r(x, 44, 10, 2, '#2a2f66');
  r(x, 46, 10, WL - 46, '#1e2250');
  windows(x, 46, 10, WL - 46, 0.75, ['#9fb0d8', '#7f90b8']);
}

// Bank of China Tower (sloped prism + X lattice + twin masts)
{
  const x = 86, w = 12, body = '#26315f', lat = '#b4c2ff';
  r(x, 50, w, WL - 50, body);
  for (let y = 40; y <= 49; y++) {
    const left = x + (49 - y);
    r(left, y, x + w - left, 1, body);
    r(left, y, 1, 1, lat);
  }
  r(x + w - 1, 40, 1, WL - 40, lat);
  r(x, 50, 1, WL - 50, lat);
  for (const b of [50, 62, 74]) {
    r(x, b, w, 1, lat);
    for (let i = 0; i < w && b + i < WL; i++) { r(x + i, b + i, 1, 1, lat); r(x + w - 1 - i, b + i, 1, 1, lat); }
  }
  r(x + 9, 33, 1, 7, '#c9d2ff'); r(x + 9, 32, 1, 1, '#ff5d5d', anim('bk', 0.7));
  r(x + 11, 35, 1, 5, '#c9d2ff'); r(x + 11, 34, 1, 1, '#ff5d5d', anim('bk', 1.4));
  for (let i = 0; i < 12; i++) lights.push([x + ri(1, 10), lat]);
}

// Central Plaza (gold grid, colour-changing pyramid top, spire)
{
  const x = 146, body = '#2b1f55';
  r(x, 44, 10, WL - 44, body);
  windows(x, 44, 10, WL - 44, 0.55, ['#ffd36b', '#ffb84d']);
  [[43, 0, 10], [42, 1, 8], [41, 2, 6], [40, 3, 4], [39, 4, 2]].forEach(([y, dx, w], k) =>
    r(x + dx, y, w, 1, '#ff4fa3', anim('cy', -k * 0.3)));
  r(x + 4, 33, 1, 6, '#d0c8ff');
  r(x + 4, 32, 1, 1, '#ff5d5d', anim('bk', 0.2));
}

// Hopewell Centre (round tower, rounded top)
{
  const x = 182, body = '#211c4e';
  r(x + 2, 50, 4, 1, body); r(x + 1, 51, 6, 1, body);
  r(x, 52, 8, WL - 52, body);
  r(x + 3, 49, 2, 1, '#ffd36b');
  windows(x, 52, 8, WL - 52, 0.5, COOL, 2);
}

// a couple of mid-rise fillers next to landmarks
tower(40, 6, 58, '#1d1a47', 0.35, WARM);
tower(122, 8, 54, '#1c1a45', 0.3, [...WARM, ...COOL]);
tower(160, 7, 57, '#1d1a47', 0.35, COOL);
tower(205, 9, 55, '#1c1a45', 0.3, WARM);

// front row: low waterfront blocks with neon signs
for (let x = 0; x < W;) {
  const w = ri(5, 11), top = ri(69, 76);
  r(x, top, w, WL - top, pick(['#110e2b', '#140f31']));
  windows(x, top, w, WL - top, 0.3, WARM);
  if (rnd() < 0.45) {
    const c = pick(NEON), sw = Math.min(w - 2, ri(2, 4));
    r(x + 1, top + 1, sw, 2, c, rnd() < 0.4 ? anim('fl', rnd() * 6) : '');
    lights.push([x + 1, c]);
  }
  x += w;
}

// promenade with lamps
r(0, WL - 1, W, 1, '#2a2150');
for (let x = 3; x < W; x += 8) { r(x, WL - 2, 1, 1, '#ffe6a3'); lights.push([x, '#ffe6a3']); }

// ---------------------------------------------------------------- harbour
r(0, WL, W, H - WL, '#100c2c');
r(0, 94, W, H - 94, '#0b0822');
defs.push(`<pattern id="dw" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#0b0822"/><rect x="1" y="1" width="1" height="1" fill="#0b0822"/></pattern>`);
r(0, 92, W, 2, 'url(#dw)');

// reflections: streaks under the lights, fading with depth
for (let n = 0; n < 160; n++) {
  const [lx, c] = pick(lights);
  const depth = Math.floor(Math.pow(rnd(), 1.6) * (H - WL - 2));
  const y = WL + 1 + depth;
  const op = (0.55 * (1 - depth / (H - WL))).toFixed(2);
  r(lx - (rnd() < 0.5 ? 1 : 0), y, ri(1, 3), 1, c, ` fill-opacity="${op}"` + anim('sh', rnd() * 3));
}
// small wave highlights
for (let n = 0; n < 45; n++) r(ri(0, W - 5), ri(WL + 2, H - 2), ri(2, 5), 1, '#2d2768', anim('wv', rnd() * 4));

// ---------------------------------------------------------------- boats
function sprite(rows, palette) {
  const parts = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (palette[ch]) parts.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[ch]}"/>`);
  }));
  return parts.join('');
}
// Star-Ferry-style green & white ferry
const ferry = sprite([
  '      ss      ',
  '  wwwwwwwwww  ',
  '  wywywywyww  ',
  'gggggggggggggg',
  ' gggggggggggg ',
], { s: '#e9eef7', w: '#e9eef7', y: '#ffd36b', g: '#1f8a54' });
out.push(`<g class="fe"><g transform="translate(0,86)">${ferry}</g></g>`);

// red-sailed junk
const junk = sprite([
  '   R    ',
  '  RR  R ',
  ' rRR rR ',
  ' RRR RRR',
  ' rRR rRR',
  ' RRR RRR',
  'bbbbbbbbb',
  ' bbbbbbb ',
], { R: '#d6383a', r: '#9e2427', b: '#5a3220' });
out.push(`<g class="jk"><g transform="translate(0,93)">${junk}</g></g>`);

// ---------------------------------------------------------------- assemble
const css = `
.tw{animation:tw 4s ease-in-out infinite}@keyframes tw{50%{opacity:.15}}
.bk{animation:bk 2s steps(1,end) infinite}@keyframes bk{50%{opacity:.15}}
.fl{animation:fl 7s steps(1,end) infinite}@keyframes fl{70%{opacity:0}85%{opacity:1}}
.cy{animation:cy 3.6s steps(1,end) infinite}@keyframes cy{0%{fill:#ff4fa3}33%{fill:#5ef2ff}66%{fill:#ffd36b}}
.sh{animation:sh 2.6s ease-in-out infinite alternate}@keyframes sh{to{opacity:.25}}
.wv{animation:wv 3s ease-in-out infinite alternate}@keyframes wv{to{transform:translateX(3px)}}
.fe{animation:fe 55s linear -20s infinite}@keyframes fe{from{transform:translateX(-16px)}to{transform:translateX(${W + 2}px)}}
.jk{animation:jk 90s linear -40s infinite}@keyframes jk{from{transform:translateX(${W + 2}px)}to{transform:translateX(-12px)}}
.pl{animation:pl 32s linear infinite}@keyframes pl{from{transform:translateX(${W + 4}px)}to{transform:translateX(-6px)}}
`.trim();

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * S}" height="${H * S}" viewBox="0 0 ${W * S} ${H * S}" shape-rendering="crispEdges" role="img" aria-label="Pixel-art Hong Kong skyline at night: Jonathan Chan, UofT CS + Math, Toronto and Hong Kong">
<defs><style>${css}</style>${defs.join('')}<clipPath id="frame"><rect width="${W * S}" height="${H * S}" rx="12"/></clipPath></defs>
<g clip-path="url(#frame)"><g transform="scale(${S})">
${out.join('\n')}
</g></g>
</svg>
`;
const dest = fileURLToPath(new URL('../assets/hero.svg', import.meta.url));
writeFileSync(dest, svg);
console.log(`wrote ${dest} (${(svg.length / 1024).toFixed(1)} KB, ${out.length} elements)`);
