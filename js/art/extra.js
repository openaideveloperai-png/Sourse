// Second batch of sprites (docs/ART_LIST.md section D): puzzle props, hiding spots, scares and
// close-up pictures added after the design review.
// Same conventions as danchi.js: light from the top-left, ramps are [highlight, light, base,
// shade, deep] unless noted, px.outline() last, anchor = bottom-centre of the footprint. Wall
// props are anchored on the floor line: wall-local y 0 is the top of the 32px wall face, y 32 the
// floor (wallF below does the maths).
(function (G) {
  'use strict';
  const C = G.C, def = G.defSprite, mix = G.mix;
  const dk = G.darken, lt = G.lighten;
  const R = function () { return Array.prototype.map.call(arguments, (h) => C(h)); };

  // ---------------- palettes ----------------
  const PAINT = R('#c9d4c2', '#abbaa9', '#91a294', '#748679', '#57665d'); // pale green-grey door paint
  const STEEL = R('#c8ccd0', '#a6acb2', '#888e96', '#6a7078', '#4a4f57');
  const CHROME = R('#f6f8f6', '#d0d6d8', '#9ca4aa', '#6c727a', '#464b52');
  const CONC = R('#9c9ea0', '#84868a', '#6e7074', '#585a5e', '#424448');
  const PAPER = R('#f4f0e6', '#e2ddd0', '#c8c2b2', '#a8a292', '#857f70');
  const WOOD = R('#c49e6c', '#a47e52', '#866240', '#684a31', '#4a3423');
  const DWOOD = R('#7c5a40', '#604430', '#4a3426', '#36261c', '#241912');
  const RUST = R('#c48252', '#9e5c36', '#7a4428', '#58311d', '#3c2215');
  const GOLD = R('#fae49c', '#dcb464', '#b48c42', '#88662e', '#5c441e');
  const CHAIN = R('#d4d8dc', '#a8adb4', '#7c8188', '#585c62', '#383b40');
  const CARDI = R('#b08a66', '#94704f', '#7a5a42', '#5a4232', '#3e2c20'); // old Haru's brown cardigan
  const VOID = C('#09080d'), VOID2 = C('#141219');
  const SHADOW = C('#0a0612', 0.42), SHADOW2 = C('#0a0612', 0.22);
  const INK = C('#2a272e');

  // ---------------- 3x5 pixel font (same glyphs as danchi.js) ----------------
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
    ':': '.|#|.|#|.', '!': '.#.|.#.|.#.|...|.#.',
  };
  const FONT = {};
  for (const k in F3) FONT[k] = F3[k].split('|');
  // sp: width of a space (default 3)
  const textW = (s, sp) => { let w = 0; for (const ch of String(s)) w += ch === ' ' ? (sp || 3) : (FONT[ch] ? FONT[ch][0].length : 3) + 1; return Math.max(0, w - 1); };
  function text(px, s, x, y, col, sp) {
    for (const ch of String(s)) {
      if (ch === ' ') { x += sp || 3; continue; }
      const g = FONT[ch];
      if (g) g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') px.set(x + i, y + j, col); });
      x += (g ? g[0].length : 3) + 1;
    }
  }
  // the big 5x7 font from core.js (G.glyphs), drawn into a buffer
  function text5(px, s, x, y, col) {
    for (const ch of String(s)) {
      const g = G.glyphs[ch];
      if (!g) { x += 4; continue; }
      g.rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') px.set(x + i, y + j, col); });
      x += g.w + 1;
    }
  }

  // ---------------- helpers ----------------
  // pick from a dark->light colour list by value v in [0,1], ordered-dithered between steps
  function rampAt(cols, v, x, y) {
    const n = cols.length - 1;
    const t = G.clamp(v, 0, 1) * n;
    const i = Math.floor(t), f = t - i;
    return i >= n ? cols[n] : f > G.bayer(x, y) ? cols[i + 1] : cols[i];
  }
  function bevel(px, x, y, w, h, r) {
    px.rect(x, y, w, h, r[2]);
    px.hline(x, x + w - 1, y, r[0]);
    px.vline(x, y + 1, y + h - 1, r[1]);
    px.vline(x + w - 1, y + 1, y + h - 1, r[3]);
    px.hline(x + 1, x + w - 1, y + h - 1, r[4]);
  }
  function sunk(px, x, y, w, h, r, fill) {
    px.rect(x, y, w, h, fill === undefined ? r[3] : fill);
    px.hline(x, x + w - 1, y, r[4]);
    px.vline(x, y, y + h - 1, r[4]);
    px.hline(x + 1, x + w - 1, y + h - 1, r[1]);
    px.vline(x + w - 1, y + 1, y + h - 1, r[2]);
  }
  // dithered vertical blend through colours over rows y..y+h-1 (mask: only already-drawn pixels)
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
  function grime(px, x, y, w, h, col, amt, thr, seed, sx, sy) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const c = px.get(x + i, y + j);
        if (!(c >>> 24)) continue;
        const n = G.vnoise((x + i) / (sx || 3), (y + j) / (sy || 4), seed || 1);
        if (n > thr + G.bayer(x + i, y + j) * 0.12) px.set(x + i, y + j, mix(c, col, amt));
      }
  }
  function dribble(px, x, y, len, r) {
    for (let j = 0; j < len; j++) px.set(x, y + j, j < 1 ? r[3] : j < len - 1 ? r[2] : r[1]);
    px.set(x + 1, y, r[3]);
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
  function floorShadow(px, cx, cy, rx, ry, col) {
    shade(px, Math.floor(cx - rx - 1), Math.floor(cy - ry - 1), Math.ceil(rx * 2 + 3), Math.ceil(ry * 2 + 3), col || SHADOW, (i, j) => {
      const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry;
      return dx * dx + dy * dy <= 1;
    });
  }
  function scratches(px, x, y, w, h, col, n, rnd) {
    for (let k = 0; k < n; k++) {
      const sx = x + rnd.int(w), sy = y + rnd.int(h), l = 1 + rnd.int(3);
      for (let i = 0; i < l; i++) if (px.get(sx + i, sy - (i >> 1))) px.set(sx + i, sy - (i >> 1), col);
    }
  }
  // darken (f > 0) or lighten (f < 0) the drawn pixels inside a rect
  function tintRect(px, x, y, w, h, f) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      const c = px.get(i, j);
      if (c >>> 24) px.set(i, j, f > 0 ? dk(c, f) : lt(c, -f));
    }
  }
  // brushed stainless: clean vertical streaks (a tone per column, a few brighter runs), lit from
  // the ceiling light so the lower third steps one tone darker. S is dark -> light.
  function brushed(px, x, y, w, h, seed, S) {
    S = S || [CHROME[3], CHROME[2], mix(CHROME[2], CHROME[1], 0.5), CHROME[1]];
    const split = Math.round(h * 0.62);
    for (let i = 0; i < w; i++) {
      const s = G.hash(x + i, 3, seed);
      const base = s < 0.22 ? 1 : s < 0.82 ? 2 : 3;
      for (let j = 0; j < h; j++) {
        let k = base;
        const d = j - split;
        if (d > 1 || (d >= -1 && G.bayer(x + i, y + j) < (d + 2) / 4)) k--;
        if (G.hash(x + i, (y + j) >> 3, seed + 5) > 0.9) k++;
        px.set(x + i, y + j, S[G.clamp(k, 0, S.length - 1)]);
      }
    }
  }
  // wall prop frame: bottom edge of the sprite sits at wall-local y `bottom` (32 = floor line)
  const wallF = (px, bottom, ax) => G.frame(px, ax === undefined ? px.w / 2 : ax, px.h + (32 - bottom));
  const fr = G.frame;
  const frames = (n, fn) => { const a = []; for (let k = 0; k < n; k++) a.push(fn(k)); return a; };
  // a timed sequence of frames: seq lists indexes into the built frames (holds and blinks)
  const seqOf = (built, seq) => seq.map((i) => built[i]);
  // padlock: (x, y) = top-left of the shackle
  function padlock(px, x, y) {
    px.hline(x + 1, x + 2, y, CHROME[1]);
    px.vline(x, y + 1, y + 2, CHROME[2]); px.vline(x + 3, y + 1, y + 2, CHROME[3]);
    bevel(px, x, y + 3, 4, 4, GOLD);
    px.set(x + 2, y + 4, GOLD[4]); px.set(x + 2, y + 5, GOLD[4]);
  }

  // =====================================================================
  //  SCARE: the Caretaker's masked face pressed into the door gap (64x48, 3 frames)
  // =====================================================================
  // Seen from inside the flat: the door is held open 10 cm by the chain. Through the gap, under
  // the cap brim: eyes lost in shadow, a white pleated surgical mask with ear loops, lit from
  // below by Haru's flashlight. The chain is taut across the mask; a long grey hand curls round
  // the edge of the door. Frames: the face pushes in, the chain shudders, the eyes shift.
  function scareGap(k) {
    const W = 64, H = 48, px = new G.PX(W, H);
    const push = [0, 1, 0][k];
    const shud = [0, 1, -1][k];
    const gl = 21, gr = 43; // visible gap: columns gl..gr
    const cx = 32.5;
    const SKIN = R('#0c0a0e', '#1c191c', '#363234', '#57534f', '#7a7570', '#9a958d'); // dark -> light
    const MASK = R('#3e3d3b', '#6a6965', '#94928c', '#bcbab3', '#dddbd4', '#f4f2ec');
    const UNI = R('#14181a', '#262c2c', '#3a4240', '#56605c', '#6e7a74');
    const CAP = R('#0e1014', '#1a1d24', '#262b33', '#343b45', '#4c5662');
    const inGap = (x) => x >= gl && x <= gr;

    // 1) the open-air corridor behind him: near black, a faint cold glow from the ceiling light
    for (let y = 0; y < H; y++) for (let x = gl; x <= gr; x++) px.set(x, y, rampAt([C('#050608'), C('#0b0e12'), C('#121820')], 0.8 - y / 40, x, y));

    // 2) uniform collar and shoulders below the chin
    for (let y = 36; y < H; y++) for (let x = gl; x <= gr; x++) {
      const dx = (x + 0.5 - cx) / 15;
      if (y < 40 + push + Math.abs(dx) * -2) continue;
      px.set(x, y, rampAt(UNI, 0.25 + (y - 40) / 18 - dx * dx * 0.5, x, y));
    }
    // shirt collar points either side of the chin
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
      px.set(Math.round(cx + s * (4 + i)), 41 + push + i, UNI[4]);
      px.set(Math.round(cx + s * (4 + i)), 42 + push + i, UNI[2]);
    }

    // 3) the head: a long pale oval, under-lit, the brow drowned in the brim's shadow
    const hy = 18 + push;
    const head = (x, y) => { const dx = (x + 0.5 - cx) / 12.6, dy = (y + 0.5 - hy) / 24; return dx * dx + dy * dy <= 1; };
    for (let y = 0; y < H; y++) for (let x = gl; x <= gr; x++) {
      if (!head(x, y)) continue;
      const dx = (x + 0.5 - cx) / 12.6;
      let v = 0.2 + (y - 10 - push) / 30 - dx * dx * 0.7;
      if (y < 17 + push) v = Math.min(v, 0.06 + (y - 9 - push) * 0.025);
      px.set(x, y, rampAt(SKIN, v, x, y));
    }
    // ear on the right edge of the gap, half hidden by the jamb
    for (let y = 14 + push; y < 23 + push; y++) { px.set(gr, y, SKIN[2]); if (y > 16 + push && y < 21 + push) px.set(gr - 1, y, SKIN[1]); }

    // eyes: hollows in the shadow, only a wet point of light in each
    const ey = 13 + push, look = [0, 0, 1][k];
    for (const ex of [cx - 6, cx + 3]) {
      const X = Math.round(ex);
      px.hline(X - 1, X + 2, ey, SKIN[0]); px.hline(X, X + 1, ey + 1, SKIN[0]);
      px.hline(X - 1, X + 2, ey - 1, SKIN[1]);
      px.set(X + look, ey, C('#4a4644'));
      px.set(X + 1 + look, ey, C('#8e8982'));
    }

    // 4) the mask
    const my0 = 18 + push, my1 = 39 + push;
    const mHW = (y) => {
      const t = (y - my0) / (my1 - my0);
      let hw = 7.6 + Math.sin(Math.PI * Math.min(1, t * 1.15)) * 1.6;
      if (t > 0.7) hw -= (t - 0.7) * 17;
      return hw;
    };
    const inMask = (x, y) => y >= my0 && y <= my1 && Math.abs(x + 0.5 - cx) <= mHW(y);
    // ear loops first: thin cords from the mask's corners back to the ears (the right ear peeks
    // out from behind the jamb, the left one is behind the door)
    for (const sgn of [-1, 1]) {
      const edge = sgn < 0 ? gl : gr - 1;
      const xt = Math.round(cx + sgn * (mHW(my0 + 1) - 0.5)), xb = Math.round(cx + sgn * (mHW(my0 + 14) - 0.5));
      px.line(xt, my0 + 1, edge, my0 - 3, MASK[3]);
      px.line(xb, my0 + 14, edge, my0 + 1, MASK[1]);
    }
    for (let y = my0; y <= my1; y++) {
      const hw = mHW(y), t = (y - my0) / (my1 - my0);
      for (let x = gl; x <= gr; x++) {
        if (!inMask(x, y)) continue;
        const ax = Math.abs(x + 0.5 - cx) / hw;
        // white cloth: bright, lit from below, rounding off at the sides; the nose lifts the top
        let v = 0.66 + t * 0.3 - ax * ax * ax * 0.55;
        if (t < 0.3) v += 0.1 * Math.max(0, 1 - ax * 3) - 0.12 * (0.3 - t) / 0.3;
        px.set(x, y, rampAt(MASK, v, x, y));
      }
    }
    // nose wire: the top edge pinched up over the nose
    px.hline(Math.round(cx - 2), Math.round(cx + 1), my0 - 1, MASK[3]);
    for (let x = gl; x <= gr; x++) if (inMask(x, my0)) px.set(x, my0, Math.abs(x + 0.5 - cx) < 3 ? MASK[5] : MASK[3]);
    // pleats: a soft fold line with a lit lip under it, curving up at the sides
    for (const p of [6, 11, 16]) {
      const y0 = my0 + p;
      for (let x = gl; x <= gr; x++) {
        const ax = Math.abs(x + 0.5 - cx) / mHW(y0);
        const y = y0 + (ax > 0.62 ? 1 : 0); // seen from below the folds bow up in the middle
        if (!inMask(x, y) || !inMask(x, y + 1)) continue;
        px.set(x, y, ax > 0.8 ? MASK[1] : MASK[2]);
        if (ax < 0.85) px.set(x, y + 1, MASK[5]);
      }
    }
    // the breath sucking the cloth in over the mouth on frame 1
    if (k === 1) for (let x = Math.round(cx - 2); x <= Math.round(cx + 1); x++) { px.set(x, my0 + 13, MASK[3]); px.set(x, my0 + 14, MASK[3]); }
    // side seams of the mask
    for (let y = my0 + 1; y < my1 - 4; y++) for (const sgn of [-1, 1]) {
      const x = Math.round(cx + sgn * (mHW(y) - 0.5) - 0.5);
      if (inGap(x) && inMask(x, y)) px.set(x, y, MASK[2]);
    }

    // 5) the cap: brim bowed toward us, crown cut off by the top of the frame
    for (let y = 0; y < 11 + push; y++) for (let x = gl; x <= gr; x++) {
      const dx = (x + 0.5 - cx) / 16;
      const brimBot = 9 + push + Math.round(1 - dx * dx * 2);
      if (y > brimBot) continue;
      let c;
      if (y >= brimBot - 2) c = y === brimBot ? CAP[3] : y === brimBot - 1 ? CAP[1] : CAP[0]; // underside, lit edge
      else c = rampAt(CAP, 0.55 - y * 0.05 - dx * dx * 0.6, x, y);
      px.set(x, y, c);
    }
    // a rim of cold corridor light across the crown and a dull cap badge
    for (let x = gl; x <= gr; x++) if (G.bayer(x, 0) < 0.6) px.set(x, 0, CAP[4]);
    px.rect(Math.round(cx) - 1, 2 + push, 3, 3, C('#5a5a50')); px.set(Math.round(cx) - 1, 2 + push, C('#8a8a78')); px.set(Math.round(cx) + 1, 4 + push, C('#2a2a26'));
    // cast shadow of the brim on the brow
    for (let x = gl; x <= gr; x++) { const y = 11 + push; if (head(x, y)) px.set(x, y, SKIN[0]); }

    // 6) the door leaf on the left (our side of it), lit by the torch toward its edge
    const DOOR = R('#0c0e0e', '#121615', '#181e1c', '#1f2725', '#283230', '#36433f');
    for (let y = 0; y < H; y++) for (let x = 0; x < gl; x++) {
      const v = 0.12 + (x / gl) * 0.42 + (y / H) * 0.12;
      px.set(x, y, rampAt(DOOR, v, x, y));
    }
    // the edge of the leaf (its thickness) catching the light
    px.vline(gl - 3, 0, H - 1, DOOR[3]); px.vline(gl - 2, 0, H - 1, PAINT[3]); px.vline(gl - 1, 0, H - 1, PAINT[4]);
    for (let y = 0; y < H; y += 1) if (G.hash(y, 5, 3) < 0.15) px.set(gl - 2, y, PAINT[2]);
    // chain slide track on the leaf
    bevel(px, 7, 25, 10, 4, [DOOR[5], DOOR[4], DOOR[3], DOOR[2], DOOR[1]]);
    px.hline(8, 15, 26, DOOR[0]);
    for (const sx of [8, 15]) px.set(sx, 27, CHROME[3]);

    // 7) the jamb and the dark genkan wall on the right
    const J = R('#0c0e0e', '#161a1a', '#222828', '#323a3a', '#4a5452');
    for (let y = 0; y < H; y++) for (let x = gr + 1; x < W; x++) {
      let c;
      if (x === gr + 1) c = J[4];
      else if (x === gr + 2) c = J[3];
      else if (x < gr + 6) c = rampAt(J, 0.55 - y / 120, x, y);
      else if (x === gr + 6) c = J[0];
      else c = rampAt([C('#060507'), C('#0d0c0e'), C('#151416')], 0.75 - (x - gr) / 30 + y / 160, x, y);
      px.set(x, y, c);
    }
    // the chain's base plate screwed into the jamb
    bevel(px, gr + 2, 26, 4, 7, [CHROME[1], CHROME[2], CHROME[3], CHROME[4], J[0]]);
    px.set(gr + 3, 27, J[1]); px.set(gr + 3, 31, J[1]);

    // 8) the hand: back of the hand in the gap, long fingers curled over the door's edge
    const HAND = R('#1e1b1d', '#3a3638', '#5a5654', '#7c7772', '#9c968e', '#b8b2a8');
    const grip = [0, 1, 0][k];
    // back of the hand coming in from outside, in front of his collar: knuckles toward the edge
    for (let y = 32; y < H; y++) for (let x = gl; x <= gl + 8; x++) {
      const w = 3 + Math.floor((y - 32) / 2.5);
      if (x > gl + Math.min(8, w)) continue;
      const v = 0.66 - (x - gl) * 0.06 - (y - 32) * 0.01;
      px.set(x, y, v > 0.52 ? HAND[3] : v > 0.36 ? HAND[2] : HAND[1]);
    }
    for (let y = 33; y < H; y++) { const x = gl + Math.min(8, 3 + Math.floor((y - 32) / 2.5)); px.set(x, y, HAND[1]); }
    for (const ty of [35, 38, 41]) { px.line(gl + 2, ty, gl + 5, ty + 4, HAND[2]); px.set(gl + 1, ty, HAND[4]); } // tendons
    const fingers = [[33, 12], [36, 14], [39, 13], [42, 10]];
    for (const [fy, len] of fingers) {
      // knuckle bending over the edge
      px.set(gl - 1, fy - 1, HAND[3]); px.set(gl, fy - 1, HAND[2]);
      px.set(gl - 1, fy, HAND[4]); px.set(gl - 1, fy + 1, HAND[3]);
      px.set(gl, fy, HAND[3]); px.set(gl, fy + 1, HAND[2]);
      for (let i = 1; i < len; i++) {
        const x = gl - 1 - i - grip;
        px.set(x, fy, i === 4 || i === 8 ? HAND[3] : HAND[4]);
        px.set(x, fy + 1, i === 4 || i === 8 ? HAND[1] : HAND[2]);
        // shadow the finger casts on the door
        const s = px.get(x + 1, fy + 2);
        if (s && !fingers.some((f) => f[0] === fy + 3 && i < f[1])) px.set(x + 1, fy + 2, DOOR[0]);
      }
      const tx = gl - len - grip;
      px.set(tx, fy, HAND[5]); px.set(tx, fy + 1, HAND[3]); // nail
      px.set(tx - 1, fy, HAND[1]); px.set(tx - 1, fy + 1, HAND[0]);
    }

    // 9) the chain, taut across the gap from the leaf track to the jamb plate
    const x0 = 15, x1 = gr + 3, cy0 = 26, cy1 = 29;
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / (x1 - x0);
      const y = Math.round(cy0 + (cy1 - cy0) * t + shud * Math.sin(Math.PI * t));
      const ph = (x - x0) % 6;
      // cast shadow first (onto the mask and the face)
      for (const yy of [y + 2, y + 3]) { const c = px.get(x + 1, yy); if (c && inGap(x + 1)) px.set(x + 1, yy, dk(c, yy === y + 2 ? 0.55 : 0.3)); }
      if (ph === 0 || ph === 3) { px.set(x, y - 1, CHAIN[ph ? 2 : 1]); px.set(x, y, CHAIN[ph ? 3 : 1]); px.set(x, y + 1, CHAIN[ph ? 4 : 3]); }
      else if (ph < 3) { px.set(x, y - 1, CHAIN[0]); px.set(x, y + 1, CHAIN[3]); px.set(x, y, dk(px.get(x, y), 0.6)); }
      else { px.set(x, y, ph === 4 ? CHAIN[0] : CHAIN[1]); px.set(x, y + 1, CHAIN[4]); }
    }

    // 10) grain and a vignette, a little different every frame
    const rnd = G.rng(311 + k * 17);
    for (let i = 0; i < 160; i++) { const x = rnd.int(W), y = rnd.int(H), c = px.get(x, y); if (c) px.set(x, y, rnd() < 0.5 ? dk(c, 0.22) : lt(c, 0.06)); }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x - 32) / 34, dy = (y - 26) / 30, d = dx * dx + dy * dy;
      if (d > 0.55) px.set(x, y, dk(px.get(x, y), Math.min(0.75, (d - 0.55) * 1.1)));
    }
    return fr(px, 32, 48);
  }
  def('scare_caretaker_gap', () => frames(3, scareGap), 12);

  // =====================================================================
  //  BUNK BED (2x2): children's wooden bunk, dark gap under the lower bunk (hiding spot)
  // =====================================================================
  def('bunk_bed', () => {
    const W = 32, H = 50, px = new G.PX(W, H);
    const B = H - 1;
    const rnd = G.rng(403);
    const BLUE = R('#8ea6c0', '#6a86a6', '#506a8a', '#3c526e', '#2a3a50');
    const BRICK = R('#a87a64', '#8a5e4a', '#6e4838', '#54362a', '#3a241c');
    const board = (x, y, w, h) => {
      G.woodFill(px, x, y, w, h, WOOD[1], WOOD[2], WOOD[0], 17 + y);
      px.hline(x, x + w - 1, y, WOOD[0]);
      px.hline(x, x + w - 1, y + h - 1, WOOD[3]);
    };
    // --- upper bunk ---
    // back guard rail (against the wall)
    board(3, 2, 26, 3);
    // mattress + blanket seen from above, pillow at the left
    px.rect(3, 5, 26, 8, BLUE[2]);
    vgrad(px, 3, 5, 26, 8, [BLUE[1], BLUE[2], BLUE[2], BLUE[3]]);
    for (let x = 3; x < 29; x += 4) px.vline(x, 6, 12, BLUE[3]); // check pattern
    px.hline(3, 28, 8, BLUE[3]);
    bevel(px, 4, 5, 7, 4, PAPER);
    px.set(5, 6, PAPER[0]);
    // folded-back top of the blanket
    px.hline(11, 28, 6, BLUE[0]); px.hline(11, 28, 7, BLUE[1]);
    // a small stuffed bear sitting by the pillow
    px.rect(13, 3, 4, 4, WOOD[2]); px.set(13, 3, WOOD[1]); px.set(16, 3, WOOD[1]);
    px.set(14, 4, VOID2); px.set(15, 5, WOOD[0]); px.rect(13, 7, 4, 2, WOOD[3]);
    // front guard rail (open at the ladder end)
    board(3, 10, 18, 2);
    px.vline(12, 12, 13, WOOD[3]);
    // upper side board
    board(0, 13, 32, 4);
    px.hline(1, 30, 14, WOOD[1]);
    // --- lower bunk, in the upper bunk's shadow ---
    px.rect(3, 17, 26, 4, C('#1a1410'));
    px.hline(3, 28, 17, C('#0e0a08'));
    for (let x = 4; x < 28; x += 5) px.set(x, 18, C('#2a201a')); // slats underneath
    px.rect(3, 21, 26, 9, BRICK[3]);
    vgrad(px, 3, 21, 26, 9, [BRICK[4], BRICK[3], BRICK[2], BRICK[2]]);
    for (let x = 5; x < 29; x += 4) for (let y = 22; y < 30; y++) if ((y + x) % 4 === 0) px.set(x, y, BRICK[3]);
    px.rect(4, 22, 7, 4, PAPER[3]); px.hline(4, 10, 22, PAPER[2]); px.hline(4, 10, 25, PAPER[4]);
    px.hline(11, 28, 24, BRICK[1]);
    // a comic book left on the lower blanket
    px.rect(18, 26, 5, 3, C('#c8b878')); px.set(18, 26, C('#e8dca0')); px.hline(19, 21, 27, C('#7a3a32')); px.set(22, 28, C('#8a7a50'));
    // lower side board
    board(0, 30, 32, 5);
    px.hline(1, 30, 31, WOOD[1]);
    // --- the gap under the lower bunk: deep dark, floor fading in at the very bottom ---
    for (let y = 35; y <= B; y++) for (let x = 3; x < 29; x++) {
      const t = (y - 35) / (B - 35);
      px.set(x, y, t < 0.75 ? VOID : G.bayer(x, y) < (t - 0.75) * 3 ? C('#1c1820') : VOID);
    }
    px.hline(3, 28, 35, C('#030205'));
    // a lost marble glinting at the mouth of the dark
    px.set(24, 47, C('#5a7a9a')); px.set(24, 46, C('#a8c8e8'));
    // --- posts (front corners), full height, rounded caps ---
    for (const x of [0, 29]) {
      px.rect(x, 1, 3, B, WOOD[2]);
      px.vline(x, 1, B, WOOD[1]); px.vline(x + 2, 1, B, WOOD[3]);
      px.hline(x, x + 2, 0, WOOD[1]); px.set(x + 1, 0, WOOD[0]);
      px.hline(x, x + 2, B, WOOD[4]);
      // bolts where the boards meet the posts
      for (const by of [14, 31]) px.set(x + 1, by + 1, WOOD[4]);
    }
    // --- ladder at the right end ---
    const L0 = 22, L1 = 27;
    for (const lx of [L0, L1]) { px.vline(lx, 9, B, WOOD[1]); px.vline(lx + 1, 9, B, WOOD[3]); }
    px.set(L0, 9, WOOD[0]); px.set(L1, 9, WOOD[0]);
    for (const ry of [20, 26, 38, 44]) { px.hline(L0 + 1, L1, ry, WOOD[0]); px.hline(L0 + 2, L1 - 1, ry + 1, WOOD[3]); }
    // scuffs and a sticker on the post
    scratches(px, 1, 18, 30, 12, WOOD[0], 2, rnd);
    px.rect(30, 20, 1, 2, C('#c8b048'));
    px.outline();
    floorShadow(px, 16, B + 0.5, 15, 1.5, SHADOW2);
    return fr(px, 16, H);
  });

  // =====================================================================
  //  LIFT CAR INTERIOR
  // =====================================================================
  // the doors seen from inside the car (2x2 wall): steel leaves, a narrow wired-glass window
  // strip in each, the dark shaft beyond, the sill and the indicator above
  def('lift_doors_in', () => {
    const px = new G.PX(32, 32);
    brushed(px, 0, 0, 32, 32, 21, [CHROME[4], CHROME[3], mix(CHROME[3], CHROME[2], 0.5), CHROME[2]]);
    // header with the floor indicator (unlit) and a dim amber arrow
    px.rect(0, 0, 32, 4, CHROME[3]); px.hline(0, 31, 0, CHROME[2]); px.hline(0, 31, 3, CHROME[4]);
    px.rect(11, 1, 10, 2, C('#121214'));
    for (let i = 0; i < 4; i++) px.set(12 + i * 2, 1, C('#3a3032'));
    px.set(19, 2, C('#a8742c')); px.set(18, 1, C('#6a4a22')); px.set(20, 1, C('#6a4a22'));
    // returns either side of the opening
    for (const [x, w] of [[0, 3], [29, 3]]) { px.vline(x, 4, 31, CHROME[x ? 3 : 2]); px.vline(x + w - 1, 4, 31, CHROME[4]); }
    // two leaves
    const leaf = (x, w, left) => {
      brushed(px, x, 4, w, 26, left ? 7 : 8);
      px.vline(x, 4, 29, left ? CHROME[1] : CHROME[2]);
      px.vline(x + w - 1, 4, 29, left ? CHROME[3] : CHROME[3]);
      px.hline(x, x + w - 1, 4, CHROME[1]);
      // kick plate, scuffed by trolleys
      px.rect(x + 1, 25, w - 2, 5, CHROME[3]); px.hline(x + 1, x + w - 2, 25, CHROME[1]); px.hline(x + 1, x + w - 2, 29, CHROME[4]);
      for (let i = 0; i < 3; i++) px.set(x + 2 + G.hash(i, x, 4) * (w - 4), 27 + (i % 2), CHROME[2]);
      // window strip: wired glass, the dark shaft, a concrete floor slab sliding past
      const wx = left ? x + w - 4 : x + 2;
      sunk(px, wx - 1, 8, 4, 15, CHROME);
      for (let y = 9; y < 22; y++) for (let i = 0; i < 2; i++) {
        let c = y < 14 ? C('#0c0d10') : y < 16 ? C('#2a2a2e') : y === 16 ? C('#3e3e44') : C('#08080a');
        if ((y + i) % 3 === 0) c = mix(c, C('#5a6066'), 0.35); // the wire mesh
        px.set(wx + i, y, c);
      }
      px.set(wx, 9, C('#5a6670'));
    };
    leaf(3, 13, true); leaf(16, 13, false);
    px.vline(15, 4, 29, CHROME[4]); px.vline(16, 4, 29, CHROME[1]);
    // finger smudges near the seam
    for (const [x, y] of [[13, 15], [14, 16], [18, 14]]) px.set(x, y, mix(px.get(x, y), C('#8a8478'), 0.4));
    // sill with its groove
    px.hline(0, 31, 30, CHROME[1]); px.hline(0, 31, 31, CHROME[3]);
    for (let x = 1; x < 31; x += 2) px.set(x, 31, CHROME[4]);
    px.outline();
    return fr(px, 16, 32);
  });

  // a brushed-steel car wall panel (1x1 wall, covers the whole 32px wall face) with a handrail.
  // Panels tile side by side: the rail runs through, a seam at each panel's right edge.
  def('lift_wall', () => {
    const px = new G.PX(16, 32);
    brushed(px, 0, 0, 16, 32, 31);
    px.vline(0, 0, 31, CHROME[1]); px.vline(15, 0, 31, CHROME[4]);
    // ceiling trim
    px.hline(0, 15, 0, CHROME[3]); px.hline(0, 15, 1, CHROME[4]);
    // handrail on two brackets, its shadow on the panel
    tintRect(px, 0, 21, 16, 2, 0.28);
    for (const bx of [3, 12]) { px.set(bx, 21, CHROME[3]); px.set(bx, 22, CHROME[4]); px.set(bx + 1, 21, CHROME[4]); }
    px.hline(0, 15, 18, CHROME[0]); px.hline(0, 15, 19, CHROME[2]); px.hline(0, 15, 20, CHROME[4]);
    for (const x of [5, 6, 10]) px.set(x, 18, CHROME[1]);
    // kick plate at the floor
    px.rect(0, 27, 16, 5, CHROME[3]);
    px.hline(0, 15, 27, CHROME[1]);
    for (let y = 28; y < 32; y++) for (let x = (y % 2); x < 16; x += 3) px.set(x, y, CHROME[4]);
    // a few fine scratches catching the light
    const rnd = G.rng(77);
    scratches(px, 1, 4, 14, 12, CHROME[0], 3, rnd);
    px.outline();
    return fr(px, 8, 32);
  });

  // =====================================================================
  //  WALL PAPERS
  // =====================================================================
  // school music poster: the eight syllables in colour, over a keyboard whose keys carry the
  // same colours (33x23, overhangs its 1x1 tile a little like a real poster)
  const SOLFA = ['DO', 'RE', 'MI', 'FA', 'SO', 'LA', 'TI', 'DO'];
  const SOLFA_C = R('#b0443a', '#c0702c', '#a08a24', '#467e40', '#2e7e80', '#4656a2', '#82469a', '#b0443a');
  def('music_chart', () => {
    const W = 33, H = 23, px = new G.PX(W, H + 1);
    const T = 1;
    px.rect(0, T, W, H, PAPER[1]);
    vgrad(px, 0, T, W, H, [PAPER[0], PAPER[1], PAPER[1], PAPER[2]]);
    px.hline(0, W - 1, T, PAPER[0]); px.vline(0, T + 1, T + H - 1, PAPER[1]);
    px.vline(W - 1, T + 1, T + H - 1, PAPER[3]); px.hline(1, W - 1, T + H - 1, PAPER[3]);
    // the syllables, two rows of four, each in its colour
    for (let i = 0; i < 8; i++) text(px, SOLFA[i], 1 + (i & 3) * 8, T + 2 + (i >> 2) * 6, SOLFA_C[i]);
    // keyboard: eight white keys (3px + 1px line) with a colour dot each, black keys on top
    const ky = T + 14;
    px.rect(0, ky - 1, W, 9, C('#3a3438'));
    for (let i = 0; i < 8; i++) {
      const x = 1 + i * 4;
      px.rect(x, ky, 3, 7, C('#fbf8f0'));
      px.hline(x, x + 2, ky + 6, PAPER[2]);
      px.vline(x + 2, ky + 4, ky + 6, PAPER[1]);
      px.set(x + 1, ky + 4, SOLFA_C[i]); px.set(x, ky + 4, SOLFA_C[i]);
      px.set(x + 1, ky + 5, dk(SOLFA_C[i], 0.3));
    }
    for (const i of [0, 1, 3, 4, 5]) { const x = 1 + i * 4 + 2; px.rect(x, ky, 3, 4, C('#1a161c')); px.set(x, ky, C('#4e4852')); }
    // masking tape at the top corners, a curled corner at the bottom right
    for (const x of [0, W - 3]) { px.rect(x, 0, 3, 2, C('#d8cc9c')); px.set(x + (x ? 0 : 2), 0, C('#e8dcac')); }
    px.set(W - 1, T + H - 1, 0); px.set(W - 2, T + H - 1, PAPER[4]); px.set(W - 1, T + H - 2, PAPER[4]);
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 26);
  });

  // a train timetable card pinned in the genkan: hours 21-23, the last train (23:40) circled
  def('timetable', () => {
    const W = 19, H = 23, px = new G.PX(W, H + 2);
    const T = 2;
    px.rect(0, T, W, H, PAPER[1]);
    vgrad(px, 0, T, W, H, [PAPER[0], PAPER[1], PAPER[2]]);
    px.hline(0, W - 1, T, PAPER[0]); px.vline(W - 1, T + 1, T + H - 1, PAPER[3]); px.hline(1, W - 1, T + H - 1, PAPER[3]);
    // header band: the line's colour with a little white printed title
    px.rect(0, T, W, 4, C('#3e6a58')); px.hline(0, W - 1, T, C('#5a8a74'));
    for (const [x, y] of [[2, 1], [3, 1], [3, 2], [5, 1], [6, 2], [7, 1], [9, 2], [10, 1], [11, 1], [11, 2], [13, 1], [14, 2], [15, 1], [16, 1]]) px.set(x, T + y, C('#e8f0e8'));
    // hour column | minutes
    px.vline(9, T + 4, T + H - 2, PAPER[3]);
    const rows = [['21', '15'], ['22', '08'], ['23', '40']];
    rows.forEach(([h, m], j) => {
      const y = T + 6 + j * 6;
      text(px, h, 1, y, INK);
      text(px, m, 11, y, j === 2 ? INK : C('#6a6670'));
      if (j < 2) px.hline(1, W - 2, y + 5, PAPER[2]);
    });
    // red pencil ring round the 40, the stroke overlapping where it started
    const rx = 5.2, ry = 4, cx = 14.5, cy = T + 18.5;
    for (let y = T + 13; y < T + H; y++) for (let x = 8; x < W; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
      if (d > 0.72 && d < 1.12 && !(dx > 0.4 && dy < -0.5 && d > 0.98)) px.set(x, y, C('#b8302a'));
    }
    px.set(17, T + 13, C('#c8443c')); px.set(18, T + 14, C('#b8302a'));
    // pushpin
    px.rect(8, 0, 3, 2, C('#4a6a9a')); px.set(8, 0, C('#8aa8d0')); px.set(10, 1, C('#2a3a5a'));
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 26);
  });

  // a wooden pillar strip with pencil marks: a child's height, birthday after birthday
  def('height_marks', () => {
    const W = 11, H = 32, px = new G.PX(W, H);
    // the post stands proud of the wall: front face x 1..7, shaded side x 8..9
    for (let y = 0; y < H; y++) for (let x = 1; x < 10; x++) {
      const n = G.vnoise(x / 1.3, y / 7, 41);
      let c = x >= 8 ? (x === 9 ? DWOOD[3] : DWOOD[2]) : n > 0.66 ? DWOOD[0] : n < 0.3 ? DWOOD[2] : DWOOD[1];
      if (x === 1) c = DWOOD[0];
      px.set(x, y, c);
    }
    px.vline(1, 0, H - 1, mix(DWOOD[0], WOOD[1], 0.4));
    // skirting at the floor
    px.rect(0, 29, W, 3, DWOOD[3]); px.hline(0, W - 1, 29, DWOOD[1]);
    // graphite marks: a line, then a tiny scribbled name/age under it (shiny grey on dark wood)
    const GR = C('#b4aea2'), GRd = C('#8a8478');
    const marks = [[25, 6, 1], [22, 5, 2], [19, 6, 3], [17, 5, 4], [14, 6, 5], [12, 5, 6], [10, 6, 7], [8, 5, 8]];
    for (const [y, len, i] of marks) {
      px.hline(1, len, y, GR);
      px.set(len + 1, y, GRd);
      // scribble: alternate between "HARU" squiggles and numbers
      const s = G.rng(i * 13);
      for (let j = 0; j < 4; j++) if (s() < 0.75) px.set(2 + j, y + 1, s() < 0.5 ? GRd : mix(DWOOD[1], GR, 0.5));
    }
    // a nail and the dark hole of a missing one
    px.set(5, 3, C('#a8a49c')); px.set(5, 4, C('#46403c'));
    px.set(4, 27, DWOOD[4]);
    px.outline();
    return wallF(px, 32, 5);
  });
})(window.G);
