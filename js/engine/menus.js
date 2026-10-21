// Overlay screens: pause menu with items/notes, note reader, picture viewer,
// jump scares, puzzle screens, game over, endings, save/load.
(function (G) {
  'use strict';
  const W = G.W, H = G.H;
  const UI = (G.UI = { stack: [] });
  Object.defineProperty(UI, 'active', { get() { return this.stack.length > 0; } });
  UI.push = function (panel) { this.stack.push(panel); return panel; };
  UI.pop = function () { const p = this.stack.pop(); return p; };
  UI.update = function (dt, inp) { const p = this.stack[this.stack.length - 1]; if (p) p.update(dt, inp); };
  UI.draw = function (ctx) { for (const p of this.stack) p.draw(ctx); };

  // ---------------- drawing helpers ----------------
  function panel(ctx, x, y, w, h, border) {
    ctx.fillStyle = 'rgba(6,3,10,0.95)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = border || '#d8d2e2';
    ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
    ctx.fillStyle = '#2a2236';
    ctx.fillRect(x + 2, y + 2, w - 4, 1);
  }
  G.panel = panel;
  function itemIcon(ctx, id, x, y) {
    const it = G.ITEMS[id];
    const name = (it && it.icon) || 'icon_' + id;
    if (G.hasSprite(name)) G.drawSprite(ctx, name, x + 8, y + 16, 0);
    else { ctx.fillStyle = '#5a4e6a'; ctx.fillRect(x + 3, y + 3, 10, 10); ctx.fillStyle = '#8a7ea0'; ctx.fillRect(x + 3, y + 3, 10, 1); }
  }

  // ---------------- pause menu: items / notes / system ----------------
  UI.openMenu = function () {
    G.Audio.sfx('menu');
    const tabs = ['ITEMS', 'NOTES', 'SYSTEM'];
    const p = {
      tab: 0, sel: 0, t: 0,
      list() {
        if (this.tab === 0) return G.S.items.filter((id) => !(G.ITEMS[id] && G.ITEMS[id].note));
        if (this.tab === 1) return G.S.notes.slice();
        return ['sound', 'full', 'title'];
      },
      update(dt, inp) {
        this.t += dt;
        const L = this.list();
        if (inp.left) { this.tab = (this.tab + 2) % 3; this.sel = 0; G.Audio.sfx('cursor'); }
        if (inp.right) { this.tab = (this.tab + 1) % 3; this.sel = 0; G.Audio.sfx('cursor'); }
        if (inp.up && L.length) { this.sel = (this.sel + L.length - 1) % L.length; G.Audio.sfx('cursor'); }
        if (inp.down && L.length) { this.sel = (this.sel + 1) % L.length; G.Audio.sfx('cursor'); }
        if (inp.back || inp.menu) { UI.pop(); G.Audio.sfx('cancel'); return; }
        if (inp.ok && L.length) {
          const id = L[this.sel];
          if (this.tab === 2) {
            G.Audio.sfx('select');
            if (id === 'sound') G.Audio.toggleMute();
            if (id === 'full') G.toggleFull();
            if (id === 'title') { UI.stack = []; G.EV.clear(); G.Dialog.lines = null; G.Chase.active = null; G.fadeTo(() => new G.Title()); }
            return;
          }
          const it = G.ITEMS[id];
          G.Audio.sfx('select');
          if (it && it.note) { UI.openNote(it, () => {}); return; }
          if (it && it.use) { UI.pop(); G.EV.run(it.use); return; }
          UI.pop();
          G.EV.run(function* (E) { yield* E.say('@ ' + (it ? it.desc : id)); });
        }
      },
      draw(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);
        panel(ctx, 12, 10, W - 24, H - 20);
        tabs.forEach((t, k) => {
          const x = 30 + k * 70;
          if (k === this.tab) { ctx.fillStyle = '#3a2450'; ctx.fillRect(x - 6, 16, G.textWidth(t) + 12, 13); }
          G.text(ctx, t, x, 19, { color: k === this.tab ? '#ffffff' : '#8a8298', shadow: '#000' });
        });
        G.text(ctx, '← → tabs   Z select   X close', W - 26, 19, { align: 'right', color: '#5a5466', shadow: '#000' });
        ctx.fillStyle = '#2a2236'; ctx.fillRect(18, 32, W - 36, 1);
        const L = this.list();
        if (!L.length) { G.text(ctx, this.tab === 0 ? 'You have nothing.' : 'No notes yet.', 30, 46, { color: '#5a5466' }); }
        const visible = 13;
        const start = Math.max(0, Math.min(this.sel - 6, L.length - visible));
        L.slice(start, start + visible).forEach((id, k) => {
          const i = k + start, y = 38 + k * 14;
          const sel = i === this.sel;
          if (sel) { ctx.fillStyle = '#2e1e40'; ctx.fillRect(20, y - 1, 170, 14); }
          let label;
          if (this.tab === 2) label = id === 'sound' ? 'Sound: ' + (G.Audio.muted ? 'OFF' : 'ON') : id === 'full' ? 'Fullscreen' : 'Quit to title';
          else { label = G.ITEMS[id] ? G.ITEMS[id].name : id; itemIcon(ctx, id, 22, y - 3); }
          G.text(ctx, label, this.tab === 2 ? 30 : 42, y + 2, { color: sel ? '#ffffff' : '#a8a0b8', shadow: '#000' });
        });
        if (this.tab < 2 && L.length) {
          const it = G.ITEMS[L[this.sel]];
          ctx.fillStyle = '#140e1c'; ctx.fillRect(200, 38, W - 226, H - 66);
          if (it) {
            const name = (it.icon) || 'icon_' + L[this.sel];
            if (G.hasSprite(name)) {
              const s = G.getSprite(name).frames[0];
              ctx.drawImage(s.c, Math.round(200 + (W - 226) / 2 - s.w), 48, s.w * 2, s.h * 2);
            }
            G.text(ctx, it.name, 210, 92, { color: '#ffffff', shadow: '#000' });
            G.wrap(G.clean(it.desc || ''), W - 246).slice(0, 8).forEach((ln, k) => G.text(ctx, ln, 210, 108 + k * 12, { color: '#b8b0c8', shadow: '#000' }));
            if (it.note) G.text(ctx, 'Z: read', 210, H - 40, { color: '#c890ff', shadow: '#000' });
            else if (it.use) G.text(ctx, 'Z: use', 210, H - 40, { color: '#c890ff', shadow: '#000' });
          }
        }
        G.text(ctx, 'Time ' + G.fmtTime(G.S.time) + (G.S.chapter ? '   ' + G.S.chapter : ''), 26, H - 24, { color: '#5a5466', shadow: '#000' });
        if (G.S.flags['@goal']) G.text(ctx, G.clean(G.S.flags['@goal']), W - 26, H - 24, { align: 'right', color: '#a890c0', shadow: '#000' });
      },
    };
    UI.push(p);
  };

  // ---------------- note reader ----------------
  UI.openNote = function (it, done) {
    G.Audio.sfx('paper');
    const pages = [];
    const maxW = W - 120;
    for (const pg of [].concat(it.pages || it.text || it.desc || '')) {
      const lines = [];
      for (const para of G.clean(pg).split('\n')) { const w = G.wrap(para, maxW); if (!w.length) lines.push(''); else lines.push(...w); }
      for (let i = 0; i < lines.length; i += 14) pages.push(lines.slice(i, i + 14));
    }
    UI.push({
      page: 0, t: 0,
      update(dt, inp) {
        this.t += dt;
        if (inp.left && this.page > 0) { this.page--; G.Audio.sfx('paper'); }
        else if ((inp.right || inp.ok) && this.page < pages.length - 1) { this.page++; G.Audio.sfx('paper'); }
        else if (inp.ok || inp.back) { UI.pop(); done(); }
      },
      draw(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
        const x = 50, y = 10, w = W - 100, h = H - 20;
        ctx.fillStyle = it.paper || '#d8ccae'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(90,60,30,0.25)'; ctx.fillRect(x, y, w, 3); ctx.fillRect(x, y + h - 3, w, 3); ctx.fillRect(x, y, 3, h); ctx.fillRect(x + w - 3, y, 3, h);
        for (let k = 0; k < 14; k++) { ctx.fillStyle = 'rgba(90,60,30,0.12)'; ctx.fillRect(x + 8, y + 34 + k * 13, w - 16, 1); }
        G.text(ctx, G.clean(it.name), x + w / 2, y + 10, { align: 'center', color: '#3a2214', shadow: false });
        (pages[this.page] || []).forEach((ln, k) => G.text(ctx, ln, x + 12, y + 24 + k * 13, { color: it.ink || '#2a1a12', shadow: false }));
        if (pages.length > 1) G.text(ctx, this.page + 1 + '/' + pages.length, x + w - 10, y + h - 13, { align: 'right', color: '#6a4a30', shadow: false });
      },
    });
  };

  // ---------------- picture viewer ----------------
  UI.openPicture = function (name, opts, done) {
    UI.push({
      t: 0,
      update(dt, inp) { this.t += dt; if (this.t > 0.3 && (inp.ok || inp.back)) { UI.pop(); done(); } },
      draw(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, W, H);
        const s = G.getSprite(name);
        if (s) {
          const f = s.frames[Math.floor(this.t * s.fps) % s.frames.length];
          const sc = opts.scale || Math.max(1, Math.floor(Math.min((W - 40) / f.w, (H - 50) / f.h)));
          ctx.drawImage(f.c, Math.round(W / 2 - (f.w * sc) / 2), Math.round(H / 2 - (f.h * sc) / 2 - 8), f.w * sc, f.h * sc);
        }
        if (opts.caption) G.text(ctx, G.clean(opts.caption), W / 2, H - 22, { align: 'center', color: '#d8d2e2', shadow: '#000' });
      },
    });
  };

  // ---------------- jump scare ----------------
  UI.openScare = function (name, opts, done) {
    G.Audio.sfx(opts.sfx || 'scare');
    G.Shake.add(6, 0.5);
    const dur = opts.time || 0.9;
    UI.push({
      t: 0,
      update(dt) { this.t += dt; if (this.t > dur) { UI.pop(); done(); } },
      draw(ctx) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        const sprite = G.hasSprite('scare_' + name) ? 'scare_' + name : name;
        const s = G.getSprite(sprite);
        const k = G.ease.out(Math.min(1, this.t / 0.25));
        if (s) {
          const f = s.frames[Math.floor(this.t * 12) % s.frames.length];
          const base = Math.min(W / f.w, H / f.h);
          const sc = base * (0.6 + k * 0.55);
          const [jx, jy] = G.Shake.offset();
          ctx.drawImage(f.c, Math.round(W / 2 - (f.w * sc) / 2 + jx), Math.round(H / 2 - (f.h * sc) / 2 + jy), Math.round(f.w * sc), Math.round(f.h * sc));
        } else if (G.getChar(name)) {
          const ch = G.getChar(name).down[0];
          const sc = 6 + k * 3;
          ctx.drawImage(ch.c, Math.round(W / 2 - (ch.w * sc) / 2), Math.round(H / 2 - (ch.h * sc) / 2), ch.w * sc, ch.h * sc);
        }
        ctx.globalAlpha = Math.max(0, 0.5 - this.t);
        ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      },
    });
  };

  // ---------------- puzzles ----------------
  const PZ = {};
  UI.openPuzzle = function (kind, opts, done) {
    const fin = (v) => { UI.pop(); done(v); };
    const panelObj = PZ[kind](opts || {}, fin);
    panelObj.kind = kind;
    panelObj._done = fin; // lets automated tests answer puzzles directly
    UI.push(panelObj);
  };

  // digit / letter combination lock
  PZ.code = function (o, done) {
    const chars = o.chars || '0123456789';
    const len = o.len || 4;
    const vals = new Array(len).fill(0);
    return {
      cur: 0, t: 0,
      update(dt, inp) {
        this.t += dt;
        if (inp.left) { this.cur = (this.cur + len - 1) % len; G.Audio.sfx('cursor'); }
        if (inp.right) { this.cur = (this.cur + 1) % len; G.Audio.sfx('cursor'); }
        if (inp.up) { vals[this.cur] = (vals[this.cur] + 1) % chars.length; G.Audio.sfx('dial'); }
        if (inp.down) { vals[this.cur] = (vals[this.cur] + chars.length - 1) % chars.length; G.Audio.sfx('dial'); }
        if (inp.ok) done(vals.map((v) => chars[v]).join(''));
        if (inp.back) done(null);
      },
      draw(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);
        const bw = len * 26 + 40, bx = W / 2 - bw / 2, by = 60;
        panel(ctx, bx, by, bw, 110, '#a89070');
        G.text(ctx, G.clean(o.title || 'Enter the code'), W / 2, by + 10, { align: 'center', color: '#e8d8b8', shadow: '#000' });
        for (let i = 0; i < len; i++) {
          const x = bx + 20 + i * 26, y = by + 34;
          ctx.fillStyle = '#2a2018'; ctx.fillRect(x, y, 20, 30);
          ctx.fillStyle = i === this.cur ? '#c8a060' : '#5a4630'; ctx.fillRect(x, y, 20, 1); ctx.fillRect(x, y + 29, 20, 1); ctx.fillRect(x, y, 1, 30); ctx.fillRect(x + 19, y, 1, 30);
          G.text(ctx, chars[vals[i]], x + 10, y + 11, { align: 'center', color: '#f0e0c0', shadow: '#000', scale: 1 });
          if (i === this.cur) { G.text(ctx, '↑', x + 10, y - 10, { align: 'center', color: '#c8a060' }); G.text(ctx, '↓', x + 10, y + 32, { align: 'center', color: '#c8a060' }); }
        }
        if (o.hint) G.text(ctx, G.clean(o.hint), W / 2, by + 82, { align: 'center', color: '#8a7a68', shadow: '#000' });
        G.text(ctx, 'Arrows change   Z confirm   X back', W / 2, by + 96, { align: 'center', color: '#5a5466', shadow: '#000' });
      },
    };
  };

  // piano: returns the sequence of key names played
  PZ.piano = function (o, done) {
    const keys = o.keys || ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2'];
    const freqs = [261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 493.9, 523.3, 587.3, 659.3];
    const seq = [];
    return {
      cur: 0, t: 0, pressed: -1, pt: 0,
      update(dt, inp) {
        this.t += dt; this.pt -= dt;
        if (inp.left) { this.cur = (this.cur + keys.length - 1) % keys.length; }
        if (inp.right) { this.cur = (this.cur + 1) % keys.length; }
        if (inp.ok) {
          seq.push(keys[this.cur]);
          G.Audio.note(freqs[this.cur] || 440, o.out ? 'detuned' : 'piano');
          this.pressed = this.cur; this.pt = 0.18;
          if (o.max && seq.length >= o.max) { const s = seq.slice(); setTimeout(() => {}, 0); done(s); }
        }
        if (inp.back) done(seq.slice());
      },
      draw(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(0, 0, W, H);
        const kw = 22, total = keys.length * kw, x0 = W / 2 - total / 2, y0 = 70;
        panel(ctx, x0 - 16, y0 - 34, total + 32, 140, '#a89070');
        G.text(ctx, G.clean(o.title || 'The piano'), W / 2, y0 - 26, { align: 'center', color: '#e8d8b8', shadow: '#000' });
        keys.forEach((k, i) => {
          const x = x0 + i * kw;
          const down = this.pressed === i && this.pt > 0;
          ctx.fillStyle = down ? '#c8b8a0' : '#f0e8dc'; ctx.fillRect(x, y0 + (down ? 2 : 0), kw - 2, 62);
          ctx.fillStyle = '#7a6a5a'; ctx.fillRect(x + kw - 2, y0, 2, 62);
          if (i === this.cur) { ctx.fillStyle = '#c890ff'; ctx.fillRect(x + 2, y0 + 54, kw - 6, 3); }
          G.text(ctx, k.replace('2', ''), x + kw / 2 - 1, y0 + 44, { align: 'center', color: '#3a2a20', shadow: false });
          if (i < keys.length - 1 && [0, 1, 3, 4, 5].includes(i % 7)) { ctx.fillStyle = '#1a1418'; ctx.fillRect(x + kw - 7, y0, 10, 36); }
        });
        G.text(ctx, seq.slice(-10).map((s) => s.replace('2', "'")).join(' '), W / 2, y0 + 72, { align: 'center', color: '#e8d8b8', shadow: '#000' });
        G.text(ctx, '←→ choose   Z play   X stop playing', W / 2, y0 + 88, { align: 'center', color: '#5a5466', shadow: '#000' });
      },
    };
  };

  // sliding tile puzzle over a sprite (n x n)
  PZ.slider = function (o, done) {
    const n = o.n || 3;
    const s = G.getSprite(o.sprite);
    const img = s ? s.frames[0] : null;
    const tiles = [];
    for (let i = 0; i < n * n; i++) tiles.push(i);
    let blank = n * n - 1;
    const rnd = G.rng(o.seed || 7);
    const mv = (dx, dy) => {
      const bx = blank % n, by = Math.floor(blank / n);
      const tx = bx + dx, ty = by + dy;
      if (tx < 0 || ty < 0 || tx >= n || ty >= n) return false;
      const t = ty * n + tx;
      [tiles[blank], tiles[t]] = [tiles[t], tiles[blank]];
      blank = t;
      return true;
    };
    for (let i = 0; i < (o.shuffle || 80); i++) { const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][rnd.int(4)]; mv(d[0], d[1]); }
    const solved = () => tiles.every((v, i) => v === i);
    if (solved()) mv(-1, 0);
    return {
      t: 0, win: 0,
      update(dt, inp) {
        this.t += dt;
        if (this.win) { this.win += dt; if (this.win > 0.8) done(true); return; }
        let m = false;
        if (inp.left) m = mv(1, 0); else if (inp.right) m = mv(-1, 0); else if (inp.up) m = mv(0, 1); else if (inp.down) m = mv(0, -1);
        if (m) { G.Audio.sfx('slide'); if (solved()) { this.win = 0.01; G.Audio.sfx('solve'); } }
        if (inp.back) done(false);
      },
      draw(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, W, H);
        const cell = Math.floor(150 / n), sz = cell * n, x0 = W / 2 - sz / 2, y0 = 36;
        panel(ctx, x0 - 8, y0 - 22, sz + 16, sz + 50, '#a89070');
        G.text(ctx, G.clean(o.title || 'Slide the pieces'), W / 2, y0 - 16, { align: 'center', color: '#e8d8b8', shadow: '#000' });
        for (let i = 0; i < n * n; i++) {
          const v = tiles[i];
          const x = x0 + (i % n) * cell, y = y0 + Math.floor(i / n) * cell;
          if (i === blank && !this.win) { ctx.fillStyle = '#100a14'; ctx.fillRect(x, y, cell - 1, cell - 1); continue; }
          if (img) {
            const sw = img.w / n, sh = img.h / n;
            ctx.drawImage(img.c, (v % n) * sw, Math.floor(v / n) * sh, sw, sh, x, y, cell - 1, cell - 1);
          } else { ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x, y, cell - 1, cell - 1); G.text(ctx, String(v + 1), x + cell / 2, y + cell / 2 - 4, { align: 'center' }); }
        }
        G.text(ctx, 'Arrows slide   X give up', W / 2, y0 + sz + 10, { align: 'center', color: '#5a5466', shadow: '#000' });
      },
    };
  };

  // clock hands
  PZ.clock = function (o, done) {
    let h = o.h || 12, m = o.m || 0;
    return {
      hand: 0, t: 0,
      update(dt, inp) {
        this.t += dt;
        if (inp.left || inp.right) { this.hand = 1 - this.hand; G.Audio.sfx('cursor'); }
        const d = inp.up ? 1 : inp.down ? -1 : 0;
        if (d) {
          G.Audio.sfx('tick');
          if (this.hand === 0) h = ((h - 1 + d + 12) % 12) + 1;
          else m = (m + d * 5 + 60) % 60;
        }
        if (inp.ok) done({ h: h, m: m });
        if (inp.back) done(null);
      },
      draw(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = 104, R = 52;
        panel(ctx, cx - 80, cy - 84, 160, 172, '#a89070');
        G.text(ctx, G.clean(o.title || 'Set the clock'), cx, cy - 76, { align: 'center', color: '#e8d8b8', shadow: '#000' });
        ctx.fillStyle = '#e8dcc4'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
        ctx.fillStyle = '#5a4630';
        for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; G.text(ctx, String(i), cx + Math.cos(a) * (R - 9), cy + Math.sin(a) * (R - 9) - 4, { align: 'center', color: '#3a2a1a', shadow: false }); }
        const hand = (a, len, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); ctx.stroke(); };
        hand(((h % 12) / 12 + m / 720) * Math.PI * 2 - Math.PI / 2, R * 0.5, this.hand === 0 ? '#a02020' : '#2a1a10', 3);
        hand((m / 60) * Math.PI * 2 - Math.PI / 2, R * 0.8, this.hand === 1 ? '#a02020' : '#2a1a10', 2);
        G.text(ctx, (this.hand === 0 ? 'HOUR' : 'MINUTE') + ' hand   ←→ switch  ↑↓ turn  Z set', cx, cy + R + 10, { align: 'center', color: '#8a7a68', shadow: '#000' });
      },
    };
  };

  // reorder a list: returns array of indices in the chosen order
  PZ.order = function (o, done) {
    const items = o.items.map((s, i) => ({ s: G.clean(s), i: i }));
    return {
      cur: 0, held: -1,
      update(dt, inp) {
        const n = items.length + 1;
        if (inp.up) { const nc = (this.cur + n - 1) % n; if (this.held >= 0 && nc < items.length && this.cur < items.length) { [items[this.cur], items[nc]] = [items[nc], items[this.cur]]; } this.cur = nc; G.Audio.sfx('cursor'); }
        if (inp.down) { const nc = (this.cur + 1) % n; if (this.held >= 0 && nc < items.length && this.cur < items.length) { [items[this.cur], items[nc]] = [items[nc], items[this.cur]]; } this.cur = nc; G.Audio.sfx('cursor'); }
        if (inp.ok) {
          if (this.cur === items.length) done(items.map((x) => x.i));
          else { this.held = this.held >= 0 ? -1 : this.cur; G.Audio.sfx('select'); }
        }
        if (inp.back) done(null);
      },
      draw(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, W, H);
        const bw = 220, bh = items.length * 14 + 52, bx = W / 2 - bw / 2, by = 40;
        panel(ctx, bx, by, bw, bh, '#a89070');
        G.text(ctx, G.clean(o.title || 'Put them in order'), W / 2, by + 8, { align: 'center', color: '#e8d8b8', shadow: '#000' });
        items.forEach((it, k) => {
          const sel = k === this.cur;
          if (sel) { ctx.fillStyle = this.held >= 0 ? '#5a2a40' : '#2e1e40'; ctx.fillRect(bx + 6, by + 22 + k * 14, bw - 12, 13); }
          G.text(ctx, k + 1 + '. ' + it.s, bx + 14, by + 24 + k * 14, { color: sel ? '#ffffff' : '#b8b0c8', shadow: '#000' });
        });
        const dy = by + 26 + items.length * 14;
        G.text(ctx, 'Done', W / 2, dy, { align: 'center', color: this.cur === items.length ? '#ffffff' : '#8a8298', shadow: '#000' });
        G.text(ctx, 'Z pick up / put down   X back', W / 2, by + bh + 4, { align: 'center', color: '#5a5466', shadow: '#000' });
      },
    };
  };

  // choose an item from the inventory
  PZ.pickItem = function (o, done) {
    const L = G.S.items.filter((id) => !(G.ITEMS[id] && G.ITEMS[id].note));
    return {
      sel: 0,
      update(dt, inp) {
        if (inp.up && L.length) this.sel = (this.sel + L.length - 1) % L.length;
        if (inp.down && L.length) this.sel = (this.sel + 1) % L.length;
        if (inp.ok && L.length) done(L[this.sel]);
        if (inp.back || (inp.ok && !L.length)) done(null);
      },
      draw(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
        const bh = Math.max(1, L.length) * 14 + 30;
        panel(ctx, W / 2 - 100, 30, 200, bh);
        G.text(ctx, G.clean(o.prompt || 'Use which item?'), W / 2, 37, { align: 'center', color: '#e8e0f0', shadow: '#000' });
        if (!L.length) G.text(ctx, 'Nothing to use.', W / 2, 54, { align: 'center', color: '#5a5466' });
        L.forEach((id, k) => {
          const sel = k === this.sel;
          if (sel) { ctx.fillStyle = '#2e1e40'; ctx.fillRect(W / 2 - 94, 51 + k * 14, 188, 13); }
          itemIcon(ctx, id, W / 2 - 92, 50 + k * 14);
          G.text(ctx, G.ITEMS[id] ? G.ITEMS[id].name : id, W / 2 - 72, 53 + k * 14, { color: sel ? '#ffffff' : '#b8b0c8', shadow: '#000' });
        });
      },
    };
  };

  // ---------------- game over ----------------
  UI.openGameOver = function (cause, opts) {
    const scare = opts.scare;
    const DEATHS = G.DEATHS || {};
    const text = G.clean(opts.text || DEATHS[cause] || 'You died.');
    const hasSave = !!G.loadGame();
    const items = [{ label: 'Try again', act: () => G.retry() }];
    if (hasSave) items.push({ label: 'Load last save', act: () => G.continueGame() });
    items.push({ label: 'Return to title', act: () => { UI.stack = []; G.fadeTo(() => new G.Title()); } });
    const menu = new G.Menu(items);
    G.Audio.stopMusic();
    G.Audio.ambience(null);
    if (scare) { G.Audio.sfx('scare'); G.Shake.add(7, 0.6); } else G.Audio.sfx('death');
    UI.stack = [];
    UI.push({
      t: 0,
      update(dt, inp) {
        this.t += dt;
        if (this.t > (scare ? 2.2 : 1.4)) menu.update(inp);
      },
      draw(ctx) {
        const st = scare ? 0.9 : 0;
        if (scare && this.t < st) {
          ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
          const s = G.getSprite('scare_' + scare);
          const k = G.ease.out(Math.min(1, this.t / 0.2));
          const [jx, jy] = G.Shake.offset();
          if (s) {
            const f = s.frames[Math.floor(this.t * 14) % s.frames.length];
            const sc = Math.min(W / f.w, H / f.h) * (0.7 + k * 0.5);
            ctx.drawImage(f.c, Math.round(W / 2 - (f.w * sc) / 2 + jx), Math.round(H / 2 - (f.h * sc) / 2 + jy), Math.round(f.w * sc), Math.round(f.h * sc));
          } else if (G.getChar(scare)) {
            const f = G.getChar(scare).down[0];
            const sc = 7 + k * 4;
            ctx.drawImage(f.c, Math.round(W / 2 - (f.w * sc) / 2 + jx), Math.round(H / 2 - (f.h * sc) / 2 + jy), f.w * sc, f.h * sc);
          }
          ctx.globalAlpha = Math.max(0, 0.6 - this.t); ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
          return;
        }
        const u = Math.min(1, (this.t - st) / 1.0);
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = u;
        G.text(ctx, 'GAME OVER', W / 2, 70, { align: 'center', scale: 3, color: '#8a1020', shadow: '#2a0008' });
        G.wrap(text, 320).forEach((ln, k) => G.text(ctx, ln, W / 2, 114 + k * 12, { align: 'center', color: '#a89aa8', shadow: '#000' }));
        ctx.globalAlpha = 1;
        if (this.t > (scare ? 2.2 : 1.4)) menu.draw(ctx, W / 2, 160, this.t);
      },
    });
  };

  // ---------------- endings ----------------
  UI.openEnding = function (id, done) {
    const E = (G.ENDINGS && G.ENDINGS[id]) || { title: 'THE END', lines: [] };
    try {
      const seen = JSON.parse(localStorage.getItem('horror_endings') || '[]');
      if (!seen.includes(id)) seen.push(id);
      localStorage.setItem('horror_endings', JSON.stringify(seen));
    } catch (e) { /* storage blocked */ }
    G.Audio.music(E.music || 'ending');
    const lines = E.lines.map(G.clean);
    UI.stack = [];
    UI.push({
      t: 0, i: 0, lt: 0,
      update(dt, inp) {
        this.t += dt; this.lt += dt;
        if (this.i < lines.length) {
          if (inp.ok && this.lt > 0.6) { this.i++; this.lt = 0; }
        } else if (inp.ok && this.lt > 1.5) { UI.stack = []; done(); G.fadeTo(() => new G.Title(), 0.8); }
      },
      draw(ctx) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        if (this.i < lines.length) {
          const a = Math.min(1, this.lt * 1.5);
          ctx.globalAlpha = a;
          G.wrap(lines[this.i], 340).forEach((ln, k, arr) => G.text(ctx, ln, W / 2, H / 2 - arr.length * 6 + k * 12, { align: 'center', color: '#d8d2e2', shadow: '#000' }));
          ctx.globalAlpha = 1;
          if (this.lt > 0.6 && Math.floor(this.t * 2) % 2) G.text(ctx, 'Z', W - 14, H - 14, { color: '#5a5466' });
          return;
        }
        G.text(ctx, G.clean(E.title), W / 2, 66, { align: 'center', scale: 2, color: E.color || '#e8e0f0', shadow: '#2a0a18' });
        if (E.subtitle) G.text(ctx, G.clean(E.subtitle), W / 2, 94, { align: 'center', color: '#a89aa8', shadow: '#000' });
        G.text(ctx, 'Time ' + G.fmtTime(G.S.time) + '     Deaths ' + G.S.deaths, W / 2, 130, { align: 'center', color: '#8a8298', shadow: '#000' });
        let seen = [];
        try { seen = JSON.parse(localStorage.getItem('horror_endings') || '[]'); } catch (e) { /* ignore */ }
        const total = Object.keys(G.ENDINGS || {}).length;
        if (total) G.text(ctx, 'Endings found: ' + seen.length + ' / ' + total, W / 2, 146, { align: 'center', color: '#8a8298', shadow: '#000' });
        if (E.hint) G.text(ctx, G.clean(E.hint), W / 2, 176, { align: 'center', color: '#6a5a7a', shadow: '#000' });
        if (this.lt > 1.5 && Math.floor(this.t * 2) % 2) G.text(ctx, 'Press Z', W / 2, H - 20, { align: 'center', color: '#5a5466' });
      },
    });
  };

  // ---------------- save / load ----------------
  const SAVE = 'horror_save_v1';
  G.saveGame = function () {
    const ex = G.EX;
    G.S.x = Math.floor(ex.p.x / G.TS);
    G.S.y = Math.floor((ex.p.y - 2) / G.TS);
    G.S.dir = ex.p.dir;
    try { localStorage.setItem(SAVE, JSON.stringify({ S: G.S, at: G.S.time })); } catch (e) { /* storage blocked */ }
    G.savedInMemory = G.snapshot();
  };
  G.loadGame = function () {
    try { const d = JSON.parse(localStorage.getItem(SAVE) || 'null'); if (d) return d.S; } catch (e) { /* ignore */ }
    return G.savedInMemory || null;
  };
  G.continueGame = function () {
    const s = G.loadGame();
    if (!s) return;
    UI.stack = [];
    G.fadeTo(() => { G.restore(s); G.Chase.active = null; G.EV.clear(); const ex = new G.Explore(); ex.start(G.S.map, G.S.x, G.S.y, G.S.dir); return ex; }, 1.5);
  };
  G.retry = function () {
    const s = G.checkpointData || G.loadGame();
    UI.stack = [];
    G.fadeTo(() => {
      const deaths = G.S.deaths, time = G.S.time;
      G.restore(s);
      G.S.deaths = deaths; G.S.time = time;
      G.Chase.active = null; G.EV.clear();
      const ex = new G.Explore();
      ex.start(G.S.map, G.S.x, G.S.y, G.S.dir);
      return ex;
    }, 2);
  };
})(window.G);
