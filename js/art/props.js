// Story props, puzzles, outdoors, basement, item icons and pictures for NOBODY HOME. Names and sizes: docs/ART_LIST.md (section C).
// Light from the top-left; ramps are [highlight, light, base, shade, deep]. Every sprite is outlined last
// (px.outline()), then soft translucent contact shadows may be added on empty pixels.
// Anchors: bottom-centre of the footprint. Wall props (z: 'wall') are anchored on the LOWER wall row: the
// anchor is the floor line and wall-local y 0 is the top of the 32px wall face (see wallF).
(function (G) {
  'use strict';
  const C = G.C, def = G.defSprite, mix = G.mix;
  const dk = G.darken, lt = G.lighten;
  const R = function () { return Array.prototype.map.call(arguments, (h) => C(h)); };
  const fr = G.frame;
  const frames = (n, fn) => { const a = []; for (let k = 0; k < n; k++) a.push(fn(k)); return a; };
  // wall prop frame: the bottom edge of the sprite sits at wall-local y `bottom` (32 = floor line)
  const wallF = (px, bottom, ax) => G.frame(px, ax === undefined ? px.w / 2 : ax, px.h + (32 - bottom));

  // ---------------- palettes ----------------
  const STEEL = R('#c8ccd0', '#a6acb2', '#888e96', '#6a7078', '#4a4f57');
  const CHROME = R('#f6f8f6', '#d0d6d8', '#9ca4aa', '#6c727a', '#464b52');
  const GREY = R('#b6b8bc', '#9c9ea4', '#82848c', '#666870', '#4a4c54'); // office-grey painted steel
  const CONC = R('#a8a8a6', '#8e8e8e', '#767678', '#5e5e62', '#46464c');
  const WCONC = R('#8a8e94', '#70747a', '#5a5e66', '#464a52', '#33363e'); // rain-wet concrete
  const PAPER = R('#f4f0e6', '#e2ddd0', '#c8c2b2', '#a8a292', '#857f70');
  const CREAM = R('#f2ead2', '#dfd5b8', '#c4ba9a', '#a2987a', '#7c745c');
  const WHITE = R('#fbfaf6', '#e8e6e0', '#ceccc6', '#acaaa6', '#86858a');
  const WOOD = R('#c49e6c', '#a47e52', '#866240', '#684a31', '#4a3423');
  const DWOOD = R('#7c5a40', '#604430', '#4a3426', '#36261c', '#241912');
  const RUST = R('#c48252', '#9e5c36', '#7a4428', '#58311d', '#3c2215');
  const GOLD = R('#fae49c', '#dcb464', '#b48c42', '#88662e', '#5c441e');
  const GLOW = R('#fffbea', '#ffe4a4', '#ffbe5e', '#f28e36', '#ba5c22');
  const TIN = R('#e8907a', '#c8604c', '#a4443a', '#7a302e', '#521f22'); // toy red tin
  const PGREEN = R('#9cbc8c', '#7a9e6c', '#5e8054', '#486442', '#344a32'); // park-fence green
  const NAVY = R('#7c90b8', '#5c7098', '#46587c', '#34425e', '#242e44');
  const CARD = R('#d8b484', '#c09868', '#a27c50', '#80603c', '#5c4428'); // cardboard
  const HAZY = C('#e8c040'), HAZK = C('#2a2630');
  const VOID = C('#09080d'), VOID2 = C('#141219');
  const SHADOW = C('#0a0612', 0.42), SHADOW2 = C('#0a0612', 0.22);
  const TEXT = C('#2a272e');
  // crayon colours (slightly waxy, muted)
  const CR = G.pal({
    red: '#c8483c', orange: '#e0863a', yellow: '#e6c040', green: '#5a9a4a', blue: '#4a6ab8', sky: '#7aa4d8',
    brown: '#8a5a3a', black: '#3a3240', pink: '#e07a9a', grey: '#8a8a94', purple: '#7a5aa8', navy: '#2a3a78', skin: '#f0b890',
  });

  // ---------------- 3x5 pixel font (variable width) ----------------
  const F3 = {
    A: '.#.|#.#|###|#.#|#.#', B: '##.|#.#|##.|#.#|##.', C: '.##|#..|#..|#..|.##', D: '##.|#.#|#.#|#.#|##.',
    E: '###|#..|##.|#..|###', F: '###|#..|##.|#..|#..', G: '.##|#..|#.#|#.#|.##', H: '#.#|#.#|###|#.#|#.#',
    I: '###|.#.|.#.|.#.|###', J: '..#|..#|..#|#.#|.#.', K: '#.#|#.#|##.|#.#|#.#', L: '#..|#..|#..|#..|###',
    M: '#.#|###|###|#.#|#.#', N: '##.|#.#|#.#|#.#|#.#', O: '.#.|#.#|#.#|#.#|.#.', P: '##.|#.#|##.|#..|#..',
    Q: '.#.|#.#|#.#|##.|.##', R: '##.|#.#|##.|#.#|#.#', S: '.##|#..|.#.|..#|##.', T: '###|.#.|.#.|.#.|.#.',
    U: '#.#|#.#|#.#|#.#|###', V: '#.#|#.#|#.#|.#.|.#.', W: '#.#|#.#|###|###|#.#', X: '#.#|#.#|.#.|#.#|#.#',
    Y: '#.#|#.#|.#.|.#.|.#.', Z: '###|..#|.#.|#..|###',
    0: '###|#.#|#.#|#.#|###', 1: '.#.|##.|.#.|.#.|###', 2: '##.|..#|.#.|#..|###', 3: '##.|..#|.#.|..#|##.',
    4: '#.#|#.#|###|..#|..#', 5: '###|#..|##.|..#|##.', 6: '.##|#..|###|#.#|###', 7: '###|..#|.#.|.#.|.#.',
    8: '###|#.#|###|#.#|###', 9: '###|#.#|###|..#|##.', '-': '...|...|###|...|...',
    '.': '.|.|.|.|#', '!': '#|#|#|.|#', ':': '.|#|.|#|.', ',': '.|.|.|#|#', "'": '#|#|.|.|.', '/': '..#|..#|.#.|#..|#..',
    i: '#|#|#|#|#', ' ': '..|..|..|..|..',
  };
  const FONT = {};
  for (const k in F3) FONT[k] = F3[k].split('|');
  // narrow: 'I' drawn 1px wide (to fit long banners)
  const glyph = (ch, narrow) => (narrow && ch === 'I' ? FONT.i : FONT[ch]);
  const textW = (s, narrow) => { let w = 0; for (const ch of String(s)) { const g = glyph(ch, narrow); w += (g ? g[0].length : 3) + 1; } return Math.max(0, w - 1); };
  function text(px, s, x, y, col, narrow) {
    for (const ch of String(s)) {
      const g = glyph(ch, narrow);
      if (!g) { x += 4; continue; }
      g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') px.set(x + i, y + j, typeof col === 'function' ? col(x + i, y + j) : col); });
      x += g[0].length + 1;
    }
  }

  // ---------------- helpers ----------------
  // raised panel: lit top/left edges, shaded bottom/right
  function bevel(px, x, y, w, h, r) {
    px.rect(x, y, w, h, r[2]);
    px.hline(x, x + w - 1, y, r[0]);
    px.vline(x, y + 1, y + h - 1, r[1]);
    px.vline(x + w - 1, y + 1, y + h - 1, r[3]);
    px.hline(x + 1, x + w - 1, y + h - 1, r[4]);
  }
  // recessed panel: shaded top/left, lit bottom/right
  function sunk(px, x, y, w, h, r, fill) {
    px.rect(x, y, w, h, fill === undefined ? r[3] : fill);
    px.hline(x, x + w - 1, y, r[4]);
    px.vline(x, y, y + h - 1, r[4]);
    px.hline(x + 1, x + w - 1, y + h - 1, r[1]);
    px.vline(x + w - 1, y + 1, y + h - 1, r[2]);
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
  // dithered vertical blend through a list of colours over rows y..y+h-1
  function vgrad(px, x, y, w, h, cols, mask) {
    const n = cols.length - 1;
    for (let j = 0; j < h; j++) {
      const t = h > 1 ? (j / (h - 1)) * n : 0;
      const i0 = Math.min(n, Math.floor(t)), f = t - i0;
      for (let i = 0; i < w; i++) {
        if (mask && !px.get(x + i, y + j)) continue;
        px.set(x + i, y + j, f > G.bayer(x + i, y + j) && i0 < n ? cols[i0 + 1] : cols[i0]);
      }
    }
  }
  // vertical cylinder (columns shaded across a ramp, lit from the left)
  function cylV(px, x, y, w, h, r, mask) {
    for (let i = 0; i < w; i++) {
      const t = (i + 0.5) / w;
      const k = t < 0.2 ? 0 : t < 0.42 ? 1 : t < 0.68 ? 2 : t < 0.86 ? 3 : 4;
      const kk = w <= 3 ? [1, 2, 3][i] : k;
      for (let j = 0; j < h; j++) if (!mask || px.get(x + i, y + j)) px.set(x + i, y + j, r[kk]);
    }
  }
  // horizontal cylinder (rows shaded, lit from the top)
  function cylH(px, x, y, w, h, r) {
    for (let j = 0; j < h; j++) {
      const t = (j + 0.5) / h;
      const k = h <= 3 ? [1, 2, 4][j] : t < 0.2 ? 0 : t < 0.45 ? 1 : t < 0.7 ? 2 : t < 0.88 ? 3 : 4;
      px.hline(x, x + w - 1, y + j, r[k]);
    }
  }
  // blotchy grime: blend existing pixels toward col where value noise is high
  function grime(px, x, y, w, h, col, amt, thr, seed, sx, sy) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const c = px.get(x + i, y + j);
        if (!(c >>> 24)) continue;
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
  // soft elliptical floor shadow on empty pixels
  function floorShadow(px, cx, cy, rx, ry, col) {
    shade(px, Math.floor(cx - rx - 1), Math.floor(cy - ry - 1), Math.ceil(rx * 2 + 3), Math.ceil(ry * 2 + 3), col || SHADOW, (i, j) => {
      const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry;
      return dx * dx + dy * dy <= 1;
    });
  }
  // translucent glow disc on empty pixels only (halo around a lamp), strongest in the middle
  function halo(px, cx, cy, rad, col, a0) {
    const rgb = G.rgba(col);
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++)
      for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
        if (!px.in(x, y) || px.get(x, y) >>> 24) continue;
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / rad;
        if (d > 1) continue;
        const a = (1 - d) * (1 - d) * a0;
        if (a * 255 < 6) continue;
        px.set(x, y, G.pack(rgb[0], rgb[1], rgb[2], Math.round(a * 255)));
      }
  }
  // add light onto existing pixels (additive-ish) around a point
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
  // crayon stroke pixel: waxy, a little patchy
  function cray(px, x, y, col, rnd) {
    const r = rnd ? rnd() : 0.5;
    px.set(x, y, r < 0.14 ? mix(col, C('#f4f0e6'), 0.45) : r > 0.9 ? dk(col, 0.15) : col);
  }
  function crayLine(px, x0, y0, x1, y1, col, rnd) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) cray(px, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), col, rnd);
  }
  // a piece of translucent sticky tape
  function tape(px, x, y, w, h) {
    px.rect(x, y, w, h, C('#e8dcb4', 0.86));
    px.hline(x, x + w - 1, y, C('#f8f0d4', 0.9));
  }
  // paper sheet with a lit top-left and a darker curl at the bottom-right
  function paperSheet(px, x, y, w, h, r) {
    r = r || PAPER;
    px.rect(x, y, w, h, r[0]);
    px.hline(x, x + w - 1, y + h - 1, r[2]);
    px.vline(x + w - 1, y + 1, y + h - 1, r[1]);
    px.set(x + w - 1, y + h - 1, r[3]);
    px.set(x + w - 2, y + h - 1, r[2]);
  }
  // after outline: a soft shadow cast to the lower-right of a wall-hung sheet (dx, dy offset)
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

  // =====================================================================
  //  403: THE KIDS' ROOM (toy safe, crayon drawings, picture book, toys)
  // =====================================================================
  // toy safe: a red tin box with a 4-digit roller counter and a round dial; 16x15 body
  function toySafe(open) {
    const OX = open ? 6 : 0;
    const px = new G.PX(18 + OX, 18);
    const T = TIN, x0 = OX + 1, x1 = OX + 16;
    // top face with an embossed star
    px.rect(x0, 1, 16, 3, T[1]);
    px.hline(x0 + 1, x1 - 1, 1, T[0]);
    px.vline(x1, 1, 3, T[2]);
    px.set(x0 + 7, 2, GOLD[0]); px.set(x0 + 8, 2, GOLD[1]); px.set(x0 + 6, 2, GOLD[3]); px.set(x0 + 9, 2, GOLD[3]);
    // front face
    px.rect(x0, 4, 16, 12, T[2]);
    px.vline(x0, 4, 15, T[1]);
    px.vline(x1, 4, 15, T[3]);
    px.hline(x0 + 1, x1, 15, T[4]);
    // gold lip under the lid
    px.hline(x0, x1, 4, GOLD[2]); px.set(x0, 4, GOLD[1]); px.set(x1, 4, GOLD[3]);
    // feet
    px.rect(x0 + 1, 16, 2, 1, T[4]); px.rect(x1 - 2, 16, 2, 1, T[4]);
    if (!open) {
      // door: raised panel
      bevel(px, x0 + 1, 6, 14, 9, T);
      // roller counter: four cream windows, each showing a digit
      px.rect(x0 + 2, 7, 12, 4, C('#3a1a1c'));
      for (let i = 0; i < 4; i++) {
        const wx = x0 + 3 + i * 3 - (i > 1 ? 0 : 0);
        px.set(wx, 8, CREAM[2]); px.set(wx + 1, 8, CREAM[2]);
        px.set(wx, 9, CREAM[0]); px.set(wx + 1, 9, CREAM[1]);
        px.set(wx + (i % 2), 9, TEXT);
      }
      px.hline(x0 + 2, x0 + 13, 11, T[1]);
      // dial (chrome) with a pointer, and a little gold handle
      px.disc(x0 + 5.5, 13, 1.6, CHROME[2]);
      px.set(x0 + 5, 12, CHROME[0]); px.set(x0 + 4, 13, CHROME[1]); px.set(x0 + 6, 13, CHROME[3]); px.set(x0 + 5, 14, CHROME[3]);
      px.set(x0 + 5, 13, TEXT);
      px.rect(x0 + 10, 12, 3, 2, GOLD[2]); px.set(x0 + 10, 12, GOLD[0]); px.set(x0 + 12, 13, GOLD[3]); px.set(x0 + 11, 13, GOLD[3]);
      for (const [rx, ry] of [[x0 + 1, 5], [x1 - 1, 5]]) px.set(rx, ry, GOLD[1]);
    } else {
      // the empty cavity
      px.rect(x0 + 1, 6, 14, 9, C('#1a1014'));
      px.hline(x0 + 1, x0 + 14, 6, C('#0c080a'));
      px.vline(x0 + 1, 6, 14, C('#0c080a'));
      px.rect(x0 + 2, 7, 12, 3, C('#2c181c'));
      px.hline(x0 + 2, x0 + 13, 13, C('#3a2226'));
      px.hline(x0 + 2, x0 + 13, 14, C('#4c2c2e'));
      // door swung open to the left: inside face is bare grey tin, red rim; nearer to us = lower
      const IN = R('#c4c0bc', '#a8a4a0', '#8c8884', '#6e6a68', '#524e4e');
      const hx = x0, far = OX - 4;
      for (let xx = hx; xx >= far; xx--) {
        const i = hx - xx, top = 6 + Math.round(i * 0.5), bot = 14 + Math.round(i * 0.5);
        for (let y = top; y <= bot; y++) {
          let c = IN[2];
          if (xx === hx) c = T[4];
          else if (xx === far || xx === far + 0) c = T[3];
          else if (y === top) c = T[1];
          else if (y === bot) c = T[3];
          else if (xx === hx - 1) c = IN[3];
          else if (xx === far + 1) c = IN[1];
          px.set(xx, y, c);
        }
      }
      // the lock mechanism on the inside of the door: a bolt plate
      px.rect(far + 2, 10, 3, 3, IN[4]); px.set(far + 2, 10, IN[1]); px.set(far + 3, 11, CHROME[0]);
    }
    px.outline();
    floorShadow(px, OX + 9, 17, 8.5, 1.5);
    return fr(px, OX + 9, 18);
  }
  def('toy_safe', () => toySafe(false));
  def('toy_safe_open', () => toySafe(true));

  // crayon drawings: paper 14x14 taped to the wall at a child's eye level; number in the top-right corner
  function drawingBase(seed, w, h) {
    const px = new G.PX(w + 2, h + 2);
    paperSheet(px, 1, 1, w, h);
    return px;
  }
  function drawingFinish(px, numStr, ncol) {
    // sticky tape on the two top corners
    tape(px, 0, 0, 3, 2);
    tape(px, px.w - 3, 0, 3, 2);
    if (numStr) text(px, numStr, px.w - 6, 2, ncol || CR.black);
    px.outline();
    wallDrop(px, 1, 1, C('#0a0612', 0.3));
    return wallF(px, 28);
  }
  // little sitting cat in crayon (5x6): ears, a face with two eyes, a body and a curled tail
  function crayCat(px, x, y, col, rnd, flip, eye) {
    const rows = ['#...#', '#####', '#e#e#', '#####', '.###.', '.####'];
    rows.forEach((row, j) => {
      for (let i = 0; i < 5; i++) {
        const ch = row[flip ? 4 - i : i];
        if (ch === '#') cray(px, x + i, y + j, col, rnd);
        if (ch === 'e') px.set(x + i, y + j, eye || CR.black);
      }
    });
    const tx = flip ? x - 1 : x + 5;
    cray(px, tx, y + 4, col, rnd); cray(px, tx, y + 3, col, rnd);
  }
  def('drawing1', () => { // three cats
    const px = drawingBase(1, 14, 14), r = G.rng(11);
    for (let x = 1; x < 15; x++) cray(px, x, 14, CR.green, r);
    crayCat(px, 2, 1, CR.orange, r, false);
    crayCat(px, 1, 8, CR.grey, r, false);
    crayCat(px, 9, 8, CR.black, r, true, CR.yellow);
    return drawingFinish(px, '1', CR.red);
  });
  def('drawing2', () => { // one big sun
    const px = drawingBase(2, 14, 14), r = G.rng(12);
    const cx = 6.5, cy = 8.5;
    px.disc(cx, cy, 3.4, CR.orange);
    for (let y = 5; y <= 12; y++) for (let x = 3; x <= 10; x++) if (px.get(x, y) === CR.orange) cray(px, x, y, CR.orange, r);
    px.disc(cx - 0.6, cy - 0.6, 2.2, CR.yellow);
    // a smiley face
    px.set(5, 8, CR.brown); px.set(8, 8, CR.brown); px.set(6, 10, CR.red); px.set(7, 10, CR.red);
    // rays
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + 0.2;
      const x0 = cx + Math.cos(a) * 4.6, y0 = cy + Math.sin(a) * 4.6, x1 = cx + Math.cos(a) * 6, y1 = cy + Math.sin(a) * 6;
      crayLine(px, x0, y0, x1, y1, CR.orange, r);
    }
    return drawingFinish(px, '2', CR.blue);
  });
  def('drawing3', () => { // four people holding hands
    const px = drawingBase(3, 14, 14), r = G.rng(13);
    const cols = [CR.red, CR.blue, CR.green, CR.purple];
    const xs = [2, 5, 8, 11];
    const heights = [0, 1, 2, 2]; // grown-ups taller on the left
    xs.forEach((x, i) => {
      const top = 5 + heights[i];
      // head
      px.set(x, top, CR.skin); px.set(x + 1, top, CR.skin); px.set(x, top + 1, CR.skin); px.set(x + 1, top + 1, CR.skin);
      px.set(x, top - 1, i === 1 ? CR.brown : CR.black); px.set(x + 1, top - 1, i === 1 ? CR.brown : CR.black);
      // body (dress / shirt)
      for (let y = top + 2; y <= 10; y++) { cray(px, x, y, cols[i], r); cray(px, x + 1, y, cols[i], r); }
      // legs
      cray(px, x, 11, CR.black, r); cray(px, x + 1, 12, CR.black, r); cray(px, x, 12, CR.black, r);
    });
    // joined hands: one line across at hand height
    for (let x = 1; x <= 13; x++) if (!(px.get(x, 9) === CR.red || px.get(x, 9) === CR.blue || px.get(x, 9) === CR.green || px.get(x, 9) === CR.purple)) cray(px, x, 9, CR.skin, r);
    // grass
    for (let x = 2; x < 14; x++) cray(px, x, 14, CR.green, r);
    return drawingFinish(px, '3', CR.black);
  });
  def('drawing4', () => { // seven stars on a scribbled night sky
    const px = drawingBase(4, 14, 14), r = G.rng(14);
    for (let y = 1; y <= 14; y++) for (let x = 1; x <= 14; x++) {
      if (x >= 9 && y <= 7) continue; // the number corner left white
      const n = r();
      px.set(x, y, n < 0.12 ? PAPER[1] : n < 0.6 ? CR.navy : mix(CR.navy, CR.blue, 0.5));
    }
    const stars = [[3, 3], [7, 2], [3, 8], [7, 6], [11, 10], [6, 11], [2, 13]];
    for (const [x, y] of stars) {
      px.set(x, y, CR.yellow);
      px.set(x - 1, y, CR.yellow); px.set(x + 1, y, CR.yellow); px.set(x, y - 1, CR.yellow); px.set(x, y + 1, CR.yellow);
      px.set(x, y, C('#fff4b0'));
    }
    return drawingFinish(px, '4', CR.red);
  });
  // Yui's drawing: a tall man with a camera holding a little girl's hand
  def('yui_drawing', () => {
    const px = drawingBase(5, 14, 15), r = G.rng(15);
    // sun in the corner
    px.set(13, 2, CR.orange); px.set(14, 2, CR.orange); px.set(13, 3, CR.orange); px.set(14, 3, CR.orange); px.set(12, 2, CR.yellow); px.set(13, 1, CR.yellow);
    // the tall man (grey coat, brown hair)
    const mx = 4;
    px.set(mx, 2, CR.brown); px.set(mx + 1, 2, CR.brown);
    px.set(mx, 3, CR.skin); px.set(mx + 1, 3, CR.skin); px.set(mx, 4, CR.skin); px.set(mx + 1, 4, CR.skin);
    for (let y = 5; y <= 11; y++) { cray(px, mx - (y > 6 ? 1 : 0), y, CR.grey, r); cray(px, mx, y, CR.grey, r); cray(px, mx + 1, y, CR.grey, r); cray(px, mx + 2, y, y > 6 ? CR.grey : PAPER[0], r); }
    for (let y = 12; y <= 14; y++) { cray(px, mx, y, CR.black, r); cray(px, mx + 2, y, CR.black, r); }
    // camera on a strap: black box with a lens
    crayLine(px, mx, 5, mx + 2, 8, CR.black, r);
    px.rect(mx - 1, 8, 3, 2, CR.black); px.set(mx, 8, CR.sky);
    // his hand reaches down to hers
    crayLine(px, mx + 3, 8, mx + 5, 10, CR.skin, r);
    // the girl: pigtails, red dress
    const gx = 10;
    px.set(gx - 1, 8, CR.black); px.set(gx + 2, 8, CR.black);
    px.set(gx, 7, CR.black); px.set(gx + 1, 7, CR.black);
    px.set(gx, 8, CR.skin); px.set(gx + 1, 8, CR.skin); px.set(gx, 9, CR.skin); px.set(gx + 1, 9, CR.skin);
    for (let y = 10; y <= 12; y++) for (let x = gx - (y - 10 > 0 ? 1 : 0); x <= gx + 1 + (y - 10 > 0 ? 1 : 0); x++) cray(px, x, y, CR.red, r);
    cray(px, gx - 1, 10, CR.skin, r);
    cray(px, gx, 13, CR.black, r); cray(px, gx + 1, 13, CR.black, r);
    // ground
    for (let x = 1; x <= 14; x++) cray(px, x, 15, CR.green, r);
    // a red heart between them
    px.set(7, 3, CR.pink); px.set(9, 3, CR.pink); px.hline(7, 9, 4, CR.pink); px.set(8, 5, CR.pink);
    return drawingFinish(px, null);
  });

  // a children's picture book lying open on the floor
  def('picture_book', () => {
    const px = new G.PX(16, 12);
    const cov = R('#6a8ac0', '#4a6aa0', '#36507e');
    // cover edges (wider than the pages)
    px.rect(1, 2, 14, 9, cov[1]);
    px.hline(1, 14, 10, cov[2]); px.set(1, 2, cov[0]);
    // page block thickness at the bottom
    px.hline(2, 13, 9, PAPER[2]);
    // pages: each side curls up toward the gutter
    for (let x = 2; x <= 13; x++) {
      const d = Math.abs(x - 7.5);
      const top = d < 1 ? 2 : d < 3 ? 1 : d < 5 ? 1 : 2;
      for (let y = top; y <= 8; y++) px.set(x, y, x < 8 ? PAPER[0] : PAPER[1]);
    }
    px.vline(7, 1, 8, PAPER[3]); px.vline(8, 1, 8, PAPER[2]);
    px.hline(2, 6, 8, PAPER[2]); px.hline(9, 13, 8, PAPER[3]);
    // left page: a big picture (a red house under a sun)
    px.rect(3, 5, 3, 3, CR.red); px.set(4, 4, CR.brown); px.set(3, 4, CR.brown); px.set(5, 4, CR.brown); px.set(4, 3, CR.brown);
    px.set(4, 7, CR.black);
    px.set(6, 3, CR.yellow);
    // right page: a cat picture and lines of text
    px.set(10, 3, CR.grey); px.set(12, 3, CR.grey); px.hline(10, 12, 4, CR.grey); px.hline(10, 12, 5, CR.grey);
    px.hline(9, 12, 6, PAPER[3]); px.hline(9, 11, 7, PAPER[3]);
    px.outline();
    floorShadow(px, 8, 10.5, 7.5, 1.5, SHADOW2);
    return fr(px, 8, 12);
  });

  // wooden toy box with a tin robot and a ball poking out
  def('toy_box', () => {
    const px = new G.PX(16, 20);
    const B = R('#8cb0a0', '#6c9484', '#56786a', '#425e52', '#2e443a'); // painted sea-green
    // inside (dark) then toys, then the front of the box
    px.rect(1, 9, 14, 3, C('#1a1418'));
    // robot: grey tin head with an antenna and yellow eyes
    px.rect(3, 3, 5, 6, STEEL[2]);
    px.vline(3, 3, 8, STEEL[1]); px.hline(3, 7, 3, STEEL[0]); px.vline(7, 4, 8, STEEL[3]);
    px.set(5, 2, STEEL[3]); px.set(5, 1, TIN[1]);
    px.set(4, 5, GLOW[1]); px.set(6, 5, GLOW[1]);
    px.hline(4, 6, 7, STEEL[4]); px.set(5, 7, STEEL[1]);
    px.set(2, 6, STEEL[3]); px.set(8, 6, STEEL[3]); // ear bolts
    // ball (striped, muted red and cream)
    G.shadeDisc(px, 11, 8, 2.6, TIN[1], TIN[0], TIN[3]);
    px.hline(9, 13, 8, CREAM[1]); px.set(9, 8, CREAM[2]); px.set(13, 8, CREAM[3]);
    // box: top rim and front
    px.rect(0, 10, 16, 2, B[1]);
    px.hline(0, 15, 10, B[0]);
    px.rect(0, 12, 16, 7, B[2]);
    px.vline(0, 12, 18, B[1]); px.vline(15, 11, 18, B[3]); px.hline(1, 15, 18, B[4]);
    px.hline(0, 15, 12, B[3]);
    // painted letters-ish decoration: a yellow star and a red dot
    px.set(4, 14, HAZY); px.set(3, 15, HAZY); px.set(4, 15, C('#f4dc7a')); px.set(5, 15, HAZY); px.set(4, 16, HAZY);
    px.set(10, 14, TIN[1]); px.set(11, 14, TIN[1]); px.set(10, 15, TIN[2]); px.set(11, 15, TIN[2]);
    px.set(7, 15, CREAM[1]); px.set(8, 14, CREAM[1]); px.set(13, 16, CREAM[2]);
    px.outline();
    floorShadow(px, 8, 19, 8, 1.6);
    return fr(px, 8, 20);
  });

  // a small desk with a gooseneck lamp and crayons
  def('kids_desk', () => {
    const px = new G.PX(16, 26);
    // legs
    px.rect(1, 18, 2, 7, WOOD[3]); px.vline(1, 18, 24, WOOD[2]);
    px.rect(13, 18, 2, 7, WOOD[4]);
    px.hline(3, 12, 22, WOOD[4]); // footrest bar
    // top (3/4) and apron with a drawer
    box(px, 0, 11, 16, 8, 4, WOOD);
    px.rect(4, 16, 8, 2, WOOD[3]); px.hline(4, 11, 16, WOOD[4]); px.set(7, 17, GOLD[1]); px.set(8, 17, GOLD[2]);
    // lamp: base, arm, cone shade
    const L = R('#a8c4a0', '#86a47e', '#688660', '#4c6446', '#344632');
    px.rect(1, 12, 4, 1, L[3]); px.hline(1, 4, 11, L[1]);
    px.vline(2, 4, 11, L[2]); px.set(3, 3, L[2]); px.set(4, 3, L[2]); px.set(5, 3, L[3]);
    px.rect(4, 2, 4, 3, L[2]); px.hline(4, 7, 2, L[0]); px.vline(7, 3, 4, L[3]); px.hline(5, 8, 5, L[4]);
    px.set(6, 5, GLOW[1]); px.set(7, 5, GLOW[2]);
    // paper and crayons on the top
    px.rect(6, 12, 5, 2, PAPER[0]); px.set(10, 13, PAPER[2]);
    px.set(7, 12, CR.red); px.set(8, 13, CR.blue);
    const cols = [CR.red, CR.yellow, CR.blue, CR.green];
    px.rect(11, 11, 4, 2, C('#e6c040')); px.hline(11, 14, 12, C('#c09a2a'));
    cols.forEach((c, i) => px.set(11 + i, 10, c));
    px.hline(12, 14, 14, CR.green); px.set(14, 14, dk(CR.green, 0.3));
    px.outline();
    floorShadow(px, 8, 25, 8, 1.6);
    return fr(px, 8, 26);
  });

  // a small ragged hole at the bottom of the wall (cat-sized)
  def('hole_wall', () => {
    const px = new G.PX(14, 12);
    const plaster = R('#e8e0cc', '#d0c6ae', '#aea48c', '#867e6a');
    // ragged outline of the hole, flat on the floor line (row 9)
    const rim = [[2, 9], [2, 7], [3, 5], [3, 4], [5, 3], [6, 2], [8, 2], [9, 3], [10, 3], [11, 5], [11, 6], [12, 7], [12, 9]];
    px.poly(rim.map(([x, y]) => [x - 0.5, y - 0.5]).concat([[12.5, 9.5], [1.5, 9.5]]), plaster[1]);
    px.poly([[3, 9.5], [3.5, 6], [4.5, 4.5], [6.5, 3.5], [8, 3.5], [10, 4.5], [11, 7], [11.5, 9.5]], VOID);
    // broken plaster lip: lit on the upper-left edge, shaded on the right
    for (let y = 0; y < 12; y++) for (let x = 0; x < 14; x++) {
      if (px.get(x, y) !== plaster[1]) continue;
      if (px.get(x + 1, y) === VOID || px.get(x, y + 1) === VOID) px.set(x, y, x < 7 ? plaster[0] : plaster[2]);
    }
    // lath and a stud edge visible inside, very dark
    px.hline(4, 9, 5, C('#2a1e18')); px.hline(4, 10, 7, C('#21170f'));
    px.vline(10, 5, 8, C('#2e231c'));
    // crumbs on the floor in front
    px.set(1, 10, plaster[2]); px.set(3, 10, plaster[1]); px.set(4, 11, plaster[3]); px.set(11, 10, plaster[2]); px.set(13, 10, plaster[3]); px.set(9, 11, plaster[2]);
    px.outline();
    return wallF(px, 34);
  });

  // a broken hole in a concrete floor with rebar (2x2 floor decal)
  def('hole_floor', () => {
    const px = new G.PX(32, 32);
    const r = G.rng(41);
    // hole outline (irregular)
    const pts = [];
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2;
      const rr = 1 + (r() - 0.5) * 0.28;
      pts.push([16 + Math.cos(a) * 11.5 * rr, 16 + Math.sin(a) * 8 * rr]);
    }
    // broken concrete lip around the hole
    px.poly(pts.map(([x, y]) => [16 + (x - 16) * 1.18, 16 + (y - 16) * 1.25]), CONC[1]);
    px.poly(pts, VOID);
    // the far edge shows the slab's thickness, lit from above
    for (let x = 0; x < 32; x++) {
      let top = -1;
      for (let y = 0; y < 32; y++) if (px.get(x, y) === VOID) { top = y; break; }
      if (top < 0) continue;
      px.set(x, top, CONC[2]); px.set(x, top + 1, CONC[3]); px.set(x, top + 2, CONC[4]);
      if (r() < 0.5) px.set(x, top + 3, C('#22222a'));
    }
    // lip shading: cracked chunks, lighter toward the top-left
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      if (px.get(x, y) !== CONC[1]) continue;
      const n = G.vnoise(x / 2.5, y / 2.5, 7);
      px.set(x, y, n > 0.68 ? CONC[0] : n < 0.3 ? CONC[2] : CONC[1]);
      if (px.get(x, y + 1) === VOID && x > 16) px.set(x, y, CONC[3]);
    }
    // cracks running out across the floor
    const crack = (x, y, dx, dy, n) => { for (let i = 0; i < n; i++) { px.set(Math.round(x), Math.round(y), C('#3a3a40', 0.85)); x += dx + (r() - 0.5) * 0.8; y += dy + (r() - 0.5) * 0.8; } };
    crack(4, 10, -1, -0.6, 4); crack(28, 20, 1, 0.7, 4); crack(9, 26, -0.7, 1, 5); crack(24, 6, 0.7, -1, 5);
    // rebar: two rusty rods crossing the hole, bent down where they broke
    for (let x = 6; x <= 26; x++) { const y = 13 + Math.round((x - 6) * 0.1) + (x > 20 ? Math.round((x - 20) * 0.5) : 0); px.set(x, y, RUST[1]); px.set(x, y + 1, RUST[3]); }
    for (let y = 9; y <= 22; y++) { const x = 19 - Math.round((y - 9) * 0.15) - (y > 17 ? y - 17 : 0); px.set(x, y, RUST[2]); px.set(x + 1, y, RUST[4]); }
    px.set(6, 13, RUST[0]); px.set(19, 9, RUST[0]);
    // rubble chips
    for (const [x, y] of [[3, 20], [27, 11], [8, 6], [25, 25], [14, 27]]) { px.set(x, y, CONC[1]); px.set(x + 1, y, CONC[3]); }
    px.outline();
    return fr(px, 16, 32);
  });

  // steel balcony escape hatch in the floor (2x2): grey lid, yellow-black border, keyhole
  function hatchFrame(px, x, y, w, h) {
    // hazard border, 2px wide, diagonal stripes
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const edge = i < 2 || j < 2 || i >= w - 2 || j >= h - 2;
      if (!edge) continue;
      px.set(x + i, y + j, ((i + j) >> 1) % 2 ? HAZK : HAZY);
    }
    // a thin steel rim inside the border
    px.hline(x + 2, x + w - 3, y + 2, STEEL[4]);
    px.vline(x + 2, y + 2, y + h - 3, STEEL[4]);
    px.hline(x + 2, x + w - 3, y + h - 3, STEEL[1]);
    px.vline(x + w - 3, y + 3, y + h - 3, STEEL[2]);
    // the floor-level lip of the frame (front edge)
    px.hline(x, x + w - 1, y + h, C('#5a4a20'));
  }
  def('escape_hatch', () => {
    const px = new G.PX(32, 32);
    const x = 2, y = 5, w = 28, h = 24;
    hatchFrame(px, x, y, w, h);
    // lid: checker plate
    for (let j = y + 3; j < y + h - 3; j++) for (let i = x + 3; i < x + w - 3; i++) {
      const a = (i + j * 2) % 6 === 0, b = (i * 2 + j) % 7 === 3;
      px.set(i, j, a ? STEEL[0] : b ? STEEL[3] : STEEL[2]);
    }
    // lit top-left lid edge, shaded right/bottom
    px.hline(x + 3, x + w - 4, y + 3, STEEL[0]); px.vline(x + 3, y + 3, y + h - 4, STEEL[1]);
    px.hline(x + 3, x + w - 4, y + h - 4, STEEL[3]); px.vline(x + w - 4, y + 4, y + h - 4, STEEL[3]);
    // hinges on the far edge
    for (const hx of [x + 6, x + w - 9]) { px.rect(hx, y + 2, 4, 2, STEEL[1]); px.hline(hx, hx + 3, y + 3, STEEL[3]); }
    // stencilled pictogram: a ladder going down (white) and an arrow
    const lx = x + 9;
    px.vline(lx, y + 7, y + 16, WHITE[1]); px.vline(lx + 4, y + 7, y + 16, WHITE[1]);
    for (let j = y + 8; j <= y + 16; j += 2) px.hline(lx + 1, lx + 3, j, WHITE[2]);
    const ax = x + 18;
    px.vline(ax, y + 7, y + 14, WHITE[1]); px.hline(ax - 2, ax + 2, y + 13, WHITE[1]); px.hline(ax - 1, ax + 1, y + 14, WHITE[1]); px.set(ax, y + 15, WHITE[1]);
    // recessed lift handle and keyhole near the front edge
    sunk(px, x + 9, y + 18, 10, 3, STEEL, STEEL[4]);
    px.hline(x + 10, x + 17, y + 19, C('#1a1c22'));
    px.rect(x + 21, y + 17, 3, 4, CHROME[1]); px.set(x + 22, y + 18, VOID); px.set(x + 22, y + 19, VOID); px.set(x + 21, y + 17, CHROME[0]); px.set(x + 23, y + 20, CHROME[3]);
    grime(px, x + 3, y + 3, w - 6, h - 6, C('#4a3a2a'), 0.35, 0.62, 5, 4, 3);
    px.outline();
    return fr(px, 16, 32);
  });
  def('escape_hatch_open', () => {
    const LID = 20;
    const px = new G.PX(32, 32 + LID);
    const x = 2, y = 5 + LID, w = 28, h = 24;
    // the opening: shaft wall at the far side, then darkness
    px.rect(x + 2, y + 2, w - 4, h - 4, VOID);
    vgrad(px, x + 2, y + 2, w - 4, 8, [CONC[3], CONC[4], C('#26262c'), VOID2, VOID]);
    // folding ladder hanging from the far edge, fading into the dark
    const lx0 = x + 9, lx1 = x + 18;
    for (let j = y + 1; j < y + h - 2; j++) {
      const t = (j - y) / (h - 3);
      const cA = mix(CHROME[1], VOID, Math.min(1, t * 1.15)), cB = mix(CHROME[3], VOID, Math.min(1, t * 1.15));
      px.set(lx0, j, cA); px.set(lx0 + 1, j, cB);
      px.set(lx1, j, cA); px.set(lx1 + 1, j, cB);
      if ((j - y) % 4 === 2) px.hline(lx0 + 2, lx1 - 1, j, mix(CHROME[2], VOID, Math.min(1, t * 1.15)));
    }
    // hooks over the rim
    px.rect(lx0, y, 2, 2, CHROME[0]); px.rect(lx1, y, 2, 2, CHROME[0]);
    hatchFrame(px, x, y, w, h);
    // the lid standing up on its hinges, underside facing us
    const ly = y + 2 - LID, lw = w - 6;
    bevel(px, x + 3, ly, lw, LID, STEEL);
    // underside reinforcement (an X brace) and the rubber seal
    for (let i = 0; i < lw - 4; i++) {
      const yy1 = ly + 2 + Math.round((i * (LID - 5)) / (lw - 5));
      const yy2 = ly + LID - 3 - Math.round((i * (LID - 5)) / (lw - 5));
      px.set(x + 5 + i, yy1, STEEL[3]); px.set(x + 5 + i, yy2, STEEL[3]);
    }
    px.hline(x + 4, x + w - 5, ly + 1, C('#2a2a30'));
    px.vline(x + 4, ly + 1, ly + LID - 2, C('#2a2a30'));
    // lock bolt on the lid edge
    px.rect(x + 20, ly + 1, 3, 2, CHROME[2]);
    // hinges
    for (const hx of [x + 6, x + w - 9]) { px.rect(hx, y + 1, 4, 2, STEEL[1]); px.hline(hx, hx + 3, y + 2, STEEL[3]); }
    px.outline();
    return fr(px, 16, 32 + LID);
  });

  // a folded newspaper on the floor
  def('newspaper', () => {
    const px = new G.PX(16, 11);
    const N = R('#ece6d6', '#dcd4c0', '#c4bca8', '#a29a86');
    px.poly([[1.5, 2], [14, 1], [14.5, 8.5], [2, 9.5]], N[1]);
    px.poly([[1.5, 2], [14, 1], [14.2, 4], [1.8, 5]], N[0]);
    // masthead bar and headline
    px.hline(3, 12, 2, TEXT); px.hline(3, 9, 3, C('#5a5458'));
    // columns of text and a photo
    for (const yy of [6, 7, 8]) { px.hline(3, 6, yy, N[3]); px.hline(11, 13, yy - 1, N[3]); }
    px.rect(8, 5, 2, 3, C('#5a5862'));
    px.hline(2, 14, 5, N[2]); // fold line
    px.outline();
    floorShadow(px, 8, 9.5, 7, 1.3, SHADOW2);
    return fr(px, 8, 11);
  });

  // a weekly pill organiser with coloured lids ("candy")
  def('pill_box', () => {
    const px = new G.PX(17, 9);
    const lids = R('#d87a7a', '#e0a46a', '#e0d27a', '#86c08a', '#7aaad8', '#9a8ad0', '#d08ac0');
    for (let i = 0; i < 7; i++) {
      const x = 1 + i * 2;
      const c = lids[i];
      px.set(x, 2, lt(c, 0.35)); px.set(x + 1, 2, c);
      px.set(x, 3, c); px.set(x + 1, 3, dk(c, 0.18));
      // translucent compartments below with pills inside
      px.set(x, 4, C('#d8dce0')); px.set(x + 1, 4, C('#b8bec4'));
      px.set(x, 5, C('#c0c6cc')); px.set(x + 1, 5, C('#a0a6ae'));
    }
    px.set(2, 5, C('#f4f0e8')); px.set(6, 5, C('#e8b0b8')); px.set(9, 5, C('#f4f0e8')); px.set(13, 5, C('#f0e090'));
    px.hline(1, 14, 6, C('#8a9098'));
    px.outline();
    floorShadow(px, 8, 7.5, 7.5, 1.2, SHADOW2);
    return fr(px, 8, 9);
  });

  // =====================================================================
  //  PIPES, RADIATOR, LAUNDRY ROOM
  // =====================================================================
  const PIPE = R('#dcd6c4', '#bcb6a4', '#9c9686', '#7c7668', '#5a564c'); // cream-painted iron
  // a thick radiator pipe coming up out of the floor and running up the wall
  def('pipe_floor', () => {
    const px = new G.PX(16, 34);
    cylV(px, 5, 0, 6, 31, PIPE);
    // clamp ring holding it to the wall, and a joint collar
    cylV(px, 4, 7, 8, 2, PIPE); px.hline(4, 11, 9, PIPE[4]);
    cylV(px, 4, 19, 8, 3, PIPE); px.hline(4, 11, 19, PIPE[0]); px.hline(4, 11, 22, PIPE[4]);
    px.set(6, 20, PIPE[0]);
    // chipped paint with rust showing
    for (const [x, y] of [[8, 4], [9, 13], [7, 26], [9, 27], [6, 15]]) { px.set(x, y, RUST[2]); px.set(x, y + 1, RUST[3]); }
    px.set(10, 14, RUST[3]); px.vline(9, 23, 25, RUST[3]);
    // floor escutcheon (round plate, seen in 3/4)
    px.ellipse(8, 31.5, 6, 2.2, PIPE[2]);
    px.hline(4, 11, 30, PIPE[1]); px.hline(3, 12, 31, PIPE[2]); px.hline(4, 11, 32, PIPE[3]);
    cylV(px, 5, 28, 6, 3, PIPE);
    px.outline();
    floorShadow(px, 9, 32.5, 7, 1.3);
    return fr(px, 8, 34);
  });

  // old ribbed cast-iron radiator, cream paint
  def('radiator', () => {
    const px = new G.PX(16, 21);
    const RP = R('#e6e0cc', '#c8c2ae', '#a8a290', '#868070', '#625e52');
    // back: dark gaps between the columns
    px.rect(1, 4, 14, 12, C('#3a362e'));
    // five columns, each a little rounded cylinder
    for (let i = 0; i < 5; i++) {
      const x = 1 + i * 3;
      cylV(px, x, 3, 2, 14, [RP[0], RP[1], RP[3], RP[3], RP[4]]);
      px.set(x, 2, RP[1]); px.set(x + 1, 2, RP[2]);
      px.set(x, 3, RP[0]);
    }
    // the top/bottom headers that join the columns
    cylH(px, 1, 4, 14, 2, [RP[1], RP[3]]);
    cylH(px, 1, 14, 14, 2, [RP[2], RP[4]]);
    for (let i = 0; i < 5; i++) { px.set(1 + i * 3, 4, RP[0]); }
    // feet
    px.rect(2, 17, 2, 2, RP[3]); px.rect(12, 17, 2, 2, RP[4]);
    // valve knob and inlet pipe on the left
    px.rect(0, 13, 1, 3, RP[2]); px.vline(0, 16, 19, PIPE[3]);
    px.set(0, 12, C('#5a2a26')); px.set(-0, 11, C('#7a3a32'));
    // scuffs and rust at the bottom
    grime(px, 1, 12, 14, 5, RUST[3], 0.45, 0.55, 9, 2, 2);
    px.outline();
    floorShadow(px, 8, 19.5, 8, 1.4);
    return fr(px, 8, 21);
  });

  // top-loading washing machine (cream), a 1970s twin-tub; frames: shaking while it runs
  function washer(dx, dy, run, k) {
    const px = new G.PX(18, 26);
    const W = R('#f4eedc', '#e2d9c0', '#c8bea2', '#a29880', '#7a725e');
    const LID = R('#c8dce4', '#a6c0cc', '#86a2b0', '#68828e', '#4c606a'); // pale blue plastic lids
    const x = 1 + dx, y = 1 + dy;
    // control panel at the back of the top, two dials and a lamp
    box(px, x, y, 16, 4, 2, R('#d4d0c6', '#b8b4aa', '#9c988e', '#7e7a72', '#5e5a54'));
    px.set(x + 3, y + 2, NAVY[1]); px.set(x + 4, y + 2, NAVY[3]);
    px.set(x + 12, y + 2, NAVY[1]); px.set(x + 13, y + 2, NAVY[3]);
    px.set(x + 8, y + 1, run ? C('#f06a4a') : C('#6a4a44'));
    // top face with two lids: the big wash tub and the small spinner
    px.rect(x, y + 4, 16, 6, W[0]);
    px.vline(x + 15, y + 4, y + 9, W[2]);
    const lidRattle = run && k === 1 ? -1 : 0;
    bevel(px, x + 1, y + 5 + lidRattle, 8, 4, LID);
    bevel(px, x + 10, y + 5, 5, 4, LID);
    px.hline(x + 3, x + 6, y + 7 + lidRattle, LID[3]); px.set(x + 12, y + 7, LID[3]);
    // front face
    px.rect(x, y + 10, 16, 13, W[2]);
    px.hline(x, x + 15, y + 10, W[1]);
    px.vline(x, y + 10, y + 22, W[1]);
    px.vline(x + 15, y + 10, y + 22, W[3]);
    px.hline(x + 1, x + 15, y + 22, W[4]);
    // pastel blue band, maker's badge, chrome trim
    px.rect(x + 1, y + 12, 14, 3, LID[2]); px.hline(x + 1, x + 14, y + 12, LID[1]); px.hline(x + 1, x + 14, y + 14, LID[3]);
    px.rect(x + 6, y + 13, 4, 1, CHROME[1]);
    px.vline(x + 9, y + 16, y + 20, W[3]); // the line between the two tubs
    // kick plate and feet
    px.hline(x + 1, x + 14, y + 21, W[3]);
    px.set(x + 1, y + 23, W[4]); px.set(x + 14, y + 23, W[4]);
    grime(px, x, y + 17, 16, 6, C('#6a5a40'), 0.3, 0.6, 3, 3, 2);
    px.outline();
    if (run) {
      // rumble ticks beside it
      const t = C('#2a2430', 0.7);
      if (k === 0) { px.set(0, 15, t); px.set(0, 17, t); }
      if (k === 2) { px.set(17, 14, t); px.set(17, 16, t); }
    }
    floorShadow(px, 9, 25, 8.5, 1.4);
    return fr(px, 9, 26);
  }
  def('washer', () => washer(0, 0, false, 0));
  def('washer_run', () => [washer(-1, 0, true, 0), washer(0, 1, true, 1), washer(1, 0, true, 2)], 12);

  // laundry chute: a square steel hatch in the wall with a handle, darkness behind a gap
  function chute(open) {
    const px = new G.PX(16, 32);
    const S = R('#b8bcc0', '#9a9ea4', '#80848c', '#646870', '#4a4e56');
    // wall plate (frame), screwed on
    bevel(px, 1, 7, 14, 19, S);
    for (const [x, y] of [[2, 8], [13, 8], [2, 24], [13, 24]]) px.set(x, y, S[4]);
    // the opening
    const ox = 3, oy = 10, ow = 10, oh = 12;
    px.rect(ox, oy, ow, oh, VOID);
    if (!open) {
      // the hatch: hinged at the bottom, not quite shut: a black gap along the top
      bevel(px, ox, oy + 1, ow, oh - 1, R('#c4c8cc', '#a6aab0', '#8c9098', '#6e727a', '#50545c'));
      px.hline(ox, ox + ow - 1, oy, VOID);
      // pull handle
      px.hline(ox + 3, ox + 6, oy + 3, CHROME[1]); px.set(ox + 2, oy + 3, CHROME[3]); px.set(ox + 7, oy + 3, CHROME[3]);
      px.hline(ox + 3, ox + 6, oy + 4, CHROME[4]);
      // stencilled yellow down arrow
      const ax = ox + 4, AY = C('#d8b84a');
      px.rect(ax, oy + 6, 2, 2, AY);
      px.hline(ax - 2, ax + 3, oy + 8, AY); px.hline(ax - 1, ax + 2, oy + 9, AY); px.hline(ax, ax + 1, oy + 10, AY);
      // smudged hand prints around the handle
      grime(px, ox, oy + 1, ow, 5, C('#4a4040'), 0.25, 0.55, 12, 2, 2);
    } else {
      // inside: the chute's top lip catches a little light, then nothing
      px.hline(ox, ox + ow - 1, oy, S[3]);
      px.hline(ox, ox + ow - 1, oy + 1, C('#2a2c32'));
      px.hline(ox + 1, ox + ow - 2, oy + 2, C('#18191e'));
      // the hatch folded down toward us (inside face, foreshortened)
      for (let j = 0; j < 4; j++) {
        const yy = oy + oh + j, xs = ox - (j >> 1), xe = ox + ow - 1 + (j >> 1);
        px.hline(xs, xe, yy, j === 0 ? S[4] : j === 3 ? S[3] : S[1]);
        px.set(xs, yy, S[2]); px.set(xe, yy, S[3]);
      }
      px.hline(ox + 3, ox + 6, oy + oh + 2, CHROME[3]); // the handle, now underneath
    }
    // rust dribbles from the frame
    px.set(4, 26, RUST[2]); px.set(4, 27, RUST[3]); px.set(11, 26, RUST[3]);
    px.outline();
    return wallF(px, open ? 30 : 30);
  }
  def('chute', () => chute(false));
  def('chute_open', () => chute(true));

  // big wicker laundry basket full of sheets (hiding spot)
  def('basket', () => {
    const px = new G.PX(18, 19);
    const WK = R('#d8b47a', '#bc9a60', '#9c7c48', '#7a5e34', '#564022');
    // body: woven texture, slightly tapered
    for (let y = 8; y <= 17; y++) {
      const inset = y > 14 ? 1 : 0;
      for (let x = 1 + inset; x <= 16 - inset; x++) {
        const cell = ((x >> 1) + (y >> 1)) % 2;
        let c = cell ? WK[2] : WK[1];
        if (y % 2 === 1 && cell) c = WK[3];
        if (x <= 2 + inset) c = cell ? WK[1] : WK[0];
        if (x >= 15 - inset) c = cell ? WK[3] : WK[4];
        px.set(x, y, c);
      }
    }
    px.hline(2, 15, 17, WK[4]);
    // rim
    px.hline(1, 16, 7, WK[1]); px.hline(1, 16, 8, WK[3]); px.set(1, 7, WK[0]);
    // handle holes
    px.rect(3, 10, 2, 1, WK[4]); px.rect(13, 10, 2, 1, WK[4]);
    // heap of sheets
    const SH = WHITE;
    px.ellipse(9, 6, 7.5, 4.2, SH[1]);
    px.ellipse(7, 4.5, 4, 2.5, SH[0]);
    px.ellipse(12, 5, 3, 2, SH[1]);
    px.line(5, 7, 9, 5, SH[3]); px.line(11, 6, 14, 7, SH[3]); px.set(10, 3, SH[2]);
    // a sheet corner hanging over the front
    px.poly([[9, 7], [14, 7], [12.5, 13], [11, 12]], SH[1]);
    px.line(12, 8, 12, 12, SH[3]); px.set(11, 11, SH[2]);
    px.outline();
    floorShadow(px, 9, 18, 8.5, 1.4);
    return fr(px, 9, 19);
  });

  // a front-loading dryer with its lint trap drawer pulled out (grey fluff)
  def('lint_trap', () => {
    const px = new G.PX(16, 26);
    const W = R('#ecebe4', '#d6d4cc', '#bab8b0', '#96948e', '#706e6a');
    box(px, 0, 2, 16, 23, 4, W);
    // control strip with a knob
    px.hline(1, 14, 7, W[3]); px.set(3, 5, C('#5a5a64')); px.set(4, 5, C('#3a3a44'));
    px.set(12, 5, C('#7a2a24'));
    // round door: chrome ring and dark glass
    px.disc(8, 15, 4.6, CHROME[2]);
    px.disc(8, 15, 3.6, C('#22262e'));
    px.set(6, 13, C('#5a6470')); px.set(7, 12, C('#4a525e')); px.set(6, 14, C('#3a424c'));
    px.set(4, 12, CHROME[0]); px.set(5, 11, CHROME[1]); px.set(11, 18, CHROME[4]);
    // lint drawer slot at the bottom, pulled out toward us with fluff
    px.rect(3, 21, 10, 1, VOID2);
    box(px, 3, 21, 10, 4, 2, R('#a8a8b0', '#8e8e98', '#76767e', '#5e5e66', '#46464e'));
    px.rect(4, 21, 8, 1, C('#8a8690'));
    px.set(5, 20, C('#a8a4ae')); px.set(6, 20, C('#9a96a0')); px.set(8, 20, C('#b0acb6')); px.set(9, 19, C('#a8a4ae')); px.set(10, 20, C('#8a8690'));
    px.outline();
    floorShadow(px, 8, 25.3, 8, 1.3);
    return fr(px, 8, 26);
  });

  // a steel shelf with detergent and chemical bottles
  def('shelf_bottles', () => {
    const px = new G.PX(16, 32);
    const S = STEEL;
    // uprights
    px.vline(0, 1, 31, S[1]); px.vline(1, 1, 31, S[3]);
    px.vline(14, 1, 31, S[2]); px.vline(15, 1, 31, S[4]);
    const shelf = (y) => { px.hline(0, 15, y, S[0]); px.hline(0, 15, y + 1, S[2]); px.hline(1, 14, y + 2, S[4]); };
    // top shelf: box of detergent, a jug
    px.rect(2, 3, 5, 6, C('#e8e4dc')); px.rect(2, 4, 5, 2, C('#4a7ab8')); px.set(3, 4, C('#e8604a')); px.vline(6, 3, 8, C('#b8b4ac'));
    px.rect(8, 4, 5, 5, C('#dcd8c8')); px.rect(9, 3, 2, 1, C('#4a6ab0')); px.vline(12, 4, 8, C('#aaa69a')); px.set(8, 4, C('#f4f0e6'));
    px.rect(9, 6, 3, 2, C('#e0a040'));
    shelf(9);
    // middle: brown glass developer bottle, green bottle, spray bottle
    px.rect(2, 14, 3, 6, C('#5a3420')); px.rect(3, 12, 1, 2, C('#4a2a1a')); px.set(2, 14, C('#8a5a3a')); px.rect(2, 16, 3, 2, C('#e8e0c8'));
    px.rect(6, 13, 3, 7, C('#3a6a4a')); px.set(7, 12, C('#2a4a34')); px.vline(6, 13, 19, C('#5a8a6a'));
    px.rect(10, 15, 3, 5, C('#c8d8e8')); px.rect(10, 13, 2, 2, C('#c8483c')); px.set(12, 13, C('#c8483c')); px.vline(12, 15, 19, C('#98a8b8'));
    shelf(20);
    // bottom: a can, a bucket of something, rags
    px.rect(2, 25, 4, 6, C('#8a8e96')); px.hline(2, 5, 25, C('#b8bcc4')); px.rect(2, 27, 4, 2, C('#c8a040'));
    px.rect(7, 26, 7, 5, C('#c8b8a0')); px.set(8, 26, C('#e0d4c0')); px.hline(7, 13, 30, C('#9a8a74'));
    px.set(9, 25, C('#7a8aa0')); px.set(10, 25, C('#8a9ab0'));
    shelf(29);
    px.outline();
    return fr(px, 8, 32);
  });

  // =====================================================================
  //  DARKROOM (303)
  // =====================================================================
  function safelight(on, k) {
    const px = new G.PX(28, 30);
    const H = R('#5a5650', '#45423e', '#34322f', '#262422', '#181716');
    const cx = 14, top = 5;
    // wall bracket and the cord running down
    px.rect(cx - 1, top - 2, 2, 2, H[2]);
    px.vline(cx + 4, top + 9, 29, C('#1c1a1a'));
    // housing: a small box lamp tilted down, seen from the front
    bevel(px, cx - 6, top, 12, 10, H);
    px.hline(cx - 6, cx + 5, top, H[0]);
    // filter window
    const fx = cx - 4, fy = top + 2, fw = 8, fh = 6;
    if (on) {
      const RL = R('#ffd0b8', '#ff7a5a', '#e2382a', '#a81c18', '#6a0e10');
      px.rect(fx, fy, fw, fh, RL[2]);
      px.rect(fx + 1, fy + 1, fw - 2, fh - 2, RL[1]);
      px.rect(fx + 2, fy + 1, 3, 2, RL[0]);
      px.hline(fx, fx + fw - 1, fy + fh - 1, RL[3]);
      if (k === 1) px.set(fx + 5, fy + 3, RL[0]);
    } else {
      px.rect(fx, fy, fw, fh, C('#3a1416'));
      px.rect(fx + 1, fy + 1, 3, 1, C('#5a2224'));
      px.hline(fx, fx + fw - 1, fy + fh - 1, C('#240c0e'));
    }
    px.outline();
    if (on) {
      // red glow pulsing on the wall around it
      halo(px, cx, fy + 3, k ? 14 : 13, C('#ff3020'), k ? 0.78 : 0.66);
      halo(px, cx, fy + 12, k ? 10 : 9, C('#ff2a1a'), 0.3);
    }
    return wallF(px, 26);
  }
  def('safelight_off', () => safelight(false, 0));
  def('safelight_on', () => [safelight(true, 0), safelight(true, 1)], 2);

  // a table with three developing trays (developer / stop / fixer) and tongs
  def('darkroom_tray', () => {
    const px = new G.PX(32, 22);
    const T = R('#d8dccc', '#bcc0b2', '#9ea296', '#7e8278', '#5e6058');
    // table: top surface and front apron, legs
    box(px, 0, 4, 32, 10, 7, R('#7a7e86', '#62666e', '#4e525a', '#3c4046', '#2a2d32'));
    px.rect(1, 14, 2, 7, C('#3a3d44')); px.rect(29, 14, 2, 7, C('#2a2d32'));
    px.hline(3, 28, 18, C('#2a2d32'));
    // three trays, each a shallow box with liquid
    const liquids = [C('#8a6a3a'), C('#9aa0a0'), C('#6a7a8a')];
    for (let i = 0; i < 3; i++) {
      const x = 1 + i * 10;
      px.rect(x, 2, 10, 7, T[1]);
      px.hline(x, x + 9, 2, T[0]); px.vline(x + 9, 3, 8, T[3]); px.hline(x, x + 9, 8, T[4]);
      px.rect(x + 1, 3, 8, 4, liquids[i]);
      px.hline(x + 1, x + 8, 3, dk(liquids[i], 0.25));
      px.set(x + 2, 5, lt(liquids[i], 0.3)); px.set(x + 3, 5, lt(liquids[i], 0.2));
    }
    // a print floating in the first tray, tongs resting across the second
    px.rect(3, 4, 4, 3, C('#d8d4c8')); px.rect(4, 5, 2, 1, C('#8a8478'));
    px.line(13, 6, 18, 2, C('#c8b070')); px.line(14, 6, 19, 3, C('#a89050'));
    px.outline();
    floorShadow(px, 16, 21, 15, 1.5);
    return fr(px, 16, 22);
  });

  // a string with hanging photographs (blank grey squares) and clothes pegs
  def('photo_line', () => {
    const px = new G.PX(32, 16);
    const sag = (x) => 2 + Math.round(Math.sin((x / 31) * Math.PI) * 2);
    for (let x = 0; x < 32; x++) px.set(x, sag(x), C('#c8c0b0'));
    px.set(0, 1, STEEL[2]); px.set(31, 1, STEEL[2]); // hooks
    const greys = [C('#a8a6a0'), C('#8a8884'), C('#b8b4ac'), C('#6e6c6a')];
    [3, 11, 19, 26].forEach((x, i) => {
      const y = sag(x + 2) + 1;
      const h = i === 2 ? 8 : 7;
      px.rect(x, y, 5, h, greys[i]);
      px.hline(x, x + 4, y, lt(greys[i], 0.2));
      px.vline(x + 4, y + 1, y + h - 1, dk(greys[i], 0.2));
      if (i === 1) { px.set(x + 4, y + h - 1, dk(greys[i], 0.35)); px.set(x + 3, y + h - 1, dk(greys[i], 0.2)); } // curled corner
      // faint image appearing on one of them
      if (i === 3) { px.set(x + 2, y + 3, C('#4a4846')); px.rect(x + 1, y + 4, 3, 2, C('#5a5856')); }
      // wooden peg
      px.set(x + 2, y - 2, WOOD[1]); px.set(x + 2, y - 1, WOOD[2]); px.set(x + 2, y, WOOD[3]);
    });
    px.outline();
    wallDrop(px, 1, 1, C('#0a0612', 0.25));
    return wallF(px, 20);
  });

  // a photo enlarger on a bench
  def('enlarger', () => {
    const px = new G.PX(16, 32);
    // bench
    box(px, 0, 19, 16, 7, 4, DWOOD);
    px.rect(1, 26, 2, 6, DWOOD[3]); px.rect(13, 26, 2, 6, DWOOD[4]);
    // baseboard with a white easel
    px.rect(2, 19, 12, 3, C('#2a2a30')); px.hline(2, 13, 19, C('#3e3e46'));
    px.rect(3, 20, 6, 2, C('#e8e4d8')); px.hline(3, 8, 21, C('#c8b850'));
    // column
    px.vline(11, 1, 20, CHROME[1]); px.vline(12, 1, 20, CHROME[3]);
    // head: lamp housing, bellows, lens
    px.rect(3, 3, 8, 5, C('#2e2e34')); px.hline(3, 10, 3, C('#4a4a54')); px.vline(3, 4, 7, C('#3a3a42'));
    px.rect(5, 1, 4, 2, C('#3a3a42')); px.hline(5, 8, 1, C('#56565e'));
    px.rect(4, 8, 6, 4, C('#1e1c20'));
    for (let y = 9; y <= 11; y += 2) px.hline(4, 9, y, C('#34323a'));
    px.rect(6, 12, 2, 2, CHROME[2]); px.set(6, 12, CHROME[0]);
    px.hline(9, 10, 5, CHROME[3]); px.set(10, 6, CHROME[2]);
    px.outline();
    floorShadow(px, 8, 31, 8, 1.4);
    return fr(px, 8, 32);
  });

  // =====================================================================
  //  THE BIRTHDAY PARTY (201)
  // =====================================================================
  const ICING = R('#fffaf4', '#f2e8de', '#dccabc', '#b8a294', '#8e7a70');
  const PINK = R('#f8c0cc', '#e892a6', '#c86a82', '#9a4a62', '#6a3044');
  // long table with a white cloth, paper plates and a big cake iced with pink letters
  def('party_table', () => {
    const px = new G.PX(50, 36);
    const CL = R('#fbf8f2', '#ebe6dc', '#d4cec2', '#b0aa9e', '#88837a');
    const X = 1;
    // cloth: top face (deep) and a draped front with soft folds and a lace hem
    px.rect(X, 4, 48, 20, CL[1]);
    px.hline(X, X + 47, 4, CL[0]);
    px.vline(X + 47, 4, 23, CL[2]);
    // faint creases from the folded cloth
    px.hline(X + 2, X + 45, 13, mix(CL[1], CL[2], 0.4));
    px.vline(X + 16, 5, 23, mix(CL[1], CL[2], 0.3)); px.vline(X + 32, 5, 23, mix(CL[1], CL[2], 0.3));
    px.rect(X, 24, 48, 9, CL[2]);
    px.hline(X, X + 47, 24, CL[0]);
    for (const fx of [X + 6, X + 17, X + 30, X + 41]) { px.vline(fx, 26, 32, CL[3]); px.vline(fx - 1, 26, 31, CL[1]); }
    px.vline(X, 24, 32, CL[1]); px.vline(X + 47, 24, 32, CL[3]);
    for (let x = X; x < X + 48; x++) { px.set(x, 32, CL[3]); if (x % 3 !== 2) px.set(x, 33, CL[2]); }
    // table legs peeking under the cloth
    px.rect(X + 2, 34, 2, 2, DWOOD[2]); px.rect(X + 44, 34, 2, 2, DWOOD[3]);
    // paper plates (each with a fork) and paper cups
    const plate = (x, y) => {
      px.ellipse(x, y, 3.6, 1.9, CL[0]);
      px.ellipse(x, y + 0.2, 2.2, 1, CL[2]);
      px.set(x + 3, y, CHROME[2]); px.set(x + 3, y - 1, CHROME[1]);
    };
    plate(6, 8); plate(6, 19); plate(44, 8); plate(44, 19);
    const cup = (x, y, c) => { px.rect(x, y, 2, 3, c); px.set(x, y, lt(c, 0.4)); px.set(x + 1, y + 2, dk(c, 0.25)); };
    cup(11, 5, C('#8ab0d8')); cup(38, 5, C('#e0a0b0')); cup(10, 15, C('#e0a0b0')); cup(39, 15, C('#8ab0d8'));
    // a striped party hat lying on its side
    px.poly([[5, 13], [10, 11], [10, 15]], C('#e8c860'));
    px.set(7, 13, C('#c86a82')); px.set(9, 12, C('#c86a82')); px.set(9, 14, C('#c86a82'));
    // the cake: round, iced, a pink piped border, HARU written on top
    const cx = 25, ty = 12;
    px.ellipse(cx, 21, 13.5, 3.2, C('#c8c2b8')); // cake board
    px.rect(13, ty, 24, 8, ICING[2]);
    px.ellipse(cx, ty + 8, 12, 3.4, ICING[2]);
    for (let y = ty; y < ty + 12; y++) for (let x = 12; x < 38; x++) {
      if (px.get(x, y) !== ICING[2]) continue;
      px.set(x, y, x < 16 ? ICING[1] : x > 33 ? ICING[3] : ICING[2]);
    }
    // a band of pink piping around the side
    for (let x = 13; x <= 36; x++) { const yy = ty + 6 + Math.round(Math.sqrt(Math.max(0, 1 - ((x + 0.5 - cx) / 12) ** 2)) * 3); px.set(x, yy, (x % 2) ? PINK[1] : PINK[2]); }
    px.ellipse(cx, ty, 12, 5, ICING[0]);
    px.ellipse(cx + 0.5, ty + 0.4, 11, 4.2, ICING[1]);
    px.ellipse(cx, ty - 0.3, 10.5, 3.8, ICING[0]);
    // piped rosettes along the back rim and strawberries
    for (let a = 0; a < 12; a++) {
      const t = Math.PI + (a / 11) * Math.PI;
      const rx = Math.round(cx - 0.5 + Math.cos(t) * 11), ry = Math.round(ty + Math.sin(t) * 4.4);
      px.set(rx, ry, PINK[a % 2 ? 1 : 0]);
    }
    for (const sx of [17, 22, 28, 33]) { px.set(sx, ty - 3, C('#c83a3a')); px.set(sx, ty - 4, C('#5a8a4a')); px.set(sx + 1, ty - 3, C('#9a2a2a')); }
    text(px, 'HARU', cx - 7, ty - 1, (x, y) => (y < ty + 1 ? PINK[2] : PINK[3]));
    px.outline();
    floorShadow(px, 25, 35, 24, 1.6);
    return fr(px, 25, 36);
  });

  // one tall birthday candle in a little holder, a folded paper name card in front (lit: flicker)
  function cakeCandle(lit, k) {
    const px = new G.PX(16, 28);
    const cx = 8;
    // candle: pastel with a spiral stripe
    for (let y = 9; y <= 21; y++) {
      px.set(cx - 1, y, C('#d8e4f4')); px.set(cx, y, C('#b8c8e0')); px.set(cx + 1, y, C('#8ea2c0'));
      const s = (y + 0) % 4;
      if (s === 0) px.set(cx - 1, y, C('#f0a0b4')); if (s === 1) px.set(cx, y, C('#d87a94')); if (s === 2) px.set(cx + 1, y, C('#b05a74'));
    }
    px.hline(cx - 1, cx + 1, 9, C('#eef2f8'));
    // wax drip
    px.set(cx - 1, 10, C('#eef2f8')); px.set(cx - 1, 11, C('#eef2f8'));
    // holder: little brass dish
    px.ellipse(cx, 22.5, 4, 1.6, GOLD[2]); px.hline(cx - 3, cx + 2, 22, GOLD[1]); px.hline(cx - 2, cx + 3, 23, GOLD[3]);
    px.set(cx - 3, 22, GOLD[0]);
    // wick
    px.set(cx, 8, C('#2a2020'));
    if (lit) {
      const lean = [0, 1, 0][k], hgt = [0, -1, 1][k];
      G.teardrop(px, cx, 5 + hgt * 0 + 1, 1.6, cx + lean, 1 + hgt, GLOW[3]);
      G.teardrop(px, cx, 6, 1.0, cx + lean, 3 + hgt, GLOW[1]);
      px.set(cx, 6, GLOW[0]);
      px.set(cx, 7, C('#5a7ad0')); // blue root of the flame
    } else {
      px.set(cx, 7, C('#2a2020')); px.set(cx + 1, 6, C('#2a2020'));
    }
    // folded name card (tent) in front of the holder, with a handwritten name
    px.rect(3, 21, 10, 5, PAPER[0]);
    px.hline(3, 12, 21, PAPER[1]);
    px.hline(3, 12, 25, PAPER[3]);
    px.vline(12, 22, 25, PAPER[2]);
    px.hline(4, 11, 20, PAPER[2]); // the back half of the fold peeking over
    // the name: a short scribble of ink letters
    const ink = C('#3a3048');
    px.set(5, 23, ink); px.set(6, 22, ink); px.set(6, 23, ink); px.set(7, 23, ink); px.set(8, 22, ink); px.set(9, 23, ink); px.set(10, 23, ink); px.set(10, 22, ink);
    px.outline();
    if (lit) {
      halo(px, cx, 4 + [0, -1, 1][k] * 0.5, [6.5, 6, 7][k], C('#ffc060'), [0.42, 0.36, 0.46][k]);
      lightOn(px, cx, 5, 9, C('#ffd890'), 0.35);
    } else {
      // a wisp of smoke curling up
      const sm = C('#c8c4d0', 0.55);
      const wob = [0, 1, 2][k];
      for (let y = 0; y < 7; y++) {
        const x = cx + Math.round(Math.sin((y + wob) * 0.9) * 1.2) + (y < 3 ? 1 : 0);
        if (!px.get(x, y)) px.set(x, y, y < 2 ? C('#c8c4d0', 0.3) : sm);
      }
    }
    floorShadow(px, 8, 27, 6, 1.1, SHADOW2);
    return fr(px, 8, 28);
  }
  def('cake_candle', () => [cakeCandle(true, 0), cakeCandle(true, 1), cakeCandle(true, 2)], 8);
  def('cake_candle_out', () => [cakeCandle(false, 0), cakeCandle(false, 1), cakeCandle(false, 2)], 3);

  // a birthday card on the floor
  def('birthday_card', () => {
    const px = new G.PX(14, 11);
    // the card lies half open: inside page (white) and cover (pink) with a little cake
    px.poly([[1, 3], [7, 1.5], [7.5, 9], [1.5, 9.5]], PAPER[1]);
    px.poly([[7, 1.5], [13, 2.5], [12.5, 9.5], [7.5, 9]], PINK[1]);
    px.line(7, 2, 7, 8, PINK[3]);
    // cake on the cover
    px.rect(9, 5, 3, 2, ICING[1]); px.hline(9, 11, 7, PINK[3]); px.set(10, 4, C('#fff0b0')); px.set(10, 3, GLOW[2]);
    // handwriting inside
    px.hline(2, 5, 4, C('#6a6078')); px.hline(2, 6, 6, C('#6a6078')); px.hline(3, 5, 8, C('#6a6078'));
    px.outline();
    floorShadow(px, 7, 9.8, 6.5, 1.2, SHADOW2);
    return fr(px, 7, 11);
  });

  // four framed photos of children in a row (sepia / black-and-white)
  def('family_photos', () => {
    const px = new G.PX(33, 13);
    const FR = R('#5a4636', '#46342a', '#36281f', '#271c16', '#1a120e');
    const SEP = R('#e8dcc4', '#c8b898', '#a08c6c', '#6e5e48', '#3e342a');
    for (let i = 0; i < 4; i++) {
      const x = 1 + i * 8, y = i % 2 ? 2 : 1;
      bevel(px, x, y, 7, 10, FR);
      px.rect(x + 1, y + 1, 5, 8, SEP[0]);
      // child: face, hair/cap, shoulders
      const cx = x + 3;
      px.rect(cx - 1, y + 4, 3, 2, SEP[1]); // face
      px.set(cx - 1, y + 4, SEP[1]); px.set(cx, y + 5, SEP[2]);
      px.rect(x + 1, y + 7, 5, 2, SEP[3]); // shoulders
      if (i === 0) { px.rect(cx - 2, y + 2, 5, 2, SEP[4]); px.vline(cx - 2, y + 4, y + 6, SEP[4]); px.vline(cx + 2, y + 4, y + 6, SEP[4]); px.rect(x + 1, y + 7, 5, 2, SEP[2]); } // girl with a bob, pale dress
      if (i === 1) { px.rect(cx - 2, y + 2, 5, 2, SEP[4]); px.hline(cx - 2, cx + 2, y + 3, SEP[3]); px.set(cx - 2, y + 4, SEP[4]); } // school cap
      if (i === 2) { px.rect(cx - 1, y + 2, 4, 2, SEP[3]); px.hline(cx - 2, cx + 2, y + 3, SEP[4]); px.set(cx - 2, y + 4, SEP[3]); px.rect(x + 1, y + 7, 5, 2, SEP[2]); } // baseball cap
      if (i === 3) { px.rect(cx - 1, y + 3, 3, 1, SEP[4]); px.set(cx - 1, y + 4, SEP[3]); px.rect(x + 2, y + 7, 3, 2, SEP[2]); } // small boy
      px.set(cx - 1, y + 5, SEP[4]); px.set(cx + 1, y + 5, SEP[4]);
      // glass glint
      px.set(x + 5, y + 2, C('#ffffff'));
    }
    px.outline();
    wallDrop(px, 1, 1, C('#0a0612', 0.3));
    return wallF(px, 20);
  });

  // paper streamers and a hand-made banner: HAPPY BIRTHDAY, with a sign below: DECEMBER FRIENDS!
  def('streamers', () => {
    const px = new G.PX(58, 30);
    const ink = [CR.red, CR.blue, CR.green, CR.orange, CR.purple];
    const ccol = (s) => { let n = 0; return () => ink[n++ % ink.length]; };
    // crepe streamers: twisted swags across the top, tails at the ends
    const swag = (x0, x1, y0, depth, c1, c2) => {
      for (let x = x0; x <= x1; x++) {
        const t = (x - x0) / (x1 - x0);
        const y = Math.round(y0 + Math.sin(t * Math.PI) * depth);
        px.set(x, y, x % 3 === 0 ? c2 : c1); px.set(x, y + 1, x % 3 === 1 ? c2 : dk(c1, 0.15));
      }
    };
    swag(3, 29, 0, 4, C('#f0b0c0'), C('#d08098'));
    swag(28, 54, 0, 4, C('#a8c8e8'), C('#7a9ac0'));
    for (let y = 3; y < 24; y++) { px.set(5, y, y % 3 ? C('#f0b0c0') : C('#d08098')); px.set(52, y, y % 3 ? C('#a8c8e8') : C('#7a9ac0')); }
    // banner: two sheets of drawing paper taped together
    const bx = 2, by = 5, bw = 54, bh = 9;
    paperSheet(px, bx, by, bw, bh);
    px.vline(bx + 27, by, by + bh - 1, PAPER[2]);
    tape(px, bx + 26, by - 1, 3, 2); tape(px, bx - 1, by - 1, 3, 2); tape(px, bx + bw - 2, by - 1, 3, 2);
    // letters, each in a different marker colour
    const write = (s, x, y) => {
      const next = ccol();
      for (const ch of s) {
        const g = glyph(ch, true);
        if (!g) { x += 3; continue; }
        const col = next();
        g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') px.set(x + i, y + j, col); });
        x += g[0].length + 1;
      }
    };
    const t1 = 'HAPPY BIRTHDAY';
    write(t1, bx + Math.floor((bw - textW(t1, true)) / 2) + 1, by + 2);
    // a smaller sign hanging under the banner on two strings
    const sx = 11, sy = 16, sw = 36, sh = 12;
    px.vline(sx + 5, by + bh, sy, C('#b8b0a0')); px.vline(sx + sw - 6, by + bh, sy, C('#b8b0a0'));
    paperSheet(px, sx, sy, sw, sh, CREAM);
    const t2 = 'DECEMBER', t3 = 'FRIENDS!';
    write(t2, sx + Math.floor((sw - textW(t2, true)) / 2) + 1, sy + 1);
    write(t3, sx + Math.floor((sw - textW(t3, true)) / 2) + 1, sy + 6);
    // a crayon heart on each side of the sign
    for (const hx of [sx + 1, sx + sw - 4]) { px.set(hx, sy + 4, CR.pink); px.set(hx + 2, sy + 5, CR.pink); px.hline(hx, hx + 2, sy + 5, CR.pink); px.set(hx + 1, sy + 6, CR.pink); }
    px.outline();
    wallDrop(px, 1, 1, C('#0a0612', 0.25));
    return wallF(px, 30);
  });

  // @@PART3
})(window.G);
