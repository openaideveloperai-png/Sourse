// Art library: shared pixel-art helpers and the sprite registry.
// Sprites are built lazily from code (G.defSprite) and cached.
(function (G) {
  'use strict';
  const C = G.C;
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  G.bayer = (x, y) => (BAYER[y & 3][x & 3] + 0.5) / 16;
  G.vnoise = function (x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = G.hash(xi, yi, seed), b = G.hash(xi + 1, yi, seed), c = G.hash(xi, yi + 1, seed), d = G.hash(xi + 1, yi + 1, seed);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  G.darken = (c, f) => G.mix(c, C('#0a0612'), f);
  G.lighten = (c, f) => G.mix(c, C('#fff6e0'), f);

  // Disc shaded toward a light direction (lx, ly), with ordered dithering.
  G.shadeDisc = function (px, cx, cy, rad, base, hi, lo, lx, ly) {
    lx = lx === undefined ? -0.7 : lx;
    ly = ly === undefined ? -0.7 : ly;
    for (let y = Math.floor(cy - rad - 1); y <= cy + rad + 1; y++)
      for (let x = Math.floor(cx - rad - 1); x <= cx + rad + 1; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (Math.hypot(dx, dy) > rad) continue;
        const l = (dx * lx + dy * ly) / rad;
        let c = base;
        if (l > 0.35 + G.bayer(x, y) * 0.2) c = hi;
        else if (l < -0.25 - G.bayer(x, y) * 0.2) c = lo;
        px.set(x, y, c);
      }
  };
  G.teardrop = function (px, cx, cy, r, tx, ty, col) {
    px.disc(cx, cy, r, col);
    px.poly([[cx - r * 0.95, cy - r * 0.15], [tx, ty], [cx + r * 0.95, cy - r * 0.15]], col);
  };
  G.speckle = function (px, X, Y, w, h, col, n, rnd) {
    for (let i = 0; i < n; i++) px.set(X + rnd.int(w), Y + rnd.int(h), col);
  };
  // Shade a filled rectangle like a box seen in 3/4: lighter top band, darker right/bottom edges.
  G.box3 = function (px, x, y, w, h, top, front, opts) {
    opts = opts || {};
    const th = opts.topH === undefined ? Math.min(4, Math.floor(h / 3)) : opts.topH;
    px.rect(x, y, w, th, top);
    px.rect(x, y + th, w, h - th, front);
    px.hline(x, x + w - 1, y, G.lighten(top, 0.25));
    px.hline(x, x + w - 1, y + th, G.darken(front, 0.25));
    px.vline(x + w - 1, y + th, y + h - 1, G.darken(front, 0.2));
    px.hline(x, x + w - 1, y + h - 1, G.darken(front, 0.35));
  };
  // wood grain fill
  G.woodFill = function (px, x, y, w, h, base, dark, light, seed) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const n = G.vnoise((x + i) / 9, (y + j) / 1.6, seed || 3);
        px.set(x + i, y + j, n > 0.66 ? light : n < 0.3 ? dark : base);
      }
  };

  // ---------------- sprite registry ----------------
  // G.defSprite(name, builder): builder returns a frame or an array of frames
  // (frames come from G.frame(px, ax, ay)). Optional fps for animation.
  const DEFS = {};
  const CACHE = {};
  G.defSprite = function (name, builder, fps) {
    DEFS[name] = { builder: builder, fps: fps || 6 };
    delete CACHE[name];
  };
  G.hasSprite = (name) => !!DEFS[name];
  G.spriteNames = () => Object.keys(DEFS);
  G.getSprite = function (name) {
    if (CACHE[name]) return CACHE[name];
    const d = DEFS[name];
    if (!d) return null;
    let fr = d.builder();
    if (!Array.isArray(fr)) fr = [fr];
    return (CACHE[name] = { frames: fr, fps: d.fps });
  };
  // draw sprite frame by time; x,y = anchor point
  // portraits: G.PORTRAITS[name] = (expr) => 42x42 canvas; give the function an `exprs` array
  G.PORTRAITS = G.PORTRAITS || {};
  // missing art is drawn as a labelled magenta box so it is easy to spot (and listed in G.missingArt)
  G.missingArt = {};
  G.drawMissing = function (ctx, name, x, y, label) {
    if (!G.missingArt[name]) { G.missingArt[name] = true; if (window.console) console.warn('missing art: ' + name); }
    ctx.fillStyle = 'rgba(255,0,200,0.55)'; ctx.fillRect(Math.round(x - 7), Math.round(y - 14), 14, 14);
    G.text(ctx, String(label || name).slice(0, 4), Math.round(x), Math.round(y - 11), { align: 'center', color: '#ffffff' });
  };
  G.drawSprite = function (ctx, name, x, y, t, flip, alpha) {
    const s = G.getSprite(name);
    if (!s) { if (name) G.drawMissing(ctx, name, x, y); return; }
    const f = s.frames.length > 1 ? s.frames[Math.floor((t || 0) * s.fps) % s.frames.length] : s.frames[0];
    G.drawFrame(ctx, f, x, y, flip, alpha);
  };

  // ---------------- characters ----------------
  // G.defChar(name, builder): builder returns {down:[3 frames], up:[3], left:[3], right?:[3]}
  // walk cycle is frames [0,1,0,2]. Extra poses can be added as named sprites.
  const CHARS = {};
  G.defChar = function (name, builder) { CHARS[name] = { builder: builder, cache: null }; };
  G.getChar = function (name) {
    const c = CHARS[name];
    if (!c) return null;
    if (!c.cache) c.cache = c.builder();
    return c.cache;
  };
  G.charNames = () => Object.keys(CHARS);
  // draw a character facing dir; moving -> walk cycle
  G.drawChar = function (ctx, name, x, y, dir, walkT, alpha) {
    const ch = G.getChar(name);
    if (!ch) { if (name) G.drawMissing(ctx, 'char:' + name, x, y, name); return; }
    const seq = [0, 1, 0, 2];
    const f = walkT === null || walkT === undefined ? 0 : seq[Math.floor(walkT * 8) % 4];
    let arr = ch[dir];
    let flip = false;
    if (!arr && dir === 'right') { arr = ch.left; flip = true; }
    if (!arr) arr = ch.down;
    G.drawFrame(ctx, arr[f] || arr[0], x, y, flip, alpha);
  };

  // Build a 3x(down/up/left) character from string rows like the kid sprites:
  // parts: {head:{down,up,left}, torso:{...}, legs:{down:[3], up:[3], left:[3]}} -- optional helper.
  G.stampChar = function (rowsList, pal, w, h, ax, ay) {
    const px = new G.PX(w + 2, h + 2);
    for (const rows of rowsList) if (rows) px.stamp(rows.rows || rows, pal, 1 + (rows.x || 0), 1 + (rows.y || 0));
    px.outline();
    return G.frame(px, ax + 1, ay + 1);
  };
})(window.G);
