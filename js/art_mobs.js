// Creatures and vehicles: knight on horseback, carriage, the truck,
// slimes, wolves, crows, ghosts, fire, shadow hands, shards, portals...
// Every animated thing is a list of frames in play order.
(function (G) {
  'use strict';
  const C = G.C;
  const M = (G.MOB = {});
  const D2R = Math.PI / 180;
  const darken = (c, f) => G.mix(c, C('#0a0612'), f);
  const lighten = (c, f) => G.mix(c, C('#fff6e0'), f);

  // ---------------- horse rig ----------------
  // Gallop poses: [upper, lower] leg angles in degrees from vertical,
  // positive = forward. Order: frontNear, frontFar, hindNear, hindFar.
  const GALLOP = [
    { bob: 1, legs: [[45, 70], [30, 45], [-40, -55], [-25, -45]], tail: 1 },
    { bob: 0, legs: [[10, -5], [35, 55], [-20, -35], [-40, -55]], tail: 0 },
    { bob: -1, legs: [[-15, -70], [5, -10], [25, 5], [5, -15]], tail: -1 },
    { bob: 0, legs: [[20, -45], [-15, -60], [10, -5], [30, 10]], tail: 0 },
  ];
  const STAND = { bob: 0, legs: [[5, 0], [-3, -2], [0, -4], [8, 2]], tail: -1 };

  function horse(px, ox, oy, pose, P, opts) {
    opts = opts || {};
    const b = pose.bob;
    const Y = (v) => oy + v + b;
    const legPts = (hx, hy, a1, a2, L1, L2) => {
      const kx = hx + Math.sin(a1 * D2R) * L1, ky = hy + Math.cos(a1 * D2R) * L1;
      const fx = kx + Math.sin(a2 * D2R) * L2, fy = ky + Math.cos(a2 * D2R) * L2;
      return [kx, ky, fx, fy];
    };
    const drawLeg = (hx, hy, ang, col, hoof, hind) => {
      const [kx, ky, fx, fy] = legPts(hx, hy, ang[0], ang[1], hind ? 7 : 7, 8);
      px.thick(hx, hy, kx, ky, 1.5, col);
      px.thick(kx, ky, fx, fy, 0.9, col);
      px.rect(Math.round(fx) - 1, Math.round(fy) - 1, 3, 2, hoof);
    };
    // far legs (darker)
    const far = darken(P.body, 0.35);
    drawLeg(ox + 31, Y(23), pose.legs[1], far, P.hoof, false);
    drawLeg(ox + 16, Y(22), pose.legs[3], far, P.hoof, true);
    // tail
    const tw = pose.tail;
    px.thick(ox + 9, Y(15), ox + 4, Y(17 - tw * 2), 1.6, P.mane);
    px.thick(ox + 4, Y(17 - tw * 2), ox + 1, Y(24 - tw * 3), 1.3, P.mane);
    px.thick(ox + 1, Y(24 - tw * 3), ox + 1, Y(28 - tw * 2), 0.8, P.mane);
    // body
    px.ellipse(ox + 23, Y(19), 12, 6.5, P.body);
    px.disc(ox + 14, Y(18), 6.8, P.body);
    px.disc(ox + 32, Y(19), 6.2, P.body);
    // neck + head
    px.thick(ox + 33, Y(16), ox + 39, Y(8), 4, P.body);
    px.thick(ox + 39, Y(6), ox + 45, Y(12), 2.6, P.body);
    px.thick(ox + 44, Y(11), ox + 46, Y(13), 1.8, P.body);
    // ears
    px.set(ox + 38, Y(1), P.body); px.set(ox + 38, Y(2), P.body); px.set(ox + 40, Y(1), darken(P.body, 0.2)); px.set(ox + 40, Y(2), P.body);
    // shading: belly dark, back light
    for (let y = -2; y < 40; y++)
      for (let x = 0; x < 52; x++) {
        const X = ox + x, YY = oy + y + b;
        if (px.get(X, YY) !== P.body) continue;
        const above = px.get(X, YY - 2) === 0, below = px.get(X, YY + 2) === 0;
        if (below && y > 18) px.set(X, YY, P.shade);
        else if (above) px.set(X, YY, P.light);
      }
    // mane
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const mx = ox + 38 - t * 8, my = Y(4 + t * 9);
      px.set(mx, my, P.mane); px.set(mx - 1, my, P.mane); px.set(mx - 1 - (i % 2), my + 1, P.mane);
    }
    // eye + nostril + bridle
    px.set(ox + 41, Y(7), C('#0e0a10'));
    px.set(ox + 46, Y(13), darken(P.body, 0.5));
    if (opts.bridle) { px.line(ox + 40, Y(9), ox + 44, Y(12), opts.bridle); px.line(ox + 39, Y(5), ox + 39, Y(9), opts.bridle); }
    // near legs
    drawLeg(ox + 32, Y(23), pose.legs[0], P.body, P.hoof, false);
    drawLeg(ox + 15, Y(22), pose.legs[2], P.body, P.hoof, true);
    // leg highlight on near legs (front edge)
    return { saddleX: ox + 22, saddleY: Y(12) };
  }

  const HORSE_KNIGHT = G.pal({ body: '#2c2430', shade: '#1a141e', light: '#4a3e52', mane: '#e8e2d6', hoof: '#151018' });
  const HORSE_CART = G.pal({ body: '#8a5a36', shade: '#64402a', light: '#a8744a', mane: '#3a2418', hoof: '#2a1c16' });
  const ARMOR = G.pal({ a: '#c9cfdb', A: '#8c94a6', d: '#5c6274', l: '#f2f5fa', r: '#c83636', R: '#8a2020', g: '#e2b54a', s: '#e9eef7', k: '#3a3040', c: '#9a2a2a' });

  function knightFrame(f) {
    const pose = f < 0 ? STAND : GALLOP[f];
    const px = new G.PX(60, 56);
    const ox = 4, oy = 15;
    const s = horse(px, ox, oy, pose, HORSE_KNIGHT, { bridle: ARMOR.R });
    const b = pose.bob;
    // caparison (cloth over the horse)
    px.poly([[ox + 10, oy + 13 + b], [ox + 34, oy + 13 + b], [ox + 36, oy + 24 + b], [ox + 8, oy + 24 + b]], ARMOR.r);
    for (let x = ox + 9; x <= ox + 35; x++) { px.set(x, oy + 24 + b, ARMOR.g); if (x % 3 === 0) px.set(x, oy + 25 + b, ARMOR.g); }
    px.hline(ox + 11, ox + 33, oy + 14 + b, lighten(ARMOR.r, 0.25));
    for (let y = oy + 15 + b; y < oy + 24 + b; y++) { px.set(ox + 34 + (y - oy - b > 19 ? 1 : 0), y, ARMOR.R); }
    // emblem
    px.rect(ox + 19, oy + 17 + b, 4, 4, ARMOR.g); px.set(ox + 20, oy + 18 + b, ARMOR.R); px.set(ox + 21, oy + 19 + b, ARMOR.R);
    // rider
    const sx = s.saddleX, sy = s.saddleY;
    // leg
    px.thick(sx + 1, sy + 1, sx + 5, sy + 6, 1.5, ARMOR.a);
    px.thick(sx + 5, sy + 6, sx + 4, sy + 11, 1.2, ARMOR.A);
    px.rect(sx + 3, sy + 11, 4, 2, ARMOR.d);
    // torso
    px.rect(sx - 2, sy - 11, 7, 12, ARMOR.a);
    px.vline(sx - 2, sy - 11, sy, ARMOR.l);
    px.vline(sx + 4, sy - 11, sy, ARMOR.A);
    px.hline(sx - 2, sx + 4, sy - 4, ARMOR.d);
    // cape flowing back
    const wave = [0, 1, 2, 1][f < 0 ? 0 : f];
    px.poly([[sx - 2, sy - 10], [sx - 2, sy - 2], [sx - 11, sy + 2 - wave], [sx - 9, sy - 6 - wave]], ARMOR.c);
    px.line(sx - 3, sy - 9, sx - 10, sy - 5 - wave, darken(ARMOR.c, 0.3));
    // helmet (great helm, rounded top, visor slit facing forward)
    px.rect(sx - 2, sy - 17, 7, 6, ARMOR.a);
    px.hline(sx - 1, sx + 3, sy - 18, ARMOR.a);
    px.vline(sx - 2, sy - 17, sy - 12, ARMOR.l);
    px.vline(sx + 4, sy - 17, sy - 12, ARMOR.A);
    px.hline(sx - 1, sx + 3, sy - 18, ARMOR.l);
    px.hline(sx + 1, sx + 5, sy - 15, ARMOR.k);
    px.set(sx + 3, sy - 13, ARMOR.k); px.set(sx + 4, sy - 13, ARMOR.k);
    px.vline(sx + 1, sy - 17, sy - 12, ARMOR.l);
    // pauldron + breastplate shine
    px.disc(sx + 2, sy - 9, 2.4, ARMOR.l);
    px.set(sx + 3, sy - 8, ARMOR.A);
    px.vline(sx, sy - 6, sy - 1, ARMOR.l);
    px.hline(sx - 2, sx + 4, sy - 3, ARMOR.g);
    // plume
    px.thick(sx, sy - 19, sx - 6, sy - 20 + wave, 1.2, ARMOR.r);
    px.thick(sx - 6, sy - 20 + wave, sx - 11, sy - 17 + wave, 1, ARMOR.R);
    // arm + sword held forward, ready to sweep
    px.thick(sx + 3, sy - 9, sx + 8, sy - 5, 1.3, ARMOR.A);
    px.rect(sx + 8, sy - 6, 2, 3, ARMOR.d);
    px.line(sx + 10, sy - 5, sx + 24, sy - 9, ARMOR.s);
    px.line(sx + 10, sy - 4, sx + 24, sy - 8, ARMOR.A);
    px.set(sx + 25, sy - 9, C('#ffffff'));
    px.vline(sx + 9, sy - 8, sy - 2, ARMOR.g);
    px.outline();
    return G.frame(px, 30, 54);
  }

  // ---------------- carriage ----------------
  function carriageFrame(f) {
    const pose = GALLOP[f];
    const px = new G.PX(92, 46);
    const ox = 40, oy = 7;
    // wagon behind the horse (to the left)
    const wb = [0, -1, 0, -1][f];
    const wy = oy + 8 + wb;
    const wood = C('#8a5f3a'), woodD = C('#5e3f26'), woodL = C('#b0804e'), canvasC = C('#e8dcc0'), canvasD = C('#b8a888'), canvasL = C('#fff6e0');
    // shafts
    px.line(32, wy + 18, ox + 14, oy + 18 + pose.bob, woodD);
    // cover arch
    px.ellipse(18, wy + 6, 17, 9, canvasC);
    px.rect(1, wy + 6, 34, 8, canvasC);
    for (let x = 4; x < 34; x += 7) px.vline(x, wy - 1, wy + 13, canvasD);
    px.hline(4, 30, wy - 2, canvasL);
    px.hline(1, 34, wy + 13, canvasD);
    // box
    px.rect(0, wy + 14, 36, 8, wood);
    px.hline(0, 35, wy + 14, woodL);
    px.hline(0, 35, wy + 18, woodD);
    px.hline(0, 35, wy + 21, woodD);
    for (let x = 5; x < 36; x += 10) px.vline(x, wy + 15, wy + 21, woodD);
    // lantern
    px.rect(34, wy + 9, 3, 4, C('#ffd27a')); px.set(35, wy + 8, C('#2a2530'));
    // wheels with turning spokes
    const wheel = (cx, cy) => {
      px.disc(cx, cy, 5.5, woodD);
      px.disc(cx, cy, 4.2, C('#2a1c16'));
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI + (f / 4) * (Math.PI / 2);
        px.line(cx - Math.cos(a) * 4, cy - Math.sin(a) * 4, cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, woodL);
      }
      px.disc(cx, cy, 1.2, C('#c8b070'));
    };
    wheel(8, wy + 24);
    wheel(28, wy + 24);
    // horse
    horse(px, ox, oy, pose, HORSE_CART, { bridle: C('#3a2418') });
    // harness strap
    px.line(ox + 26, oy + 14 + pose.bob, ox + 36, oy + 17 + pose.bob, C('#3a2418'));
    px.outline();
    return G.frame(px, 46, 43);
  }

  // ---------------- truck (faces left) ----------------
  function truckFrame(f) {
    const W = 104, H = 56;
    const px = new G.PX(W, H);
    const top = 6;
    const cab = G.pal({ w: '#eceee8', W: '#c3c6c0', d: '#8e928c', b: '#2f6fb8', B: '#1f4a80', g: '#9fd0ff', G: '#4a7aa8', k: '#22242a', K: '#3a3c44', y: '#ffe9a0', Y: '#fff8d8', r: '#d83a3a', o: '#f0a030' });
    // cargo box: roof strip + side
    const bx = 30, bw = 72;
    px.rect(bx, top, bw, 7, cab.W); // roof (seen from above)
    px.hline(bx, bx + bw - 1, top, cab.w);
    for (let x = bx + 4; x < bx + bw; x += 6) px.vline(x, top + 1, top + 6, cab.d);
    px.rect(bx, top + 7, bw, 30, cab.w); // side
    for (let x = bx + 3; x < bx + bw; x += 5) px.vline(x, top + 8, top + 36, G.mix(cab.w, cab.W, 0.6));
    px.hline(bx, bx + bw - 1, top + 7, cab.d);
    px.hline(bx, bx + bw - 1, top + 36, cab.d);
    px.rect(bx + 2, top + 27, bw - 4, 4, cab.b);
    px.hline(bx + 2, bx + bw - 3, top + 27, lighten(cab.b, 0.3));
    // cab (front at left)
    const cx = 4;
    px.rect(cx + 2, top + 4, 26, 8, cab.W); // cab roof
    px.hline(cx + 2, cx + 27, top + 4, cab.w);
    px.rect(cx, top + 12, 28, 30, cab.w);
    px.rect(cx, top + 12, 2, 30, cab.W);
    // windows
    px.rect(cx + 3, top + 14, 11, 9, cab.g);
    px.rect(cx + 15, top + 14, 10, 9, cab.g);
    px.line(cx + 4, top + 21, cx + 9, top + 15, cab.Y);
    px.line(cx + 16, top + 21, cx + 20, top + 16, lighten(cab.g, 0.5));
    px.hline(cx + 3, cx + 13, top + 22, cab.G); px.hline(cx + 15, cx + 24, top + 22, cab.G);
    // driver silhouette
    px.rect(cx + 18, top + 17, 4, 6, C('#3a3448')); px.rect(cx + 18, top + 15, 4, 3, C('#2a2430'));
    // stripe + door line
    px.rect(cx, top + 27, 28, 4, cab.b);
    px.hline(cx, cx + 27, top + 27, lighten(cab.b, 0.3));
    px.vline(cx + 14, top + 24, top + 39, cab.d);
    px.rect(cx + 10, top + 32, 3, 1, cab.k);
    // front bumper + grille + headlight on the left edge
    px.rect(0, top + 34, 6, 6, cab.K);
    px.rect(0, top + 30, 3, 4, cab.Y);
    px.rect(0, top + 29, 2, 1, cab.y);
    px.rect(cx + 2, top + 39, 26, 3, cab.K);
    px.rect(1, top + 39, 3, 2, cab.o);
    // mirror
    px.rect(cx - 2, top + 13, 2, 6, cab.k);
    // underside shadow
    px.rect(cx + 2, top + 42, W - 8, 3, C('#141418'));
    // wheels
    const wheel = (wx, wy) => {
      px.disc(wx, wy, 6.5, cab.k);
      px.disc(wx, wy, 4, C('#7c808a'));
      px.disc(wx, wy, 2, C('#4a4e58'));
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 - (f / 4) * (Math.PI * 2 / 3);
        px.set(Math.round(wx + Math.cos(a) * 3), Math.round(wy + Math.sin(a) * 3), C('#c0c4cc'));
      }
    };
    wheel(16, top + 44);
    wheel(68, top + 44);
    wheel(84, top + 44);
    // tail light
    px.rect(W - 3, top + 30, 2, 5, cab.r);
    px.outline();
    // painted logo on the box
    const f2 = G.frame(px, 0, 0);
    const cx2 = f2.c.getContext('2d');
    G.text(cx2, 'ISEKAI', bx + 9, top + 11, { color: '#d83a3a', shadow: '#f8f8f0' });
    G.text(cx2, 'EXPRESS', bx + 24, top + 19, { color: '#1f4a80', shadow: false });
    f2.ax = 52;
    f2.ay = H - 2;
    return f2;
  }

  // ---------------- slime ----------------
  function slimeFrame(f, pal) {
    const px = new G.PX(18, 18);
    // squash/stretch per frame: [w, h, lift]
    const S = [[7.5, 4.5, 0], [6.5, 5.5, 1], [5.5, 6.8, 4], [6.5, 5.5, 1]][f];
    const cx = 9, base = 16 - S[2];
    const cy = base - S[1];
    px.ellipse(cx, cy, S[0], S[1], pal.m);
    // flatten bottom
    px.rect(Math.round(cx - S[0] + 1), Math.round(base - 1), Math.round(S[0] * 2 - 2), 1, pal.m);
    for (let y = 0; y < 18; y++)
      for (let x = 0; x < 18; x++) {
        if (px.get(x, y) !== pal.m) continue;
        const dx = (x + 0.5 - cx) / S[0], dy = (y + 0.5 - cy) / S[1];
        if (dy > 0.45 || (dx > 0.55 && dy > 0)) px.set(x, y, pal.d);
        else if (dx < -0.1 && dy < -0.25) px.set(x, y, pal.l);
      }
    px.set(Math.round(cx - S[0] * 0.45), Math.round(cy - S[1] * 0.55), C('#ffffff'));
    px.set(Math.round(cx - S[0] * 0.45) + 1, Math.round(cy - S[1] * 0.55), pal.l);
    // eyes
    const ey = Math.round(cy - 0.5);
    px.rect(Math.round(cx - 3), ey, 1, 2, C('#140c1c'));
    px.rect(Math.round(cx + 2), ey, 1, 2, C('#140c1c'));
    px.set(Math.round(cx - 0.5), ey + 2, C('#140c1c'));
    px.outline();
    return G.frame(px, 9, 16);
  }

  // ---------------- wolf (faces right) ----------------
  const WOLF = G.pal({ f: '#7e7c8a', F: '#5a5866', l: '#b3b1bf', b: '#d8d4dc', k: '#2a2833', e: '#ff4040' });
  function wolfFrame(f) {
    const px = new G.PX(32, 20);
    const RUN = [
      { bob: 0, legs: [[50, 30], [35, 20], [-45, -30], [-30, -20]] },
      { bob: -1, legs: [[10, 0], [40, 30], [-10, -20], [-45, -35]] },
      { bob: -1, legs: [[-30, -50], [0, -10], [30, 10], [10, -5]] },
      { bob: 0, legs: [[20, -20], [-25, -45], [10, 0], [35, 15]] },
    ][f];
    const b = RUN.bob;
    const leg = (hx, hy, a, col) => {
      const kx = hx + Math.sin(a[0] * D2R) * 4, ky = hy + Math.cos(a[0] * D2R) * 4;
      const fx = kx + Math.sin(a[1] * D2R) * 4, fy = ky + Math.cos(a[1] * D2R) * 4;
      px.thick(hx, hy, kx, ky, 0.9, col);
      px.line(kx, ky, fx, fy, col);
      px.set(fx + 1, fy, col);
    };
    leg(22, 11 + b, RUN.legs[1], WOLF.F);
    leg(9, 11 + b, RUN.legs[3], WOLF.F);
    // tail
    px.thick(5, 8 + b, 1, 6 + b + (f % 2), 1.4, WOLF.F);
    // body
    px.ellipse(15, 9 + b, 9, 3.6, WOLF.f);
    px.disc(22, 8 + b, 3.6, WOLF.f);
    // head
    px.disc(26, 6 + b, 3, WOLF.f);
    px.rect(27, 6 + b, 4, 2, WOLF.f);
    px.set(30, 6 + b, WOLF.k);
    px.set(24, 2 + b, WOLF.f); px.set(25, 2 + b, WOLF.F); px.set(25, 3 + b, WOLF.f); px.set(26, 3 + b, WOLF.f);
    // shading
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 32; x++) {
        if (px.get(x, y) !== WOLF.f) continue;
        if (!px.get(x, y - 1)) px.set(x, y, WOLF.F);
        else if (!px.get(x, y + 2) && x > 8 && x < 25) px.set(x, y, WOLF.l);
      }
    px.hline(10, 20, 11 + b, WOLF.b);
    px.set(27, 5 + b, WOLF.e);
    px.hline(28, 30, 8 + b, WOLF.b);
    leg(21, 11 + b, RUN.legs[0], WOLF.f);
    leg(10, 11 + b, RUN.legs[2], WOLF.f);
    px.outline();
    return G.frame(px, 16, 19);
  }

  // ---------------- crow (faces right) ----------------
  function crowFrame(f) {
    const px = new G.PX(22, 18);
    const k = C('#22202c'), K = C('#3a3650'), l = C('#5a5578'), beak = C('#e0b040'), eye = C('#ff5050');
    // body
    px.ellipse(11, 10, 5, 3, k);
    px.disc(16, 8, 2.6, k);
    px.poly([[18, 7.5], [21, 8.5], [18, 9.5]], beak);
    px.set(17, 7, eye);
    px.poly([[6, 9], [1, 8], [2, 11], [6, 11]], k);
    // wing by frame (up, mid, down, mid)
    const wy = [-7, -2, 5, -2][f];
    px.poly([[8, 9], [14, 9], [11 - (wy < 0 ? 2 : 0), 9 + wy]], K);
    px.line(8, 9, 11 - (wy < 0 ? 2 : 0), 9 + wy, l);
    px.outline();
    return G.frame(px, 11, 14);
  }

  // ---------------- ghost ----------------
  function ghostFrame(f) {
    const px = new G.PX(16, 18);
    const b = C('#cfe0ff'), d = C('#8fa6d8'), l = C('#ffffff'), e = C('#1a1430');
    const by = [0, -1, -1, 0][f];
    px.ellipse(8, 7 + by, 6, 6, b);
    px.rect(2, 7 + by, 12, 5, b);
    // wavy tail
    for (let x = 2; x < 14; x++) {
      const h = 2 + Math.round(1.5 + Math.sin((x + f * 2) * 1.1) * 1.5);
      px.vline(x, 12 + by, 12 + by + h, x > 9 ? d : b);
    }
    px.vline(13, 4 + by, 12 + by, d);
    px.set(5, 3 + by, l); px.set(4, 4 + by, l);
    px.rect(5, 7 + by, 2, 3, e); px.rect(9, 7 + by, 2, 3, e);
    px.rect(7, 11 + by, 2, 1, e);
    px.outline();
    return G.frame(px, 8, 17);
  }

  // ---------------- fire / wisp ----------------
  function teardrop(px, cx, cy, r, tx, ty, col) {
    px.disc(cx, cy, r, col);
    px.poly([[cx - r * 0.95, cy - r * 0.15], [tx, ty], [cx + r * 0.95, cy - r * 0.15]], col);
  }
  G.teardrop = teardrop;
  function fireFrame(f, pal) {
    const px = new G.PX(14, 18);
    const k = f % 4;
    const sway = [0, 1, 0, -1][k], lift = [0, 1, 2, 1][k];
    teardrop(px, 7, 12, 4.6, 7 + sway * 1.5, 1 + lift, pal[0]);
    // side licks
    px.thick(3.5, 11, 2.5 - sway * 0.5, 7 + (k % 2), 0.7, pal[0]);
    px.thick(10.5, 11, 11.5 - sway * 0.5, 8 - (k % 2), 0.7, pal[0]);
    teardrop(px, 7, 12.5, 3.4, 7 + sway, 4 + lift, pal[1]);
    teardrop(px, 7, 13, 2.2, 7 + sway * 0.5, 7 + lift, pal[2]);
    px.set(7, 13, pal[3]); px.set(7, 12, pal[3]);
    px.outline(darken(pal[0], 0.55));
    return G.frame(px, 7, 12);
  }

  // ---------------- shadow hand ----------------
  function handFrame(f) {
    const px = new G.PX(20, 24);
    const k = C('#140a1e'), K = C('#2a1640'), e = C('#b070ff');
    // dark pool
    px.ellipse(10, 21, 8, 2.5, K);
    // arm rising
    px.thick(10, 21, 10, 12, 2.6, k);
    // palm + fingers opening/closing
    const open = [1, 0.6, 0.2, 0.6][f];
    px.disc(10, 10, 3.6, k);
    for (let i = 0; i < 4; i++) {
      const a = (-0.75 + i * 0.5) * open - Math.PI / 2;
      const L = 6 + (i === 1 || i === 2 ? 1 : 0);
      px.thick(10 + (i - 1.5) * 1.6, 8, 10 + (i - 1.5) * 1.6 + Math.cos(a) * L * 0.6, 8 + Math.sin(a) * L, 0.8, k);
    }
    px.thick(7, 11, 4 - open * 2, 7 + (1 - open) * 2, 0.8, k);
    px.set(10, 15, e); px.set(10, 16, e);
    px.outline(C('#5a2a8a'));
    return G.frame(px, 10, 21);
  }

  // ---------------- shard (collectible) ----------------
  function shardFrame(f, colors) {
    const px = new G.PX(12, 16);
    const w = [4, 3, 1.5, 0.5, 1.5, 3][f];
    const cx = 6;
    px.poly([[cx, 1], [cx + w + 0.5, 7], [cx, 14], [cx - w - 0.5, 7]], colors[1]);
    // facets
    if (w > 1) {
      px.poly([[cx, 1], [cx, 14], [cx - w - 0.5, 7]], colors[2]);
      px.line(cx, 2, cx, 13, colors[3]);
    }
    px.set(cx, 2, C('#ffffff'));
    px.outline(colors[0]);
    return G.frame(px, 6, 15);
  }

  // ---------------- portal ----------------
  function portalFrame(f, open, fake) {
    const px = new G.PX(28, 34);
    const stone = C('#8a8496'), stoneL = C('#b5b0c0'), stoneD = C('#56506a');
    const cx = 14, cy = 15;
    // base
    px.rect(4, 28, 20, 5, stoneD); px.hline(4, 23, 28, stone);
    // ring
    px.ellipse(cx, cy, 12, 14, stone);
    px.ellipse(cx, cy, 8.5, 10.5, C('#120c1c'));
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      const x = cx + Math.cos(ang) * 10.3, y = cy + Math.sin(ang) * 12.3;
      px.set(x, y, a % 2 ? stoneD : stoneL);
    }
    px.line(cx - 10, cy - 6, cx - 7, cy - 11, stoneL);
    // rune stones
    for (const [x, y] of [[cx, cy - 13], [cx - 11, cy], [cx + 11, cy]]) px.rect(x - 1, y - 1, 3, 3, open ? C('#9ff2ff') : stoneD);
    if (open) {
      // swirl inside: rotating spiral arms (fake one spins the other way)
      const pal = fake ? [C('#2a1640'), C('#6a3ac8'), C('#c7a8ff'), C('#ffffff')] : [C('#123a5a'), C('#2a8ac8'), C('#8ff0ff'), C('#ffffff')];
      for (let y = -11; y <= 11; y++)
        for (let x = -9; x <= 9; x++) {
          const dx = x / 8.5, dy = y / 10.5;
          const r = Math.hypot(dx, dy);
          if (r >= 1) continue;
          const ang = Math.atan2(dy, dx);
          const spin = (fake ? -1 : 1) * (f / 8) * Math.PI * 2;
          const v = Math.sin(ang * 3 + r * 7 - spin);
          let col = pal[0];
          if (v > 0.2) col = pal[1];
          if (v > 0.75 && r > 0.25) col = pal[2];
          if (r < 0.22) col = pal[3];
          px.set(cx + x, cy + y, col);
        }
    }
    px.outline();
    return G.frame(px, 14, 32);
  }

  // ---------------- witch flame (save point) ----------------
  function witchFlame(f, lit) {
    const px = new G.PX(16, 24);
    const k = f % 6;
    const sway = [0, 1, 1, 0, -1, -1][k], lift = [0, 1, 2, 2, 1, 0][k];
    const outer = lit ? C('#c48aff') : C('#6a4a9a'), mid = lit ? C('#4a1a7a') : C('#2a1640'), core = C('#07020c');
    // iron brazier
    px.rect(4, 18, 8, 3, C('#3a3040')); px.hline(3, 12, 17, C('#5a5060')); px.rect(6, 21, 4, 2, C('#2a2230')); px.hline(4, 11, 22, C('#2a2230'));
    teardrop(px, 8, 13, 4.6, 8 + sway * 1.5, 1 + lift, outer);
    teardrop(px, 8, 13.5, 3.3, 8 + sway, 4 + lift, mid);
    teardrop(px, 8, 14, 1.8, 8 + sway * 0.5, 8 + lift, core);
    if (lit) { px.set(6, 11, C('#ffffff')); }
    px.outline(C('#12061c'));
    return G.frame(px, 8, 22);
  }

  // ---------------- arrows / turret / rock / blade ----------------
  function arrowFrame(vertical) {
    const px = new G.PX(12, 12);
    const shaft = C('#a87a4c'), head = C('#d0d6e0'), fl = C('#f0f0f0'), fr = C('#c83636');
    if (!vertical) {
      px.hline(1, 9, 6, shaft);
      px.set(10, 6, head); px.set(11, 6, head); px.set(10, 5, head); px.set(10, 7, head);
      px.set(1, 5, fr); px.set(2, 5, fl); px.set(1, 7, fr); px.set(2, 7, fl);
    } else {
      px.vline(6, 1, 9, shaft);
      px.set(6, 10, head); px.set(6, 11, head); px.set(5, 10, head); px.set(7, 10, head);
      px.set(5, 1, fr); px.set(5, 2, fl); px.set(7, 1, fr); px.set(7, 2, fl);
    }
    px.outline();
    return G.frame(px, 6, 6);
  }
  function rockFrame() {
    const px = new G.PX(18, 16);
    G.shadeDisc(px, 9, 8, 6.5, C('#7a7480'), C('#a8a2ae'), C('#4e4856'), -0.7, -0.7);
    G.shadeDisc(px, 6, 10, 4, C('#7a7480'), C('#a8a2ae'), C('#4e4856'), -0.7, -0.7);
    px.line(8, 5, 10, 8, C('#4e4856'));
    px.outline();
    return G.frame(px, 9, 14);
  }
  function bladeFrame() {
    const px = new G.PX(20, 14);
    const s = C('#d6dbe6'), d = C('#8f96a8'), e = C('#ffffff');
    px.poly([[10, 3], [19, 8], [15, 13], [5, 13], [1, 8]], s);
    px.poly([[10, 3], [10, 13], [5, 13], [1, 8]], d);
    px.hline(5, 15, 12, e);
    px.rect(9, 0, 3, 5, C('#5a5462'));
    px.outline();
    return G.frame(px, 10, 7);
  }
  function mimicFrame(f) {
    // shard that has opened a mouth full of teeth
    const px = new G.PX(16, 18);
    const o = f / 3;
    const top = C('#7ff5ff'), dark = C('#1a0a1e'), tooth = C('#ffffff'), tongue = C('#e04060');
    px.poly([[8, 1], [13, 7 - o * 3], [3, 7 - o * 3]], top);
    px.poly([[3, 9 + o * 2], [13, 9 + o * 2], [8, 16]], top);
    px.rect(3, Math.round(7 - o * 3), 11, Math.round(2 + o * 5), dark);
    for (let x = 4; x < 13; x += 2) { px.set(x, Math.round(7 - o * 3) + 1, tooth); px.set(x + 1, Math.round(9 + o * 2) - 1, tooth); }
    px.rect(6, Math.round(8 + o), 4, 2, tongue);
    px.set(6, 3, C('#ff2040')); px.set(10, 3, C('#ff2040'));
    px.outline(C('#0a3a4a'));
    return G.frame(px, 8, 16);
  }

  // ---------------- kid special poses ----------------
  const KP = () => G.KIDPAL;
  function kidPose(rows, ax, ay, recolor) {
    const w = rows[0].length, h = rows.length;
    const px = new G.PX(w + 2, h + 2);
    px.stamp(rows, KP(), 1, 1);
    if (recolor) px.map(recolor);
    px.outline();
    return G.frame(px, ax + 1, ay + 1);
  }
  const LIE_DOWN = [
    // collapsed face-down, head to the left
    '.....hhhhh..............',
    '...hhhHHhhhh............',
    '..hhHhhhhhhhhjjjjjjj....',
    '..hhhhhhhhhhkjjjjjjjJppP',
    '..shhhhhhhhhkjjOOjjjJppPqq',
    '...hhhhhhhhJJJJJJJJJJpPPQQ',
    '.....ss..........ss.......',
  ];
  const LIE_UP = [
    // on his back, face up (wake-up scene)
    '....hhhhhh..............',
    '..hhhHHhhhhh............',
    '.hhsssssshhhh.jjjjjjjj..',
    '.hseSsseSshhhkjjttjjjJppP',
    '.hssssmssshhhkjjttjjjJppPq',
    '..hsssssshhh.JJJJJJJJJpPPQ',
    '...SSSSSS......ss........',
  ];
  const SIT = [
    '.....hhhhhh.....',
    '...hhhHHhhhhh...',
    '..hhHHhhhhhhhh..',
    '.hhHhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '.hhshhhsshhhshh.',
    '.hhsssssssssshh.',
    '.hsssessssesssh.',
    '.hsssessssesssh.',
    '..hscssmmsscsh..',
    '....SssssssS....',
    '...kjjjSSjjjJ...',
    '..OJkjjttjjjJO..',
    '..OJkjjttjjjJO..',
    '..ssJJJJJJJJss..',
    '.pppppppppppppp.',
    'qqQpPPpppPPpqqQ.',
  ];
  const SHOCK = [
    '.....hhhhhh.....',
    '...hhhHHhhhhh...',
    '..hhHHhhhhhhhh..',
    '.hhHhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '.hhshhhsshhhshh.',
    '.hhsssssssssshh.',
    '.hsswwsssswwssh.',
    '.hssweSsssewssh.',
    '..hsssmmmmsssh..',
    '....SssmmssS....',
    '...kjjjSSjjjJ...',
    '.sOJkjjttjjjJOs.',
    '.sOJkjjttjjjJOs.',
    '..OJkjjttjjjJO..',
    '...Jkjjttjjj....',
    '....JJJJJJJJ....',
    '.....pppppp.....',
    '.....ppPppP.....',
    '.....ppPppP.....',
    '.....ppPppP.....',
    '....qqqQqqqQ....',
    '....QQQ..QQQ....',
  ];
  const GASP = [
    '................',
    '.....hhhhhh.....',
    '...hhhHHhhhhh...',
    '..hhHHhhhhhhhh..',
    '.hhHhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '.hhshhhsshhhshh.',
    '.hhsssssssssshh.',
    '.hsseesssseessh.',
    '.hssssssssssssh.',
    '..hscssmmsscsh..',
    '....SssmmssS....',
    '..kjjjjSSjjjjJ..',
    '.OJkjjjttjjjjJO.',
    '.OJkjjjttjjjjJO.',
    'ssJkjjjttjjjjJss',
    'ss.JJJJJJJJJJ.ss',
    '....ppppppppp...',
    '....ppP...ppP...',
    '...ppP.....ppP..',
    '...ppP.....ppP..',
    '..qqqQ.....qqqQ.',
    '..QQQQ.....QQQQ.',
  ];
  const FALL = [
    'ss................ss',
    'ss................ss',
    'jO.....hhhhhh.....Oj',
    'jO...hhhHHhhhhh...Oj',
    'jO..hhHHhhhhhhhh..Oj',
    '.jO.hHhhhhhhhhhh.Oj.',
    '.jOhhhhhhhhhhhhhhOj.',
    '..jhhhhhhhhhhhhhhj..',
    '...hhshhhsshhhshh...',
    '...hhsssssssssshh...',
    '...hsswwsssswwssh...',
    '...hssweSsssewssh...',
    '....hsssmmmmsssh....',
    '...kjjSssmmssSjjJ...',
    '....kjjjjttjjjjJ....',
    '.....Jkjjttjjj......',
    '.....Jkjjttjjj......',
    '......JJJJJJJJ......',
    '......pppppppp......',
    '.....ppP....ppP.....',
    '....ppP......ppP....',
    '...qqqQ......qqqQ...',
    '...QQQQ......QQQQ...',
  ];
  // lying on the ground, head to the left. faceUp: on his back (eyes closed).
  function lying(faceUp, recolor) {
    const P = G.KIDPAL;
    const px = new G.PX(32, 16);
    // legs + shoes
    px.rect(20, 5, 7, 6, P.p); px.hline(20, 26, 8, P.P); px.hline(20, 26, 10, P.P);
    px.rect(27, 4, 3, 3, P.q); px.rect(27, 9, 3, 3, P.q); px.vline(29, 4, 6, P.Q); px.vline(29, 9, 11, P.Q);
    // torso
    px.rect(11, 3, 10, 10, P.j);
    px.hline(11, 20, 3, P.k); px.hline(11, 20, 12, P.J);
    if (faceUp) { px.hline(12, 20, 7, P.t); px.hline(12, 20, 8, P.t); px.hline(12, 20, 9, P.T); }
    // arms along the body (near arm reaches forward when face-down)
    if (faceUp) {
      px.rect(12, 1, 7, 2, P.j); px.hline(12, 18, 1, P.O); px.rect(19, 1, 2, 2, P.s);
      px.rect(12, 13, 7, 2, P.j); px.hline(12, 18, 14, P.O); px.rect(19, 13, 2, 2, P.s);
    } else {
      px.rect(4, 1, 9, 2, P.j); px.hline(4, 12, 1, P.O); px.rect(2, 1, 2, 2, P.s);
      px.rect(12, 13, 7, 2, P.j); px.hline(12, 18, 14, P.O); px.rect(19, 13, 2, 2, P.s);
    }
    // head
    px.ellipse(7, 8, 5.5, 5.5, P.h);
    px.ellipse(5.5, 6.5, 2.5, 2, P.H);
    if (faceUp) {
      px.ellipse(9, 8, 3.5, 4.5, P.s);
      px.vline(12, 6, 10, P.S);
      px.hline(7, 8, 5, P.e); px.hline(7, 8, 10, P.e);
      px.set(11, 8, P.m);
      px.set(9, 5, P.c); px.set(9, 11, P.c);
    }
    if (recolor) px.map(recolor);
    px.outline();
    return G.frame(px, 16, 12);
  }
  const SKULL = G.pal({ s: '#f0ecdf', S: '#bdb6a3', e: '#140c1c' });
  function skeletonFrame() {
    const rows = [
      '....ssssss....',
      '..ssssssssss..',
      '.ssssssssssss.',
      '.ssseessseesss',
      '.sseeesssseees'.slice(0, 14),
      '.ssseessseess.',
      '..ssssseesss..',
      '...sSsSsSsS...',
      '....SsSsSsS...',
      '......ss......',
      '...ssssssss...',
      '..s.s.ss.s.s..',
      '..s.ssssss.s..',
      '..s.s.ss.s.s..',
      '..s..ssss..s..',
      '.....s..s.....',
      '.....s..s.....',
      '.....s..s.....',
      '....ss..ss....',
    ];
    const px = new G.PX(16, 22);
    px.stamp(rows, SKULL, 1, 2);
    px.outline();
    return G.frame(px, 8, 21);
  }
  // bubbles
  function bubble(kind) {
    const px = new G.PX(13, 13);
    const w = C('#ffffff'), k = C('#140c1c');
    px.rect(1, 1, 11, 9, w);
    px.set(5, 10, w); px.set(6, 10, w); px.set(5, 11, w);
    if (kind === '!') { px.vline(6, 2, 6, C('#d83a3a')); px.set(6, 8, C('#d83a3a')); }
    if (kind === '?') { px.hline(5, 7, 2, k); px.set(8, 3, k); px.set(7, 4, k); px.set(6, 5, k); px.set(6, 6, k); px.set(6, 8, k); }
    if (kind === '...') { px.set(3, 6, k); px.set(6, 6, k); px.set(9, 6, k); }
    if (kind === 'heart') { px.set(4, 3, C('#d83a3a')); px.set(8, 3, C('#d83a3a')); px.hline(3, 9, 4, C('#d83a3a')); px.hline(3, 9, 5, C('#d83a3a')); px.hline(4, 8, 6, C('#d83a3a')); px.hline(5, 7, 7, C('#d83a3a')); px.set(6, 8, C('#d83a3a')); }
    px.outline(k);
    return G.frame(px, 6, 12);
  }

  M.build = function () {
    M.knight = [0, 1, 2, 3].map(knightFrame);
    M.knightStand = knightFrame(-1);
    M.carriage = [0, 1, 2, 3].map(carriageFrame);
    M.truck = [0, 1, 2, 3].map(truckFrame);
    const SG = G.pal({ m: '#5ccf5a', d: '#2f8a40', l: '#a8f08a' });
    const SB = G.pal({ m: '#5aa8e8', d: '#2f5aa8', l: '#a8dcff' });
    const SR = G.pal({ m: '#e85a6a', d: '#a02f48', l: '#ffa8b0' });
    M.slime = [0, 1, 2, 3].map((f) => slimeFrame(f, SG));
    M.slimeB = [0, 1, 2, 3].map((f) => slimeFrame(f, SB));
    M.slimeR = [0, 1, 2, 3].map((f) => slimeFrame(f, SR));
    M.wolf = [0, 1, 2, 3].map(wolfFrame);
    M.crow = [0, 1, 2, 3].map(crowFrame);
    M.ghost = [0, 1, 2, 3].map(ghostFrame);
    const FIRE = [C('#d8401a'), C('#ff8a2a'), C('#ffd04a'), C('#fff6c8')];
    const WISP = [C('#4a3ad8'), C('#7a8aff'), C('#c0d4ff'), C('#ffffff')];
    const HEX = [C('#6a1ab8'), C('#a050ff'), C('#e0b8ff'), C('#ffffff')];
    M.fire = [0, 1, 2, 3].map((f) => fireFrame(f, FIRE));
    M.wisp = [0, 1, 2, 3].map((f) => fireFrame(f + 10, WISP));
    M.hex = [0, 1, 2, 3].map((f) => fireFrame(f + 20, HEX));
    M.hand = [0, 1, 2, 3].map(handFrame);
    const SH = [C('#1a6a8a'), C('#7ff5ff'), C('#3ac8e8'), C('#e8ffff')];
    M.shard = [0, 1, 2, 3, 4, 5].map((f) => shardFrame(f, SH));
    M.portalOpen = [0, 1, 2, 3, 4, 5, 6, 7].map((f) => portalFrame(f, true, false));
    M.portalFake = [0, 1, 2, 3, 4, 5, 6, 7].map((f) => portalFrame(f, true, true));
    M.portalShut = [portalFrame(0, false, false)];
    M.flame = [0, 1, 2, 3, 4, 5].map((f) => witchFlame(f, false));
    M.flameLit = [0, 1, 2, 3, 4, 5].map((f) => witchFlame(f, true));
    M.arrowH = arrowFrame(false);
    M.arrowV = arrowFrame(true);
    M.rock = rockFrame();
    M.blade = bladeFrame();
    M.mimic = [0, 1, 2, 3].map(mimicFrame);
    M.lieDown = lying(false);
    M.lieUp = lying(true);
    M.sit = kidPose(SIT, 8, 17);
    M.shock = kidPose(SHOCK, 8, 23);
    M.gasp = kidPose(GASP, 8, 23);
    M.fall = kidPose(FALL, 10, 22);
    const charred = (c) => { const a = G.rgba(c); const l = (a[0] + a[1] + a[2]) / 3; return G.pack(20 + l * 0.12, 16 + l * 0.1, 18 + l * 0.1, 255); };
    M.charred = lying(false, charred);
    M.charredStand = kidPose(SHOCK, 8, 23, charred);
    M.skeleton = skeletonFrame();
    M.bubble = { '!': bubble('!'), '?': bubble('?'), '...': bubble('...'), heart: bubble('heart') };
  };

  G.PREVIEW = function () {
    if (!M.knight) { M.build(); }
    return [
      { name: 'knight', frames: M.knight.concat([M.knightStand]) },
      { name: 'carriage', frames: M.carriage },
      { name: 'truck', frames: M.truck.slice(0, 2) },
      { name: 'slime', frames: M.slime.concat(M.slimeB, M.slimeR) },
      { name: 'wolf', frames: M.wolf.concat(M.crow) },
      { name: 'ghost', frames: M.ghost.concat(M.fire, M.wisp, M.hex) },
      { name: 'hand', frames: M.hand.concat(M.shard) },
      { name: 'portal', frames: M.portalOpen.slice(0, 3).concat(M.portalFake.slice(0, 1), M.portalShut) },
      { name: 'flame', frames: M.flame.slice(0, 3).concat(M.flameLit.slice(0, 3), [M.arrowH, M.arrowV, M.rock, M.blade]) },
      { name: 'mimic', frames: M.mimic.concat([M.skeleton]) },
      { name: 'poses', frames: [M.lieDown, M.lieUp, M.sit, M.shock, M.gasp, M.fall, M.charred, M.charredStand, M.bubble['!'], M.bubble['?'], M.bubble.heart] },
    ];
  };
})(window.G);
