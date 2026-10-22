// Exploration scene: walking around rooms, examining things, doors, hiding,
// pushing furniture, room transitions, camera, lighting and effects.
(function (G) {
  'use strict';
  const TS = G.TS, W = G.W, H = G.H;

  function Explore() {
    G.EX = this;
    this.room = null;
    this.p = { x: 0, y: 0, dir: 'down', moving: false, walkT: null, hidden: false, hideObj: null };
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
    this.trail = [];
    this.folPos = null;
    this.folDir = 'down';
    this.fol = { walkT: null, foot: false };
  }
  G.Explore = Explore;
  const FOL_DIST = 16; // the companion walks one tile behind, measured along the player's trail

  // map fields that may be values or functions E => value (dark, music, ambience, lights, overlay,
  // light, tint, floorSound, follower)
  Explore.prototype.mapVal = function (k) {
    const v = this.room.def[k];
    if (typeof v !== 'function') return v;
    try { return v(G.EV.api); } catch (e) { G.contentError(this.room.id + '.' + k, e); return undefined; }
  };
  Explore.prototype.mapDark = function () { return this.mapVal('dark') || 0; };

  // ---------------- room changes ----------------
  Explore.prototype.load = function (map, x, y, dir) {
    G.S.map = map;
    this.room = new G.Room(map);
    this.p.x = x * TS + 8;
    this.p.y = y * TS + 14;
    if (dir) this.p.dir = dir;
    this.p.hidden = false;
    this.p.hideObj = null;
    this.p.moving = false;
    this.p.walkT = null;
    // spawned actors are gone with the old room, so the companion is back on the trail
    delete G.S.flags['@followerOut'];
    // the companion starts one tile behind the player (or on the player if that tile is solid)
    const bv = G.DIRV[this.p.dir] || [0, 1];
    const bc = x - bv[0], br = y - bv[1];
    this.resetTrail(this.room.isSolid(bc, br) ? [this.p.x, this.p.y, this.p.dir] : [bc * TS + 8, br * TS + 14, this.p.dir]);
    this.touching = new Set(this.touchedNow());
    this.darkOverride = null;
    this.tint = null;
    this.bubbles = [];
    const def = this.room.def;
    G.Audio.music(G.Chase.active ? G.Chase.musicName() : this.mapVal('music') || null);
    G.Audio.ambience(this.mapVal('ambience') || null);
    if (def.location) this.banner = { text: def.location, t: 0, small: true };
  };
  // the trail the companion follows: she is drawn FOL_DIST px back along it
  Explore.prototype.resetTrail = function (from) {
    const p = this.p;
    this.folDir = from[2] || p.dir;
    this.trail = [[from[0], from[1], this.folDir], [p.x, p.y, p.dir]];
    this.fol = { walkT: null, foot: this.fol ? this.fol.foot : false };
    this.folPos = this.followerPos();
  };
  Explore.prototype.followerPos = function () {
    const tr = this.trail, p = this.p;
    let need = FOL_DIST, x = p.x, y = p.y;
    for (let i = tr.length - 1; i >= 0; i--) {
      const d = Math.hypot(tr[i][0] - x, tr[i][1] - y);
      if (d >= need && d > 0) { const k = need / d; return [x + (tr[i][0] - x) * k, y + (tr[i][1] - y) * k, this.folDir]; }
      need -= d; x = tr[i][0]; y = tr[i][1];
    }
    return [x, y, this.folDir];
  };
  // every frame: move the companion along the trail; she faces where she walks and her walk
  // cycle runs by the distance she covered (so she never skates)
  Explore.prototype.updateFollower = function () {
    if (!G.S.flags.follower || !this.trail.length) { this.fol.walkT = null; return; }
    const np = this.followerPos(), op = this.folPos || np;
    const dx = np[0] - op[0], dy = np[1] - op[1], d = Math.hypot(dx, dy);
    if (d > 0.01 && d < 8) this.folDir = G.dirOf(dx, dy);
    G.walkClock(this.fol, d < 8 ? d : 0);
    this.folPos = [np[0], np[1], this.folDir];
  };
  // the player moved dist px this frame (by input or E.walk): walk cycle, footsteps, trail
  Explore.prototype.stepPlayer = function (dist) {
    const p = this.p;
    p.moving = dist > 0.01;
    if (!p.moving) { p.walkT = null; return; }
    this.trail.push([p.x, p.y, p.dir]);
    if (this.trail.length > 240) this.trail.splice(0, this.trail.length - 240);
    if (G.walkClock(p, dist)) G.Audio.sfx('step', this.mapVal('floorSound'));
  };
  Explore.prototype.start = function (map, x, y, dir) {
    [x, y, dir] = G.resolveEntry(map, x, y, dir);
    this.load(map, x, y, dir);
    this.fade = 1;
    const self = this;
    G.EV.run(function* () {
      yield* self.fadeTo(0, 0.6);
      // retry / load / continue: a registry chase that was on (flag @chase) starts again now
      const id = G.S.flags['@chase'];
      if (id && !G.Chase.active) G.Chase.resume(id);
    });
    this.afterEnter();
  };
  // after every room entry: retry point, then the room's first-visit and every-visit events.
  // opts.checkpoint === false skips the retry point (scripted sequences).
  Explore.prototype.afterEnter = function (opts) {
    opts = opts || {};
    const def = this.room.def, id = this.room.id;
    G.S.flags['@seen:' + id] = true;
    const ch = G.S.flags['@chase'];
    const hunted = !!G.Chase.active || !!(ch && G.CHASES[ch]);
    // taken BEFORE the first-visit flag, so a retry replays the room's 'first' event
    if (!G.Chase.active && opts.checkpoint !== false) this.checkpoint();
    // 'first' never runs during a chase: it waits for the next calm entry
    if (!hunted && !G.S.flags['@visited:' + id]) {
      G.S.flags['@visited:' + id] = true;
      if (def.first) G.EV.run(def.first);
    }
    if (def.enter) G.EV.run(def.enter);
  };
  // named entry points: G.MAPS[id].entries = {name: [x, y, dir]}; doors and E.goto may give a
  // name instead of coordinates, so rooms written by different authors connect by name
  G.resolveEntry = function (map, x, y, dir) {
    if (typeof x !== 'string') return [x, y, dir];
    const def = G.MAPS[map];
    const e = def && def.entries && def.entries[x];
    if (!e) throw new Error('Unknown entry "' + x + '" in map ' + map);
    return [e[0], e[1], e[2] || dir];
  };
  Explore.prototype.transfer = function* (map, x, y, dir, opts) {
    opts = opts || {};
    [x, y, dir] = G.resolveEntry(map, x, y, dir);
    const from = G.S.map;
    if (opts.sfx !== null) G.Audio.sfx(opts.sfx || 'door');
    yield* this.fadeTo(1, opts.fade === undefined ? 0.22 : opts.fade);
    this.load(map, x, y, dir);
    G.Chase.onTransfer(from, map, { x: this.p.x, y: this.p.y });
    this.afterEnter({ checkpoint: opts.checkpoint });
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
    if (def.text) G.EV.run(function* (E) { yield* E.say(...G.evalText(def.text, o)); });
  };
  Explore.prototype.useDoor = function* (E, o) {
    const def = o.def, d = def.door;
    // during a chase, a door with a chain latch can be latched instead of used
    const ch = G.Chase.active;
    if (ch && ch.away && def.latch && ch.away.from === d.to) {
      const k = o.key('latched');
      if (!G.S.flags[k]) {
        const i = yield* E.ask('@ Footsteps on the other side. Keys jingling.', ['Latch the chain', 'Go through']);
        if (i === 0) {
          G.S.flags[k] = true;
          G.Chase.latch(def.latchTime || 5);
          yield* E.say('@ The chain rattles into place.');
          return;
        }
      }
    }
    const ukey = o.key('unlocked');
    if (def.lock && !G.S.flags[ukey]) {
      let can = false;
      if (typeof def.lock === 'string') can = E.has(def.lock);
      else can = !!def.lock(E);
      if (!can) {
        G.Audio.sfx('locked');
        const lt = G.evalText(def.lockText, o);
        yield* E.say(...(lt.length ? lt : ["@ It's locked."]));
        return;
      }
      if (typeof def.lock === 'string') {
        const it = G.ITEMS[def.lock];
        G.Audio.sfx('unlock');
        const ut = G.evalText(def.unlockText, o);
        yield* E.say(...(ut.length ? ut : ['@ Used the ' + (it ? it.name : def.lock) + '.']));
        if (def.consume) E.take(def.lock);
      } else if (def.unlockText) { G.Audio.sfx('unlock'); yield* E.say(...G.evalText(def.unlockText, o)); }
      G.S.flags[ukey] = true;
    }
    if (def.before) { const r = yield* def.before(E, o); if (r === false) return; }
    yield* E.goto(d.to, d.entry || d.x, d.y, d.dir || this.p.dir, { sfx: def.sfx === undefined ? (def.stairs ? 'stairs' : 'door') : def.sfx });
  };
  Explore.prototype.tryHide = function* (E, o) {
    const q = G.evalText(o.def.hidePrompt, o);
    if (!q.length) q.push('@ Hide inside?');
    if (q.length > 1) yield* E.say(...q.slice(0, -1));
    const ok = yield* E.yesno(q[q.length - 1]);
    if (!ok) return;
    if (G.Chase.seesHiding()) {
      G.Audio.sfx('door');
      yield* E.wait(0.3);
      const cc = G.Chase.active.cfg;
      this.gameOver(cc.cause || 'monster', { scare: cc.scare || cc.char, text: cc.seenText || 'He saw you climb in. Break his line of sight first: change rooms, then hide.' });
      for (;;) yield;
    }
    G.Audio.sfx('closet');
    this.p.hidden = true;
    this.p.hideObj = o;
    this.p.hideAt = G.S.time; // he hears a closet that closed just before he came through the door
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
    this.updateScene(dt, inp);
    this.updateFollower();
  };
  Explore.prototype.updateScene = function (dt, inp) {
    this.t += dt;
    G.S.time += dt;
    if (this.flash) { this.flash.age += dt; if (this.flash.age > this.flash.t) this.flash = null; }
    if (this.banner) { this.banner.t += dt; if (this.banner.t > (this.banner.small ? 2.6 : 4)) this.banner = null; }
    for (let i = this.bubbles.length - 1; i >= 0; i--) { this.bubbles[i].t += dt; if (this.bubbles[i].t > this.bubbles[i].life) this.bubbles.splice(i, 1); }
    G.FX.update(dt);
    if (G.UI.active) { this.p.moving = false; this.p.walkT = null; G.UI.update(dt, inp); return; }
    if (G.Dialog.active) { this.p.moving = false; this.p.walkT = null; G.Dialog.update(dt, inp); G.EV.update(dt, inp); return; }
    const def = this.room.def;
    if (def.update) def.update(G.EV.api, dt);
    // the hunter only moves while the player can (events and door transitions freeze both),
    // except while hiding, or when an event asks for it (E.worldRuns(true))
    if (!G.EV.busy || this.p.hidden || G.EV.worldRuns) {
      G.Chase.update(dt);
      G.Chase.updateWalkers(dt);
    }
    if (G.UI.active) return;
    // an event runs; E.walk moves the player through stepPlayer (which sets moving again)
    if (G.EV.busy) { this.p.moving = false; G.EV.update(dt, inp); if (!this.p.moving) this.p.walkT = null; return; }
    if (inp.menu) { G.UI.openMenu(); return; }
    // movement
    const p = this.p;
    if (p.hidden) { p.moving = false; p.walkT = null; return; }
    let mx = inp.mx, my = inp.my;
    if (mx && my) my = 0; // four directions, like the classics
    const ox = p.x, oy = p.y;
    this.running = false;
    if (mx || my) {
      p.dir = mx > 0 ? 'right' : mx < 0 ? 'left' : my > 0 ? 'down' : 'up';
      // no running while hunted (the classics have no dash; it would beat every chase)
      const danger = !!G.Chase.active || G.Chase.walkers.length > 0;
      let run = inp.run && G.flag('canRun') !== false && !danger;
      if (inp.run && danger && !G.S.flags.toldNoRun) { G.S.flags.toldNoRun = true; this.banner = { text: "Haru's legs are shaking too much to run.", t: 0, small: true }; }
      G.movePlayer(this.room, p, mx, my, dt, G.PLAYER.speed * (run ? G.PLAYER.run : 1));
      this.running = run;
    }
    this.stepPlayer(Math.hypot(p.x - ox, p.y - oy));
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
    G.Chase.walkers = [];
    G.S.deaths++;
    G.UI.openGameOver(cause, opts);
  };
  Explore.prototype.ending = function (id, done) {
    G.UI.openEnding(id, done);
  };

  // rain streaks: over railing tiles only ('rail') or the whole screen ('full')
  Explore.prototype.drawRain = function (ctx, ox, oy, mode) {
    const room = this.room, t = this.t;
    ctx.fillStyle = 'rgba(170,190,220,0.35)';
    const n = mode === 'full' ? 140 : 90;
    for (let i = 0; i < n; i++) {
      const sx = (G.hash(i, 1, 9) * W + t * 40) % W;
      const sy = (G.hash(i, 2, 9) * H + t * (220 + G.hash(i, 3, 9) * 80)) % H;
      if (mode !== 'full') {
        const c = Math.floor((sx - ox) / TS), r = Math.floor((sy - oy) / TS);
        if (room.tileAt(c, r) !== 'R') continue;
      }
      ctx.fillRect(Math.round(sx), Math.round(sy), 1, 4);
    }
  };

  // ---------------- drawing ----------------
  Explore.prototype.followerShown = function () {
    return !!(G.S.flags.follower && !this.p.hidden && !G.S.flags['@followerOut'] && this.folPos && this.mapVal('follower') !== false);
  };
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
    for (const L of this.mapVal('lights') || []) lights.push({ x: L.x * TS + 8 + ox, y: L.y * TS + 8 + oy, r: L.r || 48, col: L.col, glow: L.glow, flicker: L.flicker, i: L.i });
    if (!p.hidden) {
      const pose = G.S.flags['@pose:player'], pa = G.S.flags['@alpha:player'];
      list.push({ y: p.y, draw: (c, X, Y) => {
        c.fillStyle = 'rgba(8,4,14,' + (0.35 * (pa === undefined ? 1 : pa)).toFixed(3) + ')';
        c.fillRect(Math.round(X + p.x - 5), Math.round(Y + p.y - 2), 10, 2);
        if (pose) G.drawSprite(c, pose, X + p.x, Y + p.y, this.t, p.dir === 'right', pa);
        else G.drawChar(c, G.S.flags['@playerChar'] || G.PLAYER_CHAR || 'kid', X + p.x, Y + p.y, p.dir, p.walkT, pa);
      } });
    }
    // companion following the player's trail (G.S.flags.follower = charName); not drawn while she
    // is a real object (E.followerOut) or waits outside (map follower: false)
    const fol = G.S.flags.follower;
    const folShown = this.followerShown();
    if (folShown) {
      const tr = this.folPos, fw = this.fol.walkT;
      list.push({ y: tr[1] - 0.5, draw: (c, X, Y) => {
        c.fillStyle = 'rgba(8,4,14,0.35)';
        c.fillRect(Math.round(X + tr[0] - 5), Math.round(Y + tr[1] - 2), 10, 2);
        G.drawChar(c, fol, X + tr[0], Y + tr[1], tr[2], fw);
      } });
    }
    G.Chase.draw(ctx, list);
    list.sort((a, b) => a.y - b.y);
    for (const it of list) it.draw(ctx, ox, oy);
    G.FX.draw(ctx, ox, oy, 0);
    // lighting
    const dark = this.darkOverride !== null && this.darkOverride !== undefined ? this.darkOverride : this.mapDark();
    if (dark > 0) {
      G.Chase.lights(ox, oy, dark, lights);
      lights.push({ x: p.x + ox, y: p.y - 10 + oy, r: G.S.flags.playerLight || this.mapVal('light') || 58, i: 1, col: G.S.flags.playerLightCol, glow: 0.15, flicker: !!G.S.flags.playerLightCol });
      G.Light.draw(ctx, dark, def.tintDark || '#05030a', lights, this.t);
    } else if (lights.length) {
      ctx.globalCompositeOperation = 'lighter';
      for (const l of lights) if (l.col) { const s = G.Light.stamp(l.r * 0.6, l.col); ctx.globalAlpha = (l.glow || 0.2) * 0.6; ctx.drawImage(s, Math.round(l.x - s.width / 2), Math.round(l.y - s.height / 2)); }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    G.FX.draw(ctx, ox, oy, 1);
    if (def.rain) this.drawRain(ctx, ox, oy, def.rain);
    const ov = this.mapVal('overlay');
    if (ov) { ctx.fillStyle = ov; ctx.fillRect(0, 0, W, H); }
    // map tint (E => ['#5a0008', 0.35] | null), then the event tint (E.tint)
    const mt = this.mapVal('tint');
    if (mt && mt[0]) { ctx.globalAlpha = mt[1] === undefined ? 0.3 : mt[1]; ctx.fillStyle = mt[0]; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    if (this.tint) { ctx.globalAlpha = this.tint.alpha; ctx.fillStyle = this.tint.color; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    // chase: red pulse at the edges
    if (G.Chase.active) { const k = 0.25 + Math.sin(this.t * 7) * 0.08; ctx.globalAlpha = k; G.vignetteRed(ctx); ctx.globalAlpha = 1; }
    G.vignette(ctx, def.vignette === undefined ? 0.55 : def.vignette);
    G.grain(ctx, this.t);
    // bubbles
    for (const b of this.bubbles) {
      let x, y;
      if (b.id === 'player') { x = p.x; y = p.y - 26; }
      else if (b.id === 'follower' && !room.obj('follower')) { if (!folShown) continue; x = this.folPos[0]; y = this.folPos[1] - 18; }
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
