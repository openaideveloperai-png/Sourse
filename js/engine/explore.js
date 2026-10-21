// Exploration scene: walking around rooms, examining things, doors, hiding,
// pushing furniture, room transitions, camera, lighting and effects.
(function (G) {
  'use strict';
  const TS = G.TS, W = G.W, H = G.H;

  function Explore() {
    G.EX = this;
    this.room = null;
    this.p = { x: 0, y: 0, dir: 'down', moving: false, walkT: 0, hidden: false, hideObj: null };
    this.t = 0;
    this.fade = 1;
    this.flash = null;
    this.tint = null;
    this.darkOverride = null;
    this.bubbles = [];
    this.banner = null;
    this.bumpT = 0;
    this.touching = new Set();
    this.locked = false;
    this.stepT = 0;
    this.grain = 0;
  }
  G.Explore = Explore;

  // ---------------- room changes ----------------
  Explore.prototype.load = function (map, x, y, dir) {
    G.S.map = map;
    this.room = new G.Room(map);
    this.p.x = x * TS + 8;
    this.p.y = y * TS + 14;
    if (dir) this.p.dir = dir;
    this.p.hidden = false;
    this.touching = new Set(this.touchedNow());
    this.darkOverride = null;
    const def = this.room.def;
    G.Audio.music(G.Chase.active ? 'chase' : def.music || null);
    G.Audio.ambience(def.ambience || null);
    if (def.location) this.banner = { text: def.location, t: 0, small: true };
  };
  Explore.prototype.start = function (map, x, y, dir) {
    this.load(map, x, y, dir);
    this.fade = 1;
    const self = this;
    G.EV.run(function* () { yield* self.fadeTo(0, 0.6); });
    this.afterEnter();
  };
  Explore.prototype.afterEnter = function () {
    const def = this.room.def;
    const first = !G.S.flags['@visited:' + this.room.id];
    G.S.flags['@visited:' + this.room.id] = true;
    if (!G.Chase.active) this.checkpoint();
    if (first && def.first) G.EV.run(def.first);
    if (def.enter) G.EV.run(def.enter);
  };
  Explore.prototype.transfer = function* (map, x, y, dir, opts) {
    opts = opts || {};
    const from = G.S.map;
    if (opts.sfx !== null) G.Audio.sfx(opts.sfx || 'door');
    yield* this.fadeTo(1, opts.fade === undefined ? 0.22 : opts.fade);
    this.load(map, x, y, dir);
    G.Chase.onTransfer(from, map, { x: this.p.x, y: this.p.y });
    this.afterEnter();
    yield* this.fadeTo(0, opts.fade === undefined ? 0.22 : opts.fade);
  };
  Explore.prototype.fadeTo = function* (to, time) {
    const from = this.fade;
    let t = 0;
    while (t < time) { t += G.EV.dt || 1 / 60; this.fade = G.lerp(from, to, Math.min(1, t / time)); yield; }
    this.fade = to;
  };
  Explore.prototype.checkpoint = function () {
    G.S.x = Math.floor(this.p.x / TS);
    G.S.y = Math.floor((this.p.y - 2) / TS);
    G.S.dir = this.p.dir;
    G.checkpointData = G.snapshot();
  };

  // ---------------- interaction ----------------
  Explore.prototype.probe = function () {
    const p = this.p;
    const d = { up: [0, -12], down: [0, 9], left: [-10, -3], right: [10, -3] }[p.dir];
    return [p.x + d[0], p.y + d[1]];
  };
  Explore.prototype.objectAt = function (x, y, pred) {
    let best = null;
    for (const o of this.room.objects) {
      if (!o.visible || (pred && !pred(o))) continue;
      const r = o.rect();
      const pad = o.def.z === 'wall' || o.def.door ? 3 : 1;
      if (x >= r.x - pad && x < r.x + r.w + pad && y >= r.y - pad && y < r.y + r.h + pad) {
        if (!best || (o.def.on || o.def.door) && !(best.def.on || best.def.door)) best = o;
      }
    }
    return best;
  };
  const interactive = (o) => !!(o.def.on || o.def.door || o.def.hide || o.def.text);
  Explore.prototype.interact = function () {
    const [x, y] = this.probe();
    let o = this.objectAt(x, y, interactive);
    if (!o && this.p.dir === 'up') o = this.objectAt(x, y - 6, interactive);
    if (!o) return false;
    this.activate(o);
    return true;
  };
  Explore.prototype.activate = function (o) {
    const def = o.def, self = this;
    if (def.door) { G.EV.run(function* (E) { yield* self.useDoor(E, o); }); return; }
    if (def.hide) { G.EV.run(function* (E) { yield* self.tryHide(E, o); }); return; }
    if (def.on) { G.EV.run(def.on, o); return; }
    if (def.text) G.EV.run(function* (E) { yield* E.say(...[].concat(def.text)); });
  };
  Explore.prototype.useDoor = function* (E, o) {
    const def = o.def, d = def.door;
    const ukey = o.key('unlocked');
    if (def.lock && !G.S.flags[ukey]) {
      let can = false;
      if (typeof def.lock === 'string') can = E.has(def.lock);
      else can = !!def.lock(E);
      if (!can) {
        G.Audio.sfx('locked');
        yield* E.say(...[].concat(def.lockText || "@ It's locked."));
        return;
      }
      if (typeof def.lock === 'string') {
        const it = G.ITEMS[def.lock];
        G.Audio.sfx('unlock');
        yield* E.say(def.unlockText || '@ Used the ' + (it ? it.name : def.lock) + '.');
        if (def.consume) E.take(def.lock);
      } else if (def.unlockText) { G.Audio.sfx('unlock'); yield* E.say(def.unlockText); }
      G.S.flags[ukey] = true;
    }
    if (def.before) { const r = yield* def.before(E, o); if (r === false) return; }
    yield* E.goto(d.to, d.x, d.y, d.dir || this.p.dir, { sfx: def.sfx === undefined ? (def.stairs ? 'stairs' : 'door') : def.sfx });
  };
  Explore.prototype.tryHide = function* (E, o) {
    const ok = yield* E.yesno(o.def.hidePrompt || '@ Hide inside?');
    if (!ok) return;
    if (G.Chase.seesHiding()) {
      G.Audio.sfx('door');
      yield* E.wait(0.3);
      this.gameOver(G.Chase.active.cfg.cause || 'monster', { scare: G.Chase.active.cfg.scare || G.Chase.active.cfg.char, text: 'It saw you hide.' });
      for (;;) yield;
    }
    G.Audio.sfx('closet');
    this.p.hidden = true;
    this.p.hideObj = o;
    if (o.def.hideSprite) E.setSprite(o.id, o.def.hideSprite);
    yield* E.wait(0.4);
    // stay hidden until the player presses a key
    while (!(G.EV.inp.ok || G.EV.inp.anyDir)) yield;
    G.Audio.sfx('closet');
    this.p.hidden = false;
    this.p.hideObj = null;
    if (o.def.hideSprite) E.setSprite(o.id, o.def.sprite);
  };
  Explore.prototype.touchedNow = function () {
    const out = [];
    if (!this.room) return out;
    const fx = this.p.x, fy = this.p.y - 2;
    for (const o of this.room.objects) {
      if (!o.visible || !(o.def.touch || (o.def.door && o.def.door.walk))) continue;
      const r = o.rect();
      if (fx >= r.x && fx < r.x + r.w && fy >= r.y && fy < r.y + r.h) out.push(o.id);
    }
    return out;
  };

  // ---------------- update ----------------
  Explore.prototype.update = function (dt, inp) {
    this.t += dt;
    G.S.time += dt;
    if (this.flash) { this.flash.age += dt; if (this.flash.age > this.flash.t) this.flash = null; }
    if (this.banner) { this.banner.t += dt; if (this.banner.t > (this.banner.small ? 2.6 : 4)) this.banner = null; }
    for (let i = this.bubbles.length - 1; i >= 0; i--) { this.bubbles[i].t += dt; if (this.bubbles[i].t > this.bubbles[i].life) this.bubbles.splice(i, 1); }
    G.FX.update(dt);
    if (G.UI.active) { G.UI.update(dt, inp); return; }
    if (G.Dialog.active) { G.Dialog.update(dt, inp); G.EV.update(dt, inp); return; }
    const def = this.room.def;
    if (def.update) def.update(G.EV.api, dt);
    G.Chase.update(dt);
    if (G.UI.active) return;
    if (G.EV.busy) { G.EV.update(dt, inp); this.p.moving = false; return; }
    if (inp.menu) { G.UI.openMenu(); return; }
    // movement
    const p = this.p;
    if (p.hidden) return;
    let mx = inp.mx, my = inp.my;
    if (mx && my) my = 0; // four directions, like the classics
    const ox = p.x, oy = p.y;
    if (mx || my) {
      p.dir = mx > 0 ? 'right' : mx < 0 ? 'left' : my > 0 ? 'down' : 'up';
      G.movePlayer(this.room, p, mx, my, dt, G.PLAYER.speed * (inp.run && G.flag('canRun') !== false ? G.PLAYER.run : 1));
    }
    p.moving = Math.abs(p.x - ox) + Math.abs(p.y - oy) > 0.01;
    if (p.moving) {
      p.walkT += dt * (inp.run ? 1.5 : 1);
      this.stepT -= dt;
      if (this.stepT <= 0) { this.stepT = inp.run ? 0.2 : 0.3; G.Audio.sfx('step', this.room.def.floorSound); }
    } else p.walkT = 0;
    // bumping into doors / pushables
    if ((mx || my) && !p.moving) {
      this.bumpT += dt;
      const [x, y] = this.probe();
      const o = this.objectAt(x, y, (o) => o.def.door || o.def.push || o.def.bump);
      if (o && this.bumpT > (o.def.push ? 0.18 : 0.08)) {
        this.bumpT = 0;
        if (o.def.push) this.push(o, mx, my);
        else if (o.def.door && !o.def.door.noBump) this.activate(o);
        else if (o.def.bump) G.EV.run(o.def.bump, o);
      }
    } else this.bumpT = 0;
    // step-on triggers
    const now = this.touchedNow();
    for (const id of now) {
      if (this.touching.has(id)) continue;
      const o = this.room.obj(id);
      if (o.def.door && o.def.door.walk) this.activate(o);
      else G.EV.run(o.def.touch, o);
    }
    this.touching = new Set(now);
    if (inp.ok) this.interact();
  };
  Explore.prototype.push = function (o, mx, my) {
    const nx = o.x + Math.sign(mx), ny = o.y + Math.sign(my);
    const room = this.room;
    for (let r = ny; r < ny + o.h; r++) for (let c = nx; c < nx + o.w; c++) {
      const self = r >= o.y && r < o.y + o.h && c >= o.x && c < o.x + o.w;
      if (!self && room.isSolid(c, r)) { G.Audio.sfx('bump'); return; }
      if (o.def.pushArea && !o.def.pushArea(c, r)) { G.Audio.sfx('bump'); return; }
    }
    const steps = [[Math.sign(mx), Math.sign(my)]];
    G.Audio.sfx('push');
    G.EV.run(function* (E) {
      yield* E.move(o.id, steps, 40);
      if (o.def.onPush) yield* o.def.onPush(E, o);
    });
  };

  // ---------------- game over / ending ----------------
  Explore.prototype.gameOver = function (cause, opts) {
    G.EV.clear();
    G.Dialog.lines = null;
    G.Chase.active = null;
    G.S.deaths++;
    G.UI.openGameOver(cause, opts);
  };
  Explore.prototype.ending = function (id, done) {
    G.UI.openEnding(id, done);
  };

  // ---------------- drawing ----------------
  Explore.prototype.camera = function () {
    const room = this.room, p = this.p;
    let cx, cy;
    if (room.W <= W) cx = -Math.floor((W - room.W) / 2);
    else cx = G.clamp(Math.round(p.x - W / 2), 0, room.W - W);
    if (room.H <= H) cy = -Math.floor((H - room.H) / 2);
    else cy = G.clamp(Math.round(p.y - 8 - H / 2), 0, room.H - H);
    return [cx, cy];
  };
  Explore.prototype.draw = function (ctx) {
    const room = this.room, p = this.p, def = room.def;
    const [cx, cy] = this.camera();
    const [sx, sy] = G.Shake.offset();
    const ox = -cx + sx, oy = -cy + sy;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(room.canvas, ox, oy);
    const list = [];
    const lights = [];
    for (const o of room.objects) {
      if (!o.visible) continue;
      list.push({ y: o.sortY(), draw: (c, X, Y) => o.draw(c, X, Y, this.t) });
      const L = o.def.light;
      if (L) { const a = o.anchor(); lights.push({ x: a.x + (L.dx || 0) + ox, y: a.y + (L.dy || -8) + oy, r: L.r || 40, col: L.col, glow: L.glow, flicker: L.flicker, i: L.i }); }
    }
    for (const L of def.lights || []) lights.push({ x: L.x * TS + 8 + ox, y: L.y * TS + 8 + oy, r: L.r || 48, col: L.col, glow: L.glow, flicker: L.flicker, i: L.i });
    if (!p.hidden) list.push({ y: p.y, draw: (c, X, Y) => {
      c.fillStyle = 'rgba(8,4,14,0.35)';
      c.fillRect(Math.round(X + p.x - 5), Math.round(Y + p.y - 2), 10, 2);
      G.drawChar(c, G.S.flags['@playerChar'] || G.PLAYER_CHAR || 'kid', X + p.x, Y + p.y, p.dir, p.moving ? p.walkT : null);
    } });
    G.Chase.draw(ctx, list);
    list.sort((a, b) => a.y - b.y);
    for (const it of list) it.draw(ctx, ox, oy);
    G.FX.draw(ctx, ox, oy, 0);
    // lighting
    const dark = this.darkOverride !== null && this.darkOverride !== undefined ? this.darkOverride : def.dark || 0;
    if (dark > 0) {
      lights.push({ x: p.x + ox, y: p.y - 10 + oy, r: def.light || 58, i: 1 });
      G.Light.draw(ctx, dark, def.tintDark || '#05030a', lights, this.t);
    } else if (lights.length) {
      ctx.globalCompositeOperation = 'lighter';
      for (const l of lights) if (l.col) { const s = G.Light.stamp(l.r * 0.6, l.col); ctx.globalAlpha = (l.glow || 0.2) * 0.6; ctx.drawImage(s, Math.round(l.x - s.width / 2), Math.round(l.y - s.height / 2)); }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    G.FX.draw(ctx, ox, oy, 1);
    if (def.overlay) { ctx.fillStyle = def.overlay; ctx.fillRect(0, 0, W, H); }
    if (this.tint) { ctx.globalAlpha = this.tint.alpha; ctx.fillStyle = this.tint.color; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    // chase: red pulse at the edges
    if (G.Chase.active) { const k = 0.25 + Math.sin(this.t * 7) * 0.08; ctx.globalAlpha = k; G.vignetteRed(ctx); ctx.globalAlpha = 1; }
    G.vignette(ctx, def.vignette === undefined ? 0.55 : def.vignette);
    G.grain(ctx, this.t);
    // bubbles
    for (const b of this.bubbles) {
      let x, y;
      if (b.id === 'player') { x = p.x; y = p.y - 26; }
      else { const o = room.obj(b.id); if (!o) continue; const a = o.anchor(); x = a.x; y = a.y - (o.char ? 26 : o.h * TS + 6); }
      const f = G.MOB_BUBBLES && G.MOB_BUBBLES[b.kind];
      if (f) G.drawFrame(ctx, f, ox + x + 6, oy + y - Math.round((1 - Math.min(1, b.t * 8)) * 4));
    }
    if (this.flash) { ctx.globalAlpha = 1 - this.flash.age / this.flash.t; ctx.fillStyle = this.flash.color; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    // banners
    if (this.banner) {
      const b = this.banner;
      const a = Math.min(1, b.t * 3, ((b.small ? 2.6 : 4) - b.t) * 2);
      ctx.globalAlpha = Math.max(0, a);
      if (b.small) {
        G.text(ctx, b.text, 10, 10, { color: '#d8d0e0', shadow: '#000' });
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, H / 2 - 22, W, 36);
        G.text(ctx, b.text, W / 2, H / 2 - 14, { align: 'center', scale: 2, color: '#e8e0f0', shadow: '#3a0a18' });
      }
      ctx.globalAlpha = 1;
    }
    if (p.hidden) G.text(ctx, '(hiding... press Z to come out)', W / 2, H - 14, { align: 'center', color: '#8a8298', shadow: '#000' });
    if (this.fade > 0) { ctx.globalAlpha = this.fade; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    G.Dialog.draw(ctx);
    G.UI.draw(ctx);
  };
})(window.G);
