// Effects: dithered lighting, particles, screen shake, and the
// Return-by-Death shadow hands overlay.
(function (G) {
  'use strict';
  const W = G.W, H = G.H;

  // ---------------- lighting ----------------
  // Light stamps are radial falloffs quantized into bands with ordered
  // dithering, so lights look like pixel art instead of smooth gradients.
  const stamps = {};
  function stamp(r, color) {
    r = Math.max(8, Math.round(r / 4) * 4);
    const key = r + (color || '');
    if (stamps[key]) return stamps[key];
    const size = r * 2;
    const px = new G.PX(size, size);
    const base = color ? G.rgba(G.C(color)) : [255, 255, 255];
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const d = Math.hypot(x + 0.5 - r, y + 0.5 - r) / r;
        if (d >= 1) continue;
        let a = Math.pow(1 - d, 1.3);
        const lv = Math.floor(a * 5 + G.bayer(x, y) * 0.999) / 5;
        if (lv <= 0) continue;
        px.d[y * size + x] = G.pack(base[0], base[1], base[2], Math.round(Math.min(1, lv) * 255));
      }
    return (stamps[key] = px.canvas());
  }
  const lc = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (lc) { lc.width = W; lc.height = H; }
  const lx = lc ? lc.getContext('2d') : null;

  G.Light = {
    // lights: [{x,y,r,col,i (0..1)}], coords in screen space
    draw(ctx, dark, tint, lights, t) {
      if (dark <= 0 && !tint) return;
      lx.globalCompositeOperation = 'source-over';
      lx.clearRect(0, 0, W, H);
      lx.fillStyle = tint || '#0a0618';
      lx.globalAlpha = 1;
      lx.fillRect(0, 0, W, H);
      lx.globalCompositeOperation = 'destination-out';
      for (const L of lights) {
        let r = L.r;
        if (L.flicker) r *= 1 + Math.sin(t * 13 + L.x) * 0.04 + Math.sin(t * 7.3 + L.y) * 0.03;
        lx.globalAlpha = L.i === undefined ? 1 : L.i;
        const s = stamp(r);
        lx.drawImage(s, Math.round(L.x - s.width / 2), Math.round(L.y - s.height / 2));
      }
      lx.globalAlpha = 1;
      ctx.globalAlpha = dark;
      ctx.drawImage(lc, 0, 0);
      ctx.globalAlpha = 1;
      // colored glow on top
      ctx.globalCompositeOperation = 'lighter';
      for (const L of lights) {
        if (!L.col) continue;
        const s = stamp(L.r * 0.7, L.col);
        ctx.globalAlpha = (L.glow === undefined ? 0.22 : L.glow) * (L.i === undefined ? 1 : L.i);
        ctx.drawImage(s, Math.round(L.x - s.width / 2), Math.round(L.y - s.height / 2));
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },
    stamp: stamp,
  };

  // ---------------- particles ----------------
  const parts = [];
  G.FX = {
    parts: parts,
    add(p) {
      p.t = 0;
      p.vx = p.vx || 0; p.vy = p.vy || 0; p.g = p.g || 0; p.drag = p.drag === undefined ? 0 : p.drag;
      p.size = p.size || 1;
      parts.push(p);
      if (parts.length > 900) parts.shift();
      return p;
    },
    clear() { parts.length = 0; },
    update(dt) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.t += dt;
        if (p.t >= p.life) { parts.splice(i, 1); continue; }
        p.vy += p.g * dt;
        if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.floor !== undefined && p.y > p.floor) { p.y = p.floor; p.vy *= -0.35; p.vx *= 0.6; }
      }
    },
    draw(ctx, ox, oy, layer) {
      for (const p of parts) {
        if ((p.layer || 0) !== (layer || 0)) continue;
        const u = p.t / p.life;
        const col = Array.isArray(p.col) ? p.col[Math.min(p.col.length - 1, Math.floor(u * p.col.length))] : p.col;
        let s = p.size;
        if (p.shrink) s = Math.max(1, Math.round(p.size * (1 - u)));
        if (p.glow) ctx.globalCompositeOperation = 'lighter';
        if (p.fade) ctx.globalAlpha = 1 - u;
        if (p.frame) G.drawFrame(ctx, p.frame, ox + p.x, oy + p.y);
        else {
          ctx.fillStyle = col;
          ctx.fillRect(Math.round(ox + p.x - s / 2), Math.round(oy + p.y - s / 2), s, s);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    },
    // ---- emitters ----
    dust(x, y, n, col) {
      for (let i = 0; i < (n || 6); i++)
        this.add({ x: x + (Math.random() - 0.5) * 8, y: y, vx: (Math.random() - 0.5) * 40, vy: -Math.random() * 25, drag: 4, life: 0.4 + Math.random() * 0.3, col: col || ['#d8cbb0', '#a89a80', '#7a6e5c'], size: 2, shrink: true });
    },
    burst(x, y, n, cols, speed, opts) {
      opts = opts || {};
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = (0.3 + Math.random() * 0.7) * speed;
        this.add(Object.assign({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (opts.up || 0), g: opts.g || 0, drag: opts.drag || 2, life: (opts.life || 0.5) * (0.6 + Math.random() * 0.6), col: cols, size: opts.size || 1, shrink: opts.shrink, glow: opts.glow, floor: opts.floor, layer: opts.layer }, {}));
      }
    },
    blood(x, y, dirx, n) {
      for (let i = 0; i < (n || 14); i++)
        this.add({ x: x, y: y, vx: dirx * (30 + Math.random() * 80) + (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 70, g: 260, drag: 1, life: 0.6 + Math.random() * 0.4, col: ['#e03a3a', '#b02828', '#7a1a20'], size: Math.random() < 0.3 ? 2 : 1, floor: y + 4 + Math.random() * 6 });
    },
    sparkle(x, y, col, n) {
      for (let i = 0; i < (n || 8); i++) {
        const a = (i / (n || 8)) * Math.PI * 2;
        this.add({ x: x, y: y, vx: Math.cos(a) * 50, vy: Math.sin(a) * 50, drag: 5, life: 0.5, col: col || ['#ffffff', '#9ff2ff', '#3ac8e8'], size: 2, shrink: true, glow: true, layer: 1 });
      }
    },
    ash(x, y, n) {
      for (let i = 0; i < (n || 20); i++)
        this.add({ x: x + (Math.random() - 0.5) * 10, y: y - Math.random() * 18, vx: (Math.random() - 0.5) * 20, vy: -10 - Math.random() * 30, drag: 1, life: 0.8 + Math.random() * 0.8, col: ['#3a3038', '#5a5058', '#8a8088'], size: Math.random() < 0.5 ? 2 : 1, fade: true });
    },
    embers(x, y, n) {
      for (let i = 0; i < (n || 10); i++)
        this.add({ x: x + (Math.random() - 0.5) * 10, y: y - Math.random() * 10, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 40, drag: 1.5, life: 0.5 + Math.random() * 0.6, col: ['#fff3a0', '#ffb13b', '#ff6a1f', '#a02810'], size: 1, glow: true, layer: 1 });
    },
  };

  // ---------------- shake / flash ----------------
  G.Shake = {
    t: 0, amt: 0,
    add(amt, time) { this.amt = Math.max(this.amt, amt); this.t = Math.max(this.t, time); },
    update(dt) { this.t = Math.max(0, this.t - dt); if (this.t === 0) this.amt = 0; },
    offset() { if (this.t <= 0) return [0, 0]; return [Math.round((Math.random() - 0.5) * 2 * this.amt), Math.round((Math.random() - 0.5) * 2 * this.amt)]; },
  };

  // ---------------- Return by Death hands ----------------
  // Precomputed frames (progress 0..1) of shadow hands reaching in from the edges.
  const handFrames = [];
  const NHF = 24;
  function buildHands() {
    const rnd = G.rng(4242);
    const arms = [];
    const n = 18;
    for (let i = 0; i < n; i++) {
      const side = i % 4;
      let x, y;
      const u = (Math.floor(i / 4) + rnd()) / Math.ceil(n / 4);
      if (side === 0) { x = u * W; y = -6; }
      if (side === 1) { x = W + 6; y = u * H; }
      if (side === 2) { x = (1 - u) * W; y = H + 6; }
      if (side === 3) { x = -6; y = (1 - u) * H; }
      const tx = W / 2 + (rnd() - 0.5) * 120, ty = H / 2 + (rnd() - 0.5) * 70;
      arms.push({ x, y, tx, ty, wob: rnd() * 6, len: 0.55 + rnd() * 0.4, w: 3 + rnd() * 2.5 });
    }
    const core = G.C('#07020c'), rim = G.C('#3a1460');
    for (let f = 0; f < NHF; f++) {
      const p = f / (NHF - 1);
      const px = new G.PX(W, H);
      for (const a of arms) {
        const reach = G.ease.out(G.clamp(p * 1.25 - (1 - a.len) * 0.3, 0, 1)) * a.len;
        if (reach <= 0) continue;
        const dx = a.tx - a.x, dy = a.ty - a.y;
        const L = Math.hypot(dx, dy) * reach;
        const nx = dx / Math.hypot(dx, dy), ny = dy / Math.hypot(dx, dy);
        const steps = Math.max(2, Math.floor(L / 3));
        let lxp = a.x, lyp = a.y;
        for (let k = 1; k <= steps; k++) {
          const s = (k / steps) * L;
          const wob = Math.sin(s / 14 + a.wob) * 6;
          const x = a.x + nx * s - ny * wob, y = a.y + ny * s + nx * wob;
          const w = a.w * (1 - (k / steps) * 0.45) + 1;
          px.thick(lxp, lyp, x, y, w, core);
          lxp = x; lyp = y;
        }
        // hand at the tip: palm + fingers spreading toward the center
        const hx = lxp, hy = lyp;
        px.disc(hx, hy, a.w + 1.5, core);
        const ang = Math.atan2(ny, nx);
        for (let k = -2; k <= 2; k++) {
          const fa = ang + k * 0.38;
          const fl = 7 + (k === 0 ? 2 : 0) - Math.abs(k);
          px.thick(hx, hy, hx + Math.cos(fa) * fl, hy + Math.sin(fa) * fl, 0.9, core);
        }
      }
      px.outline(rim);
      handFrames.push(px.canvas());
    }
  }
  G.drawHands = function (ctx, p) {
    if (!handFrames.length) buildHands();
    const f = Math.round(G.clamp(p, 0, 1) * (NHF - 1));
    ctx.drawImage(handFrames[f], 0, 0);
  };

  // desaturate the whole screen (used while dying)
  G.desaturate = function (ctx, amt) {
    if (amt <= 0) return;
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = G.clamp(amt, 0, 1);
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  };
  // pixel vignette
  let vig = null;
  G.vignette = function (ctx, strength) {
    if (!vig) {
      const px = new G.PX(W, H);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2);
          const d = Math.sqrt(dx * dx * 0.8 + dy * dy);
          const a = G.clamp((d - 0.75) / 0.5, 0, 1);
          const lv = Math.floor(a * 4 + G.bayer(x, y) * 0.999) / 4;
          if (lv > 0) px.d[y * W + x] = G.pack(8, 4, 16, Math.round(lv * 200));
        }
      vig = px.canvas();
    }
    ctx.globalAlpha = strength;
    ctx.drawImage(vig, 0, 0);
    ctx.globalAlpha = 1;
  };
})(window.G);
