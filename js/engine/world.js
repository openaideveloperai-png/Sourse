// World: game state, map loading, objects, collision.
//
// CONTENT FORMAT (see docs/CONTENT_GUIDE.md):
// G.MAPS[id] = {
//   name, w (auto), h (auto), tiles: [...rows], floor: {'.':'wood', ',':'carpet_red'}, wall: 'green',
//   dark: 0..1, light: playerLightRadius, music, ambience, ceiling: '#hex',
//   objects: [ {id, x, y, w, h, sprite|char, dir, solid, z, alpha, on*, touch*, cond, light, door, lock, hide, push} ],
//   enter*: generator run after every entry,  first*: generator run on first entry,  update(E, dt)
// }
(function (G) {
  'use strict';
  const TS = G.TS;
  G.MAPS = G.MAPS || {};
  G.ITEMS = G.ITEMS || {};
  G.SPEAKERS = G.SPEAKERS || {};

  // ---------------- game state ----------------
  G.newState = function () {
    return { map: null, x: 0, y: 0, dir: 'down', items: [], flags: {}, time: 0, deaths: 0, notes: [], chapter: '', chapterShort: '', ending: null };
  };
  G.S = G.newState();
  G.flag = (k) => G.S.flags[k];
  G.setFlag = (k, v) => { G.S.flags[k] = v === undefined ? true : v; };
  G.hasItem = (id) => G.S.items.includes(id);
  G.snapshot = function () { return JSON.parse(JSON.stringify(G.S)); };
  G.restore = function (snap) { G.S = JSON.parse(JSON.stringify(snap)); };

  // ---------------- runtime map ----------------
  // Room = loaded map instance
  function Room(id) {
    const def = G.MAPS[id];
    if (!def) throw new Error('Unknown map ' + id);
    this.id = id;
    this.def = def;
    this.tiles = def.tiles;
    this.h = def.tiles.length;
    this.w = def.tiles.reduce((m, r) => Math.max(m, r.length), 0);
    this.tiles = def.tiles.map((r) => r.padEnd(this.w, ' '));
    this.W = this.w * TS;
    this.H = this.h * TS;
    this.canvas = G.renderRoom({ w: this.w, h: this.h, tiles: this.tiles, floor: def.floor, wall: def.wall, ceiling: def.ceiling, wallAt: def.wallAt });
    this.objects = (def.objects || []).map((o, i) => new Obj(this, o, i));
    this.solid = new Uint8Array(this.w * this.h);
    this.refresh();
  }
  G.Room = Room;
  Room.prototype.tileAt = function (c, r) { return c < 0 || r < 0 || c >= this.w || r >= this.h ? ' ' : this.tiles[r][c]; };
  Room.prototype.tileSolid = function (c, r) { const ch = this.tileAt(c, r); return ch === '#' || ch === 'W' || ch === ' ' || ch === 'R'; };
  // recompute visibility + solidity after any state change
  Room.prototype.refresh = function () {
    for (const o of this.objects) o.update();
    for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) this.solid[r * this.w + c] = this.tileSolid(c, r) ? 1 : 0;
    for (const o of this.objects) {
      if (!o.visible || !o.solid) continue;
      for (let r = o.y; r < o.y + o.h; r++) for (let c = o.x; c < o.x + o.w; c++) if (c >= 0 && r >= 0 && c < this.w && r < this.h) this.solid[r * this.w + c] = 1;
    }
  };
  Room.prototype.isSolid = function (c, r) { return c < 0 || r < 0 || c >= this.w || r >= this.h ? true : this.solid[r * this.w + c] === 1; };
  // temp actors (E.spawn) win over a map object with the same id
  Room.prototype.obj = function (id) { return this.objects.find((o) => o.id === id && o.temp) || this.objects.find((o) => o.id === id); };
  // runtime actors: exist until despawned or until the room is loaded again
  Room.prototype.spawn = function (def) {
    this.despawn(def.id);
    const o = new Obj(this, def, this.objects.length, true);
    this.objects.push(o);
    this.refresh();
    return o;
  };
  Room.prototype.despawn = function (id) {
    const i = this.objects.findIndex((o) => o.id === id && o.temp);
    if (i < 0) return false;
    this.objects.splice(i, 1);
    this.refresh();
    return true;
  };
  Room.prototype.boxHits = function (l, t, r, b) {
    const c0 = Math.floor(l / TS), c1 = Math.floor((r - 0.001) / TS), r0 = Math.floor(t / TS), r1 = Math.floor((b - 0.001) / TS);
    for (let rr = r0; rr <= r1; rr++) for (let cc = c0; cc <= c1; cc++) if (this.isSolid(cc, rr)) return true;
    return false;
  };

  // ---------------- objects ----------------
  // temp = true: a runtime actor (E.spawn) whose state lives on the object, never in G.S.flags
  function Obj(room, def, i, temp) {
    this.room = room;
    this.def = def;
    this.id = def.id || '_o' + i;
    this.temp = !!temp;
    this.tstate = {};
    this.w = def.w || 1;
    this.h = def.h || 1;
    this.baseX = def.x;
    this.baseY = def.y;
    this.dir = def.dir || 'down';
    this.offX = 0; this.offY = 0; // pixel offset while sliding/walking
    this.walkT = null;
    this.alpha = 1;
    this.update();
  }
  G.Obj = Obj;
  Obj.prototype.key = function (k) { return '@' + k + ':' + this.room.id + ':' + this.id; };
  // per-object state: saved flags for map objects, a plain field bag for temp actors
  Obj.prototype.st = function (k) { return this.temp ? this.tstate[k] : G.S.flags[this.key(k)]; };
  Obj.prototype.setSt = function (k, v) {
    if (this.temp) { if (v === undefined) delete this.tstate[k]; else this.tstate[k] = v; }
    else if (v === undefined) delete G.S.flags[this.key(k)];
    else G.S.flags[this.key(k)] = v;
  };
  Obj.prototype.update = function () {
    const pos = this.st('pos');
    this.x = pos ? pos[0] : this.baseX;
    this.y = pos ? pos[1] : this.baseY;
    const d = this.st('dir');
    if (d) this.dir = d;
    const hidden = this.st('hidden');
    const shown = this.st('shown');
    let vis = true;
    if (this.def.cond) { try { vis = !!this.def.cond(G.EV.api); } catch (e) { G.contentError('cond of ' + this.room.id + ':' + this.id, e); } }
    if (hidden) vis = false;
    if (shown) vis = true;
    this.visible = vis;
    this.solid = this.def.solid === undefined ? !this.def.touch && !this.def.floor : !!this.def.solid;
    if (this.def.char && this.def.solid === undefined) this.solid = true;
    const sp = this.st('sprite');
    this.sprite = sp || (typeof this.def.sprite === 'function' ? this.def.sprite(G.EV.api) : this.def.sprite);
    this.char = this.st('char') || this.def.char;
    this.pose = this.st('pose') || null;
    const al = this.st('alpha');
    this.alpha = al !== undefined ? al : this.def.alpha === undefined ? 1 : this.def.alpha;
  };
  Obj.prototype.setPos = function (x, y) { this.setSt('pos', [x, y]); this.update(); this.room.refresh(); };
  // pixel rect of the footprint
  Obj.prototype.rect = function () { return { x: this.x * TS + this.offX, y: this.y * TS + this.offY, w: this.w * TS, h: this.h * TS }; };
  // anchor for drawing: bottom-center of footprint
  Obj.prototype.anchor = function () { const r = this.rect(); return { x: r.x + r.w / 2, y: r.y + r.h }; };
  Obj.prototype.sortY = function () {
    if (this.def.z === 'floor') return -1e6 + this.y;
    if (this.def.z === 'over') return 1e6;
    if (this.def.z === 'wall') return this.rect().y + this.rect().h - 1e5;
    return this.rect().y + this.rect().h - (this.def.sortOffset || 0);
  };
  Obj.prototype.draw = function (ctx, ox, oy, t) {
    if (!this.visible) return;
    const a = this.anchor();
    if (this.def.draw) { this.def.draw(ctx, ox + a.x, oy + a.y, t, this); return; }
    if (this.alpha <= 0) return;
    if (this.char || this.pose) {
      ctx.fillStyle = 'rgba(8,4,14,' + (0.35 * this.alpha).toFixed(3) + ')';
      ctx.fillRect(Math.round(ox + a.x - 5), Math.round(oy + a.y - 2), 10, 2);
      if (this.pose) G.drawSprite(ctx, this.pose, ox + a.x, oy + a.y - 1, t + (this.def.phase || 0), this.dir === 'right', this.alpha);
      else G.drawChar(ctx, this.char, ox + a.x, oy + a.y - 1, this.dir, this.walkT, this.alpha);
      return;
    }
    if (this.sprite) G.drawSprite(ctx, this.sprite, ox + a.x, oy + a.y, t + (this.def.phase || 0), this.def.flip, this.alpha);
  };

  // content functions (cond, dynamic map fields) must not take the game down: log once and go on
  const reported = {};
  G.contentError = function (where, e) {
    if (reported[where]) return;
    reported[where] = true;
    console.error('content error in ' + where + ':', e);
  };

  // ---------------- walk cycle ----------------
  // Every walker (player, follower, NPCs, chaser) advances its walk clock by the DISTANCE it moved,
  // so the legs match the ground at any speed and never skate. 1.0 of walkT = G.WALK_STRIDE px:
  // at the player's walking speed that is 8 animation frames per second, one step per tile.
  // Coming from a standstill the first frame is already a step (feet alternate between starts).
  // walkT === null means standing. Returns true on a footfall (for step sounds).
  G.WALK_STRIDE = 62;
  G.walkClock = function (s, dist) {
    if (!(dist > 0.01)) { s.walkT = null; return false; }
    let fresh = false;
    if (s.walkT === null || s.walkT === undefined) { s.foot = !s.foot; s.walkT = s.foot ? 0.125 : 0.375; fresh = true; }
    const before = Math.floor(s.walkT * 8);
    s.walkT += dist / G.WALK_STRIDE;
    const after = Math.floor(s.walkT * 8);
    return fresh || (after !== before && after % 2 === 1);
  };
  const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  G.DIRV = DIRV;
  G.dirOf = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');

  // The free floor tile where you stand to use object o (a door, a wardrobe): its own tile for
  // walk-on objects, else the free tile below it, else beside it, else above it. With a start tile,
  // the reachable candidate with the shortest path wins within each group. null if none.
  G.frontTile = function (room, o, fromC, fromR) {
    const groups = [[], [], [], []];
    if (!o.solid || (o.def.door && o.def.door.walk)) for (let r = o.y; r < o.y + o.h; r++) for (let c = o.x; c < o.x + o.w; c++) groups[0].push([c, r]);
    for (let c = o.x; c < o.x + o.w; c++) groups[1].push([c, o.y + o.h]);
    for (let r = o.y + o.h - 1; r >= o.y; r--) { groups[2].push([o.x - 1, r]); groups[2].push([o.x + o.w, r]); }
    for (let c = o.x; c < o.x + o.w; c++) groups[3].push([c, o.y - 1]);
    const free = ([c, r]) => !room.isSolid(c, r) || (groups[0].length && c >= o.x && c < o.x + o.w && r >= o.y && r < o.y + o.h && !room.tileSolid(c, r));
    for (const g of groups) {
      const f = g.filter(free);
      if (!f.length) continue;
      if (fromC === undefined) return f[0];
      let best = null, bl = 1e9;
      for (const [c, r] of f) {
        const pa = c === fromC && r === fromR ? [] : G.findPath(room, fromC, fromR, c, r);
        if (pa && pa.length < bl) { bl = pa.length; best = [c, r]; }
      }
      if (best) return best;
    }
    return null;
  };

  // ---------------- player ----------------
  const PL = (G.PLAYER = { speed: 62, run: 1.55, wl: -4, wr: 4, wt: -5, wb: 0 });
  G.movePlayer = function (room, p, mx, my, dt, speed) {
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    const v = (speed || PL.speed) * dt;
    const hit = (x, y) => room.boxHits(x + PL.wl, y + PL.wt, x + PL.wr, y + PL.wb);
    const NUDGE = 5;
    let nx = p.x + mx * v;
    if (mx !== 0 && hit(nx, p.y)) {
      if (my === 0)
        outer: for (let d = 1; d <= NUDGE; d++)
          for (const s of [-1, 1]) if (!hit(p.x, p.y + s * d) && !hit(p.x + mx * Math.max(1, d), p.y + s * d)) { p.y += s * Math.min(d, v); break outer; }
      nx = mx > 0 ? Math.floor((nx + PL.wr) / TS) * TS - PL.wr : Math.floor((nx + PL.wl) / TS + 1) * TS - PL.wl;
      if (hit(nx, p.y)) nx = p.x;
    }
    p.x = nx;
    let ny = p.y + my * v;
    if (my !== 0 && hit(p.x, ny)) {
      if (mx === 0)
        outer2: for (let d = 1; d <= NUDGE; d++)
          for (const s of [-1, 1]) if (!hit(p.x + s * d, p.y) && !hit(p.x + s * d, p.y + my * Math.max(1, d))) { p.x += s * Math.min(d, v); break outer2; }
      ny = my > 0 ? Math.floor((ny + PL.wb) / TS) * TS - PL.wb : Math.floor((ny + PL.wt) / TS + 1) * TS - PL.wt;
      if (hit(p.x, ny)) ny = p.y;
    }
    p.y = ny;
  };

  // ---------------- pathfinding (BFS on tiles) ----------------
  G.findPath = function (room, sc, sr, tc, tr, extraBlock) {
    const W = room.w, H = room.h;
    if (sc === tc && sr === tr) return [];
    const prev = new Int32Array(W * H).fill(-1);
    const start = sr * W + sc, goal = tr * W + tc;
    const q = [start];
    prev[start] = start;
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (q.length) {
      const k = q.shift();
      if (k === goal) break;
      const c = k % W, r = (k / W) | 0;
      for (const [dx, dy] of nb) {
        const c2 = c + dx, r2 = r + dy;
        if (c2 < 0 || r2 < 0 || c2 >= W || r2 >= H) continue;
        const k2 = r2 * W + c2;
        if (prev[k2] !== -1) continue;
        if (room.isSolid(c2, r2) && k2 !== goal) continue;
        if (extraBlock && extraBlock(c2, r2) && k2 !== goal) continue;
        prev[k2] = k;
        q.push(k2);
      }
    }
    if (prev[goal] === -1) return null;
    const path = [];
    let k = goal;
    while (k !== start) { path.push([k % W, (k / W) | 0]); k = prev[k]; }
    return path.reverse();
  };
})(window.G);
