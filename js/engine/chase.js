// The chaser: a monster that hunts the player through rooms.
// cfg = {
//   char: 'monster',            character sprite set
//   speed: 58,                  px/s (player walks 62)
//   at: [x, y] | 'behind',      spawn tile in the current room
//   delay: 0.6,                 seconds before it starts moving
//   follow: true,               follows through doors
//   followDelay: 1.6,           seconds after you leave before it appears
//   safe: ['mapId', ...],       rooms it will not follow into
//   duration: null,             seconds until it gives up (null = until lost)
//   loseAfterHide: 3.5,         seconds hidden before it gives up
//   cause: 'monster',           game over cause id
//   onEnd: function* (E) {}     runs when the chase ends normally
// }
(function (G) {
  'use strict';
  const TS = G.TS;
  const Ch = (G.Chase = {
    active: null,
    start(cfg) {
      const ex = G.EX, room = ex.room, p = ex.p;
      let x, y;
      if (Array.isArray(cfg.at)) { x = cfg.at[0] * TS + 8; y = cfg.at[1] * TS + 14; }
      else {
        // behind the player: the farthest walkable tile within 5 tiles, opposite to facing
        const back = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[p.dir] || [0, 1];
        let c = Math.floor(p.x / TS), r = Math.floor((p.y - 2) / TS);
        for (let i = 0; i < 4 && !room.isSolid(c + back[0], r + back[1]); i++) { c += back[0]; r += back[1]; }
        x = c * TS + 8; y = r * TS + 14;
      }
      this.active = { cfg: cfg, map: G.S.map, x: x, y: y, dir: 'down', t: 0, delay: cfg.delay === undefined ? 0.6 : cfg.delay, path: null, repath: 0, state: 'hunt', hiddenT: 0, walkT: 0, away: null, searchT: 0 };
      G.Audio.music(cfg.music || 'chase');
      G.Audio.sfx('sting');
    },
    stop(silent) {
      const a = this.active;
      this.active = null;
      if (!silent) G.Audio.music(G.EX.room.def.music || null);
      if (a && a.cfg.onEnd) G.EV.run(a.cfg.onEnd);
    },
    // called by the explore scene when the player changes rooms
    onTransfer(fromMap, toMap, arrive) {
      const a = this.active;
      if (!a) return;
      const cfg = a.cfg;
      if (!cfg.follow || (cfg.safe && cfg.safe.includes(toMap))) {
        if (a.map === fromMap) { this.stop(); }
        return;
      }
      a.away = { map: toMap, x: arrive.x, y: arrive.y, t: cfg.followDelay === undefined ? 1.6 : cfg.followDelay };
      a.map = null;
    },
    update(dt) {
      const a = this.active;
      if (!a) return;
      const ex = G.EX, p = ex.p, cfg = a.cfg;
      a.t += dt;
      if (cfg.duration && a.t > cfg.duration) { this.vanish(); return; }
      // in transit to the player's room
      if (a.away) {
        a.away.t -= dt;
        if (a.away.t <= 0 && a.away.map === G.S.map) {
          a.map = G.S.map; a.x = a.away.x; a.y = a.away.y; a.away = null; a.delay = 0.15;
          G.Audio.sfx('door');
        } else if (a.away.map !== G.S.map) a.away.map = G.S.map; // player moved on again
        return;
      }
      if (a.map !== G.S.map) return;
      if (a.delay > 0) { a.delay -= dt; return; }
      const room = ex.room;
      // hiding
      if (p.hidden) {
        a.hiddenT += dt;
        a.state = 'search';
        a.searchT += dt;
        // wander a little near where it lost you
        if (!a.path || a.path.length === 0) {
          const c = Math.floor(a.x / TS), r = Math.floor((a.y - 2) / TS);
          const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !room.isSolid(c + dx, r + dy));
          if (opts.length) { const o = opts[Math.floor(G.hash(Math.floor(a.t * 3), c, r) * opts.length)]; a.path = [[c + o[0], r + o[1]]]; }
        }
        if (a.hiddenT > (cfg.loseAfterHide || 3.5)) { this.vanish(true); return; }
      } else {
        a.state = 'hunt';
        a.hiddenT = 0;
        a.repath -= dt;
        if (a.repath <= 0) {
          a.repath = 0.2;
          const c = Math.floor(a.x / TS), r = Math.floor((a.y - 2) / TS);
          const pc = Math.floor(p.x / TS), pr = Math.floor((p.y - 2) / TS);
          a.path = G.findPath(room, c, r, pc, pr) || [];
        }
      }
      // follow the path
      const sp = (cfg.speed || 58) * (a.state === 'search' ? 0.5 : 1);
      if (a.path && a.path.length) {
        const [tc, tr] = a.path[0];
        const tx = tc * TS + 8, ty = tr * TS + 14;
        const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
        if (d < 1) { a.path.shift(); }
        else {
          const s = Math.min(d, sp * dt);
          a.x += (dx / d) * s; a.y += (dy / d) * s;
          a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
          a.walkT += dt;
        }
      } else if (!p.hidden) {
        // same tile: close in directly
        const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy);
        if (d > 0.5) { a.x += (dx / d) * Math.min(d, sp * dt); a.y += (dy / d) * Math.min(d, sp * dt); }
      }
      // footsteps
      a.stepT = (a.stepT || 0) - dt;
      if (a.stepT <= 0) { a.stepT = 0.32; G.Audio.sfx('thud', 0.6); }
      // caught?
      if (!p.hidden && Math.abs(p.x - a.x) < 9 && Math.abs(p.y - a.y) < 8) {
        const cause = cfg.cause || 'monster';
        this.active = null;
        ex.gameOver(cause, { scare: cfg.scare || cfg.char });
      }
    },
    vanish(lost) {
      const a = this.active;
      if (!a) return;
      if (lost) G.Audio.sfx('steps_away');
      this.stop();
    },
    // called when the player tries to hide: caught if the monster is close and in the same room
    seesHiding() {
      const a = this.active;
      if (!a || a.map !== G.S.map || a.away) return false;
      const p = G.EX.p;
      return Math.hypot(p.x - a.x, p.y - a.y) < TS * 3.2;
    },
    draw(ctx, list) {
      const a = this.active;
      if (!a || a.map !== G.S.map || a.away) return;
      const cfg = a.cfg;
      list.push({ y: a.y, draw: (c, ox, oy) => {
        c.fillStyle = 'rgba(8,4,14,0.45)';
        c.fillRect(Math.round(ox + a.x - 7), Math.round(oy + a.y - 2), 14, 3);
        G.drawChar(c, cfg.char, ox + a.x, oy + a.y, a.dir, a.walkT);
      } });
    },
  });
})(window.G);
