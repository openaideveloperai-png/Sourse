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
})(window.G);
