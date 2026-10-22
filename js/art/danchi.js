// Building and apartment props for NOBODY HOME. Names and sizes: docs/ART_LIST.md (section B).
// A 1970s danchi on a stormy night: grey concrete, pale green-grey steel doors, cream paint,
// tatami, rust, fluorescent tubes, rain. Light from the top-left; ramps are
// [highlight, light, base, shade, deep]. Every sprite is outlined last (px.outline()), then a
// soft translucent contact shadow may be added on empty pixels.
// Anchors: bottom-centre of the footprint. Wall props (z: 'wall') are anchored for the LOWER wall
// row, i.e. the anchor is the floor line; wall-local y 0 is the top of the 32px wall face.
(function (G) {
  'use strict';
  const C = G.C, def = G.defSprite, mix = G.mix;
  const dk = G.darken, lt = G.lighten;
  const R = function () { return Array.prototype.map.call(arguments, (h) => C(h)); };

  // ---------------- palettes ----------------
  const PAINT = R('#c9d4c2', '#abbaa9', '#91a294', '#748679', '#57665d'); // pale green-grey door paint
  const JAMB = R('#8c988e', '#6e7a70', '#57625a', '#434c46', '#2f3631');
  const STEEL = R('#c8ccd0', '#a6acb2', '#888e96', '#6a7078', '#4a4f57');
  const CHROME = R('#f6f8f6', '#d0d6d8', '#9ca4aa', '#6c727a', '#464b52');
  const CONC = R('#9c9ea0', '#84868a', '#6e7074', '#585a5e', '#424448');
  const CREAM = R('#f2ead2', '#dfd5b8', '#c4ba9a', '#a2987a', '#7c745c');
  const PAPER = R('#f4f0e6', '#e2ddd0', '#c8c2b2', '#a8a292', '#857f70');
  const WOOD = R('#c49e6c', '#a47e52', '#866240', '#684a31', '#4a3423');
  const DWOOD = R('#7c5a40', '#604430', '#4a3426', '#36261c', '#241912');
  const RUST = R('#c48252', '#9e5c36', '#7a4428', '#58311d', '#3c2215');
  const LACQ = R('#625058', '#42343a', '#2c2228', '#1e161b', '#120c10');
  const GOLD = R('#fae49c', '#dcb464', '#b48c42', '#88662e', '#5c441e');
  const GLOW = R('#fffbea', '#ffe4a4', '#ffbe5e', '#f28e36', '#ba5c22');
  const VOID = C('#09080d'), VOID2 = C('#141219');
  const SHADOW = C('#0a0612', 0.42), SHADOW2 = C('#0a0612', 0.22);
  const TEXT = C('#2a272e');

  // ---------------- 3x5 pixel font ----------------
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
    8: '###|#.#|###|#.#|###', 9: '###|#.#|###|..#|##.', '-': '...|...|###|...|...', '.': '...|...|...|...|.#.',
    '!': '.#.|.#.|.#.|...|.#.',
  };
  const FONT = {};
  for (const k in F3) FONT[k] = F3[k].split('|');
  const textW = (s) => { let w = 0; for (const ch of s) w += ch === ' ' ? 3 : 4; return Math.max(0, w - 1); };
  function text(px, s, x, y, col) {
    for (const ch of String(s)) {
      if (ch === ' ') { x += 3; continue; }
      const g = FONT[ch];
      if (g) g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') px.set(x + i, y + j, col); });
      x += 4;
    }
  }

  // ---------------- helpers ----------------
  // raised panel: lit top/left edges, shaded bottom/right
  function bevel(px, x, y, w, h, r, o) {
    o = o || {};
    px.rect(x, y, w, h, r[2]);
    px.hline(x, x + w - 1, y, r[o.top === undefined ? 0 : o.top]);
    px.vline(x, y + 1, y + h - 1, r[1]);
    px.vline(x + w - 1, y + 1, y + h - 1, r[3]);
    px.hline(x + 1, x + w - 1, y + h - 1, r[o.bot === undefined ? 4 : o.bot]);
  }
  // recessed panel: shaded top/left, lit bottom/right
  function sunk(px, x, y, w, h, r, fill) {
    px.rect(x, y, w, h, fill === undefined ? r[3] : fill);
    px.hline(x, x + w - 1, y, r[4]);
    px.vline(x, y, y + h - 1, r[4]);
    px.hline(x + 1, x + w - 1, y + h - 1, r[1]);
    px.vline(x + w - 1, y + 1, y + h - 1, r[2]);
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
  // clean vertical bands with a single checker row at each step (reads better than dither at 1x)
  function vsteps(px, x, y, w, h, cols, mask) {
    const n = cols.length;
    for (let j = 0; j < h; j++) {
      const i0 = Math.min(n - 1, Math.floor((j * n) / h));
      const prev = j > 0 ? Math.min(n - 1, Math.floor(((j - 1) * n) / h)) : i0;
      for (let i = 0; i < w; i++) {
        if (mask && !mask(x + i, y + j)) continue;
        px.set(x + i, y + j, prev !== i0 && (x + i + y + j) % 2 ? cols[prev] : cols[i0]);
      }
    }
  }
  // blotchy grime: darken existing pixels where value noise is high
  function grime(px, x, y, w, h, col, amt, thr, seed, sx, sy) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const c = px.get(x + i, y + j);
        if (!(c >>> 24)) continue;
        const n = G.vnoise((x + i) / (sx || 3), (y + j) / (sy || 4), seed || 1);
        if (n > thr + G.bayer(x + i, y + j) * 0.12) px.set(x + i, y + j, mix(c, col, amt));
      }
  }
  // rust dribble running down from (x, y)
  function dribble(px, x, y, len, r) {
    for (let j = 0; j < len; j++) px.set(x, y + j, j < 1 ? r[3] : j < len - 1 ? r[2] : r[1]);
    px.set(x + 1, y, r[3]);
  }
  // after outline: translucent shadow on empty pixels inside a rect (or via a test fn)
  function shade(px, x, y, w, h, col, test) {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) {
        if (!px.in(i, j) || px.get(i, j) >>> 24) continue;
        if (test && !test(i, j)) continue;
        px.set(i, j, col);
      }
  }
  // after outline: drop shadow of the whole silhouette offset (dx, dy) onto empty pixels
  function drop(px, dx, dy, col) {
    const src = px.d.slice(), w = px.w, h = px.h;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (src[y * w + x] >>> 24 !== 255) continue;
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        if (!(src[Y * w + X] >>> 24) && !(px.d[Y * w + X] >>> 24)) px.d[Y * w + X] = col;
      }
  }
  // soft elliptical floor shadow on empty pixels
  function floorShadow(px, cx, cy, rx, ry, col) {
    shade(px, Math.floor(cx - rx - 1), Math.floor(cy - ry - 1), Math.ceil(rx * 2 + 3), Math.ceil(ry * 2 + 3), col || SHADOW, (i, j) => {
      const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry;
      return dx * dx + dy * dy <= 1;
    });
  }
  // a few lighter scratches
  function scratches(px, x, y, w, h, col, n, rnd) {
    for (let k = 0; k < n; k++) {
      const sx = x + rnd.int(w), sy = y + rnd.int(h), l = 1 + rnd.int(3);
      for (let i = 0; i < l; i++) if (px.get(sx + i, sy - (i >> 1))) px.set(sx + i, sy - (i >> 1), col);
    }
  }
  // wall prop frame: bottom edge of the sprite sits at wall-local y `bottom` (32 = floor line)
  const wallF = (px, bottom, ax) => G.frame(px, ax === undefined ? px.w / 2 : ax, px.h + (32 - bottom));
  const fr = G.frame;
  const frames = (n, fn) => { const a = []; for (let k = 0; k < n; k++) a.push(fn(k)); return a; };

  // chain: links alternating along a line, with a dark gap pixel between pairs
  function chain(px, x0, y0, x1, y1, r) {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
      const k = i % 3;
      px.set(x, y, k === 0 ? r[1] : k === 1 ? r[2] : r[4]);
    }
  }
  // sagging chain (catenary-ish) between two points
  function chainSag(px, x0, y0, x1, y1, sag, r, thick) {
    const n = Math.max(2, Math.round(Math.abs(x1 - x0) + Math.abs(y1 - y0)));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * sag);
      const k = i % 4;
      const c = k === 0 ? r[0] : k === 1 ? r[2] : k === 2 ? r[1] : r[4];
      px.set(x, y, c);
      if (thick) px.set(x, y + 1, k === 3 ? r[4] : r[3]);
    }
  }
  function padlock(px, x, y, big) {
    // shackle then body; (x, y) = top-left of the shackle
    const w = big ? 6 : 4, h = big ? 5 : 4;
    px.hline(x + 1, x + w - 2, y, CHROME[1]);
    px.vline(x, y + 1, y + 2, CHROME[2]); px.vline(x + w - 1, y + 1, y + 2, CHROME[3]);
    bevel(px, x - (big ? 0 : 0), y + 3, w, h, GOLD);
    px.set(x + (w >> 1), y + 4 + (big ? 1 : 0), GOLD[4]);
    if (big) px.set(x + (w >> 1), y + 6, GOLD[4]);
  }

  // =====================================================================
  //  DOORS (1x2 on the wall face: 16x32, anchor (8, 32))
  // =====================================================================
  // steel jamb around a 16-wide door, leaving the leaf area x 1..14, y top+2..31
  function jamb(px, top, r) {
    px.rect(0, top, 16, 32 - top, r[2]);
    px.hline(0, 15, top, r[0]);
    px.hline(1, 14, top + 1, r[3]);
    px.vline(0, top + 1, 31, r[1]);
    px.vline(15, top + 1, 31, r[3]);
    px.set(15, top, r[1]);
  }
  function knob(px, x, y) {
    // round knob with a back rosette, lit from the top-left
    px.set(x - 1, y + 1, CHROME[3]);
    px.rect(x, y, 2, 2, CHROME[2]);
    px.set(x, y, CHROME[0]); px.set(x + 1, y + 1, CHROME[4]);
    px.set(x + 2, y + 1, PAINT[4]); px.set(x + 1, y + 2, PAINT[4]);
  }
  function numberPlate(px, x, y, s) {
    // 13x7 cream plate with dark 3x5 digits and a drop shadow
    const w = textW(s) + 2;
    px.rect(x, y, w, 7, CREAM[1]);
    px.hline(x, x + w - 1, y, CREAM[0]);
    px.vline(x, y, y + 6, CREAM[0]);
    px.hline(x + 1, x + w - 1, y + 6, CREAM[3]);
    px.vline(x + w - 1, y + 1, y + 6, CREAM[2]);
    text(px, s, x + 1, y + 1, TEXT);
    return w;
  }

  function aptDoorLeaf(px, num) {
    const rnd = G.rng(+num * 7 + 3);
    const L = PAINT;
    // leaf x 1..14, y 4..31: gentle top-left light, a little grime toward the floor
    vgrad(px, 1, 4, 14, 28, [mix(L[1], L[2], 0.5), L[2], L[2], L[2], mix(L[2], L[3], 0.6)]);
    px.hline(1, 14, 4, L[0]);
    px.vline(1, 5, 31, L[1]);
    px.vline(14, 5, 31, L[3]);
    // pressed panel seam (shallow recess around the lower half)
    px.hline(3, 12, 20, L[3]); px.hline(4, 12, 30, L[1]);
    px.vline(3, 21, 30, L[3]); px.vline(12, 21, 29, L[1]);
    // hinges on the left
    for (const hy of [7, 26]) { px.set(1, hy, JAMB[3]); px.set(1, hy + 1, JAMB[4]); }
    // number plate and its shadow
    numberPlate(px, 2, 6, String(num));
    px.hline(3, 14, 13, L[3]);
    // peephole
    px.set(7, 15, VOID); px.set(8, 15, VOID);
    px.set(7, 14, CHROME[1]); px.set(8, 14, CHROME[2]);
    px.set(6, 15, CHROME[2]); px.set(9, 15, CHROME[3]);
    px.set(7, 16, CHROME[3]); px.set(8, 16, CHROME[4]);
    // chain guard: a slide track with the chain hanging in a loop
    px.hline(11, 13, 15, CHROME[3]); px.set(11, 15, CHROME[1]);
    px.set(13, 16, CHROME[2]); px.set(12, 17, CHROME[4]); px.set(11, 16, CHROME[2]);
    // key cylinder + knob on the right
    px.set(12, 18, CHROME[2]); px.set(12, 19, VOID2);
    knob(px, 11, 20);
    // mail slot (newspaper flap) inside the panel
    px.hline(5, 10, 23, STEEL[1]);
    px.hline(5, 10, 24, VOID);
    px.hline(5, 10, 25, STEEL[3]);
    px.set(4, 24, STEEL[2]); px.set(11, 24, STEEL[3]);
    // ventilation louvre near the floor
    for (const ly of [27]) { px.hline(5, 10, ly, L[4]); px.hline(5, 10, ly + 1, L[1]); }
    // wear: rust at the bottom edge, scuffs around the knob
    dribble(px, 2 + rnd.int(3), 30, 2, RUST);
    if (rnd() < 0.7) dribble(px, 10 + rnd.int(4), 29, 3, RUST);
    if (rnd() < 0.5) dribble(px, 5 + rnd.int(6), 26, 1, RUST);
    scratches(px, 9, 19, 4, 3, L[0], 1, rnd);
    grime(px, 1, 24, 14, 8, L[4], 0.3, 0.62, +num, 3, 2);
    // door-specific touches
    if (num === '402') {
      // the empty flat: flyers stuffed in the slot
      px.set(6, 23, PAPER[0]); px.set(7, 23, PAPER[1]); px.set(7, 22, PAPER[0]); px.set(8, 23, C('#e8d878'));
      px.set(9, 23, C('#c8d8e8')); px.set(6, 24, PAPER[2]); px.set(8, 24, C('#b8a860')); px.set(8, 22, C('#d8c868'));
    }
    if (num === '403') {
      // a second lock, newer and brighter
      px.set(11, 17, CHROME[0]); px.set(12, 17, CHROME[2]);
    }
  }

  function aptDoor(num) {
    const px = new G.PX(16, 32);
    jamb(px, 2, JAMB);
    aptDoorLeaf(px, num);
    px.hline(0, 15, 31, JAMB[3]);
    px.outline();
    return fr(px, 8, 32);
  }
  for (const n of ['401', '402', '403', '404', '301', '302', '303', '201', '202', '203']) def('door_apt_' + n, () => aptDoor(n));

  // dark opening with a dim genkan beyond and the leaf seen from its edge
  function openDoor(px, leafR, chainOn, top) {
    top = top === undefined ? 4 : top;
    px.rect(1, top, 14, 32 - top, VOID);
    // the faintest interior: a step edge and genkan tiles
    px.hline(3, 14, 25, C('#1c1a1c'));
    px.hline(3, 14, 26, C('#2a2624'));
    for (let x = 3; x < 15; x++) for (let y = 27; y < 31; y++) px.set(x, y, (x + (y > 28 ? 2 : 0)) % 4 === 0 ? C('#121114') : C('#1a191c'));
    // inner side of the frame catches a little light
    px.vline(14, top, 31, C('#16151a'));
    // the leaf, swung back, seen almost edge-on
    px.rect(1, top, 3, 32 - top, leafR[3]);
    px.vline(1, top, 31, leafR[1]);
    px.vline(2, top, 31, leafR[2]);
    px.vline(3, top + 1, 31, leafR[4]);
    px.set(3, top + 14, CHROME[2]); px.set(3, top + 15, CHROME[3]);
    if (chainOn) { px.set(13, top + 8, CHROME[3]); px.set(13, top + 9, C('#5a6066')); px.set(12, top + 10, C('#7a8088')); px.set(13, top + 11, C('#4a4e56')); px.set(13, top + 12, C('#6a7078')); }
  }
  def('door_apt_open', () => {
    const px = new G.PX(16, 32);
    jamb(px, 2, JAMB);
    openDoor(px, PAINT, true);
    px.hline(0, 15, 31, JAMB[3]);
    px.outline();
    return fr(px, 8, 32);
  });

  // plain steel service door: cool grey, lever handle, blank sign plate, louvre
  function serviceLeaf(px, top) {
    const L = STEEL, rnd = G.rng(51);
    vgrad(px, 1, top, 14, 32 - top, [mix(L[1], L[2], 0.5), L[2], L[2], mix(L[2], L[3], 0.6)]);
    px.hline(1, 14, top, L[0]);
    px.vline(1, top + 1, 31, L[1]);
    px.vline(14, top + 1, 31, L[3]);
    // little sign plate (unreadable office lettering)
    bevel(px, 4, top + 3, 8, 4, PAPER);
    px.hline(5, 9, top + 4, C('#6a6870')); px.hline(5, 7, top + 5, C('#8a8890'));
    // lever handle
    px.set(12, top + 12, CHROME[3]); px.rect(12, top + 13, 2, 2, CHROME[2]); px.set(12, top + 13, CHROME[1]);
    px.hline(9, 11, top + 14, CHROME[1]); px.hline(9, 11, top + 15, CHROME[4]);
    px.set(12, top + 16, VOID2);
    // louvre
    for (let i = 0; i < 3; i++) { px.hline(4, 11, top + 19 + i * 2, L[4]); px.hline(4, 11, top + 20 + i * 2, L[1]); }
    // dents and rust at the bottom corners
    dribble(px, 2, 29, 2, RUST); dribble(px, 13, 28, 3, RUST);
    scratches(px, 3, top + 8, 9, 10, L[0], 2, rnd);
    grime(px, 1, top + 14, 14, 32 - top - 14, L[4], 0.3, 0.6, 52, 3, 2);
  }
  def('door_steel', () => {
    const px = new G.PX(16, 32);
    jamb(px, 2, R('#7e8288', '#64686e', '#50545a', '#3e4246', '#2c2f33'));
    serviceLeaf(px, 4);
    px.hline(0, 15, 31, C('#3e4246'));
    px.outline();
    return fr(px, 8, 32);
  });
  def('door_steel_open', () => {
    const px = new G.PX(16, 32);
    jamb(px, 2, R('#7e8288', '#64686e', '#50545a', '#3e4246', '#2c2f33'));
    openDoor(px, STEEL, false);
    // no genkan in a service room: plain concrete floor
    for (let x = 4; x < 14; x++) for (let y = 25; y < 31; y++) px.set(x, y, G.hash(x, y, 9) < 0.2 ? C('#1e1e22') : C('#151519'));
    px.hline(0, 15, 31, C('#3e4246'));
    px.outline();
    return fr(px, 8, 32);
  });

  // ---- stairwell fire door with a wired-glass window and a lit EXIT sign above ----
  // canvas 16x37: wall-local y 0 is canvas y 5, so the sign overhangs the ceiling edge
  const FIRE = R('#d4cebb', '#bcb5a0', '#a29b86', '#86806c', '#666050');
  const SIGN = [
    '..............',
    '.....w...wwww.',
    '...wwww..w..w.',
    '..w..w...w..w.',
    '.....ww..w..w.',
    '....w..w.w..w.',
    '...w.....w..w.',
    '..............',
  ];
  function exitSign(px, x, y) {
    // housing 14x8 (lit green panel 12x6), the runner heading for a doorway
    const g = C('#2ea862'), gD = C('#1d7a47'), w = C('#f0fff4');
    px.rect(x, y, 14, 8, C('#d8dcd8'));
    px.hline(x, x + 13, y, C('#f6f8f4'));
    px.hline(x + 1, x + 13, y + 7, C('#8e9490'));
    px.vline(x + 13, y + 1, y + 7, C('#a8aea9'));
    px.rect(x + 1, y + 1, 12, 6, g);
    px.vline(x + 11, y + 2, y + 6, gD); px.vline(x + 12, y + 2, y + 6, gD);
    px.stamp(SIGN, { w: w }, x, y);
    px.hline(x + 1, x + 9, y + 6, mix(g, gD, 0.5));
  }
  function stairsDoor(chained) {
    const o = 5; // wall-local y 0 is canvas y 5
    const px = new G.PX(16, 32 + o);
    const B = 31 + o; // floor row
    jamb(px, o + 3, R('#8a8678', '#6e6a5e', '#5a564c', '#46433b', '#33302a'));
    const top = o + 5;
    const L = FIRE, rnd = G.rng(61);
    vgrad(px, 1, top, 14, B + 1 - top, [mix(L[1], L[2], 0.4), L[2], L[2], mix(L[2], L[3], 0.6)]);
    px.hline(1, 14, top, L[0]);
    px.vline(1, top + 1, B, L[1]);
    px.vline(14, top + 1, B, L[3]);
    // wired-glass window: dark stairwell behind, green spill from the exit light down there
    sunk(px, 5, top + 3, 6, 9, L);
    px.rect(6, top + 4, 4, 7, C('#18221f'));
    for (let y = 0; y < 7; y++) for (let x = 0; x < 4; x++) {
      if ((x + y) % 3 === 0) px.set(6 + x, top + 4 + y, C('#34443f'));
      if (y > 4 && (x + y) % 2) px.set(6 + x, top + 4 + y, C('#1d3a2c'));
    }
    px.set(6, top + 4, C('#7a8e88')); px.set(7, top + 4, C('#56665f')); px.set(6, top + 5, C('#56665f'));
    // lever handle
    px.set(12, top + 13, CHROME[3]); px.rect(12, top + 14, 2, 2, CHROME[2]); px.set(12, top + 14, CHROME[1]);
    px.hline(9, 11, top + 15, CHROME[1]); px.hline(9, 11, top + 16, CHROME[4]);
    // door closer arm at the top
    px.hline(8, 13, top + 1, L[4]); px.hline(9, 12, top + 2, L[3]);
    // kick plate
    px.rect(2, B - 4, 12, 4, STEEL[2]); px.hline(2, 13, B - 4, STEEL[0]); px.hline(2, 13, B - 1, STEEL[4]);
    px.vline(13, B - 3, B - 1, STEEL[3]);
    scratches(px, 3, B - 3, 9, 2, STEEL[0], 2, rnd);
    grime(px, 1, top + 14, 14, B - top - 18, L[4], 0.25, 0.64, 62, 3, 2);
    dribble(px, 3, B - 7, 3, RUST);
    px.hline(0, 15, B, C('#46433b'));
    exitSign(px, 1, 0);
    if (chained) {
      // chains crossed in an X through the lever, padlock where they meet
      const CH = R('#c4c8cc', '#9a9fa6', '#767b83', '#55595f', '#383b40');
      chainSag(px, 1, top + 5, 14, top + 19, 0, CH, true);
      chainSag(px, 14, top + 5, 1, top + 19, 0, CH, true);
      padlock(px, 5, top + 11, true);
    }
    px.outline();
    // the sign glows a little on the wall around it
    shade(px, 0, 0, 16, 10, C('#3fe08a', 0.14), (i, j) => j > 0 || (i > 0 && i < 15));
    return fr(px, 8, 32 + o);
  }
  def('door_stairs', () => stairsDoor(false));
  def('door_stairs_chained', () => stairsDoor(true));

  // ---- lobby: double glass doors, night and rain beyond (2x2: 32x32, anchor (16, 32)) ----
  const ALU = R('#d8dcde', '#b6bbbe', '#979ca0', '#787d82', '#565a5f');
  const inGlass = (x, y) => y >= 7 && y <= 26 && ((x >= 4 && x <= 13) || (x >= 18 && x <= 27));
  function nightScene(px, k) {
    // one continuous street scene behind both leaves
    for (let y = 7; y <= 26; y++)
      for (let x = 4; x <= 27; x++) {
        if (!inGlass(x, y)) continue;
        let c;
        if (y < 17) c = G.bayer(x, y) < (y - 7) / 10 ? C('#141c2a') : C('#0c111d');
        else if (y < 21) c = C('#090c13');
        else c = (x * 5 + y * 3) % 7 < 2 ? C('#172029') : C('#10151c');
        px.set(x, y, c);
      }
    // building blocks on the far side, a few lit windows
    const sky = [[4, 15], [8, 14], [10, 16], [13, 13], [19, 15], [22, 14], [26, 16]];
    for (const [x, h] of sky) for (let xx = x; xx < x + 4; xx++) for (let y = h; y < 21; y++) if (inGlass(xx, y)) px.set(xx, y, C('#080a10'));
    for (const [x, y, c] of [[5, 17, '#a88a50'], [9, 16, '#6e5c3a'], [11, 18, '#8a7448'], [21, 16, '#9a8250'], [23, 18, '#5e5034']]) px.set(x, y, C(c));
    // sodium street lamp in the right pane with a halo, smeared on the wet road
    for (let y = 8; y < 14; y++) for (let x = 20; x < 27; x++) {
      const d = Math.hypot(x - 23, (y - 9.5) * 1.3);
      if (d < 3.4 && inGlass(x, y)) px.set(x, y, mix(px.get(x, y), C('#d89a50'), d < 1.8 ? 0.35 : 0.16));
    }
    px.set(23, 9, C('#ffe2a0')); px.set(22, 9, C('#d8a058')); px.set(24, 9, C('#d8a058'));
    px.vline(23, 10, 20, C('#1c2028'));
    for (let y = 21; y < 27; y++) { px.set(23, y, y % 2 ? C('#8a6a3a') : C('#5a4630')); if (y < 24) px.set(22 + (y % 2) * 2, y, C('#3a3226')); }
    // rain: thin streaks falling slightly to the left, crawling down with k
    const rnd = G.rng(77);
    for (let i = 0; i < 18; i++) {
      const x0 = 4 + rnd.int(26), y0 = rnd.int(20), l = 2 + rnd.int(2);
      for (let j = 0; j < l; j++) {
        const t = (y0 + k * 7 + j) % 20, y = 7 + t, x = x0 - (t >> 2);
        if (inGlass(x, y)) px.set(x, y, mix(px.get(x, y), C('#9ab0c8'), j === l - 1 ? 0.5 : 0.25));
      }
    }
    // reflections: a pale diagonal on each pane
    for (const bx of [5, 19]) for (let i = 0; i < 9; i++) for (const off of [0, 1]) {
      const x = bx + i + off, y = 25 - i * 2;
      for (const yy of [y, y - 1]) if (inGlass(x, yy)) px.set(x, yy, mix(px.get(x, yy), C('#c8d8e8'), off ? 0.1 : 0.18));
    }
  }
  function glassDoors(k, chained) {
    const px = new G.PX(32, 32);
    // frame posts and header
    px.rect(0, 2, 32, 30, ALU[2]);
    px.hline(0, 31, 2, ALU[0]); px.hline(0, 31, 3, ALU[1]); px.hline(1, 30, 4, ALU[3]);
    px.vline(0, 3, 31, ALU[1]); px.vline(1, 4, 31, ALU[3]);
    px.vline(31, 3, 31, ALU[3]); px.vline(30, 4, 31, ALU[2]);
    // two leaves x 2..15 / 16..29
    for (const lx of [2, 16]) {
      px.rect(lx, 5, 14, 26, ALU[2]);
      px.hline(lx, lx + 13, 5, ALU[0]);
      px.vline(lx, 6, 30, ALU[1]); px.vline(lx + 13, 6, 30, ALU[3]);
      // inner glazing bead
      px.hline(lx + 2, lx + 11, 6, ALU[4]); px.vline(lx + 1, 6, 27, ALU[2]);
      // kick rail
      px.hline(lx + 1, lx + 12, 27, ALU[0]); px.hline(lx + 1, lx + 12, 30, ALU[4]);
      px.hline(lx + 2, lx + 11, 29, ALU[3]);
    }
    nightScene(px, k);
    px.vline(15, 5, 30, ALU[4]); px.vline(16, 5, 30, ALU[1]);
    // long pull handles on stand-offs
    for (const hx of [12, 19]) {
      px.vline(hx, 10, 22, CHROME[1]); px.vline(hx + (hx < 16 ? 1 : -1), 11, 21, CHROME[3]);
      px.set(hx, 10, CHROME[0]); px.set(hx, 22, CHROME[3]);
    }
    // lock cylinder in the kick rail
    px.set(15, 28, GOLD[1]); px.set(16, 28, GOLD[3]);
    px.hline(0, 31, 31, ALU[4]);
    if (chained) {
      // heavy chain wound around both handles, big padlock hanging off it
      const CH = R('#b8bcc2', '#8e939a', '#6c7178', '#4c5056', '#33363b');
      chainSag(px, 11, 13, 20, 13, 2, CH, true);
      chainSag(px, 11, 17, 20, 17, 2, CH, true);
      for (const hx of [11, 20]) { px.set(hx, 14, CH[2]); px.set(hx, 15, CH[4]); px.set(hx, 16, CH[1]); }
      chainSag(px, 15, 19, 16, 21, 0, CH);
      padlock(px, 13, 21, true);
    }
    px.outline();
    return fr(px, 16, 32);
  }
  def('door_glass2', () => frames(3, (k) => glassDoors(k, false)), 5);
  def('door_glass2_chained', () => frames(3, (k) => glassDoors(k, true)), 5);

  // ---- basement: heavy rusted door, "B1" stencil, hazard stripe ----
  def('door_basement', () => {
    const px = new G.PX(16, 32);
    const L = R('#8a847c', '#6e6962', '#5a554f', '#47433e', '#34312d');
    jamb(px, 2, R('#5e5a54', '#4a4743', '#3c3a37', '#2e2c2a', '#201f1d'));
    vgrad(px, 1, 4, 14, 28, [L[1], L[2], L[2], L[3]]);
    px.hline(1, 14, 4, L[0]);
    px.vline(1, 5, 31, L[1]);
    px.vline(14, 5, 31, L[4]);
    // rust blooming from the edges and the bottom
    for (let y = 4; y < 32; y++) for (let x = 1; x < 15; x++) {
      const n = G.vnoise(x / 3, y / 4, 91) + (y > 22 ? (y - 22) * 0.05 : 0) + (x < 3 || x > 12 ? 0.12 : 0);
      if (n > 0.66 + G.bayer(x, y) * 0.12) px.set(x, y, n > 0.86 ? RUST[3] : n > 0.76 ? RUST[2] : RUST[1]);
    }
    // stencilled B1 (stencil bridges cut into the letters)
    text(px, 'B1', 4, 7, C('#e0d6b0'));
    px.set(5, 9, C('#a89e80')); px.set(9, 11, C('#a89e80'));
    // rivets around the edge
    for (let y = 6; y < 30; y += 4) { px.set(2, y, L[0]); px.set(13, y, L[0]); px.set(2, y + 1, L[4]); px.set(13, y + 1, L[4]); }
    // heavy lever
    px.rect(11, 15, 2, 3, CHROME[3]); px.set(11, 15, CHROME[1]);
    px.hline(7, 10, 16, CHROME[2]); px.hline(7, 10, 17, CHROME[4]); px.set(7, 16, CHROME[1]);
    px.set(12, 19, VOID);
    // hazard stripe band
    for (let y = 23; y < 27; y++) for (let x = 1; x < 15; x++) px.set(x, y, ((x + y) >> 1) % 2 ? C('#d8b02a') : C('#1c1a18'));
    px.hline(1, 14, 22, L[4]); px.hline(1, 14, 27, L[1]);
    grime(px, 1, 22, 14, 6, C('#2a1a10'), 0.35, 0.55, 92, 2, 2);
    // rust tears running from the rivets
    dribble(px, 2, 8, 4, RUST); dribble(px, 13, 12, 5, RUST); dribble(px, 9, 18, 4, RUST); dribble(px, 4, 28, 3, RUST);
    px.hline(0, 15, 31, C('#2e2c2a'));
    px.outline();
    return fr(px, 8, 32);
  });

  // ---- elevator (2x2 wall) ----
  function elevator(open) {
    const px = new G.PX(32, 32);
    const F = R('#7c8086', '#62666c', '#4e5258', '#3c4046', '#2a2d32');
    // surround
    px.rect(0, 1, 32, 31, F[2]);
    px.hline(0, 31, 1, F[0]); px.vline(0, 2, 31, F[1]); px.vline(31, 2, 31, F[3]);
    // floor indicator (dark): B 1 2 3 4 5 and an arrow, all unlit
    px.rect(3, 3, 26, 7, C('#121216'));
    px.hline(3, 28, 3, C('#060608')); px.hline(3, 28, 9, F[1]);
    text(px, 'B12345', 4, 4, C('#4e4244'));
    px.set(27, 5, C('#3e3436')); px.hline(26, 28, 6, C('#3e3436'));
    // a dead bulb glint on the glass
    px.set(4, 4, C('#6a5c5a'));
    // jambs
    px.rect(2, 11, 28, 21, F[3]);
    px.hline(2, 29, 11, F[4]);
    const doorL = (x, w, flip) => {
      // brushed stainless: vertical streaks
      for (let i = 0; i < w; i++) for (let y = 12; y < 31; y++) {
        const s = G.hash(x + i, 3, 5);
        let c = s < 0.3 ? CHROME[2] : s < 0.75 ? CHROME[1] : mix(CHROME[1], CHROME[0], 0.5);
        if (y > 26) c = mix(c, CHROME[3], 0.35);
        px.set(x + i, y, c);
      }
      px.vline(flip ? x + w - 1 : x, 12, 30, flip ? CHROME[3] : CHROME[0]);
      px.vline(flip ? x : x + w - 1, 12, 30, flip ? CHROME[2] : CHROME[3]);
    };
    if (!open) {
      doorL(3, 13, false);
      doorL(16, 13, true);
      px.vline(15, 12, 30, CHROME[4]); px.vline(16, 12, 30, CHROME[3]);
      // OUT OF ORDER notice taped across the seam
      const pX = 5, pY = 14;
      px.rect(pX, pY, 23, 13, PAPER[0]);
      px.vline(pX + 22, pY + 1, pY + 12, PAPER[2]); px.hline(pX + 1, pX + 22, pY + 12, PAPER[2]);
      px.set(pX + 22, pY + 12, PAPER[3]); px.set(pX + 21, pY + 12, PAPER[3]); px.set(pX + 22, pY + 11, PAPER[3]);
      text(px, 'OUT OF', pX + 1, pY + 2, TEXT);
      text(px, 'ORDER', pX + 2, pY + 8, TEXT);
      px.hline(pX + 2, pX + 20, pY + 7, C('#c0b8a8'));
      // tape
      px.set(pX, pY, C('#d8cc8c')); px.set(pX + 1, pY, C('#c8bc7c')); px.set(pX, pY + 1, C('#c8bc7c'));
      px.set(pX + 22, pY, C('#d8cc8c')); px.set(pX + 21, pY, C('#c8bc7c'));
    } else {
      // doors retracted into the jambs, the car beyond is dark
      doorL(3, 2, false); doorL(27, 2, true);
      px.rect(5, 12, 22, 19, C('#16161a'));
      px.rect(6, 12, 20, 2, C('#0c0c0e'));
      px.hline(6, 25, 14, C('#1e1e24'));
      // back wall panels and handrail
      for (const x of [11, 20]) px.vline(x, 14, 27, C('#101014'));
      px.hline(6, 25, 21, C('#3a3c42')); px.hline(6, 25, 22, C('#1a1a1e'));
      // car floor
      px.rect(5, 27, 22, 4, C('#222226'));
      px.hline(5, 26, 27, C('#2e2e34'));
      for (let x = 6; x < 26; x += 3) px.set(x, 29, C('#1a1a1e'));
    }
    // sill
    px.hline(2, 29, 31, CHROME[2]);
    px.outline();
    return fr(px, 16, 32);
  }
  def('elevator', () => elevator(false));
  def('elevator_open', () => elevator(true));

  // call plate beside the elevator: up/down buttons and a keyhole (1x1 wall)
  def('elevator_panel', () => {
    const px = new G.PX(9, 15);
    bevel(px, 0, 0, 9, 15, CHROME);
    for (let y = 1; y < 14; y++) for (let x = 1; x < 8; x++) if (G.hash(x, 1, 4) < 0.3) px.set(x, y, mix(px.get(x, y), CHROME[3], 0.3));
    // up / down buttons
    for (const [by, up] of [[2, true], [7, false]]) {
      px.rect(2, by, 5, 4, CHROME[3]);
      px.rect(3, by + 1, 3, 2, C('#e8e0c8'));
      px.set(2, by, CHROME[4]); px.hline(3, 6, by + 3, CHROME[1]);
      if (up) { px.set(4, by + 1, C('#8a8478')); } else { px.set(4, by + 2, C('#8a8478')); }
    }
    // keyhole
    px.set(4, 12, VOID); px.set(4, 13, VOID2); px.set(3, 12, CHROME[4]); px.set(5, 12, CHROME[1]);
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 23);
  });

  // inside the car: 1-5 and B, open/close, keyhole (1x1 wall)
  def('lift_buttons', () => {
    const px = new G.PX(15, 25);
    bevel(px, 0, 0, 15, 25, CHROME);
    for (let y = 1; y < 24; y++) for (let x = 1; x < 14; x++) if (G.hash(x, 2, 6) < 0.25) px.set(x, y, mix(px.get(x, y), CHROME[3], 0.3));
    // the floor buttons: backlit digits in a dark field
    sunk(px, 1, 1, 13, 15, CHROME, C('#24242a'));
    const lbl = C('#e8dcc0');
    [['1', '2', '3'], ['4', '5', 'B']].forEach((row, j) => row.forEach((s, i) => {
      text(px, s, 2 + i * 4, 3 + j * 7, s === 'B' ? C('#c8a868') : lbl);
    }));
    // open <|> and close >|< buttons
    const icon = (x, y, open) => {
      px.rect(x, y, 5, 5, C('#e8e2d0')); px.hline(x, x + 4, y + 4, CHROME[3]); px.vline(x + 4, y, y + 4, CHROME[3]);
      const k = C('#3a3638');
      px.vline(x + 2, y + 1, y + 3, k);
      if (open) { px.set(x, y + 2, k); px.set(x + 4, y + 2, k); }
      else { px.set(x + 1, y + 2, k); px.set(x + 3, y + 2, k); }
    };
    icon(1, 18, true); icon(6, 18, false);
    // keyhole for the service key
    px.rect(11, 18, 3, 5, CHROME[3]); px.set(12, 19, VOID); px.set(12, 20, VOID); px.set(12, 21, VOID2); px.hline(11, 13, 22, CHROME[1]);
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 28);
  });

  // =====================================================================
  //  APARTMENT WALL PIECES
  // =====================================================================
  // translucent paint on empty pixels only (glows and halos, after outline)
  function halo(px, cx, cy, rx, ry, col, a, test) {
    for (let j = Math.floor(cy - ry - 1); j <= Math.ceil(cy + ry + 1); j++)
      for (let i = Math.floor(cx - rx - 1); i <= Math.ceil(cx + rx + 1); i++) {
        if (!px.in(i, j) || px.get(i, j) >>> 24) continue;
        if (test && !test(i, j)) continue;
        const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry, d = dx * dx + dy * dy;
        if (d > 1) continue;
        px.set(i, j, C(col, a * (1 - d * 0.85)));
      }
  }
  // lerp toward a colour on already drawn pixels within an ellipse (light spill / glints)
  function spill(px, cx, cy, rx, ry, col, amt) {
    for (let j = Math.floor(cy - ry - 1); j <= Math.ceil(cy + ry + 1); j++)
      for (let i = Math.floor(cx - rx - 1); i <= Math.ceil(cx + rx + 1); i++) {
        const c = px.get(i, j);
        if (c >>> 24 !== 255) continue;
        const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry, d = dx * dx + dy * dy;
        if (d > 1) continue;
        const t = amt * (1 - d) + (G.bayer(i, j) - 0.5) * 0.12;
        if (t > 0.02) px.set(i, j, mix(c, col, Math.min(1, t)));
      }
  }
  // narrow digit '1' so "1958" fits a 16px sheet
  function textN(px, s, x, y, col) {
    for (const ch of String(s)) {
      if (ch === '1') { px.set(x, y + 1, col); px.vline(x + 1, y, y + 4, col); x += 3; continue; }
      text(px, ch, x, y, col); x += 4;
    }
  }

  // ---- fusuma / oshiire (2x2 wall: 32x32, anchor (16, 32)) ----
  const FPAPER = R('#ece2c4', '#ddd2b0', '#cabd98', '#ae9f7c', '#8a7d60');
  const HINOKI = R('#d2b486', '#b8966a', '#9a7a52', '#7a5e3e', '#58422c');
  // the wooden surround: lintel (kamoi), posts and the sill (shikii)
  function fusumaFrame(px) {
    px.rect(0, 0, 32, 32, HINOKI[2]);
    px.hline(0, 31, 0, HINOKI[0]); px.hline(0, 31, 1, HINOKI[1]); px.hline(2, 29, 2, HINOKI[4]);
    px.vline(0, 1, 31, HINOKI[1]); px.vline(1, 2, 31, HINOKI[3]);
    px.vline(30, 2, 31, HINOKI[1]); px.vline(31, 1, 31, HINOKI[3]);
    // wood grain on the lintel
    for (const x of [5, 12, 21, 26]) px.set(x, 1, HINOKI[2]);
    px.hline(0, 31, 31, HINOKI[3]);
  }
  // one paper leaf, lacquered edge, x0 .. x0+w-1, y 3..30
  function fusumaLeaf(px, x0, w, pullX, seed) {
    const top = 3, bot = 30;
    // paper: lit from the top, yellowed toward the floor
    vsteps(px, x0 + 1, top + 1, w - 2, bot - top - 1, [FPAPER[0], FPAPER[1], FPAPER[1], FPAPER[1], FPAPER[2]]);
    // karakami motif: little cloud marks on a staggered grid
    for (let y = top + 4; y < 18; y += 5)
      for (let x = x0 + 2 + ((y / 5) & 1) * 3; x < x0 + w - 3; x += 6) {
        px.set(x, y, FPAPER[2]); px.set(x + 1, y, FPAPER[2]); px.set(x + 1, y - 1, FPAPER[2]); px.set(x + 2, y, FPAPER[2]);
      }
    // a painted range of hills running across both leaves: far hills pale, near ones darker
    for (let x = x0 + 1; x < x0 + w - 1; x++) {
      const far = 19 + Math.round(Math.sin(x * 0.33 + 2.1) * 1.6 + Math.sin(x * 0.11) * 1.2);
      const near = 23 + Math.round(Math.sin(x * 0.42) * 1.3 + Math.sin(x * 0.17 + 1) * 1.8);
      for (let y = far; y < bot; y++) px.set(x, y, y === far ? mix(FPAPER[2], FPAPER[3], 0.35) : mix(FPAPER[1], FPAPER[2], 0.6));
      for (let y = near; y < bot; y++) px.set(x, y, y === near ? FPAPER[3] : y > bot - 3 ? mix(FPAPER[2], FPAPER[3], 0.7) : mix(FPAPER[2], FPAPER[3], 0.35));
    }
    // two flecks of gold leaf
    const rnd = G.rng(seed);
    for (let i = 0; i < 2; i++) px.set(x0 + 3 + rnd.int(w - 6), top + 3 + rnd.int(11), mix(GOLD[0], FPAPER[0], 0.3));
    // the lacquered frame
    px.hline(x0, x0 + w - 1, top, LACQ[1]);
    px.vline(x0, top, bot, LACQ[1]);
    px.vline(x0 + w - 1, top, bot, LACQ[3]);
    px.hline(x0, x0 + w - 1, bot, LACQ[3]);
    px.set(x0, top, LACQ[0]);
    // the right edge of each leaf turns a touch away from the light
    for (let y = top + 1; y < bot; y++) px.set(x0 + w - 2, y, mix(px.get(x0 + w - 2, y), FPAPER[4], 0.22));
    // the oval finger pull (hikite): gilt rim, lacquer inside
    const py = 15;
    px.set(pullX, py - 1, GOLD[1]);
    px.set(pullX - 1, py, GOLD[2]); px.set(pullX, py, LACQ[3]); px.set(pullX + 1, py, GOLD[3]);
    px.set(pullX - 1, py + 1, GOLD[2]); px.set(pullX, py + 1, LACQ[2]); px.set(pullX + 1, py + 1, GOLD[3]);
    px.set(pullX, py + 2, GOLD[3]);
  }
  // dark closet interior between x0..x1: the middle shelf (nakadana) and the floor board
  function closetInside(px, x0, x1) {
    for (let y = 3; y <= 30; y++)
      for (let x = x0; x <= x1; x++) px.set(x, y, (x + y) % 5 === 0 ? C('#17131a') : VOID2);
    // inner side wall nearest the light catches a little
    px.vline(x0, 3, 30, C('#2a2226')); px.vline(x0 + 1, 4, 30, C('#1e191d'));
    px.hline(x0, x1, 3, C('#0c0a0e')); px.hline(x0, x1, 4, C('#0c0a0e'));
    // shelf: top face and the lit front edge
    px.hline(x0, x1, 14, C('#2c2420'));
    px.hline(x0, x1, 15, HINOKI[3]); px.hline(x0, x1, 16, HINOKI[4]);
    px.set(x0, 15, HINOKI[2]);
    px.hline(x0, x1, 17, C('#060508'));
    // closet floor board
    px.hline(x0, x1, 29, C('#2c2420')); px.hline(x0, x1, 30, HINOKI[4]);
  }
  def('fusuma', () => {
    const px = new G.PX(32, 32);
    fusumaFrame(px);
    fusumaLeaf(px, 2, 15, 13, 3);
    // the right leaf runs in the front track: its edge throws a thin shadow on the left one
    px.vline(16, 4, 29, mix(FPAPER[3], LACQ[3], 0.4));
    fusumaLeaf(px, 16, 14, 18, 8);
    // old water stain on the left leaf, a little tear in the right one
    for (const [x, y] of [[4, 26], [5, 27], [6, 27], [7, 27], [3, 27], [4, 28]]) px.set(x, y, mix(px.get(x, y), C('#8a7046'), 0.35));
    px.set(24, 25, VOID2); px.set(25, 25, C('#3a3230')); px.set(24, 26, C('#3a3230')); px.set(23, 25, FPAPER[0]); px.set(25, 24, FPAPER[0]);
    px.outline();
    return fr(px, 16, 32);
  });
  def('fusuma_open', () => {
    const px = new G.PX(32, 32);
    fusumaFrame(px);
    closetInside(px, 2, 15);
    // both leaves stacked on the right: the back one peeks out 1px past the front one
    fusumaLeaf(px, 15, 15, 17, 3);
    fusumaLeaf(px, 16, 14, 18, 8);
    px.vline(15, 4, 29, LACQ[2]);
    // the leaf edge casts a shadow into the closet
    px.vline(14, 5, 29, C('#060508'));
    px.outline();
    return fr(px, 16, 32);
  });
  // a folded futon seen edge-on: rounded fold, highlight on top, shade underneath
  function foldedFuton(px, x, y, w, h, r, pattern) {
    px.rect(x + 1, y, w - 2, h, r[2]);
    px.vline(x, y + 1, y + h - 2, r[2]); px.vline(x + w - 1, y + 1, y + h - 2, r[3]);
    px.hline(x + 1, x + w - 2, y, r[0]);
    if (h > 2) px.hline(x + 1, x + w - 3, y + 1, r[1]);
    px.hline(x + 1, x + w - 2, y + h - 1, r[3]);
    px.set(x, y + h - 2, r[3]);
    if (pattern) for (let i = x + 2; i < x + w - 2; i += 3) px.set(i, y + 1 + (h > 3 ? 1 : 0), pattern);
  }
  def('oshiire', () => {
    const px = new G.PX(32, 32);
    fusumaFrame(px);
    closetInside(px, 16, 29);
    // the leaves pushed to the left
    fusumaLeaf(px, 2, 15, 12, 5);
    fusumaLeaf(px, 3, 14, 13, 9);
    px.vline(2, 4, 29, LACQ[2]);
    // stacked bedding on the upper shelf
    const BLUE = R('#a8b8d0', '#7d92b4', '#5c7096', '#435474', '#2e3a54');
    const ROSE = R('#d8a8a0', '#c08680', '#9c6662', '#784a4a', '#523236');
    const WHITE = R('#f2eee4', '#dcd6c8', '#beb8aa', '#9a9488', '#76716a');
    const OLIVE = R('#b8b080', '#9a9262', '#7c744a', '#5e5838', '#423e28');
    foldedFuton(px, 17, 11, 12, 3, WHITE);
    foldedFuton(px, 18, 8, 11, 3, BLUE, BLUE[4]);
    foldedFuton(px, 17, 6, 12, 2, ROSE);
    foldedFuton(px, 18, 3, 10, 3, OLIVE, OLIVE[0]);
    px.hline(17, 29, 14, C('#120e10'));
    // lower level: a cardboard box and the corner of a rolled-up mat
    const BOX = R('#b89868', '#a07e52', '#84663e', '#66502e', '#463620');
    px.rect(18, 22, 9, 7, BOX[2]); px.hline(18, 26, 22, BOX[0]); px.hline(18, 26, 23, BOX[1]);
    px.vline(26, 23, 28, BOX[3]); px.vline(18, 23, 28, BOX[1]);
    px.hline(20, 24, 25, BOX[3]); px.set(22, 23, BOX[3]);
    px.rect(27, 25, 3, 4, C('#5a5440')); px.set(27, 25, C('#7a7458')); px.vline(29, 25, 28, C('#3a3628'));
    px.hline(16, 29, 29, C('#2a2220'));
    px.outline();
    return fr(px, 16, 32);
  });

  // ---- calendar: DECEMBER 1958, the 9th circled (1x1 wall) ----
  def('calendar', () => {
    const px = new G.PX(16, 23);
    const P = PAPER;
    px.rect(0, 1, 16, 22, P[1]);
    vgrad(px, 0, 1, 16, 22, [P[0], P[1], P[1], P[2]]);
    px.vline(15, 1, 22, P[2]);
    // binding strip with the nail
    px.hline(0, 15, 0, C('#6a2e2a')); px.hline(0, 15, 1, C('#4a1e1c'));
    px.set(7, 0, CHROME[0]); px.set(8, 0, CHROME[2]);
    // the torn stubs of the months already gone
    px.set(2, 2, P[3]); px.set(5, 2, P[3]); px.set(11, 2, P[3]);
    // DEC / 1958
    text(px, 'DEC', 2, 3, TEXT);
    textN(px, '1958', 1, 9, C('#5a525a'));
    px.hline(1, 14, 15, P[3]);
    // the days: Dec 1958 began on a Monday; Sundays in red
    for (let d = 1; d <= 31; d++) {
      const i = d, col = i % 7, row = Math.floor(i / 7);
      px.set(1 + col * 2, 16 + row * 2 - (row > 0 ? 0 : 0), col === 0 ? C('#a85a56') : C('#4e4852'));
    }
    // the 9th (Tuesday, second row) circled in red crayon
    const RED = C('#c8282c'), RED2 = C('#962022');
    const cx = 1 + 2 * 2, cy = 18;
    for (const [x, y, c] of [[cx - 1, cy - 2, RED], [cx, cy - 2, RED], [cx + 1, cy - 2, RED], [cx + 2, cy - 1, RED], [cx + 2, cy, RED2], [cx + 2, cy + 1, RED2],
      [cx + 1, cy + 2, RED2], [cx, cy + 2, RED], [cx - 1, cy + 2, RED], [cx - 2, cy + 1, RED], [cx - 2, cy, RED], [cx - 2, cy - 1, RED], [cx + 3, cy - 2, RED]]) px.set(x, y, c);
    px.set(cx, cy, RED2);
    // the bottom corner curls up
    px.set(15, 22, 0); px.set(14, 22, P[3]); px.set(15, 21, P[3]);
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 23);
  });

  // ---- printed name card in a clear plastic holder (1x1 wall) ----
  def('name_card', () => {
    const px = new G.PX(8, 11);
    px.rect(0, 0, 8, 11, STEEL[2]);
    px.hline(0, 7, 0, STEEL[0]); px.vline(0, 1, 10, STEEL[1]); px.vline(7, 1, 10, STEEL[3]); px.hline(1, 7, 10, STEEL[4]);
    px.rect(1, 1, 6, 9, PAPER[0]);
    px.vline(6, 1, 9, PAPER[2]); px.hline(1, 6, 9, PAPER[2]);
    // two vertical lines of print and a small family crest
    px.vline(4, 2, 7, C('#4a4650')); px.vline(2, 3, 6, C('#7a7680'));
    px.set(4, 4, PAPER[1]);
    // glare across the plastic
    px.set(1, 6, C('#ffffff')); px.set(2, 5, C('#ffffff')); px.set(3, 4, mix(PAPER[0], C('#ffffff'), 0.6));
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 20);
  });

  // ---- old white enamel nameplate: 青木 (Aoki), chipped (1x1 wall) ----
  def('nameplate_enamel', () => {
    const px = new G.PX(9, 19);
    const E = R('#f4f4ee', '#e4e4dc', '#cacac2', '#a2a29c', '#7a7a76');
    vsteps(px, 0, 0, 9, 19, [E[0], E[1], E[1], E[1], E[2]]);
    px.vline(0, 1, 17, E[0]); px.vline(8, 1, 17, E[3]); px.hline(1, 8, 18, E[3]);
    // rounded corners
    px.set(0, 0, 0); px.set(8, 0, 0); px.set(0, 18, 0); px.set(8, 18, 0);
    // fine blue-black border line
    const B = C('#3a4660');
    px.hline(2, 6, 1, B); px.hline(2, 6, 17, B); px.vline(1, 2, 16, B); px.vline(7, 2, 16, B);
    // 青 over 木 in black enamel
    const K = C('#18161c');
    px.stamp(['..#..', '#####', '..#..', '.###.', '.#.#.', '.###.', '.#.#.', '.#..#'], { '#': K }, 2, 3);
    px.stamp(['..#..', '#####', '.###.', '#.#.#', '..#..'], { '#': K }, 2, 12);
    // screw heads
    px.set(4, 0, STEEL[2]); px.set(4, 18, STEEL[3]);
    // chips knocked out of the enamel: dark iron, a halo of rust
    px.set(8, 6, C('#26242a')); px.set(8, 7, C('#26242a')); px.set(7, 7, RUST[2]); px.set(8, 8, RUST[3]);
    px.set(0, 14, C('#26242a')); px.set(1, 15, C('#26242a')); px.set(0, 15, RUST[2]); px.set(0, 16, RUST[3]);
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 21);
  });

  // ---- plug-in nightlight on the dado: the save point (1x1 wall, frames 4) ----
  // a scallop-shell shade glowing from a little bulb at its base, plugged into the upper outlet of a
  // double socket; the warm light breathes (0, 1, 2, 1) and loops without a jump
  const SHELL = ['...####...', '..######..', '.########.', '##########', '##########', '.########.', '..######..'];
  def('nightlight', () => frames(4, (k) => {
    const px = new G.PX(16, 17);
    const lvl = [0, 1, 2, 1][k];
    // double socket plate (cream bakelite); the lower outlet shows two slots
    const P = CREAM;
    px.rect(4, 0, 8, 16, P[1]);
    px.hline(4, 11, 0, P[0]); px.vline(4, 1, 15, P[0]); px.vline(11, 1, 15, P[3]); px.hline(5, 11, 15, P[3]);
    px.set(7, 1, P[3]); px.set(8, 1, P[4]);
    px.set(6, 12, P[4]); px.set(6, 13, P[4]); px.set(9, 12, P[4]); px.set(9, 13, P[4]);
    px.set(7, 14, P[3]); px.set(8, 14, P[4]);
    // the shell
    px.stamp(SHELL, { '#': GLOW[3] }, 3, 2);
    px.set(3, 4, GLOW[4]); px.set(12, 4, GLOW[4]);
    // ribs fanning out from the base
    for (const [x1, y1] of [[4, 5], [6, 3], [9, 3], [11, 5]]) px.line(x1 < 8 ? 7 : 8, 8, x1, y1, GLOW[2]);
    // the glow: brightest just above the base, rising with the pulse
    const lit = [[7, 7, 0], [8, 7, 0], [7, 6, 1], [8, 6, 1], [6, 7, 1], [9, 7, 1], [6, 6, 2], [9, 6, 2], [7, 5, 2], [8, 5, 2]];
    for (const [x, y, need] of lit) if (need <= lvl + 1) px.set(x, y, need === 0 || (need === 1 && lvl === 2) ? GLOW[0] : GLOW[1]);
    // cooler rim where the shell thins out, and its lit lip
    px.set(3, 5, GLOW[4]); px.set(3, 6, GLOW[4]); px.set(12, 5, GLOW[4]); px.set(12, 6, GLOW[4]); px.set(4, 7, GLOW[4]); px.set(11, 7, GLOW[4]);
    px.hline(5, 10, 8, GLOW[1]); px.set(5, 8, GLOW[2]); px.set(10, 8, GLOW[2]);
    // the plug body under the lip
    px.hline(6, 9, 9, C('#ece6d6')); px.set(9, 9, C('#c8c0ae'));
    px.outline(C('#4a2410'));
    // warm light on the wall around it, breathing
    halo(px, 8, 6, 7.5 + lvl * 0.7, 6.5 + lvl * 0.6, '#ffb45a', 0.2 + lvl * 0.07);
    spill(px, 8, 11, 4.5, 4.5, C('#ffcf8a'), 0.16 + lvl * 0.06);
    return wallF(px, 32);
  }), 4);

  // ---- fluorescent tube fixture at the top of the wall (1x1 wall, frames 3; frame 2 dark) ----
  def('fluoro', () => frames(3, (k) => {
    const px = new G.PX(16, 10);
    // painted steel channel
    px.rect(1, 0, 14, 3, C('#d8d8d0'));
    px.hline(1, 14, 0, C('#f0f0e8')); px.hline(1, 14, 2, C('#9a9a94')); px.vline(14, 0, 2, C('#a8a8a0'));
    // sockets
    px.rect(0, 2, 2, 3, C('#8a8a86')); px.rect(14, 2, 2, 3, C('#7a7a76')); px.set(0, 2, C('#b0b0aa'));
    // the tube
    const on = k !== 2, dim = k === 1;
    const core = on ? (dim ? C('#d6eaee') : C('#f6feff')) : C('#5e686c');
    const low = on ? (dim ? C('#a8c6cc') : C('#c6e6ee')) : C('#465054');
    px.hline(2, 13, 3, core); px.hline(2, 13, 4, low);
    // blackened ends of an old tube; when it drops out the filaments glow orange
    px.set(2, 3, on ? C('#8a989c') : C('#a0583a')); px.set(13, 3, on ? C('#7a868a') : C('#8a4a30'));
    px.set(2, 4, C('#4a5458')); px.set(13, 4, C('#4a5458'));
    if (dim) { px.set(9, 3, C('#bcd4da')); px.set(10, 3, C('#bcd4da')); }
    px.outline();
    if (on) {
      for (let x = 2; x <= 13; x++) px.set(x, 3, core);
      halo(px, 8, 5, 10, 5.5, dim ? '#c8ecf4' : '#e0f8ff', dim ? 0.2 : 0.32, (i, j) => j >= 5);
    }
    return wallF(px, 10);
  }), 6);

  // ---- corridor-side window: frosted glass behind a steel grille (1x1 wall) ----
  function frostedWindow(shadow) {
    const px = new G.PX(16, 20);
    // aluminium frame
    px.rect(0, 0, 16, 18, ALU[2]);
    px.hline(0, 15, 0, ALU[0]); px.vline(0, 1, 17, ALU[1]); px.vline(15, 1, 17, ALU[3]); px.hline(1, 15, 17, ALU[3]);
    // frosted glass, lit warm and dim from a lamp left on somewhere inside
    const FG = R('#e2d8b8', '#cfc4a2', '#b4aa8a', '#968e74', '#78725e');
    for (let y = 1; y <= 16; y++)
      for (let x = 1; x <= 14; x++) {
        const d = Math.hypot((x - 9.5) / 8, (y - 8) / 9) + (G.bayer(x, y) - 0.5) * 0.16;
        px.set(x, y, d < 0.4 ? FG[0] : d < 0.7 ? FG[1] : d < 0.96 ? FG[2] : FG[3]);
        if (G.hash(x, y, 33) < 0.06) px.set(x, y, mix(px.get(x, y), FG[0], 0.5));
      }
    if (shadow) {
      // a tall figure right behind the glass: cap, brim, a pale blur where the mask is, shoulders
      const S0 = C('#221f27'), S1 = C('#3a3540'), S2 = C('#6a6258'), MASK = C('#6c6870');
      const hx = 8;
      const body = (x, y) => {
        const dx = Math.abs(x + 0.5 - hx);
        if (y < 1 || y > 16 || x < 1 || x > 14) return false;
        if (y <= 3) return dx < 2.5;                 // cap crown, cut off by the frame
        if (y === 4) return dx < 3.5;                // brim
        if (y <= 8) return dx < 2.5 - (y === 8 ? 0.5 : 0);  // head
        if (y === 9) return dx < 1.5;                // neck
        return dx < 3 + (y - 10) * 2;                // shoulders sloping out of frame
      };
      for (let y = 1; y <= 16; y++)
        for (let x = 1; x <= 14; x++) {
          if (body(x, y)) {
            const rim = !(body(x - 1, y) && body(x + 1, y) && body(x, y - 1) && body(x, y + 1));
            px.set(x, y, rim ? S1 : S0);
          } else if (body(x - 1, y) || body(x + 1, y) || body(x, y + 1) || body(x, y - 1)) px.set(x, y, mix(px.get(x, y), S2, G.bayer(x, y) < 0.5 ? 0.75 : 0.45));
        }
      for (const [x, y] of [[6, 7], [7, 7], [8, 7], [9, 7], [7, 8], [8, 8]]) px.set(x, y, MASK);
      px.set(6, 6, S1); px.set(9, 6, S1);
    }
    // steel grille in front: two bars and rails, each throwing a thin shadow on the glass
    const BAR = R('#c0c6ca', '#9ea4aa', '#7e848a', '#5e6369', '#42464c');
    for (const bx of [4, 11]) {
      for (let y = 2; y <= 15; y++) px.set(bx + 1, y, mix(px.get(bx + 1, y), BAR[4], 0.35));
      px.vline(bx, 1, 16, BAR[1]);
    }
    for (let x = 2; x <= 14; x++) px.set(x, 3, mix(px.get(x, 3), BAR[4], 0.3));
    px.hline(1, 14, 2, BAR[1]); px.hline(1, 14, 15, BAR[2]);
    for (const bx of [4, 11]) { px.set(bx, 2, BAR[0]); px.set(bx, 15, BAR[1]); }
    // concrete sill with a rust drip
    px.rect(0, 18, 16, 2, CONC[1]); px.hline(0, 15, 18, CONC[0]); px.hline(1, 15, 19, CONC[3]);
    dribble(px, 13, 19, 1, RUST);
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 21);
  }
  def('window_frosted', () => frostedWindow(false));
  def('window_frosted_shadow', () => frostedWindow(true));

  // ---- window at night, rain running down the glass (1x1 wall, frames 3) ----
  def('window_rain', () => frames(3, (k) => {
    const px = new G.PX(16, 17);
    const FR = R('#d8d0b8', '#bcb49c', '#9e967e', '#7e7862', '#5c5848'); // cream painted steel sash
    px.rect(0, 0, 16, 15, FR[2]);
    px.hline(0, 15, 0, FR[0]); px.vline(0, 1, 14, FR[1]); px.vline(15, 1, 14, FR[3]); px.hline(1, 15, 14, FR[4]);
    const inG = (x, y) => y >= 2 && y <= 12 && ((x >= 2 && x <= 6) || (x >= 9 && x <= 13));
    // night sky in clean bands, the far block of flats black against it, two lit windows
    vsteps(px, 2, 2, 12, 11, [C('#0b0f1a'), C('#0f1522'), C('#141c2c')], inG);
    for (let x = 2; x <= 13; x++) { const top = x < 5 ? 7 : x < 10 ? 9 : 6; for (let y = top; y <= 12; y++) if (inG(x, y)) px.set(x, y, C('#07090e')); }
    px.set(3, 9, C('#8a7448')); px.set(12, 8, C('#6e5c3a')); px.set(11, 10, C('#4e4230'));
    // rain beyond the glass: slanted streaks, 4px a frame over a 12px period, so the loop is seamless
    const streaks = [[3, 0], [6, 6], [10, 2], [13, 8], [12, 4], [3, 9], [5, 3], [11, 10]];
    for (const [sx, sy] of streaks)
      for (let j = 0; j < 3; j++) {
        const t = (sy + k * 4 + j) % 12, y = 1 + t, x = sx + 1 - Math.floor(t / 3);
        if (inG(x, y)) px.set(x, y, mix(px.get(x, y), C('#9aaec4'), j === 2 ? 0.7 : j === 1 ? 0.45 : 0.22));
      }
    // drops sliding down the pane: a wet trail with a bright head
    for (const [dx, d0] of [[4, 2], [11, 7], [13, 0]]) {
      for (let y = 2; y <= 12; y++) if (inG(dx, y)) px.set(dx, y, mix(px.get(dx, y), C('#3a4c66'), 0.45));
      const hy = 2 + ((d0 + k * 4) % 11);
      if (inG(dx, hy)) { px.set(dx, hy, C('#b8cce0')); if (inG(dx, hy + 1)) px.set(dx, hy + 1, C('#5a6e88')); }
    }
    // beads stuck on the glass
    for (const [x, y] of [[2, 4], [6, 6], [9, 3], [12, 11], [5, 11]]) if (inG(x, y)) px.set(x, y, C('#4e6280'));
    // meeting stiles and the crescent lock
    px.vline(7, 1, 13, FR[1]); px.vline(8, 1, 13, FR[3]);
    px.set(7, 7, GOLD[2]); px.set(8, 7, GOLD[3]);
    // sill
    px.rect(0, 15, 16, 2, FR[1]); px.hline(0, 15, 15, FR[0]); px.hline(1, 15, 16, FR[3]);
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 20);
  }), 6);

  // ---- wide window with a pale pink-gold sunrise (2x1 wall) ----
  def('window_sunrise', () => {
    const px = new G.PX(32, 19);
    const AL = R('#eceae4', '#d2d0ca', '#b4b2ac', '#94928c', '#706e6a');
    px.rect(0, 0, 32, 17, AL[2]);
    px.hline(0, 31, 0, AL[0]); px.vline(0, 1, 16, AL[1]); px.vline(31, 1, 16, AL[3]); px.hline(1, 31, 16, AL[3]);
    const inG = (x, y) => y >= 2 && y <= 14 && x >= 2 && x <= 29 && x !== 15 && x !== 16;
    vsteps(px, 2, 2, 28, 13, [C('#a2acca'), C('#bcb4cc'), C('#dab8c0'), C('#f0c4ae'), C('#f8daa8')], inG);
    // the sun just clearing the rooftops, a soft bloom around it
    spill(px, 21, 12.5, 7, 4.5, C('#fff2c8'), 0.75);
    px.disc(21, 12.5, 2.2, C('#fffbe8'));
    // thin clouds lit pink and gold from below
    for (const [x0, x1, y, c, u] of [[4, 11, 5, '#ecc8c8', '#c4b0c6'], [17, 27, 7, '#fae0c0', '#e4b8b6'], [8, 13, 9, '#f8d4b8', '#e2b4b0']])
      for (let x = x0; x <= x1; x++) {
        if (inG(x, y)) px.set(x, y, C(c));
        if (x > x0 && x < x1 - 1 && inG(x, y - 1)) px.set(x, y - 1, C(u));
      }
    // distant roofs and trees, cool violet-grey against the light
    const ridge = [12, 12, 11, 11, 11, 12, 13, 13, 12, 10, 10, 10, 12, 12, 13, 13, 13, 12, 13, 14, 14, 14, 14, 13, 12, 11, 11, 12];
    for (let x = 2; x <= 29; x++) for (let y = ridge[x - 2]; y <= 14; y++) if (inG(x, y)) px.set(x, y, y === ridge[x - 2] ? C('#8a7c94') : C('#6e6480'));
    // a few birds
    px.set(10, 6, C('#7a6c84')); px.set(11, 5, C('#7a6c84')); px.set(12, 6, C('#7a6c84'));
    px.set(25, 4, C('#8a7c94')); px.set(26, 3, C('#8a7c94')); px.set(27, 4, C('#8a7c94'));
    // mullion
    px.vline(15, 1, 15, AL[1]); px.vline(16, 1, 15, AL[3]);
    // sheer white curtains drawn back to both sides
    const CU = R('#fbf8f2', '#ece8e0', '#d6d0c6', '#b8b2a8', '#948e86');
    // gathered at a tie-back, flaring out below: vertical folds, lit on the left of each fold
    for (let y = 0; y <= 17; y++) {
      const wl = y < 8 ? 4 : y < 11 ? 3 : Math.min(6, 4 + ((y - 11) >> 1));
      for (let x = 0; x < wl; x++) {
        const f = x % 3;
        px.set(x, y, f === 0 ? CU[0] : f === 1 ? CU[1] : CU[2]);
        px.set(31 - x, y, f === 0 ? CU[1] : f === 1 ? CU[2] : CU[3]);
      }
      px.set(wl - 1, y, CU[3]); px.set(32 - wl, y, CU[3]);
    }
    px.hline(0, 3, 9, CU[3]); px.hline(28, 31, 9, CU[4]);
    // sill catching the warm light
    px.rect(0, 17, 32, 2, AL[1]); px.hline(0, 31, 17, C('#fff4dc')); px.hline(1, 31, 18, AL[3]);
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 22);
  });

  // ---- small bathroom mirror cabinet (1x1 wall) ----
  function mirrorCab(px, x, y) {
    const F = R('#eeeee8', '#d4d4cc', '#b8b8b0', '#96968e', '#74746c');
    px.rect(x, y, 12, 12, F[2]);
    px.hline(x, x + 11, y, F[0]); px.vline(x, y + 1, y + 11, F[1]); px.vline(x + 11, y + 1, y + 11, F[3]); px.hline(x + 1, x + 11, y + 11, F[4]);
    // glass reflecting the dim room: lighter at the top, a cool sheen and two glints
    vsteps(px, x + 1, y + 1, 10, 10, [C('#9cacb8'), C('#7a8a98'), C('#5c6a78'), C('#424c58')]);
    px.line(x + 2, y + 6, x + 6, y + 2, C('#c8d6de')); px.line(x + 3, y + 7, x + 7, y + 3, mix(C('#c8d6de'), C('#7a8a98'), 0.45));
    px.set(x + 9, y + 2, C('#dce6ec'));
    // glass shelf with a tooth mug
    px.hline(x, x + 11, y + 12, C('#b8c8cc')); px.hline(x + 1, x + 11, y + 13, C('#8a9aa0'));
    px.rect(x + 7, y + 9, 3, 3, C('#7aa0c8')); px.set(x + 7, y + 9, C('#a8c4e0')); px.set(x + 9, y + 11, C('#5a7aa0'));
    px.set(x + 7, y + 8, C('#e8e0d0')); px.set(x + 9, y + 7, C('#c87870')); px.set(x + 8, y + 8, C('#c87870'));
  }
  def('mirror_small', () => {
    const px = new G.PX(12, 14);
    mirrorCab(px, 0, 0);
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 19);
  });

  // ---- clocks ----
  // a pendulum swing in 6 steps (ease at the ends), loops seamlessly
  const SWING = [-2, -1, 1, 2, 1, -1];
  function clockFace(px, cx, cy, r, rim) {
    px.disc(cx, cy, r + 1, rim[2]);
    G.shadeDisc(px, cx, cy, r + 1, rim[2], rim[0], rim[3]);
    px.disc(cx, cy, r - 0.2, C('#eee4c6'));
    // face shaded under the rim at the top-left
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const d = Math.hypot(i + 0.5 - (cx - Math.floor(cx)), j + 0.5 - (cy - Math.floor(cy)));
      if (d > r - 1.4 && d < r - 0.2 && (i + j) < 0) px.tint(Math.floor(cx) + i, Math.floor(cy) + j, C('#cfc3a2'));
    }
  }
  def('wall_clock', () => frames(6, (k) => {
    const px = new G.PX(14, 23);
    const W = DWOOD;
    // pendulum case with a glass door
    px.rect(2, 11, 10, 11, W[2]);
    px.vline(2, 11, 21, W[1]); px.vline(11, 11, 21, W[3]); px.hline(2, 11, 21, W[4]); px.hline(3, 10, 22, W[3]);
    px.rect(4, 13, 6, 7, C('#1c1416'));
    px.hline(4, 9, 13, C('#100b0d'));
    // pendulum: brass rod from the pivot and a disc bob
    const s = SWING[k];
    px.line(7, 13, 7 + s, 17, GOLD[3]);
    px.set(6 + s, 18, GOLD[1]); px.set(7 + s, 18, GOLD[1]); px.set(6 + s, 19, GOLD[2]); px.set(7 + s, 19, GOLD[3]);
    px.set(6 + s, 18, GOLD[0]);
    // glass glint
    px.set(5, 14, C('#5a5458')); px.set(4, 15, C('#3e383c'));
    // round dial housing on top
    clockFace(px, 7, 6.5, 5, W);
    // hour dots and the hands at ten to midnight
    const INKC = C('#1e1a1c');
    px.set(6, 2, INKC); px.set(7, 2, INKC); px.set(11, 6, INKC); px.set(2, 6, INKC); px.set(6, 10, INKC);
    px.line(6, 6, 6, 3, INKC); px.line(6, 6, 3, 5, INKC); px.set(6, 6, C('#8a2a24'));
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 23);
  }), 6);

  def('cuckoo_clock', () => frames(6, (k) => {
    const px = new G.PX(16, 30);
    const W = DWOOD, L = WOOD;
    // carved leaves and a little bird on the crest
    px.stamp(['.....b.....', '..lL.bb.Ll.', '.lLLl..lLLl', 'lLl.....lLl'], { l: L[2], L: L[1], b: L[0] }, 2, 0);
    // pointed chalet roof
    for (let i = 0; i < 6; i++) { px.hline(7 - i, 8 + i, 3 + i, W[1]); px.set(7 - i, 3 + i, W[0]); px.set(8 + i, 3 + i, W[3]); }
    px.hline(1, 14, 8, W[4]);
    for (let i = 1; i < 5; i++) px.set(8 + i, 3 + i, W[2]);
    // house body
    px.rect(3, 9, 10, 9, W[2]); px.vline(3, 9, 17, W[1]); px.vline(12, 9, 17, W[3]); px.hline(3, 12, 17, W[4]);
    // the bird door (closed) and the dial
    px.rect(7, 9, 2, 2, W[4]); px.set(7, 9, W[3]);
    px.disc(8, 14, 3.4, L[3]);
    px.disc(8, 14, 2.6, C('#efe6cc'));
    px.set(6, 12, C('#d6caa8')); px.set(7, 12, C('#d6caa8'));
    px.set(8, 12, C('#5a4a3a')); px.set(10, 14, C('#5a4a3a')); px.set(8, 16, C('#5a4a3a')); px.set(6, 14, C('#5a4a3a'));
    px.set(8, 13, C('#1e1a1c')); px.set(7, 14, C('#1e1a1c')); px.set(8, 14, C('#1e1a1c'));
    // carved leaves on the sides of the body
    px.set(2, 12, L[2]); px.set(1, 13, L[1]); px.set(2, 14, L[3]); px.set(13, 12, L[2]); px.set(14, 13, L[2]); px.set(13, 14, L[3]);
    // pendulum: a carved wooden leaf on a thin rod
    const s = SWING[k];
    px.line(8, 18, 8 + s, 22, W[3]);
    px.stamp(['.L.', 'LLl', 'Lll', '.l.'], { L: L[1], l: L[3] }, 7 + s, 22);
    // chains and pine-cone weights at different heights
    for (const [cx, wy] of [[5, 24], [11, 26]]) {
      for (let y = 18; y < wy; y++) px.set(cx, y, y % 2 ? C('#8a8478') : C('#4e4a44'));
      px.stamp(['.c.', 'ccC', 'cCC', 'CCC', '.C.'], { c: RUST[2], C: RUST[3] }, cx - 1, wy);
      px.set(cx - 1, wy + 1, RUST[1]);
    }
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 31);
  }), 6);

  // =====================================================================
  //  TATAMI ROOM AND GENKAN
  // =====================================================================
  // a 3/4 box: top face (lit, its front lip brightest) over a front face (left lit, right/bottom shaded)
  function box34(px, x, y, w, h, topH, T, F) {
    px.rect(x, y, w, topH, T[1]);
    px.hline(x, x + w - 1, y, T[2]);
    px.hline(x, x + w - 1, y + topH - 1, T[0]);
    px.vline(x, y, y + topH - 1, T[1]);
    px.rect(x, y + topH, w, h - topH, F[2]);
    px.hline(x, x + w - 1, y + topH, F[3]);
    px.vline(x, y + topH + 1, y + h - 1, F[1]);
    px.vline(x + w - 1, y + topH, y + h - 1, F[3]);
    px.hline(x, x + w - 1, y + h - 1, F[4]);
  }
  const LWOOD = R('#d0aa78', '#b48c5c', '#967046', '#765434', '#523a24'); // light household wood

  // ---- genkan step: the raised wooden floor edge and two pairs of shoes (1x1 floor decal) ----
  def('genkan_step', () => {
    const px = new G.PX(16, 16);
    // the raised hallway floor (planks) and its front edge (agarikamachi)
    px.rect(0, 0, 16, 4, LWOOD[1]);
    px.hline(0, 15, 0, LWOOD[2]); px.set(5, 1, LWOOD[2]); px.set(6, 1, LWOOD[2]); px.set(12, 2, LWOOD[2]);
    px.hline(0, 15, 3, LWOOD[0]);
    px.rect(0, 4, 16, 3, LWOOD[3]);
    px.hline(0, 15, 4, LWOOD[2]); px.hline(0, 15, 6, LWOOD[4]);
    px.set(3, 5, LWOOD[4]); px.set(10, 5, LWOOD[2]);
    // a child's canvas sneakers, toes to the door
    const SN = R('#9ab4d8', '#6e8cbc', '#526c9a', '#3c5078', '#2a3854');
    const sneaker = (x, y) => {
      px.stamp(['.ww.', 'wbbw', 'b..b', 'bllb', 'bbbb', 'wwww', '.ww.'], { w: C('#e8e4da'), b: SN[2], l: C('#f0ece4') }, x, y);
      px.set(x + 1, y + 2, VOID2); px.set(x + 2, y + 2, C('#2a2830'));
      px.set(x, y + 3, SN[1]); px.set(x + 3, y + 4, SN[3]); px.set(x + 3, y + 5, C('#b8b2a6'));
    };
    sneaker(1, 8); sneaker(6, 9);
    // a pair of grown-up's wooden geta with dark thongs
    const geta = (x, y) => {
      px.rect(x, y, 3, 7, LWOOD[1]);
      px.vline(x, y, y + 6, LWOOD[0]); px.vline(x + 2, y + 1, y + 6, LWOOD[2]); px.hline(x, x + 2, y + 6, LWOOD[3]);
      px.set(x + 1, y + 1, C('#2a1a1c')); px.set(x, y + 2, C('#5a1e22')); px.set(x + 2, y + 2, C('#5a1e22'));
      px.set(x + 1, y + 2, LWOOD[1]);
    };
    geta(11, 8); geta(14, 8);
    px.outline();
    // shadow under the step edge onto the genkan floor, and under the shoes
    shade(px, 0, 7, 16, 1, SHADOW);
    shade(px, 0, 8, 16, 1, SHADOW2);
    return fr(px, 8, 16);
  });

  // ---- low wooden shoe cabinet (getabako) (1x1) ----
  def('shoe_cabinet', () => {
    const px = new G.PX(16, 22);
    box34(px, 0, 2, 16, 18, 5, LWOOD, R('#a07a50', '#8a6640', '#74532f', '#5a3f24', '#3e2b18'));
    const F = R('#a07a50', '#8a6640', '#74532f', '#5a3f24', '#3e2b18');
    // two doors with ventilation slats and little brass knobs
    for (const dx of [1, 8]) {
      px.rect(dx + 1, 8, 5, 10, F[2]);
      px.hline(dx + 1, dx + 5, 8, F[1]); px.vline(dx + 1, 9, 17, F[1]); px.vline(dx + 5, 9, 17, F[3]); px.hline(dx + 2, dx + 5, 17, F[3]);
      for (let y = 10; y <= 13; y += 2) px.hline(dx + 2, dx + 4, y, F[4]);
    }
    px.vline(7, 8, 17, F[4]); px.vline(8, 8, 17, F[3]);
    px.set(6, 15, GOLD[1]); px.set(9, 15, GOLD[1]); px.set(6, 16, GOLD[3]); px.set(9, 16, GOLD[3]);
    // plinth and feet
    px.rect(1, 20, 2, 2, F[4]); px.rect(13, 20, 2, 2, F[4]);
    // on top: a small dish with a key and a bud vase with a dried flower
    px.rect(2, 4, 5, 2, C('#c8c0b0')); px.hline(2, 6, 4, C('#e8e2d4')); px.set(4, 4, GOLD[1]); px.set(5, 4, GOLD[2]);
    px.rect(11, 1, 2, 4, C('#5a6a7a')); px.set(11, 1, C('#7a8c9c')); px.hline(10, 13, 5, C('#3e4a56'));
    px.set(12, 0, C('#8a7a5a')); px.set(11, 0, C('#a08a5a'));
    px.outline();
    floorShadow(px, 8, 21, 8, 1.5);
    return fr(px, 8, 22);
  });

  // ---- kotatsu: low table under a quilted check blanket (2x2) ----
  const QUILT = R('#d08850', '#b46a3a', '#96542c', '#743e22', '#522a18');
  const QCHK = C('#6a3a20'), QCHK2 = C('#e4a868');
  function kotatsu(glow) {
    const px = new G.PX(36, 32);
    const O = 2; // x margin
    const T = R('#a87a52', '#8e6440', '#764f30', '#5c3c24', '#3e2818');
    // the blanket spreading on the floor (outline of the whole quilt)
    const inQuilt = (x, y) => {
      if (y < 4 || y > 28) return false;
      const lx = x - O;
      if (lx < 0 || lx > 31) return false;
      // rounded back corners, flared front corners
      if (y < 6 && (lx < 2 - (y - 4) || lx > 29 + (y - 4))) return false;
      if (y > 26 && (lx < y - 26 || lx > 31 - (y - 26))) return false;
      return true;
    };
    for (let y = 0; y < 32; y++) for (let x = 0; x < 36; x++) if (inQuilt(x, y)) {
      const lx = x - O;
      // the hanging front drape (y 18..28) has vertical folds; the top part lies around the table
      let c = QUILT[1];
      if (y >= 19) {
        const fold = (lx + 2) % 8;
        c = fold === 0 ? QUILT[3] : fold < 3 ? QUILT[1] : fold < 6 ? QUILT[2] : QUILT[2];
        if (fold === 1) c = QUILT[0];
        if (y >= 26) c = mix(c, QUILT[3], 0.35);
      } else if (lx < 3 || lx > 28) c = lx < 3 ? QUILT[1] : QUILT[3];
      else c = QUILT[2];
      // the check pattern
      if ((lx % 6 === 3) && y >= 19) c = mix(c, QCHK, 0.55);
      if (y === 22 || y === 25) c = mix(c, QCHK, 0.45);
      if ((y < 19) && (lx % 6 === 3 || y === 8 || y === 13)) c = mix(c, QCHK, 0.45);
      if (y >= 19 && (lx % 6 === 4) && (y === 21 || y === 24)) c = QCHK2;
      px.set(x, y, c);
    }
    // the hem lit along the bottom edge, shade under the table edge
    for (let x = 0; x < 36; x++) { if (inQuilt(x, 28)) px.set(x, 28, QUILT[4]); if (inQuilt(x, 19)) px.set(x, 19, QUILT[4]); if (inQuilt(x, 20)) px.set(x, 20, mix(px.get(x, 20), QUILT[4], 0.5)); }
    // the table top board
    const bx = O + 3, by = 5, bw = 26, bh = 12;
    px.rect(bx, by, bw, bh, T[1]);
    G.woodFill(px, bx, by + 1, bw, bh - 2, T[1], T[2], T[0], 17);
    px.hline(bx, bx + bw - 1, by, T[2]);
    px.hline(bx, bx + bw - 1, by + bh - 1, T[0]);
    px.vline(bx, by, by + bh - 1, T[0]); px.vline(bx + bw - 1, by, by + bh - 1, T[2]);
    px.rect(bx, by + bh, bw, 2, T[3]); px.hline(bx, bx + bw - 1, by + bh + 1, T[4]);
    // sheen on the varnish
    px.line(bx + 3, by + 9, bx + 7, by + 2, mix(T[0], C('#f0d8b0'), 0.4));
    // a basket of mikan and a teacup
    const OR = R('#ffcc66', '#f2a03a', '#d07a22', '#a05418', '#6a3610');
    px.ellipse(bx + 16, by + 6.5, 5, 2.6, C('#8a6a3c')); px.ellipse(bx + 16, by + 6, 4, 1.8, C('#5a4426'));
    for (const [mx, my] of [[bx + 14, by + 5], [bx + 18, by + 5], [bx + 16, by + 3]]) {
      G.shadeDisc(px, mx, my, 1.9, OR[1], OR[0], OR[3]);
      px.set(Math.floor(mx), Math.floor(my) - 1, C('#4a6a2a'));
    }
    px.rect(bx + 4, by + 3, 3, 3, C('#d8d4c4')); px.hline(bx + 4, bx + 6, by + 3, C('#5a7040')); px.set(bx + 6, by + 5, C('#a8a496')); px.set(bx + 4, by + 3, C('#7a9050'));
    px.outline();
    if (glow) {
      // the heater under the table lights the hem from inside, red-orange, and spills onto the floor
      const a = glow === 2 ? 0.34 : 0.26;
      for (let x = 0; x < 36; x++) for (let y = 25; y <= 28; y++) if (inQuilt(x, y)) px.set(x, y, mix(px.get(x, y), C('#ff6a2a'), (y - 24) * (glow === 2 ? 0.09 : 0.07)));
      halo(px, 18, 29.5, 19, 3.2, '#ff5a22', a, (i, j) => j >= 28);
    }
    floorShadow(px, 18, 29.5, 17, 1.6, SHADOW2);
    return fr(px, 18, 32);
  }
  def('kotatsu', () => kotatsu(0));
  def('kotatsu_on', () => [kotatsu(1), kotatsu(2)], 2);

  // ---- futon laid out on the tatami (1x2 floor), and one with someone under it ----
  const SHEET = R('#f4f0e6', '#e2dccf', '#c8c0b0', '#a49c8c', '#7e786a');
  const FBLUE = R('#a8bcd8', '#7f98c0', '#5f78a2', '#465a80', '#30405e');
  function futon(lump) {
    const px = new G.PX(16, 32);
    // the mattress (shikibuton), thick white edge at the front
    px.rect(1, 1, 14, 29, SHEET[1]);
    px.vline(1, 2, 28, SHEET[0]); px.vline(14, 2, 28, SHEET[2]);
    px.hline(2, 13, 1, SHEET[0]);
    px.rect(1, 29, 14, 2, SHEET[2]); px.hline(2, 13, 30, SHEET[3]);
    px.set(1, 1, 0); px.set(14, 1, 0);
    // pillow (buckwheat, white cover with a blue border)
    px.rect(4, 2, 8, 5, C('#ece6d8'));
    px.hline(4, 11, 2, SHEET[0]); px.hline(4, 11, 6, SHEET[3]); px.vline(11, 3, 6, SHEET[3]);
    px.hline(5, 10, 4, C('#d6cfbe')); px.set(4, 2, 0); px.set(11, 2, 0);
    px.vline(4, 3, 5, FBLUE[1]);
    // the comforter (kakebuton): blue with a white kasuri pattern, the sheet folded back over the top
    const top = lump ? 4 : 9;
    px.rect(1, top, 14, 28 - top, FBLUE[2]);
    for (let y = top + 3; y < 27; y++) for (let x = 2; x < 14; x++) {
      if ((x + 2 * y) % 7 === 0 && y % 3 === 0) { px.set(x, y, FBLUE[0]); px.set(x + 1, y, FBLUE[1]); }
    }
    px.vline(1, top + 1, 27, FBLUE[1]); px.vline(14, top + 1, 27, FBLUE[3]);
    px.hline(1, 14, 27, FBLUE[3]); px.hline(1, 14, 28, FBLUE[4]);
    px.hline(1, 14, top, SHEET[0]); px.hline(1, 14, top + 1, SHEET[1]); px.hline(2, 13, top + 2, SHEET[3]);
    px.set(1, top, SHEET[1]); px.set(14, top, SHEET[2]); px.set(14, top + 1, SHEET[3]);
    px.outline();
    return { px: px, top: top };
  }
  def('futon', () => { const f = futon(false); return fr(f.px, 8, 32); });
  def('futon_lump', () => frames(4, (k) => {
    const f = futon(true), px = f.px;
    // the shape of someone curled up underneath, the cover pulled right over the pillow;
    // breathing: the lit ridge rises 1px and the shadow on its flank deepens (0, 1, 1, 0)
    const b = [0, 1, 1, 0][k];
    for (let y = 5; y < 27; y++) for (let x = 2; x < 14; x++) {
      const dx = (x + 0.5 - 7.6) / 5.2, dy = (y + 0.5 - 15.5 + b * 0.5) / (10.5 + b * 0.6);
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      const l = -dx * 0.75 - dy * 0.45;
      let c = px.get(x, y);
      if (l > 0.35) c = mix(c, FBLUE[0], 0.55);
      else if (l > 0.05) c = mix(c, FBLUE[1], 0.5);
      else if (l < -0.45) c = mix(c, FBLUE[4], 0.55 + b * 0.1);
      else if (l < -0.2) c = mix(c, FBLUE[3], 0.5);
      px.set(x, y, c);
    }
    // a crease where the head is, under the cover near the pillow
    px.hline(5, 9, 7 - b, mix(FBLUE[3], FBLUE[2], 0.4));
    return fr(px, 8, 32);
  }), 2);

  // ---- chabudai: round low table with a tea set (2x1) ----
  def('chabudai', () => {
    const px = new G.PX(32, 22);
    const W = R('#c08a5a', '#a46e42', '#865530', '#663e22', '#462816');
    // legs
    for (const lx of [6, 24]) { px.rect(lx, 14, 2, 6, W[3]); px.set(lx, 14, W[2]); px.vline(lx + 1, 15, 19, W[4]); }
    px.rect(15, 14, 2, 5, W[4]);
    // rim (thickness) then the top
    px.ellipse(16, 10, 14.5, 6.5, W[3]);
    px.ellipse(16, 11, 14.5, 6.5, W[4]);
    px.ellipse(16, 10, 14.5, 6.5, W[3]);
    px.ellipse(16, 9, 14.5, 6.5, W[2]);
    px.ellipse(16, 8.6, 13.5, 5.8, W[1]);
    // a soft sheen across the varnish, lit from the top-left
    for (let y = 3; y < 14; y++) for (let x = 3; x < 29; x++) {
      const dx = (x + 0.5 - 11) / 7, dy = (y + 0.5 - 6) / 2.6;
      if (dx * dx + dy * dy < 1 && px.get(x, y) === W[1]) px.set(x, y, G.bayer(x, y) < 0.5 ? W[0] : W[1]);
    }
    // tray, teapot (kyusu) with its side handle, two cups of green tea
    px.ellipse(14, 9, 6, 2.6, C('#4a2e22')); px.ellipse(14, 8.6, 5.2, 2, C('#6a4432'));
    const TP = R('#7a8a6a', '#5a6a4c', '#425038', '#2e3826', '#1e2418');
    G.shadeDisc(px, 12, 7, 2.6, TP[1], TP[0], TP[3]);
    px.hline(11, 13, 4, TP[2]); px.set(12, 3, TP[0]);
    px.line(14, 7, 17, 5, TP[2]); px.set(17, 5, TP[1]);   // the long side handle
    px.set(9, 7, TP[2]); px.set(8, 6, TP[1]);              // spout
    for (const [cx, cy] of [[17, 9], [21, 7]]) {
      px.rect(cx, cy - 1, 3, 3, C('#d8d0c0')); px.hline(cx, cx + 2, cy - 1, C('#7a9040')); px.set(cx, cy - 1, C('#9ab060'));
      px.vline(cx + 2, cy, cy + 1, C('#a49c8a'));
    }
    // a little dish of rice crackers
    px.ellipse(23, 11, 2.6, 1.3, C('#e6e0d2')); px.set(22, 10, C('#c8964e')); px.set(24, 11, C('#b07a3a')); px.set(23, 10, C('#d8a860'));
    px.outline();
    floorShadow(px, 16, 19.5, 13, 2);
    return fr(px, 16, 22);
  });

  // ---- zabuton: floor cushion (1x1 floor) ----
  def('zabuton', () => {
    const px = new G.PX(16, 14);
    const Z = R('#9a6a84', '#7c5068', '#623c52', '#4a2c3e', '#321e2a');
    // puffy square: top surface and a thick front edge
    px.rect(1, 1, 14, 10, Z[2]);
    px.rect(2, 0, 12, 1, Z[1]); px.rect(0, 2, 1, 8, Z[1]); px.rect(15, 2, 1, 8, Z[3]);
    px.rect(1, 11, 14, 2, Z[3]); px.hline(2, 13, 12, Z[4]);
    // swelling toward the middle, lit from the top-left
    for (let y = 1; y < 11; y++) for (let x = 1; x < 15; x++) {
      const dx = (x + 0.5 - 7) / 6.5, dy = (y + 0.5 - 5) / 5;
      const d = dx * dx + dy * dy;
      if (d < 0.35) px.set(x, y, Z[0]);
      else if (d < 0.8) px.set(x, y, Z[1]);
    }
    // a subtle woven pattern and the centre tufts
    for (let y = 2; y < 10; y += 3) for (let x = 2 + (y % 2); x < 14; x += 4) px.set(x, y, mix(px.get(x, y), Z[3], 0.4));
    px.set(7, 5, C('#d8c088')); px.set(8, 6, C('#d8c088')); px.set(8, 5, C('#a88a50')); px.set(7, 6, C('#a88a50'));
    // corner tassels
    px.set(1, 1, Z[1]); px.set(14, 1, Z[2]); px.set(0, 11, Z[3]); px.set(15, 11, Z[4]);
    px.outline();
    return fr(px, 8, 15);
  });

  // ---- butsudan: small black-lacquer family altar, photo, two candles (1x1, frames 2) ----
  def('butsudan', () => frames(4, (k) => {
    const px = new G.PX(18, 31);
    const L = LACQ;
    const GD = GOLD;
    // base drawer
    px.rect(1, 24, 16, 6, L[2]); px.hline(1, 16, 24, L[0]); px.vline(1, 25, 29, L[1]); px.vline(16, 25, 29, L[3]); px.hline(1, 16, 29, L[4]);
    px.hline(7, 10, 27, GD[2]); px.set(7, 27, GD[1]);
    // body
    px.rect(2, 6, 14, 18, L[2]); px.vline(2, 6, 23, L[1]); px.vline(15, 6, 23, L[3]);
    // the open doors folded back at the sides, gilt inside
    px.vline(0, 7, 23, L[1]); px.vline(1, 7, 23, GD[3]); px.vline(16, 7, 23, GD[4]); px.vline(17, 7, 23, L[3]);
    // crown
    px.rect(1, 3, 16, 3, L[1]); px.hline(0, 17, 3, L[0]); px.hline(1, 16, 5, L[3]); px.hline(2, 15, 4, GD[3]);
    px.set(8, 2, GD[2]); px.set(9, 2, GD[3]); px.set(8, 1, GD[1]);
    // the gilt interior, dark at the back
    px.rect(3, 7, 12, 16, C('#3a2c1a'));
    px.hline(3, 14, 7, C('#5a4626')); px.vline(3, 8, 22, C('#4e3c20'));
    // upper step with the photograph (a man in a dark suit, a black ribbon over the corners)
    px.hline(3, 14, 15, GD[2]); px.hline(3, 14, 16, GD[4]);
    px.rect(6, 8, 6, 7, C('#1c181c'));
    px.rect(7, 9, 4, 5, C('#9a968c')); px.rect(8, 10, 2, 2, C('#c8c2b4')); px.rect(7, 12, 4, 2, C('#4a4650')); px.set(8, 9, C('#4a4448')); px.set(9, 9, C('#4a4448'));
    px.set(6, 8, C('#000000')); px.set(11, 8, C('#000000')); px.set(7, 8, C('#2a2a2a'));
    // lower step: incense burner with a stick, the bell on its cushion, the candles
    px.hline(3, 14, 22, GD[3]);
    px.rect(8, 19, 3, 3, GD[2]); px.hline(8, 10, 19, GD[0]); px.set(10, 21, GD[4]);
    px.vline(9, 16, 18, C('#6a4a3a')); px.set(9, 16, C('#ff8a4a'));
    px.rect(12, 20, 2, 2, C('#8a2a2a')); px.set(12, 19, GD[1]); px.set(13, 19, GD[3]);
    for (const cx of [4, 14]) {
      px.vline(cx, 18, 21, C('#f2ece0')); px.set(cx, 21, C('#c8c0b0'));
      // flames flicker: a tall flame leaning one way, then the other
      const lean = [0, 1, 0, -1][(k + (cx > 8 ? 1 : 0)) % 4];
      px.set(cx, 17, GLOW[1]); px.set(cx + (lean > 0 ? 1 : lean < 0 ? -1 : 0), 16, GLOW[2]);
      if (lean === 0) px.set(cx, 15, GLOW[3]);
      px.set(cx, 17, GLOW[0]);
    }
    // a thread of incense smoke wandering up
    const sw = [0, 1, 1, 0][k];
    px.set(9 + sw, 14, C('#8a8478')); px.set(9 + sw, 13, C('#6e6a62')); px.set(10 - sw, 12, C('#5a5650'));
    px.outline();
    // candlelight on the gilt
    spill(px, 4, 16, 3, 3, C('#ffd890'), 0.22);
    spill(px, 14, 16, 3, 3, C('#ffd890'), 0.22);
    floorShadow(px, 9, 30, 8, 1.3);
    return fr(px, 9, 31);
  }), 5);

  // ---- 1970s wooden CRT television on legs (1x1), and the same showing static (frames 3) ----
  function tv(k) {
    const px = new G.PX(16, 28);
    const W = R('#9a6e46', '#7e5634', '#664226', '#4c301a', '#321e10');
    // rabbit-ear antenna
    px.line(8, 5, 3, 0, C('#a8aeb4')); px.line(9, 5, 14, 1, C('#8a9096'));
    px.set(3, 0, C('#d8dce0')); px.set(14, 1, C('#d8dce0'));
    px.rect(7, 5, 3, 2, C('#2a2a2e')); px.set(7, 5, C('#4a4a50'));
    // cabinet: top face then the front
    box34(px, 0, 6, 16, 15, 3, W, W);
    // the screen: rounded, a bulging dark glass
    const sx = 2, sy = 10, sw = 9, sh = 8;
    px.rect(sx - 1, sy - 1, sw + 2, sh + 2, C('#1c1a1c'));
    px.rect(sx, sy, sw, sh, C('#2c3432'));
    px.set(sx, sy, C('#1c1a1c')); px.set(sx + sw - 1, sy, C('#1c1a1c')); px.set(sx, sy + sh - 1, C('#1c1a1c')); px.set(sx + sw - 1, sy + sh - 1, C('#1c1a1c'));
    if (k === undefined) {
      vsteps(px, sx + 1, sy + 1, sw - 2, sh - 2, [C('#3e4846'), C('#323a38'), C('#262c2b')]);
      px.line(sx + 1, sy + 3, sx + 3, sy + 1, C('#6a7a78')); px.set(sx + 1, sy + 2, C('#566664'));
    } else {
      // static: light grey noise, a brighter band rolling down the picture
      const band = (k * 3) % sh;
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        if ((x === 0 || x === sw - 1) && (y === 0 || y === sh - 1)) continue;
        const h = G.hash(x + k * 17, y + k * 31, 5);
        let c = h < 0.25 ? C('#6e7270') : h < 0.55 ? C('#a2a6a4') : h < 0.85 ? C('#c4c8c6') : C('#e8ecea');
        if (y === band || y === band + 1) c = mix(c, C('#f4f8f6'), 0.5);
        if (x === 0 || y === 0 || x === sw - 1 || y === sh - 1) c = mix(c, C('#2c3432'), 0.4);
        px.set(sx + x, sy + y, c);
      }
    }
    // control panel: channel dial, volume knob, speaker grille
    px.rect(12, 10, 3, 9, W[3]);
    px.set(13, 11, C('#d8d0c0')); px.set(12, 11, C('#a8a090')); px.set(13, 12, C('#7a7268')); px.set(14, 11, C('#5a5248'));
    px.set(13, 14, C('#c8c0b0')); px.set(13, 15, C('#6a6258'));
    for (let y = 16; y <= 18; y++) px.set(13, y, y % 2 ? C('#2a1c12') : W[2]);
    // brand plate
    px.hline(4, 7, 19, GOLD[2]);
    // legs (splayed)
    px.line(2, 21, 1, 26, W[4]); px.line(13, 21, 14, 26, W[4]); px.vline(3, 21, 24, W[3]); px.vline(12, 21, 24, W[3]);
    px.outline();
    if (k !== undefined) {
      // cold grey light from the picture
      halo(px, 6.5, 14, 10, 9, '#c8d4d8', 0.14 + (k % 2) * 0.04);
      spill(px, 6.5, 14, 7, 6, C('#d8e4e8'), 0.12);
    }
    floorShadow(px, 8, 27, 7, 1);
    return fr(px, 8, 28);
  }
  def('tv_crt', () => tv());
  def('tv_static', () => frames(3, (k) => tv(k)), 10);

  // ---- black rotary phone on a little lace-covered stand (1x1), and ringing (frames 2) ----
  function phone(k) {
    const px = new G.PX(16, 27);
    const W = DWOOD;
    // the stand: a small table with a lower shelf
    px.rect(2, 13, 12, 3, W[2]); px.hline(2, 13, 13, W[1]);
    px.vline(3, 16, 25, W[3]); px.vline(12, 16, 25, W[3]); px.vline(4, 16, 25, W[4]); px.vline(13, 16, 25, W[4]);
    px.hline(3, 13, 21, W[2]); px.hline(3, 13, 22, W[4]);
    // phone directory on the shelf
    px.rect(5, 19, 6, 2, C('#b8a878')); px.hline(5, 10, 19, C('#d8c898'));
    // lace doily draped over the top, scalloped hem
    px.rect(1, 11, 14, 3, C('#ece6d8'));
    px.hline(1, 14, 11, C('#faf6ec'));
    for (let x = 1; x <= 14; x++) { px.set(x, 14, x % 2 ? C('#ece6d8') : 0); if (x % 3 === 0) px.set(x, 12, C('#c8c0b0')); }
    // the phone: black bakelite body, the dial on its sloping front
    const B = R('#5a5660', '#3a3640', '#26232a', '#18161c', '#0e0c10');
    px.rect(3, 6, 10, 6, B[2]);
    px.hline(4, 11, 5, B[1]); px.vline(3, 6, 11, B[1]); px.vline(12, 6, 11, B[3]); px.hline(3, 12, 11, B[4]);
    px.set(4, 6, B[0]);
    // dial: a ring of finger holes around a white label
    px.disc(8, 8.5, 2.6, C('#2e2b32'));
    for (const [x, y] of [[6, 7], [7, 6], [9, 6], [10, 7], [10, 9], [6, 9], [7, 10]]) px.set(x, y, C('#8a8690'));
    px.set(8, 8, C('#e8e2d4')); px.set(8, 9, C('#c8c0b0'));
    // the handset on its cradle; when ringing it jumps and rattles
    const lift = k === undefined ? 0 : k === 0 ? 2 : 1;
    const tilt = k === undefined ? 0 : k === 0 ? 1 : -1;
    const hy = 3 - lift;
    px.set(4, 5, B[3]); px.set(11, 5, B[3]); // cradle prongs
    for (let x = 2; x <= 13; x++) {
      const y = hy + (tilt > 0 ? (x < 6 ? 0 : x < 10 ? 0 : 1) : tilt < 0 ? (x < 6 ? 1 : 0) : 0);
      px.set(x, y, x === 2 ? B[1] : B[2]);
      px.set(x, y + 1, (x < 4 || x > 11) ? B[3] : 0);
      if (x === 2 || x === 13) px.set(x, y + 1, B[3]);
    }
    px.set(3, hy + (tilt < 0 ? 1 : 0), B[0]);
    // coiled cord running down the side
    for (let y = 9; y <= 16; y++) px.set(14 + (y % 2), y, C('#1e1c22'));
    if (k !== undefined) {
      // the bell rattling: little shake marks either side
      const m = C('#e8e0c8');
      if (k === 0) { px.set(0, 4, m); px.set(1, 3, m); px.set(15, 6, m); px.set(14, 7, m); }
      else { px.set(0, 6, m); px.set(1, 7, m); px.set(15, 3, m); px.set(14, 2, m); }
    }
    px.outline();
    floorShadow(px, 8, 26, 7, 1);
    return fr(px, 8, 27);
  }
  def('phone', () => phone());
  def('phone_ring', () => [phone(0), phone(1)], 10);

  // ---- kerosene heater with its orange glow window (1x1, frames 2) ----
  def('heater', () => frames(4, (k) => {
    const px = new G.PX(16, 25);
    const E = R('#e2e0d6', '#c6c4ba', '#a6a49a', '#86847a', '#62605a'); // cream enamel
    // base ring (the tank), wider
    px.rect(1, 19, 14, 4, C('#5a5a60')); px.hline(1, 14, 19, C('#7a7a80')); px.hline(2, 14, 22, C('#3a3a40')); px.vline(14, 20, 22, C('#46464c'));
    px.set(11, 20, C('#e8d070')); px.set(12, 20, C('#2a2a2e'));   // fuel gauge
    // the cylinder
    px.rect(2, 7, 12, 12, E[2]);
    for (let y = 7; y < 19; y++) { px.set(2, y, E[1]); px.set(3, y, E[0]); px.set(4, y, E[1]); px.set(12, y, E[3]); px.set(13, y, E[4]); }
    // the glowing chimney window: a ring of flame behind a grid of bars
    const flick = [0, 1, 2, 1][k];
    for (let y = 9; y <= 15; y++) for (let x = 4; x <= 11; x++) {
      const edge = x === 4 || x === 11;
      let c = y < 11 ? GLOW[3] : y < 14 ? GLOW[2] : GLOW[1];
      if ((x + y + flick) % 5 === 0 && y > 10) c = GLOW[1];
      if (y === 14 && (x + flick) % 3 === 0) c = GLOW[0];
      if (edge) c = GLOW[4];
      px.set(x, y, c);
    }
    for (const bx of [6, 9]) px.vline(bx, 9, 15, C('#5a3a2a'));
    px.hline(4, 11, 12, C('#6a4030'));
    // top grille plate and handle
    px.ellipse(8, 7, 6, 2, E[1]); px.ellipse(8, 7, 4.5, 1.2, C('#4a4a50'));
    for (const x of [5, 7, 9, 11]) px.set(x, 7, C('#2a2a30'));
    px.line(3, 6, 4, 2, C('#4a4a50')); px.line(12, 6, 11, 2, C('#4a4a50')); px.hline(4, 11, 1, C('#5a5a62')); px.hline(5, 10, 1, C('#7a7a84'));
    px.outline();
    // warm light on the floor in front and on the enamel around the window
    spill(px, 8, 13, 6, 5, C('#ffb060'), 0.18 + flick * 0.04);
    halo(px, 8, 22, 9 + flick * 0.5, 3, '#ff9a40', 0.2 + flick * 0.04, (i, j) => j >= 22);
    floorShadow(px, 8, 23.5, 7, 1, SHADOW2);
    return fr(px, 8, 25);
  }), 6);
})(window.G);
