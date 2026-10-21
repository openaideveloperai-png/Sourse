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
    // leaf x 1..14, y 4..31: gentle top-left light, grime toward the floor
    vgrad(px, 1, 4, 14, 28, [L[1], L[2], L[2], L[2], L[3]]);
    px.hline(1, 14, 4, L[0]);
    px.vline(1, 5, 31, L[1]);
    px.vline(2, 5, 30, mix(L[1], L[2], 0.5));
    px.vline(14, 5, 31, L[3]);
    // pressed panel seam (shallow recess around the lower half)
    px.hline(3, 12, 20, L[3]); px.hline(3, 12, 29, L[1]);
    px.vline(3, 21, 28, L[3]); px.vline(12, 21, 29, L[1]);
    // hinges on the left
    for (const hy of [7, 26]) { px.set(1, hy, JAMB[3]); px.set(1, hy + 1, JAMB[4]); px.set(2, hy, L[0]); }
    // number plate
    numberPlate(px, 2, 6, String(num));
    px.hline(3, 14, 13, L[3]);
    // peephole
    px.set(7, 15, VOID); px.set(8, 15, VOID);
    px.set(7, 14, CHROME[1]); px.set(8, 14, CHROME[2]);
    px.set(6, 15, CHROME[2]); px.set(9, 15, CHROME[3]);
    px.set(7, 16, CHROME[3]); px.set(8, 16, CHROME[4]);
    // knob + key cylinder on the right
    px.set(12, 16, CHROME[2]); px.set(12, 17, VOID2);
    knob(px, 11, 18);
    // mail slot (newspaper flap) inside the panel
    px.hline(5, 10, 22, STEEL[1]);
    px.hline(5, 10, 23, VOID);
    px.hline(5, 10, 24, STEEL[3]);
    px.set(4, 23, STEEL[2]); px.set(11, 23, STEEL[3]);
    px.hline(5, 10, 25, L[3]);
    // ventilation louvre near the floor
    for (const ly of [26, 28]) { px.hline(5, 10, ly, L[4]); px.hline(5, 10, ly + 1, L[1]); }
    // chain guard: catch plate on the jamb side, the chain hanging loose
    px.set(13, 10, CHROME[2]); px.set(14, 10, CHROME[3]);
    chainSag(px, 13, 11, 13, 15, 0, CHROME);
    px.set(12, 14, CHROME[2]);
    // wear: rust at the bottom edge and under the slot, scuffs around the knob
    for (let i = 0; i < 3; i++) dribble(px, 2 + rnd.int(11), 29 + rnd.int(2), 2, RUST);
    if (rnd() < 0.6) dribble(px, 5 + rnd.int(6), 25, 2 + rnd.int(2), RUST);
    scratches(px, 9, 17, 5, 4, L[0], 2, rnd);
    grime(px, 1, 22, 14, 10, L[4], 0.35, 0.62, +num, 3, 2);
    // door-specific touches
    if (num === '402') {
      // empty flat: flyers stuffed in the slot
      px.set(6, 22, PAPER[0]); px.set(7, 22, PAPER[1]); px.set(7, 21, PAPER[0]); px.set(8, 22, C('#e8d878'));
      px.set(9, 22, C('#c8d8e8')); px.set(6, 23, PAPER[2]); px.set(8, 23, C('#b8a860'));
    }
    if (num === '403') {
      // a second lock, newer and brighter
      px.set(11, 21, CHROME[1]); px.set(12, 21, CHROME[2]); px.set(11, 22, CHROME[3]); px.set(12, 22, VOID2);
    }
    if (rnd() < 0.5 && num !== '402') {
      // an old broadcasting-fee sticker above the knob
      px.set(11, 14 + rnd.int(2), C('#7a98b8')); px.set(12, 14, C('#d8dce0'));
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
    if (chainOn) { chainSag(px, 14, top + 6, 11, top + 12, 0, CHROME); px.set(11, top + 13, CHROME[3]); }
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
    vgrad(px, 1, top, 14, 32 - top, [L[1], L[2], L[2], L[3]]);
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
    scratches(px, 3, top + 8, 9, 12, L[0], 4, rnd);
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
  // canvas 16x36: the sign overhangs the ceiling edge by 4px
  const FIRE = R('#d2ccb8', '#b8b19c', '#9e9782', '#827b68', '#635d4e');
  function exitSign(px, x, y) {
    // housing 12x7, lit green panel with the running man heading for a doorway
    px.rect(x, y, 12, 7, C('#d8dcd8'));
    px.hline(x, x + 11, y, C('#f4f6f2'));
    px.hline(x, x + 11, y + 6, C('#9aa09c'));
    px.vline(x + 11, y + 1, y + 6, C('#aeb4b0'));
    const g = C('#2fa463'), gD = C('#1f7e4a'), w = C('#effff4');
    px.rect(x + 1, y + 1, 10, 5, g);
    px.hline(x + 1, x + 10, y + 5, gD);
    // doorway: white frame, dark green inside
    px.vline(x + 7, y + 1, y + 5, w); px.vline(x + 9, y + 1, y + 5, w); px.set(x + 8, y + 1, w);
    px.vline(x + 8, y + 2, y + 5, gD);
    // runner
    px.set(x + 4, y + 1, w);
    px.set(x + 2, y + 2, w); px.set(x + 3, y + 2, w); px.set(x + 4, y + 2, w); px.set(x + 5, y + 2, w);
    px.set(x + 3, y + 3, w);
    px.set(x + 2, y + 4, w); px.set(x + 4, y + 4, w);
    px.set(x + 1, y + 5, w); px.set(x + 5, y + 5, w);
  }
  function stairsDoor(chained) {
    const px = new G.PX(16, 36);
    const o = 4; // wall-local y 0 is canvas y 4
    jamb(px, o + 3, R('#8a8678', '#6e6a5e', '#5a564c', '#46433b', '#33302a'));
    const top = o + 5;
    const L = FIRE, rnd = G.rng(61);
    vgrad(px, 1, top, 14, 36 - top, [L[1], L[2], L[2], L[3]]);
    px.hline(1, 14, top, L[0]);
    px.vline(1, top + 1, 35, L[1]);
    px.vline(14, top + 1, 35, L[3]);
    // wired-glass window: dark stairwell behind, a faint green spill from the exit light below
    sunk(px, 5, top + 3, 6, 8, L);
    px.rect(6, top + 4, 4, 6, C('#1a2422'));
    for (let y = 0; y < 6; y++) for (let x = 0; x < 4; x++) {
      if ((x + y) % 3 === 0) px.set(6 + x, top + 4 + y, C('#3a4a46'));
      if (y > 3 && (x + y) % 2) px.set(6 + x, top + 4 + y, C('#1e3a2e'));
    }
    px.set(6, top + 4, C('#7a8e88')); px.set(7, top + 4, C('#56665f'));
    // lever + closer arm shadow at the top
    px.set(12, top + 12, CHROME[3]); px.rect(12, top + 13, 2, 2, CHROME[2]); px.set(12, top + 13, CHROME[1]);
    px.hline(9, 11, top + 14, CHROME[1]); px.hline(9, 11, top + 15, CHROME[4]);
    px.hline(9, 13, top + 1, L[4]); px.hline(10, 13, top + 2, L[3]);
    // kick plate
    px.rect(2, 31, 12, 4, STEEL[2]); px.hline(2, 13, 31, STEEL[0]); px.hline(2, 13, 34, STEEL[4]);
    scratches(px, 3, 31, 10, 3, STEEL[0], 3, rnd);
    grime(px, 1, top + 12, 14, 36 - top - 12, L[4], 0.3, 0.6, 62, 3, 2);
    dribble(px, 12, 28, 3, RUST);
    px.hline(0, 15, 35, C('#46433b'));
    // the sign
    exitSign(px, 2, 0);
    if (chained) {
      // chain looped across in an X, padlock where they cross
      chainSag(px, 1, top + 6, 14, top + 20, 1, CHROME, true);
      chainSag(px, 14, top + 6, 1, top + 20, 1, CHROME, true);
      chainSag(px, 0, top + 13, 15, top + 13, 2, CHROME, true);
      padlock(px, 6, top + 13, true);
    }
    px.outline();
    if (!chained) {
      // soft green spill under the sign (on top of the outline, translucent)
      shade(px, 1, 7, 14, 3, C('#3fd080', 0.16));
    }
    return fr(px, 8, 36);
  }
  def('door_stairs', () => stairsDoor(false));
  def('door_stairs_chained', () => stairsDoor(true));

  // ---- lobby: double glass doors, night and rain beyond (2x2: 32x32, anchor (16, 32)) ----
  const ALU = R('#d6dadc', '#b4b9bc', '#959a9e', '#767b80', '#55595e');
  function glassDoors(k, chained) {
    const px = new G.PX(32, 32);
    // outer aluminium frame
    px.rect(0, 2, 32, 30, ALU[2]);
    px.hline(0, 31, 2, ALU[0]);
    px.vline(0, 3, 31, ALU[1]);
    px.vline(31, 3, 31, ALU[3]);
    // the night outside: dark blue sky, a far sodium lamp, wet street reflections
    const panes = [[3, 5, 11, 21], [18, 5, 11, 21]];
    const night = [C('#0d1220'), C('#111a2a'), C('#16202e'), C('#1a2430'), C('#141c26')];
    for (const [gx, gy, gw, gh] of panes) {
      vgrad(px, gx, gy, gw, gh, night);
      // distant building with two lit windows
      px.rect(gx, gy + 9, gw, 6, C('#0a0e16'));
      if (gx < 10) { px.set(gx + 2, gy + 11, C('#a08850')); px.set(gx + 7, gy + 12, C('#6a5a3a')); }
      else { px.set(gx + 4, gy + 10, C('#8a7a4a')); }
      // street, wet
      px.rect(gx, gy + 15, gw, gh - 15, C('#10161e'));
      for (let x = 0; x < gw; x++) if ((x * 7 + gy) % 5 < 2) px.set(gx + x, gy + 17 + (x % 3), C('#1e2a36'));
    }
    // sodium street lamp in the right pane, its smeared reflection on the road
    px.set(25, 8, C('#ffd890')); px.set(24, 8, C('#c89a50')); px.set(26, 8, C('#c89a50')); px.set(25, 9, C('#a87a40'));
    px.vline(25, 10, 13, C('#1a1e26'));
    for (let y = 21; y < 25; y++) px.set(25 + (y & 1), y, y < 23 ? C('#8a6a3a') : C('#5a4630'));
    // rain: diagonal streaks that crawl down with k
    const rnd = G.rng(77);
    const drops = [];
    for (let i = 0; i < 16; i++) drops.push([rnd.int(32), rnd.int(26), 2 + rnd.int(3)]);
    for (const [dx, dy, l] of drops) {
      for (let j = 0; j < l; j++) {
        const y = 5 + ((dy + k * 4 + j) % 21), x = dx + Math.floor((dy + k * 4 + j) / 7);
        const inPane = (x >= 3 && x < 14) || (x >= 18 && x < 29);
        if (inPane) px.set(x, y, mix(px.get(x, y), C('#8aa0b8'), j === l - 1 ? 0.55 : 0.3));
      }
    }
    // water beads on the glass (static)
    for (let i = 0; i < 6; i++) { const x = [4, 9, 12, 19, 23, 27][i], y = [7, 14, 19, 12, 17, 22][i]; px.set(x, y, C('#4a5a6c')); }
    // reflection band across both panes
    for (let i = 0; i < 26; i++) {
      for (const off of [0, 1]) {
        const x = 3 + i + off, y = 25 - i;
        if (((x >= 3 && x < 14) || (x >= 18 && x < 29)) && y >= 5 && y < 26) px.set(x, y, mix(px.get(x, y), C('#c8d8e8'), off ? 0.12 : 0.2));
      }
    }
    // door stiles, mullions, rails
    for (const sx of [1, 14, 17, 29]) { px.rect(sx, 3, 2, 29, ALU[2]); px.vline(sx, 3, 31, ALU[1]); px.vline(sx + 1, 3, 31, ALU[3]); }
    px.vline(16, 3, 31, ALU[4]);
    px.rect(1, 3, 30, 2, ALU[2]); px.hline(1, 30, 3, ALU[1]); px.hline(1, 30, 4, ALU[3]);
    px.rect(1, 26, 30, 5, ALU[2]); px.hline(1, 30, 26, ALU[0]); px.hline(1, 30, 30, ALU[4]);
    px.hline(3, 13, 28, ALU[3]); px.hline(18, 28, 28, ALU[3]);
    // pull handles near the meeting stiles
    for (const hx of [12, 19]) { px.vline(hx, 12, 20, CHROME[1]); px.vline(hx + 1, 12, 20, CHROME[3]); px.set(hx, 11, CHROME[3]); px.set(hx, 21, CHROME[3]); }
    // a tiny brass lock cylinder at the meeting stiles
    px.set(15, 27, GOLD[1]); px.set(16, 27, GOLD[3]);
    if (chained) {
      // heavy chain wrapped through both handles, big padlock hanging
      for (const y of [13, 16]) chainSag(px, 11, y, 21, y, 2, STEEL, true);
      chainSag(px, 12, 19, 20, 19, 1, STEEL, true);
      chainSag(px, 15, 20, 15, 22, 0, STEEL);
      padlock(px, 13, 22, true);
    }
    px.hline(0, 31, 31, ALU[4]);
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
    text(px, 'B1', 4, 7, C('#d8d0b0'));
    px.set(4, 9, L[2]); px.set(9, 9, L[2]);
    px.set(5, 12, C('#a8a088'));
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
    text(px, 'B12345', 4, 4, C('#3a3032'));
    px.set(27, 5, C('#2e2628')); px.hline(26, 28, 6, C('#2e2628'));
    // a dead bulb glint
    px.set(8, 4, C('#5a4a48'));
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
    const px = new G.PX(15, 24);
    bevel(px, 0, 0, 15, 24, CHROME);
    for (let y = 1; y < 23; y++) for (let x = 1; x < 14; x++) if (G.hash(x, 2, 6) < 0.25) px.set(x, y, mix(px.get(x, y), CHROME[3], 0.3));
    const lbl = C('#3a3638');
    const btn = (x, y, s) => {
      px.rect(x - 1, y - 1, 5, 7, CHROME[3]);
      px.rect(x, y, 3, 5, C('#ece6d4'));
      px.hline(x - 1, x + 3, y - 1, CHROME[4]);
      if (s) text(px, s, x, y, lbl);
    };
    const rows = [['1', '2', '3'], ['4', '5', 'B']];
    rows.forEach((row, j) => row.forEach((s, i) => btn(2 + i * 4, 2 + j * 7, s)));
    // open <|> and close >|< icons
    const icon = (x, y, open) => {
      px.rect(x - 1, y - 1, 5, 7, CHROME[3]); px.rect(x, y, 3, 5, C('#ece6d4')); px.hline(x - 1, x + 3, y - 1, CHROME[4]);
      px.vline(x + 1, y, y + 4, lbl);
      if (open) { px.set(x, y + 2, lbl); px.set(x + 2, y + 2, lbl); }
      else { px.set(x, y + 1, lbl); px.set(x, y + 3, lbl); px.set(x + 2, y + 1, lbl); px.set(x + 2, y + 3, lbl); }
    };
    icon(2, 16, true); icon(6, 16, false);
    // keyhole for the service key
    px.rect(10, 16, 3, 5, CHROME[3]); px.set(11, 17, VOID); px.set(11, 18, VOID); px.set(11, 19, VOID2); px.hline(10, 12, 20, CHROME[1]);
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 28);
  });
})(window.G);
