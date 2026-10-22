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
        if (!(c >>> 24)) continue;
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
    crayCat(px, 2, 2, CR.orange, r, false);
    crayCat(px, 2, 8, CR.grey, r, false);
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

  // @@PART2
})(window.G);
