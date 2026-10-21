// UI: dialogue box with typewriter text and portraits, chapter cards, menus.
(function (G) {
  'use strict';
  const W = G.W, H = G.H;
  const SPEAK = {
    kid: { color: '#f4efe6', speed: 48, blip: 560 },
    witch: { color: '#c890ff', speed: 20, blip: 170, shake: true },
    narr: { color: '#a9a2bb', speed: 40, blip: 360 },
    sign: { color: '#e8d2a0', speed: 60, blip: 420 },
    truck: { color: '#ff8a6a', speed: 60, blip: 300 },
  };

  const D = (G.Dialog = {
    lines: null, i: 0, chars: 0, t: 0, done: null, wait: 0,
    say(lines, done) {
      this.lines = lines.map((l) => (typeof l === 'string' ? { who: 'kid', text: l } : l));
      this.i = 0; this.chars = 0; this.t = 0; this.done = done || null; this.wait = 0.12;
      this.prep();
    },
    prep() {
      const l = this.lines[this.i];
      const hasFace = l.who === 'kid' && l.face !== 'none';
      this.wrapped = G.wrap(l.text, hasFace ? 340 : 380);
      this.total = this.wrapped.join('').length;
      if (l.sfx) G.Audio.sfx(l.sfx);
    },
    get active() { return !!this.lines; },
    update(dt, inp) {
      if (!this.lines) return;
      this.t += dt;
      if (this.wait > 0) { this.wait -= dt; return; }
      const l = this.lines[this.i];
      const sp = SPEAK[l.who] || SPEAK.kid;
      const before = Math.floor(this.chars);
      if (this.chars < this.total) {
        this.chars = Math.min(this.total, this.chars + dt * (l.speed || sp.speed));
        const now = Math.floor(this.chars);
        if (now !== before && now % 2 === 0) G.Audio.sfx('blip', sp.blip + (l.who === 'kid' ? Math.random() * 60 : 0), l.who);
      }
      if (inp.ok) {
        if (this.chars < this.total) this.chars = this.total;
        else {
          G.Audio.sfx('blip', 800);
          this.i++;
          this.chars = 0;
          this.t = 0;
          if (this.i >= this.lines.length) {
            const d = this.done;
            this.lines = null;
            if (d) d();
          } else this.prep();
        }
      }
    },
    draw(ctx) {
      if (!this.lines) return;
      const l = this.lines[this.i];
      const sp = SPEAK[l.who] || SPEAK.kid;
      const bx = 6, by = H - 62, bw = W - 12, bh = 56;
      ctx.fillStyle = '#07040c';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = l.who === 'witch' ? '#6a3aa0' : '#e8e2d6';
      ctx.fillRect(bx, by, bw, 1); ctx.fillRect(bx, by + bh - 1, bw, 1); ctx.fillRect(bx, by, 1, bh); ctx.fillRect(bx + bw - 1, by, 1, bh);
      ctx.fillStyle = '#2a2236';
      ctx.fillRect(bx + 2, by + 2, bw - 4, 1);
      const hasFace = l.who === 'kid' && l.face !== 'none';
      if (hasFace) {
        const p = G.KID.portrait(l.face || 'neutral');
        const px = bx + bw - 50, py = by + 6;
        ctx.fillStyle = '#16101f'; ctx.fillRect(px - 2, py - 2, 46, 46);
        ctx.drawImage(p, px, py + (l.face === 'pain' || l.face === 'scared' ? Math.round(Math.sin(this.t * 40)) : 0));
      }
      let shown = Math.floor(this.chars);
      const lx = bx + 12;
      let ly = by + 9;
      if (l.who === 'witch' || l.who === 'narr') ly += this.wrapped.length === 1 ? 12 : 6;
      for (const line of this.wrapped) {
        if (shown <= 0) break;
        const part = line.slice(0, shown);
        shown -= line.length;
        if (sp.shake) {
          let x = l.who === 'witch' ? Math.round(W / 2 - G.textWidth(line) / 2) : lx;
          for (let k = 0; k < part.length; k++) {
            const ch = part[k];
            const j = Math.random() < 0.3 ? 1 : 0;
            G.text(ctx, ch, x + (Math.random() < 0.5 ? -j : j), ly + (Math.random() < 0.5 ? -j : j), { color: sp.color, shadow: '#2a0a40' });
            x += G.textWidth(ch) + 1;
          }
        } else if (l.who === 'narr') {
          G.text(ctx, part, Math.round(W / 2 - G.textWidth(line) / 2), ly, { color: sp.color });
        } else G.text(ctx, part, lx, ly, { color: sp.color });
        ly += 12;
      }
      if (this.chars >= this.total && Math.floor(this.t * 3) % 2 === 0) {
        const ax = hasFace ? bx + bw - 60 : bx + bw - 12, ay = by + bh - 9;
        ctx.fillStyle = sp.color;
        ctx.fillRect(ax - 2, ay, 5, 1); ctx.fillRect(ax - 1, ay + 1, 3, 1); ctx.fillRect(ax, ay + 2, 1, 1);
      }
    },
  });

  // Chapter title card
  G.drawCard = function (ctx, t, small, big, total) {
    total = total || 2.6;
    const fin = G.clamp(t / 0.35, 0, 1), fout = G.clamp((total - t) / 0.45, 0, 1);
    const a = Math.min(fin, fout);
    if (a <= 0) return;
    ctx.globalAlpha = a * 0.75;
    ctx.fillStyle = '#07040c';
    ctx.fillRect(0, H / 2 - 30, W, 56);
    ctx.globalAlpha = a;
    const lw = Math.round(G.ease.out(fin) * 150);
    ctx.fillStyle = '#c890ff';
    ctx.fillRect(W / 2 - lw, H / 2 - 22, lw * 2, 1);
    ctx.fillRect(W / 2 - lw, H / 2 + 18, lw * 2, 1);
    G.text(ctx, small, W / 2, H / 2 - 17, { align: 'center', color: '#a9a2bb' });
    G.text(ctx, big, W / 2, H / 2 - 5, { align: 'center', color: '#ffffff', scale: 2, shadow: '#3a1460' });
    ctx.globalAlpha = 1;
  };

  // Simple vertical menu
  G.Menu = function (items) {
    this.items = items;
    this.i = 0;
  };
  G.Menu.prototype.update = function (inp) {
    const n = this.items.length;
    if (inp.up) { this.i = (this.i + n - 1) % n; G.Audio.sfx('blip', 700); }
    if (inp.down) { this.i = (this.i + 1) % n; G.Audio.sfx('blip', 700); }
    if (inp.ok) {
      const it = this.items[this.i];
      G.Audio.sfx('select');
      if (it.act) it.act();
    }
  };
  G.Menu.prototype.draw = function (ctx, x, y, t) {
    this.items.forEach((it, k) => {
      const sel = k === this.i;
      const label = typeof it.label === 'function' ? it.label() : it.label;
      G.text(ctx, label, x, y + k * 14, { align: 'center', color: sel ? '#ffffff' : '#8a8298', shadow: '#140c1c' });
      if (sel) {
        const w = G.textWidth(label);
        const bob = Math.floor(t * 4) % 2;
        G.text(ctx, '→', x - w / 2 - 10 - bob, y + k * 14, { color: '#c890ff' });
      }
    });
  };
})(window.G);
