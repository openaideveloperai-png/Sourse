// NOBODY HOME art: outdoor (names and sizes: docs/ART_LIST.md, sections C and D).
// The courtyard playground in the rain (swing, slide, sandbox, climbing dome, fence, the old zelkova,
// puddles, the drain and the key under it) and the basement (boiler, steam, banded pipes and valves,
// storage cages, the staff room: key board, cot, thermos and bento, rounds sheet, pet carriers).
// Light from the top-left; ramps are [highlight, light, base, shade, deep]. Solid parts are outlined
// (px.outline()); translucent extras (contact shadows, wet sheen, steam, glints, fine twigs, chain-link
// mesh) go on after the outline so they stay delicate.
// Anchors: bottom-centre of the footprint. Wall props sit on the lower wall row (see wallF).
(function (G) {
  'use strict';
  const C = G.C, mix = G.mix, dk = G.darken, lt = G.lighten;
  const R = function () { return Array.prototype.map.call(arguments, (h) => C(h)); };
  const fr = G.frame;
  // register only the names nobody else has drawn (the other art files load first)
  const def = (name, build, fps) => { if (!G.hasSprite(name)) G.defSprite(name, build, fps); };
  // wall prop frame: the sprite's bottom edge sits at wall-local y `bottom` (0 = top of the 32px wall face, 32 = floor line)
  const wallF = (px, bottom, ax) => fr(px, ax === undefined ? px.w / 2 : ax, px.h + (32 - bottom));

  // ---------------- palettes ----------------
  const STEEL = R('#c8ccd0', '#a6acb2', '#888e96', '#6a7078', '#4a4f57');
  const CHROME = R('#f6f8f6', '#d0d6d8', '#9ca4aa', '#6c727a', '#464b52');
  const IRON = R('#7a7c82', '#5e6066', '#4a4b50', '#37383c', '#252528');
  const CONC = R('#a8a8a6', '#8e8e8e', '#767678', '#5e5e62', '#46464c');
  const WCONC = R('#9298a0', '#767c84', '#5e646c', '#484d55', '#33373e'); // rain-wet concrete
  const MOSS = R('#7a8a6a', '#5e6e52', '#4a5842', '#3a4636', '#2a3428');
  const TERR = R('#c6c0b4', '#aaa498', '#8c877c', '#706c64', '#55524c'); // washed-pebble terrazzo (slide bed)
  const TERRD = R('#a49e92', '#8a857a', '#706c62', '#5a5750', '#46443e');
  const TERRL = R('#e0dace', '#c8c2b6', '#aaa498', '#8c877c', '#706c64');
  const WATER = R('#8a9ab4', '#46506a', '#343c50', '#283042', '#1e2434');
  const PAINTB = R('#a2c4c4', '#78a2a6', '#5a848a', '#44666e', '#30484f'); // faded park blue-green
  const OCHRE = R('#e2c67c', '#c6a55c', '#a28446', '#7c6436', '#564428'); // faded yellow paint
  const PGREEN = R('#9cbc8c', '#7a9e6c', '#5e8054', '#486442', '#344a32'); // park-fence green
  const RUST = R('#c48252', '#9e5c36', '#7a4428', '#58311d', '#3c2215');
  const WWOOD = R('#8e7a64', '#6e5c4a', '#56483a', '#40362c', '#2c251f'); // rain-soaked grey wood
  const BARK = R('#7a726a', '#5e5852', '#48433f', '#36322f', '#262321');
  const SAND = R('#b8a27c', '#9c8866', '#7e6c52', '#635540', '#4a4032'); // wet sand
  const PAPER = R('#f4f0e6', '#e2ddd0', '#c8c2b2', '#a8a292', '#857f70');
  const CREAM = R('#f2ead2', '#dfd5b8', '#c4ba9a', '#a2987a', '#7c745c');
  const WHITE = R('#fbfaf6', '#e8e6e0', '#ceccc6', '#acaaa6', '#86858a');
  const GOLD = R('#fae49c', '#dcb464', '#b48c42', '#88662e', '#5c441e');
  const GLOW = R('#fffbea', '#ffe4a4', '#ffbe5e', '#f28e36', '#ba5c22');
  const CARD = R('#d8b484', '#c09868', '#a27c50', '#80603c', '#5c4428');
  const DWOOD = R('#7c5a40', '#604430', '#4a3426', '#36261c', '#241912');
  const WOOD = R('#c49e6c', '#a47e52', '#866240', '#684a31', '#4a3423');
  const NAVY = R('#7c90b8', '#5c7098', '#46587c', '#34425e', '#242e44');
  // basement pipe paint and the three identity colours of the valve puzzle (kept far apart in hue AND value)
  const PG = R('#a6b0a8', '#87928a', '#6a756e', '#515a55', '#3a413d'); // dull green-grey pipe paint
  const BANDS = {
    red: R('#f49482', '#dc5442', '#b8392c', '#8a2a22', '#5c1c18'),
    blue: R('#9cc0f4', '#5e8edc', '#3e6cbc', '#2c4f8c', '#1e3762'),
    grey: R('#fbfbf8', '#e2e2de', '#bdbdbb', '#949496', '#6a6a6e'),
  };
  const VOID = C('#09080d'), VOID2 = C('#141219');
  const SHADOW = C('#0a0612', 0.42), SHADOW2 = C('#0a0612', 0.24);
  const INKT = C('#26232a');

  // ---------------- 3x5 pixel font (stencils, plates) ----------------
  const F3 = {
    A: '.#.|#.#|###|#.#|#.#', B: '##.|#.#|##.|#.#|##.', C: '.##|#..|#..|#..|.##', D: '##.|#.#|#.#|#.#|##.',
    E: '###|#..|##.|#..|###', F: '###|#..|##.|#..|#..', G: '.##|#..|#.#|#.#|.##', H: '#.#|#.#|###|#.#|#.#',
    I: '###|.#.|.#.|.#.|###', K: '#.#|#.#|##.|#.#|#.#', L: '#..|#..|#..|#..|###', M: '#.#|###|###|#.#|#.#',
    N: '##.|#.#|#.#|#.#|#.#', O: '.#.|#.#|#.#|#.#|.#.', P: '##.|#.#|##.|#..|#..', R: '##.|#.#|##.|#.#|#.#',
    S: '.##|#..|.#.|..#|##.', T: '###|.#.|.#.|.#.|.#.', U: '#.#|#.#|#.#|#.#|###', W: '#.#|#.#|###|###|#.#',
    Y: '#.#|#.#|.#.|.#.|.#.', 0: '###|#.#|#.#|#.#|###', 1: '.#.|##.|.#.|.#.|###', 2: '##.|..#|.#.|#..|###',
    4: '#.#|#.#|###|..#|..#', '-': '...|...|###|...|...', ' ': '..|..|..|..|..',
  };
  const FONT = {};
  for (const k in F3) FONT[k] = F3[k].split('|');
  const textW = (s) => { let w = 0; for (const ch of String(s)) w += (FONT[ch] ? FONT[ch][0].length : 3) + 1; return Math.max(0, w - 1); };
  function text(px, s, x, y, col) {
    for (const ch of String(s)) {
      const g = FONT[ch];
      if (!g) { x += 4; continue; }
      g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') px.set(x + i, y + j, col); });
      x += g[0].length + 1;
    }
  }

  // ---------------- helpers ----------------
  function bevel(px, x, y, w, h, r) {
    px.rect(x, y, w, h, r[2]);
    px.hline(x, x + w - 1, y, r[0]);
    px.vline(x, y + 1, y + h - 1, r[1]);
    px.vline(x + w - 1, y + 1, y + h - 1, r[3]);
    px.hline(x + 1, x + w - 1, y + h - 1, r[4]);
  }
  // 3/4 box: top face (topH rows) + front face, lit from the top-left
  function box(px, x, y, w, h, topH, r) {
    px.rect(x, y, w, topH, r[1]);
    px.hline(x, x + w - 1, y, r[0]);
    px.rect(x, y + topH, w, h - topH, r[2]);
    px.hline(x, x + w - 1, y + topH, r[1]);
    px.vline(x, y + topH, y + h - 1, r[1]);
    px.vline(x + w - 1, y + topH, y + h - 1, r[3]);
    px.vline(x + w - 1, y, y + topH - 1, r[2]);
    px.hline(x + 1, x + w - 1, y + h - 1, r[4]);
  }
  // vertical cylinder (columns shaded across a ramp, lit from the left)
  function cylV(px, x, y, w, h, r) {
    for (let i = 0; i < w; i++) {
      const t = (i + 0.5) / w;
      const k = w <= 3 ? [1, 2, 3][i] : t < 0.2 ? 0 : t < 0.42 ? 1 : t < 0.68 ? 2 : t < 0.86 ? 3 : 4;
      for (let j = 0; j < h; j++) px.set(x + i, y + j, r[k]);
    }
  }
  // horizontal cylinder (rows shaded, lit from the top)
  function cylH(px, x, y, w, h, r) {
    for (let j = 0; j < h; j++) {
      const t = (j + 0.5) / h;
      const k = h === 2 ? [1, 3][j] : h === 3 ? [1, 2, 4][j] : t < 0.2 ? 0 : t < 0.45 ? 1 : t < 0.7 ? 2 : t < 0.88 ? 3 : 4;
      px.hline(x, x + w - 1, y + j, r[k]);
    }
  }
  // blotchy grime: blend existing pixels toward col where value noise is high
  function grime(px, x, y, w, h, col, amt, thr, seed, sx, sy) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const c = px.get(x + i, y + j);
        if (c >>> 24 !== 255) continue;
        const n = G.vnoise((x + i) / (sx || 3), (y + j) / (sy || 4), seed || 1);
        if (n > thr + G.bayer(x + i, y + j) * 0.12) px.set(x + i, y + j, mix(c, col, amt));
      }
  }
  // after outline: translucent colour on empty pixels inside a rect (or via a test fn)
  function shade(px, x, y, w, h, col, test) {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) {
        if (!px.in(i, j) || px.get(i, j) >>> 24) continue;
        if (test && !test(i, j)) continue;
        px.set(i, j, col);
      }
  }
  function floorShadow(px, cx, cy, rx, ry, col) {
    shade(px, Math.floor(cx - rx - 1), Math.floor(cy - ry - 1), Math.ceil(rx * 2 + 3), Math.ceil(ry * 2 + 3), col || SHADOW, (i, j) => {
      const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry;
      return dx * dx + dy * dy <= 1;
    });
  }
  // translucent glow disc on empty pixels only, strongest in the middle
  function halo(px, cx, cy, rx, ry, col, a0) {
    const rgb = G.rgba(col);
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        if (!px.in(x, y) || px.get(x, y) >>> 24) continue;
        const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry);
        if (d > 1) continue;
        const a = (1 - d) * (1 - d) * a0;
        if (a * 255 < 6) continue;
        px.set(x, y, G.pack(rgb[0], rgb[1], rgb[2], Math.round(a * 255)));
      }
  }
  // add light onto existing opaque pixels around a point
  function lightOn(px, cx, cy, rad, col, amt) {
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++)
      for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
        const c = px.get(x, y);
        if (c >>> 24 !== 255) continue;
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / rad;
        if (d >= 1) continue;
        const t = (1 - d) * amt;
        if (t > G.bayer(x, y) * 0.5) px.set(x, y, mix(c, col, Math.min(1, t)));
      }
  }
  // after outline: soft shadow cast to the lower-right of something hung on a wall
  function wallDrop(px, dx, dy, col) {
    const src = px.d.slice(), w = px.w, h = px.h;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (src[y * w + x] >>> 24 !== 255) continue;
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        if (!(src[Y * w + X] >>> 24) && !(px.d[Y * w + X] >>> 24)) px.d[Y * w + X] = col;
      }
  }
  // rain: a few lit edge pixels (open above or to the left) catch a cold glint
  function wetSheen(px, x, y, w, h, p, seed) {
    const rnd = G.rng(seed || 7), sky = C('#c4d0e0');
    const src = px.d.slice();
    const at = (i, j) => (px.in(i, j) ? src[j * px.w + i] >>> 24 : 0);
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) {
        if (at(i, j) !== 255 || (at(i, j - 1) === 255 && at(i - 1, j) === 255)) continue;
        if (rnd() < p) px.set(i, j, mix(src[j * px.w + i], sky, 0.5));
      }
  }
  // line of pixels with a colour picked per step (chains, wires)
  function dotLine(px, x0, y0, x1, y1, colAt) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) px.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), colAt(i));
  }
  // a 2px painted pipe leg: lit left column, shaded right column (far legs one step darker)
  function pole(px, x0, y0, x1, y1, r, far) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
      px.set(x, y, far ? r[3] : r[1]);
      px.set(x + 1, y, far ? r[4] : r[3]);
    }
  }
  // tapered thick line (branches)
  function taper(px, x0, y0, x1, y1, r0, r1, col) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= n; i++) { const t = i / n; px.disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r0 + (r1 - r0) * t, col); }
  }
  // shade each horizontal run of `key` pixels like a cylinder lit from the left
  function runShade(px, key, r) {
    for (let y = 0; y < px.h; y++) {
      let x = 0;
      while (x < px.w) {
        if (px.get(x, y) !== key) { x++; continue; }
        let e = x;
        while (e + 1 < px.w && px.get(e + 1, y) === key) e++;
        const n = e - x + 1;
        for (let i = x; i <= e; i++) {
          const t = (i - x) / Math.max(1, n - 1);
          px.set(i, y, n === 1 ? r[2] : n === 2 ? (i === x ? r[1] : r[3]) : t < 0.18 ? r[1] : t < 0.55 ? r[2] : t < 0.85 ? r[3] : r[4]);
        }
        x = e + 1;
      }
    }
  }
  // Height field in 3/4 view: ground point (u, v) at height h lands on screen (ox+u, oy+v-h). Columns go
  // back to front; the top pixel takes the surface shade (light from the top-left-back), the rest of the
  // column is the shade of a front-facing wall. mat(u, v, h) returns the ramp for that ground point.
  function heightField(px, ox, oy, U, V, hf, mat) {
    const L = [-0.55, -0.42, 0.72], Ln = Math.hypot(L[0], L[1], L[2]);
    const H = (u, v) => { const h = hf(u, v); return h > 0 ? h : 0; };
    for (let v = 0; v < V; v++)
      for (let u = 0; u < U; u++) {
        const h = hf(u, v);
        if (!(h > 0)) continue;
        const r = mat(u, v, h);
        if (!r) continue;
        const gx = (H(u + 1, v) - H(u - 1, v)) / 2, gy = (H(u, v + 1) - H(u, v - 1)) / 2;
        const X = ox + u, top = Math.round(oy + v - h), base = oy + v;
        const lum = (-gx * L[0] - gy * L[1] + L[2]) / (Math.hypot(gx, gy, 1) * Ln) + (G.bayer(X, top) - 0.5) * 0.1;
        px.set(X, top, r[lum > 0.9 ? 0 : lum > 0.7 ? 1 : lum > 0.47 ? 2 : lum > 0.22 ? 3 : 4]);
        for (let y = top + 1; y <= base; y++) px.set(X, y, y >= base - 1 ? r[4] : r[3]);
      }
  }
  const smooth = (a, b, x) => { const t = G.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // =====================================================================
  //  THE COURTYARD PLAYGROUND (rain, night)
  // =====================================================================

  // ---------- swing (2x2, frames 4): an A-frame with one seat swaying, the other snapped ----------
  function seat(px, x, y) { // 9x3 plank seen from the front-top, chain brackets on the top
    px.hline(x, x + 8, y, WWOOD[1]); px.set(x, y, WWOOD[0]); px.set(x + 1, y, WWOOD[0]);
    px.hline(x, x + 8, y + 1, WWOOD[2]);
    px.hline(x, x + 8, y + 2, WWOOD[3]);
    px.set(x + 1, y, STEEL[2]); px.set(x + 7, y, STEEL[2]);
    px.set(x + 4, y + 1, WWOOD[3]);
  }
  const link = (i) => (i % 2 ? STEEL[3] : STEEL[1]);
  function swing(k) {
    const px = new G.PX(36, 46), P = PAINTB;
    const s = [0, 2, 0, -2][k], lift = s ? 1 : 0; // the good seat swings side to side in the wind
    const b = [-1, 0, 1, 0][k]; // the broken plank lags behind it
    // far legs of both A-frames (darker), with their footings
    pole(px, 6, 5, 8, 26, P, true); pole(px, 28, 5, 26, 26, P, true);
    px.rect(7, 26, 4, 2, CONC[3]); px.rect(25, 26, 4, 2, CONC[3]);
    // the good seat on two chains
    const sy = 31 - lift;
    dotLine(px, 10, 7, 10 + s, sy - 1, link); dotLine(px, 16, 7, 16 + s, sy - 1, link);
    seat(px, 9 + s, sy);
    // the broken seat: one chain snapped, the plank hangs straight down from the other
    dotLine(px, 21, 7, 21 + b, 22, link);
    px.rect(20 + b, 23, 3, 9, WWOOD[2]);
    px.vline(20 + b, 23, 31, WWOOD[1]); px.vline(22 + b, 23, 31, WWOOD[3]); px.hline(20 + b, 22 + b, 31, WWOOD[4]);
    px.set(21 + b, 23, STEEL[2]); px.set(20 + b, 24, WWOOD[0]);
    dotLine(px, 27, 7, 27, 17, link); px.set(27, 18, STEEL[2]); px.set(28, 18, STEEL[3]); // the snapped end
    // near legs
    pole(px, 5, 4, 3, 43, P); pole(px, 29, 4, 31, 43, P);
    px.rect(2, 43, 4, 2, CONC[2]); px.hline(2, 5, 43, CONC[1]);
    px.rect(30, 43, 4, 2, CONC[2]); px.hline(30, 33, 43, CONC[1]);
    // top bar with bolted apex plates and the hooks
    cylH(px, 5, 3, 27, 3, P);
    px.rect(4, 2, 3, 5, P[2]); px.hline(4, 6, 2, P[0]); px.vline(6, 3, 6, P[3]); px.set(5, 4, P[4]);
    px.rect(29, 2, 3, 5, P[2]); px.hline(29, 31, 2, P[0]); px.vline(31, 3, 6, P[3]); px.set(30, 4, P[4]);
    for (const x of [10, 16, 21, 27]) px.set(x, 6, STEEL[3]);
    // chipped paint, rust bleeding down the legs
    for (const [x, y] of [[12, 4], [23, 3], [4, 20], [4, 21], [31, 30], [3, 36], [7, 15], [27, 12]]) px.set(x, y, RUST[2]);
    px.set(4, 22, RUST[3]); px.set(31, 31, RUST[3]); px.set(24, 4, RUST[3]);
    wetSheen(px, 0, 0, 36, 8, 0.35, 11);
    px.outline();
    // worn hollows under the seats hold rainwater; the seat's shadow moves with it
    floorShadow(px, 13.5, 38.5, 5.5, 1.6, C('#0a0612', 0.34));
    floorShadow(px, 21.5, 38.5, 3.5, 1.2, C('#0a0612', 0.28));
    px.set(11, 38, C('#9aa8bc', 0.55)); px.set(12, 38, C('#9aa8bc', 0.35)); px.set(15, 39, C('#9aa8bc', 0.3));
    floorShadow(px, 13.5 + s, 35.5, 4, 1, C('#0a0612', 0.22));
    for (const [x, y] of [[4, 45], [33, 45], [9, 28], [27, 28]]) floorShadow(px, x, y, 3, 0.9, SHADOW2);
    return fr(px, 18, 46);
  }
  def('swing', () => [0, 1, 2, 3].map(swing), 4);

  // ---------- slide (2x3): a concrete "mountain" with a terrazzo slide, footholds and a tunnel pipe ----------
  def('slide', () => {
    const W = 36, Hh = 60, ox = 2, oy = 12, px = new G.PX(W, Hh);
    const HP = 18; // the top platform's height
    const A = [13.5, 20.5], B = [0, 14.5]; // the slide lane runs from the platform down to the left
    const ab = [B[0] - A[0], B[1] - A[1]], abl = Math.hypot(ab[0], ab[1]);
    const lane = (u, v) => {
      const t = ((u - A[0]) * ab[0] + (v - A[1]) * ab[1]) / (abl * abl);
      const p = ((u - A[0]) * ab[1] - (v - A[1]) * ab[0]) / abl;
      if (t < -0.08 || t > 1 || Math.abs(p) > 3.6) return null;
      const tt = Math.max(0, t);
      const h = tt > 0.84 ? 1.5 : 1.5 + (HP - 1.5) * Math.pow(1 - tt / 0.84, 1.35);
      return { h: Math.abs(p) <= 2.4 ? h : h + 1.3, lip: Math.abs(p) > 2.4 };
    };
    const mound = (u, v) => {
      const d = Math.hypot((u - 17.5) / 15, (v - 24) / 21);
      if (d >= 1) return -1;
      let h = HP * Math.pow(Math.min(1, (1 - d) / 0.72), 0.75);
      // footholds up the front-right flank: flat treads, 3px risers
      if (u > 19 && v > 26 && h < HP - 0.5) h = Math.max(1, Math.floor(h / 3) * 3 + 1);
      return h;
    };
    const tube = (u, v) => (v >= 27 && v <= 45 && Math.abs(u - 11) < 6 ? 5 + Math.sqrt(36 - (u - 11) * (u - 11)) : -1);
    const hf = (u, v) => {
      if (u < 0 || v < 0 || u > 31 || v > 47) return -1;
      const l = lane(u, v);
      const m = Math.max(mound(u, v), tube(u, v));
      return l ? Math.max(l.h, m > l.h + 4 ? -1 : -1) || l.h : m;
    };
    const mat = (u, v, h) => {
      const l = lane(u, v);
      if (l) {
        if (l.lip) return CONC;
        const n = G.hash(u, v, 5);
        return n < 0.12 ? TERRD : n > 0.9 ? TERRL : TERR;
      }
      if (tube(u, v) >= mound(u, v) && tube(u, v) > 0) return CONC;
      if (h >= HP - 0.5 && G.vnoise(u / 3, v / 3, 8) > 0.6) return WATER; // rain pooling on the platform
      if (h < 5 && G.vnoise(u / 4, v / 3, 9) > 0.55) return MOSS;
      return WCONC;
    };
    heightField(px, ox, oy, 32, 48, hf, mat);
    // the tunnel mouth: the pipe's front end face, its rim and the dark inside (a dim exit far behind)
    const tx = ox + 11, ty = oy + 45 - 5;
    for (let y = ty - 7; y <= oy + 45; y++)
      for (let x = tx - 7; x <= tx + 7; x++) {
        const d = Math.hypot(x + 0.5 - (tx + 0.5), y + 0.5 - (ty + 0.5));
        if (d > 6.2) continue;
        if (d > 4.2) { const lit = -(x - tx) - (y - ty); px.set(x, y, lit > 3 ? CONC[1] : lit < -3 ? CONC[3] : CONC[2]); }
        else px.set(x, y, d > 3.3 && y < ty ? VOID2 : VOID);
      }
    px.rect(tx - 1, ty - 1, 2, 2, C('#262c3c')); px.set(tx, ty - 1, C('#363e52'));
    // pipe rail around the back and right of the platform, and the grab bar at the top of the slide
    const sp = (u, v, z) => [ox + u, Math.round(oy + v - z)];
    const RL = PAINTB;
    for (const [u, v] of [[14, 16], [19, 16], [23, 16], [23, 21], [23, 26]]) {
      const [x, y] = sp(u, v, HP);
      px.vline(x, y - 6, y - 1, RL[2]); px.set(x, y - 6, RL[1]);
    }
    { const [x0, y0] = sp(14, 16, HP + 6), [x1] = sp(23, 16, HP + 6); px.hline(x0, x1, y0, RL[1]); px.hline(x0, x1, y0 + 1, RL[3]); }
    { const [x, y0] = sp(23, 16, HP + 6), [, y1] = sp(23, 26, HP + 6); px.vline(x, y0, y1, RL[2]); px.vline(x + 1, y0 + 1, y1, RL[3]); }
    { const [x, y] = sp(13, 23, HP); px.vline(x, y - 5, y, RL[2]); px.set(x, y - 5, RL[0]); px.set(x + 1, y - 5, RL[1]); }
    { const [x, y] = sp(13, 18, HP); px.vline(x, y - 5, y, RL[3]); px.set(x, y - 5, RL[1]); }
    // rain streaks down the faces, a few cold glints on the wet edges
    grime(px, 0, 0, W, Hh, C('#2a2e36'), 0.35, 0.62, 21, 1.4, 7);
    wetSheen(px, 0, 0, W, Hh, 0.12, 13);
    px.outline();
    // a puddle at the foot of the slide, contact shadow along the front
    floorShadow(px, ox + 3, oy + 16, 3.5, 1.3, C('#1a2030', 0.55));
    px.set(ox + 2, oy + 16, C('#9aa8bc', 0.6));
    floorShadow(px, ox + 16, oy + 46.5, 15, 2, SHADOW2);
    return fr(px, ox + 16, Hh);
  });

  // ---------- sandbox (2x2, low): wet wooden frame, a toy bucket, a spade, little paw prints ----------
  def('sandbox', () => {
    const px = new G.PX(34, 36), Wd = WWOOD;
    // sand bed
    for (let y = 6; y <= 27; y++)
      for (let x = 4; x <= 29; x++) {
        const n = G.vnoise(x / 5, y / 3.5, 31), h = G.hash(x, y, 32);
        px.set(x, y, h < 0.05 ? SAND[4] : h > 0.95 ? SAND[1] : n > 0.66 ? SAND[1] : n < 0.3 ? SAND[3] : SAND[2]);
      }
    // a slumped sand mound lit from the top-left
    G.shadeDisc(px, 21, 13, 3.6, SAND[1], SAND[0], SAND[3]);
    // a rain puddle in a dip at the front left
    px.ellipse(8.5, 24.5, 4, 1.6, WATER[2]); px.hline(6, 8, 24, WATER[1]); px.set(6, 24, WATER[0]);
    // paw prints wandering to the middle (Tama was here)
    for (const [x, y] of [[11, 21], [13, 19], [14, 22], [16, 20], [17, 23], [19, 21]]) { px.set(x, y, SAND[4]); px.set(x, y - 1, SAND[1]); }
    // the frame: back beam, side beams, front beam (top faces), then the front face
    px.hline(4, 29, 6, Wd[4]); // the back beam's inner face, in shadow
    G.woodFill(px, 1, 3, 32, 3, Wd[1], Wd[2], Wd[0], 33);
    G.woodFill(px, 1, 3, 3, 28, Wd[1], Wd[2], Wd[0], 34);
    G.woodFill(px, 30, 3, 3, 28, Wd[2], Wd[3], Wd[1], 35);
    G.woodFill(px, 1, 28, 32, 3, Wd[1], Wd[2], Wd[0], 36);
    px.hline(1, 32, 3, Wd[0]);
    px.rect(1, 31, 32, 3, Wd[3]); px.hline(1, 32, 31, Wd[2]); px.hline(1, 32, 33, Wd[4]);
    for (const x of [1, 32]) px.vline(x, 31, 33, Wd[4]);
    for (const [x, y] of [[2, 4], [31, 4], [2, 29], [31, 29]]) px.set(x, y, IRON[2]); // corner nails
    // toy bucket (faded blue tin), lying where a child left it
    cylV(px, 7, 9, 5, 5, NAVY);
    px.hline(7, 11, 8, NAVY[1]); px.hline(8, 10, 9, VOID2); px.set(7, 9, NAVY[0]);
    px.set(6, 9, IRON[1]); px.set(12, 9, IRON[2]); px.hline(7, 11, 7, IRON[3]); // wire handle
    px.hline(7, 11, 14, NAVY[4]);
    // a little spade stuck in the sand
    px.vline(26, 13, 18, OCHRE[2]); px.set(26, 12, OCHRE[0]); px.rect(25, 19, 3, 2, IRON[1]); px.set(27, 20, IRON[3]);
    wetSheen(px, 0, 0, 34, 36, 0.12, 37);
    px.outline();
    floorShadow(px, 9.5, 15, 3.5, 1, SHADOW2);
    floorShadow(px, 17, 34.5, 16, 1.2, SHADOW2);
    return fr(px, 17, 36);
  });

  // ---------- jungle_gym (2x2): a small climbing dome of painted pipe, wet ----------
  def('jungle_gym', () => {
    const px = new G.PX(38, 38);
    const cx = 19, cy = 25, RX = 15, RY = 10.5, HD = 21;
    const L = [-0.55, -0.42, 0.72], Ln = Math.hypot(-0.55, -0.42, 0.72);
    const back = [];
    const put = (th, ph, r) => {
      const cp = Math.cos(ph), x = Math.round(cx + RX * cp * Math.cos(th)), y = Math.round(cy + RY * cp * Math.sin(th) - HD * Math.sin(ph));
      const depth = cp * Math.sin(th);
      if (depth < -0.02) { back.push([x, y, depth, r]); return; }
      const lum = (cp * Math.cos(th) * L[0] + depth * L[1] + Math.sin(ph) * L[2]) / Ln;
      px.set(x, y, r[lum > 0.5 ? 0 : lum > 0.2 ? 1 : lum > -0.1 ? 2 : 3]);
    };
    const MER = OCHRE, RING = PAINTB, TOP = 1.28;
    for (let i = 0; i < 8; i++) for (let ph = 0; ph <= TOP; ph += 0.004) put((i * Math.PI) / 4, ph, MER);
    for (const ph of [0, 0.5, 0.95, TOP]) for (let th = 0; th < Math.PI * 2; th += 0.004) put(th, ph, RING);
    // footings where the uprights meet the ground
    for (let i = 0; i < 8; i++) {
      const th = (i * Math.PI) / 4;
      if (Math.sin(th) < -0.02) continue;
      const x = Math.round(cx + RX * Math.cos(th)), y = Math.round(cy + RY * Math.sin(th));
      px.set(x, y + 1, CONC[2]); px.set(x + 1, y + 1, CONC[3]);
    }
    for (const [x, y] of [[19, 6], [10, 20], [27, 14], [19, 30]]) px.set(x, y, RUST[2]);
    wetSheen(px, 0, 0, 38, 38, 0.3, 41);
    px.outline();
    // the far half of the dome shows through, dim and unoutlined, behind everything
    for (const [x, y, d, r] of back) if (!(px.get(x, y) >>> 24)) px.set(x, y, d < -0.5 ? mix(r[4], C('#141219'), 0.3) : r[3]);
    floorShadow(px, cx, cy + 0.5, RX - 1, RY - 1, SHADOW2);
    return fr(px, 19, 38);
  });

  // ---------- fence_low (1x1): low green pipe fence; rails run edge to edge so segments join ----------
  def('fence_low', () => {
    const px = new G.PX(16, 16), P = PGREEN;
    for (const x of [3, 11]) {
      px.vline(x, 1, 12, P[1]); px.vline(x + 1, 1, 12, P[3]);
      px.set(x, 0, P[0]); px.set(x + 1, 0, P[2]);
      px.set(x, 12, P[3]); px.set(x + 1, 12, P[4]);
    }
    cylH(px, 0, 2, 16, 2, P); px.set(5, 2, P[0]); px.set(13, 2, P[0]);
    cylH(px, 0, 8, 16, 2, P);
    // chipped paint and rust on the rails
    for (const [x, y] of [[8, 3], [1, 9], [14, 8], [4, 6]]) px.set(x, y, RUST[2]);
    px.set(8, 4, RUST[3]);
    wetSheen(px, 0, 0, 16, 4, 0.4, 51);
    px.outline();
    shade(px, 0, 13, 16, 1, SHADOW2);
    return fr(px, 8, 16);
  });

  // ---------- tree (2x2): the old zelkova, bare and dripping; a broad vase-shaped crown of twigs ----------
  def('tree', () => {
    const W = 40, H = 60, px = new G.PX(W, H);
    const KEY = C('#ff00ff');
    const bx = 20, by = 46; // trunk base on the ground, in the middle of the footprint
    const rnd = G.rng(1958);
    const twigs = [];
    // the zelkova habit: a short trunk that forks low into many limbs climbing steeply outward
    function grow(x, y, ang, len, r, depth) {
      const x1 = x + Math.sin(ang) * len, y1 = y - Math.cos(ang) * len;
      if (r >= 0.6) taper(px, x, y, x1, y1, r, r * 0.72, KEY);
      else twigs.push([x, y, x1, y1, depth]);
      if (depth >= 5) return;
      const n = depth === 0 ? 5 : depth < 2 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        let a;
        if (depth === 0) a = [-0.78, -0.4, -0.05, 0.36, 0.74][i] + (rnd() - 0.5) * 0.12;
        else a = ang * 0.82 + (i - (n - 1) / 2) * (depth < 2 ? 0.5 : 0.62) + (rnd() - 0.5) * 0.3;
        const l = depth === 0 ? 11 + rnd() * 3 : len * (0.62 + rnd() * 0.16);
        grow(x1, y1, a, l, r * (depth === 0 ? 0.62 : 0.55), depth + 1);
      }
    }
    grow(bx, by, 0, 9, 3.2, 0);
    // root flare
    taper(px, bx - 1, by - 3, bx - 6, by + 1, 2, 0.8, KEY);
    taper(px, bx + 1, by - 3, bx + 6, by + 1, 2, 0.8, KEY);
    taper(px, bx, by - 2, bx + 2, by + 2, 2, 1, KEY);
    runShade(px, KEY, BARK);
    // zelkova bark: smooth grey with flaking patches showing a warm under-bark
    for (let y = by - 12; y <= by + 1; y++)
      for (let x = bx - 6; x <= bx + 6; x++) {
        const c = px.get(x, y);
        if (c >>> 24 !== 255) continue;
        const n = G.vnoise(x / 2, y / 3, 61);
        if (n > 0.74) px.set(x, y, mix(c, RUST[1], 0.45));
        else if (n < 0.18) px.set(x, y, mix(c, BARK[0], 0.5));
      }
    // wet: the upper-left edges of the limbs shine
    wetSheen(px, 0, 0, W, H, 0.45, 63);
    px.outline();
    // fine twigs: no outline, so the crown reads as a haze against the night
    const tw0 = C('#2c2826'), tw1 = C('#3a3532', 0.85), tw2 = C('#4a4440', 0.6);
    for (const [x0, y0, x1, y1, d] of twigs) {
      const col = d <= 3 ? tw0 : d === 4 ? tw1 : tw2;
      dotLine(px, Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), () => col);
    }
    // a few drops hanging under the lower limbs
    for (const [x, y] of [[9, 26], [31, 25], [14, 31], [27, 30]]) if (!(px.get(x, y) >>> 24)) px.set(x, y, C('#b4c4dc', 0.7));
    // the wet earth ring around the trunk, a few fallen leaves stuck in the mud
    floorShadow(px, bx, by + 1, 8.5, 2.6, C('#1a120c', 0.5));
    for (const [x, y, c] of [[13, 47, '#8a5a30'], [26, 46, '#9a6838'], [24, 48, '#6a4428'], [15, 45, '#7a5030']]) if (!(px.get(x, y) >>> 24) || (px.get(x, y) >>> 24) < 255) px.set(x, y, C(c));
    return fr(px, 20, 60);
  });

  // ---------- puddle (floor, frames 3): rain rings spreading on dark water ----------
  function puddle(k) {
    const px = new G.PX(16, 16);
    const inP = (x, y) => {
      const a = ((x + 0.5 - 7.5) / 6.6) ** 2 + ((y + 0.5 - 9.6) / 3.4) ** 2;
      const b = ((x + 0.5 - 10.2) / 4.2) ** 2 + ((y + 0.5 - 7.6) / 2.5) ** 2;
      return a <= 1 || b <= 1;
    };
    // wet, darker ground around the water
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        if (inP(x, y)) continue;
        if (inP(x - 1, y) || inP(x + 1, y) || inP(x, y - 1) || inP(x, y + 1)) px.set(x, y, C('#0a0612', 0.32));
        else if (inP(x - 2, y) || inP(x + 2, y) || inP(x, y - 2) || inP(x, y + 2)) px.set(x, y, C('#0a0612', 0.14));
      }
    // the water: dark, the night sky reflected lighter in a slanting band
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        if (!inP(x, y)) continue;
        const band = x - (y - 6) * 1.6;
        let c = WATER[3];
        if (band > 3 && band < 7) c = WATER[1];
        else if (band >= 7 && band < 9) c = WATER[2];
        if (!inP(x, y - 1)) c = WATER[2]; // the far rim reflects the edge
        px.set(x, y, c);
      }
    px.set(7, 7, WATER[0]); px.set(8, 7, WATER[1]);
    // rings: each drop is a dot, then a ring, then a faint wide ring
    const drops = [[5, 10], [11, 8], [9, 11]];
    drops.forEach(([dx, dy], i) => {
      const ph = (k + i) % 3;
      if (ph === 0) { px.set(dx, dy, C('#c4d0e4')); return; }
      const rx = ph === 1 ? 1.6 : 2.8, ry = rx * 0.6, col = ph === 1 ? C('#9aa8c0') : C('#5c6a84');
      for (let a = 0; a < Math.PI * 2; a += 0.15) {
        const x = Math.round(dx + Math.cos(a) * rx), y = Math.round(dy + Math.sin(a) * ry);
        if (inP(x, y)) px.set(x, y, col);
      }
    });
    return fr(px, 8, 16);
  }
  def('puddle', () => [0, 1, 2].map(puddle), 5);

  // ---------- drain_grate / drain_key (floor): cast-iron grate in a concrete kerb ----------
  function drain(key, glint) {
    const px = new G.PX(16, 16);
    // concrete kerb, wet
    px.rect(1, 1, 14, 14, WCONC[2]);
    px.hline(1, 14, 1, WCONC[1]); px.vline(1, 2, 14, WCONC[1]);
    px.hline(2, 14, 14, WCONC[3]); px.vline(14, 2, 13, WCONC[3]);
    px.set(1, 1, WCONC[0]); px.set(2, 1, WCONC[0]);
    // the grate: iron frame and bars, deep slots between them
    px.rect(3, 3, 10, 10, IRON[2]);
    px.hline(3, 12, 3, IRON[1]); px.vline(3, 3, 12, IRON[1]);
    px.hline(3, 12, 12, IRON[3]); px.vline(12, 3, 12, IRON[3]);
    for (const sx of [4, 7, 10]) {
      px.rect(sx, 4, 2, 8, VOID);
      px.hline(sx, sx + 1, 4, IRON[4]); // the slot wall just under the bar
    }
    for (const bx of [6, 9]) { px.vline(bx, 4, 11, IRON[1]); px.set(bx, 4, IRON[0]); }
    // water far below, catching a little light
    px.set(5, 10, C('#2a3242')); px.set(8, 9, C('#2a3242')); px.set(11, 10, C('#323c50'));
    // rust weeping out of the frame
    px.set(12, 6, RUST[3]); px.set(3, 9, RUST[3]); px.set(13, 13, RUST[3]);
    if (key) {
      // a brass key lying under the bars: the bow in the left slot, the shaft and teeth across the others
      px.set(4, 6, GOLD[1]); px.set(5, 6, GOLD[2]); px.set(4, 7, GOLD[2]); px.set(5, 7, VOID2); px.set(4, 8, GOLD[3]); px.set(5, 8, GOLD[2]);
      px.hline(7, 8, 7, GOLD[2]); px.set(7, 7, GOLD[1]);
      px.hline(10, 11, 7, GOLD[2]); px.set(10, 8, GOLD[3]); px.set(11, 8, GOLD[3]);
      // its paper tag on a string, soaked
      px.set(4, 9, C('#c8a878')); px.set(5, 9, C('#d8bc8c')); px.set(4, 10, C('#b49468')); px.set(5, 10, C('#c8a878'));
    }
    px.outline();
    if (key && glint) {
      const gx = 5, gy = 6, hot = C('#fffbe8'), mid = C('#ffe9a8', 0.75), dim = C('#ffe9a8', 0.4);
      px.set(gx, gy, hot);
      const arm = glint === 2 ? 2 : 1;
      for (let i = 1; i <= arm; i++) {
        const c = i === 1 ? mid : dim;
        px.set(gx - i, gy, c); px.set(gx + i, gy, c); px.set(gx, gy - i, c); px.set(gx, gy + i, c);
      }
      if (glint === 2) { px.set(gx - 1, gy - 1, dim); px.set(gx + 1, gy + 1, dim); }
    }
    return fr(px, 8, 16);
  }
  def('drain_grate', () => drain(false, 0));
  def('drain_key', () => { const a = drain(true, 0), b = drain(true, 1), c = drain(true, 2); return [a, a, a, b, c, b]; }, 6);

  // =====================================================================
  //  THE BASEMENT: boiler, steam, pipes, valves
  // =====================================================================

  // ---------- boiler (3x2, frames 2): riveted drum on a brick firebox, gauges, the fire glowing ----------
  const DRUM = R('#a6b0a0', '#808c7e', '#647064', '#4c564c', '#353c36'); // dull boiler-green paint
  const BRICK = R('#a0705c', '#845646', '#6a4438', '#52342c', '#3a2420');
  const LAG = R('#ece6d6', '#d4ccb8', '#b4ac98', '#908874', '#6c6454'); // pipe lagging
  function gauge(px, cx, cy, r, ang, danger) {
    px.disc(cx, cy, r + 1, CHROME[3]);
    px.disc(cx, cy, r + 0.4, CHROME[1]);
    px.disc(cx - 0.3, cy - 0.3, r - 0.5, C('#ece8dc'));
    // ticks round the dial, a red danger arc at the top-right
    for (let a = -2.3; a <= 2.31; a += 0.766) px.set(Math.round(cx + Math.sin(a) * (r - 1)), Math.round(cy - Math.cos(a) * (r - 1)), C('#6a665e'));
    if (danger) for (let a = 0.9; a <= 2.3; a += 0.2) px.set(Math.round(cx + Math.sin(a) * (r - 1)), Math.round(cy - Math.cos(a) * (r - 1)), C('#c42a20'));
    dotLine(px, cx, cy, Math.round(cx + Math.sin(ang) * (r - 1.2)), Math.round(cy - Math.cos(ang) * (r - 1.2)), () => C('#1a1418'));
    px.set(cx, cy, C('#3a3438'));
  }
  function boiler(k) {
    const px = new G.PX(52, 56);
    // pipes up into the ceiling: the flue at the back right, a lagged steam main at the left
    cylV(px, 36, 0, 6, 14, IRON); cylV(px, 35, 5, 8, 2, IRON);
    cylV(px, 9, 0, 5, 13, LAG); px.hline(9, 13, 3, LAG[3]); px.hline(9, 13, 8, LAG[3]);
    cylV(px, 24, 4, 3, 8, IRON); cylV(px, 23, 3, 5, 2, IRON); px.set(28, 2, IRON[1]); px.hline(26, 30, 2, IRON[2]); // safety valve and its lever
    // the firebox: a brick plinth
    box(px, 3, 28, 46, 25, 3, BRICK);
    for (let y = 31; y <= 51; y++) {
      const row = Math.floor((y - 31) / 3), mortar = (y - 31) % 3 === 2;
      for (let x = 4; x <= 47; x++) {
        if (mortar || (x + (row % 2) * 3) % 6 === 0) px.set(x, y, C('#4a403c'));
        else if (G.hash(x >> 1, row, 71) < 0.18) px.set(x, y, BRICK[3]);
        else if (G.hash(x >> 1, row, 72) < 0.12) px.set(x, y, BRICK[1]);
      }
    }
    px.vline(3, 31, 52, BRICK[1]); px.vline(48, 31, 52, BRICK[3]); px.hline(3, 48, 52, BRICK[4]);
    // the firebox door with glowing slits, and the ash door
    bevel(px, 10, 36, 13, 12, IRON);
    const g = k ? [GLOW[1], GLOW[2]] : [GLOW[2], GLOW[3]];
    for (const y of [39, 41, 43]) { px.hline(12, 20, y, g[0]); px.set(12, y, g[1]); px.set(20, y, g[1]); }
    px.set(10, 38, IRON[4]); px.set(10, 45, IRON[4]); // hinges
    px.vline(21, 40, 42, CHROME[2]); px.set(22, 41, CHROME[3]); // latch lever
    bevel(px, 12, 48, 9, 4, IRON); px.hline(14, 18, 50, VOID);
    // brass maker's plate
    bevel(px, 32, 38, 13, 7, GOLD); text(px, 'B-1', 34, 39, C('#4a3418'));
    // the drum: a riveted horizontal cylinder resting on the firebox
    cylH(px, 6, 10, 40, 22, DRUM);
    for (const x of [5, 46]) { cylH(px, x, 9, 1, 24, DRUM.map((c) => dk(c, 0.25))); }
    for (const x of [16, 27, 38]) for (let y = 10; y <= 31; y++) {
      const c = px.get(x, y);
      px.set(x, y, dk(c, 0.3));
      if (y % 3 === 0) px.set(x + 1, y, lt(c, 0.3));
    }
    grime(px, 6, 22, 40, 10, RUST[3], 0.4, 0.6, 73, 3, 2);
    // gauges: pressure (its needle twitches near the red) and temperature
    gauge(px, 21, 18, 4, k ? 0.62 : 0.32, true);
    gauge(px, 32, 19, 3, -0.6, false);
    px.vline(21, 23, 24, CHROME[3]); px.vline(32, 23, 24, CHROME[3]);
    // water-level sight glass
    px.rect(41, 13, 2, 12, C('#7a9aa8')); px.rect(41, 19, 2, 6, C('#3e5a6a')); px.set(41, 14, C('#d8eef4'));
    px.hline(40, 43, 12, CHROME[1]); px.hline(40, 43, 25, CHROME[3]);
    // the fire's light on the bricks round the door
    lightOn(px, 16, 44, 11, GLOW[3], k ? 0.45 : 0.32);
    px.outline();
    halo(px, 16, 54, 13, 3.5, GLOW[3], k ? 0.42 : 0.3);
    floorShadow(px, 26, 53.5, 24, 1.6, SHADOW2);
    return fr(px, 26, 56);
  }
  def('boiler', () => { const a = boiler(0), b = boiler(1); return [a, a, b, a, a, a, b, b]; }, 6);

  // ---------- steam (1x1, frames 4): a rolling cloud with puffs rising off it; blocks the way ----------
  function steam(k) {
    const W = 22, H = 34, px = new G.PX(W, H);
    const dens = new Float32Array(W * H);
    const add = (cx, cy, r, a) => {
      for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(H - 1, Math.ceil(cy + r)); y++)
        for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(W - 1, Math.ceil(cx + r)); x++) {
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
          if (d < 1) dens[y * W + x] += a * (1 - d * d);
        }
    };
    // the base cloud rolls round (period: 4 frames)
    for (let i = 0; i < 3; i++) {
      const a = (k * Math.PI) / 2 + (i * Math.PI * 2) / 3;
      add(11 + Math.cos(a) * 4, 26 + Math.sin(a) * 1.6, 5.2, 1.0);
    }
    add(11, 27, 6.5, 0.6);
    // puffs climb a fixed swaying path; each frame every puff moves one slot up, so the loop is seamless
    for (let p = 0; p < 4; p++) {
      const slot = (p * 4 + k) % 16, rise = slot * 1.3;
      const r = 3 + rise * 0.17, a = rise < 9 ? 0.95 : Math.max(0, 0.95 - (rise - 9) * 0.085);
      add(11 + Math.sin(rise * 0.33) * 2.6, 22 - rise, r, a);
    }
    const lit = C('#f2f4f8', 0.88), mid = C('#d2d8e2', 0.72), low = C('#a8b0bc', 0.55), thin = C('#c8ced8', 0.32);
    const D = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? dens[y * W + x] : 0);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const d = D(x, y);
        if (d < 0.14 + G.bayer(x, y) * 0.14) continue;
        const l = D(x - 1, y - 1) - D(x + 1, y + 1);
        px.set(x, y, d < 0.35 ? thin : l > 0.12 ? lit : l < -0.12 ? low : mid);
      }
    return fr(px, 11, H);
  }
  def('steam', () => [0, 1, 2, 3].map(steam), 8);

  // ---------- pipes along the basement wall ----------
  // Three parallel pipes (wall-local y 2, 7, 12; 4px thick) run the length of the B1 hall: the top one
  // carries HOT WATER (red band), the middle HEATING (blue), the bottom LAUNDRY (grey). Every pipe
  // sprite draws all three so neighbours join; flanged joints at both ends.
  const PIPE_Y = { red: 2, blue: 7, grey: 12 };
  function pipeTrio(px) {
    for (const c of ['red', 'blue', 'grey']) {
      const y = PIPE_Y[c];
      cylH(px, 0, y, 32, 4, PG);
      for (const x of [0, 30]) { px.rect(x, y - 1, 2, 6, PG[3]); px.vline(x, y - 1, y + 4, PG[1]); px.set(x + 1, y - 1, PG[2]); px.set(x, y + 4, PG[4]); px.set(x + 1, y + 4, PG[4]); }
    }
    // wall brackets: a steel strap over all three, bolted top and bottom
    for (const x of [7, 24]) {
      px.vline(x, 1, 16, IRON[1]); px.vline(x + 1, 1, 16, IRON[3]);
      px.set(x, 0, IRON[2]); px.set(x + 1, 0, IRON[2]); px.set(x, 17, IRON[3]); px.set(x + 1, 17, IRON[4]);
    }
    // rust at the joints, grime underneath
    for (const [x, y] of [[3, 5], [28, 10], [14, 15], [19, 5]]) px.set(x, y, RUST[2]);
    grime(px, 0, 2, 32, 14, RUST[3], 0.35, 0.68, 81, 4, 2);
  }
  // a painted identity band round one pipe, with a flow arrow pointing to the boiler room (left)
  function band(px, c, x, w) {
    const y = PIPE_Y[c], B = BANDS[c];
    cylH(px, x, y, w, 4, B);
    px.vline(x - 1, y, y + 3, B[4]);
    const ax = x + w + 2, ar = c === 'grey' ? B[1] : lt(B[1], 0.2);
    px.set(ax, y + 1, ar); px.set(ax, y + 2, ar); px.set(ax + 1, y, ar); px.set(ax + 1, y + 3, ar);
    px.hline(ax + 1, ax + 3, y + 1, ar); px.hline(ax + 1, ax + 3, y + 2, ar);
  }
  // a painted metal label plate with stencilled letters
  function plate(px, cx, bottom, lines, c) {
    const B = BANDS[c], ink = c === 'grey' ? INKT : C('#fbf3de');
    const tw = Math.max.apply(null, lines.map(textW)), w = tw + 6, h = lines.length * 6 + 3;
    const x = Math.round(cx - w / 2), y = bottom - h;
    bevel(px, x, y, w, h, B);
    lines.forEach((s, i) => text(px, s, Math.round(cx - textW(s) / 2), y + 2 + i * 6, ink));
    px.set(x + 1, y + 1, B[4]); px.set(x + w - 2, y + 1, B[4]);
  }
  function pipeSprite(c, label) {
    const px = new G.PX(32, 32);
    pipeTrio(px);
    if (c) {
      band(px, c, 12, 7);
      plate(px, 16, 31, label, c);
      // a stencilled pointer from the plate up to its pipe
      const B = BANDS[c];
      for (let y = PIPE_Y[c] + 5; y < 31 - (label.length * 6 + 3); y += 2) px.set(15, y, c === 'grey' ? B[2] : B[1]);
    } else {
      band(px, 'red', 3, 5); band(px, 'blue', 11, 5); band(px, 'grey', 19, 5);
    }
    px.outline();
    wallDrop(px, 1, 1, C('#0a0612', 0.3));
    return wallF(px, 32);
  }
  def('pipes', () => pipeSprite(null));
  def('pipe_hot', () => pipeSprite('red', ['HOT', 'WATER']));
  def('pipe_heat', () => pipeSprite('blue', ['HEATING']));
  def('pipe_laundry', () => pipeSprite('grey', ['LAUNDRY']));

  // ---------- valve_red / valve_blue / valve_grey (1x1 wall): a big coloured handwheel on its riser ----------
  function valve(c) {
    const px = new G.PX(16, 32), B = BANDS[c];
    // the riser pipe from the ceiling down into the floor, banded in its colour above the valve
    cylV(px, 6, 0, 4, 32, PG);
    cylV(px, 6, 3, 4, 5, B); px.hline(6, 9, 2, PG[4]); px.hline(6, 9, 8, B[4]);
    // valve body (bonnet) with flanges
    cylV(px, 5, 12, 6, 12, IRON); cylV(px, 4, 11, 8, 2, IRON); cylV(px, 4, 23, 8, 2, IRON);
    px.set(4, 11, IRON[0]); px.set(4, 23, IRON[0]);
    // the handwheel: thick rim, four spokes, hub
    const cx = 8, cy = 17;
    for (let y = cy - 7; y <= cy + 7; y++)
      for (let x = cx - 7; x <= cx + 7; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy);
        if (d > 6.6 || d < 4.5) continue;
        const l = -(dx + dy) / d; // +1 at the top-left
        const outer = d > 5.6;
        let i = l > 0.55 ? 0 : l > 0.15 ? 1 : l > -0.35 ? 2 : l > -0.75 ? 3 : 4;
        if (!outer) i = Math.min(4, i + 1);
        px.set(x, y, B[i]);
      }
    for (const [ex, ey] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      for (let t = 1.2; t <= 4.6; t += 0.5) px.set(Math.floor(cx + ex * t * 0.71), Math.floor(cy + ey * t * 0.71), ex + ey < 0 ? B[1] : ex + ey > 0 ? B[3] : B[2]);
    }
    px.disc(cx - 0.5, cy - 0.5, 1.6, B[2]); px.set(cx - 1, cy - 1, B[0]); px.set(cx, cy, B[4]);
    px.outline();
    wallDrop(px, 1, 1, C('#0a0612', 0.35));
    return wallF(px, 32);
  }
  def('valve_red', () => valve('red'));
  def('valve_blue', () => valve('blue'));
  def('valve_grey', () => valve('grey'));

  // =====================================================================
  //  STORAGE CAGES
  // =====================================================================
  // 2x2 chain-link cage. The far side, the boxes inside and the frame are solid and outlined; the
  // chain-link itself goes on afterwards as see-through 1px wire, so the room shows through the gaps.
  function mesh(px, x0, y0, x1, y1, a, b, skip) {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        if (skip && skip(x, y)) continue;
        const p = (x + y) % 4 === 0, q = (((x - y) % 4) + 4) % 4 === 0;
        if (p && q) px.set(x, y, lt(a, 0.2));
        else if (p) px.set(x, y, a);
        else if (q) px.set(x, y, b);
      }
  }
  function cardBox(px, x, y, w, h, topH) {
    box(px, x, y, w, h, topH, CARD);
    px.vline(x + (w >> 1), y, y + topH, C('#d8c8a0')); // packing tape over the lid seam
    px.hline(x + 2, x + 4, y + topH + 3, CARD[3]);   // a scrawled label
  }
  function cage(open) {
    const px = new G.PX(34, 58), S = STEEL;
    const x0 = 1, x1 = 32, ft = 27, fb = 56, bt = 12, bx0 = 3, bx1 = 30;
    // far frame: back posts, back top rail, the side top rails leading forward
    px.vline(bx0, bt, 41, S[3]); px.vline(bx1, bt, 41, S[4]);
    px.hline(bx0, bx1, bt, S[2]); px.hline(bx0, bx1, bt + 1, S[4]);
    dotLine(px, bx0, bt, x0, ft, () => S[2]); dotLine(px, bx1, bt, x1, ft, () => S[3]);
    // what is stored inside: boxes, a rolled futon tied with string, an old suitcase
    cardBox(px, 5, 32, 11, 15, 4);
    cardBox(px, 6, 23, 8, 9, 3);
    box(px, 18, 37, 12, 13, 3, R('#8a6a54', '#6e5240', '#5a4232', '#463226', '#30221a')); // suitcase
    px.hline(22, 25, 36, C('#30221a')); px.set(21, 36, C('#30221a')); px.set(26, 36, C('#30221a'));
    px.set(19, 43, GOLD[2]); px.set(28, 43, GOLD[2]);
    cylH(px, 18, 29, 12, 8, R('#c8c4d4', '#aaa6b8', '#8a869c', '#6c6880', '#4e4a60')); // futon roll
    px.vline(21, 29, 36, C('#5a4a3a')); px.vline(27, 29, 36, C('#5a4a3a'));
    for (let y = 30; y <= 35; y++) { px.set(18, y, C('#6c6880')); }
    // near frame: corner posts, top and bottom rails, the door's frame on the right half
    for (const x of [x0, x1]) { px.vline(x, ft, fb, x === x0 ? S[1] : S[3]); px.vline(x + (x === x0 ? 1 : -1), ft, fb, S[2]); }
    px.hline(x0, x1, ft, S[0]); px.hline(x0, x1, ft + 1, S[2]);
    px.hline(x0, x1, fb - 1, S[2]); px.hline(x0, x1, fb, S[4]);
    const dx0 = open ? 3 : 17; // the door slides away behind the left half when it is open
    px.vline(16, ft + 2, fb - 2, S[1]); px.vline(17, ft + 2, fb - 2, S[3]); // centre post
    px.vline(dx0, ft + 2, fb - 2, S[1]); px.vline(dx0 + 13, ft + 2, fb - 2, S[3]);
    px.hline(dx0, dx0 + 13, ft + 3, S[2]); px.hline(dx0, dx0 + 13, fb - 3, S[3]);
    // blank number plate on the top rail
    bevel(px, 12, ft - 1, 8, 4, WHITE); px.hline(14, 17, ft + 1, WHITE[3]);
    px.outline();
    // the shadowed inside of the cage
    shade(px, bx0 + 1, bt + 2, bx1 - bx0 - 1, fb - bt - 3, C('#0a0612', 0.32));
    // chain-link: far side dim, near side bright; nothing in the open doorway
    const fx0 = x0 + 2, fx1 = x1 - 2;
    mesh(px, bx0 + 1, bt + 2, bx1 - 1, ft - 1, S[3], S[4], (x, y) => px.get(x, y) >>> 24 === 255);
    const gap = (x, y) => (open && x >= 18 && x <= 30) || x === 16 || x === 17 || (y === ft + 3 || y === fb - 3) && x >= dx0 && x <= dx0 + 13;
    mesh(px, fx0, ft + 2, fx1, fb - 2, S[1], S[2], gap);
    if (open) mesh(px, 4, ft + 4, 15, fb - 4, S[2], S[3], (x, y) => (x + y) % 4 !== 2 && (((x - y) % 4) + 4) % 4 !== 2); // the slid-back door doubles the wire
    // hasp and padlock on the centre post (hanging open from the hasp when the door is open)
    const ly = ft + 13;
    px.rect(15, ly, 4, 2, S[3]); px.set(15, ly, S[1]);
    if (open) {
      px.set(15, ly + 2, GOLD[2]); px.set(15, ly + 3, GOLD[2]); px.set(16, ly + 4, GOLD[2]); // the shackle swung open
      px.rect(15, ly + 5, 4, 3, GOLD[2]); px.hline(15, 18, ly + 5, GOLD[1]); px.hline(15, 18, ly + 7, GOLD[3]);
      px.hline(14, 19, ly + 8, C('#2a1e10')); px.vline(14, ly + 5, ly + 7, C('#2a1e10')); px.vline(19, ly + 5, ly + 7, C('#2a1e10'));
    } else {
      px.set(16, ly + 2, CHROME[2]); px.set(17, ly + 2, CHROME[2]); px.set(15, ly + 3, CHROME[2]); px.set(18, ly + 3, CHROME[3]);
      px.rect(15, ly + 4, 4, 3, GOLD[2]); px.hline(15, 18, ly + 4, GOLD[1]); px.hline(15, 18, ly + 6, GOLD[3]); px.set(17, ly + 5, GOLD[4]);
      px.hline(14, 19, ly + 7, C('#2a1e10')); px.vline(14, ly + 4, ly + 6, C('#2a1e10')); px.vline(19, ly + 4, ly + 6, C('#2a1e10'));
    }
    floorShadow(px, 17, 57, 16, 1.2, SHADOW2);
    return fr(px, 17, 58);
  }
  def('storage_cage', () => cage(false));
  def('storage_cage_open', () => cage(true));

  // =====================================================================
  //  THE STAFF ROOM (the Caretaker's room)
  // =====================================================================

  // ---------- key_board / key_board_open (2x1 wall): hooks of numbered keys and a 3-dial lock box ----------
  const BOARD = R('#c8d6c0', '#aec0a6', '#92a88a', '#748c6e', '#566e52'); // institutional pale green
  function keyBoard(open) {
    const px = new G.PX(32, 25);
    bevel(px, 1, 1, 30, 22, R('#8a6a4a', '#6e523a', '#5a422e', '#463224', '#30221a')); // wooden frame
    bevel(px, 2, 2, 28, 20, BOARD);
    // header strip
    px.rect(3, 3, 17, 7, C('#f0ead8')); px.hline(3, 19, 9, C('#c8c0aa'));
    text(px, 'KEYS', 4, 4, INKT);
    // two rows of hooks with keys and tags (one hook on the bottom row is empty)
    const tags = [C('#f0ead8'), C('#e8d070'), C('#e8a0a0'), C('#a0c0e8'), C('#f0ead8'), C('#c0e0a0')];
    let n = 0;
    for (const [y, xs] of [[11, [4, 8, 12, 16]], [16, [4, 8, 12, 16]]]) for (const x of xs) {
      px.set(x, y, GOLD[1]); px.set(x, y + 1, GOLD[3]);
      if (y === 16 && x === 12) { n++; continue; }
      const kc = n % 3 === 1 ? GOLD : STEEL;
      px.set(x, y + 2, kc[1]); px.set(x - 1, y + 2, kc[2]); px.set(x - 1, y + 3, kc[3]); px.set(x, y + 3, kc[2]); // bow
      px.set(x - 1, y + 4, kc[2]); // shaft
      px.set(x + 1, y + 2, tags[n % 6]); px.set(x + 2, y + 2, tags[n % 6]); px.set(x + 1, y + 3, dk(tags[n % 6], 0.2)); px.set(x + 2, y + 3, dk(tags[n % 6], 0.2));
      n++;
    }
    // the lock box: grey steel, three digit dials, a single hook inside
    if (!open) {
      bevel(px, 21, 4, 8, 16, R('#c4c6ca', '#a6a8ae', '#8a8c92', '#6c6e74', '#4e5056'));
      px.rect(22, 9, 6, 4, C('#2a2a2e'));
      for (const x of [22, 24, 26]) { px.rect(x, 10, 2, 2, C('#e8e6de')); px.set(x + 1, 11, C('#a8a69e')); }
      px.set(25, 15, C('#2a2a2e')); px.set(25, 16, C('#4a4a4e')); // keyhole
      px.hline(22, 27, 5, C('#dadcde'));
    } else {
      px.rect(21, 4, 8, 16, C('#2a2a2e')); px.hline(21, 28, 4, C('#5a5c62')); px.vline(21, 4, 19, C('#4a4c52'));
      px.set(25, 8, GOLD[1]); px.set(25, 9, GOLD[3]); // the empty hook
      bevel(px, 29, 3, 2, 18, R('#c4c6ca', '#a6a8ae', '#8a8c92', '#6c6e74', '#4e5056')); // the door swung open, edge-on
    }
    px.outline();
    wallDrop(px, 1, 1, C('#0a0612', 0.35));
    return wallF(px, 25);
  }
  def('key_board', () => keyBoard(false));
  def('key_board_open', () => keyBoard(true));

  // ---------- staff_cot (1x2): narrow folding cot, grey army blanket, a paperback face-down on the pillow ----------
  def('staff_cot', () => {
    const px = new G.PX(18, 38);
    const AL = R('#d8dcde', '#b4babe', '#8e959a', '#6c7378', '#4c5256'); // aluminium tube
    const CAN = R('#7a8466', '#626c50', '#4e5840', '#3c4432', '#2a3024'); // olive canvas
    const BL = R('#a2a4a8', '#888a90', '#707278', '#5a5c62', '#44464c'); // grey wool blanket
    // legs and X braces at the foot end
    px.vline(2, 32, 36, AL[3]); px.vline(15, 32, 36, AL[3]);
    dotLine(px, 3, 32, 7, 36, () => AL[2]); dotLine(px, 14, 32, 10, 36, () => AL[3]);
    px.vline(2, 4, 8, AL[3]); px.vline(15, 4, 8, AL[4]);
    // canvas bed and side rails
    px.rect(3, 3, 12, 29, CAN[2]); px.hline(3, 14, 3, CAN[1]);
    px.vline(2, 3, 31, AL[1]); px.vline(15, 3, 31, AL[3]); px.hline(2, 15, 2, AL[0]); px.hline(2, 15, 32, AL[3]);
    // pillow
    px.rect(3, 4, 12, 6, WHITE[1]); px.hline(4, 13, 4, WHITE[0]); px.hline(3, 14, 9, WHITE[3]); px.set(3, 4, WHITE[2]); px.set(14, 4, WHITE[2]);
    px.hline(6, 11, 7, WHITE[2]); // the dent
    // the paperback, face down, splayed open
    px.hline(7, 11, 5, C('#c07848')); px.hline(6, 12, 6, C('#a05e38')); px.set(9, 5, C('#5a3420')); px.set(9, 6, C('#7a4428'));
    px.set(6, 7, PAPER[1]); px.set(12, 7, PAPER[2]);
    // blanket folded down over a white sheet
    px.hline(3, 14, 11, WHITE[1]); px.set(3, 11, WHITE[2]);
    px.rect(2, 12, 14, 21, BL[2]);
    px.hline(2, 15, 12, BL[0]); px.hline(2, 15, 13, BL[1]); px.hline(2, 15, 14, BL[3]); // the turn-down
    px.vline(2, 15, 32, BL[1]); px.vline(15, 15, 32, BL[4]);
    for (const y of [27, 29]) px.hline(3, 14, y, BL[3]); // the stripes of an army blanket
    dotLine(px, 5, 17, 9, 24, () => BL[3]); dotLine(px, 11, 16, 13, 22, () => BL[1]); // folds
    px.rect(2, 33, 14, 1, BL[3]); px.hline(2, 15, 34, BL[4]); // hanging over the foot end
    px.outline();
    floorShadow(px, 9, 36.5, 8, 1.3, SHADOW);
    return fr(px, 9, 38);
  });

  // ---------- thermos_bento (1x1): a flask and a cloth-wrapped lunch box on a small table, a folded note ----------
  def('thermos_bento', () => {
    const px = new G.PX(18, 28);
    // the table
    box(px, 1, 13, 16, 6, 4, WOOD);
    px.rect(2, 19, 2, 8, DWOOD[2]); px.vline(2, 19, 26, DWOOD[1]);
    px.rect(14, 19, 2, 8, DWOOD[3]); px.vline(15, 19, 26, DWOOD[4]);
    px.hline(4, 13, 19, DWOOD[4]);
    // thermos: cream with a little flower print, a steel cup for a lid
    cylV(px, 3, 4, 5, 11, CREAM);
    cylV(px, 3, 1, 5, 4, STEEL); px.hline(3, 7, 1, STEEL[0]); px.hline(3, 7, 4, STEEL[4]);
    px.set(4, 8, C('#d88a9a')); px.set(5, 9, C('#d88a9a')); px.set(4, 10, C('#7aa070')); px.set(6, 11, C('#d88a9a'));
    px.hline(3, 7, 14, CREAM[4]);
    // bento wrapped in an indigo furoshiki, the knot's ears sticking up
    const IND = R('#6a7aa8', '#4e5e8c', '#3c4a72', '#2e3858', '#20283e');
    box(px, 8, 9, 9, 7, 3, IND);
    for (const [x, y] of [[9, 12], [12, 13], [15, 12], [10, 14], [14, 14], [11, 10], [14, 10]]) px.set(x, y, C('#c8d0e4'));
    px.set(11, 7, IND[1]); px.set(10, 6, IND[0]); px.set(11, 8, IND[2]);
    px.set(14, 7, IND[2]); px.set(15, 6, IND[1]); px.set(14, 8, IND[3]);
    px.rect(12, 8, 2, 2, IND[1]); px.set(12, 8, IND[0]);
    // the folded note tucked under it
    px.hline(12, 16, 16, PAPER[0]); px.hline(13, 16, 17, PAPER[2]); px.set(16, 16, PAPER[1]);
    px.outline();
    floorShadow(px, 9, 27, 8, 1.2, SHADOW2);
    return fr(px, 9, 28);
  });

  // ---------- rounds_sheet (1x1 wall): a water-stained clipboard of night rounds on a nail ----------
  def('rounds_sheet', () => {
    const px = new G.PX(15, 22);
    px.set(6, 0, IRON[1]); px.set(7, 0, IRON[3]); // the nail
    dotLine(px, 6, 1, 4, 3, () => C('#5a4a3a')); dotLine(px, 7, 1, 9, 3, () => C('#5a4a3a'));
    bevel(px, 1, 3, 12, 18, R('#b08a5e', '#94724a', '#7a5c3a', '#5e462c', '#44321f')); // masonite board
    px.rect(2, 5, 10, 15, PAPER[0]); px.vline(11, 5, 19, PAPER[2]); px.hline(2, 11, 19, PAPER[2]);
    // the ruled table: a header, a column of room numbers, rows of ticks
    px.hline(3, 10, 6, C('#5a5660'));
    for (let y = 8; y <= 18; y += 2) px.hline(3, 10, y, PAPER[2]);
    px.vline(5, 7, 18, PAPER[3]);
    for (const [y, c] of [[9, '#4a5aa0'], [11, '#4a5aa0'], [13, '#4a5aa0'], [15, '#a84438'], [17, '#4a5aa0']]) { px.set(7, y, C(c)); px.set(8, y - 1, C(c)); px.set(9, y, C(c)); }
    px.set(3, 9, C('#6a6670')); px.set(3, 11, C('#6a6670')); px.set(3, 13, C('#6a6670')); px.set(3, 15, C('#a84438')); px.set(3, 17, C('#6a6670'));
    // a brown water stain bleeding up from the bottom corner
    for (let y = 12; y <= 19; y++)
      for (let x = 6; x <= 11; x++) {
        const d = Math.hypot(x - 10, (y - 18) * 1.2);
        const c = px.get(x, y);
        if (d < 4.6 && d > 3.6) px.set(x, y, mix(c, C('#9a7a48'), 0.5));
        else if (d <= 3.6) px.set(x, y, mix(c, C('#c8b080'), 0.35));
      }
    // the clip, and a pen on a string
    cylH(px, 4, 3, 6, 3, CHROME); px.set(6, 2, CHROME[2]); px.set(7, 2, CHROME[3]);
    dotLine(px, 10, 5, 13, 11, () => C('#6a6a6a'));
    px.vline(13, 12, 17, C('#3a5aa8')); px.set(13, 12, C('#e8e8f0')); px.set(13, 18, C('#c8c8c8'));
    px.outline();
    wallDrop(px, 1, 1, C('#0a0612', 0.35));
    return wallF(px, 26);
  });

  // ---------- pet_carrier / carrier_wired (1x1): plastic carrier with a wire grille door ----------
  const SHELL = R('#e2e4dc', '#c8cac0', '#a8aaa0', '#888a80', '#686a62'); // greyish cream plastic
  const TRAY = R('#9aa2ac', '#7e8692', '#646c78', '#4e5560', '#3a4048'); // blue-grey base tray
  function carrier(mode, blink) {
    const px = new G.PX(22, 20);
    // handle on top
    px.hline(8, 13, 0, IRON[1]); px.vline(7, 1, 2, IRON[2]); px.vline(14, 1, 2, IRON[3]); px.hline(8, 13, 1, IRON[3]);
    // the shell: top face with vents, then the front
    px.rect(2, 3, 18, 5, SHELL[1]); px.hline(3, 18, 2, SHELL[0]); px.hline(2, 19, 3, SHELL[0]);
    for (const x of [5, 8, 13, 16]) { px.hline(x, x + 1, 5, SHELL[3]); px.hline(x, x + 1, 6, SHELL[2]); }
    px.rect(2, 8, 18, 5, SHELL[2]); px.hline(2, 19, 8, SHELL[1]); px.vline(2, 8, 12, SHELL[1]); px.vline(19, 3, 12, SHELL[3]);
    px.rect(2, 13, 18, 5, TRAY[2]); px.hline(2, 19, 13, TRAY[0]); px.vline(19, 13, 17, TRAY[3]); px.hline(2, 19, 17, TRAY[4]);
    for (const x of [3, 18]) { px.set(x, 12, TRAY[1]); px.set(x, 13, TRAY[3]); } // clips joining shell and tray
    // the doorway and what is inside
    px.rect(6, 8, 10, 8, VOID);
    px.hline(6, 15, 8, VOID2);
    if (mode === 'wired') {
      // Tama in the dark: a hint of grey fur, and her eyes
      for (const [x, y] of [[8, 12], [9, 11], [12, 11], [13, 12], [10, 13], [11, 13], [9, 14], [12, 14]]) px.set(x, y, C('#2c2c32'));
      if (!blink) { px.set(9, 12, C('#d8e070')); px.set(12, 12, C('#d8e070')); px.set(9, 11, C('#6a7030')); px.set(12, 11, C('#6a7030')); }
      else { px.set(9, 12, C('#4a4a2a')); px.set(12, 12, C('#4a4a2a')); }
    } else {
      px.rect(7, 13, 8, 2, C('#4a6a8a')); px.hline(7, 14, 13, C('#6a8aa8')); // a folded towel
      px.set(9, 12, C('#7a7a80')); px.set(13, 12, C('#6a6a70')); // a few grey hairs
    }
    if (mode !== 'open') {
      // the grille door: a chrome frame and vertical bars over the doorway
      px.hline(5, 16, 7, CHROME[1]); px.hline(5, 16, 16, CHROME[3]); px.vline(5, 7, 16, CHROME[1]); px.vline(16, 7, 16, CHROME[3]);
      for (const x of [7, 8, 10, 11, 13, 14]) if (x !== 8 && x !== 11 && x !== 14) px.vline(x, 8, 15, CHROME[2]);
      px.vline(10, 8, 15, CHROME[2]); px.vline(13, 8, 15, CHROME[2]);
      px.hline(6, 15, 11, CHROME[3]);
    } else {
      // the door swung open to the left, seen almost edge-on
      px.vline(1, 7, 16, CHROME[1]); px.vline(2, 8, 17, CHROME[3]); px.vline(0, 9, 15, CHROME[2]);
      px.vline(6, 8, 15, SHELL[3]);
    }
    if (mode === 'wired') {
      // wire twisted tight through the grille and round the shell, ends sticking out
      dotLine(px, 15, 9, 18, 11, (i) => (i % 2 ? CHROME[3] : CHROME[0]));
      dotLine(px, 15, 13, 18, 11, (i) => (i % 2 ? CHROME[0] : CHROME[3]));
      px.set(19, 10, CHROME[1]); px.set(20, 9, CHROME[2]);
      dotLine(px, 6, 9, 3, 11, (i) => (i % 2 ? CHROME[3] : CHROME[0])); px.set(2, 11, CHROME[1]);
      px.set(11, 10, CHROME[3]); px.set(11, 9, CHROME[2]); // a bar bent where it was pulled
    }
    px.outline();
    floorShadow(px, 11, 18.5, 10, 1.4, SHADOW);
    return fr(px, 11, 20);
  }
  def('pet_carrier', () => carrier('open', false));
  def('carrier_wired', () => { const a = carrier('wired', false), b = carrier('wired', true); return [a, a, a, a, a, b]; }, 5);
})(window.G);
