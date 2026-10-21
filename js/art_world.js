// World art: procedural tilesets per theme (3/4 view walls with front faces,
// shaded pits, animated liquids) and static props (trees, rocks, lamps...).
(function (G) {
  'use strict';
  const TS = G.TS, COLS = G.COLS, ROWS = G.ROWS;
  const C = G.C;
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const bayer = (x, y) => (BAYER[y & 3][x & 3] + 0.5) / 16;
  G.bayer = bayer;

  function vnoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = G.hash(xi, yi, seed), b = G.hash(xi + 1, yi, seed), c = G.hash(xi, yi + 1, seed), d = G.hash(xi + 1, yi + 1, seed);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  G.vnoise = vnoise;
  const darken = (c, f) => G.mix(c, C('#0a0612'), f);
  const lighten = (c, f) => G.mix(c, C('#fff6e0'), f);

  // ---------------- palettes ----------------
  const TH = {
    meadow: {
      g: ['#3b7339', '#4e8c43', '#67a650', '#8cc463', '#5b9a47'],
      flowers: ['#f4e7a1', '#ef9ab8', '#ffffff', '#b2bcff'],
      path: ['#a58155', '#8b6743', '#c09a69', '#6f5236'],
      face: ['#7b5b45', '#5f4535', '#94704f', '#3f2c24'],
      top: ['#7d776c', '#99927f', '#615b52', '#4f7d3a', '#679a48'],
      pit: ['#6a4a35', '#4a3326', '#2a1c16'],
    },
    village: {
      g: ['#55803c', '#668f45', '#7da252', '#9cbc63', '#6b9246'],
      flowers: ['#f2d16b', '#e8e8e0', '#e98c8c'],
      path: ['#a88a62', '#917452', '#bea179', '#735a3f'],
      cob: ['#5e564f', '#a39886', '#958a79', '#b1a794', '#c8bfac', '#7a7063'],
      face: ['#8c806e', '#76695a', '#a59a87', '#4e443b'],
      top: ['#b4a994', '#c4baa6', '#9c917e'],
      pit: ['#6a5440', '#4a3a2c', '#251c16'],
    },
    forest: {
      g: ['#203d26', '#2b4f2e', '#36603a', '#4b7a47', '#2f5531'],
      leaves: ['#a5652b', '#c28a3a', '#7b4a24', '#8f7a2c'],
      flowers: ['#d9d36b', '#c8403a', '#e8e2d0'],
      path: ['#6b5338', '#57432e', '#7f6545', '#3e2f22'],
      hedge: ['#1c3a22', '#28502d', '#3a6a3b', '#5a8f4e', '#122617'],
      pit: ['#3d2c20', '#2a1e16', '#140e0b'],
    },
    castle: {
      fl: ['#bcae90', '#cbbe9f', '#a69777', '#86775c', '#d9ccae'],
      face: ['#5f5b74', '#555168', '#3c3949', '#8a87a0', '#2a2834'],
      top: ['#6d6a82', '#83809a', '#5d5a70'],
      g: ['#4e7a3d', '#5d8a46', '#6f9c52'],
      pit: ['#5c5666', '#3a3542', '#1a1720'],
    },
    crypt: {
      fl: ['#4d4858', '#5a5566', '#423e4c', '#2c2933', '#67627a'],
      face: ['#3a3644', '#322e3b', '#1e1c24', '#5b566a', '#16141a'],
      top: ['#211e27', '#2c2833', '#1a181f'],
      bone: ['#d8d0bc', '#a89f8a'],
      pit: ['#2e2a35', '#1c1a22', '#08070b'],
    },
    volcano: {
      fl: ['#4a3b37', '#54433e', '#3f322f', '#62504a', '#2f2423'],
      glow: ['#ff6a1f', '#ffb347', '#ffe08a'],
      face: ['#3a2b29', '#2e2221', '#4f3b37', '#1e1615'],
      top: ['#221918', '#2d2220', '#1a1312'],
      lava: ['#8a2010', '#c8401a', '#ff7a1a', '#ffb13b', '#ffe07a'],
      bridge: ['#7a6a62', '#8d7c73', '#5e504a', '#a08e83', '#43372f'],
      pit: ['#4a2a1e', '#2a1510', '#0e0605'],
    },
    void: {
      fl: ['#241a35', '#2c2141', '#1c142a', '#3a2b55', '#140e1f'],
      rune: ['#7b56d6', '#a582ff', '#4c3590'],
      face: ['#1d1430', '#2a1d44', '#140d22', '#9a6cff'],
      top: ['#3a2a55', '#46336a', '#2f2246'],
      pit: ['#1a1030', '#0e081c', '#05030a'],
    },
    street: {
      asph: ['#34353c', '#2c2d33', '#3d3e46', '#25262b'],
      mark: ['#dcdcd2', '#b8b8ae'],
      side: ['#8e8b86', '#76736e', '#a19e98', '#83807b'],
      curb: ['#b5b2ab', '#7d7a74', '#5d5a55'],
      face: ['#6b6872', '#58555f', '#7f7c86', '#3a3840'],
      top: ['#55525c', '#605d67', '#4a4750'],
      g: ['#2f4a33', '#3a5a3c', '#456a44'],
      pit: ['#3a3840', '#25232a', '#0b0a0d'],
    },
  };
  for (const k in TH) for (const j in TH[k]) TH[k][j] = TH[k][j].map((h) => C(h));
  G.THEMES = TH;

  // ---------------- helpers ----------------
  function speckle(px, X, Y, w, h, col, n, rnd) {
    for (let i = 0; i < n; i++) px.set(X + rnd.int(w), Y + rnd.int(h), col);
  }
  function grassTile(px, X, Y, pal, rnd, wx, wy, dense) {
    // big soft patches so the field doesn't look tiled
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) {
        const n = vnoise((wx + x) / 37, (wy + y) / 29, 3) * 0.7 + vnoise((wx + x) / 9, (wy + y) / 11, 5) * 0.3;
        let c = pal[1];
        if (n > 0.62 + bayer(x, y) * 0.08) c = pal[4] || pal[2];
        if (n < 0.3 + bayer(x, y) * 0.06) c = pal[0];
        px.set(X + x, Y + y, c);
      }
    // blades: a dark root with a light tip
    const blades = dense ? 16 : 10;
    for (let i = 0; i < blades; i++) {
      const x = X + rnd.int(TS), y = Y + 1 + rnd.int(TS - 1);
      px.set(x, y, pal[0]);
      px.set(x, y - 1, rnd() < 0.5 ? pal[2] : pal[3]);
      if (rnd() < 0.3) px.set(x + 1, y - 1, pal[2]);
    }
    speckle(px, X, Y, TS, TS, pal[3], 2, rnd);
  }
  function flower(px, x, y, col, center) {
    px.set(x, y - 1, col); px.set(x - 1, y, col); px.set(x + 1, y, col); px.set(x, y + 1, col);
    px.set(x, y, center);
  }
  // stones in a grid with rounded corners + highlight/shadow
  function stones(px, X, Y, wx, wy, o) {
    // o: {mortar, cols:[...], hl, sh, sw, sh2 (stone h), offsetRows}
    const sw = o.sw, sh = o.shh;
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) px.set(X + x, Y + y, o.mortar);
    const gy0 = Math.floor(wy / sh) - 1, gy1 = Math.floor((wy + TS) / sh) + 1;
    for (let gy = gy0; gy <= gy1; gy++) {
      const off = o.stagger ? ((gy & 1) * sw) / 2 : 0;
      const gx0 = Math.floor((wx - off) / sw) - 1, gx1 = Math.floor((wx + TS - off) / sw) + 1;
      for (let gx = gx0; gx <= gx1; gx++) {
        const h = G.hash(gx, gy, o.seed || 11);
        const col = o.cols[Math.floor(h * o.cols.length)];
        const sx = gx * sw + off, sy = gy * sh;
        for (let y = 1; y < sh; y++)
          for (let x = 1; x < sw; x++) {
            const corner = (x === 1 || x === sw - 1) && (y === 1 || y === sh - 1);
            if (corner) continue;
            const wxp = sx + x, wyp = sy + y;
            const lx = wxp - wx, ly = wyp - wy;
            if (lx < 0 || ly < 0 || lx >= TS || ly >= TS) continue;
            let c = col;
            if (y === 1 || x === 1) c = o.hl;
            if (y === sh - 1 || x === sw - 1) c = o.sh;
            if (o.worn && G.hash(wxp, wyp, 3) < o.worn) c = o.sh;
            px.set(X + lx, Y + ly, c);
          }
      }
    }
  }

  // ---------------- floors ----------------
  function drawFloor(px, th, ch, c, r, X, Y, L) {
    const P = TH[th];
    const rnd = G.rng(c * 131 + r * 977 + 17);
    const wx = c * TS, wy = r * TS;
    switch (th) {
      case 'meadow':
      case 'village': {
        if (ch === 'd' || (th === 'village' && ch === '=')) {
          if (th === 'village' && ch === '=') {
            stones(px, X, Y, wx, wy, { mortar: P.cob[0], cols: [P.cob[1], P.cob[2], P.cob[3]], hl: P.cob[4], sh: P.cob[5], sw: 6, shh: 5, stagger: true, seed: 4 });
            // wheel ruts
            for (let x = 0; x < TS; x++) { if (G.hash(wx + x, 1, 9) < 0.5) px.set(X + x, Y + 4, P.cob[5]); if (G.hash(wx + x, 2, 9) < 0.5) px.set(X + x, Y + 11, P.cob[5]); }
          } else {
            for (let y = 0; y < TS; y++)
              for (let x = 0; x < TS; x++) {
                const n = vnoise((wx + x) / 7, (wy + y) / 7, 8);
                px.set(X + x, Y + y, n > 0.65 ? P.path[2] : n < 0.3 ? P.path[1] : P.path[0]);
              }
            for (let i = 0; i < 4; i++) { const x = X + 1 + rnd.int(14), y = Y + 1 + rnd.int(14); px.set(x, y, P.path[2]); px.set(x, y + 1, P.path[3]); }
          }
          // soft grass edge where it touches grass
          const isG = (cc, rr) => { const k = L.at(cc, rr); return !(k === 'd' || k === '=' || G.tileInfo(k).solid || k === 'v'); };
          const edges = [[0, -1, 'top'], [0, 1, 'bot'], [-1, 0, 'l'], [1, 0, 'r']];
          for (const [dx, dy] of edges) {
            if (!isG(c + dx, r + dy)) continue;
            for (let i = 0; i < TS; i++) {
              const depth = 1 + Math.floor(G.hash(wx + i * (dy ? 1 : 0), wy + i * (dx ? 1 : 0), dx * 3 + dy * 7 + 40) * 3);
              for (let d = 0; d < depth; d++) {
                const x = dx === 0 ? i : dx < 0 ? d : TS - 1 - d;
                const y = dy === 0 ? i : dy < 0 ? d : TS - 1 - d;
                px.set(X + x, Y + y, d === depth - 1 ? P.g[0] : P.g[1]);
              }
            }
          }
          return;
        }
        grassTile(px, X, Y, P.g, rnd, wx, wy, ch === ',');
        if (ch === ',') {
          const n = 1 + rnd.int(3);
          for (let i = 0; i < n; i++) flower(px, X + 3 + rnd.int(10), Y + 3 + rnd.int(10), rnd.pick(P.flowers), C('#f7c948'));
        } else if (rnd() < 0.12) flower(px, X + 3 + rnd.int(10), Y + 3 + rnd.int(10), rnd.pick(P.flowers), C('#f7c948'));
        return;
      }
      case 'forest': {
        if (ch === 'd') {
          for (let y = 0; y < TS; y++)
            for (let x = 0; x < TS; x++) {
              const n = vnoise((wx + x) / 6, (wy + y) / 6, 8);
              px.set(X + x, Y + y, n > 0.68 ? P.path[2] : n < 0.32 ? P.path[1] : P.path[0]);
            }
          speckle(px, X, Y, TS, TS, P.path[3], 5, rnd);
          speckle(px, X, Y, TS, TS, P.leaves[2], 3, rnd);
          return;
        }
        grassTile(px, X, Y, P.g, rnd, wx, wy, false);
        // fallen leaves
        const n = ch === ',' ? 6 : 2;
        for (let i = 0; i < n; i++) { const x = X + rnd.int(15), y = Y + rnd.int(15); const col = rnd.pick(P.leaves); px.set(x, y, col); px.set(x + 1, y, darken(col, 0.25)); }
        if (ch === ',' && rnd() < 0.5) {
          // tiny mushroom
          const x = X + 4 + rnd.int(8), y = Y + 5 + rnd.int(7);
          px.set(x, y, C('#e8e2d0')); px.set(x - 1, y - 1, P.flowers[1]); px.set(x, y - 1, P.flowers[1]); px.set(x + 1, y - 1, P.flowers[1]); px.set(x, y - 2, P.flowers[1]); px.set(x, y - 1, C('#f0e0d0'));
        }
        return;
      }
      case 'castle': {
        if (ch === ',') { grassTile(px, X, Y, [P.g[0], P.g[1], P.g[2], P.g[2], P.g[1]], rnd, wx, wy, true); return; }
        stones(px, X, Y, wx, wy, { mortar: P.fl[3], cols: [P.fl[0], P.fl[0], P.fl[2], P.fl[1]], hl: P.fl[4], sh: P.fl[2], sw: 8, shh: 8, stagger: true, seed: 21, worn: 0.03 });
        if (rnd() < 0.15) { const x = X + 2 + rnd.int(10), y = Y + 2 + rnd.int(10); px.line(x, y, x + 2, y + 1, P.fl[3]); px.set(x + 3, y + 2, P.fl[3]); }
        if (rnd() < 0.1) speckle(px, X, Y, TS, TS, P.g[0], 3, rnd);
        return;
      }
      case 'crypt': {
        stones(px, X, Y, wx, wy, { mortar: P.fl[3], cols: [P.fl[0], P.fl[2], P.fl[0]], hl: P.fl[1], sh: P.fl[2], sw: 8, shh: 8, stagger: false, seed: 31, worn: 0.06 });
        if (ch === ',' || rnd() < 0.08) {
          // bones
          const x = X + 3 + rnd.int(8), y = Y + 4 + rnd.int(8);
          if (rnd() < 0.5) { px.hline(x, x + 4, y, P.bone[0]); px.set(x - 1, y - 1, P.bone[0]); px.set(x - 1, y + 1, P.bone[0]); px.set(x + 5, y - 1, P.bone[0]); px.set(x + 5, y + 1, P.bone[0]); px.hline(x, x + 4, y + 1, P.bone[1]); }
          else { px.rect(x, y, 4, 3, P.bone[0]); px.set(x + 1, y + 1, P.fl[3]); px.set(x + 3, y + 1, P.fl[3]); px.hline(x + 1, x + 2, y + 3, P.bone[1]); }
        }
        return;
      }
      case 'volcano': {
        if (ch === 'b') {
          // stone bridge slabs
          for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) px.set(X + x, Y + y, P.bridge[0]);
          for (let x = 0; x < TS; x++) { px.set(X + x, Y + 0, P.bridge[3]); px.set(X + x, Y + 15, P.bridge[2]); }
          const seam = 7 + ((c * 3) % 3);
          px.vline(X + seam, Y + 1, Y + 14, P.bridge[2]);
          px.vline(X + seam + 1, Y + 1, Y + 14, P.bridge[1]);
          speckle(px, X, Y + 1, TS, 14, P.bridge[1], 6, rnd);
          speckle(px, X, Y + 1, TS, 14, P.bridge[2], 4, rnd);
          return;
        }
        for (let y = 0; y < TS; y++)
          for (let x = 0; x < TS; x++) {
            const n = vnoise((wx + x) / 9, (wy + y) / 7, 12);
            px.set(X + x, Y + y, n > 0.72 ? P.fl[1] : n < 0.25 ? P.fl[2] : P.fl[0]);
          }
        speckle(px, X, Y, TS, TS, P.fl[3], 3, rnd);
        speckle(px, X, Y, TS, TS, P.fl[4], 3, rnd);
        if (ch === ',' || rnd() < 0.12) {
          // glowing crack
          let x = X + 2 + rnd.int(12), y = Y + 2 + rnd.int(4);
          for (let i = 0; i < 7; i++) { px.set(x, y, i % 3 === 1 ? P.glow[1] : P.glow[0]); x += rnd.int(3) - 1; y += 1; }
        }
        return;
      }
      case 'void': {
        for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) px.set(X + x, Y + y, (x === 0 || y === 0) ? P.fl[2] : P.fl[0]);
        px.set(X + 1, Y + 1, P.fl[1]);
        if ((c * 5 + r * 3) % 7 === 0 || ch === ',') {
          // rune
          const cx = X + 8, cy = Y + 8, col = ch === ',' ? P.rune[0] : P.rune[2];
          const k = (c * 7 + r * 3) % 4;
          if (k === 0) { px.vline(cx, cy - 4, cy + 4, col); px.line(cx - 3, cy - 2, cx, cy + 1, col); px.line(cx + 3, cy - 2, cx, cy + 1, col); }
          if (k === 1) { px.line(cx - 3, cy + 3, cx, cy - 4, col); px.line(cx, cy - 4, cx + 3, cy + 3, col); px.hline(cx - 2, cx + 2, cy + 1, col); }
          if (k === 2) { px.vline(cx - 2, cy - 4, cy + 4, col); px.line(cx - 2, cy - 4, cx + 2, cy - 1, col); px.line(cx + 2, cy - 1, cx - 2, cy + 1, col); }
          if (k === 3) { px.line(cx - 3, cy - 3, cx + 3, cy + 3, col); px.line(cx + 3, cy - 3, cx - 3, cy + 3, col); }
        }
        return;
      }
      case 'street': {
        if (ch === 'p') {
          // sidewalk tiles
          for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) px.set(X + x, Y + y, P.side[0]);
          for (let i = 0; i < TS; i++) { px.set(X + i, Y + 15, P.side[1]); px.set(X + 15, Y + i, P.side[1]); px.set(X + i, Y, P.side[2]); px.set(X, Y + i, P.side[2]); px.set(X + i, Y + 7, P.side[3]); }
          speckle(px, X + 1, Y + 1, 14, 14, P.side[3], 5, rnd);
          return;
        }
        if (ch === 'k') {
          // curb: top strip + face
          for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) px.set(X + x, Y + y, y < 10 ? P.side[0] : y < 13 ? P.curb[0] : P.curb[1]);
          for (let x = 0; x < TS; x++) { px.set(X + x, Y + 9, P.side[1]); px.set(X + x, Y + 15, P.curb[2]); }
          if (c % 2 === 0) px.vline(X, Y + 10, Y + 15, P.curb[1]);
          return;
        }
        // asphalt
        for (let y = 0; y < TS; y++)
          for (let x = 0; x < TS; x++) {
            const h = G.hash(wx + x, wy + y, 2);
            px.set(X + x, Y + y, h < 0.12 ? P.asph[2] : h > 0.9 ? P.asph[1] : P.asph[0]);
          }
        if (ch === '-') {
          // dashed center line
          for (let x = 2; x < 13; x++) { const worn = G.hash(wx + x, wy, 5) < 0.12; px.set(X + x, Y + 7, worn ? P.mark[1] : P.mark[0]); px.set(X + x, Y + 8, worn ? P.asph[2] : P.mark[1]); }
        }
        if (ch === 'z') {
          // crosswalk stripes (vertical road crossing: horizontal bars)
          for (let y = 0; y < TS; y++) {
            if ((y + 2) % 8 < 5) for (let x = 1; x < 15; x++) { const worn = G.hash(wx + x, wy + y, 6) < 0.08; px.set(X + x, Y + y, worn ? P.mark[1] : P.mark[0]); }
          }
        }
        return;
      }
    }
  }

  // ---------------- walls ----------------
  // Walls are drawn inside their own tile: a top face, and a front face on
  // the lower part when the tile below is open.
  const FACE = 10; // front face height in px
  function drawWall(px, th, c, r, X, Y, L) {
    const P = TH[th];
    const isW = (cc, rr) => { const i = G.tileInfo(L.at(cc, rr)); return i.wall === true; };
    const faceBelow = !isW(c, r + 1) && r + 1 < ROWS;
    const topH = faceBelow ? TS - FACE : TS;
    const wx = c * TS, wy = r * TS;
    const rnd = G.rng(c * 71 + r * 313 + 5);
    let top = P.top || [P.g[2], P.g[3], P.g[1]];
    // ----- top face -----
    if (th === 'meadow') {
      for (let y = 0; y < topH; y++)
        for (let x = 0; x < TS; x++) {
          const n = vnoise((wx + x) / 5, (wy + y) / 4, 19);
          const m = vnoise((wx + x) / 9, (wy + y) / 7, 29);
          let col = n > 0.62 ? top[1] : n < 0.32 ? top[2] : top[0];
          if (m > 0.58) col = m > 0.7 ? top[4] : top[3];
          px.set(X + x, Y + y, col);
        }
      speckle(px, X, Y, TS, topH, top[2], 5, rnd);
    } else if (th === 'forest') {
      for (let y = 0; y < topH; y++)
        for (let x = 0; x < TS; x++) {
          const n = vnoise((wx + x) / 4, (wy + y) / 4, 21);
          px.set(X + x, Y + y, n > 0.7 ? P.hedge[3] : n > 0.45 ? P.hedge[2] : n > 0.25 ? P.hedge[1] : P.hedge[0]);
        }
    } else if (th === 'void') {
      for (let y = 0; y < topH; y++) for (let x = 0; x < TS; x++) px.set(X + x, Y + y, G.hash(wx + x, wy + y, 4) < 0.06 ? top[1] : top[0]);
    } else {
      // stone cap
      stones(px, X, Y, wx, wy, { mortar: darken(top[0], 0.25), cols: [top[0], top[2], top[0]], hl: top[1], sh: top[2], sw: th === 'street' ? 16 : 8, shh: 8, stagger: true, seed: 41 });
      if (th === 'volcano') speckle(px, X, Y, TS, topH, P.top[1], 6, rnd);
    }
    // clear area for face
    // rims where the top meets open ground
    const rimL = !isW(c - 1, r), rimR = !isW(c + 1, r), rimT = !isW(c, r - 1) && r > 0;
    const rimCol = th === 'meadow' ? C('#b7b09c') : th === 'forest' ? P.hedge[3] : th === 'void' ? P.face[3] : lighten(top[0], 0.3);
    const edgeCol = th === 'meadow' ? C('#3f3a33') : th === 'forest' ? P.hedge[4] : darken(top[0], 0.4);
    if (rimT) for (let x = 0; x < TS; x++) { px.set(X + x, Y, edgeCol); px.set(X + x, Y + 1, rimCol); }
    if (rimL) for (let y = 0; y < topH; y++) { px.set(X, Y + y, edgeCol); px.set(X + 1, Y + y, G.mix(rimCol, px.get(X + 2, Y + y), 0.5)); }
    if (rimR) for (let y = 0; y < topH; y++) { px.set(X + 15, Y + y, edgeCol); }
    // ----- front face -----
    if (faceBelow) {
      const Fy = Y + topH;
      const F = P.face || [P.hedge[1], P.hedge[0], P.hedge[2], P.hedge[4]];
      for (let y = 0; y < FACE; y++)
        for (let x = 0; x < TS; x++) {
          let col = F[0];
          const wxp = wx + x, wyp = y;
          if (th === 'meadow') {
            // earthy cliff with strata
            const n = vnoise(wxp / 5, (wy + y) / 2.5, 13);
            col = n > 0.6 ? F[2] : n < 0.35 ? F[1] : F[0];
            if (y === 3 && G.hash(wxp, wy, 2) < 0.6) col = F[1];
          } else if (th === 'forest') {
            const n = vnoise(wxp / 3, (wy + y) / 3, 23);
            col = n > 0.62 ? F[2] : n < 0.35 ? F[3] : F[0];
          } else if (th === 'volcano') {
            const n = vnoise(wxp / 4, (wy + y) / 3, 25);
            col = n > 0.6 ? F[2] : n < 0.35 ? F[1] : F[0];
          } else if (th === 'void') {
            col = y === 0 ? F[3] : (wxp % 8 === 0) ? F[2] : F[0];
          } else {
            // bricks
            const bh = 4, bw = 8;
            const row = Math.floor(y / bh);
            const off = (row + r) & 1 ? bw / 2 : 0;
            const bx = G.mod(wxp + off, bw);
            const by = y % bh;
            const brick = Math.floor((wxp + off) / bw);
            col = G.hash(brick, row + r * 7, 9) < 0.5 ? F[0] : F[1];
            if (by === 0 || bx === 0) col = F[2];
            if (by === 1 && bx !== 0) col = lighten(col, 0.08);
          }
          // vertical shading: darker toward the bottom
          if (y >= FACE - 2) col = darken(col, 0.25 + (y - (FACE - 2)) * 0.15);
          px.set(X + x, Fy + y, col);
        }
      // lip: bright line along the top edge of the face
      for (let x = 0; x < TS; x++) px.set(X + x, Fy, th === 'meadow' ? C('#3f3a33') : th === 'forest' ? P.hedge[4] : darken(top[0], 0.45));
      if (th === 'meadow') {
        // grass overhang + hanging roots
        for (let x = 0; x < TS; x++) {
          if (G.hash(wx + x, wy, 31) < 0.45) px.set(X + x, Fy, P.g[1]);
          if (G.hash(wx + x, wy, 32) < 0.2) { px.set(X + x, Fy + 1, P.g[0]); }
          if (G.hash(wx + x, wy, 33) < 0.08) { px.vline(X + x, Fy + 1, Fy + 3 + Math.floor(G.hash(x, wy, 1) * 3), C('#5b4232')); }
        }
      }
      if (th === 'forest') {
        for (let x = 0; x < TS; x++) if (G.hash(wx + x, wy, 34) < 0.12) px.vline(X + x, Fy + 1, Fy + 2 + Math.floor(G.hash(x, wy, 2) * 4), P.hedge[2]);
      }
      if (th === 'volcano') {
        // lava glow at the base
        for (let x = 0; x < TS; x++) if (G.hash(wx + x, wy, 35) < 0.3) px.set(X + x, Fy + FACE - 1, P.face[2]);
      }
      if (rimL) for (let y = 0; y < FACE; y++) px.set(X, Fy + y, darken(px.get(X, Fy + y), 0.3));
      if (rimR) for (let y = 0; y < FACE; y++) px.set(X + 15, Fy + y, darken(px.get(X + 15, Fy + y), 0.45));
    }
  }

  // ---------------- pits ----------------
  function drawPit(px, th, c, r, X, Y, L, aboveOpen) {
    const P = TH[th];
    const pit = P.pit;
    const wx = c * TS;
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) px.set(X + x, Y + y, pit[2]);
    if (th === 'void') {
      for (let i = 0; i < 4; i++) {
        const h = G.hash(c * 5 + i, r * 3, 77);
        px.set(X + Math.floor(h * 16), Y + Math.floor(G.hash(c, r * 9 + i, 78) * 16), h < 0.3 ? C('#c9b8ff') : C('#5a4a90'));
      }
    }
    if (aboveOpen) {
      // cross-section of the ground at the far edge
      const depth = 7;
      for (let y = 0; y < depth; y++)
        for (let x = 0; x < TS; x++) {
          const u = y / depth;
          let col = u < 0.35 ? pit[0] : u < 0.7 ? pit[1] : pit[2];
          if (bayer(x, y) < 0.25 && u >= 0.35 && u < 0.45) col = pit[0];
          if (bayer(x, y) < 0.25 && u >= 0.7 && u < 0.8) col = pit[1];
          if (th === 'meadow' && y === 2 && G.hash(wx + x, r, 3) < 0.3) col = C('#8a6a4c');
          px.set(X + x, Y + y, col);
        }
      if (th === 'meadow' || th === 'forest' || th === 'village') {
        for (let x = 0; x < TS; x++) if (G.hash(wx + x, r, 4) < 0.1) px.vline(X + x, Y + 1, Y + 3 + Math.floor(G.hash(x, r, 5) * 4), C('#4a3326'));
      }
    }
    // dark rims on the sides
    const isPit = (cc, rr) => { const k = L.at(cc, rr); return k === 'v' || (L._dynPit && L._dynPit(cc, rr)); };
    if (!isPit(c - 1, r)) for (let y = 0; y < TS; y++) px.set(X, Y + y, darken(pit[1], 0.3));
    if (!isPit(c + 1, r)) for (let y = 0; y < TS; y++) px.set(X + 15, Y + y, darken(pit[1], 0.3));
  }
  G.drawPitTile = drawPit;
  G.drawTileFloor = function (px, th, ch, c, r, X, Y, L) { drawFloor(px, th, ch, c, r, X, Y, L); };

  // ---------------- shadows from walls ----------------
  function shadePass(px, L, ox, oy) {
    const isS = (cc, rr) => G.tileInfo(L.at(cc, rr)).wall === true;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        if (isS(c, r) || L.at(c, r) === 'v') continue;
        const X = ox + c * TS, Y = oy + r * TS;
        if (isS(c, r - 1)) for (let y = 0; y < 4; y++) for (let x = 0; x < TS; x++) if (bayer(x, y) < 1 - y / 4) px.set(X + x, Y + y, darken(px.get(X + x, Y + y), 0.35 - y * 0.06));
        if (isS(c - 1, r)) for (let y = 0; y < TS; y++) for (let x = 0; x < 3; x++) if (bayer(x, y) < 1 - x / 3) px.set(X + x, Y + y, darken(px.get(X + x, Y + y), 0.22));
      }
  }

  // ---------------- liquids (animated) ----------------
  const liquidFrames = {};
  function liquidTile(kind, th, frame) {
    const key = kind + th + frame;
    if (liquidFrames[key]) return liquidFrames[key];
    const px = new G.PX(TS, TS);
    if (kind === 'lava') {
      const P = TH.volcano.lava;
      for (let y = 0; y < TS; y++)
        for (let x = 0; x < TS; x++) {
          const t = frame / 8;
          const n = vnoise(x / 6 + Math.sin(t * Math.PI * 2) * 0.7, y / 5 + t * 2, 50) * 0.6 + vnoise(x / 3 - t * 3, y / 3, 51) * 0.4;
          px.set(x, y, n > 0.72 ? P[4] : n > 0.58 ? P[3] : n > 0.4 ? P[2] : n > 0.28 ? P[1] : P[0]);
        }
    } else {
      const deep = C('#1d4a7a'), mid = C('#2b6aa0'), lt = C('#5aa0d8'), foam = C('#cfe8ff');
      for (let y = 0; y < TS; y++)
        for (let x = 0; x < TS; x++) {
          const n = vnoise(x / 5 + frame * 0.5, y / 4, 60);
          px.set(x, y, n > 0.6 ? mid : deep);
        }
      for (let i = 0; i < 3; i++) {
        const y = (i * 5 + frame * 2) % 16, x0 = (i * 7 + frame * 3) % 12;
        px.hline(x0, x0 + 3, y, lt);
        if (i === 0) px.set(x0 + 1, y, foam);
      }
    }
    return (liquidFrames[key] = px.canvas());
  }
  G.liquidTile = liquidTile;

  // ---------------- crack overlay frames for cracked floors ----------------
  const crackCache = {};
  G.crackOverlay = function (stage) {
    if (crackCache[stage]) return crackCache[stage];
    const px = new G.PX(TS, TS);
    const ink = C('#140c1c', 0.85), lite = C('#ffffff', 0.25);
    const lines = [
      [[8, 8], [4, 3], [2, 1]], [[8, 8], [13, 5], [15, 2]], [[8, 8], [5, 13], [3, 15]], [[8, 8], [12, 12], [14, 15]],
      [[8, 8], [1, 8]], [[8, 8], [15, 9]], [[4, 3], [6, 0]], [[12, 12], [15, 11]],
    ];
    const n = [2, 4, 8][stage];
    for (let i = 0; i < n; i++) {
      const L = lines[i];
      for (let k = 0; k + 1 < L.length; k++) {
        px.line(L[k][0], L[k][1], L[k + 1][0], L[k + 1][1], ink);
        px.line(L[k][0] + 1, L[k][1], L[k + 1][0] + 1, L[k + 1][1], lite);
      }
    }
    return (crackCache[stage] = px.canvas());
  };

  // ---------------- spikes ----------------
  const spikeCache = {};
  G.spikeTile = function (th, stage) {
    // stage 0 down, 1 peek, 2 up
    const key = th + stage;
    if (spikeCache[key]) return spikeCache[key];
    const px = new G.PX(TS, TS);
    const plate = th === 'volcano' ? C('#4b3a37') : th === 'crypt' ? C('#3a3644') : C('#8c8794');
    const hole = C('#1a1420'), metal = C('#d6dbe6'), metalD = C('#8f96a8'), metalDD = C('#5a6070');
    px.rect(1, 1, 14, 14, darken(plate, 0.1));
    px.hline(1, 14, 1, lighten(plate, 0.15));
    px.hline(1, 14, 14, darken(plate, 0.35));
    const spots = [[4, 5], [11, 5], [4, 12], [11, 12], [7.5, 8.5]];
    for (const [sx, sy] of spots) {
      const x = Math.round(sx), y = Math.round(sy);
      px.rect(x - 1, y - 1, 3, 2, hole);
      if (stage === 1) { px.set(x, y - 2, metal); px.set(x, y - 1, metalD); }
      if (stage === 2) {
        // cone in 3/4: tip up
        px.vline(x, y - 6, y - 1, metal);
        px.vline(x + 1, y - 4, y - 1, metalD);
        px.vline(x - 1, y - 4, y - 1, metal);
        px.set(x - 1, y - 1, metalD);
        px.set(x + 1, y - 1, metalDD);
        px.set(x, y - 6, C('#ffffff'));
      }
    }
    return (spikeCache[key] = px.canvas());
  };

  // ---------------- props ----------------
  // Each prop builder returns a frame anchored at its base (bottom center).
  function shadeDisc(px, cx, cy, rad, base, hi, lo, lx, ly) {
    for (let y = Math.floor(cy - rad - 1); y <= cy + rad + 1; y++)
      for (let x = Math.floor(cx - rad - 1); x <= cx + rad + 1; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        const d = Math.hypot(dx, dy);
        if (d > rad) continue;
        const l = (dx * lx + dy * ly) / rad; // -1..1 toward light
        let c = base;
        if (l > 0.35 + bayer(x, y) * 0.2) c = hi;
        else if (l < -0.25 - bayer(x, y) * 0.2) c = lo;
        px.set(x, y, c);
      }
  }
  G.shadeDisc = shadeDisc;
  const PROPF = {};
  function propTree(th, variant) {
    const key = 'tree' + th + variant;
    if (PROPF[key]) return PROPF[key];
    const W = 34, Hh = 44;
    const px = new G.PX(W, Hh);
    const rnd = G.rng(variant * 99 + 7);
    let leaf = [C('#2f6b35'), C('#3f8a3f'), C('#5daa4e'), C('#86c75f'), C('#1f4a27')];
    if (th === 'forest') leaf = [C('#1b3d22'), C('#25502b'), C('#336a36'), C('#4f8a47'), C('#10261a')];
    if (th === 'village') leaf = [C('#3d6b30'), C('#4f8238'), C('#6c9f47'), C('#93c05c'), C('#28471f')];
    const bark = [C('#6b4a33'), C('#4f3424'), C('#8a6446')];
    if (th === 'volcano') {
      // dead charred tree
      px.thick(17, 43, 17, 18, 1.6, C('#3a2a25'));
      px.thick(17, 26, 9, 15, 1, C('#3a2a25'));
      px.thick(17, 22, 26, 12, 1, C('#3a2a25'));
      px.thick(10, 16, 6, 9, 0.6, C('#3a2a25'));
      px.thick(24, 14, 28, 8, 0.6, C('#3a2a25'));
      px.vline(16, 24, 42, C('#55403a'));
      px.outline();
      return (PROPF[key] = G.frame(px, 17, 43));
    }
    // trunk
    px.rect(14, 28, 6, 15, bark[0]);
    px.vline(14, 28, 42, bark[2]);
    px.vline(19, 28, 42, bark[1]);
    px.vline(17, 33, 38, bark[1]);
    px.set(13, 42, bark[0]); px.set(20, 42, bark[1]); px.set(12, 43, bark[1]); px.set(21, 43, bark[1]);
    // canopy: overlapping clusters, back to front
    const cl = [
      [17, 16, 11], [9, 20, 7], [25, 20, 7], [12, 11, 7], [22, 10, 7], [17, 7, 6], [17, 23, 8], [8, 14, 5], [27, 14, 5],
    ];
    if (th === 'forest') cl.push([17, 3, 4]);
    for (const [cx, cy, rr] of cl) shadeDisc(px, cx + rnd.range(-1, 1), cy, rr, leaf[1], leaf[2], leaf[0], -0.7, -0.7);
    // leaf texture
    for (let i = 0; i < 70; i++) {
      const x = 4 + rnd.int(27), y = 2 + rnd.int(28);
      const c0 = px.get(x, y);
      if (!c0) continue;
      if (c0 === leaf[2] && rnd() < 0.6) { px.set(x, y, leaf[3]); }
      else if (c0 === leaf[0]) px.set(x, y, leaf[4]);
      else if (c0 === leaf[1] && rnd() < 0.5) { px.set(x, y, leaf[0]); px.set(x + 1, y - 1, leaf[2]); }
    }
    if (th === 'village' && variant % 2 === 0) for (let i = 0; i < 6; i++) { const x = 6 + rnd.int(22), y = 8 + rnd.int(16); if (px.get(x, y)) { px.set(x, y, C('#d8443a')); px.set(x, y - 1, C('#ff8a6a')); } }
    px.outline();
    return (PROPF[key] = G.frame(px, 17, 43));
  }
  function propRock(th) {
    const key = 'rock' + th;
    if (PROPF[key]) return PROPF[key];
    const px = new G.PX(18, 16);
    let base = C('#8a8790'), hi = C('#b3b0b8'), lo = C('#5d5a66');
    if (th === 'volcano') { base = C('#4a3a36'); hi = C('#6a5650'); lo = C('#2c2220'); }
    if (th === 'forest') { base = C('#5f6a5c'); hi = C('#7f8a78'); lo = C('#3c4539'); }
    shadeDisc(px, 9, 9, 7, base, hi, lo, -0.7, -0.7);
    shadeDisc(px, 6, 11, 4.5, base, hi, lo, -0.7, -0.7);
    shadeDisc(px, 12.5, 11.5, 4, lo, base, darken(lo, 0.3), -0.7, -0.7);
    if (th === 'forest' || th === 'meadow') for (let x = 4; x < 12; x++) if (G.hash(x, 3, 3) < 0.6) px.set(x, 3 + (x % 2), C('#4e8c43'));
    px.line(8, 6, 10, 9, lo);
    px.outline();
    return (PROPF[key] = G.frame(px, 9, 15));
  }
  function propSign() {
    if (PROPF.sign) return PROPF.sign;
    const px = new G.PX(20, 24);
    const wood = C('#a87a4c'), woodD = C('#7a5534'), woodL = C('#c99a64');
    px.rect(9, 10, 2, 13, woodD);
    px.vline(9, 10, 22, wood);
    // arrow board pointing right
    px.poly([[2, 3], [14, 3], [18, 7.5], [14, 12], [2, 12]], wood);
    px.hline(2, 13, 3, woodL);
    px.hline(2, 13, 11, woodD);
    px.line(14, 11, 17, 8, woodD);
    // painted arrow
    const ink = C('#3a2414');
    px.hline(5, 12, 7, ink); px.hline(5, 12, 8, ink);
    px.line(10, 5, 13, 7, ink); px.line(10, 10, 13, 8, ink);
    px.outline();
    return (PROPF.sign = G.frame(px, 10, 23));
  }
  function propBarrel() {
    if (PROPF.barrel) return PROPF.barrel;
    const px = new G.PX(16, 20);
    const w = C('#9a6a3e'), wd = C('#6e4a2a'), wl = C('#c08a52'), band = C('#5a5560'), bandL = C('#8f8a98');
    px.rect(2, 4, 12, 15, w);
    px.vline(2, 4, 18, wd); px.vline(13, 4, 18, wd); px.vline(4, 4, 18, wl); px.vline(9, 5, 18, wd);
    px.ellipse(8, 4, 6, 2.5, wl); px.ellipse(8, 4, 4.5, 1.5, wd);
    px.hline(2, 13, 8, band); px.hline(2, 13, 15, band); px.set(4, 8, bandL); px.set(4, 15, bandL);
    px.outline();
    return (PROPF.barrel = G.frame(px, 8, 19));
  }
  function propCrate() {
    if (PROPF.crate) return PROPF.crate;
    const px = new G.PX(16, 18);
    const w = C('#b08454'), wd = C('#7a5534'), wl = C('#d4a66a');
    px.rect(1, 1, 14, 5, wl); px.rect(1, 6, 14, 11, w);
    px.hline(1, 14, 6, wd); px.hline(1, 14, 16, wd);
    px.vline(1, 6, 16, wd); px.vline(14, 6, 16, wd);
    px.line(2, 7, 13, 15, wd); px.line(2, 15, 13, 7, wl);
    px.outline();
    return (PROPF.crate = G.frame(px, 8, 17));
  }
  function propLamp(th) {
    const key = 'lamp' + th;
    if (PROPF[key]) return PROPF[key];
    const px = new G.PX(14, 40);
    const pole = th === 'street' ? C('#6a6f78') : C('#3a3540'), poleL = th === 'street' ? C('#9aa0aa') : C('#5a5462');
    px.rect(6, 10, 2, 29, pole); px.vline(6, 10, 38, poleL);
    px.rect(4, 36, 6, 3, pole);
    if (th === 'street') {
      px.rect(3, 4, 8, 3, pole); px.hline(3, 10, 4, poleL);
      px.rect(4, 7, 6, 2, C('#fff2c0'));
    } else {
      px.rect(3, 2, 8, 9, C('#2a2530'));
      px.rect(4, 4, 6, 6, C('#ffd27a'));
      px.rect(5, 5, 4, 4, C('#fff3c4'));
      px.hline(2, 11, 2, poleL); px.set(7, 0, pole); px.set(6, 1, pole); px.set(7, 1, pole);
    }
    px.outline();
    return (PROPF[key] = G.frame(px, 7, 39));
  }
  function propGrave(v) {
    const key = 'grave' + v;
    if (PROPF[key]) return PROPF[key];
    const px = new G.PX(16, 20);
    const s = C('#7d7888'), sl = C('#a39eae'), sd = C('#55505f');
    if (v % 2) {
      px.rect(3, 6, 10, 13, s); px.ellipse(8, 6, 5, 4, s);
      px.vline(3, 5, 18, sl); px.vline(12, 5, 18, sd);
      px.hline(6, 10, 9, sd); px.vline(8, 7, 14, sd);
    } else {
      px.rect(7, 3, 3, 16, s); px.rect(3, 7, 11, 3, s); px.vline(7, 3, 18, sl); px.hline(3, 13, 7, sl);
    }
    px.hline(1, 14, 18, C('#3c4539'));
    px.outline();
    return (PROPF[key] = G.frame(px, 8, 19));
  }
  function propPillar(th) {
    const key = 'pillar' + th;
    if (PROPF[key]) return PROPF[key];
    const px = new G.PX(16, 36);
    const P = th === 'void' ? [C('#3a2a55'), C('#5a4384'), C('#1d1430')] : th === 'crypt' ? [C('#55505e'), C('#6f6a7a'), C('#35313e')] : [C('#b9b4c2'), C('#d6d2dd'), C('#8a8496')];
    px.rect(2, 30, 12, 5, P[0]); px.hline(2, 13, 30, P[1]);
    px.rect(3, 6, 10, 24, P[0]);
    px.vline(4, 6, 29, P[1]); px.vline(5, 6, 29, P[1]); px.vline(11, 6, 29, P[2]); px.vline(12, 6, 29, P[2]); px.vline(8, 6, 29, P[2]);
    px.rect(1, 2, 14, 4, P[0]); px.hline(1, 14, 2, P[1]); px.hline(1, 14, 5, P[2]);
    if (th === 'void') { px.vline(8, 10, 24, C('#a582ff')); px.set(8, 17, C('#ffffff')); }
    px.outline();
    return (PROPF[key] = G.frame(px, 8, 35));
  }
  function propStatue() {
    if (PROPF.statue) return PROPF.statue;
    const px = new G.PX(18, 38);
    const s = C('#a39eae'), sl = C('#c9c5d1'), sd = C('#76708a');
    px.rect(2, 30, 14, 7, sd); px.hline(2, 15, 30, s);
    // knight statue on plinth
    px.ellipse(9, 8, 3.5, 4, s); px.set(8, 7, sd); px.set(10, 7, sd); px.hline(7, 11, 8, sd);
    px.rect(5, 12, 8, 10, s); px.vline(5, 12, 21, sl); px.vline(12, 12, 21, sd);
    px.rect(6, 22, 2, 8, s); px.rect(10, 22, 2, 8, sd);
    px.vline(14, 4, 28, sl); px.hline(12, 16, 10, sl);
    px.outline();
    return (PROPF.statue = G.frame(px, 9, 37));
  }
  function propBush(th) {
    const key = 'bush' + th;
    if (PROPF[key]) return PROPF[key];
    const px = new G.PX(20, 16);
    let leaf = [C('#2f6b35'), C('#3f8a3f'), C('#5daa4e')];
    if (th === 'forest') leaf = [C('#1b3d22'), C('#25502b'), C('#336a36')];
    shadeDisc(px, 6, 10, 5, leaf[1], leaf[2], leaf[0], -0.7, -0.7);
    shadeDisc(px, 14, 10, 5, leaf[1], leaf[2], leaf[0], -0.7, -0.7);
    shadeDisc(px, 10, 7, 6, leaf[1], leaf[2], leaf[0], -0.7, -0.7);
    px.outline();
    return (PROPF[key] = G.frame(px, 10, 15));
  }
  function propCrystal() {
    if (PROPF.crystal) return PROPF.crystal;
    const px = new G.PX(16, 24);
    const a = C('#8a5cff'), b = C('#c7a8ff'), d = C('#4a2f9a');
    px.poly([[8, 1], [12, 8], [10, 22], [6, 22], [4, 8]], a);
    px.poly([[8, 1], [8, 22], [6, 22], [4, 8]], b);
    px.poly([[12, 8], [14, 12], [12, 22], [10, 22]], d);
    px.line(8, 2, 8, 20, C('#ffffff', 0.7));
    px.outline();
    return (PROPF.crystal = G.frame(px, 8, 23));
  }
  function propVending() {
    if (PROPF.vending) return PROPF.vending;
    const px = new G.PX(18, 30);
    px.rect(1, 1, 16, 28, C('#d84a4a'));
    px.rect(2, 2, 14, 12, C('#e8f4ff'));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { px.rect(3 + j * 3, 3 + i * 4, 2, 3, [C('#3a7ad8'), C('#f0c040'), C('#50b060'), C('#e86a3a')][(i + j) % 4]); }
    px.rect(3, 16, 12, 2, C('#2a2a30'));
    px.rect(11, 19, 4, 3, C('#2a2a30'));
    px.rect(3, 23, 12, 4, C('#3a3a42'));
    px.vline(1, 1, 28, C('#ff7a7a')); px.vline(16, 1, 28, C('#9a2a2a'));
    px.outline();
    return (PROPF.vending = G.frame(px, 9, 29));
  }
  function propAltar() {
    if (PROPF.altar) return PROPF.altar;
    const px = new G.PX(20, 18);
    px.rect(1, 6, 18, 11, C('#2a1d44'));
    px.rect(1, 3, 18, 4, C('#46336a'));
    px.hline(1, 18, 3, C('#7b56d6'));
    px.rect(8, 8, 4, 6, C('#7b56d6'));
    px.outline();
    return (PROPF.altar = G.frame(px, 10, 17));
  }
  function propFence(th) {
    const key = 'fence' + th;
    if (PROPF[key]) return PROPF[key];
    const px = new G.PX(16, 18);
    const w = C('#a07448'), wd = C('#6e4a2a'), wl = C('#c99a64');
    px.rect(1, 5, 3, 12, w); px.rect(12, 5, 3, 12, w);
    px.vline(1, 5, 16, wl); px.vline(12, 5, 16, wl);
    px.rect(0, 8, 16, 2, wl); px.rect(0, 13, 16, 2, w); px.hline(0, 15, 14, wd);
    px.outline();
    return (PROPF[key] = G.frame(px, 8, 17));
  }

  G.propFrame = function (kind, th, c, r) {
    const v = (c * 7 + r * 13) % 4;
    switch (kind) {
      case 'tree': return propTree(th, v);
      case 'rock': return propRock(th);
      case 'sign': return propSign();
      case 'barrel': return propBarrel();
      case 'crate': return propCrate();
      case 'lamp': return propLamp(th);
      case 'grave': return propGrave(v);
      case 'pillar': return propPillar(th);
      case 'statue': return propStatue();
      case 'bush': return propBush(th);
      case 'crystal': return propCrystal();
      case 'vending': return propVending();
      case 'altar': return propAltar();
      case 'fence': return propFence(th);
    }
    return null;
  };

  // ---------------- whole map ----------------
  // Returns {bg: canvas (level-sized), props: [{x,y,f,kind}], lights: [...]}
  G.renderMap = function (L) {
    const th = L.theme;
    const W = G.COLS * TS, Hh = G.ROWS * TS;
    const px = new G.PX(W, Hh);
    const props = [], lights = [];
    // floors first (also under props and traps)
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const ch = L.at(c, r);
        const inf = G.tileInfo(ch);
        const X = c * TS, Y = r * TS;
        if (inf.wall) continue;
        let fch = ch;
        if (inf.prop || inf.trap || inf.spikes || inf.water || inf.lava) fch = L.def.floorUnder && L.def.floorUnder[ch] || '.';
        if (ch === 'v') {
          const k = L.at(c, r - 1);
          drawPit(px, th, c, r, X, Y, L, k !== 'v' && r > 0);
          continue;
        }
        drawFloor(px, th, fch, c, r, X, Y, L);
        if (inf.trap === 1) {
          // hidden trap: almost invisible tell (a hairline)
          const rnd = G.rng(c * 17 + r);
          const x0 = X + 3 + rnd.int(8), y0 = Y + 4 + rnd.int(8);
          px.set(x0, y0, darken(px.get(x0, y0), 0.18));
          px.set(x0 + 1, y0 + 1, darken(px.get(x0 + 1, y0 + 1), 0.18));
        }
        if (inf.prop) props.push({ x: X + 8, y: Y + 14, kind: inf.prop, c: c, r: r });
      }
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const inf = G.tileInfo(L.at(c, r));
        if (inf.wall) drawWall(px, th, c, r, c * TS, r * TS, L);
        if (inf.torch) lights.push({ x: c * TS + 8, y: r * TS + 10, r: 56, col: '#ffb04a', flicker: true, torch: true });
      }
    shadePass(px, L, 0, 0);
    // prop ground shadows baked into the bg
    for (const p of props) {
      const f = G.propFrame(p.kind, th, p.c, p.r);
      p.f = f;
      const rw = p.kind === 'tree' ? 10 : 7;
      for (let y = -3; y <= 3; y++)
        for (let x = -rw; x <= rw; x++) {
          if ((x * x) / (rw * rw) + (y * y) / 9 > 1) continue;
          const X = p.x + x + 2, Y = p.y + y + 1;
          if (bayer(X, Y) < 0.6) px.set(X, Y, darken(px.get(X, Y), 0.35));
        }
      if (p.kind === 'lamp') lights.push({ x: p.x, y: p.y - 30, r: 70, col: th === 'street' ? '#ffe6a8' : '#ffc870', flicker: th !== 'street' });
      if (p.kind === 'crystal') lights.push({ x: p.x, y: p.y - 10, r: 40, col: '#a582ff' });
    }
    return { bg: px.canvas(), props: props, lights: lights, px: px };
  };

  // the floor tile under (c,r) as its own canvas (for collapse animations)
  const floorCache = {};
  G.floorTileCanvas = function (L, c, r) {
    const key = L.id + ':' + c + ':' + r;
    if (floorCache[key]) return floorCache[key];
    const px = new G.PX(TS, TS);
    const ch = L.at(c, r);
    const fch = (L.def.floorUnder && L.def.floorUnder[ch]) || '.';
    drawFloor(px, L.theme, fch, c, r, 0, 0, L);
    return (floorCache[key] = px.canvas());
  };
  G.pitTileCanvas = function (L, c, r, aboveOpen) {
    const px = new G.PX(TS, TS);
    drawPit(px, L.theme, c, r, 0, 0, L, aboveOpen);
    return px.canvas();
  };
})(window.G);
