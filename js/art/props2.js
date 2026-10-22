// NOBODY HOME art: props2 (names and sizes: docs/ART_LIST.md).
// Home, lobby and office props: the kitchen corner (fridge, sink, stove and kettle), the bath,
// corridor clutter (plant, umbrellas, bicycle, garbage), lobby wall pieces (notice board,
// mailboxes, the red payphone and its pink lamp), benches, moving boxes, the stair barricade,
// the tarp hiding spot and the night office (filing cabinet, desk, security monitor, toolbox).
// Same conventions as danchi.js: 5-tone ramps [0 highlight .. 4 dark], light from the top-left,
// px.outline() last, anchor = bottom-centre of the footprint.
(function (G) {
  'use strict';
  const C = G.C, def = G.defSprite, mix = G.mix, fr = G.frame;
  const R = function () { return Array.prototype.map.call(arguments, (h) => C(h)); };
  const frames = (n, fn) => { const a = []; for (let k = 0; k < n; k++) a.push(fn(k)); return a; };

  // ---------------- palettes ----------------
  const CREAM = R('#f4ecd4', '#e0d6b8', '#c6bb98', '#a39a7a', '#7a735c');
  const ENAMEL = R('#f8f8f2', '#dee0dc', '#bec2c0', '#989ea0', '#6e7478');
  const STEEL = R('#d4d8da', '#b0b6ba', '#90969c', '#6e747c', '#4c5158');
  const CHROME = R('#f6f8f6', '#d0d6d8', '#9ca4aa', '#6c727a', '#464b52');
  const MINT = R('#cfdcc8', '#b0c2aa', '#93a890', '#768a76', '#58685a');
  const LWOOD = R('#d0aa78', '#b48c5c', '#967046', '#765434', '#523a24');
  const WOOD = R('#a87a52', '#8e6440', '#764f30', '#5c3c24', '#3e2818');
  const DWOOD = R('#7c5a40', '#604430', '#4a3426', '#36261c', '#241912');
  const HINOKI = R('#e4cca4', '#ceb086', '#b2946a', '#8e7250', '#66523a');
  const OGREEN = R('#b2c0b4', '#94a498', '#7a8a7e', '#5e6c62', '#424c46');
  const KRAFT = R('#dcc290', '#c4a674', '#a8885c', '#866a46', '#604c34');
  const RED = R('#de7462', '#c24a3c', '#a0342e', '#7a2624', '#541a1a');
  const BLACK = R('#5a5660', '#3a3640', '#26232a', '#18161c', '#0e0c10');
  const RUST = R('#c48252', '#9e5c36', '#7a4428', '#58311d', '#3c2215');
  const PAPER = R('#f4f0e6', '#e2ddd0', '#c8c2b2', '#a8a292', '#857f70');
  const GOLD = R('#fae49c', '#dcb464', '#b48c42', '#88662e', '#5c441e');
  const IRON = R('#7a8088', '#5a6068', '#40454c', '#2c3036', '#1c1f24');
  const LACE = C('#f2eee2'), LACE2 = C('#d2ccbc');
  const VOID = C('#09080d'), VOID2 = C('#141219');
  const SHADOW = C('#0a0612', 0.42), SHADOW2 = C('#0a0612', 0.22);
  const TEXT = C('#3a3640');

  // ---------------- 3x5 pixel font (same glyphs as danchi.js) ----------------
  const F3 = {
    A: '.#.|#.#|###|#.#|#.#', B: '##.|#.#|##.|#.#|##.', C: '.##|#..|#..|#..|.##', D: '##.|#.#|#.#|#.#|##.',
    E: '###|#..|##.|#..|###', F: '###|#..|##.|#..|#..', G: '.##|#..|#.#|#.#|.##', H: '#.#|#.#|###|#.#|#.#',
    I: '#|#|#|#|#', J: '..#|..#|..#|#.#|.#.', K: '#.#|#.#|##.|#.#|#.#', L: '#..|#..|#..|#..|###',
    M: '#.#|###|###|#.#|#.#', N: '##.|#.#|#.#|#.#|#.#', O: '.#.|#.#|#.#|#.#|.#.', P: '##.|#.#|##.|#..|#..',
    R: '##.|#.#|##.|#.#|#.#', S: '.##|#..|.#.|..#|##.', T: '###|.#.|.#.|.#.|.#.', U: '#.#|#.#|#.#|#.#|###',
    V: '#.#|#.#|#.#|.#.|.#.', W: '#.#|#.#|###|###|#.#', X: '#.#|#.#|.#.|#.#|#.#', Y: '#.#|#.#|.#.|.#.|.#.',
    Z: '###|..#|.#.|#..|###',
    0: '###|#.#|#.#|#.#|###', 1: '.#|##|.#|.#|.#', 2: '##.|..#|.#.|#..|###', 3: '##.|..#|.#.|..#|##.',
    4: '#.#|#.#|###|..#|..#', 5: '###|#..|##.|..#|##.', 6: '.##|#..|###|#.#|###', 7: '###|..#|.#.|.#.|.#.',
    8: '###|#.#|###|#.#|###', 9: '###|#.#|###|..#|##.', '-': '..|..|##|..|..', '!': '#|#|#|.|#',
  };
  const FONT = {};
  for (const k in F3) FONT[k] = F3[k].split('|');
  const textW = (s) => { let w = 0; for (const ch of String(s)) w += (ch === ' ' ? 2 : FONT[ch] ? FONT[ch][0].length : 3) + 1; return Math.max(0, w - 1); };
  function text(px, s, x, y, col) {
    for (const ch of String(s)) {
      if (ch === ' ') { x += 3; continue; }
      const g = FONT[ch];
      if (!g) { x += 4; continue; }
      g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') px.set(x + i, y + j, col); });
      x += g[0].length + 1;
    }
  }

  // ---------------- helpers ----------------
  // a 3/4 box: top face (lit, front lip brightest) over a front face (left lit, right/bottom shaded)
  function box34(px, x, y, w, h, topH, T, F) {
    px.rect(x, y, w, topH, T[1]);
    px.hline(x, x + w - 1, y, T[2]);
    px.hline(x, x + w - 1, y + topH - 1, T[0]);
    px.rect(x, y + topH, w, h - topH, F[2]);
    px.hline(x, x + w - 1, y + topH, F[3]);
    px.vline(x, y + topH + 1, y + h - 1, F[1]);
    px.vline(x + w - 1, y + topH, y + h - 1, F[3]);
    px.hline(x, x + w - 1, y + h - 1, F[4]);
  }
  // raised panel: lit top/left edges, shaded bottom/right
  function bevel(px, x, y, w, h, r) {
    px.rect(x, y, w, h, r[2]);
    px.hline(x, x + w - 1, y, r[0]);
    px.vline(x, y + 1, y + h - 1, r[1]);
    px.vline(x + w - 1, y + 1, y + h - 1, r[3]);
    px.hline(x + 1, x + w - 1, y + h - 1, r[4]);
  }
  // vertical cylinder shading over already drawn pixels in a column band (light from the left)
  function cyl(px, x0, y0, w, h, r) {
    for (let j = y0; j < y0 + h; j++)
      for (let i = x0; i < x0 + w; i++) {
        if (!(px.get(i, j) >>> 24)) continue;
        const t = (i - x0 + 0.5) / w;
        px.set(i, j, t < 0.14 ? r[1] : t < 0.32 ? r[0] : t < 0.5 ? r[1] : t < 0.76 ? r[2] : t < 0.9 ? r[3] : r[4]);
      }
  }
  // an ellipsoid lump lit from the top-left
  function blob(px, cx, cy, rx, ry, r, test) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny > 1) continue;
        if (test && !test(x, y)) continue;
        const l = -(nx * 0.6 + ny * 0.8) + (G.bayer(x, y) - 0.5) * 0.22;
        px.set(x, y, l > 0.6 ? r[0] : l > 0.18 ? r[1] : l > -0.35 ? r[2] : l > -0.75 ? r[3] : r[4]);
      }
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
  // after outline: drop shadow of the silhouette (rows y0..y1 only) offset (dx, dy) onto empty pixels
  function drop(px, dx, dy, col, y0, y1) {
    const src = px.d.slice(), w = px.w, h = px.h;
    y0 = y0 === undefined ? 0 : y0; y1 = y1 === undefined ? h - 1 : y1;
    for (let y = y0; y <= y1; y++)
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
  // translucent glow on empty pixels (after outline)
  function halo(px, cx, cy, rx, ry, col, a, test) {
    for (let j = Math.floor(cy - ry - 1); j <= Math.ceil(cy + ry + 1); j++)
      for (let i = Math.floor(cx - rx - 1); i <= Math.ceil(cx + rx + 1); i++) {
        if (!px.in(i, j) || px.get(i, j) >>> 24) continue;
        if (test && !test(i, j)) continue;
        const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry, d = dx * dx + dy * dy;
        if (d > 1) continue;
        px.set(i, j, C(col, Math.round(a * (1 - d * 0.85) * 40) / 40));
      }
  }
  // lerp drawn pixels toward a colour within an ellipse (light spill)
  function spill(px, cx, cy, rx, ry, col, amt, test) {
    for (let j = Math.floor(cy - ry - 1); j <= Math.ceil(cy + ry + 1); j++)
      for (let i = Math.floor(cx - rx - 1); i <= Math.ceil(cx + rx + 1); i++) {
        const c = px.get(i, j);
        if (c >>> 24 !== 255) continue;
        if (test && !test(i, j)) continue;
        const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry, d = dx * dx + dy * dy;
        if (d > 1) continue;
        const t = amt * (1 - d) + (G.bayer(i, j) - 0.5) * 0.12;
        if (t > 0.02) px.set(i, j, mix(c, col, Math.min(1, t)));
      }
  }
  // soft translucent puff (steam), painted over empty or translucent pixels only
  function puff(px, cx, cy, r, a, col) {
    for (let j = Math.floor(cy - r - 1); j <= Math.ceil(cy + r + 1); j++)
      for (let i = Math.floor(cx - r - 1); i <= Math.ceil(cx + r + 1); i++) {
        if (!px.in(i, j) || px.get(i, j) >>> 24 === 255) continue;
        const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy) / r;
        if (d > 1) continue;
        const al = Math.round(a * (1 - d * d * 0.6) * 20) / 20;
        if (al <= 0.05) continue;
        const old = px.get(i, j) >>> 24;
        if (old / 255 >= al) continue;
        px.set(i, j, C(col || '#eef2f0', al));
      }
  }
  // wall prop frame: the sprite's bottom edge sits at wall-local y `bottom` (32 = floor line)
  const wallF = (px, bottom, ax) => fr(px, ax === undefined ? px.w / 2 : ax, px.h + (32 - bottom));
  // draw a part on its own layer so it gets its own dark outline, then lay it on the sprite
  function piece(px, draw) {
    const t = new G.PX(px.w, px.h);
    draw(t);
    t.outline();
    px.blit(t, 0, 0);
  }
  // outline only the outside silhouette (holes such as wheel spokes or chair frames stay clear)
  function outlineOuter(px) {
    const w = px.w, h = px.h, src = px.d.slice(), out = new Uint8Array(w * h), st = [];
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = y * w + x;
      if (out[i] || src[i] >>> 24 === 255) return;
      out[i] = 1; st.push(i);
    };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (st.length) { const i = st.pop(), x = i % w, y = (i / w) | 0; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
    const ink = C(G.INK);
    for (let i = 0; i < w * h; i++) {
      if (!out[i]) continue;
      const x = i % w, y = (i / w) | 0;
      let f = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const n = src[Y * w + X];
        if (n >>> 24 === 255) { f = n; break; }
      }
      if (f) px.d[i] = mix(f, ink, 0.78);
    }
  }
  // lace doily on a top face with a scalloped hem over the front lip
  function doily(px, x0, x1, yTop, yLip) {
    for (let y = yTop; y < yLip; y++) px.hline(x0, x1, y, LACE);
    for (let x = x0; x <= x1; x++) {
      px.set(x, yLip, (x - x0) % 2 === 0 ? LACE : LACE2);
      if ((x - x0) % 2 === 0 && x > x0 && x < x1) px.set(x, yLip + 1, LACE2);
      if ((x - x0) % 3 === 1) px.set(x, yTop + 1, LACE2);
    }
  }

  // =====================================================================
  //  KITCHEN CORNER: fridge, sink, stove (they stand side by side in 404)
  // =====================================================================
  // the counter cabinet shared by the sink and the stove (16 wide, 24 tall from oy):
  // stainless worktop rows oy+8..oy+13, steel apron, two mint-painted doors, dark toe-kick
  function counter(px, oy) {
    px.rect(0, oy + 8, 16, 6, STEEL[1]);
    px.hline(0, 15, oy + 8, STEEL[2]);
    px.hline(0, 15, oy + 13, STEEL[0]);
    px.vline(15, oy + 9, oy + 12, STEEL[2]);
    px.hline(0, 15, oy + 14, STEEL[2]); px.set(0, oy + 14, STEEL[1]); px.set(15, oy + 14, STEEL[3]);
    px.hline(0, 15, oy + 15, STEEL[4]);
    for (const dx of [1, 8]) {
      px.rect(dx, oy + 16, 7, 6, MINT[2]);
      px.hline(dx, dx + 6, oy + 16, MINT[1]); px.vline(dx, oy + 17, oy + 21, MINT[1]);
      px.vline(dx + 6, oy + 17, oy + 21, MINT[3]); px.hline(dx + 1, dx + 6, oy + 21, MINT[3]);
    }
    px.vline(0, oy + 16, oy + 23, MINT[1]); px.vline(15, oy + 16, oy + 23, MINT[4]);
    px.set(6, oy + 18, CHROME[1]); px.set(6, oy + 19, CHROME[3]);
    px.set(9, oy + 18, CHROME[1]); px.set(9, oy + 19, CHROME[3]);
    px.hline(1, 14, oy + 22, MINT[4]); px.hline(1, 14, oy + 23, VOID2);
  }

  // ---- small cream fridge with a rounded top, a chrome latch and a bowl of mikan (1x1) ----
  def('fridge_small', () => {
    const px = new G.PX(16, 30);
    const o = 3, E = CREAM;
    // top face (rounded corners) and the rolled front edge
    px.rect(1, o, 14, 3, E[1]);
    px.hline(2, 13, o, E[2]); px.set(1, o + 1, E[2]); px.set(14, o + 1, E[2]); px.set(14, o + 2, E[2]);
    px.hline(1, 14, o + 3, E[0]); px.set(14, o + 3, E[2]);
    // front: glossy enamel, highlight streak left, rounded shade right
    px.rect(1, o + 4, 14, 18, E[2]);
    px.vline(1, o + 4, o + 21, E[1]); px.vline(2, o + 4, o + 21, E[1]); px.vline(3, o + 5, o + 18, E[0]);
    px.set(3, o + 20, E[0]); px.vline(12, o + 4, o + 21, E[2]); px.vline(13, o + 4, o + 21, E[3]); px.vline(14, o + 4, o + 21, E[4]);
    px.hline(2, 12, o + 4, E[1]);
    // door gasket, chrome kick plate and the grille
    px.hline(2, 13, o + 17, E[4]); px.hline(2, 12, o + 18, E[1]);
    px.hline(1, 14, o + 19, CHROME[1]); px.set(14, o + 19, CHROME[3]); px.set(1, o + 19, CHROME[0]);
    for (let x = 2; x <= 13; x++) { px.set(x, o + 20, x % 2 ? BLACK[3] : E[3]); px.set(x, o + 21, x % 2 ? BLACK[4] : E[4]); }
    px.hline(1, 14, o + 22, E[4]);
    // feet
    px.rect(2, o + 23, 2, 2, BLACK[2]); px.rect(12, o + 23, 2, 2, BLACK[2]); px.set(2, o + 23, BLACK[1]); px.set(12, o + 23, BLACK[1]);
    // chrome latch handle and the little script badge
    px.vline(11, o + 7, o + 12, CHROME[1]); px.vline(12, o + 7, o + 12, CHROME[3]);
    px.set(11, o + 7, CHROME[0]); px.set(10, o + 9, CHROME[2]); px.set(10, o + 10, CHROME[3]); px.set(12, o + 12, CHROME[4]);
    px.hline(5, 8, o + 6, CHROME[2]); px.set(5, o + 6, CHROME[0]); px.set(8, o + 6, CHROME[3]);
    // a crayon drawing held by a red magnet
    px.rect(4, o + 9, 5, 6, PAPER[0]); px.vline(8, o + 9, o + 14, PAPER[2]); px.hline(5, 8, o + 14, PAPER[2]);
    px.set(5, o + 11, C('#e0a040')); px.set(6, o + 10, C('#e0a040')); px.set(6, o + 11, C('#f0c050')); px.set(7, o + 11, C('#e0a040'));
    px.set(5, o + 13, C('#4a6ab0')); px.set(6, o + 13, C('#4a6ab0')); px.set(7, o + 12, C('#4a6ab0'));
    px.set(6, o + 9, C('#c84838')); px.set(6, o + 8, C('#e06a58'));
    // on top: a lace doily and a blue-and-white bowl of mikan
    doily(px, 3, 12, o + 1, o + 3);
    px.hline(5, 10, o + 1, C('#6c88b8')); px.hline(5, 10, o + 2, C('#4e6a9a')); px.set(5, o + 1, C('#a8bcdc'));
    px.hline(6, 9, o + 2, C('#5a78a8')); px.set(7, o + 2, ENAMEL[1]);
    const M = R('#f6c070', '#e8983e', '#c87028', '#9a5420');
    for (const [cx, cy] of [[6.5, o - 0.2], [9.2, o - 0.1], [7.9, o - 1.6]]) {
      px.disc(cx, cy, 1.5, M[1]);
      px.set(Math.floor(cx - 0.6), Math.floor(cy - 0.6), M[0]); px.set(Math.floor(cx + 0.6), Math.floor(cy + 0.5), M[2]);
    }
    px.set(8, o - 3, C('#5a7a3a')); px.set(9, o - 3, C('#7a9a4a'));
    px.outline();
    floorShadow(px, 8, o + 25, 7.5, 1.3);
    return fr(px, 8, o + 26);
  });

  // ---- small steel sink unit: basin, wall tap, a dish rack with two plates and a cup (1x1) ----
  def('kitchen_sink', () => {
    const px = new G.PX(16, 24);
    counter(px, 0);
    // the basin sunk into the worktop: far and left inner walls in shadow, near wall lit
    px.rect(2, 9, 8, 4, STEEL[3]);
    px.hline(2, 9, 9, STEEL[4]); px.vline(2, 9, 12, STEEL[4]);
    px.hline(3, 9, 12, STEEL[2]); px.vline(9, 10, 12, STEEL[2]);
    px.set(6, 11, VOID2); px.set(5, 11, STEEL[4]); px.set(7, 11, STEEL[2]);
    px.set(4, 12, C('#d8e8f0')); px.set(3, 11, STEEL[2]);
    // tap: pipe from the wall, a T handle, the spout bent toward the basin and a drip
    px.hline(4, 7, 3, CHROME[1]); px.set(7, 3, CHROME[3]); px.set(4, 3, CHROME[0]);
    px.vline(5, 4, 8, CHROME[1]); px.vline(6, 4, 8, CHROME[3]); px.set(5, 4, CHROME[0]);
    px.set(5, 8, CHROME[2]); px.set(6, 8, CHROME[4]);
    px.set(5, 9, CHROME[2]); px.set(6, 9, CHROME[3]);
    px.set(6, 10, C('#c8dce8'));
    // dish rack: wire posts, two plates standing, an upturned teacup
    px.vline(10, 8, 12, STEEL[3]); px.vline(15, 8, 12, STEEL[3]); px.hline(10, 15, 12, STEEL[4]);
    const plate = (x, y, h) => {
      px.vline(x, y + 1, y + h - 2, ENAMEL[0]); px.vline(x + 1, y, y + h - 1, ENAMEL[1]); px.vline(x + 2, y + 1, y + h - 2, ENAMEL[3]);
      px.set(x + 1, y, C('#6a86b8')); px.set(x + 1, y + h - 1, C('#5a76a8'));
    };
    plate(10, 3, 8); plate(12, 4, 8);
    const cup = R('#f0e6cc', '#d8c8a4', '#a08860');
    px.hline(12, 14, 9, cup[0]); px.rect(12, 10, 3, 2, cup[1]); px.set(14, 10, cup[2]); px.set(14, 11, cup[2]);
    px.hline(12, 14, 10, C('#8a5a3a'));
    // a hand towel on the right door knob
    px.rect(9, 18, 4, 5, ENAMEL[1]); px.vline(9, 18, 22, ENAMEL[0]); px.vline(12, 18, 22, ENAMEL[3]);
    px.hline(9, 12, 20, C('#6a86b8')); px.hline(9, 12, 22, C('#4e6a9a')); px.hline(9, 12, 17, ENAMEL[0]);
    px.outline();
    return fr(px, 8, 24);
  });

  // ---- two-burner tabletop gas stove with an aluminium kettle; k: steaming frame ----
  function gasStove(k) {
    const px = new G.PX(16, 32);
    const oy = 8;
    counter(px, oy);
    // rubber gas hose from the wall tap
    px.set(15, oy + 6, C('#d07a6a')); px.set(15, oy + 7, C('#b05a4a')); px.set(14, oy + 7, C('#c06858'));
    // the stove: black cast-iron top with two burners, cream enamel front with two knobs, little feet
    px.rect(1, oy + 4, 14, 4, BLACK[2]);
    px.hline(1, 14, oy + 4, BLACK[1]); px.hline(1, 14, oy + 7, BLACK[1]); px.set(1, oy + 5, BLACK[1]);
    for (const bx of [4.5, 11.5]) {
      px.ellipse(bx, oy + 5.8, 2.6, 1.4, BLACK[4]);
      px.set(Math.floor(bx), oy + 5, BLACK[0]);
      px.set(Math.floor(bx) - 2, oy + 5, BLACK[0]); px.set(Math.floor(bx) + 2, oy + 6, BLACK[1]);
    }
    px.rect(1, oy + 8, 14, 3, CREAM[2]);
    px.hline(1, 14, oy + 8, CREAM[0]); px.vline(1, oy + 9, oy + 10, CREAM[1]); px.vline(14, oy + 8, oy + 10, CREAM[3]); px.hline(2, 14, oy + 10, CREAM[3]);
    for (const kx of [3, 12]) { px.set(kx, oy + 9, BLACK[1]); px.set(kx + 1, oy + 9, BLACK[3]); px.set(kx, oy + 10, BLACK[3]); px.set(kx + 1, oy + 10, BLACK[4]); }
    px.hline(6, 9, oy + 9, CHROME[2]); px.set(6, oy + 9, CHROME[0]);
    px.set(2, oy + 11, BLACK[3]); px.set(13, oy + 11, BLACK[3]);
    // the kettle on the left burner: a wide aluminium dome, black knob, arched handle, spout to the right
    const lid = k === 1 ? -1 : 0;
    const KT = R('#eef0ee', '#cdd2d4', '#a8afb4', '#80888e', '#5a6168');
    const ky = oy + 6; // kettle bottom row, sitting on the left burner
    px.stamp(['.SSSSSS.', 'SSSSSSSS', 'SSSSSSSS', 'SSSSSSSS', '.SSSSSS.'], { S: KT[2] }, 1, ky - 4);
    cyl(px, 1, ky - 4, 8, 5, KT);
    px.hline(2, 7, ky, KT[3]); px.set(1, ky - 1, KT[3]);
    px.hline(3, 6, ky - 5 + lid, KT[1]); px.set(3, ky - 5 + lid, KT[0]); px.set(6, ky - 5 + lid, KT[2]);
    px.set(4, ky - 6 + lid, BLACK[1]); px.set(5, ky - 6 + lid, BLACK[2]);
    if (lid) { px.set(3, ky - 5, VOID2); px.set(6, ky - 5, VOID2); }
    for (const [x, y] of [[2, ky - 4], [2, ky - 5], [2, ky - 6], [3, ky - 7], [4, ky - 8], [5, ky - 8], [6, ky - 7], [7, ky - 6], [7, ky - 5], [7, ky - 4]]) px.set(x, y, BLACK[2]);
    px.set(4, ky - 8, BLACK[0]); px.set(3, ky - 7, BLACK[1]);
    for (const [x, y, c] of [[9, ky - 2, KT[2]], [9, ky - 3, KT[1]], [10, ky - 3, KT[2]], [10, ky - 4, KT[1]], [11, ky - 5, KT[1]], [11, ky - 4, KT[3]], [12, ky - 6, KT[0]]]) px.set(x, y, c);
    if (k !== undefined) {
      // blue gas flame licking round the kettle bottom
      for (let x = 1; x <= 8; x++) if ((x + k) % 2 === 0) px.set(x, ky + 1, (x + k) % 4 === 0 ? C('#8ac8ff') : C('#4a7ae0'));
      px.set(1, ky, C('#4a7ae0')); px.set(8, ky, C('#4a7ae0'));
    }
    px.outline();
    if (k !== undefined) {
      // steam curling up from the spout
      for (let i = 0; i < 4; i++) {
        const t = (i + k / 3) / 4;
        const y = ky - 7 - t * 9, x = 12.6 + t * 1.2 + Math.sin(t * 6.3 + 0.4) * 1.4;
        puff(px, x, y, 0.8 + t * 1.3, 0.85 * (1 - t * 0.7));
      }
      halo(px, 4.5, ky + 1, 4, 1.6, '#6aa0ff', 0.25);
    }
    return fr(px, 8, 32);
  }
  def('gas_stove', () => gasStove());
  def('kettle_steam', () => frames(3, (k) => gasStove(k)), 6);

  // =====================================================================
  //  BATH AND WASHROOM
  // =====================================================================
  // ---- square deep tub with a board lid, a wooden pail and the gas bath heater beside it (2x1) ----
  def('bath_tub', () => {
    const px = new G.PX(32, 28);
    const AQ = R('#dcefec', '#b6d6d3', '#92b8b7', '#709496', '#526e72');
    // tub: rim (top face) rows 7..14, front rows 15..27
    px.rect(0, 7, 22, 8, AQ[1]);
    px.hline(0, 21, 7, AQ[2]); px.vline(21, 8, 14, AQ[2]); px.hline(0, 21, 14, AQ[0]);
    px.rect(0, 15, 22, 13, AQ[2]);
    px.hline(0, 21, 15, AQ[1]); px.vline(0, 16, 27, AQ[1]); px.vline(1, 17, 25, AQ[0]);
    px.vline(20, 15, 27, AQ[3]); px.vline(21, 15, 27, AQ[4]); px.hline(1, 21, 27, AQ[4]);
    px.hline(2, 19, 20, AQ[1]); px.hline(2, 19, 21, AQ[3]);
    // a rust dribble from the rim and a chip in the enamel
    px.set(17, 16, mix(AQ[2], RUST[2], 0.5)); px.set(17, 17, mix(AQ[2], RUST[2], 0.35)); px.set(17, 18, mix(AQ[2], RUST[2], 0.2));
    px.set(5, 24, AQ[4]); px.set(6, 24, AQ[3]);
    // lid: three hinoki boards laid across; a gap between the far two shows black water
    px.rect(2, 8, 18, 6, VOID2);
    const board = (y) => {
      px.hline(2, 19, y, HINOKI[1]); px.hline(2, 19, y + 1, HINOKI[2]);
      px.set(2, y, HINOKI[0]); px.set(19, y, HINOKI[2]); px.set(19, y + 1, HINOKI[3]);
      px.set(7, y + 1, HINOKI[3]); px.set(13, y, HINOKI[0]);
    };
    board(8); board(11); px.hline(2, 19, 13, HINOKI[0]); px.hline(2, 19, 12, HINOKI[2]);
    px.hline(2, 19, 10, C('#10161c')); px.set(6, 10, C('#3a4a58')); px.set(7, 10, C('#24303a')); px.set(14, 10, C('#24303a'));
    // grip dowels on the boards
    px.hline(9, 12, 8, HINOKI[3]); px.hline(9, 12, 11, HINOKI[3]);
    // a little wooden bath pail on the lid, with copper hoops
    const pail = R('#ead4ac', '#d2b68a', '#b4966c', '#8e7250', '#66523a');
    px.stamp(['.pppp.', 'pppppp', 'pppppp', 'pppppp', '.pppp.'], { p: pail[2] }, 13, 5);
    cyl(px, 13, 5, 6, 5, pail);
    px.ellipse(16, 5.2, 3, 1.2, pail[1]); px.ellipse(16, 5.3, 2, 0.6, pail[4]);
    px.hline(13, 18, 7, C('#a86a3a')); px.hline(14, 17, 9, C('#a86a3a')); px.set(13, 7, C('#d09060'));
    // gas bath heater (kama): cream box, round peep window, a knob, the flue going up the wall
    const K = CREAM;
    px.rect(24, 9, 7, 2, K[1]); px.hline(24, 30, 9, K[2]); px.set(24, 10, K[0]);
    px.rect(23, 11, 9, 16, K[2]);
    px.vline(23, 11, 26, K[1]); px.vline(24, 12, 25, K[0]); px.vline(30, 11, 26, K[3]); px.vline(31, 11, 26, K[4]); px.hline(23, 31, 26, K[4]);
    px.hline(23, 31, 11, K[1]);
    px.disc(27.5, 15.5, 2.3, CHROME[2]); px.disc(27.5, 15.5, 1.5, VOID2); px.set(26, 14, CHROME[0]); px.set(25, 15, CHROME[1]);
    px.set(28, 16, C('#2a3a5a')); px.set(27, 16, C('#1a2030'));
    px.disc(27.5, 21, 1.6, BLACK[2]); px.set(26, 20, BLACK[0]); px.set(27, 20, BLACK[1]); px.set(28, 21, BLACK[3]); px.set(27, 21, CHROME[1]);
    px.hline(25, 29, 24, K[3]);
    // pipes from the heater into the tub
    px.hline(22, 22, 17, CHROME[2]); px.set(22, 18, CHROME[3]); px.hline(22, 22, 23, CHROME[2]); px.set(22, 24, CHROME[3]);
    // flue: a steel pipe with a rusty collar, rising behind
    px.rect(26, 0, 3, 9, STEEL[2]); px.vline(26, 0, 8, STEEL[1]); px.vline(28, 0, 8, STEEL[3]);
    px.hline(26, 28, 6, RUST[2]); px.set(26, 6, RUST[1]); px.hline(26, 28, 7, RUST[3]);
    px.outline();
    return fr(px, 16, 28);
  });

  // ---- washbasin on a pedestal, the mirror and glass shelf above (two toothbrushes) (1x1) ----
  def('washbasin', () => {
    const px = new G.PX(16, 38);
    const E = ENAMEL;
    // mirror (on the wall): cream plastic frame, glass with a dim reflection and two glints
    px.rect(3, 0, 10, 11, CREAM[2]); px.hline(3, 12, 0, CREAM[0]); px.vline(3, 1, 10, CREAM[1]); px.vline(12, 1, 10, CREAM[3]); px.hline(4, 12, 10, CREAM[4]);
    const GL = R('#c4d4da', '#a2b6c0', '#8098a6', '#64788a', '#4a5a6c');
    for (let y = 1; y <= 9; y++) px.hline(4, 11, y, GL[y < 3 ? 1 : y < 6 ? 2 : y < 8 ? 3 : 4]);
    px.set(4, 1, GL[0]);
    px.line(5, 8, 9, 2, GL[0]); px.line(7, 8, 10, 4, GL[1]); px.set(11, 1, GL[0]);
    // glass shelf on two chrome brackets; cup with a big and a small toothbrush; soap
    px.hline(2, 13, 12, C('#cfe2e6')); px.hline(2, 13, 13, C('#8aa4ac')); px.set(2, 12, C('#eef8fa'));
    px.set(3, 14, CHROME[2]); px.set(12, 14, CHROME[2]);
    px.line(6, 9, 7, 3, C('#4a6ab8')); px.set(7, 2, ENAMEL[0]); px.set(8, 2, ENAMEL[1]); px.set(7, 3, C('#6a8ad0'));
    px.line(5, 9, 4, 6, C('#e0a838')); px.set(3, 5, ENAMEL[0]); px.set(4, 5, ENAMEL[1]);
    px.rect(4, 9, 3, 3, ENAMEL[1]); px.set(4, 9, ENAMEL[0]); px.vline(6, 9, 11, ENAMEL[3]); px.hline(4, 6, 9, C('#7a96c8'));
    px.rect(9, 10, 3, 2, C('#e8c8b8')); px.set(9, 10, C('#f8e4d8')); px.hline(9, 11, 11, C('#c8a090'));
    // basin: top face with the bowl, hot and cold taps
    const by = 19;
    px.rect(1, by, 14, 5, E[1]);
    px.hline(2, 13, by, E[2]); px.set(1, by, 0); px.set(14, by, 0); px.vline(14, by + 1, by + 4, E[2]);
    px.ellipse(7.5, by + 2.6, 5, 1.7, E[3]);
    px.ellipse(7.8, by + 2.9, 4, 1.1, E[2]);
    px.hline(4, 11, by + 1, E[4]); px.set(7, by + 3, VOID2); px.set(8, by + 3, E[4]);
    px.hline(2, 13, by + 4, E[0]);
    px.vline(7, by - 3, by, CHROME[1]); px.vline(8, by - 3, by, CHROME[3]); px.set(7, by - 3, CHROME[0]);
    px.set(7, by + 1, CHROME[2]);
    px.set(4, by - 1, CHROME[1]); px.set(4, by - 2, C('#c85a50')); px.set(11, by - 1, CHROME[1]); px.set(11, by - 2, C('#5a7ac8'));
    // rounded front of the basin
    px.hline(1, 14, by + 5, E[1]); px.hline(1, 14, by + 6, E[2]); px.set(1, by + 6, E[1]); px.set(14, by + 5, E[3]); px.set(14, by + 6, E[3]);
    px.hline(2, 13, by + 7, E[3]); px.hline(4, 11, by + 8, E[4]);
    // pedestal
    px.rect(5, by + 9, 6, 8, E[2]); cyl(px, 5, by + 9, 6, 8, E);
    px.rect(4, by + 16, 8, 2, E[2]); cyl(px, 4, by + 16, 8, 2, E); px.hline(4, 11, by + 17, E[3]);
    // a blue hand towel over the edge
    px.rect(13, by + 4, 3, 7, C('#7a96c0')); px.vline(13, by + 4, by + 10, C('#9ab2d8')); px.vline(15, by + 5, by + 10, C('#5a7298'));
    px.hline(13, 15, by + 9, C('#e8ecf0')); px.set(15, by + 4, C('#5a7298'));
    px.outline();
    drop(px, 1, 1, SHADOW2, 0, 14);
    floorShadow(px, 8, 37, 5, 1);
    return fr(px, 8, 38);
  });

  // =====================================================================
  //  LIVING ROOM / CORRIDOR CLUTTER
  // =====================================================================
  // ---- mantel clock (11:59) on a small glass-fronted cabinet with a doily (1x1) ----
  def('mantel_clock', () => {
    const px = new G.PX(16, 31);
    // cabinet
    box34(px, 0, 15, 16, 14, 3, WOOD, WOOD);
    for (const dx of [2, 8]) {
      px.rect(dx, 19, 6, 7, C('#2a2a30'));
      px.hline(dx, dx + 5, 19, WOOD[4]); px.vline(dx, 19, 25, WOOD[4]); px.hline(dx, dx + 5, 25, WOOD[1]);
      // teacups inside, a glint on the glass
      px.set(dx + 2, 23, C('#8a8478')); px.set(dx + 3, 23, C('#6a665e')); px.set(dx + 2, 24, C('#5a564e'));
      px.set(dx + 1, 21, C('#7a8a94')); px.set(dx + 2, 20, C('#9aaab4'));
    }
    px.vline(7, 19, 25, WOOD[1]); px.vline(8, 19, 25, WOOD[3]);
    px.set(6, 22, GOLD[1]); px.set(9, 22, GOLD[1]);
    px.rect(1, 29, 2, 2, WOOD[4]); px.rect(13, 29, 2, 2, WOOD[4]);
    doily(px, 2, 13, 16, 17);
    // the clock: a dark lacquered "Napoleon hat" case, brass bezel, cream face
    const L = DWOOD;
    px.stamp([
      '.....LLLL.....',
      '...LLLLLLLL...',
      '..LLLLLLLLLL..',
      '.LLLLLLLLLLLL.',
      '.LLLLLLLLLLLL.',
      '.LLLLLLLLLLLL.',
      '.LLLLLLLLLLLL.',
      '.LLLLLLLLLLLL.',
      '.LLLLLLLLLLLL.',
      'LLLLLLLLLLLLLL',
      'LLLLLLLLLLLLLL',
    ], { L: L[2] }, 1, 4);
    cyl(px, 1, 4, 14, 11, L);
    px.hline(1, 14, 13, GOLD[2]); px.set(1, 13, GOLD[1]); px.hline(1, 14, 14, L[4]);
    px.hline(6, 9, 4, L[0]); px.set(4, 5, L[0]);
    px.disc(7.5, 8.5, 3.6, GOLD[2]); px.set(5, 6, GOLD[0]); px.set(6, 5, GOLD[1]); px.set(10, 11, GOLD[3]); px.set(9, 12, GOLD[3]);
    px.disc(7.5, 8.5, 2.7, C('#efe6cc'));
    px.set(5, 8, C('#c8bc9c')); px.set(10, 9, C('#d8ccac'));
    for (const [x, y] of [[7, 6], [9, 8], [7, 11], [5, 8]]) px.set(x, y, C('#6a5e4a'));
    // both hands nearly upright: one minute to midnight
    px.vline(7, 6, 8, C('#1e1a1c')); px.set(8, 7, C('#1e1a1c')); px.set(7, 8, GOLD[3]);
    px.set(12, 15, GOLD[1]); px.set(13, 15, GOLD[3]);
    px.outline();
    floorShadow(px, 8, 30, 8, 1.2);
    return fr(px, 8, 31);
  });

  // ---- rubber plant in a clay pot on a saucer (1x1) ----
  function leaf(px, bx, by, dx, dy, len, wid, L) {
    const n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n;
    const hl = len / 2, hw = wid / 2, cx = bx + ux * hl, cy = by + uy * hl;
    for (let y = Math.floor(cy - hl - 2); y <= Math.ceil(cy + hl + 2); y++)
      for (let x = Math.floor(cx - hl - 2); x <= Math.ceil(cx + hl + 2); x++) {
        const ox = x + 0.5 - cx, oy = y + 0.5 - cy;
        const u = ox * ux + oy * uy, v = -ox * uy + oy * ux;
        if (Math.abs(u) > hl) continue;
        const t = u / hl;
        const half = hw * Math.sqrt(Math.max(0, 1 - t * t)) * (t > 0 ? 1 - 0.35 * t : 1);
        if (Math.abs(v) > half + 0.15) continue;
        const sg = v >= 0 ? 1 : -1, sx = -uy * sg, sy = ux * sg;
        const lit = -(sx * 0.6 + sy * 0.8);
        const e = Math.abs(v) / Math.max(0.6, half);
        let c;
        if (Math.abs(v) < 0.5 && t > -0.9 && t < 0.75) c = L[5];
        else if (lit > 0.1) c = e < 0.7 && t > -0.6 && t < 0.3 ? L[0] : L[1];
        else c = e > 0.7 ? L[4] : L[3];
        if (lit <= 0.1 && lit > -0.3 && e < 0.6) c = L[2];
        px.set(x, y, c);
      }
  }
  def('plant_pot', () => {
    const px = new G.PX(18, 31);
    const LF = R('#86b07a', '#4e8456', '#3a6a46', '#28503a', '#1a3628', '#a4b884');
    const T = R('#e0a07a', '#c47a58', '#a46046', '#7e4836', '#583226');
    // stem
    px.line(9, 21, 9, 5, C('#4e5e34')); px.set(10, 12, C('#3e4a2a'));
    // the new leaf sheath at the tip (a rosy spike)
    px.vline(9, 1, 4, C('#c06a62')); px.set(9, 0, C('#e09088')); px.set(10, 3, C('#8a4440'));
    const L = [
      [9, 6, 0.15, -1, 6, 3],
      [9, 8, -0.8, -0.75, 7, 3.6], [9, 8, 0.85, -0.7, 7, 3.6],
      [9, 12, -1, -0.3, 8, 4.2], [9, 11, 1, -0.4, 8, 4.2],
      [9, 16, -1, 0.15, 8.5, 4.4], [9, 15, 1, 0.1, 8.5, 4.4],
    ];
    for (const [bx, by, dx, dy, len, wid] of L) piece(px, (t) => leaf(t, bx, by, dx, dy, len, wid, LF));
    // pot: rim with dark soil, tapered body, saucer
    px.ellipse(9, 21, 6, 1.6, T[1]); px.ellipse(9, 21, 4.6, 0.9, C('#3a2a20')); px.set(7, 21, C('#5a4030'));
    px.hline(3, 14, 22, T[0]); px.hline(3, 14, 23, T[2]); px.set(14, 22, T[2]); px.set(14, 23, T[3]);
    px.stamp(['##########', '##########', '.########.', '.########.', '.########.', '..######..'], { '#': T[2] }, 4, 24);
    cyl(px, 4, 24, 10, 6, T);
    px.hline(5, 12, 24, T[4]);
    px.hline(2, 15, 30, T[3]); px.set(2, 30, T[2]); px.set(15, 30, T[4]);
    px.outline();
    return fr(px, 9, 31);
  });

  // ---- umbrella stand with a big black umbrella and a small yellow one, a puddle rippling (1x1) ----
  function umbrellaStand(k) {
    const px = new G.PX(16, 31);
    const S = R('#a8bcbe', '#86a0a4', '#6a868c', '#506a72', '#384c54');
    // mouth of the stand (back)
    px.ellipse(8, 17.5, 4.6, 1.6, S[1]); px.ellipse(8, 17.6, 3.6, 0.9, VOID2);
    // big black umbrella with a bamboo crook handle
    const B = BLACK;
    px.stamp(['.b.', 'bbb', 'bbb', 'bbb', 'bbb', 'bbbb', 'bbbb', 'bbbb', 'bbbb', 'bbbb', '.bbbb'], { b: B[2] }, 4, 7);
    px.vline(4, 9, 16, B[1]); px.vline(5, 8, 16, B[0]); px.vline(7, 13, 17, B[3]); px.set(8, 17, B[4]);
    px.hline(4, 7, 12, C('#6a6470')); px.set(5, 12, C('#8a8490'));
    px.vline(5, 3, 6, LWOOD[2]); px.set(5, 2, LWOOD[1]); px.set(6, 1, LWOOD[1]); px.set(7, 1, LWOOD[2]); px.set(8, 2, LWOOD[3]); px.set(8, 3, LWOOD[3]);
    px.set(5, 4, LWOOD[3]);
    // small yellow child's umbrella with a red plastic handle, leaning right
    const Y = R('#f4dc84', '#dcb850', '#bc9636', '#8e6e28', '#62481c');
    for (let i = 0; i < 9; i++) {
      const x = 9 + Math.round(i * 0.35), y = 16 - i;
      const w = i < 3 ? 3 : i < 7 ? 2 : 1;
      for (let j = 0; j < w; j++) px.set(x + j, y, j === 0 ? Y[1] : j === w - 1 ? Y[3] : Y[2]);
    }
    px.set(10, 12, Y[0]); px.set(11, 10, Y[0]); px.hline(9, 11, 14, Y[3]);
    px.vline(12, 4, 7, C('#7a7268')); px.rect(12, 2, 2, 3, C('#c04a40')); px.set(12, 2, C('#e07068')); px.set(13, 4, C('#8a2e2a'));
    // the stand body
    px.rect(3, 18, 10, 10, S[2]);
    px.stamp(['..........', '..........'], {}, 3, 18);
    cyl(px, 3, 18, 10, 10, S);
    px.hline(3, 12, 18, S[0]); px.set(12, 18, S[2]);
    px.hline(3, 12, 21, S[3]); px.hline(3, 12, 22, S[1]); px.hline(3, 12, 25, S[3]); px.hline(3, 12, 26, S[1]);
    px.hline(3, 12, 28, S[4]); px.set(3, 28, 0); px.set(12, 28, 0);
    px.outline();
    // rain water puddled round the base, a drip ring spreading
    floorShadow(px, 8, 29, 6.5, 1.2, SHADOW2);
    halo(px, 8.5, 29.5, 7.5, 1.6, '#a8c0d0', 0.4);
    const rr = [0.6, 1.6, 2.6, 0, 0, 0][k];
    if (rr) for (let a = 0; a < 6.28; a += 0.4) { const x = 13 + Math.cos(a) * rr * 1.4, y = 29.5 + Math.sin(a) * rr * 0.45; if (!(px.get(x, y) >>> 24 === 255)) px.set(x, y, C('#d0e0ea', 0.7 - rr * 0.15)); }
    if (k === 5) px.set(13, 27, C('#c8dcea', 0.8));
    return fr(px, 8, 30);
  }
  def('umbrella_stand', () => frames(6, umbrellaStand), 4);

  // ---- old black utility bicycle: chain case, rear rack, wire basket, rusty bell (2x1) ----
  def('bicycle', () => {
    const px = new G.PX(32, 25);
    const F = R('#6e8076', '#4c5c54', '#34423c', '#242e2a', '#161c1a');
    const TY = C('#26222a'), TYL = C('#4a4650'), RIM = C('#9aa2a8'), RIMD = C('#6a7278'), SPK = C('#5c636a');
    const wheel = (cx, cy) => {
      for (let y = cy - 8; y <= cy + 8; y++)
        for (let x = cx - 8; x <= cx + 8; x++) {
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy);
          if (d > 6.6) continue;
          if (d > 5.5) px.set(x, y, dx + dy < -4 ? TYL : TY);
          else if (d > 4.6) px.set(x, y, dx + dy < -2 ? RIM : RIMD);
          else if (d < 1.2) px.set(x, y, RIM);
          else {
            const a = Math.atan2(dy, dx) + 0.3, s = ((a / (Math.PI / 3)) % 1 + 1) % 1;
            if (s < 0.13 || s > 0.87) px.set(x, y, SPK);
          }
        }
    };
    const W1 = [7, 17], W2 = [25, 17];
    wheel(W1[0], W1[1]); wheel(W2[0], W2[1]);
    // mudguards
    for (const [cx, cy] of [W1, W2])
      for (let a = -2.9; a <= -0.25; a += 0.05) {
        const x = Math.floor(cx + Math.cos(a) * 7.3), y = Math.floor(cy + Math.sin(a) * 7.3);
        px.set(x, y, a < -1.8 ? F[1] : F[2]);
      }
    // frame tubes (doubled for weight), fork, stays
    const tube = (x0, y0, x1, y1, c, c2) => { px.line(x0, y0, x1, y1, c); if (c2) px.line(x0, y0 + 1, x1, y1 + 1, c2); };
    tube(10, 7, 15, 7, F[1], F[2]);
    tube(10, 9, 16, 16, F[2], F[3]);
    tube(15, 6, 16, 17, F[2]);
    px.line(14, 6, 15, 17, F[1]);
    tube(16, 17, 25, 17, F[3]);
    px.line(15, 8, 25, 16, F[2]);
    px.line(10, 6, 8, 14, F[1]); px.line(11, 7, 8, 16, F[3]); px.line(8, 14, 7, 17, F[2]);
    px.vline(10, 4, 8, F[1]); px.vline(11, 5, 8, F[3]);
    // chain case over the drive
    px.stamp(['..ccccccccccc', '.cccccccccccc.', 'cccccccccccccc', 'cccccccccccccc', '.cccccccccccc.'], { c: F[2] }, 14, 15);
    px.hline(16, 25, 15, F[1]); px.hline(15, 26, 16, F[0]); px.hline(15, 27, 19, F[3]);
    px.set(17, 17, RUST[2]); px.set(22, 18, RUST[3]); px.set(23, 17, RUST[2]);
    px.disc(16.5, 17.5, 1.6, CHROME[2]); px.set(16, 17, CHROME[0]);
    // crank and pedal
    px.line(16, 18, 18, 21, CHROME[3]); px.hline(17, 19, 21, BLACK[1]); px.set(17, 21, BLACK[0]);
    // saddle on its springs, rear rack, stand
    px.vline(14, 4, 6, CHROME[3]);
    px.hline(12, 17, 3, C('#7a4a30')); px.hline(11, 16, 4, C('#5a3420')); px.set(12, 3, C('#9a6a48')); px.set(17, 3, C('#5a3420'));
    px.set(13, 5, CHROME[2]); px.set(15, 5, CHROME[2]);
    px.hline(18, 30, 8, F[1]); px.hline(19, 30, 9, F[3]); px.set(30, 8, F[2]);
    px.line(20, 9, 24, 16, F[3]); px.line(29, 9, 26, 16, F[3]);
    px.line(25, 18, 23, 23, F[3]); px.line(26, 18, 27, 23, F[4]);
    // handlebar, grips, rusty bell, headlamp
    px.hline(7, 13, 3, CHROME[2]); px.set(7, 3, CHROME[0]); px.hline(12, 13, 3, BLACK[2]); px.set(13, 4, BLACK[3]);
    px.hline(10, 11, 2, CHROME[1]); px.set(10, 1, CHROME[0]); px.set(11, 2, RUST[1]); px.set(11, 1, RUST[2]);
    px.rect(8, 6, 2, 2, CREAM[1]); px.set(8, 6, CREAM[0]); px.set(9, 7, CREAM[3]);
    // wire basket in front of the bars
    px.rect(1, 3, 6, 5, C('#2e3236'));
    for (let y = 4; y <= 6; y++) for (let x = 2; x <= 5; x++) if ((x + y) % 2 === 0) px.set(x, y, STEEL[3]);
    px.hline(1, 6, 3, STEEL[1]); px.set(1, 3, STEEL[0]); px.hline(1, 6, 7, STEEL[3]); px.vline(1, 4, 6, STEEL[2]); px.vline(6, 4, 7, STEEL[4]);
    px.line(6, 7, 7, 10, CHROME[3]);
    outlineOuter(px);
    floorShadow(px, 16, 24, 14, 1.2);
    return fr(px, 16, 25);
  });

  // ---- garbage bags in a green crow net (1x1) ----
  def('trash_bags', () => {
    const px = new G.PX(16, 17);
    const WB = R('#eceee6', '#d2d4cc', '#b2b6ae', '#8c928c', '#666c68');
    const GB = R('#a8b4c0', '#8494a4', '#667686', '#4c5a6a', '#36404e');
    blob(px, 6, 9.5, 5.5, 5, WB);
    blob(px, 11.5, 11, 4.2, 4.6, GB);
    blob(px, 3.6, 13, 3.4, 2.8, WB);
    // knots with little ears
    px.set(5, 4, WB[2]); px.set(5, 3, WB[1]); px.set(4, 2, WB[1]); px.set(6, 2, WB[2]);
    px.set(12, 6, GB[2]); px.set(12, 5, GB[1]); px.set(11, 4, GB[1]); px.set(13, 4, GB[2]);
    // wrinkles and a crumpled print showing through the white bag
    px.line(3, 8, 5, 11, WB[3]); px.line(7, 6, 8, 9, WB[2]); px.set(9, 13, GB[4]); px.line(13, 9, 14, 12, GB[3]);
    px.set(5, 12, C('#b06a4a')); px.set(6, 12, C('#8a8a9a')); px.set(6, 13, C('#9a5a40'));
    // the net over everything, weighted hem at the bottom
    const NG = C('#3e5e3e'), NL = C('#62845a');
    for (let y = 3; y < 17; y++)
      for (let x = 0; x < 16; x++) {
        if (!(px.get(x, y) >>> 24)) continue;
        if ((x + y) % 4 === 0 || (x - y + 64) % 4 === 0) px.set(x, y, (x + y) % 8 === 0 ? NL : NG);
      }
    px.hline(1, 15, 15, NG); px.set(3, 15, NL); px.set(9, 15, NL); px.hline(2, 14, 16, C('#2a3e2a'));
    px.outline();
    return fr(px, 8, 17);
  });

  // =====================================================================
  //  LOBBY WALL PIECES
  // =====================================================================
  // ---- cork notice board with pinned notices, one red-bordered (2x1 wall) ----
  def('notice_board', () => {
    const px = new G.PX(32, 22);
    // frame
    px.rect(0, 0, 32, 22, LWOOD[2]);
    px.hline(0, 31, 0, LWOOD[0]); px.vline(0, 1, 21, LWOOD[1]); px.vline(31, 1, 21, LWOOD[3]); px.hline(1, 31, 21, LWOOD[4]);
    px.hline(1, 30, 1, LWOOD[3]); px.vline(1, 1, 20, LWOOD[3]); px.hline(2, 30, 20, LWOOD[1]); px.vline(30, 2, 20, LWOOD[1]);
    // cork
    const CK = R('#c89c6c', '#b08454', '#966c42', '#7a5634');
    for (let y = 2; y <= 19; y++)
      for (let x = 2; x <= 29; x++) {
        const h = G.hash(x, y, 7);
        px.set(x, y, h < 0.12 ? CK[0] : h < 0.55 ? CK[1] : h < 0.85 ? CK[2] : CK[3]);
      }
    px.hline(2, 29, 2, CK[3]); px.vline(2, 2, 19, CK[3]);
    const sheet = (x, y, w, h, col, edge) => {
      px.rect(x, y, w, h, col);
      px.vline(x + w - 1, y + 1, y + h - 1, edge); px.hline(x + 1, x + w - 1, y + h - 1, edge);
    };
    const lines = (x0, x1, y0, y1, c, step) => { for (let y = y0; y <= y1; y += step || 2) for (let x = x0; x <= x1; x++) if (G.hash(x, y, 3) > 0.22) px.set(x, y, c); };
    const pin = (x, y, c) => { px.set(x, y, c); px.set(x - 1, y - 1, G.lighten(c, 0.5)); px.set(x + 1, y + 1, C('#3a2418', 0.6)); };
    // a residents' committee notice with a header bar
    sheet(4, 3, 10, 12, PAPER[0], PAPER[2]);
    px.hline(5, 12, 5, C('#4a5a7a')); px.hline(5, 12, 6, C('#4a5a7a'));
    lines(5, 12, 8, 13, C('#8a8696'));
    pin(9, 4, C('#3a6ab0'));
    // the red-bordered safety notice: a big "!" in a warning triangle
    sheet(15, 4, 8, 11, C('#f2ecdc'), PAPER[2]);
    px.hline(15, 22, 4, C('#b8302c')); px.hline(15, 22, 14, C('#8a2420')); px.vline(15, 4, 14, C('#b8302c')); px.vline(22, 4, 14, C('#8a2420'));
    px.set(18, 6, C('#b8302c')); px.set(19, 6, C('#b8302c')); px.hline(17, 20, 7, C('#b8302c')); px.hline(17, 20, 8, C('#b8302c')); px.hline(16, 21, 9, C('#b8302c'));
    px.set(18, 7, C('#f2ecdc')); px.set(19, 7, C('#f2ecdc')); px.set(18, 8, C('#f2ecdc')); px.set(19, 8, C('#f2ecdc'));
    px.vline(18, 7, 8, TEXT); px.set(19, 7, TEXT);
    lines(16, 21, 11, 13, C('#8a5a56'));
    pin(18, 5, C('#c8302c'));
    // a yellowed note, its corner curling, and a pink event flyer
    sheet(24, 3, 5, 6, C('#e8dcae'), C('#c0b080'));
    lines(25, 27, 5, 7, C('#8a7a5a'));
    px.set(28, 8, CK[2]); px.set(27, 8, C('#c0b080')); px.set(28, 7, C('#d8cc9a'));
    pin(26, 3, C('#e0c040'));
    sheet(24, 11, 6, 7, C('#e8b8c0'), C('#c08c98'));
    px.disc(26.5, 13.5, 1.3, C('#c05a70')); lines(25, 28, 16, 16, C('#8a5a66'));
    pin(26, 11, C('#40a050'));
    // a small card at the bottom left, and an empty pin
    sheet(4, 16, 7, 3, PAPER[1], PAPER[3]);
    lines(5, 9, 17, 17, C('#8a8696'));
    pin(12, 17, C('#e8e0d0'));
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 27);
  });

  // ---- lobby mailboxes: floors 4/3/2 x rooms 1-4, some stuffed with flyers (2x1 wall) ----
  def('mailboxes', () => {
    const px = new G.PX(34, 27);
    const M = R('#b4bcb8', '#98a29e', '#7e8884', '#646e6a', '#4a524f');
    px.rect(0, 0, 34, 27, M[3]);
    px.hline(0, 33, 0, M[1]); px.vline(0, 1, 26, M[2]); px.vline(33, 0, 26, M[4]); px.hline(0, 33, 26, M[4]);
    // header strip with the room numbers 1-4, floor numbers down the side
    px.rect(1, 1, 32, 6, CREAM[1]); px.hline(1, 32, 1, CREAM[0]); px.hline(1, 32, 6, CREAM[3]);
    px.rect(1, 7, 4, 18, CREAM[1]); px.vline(4, 7, 25, CREAM[3]);
    for (let c = 0; c < 4; c++) text(px, String(c + 1), 7 + c * 7 + (c === 0 ? 1 : 0), 1, TEXT);
    ['4', '3', '2'].forEach((f, r) => text(px, f, 1, 8 + r * 6, C('#7a3a30')));
    // the doors: slot, name card, little catch; flyers stuffed in some
    const flyer = { '0,1': C('#f0ece0'), '1,2': C('#e8c0c4'), '2,0': C('#e8dca0'), '1,3': C('#f0ece0'), '2,3': C('#d8e4f0') };
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 4; c++) {
        const x = 5 + c * 7, y = 7 + r * 6;
        bevel(px, x, y, 7, 6, M);
        px.hline(x + 1, x + 5, y + 2, VOID2); px.set(x + 1, y + 1, M[1]);
        px.hline(x + 2, x + 4, y + 4, PAPER[1]); px.set(x + 4, y + 4, PAPER[3]);
        px.set(x + 5, y + 4, CHROME[1]);
        const f = flyer[r + ',' + c];
        if (f) { px.hline(x + 2, x + 4, y + 1, f); px.set(x + 3, y + 2, f); px.set(x + 2, y + 2, G.darken(f, 0.25)); px.set(x + 4, y, f); }
      }
    // 404: our box, with a crayon star sticker
    px.set(28, 8, C('#f0c040')); px.set(27, 9, C('#d8a030'));
    px.outline();
    drop(px, 1, 1, SHADOW2);
    return wallF(px, 28, 17);
  });

  // ---- the red public phone (akadenwa) on a small wooden shelf with phone books (1x1) ----
  def('payphone', () => {
    const px = new G.PX(16, 29);
    // the stand: top, two legs, a shelf with directories
    box34(px, 0, 15, 16, 3, 2, DWOOD, DWOOD);
    px.vline(1, 18, 28, DWOOD[2]); px.vline(2, 18, 28, DWOOD[3]); px.vline(13, 18, 28, DWOOD[2]); px.vline(14, 18, 28, DWOOD[3]);
    px.set(1, 18, DWOOD[1]); px.set(13, 18, DWOOD[1]);
    px.hline(1, 14, 24, DWOOD[1]); px.hline(1, 14, 25, DWOOD[4]);
    px.rect(4, 21, 4, 3, C('#d8b048')); px.hline(4, 7, 21, C('#f0d070')); px.vline(7, 21, 23, C('#a88430'));
    px.rect(8, 22, 4, 2, C('#c86a3a')); px.hline(8, 11, 22, C('#e08a58')); px.set(11, 23, C('#8a4428'));
    // the phone: a red box with a lighter top, rounded shoulders
    const P = RED;
    px.rect(3, 6, 10, 10, P[2]);
    px.hline(4, 11, 6, P[1]); px.hline(3, 12, 7, P[1]); px.hline(3, 12, 8, P[0]); px.set(3, 6, 0); px.set(12, 6, 0);
    px.vline(3, 9, 15, P[1]); px.vline(4, 9, 14, P[1]); px.vline(12, 8, 15, P[3]); px.vline(11, 9, 15, P[2]); px.hline(3, 12, 15, P[4]);
    // coin slot on top, coin return below
    px.hline(9, 11, 7, P[4]); px.set(9, 7, VOID2);
    px.rect(9, 13, 2, 2, VOID2); px.hline(9, 10, 12, CHROME[2]);
    // the dial: chrome ring with finger holes round a white card
    px.disc(6.5, 11.5, 2.6, CHROME[2]);
    for (const [x, y] of [[5, 10], [6, 9], [7, 9], [8, 10], [8, 12], [5, 12], [6, 13]]) px.set(x, y, C('#3a3236'));
    px.set(6, 11, C('#f4efe2')); px.set(7, 11, C('#f4efe2')); px.set(6, 12, C('#d8d0c0'));
    px.set(4, 10, CHROME[0]);
    // black handset in its cradle, coiled cord down the side
    const B = BLACK;
    px.hline(3, 12, 4, B[2]); px.hline(4, 11, 3, B[1]); px.set(4, 3, B[0]);
    px.rect(1, 3, 3, 3, B[2]); px.set(1, 3, B[1]); px.set(2, 3, B[0]); px.hline(1, 3, 5, B[3]);
    px.rect(12, 3, 3, 3, B[2]); px.set(12, 3, B[1]); px.hline(12, 14, 5, B[3]); px.set(14, 4, B[3]);
    px.set(5, 5, P[4]); px.set(10, 5, P[4]);
    for (let y = 6; y <= 14; y++) px.set(13 + (y % 2), y, y % 2 ? B[2] : B[1]);
    px.outline();
    floorShadow(px, 8, 28, 7.5, 1.2);
    return fr(px, 8, 29);
  });

  // ---- small pink lamp above the payphone, flickering now and then (1x1 wall, frames 2) ----
  function boothLamp(on) {
    const px = new G.PX(22, 30);
    const P = on ? R('#ffe8ec', '#f8b8c4', '#e08c9e', '#b8667a', '#8a4a5a') : R('#d8c8cc', '#baa6ac', '#9a868e', '#76666e', '#54484e');
    // wall plate and curved bracket arm
    px.rect(10, 0, 3, 4, CHROME[2]); px.set(10, 0, CHROME[0]); px.vline(12, 1, 3, CHROME[3]);
    px.set(11, 4, CHROME[2]); px.set(11, 5, CHROME[3]);
    // bell-shaped glass shade
    px.stamp(['...ss...', '..ssss..', '.ssssss.', '.ssssss.', 'ssssssss', 'ssssssss'], { s: P[2] }, 7, 6);
    cyl(px, 7, 6, 8, 6, P);
    px.hline(7, 14, 11, P[3]);
    // bulb under the rim
    px.hline(9, 12, 12, on ? C('#fff8e8') : C('#a8a098')); px.set(10, 13, on ? C('#fff2d0') : C('#8a847c')); px.set(11, 13, on ? C('#ffe4b0') : C('#7a746c'));
    px.outline();
    drop(px, 1, 1, SHADOW2);
    if (on) {
      halo(px, 11, 12, 11, 14, '#ff9ab4', 0.2);
      halo(px, 11, 10, 6, 5, '#ffc0cc', 0.22);
    }
    return wallF(px, 25);
  }
  def('phone_booth_light', () => {
    const on = boothLamp(true), off = boothLamp(false);
    return [on, on, on, on, on, on, on, off, on, off, on, on, on, on, on, on, on, on, on, on, on, on, off, on];
  }, 8);

  // =====================================================================
  //  BENCHES, BOXES, CLEANING
  // =====================================================================
  // ---- slatted wooden bench on cast-iron ends (2x1); with the old brown cardigan folded on it ----
  function bench(cardigan) {
    const px = new G.PX(32, 23);
    const W = R('#c8a070', '#aa8254', '#8c683e', '#6c4e2e', '#4a3420');
    // iron ends: back post, arm, front leg
    for (const x of [1, 28]) {
      px.rect(x + 1, 0, 2, 10, IRON[2]); px.vline(x + 1, 0, 9, IRON[1]);
      px.rect(x, 9, 3, 13, IRON[2]); px.vline(x, 9, 21, IRON[1]); px.vline(x + 2, 9, 21, IRON[3]);
      px.hline(x, x + 2, 8, IRON[1]); px.set(x + 1, 8, IRON[0]);
      px.hline(x - 1, x + 3, 21, IRON[3]);
    }
    // backrest boards
    for (const y of [1, 5]) {
      px.hline(3, 28, y, W[1]); px.hline(3, 28, y + 1, W[2]); px.hline(3, 28, y + 2, W[3]);
      px.set(3, y, W[0]); px.set(10, y + 1, W[3]); px.set(21, y + 1, W[1]); px.set(17, y + 2, W[4]);
    }
    // seat slats (top face) with dark gaps, front edge
    for (const [y, i] of [[10, 0], [13, 1], [16, 2]]) {
      px.hline(1, 30, y, W[1]); px.hline(1, 30, y + 1, i === 2 ? W[0] : W[2]);
      if (i < 2) px.hline(1, 30, y + 2, W[4]);
      px.set(1, y, W[0]); px.set(8 + i * 7, y + 1, W[3]); px.set(24 - i * 5, y, W[0]);
    }
    px.hline(1, 30, 18, W[3]); px.hline(1, 30, 19, W[4]);
    // bolts on the ends
    for (const x of [2, 29]) { px.set(x, 11, IRON[0]); px.set(x, 17, IRON[0]); }
    if (cardigan) {
      const K = R('#b08c68', '#8e6c4e', '#72543c', '#563e2c', '#3a2a1e');
      // folded body with ribbing, a button placket and a collar fold
      px.rect(6, 9, 12, 7, K[2]);
      for (let y = 10; y <= 15; y++) for (let x = 6; x <= 17; x++) if (x % 2 === 0) px.set(x, y, K[3]);
      px.hline(6, 17, 8, K[1]); px.hline(7, 16, 8, K[0]); px.vline(6, 9, 15, K[1]); px.vline(17, 9, 15, K[3]);
      px.hline(6, 17, 15, K[4]); px.hline(6, 17, 9, K[1]);
      px.vline(12, 9, 15, K[1]); px.vline(13, 9, 15, K[4]);
      for (const y of [10, 12, 14]) px.set(12, y, C('#e8dcc0'));
      px.set(9, 9, K[0]); px.set(15, 9, K[0]);
      // a sleeve hanging over the front edge
      px.rect(15, 16, 3, 4, K[2]); px.vline(15, 16, 19, K[1]); px.vline(17, 16, 19, K[3]);
      px.hline(15, 17, 20, K[3]); px.hline(15, 17, 21, K[4]); px.set(16, 20, K[2]);
    }
    px.outline();
    floorShadow(px, 16, 21.5, 15, 1.6);
    return fr(px, 16, 23);
  }
  def('bench', () => bench(false));
  def('bench_cardigan', () => bench(true));

  // ---- stacked cardboard moving boxes, taped shut (1x1) ----
  def('boxes_stack', () => {
    const px = new G.PX(16, 28);
    const K = KRAFT, TP = R('#e6d0a4', '#cfb486', '#ae9466');
    const cardboard = (x, y, w, h, topH, seed) => {
      box34(px, x, y, w, h, topH, K, K);
      const mid = x + (w >> 1);
      // flap seam with packing tape down the middle and over the front edge
      px.vline(mid, y, y + topH - 1, TP[1]); px.vline(mid - 1, y, y + topH - 1, TP[0]);
      px.vline(mid, y + topH, y + topH + 2, TP[2]); px.vline(mid - 1, y + topH, y + topH + 2, TP[1]);
      px.set(mid, y + topH + 3, K[3]);
      const r = G.rng(seed);
      for (let i = 0; i < 4; i++) px.set(x + 1 + r.int(w - 2), y + topH + 2 + r.int(h - topH - 3), K[r.int(2) ? 1 : 3]);
    };
    cardboard(0, 12, 16, 15, 5, 3);
    cardboard(2, 3, 12, 10, 4, 5);
    // marker: "this way up" arrows, a scrawled label, a hand hole
    px.set(3, 19, TEXT); px.hline(2, 4, 20, TEXT); px.hline(1, 5, 21, TEXT); px.vline(3, 22, 24, TEXT); px.set(2, 22, KRAFT[3]);
    text(px, 'UP', 7, 20, TEXT);
    px.rect(9, 8, 4, 3, PAPER[1]); px.hline(10, 12, 9, TEXT); px.set(12, 10, PAPER[3]);
    px.rect(11, 21, 3, 1, K[4]); px.hline(11, 13, 22, K[1]);
    px.set(13, 4, K[0]); px.set(4, 16, K[0]);
    px.outline();
    floorShadow(px, 8, 27, 8, 1.2);
    return fr(px, 8, 28);
  });

  // ---- galvanised bucket with a string mop leaning in it (1x1) ----
  def('mop_bucket', () => {
    const px = new G.PX(16, 28);
    const GV = R('#e2e6e8', '#bfc6cb', '#9ca4aa', '#7a828c', '#596068');
    const MP = R('#ece8dc', '#d2ccbe', '#b2ac9c', '#8c8678', '#686254');
    // the mop handle, leaning up to the right
    px.line(9, 17, 14, 0, LWOOD[1]); px.line(10, 17, 15, 1, LWOOD[3]); px.set(14, 0, LWOOD[0]);
    // bucket mouth with dark water, the mop strands bunched in it
    px.ellipse(7.5, 16.5, 6, 1.8, GV[1]);
    px.ellipse(7.5, 16.7, 4.8, 1.0, C('#3e4a52')); px.set(4, 16, C('#6a7a84'));
    for (let x = 4; x <= 11; x++) for (let y = 13; y <= 16; y++) if ((x * 3 + y) % 5 < 3 && y >= 14 - ((x + 1) % 3)) px.set(x, y, MP[(x + y) % 3 + 1]);
    px.set(6, 13, MP[0]); px.set(8, 13, MP[0]);
    // strands draped over the left rim
    for (const [x, len] of [[1, 6], [2, 7], [3, 5], [4, 3]]) for (let j = 0; j < len; j++) px.set(x, 16 + j, j === len - 1 ? MP[3] : (x + j) % 2 ? MP[1] : MP[2]);
    // bucket body: tapered, two pressed ribs, rolled rim
    px.stamp(['############', '############', '.##########.', '.##########.', '.##########.', '.##########.', '.##########.', '.##########.', '..########..', '..########..'], { '#': GV[2] }, 2, 17);
    cyl(px, 2, 17, 12, 10, GV);
    px.hline(2, 13, 17, GV[0]); px.hline(3, 12, 20, GV[3]); px.hline(3, 12, 21, GV[1]); px.hline(3, 12, 24, GV[3]); px.hline(4, 11, 25, GV[1]);
    px.hline(4, 11, 26, GV[4]);
    // the bail handle folded down in front
    px.set(2, 18, GV[4]); px.set(13, 18, GV[4]);
    for (let x = 3; x <= 12; x++) px.set(x, 19 + Math.round(Math.sin(((x - 2) / 11) * Math.PI) * 2), CHROME[3]);
    // the strands that lie over the rim, again, in front
    for (const [x, len] of [[2, 4], [3, 3]]) for (let j = 0; j < len; j++) px.set(x, 17 + j, (x + j) % 2 ? MP[1] : MP[2]);
    px.outline();
    floorShadow(px, 8, 27, 7, 1.2);
    halo(px, 3, 27.5, 4, 1, '#a8c0d0', 0.35);
    return fr(px, 8, 28);
  });

  // =====================================================================
  //  STAIR BARRICADE (3x2): chairs, a table and a mattress jammed together
  // =====================================================================
  // a wooden chair in side view, rotated by `ang` around (x, y) = the seat front corner
  function chair(px, x, y, ang, W, seatCol, flip) {
    const ca = Math.cos(ang), sa = Math.sin(ang), f = flip ? -1 : 1;
    const P = (u, v) => [x + (u * ca - v * sa) * f, y + (u * sa + v * ca)];
    const bar = (u0, v0, u1, v1, c, c2) => { const a = P(u0, v0), b = P(u1, v1); px.line(a[0], a[1], b[0], b[1], c); if (c2) px.line(a[0] + 1, a[1], b[0] + 1, b[1], c2); };
    // back leg + back post (one long piece), front leg, seat, backrest slats, stretcher
    bar(-9, -13, -9, 8, W[2], W[3]);
    bar(0, 0, 0, 8, W[2], W[3]);
    bar(-9, 0, 0, 0, seatCol[1], seatCol[2]);
    bar(-9, 1, 0, 1, seatCol[2], seatCol[3]);
    bar(-9, -11, -6, -11, W[1]); bar(-9, -7, -6, -7, W[1]);
    bar(-9, 5, 0, 5, W[3]);
    const t = P(-9, -13); px.set(t[0], t[1], W[0]);
  }
  def('barricade', () => {
    const px = new G.PX(48, 46);
    // mattress: striped ticking, standing on its long edge and leaning on the stair wall
    piece(px, (t) => {
      const quad = [[5, 6], [44, 11], [46, 36], [3, 32]];
      t.poly(quad, C('#e2d8c0'));
      for (let y = 0; y < t.h; y++)
        for (let x = 0; x < t.w; x++) {
          if (!t.get(x, y)) continue;
          const s = x - y * 0.08;
          let c = Math.floor(s) % 4 === 0 ? C('#7a88a4') : Math.floor(s) % 4 === 1 ? C('#a8b0c0') : C('#e2d8c0');
          if (y > 22) c = mix(c, C('#2a2430'), (y - 22) / 26);
          t.set(x, y, c);
        }
      // top edge (lit) and tufting buttons, an old stain
      t.poly([[5, 6], [44, 11], [44, 14], [5, 9]], C('#f2eadc'));
      t.line(5, 9, 44, 14, C('#c8bca4'));
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) t.set(10 + i * 9 + j * 1, 17 + j * 8 + i, C('#5a6680'));
      for (let y = 18; y <= 26; y++) for (let x = 28; x <= 38; x++) if (Math.hypot((x - 33) / 5, (y - 22) / 3) < 1 && t.get(x, y)) t.set(x, y, mix(t.get(x, y), C('#c0a060'), 0.3));
    });
    // a school chair upside down on top of the heap, legs in the air
    piece(px, (t) => chair(t, 16, 9, Math.PI + 0.25, R('#d8b484', '#bc9666', '#9c7a4e', '#7a5c38', '#563e26'), R('#a85a48', '#8a4436', '#6a3228', '#4a2219'), false));
    // the table, upside down: underside with its apron, four legs sticking up
    piece(px, (t) => {
      const W = WOOD;
      // back legs (darker, further away)
      t.rect(8, 15, 2, 14, W[3]); t.set(8, 15, W[2]);
      t.rect(24, 15, 2, 14, W[3]); t.set(24, 15, W[2]);
      // underside (unfinished, paler) seen from above, the apron frame
      t.poly([[2, 28], [30, 28], [32, 36], [0, 36]], LWOOD[2]);
      for (let x = 2; x <= 29; x++) if (G.hash(x, 3, 1) > 0.7) t.set(x, 31, LWOOD[3]);
      t.hline(4, 28, 29, W[2]); t.hline(3, 29, 34, W[2]); t.line(4, 29, 3, 34, W[2]); t.line(28, 29, 29, 34, W[2]);
      t.hline(1, 30, 36, W[1]); t.hline(0, 31, 37, W[2]); t.hline(0, 31, 38, W[3]); t.hline(0, 31, 39, W[4]);
      t.set(0, 37, W[1]);
      // front legs
      t.rect(3, 18, 3, 16, W[2]); t.vline(3, 18, 33, W[1]); t.vline(5, 19, 33, W[3]); t.hline(3, 5, 18, W[0]);
      t.rect(26, 18, 3, 16, W[2]); t.vline(26, 18, 33, W[1]); t.vline(28, 19, 33, W[3]); t.hline(26, 28, 18, W[0]);
    });
    // a carton of junk wedged at the right
    piece(px, (t) => {
      box34(t, 32, 30, 14, 14, 5, KRAFT, KRAFT);
      t.vline(38, 30, 34, C('#e6d0a4')); t.vline(39, 30, 34, C('#cfb486'));
      t.set(35, 37, KRAFT[4]); t.set(43, 40, KRAFT[0]);
    });
    // a chair on its side on the carton, legs pointing out at you
    piece(px, (t) => chair(t, 35, 31, -Math.PI / 2 + 0.12, R('#c49c70', '#a8825a', '#8a6844', '#6a4e32', '#4a3622'), R('#7a8a6a', '#5e6e52', '#48563e', '#34402c'), true));
    // a broom handle jammed across
    piece(px, (t) => { t.line(1, 22, 14, 13, C('#c8a878')); t.line(1, 23, 14, 14, C('#8a6a48')); });
    floorShadow(px, 24, 44, 23, 2.2);
    return fr(px, 24, 46);
  });

  // =====================================================================
  //  TARP HIDING SPOT (2x1): sacks under a grey tarp; Haru hiding under it
  // =====================================================================
  function tarp(hide, k) {
    const px = new G.PX(32, 22);
    const T = R('#a4b0ba', '#86929e', '#6c7884', '#525c68', '#3a424e');
    const breath = hide && (k === 1) ? 1 : 0;
    const humps = hide ? [[7, 8, 13], [16, 9, 16], [26, 6, 10 + breath]] : [[7, 8, 13], [16, 9, 16], [26, 7, 12]];
    const top = (x) => {
      let m = 0;
      for (const [c, r, h] of humps) { const d = (x + 0.5 - c) / r; if (Math.abs(d) < 1) m = Math.max(m, h * Math.sqrt(1 - d * d)); }
      return Math.round(21 - Math.max(m, x < 2 || x > 29 ? 3 : 5));
    };
    for (let x = 0; x < 32; x++) {
      const ty = top(x), s = top(x + 1) - top(x - 1);
      for (let y = ty; y <= 20; y++) {
        const d = y - ty;
        let c = T[2];
        if (d === 0) c = s > 0 ? T[1] : T[0];
        else if (d < 3) c = s > 1 ? T[2] : T[1];
        if (y > 17) c = T[3];
        if (y === 20) c = T[4];
        px.set(x, y, c);
      }
    }
    // folds running down from the valleys between the sacks
    for (const vx of [12, 22]) for (let y = top(vx) + 1; y <= 19; y++) { px.set(vx + ((y >> 2) % 2), y, T[4]); px.set(vx + 1 + ((y >> 2) % 2), y, T[1]); }
    px.line(4, 12, 3, 19, T[3]); px.line(19, 9, 20, 17, T[3]);
    // rope tied round, with a knot
    for (let x = 1; x <= 30; x++) {
      let a = 0; for (let i = -4; i <= 4; i++) a += top(x + i);
      const y = Math.round(a / 9) + 4;
      if (y < 18 && y > top(x)) { px.set(x, y, C('#c8aa70')); px.set(x, y + 1, C('#6a5638')); }
    }
    px.set(15, 12, C('#e0c890')); px.set(16, 13, C('#c8aa70')); px.set(16, 14, C('#a88a58')); px.set(17, 15, C('#a88a58'));
    // grommets along the hem
    for (let x = 3; x < 31; x += 6) px.set(x, 18, CHROME[1]);
    // the hem lifts at the left: paper cement sacks and a brick holding the corner
    px.rect(5, 18, 6, 3, KRAFT[2]); px.hline(5, 10, 18, KRAFT[1]); px.hline(5, 10, 19, C('#8a3a2a')); px.set(10, 20, KRAFT[3]);
    px.rect(0, 16, 4, 4, C('#9a5040')); px.hline(0, 3, 16, C('#c07060')); px.vline(3, 17, 19, C('#6a342a')); px.set(1, 18, C('#7a3e30'));
    if (hide) {
      // the hem raised at the right end over a dark gap; two eyes looking out
      px.hline(23, 27, 17, VOID); px.hline(22, 28, 18, VOID); px.hline(21, 29, 19, VOID); px.hline(21, 29, 20, VOID);
      px.hline(23, 27, 16, T[0]); px.set(22, 17, T[1]); px.set(28, 17, T[2]); px.set(21, 18, T[1]); px.set(29, 18, T[3]);
      const blink = k === 3;
      if (!blink) { px.set(24, 18, C('#e8e2d8')); px.set(26, 18, C('#e8e2d8')); px.set(25, 19, C('#2a2028')); }
      else { px.set(24, 19, C('#3a3440')); px.set(26, 19, C('#3a3440')); }
      px.set(23, 20, C('#1e1a22'));
    } else {
      px.rect(22, 19, 5, 2, KRAFT[2]); px.hline(22, 26, 19, KRAFT[1]); px.set(26, 20, KRAFT[3]);
    }
    px.outline();
    floorShadow(px, 16, 21, 16, 1.2);
    return fr(px, 16, 22);
  }
  def('tarp_bags', () => tarp(false, 0));
  def('tarp_bags_hide', () => [tarp(true, 0), tarp(true, 1), tarp(true, 0), tarp(true, 2), tarp(true, 1), tarp(true, 0), tarp(true, 3), tarp(true, 0)], 2);

  // =====================================================================
  //  NIGHT OFFICE
  // =====================================================================
  // ---- grey-green steel filing cabinet: three drawers A-I / J-O / P-Z, the top one ajar (1x1) ----
  def('filing_cabinet', () => {
    const px = new G.PX(16, 33);
    const M = OGREEN;
    // top face with a stack of folders on it
    px.rect(0, 3, 16, 3, M[1]); px.hline(0, 15, 3, M[2]); px.hline(0, 15, 5, M[0]);
    px.rect(2, 1, 8, 3, C('#d8c08a')); px.hline(2, 9, 1, C('#ecd6a0')); px.hline(2, 9, 3, C('#a88c58')); px.set(9, 2, C('#b89c64'));
    px.rect(3, 0, 6, 1, C('#c8b07a')); px.set(8, 2, PAPER[0]);
    // body
    px.rect(0, 6, 16, 25, M[2]); px.vline(0, 6, 30, M[1]); px.vline(15, 6, 30, M[4]);
    const labels = ['A-I', 'J-O', 'P-Z'];
    const drawer = (y, i) => {
      bevel(px, 1, y, 14, 8, M);
      px.rect(2, y + 1, 12, 5, PAPER[1]); px.hline(2, 13, y + 1, PAPER[0]); px.vline(13, y + 1, y + 5, PAPER[3]);
      text(px, labels[i], 2 + Math.floor((12 - textW(labels[i])) / 2), y + 1, C('#56525e'));
      px.hline(4, 11, y + 6, CHROME[1]); px.set(4, y + 6, CHROME[0]); px.set(11, y + 6, CHROME[3]);
    };
    drawer(16, 1); drawer(24, 2);
    // the top drawer pulled out a little: folder tabs (each with a photo clipped on) above its front
    px.rect(1, 6, 14, 3, VOID2);
    for (let x = 2; x <= 13; x++) px.set(x, 6 + (x % 3 === 0 ? 0 : 1), x % 3 === 0 ? C('#e0c890') : C('#b8a070'));
    px.set(4, 7, PAPER[0]); px.set(10, 7, C('#9a9aa4')); px.set(7, 6, PAPER[1]);
    px.vline(1, 6, 8, M[3]); px.vline(14, 6, 8, M[3]);
    drawer(8, 0);
    px.hline(1, 14, 16, M[4]);
    // plinth
    px.hline(0, 15, 31, M[4]); px.hline(1, 14, 32, VOID2);
    px.outline();
    return fr(px, 8, 33);
  });

  // ---- grey steel office desk: papers under a lit desk lamp, a black phone, a mug (2x1) ----
  def('office_desk', () => {
    const px = new G.PX(32, 29);
    const M = OGREEN, LN = R('#dcdccc', '#c4c6b4', '#a8ac9a', '#8a8e7e', '#6a6e60');
    // desktop (linoleum, black rubber edge)
    px.rect(0, 9, 32, 7, LN[1]); px.hline(0, 31, 9, LN[2]); px.vline(31, 10, 15, LN[2]);
    px.hline(0, 31, 16, BLACK[1]); px.hline(0, 31, 17, BLACK[3]); px.set(0, 16, BLACK[0]);
    // front: two drawer pedestals and the knee hole
    px.rect(0, 18, 32, 9, M[2]); px.vline(0, 18, 26, M[1]); px.vline(31, 18, 26, M[4]);
    for (const [x, w] of [[1, 10], [21, 10]]) for (const [y, h] of [[18, 4], [22, 5]]) {
      bevel(px, x, y, w, h, M);
      px.hline(x + 3, x + w - 4, y + (h >> 1), CHROME[1]); px.set(x + w - 4, y + (h >> 1), CHROME[3]);
    }
    bevel(px, 11, 18, 10, 3, M); px.hline(14, 17, 19, CHROME[2]);
    px.rect(11, 21, 10, 6, VOID2); px.hline(11, 20, 21, M[4]);
    px.hline(0, 31, 27, M[4]); px.rect(0, 28, 2, 1, M[4]); px.rect(30, 28, 2, 1, M[4]); px.rect(11, 28, 2, 1, M[4]); px.rect(19, 28, 2, 1, M[4]);
    // papers: a stack, a loose sheet, a sheet of rounds on a clipboard
    px.rect(8, 10, 8, 5, PAPER[1]); px.hline(8, 15, 10, PAPER[0]); px.hline(8, 15, 14, PAPER[3]); px.hline(9, 15, 15, PAPER[2]);
    for (const y of [11, 13]) for (let x = 9; x <= 14; x++) if (G.hash(x, y, 9) > 0.25) px.set(x, y, C('#8a8696'));
    px.poly([[15, 11], [21, 10], [22, 14], [16, 15]], PAPER[0]);
    px.line(17, 12, 20, 11, C('#9a96a4')); px.line(17, 13, 20, 12, C('#9a96a4'));
    // mug of cold coffee
    px.rect(22, 10, 3, 3, ENAMEL[1]); px.set(22, 10, ENAMEL[0]); px.hline(23, 24, 10, C('#4a2e20')); px.set(25, 11, ENAMEL[2]); px.vline(24, 11, 12, ENAMEL[3]);
    // black phone
    const B = BLACK;
    px.rect(25, 8, 6, 5, B[2]); px.hline(25, 30, 8, B[1]); px.vline(30, 9, 12, B[3]); px.hline(25, 30, 12, B[4]);
    px.hline(24, 31, 6, B[2]); px.hline(25, 30, 5, B[1]); px.set(24, 7, B[3]); px.set(31, 7, B[3]); px.set(25, 5, B[0]);
    px.disc(27.5, 10.5, 1.5, C('#4a4650')); px.set(27, 10, C('#e8e2d4'));
    // desk lamp: round base, jointed arm, green enamel shade aimed at the papers
    const LG = R('#7aaa86', '#56866a', '#3e6a52', '#2c503e', '#1e382c');
    px.ellipse(3.5, 13, 2.6, 1.2, LG[3]); px.hline(2, 4, 12, LG[1]); px.set(2, 12, LG[0]);
    px.vline(3, 4, 12, CHROME[2]); px.vline(4, 5, 11, CHROME[4]); px.set(3, 4, CHROME[0]);
    px.line(3, 3, 6, 2, CHROME[2]);
    px.stamp(['.ssss.', 'ssssss', 'ssssss'], { s: LG[2] }, 5, 2);
    cyl(px, 5, 2, 6, 3, LG); px.hline(6, 9, 2, LG[0]);
    px.hline(5, 10, 5, C('#fff4cc')); px.set(5, 5, C('#ffe4a0')); px.set(10, 5, C('#ffe4a0'));
    // warm pool of lamplight on the desk
    spill(px, 10, 12.5, 10, 4, C('#ffe2a0'), 0.38, (i, j) => j >= 9 && j <= 15);
    px.outline();
    halo(px, 8, 6, 5, 2, '#ffe4a0', 0.18);
    floorShadow(px, 16, 28, 16, 1.2);
    return fr(px, 16, 29);
  });

  // ---- security monitor on a steel stand, a grainy grey view of the lobby (1x1, frames 2) ----
  function monitor(k) {
    const px = new G.PX(16, 30);
    const CS = R('#d6d2c6', '#bab6aa', '#9c988c', '#7c786e', '#5c5850');
    const M = OGREEN;
    // stand: top, legs, lower shelf with a recorder unit
    px.rect(0, 16, 16, 3, M[1]); px.hline(0, 15, 16, M[2]); px.hline(0, 15, 18, M[0]);
    px.hline(0, 15, 19, M[3]); px.hline(0, 15, 20, M[4]);
    px.vline(1, 21, 29, M[2]); px.vline(2, 21, 29, M[3]); px.vline(13, 21, 29, M[2]); px.vline(14, 21, 29, M[3]);
    px.rect(3, 23, 10, 3, BLACK[2]); px.hline(3, 12, 23, BLACK[1]); px.hline(4, 9, 24, BLACK[4]); px.set(11, 24, C('#d84030')); px.set(11, 25, BLACK[3]);
    px.hline(1, 14, 26, M[1]); px.hline(1, 14, 27, M[4]);
    // monitor case: top face and the bezel
    px.rect(1, 1, 14, 3, CS[1]); px.hline(1, 14, 1, CS[2]); px.hline(1, 14, 3, CS[0]);
    px.rect(1, 4, 14, 12, CS[2]); px.vline(1, 4, 15, CS[1]); px.vline(14, 4, 15, CS[3]); px.hline(1, 14, 15, CS[4]);
    px.rect(2, 4, 10, 10, C('#2a2a2e')); px.set(2, 4, CS[3]);
    // the picture: grainy grey lobby, glass doors at the back, the floor in front; a rolling bright bar
    const sx = 3, sy = 5, sw = 8, sh = 8;
    for (let y = 0; y < sh; y++)
      for (let x = 0; x < sw; x++) {
        let v = y < 4 ? 0.34 : 0.5 + (y - 4) * 0.05;
        if (y >= 1 && y <= 4 && x >= 2 && x <= 5) v = 0.22 + (x === 3 || x === 4 ? 0.06 : 0);
        if (y === 4) v = 0.42;
        v += (G.hash(x + k * 13, y + k * 7, 11) - 0.5) * 0.22;
        if (y === (k ? 6 : 2)) v += 0.18;
        const g = Math.round(G.clamp(v, 0, 1) * 200 + 30);
        px.set(sx + x, sy + y, G.pack(g, g + 4, g + 2));
      }
    px.set(sx, sy, C('#2a2a2e')); px.set(sx + sw - 1, sy, C('#2a2a2e')); px.set(sx, sy + sh - 1, C('#2a2a2e')); px.set(sx + sw - 1, sy + sh - 1, C('#2a2a2e'));
    px.hline(sx + 1, sx + 3, sy + sh - 2, C('#f0f0e8'));
    // controls: two knobs and a green power light
    px.set(12, 6, BLACK[1]); px.set(13, 6, BLACK[3]); px.set(12, 9, BLACK[1]); px.set(13, 9, BLACK[3]);
    px.set(12, 12, C('#7af08a')); px.set(13, 12, C('#3a9a4a'));
    px.outline();
    halo(px, 7, 9, 9, 8, '#c8d8e4', 0.14 + k * 0.03);
    spill(px, 7, 17, 7, 2, C('#d8e4ec'), 0.25, (i, j) => j >= 16 && j <= 18);
    floorShadow(px, 8, 29, 7.5, 1);
    return fr(px, 8, 30);
  }
  def('crt_monitor', () => frames(2, monitor), 5);

  // ---- red metal toolbox, lid open: spanners, wire cutters, tape, a pump leaning on it (1x1) ----
  def('toolbox', () => {
    const px = new G.PX(16, 18);
    const P = RED;
    // the lid swung back (inside face)
    px.rect(1, 2, 12, 6, P[3]); px.hline(1, 12, 2, P[1]); px.vline(1, 3, 7, P[2]); px.vline(12, 3, 7, P[4]); px.hline(2, 11, 4, P[4]);
    // tools sticking up out of the box
    px.line(3, 10, 5, 4, CHROME[2]); px.set(5, 3, CHROME[1]); px.set(6, 4, CHROME[2]); px.set(4, 3, CHROME[2]);       // spanner
    px.line(9, 10, 10, 5, C('#e0b840')); px.line(10, 5, 11, 3, CHROME[1]);                                       // screwdriver
    px.line(6, 10, 7, 6, C('#4a6ab8')); px.line(8, 10, 8, 6, C('#3a5aa0')); px.set(7, 5, CHROME[0]); px.set(8, 5, CHROME[2]); px.set(7, 4, CHROME[1]); // wire cutters
    // the box: open top showing the tray, front with a latch and a pressed rib
    px.rect(0, 8, 14, 3, P[1]); px.hline(1, 12, 9, VOID2); px.hline(1, 12, 8, P[0]); px.set(13, 9, P[2]);
    px.rect(11, 8, 2, 2, C('#7a7a80')); px.set(11, 8, C('#a8a8b0')); // roll of tape
    px.rect(0, 11, 14, 6, P[2]); px.vline(0, 11, 16, P[1]); px.vline(13, 11, 16, P[4]); px.hline(0, 13, 16, P[4]); px.hline(0, 13, 11, P[3]);
    px.hline(1, 12, 14, P[3]); px.hline(1, 12, 13, P[1]);
    px.rect(6, 12, 2, 2, CHROME[2]); px.set(6, 12, CHROME[0]); px.set(7, 13, CHROME[3]);
    px.set(3, 15, RUST[2]); px.set(10, 12, P[0]); px.set(11, 15, RUST[3]);
    // bicycle pump leaning on the right
    px.line(14, 16, 15, 4, STEEL[1]); px.line(15, 16, 15, 6, STEEL[3]); px.hline(13, 15, 3, BLACK[2]); px.set(13, 3, BLACK[1]);
    px.outline();
    floorShadow(px, 8, 17, 8, 1);
    return fr(px, 8, 18);
  });
})(window.G);
