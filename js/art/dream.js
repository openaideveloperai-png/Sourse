// Art for the dream ending: the roof (night sky, and the sunset that breaks through it), Haru
// sitting with his back to us, Haru waking up in his futon, Mom's face, and the morning hug.
(function (G) {
  'use strict';
  const C = G.C;
  const SW = 416, SH = 128; // the sky spans the whole screen width, 8 tiles tall

  // ordered dither: pick between two colors per pixel so gradients stay pixel-art
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const dith = (x, y) => (BAYER[y & 3][x & 3] + 0.5) / 16;
  // a vertical gradient through color stops [[y, '#hex'], ...], dithered to stops
  function gradient(px, stops, x0, x1, y0, y1) {
    const cs = stops.map(([y, h]) => [y, C(h)]);
    for (let y = y0; y < y1; y++) {
      let i = 0;
      while (i < cs.length - 2 && y >= cs[i + 1][0]) i++;
      const [ya, ca] = cs[i], [yb, cb] = cs[i + 1];
      const t = G.clamp((y - ya) / Math.max(1, yb - ya), 0, 1);
      // 5 sub-steps between stops, dithered
      const steps = 5, f = t * steps, k = Math.floor(f), r = f - k;
      for (let x = x0; x < x1; x++) {
        const kk = r > dith(x, y) ? k + 1 : k;
        px.set(x, y, G.mix(ca, cb, Math.min(1, kk / steps)));
      }
    }
  }
  // a soft horizontal cloud streak
  function cloud(px, cx, cy, w, h, top, under, lit) {
    for (let y = -h; y <= h; y++) for (let x = -w; x <= w; x++) {
      const d = (x * x) / (w * w) + (y * y) / (h * h);
      if (d > 1) continue;
      const X = cx + x, Y = cy + y;
      if (!px.in(X, Y)) continue;
      let c = y < -h * 0.2 ? top : under;
      if (lit && y > h * 0.35 && d > 0.45) c = lit;
      if (d > 0.82 && dith(X, Y) > 0.5) continue; // ragged edge
      px.set(X, Y, c);
    }
  }
  // the city: rows of blocks along the horizon, with lit windows
  function skyline(px, base, col, winCol, seed, density, hMin, hMax) {
    const r = G.rng(seed);
    let x = -4;
    while (x < SW) {
      const w = 10 + r.int(22), hgt = hMin + r.int(hMax - hMin);
      px.rect(x, base - hgt, w, hgt + 30, col);
      if (r() < 0.3) px.rect(x + 2 + r.int(Math.max(1, w - 6)), base - hgt - 3, 3, 3, col); // water tank on top
      for (let wy = base - hgt + 3; wy < base - 2; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 3) if (r() < density) px.set(wx, wy, winCol);
      x += w + (r() < 0.3 ? 1 + r.int(4) : 0);
    }
  }
  // Tokyo Tower, finished in December 1958
  function tower(px, cx, base, hgt, col, light) {
    for (let y = 0; y < hgt; y++) {
      const k = y / hgt, half = Math.max(0, Math.round(10 * Math.pow(1 - k, 1.6)));
      const Y = base - y;
      px.set(cx - half, Y, col); px.set(cx + half, Y, col);
      if (half > 1 && y % 6 === 0) px.hline(cx - half, cx + half, Y, col);
      if (half > 2 && y % 6 === 3) { px.set(cx - Math.round(half / 2), Y, col); px.set(cx + Math.round(half / 2), Y, col); }
    }
    px.rect(cx - 6, base - Math.round(hgt * 0.38), 13, 2, col);
    px.rect(cx - 3, base - Math.round(hgt * 0.7), 7, 2, col);
    px.vline(cx, base - hgt - 6, base - hgt, col);
    if (light) px.set(cx, base - hgt - 6, light);
  }
  // the parapet and railing in the foreground, against the sky
  function railing(px, rail, hi) {
    px.rect(0, SH - 4, SW, 4, rail);              // concrete parapet
    px.hline(0, SW - 1, SH - 4, hi);
    px.rect(0, SH - 16, SW, 2, rail);             // top rail
    px.hline(0, SW - 1, SH - 16, hi);
    px.hline(0, SW - 1, SH - 10, rail);           // middle rail
    for (let x = 4; x < SW; x += 8) px.vline(x, SH - 14, SH - 5, rail);
  }

  function nightSky(f) {
    const px = new G.PX(SW, SH);
    gradient(px, [[0, '#04040a'], [60, '#0a0c18'], [100, '#161c2e'], [112, '#1e2436']], 0, SW, 0, SH);
    cloud(px, 90, 30, 70, 9, C('#141826'), C('#10131e'));
    cloud(px, 260, 18, 90, 7, C('#141826'), C('#10131e'));
    cloud(px, 360, 52, 60, 8, C('#161a28'), C('#12151f'));
    tower(px, 118, 104, 58, C('#0e1018'), f % 2 ? C('#e03030') : C('#501818'));
    skyline(px, 112, C('#0c0e18'), C('#8a7040'), 7, 0.08, 10, 26);
    skyline(px, 118, C('#08090f'), C('#c8a050'), 13, 0.12, 4, 14);
    railing(px, C('#16171e'), C('#2c2e38'));
    return G.frame(px, SW / 2, SH);
  }
  function sunsetSky(f) {
    const px = new G.PX(SW, SH);
    gradient(px, [[0, '#2a1a4a'], [34, '#6a3474'], [60, '#c85a72'], [82, '#f08a62'], [98, '#ffb862'], [110, '#ffe0a0']], 0, SW, 0, SH);
    // the sun, low over the city
    const sx = 300, sy = 104;
    for (let r = 34; r > 0; r -= 2) { const k = r / 34; const c = G.mix(C('#fff4c8'), C('#ffb060'), k); for (let a = 0; a < 360; a += 2) { const X = Math.round(sx + Math.cos(a * Math.PI / 180) * r), Y = Math.round(sy + Math.sin(a * Math.PI / 180) * r * 0.9); if (k > 0.66 && dith(X, Y) > 1.05 - k) continue; if (px.in(X, Y) && Y < sy + 6) px.set(X, Y, c); } }
    px.disc(sx, sy, 15, C('#fff0b0'));
    px.disc(sx, sy, 12, C('#fffae0'));
    // clouds lit from below
    cloud(px, 80, 26, 80, 7, C('#7a3a7a'), C('#c86078'), C('#ffa080'));
    cloud(px, 250, 40, 70, 6, C('#8a4078'), C('#e07070'), C('#ffc090'));
    cloud(px, 390, 22, 60, 6, C('#6a3274'), C('#b45678'), C('#f89a80'));
    cloud(px, 170, 70, 50, 4, C('#d06a6a'), C('#f09a70'), C('#ffd0a0'));
    cloud(px, 330, 76, 40, 3, C('#e88068'), C('#ffb078'), C('#ffe0b0'));
    // birds going home (they cross the sky slowly)
    const bird = (x, y, up) => { px.set(x - 2, y - (up ? 1 : 0), C('#3a1a30')); px.set(x - 1, y, C('#3a1a30')); px.set(x, y + 1, C('#3a1a30')); px.set(x + 1, y, C('#3a1a30')); px.set(x + 2, y - (up ? 1 : 0), C('#3a1a30')); };
    for (let i = 0; i < 5; i++) bird(((60 + i * 17 + f * 3) % SW), 48 + ((i * 7) % 11) + (i % 2 ? 1 : 0), (f + i) % 2);
    tower(px, 118, 104, 58, C('#4a2440'), f % 2 ? C('#ff6040') : C('#a03030'));
    skyline(px, 112, C('#5a2c48'), C('#ffd080'), 7, 0.06, 10, 26);
    skyline(px, 118, C('#3a1c34'), C('#ffe0a0'), 13, 0.1, 4, 14);
    railing(px, C('#2a1424'), C('#ff9a6a'));
    return G.frame(px, SW / 2, SH);
  }
  G.defSprite('roof_sky_night', () => [0, 1].map(nightSky), 1);
  G.defSprite('roof_sky_sunset', () => [0, 1, 2, 3].map(sunsetSky), 2);

  // a rooftop water tank on legs
  G.defSprite('water_tank', () => {
    const px = new G.PX(44, 44);
    const body = C('#8a8c94'), bodyL = C('#a8aab2'), bodyD = C('#64666e'), leg = C('#4a4c54');
    px.rect(6, 30, 3, 14, leg); px.rect(35, 30, 3, 14, leg); px.rect(20, 32, 3, 12, leg);
    px.line(8, 42, 21, 33, leg); px.line(36, 42, 22, 33, leg);
    px.rect(4, 8, 36, 24, body);
    px.ellipse(22, 8, 18, 5, bodyL);
    px.ellipse(22, 8, 14, 3, C('#c0c2ca'));
    for (let x = 4; x < 40; x++) { const k = Math.abs(x - 14) / 26; px.vline(x, 9, 31, G.mix(bodyL, bodyD, Math.min(1, k * 1.3))); }
    px.hline(4, 39, 16, bodyD); px.hline(4, 39, 24, bodyD);
    px.rect(27, 4, 6, 3, C('#5a5c64'));
    px.rect(10, 18, 8, 4, C('#e8e4da')); px.hline(11, 16, 20, C('#5a4a4a')); // a faded sign
    px.outline();
    return G.frame(px, 22, 44);
  });

  // ---------------- Haru on the bench, seen from behind ----------------
  G.defSprite('haru_sit_back', () => {
    const ch = G.getChar('haru');
    const f = ch && ch.up && ch.up[0];
    if (!f) return G.frame(new G.PX(1, 1), 0, 1);
    const c = document.createElement('canvas'); c.width = f.w; c.height = f.h;
    const x = c.getContext('2d');
    x.drawImage(f.c, 0, 0, f.w, f.h - 8, 0, 0, f.w, f.h - 8);
    return { c: c, ax: f.ax, ay: f.ay, w: f.w, h: f.h };
  });

  // ---------------- Haru sitting up in his futon (the morning) ----------------
  function futonSit(frame) {
    const W = 18, H = 34;
    const base = new G.PX(W, H);
    const sheet = C('#e8e4da'), sheetD = C('#c8c2b4');
    base.rect(1, 2, 16, 31, sheet); base.vline(16, 2, 32, sheetD); base.hline(1, 16, 32, sheetD);
    base.rect(3, 3, 12, 6, C('#f6f2ea')); base.hline(3, 14, 8, C('#d8d0c0'));
    base.outline();
    const blanket = new G.PX(W, H);
    const blue = C('#4a6a9a'), blueL = C('#6a8ab8'), blueD = C('#344e78'), stripe = C('#a8c0e0');
    const top = 18;
    blanket.rect(1, top, 16, 33 - top - 1, blue);
    for (let y = top + 3; y < 32; y += 5) blanket.hline(1, 16, y, stripe);
    blanket.rect(1, top, 16, 2, blueL); blanket.hline(1, 16, top + 2, blueD);
    blanket.vline(16, top, 31, blueD);
    blanket.outline();
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.drawImage(base.canvas(), 0, 0);
    const ch = G.getChar('haru');
    const kf = ch && ch.down && ch.down[0];
    if (kf) {
      // upper body only, sitting with the blanket over his legs; frame 1 leans a little
      const cut = Math.min(kf.h, 17);
      x.drawImage(kf.c, 0, 0, kf.w, cut, Math.round(W / 2 - kf.ax) + (frame ? 1 : 0), top + 2 - cut + (frame ? 1 : 0), kf.w, cut);
    }
    x.drawImage(blanket.canvas(), 0, 0);
    return { c: c, ax: 9, ay: 33, w: W, h: H };
  }
  G.defSprite('haru_futon_sit', () => [futonSit(0), futonSit(0), futonSit(1)], 2);

  // ---------------- Mom's face (1958): young, black hair tied back, a nurse's cap ----------------
  const MAMA = { h: '#221c28', H: '#3a3044', i: '#5a4e66', s: '#f2cca8', S: '#d0a07e', c: '#eaa496', j: '#4c4a56', J: '#36343e', k: '#686674', O: '#ecebe6', t: '#ecebe6', m: '#b8685e' };
  const pal = G.pal(MAMA);
  const PMAP = { neutral: 'neutral', happy: 'happy', sad: 'sad', kind: 'happy', crying: 'sad' };
  const mama = (expr) => G.KID.portraitWith(expr === 'crying' ? 'mama_cry' : 'mama', pal, PMAP[expr] || 'neutral', (cv, e) => {
    const x = cv.getContext('2d');
    const R = (col, rs) => { x.fillStyle = col; for (const [a, b, w, h] of rs) x.fillRect(a, b, w, h); };
    R('#221c28', [[7, 10, 3, 13], [32, 10, 3, 13], [9, 8, 3, 4], [30, 8, 3, 4]]); // hair pulled back
    R('#3a3044', [[8, 12, 1, 8], [33, 12, 1, 8]]);
    R('#f8f6f0', [[13, 0, 16, 4], [11, 2, 20, 3]]);                                 // the white cap
    R('#c8c6c0', [[11, 5, 20, 1]]);
    R('#e8e4dc', [[17, 1, 8, 1]]);
    R('#ecebe6', [[16, 34, 10, 3]]);                                                // dress collar
    if (expr === 'crying') R('#9fd8ff', [[13, 23, 1, 3], [28, 23, 1, 3]]);
  });
  mama.exprs = ['neutral', 'happy', 'sad', 'kind', 'crying'];
  G.PORTRAITS.mama = mama;

  // ---------------- the birthday cake: strawberries, cream, ten candles ----------------
  function cake(f) {
    const W = 48, H = 40;
    const px = new G.PX(W, H);
    px.ellipse(24, 36, 22, 4, C('#d8d4dc'));                       // plate
    px.ellipse(24, 35, 20, 3, C('#f4f2f6'));
    px.rect(6, 22, 36, 12, C('#f6e6d2'));                          // the side of the cake
    px.ellipse(24, 33, 18, 3, C('#f6e6d2'));
    px.hline(6, 41, 27, C('#e8a0a8'));                             // strawberry layer
    px.hline(6, 41, 28, C('#d86878'));
    px.ellipse(24, 22, 18, 5, C('#fffaf2'));                       // cream on top
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; px.disc(Math.round(24 + Math.cos(a) * 15), Math.round(22 + Math.sin(a) * 3.6), 1, C('#ffffff')); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3; px.rect(Math.round(24 + Math.cos(a) * 10) - 1, Math.round(22 + Math.sin(a) * 2.4) - 1, 3, 2, C('#e03848')); }
    const cols = ['#9ad0f0', '#f0a0c0', '#f0e080', '#a0e0b0', '#c8a8f0'];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.15, cx = Math.round(24 + Math.cos(a) * 13), cy = Math.round(21 + Math.sin(a) * 3);
      px.rect(cx, cy - 7, 1, 7, C(cols[i % cols.length]));
      const fl = (i + f) % 3;
      px.set(cx, cy - 9 - (fl === 1 ? 1 : 0), C('#ffd060'));
      px.set(cx, cy - 8, C('#ffb030'));
      if (fl !== 2) px.set(cx + (fl ? 0 : 1) - (i % 2), cy - 10 - (fl === 1 ? 1 : 0), C('#fff4c0'));
    }
    px.outline();
    return G.frame(px, W / 2, H);
  }
  G.defSprite('birthday_cake', () => [0, 1, 2].map(cake), 6);

  // ---------------- the hug: a full-screen picture, 160 x 90, gently moving ----------------
  function hug(f) {
    const W = 160, H = 90;
    const px = new G.PX(W, H);
    const skin = C('#f2cca8'), skinD = C('#d8a888'), blush = C('#eaa496'), lip = C('#b8685e'), lash = C('#3a2a30');
    // morning wall and a window full of sun
    gradient(px, [[0, '#f0d8b4'], [50, '#e8c49a'], [90, '#d8ae84']], 0, W, 0, H);
    px.rect(6, 6, 44, 42, C('#8a6a4a'));
    gradient(px, [[7, '#ffe8b8'], [28, '#fff6dc'], [46, '#ffe0a8']], 8, 48, 8, 46);
    px.vline(28, 8, 45, C('#c8a07a')); px.hline(8, 47, 26, C('#c8a07a'));
    for (let y = 8; y < H; y++) for (let x = 0; x < W; x++) {
      const band = (x - y * 0.8 - 6) / 40;
      if (band > 0 && band < 1 && (x + y) % 2 === 0) px.set(x, y, G.mix(px.get(x, y), C('#fff2d0'), 0.3));
    }
    px.rect(0, 72, W, 18, C('#cdb878'));
    for (let x = 0; x < W; x += 2) px.set(x, 72, C('#b8a060'));
    px.hline(0, W - 1, 82, C('#a89050'));
    const b = f % 4 < 2 ? 0 : 1; // breathing: they rise and fall together
    const layer = (fn) => { const L = new G.PX(W, H); fn(L); L.outline(); px.blit(L, 0, b); };
    // Haru: sitting up in his pajamas, face pressed against her, eyes shut, smiling
    layer((L) => {
      L.rect(42, 48, 28, 34, C('#dfe8f2'));
      L.ellipse(56, 50, 14, 6, C('#dfe8f2'));
      for (let y = 51; y < 82; y += 4) L.hline(42, 69, y, C('#7a9ac8'));
      L.vline(69, 48, 81, C('#b8c8dc'));
      L.rect(55, 42, 7, 7, skin);
      L.ellipse(59, 33, 11, 11, C('#2a2234'));           // hair
      L.ellipse(64, 37, 7, 7, skin);                      // his cheek, turned toward her
      L.ellipse(57, 28, 11, 6, C('#2a2234'));
      L.ellipse(54, 26, 4, 2, C('#40364f'));              // shine
      L.rect(54, 35, 3, 4, skin); L.set(55, 36, skinD);   // ear
      L.set(63, 37, lash); L.set(64, 38, lash); L.set(65, 38, lash); L.set(66, 37, lash); // shut eye, smiling
      L.set(65, 40, blush); L.set(66, 40, blush);
      L.set(69, 41, lip); L.set(68, 42, lip);
    });
    // the futon over his legs
    layer((L) => {
      L.rect(4, 74, 82, 16, C('#4a6a9a'));
      for (let y = 78; y < H; y += 5) L.hline(4, 85, y, C('#a8c0e0'));
      L.rect(4, 74, 82, 2, C('#6a8ab8'));
    });
    // Mom: kneeling, leaning in; dark cardigan over her white dress, hair in a low bun, the cap
    layer((L) => {
      L.ellipse(100, 82, 26, 9, C('#ecebe6'));
      L.rect(76, 70, 46, 12, C('#ecebe6'));
      L.hline(76, 121, 81, C('#c8c6c0'));
      L.poly([[72, 40], [102, 36], [112, 50], [110, 74], [78, 74], [71, 56]], C('#4c4a56'));
      L.poly([[72, 42], [84, 40], [84, 72], [78, 72], [71, 56]], C('#5e5c6a'));
      L.rect(79, 34, 9, 5, C('#ecebe6'));
      L.rect(80, 29, 6, 6, skin);
      L.ellipse(78, 23, 8, 9, skin);                      // her face, turned to him
      L.ellipse(87, 18, 11, 8, C('#221c28'));             // hair
      L.rect(72, 13, 12, 5, C('#221c28'));
      L.ellipse(98, 24, 5, 5, C('#221c28'));              // the bun
      L.ellipse(98, 22, 2, 1, C('#3e3448'));
      L.rect(75, 10, 15, 4, C('#f8f6f0'));                // cap
      L.hline(75, 89, 14, C('#c8c6c0'));
      L.set(73, 22, lash); L.set(74, 23, lash); L.set(75, 23, lash); L.set(76, 22, lash); // shut eye, smiling
      L.set(72, 21, lash);
      L.set(70, 24, skinD);                               // nose
      L.set(74, 26, blush); L.set(75, 26, blush);
      L.set(71, 28, lip); L.set(72, 29, lip); L.set(73, 29, lip);
    });
    // her arms: one around his back, one hand on his hair
    layer((L) => {
      const sleeve = C('#4c4a56');
      L.thick(78, 44, 66, 52, 3, sleeve); L.thick(66, 52, 54, 56, 3, sleeve); L.thick(54, 56, 47, 56, 3, sleeve);
      L.rect(46, 53, 3, 6, C('#686674'));
      L.ellipse(43, 56, 3, 3, skin); L.set(41, 57, skinD);
      L.thick(86, 40, 76, 32, 3, sleeve); L.thick(76, 32, 66, 27, 3, sleeve);
      L.rect(64, 24, 3, 6, C('#686674'));
      L.ellipse(60, 25, 3, 3, skin); L.set(58, 25, skinD);
    });
    // his small arm around her
    layer((L) => {
      L.thick(66, 54, 78, 60, 2, C('#dfe8f2')); L.thick(78, 60, 86, 60, 2, C('#dfe8f2'));
      L.set(72, 57, C('#7a9ac8')); L.set(80, 60, C('#7a9ac8'));
      L.ellipse(89, 60, 2, 2, skin);
    });
    // dust in the sunlight, drifting; a small heart rises on the last frames
    const r = G.rng(9);
    for (let i = 0; i < 16; i++) {
      const x = (r.int(W) + f * 2 + i) % W, y = (r.int(64) + 6 + Math.round(Math.sin((f + i) * 0.8) * 2)) % H;
      if (x - y * 0.8 > 0 && x - y * 0.8 < 46) px.set(x, y, C('#fffbe8'));
    }
    if (f >= 4) {
      const hy = 14 - (f - 4) * 2, hx = 68;
      const red = C('#e8607a');
      [[0, 0], [1, 0], [3, 0], [4, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [1, 3], [2, 3], [3, 3], [2, 4]].forEach(([dx, dy]) => px.set(hx + dx, hy + dy, red));
    }
    return G.frame(px, W / 2, H);
  }
  G.defSprite('pic_birthday_hug', () => Array.from({ length: 8 }, (_, i) => hug(i)), 3);
})(window.G);
