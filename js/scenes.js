// Story scenes: title, the night street + truck intro, waking up in the
// other world, the ending, and the credits. Cutscenes are generator scripts.
(function (G) {
  'use strict';
  const W = G.W, H = G.H, TS = G.TS;
  const C = G.C;

  // ---------------- the night street set ----------------
  const ROAD_TOP = 128, ROAD_BOT = 208, CENTER = 168, NEAR_LANE = 148, FAR_LANE = 188;
  const DOOR_X = 208, CROSS_X = 208;
  let streetBg = null;
  function buildStreet() {
    if (streetBg) return streetBg;
    const px = new G.PX(W, H);
    const P = G.THEMES.street;
    const dummy = { at: () => '.', def: {} };
    // ground rows
    for (let c = 0; c < 26; c++) {
      G.drawTileFloor(px, 'street', 'p', c, 6, c * TS, 96, dummy);
      G.drawTileFloor(px, 'street', 'k', c, 7, c * TS, 112, dummy);
      for (let r = 8; r <= 12; r++) {
        const cross = c >= 11 && c <= 14;
        G.drawTileFloor(px, 'street', cross ? 'z' : r === 10 ? '-' : '=', c, r, c * TS, r * TS, dummy);
      }
      G.drawTileFloor(px, 'street', 'p', c, 13, c * TS, 208, dummy);
    }
    // stop lines
    for (let y = ROAD_TOP + 2; y < ROAD_BOT - 2; y++) { px.set(172, y, P.mark[1]); px.set(173, y, P.mark[0]); px.set(243, y, P.mark[0]); px.set(244, y, P.mark[1]); }
    // curb shadow on the road
    for (let x = 0; x < W; x++) for (let y = 128; y < 131; y++) if (G.bayer(x, y) < 0.6) px.set(x, y, G.mix(px.get(x, y), C('#000000'), 0.4));
    // far wall
    for (let x = 0; x < W; x++) {
      for (let y = 224; y < 240; y++) px.set(x, y, y === 224 ? C('#8a8790') : y < 227 ? C('#6b6872') : (x % 32 === 0 ? C('#3a3840') : C('#55525c')));
    }
    // ---- buildings ----
    // neighbours
    px.rect(0, 0, 80, 96, C('#2a2630'));
    for (let y = 4; y < 92; y += 6) for (let x = (y / 6) % 2 ? 0 : 8; x < 80; x += 16) px.hline(x, x + 14, y, C('#332e3a'));
    px.rect(14, 26, 22, 18, C('#1a1820')); px.rect(16, 28, 18, 14, C('#3a4258')); px.vline(25, 28, 41, C('#1a1820'));
    px.rect(336, 0, 80, 96, C('#25222b'));
    px.rect(352, 20, 26, 20, C('#1a1820')); px.rect(354, 22, 22, 16, C('#2f3446'));
    px.rect(384, 50, 22, 14, C('#5a5a62')); px.hline(384, 405, 50, C('#7a7a84')); for (let x = 386; x < 404; x += 3) px.vline(x, 53, 61, C('#3a3a42'));
    px.vline(340, 0, 95, C('#3a3640'));
    // store: roof
    px.rect(80, 0, 256, 8, C('#2e2c34'));
    px.hline(80, 335, 7, C('#46434e'));
    // sign band
    px.rect(80, 8, 256, 22, C('#f2f4f6'));
    px.rect(80, 22, 256, 3, C('#2fa864'));
    px.rect(80, 25, 256, 3, C('#f08a30'));
    px.rect(80, 28, 256, 2, C('#3a3a44'));
    px.rect(300, 10, 28, 11, C('#2fa864'));
    // facade frame
    px.rect(80, 30, 256, 60, C('#c9ccd2'));
    const win = (x0, x1) => {
      px.rect(x0, 34, x1 - x0, 52, C('#dfe6e2'));
      // shelves with products
      const rnd = G.rng(x0);
      for (const sy of [46, 58, 70, 82]) {
        px.hline(x0 + 2, x1 - 3, sy, C('#a8b0bc'));
        for (let x = x0 + 3; x < x1 - 3; x += 2) if (rnd() < 0.7) { const col = rnd.pick(['#e85a4a', '#4a8ae8', '#f0c040', '#5ab86a', '#e8e8e8', '#c86ad8', '#f09040']); px.set(x, sy - 1, C(col)); if (rnd() < 0.5) px.set(x, sy - 2, C(col)); }
      }
      for (let x = x0 + 24; x < x1; x += 24) px.vline(x, 34, 85, C('#c9ccd2'));
      // reflections
      for (let k = 0; k < 3; k++) px.line(x0 + 6 + k * 30, 84, x0 + 16 + k * 30, 36, C('#f4f8f6'));
    };
    win(86, 186);
    win(230, 330);
    // posters
    px.rect(150, 38, 10, 14, C('#e85a4a')); px.rect(152, 40, 6, 4, C('#fff0a0'));
    px.rect(296, 38, 12, 9, C('#4a8ae8')); px.hline(298, 305, 42, C('#ffffff'));
    // door frame
    px.rect(188, 32, 40, 58, C('#9a9ea8'));
    px.rect(190, 34, 36, 54, C('#e8eee8'));
    px.rect(80, 88, 256, 8, C('#6a6872'));
    px.hline(80, 335, 88, C('#8a8892'));
    // door mat
    px.rect(194, 90, 28, 6, C('#3a4a5a'));
    // text on the sign
    const cv = px.canvas();
    const x = cv.getContext('2d');
    G.text(x, 'LUCKY MART', 194, 11, { align: 'center', color: '#2a7a4a', scale: 1, shadow: '#b8e8c8' });
    G.text(x, '24H', 314, 11, { align: 'center', color: '#ffffff', shadow: false });
    streetBg = cv;
    return cv;
  }

  function Street() {
    this.bg = buildStreet();
    this.door = 0; // 0 closed .. 1 open
    this.signal = 'red';
    this.truck = null; // {x, frame}
    this.lamp = G.propFrame('lamp', 'street', 0, 0);
    this.vend = G.propFrame('vending', 'street', 0, 0);
  }
  Street.prototype.drawBack = function (ctx, ox, oy) {
    ctx.drawImage(this.bg, ox, oy);
    // automatic door: two glass panels sliding apart
    const d = Math.round(this.door * 15);
    ctx.fillStyle = '#dfe8f0';
    ctx.fillRect(ox + 191 - d, oy + 35, 17, 53);
    ctx.fillRect(ox + 208 + d, oy + 35, 17, 53);
    ctx.fillStyle = '#9a9ea8';
    ctx.fillRect(ox + 207 - d, oy + 35, 1, 53);
    ctx.fillRect(ox + 208 + d, oy + 35, 1, 53);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox + 194 - d, oy + 40, 1, 40);
    ctx.fillRect(ox + 211 + d, oy + 40, 1, 40);
  };
  Street.prototype.sprites = function (list) {
    const lamp = this.lamp, vend = this.vend;
    list.push({ y: 104, draw: (c, X, Y) => G.drawFrame(c, vend, X + 58, Y + 104) });
    for (const lx of [150, 362]) list.push({ y: 110, draw: (c, X, Y) => G.drawFrame(c, lamp, X + lx, Y + 110) });
    // pedestrian signals (near and far side)
    const sig = this.signal;
    const drawSig = (c, X, Y, x, y) => {
      c.fillStyle = '#3a3c44'; c.fillRect(X + x, Y + y - 30, 2, 30);
      c.fillStyle = '#1a1b20'; c.fillRect(X + x - 4, Y + y - 42, 10, 13);
      c.fillStyle = sig === 'red' ? '#ff3b3b' : '#3a1414'; c.fillRect(X + x - 2, Y + y - 40, 6, 4);
      c.fillStyle = sig === 'green' || (sig === 'blink' && Math.floor(performance.now() / 250) % 2) ? '#4dff9a' : '#123a22'; c.fillRect(X + x - 2, Y + y - 35, 6, 4);
    };
    list.push({ y: 110, draw: (c, X, Y) => drawSig(c, X, Y, 168, 110) });
    list.push({ y: 222, draw: (c, X, Y) => drawSig(c, X, Y, 250, 222) });
    if (this.truck) {
      const tr = this.truck;
      list.push({ y: FAR_LANE + 10, draw: (c, X, Y) => G.drawFrame(c, G.MOB.truck[tr.frame % 4], X + tr.x, Y + FAR_LANE + 10) });
    }
  };
  Street.prototype.lights = function (t) {
    const L = [
      { x: 136, y: 60, r: 64, col: '#fff4d8', glow: 0.06 }, { x: 280, y: 60, r: 64, col: '#fff4d8', glow: 0.06 },
      { x: 208, y: 62, r: 48, i: 0.9 }, { x: 208, y: 112, r: 76, i: 0.85 }, { x: 130, y: 104, r: 56, i: 0.8 }, { x: 290, y: 104, r: 56, i: 0.8 },
      { x: 208, y: 18, r: 72, col: '#ffffff', glow: 0.05 },
      { x: 150, y: 118, r: 64, col: '#ffe6a8', glow: 0.25 }, { x: 362, y: 118, r: 64, col: '#ffe6a8', glow: 0.25 },
      { x: 58, y: 92, r: 34, col: '#9fd0ff', glow: 0.35 },
      { x: 169, y: 72, r: 12, col: this.signal === 'red' ? '#ff3b3b' : '#4dff9a', glow: 0.6 },
    ];
    if (this.truck) {
      const x = this.truck.x - 52;
      const k = this.truck.light === undefined ? 1 : this.truck.light;
      L.push({ x: x, y: FAR_LANE - 8, r: 44, col: '#fff6c8', glow: 0.5, i: k });
      L.push({ x: this.truck.x, y: FAR_LANE - 22, r: 72, i: 0.55 * k });
      for (let i = 1; i <= 5; i++) L.push({ x: x - i * 34, y: FAR_LANE - 6 + i * 2, r: 36 + i * 10, col: '#fff6c8', glow: 0.25, i: k * (1 - i * 0.12) });
    } else if (this.glare) {
      for (let i = 0; i < 3; i++) L.push({ x: W + 10 - i * 30, y: FAR_LANE - 8, r: (40 + i * 20) * this.glare, col: '#fff6c8', glow: 0.4 * this.glare, i: this.glare });
    }
    return L;
  };

  // ---------------- actors + script runner ----------------
  function Actor(x, y, dir) {
    this.x = x; this.y = y; this.dir = dir || 'down'; this.moving = false; this.anim = 0; this.pose = null; this.visible = true; this.bubble = null; this.bt = 0; this.flip = false;
  }
  Actor.prototype.draw = function (ctx, X, Y) {
    if (!this.visible) return;
    const x = X + this.x, y = Y + this.y;
    ctx.fillStyle = 'rgba(10,6,18,0.4)';
    ctx.fillRect(Math.round(x - 5), Math.round(y - 1), 10, 2);
    if (this.pose) G.drawFrame(ctx, this.pose, x, y + 1, this.flip);
    else {
      const K = G.KID;
      const arr = this.dir === 'down' ? K.down : this.dir === 'up' ? K.up : K.left;
      const f = this.moving ? [0, 1, 0, 2][Math.floor(this.anim * 9) % 4] : 0;
      G.drawFrame(ctx, arr[f], x, y + 1, this.dir === 'right');
    }
    if (this.bubble) {
      const pop = Math.min(1, this.bt * 8);
      G.drawFrame(ctx, G.MOB.bubble[this.bubble], x + 6, y - 24 - Math.round((1 - pop) * 4));
    }
  };

  function Cine(script, opts) {
    opts = opts || {};
    this.t = 0;
    this.dt = 0;
    this.timeScale = 1;
    this.black = opts.black === undefined ? 1 : opts.black;
    this.white = 0;
    this.caption = null;
    this.center = null;
    this.actors = [];
    this.skippable = opts.skip;
    this.it = script(this);
  }
  Cine.prototype.update = function (dt, inp) {
    this.inp = inp;
    this.dt = dt * this.timeScale;
    this.t += this.dt;
    G.FX.update(this.dt);
    for (const a of this.actors) { if (a.moving) a.anim += this.dt; if (a.bubble) a.bt += dt; }
    if (G.Dialog.active) G.Dialog.update(dt, inp);
    if (this.skippable && (inp.pause || inp.back) && !this.skipping) { this.skipping = true; G.Dialog.lines = null; this.skippable(); return; }
    if (this.it) { const r = this.it.next(); if (r.done) this.it = null; }
  };
  Cine.prototype.wait = function* (s) { let t = 0; while (t < s) { t += this.dt; yield; } };
  Cine.prototype.say = function* (lines) {
    let done = false;
    G.Dialog.say(lines, () => { done = true; });
    while (!done) yield;
  };
  Cine.prototype.walk = function* (a, x, y, speed) {
    speed = speed || 40;
    a.moving = true;
    a.pose = null;
    for (;;) {
      const dx = x - a.x, dy = y - a.y, d = Math.hypot(dx, dy);
      if (d < 0.6) break;
      if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? 'right' : 'left';
      else a.dir = dy > 0 ? 'down' : 'up';
      const s = Math.min(d, speed * this.dt);
      a.x += (dx / d) * s;
      a.y += (dy / d) * s;
      yield;
    }
    a.x = x; a.y = y; a.moving = false;
  };
  Cine.prototype.fade = function* (prop, to, time) {
    const from = this[prop];
    let t = 0;
    while (t < time) { t += this.dt; this[prop] = G.lerp(from, to, G.clamp(t / time, 0, 1)); yield; }
    this[prop] = to;
  };
  Cine.prototype.bubble = function (a, kind) { a.bubble = kind; a.bt = 0; if (kind === '!') G.Audio.sfx('knightWarn'); };
  Cine.prototype.drawOverlay = function (ctx) {
    if (this.caption) {
      const a = this.caption;
      G.text(ctx, a, 10, 10, { color: '#e8e2d6', shadow: '#000' });
    }
    if (this.white > 0) { ctx.fillStyle = 'rgba(255,255,255,' + this.white.toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
    if (this.black > 0) { ctx.fillStyle = 'rgba(0,0,0,' + this.black.toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
    if (this.center) {
      const c = this.center;
      const lines = Array.isArray(c.text) ? c.text : [c.text];
      lines.forEach((ln, i) => G.text(ctx, ln, W / 2, H / 2 - lines.length * 6 + i * 12, { align: 'center', color: c.color || '#a9a2bb', shadow: '#000' }));
    }
    if (this.skippable && this.t < 6) G.text(ctx, 'Esc: skip', W - 6, H - 12, { align: 'right', color: '#5a5466', shadow: '#000' });
    G.Dialog.draw(ctx);
  };

  function drawStreetScene(sc, ctx) {
    const st = sc.street;
    const [sx, sy] = G.Shake.offset();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    st.drawBack(ctx, sx, sy);
    const list = [];
    st.sprites(list);
    for (const a of sc.actors) list.push({ y: a.y, draw: (c, X, Y) => a.draw(c, X, Y) });
    list.sort((a, b) => a.y - b.y);
    for (const it of list) it.draw(ctx, sx, sy);
    G.FX.draw(ctx, sx, sy, 0);
    G.Light.draw(ctx, sc.dark === undefined ? 0.8 : sc.dark, '#03061a', st.lights(sc.t), sc.t);
    G.FX.draw(ctx, sx, sy, 1);
    G.vignette(ctx, 0.6);
  }

  // ---------------- TITLE ----------------
  G.Title = function () {
    this.t = 0;
    this.street = new Street();
    this.street.signal = 'red';
    this.kid = new Actor(208, 118, 'up');
    this.kid.pose = null;
    this.actors = [this.kid];
    this.dark = 0.82;
    this.truckT = 3;
    const hasSave = G.Game.started && (G.Game.level > 0 || G.Game.deaths > 0 || G.Game.flags.woke);
    const items = [];
    if (hasSave) items.push({ label: () => (G.Game.cleared ? 'Continue (cleared)' : 'Continue  -  Chapter ' + (Math.min(G.Game.level, G.LEVELS.length - 1) + 1) + '  -  ♥ ' + G.Game.deaths), act: () => G.startGame(true) });
    items.push({ label: 'New Game', act: () => { if (hasSave && !this.confirm) { this.confirm = true; return; } G.startGame(false); } });
    items.push({ label: () => 'Sound: ' + (G.Audio.muted ? 'OFF' : 'ON'), act: () => G.Audio.toggleMute() });
    items.push({ label: 'Fullscreen', act: () => G.toggleFull() });
    this.menu = new G.Menu(items);
    this.started = false;
  };
  G.Title.prototype.update = function (dt, inp) {
    this.t += dt;
    G.FX.update(dt);
    if (!this.started) {
      if (inp.ok || inp.anyPress) { this.started = true; G.Audio.init(); G.Audio.music('title'); G.Audio.sfx('select'); }
      return;
    }
    G.Audio.music('title');
    const before = this.menu.i;
    this.menu.update(inp);
    if (this.menu.i !== before) this.confirm = false;
    // a truck passes now and then
    this.truckT -= dt;
    const st = this.street;
    if (this.truckT <= 0 && !st.truck) { st.truck = { x: W + 120, frame: 0 }; G.Audio.sfx('whoosh'); }
    if (st.truck) {
      st.truck.x -= 520 * dt;
      st.truck.frame = Math.floor(this.t * 16);
      if (st.truck.x < -140) { st.truck = null; this.truckT = 6 + Math.random() * 5; }
    }
  };
  G.Title.prototype.draw = function (ctx) {
    drawStreetScene(this, ctx);
    // title
    ctx.fillStyle = 'rgba(4,2,10,0.55)';
    ctx.fillRect(0, 26, W, 54);
    const wob = Math.round(Math.sin(this.t * 1.3) * 1);
    G.text(ctx, 'WRONG WAY HOME', W / 2, 32 + wob, { align: 'center', scale: 3, color: '#ffffff', outline: '#3a1460', ow: 1 });
    G.text(ctx, 'hit by a truck. sent to another world. everything there wants you dead.', W / 2, 64, { align: 'center', color: '#c890ff', shadow: '#000' });
    if (!this.started) {
      if (Math.floor(this.t * 2) % 2 === 0) G.text(ctx, 'PRESS Z OR TAP TO START', W / 2, 168, { align: 'center', color: '#ffffff', shadow: '#000' });
    } else {
      ctx.fillStyle = 'rgba(4,2,10,0.6)';
      ctx.fillRect(W / 2 - 110, 140, 220, this.menu.items.length * 14 + 10);
      this.menu.draw(ctx, W / 2, 146, this.t);
      if (this.confirm) G.text(ctx, 'Press again to erase your save and start over.', W / 2, 140 + this.menu.items.length * 14 + 14, { align: 'center', color: '#ff8a8a', shadow: '#000' });
    }
    G.text(ctx, 'Arrows/WASD move   Z/Space confirm   Esc pause   M mute', W / 2, H - 11, { align: 'center', color: '#6a6280', shadow: '#000' });
  };

  // ---------------- INTRO: the convenience store, the road, the truck ----------------
  G.Intro = function () {
    const sc = new Cine(introScript, { skip: () => G.fadeTo(() => new G.Wake(), 1.5) });
    sc.street = new Street();
    sc.street.signal = 'red';
    sc.kid = new Actor(DOOR_X, 92, 'down');
    sc.kid.visible = false;
    sc.actors = [sc.kid];
    sc.draw = function (ctx) { drawStreetScene(this, ctx); this.drawOverlay(ctx); };
    G.Audio.music('title');
    return sc;
  };
  function* introScript(sc) {
    const kid = sc.kid, st = sc.street;
    sc.center = { text: '11:47 PM', color: '#e8e2d6' };
    yield* sc.wait(1.6);
    sc.center = null;
    yield* sc.fade('black', 0, 1.4);
    yield* sc.wait(0.5);
    // automatic door opens
    G.Audio.sfx('chime');
    for (let t = 0; t < 0.35; t += sc.dt) { st.door = t / 0.35; yield; }
    st.door = 1;
    kid.visible = true;
    yield* sc.walk(kid, DOOR_X, 110, 36);
    for (let t = 0; t < 0.35; t += sc.dt) { st.door = 1 - t / 0.35; yield; }
    st.door = 0;
    yield* sc.wait(0.3);
    yield* sc.say([
      { who: 'kid', face: 'neutral', text: 'Pudding: check. Melon soda: check.' },
      { who: 'kid', face: 'happy', text: 'Best part of the day.' },
    ]);
    yield* sc.walk(kid, CROSS_X, 120, 36);
    kid.dir = 'left';
    yield* sc.wait(0.5);
    kid.dir = 'right';
    yield* sc.wait(0.5);
    kid.dir = 'down';
    yield* sc.wait(0.8);
    st.signal = 'green';
    G.Audio.sfx('crosswalk');
    yield* sc.wait(0.4);
    G.Audio.sfx('crosswalk');
    yield* sc.wait(0.4);
    yield* sc.walk(kid, CROSS_X, 166, 34);
    // something is coming
    G.Audio.sfx('rumble', 2.5);
    G.Audio.duck(0.15, 0.6);
    yield* sc.walk(kid, CROSS_X, 178, 30);
    for (let t = 0; t < 0.6; t += sc.dt) { st.glare = t / 0.6; yield; }
    kid.dir = 'right';
    sc.bubble(kid, '!');
    yield* sc.wait(0.6);
    G.Audio.sfx('horn', 1.4);
    G.Audio.sfx('screech');
    st.glare = 0;
    st.truck = { x: W + 70, frame: 0 };
    kid.bubble = null;
    kid.pose = G.MOB.shock;
    // truck races in, time slows right before impact
    let x = W + 70;
    while (x > CROSS_X + 110) { x -= 600 * sc.dt; st.truck.x = x; st.truck.frame = Math.floor(sc.t * 20); yield; }
    sc.timeScale = 0.08;
    G.Audio.sfx('heartbeat', 0.7);
    let real = 0;
    while (x > CROSS_X + 56) {
      x -= 600 * sc.dt; st.truck.x = x; st.truck.frame = Math.floor(sc.t * 20);
      real += sc.dt / sc.timeScale;
      if (real > 0.9 && real < 0.95) G.Audio.sfx('heartbeat', 0.8);
      yield;
    }
    sc.timeScale = 1;
    // impact
    G.Audio.stopMusic();
    G.Audio.sfx('crash');
    G.Shake.add(6, 0.4);
    sc.white = 1;
    yield* sc.wait(0.12);
    sc.black = 1;
    sc.white = 0;
    kid.visible = false;
    st.truck = null;
    yield* sc.wait(2.2);
    sc.center = { text: '...', color: '#6a6280' };
    yield* sc.wait(1.6);
    sc.center = null;
    yield* sc.wait(0.5);
    yield* sc.say([
      { who: 'narr', text: '(So this is it, huh.)' },
      { who: 'narr', text: '(Hit by a truck. Like the first chapter of some cheap light novel.)' },
      { who: 'narr', text: '(At least the pudding... survived...?)' },
    ]);
    G.Audio.sfx('heartbeat', 0.5);
    yield* sc.wait(1.2);
    G.Audio.sfx('heartbeat', 0.6);
    yield* sc.wait(1.0);
    yield* sc.say([{ who: 'witch', text: 'Found you.' }]);
    yield* sc.wait(0.4);
    G.Audio.sfx('rbd');
    yield* sc.fade('white', 1, 1.2);
    G.Game.flags.introSeen = true;
    G.Game.persist();
    G.fadeTo(() => new G.Wake(true), 3);
  }

  // ---------------- WAKE: another world ----------------
  G.Wake = function (fromWhite) {
    const sc = new Cine(wakeScript, { black: 0, skip: () => { G.Game.flags.woke = true; G.Game.persist(); G.fadeTo(() => new G.Play(0), 1.5); } });
    sc.white = fromWhite ? 1 : 0;
    sc.black = fromWhite ? 0 : 1;
    sc.L = G.parseLevel(G.LEVELS[0]);
    sc.map = G.renderMap(sc.L);
    const s = sc.L.start;
    sc.kid = new Actor(s.x, s.y + 6, 'down');
    sc.kid.pose = G.MOB.lieUp;
    sc.actors = [sc.kid];
    sc.draw = function (ctx) {
      const ox = 0, oy = G.TOP;
      ctx.fillStyle = '#0b0712';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(this.map.bg, ox, oy);
      const list = [];
      for (const p of this.map.props) list.push({ y: p.y, draw: (c, X, Y) => G.drawFrame(c, p.f, X + p.x, Y + p.y) });
      for (const hz of this.L.hazards) {
        const stt = hz.state(this.t);
        const arr = hz.skin === 'slimeB' ? G.MOB.slimeB : G.MOB.slime;
        list.push({ y: stt.y + 5, draw: (c, X, Y) => G.drawFrame(c, arr[Math.floor(this.t * 8) % 4], X + stt.x, Y + stt.y + 5) });
      }
      if (this.L.exit) list.push({ y: this.L.exit.y + 7, draw: (c, X, Y) => G.drawFrame(c, G.MOB.portalShut[0], X + this.L.exit.x, Y + this.L.exit.y + 7) });
      for (const sh of this.L.shards) list.push({ y: sh.y + 5, draw: (c, X, Y) => G.drawFrame(c, G.MOB.shard[Math.floor(this.t * 9) % 6], X + sh.x, Y + sh.y + 4) });
      for (const a of this.actors) list.push({ y: a.y, draw: (c, X, Y) => a.draw(c, X, Y) });
      list.sort((a, b) => a.y - b.y);
      for (const it of list) it.draw(ctx, ox, oy);
      G.FX.draw(ctx, ox, oy, 0);
      ctx.fillStyle = 'rgba(255,180,120,0.10)';
      ctx.fillRect(0, oy, W, H - oy);
      G.vignette(ctx, 0.45);
      ctx.fillStyle = '#0b0712';
      ctx.fillRect(0, 0, W, G.TOP);
      this.drawOverlay(ctx);
    };
    G.Audio.stopMusic();
    return sc;
  };
  function* wakeScript(sc) {
    const kid = sc.kid;
    // birds
    const birds = () => { G.Audio.sfx('crosswalk'); };
    if (sc.white > 0) yield* sc.fade('white', 0, 2.5);
    else yield* sc.fade('black', 0, 1.5);
    birds();
    yield* sc.wait(1.4);
    birds();
    yield* sc.wait(0.6);
    sc.bubble(kid, '...');
    yield* sc.wait(1.0);
    kid.bubble = null;
    kid.pose = G.MOB.sit;
    G.Audio.sfx('gasp');
    yield* sc.wait(0.9);
    kid.pose = null;
    kid.dir = 'down';
    yield* sc.wait(0.4);
    kid.dir = 'left';
    yield* sc.wait(0.5);
    kid.dir = 'right';
    yield* sc.wait(0.5);
    kid.dir = 'down';
    sc.bubble(kid, '?');
    yield* sc.wait(0.6);
    kid.bubble = null;
    yield* sc.say([
      { who: 'kid', face: 'shock', text: '...Huh?' },
      { who: 'kid', face: 'scared', text: 'Grass? Wasn\'t I just... in the middle of a road?' },
      { who: 'kid', face: 'shock', text: 'The truck. There was a truck, and then a light, and then...' },
      { who: 'kid', face: 'sad', text: '...Someone was holding me. Cold hands.' },
      { who: 'kid', face: 'shock', text: 'Wait. Don\'t tell me.' },
      { who: 'kid', face: 'happy', text: 'Is this ANOTHER WORLD?!' },
      { who: 'kid', face: 'happy', text: 'Cheat skills! A status screen! Okay. Ahem. STATUS OPEN!' },
      { who: 'narr', text: 'Nothing happened.' },
      { who: 'kid', face: 'annoyed', text: '...Menu? Inventory? Tutorial fairy? No?' },
    ]);
    yield* sc.wait(0.6);
    G.Audio.sfx('rbd');
    yield* sc.say([
      { who: 'witch', text: 'Return.' },
      { who: 'kid', face: 'shock', text: '!? Who\'s there?!' },
      { who: 'witch', text: 'Return to your world.' },
      { who: 'witch', text: 'No matter what.' },
      { who: 'kid', face: 'scared', text: '...Return? How? Hello?' },
      { who: 'kid', face: 'annoyed', text: 'Great. Thanks. Very helpful.' },
    ]);
    G.Game.flags.woke = true;
    G.Game.persist();
    G.fadeTo(() => new G.Play(0), 1.6);
  }

  // ---------------- ENDING ----------------
  G.Ending = function () {
    const sc = new Cine(endingScript, { black: 0, skip: () => G.fadeTo(() => new G.Credits(), 1.2) });
    sc.white = 1;
    sc.street = new Street();
    sc.street.signal = 'green';
    sc.kid = new Actor(CROSS_X, 182, 'down');
    sc.actors = [sc.kid];
    sc.draw = function (ctx) { drawStreetScene(this, ctx); this.drawOverlay(ctx); };
    G.Audio.stopMusic();
    G.Game.cleared = true;
    G.Game.persist();
    return sc;
  };
  function* endingScript(sc) {
    const kid = sc.kid, st = sc.street;
    yield* sc.fade('white', 0, 1.6);
    yield* sc.wait(0.5);
    sc.bubble(kid, '?');
    yield* sc.wait(0.7);
    kid.bubble = null;
    kid.dir = 'left';
    yield* sc.wait(0.4);
    kid.dir = 'down';
    yield* sc.wait(0.3);
    G.Audio.sfx('rumble', 2);
    for (let t = 0; t < 0.7; t += sc.dt) { st.glare = t / 0.7; yield; }
    kid.dir = 'right';
    sc.bubble(kid, '!');
    yield* sc.wait(0.5);
    yield* sc.say([{ who: 'kid', face: 'shock', text: 'Here?! RIGHT NOW?!' }]);
    G.Audio.sfx('horn', 1.4);
    st.glare = 0;
    st.truck = { x: W + 70, frame: 0 };
    kid.bubble = null;
    // he knows this one. he runs.
    let x = W + 70;
    let ran = false;
    while (x > -150) {
      x -= 560 * sc.dt;
      st.truck.x = x;
      st.truck.frame = Math.floor(sc.t * 20);
      if (!ran) {
        kid.dir = 'up';
        kid.moving = true;
        kid.y -= 150 * sc.dt;
        if (kid.y <= 118) { kid.y = 118; kid.moving = false; ran = true; }
      }
      if (x < CROSS_X + 60 && x > CROSS_X - 60 && Math.random() < 0.5) G.FX.dust(CROSS_X + (Math.random() - 0.5) * 60, FAR_LANE + 4, 1, ['#8a8790', '#5a5866']);
      yield;
    }
    G.Audio.sfx('whoosh');
    st.truck = null;
    G.Shake.add(2, 0.2);
    yield* sc.wait(1.2);
    kid.dir = 'down';
    yield* sc.wait(0.6);
    kid.pose = G.MOB.sit;
    yield* sc.wait(0.6);
    G.Audio.music('ending');
    const n = G.Game.deaths;
    yield* sc.say([
      { who: 'kid', face: 'pain', text: 'Haah... haah...' },
      { who: 'kid', face: 'shock', text: '...I\'m back.' },
      { who: 'kid', face: 'sad', text: 'I\'m actually back.' },
      { who: 'kid', face: 'neutral', text: '...' },
      { who: 'kid', face: 'happy', text: 'The pudding\'s still cold.' },
      { who: 'narr', text: 'He had died ' + n + ' time' + (n === 1 ? '' : 's') + '.' },
      { who: 'narr', text: 'He remembered every single one.' },
      { who: 'kid', face: 'determined', text: 'Let\'s go home. Looking both ways. Twice.' },
    ]);
    kid.pose = null;
    yield* sc.wait(0.3);
    yield* sc.walk(kid, W + 20, 118, 40);
    yield* sc.wait(0.8);
    yield* sc.say([{ who: 'witch', text: 'See you soon.' }]);
    yield* sc.fade('black', 1, 1.5);
    G.fadeTo(() => new G.Credits(), 2);
  }

  // ---------------- CREDITS / STATS ----------------
  G.Credits = function () {
    this.t = 0;
    G.Audio.music('ending');
  };
  G.Credits.prototype.update = function (dt, inp) {
    this.t += dt;
    if (this.t > 2 && inp.ok) G.fadeTo(() => new G.Title(), 1.2);
  };
  G.Credits.prototype.draw = function (ctx) {
    ctx.fillStyle = '#07040c';
    ctx.fillRect(0, 0, W, H);
    const g = G.Game;
    G.text(ctx, 'THE END', W / 2, 26, { align: 'center', scale: 3, color: '#ffffff', outline: '#3a1460' });
    G.text(ctx, 'You returned home.', W / 2, 58, { align: 'center', color: '#c890ff' });
    G.text(ctx, 'Total deaths: ' + g.deaths, W / 2, 84, { align: 'center', color: '#e05a6a' });
    G.text(ctx, 'Total time: ' + G.fmtTime(g.time), W / 2, 98, { align: 'center', color: '#e8e2d6' });
    G.LEVELS.forEach((L, i) => {
      const d = g.levelDeaths[i] || 0;
      G.text(ctx, L.chapter.replace('CHAPTER ', 'CH.') + '  ' + L.name, 92, 120 + i * 12, { color: '#a9a2bb' });
      G.text(ctx, '♥ ' + d, W - 92, 120 + i * 12, { align: 'right', color: '#e05a6a' });
    });
    if (this.t > 2 && Math.floor(this.t * 2) % 2 === 0) G.text(ctx, 'Press Z', W / 2, H - 16, { align: 'center', color: '#6a6280' });
  };
})(window.G);
