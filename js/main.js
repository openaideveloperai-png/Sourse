// Boot, main loop, input (keyboard + touch), scaling, scene flow, title screen.
(function (G) {
  'use strict';
  const W = G.W, H = G.H;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;
  G.ctx = ctx;
  const q = new URLSearchParams(location.search);
  G.DEV = q.get('dev') ? {} : null;

  // ---------------- input ----------------
  const held = {};
  let pressed = {};
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'ok', Space: 'ok', Enter: 'ok', KeyJ: 'ok', KeyX: 'back', Escape: 'back', Backspace: 'back', KeyK: 'back',
    ShiftLeft: 'run', ShiftRight: 'run', KeyM: 'mute', KeyF: 'full',
  };
  window.addEventListener('keydown', (e) => {
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    G.Audio.init();
    if (!held[k]) pressed[k] = true;
    held[k] = true;
  });
  window.addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) held[k] = false; });
  window.addEventListener('blur', () => { for (const k in held) held[k] = false; });
  G.held = held;
  // used by tests: while the loop is paused (deterministic tests), a press runs one frame at once
  G.press = (k) => {
    if (G.dev && G.dev.paused) {
      const d = { ok: { ok: true }, back: { back: true, menu: true }, up: { up: true, my: -1 }, down: { down: true, my: 1 }, left: { left: true, mx: -1 }, right: { right: true, mx: 1 } }[k] || {};
      G.dev.step(1, Object.assign({ anyPress: true, anyDir: !!(d.up || d.down || d.left || d.right) }, d));
    } else pressed[k] = true;
  };

  function bindTouch() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) document.body.classList.add('touch');
    const dpad = document.getElementById('dpad');
    if (!dpad) return;
    const setDir = (ev) => {
      const r = dpad.getBoundingClientRect();
      let mx = 0, my = 0;
      for (const t of ev.touches) {
        const x = t.clientX - r.left - r.width / 2, y = t.clientY - r.top - r.height / 2;
        if (Math.abs(x) > r.width * 0.75 || Math.abs(y) > r.height * 0.75 || Math.hypot(x, y) < r.width * 0.1) continue;
        if (Math.abs(x) > Math.abs(y)) mx = Math.sign(x); else my = Math.sign(y);
      }
      const set = (k, v) => { if (v && !held[k]) pressed[k] = true; held[k] = v; };
      set('left', mx < 0); set('right', mx > 0); set('up', my < 0); set('down', my > 0);
    };
    for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel'])
      dpad.addEventListener(ev, (e) => { e.preventDefault(); G.Audio.init(); setDir(e); }, { passive: false });
    const btn = (id, k) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); G.Audio.init(); pressed[k] = true; held[k] = true; }, { passive: false });
      el.addEventListener('touchend', (e) => { e.preventDefault(); held[k] = false; }, { passive: false });
    };
    btn('btnA', 'ok');
    btn('btnB', 'back');
  }
  bindTouch();
  canvas.addEventListener('pointerdown', () => { G.Audio.init(); });

  function readInput() {
    let mx = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    let my = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    const anyDir = !!(pressed.up || pressed.down || pressed.left || pressed.right);
    return {
      mx, my, run: !!held.run, ok: !!pressed.ok, back: !!pressed.back, menu: !!pressed.back,
      up: !!pressed.up, down: !!pressed.down, left: !!pressed.left, right: !!pressed.right, anyDir, anyPress: anyDir || !!pressed.ok,
    };
  }

  // ---------------- scaling ----------------
  function resize() {
    const touch = document.body.classList.contains('touch');
    const portrait = window.innerHeight > window.innerWidth;
    const availW = touch && !portrait ? Math.max(window.innerWidth * 0.62, window.innerWidth - 330) : window.innerWidth;
    const availH = window.innerHeight - (touch && portrait ? 190 : 0);
    let s = Math.min(availW / W, availH / H);
    if (s >= 2) s = Math.floor(s);
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
  }
  window.addEventListener('resize', resize);
  resize();
  G.toggleFull = function () {
    try {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
    } catch (e) { /* not allowed here */ }
  };
  G.fmtTime = function (s) {
    s = Math.floor(s);
    const m = Math.floor(s / 60), r = s % 60;
    if (m >= 60) return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0') + ':' + String(r).padStart(2, '0');
    return m + ':' + String(r).padStart(2, '0');
  };

  // ---------------- scenes ----------------
  let scene = null, fade = 0, fadeDir = 0, fadeCb = null, fadeSpeed = 2;
  G.setScene = (s) => { scene = s; };
  G.getScene = () => scene;
  // true while the screen fades between scenes (retry, endings, title)
  G.sceneFading = () => fadeDir !== 0;
  G.fadeTo = function (make, speed) {
    if (fadeDir === 1) return;
    fadeDir = 1;
    fadeCb = make;
    fadeSpeed = speed || 2;
  };

  // new game: content provides G.GAME.newGame() which returns the first scene
  G.newGame = function () {
    G.S = G.newState();
    G.checkpointData = null;
    G.Chase.active = null;
    G.EV.clear();
    return G.GAME.newGame();
  };

  // ---------------- title ----------------
  G.Title = function () {
    this.t = 0;
    this.started = false;
    const save = G.loadGame();
    const items = [];
    if (save) items.push({ label: 'Continue', act: () => G.continueGame() });
    items.push({ label: 'New Game', act: () => { if (save && !this.confirm) { this.confirm = true; return; } G.fadeTo(() => G.newGame(), 0.8); } });
    items.push({ label: () => 'Sound: ' + (G.Audio.muted ? 'OFF' : 'ON'), act: () => G.Audio.toggleMute() });
    items.push({ label: 'Fullscreen', act: () => G.toggleFull() });
    this.menu = new G.Menu(items);
    G.Audio.ambience(null);
  };
  G.Title.prototype.update = function (dt, inp) {
    this.t += dt;
    if (!this.started) {
      if (inp.anyPress || inp.back) { this.started = true; G.Audio.init(); G.Audio.music('title'); G.Audio.sfx('select'); }
      return;
    }
    G.Audio.music('title');
    const before = this.menu.i;
    this.menu.update(inp);
    if (this.menu.i !== before) this.confirm = false;
  };
  G.Title.prototype.draw = function (c) {
    if (G.GAME && G.GAME.titleDraw) G.GAME.titleDraw(c, this.t);
    else { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); }
    if (!this.started) {
      if (Math.floor(this.t * 1.5) % 2 === 0) G.text(c, 'PRESS Z', W / 2, 176, { align: 'center', color: '#a89aa8', shadow: '#000' });
    } else {
      this.menu.draw(c, W / 2, 150, this.t);
      if (this.confirm) G.text(c, 'Press again to erase your save and start over.', W / 2, 150 + this.menu.items.length * 14 + 4, { align: 'center', color: '#c86a7a', shadow: '#000' });
    }
    G.text(c, 'Arrows move   Z examine   X menu   Shift run', W / 2, H - 12, { align: 'center', color: '#4a4458', shadow: '#000' });
  };

  // ---------------- loop ----------------
  let last = performance.now(), acc = 0;
  const STEP = 1 / 60;
  let muteLatch = false, fullLatch = false;
  function update(dt, inp) {
    if (held.mute && !muteLatch) G.Audio.toggleMute();
    muteLatch = !!held.mute;
    if (held.full && !fullLatch) G.toggleFull();
    fullLatch = !!held.full;
    G.Shake.update(dt);
    if (fadeDir !== 0) {
      fade += fadeDir * dt * fadeSpeed;
      if (fadeDir === 1 && fade >= 1) { fade = 1; fadeDir = -1; G.Dialog.lines = null; scene = fadeCb(); fadeCb = null; }
      else if (fadeDir === -1 && fade <= 0) { fade = 0; fadeDir = 0; }
      return;
    }
    if (scene && scene.update) scene.update(dt, inp);
  }
  function tick(ts) {
    const dt = Math.min(0.1, (ts - last) / 1000);
    last = ts;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 6) {
      acc -= STEP;
      n++;
      if (G.dev && G.dev.paused) continue;
      const inp = readInput();
      pressed = {};
      update(STEP, inp);
    }
    if (n === 6) acc = 0;
    ctx.save();
    if (scene && scene.draw) scene.draw(ctx);
    if (fade > 0) { ctx.fillStyle = 'rgba(0,0,0,' + G.clamp(fade, 0, 1).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
    requestAnimationFrame(tick);
  }

  // ---------------- boot ----------------
  if (G.GAME && G.GAME.boot) G.GAME.boot();
  // art stage: ?dev=1&stage=1&wall=danchi&floor=tatami&dark=0.2&put=name:x:y:w:h[:wall|floor],char=name:x:y:dir
  if (G.DEV && q.get('stage')) {
    const objs = (q.get('put') || '').split(',').filter(Boolean).map((s, i) => {
      const a = s.split(':');
      const o = { id: 'p' + i, x: +a[1], y: +a[2], w: +(a[3] || 1), h: +(a[4] || 1) };
      if (a[0].indexOf('char=') === 0) { o.char = a[0].slice(5); o.dir = a[3] || 'down'; o.w = 1; o.h = 1; }
      else o.sprite = a[0];
      if (a[5]) o.z = a[5];
      return o;
    });
    const fl = q.get('floor') || 'tatami';
    G.MAPS.stage = { name: 'Stage', wall: q.get('wall') || 'danchi', floor: { '.': fl, ',': q.get('floor2') || fl }, dark: +(q.get('dark') || 0), rain: q.get('rain') || null,
      tiles: ['##########################', 'WWWWWWWWWWWWWWWWWWWWWWWWWW', 'WWWWWWWWWWWWWWWWWWWWWWWWWW'].concat(Array.from({ length: 10 }, (_, r) => (r < 5 ? '.' : ',').repeat(26))).concat([q.get('rail') ? 'RRRRRRRRRRRRRRRRRRRRRRRRRR' : '##########################']),
      objects: objs, lights: q.get('lights') ? JSON.parse(q.get('lights')) : [] };
    G.S = G.newState();
    if (q.get('flashlight')) G.S.flags.playerLight = +q.get('flashlight');
    const ex = new G.Explore();
    ex.start('stage', +(q.get('x') || 1), +(q.get('y') || 12), 'up');
    scene = ex;
  } else if (G.DEV && q.get('map')) {
    G.S = G.newState();
    for (const it of (q.get('items') || '').split(',').filter(Boolean)) G.S.items.push(it);
    for (const f of (q.get('flags') || '').split(',').filter(Boolean)) G.S.flags[f] = true;
    const ex = new G.Explore();
    const qx = q.get('x') || '2';
    ex.start(q.get('map'), isNaN(+qx) ? qx : +qx, +(q.get('y') || 4), q.get('dir') || 'down');
    scene = ex;
  } else if (G.DEV && q.get('scene')) scene = G.GAME.scenes[q.get('scene')]();
  else scene = new G.Title();
  requestAnimationFrame(tick);
  // test helpers: stand next to an object facing it, then interact
  G.dev = {
    face(id) {
      const ex = G.EX, room = ex.room, o = room.obj(id);
      if (!o) return 'no object ' + id;
      const TS = G.TS;
      const cands = [];
      for (let c = o.x; c < o.x + o.w; c++) cands.push([c, o.y + o.h, 'up']);
      for (let r = o.y; r < o.y + o.h; r++) { cands.push([o.x - 1, r, 'right']); cands.push([o.x + o.w, r, 'left']); }
      for (let c = o.x; c < o.x + o.w; c++) cands.push([c, o.y - 1, 'down']);
      for (const [c, r, d] of cands) {
        if (room.isSolid(c, r)) continue;
        ex.p.x = c * TS + 8; ex.p.y = d === 'down' ? r * TS + 14 : d === 'up' ? r * TS + 7 : r * TS + 12; ex.p.dir = d;
        return [c, r, d];
      }
      return 'no free side';
    },
    use(id) { const r = G.dev.face(id); G.press('ok'); return r; },
    // is there a walkable path from the player to a free tile next to object id?
    reachable(id) {
      const ex = G.EX, room = ex.room, o = room.obj(id);
      if (!o) return false;
      const TS = G.TS;
      const pc = Math.floor(ex.p.x / TS), pr = Math.floor((ex.p.y - 2) / TS);
      const goals = [];
      for (let c = o.x - 1; c <= o.x + o.w; c++) for (let r = o.y - 1; r <= o.y + o.h; r++) if (!room.isSolid(c, r)) goals.push([c, r]);
      if (o.def.touch || (o.def.door && o.def.door.walk) || !o.solid) goals.push([o.x, o.y]);
      return goals.some(([c, r]) => (c === pc && r === pr) || G.findPath(room, pc, pr, c, r) !== null);
    },
    // start a fresh game at a given state: {map, x, y, dir, items:[...], flags:{k:v}|[...], follower}
    start(cfg) {
      G.S = G.newState();
      G.checkpointData = null; G.Chase.active = null; G.Chase.walkers = []; G.EV.clear();
      for (const it of cfg.items || []) G.S.items.push(it);
      if (Array.isArray(cfg.flags)) for (const f of cfg.flags) G.S.flags[f] = true;
      else Object.assign(G.S.flags, cfg.flags || {});
      for (const n of cfg.notes || []) if (!G.S.notes.includes(n)) G.S.notes.push(n);
      const ex = new G.Explore();
      ex.start(cfg.map, cfg.x, cfg.y, cfg.dir || 'down');
      G.setScene(ex);
      return ex;
    },
    // walk-test: is tile (x, y) reachable from the player? if so, put the player there
    walkTo(x, y) {
      const ex = G.EX, room = ex.room, TS = G.TS;
      const pc = Math.floor(ex.p.x / TS), pr = Math.floor((ex.p.y - 2) / TS);
      if (room.isSolid(x, y)) return 'tile ' + x + ',' + y + ' is solid';
      if (!(pc === x && pr === y) && G.findPath(room, pc, pr, x, y) === null) return 'no path to ' + x + ',' + y;
      ex.p.x = x * TS + 8; ex.p.y = y * TS + 12;
      return 'ok';
    },
    // ---- deterministic stepping (the real-time loop is paused while a bot drives) ----
    paused: false,
    step(n, inp) {
      const base = { mx: 0, my: 0, run: false, ok: false, back: false, menu: false, up: false, down: false, left: false, right: false, anyDir: false, anyPress: false };
      for (let i = 0; i < n; i++) update(STEP, Object.assign({}, base, inp || {}));
    },
    // ---- chase-escape bot ----
    // Walks (never runs) through a route of targets while a chase is on and reports if it survived.
    // targets: ['doorId', {hide: 'objId'}, {latch: 'doorId'}, {tile: [x, y]}, {wait: s}, ...]; each
    // door target must be in the room the bot is in when it gets to it. {latch: id} chains that door
    // (the one he is coming through) without going through it. opts: {latch: true} latches chain
    // doors when asked on the way, {max: seconds} time limit, {until: 'chaseEnd'|'route'}.
    escape(targets, opts) {
      opts = opts || {};
      const wasPaused = this.paused;
      const TS = G.TS, q = targets.slice();
      const out = { ok: false, t: 0, log: [] };
      const say = (m) => out.log.push(Math.round(out.t * 10) / 10 + 's ' + G.S.map + ': ' + m);
      this.paused = true;
      let cur = null, curMap = null, path = null, waitT = 0, stuck = 0, lastPos = null;
      const max = (opts.max || 90) * 60;
      try {
        for (let f = 0; f < max; f++) {
          out.t = f / 60;
          const top = G.UI.stack[G.UI.stack.length - 1];
          if (G.UI.active) {
            if (top && top.gameover) { say('caught / game over'); out.caught = true; return out; }
            this.step(1, { ok: true, anyPress: true }); continue;
          }
          if (G.Dialog.active) {
            G.Dialog.chars = G.Dialog.total;
            if (G.Dialog.choice) {
              const opt = G.Dialog.choice.options.map(String);
              let pick = 0;
              const li = opt.findIndex((o) => /latch/i.test(o));
              if (li >= 0) pick = opts.latch || this._wantLatch ? li : opt.findIndex((o) => !/latch/i.test(o));
              const yi = opt.findIndex((o) => /^yes|hide/i.test(o));
              if (li < 0 && yi >= 0) pick = yi;
              G.Dialog.choice.sel = Math.max(0, pick);
              if (G.Dialog.choice !== this._lastChoice) say('choice: ' + opt[G.Dialog.choice.sel]);
              this._lastChoice = G.Dialog.choice;
            }
            this.step(1, { ok: true, anyPress: true });
            continue;
          }
          if (G.EV.busy && !G.EX.p.hidden) { this.step(1); continue; }
          const ex = G.EX, room = ex.room, p = ex.p;
          if (!G.Chase.active && (opts.until !== 'route' || !q.length && !cur)) { if (p.hidden) { this.step(1, { ok: true, anyPress: true }); continue; } out.ok = true; say('chase over'); return out; }
          if (!G.EV.busy) this._wantLatch = false;
          if (p.hidden) { this.step(1); continue; }
          if (!cur) {
            if (!q.length) { this.step(1); continue; }
            cur = q.shift(); curMap = G.S.map; path = null;
            say('target ' + JSON.stringify(cur));
            if (cur.wait) waitT = cur.wait * 60;
          }
          if (cur.wait) { if (--waitT <= 0) cur = null; this.step(1); continue; }
          if (G.S.map !== curMap && typeof cur === 'string') { cur = null; continue; }
          if (cur.latch && !(G.Chase.active && G.Chase.active.away)) { say('too late to latch ' + cur.latch); cur = null; continue; }
          const id = typeof cur === 'string' ? cur : cur.hide || cur.latch;
          let goal, face = null;
          if (cur.tile) goal = cur.tile;
          else {
            const o = room.obj(id);
            if (!o) { say('missing ' + id); out.err = 'missing ' + id + ' in ' + G.S.map; return out; }
            const walk = o.def.door && o.def.door.walk && !cur.latch;
            const cands = [];
            if ((walk || !o.solid) && !cur.latch) for (let c = o.x; c < o.x + o.w; c++) for (let r = o.y; r < o.y + o.h; r++) cands.push([c, r, null]);
            for (let c = o.x; c < o.x + o.w; c++) { cands.push([c, o.y + o.h, 'up']); cands.push([c, o.y - 1, 'down']); }
            for (let r = o.y; r < o.y + o.h; r++) { cands.push([o.x - 1, r, 'right']); cands.push([o.x + o.w, r, 'left']); }
            const pc = Math.floor(p.x / TS), pr = Math.floor((p.y - 2) / TS);
            let best = null;
            for (const [c, r, d] of cands) {
              if (room.isSolid(c, r) && !(walk && c >= o.x && c < o.x + o.w && r >= o.y && r < o.y + o.h)) continue;
              const pa = c === pc && r === pr ? [] : G.findPath(room, pc, pr, c, r);
              if (pa && (!best || pa.length < best.pa.length)) best = { pa: pa, c: c, r: r, d: d };
            }
            if (!best) { say('no path to ' + id); out.err = 'no path to ' + id; return out; }
            goal = [best.c, best.r]; face = best.d;
          }
          const pc = Math.floor(p.x / TS), pr = Math.floor((p.y - 2) / TS);
          if (!path || f % 12 === 0) path = pc === goal[0] && pr === goal[1] ? [] : G.findPath(room, pc, pr, goal[0], goal[1]) || [];
          while (path.length && path[0][0] === pc && path[0][1] === pr && Math.abs(p.x - (pc * TS + 8)) < 3 && Math.abs(p.y - (pr * TS + 12)) < 3) path.shift();
          const tgt = path.length ? path[0] : goal;
          const tx = tgt[0] * TS + 8, ty = tgt[1] * TS + 12;
          let mx = 0, my = 0;
          const dx = tx - p.x, dy = ty - p.y;
          if (Math.abs(dx) > 1.5) mx = Math.sign(dx); else if (Math.abs(dy) > 1.5) my = Math.sign(dy);
          if (!mx && !my && pc === goal[0] && pr === goal[1]) {
            if (cur.tile) { cur = null; continue; }
            if (face) {
              const fd = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[face];
              if (typeof cur === 'string') { this.step(1, { mx: fd[0], my: fd[1] }); this.step(1, { mx: fd[0], my: fd[1], ok: true, anyPress: true }); }
              else { p.dir = face; this._wantLatch = !!cur.latch; this.step(1, { ok: true, anyPress: true }); cur = null; }
              continue;
            }
          }
          const key = Math.round(p.x) + ',' + Math.round(p.y);
          stuck = key === lastPos ? stuck + 1 : 0; lastPos = key;
          if (stuck > 90) { say('stuck at ' + pc + ',' + pr); out.err = 'stuck'; return out; }
          this.step(1, { mx: mx, my: my });
        }
        say('time limit'); out.err = 'time limit';
        return out;
      } finally { this.paused = wasPaused; this._wantLatch = false; }
    },
    // run frames until nothing is happening: advances dialogue, answers choices with `picks`
    // (array of option indices, used in order, default 0), closes notes/pictures.
    // Returns {puzzle: kind} if a puzzle screen waits for an answer, {gameover: true}, or {idle: true}.
    settle(picks, maxFrames) {
      picks = picks === undefined || picks === null ? [] : [].concat(picks);
      const was = this.paused;
      this.paused = true;
      try {
        for (let f = 0; f < (maxFrames || 60 * 120); f++) {
          const top = G.UI.stack[G.UI.stack.length - 1];
          if (G.UI.active && top) {
            if (top.gameover) return { gameover: true, frames: f };
            if (top.kind) return { puzzle: top.kind, frames: f };
            this.step(1, { ok: true, anyPress: true });
            continue;
          }
          if (G.Dialog.active) {
            G.Dialog.chars = G.Dialog.total;
            if (G.Dialog.choice) {
              const c = G.Dialog.choice;
              if (c._pick === undefined) c._pick = picks.length ? picks.shift() : 0;
              c.sel = c._pick;
            }
            this.step(1, { ok: true, anyPress: true });
            continue;
          }
          if (G.EV.busy || fadeDir !== 0) { this.step(1); continue; }
          // a scene fade (title, endings) also counts as busy
          this.step(1);
          if (!G.EV.busy && !G.Dialog.active && !G.UI.active && fadeDir === 0) return { idle: true, frames: f };
        }
        return { stuck: true };
      } finally { this.paused = was; }
    },
    state() { return { map: G.S.map, items: G.S.items.slice(), flags: Object.keys(G.S.flags).filter((k) => k[0] !== '@'), busy: G.EV.busy, dialog: G.Dialog.active, ui: G.UI.active }; },
  };
  window.__G = G;
})(window.G);
