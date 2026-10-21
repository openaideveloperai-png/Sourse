// Dialogue box (speakers, portraits, choices) and a simple vertical menu.
(function (G) {
  'use strict';
  const W = G.W, H = G.H;
  // Speakers are registered by content: G.SPEAKERS[id] = {name, color, blip, portrait(face) -> canvas}
  const NARR = { name: null, color: '#d8d2e2', blip: 360 };

  // the bitmap font is ASCII; normalize typographic characters
  G.clean = (s) => String(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/—|–/g, '-').replace(/…/g, '...');

  const D = (G.Dialog = {
    lines: null, i: 0, chars: 0, t: 0, done: null, choice: null,
    say(lines, done) {
      this.lines = lines.map((l) => (typeof l === 'string' ? { who: null, text: l } : l));
      this.i = 0; this.chars = 0; this.t = 0; this.done = done || null; this.choice = null; this.wait = 0.08;
      this.prep();
    },
    // ask: one line + options; cb(index)
    ask(line, options, cb, cancelIndex) {
      this.say([line], null);
      this.choice = { options: options.map(G.clean), sel: 0, cb: cb, cancel: cancelIndex };
    },
    sp(l) { return (l.who && G.SPEAKERS[l.who]) || NARR; },
    prep() {
      const l = this.lines[this.i];
      l.text = G.clean(l.text);
      this.shake = l.text[0] === '~';
      const txt = this.shake ? l.text.slice(1) : l.text;
      this.face = this.portraitFor(l);
      this.wrapped = G.wrap(txt, this.face ? 340 : 388);
      if (this.wrapped.length > 4) this.wrapped.length = 4;
      this.total = this.wrapped.join('').length;
      if (l.sfx) G.Audio.sfx(l.sfx);
    },
    portraitFor(l) {
      const s = this.sp(l);
      if (!s.portrait || l.face === 'none') return null;
      return s.portrait(l.face || 'neutral');
    },
    get active() { return !!this.lines; },
    update(dt, inp) {
      if (!this.lines) return;
      this.t += dt;
      if (this.wait > 0) { this.wait -= dt; return; }
      const l = this.lines[this.i];
      const sp = this.sp(l);
      const before = Math.floor(this.chars);
      if (this.chars < this.total) {
        this.chars = Math.min(this.total, this.chars + dt * (l.speed || sp.speed || 46));
        const now = Math.floor(this.chars);
        if (now !== before && now % 2 === 0) G.Audio.sfx('blip', (sp.blip || 420) + Math.random() * 30, sp.blipWave);
        if (inp.ok) this.chars = this.total;
        return;
      }
      if (this.choice) {
        const c = this.choice, n = c.options.length;
        if (inp.up) { c.sel = (c.sel + n - 1) % n; G.Audio.sfx('cursor'); }
        if (inp.down) { c.sel = (c.sel + 1) % n; G.Audio.sfx('cursor'); }
        if (inp.ok || (inp.back && c.cancel !== undefined)) {
          const pick = inp.ok ? c.sel : c.cancel;
          G.Audio.sfx('select');
          this.lines = null;
          this.choice = null;
          c.cb(pick);
        }
        return;
      }
      if (inp.ok) {
        G.Audio.sfx('cursor');
        this.i++;
        this.chars = 0;
        this.t = 0;
        if (this.i >= this.lines.length) {
          const d = this.done;
          this.lines = null;
          if (d) d();
        } else this.prep();
      }
    },
    draw(ctx) {
      if (!this.lines) return;
      const l = this.lines[this.i];
      const sp = this.sp(l);
      const bx = 6, bh = 58, by = H - bh - 6, bw = W - 12;
      ctx.fillStyle = 'rgba(6,3,10,0.94)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#d8d2e2';
      ctx.fillRect(bx, by, bw, 1); ctx.fillRect(bx, by + bh - 1, bw, 1); ctx.fillRect(bx, by, 1, bh); ctx.fillRect(bx + bw - 1, by, 1, bh);
      ctx.fillStyle = '#2a2236';
      ctx.fillRect(bx + 2, by + 2, bw - 4, 1);
      let tx = bx + 10;
      if (this.face) {
        ctx.fillStyle = '#140e1c'; ctx.fillRect(bx + 6, by + 7, 44, 44);
        ctx.drawImage(this.face, bx + 8, by + 9 + (this.shake ? Math.round(Math.sin(this.t * 40)) : 0));
        tx = bx + 58;
      }
      if (sp.name) {
        const nw = G.textWidth(sp.name) + 10;
        ctx.fillStyle = 'rgba(6,3,10,0.94)'; ctx.fillRect(bx + 4, by - 12, nw, 12);
        ctx.fillStyle = sp.color || '#ffffff'; ctx.fillRect(bx + 4, by - 12, nw, 1);
        G.text(ctx, sp.name, bx + 9, by - 10, { color: sp.color || '#ffffff', shadow: '#000' });
      }
      let shown = Math.floor(this.chars);
      let ly = by + 9;
      const col = l.who ? (sp.textColor || '#f2ecf6') : NARR.color;
      for (const line of this.wrapped) {
        if (shown <= 0) break;
        const part = line.slice(0, shown);
        shown -= line.length;
        if (this.shake) {
          let x = tx;
          for (const ch of part) {
            const j = Math.random() < 0.35 ? 1 : 0;
            G.text(ctx, ch, x + (Math.random() < 0.5 ? -j : j), ly + (Math.random() < 0.5 ? -j : j), { color: col, shadow: '#000' });
            x += G.textWidth(ch) + 1;
          }
        } else G.text(ctx, part, tx, ly, { color: col, shadow: '#000' });
        ly += 12;
      }
      if (this.chars >= this.total && !this.choice && Math.floor(this.t * 3) % 2 === 0) {
        const ax = bx + bw - 12, ay = by + bh - 9;
        ctx.fillStyle = '#d8d2e2';
        ctx.fillRect(ax - 2, ay, 5, 1); ctx.fillRect(ax - 1, ay + 1, 3, 1); ctx.fillRect(ax, ay + 2, 1, 1);
      }
      if (this.choice && this.chars >= this.total) {
        const c = this.choice;
        const cw = Math.max(70, ...c.options.map((o) => G.textWidth(o))) + 28, ch = c.options.length * 13 + 8;
        const cx = W - cw - 10, cy = by - ch - 4;
        ctx.fillStyle = 'rgba(6,3,10,0.95)'; ctx.fillRect(cx, cy, cw, ch);
        ctx.fillStyle = '#d8d2e2'; ctx.fillRect(cx, cy, cw, 1); ctx.fillRect(cx, cy + ch - 1, cw, 1); ctx.fillRect(cx, cy, 1, ch); ctx.fillRect(cx + cw - 1, cy, 1, ch);
        c.options.forEach((o, k) => {
          const sel = k === c.sel;
          if (sel) { ctx.fillStyle = '#3a2450'; ctx.fillRect(cx + 3, cy + 4 + k * 13, cw - 6, 12); }
          G.text(ctx, o, cx + 16, cy + 6 + k * 13, { color: sel ? '#ffffff' : '#8a8298', shadow: '#000' });
          if (sel) G.text(ctx, '→', cx + 6, cy + 6 + k * 13, { color: '#c890ff', shadow: '#000' });
        });
      }
    },
  });

  // vertical menu
  G.Menu = function (items) { this.items = items; this.i = 0; };
  G.Menu.prototype.update = function (inp) {
    const n = this.items.length;
    if (inp.up) { this.i = (this.i + n - 1) % n; G.Audio.sfx('cursor'); }
    if (inp.down) { this.i = (this.i + 1) % n; G.Audio.sfx('cursor'); }
    if (inp.ok) { const it = this.items[this.i]; G.Audio.sfx('select'); if (it.act) it.act(); }
  };
  G.Menu.prototype.draw = function (ctx, x, y, t, align) {
    this.items.forEach((it, k) => {
      const sel = k === this.i;
      const label = typeof it.label === 'function' ? it.label() : it.label;
      const opts = { align: align || 'center', color: it.disabled ? '#4a4458' : sel ? '#ffffff' : '#8a8298', shadow: '#000' };
      G.text(ctx, label, x, y + k * 14, opts);
      if (sel) {
        const w = align === 'left' ? 0 : G.textWidth(label) / 2;
        G.text(ctx, '→', x - w - 10 - (Math.floor(t * 4) % 2), y + k * 14, { color: '#c890ff', shadow: '#000' });
      }
    });
  };
})(window.G);
