// NOBODY HOME art: pics (names and sizes: docs/ART_LIST.md).
// Full-screen pictures (E.picture / E.glimpse) and two close-up scares. Every picture is a small
// pixel painting: limited ramps, ordered dithering, light from the top-left.
// Pictures are at most 95px tall so the picture viewer shows them at 2x (anchor (w/2, h)).
(function (G) {
  'use strict';
  const C = G.C;
  const clamp = G.clamp;
  const R = (...a) => a.map((h) => C(h));
  const bay = G.bayer;
  const M = 0xffffffff; // mask ink

  // ---------------- helpers ----------------
  // pick from a ramp with ordered dithering (v in 0..1)
  const dv = (r, v, x, y) => r[Math.min(r.length - 1, Math.floor(clamp(v, 0, 0.9999) * (r.length - 1) + bay(x, y)))];
  // pick from a ramp without dithering
  const sv = (r, v) => r[clamp(Math.round(clamp(v, 0, 1) * (r.length - 1)), 0, r.length - 1)];
  function fill(px, x0, y0, w, h, fn) {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        const c = fn(x, y);
        if (c) px.set(x, y, c);
      }
  }
  // a mask is just a PX drawn with M
  function mask(w, h, draw) { const m = new G.PX(w, h); draw(m, M); return m; }
  const inM = (m, x, y) => m.get(x, y) !== 0;
  // Volume shading for any silhouette: distance-to-edge gives a rounded height field, its normal
  // is lit from the top-left. o: r (roundness radius), amb, dif, light [x,y,z], add(x,y) -> extra
  // value, rampAt(x,y) -> ramp, clip(x,y) -> bool, nodither.
  function shade(dst, m, ramp, o) {
    o = o || {};
    const w = m.w, h = m.h, rr = o.r || 4, N = w * h;
    const D = new Float32Array(N);
    for (let i = 0; i < N; i++) D[i] = m.d[i] ? 1e6 : 0;
    const S2 = 1.414;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!D[i]) continue;
        let v = D[i];
        if (x > 0) v = Math.min(v, D[i - 1] + 1);
        if (y > 0) {
          v = Math.min(v, D[i - w] + 1);
          if (x > 0) v = Math.min(v, D[i - w - 1] + S2);
          if (x < w - 1) v = Math.min(v, D[i - w + 1] + S2);
        }
        D[i] = v;
      }
    for (let y = h - 1; y >= 0; y--)
      for (let x = w - 1; x >= 0; x--) {
        const i = y * w + x;
        if (!D[i]) continue;
        let v = D[i];
        if (x < w - 1) v = Math.min(v, D[i + 1] + 1);
        if (y < h - 1) {
          v = Math.min(v, D[i + w] + 1);
          if (x < w - 1) v = Math.min(v, D[i + w + 1] + S2);
          if (x > 0) v = Math.min(v, D[i + w - 1] + S2);
        }
        D[i] = v;
      }
    const Hh = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      if (!D[i]) continue;
      const t = Math.min(D[i] - 0.5, rr) / rr;
      Hh[i] = Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t))) * rr * (o.flat || 1);
    }
    const L = o.light || [-0.6, -0.72, 0.55];
    const ll = Math.hypot(L[0], L[1], L[2]), lx = L[0] / ll, ly = L[1] / ll, lz = L[2] / ll;
    const amb = o.amb === undefined ? 0.18 : o.amb, dif = o.dif === undefined ? 0.85 : o.dif;
    const hAt = (x, y, i) => (x < 0 || y < 0 || x >= w || y >= h ? Hh[i] : Hh[y * w + x]);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!m.d[i]) continue;
        if (o.clip && !o.clip(x, y)) continue;
        const gx = (hAt(x + 1, y, i) - hAt(x - 1, y, i)) / 2, gy = (hAt(x, y + 1, i) - hAt(x, y - 1, i)) / 2;
        const nl = Math.hypot(gx, gy, 1);
        const l = (-gx * lx - gy * ly + lz) / nl;
        let v = amb + dif * Math.max(0, l);
        if (o.add) v += o.add(x, y);
        const r = o.rampAt ? o.rampAt(x, y) : ramp;
        dst.set(x, y, o.nodither ? sv(r, v) : dv(r, v, x, y));
      }
  }
  // dithered darkening of a region (shadows, vignettes): k(x,y) in 0..1
  function dim(px, x0, y0, w, h, k, amt) {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        const v = k(x, y);
        if (v <= 0) continue;
        const c = px.get(x, y);
        if (!c) continue;
        px.set(x, y, G.darken(c, Math.floor(v * 3 + bay(x, y)) / 3 * (amt || 0.5)));
      }
  }
  function glow(px, x0, y0, w, h, k, col, amt) {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        const v = k(x, y);
        if (v <= 0) continue;
        const c = px.get(x, y);
        if (!c) continue;
        px.set(x, y, G.mix(c, col, (Math.floor(v * 3 + bay(x, y)) / 3) * (amt || 0.5)));
      }
  }
  // flip a rectangle of a buffer horizontally in place (mirror writing)
  function flipX(px) { const f = px.flipped(); px.d.set(f.d); return px; }

  // ---------- lettering ----------
  // the game font (5x7 caps, proportional); o: scale, jit (seed: handwriting wobble), slant
  function text(px, s, x, y, col, o) {
    o = o || {};
    const sc = o.scale || 1, rnd = o.jit ? G.rng(o.jit) : null;
    let cx = x;
    for (const ch of s) {
      const g = G.glyphs[ch] || G.glyphs['?'];
      const jy = rnd && rnd() < (o.jp || 0.4) ? (rnd() < 0.5 ? -1 : 1) * (o.jd || 1) : 0;
      g.rows.forEach((row, j) => {
        const sl = o.slant && j < 3 ? o.slant : 0;
        for (let i = 0; i < row.length; i++) if (row[i] === '#') px.rect(cx + i * sc + sl, y + j * sc + jy, sc, sc, col);
      });
      cx += (g.w + 1) * sc + (o.sp || 0);
    }
    return cx - x - sc;
  }
  const textW = (s, sc) => G.textWidth(s, sc || 1);
  // tiny 3x5 letters for captions on photos and banners
  const MINI_SRC = {
    A: '.#.|#.#|###|#.#|#.#', B: '##.|#.#|##.|#.#|##.', C: '.##|#..|#..|#..|.##', D: '##.|#.#|#.#|#.#|##.',
    E: '###|#..|##.|#..|###', F: '###|#..|##.|#..|#..', G: '.##|#..|#.#|#.#|.##', H: '#.#|#.#|###|#.#|#.#',
    I: '###|.#.|.#.|.#.|###', J: '..#|..#|..#|#.#|.#.', K: '#.#|#.#|##.|#.#|#.#', L: '#..|#..|#..|#..|###',
    M: '#...#|##.##|#.#.#|#...#|#...#', N: '#..#|##.#|#.##|#..#|#..#', O: '.#.|#.#|#.#|#.#|.#.',
    P: '##.|#.#|##.|#..|#..', Q: '.#.|#.#|#.#|##.|.##', R: '##.|#.#|##.|#.#|#.#', S: '.##|#..|.#.|..#|##.',
    T: '###|.#.|.#.|.#.|.#.', U: '#.#|#.#|#.#|#.#|###', V: '#.#|#.#|#.#|#.#|.#.', W: '#...#|#...#|#.#.#|#.#.#|.#.#.',
    X: '#.#|#.#|.#.|#.#|#.#', Y: '#.#|#.#|.#.|.#.|.#.', Z: '###|..#|.#.|#..|###',
    0: '###|#.#|#.#|#.#|###', 1: '.#.|##.|.#.|.#.|###', 2: '##.|..#|.#.|#..|###', 3: '##.|..#|.#.|..#|##.',
    4: '#.#|#.#|###|..#|..#', 5: '###|#..|##.|..#|##.', 6: '.##|#..|###|#.#|###', 7: '###|..#|.#.|.#.|.#.',
    8: '###|#.#|###|#.#|###', 9: '###|#.#|###|..#|##.', t: '.#.|###|.#.|.#.|..#', h: '#..|#..|##.|#.#|#.#',
    '-': '...|...|###|...|...', ':': '.|#|.|#|.', '/': '..#|..#|.#.|#..|#..', '.': '.|.|.|.|#', '!': '#|#|#|.|#', ' ': '..',
  };
  const MINI = {};
  for (const k in MINI_SRC) { const rows = MINI_SRC[k].split('|'); MINI[k] = { rows: rows, w: rows[0].length }; }
  function mini(px, s, x, y, col) {
    let cx = x;
    for (const ch of s) {
      const g = MINI[ch] || MINI['-'];
      g.rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') px.set(cx + i, y + j, col); });
      cx += g.w + 1;
    }
    return cx - x - 1;
  }
  const miniW = (s) => { let w = 0; for (const ch of s) w += (MINI[ch] || MINI['-']).w + 1; return w - 1; };

  // crayon: fill a mask with waxy diagonal strokes that skip the paper grain; darker edge
  function crayon(px, m, col, edge, dens, seed, ox, oy) {
    ox = ox || 0; oy = oy || 0;
    for (let y = 0; y < m.h; y++)
      for (let x = 0; x < m.w; x++) {
        if (!inM(m, x, y)) continue;
        const X = x + ox, Y = y + oy;
        const isEdge = !inM(m, x - 1, y) || !inM(m, x + 1, y) || !inM(m, x, y - 1) || !inM(m, x, y + 1);
        const n = G.vnoise((X + Y) / 1.6, (X - Y) / 4.5, seed || 1);
        if (isEdge && edge) { if (G.hash(X, Y, seed) < 0.88) px.set(X, Y, edge); }
        else if (n < (dens === undefined ? 0.72 : dens)) px.set(X, Y, col);
      }
  }
  const clipTo = (m, x0, y0, w, h) => { for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (x < x0 || y < y0 || x >= x0 + w || y >= y0 + h) m.d[y * m.w + x] = 0; };
  const STAR5 = ['..#..', '.###.', '#####', '.###.', '.#.#.'];

  // =====================================================================
  // pic_drawings: the Tanabe boys' four crayon drawings, numbered 1-4
  // (1: three cats, 2: one sun, 3: four people, 4: seven stars)
  // =====================================================================
  G.defSprite('pic_drawings', () => {
    const W = 160, H = 90, px = new G.PX(W, H);
    // cream wall in warm desk-lamp light from the left
    const wall = R('#1e1914', '#2c241c', '#3c3226', '#4e4232', '#62543e', '#756548');
    fill(px, 0, 0, W, H, (x, y) => dv(wall, 0.95 - (x / W) * 0.6 - (y / H) * 0.25 + (G.vnoise(x / 6, y / 6, 7) - 0.5) * 0.1, x, y));
    const PW = 34, PH = 52;
    const spots = [[5, 16], [44, 19], [83, 15], [122, 18]];
    const paper = R('#8c8270', '#aaa08a', '#c8bea4', '#dcd3bb', '#ece5d0');
    const ink = C('#2e2028');
    spots.forEach(([X, Y], k) => {
      const lit = 0.18 - k * 0.07;
      // cast shadow on the wall (down-right)
      dim(px, X + 2, Y + 2, PW + 1, PH + 1, (x, y) => (x >= X + PW || y >= Y + PH ? 1 : 0), 0.6);
      fill(px, X, Y, PW, PH, (x, y) => {
        const u = (x - X) / PW, v = (y - Y) / PH;
        return dv(paper, 0.8 + lit - u * 0.18 - v * 0.08 + (G.hash(x, y, 9) - 0.5) * 0.08, x, y);
      });
      // dog-eared bottom-right corner, curling up
      px.set(X + PW - 1, Y + PH - 1, 0); px.set(X + PW - 2, Y + PH - 1, 0); px.set(X + PW - 1, Y + PH - 2, 0);
      px.hline(X + PW - 4, X + PW - 3, Y + PH - 1, paper[1]); px.vline(X + PW - 1, Y + PH - 4, Y + PH - 3, paper[1]);
      px.set(X + PW - 2, Y + PH - 2, paper[4]);
      // masking tape
      const tape = C('#c8b88a'), tapeD = C('#a8986c');
      px.rect(X + 2, Y - 2, 7, 4, tape); px.hline(X + 2, X + 8, Y + 1, tapeD);
      px.rect(X + PW - 9, Y - 2, 7, 4, tape); px.hline(X + PW - 9, X + PW - 3, Y + 1, tapeD);
    });
    // --- 1: our cats (a fat one, a thin one, a tiny one) ---
    {
      const [X, Y] = spots[0];
      const grass = mask(W, H, (m) => { for (let x = 1; x < PW - 1; x++) m.vline(X + x, Y + 46 + Math.round(Math.sin(x * 0.9)), Y + 49, M); });
      crayon(px, grass, C('#6a9a48'), C('#4a7a34'), 0.8, 11);
      const cat = (cx, cy, brx, bry, hr, col, edge, seed, tailUp) => {
        const m = mask(W, H, (m) => {
          m.ellipse(cx, cy, brx, bry, M);
          m.disc(cx - brx + 1, cy - bry - hr + 3, hr, M);
          const hx = cx - brx + 1, hy = cy - bry - hr + 3;
          m.poly([[hx - hr, hy - hr * 0.2], [hx - hr * 0.8, hy - hr - 2.5], [hx - hr * 0.1, hy - hr * 0.7]], M);
          m.poly([[hx + hr * 0.1, hy - hr * 0.7], [hx + hr * 0.8, hy - hr - 2.5], [hx + hr, hy - hr * 0.2]], M);
          m.thick(cx + brx - 1, cy, cx + brx + 2, cy - (tailUp || 6), 0.8, M);
        });
        crayon(px, m, col, edge, 0.7, seed);
        const hx = cx - brx + 1, hy = cy - bry - hr + 3;
        px.set(hx - Math.max(1, Math.round(hr * 0.4)), hy, ink); px.set(hx + Math.max(1, Math.round(hr * 0.4)), hy, ink);
        if (hr >= 3) { px.hline(hx - hr - 2, hx - hr, hy + 2, edge); px.hline(hx + hr, hx + hr + 2, hy + 2, edge); }
      };
      cat(X + 15, Y + 38, 9, 6.5, 5, C('#d88a3e'), C('#9a5222'), 21, 9); // fat
      cat(X + 24, Y + 21, 6, 2.2, 3.2, C('#5a5a66'), C('#2a2a34'), 22, 7); // thin
      // thin cat's legs
      for (const lx of [19, 21, 27, 29]) px.vline(X + lx, Y + 22, Y + 28, C('#2a2a34'));
      cat(X + 28, Y + 43, 3, 2, 2.2, C('#e6a08a'), C('#9a5a48'), 23, 4); // tiny
    }
    // --- 2: sunny day (one big sun with a face) ---
    {
      const [X, Y] = spots[1];
      const sky = mask(W, H, (m) => m.rect(X + 1, Y + 1, PW - 2, 22, M));
      crayon(px, sky, C('#8eaed6'), null, 0.32, 31);
      const hill = mask(W, H, (m) => { m.ellipse(X + 17, Y + 58, 26, 14, M); clipTo(m, X + 1, Y + 1, PW - 2, PH - 2); });
      crayon(px, hill, C('#76a650'), C('#4e7a34'), 0.78, 32);
      const sx = X + 17, sy = Y + 22;
      for (let a = 0; a < 8; a++) {
        const t = (a / 8) * Math.PI * 2 + 0.2;
        px.line(sx + Math.cos(t) * 11, sy + Math.sin(t) * 11, sx + Math.cos(t) * 14.5, sy + Math.sin(t) * 14.5, C('#e0a020'));
      }
      const sun = mask(W, H, (m) => m.disc(sx, sy, 8.5, M));
      crayon(px, sun, C('#f2cc3a'), C('#d88a1c'), 0.86, 33);
      const fc = C('#7a3a1c');
      px.set(sx - 3, sy - 2, fc); px.set(sx + 3, sy - 2, fc);
      px.set(sx - 4, sy + 2, fc); px.set(sx + 4, sy + 2, fc); px.hline(sx - 3, sx + 3, sy + 3, fc); px.hline(sx - 1, sx + 1, sy + 4, fc);
      // two pink flowers on the hill
      for (const [fx, fy] of [[X + 8, Y + 47], [X + 25, Y + 46]]) {
        px.vline(fx, fy, fy + 3, C('#3e6a2a'));
        px.set(fx - 1, fy - 1, C('#d87890')); px.set(fx + 1, fy - 1, C('#d87890')); px.set(fx, fy - 2, C('#d87890')); px.set(fx, fy - 1, C('#f0d060'));
      }
    }
    // --- 3: our family (Mom, Dad, Taro, Jiro holding hands) ---
    {
      const [X, Y] = spots[2];
      const grass = mask(W, H, (m) => m.rect(X + 1, Y + 46, PW - 2, 4, M));
      crayon(px, grass, C('#6a9a48'), null, 0.7, 41);
      const skin = C('#e8b48c'), skinE = C('#b07850'), hair = C('#2e2622');
      const people = [
        { x: 6, h: 28, shirt: C('#4a6ab0'), shirtE: C('#2e4680'), dress: false }, // Dad
        { x: 14, h: 26, shirt: C('#d06a7a'), shirtE: C('#984050'), dress: true }, // Mom
        { x: 22, h: 20, shirt: C('#5a9a5a'), shirtE: C('#386a38'), dress: false }, // Taro
        { x: 29, h: 15, shirt: C('#e0b03a'), shirtE: C('#a87a1c'), dress: false }, // Jiro
      ];
      const foot = Y + 47;
      people.forEach((p, i) => {
        const cx = X + p.x, top = foot - p.h, hr = p.h > 18 ? 3 : 2.5;
        const body = mask(W, H, (m) => {
          if (p.dress) m.poly([[cx - 0.5, top + hr * 2], [cx + 1, top + hr * 2], [cx + 5, foot - 5], [cx - 4.5, foot - 5]], M);
          else m.rect(cx - 2, top + hr * 2, 5, Math.round(p.h * 0.42), M);
        });
        crayon(px, body, p.shirt, p.shirtE, 0.8, 42 + i);
        // legs
        const ly = p.dress ? foot - 5 : top + hr * 2 + Math.round(p.h * 0.42);
        px.vline(cx - 1, ly, foot, skinE); px.vline(cx + 1, ly, foot, skinE);
        // head
        const hd = mask(W, H, (m) => m.disc(cx + 0.5, top + hr, hr, M));
        crayon(px, hd, skin, skinE, 0.9, 50 + i);
        // hair
        if (p.dress) { px.hline(cx - 2, cx + 3, top, hair); px.vline(cx - 3, top + 1, top + 7, hair); px.vline(cx + 4, top + 1, top + 7, hair); }
        else px.hline(cx - 1, cx + 2, top, hair);
        px.set(cx - 1, top + hr, ink); px.set(cx + 2, top + hr, ink); px.hline(cx, cx + 1, top + hr + 1.5, C('#a04040'));
        // arms reaching to the next person's hand
        const ay = top + hr * 2 + 2;
        if (i < people.length - 1) { const nx = X + people[i + 1].x, ny = foot - people[i + 1].h + (people[i + 1].h > 18 ? 6 : 5) + 2; px.line(cx + 3, ay, nx - 2, ny, skinE); }
      });
      px.line(X + 4, foot - 28 + 8, X + 2, foot - 16, skinE); // Dad's free arm
      px.line(X + 32, foot - 15 + 7, X + 33, foot - 9, skinE); // Jiro's free arm
    }
    // --- 4: night sky (seven stars, counted very carefully) ---
    {
      const [X, Y] = spots[3];
      const sky = mask(W, H, (m) => m.rect(X + 1, Y + 1, PW - 2, PH - 2, M));
      crayon(px, sky, C('#22306e'), null, 0.9, 61);
      const sky2 = mask(W, H, (m) => m.rect(X + 1, Y + 1, PW - 2, PH - 2, M));
      crayon(px, sky2, C('#2e3e86'), null, 0.35, 62);
      const roofs = mask(W, H, (m) => { m.rect(X + 1, Y + 42, 13, 9, M); m.rect(X + 14, Y + 38, 10, 13, M); m.rect(X + 24, Y + 44, 9, 7, M); });
      crayon(px, roofs, C('#16161e'), null, 0.95, 63);
      const stars = [[5, 7], [21, 4], [12, 15], [27, 13], [5, 25], [18, 26], [28, 30]];
      const sc = C('#f2d64a'), scE = C('#c8a028');
      for (const [sx, sy] of stars) {
        px.stamp(STAR5, { '#': sc }, X + sx - 2, Y + sy - 2);
        px.set(X + sx - 2, Y + sy, scE); px.set(X + sx + 2, Y + sy, scE);
      }
    }
    // corner numbers in dark crayon
    const numCol = [C('#9a3a2a'), C('#2e3a7a'), C('#2a5a2a'), C('#e8e0c8')];
    spots.forEach(([X, Y], k) => {
      if (k === 3) { text(px, String(k + 1), X + 3, Y + 3, C('#c8b884')); return; }
      text(px, String(k + 1), X + 3, Y + 3, numCol[k]);
    });
    // lamp falloff on the far right
    dim(px, 0, 0, W, H, (x, y) => (x - 100) / 70 + (y - 70) / 60, 0.45);
    return G.frame(px, W / 2, H);
  });

  // =====================================================================
  // pic_family_photos: four childhood photos in frames under the beam
  // =====================================================================
  G.defSprite('pic_family_photos', () => {
    const W = 160, H = 84, px = new G.PX(W, H);
    const wall = R('#1c1814', '#2a241e', '#3a3229', '#4a4134', '#5a5040');
    fill(px, 0, 0, W, H, (x, y) => dv(wall, 0.8 - (y / H) * 0.35 - Math.abs(x - 70) / 260 + (G.vnoise(x / 4, y / 9, 3) - 0.5) * 0.12, x, y));
    // nageshi beam
    const beam = R('#1a120c', '#2e2016', '#463020', '#5e4430');
    fill(px, 0, 0, W, 7, (x, y) => dv(beam, (y === 0 ? 0.95 : y < 3 ? 0.7 : y < 6 ? 0.45 : 0.1) + (G.vnoise(x / 9, y, 4) - 0.5) * 0.2, x, y));
    dim(px, 0, 7, W, 3, (x, y) => 1 - (y - 7) / 3, 0.6);
    const photos = [
      { name: 'KIYO', year: '1929', ramp: R('#2e2218', '#5a4430', '#8a6c4c', '#b49470', '#d8c09a', '#e8d6b4') },
      { name: 'SHIN', year: '1934', ramp: R('#241c16', '#4a3c2e', '#786650', '#a8927a', '#cebca0', '#e4d6bc') },
      { name: 'SHOTA', year: '1947', ramp: R('#1e1c1a', '#403c38', '#6a645e', '#98928a', '#c4beb4', '#e0dcd2') },
      { name: 'HARU', year: '1948', ramp: R('#1a1a1c', '#3a3a3e', '#646468', '#929296', '#c2c2c2', '#e2e2de') },
    ];
    const frameW = R('#160e0a', '#2a1a10', '#422a1a', '#5e3e26');
    const mat = R('#a49c88', '#c4bca6', '#d8d0ba');
    photos.forEach((p, k) => {
      const X = 2 + k * 39, Y = 15 + (k % 2), FW = 36, FH = 54;
      // hanging string to a nail on the beam
      const nail = [X + FW / 2, 5];
      px.line(X + 6, Y, nail[0], nail[1] + 1, C('#6a5a44')); px.line(X + FW - 7, Y, nail[0], nail[1] + 1, C('#6a5a44'));
      px.rect(nail[0] - 1, nail[1] - 1, 2, 2, C('#8a8478'));
      // shadow
      dim(px, X + 2, Y + 2, FW + 1, FH + 1, (x, y) => (x >= X + FW || y >= Y + FH ? 1 : 0), 0.65);
      // frame with a bevel (lit top-left)
      fill(px, X, Y, FW, FH, (x, y) => {
        const i = x - X, j = y - Y, e = Math.min(i, j, FW - 1 - i, FH - 1 - j);
        if (e > 2) return 0;
        const tl = i <= 2 && i <= FW - 1 - i ? 1 : 0, top = j <= 2 && j <= FH - 1 - j ? 1 : 0;
        let v = 0.45 + (top ? 0.3 : 0) + (tl ? 0.15 : 0) - (FW - 1 - i <= 2 || FH - 1 - j <= 2 ? 0.25 : 0) + (e === 0 ? -0.15 : e === 2 ? -0.2 : 0.1);
        return dv(frameW, v, x, y);
      });
      // mat
      fill(px, X + 3, Y + 3, FW - 6, FH - 6, (x, y) => dv(mat, 0.85 - ((y - Y) / FH) * 0.25 - (x === X + 3 || y === Y + 3 ? 0.4 : 0), x, y));
      // the photo
      const PX0 = X + 5, PY0 = Y + 5, PW = 26, PH = 30, r = p.ramp;
      const ph = new G.PX(PW, PH);
      portrait(ph, k, r);
      // age: faded corners, a crease, dust
      const rnd = G.rng(70 + k);
      for (let y = 0; y < PH; y++)
        for (let x = 0; x < PW; x++) {
          const cd = Math.hypot((x - PW / 2) / (PW / 2), (y - PH / 2) / (PH / 2));
          if (cd > 1.15 - k * 0.04 && bay(x, y) < (cd - 1.0) * 2.5) ph.set(x, y, r[4]);
        }
      if (k < 2) px.blit(ph, PX0, PY0); else px.blit(ph, PX0, PY0);
      if (k === 0) for (let i = 0; i < 9; i++) px.set(PX0 + 3 + i * 2, PY0 + 22 - i, r[5]);
      for (let i = 0; i < 4; i++) px.set(PX0 + rnd.int(PW), PY0 + rnd.int(PH), r[i % 2 ? 5 : 0]);
      // photo edge shadow on the mat
      px.hline(PX0 + 1, PX0 + PW, PY0 + PH, mat[0]); px.vline(PX0 + PW, PY0 + 1, PY0 + PH, mat[0]);
      // captions
      const ink = C('#2e2620');
      mini(px, p.name, X + Math.round((FW - miniW(p.name)) / 2), PY0 + PH + 3, ink);
      mini(px, p.year, X + Math.round((FW - miniW(p.year)) / 2), PY0 + PH + 10, ink);
      // glass glare
      for (let i = 0; i < 7; i++) { const gx = X + 21 + i, gy = Y + 4 + i * 2; if (!(gy > PY0 + PH)) { px.set(gx, gy, G.lighten(px.get(gx, gy), 0.25)); px.set(gx, gy + 1, G.lighten(px.get(gx, gy + 1), 0.25)); } }
    });
    return G.frame(px, W / 2, H);
  });

  // the four childhood portraits (26x30), painted with a 6-tone photo ramp
  function portrait(ph, k, r) {
    const W = ph.w, H = ph.h;
    // studio backdrop
    fill(ph, 0, 0, W, H, (x, y) => dv(r, 0.62 - (x / W) * 0.25 - (y / H) * 0.15 + (k === 0 ? 0.08 : 0), x, y));
    const cx = 13;
    const skin = [r[2], r[3], r[4], r[5]];
    const body = (ramp, top, wTop, add) => shade(ph, mask(W, H, (m) => m.poly([[cx - wTop, top], [cx + wTop, top], [cx + wTop + 4, H], [cx - wTop - 4, H]], M)), ramp, { r: 4, amb: 0.1, add: add });
    const head = (hx, hy, rx, ry) => shade(ph, mask(W, H, (m) => m.ellipse(hx, hy, rx, ry, M)), skin, { r: 4, amb: 0.25 });
    const eyes = (ex, ey, d, c) => { ph.set(ex - d, ey, c); ph.set(ex + d, ey, c); };
    if (k === 0) {
      // KIYO: a girl with a straight-cut bob in a patterned kimono
      shade(ph, mask(W, H, (m) => m.poly([[cx - 8, 22], [cx + 8, 22], [cx + 12, H], [cx - 12, H]], M)), [r[0], r[1], r[2]], { r: 4 });
      for (let y = 23; y < H; y += 3) for (let x = 2; x < W - 2; x += 4) if (ph.get(x + (y % 2) * 2, y) === r[1] || ph.get(x + (y % 2) * 2, y) === r[0]) ph.set(x + (y % 2) * 2, y, r[3]);
      ph.line(cx - 4, 21, cx, 27, r[4]); ph.line(cx + 4, 21, cx, 27, r[4]);
      ph.line(cx - 3, 21, cx, 25, r[5]); ph.line(cx + 3, 21, cx, 25, r[5]);
      ph.rect(cx - 2, 18, 5, 4, r[3]);
      head(cx + 0.5, 12, 6, 7);
      // bob: rounded cap with a straight fringe and straight sides to the jaw
      const hair = mask(W, H, (m) => { m.ellipse(cx + 0.5, 10, 8, 7.5, M); m.rect(cx - 7, 10, 16, 7, M); });
      shade(ph, hair, [r[0], r[0], r[1], r[2]], { r: 3, amb: 0.05, clip: (x, y) => y < 9 || x < cx - 4 || x > cx + 5 });
      eyes(cx + 0.5, 13, 2, r[0]); ph.set(cx, 16, r[1]); ph.set(cx + 1, 16, r[1]);
    } else if (k === 1) {
      // SHIN: school uniform with a standing collar and a peaked school cap
      body([r[0], r[0], r[1], r[2]], 21, 8, null);
      ph.rect(cx - 2, 20, 6, 2, r[1]);
      for (let y = 23; y < H; y += 3) ph.set(cx + 1, y, r[4]);
      head(cx + 0.5, 13, 6, 7);
      ph.set(cx - 6, 13, r[3]); ph.set(cx + 7, 13, r[3]); ph.set(cx - 6, 14, r[2]); ph.set(cx + 7, 14, r[2]);
      const cap = mask(W, H, (m) => { m.ellipse(cx + 0.5, 7, 7.5, 4.5, M); m.rect(cx - 7, 7, 16, 3, M); });
      shade(ph, cap, [r[0], r[0], r[1], r[2]], { r: 3, amb: 0.05 });
      ph.hline(cx - 6, cx + 5, 10, r[0]); ph.hline(cx - 5, cx + 4, 11, r[1]);
      ph.set(cx, 6, r[4]); ph.set(cx + 1, 6, r[5]); ph.set(cx, 7, r[3]); ph.set(cx + 1, 7, r[4]);
      eyes(cx + 0.5, 14, 2, r[0]); ph.hline(cx, cx + 1, 17, r[1]);
    } else if (k === 2) {
      // SHOTA: baseball cap, light t-shirt, a big grin
      body([r[2], r[3], r[4], r[5]], 21, 7, null);
      ph.hline(cx - 1, cx + 2, 21, r[2]);
      head(cx + 0.5, 13, 6, 7);
      ph.set(cx - 6, 13, r[3]); ph.set(cx + 7, 13, r[3]);
      const cap = mask(W, H, (m) => { m.ellipse(cx + 0.5, 8, 7, 4.5, M); m.rect(cx - 6, 8, 14, 2, M); });
      shade(ph, cap, [r[1], r[1], r[2], r[3]], { r: 3, amb: 0.05 });
      ph.hline(cx - 7, cx + 4, 10, r[0]); ph.hline(cx - 8, cx + 1, 11, r[1]);
      ph.set(cx, 6, r[5]); ph.set(cx + 1, 6, r[5]); ph.set(cx, 7, r[4]);
      ph.hline(cx - 6, cx - 4, 12, r[1]); ph.hline(cx + 5, cx + 7, 12, r[1]);
      eyes(cx + 0.5, 14, 2, r[0]);
      ph.hline(cx - 1, cx + 2, 17, r[0]); ph.hline(cx, cx + 1, 18, r[5]); ph.set(cx - 2, 16, r[1]); ph.set(cx + 3, 16, r[1]);
    } else {
      // HARU: a small boy (two or three) in a knitted jumper, holding a toy plane
      body([r[1], r[2], r[3], r[4]], 22, 6, null);
      for (let y = 24; y < H; y += 2) for (let x = 3; x < W - 3; x += 3) if (ph.get(x + (y % 4 ? 1 : 0), y) !== r[0] && ph.get(x, y) !== ph.get(0, 0)) ph.set(x + (y % 4 ? 1 : 0), y, r[2]);
      head(cx + 0.5, 15, 7, 7);
      const hair = mask(W, H, (m) => { m.ellipse(cx + 0.5, 11, 7.5, 5, M); });
      shade(ph, hair, [r[0], r[0], r[1], r[2]], { r: 3, amb: 0.05, clip: (x, y) => y < 12 || x < cx - 5 || x > cx + 6 });
      ph.set(cx - 2, 7, r[1]); ph.set(cx + 4, 6, r[1]); ph.set(cx + 5, 7, r[0]);
      eyes(cx + 0.5, 16, 2, r[0]); ph.set(cx - 3, 18, r[3]); ph.set(cx + 4, 18, r[3]);
      ph.hline(cx, cx + 1, 19, r[1]);
      // toy plane held up at the right
      ph.rect(18, 23, 7, 2, r[5]); ph.rect(20, 21, 2, 6, r[4]); ph.set(24, 22, r[4]);
      shade(ph, mask(W, H, (m) => m.disc(19, 26, 2, M)), skin, { r: 2 });
    }
  }

  // =====================================================================
  // pic_pressure_chart: a handwritten chart pinned to the cage wire
  // =====================================================================
  G.defSprite('pic_pressure_chart', () => {
    const W = 160, H = 90, px = new G.PX(W, H);
    // dark cage interior with shelves of junk
    const back = R('#0e0e12', '#16171c', '#1e2026', '#282a32');
    fill(px, 0, 0, W, H, (x, y) => dv(back, 0.55 - Math.hypot(x - 80, y - 40) / 140 + (G.vnoise(x / 7, y / 7, 5) - 0.5) * 0.25, x, y));
    for (const sy of [20, 58]) { px.hline(0, W - 1, sy, C('#30323a')); px.hline(0, W - 1, sy + 1, C('#1a1b20')); }
    // chain-link diamonds
    const wire = C('#5a5e66'), wireH = C('#8a8e96'), wireD = C('#34363c');
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const a = G.mod(x + y, 10), b = G.mod(x - y, 10);
        if (a === 0 || b === 0) px.set(x, y, (a === 0 && b === 0) ? wireH : y % 3 === 0 ? wireD : wire);
      }
    // paper
    const X = 18, Y = 6, PW = 124, PH = 80;
    dim(px, X + 3, Y + 3, PW, PH, (x, y) => (x >= X + PW || y >= Y + PH ? 1 : 0), 0.7);
    const paper = R('#9a9480', '#b8b29a', '#cdc7ad', '#ddd8c0', '#e8e4d0');
    fill(px, X, Y, PW, PH, (x, y) => {
      const u = (x - X) / PW, v = (y - Y) / PH;
      let val = 0.85 - u * 0.15 - v * 0.15 + (G.vnoise(x / 8, y / 8, 12) - 0.5) * 0.12;
      // water stain ring, bottom right
      const sd = Math.hypot(x - (X + 104), (y - (Y + 64)) * 1.3);
      if (sd < 13) val -= sd > 11 ? 0.3 : 0.1;
      return dv(paper, val, x, y);
    });
    // curled corner (bottom right) and ragged top edge from being torn off a pad
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6 - i; j++) px.set(X + PW - 1 - j, Y + PH - 1 - i, 0);
    px.line(X + PW - 7, Y + PH - 1, X + PW - 1, Y + PH - 7, paper[0]);
    for (let x = X; x < X + PW; x++) if (G.hash(x, 3, 3) < 0.35) px.set(x, Y, 0);
    // ruled lines and a margin
    for (let ly = Y + 21; ly < Y + PH - 4; ly += 14) for (let x = X + 2; x < X + PW - 2; x++) if (px.get(x, ly)) px.set(x, ly, G.mix(px.get(x, ly), C('#7a8eb0'), 0.4));
    for (let y = Y + 2; y < Y + PH - 2; y++) if (px.get(X + 11, y)) px.set(X + 11, y, G.mix(px.get(X + 11, y), C('#b06a6a'), 0.35));
    // handwriting (ballpoint, blue-black)
    const ink = C('#232c4c'), ink2 = C('#3a4670');
    text(px, 'WINTER SETTINGS', X + 22, Y + 7, ink, { jit: 5, jp: 0.25 });
    px.line(X + 21, Y + 16, X + 104, Y + 17, ink2); px.line(X + 24, Y + 18, X + 102, Y + 18, ink2);
    const rows = [
      ['HOT WATER - high', C('#a8483e'), 0.85, 61],
      ['HEATING - low', C('#4a68a6'), 0.15, 62],
      ['LAUNDRY - mid', C('#8a8a8e'), 0.5, 63],
    ];
    rows.forEach(([s, col, set, seed], i) => {
      const ly = Y + 26 + i * 14;
      // colour swatch, scribbled in with crayon
      const sw = mask(W, H, (m) => m.rect(X + 14, ly + 1, 6, 6, M));
      crayon(px, sw, col, G.darken(col, 0.3), 0.85, seed);
      text(px, s, X + 24, ly, ink, { jit: seed, jp: 0.3 });
      // a tiny dial with the needle where it should point
      const dx = X + 113, dy = ly + 7;
      for (let a = 0; a <= 12; a++) { const t = Math.PI + (a / 12) * Math.PI; px.set(Math.round(dx + Math.cos(t) * 6), Math.round(dy + Math.sin(t) * 6), ink2); }
      px.hline(dx - 6, dx + 6, dy, ink2);
      const t = Math.PI + set * Math.PI;
      px.line(dx, dy, Math.round(dx + Math.cos(t) * 5), Math.round(dy + Math.sin(t) * 5), ink);
      px.set(dx, dy - 1, ink);
    });
    // signature squiggle
    px.line(X + 80, Y + 72, X + 84, Y + 69, ink2); px.line(X + 84, Y + 69, X + 86, Y + 73, ink2); px.line(X + 86, Y + 73, X + 92, Y + 70, ink2); px.line(X + 92, Y + 70, X + 99, Y + 71, ink2);
    // wire twists through the top corners
    for (const tx of [X + 4, X + PW - 5]) {
      px.rect(tx - 1, Y + 2, 3, 3, C('#3a3830')); px.set(tx, Y + 3, C('#6a6458'));
      px.line(tx, Y + 3, tx - 3, Y - 3, wireH); px.line(tx + 1, Y + 3, tx + 4, Y - 3, wire);
    }
    px.outline(C('#08080a'));
    return G.frame(px, W / 2, H);
  });

  // =====================================================================
  // pic_whiteboard_mirror: the staff whiteboard seen in a mirror (all reversed)
  // =====================================================================
  G.defSprite('pic_whiteboard_mirror', () => {
    const W = 160, H = 90, px = new G.PX(W, H);
    // staff-room wall under fluorescent light
    const wall = R('#4a5450', '#5e6a64', '#74807a', '#88948c');
    fill(px, 0, 0, W, H, (x, y) => dv(wall, 0.75 - (y / H) * 0.4 + (G.vnoise(x / 9, y / 9, 8) - 0.5) * 0.1, x, y));
    // the whiteboard
    const BX = 8, BY = 6, BW = 144, BH = 70;
    dim(px, BX + 2, BY + 2, BW + 1, BH + 3, (x, y) => (x >= BX + BW || y >= BY + BH ? 1 : 0), 0.5);
    const frame = R('#5a5e66', '#8a8e98', '#b4b8c0', '#d4d8de');
    fill(px, BX, BY, BW, BH, (x, y) => {
      const i = x - BX, j = y - BY;
      if (i < 2 || j < 2 || i >= BW - 2 || j >= BH - 2) return sv(frame, j < 2 || i < 2 ? (i === 0 || j === 0 ? 1 : 0.7) : 0.25);
      return 0;
    });
    const board = R('#b4bcc0', '#cdd3d6', '#dfe4e6', '#eef1f2');
    fill(px, BX + 2, BY + 2, BW - 4, BH - 4, (x, y) => dv(board, 0.95 - ((x - BX) / BW) * 0.2 - ((y - BY) / BH) * 0.15 + (G.vnoise(x / 10, y / 4, 13) < 0.25 ? -0.25 : 0), x, y));
    // marker tray with markers and an eraser
    px.rect(BX + 4, BY + BH, BW - 8, 3, C('#9a9ea8')); px.hline(BX + 4, BX + BW - 5, BY + BH, C('#c8ccd4')); px.hline(BX + 4, BX + BW - 5, BY + BH + 2, C('#5a5e66'));
    px.rect(BX + 20, BY + BH - 2, 12, 2, C('#2a3c8a')); px.rect(BX + 30, BY + BH - 2, 2, 2, C('#e8e8e8'));
    px.rect(BX + 36, BY + BH - 2, 12, 2, C('#8e3434')); px.rect(BX + 46, BY + BH - 2, 2, 2, C('#e8e8e8'));
    px.rect(BX + 112, BY + BH - 4, 16, 4, C('#2a2a30')); px.rect(BX + 112, BY + BH - 4, 16, 1, C('#5a4a3a'));
    // writing
    const blk = C('#24262c'), blu = C('#2c40a0'), red = C('#a03838');
    text(px, 'NIGHT SHIFT', BX + 8, BY + 6, blk, { jit: 81, jp: 0.2 });
    px.line(BX + 7, BY + 15, BX + 70, BY + 16, blk);
    // rounds table
    const TX = BX + 8, TY = BY + 22;
    for (let r = 0; r <= 4; r++) px.hline(TX, TX + 74, TY + r * 9, blu);
    for (const c of [0, 18, 36, 55, 74]) px.vline(TX + c, TY, TY + 36, blu);
    ['1:00', '3:00', '5:00'].forEach((s, i) => mini(px, s, TX + 21 + i * 19, TY + 2, blu));
    ['401', '402', '404'].forEach((s, i) => {
      mini(px, s, TX + 3, TY + 11 + i * 9, blk);
      for (let c = 0; c < 3; c++) {
        const cx = TX + 25 + c * 19, cy = TY + 13 + i * 9;
        if (i === 2 && c > 0) { mini(px, '!', cx + 1, cy - 2, red); continue; }
        px.set(cx, cy + 1, blk); px.set(cx + 1, cy + 2, blk); px.line(cx + 2, cy + 1, cx + 4, cy - 1, blk);
      }
    });
    mini(px, 'BDAY 404 - CAKE!', TX, BY + 61, red);
    // a doodled cake
    px.rect(BX + 92, BY + 58, 12, 6, red); px.hline(BX + 92, BX + 103, BY + 58, blk); px.vline(BX + 98, BY + 54, BY + 57, blk); px.set(BX + 98, BY + 53, red);
    // the yellow sticky note: 2473
    const NX = 94, NY = 18, NW = 52, NH = 34;
    dim(px, NX + 2, NY + 2, NW, NH, (x, y) => (x >= NX + NW || y >= NY + NH ? 1 : 0), 0.35);
    const note = R('#b89a2c', '#d8b83c', '#e8cc52', '#f4dc6c', '#faea8e');
    fill(px, NX, NY, NW, NH, (x, y) => dv(note, 0.85 - ((x - NX) / NW) * 0.2 - ((y - NY) / NH) * 0.25, x, y));
    // the bottom edge curls away from the board
    for (let x = NX; x < NX + NW; x++) { px.set(x, NY + NH - 1, note[1]); px.set(x, NY + NH - 2, note[2]); }
    px.hline(NX, NX + NW - 1, NY + 4, note[2]);
    text(px, '2473', NX + 4, NY + 10, C('#1c1c24'), { scale: 2, jit: 9, jp: 0.5, slant: 1 });
    // a magnet holding the note
    px.rect(NX + 23, NY - 2, 6, 5, C('#3a6aa8')); px.hline(NX + 23, NX + 28, NY - 2, C('#6a9ad0')); px.hline(NX + 23, NX + 28, NY + 2, C('#244a7a'));
    // everything is seen in a mirror
    flipX(px);
    // the glass: a cold tint, bevel shadow, a long highlight, a few desilvered spots
    px.map((c, x, y) => G.mix(c, C('#6e8a86'), 0.12));
    dim(px, 0, 0, W, H, (x, y) => { const e = Math.min(x, y, W - 1 - x, H - 1 - y); return e < 6 ? 1 - e / 6 : 0; }, 0.65);
    glow(px, 0, 0, W, H, (x, y) => { const d = G.mod(x + y * 0.7 - 30, 120); return d < 6 ? 1 - Math.abs(d - 3) / 3 : d > 12 && d < 14 ? 0.6 : 0; }, C('#f0f8f4'), 0.35);
    const rnd = G.rng(77);
    for (let i = 0; i < 30; i++) { const a = rnd(); const x = a < 0.5 ? rnd.int(14) : W - 1 - rnd.int(14), y = rnd.int(H); px.set(x, y, G.darken(px.get(x, y), 0.5)); }
    return G.frame(px, W / 2, H);
  });

  // =====================================================================
  // pic_mom_photo: Fumiko and Haru, 1949 (a black-and-white photo)
  // =====================================================================
  G.defSprite('pic_mom_photo', () => {
    const W = 150, H = 94, px = new G.PX(W, H);
    // dark table
    const tab = R('#0e0a08', '#1a120e', '#261a14');
    fill(px, 0, 0, W, H, (x, y) => dv(tab, 0.6 - Math.hypot(x - 40, y - 20) / 220 + (G.vnoise(x / 14, y / 2, 15) - 0.5) * 0.3, x, y));
    const X = 9, Y = 3, PW = 132, PH = 88, B = 5, BB = 14;
    dim(px, X + 3, Y + 3, PW, PH, (x, y) => (x >= X + PW || y >= Y + PH ? 1 : 0), 0.7);
    const border = R('#a8a296', '#c8c2b4', '#dcd6c8', '#e8e3d6');
    fill(px, X, Y, PW, PH, (x, y) => dv(border, 0.85 - ((x - X) / PW) * 0.2 - ((y - Y) / PH) * 0.2, x, y));
    // the image
    const IW = PW - 2 * B, IH = PH - B - BB, im = new G.PX(IW, IH);
    const r = R('#18171a', '#2e2c2e', '#4a4646', '#6a6462', '#8c8580', '#b0a8a0', '#d0c8bc', '#e8e0d2');
    // room: a bright shoji window at the left, plain wall, dark tansu at the right
    fill(im, 0, 0, IW, IH, (x, y) => dv(r, 0.62 - (x / IW) * 0.4 + (y / IH) * 0.05, x, y));
    fill(im, 0, 0, 30, IH, (x, y) => { const lat = x % 9 === 0 || y % 12 === 0; return dv(r, lat ? 0.5 : 0.95 - y / IH * 0.1, x, y); });
    fill(im, 96, 8, IW - 96, IH - 8, (x, y) => dv(r, 0.2 + (y % 14 === 0 ? 0.15 : 0) - (x - 96) / 80, x, y));
    for (const hy of [14, 28, 42, 56]) im.rect(108, hy + 5, 4, 2, r[4]);
    fill(im, 0, IH - 10, IW, 10, (x, y) => dv(r, 0.45 - (y - IH + 10) / 30 + (x % 18 === 0 ? -0.15 : 0), x, y)); // tatami
    // mother: dark cardigan over a light blouse, seen from the waist up
    const cx = 60;
    const coat = mask(IW, IH, (m) => {
      m.poly([[cx - 16, 40], [cx + 18, 40], [cx + 26, IH], [cx - 24, IH]], M);
      m.ellipse(cx + 1, 42, 17, 6, M);
    });
    shade(im, coat, [r[0], r[1], r[2], r[3]], { r: 6, amb: 0.1 });
    im.poly([[cx - 4, 37], [cx + 6, 37], [cx + 3, 52], [cx - 1, 52]], r[6]);
    im.line(cx - 4, 38, cx - 1, 52, r[5]);
    // neck and head, tilted down toward the baby
    shade(im, mask(IW, IH, (m) => m.rect(cx - 2, 30, 7, 9, M)), [r[3], r[4], r[5], r[6]], { r: 3 });
    const face = mask(IW, IH, (m) => m.ellipse(cx + 1, 24, 9, 10.5, M));
    shade(im, face, [r[3], r[4], r[5], r[6], r[7]], { r: 6, amb: 0.3 });
    // hair: black, tied back, a soft wave over the brow
    const hair = mask(IW, IH, (m) => {
      m.ellipse(cx + 1, 19, 10.5, 9, M);
      m.disc(cx + 11, 22, 4.5, M); // the bun
      m.rect(cx + 7, 18, 3, 10, M);
    });
    shade(im, hair, [r[0], r[0], r[1], r[2], r[3]], { r: 4, amb: 0.05, clip: (x, y) => !(y > 18 && x < cx + 7 && x > cx - 8) && !(y > 22 && x < cx + 8) });
    im.line(cx - 8, 18, cx - 2, 15, r[1]); im.line(cx - 2, 15, cx + 5, 17, r[2]);
    // closed, smiling eyes looking down; small mouth
    for (const ex of [cx - 4, cx + 3]) { im.hline(ex - 1, ex + 1, 24, r[1]); im.set(ex - 2, 23, r[2]); }
    im.set(cx - 0, 28, r[3]); im.hline(cx - 1, cx + 2, 31, r[2]); im.set(cx - 2, 30, r[3]); im.set(cx + 3, 30, r[3]);
    im.set(cx - 5, 27, r[5]); im.set(cx + 5, 27, r[5]);
    // the baby, wrapped in a white blanket, in her arms
    const blanket = mask(IW, IH, (m) => { m.ellipse(cx - 4, 50, 15, 9, M); m.ellipse(cx - 14, 45, 8, 7, M); });
    shade(im, blanket, [r[3], r[4], r[5], r[6], r[7]], { r: 5, amb: 0.3 });
    for (let i = 0; i < 4; i++) im.line(cx - 2 + i * 4, 43, cx - 6 + i * 4, 57, r[4]);
    const bf = mask(IW, IH, (m) => m.ellipse(cx - 14, 45, 5, 5, M));
    shade(im, bf, [r[4], r[5], r[6], r[7]], { r: 4, amb: 0.35 });
    im.set(cx - 16, 45, r[2]); im.set(cx - 12, 45, r[2]); im.set(cx - 14, 48, r[3]); im.hline(cx - 18, cx - 11, 40, r[2]); im.set(cx - 15, 39, r[1]);
    // her hands around the bundle
    const hands = mask(IW, IH, (m) => { m.ellipse(cx + 9, 50, 5, 3.5, M); m.ellipse(cx - 19, 53, 4, 3, M); });
    shade(im, hands, [r[3], r[4], r[5], r[6]], { r: 3, amb: 0.25 });
    // photo grain, soft vignette, a little fading
    for (let y = 0; y < IH; y++)
      for (let x = 0; x < IW; x++) {
        const c = im.get(x, y), i = r.indexOf(c);
        if (i < 0) continue;
        const vg = Math.hypot((x - IW / 2) / (IW / 2), (y - IH / 2) / (IH / 2));
        let k = i + (G.hash(x, y, 31) < 0.08 ? 1 : 0) - (vg > 0.95 && bay(x, y) < (vg - 0.95) * 2 ? 1 : 0);
        im.set(x, y, r[clamp(k, 0, 7)]);
      }
    px.blit(im, X + B, Y + B);
    // fountain-pen caption on the bottom border
    const cap = 'Fumiko and Haru, 1949';
    text(px, cap, X + Math.round((PW - textW(cap)) / 2), Y + PH - BB + 3, C('#2e2a3a'), { jit: 19, jp: 0.25 });
    // wear: a crease across the top-right corner and a dog-ear
    for (let i = 0; i < 16; i++) { const x = X + PW - 18 + i, y = Y + i; px.set(x, y, G.lighten(px.get(x, y), 0.3)); px.set(x + 1, y, G.darken(px.get(x + 1, y), 0.15)); }
    px.set(X, Y, 0); px.set(X + 1, Y, 0); px.set(X, Y + 1, 0);
    return G.frame(px, W / 2, H);
  });

  // =====================================================================
  // pic_blank / pic_photo_1977: the developing tray under the safelight. The photo comes up
  // on the same sheet (same size, the viewer cross-fades between them).
  // =====================================================================
  const TRAY = { W: 160, H: 94, SX: 16, SY: 11, SW: 128, SH: 72 };
  function trayScene(photo) {
    const { W, H, SX, SY, SW, SH } = TRAY, px = new G.PX(W, H);
    const rnd = G.rng(404);
    // bench under a red safelight hanging above the top edge
    const bench = R('#070203', '#110405', '#1c0708', '#2a0b0c');
    fill(px, 0, 0, W, H, (x, y) => dv(bench, 0.85 - Math.hypot(x - 110, y + 10) / 150, x, y));
    // the tray: rounded plastic, rim lit along the top
    const rim = R('#1a0607', '#2e0b0c', '#481213', '#6a1c1a', '#94302a');
    const inTray = (x, y, x0, y0, x1, y1, rr) => {
      const cx = clamp(x, x0 + rr, x1 - rr), cy = clamp(y, y0 + rr, y1 - rr);
      return Math.hypot(x - cx, y - cy) <= rr;
    };
    fill(px, 0, 0, W, H, (x, y) => {
      if (!inTray(x + 0.5, y + 0.5, 3, 2, 157, 92, 6)) return 0;
      const inner = inTray(x + 0.5, y + 0.5, 7, 6, 153, 88, 4);
      if (!inner) {
        let v = 0.45 + (y < 6 ? 0.35 : 0) - (y > 87 ? 0.25 : 0) + (x < 7 ? 0.1 : 0) - (x > 152 ? 0.15 : 0);
        if (y === 2 || (y === 3 && (x < 6 || x > 154))) v = 0.95;
        return dv(rim, v - (x / W) * 0.15, x, y);
      }
      return 0;
    });
    // developer: dark liquid with slow ripples and the safelight's reflection
    const liq = R('#0c0304', '#180607', '#260a0b', '#3a1010', '#5a1a18', '#a03a30');
    fill(px, 7, 6, 146, 82, (x, y) => {
      if (!inTray(x + 0.5, y + 0.5, 7, 6, 153, 88, 4)) return 0;
      const rip = Math.sin(Math.hypot(x - 150, y - 80) * 0.55) * 0.08;
      let v = 0.35 + rip - (y - 6) / 82 * 0.2;
      const rf = Math.hypot((x - 132) / 14, (y - 9) / 4);
      if (rf < 1) v += 0.65 * (1 - rf);
      if (y < 9) v -= 0.2;
      return dv(liq, v, x, y);
    });
    // the sheet, wet and lying just under the surface
    const paperR = R('#8a4a46', '#a86460', '#c27e76', '#d89a90', '#e8b4a8', '#f2c8bc');
    fill(px, SX, SY, SW, SH, (x, y) => {
      const u = (x - SX) / SW, v = (y - SY) / SH;
      return dv(paperR, 0.86 - u * 0.12 - v * 0.18 - (x === SX + SW - 1 || y === SY + SH - 1 ? 0.25 : 0), x, y);
    });
    if (photo) photo1977(px, SX + 3, SY + 3, SW - 6, SH - 6);
    // liquid washing over the lower-right corner of the sheet: darker film and ripple rings
    dim(px, SX, SY, SW, SH, (x, y) => (x - SX) + (y - SY) * 1.6 > 196 ? 1 : (x - SX) + (y - SY) * 1.6 > 186 ? 0.5 : 0, 0.35);
    for (const [rx, ry, rr] of [[132, 76, 6], [132, 76, 10], [40, 70, 4]])
      for (let a = 0; a < 40; a++) {
        const t = (a / 40) * Math.PI * 2, x = Math.round(rx + Math.cos(t) * rr), y = Math.round(ry + Math.sin(t) * rr * 0.45);
        if (Math.sin(t) < 0.3 && px.get(x, y)) px.set(x, y, G.lighten(px.get(x, y), 0.18));
      }
    // wet sheen: a broad soft highlight across the top-left of the sheet, plus a few bubbles
    glow(px, SX, SY, SW, SH, (x, y) => { const d = (x - SX) * 0.6 + (y - SY) - 18; return d > 0 && d < 10 ? 0.6 - Math.abs(d - 5) / 9 : 0; }, C('#ffe0d8'), 0.4);
    for (let i = 0; i < 14; i++) { const bx = SX + 4 + rnd.int(SW - 8), by = SY + 2 + rnd.int(8); px.set(bx, by, C('#ffe2d8')); px.set(bx + 1, by + 1, paperR[1]); }
    // bamboo tongs resting across the rim at the right
    const tong = R('#3a1408', '#5a2210', '#7a361c', '#a0502c');
    shade(px, mask(W, H, (m) => { m.thick(142, 40, 159, 18, 1.1, M); m.thick(145, 44, 159, 26, 1.1, M); }), tong, { r: 1.5, amb: 0.2 });
    px.rect(146, 30, 4, 3, C('#c0b0a0'));
    return G.frame(px, W / 2, H);
  }
  // the 1977 group photo itself, in a red-grey duotone under the safelight
  function photo1977(px, X, Y, IW, IH) {
    const r = R('#1c0a0c', '#341618', '#4e2426', '#6e3a3a', '#8e5452', '#ae726c', '#cc928a', '#e6b2a8');
    const im = new G.PX(IW, IH);
    // overcast sky
    fill(im, 0, 0, IW, IH, (x, y) => dv(r, 0.92 - y / 40, x, y));
    // the building: five floors of balconies, a stair tower, a water tank on the roof
    const BY0 = 6, FL = 8;
    fill(im, 0, BY0, IW, 44 - BY0, (x, y) => dv(r, 0.62 - (x > 108 ? 0.18 : 0), x, y));
    im.rect(90, 1, 10, 5, r[2]); im.rect(92, 0, 6, 2, r[3]); im.vline(91, 6, 6, r[1]); im.vline(98, 6, 6, r[1]);
    for (let f = 0; f < 5; f++) {
      const fy = BY0 + 2 + f * FL;
      im.hline(0, IW - 1, fy, r[6]);
      im.hline(0, IW - 1, fy + 1, r[2]);
      for (let x = 0; x < IW; x++) {
        if (x >= 52 && x < 62) continue;
        if (x % 12 < 9) { for (let y = fy + 2; y < fy + 6; y++) im.set(x, y, (x % 12) < 2 ? r[1] : r[2]); }
        if (x % 2 === 0) im.set(x, fy + 5, r[4]);
      }
      // laundry on a few balconies
      if (f < 4) for (const lx of [8 + f * 23, 78 - f * 9]) { im.rect(lx, fy + 2, 4, 3, r[7]); im.rect(lx + 5, fy + 2, 2, 4, r[6]); }
    }
    fill(im, 52, BY0, 10, 44 - BY0, (x, y) => dv(r, (x - 52) % 3 === 1 && y % 6 < 4 ? 0.2 : 0.58, x, y)); // stair tower
    // ground
    fill(im, 0, 44, IW, IH - 44, (x, y) => dv(r, 0.5 - (y - 44) / 60 + (G.hash(x, y, 2) - 0.5) * 0.12, x, y));
    // banner on two poles
    const BX0 = 24, BX1 = 98, BY = 15;
    im.vline(BX0 - 2, BY - 2, 46, r[1]); im.vline(BX1 + 2, BY - 2, 46, r[1]);
    fill(im, BX0, BY, BX1 - BX0 + 1, 14, (x, y) => dv(r, 0.95 - (y - BY) / 30 - (Math.sin((x - BX0) / 6) * 0.05), x, y));
    im.hline(BX0, BX1, BY + 13, r[4]);
    const l1 = 'HINATA HEIGHTS', l2 = '20th ANNIVERSARY', mid = (BX0 + BX1) / 2;
    mini(im, l1, Math.round(mid - miniW(l1) / 2), BY + 1, r[0]);
    mini(im, l2, Math.round(mid - miniW(l2) / 2), BY + 7, r[1]);
    // twelve tenants: seven standing at the back, five in front
    const person = (x, foot, h, o) => {
      const top = foot - h, hr = o.kid ? 2.5 : 3;
      const bw = o.kid ? 5 : 6, bodyTop = top + hr * 2;
      // legs
      const legT = foot - Math.round(h * 0.32);
      if (!o.dress) { im.rect(x - 2, legT, 2, foot - legT, r[o.legs || 1]); im.rect(x + 1, legT, 2, foot - legT, r[(o.legs || 1) + 0]); im.set(x + 2, legT, r[0]); }
      else { im.rect(x - 1, legT + 2, 1, foot - legT - 2, r[5]); im.rect(x + 1, legT + 2, 1, foot - legT - 2, r[5]); }
      // body
      const bodyB = o.dress ? legT + 2 : legT;
      for (let y = bodyTop; y < bodyB; y++) {
        const ww = o.dress ? Math.round(bw / 2 + (y - bodyTop) * 0.25) : Math.ceil(bw / 2);
        for (let xx = -ww; xx <= ww - (o.dress ? 0 : 1); xx++) im.set(x + xx, y, r[clamp(o.top + (xx >= ww - 1 ? -1 : xx <= -ww ? 1 : 0), 0, 7)]);
      }
      // head
      im.disc(x + 0.5, top + hr, hr, r[6]);
      im.set(x + 2, top + hr + 1, r[5]); im.set(x + 1, top + hr * 2 - 1, r[5]);
      // hair / hat
      const hc = r[o.hair === undefined ? 0 : o.hair];
      if (o.hat) { im.hline(x - 3, x + 3, top + 1, r[1]); im.rect(x - 2, top - 1, 5, 2, r[1]); }
      else if (o.perm) { im.disc(x + 0.5, top + 1.5, 3.2, hc); im.set(x - 3, top + 3, hc); im.set(x + 3, top + 3, hc); }
      else { im.hline(x - 2, x + 2, top, hc); im.hline(x - 2, x + 3, top + 1, hc); im.set(x - 2, top + 2, hc); }
      // eyes
      im.set(x - 1, top + hr, r[2]); im.set(x + 1, top + hr, r[2]);
      if (o.baby) { im.disc(x - 2, bodyTop + 3, 2.2, r[7]); im.set(x - 2, bodyTop + 3, r[5]); }
    };
    const back = [
      [10, 25, { top: 2, hair: 6, perm: true, dress: true }],
      [21, 27, { top: 1, hat: true }],
      [32, 25, { top: 5, hair: 0, perm: true, dress: true, baby: true }],
      [43, 26, { top: 2, hair: 1 }],
      [54, 24, { top: 6, hair: 0, dress: true }],
      [65, 27, { top: 3, hair: 5 }],
      [76, 25, { top: 4, hair: 0, perm: true, dress: true }],
    ];
    back.forEach(([x, h, o]) => person(x, 60, h, o));
    const front = [
      [14, 16, { top: 6, hair: 0, kid: true }],
      [26, 15, { top: 3, hair: 0, kid: true, dress: true }],
      [38, 17, { top: 5, hair: 1, kid: true }],
      [50, 14, { top: 2, hair: 0, kid: true }],
      [62, 16, { top: 6, hair: 0, kid: true, dress: true }],
    ];
    front.forEach(([x, h, o]) => person(x, 66, h, o));
    // Haru at 28, in front at the right, a camera strap across his chest (he set the timer)
    const hx = 96;
    im.rect(hx - 4, 52, 9, IH - 52, r[2]);
    im.vline(hx + 4, 52, IH - 1, r[1]); im.vline(hx - 4, 53, IH - 1, r[3]);
    im.rect(hx - 6, 54, 2, 10, r[2]); im.rect(hx + 5, 54, 2, 10, r[1]);
    im.disc(hx + 0.5, 46, 4, r[6]); im.set(hx + 3, 47, r[5]); im.hline(hx - 2, hx + 3, 49, r[5]);
    im.hline(hx - 3, hx + 3, 42, r[0]); im.hline(hx - 4, hx + 4, 43, r[0]); im.set(hx - 4, 44, r[0]); im.set(hx + 4, 44, r[0]); im.set(hx - 3, 41, r[1]);
    im.set(hx - 1, 46, r[1]); im.set(hx + 2, 46, r[1]); im.hline(hx, hx + 1, 48, r[3]);
    im.line(hx - 3, 52, hx + 3, 60, r[7]); im.line(hx - 2, 52, hx + 4, 60, r[6]);
    im.rect(hx + 1, 59, 6, 4, r[0]); im.disc(hx + 4, 61, 1.2, r[3]); im.set(hx + 2, 59, r[2]);
    // photo grain and a soft vignette
    for (let y = 0; y < IH; y++)
      for (let x = 0; x < IW; x++) {
        const c = im.get(x, y), i = r.indexOf(c);
        if (i < 0) continue;
        const vg = Math.hypot((x - IW / 2) / (IW / 2), (y - IH / 2) / (IH / 2));
        const k = i + (G.hash(x, y, 77) < 0.07 ? (G.hash(y, x, 5) < 0.5 ? 1 : -1) : 0) - (vg > 0.9 && bay(x, y) < (vg - 0.9) * 2 ? 1 : 0);
        im.set(x, y, r[clamp(k, 0, 7)]);
      }
    px.blit(im, X, Y);
  }
  G.defSprite('pic_blank', () => trayScene(false));
  G.defSprite('pic_photo_1977', () => trayScene(true));

  // =====================================================================
  // pic_monitor: grainy security view of the lobby; then an old man in a cardigan
  // standing in the middle, staring up at the camera
  // =====================================================================
  G.defSprite('pic_monitor', () => {
    const W = 160, H = 90;
    const r = R('#07090a', '#14181a', '#262c2e', '#3c4244', '#565c5c', '#747a78', '#969c98', '#bcc2bc', '#e2e6de');
    // scene as values (stored as ints 1..1000 in a PX so the PX shapes can paint it)
    const V = (v) => Math.max(1, Math.round(v * 1000));
    const sc = new G.PX(W, H);
    const VP = [80, 20];
    // ceiling, walls, floor
    sc.poly([[0, 0], [160, 0], [116, 10], [44, 10]], V(0.22));
    sc.poly([[0, 0], [44, 10], [44, 40], [0, 92]], V(0.42));
    sc.poly([[160, 0], [116, 10], [116, 40], [160, 92]], V(0.3));
    sc.rect(44, 10, 72, 30, V(0.5));
    sc.poly([[0, 92], [44, 40], [116, 40], [160, 92]], V(0.58));
    // floor tiles: depth lines and lines toward the vanishing point
    for (const z of [1.15, 1.35, 1.6, 1.9, 2.3, 2.8]) { const y = Math.round(20 + 70 / z * 0.95 + 3); if (y > 40 && y < 90) for (let x = 0; x < W; x++) if (sc.get(x, y) === V(0.58)) sc.set(x, y, V(0.5)); }
    for (let k = -8; k <= 8; k++) { const bx = 80 + k * 18; for (let y = 41; y < 90; y++) { const x = Math.round(VP[0] + (bx - VP[0]) * (y - VP[1]) / 70); if (sc.get(x, y) === V(0.58)) sc.set(x, y, V(0.5)); } }
    // ceiling light panel and its smear on the polished floor
    sc.poly([[68, 3], [92, 3], [89, 7], [71, 7]], V(0.98));
    for (let y = 42; y < 62; y++) for (let x = 72; x < 88; x++) { const d = Math.abs(x - 80) / 8 + (y - 42) / 20; if (d < 1 && sc.get(x, y) >= V(0.5)) sc.set(x, y, V(0.58 + 0.3 * (1 - d))); }
    // glass entrance doors at the back (night outside), with a light frame
    sc.rect(62, 17, 36, 23, V(0.62));
    sc.rect(64, 19, 15, 21, V(0.08)); sc.rect(81, 19, 15, 21, V(0.08));
    sc.vline(72, 22, 32, V(0.2)); sc.vline(88, 22, 32, V(0.2));
    sc.rect(77, 28, 2, 3, V(0.7)); sc.rect(81, 28, 2, 3, V(0.7));
    // a rain-streaked reflection in the doors
    for (let i = 0; i < 6; i++) sc.vline(66 + i * 5, 21 + (i % 3), 26 + (i % 3) * 3, V(0.2));
    // mailboxes on the left wall (in perspective)
    for (let i = 0; i <= 5; i++) {
      const x = 8 + i * 6, yt = Math.round(14 + (x / 44) * 10 * 0.3 + 10 - x * 0.05), yb = Math.round(92 - (x / 44) * 52) - 22;
      sc.vline(x, yt, yb, V(0.2));
      if (i < 5) for (let j = 0; j < 4; j++) { const yy = Math.round(yt + (yb - yt) * (j / 4)); sc.hline(x, x + 5, yy, V(0.2)); sc.set(x + 3, yy + 2, V(0.72)); }
    }
    // bench along the right wall, a potted plant in the corner
    sc.poly([[124, 52], [150, 60], [150, 64], [124, 56]], V(0.68));
    sc.poly([[124, 56], [150, 64], [150, 68], [124, 59]], V(0.25));
    sc.vline(127, 57, 63, V(0.15)); sc.vline(147, 64, 72, V(0.15));
    sc.rect(110, 36, 6, 6, V(0.3)); sc.disc(113, 31, 5, V(0.2)); sc.disc(111, 28, 3, V(0.28)); sc.disc(116, 30, 3, V(0.16));
    // a notice board on the back wall
    sc.rect(48, 16, 10, 12, V(0.7)); sc.rect(49, 18, 4, 3, V(0.85)); sc.rect(54, 21, 3, 4, V(0.82)); sc.rect(50, 23, 3, 3, V(0.6));
    // the man (old Haru), standing in the middle, looking up at the camera
    const man = sc.clone();
    {
      const x = 80, foot = 74;
      man.ellipse(x + 1, foot, 10, 3, V(0.3)); // shadow
      man.rect(x - 4, foot - 8, 3, 8, V(0.12)); man.rect(x + 1, foot - 8, 3, 8, V(0.09)); // trousers
      man.rect(x - 5, foot - 1, 4, 2, V(0.05)); man.rect(x + 1, foot - 1, 4, 2, V(0.05));
      man.poly([[x - 8, foot - 22], [x + 8, foot - 22], [x + 7, foot - 8], [x - 7, foot - 8]], V(0.36)); // cardigan
      man.vline(x + 3, foot - 21, foot - 9, V(0.3));
      man.poly([[x - 3, foot - 22], [x + 3, foot - 22], [x + 1, foot - 17], [x - 1, foot - 17]], V(0.66)); // shirt collar
      man.vline(x, foot - 17, foot - 9, V(0.6)); for (const by of [15, 12]) man.set(x - 1, foot - by, V(0.72));
      man.rect(x - 10, foot - 21, 3, 11, V(0.31)); man.rect(x + 7, foot - 21, 3, 11, V(0.26)); // arms hanging
      man.rect(x - 10, foot - 10, 3, 2, V(0.7)); man.rect(x + 7, foot - 10, 3, 2, V(0.64)); // hands
      man.ellipse(x, foot - 29, 7, 7.5, V(0.72)); // face turned up
      man.ellipse(x, foot - 33.5, 7.2, 3.8, V(0.86)); // grey hair, lit from the ceiling light
      man.set(x - 7, foot - 29, V(0.62)); man.set(x + 7, foot - 29, V(0.56));
      // glasses catching the light, dark eyes under them, a flat mouth
      man.rect(x - 5, foot - 30, 4, 2, V(0.98)); man.rect(x + 1, foot - 30, 4, 2, V(0.98)); man.set(x - 1, foot - 30, V(0.2)); man.set(x, foot - 30, V(0.2));
      man.set(x - 3, foot - 28, V(0.06)); man.set(x + 3, foot - 28, V(0.06));
      man.set(x, foot - 26, V(0.5)); man.hline(x - 2, x + 2, foot - 24, V(0.4));
    }
    const frames = [];
    for (let f = 0; f < 16; f++) {
      const scene = f < 8 ? sc : man, rnd = G.rng(900 + f), px = new G.PX(W, H);
      const roll = ((f * 13) % 120) - 15;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          let v = scene.get(x, y) / 1000;
          v += (rnd() - 0.5) * 0.22; // grain
          if (y % 2) v -= 0.05; // scanlines
          if (y >= roll && y < roll + 5) v += 0.08;
          const e = Math.hypot((x - 80) / 92, (y - 45) / 58);
          v -= Math.max(0, e - 0.7) * 0.9;
          px.set(x, y, dv(r, v, x, y));
        }
      // overlays
      const ov = C('#e6eae2');
      text(px, 'CAM 1', 8, 6, ov);
      if (f % 2 === 0) { px.disc(127.5, 9.5, 2.2, C('#c8ccc4')); }
      text(px, 'REC', 132, 6, ov);
      const sec = 7 + Math.floor(f / 4);
      const ts = '03:12:' + (sec < 10 ? '0' : '') + sec;
      text(px, ts, W - 8 - textW(ts), H - 13, ov);
      // CRT corners
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const cx = clamp(x, 8, W - 9), cy = clamp(y, 8, H - 9);
          if (Math.hypot(x - cx, y - cy) > 8) px.set(x, y, C('#030404'));
        }
      frames.push(G.frame(px, W / 2, H));
    }
    return frames;
  }, 4);

  // =====================================================================
  // pic_peephole: fish-eye view of the open-air corridor in the rain; then the view is
  // filled by a grey uniform button and a ring of keys
  // =====================================================================
  function fishEye(src, W, H, cx, cy, rad, rim) {
    const px = new G.PX(W, H), S = src.w / 2;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy) / rad;
        if (d > 1) continue;
        const s = 0.62 * d + 0.38 * d * d * d, k = d > 0 ? s / d : 0;
        let c = src.get(Math.floor(S + dx / rad * S * k), Math.floor(S + dy / rad * S * k));
        if (!c) c = C('#000000');
        if (d > 0.72) c = G.darken(c, Math.floor(((d - 0.72) / 0.28) * 3 + bay(x, y)) / 3 * 0.75);
        px.set(x, y, c);
      }
    // lens rim with a highlight at the top-left, and a curved glare on the glass
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy);
        const a = Math.atan2(dy, dx);
        if (d > rad && d <= rad + 2.2) px.set(x, y, Math.cos(a + 2.36) > 0.55 ? C(rim[1]) : C(rim[0]));
        if (d > rad - 6 && d < rad - 4 && a > -2.6 && a < -1.9) px.set(x, y, G.lighten(px.get(x, y), 0.3));
      }
    return px;
  }
  function corridorSrc(phase) {
    const S = 128, s = new G.PX(S, S), rnd = G.rng(50 + phase);
    const con = R('#0c0d12', '#16171e', '#22232a', '#30313a', '#41424c', '#56575f', '#6e6f76', '#8a8b90');
    // ceiling underside, the fluorescent tube and its halo
    fill(s, 0, 0, S, 28, (x, y) => dv(con, 0.5 - Math.hypot(x - 64, (y - 17) * 2.2) / 90, x, y));
    s.rect(38, 14, 52, 6, C('#7a7c78')); s.hline(38, 89, 14, C('#a8aaa4'));
    s.rect(40, 16, 48, 3, C('#f2fbf0')); s.hline(40, 87, 19, C('#b0c8b4'));
    // the edge of the slab, lit
    fill(s, 0, 28, S, 4, (x, y) => dv(con, (y === 28 ? 0.9 : 0.6) - Math.abs(x - 64) / 110, x, y));
    // night beyond: dark sky, a black block across the way with three lit windows
    fill(s, 0, 32, S, 30, (x, y) => dv(R('#05060a', '#0a0c14', '#10141e'), 0.25 + (y - 32) / 60, x, y));
    s.rect(0, 42, S, 20, C('#0c0e16'));
    for (const [wx, wy] of [[20, 46], [74, 52], [104, 46]]) { s.rect(wx, wy, 3, 2, C('#9a7e4c')); s.set(wx, wy, C('#c8a868')); }
    // rain: thin streaks, brighter where the tube lights them
    for (let i = 0; i < 90; i++) {
      const x = (i * 37 + (i % 7) * 3) % S, y0 = 32 + ((i * 53 + phase * 7) % 32);
      for (let j = 0; j < 3; j++) { const y = y0 + j; if (y < 62) s.set(x - (j > 1 ? 1 : 0), y, Math.abs(x - 64) < 34 ? C('#8a94a6') : C('#38404e')); }
    }
    // handrail and the parapet wall, lit from above
    s.rect(0, 59, S, 3, C('#5c606a')); s.hline(0, S - 1, 59, C('#b0b6c0')); s.hline(0, S - 1, 61, C('#24262e'));
    for (let x = 6; x < S; x += 20) s.rect(x, 62, 2, 3, C('#3a3c44'));
    fill(s, 0, 65, S, 31, (x, y) => dv(con, 0.95 - (y - 65) / 34 - Math.abs(x - 64) / 140 + (G.vnoise(x / 2, y / 14, 3) < 0.3 ? -0.12 : 0), x, y));
    s.hline(0, S - 1, 65, C('#a0a2a6'));
    for (let i = 0; i < 10; i++) { const x = rnd.int(S); s.set(x, 64, C('#d8e0ec')); s.set(x - 1, 63, C('#8a94a8')); s.set(x + 1, 63, C('#8a94a8')); }
    // wet floor: the tube's reflection, the parapet's, rings in the puddles
    fill(s, 0, 96, S, 32, (x, y) => {
      let v = 0.32 - (y - 96) / 60;
      const rf = Math.abs(x - 64) / 26 + Math.abs(y - 112) / 22;
      if (rf < 1) v += 0.55 * (1 - rf) * (y % 3 === 0 ? 0.55 : 1);
      return dv(con, v, x, y);
    });
    s.hline(0, S - 1, 96, C('#1a1b22'));
    for (let i = 0; i < 4; i++) {
      const rx = 22 + ((i * 31 + phase * 13) % 84), ry = 104 + ((i * 7) % 16), rr = 2 + ((phase + i) % 3) * 2;
      for (let a = 0; a < 24; a++) { const t = (a / 24) * Math.PI * 2; const x = Math.round(rx + Math.cos(t) * rr), y = Math.round(ry + Math.sin(t) * rr * 0.4); s.set(x, y, G.lighten(s.get(x, y), 0.18)); }
    }
    // concrete columns either side, their inner edges catching the light
    fill(s, 0, 0, 14, S, (x, y) => dv(con, 0.18 + (x >= 12 ? 0.35 : 0) - y / 500, x, y));
    fill(s, 114, 0, 14, S, (x, y) => dv(con, 0.14 + (x <= 115 ? 0.3 : 0) - y / 500, x, y));
    return s;
  }
  function buttonSrc(phase) {
    const S = 128, s = new G.PX(S, S);
    const cloth = R('#121418', '#1c1f24', '#272a30', '#33363e', '#41444c', '#52565e');
    // twill weave with soft folds; the ceiling light comes from above his shoulder
    fill(s, 0, 0, S, S, (x, y) => {
      let v = 0.62 - y / 200 + Math.sin(x * 0.07 + y * 0.025 + phase * 0.15) * 0.12 - Math.abs(x - 40) / 400;
      if (G.mod(x + y * 2, 4) === 0) v -= 0.12;
      return dv(cloth, v, x, y);
    });
    // the placket and its stitching
    const px0 = 44 + (phase % 2);
    fill(s, px0, 0, 12, S, (x, y) => dv(cloth, (x === px0 ? 0.85 : x === px0 + 11 ? 0.1 : 0.55) - y / 260, x, y));
    for (let y = 1; y < S; y += 3) { s.set(px0 + 2, y, cloth[1]); s.set(px0 + 9, y, cloth[1]); }
    // the button
    const bx = 50 + (phase % 2), by = 52;
    const btn = R('#202228', '#34363e', '#4a4c54', '#62646c', '#7c7e86', '#a0a2a8');
    shade(s, mask(S, S, (m) => m.disc(bx, by + 2, 15, M)), [cloth[0], cloth[0], cloth[1]], { r: 2 }); // its shadow
    shade(s, mask(S, S, (m) => m.disc(bx, by, 14, M)), btn, { r: 5, amb: 0.2 });
    shade(s, mask(S, S, (m) => m.disc(bx, by, 9.5, M)), btn, { r: 3, amb: 0.15, light: [0.6, 0.7, 0.6] }); // dished centre
    for (const [hx, hy] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) s.disc(bx + hx + 0.5, by + hy + 0.5, 1.4, C('#0c0d10'));
    s.line(bx - 3, by - 3, bx + 3, by + 3, C('#8a8c94')); s.line(bx + 3, by - 3, bx - 3, by + 3, C('#6a6c74'));
    // a ring of keys on a clip, swinging a little
    const kx = 88, ky = 82, sw = [0, 1, 2][phase % 3] - 1;
    const steel = R('#26282e', '#4a4c54', '#72747c', '#a2a4aa', '#d4d6da');
    const brass = R('#36260e', '#62481e', '#94702e', '#c49c4c', '#eacc88');
    shade(s, mask(S, S, (m) => { m.rect(kx - 2, ky - 30, 5, 18, M); m.rect(kx - 4, ky - 32, 9, 4, M); }), steel, { r: 2, amb: 0.2 });
    for (let a = 0; a < 90; a++) { const t = (a / 90) * Math.PI * 2; s.disc(kx + Math.cos(t) * 11, ky + Math.sin(t) * 11, 1.3, sv(steel, 0.55 - Math.sin(t + 0.8) * 0.45)); }
    // three keys hanging from the bottom of the ring
    [[-0.45, brass, 20], [0.02, steel, 24], [0.42, brass, 18]].forEach(([ang, ramp, len], i) => {
      const a = ang + sw * 0.06, bx = kx + Math.sin(a) * 15, by = ky + 11 + Math.cos(a) * 4;
      const ex = bx + Math.sin(a) * len, ey = by + Math.cos(a) * len;
      const km = mask(S, S, (m) => {
        m.disc(bx, by, 5, M);
        m.thick(bx, by, ex, ey, 1.7, M);
        for (let t = 0; t < 3; t++) { const u = 0.55 + t * 0.14; m.disc(bx + (ex - bx) * u + Math.cos(a) * 2.4, by + (ey - by) * u - Math.sin(a) * 2.4, 1.3, M); }
      });
      shade(s, km, ramp, { r: 2.2, amb: 0.25 });
      s.disc(bx, by - 1, 1.6, C('#0c0d10'));
    });
    // a plastic tag on the ring: 404
    const tx = kx - 27 + sw, ty = ky + 2;
    shade(s, mask(S, S, (m) => m.rect(tx, ty, 15, 9, M)), R('#6a6452', '#a09a84', '#cac4ac', '#e8e2ca'), { r: 2, amb: 0.4 });
    s.line(tx + 14, ty + 2, kx - 10, ky + 2, steel[3]);
    mini(s, '404', tx + 2, ty + 2, C('#2a1a1a'));
    return s;
  }
  G.defSprite('pic_peephole', () => {
    const frames = [];
    const view = [], btn = [];
    for (let p = 0; p < 3; p++) view.push(G.frame(fishEye(corridorSrc(p), 160, 90, 80, 45, 42, ['#141418', '#5a5a64']), 80, 90));
    for (let p = 0; p < 3; p++) btn.push(G.frame(fishEye(buttonSrc(p), 160, 90, 80, 45, 42, ['#141418', '#5a5a64']), 80, 90));
    for (let i = 0; i < 12; i++) frames.push(view[i % 3]);
    for (let i = 0; i < 9; i++) frames.push(btn[[0, 1, 2, 1][i % 4]]);
    return frames;
  }, 6);

  // shared ramps for the paintings
  const SKIN_OLD = R('#2a1814', '#4a2e26', '#6e4838', '#94664e', '#b48466', '#d0a284', '#e4bea0');
  const HAIR_GREY = R('#3a3a42', '#5a5a64', '#7c7c86', '#a0a0a8', '#c4c4ca', '#e0e0e4');
  const CARDI = R('#1e140e', '#34241a', '#4e3726', '#6a4c34', '#866446', '#a07e5a');

  // =====================================================================
  // pic_mirror_old: the bathroom mirror shows old Haru, one hand flat on the glass. Calm, sad.
  // =====================================================================
  G.defSprite('pic_mirror_old', () => {
    const W = 160, H = 90, px = new G.PX(W, H);
    // small square bathroom tiles, pale green, a bulb above at the top-left
    const tile = R('#1c2420', '#2a3430', '#3a4640', '#4c5a52', '#5e6c64', '#708078');
    fill(px, 0, 0, W, H, (x, y) => {
      const g = x % 6 === 5 || y % 6 === 5;
      return dv(tile, 0.9 - Math.hypot(x - 30, y + 10) / 170 - (g ? 0.22 : 0) + (x % 6 === 0 || y % 6 === 0 ? 0.08 : 0), x, y);
    });
    const MX = 34, MY = 4, MW = 92, MH = 80;
    dim(px, MX + 2, MY + 2, MW + 2, MH + 2, (x, y) => (x >= MX + MW || y >= MY + MH ? 1 : 0), 0.6);
    // the reflection: a care-home room behind him, cool and dim
    const roomR = R('#1e2026', '#2a2c34', '#383a42', '#484a52', '#5a5c62', '#6c6e72');
    const rf = new G.PX(MW, MH);
    fill(rf, 0, 0, MW, MH, (x, y) => dv(roomR, 0.75 - y / 160 - Math.abs(x - 50) / 200, x, y));
    // handrail along the wall, a door edge at the right
    fill(rf, 0, 50, MW, 4, (x, y) => sv(R('#3a2a20', '#5a4230', '#7a5a40', '#9a7654'), y === 50 ? 1 : y === 51 ? 0.66 : y === 52 ? 0.33 : 0));
    for (const bx of [8, 70]) rf.rect(bx, 54, 2, 3, C('#4a4c52'));
    fill(rf, 78, 0, MW - 78, MH, (x, y) => dv(roomR, (x === 78 ? 0.75 : 0.3) - y / 300, x, y));
    rf.rect(82, 40, 3, 6, C('#6a6c70'));
    // body: brown cardigan over a pale shirt, shoulders a little slumped
    const cx = 50;
    shade(rf, mask(MW, MH, (m) => { m.poly([[cx - 22, 57], [cx - 8, 50], [cx + 8, 50], [cx + 22, 57], [cx + 27, MH], [cx - 27, MH]], M); }), CARDI, { r: 7, amb: 0.12 });
    rf.poly([[cx - 6, 50], [cx + 6, 50], [cx + 2, 64], [cx - 2, 64]], C('#a8a294'));
    rf.line(cx - 6, 50, cx - 1, 63, C('#7a766c')); rf.line(cx + 6, 50, cx + 1, 63, C('#cac4b6'));
    rf.line(cx - 7, 51, cx - 1, MH, CARDI[1]); rf.line(cx + 7, 51, cx + 1, MH, CARDI[1]);
    for (const by of [68, 75]) { rf.rect(cx - 1, by, 2, 2, C('#c8b48a')); rf.set(cx - 1, by, C('#e0d0aa')); }
    // neck
    shade(rf, mask(MW, MH, (m) => m.rect(cx - 5, 40, 10, 11, M)), SKIN_OLD, { r: 3, amb: 0.05, add: () => -0.15 });
    // head
    const hx = cx, hy = 30;
    shade(rf, mask(MW, MH, (m) => { m.ellipse(hx - 11.5, hy + 4, 2.5, 4, M); m.ellipse(hx + 11.5, hy + 4, 2.5, 4, M); }), SKIN_OLD, { r: 2, amb: 0.1 }); // ears
    shade(rf, mask(MW, MH, (m) => { m.ellipse(hx, hy, 10.5, 13, M); m.ellipse(hx, hy + 8, 8.5, 7, M); }), SKIN_OLD, { r: 7, amb: 0.22 });
    // thinning grey hair, combed back; fuller at the sides
    shade(rf, mask(MW, MH, (m) => { m.ellipse(hx, hy - 7, 11.5, 8, M); m.rect(hx - 12, hy - 7, 3, 9, M); m.rect(hx + 9, hy - 7, 3, 9, M); }), HAIR_GREY, {
      r: 4, amb: 0.25, clip: (x, y) => y < hy - 8 + Math.abs(x - hx) * 0.35 || Math.abs(x - hx) > 8,
    });
    for (let i = 0; i < 7; i++) rf.line(hx - 6 + i * 2, hy - 13, hx - 5 + i * 2, hy - 9, i % 2 ? HAIR_GREY[4] : HAIR_GREY[2]);
    // forehead lines
    rf.hline(hx - 5, hx + 4, hy - 6, SKIN_OLD[3]); rf.hline(hx - 4, hx + 3, hy - 4, SKIN_OLD[3]);
    // sad brows: inner ends raised
    const brow = HAIR_GREY[3];
    rf.line(hx - 9, hy - 1, hx - 3, hy - 3, brow); rf.line(hx + 3, hy - 3, hx + 9, hy - 1, HAIR_GREY[2]);
    // eyes: heavy lids, dark irises looking out, bags underneath
    for (const ex of [hx - 5, hx + 5]) {
      rf.hline(ex - 2, ex + 2, hy + 1, SKIN_OLD[1]);
      rf.set(ex - 1, hy + 2, C('#e0dcd4')); rf.rect(ex, hy + 2, 2, 1, C('#1c1418'));
      rf.set(ex + 2, hy + 2, SKIN_OLD[2]);
      rf.hline(ex - 1, ex + 2, hy + 4, SKIN_OLD[3]);
    }
    // glasses: thin dark frames with a glint at the top-left of each lens
    const gl = C('#24202a');
    for (const ex of [hx - 5, hx + 5]) {
      rf.hline(ex - 4, ex + 3, hy - 1, gl); rf.hline(ex - 3, ex + 2, hy + 5, gl);
      rf.vline(ex - 4, hy, hy + 4, gl); rf.vline(ex + 3, hy, hy + 4, gl);
      rf.set(ex - 3, hy, C('#e8eef0')); rf.set(ex - 2, hy, C('#b8c2c6'));
    }
    rf.hline(hx - 1, hx, hy, gl); rf.hline(hx - 13, hx - 9, hy, gl); rf.hline(hx + 8, hx + 12, hy, gl);
    // nose (shadow on its right side), mouth slightly turned down, deep folds
    rf.vline(hx + 1, hy + 4, hy + 8, SKIN_OLD[3]); rf.set(hx + 2, hy + 9, SKIN_OLD[2]); rf.set(hx - 2, hy + 9, SKIN_OLD[3]); rf.set(hx, hy + 9, SKIN_OLD[2]);
    rf.line(hx - 4, hy + 8, hx - 5, hy + 13, SKIN_OLD[3]); rf.line(hx + 4, hy + 8, hx + 5, hy + 13, SKIN_OLD[2]);
    rf.hline(hx - 2, hx + 2, hy + 13, SKIN_OLD[1]); rf.set(hx - 3, hy + 14, SKIN_OLD[2]); rf.set(hx + 3, hy + 14, SKIN_OLD[2]);
    rf.hline(hx - 1, hx + 1, hy + 14, SKIN_OLD[4]);
    rf.hline(hx - 3, hx + 3, hy + 17, SKIN_OLD[3]); // chin crease
    // his right hand, flat against the glass (palm out, fingers up), the cardigan sleeve below
    const pxh = 18, pyh = 40;
    shade(rf, mask(MW, MH, (m) => { m.poly([[pxh - 7, pyh + 8], [pxh + 7, pyh + 8], [pxh + 12, MH], [pxh - 4, MH]], M); }), CARDI, { r: 5, amb: 0.15 });
    fill(rf, pxh - 7, pyh + 8, 15, 4, (x, y) => (inM(rf, x, y) ? dv(CARDI, 0.8 - (y - pyh - 8) * 0.15 - (x % 2 ? 0.15 : 0), x, y) : 0));
    const hand = mask(MW, MH, (m) => {
      m.ellipse(pxh, pyh, 7.5, 8.5, M);
      m.rect(pxh - 6, pyh, 12, 9, M);
      m.thick(pxh - 5, pyh - 4, pxh - 7, pyh - 15, 1.6, M);
      m.thick(pxh - 1.5, pyh - 5, pxh - 2, pyh - 19, 1.7, M);
      m.thick(pxh + 2.5, pyh - 5, pxh + 3, pyh - 18, 1.7, M);
      m.thick(pxh + 6, pyh - 3, pxh + 7, pyh - 13, 1.5, M);
      m.thick(pxh + 7, pyh + 3, pxh + 13, pyh - 3, 1.7, M);
    });
    shade(rf, hand, SKIN_OLD, { r: 3, amb: 0.3, flat: 0.6 });
    // pressed palm: paler where it meets the glass; finger creases; mist around the hand
    glow(rf, pxh - 5, pyh - 4, 11, 12, (x, y) => 1 - Math.hypot((x - pxh) / 5, (y - pyh - 1) / 6), C('#f0d8c4'), 0.5);
    for (const [fx, fy] of [[pxh - 6, pyh - 9], [pxh - 2, pyh - 11], [pxh + 3, pyh - 11], [pxh + 6, pyh - 8]]) { rf.set(fx, fy, SKIN_OLD[3]); rf.set(fx + 1, fy, SKIN_OLD[3]); }
    rf.line(pxh - 4, pyh + 2, pxh + 3, pyh - 1, SKIN_OLD[3]);
    rf.line(pxh - 4, pyh + 5, pxh + 4, pyh + 4, SKIN_OLD[4]);
    for (const [sx, sy] of [[pxh + 2, pyh + 6], [pxh - 3, pyh - 2]]) rf.set(sx, sy, SKIN_OLD[3]);
    const mist = mask(MW, MH, (m) => { for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (!inM(hand, x, y) && (inM(hand, x - 2, y) || inM(hand, x + 2, y) || inM(hand, x, y - 2) || inM(hand, x, y + 2))) m.set(x, y, M); });
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (inM(mist, x, y) && bay(x, y) < 0.5) rf.set(x, y, G.lighten(rf.get(x, y), 0.25));
    // the glass: cool tint, a soft streak across the top-right corner, darker edges
    rf.map((c) => G.mix(c, C('#7a8c92'), 0.1));
    glow(rf, 0, 0, MW, MH, (x, y) => { const d = x - y * 0.8 - 52; return d > 0 && d < 9 ? 0.55 - Math.abs(d - 4.5) / 9 : d > 12 && d < 14 ? 0.35 : 0; }, C('#e8f4f8'), 0.3);
    dim(rf, 0, 0, MW, MH, (x, y) => { const e = Math.min(x, y, MW - 1 - x, MH - 1 - y); return e < 5 ? 1 - e / 5 : 0; }, 0.5);
    px.blit(rf, MX, MY);
    // steel frame
    fill(px, MX - 2, MY - 2, MW + 4, MH + 4, (x, y) => {
      const i = x - MX, j = y - MY;
      if (i >= 0 && j >= 0 && i < MW && j < MH) return 0;
      return sv(R('#3a3e44', '#6a6e76', '#9ea2aa', '#c8ccd2'), (j < 0 ? 0.9 : i < 0 ? 0.65 : i >= MW ? 0.3 : 0.15) + (i + j < 0 ? 0.1 : 0));
    });
    // a little shelf with a cup and toothbrush
    px.rect(MX + 4, MY + MH + 2, MW - 8, 3, C('#a8acb2')); px.hline(MX + 4, MX + MW - 5, MY + MH + 2, C('#d4d8dc')); px.hline(MX + 4, MX + MW - 5, MY + MH + 4, C('#5a5e64'));
    px.rect(MX + 12, MY + MH - 3, 5, 5, C('#7a9a8a')); px.vline(MX + 12, MY + MH - 3, MY + MH + 1, C('#9ababa'));
    px.line(MX + 15, MY + MH - 3, MX + 17, MY + MH - 8, C('#c8c0b0')); px.rect(MX + 17, MY + MH - 10, 1, 3, C('#d0d8e8'));
    return G.frame(px, W / 2, H);
  });

  // =====================================================================
  // pic_hands_receiver: two old hands holding the black telephone receiver
  // =====================================================================
  G.defSprite('pic_hands_receiver', () => {
    const W = 160, H = 90, px = new G.PX(W, H);
    // dark desk top, a lamp somewhere above-left
    const desk = R('#0a0706', '#140e0b', '#1e1510', '#2a1d15', '#38271c');
    fill(px, 0, 0, W, H, (x, y) => dv(desk, 0.8 - Math.hypot(x - 30, y - 10) / 150 + (G.vnoise(x / 18, y / 1.5, 21) - 0.5) * 0.25, x, y));
    // the phone's body at the top right, with part of the dial
    const blk = R('#060508', '#0e0c12', '#18161e', '#26232e', '#3a3644', '#5a5666', '#8a8698');
    shade(px, mask(W, H, (m) => { m.ellipse(150, 6, 30, 18, M); }), blk, { r: 8, amb: 0.08 });
    for (let a = 0; a < 10; a++) { const t = Math.PI * 0.55 + a * 0.32; const x = 148 + Math.cos(t) * 11, y = 4 + Math.sin(t) * 8; if (y > 0) { px.disc(x, y, 2, blk[4]); px.disc(x, y, 1.2, blk[1]); } }
    px.disc(148, 4, 4, C('#c8c2b4')); px.disc(148, 4, 2.5, C('#9a948a'));
    // the receiver
    const rec = mask(W, H, (m) => { m.thick(34, 40, 120, 45, 5, M); m.ellipse(26, 43, 14, 11, M); m.ellipse(129, 49, 14, 11, M); });
    shade(px, rec, blk, { r: 6, amb: 0.08, dif: 0.7 });
    // glossy highlight running along the top of the handle and the cup rims
    for (let x = 36; x < 118; x++) { const y = Math.round(36 + (x - 34) * (5 / 86)); if (bay(x, y) < 0.8) px.set(x, y, blk[5]); if (x > 50 && x < 80) px.set(x, y, blk[6]); }
    for (let a = 0; a < 30; a++) { const t = Math.PI * 1.1 + a * 0.03; px.set(Math.round(26 + Math.cos(t) * 11), Math.round(43 + Math.sin(t) * 8), blk[6]); px.set(Math.round(129 + Math.cos(t) * 11), Math.round(49 + Math.sin(t) * 8), blk[5]); }
    for (const [ex, ey] of [[26, 43], [129, 49]]) for (let a = 0; a < 48; a++) { const t = (a / 48) * Math.PI * 2; px.set(Math.round(ex + Math.cos(t) * 8), Math.round(ey + Math.sin(t) * 6), blk[2]); }
    // coiled cord from the mouthpiece, down out of the frame
    for (let i = 0; i < 9; i++) {
      const cx = 138 + i * 1.6, cy = 58 + i * 4;
      for (let a = 0; a < 16; a++) { const t = (a / 16) * Math.PI * 2; px.set(Math.round(cx + Math.cos(t) * 3), Math.round(cy + Math.sin(t) * 1.6), Math.sin(t) < 0 ? blk[2] : blk[4]); }
    }
    // hands: back of the hand toward us, fingers wrapped over the handle
    const handY = (x) => 40 + (x - 34) * (5 / 86); // handle centre line
    const handPart = (wrist, knuck, fingerXs, thumb) => {
      const back = mask(W, H, (m) => m.poly([wrist[0], knuck[0], knuck[1], wrist[1]], M));
      shade(px, back, SKIN_OLD, { r: 8, amb: 0.2 });
      // thumb first: it lies along the near side of the handle, under the fingers
      shade(px, mask(W, H, (m) => m.thick(thumb[0][0], thumb[0][1], thumb[1][0], thumb[1][1], 2.9, M)), SKIN_OLD, { r: 3, amb: 0.22 });
      px.set(thumb[1][0], thumb[1][1] - 1, SKIN_OLD[5]);
      for (const kx of fingerXs) {
        const ky = knuck[0][1] + (kx - knuck[0][0]) * (knuck[1][1] - knuck[0][1]) / (knuck[1][0] - knuck[0][0]);
        const tipY = handY(kx) - 3; // fingers go over the top of the handle and curl away behind it
        shade(px, mask(W, H, (m) => m.thick(kx, ky, kx + 0.3, tipY, 2.7, M)), SKIN_OLD, {
          r: 2.7, amb: 0.22, add: (x, y) => (y < tipY + 2 ? -0.3 : y < tipY + 4 ? -0.12 : 0),
        });
        // middle-joint wrinkles where the finger bends over the handle, and a knuckle highlight
        const jy = Math.round(tipY + 4);
        px.hline(kx - 1, kx + 1, jy, SKIN_OLD[2]); px.set(kx, jy + 1, SKIN_OLD[3]);
        px.set(kx - 1, Math.round(ky) - 1, SKIN_OLD[6]); px.set(kx, Math.round(ky) - 1, SKIN_OLD[5]);
      }
    };
    // left hand (near the earpiece), thumb along the handle toward the middle
    handPart([[33, 92], [55, 92]], [[37, 50], [62, 49]], [40, 46, 52, 58], [[58, 60], [71, 52]]);
    // right hand (near the mouthpiece), thumb pointing back toward the other hand
    handPart([[100, 92], [122, 92]], [[95, 54], [120, 55]], [98, 104, 110, 116], [[99, 64], [85, 56]]);
    // age spots, veins and the fine crinkle of old skin on the backs of the hands
    const spot = C('#6a4434'), vein = C('#6a6a7c');
    for (const [x, y] of [[44, 64], [49, 70], [40, 58], [108, 68], [114, 74], [104, 64], [111, 61]]) { px.set(x, y, spot); px.set(x + 1, y, G.mix(spot, SKIN_OLD[3], 0.5)); }
    px.line(46, 54, 44, 68, vein); px.line(44, 68, 45, 78, vein); px.line(52, 54, 50, 66, vein);
    px.line(106, 58, 108, 70, vein); px.line(108, 70, 106, 78, vein); px.line(112, 59, 113, 68, vein);
    for (let y = 55; y < 78; y += 3) for (let x = 34; x < 124; x += 2) {
      const c = px.get(x, y);
      if (SKIN_OLD.includes(c) && G.hash(x, y, 4) < 0.25) px.set(x, y, SKIN_OLD[Math.max(0, SKIN_OLD.indexOf(c) - 1)]);
    }
    // cardigan cuffs, ribbed, with a sliver of shirt cuff
    for (const [x0, x1] of [[30, 56], [98, 124]]) {
      fill(px, x0, 79, x1 - x0 + 1, 11, (x, y) => dv(CARDI, 0.65 - (x - x0) / 60 - (x % 2 ? 0.18 : 0) + (y === 79 ? 0.2 : 0), x, y));
      px.hline(x0 + 1, x1 - 1, 78, C('#c8c0b0'));
    }
    px.outline();
    return G.frame(px, W / 2, H);
  });

  // =====================================================================
  // pic_dawn_1958: Mom home at dawn in the doorway, rain-wet, a squashed cake box;
  // Haru in striped pajamas looking up at her
  // =====================================================================
  G.defSprite('pic_dawn_1958', () => {
    const W = 160, H = 90, px = new G.PX(W, H);
    const DX0 = 52, DX1 = 108, DY0 = 6, DY1 = 80;
    // dark genkan interior, warmed by the light from the door
    const inner = R('#0c0808', '#16100e', '#221814', '#30221a', '#423020');
    fill(px, 0, 0, W, H, (x, y) => dv(inner, 0.55 - Math.abs(x - 80) / 120 + (y > 80 ? 0.15 : 0), x, y));
    // outside: the sky at dawn
    const sky = R('#2a2a52', '#4a3a6a', '#7a4a74', '#b0607a', '#d8806e', '#eca066', '#f6c87a', '#fde6a8');
    fill(px, DX0, DY0, DX1 - DX0, DY1 - DY0, (x, y) => {
      const v = (y - DY0) / 48 + (G.vnoise(x / 12, y / 3, 9) - 0.5) * 0.08 - Math.hypot(x - 92, y - 50) / 300;
      return dv(sky, v, x, y);
    });
    // thin clouds lit from below
    for (const [cx, cy, w] of [[62, 18, 14], [88, 14, 18], [70, 28, 10]]) { px.hline(cx - w / 2, cx + w / 2, cy, sky[6]); px.hline(cx - w / 2 + 2, cx + w / 2 - 3, cy - 1, sky[3]); }
    // the sun coming up between the far blocks
    px.disc(92, 48, 6.5, C('#fff0c4')); px.disc(92, 48, 4, C('#fffbe8'));
    const far = C('#4a3448'), farL = C('#5c4256');
    px.rect(DX0, 44, 34, 10, far); px.rect(DX0 + 6, 41, 16, 3, far); px.rect(98, 46, 10, 8, far); px.rect(86, 51, 14, 3, far);
    for (let i = 0; i < 5; i++) px.hline(DX0 + 2 + i * 6, DX0 + 4 + i * 6, 47, farL);
    px.set(DX0 + 9, 50, C('#e8b060')); px.set(DX0 + 21, 47, C('#e8b060'));
    // corridor parapet and handrail, wet and glowing, then the wet floor reflecting the sky
    fill(px, DX0, 54, DX1 - DX0, 12, (x, y) => dv(R('#3a2a34', '#5a3e44', '#8a5a52', '#c48a6a', '#ecc08a'), (y === 54 ? 0.95 : 0.55 - (y - 54) / 24) - Math.abs(x - 92) / 120, x, y));
    px.hline(DX0, DX1 - 1, 52, C('#a87a6a')); px.hline(DX0, DX1 - 1, 51, C('#f2d0a0'));
    fill(px, DX0, 66, DX1 - DX0, DY1 - 66, (x, y) => {
      let v = 0.45 - (y - 66) / 40 - Math.abs(x - 92) / 150;
      if (Math.abs(x - 92) < 4 && (y % 2 === 0)) v += 0.4;
      return dv(sky, v, x, y);
    });
    // the steel door standing open outward, thin at the right of the frame
    fill(px, DX1 - 6, DY0, 6, DY1 - DY0, (x, y) => dv(R('#141418', '#22222a', '#34343e'), x === DX1 - 6 ? 0.9 : 0.35, x, y));
    // door frame (steel jamb)
    fill(px, DX0 - 3, DY0 - 3, DX1 - DX0 + 6, DY1 - DY0 + 3, (x, y) => (x < DX0 || x >= DX1 || y < DY0 ? dv(R('#1a1c1e', '#2a2e30', '#3e4446'), x >= DX1 ? 0.15 : 0.55, x, y) : 0));
    // the light spilling in across the genkan floor and the step
    const spill = mask(W, H, (m) => m.poly([[DX0, DY1], [DX1, DY1], [DX1 + 10, H], [DX0 - 18, H]], M));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inM(spill, x, y)) px.set(x, y, dv(R('#3a2a22', '#5a3e30', '#7e5640', '#a87652'), 0.7 - (y - DY1) / 14 - Math.abs(x - 78) / 70, x, y));
    px.hline(0, W - 1, 84, C('#2a1c14')); fill(px, 0, 85, W, 5, (x, y) => dv(R('#1e140e', '#2e2016', '#463020', '#5e4430'), 0.5 - Math.abs(x - 70) / 140 + (y === 85 ? 0.3 : 0), x, y));
    // ---- Mom ----
    const mx = 79, foot = 80;
    // legs and shoes, white dress hem
    px.rect(mx - 5, 70, 3, 9, C('#c8a088')); px.rect(mx + 2, 70, 3, 9, C('#a07a66'));
    px.rect(mx - 6, 78, 5, 2, C('#140e0c')); px.rect(mx + 2, 78, 5, 2, C('#140e0c'));
    fill(px, mx - 9, 64, 18, 6, (x, y) => dv(R('#8a7a7a', '#b8a8a0', '#e0d0c4', '#f4e8dc'), 0.75 - (x - mx + 9) / 30 - (y - 64) / 20, x, y));
    // rain-wet navy coat, rim lit by the sunrise on her right
    const coatR = R('#0e1018', '#1a1e2c', '#262c40', '#363e56', '#4a5470', '#c8906e');
    const coat = mask(W, H, (m) => m.poly([[mx - 7, 30], [mx + 7, 30], [mx + 12, 66], [mx - 12, 66]], M));
    shade(px, coat, coatR.slice(0, 5), { r: 6, amb: 0.15 });
    for (let y = 30; y < 66; y++) for (let x = mx; x < mx + 14; x++) if (inM(coat, x, y) && !inM(coat, x + 1, y)) { px.set(x, y, coatR[5]); if (bay(x, y) < 0.5) px.set(x - 1, y, coatR[4]); }
    // water streaks and drips on the coat
    for (const [wx, wy, l] of [[mx - 6, 40, 5], [mx - 2, 48, 6], [mx + 5, 36, 4], [mx + 8, 52, 5], [mx - 9, 56, 4]]) { px.vline(wx, wy, wy + l, coatR[4]); px.set(wx, wy, C('#9aa4c0')); }
    px.set(mx - 10, 67, C('#9aa4c0')); px.set(mx + 6, 68, C('#9aa4c0'));
    // collar and buttons
    px.poly([[mx - 5, 30], [mx + 5, 30], [mx + 2, 36], [mx - 2, 36]], C('#e8dcd0')); px.line(mx - 5, 30, mx - 1, 36, C('#b8aaa0'));
    // head: warm interior light on her face, wet black hair tied back, strands on the forehead
    shade(px, mask(W, H, (m) => m.rect(mx - 2, 26, 5, 5, M)), R('#5a3a30', '#8a5e4a', '#b8846a'), { r: 2 });
    const skin = R('#4a2c24', '#7a4c3a', '#a86e54', '#cc9474', '#e2b090', '#f0c8a8');
    shade(px, mask(W, H, (m) => m.ellipse(mx, 20, 6.5, 8, M)), skin, { r: 5, amb: 0.3 });
    const hair = R('#06060a', '#0e0e14', '#1c1a24', '#30283a');
    shade(px, mask(W, H, (m) => { m.ellipse(mx, 16, 7.5, 6.5, M); m.disc(mx + 6, 20, 3.5, M); m.rect(mx - 7, 16, 2, 7, M); m.rect(mx + 5, 16, 2, 6, M); }), hair, {
      r: 3, amb: 0.2, clip: (x, y) => y < 15 || x < mx - 5 || x > mx + 4,
    });
    for (let y = 9; y < 26; y++) for (let x = mx - 9; x < mx + 11; x++) { const c = px.get(x, y); if (hair.includes(c) && !hair.includes(px.get(x + 1, y)) && x >= mx) px.set(x, y, C('#d88a6a')); }
    px.line(mx - 3, 13, mx - 5, 18, hair[1]); px.line(mx + 1, 13, mx + 2, 17, hair[1]);
    // eyes looking down at him, soft smile, a tear catching the light
    px.hline(mx - 4, mx - 2, 20, skin[0]); px.hline(mx + 2, mx + 4, 20, skin[0]); px.set(mx - 4, 19, skin[1]); px.set(mx + 4, 19, skin[1]);
    px.set(mx, 23, skin[2]); px.hline(mx - 2, mx + 1, 25, skin[1]); px.set(mx - 3, 24, skin[2]); px.set(mx + 2, 24, skin[2]);
    px.set(mx - 4, 22, C('#e8a090')); px.set(mx + 4, 22, C('#e8a090'));
    px.set(mx + 4, 21, C('#fff6e8'));
    // the cake box, squashed at one corner, string tied in a cross
    const boxR = R('#6a5450', '#9a8478', '#c8b4a4', '#ece0d2', '#fff4e6');
    const box = mask(W, H, (m) => m.poly([[mx - 10, 46], [mx - 3, 43], [mx + 9, 44], [mx + 9, 57], [mx - 10, 57]], M));
    shade(px, box, boxR, { r: 3, amb: 0.35, flat: 0.5 });
    px.hline(mx - 10, mx + 9, 47, boxR[1]); px.line(mx - 10, 46, mx - 3, 43, boxR[4]); px.line(mx - 6, 47, mx - 3, 44, boxR[1]);
    px.line(mx - 8, 50, mx - 5, 48, boxR[1]); px.line(mx - 5, 48, mx - 3, 51, boxR[2]); // the dent
    px.vline(mx + 1, 44, 56, C('#b07468')); px.hline(mx - 10, mx + 9, 51, C('#b07468')); px.rect(mx, 49, 3, 3, C('#c88878'));
    px.set(mx + 6, 54, boxR[2]); px.set(mx - 8, 55, boxR[2]); px.set(mx + 4, 46, boxR[2]); // wet spots
    // her hands at the sides of the box
    shade(px, mask(W, H, (m) => { m.ellipse(mx - 11, 52, 2.5, 3.5, M); m.ellipse(mx + 10, 51, 2.5, 3.5, M); }), skin, { r: 2, amb: 0.3 });
    // arms (coat sleeves) down to the hands
    shade(px, mask(W, H, (m) => { m.thick(mx - 9, 33, mx - 12, 48, 2.6, M); m.thick(mx + 9, 33, mx + 11, 47, 2.6, M); }), coatR.slice(0, 5), { r: 2.5, amb: 0.12 });
    px.vline(mx + 13, 36, 47, coatR[5]);
    // ---- Haru, from behind, in the foreground, looking up at her ----
    const hx = 36, hy = 66;
    const paj = R('#1e2634', '#2e3a50', '#425272', '#5a6e92', '#7c90b4');
    const body = mask(W, H, (m) => m.poly([[hx - 12, 82], [hx - 7, 76], [hx + 8, 76], [hx + 13, 82], [hx + 15, H], [hx - 14, H]], M));
    shade(px, body, paj, { r: 6, amb: 0.2, light: [0.6, -0.7, 0.5] });
    for (let y = 77; y < H; y += 3) for (let x = hx - 15; x < hx + 16; x++) if (inM(body, x, y)) px.set(x, y, G.lighten(px.get(x, y), 0.32));
    shade(px, mask(W, H, (m) => m.rect(hx - 3, 72, 7, 6, M)), R('#3a2420', '#6a4434', '#9a6a52'), { r: 2, light: [0.6, -0.7, 0.5] });
    const kh = R('#050407', '#0c0a10', '#16131c', '#221c28');
    shade(px, mask(W, H, (m) => { m.ellipse(hx, hy, 11, 10.5, M); m.ellipse(hx - 11, hy + 2, 2, 3, 0); }), kh, { r: 5, amb: 0.2, light: [0.6, -0.7, 0.5] });
    // ears
    shade(px, mask(W, H, (m) => { m.ellipse(hx - 11, hy + 2, 2, 3, M); m.ellipse(hx + 11, hy + 2, 2, 3, M); }), R('#4a2c24', '#7a4c3a', '#a86e54'), { r: 2, light: [0.6, -0.7, 0.5] });
    // messy tufts and the warm dawn rim on his hair
    for (const [tx, ty, dx, dy] of [[hx - 6, hy - 10, -2, -3], [hx - 1, hy - 11, 0, -3], [hx + 4, hy - 10, 2, -3], [hx + 9, hy - 6, 3, -2], [hx - 10, hy - 5, -3, -1]]) px.line(tx, ty, tx + dx, ty + dy, kh[2]);
    const snap = px.clone();
    for (let y = hy - 15; y < hy + 12; y++) for (let x = hx - 14; x < hx + 15; x++) {
      if (kh.includes(snap.get(x, y)) && !kh.includes(snap.get(x + 1, y - 1)) && x > hx - 2 && y < hy + 4) px.set(x, y, bay(x, y) < 0.6 ? C('#a8644e') : C('#5a3028'));
    }
    // a warm glow around the doorway
    glow(px, DX0 - 14, DY0, DX1 - DX0 + 28, DY1 - DY0 + 10, (x, y) => (x < DX0 || x >= DX1 || y >= DY1 ? 1 - Math.min(Math.abs(x - DX0), Math.abs(x - DX1), y >= DY1 ? y - DY1 : 99) / 14 : 0), C('#e0a070'), 0.25);
    return G.frame(px, W / 2, H);
  });

  // =====================================================================
  // pic_carepost: the true ending. Sunrise in Room 404; old Haru in the care bed, Tama on the
  // blanket, Yui at the door with a bag of oranges
  // =====================================================================
  G.defSprite('pic_carepost', () => {
    const W = 160, H = 90, px = new G.PX(W, H);
    const wallR = R('#3a3240', '#4e4452', '#645866', '#7c6e78', '#a08a84', '#c8a690', '#e8c8a4');
    const floorR = R('#2e2a30', '#403a40', '#565056', '#6e666a', '#94847a', '#c0a48a');
    // sunbeam test: light falls from the window toward the lower left
    const beam = (x, y) => { const u = x + y * 1.1; return (u > 150 && u < 168) || (u > 176 && u < 196) || (u > 204 && u < 214); };
    fill(px, 0, 0, W, 56, (x, y) => dv(wallR, 0.42 + x / 600 + (beam(x, y) && x < 104 ? 0.35 : 0) - y / 400, x, y));
    px.hline(0, W - 1, 55, C('#2a2430'));
    fill(px, 0, 56, W, H - 56, (x, y) => dv(floorR, 0.5 - (y - 56) / 120 + (beam(x, y) ? 0.32 : 0) + ((x + (y - 56) * 0.5) % 24 < 1 ? -0.1 : 0), x, y));
    // handrail along the wall
    fill(px, 40, 40, 64, 3, (x, y) => sv(R('#4a3424', '#6e5034', '#9a744c'), y === 40 ? 1 : y === 41 ? 0.5 : 0));
    // window with the sunrise
    const WX = 106, WY = 6, WW = 44, WH = 34;
    const skyR = R('#6a6a9a', '#9a7a9e', '#d08e8e', '#eca67c', '#f8c87c', '#fde4a8', '#fff6d8');
    fill(px, WX, WY, WW, WH, (x, y) => dv(skyR, (y - WY) / WH * 1.1 - 0.1 + (1 - Math.hypot(x - 130, y - 36) / 30) * 0.35, x, y));
    px.disc(130, 34, 5, C('#fffbe8'));
    px.rect(WX, 34, WW, 6, C('#7a5a6a')); px.rect(WX + 4, 31, 10, 3, C('#7a5a6a')); px.rect(WX + 30, 32, 12, 2, C('#7a5a6a'));
    px.hline(WX, WX + WW - 1, 34, C('#a07888'));
    fill(px, WX - 2, WY - 2, WW + 4, WH + 4, (x, y) => (x < WX || y < WY || x >= WX + WW || y >= WY + WH || x === WX + 21 || y === WY + 16 ? sv(R('#8a8290', '#c8beb8', '#ece4da'), y < WY ? 1 : x >= WX + WW || y >= WY + WH ? 0.3 : 0.75) : 0));
    // curtains, pale green, gathered at the sides and lit through
    const cur = R('#4a5a4c', '#6a7c68', '#90a28a', '#b8c8ac');
    for (const [x0, x1] of [[WX - 9, WX - 1], [WX + WW + 1, WX + WW + 8]]) fill(px, x0, WY - 4, x1 - x0 + 1, WH + 14, (x, y) => (x < W ? dv(cur, 0.55 + Math.sin((x - x0) * 1.3) * 0.25 - (y - WY) / 120, x, y) : 0));
    // the open door at the left: a bright corridor, Yui standing in it
    const DX = 8, DW = 28, DY = 6, DB = 62;
    fill(px, DX, DY, DW, DB - DY, (x, y) => dv(R('#8a8a84', '#a8a69e', '#c4c2b8', '#dedad0'), 0.75 - (y - DY) / 120 - (x - DX) / 120, x, y));
    fill(px, DX - 3, DY - 3, DW + 6, DB - DY + 3, (x, y) => (x < DX || x >= DX + DW || y < DY ? sv(R('#3a3034', '#5a4a48', '#7a6660'), x < DX ? 0.9 : y < DY ? 0.6 : 0.2) : 0));
    // Yui: beige coat, short dark hair going grey, a paper bag of oranges in her hand
    const yx = 22, yf = 62;
    px.rect(yx - 4, yf - 9, 3, 8, C('#3a3036')); px.rect(yx + 1, yf - 9, 3, 8, C('#2e262c'));
    px.rect(yx - 5, yf - 2, 4, 2, C('#1a1418')); px.rect(yx + 1, yf - 2, 4, 2, C('#1a1418'));
    const coatR = R('#4a3a2a', '#6e5840', '#94785a', '#b89c78', '#d4bc98');
    shade(px, mask(W, H, (m) => m.poly([[yx - 6, yf - 34], [yx + 6, yf - 34], [yx + 9, yf - 9], [yx - 9, yf - 9]], M)), coatR, { r: 5, amb: 0.2 });
    px.vline(yx + 1, yf - 32, yf - 10, coatR[1]); for (const by of [28, 22, 16]) px.set(yx, yf - by, coatR[0]);
    px.poly([[yx - 3, yf - 34], [yx + 3, yf - 34], [yx + 1, yf - 30], [yx - 1, yf - 30]], C('#d8ccc4'));
    const skin = R('#4a2c24', '#7a4c3a', '#a86e54', '#cc9474', '#e2b090');
    shade(px, mask(W, H, (m) => m.ellipse(yx + 0.5, yf - 40, 5.5, 6.5, M)), skin, { r: 4, amb: 0.3 });
    const hr = R('#141218', '#24202a', '#3a343e', '#5a5460', '#8a8490');
    shade(px, mask(W, H, (m) => { m.ellipse(yx + 0.5, yf - 43, 6.5, 5, M); m.rect(yx - 6, yf - 43, 3, 6, M); m.rect(yx + 4, yf - 43, 3, 6, M); }), hr, { r: 3, amb: 0.25, clip: (x, y) => y < yf - 43 || x < yx - 3 || x > yx + 4 });
    px.set(yx - 3, yf - 46, hr[4]); px.set(yx + 2, yf - 47, hr[4]); px.set(yx + 5, yf - 42, hr[4]);
    // looking toward the bed, a teary smile
    px.set(yx, yf - 40, skin[0]); px.set(yx + 3, yf - 40, skin[0]); px.set(yx + 3, yf - 39, C('#e8f0f8'));
    px.hline(yx + 1, yx + 2, yf - 37, skin[1]); px.set(yx, yf - 38, skin[2]);
    // arm down to the bag of oranges
    shade(px, mask(W, H, (m) => m.thick(yx - 6, yf - 31, yx - 8, yf - 18, 2, M)), coatR, { r: 2 });
    px.rect(yx - 14, yf - 18, 10, 10, C('#a8845a')); px.hline(yx - 14, yx - 5, yf - 18, C('#c8a272')); px.vline(yx - 5, yf - 17, yf - 9, C('#7a5a3a'));
    for (const [ox, oy] of [[-12, -20], [-9, -21], [-7, -19]]) { px.disc(yx + ox, yf + oy, 1.8, C('#e08a2a')); px.set(yx + ox - 1, yf + oy - 1, C('#f8c060')); }
    px.disc(yx - 8, yf - 18, 1.6, C('#c8b4a0'));
    // ---- the bed: head at the right under the window ----
    const metal = R('#4a4a52', '#7a7a84', '#a8a8b0', '#d0d0d6');
    px.rect(138, 30, 4, 46, metal[1]); px.vline(138, 30, 75, metal[3]); px.rect(136, 28, 8, 3, metal[2]);
    fill(px, 120, 32, 18, 30, (x, y) => dv(R('#7a6e6a', '#a2948a', '#c8b8a8', '#e4d4c0'), 0.6 + (beam(x, y) ? 0.3 : 0) - (y - 32) / 80, x, y));
    // frame, legs and wheels
    px.rect(46, 70, 92, 4, metal[1]); px.hline(46, 137, 70, metal[3]);
    for (const lx of [50, 132]) { px.rect(lx, 74, 2, 10, metal[1]); px.disc(lx + 1, 84, 2, C('#1a1a1e')); px.set(lx, 83, C('#5a5a64')); }
    // blanket (white, warm in the beam), body shape underneath
    const blR = R('#4e4a5a', '#6c6878', '#8e8a98', '#b4b0ba', '#d8d2d0', '#f4e6d4');
    const bl = mask(W, H, (m) => {
      m.poly([[44, 58], [124, 54], [130, 60], [130, 70], [44, 70]], M);
      m.ellipse(86, 55, 26, 5, M); m.ellipse(52, 57, 7, 4, M);
    });
    shade(px, bl, blR, { r: 6, amb: 0.25, add: (x, y) => (beam(x, y) ? 0.22 : -0.05) });
    for (const fx of [64, 78, 100]) px.line(fx, 57, fx - 3, 69, blR[2]);
    px.hline(44, 130, 70, blR[1]);
    // pillow and old Haru's head on it, turned toward the door, smiling
    shade(px, mask(W, H, (m) => m.ellipse(124, 50, 11, 6, M)), blR, { r: 4, amb: 0.35, add: (x, y) => (beam(x, y) ? 0.15 : 0) });
    const sk = SKIN_OLD;
    shade(px, mask(W, H, (m) => m.ellipse(122, 46, 6, 7, M)), sk, { r: 4, amb: 0.35, add: (x, y) => (beam(x, y) ? 0.15 : 0) });
    shade(px, mask(W, H, (m) => { m.ellipse(124, 43, 6.5, 5.5, M); }), HAIR_GREY, { r: 3, amb: 0.35, clip: (x, y) => y < 42 || x > 125 });
    px.set(119, 46, C('#2a2028')); px.hline(117, 121, 45, C('#3a3036')); px.set(116, 46, C('#3a3036'));
    px.set(118, 49, sk[2]); px.hline(119, 121, 50, sk[2]); px.set(122, 49, sk[2]);
    px.set(117, 47, sk[3]);
    // his hand resting on the blanket, near the cat
    shade(px, mask(W, H, (m) => m.ellipse(101, 56, 3.5, 2, M)), sk, { r: 2, amb: 0.4 });
    // Tama curled up on the blanket
    const cat = R('#2a2a30', '#44444c', '#62626a', '#82828a', '#a8a8ae');
    shade(px, mask(W, H, (m) => { m.ellipse(86, 52, 8.5, 4.5, M); m.disc(80, 50, 3.6, M); m.poly([[77, 47], [78, 43], [80, 47]], M); m.poly([[81, 47], [83, 44], [84, 48]], M); }), cat, { r: 3, amb: 0.3, add: (x, y) => (beam(x, y) ? 0.2 : 0) });
    px.set(78, 44, C('#2a2a30')); // the torn ear notch
    px.hline(78, 79, 51, C('#1e1e24')); px.hline(81, 82, 51, C('#1e1e24'));
    for (let i = 0; i < 8; i++) px.set(84 + i, 55 + Math.round(Math.sin(i / 2)), cat[1]); // tail around
    // bedside cabinet with a small cup
    fill(px, 144, 56, 16, 26, (x, y) => dv(R('#5a4a40', '#7a6656', '#9a8470'), 0.6 - (y - 56) / 60 + (x === 144 ? 0.3 : 0), x, y));
    px.rect(150, 51, 4, 5, C('#d8d2c8')); px.set(150, 51, C('#fff8ec'));
    // the warm haze of the sunrise
    glow(px, 0, 0, W, H, (x, y) => (beam(x, y) ? 0.5 : 0) * (1 - y / 140), C('#ffd8a0'), 0.25);
    return G.frame(px, W / 2, H);
  });

  // =====================================================================
  // scare_shota: Shota from behind, facing the wall, far too close; his head turns
  // =====================================================================
  G.defSprite('scare_shota', () => {
    const W = 64, H = 48, frames = [];
    const Lb = [-0.45, 0.55, 0.7]; // flashlight from behind, low on the left
    for (let f = 0; f < 3; f++) {
      const px = new G.PX(W, H);
      const wall = R('#06080a', '#0e1214', '#182022', '#24302e', '#34423e', '#4a5a52', '#66766a');
      fill(px, 0, 0, W, H, (x, y) => dv(wall, 0.92 - Math.hypot(x - 30, y - 30) / 34 + (G.vnoise(x / 3, y / 3, 5) - 0.5) * 0.12, x, y));
      // his shadow on the wall, up and to the right
      shade(px, mask(W, H, (m) => { m.ellipse(42, 9, 12, 12, M); m.rect(38, 18, 10, 16, M); }), R('#06080a', '#0c1012', '#121a1a'), { r: 4, amb: 0.4 });
      const turn = [0, 1.5, 3][f];
      // shoulders and t-shirt (a 7 on the back)
      const tee = R('#3a3a3a', '#5e5c58', '#88847c', '#aaa59a', '#cac4b8');
      shade(px, mask(W, H, (m) => m.poly([[10, 48], [14, 41], [24, 38], [38, 38], [48, 41], [54, 48]], M)), tee, { r: 6, light: Lb, amb: 0.15 });
      px.hline(25, 37, 38, tee[1]); px.hline(26, 36, 39, tee[2]);
      text(px, '7', 29, 41, C('#7a2a26'));
      // the neck: a little too long
      const skin = R('#2e1c16', '#5a382a', '#86563e', '#ae7656', '#cc9474');
      shade(px, mask(W, H, (m) => m.rect(27, 22, 9, 17, M)), skin, { r: 3, light: Lb, amb: 0.1 });
      px.vline(31, 27, 37, skin[1]);
      for (const vy of [31, 34]) px.set(31, vy, skin[3]);
      // head from behind; turning, more of the right ear and cheek shows
      const hx = 31.5 + turn * 0.4, hy = 13;
      if (turn > 0) {
        shade(px, mask(W, H, (m) => m.ellipse(hx + 7 + turn * 0.8, hy + 6, 4 + turn * 0.4, 6, M)), skin, { r: 3, light: Lb, amb: 0.2 });
      }
      shade(px, mask(W, H, (m) => { m.ellipse(hx - 11, hy + 3, 2.2, 3.5, M); m.ellipse(hx + 11 - turn * 0.6, hy + 3 + turn * 0.2, 2.2, 3.5, M); }), skin, { r: 2, light: Lb, amb: 0.2 });
      const hair = R('#140c08', '#24160e', '#3a2416', '#563620', '#74502e');
      const hm = mask(W, H, (m) => {
        m.ellipse(hx, hy, 11, 12, M);
        for (const [a, l] of [[-2.6, 4], [-2.0, 3], [-1.2, 4], [-0.5, 3], [0.3, 3], [2.4, 3], [2.9, 4]]) m.thick(hx + Math.cos(a) * 9, hy + Math.sin(a) * 10, hx + Math.cos(a) * (11 + l), hy + Math.sin(a) * (12 + l), 1, M);
      });
      shade(px, hm, hair, { r: 5, light: Lb, amb: 0.15 });
      // whorl at the crown and messy strands
      px.set(hx - 1, hy - 4, hair[0]); px.set(hx, hy - 3, hair[0]); px.set(hx + 1, hy - 4, hair[0]); px.set(hx, hy - 5, hair[3]);
      for (const [sx, sy, ex, ey] of [[hx - 6, hy - 6, hx - 2, hy + 2], [hx + 5, hy - 6, hx + 2, hy + 3], [hx - 8, hy + 2, hx - 5, hy + 9], [hx + 7, hy + 1, hx + 5, hy + 9]]) px.line(sx, sy, ex, ey, hair[1]);
      px.hline(hx - 7, hx + 6, hy + 11, hair[2]);
      if (f === 2) {
        // the corner of a blank eye at the edge of his cheek
        px.set(Math.round(hx + 11), hy + 3, C('#d8d4c8')); px.set(Math.round(hx + 12), hy + 3, C('#bab4a8'));
        px.set(Math.round(hx + 11), hy + 8, skin[1]); px.set(Math.round(hx + 12), hy + 7, skin[1]);
      }
      // vignette
      dim(px, 0, 0, W, H, (x, y) => Math.hypot((x - 31) / 40, (y - 26) / 32) - 0.55, 0.9);
      frames.push(G.frame(px, W / 2, H));
    }
    return frames;
  }, 4);

  // =====================================================================
  // scare_guest: a masked staff face, very close, in a paper party hat, singing in the
  // candlelight (the mouth moves under the mask)
  // =====================================================================
  G.defSprite('scare_guest', () => {
    const W = 64, H = 48, frames = [];
    const Lu = [0.15, 0.9, 0.45]; // candles below
    for (let f = 0; f < 3; f++) {
      const px = new G.PX(W, H);
      const fl = [0, 0.06, -0.04][f];
      fill(px, 0, 0, W, H, (x, y) => dv(R('#030204', '#09060a', '#120a0e', '#1e1014'), (y / H) * 0.6 + fl, x, y));
      // a dim paper chain behind
      for (let i = 0; i < 9; i++) { const x = i * 8 - 2, y = 6 + Math.round(Math.sin(i * 0.8) * 2); px.rect(x, y, 5, 3, i % 2 ? C('#2a1a20') : C('#1a2224')); }
      const skin = R('#140a08', '#2a1610', '#4a2a1e', '#6e4230', '#946048', '#b88060');
      const cx = 32, jaw = f === 0 ? 0 : 1;
      // ears and dark hair at the sides
      shade(px, mask(W, H, (m) => { m.ellipse(cx - 18, 29, 2.5, 5, M); m.ellipse(cx + 18, 29, 2.5, 5, M); }), skin, { r: 2, light: Lu, amb: 0.1, add: () => fl });
      shade(px, mask(W, H, (m) => m.ellipse(cx, 30 + jaw * 0.5, 17, 19 + jaw * 0.5, M)), skin, { r: 9, light: Lu, amb: 0.05, add: (x, y) => (y - 30) / 40 + fl });
      const hairR = R('#050304', '#0e080a', '#1a1014');
      shade(px, mask(W, H, (m) => { m.ellipse(cx, 16, 17, 8, M); m.rect(cx - 17, 16, 4, 12, M); m.rect(cx + 14, 16, 4, 12, M); }), hairR, { r: 3, light: Lu, amb: 0.3 });
      // eye sockets in deep shadow, a wet glint of candlelight in each
      for (const ex of [cx - 7, cx + 7]) {
        px.ellipse(ex, 25, 4.5, 2.6, C('#060304'));
        px.set(ex - 1, 26, C('#140a0a'));
        px.set(ex + (f === 2 ? 0 : 1), 25, C('#8a5a3a'));
      }
      // the mask: pleated, white, glaring in the candlelight; ear loops
      const maskR = R('#5a4a44', '#8a766a', '#b8a090', '#dcc8b4', '#f4e4d0', '#fff6e8');
      const mm = mask(W, H, (m) => m.poly([[cx - 15, 31], [cx - 4, 28], [cx, 27], [cx + 4, 28], [cx + 15, 31], [cx + 14, 42 + jaw], [cx + 6, 46 + jaw], [cx - 6, 46 + jaw], [cx - 14, 42 + jaw]], M));
      shade(px, mm, maskR, { r: 6, light: Lu, amb: 0.25, add: (x, y) => (y - 36) / 50 + fl });
      for (const py of [33, 37, 41]) for (let x = cx - 13; x <= cx + 13; x++) if (inM(mm, x, py + jaw * (py > 36 ? 1 : 0))) px.set(x, py + jaw * (py > 36 ? 1 : 0), maskR[2]);
      px.line(cx - 15, 31, cx - 18, 26, maskR[3]); px.line(cx + 15, 31, cx + 18, 26, maskR[3]);
      px.line(cx - 14, 42, cx - 18, 33, maskR[2]); px.line(cx + 14, 42, cx + 18, 33, maskR[2]);
      // the mouth under the mask: closed, open, wide (singing)
      if (f === 1) { px.ellipse(cx, 40.5, 3.5, 2, maskR[2]); px.hline(cx - 2, cx + 2, 40, maskR[1]); }
      if (f === 2) { px.ellipse(cx, 41, 4.5, 3.5, maskR[1]); px.ellipse(cx, 41, 3, 2.2, maskR[0]); px.hline(cx - 3, cx + 3, 38, maskR[3]); }
      if (f === 0) px.hline(cx - 3, cx + 3, 40, maskR[2]);
      // striped paper party hat, a little crooked, with a frayed pom-pom
      const hat = mask(W, H, (m) => m.poly([[cx - 10, 15], [cx + 9, 13], [cx + 6, -2], [cx + 3, -2]], M));
      const stripeA = R('#2a1418', '#4a2a30', '#6e4048', '#8e5a60'), stripeB = R('#2a2620', '#4a443a', '#6e6656', '#928a76');
      shade(px, hat, stripeA, { r: 4, light: Lu, amb: 0.3, rampAt: (x, y) => (G.mod(Math.floor((x * 0.6 + y) / 3), 2) ? stripeA : stripeB), add: (x, y) => (y - 6) / 30 + fl });
      px.hline(cx - 10, cx + 9, 15, C('#1a1012'));
      for (const [ax, ay] of [[0, 0], [2, -1], [-2, -1], [1, 1], [-1, -2], [3, 1]]) px.set(cx + 4 + ax, -1 + ay + 1, C('#5a4a40'));
      px.line(cx - 10, 15, cx - 16, 27, C('#3a2a24'));
      px.outline(C('#020103'));
      frames.push(G.frame(px, W / 2, H));
    }
    return frames;
  }, 8);
})(window.G);
